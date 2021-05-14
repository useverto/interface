import { Page, Spacer, Tooltip } from "@verto/ui";
import { useEffect, useState } from "react";
import { TransactionInterface, UserInterface } from "@verto/js/dist/faces";
import { motion } from "framer-motion";
import { cardListAnimation } from "../../../utils/animations";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../../../components/Metas";
import styles from "../../../styles/views/user.module.sass";

const client = new Verto();

const Trades = (props: { user: UserInterface | null; input: string }) => {
  const [transactions, setTransactions] = useState<TransactionInterface[]>([]);

  // load transactions
  useEffect(() => {
    (async () => {
      let res: TransactionInterface[] = [];

      if (props.user) {
        for (const address of props.user.addresses) {
          res.push(...(await client.getTransactions(address)));
        }
      } else res.push(...(await client.getTransactions(props.input)));

      setTransactions(res.sort((a, b) => b.timestamp - a.timestamp));
    })();
  }, []);

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
