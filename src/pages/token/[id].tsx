import Verto from "@verto/js";
import axios from "axios";

const Token = (props: { price: number; name: string; ticker: string }) => {
  console.log(props);

  return <></>;
};

export async function getServerSideProps(context) {
  const { id } = context.query;

  const client = new Verto();
  const res = await client.getPrice(id);

  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  return { props: { ...res, price: res.price * gecko.arweave.usd } };
}

export default Token;
