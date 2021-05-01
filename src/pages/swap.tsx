import { TokenInterface } from "@verto/js/dist/faces";
import {
  Button,
  Card,
  Input,
  Page,
  Select,
  Spacer,
  useSelect,
} from "@verto/ui";
import { useEffect, useState } from "react";
import Balance from "../components/Balance";
import Verto from "@verto/js";
import Head from "next/head";
import Metas from "../components/Metas";
import { randomEmoji } from "../utils/user";

const client = new Verto();

const Swap = (props: { tokens: TokenInterface[] }) => {
  const [post, setPost] = useState("");
  useEffect(() => {
    client.recommendPost().then((res) => setPost(res));
  }, []);

  const [inputs, setInputs] = useState([
    {
      id: "AR",
      name: "AR",
      ticker: "AR",
    },
  ]);
  const [outputs, setOutputs] = useState(props.tokens);

  const inputUnit = useSelect("AR");
  const outputUnit = useSelect(props.tokens[0].id);

  const [orders, setOrders] = useState([]);
  const [ticker, setTicker] = useState("");
  useEffect(() => {
    if (post) {
      const id = inputUnit.state === "AR" ? outputUnit.state : inputUnit.state;
      if (inputUnit.state === "AR") {
        setOutputs((val) => {
          setTicker(val.find((item: any) => item.id === id).ticker);

          return val;
        });
      } else {
        setInputs((val) => {
          setTicker(val.find((item: any) => item.id === id).ticker);

          return val;
        });
      }

      client.getOrderBook(post, id).then((res) => setOrders(res));
    }
  }, [post, inputUnit.state, outputUnit.state]);

  const [users, setUsers] = useState<{ [address: string]: string }>({});

  useEffect(() => {
    (async () => {
      let users: { [address: string]: string } = {};
      setUsers((val) => {
        users = val;
        return val;
      });

      for (const order of orders) {
        if (order.addr in users) {
          // Do nothing ...
        } else {
          const user = await client.getUser(order.addr);

          if (user) {
            setUsers({
              ...users,
              [order.addr]: `https://arweave.net/${user.image}`,
            });
          }
        }
      }
    })();
  }, [orders]);

  return (
    <Page>
      <Head>
        <title>Verto - Swap</title>
        <Metas title="Swap" />
      </Head>
      <Spacer y={3} />
      <Balance />
      <Spacer y={4} />
      <Card>
        <Input
          label="You send"
          inlineLabel={
            <Select {...inputUnit.bindings} small filled>
              {inputs.map((input, i) => (
                <option value={input.id} key={i}>
                  {input.ticker}
                </option>
              ))}
            </Select>
          }
          type="number"
          style={{ width: "calc(100% - 6px)" }}
        />
        <Spacer y={1} />
        <Input
          label="You recieve"
          inlineLabel={
            <Select {...outputUnit.bindings} small filled>
              {outputs.map((output, i) => (
                <option value={output.id} key={i}>
                  {output.ticker}
                </option>
              ))}
            </Select>
          }
          type="number"
          style={{ width: "calc(100% - 6px)" }}
        />
        <Spacer y={1} />
        <Button style={{ width: "100%" }}>Swap</Button>
      </Card>
      {orders.map((order, i) => (
        <Card.SwapSell
          user={{
            avatar: users[order.addr] || randomEmoji(),
            usertag: "",
            name: "",
          }}
          selling={{ quantity: order.amnt, ticker }}
          rate={1 / order.rate}
          filled={order.received || 0}
          orderID={order.txID}
          key={i}
        />
      ))}
    </Page>
  );
};

export async function getServerSideProps() {
  const tokens = await client.getTokens();

  return { props: { tokens } };
}

export default Swap;
