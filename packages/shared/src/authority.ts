import {
  canExecuteProductionCommand,
  getProductionGraphRevision,
  isGraphRevisionCurrent,
  validateProductionCommand,
  type OperatorRole,
  type ProductionCommand,
  type ProductionCommandType,
  type ProductionGraph,
  type StableId,
} from './production-graph.js';

export type AuthorityScope = 'broadcast' | 'program' | 'preview' | 'scenes' | 'scene' | 'sources' | 'guests' | 'audio' | 'graphics' | 'outputs' | 'recording' | 'workspace' | 'health' | 'automation' | 'ai';
export type AuthorityOwner = { operatorId: StableId; role: OperatorRole; displayName?: string };
export type AuthorityState = 'unowned' | 'owned' | 'locked' | 'expired';
export type AuthorityDecisionReason = 'ALLOWED' | 'INVALID_COMMAND' | 'PERMISSION_DENIED' | 'REVISION_MISMATCH' | 'AUTHORITY_DENIED' | 'LOCKED_SCOPE' | 'SESSION_ENDED' | 'UNKNOWN';
export type ConflictType = 'REVISION_MISMATCH' | 'PERMISSION_DENIED' | 'AUTHORITY_DENIED' | 'LOCKED_SCOPE' | 'STALE_OPERATOR' | 'DUPLICATE_COMMAND' | 'INVALID_COMMAND' | 'SESSION_ENDED' | 'UNKNOWN';
export type ConflictStatus = 'open' | 'resolved';
export type ConflictResolution = 'accepted_override' | 'retried' | 'discarded' | 'expired' | 'manual';
export type LockScope = AuthorityScope;
export type LockOwner = AuthorityOwner;
export type LockStatus = 'active' | 'released' | 'expired';
export interface LockLease { acquiredAt: string; expiresAt: string; heartbeatAt: string; ttlMs: number }
export interface AuthorityNode { scope: AuthorityScope; owner?: AuthorityOwner; state: AuthorityState; lockedBy?: StableId; metadata: Record<string, unknown> }
export interface CollaborationLock { id: StableId; sessionId: StableId; scope: LockScope; ownerOperatorId: StableId; ownerRole: OperatorRole; acquiredAt: string; expiresAt: string; heartbeatAt: string; status: LockStatus; metadata: Record<string, unknown> }
export interface CommandConflict { id: StableId; sessionId: StableId; commandId: StableId; actorId: StableId; actorRole: OperatorRole; commandType: ProductionCommandType; scope: AuthorityScope; type: ConflictType; status: ConflictStatus; message: string; createdAt: string; resolvedAt?: string; resolution?: ConflictResolution; metadata: Record<string, unknown> }
export interface AuthorityDecision { id: StableId; sessionId: StableId; commandId: StableId; actorId: StableId; actorRole: OperatorRole; commandType: ProductionCommandType; scope: AuthorityScope; allowed: boolean; reason: AuthorityDecisionReason; message: string; createdAt: string; conflictId?: StableId; metadata: Record<string, unknown> }
export interface SessionAuthority { sessionId: StableId; scopes: Record<AuthorityScope, AuthorityNode>; updatedAt: string }

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
export const authorityScopes: AuthorityScope[] = ['broadcast','program','preview','scenes','scene','sources','guests','audio','graphics','outputs','recording','workspace','health','automation','ai'];
export const overrideRoles: OperatorRole[] = ['OWNER', 'ADMIN'];

export const authorityScopesByRole: Record<OperatorRole, AuthorityScope[]> = {
  OWNER: authorityScopes, ADMIN: authorityScopes.filter((s) => s !== 'ai'),
  DIRECTOR: ['broadcast','program','preview','scenes','scene','sources','outputs','recording','workspace','health','automation'],
  PRODUCER: ['scenes','scene','guests','workspace','graphics','sources','automation'],
  TECHNICAL_DIRECTOR: ['program','preview','scenes','scene','sources','outputs','health'],
  AUDIO_ENGINEER: ['audio'], GRAPHICS_OPERATOR: ['graphics','sources','workspace'], GUEST_MANAGER: ['guests'], MODERATOR: ['guests','workspace'], VIEWER: [], AI_AGENT: ['ai'],
};

