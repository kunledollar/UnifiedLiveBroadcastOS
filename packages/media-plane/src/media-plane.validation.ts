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
  createClock,
  FrameScheduler,
  MediaSyncBus,
  SyncDriftMonitor,
  MediaSyncStore,
  isMediaSyncEnabled,
  type FrameTickEvent,
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
assert.equal(previewIntents.length > 0, true, 'graph transition generates intent');
assert.equal(
  previewIntents.some((intent) => intent.type === 'UPDATE_PREVIEW_SCENE'),
  true,
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
  translateGraphTransitionToIntents(cutTransition).some(
    (intent) => intent.type === 'SWITCH_PROGRAM_SCENE',
  ),
  true,
  'CUT triggers SWITCH_PROGRAM_SCENE',
);

const recordingTransition = applyProductionCommand(
  cutTransition.nextGraph,
  command('START_RECORDING', {}, 3),
);
assert.equal(
  translateGraphTransitionToIntents(recordingTransition).some(
    (intent) => intent.type === 'START_RECORDING',
  ),
  true,
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
  getTracks: () => [
    {
      readyState: 'live',
      stop: () => {
        stopped = true;
      },
    },
  ],
} as unknown as MediaStream;
const metadata = manager.registerStream(streamLike, { sourceId: 'camera-a', kind: 'camera' });
assert.equal(metadata.hasAudio, true, 'source manager tracks audio availability');
assert.equal(
  manager.getStream('camera-a')?.id,
  'mock-stream',
  'source manager returns streams by source',
);
assert.equal(
  manager.unregisterStream('camera-a')?.sourceId,
  'camera-a',
  'source manager unregisters streams',
);
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

import {
  CompositionStore,
  createDefaultCanvas,
  createSceneCompositionFromGraph,
  diffSceneCompositions,
  getLayoutBounds,
  validateLayerBounds,
  validateSceneComposition,
} from './compositor/index.js';

const canvas = createDefaultCanvas();
assert.equal(canvas.width, 1920, 'default canvas width is 1920');
assert.equal(canvas.height, 1080, 'default canvas height is 1080');
assert.equal(canvas.fps, 60, 'default canvas fps is 60');
assert.deepEqual(
  getLayoutBounds('fullscreen', 0, 1, canvas),
  { x: 0, y: 0, width: 1920, height: 1080 },
  'fullscreen bounds fill canvas',
);
assert.deepEqual(
  getLayoutBounds('side_by_side', 1, 2, canvas),
  { x: 960, y: 0, width: 960, height: 1080 },
  'side by side second layer uses right half',
);
assert.deepEqual(
  getLayoutBounds('picture_in_picture', 0, 2, canvas),
  { x: 0, y: 0, width: 1920, height: 1080 },
  'PiP primary fills canvas',
);
const verticalCanvas = createDefaultCanvas({ width: 1080, height: 1920, aspectRatio: '9:16' });
assert.deepEqual(
  getLayoutBounds('vertical_split', 1, 2, verticalCanvas),
  { x: 0, y: 960, width: 1080, height: 960 },
  'vertical split bounds bottom half',
);

