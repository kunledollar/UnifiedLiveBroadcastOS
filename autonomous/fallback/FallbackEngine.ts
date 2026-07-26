export class FallbackEngine {
  constructor(deps) {
    this.deps = deps;
  }

  trigger() {
    const {
      routing,
      graphics,
      audio,
      streaming,
      logger,
      timeline
    } = this.deps;

    routing.safeRoute();
    logger.log("fallback_routing");
    timeline.add("fallback_routing");

    graphics.safeGraphics();
    logger.log("fallback_graphics");
    timeline.add("fallback_graphics");

    audio.safeAudio();
    logger.log("fallback_audio");
    timeline.add("fallback_audio");

    streaming.safeStreaming();
    logger.log("fallback_streaming");
    timeline.add("fallback_streaming");
  }
}
