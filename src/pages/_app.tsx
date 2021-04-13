import { VertoProvider } from "@verto/ui";
import { useRouter } from "next/router";
import Progress from "nprogress";
import { useEffect } from "react";
import "../styles/progress.css";

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
      <Component {...pageProps} />
    </VertoProvider>
  );
}
