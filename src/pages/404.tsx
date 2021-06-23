import { SearchIcon, ShareIcon } from "@iconicicons/react";
import { useState, useEffect } from "react";
import { Page, Spacer, useTheme } from "@verto/ui";
import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { CACHE_URL } from "../utils/arweave";
import { randomEmoji } from "../utils/user";
import Head from "next/head";
import Metas from "../components/Metas";
import axios from "axios";
import Link from "next/link";
import styles from "../styles/views/404.module.sass";

const NotFound = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const theme = useTheme();

  useEffect(() => setQuery(""), [showSearch]);

  useEffect(() => {
    (async () => {
      let { data } = await axios.get(`${CACHE_URL}/site/search/${query}`);

      data = data.map((val) => ({
        ...val,
        image:
          (val.image && `https://arweave.net/${val.image}`) ||
          (val.type === "user" && randomEmoji()) ||
          "/arweave.png",
      }));

      setResults(data);
    })();
  }, [query]);

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
          className={styles.SearchInput + " " + styles.SimulateInput}
          onClick={() => setShowSearch(true)}
        >
          <p>Maybe try searching...</p>
          <SearchIcon />
        </div>
      </div>
      <AnimatePresence>
        {showSearch && (
          <motion.div {...opacityAnimation()} className={styles.SearchContent}>
            <div
              className={styles.Overlay}
              onClick={() => setShowSearch(false)}
            />
            <div className={styles.Content}>
              <div className={styles.SearchInput}>
                <p
                  style={{
                    opacity: query === "" ? 1 : 0,
                    transition: "all .23s ease-in-out",
                  }}
                >
                  Search for something...
                </p>
                <SearchIcon />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <AnimatePresence>
                {query !== "" && (
                  <motion.div
                    {...opacityAnimation()}
                    className={
                      styles.Results +
                      " " +
                      (theme === "Dark" ? styles.DarkResults : "")
                    }
                  >
                    <AnimatePresence>
                      {results.map((item, i) => (
                        <Link
                          href={
                            item.type === "user"
                              ? `/@${item.username}`
                              : `/space/${item.id}`
                          }
                        >
                          <motion.a
                            className={styles.ResultItem}
                            {...opacityAnimation()}
                            key={i}
                            href={
                              item.type === "user"
                                ? `/@${item.username}`
                                : `/space/${item.id}`
                            }
                          >
                            <div className={styles.TokenData}>
                              <img
                                src={item.image}
                                alt="img"
                                draggable={false}
                                className={
                                  item.type === "user" ? styles.UserAvatar : ""
                                }
                              />
                              <div>
                                <h1>{item.name}</h1>
                                <h2
                                  className={
                                    item.type === "user" ? styles.UserTag : ""
                                  }
                                >
                                  {item.type === "user"
                                    ? `@${item.username}`
                                    : item.ticker}
                                </h2>
                              </div>
                            </div>
                            <ShareIcon />
                          </motion.a>
                        </Link>
                      ))}
                    </AnimatePresence>
                    <AnimatePresence>
                      {results.length === 0 && query !== "" && (
                        <motion.p {...opacityAnimation()}>
                          No results found.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Page>
  );
};

export default NotFound;
