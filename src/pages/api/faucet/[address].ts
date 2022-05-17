import { JWKInterface } from "arweave/node/lib/wallet";
import { NextApiRequest, NextApiResponse } from "next";
import { fetchBalanceByUserAddress } from "verto-cache-interface";
import {
  client,
  isAddress,
  USD_STABLECOIN_ID,
  VERTO_CONTRACT_PST,
  COMMUNITY_CONTRACT,
  CLOB_CONTRACT,
  CACHE_CONFIG,
} from "../../../utils/arweave";
import Verto from "@verto/js";

const FAUCET_AMOUNT = 500;

/**
 * The testnet faucet route gives users USDC by transferring
 * it from a hodler wallet. It will only work once, and it
 * should be removed after going MAINNET.
 * This route gets requested when the user connects their
 * wallet to Verto.
 */
export default async function faucet(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  // validate wallet address
  if (!address || typeof address !== "string" || !isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  try {
    // check if the user has already received USDC
    const { balance } = await fetchBalanceByUserAddress(
      USD_STABLECOIN_ID,
      address
    );

    if (balance > 0) {
      return res.status(400).json({ error: "User already received USDC" });
    }

    // send the USDC
    const wallet: JWKInterface = JSON.parse(process.env.FAUCET_WALLET);
    const verto = new Verto(wallet, client, true, {
      COMMUNITY_CONTRACT,
      CLOB_CONTRACT,
      CACHE_CONFIG,
      EXCHANGE_CONTRACT: VERTO_CONTRACT_PST,
    });

    await verto.token.transfer(FAUCET_AMOUNT, USD_STABLECOIN_ID, address, [
      {
        name: "Exchange",
        value: "Verto",
      },
      {
        name: "Action",
        value: "Faucet",
      },
    ]);

    res.status(200).send("Sent tokens");
  } catch (e) {
    res.status(400).json({ error: "Could not send USDC", message: e.message });
  }
}
