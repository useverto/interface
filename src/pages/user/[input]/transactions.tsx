import { Loading, Page, Spacer, Tooltip } from "@verto/ui";
import { TransactionInterface, UserInterface } from "@verto/js/dist/faces";
import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation } from "../../../utils/animations";
import { useRouter } from "next/router";
import { isAddress } from "../../../utils/arweave";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../../components/Metas";
import useInfiniteScroll from "../../../utils/infinite_scroll";
import styles from "../../../styles/views/user.module.sass";

const client = new Verto();

const Transactions = (props: {
  user: UserInterface | null;
  input: string;
  txs: TransactionInterface[];
}) => {
  const router = useRouter();
  if (router.isFallback) return <></>;

  const { loading, data } = useInfiniteScroll<TransactionInterface>(
    loadMore,
    props.txs
  );

  async function loadMore() {
    if (data.length === 0) return [];
    let res: TransactionInterface[] = [];

    if (props.user) {
      for (const address of props.user.addresses) {
        res.push(
          // @ts-ignore
          ...(await client.getTransactions(address, data[data.length - 1].id))
        );
      }
    } else
      res.push(
        // @ts-ignore
        ...(await client.getTransactions(props.input, data[data.length - 1].id))
      );

    return res;
  }

  return (
    <Page>
      <Head>
        <title>@{props.user?.username || props.input} - Transactions</title>
        <Metas
          title="User"
          subtitle={`@${props.user?.username || props.input} - Transactions`}
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
      <h1 className="Title">All Transactions</h1>
      <Spacer y={3} />
      <table className={styles.Transactions}>
        {data.map((transaction, i) => (
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
      <AnimatePresence>
        {loading && (
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
  const user = (await client.getUser(input)) ?? null;
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
      txs.push(...(await client.getTransactions(address)));
  } else txs.push(...(await client.getTransactions(input)));

  return { props: { user, input, txs }, revalidate: 1 };
}

export default Transactions;
