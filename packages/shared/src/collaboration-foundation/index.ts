export type CollaborationRole =
  'Admin' | 'Producer' | 'Director' | 'Graphics' | 'Audio' | 'Camera' | 'Viewer';
export type CollaborationResourceType = 'Scene' | 'Source' | 'Graphic' | 'Output' | 'Setting';
export type CollaborationPermission =
  | 'workspace:manage'
  | 'team:manage'
  | 'session:manage'
  | 'state:read'
  | 'state:write'
  | 'lock:acquire'
  | 'lock:override'
  | 'audit:read';
export type CollaborationEventType =
  | 'session.started'
  | 'session.ended'
  | 'presence.updated'
  | 'lock.acquired'
  | 'lock.released'
  | 'lock.denied'
  | 'operation.applied'
  | 'conflict.detected'
  | 'conflict.resolved'
  | 'state.synced';
export type CollaborationOperationType =
  'create' | 'update' | 'delete' | 'reorder' | 'activate' | 'deactivate';

export interface CollaborationUserSession {
  id: string;
  userId: string;
  displayName: string;
  role: CollaborationRole;
  workspaceId: string;
  teamId: string;
  joinedAt: string;
  lastSeenAt: string;
  expiresAt?: string;
  metadata: Record<string, unknown>;
}
export interface OperatorPresence {
  sessionId: string;
  userId: string;
  displayName: string;
  role: CollaborationRole;
  status: 'online' | 'idle' | 'editing' | 'away' | 'disconnected';
  focusedResource?: CollaborationResourceRef;
  cursor?: { panelId: string; x: number; y: number };
  updatedAt: string;
  metadata: Record<string, unknown>;
}
export interface CollaborationResourceRef {
  type: CollaborationResourceType;
  id: string;
  label?: string;
}
export interface ResourceLock {
  id: string;
  resource: CollaborationResourceRef;
  ownerSessionId: string;
  ownerUserId: string;
  mode: 'exclusive' | 'shared';
  acquiredAt: string;
  expiresAt?: string | undefined;
  version: number;
  metadata: Record<string, unknown>;
}
export interface ConflictMetadata {
  id: string;
  resource: CollaborationResourceRef;
  operationId: string;
  conflictingOperationId?: string;
  baseVersion: number;
  currentVersion: number;
  detectedAt: string;
  reason: 'version_mismatch' | 'lock_conflict' | 'permission_denied' | 'stale_session';
  resolution?: {
    strategy: 'reject' | 'accept_latest' | 'override' | 'merge_metadata';
    resolvedBySessionId: string;
    resolvedAt: string;
    notes?: string | undefined;
  };
  metadata: Record<string, unknown>;
}
export interface CollaborationOperation {
  id: string;
  sessionId: string;
  userId: string;
  type: CollaborationOperationType;
  resource: CollaborationResourceRef;
  baseVersion: number;
  patch: Record<string, unknown>;
  timestamp: string;
  metadata: Record<string, unknown>;
}
export interface AuditLogEntry {
  id: string;
  sessionId?: string | undefined;
  userId?: string | undefined;
  action: string;
  resource?: CollaborationResourceRef | undefined;
  timestamp: string;
  operationId?: string | undefined;
  conflictId?: string | undefined;
  metadata: Record<string, unknown>;
}
export interface CollaborationWorkspace {
  id: string;
  name: string;
  teamIds: string[];
  createdAt: string;
  metadata: Record<string, unknown>;
}
export interface CollaborationTeam {
  id: string;
  workspaceId: string;
  name: string;
  members: Array<{ userId: string; role: CollaborationRole }>;
  metadata: Record<string, unknown>;
}
export interface SharedStateSnapshot {
  workspaceId: string;
  revision: number;
  resources: Record<string, { version: number; value: Record<string, unknown>; updatedAt: string }>;
  updatedAt: string;
}
export interface LiveCollaborationEvent<T = Record<string, unknown>> {
  id: string;
  type: CollaborationEventType;
  workspaceId: string;
  sessionId?: string | undefined;
  timestamp: string;
  revision: number;
  payload: T;
}

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const keyOf = (resource: CollaborationResourceRef) => `${resource.type}:${resource.id}`;

