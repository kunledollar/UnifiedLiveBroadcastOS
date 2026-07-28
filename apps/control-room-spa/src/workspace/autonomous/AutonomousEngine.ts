export class AutonomousEngine {
  private state = {
    running: false,
    lastTick: 0
  };

  start() {
    this.state.running = true;
    this.state.lastTick = Date.now();
  }

  stop() {
    this.state.running = false;
  }

  tick() {
    if (!this.state.running) return;
    this.state.lastTick = Date.now();
  }

  getStatus() {
    return {
      running: this.state.running,
      lastTick: this.state.lastTick
    };
  }
}
