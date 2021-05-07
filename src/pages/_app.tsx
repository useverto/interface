import { VertoProvider } from "@verto/ui";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAddress } from "../utils/arconnect";
import Progress from "nprogress";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import Head from "next/head";
import "../styles/global.sass";
import "../styles/progress.sass";

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [scheme, setScheme] = useState<"dark" | "light">("light");
  const [address] = useAddress();

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

  useEffect(() => console.log(address), [address]);

  useEffect(() => {
    const protectedRoutes = /\/(app|swap)/;

    if (router.asPath.match(protectedRoutes) && !address) router.push("/");
  }, [router.asPath, address]);

  return (
    <VertoProvider theme={"Light"}>
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
    </VertoProvider>
  );
}
