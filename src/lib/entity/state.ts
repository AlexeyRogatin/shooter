import Player from "./player";
import { ArrayOf, Serializable, Serialize } from "./serializable";

@Serializable
export default class State {
  @ArrayOf(Player)
  @Serialize
  players: Player[] = [];
}
