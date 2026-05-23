import { deserialize } from "../entityDecorators/serializable";
import GameEvent, { EventData } from "../eventHandling/event";

export default class StateEvent extends GameEvent {
  handle({ state, data }: EventData) {
    deserialize(state, data);
  }
}
