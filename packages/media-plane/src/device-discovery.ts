import { RuntimeEngineError } from './execution-engine.js';
import {
  createSourceDescriptorFromDevice,
  type SourceDescriptor,
  type SourcePermissionState,
} from './source-acquisition.js';
import {
  DeviceRegistry,
  type DeviceCapabilities,
  type DeviceConnectionType,
  type DeviceMetadata,
} from './device-platform.js';

export type DeviceDiscoveryType =
  | 'VIDEO_INPUT'
  | 'AUDIO_INPUT'
  | 'AUDIO_OUTPUT'
  | 'CAPTURE_CARD'
  | 'DISPLAY'
  | 'WINDOW_SOURCE'
  | 'VIRTUAL_CAMERA'
  | 'VIRTUAL_AUDIO'
  | 'NETWORK_DEVICE'
  | 'REMOTE_ENDPOINT'
  | 'SYNTHETIC'
  | 'CUSTOM';
export type DevicePermissionState = SourcePermissionState;
export type DeviceLifecycleState =
  | 'DISCOVERED'
  | 'REGISTERED'
  | 'PROBING'
  | 'AVAILABLE'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTING'
  | 'DISCONNECTED'
  | 'UNAVAILABLE'
  | 'REMOVED'
  | 'FAILED'
  | 'STOPPING'
  | 'STOPPED';
export type DeviceProbeState =
  'NOT_REQUESTED' | 'PENDING' | 'COMPLETE' | 'PARTIAL' | 'FAILED' | 'UNSUPPORTED';
export type DeviceDiscoveryHealthState =
  | 'UNKNOWN'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNHEALTHY'
  | 'UNAVAILABLE'
  | 'FAILED'
  | 'REMOVED'
  | 'STOPPED';
export type SourceRegistrationPolicy =
  | 'DISCOVER_ONLY'
  | 'REGISTER_AVAILABLE_SOURCES'
  | 'REGISTER_ALL_KNOWN_SOURCES'
  | 'REGISTER_ON_OPERATOR_REQUEST';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(clone(v));
