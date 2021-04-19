import Verto from "@verto/js";
import { Card, Page } from "@verto/ui";
import axios from "axios";
import { useEffect, useState } from "react";
import { fetchAsset } from "../utils/arweave";

const client = new Verto();

const Space = () => {
  const [tokens, setTokens] = useState([]);

  useEffect(() => {
    axios
      .get("https://v2.cache.verto.exchange/site/communities/top")
      .then(async (res) => {
        const { data: gecko } = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
        );

        for (const token of res.data) {
          const res = await client.getPrice(token.id);
          const price = res.price
            ? (res.price * gecko.arweave.usd).toFixed(2)
            : " ??";
          const image = await fetchAsset(token.logo);

          setTokens((val) => [
            ...val,
            {
              ...token,
              price,
              image,
            },
          ]);
        }
      });
  }, []);

  return (
    <Page>
      {tokens.map((token) => (
        <Card.Asset
          name={token.name}
          price={token.price}
          image={token.image}
          ticker={token.ticker}
          key={token.id}
        />
      ))}
    </Page>
  );
};

export default Space;
