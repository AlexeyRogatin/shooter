import GameEvent from "../eventHandling/event";
import AddPlayerEvent from "../events/addPlayerEvent";
import StateEvent from "../events/stateEvent";

export const events: (typeof GameEvent)[] = [AddPlayerEvent, StateEvent];
