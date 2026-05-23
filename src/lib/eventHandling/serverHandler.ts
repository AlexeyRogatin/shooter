import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import State from "../entities/state";
import { events } from "../events/events";

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
      for (const event of events) {
        socket.on(event.name, (data: any) => {
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
