import { io } from "socket.io-client";
import State from "../entities/state";
import { events } from "../events/events";

export class ClientHandler {
  private readonly socket = io(window.location.origin);

  constructor(public readonly state: State) {}

  get socketId() {
    return this.socket.id;
  }

  async initialize() {
    return new Promise<void>((resolve) => {
      this.socket.on("connect", () => {
        for (const event of events) {
          this.socket.on(event.name, (data: any) => {
            console.log(event.name, data);
            new event({ clientSocket: this.socket }).handle({
              data,
              state: this.state,
            });
          });
        }
        resolve();
      });
    });
  }

  emit(event: string, data: any = {}) {
    const eventObj = events.find((e: any) => e.name === event);
    if (eventObj) {
      console.log(eventObj.name, data);
      new eventObj({ clientSocket: this.socket }).handle({
        data,
        state: this.state,
      });
    }
    this.socket.emit(event, data);
  }
}
