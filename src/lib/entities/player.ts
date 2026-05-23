import { Serializable, Serialize } from "../entityDecorators/serializable";
import World from "../entityDecorators/world";
import Entity from "./entity";
import * as CANNON from "cannon-es";

@Serializable
export default class Player extends Entity {
  @Serialize
  socketId: string | null = null;

  constructor() {
    super();
    this.body.addShape(new CANNON.Sphere(0.5));
    this.body.mass = 1;
  }

  initialize() {
    World.get()?.addBody(this.body);
  }

  destroy() {
    World.get()?.removeBody(this.body);
  }
}
