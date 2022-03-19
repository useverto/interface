import { AnimatePresence, motion } from "framer-motion";
import { opacityAnimation } from "../utils/animations";
import { MenuIcon, SearchIcon, ShareIcon } from "@iconicicons/react";
import { useState, useEffect } from "react";
import { useTheme, Spacer, generateAvatarGradient } from "@verto/ui";
import { CACHE_URL, gateway } from "../utils/arweave";
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

  const [page, setPage] = useState(0);
  const [noMore, setNoMore] = useState(false);

  useEffect(() => {
    setPage(0);
    setNoMore(false);
    loadMore(true);
  }, [query]);

  async function loadMore(initial = false) {
    if (query === "") return setResults([]);

    let { data } = await axios.get(
      `${CACHE_URL}/site/search/${query}/${initial ? 0 : page}`
    );

    if (data.length === 0) return setNoMore(true);

    data = data.map((val) => ({
      ...val,
      image: (val.image && `${gateway}/${val.image}`) || undefined,
      gradient:
        (!val.image &&
          val.type === "user" &&
          generateAvatarGradient(val.username || val.usertag || "")) ||
        undefined,
    }));

    setPage((val) => val + 1);
    setResults((val) => {
      if (initial) return data;
      return [...val, ...data];
    });
  }

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
                          onClick={() => setOpen(false)}
                        >
                          <div className={styles.TokenData}>
                            {(item.type !== "collection" &&
                              (item.image || item.type !== "user") && (
                                <img
                                  src={item.image ?? "/arweave.png"}
                                  alt={item.name}
                                  draggable={false}
                                  className={
                                    item.type === "user"
                                      ? styles.UserAvatar
                                      : ""
                                  }
                                  key={i}
                                />
                              )) ||
                              (item.type === "user" &&
                                !item.image &&
                                item.gradient && (
                                  <div
                                    className={styles.NoAvatar}
                                    style={{
                                      background: item.gradient?.gradient ?? "",
                                    }}
                                  >
                                    <span>
                                      {(item.username || "")
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                )) || (
                                <MenuIcon className={styles.CollectionIcon} />
                              )}
                            <div>
                              <h1>{item.name}</h1>
                              <h2
                                className={
                                  item.type === "user" ? styles.UserTag : ""
                                }
                              >
                                {item.type === "user"
                                  ? `@${item.username}`
                                  : item.ticker ?? "Collection"}
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
                  {!noMore && results.length > 0 && (
                    <>
                      <Spacer y={1} />
                      <div
                        className={styles.LoadMore}
                        onClick={() => loadMore()}
                      >
                        See more
                      </div>
                      <Spacer y={1} />
                    </>
                  )}
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
