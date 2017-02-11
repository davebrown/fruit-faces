var webpack = require('webpack');

module.exports = {
  entry: "./src/app.js",
  output: {
    filename: "index.js"
  },
  devServer: {
    host: '0.0.0.0',
    port: 3000
  },
  plugins: [
    new webpack.EnvironmentPlugin([
      "NODE_ENV", "FF_BACKEND_URL", "AMPLITUDE_API_KEY", "FB_APP_ID"
    ])
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
      }
    ]
  }
};

if (process.env.NODE_ENV === 'production') {
  module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin());
}
