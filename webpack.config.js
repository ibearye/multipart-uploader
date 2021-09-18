const path = require('path');
const webpack = require('webpack');
const CleanPlugin = require('webpack').CleanPlugin;
const ProgressPlugin = require('webpack').ProgressPlugin;
const CleanTerminalPlugin = require('clean-terminal-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: {
    index: './src/index.ts',
    'compute-md5': './src/libs/compute-md5.ts',
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  externals: ['axios'],
  // process.env.NODE_ENV === 'production' ? ['axios', 'spark-md5'] : [],

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'umd',
    globalObject: 'this',
    libraryExport: 'default',
    library: 'MultiUploader',
  },

  module: {
    rules: [
      // { test: /\.js$/, use: 'babel-loader', exclude: /core-js/ },
      {
        test: /\.worker.ts$/,
        use: [
          {
            loader: 'worker-loader',
            options: {
              inline: 'fallback',
              filename: 'compute-md5.worker.js',
            },
          },
        ],
      },
      { test: /\.ts$/, use: ['babel-loader', 'ts-loader'], exclude: /core-js/ },
    ],
  },

  devServer: {
    static: path.join(__dirname, 'example'),
    compress: true,
    port: 8010,
    client: {
      logging: 'none',
    },
  },

  plugins: [
    new CleanPlugin(),
    new ESLintPlugin(),
    new ProgressPlugin(),
    new CleanTerminalPlugin(),
    // new HTMLWebpackPlugin({
    //   template: path.join(__dirname, 'example/index.html'),
    // }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],

  // optimization: {
  //   minimize: true,
  //   minimizer: [new TerserWebpackPlugin()],
  // },

  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
};
