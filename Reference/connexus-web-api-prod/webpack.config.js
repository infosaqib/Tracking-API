const swcDefaultConfig =
  require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory()
    .swcOptions;
const { join } = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
      {
        test: /\.hbs$/,
        type: 'asset/resource',
        generator: {
          filename: '[path][name][ext]',
        },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: join(
            __dirname,
            'apps/connexus-be/src/libs/ses/templates/designs',
          ),
          to: join(
            __dirname,
            'dist/apps/connexus-be/libs/ses/templates/designs',
          ),
        },
      ],
    }),
  ],
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
  },
};
