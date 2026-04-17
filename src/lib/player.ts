import Entity from "./entity.js";
import CANNON from "cannon-es";

export default class Player extends Entity {
  socketId: string;

  constructor(socketId: string) {
    super();
    this.socketId = socketId;
    this.body.addShape(new CANNON.Sphere(0.5));
    this.body.mass = 1;
  }
}
