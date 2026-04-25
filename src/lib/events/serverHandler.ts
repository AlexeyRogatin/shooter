import State from "../entity/state";
import { IO } from "./event";
import { serverEvents } from "./events";

export class ServerHandler {
  constructor(
    public readonly io: IO,
    public readonly state: State,
  ) {}

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
}
