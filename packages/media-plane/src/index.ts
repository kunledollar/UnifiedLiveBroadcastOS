import type {
  ProductionGraph,
  ProductionGraphTransition,
  ProductionEvent,
} from '../../shared/src/production-graph.js';
import {
  CompositionStore,
  createSceneCompositionFromGraph,
  getCompositionWarnings,
  type CompositionRenderTarget,
} from './compositor/index.js';
import {
  VideoRouteStore,
  createVideoRouteGraph,
  createVideoRoutePlan,
  getVideoRouteWarnings,
} from './routing.js';
import {
  type FrameTickEvent,
} from './sync/index.js';
import { MediaOrchestrationEngine, toMediaIntent, toExecutionIntent } from './orchestration.js';
import { createClock } from './sync/clock.js';
import {
  AudioRouteStore,
  createAudioRouteGraph,
  createAudioRoutePlan,
  getAudioRouteWarnings,
} from './audio-routing/index.js';

export type MediaExecutionIntentType =
  | 'SWITCH_PROGRAM_SCENE'
  | 'UPDATE_PREVIEW_SCENE'
  | 'START_STREAM'
  | 'STOP_STREAM'
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'UPDATE_AUDIO_MIX'
  | 'APPLY_LAYOUT'
  | 'UPDATE_DESTINATION'
  | 'RENDER_MULTIVIEW'
  | 'BUILD_SCENE_COMPOSITION'
  | 'UPDATE_SCENE_COMPOSITION'
  | 'RENDER_PROGRAM_COMPOSITION'
  | 'RENDER_PREVIEW_COMPOSITION'
  | 'RENDER_MULTIVIEW_COMPOSITION'
  | 'BUILD_VIDEO_ROUTE_PLAN'
  | 'UPDATE_VIDEO_ROUTE'
  | 'ACTIVATE_VIDEO_ROUTE'
  | 'DEACTIVATE_VIDEO_ROUTE'
  | 'ROUTE_PROGRAM_VIDEO'
  | 'ROUTE_PREVIEW_VIDEO'
  | 'ROUTE_MULTIVIEW_VIDEO'
  | 'ROUTE_RECORDING_VIDEO'
  | 'ROUTE_STREAM_VIDEO'
  | 'BUILD_AUDIO_ROUTE_PLAN'
  | 'UPDATE_AUDIO_ROUTE'
  | 'ACTIVATE_AUDIO_ROUTE'
  | 'DEACTIVATE_AUDIO_ROUTE'
  | 'MUTE_AUDIO_ROUTE'
  | 'UNMUTE_AUDIO_ROUTE'
  | 'SET_AUDIO_ROUTE_GAIN'
  | 'BUILD_PROGRAM_MIX'
  | 'BUILD_STREAM_MIX'
  | 'BUILD_RECORDING_MIX'
  | 'BUILD_MONITOR_MIX'
  | 'BUILD_GUEST_RETURN_MIX'
  | 'RENDER_BROWSER_COMPOSITION'
  | 'START_BROWSER_RENDERER'
  | 'STOP_BROWSER_RENDERER'
  | 'UPDATE_BROWSER_RENDER_TARGET'
  | 'RENDER_FRAME'
  | 'EXECUTE_FRAME_SYNC'
  | 'SELECT_RENDER_BACKEND'
  | 'CLEAR_RENDER_CACHE'
  | 'FORCE_FULL_RENDER'
  | 'UPDATE_RENDER_PERFORMANCE_MODE'
  | 'REPORT_RENDER_HEALTH';

export type ExecutionRuntimeMode = 'disabled' | 'dry_run' | 'mock_live' | 'live_ready';
export type AdapterStatus = 'enabled' | 'disabled' | 'healthy' | 'unhealthy' | 'unavailable';
export type ExecutionEventType =
  | 'EXECUTION_INTENT_CREATED'
  | 'EXECUTION_STARTED'
  | 'EXECUTION_SUCCEEDED'
  | 'EXECUTION_FAILED'
  | 'EXECUTION_SKIPPED'
  | 'ADAPTER_SELECTED'
  | 'ADAPTER_UNAVAILABLE'
  | 'RUNTIME_MODE_CHANGED'
  | 'DRY_RUN_RECORDED';

export interface MediaExecutionIntent<TPayload = Record<string, unknown>> {
  readonly id: string;
  readonly type: MediaExecutionIntentType;
  readonly timestamp: string;
  readonly graphRevision: number;
  readonly payload: Readonly<TPayload>;
}

