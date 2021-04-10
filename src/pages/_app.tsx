import { VertoProvider } from "@verto/ui";

export default function App ({ Component, pageProps }) {
  return (
    <VertoProvider theme={"Light"}>
      <Component {...pageProps} />
    </VertoProvider>
  );
}
