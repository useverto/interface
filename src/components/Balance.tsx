import { useEffect, useState } from "react";
import { balanceHistory } from "../utils/arweave";
import { Line } from "react-chartjs-2";
import { formatAddress } from "../utils/format";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import { motion, AnimatePresence } from "framer-motion";
import { client } from "../utils/arweave";
import { ClipboardIcon } from "@iconicicons/react";
import { Tooltip, useTheme, useToasts } from "@verto/ui";
import { useSelector } from "react-redux";
import { RootState } from "../store/reducers";
import { useMediaPredicate } from "react-media-hook";
import { Ticker } from "stonk-ticker";
import copy from "copy-to-clipboard";
import styles from "../styles/components/Balance.module.sass";

const Balance = () => {
  const { setToast } = useToasts();
  const address = useSelector((state: RootState) => state.addressReducer);
  const theme = useTheme();

  // animated balance display
  const [balanceDisplay, setBalanceDisplay] = useState<{
    val: number;
    direction: "up" | "down";
  }>({
    val: 0,
    direction: "up",
  });

  // wallet balance
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      const balance = (await client.wallets.getBalance(address)) ?? "0";
      const parsedBalance = parseFloat(client.ar.winstonToAr(balance));

      setBalance(parsedBalance);
      setBalanceDisplay({
        val: parsedBalance,
        direction: "up",
      });
    })();
  }, [address]);

  // historical balance
  const [history, setHistory] = useState<{ [date: string]: number }>();

  useEffect(() => {
    balanceHistory(address)
      .then((res) => setHistory(res))
      .catch();
  }, [address]);

  // mobile repsonsive display
  const mobile = useMediaPredicate("(max-width: 720px)");

  // date of the current balance
  const [date, setDate] = useState<string>();

  return (
    <div className={styles.Balance}>
      <div className={styles.Data}>
        <p>{date || "Total balance"}</p>
        <h1>
          <Ticker
            value={parseFloat(balanceDisplay.val.toFixed(5))}
            constantKeys={["-", "."]}
            direction={balanceDisplay.direction}
          />
          <b>AR</b>
        </h1>
        <p className={styles.Address}>
          Wallet: {formatAddress(address ?? "...", mobile ? 12 : 26)}
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
            onMouseLeave={() => {
              setBalanceDisplay((current) => ({
                val: balance,
                direction: current.val > balance ? "down" : "up",
              }));
              setDate(undefined);
            }}
          >
            <Line
              data={{
                labels: Object.keys(history).reverse(),
                datasets: [
                  {
                    data: Object.values(history).reverse(),
                    ...GraphDataConfig,
                    borderColor: theme === "Light" ? "#000000" : "#ffffff",
                  },
                ],
              }}
              options={GraphOptions({
                theme,
                tooltipText({ value, label }) {
                  setBalanceDisplay((current) => ({
                    val: parseFloat(value),
                    direction: current.val > value ? "down" : "up",
                  }));
                  setDate(label);

                  return `${Number(value).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  })} AR`;
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
