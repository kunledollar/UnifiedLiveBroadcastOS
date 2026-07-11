import { RuntimeEngineError, type FrameTick } from './execution-engine.js';
import {
  DeterministicSourceTimestampNormalizer,
  type MediaSource,
  type SourceDescriptor,
  type SourceDiscoveryRequest,
  type SourceOperationResult,
  type SourcePayloadRef,
  type SourcePermissionState,
  type SourceProvider,
  type SourceProviderContext,
  type SourceProviderDescriptor,
  type SourceRuntimeContext,
  type SourceSampleBatch,
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
const safe = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 32))
    out[k] =
      /secret|token|credential|password|path|url|handle|payload|pid|process|user|title/i.test(k)
        ? '<redacted>'
        : val && typeof val === 'object'
          ? '[redacted-object]'
          : val;
  return out;
};
const redactTitle = (s: string | undefined) => (s ? `redacted-title-${hash(s)}` : undefined);
const ns = (n: bigint | number | undefined, fallback = 0n) =>
  typeof n === 'bigint' ? n : typeof n === 'number' ? BigInt(Math.trunc(n)) : fallback;

export type ScreenCaptureTargetType =
  | 'DISPLAY'
  | 'WINDOW'
  | 'REGION'
  | 'VIRTUAL_DISPLAY'
  | 'SYNTHETIC_DISPLAY'
  | 'SYNTHETIC_WINDOW'
  | 'CUSTOM_TARGET'
  | 'BROWSER_TAB'
  | 'APPLICATION'
  | 'REMOTE_DESKTOP'
  | 'MOBILE_DEVICE_SCREEN';
export type ScreenLifecycleState =
  | 'DISCOVERED'
  | 'REGISTERED'
  | 'INITIALIZING'
  | 'READY'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'DEACTIVATING'
  | 'DISCONNECTING'
  | 'DISCONNECTED'
  | 'DEGRADED'
  | 'UNAVAILABLE'
  | 'RECONNECTING'
  | 'FAILED'
  | 'DISABLED'
  | 'STOPPED'
  | 'REMOVED';
export type ScreenCursorPolicy =
  'INCLUDE' | 'EXCLUDE' | 'AUTO' | 'SEPARATE_METADATA' | 'HIGHLIGHT_CLICKS';
export type ScreenScaleMode = 'NATIVE' | 'FIT' | 'FILL' | 'STRETCH' | 'INTEGER' | 'DOWNSCALE_ONLY';
export type ScreenRegionCoordinateSpace =
  'PHYSICAL_PIXELS' | 'LOGICAL_PIXELS' | 'NORMALIZED' | 'TARGET_RELATIVE';
export type ScreenRegionClampPolicy = 'CLAMP' | 'REJECT';
export type ScreenMinimizedBehavior =
  | 'PAUSE_CAPTURE'
  | 'RETURN_EMPTY'
  | 'KEEP_LAST_NOT_IN_SOURCE_LAYER'
  | 'MARK_UNAVAILABLE'
  | 'BACKEND_DEFINED';
export type ScreenOcclusionBehavior =
  'CAPTURE_IF_SUPPORTED' | 'MARK_DEGRADED' | 'RETURN_EMPTY' | 'BACKEND_DEFINED';
export type ScreenFrameOwnership =
  | 'OWNED_BY_BACKEND'
  | 'OWNED_BY_SOURCE'
  | 'OWNED_BY_RUNTIME'
  | 'BORROWED'
  | 'EXTERNAL_HANDLE'
  | 'RELEASED';
export type ScreenOverflowPolicy = 'DROP_OLDEST' | 'DROP_NEWEST' | 'KEEP_LATEST_VIDEO' | 'REJECT';
export type ScreenCommandType =
  | 'SCREEN_REGISTER'
  | 'SCREEN_DISCOVER_TARGETS'
  | 'SCREEN_OPEN'
  | 'SCREEN_START'
  | 'SCREEN_STOP'
  | 'SCREEN_CLOSE'
  | 'SCREEN_SET_TARGET'
  | 'SCREEN_SET_REGION'
  | 'SCREEN_SET_CURSOR_POLICY'
  | 'SCREEN_SET_FORMAT'
  | 'SCREEN_REFRESH_TARGETS'
  | 'SCREEN_RECONNECT'
  | 'SCREEN_ENABLE'
  | 'SCREEN_DISABLE';
export const SCREEN_COMMAND_TYPES = freeze([
  'SCREEN_REGISTER',
  'SCREEN_DISCOVER_TARGETS',
  'SCREEN_OPEN',
  'SCREEN_START',
  'SCREEN_STOP',
  'SCREEN_CLOSE',
  'SCREEN_SET_TARGET',
  'SCREEN_SET_REGION',
  'SCREEN_SET_CURSOR_POLICY',
  'SCREEN_SET_FORMAT',
  'SCREEN_REFRESH_TARGETS',
  'SCREEN_RECONNECT',
  'SCREEN_ENABLE',
  'SCREEN_DISABLE',
] as const);
export const SCREEN_EVENT_TYPES = freeze([
  'ScreenTargetDiscoveryStarted',
  'ScreenTargetDiscoveryCompleted',
  'ScreenTargetDiscovered',
  'ScreenTargetUpdated',
  'ScreenTargetRemoved',
  'ScreenSourceRegistered',
  'ScreenOpening',
  'ScreenOpened',
  'ScreenOpenFailed',
  'ScreenCaptureStarting',
  'ScreenCaptureStarted',
  'ScreenCaptureStopping',
  'ScreenCaptureStopped',
  'ScreenClosing',
  'ScreenClosed',
  'ScreenRegionChanged',
  'ScreenCursorPolicyChanged',
  'ScreenFormatChanged',
  'ScreenFrameReceived',
  'ScreenFramePublished',
  'ScreenFrameDropped',
  'ScreenFrameStale',
  'ScreenQueuePressure',
  'ScreenTargetMinimized',
  'ScreenTargetRestored',
  'ScreenTargetOccluded',
  'ScreenProtectedContentDetected',
  'ScreenPermissionChanged',
  'ScreenDisconnected',
  'ScreenReconnecting',
  'ScreenReconnected',
  'ScreenBackendFailed',
  'ScreenHealthChanged',
] as const);
export const SCREEN_WATCHDOG_INCIDENTS = freeze([
  'SCREEN_NO_FRAMES',
  'SCREEN_CAPTURE_STALLED',
  'SCREEN_TARGET_UNAVAILABLE',
  'SCREEN_TARGET_REMOVED',
  'SCREEN_PERMISSION_DENIED',
  'SCREEN_PROTECTED_CONTENT',
  'SCREEN_QUEUE_OVERFLOW',
  'SCREEN_FRAME_DROP_RATE_HIGH',
  'SCREEN_TIMESTAMP_UNSTABLE',
  'SCREEN_LATENCY_HIGH',
  'SCREEN_BACKEND_FAILED',
  'SCREEN_RECONNECT_EXHAUSTED',
  'SCREEN_GRAPH_MISMATCH',
  'SCREEN_INVARIANT_FAILURE',
] as const);

export class ScreenCaptureError extends RuntimeEngineError {
  constructor(code: string, msg: string, details: Record<string, unknown> = {}) {
    super(code, msg, safe(details));
  }
}
export class ScreenPermissionDeniedError extends ScreenCaptureError {
  constructor(id: string) {
    super('ScreenPermissionDenied', `Screen permission denied for ${id}`, { id });
  }
}
export class ScreenRegionInvalidError extends ScreenCaptureError {
  constructor(msg = 'Invalid screen region') {
    super('ScreenRegionInvalid', msg);
  }
}
export class ScreenRegionOutOfBoundsError extends ScreenCaptureError {
  constructor() {
    super('ScreenRegionOutOfBounds', 'Screen region is outside target bounds');
  }
}
export class ScreenCursorPolicyUnsupportedError extends ScreenCaptureError {
  constructor(p: string) {
    super('ScreenCursorPolicyUnsupported', `Screen cursor policy unsupported: ${p}`, { policy: p });
  }
}
export class ScreenOwnershipViolationError extends ScreenCaptureError {
  constructor(msg = 'Screen ownership violation') {
    super('ScreenOwnershipViolation', msg);
  }
}
export class ScreenLateFrameRejectedError extends ScreenCaptureError {
  constructor(id: string) {
    super('ScreenLateFrameRejected', `Late screen frame rejected for ${id}`, { id });
  }
}

