import { NextApiRequest, NextApiResponse } from "next";
// TODO: gradient
import { randomEmoji } from "../../utils/user";
import { CACHE_URL } from "../../utils/arweave";
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
  const currentPrice =
    gecko.arweave.usd *
    (Object.values(priceHistory)?.[Object.values(priceHistory).length - 1] ??
      0);

  let {
    data: { state },
  } = await axios.get(`${CACHE_URL}/${id}`);

  if (state.settings)
    state.settings = Object.fromEntries(new Map(state.settings));

  const size = { width: 1200, height: 630 };
  const graphSize = { width: size.width * 0.8, height: size.width * 0.5 };
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
          .graph {
            position: absolute;
            top: 45vh;
            left: 10vh;
            right: 10vh;
            height: 50vh;
            width: calc(100vw - 20vh);
          }
        </style>
      </head>
      <body>
        <div class="token-data">
          <h1>${state.name} <span class="ticker">(${state.ticker})</span></h1>
          <h1 class="price">$${currentPrice.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
          })}</h1>
        </div>
        <img class="logo" src="${
          state.settings?.communityLogo
            ? `https://arweave.net/${state?.settings?.communityLogo}`
            : randomEmoji(600)
        }" alt="logo" />
        <svg viewBox="0 0 ${graphSize.width} ${
    graphSize.height
  }" preserveAspectRatio="none" class="graph">
          <path d="M${Object.values(priceHistory)
            .reverse()
            .map(
              (val, i) =>
                `${
                  i * (graphSize.width / Object.values(priceHistory).length)
                } ${
                  graphSize.height -
                  (graphSize.height / 100) *
                    (((val - Math.min(...Object.values(priceHistory))) /
                      (Math.max(...Object.values(priceHistory)) -
                        Math.min(...Object.values(priceHistory)))) *
                      100)
                }`
            )
            .join(" L ")}" fill="none" stroke="#000" stroke-width="4" />
        </svg>
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
