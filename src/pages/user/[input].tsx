import Verto from "@verto/js";
import {
  OrderInterface,
  TransactionInterface,
  UserInterface,
} from "@verto/js/dist/faces";
import { Avatar, Card, Page } from "@verto/ui";
import { useEffect, useState } from "react";

const client = new Verto();

const User = (props: { user: UserInterface | undefined }) => {
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);

  useEffect(() => {
    (async () => {
      let res: OrderInterface[] = [];

      for (const address of props.user.addresses) {
        res.push(...(await client.getOrders(address)));
      }

      setOrders(res.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      let res: TransactionInterface[] = [];

      for (const address of props.user.addresses) {
        res.push(...(await client.getTransactions(address)));
      }

      setTransactions(
        res.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5)
      );
    })();
  }, []);

  console.log(transactions);

  return (
    <Page>
      {props.user && (
        <Avatar
          avatar={`https://arweave.net/${props.user.image}`}
          usertag={props.user.username}
          name={props.user.name}
          size="large-inline"
        />
      )}
      {orders.map((order) => (
        <Card.Trade
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
      ))}
    </Page>
  );
};

export async function getServerSideProps(context) {
  const { input } = context.query;
  const user = await client.getUser(input);

  return { props: { user } };
}

export default User;