export interface ScreenGeometry {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface ScreenCaptureRegion extends ScreenGeometry {
  readonly coordinateSpace: ScreenRegionCoordinateSpace;
  readonly unit: 'PIXELS' | 'FRACTION';
  readonly scaleBehavior: ScreenScaleMode;
  readonly clampPolicy: ScreenRegionClampPolicy;
  readonly relativeTo: 'TARGET' | 'DESKTOP';
}
export interface ScreenRegionSnapshot {
  readonly requested: ScreenCaptureRegion;
  readonly effective: ScreenCaptureRegion;
  readonly updatedAtNs: string;
}
export interface ScreenTargetIdentity {
  readonly targetId: string;
  readonly providerId: string;
  readonly targetType: ScreenCaptureTargetType;
  readonly persistentIdentity: string;
  readonly sessionIdentity: string;
  readonly displayId?: string | undefined;
  readonly windowIdHash?: string | undefined;
  readonly processIdentityHash?: string | undefined;
  readonly displayName?: string | undefined;
  readonly applicationName?: string | undefined;
  readonly geometry: ScreenGeometry;
  readonly scaleFactor: number;
  readonly rotation: number;
  readonly workspaceRef?: string | undefined;
  readonly firstSeenAtNs: string;
  readonly lastSeenAtNs: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ScreenCaptureTargetDescriptor {
  readonly identity: ScreenTargetIdentity;
  readonly targetType: ScreenCaptureTargetType;
  readonly providerId: string;
  readonly displayName?: string | undefined;
  readonly applicationName?: string | undefined;
  readonly available: boolean;
  readonly visible: boolean;
  readonly minimized: boolean;
  readonly occluded: boolean;
  readonly protectedContent: boolean;
  readonly capturable: boolean;
  readonly permissionState: SourcePermissionState;
  readonly geometry: ScreenGeometry;
  readonly pixelDimensions: { readonly width: number; readonly height: number };
  readonly logicalDimensions: { readonly width: number; readonly height: number };
  readonly scaleFactor: number;
  readonly rotation: number;
  readonly refreshRateSummary: string;
  readonly hdrSummary: string;
  readonly cursorCaptureSupported: readonly ScreenCursorPolicy[];
  readonly regionCaptureSupported: boolean;
  readonly alphaSupported: boolean;
  readonly colorSpaceSummary: string;
  readonly virtual: boolean;
  readonly physical: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ScreenTargetDiscoveryRequest {
  readonly targetTypes?: readonly ScreenCaptureTargetType[];
  readonly providerId?: string;
  readonly activeDisplayOnly?: boolean;
  readonly visibleWindowsOnly?: boolean;
  readonly capturableOnly?: boolean;
  readonly includeMinimizedWindows?: boolean;
  readonly includeProtectedContent?: boolean;
  readonly applicationName?: string | undefined;
  readonly currentWorkspaceOnly?: boolean;
  readonly permissionStates?: readonly SourcePermissionState[];
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal | undefined;
}
export interface ScreenTargetDiscoveryResult {
  readonly displays: readonly ScreenCaptureTargetDescriptor[];
  readonly windows: readonly ScreenCaptureTargetDescriptor[];
  readonly unavailableTargets: readonly ScreenCaptureTargetDescriptor[];
  readonly warnings: readonly string[];
  readonly providerErrors: readonly { readonly providerId: string; readonly error: string }[];
  readonly partial: boolean;
  readonly generation: number;
  readonly durationNs: string;
  readonly snapshotId: string;
}
export interface ScreenCaptureSourceDescriptor extends SourceDescriptor {
  readonly target: ScreenCaptureTargetDescriptor;
  readonly targetType: ScreenCaptureTargetType;
  readonly cursorPolicy: ScreenCursorPolicy;
  readonly region?: ScreenCaptureRegion | undefined;
  readonly scaleMode: ScreenScaleMode;
  readonly resizeBehavior: 'ADAPT' | 'KEEP_FORMAT' | 'FAIL';
  readonly minimizedBehavior: ScreenMinimizedBehavior;
  readonly occlusionBehavior: ScreenOcclusionBehavior;
}
export interface ScreenBackendHealthSnapshot {
  readonly backendId: string;
  readonly available: boolean;
  readonly open: boolean;
  readonly capturing: boolean;
  readonly targetsKnown: number;
  readonly framesProduced: number;
  readonly framesReleased: number;
  readonly lateCallbacks: number;
  readonly lastError?: string | undefined;
  readonly updatedAtNs: string;
}
export interface ScreenProviderContext extends SourceProviderContext {}
export interface ScreenBackendContext {
  readonly nowNs: () => bigint;
  readonly signal?: AbortSignal | undefined;
  readonly generation?: number | undefined;
}
export interface ScreenCaptureConnectionContext extends ScreenBackendContext {}
export interface ScreenCaptureRuntimeContext extends ScreenBackendContext {
  readonly frameTick?: FrameTick;
}
export interface ScreenBackendOpenRequest {
  readonly descriptor: ScreenCaptureSourceDescriptor;
  readonly format?: SourceVideoFormat | undefined;
  readonly region?: ScreenCaptureRegion | undefined;
  readonly cursorPolicy?: ScreenCursorPolicy | undefined;
}
export interface ScreenBackendOpenResult {
  readonly ok: boolean;
  readonly descriptor: ScreenCaptureSourceDescriptor;
  readonly selectedFormat: SourceVideoFormat;
  readonly effectiveRegion?: ScreenCaptureRegion | undefined;
  readonly error?: string | undefined;
}
export interface ScreenCaptureOpenRequest extends Omit<ScreenBackendOpenRequest, 'descriptor'> {
  readonly sourceId?: string;
}
export interface ScreenCaptureOpenResult extends SourceOperationResult {
  readonly selectedFormat?: SourceVideoFormat | undefined;
  readonly effectiveRegion?: ScreenCaptureRegion | undefined;
}
export interface ScreenCaptureOperationResult extends SourceOperationResult {}
export interface ScreenRegionUpdateRequest {
  readonly sourceId: string;
  readonly region: ScreenCaptureRegion;
  readonly expectedGeneration?: number;
}
export interface ScreenRegionUpdateResult extends ScreenCaptureOperationResult {
  readonly requestedRegion?: ScreenCaptureRegion;
  readonly effectiveRegion?: ScreenCaptureRegion | undefined;
}
export interface ScreenCursorPolicyRequest {
  readonly sourceId: string;
  readonly cursorPolicy: ScreenCursorPolicy;
  readonly expectedGeneration?: number;
}
export interface ScreenBackendFrame {
  readonly targetId: string;
  readonly sequenceNumber: bigint;
  readonly sourceTimestampNs?: bigint | undefined;
  readonly durationNs?: bigint | undefined;
  readonly format?: SourceVideoFormat | undefined;
  readonly payload: SourcePayloadRef;
  readonly cursorIncluded?: boolean;
  readonly minimized?: boolean;
  readonly occluded?: boolean;
  readonly protectedContent?: boolean;
  readonly discontinuity?: boolean;
  readonly corrupted?: boolean;
  readonly droppedBefore?: number;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly release?: (() => void) | undefined;
}
export type ScreenFrameCallback = (frame: ScreenBackendFrame) => void;
export type ScreenTargetChangedCallback = (
  target: ScreenCaptureTargetDescriptor,
  reason: string,
) => void;
export type ScreenBackendErrorCallback = (error: ScreenCaptureError) => void;
export interface ScreenCaptureBackend {
  readonly backendId: string;
  discover(
    request: ScreenTargetDiscoveryRequest,
    context: ScreenBackendContext,
  ): Promise<ScreenTargetDiscoveryResult>;
  open(
    request: ScreenBackendOpenRequest,
    context: ScreenBackendContext,
  ): Promise<ScreenBackendOpenResult>;
  start(
    onFrame: ScreenFrameCallback,
    onTargetChanged: ScreenTargetChangedCallback,
    onError: ScreenBackendErrorCallback,
    context: ScreenBackendContext,
  ): Promise<void>;
  updateRegion?(
    request: ScreenRegionUpdateRequest,
    context: ScreenBackendContext,
  ): Promise<ScreenRegionUpdateResult>;
  updateCursorPolicy?(
    request: ScreenCursorPolicyRequest,
    context: ScreenBackendContext,
  ): Promise<void>;
  stop(context: ScreenBackendContext): Promise<void>;
  close(context: ScreenBackendContext): Promise<void>;
  getHealth(): Readonly<ScreenBackendHealthSnapshot>;
}
export interface ScreenCaptureProvider extends SourceProvider {
  discoverTargets(
    request: ScreenTargetDiscoveryRequest,
    context: ScreenProviderContext,
  ): Promise<ScreenTargetDiscoveryResult>;
  createScreenSource(
    descriptor: ScreenCaptureSourceDescriptor,
    context: ScreenProviderContext,
  ): Promise<ScreenCaptureSource>;
  getBackendHealth(): Readonly<ScreenBackendHealthSnapshot>;
}
export interface ScreenCaptureSource extends MediaSource {
  readonly descriptor: ScreenCaptureSourceDescriptor;
  open(
    request: ScreenCaptureOpenRequest,
    context: ScreenCaptureConnectionContext,
  ): Promise<ScreenCaptureOpenResult>;
  startCapture(context: ScreenCaptureRuntimeContext): Promise<ScreenCaptureOperationResult>;
  updateRegion?(
    request: ScreenRegionUpdateRequest,
    context: ScreenCaptureRuntimeContext,
  ): Promise<ScreenRegionUpdateResult>;
  updateCursorPolicy?(
    request: ScreenCursorPolicyRequest,
    context: ScreenCaptureRuntimeContext,
  ): Promise<ScreenCaptureOperationResult>;
  stopCapture(context: ScreenCaptureRuntimeContext): Promise<ScreenCaptureOperationResult>;
  close(context: ScreenCaptureConnectionContext): Promise<ScreenCaptureOperationResult>;
}
export interface ScreenQueueConfiguration {
  readonly maximumFrames: number;
  readonly highWaterMark: number;
  readonly lowWaterMark: number;
  readonly overflowPolicy: ScreenOverflowPolicy;
  readonly maximumFrameAgeNs: bigint;
  readonly targetLatencyFrames: number;
  readonly preserveLatestFrame: boolean;
  readonly releaseDroppedFrames: boolean;
}
export const defaultScreenQueueConfiguration: ScreenQueueConfiguration = freeze({
  maximumFrames: 4,
  highWaterMark: 3,
  lowWaterMark: 1,
  overflowPolicy: 'KEEP_LATEST_VIDEO',
  maximumFrameAgeNs: 1_000_000_000n,
  targetLatencyFrames: 1,
  preserveLatestFrame: true,
  releaseDroppedFrames: true,
});

export class ScreenFrameHandle {
  private released = false;
  constructor(
    readonly handleId: string,
    private readonly onRelease: () => void = () => {},
  ) {}
  release() {
    if (this.released)
      throw new ScreenOwnershipViolationError('Screen frame handle double release');
    this.released = true;
    this.onRelease();
  }
  get isReleased() {
    return this.released;
  }
}
export interface ScreenFrameEnvelope extends VideoFrameEnvelope {
  readonly targetId: string;
  readonly captureGeometry: ScreenGeometry;
  readonly effectiveRegion?: ScreenCaptureRegion | undefined;
  readonly scaleFactor: number;
  readonly rotation: number;
  readonly cursorIncluded: boolean;
  readonly minimized: boolean;
  readonly occluded: boolean;
  readonly protectedContent: boolean;
  readonly captureReceivedAtNs: bigint;
  readonly backendId: string;
  readonly ownership: ScreenFrameOwnership;
}
export interface ScreenQueueSnapshot {
  readonly depth: number;
  readonly maximumFrames: number;
  readonly enqueued: number;
  readonly dequeued: number;
  readonly droppedOldest: number;
  readonly droppedNewest: number;
  readonly droppedStale: number;
  readonly rejected: number;
  readonly highWaterEvents: number;
  readonly maximumDepth: number;
  readonly oldestFrameAgeNs: string;
}

export class ScreenFrameQueue {
  private frames: ScreenFrameEnvelope[] = [];
  enqueued = 0;
  dequeued = 0;
  droppedOldest = 0;
  droppedNewest = 0;
  droppedStale = 0;
  rejected = 0;
  highWaterEvents = 0;
  maximumDepth = 0;
  constructor(
    readonly config: ScreenQueueConfiguration = defaultScreenQueueConfiguration,
    private readonly releaseFrame: (f: ScreenFrameEnvelope) => void = () => {},
  ) {
    if (config.maximumFrames <= 0)
      throw new ScreenCaptureError(
        'ScreenQueueInvalid',
        'Screen queue must be bounded and positive',
      );
  }
  enqueue(frame: ScreenFrameEnvelope) {
    this.dropStale(frame.captureReceivedAtNs);
    if (this.frames.length >= this.config.maximumFrames) {
      if (this.config.overflowPolicy === 'DROP_NEWEST' || this.config.overflowPolicy === 'REJECT') {
        this.droppedNewest++;
        this.rejected++;
        this.releaseFrame(frame);
        return false;
      }
      if (this.config.overflowPolicy === 'KEEP_LATEST_VIDEO') {
        for (const old of this.frames.splice(0)) {
          this.droppedOldest++;
          this.releaseFrame(old);
        }
      } else {
        const old = this.frames.shift();
        if (old) {
          this.droppedOldest++;
          this.releaseFrame(old);
        }
      }
    }
    this.frames.push(freeze(clone(frame)) as ScreenFrameEnvelope);
    this.enqueued++;
    if (this.frames.length >= this.config.highWaterMark) this.highWaterEvents++;
    this.maximumDepth = Math.max(this.maximumDepth, this.frames.length);
    return true;
  }
  select(tickNs: bigint, generation: number) {
    this.dropStale(tickNs);
    let index = -1;
    for (let i = 0; i < this.frames.length; i++) {
      const f = this.frames[i]!;
      if ((f.metadata.generation as number) !== generation) {
        this.rejected++;
        this.releaseFrame(f);
        this.frames.splice(i--, 1);
        continue;
      }
      if (f.presentationTimestampNs <= tickNs) index = i;
    }
    if (index < 0) return undefined;
    const [selected] = this.frames.splice(index, 1);
    const f = selected!;
    this.dequeued++;
    for (let i = 0; i < index; i++) {
      const old = this.frames.shift();
      if (old) {
        this.droppedOldest++;
        this.releaseFrame(old);
      }
    }
    return f;
  }
  clear() {
    for (const f of this.frames.splice(0)) this.releaseFrame(f);
  }
  snapshot(now = 0n): Readonly<ScreenQueueSnapshot> {
    const oldest = this.frames[0];
    return freeze({
      depth: this.frames.length,
      maximumFrames: this.config.maximumFrames,
      enqueued: this.enqueued,
      dequeued: this.dequeued,
      droppedOldest: this.droppedOldest,
      droppedNewest: this.droppedNewest,
      droppedStale: this.droppedStale,
      rejected: this.rejected,
      highWaterEvents: this.highWaterEvents,
      maximumDepth: this.maximumDepth,
      oldestFrameAgeNs: oldest ? (now - oldest.captureReceivedAtNs).toString() : '0',
    });
  }
  private dropStale(now: bigint) {
    for (let i = 0; i < this.frames.length; i++)
      if (now - this.frames[i]!.captureReceivedAtNs > this.config.maximumFrameAgeNs) {
        const [stale] = this.frames.splice(i--, 1);
        const f = stale!;
        this.droppedStale++;
        this.releaseFrame(f);
      }
  }
}

export interface ScreenCaptureHealthSnapshot {
  readonly sourceId: string;
  readonly targetId: string;
  readonly targetType: ScreenCaptureTargetType;
  readonly lifecycleState: ScreenLifecycleState;
  readonly healthState:
    | 'UNKNOWN'
    | 'HEALTHY'
    | 'DEGRADED'
    | 'UNHEALTHY'
    | 'RECONNECTING'
    | 'UNAVAILABLE'
    | 'FAILED'
    | 'DISABLED'
    | 'STOPPED';
  readonly connected: boolean;
  readonly active: boolean;
  readonly available: boolean;
  readonly permissionState: SourcePermissionState;
  readonly visible: boolean;
  readonly minimized: boolean;
  readonly occluded: boolean;
  readonly protectedContent: boolean;
  readonly selectedFormat?: SourceVideoFormat | undefined;
  readonly effectiveRegion?: ScreenCaptureRegion | undefined;
  readonly backendId: string;
  readonly lastFrameSequence?: string;
  readonly lastSourceTimestamp?: string;
  readonly lastNormalizedTimestamp?: string;
  readonly lastFrameReceived?: string;
  readonly lastFramePublished?: string;
  readonly queueDepth: number;
  readonly maximumQueueDepth: number;
  readonly droppedFrames: number;
  readonly staleFrames: number;
  readonly corruptedFrames: number;
  readonly sequenceGaps: number;
  readonly timestampRegressions: number;
  readonly discontinuities: number;
  readonly targetChanges: number;
  readonly geometryChanges: number;
  readonly permissionFailures: number;
  readonly backendErrors: number;
  readonly reconnectAttempts: number;
  readonly consecutiveFailures: number;
  readonly lastError?: string | undefined;
  readonly updatedAtNs: string;
}
export interface ScreenCaptureSourceSnapshot {
  readonly descriptor: ScreenCaptureSourceDescriptor;
  readonly lifecycleState: ScreenLifecycleState;
  readonly health: ScreenCaptureHealthSnapshot;
  readonly queue: ScreenQueueSnapshot;
  readonly generation: number;
  readonly open: boolean;
  readonly capturing: boolean;
  readonly generatedAtNs: string;
}
export interface ScreenTelemetrySnapshot {
  readonly registeredScreenSourceCount: number;
  readonly openScreenSourceCount: number;
  readonly activeScreenSourceCount: number;
  readonly displaySourceCount: number;
  readonly windowSourceCount: number;
  readonly regionSourceCount: number;
  readonly degradedScreenSourceCount: number;
  readonly unavailableScreenSourceCount: number;
  readonly failedScreenSourceCount: number;
  readonly totalScreenFramesReceived: number;
  readonly totalScreenFramesPublished: number;
  readonly totalScreenFramesDropped: number;
  readonly totalScreenFramesStale: number;
  readonly totalScreenFramesCorrupted: number;
  readonly totalScreenSequenceGaps: number;
  readonly totalScreenTimestampRegressions: number;
  readonly totalScreenDiscontinuities: number;
  readonly totalScreenQueueOverflows: number;
  readonly totalTargetChanges: number;
  readonly totalGeometryChanges: number;
  readonly totalPermissionFailures: number;
  readonly totalBackendFailures: number;
  readonly averageScreenLatencyNs: string;
  readonly maximumScreenLatencyNs: string;
  readonly averageScreenJitterNs: string;
  readonly maximumScreenQueueDepth: number;
  readonly currentScreenSourceIds: readonly string[];
  readonly lastScreenEvent?: string | undefined;
  readonly screenHealthSummary: Readonly<Record<string, number>>;
}
export interface ScreenProviderSnapshot {
  readonly descriptor: SourceProviderDescriptor;
  readonly backend: ScreenBackendHealthSnapshot;
  readonly generatedAtNs: string;
}
export type ScreenTargetSnapshot = ScreenCaptureTargetDescriptor;
export type ScreenTargetDiscoverySnapshot = ScreenTargetDiscoveryResult;

const videoFormat = (id: string, width: number, height: number, fps = 30): SourceVideoFormat =>
  freeze({
    kind: 'VIDEO',
    id,
    width,
    height,
    frameRate: { numerator: fps, denominator: 1 },
    pixelFormat: 'BGRA',
    colorSpace: 'BT709',
    colorRange: 'FULL',
    transferCharacteristic: 'SRGB',
    chromaSubsampling: '4:4:4',
    scan: 'PROGRESSIVE',
    fieldOrder: 'NONE',
    aspectRatio: `${width}:${height}`,
    alpha: true,
    bitDepth: 8,
    rotation: 0,
    memoryDomain: 'OPAQUE',
    hardwareAcceleration: 'NONE',
    latencyClass: 'REALTIME',
  });
export const createScreenVideoFormat = videoFormat;
const targetOrder = (t: ScreenCaptureTargetDescriptor) =>
  `${t.targetType}|${t.providerId}|${t.applicationName ?? t.displayName ?? ''}|${t.identity.persistentIdentity}|${t.identity.targetId}`;
export const sortScreenTargets = <T extends ScreenCaptureTargetDescriptor>(targets: readonly T[]) =>
  [...targets].sort((a, b) => targetOrder(a).localeCompare(targetOrder(b)));
export const validateScreenRegion = (
  region: ScreenCaptureRegion,
  target: ScreenGeometry,
): ScreenCaptureRegion => {
  if (region.width <= 0 || region.height <= 0)
    throw new ScreenRegionInvalidError('Screen region dimensions must be positive');
  let r = { ...region };
  const maxW = region.coordinateSpace === 'NORMALIZED' ? 1 : target.width;
  const maxH = region.coordinateSpace === 'NORMALIZED' ? 1 : target.height;
  const outside = r.x < 0 || r.y < 0 || r.x + r.width > maxW || r.y + r.height > maxH;
  if (outside && region.clampPolicy === 'REJECT') throw new ScreenRegionOutOfBoundsError();
  if (outside)
    r = {
      ...r,
      x: Math.max(0, Math.min(r.x, maxW)),
      y: Math.max(0, Math.min(r.y, maxH)),
      width: Math.max(1, Math.min(r.width, maxW - Math.max(0, r.x))),
      height: Math.max(1, Math.min(r.height, maxH - Math.max(0, r.y))),
    };
  return freeze(r);
};
export const negotiateScreenFormat = (
  formats: readonly SourceVideoFormat[],
  req: {
    preferredWidth?: number;
    preferredHeight?: number;
    maximumWidth?: number;
    maximumHeight?: number;
    preferredFrameRate?: number;
    preferredPixelFormat?: string;
    requireAlpha?: boolean;
  } = {},
) => {
  const rejected: { formatId: string; reason: string }[] = [];
  const c = formats
    .filter((f) => {
      const ok =
        (!req.maximumWidth || f.width <= req.maximumWidth) &&
        (!req.maximumHeight || f.height <= req.maximumHeight) &&
        (!req.preferredPixelFormat || f.pixelFormat === req.preferredPixelFormat) &&
        (!req.requireAlpha || f.alpha);
      if (!ok) rejected.push({ formatId: f.id, reason: 'required constraint mismatch' });
      return ok;
    })
    .sort(
      (a, b) =>
        Math.abs(a.width - (req.preferredWidth ?? a.width)) +
          Math.abs(a.height - (req.preferredHeight ?? a.height)) -
          (Math.abs(b.width - (req.preferredWidth ?? b.width)) +
            Math.abs(b.height - (req.preferredHeight ?? b.height))) ||
        Math.abs(a.frameRate.numerator / a.frameRate.denominator - (req.preferredFrameRate ?? 30)) -
          Math.abs(
            b.frameRate.numerator / b.frameRate.denominator - (req.preferredFrameRate ?? 30),
          ) ||
        a.pixelFormat.localeCompare(b.pixelFormat) ||
        a.id.localeCompare(b.id),
    );
  return freeze({
    ok: c.length > 0,
    selectedFormat: c[0],
    effectiveTargetGeometry: c[0]
      ? { x: 0, y: 0, width: c[0].width, height: c[0].height }
      : undefined,
    explanation: c[0]
      ? ['selected deterministic compatible screen format']
      : ['no compatible screen format'],
    fallback: c[0] && c[0] !== formats[0],
    rejectedFormats: rejected,
    estimatedBandwidth: c[0]
      ? c[0].width * c[0].height * 4 * (c[0].frameRate.numerator / c[0].frameRate.denominator)
      : 0,
    estimatedMemoryRate: c[0] ? c[0].width * c[0].height * 4 : 0,
  });
};

export class DefaultScreenCaptureSource implements ScreenCaptureSource {
  private state: ScreenLifecycleState = 'REGISTERED';
  private opened = false;
  private capturing = false;
  private generation = 0;
  private selectedFormat: SourceVideoFormat;
  private effectiveRegion: ScreenCaptureRegion | undefined;
  private normalizer = new DeterministicSourceTimestampNormalizer();
  private readonly queue: ScreenFrameQueue;
  private stats = {
    received: 0,
    published: 0,
    corrupted: 0,
    permissionFailures: 0,
    backendErrors: 0,
    targetChanges: 0,
    geometryChanges: 0,
  };
  private lastSeq: bigint | undefined;
  private lastPublishedTick: bigint | undefined;
  private operationSerial = 0;
  private readonly frameReleases = new Map<string, () => void>();
  private readonly releasedHandles = new Set<string>();
  private lastBackendContext: ScreenBackendContext | undefined;
  constructor(
    readonly descriptor: ScreenCaptureSourceDescriptor,
    private readonly backend: ScreenCaptureBackend,
    queueConfig: ScreenQueueConfiguration = defaultScreenQueueConfiguration,
  ) {
    this.selectedFormat = descriptor.defaultFormat as SourceVideoFormat;
    this.effectiveRegion =
      descriptor.region && validateScreenRegion(descriptor.region, descriptor.target.geometry);
    this.queue = new ScreenFrameQueue(queueConfig, (f) => this.releaseFrame(f));
  }
  async initialize(ctx: SourceRuntimeContext) {
    this.state = 'READY';
    return this.result(ctx);
  }
  async connect(ctx: SourceRuntimeContext) {
    return this.open({}, ctx);
  }
  async activate(ctx: SourceRuntimeContext) {
    return this.startCapture(ctx);
  }
  async deactivate(ctx: SourceRuntimeContext) {
    return this.stopCapture(ctx);
  }
  async disconnect(ctx: SourceRuntimeContext) {
    return this.close(ctx);
  }
  async shutdown(ctx: SourceRuntimeContext) {
    await this.close(ctx);
    this.state = 'STOPPED';
    return this.result(ctx);
  }
  async open(
    req: ScreenCaptureOpenRequest,
    ctx: ScreenCaptureConnectionContext,
  ): Promise<ScreenCaptureOpenResult> {
    if (this.opened) {
      return this.openResult(ctx);
    }
    const op = ++this.operationSerial;
    if (
      this.descriptor.permissionState === 'DENIED' ||
      this.descriptor.permissionState === 'RESTRICTED'
    ) {
      this.stats.permissionFailures++;
      throw new ScreenPermissionDeniedError(this.descriptor.id);
    }
    this.state = 'CONNECTING';
    const openReq: ScreenBackendOpenRequest = {
      descriptor: this.descriptor,
      cursorPolicy: req.cursorPolicy ?? this.descriptor.cursorPolicy,
    };
    if (req.format) (openReq as { format: SourceVideoFormat }).format = req.format;
    const requestedRegion = req.region ?? this.descriptor.region;
    if (requestedRegion) (openReq as { region: ScreenCaptureRegion }).region = requestedRegion;
    const r = await this.backend.open(openReq, ctx);
    if (op !== this.operationSerial || this.isTerminal()) return this.openResult(ctx);
    if (!r.ok) {
      this.state = 'FAILED';
      throw new ScreenCaptureError('ScreenOpenFailed', r.error ?? 'Screen open failed');
    }
    this.selectedFormat = r.selectedFormat;
    this.effectiveRegion = r.effectiveRegion;
    this.opened = true;
    this.state = 'CONNECTED';
    return this.openResult(ctx);
  }
  async startCapture(ctx: ScreenCaptureRuntimeContext) {
    const op = ++this.operationSerial;
    if (!this.opened)
      throw new ScreenCaptureError('ScreenNotOpen', 'Screen source must be open before start');
    if (this.capturing) return this.result(ctx);
    this.state = 'ACTIVATING';
    const gen = ++this.generation;
    this.lastBackendContext = ctx;
    await this.backend.start(
      (f) => this.onFrame(f, gen, ctx),
      (t, reason) => this.onTargetChanged(t, reason),
      (e) => {
        this.stats.backendErrors++;
        this.state = 'FAILED';
      },
      ctx,
    );
    if (op !== this.operationSerial || !this.opened || this.isTerminal()) {
      await this.backend.stop(ctx);
      return this.result(ctx);
    }
    this.capturing = true;
    this.state = 'ACTIVE';
    return this.result(ctx);
  }
  async stopCapture(ctx: ScreenCaptureRuntimeContext) {
    const op = ++this.operationSerial;
    if (!this.capturing) return this.result(ctx);
    this.state = 'DEACTIVATING';
    this.capturing = false;
    this.generation++;
    await this.backend.stop(ctx);
    this.queue.clear();
    this.releaseAllFrames();
    if (op !== this.operationSerial && this.state !== 'DEACTIVATING') return this.result(ctx);
    this.state = this.opened ? 'CONNECTED' : 'DISCONNECTED';
    return this.result(ctx);
  }
  async close(ctx: ScreenCaptureConnectionContext) {
    const op = ++this.operationSerial;
    if (this.capturing) await this.stopCapture(ctx);
    if (!this.opened) {
      this.queue.clear();
      this.releaseAllFrames();
      this.state = 'DISCONNECTED';
      return this.result(ctx);
    }
    this.state = 'DISCONNECTING';
    this.opened = false;
    this.generation++;
    await this.backend.close(ctx);
    this.queue.clear();
    this.releaseAllFrames();
    if (op !== this.operationSerial && this.state !== 'DISCONNECTING') return this.result(ctx);
    this.state = 'DISCONNECTED';
    return this.result(ctx);
  }
  async updateRegion(req: ScreenRegionUpdateRequest, ctx: ScreenCaptureRuntimeContext) {
    const op = ++this.operationSerial;
    if (req.expectedGeneration !== undefined && req.expectedGeneration !== this.generation)
      throw new ScreenCaptureError('ScreenLateFrameRejected', 'Screen region generation mismatch');
    const effective = validateScreenRegion(req.region, this.descriptor.target.geometry);
    const r = this.backend.updateRegion
      ? await this.backend.updateRegion({ ...req, region: effective }, ctx)
      : { ...this.result(ctx), requestedRegion: req.region, effectiveRegion: effective };
    if (op !== this.operationSerial || this.isTerminal()) return r;
    this.effectiveRegion = r.effectiveRegion ?? effective;
    this.generation++;
    this.queue.clear();
    this.releaseAllFrames();
    return r;
  }
  async updateFormat(format: SourceVideoFormat, ctx: ScreenCaptureRuntimeContext) {
    const op = ++this.operationSerial;
    if (!this.descriptor.supportedFormats.some((f) => f.kind === 'VIDEO' && f.id === format.id))
      throw new ScreenCaptureError('ScreenFormatUnsupported', 'Screen format is not supported');
    if (op !== this.operationSerial || this.isTerminal()) return this.result(ctx);
    this.selectedFormat = format;
    this.generation++;
    this.normalizer.reset('DISCONTINUITY');
    this.queue.clear();
    this.releaseAllFrames();
    return this.result(ctx);
  }
  async updateCursorPolicy(req: ScreenCursorPolicyRequest, ctx: ScreenCaptureRuntimeContext) {
    const op = ++this.operationSerial;
    if (!this.descriptor.target.cursorCaptureSupported.includes(req.cursorPolicy))
      throw new ScreenCursorPolicyUnsupportedError(req.cursorPolicy);
    if (this.backend.updateCursorPolicy) await this.backend.updateCursorPolicy(req, ctx);
    if (op !== this.operationSerial || this.isTerminal()) return this.result(ctx);
    this.generation++;
    this.queue.clear();
    this.releaseAllFrames();
    return this.result(ctx);
  }
  async pull(
    request: { frameNumber: bigint; scheduledTimeNs: bigint },
    ctx: SourceRuntimeContext,
  ): Promise<SourceSampleBatch> {
    if (
      !this.capturing ||
      this.state !== 'ACTIVE' ||
      (this.descriptor.target.minimized && this.descriptor.minimizedBehavior === 'PAUSE_CAPTURE')
    )
      return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    if (this.lastPublishedTick === request.frameNumber)
      return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    const f = this.queue.select(request.scheduledTimeNs, this.generation);
    if (!f) return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    this.lastPublishedTick = request.frameNumber;
    this.stats.published++;
    this.releaseFrame(f);
    return freeze({ videoFrames: [f], audioBuffers: [], metadataSamples: [] });
  }
  getSnapshot(
    nowNs: () => bigint = () => BigInt(Date.now()) * 1_000_000n,
  ): Readonly<ScreenCaptureSourceSnapshot> {
    const now = nowNs();
    return freeze({
      descriptor: this.descriptor,
      lifecycleState: this.state,
      health: this.health(now),
      queue: this.queue.snapshot(now),
      generation: this.generation,
      open: this.opened,
      capturing: this.capturing,
      generatedAtNs: now.toString(),
    });
  }
  assertInvariants() {
    if (this.capturing && !this.opened)
      throw new ScreenCaptureError('ScreenInvariantViolation', 'Capturing source is not open');
    if (this.queue.snapshot().depth > this.queue.config.maximumFrames)
      throw new ScreenCaptureError('ScreenInvariantViolation', 'Screen queue over capacity');
    if (!this.capturing && this.frameReleases.size > 0)
      throw new ScreenCaptureError(
        'ScreenInvariantViolation',
        'Stopped screen source retained handles',
      );
  }
  private onFrame(frame: ScreenBackendFrame, generation: number, ctx: ScreenBackendContext) {
    if (!this.capturing || generation !== this.generation) {
      frame.release?.();
      return;
    }
    const now = ctx.nowNs();
    const seq = frame.sequenceNumber;
    const sourceTs = frame.sourceTimestampNs ?? now;
    const norm = this.normalizer.normalize(
      frame.discontinuity
        ? {
            sourceId: this.descriptor.id,
            clockDomain: this.descriptor.clockDomain,
            timestampNs: sourceTs,
            sequenceNumber: seq,
            discontinuity: true,
          }
        : {
            sourceId: this.descriptor.id,
            clockDomain: this.descriptor.clockDomain,
            timestampNs: sourceTs,
            sequenceNumber: seq,
          },
      undefined,
    );
    if (frame.release) this.frameReleases.set(frame.payload.handleId, frame.release);
    const env: ScreenFrameEnvelope = freeze({
      sourceId: this.descriptor.id,
      streamId: `${this.descriptor.id}:video`,
      targetId: frame.targetId,
      sequenceNumber: seq,
      sourceTimestampNs: sourceTs,
      normalizedTimestampNs: norm.normalizedTimestampNs,
      durationNs: frame.durationNs ?? 33_333_333n,
      presentationTimestampNs: norm.normalizedTimestampNs,
      format: frame.format ?? this.selectedFormat,
      keyFrame: true,
      discontinuity: !!frame.discontinuity || norm.sequenceGap,
      corrupted: !!frame.corrupted,
      droppedBefore: frame.droppedBefore ?? 0,
      memoryDomain: (frame.format ?? this.selectedFormat).memoryDomain,
      payload: frame.payload,
      metadata: safe({ ...frame.metadata, generation }),
      captureGeometry: this.descriptor.target.geometry,
      effectiveRegion: this.effectiveRegion,
      scaleFactor: this.descriptor.target.scaleFactor,
      rotation: this.descriptor.target.rotation,
      cursorIncluded: !!frame.cursorIncluded,
      minimized: !!frame.minimized,
      occluded: !!frame.occluded,
      protectedContent: !!frame.protectedContent,
      captureReceivedAtNs: now,
      backendId: this.backend.backendId,
      ownership: 'OWNED_BY_SOURCE',
    });
    this.stats.received++;
    if (frame.corrupted) this.stats.corrupted++;
    if (this.lastSeq !== undefined && seq !== this.lastSeq + 1n && !frame.discontinuity) {
      /* counted by normalizer */
    }
    this.lastSeq = seq;
    this.queue.enqueue(env);
  }
  private onTargetChanged(target: ScreenCaptureTargetDescriptor, reason: string) {
    this.stats.targetChanges++;
    if (/geometry|dpi|rotation|resize/i.test(reason)) this.stats.geometryChanges++;
    if (!target.available || !target.capturable) {
      this.state = 'UNAVAILABLE';
      this.capturing = false;
      this.opened = false;
      this.generation++;
      this.operationSerial++;
      this.queue.clear();
      this.releaseAllFrames();
      void this.backend.close(
        this.lastBackendContext ?? { nowNs: () => BigInt(Date.now()) * 1_000_000n },
      );
    }
  }
  private health(now: bigint): ScreenCaptureHealthSnapshot {
    const q = this.queue.snapshot(now);
    const h: ScreenCaptureHealthSnapshot = {
      sourceId: this.descriptor.id,
      targetId: this.descriptor.target.identity.targetId,
      targetType: this.descriptor.targetType,
      lifecycleState: this.state,
      healthState:
        this.state === 'FAILED'
          ? 'FAILED'
          : this.state === 'UNAVAILABLE'
            ? 'UNAVAILABLE'
            : q.droppedOldest + q.droppedNewest + q.droppedStale > 0
              ? 'DEGRADED'
              : this.capturing
                ? 'HEALTHY'
                : 'UNKNOWN',
      connected: this.opened,
      active: this.capturing,
      available: this.descriptor.target.available,
      permissionState: this.descriptor.permissionState,
      visible: this.descriptor.target.visible,
      minimized: this.descriptor.target.minimized,
      occluded: this.descriptor.target.occluded,
      protectedContent: this.descriptor.target.protectedContent,
      selectedFormat: this.selectedFormat,
      backendId: this.backend.backendId,
      queueDepth: q.depth,
      maximumQueueDepth: q.maximumDepth,
      droppedFrames: q.droppedOldest + q.droppedNewest,
      staleFrames: q.droppedStale,
      corruptedFrames: this.stats.corrupted,
      sequenceGaps: this.normalizer.getSnapshot().sequenceGaps,
      timestampRegressions: this.normalizer.getSnapshot().regressions,
      discontinuities: this.normalizer.getSnapshot().discontinuities,
      targetChanges: this.stats.targetChanges,
      geometryChanges: this.stats.geometryChanges,
      permissionFailures: this.stats.permissionFailures,
      backendErrors: this.stats.backendErrors,
      reconnectAttempts: 0,
      consecutiveFailures: 0,
      updatedAtNs: now.toString(),
    };
    if (this.effectiveRegion)
      (h as { effectiveRegion: ScreenCaptureRegion }).effectiveRegion = this.effectiveRegion;
    if (this.lastSeq !== undefined)
      (h as { lastFrameSequence: string }).lastFrameSequence = this.lastSeq.toString();
    return freeze(h);
  }
  getRetainedHandleCount() {
    return this.frameReleases.size;
  }
  private releaseFrame(frame: ScreenFrameEnvelope) {
    const release = this.frameReleases.get(frame.payload.handleId);
    if (!release) return;
    this.frameReleases.delete(frame.payload.handleId);
    this.releasedHandles.add(frame.payload.handleId);
    release();
  }
  private releaseAllFrames() {
    for (const [handleId, release] of [...this.frameReleases.entries()]) {
      this.frameReleases.delete(handleId);
      this.releasedHandles.add(handleId);
      release();
    }
  }
  private isTerminal() {
    return ['DISCONNECTED', 'STOPPED', 'REMOVED', 'FAILED', 'UNAVAILABLE'].includes(this.state);
  }
  private openResult(ctx: { nowNs: () => bigint }): ScreenCaptureOpenResult {
    const out: ScreenCaptureOpenResult = {
      ...this.result(ctx),
      selectedFormat: this.selectedFormat,
    };
    if (this.effectiveRegion)
      (out as { effectiveRegion: ScreenCaptureRegion }).effectiveRegion = this.effectiveRegion;
    return out;
  }
  private result(ctx: { nowNs: () => bigint }): ScreenCaptureOperationResult {
    return freeze({
      ok: true,
      sourceId: this.descriptor.id,
      state: this.state as never,
      metadata: { generation: this.generation, updatedAtNs: ctx.nowNs().toString() },
    });
  }
}

const makeTarget = (
  providerId: string,
  type: ScreenCaptureTargetType,
  name: string,
  geometry: ScreenGeometry,
  opts: Partial<ScreenCaptureTargetDescriptor> = {},
  now = '0',
): ScreenCaptureTargetDescriptor => {
  const pid = `screen-target:${providerId}:${type}:${hash(name)}`;
  const base: Record<string, unknown> = {
    targetId: pid,
    providerId,
    targetType: type,
    persistentIdentity: `persistent:${type}:${hash(name)}`,
    sessionIdentity: `session:${type}:${hash(name)}`,
    geometry,
    scaleFactor: 1,
    rotation: 0,
    firstSeenAtNs: now,
    lastSeenAtNs: now,
    metadata: {},
  };
  if (type.includes('DISPLAY')) base.displayId = hash(name);
  if (type.includes('WINDOW')) {
    base.windowIdHash = hash(name);
    base.processIdentityHash = hash(`app:${name}`);
    base.applicationName = `app-${hash(name).slice(0, 6)}`;
  }
  base.displayName = type.includes('WINDOW') ? redactTitle(name) : name;
  const identity = freeze(base as unknown as ScreenTargetIdentity);
  const desc: ScreenCaptureTargetDescriptor = {
    identity,
    targetType: type,
    providerId,
    displayName: identity.displayName,
    applicationName: identity.applicationName,
    available: true,
    visible: true,
    minimized: false,
    occluded: false,
    protectedContent: false,
    capturable: true,
    permissionState: 'GRANTED',
    geometry,
    pixelDimensions: { width: geometry.width, height: geometry.height },
    logicalDimensions: { width: geometry.width, height: geometry.height },
    scaleFactor: 1,
    rotation: 0,
    refreshRateSummary: '60Hz',
    hdrSummary: 'SDR',
    cursorCaptureSupported: ['INCLUDE', 'EXCLUDE', 'AUTO', 'SEPARATE_METADATA'],
    regionCaptureSupported: true,
    alphaSupported: true,
    colorSpaceSummary: 'BT709/SRGB',
    virtual: type === 'VIRTUAL_DISPLAY',
    physical: type === 'DISPLAY',
    metadata: {},
    ...opts,
  };
  return freeze(desc);
};

export class SyntheticScreenBackend implements ScreenCaptureBackend {
  readonly backendId = 'synthetic-screen';
  private targets: ScreenCaptureTargetDescriptor[] = [];
  private openState = false;
  private capture = false;
  private seq = 0n;
  private released = 0;
  private frames = 0;
  private timer: ReturnType<typeof setInterval> | undefined;
  private descriptor: ScreenCaptureSourceDescriptor | undefined;
  private onFrameCallback: ScreenFrameCallback | undefined;
  private onTargetChangedCallback: ScreenTargetChangedCallback | undefined;
  private onErrorCallback: ScreenBackendErrorCallback | undefined;
  private lateCallbacks = 0;
  private doubleReleaseAttempts = 0;
  constructor(
    private readonly nowNs: () => bigint = () => BigInt(Date.now()) * 1_000_000n,
    private readonly autoFrames = false,
  ) {
    this.targets = ['Primary Display', 'Secondary Display'].map((n, i) =>
      makeTarget(
        this.backendId,
        'DISPLAY',
        n,
        { x: i * 1920, y: 0, width: 1920, height: 1080 },
        {},
        this.nowNs().toString(),
      ),
    );
    this.targets.push(
      makeTarget(
        this.backendId,
        'VIRTUAL_DISPLAY',
        'Virtual Display',
        { x: 0, y: 1080, width: 1280, height: 720 },
        { virtual: true, physical: false },
        this.nowNs().toString(),
      ),
      makeTarget(
        this.backendId,
        'SYNTHETIC_WINDOW',
        'Quarterly Results - Secret',
        { x: 100, y: 100, width: 1280, height: 720 },
        {},
        this.nowNs().toString(),
      ),
      makeTarget(
        this.backendId,
        'SYNTHETIC_WINDOW',
        'Minimized Chat',
        { x: 200, y: 200, width: 800, height: 600 },
        { minimized: true, visible: false },
        this.nowNs().toString(),
      ),
      makeTarget(
        this.backendId,
        'SYNTHETIC_WINDOW',
        'Occluded Docs',
        { x: 300, y: 300, width: 1024, height: 768 },
        { occluded: true },
        this.nowNs().toString(),
      ),
      makeTarget(
        this.backendId,
        'SYNTHETIC_WINDOW',
        'Protected Payroll',
        { x: 400, y: 400, width: 1024, height: 768 },
        { protectedContent: true, capturable: false, permissionState: 'RESTRICTED' },
        this.nowNs().toString(),
      ),
      makeTarget(
        this.backendId,
        'REGION',
        'Region Source',
        { x: 0, y: 0, width: 640, height: 360 },
        {},
        this.nowNs().toString(),
      ),
    );
  }
  async discover(req: ScreenTargetDiscoveryRequest, ctx: ScreenBackendContext) {
    const start = ctx.nowNs();
    let t = this.targets.filter(
      (x) =>
        (!req.targetTypes?.length || req.targetTypes.includes(x.targetType)) &&
        (!req.capturableOnly || x.capturable) &&
        (!req.visibleWindowsOnly || x.visible) &&
        (req.includeMinimizedWindows || !x.minimized) &&
        (req.includeProtectedContent || !x.protectedContent) &&
        (!req.permissionStates?.length || req.permissionStates.includes(x.permissionState)),
    );
    t = sortScreenTargets(t);
    return freeze({
      displays: t.filter((x) => x.targetType.includes('DISPLAY')),
      windows: t.filter((x) => x.targetType.includes('WINDOW')),
      unavailableTargets: t.filter((x) => !x.available || !x.capturable),
      warnings: [],
      providerErrors: [],
      partial: false,
      generation: 1,
      durationNs: (ctx.nowNs() - start).toString(),
      snapshotId: `screen-discovery:${hash(JSON.stringify(t.map((x) => x.identity.targetId)))}`,
    });
  }
  async open(req: ScreenBackendOpenRequest) {
    if (
      req.descriptor.permissionState === 'DENIED' ||
      req.descriptor.permissionState === 'RESTRICTED'
    )
      return freeze({
        ok: false,
        descriptor: req.descriptor,
        selectedFormat: req.descriptor.defaultFormat as SourceVideoFormat,
        error: 'permission denied',
      });
    this.openState = true;
    this.descriptor = req.descriptor;
    return freeze({
      ok: true,
      descriptor: req.descriptor,
      selectedFormat: req.format ?? (req.descriptor.defaultFormat as SourceVideoFormat),
      effectiveRegion: req.region,
    });
  }
  async start(
    onFrame: ScreenFrameCallback,
    _onTargetChanged: ScreenTargetChangedCallback,
    _onError: ScreenBackendErrorCallback,
    ctx: ScreenBackendContext,
  ) {
    this.capture = true;
    this.onFrameCallback = onFrame;
    this.onTargetChangedCallback = _onTargetChanged;
    this.onErrorCallback = _onError;
    if (this.autoFrames) this.timer = setInterval(() => this.emitFrame(undefined, ctx), 1);
  }
  emitFrame(onFrame?: ScreenFrameCallback, ctx: ScreenBackendContext = { nowNs: this.nowNs }) {
    const cb = onFrame ?? this.onFrameCallback;
    if (!this.capture || !this.descriptor || !cb) return;
    const handle = new ScreenFrameHandle(`screen-handle:${this.seq}`, () => this.released++);
    const payload: SourcePayloadRef = {
      handleId: handle.handleId,
      kind: 'OPAQUE_TEST_HANDLE',
      release: 'SOURCE',
    };
    this.frames++;
    cb({
      targetId: this.descriptor.target.identity.targetId,
      sequenceNumber: this.seq++,
      sourceTimestampNs: ctx.nowNs(),
      format: this.descriptor.defaultFormat as SourceVideoFormat,
      payload,
      cursorIncluded: this.descriptor.cursorPolicy !== 'EXCLUDE',
      release: () => {
        try {
          handle.release();
        } catch {
          this.doubleReleaseAttempts++;
          throw new ScreenOwnershipViolationError('Synthetic screen double release');
        }
      },
      metadata: { synthetic: true },
    });
  }
  emitLateFrame(ctx: ScreenBackendContext = { nowNs: this.nowNs }) {
    const cb = this.onFrameCallback;
    if (!cb || !this.descriptor) return;
    this.lateCallbacks++;
    const wasCapturing = this.capture;
    this.capture = true;
    this.emitFrame(cb, ctx);
    this.capture = wasCapturing;
  }
  emitTargetChanged(target: ScreenCaptureTargetDescriptor, reason: string) {
    this.onTargetChangedCallback?.(target, reason);
  }
  emitBackendFailure(
    error: ScreenCaptureError = new ScreenCaptureError(
      'ScreenBackendFailure',
      'Synthetic backend failure',
    ),
  ) {
    this.onErrorCallback?.(error);
  }
  getReleaseAudit() {
    return freeze({
      framesProduced: Number(this.frames),
      framesReleased: this.released,
      retainedHandles: Number(this.frames) - this.released,
      doubleReleaseAttempts: this.doubleReleaseAttempts,
    });
  }
  async updateRegion(req: ScreenRegionUpdateRequest, ctx: ScreenBackendContext) {
    return freeze({
      ok: true,
      sourceId: req.sourceId,
      state: 'ACTIVE' as never,
      requestedRegion: req.region,
      effectiveRegion: req.region,
      metadata: { updatedAtNs: ctx.nowNs().toString() },
    });
  }
  async updateCursorPolicy(req: ScreenCursorPolicyRequest) {
    if (req.cursorPolicy === 'HIGHLIGHT_CLICKS')
      throw new ScreenCursorPolicyUnsupportedError(req.cursorPolicy);
  }
  async stop() {
    this.capture = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
  async close(_ctx?: ScreenBackendContext) {
    await this.stop();
    this.openState = false;
    this.descriptor = undefined;
    this.onFrameCallback = undefined;
    this.onTargetChangedCallback = undefined;
    this.onErrorCallback = undefined;
  }
  getHealth() {
    return freeze({
      backendId: this.backendId,
      available: true,
      open: this.openState,
      capturing: this.capture,
      targetsKnown: this.targets.length,
      framesProduced: Number(this.frames),
      framesReleased: this.released,
      lateCallbacks: this.lateCallbacks,
      updatedAtNs: this.nowNs().toString(),
    });
  }
}

export class SyntheticScreenCaptureProvider implements ScreenCaptureProvider {
  readonly descriptor: SourceProviderDescriptor = freeze({
    id: 'synthetic-screen-provider',
    displayName: 'Synthetic Screen Capture Provider',
    version: '5.2.6',
    sourceTypes: ['SCREEN', 'WINDOW', 'SYNTHETIC'],
    acquisitionModes: ['PULL'],
  });
  constructor(private readonly backend = new SyntheticScreenBackend()) {}
  async discoverTargets(req: ScreenTargetDiscoveryRequest, ctx: ScreenProviderContext) {
    return this.backend.discover(req, ctx);
  }
  async discover(req: SourceDiscoveryRequest, ctx: SourceProviderContext) {
    const r = await this.discoverTargets(req, ctx);
    const descriptors = [...r.displays, ...r.windows]
      .filter((t) => t.capturable)
      .map((t) => createScreenSourceDescriptor(t));
    return freeze({
      descriptors,
      unavailable: r.unavailableTargets.map((t) => createScreenSourceDescriptor(t)),
      warnings: r.warnings,
      providerErrors: r.providerErrors,
      durationNs: r.durationNs,
      partial: r.partial,
    });
  }
  async createScreenSource(descriptor: ScreenCaptureSourceDescriptor) {
    return new DefaultScreenCaptureSource(descriptor, this.backend);
  }
  async createSource(descriptor: SourceDescriptor) {
    return this.createScreenSource(descriptor as ScreenCaptureSourceDescriptor);
  }
  getBackendHealth() {
    return this.backend.getHealth();
  }
  getSnapshot(
    nowNs: () => bigint = () => BigInt(Date.now()) * 1_000_000n,
  ): Readonly<ScreenProviderSnapshot> {
    return freeze({
      descriptor: this.descriptor,
      backend: this.backend.getHealth(),
      generatedAtNs: nowNs().toString(),
    });
  }
  async shutdown(ctx: SourceProviderContext) {
    await this.backend.close(ctx);
  }
}

export const createScreenSourceDescriptor = (
  target: ScreenCaptureTargetDescriptor,
  opts: Partial<ScreenCaptureSourceDescriptor> = {},
): ScreenCaptureSourceDescriptor => {
  const format = videoFormat(
    `screen:${target.identity.targetId}:native`,
    target.pixelDimensions.width,
    target.pixelDimensions.height,
    30,
  );
  const desc: ScreenCaptureSourceDescriptor = {
    id: `screen-source:${hash(target.identity.targetId)}`,
    providerId:
      target.providerId === 'synthetic-screen' ? 'synthetic-screen-provider' : target.providerId,
    type: target.targetType.includes('WINDOW') ? 'WINDOW' : 'SCREEN',
    displayName: target.displayName ?? target.identity.targetId,
    description: 'Production-safe screen capture source descriptor',
    mediaKinds: ['VIDEO'],
    capabilities: {
      cursorPolicies: target.cursorCaptureSupported,
      regionCaptureSupported: target.regionCaptureSupported,
      hotPlug: true,
    },
    defaultFormat: format,
    supportedFormats: [
      format,
      videoFormat(
        `${format.id}:half`,
        Math.max(1, Math.floor(format.width / 2)),
        Math.max(1, Math.floor(format.height / 2)),
        30,
      ),
    ].sort((a, b) => a.id.localeCompare(b.id)),
    availability: target.available && target.capturable ? 'AVAILABLE' : 'UNAVAILABLE',
    persistent: true,
    reconnectable: true,
    discoverable: true,
    virtual: target.virtual,
    requiresPermission: target.permissionState !== 'NOT_REQUIRED',
    permissionState: target.permissionState,
    supportsVideo: true,
    supportsAudio: false,
    supportsMetadata: true,
    supportsSeeking: false,
    supportsLooping: false,
    supportsDynamicFormatChange: true,
    estimatedLatencyClass: 'REALTIME',
    clockDomain: 'SYSTEM_MONOTONIC',
    acquisitionMode: 'PULL',
    tags: ['screen-capture', 'ubos-v5.2.6'],
    metadata: { targetId: target.identity.targetId, targetType: target.targetType },
    target,
    targetType: target.targetType,
    cursorPolicy: 'AUTO',
    scaleMode: 'NATIVE',
    resizeBehavior: 'ADAPT',
    minimizedBehavior: 'PAUSE_CAPTURE',
    occlusionBehavior: 'CAPTURE_IF_SUPPORTED',
    ...opts,
  };
  return freeze(desc);
};
export const createNativeScreenCaptureAdapterBoundaries = () =>
  freeze([
    {
      platform: 'windows',
      adapters: ['Windows Graphics Capture', 'DXGI Desktop Duplication'],
      nativeBindings: false,
    },
    {
      platform: 'macos',
      adapters: ['ScreenCaptureKit', 'CoreGraphics fallback'],
      nativeBindings: false,
    },
    {
      platform: 'linux',
      adapters: ['PipeWire', 'X11 fallback', 'Wayland portal'],
      nativeBindings: false,
    },
  ]);
export const evaluateScreenWatchdog = (sources: readonly ScreenCaptureSourceSnapshot[]) =>
  freeze(
    sources.flatMap((s) => {
      const out: string[] = [];
      if (s.health.active && !s.health.lastFrameSequence) out.push('SCREEN_NO_FRAMES');
      if (s.health.permissionState === 'DENIED') out.push('SCREEN_PERMISSION_DENIED');
      if (s.health.protectedContent) out.push('SCREEN_PROTECTED_CONTENT');
      if (s.queue.droppedOldest + s.queue.droppedNewest > 0) out.push('SCREEN_QUEUE_OVERFLOW');
      if (s.health.backendErrors > 0) out.push('SCREEN_BACKEND_FAILED');
      return out;
    }),
  );
export const createScreenTelemetrySnapshot = (
  sources: readonly ScreenCaptureSourceSnapshot[],
  lastScreenEvent?: string,
): Readonly<ScreenTelemetrySnapshot> => {
  const sum: Record<string, number> = {};
  for (const s of sources) sum[s.health.healthState] = (sum[s.health.healthState] ?? 0) + 1;
  return freeze({
    registeredScreenSourceCount: sources.length,
    openScreenSourceCount: sources.filter((s) => s.open).length,
    activeScreenSourceCount: sources.filter((s) => s.capturing).length,
    displaySourceCount: sources.filter((s) => s.descriptor.targetType.includes('DISPLAY')).length,
    windowSourceCount: sources.filter((s) => s.descriptor.targetType.includes('WINDOW')).length,
    regionSourceCount: sources.filter((s) => s.descriptor.targetType === 'REGION').length,
    degradedScreenSourceCount: sum.DEGRADED ?? 0,
    unavailableScreenSourceCount: sum.UNAVAILABLE ?? 0,
    failedScreenSourceCount: sum.FAILED ?? 0,
    totalScreenFramesReceived: sources.reduce(
      (n, s) => n + (s.health.lastFrameSequence ? Number(s.health.lastFrameSequence) + 1 : 0),
      0,
    ),
    totalScreenFramesPublished: sources.reduce((n, s) => n + s.queue.dequeued, 0),
    totalScreenFramesDropped: sources.reduce(
      (n, s) => n + s.queue.droppedOldest + s.queue.droppedNewest,
      0,
    ),
    totalScreenFramesStale: sources.reduce((n, s) => n + s.queue.droppedStale, 0),
    totalScreenFramesCorrupted: sources.reduce((n, s) => n + s.health.corruptedFrames, 0),
    totalScreenSequenceGaps: sources.reduce((n, s) => n + s.health.sequenceGaps, 0),
    totalScreenTimestampRegressions: sources.reduce((n, s) => n + s.health.timestampRegressions, 0),
    totalScreenDiscontinuities: sources.reduce((n, s) => n + s.health.discontinuities, 0),
    totalScreenQueueOverflows: sources.reduce((n, s) => n + s.queue.highWaterEvents, 0),
    totalTargetChanges: sources.reduce((n, s) => n + s.health.targetChanges, 0),
    totalGeometryChanges: sources.reduce((n, s) => n + s.health.geometryChanges, 0),
    totalPermissionFailures: sources.reduce((n, s) => n + s.health.permissionFailures, 0),
    totalBackendFailures: sources.reduce((n, s) => n + s.health.backendErrors, 0),
    averageScreenLatencyNs: '0',
    maximumScreenLatencyNs: '0',
    averageScreenJitterNs: '0',
    maximumScreenQueueDepth: Math.max(0, ...sources.map((s) => s.queue.maximumDepth)),
    currentScreenSourceIds: sources
      .filter((s) => s.capturing)
      .map((s) => s.descriptor.id)
      .sort(),
    lastScreenEvent,
    screenHealthSummary: sum,
  });
};
