import { useEffect, useState } from "react";
import { balanceHistory } from "../utils/arweave";
import { Line } from "react-chartjs-2";
import { useAddress } from "../utils/arconnect";
import { formatAddress } from "../utils/format";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "../utils/arweave";
import { ClippyIcon } from "@primer/octicons-react";
import { Tooltip } from "@verto/ui";
import CountUp from "react-countup";
import copy from "copy-to-clipboard";
import styles from "../styles/components/Balance.module.sass";

const Balance = () => {
  const { address } = useAddress();
  const [history, setHistory] = useState<{ [date: string]: number }>();
  const [balance, setBalance] = useState(undefined);

  useEffect(() => {
    if (!address) return;
    loadData();
  }, [address]);

  async function loadData() {
    setBalance(
      parseFloat(
        client.ar.winstonToAr(await client.wallets.getBalance(address)) ?? "0"
      )
    );
    setHistory(await balanceHistory(address));
  }

  return (
    <div className={styles.Balance}>
      <div className={styles.Data}>
        <p>Total balance</p>
        <h1>
          {(balance && <CountUp end={balance} decimals={8} duration={2} />) ||
            "0"}
          <b>AR</b>
        </h1>
        <p className={styles.Address}>
          Wallet: {formatAddress(address ?? "...")}
          <Tooltip text="Copy address">
            <button onClick={() => copy(address)}>
              <ClippyIcon />
            </button>
          </Tooltip>
        </p>
      </div>
      <AnimatePresence>
        {history && (
          <motion.div
            className={styles.Graph}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.23, ease: "easeInOut" }}
          >
            <Line
              data={{
                labels: Object.keys(history).reverse(),
                datasets: [
                  {
                    data: Object.values(history).reverse(),
                    ...GraphDataConfig,
                  },
                ],
              }}
              options={GraphOptions({
                tooltipText: ({ value }) => `${Number(value).toFixed(2)} AR`,
              })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Balance;
