import Verto from "@verto/js";
import axios from "axios";
import { Page, useInput } from "@verto/ui";
import { PriceInterface } from "@verto/js/dist/faces";
import { useEffect, useState } from "react";

const client = new Verto();

interface PropTypes extends PriceInterface {
  id: string;
}

const Token = (props: PropTypes) => {
  const type = props.type || "community";

  // === Community ===
  const [history, setHistory] = useState<{ [date: string]: number }>({});

  useEffect(() => {
    client.getPriceHistory(props.id).then((res) => setHistory(res));
  }, []);

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
      {type === "art" && <img src={`https://arweave.net/${props.id}`} />}
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
