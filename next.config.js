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
      {
        source: "/(@):user/creations",
        destination: "/user/:user/creations",
      },
      {
        source: "/(@):user/owns",
        destination: "/user/:user/owns",
      },
    ];
  },
};
