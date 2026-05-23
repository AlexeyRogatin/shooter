import { OptionsManager } from "./options";

export function timedLoop(
  loop: (delta: number) => void,
  optionsManager: OptionsManager,
) {
  let lastTime = performance.now();

  function wrapped() {
    const timestamp = performance.now();
    const delta = timestamp - lastTime;
    const targetFrameTime = 1000 / optionsManager.options.fps;

    if (delta >= targetFrameTime) {
      const physicsDelta = Math.min(delta / 1000, 0.1);

      lastTime = timestamp - (delta % targetFrameTime);

      loop(physicsDelta);
    }

    requestAnimationFrame(wrapped);
  }

  return wrapped;
}
