import type {
  AudioNode,
  GuestNode,
  ProductionGraph,
  SourceNode,
} from '../../../shared/src/production-graph.js';

export type AudioRouteSourceType =
  | 'host_mic'
  | 'guest_mic'
  | 'system_audio'
  | 'media_audio'
  | 'browser_audio'
  | 'music_bed'
  | 'screen_audio'
  | 'remote_audio'
  | 'placeholder';
export type AudioRouteTarget =
  | 'program_mix'
  | 'stream_mix'
  | 'recording_mix'
  | 'monitor_mix'
  | 'headphone_mix'
  | 'guest_return'
  | 'ifb'
  | 'aux'
  | 'isolated_recording'
  | 'external';
export type AudioBusType =
  'program' | 'stream' | 'recording' | 'monitor' | 'headphone' | 'guest_return' | 'ifb' | 'aux';
export type AudioRouteStatus =
  'idle' | 'planned' | 'active' | 'muted' | 'soloed' | 'disabled' | 'failed' | 'unavailable';
export interface AudioRouteSource {
  readonly id: string;
  readonly type: AudioRouteSourceType;
  readonly label: string;
  readonly muted: boolean;
  readonly gain: number;
  readonly guestId?: string;
  readonly metadata: Record<string, unknown>;
}
export interface AudioSend {
  readonly id: string;
  readonly sourceId: string;
  readonly busId: string;
  readonly gain: number;
  readonly muted: boolean;
  readonly metadata: Record<string, unknown>;
}
export interface AudioReturn {
  readonly id: string;
  readonly guestId: string;
  readonly busId: string;
  readonly excludedSourceIds: readonly string[];
  readonly mixMinus: boolean;
  readonly metadata: Record<string, unknown>;
}
export interface AudioMonitor {
  readonly id: string;
  readonly busId: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly muted: boolean;
  readonly metadata: Record<string, unknown>;
}
export interface AudioMix {
  readonly id: string;
  readonly label: string;
  readonly busId: string;
  readonly target: AudioRouteTarget;
  readonly routeIds: readonly string[];
  readonly metadata: Record<string, unknown>;
}
export interface AudioBus {
  readonly id: string;
  readonly label: string;
  readonly type: AudioBusType;
  readonly enabled: boolean;
  readonly muted: boolean;
  readonly masterGain: number;
  readonly limiterEnabled: boolean;
  readonly meterState: Record<string, unknown>;
  readonly routes: readonly string[];
  readonly metadata: Record<string, unknown>;
}
export interface AudioRoute {
  readonly id: string;
  readonly sourceId: string;
  readonly sourceType: AudioRouteSourceType;
  readonly target: AudioRouteTarget;
  readonly targetId: string;
  readonly busId: string;
  readonly enabled: boolean;
  readonly muted: boolean;
  readonly gain: number;
  readonly pan: number;
  readonly solo: boolean;
  readonly monitorEnabled: boolean;
  readonly mixMinus: boolean;
  readonly priority: number;
  readonly status: AudioRouteStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly graphRevision: number;
  readonly metadata: Record<string, unknown>;
}
export interface AudioRoutePlan {
  readonly id: string;
  readonly graphRevision: number;
  readonly sources: readonly AudioRouteSource[];
  readonly buses: readonly AudioBus[];
  readonly mixes: readonly AudioMix[];
  readonly sends: readonly AudioSend[];
  readonly returns: readonly AudioReturn[];
  readonly monitors: readonly AudioMonitor[];
  readonly routes: readonly AudioRoute[];
  readonly warnings: readonly string[];
  readonly createdAt: string;
  readonly metadata: Record<string, unknown>;
}
export interface AudioRouteGraph {
  readonly revision: number;
  readonly plan?: AudioRoutePlan;
  readonly sources: readonly AudioRouteSource[];
  readonly buses: readonly AudioBus[];
  readonly routes: readonly AudioRoute[];
  readonly fanOut: Record<string, readonly AudioRoute[]>;
  readonly warnings: readonly string[];
}
export interface AudioRouteValidationResult {
  readonly valid: boolean;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}