const graphWithSources = {
  ...cutTransition.nextGraph,
  scenes: {
    ...cutTransition.nextGraph.scenes,
    'scene-a': {
      ...cutTransition.nextGraph.scenes['scene-a']!,
      sourceIds: ['source-a', 'missing-source', 'source-b'],
      metadata: { layoutPreset: 'side_by_side' },
    },
  },
  sources: {
    ...cutTransition.nextGraph.sources,
    'source-a': {
      id: 'source-a',
      name: 'Camera A',
      type: 'camera' as const,
      enabled: true,
      metadata: {},
    },
    'source-b': {
      id: 'source-b',
      name: 'Guest B',
      type: 'guest' as const,
      enabled: false,
      metadata: {},
    },
  },
};
const compositionA = createSceneCompositionFromGraph(graphWithSources, 'scene-a', {
  target: 'program',
});
const compositionB = createSceneCompositionFromGraph(graphWithSources, 'scene-a', {
  target: 'program',
});
assert.deepEqual(compositionA, compositionB, 'graph-to-composition translator is deterministic');
assert.equal(
  compositionA.layers[0]?.sourceId,
  'source-a',
  'layers preserve deterministic ordering',
);
assert.equal(
  validateSceneComposition(compositionA).some((issue) => issue.code === 'MISSING_SOURCE'),
  true,
  'missing source warning is reported',
);
assert.equal(
  validateLayerBounds(
    { ...compositionA.layers[0]!, bounds: { x: 0, y: 0, width: 0, height: 0 } },
    canvas,
  ).some((issue) => issue.code === 'ZERO_SIZE_LAYER'),
  true,
  'invalid bounds warning is reported',
);
const changed = createSceneCompositionFromGraph(
  {
    ...graphWithSources,
    sources: {
      ...graphWithSources.sources,
      'source-a': { ...graphWithSources.sources['source-a'], enabled: false },
    },
  },
  'scene-a',
);
assert.equal(
  diffSceneCompositions(compositionA, changed).changedLayers.length > 0,
  true,
  'composition diff detects changed layers',
);
const compositionStore = new CompositionStore();
compositionStore.setComposition('program', compositionA);
assert.equal(
  compositionStore.getComposition('program')?.id,
  compositionA.id,
  'composition store set/get works',
);
assert.equal(
  compositionStore.getCompositionByScene('scene-a').length,
  1,
  'composition store looks up by scene',
);
const layoutTransition = applyProductionCommand(
  graphWithSources,
  command('SET_WORKSPACE_PRESET', { preset: 'side_by_side' }, graphWithSources.metadata.revision),
);
assert.equal(
  translateGraphTransitionToIntents(layoutTransition).some(
    (intent) => intent.type === 'APPLY_LAYOUT',
  ),
  true,
  'layout changes generate composition-related intent',
);
const compositionMock = new MockMediaExecutionAdapter({ latencyMs: 1 });
compositionMock.execute(
  {
    id: 'build-composition',
    type: 'RENDER_PROGRAM_COMPOSITION',
    timestamp: '2026-07-01T00:00:00.000Z',
    graphRevision: graphWithSources.metadata.revision,
    payload: { sceneId: 'scene-a' },
  },
  graphWithSources,
);
assert.equal(
  compositionMock.getCompositionStore().getComposition('program')?.sceneId,
  'scene-a',
  'mock adapter stores latest program composition',
);

import {
  VideoRouteStore,
  activateRoute,
  createVideoRouteGraph,
  createVideoRoutePlan,
  deactivateRoute,
  failRoute,
  markRouteUnavailable,
  validateVideoRoute,
  validateVideoRoutePlan,
} from './routing.js';
const routingProgramComposition = createSceneCompositionFromGraph(
  recordingTransition.nextGraph,
  'scene-a',
  {
    target: 'program',
  },
);
const routingPreviewComposition = createSceneCompositionFromGraph(
  recordingTransition.nextGraph,
  'scene-a',
  {
    target: 'preview',
  },
);
const routingMultiviewComposition = createSceneCompositionFromGraph(
  recordingTransition.nextGraph,
  'scene-a',
  {
    target: 'multiview',
  },
);
const routePlan = createVideoRoutePlan(
  recordingTransition.nextGraph,
  [routingProgramComposition, routingPreviewComposition, routingMultiviewComposition],
  {
    includeRecording: true,
    includeStreams: true,
    includeConfidenceMonitor: true,
    now: '2026-07-01T00:00:00.000Z',
  },
);
assert.equal(
  routePlan.routes.some((route) => route.target === 'program'),
  true,
  'route planner creates program route',
);
assert.equal(
  routePlan.routes.some((route) => route.target === 'preview'),
  true,
  'route planner creates preview route',
);
assert.equal(
  routePlan.routes.some((route) => route.target === 'multiview'),
  true,
  'route planner creates multiview route',
);
assert.equal(
  routePlan.routes.some((route) => route.target === 'recording'),
  true,
  'route planner creates recording placeholder route',
);
const routeGraph = createVideoRouteGraph(routePlan);
assert.equal(
  Math.max(...Object.values(routeGraph.fanOut).map((routes) => routes.length)) > 1,
  true,
  'route graph represents fan-out',
);
assert.equal(
  validateVideoRoutePlan(routePlan, recordingTransition.nextGraph, [
    routingProgramComposition,
    routingPreviewComposition,
    routingMultiviewComposition,
  ]).valid,
  true,
  'valid route plan passes validation',
);
assert.equal(
  validateVideoRoute({ ...routePlan.routes[0]!, priority: -1 }, recordingTransition.nextGraph, [])
    .valid,
  false,
  'invalid route priority fails validation',
);
assert.equal(
  activateRoute(routePlan.routes[0]!).status,
  'active',
  'activateRoute marks route active',
);
assert.equal(
  deactivateRoute(routePlan.routes[0]!).status,
  'idle',
  'deactivateRoute marks route idle',
);
assert.equal(
  failRoute(routePlan.routes[0]!, 'test').status,
  'failed',
  'failRoute marks route failed',
);
assert.equal(
  markRouteUnavailable(routePlan.routes[0]!, 'test').status,
  'unavailable',
  'markRouteUnavailable marks route unavailable',
);
const routeStore = new VideoRouteStore();
routeStore.setRoutePlan(routePlan);
assert.equal(routeStore.getRoutePlan()?.id, routePlan.id, 'route store returns latest plan');
assert.equal(
  routeStore.getRoutesByTarget('program').length,
  1,
  'route store queries routes by target',
);
assert.equal(
  routeStore.getRoutesByScene('scene-a').length > 1,
  true,
  'route store queries routes by scene',
);
routeStore.clearRoutes();
assert.equal(routeStore.listRoutes().length, 0, 'route store clears routes');
const routingIntent = {
  id: 'routing-intent',
  type: 'BUILD_VIDEO_ROUTE_PLAN' as const,
  timestamp: '2026-07-01T00:00:00.000Z',
  graphRevision: recordingTransition.nextRevision,
  payload: {},
};
const routingMock = new MockMediaExecutionAdapter();
const routingResponse = routingMock.execute(routingIntent, recordingTransition.nextGraph);
assert.equal(routingResponse.success, true, 'mock adapter executes routing intent');
assert.equal(
  Boolean(routingMock.getVideoRouteStore().getRoutePlan()),
  true,
  'mock adapter stores latest route plan',
);

