import { RecordingPipeline, isRealRecordingEnabled, safeRecordingFilename } from './recording-runtime/index.js';
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
  SUPPORTED_FRAME_RATES,
  FrameScheduler,
  MediaSyncBus,
  SyncDriftMonitor,
  MediaSyncStore,
  isMediaSyncEnabled,
  assignIntentToFrame,
  assertFramePlanHasFrameIdentity,
  assertFrameTimestampFromClock,
  assertMonotonicFrameId,
  assertNoIndependentSubsystemClock,
  classifyDrift,
  createDriftWarning,
  getNextExecutableFrame,
  summarizeFrameDrift,
  MediaOrchestrationEngine,
  createStreamingPlan,
  validateStreamingPlan,
  prepareStreaming,
  connectStreaming,
  startStreaming,
  pauseStreaming,
  resumeStreaming,
  stopStreaming,
  simulateDisconnect,
  simulateDestinationFailure,
  simulateStreamingHealthChange,
  simulateTransportSwitch,
  summarizeStreamingHealth,
  createStreamingManifest,
  StreamingStore,
  supportedStreamingProtocols,
  createEncoderPlan,
  validateEncoderPlan,
  validateEncoderProfile,
  selectEncoderBackend,
  prepareEncoder,
  startEncoder,
  pauseEncoder,
  resumeEncoder,
  drainEncoder,
  stopEncoder,
  failEncoder,
  createEncoderManifest,
  summarizeEncoderHealth,
  EncoderStore,
  FFmpegEncoderBackend,
  createFFmpegCommandPlan,
  validateFFmpegCommandPlan,
  buildFFmpegArgs,
  sanitizeFFmpegArgs,
  detectFFmpegAvailability,
  parseFFmpegVersion,
  createFFmpegHealth,
  summarizeFFmpegHealth,
  mapEncoderPlanToFFmpegCommand,
  createFFmpegLogEvent,
  FFmpegStreamingRuntime,
  createFFmpegStreamingPlan,
  validateFFmpegStreamingPlan,
  mapStreamingPlanToFFmpegCommand,
  buildStreamingInputArgs,
  buildStreamingOutputArgs,
  sanitizeStreamingUrl,
  redactStreamingDiagnostics,
  createFFmpegStreamingManifest,
  summarizeStreamingRuntimeHealth,
  mapFFmpegStreamingErrorToFailure,
  shouldReconnectStream,
  scheduleStreamReconnect,
  recordStreamReconnectAttempt,
  resetStreamReconnectState,
  StreamingPipeline,
  isRealStreamingEnabled,
  validateStreamingDestination,
  createStreamingRuntimeManifest,
  createMultiviewPlan,
  validateMultiviewPlan,
  buildTileLayout,
  updateMultiviewTile,
  removeMultiviewTile,
  createMultiviewSnapshot,
  summarizeMultiviewHealth,
  createConfidenceMonitor,
  summarizeConfidenceStatus,
  validateConfidenceSignals,
  MultiviewStore,
  createWebRTCTransportPlan,
  validateWebRTCTransportPlan,
  createWebRTCSession,
  createWebRTCPeer,
  addWebRTCPeer,
  removeWebRTCPeer,
  updateWebRTCPeerState,
  createWebRTCMediaTrackRef,
  summarizeWebRTCHealth,
  createWebRTCManifest,
  validateWebRTCSignalMessage,
  redactWebRTCDiagnostics,
  createPeerConnection,
  mapWebRTCErrorToFailure,
  isRealWebRTCEnabled,
  createOfferMetadata,
  createAnswerMetadata,
  createIceMetadata,
  validateWebRTCSignalingMetadata,
  calculateBackpressure,
  collectWebRTCStatistics,
  summarizeConnectionQuality,
  planWebRTCRecovery,
  RealWebRTCRuntime,
  WebRTCSessionManager,
  PeerConnectionManager,
  MediaTrackManager,
  ICEManager,
  SignalingManager,
  ConnectionHealth,
  WebRTCStatistics,
  WebRTCRecovery,
  WebRTCValidator,
  createProductionRuntime,
  createProductionRuntimeSession,
  registerRuntimeSubsystem,
  unregisterRuntimeSubsystem,
  startProductionRuntime,
  stopProductionRuntime,
  pauseProductionRuntime,
  resumeProductionRuntime,
  restartRuntimeSubsystem,
  failRuntimeSubsystem,
  summarizeProductionRuntimeHealth,
  createProductionRuntimeManifest,
  mapRuntimeFailure,
  redactRuntimeDiagnostics,
  RuntimeSupervisor,
  createFFmpegRuntime,
  createFFmpegEnvironment,
  buildCommand,
  validateExecutable,
  locateFFmpeg,
  probeCapabilities,
  summarizeHealth as summarizeFFmpegRuntimeHealth,
  summarizeStatistics as summarizeFFmpegRuntimeStatistics,
  createManifest as createFFmpegRuntimeManifest,
  mapFailure as mapFFmpegRuntimeFailure,
  type RuntimeSubsystem,
  type FrameTickEvent,
  createGpuPipeline,
  validateGpuPipeline,
  createGpuSession,
  createGpuManifest,
  summarizeGpuHealth,
  createGpuRuntime,
  createGpuContext,
  allocateTexture,
  HardwareRuntime,
  DeviceManager,
  EncoderManager,
  HardwareValidator,
  HardwareRecovery,
  createHardwareDevice,
  createHardwareFailure,
  defaultHardwareCapabilities as defaultHardwareCapabilitiesForValidation,
  isHardwareRuntimeEnabled,
  AudioRuntime,
  createAudioChannel,
  MixMinusManager,
  AudioValidator,
  BroadcastOrchestrator,
  ExecutionCoordinator,
  ResourceCoordinator,
  isBroadcastOrchestratorEnabled,
  HighAvailabilityRuntime,
  createClusterNode,
  ClusterManager,
  ElectionManager,
  RecoveryPlanner,
  tripCircuitBreaker,
  isHighAvailabilityEnabled,
  ProductionEngine,
  ProductionPipelineScheduler,
  isProductionEngineEnabled,
  createMediaSource,
  createMediaSink,
  createMediaClock as createCoreMediaClock,
  DefaultFrameScheduler,
  createMediaRuntimePipeline,
  mapProductionGraphSources,
  createMp4RecordingCommand,
  createRtmpCommand,
  createFFmpegMediaRuntimeAdapter,
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


const streamingGraph = {
  ...recordingTransition.nextGraph,
  destinations: {
    streamA: {
      id: 'streamA',
      name: 'Primary RTMP',
      platform: 'rtmp',
      enabled: true,
      status: 'ready' as const,
      metadata: { protocol: 'RTMP', endpointRef: 'secret:primary' },
    },
  },
};
const streamingVideoPlan = createVideoRoutePlan(streamingGraph, [], { includeStreams: true });
const streamingAudioPlan = createAudioRoutePlan(streamingGraph, { includeStreams: true });
const streamingPlan = createStreamingPlan({
  graph: streamingGraph,
  videoRoutePlan: streamingVideoPlan,
  audioRoutePlan: streamingAudioPlan,
  outputEngineId: 'output-engine:test',
  recordingEngineId: 'recording-engine:test',
  mediaClock: createClock({ frameRate: 30 }),
  frameId: 81,
});
assert.equal(streamingPlan.destinations.length, 1, 'stream planning includes enabled destinations');
assert.equal(streamingPlan.targets[0]?.transport.protocol, 'RTMP', 'stream planning infers protocol');
assert.equal(validateStreamingPlan(streamingPlan).valid, true, 'stream plan validation passes');
const streamingStore = new StreamingStore();
streamingStore.setStreamingPlan(streamingPlan);
assert.equal(streamingStore.getStreamingPlan(streamingPlan.id)?.id, streamingPlan.id, 'stream store gets plan');
assert.equal(streamingStore.getActiveStreams().length, 1, 'stream store lists active streams');
let streamingResult = prepareStreaming(streamingPlan);
assert.equal(streamingResult.session.status, 'planned', 'prepare streaming creates planned session');
streamingResult = connectStreaming(streamingResult.session);
assert.equal(streamingResult.session.targets[0]?.connected, true, 'mock transport connects without sockets');
streamingResult = startStreaming(streamingResult.session);
assert.equal(streamingResult.session.status, 'streaming', 'start streaming moves lifecycle');
streamingResult = pauseStreaming(streamingResult.session);
assert.equal(streamingResult.session.status, 'paused', 'pause streaming moves lifecycle');
streamingResult = resumeStreaming(streamingResult.session);
assert.equal(streamingResult.session.status, 'streaming', 'resume streaming moves lifecycle');
const degradedSession = simulateStreamingHealthChange(streamingResult.session, 'streamA', 'degraded');
assert.equal(summarizeStreamingHealth(degradedSession).health, 'degraded', 'health summarizes degradation');
const switchedSession = simulateTransportSwitch(degradedSession, 'streamA', 'SRT');
assert.equal(switchedSession.targets[0]?.transport.protocol, 'SRT', 'mock transport switching updates metadata');
const disconnectResult = simulateDisconnect(switchedSession, 'streamA');
assert.equal(disconnectResult.session.status, 'reconnecting', 'mock disconnect simulates reconnect');
const failureResult = simulateDestinationFailure(disconnectResult.session, 'streamA');
assert.equal(failureResult.session.status, 'failed', 'destination failure fails stream');
const manifest = createStreamingManifest(streamingPlan);
assert.equal(manifest.containsMediaPayloads, false, 'stream manifest contains no runtime media');
assert.equal('mediaPayload' in manifest, false, 'stream manifest stores no media payload object');
assert.equal(supportedStreamingProtocols.includes('WHIP'), true, 'supported protocols include WHIP');
streamingResult = stopStreaming(streamingResult.session);
assert.equal(streamingResult.session.status, 'stopped', 'stop streaming moves lifecycle');
streamingStore.clearStreams();
assert.equal(streamingStore.listStreams().length, 0, 'stream store clears streams');



