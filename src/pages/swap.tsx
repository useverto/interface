import Verto from "@verto/js";
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

  return (
    <Page>
      <Card>
        <Input
          label="You send"
          inlineLabel={
            <Select {...inputUnit.bindings} small filled>
              {inputs.map((input) => (
                <option value={input.id}>{input.ticker}</option>
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
              {outputs.map((output) => (
                <option value={output.id}>{output.ticker}</option>
              ))}
            </Select>
          }
          type="number"
          style={{ width: "calc(100% - 6px)" }}
        />
        <Spacer y={1} />
        <Button style={{ width: "100%" }}>Swap</Button>
      </Card>
      {orders.map((order) => (
        <Card.SwapSell
          user={{
            avatar: "https://th8ta.org/marton.jpeg",
            usertag: "martonlederer",
            name: "Marton Lederer",
          }}
          selling={{ quantity: order.amnt, ticker }}
          rate={1 / order.rate}
          filled={order.received || 0}
          orderID={order.txID}
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
