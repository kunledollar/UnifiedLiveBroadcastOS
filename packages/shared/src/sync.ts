import type {
  LocalProductionCommandDispatcher,
  ProductionCommand,
  ProductionEvent,
  ProductionGraphTransition,
  StableId,
} from './production-graph.js';

const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export type SyncTransportState = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';
export type SyncPeerState = 'connected' | 'reconnecting' | 'disconnected' | 'stale';
export type SyncRecoveryState = 'synced' | 'behind' | 'catching_up' | 'resync_required';
export type SyncMessageType =
  | 'CLIENT_JOIN' | 'CLIENT_LEAVE' | 'CLIENT_HEARTBEAT'
  | 'SESSION_STATE_REQUEST' | 'SESSION_STATE_RESPONSE'
  | 'GRAPH_REVISION_REQUEST' | 'GRAPH_REVISION_RESPONSE'
  | 'COMMAND_SUBMIT' | 'COMMAND_ACCEPTED' | 'COMMAND_REJECTED'
  | 'EVENTS_BATCH' | 'REVISION_ACK' | 'CLIENT_BEHIND' | 'CLIENT_RESYNC_REQUIRED'
  | 'PRESENCE_UPDATE' | 'ACTIVITY_UPDATE'
  | 'LOCK_REQUEST' | 'LOCK_GRANTED' | 'LOCK_DENIED' | 'LOCK_RELEASED'
  | 'AUTHORITY_GRANTED' | 'AUTHORITY_REVOKED'
  | 'LOCK_ACQUIRED' | 'LOCK_EXPIRED' | 'LOCK_RENEWED'
  | 'COMMAND_CONFLICT_CREATED' | 'COMMAND_CONFLICT_RESOLVED'
  | 'COMMAND_ARBITRATED' | 'AUTHORITY_DECISION_CREATED'
  | 'SYNC_ERROR';

export interface SyncClient {
  clientId: StableId;
  operatorId: StableId;
  displayName: string;
  connectionState: SyncPeerState;
  observedGraphRevision: number;
  revisionLag: number;
  lastHeartbeatAt?: string;
  lastMessageAt?: string;
  lastSyncMessage?: SyncMessageType | undefined;
  recoveryState: SyncRecoveryState;
  metadata: Record<string, unknown>;
}
export type SyncPeer = SyncClient;
export interface SyncSession {
  id: StableId;
  broadcastSessionId: StableId;
  productionGraphId: StableId;
  currentGraphRevision: number;
  clients: Record<StableId, SyncClient>;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}
export interface SyncEnvelope<TType extends SyncMessageType = SyncMessageType, TPayload = unknown> {
  id: StableId;
  type: TType;
  sessionId: StableId;
  broadcastSessionId: StableId;
  clientId: StableId;
  operatorId: StableId;
  timestamp: string;
  graphRevision: number;
  correlationId?: StableId;
  payload: TPayload;
  metadata?: Record<string, unknown>;
}
export type SyncMessage<TPayload = unknown> = SyncEnvelope<SyncMessageType, TPayload>;
export interface SyncAck { clientId: StableId; operatorId: StableId; graphRevision: number; acknowledgedAt: string; }
export interface SyncError { code: 'INVALID_ENVELOPE' | 'REVISION_MISMATCH' | 'COMMAND_REJECTED' | 'CLIENT_NOT_FOUND' | 'RESYNC_REQUIRED' | 'INVALID_COMMAND' | 'PERMISSION_DENIED' | 'VALIDATION_ERROR'; message: string; details?: Record<string, unknown>; }
export interface SyncHeartbeat { clientId: StableId; operatorId: StableId; sentAt: string; observedGraphRevision: number; }
export interface SyncDiagnostics { sessionId: StableId; connectedClients: number; currentGraphRevision: number; acceptedCommands: number; rejectedCommands: number; catchUpRequiredCount: number; clients: SyncClient[]; lastSyncMessage?: SyncMessageType | undefined; }

