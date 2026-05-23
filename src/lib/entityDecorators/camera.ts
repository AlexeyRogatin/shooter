import * as THREE from "three";
import Vector from "../helpers/vector";

export class Camera {
  private static defaultCameraName = "default";
  static cameras: Camera[] = [new Camera(Camera.defaultCameraName)];

  name: string;
  camera: THREE.PerspectiveCamera;

  get pos() {
    return Vector.from(this.camera.position);
  }

  set pos(pos: Vector) {
    this.camera.position.set(pos.x, pos.y, pos.z);
  }

  get rot() {
    return Vector.from(this.camera.rotation);
  }

  set rot(rot: Vector) {
    this.camera.rotation.set(rot.x, rot.y, rot.z);
  }

  constructor(name: string = Camera.defaultCameraName) {
    this.name = name;
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    Camera.add(this);
  }

  static add(camera: Camera) {
    this.cameras.push(camera);
  }

  static remove(name: string = Camera.defaultCameraName) {
    this.cameras = this.cameras.filter((w) => w.name !== name);
  }

  static get(name: string = Camera.defaultCameraName): Camera | undefined {
    return this.cameras.find((w) => w.name === name);
  }
}

new Camera();

export default Camera;
