import Player from "../entity/player";
import GameEvent, { EventData } from "./event";

export default class AddPlayerEvent extends GameEvent {
  handle({ state, data: { tempId } }: EventData) {
    this.useClient((socket) => {
      if (state.players.find((p) => p.socketId === socket.id)) return;
      const player = new Player();
      player.socketId = socket.id!;
      player.tempId = tempId;
      state.players.push(player);
    });
    this.useServer((socket) => {
      if (state.players.find((p) => p.socketId === socket.id)) return;
      const player = new Player();
      player.socketId = socket.id;
      player.tempId = tempId;
      state.players.push(player);
    });
  }
}
