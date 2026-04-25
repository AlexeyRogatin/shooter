import express from "express";
import http from "http";
import { Server } from "socket.io";
import webpack from "webpack";
import webpackMiddleware from "webpack-dev-middleware";
import webpackConfig from "../../webpack.config";
import State from "../lib/entity/state";
import { ServerHandler } from "../lib/events/serverHandler";

const app = express();
const compiler = webpack(webpackConfig);
app.use(
  webpackMiddleware(compiler, {
    publicPath: webpackConfig.output?.publicPath || "/",
  }),
);
app.use(express.static("dist"));

const server = http.createServer(app);
const io = new Server(server);
const state = new State();
const handler = new ServerHandler(io, state);
handler.initialize();

function emitLoop() {
  io.emit("StateEvent", state);
  setTimeout(emitLoop, 1000);
}

emitLoop();

const PORT = process.env.PORT || 3000;
server.listen(PORT);
