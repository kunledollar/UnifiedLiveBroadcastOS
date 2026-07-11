import { RuntimeEngineError, type FrameTick } from './execution-engine.js';
import {
  DeterministicSourceTimestampNormalizer,
  type AudioBufferEnvelope,
  type MediaSource,
  type MetadataSampleEnvelope,
  type SourceDescriptor,
  type SourceMediaKind,
  type SourceOperationResult,
  type SourcePayloadRef,
  type SourceProvider,
  type SourceProviderContext,
  type SourceProviderDescriptor,
  type SourceRuntimeContext,
  type SourceSampleBatch,
  type SourceAudioFormat,
  type SourceVideoFormat,
  type VideoFrameEnvelope,
} from './source-acquisition.js';

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
const idpart = (s: string) => s.replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 96);
const safeMetadata = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 32))
    out[k] = /secret|token|credential|password|path|url|handle|payload|key/i.test(k)
      ? '<redacted>'
      : val && typeof val === 'object'
        ? '[redacted-object]'
        : val;
  return out;
};
const errorRecord = (e: unknown) => ({ message: e instanceof Error ? e.message : String(e) });
const ns = (n: bigint | number | undefined, fallback = 0n) =>
  typeof n === 'bigint' ? n : typeof n === 'number' ? BigInt(Math.trunc(n)) : fallback;

export type FileSourceCategory =
  | 'VIDEO_FILE'
  | 'AUDIO_FILE'
  | 'IMAGE_FILE'
  | 'ANIMATED_IMAGE'
  | 'AUDIO_VIDEO_FILE'
  | 'PLAYLIST'
  | 'SEQUENCE'
  | 'SYNTHETIC_FILE'
  | 'CUSTOM_FILE';
export type FileLocationKind =
  'LOCAL_PATH' | 'FILE_URI' | 'MANAGED_ASSET' | 'SANDBOX_ASSET' | 'CLOUD_ASSET' | 'SYNTHETIC_ASSET';
export type FilePlaybackState =
  'IDLE' | 'READY' | 'PLAYING' | 'PAUSED' | 'SEEKING' | 'ENDED' | 'STOPPED' | 'FAILED';
export type FileSeekMode = 'ABSOLUTE' | 'RELATIVE' | 'FROM_END' | 'TO_START' | 'TO_END';
export type FileSeekAlignment =
  'EXACT' | 'NEAREST' | 'PREVIOUS_KEYFRAME' | 'NEXT_KEYFRAME' | 'BACKEND_DEFAULT';
export type FileOverflowPolicy = 'DROP_OLDEST' | 'DROP_NEWEST' | 'KEEP_LATEST_VIDEO' | 'REJECT';
export type FileOwnershipState =
  | 'OWNED_BY_BACKEND'
  | 'OWNED_BY_SOURCE'
  | 'OWNED_BY_RUNTIME'
  | 'BORROWED'
  | 'EXTERNAL_HANDLE'
  | 'RELEASED';
export type FileCommandType =
  | 'FILE_REGISTER'
  | 'FILE_PROBE'
  | 'FILE_OPEN'
  | 'FILE_PLAY'
  | 'FILE_PAUSE'
  | 'FILE_SEEK'
  | 'FILE_STOP'
  | 'FILE_CLOSE'
  | 'FILE_SET_RATE'
  | 'FILE_SET_LOOP'
  | 'FILE_SELECT_STREAMS'
  | 'FILE_RELOAD'
  | 'FILE_ENABLE'
  | 'FILE_DISABLE';
export const FILE_COMMAND_TYPES = freeze([
  'FILE_REGISTER',
  'FILE_PROBE',
  'FILE_OPEN',
  'FILE_PLAY',
  'FILE_PAUSE',
  'FILE_SEEK',
  'FILE_STOP',
  'FILE_CLOSE',
  'FILE_SET_RATE',
  'FILE_SET_LOOP',
  'FILE_SELECT_STREAMS',
  'FILE_RELOAD',
  'FILE_ENABLE',
  'FILE_DISABLE',
] as const);
export const FILE_EVENT_TYPES = freeze([
  'FileSourceRegistered',
  'FileProbeStarted',
  'FileProbeCompleted',
  'FileProbeFailed',
  'FileOpening',
  'FileOpened',
  'FileOpenFailed',
  'FilePlaybackStarted',
  'FilePlaybackPaused',
  'FileSeekStarted',
  'FileSeekCompleted',
  'FileSeekFailed',
  'FilePlaybackStopped',
  'FileClosing',
  'FileClosed',
  'FileSampleRead',
  'FileSamplePublished',
  'FileSampleDropped',
  'FileQueuePressure',
  'FileEndOfStream',
  'FileLoopRestarted',
  'FilePlaybackRateChanged',
  'FileStreamsSelected',
  'FileHealthChanged',
  'FileUnavailable',
  'FileBackendFailed',
] as const);
export const FILE_WATCHDOG_INCIDENTS = freeze([
  'FILE_SOURCE_MISSING',
  'FILE_SOURCE_UNREADABLE',
  'FILE_PROBE_FAILED',
  'FILE_OPEN_FAILED',
  'FILE_READER_STALLED',
  'FILE_QUEUE_OVERFLOW',
  'FILE_SAMPLE_DROP_RATE_HIGH',
  'FILE_TIMESTAMP_UNSTABLE',
  'FILE_SEEK_FAILED',
  'FILE_LOOP_STALLED',
  'FILE_BACKEND_FAILED',
  'FILE_GENERATION_MISMATCH',
  'FILE_INVARIANT_FAILURE',
] as const);

export class FileSourceError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(code, message, safeMetadata(details));
  }
}
export class FilePathInvalidError extends FileSourceError {
  constructor(message = 'File path is invalid') {
    super('FilePathInvalid', message);
  }
}
export class FilePathOutsideAllowedRootError extends FileSourceError {
  constructor() {
    super('FilePathOutsideAllowedRoot', 'File path is outside an allowed root');
  }
}
export class FileSchemeUnsupportedError extends FileSourceError {
  constructor(scheme: string) {
    super('FileSchemeUnsupported', `File URI scheme is unsupported: ${scheme}`, { scheme });
  }
}
export class FileStreamNotFoundError extends FileSourceError {
  constructor(streamId: string) {
    super('FileStreamNotFound', `File stream was not found: ${streamId}`, { streamId });
  }
}
export class FileSeekOutOfRangeError extends FileSourceError {
  constructor() {
    super('FileSeekOutOfRange', 'File seek position is outside duration');
  }
}
export class FileOwnershipViolationError extends FileSourceError {
  constructor(message = 'File sample ownership violation') {
    super('FileOwnershipViolation', message);
  }
}