export interface AudioRouteExecutionResult {
  readonly success: boolean;
  readonly routePlan?: AudioRoutePlan;
  readonly routeGraph?: AudioRouteGraph;
  readonly routes: readonly AudioRoute[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}
export interface AudioRoutePlannerOptions {
  readonly now?: string;
  readonly includeRecording?: boolean;
  readonly includeStreams?: boolean;
  readonly includeMonitor?: boolean;
  readonly includeGuestReturns?: boolean;
  readonly previousPlan?: AudioRoutePlan;
}

const targets: readonly AudioRouteTarget[] = [
  'program_mix',
  'stream_mix',
  'recording_mix',
  'monitor_mix',
  'headphone_mix',
  'guest_return',
  'ifb',
  'aux',
  'isolated_recording',
  'external',
];
const busTypes: readonly AudioBusType[] = [
  'program',
  'stream',
  'recording',
  'monitor',
  'headphone',
  'guest_return',
  'ifb',
  'aux',
];
const defaultBusLabels: Record<AudioBusType, string> = {
  program: 'Program',
  stream: 'Stream',
  recording: 'Recording',
  monitor: 'Monitor',
  headphone: 'Headphone',
  guest_return: 'Guest Return',
  ifb: 'IFB',
  aux: 'Aux',
};
const busId = (type: AudioBusType) => `audio-bus:${type}`;
const targetForBus = (type: AudioBusType): AudioRouteTarget =>
  type === 'program'
    ? 'program_mix'
    : type === 'stream'
      ? 'stream_mix'
      : type === 'recording'
        ? 'recording_mix'
        : type === 'monitor'
          ? 'monitor_mix'
          : type === 'headphone'
            ? 'headphone_mix'
            : type;
const sourceTypeFrom = (
  source?: SourceNode,
  channel?: AudioNode,
  guest?: GuestNode,
): AudioRouteSourceType =>
  guest
    ? 'guest_mic'
    : source?.type === 'screen'
      ? 'screen_audio'
      : source?.type === 'media'
        ? 'media_audio'
        : source?.type === 'browser'
          ? 'browser_audio'
          : source?.type === 'guest'
            ? 'guest_mic'
            : source?.type === 'audio'
              ? String(source.metadata?.audioRole ?? '').includes('music')
                ? 'music_bed'
                : 'host_mic'
              : (channel?.metadata?.sourceType as AudioRouteSourceType) || 'placeholder';

export function listAudioRouteSources(graph: ProductionGraph): AudioRouteSource[] {
  const fromChannels = Object.values(graph.audioChannels).map((channel) => {
    const guest = channel.guestId ? graph.guests[channel.guestId] : undefined;
    const source = channel.sourceId ? graph.sources[channel.sourceId] : undefined;
    return {
      id: channel.sourceId ?? channel.id,
      type: sourceTypeFrom(source, channel, guest),
      label: channel.label,
      muted: channel.muted || Boolean(guest?.muted),
      gain: channel.gain,
      ...(guest?.id ? { guestId: guest.id } : {}),
      metadata: { audioChannelId: channel.id },
    } satisfies AudioRouteSource;
  });
  const guestSources = Object.values(graph.guests)
    .filter((g) => g.sourceId && !fromChannels.some((s) => s.id === g.sourceId))
    .map((guest) => ({
      id: guest.sourceId!,
      type: 'guest_mic' as const,
      label: guest.displayName,
      muted: guest.muted || guest.status === 'muted',
      gain: 1,
      guestId: guest.id,
      metadata: { guestStatus: guest.status },
    }));
  const standalone = Object.values(graph.sources)
    .filter(
      (s) =>
        ['audio', 'media', 'browser', 'screen'].includes(s.type) &&
        !fromChannels.some((a) => a.id === s.id) &&
        !guestSources.some((a) => a.id === s.id),
    )
    .map((source) => ({
      id: source.id,
      type: sourceTypeFrom(source),
      label: source.name,
      muted: Boolean(source.muted),
      gain: 1,
      metadata: {},
    }));
  return [...fromChannels, ...guestSources, ...standalone].sort((a, b) => a.id.localeCompare(b.id));
}
function makeBus(type: AudioBusType, routes: AudioRoute[]): AudioBus {
  return {
    id: busId(type),
    label: defaultBusLabels[type],
    type,
    enabled: true,
    muted: false,
    masterGain: 1,
    limiterEnabled: false,
    meterState: { placeholder: true },
    routes: routes.filter((r) => r.busId === busId(type)).map((r) => r.id),
    metadata: { placeholder: true },
  };
}
function route(
  source: AudioRouteSource,
  target: AudioRouteTarget,
  bus: AudioBusType,
  revision: number,
  now: string,
  priority: number,
  extra: Partial<AudioRoute> = {},
): AudioRoute {
  return {
    id: `audio-route:${bus}:${extra.targetId ?? target}:${source.id}`,
    sourceId: source.id,
    sourceType: source.type,
    target,
    targetId: String(extra.targetId ?? target),
    busId: busId(bus),
    enabled: true,
    muted: source.muted,
    gain: source.gain,
    pan: 0,
    solo: false,
    monitorEnabled: bus === 'monitor' || bus === 'headphone',
    mixMinus: false,
    priority,
    status: source.muted ? 'muted' : 'planned',
    createdAt: now,
    updatedAt: now,
    graphRevision: revision,
    metadata: {},
    ...extra,
  };
}
export function getSourcesExcludedFromReturn(
  guestId: string,
  sources: readonly AudioRouteSource[],
) {
  return sources.filter((s) => s.guestId === guestId).map((s) => s.id);
}
export function createMixMinusForGuest(
  guest: GuestNode,
  sources: readonly AudioRouteSource[],
  graphRevision = 0,
  now = new Date(0).toISOString(),
): AudioReturn {
  return {
    id: `audio-return:${guest.id}`,
    guestId: guest.id,
    busId: busId('guest_return'),
    excludedSourceIds: getSourcesExcludedFromReturn(guest.id, sources),
    mixMinus: true,
    metadata: { graphRevision, createdAt: now },
  };
}
export function validateMixMinusRoute(
  route: AudioRoute,
  audioReturn: AudioReturn,
): AudioRouteValidationResult {
  const warnings = audioReturn.excludedSourceIds.includes(route.sourceId)
    ? [`Feedback risk: ${route.sourceId} is included in its own guest return`]
    : [];
  return { valid: warnings.length === 0, warnings, errors: [] };
}
export function createAudioRoutePlan(
  graph: ProductionGraph,
  options: AudioRoutePlannerOptions = {},
): AudioRoutePlan {
  const now = options.now ?? graph.metadata.updatedAt ?? new Date(0).toISOString();
  const sources = listAudioRouteSources(graph);
  const routes: AudioRoute[] = [];
  sources.forEach((s, i) =>
    routes.push(route(s, 'program_mix', 'program', graph.metadata.revision, now, 100 - i)),
  );
  if (options.includeStreams ?? Object.values(graph.destinations).some((d) => d.enabled))
    sources.forEach((s, i) =>
      routes.push(route(s, 'stream_mix', 'stream', graph.metadata.revision, now, 80 - i)),
    );
  if (options.includeRecording ?? graph.recording.status === 'recording')
    sources.forEach((s, i) =>
      routes.push(
        route(s, 'recording_mix', 'recording', graph.metadata.revision, now, 70 - i, {
          metadata: { placeholder: true },
        }),
      ),
    );
  if (options.includeMonitor ?? true)
    sources.forEach((s, i) => {
      routes.push(
        route(s, 'monitor_mix', 'monitor', graph.metadata.revision, now, 60 - i, {
          metadata: { placeholder: true },
        }),
      );
      routes.push(
        route(s, 'headphone_mix', 'headphone', graph.metadata.revision, now, 50 - i, {
          metadata: { placeholder: true },
        }),
      );
    });
  const returns =
    (options.includeGuestReturns ?? true)
      ? Object.values(graph.guests)
          .filter((g) => g.status !== 'removed')
          .map((g) => createMixMinusForGuest(g, sources, graph.metadata.revision, now))
      : [];
  returns.forEach((ret) =>
    sources
      .filter((s) => !ret.excludedSourceIds.includes(s.id))
      .forEach((s, i) =>
        routes.push(
          route(s, 'guest_return', 'guest_return', graph.metadata.revision, now, 40 - i, {
            targetId: ret.guestId,
            mixMinus: true,
            metadata: { returnId: ret.id },
          }),
        ),
      ),
  );
  const buses = busTypes.map((type) => makeBus(type, routes));
  const mixes = buses.map((b) => ({
    id: `audio-mix:${b.type}`,
    label: b.label,
    busId: b.id,
    target: targetForBus(b.type),
    routeIds: b.routes,
    metadata: { placeholder: true },
  }));
  const monitors = buses
    .filter((b) => b.type === 'monitor' || b.type === 'headphone')
    .map((b) => ({
      id: `audio-monitor:${b.type}`,
      busId: b.id,
      label: b.label,
      enabled: true,
      muted: false,
      metadata: { placeholder: true },
    }));
  const sends = routes.map((r) => ({
    id: `audio-send:${r.id}`,
    sourceId: r.sourceId,
    busId: r.busId,
    gain: r.gain,
    muted: r.muted,
    metadata: { routeId: r.id },
  }));
  const plan = {
    id: `audio-route-plan:${graph.metadata.revision}`,
    graphRevision: graph.metadata.revision,
    sources,
    buses,
    mixes,
    sends,
    returns,
    monitors,
    routes,
    warnings: [],
    createdAt: now,
    metadata: { routeCount: routes.length },
  } satisfies AudioRoutePlan;
  return { ...plan, warnings: getAudioRouteWarnings(plan, graph) };
}
export function validateAudioRoute(
  route: AudioRoute,
  graph?: ProductionGraph,
  buses: readonly AudioBus[] = [],
): AudioRouteValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  if (!targets.includes(route.target)) errors.push(`Unsupported target ${route.target}`);
  if (
    graph &&
    !graph.sources[route.sourceId] &&
    !Object.values(graph.audioChannels).some(
      (c) => c.id === route.sourceId || c.sourceId === route.sourceId,
    )
  )
    warnings.push(`Missing source ${route.sourceId}`);
  if (buses.length && !buses.some((b) => b.id === route.busId))
    warnings.push(`Missing bus ${route.busId}`);
  if (!Number.isFinite(route.gain) || route.gain < 0 || route.gain > 4)
    warnings.push(`Invalid gain for ${route.id}`);
  if (!Number.isFinite(route.pan) || route.pan < -1 || route.pan > 1)
    warnings.push(`Invalid pan for ${route.id}`);
  if (route.muted && route.enabled)
    warnings.push(`Muted source routed to active bus ${route.busId}`);
  if (route.target === 'guest_return' && !route.mixMinus)
    warnings.push(`Feedback risk: guest return without mix-minus ${route.id}`);
  return { valid: errors.length === 0, warnings, errors };
}
export function validateAudioRoutePlan(
  plan: AudioRoutePlan,
  graph?: ProductionGraph,
): AudioRouteValidationResult {
  const results = plan.routes.map((r) => validateAudioRoute(r, graph, plan.buses));
  const warnings = [...plan.warnings, ...results.flatMap((r) => r.warnings)];
  const errors = results.flatMap((r) => r.errors);
  const duplicates = plan.routes
    .map((r) => `${r.sourceId}:${r.target}:${r.targetId}:${r.busId}`)
    .filter((k, i, a) => a.indexOf(k) !== i);
  warnings.push(...[...new Set(duplicates)].map((key) => `Duplicate route ${key}`));
  Object.values(graph?.guests ?? {})
    .filter((g) => g.status !== 'removed')
    .forEach((g) => {
      if (!plan.returns.some((r) => r.guestId === g.id))
        warnings.push(`Missing guest return ${g.id}`);
    });
  return { valid: errors.length === 0, warnings, errors };
}
export const getAudioRouteWarnings = (plan: AudioRoutePlan, graph?: ProductionGraph) =>
  validateAudioRoutePlan({ ...plan, warnings: [] }, graph).warnings;
