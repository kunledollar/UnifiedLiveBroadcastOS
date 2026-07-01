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
