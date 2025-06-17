/**
 * COMMON WEBPACK CONFIGURATION
 */

import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import globals from './globals';

const isDevelopment = process.env.NODE_ENV === 'development';

const nodeModules = fs.readdirSync('node_modules')
  .filter(x => ['.bin'].indexOf(x) === -1)
  .reduce((result, mod) => Object.assign(result, {[mod]: 'commonjs ' + mod}, {}));

export default {
  mode: 'none'
  , devtool: isDevelopment ? 'source-map' : 'source-map'
  , entry: isDevelopment ? ['./server/index.js'] : ['./server/index.js']
  , output: {
    path: path.join(__dirname, 'dist/server/')
    , filename: 'index.js'
  }
  , target: 'node' // Make web variables accessible to webpack, e.g. window
  , node: {
    __filename: true,
    __dirname: true
  }
  , plugins: [
    isDevelopment ? new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false
    }) : null
    //, isDevelopment ? new webpack.HotModuleReplacementPlugin({quiet: false}) : null
    , new webpack.IgnorePlugin(/\.(css|less|mp3|wav)$/)
  ].filter(p => p !== null)
  , externals: nodeModules
  , module: {
    rules: [{
      test: /\.js$/, // Transform all .js files required somewhere with Babel
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      },
      //query: ['es2015', 'stage-0']
    }]
  }
  , optimization: {
    nodeEnv: false // https://github.com/webpack/webpack/issues/6934
  }
};
