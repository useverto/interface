import { Card, Page } from "@verto/ui";
import axios from "axios";

const Post = (props: { orders: any[] }) => {
  return (
    <Page>
      {props.orders.map((order) => {
        let status = order.status;
        if (status === "success" || status === "pending") {
          // don't do anything
        } else if (status === "cancelled") {
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
          <Card.Order
            type={type}
            orderID={order.id}
            status={status}
            timestamp={new Date(order.timestamp * 1000)}
          />
        );
      })}
    </Page>
  );
};

export async function getServerSideProps(context) {
  const { addr } = context.query;

  const { data: orders } = await axios.get(
    `https://v2.cache.verto.exchange/orders?post=${addr}`
  );

  return { props: { orders } };
}

export default Post;
