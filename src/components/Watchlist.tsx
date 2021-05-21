import { CheckIcon, EditIcon } from "@iconicicons/react";
import { PriceInterface } from "@verto/js/dist/faces";
import { Spacer, Tooltip, useTheme } from "@verto/ui";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cardAnimation } from "../utils/animations";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import Verto from "@verto/js";
import dayjs from "dayjs";
import styles from "../styles/components/Watchlist.module.sass";

const client = new Verto();
type WatchlistItem = PriceInterface & {
  id: string;
  priceHistory: {
    [date: string]: number;
  };
};

const Watchlist = () => {
  const periods = ["24h", "1w", "1m", "1y", "ALL"];
  const [selectedPeriod, setSelectedPeriod] = useState(
    periods[periods.length - 1]
  );
  const [editMode, setEditMode] = useState(false);
  const store_name = "verto_watchlist";
  const [tokenIDs, setTokenIDs] = useState<string[]>();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const theme = useTheme();

  // load saved token ids
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(store_name) ?? "[]");
    setTokenIDs(data);
  }, []);

  // load tokens
  useEffect(() => {
    (async () => {
      if (!tokenIDs) return;

      for (const id of tokenIDs) {
        if (items.find((val) => val.id === id)) continue;
        try {
          const data: WatchlistItem = {
            id,
            ...(await client.getPrice(id)),
            priceHistory: await client.getPriceHistory(id),
          };

          setItems((val) => [...val, data]);
        } catch {}
      }

      localStorage.setItem(store_name, JSON.stringify(tokenIDs));
    })();
  }, [tokenIDs]);

  return (
    <>
      <h1 className="Title">
        <div className={styles.Title}>
          Watchlist
          <Spacer x={0.6} />
          <div className={styles.PeriodMenu}>
            {periods.map((per, i) => (
              <span
                key={i}
                className={selectedPeriod === per ? styles.Selected : ""}
                onClick={() => setSelectedPeriod(per)}
              >
                {per}
              </span>
            ))}
          </div>
        </div>
        <div className="ActionSheet">
          <Tooltip text={editMode ? "Done" : "Edit"}>
            <button className="Btn" onClick={() => setEditMode((val) => !val)}>
              {(editMode && <CheckIcon />) || <EditIcon />}
            </button>
          </Tooltip>
        </div>
      </h1>
      <Spacer y={2} />
      <div className={styles.WatchlistContainer}>
        <AnimatePresence>
          {items.map((item, i) => {
            const filterDates = (date) => {
              if (selectedPeriod === "ALL") return true;
              const timeType =
                (selectedPeriod === "24h" && "day") ||
                (selectedPeriod === "1w" && "week") ||
                (selectedPeriod === "1m" && "month") ||
                "year";
              return dayjs(new Date(date)).isAfter(
                dayjs().subtract(1, timeType)
              );
            };
            const prices = Object.keys(item.priceHistory)
              .filter((date) => filterDates(date))
              .reverse()
              .map((key) => ({
                date: key,
                price: item.priceHistory[key],
              }));

            return (
              <motion.div
                className={styles.WatchlistItem}
                key={i}
                {...cardAnimation(i)}
              >
                <div className={styles.Data}>
                  <h1 className={styles.Ticker}>{item.ticker}</h1>
                  <h1 className={styles.Price}>
                    {item.price}
                    <span>AR</span>
                    {/** TODO */}
                    <span className={styles.Positive}>
                      +{(6.44).toLocaleString()}%
                    </span>
                  </h1>
                </div>
                <div className={styles.Graph}>
                  <Line
                    data={{
                      labels: prices.map(({ date }) => date),
                      datasets: [
                        {
                          data: prices.map(({ price }) => price),
                          ...GraphDataConfig,
                          borderColor:
                            theme === "Light" ? "#000000" : "#ffffff",
                        },
                      ],
                    }}
                    options={GraphOptions({
                      theme,
                      tooltipText: ({ value }) =>
                        `${Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })} AR`,
                    })}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {items.length === 0 && (
        <p className="NoItemsText">No items in watchlist</p>
      )}
    </>
  );
};

export default Watchlist;
