import { NextApiRequest, NextApiResponse } from "next";
import captureWebsite from "capture-website";
import chrome from "chrome-aws-lambda";

export default async function OG(req: NextApiRequest, res: NextApiResponse) {
  const { title, subtitle } = req.query;
  return res.status(503).send("Disabled");

  if (!title) return res.status(400).send("Missing title");

  const size = { width: 1200, height: 630 };
  const OGImage = `
    <svg width="${size.width}" height="${size.height}" viewBox="0 0 ${
    size.width
  } ${size.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style type="text/css">
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600");

        text {
          font-family: "Poppins", sans-serif;
        }
      </style>
      <rect width="1200" height="630" fill="white"/>
      <path d="M457.68 201.64V226.12H486.48V237.28H457.68V262.84H490.08V274H444V190.48H490.08V201.64H457.68ZM649.25 274L630.05 240.64H619.61V274H605.93V190.6H634.73C641.13 190.6 646.53 191.72 650.93 193.96C655.41 196.2 658.73 199.2 660.89 202.96C663.13 206.72 664.25 210.92 664.25 215.56C664.25 221 662.65 225.96 659.45 230.44C656.33 234.84 651.49 237.84 644.93 239.44L665.57 274H649.25ZM619.61 229.72H634.73C639.85 229.72 643.69 228.44 646.25 225.88C648.89 223.32 650.21 219.88 650.21 215.56C650.21 211.24 648.93 207.88 646.37 205.48C643.81 203 639.93 201.76 634.73 201.76H619.61V229.72ZM834.63 190.6V201.76H812.43V274H798.75V201.76H776.43V190.6H834.63ZM985.524 274.84C977.764 274.84 970.604 273.04 964.044 269.44C957.564 265.76 952.404 260.68 948.564 254.2C944.804 247.64 942.924 240.28 942.924 232.12C942.924 223.96 944.804 216.64 948.564 210.16C952.404 203.68 957.564 198.64 964.044 195.04C970.604 191.36 977.764 189.52 985.524 189.52C993.364 189.52 1000.52 191.36 1007 195.04C1013.56 198.64 1018.72 203.68 1022.48 210.16C1026.24 216.64 1028.12 223.96 1028.12 232.12C1028.12 240.28 1026.24 247.64 1022.48 254.2C1018.72 260.68 1013.56 265.76 1007 269.44C1000.52 273.04 993.364 274.84 985.524 274.84ZM985.524 262.96C991.044 262.96 995.964 261.72 1000.28 259.24C1004.6 256.68 1007.96 253.08 1010.36 248.44C1012.84 243.72 1014.08 238.28 1014.08 232.12C1014.08 225.96 1012.84 220.56 1010.36 215.92C1007.96 211.28 1004.6 207.72 1000.28 205.24C995.964 202.76 991.044 201.52 985.524 201.52C980.004 201.52 975.084 202.76 970.764 205.24C966.444 207.72 963.044 211.28 960.564 215.92C958.164 220.56 956.964 225.96 956.964 232.12C956.964 238.28 958.164 243.72 960.564 248.44C963.044 253.08 966.444 256.68 970.764 259.24C975.084 261.72 980.004 262.96 985.524 262.96Z" fill="black"/>
      <path d="M263.794 306C260.33 312 251.67 312 248.206 306L170.263 171C166.799 165 171.129 157.5 178.058 157.5H333.942C340.87 157.5 345.201 165 341.737 171L263.794 306Z" fill="black"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M248.206 306C251.67 312 260.33 312 263.794 306L341.736 171C341.756 170.967 341.775 170.934 341.793 170.901L275.9 285.032L202.269 157.5H178.058C171.129 157.5 166.799 165 170.263 171L248.206 306Z" fill="url(#paint0_linear)"/>
      <text x="50%" y="420" fill="#000" font-weight="500" font-size="50" text-anchor="middle">
        / ${title} /
      </text>
      ${
        (subtitle &&
          '<text x="50%" y="490" fill="#333" font-weight="500" font-size="27" text-anchor="middle">' +
            subtitle +
            "</text>") ||
        ""
      }
      <defs>
        <linearGradient id="paint0_linear" x1="198.465" y1="158.65" x2="255.367" y2="310.519" gradientUnits="userSpaceOnUse">
          <stop stop-color="#E789FF"/>
          <stop offset="1" stop-color="#7E07A8"/>
        </linearGradient>
      </defs>
    </svg>
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