const hash = (value: string) => {
  let h = 2166136261;
  for (const c of value) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(16).padStart(8, '0')}`;
};
const sanitize = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 32))
    if (!/secret|token|serial|path|url|address|credential|password/i.test(k))
      out[k] = typeof v === 'object' ? '[redacted-object]' : v;
  return out;
};

export class DeviceDiscoveryError extends RuntimeEngineError {}
const err = (code: string, message: string, details?: Record<string, unknown>) =>
  new DeviceDiscoveryError(code, message, sanitize(details));
export class DuplicateDeviceProviderError extends DeviceDiscoveryError {
  constructor(id: string) {
    super('DuplicateDeviceProvider', `Duplicate device provider ${id}`);
  }
}
export class DeviceProviderNotFoundError extends DeviceDiscoveryError {
  constructor(id: string) {
    super('DeviceProviderNotFound', `Device provider not found ${id}`);
  }
}
export class InvalidDeviceLifecycleTransitionError extends DeviceDiscoveryError {
  constructor(from: DeviceLifecycleState, to: DeviceLifecycleState) {
    super(
      'InvalidDeviceLifecycleTransition',
      `Invalid device lifecycle transition ${from} -> ${to}`,
    );
  }
}
export class DeviceMonitoringAlreadyRunningError extends DeviceDiscoveryError {
  constructor(id?: string) {
    super(
      'DeviceMonitoringAlreadyRunning',
      `Device monitoring already running${id ? ` for ${id}` : ''}`,
    );
  }
}
export class DeviceMonitoringNotRunningError extends DeviceDiscoveryError {
  constructor() {
    super('DeviceMonitoringNotRunning', 'Device monitoring is not running');
  }
}

export const DEVICE_DISCOVERY_LIFECYCLE_TRANSITIONS: Readonly<
  Record<DeviceLifecycleState, readonly DeviceLifecycleState[]>
> = Object.freeze({
  DISCOVERED: ['REGISTERED', 'UNAVAILABLE', 'FAILED'],
  REGISTERED: ['PROBING', 'AVAILABLE', 'UNAVAILABLE', 'REMOVED'],
  PROBING: ['AVAILABLE', 'UNAVAILABLE', 'FAILED'],
  AVAILABLE: ['CONNECTING', 'UNAVAILABLE', 'REMOVED', 'PROBING'],
  CONNECTING: ['CONNECTED', 'FAILED', 'DISCONNECTED'],
  CONNECTED: ['DEGRADED', 'DISCONNECTING', 'FAILED'],
  DEGRADED: ['CONNECTED', 'DISCONNECTING', 'FAILED'],
  DISCONNECTING: ['DISCONNECTED'],
  DISCONNECTED: ['CONNECTING', 'UNAVAILABLE', 'REMOVED'],
  UNAVAILABLE: ['AVAILABLE', 'REMOVED', 'FAILED'],
  REMOVED: ['AVAILABLE', 'STOPPING'],
  FAILED: ['STOPPING', 'UNAVAILABLE'],
  STOPPING: ['STOPPED'],
  STOPPED: [],
});

export interface DeviceIdentity {
  readonly deviceId: string;
  readonly providerId: string;
  readonly persistentIdentity: string;
  readonly sessionIdentity: string;
  readonly vendorId?: string | undefined;
  readonly productId?: string | undefined;
  readonly serialNumberHash?: string | undefined;
  readonly operatingSystemId?: string | undefined;
  readonly transport: string;
  readonly hardwarePathHash?: string | undefined;
  readonly displayName: string;
  readonly manufacturer?: string | undefined;
  readonly model?: string | undefined;
  readonly logicalRole?: string | undefined;
  readonly firstSeenAtNs: string;
  readonly lastSeenAtNs: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface DeviceDescriptor {
  readonly id: string;
  readonly providerId: string;
  readonly type: DeviceDiscoveryType;
  readonly displayName: string;
  readonly description?: string | undefined;
  readonly manufacturer?: string | undefined;
  readonly model?: string | undefined;
  readonly transport: string;
  readonly connectionKind: DeviceConnectionType | string;
  readonly mediaKinds: readonly ('VIDEO' | 'AUDIO' | 'DATA')[];
  readonly available: boolean;
  readonly connected: boolean;
  readonly virtual: boolean;
  readonly removable: boolean;
  readonly hotPluggable: boolean;
  readonly requiresPermission: boolean;
  readonly permissionState: DevicePermissionState;
  readonly supportsVideo: boolean;
  readonly supportsAudioInput: boolean;
  readonly supportsAudioOutput: boolean;
  readonly supportsMetadata: boolean;
  readonly supportsHardwareTimestamps: boolean;
  readonly capabilitiesKnown: boolean;
  readonly capabilities: DeviceCapabilities;
  readonly defaultProfile?: string | undefined;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly persistentIdentity?: string | undefined;
  readonly sessionIdentity?: string | undefined;
  readonly mergeKey?: string | undefined;
  readonly allowCrossProviderMerge?: boolean | undefined;
}
export interface DeviceSnapshot extends DeviceDescriptor {
  readonly identity: DeviceIdentity;
  readonly lifecycleState: DeviceLifecycleState;
  readonly firstSeenGeneration: number;
  readonly lastSeenGeneration: number;
  readonly consecutiveMissingGenerations: number;
  readonly removalGeneration?: number | undefined;
  readonly reappearanceGeneration?: number | undefined;
  readonly aliases: readonly string[];
  readonly capabilityProbeState: DeviceProbeState;
  readonly sources: readonly SourceDescriptor[];
  readonly health: DeviceHealthSnapshot;
}
export interface DeviceHealthSnapshot {
  readonly deviceId: string;
  readonly lifecycleState: DeviceLifecycleState;
  readonly healthState: DeviceDiscoveryHealthState;
  readonly available: boolean;
  readonly connected: boolean;
  readonly permissionState: DevicePermissionState;
  readonly capabilitiesKnown: boolean;
  readonly lastSeenAtNs: string;
  readonly lastAvailableAtNs?: string | undefined;
  readonly lastUnavailableAtNs?: string | undefined;
  readonly lastProbeAtNs?: string | undefined;
  readonly lastSuccessfulProbeAtNs?: string | undefined;
  readonly consecutiveDiscoveryMisses: number;
  readonly discoveryFailures: number;
  readonly probeFailures: number;
  readonly connectionFailures: number;
  readonly reconnectAttempts: number;
  readonly currentLatencyNs?: string | undefined;
  readonly lastError?: string | undefined;
  readonly updatedAtNs: string;
}
export interface DeviceDiscoveryProviderDescriptor {
  readonly providerId: string;
  readonly name: string;
  readonly version: string;
  readonly supportedDeviceTypes: readonly DeviceDiscoveryType[];
  readonly supportsMonitoring: boolean;
  readonly supportsCapabilityProbe: boolean;
  readonly requiresNativeBridge: boolean;
  readonly priority: number;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}
export interface DeviceDiscoveryRequest {
  readonly deviceTypes?: readonly DeviceDiscoveryType[];
  readonly mediaKinds?: readonly string[];
  readonly providerId?: string;
  readonly available?: boolean;
  readonly permissionStates?: readonly DevicePermissionState[];
  readonly virtual?: boolean;
  readonly transport?: string;
  readonly includeUnavailable?: boolean;
  readonly includeRemoved?: boolean;
  readonly refreshCapabilities?: boolean;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}
export interface DeviceRefreshRequest extends DeviceDiscoveryRequest {}
export interface DeviceDiscoveryProviderResult {
  readonly devices: readonly DeviceDescriptor[];
  readonly warnings?: readonly string[];
  readonly errors?: readonly string[];
  readonly partial?: boolean;
}
export interface DeviceCapabilityProbeResult {
  readonly state: DeviceProbeState;
  readonly capabilities?: DeviceCapabilities;
  readonly warnings?: readonly string[];
}
export interface DeviceProviderContext {
  readonly nowNs: () => bigint;
}
export interface DeviceMonitoringContext extends DeviceProviderContext {
  readonly pollIntervalMs: number;
}
export interface DeviceChangeListener {
  (event: {
    readonly type: 'arrived' | 'removed' | 'changed';
    readonly device?: DeviceDescriptor;
    readonly deviceId?: string;
  }): void;
}
export interface DeviceDiscoveryProvider {
  readonly descriptor: DeviceDiscoveryProviderDescriptor;
  initialize(context: DeviceProviderContext): Promise<unknown>;
  discover(
    request: DeviceDiscoveryRequest,
    context: DeviceProviderContext,
  ): Promise<DeviceDiscoveryProviderResult>;
  startMonitoring?(context: DeviceMonitoringContext, listener: DeviceChangeListener): Promise<void>;
  stopMonitoring?(context: DeviceMonitoringContext): Promise<void>;
  probeCapabilities?(
    device: DeviceDescriptor,
    context: DeviceProviderContext,
  ): Promise<DeviceCapabilityProbeResult>;
  shutdown(context: DeviceProviderContext): Promise<void>;
}
export interface DeviceDiscoverySnapshot {
  readonly devices: readonly DeviceSnapshot[];
  readonly providerResults: readonly {
    readonly providerId: string;
    readonly deviceCount: number;
  }[];
  readonly providerWarnings: readonly string[];
  readonly providerErrors: readonly { readonly providerId: string; readonly error: string }[];
  readonly partial: boolean;
  readonly startedAtNs: string;
  readonly completedAtNs: string;
  readonly durationNs: string;
  readonly generation: number;
  readonly snapshotId: string;
}
export interface DeviceDiscoveryDelta extends DeviceDiscoverySnapshot {
  readonly discoveredDevices: readonly DeviceSnapshot[];
  readonly updatedDevices: readonly DeviceSnapshot[];
  readonly unavailableDevices: readonly DeviceSnapshot[];
  readonly removedDevices: readonly DeviceSnapshot[];
  readonly unchangedDeviceCount: number;
}
export interface DeviceProviderSnapshot extends DeviceDiscoveryProviderDescriptor {
  readonly active: boolean;
  readonly registrationSequence: number;
}
export interface DeviceTelemetrySnapshot {
  readonly registeredProviderCount: number;
  readonly activeProviderCount: number;
  readonly discoveredDeviceCount: number;
  readonly availableDeviceCount: number;
  readonly unavailableDeviceCount: number;
  readonly removedDeviceCount: number;
  readonly physicalDeviceCount: number;
  readonly virtualDeviceCount: number;
  readonly videoInputCount: number;
  readonly audioInputCount: number;
  readonly captureCardCount: number;
  readonly permissionDeniedCount: number;
  readonly capabilityProbeCount: number;
  readonly capabilityProbeFailures: number;
  readonly deviceArrivalCount: number;
  readonly deviceRemovalCount: number;
  readonly deviceReappearanceCount: number;
  readonly deduplicatedDeviceCount: number;
  readonly monitoringFailureCount: number;
  readonly discoveryDurationNs: string;
  readonly averageDiscoveryDurationNs: string;
  readonly maximumDiscoveryDurationNs: string;
  readonly currentDiscoveryGeneration: number;
  readonly lastDiscoveryEvent?: string | undefined;
  readonly deviceHealthSummary: Readonly<Record<DeviceDiscoveryHealthState, number>>;
}
export interface DevicePlatformSnapshot {
  readonly providers: readonly DeviceProviderSnapshot[];
  readonly devices: readonly DeviceSnapshot[];
  readonly telemetry: DeviceTelemetrySnapshot;
  readonly generation: number;
}
export interface DeviceSourceMappingSnapshot {
  readonly deviceId: string;
  readonly sourceIds: readonly string[];
  readonly policy: SourceRegistrationPolicy;
}
export interface DeviceSourceMappingContext {
  readonly policy: SourceRegistrationPolicy;
  readonly nowNs: () => bigint;
}
export interface DeviceSourceMapper {
  mapDevice(
    device: DeviceSnapshot,
    context: DeviceSourceMappingContext,
  ): readonly SourceDescriptor[];
}

interface RecordState {
  descriptor: DeviceDescriptor;
  snapshot: DeviceSnapshot;
  sourceIds: string[];
}
export class DefaultDeviceSourceMapper implements DeviceSourceMapper {
  mapDevice(device: DeviceSnapshot): readonly SourceDescriptor[] {
    if (device.lifecycleState === 'REMOVED') return [];
    const base = createSourceDescriptorFromDevice(toMetadata(device));
    return freeze([
      {
        ...base,
        id: `source:${hash(device.identity.persistentIdentity)}:primary`,
        availability: device.available ? 'AVAILABLE' : 'UNAVAILABLE',
        metadata: {
          ...base.metadata,
          deviceId: device.id,
          persistentIdentityHash: hash(device.identity.persistentIdentity),
        },
      },
    ]);
  }
}

export class DefaultDeviceDiscoveryService {
  private providers = new Map<
    string,
    { provider: DeviceDiscoveryProvider; seq: number; active: boolean }
  >();
  private seq = 0;
  private generation = 0;
  private records = new Map<string, RecordState>();
  private persistent = new Map<string, string>();
  private monitoring = false;
  private durations: bigint[] = [];
  private counters = {
    probes: 0,
    probeFailures: 0,
    arrivals: 0,
    removals: 0,
    reappearances: 0,
    deduped: 0,
    monitoringFailures: 0,
  };
  private lastEvent?: string;
  constructor(
    private readonly registry = new DeviceRegistry(),
    private readonly nowNs: () => bigint = () => BigInt(Date.now()) * 1000000n,
    private readonly mapper: DeviceSourceMapper = new DefaultDeviceSourceMapper(),
    private readonly sourcePolicy: SourceRegistrationPolicy = 'REGISTER_AVAILABLE_SOURCES',
  ) {}
  registerProvider(provider: DeviceDiscoveryProvider) {
    const id = provider.descriptor.providerId;
    if (this.providers.has(id)) throw new DuplicateDeviceProviderError(id);
    this.providers.set(id, { provider, seq: ++this.seq, active: true });
    this.lastEvent = 'DeviceProviderRegistered';
  }
  async unregisterProvider(providerId: string) {
    const p = this.providers.get(providerId);
    if (!p) throw new DeviceProviderNotFoundError(providerId);
    await p.provider.shutdown({ nowNs: this.nowNs });
    this.providers.delete(providerId);
    this.lastEvent = 'DeviceProviderUnregistered';
  }
  private ordered() {
    return [...this.providers.values()].sort(
      (a, b) =>
        a.provider.descriptor.priority - b.provider.descriptor.priority ||
        a.provider.descriptor.providerId.localeCompare(b.provider.descriptor.providerId) ||
        a.seq - b.seq,
    );
  }
  async discover(request: DeviceDiscoveryRequest = {}) {
    return this.refresh(request);
  }
  async refresh(request: DeviceRefreshRequest = {}): Promise<DeviceDiscoveryDelta> {
    this.validateRequest(request);
    if (request.signal?.aborted)
      throw err('DeviceDiscoveryCancelled', 'Device discovery cancelled');
    const started = this.nowNs();
    const gen = ++this.generation;
    const seen = new Set<string>();
    const providerResults: { providerId: string; deviceCount: number }[] = [];
    const providerWarnings: string[] = [];
    const providerErrors: { providerId: string; error: string }[] = [];
    const before = new Set(this.records.keys());
    let partial = false;
    for (const entry of this.ordered().filter(
      (e) => !request.providerId || e.provider.descriptor.providerId === request.providerId,
    )) {
      try {
        const r = await entry.provider.discover(request, { nowNs: this.nowNs });
        providerResults.push({
          providerId: entry.provider.descriptor.providerId,
          deviceCount: r.devices.length,
        });
        providerWarnings.push(...(r.warnings ?? []));
        if (r.partial) partial = true;
        for (const d of r.devices)
          this.ingest(
            d,
            entry.provider.descriptor.priority,
            gen,
            seen,
            request.refreshCapabilities ? entry.provider : undefined,
          );
      } catch (e) {
        partial = true;
        providerErrors.push({
          providerId: entry.provider.descriptor.providerId,
          error:
            e instanceof Error
              ? e.message.replace(/serial|path|token/gi, 'redacted')
              : 'provider failed',
        });
      }
    }
    const removed: DeviceSnapshot[] = [];
    const unavailable: DeviceSnapshot[] = [];
    for (const [id, rec] of this.records)
      if (!seen.has(id)) {
        const miss = rec.snapshot.consecutiveMissingGenerations + 1;
        const state = miss >= 2 ? 'REMOVED' : 'UNAVAILABLE';
        const snap = this.makeSnapshot(
          rec.descriptor,
          state,
          gen,
          rec.snapshot.firstSeenGeneration,
          miss,
          rec.snapshot.aliases,
          rec.snapshot.capabilityProbeState,
          rec.snapshot.sources,
          state === 'REMOVED' ? gen : rec.snapshot.removalGeneration,
        );
        rec.snapshot = snap;
        this.registry.update(id, {
          connectionState: state === 'REMOVED' ? 'disposed' : 'unavailable',
        });
        (state === 'REMOVED' ? removed : unavailable).push(snap);
        if (state === 'REMOVED') this.counters.removals++;
      }
    const devices = this.filtered(request);
    const completed = this.nowNs();
    const duration = completed - started;
    this.durations.push(duration);
    if (this.durations.length > 128) this.durations.shift();
    this.lastEvent =
      providerErrors.length && !devices.length
        ? 'DeviceDiscoveryFailed'
        : 'DeviceDiscoveryCompleted';
    const discovered = devices.filter((d) => !before.has(d.id));
    const updated = devices.filter((d) => before.has(d.id) && seen.has(d.id));
    const snap = freeze({
      devices,
      providerResults,
      providerWarnings,
      providerErrors,
      partial,
      startedAtNs: started.toString(),
      completedAtNs: completed.toString(),
      durationNs: duration.toString(),
      generation: gen,
      snapshotId: `device-discovery:${gen}`,
      discoveredDevices: discovered,
      updatedDevices: updated,
      unavailableDevices: unavailable,
      removedDevices: removed,
      unchangedDeviceCount: Math.max(0, devices.length - discovered.length - updated.length),
    });
    this.assertInvariants();
    return snap as DeviceDiscoveryDelta;
  }
  private ingest(
    d: DeviceDescriptor,
    priority: number,
    gen: number,
    seen: Set<string>,
    probe?: DeviceDiscoveryProvider,
  ) {
    const descriptor = freeze({
      ...d,
      metadata: {
        ...sanitize(d.metadata),
        ...(d.metadata?.['serialNumber']
          ? { serialNumberHash: hash(String(d.metadata['serialNumber'])) }
          : {}),
        ...(d.metadata?.['serialNumberHash']
          ? { serialNumberHash: String(d.metadata['serialNumberHash']) }
          : {}),
        ...(d.metadata?.['hardwarePath']
          ? { hardwarePathHash: hash(String(d.metadata['hardwarePath'])) }
          : {}),
        ...(d.metadata?.['hardwarePathHash']
          ? { hardwarePathHash: String(d.metadata['hardwarePathHash']) }
          : {}),
      },
      persistentIdentity: d.persistentIdentity ?? `${d.providerId}:${d.id}`,
      sessionIdentity: d.sessionIdentity ?? `${d.providerId}:${d.id}:session`,
    }) as DeviceDescriptor;
    if (!descriptor.id || !descriptor.providerId || !descriptor.displayName)
      throw err(
        'InvalidDeviceDescriptor',
        'Device descriptor requires id, providerId and displayName',
      );
    const pkey =
      descriptor.allowCrossProviderMerge === false
        ? `${descriptor.providerId}:${descriptor.persistentIdentity}`
        : (descriptor.mergeKey ?? descriptor.persistentIdentity!);
    const existingId = this.persistent.get(pkey);
    const id = existingId ?? descriptor.id;
    if (existingId && existingId !== descriptor.id) this.counters.deduped++;
    this.persistent.set(pkey, id);
    seen.add(id);
    const old = this.records.get(id);
    const reappeared = old?.snapshot.lifecycleState === 'REMOVED';
    const aliases = [
      ...new Set([...(old?.snapshot.aliases ?? []), descriptor.id].filter((a) => a !== id)),
    ].sort();
    const sourceProbeState = probe?.probeCapabilities
      ? 'COMPLETE'
      : (old?.snapshot.capabilityProbeState ?? 'NOT_REQUESTED');
    if (probe?.probeCapabilities) this.counters.probes++;
    const state: DeviceLifecycleState = descriptor.available ? 'AVAILABLE' : 'UNAVAILABLE';
    const sources = this.mapper.mapDevice(
      {
        ...(old?.snapshot as DeviceSnapshot),
        ...descriptor,
        id,
        lifecycleState: state,
        identity: this.identity(descriptor, id, old?.snapshot),
        firstSeenGeneration: old?.snapshot.firstSeenGeneration ?? gen,
        lastSeenGeneration: gen,
        consecutiveMissingGenerations: 0,
        aliases,
        capabilityProbeState: sourceProbeState,
        sources: [],
        health: {} as DeviceHealthSnapshot,
      },
      { policy: this.sourcePolicy, nowNs: this.nowNs },
    );
    const snap = this.makeSnapshot(
      { ...descriptor, id },
      state,
      gen,
      old?.snapshot.firstSeenGeneration ?? gen,
      0,
      aliases,
      sourceProbeState,
      sources,
      undefined,
      reappeared ? gen : old?.snapshot.reappearanceGeneration,
    );
    this.records.set(id, {
      descriptor: { ...descriptor, id },
      snapshot: snap,
      sourceIds: sources.map((s) => s.id),
    });
    this.registry.register(toMetadata(snap));
    if (!old) this.counters.arrivals++;
    if (reappeared) this.counters.reappearances++;
  }
  private identity(d: DeviceDescriptor, id: string, old?: DeviceSnapshot): DeviceIdentity {
    const n = this.nowNs().toString();
    return freeze({
      deviceId: id,
      providerId: d.providerId,
      persistentIdentity: d.persistentIdentity ?? `${d.providerId}:${id}`,
      sessionIdentity: d.sessionIdentity ?? `${d.providerId}:${id}:session`,
      transport: d.transport,
      displayName: d.displayName,
      manufacturer: d.manufacturer,
      model: d.model,
      firstSeenAtNs: old?.identity.firstSeenAtNs ?? n,
      lastSeenAtNs: n,
      metadata: sanitize(d.metadata),
      ...(d.metadata['serialNumberHash'] || old?.identity.serialNumberHash
        ? {
            serialNumberHash: String(
              d.metadata['serialNumberHash'] ?? old?.identity.serialNumberHash,
            ),
          }
        : {}),
      ...(d.metadata['hardwarePathHash'] || old?.identity.hardwarePathHash
        ? {
            hardwarePathHash: String(
              d.metadata['hardwarePathHash'] ?? old?.identity.hardwarePathHash,
            ),
          }
        : {}),
    });
  }
  private makeSnapshot(
    d: DeviceDescriptor,
    state: DeviceLifecycleState,
    gen: number,
    first: number,
    miss: number,
    aliases: readonly string[],
    probe: DeviceProbeState,
    sources: readonly SourceDescriptor[],
    removalGeneration?: number,
    reappearanceGeneration?: number,
  ): DeviceSnapshot {
    const available = state === 'AVAILABLE' || state === 'CONNECTED';
    const n = this.nowNs().toString();
    const health: DeviceHealthSnapshot = {
      deviceId: d.id,
      lifecycleState: state,
      healthState: state === 'REMOVED' ? 'REMOVED' : available ? 'HEALTHY' : 'UNAVAILABLE',
      available,
      connected: d.connected,
      permissionState: d.permissionState,
      capabilitiesKnown: d.capabilitiesKnown,
      lastSeenAtNs: n,
      lastAvailableAtNs: available ? n : undefined,
      lastUnavailableAtNs: available ? undefined : n,
      consecutiveDiscoveryMisses: miss,
      discoveryFailures: 0,
      probeFailures: probe === 'FAILED' ? 1 : 0,
      connectionFailures: 0,
      reconnectAttempts: 0,
      updatedAtNs: n,
    };
    return freeze({
      ...d,
      available,
      lifecycleState: state,
      identity: this.identity(d, d.id, this.records.get(d.id)?.snapshot),
      firstSeenGeneration: first,
      lastSeenGeneration: gen,
      consecutiveMissingGenerations: miss,
      removalGeneration,
      reappearanceGeneration,
      aliases,
      capabilityProbeState: probe,
      sources,
      health,
    });
  }
  listDevices(filter: DeviceDiscoveryRequest = {}) {
    return this.filtered(filter);
  }
  getDevice(deviceId: string) {
    return this.records.get(deviceId)?.snapshot;
  }
  getProvider(providerId: string) {
    const p = this.providers.get(providerId);
    return p && freeze({ ...p.provider.descriptor, active: p.active, registrationSequence: p.seq });
  }
  getSnapshot(): DevicePlatformSnapshot {
    const devices = this.filtered({ includeUnavailable: true, includeRemoved: true });
    return freeze({
      providers: this.ordered().map((p) => ({
        ...p.provider.descriptor,
        active: p.active,
        registrationSequence: p.seq,
      })),
      devices,
      telemetry: this.telemetry(devices),
      generation: this.generation,
    });
  }
  async startMonitoring(options: { readonly pollIntervalMs?: number } = {}) {
    if (this.monitoring) throw new DeviceMonitoringAlreadyRunningError();
    this.monitoring = true;
    for (const p of this.ordered())
      if (p.provider.startMonitoring)
        await p.provider.startMonitoring(
          { nowNs: this.nowNs, pollIntervalMs: options.pollIntervalMs ?? 1000 },
          () => undefined,
        );
    this.lastEvent = 'DeviceMonitoringStarted';
  }
  async stopMonitoring() {
    if (!this.monitoring) throw new DeviceMonitoringNotRunningError();
    for (const p of this.ordered())
      if (p.provider.stopMonitoring)
        await p.provider.stopMonitoring({ nowNs: this.nowNs, pollIntervalMs: 0 });
    this.monitoring = false;
    this.lastEvent = 'DeviceMonitoringStopped';
  }
  async shutdown() {
    if (this.monitoring) await this.stopMonitoring();
    for (const p of this.ordered()) await p.provider.shutdown({ nowNs: this.nowNs });
    this.lastEvent = 'DeviceStopped';
  }
  assertInvariants() {
    const ids = new Set<string>();
    for (const d of this.records.values()) {
      if (ids.has(d.snapshot.id))
        throw err('DeviceRegistryInvariantViolation', 'duplicate device id');
      ids.add(d.snapshot.id);
      if (d.snapshot.lifecycleState === 'REMOVED' && d.snapshot.available)
        throw err('DeviceRegistryInvariantViolation', 'removed device available');
      if (d.snapshot.identity.displayName === d.snapshot.identity.persistentIdentity)
        throw err('InvalidDeviceIdentity', 'display name cannot be sole identity');
      if (d.snapshot.sources.some((s) => s.metadata['deviceId'] !== d.snapshot.id))
        throw err('DeviceSourceMappingFailed', 'source mapping references missing device');
    }
  }
  private telemetry(devices: readonly DeviceSnapshot[]): DeviceTelemetrySnapshot {
    const dur = this.durations;
    const sum = dur.reduce((a, b) => a + b, 0n);
    const healths = Object.fromEntries(
      [
        'UNKNOWN',
        'HEALTHY',
        'DEGRADED',
        'UNHEALTHY',
        'UNAVAILABLE',
        'FAILED',
        'REMOVED',
        'STOPPED',
      ].map((h) => [h, devices.filter((d) => d.health.healthState === h).length]),
    ) as Record<DeviceDiscoveryHealthState, number>;
    return {
      registeredProviderCount: this.providers.size,
      activeProviderCount: [...this.providers.values()].filter((p) => p.active).length,
      discoveredDeviceCount: devices.length,
      availableDeviceCount: devices.filter((d) => d.available).length,
      unavailableDeviceCount: devices.filter((d) => !d.available && d.lifecycleState !== 'REMOVED')
        .length,
      removedDeviceCount: devices.filter((d) => d.lifecycleState === 'REMOVED').length,
      physicalDeviceCount: devices.filter((d) => !d.virtual).length,
      virtualDeviceCount: devices.filter((d) => d.virtual).length,
      videoInputCount: devices.filter((d) => d.type === 'VIDEO_INPUT').length,
      audioInputCount: devices.filter((d) => d.type === 'AUDIO_INPUT').length,
      captureCardCount: devices.filter((d) => d.type === 'CAPTURE_CARD').length,
      permissionDeniedCount: devices.filter((d) => d.permissionState === 'DENIED').length,
      capabilityProbeCount: this.counters.probes,
      capabilityProbeFailures: this.counters.probeFailures,
      deviceArrivalCount: this.counters.arrivals,
      deviceRemovalCount: this.counters.removals,
      deviceReappearanceCount: this.counters.reappearances,
      deduplicatedDeviceCount: this.counters.deduped,
      monitoringFailureCount: this.counters.monitoringFailures,
      discoveryDurationNs: (dur.at(-1) ?? 0n).toString(),
      averageDiscoveryDurationNs: (dur.length ? sum / BigInt(dur.length) : 0n).toString(),
      maximumDiscoveryDurationNs: dur.reduce((m, d) => (d > m ? d : m), 0n).toString(),
      currentDiscoveryGeneration: this.generation,
      lastDiscoveryEvent: this.lastEvent,
      deviceHealthSummary: healths,
    };
  }
  private filtered(r: DeviceDiscoveryRequest) {
    return [...this.records.values()]
      .map((r) => r.snapshot)
      .filter(
        (d) =>
          (r.includeRemoved || d.lifecycleState !== 'REMOVED') &&
          (r.includeUnavailable || d.available) &&
          (!r.providerId || d.providerId === r.providerId) &&
          (!r.deviceTypes?.length || r.deviceTypes.includes(d.type)) &&
          (r.virtual === undefined || d.virtual === r.virtual) &&
          (!r.permissionStates?.length || r.permissionStates.includes(d.permissionState)) &&
          (!r.transport || d.transport === r.transport),
      )
      .sort(deviceOrder);
  }
  private validateRequest(r: DeviceDiscoveryRequest) {
    if (r.timeoutMs !== undefined && (!Number.isFinite(r.timeoutMs) || r.timeoutMs < 0))
      throw err('InvalidDiscoveryConfiguration', 'timeoutMs must be non-negative');
    if (r.providerId && !this.providers.has(r.providerId))
      throw new DeviceProviderNotFoundError(r.providerId);
  }
}
const deviceOrder = (a: DeviceSnapshot, b: DeviceSnapshot) =>
  a.type.localeCompare(b.type) ||
  a.providerId.localeCompare(b.providerId) ||
  a.displayName.localeCompare(b.displayName) ||
  a.identity.persistentIdentity.localeCompare(b.identity.persistentIdentity) ||
  a.id.localeCompare(b.id);
const toMetadata = (d: DeviceSnapshot): DeviceMetadata => {
  const m: Record<string, unknown> = {
    deviceId: d.id,
    persistentId: d.identity.persistentIdentity,
    displayName: d.displayName,
    manufacturer: d.manufacturer,
    model: d.model,
    deviceType:
      d.type === 'AUDIO_INPUT'
        ? 'microphone'
        : d.type === 'CAPTURE_CARD'
          ? 'capture-card'
          : d.type === 'DISPLAY'
            ? 'screen-capture-device'
            : d.type === 'VIRTUAL_CAMERA'
              ? 'virtual-camera'
              : 'video-camera',
    connectionType: d.connectionKind as DeviceConnectionType,
    capabilities: d.capabilities,
    supportedFormats: [...(d.capabilities.video ?? []), ...(d.capabilities.audio ?? [])],
    sampleRates: (d.capabilities.audio ?? []).map((a) => a.sampleRate ?? 48000),
    channelCounts: (d.capabilities.audio ?? []).map((a) => a.channels ?? 2),
    frameRates: (d.capabilities.video ?? []).map((v) => v.frameRate ?? 30),
    resolutions: (d.capabilities.video ?? []).map((v) => ({
      width: v.width ?? 1920,
      height: v.height ?? 1080,
    })),
    colorFormats: (d.capabilities.video ?? []).map((v) => v.pixelFormat ?? 'UNKNOWN'),
    transport: d.transport,
    health: {
      state: d.available ? 'healthy' : 'unavailable',
      availability: d.available ? 'available' : 'unavailable',
      connectionState: d.available
        ? 'ready'
        : d.lifecycleState === 'REMOVED'
          ? 'disposed'
          : 'unavailable',
      permissionState:
        d.permissionState === 'GRANTED'
          ? 'granted'
          : d.permissionState === 'DENIED'
            ? 'denied'
            : 'unknown',
    },
    connectionState: d.available
      ? 'ready'
      : d.lifecycleState === 'REMOVED'
        ? 'disposed'
        : 'unavailable',
    lastSeenAt: new Date(Number(BigInt(d.identity.lastSeenAtNs) / 1000000n)).toISOString(),
    runtimeAdapterId: d.providerId,
  };
  if (d.manufacturer) m['manufacturer'] = d.manufacturer;
  if (d.model) m['model'] = d.model;
  return m as unknown as DeviceMetadata;
};

export class SyntheticDeviceDiscoveryProvider implements DeviceDiscoveryProvider {
  private devices: DeviceDescriptor[];
  private monitoring = false;
  constructor(
    readonly descriptor: DeviceDiscoveryProviderDescriptor,
    devices: readonly Partial<DeviceDescriptor>[] = [],
  ) {
    this.devices = devices.map((d, i) => syntheticDevice(descriptor.providerId, i, d));
  }
  async initialize() {
    return { ok: true };
  }
  async discover() {
    return freeze({ devices: this.devices, warnings: [], partial: false });
  }
  async startMonitoring(_c: DeviceMonitoringContext) {
    if (this.monitoring) throw new DeviceMonitoringAlreadyRunningError(this.descriptor.providerId);
    this.monitoring = true;
  }
  async stopMonitoring() {
    this.monitoring = false;
  }
  async probeCapabilities(device: DeviceDescriptor) {
    return freeze({ state: 'COMPLETE' as const, capabilities: device.capabilities });
  }
  async shutdown() {
    this.monitoring = false;
  }
  setDevices(devices: readonly Partial<DeviceDescriptor>[]) {
    this.devices = devices.map((d, i) => syntheticDevice(this.descriptor.providerId, i, d));
  }
}
export const createSyntheticDeviceProvider = (
  providerId = 'synthetic-devices',
  devices?: readonly Partial<DeviceDescriptor>[],
) =>
  new SyntheticDeviceDiscoveryProvider(
    {
      providerId,
      name: 'Synthetic Device Provider',
      version: '5.2.2',
      supportedDeviceTypes: [
        'VIDEO_INPUT',
        'AUDIO_INPUT',
        'CAPTURE_CARD',
        'VIRTUAL_CAMERA',
        'SYNTHETIC',
      ],
      supportsMonitoring: true,
      supportsCapabilityProbe: true,
      requiresNativeBridge: false,
      priority: 100,
      metadata: { deterministic: true },
    },
    devices,
  );
export const syntheticDevice = (
  providerId: string,
  index: number,
  d: Partial<DeviceDescriptor> = {},
): DeviceDescriptor =>
  freeze({
    id: d.id ?? `${providerId}:device:${index}`,
    providerId,
    type: d.type ?? 'VIDEO_INPUT',
    displayName: d.displayName ?? `Synthetic Device ${index}`,
    description: d.description,
    manufacturer: d.manufacturer ?? 'UBOS',
    model: d.model ?? 'Synthetic',
    transport: d.transport ?? 'synthetic',
    connectionKind: d.connectionKind ?? 'virtual',
    mediaKinds: d.mediaKinds ?? ['VIDEO'],
    available: d.available ?? true,
    connected: d.connected ?? false,
    virtual: d.virtual ?? true,
    removable: d.removable ?? true,
    hotPluggable: d.hotPluggable ?? true,
    requiresPermission: d.requiresPermission ?? false,
    permissionState: d.permissionState ?? 'NOT_REQUIRED',
    supportsVideo: d.supportsVideo ?? true,
    supportsAudioInput: d.supportsAudioInput ?? false,
    supportsAudioOutput: d.supportsAudioOutput ?? false,
    supportsMetadata: d.supportsMetadata ?? true,
    supportsHardwareTimestamps: d.supportsHardwareTimestamps ?? false,
    capabilitiesKnown: d.capabilitiesKnown ?? true,
    capabilities: d.capabilities ?? {
      video: [
        {
          kind: 'video',
          width: 1920,
          height: 1080,
          frameRate: 30,
          pixelFormat: 'RGBA',
          scan: 'progressive',
        },
      ],
      metadataOnly: true,
    },
    defaultProfile: d.defaultProfile,
    tags: d.tags ?? ['synthetic'],
    metadata: {
      ...sanitize(d.metadata),
      ...(d.metadata?.['serialNumber']
        ? { serialNumberHash: hash(String(d.metadata['serialNumber'])) }
        : {}),
      ...(d.metadata?.['serialNumberHash']
        ? { serialNumberHash: String(d.metadata['serialNumberHash']) }
        : {}),
      ...(d.metadata?.['hardwarePath']
        ? { hardwarePathHash: hash(String(d.metadata['hardwarePath'])) }
        : {}),
      ...(d.metadata?.['hardwarePathHash']
        ? { hardwarePathHash: String(d.metadata['hardwarePathHash']) }
        : {}),
    },
    persistentIdentity:
      d.persistentIdentity ?? hash(`${providerId}:${index}:${d.displayName ?? 'synthetic'}`),
    sessionIdentity: d.sessionIdentity ?? `${providerId}:session:${index}`,
    mergeKey: d.mergeKey,
    allowCrossProviderMerge: d.allowCrossProviderMerge,
  });
export const createWindowsDeviceDiscoveryProviderStub = () =>
  createSyntheticDeviceProvider('windows-device-discovery', []);
export const createMacOSDeviceDiscoveryProviderStub = () =>
  createSyntheticDeviceProvider('macos-device-discovery', []);
export const createLinuxDeviceDiscoveryProviderStub = () =>
  createSyntheticDeviceProvider('linux-device-discovery', []);
export const DEVICE_WATCHDOG_INCIDENTS = Object.freeze([
  'DEVICE_DISCOVERY_STALLED',
  'DEVICE_PROVIDER_FAILED',
  'DEVICE_UNAVAILABLE',
  'DEVICE_REMOVED',
  'DEVICE_PERMISSION_DENIED',
  'DEVICE_CAPABILITY_PROBE_FAILED',
  'DEVICE_MONITORING_FAILED',
  'DEVICE_IDENTITY_CONFLICT',
  'DEVICE_REGISTRY_INVARIANT_FAILURE',
  'DEVICE_SOURCE_MAPPING_FAILED',
] as const);
