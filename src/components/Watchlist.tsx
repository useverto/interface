import { CheckIcon, EditIcon } from "@iconicicons/react";
import { PriceInterface } from "@verto/js/dist/faces";
import { Spacer, Tooltip } from "@verto/ui";
import { useEffect, useState } from "react";
import Verto from "@verto/js";
import styles from "../styles/components/Watchlist.module.sass";

const client = new Verto();
type WatchlistItem = PriceInterface & {
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
  const [items, setItems] = useState<PriceInterface[]>([]);

  // load saved token ids
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(store_name) ?? "[]");
    setTokenIDs(data);
  }, []);

  // load tokens
  useEffect(() => {
    (async () => {
      if (!tokenIDs) return;

      for (const id of tokenIDs)
        try {
          const data = {
            ...(await client.getPrice(id)),
            priceHistory: await client.getPriceHistory(id),
          };

          setItems((val) => [...val, data]);
        } catch {}

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
      {items.map((item, i) => (
        <div key={i}>{JSON.stringify(item, null, 2)}</div>
      ))}
    </>
  );
};

export default Watchlist;
