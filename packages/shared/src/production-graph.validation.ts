import {
  MockAgentPlaneAdapter,
  MockMediaExecutionAdapter,
  applyProductionCommand,
  createInitialProductionGraph,
  InMemoryProductionEventLog,
  selectPreviewScene,
  selectProgramScene,
  type ProductionCommand,
} from './production-graph.js';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}
const command = (type: ProductionCommand['type'], payload: Record<string, unknown> = {}, role: ProductionCommand['actorRole'] = 'DIRECTOR'): ProductionCommand => ({
  id: `test-${type}-${JSON.stringify(payload)}`,
  type,
  broadcastSessionId: 'test-session',
  actorId: 'tester',
  actorRole: role,
  timestamp: '2026-07-01T00:00:00.000Z',
  payload,
});

let graph = createInitialProductionGraph({ broadcastSessionId: 'test-session', timestamp: '2026-07-01T00:00:00.000Z' });
assert(graph.graphVersion === 1 && graph.schemaVersion, 'initial graph includes version metadata');
let transition = applyProductionCommand(graph, command('CREATE_SCENE', { id: 'scene-a', name: 'A' }));
assert(transition.accepted, 'CREATE_SCENE accepted');
graph = transition.nextGraph;
transition = applyProductionCommand(graph, command('SET_PREVIEW_SCENE', { sceneId: 'scene-a' }));
assert(transition.nextGraph.preview.sceneId === 'scene-a', 'SET_PREVIEW_SCENE updates preview');
assert(selectPreviewScene(transition.nextGraph)?.id === 'scene-a', 'preview selector returns scene');
graph = transition.nextGraph;
transition = applyProductionCommand(graph, command('TAKE_PREVIEW'));
assert(transition.nextGraph.program.sceneId === 'scene-a', 'TAKE_PREVIEW updates program');
assert(selectProgramScene(transition.nextGraph)?.id === 'scene-a', 'program selector returns scene');
graph = transition.nextGraph;
transition = applyProductionCommand(graph, command('CUT_TO_PROGRAM', { sceneId: 'scene-a' }));
assert(transition.nextGraph.program.transitionType === 'cut', 'CUT_TO_PROGRAM sets cut transition');
const rejected = applyProductionCommand(graph, command('STOP_BROADCAST', {}, 'VIEWER'));
assert(!rejected.accepted, 'unauthorized role command rejected');
assert(rejected.events.some((event) => event.type === 'COMMAND_REJECTED'), 'COMMAND_REJECTED emitted');
const eventLog = new InMemoryProductionEventLog();
transition.events.forEach((event) => eventLog.appendProductionEvent(event));
assert(eventLog.getProductionEventsForSession('test-session').length === transition.events.length, 'event log records events');
const media = new MockMediaExecutionAdapter();
media.onGraphUpdated(transition);
assert((media.renderState.program as { sceneId?: string }).sceneId === 'scene-a', 'mock media reacts to transition');
const live = applyProductionCommand(graph, command('START_BROADCAST'));
const agentCommands = new MockAgentPlaneAdapter().observeTransition(live);
assert(agentCommands[0]?.type === 'ADD_AGENT_SUGGESTION', 'mock agent creates suggestion command');
assert(live.nextGraph.agentSuggestions && Object.keys(live.nextGraph.agentSuggestions).length === 0, 'mock agent does not mutate graph directly');
console.log('Production graph validation passed');
