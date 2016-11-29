var webpack = require('webpack');

module.exports = {
  entry: "./src/app.js",
  output: {
    filename: "index.js"
  },
  devServer: {
    host: '0.0.0.0',
    port: 8080
  },
  plugins: [
    new webpack.EnvironmentPlugin([
      "NODE_ENV", "TOKEN"
    ])    
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015', 'react' ]
        }
      }
    ]
  }
};
