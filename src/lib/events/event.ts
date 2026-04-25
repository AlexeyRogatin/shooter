import State from "../entity/state";
import { DefaultEventsMap, Server, Socket } from "socket.io";
import { Socket as SocketClient } from "socket.io-client";

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

  constructor({ serverSocket, clientSocket }: EventConstructor) {
    this.serverSocket = serverSocket ?? null;
    this.clientSocket = clientSocket ?? null;
  }

  isClient(): this is { clientSocket: ClientSocket; serverSocket: null } {
    return (
      this.clientSocket !== null &&
      typeof window !== "undefined" &&
      typeof document !== "undefined"
    );
  }

  isServer(): this is { serverSocket: ServerSocket; clientSocket: null } {
    return this.serverSocket !== null && !this.isClient();
  }

  useClient<T>(func: (socket: ClientSocket) => T) {
    if (this.isClient()) {
      return func(this.clientSocket);
    }
    return null;
  }

  useServer<T>(func: (socket: ServerSocket) => T | null) {
    if (this.isServer()) {
      return func(this.serverSocket);
    }
    return null;
  }

  handle(_args: EventData) {}
}