const encoderStreamId = streamingPlan.targets[0]?.id;
const encoderPlan = createEncoderPlan({ graph: streamingGraph, videoRoutePlan: streamingVideoPlan, audioRoutePlan: streamingAudioPlan, outputId: streamingPlan.broadcastOutputPlanId, ...(encoderStreamId ? { streamId: encoderStreamId } : {}), mediaClock: createClock({ frameRate: 30 }), frameId: 82 });
assert.equal(encoderPlan.backend, 'mock', 'encoder plan selects mock backend by default');
assert.equal(validateEncoderPlan(encoderPlan).valid, true, 'encoder plan validation passes');
assert.equal(validateEncoderProfile(encoderPlan.profile).valid, true, 'encoder profile validation passes');
assert.equal(selectEncoderBackend({ preferred: 'software', available: ['mock','software'] }), 'software', 'encoder backend selection honors available preference');
const encoderStore = new EncoderStore();
encoderStore.setEncoderPlan(encoderPlan);
assert.equal(encoderStore.getEncoderPlan(encoderPlan.id)?.id, encoderPlan.id, 'encoder store gets plan');
assert.equal(encoderStore.getActiveEncoders().length, 1, 'encoder store lists active encoders');
let encoderResult = prepareEncoder(encoderPlan);
assert.equal(encoderResult.session.status, 'ready', 'prepare encoder creates ready mock session');
encoderResult = startEncoder(encoderResult.session);
assert.equal(encoderResult.session.status, 'encoding', 'start encoder moves lifecycle');
encoderResult = pauseEncoder(encoderResult.session);
assert.equal(encoderResult.session.status, 'paused', 'pause encoder moves lifecycle');
encoderResult = resumeEncoder(encoderResult.session);
encoderResult = drainEncoder(encoderResult.session);
assert.equal(encoderResult.session.status, 'draining', 'drain encoder moves lifecycle');
const failedEncoder = failEncoder(encoderResult.session, { code: 'MOCK_FATAL', message: 'Mock fatal encoder failure', retryable: false, occurredAt: '2026-07-01T00:00:00.000Z', backend: 'mock' });
assert.equal(failedEncoder.session.status, 'failed', 'encoder failure handling marks failed session');
encoderResult = stopEncoder(encoderResult.session);
assert.equal(encoderResult.session.status, 'stopped', 'stop encoder moves lifecycle');
const encoderManifest = createEncoderManifest(encoderPlan);
assert.equal(encoderManifest.containsMediaPayloads, false, 'encoder manifest excludes raw media payloads');
assert.equal(encoderManifest.containsEncodedPackets, false, 'encoder manifest excludes encoded packets');
assert.equal(encoderStore.getEncoderManifest(encoderPlan.id)?.containsEncodedPackets, false, 'encoder store returns packet-free manifest');
assert.equal(summarizeEncoderHealth(startEncoder(prepareEncoder(encoderPlan).session).session).active, true, 'encoder health summary reports active encoding');
assert.equal(JSON.stringify(encoderPlan).includes('encodedPacket'), false, 'encoder state does not include encoded packet fields');
const encoderAdapter = new MockMediaExecutionAdapter();
const encoderIntentResponse = encoderAdapter.execute({ id: 'encoder-intent', type: 'START_ENCODER', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: streamingGraph.metadata.revision, payload: { outputId: streamingPlan.broadcastOutputPlanId, streamId: streamingPlan.targets[0]?.id, frameId: 82 } }, streamingGraph);
assert.equal(encoderIntentResponse.success, true, 'mock execution handles encoder intent');
assert.equal(encoderAdapter.getEncoderStore().listEncoders().length, 1, 'mock encoder execution stores encoder plan');
encoderStore.clearEncoders();
assert.equal(encoderStore.listEncoders().length, 0, 'encoder store clears encoders');

const ffmpegPlan = createEncoderPlan({ graph: streamingGraph, videoRoutePlan: streamingVideoPlan, audioRoutePlan: streamingAudioPlan, outputId: streamingPlan.broadcastOutputPlanId, ...(encoderStreamId ? { streamId: encoderStreamId } : {}), mediaClock: createClock({ frameRate: 30 }), frameId: 84, backend: 'ffmpeg', metadata: { url: 'rtmp://live.example/app?key=super-secret' } });
const ffmpegBackend = new FFmpegEncoderBackend({ enabled: true, runtimeMode: 'dry_run', ffmpegPath: 'ffmpeg' });
assert.equal(ffmpegBackend.validate(ffmpegPlan).valid, true, 'ffmpeg backend validates placeholder encoder plan');
const ffmpegCommandPlan = createFFmpegCommandPlan(ffmpegPlan, { runtimeMode: 'dry_run', ffmpegPath: 'ffmpeg' });
assert.equal(ffmpegCommandPlan.output.kind, 'rtmp', 'ffmpeg command planner maps streaming plan to RTMP placeholder');
assert.equal(ffmpegCommandPlan.output.planOnly, true, 'ffmpeg RTMP output remains plan-only');
assert.equal(validateFFmpegCommandPlan(ffmpegCommandPlan).valid, true, 'ffmpeg command plan validates');
assert.deepEqual(buildFFmpegArgs(ffmpegCommandPlan), ffmpegCommandPlan.args, 'ffmpeg args are built as safe array');
let rejectedDangerousArg = false;
try { sanitizeFFmpegArgs(['-i', 'safe', 'bad;rm -rf']); } catch { rejectedDangerousArg = true; }
assert.equal(rejectedDangerousArg, true, 'ffmpeg sanitizer rejects shell metacharacters');
assert.equal(ffmpegCommandPlan.redactedPreview.includes('super-secret'), false, 'ffmpeg command preview redacts secrets');
const preparedFFmpeg = await ffmpegBackend.prepare(ffmpegPlan);
assert.equal(preparedFFmpeg.success, true, 'ffmpeg dry-run prepare succeeds without spawning');
const startedFFmpeg = await ffmpegBackend.start(preparedFFmpeg.session);
assert.equal(JSON.stringify(startedFFmpeg.warnings).includes('did not spawn'), true, 'ffmpeg dry-run start does not spawn process');
const disabledFFmpeg = new FFmpegEncoderBackend({ enabled: false, runtimeMode: 'disabled' });
const disabledPrepared = await disabledFFmpeg.prepare(ffmpegPlan);
assert.equal(disabledPrepared.session.status, 'unavailable', 'ffmpeg disabled mode reports unavailable and does not spawn');
const missingFFmpeg = await detectFFmpegAvailability('__ubos_missing_ffmpeg_binary__');
assert.equal(missingFFmpeg.available, false, 'ffmpeg availability handles missing binary');
assert.equal(parseFFmpegVersion('ffmpeg version 6.1.1 Copyright'), '6.1.1', 'ffmpeg version parser handles sample output');
const mappedFFmpegCommand = mapEncoderPlanToFFmpegCommand(ffmpegPlan, { runtimeMode: 'dry_run' });
assert.equal(mappedFFmpegCommand.encoderPlanId, ffmpegPlan.id, 'encoder plan maps to ffmpeg command plan');
const ffmpegHealth = createFFmpegHealth({ enabled: true, available: false, processState: 'unavailable' });
assert.equal(summarizeFFmpegHealth(ffmpegHealth).includes('unavailable'), true, 'ffmpeg health summary works');
assert.equal(createFFmpegLogEvent({ message: 'stream_key=secret' }).message.includes('secret'), false, 'ffmpeg log event redacts secrets');
assert.equal(JSON.stringify(ffmpegPlan).includes('ChildProcess'), false, 'production graph-safe encoder plan stores no ffmpeg process handles');

const liveStreamingPlan = createFFmpegStreamingPlan({ streamingPlan, encoderPlan: ffmpegPlan, runtimeMode: 'dry_run', dryRun: true, enabled: true, destinationUrls: { streamA: 'rtmp://live.example/app/SUPER_STREAM_KEY' } });
assert.equal(liveStreamingPlan.targets[0]?.protocol, 'rtmp', 'ffmpeg streaming plan creates RTMP target');
assert.equal(liveStreamingPlan.redactedPreview.includes('SUPER_STREAM_KEY'), false, 'ffmpeg streaming command preview redacts RTMP stream key');
assert.equal(sanitizeStreamingUrl('rtmps://live.example/app/SUPER_STREAM_KEY').includes('SUPER_STREAM_KEY'), false, 'RTMPS URL redaction removes stream key');
assert.equal(sanitizeStreamingUrl('srt://host.example:9000?passphrase=secret').includes('secret'), false, 'SRT passphrase redaction removes secret');
let rejectedUnsafeStreamingUrl = false;
try { sanitizeStreamingUrl('rtmp://live.example/app/key;rm -rf'); } catch { rejectedUnsafeStreamingUrl = true; }
assert.equal(rejectedUnsafeStreamingUrl, true, 'streaming URL sanitizer rejects shell metacharacters');
assert.equal(validateFFmpegStreamingPlan(liveStreamingPlan).valid, true, 'ffmpeg streaming plan validates');
assert.equal(mapStreamingPlanToFFmpegCommand(liveStreamingPlan).args.includes('-nostdin'), true, 'streaming command mapping uses safe ffmpeg args array');
assert.equal(buildStreamingInputArgs(liveStreamingPlan).includes('-i'), true, 'streaming input args include placeholder input');
assert.equal(buildStreamingOutputArgs(liveStreamingPlan.targets[0]!).includes('flv'), true, 'RTMP output args use flv muxer');
assert.equal(redactStreamingDiagnostics('publishing rtmp://live.example/app/SUPER_STREAM_KEY').includes('SUPER_STREAM_KEY'), false, 'streaming diagnostics redact URL keys');
const ffmpegStreamingManifest = createFFmpegStreamingManifest(streamingPlan, liveStreamingPlan);
assert.equal(ffmpegStreamingManifest.containsStreamKeys, false, 'ffmpeg streaming manifest declares no stream keys');
assert.equal(JSON.stringify(ffmpegStreamingManifest).includes('SUPER_STREAM_KEY'), false, 'ffmpeg streaming manifest stores no raw stream key');
const runtime = new FFmpegStreamingRuntime({ enabled: true, runtimeMode: 'dry_run', dryRun: true, ffmpegPath: 'ffmpeg' });
const runtimePrepared = await runtime.prepareStreamingRuntime(streamingPlan, ffmpegPlan);
assert.equal(runtimePrepared.success, true, 'ffmpeg streaming runtime prepares in dry-run');
const runtimeStarted = await runtime.startStreamingRuntime(runtimePrepared.session);
assert.equal(JSON.stringify(runtimeStarted.warnings).includes('did not spawn'), true, 'ffmpeg streaming dry-run start does not spawn');
const disabledRuntime = new FFmpegStreamingRuntime({ enabled: false, runtimeMode: 'disabled', dryRun: true });
const disabledRuntimePrepared = await disabledRuntime.prepareStreamingRuntime(streamingPlan, ffmpegPlan);
assert.equal(disabledRuntimePrepared.session.transport.processState, 'disabled', 'disabled streaming runtime does not spawn');
let reconnectState = scheduleStreamReconnect(runtimePrepared.session.transport);
assert.equal(shouldReconnectStream(reconnectState), true, 'stream reconnect helper permits attempts below max');
reconnectState = recordStreamReconnectAttempt({ ...reconnectState, reconnectAttempts: 2, maxReconnectAttempts: 3 });
assert.equal(reconnectState.reconnectState, 'exhausted', 'stream reconnect helper records exhaustion');
assert.equal(resetStreamReconnectState(reconnectState).reconnectAttempts, 0, 'stream reconnect reset clears attempts');
assert.equal(mapFFmpegStreamingErrorToFailure({ message: '403 auth denied', retryable: false }).classification, 'auth', 'ffmpeg streaming failure maps auth errors');
assert.equal(summarizeStreamingRuntimeHealth(runtimePrepared.session.healthDetails).includes('rtmp'), true, 'ffmpeg streaming health summary includes protocol');
assert.equal(JSON.stringify(runtimePrepared.session).includes('ChildProcess'), false, 'ffmpeg streaming session stores no process handles');


