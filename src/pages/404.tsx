import { SearchIcon } from "@iconicicons/react";
import { Page, Spacer, Input } from "@verto/ui";
import Head from "next/head";
import Metas from "../components/Metas";
import styles from "../styles/views/404.module.sass";

const NotFound = () => {
  return (
    <Page className={styles.Page}>
      <Head>
        <title>404 - Page Not Found</title>
        <Metas title="404 Not Found" />
      </Head>
      <div className={styles.Content}>
        <h1 className={styles.Title}>404</h1>
        <h2 className={styles.Subtitle}>Page Not Found</h2>
        <Spacer y={2} />
        <div className={styles.SimulateInput}>
          <p>Maybe try searching...</p>
          <SearchIcon />
        </div>
      </div>
    </Page>
  );
};

export default NotFound;
