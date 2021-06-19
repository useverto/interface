import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import Arweave from "arweave";
import axios from "axios";
import moment from "moment";
import ArDB from "ardb";

export const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

const gql = new ArDB(client);

export const CACHE_URL = "https://v2.cache.verto.exchange";
export const COMMUNITY_CONTRACT = "mp8gF3oo3MCJ6hBdminh2Uborv0ZS_I1o9my_2dp424";

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

export const arPrice = async (): Promise<number> => {
  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  return gecko.arweave.usd;
};
