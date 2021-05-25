import { CheckIcon, EditIcon, PlusIcon } from "@iconicicons/react";
import { PriceInterface, TokenInterface } from "@verto/js/dist/faces";
import {
  Button,
  Modal,
  Select,
  Spacer,
  Tooltip,
  useModal,
  useSelect,
  useTheme,
  useToasts,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cardAnimation, opacityAnimation } from "../utils/animations";
import { Line } from "react-chartjs-2";
import { GraphDataConfig, GraphOptions } from "../utils/graph";
import {
  watchlist as store_name,
  watchlistPeriod,
} from "../utils/storage_names";
import Verto from "@verto/js";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import axios from "axios";
import styles from "../styles/components/Watchlist.module.sass";

const client = new Verto();
type WatchlistItem = PriceInterface & {
  id: string;
  priceHistory: {
    [date: string]: number;
  };
};
dayjs.extend(isToday);

const Watchlist = () => {
  const periods = ["24h", "1w", "1m", "1y", "ALL"];
  const [selectedPeriod, setSelectedPeriod] = useState<string>();
  const [editMode, setEditMode] = useState(false);
  const [tokenIDs, setTokenIDs] = useState<string[]>();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const theme = useTheme();
  const { setToast } = useToasts();
  const [tokens, setTokens] = useState<TokenInterface[]>([]);
  const addTokenModal = useModal();
  const tokenSelect = useSelect<string>();

  // load saved token ids & period data
  useEffect(() => {
    // AR is added to watchlist by default
    const tokenData = JSON.parse(localStorage.getItem(store_name) ?? '["AR"]');
    const periodData = localStorage.getItem(watchlistPeriod) ?? "ALL";
    setTokenIDs(tokenData);
    setSelectedPeriod(periodData);
  }, []);

  // load watchlist tokens
  useEffect(() => {
    (async () => {
      if (!tokenIDs || tokens.length === 0) return;

      for (const id of tokenIDs) {
        if (items.find((val) => val.id === id)) continue;
        if (id === "AR" || id === "ETH") {
          try {
            const token = tokens.find((item) => item.id === id);
            if (!token) continue;

            const { data: history } = await axios.get(
              `https://api.coingecko.com/api/v3/coins/${token.name.toLowerCase()}/market_chart?vs_currency=usd&days=max&interval=daily`
            );
            const { data: todayHistory } = await axios.get(
              `https://api.coingecko.com/api/v3/coins/${token.name.toLowerCase()}/market_chart?vs_currency=usd&days=1&interval=hourly`
            );
            const data = {
              id,
              ticker: token.ticker,
              name: token.name,
              price: todayHistory.prices[todayHistory.prices.length - 1][1],
              priceHistory: {},
            };
            for (const priceData of todayHistory.prices)
              data.priceHistory[
                dayjs(priceData[0]).format("MMM DD, YYYY hh:mm:ss A")
              ] = priceData[1];

            for (const priceData of history.prices)
              data.priceHistory[dayjs(priceData[0]).format("MMM DD, YYYY")] =
                priceData[1];

            setItems((val) => [...val, data as WatchlistItem]);
          } catch {}
          continue;
        }
        try {
          const data: WatchlistItem = {
            id,
            ...(await client.getPrice(id)),
            priceHistory: await client.getPriceHistory(id),
          };

          setItems((val) => [...val, data]);
        } catch {}
      }

      setItems((val) =>
        val.filter((watchlistItem) => tokenIDs.includes(watchlistItem.id))
      );
      localStorage.setItem(store_name, JSON.stringify(tokenIDs));
    })();
  }, [tokenIDs, tokens]);

  // save period data
  useEffect(() => {
    localStorage.setItem(watchlistPeriod, selectedPeriod);
  }, [selectedPeriod]);

  // load all tokens
  useEffect(() => {
    (async () => {
      const res = await client.getTokens();
      setTokens([
        { id: "AR", name: "Arweave", ticker: "AR" },
        { id: "ETH", name: "Ethereum", ticker: "ETH" },
        ...res,
      ]);
      tokenSelect.setState(res[0].id);
    })();
  }, []);

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
          <AnimatePresence>
            {editMode && (
              <motion.div {...opacityAnimation()} style={{ display: "flex" }}>
                <Tooltip text="Add new">
                  <button
                    className="Btn"
                    onClick={() => addTokenModal.setState(true)}
                  >
                    <PlusIcon />
                  </button>
                </Tooltip>
                <Spacer x={0.4} />
              </motion.div>
            )}
          </AnimatePresence>
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
              const timeType =
                (selectedPeriod === "24h" && "day") ||
                (selectedPeriod === "1w" && "week") ||
                (selectedPeriod === "1m" && "month") ||
                "year";

              if (
                timeType !== "day" &&
                (item.id === "AR" || item.id === "ETH") &&
                date.match(/([+-]?\d\d):(\d\d) (AM|PM)$/)
              )
                return false;

              if (selectedPeriod === "ALL") return true;
              return dayjs(new Date(date)).isAfter(
                dayjs().subtract(1, timeType)
              );
            };
            const prices = Object.keys(item.priceHistory)
              .filter((date) => filterDates(date))
              .map((key) => ({
                date: key,
                price: item.priceHistory[key],
              }))
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime()
              );

            if (selectedPeriod === "24h")
              for (const pEl of prices)
                pEl.date = dayjs(pEl.date).format("h:m A");

            return (
              <motion.div
                className={
                  styles.WatchlistItem + " " + (editMode ? styles.Edit : "")
                }
                key={i}
                {...cardAnimation(i)}
                onClick={() => {
                  if (!editMode) return;
                  setTokenIDs((val) => val.filter((id) => id !== item.id));
                  setToast({
                    description: "Removed item",
                    type: "success",
                    duration: 1700,
                  });
                }}
              >
                <div className={styles.Data}>
                  <h1 className={styles.Ticker}>{item.ticker}</h1>
                  <h1 className={styles.Price}>
                    {(item.id === "AR" || item.id === "ETH") && "$"}
                    {(item.price ?? 0).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                    {item.id !== "AR" && item.id !== "ETH" && <span>AR</span>}
                    <AnimatePresence>
                      {prices[0]?.price && prices[0].price !== item.price && (
                        <motion.span
                          {...opacityAnimation()}
                          className={
                            (prices[0].price < item.price && styles.Positive) ||
                            styles.Negative
                          }
                        >
                          {prices[0].price < item.price && "+"}
                          {(
                            ((item.price - prices[0].price) / prices[0].price) *
                            100
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 2,
                          })}
                          %
                        </motion.span>
                      )}
                    </AnimatePresence>
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
                        `${
                          ((item.id === "AR" || item.id === "ETH") && "$") || ""
                        }${Number(value).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                          minimumFractionDigits: 2,
                        })}${
                          (item.id !== "AR" && item.id !== "ETH" && " AR") || ""
                        }`,
                    })}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {items.length === 0 && (
        <p className="NoItemsText">
          No items in watchlist. Try <Spacer x={0.23} />
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => addTokenModal.setState(true)}
          >
            adding one?
          </span>
        </p>
      )}
      <Modal {...addTokenModal.bindings}>
        <Modal.Title>Add new</Modal.Title>
        <Modal.Content>
          <p style={{ textAlign: "center" }}>
            Add a new token to your watchlist
          </p>
          <Select
            label="Select token"
            {...tokenSelect.bindings}
            className={styles.SelectToken}
          >
            {tokens
              .filter(({ id }) => !tokenIDs.includes(id))
              .map((token, i) => (
                <option value={token.id} key={i}>
                  {token.ticker}
                </option>
              ))}
          </Select>
          <Spacer y={1.75} />
          <Button
            small
            style={{ margin: "0 auto" }}
            disabled={!tokenSelect.state}
            onClick={() => {
              if (!tokenSelect.state || tokenIDs.includes(tokenSelect.state))
                return;
              setTokenIDs((val) => [...val, tokenSelect.state]);
              setToast({
                description: `Added ${
                  tokens.find(({ id }) => id === tokenSelect.state)?.ticker ??
                  tokenSelect.state
                } to watchlist`,
                type: "success",
                duration: 2100,
              });
              tokenSelect.setState(
                tokens.filter(({ id }) => !tokenIDs.includes(id))[0]?.id ??
                  undefined
              );
              addTokenModal.setState(false);
            }}
          >
            Add
          </Button>
        </Modal.Content>
      </Modal>
    </>
  );
};

export default Watchlist;
