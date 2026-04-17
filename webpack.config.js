import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

const config = {
  entry: "./src/client/client.ts",
  output: {
    path: path.resolve("./dist"),
    filename: "bundle.js",
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/client/index.html",
      filename: "index.html",
    }),
  ],
  devServer: {
    static: "./dist",
  },
  mode: "development",
};

export default config;
