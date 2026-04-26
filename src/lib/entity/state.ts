import Player from "./player";
import { ArrayOf, Serializable } from "./serializable";

@Serializable
export default class State {
  @ArrayOf(Player)
  players: Player[] = [];
}
