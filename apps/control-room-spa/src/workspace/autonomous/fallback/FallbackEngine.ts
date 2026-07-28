import type { EventSink, TimelineSink } from '../types';

type FallbackDependencies = {
  routing: { safeRoute: () => void };
  graphics: { safeGraphics: () => void };
  audio: { safeAudio: () => void };
  streaming: { safeStreaming: () => void };
  logger: EventSink;
  timeline: TimelineSink;
};

export class FallbackEngine {
  constructor(private readonly deps: FallbackDependencies) {}

  trigger(): void {
    const { routing, graphics, audio, streaming, logger, timeline } = this.deps;

    routing.safeRoute();
    logger.log('fallback_routing');
    timeline.add('fallback_routing');

    graphics.safeGraphics();
    logger.log('fallback_graphics');
    timeline.add('fallback_graphics');

    audio.safeAudio();
    logger.log('fallback_audio');
    timeline.add('fallback_audio');

    streaming.safeStreaming();
    logger.log('fallback_streaming');
    timeline.add('fallback_streaming');
  }
}
