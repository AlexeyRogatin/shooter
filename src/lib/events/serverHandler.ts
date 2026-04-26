import { Server } from "socket.io";
import State from "../entity/state";
import { serverEvents } from "./events";
import { Server as HttpServer } from "http";

export class ServerHandler {
  private readonly io: Server;

  constructor(
    public readonly server: HttpServer,
    public readonly state: State,
  ) {
    this.io = new Server(server);
  }

  initialize() {
    this.io.on("connection", (socket) => {
      for (const event of serverEvents) {
        socket.on(event.name, (data) => {
          console.log(event.name, data);
          new event({ serverSocket: socket }).handle({
            data,
            state: this.state,
          });
        });
      }
    });
  }

  emit(event: string, data: any) {
    this.io.emit(event, data);
  }
}
