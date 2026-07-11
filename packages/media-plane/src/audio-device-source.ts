import { RuntimeEngineError, type FrameTick } from './execution-engine.js';
import {
  DeterministicSourceTimestampNormalizer,
  createSourceAudioFormat,
  type AudioBufferEnvelope,
  type MediaSource,
  type SourceAudioFormat,
  type SourceClockDomain,
  type SourceDescriptor,
  type SourceHealthState,
  type SourceLatencyClass,
  type SourceOperationResult,
  type SourcePermissionState,
  type SourceProvider,
  type SourceProviderContext,
  type SourceProviderDescriptor,
  type SourceRuntimeContext,
  type SourceSampleBatch,
} from './source-acquisition.js';
import type { DeviceDescriptor, DeviceDiscoveryType } from './device-discovery.js';

const clone = <T>(v: T): T => structuredClone(v) as T;
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object') {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) freeze(x);
  }
  return v as Readonly<T>;
};
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};
const redact = (v: unknown): unknown => {
  if (typeof v === 'string') return v.replace(/\/[^\s]+/g, '/<redacted>').slice(0, 160);
  if (Array.isArray(v)) return v.slice(0, 16).map(redact);
  if (v && typeof v === 'object') {
    const o: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 48))
      o[
        /serial|path|user|endpoint|token|secret|password|pcm|payload|handle/i.test(k)
          ? `redacted_${hash(k)}`
          : k
      ] = /serial|path|user|endpoint|token|secret|password|pcm|payload|handle/i.test(k)
        ? '<redacted>'
        : redact(val);
    return o;
  }
  return v;
};

export type AudioSourceCategory =
  | 'MICROPHONE'
  | 'LINE_INPUT'
  | 'AUDIO_INTERFACE_INPUT'
  | 'DESKTOP_AUDIO'
  | 'SYSTEM_LOOPBACK'
  | 'VIRTUAL_AUDIO_INPUT'
  | 'EMBEDDED_CAMERA_AUDIO'
  | 'CAPTURE_CARD_AUDIO'
  | 'REMOTE_AUDIO_ADAPTER'
  | 'SYNTHETIC_AUDIO'
  | 'CUSTOM_AUDIO';
export type AudioSampleFormat = 'U8' | 'S16' | 'S24' | 'S32' | 'F32' | 'F64' | 'UNKNOWN';
export type AudioChannelLayout = 'MONO' | 'STEREO' | '2_1' | '4_0' | '5_1' | '7_1' | 'CUSTOM';
export type AudioAccessMode = 'SHARED' | 'EXCLUSIVE';
export type AudioBufferOwnership =
  | 'OWNED_BY_BACKEND'
  | 'OWNED_BY_SOURCE'
  | 'OWNED_BY_RUNTIME'
  | 'BORROWED'
  | 'EXTERNAL_HANDLE'
  | 'RELEASED';
export type AudioOverflowPolicy =
  'DROP_OLDEST' | 'DROP_NEWEST' | 'REJECT' | 'FAIL_SOURCE' | 'SIGNAL_DISCONTINUITY';
export type AudioUnderflowPolicy =
  'RETURN_EMPTY' | 'SIGNAL_GAP' | 'DEGRADE_SOURCE' | 'FAIL_FRAME_CRITICAL';
export type AudioCommandType =
  | 'AUDIO_REGISTER'
  | 'AUDIO_OPEN'
  | 'AUDIO_START'
  | 'AUDIO_STOP'
  | 'AUDIO_CLOSE'
  | 'AUDIO_SET_FORMAT'
  | 'AUDIO_SELECT_CHANNEL_GROUP'
  | 'AUDIO_SET_CONTROL'
  | 'AUDIO_RESET_CONTROL'
  | 'AUDIO_SET_LOOPBACK'
  | 'AUDIO_RECONNECT'
  | 'AUDIO_ENABLE'
  | 'AUDIO_DISABLE'
  | 'AUDIO_REFRESH_CAPABILITIES';
