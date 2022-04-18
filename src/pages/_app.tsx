import {
  Button,
  Modal,
  Spacer,
  useModal,
  useToasts,
  VertoProvider,
} from "@verto/ui";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Provider as ReduxProvider,
  useDispatch,
  useSelector,
} from "react-redux";
import { RootState } from "../store/reducers";
import { updateNavTheme, updateTheme } from "../store/actions";
import { DisplayTheme } from "@verto/ui/dist/types";
import { permissions } from "../utils/arconnect";
import { fetchContract } from "verto-cache-interface";
import { client, COMMUNITY_CONTRACT, gateway } from "../utils/arweave";
import {
  ignorePermissionWarning,
  lastViewedChangelog,
  theme as themeStorageName,
} from "../utils/storage_names";
import { gt, valid } from "semver";
import pkg from "../../package.json";
import store from "../store";
import Progress from "nprogress";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import Head from "next/head";
import ChangelogModal from "../components/ChangelogModal";
import axios from "axios";
import * as Fathom from "fathom-client";
import betaAlertStyles from "../styles/components/BetaAlert.module.sass";
import "../styles/global.sass";
import "../styles/progress.sass";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [scheme, setScheme] = useState<"dark" | "light">("light");

  // proggress bar config
  Progress.configure({ showSpinner: false });

  useEffect(() => {
    router.events.on("routeChangeStart", () => Progress.start());
    router.events.on("routeChangeComplete", () => Progress.done());
    router.events.on("routeChangeError", () => Progress.done());

    return () => {
      router.events.off("routeChangeStart", () => Progress.start());
      router.events.off("routeChangeComplete", () => Progress.done());
      router.events.off("routeChangeError", () => Progress.done());
    };
  });

  // analytics
  useEffect(() => {
    // Initialize Fathom when the app loads
    // Example: yourdomain.com
    //  - Do not include https://
    //  - This must be an exact match of your domain.
    //  - If you're using www. for your domain, make sure you include that here.
    Fathom.load("NFVUFKXC", {
      includedDomains: ["verto.exchange", "www.verto.exchange"],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    // Record a pageview when route changes
    router.events.on("routeChangeComplete", onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
    };
  }, []);

  // dark / light scheme
  useEffect(() => {
    if (!window) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const updateScheme = (val) => setScheme(val.matches ? "dark" : "light");

    updateScheme(query);
    query.addEventListener("change", updateScheme);

    return () => {
      query.removeEventListener("change", updateScheme);
    };
  }, []);

  // login checks
  useEffect(() => {
    if (!window.arweaveWallet)
      window.addEventListener("arweaveWalletLoaded", checkLogin);
    else checkLogin();

    return () => {
      window.removeEventListener("arweaveWalletLoaded", checkLogin);
    };
  }, [router.asPath]);

  async function checkLogin() {
    const protectedRoutes = /\/(app|swap)/;
    const connected = (await window.arweaveWallet.getPermissions()).length > 0;

    if (router.asPath.match(protectedRoutes) && !connected) router.push("/");
  }

  // check for missing permissions
  const permissionsModal = useModal();

  useEffect(() => {
    window.addEventListener("arweaveWalletLoaded", checkPerms);

    return () => {
      window.removeEventListener("arweaveWalletLoaded", checkPerms);
    };
  });

  async function checkPerms() {
    const existingPerms = await window.arweaveWallet.getPermissions();
    const ignore = localStorage.getItem(ignorePermissionWarning);

    if (ignore && JSON.parse(ignore).val) return;

    if (existingPerms.length === 0) return;
    for (const perm of permissions)
      if (!existingPerms.includes(perm)) {
        permissionsModal.setState(true);
        break;
      }
  }

  return (
    <ReduxProvider store={store}>
      <Theme>
        <StatusChecker>
          <Head>
            <link
              rel="shortcut icon"
              href={scheme === "dark" ? "/logo_dark.svg" : "/logo_light.svg"}
              type="image/svg"
            />
            <link rel="manifest" href="/manifest.json" />
          </Head>
          <Nav />
          <Component {...pageProps} />
          <Footer />
          {/**<BetaAlert /> */}
          <Modal {...permissionsModal.bindings}>
            <Modal.Title>Missing permissions</Modal.Title>
            <Modal.Content style={{ textAlign: "justify" }}>
              A few permissions are missing. Some of them are essential for
              Verto to work. Please allow these to use Verto to it's full
              potential.
              <Spacer y={1.5} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Button
                  onClick={async () => {
                    try {
                      await window.arweaveWallet.connect(permissions, {
                        name: "Verto",
                      });
                    } catch {}
                    permissionsModal.setState(false);
                  }}
                  small
                >
                  Allow
                </Button>
                <Spacer x={1} />
                <Button
                  type="secondary"
                  small
                  onClick={() => {
                    localStorage.setItem(
                      ignorePermissionWarning,
                      JSON.stringify({ val: true })
                    );
                    permissionsModal.setState(false);
                  }}
                >
                  Don't show again
                </Button>
              </div>
            </Modal.Content>
          </Modal>
          <Changelog />
        </StatusChecker>
      </Theme>
    </ReduxProvider>
  );
}

// theme component
const Theme = ({ children }) => {
  const theme = useSelector((state: RootState) => state.themeReducer);
  const dispatch = useDispatch();
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>("Light");

  useEffect(() => {
    let loadedTheme = localStorage.getItem(themeStorageName);
    if (!loadedTheme) return;
    if (!["Dark", "Light", "System"].includes(loadedTheme))
      loadedTheme = "Light";
    dispatch(updateTheme(loadedTheme as DisplayTheme));
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const updateScheme = (val) =>
      setDisplayTheme(val.matches ? "Dark" : "Light");

    localStorage.setItem(themeStorageName, theme);

    if (theme === "System") setDisplayTheme(query.matches ? "Dark" : "Light");
    else setDisplayTheme(theme);

    query.addEventListener("change", updateScheme);

    return () => {
      query.removeEventListener("change", updateScheme);
    };
  }, [theme]);

  const router = useRouter();

  // reset nav theme on page switch
  useEffect(() => {
    dispatch(updateNavTheme("Default"));
  }, [router.asPath]);

  return <VertoProvider theme={displayTheme}>{children}</VertoProvider>;
};

const StatusChecker = ({ children }) => {
  const { setToast } = useToasts();

  // check gateway status
  useEffect(() => {
    (async () => {
      try {
        await axios({
          method: "GET",
          url: gateway(),
          timeout: 8000,
        });
      } catch (e) {
        console.error("Gateway logs:", e);
        setToast({
          description: `The ${client.getConfig().api.host} gateway is down`,
          type: "error",
          duration: 7000,
        });
      }
    })();
  }, []);

  // check cache
  useEffect(() => {
    (async () => {
      try {
        await fetchContract(COMMUNITY_CONTRACT);
      } catch {
        setToast({
          description: "The cache server is down",
          type: "error",
          duration: 7000,
        });
      }
    })();
  }, []);

  return <>{children}</>;
};

/*const BetaAlert = () => {
  const [show, setShow] = useState(false);
  const theme = useTheme();
  const currentAddress = useSelector(
    (state: RootState) => state.addressReducer
  );

  useEffect(() => {
    const stored = localStorage.getItem(betaAlertShown);

    if (stored === "true") return;
    setShow(true);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={
            betaAlertStyles.Alert +
            " " +
            (theme === "Dark" ? betaAlertStyles.Dark : "")
          }
          {...opacityAnimation()}
        >
          <p>
            This is Verto's new Beta UI. Click{" "}
            <a href="https://alpha.verto.exchange">here</a> to visit the old UI.
          </p>
          <CloseIcon
            className={betaAlertStyles.Close}
            onClick={() => {
              setShow(false);
              if (currentAddress) localStorage.setItem(betaAlertShown, "true");
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};*/

const Changelog = () => {
  const changelogModal = useModal();
  const address = useSelector((state: RootState) => state.addressReducer);

  useEffect(() => {
    if (!window || !address) return;
    const storedVersion = localStorage.getItem(lastViewedChangelog);

    if (!valid(storedVersion) || gt(pkg.version, storedVersion))
      changelogModal.setState(true);
  }, [address]);

  return <ChangelogModal {...changelogModal.bindings} />;
};
