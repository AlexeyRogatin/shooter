import { ArrayOf, Serializable } from "../entityDecorators/serializable";
import Player from "./player";

@Serializable
export default class State {
  @ArrayOf(Player)
  players: Player[] = [];
}
