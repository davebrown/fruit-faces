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
      "NODE_ENV", "FF_BACKEND_URL", "AMPLITUDE_API_KEY"
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
