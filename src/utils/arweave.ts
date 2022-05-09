import { GatewayConfig } from "arconnect";
import ArdbTransaction from "ardb/lib/models/transaction";
import GQLResultInterface from "ar-gql/dist/faces";
import Arweave from "arweave";
import axios from "axios";
import moment from "moment";
import ArDB from "ardb";
import Verto from "@verto/js";

/** Global APIs and constants */

/** Arweave gateway config */
export const gatewayConfig: GatewayConfig = {
  host: "www.arweave.run",
  port: 443,
  protocol: "https",
};

/** Global Arweave client instance */
export const client = new Arweave(gatewayConfig);

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
export const COMMUNITY_CONTRACT = "U6Kgs7Xy7MvaMr-h--VOb3T5bnrtJ1tKRD7bzBs_b84";

/** Clob contract id */
export const CLOB_CONTRACT = "X_8nM4tZUu3EGaL7wxiU3Sme5pe21Ei9iQJHK605P8M";

/** Collection contract src tx id */
export const COLLECTION_CONTRACT_SRC =
  "KlL_JTNBKyAbcAlOR4zE9hxltfR_0RAbuGMwIQx59BA";

/** Collectible contract src tx id */
export const COLLECTIBLE_CONTRACT_SRC =
  "_P5_-rvjUgmEodjPgqATeepJkSf3iT2_rUi8hX_qbhY";

/** Verto PST contract id */
export const VERTO_CONTRACT_PST = "E_thW3lmhwfUmgPpTa6Up-uSRrr_ff4I2ZyssaVar94";

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

/**
 * Run a query on the Arweave Graphql API, using the
 * global client instance's configured gateway
 *
 * @param query The query string to run
 * @param variables GQL variables to pass
 * @returns Query result
 */
export async function run(
  query: string,
  variables?: Record<string, unknown>
): Promise<GQLResultInterface> {
  const graphql = JSON.stringify({
    query,
    variables,
  });

  // execute the query
  const { data } = await axios.post(gateway() + "/graphql", graphql, {
    headers: {
      "content-type": "application/json",
    },
  });

  return data;
}

/**
 * Check if a token supports the FCP. This is needed to enable trading for it.
 *
 * @param state State of the token
 * @returns true if the token supports FCP
 */
export function supportsFCP(state: any): boolean {
  return state?.invocations && state?.foreignCalls;
}
