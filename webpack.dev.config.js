// const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
var LiveReloadPlugin = require('webpack-livereload-plugin');

console.log(__dirname);
console.log(path.resolve(__dirname, 'app'));

const mainConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-main',
  entry: {
    main: path.resolve(__dirname, 'app', 'main.js'),
    vendor: ['firebase']
  },
  output: {
    path: path.resolve(__dirname, './webpack-pack') + '/',
    filename: '[name].js',
    publicPath: path.resolve(__dirname, './webpack-pack') + '/'
  },
  node: {
    __dirname: false,
    __filename: false
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          presets: ['es2015', 'stage-0', 'react'],
          plugins: ['transform-decorators-legacy', 'transform-runtime']
        },
        exclude: /node_modules(?!\/webpack-dev-server)/
      }
    ]
  },
  plugins: [],
  resolve: {
    extensions: ['.js', '.json', '.jsx']
  }
};

const appConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-renderer',
  entry: './app/app.js',
  output: {
    path: path.resolve(__dirname, './webpack-pack/') + '/',
    filename: 'app.js',
    publicPath: path.resolve(__dirname, './webpack-pack/') + '/'
  },
  devServer: {
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          presets: ['es2015', 'stage-0', 'react'],
          plugins: ['transform-decorators-legacy', 'transform-runtime', 'emotion']
        },
        exclude: /node_modules(?!\/webpack-dev-server)/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(jpe?g|png|gif)$/,
        use: [{ loader: 'file-loader?name=img/[name]__[hash:base64:5].[ext]' }]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader?name=files/[name]__[hash:base64:5].[ext]',
            options: {
              useRelativePath: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Photon',
      template: './app/index.html',
      inject: false
    }),
    new LiveReloadPlugin()
  ],
  resolve: {
    extensions: ['.js', '.json', '.jsx']
  }
};

module.exports = [mainConfig, appConfig];