const realStreamingEnv = { UBOS_ENABLE_REAL_STREAMING: 'true', NEXT_PUBLIC_UBOS_REAL_STREAMING: 'true' };
assert.equal(isRealStreamingEnabled(realStreamingEnv), true, 'real streaming feature flags enable runtime');
assert.equal(validateStreamingDestination({ name: 'Twitch', platform: 'twitch', url: 'rtmps://live.twitch.tv/app/SUPER_STREAM_KEY' }).sanitizedUrl.includes('SUPER_STREAM_KEY'), false, 'streaming runtime destination redacts stream key');
let rejectedRuntimeUrl = false;
try { validateStreamingDestination({ name: 'Bad', platform: 'custom_rtmp', url: 'rtmp://live.example/app/key;cat /etc/passwd' }); } catch { rejectedRuntimeUrl = true; }
assert.equal(rejectedRuntimeUrl, true, 'streaming runtime rejects shell injection URLs');
const streamingRuntime = new StreamingPipeline({ UBOS_ENABLE_REAL_STREAMING: 'false', NEXT_PUBLIC_UBOS_REAL_STREAMING: 'false' }, 1);
const runtimeJob = streamingRuntime.create({ graphRevision: streamingGraph.metadata.revision, destination: { id: 'yt', name: 'YouTube Live', platform: 'youtube_live', url: 'rtmps://a.rtmps.youtube.com/live2/SUPER_STREAM_KEY' } });
assert.equal(runtimeJob.runtime, 'mock', 'streaming runtime preserves mock fallback when feature flags disabled');
assert.equal(JSON.stringify(runtimeJob).includes('SUPER_STREAM_KEY'), false, 'streaming runtime job never stores stream key');
streamingRuntime.validate(runtimeJob.id);
streamingRuntime.prepare(runtimeJob.id);
streamingRuntime.connect(runtimeJob.id);
const publishingJob = await streamingRuntime.startPublishing(runtimeJob.id);
assert.equal(publishingJob.lifecycle, 'publishing', 'streaming runtime publishes through lifecycle');
assert.equal(streamingRuntime.diagnostics(runtimeJob.id).protocol, 'rtmps', 'streaming runtime diagnostics expose protocol');
const reconnectingJob = streamingRuntime.reconnect(runtimeJob.id);
assert.equal(reconnectingJob.lifecycle, 'reconnecting', 'streaming runtime reconnects with policy');
assert.equal(reconnectingJob.statistics.reconnectCount, 1, 'streaming runtime increments reconnect count');
const manifest93 = createStreamingRuntimeManifest(reconnectingJob);
assert.equal(manifest93.containsProcessHandles, false, 'streaming runtime manifest contains no process handles');
assert.equal(manifest93.containsStreamKeys, false, 'streaming runtime manifest contains no stream keys');
assert.equal(JSON.stringify(manifest93).includes('SUPER_STREAM_KEY'), false, 'streaming runtime manifest redacts secrets');
streamingRuntime.pause(runtimeJob.id);
streamingRuntime.resume(runtimeJob.id);
await streamingRuntime.stop(runtimeJob.id);
streamingRuntime.disconnect(runtimeJob.id);
streamingRuntime.cleanup(runtimeJob.id);
const backpressureRuntime = new StreamingPipeline({}, 1);
const firstQueued = backpressureRuntime.create({ destination: { name: 'Kick', platform: 'kick', url: 'rtmp://kick.example/live/KICK_SECRET' } });
const secondQueued = backpressureRuntime.create({ destination: { name: 'Facebook Live', platform: 'facebook_live', url: 'rtmp://facebook.example/live/FB_SECRET' } });
await backpressureRuntime.startPublishing(firstQueued.id);
const queuedJob = await backpressureRuntime.startPublishing(secondQueued.id);
assert.equal(queuedJob.lifecycle, 'queued', 'streaming runtime queues startup under backpressure');
const failingRuntime = new StreamingPipeline({}, 1);
const failingJob = failingRuntime.create({ destination: { name: 'Custom', platform: 'custom_rtmp', url: 'rtmp://live.example/app/SECRET' }, reconnectPolicy: { maxRetries: 1 } });
failingRuntime.reconnect(failingJob.id);
const exhaustedJob = failingRuntime.reconnect(failingJob.id);
assert.equal(exhaustedJob.lifecycle, 'failed', 'streaming runtime exhausts reconnect policy');
assert.equal(exhaustedJob.latestFailure?.ubosFailure.category, 'STREAMING_FAILURE', 'streaming runtime maps failures to UBOS model');
assert.equal(JSON.stringify(exhaustedJob.replay).includes('SECRET'), false, 'streaming runtime replay stores no runtime secrets');


const multiviewPlan = createMultiviewPlan({ graph: streamingGraph, preset: 'quad', videoRoutePlan: streamingVideoPlan, audioRoutePlan: streamingAudioPlan, frameId: 82 });
assert.equal(multiviewPlan.tiles.length, 4, 'multiview plan creation uses quad preset');
assert.deepEqual(buildTileLayout('two_view', 1, 2), { x: 960, y: 0, width: 960, height: 1080 }, 'two view layout generates right tile');
assert.equal(validateMultiviewPlan(multiviewPlan).valid, true, 'multiview metadata-only validation passes');
const updatedMultiview = updateMultiviewTile(multiviewPlan, multiviewPlan.tiles[0]!.id, { health: 'degraded', status: 'degraded', metadata: { simulatedDrop: true } });
assert.equal(updatedMultiview.tiles[0]?.health, 'degraded', 'multiview tile update works');
const removedMultiview = removeMultiviewTile(updatedMultiview, updatedMultiview.tiles[0]!.id);
assert.equal(removedMultiview.tiles.length, 3, 'multiview tile remove works');
const multiviewSummary = summarizeMultiviewHealth(updatedMultiview);
assert.equal(multiviewSummary.unhealthyTiles > 0, true, 'tile health summary counts unhealthy tiles');
const multiviewSnapshot = createMultiviewSnapshot(multiviewPlan);
assert.equal(multiviewSnapshot.containsMediaPayloads, false, 'multiview snapshot is replay-safe metadata only');
assert.equal('mediaStream' in multiviewSnapshot, false, 'multiview snapshot stores no raw media');
const confidenceMonitor = createConfidenceMonitor({ plan: multiviewPlan, signals: { stream: 'warning', network: 'degraded' } });
assert.equal(validateConfidenceSignals(confidenceMonitor).valid, true, 'confidence monitor validation passes');
assert.equal(summarizeConfidenceStatus(confidenceMonitor).status, 'degraded', 'confidence summary reports worst status');
const multiviewStore = new MultiviewStore();
multiviewStore.setMultiviewPlan(multiviewPlan);
multiviewStore.setConfidenceMonitor(confidenceMonitor);
assert.equal(multiviewStore.getTileById(multiviewPlan.tiles[0]!.id)?.id, multiviewPlan.tiles[0]!.id, 'multiview store gets tile by id');
assert.equal(multiviewStore.getTilesByType('program').length, 1, 'multiview store filters tiles by type');
const multiviewMock = new MockMediaExecutionAdapter({ latencyMs: 1 });
const multiviewMockResult = multiviewMock.execute({ id: 'mock-multiview', type: 'BUILD_MULTIVIEW_PLAN', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: streamingGraph.metadata.revision, payload: { preset: 'quad', frameId: 82 } }, streamingGraph);
assert.equal(multiviewMockResult.success, true, 'mock multiview execution intent handling succeeds');
assert.equal(multiviewMock.getMultiviewStore().getMultiviewPlan()?.preset, 'quad', 'mock multiview execution stores plan');
assert.equal(validateMultiviewPlan(createMultiviewPlan({ graph: streamingGraph, metadata: { rawFrame: 'forbidden' } })).valid, false, 'multiview validation rejects raw media-like metadata');
multiviewStore.clearMultiview();
assert.equal(multiviewStore.listMultiviewTiles().length, 0, 'multiview store clears state');

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
  Canvas2DRendererBackend,
  WebGLRendererBackend,
  createRenderFrameContext,
  getDirtyLayers,
  createRenderCache,
  setCachedLayer,
  getCachedLayer,
  invalidateLayer,
  calculateFrameBudget,
  evaluateRenderPerformance,
  createRenderPipeline,
  executeRenderPipeline,
  selectRendererBackend,
  summarizeRendererHealth,
  createBrowserRendererPlan,
  validateBrowserRendererPlan,
  createBrowserRendererSession,
  createRenderSurface,
  createRenderLayer,
  createRenderPass,
  updateRenderLayer,
  removeRenderLayer,
  summarizeBrowserRendererHealth,
  createRendererManifest,
  redactRendererDiagnostics,
  mapRendererFailure,
  createHTMLElement,
  requestBrowserFrame,
  cancelBrowserFrame,
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
const canvasBackend = new Canvas2DRendererBackend(() => undefined);
canvasBackend.initialize();
const gpuFallback = selectRendererBackend([canvasBackend, new WebGLRendererBackend()], 'webgl_preview');
assert.equal(gpuFallback.backend?.type, 'canvas2d', 'unavailable GPU backend falls back to Canvas2D');
const frameContext = createRenderFrameContext({ frameId: 1, frameTimestamp: 1000, graphRevision: compositionA.graphRevision, compositionId: compositionA.id, canvas: { width: 1920, height: 1080, getContext: () => null } as unknown as HTMLCanvasElement & { width: number; height: number; getContext(type: '2d'): CanvasRenderingContext2D | null }, layers: compositionA.layers, debugMode: false, renderTarget: 'preview', metadata: {} });
assert.equal(frameContext.compositionId, compositionA.id, 'render frame context is created correctly');
assert.equal(getDirtyLayers(compositionA, { ...compositionA, layers: [{ ...compositionA.layers[0]!, opacity: 0.5 }, ...compositionA.layers.slice(1)] }).length, 1, 'dirty-layer detection works');
const cache = createRenderCache();
setCachedLayer(cache, { id: 'layer:a', kind: 'layer', layerId: 'a', revision: 1, signature: 'sig', updatedAt: '2026-07-01T00:00:00.000Z', metadata: {} });
assert.equal(getCachedLayer(cache, 'a')?.signature, 'sig', 'cache set/get works');
assert.equal(invalidateLayer(cache, 'a'), true, 'cache invalidate works');
assert.equal(calculateFrameBudget(50), 20, 'frame budget calculation works');
assert.equal(evaluateRenderPerformance({ targetFps: 50, renderDurationMs: 21, dirtyLayerCount: 1, totalLayerCount: 2, cacheHitCount: 1, cacheMissCount: 1 }).overBudget, true, 'render performance detects over-budget frames');
const pipeline = executeRenderPipeline(createRenderPipeline(), frameContext);
assert.deepEqual(pipeline.executedStages, ['prepare_frame','resolve_sources','compute_dirty_layers','update_cache','draw_background','draw_layers','draw_overlays','draw_guides','finalize_frame'], 'pipeline stages execute in deterministic order');
assert.equal(summarizeRendererHealth({ backendType: 'canvas2d', targetFps: 30, estimatedFps: 30, averageRenderMs: 3, p95RenderMs: null, droppedFrames: 0, overBudgetFrames: 0, cacheHitRate: 0, activeLayerCount: 1, dirtyLayerCount: 1, memoryPressure: 'unknown', isHealthy: true, warnings: [] }).includes('healthy'), true, 'renderer health summary works');
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

