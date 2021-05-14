const withImages = require("next-images");

module.exports = {
  ...withImages(),
  future: {
    webpack5: true,
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
    ];
  },
};
