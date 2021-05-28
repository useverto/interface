import { NextApiRequest, NextApiResponse } from "next";
import { randomEmoji } from "../../utils/user";
import { formatAddress } from "../../utils/format";
import captureWebsite from "capture-website";
import chrome from "chrome-aws-lambda";
import Verto from "@verto/js";

export default async function UserOG(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { u } = req.query;
  if (!u || typeof u !== "string")
    return res.status(400).send("Missing or invalid usertag");

  const client = new Verto();
  const user = await client.getUser(u);

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
          h1, h2 {
            font-weight: 500;
            line-height: 1em;
          }
          .avatar {
            position: absolute;
            width: 30vw;
            left: 10vh;
            border-radius: 100%;
            box-shadow: 0px 10px 20px rgba(0, 0, 0, .2);
            top: 50%;
            transform: translateY(-50%);
          }
          .user-data {
            position: absolute;
            width: calc(100vw - 10vh - 30vw - 10vh - 10vh);
            height: max-content;
            left: calc(10vh + 30vw + 10vh);
            top: 50%;
            transform: translateY(-50%);
          }
          .user-data h1 {
            font-size: 7em;
            color: #000;
            line-height: 1em;
            margin: 0;
            text-overflow: ellipsis;
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
          }
          .user-data h2 {
            font-size: 4em;
            color: #666;
            margin: 0;
            text-overflow: ellipsis;
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <img class="avatar" src="${
          user?.image ? `https://arweave.net/${user.image}` : randomEmoji(600)
        }" alt="pfp" />
        <div class="user-data">
          ${(user?.name && `<h1>${user.name}</h1>`) || ""}
          <h2>@${user?.username ?? formatAddress(u, 14)}</h2>
        </div>
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
