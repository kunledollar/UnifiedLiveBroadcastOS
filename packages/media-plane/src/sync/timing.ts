import type { MediaFramePlan, MediaIntent } from '../orchestration.js';
import type { BroadcastClockState, MediaClock } from './clock.js';
import type { FrameTickEvent, SyncDriftMetrics } from './index.js';

export type FrameLifecycleState =
  | 'CLOCK_TICK_CREATED'
  | 'PENDING_INTENTS_COLLECTED'
  | 'FRAME_PLAN_CREATED'
  | 'FRAME_PLAN_VALIDATED'
  | 'FRAME_PLAN_EXECUTED'
  | 'SUBSYSTEM_RESULTS_COLLECTED'
  | 'FRAME_DIAGNOSTICS_RECORDED'
  | 'FRAME_COMPLETE'
  | 'FRAME_SKIPPED'
  | 'FRAME_DROPPED'
  | 'FRAME_DEGRADED'
  | 'FRAME_RETRIED'
  | 'FRAME_ABORTED';

export type DriftSeverity = 'ok' | 'warning' | 'degraded' | 'critical';
export interface DriftThresholds { readonly warningMs: number; readonly degradedMs: number; readonly criticalMs: number; }
export const DEFAULT_DRIFT_THRESHOLDS: DriftThresholds = { warningMs: 20, degradedMs: 50, criticalMs: 100 };

export interface IntentFrameAssignment<TIntent = MediaIntent> {
  readonly intent: TIntent;
  readonly scheduledFrameId: number;
  readonly scheduledFrameTimestamp: number;
  readonly originalTimestamp: string;
  readonly late: boolean;
}

export function getNextExecutableFrame(clockState: BroadcastClockState): number {
  return clockState.currentFrame + 1;
}

export function isIntentLateForFrame(
  intent: Pick<MediaIntent, 'submittedAt'>,
  frameTick: Pick<FrameTickEvent, 'broadcastTime' | 'expectedNextFrameTime'>,
  cutoffMs: number,
): boolean {
  const submittedAt = Date.parse(intent.submittedAt);
  if (!Number.isFinite(submittedAt)) return false;
  const frameWindowMs = frameTick.expectedNextFrameTime - frameTick.broadcastTime;
  const frameCutoff = frameTick.expectedNextFrameTime - Math.max(0, cutoffMs);
  return submittedAt > frameCutoff || frameWindowMs < cutoffMs;
}

export function assignIntentToFrame<TIntent extends MediaIntent>(
  intent: TIntent,
  clockState: BroadcastClockState,
  options: { readonly cutoffMs?: number; readonly nowMs?: number } = {},
): IntentFrameAssignment<TIntent> {
  const cutoffMs = options.cutoffMs ?? Math.min(8, clockState.frameIntervalMs / 2);
  const nowMs = options.nowMs ?? clockState.elapsedTime;
  const currentFrameEndsAt = (clockState.currentFrame + 1) * clockState.frameIntervalMs;
  const late = nowMs > currentFrameEndsAt - cutoffMs;
  const scheduledFrameId = late ? getNextExecutableFrame(clockState) : clockState.currentFrame;
  return {
    intent,
    scheduledFrameId,
    scheduledFrameTimestamp: Math.round(scheduledFrameId * clockState.frameIntervalMs),
    originalTimestamp: intent.submittedAt,
    late,
  };
}

export function classifyDrift(driftMs: number, thresholds: DriftThresholds = DEFAULT_DRIFT_THRESHOLDS): DriftSeverity {
  const value = Math.abs(driftMs);
  if (value >= thresholds.criticalMs) return 'critical';
  if (value >= thresholds.degradedMs) return 'degraded';
  if (value >= thresholds.warningMs) return 'warning';
  return 'ok';
}

export function summarizeFrameDrift(metrics: SyncDriftMetrics, thresholds: DriftThresholds = DEFAULT_DRIFT_THRESHOLDS) {
  const entries = Object.entries(metrics).map(([metric, value]) => ({ metric, value, severity: classifyDrift(value, thresholds) }));
  const rank: Record<DriftSeverity, number> = { ok: 0, warning: 1, degraded: 2, critical: 3 };
  const worst = entries.reduce((acc, entry) => (rank[entry.severity] > rank[acc.severity] ? entry : acc), entries[0] ?? { metric: 'none', value: 0, severity: 'ok' as const });
  return { entries, worst, healthy: worst.severity === 'ok' };
}

export function createDriftWarning(metric: string, value: number, thresholds: DriftThresholds = DEFAULT_DRIFT_THRESHOLDS): string | undefined {
  const severity = classifyDrift(value, thresholds);
  return severity === 'ok' ? undefined : `${severity.toUpperCase()} drift: ${metric}=${value}ms`;
}

export function assertMonotonicFrameId(previousFrameId: number | undefined, nextFrameId: number): void {
  if (previousFrameId !== undefined && nextFrameId <= previousFrameId) throw new Error('frameId must be monotonic');
}

export function assertFrameTimestampFromClock(clock: MediaClock, frameId: number, frameTimestamp: number): void {
  if (clock.getFrameTimestamp(frameId) !== frameTimestamp) throw new Error('frameTimestamp must derive from MediaClock');
}

export function assertFramePlanHasFrameIdentity(plan: Pick<MediaFramePlan, 'id' | 'frameId' | 'frameTimestamp' | 'graphRevision'>): void {
  if (!plan.id) throw new Error('MediaFramePlan must expose id');
  if (typeof plan.frameId !== 'number') throw new Error('MediaFramePlan must expose numeric frameId');
  if (typeof plan.frameTimestamp !== 'number') throw new Error('MediaFramePlan must expose numeric frameTimestamp');
  if (typeof plan.graphRevision !== 'number') throw new Error('MediaFramePlan must expose numeric graphRevision');
}

export function assertExecutionResultHasFrameIdentity(result: { readonly frameId?: unknown; readonly payload?: { readonly frameId?: unknown } }): void {
  if (typeof result.frameId !== 'number' && typeof result.payload?.frameId !== 'number') throw new Error('Execution result must be traceable to frameId');
}

export function assertNoIndependentSubsystemClock(metadata: Record<string, unknown> = {}): void {
  const forbidden = ['clock', 'broadcastClock', 'rendererClock', 'outputClock', 'routeClock'];
  const found = forbidden.find((key) => key in metadata);
  if (found) throw new Error(`Independent subsystem clock metadata is not allowed: ${found}`);
}
