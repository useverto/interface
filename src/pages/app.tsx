import { UserInterface } from "@verto/js/dist/common/faces";
import {
  Card,
  Loading,
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
import {
  arPrice,
  gateway,
  USD_STABLECOIN_ID,
  verto as client,
} from "../utils/arweave";
import {
  fetchArtworkMetadata,
  fetchLatestPrice,
  UserBalance,
} from "verto-cache-interface";
import { useRouter } from "next/router";
import Balance from "../components/Balance";
import Head from "next/head";
import Metas from "../components/Metas";
import Watchlist from "../components/Watchlist";
import Link from "next/link";
import ListingModal from "../components/ListingModal";
import styles from "../styles/views/app.module.sass";

const App = () => {
  const address = useSelector((state: RootState) => state.addressReducer);
  const [showMorePsts, setShowMorePsts] = useState(false);
  const theme = useTheme();

  const router = useRouter();
  const listModal = useModal();
  const { setToast } = useToasts();

  // load current user
  const [user, setUser] = useState<UserInterface | null>();

  useEffect(() => {
    if (!address) return;
    client.user.getUser(address).then((res) => setUser(res ?? null));
  }, [address]);

  // load balances for user
  const [balances, setBalances] = useState<UserBalance[]>();

  // load owned arts for user
  const [owned, setOwned] = useState<OwnedInterface[]>();

  type OwnedInterface = UserBalance & {
    price?: number;
    lister: UserInterface;
  };

  useEffect(() => {
    (async () => {
      if (!address) return;

      setOwned(undefined);
      setBalances(undefined);

      // get owned art tokens
      const allBalances = await client.user.getBalances(
        user?.username || address
      );

      // set community balances
      setBalances(allBalances.filter(({ type }) => type === "community"));

      const ownedArts = allBalances.filter(({ type }) => type === "art");

      if (ownedArts.length === 0) return setOwned([]);

      for (const art of ownedArts.slice(0, 4)) {
        const artData = await fetchArtworkMetadata(art.contractId);

        if (!artData) continue;
        let price: number = undefined;

        // load price based on the dominant token
        try {
          const priceData = await fetchLatestPrice([
            art.contractId,
            USD_STABLECOIN_ID,
          ]);

          if (priceData?.dominantToken === art.contractId) {
            price = priceData.vwap;
          } else if (priceData?.dominantToken === USD_STABLECOIN_ID) {
            price = 1 / priceData.vwap;
          }
        } catch {}

        setOwned((val) => [
          ...(val ?? []),
          {
            ...art,
            lister: artData.lister,
            price,
          },
        ]);
      }
    })();
  }, [user, address]);

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
                if (!user)
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
        {(balances &&
          balances
            .sort((a, b) => b.balance - a.balance)
            .map(
              (item, i) =>
                (showMorePsts || i < 4) && (
                  <motion.div key={i} {...cardListAnimation(i)}>
                    <Card.Balance
                      id={item.contractId}
                      name={item.name}
                      ticker={item.ticker ?? ""}
                      balance={item.balance}
                      logo={{
                        light: `/api/logo/${
                          item.contractId
                        }?theme=${theme.toLowerCase()}`,
                      }}
                    />
                    <Spacer y={1.5} />
                  </motion.div>
                )
            )) || <Loading.Spinner style={{ margin: "0 auto" }} />}
      </AnimatePresence>
      <AnimatePresence>
        {balances?.length > 4 && (
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
      {balances && balances?.length === 0 && (
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
            {owned &&
              owned.slice(0, 4).map((collectible, i) => (
                <motion.div {...cardAnimation(i)} key={i}>
                  <Card.Asset
                    name={collectible.name}
                    userData={{
                      avatar: collectible.lister.image
                        ? `${gateway()}/${collectible.lister.image}`
                        : null,
                      name: collectible.lister.name,
                      usertag: collectible.lister.username,
                    }}
                    price={collectible.price ?? 0}
                    image={`${gateway()}/${collectible.contractId}`}
                    reverse={theme === "Light"}
                    onClick={() =>
                      router.push(`/space/${collectible.contractId}`)
                    }
                  />
                </motion.div>
              ))}
          </AnimatePresence>
          <AnimatePresence>
            {owned && owned.length > 0 && (
              <motion.div className={styles.ViewAll} {...opacityAnimation()}>
                <Link href={`/@${user?.username ?? address}/owns`}>
                  <a>
                    View all
                    <ArrowRightIcon />
                  </a>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          {(owned && owned.length === 0 && (
            <p className={styles.NoOwned}>
              You do not own any collectibles. <br />
              Consider checking out <Link href="/space">Space</Link>
            </p>
          )) ||
            (!owned && <Loading.Spinner className={styles.LoadingOwnedArts} />)}
          {/** Placeholder */}
          {(!owned || owned.length === 0) && (
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