export function getAuthorityScopeForCommand(type: ProductionCommandType): AuthorityScope {
  if (['START_BROADCAST','STOP_BROADCAST'].includes(type)) return 'broadcast';
  if (['SET_PREVIEW_SCENE'].includes(type)) return 'preview';
  if (['CUT_TO_PROGRAM','TAKE_PREVIEW','AUTO_TRANSITION','SET_TRANSITION','SET_TRANSITION_DURATION'].includes(type)) return 'program';
  if (['CREATE_SCENE','UPDATE_SCENE','DELETE_SCENE','ASSIGN_SOURCE_TO_SCENE'].includes(type)) return 'scenes';
  if (['ADD_SOURCE','REMOVE_SOURCE','UPDATE_SOURCE'].includes(type)) return 'sources';
  if (type.includes('GUEST') || type === 'PIN_GUEST') return 'guests';
  if (type.includes('AUDIO')) return 'audio';
  if (type.includes('DESTINATION')) return 'outputs';
  if (type.includes('RECORDING')) return 'recording';
  if (type.includes('HEALTH')) return 'health';
  if (type.includes('WORKSPACE') || type === 'SET_PANEL_VISIBILITY') return 'workspace';
  if (type.includes('AGENT_SUGGESTION')) return 'ai';
  return 'broadcast';
}
export function canOverrideLock(role: OperatorRole) { return overrideRoles.includes(role); }
export function roleHasAuthority(role: OperatorRole, scope: AuthorityScope) { return authorityScopesByRole[role].includes(scope) || canOverrideLock(role); }
export function createSessionAuthority(sessionId: StableId, timestamp = now()): SessionAuthority { return { sessionId, updatedAt: timestamp, scopes: Object.fromEntries(authorityScopes.map((scope) => [scope, { scope, state: 'unowned', metadata: {} }])) as Record<AuthorityScope, AuthorityNode> }; }
export function isScopeLocked(locks: CollaborationLock[], scope: LockScope, at = now()) { return Boolean(getLockForScope(locks, scope, at)); }
export function getLockForScope(locks: CollaborationLock[], scope: LockScope, at = now()) { const t = Date.parse(at); return locks.find((l) => l.scope === scope && l.status === 'active' && Date.parse(l.expiresAt) > t); }
export function acquireLock(locks: CollaborationLock[], input: { sessionId: StableId; scope: LockScope; ownerOperatorId: StableId; ownerRole: OperatorRole; ttlMs?: number; at?: string; metadata?: Record<string, unknown> }) { const at = input.at ?? now(); const existing = getLockForScope(locks, input.scope, at); if (existing && existing.ownerOperatorId !== input.ownerOperatorId && !canOverrideLock(input.ownerRole)) return { accepted: false as const, locks, lock: existing }; const lock: CollaborationLock = { id: id('lock'), sessionId: input.sessionId, scope: input.scope, ownerOperatorId: input.ownerOperatorId, ownerRole: input.ownerRole, acquiredAt: at, heartbeatAt: at, expiresAt: new Date(Date.parse(at) + (input.ttlMs ?? 30000)).toISOString(), status: 'active', metadata: input.metadata ?? {} }; return { accepted: true as const, locks: [...locks.filter((l) => l.scope !== input.scope || l.status !== 'active'), lock], lock }; }
export function releaseLock(locks: CollaborationLock[], lockId: StableId, operatorId: StableId, role: OperatorRole, at = now()) { return locks.map((l) => l.id === lockId && (l.ownerOperatorId === operatorId || canOverrideLock(role)) ? { ...l, status: 'released' as const, metadata: { ...l.metadata, releasedAt: at, releasedBy: operatorId } } : l); }
export function renewLock(locks: CollaborationLock[], lockId: StableId, operatorId: StableId, ttlMs = 30000, at = now()) { return locks.map((l) => l.id === lockId && l.ownerOperatorId === operatorId && l.status === 'active' ? { ...l, heartbeatAt: at, expiresAt: new Date(Date.parse(at) + ttlMs).toISOString() } : l); }
export function expireLocks(locks: CollaborationLock[], at = now()) { const t = Date.parse(at); return locks.map((l) => l.status === 'active' && Date.parse(l.expiresAt) <= t ? { ...l, status: 'expired' as const, metadata: { ...l.metadata, expiredAt: at } } : l); }
export function createCommandConflict(input: Omit<CommandConflict, 'id'|'status'|'createdAt'|'metadata'> & { createdAt?: string; metadata?: Record<string, unknown> }): CommandConflict { return { ...input, id: id('conflict'), status: 'open', createdAt: input.createdAt ?? now(), metadata: input.metadata ?? {} }; }
export function createAuthorityDecision(input: Omit<AuthorityDecision, 'id'|'createdAt'|'metadata'> & { createdAt?: string; metadata?: Record<string, unknown> }): AuthorityDecision { return { ...input, id: id('authority-decision'), createdAt: input.createdAt ?? now(), metadata: input.metadata ?? {} }; }

