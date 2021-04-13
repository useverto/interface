import { Button, Card, Page, Spacer } from "@verto/ui";
import axios from "axios";
import { useEffect, useState } from "react";

const Post = (props: { addr: string; orders: any[] }) => {
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

  const { data: orders } = await axios.get(
    `https://v2.cache.verto.exchange/posts/${addr}/orders?limit=10`
  );

  return { props: { addr, orders } };
}

export default Post;
