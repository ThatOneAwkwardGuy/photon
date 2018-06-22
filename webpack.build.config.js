const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const mainConfig = {
  mode: "production",
  target: "electron-main",
  entry: { main: "./app/main.js", vendor: ["firebase"] },
  output: {
    path: __dirname + "/webpack-pack/build",
    filename: "[name].js"
  },
  node: {
    __dirname: false,
    __filename: false
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
    })
  ],
  resolve: {
    extensions: [".js", ".json", ".jsx"]
  }
};

const appConfig = {
  mode: "production",
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
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.(jpe?g|png|gif)$/,
        use: [{ loader: "file-loader?name=img/[name]__[hash:base64:5].[ext]" }]
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [{ loader: "file-loader?name=files/[name]__[hash:base64:5].[ext]" }]
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
      title: "Photon",
      template: "./app/index.html",
      inject: false
    })
  ],
  resolve: {
    extensions: [".js", ".json", ".jsx"]
  }
};

module.exports = [mainConfig, appConfig];
