import AddPlayerEvent from "./addPlayerEvent";
import GameEvent from "./event";
import StateEvent from "./stateEvent";

export const serverOnlyEvents: (typeof GameEvent)[] = [];
export const clientOnlyEvents: (typeof GameEvent)[] = [StateEvent];
export const sharedEvents: (typeof GameEvent)[] = [AddPlayerEvent];

export const serverEvents = [...serverOnlyEvents, ...sharedEvents];
export const clientEvents = [...clientOnlyEvents, ...sharedEvents];
