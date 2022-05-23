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
import { cardAnimation, opacityAnimation } from "../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/router";
import {
  arPrice,
  gateway,
  USD_STABLECOIN_ID,
  verto as client,
} from "../../utils/arweave";
import { UserInterface } from "@verto/js/dist/common/faces";
import { useSelector } from "react-redux";
import { RootState } from "../../store/reducers";
import { PlusIcon, SearchIcon } from "@iconicicons/react";
import {
  fetchLatestPrice,
  fetchRandomArtworkWithUser,
  fetchRandomCommunitiesWithMetadata,
  RandomCommunities,
} from "verto-cache-interface";
import { GetServerSidePropsResult } from "next";
import { useMediaPredicate } from "react-media-hook";
import Search, { useSearch } from "../../components/Search";
import axios from "axios";
import Head from "next/head";
import Metas from "../../components/Metas";
import ListingModal from "../../components/ListingModal";
import InfiniteScroll from "react-infinite-scroll-component";
import usePaginatedTokens from "../../utils/paginated_tokens";
import styles from "../../styles/views/space.module.sass";

const Space = ({ featured }: Props) => {
  const [prices, setPrices] = useState<{ [id: string]: number }>({});
  const [history, setHistory] = useState<{
    [id: string]: { [date: string]: number };
  }>({});
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);
  const [currentTokenData, setCurrentTokenData] = useState(featured[0]);
  const router = useRouter();
  const theme = useTheme();
  const listModal = useModal();

  // featured artworks
  const [arts, setArts] =
    useState<Awaited<ReturnType<typeof fetchRandomArtworkWithUser>>>();

  useEffect(() => {
    (async () => {
      let randomArts = await fetchRandomArtworkWithUser(4);

      for (let i = 0; i < randomArts.length; i++)
        if (randomArts[i].owner.image)
          randomArts[i].owner.image = `${gateway()}/${
            randomArts[i].owner.image
          }`;

      setArts(randomArts);
    })();
  }, []);

  // switch featured token page
  useEffect(() => {
    const timeout = setTimeout(() => {
      // @ts-ignore
      setCurrentPage((val) => {
        if (val === 4 || val === featured.length) return 1;
        else return val + 1;
      });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [currentPage]);

  // switch current token data that is displayed
  // for the featured token
  useEffect(() => {
    const next = featured[currentPage - 1];

    if (next) setCurrentTokenData(next);
    else setCurrentPage(1);
  }, [currentPage]);

  // fetch price for freatured tokens & arts
  useEffect(() => {
    (async () => {
      if (!arts || !featured) return;

      for (const { id } of [...featured, ...arts]) {
        let price: number = undefined;

        // load price based on the dominant token
        try {
          const priceData = await fetchLatestPrice([id, USD_STABLECOIN_ID]);

          if (priceData?.dominantToken === id) {
            price = priceData.vwap;
          } else if (priceData?.dominantToken === USD_STABLECOIN_ID) {
            price = 1 / priceData.vwap;
          }
        } catch {}

        if (price)
          setPrices((val) => ({
            ...val,
            [id]: price,
          }));
      }
    })();
  }, [featured, arts]);

  // fetch price history for featured tokens
  useEffect(() => {
    (async () => {
      for (const { id } of featured) {
        // TODO
        /*
        const res = await client.getPriceHistory(id);

        if (Object.keys(res).length) {
          setHistory((val) => ({
            ...val,
            [id]: res,
          }));
        }*/
      }
    })();
  }, []);

  // preload logos of featured items
  const [featuredLogos, setFeaturedLogos] = useState<
    {
      id: string;
      uri: string;
    }[]
  >([]);

  // load Verto ID for the user
  const [userData, setUserData] = useState<UserInterface>();
  const address = useSelector((state: RootState) => state.addressReducer);
  const { setToast } = useToasts();

  useEffect(() => {
    (async () => {
      const user = (await client.user.getUser(address)) ?? null;
      setUserData(user);
    })();
  }, []);

  // search
  const search = useSearch();

  // all tokens (infinite loading)
  const { tokens, hasMore, fetchMore, animationCounter } = usePaginatedTokens();

  // mobile repsonsive display
  const mobile = useMediaPredicate("(max-width: 720px)");

  // mint button style change on scroll
  const [mintButtonStyle, setMintButtonStyle] = useState<"default" | "rounded">(
    "default"
  );

  useEffect(() => {
    if (mobile || !window) return;
    const scrollEventHandler = () =>
      setMintButtonStyle(
        window.scrollY > window.innerHeight ? "rounded" : "default"
      );

    window.addEventListener("scroll", scrollEventHandler);

    return () => window.removeEventListener("scroll", scrollEventHandler);
  }, [mobile]);

  return (
    <Page>
      <Head>
        <title>Verto - Space</title>
        <Metas title="Space" />
      </Head>
      <Spacer y={3} />
      <Button
        className={
          styles.MintButton +
          " " +
          (mintButtonStyle === "rounded" ? styles.RoundStyle : "")
        }
        onClick={() => {
          if (!userData)
            return setToast({
              description: "Please setup your Verto ID first",
              type: "error",
              duration: 5300,
            });
          listModal.setState(true);
        }}
      >
        <PlusIcon />
        <AnimatePresence>
          {!mobile && mintButtonStyle === "default" && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "max-content", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{
                opacity: { duration: 0.1, ease: "easeInOut" },
                width: { duration: 0.23, ease: "easeInOut" },
              }}
            >
              Mint
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
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
            onClick={() => router.push(`/space/${currentTokenData?.id || ""}`)}
          >
            <div className={styles.TokenInfo}>
              <img
                src={
                  `/api/logo/${currentTokenData?.id}` || currentTokenData?.logo
                }
                alt="token-logo"
                draggable={false}
              />
              <div>
                <h1>{currentTokenData.name || ""}</h1>
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
      <h1 className="Title">
        Art {"&"} Collectibles
        {address && (
          <SearchIcon
            className={styles.Search}
            onClick={() => search.setOpen(true)}
          />
        )}
      </h1>
      <Spacer y={2} />
      <div className={styles.Cards}>
        {(arts &&
          arts.map((art, i) => (
            <motion.div key={i} {...cardAnimation(i)} className={styles.Card}>
              {(art.type === "collection" && (
                <Card.Collection
                  name={art.name}
                  userData={{
                    avatar: art.owner.image,
                    name: art.owner.name,
                    usertag: art.owner.username,
                  }}
                  images={art.images.map((txID) => `${gateway()}/${txID}`)}
                  onClick={() => router.push(`/space/${art.id}`)}
                />
              )) || (
                <Card.Asset
                  name={art.name}
                  userData={{
                    avatar: art.owner.image,
                    name: art.owner.name,
                    usertag: art.owner.username,
                  }}
                  // @ts-ignore
                  price={prices[art.id] ?? " ??"}
                  image={`${gateway()}/${art.id}`}
                  onClick={() => router.push(`/space/${art.id}`)}
                />
              )}
            </motion.div>
          ))) || <Loading.Spinner className={styles.Loading} />}
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
            Add
          </Button>
        </div>
      </h1>
      <Spacer y={2} />
      <InfiniteScroll
        className={styles.Cards}
        dataLength={tokens.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={<></>}
        style={{ overflow: "unset !important" }}
      >
        <AnimatePresence>
          {tokens.map((token, i) => (
            <motion.div
              key={i}
              {...cardAnimation(i - animationCounter)}
              className={styles.Card + " " + styles.AllTokensCard}
            >
              {(token.type === "community" && (
                <Card.Asset
                  name={token.name}
                  // @ts-ignore
                  price={token.price ?? " ??"}
                  image={`/api/logo/${token.id}`}
                  ticker={token.ticker}
                  onClick={() => router.push(`/space/${token.id}`)}
                />
              )) ||
                (token.type === "collection" && (
                  <Card.Collection
                    name={token.name}
                    userData={{
                      avatar: token.lister?.image
                        ? `${gateway()}/${token.lister.image}`
                        : undefined,
                      name: token.lister.name,
                      usertag: token.lister.username,
                    }}
                    images={token.items.map((id) => `${gateway()}/${id}`)}
                    onClick={() => router.push(`/space/${token.id}`)}
                  />
                )) || (
                  <Card.Asset
                    name={token.name}
                    userData={{
                      avatar: token.lister?.image
                        ? `${gateway()}/${token.lister.image}`
                        : undefined,
                      name: token.lister.name,
                      usertag: token.lister.username,
                    }}
                    // @ts-ignore
                    price={token.price ?? " ??"}
                    image={`${gateway()}/${token.id}`}
                    onClick={() => router.push(`/space/${token.id}`)}
                  />
                )}
            </motion.div>
          ))}
        </AnimatePresence>
      </InfiniteScroll>
      {/**
       * We need to put the loading outside of the
       * infinite loading component, because we don't
       * want it to be inside the grid layout.
       */}
      <AnimatePresence>
        {hasMore && (
          <motion.div {...opacityAnimation()}>
            <Spacer y={2} />
            <Loading.Spinner style={{ margin: "0 auto" }} />
          </motion.div>
        )}
      </AnimatePresence>
      <ListingModal {...listModal.bindings} />
      <Search {...search} />
    </Page>
  );
};

export async function getServerSideProps(): Promise<
  GetServerSidePropsResult<Props>
> {
  const featured = await fetchRandomCommunitiesWithMetadata();

  return { props: { featured } };
}

export default Space;

interface Props {
  featured: RandomCommunities[];
}
