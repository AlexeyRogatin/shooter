import GameEvent, { EventData } from "./event";
import { deserialize } from "../entity/serializable";

export default class StateEvent extends GameEvent {
  handle({ state, data }: EventData) {
    deserialize(state, data);
  }
}
