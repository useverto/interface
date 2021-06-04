import { Card, Loading, Page, Spacer, Tooltip, useTheme } from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import { cardListAnimation } from "../../../utils/animations";
import { getType } from "../../../utils/order";
import { useEffect, useState } from "react";
import Metas from "../../../components/Metas";
import Head from "next/head";
import axios from "axios";
import useInfiniteScroll from "../../../utils/infinite_scroll";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Verto from "@verto/js";
import styles from "../../../styles/views/orbit.module.sass";
import { useRouter } from "next/router";
import useSWR from "swr";

const client = new Verto();
dayjs.extend(duration);

const Post = (props: { addr: string; stats: any[]; orders: any[] }) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const { data: stats } = useSWR(
    "getStats",
    async () => {
      const { data } = await axios.get(
        `https://v2.cache.verto.exchange/posts/${props.addr}/stats`
      );
      return data;
    },
    {
      initialData: props.stats,
    }
  );
  const { data: orders } = useSWR(
    "getOrders",
    async () => {
      const { data } = await axios.get(
        `https://v2.cache.verto.exchange/posts/${props.addr}/orders?limit=10`
      );
      return data;
    },
    {
      initialData: props.orders,
    }
  );

  const { loading, data } = useInfiniteScroll<any>(loadMore, orders);
  const [status, setStatus] = useState<"online" | "offline">();
  const theme = useTheme();
  const [postUptime, setPostUptime] = useState(0);
  const [postData, setPostData] = useState<{
    version: string;
    fee: number;
    balance: number;
    stake: number;
  }>({
    version: "0.0.0",
    fee: 0,
    balance: 0,
    stake: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: post } = await axios.get(
          `https://v2.cache.verto.exchange/posts/${props.addr}`
        );
        const { data: pingData } = await axios.get(post.endpoint);
        setStatus("online");
        setPostData((val) => ({
          ...val,
          balance: post.balance,
          stake: post.stake,
        }));
        setPostUptime(pingData.uptime);
      } catch {
        setStatus("offline");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { tradeFee, version } = await client.getConfig(props.addr);
      setPostData((val) => ({
        ...val,
        version,
        fee: tradeFee,
      }));
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

  function calculateUptime() {
    const data = dayjs.duration({ seconds: postUptime });
    const days = Math.floor(data.asDays());
    const hours = Math.floor(
      dayjs.duration({ days: data.asDays() - days }).asHours()
    );

    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${
      hours > 1 ? "s" : ""
    }`;
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
      <Spacer y={1.75} />
      <div className={styles.TradingPostData}>
        <div className={styles.Info}>
          <span>Version</span>
          {postData.version}
        </div>
        <div className={styles.Info}>
          <span>Fee</span>
          {postData.fee.toLocaleString()} AR
        </div>
        <div className={styles.Info}>
          <span>Uptime</span>
          {calculateUptime()}
        </div>
        <div className={styles.Info}>
          <span>Stake</span>
          {postData.stake.toLocaleString()} VRT
        </div>
        <div className={styles.Info}>
          <span>Balance</span>
          {postData.balance.toLocaleString(undefined, {
            maximumFractionDigits: 5,
          })}{" "}
          AR
        </div>
      </div>
      <Bar
        data={{
          labels: Object.keys(stats).reverse(),
          datasets: [
            {
              label: "Succeeded",
              backgroundColor: "rgba(0, 212, 110, 0.5)",
              borderColor: "#00D46E",
              borderWidth: 0.5,
              data: Object.values(stats)
                // @ts-ignore
                .map((item) => item.succeeded)
                .reverse(),
            },
            {
              label: "Pending",
              backgroundColor: "rgba(255, 211, 54, 0.5)",
              borderColor: "#FFD336",
              borderWidth: 0.5,
              data: Object.values(stats)
                // @ts-ignore
                .map((item) => item.pending)
                .reverse(),
            },
            {
              label: "Ended",
              backgroundColor: "rgba(130, 130, 130, 0.5)",
              borderColor: "#828282",
              borderWidth: 0.5,
              data: Object.values(stats)
                // @ts-ignore
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
            backgroundColor: theme === "Light" ? "#000000" : "#ffffff",
            titleFontFamily: '"Poppins", sans-serif',
            bodyFontColor: theme === "Light" ? "#d4d4d4" : "#666666",
            bodyFontFamily: '"Poppins", sans-serif',
            titleFontColor: theme === "Light" ? "#ffffff" : "#000000",
            padding: 9,
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

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params: { addr } }) {
  const { data: stats } = await axios.get(
    `https://v2.cache.verto.exchange/posts/${addr}/stats`
  );

  const { data: orders } = await axios.get(
    `https://v2.cache.verto.exchange/posts/${addr}/orders?limit=10`
  );

  return { props: { addr, stats, orders }, revalidate: 1 };
}

export default Post;
