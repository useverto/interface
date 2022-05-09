import { Loading, Page, Select, Spacer, Tooltip, useSelect } from "@verto/ui";
import { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
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

const Transactions = (props: Props) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  // active address select
  const activeAddress = useSelect(props.user?.addresses?.[0] ?? props.input);

  // set active address from query params if address
  // param exists and is a valid Arweave address
  useEffect(() => {
    // "address" param
    const address = router.query.address;
    const addr = router.query.addr;

    if (typeof address === "string" && isAddress(address)) {
      activeAddress.setState(address);
    } else if (typeof addr === "string" && isAddress(addr)) {
      activeAddress.setState(addr);
    }
  }, [router.query]);

  // transactions infinite loading
  const [transactions, setTransactions] = useState(props.txs);
  const [hasMore, setHasMore] = useState(true);
  const [animationCounter, setAnimationCounter] = useState(0);

  // reset everything on address change
  useEffect(() => {
    setTransactions([]);
    setHasMore(true);
    loadMore(true);
    setAnimationCounter(0);
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

    setAnimationCounter(transactions.length);
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
        {props.user && props.user.addresses.length > 1 && (
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
        endMessage={
          <p className={styles.EndText}>You have reached the end 😋</p>
        }
        style={{ overflow: "unset !important" }}
      >
        <table className={styles.Transactions}>
          {transactions.map((transaction, i) => (
            <motion.tr key={i} {...cardListAnimation(i - animationCounter)}>
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

export async function getServerSideProps({
  params: { input },
}: GetServerSidePropsContext<{ input: string }>): Promise<
  GetServerSidePropsResult<Props>
> {
  const user = (await client.user.getUser(input)) ?? null;
  let txs = [];

  // redirect if the user cannot be found and if it is not and address either
  if (!isAddress(input) && !user) return { notFound: true };

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

  return {
    props: { user, input, txs },
  };
}

export default Transactions;

interface Props {
  user: UserInterface | null;
  input: string;
  txs: TransactionInterface[];
}
