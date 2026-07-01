import {
  LocalProductionCommandDispatcher,
  MockAgentPlaneAdapter,
  MockMediaExecutionAdapter,
  applyProductionCommand,
  createBroadcastSession,
  createInitialProductionGraph,
  getProductionGraphMetadata,
  getProductionGraphRevision,
  InMemoryProductionEventLog,
  isGraphRevisionCurrent,
  selectPreviewScene,
  selectProgramScene,
  type ProductionCommand,
} from './production-graph.js';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}
const command = (
  type: ProductionCommand['type'],
  payload: Record<string, unknown> = {},
  role: ProductionCommand['actorRole'] = 'DIRECTOR',
  expectedRevision?: number,
): ProductionCommand => ({
  id: `test-${type}-${JSON.stringify(payload)}-${expectedRevision ?? 'legacy'}`,
  type,
  broadcastSessionId: 'test-session',
  actorId: 'tester',
  actorRole: role,
  timestamp: '2026-07-01T00:00:00.000Z',
  ...(expectedRevision === undefined ? {} : { expectedRevision }),
  payload,
});

let graph = createInitialProductionGraph({
  broadcastSessionId: 'test-session',
  timestamp: '2026-07-01T00:00:00.000Z',
});
assert(graph.graphVersion === 0 && graph.schemaVersion, 'initial graph includes version metadata');
assert(getProductionGraphRevision(graph) === 0, 'initial graph revision is zero');
assert(
  getProductionGraphMetadata(graph).graphId === graph.id,
  'graph metadata initializes stable graph ID',
);
assert(
  getProductionGraphMetadata(graph).createdAt === graph.createdAt,
  'graph metadata initializes created time',
);
assert(isGraphRevisionCurrent(graph, 0), 'revision current helper accepts matching revision');
let transition = applyProductionCommand(
  graph,
  command('CREATE_SCENE', { id: 'scene-a', name: 'A' }, 'DIRECTOR', 0),
);
assert(transition.accepted, 'CREATE_SCENE accepted');
assert(
  transition.previousRevision === 0 && transition.nextRevision === 1,
  'accepted command increments revision by one',
);
assert(transition.nextGraph.metadata.revision === 1, 'next graph metadata revision increments');
assert(
  transition.nextGraph.metadata.createdAt === graph.metadata.createdAt,
  'graph metadata created time remains immutable',
);
assert(
  transition.nextGraph.metadata.updatedAt === transition.command.timestamp,
  'graph metadata updated time changes on acceptance',
);
assert(
  transition.events[0]?.previousRevision === 0 && transition.events[0]?.nextRevision === 1,
  'event revision metadata records transition',
);
graph = transition.nextGraph;
const mismatch = applyProductionCommand(
  graph,
  command('SET_PREVIEW_SCENE', { sceneId: 'scene-a' }, 'DIRECTOR', 0),
);
assert(!mismatch.accepted, 'revision mismatch command rejected');
assert(mismatch.nextGraph === graph, 'revision mismatch does not modify graph state');
assert(
  mismatch.previousRevision === 1 && mismatch.nextRevision === 1,
  'rejected command does not increment revision',
);
assert(
  mismatch.validationErrors[0]?.code === 'REVISION_MISMATCH',
  'revision mismatch emits deterministic validation error',
);
assert(
  mismatch.events[0]?.previousRevision === 1 && mismatch.events[0]?.nextRevision === 1,
  'COMMAND_REJECTED uses current revision as previous and next',
);
transition = applyProductionCommand(
  graph,
  command('SET_PREVIEW_SCENE', { sceneId: 'scene-a' }, 'DIRECTOR', 1),
);
assert(transition.nextGraph.preview.sceneId === 'scene-a', 'SET_PREVIEW_SCENE updates preview');
assert(
  selectPreviewScene(transition.nextGraph)?.id === 'scene-a',
  'preview selector returns scene',
);
graph = transition.nextGraph;
transition = applyProductionCommand(graph, command('TAKE_PREVIEW'));
assert(
  transition.nextGraph.program.sceneId === 'scene-a',
  'legacy command without expectedRevision remains accepted',
);
assert(
  selectProgramScene(transition.nextGraph)?.id === 'scene-a',
  'program selector returns scene',
);
graph = transition.nextGraph;
transition = applyProductionCommand(graph, command('CUT_TO_PROGRAM', { sceneId: 'scene-a' }));
assert(transition.nextGraph.program.transitionType === 'cut', 'CUT_TO_PROGRAM sets cut transition');
const rejected = applyProductionCommand(
  graph,
  command('STOP_BROADCAST', {}, 'VIEWER', graph.metadata.revision),
);
assert(!rejected.accepted, 'unauthorized role command rejected');
assert(
  rejected.nextGraph.metadata.revision === graph.metadata.revision,
  'permission rejection preserves revision',
);
assert(
  rejected.events.some((event) => event.type === 'COMMAND_REJECTED'),
  'COMMAND_REJECTED emitted',
);
const eventLog = new InMemoryProductionEventLog();
transition.events.forEach((event) => eventLog.appendProductionEvent(event));
assert(
  eventLog.getProductionEventsForSession('test-session').length === transition.events.length,
  'event log records events',
);
const media = new MockMediaExecutionAdapter();
media.onGraphUpdated(transition);
assert(
  (media.renderState.program as { sceneId?: string }).sceneId === 'scene-a',
  'mock media reacts to transition',
);
const live = applyProductionCommand(graph, command('START_BROADCAST'));
const agentCommands = new MockAgentPlaneAdapter().observeTransition(live);
assert(agentCommands[0]?.type === 'ADD_AGENT_SUGGESTION', 'mock agent creates suggestion command');
assert(
  live.nextGraph.agentSuggestions && Object.keys(live.nextGraph.agentSuggestions).length === 0,
  'mock agent does not mutate graph directly',
);
const dispatcher = new LocalProductionCommandDispatcher(
  createBroadcastSession({ id: 'test-session', timestamp: '2026-07-01T00:00:00.000Z' }),
);
const first = dispatcher.dispatch(command('CREATE_SCENE', { id: 'seq-a' }, 'DIRECTOR', 0));
const second = dispatcher.dispatch(
  command('SET_PREVIEW_SCENE', { sceneId: 'seq-a' }, 'DIRECTOR', 1),
);
assert(
  first.commandSequence === 1 && second.commandSequence === 2,
  'command sequence numbers are monotonic',
);
assert(
  second.events[0]?.metadata?.commandSequence === 2,
  'command sequence is included in event diagnostics',
);
console.log('Production graph validation passed');

