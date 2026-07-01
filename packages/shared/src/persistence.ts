import type { AuthorityDecision, CollaborationLock, CommandConflict } from './authority.js';
import type { CollaborationEvent, CollaborationOperator } from './collaboration.js';
import {
  getProductionGraphRevision,
  type BroadcastSessionState,
  type OperatorRole,
  type ProductionCommand,
  type ProductionEvent,
  type ProductionGraph,
  type StableId,
} from './production-graph.js';

export type JsonRecord = Record<string, unknown>;
export type OperatorConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
export type RecoveryStatus = 'ready' | 'snapshot_missing' | 'events_missing' | 'replayed';

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const clone = <T>(value: T): T => structuredClone(value);

export interface BroadcastSessionRecord {
  readonly id: StableId;
  readonly name: string;
  readonly status: BroadcastSessionState;
  readonly createdAt: string;
  readonly startedAt?: string;
  readonly endedAt?: string;
  readonly currentGraphId: StableId;
  readonly currentGraphRevision: number;
  readonly activeOperatorIds: readonly StableId[];
  readonly ownerOperatorId?: StableId;
  readonly metadata: Readonly<JsonRecord>;
}

export interface ProductionGraphSnapshotRecord {
  readonly id: StableId;
  readonly broadcastSessionId: StableId;
  readonly graphId: StableId;
  readonly graphRevision: number;
  readonly schemaVersion: string;
  readonly createdAt: string;
  readonly graph: Readonly<ProductionGraph>;
  readonly metadata: Readonly<JsonRecord>;
}

export interface ProductionCommandRecord {
  readonly id: StableId;
  readonly broadcastSessionId: StableId;
  readonly graphId: StableId;
  readonly expectedRevision?: number;
  readonly resultingRevision?: number;
  readonly actorId: StableId;
  readonly actorRole: OperatorRole;
  readonly commandType: ProductionCommand['type'];
  readonly timestamp: string;
  readonly payload: Readonly<JsonRecord>;
  readonly accepted: boolean;
  readonly rejectionReason?: string;
  readonly correlationId?: StableId;
  readonly metadata: Readonly<JsonRecord>;
}

export interface ProductionEventRecord {
  readonly id: StableId;
  readonly broadcastSessionId: StableId;
  readonly graphId: StableId;
  readonly graphRevision: number;
  readonly previousRevision: number;
  readonly nextRevision: number;
  readonly eventType: ProductionEvent['type'];
  readonly commandId: StableId;
  readonly actorId: StableId;
  readonly timestamp: string;
  readonly payload: Readonly<JsonRecord>;
  readonly metadata: Readonly<JsonRecord>;
}

export interface CollaborationEventRecord extends CollaborationEvent { readonly broadcastSessionId: StableId; readonly metadata: Readonly<JsonRecord>; }
export interface OperatorSessionRecord extends Omit<CollaborationOperator, 'metadata'> { readonly broadcastSessionId: StableId; readonly leftAt?: string; readonly metadata: Readonly<JsonRecord>; }
export interface AuthorityDecisionRecord extends AuthorityDecision { readonly graphRevision?: number; }
export interface CollaborationLockRecord extends CollaborationLock { readonly resolvedAt?: string; }
export interface CommandConflictRecord extends CommandConflict { readonly graphRevision?: number; }
export interface SyncCheckpointRecord { readonly id: StableId; readonly clientId: StableId; readonly operatorId: StableId; readonly broadcastSessionId: StableId; readonly observedGraphRevision: number; readonly lastAckAt?: string; readonly lastHeartbeatAt: string; readonly connectionState: OperatorConnectionState; readonly metadata: Readonly<JsonRecord>; }

