import { AutonomousEngine } from "./AutonomousEngine";

export class AutonomousController {
  private engine = new AutonomousEngine();

  start() {
    this.engine.start();
  }

  stop() {
    this.engine.stop();
  }

  heartbeat() {
    this.engine.tick();
    return this.engine.getStatus();
  }
}
