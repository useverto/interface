const withImages = require("next-images");

/** @type {import('next').NextConfig} */
module.exports = {
  ...withImages(),
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        react: "preact/compat",
        "react-dom": "preact/compat",
      });
    }

    Object.assign(config.externals, {
      fs: "fs",
    });
    Object.assign(config.module, {
      rules: config.module.rules.concat([
        {
          test: /\.md$/,
          loader: "emit-file-loader",
          options: {
            name: "dist/[path][name].[ext]",
          },
        },
        {
          test: /\.md$/,
          loader: "raw-loader",
        },
      ]),
    });

    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Community-Contract",
            value: "usjm4PCxUd5mtaon7zc97-dt-3qf67yPyqgzLnLqk5A",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/u/:user",
        destination: "/@:user",
        permanent: true,
      },
      {
        source: "/user/:user",
        destination: "/@:user",
        permanent: true,
      },
      {
        source: "/roadmap",
        destination:
          "https://www.notion.so/verto/48f99dfb0ba744f5b5257185f53ad7c4",
        permanent: true,
      },
      {
        source: "/feedback",
        destination: "https://forms.gle/m3TJDfg1HRpV994Y8",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/(@):user",
        destination: "/user/:user",
      },
      {
        source: "/(@):user/trades",
        destination: "/user/:user/trades",
      },
      {
        source: "/(@):user/transactions",
        destination: "/user/:user/transactions",
      },
      {
        source: "/(@):user/creations",
        destination: "/user/:user/creations",
      },
      {
        source: "/(@):user/owns",
        destination: "/user/:user/owns",
      },
      {
        source: "/i/win",
        destination:
          "https://raw.githubusercontent.com/useverto/trading-post/master/install/windows.ps1",
      },
      {
        source: "/i/mac",
        destination:
          "https://raw.githubusercontent.com/useverto/trading-post/master/install/mac.sh",
      },
      {
        source: "/i/linux",
        destination:
          "https://raw.githubusercontent.com/useverto/trading-post/master/install/linux.sh",
      },
      {
        source: "/chat",
        destination: "https://discord.gg/sNgJkMg",
      },
      {
        source: "/link",
        destination:
          "https://arweave.net/CodqSDWXY5CALyMf9oFLCtTDRYdW4lV9X9O7j-73g1U",
      },
    ];
  },
};
