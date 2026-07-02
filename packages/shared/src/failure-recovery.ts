export type FailureCategory =
  | 'COMMAND_FAILURE'
  | 'GRAPH_FAILURE'
  | 'REVISION_CONFLICT'
  | 'SYNC_FAILURE'
  | 'AUTHORITY_FAILURE'
  | 'PLANNER_FAILURE'
  | 'FRAME_PLAN_FAILURE'
  | 'EXECUTION_FAILURE'
  | 'COMPOSITOR_FAILURE'
  | 'VIDEO_ROUTING_FAILURE'
  | 'AUDIO_ROUTING_FAILURE'
  | 'OUTPUT_FAILURE'
  | 'RENDERER_FAILURE'
  | 'MEDIA_SOURCE_FAILURE'
  | 'DATABASE_FAILURE'
  | 'WEBSOCKET_FAILURE'
  | 'RECORDING_FAILURE'
  | 'STREAMING_FAILURE'
  | 'OBSERVABILITY_FAILURE'
  | 'UNKNOWN_FAILURE';

export type FailureSeverity = 'info' | 'warning' | 'degraded' | 'recoverable' | 'critical' | 'fatal';
export type FailureStatus = 'detected' | 'retrying' | 'degraded' | 'isolated' | 'operator_required' | 'resolved' | 'fatal';
export type FailureSource = 'graph' | 'sync' | 'authority' | 'planner' | 'execution' | 'compositor' | 'routing' | 'renderer' | 'output' | 'database' | 'websocket' | 'recording' | 'streaming' | 'observability' | 'unknown';
export type FailureRecoveryPolicy = 'ignore' | 'warn_only' | 'retry' | 'fallback' | 'degrade' | 'isolate_subsystem' | 'pause_execution' | 'require_operator_action' | 'shutdown_session';
export type FailureResolution = 'ignored' | 'warned' | 'retried' | 'fallback_applied' | 'degraded_mode_entered' | 'subsystem_isolated' | 'operator_resolved' | 'session_shutdown' | 'unresolved';
export type DegradedMode = 'local_only_mode' | 'mock_media_mode' | 'renderer_placeholder_mode' | 'output_disabled_mode' | 'sync_readonly_mode' | 'database_readonly_mode' | 'diagnostics_only_mode';
export type FrameFailureType = 'FRAME_PLAN_FAILED' | 'FRAME_EXECUTION_FAILED' | 'FRAME_RENDER_FAILED' | 'FRAME_OUTPUT_FAILED' | 'FRAME_DROPPED' | 'FRAME_DEGRADED';
export type CircuitBreakerStatus = 'closed' | 'open' | 'half_open';

export interface FailureRecoveryAttempt {
  readonly attemptedAt: string;
  readonly policy: FailureRecoveryPolicy;
  readonly attemptNumber: number;
  readonly successful: boolean;
  readonly message?: string;
}

export interface UBOSFailure {
  readonly id: string;
  readonly category: FailureCategory;
  readonly severity: FailureSeverity;
  readonly status: FailureStatus;
  readonly sourceLayer: FailureSource;
  readonly subsystem: string;
  readonly message: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly frameId?: string;
  readonly graphRevision?: number;
  readonly commandId?: string;
  readonly intentId?: string;
  readonly executionBatchId?: string;
  readonly operatorId?: string;
  readonly recoverable: boolean;
  readonly retryCount: number;
  readonly recoveryPolicy: FailureRecoveryPolicy;
  readonly attempts: readonly FailureRecoveryAttempt[];
  readonly resolution?: FailureResolution;
  readonly metadata: Record<string, unknown>;
}

export interface FailureInput extends Partial<Pick<UBOSFailure, 'severity' | 'status' | 'sourceLayer' | 'subsystem' | 'frameId' | 'graphRevision' | 'commandId' | 'intentId' | 'executionBatchId' | 'operatorId' | 'retryCount' | 'resolution' | 'metadata'>> {
  readonly id?: string;
  readonly category?: FailureCategory;
  readonly message: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly recoveryPolicy?: FailureRecoveryPolicy;
  readonly attempts?: readonly FailureRecoveryAttempt[];
  readonly recoverable?: boolean;
}

export interface CircuitBreakerState {
  readonly id: string;
  readonly status: CircuitBreakerStatus;
  readonly failureCount: number;
  readonly successCount: number;
  readonly openedAt?: string;
  readonly lastFailureAt?: string;
  readonly lastSuccessAt?: string;
  readonly threshold: number;
  readonly halfOpenAfterMs: number;
}

