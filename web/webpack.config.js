const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: ["./src/app.js"],
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, '.'),
    publicPath: '/'
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000,
    historyApiFallback: true,
    allowedHosts: 'all',
    static: {
      directory: path.join(__dirname, '.'),
    }
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
    new MiniCssExtractPlugin({
      filename: 'bundle.css'
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        type: 'asset/inline',
        parser: {
          dataUrlCondition: {
            maxSize: 10000
          }
        }
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        type: 'asset/resource'
      }      
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
