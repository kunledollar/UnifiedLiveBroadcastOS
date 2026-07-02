const assert = {
  equal(actual: unknown, expected: unknown, message: string) {
    if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  },
  deepEqual(actual: unknown, expected: unknown, message: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message);
  },
};
import { applyProductionCommand, createBroadcastSession } from '../../shared/src/production-graph.js';
import { ExecutionLogStore, MediaExecutionEngine, MockMediaExecutionAdapter, translateGraphTransitionToIntents } from './index.js';

const command = (type: Parameters<typeof applyProductionCommand>[1]['type'], payload: Record<string, unknown> = {}, expectedRevision = 0) => ({
  id: `test-${type.toLowerCase()}`,
  type,
  broadcastSessionId: 'test-session',
  actorId: 'tester',
  actorRole: 'DIRECTOR' as const,
  timestamp: '2026-07-01T00:00:00.000Z',
  expectedRevision,
  payload,
});

let session = createBroadcastSession({ id: 'test-session', operatorId: 'tester', timestamp: '2026-07-01T00:00:00.000Z' });
let transition = applyProductionCommand(session.graph, command('CREATE_SCENE', { id: 'scene-a', name: 'Scene A' }));
session = { ...session, graph: transition.nextGraph };
transition = applyProductionCommand(session.graph, command('SET_PREVIEW_SCENE', { sceneId: 'scene-a' }, 1));

const previewIntents = translateGraphTransitionToIntents(transition);
assert.equal(previewIntents.length, 1, 'graph transition generates intent');
assert.equal(previewIntents[0]?.type, 'UPDATE_PREVIEW_SCENE', 'SET_PREVIEW_SCENE triggers UPDATE_PREVIEW_SCENE');
assert.deepEqual(previewIntents, translateGraphTransitionToIntents(transition), 'mapping is deterministic');

const cutTransition = applyProductionCommand(transition.nextGraph, command('CUT_TO_PROGRAM', { sceneId: 'scene-a' }, 2));
assert.equal(translateGraphTransitionToIntents(cutTransition)[0]?.type, 'SWITCH_PROGRAM_SCENE', 'CUT triggers SWITCH_PROGRAM_SCENE');

const recordingTransition = applyProductionCommand(cutTransition.nextGraph, command('START_RECORDING', {}, 3));
assert.equal(translateGraphTransitionToIntents(recordingTransition)[0]?.type, 'START_RECORDING', 'START_RECORDING triggers intent');

const logStore = new ExecutionLogStore();
const engine = new MediaExecutionEngine(logStore);
engine.registerAdapter(new MockMediaExecutionAdapter({ latencyMs: 12 }));
const results = await engine.onGraphTransition(recordingTransition);
assert.equal(results[0]?.success, true, 'mock adapter executes successfully');
assert.equal(logStore.queryByRevision(recordingTransition.nextRevision).length, 1, 'execution log records results');
assert.equal(engine.getExecutionState().lastResults[0]?.adapterResponses[0]?.latencyMs, 12, 'mock adapter reports simulated latency');