export function evaluateCommandAuthority(command: ProductionCommand, authority: SessionAuthority, locks: CollaborationLock[], graph: ProductionGraph, at = now()) {
  const shape = validateProductionCommand(command); const scope = getAuthorityScopeForCommand(command.type);
  const reject = (reason: AuthorityDecisionReason, message: string, type: ConflictType) => { const conflict = createCommandConflict({ sessionId: authority.sessionId, commandId: command.id, actorId: command.actorId, actorRole: command.actorRole, commandType: command.type, scope, type, message, createdAt: at, metadata: { expectedRevision: command.expectedRevision, currentRevision: getProductionGraphRevision(graph) } }); return { decision: createAuthorityDecision({ sessionId: authority.sessionId, commandId: command.id, actorId: command.actorId, actorRole: command.actorRole, commandType: command.type, scope, allowed: false, reason, message, conflictId: conflict.id, createdAt: at }), conflict }; };
  if (!shape.valid) return reject('INVALID_COMMAND', shape.errors.join('; '), 'INVALID_COMMAND');
  if (!canExecuteProductionCommand(command.actorRole, command.type)) return reject('PERMISSION_DENIED', `${command.actorRole} cannot execute ${command.type}`, 'PERMISSION_DENIED');
  if (!isGraphRevisionCurrent(graph, command.expectedRevision)) return reject('REVISION_MISMATCH', `Expected revision ${command.expectedRevision}, current ${getProductionGraphRevision(graph)}`, 'REVISION_MISMATCH');
  if (!roleHasAuthority(command.actorRole, scope)) return reject('AUTHORITY_DENIED', `${command.actorRole} has no authority over ${scope}`, 'AUTHORITY_DENIED');
  const owner = authority.scopes[scope]?.owner; if (owner && owner.operatorId !== command.actorId && !canOverrideLock(command.actorRole)) return reject('AUTHORITY_DENIED', `${scope} is owned by ${owner.operatorId}`, 'AUTHORITY_DENIED');
  const lock = getLockForScope(locks, scope, at); if (lock && lock.ownerOperatorId !== command.actorId && !canOverrideLock(command.actorRole)) return reject('LOCKED_SCOPE', `${scope} is locked by ${lock.ownerOperatorId}`, 'LOCKED_SCOPE');
  return { decision: createAuthorityDecision({ sessionId: authority.sessionId, commandId: command.id, actorId: command.actorId, actorRole: command.actorRole, commandType: command.type, scope, allowed: true, reason: 'ALLOWED', message: 'Command accepted by authority arbitration.', createdAt: at }) };
}
export function arbitrateProductionCommand(input: { command: ProductionCommand; authority: SessionAuthority; locks: CollaborationLock[]; graph: ProductionGraph; at?: string }) { return evaluateCommandAuthority(input.command, input.authority, input.locks, input.graph, input.at); }

