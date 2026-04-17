import * as THREE from "three";
import CANNON from "cannon-es";

export default class Vector {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static add(...vectors: Vector[]) {
    return vectors.reduce(
      (a, b) => new Vector(a.x + b.x, a.y + b.y, a.z + b.z),
      new Vector(0, 0, 0),
    );
  }

  static sub(a: Vector, b: Vector) {
    return new Vector(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  static dot(a: Vector, b: Vector) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  static cross(a: Vector, b: Vector) {
    return new Vector(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x,
    );
  }

  static mul(a: Vector, b: number) {
    return new Vector(a.x * b, a.y * b, a.z * b);
  }

  static div(a: Vector, b: number) {
    return new Vector(a.x / b, a.y / b, a.z / b);
  }

  static len(a: Vector) {
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
  }

  static unit(a: Vector) {
    const len = Vector.len(a);
    return new Vector(a.x / len, a.y / len, a.z / len);
  }

  static rot(a: Vector) {
    const yaw = Math.atan2(a.x, a.z);
    const pitch = Math.atan2(a.y, Math.sqrt(a.x * a.x + a.z * a.z));
    return new Vector(yaw, pitch);
  }

  static angles(a: Vector) {
    const yaw = Math.atan2(a.x, a.z);
    const pitch = Math.atan2(a.y, Math.sqrt(a.x * a.x + a.z * a.z));
    return { yaw, pitch };
  }

  static angle(a: Vector, b: Vector) {
    return Math.acos(Vector.dot(a, b) / (Vector.len(a) * Vector.len(b)));
  }

  static yaw(a: Vector) {
    return Math.atan2(a.x, a.z);
  }

  static pitch(a: Vector) {
    return Math.atan2(a.y, Math.sqrt(a.x * a.x + a.z * a.z));
  }

  static rotate(vector: Vector, yaw: number, pitch: number) {
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const x = vector.x * cosYaw - vector.z * sinYaw;
    const z = vector.x * sinYaw + vector.z * cosYaw;
    return new Vector(x, vector.y * cosPitch - vector.z * sinPitch, z);
  }

  static toTree(vector: Vector) {
    return new THREE.Vector3(vector.x, vector.y, vector.z);
  }

  static toCannon(vector: Vector) {
    return new CANNON.Vec3(vector.x, vector.y, vector.z);
  }

  static from(vector: { x: number; y: number; z: number }) {
    return new Vector(vector.x, vector.y, vector.z);
  }

  static null() {
    return new Vector(0, 0, 0);
  }

  static one() {
    return new Vector(1, 1, 1);
  }

  add(other: Vector) {
    return Vector.add(this, other);
  }

  sub(other: Vector) {
    return Vector.sub(this, other);
  }

  dot(other: Vector) {
    return Vector.dot(this, other);
  }

  cross(other: Vector) {
    return Vector.cross(this, other);
  }

  mul(a: number) {
    return Vector.mul(this, a);
  }

  div(a: number) {
    return Vector.div(this, a);
  }

  length() {
    return Vector.len(this);
  }

  unit() {
    return Vector.unit(this);
  }

  rot() {
    return Vector.rot(this);
  }

  angles() {
    return Vector.angles(this);
  }

  angle(other: Vector) {
    return Vector.angle(this, other);
  }

  yaw() {
    return Vector.yaw(this);
  }

  pitch() {
    return Vector.pitch(this);
  }

  rotate(yaw: number, pitch: number) {
    return Vector.rotate(this, yaw, pitch);
  }

  toTree() {
    return Vector.toTree(this);
  }

  toCannon() {
    return Vector.toCannon(this);
  }

  clone() {
    return new Vector(this.x, this.y, this.z);
  }

  equals(other: Vector) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}
