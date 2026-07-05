export type BroadcastClockStatus = 'running' | 'paused' | 'stopped';
export type SupportedFrameRate = 23.976 | 24 | 25 | 29.97 | 30 | 50 | 59.94 | 60;

export const SUPPORTED_FRAME_RATES: readonly SupportedFrameRate[] = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60] as const;

export interface BroadcastClockState {
  readonly startTime: number;
  readonly pausedTime: number;
  readonly elapsedTime: number;
  readonly frameRate: SupportedFrameRate;
  readonly frameIntervalMs: number;
  readonly currentFrame: number;
  readonly presentationTimestamp: number;
  readonly mediaTimestamp: number;
  readonly driftMs: number;
  readonly status: BroadcastClockStatus;
  readonly lastUpdatedAt: number;
  readonly containsRuntimeHandles: false;
}

export interface MediaClockConfig {
  readonly frameRate?: number;
  readonly now?: () => number;
  readonly mediaTimeOffsetMs?: number;
}

export interface MediaClock {
  readonly id: string;
  getCurrentBroadcastTime(): number;
  getCurrentFrame(): number;
  getPresentationTimestamp(): number;
  getMediaTimestamp(): number;
  getFrameTimestamp(frameId: number): number;
  getState(): BroadcastClockState;
  startClock(): BroadcastClockState;
  pauseClock(): BroadcastClockState;
  resumeClock(): BroadcastClockState;
  stopClock(): BroadcastClockState;
  resetClock(): BroadcastClockState;
  start(): BroadcastClockState;
  pause(): BroadcastClockState;
  resume(): BroadcastClockState;
  stop(): BroadcastClockState;
  reset(): BroadcastClockState;
}

export const isSupportedFrameRate = (fps: number): fps is SupportedFrameRate =>
  SUPPORTED_FRAME_RATES.some((rate) => Math.abs(rate - fps) < 0.001);

export const normalizeFrameRate = (fps = 30): SupportedFrameRate => {
  const match = SUPPORTED_FRAME_RATES.find((rate) => Math.abs(rate - fps) < 0.01);
  if (!match) throw new Error(`Unsupported frame rate ${fps}. Supported rates: ${SUPPORTED_FRAME_RATES.join(', ')}`);
  return match;
};

const roundTimestamp = (value: number) => Math.round(value * 1000) / 1000;

export function createClock(config: MediaClockConfig = {}): MediaClock {
  const now = config.now ?? (() => Date.now());
  const frameRate = normalizeFrameRate(config.frameRate ?? 30);
  const frameIntervalMs = 1000 / frameRate;
  const mediaTimeOffsetMs = config.mediaTimeOffsetMs ?? 0;
  let startTime = 0;
  let pausedAt = 0;
  let pausedTime = 0;
  let elapsedAtPause = 0;
  let status: BroadcastClockStatus = 'stopped';

  const elapsed = () => status === 'stopped' ? 0 : status === 'paused' ? elapsedAtPause : Math.max(0, now() - startTime - pausedTime);
  const frameTimestamp = (frameId: number) => roundTimestamp(Math.max(0, frameId) * frameIntervalMs);
  const state = (): BroadcastClockState => {
    const elapsedTime = roundTimestamp(elapsed());
    const currentFrame = Math.max(0, Math.floor((elapsedTime + 0.01) / frameIntervalMs));
    const presentationTimestamp = frameTimestamp(currentFrame);
    return {
      startTime,
      pausedTime: roundTimestamp(pausedTime),
      elapsedTime,
      frameRate,
      frameIntervalMs: roundTimestamp(frameIntervalMs),
      currentFrame,
      presentationTimestamp,
      mediaTimestamp: roundTimestamp(presentationTimestamp + mediaTimeOffsetMs),
      driftMs: roundTimestamp(elapsedTime - presentationTimestamp),
      status,
      lastUpdatedAt: now(),
      containsRuntimeHandles: false,
    };
  };
  const resetAll = () => { startTime = 0; pausedAt = 0; pausedTime = 0; elapsedAtPause = 0; status = 'stopped'; return state(); };
  const api: MediaClock = {
    id: 'ubos-media-clock',
    getCurrentBroadcastTime: elapsed,
    getCurrentFrame: () => state().currentFrame,
    getPresentationTimestamp: () => state().presentationTimestamp,
    getMediaTimestamp: () => state().mediaTimestamp,
    getFrameTimestamp: frameTimestamp,
    getState: state,
    startClock: () => { startTime = now(); pausedAt = 0; pausedTime = 0; elapsedAtPause = 0; status = 'running'; return state(); },
    pauseClock: () => { if (status === 'running') { elapsedAtPause = elapsed(); pausedAt = now(); status = 'paused'; } return state(); },
    resumeClock: () => { if (status === 'paused') { pausedTime += Math.max(0, now() - pausedAt); pausedAt = 0; status = 'running'; } return state(); },
    stopClock: resetAll,
    resetClock: resetAll,
    start() { return this.startClock(); },
    pause() { return this.pauseClock(); },
    resume() { return this.resumeClock(); },
    stop() { return this.stopClock(); },
    reset() { return this.resetClock(); },
  };
  return api;
}
