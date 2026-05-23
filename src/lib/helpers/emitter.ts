export default class Emitter {
  events: Map<string, Set<Function>> = new Map();
  on(event: string, fn: Function) {
    if (!this.events.has(event)) this.events.set(event, new Set());
    this.events.get(event)?.add(fn);
  }

  emit(event: string, ...args: any[]) {
    this.events.get(event)?.forEach((fn) => fn(...args));
  }

  off(event: string, fn: Function) {
    this.events.get(event)?.delete(fn);
  }

  clear() {
    this.events.clear();
  }
}
