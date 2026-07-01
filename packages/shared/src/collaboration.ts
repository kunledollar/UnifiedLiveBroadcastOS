import {
  canExecuteProductionCommand,
  getProductionGraphRevision,
  type LocalProductionCommandDispatcher,
  type OperatorRole,
  type ProductionBroadcastSession,
  type ProductionCommand,
  type ProductionCommandType,
} from './production-graph.js';

export type CollaborationRole = OperatorRole;
export type CollaborationPresence = 'online' | 'idle' | 'away' | 'offline' | 'reconnecting';
export type CollaborationConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';
export type CollaborationActivity =
  | 'viewing'
  | 'switching'
  | 'editing_scene'
  | 'managing_guests'
  | 'adjusting_audio'
  | 'editing_graphics'
  | 'monitoring_health'
  | 'viewing_multiview'
  | 'idle';

export interface CollaborationCursor {
  panelId: string;
  x: number;
  y: number;
  updatedAt: string;
}

export interface CollaborationOperator {
  id: string;
  displayName: string;
  role: CollaborationRole;
  presence: CollaborationPresence;
  connectionState: CollaborationConnectionState;
  currentActivity: CollaborationActivity;
  currentPanel?: string;
  lastSeenAt: string;
  color: string;
  initials: string;
  observedGraphRevision: number;
  cursor?: CollaborationCursor;
  metadata: Record<string, unknown>;
}

export interface CollaborationSession {
  id: string;
  broadcastSessionId: string;
  productionGraphId: string;
  currentGraphRevision: number;
  sessionName: string;
  status: 'offline' | 'rehearsal' | 'live' | 'ended';
  operators: Record<string, CollaborationOperator>;
  activeOperatorIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export type CollaborationEventType =
  | 'OPERATOR_JOINED'
  | 'OPERATOR_LEFT'
  | 'OPERATOR_PRESENCE_UPDATED'
  | 'OPERATOR_ACTIVITY_UPDATED'
  | 'OPERATOR_PANEL_CHANGED'
  | 'OPERATOR_RECONNECTING'
  | 'OPERATOR_RECONNECTED'
  | 'GRAPH_REVISION_SYNCED'
  | 'GRAPH_REVISION_BEHIND'
  | 'COMMAND_BROADCAST'
  | 'COMMAND_REJECTED_BY_REVISION'
  | 'SESSION_LOCKED'
  | 'SESSION_UNLOCKED';

export interface CollaborationEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: CollaborationEventType;
  sessionId: string;
  operatorId?: string;
  timestamp: string;
  graphRevision: number;
  payload: TPayload;
}