assertMonotonicFrameId(1, 2);
assertFrameTimestampFromClock(clock, 3, 100);
const assignedCurrent = assignIntentToFrame({ id: 'timing-current', type: 'sync', executionType: 'EXECUTE_FRAME_SYNC', sourceGraphRevision: 1, dependencies: [], priority: 0, targetSubsystem: 'sync', payload: {}, timingConstraint: {}, submittedAt: '2026-07-01T00:00:00.000Z' }, clock.getState(), { nowMs: 70, cutoffMs: 8 });
const assignedLate = assignIntentToFrame({ id: 'timing-late', type: 'sync', executionType: 'EXECUTE_FRAME_SYNC', sourceGraphRevision: 1, dependencies: [], priority: 0, targetSubsystem: 'sync', payload: {}, timingConstraint: {}, submittedAt: '2026-07-01T00:00:00.000Z' }, clock.getState(), { nowMs: 94, cutoffMs: 8 });
assert.equal(assignedCurrent.scheduledFrameId, 2, 'intent before cutoff executes on current frame');
assert.equal(assignedLate.scheduledFrameId, getNextExecutableFrame(clock.getState()), 'late intent moves to next executable frame');
assert.equal(classifyDrift(21), 'warning', 'drift classification detects warning threshold');
assert.equal(summarizeFrameDrift({ renderDriftMs: 0, audioDriftMs: 55, videoDriftMs: 0, outputDriftMs: 0 }).worst.severity, 'degraded', 'frame drift summary reports worst severity');
assert.equal(createDriftWarning('renderDriftMs', 101)?.includes('CRITICAL'), true, 'drift warning includes severity');
assertNoIndependentSubsystemClock({ frameId: 2, frameTimestamp: 67 });


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

const orchestrationClock = createClock({ frameRate: 30, now: () => 0 });
orchestrationClock.startClock();
const orchestration = new MediaOrchestrationEngine(orchestrationClock);
orchestration.submitIntent({
  id: 'orch-video',
  type: 'video',
  executionType: 'ROUTE_PROGRAM_VIDEO',
  sourceGraphRevision: 1,
  dependencies: [],
  priority: 1,
  targetSubsystem: 'video',
  payload: {},
  timingConstraint: {},
  submittedAt: '2026-07-01T00:00:00.000Z',
});
orchestration.submitIntent({
  id: 'orch-render',
  type: 'render',
  executionType: 'RENDER_FRAME',
  sourceGraphRevision: 1,
  dependencies: ['orch-video'],
  priority: 1,
  targetSubsystem: 'render',
  payload: {},
  timingConstraint: {},
  submittedAt: '2026-07-01T00:00:00.000Z',
});
const orchestrationPlan = orchestration.planExecutionFrame(0);
assert.deepEqual(
  orchestrationPlan.orderedExecutionSteps.map((intent) => intent.id),
  ['orch-video', 'orch-render'],
  'orchestration honors dependencies deterministically',
);
const repeatedPlan = orchestration.planFrame(
  {
    revision: 1,
    intents: orchestrationPlan.orderedExecutionSteps,
    edges: [{ from: 'orch-video', to: 'orch-render' }],
  },
  { frameTimestamp: orchestrationPlan.frameTimestamp, elapsedTime: orchestrationClock.getState().elapsedTime },
  { video: 'ready', audio: 'ready', render: 'ready', output: 'ready', sync: 'ready' },
);
assert.deepEqual(repeatedPlan, orchestrationPlan, 'same media intent graph and clock tick produce the same frame plan');
assertFramePlanHasFrameIdentity(orchestrationPlan);
const mockExecutionResults = await engine.executeMediaFramePlan(orchestrationPlan, transition.nextGraph);
assert.equal(mockExecutionResults.length, 2, 'execution engine executes orchestration frame plans');
assert.equal(
  orchestration.getDiagnostics().events.some((event) => event.type === 'ORCHESTRATION_PLAN_CREATED'),
  true,
  'orchestration emits planning events without execution events',
);
const cycleOrchestration = new MediaOrchestrationEngine(orchestrationClock);
cycleOrchestration.submitIntent({ id: 'cycle-a', type: 'video', executionType: 'ROUTE_PROGRAM_VIDEO', sourceGraphRevision: 1, dependencies: ['cycle-b'], priority: 0, targetSubsystem: 'video', payload: {}, timingConstraint: {}, submittedAt: '2026-07-01T00:00:00.000Z' });
cycleOrchestration.submitIntent({ id: 'cycle-b', type: 'audio', executionType: 'BUILD_AUDIO_ROUTE_PLAN', sourceGraphRevision: 1, dependencies: ['cycle-a'], priority: 0, targetSubsystem: 'audio', payload: {}, timingConstraint: {}, submittedAt: '2026-07-01T00:00:00.000Z' });
cycleOrchestration.resolveIntentGraph();
assert.equal(
  cycleOrchestration.detectConflicts().some((conflict) => conflict.type === 'circular_dependency'),
  true,
  'orchestration detects circular dependencies',
);


const webRTCPlan = createWebRTCTransportPlan({ sessionId: 'test-session', role: 'host', graphRevision: 8, env: {}, iceServers: [{ kind: 'turn', urls: ['turn:turn.example.invalid'], username: 'placeholder-user', credential: 'super-secret' }] });
assert.equal(webRTCPlan.enabled, false, 'disabled WebRTC runtime creates metadata-only plan');
assert.equal(validateWebRTCTransportPlan(webRTCPlan).valid, true, 'WebRTC transport plan validates');
let webRTCSession = createWebRTCSession(webRTCPlan);
assert.equal(webRTCSession.status, 'idle', 'disabled WebRTC session remains idle');
const webRTCPeer = createWebRTCPeer({ id: 'peer-1', role: 'guest' });
webRTCSession = addWebRTCPeer(webRTCSession, webRTCPeer);
assert.equal(webRTCSession.peers.length, 1, 'WebRTC peer add works');
webRTCSession = updateWebRTCPeerState(webRTCSession, 'peer-1', 'connected', { iceState: 'connected', signalingState: 'stable' });
assert.equal(webRTCSession.peers[0]?.connectionState, 'connected', 'WebRTC peer update works');
const trackRef = createWebRTCMediaTrackRef({ peerId: 'peer-1', trackId: 'track-audio', kind: 'audio', sourceId: 'guest-source', guestId: 'guest-1', muted: false, enabled: true, connectionState: 'connected', frameId: 1, graphRevision: 8 });
webRTCSession = { ...webRTCSession, remoteTrackRefs: [trackRef] };
assert.equal(summarizeWebRTCHealth(webRTCSession).connectedPeers, 1, 'WebRTC health summary counts connected peers');
assert.equal(createWebRTCManifest(webRTCSession).trackRefs[0]?.trackId, 'track-audio', 'WebRTC manifest stores track metadata refs');
assert.equal(validateWebRTCSignalMessage({ id: 'sig-1', type: 'offer', sessionId: 'test-session', peerId: 'peer-1', timestamp: '2026-07-01T00:00:00.000Z', payload: { description: { type: 'offer' } } }).valid, true, 'WebRTC signal message validates');
assert.equal(JSON.stringify(redactWebRTCDiagnostics(webRTCPlan)).includes('super-secret'), false, 'WebRTC TURN credentials are redacted');
assert.equal(createPeerConnection({ env: { UBOS_ENABLE_WEBRTC_RUNTIME: 'true' } }).errors[0], 'RTCPeerConnection unavailable', 'WebRTC browser API unavailable returns structured error');
assert.equal(mapWebRTCErrorToFailure({ message: 'ICE disconnected' }).classification, 'ice', 'WebRTC failure mapping classifies ICE errors');
assert.equal(isRealWebRTCEnabled({ UBOS_ENABLE_REAL_WEBRTC: 'true' }), true, 'Phase 9.4 real WebRTC flag enables runtime');
assert.equal(isRealWebRTCEnabled({ NEXT_PUBLIC_UBOS_REAL_WEBRTC: 'true' }), true, 'Phase 9.4 public real WebRTC flag enables browser runtime');
assert.equal(createOfferMetadata({ sessionId: 'test-session', peerId: 'peer-1', revision: 8 }).redacted, true, 'WebRTC offer metadata is redacted');
assert.equal(createAnswerMetadata({ sessionId: 'test-session', peerId: 'peer-1', revision: 8 }).description?.type, 'answer', 'WebRTC answer metadata is metadata-only');
assert.equal(createIceMetadata({ sessionId: 'test-session', peerId: 'peer-1', protocol: 'udp' }).redacted, true, 'WebRTC ICE metadata redacts candidates');
assert.equal(validateWebRTCSignalingMetadata({ id: 'bad-sdp', type: 'offer', sessionId: 'test-session', peerId: 'peer-1', timestamp: '2026-07-01T00:00:00.000Z', payload: { description: 'v=0\r\na=sendrecv' } }, ['peer-1']).valid, false, 'WebRTC signaling validator rejects raw SDP injection');
assert.equal(validateWebRTCSignalingMetadata({ id: 'bad-peer', type: 'peer_joined', sessionId: 'test-session', peerId: '../../bad', timestamp: '2026-07-01T00:00:00.000Z', payload: {} }).valid, false, 'WebRTC signaling validator rejects invalid peer IDs');
assert.equal(calculateBackpressure({ activeNegotiations: 2, maxConcurrentNegotiations: 2 }).throttled, true, 'WebRTC backpressure limits concurrent negotiations');
assert.equal(summarizeConnectionQuality(collectWebRTCStatistics({ bitrateKbps: 2500, latencyMs: 50, packetLossRatio: 0.01 })), 'healthy', 'WebRTC statistics summarize healthy connection quality');
assert.equal(planWebRTCRecovery({ sessionId: 'test-session', peerId: 'peer-1', reason: 'ICE disconnected', attempt: 2 }).action, 'ice_restart', 'WebRTC recovery maps ICE failures to ICE restart');
const pcManager = new PeerConnectionManager();
pcManager.create('peer-1', { env: {} });
assert.equal(pcManager.close('peer-1').success, true, 'PeerConnectionManager owns and disposes runtime handles');
const trackManager = new MediaTrackManager();
const mutedSession = trackManager.mute({ ...webRTCSession, localTrackRefs: [trackRef] }, 'track-audio', true);
assert.equal(mutedSession.localTrackRefs[0]?.muted, true, 'MediaTrackManager supports mute lifecycle');
const iceManager = new ICEManager();
assert.equal(iceManager.queueRestart('peer-1').queuedIceRestarts, 1, 'ICEManager queues ICE restarts for backpressure');
const signalingManager = new SignalingManager();
assert.equal(signalingManager.validate(signalingManager.createMessage({ type: 'peer_joined', sessionId: 'test-session', peerId: 'peer-1', payload: {} }), ['peer-1']).valid, true, 'SignalingManager validates session-owned metadata signals');
assert.equal(new ConnectionHealth().summarize(webRTCSession, collectWebRTCStatistics({ latencyMs: 400 })).status, 'degraded', 'ConnectionHealth includes connection quality degradation');
assert.equal(new WebRTCStatistics().collect({ reconnects: 2 }).reconnects, 2, 'WebRTCStatistics tracks reconnect counts');
assert.equal(new WebRTCRecovery().plan({ sessionId: 'test-session', peerId: 'peer-1', reason: 'peer disconnected' }).notifySupervisor, true, 'WebRTCRecovery plans supervisor notification');
assert.equal(new WebRTCValidator().validateSignal({ id: 'sig-owned', type: 'peer_joined', sessionId: 'test-session', peerId: 'peer-1', timestamp: '2026-07-01T00:00:00.000Z', payload: {} }, ['peer-1']).valid, true, 'WebRTCValidator validates peer ownership');
const sessionManager = new WebRTCSessionManager(webRTCPlan);
assert.equal(sessionManager.addPeer(createWebRTCPeer({ id: 'producer-1', role: 'producer' })).peers[0]?.role, 'producer', 'WebRTCSessionManager supports producer peers');
const realRuntime = new RealWebRTCRuntime();
assert.equal(realRuntime.offer('test-session', 'peer-1').type, 'offer', 'RealWebRTCRuntime creates offer metadata without storing SDP');
assert.equal(JSON.stringify(createWebRTCManifest(webRTCSession)).includes('RTCPeerConnection'), false, 'WebRTC graph/replay metadata excludes peer connections');
webRTCSession = removeWebRTCPeer(webRTCSession, 'peer-1');
assert.equal(webRTCSession.peers.length, 0, 'WebRTC peer remove works');
const webRTCMock = new MockMediaExecutionAdapter();
const webRTCMockResult = webRTCMock.execute({ id: 'webrtc-intent', type: 'ADD_WEBRTC_PEER', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: recordingTransition.nextGraph.metadata.revision, payload: { peerId: 'guest-peer', peerRole: 'guest' } }, recordingTransition.nextGraph);
assert.equal(webRTCMockResult.success, true, 'mock adapter handles WebRTC execution intent');
assert.equal(webRTCMock.getWebRTCSession()?.peers.length, 1, 'mock WebRTC execution preserves metadata-only session');

