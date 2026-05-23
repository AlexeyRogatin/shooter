import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Socket as SocketClient } from "socket.io-client";
import State from "../entities/state";

export type IO = Server<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;
export type ClientSocket = SocketClient<DefaultEventsMap, DefaultEventsMap>;
export type ServerSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

export interface EventData {
  data: any;
  state: State;
}

export interface EventConstructor {
  serverSocket?: ServerSocket;
  clientSocket?: ClientSocket;
}

export default class GameEvent {
  serverSocket: ServerSocket | null;
  clientSocket: ClientSocket | null;

  get socket(): ServerSocket | ClientSocket {
    return process.env.IS_SERVER ? this.serverSocket! : this.clientSocket!;
  }

  constructor({ serverSocket, clientSocket }: EventConstructor) {
    this.serverSocket = serverSocket ?? null;
    this.clientSocket = clientSocket ?? null;
  }

  handle(_args: EventData) {
    throw new Error("Not implemented");
  }
}
