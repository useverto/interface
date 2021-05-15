import {
  Avatar,
  Button,
  Modal,
  Popover,
  Spacer,
  useModal,
  useTheme,
} from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { permissions } from "../utils/arconnect";
import {
  BellIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "@iconicicons/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { UserInterface } from "@verto/js/dist/faces";
import { formatAddress } from "../utils/format";
import { randomEmoji } from "../utils/user";
import { RootState } from "../store/reducers";
import { useSelector, useDispatch } from "react-redux";
import { updateAddress, updateTheme } from "../store/actions";
import useArConnect from "use-arconnect";
import Link from "next/link";
import Verto from "@verto/js";
import styles from "../styles/components/Nav.module.sass";

const client = new Verto();

const Nav = () => {
  const address = useSelector((state: RootState) => state.addressReducer);
  const arconnect = useArConnect();
  const router = useRouter();
  const items: Item[] = ["app", "space", "swap", "orbit"];
  const [selectedItem, setSelectedItem] = useState<Item>();
  const [selectionPos, setSelectionPos] = useState<{
    x: number;
    width: number;
  }>({
    x: 0,
    width: 0,
  });
  const [user, setUser] = useState<UserInterface>(null);
  const [noIDUser, setNoIDUser] = useState({
    avatar: "",
    name: "",
  });
  const signOutModal = useModal();
  const dispatch = useDispatch();
  const theme = useTheme();

  useEffect(() => {
    router.events.on("routeChangeComplete", syncSelected);
    router.events.on("routeChangeError", syncSelected);

    return () => {
      router.events.off("routeChangeComplete", syncSelected);
      router.events.off("routeChangeError", syncSelected);
    };
  });

  useEffect(syncSelected, [router.asPath]);

  // set user data
  useEffect(() => {
    window.addEventListener("arweaveWalletLoaded", syncAddress);

    return () => {
      window.removeEventListener("arweaveWalletLoaded", syncAddress);
    };
  }, []);

  // random user avatar for users without an ID
  // and get current wallet name
  useEffect(() => {
    if (!address || user) return;
    setNoIDUser((val) => ({
      ...val,
      avatar: randomEmoji(),
    }));

    (async () => {
      const walletNames = await window.arweaveWallet.getWalletNames();

      setNoIDUser((val) => ({
        ...val,
        name: walletNames[address],
      }));
    })();
  }, [user, address]);

  function syncSelected() {
    const route = router.asPath.toLowerCase().split("/")[1] as Item;
    if (!items.includes(route)) return setSelectedItem(undefined);
    setSelectedItem(route);
  }

  function updateSelectionPos(el: HTMLAnchorElement | undefined, item: Item) {
    if (!el) return;
    if (
      selectedItem === item &&
      (selectionPos.width !== el.clientWidth ||
        selectionPos.x !== el.offsetLeft)
    )
      setSelectionPos({
        width: el.clientWidth,
        x: el.offsetLeft,
      });
  }

  useEffect(() => {
    if (address) {
      client.getUser(address).then((res) => setUser(res));
      window.addEventListener("walletSwitch", syncAddress);
    }

    return () => {
      window.removeEventListener("walletSwitch", syncAddress);
    };
  }, [address]);

  async function login() {
    await window.arweaveWallet.connect(permissions);
    await syncAddress();
  }

  async function signOut() {
    await window.arweaveWallet.disconnect();
    dispatch(updateAddress(null));
    signOutModal.setState(false);
    router.push("/");
  }

  async function syncAddress(e?: CustomEvent<{ address: string }>) {
    if (e && e?.detail?.address)
      return dispatch(updateAddress(e.detail.address));
    try {
      dispatch(updateAddress(await window.arweaveWallet.getActiveAddress()));
    } catch {
      dispatch(updateAddress(null));
    }
  }

  return (
    <>
      <motion.div
        className={styles.Nav}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.44, ease: "easeInOut" }}
      >
        <Link href={address && router.asPath !== "/app" ? "/app" : "/"}>
          <a className={styles.Logo}>
            <img src="/logo_light.svg" alt="V" draggable={false} />
          </a>
        </Link>
        <AnimatePresence>
          {arconnect && address && (
            <motion.div
              className={styles.Menu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.21, ease: "easeInOut" }}
            >
              <Link href="/app">
                <a
                  className={selectedItem === "app" ? styles.Selected : ""}
                  ref={(el) => updateSelectionPos(el, "app")}
                >
                  Home
                </a>
              </Link>
              <Link href="/space">
                <a
                  className={selectedItem === "space" ? styles.Selected : ""}
                  ref={(el) => updateSelectionPos(el, "space")}
                >
                  Space
                </a>
              </Link>
              <Link href="/swap">
                <a
                  className={selectedItem === "swap" ? styles.Selected : ""}
                  ref={(el) => updateSelectionPos(el, "swap")}
                >
                  Swap
                </a>
              </Link>
              <Link href="/orbit">
                <a
                  className={selectedItem === "orbit" ? styles.Selected : ""}
                  ref={(el) => updateSelectionPos(el, "orbit")}
                >
                  Orbit
                </a>
              </Link>
              <AnimatePresence>
                {selectedItem && selectionPos.width !== 0 && (
                  <motion.div
                    className={styles.Selection}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.21, ease: "easeInOut" }}
                    style={{
                      width: selectionPos.width + 26,
                      left: selectionPos.x - 13,
                    }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        {(arconnect && address && (
          <Popover
            position="bottom"
            className={styles.UserPopover}
            closeOnClick
            content={
              <>
                <Link href={`/@${user ? user.username : address}`}>
                  <a className={styles.MenuItem}>
                    <UserIcon />
                    View profile
                  </a>
                </Link>
                <div className={styles.MenuItem}>
                  <BellIcon />
                  Notifications
                </div>
                <div
                  className={styles.MenuItem}
                  onClick={() =>
                    dispatch(updateTheme(theme === "Dark" ? "Light" : "Dark"))
                  }
                >
                  {(theme === "Dark" && <MoonIcon />) || <SunIcon />}
                  {theme}
                </div>
                <div
                  className={styles.MenuItem}
                  onClick={() => signOutModal.setState(true)}
                >
                  <LogOutIcon />
                  Sign out
                </div>
              </>
            }
          >
            {/** TODO: notifications */}
            {user ? (
              <Avatar
                size="small"
                usertag={user.username}
                name={user.name}
                avatar={`https://arweave.net/${user.image}`}
                left
                notification={true}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <Avatar
                size="small"
                usertag={formatAddress(address, 20)}
                name={noIDUser.name}
                avatar={noIDUser.avatar}
                left
                notification={true}
                style={{ cursor: "pointer" }}
              />
            )}
          </Popover>
        )) ||
          (arconnect && (
            <Button small onClick={login}>
              Connect
            </Button>
          )) || (
            <Button small onClick={() => window.open("https://arconnect.io")}>
              Install ArConnect
            </Button>
          )}
      </motion.div>
      <Modal {...signOutModal.bindings}>
        <Modal.Title>Are you sure?</Modal.Title>
        <Modal.Content>
          <p className={styles.SignOutAlert}>Do you really want to sign out?</p>
          <Spacer y={2.5} />
          <Button small onClick={signOut} className={styles.SignOutBtn}>
            Sign Out
          </Button>
        </Modal.Content>
      </Modal>
    </>
  );
};

type Item = "app" | "space" | "swap" | "orbit";

export default Nav;
