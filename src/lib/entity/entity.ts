import * as CANNON from "cannon-es";
import Vector from "../helpers/vector";
import { Id, Serializable, Serialize, TempId } from "./serializable";

@Serializable
export default class Entity {
  @Id
  id: string = globalThis.crypto.randomUUID();

  @TempId
  tempId: string | null = null;

  body: CANNON.Body = new CANNON.Body();

  @Serialize
  get pos() {
    return Vector.from(this.body.position);
  }

  set pos(pos: Vector) {
    this.body.position.set(pos.x, pos.y, pos.z);
  }

  @Serialize
  get vel() {
    return Vector.from(this.body.velocity);
  }

  set vel(vel: Vector) {
    this.body.velocity.set(vel.x, vel.y, vel.z);
  }

  @Serialize
  get angVel() {
    return Vector.from(this.body.angularVelocity);
  }

  set angVel(vel: Vector) {
    this.body.angularVelocity.set(vel.x, vel.y, vel.z);
  }

  @Serialize
  get rot() {
    const euler = new CANNON.Vec3();
    this.body.quaternion.toEuler(euler);
    return Vector.from(euler);
  }

  set rot(rot: Vector) {
    this.body.quaternion.setFromEuler(rot.x, rot.y, rot.z);
  }

  @Serialize
  get force() {
    return Vector.from(this.body.force);
  }

  set force(force: Vector) {
    this.body.force.set(force.x, force.y, force.z);
  }

  @Serialize
  get torque() {
    return Vector.from(this.body.torque);
  }

  set torque(torque: Vector) {
    this.body.torque.set(torque.x, torque.y, torque.z);
  }

  @Serialize
  get damping() {
    return this.body.linearDamping;
  }

  set damping(damping: number) {
    this.body.linearDamping = damping;
  }

  @Serialize
  get angularDamping() {
    return this.body.angularDamping;
  }

  set angularDamping(damping: number) {
    this.body.angularDamping = damping;
  }

  @Serialize
  get factor() {
    return Vector.from(this.body.linearFactor);
  }

  set factor(factor: Vector) {
    this.body.linearFactor.set(factor.x, factor.y, factor.z);
  }

  @Serialize
  get angularFactor() {
    return Vector.from(this.body.angularFactor);
  }

  set angularFactor(factor: Vector) {
    this.body.angularFactor.set(factor.x, factor.y, factor.z);
  }

  @Serialize
  get mass() {
    return this.body.mass;
  }

  set mass(mass: number) {
    this.body.mass = mass;
  }

  get material(): CANNON.Material | null {
    return this.body.material;
  }

  set material(material: CANNON.Material) {
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
  }

  removeShape(shape: CANNON.Shape) {
    this.body.removeShape(shape);
  }
}
