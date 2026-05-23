import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import Scene from "./scene";
import Camera from "./camera";

export type ThreeRendererType = THREE.WebGLRenderer | WebGPURenderer;

export class Renderer {
  static renderers = new Map<string, Renderer>();
  static defaultName = "default";

  public readonly renderer: ThreeRendererType;
  public readonly canvas: HTMLCanvasElement;
  public readonly name: string;

  private constructor(
    name: string,
    renderer: ThreeRendererType,
    canvas: HTMLCanvasElement,
  ) {
    this.name = name;
    this.renderer = renderer;
    this.canvas = canvas;
  }

  static async create(
    name: string = Renderer.defaultName,
    type: "webgpu" | "webgl" = "webgpu",
    parameters?: any,
  ): Promise<Renderer> {
    if (Renderer.renderers.has(name)) {
      throw new Error(`Renderer with name "${name}" already exists.`);
    }

    const canvas = document.createElement("canvas");
    if (name === Renderer.defaultName) {
      document.body.appendChild(canvas);
    }
    let renderer: ThreeRendererType;

    if (type === "webgpu") {
      const webgpuRenderer = new WebGPURenderer({
        ...parameters,
        canvas,
      });
      await webgpuRenderer.init();
      renderer = webgpuRenderer;
    } else {
      renderer = new THREE.WebGLRenderer({
        ...parameters,
        canvas,
      });
    }

    const instance = new Renderer(name, renderer, canvas);
    Renderer.renderers.set(name, instance);
    return instance;
  }

  setSize(width: number, height: number, updateStyle?: boolean): void {
    this.renderer.setSize(width, height, updateStyle);
  }

  render(scene: Scene, camera: Camera): void {
    this.renderer.render(scene.scene, camera.camera);
  }

  static remove(name: string = Renderer.defaultName): boolean {
    if (name === Renderer.defaultName) {
      const renderer = Renderer.get(name);
      if (renderer) {
        document.body.removeChild(renderer.canvas);
      }
    }
    return Renderer.renderers.delete(name);
  }

  static get(name: string = Renderer.defaultName): Renderer | undefined {
    return Renderer.renderers.get(name);
  }
}

await Renderer.create();

export default Renderer;
