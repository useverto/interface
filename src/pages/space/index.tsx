import {
  Button,
  Card,
  Page,
  Spacer,
  useModal,
  useTheme,
  useToasts,
  Loading,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { cardAnimation } from "../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/router";
import { Art, randomEmoji, TokenType } from "../../utils/user";
import { arPrice, CACHE_URL } from "../../utils/arweave";
import { UserInterface } from "@verto/js/dist/faces";
import { useSelector } from "react-redux";
import { RootState } from "../../store/reducers";
import useSWR from "swr";
import axios from "axios";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../components/Metas";
import ListingModal from "../../components/ListingModal";
import useInfiniteScroll from "../../utils/infinite_scroll";
import styles from "../../styles/views/space.module.sass";

const client = new Verto();

const Space = (props: { tokens: any[]; featured: any[]; arts: any[] }) => {
  const { data: tokens } = useSWR(
    "getTokens",
    async () => {
      const { data } = await axios.get(`${CACHE_URL}/site/communities/top`);
      return data;
    },
    {
      initialData: props.tokens,
    }
  );
  const { data: featured } = useSWR(
    "getFeatured",
    async () => {
      const { data } = await axios.get(`${CACHE_URL}/site/communities/random`);
      return data;
    },
    {
      initialData: props.featured,
    }
  );
  const { data: arts } = useSWR(
    "getArts",
    async () => {
      const { data } = await axios.get(`${CACHE_URL}/site/artworks/random`);
      return data.map((val) => ({
        ...val,
        owner: {
          ...val.owner,
          image: val.owner.image
            ? `https://arweave.net/${val.owner.image}`
            : randomEmoji(),
        },
      }));
    },
    {
      initialData: props.arts,
    }
  );

  const [prices, setPrices] = useState<{ [id: string]: number }>({});
  const [history, setHistory] = useState<{
    [id: string]: { [date: string]: number };
  }>({});
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);
  const [currentTokenData, setCurrentTokenData] = useState(featured[0]);
  const router = useRouter();
  const theme = useTheme();
  const listModal = useModal();

  useEffect(() => {
    const timeout = setTimeout(() => {
      // @ts-ignore
      setCurrentPage((val) => {
        if (val === 4) return 1;
        else return val + 1;
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [currentPage]);

  useEffect(() => {
    setCurrentTokenData(featured[currentPage - 1]);
  }, [currentPage]);

  useEffect(() => {
    (async () => {
      const arweavePrice = await arPrice();

      for (const { id } of [...tokens, ...featured, ...arts]) {
        const res = await client.getPrice(id);

        if (res.price)
          setPrices((val) => ({
            ...val,
            [id]: (res.price * arweavePrice).toFixed(2),
          }));
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      for (const { id } of featured) {
        const res = await client.getPriceHistory(id);

        if (Object.keys(res).length) {
          setHistory((val) => ({
            ...val,
            [id]: res,
          }));
        }
      }
    })();
  }, []);

  // preload logos of featured items
  useEffect(() => {
    for (const psc of featured) {
      const logo = new Image();
      logo.src = `https://arweave.net/${psc.logo}`;
    }
  }, []);

  const [userData, setUserData] = useState<UserInterface>();
  const address = useSelector((state: RootState) => state.addressReducer);
  const { setToast } = useToasts();

  useEffect(() => {
    (async () => {
      const user = (await client.getUser(address)) ?? null;
      setUserData(user);
    })();
  }, []);

  // all tokens
  const {
    loading: loadingAllTokens,
    data: allTokens,
  } = useInfiniteScroll<UnifiedTokenInterface>(loadMore);

  async function loadMore() {
    const items: UnifiedTokenInterface[] = [];
    const { data } = await axios.get(
      `${CACHE_URL}/site/tokens/${allTokens.length}`
    );

    for (const token of data) {
      if ([...tokens, ...items, ...allTokens].find(({ id }) => id === token.id))
        continue;

      const price = (await arPrice()) * (await client.getPrice(token.id)).price;

      if (!token.owner.image) token.owner.image = randomEmoji();
      else token.owner.image = `https://arweave.net/${token.owner.image}`;

      items.push({
        ...token,
        price,
      });
    }

    return items;
  }

  return (
    <Page>
      <Head>
        <title>Verto - Space</title>
        <Metas title="Space" />
      </Head>
      <Spacer y={3} />
      <div
        className={
          styles.Featured + " " + (theme === "Dark" ? styles.DarkFeatured : "")
        }
      >
        <AnimatePresence>
          <motion.div
            className={styles.FeaturedItem}
            key={currentPage}
            initial={{ x: 1000, opacity: 0, translateY: "-50%" }}
            animate={{ x: 0, opacity: 1, translateY: "-50%" }}
            exit={{ x: -1000, opacity: 0, translateY: "-50%" }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            onClick={() => router.push(`/space/${currentTokenData.id}`)}
          >
            <div className={styles.TokenInfo}>
              <img
                src={`https://arweave.net/${currentTokenData.logo}`}
                alt="token-logo"
                draggable={false}
              />
              <div>
                <h1>{currentTokenData.name}</h1>
                <h2>{currentTokenData.ticker}</h2>
                <p>
                  {currentTokenData.description?.slice(0, 70)}
                  {currentTokenData.description?.length > 70 && "..."}
                </p>
              </div>
            </div>
            <div className={styles.PriceData}>
              {(prices[currentTokenData.id] && (
                <h2>${prices[currentTokenData.id].toLocaleString()}</h2>
              )) || <h2>$--</h2>}
              <div className={styles.GraphData}>
                {history[currentTokenData.id] && (
                  <Line
                    data={{
                      labels: Object.keys(
                        history[currentTokenData.id]
                      ).reverse(),
                      datasets: [
                        {
                          data: Object.values(
                            history[currentTokenData.id]
                          ).reverse(),
                          ...GraphDataConfig,
                          borderColor: "#ffffff",
                        },
                      ],
                    }}
                    options={GraphOptions({
                      theme,
                      tooltipText: ({ value }) =>
                        `${Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })} AR`,
                    })}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className={styles.Paginator}>
          {new Array(4).fill("_").map((_, i) => (
            <span
              className={currentPage === i + 1 ? styles.ActivePage : ""}
              // @ts-ignore
              onClick={() => setCurrentPage(i + 1)}
              key={i}
            />
          ))}
        </div>
      </div>
      <Spacer y={4} />
      <h1 className="Title">Art {"&"} Collectibles</h1>
      <Spacer y={2} />
      <div className={styles.Cards}>
        {arts.map((art, i) => (
          <motion.div key={i} {...cardAnimation(i)}>
            <Card.Asset
              name={art.name}
              userData={{
                avatar: art.owner.image,
                name: art.owner.name,
                usertag: art.owner.username,
              }}
              // @ts-ignore
              price={prices[art.id] ?? " ??"}
              image={`https://arweave.net/${art.id}`}
              onClick={() => router.push(`/space/${art.id}`)}
            />
          </motion.div>
        ))}
      </div>
      <Spacer y={4} />
      <h1 className="Title">Communities</h1>
      <Spacer y={2} />
      <div className={styles.Cards}>
        {tokens.map((token, i) => (
          <motion.div key={i} {...cardAnimation(i + 4)}>
            <Card.Asset
              name={token.name}
              // @ts-ignore
              price={prices[token.id] ?? " ??"}
              image={`https://arweave.net/${token.logo}`}
              ticker={token.ticker}
              onClick={() => router.push(`/space/${token.id}`)}
            />
          </motion.div>
        ))}
      </div>
      <Spacer y={4} />
      <h1 className="Title">
        All
        <div className="ActionSheet">
          <Button
            small
            onClick={() => {
              if (!userData)
                return setToast({
                  description: "Please setup your Verto ID first",
                  type: "error",
                  duration: 5300,
                });
              listModal.setState(true);
            }}
            style={{ padding: ".35em 1.2em" }}
          >
            Add new
          </Button>
        </div>
      </h1>
      <Spacer y={2} />
      <div className={styles.Cards}>
        {allTokens.map((token, i) => (
          <motion.div key={i} {...cardAnimation(i)} className={styles.Card}>
            {(token.type === "community" && (
              <Card.Asset
                name={token.name}
                // @ts-ignore
                price={token.price ?? " ??"}
                image={`https://arweave.net/${token.logo}`}
                ticker={token.ticker}
                onClick={() => router.push(`/space/${token.id}`)}
              />
            )) || (
              <Card.Asset
                name={token.name}
                userData={{
                  avatar: token.owner.image,
                  name: token.owner.name,
                  usertag: token.owner.username,
                }}
                // @ts-ignore
                price={token.price ?? " ??"}
                image={`https://arweave.net/${token.id}`}
                onClick={() => router.push(`/space/${token.id}`)}
              />
            )}
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {loadingAllTokens && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ease: "easeInOut", duration: 0.22 }}
          >
            <Spacer y={2} />
            <Loading.Spinner style={{ margin: "0 auto" }} />
          </motion.div>
        )}
      </AnimatePresence>
      <ListingModal {...listModal.bindings} />
    </Page>
  );
};

export async function getStaticProps() {
  const { data: tokens } = await axios.get(`${CACHE_URL}/site/communities/top`);
  const { data: featured } = await axios.get(
    `${CACHE_URL}/site/communities/random`
  );

  let { data: arts } = await axios.get(`${CACHE_URL}/site/artworks/random`);
  arts = arts.map((val) => ({
    ...val,
    owner: {
      ...val.owner,
      image: val.owner.image
        ? `https://arweave.net/${val.owner.image}`
        : randomEmoji(),
    },
  }));

  return { props: { tokens, featured, arts }, revalidate: 1 };
}

export default Space;

interface UnifiedTokenInterface extends Art {
  ticker: string;
  logo?: string;
  type: TokenType;
}
