// @ts-nocheck
import type { FrameTick, ProcessorRuntimeContext, TickProcessor } from './execution-engine.js';

const freeze = <T>(value: T): Readonly<T> => Object.freeze(structuredClone(value));
export const AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS = freeze({
  programAudioRoute: 'audio-follow-video.program-route',
  previewAudioRoute: 'audio-follow-video.preview-route',
  transitionAudio: 'audio-follow-video.transition-audio',
  health: 'audio-follow-video.health',
  telemetry: 'audio-follow-video.telemetry',
});
export interface AudioFollowVideoRouteSnapshot {
  readonly routeId: string;
  readonly routeGeneration: number;
  readonly runtimeFrameNumber: string;
  readonly sceneId: string;
  readonly ready: boolean;
  readonly silence: boolean;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface AudioFollowVideoSnapshot {
  readonly runtimeFrameNumber: string;
  readonly generation: number;
  readonly programRoute: AudioFollowVideoRouteSnapshot;
  readonly previewRoute: AudioFollowVideoRouteSnapshot;
  readonly transitionAudio?: Readonly<Record<string, unknown>>;
}
export class AudioFollowVideoProcessor implements TickProcessor {
  readonly id = 'audio-follow-video-processor';
  readonly order = 550;
  private generation = 0;
  initialize() {}
  shutdown() {
    return { status: 'STOPPED' as const };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    this.generation += 1;
    const frame = tick.frameNumber.toString();
    const snap: AudioFollowVideoSnapshot = freeze({
      runtimeFrameNumber: frame,
      generation: this.generation,
      programRoute: {
        routeId: 'program-audio',
        routeGeneration: this.generation,
        runtimeFrameNumber: frame,
        sceneId: 'program',
        ready: true,
        silence: false,
        safeMetadata: {},
      },
      previewRoute: {
        routeId: 'preview-audio',
        routeGeneration: this.generation,
        runtimeFrameNumber: frame,
        sceneId: 'preview',
        ready: true,
        silence: false,
        safeMetadata: {},
      },
      transitionAudio: { runtimeFrameNumber: frame, generation: this.generation },
    });
    context.outputs.publish(
      this.id,
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.programAudioRoute,
      snap.programRoute,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.previewAudioRoute,
      snap.previewRoute,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.transitionAudio,
      snap.transitionAudio,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.health,
      { state: 'HEALTHY', generation: this.generation, runtimeFrameNumber: frame },
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.telemetry,
      { processedTicks: this.generation },
      'OWNED_BY_PROCESSOR',
    );
  }
}
