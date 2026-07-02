const assert = {
  equal(actual: unknown, expected: unknown, message: string) {
    if (actual !== expected)
      throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  },
  deepEqual(actual: unknown, expected: unknown, message: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(message);
  },
};
import {
  applyProductionCommand,
  createBroadcastSession,
} from '../../shared/src/production-graph.js';
import {
  ExecutionLogStore,
  MediaExecutionEngine,
  MockMediaExecutionAdapter,
  BrowserMediaSourceManager,
  WebRTCMediaExecutionAdapter,
  stopAllTracks,
  configureMockExecutionLatency,
  replayExecutionForRevision,
  summarizeExecutionForRevision,
  translateGraphTransitionToIntents,
} from './index.js';

const command = (
  type: Parameters<typeof applyProductionCommand>[1]['type'],
  payload: Record<string, unknown> = {},
  expectedRevision = 0,
) => ({
  id: `test-${type.toLowerCase()}-${expectedRevision}`,
  type,
  broadcastSessionId: 'test-session',
  actorId: 'tester',
  actorRole: 'DIRECTOR' as const,
  timestamp: '2026-07-01T00:00:00.000Z',
  expectedRevision,
  payload,
});

let session = createBroadcastSession({
  id: 'test-session',
  operatorId: 'tester',
  timestamp: '2026-07-01T00:00:00.000Z',
});
let transition = applyProductionCommand(
  session.graph,
  command('CREATE_SCENE', { id: 'scene-a', name: 'Scene A' }),
);
session = { ...session, graph: transition.nextGraph };
transition = applyProductionCommand(
  session.graph,
  command('SET_PREVIEW_SCENE', { sceneId: 'scene-a' }, 1),
);

const previewIntents = translateGraphTransitionToIntents(transition);
assert.equal(previewIntents.length, 1, 'graph transition generates intent');
assert.equal(
  previewIntents[0]?.type,
  'UPDATE_PREVIEW_SCENE',
  'SET_PREVIEW_SCENE triggers UPDATE_PREVIEW_SCENE',
);
assert.deepEqual(
  previewIntents,
  translateGraphTransitionToIntents(transition),
  'mapping is deterministic',
);

const cutTransition = applyProductionCommand(
  transition.nextGraph,
  command('CUT_TO_PROGRAM', { sceneId: 'scene-a' }, 2),
);
assert.equal(
  translateGraphTransitionToIntents(cutTransition)[0]?.type,
  'SWITCH_PROGRAM_SCENE',
  'CUT triggers SWITCH_PROGRAM_SCENE',
);

const recordingTransition = applyProductionCommand(
  cutTransition.nextGraph,
  command('START_RECORDING', {}, 3),
);
assert.equal(
  translateGraphTransitionToIntents(recordingTransition)[0]?.type,
  'START_RECORDING',
  'START_RECORDING triggers intent',
);

const disabledStore = new ExecutionLogStore();
const disabledEngine = new MediaExecutionEngine(disabledStore);
const disabledAdapter = new MockMediaExecutionAdapter({ latencyMs: 4 });
disabledEngine.registerAdapter(disabledAdapter);
disabledEngine.setExecutionRuntimeMode('disabled');
const disabledResults = await disabledEngine.onGraphTransition(recordingTransition);
assert.equal(disabledAdapter.getLoggedIntents().length, 0, 'disabled mode never executes adapters');
assert.equal(
  disabledResults[0]?.adapterResponses.length,
  0,
  'disabled result skips adapter responses',
);

const dryRunEngine = new MediaExecutionEngine(new ExecutionLogStore());
const dryRunAdapter = new MockMediaExecutionAdapter({ latencyMs: 7 });
dryRunEngine.registerAdapter(dryRunAdapter);
dryRunEngine.setExecutionRuntimeMode('dry_run');
const dryRunResults = await dryRunEngine.onGraphTransition(recordingTransition);
assert.equal(dryRunAdapter.getLoggedIntents().length, 0, 'dry run never executes adapters');
assert.equal(
  dryRunResults[0]?.warnings[0],
  'Dry run recorded; adapter execution skipped',
  'dry run records skip warning',
);
assert.equal(
  dryRunEngine.listExecutionEvents().some((event) => event.type === 'DRY_RUN_RECORDED'),
  true,
  'execution stream records dry run event',
);

