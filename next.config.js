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
        destination: "/user/:user",
        permanent: true,
      },
    ];
  },
};