import {
  AudioRouteStore,
  createAudioRoutePlan,
  validateAudioRoutePlan,
  validateAudioRoute,
  createMixMinusForGuest,
  validateMixMinusRoute,
  muteAudioRoute,
  unmuteAudioRoute,
  soloAudioRoute,
  unsoloAudioRoute,
} from './audio-routing/index.js';

const audioGraph = {
  ...recordingTransition.nextGraph,
  sources: {
    ...recordingTransition.nextGraph.sources,
    'host-mic': {
      id: 'host-mic',
      name: 'Host Mic',
      type: 'audio' as const,
      enabled: true,
      muted: false,
      metadata: {},
    },
    'guest-source': {
      id: 'guest-source',
      name: 'Guest Mic',
      type: 'guest' as const,
      enabled: true,
      muted: false,
      metadata: {},
    },
  },
  guests: {
    ...recordingTransition.nextGraph.guests,
    'guest-1': {
      id: 'guest-1',
      displayName: 'Guest 1',
      status: 'connected' as const,
      muted: false,
      pinned: false,
      sourceId: 'guest-source',
      metadata: {},
    },
  },
  audioChannels: {
    ...recordingTransition.nextGraph.audioChannels,
    'audio-host': {
      id: 'audio-host',
      label: 'Host Mic',
      gain: 1,
      muted: false,
      sourceId: 'host-mic',
      metadata: {},
    },
    'audio-guest': {
      id: 'audio-guest',
      label: 'Guest Mic',
      gain: 1,
      muted: false,
      sourceId: 'guest-source',
      guestId: 'guest-1',
      metadata: {},
    },
  },
};
const audioPlan = createAudioRoutePlan(audioGraph, {
  includeRecording: true,
  includeStreams: true,
  includeMonitor: true,
  includeGuestReturns: true,
  now: '2026-07-01T00:00:00.000Z',
});
assert.equal(
  audioPlan.routes.some((route) => route.target === 'program_mix'),
  true,
  'audio route plan creates default program mix',
);
assert.equal(
  audioPlan.routes.some((route) => route.target === 'stream_mix'),
  true,
  'audio route plan creates stream mix',
);
assert.equal(
  audioPlan.routes.some((route) => route.target === 'recording_mix'),
  true,
  'audio route plan creates recording mix placeholder',
);
assert.equal(
  audioPlan.routes.some((route) => route.target === 'monitor_mix'),
  true,
  'audio route plan creates monitor mix placeholder',
);
assert.equal(
  audioPlan.routes.some((route) => route.target === 'guest_return' && route.mixMinus),
  true,
  'audio route plan creates guest return mix-minus route',
);
assert.equal(
  validateAudioRoutePlan(audioPlan, audioGraph).valid,
  true,
  'audio route plan validates',
);
const invalidGainRoute = { ...audioPlan.routes[0]!, gain: 99 };
assert.equal(
  validateAudioRoute(invalidGainRoute, audioGraph, audioPlan.buses).warnings.some((warning) =>
    warning.includes('Invalid gain'),
  ),
  true,
  'invalid gain warning is reported',
);
const guestReturn = createMixMinusForGuest(
  audioGraph.guests['guest-1']!,
  audioPlan.sources,
  audioGraph.metadata.revision,
  '2026-07-01T00:00:00.000Z',
);
const feedbackRoute = {
  ...audioPlan.routes.find((route) => route.sourceId === 'guest-source')!,
  target: 'guest_return' as const,
  targetId: 'guest-1',
  mixMinus: true,
};
assert.equal(
  validateMixMinusRoute(feedbackRoute, guestReturn).warnings.some((warning) =>
    warning.includes('Feedback risk'),
  ),
  true,
  'feedback risk warning is reported',
);
assert.equal(
  unmuteAudioRoute(muteAudioRoute(audioPlan.routes[0]!)).muted,
  false,
  'mute/unmute lifecycle updates route',
);
assert.equal(
  unsoloAudioRoute(soloAudioRoute(audioPlan.routes[0]!)).solo,
  false,
  'solo/unsolo lifecycle updates route',
);
const audioStore = new AudioRouteStore();
audioStore.setRoutePlan(audioPlan);
assert.equal(audioStore.getRoutePlan()?.id, audioPlan.id, 'audio route store set/get works');
assert.equal(
  audioStore.getRoutesBySource('host-mic').length > 0,
  true,
  'audio route store queries by source',
);
const audioMock = new MockMediaExecutionAdapter();
const audioResponse = audioMock.execute(
  {
    id: 'audio-routing-intent',
    type: 'BUILD_AUDIO_ROUTE_PLAN' as const,
    timestamp: '2026-07-01T00:00:00.000Z',
    graphRevision: audioGraph.metadata.revision,
    payload: {},
  },
  audioGraph,
);
assert.equal(audioResponse.success, true, 'mock adapter executes audio route intent');
assert.equal(
  Boolean(audioMock.getAudioRouteStore().getRoutePlan()),
  true,
  'mock adapter stores latest audio route plan',
);

