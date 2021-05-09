import {
  OrderInterface,
  TransactionInterface,
  UserInterface,
} from "@verto/js/dist/faces";
import { Avatar, Button, Card, Page, Spacer, Tooltip } from "@verto/ui";
import { useEffect, useState } from "react";
import { cardListAnimation } from "../../utils/animations";
import { motion } from "framer-motion";
import { randomEmoji } from "../../utils/user";
import { formatAddress } from "../../utils/format";
import { ArrowRightIcon } from "@iconicicons/react";
import { UsernametoURL as usernameToURL } from "social-username-url";
import { RootState } from "../../store/reducers";
import { useSelector } from "react-redux";
import Head from "next/head";
import Metas from "../../components/Metas";
import Verto from "@verto/js";
import useArConnect from "use-arconnect";
import Link from "next/link";
import Instagram from "../../components/icons/Instagram";
import Twitter from "../../components/icons/Twitter";
import Github from "../../components/icons/Github";
import Facebook from "../../components/icons/Facebook";
import styles from "../../styles/views/user.module.sass";

const client = new Verto();

const User = (props: { user: UserInterface | null; input: string }) => {
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
  const currentAddress = useSelector(
    (state: RootState) => state.addressReducer
  );
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const arconnect = useArConnect();
  const [walletName, setWalletName] = useState("");

  // set if the profile is owned by the logged in user
  useEffect(() => {
    if (
      !props.user?.addresses.includes(currentAddress) &&
      props.input !== currentAddress
    )
      return;
    setIsCurrentUser(true);
  }, [currentAddress]);

  // set current wallet name from arconnect
  useEffect(() => {
    (async () => {
      if (!arconnect) return;
      setWalletName(
        (await arconnect.getWalletNames())[currentAddress] ?? "No name"
      );
    })();
  }, [arconnect, currentAddress]);

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

  async function cancelOrder(orderID: string) {
    // TODO
  }

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
      <Spacer y={3} />
      {(props.user && (
        <>
          <div className={styles.AvatarSection}>
            <Avatar
              avatar={`https://arweave.net/${props.user.image}`}
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
                  <SocialIcon identifier={identifier} value={value} />
                )
              )}
            </div>
          )}
        </>
      )) || (
        <div className={styles.AvatarSection}>
          <Avatar
            avatar={randomEmoji()}
            usertag={formatAddress(props.input, 14)}
            name={walletName}
            size="large-inline"
            className={styles.Avatar}
          />
          {isCurrentUser && <Button>Edit profile</Button>}
        </div>
      )}
      <Spacer y={5} />
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
                (() => cancelOrder(order.id))) ||
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
      )) || <span className="ShowMore">No trades</span>}
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
      )) || <span className="ShowMore">No transactions</span>}
      <Spacer y={1} />
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

export async function getServerSideProps(context) {
  const { input } = context.query;
  const user = (await client.getUser(input)) ?? null;

  if (user && input !== user.username)
    return {
      redirect: {
        destination: `/@${user.username}`,
        permanent: false,
      },
    };

  return { props: { user, input } };
}

export default User;
