const withImages = require("next-images");

module.exports = {
  ...withImages(),
  future: {
    webpack5: true,
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        react: "preact/compat",
        "react-dom": "preact/compat",
      });
    }

    return config;
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
      },
      {
        source: "/feedback",
        destination: "https://forms.gle/m3TJDfg1HRpV994Y8",
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
