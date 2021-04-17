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
import { useState } from "react";

const client = new Verto();

const Swap = (props: { tokens: TokenInterface[] }) => {
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
    </Page>
  );
};

export async function getServerSideProps() {
  const tokens = await client.getTokens();

  return { props: { tokens } };
}

export default Swap;
