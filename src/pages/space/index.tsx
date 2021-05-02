import { Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import { cardAnimation } from "../../utils/animations";
import { AnimatePresence, motion } from "framer-motion";
import { GraphDataConfig, GraphOptions } from "../../utils/graph";
import { Line } from "react-chartjs-2";
import axios from "axios";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../components/Metas";
import styles from "../../styles/views/space.module.sass";

const client = new Verto();

const Space = (props: { tokens: any[]; featured: any[] }) => {
  const [prices, setPrices] = useState<{ [id: string]: number }>({});
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);
  const [currentTokenData, setCurrentTokenData] = useState(props.featured[0]);

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

      for (const { id } of props.tokens) {
        const res = await client.getPrice(id);

        if (res.price)
          setPrices((val) => ({
            ...val,
            [id]: (res.price * gecko.arweave.usd).toFixed(2),
          }));
      }
    })();
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
            initial={{ x: 1000, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -1000, opacity: 0 }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
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
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Tempora cumque...
                </p>
              </div>
            </div>
            <div className={styles.PriceData}>
              <h2>$19.27</h2>
              <div className={styles.GraphData}>
                <Line
                  data={{
                    labels: [
                      "2021-05-10",
                      "2021-05-11",
                      "2021-05-12",
                      "2021-05-13",
                      "2021-05-14",
                      "2021-05-15",
                      "2021-05-16",
                    ],
                    datasets: [
                      {
                        data: [3, 5, 6, 2, 4, 8, 4],
                        ...GraphDataConfig,
                        borderColor: "#ffffff",
                      },
                    ],
                  }}
                  options={GraphOptions({
                    tooltipText: ({ value }) =>
                      `${Number(value).toFixed(2)} AR`,
                  })}
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className={styles.Paginator}>
          <span
            className={currentPage === 1 ? styles.ActivePage : ""}
            onClick={() => setCurrentPage(1)}
          />
          <span
            className={currentPage === 2 ? styles.ActivePage : ""}
            onClick={() => setCurrentPage(2)}
          />
          <span
            className={currentPage === 3 ? styles.ActivePage : ""}
            onClick={() => setCurrentPage(3)}
          />
          <span
            className={currentPage === 4 ? styles.ActivePage : ""}
            onClick={() => setCurrentPage(4)}
          />
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