const brSurface = createRenderSurface({ id: 'surface-program', target: 'Program', graphRevision: 42 });
assert.equal(brSurface.status, 'planned', 'browser renderer surface creation is metadata only');
const brLayer = createRenderLayer({ id: 'layer-logo', kind: 'Logo', surfaceId: brSurface.id, layout: { left: 10, top: 10 } });
assert.equal(brLayer.kind, 'Logo', 'browser renderer layer creation supports declared layer kinds');
const brPass = createRenderPass({ id: 'pass-1', sessionId: 'session-1', frameId: 7, graphRevision: 42, executionBatchId: 'batch-1', surfaceIds: [brSurface.id], layerIds: [brLayer.id] });
assert.equal(brPass.executionBatchId, 'batch-1', 'browser render pass carries timing batch identity');
const brPlan = createBrowserRendererPlan({ graphRevision: 42, executionBatchId: 'batch-1', frameId: 7, surfaces: [brSurface], layers: [brLayer], passes: [brPass], layoutMetadata: { layoutId: 'layout-main' }, sceneMetadata: { activeSceneId: 'scene-a' } });
assert.equal(validateBrowserRendererPlan(brPlan).valid, true, 'browser renderer plan validation accepts valid metadata plans');
assert.equal(brPlan.replayMetadata['storesDom'], false, 'browser renderer replay metadata never stores DOM');
const badPlan = createBrowserRendererPlan({ graphRevision: 42, executionBatchId: 'batch-1', frameId: 7, surfaces: [brSurface], layers: [createRenderLayer({ id: 'bad-layer', kind: 'Video', surfaceId: 'missing' })] });
assert.equal(validateBrowserRendererPlan(badPlan).valid, false, 'browser renderer plan validation rejects missing surfaces');
const unavailableSession = createBrowserRendererSession(brPlan, {});
assert.equal(unavailableSession.state, 'unavailable', 'browser renderer defaults to metadata mock behavior when disabled');
const enabledSession = createBrowserRendererSession(brPlan, { NEXT_PUBLIC_UBOS_BROWSER_RENDERER: 'true' });
assert.equal(enabledSession.state, 'planned', 'browser renderer session enters planned state when enabled');
const updatedSession = updateRenderLayer(enabledSession, createRenderLayer({ id: 'layer-ticker', kind: 'Ticker', surfaceId: brSurface.id }));
assert.equal(updatedSession.backpressure.queuedUpdates, 1, 'browser renderer exposes queued update backpressure metadata');
assert.equal(removeRenderLayer(updatedSession, 'layer-ticker').layers.some((layer) => layer.id === 'layer-ticker'), false, 'browser renderer removes layer metadata only');
const rendererFailure = mapRendererFailure({ kind: 'render_timeout', message: 'render timed out', frameId: 7, graphRevision: 42 });
assert.equal(rendererFailure.ubosFailure.category, 'RENDERER_FAILURE', 'browser renderer failure maps into UBOS failure model');
const brHealth = summarizeBrowserRendererHealth({ ...enabledSession, failures: [rendererFailure], backpressure: { renderLatencyMs: 45, missedFrames: 2, queuedUpdates: 3, renderBacklog: 1, slowLayout: true, degradedRendering: true, degradedModes: ['reduce_preview_updates', 'pause_diagnostics'] } });
assert.equal(brHealth.status, 'degraded', 'browser renderer health summarizes degraded backpressure');
assert.equal(summarizeRendererHealth(brHealth).includes('Browser renderer degraded'), true, 'browser renderer compact health summary works');
const brManifest = createRendererManifest(enabledSession, { UBOS_ENABLE_BROWSER_RENDERER: 'true' });
assert.equal(brManifest.capabilities.supportsGpu, false, 'browser renderer manifest does not introduce GPU rendering');
assert.equal(brManifest.diagnostics.featureFlags.UBOS_ENABLE_BROWSER_RENDERER, true, 'browser renderer diagnostics expose feature flags');
const redactedDiagnostics = redactRendererDiagnostics(brManifest.diagnostics);
assert.equal(redactedDiagnostics.renderSurfaces[0]?.metadata['redacted'], true, 'browser renderer diagnostics redacts surface metadata');
assert.equal(createHTMLElement('div'), undefined, 'browser renderer is Node compatible when DOM is unavailable');
const frameToken = requestBrowserFrame(() => undefined);
cancelBrowserFrame(frameToken);
assert.equal(typeof frameToken, 'number', 'browser renderer mock frame request works without browser RAF');
assert.equal(JSON.stringify(brPlan).includes('HTMLElement'), false, 'browser renderer graph plan stores no DOM elements');
assert.equal(JSON.stringify(brPlan).includes('MediaStream'), false, 'browser renderer graph plan stores no media streams');




const ffmpegRuntimeCommand = buildCommand({ executable: 'ffmpeg', args: ['-hide_banner', '-nostdin', '-f', 'lavfi', '-i', 'testsrc2=size=16x16:rate=1', '-t', '0.1', '-f', 'null', '-'], outputs: ['-'], metadata: { graphRevision: 55 } });
assert.equal(ffmpegRuntimeCommand.args.includes('-nostdin'), true, 'real FFmpeg runtime command generation uses argument arrays');
assert.equal(validateExecutable('../ffmpeg').valid, false, 'real FFmpeg runtime rejects path traversal executables');
try { buildCommand({ executable: 'ffmpeg', args: ['-i', 'safe', ';rm -rf /'] }); throw new Error('unsafe arg accepted'); } catch (error) { assert.equal(String(error).includes('unsafe'), true, 'real FFmpeg runtime rejects shell injection arguments'); }
assert.equal(locateFFmpeg({ UBOS_FFMPEG_PATH: '/usr/bin/ffmpeg' }), '/usr/bin/ffmpeg', 'real FFmpeg runtime locates configured executable');
const ffmpegRuntime = createFFmpegRuntime({ env: {}, featureFlags: { UBOS_ENABLE_REAL_FFMPEG: false, NEXT_PUBLIC_UBOS_REAL_FFMPEG: false } });
const ffmpegMockProcess = await ffmpegRuntime.manager.start(ffmpegRuntimeCommand);
assert.equal(ffmpegMockProcess.state, 'running', 'real FFmpeg runtime mock fallback preserves lifecycle without spawning');
assert.equal(ffmpegRuntime.summarizeHealth().featureFlag, false, 'real FFmpeg runtime diagnostics expose disabled feature flag');
assert.equal(summarizeFFmpegRuntimeStatistics(ffmpegMockProcess).lifecycleEvents.some((event) => JSON.stringify(event).includes('pid')), false, 'real FFmpeg runtime replay events omit PID');
const ffmpegRestart = await ffmpegRuntime.manager.restart(ffmpegRuntimeCommand);
assert.equal(ffmpegRestart.state, 'running', 'real FFmpeg runtime restart re-enters running lifecycle');
const ffmpegStopped = await ffmpegRuntime.manager.stop();
assert.equal(ffmpegStopped?.state, 'stopped', 'real FFmpeg runtime stop lifecycle works');
const ffmpegFailure = mapFFmpegRuntimeFailure({ kind: 'spawn_failure', message: 'spawn failed' });
assert.equal(ffmpegFailure.ubosFailure.subsystem, 'ffmpeg-runtime', 'real FFmpeg runtime failure maps into UBOS failure model');
const ffmpegRuntimeHealth = summarizeFFmpegRuntimeHealth(ffmpegMockProcess, ffmpegRuntime.environment);
assert.equal(ffmpegRuntimeHealth.queueDepth, 0, 'real FFmpeg runtime health reports backpressure queue depth');
const ffmpegManifest = createFFmpegRuntimeManifest(ffmpegMockProcess, ffmpegRuntime.environment);
assert.equal(ffmpegManifest.containsProcessHandles, false, 'real FFmpeg runtime manifest excludes process handles');
assert.equal(ffmpegManifest.replayStoresStdout, false, 'real FFmpeg runtime manifest excludes stdout from replay');
const ffmpegCapabilities = await probeCapabilities('ffmpeg');
assert.equal(ffmpegCapabilities.shellExecution, false, 'real FFmpeg runtime capabilities forbid shell execution');

