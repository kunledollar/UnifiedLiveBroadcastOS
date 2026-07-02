import {
  applyProductionCommand,
  type ProductionCommand,
  type ProductionEvent,
  type ProductionGraph,
  type StableId,
} from './production-graph.js';

export type ReplayMode =
  | 'audit_only'
  | 'graph_reconstruction'
  | 'command_replay'
  | 'event_replay'
  | 'frame_plan_replay'
  | 'dry_run_execution_replay'
  | 'diagnostics_replay';
export type ReplayStatus = 'idle' | 'planning' | 'running' | 'completed' | 'failed' | 'invalid';
export type ReplayTimelineCategory =
  | 'graph_snapshot'
  | 'command'
  | 'event'
  | 'frame_plan'
  | 'orchestration_plan'
  | 'timing_tick'
  | 'failure'
  | 'recovery'
  | 'queue_pressure'
  | 'execution_result'
  | 'checkpoint'
  | 'diagnostic';

export interface ReplayIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
  readonly severity: 'error' | 'warning';
}
export interface ReplayValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ReplayIssue[];
}
export interface ReplayReconstructionResult {
  readonly ok: boolean;
  readonly graph?: ProductionGraph;
  readonly issues: readonly ReplayIssue[];
  readonly appliedCommandIds: readonly StableId[];
  readonly appliedEventIds: readonly StableId[];
}
export interface ReplayEvent<TPayload = Record<string, unknown>> {
  readonly id: StableId;
  readonly timestamp: string;
  readonly frameId?: StableId;
  readonly graphRevision?: number;
  readonly commandId?: StableId;
  readonly eventId?: StableId;
  readonly framePlanId?: StableId;
  readonly failureId?: StableId;
  readonly checkpointId?: StableId;
  readonly category: ReplayTimelineCategory;
  readonly payload: Readonly<TPayload>;
}
export interface ReplayTimeline {
  readonly id: StableId;
  readonly events: readonly ReplayEvent[];
  readonly createdAt: string;
}
export interface ReplaySnapshot {
  readonly id: StableId;
  readonly timestamp: string;
  readonly graphRevision: number;
  readonly graph: ProductionGraph;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ReplayCheckpoint {
  readonly id: StableId;
  readonly timestamp: string;
  readonly graphSnapshotRef?: StableId;
  readonly snapshot?: ReplaySnapshot;
  readonly graphRevision: number;
  readonly frameId?: StableId;
  readonly commandSequence: number;
  readonly eventSequence: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ReplayCursor {
  readonly timestamp?: string;
  readonly frameId?: StableId;
  readonly graphRevision?: number;
  readonly commandSequence?: number;
  readonly eventSequence?: number;
}
export interface ReplayStep {
  readonly id: StableId;
  readonly mode: ReplayMode;
  readonly status: ReplayStatus;
  readonly cursor: ReplayCursor;
  readonly issues: readonly ReplayIssue[];
}
export interface UBOSReplaySession {
  readonly id: StableId;
  readonly mode: ReplayMode;
  readonly status: ReplayStatus;
  readonly timeline: ReplayTimeline;
  readonly checkpoints: readonly ReplayCheckpoint[];
  readonly commands: readonly ProductionCommand[];
  readonly events: readonly ProductionEvent[];
  readonly framePlans: readonly ReplayableFramePlan[];
  readonly createdAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ReplayableFramePlan {
  readonly id: StableId;
  readonly frameId: StableId;
  readonly frameTimestamp: number;
  readonly graphRevision: number;
  readonly plannerRevision: number;
  readonly steps: readonly Readonly<Record<string, unknown>>[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface DryRunReplay {
  readonly id: StableId;
  readonly mode: 'dry_run_execution_replay';
  readonly graphRevision: number;
  readonly executionMetadata: Readonly<Record<string, unknown>>;
}

const forbiddenConstructors = new Set(['MediaStream','MediaStreamTrack','VideoFrame','AudioData','EncodedVideoChunk','EncodedAudioChunk','HTMLElement','HTMLCanvasElement','CanvasRenderingContext2D','OffscreenCanvas','RTCPeerConnection']);
const forbiddenKey = /(^|_|-)(mediaStream|stream|rawVideo|videoFrame|rawAudio|audioSample|encodedPacket|domElement|canvas|canvasContext|canvasRef|adapter|deviceHandle|mediaTrack)(_|-|$)/i;
const clone = <T>(value: T): T => structuredClone(value);
const issue = (code: string, message: string, path?: string, severity: 'error' | 'warning' = 'error'): ReplayIssue => ({ code, message, ...(path === undefined ? {} : { path }), severity });

export function createReplayTimeline(id = 'replay-timeline', createdAt = new Date().toISOString()): ReplayTimeline { return { id, events: [], createdAt }; }
export function appendReplayTimelineEvent(timeline: ReplayTimeline, event: ReplayEvent): ReplayTimeline { return { ...timeline, events: [...timeline.events, clone(event)] }; }
export function sortReplayTimeline(timeline: ReplayTimeline): ReplayTimeline { return { ...timeline, events: [...timeline.events].sort((a,b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id)) }; }
export function filterReplayTimelineByFrame(timeline: ReplayTimeline, frameId: StableId): ReplayTimeline { return { ...timeline, events: timeline.events.filter((e) => e.frameId === frameId) }; }
export function filterReplayTimelineByRevision(timeline: ReplayTimeline, graphRevision: number): ReplayTimeline { return { ...timeline, events: timeline.events.filter((e) => e.graphRevision === graphRevision) }; }
export function summarizeReplayTimeline(timeline: ReplayTimeline) { return { id: timeline.id, eventCount: timeline.events.length, categories: timeline.events.reduce<Record<string, number>>((a,e) => ({ ...a, [e.category]: (a[e.category] ?? 0) + 1 }), {}), firstTimestamp: timeline.events[0]?.timestamp, lastTimestamp: timeline.events.at(-1)?.timestamp }; }

export function createReplayCheckpoint(input: Omit<ReplayCheckpoint, 'snapshot'> & { snapshot?: ReplaySnapshot }): ReplayCheckpoint { return clone({ ...input, ...(input.snapshot === undefined ? {} : { snapshot: input.snapshot }) }); }
export function selectNearestCheckpoint(checkpoints: readonly ReplayCheckpoint[], cursor: ReplayCursor): ReplayCheckpoint | undefined { const rev = cursor.graphRevision ?? Number.MAX_SAFE_INTEGER; return [...checkpoints].filter((c) => c.graphRevision <= rev).sort((a,b) => b.graphRevision - a.graphRevision || b.timestamp.localeCompare(a.timestamp))[0]; }
export function validateReplayCheckpoint(checkpoint: ReplayCheckpoint): ReplayValidationResult { const issues = [...detectNonReplayablePayload(checkpoint).issues]; if (!checkpoint.snapshot && !checkpoint.graphSnapshotRef) issues.push(issue('MISSING_CHECKPOINT_SNAPSHOT', 'Checkpoint must reference or contain a graph snapshot')); return { valid: !issues.some((i) => i.severity === 'error'), issues }; }
export function summarizeReplayCheckpoint(c: ReplayCheckpoint) { return { id: c.id, graphRevision: c.graphRevision, frameId: c.frameId, commandSequence: c.commandSequence, eventSequence: c.eventSequence, timestamp: c.timestamp, hasSnapshot: Boolean(c.snapshot), graphSnapshotRef: c.graphSnapshotRef }; }

export function reconstructGraphFromCheckpoint(checkpoint: ReplayCheckpoint): ReplayReconstructionResult { const validation = validateReplayCheckpoint(checkpoint); if (!validation.valid || !checkpoint.snapshot) return { ok: false, issues: validation.issues, appliedCommandIds: [], appliedEventIds: [] }; return { ok: true, graph: clone(checkpoint.snapshot.graph), issues: validation.issues, appliedCommandIds: [], appliedEventIds: [] }; }
export function replayCommandsToRevision(graph: ProductionGraph, commands: readonly ProductionCommand[], targetRevision: number): ReplayReconstructionResult { let current = clone(graph); const applied: string[] = []; const issues: ReplayIssue[] = []; for (const command of commands) { if (current.metadata.revision >= targetRevision) break; const transition = applyProductionCommand(current, clone(command)); if (!transition.accepted) { issues.push(issue('COMMAND_REPLAY_REJECTED', `Command ${command.id} was rejected during replay`)); break; } current = transition.nextGraph; applied.push(command.id); } return { ok: issues.length === 0 && current.metadata.revision === targetRevision, graph: current, issues, appliedCommandIds: applied, appliedEventIds: [] }; }
export function replayEventsToRevision(graph: ProductionGraph, events: readonly ProductionEvent[], targetRevision: number): ReplayReconstructionResult { const relevant = events.filter((e) => e.nextRevision <= targetRevision); const issues = detectReplayGap(relevant).issues; return { ok: issues.length === 0, graph: clone(graph), issues, appliedCommandIds: [], appliedEventIds: relevant.map((e) => e.id) }; }
export function getReplayPlan(session: UBOSReplaySession, cursor: ReplayCursor) { const checkpoint = selectNearestCheckpoint(session.checkpoints, cursor); return { checkpointId: checkpoint?.id, commandIds: session.commands.filter((c) => (checkpoint?.commandSequence ?? 0) < Number(c.metadata?.sequence ?? Number.MAX_SAFE_INTEGER)).map((c) => c.id), eventIds: session.events.filter((e) => e.nextRevision <= (cursor.graphRevision ?? Number.MAX_SAFE_INTEGER)).map((e) => e.id) }; }
export function validateReconstructedGraph(graph: ProductionGraph, expectedRevision: number): ReplayValidationResult { const payload = detectNonReplayablePayload(graph); const issues = [...payload.issues]; if (graph.metadata.revision !== expectedRevision) issues.push(issue('REPLAY_DIVERGENCE', `Expected revision ${expectedRevision}, got ${graph.metadata.revision}`)); return { valid: !issues.some((i) => i.severity === 'error'), issues }; }

export function replayFramePlan(plan: ReplayableFramePlan) { const validation = validateReplayStep({ id: plan.id, mode: 'frame_plan_replay', status: 'completed', cursor: { frameId: plan.frameId, graphRevision: plan.graphRevision }, issues: [] }); return { plan: clone(plan), validation }; }
export function replayFramePlansBetween(plans: readonly ReplayableFramePlan[], startFrameId: StableId, endFrameId: StableId) { const start = plans.findIndex((p) => p.frameId === startFrameId); const end = plans.findIndex((p) => p.frameId === endFrameId); return start < 0 || end < start ? [] : plans.slice(start, end + 1).map(clone); }
export function compareFramePlans(a: ReplayableFramePlan, b: ReplayableFramePlan): ReplayValidationResult { const issues: ReplayIssue[] = []; if (a.frameId !== b.frameId) issues.push(issue('FRAME_ID_MISMATCH', 'Frame identity differs')); if (a.frameTimestamp !== b.frameTimestamp) issues.push(issue('FRAME_TIMESTAMP_MISMATCH', 'Frame timestamp differs')); if (a.graphRevision !== b.graphRevision) issues.push(issue('GRAPH_REVISION_MISMATCH', 'Graph revision differs')); if (a.plannerRevision !== b.plannerRevision) issues.push(issue('PLANNER_REVISION_MISMATCH', 'Planner revision differs')); if (JSON.stringify(a.steps.map(Object.keys)) !== JSON.stringify(b.steps.map(Object.keys))) issues.push(issue('NON_DETERMINISTIC_PLAN_SHAPE', 'Frame plan step shape differs')); return { valid: issues.length === 0, issues }; }
export function summarizeFramePlanReplay(plans: readonly ReplayableFramePlan[]) { return { framePlanCount: plans.length, firstFrameId: plans[0]?.frameId, latestFrameId: plans.at(-1)?.frameId, latestGraphRevision: Math.max(0, ...plans.map((p) => p.graphRevision)) }; }

export function createDryRunReplay(input: Omit<DryRunReplay, 'mode'>): DryRunReplay { return clone({ ...input, mode: 'dry_run_execution_replay' }); }
export function replayExecutionMetadata(metadata: Record<string, unknown>) { return { metadata: clone(metadata), validation: detectNonReplayablePayload(metadata) }; }
export function compareExecutionResults(a: Record<string, unknown>, b: Record<string, unknown>): ReplayValidationResult { const same = JSON.stringify(a) === JSON.stringify(b); return { valid: same, issues: same ? [] : [issue('EXECUTION_RESULT_DIVERGENCE', 'Execution metadata differs')] }; }

export function validateReplaySession(session: UBOSReplaySession): ReplayValidationResult { const issues = [...validateReplayTimeline(session.timeline).issues, ...detectNonReplayablePayload(session).issues]; if (session.checkpoints.length === 0) issues.push(issue('MISSING_CHECKPOINT', 'Replay session has no checkpoints')); return { valid: !issues.some((i) => i.severity === 'error'), issues }; }
export function validateReplayTimeline(timeline: ReplayTimeline): ReplayValidationResult { const issues = detectNonReplayablePayload(timeline).issues; return { valid: issues.length === 0, issues }; }
export function validateReplayStep(step: ReplayStep): ReplayValidationResult { const issues = [...detectNonReplayablePayload(step).issues]; if (!step.id) issues.push(issue('INVALID_REPLAY_STEP', 'Replay step requires an id')); return { valid: issues.length === 0, issues }; }
export function detectReplayGap(records: readonly Pick<ProductionEvent, 'previousRevision' | 'nextRevision' | 'id'>[]): ReplayValidationResult { const issues: ReplayIssue[] = []; [...records].sort((a,b) => a.previousRevision - b.previousRevision).forEach((event, index, sorted) => { const previous = sorted[index - 1]; if (previous && event.previousRevision !== previous.nextRevision) issues.push(issue('REVISION_GAP', `Revision gap before ${event.id}`)); }); return { valid: issues.length === 0, issues }; }
export function detectReplayDivergence(expected: unknown, actual: unknown): ReplayValidationResult { const valid = JSON.stringify(expected) === JSON.stringify(actual); return { valid, issues: valid ? [] : [issue('REPLAY_DIVERGENCE', 'Replay output differs from expected state')] }; }
export function detectNonReplayablePayload(value: unknown): ReplayValidationResult { const issues: ReplayIssue[] = []; const seen = new WeakSet<object>(); const visit = (v: unknown, path: string) => { if (!v || typeof v !== 'object') return; if (seen.has(v)) return; seen.add(v); const ctor = (v as { constructor?: { name?: string } }).constructor?.name; if (ctor && forbiddenConstructors.has(ctor)) issues.push(issue('FORBIDDEN_RUNTIME_PAYLOAD', `Forbidden runtime payload ${ctor}`, path)); for (const [key, nested] of Object.entries(v)) { if (forbiddenKey.test(key)) issues.push(issue('FORBIDDEN_RUNTIME_PAYLOAD', `Forbidden replay key ${key}`, `${path}.${key}`)); visit(nested, `${path}.${key}`); } }; visit(value, '$'); return { valid: issues.length === 0, issues }; }

export function summarizeAuditTrail(session: Pick<UBOSReplaySession, 'commands' | 'events'>) { return session.commands.map((command) => { const events = session.events.filter((event) => event.commandId === command.id); const accepted = events.some((event) => event.type !== 'COMMAND_REJECTED'); const first = events[0]; const last = events.at(-1); return { commandId: command.id, actorId: command.actorId, actorRole: command.actorRole, issuedAt: command.timestamp, status: accepted ? 'accepted' : 'rejected', graphRevisionBefore: first?.previousRevision ?? command.expectedRevision, graphRevisionAfter: last?.nextRevision ?? command.expectedRevision, frameId: command.metadata?.frameId, authorityDecision: command.metadata?.authorityDecision, failureId: command.metadata?.failureId, recoveryId: command.metadata?.recoveryId }; }); }
export function summarizeReplayDiagnostics(session: UBOSReplaySession) { const gaps = detectReplayGap(session.events).issues; const warnings = detectNonReplayablePayload(session).issues; return { replayableCommandCount: session.commands.length, replayableEventCount: session.events.length, checkpointCount: session.checkpoints.length, latestGraphRevision: Math.max(0, ...session.events.map((e) => e.nextRevision), ...session.checkpoints.map((c) => c.graphRevision)), latestFrameId: session.timeline.events.filter((e) => e.frameId).at(-1)?.frameId, detectedReplayGaps: gaps.length, nonReplayablePayloadWarnings: warnings.length }; }
