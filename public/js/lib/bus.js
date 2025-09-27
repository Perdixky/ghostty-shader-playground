export class Bus {
  listeners = [];
  emit(data) {
    this.listeners.forEach((fn) => fn(data));
  }
  subscribe(fn) {
    this.listeners.push(fn);
  }
}
