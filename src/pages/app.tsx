import { BalanceInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import { useAddress } from "../utils/arconnect";
import Balance from "../components/Balance";
import Verto from "@verto/js";

const client = new Verto();

const App = () => {
  const [balances, setBalances] = useState<BalanceInterface[]>([]);
  const { address } = useAddress();

  useEffect(() => {
    if (!address) return;
    loadData();
  }, [address]);

  async function loadData() {
    setBalances(await client.getBalances(address));
  }

  return (
    <Page>
      <Spacer y={3} />
      <Balance />
      <Spacer y={4} />
      {balances.map((item) => (
        <>
          <Card.Balance
            id={item.id}
            name={item.name}
            // @ts-ignore
            ticker={item.ticker ?? ""}
            balance={item.balance}
            logo={{
              light: item.logo
                ? `https://arweave.net/${item.logo}`
                : "/arweave.png",
            }}
          />
          <Spacer y={1} />
        </>
      ))}
    </Page>
  );
};

export default App;
