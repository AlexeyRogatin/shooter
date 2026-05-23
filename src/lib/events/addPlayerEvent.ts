import Player from "../entities/player";
import GameEvent, { EventData } from "../eventHandling/event";

export default class AddPlayerEvent extends GameEvent {
  handle({ state, data: { tempId } }: EventData) {
    if (state.players.find((p) => p.socketId === this.socket.id)) return;
    const player = new Player();
    player.socketId = this.socket?.id ?? "";
    player.tempId = tempId;
    state.players.push(player);
  }
}
