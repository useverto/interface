import {
  Button,
  Card,
  Modal,
  Page,
  Spacer,
  useModal,
  useToasts,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { OrderInterface, UserInterface } from "@verto/js/dist/faces";
import { motion } from "framer-motion";
import { cardListAnimation } from "../../../utils/animations";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/reducers";
import { addToCancel, getCancelledOrders } from "../../../utils/order";
import { useRouter } from "next/router";
import { isAddress, verto as client } from "../../../utils/arweave";
import Head from "next/head";
import Metas from "../../../components/Metas";

const Trades = (props: { user: UserInterface | null; input: string }) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const currentAddress = useSelector(
    (state: RootState) => state.addressReducer
  );
  const cancelModal = useModal();
  const [cancelID, setCancelID] = useState("");
  const { setToast } = useToasts();
  const [cancelled, setCancelled] = useState<string[]>([]);

  // load orders
  useEffect(() => {
    (async () => {
      let res: OrderInterface[] = [];

      if (props.user) {
        for (const address of props.user.addresses) {
          res.push(...(await client.user.getOrders(address)));
        }
      } else res.push(...(await client.user.getOrders(props.input)));

      // TODO
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
  useEffect(() => setCancelled(getCancelledOrders()), []);

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
                !cancelled.includes(order.id) &&
                (() => {
                  setCancelID(order.id);
                  cancelModal.setState(true);
                })) ||
              undefined
            }
          />
          <Spacer y={1} />
        </motion.div>
      ))}
      <Modal {...cancelModal.bindings}>
        <Modal.Title>Cancel order</Modal.Title>
        <p style={{ textAlign: "justify" }}>
          Are you sure you want to cancel your order <b>({cancelID})</b>?
        </p>
        <Button
          style={{ margin: "0 auto" }}
          small
          onClick={async () => {
            try {
              await client.exchange.cancel(cancelID);
              setCancelID("");
              cancelModal.setState(false);
              addToCancel(cancelID);
              setCancelled((val) => [...val, cancelID]);
              setToast({
                description: "Cancelled order",
                type: "success",
                duration: 3000,
              });
            } catch {
              setToast({
                description: "Could not cancel order",
                type: "error",
                duration: 3000,
              });
            }
          }}
        >
          Cancel
        </Button>
      </Modal>
    </Page>
  );
};

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params: { input } }) {
  const user = (await client.user.getUser(input)) ?? null;

  // redirect if the user cannot be found and if it is not and address either
  if (!isAddress(input) && !user)
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };

  if (user && input !== user.username)
    return {
      redirect: {
        destination: `/@${user.username}`,
        permanent: false,
      },
    };

  return { props: { user, input }, revalidate: 1 };
}

export default Trades;