export const createSyncEnvelope = <TType extends SyncMessageType, TPayload>(input: Omit<SyncEnvelope<TType, TPayload>, 'id' | 'timestamp'> & { id?: StableId; timestamp?: string }): SyncEnvelope<TType, TPayload> => ({ id: input.id ?? id(`sync:${input.type}`), timestamp: input.timestamp ?? now(), ...input });
export const createRevisionAck = (client: Pick<SyncClient, 'clientId' | 'operatorId' | 'observedGraphRevision'>, graphRevision = client.observedGraphRevision): SyncAck => ({ clientId: client.clientId, operatorId: client.operatorId, graphRevision, acknowledgedAt: now() });
export const getClientRevisionLag = (client: Pick<SyncClient, 'observedGraphRevision'>, session: Pick<SyncSession, 'currentGraphRevision'>) => Math.max(0, session.currentGraphRevision - client.observedGraphRevision);
export const isClientSynced = (client: Pick<SyncClient, 'observedGraphRevision'>, session: Pick<SyncSession, 'currentGraphRevision'>) => client.observedGraphRevision === session.currentGraphRevision;
export const markClientSynced = (client: SyncClient, session: Pick<SyncSession, 'currentGraphRevision'>): SyncClient => ({ ...client, observedGraphRevision: session.currentGraphRevision, revisionLag: 0, recoveryState: 'synced' });
export const applyRevisionAck = (session: SyncSession, ack: SyncAck): SyncSession => {
  const client = session.clients[ack.clientId];
  if (!client) return session;
  const nextClient = { ...client, observedGraphRevision: ack.graphRevision, revisionLag: Math.max(0, session.currentGraphRevision - ack.graphRevision), recoveryState: ack.graphRevision === session.currentGraphRevision ? 'synced' : 'behind' } satisfies SyncClient;
  return { ...session, clients: { ...session.clients, [ack.clientId]: nextClient }, updatedAt: ack.acknowledgedAt };
};
export const getClientsBehindRevision = (session: SyncSession) => Object.values(session.clients).filter((client) => client.observedGraphRevision < session.currentGraphRevision);
export const updateClientHeartbeat = (client: SyncClient, heartbeat: SyncHeartbeat, currentRevision: number): SyncClient => ({ ...client, lastHeartbeatAt: heartbeat.sentAt, lastMessageAt: heartbeat.sentAt, observedGraphRevision: heartbeat.observedGraphRevision, revisionLag: Math.max(0, currentRevision - heartbeat.observedGraphRevision), connectionState: 'connected', recoveryState: heartbeat.observedGraphRevision === currentRevision ? 'synced' : 'behind', lastSyncMessage: 'CLIENT_HEARTBEAT' });
export const isClientStale = (client: SyncClient, staleAfterMs = 30_000, at = Date.now()) => !client.lastHeartbeatAt || at - Date.parse(client.lastHeartbeatAt) > staleAfterMs;
export const getStaleClients = (session: SyncSession, staleAfterMs = 30_000, at = Date.now()) => Object.values(session.clients).filter((client) => isClientStale(client, staleAfterMs, at));

export const getMissingRevisionRange = (observedRevision: number, currentRevision: number) => observedRevision >= currentRevision ? undefined : ({ fromRevision: observedRevision + 1, toRevision: currentRevision });
export const createCatchUpRequest = (base: Omit<SyncEnvelope<'GRAPH_REVISION_REQUEST', { observedGraphRevision: number }>, 'id' | 'timestamp' | 'type' | 'payload'>, observedGraphRevision: number) => createSyncEnvelope({ ...base, type: 'GRAPH_REVISION_REQUEST', payload: { observedGraphRevision } });
export const createCatchUpResponse = (base: Omit<SyncEnvelope<'EVENTS_BATCH', { fromRevision: number; toRevision: number; events: ProductionEvent[] }>, 'id' | 'timestamp' | 'type' | 'payload'>, events: ProductionEvent[], fromRevision: number, toRevision: number) => createSyncEnvelope({ ...base, type: 'EVENTS_BATCH', payload: { fromRevision, toRevision, events } });
export const createResyncRequiredMessage = (base: Omit<SyncEnvelope<'CLIENT_RESYNC_REQUIRED', { reason: string; observedGraphRevision: number; currentGraphRevision: number }>, 'id' | 'timestamp' | 'type' | 'payload'>, observedGraphRevision: number, currentGraphRevision: number, reason = 'Event history is insufficient for incremental catch-up.') => createSyncEnvelope({ ...base, type: 'CLIENT_RESYNC_REQUIRED', payload: { reason, observedGraphRevision, currentGraphRevision } });

