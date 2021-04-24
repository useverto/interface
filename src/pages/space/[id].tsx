import Verto from "@verto/js";
import axios from "axios";
import { Page } from "@verto/ui";
import { PriceInterface } from "@verto/js/dist/faces";

const client = new Verto();

interface PropTypes extends PriceInterface {
  id: string;
}

const Token = (props: PropTypes) => {
  const type = props.type || "community";
  console.log(type);

  return <Page></Page>;
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
