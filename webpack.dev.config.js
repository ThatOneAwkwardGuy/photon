const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
var LiveReloadPlugin = require('webpack-livereload-plugin');

const mainConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-main',
  entry: {
    main: path.normalize(path.resolve(__dirname, 'app', 'main.js')),
    vendor: ['firebase']
  },
  output: {
    path: path.normalize(path.join(path.resolve(__dirname, 'webpack-pack'), '/')),
    filename: '[name].js'
    // publicPath: path.normalize(path.join(path.resolve(__dirname, 'webpack-pack'), '/'))
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
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-function-bind',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-export-namespace-from'
          ]
        },
        exclude: /node_modules(?!\/webpack-dev-server)/
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-function-bind',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-export-namespace-from'
          ]
        },
        exclude: /node_modules(?!\/webpack-dev-server)/
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx']
  }
};

const appConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-renderer',
  entry: path.normalize(path.resolve(__dirname, 'app', 'app.js')),
  output: {
    path: path.normalize(path.join(path.resolve(__dirname, 'webpack-pack'), '/')),
    filename: 'app.js'
    // publicPath: path.normalize(path.join(path.resolve(__dirname, 'webpack-pack'), '/'))
  },
  node: {
    __dirname: true
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
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-function-bind',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-export-namespace-from'
          ]
        },
        exclude: /node_modules(?!\/webpack-dev-server)/
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-function-bind',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-export-namespace-from'
          ]
        },
        exclude: /node_modules(?!\/webpack-dev-server)/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(jpe?g|png|gif)$/,
        use: [{ loader: 'url-loader?name=/img/[name]__[hash:base64:5].[ext]' }]
      },
      {
        test: /\.(svg)$/,
        use: [
          {
            loader: 'url-loader?name=/files/[name]__[hash:base64:5].[ext]'
          }
        ]
      },
      { test: /\.(png|woff|woff2|eot|ttf)$/, loader: 'url-loader?limit=100000' }
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

const captchaPreloadConfig = {
  mode: 'development',
  devtool: 'source-map',
  target: 'electron-renderer',
  entry: path.normalize(path.resolve(__dirname, 'app', 'utils', 'captchaPreload.js')),
  output: {
    path: path.normalize(path.join(path.resolve(__dirname, 'webpack-pack'), '/')),
    filename: 'captchaPreload.js'
  },
  node: {
    __dirname: true
  },
  devServer: {
    hot: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
          plugins: [
            '@babel/plugin-proposal-function-bind',
            ['@babel/plugin-proposal-decorators', { legacy: true }],
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-export-namespace-from'
          ]
        },
        exclude: /node_modules(?!\/webpack-dev-server)/
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx']
  }
};

module.exports = [mainConfig, appConfig, captchaPreloadConfig];
