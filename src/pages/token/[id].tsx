import Verto from "@verto/js";
import axios from "axios";
import { useEffect, useState } from "react";

const client = new Verto();

const Token = (props: {
  id: string;
  price: number;
  name: string;
  ticker: string;
}) => {
  const [history, setHistory] = useState({});

  useEffect(() => {
    client.getPriceHistory(props.id).then((res) => setHistory(res));
  }, []);

  console.log(history);

  return <></>;
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
