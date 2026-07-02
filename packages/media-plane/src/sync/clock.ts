export type BroadcastClockStatus = 'running' | 'paused' | 'stopped';
export interface BroadcastClockState { readonly startTime: number; readonly pausedTime: number; readonly elapsedTime: number; readonly frameRate: number; readonly frameIntervalMs: number; readonly currentFrame: number; readonly driftMs: number; readonly status: BroadcastClockStatus; }
export interface MediaClockConfig { readonly frameRate?: number; readonly now?: () => number; }
export interface MediaClock { getCurrentBroadcastTime(): number; getCurrentFrame(): number; getFrameTimestamp(frameId: number): number; getState(): BroadcastClockState; startClock(): BroadcastClockState; stopClock(): BroadcastClockState; pauseClock(): BroadcastClockState; resumeClock(): BroadcastClockState; }
const normalizeFrameRate = (fps = 30) => Math.max(1, Math.min(120, Math.round(fps)));
export function createClock(config: MediaClockConfig = {}): MediaClock {
  const now = config.now ?? (() => Date.now());
  let frameRate = normalizeFrameRate(config.frameRate ?? 30); let frameIntervalMs = 1000 / frameRate;
  let startTime = 0; let pausedAt = 0; let pausedTime = 0; let elapsedAtPause = 0; let status: BroadcastClockStatus = 'stopped';
  const elapsed = () => status === 'stopped' ? 0 : status === 'paused' ? elapsedAtPause : Math.max(0, now() - startTime - pausedTime);
  const state = (): BroadcastClockState => { const e = elapsed(); const currentFrame = Math.floor(e / frameIntervalMs); return { startTime, pausedTime, elapsedTime: e, frameRate, frameIntervalMs, currentFrame, driftMs: e - currentFrame * frameIntervalMs, status }; };
  return { getCurrentBroadcastTime: elapsed, getCurrentFrame: () => state().currentFrame, getFrameTimestamp: (frameId) => Math.max(0, Math.round(frameId * frameIntervalMs)), getState: state, startClock: () => { startTime = now(); pausedAt = 0; pausedTime = 0; elapsedAtPause = 0; status = 'running'; return state(); }, stopClock: () => { startTime = 0; pausedAt = 0; pausedTime = 0; elapsedAtPause = 0; status = 'stopped'; return state(); }, pauseClock: () => { if (status === 'running') { elapsedAtPause = elapsed(); pausedAt = now(); status = 'paused'; } return state(); }, resumeClock: () => { if (status === 'paused') { pausedTime += Math.max(0, now() - pausedAt); pausedAt = 0; status = 'running'; } return state(); } };
}
