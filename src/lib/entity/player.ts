import Entity from "./entity";
import * as CANNON from "cannon-es";
import { Serializable, Serialize } from "./serializable";

@Serializable
export default class Player extends Entity {
  @Serialize
  socketId: string | null = null;

  constructor() {
    super();
    this.body.addShape(new CANNON.Sphere(0.5));
    this.body.mass = 1;
  }
}
