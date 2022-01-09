import { UserInterface } from "@verto/js/dist/faces";
import {
  Card,
  Page,
  Spacer,
  Tooltip,
  useModal,
  useTheme,
  useToasts,
} from "@verto/ui";
import { useEffect, useState } from "react";
import { RootState } from "../store/reducers";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  cardAnimation,
  cardListAnimation,
  opacityAnimation,
} from "../utils/animations";
import {
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ArrowRightIcon,
} from "@iconicicons/react";
import { arPrice, CACHE_URL, verto as client } from "../utils/arweave";
import { fetchArtworkMetadata, UserBalance } from "verto-cache-interface";
import { useRouter } from "next/router";
import Balance from "../components/Balance";
import Head from "next/head";
import Metas from "../components/Metas";
import Watchlist from "../components/Watchlist";
import axios from "axios";
import Link from "next/link";
import ListingModal from "../components/ListingModal";
import styles from "../styles/views/app.module.sass";

const App = () => {
  const [balances, setBalances] = useState<UserBalance[]>([]);
  const address = useSelector((state: RootState) => state.addressReducer);
  const [showMorePsts, setShowMorePsts] = useState(false);
  const theme = useTheme();
  const [owned, setOwned] = useState([]);
  const [userData, setUserData] = useState<UserInterface>();
  const [loadingOwned, setLoadingOwned] = useState(true);
  const router = useRouter();
  const listModal = useModal();
  const { setToast } = useToasts();

  useEffect(() => {
    if (!address) return;
    setBalances([]);
    setOwned([]);
    setLoadingOwned(true);

    (async () => {
      const user = (await client.user.getUser(address)) ?? null;
      setUserData(user);

      // TODO: use new cache
      const { data: ownedCollectibles } = await axios.get(
        `${CACHE_URL}/user/${user?.username ?? address}/owns`
      );

      setOwned(
        await Promise.all(
          ownedCollectibles.map(async (artoworkID: string) => {
            const data = await fetchArtworkMetadata(artoworkID);

            return {
              ...data,
              owner: {
                ...data.lister,
                image: data.lister.image
                  ? `https://arweave.net/${data.owner.image}`
                  : undefined,
              },
              price:
                (await arPrice()) * (await client.getPrice(artoworkID)).price,
            };
          })
        )
      );
      setLoadingOwned(false);

      if (user) {
        for (const addr of user.addresses) {
          const addressBalances = await client.user.getBalances(addr);

          setBalances((val) =>
            [
              ...val.filter(
                (existingBalance) =>
                  !addressBalances.find(
                    ({ contractId }) =>
                      contractId === existingBalance.contractId
                  )
              ),
              ...addressBalances.map((addBalance) => ({
                ...addBalance,
                balance:
                  addBalance.balance +
                  (val.find(
                    ({ contractId }) => contractId === addBalance.contractId
                  )?.balance ?? 0),
              })),
            ].filter(
              ({ contractId }) => !ownedCollectibles.includes(contractId)
            )
          );
        }
      } else
        setBalances(
          (await client.user.getBalances(address)).filter(
            ({ contractId }) => !ownedCollectibles.includes(contractId)
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
        <div className="ActionSheet">
          <Tooltip text="List new">
            <button
              className="Btn"
              onClick={() => {
                if (!userData)
                  return setToast({
                    description: "Please setup your Verto ID first",
                    type: "error",
                    duration: 5300,
                  });
                listModal.setState(true);
              }}
            >
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
                  id={item.contractId}
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
        <div className={styles.OwnedList}>
          <AnimatePresence>
            {owned.slice(0, 4).map((collectible, i) => (
              <motion.div {...cardAnimation(i)} key={i}>
                <Card.Asset
                  name={collectible.name}
                  userData={{
                    avatar: collectible.owner.image,
                    name: collectible.owner.name,
                    usertag: collectible.owner.username,
                  }}
                  price={collectible.price ?? 0}
                  image={`https://arweave.net/${collectible.id}`}
                  reverse={theme === "Light"}
                  onClick={() => router.push(`/space/${collectible.id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {owned.length > 0 && (
              <motion.div className={styles.ViewAll} {...opacityAnimation()}>
                <Link href={`/@${userData?.username ?? address}/owns`}>
                  <a>
                    View all
                    <ArrowRightIcon />
                  </a>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          {!loadingOwned && owned.length === 0 && (
            <p className={styles.NoOwned}>
              You do not own any collectibles. <br />
              Consider checking out <Link href="/space">Space</Link>
            </p>
          )}
          {/** Placeholder */}
          {owned.length === 0 && (
            <Card.Asset
              name=""
              userData={{ avatar: undefined, usertag: "...", name: "..." }}
              price={0}
              image={"/logo_dark.svg"}
              style={{ opacity: 0 }}
            />
          )}
        </div>
      </div>
      <ListingModal {...listModal.bindings} />
    </Page>
  );
};

export default App;