export interface MediaExecutionAdapterResponse {
  readonly adapterName: string;
  readonly success: boolean;
  readonly timestamp: string;
  readonly latencyMs: number;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface MediaExecutionResult {
  readonly success: boolean;
  readonly intentId: string;
  readonly timestamp: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly adapterResponses: readonly MediaExecutionAdapterResponse[];
}

export interface MediaExecutionAdapter {
  canHandle(intent: MediaExecutionIntent): boolean;
  execute(
    intent: MediaExecutionIntent,
    graph: ProductionGraph,
  ): Promise<MediaExecutionAdapterResponse> | MediaExecutionAdapterResponse;
  getName(): string;
}

export interface WebRtcMediaExecutionAdapter extends MediaExecutionAdapter {}
export * from './adapters/webrtc/index.js';
export * from './compositor/index.js';
export * from './routing.js';
export * from './audio-routing/index.js';
export * from './browser-renderer/index.js';
export * from './sync/index.js';
export * from './orchestration.js';
export interface RtmpMediaExecutionAdapter extends MediaExecutionAdapter {}
export interface FfmpegMediaExecutionAdapter extends MediaExecutionAdapter {}
export interface ObsMediaExecutionAdapter extends MediaExecutionAdapter {}

export interface AdapterMetadata {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly status: AdapterStatus;
  readonly capabilities: readonly MediaExecutionIntentType[];
  readonly isMock: boolean;
  readonly isLive: boolean;
  readonly lastExecutedAt?: string;
  readonly lastError?: string;
}

export interface ExecutionEvent {
  readonly id: string;
  readonly type: ExecutionEventType;
  readonly timestamp: string;
  readonly graphRevision: number;
  readonly intentId?: string;
  readonly adapterId?: string;
  readonly mode: ExecutionRuntimeMode;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface ExecutionLogEntry {
  readonly graphRevision: number;
  readonly intent: MediaExecutionIntent;
  readonly result: MediaExecutionResult;
}

export interface MediaExecutionHealth {
  readonly runtimeMode: ExecutionRuntimeMode;
  readonly activeAdapter?: AdapterMetadata;
  readonly adapterCount: number;
  readonly executedIntentCount: number;
  readonly skippedIntentCount: number;
  readonly failedIntentCount: number;
  readonly averageExecutionMs: number;
  readonly lastExecutionAt?: string;
  readonly lastError?: string;
  readonly isHealthy: boolean;
}

export interface MediaExecutionState {
  readonly currentGraphRevision: number;
  readonly runtimeMode: ExecutionRuntimeMode;
  readonly lastIntents: readonly MediaExecutionIntent[];
  readonly lastResults: readonly MediaExecutionResult[];
  readonly latestLog?: ExecutionLogEntry;
  readonly registeredAdapters: readonly string[];
  readonly adapterRegistry: readonly AdapterMetadata[];
  readonly activeAdapter?: AdapterMetadata;
  readonly latestEvents: readonly ExecutionEvent[];
  readonly orchestrationDiagnostics?: ReturnType<MediaOrchestrationEngine['getDiagnostics']>;
  readonly executionHealth: MediaExecutionHealth;
}

export interface MediaExecutionPlane {
  onGraphTransition(transition: ProductionGraphTransition): Promise<MediaExecutionResult[]>;
  executeFrameSync(tick: FrameTickEvent, graph: ProductionGraph, intents?: readonly MediaExecutionIntent[]): Promise<MediaExecutionResult[]>;
  getExecutionState(): MediaExecutionState;
  registerAdapter(adapter: MediaExecutionAdapter, metadata?: Partial<AdapterMetadata>): void;
}

export interface MockExecutionLatencyConfig {
  readonly minLatencyMs: number;
  readonly maxLatencyMs: number;
  readonly failureRate: number;
  readonly warningRate: number;
  readonly seed?: number;
}

const defaultMockLatency: MockExecutionLatencyConfig = Object.freeze({
  minLatencyMs: 0,
  maxLatencyMs: 0,
  failureRate: 0,
  warningRate: 0,
  seed: 1,
});
let globalRuntimeMode: ExecutionRuntimeMode = 'dry_run';
let globalMockLatency: MockExecutionLatencyConfig = defaultMockLatency;
let eventSequence = 0;

export function getExecutionRuntimeMode() {
  return globalRuntimeMode;
}
export function setExecutionRuntimeMode(mode: ExecutionRuntimeMode) {
  globalRuntimeMode = mode;
  return globalRuntimeMode;
}
export function isExecutionEnabled(mode = globalRuntimeMode) {
  return mode === 'mock_live' || mode === 'live_ready';
}
export function isDryRunMode(mode = globalRuntimeMode) {
  return mode === 'dry_run';
}
export function configureMockExecutionLatency(config: Partial<MockExecutionLatencyConfig>) {
  globalMockLatency = { ...globalMockLatency, ...config };
  return globalMockLatency;
}

const commandIntentMap = {
  CUT_TO_PROGRAM: 'SWITCH_PROGRAM_SCENE',
  SET_PREVIEW_SCENE: 'UPDATE_PREVIEW_SCENE',
  START_RECORDING: 'START_RECORDING',
  STOP_RECORDING: 'STOP_RECORDING',
  SET_WORKSPACE_PRESET: 'APPLY_LAYOUT',
  ASSIGN_SOURCE_TO_SCENE: 'UPDATE_SCENE_COMPOSITION',
  UPDATE_SOURCE: 'UPDATE_SCENE_COMPOSITION',
} as const;
const eventIntentMap = {
  AUDIO_MUTED: 'MUTE_AUDIO_ROUTE',
  AUDIO_UNMUTED: 'UNMUTE_AUDIO_ROUTE',
  AUDIO_LEVEL_CHANGED: 'SET_AUDIO_ROUTE_GAIN',
  GUEST_ADDED: 'BUILD_GUEST_RETURN_MIX',
  GUEST_REMOVED: 'BUILD_AUDIO_ROUTE_PLAN',
  DESTINATION_ENABLED: 'ROUTE_STREAM_VIDEO',
  DESTINATION_DISABLED: 'UPDATE_DESTINATION',
  PREVIEW_SCENE_CHANGED: 'ROUTE_PREVIEW_VIDEO',
  PROGRAM_SCENE_CHANGED: 'ROUTE_PROGRAM_VIDEO',
  TRANSITION_COMPLETED: 'UPDATE_SCENE_COMPOSITION',
  SOURCE_ADDED: 'BUILD_AUDIO_ROUTE_PLAN',
  SOURCE_REMOVED: 'BUILD_AUDIO_ROUTE_PLAN',
  SOURCE_UPDATED: 'UPDATE_SCENE_COMPOSITION',
  SCENE_UPDATED: 'UPDATE_SCENE_COMPOSITION',
} as const;

export function translateGraphTransitionToIntents(
  transition: ProductionGraphTransition,
): MediaExecutionIntent[] {
  const timestamp = transition.command.timestamp;
  const graphRevision = transition.nextRevision;
  const intents: MediaExecutionIntent[] = [];
  const commandIntentType =
    commandIntentMap[transition.command.type as keyof typeof commandIntentMap];
  if (commandIntentType)
    intents.push({
      id: `${transition.command.id}:${commandIntentType}:${graphRevision}:0`,
      type: commandIntentType,
      timestamp,
      graphRevision,
      payload: {
        commandId: transition.command.id,
        commandType: transition.command.type,
        ...transition.command.payload,
      },
    });
  transition.events.forEach((event: ProductionEvent, index) => {
    const eventIntentType = eventIntentMap[event.type as keyof typeof eventIntentMap];
    if (!eventIntentType) return;
    intents.push({
      id: `${event.id}:${eventIntentType}:${event.graphRevision}:${index}`,
      type: eventIntentType,
      timestamp: event.timestamp,
      graphRevision: event.graphRevision,
      payload: { eventId: event.id, eventType: event.type, ...event.payload },
    });
  });
  return intents;
}

export const GraphExecutionTranslator = Object.freeze({ translateGraphTransitionToIntents });

export class ExecutionLogStore {
  private entries: ExecutionLogEntry[] = [];
  append(entry: ExecutionLogEntry) {
    this.entries = [...this.entries, entry];
    return entry;
  }
  list() {
    return [...this.entries];
  }
  queryByRevision(graphRevision: number) {
    return this.entries.filter((entry) => entry.graphRevision === graphRevision);
  }
  getLatest() {
    return this.entries.at(-1);
  }
  clear() {
    this.entries = [];
  }
}

export class ExecutionEventStream {
  private events: ExecutionEvent[] = [];
  emit(event: Omit<ExecutionEvent, 'id' | 'timestamp'> & { timestamp?: string }) {
    const next = {
      ...event,
      id: `exec-event-${++eventSequence}`,
      timestamp: event.timestamp ?? new Date().toISOString(),
    } satisfies ExecutionEvent;
    this.events = [...this.events, next];
    return next;
  }
  list() {
    return [...this.events];
  }
  queryByRevision(graphRevision: number) {
    return this.events.filter((event) => event.graphRevision === graphRevision);
  }
  clear() {
    this.events = [];
  }
}

export class AdapterRegistry {
  private records: { adapter: MediaExecutionAdapter; metadata: AdapterMetadata }[] = [];
  register(adapter: MediaExecutionAdapter, metadata: Partial<AdapterMetadata> = {}) {
    const id = metadata.id ?? adapter.getName();
    const next: AdapterMetadata = {
      id,
      name: metadata.name ?? adapter.getName(),
      type: metadata.type ?? 'mock',
      status: metadata.status ?? 'enabled',
      capabilities: metadata.capabilities ?? [],
      isMock: metadata.isMock ?? true,
      isLive: metadata.isLive ?? false,
      ...(metadata.lastExecutedAt ? { lastExecutedAt: metadata.lastExecutedAt } : {}),
      ...(metadata.lastError ? { lastError: metadata.lastError } : {}),
    };
    this.records = [
      ...this.records.filter((record) => record.metadata.id !== id),
      { adapter, metadata: next },
    ];
  }
  listAvailableAdapters() {
    return this.records.map((record) => record.metadata);
  }
  getActiveAdapter(mode: ExecutionRuntimeMode) {
    return this.records.find(
      ({ metadata }) =>
        metadata.status === 'enabled' &&
        (mode === 'mock_live' ? metadata.isMock : mode === 'live_ready' ? metadata.isLive : false),
    );
  }
  setAdapterEnabled(adapterId: string, enabled: boolean) {
    this.update(adapterId, { status: enabled ? 'enabled' : 'disabled' });
  }
  reportAdapterHealth(adapterId: string) {
    return this.records.find((record) => record.metadata.id === adapterId)?.metadata;
  }
  getAdapter(adapterId: string) {
    return this.records.find((record) => record.metadata.id === adapterId)?.adapter;
  }
  update(adapterId: string, metadata: Partial<AdapterMetadata>) {
    this.records = this.records.map((record) =>
      record.metadata.id === adapterId
        ? { ...record, metadata: { ...record.metadata, ...metadata } }
        : record,
    );
  }
  clear() {
    this.records = [];
  }
}

export function isLiveAdapterAvailable(registry?: AdapterRegistry) {
  return registry
    ? registry
        .listAvailableAdapters()
        .some((adapter) => adapter.isLive && adapter.status === 'enabled')
    : false;
}

function controlledFraction(seed: number, intent: MediaExecutionIntent, salt: number) {
  const text = `${seed}:${intent.id}:${intent.type}:${salt}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return (hash >>> 0) / 4294967295;
}

export class MockMediaExecutionAdapter implements MediaExecutionAdapter {
  private readonly log: MediaExecutionIntent[] = [];
  private latencyConfig: MockExecutionLatencyConfig;
  constructor(
    private options: {
      latencyMs?: number;
      failIntentTypes?: MediaExecutionIntentType[];
      latency?: Partial<MockExecutionLatencyConfig>;
    } = {},
  ) {
    const fixed = options.latencyMs ?? 0;
    this.latencyConfig = {
      ...globalMockLatency,
      minLatencyMs: fixed,
      maxLatencyMs: fixed,
      ...options.latency,
    };
  }
  configureLatency(config: Partial<MockExecutionLatencyConfig>) {
    this.latencyConfig = { ...this.latencyConfig, ...config };
    return this.latencyConfig;
  }
  canHandle(_intent: MediaExecutionIntent) {
    return true;
  }
  getName() {
    return 'MockMediaExecutionAdapter';
  }
  getLoggedIntents() {
    return [...this.log];
  }
  private readonly compositionStore = new CompositionStore();
  private readonly videoRouteStore = new VideoRouteStore();
  private readonly audioRouteStore = new AudioRouteStore();
  getVideoRouteStore() {
    return this.videoRouteStore;
  }
  getAudioRouteStore() {
    return this.audioRouteStore;
  }
  getLatestAudioRouteGraph() {
    const plan = this.audioRouteStore.getRoutePlan();
    return plan ? createAudioRouteGraph(plan) : undefined;
  }
  getLatestVideoRouteGraph() {
    const plan = this.videoRouteStore.getRoutePlan();
    return plan ? createVideoRouteGraph(plan) : undefined;
  }
  getCompositionStore() {
    return this.compositionStore;
  }
  execute(intent: MediaExecutionIntent, graph?: ProductionGraph) {
    this.log.push(intent);
    const seed = this.latencyConfig.seed ?? 1;
    const span = Math.max(0, this.latencyConfig.maxLatencyMs - this.latencyConfig.minLatencyMs);
    const latencyMs = Math.round(
      this.latencyConfig.minLatencyMs + span * controlledFraction(seed, intent, 1),
    );
    const configuredFailure = this.options.failIntentTypes?.includes(intent.type) ?? false;
    const rateFailure = controlledFraction(seed, intent, 2) < this.latencyConfig.failureRate;
    const shouldWarn = controlledFraction(seed, intent, 3) < this.latencyConfig.warningRate;
    const shouldFail = configuredFailure || rateFailure;
    const warnings = shouldWarn ? [`Mock warning for ${intent.type}`] : [];
    const compositionIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_SCENE_COMPOSITION',
      'UPDATE_SCENE_COMPOSITION',
      'RENDER_PROGRAM_COMPOSITION',
      'RENDER_PREVIEW_COMPOSITION',
      'RENDER_MULTIVIEW_COMPOSITION',
      'RENDER_BROWSER_COMPOSITION',
      'RENDER_FRAME',
      'APPLY_LAYOUT',
      'EXECUTE_FRAME_SYNC',
    ];
    if (!shouldFail && graph && compositionIntentTypes.includes(intent.type)) {
      const target =
        intent.type === 'RENDER_PREVIEW_COMPOSITION'
          ? 'preview'
          : intent.type === 'RENDER_MULTIVIEW_COMPOSITION'
            ? 'multiview'
            : 'program';
      const sceneId = String(
        intent.payload.sceneId ??
          (target === 'preview' ? graph.preview.sceneId : graph.program.sceneId) ??
          '',
      );
      if (sceneId) {
        const composition = createSceneCompositionFromGraph(graph, sceneId, {
          target: target as CompositionRenderTarget,
          layoutPreset: intent.payload.layoutPreset as never,
        });
        this.compositionStore.setComposition(target as CompositionRenderTarget, composition);
        warnings.push(...getCompositionWarnings(composition));
      } else warnings.push(`No scene available for ${intent.type}`);
    }
    const routingIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_VIDEO_ROUTE_PLAN',
      'UPDATE_VIDEO_ROUTE',
      'ACTIVATE_VIDEO_ROUTE',
      'DEACTIVATE_VIDEO_ROUTE',
      'ROUTE_PROGRAM_VIDEO',
      'ROUTE_PREVIEW_VIDEO',
      'ROUTE_MULTIVIEW_VIDEO',
      'ROUTE_RECORDING_VIDEO',
      'ROUTE_STREAM_VIDEO',
    ];
    if (!shouldFail && graph && routingIntentTypes.includes(intent.type)) {
      const programScene = graph.program.sceneId;
      const previewScene = graph.preview.sceneId;
      const existing = this.compositionStore.listCompositions().map((entry) => entry.composition);
      const generated = [
        ...(programScene
          ? [createSceneCompositionFromGraph(graph, programScene, { target: 'program' })]
          : []),
        ...(previewScene
          ? [createSceneCompositionFromGraph(graph, previewScene, { target: 'preview' })]
          : []),
        ...(programScene
          ? [createSceneCompositionFromGraph(graph, programScene, { target: 'multiview' })]
          : []),
        ...(programScene
          ? [
              createSceneCompositionFromGraph(graph, programScene, {
                target: 'vertical' as CompositionRenderTarget,
              }),
            ]
          : []),
      ];
      const plan = createVideoRoutePlan(graph, [...existing, ...generated], {
        includeRecording:
          intent.type === 'ROUTE_RECORDING_VIDEO' || graph.recording.status === 'recording',
        includeStreams:
          intent.type === 'ROUTE_STREAM_VIDEO' ||
          Object.values(graph.destinations).some((destination) => destination.enabled),
        includeConfidenceMonitor: true,
        now: intent.timestamp,
      });
      this.videoRouteStore.setRoutePlan(plan);
      warnings.push(...getVideoRouteWarnings(plan, graph, [...existing, ...generated]));
    }

    const audioRoutingIntentTypes: MediaExecutionIntentType[] = [
      'BUILD_AUDIO_ROUTE_PLAN',
      'UPDATE_AUDIO_ROUTE',
      'ACTIVATE_AUDIO_ROUTE',
      'DEACTIVATE_AUDIO_ROUTE',
      'MUTE_AUDIO_ROUTE',
      'UNMUTE_AUDIO_ROUTE',
      'SET_AUDIO_ROUTE_GAIN',
      'BUILD_PROGRAM_MIX',
      'BUILD_STREAM_MIX',
      'BUILD_RECORDING_MIX',
      'BUILD_MONITOR_MIX',
      'BUILD_GUEST_RETURN_MIX',
      'UPDATE_AUDIO_MIX',
    ];
    if (!shouldFail && graph && audioRoutingIntentTypes.includes(intent.type)) {
      const plan = createAudioRoutePlan(graph, {
        includeRecording:
          intent.type === 'BUILD_RECORDING_MIX' || graph.recording.status === 'recording',
        includeStreams:
          intent.type === 'BUILD_STREAM_MIX' ||
          Object.values(graph.destinations).some((destination) => destination.enabled),
        includeMonitor: intent.type === 'BUILD_MONITOR_MIX' || true,
        includeGuestReturns: intent.type === 'BUILD_GUEST_RETURN_MIX' || true,
        now: intent.timestamp,
      });
      this.audioRouteStore.setRoutePlan(plan);
      warnings.push(...getAudioRouteWarnings(plan, graph));
    }
    return {
      adapterName: this.getName(),
      success: !shouldFail,
      timestamp: intent.timestamp,
      latencyMs,
      warnings,
      errors: shouldFail ? [`Mock failure for ${intent.type}`] : [],
    } satisfies MediaExecutionAdapterResponse;
  }
}

export class MediaExecutionEngine implements MediaExecutionPlane {
  private readonly adapterRegistry = new AdapterRegistry();
  private readonly eventStream = new ExecutionEventStream();
  private lastIntents: MediaExecutionIntent[] = [];
  private lastResults: MediaExecutionResult[] = [];
  private currentGraphRevision = 0;
  private runtimeMode: ExecutionRuntimeMode = globalRuntimeMode;
  private readonly orchestrationEngine = new MediaOrchestrationEngine(createClock({ frameRate: 30 }));
  constructor(private logStore = new ExecutionLogStore()) {}
  registerAdapter(adapter: MediaExecutionAdapter, metadata?: Partial<AdapterMetadata>) {
    this.adapterRegistry.register(adapter, metadata);
  }
  getAdapterRegistry() {
    return this.adapterRegistry;
  }
  getRegisteredAdapter(adapterId: string) {
    return this.adapterRegistry.getAdapter(adapterId);
  }
  getOrchestrationEngine() {
    return this.orchestrationEngine;
  }
  getExecutionEventStream() {
    return this.eventStream;
  }
  getExecutionRuntimeMode() {
    return this.runtimeMode;
  }
  setExecutionRuntimeMode(mode: ExecutionRuntimeMode) {
    this.runtimeMode = mode;
    setExecutionRuntimeMode(mode);
    this.eventStream.emit({
      type: 'RUNTIME_MODE_CHANGED',
      graphRevision: this.currentGraphRevision,
      mode,
      payload: { mode },
      warnings: [],
      errors: [],
    });
  }
  setAdapterEnabled(adapterId: string, enabled: boolean) {
    this.adapterRegistry.setAdapterEnabled(adapterId, enabled);
  }
  clearExecutionLog() {
    this.logStore.clear();
    this.eventStream.clear();
    this.lastIntents = [];
    this.lastResults = [];
  }
  configureMockExecutionLatency(config: Partial<MockExecutionLatencyConfig>) {
    configureMockExecutionLatency(config);
  }
  async executeFrameSync(tick: FrameTickEvent, graph: ProductionGraph, intents: readonly MediaExecutionIntent[] = []) {
    const order: readonly MediaExecutionIntentType[] = ['ROUTE_PROGRAM_VIDEO','ROUTE_PREVIEW_VIDEO','BUILD_VIDEO_ROUTE_PLAN','BUILD_AUDIO_ROUTE_PLAN','UPDATE_AUDIO_MIX','UPDATE_SCENE_COMPOSITION','BUILD_SCENE_COMPOSITION','UPDATE_DESTINATION','ROUTE_STREAM_VIDEO','RENDER_BROWSER_COMPOSITION','RENDER_FRAME'];
    const base = intents.length ? [...intents] : [{ id: `frame-sync:${tick.frameId}`, type: 'EXECUTE_FRAME_SYNC' as const, timestamp: new Date(tick.broadcastTime).toISOString(), graphRevision: graph.metadata.revision, payload: { frameTick: tick } }];
    const ordered = base.map((intent) => ({ ...intent, payload: { ...intent.payload, frameTick: tick, frameId: tick.frameId, frameTimestamp: tick.timestamp } })).sort((a,b) => order.indexOf(a.type) - order.indexOf(b.type) || a.id.localeCompare(b.id));
    ordered.forEach((intent) => this.orchestrationEngine.submitIntent(toMediaIntent(intent)));
    const framePlan = this.orchestrationEngine.planExecutionFrame(tick.timestamp);
    this.lastIntents = framePlan.orderedExecutionSteps.map((intent) => toExecutionIntent(intent, framePlan.frameTimestamp));
    this.currentGraphRevision = graph.metadata.revision;
    const results: MediaExecutionResult[] = [];
    for (const intent of this.lastIntents) results.push(await this.dispatchIntent(intent, graph));
    await this.orchestrationEngine.executeFramePlan(framePlan, graph);
    this.lastResults = results;
    return results;
  }
  async onGraphTransition(transition: ProductionGraphTransition) {
    const intents = translateGraphTransitionToIntents(transition);
    intents.forEach((intent) => this.orchestrationEngine.submitIntent(toMediaIntent(intent)));
    const framePlan = this.orchestrationEngine.planExecutionFrame(0);
    this.lastIntents = framePlan.orderedExecutionSteps.map((intent) => toExecutionIntent(intent, framePlan.frameTimestamp));
    this.currentGraphRevision = transition.nextRevision;
    intents.forEach((intent) =>
      this.eventStream.emit({
        type: 'EXECUTION_INTENT_CREATED',
        graphRevision: intent.graphRevision,
        intentId: intent.id,
        mode: this.runtimeMode,
        payload: { type: intent.type },
        warnings: [],
        errors: [],
      }),
    );
    const results = await Promise.all(
      this.lastIntents.map((intent) => this.dispatchIntent(intent, transition.nextGraph)),
    );
    this.lastResults = results;
    await this.orchestrationEngine.executeFramePlan(framePlan, transition.nextGraph);
    return results;
  }
  handleTransition(transition: ProductionGraphTransition) {
    void this.onGraphTransition(transition);
  }
  getExecutionState(): MediaExecutionState {
    const latestLog = this.logStore.getLatest();
    const activeAdapter = this.adapterRegistry.getActiveAdapter(this.runtimeMode)?.metadata;
    return {
      currentGraphRevision: this.currentGraphRevision,
      runtimeMode: this.runtimeMode,
      lastIntents: this.lastIntents,
      lastResults: this.lastResults,
      ...(latestLog ? { latestLog } : {}),
      registeredAdapters: this.adapterRegistry
        .listAvailableAdapters()
        .map((adapter) => adapter.name),
      adapterRegistry: this.adapterRegistry.listAvailableAdapters(),
      ...(activeAdapter ? { activeAdapter } : {}),
      latestEvents: this.eventStream.list().slice(-20),
      orchestrationDiagnostics: this.orchestrationEngine.getDiagnostics(),
      executionHealth: this.getMediaExecutionHealth(),
    };
  }
  getLogStore() {
    return this.logStore;
  }
  listExecutionEvents() {
    return this.eventStream.list();
  }
  listExecutionIntents() {
    return this.logStore.list().map((entry) => entry.intent);
  }
  replayExecutionEvents() {
    return this.eventStream.list().map((event) => ({ ...event, replayed: true }));
  }
  replayExecutionForRevision(graphRevision: number) {
    return this.eventStream
      .queryByRevision(graphRevision)
      .map((event) => ({ ...event, replayed: true }));
  }
  summarizeExecutionForRevision(graphRevision: number) {
    const events = this.eventStream.queryByRevision(graphRevision);
    const entries = this.logStore.queryByRevision(graphRevision);
    return {
      graphRevision,
      eventCount: events.length,
      intentCount: entries.length,
      succeeded: entries.filter((entry) => entry.result.success).length,
      failed: entries.filter((entry) => !entry.result.success).length,
      skipped: events.filter((event) => event.type === 'EXECUTION_SKIPPED').length,
      dryRuns: events.filter((event) => event.type === 'DRY_RUN_RECORDED').length,
    };
  }
  getMediaExecutionHealth(): MediaExecutionHealth {
    return getMediaExecutionHealth(this);
  }
  summarizeExecutionHealth() {
    return summarizeExecutionHealth(this.getMediaExecutionHealth());
  }
  private skippedResult(
    intent: MediaExecutionIntent,
    warnings: string[],
    errors: string[] = [],
  ): MediaExecutionResult {
    return {
      success: errors.length === 0,
      intentId: intent.id,
      timestamp: intent.timestamp,
      warnings,
      errors,
      adapterResponses: [],
    };
  }
  private async dispatchIntent(
    intent: MediaExecutionIntent,
    graph: ProductionGraph,
  ): Promise<MediaExecutionResult> {
    if (this.runtimeMode === 'disabled' || this.runtimeMode === 'dry_run') {
      const type = this.runtimeMode === 'dry_run' ? 'DRY_RUN_RECORDED' : 'EXECUTION_SKIPPED';
      const warnings = [
        this.runtimeMode === 'dry_run'
          ? 'Dry run recorded; adapter execution skipped'
          : 'Execution runtime disabled',
      ];
      const result = this.skippedResult(intent, warnings);
      this.eventStream.emit({
        type,
        graphRevision: intent.graphRevision,
        intentId: intent.id,
        mode: this.runtimeMode,
        payload: { intentType: intent.type },
        warnings,
        errors: [],
      });
      this.logStore.append({ graphRevision: intent.graphRevision, intent, result });
      return result;
    }
    const selected = this.adapterRegistry.getActiveAdapter(this.runtimeMode);
    if (!selected || !selected.adapter.canHandle(intent)) {
      const warnings = [
        this.runtimeMode === 'live_ready'
          ? 'No real media adapter is active; live-ready remains diagnostic only'
          : `No adapter registered for ${intent.type}`,
      ];
      const result = this.skippedResult(intent, warnings, ['Adapter unavailable']);
      this.eventStream.emit({
        type: 'ADAPTER_UNAVAILABLE',
        graphRevision: intent.graphRevision,
        intentId: intent.id,
        mode: this.runtimeMode,
        payload: { intentType: intent.type },
        warnings,
        errors: result.errors,
      });
      this.logStore.append({ graphRevision: intent.graphRevision, intent, result });
      return result;
    }
    this.eventStream.emit({
      type: 'ADAPTER_SELECTED',
      graphRevision: intent.graphRevision,
      intentId: intent.id,
      adapterId: selected.metadata.id,
      mode: this.runtimeMode,
      payload: { adapterName: selected.metadata.name },
      warnings: [],
      errors: [],
    });
    this.eventStream.emit({
      type: 'EXECUTION_STARTED',
      graphRevision: intent.graphRevision,
      intentId: intent.id,
      adapterId: selected.metadata.id,
      mode: this.runtimeMode,
      payload: { intentType: intent.type },
      warnings: [],
      errors: [],
    });
    const response = await selected.adapter.execute(intent, graph);
    const lastError = response.errors.at(-1);
    this.adapterRegistry.update(selected.metadata.id, {
      lastExecutedAt: response.timestamp,
      ...(lastError ? { lastError } : {}),
      status: response.success ? 'enabled' : 'unhealthy',
    });
    const result = {
      success: response.success,
      intentId: intent.id,
      timestamp: intent.timestamp,
      warnings: [...response.warnings],
      errors: [...response.errors],
      adapterResponses: [response],
    } satisfies MediaExecutionResult;
    this.eventStream.emit({
      type: result.success ? 'EXECUTION_SUCCEEDED' : 'EXECUTION_FAILED',
      graphRevision: intent.graphRevision,
      intentId: intent.id,
      adapterId: selected.metadata.id,
      mode: this.runtimeMode,
      payload: { latencyMs: response.latencyMs },
      warnings: result.warnings,
      errors: result.errors,
    });
    this.logStore.append({ graphRevision: intent.graphRevision, intent, result });
    return result;
  }
}

export function listExecutionEvents(engine: MediaExecutionEngine) {
  return engine.listExecutionEvents();
}
export function listExecutionIntents(engine: MediaExecutionEngine) {
  return engine.listExecutionIntents();
}
export function replayExecutionEvents(engine: MediaExecutionEngine) {
  return engine.replayExecutionEvents();
}
export function replayExecutionForRevision(engine: MediaExecutionEngine, revision: number) {
  return engine.replayExecutionForRevision(revision);
}
export function summarizeExecutionForRevision(engine: MediaExecutionEngine, revision: number) {
  return engine.summarizeExecutionForRevision(revision);
}
export function getMediaExecutionHealth(engine: MediaExecutionEngine): MediaExecutionHealth {
  const entries = engine.getLogStore().list();
  const events = engine.listExecutionEvents();
  const responses = entries.flatMap((entry) => entry.result.adapterResponses);
  const failed = entries.filter((entry) => !entry.result.success && entry.result.errors.length > 0);
  const lastFailure = failed.at(-1);
  const activeAdapter = engine
    .getAdapterRegistry()
    .getActiveAdapter(engine.getExecutionRuntimeMode())?.metadata;
  const lastExecutionAt = responses.at(-1)?.timestamp;
  const lastError = lastFailure?.result.errors.at(-1);
  return {
    runtimeMode: engine.getExecutionRuntimeMode(),
    ...(activeAdapter ? { activeAdapter } : {}),
    adapterCount: engine.getAdapterRegistry().listAvailableAdapters().length,
    executedIntentCount: responses.length,
    skippedIntentCount: events.filter(
      (event) =>
        event.type === 'EXECUTION_SKIPPED' ||
        event.type === 'DRY_RUN_RECORDED' ||
        event.type === 'ADAPTER_UNAVAILABLE',
    ).length,
    failedIntentCount: failed.length,
    averageExecutionMs:
      responses.length === 0
        ? 0
        : Math.round(
            responses.reduce((sum, response) => sum + response.latencyMs, 0) / responses.length,
          ),
    ...(lastExecutionAt ? { lastExecutionAt } : {}),
    ...(lastError ? { lastError } : {}),
    isHealthy:
      failed.length === 0 &&
      engine
        .getAdapterRegistry()
        .listAvailableAdapters()
        .every((adapter) => adapter.status !== 'unhealthy'),
  };
}
export function summarizeExecutionHealth(health: MediaExecutionHealth) {
  return `${health.runtimeMode}: ${health.executedIntentCount} executed, ${health.skippedIntentCount} skipped, ${health.failedIntentCount} failed, avg ${health.averageExecutionMs}ms`;
}
