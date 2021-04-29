import { Card, Loading, Page, Spacer } from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { Bar } from "react-chartjs-2";
import { cardListAnimation } from "../../../utils/animations";
import Metas from "../../../components/Metas";
import Head from "next/head";
import axios from "axios";
import useInfiniteScroll from "../../../utils/infinite_scroll";

const Post = (props: { addr: string; stats: any[]; orders: any[] }) => {
  const { loading, data } = useInfiniteScroll<any>(loadMore, props.orders);

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
        <Metas title={`Post ${props.addr}`} />
      </Head>
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
      <Spacer y={2} />
      {data.map((order, i) => {
        let status = order.status;
        if (status === "success" || status === "pending") {
          // don't do anything
        } else if (status === "cancelled" || status === "refunded") {
          status = "neutral";
        } else {
          status = "error";
        }

        let type;
        if (order.input.split(" ")[1] === "AR") {
          type = "buy";
        } else {
          type = "sell";
        }

        return (
          <motion.div key={i} {...cardListAnimation(i)}>
            <Card.Order
              type={type}
              orderID={order.id}
              status={status}
              timestamp={new Date(order.timestamp * 1000)}
            />
            <Spacer y={2} />
          </motion.div>
        );
      })}
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