const now = () => new Date().toISOString();
const eventId = (type: CollaborationEventType) => `collab:${type}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export function mapCollaborationRoleToProductionRole(role: CollaborationRole): OperatorRole {
  return role;
}

export function canCollaborationOperatorExecuteCommand(
  operator: CollaborationOperator,
  commandType: ProductionCommandType,
) {
  return canExecuteProductionCommand(mapCollaborationRoleToProductionRole(operator.role), commandType);
}

export function isOperatorBehindGraph(operator: CollaborationOperator, session: CollaborationSession) {
  return operator.observedGraphRevision < session.currentGraphRevision;
}

export function getRevisionLag(operator: CollaborationOperator, session: CollaborationSession) {
  return Math.max(0, session.currentGraphRevision - operator.observedGraphRevision);
}

export function getOperatorsBehindRevision(session: CollaborationSession) {
  return Object.values(session.operators).filter((operator) => isOperatorBehindGraph(operator, session));
}

export function createMockCollaborationOperators(revision = 0, timestamp = now()) {
  const operators = [
    ['director', 'Director', 'DIRECTOR', 'switching', 'Switcher', '#22d3ee', 'DR', revision],
    ['producer', 'Producer', 'PRODUCER', 'viewing', 'Run of Show', '#a78bfa', 'PR', Math.max(0, revision - 3)],
    ['audio', 'Audio Engineer', 'AUDIO_ENGINEER', 'adjusting_audio', 'Audio Mixer', '#34d399', 'AE', revision],
    ['graphics', 'Graphics Operator', 'GRAPHICS_OPERATOR', 'editing_graphics', 'Graphics', '#f59e0b', 'GO', Math.max(0, revision - 1)],
  ] as const satisfies ReadonlyArray<readonly [string, string, CollaborationRole, CollaborationActivity, string, string, string, number]>;
  return operators.map(([id, displayName, role, currentActivity, currentPanel, color, initials, observedGraphRevision]) => ({
    id,
    displayName,
    role,
    presence: (id === 'producer' ? 'reconnecting' : 'online') as CollaborationPresence,
    connectionState: (id === 'producer' ? 'reconnecting' : 'connected') as CollaborationConnectionState,
    currentActivity,
    currentPanel,
    lastSeenAt: timestamp,
    color,
    initials,
    observedGraphRevision,
    metadata: {},
  })) satisfies CollaborationOperator[];
}

export function createCollaborationSession(input: {
  id?: string;
  broadcastSessionId: string;
  productionGraphId: string;
  currentGraphRevision?: number;
  sessionName: string;
  status?: CollaborationSession['status'];
  operators?: CollaborationOperator[];
  timestamp?: string;
}) {
  const timestamp = input.timestamp ?? now();
  const operators = Object.fromEntries((input.operators ?? []).map((operator) => [operator.id, operator]));
  return {
    id: input.id ?? `collab:${input.broadcastSessionId}`,
    broadcastSessionId: input.broadcastSessionId,
    productionGraphId: input.productionGraphId,
    currentGraphRevision: input.currentGraphRevision ?? 0,
    sessionName: input.sessionName,
    status: input.status ?? 'rehearsal',
    operators,
    activeOperatorIds: Object.values(operators)
      .filter((operator) => operator.presence !== 'offline')
      .map((operator) => operator.id),
    createdAt: timestamp,
    updatedAt: timestamp,
    metadata: {},
  } satisfies CollaborationSession;
}

export class InMemoryCollaborationStore {
  private events: CollaborationEvent[] = [];
  constructor(private session: CollaborationSession) {}
  getCollaborationSession() { return this.session; }
  listOperators() { return Object.values(this.session.operators); }
  listActiveOperators() { return this.session.activeOperatorIds.map((id) => this.session.operators[id]).filter(Boolean); }
  appendCollaborationEvent(event: CollaborationEvent) { this.events = [...this.events, event]; return event; }
  listCollaborationEvents() { return [...this.events]; }
  getOperatorsBehindRevision() { return getOperatorsBehindRevision(this.session); }
  joinOperator(operator: CollaborationOperator) {
    this.session = { ...this.session, operators: { ...this.session.operators, [operator.id]: operator }, activeOperatorIds: [...new Set([...this.session.activeOperatorIds, operator.id])], updatedAt: now() };
    return this.appendCollaborationEvent({ id: eventId('OPERATOR_JOINED'), type: 'OPERATOR_JOINED', sessionId: this.session.id, operatorId: operator.id, timestamp: now(), graphRevision: this.session.currentGraphRevision, payload: { displayName: operator.displayName } });
  }
  leaveOperator(operatorId: string) {
    this.patchOperator(operatorId, { presence: 'offline', connectionState: 'disconnected', lastSeenAt: now() });
    this.session = { ...this.session, activeOperatorIds: this.session.activeOperatorIds.filter((id) => id !== operatorId), updatedAt: now() };
    return this.appendCollaborationEvent({ id: eventId('OPERATOR_LEFT'), type: 'OPERATOR_LEFT', sessionId: this.session.id, operatorId, timestamp: now(), graphRevision: this.session.currentGraphRevision, payload: {} });
  }
  updateOperatorPresence(operatorId: string, presence: CollaborationPresence) {
    this.patchOperator(operatorId, { presence, lastSeenAt: now(), connectionState: presence === 'reconnecting' ? 'reconnecting' : presence === 'offline' ? 'disconnected' : 'connected' });
    return this.appendCollaborationEvent({ id: eventId('OPERATOR_PRESENCE_UPDATED'), type: 'OPERATOR_PRESENCE_UPDATED', sessionId: this.session.id, operatorId, timestamp: now(), graphRevision: this.session.currentGraphRevision, payload: { presence } });
  }
  updateOperatorActivity(operatorId: string, activity: CollaborationActivity, panel?: string) {
    this.patchOperator(operatorId, { currentActivity: activity, ...(panel === undefined ? {} : { currentPanel: panel }), lastSeenAt: now() });
    return this.appendCollaborationEvent({ id: eventId('OPERATOR_ACTIVITY_UPDATED'), type: 'OPERATOR_ACTIVITY_UPDATED', sessionId: this.session.id, operatorId, timestamp: now(), graphRevision: this.session.currentGraphRevision, payload: { activity, panel } });
  }
  markOperatorSynced(operatorId: string, revision = this.session.currentGraphRevision) {
    this.patchOperator(operatorId, { observedGraphRevision: revision, lastSeenAt: now() });
    return this.appendCollaborationEvent({ id: eventId('GRAPH_REVISION_SYNCED'), type: 'GRAPH_REVISION_SYNCED', sessionId: this.session.id, operatorId, timestamp: now(), graphRevision: revision, payload: { revision } });
  }
  setCurrentGraphRevision(revision: number) { this.session = { ...this.session, currentGraphRevision: revision, updatedAt: now() }; }
  private patchOperator(operatorId: string, patch: Partial<CollaborationOperator>) {
    const operator = this.session.operators[operatorId];
    if (!operator) return;
    this.session = { ...this.session, operators: { ...this.session.operators, [operatorId]: { ...operator, ...patch } }, updatedAt: now() };
  }
}

export interface CollaborationCommandBus { broadcastCommand(command: ProductionCommand): ReturnType<LocalProductionCommandDispatcher['dispatch']>; }

export class LocalCollaborationCommandBus implements CollaborationCommandBus {
  constructor(private store: InMemoryCollaborationStore, private dispatcher: LocalProductionCommandDispatcher) {}
  broadcastCommand(command: ProductionCommand) {
    const session = this.store.getCollaborationSession();
    const commandWithRevision = command.expectedRevision === undefined ? { ...command, expectedRevision: session.currentGraphRevision } : command;
    this.store.appendCollaborationEvent({ id: eventId('COMMAND_BROADCAST'), type: 'COMMAND_BROADCAST', sessionId: session.id, operatorId: command.actorId, timestamp: command.timestamp, graphRevision: session.currentGraphRevision, payload: { commandType: command.type, commandId: command.id, expectedRevision: commandWithRevision.expectedRevision } });
    const transition = this.dispatcher.dispatch(commandWithRevision);
    this.store.setCurrentGraphRevision(getProductionGraphRevision(transition.nextGraph));
    if (!transition.accepted && transition.validationErrors.some((error) => error.code === 'REVISION_MISMATCH')) {
      this.store.appendCollaborationEvent({ id: eventId('COMMAND_REJECTED_BY_REVISION'), type: 'COMMAND_REJECTED_BY_REVISION', sessionId: session.id, operatorId: command.actorId, timestamp: command.timestamp, graphRevision: transition.nextRevision, payload: { commandType: command.type, commandId: command.id, expectedRevision: commandWithRevision.expectedRevision, currentRevision: transition.nextRevision } });
    }
    return transition;
  }
}

export function createMockCollaborationSession(productionSession: ProductionBroadcastSession) {
  const revision = getProductionGraphRevision(productionSession.graph);
  return createCollaborationSession({
    broadcastSessionId: productionSession.id,
    productionGraphId: productionSession.graph.id,
    currentGraphRevision: revision,
    sessionName: `${productionSession.name} Team`,
    status: productionSession.status === 'idle' ? 'offline' : productionSession.status,
    operators: createMockCollaborationOperators(revision, productionSession.createdAt),
    timestamp: productionSession.createdAt,
  });
}
