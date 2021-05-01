import Verto from "@verto/js";
import axios from "axios";
import { Page, useInput } from "@verto/ui";
import { PriceInterface } from "@verto/js/dist/faces";
import { useEffect, useState } from "react";
import Head from "next/head";
import Metas from "../../components/Metas";

const client = new Verto();

interface PropTypes extends PriceInterface {
  id: string;
}

const Token = (props: PropTypes) => {
  const type = props.type || "community";

  const [state, setState] = useState(null);

  useEffect(() => {
    axios
      .get(`https://v2.cache.verto.exchange/${props.id}`)
      .then(({ data }) => {
        let state = data.state;
        if (state.settings)
          state.settings = Object.fromEntries(new Map(state.settings));

        setState(state);
      });
  }, []);

  // === Community ===
  const [history, setHistory] = useState<{ [date: string]: number }>({});

  useEffect(() => {
    client.getPriceHistory(props.id).then((res) => setHistory(res));
  }, []);

  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (state) {
      const circulatingSupply = Object.values(state.balances).reduce(
        (a: number, b: number) => a + b,
        0
      ) as number;

      let totalSupply: number = circulatingSupply;
      for (const vault of Object.values(state.vault) as any) {
        totalSupply += vault
          .map((a: any) => a.balance)
          .reduce((a: number, b: number) => a + b, 0);
      }

      const marketCap = (totalSupply * props.price).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      setMetrics({
        marketCap,
        circulatingSupply: circulatingSupply.toLocaleString(),
        totalSupply: totalSupply.toLocaleString(),
      });
    }
  }, [state]);

  const amount = useInput();
  const target = useInput();

  const transfer = async () => {
    const id = await client.transfer(
      amount.state as number,
      props.id,
      target.state as string
    );
    console.log(id);
  };

  return (
    <Page>
      <Head>
        <title>Verto - {props.name}</title>
        {/** TODO: get image of community and put it in the metas OG */}
        <Metas
          title={props.name}
          image={type === "art" ? `https://arweave.net/${props.id}` : undefined}
        />
      </Head>
      {type === "art" && <img src={`https://arweave.net/${props.id}`} />}
      {type === "community" && metrics && (
        <>
          <p>Market Cap: ~${metrics.marketCap} USD</p>
          <p>
            Circulating Supply: {metrics.circulatingSupply} {props.ticker}
          </p>
          <p>
            Total Supply: {metrics.totalSupply} {props.ticker}
          </p>
        </>
      )}
    </Page>
  );
};

export async function getServerSideProps(context) {
  const { id } = context.query;
  const res = await client.getPrice(id);

  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  return { props: { id, ...res, price: res.price * gecko.arweave.usd } };
}

export default Token;
