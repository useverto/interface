import ArdbTransaction from "ardb/lib/models/transaction";
import Arweave from "arweave";
import axios from "axios";
import moment from "moment";
import ArDB from "ardb";
import Verto from "@verto/js";

/** Global APIs and constants */

/** Global Arweave client instance */
export const client = new Arweave({
  host: "www.arweave.run",
  port: 443,
  protocol: "https",
});

/** Arweave gateway direct URL concatenated from the client instance */
export const gateway = () =>
  `${client.getConfig().api.protocol ?? "https"}://${
    client.getConfig().api.host ?? "artweave.net"
  }:${client.getConfig().api.port ?? "443"}`;

/** Global ArDB client instance */
export const gql = new ArDB(client);

/** Root URL of the site */
export const ROOT_URL = "https://verto.exchange";

/** Community contract id */
export const COMMUNITY_CONTRACT = "1LZh-CT5hGxr20aj_wbkTaiV1POQlQ4nDl-Doolt_JQ";

/** Clob contract id */
export const CLOB_CONTRACT = "F9pOJ9sUPC0U_5PutuFy2oUg1DKGLeIgGfN9c1tBLEs";

/** Collection contract src tx id */
export const COLLECTION_CONTRACT_SRC =
  "HGV5DRY45TPTUJ0GERYgaaJoTXdMpU_lhtnI0ehJbe4";

/** Collectible contract src tx id */
export const COLLECTIBLE_CONTRACT_SRC =
  "K2s2nciTrl4pk2Nvlvzba-DnWrkm45bo4qMPR7zFpzI";

/** Verto PST contract id */
export const VERTO_CONTRACT_PST = "xRkYokQfFHLh2K9slmghlXNptKrqQdDZoy75JGsv89M";

/**
 * Cache interface configuration
 * (The COMMUNITY_CONTRACT is not included in this, import it from this file)
 */
export const CACHE_CONFIG = {
  CONTRACT_CDN: "https://storage.googleapis.com/verto-exchange-contracts-stage",
  CACHE_API: "https://verto-qa.wn.r.appspot.com",
};

/** Global verto-js client instance */
export const verto = new Verto("use_wallet", client, true, {
  COMMUNITY_CONTRACT,
  CLOB_CONTRACT,
  CACHE_CONFIG,
  EXCHANGE_CONTRACT: VERTO_CONTRACT_PST,
});

/** @deprecated */
export const __CACHE_URL_V2__ = "https://v2.cache.verto.exchange";

/** Arweave functionalities */

export const balanceHistory = async (
  address: string
): Promise<{ [date: string]: number }> => {
  const inTxs = (await gql
    .search()
    .to(address)
    .limit(100)
    .find()) as ArdbTransaction[];
  const outTxs = (await gql
    .search()
    .from(address)
    .limit(100)
    .find()) as ArdbTransaction[];

  const txs = inTxs
    .concat(outTxs)
    .filter((tx) => !!tx?.block?.timestamp)
    .sort((a, b) => b.block.timestamp - a.block.timestamp)
    .slice(0, 100);
  let balance = parseFloat(
    client.ar.winstonToAr(await client.wallets.getBalance(address))
  );

  const res = {
    [moment().format("MMM DD, YYYY - HH:mm")]: balance,
  };

  for (const tx of txs) {
    balance += parseFloat(tx.fee.ar);

    if (tx.owner.address === address) {
      balance += parseFloat(tx.quantity.ar);
    } else {
      balance -= parseFloat(tx.quantity.ar);
    }

    res[moment(tx.block.timestamp * 1000).format("MMM DD, YYYY - HH:mm")] =
      balance;
  }

  return res;
};

/** Get arweave price */
export const arPrice = async (): Promise<number> => {
  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  return gecko.arweave.usd;
};

/** Validate if a string is a valid Arweave address */
export const isAddress = (addr: string) => /^[a-z0-9_-]{43}$/i.test(addr);
