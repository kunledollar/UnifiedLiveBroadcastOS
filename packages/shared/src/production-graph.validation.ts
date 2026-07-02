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
import {
  InMemoryAuthorityStore,
  acquireLock,
  arbitrateProductionCommand,
  createCommandConflict,
  createMockAuthorityScenario,
  createSessionAuthority,
  expireLocks,
  getAuthorityScopeForCommand,
  getLockForScope,
  releaseLock,
  renewLock,
  roleHasAuthority,
} from './authority.js';
import {
  createBroadcastSessionRecord,
  createGraphSnapshot,
  createInMemoryPersistentBroadcastRepositories,
  createPersistenceDiagnostics,
  createProductionCommandRecord,
  createProductionEventRecord,
  createSyncCheckpointRecord,
  getRecoveryPlan,
  recoverSessionFromLatestSnapshot,
  restoreGraphFromSnapshot,
  shouldCreateGraphSnapshot,
} from './persistence.js';
import {
  createCircuitBreakerState,
  createFailureRecord,
  createFrameFailure,
  recordCircuitBreakerFailure,
  recordCircuitBreakerSuccess,
  selectRecoveryPolicy,
  shouldAttemptHalfOpen,
  shouldEscalateFailure,
  shouldOpenCircuit,
  shouldRetryFailure,
  summarizeFailureState,
} from './failure-recovery.js';
import {
  appendReplayTimelineEvent,
  compareFramePlans,
  createDryRunReplay,
  createReplayCheckpoint,
  createReplayTimeline,
  detectNonReplayablePayload,
  detectReplayDivergence,
  detectReplayGap,
  getReplayPlan,
  reconstructGraphFromCheckpoint,
  replayCommandsToRevision,
  selectNearestCheckpoint,
  summarizeAuditTrail,
  validateReplayCheckpoint,
  type ReplaySnapshot,
  type ReplayableFramePlan,
  type UBOSReplaySession,
} from './replay.js';


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
assert(
  store.getCollaborationSession().operators['guest-manager'],
  'operator joins collaboration session',
);
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
  isOperatorBehindGraph(
    store.getCollaborationSession().operators.producer!,
    store.getCollaborationSession(),
  ),
  'operator revision lag is detected',
);
assert(
  getRevisionLag(
    store.getCollaborationSession().operators.producer!,
    store.getCollaborationSession(),
  ) === 3,
  'revision lag helper returns current delta',
);
store.markOperatorSynced('producer', 3);
assert(
  getRevisionLag(
    store.getCollaborationSession().operators.producer!,
    store.getCollaborationSession(),
  ) === 0,
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
assert(
  store.getCollaborationSession().currentGraphRevision === 1,
  'command broadcast updates session revision',
);
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
  canCollaborationOperatorExecuteCommand(
    store.getCollaborationSession().operators.audio!,
    'SET_AUDIO_GAIN',
  ),
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
assert(
  envelope.id && envelope.type === 'CLIENT_HEARTBEAT',
  'sync envelope creation assigns id and type',
);

const serializedEnvelope = serializeSyncEnvelope(envelope);
assert(
  deserializeSyncEnvelope(serializedEnvelope).id === envelope.id,
  'sync envelope serialization round-trips',
);
assert(validateSyncEnvelope(envelope), 'sync envelope validation accepts valid messages');
assert(
  !validateSyncEnvelope({ type: 'CLIENT_HEARTBEAT' }),
  'sync envelope validation rejects invalid messages',
);
const heartbeatEnvelope = createHeartbeatEnvelope({
  sessionId: syncSession.id,
  broadcastSessionId: syncSession.broadcastSessionId,
  clientId: directorClient.clientId,
  operatorId: directorClient.operatorId,
  graphRevision: syncSession.currentGraphRevision,
});
assert(
  heartbeatEnvelope.type === 'CLIENT_HEARTBEAT',
  'heartbeat envelope helper creates heartbeat messages',
);
const websocketClient = new WebSocketSyncClient({
  url: 'ws://localhost:4000/realtime/sync',
  maxReconnectAttempts: 1,
});
const websocketTransport = new WebSocketSyncTransport(websocketClient);
assert(
  websocketTransport.getState() === 'idle',
  'websocket sync transport constructs in idle state',
);
assert(
  isRealtimeSyncEnabled({
    NEXT_PUBLIC_UBOS_REALTIME_SYNC: 'true',
    NEXT_PUBLIC_UBOS_SYNC_URL: 'ws://localhost:4000/realtime/sync',
  }),
  'realtime sync feature flag enables websocket transport',
);

const ack = createRevisionAck(producerClient, syncSession.currentGraphRevision);
const ackedSession = applyRevisionAck(syncSession, ack);
assert(
  isClientSynced(ackedSession.clients['producer-client']!, ackedSession),
  'revision acknowledgement marks client current',
);
assert(
  getClientRevisionLag(producerClient, syncSession) >= 0,
  'revision lag calculation is non-negative',
);
assert(
  markClientSynced(producerClient, syncSession).recoveryState === 'synced',
  'markClientSynced sets recovery state',
);
const heartbeatClient = updateClientHeartbeat(
  producerClient,
  {
    clientId: producerClient.clientId,
    operatorId: producerClient.operatorId,
    sentAt: '2026-07-01T00:00:10.000Z',
    observedGraphRevision: syncSession.currentGraphRevision,
  },
  syncSession.currentGraphRevision,
);
assert(
  heartbeatClient.lastHeartbeatAt === '2026-07-01T00:00:10.000Z',
  'heartbeat update stores last heartbeat',
);
assert(
  isClientStale(
    { ...producerClient, lastHeartbeatAt: '2026-07-01T00:00:00.000Z' },
    1000,
    Date.parse('2026-07-01T00:00:02.000Z'),
  ),
  'stale client detection works',
);
assert(
  getStaleClients(syncSession, 1, Date.now()).length >= 0,
  'stale client listing returns array',
);
assert(
  getMissingRevisionRange(1, 3)?.fromRevision === 2,
  'missing revision range starts after observed revision',
);
const catchUpRequest = createCatchUpRequest(
  {
    sessionId: syncSession.id,
    broadcastSessionId: syncSession.broadcastSessionId,
    clientId: producerClient.clientId,
    operatorId: producerClient.operatorId,
    graphRevision: syncSession.currentGraphRevision,
  },
  producerClient.observedGraphRevision,
);
assert(catchUpRequest.type === 'GRAPH_REVISION_REQUEST', 'catch-up request created');
const catchUpResponse = createCatchUpResponse(
  {
    sessionId: syncSession.id,
    broadcastSessionId: syncSession.broadcastSessionId,
    clientId: producerClient.clientId,
    operatorId: producerClient.operatorId,
    graphRevision: syncSession.currentGraphRevision,
  },
  [],
  1,
  2,
);
assert(catchUpResponse.type === 'EVENTS_BATCH', 'catch-up response created');
const resync = createResyncRequiredMessage(
  {
    sessionId: syncSession.id,
    broadcastSessionId: syncSession.broadcastSessionId,
    clientId: producerClient.clientId,
    operatorId: producerClient.operatorId,
    graphRevision: syncSession.currentGraphRevision,
  },
  0,
  syncSession.currentGraphRevision,
);
assert(resync.type === 'CLIENT_RESYNC_REQUIRED', 'resync required message created');
const transport = new LocalSyncTransport();
const syncDispatcher = new LocalProductionCommandDispatcher(
  createBroadcastSession({
    id: 'test-session',
    operatorId: 'tester',
    timestamp: '2026-07-01T00:00:00.000Z',
  }),
);
const syncCurrentRevision = getProductionGraphRevision(syncDispatcher.getGraph());
const coordinator = new SyncCoordinator(
  createSyncSession({
    id: 'sync-coordinator-test',
    broadcastSessionId: 'test-session',
    productionGraphId: syncDispatcher.getGraph().id,
    currentGraphRevision: syncCurrentRevision,
  }),
  syncDispatcher,
  transport,
);
coordinator.joinClient({
  clientId: 'tester-client',
  operatorId: 'tester',
  displayName: 'Tester',
  observedGraphRevision: syncCurrentRevision,
  metadata: {},
});
assert(coordinator.listClients().length === 1, 'client join registers client');
coordinator.leaveClient('missing-client');
assert(coordinator.listClients().length === 1, 'client leave ignores unknown client');
const acceptedTransition = coordinator.submitCommand(
  'tester-client',
  command('CREATE_SCENE', { id: 'sync-scene', name: 'Sync' }, 'DIRECTOR', syncCurrentRevision),
);
assert(acceptedTransition?.accepted, 'command submit accepted');
coordinator.submitCommand(
  'tester-client',
  command('SET_PREVIEW_SCENE', { sceneId: 'sync-scene' }, 'DIRECTOR', 0),
);
assert(
  transport.sentMessages.some((message) => message.type === 'COMMAND_REJECTED'),
  'stale command rejected',
);
assert(
  transport.sentMessages.some((message) => message.type === 'CLIENT_BEHIND'),
  'CLIENT_BEHIND emitted',
);
assert(
  coordinator.requestCatchUp('tester-client')?.type,
  'catch-up request returns response or resync message',
);

const authority = createSessionAuthority('test-session', '2026-07-01T00:00:00.000Z');
assert(
  getAuthorityScopeForCommand('SET_PREVIEW_SCENE') === 'preview',
  'authority scope resolution maps preview commands',
);
assert(
  roleHasAuthority('AUDIO_ENGINEER', 'audio'),
  'role authority check allows audio engineer on audio',
);
assert(!roleHasAuthority('VIEWER', 'program'), 'role authority check denies viewer mutations');
let lockSet = acquireLock([], {
  sessionId: 'test-session',
  scope: 'audio',
  ownerOperatorId: 'audio',
  ownerRole: 'AUDIO_ENGINEER',
  at: '2026-07-01T00:00:00.000Z',
  ttlMs: 1000,
});
assert(
  lockSet.accepted && getLockForScope(lockSet.locks, 'audio', '2026-07-01T00:00:00.500Z'),
  'lock acquire stores active lock',
);
const renewedLocks = renewLock(
  lockSet.locks,
  lockSet.lock.id,
  'audio',
  2000,
  '2026-07-01T00:00:00.500Z',
);
assert(
  getLockForScope(renewedLocks, 'audio', '2026-07-01T00:00:02.000Z'),
  'lock renewal extends lease',
);
const expiredLocks = expireLocks(renewedLocks, '2026-07-01T00:00:03.000Z');
assert(expiredLocks[0]?.status === 'expired', 'lock expiration marks stale lease expired');
const releasedLocks = releaseLock(
  renewedLocks,
  lockSet.lock.id,
  'owner',
  'OWNER',
  '2026-07-01T00:00:01.000Z',
);
assert(releasedLocks[0]?.status === 'released', 'owner override can release another operator lock');
const locked = acquireLock([], {
  sessionId: 'test-session',
  scope: 'program',
  ownerOperatorId: 'director',
  ownerRole: 'DIRECTOR',
  at: '2026-07-01T00:00:00.000Z',
  ttlMs: 10000,
});
assert(
  !acquireLock(locked.locks, {
    sessionId: 'test-session',
    scope: 'program',
    ownerOperatorId: 'producer',
    ownerRole: 'PRODUCER',
    at: '2026-07-01T00:00:01.000Z',
  }).accepted,
  'non-authorized operator cannot override active lock',
);
const acceptedAuthority = arbitrateProductionCommand({
  command: command(
    'SET_AUDIO_GAIN',
    { channelId: 'a', gain: 0.5 },
    'AUDIO_ENGINEER',
    getProductionGraphRevision(graph),
  ),
  authority,
  locks: [],
  graph,
});
assert(acceptedAuthority.decision.allowed, 'command arbitration accepts authorized command');
const deniedAuthority = arbitrateProductionCommand({
  command: command(
    'SET_PREVIEW_SCENE',
    { sceneId: 'scene-a' },
    'VIEWER',
    getProductionGraphRevision(graph),
  ),
  authority,
  locks: [],
  graph,
});
assert(
  !deniedAuthority.decision.allowed && 'conflict' in deniedAuthority,
  'command arbitration rejects authority violation with conflict',
);
const lockDenied = arbitrateProductionCommand({
  command: command('TAKE_PREVIEW', {}, 'TECHNICAL_DIRECTOR', getProductionGraphRevision(graph)),
  authority,
  locks: locked.locks,
  graph,
  at: '2026-07-01T00:00:01.000Z',
});
assert(
  !lockDenied.decision.allowed && lockDenied.decision.reason === 'LOCKED_SCOPE',
  'command arbitration rejects locked scope',
);
const conflict = createCommandConflict({
  sessionId: 'test-session',
  commandId: 'conflict-command',
  actorId: 'tester',
  actorRole: 'DIRECTOR',
  commandType: 'TAKE_PREVIEW',
  scope: 'program',
  type: 'REVISION_MISMATCH',
  message: 'mock conflict',
});
const authorityStore = new InMemoryAuthorityStore('test-session');
authorityStore.appendConflict(conflict);
assert(
  authorityStore.resolveConflict(conflict.id, 'manual')?.status === 'resolved',
  'conflict resolution updates status',
);
const mockAuthority = createMockAuthorityScenario('test-session');
assert(
  mockAuthority.getAuthorityState().scopes.program.owner?.operatorId === 'director' &&
    mockAuthority.listConflicts().length >= 2,
  'authority diagnostics data shape includes owners and conflicts',
);

const persistenceRepos = createInMemoryPersistentBroadcastRepositories();
const sessionRecord = persistenceRepos.sessions.upsert(
  createBroadcastSessionRecord({
    graph,
    ownerOperatorId: 'tester',
    activeOperatorIds: ['tester'],
    timestamp: '2026-07-01T00:00:00.000Z',
  }),
);
assert(
  sessionRecord.id === 'test-session' &&
    sessionRecord.currentGraphRevision === getProductionGraphRevision(graph),
  'session record creation stores current graph revision',
);
const snapshotRecord = persistenceRepos.snapshots.append(
  createGraphSnapshot(graph, { reason: 'validation' }, '2026-07-01T00:00:01.000Z'),
);
assert(
  snapshotRecord.graphRevision === getProductionGraphRevision(graph),
  'graph snapshot creation stores revision',
);
assert(
  restoreGraphFromSnapshot(snapshotRecord).id === graph.id,
  'graph restore from snapshot returns graph payload',
);
assert(
  !shouldCreateGraphSnapshot(1, 0, 25) && shouldCreateGraphSnapshot(25, 0, 25),
  'snapshot policy helper checks revision interval',
);
const persistedCommand = persistenceRepos.commands.append(
  createProductionCommandRecord(
    command(
      'CREATE_SCENE',
      { id: 'persisted-scene', name: 'Persisted' },
      'DIRECTOR',
      getProductionGraphRevision(graph),
    ),
    graph.id,
    true,
    getProductionGraphRevision(graph) + 1,
  ),
);
assert(
  persistenceRepos.commands.list('test-session').length === 1,
  'command log append stores immutable command record',
);
const mutationAttempt = persistedCommand as { accepted: boolean };
try {
  mutationAttempt.accepted = false;
} catch {}
assert(
  persistenceRepos.commands.list('test-session')[0]?.accepted,
  'immutable command behavior prevents stored mutation',
);
const persistedEvent = persistenceRepos.events.append(
  createProductionEventRecord(transition.events[0]!, graph.id),
);
assert(
  persistenceRepos.events.list('test-session').length === 1 &&
    persistedEvent.commandId === transition.command.id,
  'event log append stores immutable event record',
);
const eventMutation = persistedEvent as { actorId: string };
try {
  eventMutation.actorId = 'mutated';
} catch {}
assert(
  persistenceRepos.events.list('test-session')[0]?.actorId !== 'mutated',
  'immutable event behavior prevents stored mutation',
);
const recovered = recoverSessionFromLatestSnapshot({
  sessionId: 'test-session',
  snapshots: persistenceRepos.snapshots,
  events: persistenceRepos.events,
});
assert(recovered.status === 'replayed', 'recovery from snapshot plus events succeeds');
assert(
  getRecoveryPlan({
    sessionId: 'test-session',
    currentRevision: sessionRecord.currentGraphRevision,
    snapshots: persistenceRepos.snapshots,
    events: persistenceRepos.events,
    commands: persistenceRepos.commands,
  }).status === 'ready',
  'recovery plan reports ready when snapshot exists',
);
const checkpoint = persistenceRepos.collaboration.upsertCheckpoint(
  createSyncCheckpointRecord({
    clientId: 'client-1',
    operatorId: 'tester',
    broadcastSessionId: 'test-session',
    observedGraphRevision: getProductionGraphRevision(graph),
    lastHeartbeatAt: '2026-07-01T00:00:02.000Z',
    connectionState: 'connected',
  }),
);
assert(
  checkpoint.id && persistenceRepos.collaboration.listCheckpoints('test-session').length === 1,
  'sync checkpoint creation persists checkpoint',
);
persistenceRepos.authority.appendConflict(conflict);
persistenceRepos.authority.appendLock(locked.lock);
assert(
  persistenceRepos.authority.listConflicts('test-session').length === 1 &&
    persistenceRepos.authority.listActiveLocks('test-session', '2026-07-01T00:00:01.000Z')
      .length === 1,
  'authority conflict persistence stores conflict and active lock',
);
const diagnostics = createPersistenceDiagnostics({
  session: sessionRecord,
  latestSnapshot: snapshotRecord,
  commandCount: persistenceRepos.commands.list('test-session').length,
  eventCount: persistenceRepos.events.list('test-session').length,
  collaborationEventCount: persistenceRepos.collaboration.listEvents('test-session').length,
  activeLocksCount: persistenceRepos.authority.listActiveLocks('test-session').length,
  conflictsCount: persistenceRepos.authority.listConflicts('test-session').length,
  syncCheckpointCount: persistenceRepos.collaboration.listCheckpoints('test-session').length,
  recoveryStatus: 'ready',
});
assert(
  diagnostics.commandLogCount === 1 && diagnostics.syncCheckpointCount === 1,
  'persistence diagnostics summarize repository state',
);

const rendererFailure = createFailureRecord({
  id: 'failure-validation-renderer',
  category: 'RENDERER_FAILURE',
  subsystem: 'browser-renderer',
  message: 'Renderer validation failure',
  createdAt: '2026-07-01T00:00:04.000Z',
});
assert(
  rendererFailure.category === 'RENDERER_FAILURE' && rendererFailure.recoveryPolicy === 'fallback',
  'failure record creation classifies renderer fallback',
);
assert(
  selectRecoveryPolicy(rendererFailure) === 'fallback',
  'recovery policy selection uses category defaults',
);
assert(shouldRetryFailure(rendererFailure), 'retry decision allows recoverable renderer failures');
const exhaustedFailure = createFailureRecord({
  ...rendererFailure,
  retryCount: 3,
  message: 'Renderer exhausted retries',
});
assert(
  shouldEscalateFailure(exhaustedFailure),
  'escalation decision triggers after retry threshold',
);
let breaker = createCircuitBreakerState('renderer-breaker', 2, 1000);
breaker = recordCircuitBreakerFailure(breaker, '2026-07-01T00:00:00.000Z');
assert(
  !shouldOpenCircuit(breaker) && breaker.status === 'closed',
  'circuit breaker remains closed before threshold',
);
breaker = recordCircuitBreakerFailure(breaker, '2026-07-01T00:00:01.000Z');
assert(breaker.status === 'open', 'circuit breaker opens at threshold');
assert(
  shouldAttemptHalfOpen(breaker, Date.parse('2026-07-01T00:00:02.500Z')),
  'circuit breaker allows half-open after cooldown',
);
breaker = recordCircuitBreakerSuccess(
  { ...breaker, status: 'half_open' },
  '2026-07-01T00:00:03.000Z',
);
assert(
  breaker.status === 'closed' && breaker.failureCount === 0,
  'circuit breaker success closes circuit',
);
const summary = summarizeFailureState([rendererFailure], ['renderer_placeholder_mode']);
assert(
  summary.active === 1 && summary.degradedModes.includes('renderer_placeholder_mode'),
  'degraded mode summary includes active renderer mode',
);
const frameFailure = createFrameFailure({
  id: 'frame-failure-validation',
  frameFailureType: 'FRAME_RENDER_FAILED',
  frameId: 'frame-1',
  message: 'Frame render failed',
  createdAt: '2026-07-01T00:00:05.000Z',
});
assert(
  frameFailure.frameId === 'frame-1' && frameFailure.metadata.graphMutationAllowed === false,
  'frame failure shape forbids graph mutation',
);

import {
  calculateQueuePressure,
  calculateSchedulerPressure,
  createQueueBudget,
  shouldDropWork,
  shouldPauseProducer,
  shouldThrottleSubsystem,
  summarizeQueueHealth,
  summarizeSystemLoad,
  type QueueMetrics,
} from './backpressure.js';

const commandQueueBudget = createQueueBudget({
  queue: 'COMMAND_QUEUE',
  maxSize: 100,
  priority: 'CRITICAL',
  overflowPolicy: 'BLOCK',
});
const diagnosticQueueBudget = createQueueBudget({
  queue: 'DIAGNOSTIC_QUEUE',
  maxSize: 100,
  priority: 'LOW',
  overflowPolicy: 'DROP_OLDEST',
});
const busyCommandMetrics: QueueMetrics = {
  queue: 'COMMAND_QUEUE',
  depth: 50,
  oldestItemAgeMs: 20,
  enqueueRatePerSecond: 10,
  dequeueRatePerSecond: 9,
};
const overloadedDiagnosticMetrics: QueueMetrics = {
  queue: 'DIAGNOSTIC_QUEUE',
  depth: 95,
  oldestItemAgeMs: 2000,
  enqueueRatePerSecond: 80,
  dequeueRatePerSecond: 20,
};
assert(
  calculateQueuePressure(busyCommandMetrics, commandQueueBudget) === 'BUSY',
  'queue pressure reaches BUSY at deterministic threshold',
);
assert(
  calculateQueuePressure(overloadedDiagnosticMetrics, diagnosticQueueBudget) === 'OVERLOADED',
  'queue pressure reaches OVERLOADED at deterministic threshold',
);
assert(
  calculateSchedulerPressure({ utilization: 0.76, queuePressures: ['BUSY'] }) === 'HEAVY',
  'scheduler pressure includes utilization',
);
assert(
  !shouldThrottleSubsystem('OVERLOADED', { priority: 'CRITICAL' }),
  'critical subsystem is not throttled before CRITICAL pressure',
);
assert(
  shouldThrottleSubsystem('HEAVY', { priority: 'LOW' }),
  'low priority subsystem throttles under HEAVY pressure',
);
assert(
  shouldDropWork('OVERLOADED', 'LOW', 'DROP_OLDEST'),
  'drop policy drops low-priority overloaded work',
);
assert(!shouldDropWork('OVERLOADED', 'CRITICAL', 'BLOCK'), 'critical blocked work is not dropped');
assert(
  shouldPauseProducer('HEAVY', 'PAUSE_PRODUCER'),
  'pause producer policy pauses under HEAVY pressure',
);
const diagnosticSummary = summarizeQueueHealth(overloadedDiagnosticMetrics, diagnosticQueueBudget);
assert(diagnosticSummary.health === 'stressed', 'overloaded queue summarizes as stressed health');
assert(diagnosticSummary.shouldDrop, 'overloaded diagnostic queue recommends dropping work');
const recoveringSummary = summarizeQueueHealth(
  { ...busyCommandMetrics, recovering: true },
  commandQueueBudget,
);
assert(recoveringSummary.health === 'recovering', 'recovering queues expose recovering health');
const systemLoad = summarizeSystemLoad({
  schedulerUtilization: 0.92,
  queues: [diagnosticSummary, recoveringSummary],
  activeDegradedModes: ['reduced_diagnostics'],
});
assert(
  systemLoad.pressure === 'OVERLOADED',
  'system load summarizes overloaded scheduler pressure',
);
assert(systemLoad.shedWork[0] === 'diagnostics', 'load shedding starts with diagnostics');
assert(
  systemLoad.shedWork.includes('confidence_monitoring'),
  'overloaded load shedding reaches confidence monitoring',
);
assert(
  systemLoad.activeDegradedModes.includes('reduced_diagnostics'),
  'system load preserves active degraded transitions',
);
console.log('Backpressure validation passed');


const replayBaseGraph = createInitialProductionGraph({
  broadcastSessionId: 'replay-session',
  timestamp: '2026-07-01T00:00:00.000Z',
});
const replayCreateScene: ProductionCommand = {
  id: 'replay-command-1',
  type: 'CREATE_SCENE',
  broadcastSessionId: 'replay-session',
  actorId: 'director-1',
  actorRole: 'DIRECTOR',
  timestamp: '2026-07-01T00:00:01.000Z',
  expectedRevision: 0,
  payload: { id: 'scene-replay', name: 'Replay Scene' },
  metadata: { sequence: 1, frameId: 'frame-1', authorityDecision: 'accepted' },
};
const replayTransition = applyProductionCommand(replayBaseGraph, replayCreateScene);
assert(replayTransition.accepted, 'replay fixture command is accepted');
const replaySnapshot: ReplaySnapshot = {
  id: 'snapshot-0',
  timestamp: replayBaseGraph.createdAt,
  graphRevision: replayBaseGraph.metadata.revision,
  graph: replayBaseGraph,
  metadata: {},
};
let replayTimeline = createReplayTimeline('timeline-validation', '2026-07-01T00:00:00.000Z');
replayTimeline = appendReplayTimelineEvent(replayTimeline, {
  id: 'timeline-command-1',
  timestamp: replayCreateScene.timestamp,
  graphRevision: 1,
  commandId: replayCreateScene.id,
  frameId: 'frame-1',
  category: 'command',
  payload: { commandType: replayCreateScene.type },
});
assert(replayTimeline.events.length === 1, 'replay timeline appends events immutably');
assert(replayTimeline.events[0]?.commandId === replayCreateScene.id, 'replay timeline preserves command metadata');
const replayCheckpoint = createReplayCheckpoint({
  id: 'checkpoint-0',
  timestamp: replayBaseGraph.createdAt,
  graphSnapshotRef: replaySnapshot.id,
  snapshot: replaySnapshot,
  graphRevision: 0,
  frameId: 'frame-0',
  commandSequence: 0,
  eventSequence: 0,
  metadata: {},
});
assert(validateReplayCheckpoint(replayCheckpoint).valid, 'replay checkpoint validates without raw media');
const laterCheckpoint = createReplayCheckpoint({
  id: 'checkpoint-1',
  timestamp: replayCreateScene.timestamp,
  graphSnapshotRef: 'snapshot-1',
  graphRevision: 1,
  frameId: 'frame-1',
  commandSequence: 1,
  eventSequence: 1,
  metadata: {},
});
assert(
  selectNearestCheckpoint([replayCheckpoint, laterCheckpoint], { graphRevision: 1 })?.id ===
    'checkpoint-1',
  'nearest replay checkpoint selection prefers closest prior revision',
);
const reconstructed = reconstructGraphFromCheckpoint(replayCheckpoint);
assert(reconstructed.ok && reconstructed.graph?.metadata.revision === 0, 'graph reconstructs from checkpoint clone');
const commandReplay = replayCommandsToRevision(replayBaseGraph, [replayCreateScene], 1);
assert(commandReplay.ok && commandReplay.graph?.metadata.revision === 1, 'command replay reaches target revision');
assert(replayBaseGraph.metadata.revision === 0, 'replay helpers do not mutate input graph');
assert(
  getReplayPlan({
    id: 'replay-session-model',
    mode: 'command_replay',
    status: 'planning',
    timeline: replayTimeline,
    checkpoints: [replayCheckpoint],
    commands: [replayCreateScene],
    events: replayTransition.events,
    framePlans: [],
    createdAt: replayBaseGraph.createdAt,
    metadata: {},
  }, { graphRevision: 0 }).checkpointId === 'checkpoint-0',
  'replay plan includes nearest checkpoint',
);
const framePlanA: ReplayableFramePlan = {
  id: 'plan-a',
  frameId: 'frame-1',
  frameTimestamp: 1000,
  graphRevision: 1,
  plannerRevision: 1,
  steps: [{ kind: 'compose', target: 'program' }],
};
const framePlanB: ReplayableFramePlan = { ...framePlanA, id: 'plan-b', steps: [{ kind: 'compose', target: 'program' }] };
assert(compareFramePlans(framePlanA, framePlanB).valid, 'frame plan comparison accepts deterministic shape');
assert(
  !compareFramePlans(framePlanA, { ...framePlanB, frameTimestamp: 1001 }).valid,
  'frame plan comparison detects timestamp divergence',
);
assert(
  !detectReplayGap([
    { id: 'event-1', previousRevision: 0, nextRevision: 1 },
    { id: 'event-3', previousRevision: 2, nextRevision: 3 },
  ]).valid,
  'replay gap detection detects revision gaps',
);
assert(
  !detectReplayDivergence({ revision: 1 }, { revision: 2 }).valid,
  'replay divergence detection detects mismatched payloads',
);
assert(
  !detectNonReplayablePayload({ mediaStream: { id: 'forbidden' } }).valid,
  'forbidden runtime payload detection rejects media stream keys',
);
const audit = summarizeAuditTrail({ commands: [replayCreateScene], events: replayTransition.events });
assert(audit[0]?.actorId === 'director-1' && audit[0]?.status === 'accepted', 'audit summary includes issuer and status');
const dryRun = createDryRunReplay({ id: 'dry-run-1', graphRevision: 1, executionMetadata: { planner: 'mock' } });
assert(dryRun.mode === 'dry_run_execution_replay', 'dry-run replay model is metadata-only');
console.log('Replay validation passed');