export interface SyncTransport { connect(): void; disconnect(): void; send(message: SyncMessage): void; subscribe(handler: (message: SyncMessage) => void): () => void; getState(): SyncTransportState; }
export class LocalSyncTransport implements SyncTransport {
  private state: SyncTransportState = 'idle'; private handlers = new Set<(message: SyncMessage) => void>(); public sentMessages: SyncMessage[] = [];
  connect() { this.state = 'connected'; }
  disconnect() { this.state = 'disconnected'; }
  send(message: SyncMessage) { if (this.state !== 'connected') this.connect(); this.sentMessages.push(message); this.handlers.forEach((handler) => handler(message)); }
  subscribe(handler: (message: SyncMessage) => void) { this.handlers.add(handler); return () => this.handlers.delete(handler); }
  getState() { return this.state; }
}

export class SyncCoordinator {
  private acceptedCommands = 0; private rejectedCommands = 0; private catchUpRequiredCount = 0; private lastSyncMessage?: SyncMessageType | undefined;
  constructor(private session: SyncSession, private dispatcher: LocalProductionCommandDispatcher, private transport: SyncTransport = new LocalSyncTransport(), private eventHistory: ProductionEvent[] = dispatcher.getSession().eventLog) { this.transport.connect(); }
  joinClient(client: Omit<SyncClient, 'revisionLag' | 'recoveryState' | 'connectionState'> & Partial<Pick<SyncClient, 'connectionState' | 'recoveryState'>>) { const next = { ...client, connectionState: client.connectionState ?? 'connected', revisionLag: Math.max(0, this.session.currentGraphRevision - client.observedGraphRevision), recoveryState: client.observedGraphRevision === this.session.currentGraphRevision ? 'synced' : 'behind' } satisfies SyncClient; this.session = { ...this.session, clients: { ...this.session.clients, [next.clientId]: next }, updatedAt: now() }; this.lastSyncMessage = 'CLIENT_JOIN'; return next; }
  leaveClient(clientId: StableId) { const { [clientId]: _left, ...clients } = this.session.clients; this.session = { ...this.session, clients, updatedAt: now() }; this.lastSyncMessage = 'CLIENT_LEAVE'; }
  acknowledgeRevision(clientId: StableId, graphRevision = this.session.currentGraphRevision) { this.session = applyRevisionAck(this.session, { clientId, operatorId: this.session.clients[clientId]?.operatorId ?? clientId, graphRevision, acknowledgedAt: now() }); this.lastSyncMessage = 'REVISION_ACK'; return this.session.clients[clientId]; }
  submitCommand(clientId: StableId, command: ProductionCommand) { const client = this.session.clients[clientId]; const base = { sessionId: this.session.id, broadcastSessionId: this.session.broadcastSessionId, clientId, operatorId: command.actorId, graphRevision: this.session.currentGraphRevision, ...(command.correlationId ? { correlationId: command.correlationId } : {}) } as const; if (!client) return this.reject(base, command, { code: 'CLIENT_NOT_FOUND', message: 'Client is not joined.' }); if (command.expectedRevision !== undefined && command.expectedRevision < this.session.currentGraphRevision) { this.markBehind(clientId); this.transport.send(createSyncEnvelope({ ...base, type: 'CLIENT_BEHIND', payload: { observedGraphRevision: command.expectedRevision, currentGraphRevision: this.session.currentGraphRevision } })); return this.reject(base, command, { code: 'REVISION_MISMATCH', message: 'Command expectedRevision is stale.', details: { expectedRevision: command.expectedRevision, currentRevision: this.session.currentGraphRevision } }); } const transition = this.dispatcher.dispatch(command); this.session = { ...this.session, currentGraphRevision: transition.nextRevision, updatedAt: now() }; this.eventHistory = [...this.eventHistory, ...transition.events]; if (transition.accepted) { this.acceptedCommands++; this.lastSyncMessage = 'COMMAND_ACCEPTED'; this.transport.send(createSyncEnvelope({ ...base, type: 'COMMAND_ACCEPTED', graphRevision: transition.nextRevision, payload: { commandId: command.id, nextRevision: transition.nextRevision } })); this.transport.send(createSyncEnvelope({ ...base, type: 'EVENTS_BATCH', graphRevision: transition.nextRevision, payload: { events: transition.events, fromRevision: transition.previousRevision + 1, toRevision: transition.nextRevision } })); } else this.reject(base, command, { code: transition.validationErrors[0]?.code ?? 'COMMAND_REJECTED', message: transition.validationErrors[0]?.message ?? 'Command rejected.', details: { validationErrors: transition.validationErrors } }); return transition; }
  requestCatchUp(clientId: StableId) { const client = this.session.clients[clientId]; if (!client) return undefined; const range = getMissingRevisionRange(client.observedGraphRevision, this.session.currentGraphRevision); if (!range) return undefined; const events = this.eventHistory.filter((event) => event.nextRevision >= range.fromRevision && event.nextRevision <= range.toRevision); const base = { sessionId: this.session.id, broadcastSessionId: this.session.broadcastSessionId, clientId, operatorId: client.operatorId, graphRevision: this.session.currentGraphRevision } as const; if (events.length === 0) { this.catchUpRequiredCount++; const msg = createResyncRequiredMessage(base, client.observedGraphRevision, this.session.currentGraphRevision); this.transport.send(msg); return msg; } const msg = createCatchUpResponse(base, events, range.fromRevision, range.toRevision); this.transport.send(msg); return msg; }
  listClients() { return Object.values(this.session.clients); }
  getDiagnostics(): SyncDiagnostics { return { sessionId: this.session.id, connectedClients: this.listClients().filter((c) => c.connectionState === 'connected').length, currentGraphRevision: this.session.currentGraphRevision, acceptedCommands: this.acceptedCommands, rejectedCommands: this.rejectedCommands, catchUpRequiredCount: this.catchUpRequiredCount, clients: this.listClients(), lastSyncMessage: this.lastSyncMessage }; }
  private markBehind(clientId: StableId) { const client = this.session.clients[clientId]; if (client) this.session = { ...this.session, clients: { ...this.session.clients, [clientId]: { ...client, recoveryState: 'behind', revisionLag: getClientRevisionLag(client, this.session) } } }; }
  private reject(base: Omit<SyncEnvelope<'COMMAND_REJECTED', unknown>, 'id' | 'timestamp' | 'type' | 'payload'>, command: ProductionCommand, error: SyncError): ProductionGraphTransition | undefined { this.rejectedCommands++; this.lastSyncMessage = 'COMMAND_REJECTED'; this.transport.send(createSyncEnvelope({ ...base, type: 'COMMAND_REJECTED', payload: { commandId: command.id, error } })); return undefined; }
}

