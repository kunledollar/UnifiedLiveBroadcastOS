export class RecoveryEngine {
  constructor(deps) {
    this.deps = deps;
  }

  recover(system) {
    const {
      output,
      routing,
      graphics,
      audio,
      streaming,
      logger,
      timeline
    } = this.deps;

    if (system.outputHealth !== "healthy") {
      output.stabilize();
      logger.log("output_stabilize");
      timeline.add("output_stabilize");
    }

    if (system.routingHealth !== "stable") {
      routing.recover();
      logger.log("routing_recover");
      timeline.add("routing_recover");
    }

    if (system.graphicsLoad > 0.8) {
      graphics.reduceLoad();
      logger.log("graphics_reduce");
      timeline.add("graphics_reduce");
    }

    if (system.audioPeak > 0.9) {
      audio.reduceLoad();
      logger.log("audio_reduce");
      timeline.add("audio_reduce");
    }

    if (system.streamingHealth !== "stable") {
      streaming.stabilize();
      logger.log("streaming_stabilize");
      timeline.add("streaming_stabilize");
    }
  }
}
