const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const mainConfig = {
  target: "electron-main",
  entry: "./app/main.js",
  output: {
    path: __dirname + "/webpack-pack/build",
    filename: "main.js"
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        options: {
          presets: "minify"
        },
        exclude: /node_modules/
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
    new HtmlWebpackPlugin({
      title: "Photon"
    })
  ],

  resolve: {
    extensions: [".js", ".json", ".jsx"]
  }
};

const appConfig = {
  target: "electron-renderer",
  entry: "./app/app.js",
  output: {
    path: __dirname + "/webpack-pack/build",
    filename: "app.js"
  },

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: "babel-loader",
        options: {
          presets: "minify"
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loader: ["style-loader", "css-loader"]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: "file-loader",
        query: {
          name: "[name].[ext]?[hash]"
        }
      },
      {
        test: /npm\.js$/,
        loader: "string-replace-loader",
        include: path.resolve("node_modules/firebaseui/dist"),
        options: {
          search: "require('firebase/app');",
          replace: "require('firebase/app').default;"
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
    new HtmlWebpackPlugin({
      title: "Photon"
    })
  ],

  resolve: {
    extensions: [".js", ".json", ".jsx"]
  }
};

module.exports = [mainConfig, appConfig];
