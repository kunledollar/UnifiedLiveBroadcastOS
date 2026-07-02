import type { ProductionGraph, ProductionGraphTransition, ProductionEvent } from '../../shared/src/production-graph.js';

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
  execute(intent: MediaExecutionIntent, graph: ProductionGraph): Promise<MediaExecutionAdapterResponse> | MediaExecutionAdapterResponse;
  getName(): string;
}

export interface WebRtcMediaExecutionAdapter extends MediaExecutionAdapter {}
export interface RtmpMediaExecutionAdapter extends MediaExecutionAdapter {}
export interface FfmpegMediaExecutionAdapter extends MediaExecutionAdapter {}
export interface ObsMediaExecutionAdapter extends MediaExecutionAdapter {}

export interface ExecutionLogEntry {
  readonly graphRevision: number;
  readonly intent: MediaExecutionIntent;
  readonly result: MediaExecutionResult;
}

export interface MediaExecutionState {
  readonly currentGraphRevision: number;
  readonly lastIntents: readonly MediaExecutionIntent[];
  readonly lastResults: readonly MediaExecutionResult[];
  readonly latestLog?: ExecutionLogEntry;
  readonly registeredAdapters: readonly string[];
}

export interface MediaExecutionPlane {
  onGraphTransition(transition: ProductionGraphTransition): Promise<MediaExecutionResult[]>;
  getExecutionState(): MediaExecutionState;
  registerAdapter(adapter: MediaExecutionAdapter): void;
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

export function translateGraphTransitionToIntents(transition: ProductionGraphTransition): MediaExecutionIntent[] {
  const timestamp = transition.command.timestamp;
  const graphRevision = transition.nextRevision;
  const intents: MediaExecutionIntent[] = [];
  const commandType = transition.command.type as keyof typeof commandIntentMap;
  const commandIntentType = commandIntentMap[commandType];
  if (commandIntentType) {
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
  }
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
  append(entry: ExecutionLogEntry) { this.entries = [...this.entries, entry]; return entry; }
  queryByRevision(graphRevision: number) { return this.entries.filter((entry) => entry.graphRevision === graphRevision); }
  getLatest() { return this.entries.at(-1); }
  clear() { this.entries = []; }
}

export class MockMediaExecutionAdapter implements MediaExecutionAdapter {
  private readonly log: MediaExecutionIntent[] = [];
  constructor(private options: { latencyMs?: number; failIntentTypes?: MediaExecutionIntentType[] } = {}) {}
  canHandle(_intent: MediaExecutionIntent) { return true; }
  getName() { return 'MockMediaExecutionAdapter'; }
  getLoggedIntents() { return [...this.log]; }
  execute(intent: MediaExecutionIntent) {
    this.log.push(intent);
    const latencyMs = this.options.latencyMs ?? 0;
    const shouldFail = this.options.failIntentTypes?.includes(intent.type) ?? false;
    return {
      adapterName: this.getName(),
      success: !shouldFail,
      timestamp: intent.timestamp,
      latencyMs,
      warnings: [] as string[],
      errors: shouldFail ? [`Mock failure for ${intent.type}`] : [],
    } satisfies MediaExecutionAdapterResponse;
  }
}

export class MediaExecutionEngine implements MediaExecutionPlane {
  private adapters: MediaExecutionAdapter[] = [];
  private lastIntents: MediaExecutionIntent[] = [];
  private lastResults: MediaExecutionResult[] = [];
  private currentGraphRevision = 0;
  constructor(private logStore = new ExecutionLogStore()) {}
  registerAdapter(adapter: MediaExecutionAdapter) { this.adapters = [...this.adapters, adapter]; }
  async onGraphTransition(transition: ProductionGraphTransition) {
    const intents = translateGraphTransitionToIntents(transition);
    this.lastIntents = intents;
    this.currentGraphRevision = transition.nextRevision;
    const results = await Promise.all(intents.map((intent) => this.dispatchIntent(intent, transition.nextGraph)));
    this.lastResults = results;
    return results;
  }
  handleTransition(transition: ProductionGraphTransition) { void this.onGraphTransition(transition); }
  getExecutionState(): MediaExecutionState {
    const latestLog = this.logStore.getLatest();
    return {
      currentGraphRevision: this.currentGraphRevision,
      lastIntents: this.lastIntents,
      lastResults: this.lastResults,
      ...(latestLog ? { latestLog } : {}),
      registeredAdapters: this.adapters.map((adapter) => adapter.getName()),
    };
  }
  getLogStore() { return this.logStore; }
  private async dispatchIntent(intent: MediaExecutionIntent, graph: ProductionGraph): Promise<MediaExecutionResult> {
    const capableAdapters = this.adapters.filter((adapter) => adapter.canHandle(intent));
    const adapterResponses = await Promise.all(capableAdapters.map((adapter) => adapter.execute(intent, graph)));
    const errors = adapterResponses.flatMap((response) => [...response.errors]);
    const warnings = adapterResponses.flatMap((response) => [...response.warnings]);
    if (adapterResponses.length === 0) warnings.push(`No adapter registered for ${intent.type}`);
    const result = { success: adapterResponses.length > 0 && adapterResponses.every((response) => response.success), intentId: intent.id, timestamp: intent.timestamp, warnings, errors, adapterResponses } satisfies MediaExecutionResult;
    this.logStore.append({ graphRevision: intent.graphRevision, intent, result });
    return result;
  }
}
