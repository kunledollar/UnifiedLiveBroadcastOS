import {
  applyProductionCommand,
  canExecuteProductionCommand,
  getProductionGraphRevision,
  type LocalProductionCommandDispatcher,
  type OperatorRole,
  type ProductionBroadcastSession,
  type ProductionCommand,
  type ProductionCommandType,
  type ProductionGraphTransition,
} from './production-graph.js';
import type { InMemoryAuthorityStore } from './authority.js';

export type CollaborationRole = OperatorRole;
export type CollaborationPresence = 'online' | 'offline' | 'idle' | 'active' | 'editing' | 'reviewing' | 'presenting' | 'disconnected' | 'away' | 'reconnecting';
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

export type SharedSelectionType = 'scene' | 'guest' | 'source' | 'destination' | 'overlay' | 'lower_third' | 'media_asset';

export interface CollaborationCursor {
  panelId: string;
  x: number;
  y: number;
  updatedAt: string;
}

export interface CollaborationSharedSelection {
  type: SharedSelectionType;
  resourceId: string;
  label: string;
  selectedAt: string;
}

export interface CollaborationWorkspaceAwareness {
  currentView: string;
  programFocus: string;
  preset: string;
  visiblePanels: string[];
}

export interface CollaborationOperator {
  id: string;
  displayName: string;
  role: CollaborationRole;
  presence: CollaborationPresence;
  connectionState: CollaborationConnectionState;
  currentActivity: CollaborationActivity;
  currentPanel?: string;
  joinedAt: string;
  lastSeenAt: string;
  currentWorkspace?: string;
  selectedPanel?: string;
  selectedScene?: string;
  selectedGuest?: string;
  selectedDestination?: string;
  activeAuthorityScope?: string;
  authorityScopes?: string[];
  lockCount?: number;
  sharedSelection?: CollaborationSharedSelection;
  workspaceAwareness?: CollaborationWorkspaceAwareness;
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
  | 'OPERATOR_SELECTION_CHANGED'
  | 'OPERATOR_RECONNECTING'
  | 'OPERATOR_RECONNECTED'
  | 'GRAPH_REVISION_SYNCED'
  | 'GRAPH_REVISION_BEHIND'
  | 'COMMAND_BROADCAST'
  | 'COMMAND_REJECTED_BY_REVISION'
  | 'SESSION_LOCKED'
  | 'SESSION_UNLOCKED'
  | 'AUTHORITY_GRANTED'
  | 'AUTHORITY_REVOKED'
  | 'LOCK_ACQUIRED'
  | 'LOCK_RELEASED'
  | 'LOCK_EXPIRED'
  | 'LOCK_RENEWED'
  | 'COMMAND_CONFLICT_CREATED'
  | 'COMMAND_CONFLICT_RESOLVED'
  | 'COMMAND_ARBITRATED'
  | 'AUTHORITY_DECISION_CREATED';

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
  const rows = [
    { id: 'director', displayName: 'Director', role: 'DIRECTOR', presence: 'presenting', connectionState: 'connected', currentActivity: 'switching', currentPanel: 'Program', color: '#22d3ee', initials: 'DR', observedGraphRevision: revision, activeAuthorityScope: 'program', authorityScopes: ['program', 'preview', 'broadcast'], lockCount: 1, sharedSelection: { type: 'scene', resourceId: 'scene-2', label: 'Scene 2', selectedAt: timestamp }, workspaceAwareness: { currentView: 'Program Focus', programFocus: 'Program', preset: 'Director', visiblePanels: ['Switcher', 'Program', 'Preview'] } },
    { id: 'producer', displayName: 'Producer', role: 'PRODUCER', presence: 'editing', connectionState: 'connected', currentActivity: 'editing_scene', currentPanel: 'Scenes', color: '#a78bfa', initials: 'PR', observedGraphRevision: Math.max(0, revision - 2), activeAuthorityScope: 'scenes', authorityScopes: ['scenes', 'graphics', 'workspace'], lockCount: 0, sharedSelection: { type: 'scene', resourceId: 'scene-3', label: 'Scene 3', selectedAt: timestamp }, workspaceAwareness: { currentView: 'Multiview', programFocus: 'Preview', preset: 'Producer', visiblePanels: ['Scenes', 'Run of Show', 'Guests'] } },
    { id: 'td', displayName: 'Technical Director', role: 'TECHNICAL_DIRECTOR', presence: 'active', connectionState: 'connected', currentActivity: 'viewing_multiview', currentPanel: 'Multiview', color: '#60a5fa', initials: 'TD', observedGraphRevision: revision, activeAuthorityScope: 'preview', authorityScopes: ['preview', 'sources', 'outputs'], lockCount: 0, sharedSelection: { type: 'source', resourceId: 'camera-1', label: 'Camera 1', selectedAt: timestamp }, workspaceAwareness: { currentView: 'Multiview', programFocus: 'Preview bus', preset: 'Technical', visiblePanels: ['Multiview', 'Sources', 'Destinations'] } },
    { id: 'audio', displayName: 'Audio Engineer', role: 'AUDIO_ENGINEER', presence: 'editing', connectionState: 'connected', currentActivity: 'adjusting_audio', currentPanel: 'Audio Mixer', color: '#34d399', initials: 'AE', observedGraphRevision: revision, activeAuthorityScope: 'audio', authorityScopes: ['audio'], lockCount: 1, sharedSelection: { type: 'media_asset', resourceId: 'music-bed', label: 'Music Bed', selectedAt: timestamp }, workspaceAwareness: { currentView: 'Audio Focus', programFocus: 'Program mix', preset: 'Audio', visiblePanels: ['Audio Mixer', 'Meters'] } },
    { id: 'graphics', displayName: 'Graphics Operator', role: 'GRAPHICS_OPERATOR', presence: 'idle', connectionState: 'connected', currentActivity: 'editing_graphics', currentPanel: 'Graphics', color: '#f59e0b', initials: 'GO', observedGraphRevision: Math.max(0, revision - 1), activeAuthorityScope: 'graphics', authorityScopes: ['graphics', 'sources'], lockCount: 1, sharedSelection: { type: 'lower_third', resourceId: 'guest-l3', label: 'Guest Lower Third', selectedAt: timestamp }, workspaceAwareness: { currentView: 'Vertical Focus', programFocus: 'Overlay safe area', preset: 'Graphics', visiblePanels: ['Graphics', 'Assets'] } },
    { id: 'guest-manager', displayName: 'Guest Manager', role: 'GUEST_MANAGER', presence: 'offline', connectionState: 'disconnected', currentActivity: 'managing_guests', currentPanel: 'Guests', color: '#fb7185', initials: 'GM', observedGraphRevision: Math.max(0, revision - 4), activeAuthorityScope: 'guests', authorityScopes: ['guests'], lockCount: 0, sharedSelection: { type: 'guest', resourceId: 'guest-4', label: 'Guest 4', selectedAt: timestamp }, workspaceAwareness: { currentView: 'Guest Manager', programFocus: 'Green room', preset: 'Guests', visiblePanels: ['Guests', 'Invites'] } },
    { id: 'moderator', displayName: 'Moderator', role: 'MODERATOR', presence: 'reviewing', connectionState: 'connected', currentActivity: 'viewing', currentPanel: 'Chat', color: '#c084fc', initials: 'MO', observedGraphRevision: revision, activeAuthorityScope: 'workspace', authorityScopes: ['guests', 'workspace'], lockCount: 0, sharedSelection: { type: 'destination', resourceId: 'youtube', label: 'YouTube Main', selectedAt: timestamp }, workspaceAwareness: { currentView: 'Dual View', programFocus: 'Chat + guests', preset: 'Moderator', visiblePanels: ['Chat', 'Guests'] } },
    { id: 'viewer', displayName: 'Viewer', role: 'VIEWER', presence: 'disconnected', connectionState: 'reconnecting', currentActivity: 'idle', currentPanel: 'Diagnostics', color: '#94a3b8', initials: 'VW', observedGraphRevision: Math.max(0, revision - 6), authorityScopes: [], lockCount: 0, workspaceAwareness: { currentView: 'Observer', programFocus: 'Program', preset: 'Read only', visiblePanels: ['Program', 'Activity'] } },
  ] as const satisfies ReadonlyArray<Omit<CollaborationOperator, 'joinedAt' | 'lastSeenAt' | 'metadata'>>;
  return rows.map((operator) => ({ ...operator, joinedAt: timestamp, lastSeenAt: operator.presence === 'offline' ? new Date(Date.parse(timestamp) - 180000).toISOString() : timestamp, metadata: {} })) satisfies CollaborationOperator[];
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
      .filter((operator) => operator.presence !== 'offline' && operator.presence !== 'disconnected')
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
    this.patchOperator(operatorId, { presence, lastSeenAt: now(), connectionState: presence === 'reconnecting' ? 'reconnecting' : presence === 'offline' || presence === 'disconnected' ? 'disconnected' : 'connected' });
    return this.appendCollaborationEvent({ id: eventId('OPERATOR_PRESENCE_UPDATED'), type: 'OPERATOR_PRESENCE_UPDATED', sessionId: this.session.id, operatorId, timestamp: now(), graphRevision: this.session.currentGraphRevision, payload: { presence } });
  }
  updateOperatorActivity(operatorId: string, activity: CollaborationActivity, panel?: string) {
    this.patchOperator(operatorId, { currentActivity: activity, ...(panel === undefined ? {} : { currentPanel: panel }), lastSeenAt: now() });
    return this.appendCollaborationEvent({ id: eventId('OPERATOR_ACTIVITY_UPDATED'), type: 'OPERATOR_ACTIVITY_UPDATED', sessionId: this.session.id, operatorId, timestamp: now(), graphRevision: this.session.currentGraphRevision, payload: { activity, panel } });
  }
  updateOperatorSelection(operatorId: string, selection: CollaborationSharedSelection) {
    this.patchOperator(operatorId, { sharedSelection: selection, selectedPanel: selection.label, lastSeenAt: now() });
    return this.appendCollaborationEvent({ id: eventId('OPERATOR_SELECTION_CHANGED'), type: 'OPERATOR_SELECTION_CHANGED', sessionId: this.session.id, operatorId, timestamp: now(), graphRevision: this.session.currentGraphRevision, payload: { selection } });
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

export interface CollaborationCommandBus { broadcastCommand(command: ProductionCommand): ProductionGraphTransition; }

export class LocalCollaborationCommandBus implements CollaborationCommandBus {
  constructor(private store: InMemoryCollaborationStore, private dispatcher: LocalProductionCommandDispatcher, private authorityStore?: InMemoryAuthorityStore) {}
  broadcastCommand(command: ProductionCommand) {
    const session = this.store.getCollaborationSession();
    const commandWithRevision = command.expectedRevision === undefined ? { ...command, expectedRevision: session.currentGraphRevision } : command;
    this.store.appendCollaborationEvent({ id: eventId('COMMAND_BROADCAST'), type: 'COMMAND_BROADCAST', sessionId: session.id, operatorId: command.actorId, timestamp: command.timestamp, graphRevision: session.currentGraphRevision, payload: { commandType: command.type, commandId: command.id, expectedRevision: commandWithRevision.expectedRevision } });
    const arbitration = this.authorityStore?.arbitrate(commandWithRevision, this.dispatcher.getGraph(), command.timestamp);
    if (arbitration) {
      this.store.appendCollaborationEvent({ id: eventId('COMMAND_ARBITRATED'), type: 'COMMAND_ARBITRATED', sessionId: session.id, operatorId: command.actorId, timestamp: command.timestamp, graphRevision: session.currentGraphRevision, payload: { decision: arbitration.decision } });
      this.store.appendCollaborationEvent({ id: eventId('AUTHORITY_DECISION_CREATED'), type: 'AUTHORITY_DECISION_CREATED', sessionId: session.id, operatorId: command.actorId, timestamp: command.timestamp, graphRevision: session.currentGraphRevision, payload: { decision: arbitration.decision } });
      if ('conflict' in arbitration) this.store.appendCollaborationEvent({ id: eventId('COMMAND_CONFLICT_CREATED'), type: 'COMMAND_CONFLICT_CREATED', sessionId: session.id, operatorId: command.actorId, timestamp: command.timestamp, graphRevision: session.currentGraphRevision, payload: { conflict: arbitration.conflict } });
      if (!arbitration.decision.allowed) return applyProductionCommand(this.dispatcher.getGraph(), commandWithRevision);
    }
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