export class InMemoryAuthorityStore {
  private authority: SessionAuthority; private locks: CollaborationLock[] = []; private conflicts: CommandConflict[] = []; private decisions: AuthorityDecision[] = [];
  constructor(sessionId: StableId, authority = createSessionAuthority(sessionId)) { this.authority = authority; }
  getAuthorityState() { return this.authority; }
  setScopeOwner(scope: AuthorityScope, owner?: AuthorityOwner) { this.authority = { ...this.authority, updatedAt: now(), scopes: { ...this.authority.scopes, [scope]: { ...this.authority.scopes[scope], owner, state: owner ? 'owned' : 'unowned' } } }; }
  getScopeOwner(scope: AuthorityScope) { return this.authority.scopes[scope]?.owner; }
  listLocks() { return [...this.locks]; } listActiveLocks(at = now()) { this.locks = expireLocks(this.locks, at); return this.locks.filter((l) => l.status === 'active'); }
  appendLock(lock: CollaborationLock) { this.locks = [...this.locks, lock]; return lock; } replaceLocks(locks: CollaborationLock[]) { this.locks = locks; }
  listConflicts() { return [...this.conflicts]; } appendConflict(conflict: CommandConflict) { this.conflicts = [...this.conflicts, conflict]; return conflict; }
  resolveConflict(conflictId: StableId, resolution: ConflictResolution, at = now()) { this.conflicts = this.conflicts.map((c) => c.id === conflictId ? { ...c, status: 'resolved', resolvedAt: at, resolution } : c); return this.conflicts.find((c) => c.id === conflictId); }
  appendDecision(decision: AuthorityDecision) { this.decisions = [...this.decisions.slice(-49), decision]; return decision; } listRecentDecisions(limit = 20) { return this.decisions.slice(-limit); }
  arbitrate(command: ProductionCommand, graph: ProductionGraph, at = now()) { const result = arbitrateProductionCommand({ command, authority: this.authority, locks: this.listActiveLocks(at), graph, at }); this.appendDecision(result.decision); if ('conflict' in result) this.appendConflict(result.conflict); return result; }
}

export function createMockAuthorityScenario(sessionId: StableId, at = now()) {
  const store = new InMemoryAuthorityStore(sessionId); store.setScopeOwner('program', { operatorId: 'director', role: 'DIRECTOR', displayName: 'Director' }); store.setScopeOwner('preview', { operatorId: 'director', role: 'DIRECTOR', displayName: 'Director' }); store.setScopeOwner('audio', { operatorId: 'audio', role: 'AUDIO_ENGINEER', displayName: 'Audio Engineer' }); store.setScopeOwner('graphics', { operatorId: 'graphics', role: 'GRAPHICS_OPERATOR', displayName: 'Graphics Operator' }); store.setScopeOwner('guests', { operatorId: 'guest-manager', role: 'GUEST_MANAGER', displayName: 'Guest Manager' }); store.setScopeOwner('scenes', { operatorId: 'producer', role: 'PRODUCER', displayName: 'Producer' }); store.setScopeOwner('workspace', { operatorId: 'producer', role: 'PRODUCER', displayName: 'Producer' });
  store.replaceLocks([
    { id: 'mock-lock-active', sessionId, scope: 'program', ownerOperatorId: 'director', ownerRole: 'DIRECTOR', acquiredAt: at, heartbeatAt: at, expiresAt: new Date(Date.parse(at) + 45000).toISOString(), status: 'active', metadata: { label: 'Program switch lease' } },
    { id: 'mock-lock-expired', sessionId, scope: 'graphics', ownerOperatorId: 'graphics', ownerRole: 'GRAPHICS_OPERATOR', acquiredAt: new Date(Date.parse(at) - 90000).toISOString(), heartbeatAt: new Date(Date.parse(at) - 90000).toISOString(), expiresAt: new Date(Date.parse(at) - 30000).toISOString(), status: 'expired', metadata: { label: 'Expired lower-third edit' } },
  ]);
  store.appendConflict(createCommandConflict({ sessionId, commandId: 'mock-revision-conflict', actorId: 'producer', actorRole: 'PRODUCER', commandType: 'UPDATE_SCENE', scope: 'scenes', type: 'REVISION_MISMATCH', message: 'Producer submitted an edit against an older graph revision.' }));
  store.appendConflict(createCommandConflict({ sessionId, commandId: 'mock-authority-denied', actorId: 'viewer', actorRole: 'VIEWER', commandType: 'SET_PREVIEW_SCENE', scope: 'preview', type: 'AUTHORITY_DENIED', message: 'Viewer attempted to control preview.' }));
  store.appendDecision(createAuthorityDecision({ sessionId, commandId: 'mock-authority-denied', actorId: 'viewer', actorRole: 'VIEWER', commandType: 'SET_PREVIEW_SCENE', scope: 'preview', allowed: false, reason: 'AUTHORITY_DENIED', message: 'Viewer attempted to control preview.' }));
  return store;
}