export interface BroadcastSessionRepository { upsert(record: BroadcastSessionRecord): BroadcastSessionRecord; get(id: StableId): BroadcastSessionRecord | undefined; list(): BroadcastSessionRecord[]; }
export interface ProductionGraphSnapshotRepository { append(record: ProductionGraphSnapshotRecord): ProductionGraphSnapshotRecord; getLatest(sessionId: StableId): ProductionGraphSnapshotRecord | undefined; list(sessionId: StableId): ProductionGraphSnapshotRecord[]; }
export interface ProductionCommandRepository { append(record: ProductionCommandRecord): ProductionCommandRecord; list(sessionId: StableId): ProductionCommandRecord[]; listFromRevision(sessionId: StableId, revision: number): ProductionCommandRecord[]; }
export interface ProductionEventRepository { append(record: ProductionEventRecord): ProductionEventRecord; list(sessionId: StableId): ProductionEventRecord[]; listFromRevision(sessionId: StableId, revision: number): ProductionEventRecord[]; }
export interface CollaborationRepository { upsertOperator(record: OperatorSessionRecord): OperatorSessionRecord; appendEvent(record: CollaborationEventRecord): CollaborationEventRecord; upsertCheckpoint(record: SyncCheckpointRecord): SyncCheckpointRecord; listOperators(sessionId: StableId): OperatorSessionRecord[]; listEvents(sessionId: StableId): CollaborationEventRecord[]; listCheckpoints(sessionId: StableId): SyncCheckpointRecord[]; }
export interface AuthorityRepository { appendLock(record: CollaborationLockRecord): CollaborationLockRecord; appendDecision(record: AuthorityDecisionRecord): AuthorityDecisionRecord; appendConflict(record: CommandConflictRecord): CommandConflictRecord; listLocks(sessionId: StableId): CollaborationLockRecord[]; listActiveLocks(sessionId: StableId, at?: string): CollaborationLockRecord[]; listDecisions(sessionId: StableId): AuthorityDecisionRecord[]; listConflicts(sessionId: StableId): CommandConflictRecord[]; }

export function createBroadcastSessionRecord(input: { graph: ProductionGraph; name?: string; ownerOperatorId?: string; activeOperatorIds?: string[]; timestamp?: string; metadata?: JsonRecord }): BroadcastSessionRecord {
  const timestamp = input.timestamp ?? now();
  return Object.freeze({ id: input.graph.broadcastSessionId, name: input.name ?? input.graph.session.name, status: input.graph.status, createdAt: timestamp, currentGraphId: input.graph.id, currentGraphRevision: getProductionGraphRevision(input.graph), activeOperatorIds: input.activeOperatorIds ?? [], ...(input.ownerOperatorId ? { ownerOperatorId: input.ownerOperatorId } : {}), metadata: input.metadata ?? {} });
}
export function createGraphSnapshot(graph: ProductionGraph, metadata: JsonRecord = {}, timestamp = now()): ProductionGraphSnapshotRecord { return Object.freeze({ id: id('graph-snapshot'), broadcastSessionId: graph.broadcastSessionId, graphId: graph.id, graphRevision: getProductionGraphRevision(graph), schemaVersion: graph.schemaVersion, createdAt: timestamp, graph: clone(graph), metadata }); }
export function restoreGraphFromSnapshot(snapshot: ProductionGraphSnapshotRecord): ProductionGraph { return clone(snapshot.graph); }
export function getLatestGraphSnapshot(repo: ProductionGraphSnapshotRepository, sessionId: StableId) { return repo.getLatest(sessionId); }
export function shouldCreateGraphSnapshot(currentRevision: number, latestSnapshotRevision = 0, everyNRevisions = 25) { return currentRevision > latestSnapshotRevision && currentRevision - latestSnapshotRevision >= everyNRevisions; }

export function createProductionCommandRecord(command: ProductionCommand, graphId: StableId, accepted: boolean, resultingRevision?: number, rejectionReason?: string): ProductionCommandRecord { return Object.freeze({ id: command.id, broadcastSessionId: command.broadcastSessionId, graphId, ...(command.expectedRevision === undefined ? {} : { expectedRevision: command.expectedRevision }), ...(resultingRevision === undefined ? {} : { resultingRevision }), actorId: command.actorId, actorRole: command.actorRole, commandType: command.type, timestamp: command.timestamp, payload: clone(command.payload as JsonRecord), accepted, ...(rejectionReason === undefined ? {} : { rejectionReason }), ...(command.correlationId === undefined ? {} : { correlationId: command.correlationId }), metadata: clone((command.metadata ?? {}) as JsonRecord) }); }
export function createProductionEventRecord(event: ProductionEvent, graphId: StableId): ProductionEventRecord { return Object.freeze({ id: event.id, broadcastSessionId: event.broadcastSessionId, graphId, graphRevision: event.graphRevision, previousRevision: event.previousRevision, nextRevision: event.nextRevision, eventType: event.type, commandId: event.commandId, actorId: event.actorId, timestamp: event.timestamp, payload: clone(event.payload as JsonRecord), metadata: clone((event.metadata ?? {}) as JsonRecord) }); }
export function createSyncCheckpointRecord(input: Omit<SyncCheckpointRecord, 'id' | 'metadata'> & { id?: StableId; metadata?: JsonRecord }): SyncCheckpointRecord { return Object.freeze({ ...input, id: input.id ?? id('sync-checkpoint'), metadata: input.metadata ?? {} }); }