export const createSyncSession = (input: Omit<SyncSession, 'clients' | 'createdAt' | 'updatedAt' | 'metadata'> & Partial<Pick<SyncSession, 'clients' | 'createdAt' | 'updatedAt' | 'metadata'>>): SyncSession => ({ clients: {}, createdAt: now(), updatedAt: now(), metadata: {}, ...input });
export const createMockSyncScenario = (session: Omit<SyncSession, 'clients'>): SyncSession => ({ ...session, clients: Object.fromEntries([
  ['director-client', { clientId: 'director-client', operatorId: 'director', displayName: 'Director', connectionState: 'connected', observedGraphRevision: session.currentGraphRevision, revisionLag: 0, lastHeartbeatAt: now(), recoveryState: 'synced', metadata: {} }],
  ['producer-client', { clientId: 'producer-client', operatorId: 'producer', displayName: 'Producer', connectionState: 'connected', observedGraphRevision: Math.max(0, session.currentGraphRevision - 1), revisionLag: Math.min(1, session.currentGraphRevision), lastHeartbeatAt: now(), recoveryState: session.currentGraphRevision > 0 ? 'behind' : 'synced', metadata: {} }],
  ['audio-client', { clientId: 'audio-client', operatorId: 'audio', displayName: 'Audio', connectionState: 'connected', observedGraphRevision: session.currentGraphRevision, revisionLag: 0, lastHeartbeatAt: now(), recoveryState: 'synced', metadata: {} }],
  ['graphics-client', { clientId: 'graphics-client', operatorId: 'graphics', displayName: 'Graphics', connectionState: 'reconnecting', observedGraphRevision: Math.max(0, session.currentGraphRevision - 2), revisionLag: Math.min(2, session.currentGraphRevision), lastHeartbeatAt: new Date(Date.now() - 45_000).toISOString(), recoveryState: 'catching_up', metadata: {} }],
]) });