import {
  InMemoryCollaborationStore,
  LocalCollaborationCommandBus,
  canCollaborationOperatorExecuteCommand,
  createCollaborationSession,
  createMockCollaborationOperators,
  getRevisionLag,
  isOperatorBehindGraph,
  mapCollaborationRoleToProductionRole,
} from './collaboration.js';

const collaborationProduction = createBroadcastSession({
  id: 'collab-session',
  name: 'Collab Session',
  operatorId: 'director',
  timestamp: '2026-07-01T00:00:00.000Z',
});
const collaborationSession = createCollaborationSession({
  broadcastSessionId: collaborationProduction.id,
  productionGraphId: collaborationProduction.graph.id,
  currentGraphRevision: 0,
  sessionName: 'Collab Session Team',
  operators: createMockCollaborationOperators(0, collaborationProduction.createdAt),
  timestamp: collaborationProduction.createdAt,
});
const store = new InMemoryCollaborationStore(collaborationSession);
const guestOperator = {
  ...store.listOperators()[0]!,
  id: 'guest-manager',
  displayName: 'Guest Manager',
  role: 'GUEST_MANAGER' as const,
  initials: 'GM',
};
store.joinOperator(guestOperator);
assert(store.getCollaborationSession().operators['guest-manager'], 'operator joins collaboration session');
store.updateOperatorPresence('guest-manager', 'away');
assert(
  store.getCollaborationSession().operators['guest-manager']?.presence === 'away',
  'presence updates are stored',
);
store.updateOperatorActivity('guest-manager', 'managing_guests', 'Guest Manager');
assert(
  store.getCollaborationSession().operators['guest-manager']?.currentActivity === 'managing_guests',
  'activity updates are stored',
);
store.setCurrentGraphRevision(3);
assert(
  isOperatorBehindGraph(store.getCollaborationSession().operators.producer!, store.getCollaborationSession()),
  'operator revision lag is detected',
);
assert(
  getRevisionLag(store.getCollaborationSession().operators.producer!, store.getCollaborationSession()) === 3,
  'revision lag helper returns current delta',
);
store.markOperatorSynced('producer', 3);
assert(
  getRevisionLag(store.getCollaborationSession().operators.producer!, store.getCollaborationSession()) === 0,
  'mark operator synced updates observed revision',
);
const collabDispatcher = new LocalProductionCommandDispatcher(collaborationProduction);
const bus = new LocalCollaborationCommandBus(store, collabDispatcher);
const busAccepted = bus.broadcastCommand({
  id: 'collab-create-scene',
  type: 'CREATE_SCENE',
  broadcastSessionId: collaborationProduction.id,
  actorId: 'director',
  actorRole: 'DIRECTOR',
  timestamp: '2026-07-01T00:00:01.000Z',
  expectedRevision: 0,
  payload: { id: 'collab-scene', name: 'Collab Scene' },
});
assert(busAccepted.accepted, 'command broadcast accepts current revision command');
assert(store.getCollaborationSession().currentGraphRevision === 1, 'command broadcast updates session revision');
const busRejected = bus.broadcastCommand({
  id: 'collab-stale-preview',
  type: 'SET_PREVIEW_SCENE',
  broadcastSessionId: collaborationProduction.id,
  actorId: 'director',
  actorRole: 'DIRECTOR',
  timestamp: '2026-07-01T00:00:02.000Z',
  expectedRevision: 0,
  payload: { sceneId: 'collab-scene' },
});
assert(!busRejected.accepted, 'stale collaboration command is rejected');
assert(
  store.listCollaborationEvents().some((event) => event.type === 'COMMAND_REJECTED_BY_REVISION'),
  'revision mismatch emits collaboration event',
);
assert(
  mapCollaborationRoleToProductionRole('AUDIO_ENGINEER') === 'AUDIO_ENGINEER',
  'collaboration role maps to production role',
);
assert(
  canCollaborationOperatorExecuteCommand(store.getCollaborationSession().operators.audio!, 'SET_AUDIO_GAIN'),
  'collaboration permissions reuse production command permissions',
);
console.log('Collaboration validation passed');
