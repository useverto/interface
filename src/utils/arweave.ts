import ArDB from "ardb";
import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import Arweave from "arweave";
import moment from "moment";

export const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const gql = new ArDB(client);

export const balanceHistory = async (
  address: string
): Promise<{ [date: string]: number }> => {
  const inTxs = (await gql
    .search()
    .to(address)
    .limit(100)
    .find()) as GQLEdgeTransactionInterface[];
  const outTxs = (await gql
    .search()
    .from(address)
    .limit(100)
    .find()) as GQLEdgeTransactionInterface[];

  const txs = inTxs
    .concat(outTxs)
    .sort((a, b) => b.node.block.timestamp - a.node.block.timestamp)
    .slice(0, 100);
  let balance = parseFloat(
    client.ar.winstonToAr(await client.wallets.getBalance(address))
  );

  const res = {};

  for (const { node } of txs) {
    balance += parseFloat(node.fee.ar);

    if (node.owner.address === address) {
      balance += parseFloat(node.quantity.ar);
    } else {
      balance -= parseFloat(node.quantity.ar);
    }

    res[
      moment(node.block.timestamp * 1000).format("MMM DD, YYYY - HH:mm")
    ] = balance;
  }

  return res;
};