export const ROLE_PERMISSIONS: Record<CollaborationRole, CollaborationPermission[]> = {
  Admin: [
    'workspace:manage',
    'team:manage',
    'session:manage',
    'state:read',
    'state:write',
    'lock:acquire',
    'lock:override',
    'audit:read',
  ],
  Producer: ['session:manage', 'state:read', 'state:write', 'lock:acquire', 'audit:read'],
  Director: ['state:read', 'state:write', 'lock:acquire'],
  Graphics: ['state:read', 'state:write', 'lock:acquire'],
  Audio: ['state:read', 'state:write', 'lock:acquire'],
  Camera: ['state:read', 'state:write', 'lock:acquire'],
  Viewer: ['state:read'],
};

export function hasCollaborationPermission(
  role: CollaborationRole,
  permission: CollaborationPermission,
) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class CollaborationManager {
  private sessions = new Map<string, CollaborationUserSession>();
  private presence = new Map<string, OperatorPresence>();
  private locks = new Map<string, ResourceLock>();
  private conflicts = new Map<string, ConflictMetadata>();
  private audit: AuditLogEntry[] = [];
  private events: LiveCollaborationEvent[] = [];
  private operations: CollaborationOperation[] = [];
  private state: SharedStateSnapshot;

  constructor(
    public workspace: CollaborationWorkspace,
    public team: CollaborationTeam,
    initialState: Record<string, { version: number; value: Record<string, unknown> }> = {},
  ) {
    this.state = {
      workspaceId: workspace.id,
      revision: 0,
      resources: Object.fromEntries(
        Object.entries(initialState).map(([k, v]) => [k, { ...v, updatedAt: now() }]),
      ),
      updatedAt: now(),
    };
  }

  startSession(
    input: Omit<CollaborationUserSession, 'joinedAt' | 'lastSeenAt' | 'metadata'> & {
      metadata?: Record<string, unknown>;
    },
  ) {
    const timestamp = now();
    const session: CollaborationUserSession = {
      ...input,
      joinedAt: timestamp,
      lastSeenAt: timestamp,
      metadata: input.metadata ?? {},
    };
    this.sessions.set(session.id, session);
    this.updatePresence(session.id, { status: 'online' });
    this.record('session.started', session.id, { role: session.role });
    return session;
  }

  endSession(sessionId: string) {
    const session = this.requireSession(sessionId);
    for (const lock of this.listLocks().filter(
      (candidate) => candidate.ownerSessionId === sessionId,
    ))
      this.releaseLock(sessionId, lock.resource);
    this.presence.set(sessionId, {
      ...this.presence.get(sessionId)!,
      status: 'disconnected',
      updatedAt: now(),
    });
    this.sessions.delete(sessionId);
    this.record('session.ended', sessionId, { userId: session.userId });
  }

  updatePresence(
    sessionId: string,
    patch: Partial<
      Omit<OperatorPresence, 'sessionId' | 'userId' | 'displayName' | 'role' | 'updatedAt'>
    >,
  ) {
    const session = this.requireSession(sessionId);
    const presence: OperatorPresence = {
      sessionId,
      userId: session.userId,
      displayName: session.displayName,
      role: session.role,
      status: 'online',
      metadata: {},
      ...this.presence.get(sessionId),
      ...patch,
      updatedAt: now(),
    };
    this.presence.set(sessionId, presence);
    this.record('presence.updated', sessionId, {
      status: presence.status,
      focusedResource: presence.focusedResource,
    });
    return presence;
  }

  acquireLock(
    sessionId: string,
    resource: CollaborationResourceRef,
    mode: ResourceLock['mode'] = 'exclusive',
    ttlMs?: number,
  ) {
    const session = this.requireSession(sessionId);
    this.assertPermission(session, 'lock:acquire');
    const resourceKey = keyOf(resource);
    const existing = this.locks.get(resourceKey);
    if (
      existing &&
      existing.ownerSessionId !== sessionId &&
      (existing.mode === 'exclusive' || mode === 'exclusive')
    ) {
      this.createConflict(session, resource, 'lock_conflict', existing.version, existing.version, {
        ownerSessionId: existing.ownerSessionId,
      });
      this.record('lock.denied', sessionId, { resource, ownerSessionId: existing.ownerSessionId });
      return { acquired: false as const, lock: existing };
    }
    const version = this.state.resources[resourceKey]?.version ?? 0;
    const lock: ResourceLock = {
      id: id('lock'),
      resource,
      ownerSessionId: sessionId,
      ownerUserId: session.userId,
      mode,
      acquiredAt: now(),
      expiresAt: ttlMs ? new Date(Date.now() + ttlMs).toISOString() : undefined,
      version,
      metadata: {},
    };
    this.locks.set(resourceKey, lock);
    this.record('lock.acquired', sessionId, { resource, mode });
    return { acquired: true as const, lock };
  }

  releaseLock(sessionId: string, resource: CollaborationResourceRef) {
    const resourceKey = keyOf(resource);
    const lock = this.locks.get(resourceKey);
    if (!lock || lock.ownerSessionId !== sessionId) return false;
    this.locks.delete(resourceKey);
    this.record('lock.released', sessionId, { resource });
    return true;
  }

  applyOperation(
    operation: Omit<CollaborationOperation, 'timestamp' | 'metadata'> & {
      metadata?: Record<string, unknown>;
    },
  ) {
    const session = this.requireSession(operation.sessionId);
    this.assertPermission(session, 'state:write');
    const resourceKey = keyOf(operation.resource);
    const current = this.state.resources[resourceKey];
    const currentVersion = current?.version ?? 0;
    const lock = this.locks.get(resourceKey);
    if (lock && lock.ownerSessionId !== operation.sessionId)
      return this.rejectOperation(operation, 'lock_conflict', currentVersion, { lock });
    if (operation.baseVersion !== currentVersion)
      return this.rejectOperation(operation, 'version_mismatch', currentVersion);
    const nextVersion = currentVersion + 1;
    const entry = {
      version: nextVersion,
      value: { ...(current?.value ?? {}), ...operation.patch },
      updatedAt: now(),
    };
    this.state = {
      ...this.state,
      revision: this.state.revision + 1,
      resources: { ...this.state.resources, [resourceKey]: entry },
      updatedAt: now(),
    };
    const accepted = { ...operation, timestamp: now(), metadata: operation.metadata ?? {} };
    this.operations.push(accepted);
    this.appendAudit(operation.sessionId, 'operation.applied', operation.resource, {
      operationId: operation.id,
      nextVersion,
    });
    this.record('operation.applied', operation.sessionId, {
      operationId: operation.id,
      resource: operation.resource,
      nextVersion,
    });
    return { accepted: true as const, operation: accepted, snapshot: this.getSnapshot() };
  }

  resolveConflict(
    conflictId: string,
    sessionId: string,
    strategy: NonNullable<ConflictMetadata['resolution']>['strategy'],
    notes?: string,
  ) {
    const session = this.requireSession(sessionId);
    this.assertPermission(session, strategy === 'override' ? 'lock:override' : 'state:write');
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) throw new Error(`Unknown conflict ${conflictId}`);
    const resolved = {
      ...conflict,
      resolution: { strategy, resolvedBySessionId: sessionId, resolvedAt: now(), notes },
    };
    this.conflicts.set(conflictId, resolved);
    this.appendAudit(sessionId, 'conflict.resolved', conflict.resource, { conflictId, strategy });
    this.record('conflict.resolved', sessionId, { conflictId, strategy });
    return resolved;
  }

  syncState(sessionId: string) {
    this.assertPermission(this.requireSession(sessionId), 'state:read');
    this.record('state.synced', sessionId, { revision: this.state.revision });
    return this.getSnapshot();
  }
  listPresence() {
    return [...this.presence.values()];
  }
  listLocks() {
    return [...this.locks.values()];
  }
  listConflicts() {
    return [...this.conflicts.values()];
  }
  listAuditLog() {
    return [...this.audit];
  }
  listOperationHistory() {
    return [...this.operations];
  }
  listEvents() {
    return [...this.events];
  }
  getSnapshot() {
    return structuredClone(this.state) as SharedStateSnapshot;
  }

  private rejectOperation(
    operation: Omit<CollaborationOperation, 'timestamp' | 'metadata'> & {
      metadata?: Record<string, unknown>;
    },
    reason: ConflictMetadata['reason'],
    currentVersion: number,
    metadata: Record<string, unknown> = {},
  ) {
    const session = this.requireSession(operation.sessionId);
    const conflict = this.createConflict(
      session,
      operation.resource,
      reason,
      operation.baseVersion,
      currentVersion,
      { operationId: operation.id, ...metadata },
    );
    return { accepted: false as const, conflict, snapshot: this.getSnapshot() };
  }
  private createConflict(
    session: CollaborationUserSession,
    resource: CollaborationResourceRef,
    reason: ConflictMetadata['reason'],
    baseVersion: number,
    currentVersion: number,
    metadata: Record<string, unknown>,
  ) {
    const conflict: ConflictMetadata = {
      id: id('conflict'),
      resource,
      operationId: String(metadata.operationId ?? id('operation')),
      baseVersion,
      currentVersion,
      detectedAt: now(),
      reason,
      metadata,
    };
    this.conflicts.set(conflict.id, conflict);
    this.appendAudit(session.id, 'conflict.detected', resource, {
      conflictId: conflict.id,
      reason,
    });
    this.record('conflict.detected', session.id, { conflictId: conflict.id, reason, resource });
    return conflict;
  }
  private assertPermission(session: CollaborationUserSession, permission: CollaborationPermission) {
    if (!hasCollaborationPermission(session.role, permission))
      throw new Error(`${session.role} lacks ${permission}`);
  }
  private requireSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Unknown or ended session ${sessionId}`);
    return session;
  }
  private appendAudit(
    sessionId: string | undefined,
    action: string,
    resource: CollaborationResourceRef | undefined,
    metadata: Record<string, unknown>,
  ) {
    const session = sessionId ? this.sessions.get(sessionId) : undefined;
    this.audit.push({
      id: id('audit'),
      sessionId,
      userId: session?.userId,
      action,
      resource,
      timestamp: now(),
      operationId: metadata.operationId as string | undefined,
      conflictId: metadata.conflictId as string | undefined,
      metadata,
    });
  }
  private record(
    type: CollaborationEventType,
    sessionId: string | undefined,
    payload: Record<string, unknown>,
  ) {
    const event: LiveCollaborationEvent = {
      id: id('event'),
      type,
      workspaceId: this.workspace.id,
      sessionId,
      timestamp: now(),
      revision: this.state.revision,
      payload,
    };
    this.events.push(event);
    this.appendAudit(
      sessionId,
      type,
      payload.resource as CollaborationResourceRef | undefined,
      payload,
    );
    return event;
  }
}

export function createCollaborationDemo() {
  const workspace: CollaborationWorkspace = {
    id: 'workspace-demo',
    name: 'UBOS Live Show',
    teamIds: ['team-control-room'],
    createdAt: now(),
    metadata: { phase: '2.22' },
  };
  const team: CollaborationTeam = {
    id: 'team-control-room',
    workspaceId: workspace.id,
    name: 'Control Room',
    members: [
      { userId: 'ava', role: 'Admin' },
      { userId: 'rio', role: 'Director' },
      { userId: 'mika', role: 'Graphics' },
      { userId: 'sam', role: 'Viewer' },
    ],
    metadata: {},
  };
  const manager = new CollaborationManager(workspace, team, {
    'Scene:scene-a': { version: 1, value: { name: 'Opening', active: false } },
  });
  const admin = manager.startSession({
    id: 'session-admin',
    userId: 'ava',
    displayName: 'Ava Admin',
    role: 'Admin',
    workspaceId: workspace.id,
    teamId: team.id,
  });
  const director = manager.startSession({
    id: 'session-director',
    userId: 'rio',
    displayName: 'Rio Director',
    role: 'Director',
    workspaceId: workspace.id,
    teamId: team.id,
  });
  manager.acquireLock(director.id, { type: 'Scene', id: 'scene-a', label: 'Opening' });
  manager.applyOperation({
    id: 'op-activate-opening',
    sessionId: director.id,
    userId: director.userId,
    type: 'activate',
    resource: { type: 'Scene', id: 'scene-a', label: 'Opening' },
    baseVersion: 1,
    patch: { active: true },
  });
  manager.applyOperation({
    id: 'op-stale-graphics',
    sessionId: admin.id,
    userId: admin.userId,
    type: 'update',
    resource: { type: 'Scene', id: 'scene-a', label: 'Opening' },
    baseVersion: 1,
    patch: { lowerThird: 'Host' },
  });
  return manager;
}
