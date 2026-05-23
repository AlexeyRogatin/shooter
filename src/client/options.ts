export enum FpsOptions {
  OPTION_60 = 60,
  OPTION_120 = 120,
  OPTION_UNLIMITED = 99999999,
}

export enum PhysicsSteps {
  LOW = 1,
  MEDIUM = 3,
  HIGH = 5,
  ULTRA = 10,
}

export type Options = {
  fps: FpsOptions;
  physicsSteps: PhysicsSteps;
};

export class OptionsManager {
  public readonly defaultOptions: Options = {
    fps: FpsOptions.OPTION_60,
    physicsSteps: PhysicsSteps.MEDIUM,
  };

  public options: Options = this.defaultOptions;

  loadOptions() {
    const options = localStorage.getItem("options");
    if (options) this.options = JSON.parse(options);
  }

  saveOptions() {
    localStorage.setItem("options", JSON.stringify(this.options));
  }
}
