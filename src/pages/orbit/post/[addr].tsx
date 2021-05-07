import { Card, Loading, Page, Spacer, Tooltip } from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import { cardListAnimation } from "../../../utils/animations";
import { getType } from "../../../utils/order";
import { useEffect, useState } from "react";
import Metas from "../../../components/Metas";
import Head from "next/head";
import axios from "axios";
import useInfiniteScroll from "../../../utils/infinite_scroll";
import styles from "../../../styles/views/orbit.module.sass";

const Post = (props: { addr: string; stats: any[]; orders: any[] }) => {
  const { loading, data } = useInfiniteScroll<any>(loadMore, props.orders);
  const [status, setStatus] = useState<"online" | "offline">();

  useEffect(() => {
    (async () => {
      try {
        const { data: post } = await axios.get(
          `https://v2.cache.verto.exchange/posts/${props.addr}`
        );
        await axios.get(post.endpoint);
        setStatus("online");
      } catch {
        setStatus("offline");
      }
    })();
  }, []);

  async function loadMore() {
    const { data: moreOrders } = await axios.get(
      `https://v2.cache.verto.exchange/posts/${
        props.addr
      }/orders?limit=10&after=${data[data.length - 1].id}`
    );

    return moreOrders;
  }

  return (
    <Page>
      <Head>
        <title>Verto - Post {props.addr}</title>
        <Metas title="Trading Post" subtitle={props.addr} />
      </Head>
      <Spacer y={3} />
      <div className={styles.OrbitTitle}>
        <h1>Trading Post</h1>
        <p>
          <a
            href={`https://viewblock.io/arweave/address/${props.addr}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.TradingPostAddress}
          >
            {props.addr}
          </a>
          {status && (
            <>
              <Spacer x={0.44} />
              <Tooltip text={status} position="right">
                <span
                  className={
                    styles.Status +
                    " " +
                    styles[
                      `Status_${status === "offline" ? "error" : "success"}`
                    ]
                  }
                />
              </Tooltip>
            </>
          )}
        </p>
      </div>
      <Spacer y={3} />
      <Bar
        data={{
          labels: Object.keys(props.stats).reverse(),
          datasets: [
            {
              label: "Succeeded",
              backgroundColor: "rgba(0, 212, 110, 0.5)",
              borderColor: "#00D46E",
              borderWidth: 0.5,
              data: Object.values(props.stats)
                .map((item) => item.succeeded)
                .reverse(),
            },
            {
              label: "Pending",
              backgroundColor: "rgba(255, 211, 54, 0.5)",
              borderColor: "#FFD336",
              borderWidth: 0.5,
              data: Object.values(props.stats)
                .map((item) => item.pending)
                .reverse(),
            },
            {
              label: "Ended",
              backgroundColor: "rgba(130, 130, 130, 0.5)",
              borderColor: "#828282",
              borderWidth: 0.5,
              data: Object.values(props.stats)
                .map((item) => item.neutral + item.errored)
                .reverse(),
            },
          ],
        }}
        height={50}
        options={{
          tooltips: {
            mode: "index",
            intersect: false,
          },
          hover: {
            mode: "nearest",
            intersect: true,
          },
          scales: {
            xAxes: [
              {
                display: false,
                stacked: true,
              },
            ],
            yAxes: [
              {
                display: false,
                stacked: true,
              },
            ],
          },
          legend: {
            display: false,
          },
        }}
      />
      <Spacer y={3} />
      {data.map((order, i) => (
        <motion.div key={i} {...cardListAnimation(i)}>
          <Card.Order
            type={getType(order.input)}
            orderID={order.id}
            status={order.status}
            timestamp={new Date(order.timestamp * 1000)}
          />
          <Spacer y={2} />
        </motion.div>
      ))}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ease: "easeInOut", duration: 0.22 }}
          >
            <Spacer y={1} />
            <Loading.Spinner style={{ margin: "0 auto" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
};

export async function getServerSideProps(context) {
  const { addr } = context.query;

  const { data: stats } = await axios.get(
    `https://v2.cache.verto.exchange/posts/${addr}/stats`
  );

  const { data: orders } = await axios.get(
    `https://v2.cache.verto.exchange/posts/${addr}/orders?limit=10`
  );

  return { props: { addr, stats, orders } };
}

export default Post;
