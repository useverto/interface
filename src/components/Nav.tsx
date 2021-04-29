import { Avatar, Button } from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { permissions, useAddress } from "../utils/arconnect";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useArConnect from "use-arconnect";
import Link from "next/link";
import styles from "../styles/components/Nav.module.sass";
import Verto from "@verto/js";
import { UserInterface } from "@verto/js/dist/faces";

const client = new Verto();

const Nav = () => {
  const { address, updateAddress } = useAddress();
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

  useEffect(() => {
    router.events.on("routeChangeComplete", syncSelected);
    router.events.on("routeChangeError", syncSelected);

    return () => {
      router.events.off("routeChangeComplete", syncSelected);
      router.events.off("routeChangeError", syncSelected);
    };
  });

  useEffect(syncSelected, [router.asPath]);

  async function login() {
    await window.arweaveWallet.connect(permissions);
    await updateAddress();
  }

  function syncSelected() {
    const route = router.asPath.toLowerCase().replace(/^\//, "") as Item;
    if (!items.includes(route)) return;
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

  const [user, setUser] = useState<UserInterface>(null);
  useEffect(() => {
    if (address) {
      client.getUser(address).then((res) => setUser(res));
    }
  }, [address]);

  return (
    <motion.div
      className={styles.Nav}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.44, ease: "easeInOut" }}
    >
      <Link href="/">
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
        <>
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
            <Button small disabled>
              Disconnect
            </Button>
          )}
        </>
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
  );
};

type Item = "app" | "space" | "swap" | "orbit";

export default Nav;
