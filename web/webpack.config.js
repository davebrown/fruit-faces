var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
  entry: ["babel-polyfill", "./src/app.js"],
  output: {
    filename: "index.js"
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    historyApiFallback: true,
    disableHostCheck: true
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      "NODE_ENV": 'development',
      "FF_BACKEND_URL": 'http://localhost:9080',
      "FF_URL": 'http://localhost:3000',
      "AMPLITUDE_API_KEY": null,
      "FB_APP_ID": null,
      "FF_BUILD_DESCRIPTION": 'dev build ' + (new Date())
    }),
    new ExtractTextPlugin('bundle.css')
  ],
  module: {
    loaders: [
      {
        test: /\.js(x)?$/,
        //exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'react', 'babel-preset-stage-0' ]
        }
      },
      {
        test: /\.css$/,
        //loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff'
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }      
    ]
  }
};

if (process.env.NODE_ENV === 'production') {
  module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin());
}
