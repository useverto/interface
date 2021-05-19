import { Button, Modal, Spacer, useModal, VertoProvider } from "@verto/ui";
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
import store from "../store";
import Progress from "nprogress";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import Head from "next/head";
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
    const ignore = localStorage.getItem("verto_ignore_permission_warning");

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
            A few permissions are missing. Some of them are essential for Verto
            to work. Please allow these to use Verto to it's full potential.
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
                    await window.arweaveWallet.connect(permissions);
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
                    "verto_ignore_permission_warning",
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
      </Theme>
    </ReduxProvider>
  );
}

const Theme = ({ children }) => {
  const theme = useSelector((state: RootState) => state.themeReducer);
  const dispatch = useDispatch();
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>("Light");

  useEffect(() => {
    let loadedTheme = localStorage.getItem("verto_theme");
    if (!loadedTheme) return;
    if (!["Dark", "Light", "System"].includes(loadedTheme))
      loadedTheme = "Light";
    dispatch(updateTheme(loadedTheme as DisplayTheme));
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const updateScheme = (val) =>
      setDisplayTheme(val.matches ? "Dark" : "Light");

    localStorage.setItem("verto_theme", theme);

    if (theme === "System") setDisplayTheme(query.matches ? "Dark" : "Light");
    else setDisplayTheme(theme);

    query.addEventListener("change", updateScheme);

    return () => {
      query.removeEventListener("change", updateScheme);
    };
  }, [theme]);

  return <VertoProvider theme={displayTheme}>{children}</VertoProvider>;
};