const setStatus = (
  route: AudioRoute,
  status: AudioRouteStatus,
  patch: Partial<AudioRoute> = {},
) => ({ ...route, status, updatedAt: new Date().toISOString(), ...patch });
export const activateAudioRoute = (r: AudioRoute) => setStatus(r, 'active', { enabled: true });
export const deactivateAudioRoute = (r: AudioRoute) => setStatus(r, 'idle');
export const muteAudioRoute = (r: AudioRoute) => setStatus(r, 'muted', { muted: true });
export const unmuteAudioRoute = (r: AudioRoute) => setStatus(r, 'planned', { muted: false });
export const soloAudioRoute = (r: AudioRoute) => setStatus(r, 'soloed', { solo: true });
export const unsoloAudioRoute = (r: AudioRoute) =>
  setStatus(r, r.muted ? 'muted' : 'planned', { solo: false });
export const failAudioRoute = (r: AudioRoute, error?: string) =>
  setStatus(r, 'failed', { metadata: { ...r.metadata, ...(error ? { error } : {}) } });
export const markAudioRouteUnavailable = (r: AudioRoute, reason?: string) =>
  setStatus(r, 'unavailable', { metadata: { ...r.metadata, ...(reason ? { reason } : {}) } });
export function createAudioRouteGraph(plan: AudioRoutePlan): AudioRouteGraph {
  const fanOut: Record<string, AudioRoute[]> = {};
  plan.routes.forEach((r) => {
    fanOut[r.sourceId] = [...(fanOut[r.sourceId] ?? []), r];
  });
  return {
    revision: plan.graphRevision,
    plan,
    sources: plan.sources,
    buses: plan.buses,
    routes: plan.routes,
    fanOut,
    warnings: plan.warnings,
  };
}
export class AudioRouteStore {
  private plan: AudioRoutePlan | undefined;
  setRoutePlan(plan: AudioRoutePlan) {
    this.plan = plan;
    return plan;
  }
  getRoutePlan() {
    return this.plan;
  }
  listRoutes() {
    return [...(this.plan?.routes ?? [])];
  }
  listBuses() {
    return [...(this.plan?.buses ?? [])];
  }
  getRoutesBySource(sourceId: string) {
    return this.listRoutes().filter((r) => r.sourceId === sourceId);
  }
  getRoutesByTarget(target: AudioRouteTarget) {
    return this.listRoutes().filter((r) => r.target === target);
  }
  getRoutesByBus(busId: string) {
    return this.listRoutes().filter((r) => r.busId === busId);
  }
  clearRoutes() {
    this.plan = undefined;
  }
}
