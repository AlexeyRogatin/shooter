import express from "express";
import http from "http";
import { Server } from "socket.io";
import webpack from "webpack";
import webpackMiddleware from "webpack-dev-middleware";
import webpackConfig from "../../webpack.config.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const compiler = webpack(webpackConfig);
app.use(
  webpackMiddleware(compiler, {
    publicPath: webpackConfig.output?.publicPath || "/",
  }),
);

app.use(express.static("dist"));

interface Player {
  id: string;
  position: { x: number; y: number; z: number };
  color: number;
}

const players: Record<string, Player> = {};

io.on("connection", (socket) => {
  console.log("New player connected:", socket.id);

  players[socket.id] = {
    id: socket.id,
    position: { x: 0, y: 0.5, z: 0 },
    color: Math.floor(Math.random() * 0xffffff),
  };

  socket.emit("current-players", players);

  socket.broadcast.emit("new-player", players[socket.id]);

  socket.on("player-move", (position) => {
    if (players[socket.id]) {
      players[socket.id].position = position;
      socket.broadcast.emit("player-moved", {
        id: socket.id,
        position: position,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    delete players[socket.id];
    io.emit("player-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
