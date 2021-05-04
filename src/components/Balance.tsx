import { useEffect, useRef, useState } from "react";
import { balanceHistory } from "../utils/arweave";
import { Line } from "react-chartjs-2";
import { useAddress } from "../utils/arconnect";
import { formatAddress } from "../utils/format";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "../utils/arweave";
import { ClipboardIcon } from "@iconicicons/react";
import { Tooltip, useToasts } from "@verto/ui";
import copy from "copy-to-clipboard";
import styles from "../styles/components/Balance.module.sass";
import { useCountUp } from "../utils/animations";

const Balance = () => {
  const { address } = useAddress();
  const [history, setHistory] = useState<{ [date: string]: number }>();
  const [balance, setBalance] = useState(0);
  const [historicalBalance, setHistorycalBalance] = useState<{
    date: string;
    val: number;
  }>();
  const { setToast } = useToasts();
  const decimals = 8;
  const animatedBalance = useCountUp({ end: balance, decimals });
  const graphWrapper = useRef<HTMLDivElement>();
  const [cursorPos, setCursorPos] = useState(0);

  useEffect(() => {
    if (!address) return;
    loadData();
  }, [address]);

  useEffect(() => {
    if (!graphWrapper.current) return;

    const handleMove = (e: MouseEvent) => {
      const newPos = e.pageX - graphWrapper.current.offsetLeft;

      if (newPos < 0) return;
      setCursorPos(newPos);
    };
    window.addEventListener("mousemove", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
    };
  }, [graphWrapper]);

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
            ref={graphWrapper}
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
                tooltips: false,
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
            <div className={styles.Cursor} style={{ left: cursorPos }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Balance;