const productionRuntimeValidation = createProductionRuntime({ id: 'runtime-validation', latestFrameId: 101, latestGraphRevision: 55 });
const runtimeSession = createProductionRuntimeSession({ runtimeId: productionRuntimeValidation.id, broadcastSessionId: 'test-session' });
assert.equal(runtimeSession.state, 'idle', 'production runtime session defaults to idle');
const encoderSubsystem: RuntimeSubsystem = { id: 'encoder-subsystem', type: 'encoder', label: 'Encoder', required: true, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { pid: 10, safe: 'ok', ffmpegProcess: { unsafe: true } }, latestFrameId: 101, latestGraphRevision: 55 };
let supervisedRuntime = registerRuntimeSubsystem(productionRuntimeValidation, encoderSubsystem);
assert.equal(supervisedRuntime.subsystems.length, 1, 'runtime subsystem registration works');
assert.equal(JSON.stringify(supervisedRuntime.subsystems[0]?.diagnostics).includes('ffmpegProcess'), false, 'runtime diagnostics redacts process handles');
assert.equal(startProductionRuntime(supervisedRuntime).runtimeState, 'running', 'production runtime starts');
assert.equal(pauseProductionRuntime(supervisedRuntime).runtimeState, 'ready', 'production runtime pauses to ready');
assert.equal(resumeProductionRuntime(supervisedRuntime).runtimeState, 'running', 'production runtime resumes');
assert.equal(stopProductionRuntime(supervisedRuntime).runtimeState, 'stopped', 'production runtime stops');
const optionalStreaming: RuntimeSubsystem = { id: 'streaming-subsystem', type: 'streaming', label: 'Streaming', required: false, state: 'degraded', health: 'degraded', degradedModes: ['output_disabled_mode'], diagnostics: { status: 'offline', streamHandle: 'unsafe' } };
supervisedRuntime = registerRuntimeSubsystem(supervisedRuntime, optionalStreaming);
assert.equal(summarizeProductionRuntimeHealth(supervisedRuntime).health, 'degraded', 'optional degraded subsystem degrades runtime health');
assert.equal(summarizeProductionRuntimeHealth(supervisedRuntime).degradedModes[0], 'output_disabled_mode', 'runtime health reports degraded modes');
const runtimeFailure = mapRuntimeFailure({ subsystem: optionalStreaming, message: 'stream offline', graphRevision: 55, frameId: 101 });
assert.equal(runtimeFailure.ubosFailure.category, 'STREAMING_FAILURE', 'runtime failure maps to UBOS failure model');
assert.equal(failRuntimeSubsystem(supervisedRuntime, 'streaming-subsystem', 'stream offline').runtimeState, 'degraded', 'optional runtime subsystem failure is degraded');
assert.equal(restartRuntimeSubsystem(supervisedRuntime, 'streaming-subsystem').runtimeState, 'recovering', 'runtime subsystem restart enters recovering');
const productionRuntimeManifest = createProductionRuntimeManifest(supervisedRuntime);
assert.equal(productionRuntimeManifest.containsRuntimeHandles, false, 'production runtime manifest declares no runtime handles');
assert.equal(JSON.stringify(productionRuntimeManifest).includes('streamHandle'), false, 'production runtime manifest excludes handles');
assert.equal(JSON.stringify(redactRuntimeDiagnostics({ mediaStream: 'unsafe', latestGraphRevision: 55, status: 'ok' })).includes('unsafe'), false, 'runtime diagnostics redaction removes media handles');
supervisedRuntime = unregisterRuntimeSubsystem(supervisedRuntime, 'streaming-subsystem');
assert.equal(supervisedRuntime.subsystems.some((subsystem) => subsystem.id === 'streaming-subsystem'), false, 'runtime subsystem unregister works');
const supervisor = new RuntimeSupervisor(supervisedRuntime);
const buildRuntimeResult = supervisor.handleIntent({ id: 'runtime-intent-build', type: 'BUILD_PRODUCTION_RUNTIME', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: 55, payload: {} });
assert.equal(buildRuntimeResult.success, true, 'mock production runtime build intent handled');
const reportRuntimeResult = supervisor.handleIntent({ id: 'runtime-intent-report', type: 'REPORT_PRODUCTION_RUNTIME_HEALTH', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: 55, payload: {} });
assert.equal(reportRuntimeResult.errors.length, 0, 'mock runtime health intent handled');
const runtimeMock = new MockMediaExecutionAdapter();
const runtimeMockResult = runtimeMock.execute({ id: 'runtime-intent-start', type: 'START_PRODUCTION_RUNTIME', timestamp: '2026-07-01T00:00:00.000Z', graphRevision: recordingTransition.nextGraph.metadata.revision, payload: {} }, recordingTransition.nextGraph);
assert.equal(runtimeMockResult.success, true, 'mock adapter accepts production runtime execution intent');
assert.equal(JSON.stringify(recordingTransition.nextGraph).includes('ffmpegProcess'), false, 'production graph contains no runtime process handles');

const orchestrator = new BroadcastOrchestrator({ UBOS_ENABLE_ORCHESTRATOR: 'true', NEXT_PUBLIC_UBOS_ORCHESTRATOR: 'true' });
orchestrator.register({ id: 'gpu-runtime', type: 'gpu', label: 'GPU Runtime', required: true, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { backend: 'mock' } });
orchestrator.register({ id: 'audio-runtime-validation', type: 'audio', label: 'Audio Runtime', required: false, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { sampleRate: 48000 } });
orchestrator.register({ id: 'encoder-runtime', type: 'encoder', label: 'Encoder Runtime', required: true, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { codec: 'h264' } });
assert.equal(orchestrator.startProduction({ graphRevision: 55 }).success, true, 'broadcast orchestrator starts production through single authority');
assert.equal(orchestrator.snapshot().state, 'running', 'broadcast orchestrator lifecycle reaches running');
assert.equal(orchestrator.pauseProduction().runtimeState, 'ready', 'broadcast orchestrator pauses through supervisor');
assert.equal(orchestrator.resumeProduction().success, true, 'broadcast orchestrator resumes through supervisor');
assert.equal(orchestrator.activateScene('scene-live').success, true, 'broadcast orchestrator coordinates scene activation');
const orchestratorSnapshot = orchestrator.snapshot();
assert.equal(orchestratorSnapshot.containsRuntimeHandles, false, 'broadcast orchestrator snapshot is metadata-only');
assert.equal(orchestratorSnapshot.replay.containsRuntimeHandles, false, 'broadcast orchestrator replay is metadata-only');
assert.equal(orchestratorSnapshot.dashboard.globalHealth, 'healthy', 'broadcast orchestrator control room dashboard reports global health');
assert.equal(orchestratorSnapshot.plan?.steps[0]?.type, 'gpu', 'broadcast orchestrator schedules dependencies deterministically');
assert.equal(orchestrator.recoverSubsystem('audio-runtime-validation').runtimeState, 'recovering', 'broadcast orchestrator schedules subsystem recovery');
assert.equal(orchestrator.stopProduction().runtimeState, 'stopped', 'broadcast orchestrator stops production safely');
const resourceCoordinator = new ResourceCoordinator({ cpu: 5, gpu: 0, memoryMb: 512, encoders: 0, networkMbps: 10, threads: 1 });
const resourceAllocation = resourceCoordinator.allocate([{ subsystemId: 'streaming', cpu: 10, networkMbps: 20, priority: 100 }]);
assert.equal(resourceAllocation[0]?.granted, false, 'broadcast orchestrator rejects over-budget resource allocation');
const executionCoordinator = new ExecutionCoordinator();
const unsafePlan = executionCoordinator.createPlan('start', [], { metadata: { processHandle: 'unsafe' } });
assert.equal(executionCoordinator.validate(unsafePlan).length > 0, true, 'broadcast orchestrator rejects runtime handles in plans');
assert.equal(isBroadcastOrchestratorEnabled({ UBOS_ENABLE_ORCHESTRATOR: 'true', NEXT_PUBLIC_UBOS_ORCHESTRATOR: 'true' }), true, 'broadcast orchestrator feature flags enable runtime');
const disabledOrchestrator = new BroadcastOrchestrator({ UBOS_ENABLE_ORCHESTRATOR: 'false', NEXT_PUBLIC_UBOS_ORCHESTRATOR: 'false' });
disabledOrchestrator.register(encoderSubsystem);
assert.equal(disabledOrchestrator.startProduction().success, true, 'broadcast orchestrator falls back to supervisor when disabled');

const haPrimary = createClusterNode({ id: 'node-primary', role: 'primary', state: 'healthy', leaderState: 'leader', priority: 100, subsystems: [encoderSubsystem] });
const haStandby = createClusterNode({ id: 'node-standby', role: 'standby', standbyMode: 'hot', state: 'healthy', leaderState: 'follower', priority: 90 });
const haRuntime = new HighAvailabilityRuntime([haPrimary, haStandby], supervisor, orchestrator, { UBOS_ENABLE_HIGH_AVAILABILITY: 'true', NEXT_PUBLIC_UBOS_HIGH_AVAILABILITY: 'true' });
assert.equal(haRuntime.enabled(), true, 'high availability feature flags enable runtime');
haRuntime.beat('node-primary');
haRuntime.recordHealth('node-primary', 'encoder', 'healthy', true, 'encoder healthy');
const failoverResult = haRuntime.failoverPrimary('node-primary');
assert.equal(failoverResult.cluster.leaderNodeId, 'node-standby', 'high availability promotes hot standby on primary failure');
const recoveryResult = haRuntime.recover('encoder-runtime', ['restart_encoder', 'restart_ffmpeg', 'confirm_recovery', 'stabilize_health']);
assert.equal(recoveryResult.manifest.containsRuntimeHandles, false, 'recovery manifest is metadata-only');
assert.equal(recoveryResult.diagnostics.progress, 100, 'automatic recovery reports completion progress');
const haSnapshot = haRuntime.snapshot();
assert.equal(haSnapshot.containsRuntimeHandles, false, 'high availability snapshot is metadata-only');
assert.equal(haSnapshot.dashboard.failoverEvents.length > 0, true, 'control room failover events are reported');
assert.equal(new ClusterManager().validate({ ...haSnapshot.cluster, nodes: haSnapshot.cluster.nodes.map((node) => ({ ...node, leaderState: 'leader' as const })) }).includes('multiple leaders rejected'), true, 'high availability rejects multiple leaders');
assert.equal(new RecoveryPlanner().validate({ ...recoveryResult.manifest, steps: [{ ...recoveryResult.manifest.steps[0]!, dependsOn: [recoveryResult.manifest.steps[0]!.id] }] }).includes('circular recovery rejected'), true, 'high availability rejects circular recovery plans');
assert.equal(new ElectionManager().elect([haPrimary, haStandby])?.id, 'node-primary', 'leader election prefers highest-priority healthy node');
assert.equal(tripCircuitBreaker({ id: 'ha-breaker', status: 'closed', failureCount: 1, threshold: 2, cooldownMs: 1000 }).status, 'open', 'circuit breaker opens at threshold');
assert.equal(isHighAvailabilityEnabled({ UBOS_ENABLE_HIGH_AVAILABILITY: 'true', NEXT_PUBLIC_UBOS_HIGH_AVAILABILITY: 'true' }), true, 'high availability environment flags are recognized');


