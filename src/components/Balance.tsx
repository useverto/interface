import { useEffect, useRef, useState } from "react";
import { balanceHistory } from "../utils/arweave";
import { Line } from "react-chartjs-2";
import { formatAddress } from "../utils/format";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "../utils/arweave";
import { ClipboardIcon } from "@iconicicons/react";
import { Tooltip, useToasts } from "@verto/ui";
import { useCountUp } from "../utils/animations";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import copy from "copy-to-clipboard";
import styles from "../styles/components/Balance.module.sass";

const Balance = () => {
  const [history, setHistory] = useState<{ [date: string]: number }>();
  const [balance, setBalance] = useState(0);
  const [historicalBalance, setHistorycalBalance] = useState<{
    date: string;
    val: number;
  }>();
  const { setToast } = useToasts();
  const decimals = 8;
  const animatedBalance = useCountUp({ end: balance, decimals });
  const address = useSelector((state: RootState) => state.addressReducer);

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
        <p>{historicalBalance?.date || "Total balance"}</p>
        <h1>
          {historicalBalance?.val || animatedBalance}
          <b>AR</b>
        </h1>
        <p className={styles.Address}>
          Wallet: {formatAddress(address ?? "...")}
          <Tooltip text="Copy address">
            <button
              onClick={() => {
                copy(address);
                setToast({
                  title: "Copied",
                  description: "Address copied to clipboard",
                  duration: 2400,
                });
              }}
            >
              <ClipboardIcon />
            </button>
          </Tooltip>
        </p>
      </div>
      <AnimatePresence>
        {history && (
          <motion.div
            className={styles.Graph}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ duration: 0.23, ease: "easeInOut" }}
            onMouseLeave={() => setHistorycalBalance(undefined)}
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
                tooltipText({ value, label }) {
                  const formattedBal =
                    Math.round(Number(value) * Math.pow(10, decimals)) /
                    Math.pow(10, decimals);
                  if (
                    !historicalBalance ||
                    historicalBalance.date !== label ||
                    historicalBalance.val !== formattedBal
                  )
                    setHistorycalBalance({
                      date: label,
                      val: formattedBal,
                    });

                  return `${Number(value).toFixed(2)} AR`;
                },
              })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Balance;
