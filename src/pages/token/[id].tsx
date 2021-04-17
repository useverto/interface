import Verto from "@verto/js";
import axios from "axios";
import { Button, Card, Input, Spacer, useInput } from "@verto/ui";
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
    <>
      <Card>
        <Input
          label="Address"
          placeholder="Your address"
          style={{ width: "calc(100% - 6px)" }}
          {...target.bindings}
        />
        <Spacer y={1} />
        <Input
          label="You send"
          inlineLabel={props.ticker}
          type="number"
          placeholder="10000"
          style={{ width: "calc(100% - 6px)" }}
          {...amount.bindings}
        />
        <Spacer y={2} />
        <Button style={{ width: "100%" }} disabled onClick={transfer}>
          Transfer
        </Button>
        <Spacer y={1} />
        <Button style={{ width: "100%" }} disabled type="secondary">
          Swap
        </Button>
      </Card>
    </>
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
