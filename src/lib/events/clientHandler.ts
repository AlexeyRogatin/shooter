import State from "../entity/state";
import { ClientSocket } from "./event";
import { clientEvents } from "./events";

export class ClientHandler {
  constructor(
    public readonly socket: ClientSocket,
    public readonly state: State,
  ) {}

  initialize() {
    this.socket.on("connect", () => {
      for (const event of clientEvents) {
        this.socket.on(event.name, (data) => {
          console.log(event.name, data);
          new event({ clientSocket: this.socket }).handle({
            data,
            state: this.state,
          });
        });
      }
    });
  }
}
