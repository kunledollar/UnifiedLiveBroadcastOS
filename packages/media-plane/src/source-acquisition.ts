import type { FrameTick, ProcessorRuntimeContext, TickProcessor } from './execution-engine.js';
import { RuntimeEngineError, frameDurationNs, type RationalFrameRate } from './execution-engine.js';
import type { DeviceMetadata } from './device-platform.js';

export type SourceType =
  | 'CAMERA'
  | 'CAPTURE_CARD'
  | 'SCREEN'
  | 'WINDOW'
  | 'FILE'
  | 'IMAGE'
  | 'BROWSER'
  | 'AUDIO_DEVICE'
  | 'DESKTOP_AUDIO'
  | 'NDI'
  | 'SRT'
  | 'RTMP'
  | 'WEBRTC'
  | 'REMOTE_GUEST'
  | 'SYNTHETIC'
  | 'TEST'
  | 'CUSTOM';
export type SourceMediaKind = 'VIDEO' | 'AUDIO' | 'DATA' | 'AUDIO_VIDEO';
export type SourceLifecycleState =
  | 'DISCOVERED'
  | 'REGISTERED'
  | 'INITIALIZING'
  | 'READY'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'DEGRADED'
  | 'RECONNECTING'
  | 'DEACTIVATING'
  | 'DISCONNECTING'
  | 'DISCONNECTED'
  | 'UNAVAILABLE'
  | 'FAILED'
  | 'STOPPING'
  | 'STOPPED'
  | 'REMOVED';
export type SourceAcquisitionMode = 'PUSH' | 'PULL' | 'HYBRID';
export type SourceClockDomain =
  | 'RUNTIME_MASTER'
  | 'DEVICE_HARDWARE'
  | 'SYSTEM_MONOTONIC'
  | 'FILE_TIMELINE'
  | 'NETWORK_SENDER'
  | 'EXTERNAL_TIMECODE'
  | 'UNKNOWN';
export type SourcePermissionState =
  | 'UNKNOWN'
  | 'NOT_REQUIRED'
  | 'PROMPT_REQUIRED'
  | 'GRANTED'
  | 'DENIED'
  | 'RESTRICTED'
  | 'UNAVAILABLE';
export type SourceHealthState =
  | 'UNKNOWN'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNHEALTHY'
  | 'RECONNECTING'
  | 'UNAVAILABLE'
  | 'FAILED'
  | 'DISABLED'
  | 'STOPPED';
export type SourceLatencyClass = 'REALTIME' | 'LOW' | 'STANDARD' | 'BUFFERED' | 'UNKNOWN';
export type SourceOverflowPolicy =
  'DROP_OLDEST' | 'DROP_NEWEST' | 'REJECT' | 'FAIL_SOURCE' | 'KEEP_LATEST_VIDEO';
export type SourceUnderflowPolicy =
  'RETURN_EMPTY' | 'REPEAT_LAST_VIDEO_REFERENCE' | 'SIGNAL_GAP' | 'DEGRADE_SOURCE';
export type SourceCommandType =
  | 'SOURCE_REGISTER'
  | 'SOURCE_REMOVE'
  | 'SOURCE_CONNECT'
  | 'SOURCE_DISCONNECT'
  | 'SOURCE_ACTIVATE'
  | 'SOURCE_DEACTIVATE'
  | 'SOURCE_SET_FORMAT'
  | 'SOURCE_RECONNECT'
  | 'SOURCE_RESET'
  | 'SOURCE_ENABLE'
  | 'SOURCE_DISABLE';
export const SOURCE_OUTPUT_KEYS = Object.freeze({
  videoFrames: 'source.videoFrames',
  audioBuffers: 'source.audioBuffers',
  metadataSamples: 'source.metadataSamples',
  health: 'source.health',
  statistics: 'source.statistics',
});
export const SOURCE_WATCHDOG_INCIDENTS = Object.freeze([
  'SOURCE_STALLED',
  'SOURCE_UNAVAILABLE',
  'SOURCE_TIMESTAMP_UNSTABLE',
  'SOURCE_BUFFER_PRESSURE',
  'SOURCE_RECONNECT_EXHAUSTED',
  'SOURCE_PROCESSOR_FAILED',
  'SOURCE_INVARIANT_FAILURE',
] as const);

export class SourceAcquisitionError extends RuntimeEngineError {}
const sourceError = (code: string, msg: string, details: Record<string, unknown> = {}) =>
  new SourceAcquisitionError(code, msg, details);
export class DuplicateSourceError extends SourceAcquisitionError {
  constructor(id: string) {
    super('DuplicateSource', `Duplicate source ${id}`, { id });
  }
}
export class SourceNotFoundError extends SourceAcquisitionError {
  constructor(id: string) {
    super('SourceNotFound', `Source ${id} was not found`, { id });
  }
}
export class DuplicateSourceProviderError extends SourceAcquisitionError {
  constructor(id: string) {
    super('DuplicateSourceProvider', `Duplicate source provider ${id}`, { id });
  }
}
export class SourceProviderNotFoundError extends SourceAcquisitionError {
  constructor(id: string) {
    super('SourceProviderNotFound', `Source provider ${id} was not found`, { id });
  }
}
export class InvalidSourceLifecycleTransitionError extends SourceAcquisitionError {
  constructor(from: SourceLifecycleState, to: SourceLifecycleState) {
    super(
      'InvalidSourceLifecycleTransition',
      `Invalid source lifecycle transition ${from} -> ${to}`,
      { from, to },
    );
  }
}

export interface SourceIdentity {
  readonly sourceId: string;
  readonly providerId: string;
  readonly deviceId?: string;
  readonly sourceType: SourceType;
  readonly displayName: string;
  readonly persistentIdentity: string;
  readonly sessionIdentity: string;
  readonly hardwareIdentity?: string;
  readonly logicalRole?: string;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}
