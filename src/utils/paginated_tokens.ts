import { useState } from "react";
import {
  fetchLatestPrice,
  fetchPaginated,
  PaginatedToken,
} from "verto-cache-interface";
import { gateway, USD_STABLECOIN_ID, verto } from "./arweave";
import axios from "axios";

/**
 * Paginated tokens hook to use with infinite scrolling
 */
export default function usePaginatedTokens() {
  // all tokens
  const [tokens, setTokens] = useState<PaginatedTokenWithPrice[]>([]);
  const [currentTokensPage, setCurrentTokensPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // animation counter to prevent the newly added
  // tokens from being animated with a delay
  const [animationCounter, setAnimationCounter] = useState(0);

  // fetch all tokens paginated
  async function fetchMore() {
    if (!hasMore) return;

    setAnimationCounter(tokens.length);

    const fetchedTokens = await fetchPaginated<PaginatedTokenWithPrice>(
      "tokens",
      8,
      currentTokensPage,
      true
    );

    // if there are not tokens returned, quit
    if (fetchedTokens.isEmpty()) return setHasMore(false);
    else {
      // get if there is a next page
      const hasNextPage = fetchedTokens.hasNextPage();

      setHasMore(hasNextPage);

      for (const token of fetchedTokens.items) {
        // load price based on the dominant token
        try {
          const priceData = await fetchLatestPrice([
            token.id,
            USD_STABLECOIN_ID,
          ]);

          if (priceData?.dominantToken === token.id) {
            token.price = priceData.vwap;
          } else if (priceData?.dominantToken === USD_STABLECOIN_ID) {
            token.price = 1 / priceData.vwap;
          }
        } catch {}

        // cryptometa logo api
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

interface PaginatedTokenWithPrice extends PaginatedToken {
  price?: number;
}
