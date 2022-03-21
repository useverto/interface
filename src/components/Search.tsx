import { AnimatePresence, motion } from "framer-motion";
import { cardListAnimation, opacityAnimation } from "../utils/animations";
import { MenuIcon, SearchIcon, ShareIcon } from "@iconicicons/react";
import { useState, useEffect } from "react";
import { useTheme } from "@verto/ui";
import { CACHE_URL, gateway, verto } from "../utils/arweave";
import {
  fetchRandomCommunitiesWithMetadata,
  fetchTopCommunities,
} from "verto-cache-interface";
import { useRouter } from "next/router";
import axios from "axios";
import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import searchInputStyles from "../styles/components/SearchInput.module.sass";
import styles from "../styles/components/Search.module.sass";

export default function Search({ open, setOpen }) {
  const [query, setQuery] = useState("");
  const theme = useTheme();
  const router = useRouter();

  // load query from route if possible
  useEffect(() => {
    if (router.query.q && router.query.q !== "") {
      setQuery(router.query.q.toString());
      setOpen(true);
    } else setQuery("");
  }, [open, router.query]);

  // reset everything on query update
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setResults([]);
    loadMore();
  }, [query]);

  // infinite load results
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  async function loadMore() {
    if (query === "") return setResults([]);

    let { data } = await axios.get(`${CACHE_URL}/site/search/${query}/${page}`);

    if (data.length === 0) return setHasMore(false);

    data = await Promise.all(
      data.map(async (val) => {
        if (val.type !== "community") {
          return {
            ...val,
            image: (val.image && `${gateway()}/${val.image}`) || undefined,
          };
        }

        let image = verto.token.getLogo(val.id, "light");
        const res = await axios.get(image);

        if (res.status !== 200 && !!val.image) {
          image = `${gateway()}/${val.image}`;
        }

        return { ...val, image };
      })
    );

    setResults((val) => [...val, ...data]);
    setPage((val) => val + 1);
  }

  // load featured tags from top communities
  const [featuredTags, setFeaturedTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const topCommunities = await fetchTopCommunities(5);
      let randomCommunities = await fetchRandomCommunitiesWithMetadata(10);

      randomCommunities = randomCommunities
        .filter(({ id }) => !topCommunities.find((val) => val.id === id))
        .slice(0, 5);

      setFeaturedTags(
        [...topCommunities, ...randomCommunities].map(({ name }) => name)
      );
    })();
  }, [open]);

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
            <InfiniteScroll
              dataLength={results.length}
              next={loadMore}
              hasMore={hasMore}
              loader={<></>}
              style={{ overflow: "unset !important" }}
              className={
                styles.Results +
                " " +
                (theme === "Dark" ? styles.DarkResults : "")
              }
              endMessage={<p>You have reached the end :)</p>}
              height={(results.length > 0 && results.length * 85) || 100}
            >
              <AnimatePresence>
                {query === "" && (
                  <div className={styles.Featured}>
                    {featuredTags.map((tag, i) => (
                      <motion.div
                        className={styles.FeaturedTag}
                        onClick={() => setQuery(tag)}
                        {...cardListAnimation(i)}
                        key={i}
                      >
                        {tag}
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
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
                              src={
                                item.image?.replace(
                                  "light",
                                  theme.toLowerCase()
                                ) ?? "/arweave.png"
                              }
                              alt={item.name}
                              draggable={false}
                              className={
                                item.type === "user" ? styles.UserAvatar : ""
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
                  <motion.p {...opacityAnimation()}>No results found.</motion.p>
                )}
              </AnimatePresence>
            </InfiniteScroll>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useSearch() {
  const [open, setOpen] = useState(false);

  // do not allow body scroll when search is visible
  useEffect(() => {
    document.body.style.overflowY = open ? "hidden" : "auto";
  }, [open]);

  return { open, setOpen };
}