// Phase 9.2 recording pipeline runtime validation
const recordingPipeline = new RecordingPipeline({ UBOS_ENABLE_REAL_RECORDING: 'false', NEXT_PUBLIC_UBOS_REAL_RECORDING: 'false' });
const recordingJob = await recordingPipeline.create({ outputDirectory: '/tmp/ubos-recording-validation', filename: 'phase-9-2-validation', format: 'mp4', overwrite: true, graphRevision: recordingTransition.nextGraph.metadata.revision, tracks: ['program-video', 'program-audio'], segment: true });
assert.equal(recordingJob.containsRuntimeHandles, false, 'recording job is metadata-only');
assert.equal(recordingPipeline.prepare(recordingJob.id).state, 'prepared', 'recording prepare lifecycle works');
const startedRecording = await recordingPipeline.start(recordingJob.id);
assert.equal(startedRecording.state, 'recording', 'recording start lifecycle works');
assert.equal(recordingPipeline.health(recordingJob.id).currentFile.endsWith('.mp4'), true, 'recording progress reports current file');
assert.equal(recordingPipeline.pause(recordingJob.id).state, 'paused', 'recording pause lifecycle works');
assert.equal(recordingPipeline.resume(recordingJob.id).state, 'recording', 'recording resume lifecycle works');
assert.equal(recordingPipeline.split(recordingJob.id).segmentIndex, 1, 'recording split increments segment index');
assert.equal((await recordingPipeline.stop(recordingJob.id)).state, 'stopped', 'recording stop lifecycle works');
const finalizedRecording = await recordingPipeline.finalize(recordingJob.id);
assert.equal(finalizedRecording.state, 'finalized', 'recording finalize lifecycle works');
assert.equal(recordingPipeline.manifest(recordingJob.id).containsFileHandles, false, 'recording manifest excludes file handles');
assert.equal(recordingPipeline.manifest(recordingJob.id).containsProcessHandles, false, 'recording manifest excludes process handles');
{ let rejected = false; try { safeRecordingFilename('../evil', 'mp4'); } catch { rejected = true; } assert.equal(rejected, true, 'recording filename validation rejects traversal'); }
{ let rejected = false; try { await recordingPipeline.create({ outputDirectory: '/tmp/ubos-recording-validation', filename: 'bad/evil', format: 'mp4' }); } catch { rejected = true; } assert.equal(rejected, true, 'recording validator rejects unsafe extension or name'); }
const queuedA = await recordingPipeline.create({ outputDirectory: '/tmp/ubos-recording-validation', filename: 'queued-a', format: 'mkv', overwrite: true });
const queuedB = await recordingPipeline.create({ outputDirectory: '/tmp/ubos-recording-validation', filename: 'queued-b', format: 'mov', overwrite: true });
recordingPipeline.scheduler.markStarted('synthetic-1');
recordingPipeline.scheduler.markStarted('synthetic-2');
await recordingPipeline.start(queuedA.id);
assert.equal(recordingPipeline.scheduler.queue.length >= 1, true, 'recording scheduler queues over concurrency limit');
recordingPipeline.scheduler.markStopped('synthetic-1');
recordingPipeline.scheduler.markStopped('synthetic-2');
assert.equal(isRealRecordingEnabled({ UBOS_ENABLE_REAL_RECORDING: 'true', NEXT_PUBLIC_UBOS_REAL_RECORDING: 'true' }), true, 'recording feature flags enable real runtime');
assert.equal(JSON.stringify(recordingTransition.nextGraph).includes('temporaryPath'), false, 'production graph remains free of recording runtime paths');
assert.equal(recordingPipeline.archive(recordingJob.id).state, 'archived', 'recording archive lifecycle works');
assert.equal((await recordingPipeline.delete(recordingJob.id)).state, 'deleted', 'recording delete lifecycle works');


const gpuPipeline = createGpuPipeline({ id: 'gpu-pipeline:test', graphRevision: 7 });
assert.equal(validateGpuPipeline(gpuPipeline).valid, true, 'GPU pipeline metadata validates');
assert.equal(
  validateGpuPipeline({ ...gpuPipeline, metadata: { leakedContext: createGpuContext() } }).valid,
  false,
  'GPU pipeline rejects runtime-only context placeholders',
);
assert.equal(
  validateGpuPipeline({
    ...gpuPipeline,
    metadata: {
      leakedTexture: allocateTexture({ id: 'texture:test', kind: 'texture', metadata: {} }),
    },
  }).valid,
  false,
  'GPU pipeline rejects non-serializable texture placeholders',
);
const gpuSession = createGpuSession({ pipeline: gpuPipeline }, { UBOS_ENABLE_GPU_RUNTIME: 'true' });
const gpuManifest = createGpuManifest(gpuSession, { UBOS_ENABLE_GPU_RUNTIME: 'true' });
assert.equal(gpuManifest.capabilities.metadataOnly, true, 'GPU manifest is metadata-only');
assert.equal(summarizeGpuHealth(gpuSession).status, 'healthy', 'GPU session starts healthy');
const failedGpuResult = createGpuRuntime(gpuSession).execute({
  id: 'intent-gpu-fail',
  type: 'FAIL_GPU_RUNTIME',
  graphRevision: 7,
  timestamp: '2026-07-01T00:00:00.000Z',
  payload: {},
});
assert.equal(failedGpuResult.success, false, 'GPU failure intent fails execution');
assert.equal(
  failedGpuResult.manifest.diagnostics.health.status,
  'failed',
  'failed GPU runtime reports failed health',
);


const hardwareRuntime = new HardwareRuntime({ UBOS_ENABLE_HARDWARE_RUNTIME: 'true', NEXT_PUBLIC_UBOS_HARDWARE_RUNTIME: 'true' });
const hardwareDevices = hardwareRuntime.detect();
assert.equal(hardwareDevices.some((device) => device.api === 'NVENC'), true, 'hardware runtime detects metadata NVENC support');
assert.equal(hardwareDevices.every((device) => device.capabilities.metadataOnly), true, 'hardware capabilities are metadata-only');
const hardwareSchedule = hardwareRuntime.schedule(encoderPlan);
assert.equal(hardwareSchedule.success, true, 'hardware scheduler allocates an encoder session');
assert.equal(hardwareRuntime.manifest().containsRuntimeHandles, false, 'hardware manifest never serializes runtime handles');
assert.equal(hardwareRuntime.manifest().replay.some((event) => event.type === 'capability_snapshot'), true, 'hardware replay captures capability snapshots');
assert.equal(new EncoderManager().selectEncoder(createHardwareDevice({ id: 'nvenc-test', api: 'NVENC' })), 'nvenc', 'hardware encoder manager maps NVENC metadata to encoder runtime');
const hardwareValidator = new HardwareValidator();
assert.equal(hardwareValidator.validateDevice(createHardwareDevice({ id: 'bad', vendor: 'Unknown' })).valid, false, 'hardware validator rejects unknown devices');
assert.equal(hardwareValidator.assertMetadataOnly({ leaked: { runtimeOnly: true, serializable: false } }).valid, false, 'hardware validator rejects serialized runtime handle markers');
const overloadedDevice = createHardwareDevice({ id: 'overload', api: 'QuickSync', activeEncoders: 3, capabilities: { ...defaultHardwareCapabilitiesForValidation('QuickSync'), encoderCount: 3 } });
assert.equal(hardwareValidator.validateReservation({ id: 'reservation-over', deviceId: overloadedDevice.id, encoderApi: 'QuickSync', codec: 'h264', priority: 1, budget: { memoryMb: 128, bitrateKbps: 4500, fps: 30 }, createdAt: '2026-07-01T00:00:00.000Z', metadataOnly: true }, overloadedDevice).valid, false, 'hardware validator rejects encoder over allocation');
const recoveryPlan = new HardwareRecovery().plan(createHardwareFailure({ code: 'DRIVER_RESTART', message: 'driver restarted', ...(hardwareDevices[0]?.id ? { deviceId: hardwareDevices[0].id } : {}) }));
assert.equal(recoveryPlan.metadataOnly, true, 'hardware recovery plan is metadata-only');
assert.equal(hardwareRuntime.recover(createHardwareFailure({ code: 'ENCODER_RESTART', message: 'encoder restart', ...(hardwareDevices[0]?.id ? { deviceId: hardwareDevices[0].id } : {}) })).replaySafe, true, 'hardware recovery is replay-safe');
assert.equal(isHardwareRuntimeEnabled({ UBOS_ENABLE_HARDWARE_RUNTIME: 'true' }), true, 'hardware feature flag enables runtime');
assert.equal(new DeviceManager().detect({}).some((device) => device.api === 'Software'), true, 'hardware runtime falls back to software encoder when disabled');
assert.equal(hardwareRuntime.integrateGpu(gpuSession).gpuRuntimeIntegrated, true, 'hardware runtime integrates GPU runtime metadata');
assert.equal(JSON.stringify(recordingTransition.nextGraph).includes('hardware-device'), false, 'production graph remains free of hardware runtime devices');

const audioChannel = createAudioChannel({ id: 'ch-host', sourceId: 'host-mic', routes: ['bus:program'] });
const audioRuntime = new AudioRuntime({ UBOS_ENABLE_REAL_AUDIO: 'true', NEXT_PUBLIC_UBOS_REAL_AUDIO: 'true' });
let audioSession = audioRuntime.create({ id: 'audio-test', graphRevision: 95, channels: [audioChannel] });
assert.equal(audioSession.mode, 'real', 'real audio feature flag enables runtime mode');
assert.equal(audioSession.containsRuntimeHandles, false, 'audio session remains metadata-only');
assert.equal(audioSession.buses.length, 9, 'professional audio buses are created');
audioSession = audioRuntime.mixer.setGain(audioSession, 'ch-host', 1.25);
audioSession = audioRuntime.mixer.setMute(audioSession, 'ch-host', true);
audioSession = audioRuntime.mixer.setSolo(audioSession, 'ch-host', true);
audioSession = audioRuntime.mixer.setDelay(audioSession, 'ch-host', 80);
audioSession = audioRuntime.mixer.addEffect(audioSession, 'ch-host', { id: 'fx-limit', kind: 'limiter', enabled: true, order: 1, parameters: { ceilingDb: -1 }, containsRuntimeHandles: false });
assert.equal(audioSession.replay.length, 5, 'audio replay captures metadata control changes');
const mixMinus = new MixMinusManager().create({ id: 'mm-host', role: 'host', sourceChannelId: 'ch-host', busId: 'bus:guest', allSourceIds: ['ch-host', 'ch-guest'] });
assert.equal(mixMinus.noEcho, true, 'mix-minus enforces no echo');
const invalidRoute = new AudioValidator().validateRouting(audioSession.buses, audioSession.channels, { routes: [{ from: 'bus:program', to: 'bus:master', gain: 9, enabled: true }], containsRuntimeHandles: false });
assert.equal(invalidRoute.valid, false, 'audio validator rejects invalid gain and protected loops');
assert.equal(audioRuntime.start().success, true, 'audio runtime supervisor starts');
assert.equal(audioRuntime.health.summarize(audioSession).status, 'healthy', 'audio health summarizes runtime');
const mockAudio = new AudioRuntime({}).create({ id: 'audio-mock' });
assert.equal(mockAudio.mode, 'mock', 'audio runtime preserves mock fallback');


