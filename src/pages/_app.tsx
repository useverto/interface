import { VertoProvider } from "@verto/ui";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Progress from "nprogress";
import Footer from "../components/Footer";
import Nav from "../components/Nav";
import "../styles/global.sass";
import "../styles/progress.sass";

export default function App({ Component, pageProps }) {
  const router = useRouter();
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

  return (
    <VertoProvider theme={"Light"}>
      <Nav />
      <Component {...pageProps} />
      <Footer />
    </VertoProvider>
  );
}