export type WebSocketConnectionState = SyncTransportState | 'reconnecting';
export interface SyncTransportStatus { transport: 'local' | 'websocket'; state: WebSocketConnectionState; url?: string; connectedClients?: number; lastReceivedMessage?: SyncMessageType; lastSentMessage?: SyncMessageType; lastHeartbeatAt?: string; reconnectAttempts: number; lastError?: string; }
const syncMessageTypes = new Set<SyncMessageType>(['CLIENT_JOIN','CLIENT_LEAVE','CLIENT_HEARTBEAT','SESSION_STATE_REQUEST','SESSION_STATE_RESPONSE','GRAPH_REVISION_REQUEST','GRAPH_REVISION_RESPONSE','COMMAND_SUBMIT','COMMAND_ACCEPTED','COMMAND_REJECTED','EVENTS_BATCH','REVISION_ACK','CLIENT_BEHIND','CLIENT_RESYNC_REQUIRED','PRESENCE_UPDATE','ACTIVITY_UPDATE','LOCK_REQUEST','LOCK_GRANTED','LOCK_DENIED','LOCK_RELEASED','SYNC_ERROR']);
export const validateSyncEnvelope = (value: unknown): value is SyncMessage => {
  if (!value || typeof value !== 'object') return false;
  const msg = value as Partial<SyncMessage>;
  return typeof msg.id === 'string' && typeof msg.type === 'string' && syncMessageTypes.has(msg.type as SyncMessageType) && typeof msg.sessionId === 'string' && typeof msg.broadcastSessionId === 'string' && typeof msg.clientId === 'string' && typeof msg.operatorId === 'string' && typeof msg.timestamp === 'string' && !Number.isNaN(Date.parse(msg.timestamp)) && typeof msg.graphRevision === 'number' && Number.isFinite(msg.graphRevision) && 'payload' in msg;
};
export const serializeSyncEnvelope = (message: SyncMessage) => JSON.stringify(message);
export const deserializeSyncEnvelope = (data: string | ArrayBuffer | Uint8Array): SyncMessage => {
  const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
  const parsed = JSON.parse(text) as unknown;
  if (!validateSyncEnvelope(parsed)) throw new Error('Invalid SyncEnvelope payload.');
  return parsed;
};
export const createSyncErrorEnvelope = (base: Pick<SyncEnvelope, 'sessionId' | 'broadcastSessionId' | 'clientId' | 'operatorId' | 'graphRevision'>, error: SyncError, correlationId?: StableId) => createSyncEnvelope({ ...base, ...(correlationId ? { correlationId } : {}), type: 'SYNC_ERROR', payload: error });
export const createHeartbeatEnvelope = (base: Pick<SyncEnvelope, 'sessionId' | 'broadcastSessionId' | 'clientId' | 'operatorId' | 'graphRevision'>) => createSyncEnvelope({ ...base, type: 'CLIENT_HEARTBEAT', payload: { clientId: base.clientId, operatorId: base.operatorId, sentAt: now(), observedGraphRevision: base.graphRevision } satisfies SyncHeartbeat });

