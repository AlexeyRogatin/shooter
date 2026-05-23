import * as CANNON from "cannon-es";
import Vector from "../helpers/vector";

export class World {
  private static defaultWorldName = "default";

  static worlds: World[] = [];
  static activeWorlds = new Set<string>();

  name: string;
  world: CANNON.World;

  get gravity(): Vector {
    return Vector.from(this.world.gravity);
  }

  set gravity(gravity: Vector) {
    this.world.gravity.set(gravity.x, gravity.y, gravity.z);
  }

  constructor(name: string = World.defaultWorldName) {
    this.name = name;
    this.world = new CANNON.World();

    World.add(this);
  }

  addBody(body: CANNON.Body) {
    this.world.addBody(body);
  }

  removeBody(body: CANNON.Body) {
    this.world.removeBody(body);
  }

  static add(world: World) {
    this.worlds.push(world);
  }

  static remove(name: string = World.defaultWorldName) {
    this.worlds = this.worlds.filter((w) => w.name !== name);
  }

  static activate(name: string = World.defaultWorldName) {
    this.activeWorlds.add(name);
  }

  static deactivate(name: string = World.defaultWorldName) {
    this.activeWorlds.delete(name);
  }

  static getActiveWorlds(): World[] {
    return this.worlds.filter((w) => this.activeWorlds.has(w.name));
  }

  static get(name: string = World.defaultWorldName): World | undefined {
    return this.worlds.find((w) => w.name === name);
  }
}

new World();

export default World;
