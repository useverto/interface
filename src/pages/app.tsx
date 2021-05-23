import { BalanceInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer, Tooltip, useTheme } from "@verto/ui";
import { useEffect, useState } from "react";
import { RootState } from "../store/reducers";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  cardAnimation,
  cardListAnimation,
  opacityAnimation,
} from "../utils/animations";
import { PlusIcon, ChevronUpIcon, ChevronDownIcon } from "@iconicicons/react";
import { arPrice } from "../utils/arweave";
import Balance from "../components/Balance";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../components/Metas";
import Watchlist from "../components/Watchlist";
import axios from "axios";
import styles from "../styles/views/app.module.sass";

const client = new Verto();

const App = () => {
  const [balances, setBalances] = useState<BalanceInterface[]>([]);
  const address = useSelector((state: RootState) => state.addressReducer);
  const [showMorePsts, setShowMorePsts] = useState(false);
  const theme = useTheme();
  const [owned, setOwned] = useState<ArtworkInterface[]>([]);

  useEffect(() => {
    if (!address) return;
    setBalances([]);
    setOwned([]);

    (async () => {
      const user = (await client.getUser(address)) ?? null;
      const { data: ownedCollectibles } = await axios.get(
        `https://v2.cache.verto.exchange/user/${user?.username ?? address}/owns`
      );

      setOwned(
        await Promise.all(
          ownedCollectibles.map(async (artoworkID: string) => ({
            ...(
              await axios.get(`https://v2.cache.verto.exchange/${artoworkID}`)
            ).data,
            id: artoworkID,
            price:
              (await arPrice()) * (await client.getPrice(artoworkID)).price,
          }))
        )
      );

      if (user) {
        for (const addr of user.addresses) {
          const addressBalances = await client.getBalances(addr);

          setBalances((val) =>
            [
              ...val.filter(
                (existingBalance) =>
                  !addressBalances.find(({ id }) => id === existingBalance.id)
              ),
              ...addressBalances.map((addBalance) => ({
                ...addBalance,
                balance:
                  addBalance.balance +
                  (val.find(({ id }) => id === addBalance.id)?.balance ?? 0),
              })),
            ].filter(({ id }) => !ownedCollectibles.includes(id))
          );
        }
      } else
        setBalances(
          (await client.getBalances(address)).filter(
            ({ id }) => !ownedCollectibles.includes(id)
          )
        );
    })();
  }, [address]);

  return (
    <Page>
      <Head>
        <title>Verto - Home</title>
        <Metas title="Home" />
      </Head>
      <Spacer y={3} />
      <Balance />
      <Spacer y={4} />
      <Watchlist />
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
            (showMorePsts || i < 4) && (
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
                <Spacer y={1.5} />
              </motion.div>
            )
        )}
      </AnimatePresence>
      <AnimatePresence>
        {balances.length > 4 && (
          <motion.div {...opacityAnimation()}>
            <Spacer y={1} />
            <span
              className="ShowMore"
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
          </motion.div>
        )}
      </AnimatePresence>
      {balances.length === 0 && (
        <p className="NoItemsText">Nothing in wallet</p>
      )}
      <Spacer y={4} />
      <div
        className={
          styles.OwnedCollectibles +
          " " +
          (theme === "Dark" ? styles.DarkOwned : "")
        }
      >
        <h1 className="Title">Owned collectibles</h1>
        <Spacer y={2} />
        <AnimatePresence>
          {owned.map((collectible, i) => (
            <motion.div {...cardAnimation(i)} key={i}>
              <Card.Asset
                name={collectible.name}
                // TODO
                userData={{
                  avatar: "https://th8ta.org/marton.jpeg",
                  usertag: "martonlederer",
                  name: "Marton Lederer",
                }}
                price={collectible.price ?? 0}
                image={`https://arweave.net/${collectible.id}`}
                reverse={theme === "Light"}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Page>
  );
};

export default App;

interface ArtworkInterface {
  state: {
    name: string;
    ticker: string;
    description: string;
    balances: Record<string, number>;
  };
  price: number;
  [key: string]: any;
}