const categoryDefaults: Record<FailureCategory, { severity: FailureSeverity; policy: FailureRecoveryPolicy; source: FailureSource }> = {
  COMMAND_FAILURE: { severity: 'recoverable', policy: 'warn_only', source: 'graph' },
  GRAPH_FAILURE: { severity: 'critical', policy: 'pause_execution', source: 'graph' },
  REVISION_CONFLICT: { severity: 'warning', policy: 'warn_only', source: 'sync' },
  SYNC_FAILURE: { severity: 'recoverable', policy: 'retry', source: 'sync' },
  AUTHORITY_FAILURE: { severity: 'critical', policy: 'require_operator_action', source: 'authority' },
  PLANNER_FAILURE: { severity: 'recoverable', policy: 'fallback', source: 'planner' },
  FRAME_PLAN_FAILURE: { severity: 'recoverable', policy: 'fallback', source: 'planner' },
  EXECUTION_FAILURE: { severity: 'recoverable', policy: 'retry', source: 'execution' },
  COMPOSITOR_FAILURE: { severity: 'recoverable', policy: 'fallback', source: 'compositor' },
  VIDEO_ROUTING_FAILURE: { severity: 'degraded', policy: 'degrade', source: 'routing' },
  AUDIO_ROUTING_FAILURE: { severity: 'degraded', policy: 'degrade', source: 'routing' },
  OUTPUT_FAILURE: { severity: 'critical', policy: 'isolate_subsystem', source: 'output' },
  RENDERER_FAILURE: { severity: 'recoverable', policy: 'fallback', source: 'renderer' },
  MEDIA_SOURCE_FAILURE: { severity: 'degraded', policy: 'degrade', source: 'execution' },
  DATABASE_FAILURE: { severity: 'degraded', policy: 'degrade', source: 'database' },
  WEBSOCKET_FAILURE: { severity: 'recoverable', policy: 'retry', source: 'websocket' },
  RECORDING_FAILURE: { severity: 'critical', policy: 'isolate_subsystem', source: 'recording' },
  STREAMING_FAILURE: { severity: 'critical', policy: 'isolate_subsystem', source: 'streaming' },
  OBSERVABILITY_FAILURE: { severity: 'warning', policy: 'warn_only', source: 'observability' },
  UNKNOWN_FAILURE: { severity: 'critical', policy: 'require_operator_action', source: 'unknown' },
};

const retryable = new Set<FailureCategory>(['SYNC_FAILURE', 'EXECUTION_FAILURE', 'FRAME_PLAN_FAILURE', 'COMPOSITOR_FAILURE', 'RENDERER_FAILURE', 'WEBSOCKET_FAILURE', 'MEDIA_SOURCE_FAILURE']);
const nonRetryable = new Set<FailureCategory>(['GRAPH_FAILURE', 'REVISION_CONFLICT', 'AUTHORITY_FAILURE', 'COMMAND_FAILURE']);

export function classifyFailure(input: { category?: FailureCategory; subsystem?: string; sourceLayer?: FailureSource }): FailureCategory {
  if (input.category) return input.category;
  const label = `${input.sourceLayer ?? ''}:${input.subsystem ?? ''}`.toLowerCase();
  if (label.includes('websocket')) return 'WEBSOCKET_FAILURE';
  if (label.includes('database') || label.includes('persistence')) return 'DATABASE_FAILURE';
  if (label.includes('renderer')) return 'RENDERER_FAILURE';
  if (label.includes('output')) return 'OUTPUT_FAILURE';
  if (label.includes('planner')) return 'PLANNER_FAILURE';
  if (label.includes('graph')) return 'GRAPH_FAILURE';
  return 'UNKNOWN_FAILURE';
}

export function selectRecoveryPolicy(failure: Pick<UBOSFailure, 'category' | 'severity'>): FailureRecoveryPolicy {
  if (failure.severity === 'fatal') return 'shutdown_session';
  if (failure.severity === 'critical' && failure.category === 'UNKNOWN_FAILURE') return 'require_operator_action';
  return categoryDefaults[failure.category].policy;
}

export function shouldRetryFailure(failure: Pick<UBOSFailure, 'category' | 'severity' | 'retryCount' | 'recoverable'>, maxRetries = 3): boolean {
  if (!failure.recoverable || failure.severity === 'fatal' || failure.severity === 'critical') return false;
  if (nonRetryable.has(failure.category)) return false;
  return retryable.has(failure.category) && failure.retryCount < maxRetries;
}

export function shouldEscalateFailure(failure: Pick<UBOSFailure, 'severity' | 'retryCount' | 'status'>, maxRetries = 3): boolean {
  return failure.severity === 'fatal' || failure.status === 'operator_required' || failure.retryCount >= maxRetries;
}

