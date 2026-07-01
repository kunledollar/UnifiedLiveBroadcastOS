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

import {
  LocalSyncTransport,
  WebSocketSyncClient,
  WebSocketSyncTransport,
  createHeartbeatEnvelope,
  deserializeSyncEnvelope,
  isRealtimeSyncEnabled,
  serializeSyncEnvelope,
  validateSyncEnvelope,
  SyncCoordinator,
  applyRevisionAck,
  createCatchUpRequest,
  createCatchUpResponse,
  createMockSyncScenario,
  createResyncRequiredMessage,
  createRevisionAck,
  createSyncEnvelope,
  createSyncSession,
  getClientRevisionLag,
  getMissingRevisionRange,
  getStaleClients,
  isClientStale,
  isClientSynced,
  markClientSynced,
  updateClientHeartbeat,
} from './sync.js';

const syncSession = createMockSyncScenario(
  createSyncSession({
    id: 'sync-test',
    broadcastSessionId: 'test-session',
    productionGraphId: graph.id,
    currentGraphRevision: getProductionGraphRevision(graph),
  }),
);
const directorClient = syncSession.clients['director-client']!;
const producerClient = syncSession.clients['producer-client']!;
const envelope = createSyncEnvelope({
  type: 'CLIENT_HEARTBEAT',
  sessionId: syncSession.id,
  broadcastSessionId: syncSession.broadcastSessionId,
  clientId: directorClient.clientId,
  operatorId: directorClient.operatorId,
  graphRevision: syncSession.currentGraphRevision,
  payload: { ok: true },
});
assert(envelope.id && envelope.type === 'CLIENT_HEARTBEAT', 'sync envelope creation assigns id and type');

const serializedEnvelope = serializeSyncEnvelope(envelope);
assert(deserializeSyncEnvelope(serializedEnvelope).id === envelope.id, 'sync envelope serialization round-trips');
assert(validateSyncEnvelope(envelope), 'sync envelope validation accepts valid messages');
assert(!validateSyncEnvelope({ type: 'CLIENT_HEARTBEAT' }), 'sync envelope validation rejects invalid messages');
const heartbeatEnvelope = createHeartbeatEnvelope({ sessionId: syncSession.id, broadcastSessionId: syncSession.broadcastSessionId, clientId: directorClient.clientId, operatorId: directorClient.operatorId, graphRevision: syncSession.currentGraphRevision });
assert(heartbeatEnvelope.type === 'CLIENT_HEARTBEAT', 'heartbeat envelope helper creates heartbeat messages');
const websocketClient = new WebSocketSyncClient({ url: 'ws://localhost:4000/realtime/sync', maxReconnectAttempts: 1 });
const websocketTransport = new WebSocketSyncTransport(websocketClient);
assert(websocketTransport.getState() === 'idle', 'websocket sync transport constructs in idle state');
assert(isRealtimeSyncEnabled({ NEXT_PUBLIC_UBOS_REALTIME_SYNC: 'true', NEXT_PUBLIC_UBOS_SYNC_URL: 'ws://localhost:4000/realtime/sync' }), 'realtime sync feature flag enables websocket transport');

const ack = createRevisionAck(producerClient, syncSession.currentGraphRevision);
const ackedSession = applyRevisionAck(syncSession, ack);
assert(isClientSynced(ackedSession.clients['producer-client']!, ackedSession), 'revision acknowledgement marks client current');
assert(getClientRevisionLag(producerClient, syncSession) >= 0, 'revision lag calculation is non-negative');
assert(markClientSynced(producerClient, syncSession).recoveryState === 'synced', 'markClientSynced sets recovery state');
const heartbeatClient = updateClientHeartbeat(producerClient, {
  clientId: producerClient.clientId,
  operatorId: producerClient.operatorId,
  sentAt: '2026-07-01T00:00:10.000Z',
  observedGraphRevision: syncSession.currentGraphRevision,
}, syncSession.currentGraphRevision);
assert(heartbeatClient.lastHeartbeatAt === '2026-07-01T00:00:10.000Z', 'heartbeat update stores last heartbeat');
assert(isClientStale({ ...producerClient, lastHeartbeatAt: '2026-07-01T00:00:00.000Z' }, 1000, Date.parse('2026-07-01T00:00:02.000Z')), 'stale client detection works');
assert(getStaleClients(syncSession, 1, Date.now()).length >= 0, 'stale client listing returns array');
assert(getMissingRevisionRange(1, 3)?.fromRevision === 2, 'missing revision range starts after observed revision');
const catchUpRequest = createCatchUpRequest({
  sessionId: syncSession.id,
  broadcastSessionId: syncSession.broadcastSessionId,
  clientId: producerClient.clientId,
  operatorId: producerClient.operatorId,
  graphRevision: syncSession.currentGraphRevision,
}, producerClient.observedGraphRevision);
assert(catchUpRequest.type === 'GRAPH_REVISION_REQUEST', 'catch-up request created');
const catchUpResponse = createCatchUpResponse({
  sessionId: syncSession.id,
  broadcastSessionId: syncSession.broadcastSessionId,
  clientId: producerClient.clientId,
  operatorId: producerClient.operatorId,
  graphRevision: syncSession.currentGraphRevision,
}, [], 1, 2);
assert(catchUpResponse.type === 'EVENTS_BATCH', 'catch-up response created');
const resync = createResyncRequiredMessage({
  sessionId: syncSession.id,
  broadcastSessionId: syncSession.broadcastSessionId,
  clientId: producerClient.clientId,
  operatorId: producerClient.operatorId,
  graphRevision: syncSession.currentGraphRevision,
}, 0, syncSession.currentGraphRevision);
assert(resync.type === 'CLIENT_RESYNC_REQUIRED', 'resync required message created');
const transport = new LocalSyncTransport();
const syncDispatcher = new LocalProductionCommandDispatcher(createBroadcastSession({ id: 'test-session', operatorId: 'tester', timestamp: '2026-07-01T00:00:00.000Z' }));
const syncCurrentRevision = getProductionGraphRevision(syncDispatcher.getGraph());
const coordinator = new SyncCoordinator(
  createSyncSession({ id: 'sync-coordinator-test', broadcastSessionId: 'test-session', productionGraphId: syncDispatcher.getGraph().id, currentGraphRevision: syncCurrentRevision }),
  syncDispatcher,
  transport,
);
coordinator.joinClient({ clientId: 'tester-client', operatorId: 'tester', displayName: 'Tester', observedGraphRevision: syncCurrentRevision, metadata: {} });
assert(coordinator.listClients().length === 1, 'client join registers client');
coordinator.leaveClient('missing-client');
assert(coordinator.listClients().length === 1, 'client leave ignores unknown client');
const acceptedTransition = coordinator.submitCommand('tester-client', command('CREATE_SCENE', { id: 'sync-scene', name: 'Sync' }, 'DIRECTOR', syncCurrentRevision));
assert(acceptedTransition?.accepted, 'command submit accepted');
coordinator.submitCommand('tester-client', command('SET_PREVIEW_SCENE', { sceneId: 'sync-scene' }, 'DIRECTOR', 0));
assert(transport.sentMessages.some((message) => message.type === 'COMMAND_REJECTED'), 'stale command rejected');
assert(transport.sentMessages.some((message) => message.type === 'CLIENT_BEHIND'), 'CLIENT_BEHIND emitted');
assert(coordinator.requestCatchUp('tester-client')?.type, 'catch-up request returns response or resync message');
