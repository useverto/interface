import { GQLEdgeTransactionInterface } from "ardb/lib/faces/gql";
import Arweave from "arweave";
import axios from "axios";
import moment from "moment";
import ArDB from "ardb";
import Verto from "@verto/js";

export const client = new Arweave({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});
export const verto = new Verto("use_wallet", client);
export const gateway = () =>
  `${client.getConfig().api.protocol ?? "https"}://${
    client.getConfig().api.host ?? "artweave.net"
  }:${client.getConfig().api.port ?? "443"}`;

export const gql = new ArDB(client);

export const ROOT_URL = "https://verto.exchange";
export const CACHE_URL = "https://v2.cache.verto.exchange";
export const COMMUNITY_CONTRACT = "t9T7DIOGxx4VWXoCEeYYarFYeERTpWIC1V3y-BPZgKE";
export const COLLECTION_CONTRACT_SRC =
  "HGV5DRY45TPTUJ0GERYgaaJoTXdMpU_lhtnI0ehJbe4";
export const COLLECTIBLE_CONTRACT_SRC =
  "K2s2nciTrl4pk2Nvlvzba-DnWrkm45bo4qMPR7zFpzI";
export const VERTO_CONTRACT_PST = "usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A";

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
    .filter(({ node }) => !!node?.block?.timestamp)
    .sort((a, b) => b.node.block.timestamp - a.node.block.timestamp)
    .slice(0, 100);
  let balance = parseFloat(
    client.ar.winstonToAr(await client.wallets.getBalance(address))
  );

  const res = {
    [moment().format("MMM DD, YYYY - HH:mm")]: balance,
  };

  for (const { node } of txs) {
    balance += parseFloat(node.fee.ar);

    if (node.owner.address === address) {
      balance += parseFloat(node.quantity.ar);
    } else {
      balance -= parseFloat(node.quantity.ar);
    }

    res[moment(node.block.timestamp * 1000).format("MMM DD, YYYY - HH:mm")] =
      balance;
  }

  return res;
};

export const arPrice = async (): Promise<number> => {
  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  return gecko.arweave.usd;
};

export const isAddress = (addr: string) => /^[a-z0-9_-]{43}$/i.test(addr);