export function createFailureRecord(input: FailureInput): UBOSFailure {
  const category = classifyFailure(input);
  const defaults = categoryDefaults[category];
  const severity = input.severity ?? defaults.severity;
  const now = input.createdAt ?? new Date().toISOString();
  const base = { category, severity };
  const recoveryPolicy = input.recoveryPolicy ?? selectRecoveryPolicy(base);
  const recoverable = input.recoverable ?? !['fatal', 'critical'].includes(severity);
  const record: UBOSFailure = {
    id: input.id ?? `failure-${category.toLowerCase()}-${now}`,
    category,
    severity,
    status: input.status ?? 'detected',
    sourceLayer: input.sourceLayer ?? defaults.source,
    subsystem: input.subsystem ?? defaults.source,
    message: input.message,
    createdAt: now,
    updatedAt: input.updatedAt ?? now,
    recoverable,
    retryCount: input.retryCount ?? 0,
    recoveryPolicy,
    attempts: input.attempts ?? [],
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
  };
  const optionalFields: { -readonly [K in keyof Partial<UBOSFailure>]: Partial<UBOSFailure>[K] } = {};
  if (input.frameId !== undefined) optionalFields.frameId = input.frameId;
  if (input.graphRevision !== undefined) optionalFields.graphRevision = input.graphRevision;
  if (input.commandId !== undefined) optionalFields.commandId = input.commandId;
  if (input.intentId !== undefined) optionalFields.intentId = input.intentId;
  if (input.executionBatchId !== undefined) optionalFields.executionBatchId = input.executionBatchId;
  if (input.operatorId !== undefined) optionalFields.operatorId = input.operatorId;
  if (input.resolution !== undefined) optionalFields.resolution = input.resolution;
  return Object.freeze({ ...record, ...optionalFields });

}

export function summarizeFailureState(failures: readonly UBOSFailure[], degradedModes: readonly DegradedMode[] = []) {
  return Object.freeze({
    total: failures.length,
    active: failures.filter((failure) => failure.status !== 'resolved').length,
    highestSeverity: failures.some((f) => f.severity === 'fatal') ? 'fatal' : failures.some((f) => f.severity === 'critical') ? 'critical' : failures.some((f) => f.severity === 'degraded') ? 'degraded' : failures[0]?.severity ?? 'info',
    degradedModes: [...degradedModes],
    operatorActionRequired: failures.some((f) => f.status === 'operator_required' || f.recoveryPolicy === 'require_operator_action'),
  });
}

export function createCircuitBreakerState(id: string, threshold = 3, halfOpenAfterMs = 30000): CircuitBreakerState {
  return Object.freeze({ id, status: 'closed', failureCount: 0, successCount: 0, threshold, halfOpenAfterMs });
}

export function shouldOpenCircuit(state: CircuitBreakerState): boolean {
  return state.status !== 'open' && state.failureCount >= state.threshold;
}

export function shouldAttemptHalfOpen(state: CircuitBreakerState, at = Date.now()): boolean {
  return state.status === 'open' && !!state.openedAt && at - Date.parse(state.openedAt) >= state.halfOpenAfterMs;
}

export function recordCircuitBreakerFailure(state: CircuitBreakerState, at = new Date().toISOString()): CircuitBreakerState {
  const failureCount = state.failureCount + 1;
  const status: CircuitBreakerStatus = failureCount >= state.threshold ? 'open' : state.status;
  const next: CircuitBreakerState = { ...state, status, failureCount, successCount: 0, lastFailureAt: at };
  return Object.freeze(status === 'open' ? { ...next, openedAt: state.openedAt ?? at } : next);
}

export function recordCircuitBreakerSuccess(state: CircuitBreakerState, at = new Date().toISOString()): CircuitBreakerState {
  const { openedAt: _openedAt, ...closedState } = state;
  void _openedAt;
  return Object.freeze({ ...closedState, status: 'closed', failureCount: 0, successCount: state.successCount + 1, lastSuccessAt: at });
}

export function createFrameFailure(input: Omit<FailureInput, 'category'> & { frameFailureType: FrameFailureType }): UBOSFailure {
  const category: FailureCategory = input.frameFailureType === 'FRAME_PLAN_FAILED' ? 'FRAME_PLAN_FAILURE' : input.frameFailureType === 'FRAME_RENDER_FAILED' ? 'RENDERER_FAILURE' : input.frameFailureType === 'FRAME_OUTPUT_FAILED' ? 'OUTPUT_FAILURE' : 'EXECUTION_FAILURE';
  return createFailureRecord({ ...input, category, metadata: { ...(input.metadata ?? {}), frameFailureType: input.frameFailureType, graphMutationAllowed: false } });
}
