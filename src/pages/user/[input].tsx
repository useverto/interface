import {
  OrderInterface,
  TransactionInterface,
  UserInterface,
} from "@verto/js/dist/faces";
import {
  Avatar,
  Button,
  Card,
  Modal,
  Page,
  Spacer,
  Tooltip,
  useModal,
  useToasts,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { cardAnimation, cardListAnimation } from "../../utils/animations";
import { motion } from "framer-motion";
import { randomEmoji } from "../../utils/user";
import { formatAddress } from "../../utils/format";
import { ArrowRightIcon } from "@iconicicons/react";
import { UsernametoURL as usernameToURL } from "social-username-url";
import { RootState } from "../../store/reducers";
import { useSelector } from "react-redux";
import { addToCancel, getCancelledOrders } from "../../utils/order";
import { useRouter } from "next/router";
import Head from "next/head";
import Metas from "../../components/Metas";
import Verto from "@verto/js";
import useArConnect from "use-arconnect";
import Link from "next/link";
import Instagram from "../../components/icons/Instagram";
import Twitter from "../../components/icons/Twitter";
import Github from "../../components/icons/Github";
import Facebook from "../../components/icons/Facebook";
import axios from "axios";
import styles from "../../styles/views/user.module.sass";

const client = new Verto();

const User = (props: { user: UserInterface | null; input: string }) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const [creations, setCreations] = useState<string[]>([]);
  const [owned, setOwned] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
  const currentAddress = useSelector(
    (state: RootState) => state.addressReducer
  );
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const arconnect = useArConnect();
  const [walletName, setWalletName] = useState("");
  const cancelModal = useModal();
  const [cancelID, setCancelID] = useState("");
  const [randomAvatar] = useState(randomEmoji());
  const { setToast } = useToasts();
  const [cancelled, setCancelled] = useState<string[]>([]);

  useEffect(() => setCancelled(getCancelledOrders()), []);

  // set if the profile is owned by the logged in user
  useEffect(() => {
    (async () => {
      if (!arconnect || !currentAddress) return;

      const addresses = await arconnect.getAllAddresses();

      setIsCurrentUser(false);

      for (const addr of addresses)
        if (props.user?.addresses.includes(addr) || props.input === addr) {
          setIsCurrentUser(true);
          break;
        }
    })();
  }, [arconnect, currentAddress, props.input]);

  // set current wallet name from arconnect
  useEffect(() => {
    (async () => {
      if (!arconnect || !currentAddress || !isCurrentUser) return;
      setWalletName(
        (await arconnect.getWalletNames())[currentAddress] ?? "No name"
      );
    })();
  }, [arconnect, currentAddress, isCurrentUser]);

  // load creations
  useEffect(() => {
    axios
      .get(`https://v2.cache.verto.exchange/user/${props.input}/creations`)
      .then(({ data }) => setCreations(data.slice(0, 4)))
      .catch();
  });

  // load owned
  useEffect(() => {
    axios
      .get(`https://v2.cache.verto.exchange/user/${props.input}/owns`)
      .then(({ data }) => setOwned(data.slice(0, 4)))
      .catch();
  });

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

  return (
    <Page>
      <Head>
        <title>@{props.user?.username || props.input} on Verto</title>
        <Metas
          title="User"
          subtitle={`@${props.user?.username || props.input}`}
          localImage={
            props?.user?.username
              ? `api/user_og?u=${props?.user?.username}`
              : undefined
          }
        />
        <meta
          property="profile:username"
          content={props.user?.username || props.input}
        />
      </Head>
      <Spacer y={3} />
      {(props.user && (
        <>
          <div className={styles.AvatarSection}>
            <Avatar
              avatar={
                props.user.image
                  ? `https://arweave.net/${props.user.image}`
                  : randomAvatar
              }
              usertag={props.user.username}
              name={props.user.name}
              size="large-inline"
              className={styles.Avatar}
            />
            {isCurrentUser && <Button>Edit profile</Button>}
          </div>
          <Spacer y={2} />
          {props.user.bio && <p className={styles.Bio}>{props.user.bio}</p>}
          {props.user.links && Object.keys(props.user.links).length > 0 && (
            <div className={styles.Links}>
              {Object.entries(props.user.links).map(
                ([identifier, value], i) => (
                  <SocialIcon identifier={identifier} value={value} key={i} />
                )
              )}
            </div>
          )}
        </>
      )) || (
        <div className={styles.AvatarSection}>
          <Avatar
            avatar={randomAvatar}
            usertag={props.input}
            displaytag={formatAddress(props.input, 14)}
            name={walletName}
            size="large-inline"
            className={styles.Avatar}
          />
          {isCurrentUser && <Button small>Edit profile</Button>}
        </div>
      )}
      <Spacer y={5} />
      <h1 className="Title">Owned arts {"&"} collectibles</h1>
      <Spacer y={2} />
      <div className={styles.Creations}>
        {owned.map((id, i) => (
          <motion.div key={i} {...cardAnimation(i)}>
            <Card.AssetClear image={`https://arweave.net/${id}`} />
          </motion.div>
        ))}
      </div>
      {(owned.length > 0 && (
        <>
          <Spacer y={2} />
          <Link href={`/@${props.input}/owns`}>
            <a className="ShowMore">
              View all
              <ArrowRightIcon />
            </a>
          </Link>
        </>
      )) || <span className="NoItemsText">No collectibles owned...</span>}
      <Spacer y={2} />
      <h1 className="Title">Creations</h1>
      <Spacer y={2} />
      <div className={styles.Creations}>
        {creations.map((id, i) => (
          <motion.div key={i} {...cardAnimation(i)}>
            <Card.AssetClear image={`https://arweave.net/${id}`} />
          </motion.div>
        ))}
      </div>
      {(creations.length > 0 && (
        <>
          <Spacer y={2} />
          <Link href={`/@${props.input}/creations`}>
            <a className="ShowMore">
              View all
              <ArrowRightIcon />
            </a>
          </Link>
        </>
      )) || <span className="NoItemsText">No creations...</span>}
      <Spacer y={2} />
      <h1 className="Title">Trades</h1>
      <Spacer y={2} />
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
      {(orders.length > 0 && (
        <>
          <Spacer y={2} />
          <Link href={`/@${props.input}/trades`}>
            <a className="ShowMore">
              View all
              <ArrowRightIcon />
            </a>
          </Link>
        </>
      )) || <span className="NoItemsText">No trades...</span>}
      <Spacer y={4} />
      <h1 className="Title">Transactions</h1>
      <Spacer y={1} />
      <table className={styles.Transactions}>
        {transactions.map((transaction, i) => (
          <motion.tr key={i} {...cardListAnimation(i)}>
            <td className={styles.TxType}>{transaction.type}</td>
            <td className={styles.TxID}>
              <a
                href={`https://viewblock.io/arweave/tx/${transaction.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {transaction.id}
              </a>
              <Tooltip
                text={transaction.status}
                position="right"
                className={styles.StatusTooltip}
              >
                <span
                  className={
                    styles.Status + " " + styles[`Status_${transaction.status}`]
                  }
                />
              </Tooltip>
            </td>
            <td className={styles.TxAmount}>{transaction.amount}</td>
          </motion.tr>
        ))}
      </table>
      {(transactions.length > 0 && (
        <>
          <Spacer y={1} />
          <Link href={`/@${props.input}/transactions`}>
            <a className="ShowMore">
              View all
              <ArrowRightIcon />
            </a>
          </Link>
        </>
      )) || <span className="NoItemsText">No transactions...</span>}
      <Spacer y={1} />
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
              await client.cancel(cancelID);
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

const SocialIcon = ({ identifier, value }) => (
  <a
    href={usernameToURL(value, identifier)}
    target="_blank"
    rel="noopener noreferrer"
  >
    {(() => {
      switch (identifier) {
        case "facebook":
          return <Facebook />;

        case "instagram":
          return <Instagram />;

        case "github":
          return <Github />;

        case "twitter":
          return <Twitter />;
      }

      return "";
    })()}
  </a>
);

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params: { input } }) {
  const user = (await client.getUser(input)) ?? null;

  if (user && input !== user.username)
    return {
      redirect: {
        destination: `/@${user.username}`,
        permanent: false,
      },
    };

  return { props: { user, input }, revalidate: 1 };
}

export default User;
