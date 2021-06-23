import { SearchIcon } from "@iconicicons/react";
import { Page, Spacer } from "@verto/ui";
import Search, { useSearch } from "../components/Search";
import Head from "next/head";
import Metas from "../components/Metas";
import searchInputStyles from "../styles/components/SearchInput.module.sass";
import styles from "../styles/views/404.module.sass";

const NotFound = () => {
  const search = useSearch();

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
        <div
          className={searchInputStyles.SearchInput + " " + styles.SimulateInput}
          onClick={() => search.setOpen(true)}
        >
          <p>Maybe try searching...</p>
          <SearchIcon />
        </div>
      </div>
      <Search {...search} />
    </Page>
  );
};

export default NotFound;
