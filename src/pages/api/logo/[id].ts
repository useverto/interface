import { NextApiRequest, NextApiResponse } from "next";
import { fetchContract } from "verto-cache-interface";
import { gateway, isAddress, verto } from "../../../utils/arweave";
import axios, { AxiosResponse } from "axios";

export default async function logo(req: NextApiRequest, res: NextApiResponse) {
  const { id, theme } = req.query;

  // validate input
  if (typeof id !== "string" || !isAddress(id)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  // validate theme
  if (
    theme !== undefined &&
    (typeof theme !== "string" ||
      !["dark", "light"].includes(theme.toLowerCase()))
  ) {
    return res.status(400).json({ error: "Invalid theme" });
  }

  // get cryptometa logo
  const cryptometaLogo = await axios.get(
    verto.token.getLogo(id, theme as "dark" | "light"),
    { responseType: "arraybuffer" }
  );

  const sendLogo = (logoReq: AxiosResponse<any>) => {
    res.setHeader(
      "Cache-Control",
      "public, immutable, no-transform, s-maxage=31536000, max-age=31536000"
    );
    res.setHeader("Content-Type", logoReq.headers["content-type"]);
    res.status(200).send(logoReq.data);
  };

  if (cryptometaLogo.status === 200) {
    return sendLogo(cryptometaLogo);
  }

  try {
    const { state } = await fetchContract(id);
    const settings: Map<string, any> = new Map(state.settings);
    const logo: string = settings?.get("communityLogo");

    // try getting the logo from the state
    if (logo) {
      const logoInState = await axios.get(`${gateway()}/${logo}`);

      return sendLogo(logoInState);
    } else {
      return sendLogo(cryptometaLogo);
    }
  } catch {
    return sendLogo(cryptometaLogo);
  }
}
