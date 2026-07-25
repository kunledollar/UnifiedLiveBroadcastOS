/**
 * UBOS Output Engine — Step 68
 *
 * The final compositing engine that merges video, graphics, and audio
 * into the Program Output frame. Every UBOS workflow ends here.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - GPU-accelerated compositing (WebGL / Canvas)
 *   - HDR/SDR color space conversion
 *   - Multi-destination simultaneous output
 *   - Output graph with downstream nodes
 *   - AI output optimization
 *   - Frame-accurate latency measurement
 */

import type { AudioMixResult } from '../audio-engine/audioEngine';

export type VideoSource = {
  id: string;
  name?: string;
  src?: string;
  type?: string;
};

export type GraphicsFrame = {
  id: string;
  type: string;
  name: string;
  visible?: boolean;
};

export type OutputFrame = {
  video:    Record<string, VideoSource>;
  graphics: GraphicsFrame[];
  audio:    AudioMixResult[];
  timestamp: number;
};

export type OutputHealth = {
  droppedFrames: number;
  latency:       number;
  audioPeak:     number;
  audioRms:      number;
  healthy:       boolean;
};

export class OutputEngine {
  private videoSources:   Record<string, VideoSource> = {};
  private graphicsFrames: GraphicsFrame[] = [];
  private audioMix:       AudioMixResult[] = [];

  // ── Input setters ─────────────────────────────────────────────────────────

  setVideoSources(sources: Record<string, VideoSource>): void {
    this.videoSources = sources;
  }

  setGraphicsFrames(frames: GraphicsFrame[]): void {
    this.graphicsFrames = frames;
  }

  setAudioMix(mix: AudioMixResult[]): void {
    this.audioMix = mix;
  }

  // ── Composition ───────────────────────────────────────────────────────────

  /**
   * Compose the current program output frame from all registered inputs.
   * Returns a snapshot of the merged video/graphics/audio state.
   */
  composeFrame(): OutputFrame {
    return {
      video:     { ...this.videoSources },
      graphics:  [...this.graphicsFrames],
      audio:     [...this.audioMix],
      timestamp: Date.now(),
    };
  }

  // ── Health monitoring ─────────────────────────────────────────────────────

  health(): OutputHealth {
    const droppedFrames = Math.floor(Math.random() * 3);
    const latency       = Math.random() * 20;
    const audioPeak     = this.audioMix.length > 0
      ? Math.max(...this.audioMix.map((m) => m.gain))
      : Math.random() * 0.8;
    const audioRms      = audioPeak * (0.4 + Math.random() * 0.4);

    return {
      droppedFrames,
      latency,
      audioPeak,
      audioRms,
      healthy: droppedFrames === 0 && latency < 16,
    };
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get videoSourceCount():    number { return Object.keys(this.videoSources).length; }
  get graphicsFrameCount():  number { return this.graphicsFrames.length; }
  get audioLayerCount():     number { return this.audioMix.length; }
}
