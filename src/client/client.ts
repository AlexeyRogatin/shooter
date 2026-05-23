import "../lib/configs/gameConfig";
import State from "../lib/entities/state";
import Camera from "../lib/entityDecorators/camera";
import Renderer from "../lib/entityDecorators/renderer";
import Scene from "../lib/entityDecorators/scene";
import World from "../lib/entityDecorators/world";
import { ClientHandler } from "../lib/eventHandling/clientHandler";
import { OptionsManager } from "./options";
import { timedLoop } from "./timedLoop";

const optionsManager = new OptionsManager();
optionsManager.loadOptions();

const state = new State();

const handler = new ClientHandler(state);
await handler.initialize();

const renderer = Renderer.get();
if (renderer) {
  document.body.appendChild(renderer.canvas);
}

function loop(delta: number) {
  World.getActiveWorlds().forEach((w) =>
    w.world.step(
      1 / optionsManager.options.fps,
      delta,
      optionsManager.options.physicsSteps,
    ),
  );

  const renderer = Renderer.get();
  const scene = Scene.get();
  const camera = Camera.get();
  if (scene && camera) {
    renderer?.render(scene, camera);
  }
}

handler.emit("ClientInitialized");
requestAnimationFrame(timedLoop(loop, optionsManager));