export interface SourceVideoFormat {
  readonly kind: 'VIDEO';
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly frameRate: RationalFrameRate;
  readonly pixelFormat: string;
  readonly colorSpace: string;
  readonly colorRange: string;
  readonly transferCharacteristic: string;
  readonly chromaSubsampling: string;
  readonly scan: 'PROGRESSIVE' | 'INTERLACED';
  readonly fieldOrder: 'NONE' | 'TFF' | 'BFF';
  readonly aspectRatio: string;
  readonly alpha: boolean;
  readonly bitDepth: number;
  readonly rotation: number;
  readonly memoryDomain: 'OPAQUE' | 'CPU' | 'GPU' | 'DMA' | 'HARDWARE';
  readonly hardwareAcceleration: 'NONE' | 'PREFERRED' | 'REQUIRED';
  readonly latencyClass: SourceLatencyClass;
}
export interface SourceAudioFormat {
  readonly kind: 'AUDIO';
  readonly id: string;
  readonly sampleRate: number;
  readonly channelCount: number;
  readonly channelLayout: string;
  readonly sampleFormat: string;
  readonly planar: boolean;
  readonly bitDepth: number;
  readonly clockDomain: SourceClockDomain;
  readonly framesPerBuffer: number;
  readonly latencyHint: SourceLatencyClass;
}
export interface SourceDataFormat {
  readonly kind: 'DATA';
  readonly id: string;
  readonly contentType: string;
  readonly schemaIdentifier?: string;
  readonly encoding: string;
  readonly timebase: RationalFrameRate;
}
export type SourceMediaFormat = SourceVideoFormat | SourceAudioFormat | SourceDataFormat;
export interface SourceDescriptor {
  readonly id: string;
  readonly providerId: string;
  readonly type: SourceType;
  readonly displayName: string;
  readonly description?: string;
  readonly mediaKinds: readonly SourceMediaKind[];
  readonly capabilities: Readonly<Record<string, unknown>>;
  readonly defaultFormat?: SourceMediaFormat;
  readonly supportedFormats: readonly SourceMediaFormat[];
  readonly availability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
  readonly persistent: boolean;
  readonly reconnectable: boolean;
  readonly discoverable: boolean;
  readonly virtual: boolean;
  readonly requiresPermission: boolean;
  readonly permissionState: SourcePermissionState;
  readonly supportsVideo: boolean;
  readonly supportsAudio: boolean;
  readonly supportsMetadata: boolean;
  readonly supportsSeeking: boolean;
  readonly supportsLooping: boolean;
  readonly supportsDynamicFormatChange: boolean;
  readonly estimatedLatencyClass: SourceLatencyClass;
  readonly clockDomain: SourceClockDomain;
  readonly acquisitionMode: SourceAcquisitionMode;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface SourceFormatRequest {
  readonly mediaKind?: SourceMediaKind;
  readonly preferredFormats?: readonly Partial<SourceMediaFormat>[];
  readonly requiredConstraints?: Readonly<Record<string, unknown>>;
  readonly optionalConstraints?: Readonly<Record<string, unknown>>;
  readonly maximumResolution?: { readonly width: number; readonly height: number };
  readonly minimumResolution?: { readonly width: number; readonly height: number };
  readonly preferredFrameRate?: RationalFrameRate;
  readonly maximumFrameRate?: RationalFrameRate;
  readonly preferredPixelFormat?: string;
  readonly preferredSampleRate?: number;
  readonly preferredChannelLayout?: string;
  readonly hardwarePreference?: 'NONE' | 'PREFERRED' | 'REQUIRED';
  readonly latencyPreference?: SourceLatencyClass;
}
export interface SourceFormatNegotiationResult {
  readonly ok: boolean;
  readonly selectedFormat?: SourceMediaFormat;
  readonly explanation: readonly string[];
  readonly rejectedFormats: readonly { readonly formatId: string; readonly reason: string }[];
  readonly fallback: boolean;
}
export interface SourceOperationResult {
  readonly ok: boolean;
  readonly sourceId: string;
  readonly state: SourceLifecycleState;
  readonly error?: { readonly code: string; readonly message: string };
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface SourceProviderDescriptor {
  readonly id: string;
  readonly displayName: string;
  readonly version: string;
  readonly sourceTypes: readonly SourceType[];
  readonly acquisitionModes: readonly SourceAcquisitionMode[];
}
export interface SourceDiscoveryRequest {
  readonly providerId?: string;
  readonly mediaKinds?: readonly SourceMediaKind[];
  readonly sourceTypes?: readonly SourceType[];
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}
export interface SourceDiscoveryResult {
  readonly descriptors: readonly SourceDescriptor[];
  readonly unavailable: readonly SourceDescriptor[];
  readonly warnings: readonly string[];
  readonly providerErrors: readonly { readonly providerId: string; readonly error: string }[];
  readonly durationNs: string;
  readonly partial: boolean;
}
export interface SourceProviderContext {
  readonly nowNs: () => bigint;
}
export interface SourceProvider {
  readonly descriptor: SourceProviderDescriptor;
  discover(
    request: SourceDiscoveryRequest,
    context: SourceProviderContext,
  ): Promise<SourceDiscoveryResult>;
  createSource(descriptor: SourceDescriptor, context: SourceProviderContext): Promise<MediaSource>;
  shutdown(context: SourceProviderContext): Promise<void>;
}
export interface SourceRuntimeContext {
  readonly frameTick?: FrameTick;
  readonly nowNs: () => bigint;
}
export interface SourcePullRequest {
  readonly frameNumber: bigint;
  readonly scheduledTimeNs: bigint;
  readonly budgetNs?: bigint;
}
export interface MediaSource {
  readonly descriptor: SourceDescriptor;
  initialize(context: SourceRuntimeContext): Promise<SourceOperationResult>;
  connect(context: SourceRuntimeContext): Promise<SourceOperationResult>;
  activate(context: SourceRuntimeContext): Promise<SourceOperationResult>;
  pull?(request: SourcePullRequest, context: SourceRuntimeContext): Promise<SourceSampleBatch>;
  deactivate(context: SourceRuntimeContext): Promise<SourceOperationResult>;
  disconnect(context: SourceRuntimeContext): Promise<SourceOperationResult>;
  shutdown(context: SourceRuntimeContext): Promise<SourceOperationResult>;
}
export interface SourcePayloadRef {
  readonly handleId: string;
  readonly kind: 'OPAQUE_TEST_HANDLE' | 'EXTERNAL_HANDLE';
  readonly byteLength?: number;
  readonly release?: 'CONSUMER' | 'SOURCE' | 'RUNTIME';
}
export interface VideoFrameEnvelope {
  readonly sourceId: string;
  readonly streamId: string;
  readonly sequenceNumber: bigint;
  readonly sourceTimestampNs: bigint;
  readonly normalizedTimestampNs: bigint;
  readonly durationNs: bigint;
  readonly presentationTimestampNs: bigint;
  readonly decodeTimestampNs?: bigint;
  readonly frameNumberHint?: bigint;
  readonly format: SourceVideoFormat;
  readonly keyFrame: boolean;
  readonly discontinuity: boolean;
  readonly corrupted: boolean;
  readonly droppedBefore: number;
  readonly memoryDomain: SourceVideoFormat['memoryDomain'];
  readonly payload: SourcePayloadRef;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface AudioBufferEnvelope {
  readonly sourceId: string;
  readonly streamId: string;
  readonly sequenceNumber: bigint;
  readonly sourceTimestampNs: bigint;
  readonly normalizedTimestampNs: bigint;
  readonly durationNs: bigint;
  readonly sampleCount: number;
  readonly format: SourceAudioFormat;
  readonly discontinuity: boolean;
  readonly corrupted: boolean;
  readonly droppedBefore: number;
  readonly payload: SourcePayloadRef;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface MetadataSampleEnvelope {
  readonly sourceId: string;
  readonly streamId: string;
  readonly sequenceNumber: bigint;
  readonly sourceTimestampNs: bigint;
  readonly normalizedTimestampNs: bigint;
  readonly payload: Readonly<Record<string, unknown>>;
}
export interface SourceSampleBatch {
  readonly videoFrames: readonly VideoFrameEnvelope[];
  readonly audioBuffers: readonly AudioBufferEnvelope[];
  readonly metadataSamples: readonly MetadataSampleEnvelope[];
  readonly health?: Partial<SourceHealthSnapshot>;
  readonly statistics?: Partial<SourceStatisticsSnapshot>;
}
export interface SourceBufferConfiguration {
  readonly maximumVideoFrames: number;
  readonly maximumAudioBuffers: number;
  readonly maximumMetadataSamples: number;
  readonly highWaterMark: number;
  readonly lowWaterMark: number;
  readonly overflowPolicy: SourceOverflowPolicy;
  readonly underflowPolicy: SourceUnderflowPolicy;
}
export interface SourceHealthSnapshot {
  readonly sourceId: string;
  readonly lifecycleState: SourceLifecycleState;
  readonly healthState: SourceHealthState;
  readonly connected: boolean;
  readonly active: boolean;
  readonly available: boolean;
  readonly selectedFormat?: SourceMediaFormat;
  readonly lastSampleTimestampNs?: string;
  readonly lastNormalizedTimestampNs?: string;
  readonly lastSampleReceivedAtNs?: string;
  readonly lastHealthyAtNs?: string;
  readonly lastFailureAtNs?: string;
  readonly consecutiveFailures: number;
  readonly failuresInWindow: number;
  readonly reconnectAttempts: number;
  readonly droppedVideoFrames: number;
  readonly droppedAudioBuffers: number;
  readonly bufferOverflows: number;
  readonly bufferUnderflows: number;
  readonly timestampDiscontinuities: number;
  readonly timestampRegressions: number;
  readonly currentLatencyNs: string;
  readonly averageLatencyNs: string;
  readonly maximumLatencyNs: string;
  readonly currentJitterNs: string;
  readonly averageJitterNs: string;
  readonly lastError?: string;
  readonly updatedAtNs: string;
}
export interface SourceStatisticsSnapshot {
  readonly videoFramesReceived: number;
  readonly audioBuffersReceived: number;
  readonly metadataSamplesReceived: number;
  readonly videoFramesDropped: number;
  readonly audioBuffersDropped: number;
  readonly bufferOverflows: number;
  readonly bufferUnderflows: number;
  readonly timestampDiscontinuities: number;
  readonly timestampRegressions: number;
}
export interface SourceReconnectPolicy {
  readonly enabled: boolean;
  readonly maximumAttempts: number;
  readonly initialDelayMs: number;
  readonly backoffMultiplier: number;
  readonly maximumDelayMs: number;
  readonly resetAfterHealthyMs: number;
  readonly jitterPercent: number;
}
export interface SourceSnapshot {
  readonly descriptor: SourceDescriptor;
  readonly lifecycleState: SourceLifecycleState;
  readonly health: SourceHealthSnapshot;
  readonly connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
  readonly activationState: 'INACTIVE' | 'ACTIVATING' | 'ACTIVE';
  readonly selectedFormat?: SourceMediaFormat;
  readonly bufferingState: Readonly<Record<string, unknown>>;
  readonly timestampNormalizer: TimestampNormalizerSnapshot;
  readonly reconnect: Readonly<Record<string, unknown>>;
  readonly statistics: SourceStatisticsSnapshot;
  readonly lastOperation?: string;
  readonly lastError?: string;
  readonly generatedAtNs: string;
}
export interface SourceTelemetrySnapshot {
  readonly registeredSourceCount: number;
  readonly connectedSourceCount: number;
  readonly activeSourceCount: number;
  readonly degradedSourceCount: number;
  readonly unavailableSourceCount: number;
  readonly failedSourceCount: number;
  readonly reconnectingSourceCount: number;
  readonly totalVideoFramesReceived: number;
  readonly totalAudioBuffersReceived: number;
  readonly totalMetadataSamplesReceived: number;
  readonly totalVideoFramesDropped: number;
  readonly totalAudioBuffersDropped: number;
  readonly totalBufferOverflows: number;
  readonly totalBufferUnderflows: number;
  readonly totalTimestampDiscontinuities: number;
  readonly totalTimestampRegressions: number;
  readonly totalReconnectAttempts: number;
  readonly successfulReconnects: number;
  readonly failedReconnects: number;
  readonly sourceAcquisitionDurationNs: string;
  readonly averageSourceAcquisitionDurationNs: string;
  readonly maximumSourceAcquisitionDurationNs: string;
  readonly activeSourceIds: readonly string[];
  readonly lastSourceEvent?: string;
  readonly sourceHealthSummary: Readonly<Record<string, number>>;
}
export interface SourceAcquisitionSnapshot {
  readonly managerState: 'RUNNING' | 'SHUTTING_DOWN' | 'STOPPED';
  readonly providerCount: number;
  readonly sourceCount: number;
  readonly activeSourceIds: readonly string[];
  readonly orderedSourceIds: readonly string[];
  readonly lifecycleCounts: Readonly<Record<string, number>>;
  readonly healthCounts: Readonly<Record<string, number>>;
  readonly processorState: Readonly<Record<string, unknown>>;
  readonly totalBufferedSamples: number;
  readonly invariantStatus: 'OK' | 'FAILED';
  readonly telemetry: SourceTelemetrySnapshot;
  readonly generatedAtNs: string;
}
export interface SourceTimestamp {
  readonly sourceId: string;
  readonly clockDomain: SourceClockDomain;
  readonly timestampNs: bigint;
  readonly sequenceNumber: bigint;
  readonly discontinuity?: boolean;
}
export interface NormalizedSourceTimestamp extends SourceTimestamp {
  readonly normalizedTimestampNs: bigint;
  readonly movedBackward: boolean;
  readonly sequenceGap: boolean;
  readonly gapNs: bigint;
}
export type TimestampResetReason =
  'SOURCE_EPOCH' | 'SEEK' | 'RECONNECT' | 'DISCONTINUITY' | 'SHUTDOWN';
export interface TimestampNormalizerSnapshot {
  readonly established: boolean;
  readonly sourceEpochNs?: string;
  readonly runtimeEpochNs?: string;
  readonly lastSourceTimestampNs?: string;
  readonly lastNormalizedTimestampNs?: string;
  readonly lastSequenceNumber?: string;
  readonly regressions: number;
  readonly discontinuities: number;
  readonly sequenceGaps: number;
  readonly driftEstimateNs: string;
  readonly offsetEstimateNs: string;
  readonly resetCount: number;
}
export interface SourceTimestampNormalizer {
  normalize(input: SourceTimestamp, runtimeTick?: FrameTick): NormalizedSourceTimestamp;
  reset(reason: TimestampResetReason): void;
  getSnapshot(): Readonly<TimestampNormalizerSnapshot>;
}

const clone = <T>(v: T): T => structuredClone(v) as T;
const deepFreeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object') {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) deepFreeze(x);
  }
  return v as Readonly<T>;
};
const sanitize = (s: string) =>
  s
    .replace(/([?&](token|key|password|secret|streamKey)=)[^&]+/gi, '$1[REDACTED]')
    .replace(/\/\/[^/@]+@/, '//[REDACTED]@');
const matchesPartial = (f: SourceMediaFormat, p: Partial<SourceMediaFormat>) =>
  Object.entries(p).every(
    ([k, v]) =>
      v === undefined ||
      JSON.stringify((f as unknown as Record<string, unknown>)[k]) === JSON.stringify(v),
  );
const fpsNum = (r: RationalFrameRate) => r.numerator / r.denominator;
const formatCost = (f: SourceMediaFormat) =>
  f.kind === 'VIDEO'
    ? f.width * f.height * fpsNum(f.frameRate)
    : f.kind === 'AUDIO'
      ? f.sampleRate * f.channelCount
      : 1;
const latencyScore = (l: SourceLatencyClass) =>
  ({ REALTIME: 0, LOW: 1, STANDARD: 2, BUFFERED: 3, UNKNOWN: 4 })[l];
const canonical = (f: SourceMediaFormat) => f.id;
const emptyStats = (): SourceStatisticsSnapshot => ({
  videoFramesReceived: 0,
  audioBuffersReceived: 0,
  metadataSamplesReceived: 0,
  videoFramesDropped: 0,
  audioBuffersDropped: 0,
  bufferOverflows: 0,
  bufferUnderflows: 0,
  timestampDiscontinuities: 0,
  timestampRegressions: 0,
});
const mkHealth = (
  id: string,
  state: SourceLifecycleState = 'REGISTERED',
): SourceHealthSnapshot => ({
  sourceId: id,
  lifecycleState: state,
  healthState: 'UNKNOWN',
  connected: false,
  active: false,
  available: true,
  consecutiveFailures: 0,
  failuresInWindow: 0,
  reconnectAttempts: 0,
  droppedVideoFrames: 0,
  droppedAudioBuffers: 0,
  bufferOverflows: 0,
  bufferUnderflows: 0,
  timestampDiscontinuities: 0,
  timestampRegressions: 0,
  currentLatencyNs: '0',
  averageLatencyNs: '0',
  maximumLatencyNs: '0',
  currentJitterNs: '0',
  averageJitterNs: '0',
  updatedAtNs: '0',
});
export const SOURCE_LIFECYCLE_TRANSITIONS: Readonly<
  Record<SourceLifecycleState, readonly SourceLifecycleState[]>
> = Object.freeze({
  DISCOVERED: ['REGISTERED', 'UNAVAILABLE', 'REMOVED'],
  REGISTERED: ['INITIALIZING', 'REMOVED'],
  INITIALIZING: ['READY', 'FAILED', 'STOPPING'],
  READY: ['CONNECTING', 'UNAVAILABLE', 'STOPPING'],
  CONNECTING: ['CONNECTED', 'FAILED', 'DISCONNECTED'],
  CONNECTED: ['ACTIVATING', 'DISCONNECTING', 'DEGRADED', 'STOPPING'],
  ACTIVATING: ['ACTIVE', 'DEGRADED', 'FAILED'],
  ACTIVE: ['DEGRADED', 'DEACTIVATING', 'FAILED', 'STOPPING'],
  DEGRADED: ['RECONNECTING', 'DEACTIVATING', 'FAILED', 'STOPPING'],
  RECONNECTING: ['CONNECTED', 'FAILED', 'DISCONNECTED'],
  DEACTIVATING: ['CONNECTED', 'DISCONNECTING', 'STOPPING'],
  DISCONNECTING: ['DISCONNECTED', 'FAILED', 'STOPPING'],
  DISCONNECTED: ['CONNECTING', 'UNAVAILABLE', 'STOPPING', 'REMOVED'],
  UNAVAILABLE: ['CONNECTING', 'REMOVED'],
  FAILED: ['STOPPING', 'RECONNECTING', 'REMOVED'],
  STOPPING: ['STOPPED'],
  STOPPED: ['REMOVED'],
  REMOVED: [],
});

export class DeterministicSourceTimestampNormalizer implements SourceTimestampNormalizer {
  private sourceEpoch: bigint | undefined;
  private runtimeEpoch: bigint | undefined;
  private lastSource: bigint | undefined;
  private lastNorm: bigint | undefined;
  private lastSeq: bigint | undefined;
  private regressions = 0;
  private discontinuities = 0;
  private sequenceGaps = 0;
  private resetCount = 0;
  normalize(input: SourceTimestamp, runtimeTick?: FrameTick): NormalizedSourceTimestamp {
    const runtimeNs = runtimeTick?.scheduledTimeNs ?? input.timestampNs;
    if (this.sourceEpoch === undefined) {
      this.sourceEpoch = input.timestampNs;
      this.runtimeEpoch = runtimeNs;
    }
    const norm = (this.runtimeEpoch ?? 0n) + (input.timestampNs - (this.sourceEpoch ?? 0n));
    const moved =
      this.lastSource !== undefined && input.timestampNs < this.lastSource && !input.discontinuity;
    const seqGap =
      this.lastSeq !== undefined &&
      input.sequenceNumber !== this.lastSeq + 1n &&
      !input.discontinuity;
    if (moved) this.regressions++;
    if (seqGap) this.sequenceGaps++;
    if (input.discontinuity) this.discontinuities++;
    const out = deepFreeze({
      ...input,
      normalizedTimestampNs: moved && this.lastNorm !== undefined ? this.lastNorm : norm,
      movedBackward: moved,
      sequenceGap: seqGap,
      gapNs: this.lastSource !== undefined ? input.timestampNs - this.lastSource : 0n,
    });
    this.lastSource = input.timestampNs;
    this.lastNorm = out.normalizedTimestampNs;
    this.lastSeq = input.sequenceNumber;
    return out;
  }
  reset(_reason: TimestampResetReason) {
    this.sourceEpoch = undefined;
    this.runtimeEpoch = undefined;
    this.lastSource = undefined;
    this.lastNorm = undefined;
    this.lastSeq = undefined;
    this.resetCount++;
  }
  getSnapshot() {
    const snap: Record<string, unknown> = {
      established: this.sourceEpoch !== undefined,
      regressions: this.regressions,
      discontinuities: this.discontinuities,
      sequenceGaps: this.sequenceGaps,
      driftEstimateNs: '0',
      offsetEstimateNs:
        this.sourceEpoch !== undefined && this.runtimeEpoch !== undefined
          ? (this.runtimeEpoch - this.sourceEpoch).toString()
          : '0',
      resetCount: this.resetCount,
    };
    if (this.sourceEpoch !== undefined) snap.sourceEpochNs = this.sourceEpoch.toString();
    if (this.runtimeEpoch !== undefined) snap.runtimeEpochNs = this.runtimeEpoch.toString();
    if (this.lastSource !== undefined) snap.lastSourceTimestampNs = this.lastSource.toString();
    if (this.lastNorm !== undefined) snap.lastNormalizedTimestampNs = this.lastNorm.toString();
    if (this.lastSeq !== undefined) snap.lastSequenceNumber = this.lastSeq.toString();
    return deepFreeze(snap as unknown as TimestampNormalizerSnapshot);
  }
}

export class SourceBoundedBuffer {
  private video: VideoFrameEnvelope[] = [];
  private audio: AudioBufferEnvelope[] = [];
  private meta: MetadataSampleEnvelope[] = [];
  overflows = 0;
  underflows = 0;
  constructor(readonly config: SourceBufferConfiguration) {
    if (
      config.maximumVideoFrames < 0 ||
      config.maximumAudioBuffers < 0 ||
      config.maximumMetadataSamples < 0
    )
      throw sourceError(
        'InvalidSourceBufferConfiguration',
        'Source buffer capacities must be non-negative',
      );
  }
  enqueue(batch: SourceSampleBatch) {
    for (const v of batch.videoFrames)
      this.push(this.video, v, this.config.maximumVideoFrames, 'video');
    for (const a of batch.audioBuffers)
      this.push(this.audio, a, this.config.maximumAudioBuffers, 'audio');
    for (const m of batch.metadataSamples)
      this.push(this.meta, m, this.config.maximumMetadataSamples, 'metadata');
  }
  drain(): SourceSampleBatch {
    if (!this.video.length && !this.audio.length && !this.meta.length) this.underflows++;
    const out = { videoFrames: this.video, audioBuffers: this.audio, metadataSamples: this.meta };
    this.video = [];
    this.audio = [];
    this.meta = [];
    return deepFreeze(out);
  }
  counts() {
    return {
      video: this.video.length,
      audio: this.audio.length,
      metadata: this.meta.length,
      total: this.video.length + this.audio.length + this.meta.length,
      overflows: this.overflows,
      underflows: this.underflows,
    };
  }
  private push<T>(arr: T[], v: T, max: number, _kind: string) {
    if (arr.length < max) {
      arr.push(v);
      return;
    }
    this.overflows++;
    if (this.config.overflowPolicy === 'DROP_OLDEST') {
      arr.shift();
      arr.push(v);
    } else if (
      this.config.overflowPolicy === 'DROP_NEWEST' ||
      this.config.overflowPolicy === 'REJECT'
    )
      return;
    else if (this.config.overflowPolicy === 'KEEP_LATEST_VIDEO') {
      arr.splice(0, arr.length, v);
    } else throw sourceError('SourceBufferOverflow', 'Source buffer overflow');
  }
}

interface Entry {
  source: MediaSource;
  state: SourceLifecycleState;
  health: SourceHealthSnapshot;
  stats: SourceStatisticsSnapshot;
  selectedFormat: SourceMediaFormat | undefined;
  normalizer: DeterministicSourceTimestampNormalizer;
  buffer: SourceBoundedBuffer;
  lastOperation?: string;
  lastError?: string;
}
export class DefaultSourceAcquisitionManager {
  private providers = new Map<string, SourceProvider>();
  private sources = new Map<string, Entry>();
  private ordered: string[] = [];
  private managerState: 'RUNNING' | 'SHUTTING_DOWN' | 'STOPPED' = 'RUNNING';
  private lastEvent?: string;
  private acquisitionDurations: bigint[] = [];
  constructor(
    private readonly nowNs: () => bigint = () => BigInt(Date.now()) * 1_000_000n,
    private readonly bufferConfig: SourceBufferConfiguration = {
      maximumVideoFrames: 8,
      maximumAudioBuffers: 8,
      maximumMetadataSamples: 16,
      highWaterMark: 12,
      lowWaterMark: 2,
      overflowPolicy: 'DROP_OLDEST',
      underflowPolicy: 'RETURN_EMPTY',
    },
  ) {}
  registerProvider(p: SourceProvider) {
    const id = p.descriptor.id;
    if (this.providers.has(id)) throw new DuplicateSourceProviderError(id);
    this.providers.set(id, p);
    this.lastEvent = 'SourceProviderRegistered';
  }
  unregisterProvider(id: string) {
    if (!this.providers.delete(id)) throw new SourceProviderNotFoundError(id);
    this.lastEvent = 'SourceProviderUnregistered';
  }
  async discover(request: SourceDiscoveryRequest = {}): Promise<SourceDiscoveryResult> {
    const start = this.nowNs();
    const providers = [...this.providers.values()]
      .filter((p) => !request.providerId || p.descriptor.id === request.providerId)
      .sort((a, b) => a.descriptor.id.localeCompare(b.descriptor.id));
    const descriptors: SourceDescriptor[] = [];
    const unavailable: SourceDescriptor[] = [];
    const providerErrors: { providerId: string; error: string }[] = [];
    for (const p of providers) {
      try {
        const r = await p.discover(request, { nowNs: this.nowNs });
        descriptors.push(...r.descriptors);
        unavailable.push(...r.unavailable);
      } catch (e) {
        providerErrors.push({
          providerId: p.descriptor.id,
          error: sanitize(e instanceof Error ? e.message : String(e)),
        });
      }
    }
    const dedupe = new Map<string, SourceDescriptor>();
    for (const d of descriptors
      .filter((d) => this.filter(d, request))
      .sort((a, b) => a.id.localeCompare(b.id)))
      dedupe.set(String(d.metadata.persistentIdentity ?? d.id), d);
    this.lastEvent = 'SourceDiscovered';
    return deepFreeze({
      descriptors: [...dedupe.values()],
      unavailable: unavailable.filter((d) => this.filter(d, request)),
      warnings: [],
      providerErrors,
      durationNs: (this.nowNs() - start).toString(),
      partial: false,
    });
  }
  registerSource(source: MediaSource) {
    const id = source.descriptor.id;
    if (this.sources.has(id)) throw new DuplicateSourceError(id);
    if (
      !this.providers.has(source.descriptor.providerId) &&
      source.descriptor.providerId !== 'standalone'
    )
      throw new SourceProviderNotFoundError(source.descriptor.providerId);
    this.validateDescriptor(source.descriptor);
    const e: Entry = {
      source,
      state: 'REGISTERED',
      health: mkHealth(id),
      stats: emptyStats(),
      normalizer: new DeterministicSourceTimestampNormalizer(),
      buffer: new SourceBoundedBuffer(this.bufferConfig),
      selectedFormat: undefined,
    };
    this.sources.set(id, e);
    this.ordered = [...this.ordered, id].sort();
    this.lastEvent = 'SourceRegistered';
  }
  async initialize(sourceId: string) {
    return this.op(
      sourceId,
      'INITIALIZING',
      'READY',
      (e) => e.source.initialize({ nowNs: this.nowNs }),
      'SourceReady',
    );
  }
  async connect(sourceId: string) {
    return this.op(
      sourceId,
      'CONNECTING',
      'CONNECTED',
      (e) => e.source.connect({ nowNs: this.nowNs }),
      'SourceConnected',
    );
  }
  async disconnect(sourceId: string) {
    return this.op(
      sourceId,
      'DISCONNECTING',
      'DISCONNECTED',
      (e) => e.source.disconnect({ nowNs: this.nowNs }),
      'SourceDisconnected',
    );
  }
  async activate(sourceId: string) {
    return this.op(
      sourceId,
      'ACTIVATING',
      'ACTIVE',
      (e) => e.source.activate({ nowNs: this.nowNs }),
      'SourceActivated',
    );
  }
  async deactivate(sourceId: string) {
    return this.op(
      sourceId,
      'DEACTIVATING',
      'CONNECTED',
      (e) => e.source.deactivate({ nowNs: this.nowNs }),
      'SourceDeactivated',
    );
  }
  async removeSource(sourceId: string) {
    const e = this.must(sourceId);
    if (e.state === 'ACTIVE') await this.deactivate(sourceId);
    if (e.state === 'CONNECTED') await this.disconnect(sourceId);
    this.transition(e, 'STOPPING');
    await e.source.shutdown({ nowNs: this.nowNs });
    this.transition(e, 'STOPPED');
    this.transition(e, 'REMOVED');
    this.sources.delete(sourceId);
    this.ordered = this.ordered.filter((id) => id !== sourceId);
    this.lastEvent = 'SourceRemoved';
  }
  async negotiateFormat(
    sourceId: string,
    req: SourceFormatRequest,
  ): Promise<SourceFormatNegotiationResult> {
    const e = this.must(sourceId);
    const r = negotiateSourceFormat(e.source.descriptor.supportedFormats, req);
    if (r.ok) e.selectedFormat = r.selectedFormat;
    this.lastEvent = r.ok ? 'SourceFormatNegotiated' : 'SourceFormatNegotiationFailed';
    return r;
  }
  getSource(id: string) {
    const e = this.sources.get(id);
    return e && this.snapshotEntry(e);
  }
  listSources() {
    return deepFreeze(this.ordered.map((id) => this.snapshotEntry(this.must(id))));
  }
  getHealth(id: string) {
    return this.sources.get(id)?.health;
  }
  getSnapshot() {
    const snaps = this.ordered.map((id) => this.snapshotEntry(this.must(id)));
    const lc: Record<string, number> = {},
      hc: Record<string, number> = {};
    for (const s of snaps) {
      lc[s.lifecycleState] = (lc[s.lifecycleState] ?? 0) + 1;
      hc[s.health.healthState] = (hc[s.health.healthState] ?? 0) + 1;
    }
    return deepFreeze({
      managerState: this.managerState,
      providerCount: this.providers.size,
      sourceCount: this.sources.size,
      activeSourceIds: snaps
        .filter((s) => s.lifecycleState === 'ACTIVE')
        .map((s) => s.descriptor.id),
      orderedSourceIds: [...this.ordered],
      lifecycleCounts: lc,
      healthCounts: hc,
      processorState: {},
      totalBufferedSamples: [...this.sources.values()].reduce(
        (n, e) => n + e.buffer.counts().total,
        0,
      ),
      invariantStatus: 'OK',
      telemetry: this.telemetry(),
      generatedAtNs: this.nowNs().toString(),
    });
  }
  async shutdown() {
    if (this.managerState === 'STOPPED') return;
    this.managerState = 'SHUTTING_DOWN';
    for (const id of [...this.ordered]) await this.removeSource(id);
    for (const p of this.providers.values()) await p.shutdown({ nowNs: this.nowNs });
    this.managerState = 'STOPPED';
  }
  assertInvariants() {
    const seen = new Set<string>();
    for (const id of this.ordered) {
      if (seen.has(id))
        throw sourceError('SourceInvariantViolation', 'Duplicate ordered source id', { id });
      seen.add(id);
      const e = this.must(id);
      if (e.state === 'ACTIVE' && !e.health.connected)
        throw sourceError('SourceInvariantViolation', 'Active source must be connected', { id });
      const counts = e.buffer.counts();
      if (
        counts.video > this.bufferConfig.maximumVideoFrames ||
        counts.audio > this.bufferConfig.maximumAudioBuffers ||
        counts.metadata > this.bufferConfig.maximumMetadataSamples
      )
        throw sourceError('SourceInvariantViolation', 'Buffer exceeds capacity', { id });
      if (
        e.selectedFormat &&
        !e.source.descriptor.supportedFormats.some((f) => f.id === e.selectedFormat?.id)
      )
        throw sourceError('SourceInvariantViolation', 'Selected format is unsupported', { id });
    }
  }
  async acquireForTick(tick: FrameTick) {
    const start = this.nowNs();
    const batches: SourceSampleBatch[] = [];
    for (const id of this.ordered) {
      const e = this.must(id);
      if (e.state !== 'ACTIVE') continue;
      let batch: SourceSampleBatch | undefined;
      if (e.source.descriptor.acquisitionMode === 'PUSH') batch = e.buffer.drain();
      else if (e.source.pull)
        batch = await e.source.pull(
          { frameNumber: tick.frameNumber, scheduledTimeNs: tick.scheduledTimeNs },
          { nowNs: this.nowNs, frameTick: tick },
        );
      else batch = { videoFrames: [], audioBuffers: [], metadataSamples: [] };
      this.consume(e, batch);
      batches.push(batch);
    }
    this.acquisitionDurations.push(this.nowNs() - start);
    if (this.acquisitionDurations.length > 128) this.acquisitionDurations.shift();
    return deepFreeze({
      videoFrames: batches.flatMap((b) => b.videoFrames),
      audioBuffers: batches.flatMap((b) => b.audioBuffers),
      metadataSamples: batches.flatMap((b) => b.metadataSamples),
    });
  }
  private must(id: string) {
    const e = this.sources.get(id);
    if (!e) throw new SourceNotFoundError(id);
    return e;
  }
  private filter(d: SourceDescriptor, r: SourceDiscoveryRequest) {
    return (
      (!r.sourceTypes?.length || r.sourceTypes.includes(d.type)) &&
      (!r.mediaKinds?.length || d.mediaKinds.some((k) => r.mediaKinds!.includes(k)))
    );
  }
  private transition(e: Entry, to: SourceLifecycleState) {
    if (!SOURCE_LIFECYCLE_TRANSITIONS[e.state].includes(to))
      throw new InvalidSourceLifecycleTransitionError(e.state, to);
    e.state = to;
    e.health = {
      ...e.health,
      lifecycleState: to,
      connected: ['CONNECTED', 'ACTIVE', 'DEGRADED'].includes(to),
      active: to === 'ACTIVE',
      healthState:
        to === 'ACTIVE' || to === 'CONNECTED'
          ? 'HEALTHY'
          : to === 'FAILED'
            ? 'FAILED'
            : to === 'STOPPED'
              ? 'STOPPED'
              : e.health.healthState,
      updatedAtNs: this.nowNs().toString(),
    };
  }
  private async op(
    id: string,
    intermediate: SourceLifecycleState,
    finalState: SourceLifecycleState,
    fn: (e: Entry) => Promise<SourceOperationResult>,
    event: string,
  ) {
    const e = this.must(id);
    this.transition(e, intermediate);
    try {
      const r = await fn(e);
      if (!r.ok)
        throw sourceError(
          r.error?.code ?? 'SourceOperationFailed',
          r.error?.message ?? 'Source operation failed',
        );
      this.transition(e, finalState);
      e.lastOperation = event;
      this.lastEvent = event;
      return deepFreeze({ ok: true, sourceId: id, state: e.state });
    } catch (err) {
      e.lastError = sanitize(err instanceof Error ? err.message : String(err));
      e.health = {
        ...e.health,
        healthState: 'FAILED',
        lastError: e.lastError,
        consecutiveFailures: e.health.consecutiveFailures + 1,
        failuresInWindow: e.health.failuresInWindow + 1,
        lastFailureAtNs: this.nowNs().toString(),
      };
      throw err;
    }
  }
  private consume(e: Entry, b: SourceSampleBatch) {
    const now = this.nowNs().toString();
    e.stats = {
      ...e.stats,
      videoFramesReceived: e.stats.videoFramesReceived + b.videoFrames.length,
      audioBuffersReceived: e.stats.audioBuffersReceived + b.audioBuffers.length,
      metadataSamplesReceived: e.stats.metadataSamplesReceived + b.metadataSamples.length,
    };
    const lastV = b.videoFrames.at(-1),
      lastA = b.audioBuffers.at(-1);
    const last = lastV ?? lastA;
    if (last)
      e.health = {
        ...e.health,
        lastSampleTimestampNs: last.sourceTimestampNs.toString(),
        lastNormalizedTimestampNs: last.normalizedTimestampNs.toString(),
        lastSampleReceivedAtNs: now,
        lastHealthyAtNs: now,
        updatedAtNs: now,
      };
  }
  private snapshotEntry(e: Entry): Readonly<SourceSnapshot> {
    return deepFreeze({
      descriptor: clone(e.source.descriptor),
      lifecycleState: e.state,
      health: clone(e.health),
      connectionState: e.health.connected
        ? 'CONNECTED'
        : e.state === 'CONNECTING'
          ? 'CONNECTING'
          : 'DISCONNECTED',
      activationState:
        e.state === 'ACTIVE' ? 'ACTIVE' : e.state === 'ACTIVATING' ? 'ACTIVATING' : 'INACTIVE',
      ...(e.selectedFormat ? { selectedFormat: e.selectedFormat } : {}),
      bufferingState: e.buffer.counts(),
      timestampNormalizer: e.normalizer.getSnapshot(),
      reconnect: { attempts: e.health.reconnectAttempts, budgeted: true },
      statistics: clone(e.stats),
      ...(e.lastOperation ? { lastOperation: e.lastOperation } : {}),
      ...(e.lastError ? { lastError: e.lastError } : {}),
      generatedAtNs: this.nowNs().toString(),
    });
  }
  private telemetry(): SourceTelemetrySnapshot {
    const es = [...this.sources.values()];
    const dur = this.acquisitionDurations;
    const sum = dur.reduce((a, b) => a + b, 0n);
    return {
      registeredSourceCount: es.length,
      connectedSourceCount: es.filter((e) => e.health.connected).length,
      activeSourceCount: es.filter((e) => e.state === 'ACTIVE').length,
      degradedSourceCount: es.filter((e) => e.state === 'DEGRADED').length,
      unavailableSourceCount: es.filter((e) => e.state === 'UNAVAILABLE').length,
      failedSourceCount: es.filter((e) => e.state === 'FAILED').length,
      reconnectingSourceCount: es.filter((e) => e.state === 'RECONNECTING').length,
      totalVideoFramesReceived: es.reduce((n, e) => n + e.stats.videoFramesReceived, 0),
      totalAudioBuffersReceived: es.reduce((n, e) => n + e.stats.audioBuffersReceived, 0),
      totalMetadataSamplesReceived: es.reduce((n, e) => n + e.stats.metadataSamplesReceived, 0),
      totalVideoFramesDropped: es.reduce((n, e) => n + e.stats.videoFramesDropped, 0),
      totalAudioBuffersDropped: es.reduce((n, e) => n + e.stats.audioBuffersDropped, 0),
      totalBufferOverflows: es.reduce((n, e) => n + e.buffer.overflows, 0),
      totalBufferUnderflows: es.reduce((n, e) => n + e.buffer.underflows, 0),
      totalTimestampDiscontinuities: es.reduce((n, e) => n + e.stats.timestampDiscontinuities, 0),
      totalTimestampRegressions: es.reduce((n, e) => n + e.stats.timestampRegressions, 0),
      totalReconnectAttempts: es.reduce((n, e) => n + e.health.reconnectAttempts, 0),
      successfulReconnects: 0,
      failedReconnects: 0,
      sourceAcquisitionDurationNs: (dur.at(-1) ?? 0n).toString(),
      averageSourceAcquisitionDurationNs: (dur.length ? sum / BigInt(dur.length) : 0n).toString(),
      maximumSourceAcquisitionDurationNs: dur.reduce((m, d) => (d > m ? d : m), 0n).toString(),
      activeSourceIds: this.ordered.filter((id) => this.sources.get(id)?.state === 'ACTIVE'),
      ...(this.lastEvent ? { lastSourceEvent: this.lastEvent } : {}),
      sourceHealthSummary: es.reduce(
        (r, e) => ({ ...r, [e.health.healthState]: (r[e.health.healthState] ?? 0) + 1 }),
        {} as Record<string, number>,
      ),
    };
  }
  private validateDescriptor(d: SourceDescriptor) {
    if (!d.id || !d.providerId || !d.displayName)
      throw sourceError(
        'InvalidSourceDescriptor',
        'Source descriptor requires id, providerId, and displayName',
      );
  }
}

export function negotiateSourceFormat(
  formats: readonly SourceMediaFormat[],
  request: SourceFormatRequest,
): SourceFormatNegotiationResult {
  const rejected: { formatId: string; reason: string }[] = [];
  const kind = request.mediaKind === 'AUDIO_VIDEO' ? undefined : request.mediaKind;
  let candidates = formats.filter((f) => !kind || f.kind === kind);
  const req = request.requiredConstraints ?? {};
  candidates = candidates.filter((f) => {
    for (const [k, v] of Object.entries(req)) {
      if (JSON.stringify((f as unknown as Record<string, unknown>)[k]) !== JSON.stringify(v)) {
        rejected.push({ formatId: f.id, reason: `required ${k}` });
        return false;
      }
    }
    if (
      request.maximumResolution &&
      f.kind === 'VIDEO' &&
      (f.width > request.maximumResolution.width || f.height > request.maximumResolution.height)
    ) {
      rejected.push({ formatId: f.id, reason: 'maximumResolution' });
      return false;
    }
    if (
      request.minimumResolution &&
      f.kind === 'VIDEO' &&
      (f.width < request.minimumResolution.width || f.height < request.minimumResolution.height)
    ) {
      rejected.push({ formatId: f.id, reason: 'minimumResolution' });
      return false;
    }
    if (
      request.maximumFrameRate &&
      f.kind === 'VIDEO' &&
      fpsNum(f.frameRate) > fpsNum(request.maximumFrameRate)
    ) {
      rejected.push({ formatId: f.id, reason: 'maximumFrameRate' });
      return false;
    }
    return true;
  });
  if (!candidates.length)
    return deepFreeze({
      ok: false,
      explanation: ['No supported format satisfies required constraints'],
      rejectedFormats: rejected,
      fallback: false,
    });
  const scored = candidates
    .map((f) => {
      let score = 0;
      for (const p of request.preferredFormats ?? []) if (matchesPartial(f, p)) score += 1000;
      if (
        request.preferredPixelFormat &&
        f.kind === 'VIDEO' &&
        f.pixelFormat === request.preferredPixelFormat
      )
        score += 100;
      if (
        request.preferredSampleRate &&
        f.kind === 'AUDIO' &&
        f.sampleRate === request.preferredSampleRate
      )
        score += 100;
      if (
        request.preferredChannelLayout &&
        f.kind === 'AUDIO' &&
        f.channelLayout === request.preferredChannelLayout
      )
        score += 50;
      if (
        request.preferredFrameRate &&
        f.kind === 'VIDEO' &&
        fpsNum(f.frameRate) === fpsNum(request.preferredFrameRate)
      )
        score += 50;
      const l =
        f.kind === 'VIDEO' ? f.latencyClass : f.kind === 'AUDIO' ? f.latencyHint : 'UNKNOWN';
      if (request.latencyPreference && l === request.latencyPreference) score += 25;
      return { f, score, latency: latencyScore(l), cost: formatCost(f) };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.latency - b.latency ||
        a.cost - b.cost ||
        canonical(a.f).localeCompare(canonical(b.f)),
    );
  return deepFreeze({
    ok: true,
    selectedFormat: scored[0]!.f,
    explanation: [
      `Selected ${scored[0]!.f.id} deterministically from ${candidates.length} candidates`,
    ],
    rejectedFormats: rejected,
    fallback: scored[0]!.score === 0,
  });
}

export const createSourceVideoFormat = (
  p: Partial<SourceVideoFormat> & Pick<SourceVideoFormat, 'id'>,
): SourceVideoFormat =>
  deepFreeze({
    kind: 'VIDEO',
    width: 1920,
    height: 1080,
    frameRate: { numerator: 30, denominator: 1 },
    pixelFormat: 'RGBA',
    colorSpace: 'BT709',
    colorRange: 'FULL',
    transferCharacteristic: 'BT709',
    chromaSubsampling: '4:4:4',
    scan: 'PROGRESSIVE',
    fieldOrder: 'NONE',
    aspectRatio: '16:9',
    alpha: true,
    bitDepth: 8,
    rotation: 0,
    memoryDomain: 'OPAQUE',
    hardwareAcceleration: 'NONE',
    latencyClass: 'LOW',
    ...p,
  });
export const createSourceAudioFormat = (
  p: Partial<SourceAudioFormat> & Pick<SourceAudioFormat, 'id'>,
): SourceAudioFormat =>
  deepFreeze({
    kind: 'AUDIO',
    sampleRate: 48000,
    channelCount: 2,
    channelLayout: 'stereo',
    sampleFormat: 'f32',
    planar: false,
    bitDepth: 32,
    clockDomain: 'RUNTIME_MASTER',
    framesPerBuffer: 1600,
    latencyHint: 'LOW',
    ...p,
  });
export interface SyntheticSourceConfig {
  readonly id: string;
  readonly providerId?: string;
  readonly displayName?: string;
  readonly mediaKinds: readonly SourceMediaKind[];
  readonly acquisitionMode?: SourceAcquisitionMode;
  readonly videoFormat?: SourceVideoFormat;
  readonly audioFormat?: SourceAudioFormat;
  readonly seed?: number;
  readonly dropEvery?: number;
  readonly discontinuityEvery?: number;
  readonly connectionFailures?: number;
}
export class SyntheticMediaSource implements MediaSource {
  readonly descriptor: SourceDescriptor;
  private videoSeq = 0n;
  private audioSeq = 0n;
  private state: SourceLifecycleState = 'REGISTERED';
  private failures: number;
  constructor(readonly config: SyntheticSourceConfig) {
    const vf = config.videoFormat ?? createSourceVideoFormat({ id: `${config.id}:video:1080p` });
    const af = config.audioFormat ?? createSourceAudioFormat({ id: `${config.id}:audio:48k` });
    const fmts = [
      ...(config.mediaKinds.some((k) => k.includes('VIDEO')) ? [vf] : []),
      ...(config.mediaKinds.some((k) => k.includes('AUDIO')) ? [af] : []),
    ];
    this.failures = config.connectionFailures ?? 0;
    this.descriptor = deepFreeze({
      id: config.id,
      providerId: config.providerId ?? 'synthetic-source-provider',
      type: 'SYNTHETIC',
      displayName: config.displayName ?? config.id,
      description: 'Deterministic synthetic source for UBOS v5.2.1 validation',
      mediaKinds: config.mediaKinds,
      capabilities: { synthetic: true },
      ...(fmts[0] ? { defaultFormat: fmts[0] } : {}),
      supportedFormats: fmts,
      availability: 'AVAILABLE',
      persistent: false,
      reconnectable: true,
      discoverable: true,
      virtual: true,
      requiresPermission: false,
      permissionState: 'NOT_REQUIRED',
      supportsVideo: fmts.some((f) => f.kind === 'VIDEO'),
      supportsAudio: fmts.some((f) => f.kind === 'AUDIO'),
      supportsMetadata: true,
      supportsSeeking: false,
      supportsLooping: true,
      supportsDynamicFormatChange: true,
      estimatedLatencyClass: 'LOW',
      clockDomain: 'RUNTIME_MASTER',
      acquisitionMode: config.acquisitionMode ?? 'PULL',
      tags: ['synthetic', 'test'],
      metadata: { persistentIdentity: `synthetic:${config.id}` },
    });
  }
  async initialize() {
    this.state = 'READY';
    return { ok: true, sourceId: this.descriptor.id, state: this.state };
  }
  async connect() {
    if (this.failures-- > 0)
      return {
        ok: false,
        sourceId: this.descriptor.id,
        state: this.state,
        error: { code: 'SourceConnectionFailed', message: 'Synthetic connection failure' },
      };
    this.state = 'CONNECTED';
    return { ok: true, sourceId: this.descriptor.id, state: this.state };
  }
  async activate() {
    this.state = 'ACTIVE';
    return { ok: true, sourceId: this.descriptor.id, state: this.state };
  }
  async deactivate() {
    this.state = 'CONNECTED';
    return { ok: true, sourceId: this.descriptor.id, state: this.state };
  }
  async disconnect() {
    this.state = 'DISCONNECTED';
    return { ok: true, sourceId: this.descriptor.id, state: this.state };
  }
  async shutdown() {
    this.state = 'STOPPED';
    return { ok: true, sourceId: this.descriptor.id, state: this.state };
  }
  async pull(req: SourcePullRequest): Promise<SourceSampleBatch> {
    if (this.state !== 'ACTIVE')
      return deepFreeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    const videoFrames: VideoFrameEnvelope[] = [];
    const audioBuffers: AudioBufferEnvelope[] = [];
    const ts = req.scheduledTimeNs;
    const dis = Boolean(
      this.config.discontinuityEvery &&
      Number(req.frameNumber) > 0 &&
      Number(req.frameNumber) % this.config.discontinuityEvery === 0,
    );
    const drop = Boolean(
      this.config.dropEvery &&
      Number(req.frameNumber) > 0 &&
      Number(req.frameNumber) % this.config.dropEvery === 0,
    );
    for (const f of this.descriptor.supportedFormats) {
      if (drop) continue;
      if (f.kind === 'VIDEO') {
        const seq = this.videoSeq++;
        videoFrames.push(
          deepFreeze({
            sourceId: this.descriptor.id,
            streamId: 'video:0',
            sequenceNumber: seq,
            sourceTimestampNs: ts,
            normalizedTimestampNs: ts,
            durationNs: frameDurationNs(f.frameRate),
            presentationTimestampNs: ts,
            frameNumberHint: req.frameNumber,
            format: f,
            keyFrame: seq % 30n === 0n,
            discontinuity: dis,
            corrupted: false,
            droppedBefore: 0,
            memoryDomain: f.memoryDomain,
            payload: {
              handleId: `${this.descriptor.id}:v:${seq}`,
              kind: 'OPAQUE_TEST_HANDLE',
              release: 'CONSUMER',
            },
            metadata: { synthetic: true },
          }),
        );
      }
      if (f.kind === 'AUDIO') {
        const seq = this.audioSeq++;
        audioBuffers.push(
          deepFreeze({
            sourceId: this.descriptor.id,
            streamId: 'audio:0',
            sequenceNumber: seq,
            sourceTimestampNs: ts,
            normalizedTimestampNs: ts,
            durationNs: (BigInt(f.framesPerBuffer) * 1_000_000_000n) / BigInt(f.sampleRate),
            sampleCount: f.framesPerBuffer,
            format: f,
            discontinuity: dis,
            corrupted: false,
            droppedBefore: 0,
            payload: {
              handleId: `${this.descriptor.id}:a:${seq}`,
              kind: 'OPAQUE_TEST_HANDLE',
              release: 'CONSUMER',
            },
            metadata: { synthetic: true },
          }),
        );
      }
    }
    return deepFreeze({ videoFrames, audioBuffers, metadataSamples: [] });
  }
}
export class SyntheticSourceProvider implements SourceProvider {
  readonly descriptor: SourceProviderDescriptor;
  constructor(
    private readonly configs: readonly SyntheticSourceConfig[] = [
      { id: 'synthetic-av', mediaKinds: ['AUDIO_VIDEO'] },
    ],
    id = 'synthetic-source-provider',
  ) {
    this.descriptor = deepFreeze({
      id,
      displayName: 'Synthetic Source Provider',
      version: '5.2.1',
      sourceTypes: ['SYNTHETIC', 'TEST'],
      acquisitionModes: ['PULL', 'PUSH', 'HYBRID'],
    });
  }
  async discover(request: SourceDiscoveryRequest, context: SourceProviderContext) {
    const start = context.nowNs();
    const descriptors = this.configs
      .map((c) => new SyntheticMediaSource({ ...c, providerId: this.descriptor.id }).descriptor)
      .filter(
        (d) =>
          (!request.sourceTypes?.length || request.sourceTypes.includes(d.type)) &&
          (!request.mediaKinds?.length ||
            d.mediaKinds.some((k) => request.mediaKinds!.includes(k))),
      )
      .sort((a, b) => a.id.localeCompare(b.id));
    return deepFreeze({
      descriptors,
      unavailable: [],
      warnings: [],
      providerErrors: [],
      durationNs: (context.nowNs() - start).toString(),
      partial: false,
    });
  }
  async createSource(descriptor: SourceDescriptor) {
    return new SyntheticMediaSource({
      id: descriptor.id,
      providerId: this.descriptor.id,
      displayName: descriptor.displayName,
      mediaKinds: descriptor.mediaKinds,
      acquisitionMode: descriptor.acquisitionMode,
    });
  }
  async shutdown() {}
}
export const createSourceDescriptorFromDevice = (
  device: DeviceMetadata,
  providerId = 'device-source-adapter',
): SourceDescriptor => {
  const formats: SourceMediaFormat[] = [
    ...(device.capabilities.video ?? []).map((f, i) =>
      createSourceVideoFormat({
        id: `${device.deviceId}:video:${i}`,
        width: f.width ?? 1920,
        height: f.height ?? 1080,
        pixelFormat: f.pixelFormat ?? 'UNKNOWN',
        colorSpace: f.colorSpace ?? 'UNKNOWN',
        frameRate: { numerator: Math.round(f.frameRate ?? 30), denominator: 1 },
        scan: f.scan === 'interlaced' ? 'INTERLACED' : 'PROGRESSIVE',
      }),
    ),
    ...(device.capabilities.audio ?? []).map((f, i) =>
      createSourceAudioFormat({
        id: `${device.deviceId}:audio:${i}`,
        sampleRate: f.sampleRate ?? 48000,
        channelCount: f.channels ?? 2,
        channelLayout: f.layout ?? 'unknown',
        bitDepth: f.bitDepth ?? 32,
      }),
    ),
  ];
  return deepFreeze({
    id: `source:${device.deviceId}`,
    providerId,
    type: device.deviceType.includes('microphone')
      ? 'AUDIO_DEVICE'
      : device.deviceType.includes('capture')
        ? 'CAPTURE_CARD'
        : device.deviceType.includes('screen')
          ? 'SCREEN'
          : 'CAMERA',
    displayName: device.displayName,
    description: 'Source descriptor adapted from device metadata',
    mediaKinds: [
      formats.some((f) => f.kind === 'VIDEO') && formats.some((f) => f.kind === 'AUDIO')
        ? 'AUDIO_VIDEO'
        : formats.some((f) => f.kind === 'VIDEO')
          ? 'VIDEO'
          : formats.some((f) => f.kind === 'AUDIO')
            ? 'AUDIO'
            : 'DATA',
    ],
    capabilities: { deviceType: device.deviceType, connectionType: device.connectionType },
    ...(formats[0] ? { defaultFormat: formats[0] } : {}),
    supportedFormats: formats,
    availability: device.connectionState === 'unavailable' ? 'UNAVAILABLE' : 'AVAILABLE',
    persistent: Boolean(device.persistentId),
    reconnectable: true,
    discoverable: true,
    virtual: device.connectionType === 'virtual',
    requiresPermission: device.connectionState === 'permission-required',
    permissionState:
      device.health.permissionState === 'granted'
        ? 'GRANTED'
        : device.health.permissionState === 'denied'
          ? 'DENIED'
          : device.health.permissionState === 'prompt'
            ? 'PROMPT_REQUIRED'
            : 'UNKNOWN',
    supportsVideo: formats.some((f) => f.kind === 'VIDEO'),
    supportsAudio: formats.some((f) => f.kind === 'AUDIO'),
    supportsMetadata: true,
    supportsSeeking: false,
    supportsLooping: false,
    supportsDynamicFormatChange: false,
    estimatedLatencyClass: 'UNKNOWN',
    clockDomain: 'DEVICE_HARDWARE',
    acquisitionMode: 'PULL',
    tags: ['device-adapter'],
    metadata: { persistentIdentity: device.persistentId ?? device.deviceId },
  });
};
export class SourceAcquisitionProcessor implements TickProcessor {
  readonly descriptor = {
    id: 'source-acquisition-processor',
    name: 'Source Acquisition Processor',
    version: '5.2.1',
    order: 100,
    phase: 'SOURCE' as const,
    workloadClass: 'REALTIME' as const,
    enabledByDefault: true,
    dependencies: [],
    optionalCapabilities: ['source-acquisition'],
    estimatedBudgetNs: 1_000_000n,
    maximumBudgetNs: 10_000_000n,
    timeoutNs: 10_000_000n,
    maySkipUnderLoad: false,
    failurePolicy: 'DEGRADE_RUNTIME' as const,
    criticality: 'MEDIA_CRITICAL' as const,
    supportsHotDisable: true,
    supportsHotEnable: true,
    supportsHotReplacement: false,
    statePersistencePolicy: 'RETAIN_UNTIL_SHUTDOWN' as const,
    metadata: { ubos: '5.2.1' },
  };
  private lastFrame?: bigint;
  constructor(private readonly manager: DefaultSourceAcquisitionManager) {}
  initialize() {
    return { status: 'READY' as const };
  }
  async processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    if (this.lastFrame === tick.frameNumber)
      return { status: 'SKIPPED' as const, reason: 'already-executed-for-tick' };
    this.lastFrame = tick.frameNumber;
    const batch = await this.manager.acquireForTick(tick);
    context.outputs.publish(
      this.descriptor.id,
      SOURCE_OUTPUT_KEYS.videoFrames,
      batch.videoFrames,
      'EXTERNAL_HANDLE',
    );
    context.outputs.publish(
      this.descriptor.id,
      SOURCE_OUTPUT_KEYS.audioBuffers,
      batch.audioBuffers,
      'EXTERNAL_HANDLE',
    );
    context.outputs.publish(
      this.descriptor.id,
      SOURCE_OUTPUT_KEYS.metadataSamples,
      batch.metadataSamples,
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      SOURCE_OUTPUT_KEYS.health,
      this.manager.listSources().map((s) => s.health),
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      SOURCE_OUTPUT_KEYS.statistics,
      this.manager.getSnapshot().telemetry,
      'BORROWED',
    );
    return {
      status: 'SUCCEEDED' as const,
      value: {
        videoFrames: batch.videoFrames.length,
        audioBuffers: batch.audioBuffers.length,
        metadataSamples: batch.metadataSamples.length,
      },
    };
  }
  shutdown() {
    return { status: 'STOPPED' as const };
  }
}
export const createSourceAcquisitionManager = (
  nowNs?: () => bigint,
  bufferConfig?: SourceBufferConfiguration,
) => new DefaultSourceAcquisitionManager(nowNs, bufferConfig);