export const AUDIO_COMMAND_TYPES = freeze([
  'AUDIO_REGISTER',
  'AUDIO_OPEN',
  'AUDIO_START',
  'AUDIO_STOP',
  'AUDIO_CLOSE',
  'AUDIO_SET_FORMAT',
  'AUDIO_SELECT_CHANNEL_GROUP',
  'AUDIO_SET_CONTROL',
  'AUDIO_RESET_CONTROL',
  'AUDIO_SET_LOOPBACK',
  'AUDIO_RECONNECT',
  'AUDIO_ENABLE',
  'AUDIO_DISABLE',
  'AUDIO_REFRESH_CAPABILITIES',
] as const);
export const AUDIO_EVENT_TYPES = freeze([
  'AudioSourceRegistered',
  'AudioOpening',
  'AudioOpened',
  'AudioOpenFailed',
  'AudioCaptureStarting',
  'AudioCaptureStarted',
  'AudioCaptureStopping',
  'AudioCaptureStopped',
  'AudioClosing',
  'AudioClosed',
  'AudioBufferReceived',
  'AudioBufferPublished',
  'AudioBufferDropped',
  'AudioBufferUnderflow',
  'AudioQueuePressure',
  'AudioSequenceGap',
  'AudioSampleGap',
  'AudioSampleOverlap',
  'AudioTimestampDiscontinuity',
  'AudioFormatChanged',
  'AudioChannelGroupChanged',
  'AudioControlChanged',
  'AudioControlFailed',
  'AudioPermissionChanged',
  'AudioDisconnected',
  'AudioUnavailable',
  'AudioReconnecting',
  'AudioReconnected',
  'AudioReconnectFailed',
  'AudioBackendFailed',
  'AudioHealthChanged',
] as const);
export const AUDIO_WATCHDOG_INCIDENTS = freeze([
  'AUDIO_NO_BUFFERS',
  'AUDIO_CAPTURE_STALLED',
  'AUDIO_DEVICE_UNAVAILABLE',
  'AUDIO_PERMISSION_DENIED',
  'AUDIO_QUEUE_OVERFLOW',
  'AUDIO_UNDERFLOW_RATE_HIGH',
  'AUDIO_DROP_RATE_HIGH',
  'AUDIO_SAMPLE_GAP_RATE_HIGH',
  'AUDIO_SAMPLE_OVERLAP',
  'AUDIO_TIMESTAMP_UNSTABLE',
  'AUDIO_CLOCK_DRIFT_HIGH',
  'AUDIO_LATENCY_HIGH',
  'AUDIO_BACKEND_FAILED',
  'AUDIO_RECONNECT_EXHAUSTED',
  'AUDIO_GRAPH_MISMATCH',
  'AUDIO_INVARIANT_FAILURE',
] as const);
export class AudioSourceError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(code, message, redact(details) as Record<string, unknown>);
  }
}
const ae = (c: string, m: string, d: Record<string, unknown> = {}) => new AudioSourceError(c, m, d);
export class AudioPermissionDenied extends AudioSourceError {
  constructor(id: string) {
    super('AudioPermissionDenied', 'Audio permission denied', { sourceId: id });
  }
}
export class AudioAlreadyOpen extends AudioSourceError {
  constructor(id: string) {
    super('AudioAlreadyOpen', 'Audio source already open', { sourceId: id });
  }
}
export class AudioNotOpen extends AudioSourceError {
  constructor(id: string) {
    super('AudioNotOpen', 'Audio source is not open', { sourceId: id });
  }
}
export class AudioAlreadyCapturing extends AudioSourceError {
  constructor(id: string) {
    super('AudioAlreadyCapturing', 'Audio source already capturing', { sourceId: id });
  }
}
export class AudioNotCapturing extends AudioSourceError {
  constructor(id: string) {
    super('AudioNotCapturing', 'Audio source is not capturing', { sourceId: id });
  }
}
export class AudioFormatUnsupported extends AudioSourceError {
  constructor(id: string) {
    super('AudioFormatUnsupported', 'Audio format unsupported', { formatId: id });
  }
}
export class AudioChannelGroupNotFound extends AudioSourceError {
  constructor(id: string) {
    super('AudioChannelGroupNotFound', 'Audio channel group not found', { channelGroupId: id });
  }
}
export class AudioControlUnsupported extends AudioSourceError {
  constructor(id: string) {
    super('AudioControlUnsupported', 'Audio control unsupported', { controlId: id });
  }
}
export class AudioControlOutOfRange extends AudioSourceError {
  constructor(id: string) {
    super('AudioControlOutOfRange', 'Audio control out of range', { controlId: id });
  }
}
export class AudioLoopbackUnsupported extends AudioSourceError {
  constructor(id: string) {
    super('AudioLoopbackUnsupported', 'Audio loopback unsupported', { sourceId: id });
  }
}
export class AudioOwnershipViolation extends AudioSourceError {
  constructor(id: string) {
    super('AudioOwnershipViolation', 'Audio ownership violation', { handleId: id });
  }
}
export interface AudioChannelGroup {
  readonly id: string;
  readonly label: string;
  readonly channels: readonly number[];
  readonly layout: AudioChannelLayout;
  readonly default: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface AudioDeviceControlSnapshot {
  readonly controlId: string;
  readonly supported: boolean;
  readonly readOnly: boolean;
  readonly type: 'BOOLEAN' | 'NUMBER' | 'ENUM';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly defaultValue?: unknown;
  readonly currentValue?: unknown;
  readonly units?: string;
  readonly dangerous?: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface AudioSourceDescriptor extends SourceDescriptor {
  readonly audioCategory: AudioSourceCategory;
  readonly deviceIdentity: Readonly<{
    deviceId: string;
    providerId: string;
    persistentIdentity: string;
  }>;
  readonly audio: Readonly<{
    supportedFormats: readonly SourceAudioFormat[];
    defaultFormat: SourceAudioFormat;
    channelGroups: readonly AudioChannelGroup[];
    clockDomain: SourceClockDomain;
    hardwareClock: boolean;
    loopbackCapable: boolean;
    accessModes: readonly AudioAccessMode[];
    reconnectable: boolean;
    hotPlug: boolean;
    latencyClass: SourceLatencyClass;
    controls: readonly AudioDeviceControlSnapshot[];
    virtual: boolean;
  }>;
}
export interface AudioFormatNegotiationRequest {
  readonly exactSampleRate?: number;
  readonly preferredSampleRate?: number;
  readonly maximumSampleRate?: number;
  readonly exactChannelCount?: number;
  readonly preferredChannelLayout?: string;
  readonly preferredSampleFormat?: string;
  readonly preferredFramesPerBuffer?: number;
  readonly requireHardwareClock?: boolean;
  readonly latencyPreference?: SourceLatencyClass;
  readonly accessMode?: AudioAccessMode;
  readonly requireLoopback?: boolean;
  readonly planar?: boolean;
}
export interface AudioFormatNegotiationResult {
  readonly ok: boolean;
  readonly selectedFormat?: SourceAudioFormat;
  readonly explanation: readonly string[];
  readonly fallbackDetails: readonly string[];
  readonly rejectedCandidateReasons: readonly { formatId: string; reason: string }[];
  readonly estimatedBytesPerSecond: number;
  readonly estimatedBufferCadenceNs: string;
  readonly expectedLatencyRangeNs: readonly [string, string];
}
export interface AudioOpenRequest {
  readonly format?: SourceAudioFormat;
  readonly accessMode?: AudioAccessMode;
  readonly maximumBuffers?: number;
  readonly maximumBufferedDurationNs?: bigint;
  readonly timeoutNs?: bigint;
  readonly preferHardwareClock?: boolean;
  readonly loopback?: boolean;
  readonly reconnectPolicy?: Readonly<{ enabled: boolean; maximumAttempts: number }>;
  readonly initialControls?: Readonly<Record<string, unknown>>;
  readonly channelGroupId?: string;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface AudioOperationResult extends SourceOperationResult {}
export interface AudioDeviceControlRequest {
  readonly controlId: string;
  readonly value: unknown;
  readonly confirmedDangerous?: boolean;
  readonly correlationId?: string;
}
export interface AudioDeviceControlResult {
  readonly ok: boolean;
  readonly control?: AudioDeviceControlSnapshot;
  readonly error?: { readonly code: string; readonly message: string };
}
export interface AudioBufferPayload {
  readonly handleId: string;
  readonly release: () => void;
  readonly byteLength?: number;
  readonly ownership: AudioBufferOwnership;
}
export interface AudioBackendBuffer {
  readonly sequenceNumber: bigint;
  readonly timestampNs?: bigint;
  readonly sampleCount: number;
  readonly startSamplePosition: bigint;
  readonly hardwareTimestamp?: boolean;
  readonly discontinuity?: boolean;
  readonly corrupted?: boolean;
  readonly payload: AudioBufferPayload;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export type AudioBufferCallback = (buffer: AudioBackendBuffer) => void;
export type AudioBackendStateCallback = (state: string) => void;
export type AudioBackendErrorCallback = (error: unknown) => void;
export interface AudioBackendOpenRequest {
  readonly descriptor: AudioSourceDescriptor;
  readonly format: SourceAudioFormat;
  readonly accessMode: AudioAccessMode;
  readonly channelGroup: AudioChannelGroup;
  readonly loopback: boolean;
  readonly generation: number;
}
export interface AudioBackendOpenResult {
  readonly ok: boolean;
  readonly backendId: string;
  readonly selectedFormat: SourceAudioFormat;
  readonly estimatedLatencyNs: readonly [string, string];
}
export interface AudioBackendContext {
  readonly nowNs: () => bigint;
  readonly signal?: AbortSignal;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface AudioCaptureBackend {
  readonly backendId: string;
  open(
    request: AudioBackendOpenRequest,
    context: AudioBackendContext,
  ): Promise<AudioBackendOpenResult>;
  start(
    onBuffer: AudioBufferCallback,
    onStateChanged: AudioBackendStateCallback,
    onError: AudioBackendErrorCallback,
    context: AudioBackendContext,
  ): Promise<void>;
  stop(context: AudioBackendContext): Promise<void>;
  getControls?(): Promise<Readonly<{ controls: readonly AudioDeviceControlSnapshot[] }>>;
  setControl?(
    request: AudioDeviceControlRequest,
    context: AudioBackendContext,
  ): Promise<AudioDeviceControlResult>;
  close(context: AudioBackendContext): Promise<void>;
}
export interface AudioBackendHealthSnapshot {
  readonly backendId: string;
  readonly open: boolean;
  readonly capturing: boolean;
  readonly callbacksActive: number;
  readonly handlesCreated: number;
  readonly handlesReleased: number;
  readonly lateCallbacks: number;
  readonly failures: number;
  readonly updatedAtNs: string;
}
export interface AudioProviderContext extends SourceProviderContext {}
export interface AudioDeviceDiscoveryRequest {
  readonly providerId?: string;
  readonly categories?: readonly AudioSourceCategory[];
  readonly includeUnavailable?: boolean;
}
export interface AudioDeviceDiscoveryResult {
  readonly descriptors: readonly AudioSourceDescriptor[];
  readonly warnings: readonly string[];
  readonly durationNs: string;
}
export interface AudioDeviceSourceProvider extends SourceProvider {
  listAudioDevices(
    request: AudioDeviceDiscoveryRequest,
    context: AudioProviderContext,
  ): Promise<AudioDeviceDiscoveryResult>;
  createAudioSource(
    descriptor: AudioSourceDescriptor,
    context: AudioProviderContext,
  ): Promise<AudioDeviceSource>;
  getBackendHealth(): Readonly<AudioBackendHealthSnapshot>;
}
export interface AudioDeviceSource extends MediaSource {
  readonly descriptor: AudioSourceDescriptor;
  open(request: AudioOpenRequest, context: SourceRuntimeContext): Promise<AudioOperationResult>;
  startCapture(context: SourceRuntimeContext): Promise<AudioOperationResult>;
  stopCapture(context: SourceRuntimeContext): Promise<AudioOperationResult>;
  setDeviceControl?(
    request: AudioDeviceControlRequest,
    context: SourceRuntimeContext,
  ): Promise<AudioDeviceControlResult>;
  close(context: SourceRuntimeContext): Promise<AudioOperationResult>;
  assertInvariants(): void;
  getAudioSnapshot(): Readonly<AudioSourceSnapshot>;
}
export interface AudioQueueConfiguration {
  readonly maximumBuffers: number;
  readonly maximumSamples: number;
  readonly highWaterMark: number;
  readonly lowWaterMark: number;
  readonly overflowPolicy: AudioOverflowPolicy;
  readonly maximumBufferAgeNs: bigint;
  readonly maximumBufferedDurationNs: bigint;
  readonly targetBufferedDurationNs: bigint;
  readonly releaseDroppedBuffers: boolean;
}
export interface AudioQueueSnapshot {
  readonly enqueued: number;
  readonly dequeued: number;
  readonly droppedOldest: number;
  readonly droppedNewest: number;
  readonly rejected: number;
  readonly highWaterEvents: number;
  readonly queueDepth: number;
  readonly bufferedSamples: number;
  readonly bufferedDurationNs: string;
  readonly discontinuityCount: number;
}
class AudioQueue {
  private q: AudioBufferEnvelope[] = [];
  stats = {
    enqueued: 0,
    dequeued: 0,
    droppedOldest: 0,
    droppedNewest: 0,
    rejected: 0,
    highWaterEvents: 0,
    discontinuityCount: 0,
  };
  constructor(
    readonly config: AudioQueueConfiguration,
    private release: (e: AudioBufferEnvelope) => void,
  ) {
    if (
      config.maximumBuffers <= 0 ||
      config.maximumSamples <= 0 ||
      config.maximumBufferedDurationNs <= 0n
    )
      throw ae('AudioQueueOverflow', 'Invalid bounded audio queue');
  }
  enqueue(e: AudioBufferEnvelope) {
    const samples = () => this.q.reduce((n, b) => n + b.sampleCount, 0);
    const duration = () => this.q.reduce((n, b) => n + b.durationNs, 0n);
    const over = () =>
      this.q.length >= this.config.maximumBuffers ||
      samples() + e.sampleCount > this.config.maximumSamples ||
      duration() + e.durationNs > this.config.maximumBufferedDurationNs;
    if (over()) {
      if (
        this.config.overflowPolicy === 'DROP_OLDEST' ||
        this.config.overflowPolicy === 'SIGNAL_DISCONTINUITY'
      ) {
        const d = this.q.shift();
        if (d) {
          this.stats.droppedOldest++;
          this.stats.discontinuityCount++;
          if (this.config.releaseDroppedBuffers) this.release(d);
        }
      } else if (this.config.overflowPolicy === 'DROP_NEWEST') {
        this.stats.droppedNewest++;
        if (this.config.releaseDroppedBuffers) this.release(e);
        return false;
      } else if (this.config.overflowPolicy === 'REJECT') {
        this.stats.rejected++;
        return false;
      } else throw ae('AudioQueueOverflow', 'Audio queue overflow');
    }
    this.q.push(e);
    this.q.sort((a, b) =>
      (a as unknown as { startSamplePosition: bigint }).startSamplePosition <
      (b as unknown as { startSamplePosition: bigint }).startSamplePosition
        ? -1
        : (a as unknown as { startSamplePosition: bigint }).startSamplePosition >
            (b as unknown as { startSamplePosition: bigint }).startSamplePosition
          ? 1
          : Number(a.sequenceNumber - b.sequenceNumber),
    );
    this.stats.enqueued++;
    if (this.q.length >= this.config.highWaterMark) this.stats.highWaterEvents++;
    return true;
  }
  select(startNs: bigint, endNs: bigint, published: Set<string>) {
    const out: AudioBufferEnvelope[] = [];
    const keep: AudioBufferEnvelope[] = [];
    for (const b of this.q) {
      const bEnd = b.normalizedTimestampNs + b.durationNs;
      if (b.normalizedTimestampNs >= endNs) {
        keep.push(b);
        continue;
      }
      if (bEnd <= startNs || published.has(`${b.streamId}:${b.sequenceNumber}`)) {
        this.release(b);
        continue;
      }
      out.push(b);
      published.add(`${b.streamId}:${b.sequenceNumber}`);
      this.stats.dequeued++;
    }
    this.q = keep;
    return freeze(out);
  }
  clear() {
    for (const b of this.q) this.release(b);
    this.q = [];
  }
  snapshot(): AudioQueueSnapshot {
    return freeze({
      ...this.stats,
      queueDepth: this.q.length,
      bufferedSamples: this.q.reduce((n, b) => n + b.sampleCount, 0),
      bufferedDurationNs: this.q.reduce((n, b) => n + b.durationNs, 0n).toString(),
    });
  }
}
export interface AudioSourceHealthSnapshot {
  readonly sourceId: string;
  readonly deviceId: string;
  readonly lifecycleState: string;
  readonly healthState: SourceHealthState;
  readonly connected: boolean;
  readonly active: boolean;
  readonly available: boolean;
  readonly permissionState: SourcePermissionState;
  readonly selectedFormat?: SourceAudioFormat;
  readonly selectedChannelGroup?: AudioChannelGroup;
  readonly loopbackEnabled: boolean;
  readonly backendId: string;
  readonly clockDomain: SourceClockDomain;
  readonly lastBufferSequence?: string;
  readonly lastNormalizedTimestampNs?: string;
  readonly lastSamplePosition?: string;
  readonly queueDepth: number;
  readonly bufferedSamples: number;
  readonly bufferedDurationNs: string;
  readonly droppedBuffers: number;
  readonly droppedSamples: number;
  readonly underflows: number;
  readonly overflows: number;
  readonly sequenceGaps: number;
  readonly sampleGaps: number;
  readonly overlaps: number;
  readonly samplePositionRegressions: number;
  readonly timestampRegressions: number;
  readonly discontinuities: number;
  readonly corruptedBuffers: number;
  readonly backendErrors: number;
  readonly reconnectAttempts: number;
  readonly lastError?: string;
  readonly updatedAtNs: string;
}
export interface AudioSourceSnapshot {
  readonly descriptor: AudioSourceDescriptor;
  readonly lifecycleState: string;
  readonly health: AudioSourceHealthSnapshot;
  readonly queue: AudioQueueSnapshot;
  readonly clock: Readonly<Record<string, unknown>>;
  readonly backend: AudioBackendHealthSnapshot;
  readonly controls: readonly AudioDeviceControlSnapshot[];
  readonly generatedAtNs: string;
}
const defaultQueue: AudioQueueConfiguration = {
  maximumBuffers: 8,
  maximumSamples: 48000,
  highWaterMark: 6,
  lowWaterMark: 2,
  overflowPolicy: 'DROP_OLDEST',
  maximumBufferAgeNs: 1_000_000_000n,
  maximumBufferedDurationNs: 250_000_000n,
  targetBufferedDurationNs: 80_000_000n,
  releaseDroppedBuffers: true,
};
export function negotiateAudioFormat(
  formats: readonly SourceAudioFormat[],
  r: AudioFormatNegotiationRequest = {},
): AudioFormatNegotiationResult {
  const rej: { formatId: string; reason: string }[] = [];
  let c = [...formats];
  c = c.filter((f) => {
    const bad = (why: string) => {
      rej.push({ formatId: f.id, reason: why });
      return false;
    };
    if (r.exactSampleRate && f.sampleRate !== r.exactSampleRate) return bad('exactSampleRate');
    if (r.maximumSampleRate && f.sampleRate > r.maximumSampleRate) return bad('maximumSampleRate');
    if (r.exactChannelCount && f.channelCount !== r.exactChannelCount)
      return bad('exactChannelCount');
    if (r.requireHardwareClock && f.clockDomain !== 'DEVICE_HARDWARE') return bad('hardwareClock');
    if (r.planar !== undefined && f.planar !== r.planar) return bad('planar');
    return true;
  });
  if (!c.length)
    return freeze({
      ok: false,
      explanation: ['No audio format satisfies required constraints'],
      fallbackDetails: [],
      rejectedCandidateReasons: rej,
      estimatedBytesPerSecond: 0,
      estimatedBufferCadenceNs: '0',
      expectedLatencyRangeNs: ['0', '0'],
    });
  const lscore = (l: SourceLatencyClass) =>
    ({ REALTIME: 0, LOW: 1, STANDARD: 2, BUFFERED: 3, UNKNOWN: 4 })[l];
  const scored = c
    .map((f) => ({
      f,
      s:
        (r.exactSampleRate && f.sampleRate === r.exactSampleRate ? 10000 : 0) +
        (r.preferredSampleRate && f.sampleRate === r.preferredSampleRate ? 1000 : 0) +
        (r.preferredChannelLayout && f.channelLayout === r.preferredChannelLayout ? 500 : 0) +
        (r.preferredSampleFormat && f.sampleFormat === r.preferredSampleFormat ? 250 : 0) +
        (r.preferredFramesPerBuffer && f.framesPerBuffer === r.preferredFramesPerBuffer ? 125 : 0) +
        (r.requireHardwareClock && f.clockDomain === 'DEVICE_HARDWARE' ? 60 : 0) +
        (r.latencyPreference && f.latencyHint === r.latencyPreference ? 30 : 0),
    }))
    .sort(
      (a, b) =>
        b.s - a.s ||
        lscore(a.f.latencyHint) - lscore(b.f.latencyHint) ||
        a.f.sampleRate * a.f.channelCount - b.f.sampleRate * b.f.channelCount ||
        a.f.id.localeCompare(b.f.id),
    );
  const f = scored[0]!.f;
  const bytes = f.sampleRate * f.channelCount * Math.max(1, f.bitDepth / 8);
  const cadence = (BigInt(f.framesPerBuffer) * 1_000_000_000n) / BigInt(f.sampleRate);
  return freeze({
    ok: true,
    selectedFormat: f,
    explanation: [`Selected ${f.id} deterministically from ${c.length} audio candidates`],
    fallbackDetails: scored[0]!.s ? [] : [`No preference matched; canonical fallback ${f.id}`],
    rejectedCandidateReasons: rej,
    estimatedBytesPerSecond: bytes,
    estimatedBufferCadenceNs: cadence.toString(),
    expectedLatencyRangeNs: [cadence.toString(), (cadence * 3n).toString()],
  });
}
export class DefaultAudioDeviceSource implements AudioDeviceSource {
  readonly descriptor: AudioSourceDescriptor;
  private lifecycle = 'REGISTERED';
  private selected?: SourceAudioFormat;
  private group: AudioChannelGroup;
  private openState = false;
  private capturing = false;
  private generation = 0;
  private queue: AudioQueue;
  private norm = new DeterministicSourceTimestampNormalizer();
  private published = new Set<string>();
  private released = new Set<string>();
  private lastSeq?: bigint;
  private expectedSample?: bigint;
  private health: AudioSourceHealthSnapshot;
  private loopback = false;
  constructor(
    descriptor: AudioSourceDescriptor,
    private backend: AudioCaptureBackend,
    private nowNs: () => bigint = () => BigInt(Date.now()) * 1_000_000n,
    q: AudioQueueConfiguration = defaultQueue,
  ) {
    this.descriptor = freeze(clone(descriptor));
    this.group =
      descriptor.audio.channelGroups.find((g) => g.default) ?? descriptor.audio.channelGroups[0]!;
    this.queue = new AudioQueue(q, (e) => this.release(e));
    this.health = this.mkHealth('UNKNOWN');
  }
  private ok(state = this.lifecycle): AudioOperationResult {
    return { ok: true, sourceId: this.descriptor.id, state: state as never };
  }
  async initialize() {
    this.lifecycle = 'READY';
    return this.ok('READY');
  }
  async connect() {
    return this.open({ format: this.descriptor.audio.defaultFormat }, { nowNs: this.nowNs });
  }
  async activate(c: SourceRuntimeContext) {
    return this.startCapture(c);
  }
  async deactivate(c: SourceRuntimeContext) {
    return this.stopCapture(c);
  }
  async disconnect(c: SourceRuntimeContext) {
    return this.close(c);
  }
  async shutdown(c: SourceRuntimeContext) {
    await this.close(c);
    this.lifecycle = 'STOPPED';
    return this.ok('STOPPED');
  }
  async open(req: AudioOpenRequest, context: SourceRuntimeContext) {
    if (this.openState) throw new AudioAlreadyOpen(this.descriptor.id);
    if (['DENIED', 'RESTRICTED', 'UNAVAILABLE'].includes(this.descriptor.permissionState))
      throw new AudioPermissionDenied(this.descriptor.id);
    if (req.loopback && !this.descriptor.audio.loopbackCapable)
      throw new AudioLoopbackUnsupported(this.descriptor.id);
    const fmt =
      req.format ??
      negotiateAudioFormat(this.descriptor.audio.supportedFormats, {
        preferredSampleRate: this.descriptor.audio.defaultFormat.sampleRate,
      }).selectedFormat;
    if (!fmt || !this.descriptor.audio.supportedFormats.some((f) => f.id === fmt.id))
      throw new AudioFormatUnsupported(fmt?.id ?? 'missing');
    if (req.channelGroupId) {
      const g = this.descriptor.audio.channelGroups.find((x) => x.id === req.channelGroupId);
      if (!g) throw new AudioChannelGroupNotFound(req.channelGroupId);
      this.group = g;
    }
    this.lifecycle = 'CONNECTING';
    this.generation++;
    const r = await this.backend.open(
      {
        descriptor: this.descriptor,
        format: fmt,
        accessMode: req.accessMode ?? 'SHARED',
        channelGroup: this.group,
        loopback: Boolean(req.loopback),
        generation: this.generation,
      },
      { nowNs: context.nowNs },
    );
    this.openState = r.ok;
    this.selected = r.selectedFormat;
    this.loopback = Boolean(req.loopback);
    this.lifecycle = 'CONNECTED';
    this.health = this.mkHealth('HEALTHY');
    return this.ok('CONNECTED');
  }
  async startCapture(context: SourceRuntimeContext) {
    if (!this.openState) throw new AudioNotOpen(this.descriptor.id);
    if (this.capturing) throw new AudioAlreadyCapturing(this.descriptor.id);
    const gen = this.generation;
    this.lifecycle = 'ACTIVATING';
    await this.backend.start(
      (b) => this.onBuffer(b, gen, context.frameTick),
      () => {},
      (e) => {
        this.health = {
          ...this.health,
          backendErrors: this.health.backendErrors + 1,
          lastError: String(redact(e)),
          healthState: 'FAILED',
          updatedAtNs: this.nowNs().toString(),
        };
      },
      { nowNs: context.nowNs },
    );
    this.capturing = true;
    this.lifecycle = 'ACTIVE';
    this.health = this.mkHealth('HEALTHY');
    return this.ok('ACTIVE');
  }
  async stopCapture(context: SourceRuntimeContext) {
    if (!this.capturing) return this.ok(this.lifecycle);
    this.lifecycle = 'DEACTIVATING';
    this.capturing = false;
    this.generation++;
    await this.backend.stop({ nowNs: context.nowNs });
    this.queue.clear();
    this.lifecycle = 'CONNECTED';
    this.health = this.mkHealth('STOPPED');
    return this.ok('CONNECTED');
  }
  async close(context: SourceRuntimeContext) {
    if (this.capturing) await this.stopCapture(context);
    if (!this.openState) {
      this.queue.clear();
      return this.ok(this.lifecycle);
    }
    this.lifecycle = 'DISCONNECTING';
    this.openState = false;
    this.generation++;
    await this.backend.close({ nowNs: context.nowNs });
    this.queue.clear();
    this.lifecycle = 'DISCONNECTED';
    this.health = this.mkHealth('STOPPED');
    return this.ok('DISCONNECTED');
  }
  async setDeviceControl(req: AudioDeviceControlRequest, context: SourceRuntimeContext) {
    const cap = this.descriptor.audio.controls.find((c) => c.controlId === req.controlId);
    if (!cap) throw new AudioControlUnsupported(req.controlId);
    if (cap.dangerous && !req.confirmedDangerous)
      throw ae('AudioControlFailed', 'Dangerous audio control requires confirmation', {
        controlId: req.controlId,
      });
    if (
      typeof req.value === 'number' &&
      ((cap.min !== undefined && req.value < cap.min) ||
        (cap.max !== undefined && req.value > cap.max))
    )
      throw new AudioControlOutOfRange(req.controlId);
    return this.backend.setControl
      ? this.backend.setControl(req, { nowNs: context.nowNs })
      : { ok: true, control: freeze({ ...cap, currentValue: req.value }) };
  }
  async pull(
    req: { scheduledTimeNs: bigint; frameNumber: bigint },
    _c: SourceRuntimeContext,
  ): Promise<SourceSampleBatch> {
    if (!this.capturing || !this.openState) {
      this.health = {
        ...this.health,
        underflows: this.health.underflows + 1,
        updatedAtNs: this.nowNs().toString(),
      };
      return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    }
    const end = req.scheduledTimeNs + 33_333_333n;
    const audioBuffers = this.queue.select(req.scheduledTimeNs, end, this.published);
    if (!audioBuffers.length)
      this.health = {
        ...this.health,
        underflows: this.health.underflows + 1,
        healthState: this.health.underflows > 3 ? 'DEGRADED' : this.health.healthState,
        updatedAtNs: this.nowNs().toString(),
      };
    else
      this.health = {
        ...this.health,
        lastBufferSequence: audioBuffers.at(-1)!.sequenceNumber.toString(),
        lastNormalizedTimestampNs: audioBuffers.at(-1)!.normalizedTimestampNs.toString(),
        lastSamplePosition: String(audioBuffers.at(-1)!.metadata.endSamplePosition ?? ''),
        updatedAtNs: this.nowNs().toString(),
      };
    return freeze({ videoFrames: [], audioBuffers, metadataSamples: [] });
  }
  private onBuffer(b: AudioBackendBuffer, gen: number, tick?: FrameTick) {
    if (gen !== this.generation || !this.capturing || !this.openState) {
      b.payload.release();
      return;
    }
    const f = this.selected ?? this.descriptor.audio.defaultFormat;
    const sourceTs = b.timestampNs ?? this.nowNs();
    const n = this.norm.normalize(
      {
        sourceId: this.descriptor.id,
        clockDomain: f.clockDomain,
        timestampNs: sourceTs,
        sequenceNumber: b.sequenceNumber,
        ...(b.discontinuity !== undefined ? { discontinuity: b.discontinuity } : {}),
      },
      tick,
    );
    let discontinuity = Boolean(b.discontinuity || n.movedBackward || n.sequenceGap);
    if (this.lastSeq !== undefined && b.sequenceNumber !== this.lastSeq + 1n) {
      this.health = { ...this.health, sequenceGaps: this.health.sequenceGaps + 1 };
      discontinuity = true;
    }
    if (this.expectedSample !== undefined) {
      if (b.startSamplePosition > this.expectedSample)
        this.health = { ...this.health, sampleGaps: this.health.sampleGaps + 1 };
      if (b.startSamplePosition < this.expectedSample)
        this.health = { ...this.health, overlaps: this.health.overlaps + 1 };
    }
    this.lastSeq = b.sequenceNumber;
    this.expectedSample = b.startSamplePosition + BigInt(b.sampleCount);
    const env = freeze({
      sourceId: this.descriptor.id,
      streamId: `audio:${this.group.id}`,
      sequenceNumber: b.sequenceNumber,
      sourceTimestampNs: sourceTs,
      normalizedTimestampNs: n.normalizedTimestampNs,
      presentationTimestampNs: n.normalizedTimestampNs,
      durationNs: (BigInt(b.sampleCount) * 1_000_000_000n) / BigInt(f.sampleRate),
      sampleCount: b.sampleCount,
      startSamplePosition: b.startSamplePosition,
      endSamplePosition: b.startSamplePosition + BigInt(b.sampleCount),
      format: f,
      clockDomain: f.clockDomain,
      hardwareTimestamp: Boolean(b.hardwareTimestamp),
      discontinuity,
      corrupted: Boolean(b.corrupted),
      droppedBefore: 0,
      captureReceivedAtNs: this.nowNs(),
      backendId: this.backend.backendId,
      payload: {
        handleId: b.payload.handleId,
        kind: 'OPAQUE_TEST_HANDLE' as const,
        byteLength: b.payload.byteLength,
        release: 'SOURCE' as const,
      },
      ownership: 'OWNED_BY_SOURCE' as const,
      metadata: freeze(redact(b.metadata ?? {}) as Record<string, unknown>),
    } as AudioBufferEnvelope & Record<string, unknown>);
    if (!this.queue.enqueue(env as AudioBufferEnvelope)) b.payload.release();
    this.health = {
      ...this.health,
      queueDepth: this.queue.snapshot().queueDepth,
      bufferedSamples: this.queue.snapshot().bufferedSamples,
      bufferedDurationNs: this.queue.snapshot().bufferedDurationNs,
      droppedBuffers: this.queue.snapshot().droppedOldest + this.queue.snapshot().droppedNewest,
      overflows:
        this.queue.snapshot().droppedOldest +
        this.queue.snapshot().droppedNewest +
        this.queue.snapshot().rejected,
      discontinuities: this.queue.snapshot().discontinuityCount,
      corruptedBuffers: this.health.corruptedBuffers + (b.corrupted ? 1 : 0),
      updatedAtNs: this.nowNs().toString(),
    };
  }
  private release(e: AudioBufferEnvelope) {
    const id = e.payload.handleId;
    if (this.released.has(id)) throw new AudioOwnershipViolation(id);
    this.released.add(id);
  }
  private mkHealth(state: SourceHealthState): AudioSourceHealthSnapshot {
    const q = this.queue.snapshot();
    return freeze({
      sourceId: this.descriptor.id,
      deviceId: this.descriptor.deviceIdentity.deviceId,
      lifecycleState: this.lifecycle,
      healthState: state,
      connected: this.openState,
      active: this.capturing,
      available: this.descriptor.availability === 'AVAILABLE',
      permissionState: this.descriptor.permissionState,
      ...(this.selected ? { selectedFormat: this.selected } : {}),
      selectedChannelGroup: this.group,
      loopbackEnabled: this.loopback,
      backendId: this.backend.backendId,
      clockDomain: (this.selected ?? this.descriptor.audio.defaultFormat).clockDomain,
      queueDepth: q.queueDepth,
      bufferedSamples: q.bufferedSamples,
      bufferedDurationNs: q.bufferedDurationNs,
      droppedBuffers: q.droppedOldest + q.droppedNewest,
      droppedSamples: 0,
      underflows: this.health?.underflows ?? 0,
      overflows: q.droppedOldest + q.droppedNewest + q.rejected,
      sequenceGaps: this.health?.sequenceGaps ?? 0,
      sampleGaps: this.health?.sampleGaps ?? 0,
      overlaps: this.health?.overlaps ?? 0,
      samplePositionRegressions: 0,
      timestampRegressions: 0,
      discontinuities: q.discontinuityCount,
      corruptedBuffers: this.health?.corruptedBuffers ?? 0,
      backendErrors: this.health?.backendErrors ?? 0,
      reconnectAttempts: 0,
      updatedAtNs: this.nowNs().toString(),
    });
  }
  getAudioSnapshot(): Readonly<AudioSourceSnapshot> {
    return freeze({
      descriptor: this.descriptor,
      lifecycleState: this.lifecycle,
      health: this.health,
      queue: this.queue.snapshot(),
      clock: this.norm.getSnapshot(),
      backend: (
        this.backend as unknown as { getHealth?: () => AudioBackendHealthSnapshot }
      ).getHealth?.() ?? {
        backendId: this.backend.backendId,
        open: this.openState,
        capturing: this.capturing,
        callbacksActive: 0,
        handlesCreated: 0,
        handlesReleased: this.released.size,
        lateCallbacks: 0,
        failures: 0,
        updatedAtNs: this.nowNs().toString(),
      },
      controls: this.descriptor.audio.controls,
      generatedAtNs: this.nowNs().toString(),
    });
  }
  assertInvariants() {
    const q = this.queue.snapshot();
    if (q.queueDepth > defaultQueue.maximumBuffers)
      throw ae('AudioInvariantViolation', 'Queue exceeds maximum buffers');
    if (this.capturing && !this.openState)
      throw ae('AudioInvariantViolation', 'Capturing source must be open');
    if (
      !this.descriptor.audio.supportedFormats.some(
        (f) => f.id === (this.selected ?? this.descriptor.audio.defaultFormat).id,
      )
    )
      throw ae('AudioInvariantViolation', 'Selected format unsupported');
  }
}
export class SyntheticAudioBackend implements AudioCaptureBackend {
  readonly backendId: string;
  private openState = false;
  private capturing = false;
  private cb: AudioBufferCallback | undefined;
  private seq = 0n;
  private pos = 0n;
  private created = 0;
  private released = 0;
  private failures = 0;
  constructor(
    readonly id = 'synthetic-audio-backend',
    private nowNs: () => bigint = () => BigInt(Date.now()) * 1_000_000n,
  ) {
    this.backendId = id;
  }
  async open(req: AudioBackendOpenRequest, _context?: AudioBackendContext) {
    this.openState = true;
    this.seq = 0n;
    this.pos = 0n;
    return freeze({
      ok: true,
      backendId: this.backendId,
      selectedFormat: req.format,
      estimatedLatencyNs: ['1000000', '10000000'] as readonly [string, string],
    });
  }
  async start(
    cb: AudioBufferCallback,
    _onStateChanged?: AudioBackendStateCallback,
    _onError?: AudioBackendErrorCallback,
    _context?: AudioBackendContext,
  ) {
    if (!this.openState) {
      this.failures++;
      throw ae('AudioStartFailed', 'Synthetic backend not open');
    }
    this.cb = cb;
    this.capturing = true;
  }
  async stop(_context?: AudioBackendContext) {
    this.capturing = false;
    this.cb = undefined;
  }
  async close(_context?: AudioBackendContext) {
    this.openState = false;
    this.capturing = false;
    this.cb = undefined;
  }
  emit(count = 1, sampleCount = 480) {
    for (let i = 0; i < count; i++) {
      if (!this.capturing || !this.cb) return;
      const handle = `${this.backendId}:buffer:${this.seq}`;
      let released = false;
      this.created++;
      this.cb({
        sequenceNumber: this.seq,
        timestampNs: this.nowNs() + this.seq * 10_000_000n,
        sampleCount,
        startSamplePosition: this.pos,
        hardwareTimestamp: true,
        payload: {
          handleId: handle,
          ownership: 'OWNED_BY_BACKEND',
          release: () => {
            if (released) throw new AudioOwnershipViolation(handle);
            released = true;
            this.released++;
          },
        },
      });
      this.seq++;
      this.pos += BigInt(sampleCount);
    }
  }
  getHealth(): AudioBackendHealthSnapshot {
    return freeze({
      backendId: this.backendId,
      open: this.openState,
      capturing: this.capturing,
      callbacksActive: this.cb ? 1 : 0,
      handlesCreated: this.created,
      handlesReleased: this.released,
      lateCallbacks: 0,
      failures: this.failures,
      updatedAtNs: this.nowNs().toString(),
    });
  }
}
export const createAudioSourceDescriptor = (
  p: Partial<AudioSourceDescriptor> & {
    id: string;
    providerId: string;
    deviceId?: string;
    displayName: string;
    audioCategory?: AudioSourceCategory;
    formats?: readonly SourceAudioFormat[];
    permissionState?: SourcePermissionState;
    channelGroups?: readonly AudioChannelGroup[];
  },
): AudioSourceDescriptor => {
  const formats = p.formats ?? [
    createSourceAudioFormat({
      id: `${p.id}:48k`,
      sampleRate: 48000,
      channelCount: 2,
      channelLayout: 'STEREO',
      sampleFormat: 'F32',
      clockDomain: 'DEVICE_HARDWARE',
      framesPerBuffer: 480,
    }),
  ];
  const groups = p.channelGroups ?? [
    freeze({
      id: 'stereo-1',
      label: 'Stereo 1',
      channels: [0, 1],
      layout: 'STEREO',
      default: true,
      metadata: {},
    }),
  ];
  return freeze({
    id: p.id,
    providerId: p.providerId,
    type:
      p.audioCategory === 'DESKTOP_AUDIO' || p.audioCategory === 'SYSTEM_LOOPBACK'
        ? 'DESKTOP_AUDIO'
        : 'AUDIO_DEVICE',
    displayName: p.displayName,
    description: 'Production-safe audio device source descriptor',
    mediaKinds: ['AUDIO'],
    capabilities: { audioDevice: true, category: p.audioCategory ?? 'SYNTHETIC_AUDIO' },
    defaultFormat: formats[0],
    supportedFormats: formats,
    availability: p.availability ?? 'AVAILABLE',
    persistent: true,
    reconnectable: true,
    discoverable: true,
    virtual:
      p.virtual ??
      (p.audioCategory === 'SYNTHETIC_AUDIO' || p.audioCategory === 'VIRTUAL_AUDIO_INPUT'),
    requiresPermission: (p.permissionState ?? 'GRANTED') !== 'NOT_REQUIRED',
    permissionState: p.permissionState ?? 'GRANTED',
    supportsVideo: false,
    supportsAudio: true,
    supportsMetadata: true,
    supportsSeeking: false,
    supportsLooping: false,
    supportsDynamicFormatChange: false,
    estimatedLatencyClass: 'LOW',
    clockDomain: formats[0]!.clockDomain,
    acquisitionMode: 'PULL',
    tags: ['audio-device', 'ubos-v5.2.8'],
    metadata: freeze(
      redact(p.metadata ?? { persistentIdentity: `audio:${p.deviceId ?? p.id}` }) as Record<
        string,
        unknown
      >,
    ),
    audioCategory: p.audioCategory ?? 'SYNTHETIC_AUDIO',
    deviceIdentity: {
      deviceId: p.deviceId ?? p.id,
      providerId: p.providerId,
      persistentIdentity: `audio:${hash(p.deviceId ?? p.id)}`,
    },
    audio: {
      supportedFormats: formats,
      defaultFormat: formats[0]!,
      channelGroups: groups,
      clockDomain: formats[0]!.clockDomain,
      hardwareClock: formats.some((f) => f.clockDomain === 'DEVICE_HARDWARE'),
      loopbackCapable: p.audioCategory === 'DESKTOP_AUDIO' || p.audioCategory === 'SYSTEM_LOOPBACK',
      accessModes: ['SHARED', 'EXCLUSIVE'],
      reconnectable: true,
      hotPlug: true,
      latencyClass: 'LOW',
      controls: p.audio?.controls ?? [],
      virtual: p.virtual ?? false,
    },
  } as AudioSourceDescriptor);
};
export function mapDeviceToAudioSourceDescriptors(
  device: Pick<
    DeviceDescriptor,
    'id' | 'providerId' | 'type' | 'displayName' | 'permissionState' | 'virtual' | 'available'
  >,
): readonly AudioSourceDescriptor[] {
  const eligible: DeviceDiscoveryType[] = [
    'AUDIO_INPUT',
    'AUDIO_OUTPUT',
    'CAPTURE_CARD',
    'VIRTUAL_AUDIO',
    'SYNTHETIC',
  ];
  if (!eligible.includes(device.type)) return freeze([]);
  const cat: AudioSourceCategory =
    device.type === 'AUDIO_OUTPUT'
      ? 'SYSTEM_LOOPBACK'
      : device.type === 'CAPTURE_CARD'
        ? 'CAPTURE_CARD_AUDIO'
        : device.type === 'VIRTUAL_AUDIO'
          ? 'VIRTUAL_AUDIO_INPUT'
          : device.type === 'SYNTHETIC'
            ? 'SYNTHETIC_AUDIO'
            : 'MICROPHONE';
  return freeze([
    createAudioSourceDescriptor({
      id: `audio-source:${hash(`${device.providerId}:${device.id}:${cat}:main`)}`,
      providerId: device.providerId,
      deviceId: device.id,
      displayName: device.displayName,
      audioCategory: cat,
      permissionState: device.permissionState,
      availability: device.available ? 'AVAILABLE' : 'UNAVAILABLE',
      virtual: device.virtual,
    }),
  ]);
}
export class SyntheticAudioDeviceProvider implements AudioDeviceSourceProvider {
  readonly descriptor: SourceProviderDescriptor;
  private backend: SyntheticAudioBackend;
  constructor(
    private devices: readonly AudioSourceDescriptor[] = [
      createAudioSourceDescriptor({
        id: 'audio-source:synthetic-mic',
        providerId: 'synthetic-audio-provider',
        deviceId: 'synthetic-mic',
        displayName: 'Synthetic Stereo Microphone',
        audioCategory: 'SYNTHETIC_AUDIO',
        permissionState: 'GRANTED',
      }),
    ],
    id = 'synthetic-audio-provider',
  ) {
    this.descriptor = freeze({
      id,
      displayName: 'Synthetic Audio Device Provider',
      version: '5.2.8',
      sourceTypes: ['AUDIO_DEVICE', 'DESKTOP_AUDIO', 'SYNTHETIC'],
      acquisitionModes: ['PULL'],
    });
    this.backend = new SyntheticAudioBackend(`${id}:backend`);
  }
  async listAudioDevices(req: AudioDeviceDiscoveryRequest, ctx: AudioProviderContext) {
    const start = ctx.nowNs();
    const descriptors = this.devices
      .filter((d) => !req.categories?.length || req.categories.includes(d.audioCategory))
      .sort((a, b) => a.id.localeCompare(b.id));
    return freeze({ descriptors, warnings: [], durationNs: (ctx.nowNs() - start).toString() });
  }
  async discover(request: never, context: SourceProviderContext) {
    const r = await this.listAudioDevices({}, context);
    return freeze({
      descriptors: r.descriptors,
      unavailable: r.descriptors.filter((d) => d.availability !== 'AVAILABLE'),
      warnings: r.warnings,
      providerErrors: [],
      durationNs: r.durationNs,
      partial: false,
    });
  }
  async createAudioSource(d: AudioSourceDescriptor, context: AudioProviderContext) {
    return new DefaultAudioDeviceSource(d, this.backend, context.nowNs);
  }
  async createSource(d: SourceDescriptor, context: SourceProviderContext) {
    return this.createAudioSource(d as AudioSourceDescriptor, context);
  }
  getBackendHealth() {
    return this.backend.getHealth();
  }
  getSyntheticBackend() {
    return this.backend;
  }
  async shutdown(context: SourceProviderContext) {
    await this.backend.close({ nowNs: context.nowNs });
  }
}
export function createAudioDeviceSource(
  descriptor: AudioSourceDescriptor,
  backend: AudioCaptureBackend,
  nowNs?: () => bigint,
) {
  return new DefaultAudioDeviceSource(descriptor, backend, nowNs);
}
export function createAudioTelemetrySnapshot(sources: readonly AudioSourceSnapshot[]) {
  const h = sources.map((s) => s.health);
  return freeze({
    registeredAudioSourceCount: sources.length,
    openAudioSourceCount: h.filter((x) => x.connected).length,
    activeAudioSourceCount: h.filter((x) => x.active).length,
    microphoneSourceCount: sources.filter((s) => s.descriptor.audioCategory === 'MICROPHONE')
      .length,
    interfaceSourceCount: sources.filter(
      (s) => s.descriptor.audioCategory === 'AUDIO_INTERFACE_INPUT',
    ).length,
    desktopAudioSourceCount: sources.filter((s) => s.descriptor.audioCategory === 'DESKTOP_AUDIO')
      .length,
    loopbackSourceCount: h.filter((x) => x.loopbackEnabled).length,
    degradedAudioSourceCount: h.filter((x) => x.healthState === 'DEGRADED').length,
    unavailableAudioSourceCount: h.filter((x) => x.healthState === 'UNAVAILABLE').length,
    failedAudioSourceCount: h.filter((x) => x.healthState === 'FAILED').length,
    totalAudioBuffersReceived: h.reduce((n, x) => n + Number(x.lastBufferSequence ?? 0), 0),
    totalAudioBuffersPublished: 0,
    totalAudioBuffersDropped: h.reduce((n, x) => n + x.droppedBuffers, 0),
    totalAudioSamplesReceived: h.reduce((n, x) => n + x.bufferedSamples, 0),
    totalAudioSamplesPublished: 0,
    totalAudioSamplesDropped: h.reduce((n, x) => n + x.droppedSamples, 0),
    totalAudioUnderflows: h.reduce((n, x) => n + x.underflows, 0),
    totalAudioOverflows: h.reduce((n, x) => n + x.overflows, 0),
    totalAudioSequenceGaps: h.reduce((n, x) => n + x.sequenceGaps, 0),
    totalAudioSampleGaps: h.reduce((n, x) => n + x.sampleGaps, 0),
    totalAudioOverlaps: h.reduce((n, x) => n + x.overlaps, 0),
    totalAudioSampleRegressions: h.reduce((n, x) => n + x.samplePositionRegressions, 0),
    totalAudioTimestampRegressions: h.reduce((n, x) => n + x.timestampRegressions, 0),
    totalAudioDiscontinuities: h.reduce((n, x) => n + x.discontinuities, 0),
    totalAudioQueuePressureEvents: sources.reduce((n, s) => n + s.queue.highWaterEvents, 0),
    totalAudioOpenFailures: 0,
    totalAudioCaptureFailures: 0,
    totalAudioReconnectAttempts: h.reduce((n, x) => n + x.reconnectAttempts, 0),
    successfulAudioReconnects: 0,
    failedAudioReconnects: 0,
    averageAudioLatencyNs: '0',
    maximumAudioLatencyNs: '0',
    averageAudioJitterNs: '0',
    maximumAudioQueueDepth: sources.reduce((m, s) => Math.max(m, s.queue.queueDepth), 0),
    currentAudioSourceIds: sources.map((s) => s.descriptor.id).sort(),
    lastAudioEvent: 'AudioTelemetrySnapshot',
    audioHealthSummary: h.reduce(
      (r, x) => ({ ...r, [x.healthState]: (r[x.healthState] ?? 0) + 1 }),
      {} as Record<string, number>,
    ),
  });
}
