import {
  OrderInterface,
  TransactionInterface,
  UserInterface,
} from "@verto/js/dist/faces";
import { Avatar, Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import { cardListAnimation } from "../../utils/animations";
import { motion } from "framer-motion";
import Head from "next/head";
import Metas from "../../components/Metas";
import Verto from "@verto/js";

const client = new Verto();

const User = (props: { user: UserInterface | null; input: string }) => {
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);

  // load orders
  useEffect(() => {
    (async () => {
      let res: OrderInterface[] = [];

      if (props.user) {
        for (const address of props.user.addresses) {
          res.push(...(await client.getOrders(address)));
        }
      } else res.push(...(await client.getOrders(props.input)));

      setOrders(res.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
    })();
  }, []);

  // load transactions
  useEffect(() => {
    (async () => {
      let res: TransactionInterface[] = [];

      if (props.user) {
        for (const address of props.user.addresses) {
          res.push(...(await client.getTransactions(address)));
        }
      } else res.push(...(await client.getTransactions(props.input)));

      setTransactions(
        res.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
      );
    })();
  }, []);

  console.log(transactions);

  return (
    <Page>
      <Head>
        <title>@{props.user?.username || props.input} on Verto</title>
        <Metas
          title="User"
          subtitle={`@${props.user?.username || props.input}`}
          image={
            (props.user?.image && `https://arweave.net/${props.user.image}`) ||
            undefined
          }
        />
        <meta
          property="profile:username"
          content={props.user?.username || props.input}
        />
      </Head>
      {props.user && (
        <Avatar
          avatar={`https://arweave.net/${props.user.image}`}
          usertag={props.user.username}
          name={props.user.name}
          size="large-inline"
        />
      )}
      {orders.map((order, i) => (
        <motion.div key={i} {...cardListAnimation(i)}>
          <Card.Trade
            style={{ cursor: "pointer" }}
            type={(() => {
              let type: any;
              if (order.input.split(" ")[1] === "AR") {
                type = "buy";
              } else {
                type = "sell";
              }

              return type;
            })()}
            from={{
              amount: parseFloat(order.input.split(" ")[0]),
              ticker: order.input.split(" ")[1],
            }}
            to={order.output.split(" ")[1]}
            timestamp={new Date(order.timestamp * 1000)}
            status={(() => {
              let status: any = order.status;

              if (status === "success" || status === "pending") {
                // don't do anything
              } else if (status === "cancelled" || status === "refunded") {
                status = "neutral";
              } else {
                status = "error";
              }

              return status;
            })()}
            orderID={order.id}
            cancel={() => {}}
          />
          <Spacer y={1} />
        </motion.div>
      ))}
    </Page>
  );
};

export async function getServerSideProps(context) {
  const { input } = context.query;
  const user = (await client.getUser(input)) ?? null;

  return { props: { user, input } };
}

export default User;
