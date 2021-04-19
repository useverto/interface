import Verto from "@verto/js";
import { BalanceInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";

const client = new Verto();

const App = () => {
  const [balances, setBalances] = useState<BalanceInterface[]>([]);

  useEffect(() => {
    client
      // TODO: Pull from ArConnect
      .getBalances("vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU")
      .then((res) => setBalances(res));
  }, []);

  return (
    <Page>
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
