import express from "express";
import http from "http";
import webpack from "webpack";
import webpackMiddleware from "webpack-dev-middleware";
import webpackConfig from "../../webpack.config";
import State from "../lib/entities/state";
import { ServerHandler } from "../lib/eventHandling/serverHandler";

process.env.IS_SERVER = "true";

const app = express();
const compiler = webpack(webpackConfig);
app.use(
  webpackMiddleware(compiler, {
    publicPath: webpackConfig.output?.publicPath || "/",
  }),
);
app.use(express.static("dist"));

const server = http.createServer(app);
const state = new State();
const handler = new ServerHandler(server, state);
handler.initialize();

function emitLoop() {
  handler.emit("StateEvent", state);
  setTimeout(emitLoop, 1000 / 60);
}

emitLoop();

const PORT = process.env.PORT || 3000;
server.listen(PORT);
