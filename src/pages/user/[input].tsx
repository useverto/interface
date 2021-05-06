import {
  OrderInterface,
  TransactionInterface,
  UserInterface,
} from "@verto/js/dist/faces";
import { Avatar, Button, Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import { cardListAnimation } from "../../utils/animations";
import { motion } from "framer-motion";
import { useAddress } from "../../utils/arconnect";
import { randomEmoji } from "../../utils/user";
import { formatAddress } from "../../utils/format";
import { ArrowRightIcon } from "@iconicicons/react";
import Head from "next/head";
import Metas from "../../components/Metas";
import Verto from "@verto/js";
import useArConnect from "use-arconnect";
import Link from "next/link";
import styles from "../../styles/views/user.module.sass";

const client = new Verto();

const User = (props: { user: UserInterface | null; input: string }) => {
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);
  const { address: currentAddress } = useAddress();
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
          {props.user.bio && <p>{props.user.bio}</p>}
          {props.user.links &&
            Object.entries(props.user.links).map(([identifier, value]) => (
              <>
                {identifier === "twitter" && (
                  <a href={`https://twitter.com/${value}`} target="_blank">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.31 18.25C14.7819 18.25 17.7744 13.4403 17.7744 9.26994C17.7744 9.03682 17.9396 8.83015 18.152 8.73398C18.8803 8.40413 19.8249 7.49943 18.8494 5.97828C18.2031 6.32576 17.6719 6.51562 16.9603 6.74448C15.834 5.47393 13.9495 5.41269 12.7514 6.60761C11.9785 7.37819 11.651 8.52686 11.8907 9.62304C9.49851 9.49618 7.27005 8.2975 5.75967 6.32575C4.97031 7.76816 5.37324 9.61305 6.68039 10.5399C6.20677 10.5249 5.74376 10.3892 5.33024 10.1449V10.1849C5.33024 11.6873 6.32871 12.981 7.71657 13.2784C7.27888 13.4053 6.81941 13.4241 6.37348 13.3328C6.76345 14.6184 7.87974 15.4989 9.15272 15.5245C8.09887 16.4026 6.79761 16.8795 5.45806 16.8782C5.22126 16.8776 4.98504 16.8626 4.75 16.8326C6.11076 17.7588 7.69359 18.25 9.31 18.2475V18.25Z"
                        stroke="#141414"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      ></path>
                    </svg>
                  </a>
                )}
              </>
            ))}
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
      )) || <span className="Show more">No trades</span>}
      <Spacer y={4} />
      <h1 className="Title">Transactions</h1>
      <Spacer y={1} />
      <table className={styles.Transactions}>
        {transactions.map((transaction, i) => (
          <motion.tr key={i} {...cardListAnimation(i)}>
            <td className={styles.TxType}>{transaction.type}</td>
            <td className={styles.TxID}>
              {transaction.id}
              {transaction.status}
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
      )) || <span className="Show more">No transactions</span>}
    </Page>
  );
};

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
