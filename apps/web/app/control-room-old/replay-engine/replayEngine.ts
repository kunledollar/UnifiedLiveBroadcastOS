/**
 * UBOS Replay Engine — Step 64
 *
 * Manages replay buffers, clip creation, markers, timeline scrubbing,
 * and slow-motion playback for the Replay Operator workspace.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - multi-camera sync
 *   - GPU-accelerated replay
 *   - timeline keyframes
 *   - clip tagging and metadata
 *   - highlight detection
 *   - AI Crew replay analysis hooks
 *   - automation replay triggers
 */

export type ReplayFrame = {
  timestamp: number;
  data?: unknown;
};

export type ReplayMarker = {
  id: number;
  cameraId: string;
  time: number;
  label?: string;
};

export type ReplayClip = {
  id: number;
  cameraId: string;
  start: number;
  end: number;
  frames: ReplayFrame[];
  createdAt: number;
};

export class ReplayEngine {
  private buffers: Record<string, ReplayFrame[]> = {};
  private clips: ReplayClip[] = [];
  private markers: ReplayMarker[] = [];

  // ── Buffer management ─────────────────────────────────────────────────────

  addFrame(cameraId: string, frame: ReplayFrame): void {
    if (!this.buffers[cameraId]) {
      this.buffers[cameraId] = [];
    }
    this.buffers[cameraId]!.push(frame);
  }

  getBuffer(cameraId: string): ReplayFrame[] {
    return this.buffers[cameraId] ?? [];
  }

  // ── Markers ───────────────────────────────────────────────────────────────

  addMarker(cameraId: string, time: number, label?: string): ReplayMarker {
    const marker: ReplayMarker = {
      id: Date.now(),
      cameraId,
      time,
      ...(label !== undefined ? { label } : {}),
    };
    this.markers.push(marker);
    return marker;
  }

  getMarkers(): readonly ReplayMarker[] {
    return this.markers;
  }

  removeMarker(id: number): void {
    this.markers = this.markers.filter((m) => m.id !== id);
  }

  // ── Clips ─────────────────────────────────────────────────────────────────

  createClip(cameraId: string, start: number, end: number): ReplayClip {
    const frames = this.buffers[cameraId] ?? [];
    const clipFrames = frames.slice(start, end);

    const clip: ReplayClip = {
      id: Date.now(),
      cameraId,
      start,
      end,
      frames: clipFrames,
      createdAt: Date.now(),
    };

    this.clips.push(clip);
    return clip;
  }

  getClips(): readonly ReplayClip[] {
    return this.clips;
  }

  deleteClip(id: number): void {
    this.clips = this.clips.filter((c) => c.id !== id);
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  scrub(cameraId: string, position: number): ReplayFrame | null {
    const frames = this.buffers[cameraId] ?? [];
    return frames[position] ?? null;
  }

  /**
   * Return a slow-motion segment by duplicating frames.
   * factor = 0.5 → 2× slower (each frame duplicated once).
   */
  slowMotion(
    cameraId: string,
    start: number,
    end: number,
    factor = 0.5,
  ): ReplayFrame[] {
    const frames = this.buffers[cameraId] ?? [];
    const segment = frames.slice(start, end);
    const repeats = Math.max(1, Math.round(1 / factor));
    return segment.flatMap((frame) => Array<ReplayFrame>(repeats).fill(frame));
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get clipCount():   number { return this.clips.length; }
  get markerCount(): number { return this.markers.length; }
  get cameraIds():   string[] { return Object.keys(this.buffers); }
}
