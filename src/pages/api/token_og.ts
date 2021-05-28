import { NextApiRequest, NextApiResponse } from "next";
import { randomEmoji } from "../../utils/user";
import captureWebsite from "capture-website";
import chrome from "chrome-aws-lambda";
import Verto from "@verto/js";
import axios from "axios";

export default async function TokenOG(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== "string")
    return res.status(400).send("Missing or invalid token ID");

  const client = new Verto();

  const priceHistory = await client.getPriceHistory(id);
  const { data: gecko } = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=arweave&vs_currencies=usd"
  );

  let {
    data: { state },
  } = await axios.get(`http://v2.cache.verto.exchange/${id}`);

  if (state.settings)
    state.settings = Object.fromEntries(new Map(state.settings));

  const size = { width: 1200, height: 630 };
  const OGImage = `
    <!DOCTYPE HTML>
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: "Poppins", sans-serif;
          }
          .token-data {
            position: absolute;
            left: 10vh;
            top: 10vh;
          }
          .token-data h1 {
            font-size: 4.15em;
            color: #000;
            margin: 0;
            font-weight: 500;
            line-height: 1em;
          }
          .token-data h1 .ticker {
            font-size: .5em;
            color: #666;
          }
          .token-data .price {
            font-size: 6em;
            font-weight: 600;
          }
          .logo {
            position: absolute;
            top: 10vh;
            right: 10vh;
            width: 180px;
            height: 180px;
          }
        </style>
      </head>
      <body>
        <div class="token-data">
          <h1>${state.name} <span class="ticker">(${state.ticker})</span></h1>
          <h1 class="price">$${
            gecko.arweave.usd *
            Object.values(priceHistory)[Object.values(priceHistory).length - 1]
          }</h1>
        </div>
        <img class="logo" src="${
          state.settings?.communityLogo
            ? `https://arweave.net/${state?.settings?.communityLogo}`
            : randomEmoji(600)
        }" alt="logo" />
      </body>
    </html>
  `;

  const dev = process.env.NODE_ENV === "development";
  const data = await captureWebsite.buffer(OGImage, {
    inputType: "html",
    type: "png",
    launchOptions: {
      headless: dev ? true : chrome.headless,
      executablePath: dev ? undefined : await chrome.executablePath,
      args: dev ? [] : chrome.args,
    },
    ...size,
  });

  res.setHeader("Content-Type", "image/png");
  res.setHeader(
    "Cache-Control",
    "public, immutable, no-transform, s-maxage=31536000, max-age=31536000"
  );
  res.status(200).send(data);
}
