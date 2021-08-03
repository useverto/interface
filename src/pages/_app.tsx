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
import { updateTheme } from "../store/actions";
import { DisplayTheme } from "@verto/ui/dist/types";
import { permissions } from "../utils/arconnect";
import {
  ignorePermissionWarning,
  theme as themeStorageName,
} from "../utils/storage_names";
import { CACHE_URL } from "../utils/arweave";
import store from "../store";
import Progress from "nprogress";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import Head from "next/head";
import axios from "axios";
import * as Fathom from "fathom-client";
import "../styles/global.sass";
import "../styles/progress.sass";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [scheme, setScheme] = useState<"dark" | "light">("light");

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
          </Head>
          <Nav />
          <Component {...pageProps} />
          <Footer />
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
        </StatusChecker>
      </Theme>
    </ReduxProvider>
  );
}

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

  return <VertoProvider theme={displayTheme}>{children}</VertoProvider>;
};

const StatusChecker = ({ children }) => {
  const { setToast } = useToasts();

  // check arweave.net
  useEffect(() => {
    (async () => {
      try {
        await axios({
          method: "GET",
          url: "https://arweave.net",
          timeout: 8000,
        });
      } catch {
        setToast({
          description: "The arweave.net gateway is down",
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
        const { data } = await axios({
          method: "GET",
          url: `${CACHE_URL}/ping`,
          timeout: 8000,
        });

        if (data.connection !== 1)
          setToast({
            description: "The cache server is not connected to the DB",
            type: "error",
            duration: 7000,
          });
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
