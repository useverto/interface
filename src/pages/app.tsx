import { BalanceInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer, Tooltip } from "@verto/ui";
import { useEffect, useState } from "react";
import { useAddress } from "../utils/arconnect";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from "@primer/octicons-react";
import { AnimatePresence, motion } from "framer-motion";
import Balance from "../components/Balance";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../components/Metas";
import styles from "../styles/views/app.module.sass";
import { cardListAnimation } from "../utils/animations";

const client = new Verto();

const App = () => {
  const [balances, setBalances] = useState<BalanceInterface[]>([]);
  const { address } = useAddress();
  const [showMorePsts, setShowMorePsts] = useState(false);

  useEffect(() => {
    if (!address) return;
    loadData();
  }, [address]);

  async function loadData() {
    setBalances(await client.getBalances(address));
  }

  return (
    <Page>
      <Head>
        <title>Verto - Home</title>
        <Metas title="Home" />
      </Head>
      <Spacer y={3} />
      <Balance />
      <Spacer y={4} />
      <h1 className="Title">
        Balances
        {/** TODO @martonlederer */}
        <div className="ActionSheet">
          <Tooltip text="List new">
            <button className="Btn">
              <PlusIcon />
            </button>
          </Tooltip>
        </div>
      </h1>
      <Spacer y={2} />
      <AnimatePresence>
        {balances.map(
          (item, i) =>
            (showMorePsts || i < 5) && (
              <motion.div key={i} {...cardListAnimation(i)}>
                <Card.Balance
                  id={item.id}
                  name={item.name}
                  // @ts-ignore
                  ticker={item.ticker ?? ""}
                  balance={item.balance}
                  logo={{
                    light: item.logo
                      ? `https://arweave.net/${item.logo}`
                      : "/arweave.png",
                  }}
                />
                <Spacer y={1} />
              </motion.div>
            )
        )}
      </AnimatePresence>
      <Spacer y={1} />
      <span
        className={styles.ShowMore}
        onClick={() => setShowMorePsts((val) => !val)}
      >
        Show{" "}
        {(showMorePsts && (
          <>
            less
            <ChevronUpIcon />
          </>
        )) || (
          <>
            all
            <ChevronDownIcon />
          </>
        )}
      </span>
    </Page>
  );
};

export default App;
