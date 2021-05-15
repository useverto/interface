import { Card, Page, Spacer, useTheme } from "@verto/ui";
import { useEffect, useState } from "react";
import { cardAnimation } from "../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/router";
import axios from "axios";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../components/Metas";
import styles from "../../styles/views/space.module.sass";

const client = new Verto();

const Space = (props: { tokens: any[]; featured: any[] }) => {
  const [prices, setPrices] = useState<{ [id: string]: number }>({});
  const [history, setHistory] = useState<{
    [id: string]: { [date: string]: number };
  }>({});
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);
  const [currentTokenData, setCurrentTokenData] = useState(props.featured[0]);
  const router = useRouter();
  const theme = useTheme();

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
    setCurrentTokenData(props.featured[currentPage - 1]);
  }, [currentPage]);

  useEffect(() => {
    (async () => {
      const { data: gecko } = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
      );

      for (const { id } of [...props.tokens, ...props.featured]) {
        const res = await client.getPrice(id);

        if (res.price)
          setPrices((val) => ({
            ...val,
            [id]: (res.price * gecko.arweave.usd).toFixed(2),
          }));
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      for (const { id } of props.featured) {
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
    for (const psc of props.featured) {
      const logo = new Image();
      logo.src = `https://arweave.net/${psc.logo}`;
    }
  }, []);

  return (
    <Page>
      <Head>
        <title>Verto - Space</title>
        <Metas title="Space" />
      </Head>
      <Spacer y={3} />
      <div className={styles.Featured}>
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
                <h2>${prices[currentTokenData.id]}</h2>
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
                          borderColor:
                            theme === "Light" ? "#ffffff" : "#000000",
                        },
                      ],
                    }}
                    options={GraphOptions({
                      theme,
                      tooltipText: ({ value }) =>
                        `${Number(value).toFixed(2)} AR`,
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
      <h1 className="Title">Communities</h1>
      <Spacer y={2} />
      <div className={styles.Cards}>
        {props.tokens.map((token, i) => (
          <motion.div key={i} {...cardAnimation(i)}>
            <Card.Asset
              name={token.name}
              // @ts-ignore
              price={prices[token.id] ?? " ??"}
              image={`https://arweave.net/${token.logo}`}
              ticker={token.ticker}
            />
          </motion.div>
        ))}
      </div>
      <Spacer y={4} />
      <h1 className="Title">All</h1>
    </Page>
  );
};

export async function getServerSideProps() {
  const { data: tokens } = await axios.get(
    "https://v2.cache.verto.exchange/site/communities/top"
  );
  const { data: featured } = await axios.get(
    "https://v2.cache.verto.exchange/site/communities/random"
  );

  return { props: { tokens, featured } };
}

export default Space;
