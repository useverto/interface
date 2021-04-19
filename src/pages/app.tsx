import Verto from "@verto/js";
import { BalanceInterface } from "@verto/js/dist/faces";
import { Card, Page, Spacer } from "@verto/ui";
import { useEffect, useState } from "react";
import { fetchAsset } from "../utils/arweave";

const client = new Verto();

const App = () => {
  const [balances, setBalances] = useState<BalanceInterface[]>([]);

  useEffect(() => {
    client
      // TODO: Pull from ArConnect
      .getBalances("vxUdiv2fGHMiIoek5E4l3M5qSuKCZtSaOBYjMRc94JU")
      .then(async (res) => {
        for (const item of res) {
          let logo;
          if (item.logo) {
            logo = await fetchAsset(item.logo);
          }

          setBalances((val) => [...val, { ...item, logo }]);
        }
      });
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
            logo={{ light: item.logo ?? "" }}
          />
          <Spacer y={1} />
        </>
      ))}
    </Page>
  );
};

export default App;
