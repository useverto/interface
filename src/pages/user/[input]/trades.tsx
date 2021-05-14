import { Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import { OrderInterface, UserInterface } from "@verto/js/dist/faces";
import { motion } from "framer-motion";
import { cardListAnimation } from "../../../utils/animations";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/reducers";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../../components/Metas";

const client = new Verto();

const Trades = (props: { user: UserInterface | null; input: string }) => {
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const currentAddress = useSelector(
    (state: RootState) => state.addressReducer
  );

  // load orders
  useEffect(() => {
    (async () => {
      let res: OrderInterface[] = [];

      if (props.user) {
        for (const address of props.user.addresses) {
          res.push(...(await client.getOrders(address)));
        }
      } else res.push(...(await client.getOrders(props.input)));

      setOrders(res.sort((a, b) => b.timestamp - a.timestamp));
    })();
  }, []);

  // set if the profile is owned by the logged in user
  useEffect(() => {
    if (
      !props.user?.addresses.includes(currentAddress) &&
      props.input !== currentAddress
    )
      return;
    setIsCurrentUser(true);
  }, [currentAddress]);

  return (
    <Page>
      <Head>
        <title>@{props.user?.username || props.input} - Trades</title>
        <Metas
          title="User"
          subtitle={`@${props.user?.username || props.input} - Trades`}
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
      <Spacer y={3} />
      <h1 className="Title">All Trades</h1>
      <Spacer y={3} />
      {orders.map((order, i) => (
        <motion.div key={i} {...cardListAnimation(i)}>
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
              const acceptedStatuses = [
                "success",
                "pending",
                "cancelled",
                "refunded",
              ];
              if (!acceptedStatuses.includes(order.status)) status = "error";

              return status;
            })()}
            orderID={order.id}
            cancel={
              (isCurrentUser &&
                order.status === "pending" &&
                (() => cancelOrder(order.id))) ||
              undefined
            }
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

  if (user && input !== user.username)
    return {
      redirect: {
        destination: `/@${user.username}/trades`,
        permanent: false,
      },
    };

  return { props: { user, input } };
}

export default Trades;