const logStore = new ExecutionLogStore();
const engine = new MediaExecutionEngine(logStore);
const mock = new MockMediaExecutionAdapter({ latencyMs: 12 });
engine.registerAdapter(mock);
engine.setExecutionRuntimeMode('mock_live');
const results = await engine.onGraphTransition(recordingTransition);
assert.equal(results[0]?.success, true, 'mock adapter executes successfully');
assert.equal(mock.getLoggedIntents().length, 1, 'mock live calls mock adapter');
assert.equal(
  logStore.queryByRevision(recordingTransition.nextRevision).length,
  1,
  'execution log records results',
);
assert.equal(
  engine.getExecutionState().lastResults[0]?.adapterResponses[0]?.latencyMs,
  12,
  'mock adapter reports simulated latency',
);
assert.equal(
  engine.getAdapterRegistry().listAvailableAdapters().length,
  1,
  'adapter registry lists registered adapters',
);
engine.setAdapterEnabled('MockMediaExecutionAdapter', false);
assert.equal(
  engine.getAdapterRegistry().reportAdapterHealth('MockMediaExecutionAdapter')?.status,
  'disabled',
  'adapter registry disables adapters',
);
engine.setAdapterEnabled('MockMediaExecutionAdapter', true);
assert.equal(
  engine.getAdapterRegistry().reportAdapterHealth('MockMediaExecutionAdapter')?.status,
  'enabled',
  'adapter registry enables adapters',
);
assert.equal(
  replayExecutionForRevision(engine, recordingTransition.nextRevision).every(
    (event) => event.payload !== undefined,
  ),
  true,
  'replay returns diagnostic events',
);
assert.equal(
  summarizeExecutionForRevision(engine, recordingTransition.nextRevision).intentCount,
  1,
  'revision summary includes intents',
);
const graphBeforeReplay = JSON.stringify(recordingTransition.nextGraph);
replayExecutionForRevision(engine, recordingTransition.nextRevision);
assert.equal(
  JSON.stringify(recordingTransition.nextGraph),
  graphBeforeReplay,
  'replay does not mutate graph',
);

configureMockExecutionLatency({
  minLatencyMs: 10,
  maxLatencyMs: 20,
  failureRate: 0,
  warningRate: 1,
  seed: 42,
});
const deterministicA = new MockMediaExecutionAdapter({
  latency: { minLatencyMs: 10, maxLatencyMs: 20, warningRate: 1, seed: 42 },
}).execute(previewIntents[0]!);
const deterministicB = new MockMediaExecutionAdapter({
  latency: { minLatencyMs: 10, maxLatencyMs: 20, warningRate: 1, seed: 42 },
}).execute(previewIntents[0]!);
assert.deepEqual(deterministicA, deterministicB, 'latency simulation is deterministic');
assert.equal(deterministicA.warnings.length, 1, 'warning rate can be configured');

const health = engine.getMediaExecutionHealth();
assert.equal(health.executedIntentCount, 1, 'execution health counts executed intents');
assert.equal(
  engine.summarizeExecutionHealth().includes('mock_live'),
  true,
  'execution health summary includes runtime mode',
);
assert.equal(
  Boolean(engine.getExecutionState().executionHealth && engine.getExecutionState().adapterRegistry),
  true,
  'inspector data shape is valid',
);


const webRTC = new WebRTCMediaExecutionAdapter();
assert.equal(webRTC.getName(), 'WebRTCMediaExecutionAdapter', 'WebRTC adapter can be constructed');
assert.equal(
  webRTC.getCapabilities().includes('SWITCH_PROGRAM_SCENE'),
  true,
  'WebRTC adapter declares safe capabilities',
);
const unsupported = webRTC.execute(
  {
    id: 'unsupported-start-stream',
    type: 'START_STREAM',
    timestamp: '2026-07-01T00:00:00.000Z',
    graphRevision: 1,
    payload: {},
  },
  recordingTransition.nextGraph,
);
assert.equal(unsupported.success, false, 'unsupported WebRTC intent fails structurally');
assert.equal(
  unsupported.errors[0]?.startsWith('UNSUPPORTED_INTENT'),
  true,
  'unsupported WebRTC intent returns structured error',
);
const manager = new BrowserMediaSourceManager();
let stopped = false;
const streamLike = {
  id: 'mock-stream',
  getAudioTracks: () => [{ readyState: 'live', stop: () => undefined }],
  getVideoTracks: () => [],
  getTracks: () => [{ readyState: 'live', stop: () => { stopped = true; } }],
} as unknown as MediaStream;
const metadata = manager.registerStream(streamLike, { sourceId: 'camera-a', kind: 'camera' });
assert.equal(metadata.hasAudio, true, 'source manager tracks audio availability');
assert.equal(manager.getStream('camera-a')?.id, 'mock-stream', 'source manager returns streams by source');
assert.equal(manager.unregisterStream('camera-a')?.sourceId, 'camera-a', 'source manager unregisters streams');
stopAllTracks(streamLike);
assert.equal(stopped, true, 'stopAllTracks stops stream tracks');
stopAllTracks(undefined);

const liveReadyEngine = new MediaExecutionEngine(new ExecutionLogStore());
liveReadyEngine.registerAdapter(new MockMediaExecutionAdapter({ latencyMs: 1 }), {
  id: 'mock-live-ready-test',
  name: 'Mock Live Ready Test',
  isMock: true,
  isLive: false,
});
liveReadyEngine.registerAdapter(webRTC, {
  id: 'webrtc-live-ready-test',
  name: 'WebRTC Live Ready Test',
  type: 'webrtc',
  status: 'enabled',
  capabilities: webRTC.getCapabilities(),
  isMock: false,
  isLive: true,
});
liveReadyEngine.setExecutionRuntimeMode('live_ready');
assert.equal(
  liveReadyEngine.getExecutionState().activeAdapter?.id,
  'webrtc-live-ready-test',
  'live_ready mode can select WebRTC adapter',
);
liveReadyEngine.setExecutionRuntimeMode('mock_live');
assert.equal(
  liveReadyEngine.getExecutionState().activeAdapter?.id,
  'mock-live-ready-test',
  'mock_live mode still selects mock adapter',
);
