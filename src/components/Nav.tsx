import {
  Avatar,
  Button,
  Modal,
  Popover,
  Spacer,
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
  SearchIcon,
} from "@iconicicons/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { UserInterface } from "@verto/js/dist/common/faces";
import { formatAddress } from "../utils/format";
import { RootState } from "../store/reducers";
import { useSelector, useDispatch } from "react-redux";
import { updateAddress, updateTheme } from "../store/actions";
import { useMediaPredicate } from "react-media-hook";
import {
  gateway,
  verto as client,
  gatewayConfig,
  client as arweave,
} from "../utils/arweave";
import { navDesktopAnimation, navMobileAnimation } from "../utils/animations";
import Search, { useSearch } from "./Search";
import useArConnect from "use-arconnect";
import Link from "next/link";
import SetupModal from "./SetupModal";
import styles from "../styles/components/Nav.module.sass";
import axios from "axios";

const Nav = () => {
  const address = useSelector((state: RootState) => state.addressReducer);
  const arconnect = useArConnect();
  const router = useRouter();
  const items: Item[] = ["app", "space", "swap"];
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

  useEffect(() => {
    router.events.on("routeChangeComplete", syncSelected);
    router.events.on("routeChangeError", syncSelected);

    return () => {
      router.events.off("routeChangeComplete", syncSelected);
      router.events.off("routeChangeError", syncSelected);
    };
  });

  // sync the selection position with the current route
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
      client.user.getUser(address).then((res) => setUser(res));
      window.addEventListener("walletSwitch", syncAddress);
    }

    return () => {
      window.removeEventListener("walletSwitch", syncAddress);
    };
  }, [address]);

  const setupModal = useModal();
  const { setToast } = useToasts();

  async function login() {
    await window.arweaveWallet.connect(
      permissions,
      { name: "Verto" },
      gatewayConfig
    );
    await syncAddress();

    const addr = await window.arweaveWallet.getActiveAddress();
    const user = await client.user.getUser(addr);

    if (!user) setupModal.setState(true);

    try {
      // automint AR
      await arweave.api.get(`mint/${addr}/${arweave.ar.arToWinston("100")}`);

      // automint USDC
      await axios.get(`/api/faucet/${addr}`);

      setToast({
        description: "You have been autominted AR and USDC",
        type: "info",
        duration: 3600,
      });
    } catch (e) {
      console.warn("Wasn't able to automint AR or USDC: \n", e.messsage);
    }
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

  const theme = useSelector((state: RootState) => state.themeReducer);
  const displayTheme = useTheme();
  const blurTheme = useSelector((state: RootState) => state.navThemeReducer);

  // menu slide in / out animation on mobile
  const [menuShown, setMenuShown] = useState(true);
  const mobile = useMediaPredicate("(max-width: 720px)");

  // show / hide menu on mobile, using the menuShown state
  // and the previous scroll position
  useEffect(() => {
    // if the user enters / leaves mobile mode, toggle the menu
    setMenuShown(true);

    // only do the animation for mobile mode
    if (!mobile) return;

    // define the previous scroll position
    let previousScroll = 0;

    // handle scroll events
    const handleScroll = () => {
      // scroll sensitivity
      const sensitivity = 80;

      // if at the top, show the menu
      if (window.scrollY === 0) {
        setMenuShown(true);
        previousScroll = window.screenY;
        return;
      }

      // set the menu to hidden if the user is scrolling down
      setMenuShown(previousScroll > window.scrollY);

      // check sensitivity
      if (Math.abs(previousScroll - window.scrollY) < sensitivity) return;

      // update the previous scroll position
      previousScroll = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobile]);

  // check gateway, ensure it is TESTNET
  useEffect(() => {
    (async () => {
      if (!address) return;

      try {
        // user's arconnect gateway config
        const arconnectConfig = await window.arweaveWallet.getArweaveConfig();

        // check the config data
        if (
          arconnectConfig.host !== gatewayConfig.host ||
          arconnectConfig.protocol !== gatewayConfig.protocol ||
          arconnectConfig.port !== gatewayConfig.port
        ) {
          console.warn("Logged out for invalid gateway config (NOT TESTNET)");
          await signOut();
        }
      } catch (e) {
        // sign out
        console.warn("Logged out, could not get gateway config");
        console.error(e);
        await signOut();
      }
    })();
  }, [address]);

  return (
    <>
      <motion.div
        className={[
          styles.Nav,
          (displayTheme === "Dark" && styles.DarkNav) || "",
          (blurTheme !== "Default" && styles[blurTheme]) || "",
          (router.asPath === "/" && styles.Sticky) || "",
        ]
          .filter((val) => val !== "")
          .join(" ")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.44, ease: "easeInOut" }}
      >
        <Link href={address && router.asPath !== "/app" ? "/app" : "/"}>
          <a className={styles.Logo}>
            <img
              src={`/logo_${
                (blurTheme === "Default" && displayTheme.toLowerCase()) ||
                (blurTheme === "BlurDark" && "light") ||
                "dark"
              }.svg`}
              alt="V"
              draggable={false}
            />
            <span className={styles.VersionChip}>testnet</span>
          </a>
        </Link>
        <AnimatePresence>
          {arconnect && address && menuShown && (
            <motion.div
              className={styles.Menu}
              {...((mobile && navMobileAnimation) || navDesktopAnimation)}
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
                avatar={
                  (user.image && `${gateway()}/${user.image}`) || undefined
                }
                left
                //notification={true}
                style={{ cursor: "pointer" }}
                className={styles.UserAvatar}
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
                className={styles.UserAvatar}
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

type Item = "app" | "space" | "swap";

export default Nav;