export interface FileLocationReference {
  readonly kind: FileLocationKind;
  readonly reference: string;
  readonly redactedReference: string;
  readonly stableHash: string;
}
export interface FilePathPolicy {
  readonly allowedRoots?: readonly string[];
  readonly allowedSchemes?: readonly string[];
  readonly allowSynthetic?: boolean;
}
export interface FileStreamDescriptor {
  readonly streamId: string;
  readonly mediaKind: 'VIDEO' | 'AUDIO' | 'METADATA';
  readonly codecName?: string;
  readonly timebase: { readonly numerator: number; readonly denominator: number };
  readonly video?: {
    readonly width: number;
    readonly height: number;
    readonly frameRate: { readonly numerator: number; readonly denominator: number };
    readonly pixelFormat?: string;
  };
  readonly audio?: {
    readonly sampleRate: number;
    readonly channelCount: number;
    readonly channelLayout: string;
  };
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface FileSourceIdentity {
  readonly sourceId: string;
  readonly providerId: string;
  readonly assetId: string;
  readonly fileType: FileSourceCategory;
  readonly displayName: string;
  readonly location: FileLocationReference;
  readonly contentFingerprint?: string;
  readonly fileSizeBytes?: number;
  readonly modifiedAtNs?: string;
  readonly mediaKinds: readonly SourceMediaKind[];
  readonly persistentIdentity: string;
  readonly sessionIdentity: string;
  readonly tags: readonly string[];
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface FileTimelineSnapshot {
  readonly durationNs: string;
  readonly currentPositionNs: string;
  readonly requestedPositionNs: string;
  readonly playbackRate: number;
  readonly paused: boolean;
  readonly ended: boolean;
  readonly loopEnabled: boolean;
  readonly loopStartNs: string;
  readonly loopEndNs: string;
  readonly timelineEpochNs: string;
  readonly sourceTimebase: { readonly numerator: number; readonly denominator: number };
  readonly discontinuityCount: number;
  readonly seekGeneration: number;
  readonly playbackGeneration: number;
}
export interface FileStreamSelectionSnapshot {
  readonly videoStreamIds: readonly string[];
  readonly audioStreamIds: readonly string[];
  readonly metadataStreamIds: readonly string[];
  readonly policy: 'DEFAULT' | 'EXPLICIT';
}
export interface FileQueueSnapshot {
  readonly videoDepth: number;
  readonly audioDepth: number;
  readonly metadataDepth: number;
  readonly maximumVideoFrames: number;
  readonly maximumAudioBuffers: number;
  readonly maximumMetadataSamples: number;
  readonly overflows: number;
  readonly droppedSamples: number;
  readonly highWater: boolean;
  readonly readAheadDurationNs: string;
}
export interface FileLoopConfiguration {
  readonly enabled: boolean;
  readonly startNs?: bigint;
  readonly endNs?: bigint;
  readonly count?: number;
  readonly infinite?: boolean;
}
export interface FileQueueConfiguration {
  readonly maximumVideoFrames: number;
  readonly maximumAudioBuffers: number;
  readonly maximumMetadataSamples: number;
  readonly highWaterMark: number;
  readonly lowWaterMark: number;
  readonly overflowPolicy: FileOverflowPolicy;
  readonly audioOverflowPolicy: Exclude<FileOverflowPolicy, 'KEEP_LATEST_VIDEO'>;
  readonly maximumSampleAgeNs: bigint;
  readonly maximumReadAheadNs: bigint;
  readonly targetReadAheadNs: bigint;
  readonly preserveLatestVideo: boolean;
}
export interface FileSourceDescriptor {
  readonly identity: FileSourceIdentity;
  readonly sourceDescriptor: SourceDescriptor;
  readonly durationNs: string;
  readonly seekable: boolean;
  readonly loopable: boolean;
  readonly playbackRateSupport: {
    readonly supported: boolean;
    readonly minimum: number;
    readonly maximum: number;
    readonly defaultRate: number;
  };
  readonly availableStreams: readonly FileStreamDescriptor[];
  readonly defaultSelectedStreams: FileStreamSelectionSnapshot;
  readonly fileSizeBytes?: number;
  readonly permissionState: SourceDescriptor['permissionState'];
  readonly reopenable: boolean;
  readonly clockDomain: 'FILE_TIMELINE';
  readonly latencyClass: SourceDescriptor['estimatedLatencyClass'];
  readonly acquisitionMode: 'PULL';
  readonly safeLocation: FileLocationReference;
  readonly contentFingerprintSummary?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface FileProbeRequest {
  readonly location: FileLocationReference;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface FileProbeResult {
  readonly ok: boolean;
  readonly assetType: FileSourceCategory;
  readonly durationNs: string;
  readonly seekable: boolean;
  readonly approximateBitrate?: number;
  readonly fileSizeBytes?: number;
  readonly streams: readonly FileStreamDescriptor[];
  readonly warnings: readonly string[];
  readonly error?: { readonly code: string; readonly message: string };
  readonly metadata: Readonly<Record<string, unknown>>;
}
export type FileProbeSnapshot = FileProbeResult;
export interface FileOpenRequest {
  readonly selectedStreams?: Partial<FileStreamSelectionSnapshot>;
  readonly loop?: FileLoopConfiguration;
  readonly queue?: Partial<FileQueueConfiguration>;
  readonly correlationId?: string;
}
export interface FileSeekRequest {
  readonly mode: FileSeekMode;
  readonly positionNs?: bigint;
  readonly alignment: FileSeekAlignment;
  readonly expectedSeekGeneration?: number;
  readonly commandId?: string;
}
export interface FileSeekResult {
  readonly ok: boolean;
  readonly sourceId: string;
  readonly requestedPositionNs: string;
  readonly actualPositionNs: string;
  readonly alignment: FileSeekAlignment;
  readonly seekGeneration: number;
  readonly error?: { readonly code: string; readonly message: string };
}
export interface FileOperationResult {
  readonly ok: boolean;
  readonly sourceId: string;
  readonly playbackState: FilePlaybackState;
  readonly error?: { readonly code: string; readonly message: string };
}
export interface FileProviderContext extends SourceProviderContext {
  readonly pathPolicy?: FilePathPolicy;
}
export interface FileConnectionContext extends SourceRuntimeContext {}
export interface FilePlaybackContext extends SourceRuntimeContext {}
export interface FileBackendContext {
  readonly nowNs: () => bigint;
  readonly signal?: AbortSignal;
}
export interface FileBackendOpenRequest {
  readonly descriptor: FileSourceDescriptor;
  readonly selectedStreams: FileStreamSelectionSnapshot;
}
export interface FileBackendReadRequest {
  readonly sourceId: string;
  readonly positionNs: bigint;
  readonly playbackGeneration: number;
  readonly seekGeneration: number;
  readonly maximumSamples: number;
}
export interface FileBackendSeekRequest {
  readonly positionNs: bigint;
  readonly alignment: FileSeekAlignment;
  readonly seekGeneration: number;
}
export interface FileBackendOpenResult {
  readonly ok: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface FileBackendSeekResult {
  readonly ok: boolean;
  readonly actualPositionNs: bigint;
  readonly alignment: FileSeekAlignment;
}
export interface FileSampleBatch extends SourceSampleBatch {
  readonly endOfStream?: boolean;
}
export interface FileMediaBackend {
  readonly backendId: string;
  probe(request: FileProbeRequest, context: FileBackendContext): Promise<FileProbeResult>;
  open(
    request: FileBackendOpenRequest,
    context: FileBackendContext,
  ): Promise<FileBackendOpenResult>;
  read(request: FileBackendReadRequest, context: FileBackendContext): Promise<FileSampleBatch>;
  seek(
    request: FileBackendSeekRequest,
    context: FileBackendContext,
  ): Promise<FileBackendSeekResult>;
  close(context: FileBackendContext): Promise<void>;
  releasePayload?(payload: SourcePayloadRef): void;
}

export interface FileSourceProvider extends SourceProvider {
  probe(request: FileProbeRequest, context: FileProviderContext): Promise<FileProbeResult>;
  createFileSource(
    descriptor: FileSourceDescriptor,
    context: FileProviderContext,
  ): Promise<FileMediaSource>;
  getBackendHealth(): Readonly<FileBackendHealthSnapshot>;
}
export interface FileMediaSource extends MediaSource {
  readonly fileDescriptor: FileSourceDescriptor;
  open(request: FileOpenRequest, context: FileConnectionContext): Promise<FileOperationResult>;
  play(context: FilePlaybackContext): Promise<FileOperationResult>;
  pause(context: FilePlaybackContext): Promise<FileOperationResult>;
  seek(request: FileSeekRequest, context: FilePlaybackContext): Promise<FileSeekResult>;
  stopPlayback(context: FilePlaybackContext): Promise<FileOperationResult>;
  close(context: FileConnectionContext): Promise<FileOperationResult>;
  selectStreams(selection: Partial<FileStreamSelectionSnapshot>): FileStreamSelectionSnapshot;
  setPlaybackRate(rate: number): FileOperationResult;
  setLoop(loop: FileLoopConfiguration): FileOperationResult;
  getFileSnapshot(): Readonly<FileSourceSnapshot>;
  assertInvariants(): void;
}
export interface FileBackendHealthSnapshot {
  readonly backendId: string;
  readonly healthy: boolean;
  readonly openHandles: number;
  readonly pendingReads: number;
  readonly retainedHandles: number;
  readonly failures: number;
  readonly updatedAtNs: string;
}
export interface FileSourceHealthSnapshot {
  readonly sourceId: string;
  readonly assetId: string;
  readonly lifecycleState: string;
  readonly playbackState: FilePlaybackState;
  readonly sourceHealth: string;
  readonly connected: boolean;
  readonly active: boolean;
  readonly available: boolean;
  readonly selectedStreams: FileStreamSelectionSnapshot;
  readonly durationNs: string;
  readonly currentPositionNs: string;
  readonly playbackRate: number;
  readonly loopState: Readonly<Record<string, unknown>>;
  readonly queueDepths: FileQueueSnapshot;
  readonly eofCount: number;
  readonly seekCount: number;
  readonly seekFailures: number;
  readonly readFailures: number;
  readonly droppedVideoFrames: number;
  readonly droppedAudioBuffers: number;
  readonly generationMismatchDrops: number;
  readonly lastError?: string;
  readonly updatedAtNs: string;
}
export interface FileSourceSnapshot {
  readonly descriptor: FileSourceDescriptor;
  readonly playbackState: FilePlaybackState;
  readonly timeline: FileTimelineSnapshot;
  readonly queues: FileQueueSnapshot;
  readonly selectedStreams: FileStreamSelectionSnapshot;
  readonly health: FileSourceHealthSnapshot;
  readonly enabled: boolean;
  readonly generatedAtNs: string;
}
export interface FileTelemetrySnapshot {
  readonly registeredFileSourceCount: number;
  readonly openFileSourceCount: number;
  readonly activeFileSourceCount: number;
  readonly pausedFileSourceCount: number;
  readonly endedFileSourceCount: number;
  readonly totalFileVideoFramesRead: number;
  readonly totalFileAudioBuffersRead: number;
  readonly totalFileVideoFramesPublished: number;
  readonly totalFileAudioBuffersPublished: number;
  readonly totalFileSamplesDropped: number;
  readonly totalFileQueueOverflows: number;
  readonly totalFileSeekOperations: number;
  readonly totalFileSeekFailures: number;
  readonly totalFileLoopIterations: number;
  readonly totalFileEofEvents: number;
  readonly maximumReadAheadNs: string;
  readonly currentFileSourceIds: readonly string[];
  readonly lastFileEvent?: string;
  readonly fileHealthSummary: Readonly<Record<string, number>>;
}
export interface FileProviderSnapshot {
  readonly providerId: string;
  readonly backend: FileBackendHealthSnapshot;
  readonly descriptors: readonly FileSourceDescriptor[];
}
export interface FileDecoderAdapterBoundary {
  readonly adapterKind:
    | 'FFMPEG'
    | 'GSTREAMER'
    | 'MEDIA_FOUNDATION'
    | 'AVFOUNDATION'
    | 'PLATFORM_NATIVE'
    | 'IMAGE_DECODER'
    | 'AUDIO_DECODER';
  readonly approved: boolean;
  readonly notes: string;
}

export function normalizeFileLocation(
  input: string,
  policy: FilePathPolicy = {},
): FileLocationReference {
  if (!input.trim() || input.includes('\0')) throw new FilePathInvalidError();
  if (input.startsWith('synthetic:')) {
    if (policy.allowSynthetic === false) throw new FileSchemeUnsupportedError('synthetic');
    return freeze({
      kind: 'SYNTHETIC_ASSET',
      reference: input,
      redactedReference: `synthetic:${idpart(input.slice(10))}`,
      stableHash: hash(input),
    });
  }
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(input)?.[1]?.toLowerCase();
  if (scheme && scheme !== 'file') throw new FileSchemeUnsupportedError(scheme);
  const rawPath = scheme === 'file' ? decodeURIComponent(input.replace(/^file:\/\//i, '')) : input;
  const normalized = rawPath.replace(/\\/g, '/').replace(/\/+/g, '/');
  if (/(^|\/)\.\.($|\/)/.test(normalized)) throw new FilePathOutsideAllowedRootError();
  const allowed =
    policy.allowedRoots?.map((r) => r.replace(/\\/g, '/').replace(/\/+$|$/g, '')) ?? [];
  if (allowed.length && !allowed.some((r) => normalized === r || normalized.startsWith(`${r}/`)))
    throw new FilePathOutsideAllowedRootError();
  const parts = normalized.split('/').filter(Boolean);
  const redacted = parts.length > 2 ? `…/${parts.slice(-2).join('/')}` : parts.join('/');
  return freeze({
    kind: scheme === 'file' ? 'FILE_URI' : 'LOCAL_PATH',
    reference: normalized,
    redactedReference: redacted || '<root>',
    stableHash: hash(normalized),
  });
}

class FileHandleTracker {
  private states = new Map<string, FileOwnershipState>();
  releases = 0;
  doubleReleases = 0;
  create(id: string) {
    if (this.states.has(id)) throw new FileOwnershipViolationError('Duplicate handle');
    this.states.set(id, 'OWNED_BY_SOURCE');
    return freeze({
      handleId: id,
      kind: 'OPAQUE_TEST_HANDLE',
      release: 'SOURCE',
    } satisfies SourcePayloadRef);
  }
  release(id: string) {
    const state = this.states.get(id);
    if (!state || state === 'RELEASED') {
      this.doubleReleases++;
      throw new FileOwnershipViolationError('Double release');
    }
    this.states.set(id, 'RELEASED');
    this.releases++;
  }
  retained() {
    return [...this.states.values()].filter((s) => s !== 'RELEASED').length;
  }
  releaseAll() {
    for (const [id, s] of this.states) if (s !== 'RELEASED') this.release(id);
  }
}

export class FileBoundedQueue<
  T extends {
    readonly seekGeneration?: number;
    readonly playbackGeneration?: number;
    readonly payload?: unknown;
  },
> {
  private values: T[] = [];
  overflows = 0;
  dropped = 0;
  constructor(
    private readonly max: number,
    private readonly policy: FileOverflowPolicy,
    private readonly release: (sample: T) => void = () => {},
  ) {}
  enqueue(sample: T) {
    if (this.values.length < this.max) {
      this.values.push(sample);
      return true;
    }
    this.overflows++;
    if (this.policy === 'DROP_NEWEST' || this.policy === 'REJECT') {
      this.dropped++;
      this.release(sample);
      return false;
    }
    if (this.policy === 'KEEP_LATEST_VIDEO') {
      this.clear();
      this.values.push(sample);
      this.dropped++;
      return true;
    }
    const old = this.values.shift();
    if (old) {
      this.dropped++;
      this.release(old);
    }
    this.values.push(sample);
    return true;
  }
  drainEligible(positionNs: bigint, generation: number) {
    const out: T[] = [];
    const keep: T[] = [];
    for (const s of this.values) {
      const t = ns(
        (
          s as unknown as {
            presentationTimestampNs?: bigint;
            normalizedTimestampNs?: bigint;
            sourceTimestampNs?: bigint;
          }
        ).presentationTimestampNs ??
          (s as unknown as { normalizedTimestampNs?: bigint }).normalizedTimestampNs,
      );
      if (s.seekGeneration !== undefined && s.seekGeneration !== generation) {
        this.dropped++;
        this.release(s);
        continue;
      }
      if (t <= positionNs) out.push(s);
      else keep.push(s);
    }
    this.values = keep;
    return out;
  }
  clear() {
    for (const s of this.values) this.release(s);
    this.values = [];
  }
  depth() {
    return this.values.length;
  }
}

const defaultQueue: FileQueueConfiguration = freeze({
  maximumVideoFrames: 8,
  maximumAudioBuffers: 8,
  maximumMetadataSamples: 16,
  highWaterMark: 12,
  lowWaterMark: 2,
  overflowPolicy: 'DROP_OLDEST',
  audioOverflowPolicy: 'DROP_OLDEST',
  maximumSampleAgeNs: 5_000_000_000n,
  maximumReadAheadNs: 1_000_000_000n,
  targetReadAheadNs: 250_000_000n,
  preserveLatestVideo: true,
});

export interface SyntheticFileAssetOptions {
  readonly assetId: string;
  readonly displayName?: string;
  readonly kind: 'VIDEO' | 'AUDIO' | 'AUDIO_VIDEO' | 'STILL_IMAGE';
  readonly durationNs?: bigint;
  readonly frameRate?: { readonly numerator: number; readonly denominator: number };
  readonly audioCadenceNs?: bigint;
  readonly seed?: number;
  readonly probeFailure?: boolean;
  readonly openFailure?: boolean;
  readonly readFailureAtSequence?: number;
  readonly seekFailure?: boolean;
}
export class SyntheticFileBackend implements FileMediaBackend {
  readonly backendId = 'synthetic-file-backend';
  private opened = false;
  private failures = 0;
  private handles = new FileHandleTracker();
  private opts: SyntheticFileAssetOptions;
  constructor(opts: SyntheticFileAssetOptions) {
    this.opts = opts;
  }
  async probe(request: FileProbeRequest, _context: FileBackendContext): Promise<FileProbeResult> {
    if (request.signal?.aborted)
      throw new FileSourceError('FileOperationCancelled', 'Probe cancelled');
    if (this.opts.probeFailure)
      return freeze({
        ok: false,
        assetType: 'SYNTHETIC_FILE',
        durationNs: '0',
        seekable: true,
        streams: [],
        warnings: [],
        error: { code: 'FileProbeFailed', message: 'Synthetic probe failure' },
        metadata: {},
      });
    const streams = syntheticStreams(this.opts);
    return freeze({
      ok: true,
      assetType:
        this.opts.kind === 'STILL_IMAGE'
          ? 'IMAGE_FILE'
          : this.opts.kind === 'AUDIO'
            ? 'AUDIO_FILE'
            : this.opts.kind === 'VIDEO'
              ? 'VIDEO_FILE'
              : 'AUDIO_VIDEO_FILE',
      durationNs: (this.opts.durationNs ?? 1_000_000_000n).toString(),
      seekable: true,
      approximateBitrate: 0,
      fileSizeBytes: 0,
      streams,
      warnings: [],
      metadata: { synthetic: true },
    });
  }
  async open(_request: FileBackendOpenRequest, _context: FileBackendContext) {
    if (this.opts.openFailure)
      return freeze({ ok: false, metadata: { error: 'synthetic open failure' } });
    this.opened = true;
    return freeze({ ok: true, metadata: { synthetic: true } });
  }
  async read(
    request: FileBackendReadRequest,
    _context: FileBackendContext,
  ): Promise<FileSampleBatch> {
    if (!this.opened) throw new FileSourceError('FileNotOpen', 'File backend is not open');
    if (this.opts.readFailureAtSequence === Number(request.positionNs)) {
      this.failures++;
      throw new FileSourceError('FileReadFailed', 'Synthetic read failure');
    }
    const duration = this.opts.durationNs ?? 1_000_000_000n;
    if (request.positionNs >= duration)
      return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [], endOfStream: true });
    const streams = syntheticStreams(this.opts);
    const videoFrames: VideoFrameEnvelope[] = [];
    const audioBuffers: AudioBufferEnvelope[] = [];
    for (const s of streams) {
      const h = this.handles.create(
        `${request.sourceId}:${s.streamId}:${request.seekGeneration}:${request.positionNs}`,
      );
      const base = {
        sourceId: request.sourceId,
        streamId: s.streamId,
        sequenceNumber: request.positionNs / 1_000_000n,
        sourceTimestampNs: request.positionNs,
        normalizedTimestampNs: request.positionNs,
        durationNs:
          s.mediaKind === 'AUDIO'
            ? (this.opts.audioCadenceNs ?? 20_000_000n)
            : 1_000_000_000n / BigInt(this.opts.frameRate?.numerator ?? 30),
        discontinuity: request.positionNs === 0n,
        corrupted: false,
        droppedBefore: 0,
        payload: h,
        metadata: freeze({
          assetId: this.opts.assetId,
          playbackGeneration: request.playbackGeneration,
          seekGeneration: request.seekGeneration,
          backendId: this.backendId,
        }),
      } as const;
      if (s.mediaKind === 'VIDEO')
        videoFrames.push(
          freeze({
            ...base,
            presentationTimestampNs: request.positionNs,
            decodeTimestampNs: request.positionNs,
            format: videoFormat(s),
            keyFrame: true,
            memoryDomain: 'CPU',
          }),
        );
      if (s.mediaKind === 'AUDIO')
        audioBuffers.push(freeze({ ...base, sampleCount: 960, format: audioFormat(s) }));
    }
    return freeze({ videoFrames, audioBuffers, metadataSamples: [] });
  }
  async seek(request: FileBackendSeekRequest, _context: FileBackendContext) {
    if (this.opts.seekFailure)
      return freeze({ ok: false, actualPositionNs: 0n, alignment: request.alignment });
    return freeze({ ok: true, actualPositionNs: request.positionNs, alignment: request.alignment });
  }
  releasePayload(payload: SourcePayloadRef) {
    this.handles.release(payload.handleId);
  }
  async close(_context: FileBackendContext) {
    this.opened = false;
    this.handles.releaseAll();
  }
  health(nowNs = () => 0n): FileBackendHealthSnapshot {
    return freeze({
      backendId: this.backendId,
      healthy: this.failures === 0,
      openHandles: this.opened ? 1 : 0,
      pendingReads: 0,
      retainedHandles: this.handles.retained(),
      failures: this.failures + this.handles.doubleReleases,
      updatedAtNs: nowNs().toString(),
    });
  }
}

function syntheticStreams(o: SyntheticFileAssetOptions): readonly FileStreamDescriptor[] {
  const streams: FileStreamDescriptor[] = [];
  if (o.kind === 'VIDEO' || o.kind === 'AUDIO_VIDEO' || o.kind === 'STILL_IMAGE')
    streams.push({
      streamId: 'v:0',
      mediaKind: 'VIDEO',
      codecName: o.kind === 'STILL_IMAGE' ? 'synthetic-still' : 'synthetic-video',
      timebase: { numerator: 1, denominator: 1_000_000_000 },
      video: {
        width: 1920,
        height: 1080,
        frameRate: o.frameRate ?? { numerator: 30, denominator: 1 },
        pixelFormat: 'opaque',
      },
      metadata: {},
    });
  if (o.kind === 'AUDIO' || o.kind === 'AUDIO_VIDEO')
    streams.push({
      streamId: 'a:0',
      mediaKind: 'AUDIO',
      codecName: 'synthetic-audio',
      timebase: { numerator: 1, denominator: 1_000_000_000 },
      audio: { sampleRate: 48000, channelCount: 2, channelLayout: 'stereo' },
      metadata: {},
    });
  return freeze(streams.sort((a, b) => a.streamId.localeCompare(b.streamId)));
}
const videoFormat = (s: FileStreamDescriptor): SourceVideoFormat =>
  freeze({
    kind: 'VIDEO',
    id: s.streamId,
    width: s.video?.width ?? 1,
    height: s.video?.height ?? 1,
    frameRate: s.video?.frameRate ?? { numerator: 1, denominator: 1 },
    pixelFormat: s.video?.pixelFormat ?? 'opaque',
    colorSpace: 'BT709',
    colorRange: 'LIMITED',
    transferCharacteristic: 'BT709',
    chromaSubsampling: '4:2:0',
    scan: 'PROGRESSIVE',
    fieldOrder: 'NONE',
    aspectRatio: '16:9',
    alpha: false,
    bitDepth: 8,
    rotation: 0,
    memoryDomain: 'CPU',
    hardwareAcceleration: 'NONE',
    latencyClass: 'BUFFERED',
  });
const audioFormat = (s: FileStreamDescriptor): SourceAudioFormat =>
  freeze({
    kind: 'AUDIO',
    id: s.streamId,
    sampleRate: s.audio?.sampleRate ?? 48000,
    channelCount: s.audio?.channelCount ?? 2,
    channelLayout: s.audio?.channelLayout ?? 'stereo',
    sampleFormat: 'float32',
    interleaved: true,
    planar: false,
    bitDepth: 32,
    clockDomain: 'FILE_TIMELINE',
    framesPerBuffer: 960,
    latencyHint: 'BUFFERED',
  });

export function createFileSourceDescriptor(
  providerId: string,
  location: FileLocationReference,
  probe: FileProbeResult,
  displayName = location.redactedReference,
): FileSourceDescriptor {
  const mediaKinds: SourceMediaKind[] =
    probe.streams.some((x) => x.mediaKind === 'VIDEO') &&
    probe.streams.some((x) => x.mediaKind === 'AUDIO')
      ? ['AUDIO_VIDEO']
      : probe.streams.some((x) => x.mediaKind === 'VIDEO')
        ? ['VIDEO']
        : probe.streams.some((x) => x.mediaKind === 'AUDIO')
          ? ['AUDIO']
          : ['DATA'];
  const assetId = `file-asset:${location.stableHash}`;
  const sourceId = `file-source:${location.stableHash}`;
  const formats = probe.streams.reduce<Array<SourceVideoFormat | SourceAudioFormat>>(
    (acc, stream) => {
      if (stream.mediaKind === 'VIDEO') acc.push(videoFormat(stream));
      if (stream.mediaKind === 'AUDIO') acc.push(audioFormat(stream));
      return acc;
    },
    [],
  );
  const selected = defaultSelection(probe.streams);
  const sourceDescriptor: SourceDescriptor = freeze({
    id: sourceId,
    providerId,
    type: 'FILE',
    displayName,
    mediaKinds,
    capabilities: { seekable: probe.seekable, fileType: probe.assetType },
    supportedFormats: formats,
    availability: probe.ok ? 'AVAILABLE' : 'UNAVAILABLE',
    persistent: true,
    reconnectable: true,
    discoverable: false,
    virtual: location.kind === 'SYNTHETIC_ASSET',
    requiresPermission: false,
    permissionState: 'NOT_REQUIRED',
    supportsVideo: probe.streams.some((x) => x.mediaKind === 'VIDEO'),
    supportsAudio: probe.streams.some((x) => x.mediaKind === 'AUDIO'),
    supportsMetadata: probe.streams.some((x) => x.mediaKind === 'METADATA'),
    supportsSeeking: probe.seekable,
    supportsLooping: probe.seekable,
    supportsDynamicFormatChange: false,
    estimatedLatencyClass: 'BUFFERED',
    clockDomain: 'FILE_TIMELINE',
    acquisitionMode: 'PULL',
    tags: ['file-source'],
    metadata: { assetId, safeLocation: location.redactedReference },
  });
  const identityBase = {
    sourceId,
    providerId,
    assetId,
    fileType: probe.assetType,
    displayName,
    location,
    mediaKinds,
    persistentIdentity: `file:${location.stableHash}`,
    sessionIdentity: `${sourceId}:session`,
    tags: ['file-source'],
    metadata: safeMetadata(probe.metadata),
  };
  const identity: FileSourceIdentity = freeze({
    ...identityBase,
    ...(probe.fileSizeBytes === undefined ? {} : { fileSizeBytes: probe.fileSizeBytes }),
  });
  return freeze({
    identity,
    sourceDescriptor,
    durationNs: probe.durationNs,
    seekable: probe.seekable,
    loopable: probe.seekable,
    playbackRateSupport: { supported: false, minimum: 1, maximum: 1, defaultRate: 1 },
    availableStreams: probe.streams,
    defaultSelectedStreams: selected,
    ...(probe.fileSizeBytes === undefined ? {} : { fileSizeBytes: probe.fileSizeBytes }),
    permissionState: 'NOT_REQUIRED',
    reopenable: true,
    clockDomain: 'FILE_TIMELINE',
    latencyClass: 'BUFFERED',
    acquisitionMode: 'PULL',
    safeLocation: location,
    contentFingerprintSummary: location.stableHash,
    metadata: safeMetadata(probe.metadata),
  });
}

function defaultSelection(streams: readonly FileStreamDescriptor[]): FileStreamSelectionSnapshot {
  return freeze({
    videoStreamIds: streams
      .filter((s) => s.mediaKind === 'VIDEO')
      .slice(0, 1)
      .map((s) => s.streamId),
    audioStreamIds: streams
      .filter((s) => s.mediaKind === 'AUDIO')
      .slice(0, 1)
      .map((s) => s.streamId),
    metadataStreamIds: streams.filter((s) => s.mediaKind === 'METADATA').map((s) => s.streamId),
    policy: 'DEFAULT',
  });
}

export class DefaultFileMediaSource implements FileMediaSource {
  readonly descriptor: SourceDescriptor;
  private playbackState: FilePlaybackState = 'IDLE';
  private selected: FileStreamSelectionSnapshot;
  private timeline: FileTimelineSnapshot;
  private queueConfig = defaultQueue;
  private videoQ = new FileBoundedQueue<
    VideoFrameEnvelope & { seekGeneration?: number; playbackGeneration?: number }
  >(8, 'DROP_OLDEST', (s) => this.release(s));
  private audioQ = new FileBoundedQueue<
    AudioBufferEnvelope & { seekGeneration?: number; playbackGeneration?: number }
  >(8, 'DROP_OLDEST', (s) => this.release(s));
  private metaQ = new FileBoundedQueue<
    MetadataSampleEnvelope & { seekGeneration?: number; playbackGeneration?: number }
  >(16, 'DROP_OLDEST');
  private connected = false;
  private active = false;
  private enabled = true;
  private eofGenerations = new Set<number>();
  private readInFlight = false;
  private normalizer = new DeterministicSourceTimestampNormalizer();
  private counters = {
    eof: 0,
    seek: 0,
    seekFailures: 0,
    readFailures: 0,
    videoRead: 0,
    audioRead: 0,
    videoPublished: 0,
    audioPublished: 0,
    loopIterations: 0,
    generationMismatchDrops: 0,
  };
  private lastError: string | undefined;
  constructor(
    readonly fileDescriptor: FileSourceDescriptor,
    private readonly backend: FileMediaBackend,
    private readonly nowNs: () => bigint = () => BigInt(Date.now()) * 1_000_000n,
  ) {
    this.descriptor = fileDescriptor.sourceDescriptor;
    this.selected = fileDescriptor.defaultSelectedStreams;
    this.timeline = freeze({
      durationNs: fileDescriptor.durationNs,
      currentPositionNs: '0',
      requestedPositionNs: '0',
      playbackRate: 1,
      paused: true,
      ended: false,
      loopEnabled: false,
      loopStartNs: '0',
      loopEndNs: fileDescriptor.durationNs,
      timelineEpochNs: '0',
      sourceTimebase: { numerator: 1, denominator: 1_000_000_000 },
      discontinuityCount: 0,
      seekGeneration: 0,
      playbackGeneration: 0,
    });
  }
  async initialize(c: SourceRuntimeContext) {
    void c;
    this.playbackState = 'READY';
    return this.sourceResult('READY');
  }
  async connect(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    const r = await this.open({}, c);
    if (!r.ok)
      return {
        ok: false,
        sourceId: this.descriptor.id,
        state: 'DISCONNECTED',
        ...(r.error ? { error: r.error } : {}),
      };
    return this.sourceResult('CONNECTED');
  }
  async activate(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    void c;
    this.active = true;
    return this.sourceResult('ACTIVE');
  }
  async deactivate(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    void c;
    this.active = false;
    return this.sourceResult('CONNECTED');
  }
  async disconnect(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    await this.close(c);
    return this.sourceResult('DISCONNECTED');
  }
  async shutdown(c: SourceRuntimeContext): Promise<SourceOperationResult> {
    await this.close(c);
    return this.sourceResult('STOPPED');
  }
  async open(request: FileOpenRequest, context: FileConnectionContext) {
    if (this.connected) return this.opResult(true);
    if (request.selectedStreams) this.selectStreams(request.selectedStreams);
    if (request.loop) this.setLoop(request.loop);
    const r = await this.backend.open(
      { descriptor: this.fileDescriptor, selectedStreams: this.selected },
      { nowNs: context.nowNs },
    );
    if (!r.ok) return this.fail('FileOpenFailed', 'File open failed');
    this.connected = true;
    this.playbackState = 'READY';
    return this.opResult(true);
  }
  async play(context: FilePlaybackContext) {
    void context;
    if (!this.connected) return this.fail('FileNotOpen', 'File source is not open');
    if (this.playbackState === 'PLAYING') return this.opResult(true);
    this.playbackState = 'PLAYING';
    this.timeline = freeze({
      ...this.timeline,
      paused: false,
      ended: false,
      playbackGeneration: this.timeline.playbackGeneration + 1,
    });
    return this.opResult(true);
  }
  async pause(context: FilePlaybackContext) {
    void context;
    if (this.playbackState === 'PAUSED') return this.opResult(true);
    if (!this.connected) return this.fail('FileNotOpen', 'File source is not open');
    this.playbackState = 'PAUSED';
    this.timeline = freeze({ ...this.timeline, paused: true });
    return this.opResult(true);
  }
  async seek(request: FileSeekRequest, context: FilePlaybackContext) {
    if (!this.connected) return this.seekFail(request, 'FileNotOpen', 'File source is not open');
    if (!this.fileDescriptor.seekable)
      return this.seekFail(request, 'FileSeekUnsupported', 'File is not seekable');
    const duration = BigInt(this.timeline.durationNs);
    const current = BigInt(this.timeline.currentPositionNs);
    const target =
      request.mode === 'TO_START'
        ? 0n
        : request.mode === 'TO_END'
          ? duration
          : request.mode === 'FROM_END'
            ? duration - ns(request.positionNs)
            : request.mode === 'RELATIVE'
              ? current + ns(request.positionNs)
              : ns(request.positionNs);
    if (target < 0n || target > duration)
      return this.seekFail(request, 'FileSeekOutOfRange', 'File seek position is outside duration');
    const nextGen = this.timeline.seekGeneration + 1;
    this.playbackState = 'SEEKING';
    this.clearQueues();
    const r = await this.backend.seek(
      { positionNs: target, alignment: request.alignment, seekGeneration: nextGen },
      { nowNs: context.nowNs },
    );
    if (!r.ok) {
      this.counters.seekFailures++;
      this.playbackState = 'PAUSED';
      return this.seekFail(request, 'FileSeekFailed', 'File seek failed');
    }
    this.normalizer.reset('SEEK');
    this.counters.seek++;
    this.timeline = freeze({
      ...this.timeline,
      currentPositionNs: r.actualPositionNs.toString(),
      requestedPositionNs: target.toString(),
      seekGeneration: nextGen,
      discontinuityCount: this.timeline.discontinuityCount + 1,
      ended: false,
    });
    this.playbackState = 'PAUSED';
    return freeze({
      ok: true,
      sourceId: this.descriptor.id,
      requestedPositionNs: target.toString(),
      actualPositionNs: r.actualPositionNs.toString(),
      alignment: r.alignment,
      seekGeneration: nextGen,
    });
  }
  async stopPlayback(context: FilePlaybackContext) {
    void context;
    this.playbackState = 'STOPPED';
    this.timeline = freeze({
      ...this.timeline,
      paused: true,
      seekGeneration: this.timeline.seekGeneration + 1,
      currentPositionNs: '0',
      ended: false,
    });
    this.clearQueues();
    return this.opResult(true);
  }
  async close(context: FileConnectionContext) {
    this.playbackState = 'STOPPED';
    this.timeline = freeze({
      ...this.timeline,
      seekGeneration: this.timeline.seekGeneration + 1,
      paused: true,
    });
    this.active = false;
    this.connected = false;
    this.clearQueues();
    await this.backend.close({ nowNs: context.nowNs });
    return this.opResult(true);
  }
  selectStreams(selection: Partial<FileStreamSelectionSnapshot>) {
    const next = freeze({
      videoStreamIds: selection.videoStreamIds ?? this.selected.videoStreamIds,
      audioStreamIds: selection.audioStreamIds ?? this.selected.audioStreamIds,
      metadataStreamIds: selection.metadataStreamIds ?? this.selected.metadataStreamIds,
      policy: 'EXPLICIT' as const,
    });
    const ids = new Set(this.fileDescriptor.availableStreams.map((s) => s.streamId));
    for (const id of [...next.videoStreamIds, ...next.audioStreamIds, ...next.metadataStreamIds])
      if (!ids.has(id)) throw new FileStreamNotFoundError(id);
    this.selected = next;
    return next;
  }
  setPlaybackRate(rate: number) {
    if (rate !== 1 || rate <= 0)
      return this.fail(
        'FilePlaybackRateUnsupported',
        'Only metadata rate 1.0 is supported by the synthetic backend',
      );
    this.timeline = freeze({ ...this.timeline, playbackRate: rate });
    return this.opResult(true);
  }
  setLoop(loop: FileLoopConfiguration) {
    const duration = BigInt(this.timeline.durationNs);
    const start = ns(loop.startNs, 0n);
    const end = ns(loop.endNs, duration);
    if (loop.enabled && (start < 0n || end > duration || start >= end))
      return this.fail('FileLoopRegionInvalid', 'File loop region is invalid');
    this.timeline = freeze({
      ...this.timeline,
      loopEnabled: loop.enabled,
      loopStartNs: start.toString(),
      loopEndNs: end.toString(),
    });
    return this.opResult(true);
  }
  async pull(
    request: { readonly frameNumber: bigint; readonly scheduledTimeNs: bigint },
    context: SourceRuntimeContext,
  ): Promise<SourceSampleBatch> {
    void request;
    if (!this.enabled || !this.connected || !this.active || this.playbackState !== 'PLAYING')
      return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    await this.readOnce(context);
    const position = BigInt(this.timeline.currentPositionNs);
    const videos = this.videoQ.drainEligible(position, this.timeline.seekGeneration).slice(-1);
    const audios = this.audioQ.drainEligible(position, this.timeline.seekGeneration);
    this.counters.videoPublished += videos.length;
    this.counters.audioPublished += audios.length;
    for (const v of videos) this.release(v);
    for (const a of audios) this.release(a);
    const next = position + 33_333_333n;
    const duration = BigInt(this.timeline.durationNs);
    if (next >= duration) this.handleEof();
    else this.timeline = freeze({ ...this.timeline, currentPositionNs: next.toString() });
    return freeze({
      videoFrames: videos,
      audioBuffers: audios,
      metadataSamples: this.metaQ.drainEligible(position, this.timeline.seekGeneration),
    });
  }
  private async readOnce(context: SourceRuntimeContext) {
    if (this.readInFlight) return;
    this.readInFlight = true;
    const gen = this.timeline.seekGeneration;
    try {
      const batch = await this.backend.read(
        {
          sourceId: this.descriptor.id,
          positionNs: BigInt(this.timeline.currentPositionNs),
          playbackGeneration: this.timeline.playbackGeneration,
          seekGeneration: gen,
          maximumSamples: 4,
        },
        { nowNs: context.nowNs },
      );
      if (
        !this.connected ||
        gen !== this.timeline.seekGeneration ||
        this.playbackState === 'STOPPED'
      ) {
        this.counters.generationMismatchDrops++;
        for (const v of batch.videoFrames) this.release(v);
        for (const a of batch.audioBuffers) this.release(a);
        return;
      }
      if (batch.endOfStream) {
        this.handleEof();
        return;
      }
      for (const v of batch.videoFrames) {
        this.videoQ.enqueue({
          ...v,
          seekGeneration: gen,
          playbackGeneration: this.timeline.playbackGeneration,
        } as VideoFrameEnvelope & { seekGeneration?: number; playbackGeneration?: number });
        this.counters.videoRead++;
      }
      for (const a of batch.audioBuffers) {
        this.audioQ.enqueue({
          ...a,
          seekGeneration: gen,
          playbackGeneration: this.timeline.playbackGeneration,
        } as AudioBufferEnvelope & { seekGeneration?: number; playbackGeneration?: number });
        this.counters.audioRead++;
      }
    } catch (e) {
      this.counters.readFailures++;
      this.lastError = safeMetadata(errorRecord(e)).message as string;
    } finally {
      this.readInFlight = false;
    }
  }
  private handleEof() {
    if (this.eofGenerations.has(this.timeline.playbackGeneration)) return;
    this.eofGenerations.add(this.timeline.playbackGeneration);
    this.counters.eof++;
    if (this.timeline.loopEnabled) {
      this.counters.loopIterations++;
      this.clearQueues();
      this.timeline = freeze({
        ...this.timeline,
        currentPositionNs: this.timeline.loopStartNs,
        playbackGeneration: this.timeline.playbackGeneration + 1,
        seekGeneration: this.timeline.seekGeneration + 1,
        discontinuityCount: this.timeline.discontinuityCount + 1,
      });
      return;
    }
    this.playbackState = 'ENDED';
    this.timeline = freeze({
      ...this.timeline,
      paused: true,
      ended: true,
      currentPositionNs: this.timeline.durationNs,
    });
  }
  getFileSnapshot() {
    return freeze({
      descriptor: clone(this.fileDescriptor),
      playbackState: this.playbackState,
      timeline: clone(this.timeline),
      queues: this.queueSnapshot(),
      selectedStreams: clone(this.selected),
      health: this.health(),
      enabled: this.enabled,
      generatedAtNs: this.nowNs().toString(),
    });
  }
  assertInvariants() {
    if (this.playbackState === 'PLAYING' && !this.connected)
      throw new FileSourceError('FileInvariantViolation', 'Playing file source must be open');
    const q = this.queueSnapshot();
    if (
      q.videoDepth > q.maximumVideoFrames ||
      q.audioDepth > q.maximumAudioBuffers ||
      q.metadataDepth > q.maximumMetadataSamples
    )
      throw new FileSourceError('FileInvariantViolation', 'File queue exceeds capacity');
  }
  private queueSnapshot(): FileQueueSnapshot {
    const over = this.videoQ.overflows + this.audioQ.overflows + this.metaQ.overflows;
    const total = this.videoQ.depth() + this.audioQ.depth() + this.metaQ.depth();
    return freeze({
      videoDepth: this.videoQ.depth(),
      audioDepth: this.audioQ.depth(),
      metadataDepth: this.metaQ.depth(),
      maximumVideoFrames: this.queueConfig.maximumVideoFrames,
      maximumAudioBuffers: this.queueConfig.maximumAudioBuffers,
      maximumMetadataSamples: this.queueConfig.maximumMetadataSamples,
      overflows: over,
      droppedSamples: this.videoQ.dropped + this.audioQ.dropped + this.metaQ.dropped,
      highWater: total >= this.queueConfig.highWaterMark,
      readAheadDurationNs: '0',
    });
  }
  private health(): FileSourceHealthSnapshot {
    return freeze({
      sourceId: this.descriptor.id,
      assetId: this.fileDescriptor.identity.assetId,
      lifecycleState: this.connected ? (this.active ? 'ACTIVE' : 'CONNECTED') : 'DISCONNECTED',
      playbackState: this.playbackState,
      sourceHealth:
        this.playbackState === 'FAILED'
          ? 'FAILED'
          : this.playbackState === 'ENDED'
            ? 'HEALTHY'
            : 'HEALTHY',
      connected: this.connected,
      active: this.active,
      available: true,
      selectedStreams: this.selected,
      durationNs: this.timeline.durationNs,
      currentPositionNs: this.timeline.currentPositionNs,
      playbackRate: this.timeline.playbackRate,
      loopState: {
        enabled: this.timeline.loopEnabled,
        startNs: this.timeline.loopStartNs,
        endNs: this.timeline.loopEndNs,
      },
      queueDepths: this.queueSnapshot(),
      eofCount: this.counters.eof,
      seekCount: this.counters.seek,
      seekFailures: this.counters.seekFailures,
      readFailures: this.counters.readFailures,
      droppedVideoFrames: this.videoQ.dropped,
      droppedAudioBuffers: this.audioQ.dropped,
      generationMismatchDrops: this.counters.generationMismatchDrops,
      ...(this.lastError ? { lastError: this.lastError } : {}),
      updatedAtNs: this.nowNs().toString(),
    });
  }
  private clearQueues() {
    this.videoQ.clear();
    this.audioQ.clear();
    this.metaQ.clear();
  }
  private release(s: { readonly payload?: unknown }) {
    const payload = s.payload as SourcePayloadRef | undefined;
    if (payload?.handleId) this.backend.releasePayload?.(payload);
  }
  private sourceResult(state: SourceOperationResult['state']): SourceOperationResult {
    return freeze({ ok: true, sourceId: this.descriptor.id, state });
  }
  private opResult(ok: boolean): FileOperationResult {
    return freeze({ ok, sourceId: this.descriptor.id, playbackState: this.playbackState });
  }
  private fail(code: string, message: string): FileOperationResult {
    this.lastError = message;
    if (code === 'FileOpenFailed') this.playbackState = 'FAILED';
    return freeze({
      ok: false,
      sourceId: this.descriptor.id,
      playbackState: this.playbackState,
      error: { code, message },
    });
  }
  private seekFail(request: FileSeekRequest, code: string, message: string): FileSeekResult {
    this.lastError = message;
    return freeze({
      ok: false,
      sourceId: this.descriptor.id,
      requestedPositionNs: ns(request.positionNs).toString(),
      actualPositionNs: this.timeline.currentPositionNs,
      alignment: request.alignment,
      seekGeneration: this.timeline.seekGeneration,
      error: { code, message },
    });
  }
}

export class SyntheticFileSourceProvider implements FileSourceProvider {
  readonly descriptor: SourceProviderDescriptor = freeze({
    id: 'synthetic-file-provider',
    displayName: 'Synthetic File Provider',
    version: '5.2.5',
    sourceTypes: ['FILE', 'SYNTHETIC'],
    acquisitionModes: ['PULL'],
  });
  private readonly assets = new Map<string, SyntheticFileAssetOptions>();
  private readonly backends = new Map<string, SyntheticFileBackend>();
  registerAsset(asset: SyntheticFileAssetOptions) {
    if (this.assets.has(asset.assetId))
      throw new FileSourceError(
        'DuplicateFileSource',
        `Duplicate synthetic file asset ${asset.assetId}`,
        { assetId: asset.assetId },
      );
    this.assets.set(asset.assetId, asset);
  }
  async discover(_request = {}, context: SourceProviderContext) {
    const descriptors: SourceDescriptor[] = [];
    for (const asset of [...this.assets.values()].sort((a, b) =>
      a.assetId.localeCompare(b.assetId),
    )) {
      const loc = normalizeFileLocation(`synthetic:${asset.assetId}`);
      const backend = new SyntheticFileBackend(asset);
      const probe = await backend.probe({ location: loc }, { nowNs: context.nowNs });
      descriptors.push(
        createFileSourceDescriptor(
          this.descriptor.id,
          loc,
          probe,
          asset.displayName ?? asset.assetId,
        ).sourceDescriptor,
      );
    }
    return freeze({
      descriptors,
      unavailable: [],
      warnings: [],
      providerErrors: [],
      durationNs: '0',
      partial: false,
    });
  }
  async probe(request: FileProbeRequest, context: FileProviderContext) {
    const assetId = request.location.reference.replace(/^synthetic:/, '');
    const asset = this.assets.get(assetId) ?? { assetId, kind: 'AUDIO_VIDEO' as const };
    const backend = new SyntheticFileBackend(asset);
    return backend.probe(request, context);
  }
  async createSource(descriptor: SourceDescriptor, context: SourceProviderContext) {
    const assetId = String(
      descriptor.metadata.assetId ?? descriptor.id.replace(/^file-source:/, ''),
    );
    const loc = normalizeFileLocation(`synthetic:${assetId.replace(/^file-asset:/, '')}`);
    const probe = await this.probe({ location: loc }, context);
    const fd = createFileSourceDescriptor(this.descriptor.id, loc, probe, descriptor.displayName);
    return this.createFileSource(fd, context);
  }
  async createFileSource(descriptor: FileSourceDescriptor, context: FileProviderContext) {
    void context;
    const syntheticId = descriptor.safeLocation.reference.replace(/^synthetic:/, '');
    const asset = this.assets.get(syntheticId) ?? {
      assetId: syntheticId,
      kind:
        descriptor.sourceDescriptor.supportsVideo && descriptor.sourceDescriptor.supportsAudio
          ? ('AUDIO_VIDEO' as const)
          : descriptor.sourceDescriptor.supportsVideo
            ? ('VIDEO' as const)
            : ('AUDIO' as const),
      durationNs: BigInt(descriptor.durationNs),
    };
    const backend = new SyntheticFileBackend(asset);
    this.backends.set(descriptor.identity.sourceId, backend);
    return new DefaultFileMediaSource(descriptor, backend);
  }
  getBackendHealth() {
    const hs = [...this.backends.values()].map((b) => b.health());
    return freeze({
      backendId: this.descriptor.id,
      healthy: hs.every((h) => h.healthy),
      openHandles: hs.reduce((n, h) => n + h.openHandles, 0),
      pendingReads: hs.reduce((n, h) => n + h.pendingReads, 0),
      retainedHandles: hs.reduce((n, h) => n + h.retainedHandles, 0),
      failures: hs.reduce((n, h) => n + h.failures, 0),
      updatedAtNs: BigInt(Date.now() * 1_000_000).toString(),
    });
  }
  async shutdown(context: SourceProviderContext) {
    await Promise.all([...this.backends.values()].map((b) => b.close(context)));
    this.backends.clear();
  }
}

export function createFileTelemetrySnapshot(
  sources: readonly FileMediaSource[],
  lastFileEvent?: string,
): FileTelemetrySnapshot {
  const snaps = sources.map((s) => s.getFileSnapshot());
  return freeze({
    registeredFileSourceCount: snaps.length,
    openFileSourceCount: snaps.filter((s) => s.health.connected).length,
    activeFileSourceCount: snaps.filter((s) => s.health.active).length,
    pausedFileSourceCount: snaps.filter((s) => s.playbackState === 'PAUSED').length,
    endedFileSourceCount: snaps.filter((s) => s.playbackState === 'ENDED').length,
    totalFileVideoFramesRead: 0,
    totalFileAudioBuffersRead: 0,
    totalFileVideoFramesPublished: 0,
    totalFileAudioBuffersPublished: 0,
    totalFileSamplesDropped: snaps.reduce((n, s) => n + s.queues.droppedSamples, 0),
    totalFileQueueOverflows: snaps.reduce((n, s) => n + s.queues.overflows, 0),
    totalFileSeekOperations: snaps.reduce((n, s) => n + s.health.seekCount, 0),
    totalFileSeekFailures: snaps.reduce((n, s) => n + s.health.seekFailures, 0),
    totalFileLoopIterations: 0,
    totalFileEofEvents: snaps.reduce((n, s) => n + s.health.eofCount, 0),
    maximumReadAheadNs: snaps
      .reduce(
        (m, s) =>
          BigInt(s.queues.readAheadDurationNs) > m ? BigInt(s.queues.readAheadDurationNs) : m,
        0n,
      )
      .toString(),
    currentFileSourceIds: snaps.map((s) => s.descriptor.identity.sourceId).sort(),
    ...(lastFileEvent ? { lastFileEvent } : {}),
    fileHealthSummary: snaps.reduce(
      (r, s) => ({ ...r, [s.health.sourceHealth]: (r[s.health.sourceHealth] ?? 0) + 1 }),
      {} as Record<string, number>,
    ),
  });
}
export function evaluateFileWatchdog(snapshot: FileSourceSnapshot): readonly string[] {
  const incidents: string[] = [];
  if (!snapshot.health.available) incidents.push('FILE_SOURCE_MISSING');
  if (snapshot.queues.overflows > 0) incidents.push('FILE_QUEUE_OVERFLOW');
  if (snapshot.health.seekFailures > 0) incidents.push('FILE_SEEK_FAILED');
  if (snapshot.health.generationMismatchDrops > 0) incidents.push('FILE_GENERATION_MISMATCH');
  return freeze(incidents);
}
export function createFileDecoderAdapterBoundaries(): readonly FileDecoderAdapterBoundary[] {
  return freeze(
    [
      'FFMPEG',
      'GSTREAMER',
      'MEDIA_FOUNDATION',
      'AVFOUNDATION',
      'PLATFORM_NATIVE',
      'IMAGE_DECODER',
      'AUDIO_DECODER',
    ].map((adapterKind) => ({
      adapterKind: adapterKind as FileDecoderAdapterBoundary['adapterKind'],
      approved: false,
      notes: 'Boundary only; no decoder dependency is opened by v5.2.5.',
    })),
  );
}