export interface WebSocketSyncClientOptions { url: string; heartbeatMs?: number; maxReconnectAttempts?: number; reconnectBaseMs?: number; WebSocketImpl?: typeof WebSocket; }
export class WebSocketSyncClient {
  private socket?: WebSocket; private state: WebSocketConnectionState = 'idle'; private handlers = new Set<(message: SyncMessage) => void>(); private stateHandlers = new Set<(status: SyncTransportStatus) => void>(); private reconnectTimer?: ReturnType<typeof setTimeout>; private heartbeatTimer?: ReturnType<typeof setInterval>; private reconnectAttempts = 0; private lastReceivedMessage: SyncMessageType | undefined; private lastSentMessage: SyncMessageType | undefined; private lastHeartbeatAt: string | undefined; private lastError: string | undefined;
  constructor(private options: WebSocketSyncClientOptions) {}
  connect() { if (this.state === 'connected' || this.state === 'connecting') return; this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting'); const WS = this.options.WebSocketImpl ?? WebSocket; this.socket = new WS(this.options.url); this.socket.addEventListener('open', () => { this.reconnectAttempts = 0; this.lastError = undefined; this.setState('connected'); }); this.socket.addEventListener('message', (event) => this.receive(event.data)); this.socket.addEventListener('close', () => this.scheduleReconnect()); this.socket.addEventListener('error', () => { this.lastError = 'WebSocket transport error'; this.setState('error'); }); }
  disconnect() { if (this.reconnectTimer) clearTimeout(this.reconnectTimer); if (this.heartbeatTimer) clearInterval(this.heartbeatTimer); this.setState('disconnecting'); this.socket?.close(); this.setState('disconnected'); }
  send(message: SyncMessage) { if (this.state !== 'connected' || !this.socket) return; this.socket.send(serializeSyncEnvelope(message)); this.lastSentMessage = message.type; if (message.type === 'CLIENT_HEARTBEAT') this.lastHeartbeatAt = message.timestamp; this.emitState(); }
  subscribe(handler: (message: SyncMessage) => void) { this.handlers.add(handler); return () => this.handlers.delete(handler); }
  subscribeState(handler: (status: SyncTransportStatus) => void) { this.stateHandlers.add(handler); handler(this.getStatus()); return () => this.stateHandlers.delete(handler); }
  getState() { return this.state; }
  getStatus(): SyncTransportStatus { return { transport: 'websocket', state: this.state, url: this.options.url, reconnectAttempts: this.reconnectAttempts, ...(this.lastReceivedMessage ? { lastReceivedMessage: this.lastReceivedMessage } : {}), ...(this.lastSentMessage ? { lastSentMessage: this.lastSentMessage } : {}), ...(this.lastHeartbeatAt ? { lastHeartbeatAt: this.lastHeartbeatAt } : {}), ...(this.lastError ? { lastError: this.lastError } : {}) }; }
  startHeartbeat(factory: () => SyncMessage, intervalMs = this.options.heartbeatMs ?? 15_000) { if (this.heartbeatTimer) clearInterval(this.heartbeatTimer); this.heartbeatTimer = setInterval(() => this.send(factory()), intervalMs); }
  private receive(data: unknown) { try { const msg = deserializeSyncEnvelope(typeof data === 'string' ? data : data instanceof ArrayBuffer ? data : String(data)); this.lastReceivedMessage = msg.type; if (msg.type === 'CLIENT_HEARTBEAT') this.lastHeartbeatAt = msg.timestamp; this.handlers.forEach((h) => h(msg)); this.emitState(); } catch (error) { this.lastError = error instanceof Error ? error.message : 'Invalid SyncEnvelope payload.'; this.emitState(); } }
  private scheduleReconnect() { if (this.state === 'disconnecting' || this.state === 'disconnected') return; const max = this.options.maxReconnectAttempts ?? 5; if (this.reconnectAttempts >= max) { this.setState('disconnected'); return; } this.reconnectAttempts++; this.setState('reconnecting'); const delay = Math.min((this.options.reconnectBaseMs ?? 500) * 2 ** (this.reconnectAttempts - 1), 8_000); this.reconnectTimer = setTimeout(() => this.connect(), delay); }
  private setState(state: WebSocketConnectionState) { this.state = state; this.emitState(); }
  private emitState() { const status = this.getStatus(); this.stateHandlers.forEach((h) => h(status)); }
}
export class WebSocketSyncTransport implements SyncTransport { constructor(private client: WebSocketSyncClient) {} connect() { this.client.connect(); } disconnect() { this.client.disconnect(); } send(message: SyncMessage) { this.client.send(message); } subscribe(handler: (message: SyncMessage) => void) { return this.client.subscribe(handler); } getState(): SyncTransportState { const state = this.client.getState(); return state === 'reconnecting' ? 'connecting' : state; } getStatus() { return this.client.getStatus(); } }
export const isRealtimeSyncEnabled = (env: Record<string, string | undefined>) => env.NEXT_PUBLIC_UBOS_REALTIME_SYNC === 'true' && Boolean(env.NEXT_PUBLIC_UBOS_SYNC_URL);
