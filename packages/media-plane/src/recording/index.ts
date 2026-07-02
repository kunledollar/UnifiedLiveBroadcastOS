import type { ProductionGraph } from '../../../shared/src/production-graph.js';
import { createFailureRecord, type UBOSFailure } from '../../../shared/src/failure-recovery.js';
import { detectNonReplayablePayload } from '../../../shared/src/replay.js';
import type { AudioRoutePlan } from '../audio-routing/index.js';
import type { VideoRoutePlan } from '../routing.js';

export type RecordingStatus =
  | 'idle'
  | 'planned'
  | 'preparing'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'unavailable';
export type RecordingFormat = 'mp4' | 'mov' | 'mkv' | 'webm' | 'wav' | 'raw_placeholder';
export type RecordingSegmentStatus = 'planned' | 'open' | 'closed' | 'failed';
export type RecordingTargetType =
  'local_file_placeholder' | 'cloud_placeholder' | 'archive_placeholder';

export interface RecordingTarget {
  readonly id: string;
  readonly type: RecordingTargetType;
  readonly outputId: string;
  readonly destination: string;
  readonly metadata: Record<string, unknown>;
}
export interface RecordingSegment {
  readonly id: string;
  readonly index: number;
  readonly status: RecordingSegmentStatus;
  readonly startedAt: string;
  readonly endedAt?: string;
  readonly frameId: number;
  readonly frameTimestamp?: number;
  readonly durationMs: number;
  readonly byteLength: number;
  readonly metadata: Record<string, unknown>;
}
export interface RecordingHealth {
  readonly status: 'healthy' | 'degraded' | 'failed' | 'unavailable';
  readonly isRecording: boolean;
  readonly segmentCount: number;
  readonly warningCount: number;
  readonly failureCount: number;
  readonly backpressure: 'nominal' | 'constrained' | 'paused' | 'unavailable';
  readonly latestFrameId?: number;
  readonly updatedAt: string;
  readonly summary: string;
}
export interface RecordingFailure {
  readonly id: string;
  readonly code: string;
  readonly message: string;
  readonly recoverable: boolean;
  readonly createdAt: string;
  readonly failure?: UBOSFailure;
  readonly metadata: Record<string, unknown>;
}
export interface RecordingPlan {
  readonly id: string;
  readonly broadcastSessionId: string;
  readonly graphRevision: number;
  readonly frameId: number;
  readonly frameTimestamp?: number;
  readonly videoRouteId: string;
  readonly audioRouteId: string;
  readonly outputId: string;
  readonly format: RecordingFormat;
  readonly target: RecordingTarget;
  readonly segmentStrategy: {
    readonly mode: 'single' | 'fixed_duration' | 'manual';
    readonly durationMs?: number;
    readonly maxSegments?: number;
  };
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly warnings: readonly string[];
}
export interface RecordingManifest {
  readonly id: string;
  readonly recordingId: string;
  readonly planId: string;
  readonly broadcastSessionId: string;
  readonly graphRevision: number;
  readonly format: RecordingFormat;
  readonly target: RecordingTarget;
  readonly segments: readonly RecordingSegment[];
  readonly status: 'pending' | 'ready' | 'failed';
  readonly startedAt?: string;
  readonly stoppedAt?: string;
  readonly durationMs: number;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly warnings: readonly string[];
}
export interface RecordingSession {
  readonly id: string;
  readonly plan: RecordingPlan;
  readonly status: RecordingStatus;
  readonly segments: readonly RecordingSegment[];
  readonly manifest?: RecordingManifest;
  readonly health: RecordingHealth;
  readonly failures: readonly RecordingFailure[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly startedAt?: string;
  readonly stoppedAt?: string;
  readonly pausedAt?: string;
  readonly metadata: Record<string, unknown>;
}
export interface RecordingExecutionResult {
  readonly success: boolean;
  readonly session?: RecordingSession;
  readonly plan?: RecordingPlan;
  readonly manifest?: RecordingManifest;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

const now0 = '1970-01-01T00:00:00.000Z';
const clone = <T>(value: T): T =>
  value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
const health = (
  status: RecordingStatus,
  segments: readonly RecordingSegment[],
  failures: readonly RecordingFailure[],
  warnings: readonly string[],
  at: string,
  latestFrameId?: number,
): RecordingHealth => ({
  status:
    status === 'failed'
      ? 'failed'
      : status === 'unavailable'
        ? 'unavailable'
        : warnings.length || failures.length
          ? 'degraded'
          : 'healthy',
  isRecording: status === 'recording',
  segmentCount: segments.length,
  warningCount: warnings.length,
  failureCount: failures.length,
  backpressure:
    status === 'paused'
      ? 'paused'
      : status === 'unavailable'
        ? 'unavailable'
        : warnings.some((w) => w.toLowerCase().includes('backpressure'))
          ? 'constrained'
          : 'nominal',
  ...(latestFrameId === undefined ? {} : { latestFrameId }),
  updatedAt: at,
  summary: `${status}: ${segments.length} segments, ${failures.length} failures`,
});

export function createRecordingPlan(
  graph: ProductionGraph,
  videoPlan?: VideoRoutePlan,
  audioPlan?: AudioRoutePlan,
  options: Partial<Pick<RecordingPlan, 'format' | 'metadata'>> & {
    now?: string;
    frameId?: number;
    frameTimestamp?: number;
    outputId?: string;
    destination?: string;
  } = {},
): RecordingPlan {
  const at = options.now ?? graph.metadata.updatedAt ?? now0;
  const videoRoute =
    videoPlan?.routes.find((r) => r.target === 'recording') ??
    videoPlan?.routes.find((r) => r.target === 'program');
  const audioRoute =
    audioPlan?.routes.find((r) => r.target === 'recording_mix') ??
    audioPlan?.routes.find((r) => r.target === 'program_mix');
  const outputId = options.outputId ?? 'recording-output:mock';
  const warnings = [
    ...(videoRoute ? [] : ['Recording video route is not available; using placeholder route id']),
    ...(audioRoute ? [] : ['Recording audio route is not available; using placeholder route id']),
  ];
  return {
    id: `recording-plan:${graph.broadcastSessionId}:${graph.metadata.revision}:${options.frameId ?? 0}`,
    broadcastSessionId: graph.broadcastSessionId,
    graphRevision: graph.metadata.revision,
    frameId: options.frameId ?? 0,
    ...(options.frameTimestamp === undefined ? {} : { frameTimestamp: options.frameTimestamp }),
    videoRouteId: videoRoute?.id ?? 'video-route:recording:placeholder',
    audioRouteId: audioRoute?.id ?? 'audio-route:recording:placeholder',
    outputId,
    format: options.format ?? 'mp4',
    target: {
      id: `recording-target:${outputId}`,
      type: 'local_file_placeholder',
      outputId,
      destination: options.destination ?? 'mock://recordings/no-file-written',
      metadata: { noFileWriting: true },
    },
    segmentStrategy: { mode: 'fixed_duration', durationMs: 30000, maxSegments: 1000 },
    metadata: { ...(options.metadata ?? {}), replayable: true, mockOnly: true },
    createdAt: at,
    warnings,
  };
}

export function validateRecordingPlan(plan: RecordingPlan): RecordingExecutionResult {
  const errors: string[] = [];
  const warnings = [...plan.warnings];
  if (!plan.broadcastSessionId) errors.push('Recording plan requires broadcastSessionId');
  if (!plan.videoRouteId) errors.push('Recording plan requires videoRouteId');
  if (!plan.audioRouteId) errors.push('Recording plan requires audioRouteId');
  if (!plan.outputId) errors.push('Recording plan requires outputId');
  const replay = detectNonReplayablePayload(plan);
  replay.issues.forEach((issue) => errors.push(`${issue.code}:${issue.message}`));
  return { success: errors.length === 0, plan: clone(plan), warnings, errors };
}

export function prepareRecording(plan: RecordingPlan, at = plan.createdAt): RecordingSession {
  const validation = validateRecordingPlan(plan);
  const status: RecordingStatus = validation.success ? 'preparing' : 'failed';
  const failures = validation.errors.map((message, index) => ({
    id: `${plan.id}:failure:${index}`,
    code: 'INVALID_RECORDING_PLAN',
    message,
    recoverable: false,
    createdAt: at,
    metadata: {},
  }));
  return {
    id: `recording:${plan.broadcastSessionId}:${plan.graphRevision}:${plan.frameId}`,
    plan: clone(plan),
    status,
    segments: [],
    health: health(status, [], failures, validation.warnings, at, plan.frameId),
    failures,
    createdAt: at,
    updatedAt: at,
    metadata: { mockOnly: true },
  };
}
export function startRecording(
  session: RecordingSession,
  at = new Date().toISOString(),
): RecordingSession {
  const segment: RecordingSegment = {
    id: `${session.id}:segment:0`,
    index: 0,
    status: 'open',
    startedAt: at,
    frameId: session.plan.frameId,
    ...(session.plan.frameTimestamp === undefined
      ? {}
      : { frameTimestamp: session.plan.frameTimestamp }),
    durationMs: 0,
    byteLength: 0,
    metadata: { mockSegment: true, noEncodedMedia: true },
  };
  return {
    ...session,
    status: 'recording',
    segments: [segment],
    health: health(
      'recording',
      [segment],
      session.failures,
      session.plan.warnings,
      at,
      session.plan.frameId,
    ),
    startedAt: at,
    updatedAt: at,
  };
}
export function pauseRecording(
  session: RecordingSession,
  at = new Date().toISOString(),
): RecordingSession {
  return {
    ...session,
    status: 'paused',
    pausedAt: at,
    updatedAt: at,
    health: health(
      'paused',
      session.segments,
      session.failures,
      session.plan.warnings,
      at,
      session.plan.frameId,
    ),
  };
}
export function resumeRecording(
  session: RecordingSession,
  at = new Date().toISOString(),
): RecordingSession {
  const segment: RecordingSegment = {
    id: `${session.id}:segment:${session.segments.length}`,
    index: session.segments.length,
    status: 'open',
    startedAt: at,
    frameId: session.plan.frameId + session.segments.length,
    ...(session.plan.frameTimestamp === undefined
      ? {}
      : { frameTimestamp: session.plan.frameTimestamp + session.segments.length * 33.333 }),
    durationMs: 0,
    byteLength: 0,
    metadata: { mockSegment: true, resumed: true, noEncodedMedia: true },
  };
  const segments = [...session.segments, segment];
  return {
    ...session,
    status: 'recording',
    segments,
    updatedAt: at,
    health: health(
      'recording',
      segments,
      session.failures,
      session.plan.warnings,
      at,
      segment.frameId,
    ),
  };
}
export function createRecordingManifest(
  session: RecordingSession,
  at = new Date().toISOString(),
): RecordingManifest {
  const segments = session.segments.map((s) =>
    s.status === 'open'
      ? {
          ...s,
          status: 'closed' as const,
          endedAt: at,
          durationMs: Math.max(0, Date.parse(at) - Date.parse(s.startedAt)),
          byteLength: 0,
        }
      : s,
  );
  return {
    id: `${session.id}:manifest`,
    recordingId: session.id,
    planId: session.plan.id,
    broadcastSessionId: session.plan.broadcastSessionId,
    graphRevision: session.plan.graphRevision,
    format: session.plan.format,
    target: clone(session.plan.target),
    segments,
    status: session.failures.length ? 'failed' : 'ready',
    ...(session.startedAt ? { startedAt: session.startedAt } : {}),
    stoppedAt: at,
    durationMs: session.startedAt ? Math.max(0, Date.parse(at) - Date.parse(session.startedAt)) : 0,
    metadata: { mockManifest: true, noFileWriting: true, replayable: true },
    createdAt: session.createdAt,
    updatedAt: at,
    warnings: session.plan.warnings,
  };
}
export function stopRecording(
  session: RecordingSession,
  at = new Date().toISOString(),
): RecordingSession {
  const manifest = createRecordingManifest(session, at);
  return {
    ...session,
    status: 'stopped',
    segments: manifest.segments,
    manifest,
    stoppedAt: at,
    updatedAt: at,
    health: health(
      'stopped',
      manifest.segments,
      session.failures,
      manifest.warnings,
      at,
      session.plan.frameId,
    ),
  };
}
export function failRecording(
  session: RecordingSession,
  message: string,
  at = new Date().toISOString(),
): RecordingSession {
  const failure: RecordingFailure = {
    id: `${session.id}:failure:${session.failures.length}`,
    code: 'RECORDING_ENGINE_FAILURE',
    message,
    recoverable: true,
    createdAt: at,
    failure: createFailureRecord({
      category: 'OUTPUT_FAILURE',
      sourceLayer: 'execution',
      subsystem: 'recording',
      message,
      frameId: String(session.plan.frameId),
      graphRevision: session.plan.graphRevision,
      metadata: { recordingId: session.id, mockOnly: true },
    }),
    metadata: { mockOnly: true },
  };
  const failures = [...session.failures, failure];
  return {
    ...session,
    status: 'failed',
    failures,
    updatedAt: at,
    health: health(
      'failed',
      session.segments,
      failures,
      session.plan.warnings,
      at,
      session.plan.frameId,
    ),
  };
}
export function summarizeRecordingHealth(input: RecordingSession | RecordingHealth) {
  const h = 'health' in input ? input.health : input;
  return h.summary;
}

export class RecordingStore {
  private sessions: RecordingSession[] = [];
  setRecordingPlan(plan: RecordingPlan) {
    const existing = this.sessions.find((s) => s.plan.id === plan.id);
    const session = existing
      ? { ...existing, plan: clone(plan), updatedAt: plan.createdAt }
      : prepareRecording(plan, plan.createdAt);
    this.sessions = [...this.sessions.filter((s) => s.id !== session.id), session];
    return session;
  }
  setRecordingSession(session: RecordingSession) {
    this.sessions = [...this.sessions.filter((s) => s.id !== session.id), clone(session)];
    return session;
  }
  getRecordingPlan(id: string) {
    return clone(this.sessions.find((s) => s.id === id || s.plan.id === id)?.plan);
  }
  listRecordings() {
    return clone(this.sessions);
  }
  getActiveRecording() {
    return clone(
      this.sessions.find((s) =>
        ['preparing', 'recording', 'paused', 'stopping'].includes(s.status),
      ),
    );
  }
  getRecordingManifest(id: string) {
    return clone(
      this.sessions.find((s) => s.id === id || s.plan.id === id || s.manifest?.id === id)?.manifest,
    );
  }
  clearRecordings() {
    this.sessions = [];
  }
}
