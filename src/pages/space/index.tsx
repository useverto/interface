import { Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import axios from "axios";
import Balance from "../../components/Balance";
import Verto from "@verto/js";

const client = new Verto();

const Space = (props: { tokens: any[] }) => {
  const [prices, setPrices] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    (async () => {
      const { data: gecko } = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
      );

      for (const { id } of props.tokens) {
        const res = await client.getPrice(id);

        if (res.price)
          setPrices((val) => ({
            ...val,
            [id]: (res.price * gecko.arweave.usd).toFixed(2),
          }));
      }
    })();
  }, []);

  return (
    <Page>
      <Spacer y={3} />
      <Balance />
      <Spacer y={4} />
      {props.tokens.map((token) => (
        <Card.Asset
          name={token.name}
          // @ts-ignore
          price={prices[token.id] ?? " ??"}
          image={`https://arweave.net/${token.logo}`}
          ticker={token.ticker}
          key={token.id}
        />
      ))}
    </Page>
  );
};

export async function getServerSideProps() {
  const { data: tokens } = await axios.get(
    "https://v2.cache.verto.exchange/site/communities/top"
  );

  return { props: { tokens } };
}

export default Space;