import {
  BrowserMediaRenderer,
  BrowserRendererAdapter,
  BrowserRendererStore,
  RenderScheduler,
  getRenderableSourceForLayer,
  isBrowserRendererEnabled,
} from './browser-renderer/index.js';

const renderer = new BrowserMediaRenderer({ target: 'preview', debug: true });
assert.equal(renderer.getStats().running, false, 'browser renderer can be constructed');
const missingCanvasResult = renderer.render(compositionA, { target: 'preview' });
assert.equal(
  missingCanvasResult.errors.some((error) => error.code === 'RENDER_TARGET_MISSING'),
  true,
  'browser renderer reports missing render target structurally',
);
assert.deepEqual(
  [...compositionA.layers].sort((a, b) => a.zIndex - b.zIndex).map((layer) => layer.id),
  compositionA.layers.map((layer) => layer.id),
  'composition layer ordering respects zIndex before rendering',
);
assert.equal(
  getRenderableSourceForLayer(compositionA.layers[0]!, manager).kind,
  'placeholder',
  'missing runtime source produces placeholder renderable source',
);
const scheduler = new RenderScheduler(() => renderer.renderFrame());
scheduler.setTargetFps(24);
assert.equal(scheduler.getStats().targetFps, 24, 'scheduler target fps updates');
scheduler.start();
scheduler.stop();
assert.equal(scheduler.getStats().running, false, 'scheduler start/stop works');
const store = new BrowserRendererStore();
store.registerRenderer('preview', renderer);
store.setActiveComposition('preview', compositionA);
assert.equal(store.getRenderer('preview'), renderer, 'render target registration works');
assert.equal(store.getActiveComposition('preview')?.id, compositionA.id, 'renderer store tracks active composition');
assert.equal(isBrowserRendererEnabled({}), false, 'feature flag disabled preserves current behavior');
const browserAdapter = new BrowserRendererAdapter(renderer, 'dry_run');
const browserAdapterResult = browserAdapter.execute(
  {
    id: 'browser-render-dry-run',
    type: 'RENDER_BROWSER_COMPOSITION',
    timestamp: '2026-07-01T00:00:00.000Z',
    graphRevision: graphWithSources.metadata.revision,
    payload: { sceneId: 'scene-a', target: 'preview' },
  },
  graphWithSources,
);
assert.equal(browserAdapterResult.success, true, 'browser renderer adapter returns structured result');
assert.equal(
  browserAdapter.getCapabilities().includes('RENDER_FRAME'),
  true,
  'browser renderer adapter exposes render frame capability',
);


