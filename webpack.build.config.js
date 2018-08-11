const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const mainConfig = {
  mode: 'production',
  target: 'electron-main',
  entry: { main: './app/main.js', vendor: ['firebase'] },
  output: {
    path: __dirname + '/webpack-pack',
    filename: '[name].js'
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
          presets: 'minify',
          plugins: ['emotion']
        },
        exclude: /node_modules/
      },
      {
        test: /\.js$/,
        include: [path.resolve(__dirname, '/app')],
        enforce: 'post',
        use: {
          loader: 'obfuscator-loader'
        }
      }
    ]
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        output: {
          comments: false,
          beautify: false
        }
      }
    }),
    new JavaScriptObfuscator()
  ],
  resolve: {
    extensions: ['.js', '.json', '.jsx']
  }
};

const appConfig = {
  mode: 'production',
  target: 'electron-renderer',
  entry: './app/app.js',
  output: {
    path: __dirname + '/webpack-pack',
    filename: 'app.js'
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          presets: 'minify'
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(jpe?g|png|gif)$/,
        use: [{ loader: 'file-loader?name=/img/[name]__[hash:base64:5].[ext]' }]
      },
      {
        test: /\.(svg)$/,
        use: [
          {
            loader: 'file-loader?name=/files/[name]__[hash:base64:5].[ext]',
            options: {
              useRelativePath: true
            }
          }
        ]
      },
      { test: /\.(png|woff|woff2|eot|ttf)$/, loader: 'url-loader?limit=100000' }
    ]
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        output: {
          comments: false,
          beautify: false
        }
      }
    }),
    new HtmlWebpackPlugin({
      title: 'Photon',
      template: './app/index.html',
      inject: false
    }),
    new JavaScriptObfuscator(),
    new CopyWebpackPlugin([
      {
        from: './app/img/icon.png',
        to: './',
        toType: 'dir'
      }
    ])
  ],
  resolve: {
    extensions: ['.js', '.json', '.jsx']
  }
};

module.exports = [mainConfig, appConfig];
