import {
  Avatar,
  Button,
  Input,
  Modal,
  Popover,
  Spacer,
  useInput,
  useModal,
  useTheme,
  useToasts,
} from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { permissions } from "../utils/arconnect";
import {
  BellIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  UserPlusIcon,
  SearchIcon,
  DollarIcon,
} from "@iconicicons/react";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { UserInterface } from "@verto/js/dist/faces";
import { formatAddress } from "../utils/format";
import { RootState } from "../store/reducers";
import { useSelector, useDispatch } from "react-redux";
import { updateAddress, updateTheme } from "../store/actions";
import { client as arweave, isAddress, CACHE_URL } from "../utils/arweave";
import { interactWrite } from "smartweave";
import useArConnect from "use-arconnect";
import Link from "next/link";
import Verto from "@verto/js";
import SetupModal from "./SetupModal";
import Search, { useSearch } from "./Search";
import axios from "axios";
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
  const theme = useSelector((state: RootState) => state.themeReducer);
  const displayTheme = useTheme();

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
      avatar: undefined,
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

  const setupModal = useModal();

  async function login() {
    await window.arweaveWallet.connect(permissions, { name: "Verto" });
    await syncAddress();

    const user = await client.getUser(
      await window.arweaveWallet.getActiveAddress()
    );
    if (!user) setupModal.setState(true);
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

  const search = useSearch();

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
            <img
              src={`/logo_${displayTheme.toLowerCase()}.svg`}
              alt="V"
              draggable={false}
            />
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
                  <a
                    className={
                      styles.MenuItem +
                      " " +
                      (displayTheme === "Dark" ? styles.Dark : "")
                    }
                  >
                    <UserIcon />
                    View profile
                  </a>
                </Link>
                <div
                  className={
                    styles.MenuItem +
                    " " +
                    (displayTheme === "Dark" ? styles.Dark : "") +
                    " " +
                    styles.DisabledMenuItem
                  }
                >
                  <BellIcon />
                  Notifications
                </div>
                <div
                  className={
                    styles.MenuItem +
                    " " +
                    (displayTheme === "Dark" ? styles.Dark : "")
                  }
                  onClick={() => {
                    new RampInstantSDK({
                      hostAppName: "Verto",
                      hostLogoUrl:
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMzE2Ljg0IDkuMTUxMThDNDQ5Ljc2OCA0Ni4wNDEgNTI3LjczOSAxODMuOTEyIDQ5MC44NDkgMzE2Ljg0QzQ1My45NTkgNDQ5Ljc2OCAzMTYuMDg4IDUyNy43MzkgMTgzLjE2IDQ5MC44NDlDNTAuMjMxOSA0NTMuOTU5IC0yNy43MzkgMzE2LjA4OCA5LjE1MTE4IDE4My4xNkM0Ni4wNDEgNTAuMjMxOSAxODMuOTEyIC0yNy43MzkgMzE2Ljg0IDkuMTUxMThaTTI4Mi41MjggMjc4LjE3MkMzMzcuNTY1IDI5My40MDggMzcwLjE0MSAzNTAuMDQzIDM1NS42MzkgNDA1LjI3OEMzNDEuMTM3IDQ2MC41MTIgMjg0LjkzOSA0OTMuODQgMjI5LjUxNyA0ODAuMDczQzIyOS4xMTIgNDc5Ljk2NCAyMjguNzA2IDQ3OS44NTYgMjI4LjMgNDc5Ljc0OEMyMjcuMzcyIDQ3OS41IDIyNi40NDIgNDc5LjI1MSAyMjUuNTEzIDQ3OC45OTRDMTMzLjczOSA0NTMuNTI1IDgyLjk3MTYgMzQzLjk4MyAxMDYuOTY0IDIyOS40NUwyODIuNTI4IDI3OC4xNzJaTTE0NC4zNjIgOTQuNzIyQzEyOS44NiAxNDkuOTU3IDE2Mi40MzcgMjA2LjU5MiAyMTcuNDczIDIyMS44MjhMMzkzLjAzNyAyNzAuNTVDNDE3LjAzIDE1Ni4wMTcgMzY2LjI2MiA0Ni40NzU0IDI3NC40ODggMjEuMDA2M0MyNzMuNTQ1IDIwLjc0NDYgMjcyLjYwMSAyMC40OTI2IDI3MS42NTkgMjAuMjQxMUMyNzEuMjY3IDIwLjEzNjUgMjcwLjg3NSAyMC4wMzIgMjcwLjQ4NCAxOS45MjY5QzIxNS4wNjIgNi4xNjA1MyAxNTguODY1IDM5LjQ4NzQgMTQ0LjM2MiA5NC43MjJaIiBmaWxsPSJibGFjayIvPgo8L3N2Zz4K",
                      variant: "auto",
                      swapAsset: "AR",
                      userAddress: address,
                      hostApiKey: "vzszc8sq8z8ksrdxds6asctz2az8k6wx72xazdwb",
                    }).show();
                  }}
                >
                  <DollarIcon />
                  Buy AR
                </div>
                <div
                  className={
                    styles.MenuItem +
                    " " +
                    (displayTheme === "Dark" ? styles.Dark : "")
                  }
                  onClick={() => search.setOpen(true)}
                >
                  <SearchIcon />
                  Search
                </div>
                <div
                  className={
                    styles.MenuItem +
                    " " +
                    (displayTheme === "Dark" ? styles.Dark : "")
                  }
                  onClick={() =>
                    dispatch(
                      updateTheme(
                        theme === "Dark"
                          ? "Light"
                          : theme === "Light"
                          ? "System"
                          : "Dark"
                      )
                    )
                  }
                >
                  {(theme === "Dark" && <MoonIcon />) ||
                    (theme === "Light" && <SunIcon />) || <MonitorIcon />}
                  {theme}
                </div>
                <div
                  className={
                    styles.MenuItem +
                    " " +
                    (displayTheme === "Dark" ? styles.Dark : "")
                  }
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
                //notification={true}
                style={{ cursor: "pointer" }}
              />
            ) : (
              <Avatar
                size="small"
                usertag={address}
                // @ts-ignore
                displaytag={formatAddress(address, 20)}
                name={noIDUser.name}
                avatar={noIDUser.avatar}
                left
                //notification={true}
                style={{ cursor: "pointer" }}
              />
            )}
          </Popover>
        )) || (
          <div className={styles.SearchAndConnect}>
            <SearchIcon
              className={styles.SearchIcon}
              onClick={() => search.setOpen(true)}
            />
            <Spacer x={1} />
            {(arconnect && (
              <Button small onClick={login}>
                Connect
              </Button>
            )) || (
              <Button small onClick={() => window.open("https://arconnect.io")}>
                Install ArConnect
              </Button>
            )}
          </div>
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
      <SetupModal {...setupModal.bindings} />
      <Search {...search} />
    </>
  );
};

type Item = "app" | "space" | "swap" | "orbit";

export default Nav;
