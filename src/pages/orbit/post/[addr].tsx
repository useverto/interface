import { Button, Card, Page, Spacer } from "@verto/ui";
import axios from "axios";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import Metas from "../../../components/Metas";

const Post = (props: { addr: string; stats: any[]; orders: any[] }) => {
  const [orders, setOrders] = useState(props.orders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loading && props.orders.length) {
      axios
        .get(
          `https://v2.cache.verto.exchange/posts/${
            props.addr
          }/orders?limit=10&after=${props.orders[props.orders.length - 1].id}`
        )
        .then((res) => {
          setOrders((val) => [...val, ...res.data]);
          setLoading(false);
        });
    }
  }, [loading]);

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
      {orders.map((order) => {
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
          <>
            <Card.Order
              type={type}
              orderID={order.id}
              status={status}
              timestamp={new Date(order.timestamp * 1000)}
              key={order.id}
            />
            <Spacer y={1} />
          </>
        );
      })}
      <Button loading={loading} onClick={() => setLoading(true)}>
        Load More
      </Button>
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
