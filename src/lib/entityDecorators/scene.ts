import * as THREE from "three";

export class Scene {
  private static defaultSceneName = "default";
  static scenes: Scene[] = [new Scene(Scene.defaultSceneName)];

  name: string;
  scene: THREE.Scene;

  constructor(name: string = Scene.defaultSceneName) {
    this.name = name;
    this.scene = new THREE.Scene();

    Scene.add(this);
  }

  addObject(obj: THREE.Object3D) {
    this.scene.add(obj);
  }

  removeObject(obj: THREE.Object3D) {
    this.scene.remove(obj);
  }

  static add(scene: Scene) {
    this.scenes.push(scene);
  }

  static remove(name: string = Scene.defaultSceneName) {
    this.scenes = this.scenes.filter((w) => w.name !== name);
  }

  static get(name: string = Scene.defaultSceneName): Scene | undefined {
    return this.scenes.find((w) => w.name === name);
  }
}

new Scene();

export default Scene;
