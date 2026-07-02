import type {
  ProductionGraph,
  ProductionGraphTransition,
  ProductionEvent,
} from '../../shared/src/production-graph.js';

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
  | 'RENDER_MULTIVIEW';

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
  readonly executionHealth: MediaExecutionHealth;
}

export interface MediaExecutionPlane {
  onGraphTransition(transition: ProductionGraphTransition): Promise<MediaExecutionResult[]>;
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
} as const;
const eventIntentMap = {
  AUDIO_MUTED: 'UPDATE_AUDIO_MIX',
  DESTINATION_ENABLED: 'UPDATE_DESTINATION',
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
  execute(intent: MediaExecutionIntent) {
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
    return {
      adapterName: this.getName(),
      success: !shouldFail,
      timestamp: intent.timestamp,
      latencyMs,
      warnings: shouldWarn ? [`Mock warning for ${intent.type}`] : [],
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
  async onGraphTransition(transition: ProductionGraphTransition) {
    const intents = translateGraphTransitionToIntents(transition);
    this.lastIntents = intents;
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
      intents.map((intent) => this.dispatchIntent(intent, transition.nextGraph)),
    );
    this.lastResults = results;
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