export class InMemoryBroadcastSessionRepository implements BroadcastSessionRepository {
  private records = new Map<string, BroadcastSessionRecord>();
  upsert(record: BroadcastSessionRecord) { this.records.set(record.id, clone(record)); return record; }
  get(id: StableId) { const record = this.records.get(id); return record ? clone(record) : undefined; }
  list() { return [...this.records.values()].map(clone); }
}
export class InMemoryProductionGraphSnapshotRepository implements ProductionGraphSnapshotRepository {
  private records: ProductionGraphSnapshotRecord[] = [];
  append(record: ProductionGraphSnapshotRecord) { this.records = [...this.records, clone(record)]; return record; }
  getLatest(sessionId: StableId) { return this.list(sessionId).at(-1); }
  list(sessionId: StableId) { return this.records.filter((r) => r.broadcastSessionId === sessionId).sort((a, b) => a.graphRevision - b.graphRevision).map(clone); }
}
export class InMemoryProductionCommandRepository implements ProductionCommandRepository {
  private records: ProductionCommandRecord[] = [];
  append(record: ProductionCommandRecord) { this.records = [...this.records, clone(record)]; return record; }
  list(sessionId: StableId) { return this.records.filter((r) => r.broadcastSessionId === sessionId).map(clone); }
  listFromRevision(sessionId: StableId, revision: number) { return this.records.filter((r) => r.broadcastSessionId === sessionId && (r.resultingRevision ?? -1) > revision).sort((a, b) => (a.resultingRevision ?? 0) - (b.resultingRevision ?? 0)).map(clone); }
}
export class InMemoryProductionEventRepository implements ProductionEventRepository {
  private records: ProductionEventRecord[] = [];
  append(record: ProductionEventRecord) { this.records = [...this.records, clone(record)]; return record; }
  list(sessionId: StableId) { return this.records.filter((r) => r.broadcastSessionId === sessionId).map(clone); }
  listFromRevision(sessionId: StableId, revision: number) { return this.records.filter((r) => r.broadcastSessionId === sessionId && r.nextRevision > revision).sort((a, b) => a.nextRevision - b.nextRevision).map(clone); }
}
export class InMemoryCollaborationRepository implements CollaborationRepository {
  private operators = new Map<string, OperatorSessionRecord>(); private events: CollaborationEventRecord[] = []; private checkpoints = new Map<string, SyncCheckpointRecord>();
  upsertOperator(record: OperatorSessionRecord) { this.operators.set(`${record.broadcastSessionId}:${record.id}`, clone(record)); return record; }
  appendEvent(record: CollaborationEventRecord) { this.events = [...this.events, clone(record)]; return record; }
  upsertCheckpoint(record: SyncCheckpointRecord) { this.checkpoints.set(record.id, clone(record)); return record; }
  listOperators(sessionId: StableId) { return [...this.operators.values()].filter((r) => r.broadcastSessionId === sessionId).map(clone); }
  listEvents(sessionId: StableId) { return this.events.filter((r) => r.broadcastSessionId === sessionId).map(clone); }
  listCheckpoints(sessionId: StableId) { return [...this.checkpoints.values()].filter((r) => r.broadcastSessionId === sessionId).map(clone); }
}
export class InMemoryAuthorityRepository implements AuthorityRepository {
  private locks: CollaborationLockRecord[] = []; private decisions: AuthorityDecisionRecord[] = []; private conflicts: CommandConflictRecord[] = [];
  appendLock(record: CollaborationLockRecord) { this.locks = [...this.locks, clone(record)]; return record; }
  appendDecision(record: AuthorityDecisionRecord) { this.decisions = [...this.decisions, clone(record)]; return record; }
  appendConflict(record: CommandConflictRecord) { this.conflicts = [...this.conflicts, clone(record)]; return record; }
  listLocks(sessionId: StableId) { return this.locks.filter((r) => r.sessionId === sessionId).map(clone); }
  listActiveLocks(sessionId: StableId, at = now()) { const t = Date.parse(at); return this.listLocks(sessionId).filter((r) => r.status === 'active' && Date.parse(r.expiresAt) > t); }
  listDecisions(sessionId: StableId) { return this.decisions.filter((r) => r.sessionId === sessionId).map(clone); }
  listConflicts(sessionId: StableId) { return this.conflicts.filter((r) => r.sessionId === sessionId).map(clone); }
}
export function createInMemoryPersistentBroadcastRepositories() {
  return { sessions: new InMemoryBroadcastSessionRepository(), snapshots: new InMemoryProductionGraphSnapshotRepository(), commands: new InMemoryProductionCommandRepository(), events: new InMemoryProductionEventRepository(), collaboration: new InMemoryCollaborationRepository(), authority: new InMemoryAuthorityRepository() };
}

