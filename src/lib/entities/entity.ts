import * as CANNON from "cannon-es";
import Vector from "../helpers/vector";
import Emitter from "../helpers/emitter";
import {
  Serializable,
  Id,
  TempId,
  Serialize,
} from "../entityDecorators/serializable";
import { LifecycleEntity } from "./lificycle";

@Serializable
export default class Entity extends LifecycleEntity {
  @Id
  id: string = globalThis.crypto.randomUUID();

  @TempId
  tempId: string | null = null;

  protected body: CANNON.Body = new CANNON.Body();

  emitter: Emitter = new Emitter();

  @Serialize
  get pos() {
    return Vector.from(this.body.position);
  }

  set pos(pos: Vector) {
    this.emitter.emit("posChange", pos);
    this.body.position.set(pos.x, pos.y, pos.z);
  }

  @Serialize
  get vel() {
    return Vector.from(this.body.velocity);
  }

  set vel(vel: Vector) {
    this.emitter.emit("velChange", vel);
    this.body.velocity.set(vel.x, vel.y, vel.z);
  }

  @Serialize
  get angVel() {
    return Vector.from(this.body.angularVelocity);
  }

  set angVel(vel: Vector) {
    this.emitter.emit("angVelChange", vel);
    this.body.angularVelocity.set(vel.x, vel.y, vel.z);
  }

  @Serialize
  get rot() {
    const euler = new CANNON.Vec3();
    this.body.quaternion.toEuler(euler);
    return Vector.from(euler);
  }

  set rot(rot: Vector) {
    this.emitter.emit("rotChange", rot);
    this.body.quaternion.setFromEuler(rot.x, rot.y, rot.z);
  }

  @Serialize
  get force() {
    return Vector.from(this.body.force);
  }

  set force(force: Vector) {
    this.emitter.emit("forceChange", force);
    this.body.force.set(force.x, force.y, force.z);
  }

  @Serialize
  get torque() {
    return Vector.from(this.body.torque);
  }

  set torque(torque: Vector) {
    this.emitter.emit("torqueChange", torque);
    this.body.torque.set(torque.x, torque.y, torque.z);
  }

  @Serialize
  get damping() {
    return this.body.linearDamping;
  }

  set damping(damping: number) {
    this.emitter.emit("dampingChange", damping);
    this.body.linearDamping = damping;
  }

  @Serialize
  get angularDamping() {
    return this.body.angularDamping;
  }

  set angularDamping(damping: number) {
    this.emitter.emit("angularDampingChange", damping);
    this.body.angularDamping = damping;
  }

  @Serialize
  get factor() {
    return Vector.from(this.body.linearFactor);
  }

  set factor(factor: Vector) {
    this.emitter.emit("factorChange", factor);
    this.body.linearFactor.set(factor.x, factor.y, factor.z);
  }

  @Serialize
  get angularFactor() {
    return Vector.from(this.body.angularFactor);
  }

  set angularFactor(factor: Vector) {
    this.emitter.emit("angularFactorChange", factor);
    this.body.angularFactor.set(factor.x, factor.y, factor.z);
  }

  @Serialize
  get mass() {
    return this.body.mass;
  }

  set mass(mass: number) {
    this.emitter.emit("massChange", mass);
    this.body.mass = mass;
  }

  get material(): CANNON.Material | null {
    return this.body.material;
  }

  set material(material: CANNON.Material) {
    this.emitter.emit("materialChange", material);
    this.body.material = material;
  }

  get shapes() {
    return this.body.shapes;
  }

  push(force: Vector, pos: Vector | null = null, local: boolean = false) {
    this.body.applyForce(
      Vector.toCannon(force),
      Vector.toCannon(pos?.add(local ? this.pos : Vector.null()) ?? this.pos),
    );
  }

  pushInstant(
    force: Vector,
    pos: Vector | null = null,
    local: boolean = false,
  ) {
    this.body.applyImpulse(
      Vector.toCannon(force),
      Vector.toCannon(pos?.add(local ? this.pos : Vector.null()) ?? this.pos),
    );
  }

  pushRotate(torque: Vector) {
    this.body.applyTorque(Vector.toCannon(torque));
  }

  sleep() {
    this.body.sleep();
  }

  wake() {
    this.body.wakeUp();
  }

  addShape(shape: CANNON.Shape) {
    this.body.addShape(shape);
    this.emitter.emit("addShape", shape);
  }

  removeShape(shape: CANNON.Shape) {
    this.body.removeShape(shape);
    this.emitter.emit("removeShape", shape);
  }
}
