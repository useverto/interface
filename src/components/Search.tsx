import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { SearchIcon, ShareIcon } from "@iconicicons/react";
import { useState, useEffect } from "react";
import { useTheme } from "@verto/ui";
import { CACHE_URL } from "../utils/arweave";
import { randomEmoji } from "../utils/user";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import searchInputStyles from "../styles/components/SearchInput.module.sass";
import styles from "../styles/components/Search.module.sass";

export default function Search({ open, setOpen }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (router.query.q && router.query.q !== "") {
      setQuery(router.query.q.toString());
      setOpen(true);
    } else setQuery("");
  }, [open, router.query]);

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
    <AnimatePresence>
      {open && (
        <motion.div {...opacityAnimation()} className={styles.SearchContent}>
          <div className={styles.Overlay} onClick={() => setOpen(false)} />
          <div className={styles.Content}>
            <div className={searchInputStyles.SearchInput}>
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
                        key={i}
                      >
                        <motion.a
                          className={styles.ResultItem}
                          {...opacityAnimation()}
                          href={
                            item.type === "user"
                              ? `/@${item.username}`
                              : `/space/${item.id}`
                          }
                        >
                          <div className={styles.TokenData}>
                            <img
                              src={item.image}
                              alt={item.name}
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
  );
}

export function useSearch() {
  const [open, setOpen] = useState(false);

  return { open, setOpen };
}
