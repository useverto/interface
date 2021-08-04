import { BalanceInterface, UserInterface } from "@verto/js/dist/faces";
import {
  Card,
  Modal,
  Page,
  Spacer,
  Tooltip,
  useModal,
  useTheme,
  useToasts,
  Avatar,
  Button,
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
  ChevronRightIcon,
} from "@iconicicons/react";
import {
  arPrice,
  CACHE_URL,
  INVITE_CONTRACT,
  isAddress,
  client as arweave,
} from "../utils/arweave";
import { useRouter } from "next/router";
import { formatAddress } from "../utils/format";
import { interactWrite } from "smartweave";
import Balance from "../components/Balance";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../components/Metas";
import Watchlist from "../components/Watchlist";
import axios from "axios";
import Link from "next/link";
import ListingModal from "../components/ListingModal";
import styles from "../styles/views/app.module.sass";

const client = new Verto();

const App = () => {
  const [balances, setBalances] = useState<BalanceInterface[]>([]);
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
      const user = (await client.getUser(address)) ?? null;
      setUserData(user);

      const { data: ownedCollectibles } = await axios.get(
        `${CACHE_URL}/user/${user?.username ?? address}/owns`
      );

      setOwned(
        await Promise.all(
          ownedCollectibles.map(async (artoworkID: string) => {
            const { data } = await axios.get(
              `${CACHE_URL}/site/artwork/${artoworkID}`
            );
            return {
              ...data,
              owner: {
                ...data.owner,
                image: data.owner.image
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

  //
  // INVITES
  //

  const inviteModal = useModal();
  const [inviteAddress, setInviteAddress] = useState("");

  useEffect(() => {
    (async () => {
      if (!router.query.invite || !isAddress(router.query.invite.toString()))
        return;
      setInviteAddress(router.query.invite.toString());

      const { data } = await axios.get(`${CACHE_URL}/${INVITE_CONTRACT}`);
      const invitesLeft = data.invites?.[address] ?? 0;

      if (invitesLeft < 1 || data.balances?.[address] > 0) return;

      inviteModal.setState(true);
    })();
  }, [router.query]);

  const [loadingInvite, setLoadingInvite] = useState(false);

  async function inviteUser() {
    if (!isAddress(inviteAddress)) return;

    setLoadingInvite(true);
    try {
      await interactWrite(arweave, "use_wallet", INVITE_CONTRACT, {
        function: "invite",
        target: inviteAddress,
      });

      inviteModal.setState(false);
      setToast({
        description: `${formatAddress(
          inviteAddress,
          20
        )} has been sent an invite.`,
        type: "success",
        duration: 2400,
      });
    } catch {
      setToast({
        description: "Error inviting address",
        type: "error",
        duration: 2300,
      });
    }
    setLoadingInvite(false);
  }

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
      <Modal {...inviteModal.bindings}>
        <Modal.Title>Invite someone</Modal.Title>
        <Modal.Content>
          <p className={styles.InviteModalText}>
            Do you want to invite this address to the beta testing?
          </p>
          <Spacer y={2} />
          <div className={styles.InviteModalUser}>
            <Avatar
              displaytag={formatAddress(inviteAddress, 12)}
              usertag={inviteAddress}
              name=""
            />
            <a
              className={styles.ViewBlock}
              href={`https://viewblock.io/arweave/address/${inviteAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ChevronRightIcon />
            </a>
          </div>
          <Spacer y={3} />
          <div className={styles.InviteModalActions}>
            <Button small onClick={inviteUser} loading={loadingInvite}>
              Invite
            </Button>
            <Button
              small
              type="secondary"
              onClick={() => inviteModal.setState(false)}
            >
              Cancel
            </Button>
          </div>
        </Modal.Content>
      </Modal>
    </Page>
  );
};

export default App;
