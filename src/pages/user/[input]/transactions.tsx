import { Loading, Page, Select, Spacer, Tooltip, useSelect } from "@verto/ui";
import {
  TransactionInterface,
  UserInterface,
} from "@verto/js/dist/common/faces";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation } from "../../../utils/animations";
import { useRouter } from "next/router";
import { gateway, isAddress, verto as client } from "../../../utils/arweave";
import { useMediaPredicate } from "react-media-hook";
import { formatAddress } from "../../../utils/format";
import { useEffect, useState } from "react";
import Head from "next/head";
import Metas from "../../../components/Metas";
import InfiniteScroll from "react-infinite-scroll-component";
import styles from "../../../styles/views/user.module.sass";

const Transactions = (props: {
  user: UserInterface | null;
  input: string;
  txs: TransactionInterface[];
}) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  // active address select
  const activeAddress = useSelect(props.user?.addresses?.[0] ?? props.input);

  // transactions infinite loading
  const [transactions, setTransactions] = useState(props.txs);
  const [hasMore, setHasMore] = useState(true);

  // reset everything on address change
  useEffect(() => {
    setTransactions([]);
    setHasMore(true);
    loadMore(true);
  }, [activeAddress.state]);

  async function loadMore(reload = false) {
    if ((transactions.length === 0 && !reload) || !hasMore) return;
    let res: TransactionInterface[] = [];

    // push txs
    res.push(
      ...(await client.user.getTransactions(
        activeAddress.state,
        reload ? undefined : transactions[transactions.length - 1].id
      ))
    );

    // if there are no more txs, return
    if (res.length === 0) return setHasMore(false);

    setTransactions((val) => [...val, ...res]);
  }

  const notMobile = useMediaPredicate("(min-width: 720px)");

  function shortOnMobile(addr: string) {
    if (notMobile) return addr;
    else return formatAddress(addr, 12);
  }

  return (
    <Page>
      <Head>
        <title>@{props.user?.username || props.input} - Transactions</title>
        <Metas
          title="User"
          subtitle={`@${props.user?.username || props.input} - Transactions`}
          image={
            (props.user?.image && `${gateway()}/${props.user.image}`) ||
            undefined
          }
        />
        <meta
          property="profile:username"
          content={props.user?.username || props.input}
        />
      </Head>
      <Spacer y={3} />
      <h1 className="Title">
        All Transactions
        {props.user && (
          <Select
            {...activeAddress.bindings}
            small
            className={styles.AddressSelect}
          >
            {props.user.addresses.map((address, i) => (
              <option value={address} key={i}>
                {formatAddress(address, 12)}
              </option>
            ))}
          </Select>
        )}
      </h1>
      <Spacer y={3} />
      <InfiniteScroll
        dataLength={transactions.length}
        next={loadMore}
        hasMore={hasMore}
        loader={<></>}
        style={{ overflow: "unset !important" }}
      >
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
                  {shortOnMobile(transaction.id)}
                </a>
                <Tooltip
                  text={transaction.status}
                  position="right"
                  className={styles.StatusTooltip}
                >
                  <span
                    className={
                      styles.Status +
                      " " +
                      styles[`Status_${transaction.status}`]
                    }
                  />
                </Tooltip>
              </td>
              <td className={styles.TxAmount}>{transaction.amount}</td>
            </motion.tr>
          ))}
        </table>
      </InfiniteScroll>
      <AnimatePresence>
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ ease: "easeInOut", duration: 0.22 }}
          >
            <Spacer y={1} />
            <Loading.Spinner style={{ margin: "0 auto" }} />
          </motion.div>
        )}
      </AnimatePresence>
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
  let txs = [];

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
        destination: `/@${user.username}/transactions`,
        permanent: false,
      },
    };

  if (user) {
    for (const address of user.addresses)
      txs.push(...(await client.user.getTransactions(address)));
  } else txs.push(...(await client.user.getTransactions(input)));

  return { props: { user, input, txs }, revalidate: 1 };
}

export default Transactions;
