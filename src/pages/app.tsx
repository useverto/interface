import Verto from "@verto/js";
import { BalanceInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { balanceHistory } from "../utils/arweave";

const client = new Verto();

const App = () => {
  const [balances, setBalances] = useState<BalanceInterface[]>([]);
  const [history, setHistory] = useState<{ [date: string]: number }>({});

  useEffect(() => {
    (async () => {
      setBalances(
        // TODO: Pull from ArConnect
        await client.getBalances("vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU")
      );

      setHistory(
        // TODO: Pull from ArConnect
        await balanceHistory("pvPWBZ8A5HLpGSEfhEmK1A3PfMgB_an8vVS6L14Hsls")
      );
    })();
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
      <Line
        data={{
          labels: Object.keys(history).reverse(),
          datasets: [
            {
              data: Object.values(history).reverse(),
            },
          ],
        }}
      />
    </Page>
  );
};

export default App;
