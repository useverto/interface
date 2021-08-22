import { Page, Spacer } from "@verto/ui";
import Head from "next/head";
import Metas from "../components/Metas";
import styles from "../styles/views/404.module.sass";

const ServerError = () => (
  <Page className={styles.Page}>
    <Head>
      <title>500 - Internal Server Error</title>
      <Metas title="500 Internal Server Error" />
    </Head>
    <div className={styles.Content}>
      <h1 className={styles.Title}>500</h1>
      <h2 className={styles.Subtitle}>Internal Server Error</h2>
      <Spacer y={1.8} />
      <p>
        Try getting help at our{" "}
        <a href="/chat" target="_blank" rel="noopener noreferrer">
          Discord
        </a>
        .
      </p>
    </div>
  </Page>
);

export default ServerError;