export function replayEventsFromRevision(graph: ProductionGraph, events: ProductionEventRecord[]) {
  return events.reduce((next, event) => ({
    ...next,
    graphVersion: event.nextRevision,
    updatedAt: event.timestamp,
    metadata: { ...next.metadata, revision: event.nextRevision, updatedAt: event.timestamp },
  }), graph);
}
export function replayCommandsFromRevision(commands: ProductionCommandRecord[], revision: number) { return commands.filter((c) => c.accepted && (c.resultingRevision ?? -1) > revision); }
export function rebuildGraphFromSnapshotAndEvents(snapshot: ProductionGraphSnapshotRecord, events: ProductionEventRecord[]) { return replayEventsFromRevision(restoreGraphFromSnapshot(snapshot), events.filter((e) => e.nextRevision > snapshot.graphRevision)); }
export function recoverSessionFromLatestSnapshot(input: { sessionId: StableId; snapshots: ProductionGraphSnapshotRepository; events: ProductionEventRepository }) { const snapshot = input.snapshots.getLatest(input.sessionId); if (!snapshot) return { status: 'snapshot_missing' as const }; const events = input.events.listFromRevision(input.sessionId, snapshot.graphRevision); return { status: 'replayed' as const, graph: rebuildGraphFromSnapshotAndEvents(snapshot, events), snapshot, replayedEvents: events }; }
export function getRecoveryPlan(input: { sessionId: StableId; currentRevision: number; snapshots: ProductionGraphSnapshotRepository; events: ProductionEventRepository; commands: ProductionCommandRepository }) { const snapshot = input.snapshots.getLatest(input.sessionId); const fromRevision = snapshot?.graphRevision ?? 0; const events = input.events.listFromRevision(input.sessionId, fromRevision); const commands = input.commands.listFromRevision(input.sessionId, fromRevision); return { status: snapshot ? 'ready' as const : 'snapshot_missing' as const, fromRevision, targetRevision: input.currentRevision, latestSnapshotRevision: snapshot?.graphRevision, eventCount: events.length, commandCount: commands.length }; }

export function createPersistenceDiagnostics(input: { session?: BroadcastSessionRecord; latestSnapshot?: ProductionGraphSnapshotRecord; commandCount: number; eventCount: number; collaborationEventCount: number; activeLocksCount: number; conflictsCount: number; syncCheckpointCount: number; recoveryStatus: RecoveryStatus }) { return { currentSessionId: input.session?.id, currentGraphRevision: input.session?.currentGraphRevision ?? 0, latestSnapshotRevision: input.latestSnapshot?.graphRevision, commandLogCount: input.commandCount, eventLogCount: input.eventCount, collaborationEventCount: input.collaborationEventCount, activeLocksCount: input.activeLocksCount, conflictsCount: input.conflictsCount, syncCheckpointCount: input.syncCheckpointCount, recoveryStatus: input.recoveryStatus }; }
