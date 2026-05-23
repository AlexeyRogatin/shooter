export default class Timer {
  static now = (): number => performance.now();

  private _duration: number | null = null;
  private _remaining: number | null = null;
  private _state: "idle" | "running" | "paused" | "finished" = "idle";
  private _startTime: number | null = null;
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;

  private _deferred: {
    promise: Promise<void>;
    resolve: () => void;
    reject: (reason?: any) => void;
  } | null = null;

  constructor(initialTimeMs?: number) {
    if (initialTimeMs !== undefined) {
      this.setTime(initialTimeMs);
    }
    this._createDeferred();
  }

  private _createDeferred(): void {
    if (this._deferred) {
      this._deferred.reject(new Error("Timer cycle reset"));
    }

    let resolve!: () => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    this._deferred = { promise, resolve, reject };
  }

  private _finish(): void {
    if (this._state === "finished") return;

    this._clearTimeout();
    this._remaining = 0;
    this._state = "finished";

    if (this._deferred) {
      this._deferred.resolve();
    }
  }

  private _clearTimeout(): void {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  private _scheduleFinish(delayMs: number): void {
    this._clearTimeout();
    this._timeoutId = setTimeout(() => {
      if (this._state === "running" && this._startTime !== null) {
        const elapsed = Timer.now() - this._startTime;
        this._remaining = Math.max(0, (this._remaining ?? 0) - elapsed);
        if (this._remaining <= 0) {
          this._finish();
        } else {
          this._scheduleFinish(this._remaining);
        }
      } else {
        if (this._state === "running") this._finish();
      }
    }, delayMs);
  }

  setTime(ms: number): this {
    if (ms < 0) throw new Error("Timer duration cannot be negative");
    this.stop();
    this._duration = ms;
    this._remaining = ms;
    this._state = "idle";
    this._createDeferred();
    return this;
  }

  start(): this {
    if (this._duration === null && this._remaining === null) {
      throw new Error("No time set. Call setTime() first.");
    }
    if (this._state === "running") return this;

    let timeToRun = this._remaining !== null ? this._remaining : this._duration;
    if (timeToRun === null) {
      throw new Error("No time available to run");
    }

    if (timeToRun <= 0) {
      this._finish();
      return this;
    }

    this._startTime = Timer.now();
    this._state = "running";
    this._scheduleFinish(timeToRun);
    return this;
  }

  stop(): this {
    if (this._state !== "running") return this;

    const elapsed = Timer.now() - (this._startTime ?? Timer.now());
    this._remaining = Math.max(0, (this._remaining ?? 0) - elapsed);
    this._state = "paused";
    this._clearTimeout();
    return this;
  }

  reset(): this {
    this.stop();
    this._duration = null;
    this._remaining = null;
    this._state = "idle";
    this._createDeferred();
    return this;
  }

  isFinished(): boolean {
    return this._state === "finished";
  }

  get finished(): Promise<void> {
    return this._deferred
      ? this._deferred.promise
      : Promise.reject(new Error("Timer not initialized"));
  }

  get state(): "idle" | "running" | "paused" | "finished" {
    return this._state;
  }

  get remaining(): number | null {
    if (
      this._state === "running" &&
      this._startTime !== null &&
      this._remaining !== null
    ) {
      const elapsed = Timer.now() - this._startTime;
      return Math.max(0, this._remaining - elapsed);
    }
    return this._remaining;
  }
}
