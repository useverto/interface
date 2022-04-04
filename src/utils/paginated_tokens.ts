import axios from "axios";
import { useState } from "react";
import { fetchPaginated, PaginatedToken } from "verto-cache-interface";
import { gateway, verto } from "./arweave";

/**
 * Paginated tokens hook to use with infinite scrolling
 */
export default function usePaginatedTokens() {
  // all tokens
  const [tokens, setTokens] = useState<PaginatedToken[]>([]);
  const [currentTokensPage, setCurrentTokensPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // animation counter to prevent the newly added
  // tokens from being animated with a delay
  const [animationCounter, setAnimationCounter] = useState(0);

  // fetch all tokens paginated
  async function fetchMore() {
    if (!hasMore) return;

    setAnimationCounter(tokens.length);

    const fetchedTokens = await fetchPaginated<PaginatedToken>(
      "tokens",
      8,
      currentTokensPage
    );

    // if there are not tokens returned, quit
    if (fetchedTokens.isEmpty()) return setHasMore(false);
    else {
      // get if there is a next page
      const hasNextPage = fetchedTokens.hasNextPage();

      setHasMore(hasNextPage);

      // cryptometa logo api
      for (const token of fetchedTokens.items) {
        if (token.type !== "community") continue;

        let logo = verto.token.getLogo(token.id, "dark");

        const { status } = await axios.get(logo);

        if (status !== 200 && token.logo && token.logo !== token.id) {
          logo = `${gateway()}/${token.logo}`;
        }

        token.logo = logo;
      }

      setTokens((val) => [...val, ...fetchedTokens.items]);

      // if there is a next page, update the page counter
      if (hasNextPage) setCurrentTokensPage((val) => val + 1);
    }
  }

  return {
    tokens,
    fetchMore,
    hasMore,
    animationCounter,
  };
}