let mockNow = 1000;
const clock = createClock({ frameRate: 30, now: () => mockNow });
clock.startClock();
assert.equal(clock.getCurrentBroadcastTime(), 0, 'clock starts at zero broadcast time');
mockNow += 34;
assert.equal(clock.getCurrentFrame(), 1, 'frame increments at frame interval');
assert.equal(clock.getFrameTimestamp(3), 100, 'frame timestamps are deterministic');
clock.pauseClock();
mockNow += 1000;
assert.equal(clock.getCurrentFrame(), 1, 'paused clock does not advance frames');
clock.resumeClock();
mockNow += 34;
assert.equal(clock.getCurrentFrame(), 2, 'resumed clock advances frames');

const bus = new MediaSyncBus();
const schedulerClock = createClock({ frameRate: 60, now: () => mockNow });
const syncStore = new MediaSyncStore(schedulerClock);
const frameScheduler = new FrameScheduler(schedulerClock, bus);
let scheduledTick: FrameTickEvent | undefined;
frameScheduler.onTick((tick) => { scheduledTick = tick; syncStore.recordTick(tick); frameScheduler.stop(); });
frameScheduler.start();
await new Promise((resolve) => setTimeout(resolve, 5));
assert.equal(scheduledTick?.frameId, 0, 'frame scheduler emits deterministic initial frame');
assert.equal(bus.listEvents().some((event) => event.type === 'FRAME_TICK'), true, 'sync bus records frame ticks');
assert.equal(syncStore.getState().syncHealthSummary.currentFrame, 0, 'sync store exposes health summary');

const monitor = new SyncDriftMonitor(bus, 5);
monitor.record({ renderDriftMs: 6, audioDriftMs: 0, videoDriftMs: 0, outputDriftMs: 0 });
assert.equal(bus.listEvents().some((event) => event.type === 'DRIFT_DETECTED'), true, 'drift detection emits event');
monitor.reset();
assert.equal(monitor.getHistory().length, 0, 'drift stats reset');

const syncEngine = new MediaExecutionEngine(new ExecutionLogStore());
const syncAdapter = new MockMediaExecutionAdapter({ latencyMs: 0 });
syncEngine.registerAdapter(syncAdapter);
syncEngine.setExecutionRuntimeMode('mock_live');
const frameResults = await syncEngine.executeFrameSync({ frameId: 10, timestamp: 333, broadcastTime: 333, expectedNextFrameTime: 366, jitterEstimate: 0 }, recordingTransition.nextGraph, [
  { id: 'b-render', type: 'RENDER_FRAME', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: 4, payload: {} },
  { id: 'a-video', type: 'ROUTE_PROGRAM_VIDEO', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: 4, payload: {} },
]);
assert.equal(frameResults.length, 2, 'frame sync executes pending intents');
assert.equal(syncAdapter.getLoggedIntents()[0]?.type, 'ROUTE_PROGRAM_VIDEO', 'frame sync execution order is deterministic');
assert.equal(syncAdapter.getLoggedIntents()[0]?.payload.frameId, 10, 'frame sync attaches frame metadata');

const syncRenderer = new BrowserMediaRenderer();
assert.equal(syncRenderer.getStats().frameCount, 0, 'renderer does not render before frame tick');
syncRenderer.renderFrame({ frameId: 12, timestamp: 400, broadcastTime: 400, expectedNextFrameTime: 433, jitterEstimate: 0 });
assert.equal(syncRenderer.getStats().frameCount, 0, 'manual frame tick render avoids free-running scheduler stats without canvas');
assert.equal(isMediaSyncEnabled({ NEXT_PUBLIC_UBOS_MEDIA_SYNC: 'false' }), false, 'feature flag disables sync layer safely');
assert.equal(isMediaSyncEnabled({ NEXT_PUBLIC_UBOS_MEDIA_SYNC: 'true' }), true, 'feature flag enables sync layer');