// Phase 9.9 Production Broadcast Engine validation
const productionEngine = new ProductionEngine({ UBOS_ENABLE_PRODUCTION_ENGINE: 'true', NEXT_PUBLIC_UBOS_PRODUCTION_ENGINE: 'true' });
productionEngine.register({ id: 'pe-gpu', type: 'gpu', label: 'GPU Runtime', required: true, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { backend: 'metadata' } });
productionEngine.register({ id: 'pe-browser', type: 'browser_renderer', label: 'Browser Renderer', required: false, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { renderer: 'browser' } });
productionEngine.register({ id: 'pe-audio', type: 'audio', label: 'Audio Runtime', required: true, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { sampleRate: 48000 } });
productionEngine.register({ id: 'pe-encoder', type: 'encoder', label: 'Encoder Runtime', required: true, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { codec: 'h264' } });
productionEngine.register({ id: 'pe-ffmpeg', type: 'ffmpeg', label: 'FFmpeg Runtime', required: false, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { executable: 'ffmpeg' } });
productionEngine.register({ id: 'pe-recording', type: 'recording', label: 'Recording Runtime', required: false, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { destination: 'file' } });
productionEngine.register({ id: 'pe-streaming', type: 'streaming', label: 'Streaming Runtime', required: false, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { protocol: 'rtmp' } });
productionEngine.register({ id: 'pe-webrtc', type: 'webrtc', label: 'WebRTC Runtime', required: false, state: 'ready', health: 'healthy', degradedModes: [], diagnostics: { peers: 0 } });
assert.equal(productionEngine.start({ graphRevision: 99 }).success, true, 'production engine starts through orchestrator and supervisor');
const scheduledFrame = productionEngine.scheduleFrame(100);
assert.equal(scheduledFrame.metadataOnly, true, 'production engine frame schedule is metadata-only');
assert.equal(productionEngine.health().summary.includes('runtimes coordinated'), true, 'production engine coordinates all runtimes');
assert.equal(productionEngine.snapshot().containsRuntimeHandles, false, 'production engine snapshot is metadata-only');
assert.equal(productionEngine.snapshot().history.containsRuntimeHandles, false, 'production engine replay history is metadata-only');
assert.equal(productionEngine.checkpoint().replaySafe, true, 'production engine checkpoints are replay safe');
assert.equal(productionEngine.recover('validation recovery').action, 'recover', 'production engine recovery records recovery history');
assert.equal(productionEngine.dashboard().sessionInspector.metadataOnly, true, 'production engine dashboard exposes metadata-only session inspector');
assert.equal(productionEngine.pause().success, true, 'production engine pause lifecycle works');
assert.equal(productionEngine.resume().success, true, 'production engine resume lifecycle works');
assert.equal(productionEngine.stop().runtimeState, 'stopped', 'production engine stop lifecycle works');
const productionSteps = new ProductionPipelineScheduler().schedule(['gpu', 'audio', 'encoder']);
assert.equal(productionSteps[0]?.subsystem, 'gpu', 'production engine scheduler orders pipeline deterministically');
const invalidManifest = { ...productionEngine.snapshot().manifest, steps: productionEngine.snapshot().manifest.steps.map((step) => step.subsystem === 'audio' ? { ...step, order: 0 } : step) };
assert.equal(new (await import('./production-engine/index.js')).ExecutionValidator().validateManifest(invalidManifest).length > 0, true, 'production engine rejects unsafe execution order');
assert.equal(new (await import('./production-engine/index.js')).ExecutionValidator().validateClock([{ timestamp: '2026-07-01T00:00:00.000Z', frameId: 1, clockMs: 1, driftMs: 101, source: 'audio' }]).length > 0, true, 'production engine rejects clock conflicts');
assert.equal(isProductionEngineEnabled({ UBOS_ENABLE_PRODUCTION_ENGINE: 'true', NEXT_PUBLIC_UBOS_PRODUCTION_ENGINE: 'true' }), true, 'production engine feature flags enable runtime');



// UBOS 2.0 Phase 2.3 media clock and frame scheduler validation
let deterministicNow = 10_000;
const phaseClock = createClock({ frameRate: 29.97, now: () => deterministicNow });
assert.equal(SUPPORTED_FRAME_RATES.includes(59.94), true, 'media clock exposes broadcast fractional frame rates');
let clockState = phaseClock.start();
assert.equal(clockState.status, 'running', 'media clock starts');
deterministicNow += 1000 / 29.97;
clockState = phaseClock.getState();
assert.equal(clockState.currentFrame, 1, 'media clock tracks frame number from elapsed time');
assert.equal(clockState.presentationTimestamp, phaseClock.getFrameTimestamp(1), 'media clock derives PTS from frame rate');
assert.equal(clockState.mediaTimestamp, clockState.presentationTimestamp, 'media clock exposes media timestamp');
clockState = phaseClock.pause();
assert.equal(clockState.status, 'paused', 'media clock pauses');
deterministicNow += 500;
clockState = phaseClock.resume();
assert.equal(clockState.status, 'running', 'media clock resumes');
clockState = phaseClock.reset();
assert.equal(clockState.currentFrame, 0, 'media clock resets frame number');
phaseClock.start();
const phaseBus = new MediaSyncBus();
const phaseScheduler = new FrameScheduler(phaseClock, phaseBus, { lateThresholdMs: 5, driftThresholdMs: 10 });
deterministicNow += 1000 / 29.97;
const firstTick = phaseScheduler.createTick(deterministicNow);
assert.equal(firstTick.metadataOnly, true, 'frame ticks are metadata-only');
assert.equal(firstTick.containsFrameData, false, 'frame ticks do not contain frame data');
deterministicNow += (1000 / 29.97) * 3;
const droppedTick = phaseScheduler.createTick(deterministicNow + 20);
assert.equal(droppedTick.diagnostics!.droppedFrames >= 1, true, 'frame scheduler detects dropped frames');
assert.equal(phaseBus.listEvents().some((event) => event.type === 'FRAME_DROPPED'), true, 'frame scheduler emits dropped frame events');
const duplicateTick = phaseScheduler.createTick(deterministicNow + 21);
assert.equal(duplicateTick.diagnostics!.classification, 'duplicated', 'frame scheduler detects duplicated frames');
assert.equal(phaseScheduler.getStats().lateFrames > 0, true, 'frame scheduler tracks late frame diagnostics');
deterministicNow += 15;
phaseScheduler.createTick(deterministicNow);
assert.equal(phaseBus.listEvents().some((event) => event.type === 'DRIFT_DETECTED'), true, 'frame scheduler emits clock drift diagnostics');
assert.equal(JSON.stringify(firstTick).includes('runtimeHandles'), false, 'frame scheduler state remains serializable metadata');

// UBOS 2.0 Phase 2.1 media runtime foundation validation
const fileVideoSource = createMediaSource({ id: 'source:file-video', kind: 'video_file', uri: 'fixtures/video.mp4', graphSourceId: 'graph-video' });
const fileAudioSource = createMediaSource({ id: 'source:file-audio', kind: 'audio_file', uri: 'fixtures/audio.wav', graphSourceId: 'graph-audio' });
const cameraSource = createMediaSource({ id: 'source:camera', kind: 'camera', uri: '/dev/video0' });
const micSource = createMediaSource({ id: 'source:mic', kind: 'microphone', uri: 'default' });
const mp4Sink = createMediaSink({ id: 'sink:recording', kind: 'mp4_recording', uri: 'recordings/test.mp4' });
const rtmpSink = createMediaSink({ id: 'sink:rtmp', kind: 'rtmp_stream', uri: 'rtmp://example.test/live/key', enabled: false });
const mediaPipeline = createMediaRuntimePipeline({ id: 'pipeline:phase-2-1', sources: [fileVideoSource, fileAudioSource, cameraSource, micSource], sinks: [mp4Sink, rtmpSink], graphRevision: 121 });
const coreClock = createCoreMediaClock(30);
const frameSchedule = new DefaultFrameScheduler().schedule(coreClock, mediaPipeline.sources, mediaPipeline.sinks, mediaPipeline.graphRevision);
assert.equal(frameSchedule.metadataOnly, true, 'frame scheduler emits metadata-only schedules');
assert.equal(frameSchedule.sources.length, 4, 'frame scheduler includes video, audio, camera, and microphone sources');
assert.equal(frameSchedule.sinks.includes('sink:recording'), true, 'frame scheduler targets MP4 sink metadata');
const recordingCommand = createMp4RecordingCommand(mediaPipeline, 'recordings/test.mp4', { executable: 'ffmpeg', env: {} });
assert.equal(recordingCommand.args.includes('-movflags'), true, 'MP4 recording command enables faststart flags');
assert.equal(recordingCommand.outputs[0], 'recordings/test.mp4', 'MP4 recording command declares output');
const rtmpCommand = createRtmpCommand(mediaPipeline, 'rtmp://example.test/live/key', { executable: 'ffmpeg', env: {} });
assert.equal(rtmpCommand.args.includes('-f'), true, 'RTMP command models output container');
assert.equal(rtmpCommand.metadata.initiallyStubbed, true, 'RTMP output remains an explicit Phase 2.1 stub');
const graphMappedPipeline = mapProductionGraphSources({ revision: 122, scenes: [{ sources: [{ id: 'camera-a', type: 'video', name: 'Camera A' }] }] });
assert.equal(graphMappedPipeline.sources[0]?.graphSourceId, 'camera-a', 'production graph source metadata maps to media runtime source');
const ffmpegMediaAdapter = createFFmpegMediaRuntimeAdapter({ executable: 'ffmpeg', env: {} });
const ffmpegPipelineState = await ffmpegMediaAdapter.createPipeline(mediaPipeline);
assert.equal(ffmpegPipelineState.containsMediaPayloads, false, 'FFmpeg media runtime state never serializes media payloads');
const ffmpegRecordingState = await ffmpegMediaAdapter.recordMp4(mediaPipeline, 'recordings/test.mp4');
assert.equal(ffmpegRecordingState.state, 'recording', 'FFmpeg adapter creates basic recording pipeline');
const ffmpegRtmpState = await ffmpegMediaAdapter.streamRtmp(mediaPipeline, 'rtmp://example.test/live/key');
assert.equal(ffmpegRtmpState.events[0]?.type, 'rtmp_stubbed', 'FFmpeg adapter exposes RTMP as stubbed output abstraction');
await ffmpegMediaAdapter.stop();

// UBOS 2.0 Phase 2.2 real FFmpeg process pipeline validation
const dryRunRuntime = createFFmpegRuntime(createFFmpegEnvironment({}), { dryRun: true, startupTimeoutMs: 25 });
const dryRunCommand = buildCommand({ executable: 'ffmpeg', args: ['-version'], outputs: [], metadata: { test: 'dry-run' } });
const dryRunProcess = await dryRunRuntime.manager.start(dryRunCommand);
assert.equal(dryRunProcess.state, 'running', 'FFmpeg dry-run process enters running lifecycle without spawning');
assert.equal(dryRunProcess.dryRun, true, 'FFmpeg dry-run records mock-safe execution mode');
assert.equal(dryRunProcess.events.some((event) => event.type === 'dry_run_running'), true, 'FFmpeg dry-run emits lifecycle event');
assert.equal(dryRunRuntime.createManifest().containsProcessHandles, false, 'FFmpeg runtime manifest excludes process handles');
const dryRunStopped = await dryRunRuntime.manager.stop();
assert.equal(dryRunStopped?.state, 'stopped', 'FFmpeg dry-run stop reaches stopped lifecycle');
const missingRuntime = createFFmpegRuntime(createFFmpegEnvironment({ UBOS_ENABLE_REAL_FFMPEG: 'true', NEXT_PUBLIC_UBOS_REAL_FFMPEG: 'true' }), { startupTimeoutMs: 100 });
const missingProcess = await missingRuntime.manager.start(buildCommand({ executable: 'ubos-ffmpeg-missing-binary', args: ['-version'], outputs: [] }));
await new Promise((resolve) => setTimeout(resolve, 25));
assert.equal(['failed', 'running'].includes(missingRuntime.manager.getProcess()?.state ?? missingProcess.state), true, 'FFmpeg real process layer tolerates missing binaries without throwing');
assert.equal(missingRuntime.createManifest().containsPipes, false, 'FFmpeg real process manifest excludes stdio pipes');
await missingRuntime.manager.kill();
