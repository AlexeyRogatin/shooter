import Player from "../entity/player";
import GameEvent, { EventData } from "./event";

export default class AddPlayerEvent extends GameEvent {
  handle({ state }: EventData) {
    this.useServer((socket) => {
      if (state.players.find((p) => p.socketId === socket.id)) return;
      const player = new Player();
      player.socketId = socket.id;
      state.players.push(player);
    });
    this.useClient((socket) => {
      if (state.players.find((p) => p.socketId === socket.id)) return;
      const player = new Player();
      player.socketId = socket.id!;
      state.players.push(player);
    });
  }
}
