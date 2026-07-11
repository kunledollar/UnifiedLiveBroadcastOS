import { RuntimeEngineError, type FrameTick } from './execution-engine.js';
import {
  DeterministicSourceTimestampNormalizer,
  type MediaSource,
  type SourceClockDomain,
  type SourceDescriptor,
  type SourceHealthState,
  type SourceLatencyClass,
  type SourceOperationResult,
  type SourceOverflowPolicy,
  type SourcePermissionState,
  type SourceProvider,
  type SourceProviderContext,
  type SourceProviderDescriptor,
  type SourceRuntimeContext,
  type SourceSampleBatch,
  type SourceVideoFormat,
  type VideoFrameEnvelope,
} from './source-acquisition.js';
import type { DeviceDescriptor, DeviceDiscoveryType } from './device-discovery.js';

const clone = <T>(v: T): T => structuredClone(v) as T;
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object') {
    Object.freeze(v);
    for (const value of Object.values(v as Record<string, unknown>)) freeze(value);
  }
  return v as Readonly<T>;
};
const safe = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>).slice(0, 32)) {
    if (/secret|token|serial|path|url|address|credential|password|handle|payload/i.test(k))
      out[k] = '<redacted>';
    else out[k] = val && typeof val === 'object' ? '[redacted-object]' : val;
  }
  return out;
};
const id = (s: string) => s.replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 96);
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};
const nowDefault = () => BigInt(Date.now()) * 1_000_000n;
const frameDuration = (format: SourceVideoFormat) =>
  (BigInt(format.frameRate.denominator) * 1_000_000_000n) / BigInt(format.frameRate.numerator);
const bandwidth = (f: SourceVideoFormat) =>
  Math.ceil(
    f.width *
      f.height *
      Math.max(1, f.bitDepth) *
      (f.frameRate.numerator / f.frameRate.denominator),
  );
const sameFormat = (a: SourceVideoFormat, b: SourceVideoFormat) => a.id === b.id;

export type CameraCategory =
  | 'USB_CAMERA'
  | 'BUILT_IN_CAMERA'
  | 'CAPTURE_CARD_CAMERA_INPUT'
  | 'VIRTUAL_CAMERA'
  | 'NETWORK_CAMERA_ADAPTER'
  | 'SYNTHETIC_CAMERA'
  | 'CUSTOM_CAMERA';
export type CameraLifecycleState =
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
export type CameraFrameOwnership =
  | 'OWNED_BY_BACKEND'
  | 'OWNED_BY_SOURCE'
  | 'OWNED_BY_RUNTIME'
  | 'BORROWED'
  | 'EXTERNAL_HANDLE'
  | 'RELEASED';
export type CameraOverflowPolicy = Extract<
  SourceOverflowPolicy,
  'DROP_OLDEST' | 'DROP_NEWEST' | 'KEEP_LATEST_VIDEO' | 'REJECT'
>;
export type CameraHealthState = SourceHealthState;
export type CameraCommandType =
  | 'CAMERA_REGISTER'
  | 'CAMERA_OPEN'
  | 'CAMERA_START'
  | 'CAMERA_STOP'
  | 'CAMERA_CLOSE'
  | 'CAMERA_SET_FORMAT'
  | 'CAMERA_SET_CONTROL'
  | 'CAMERA_RESET_CONTROL'
  | 'CAMERA_RECONNECT'
  | 'CAMERA_ENABLE'
  | 'CAMERA_DISABLE'
  | 'CAMERA_REFRESH_CAPABILITIES';
export const CAMERA_COMMAND_TYPES = Object.freeze([
  'CAMERA_REGISTER',
  'CAMERA_OPEN',
  'CAMERA_START',
  'CAMERA_STOP',
  'CAMERA_CLOSE',
  'CAMERA_SET_FORMAT',
  'CAMERA_SET_CONTROL',
  'CAMERA_RESET_CONTROL',
  'CAMERA_RECONNECT',
  'CAMERA_ENABLE',
  'CAMERA_DISABLE',
  'CAMERA_REFRESH_CAPABILITIES',
] as const);
export const CAMERA_WATCHDOG_INCIDENTS = Object.freeze([
  'CAMERA_NO_FRAMES',
  'CAMERA_STALLED',
  'CAMERA_UNAVAILABLE',
  'CAMERA_PERMISSION_DENIED',
  'CAMERA_QUEUE_OVERFLOW',
  'CAMERA_FRAME_DROP_RATE_HIGH',
  'CAMERA_TIMESTAMP_UNSTABLE',
  'CAMERA_LATENCY_HIGH',
  'CAMERA_JITTER_HIGH',
  'CAMERA_BACKEND_FAILED',
  'CAMERA_RECONNECT_EXHAUSTED',
  'CAMERA_CONTROL_FAILED',
  'CAMERA_INVARIANT_FAILURE',
] as const);
export const CAMERA_EVENT_TYPES = Object.freeze([
  'CameraRegistered',
  'CameraOpening',
  'CameraOpened',
  'CameraOpenFailed',
  'CameraCaptureStarting',
  'CameraCaptureStarted',
  'CameraCaptureStopping',
  'CameraCaptureStopped',
  'CameraClosing',
  'CameraClosed',
  'CameraFrameReceived',
  'CameraFramePublished',
  'CameraFrameDropped',
  'CameraFrameStale',
  'CameraFrameCorrupted',
  'CameraQueuePressure',
  'CameraFormatNegotiationStarted',
  'CameraFormatNegotiated',
  'CameraFormatChanged',
  'CameraControlChanged',
  'CameraControlFailed',
  'CameraDisconnected',
  'CameraUnavailable',
  'CameraReconnecting',
  'CameraReconnected',
  'CameraReconnectFailed',
  'CameraHealthChanged',
  'CameraPermissionChanged',
  'CameraBackendFailed',
] as const);

export class CameraError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(code, message, safe(details));
  }
}
export class CameraPermissionDeniedError extends CameraError {
  constructor(sourceId: string) {
    super('CameraPermissionDenied', `Camera ${sourceId} permission denied`, { sourceId });
  }
}
export class CameraFrameOwnershipViolationError extends CameraError {
  constructor(message = 'Camera frame ownership violation') {
    super('CameraFrameOwnershipViolation', message);
  }
}
export class CameraLateFrameRejectedError extends CameraError {
  constructor(sourceId: string) {
    super('CameraLateFrameRejected', `Late frame rejected for ${sourceId}`, { sourceId });
  }
}

export interface CameraControlDescriptor {
  readonly controlId: string;
  readonly displayName: string;
  readonly supported: boolean;
  readonly automaticModeSupported: boolean;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly step?: number;
  readonly defaultValue?: number | string | boolean;
  readonly currentValue?: number | string | boolean;
  readonly readOnly: boolean;
  readonly units?: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface CameraControlCapabilities {
  readonly controls: readonly CameraControlDescriptor[];
  readonly generatedAtNs: string;
}
export interface CameraControlRequest {
  readonly sourceId: string;
  readonly controlId: string;
  readonly value?: number | string | boolean;
  readonly automatic?: boolean;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface CameraControlResult {
  readonly ok: boolean;
  readonly sourceId: string;
  readonly controlId: string;
  readonly value?: number | string | boolean;
  readonly error?: { readonly code: string; readonly message: string };
}
export interface CameraBufferConfiguration {
  readonly maximumFrames: number;
  readonly highWaterMark: number;
  readonly lowWaterMark: number;
  readonly overflowPolicy: CameraOverflowPolicy;
  readonly maximumFrameAgeNs: bigint;
  readonly staleFramePolicy: 'DROP' | 'KEEP';
  readonly targetLatencyFrames: number;
  readonly preserveLatestFrame: boolean;
  readonly releaseDroppedFrames: boolean;
}
export interface CameraReconnectPolicy {
  readonly enabled: boolean;
  readonly maximumAttempts: number;
  readonly initialDelayMs: number;
  readonly backoffMultiplier: number;
  readonly maximumDelayMs: number;
}
export interface CameraFormatRequest {
  readonly exactResolution?: { readonly width: number; readonly height: number };
  readonly preferredResolution?: { readonly width: number; readonly height: number };
  readonly minimumResolution?: { readonly width: number; readonly height: number };
  readonly maximumResolution?: { readonly width: number; readonly height: number };
  readonly exactFrameRate?: { readonly numerator: number; readonly denominator: number };
  readonly preferredFrameRate?: { readonly numerator: number; readonly denominator: number };
  readonly maximumFrameRate?: { readonly numerator: number; readonly denominator: number };
  readonly preferredPixelFormats?: readonly string[];
  readonly requireHardwareTimestamp?: boolean;
  readonly latencyPreference?: SourceLatencyClass;
  readonly memoryDomainPreference?: SourceVideoFormat['memoryDomain'];
  readonly preferUncompressed?: boolean;
  readonly resourceCostWeight?: number;
}
export interface CameraFormatNegotiationResult {
  readonly ok: boolean;
  readonly selectedFormat?: SourceVideoFormat;
  readonly explanation: readonly string[];
  readonly fallback: boolean;
  readonly rejectedFormats: readonly { readonly formatId: string; readonly reason: string }[];
  readonly estimatedBandwidth: number;
  readonly estimatedMemoryRate: number;
}
export interface CameraSourceDescriptor {
  readonly sourceId: string;
  readonly streamId: string;
  readonly deviceId?: string;
  readonly providerId: string;
  readonly category: CameraCategory;
  readonly displayName: string;
  readonly supportedFormats: readonly SourceVideoFormat[];
  readonly defaultFormat: SourceVideoFormat;
  readonly permissionState: SourcePermissionState;
  readonly acquisitionMode: 'PUSH';
  readonly clockDomain: SourceClockDomain;
  readonly reconnectable: boolean;
  readonly hotPlug: boolean;
  readonly hardwareTimestamps: boolean;
  readonly controlSummary: Readonly<Record<string, unknown>>;
  readonly orientation: 'LANDSCAPE' | 'PORTRAIT' | 'UNKNOWN';
  readonly facingMode: 'USER' | 'ENVIRONMENT' | 'LEFT' | 'RIGHT' | 'UNKNOWN';
  readonly physical: boolean;
  readonly latencyClass: SourceLatencyClass;
  readonly available: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface CameraDeviceDescriptor extends CameraSourceDescriptor {
  readonly deviceDescriptor?: DeviceDescriptor;
}
export interface CameraOpenRequest {
  readonly format?: SourceVideoFormat;
  readonly formatRequest?: CameraFormatRequest;
  readonly captureMode?: 'VIDEO_ONLY';
  readonly buffer?: Partial<CameraBufferConfiguration>;
  readonly timeoutMs?: number;
  readonly access?: 'EXCLUSIVE' | 'SHARED' | 'PREFER_EXCLUSIVE' | 'PREFER_SHARED';
  readonly hardwareTimestampPreference?: 'REQUIRED' | 'PREFERRED' | 'DISABLED';
  readonly reconnectPolicy?: CameraReconnectPolicy;
  readonly latencyPreference?: SourceLatencyClass;
  readonly controls?: readonly CameraControlRequest[];
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface CameraOpenResult {
  readonly ok: boolean;
  readonly sourceId: string;
  readonly selectedFormat?: SourceVideoFormat;
  readonly explanation: readonly string[];
  readonly error?: { readonly code: string; readonly message: string };
}
export type CameraOperationResult = SourceOperationResult;
export interface CameraFramePayload {
  readonly handleId: string;
  readonly release?: () => void;
}
export interface CameraBackendFrame {
  readonly sequenceNumber: bigint;
  readonly sourceTimestampNs?: bigint;
  readonly captureReceivedAtNs?: bigint;
  readonly durationNs?: bigint;
  readonly payload: CameraFramePayload;
  readonly hardwareTimestamp: boolean;
  readonly corrupted?: boolean;
  readonly discontinuity?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface CameraFrameEnvelope extends VideoFrameEnvelope {
  readonly clockDomain: SourceClockDomain;
  readonly hardwareTimestamp: boolean;
  readonly captureReceivedAtNs: bigint;
  readonly backendId: string;
  readonly ownership: CameraFrameOwnership;
}
export type CameraFrameCallback = (frame: CameraBackendFrame) => void;
export type CameraBackendErrorCallback = (error: CameraError) => void;
export interface CameraBackendContext {
  readonly nowNs: () => bigint;
  readonly signal?: AbortSignal | undefined;
}
export interface CameraBackendOpenRequest {
  readonly descriptor: CameraSourceDescriptor;
  readonly format: SourceVideoFormat;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface CameraBackendOpenResult {
  readonly ok: boolean;
  readonly backendId: string;
  readonly selectedFormat: SourceVideoFormat;
}
export interface CameraBackendHealthSnapshot {
  readonly backendId: string;
  readonly healthy: boolean;
  readonly open: boolean;
  readonly capturing: boolean;
  readonly lastError?: string;
  readonly updatedAtNs: string;
}
export interface CameraCaptureBackend {
  readonly backendId: string;
  open(
    request: CameraBackendOpenRequest,
    context: CameraBackendContext,
  ): Promise<CameraBackendOpenResult>;
  start(
    onFrame: CameraFrameCallback,
    onError: CameraBackendErrorCallback,
    context: CameraBackendContext,
  ): Promise<void>;
  stop(context: CameraBackendContext): Promise<void>;
  close(context: CameraBackendContext): Promise<void>;
  getControls?(): Promise<Readonly<CameraControlCapabilities>>;
  setControl?(request: CameraControlRequest): Promise<CameraControlResult>;
  getHealth?(): Readonly<CameraBackendHealthSnapshot>;
}
export interface CameraQueueSnapshot {
  readonly maximumFrames: number;
  readonly depth: number;
  readonly highWaterMark: number;
  readonly enqueued: number;
  readonly dequeued: number;
  readonly droppedOldest: number;
  readonly droppedNewest: number;
  readonly droppedStale: number;
  readonly rejected: number;
  readonly highWaterEvents: number;
  readonly oldestFrameAgeNs: string;
}
export interface CameraHealthSnapshot {
  readonly sourceId: string;
  readonly deviceId?: string;
  readonly lifecycleState: CameraLifecycleState;
  readonly sourceHealth: CameraHealthState;
  readonly connected: boolean;
  readonly active: boolean;
  readonly available: boolean;
  readonly permissionState: SourcePermissionState;
  readonly selectedFormat?: SourceVideoFormat;
  readonly backendId?: string;
  readonly lastFrameSequence?: string;
  readonly lastSourceTimestamp?: string;
  readonly lastNormalizedTimestamp?: string;
  readonly lastFrameReceivedTime?: string;
  readonly lastFrameConsumedTime?: string;
  readonly currentQueueDepth: number;
  readonly maximumQueueDepth: number;
  readonly droppedFrames: number;
  readonly staleFrames: number;
  readonly corruptedFrames: number;
  readonly sequenceGaps: number;
  readonly timestampRegressions: number;
  readonly timestampDiscontinuities: number;
  readonly backendErrors: number;
  readonly openFailures: number;
  readonly captureFailures: number;
  readonly reconnectAttempts: number;
  readonly reconnectSuccesses: number;
  readonly reconnectFailures: number;
  readonly consecutiveFailures: number;
  readonly lastError?: string;
  readonly updatedAtNs: string;
}
export interface CameraSourceSnapshot {
  readonly descriptor: CameraSourceDescriptor;
  readonly lifecycleState: CameraLifecycleState;
  readonly selectedFormat?: SourceVideoFormat;
  readonly queue: CameraQueueSnapshot;
  readonly health: CameraHealthSnapshot;
  readonly generatedAtNs: string;
}
export interface CameraTelemetrySnapshot {
  readonly registeredCameraCount: number;
  readonly connectedCameraCount: number;
  readonly activeCameraCount: number;
  readonly degradedCameraCount: number;
  readonly unavailableCameraCount: number;
  readonly failedCameraCount: number;
  readonly totalCameraFramesReceived: number;
  readonly totalCameraFramesPublished: number;
  readonly totalCameraFramesDropped: number;
  readonly totalCameraFramesStale: number;
  readonly totalCameraFramesCorrupted: number;
  readonly totalCameraSequenceGaps: number;
  readonly totalCameraTimestampRegressions: number;
  readonly totalCameraDiscontinuities: number;
  readonly totalCameraQueueOverflows: number;
  readonly totalCameraOpenFailures: number;
  readonly totalCameraCaptureFailures: number;
  readonly totalCameraReconnectAttempts: number;
  readonly successfulCameraReconnects: number;
  readonly failedCameraReconnects: number;
  readonly maximumCameraQueueDepth: number;
  readonly currentCameraIds: readonly string[];
  readonly lastCameraEvent?: string;
  readonly cameraHealthSummary: Readonly<Record<string, number>>;
}
export interface CameraProviderContext extends SourceProviderContext {}
export interface CameraConnectionContext {
  readonly nowNs: () => bigint;
  readonly signal?: AbortSignal | undefined;
}
export interface CameraCaptureContext extends CameraConnectionContext {
  readonly frameTick?: FrameTick;
}
export interface CameraControlContext extends CameraConnectionContext {}
export interface CameraSource extends MediaSource {
  readonly descriptor: SourceDescriptor;
  readonly cameraDescriptor: CameraSourceDescriptor;
  open(request: CameraOpenRequest, context: CameraConnectionContext): Promise<CameraOpenResult>;
  startCapture(context: CameraCaptureContext): Promise<CameraOperationResult>;
  stopCapture(context: CameraCaptureContext): Promise<CameraOperationResult>;
  close(context: CameraConnectionContext): Promise<CameraOperationResult>;
  setControl?(
    request: CameraControlRequest,
    context: CameraControlContext,
  ): Promise<CameraControlResult>;
  getControlCapabilities?(): Readonly<CameraControlCapabilities>;
  getCameraSnapshot(): Readonly<CameraSourceSnapshot>;
  assertInvariants(): void;
}
export interface CameraSourceProvider extends SourceProvider {
  listCameraDevices(context: CameraProviderContext): Promise<readonly CameraDeviceDescriptor[]>;
  createCameraSource(
    descriptor: CameraSourceDescriptor,
    context: CameraProviderContext,
  ): Promise<CameraSource>;
  getBackendHealth(): Readonly<CameraBackendHealthSnapshot>;
}

export const createCameraVideoFormat = (
  p: Partial<SourceVideoFormat> & {
    id: string;
    width: number;
    height: number;
    frameRate: { numerator: number; denominator: number };
    pixelFormat?: string;
  },
): SourceVideoFormat =>
  freeze({
    kind: 'VIDEO',
    colorSpace: 'BT709',
    colorRange: 'LIMITED',
    transferCharacteristic: 'BT709',
    chromaSubsampling: '4:2:0',
    scan: 'PROGRESSIVE',
    fieldOrder: 'NONE',
    aspectRatio: `${p.width}:${p.height}`,
    alpha: false,
    bitDepth: 8,
    rotation: 0,
    memoryDomain: 'OPAQUE',
    hardwareAcceleration: 'NONE',
    latencyClass: 'REALTIME',
    ...p,
    pixelFormat: p.pixelFormat ?? 'UNKNOWN',
  });
export const defaultCameraBufferConfiguration: CameraBufferConfiguration = freeze({
  maximumFrames: 4,
  highWaterMark: 3,
  lowWaterMark: 1,
  overflowPolicy: 'KEEP_LATEST_VIDEO',
  maximumFrameAgeNs: 1_000_000_000n,
  staleFramePolicy: 'DROP',
  targetLatencyFrames: 1,
  preserveLatestFrame: true,
  releaseDroppedFrames: true,
});
export const mapDeviceToCameraDescriptor = (
  device: DeviceDescriptor,
  formats: readonly SourceVideoFormat[],
  providerId = device.providerId,
): CameraSourceDescriptor | undefined => {
  const map: Partial<Record<DeviceDiscoveryType, CameraCategory>> = {
    VIDEO_INPUT: 'USB_CAMERA',
    CAPTURE_CARD: 'CAPTURE_CARD_CAMERA_INPUT',
    VIRTUAL_CAMERA: 'VIRTUAL_CAMERA',
    SYNTHETIC: 'SYNTHETIC_CAMERA',
  };
  const category = map[device.type];
  if (!category || !formats.length) return undefined;
  const stable = hash(`${providerId}:${device.id}:${device.type}`);
  const sourceId = `camera:${stable}`;
  return freeze({
    sourceId,
    streamId: `${sourceId}:video:0`,
    deviceId: device.id,
    providerId,
    category,
    displayName: device.displayName,
    supportedFormats: [...formats].sort((a, b) => a.id.localeCompare(b.id)),
    defaultFormat: [...formats].sort((a, b) => a.id.localeCompare(b.id))[0]!,
    permissionState: device.permissionState,
    acquisitionMode: 'PUSH',
    clockDomain: 'DEVICE_HARDWARE',
    reconnectable: device.hotPluggable,
    hotPlug: device.hotPluggable,
    hardwareTimestamps: Boolean(device.capabilities.video),
    controlSummary: { supported: false, count: 0 },
    orientation: 'UNKNOWN',
    facingMode: 'UNKNOWN',
    physical: category !== 'SYNTHETIC_CAMERA' && category !== 'VIRTUAL_CAMERA',
    latencyClass: 'REALTIME',
    available:
      ((device as unknown as { availability?: string }).availability ?? 'AVAILABLE') ===
      'AVAILABLE',
    metadata: safe(device.metadata),
  });
};
export const cameraDescriptorToSourceDescriptor = (d: CameraSourceDescriptor): SourceDescriptor =>
  freeze({
    id: d.sourceId,
    providerId: d.providerId,
    type: d.category === 'SYNTHETIC_CAMERA' ? 'SYNTHETIC' : 'CAMERA',
    displayName: d.displayName,
    mediaKinds: ['VIDEO'],
    capabilities: {
      cameraCategory: d.category,
      hardwareTimestamps: d.hardwareTimestamps,
      controls: d.controlSummary,
    },
    defaultFormat: d.defaultFormat,
    supportedFormats: d.supportedFormats,
    availability: d.available ? 'AVAILABLE' : 'UNAVAILABLE',
    persistent: true,
    reconnectable: d.reconnectable,
    discoverable: true,
    virtual: !d.physical,
    requiresPermission: d.permissionState !== 'NOT_REQUIRED',
    permissionState: d.permissionState,
    supportsVideo: true,
    supportsAudio: false,
    supportsMetadata: true,
    supportsSeeking: false,
    supportsLooping: false,
    supportsDynamicFormatChange: true,
    estimatedLatencyClass: d.latencyClass,
    clockDomain: d.clockDomain,
    acquisitionMode: 'PUSH',
    tags: ['camera', d.category],
    metadata: { streamId: d.streamId, deviceId: d.deviceId, safe: true, ...d.metadata },
  });

export function negotiateCameraFormat(
  formats: readonly SourceVideoFormat[],
  request: CameraFormatRequest = {},
): CameraFormatNegotiationResult {
  const rejected: { formatId: string; reason: string }[] = [];
  const fps = (f: SourceVideoFormat) => f.frameRate.numerator / f.frameRate.denominator;
  const reqFps = (r?: { numerator: number; denominator: number }) =>
    r ? r.numerator / r.denominator : undefined;
  const candidates = formats.filter((f) => {
    const reasons: string[] = [];
    if (
      request.exactResolution &&
      (f.width !== request.exactResolution.width || f.height !== request.exactResolution.height)
    )
      reasons.push('exact resolution mismatch');
    if (
      request.minimumResolution &&
      (f.width < request.minimumResolution.width || f.height < request.minimumResolution.height)
    )
      reasons.push('below minimum resolution');
    if (
      request.maximumResolution &&
      (f.width > request.maximumResolution.width || f.height > request.maximumResolution.height)
    )
      reasons.push('above maximum resolution');
    if (request.exactFrameRate && fps(f) !== reqFps(request.exactFrameRate))
      reasons.push('exact frame rate mismatch');
    if (request.maximumFrameRate && fps(f) > reqFps(request.maximumFrameRate)!)
      reasons.push('above maximum frame rate');
    if (request.memoryDomainPreference && f.memoryDomain !== request.memoryDomainPreference)
      reasons.push('memory domain mismatch');
    if (reasons.length) {
      rejected.push({ formatId: f.id, reason: reasons.join('; ') });
      return false;
    }
    return true;
  });
  if (!candidates.length)
    return freeze({
      ok: false,
      explanation: ['No camera format satisfied required constraints'],
      fallback: false,
      rejectedFormats: rejected,
      estimatedBandwidth: 0,
      estimatedMemoryRate: 0,
    });
  const prefFps = reqFps(request.preferredFrameRate);
  const prefPix = request.preferredPixelFormats ?? [];
  const sorted = [...candidates].sort((a, b) => {
    const score = (f: SourceVideoFormat) =>
      [
        request.preferredResolution &&
        f.width === request.preferredResolution.width &&
        f.height === request.preferredResolution.height
          ? 0
          : 1,
        prefFps !== undefined ? Math.abs(fps(f) - prefFps) : 0,
        request.preferredResolution
          ? Math.abs(
              f.width * f.height -
                request.preferredResolution.width * request.preferredResolution.height,
            )
          : 0,
        prefPix.length
          ? prefPix.indexOf(f.pixelFormat) < 0
            ? 999
            : prefPix.indexOf(f.pixelFormat)
          : 0,
        f.latencyClass === 'REALTIME' ? 0 : f.latencyClass === 'LOW' ? 1 : 2,
        bandwidth(f),
        f.id,
      ] as const;
    return JSON.stringify(score(a)).localeCompare(JSON.stringify(score(b)));
  });
  const selected = sorted[0]!;
  const fallback = Boolean(
    (request.preferredResolution &&
      (selected.width !== request.preferredResolution.width ||
        selected.height !== request.preferredResolution.height)) ||
    (prefFps !== undefined && fps(selected) !== prefFps) ||
    (prefPix.length && !prefPix.includes(selected.pixelFormat)),
  );
  return freeze({
    ok: true,
    selectedFormat: selected,
    explanation: [
      `Selected ${selected.id}`,
      fallback
        ? 'Preferred camera request used deterministic fallback with explanation'
        : 'Exact/preferred camera request satisfied',
    ],
    fallback,
    rejectedFormats: rejected,
    estimatedBandwidth: bandwidth(selected),
    estimatedMemoryRate: bandwidth(selected),
  });
}

export class CameraFrameHandle {
  private released = false;
  constructor(
    readonly handleId: string,
    private readonly releaseFn: () => void = () => {},
  ) {}
  release() {
    if (this.released)
      throw new CameraFrameOwnershipViolationError('Camera frame handle released twice');
    this.released = true;
    this.releaseFn();
  }
  get isReleased() {
    return this.released;
  }
}

export class CameraFrameQueue {
  private frames: CameraFrameEnvelope[] = [];
  enqueued = 0;
  dequeued = 0;
  droppedOldest = 0;
  droppedNewest = 0;
  droppedStale = 0;
  rejected = 0;
  highWaterEvents = 0;
  constructor(
    readonly config: CameraBufferConfiguration = defaultCameraBufferConfiguration,
    private readonly release: (f: CameraFrameEnvelope) => void = () => {},
  ) {
    if (config.maximumFrames <= 0 || config.maximumFrames > 64)
      throw new CameraError('CameraInvariantViolation', 'Invalid camera queue capacity');
  }
  enqueue(frame: CameraFrameEnvelope, nowNs = frame.captureReceivedAtNs) {
    this.dropStale(nowNs);
    if (this.frames.length >= this.config.maximumFrames) {
      if (this.config.overflowPolicy === 'DROP_NEWEST' || this.config.overflowPolicy === 'REJECT') {
        this.droppedNewest++;
        this.rejected++;
        this.release(frame);
        return false;
      }
      if (this.config.overflowPolicy === 'KEEP_LATEST_VIDEO') {
        for (const old of this.frames.splice(0)) {
          this.droppedOldest++;
          this.release(old);
        }
      } else {
        const old = this.frames.shift();
        if (old) {
          this.droppedOldest++;
          this.release(old);
        }
      }
    }
    this.frames.push(freeze(clone(frame)) as CameraFrameEnvelope);
    this.frames.sort((a, b) => (a.normalizedTimestampNs < b.normalizedTimestampNs ? -1 : 1));
    this.enqueued++;
    if (this.frames.length >= this.config.highWaterMark) this.highWaterEvents++;
    return true;
  }
  selectForTick(tickNs: bigint, nowNs = tickNs) {
    this.dropStale(nowNs);
    let idx = -1;
    for (let i = 0; i < this.frames.length; i++)
      if (this.frames[i]!.normalizedTimestampNs <= tickNs) idx = i;
    if (idx < 0) return undefined;
    const selected = this.frames.splice(idx, 1)[0]!;
    this.dequeued++;
    for (const older of this.frames.splice(0, idx)) this.release(older);
    return selected;
  }
  clear() {
    for (const f of this.frames.splice(0)) this.release(f);
  }
  snapshot(nowNs = nowDefault()): CameraQueueSnapshot {
    return freeze({
      maximumFrames: this.config.maximumFrames,
      depth: this.frames.length,
      highWaterMark: this.config.highWaterMark,
      enqueued: this.enqueued,
      dequeued: this.dequeued,
      droppedOldest: this.droppedOldest,
      droppedNewest: this.droppedNewest,
      droppedStale: this.droppedStale,
      rejected: this.rejected,
      highWaterEvents: this.highWaterEvents,
      oldestFrameAgeNs: this.frames[0]
        ? (nowNs - this.frames[0]!.captureReceivedAtNs).toString()
        : '0',
    });
  }
  private dropStale(nowNs: bigint) {
    if (this.config.staleFramePolicy !== 'DROP') return;
    const keep: CameraFrameEnvelope[] = [];
    for (const f of this.frames) {
      if (nowNs - f.captureReceivedAtNs > this.config.maximumFrameAgeNs) {
        this.droppedStale++;
        this.release(f);
      } else keep.push(f);
    }
    this.frames = keep;
  }
}

export class DefaultCameraSource implements CameraSource {
  readonly descriptor: SourceDescriptor;
  private state: CameraLifecycleState = 'REGISTERED';
  private selected?: SourceVideoFormat;
  private normalizer = new DeterministicSourceTimestampNormalizer();
  private queue: CameraFrameQueue;
  private generation = 0;
  private capturing = false;
  private opened = false;
  private stats = {
    received: 0,
    published: 0,
    late: 0,
    corrupt: 0,
    backendErrors: 0,
    openFailures: 0,
    captureFailures: 0,
    reconnectAttempts: 0,
    reconnectSuccesses: 0,
    reconnectFailures: 0,
  };
  private lastSeq?: bigint;
  private lastEvent?: string;
  private lastError?: string;
  private controls?: CameraControlCapabilities;
  constructor(
    readonly cameraDescriptor: CameraSourceDescriptor,
    private readonly backend: CameraCaptureBackend,
    buffer: CameraBufferConfiguration = defaultCameraBufferConfiguration,
  ) {
    this.descriptor = cameraDescriptorToSourceDescriptor(cameraDescriptor);
    this.queue = new CameraFrameQueue(buffer, (f) => {
      const rel = (f.payload as { release?: string }).release;
      void rel;
    });
  }
  async initialize(context: SourceRuntimeContext) {
    this.state = 'READY';
    return this.ok(context);
  }
  async connect(context: SourceRuntimeContext) {
    const r = await this.open({}, context);
    return r.ok
      ? this.ok(context)
      : this.fail(
          r.error?.code ?? 'CameraOpenFailed',
          r.error?.message ?? 'Camera open failed',
          context,
        );
  }
  async activate(context: SourceRuntimeContext) {
    return this.startCapture(context);
  }
  async deactivate(context: SourceRuntimeContext) {
    return this.stopCapture(context);
  }
  async disconnect(context: SourceRuntimeContext) {
    return this.close(context);
  }
  async shutdown(context: SourceRuntimeContext) {
    await this.stopCapture(context);
    await this.close(context);
    this.queue.clear();
    this.state = 'STOPPED';
    return this.ok(context);
  }
  async open(
    request: CameraOpenRequest,
    context: CameraConnectionContext,
  ): Promise<CameraOpenResult> {
    if (this.opened)
      return freeze({
        ok: false,
        sourceId: this.cameraDescriptor.sourceId,
        explanation: ['Camera already open'],
        error: { code: 'CameraAlreadyOpen', message: 'Camera is already open' },
      });
    if (['DENIED', 'RESTRICTED', 'UNAVAILABLE'].includes(this.cameraDescriptor.permissionState))
      throw new CameraPermissionDeniedError(this.cameraDescriptor.sourceId);
    const selected =
      request.format ??
      (request.formatRequest
        ? negotiateCameraFormat(this.cameraDescriptor.supportedFormats, request.formatRequest)
            .selectedFormat
        : this.cameraDescriptor.defaultFormat);
    if (!selected || !this.cameraDescriptor.supportedFormats.some((f) => sameFormat(f, selected)))
      throw new CameraError('CameraFormatUnsupported', 'Unsupported camera format', {
        sourceId: this.cameraDescriptor.sourceId,
        formatId: selected?.id,
      });
    try {
      this.state = 'CONNECTING';
      const r = await this.backend.open(
        { descriptor: this.cameraDescriptor, format: selected, metadata: safe(request.metadata) },
        { nowNs: context.nowNs, signal: context.signal },
      );
      this.selected = r.selectedFormat;
      this.opened = true;
      this.generation++;
      this.normalizer.reset('SOURCE_EPOCH');
      this.state = 'CONNECTED';
      this.lastEvent = 'CameraOpened';
      return freeze({
        ok: true,
        sourceId: this.cameraDescriptor.sourceId,
        selectedFormat: this.selected,
        explanation: [`Opened camera with ${this.selected.id}`],
      });
    } catch (e) {
      this.stats.openFailures++;
      this.state = 'FAILED';
      this.lastError = e instanceof Error ? e.message : String(e);
      throw new CameraError('CameraOpenFailed', 'Camera open failed', {
        sourceId: this.cameraDescriptor.sourceId,
        error: this.lastError,
      });
    }
  }
  async startCapture(context: CameraCaptureContext): Promise<CameraOperationResult> {
    if (!this.opened) return this.fail('CameraNotOpen', 'Camera is not open', context);
    if (this.capturing)
      return this.fail('CameraAlreadyCapturing', 'Camera is already capturing', context);
    const gen = this.generation;
    try {
      this.state = 'ACTIVATING';
      await this.backend.start(
        (f) => this.acceptBackendFrame(f, gen, context.nowNs),
        (e) => {
          this.stats.backendErrors++;
          this.lastError = e.message;
        },
        { nowNs: context.nowNs, signal: context.signal },
      );
      this.capturing = true;
      this.state = 'ACTIVE';
      this.lastEvent = 'CameraCaptureStarted';
      return this.ok(context);
    } catch (e) {
      this.stats.captureFailures++;
      this.state = 'FAILED';
      this.lastError = e instanceof Error ? e.message : String(e);
      return this.fail('CameraStartFailed', 'Camera start failed', context);
    }
  }
  async stopCapture(context: CameraCaptureContext): Promise<CameraOperationResult> {
    if (!this.capturing) return this.ok(context);
    this.state = 'DEACTIVATING';
    this.capturing = false;
    this.generation++;
    await this.backend.stop({ nowNs: context.nowNs, signal: context.signal });
    this.queue.clear();
    this.state = this.opened ? 'CONNECTED' : 'DISCONNECTED';
    this.lastEvent = 'CameraCaptureStopped';
    return this.ok(context);
  }
  async close(context: CameraConnectionContext): Promise<CameraOperationResult> {
    if (this.capturing) await this.stopCapture(context);
    if (!this.opened) return this.ok(context);
    this.state = 'DISCONNECTING';
    this.generation++;
    await this.backend.close({ nowNs: context.nowNs, signal: context.signal });
    this.opened = false;
    this.queue.clear();
    this.state = 'DISCONNECTED';
    this.lastEvent = 'CameraClosed';
    return this.ok(context);
  }
  async pull(
    request: { frameNumber: bigint; scheduledTimeNs: bigint },
    context: SourceRuntimeContext,
  ): Promise<SourceSampleBatch> {
    if (!this.capturing) return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    const selected = this.queue.selectForTick(
      context.frameTick?.presentationTimeNs ?? request.scheduledTimeNs,
      context.nowNs(),
    );
    if (!selected) return freeze({ videoFrames: [], audioBuffers: [], metadataSamples: [] });
    this.stats.published++;
    this.lastEvent = 'CameraFramePublished';
    return freeze({
      videoFrames: [{ ...selected, ownership: 'OWNED_BY_RUNTIME' }],
      audioBuffers: [],
      metadataSamples: [],
    });
  }
  async setControl(
    request: CameraControlRequest,
    _context: CameraControlContext,
  ): Promise<CameraControlResult> {
    if (!this.backend.setControl)
      return freeze({
        ok: false,
        sourceId: this.cameraDescriptor.sourceId,
        controlId: request.controlId,
        error: { code: 'CameraControlUnsupported', message: 'Control unsupported' },
      });
    return this.backend.setControl(request);
  }
  getControlCapabilities() {
    return freeze(clone(this.controls ?? { controls: [], generatedAtNs: '0' }));
  }
  getCameraSnapshot(): Readonly<CameraSourceSnapshot> {
    const n = nowDefault();
    const snap: {
      descriptor: CameraSourceDescriptor;
      lifecycleState: CameraLifecycleState;
      queue: CameraQueueSnapshot;
      health: CameraHealthSnapshot;
      generatedAtNs: string;
      selectedFormat?: SourceVideoFormat;
    } = {
      descriptor: this.cameraDescriptor,
      lifecycleState: this.state,
      queue: this.queue.snapshot(n),
      health: this.health(n),
      generatedAtNs: n.toString(),
    };
    if (this.selected) snap.selectedFormat = this.selected;
    return freeze(snap);
  }
  assertInvariants() {
    const s = this.getCameraSnapshot();
    if (s.queue.depth > s.queue.maximumFrames)
      throw new CameraError('CameraInvariantViolation', 'Camera queue exceeds capacity');
    if (this.capturing && !this.opened)
      throw new CameraError('CameraInvariantViolation', 'Capturing camera is not open');
    if (
      this.selected &&
      !this.cameraDescriptor.supportedFormats.some((f) => f.id === this.selected!.id)
    )
      throw new CameraError('CameraInvariantViolation', 'Selected format unsupported');
  }
  private acceptBackendFrame(frame: CameraBackendFrame, gen: number, nowNs: () => bigint) {
    if (!this.capturing || !this.opened || gen !== this.generation) {
      this.stats.late++;
      try {
        frame.payload.release?.();
      } catch {
        /* ignored */
      }
      return;
    }
    const sourceTs = frame.sourceTimestampNs ?? frame.captureReceivedAtNs ?? nowNs();
    const norm = this.normalizer.normalize({
      sourceId: this.cameraDescriptor.sourceId,
      clockDomain: frame.hardwareTimestamp ? this.cameraDescriptor.clockDomain : 'SYSTEM_MONOTONIC',
      timestampNs: sourceTs,
      sequenceNumber: frame.sequenceNumber,
      ...(frame.discontinuity === undefined ? {} : { discontinuity: frame.discontinuity }),
    });
    if (this.lastSeq !== undefined && frame.sequenceNumber < this.lastSeq && !frame.discontinuity)
      this.stats.backendErrors++;
    this.lastSeq = frame.sequenceNumber;
    if (frame.corrupted) this.stats.corrupt++;
    const format = this.selected ?? this.cameraDescriptor.defaultFormat;
    const env: CameraFrameEnvelope = freeze({
      sourceId: this.cameraDescriptor.sourceId,
      streamId: this.cameraDescriptor.streamId,
      sequenceNumber: frame.sequenceNumber,
      sourceTimestampNs: sourceTs,
      normalizedTimestampNs: norm.normalizedTimestampNs,
      presentationTimestampNs: norm.normalizedTimestampNs,
      durationNs: frame.durationNs ?? frameDuration(format),
      format,
      keyFrame: true,
      discontinuity: Boolean(frame.discontinuity || norm.movedBackward || norm.sequenceGap),
      corrupted: Boolean(frame.corrupted),
      droppedBefore: 0,
      memoryDomain: format.memoryDomain,
      payload: {
        handleId: id(frame.payload.handleId),
        kind: 'OPAQUE_TEST_HANDLE',
        release: 'SOURCE',
      },
      metadata: safe(frame.metadata),
      clockDomain: frame.hardwareTimestamp ? this.cameraDescriptor.clockDomain : 'SYSTEM_MONOTONIC',
      hardwareTimestamp: frame.hardwareTimestamp,
      captureReceivedAtNs: frame.captureReceivedAtNs ?? nowNs(),
      backendId: this.backend.backendId,
      ownership: 'OWNED_BY_SOURCE',
    });
    this.stats.received++;
    this.queue.enqueue(env, nowNs());
  }
  private health(nowNs: bigint): CameraHealthSnapshot {
    const q = this.queue.snapshot(nowNs);
    const ns = this.normalizer.getSnapshot();
    const h: CameraHealthSnapshot = {
      sourceId: this.cameraDescriptor.sourceId,
      lifecycleState: this.state,
      sourceHealth:
        this.state === 'ACTIVE'
          ? 'HEALTHY'
          : this.state === 'FAILED'
            ? 'FAILED'
            : this.state === 'UNAVAILABLE'
              ? 'UNAVAILABLE'
              : this.state === 'STOPPED'
                ? 'STOPPED'
                : 'UNKNOWN',
      connected: this.opened,
      active: this.capturing,
      available: this.cameraDescriptor.available,
      permissionState: this.cameraDescriptor.permissionState,
      backendId: this.backend.backendId,
      currentQueueDepth: q.depth,
      maximumQueueDepth: q.maximumFrames,
      droppedFrames: q.droppedNewest + q.droppedOldest,
      staleFrames: q.droppedStale,
      corruptedFrames: this.stats.corrupt,
      sequenceGaps: ns.sequenceGaps,
      timestampRegressions: ns.regressions,
      timestampDiscontinuities: ns.discontinuities,
      backendErrors: this.stats.backendErrors,
      openFailures: this.stats.openFailures,
      captureFailures: this.stats.captureFailures,
      reconnectAttempts: this.stats.reconnectAttempts,
      reconnectSuccesses: this.stats.reconnectSuccesses,
      reconnectFailures: this.stats.reconnectFailures,
      consecutiveFailures: this.state === 'FAILED' ? 1 : 0,
      updatedAtNs: nowNs.toString(),
    };
    if (this.cameraDescriptor.deviceId)
      (h as { deviceId?: string }).deviceId = this.cameraDescriptor.deviceId;
    if (this.selected) (h as { selectedFormat?: SourceVideoFormat }).selectedFormat = this.selected;
    if (this.lastSeq !== undefined)
      (h as { lastFrameSequence?: string }).lastFrameSequence = this.lastSeq.toString();
    if (ns.lastSourceTimestampNs)
      (h as { lastSourceTimestamp?: string }).lastSourceTimestamp = ns.lastSourceTimestampNs;
    if (ns.lastNormalizedTimestampNs)
      (h as { lastNormalizedTimestamp?: string }).lastNormalizedTimestamp =
        ns.lastNormalizedTimestampNs;
    if (this.lastError) (h as { lastError?: string }).lastError = this.lastError;
    return h;
  }
  private ok(context: { nowNs: () => bigint }): CameraOperationResult {
    return freeze({
      ok: true,
      sourceId: this.cameraDescriptor.sourceId,
      state: this.state as never,
      metadata: { event: this.lastEvent, atNs: context.nowNs().toString() },
    });
  }
  private fail(
    code: string,
    message: string,
    context: { nowNs: () => bigint },
  ): CameraOperationResult {
    this.lastError = message;
    return freeze({
      ok: false,
      sourceId: this.cameraDescriptor.sourceId,
      state: this.state as never,
      error: { code, message },
      metadata: { atNs: context.nowNs().toString() },
    });
  }
}

export interface SyntheticCameraBackendOptions {
  readonly backendId?: string;
  readonly format: SourceVideoFormat;
  readonly permissionState?: SourcePermissionState;
  readonly openFailure?: boolean;
  readonly startFailure?: boolean;
  readonly corruptedEvery?: number;
  readonly droppedEvery?: number;
  readonly timestampRegressionEvery?: number;
  readonly discontinuityEvery?: number;
  readonly controls?: readonly CameraControlDescriptor[];
}
export class SyntheticCameraBackend implements CameraCaptureBackend {
  readonly backendId: string;
  private openState = false;
  private capture = false;
  private seq = 0n;
  private onFrame: CameraFrameCallback | undefined;
  private onError: CameraBackendErrorCallback | undefined;
  private released = new Set<string>();
  constructor(readonly options: SyntheticCameraBackendOptions) {
    this.backendId = options.backendId ?? 'synthetic-camera-backend';
  }
  async open(_request: CameraBackendOpenRequest, context: CameraBackendContext) {
    if (this.options.openFailure)
      throw new CameraError('CameraOpenFailed', 'Synthetic camera open failure');
    this.openState = true;
    return freeze({
      ok: true,
      backendId: this.backendId,
      selectedFormat: this.options.format,
      openedAtNs: context.nowNs().toString(),
    }) as CameraBackendOpenResult;
  }
  async start(onFrame: CameraFrameCallback, onError: CameraBackendErrorCallback) {
    if (this.options.startFailure)
      throw new CameraError('CameraStartFailed', 'Synthetic camera start failure');
    this.capture = true;
    this.onFrame = onFrame;
    this.onError = onError;
  }
  async stop() {
    this.capture = false;
    this.onFrame = undefined;
    this.onError = undefined;
  }
  async close() {
    await this.stop();
    this.openState = false;
  }
  emitFrame(nowNs: bigint) {
    if (!this.capture || !this.onFrame) return false;
    this.seq++;
    const n = Number(this.seq);
    if (this.options.droppedEvery && n % this.options.droppedEvery === 0) return false;
    const duration = frameDuration(this.options.format);
    const ts = (this.seq - 1n) * duration;
    const sourceTimestampNs =
      this.options.timestampRegressionEvery && n % this.options.timestampRegressionEvery === 0
        ? ts - duration
        : ts;
    const handleId = `synthetic:${this.backendId}:${this.seq}`;
    this.onFrame({
      sequenceNumber: this.seq,
      sourceTimestampNs,
      captureReceivedAtNs: nowNs,
      durationNs: duration,
      hardwareTimestamp: true,
      corrupted: Boolean(this.options.corruptedEvery && n % this.options.corruptedEvery === 0),
      discontinuity: Boolean(
        this.options.discontinuityEvery && n % this.options.discontinuityEvery === 0,
      ),
      payload: {
        handleId,
        release: () => {
          if (this.released.has(handleId)) throw new CameraFrameOwnershipViolationError();
          this.released.add(handleId);
        },
      },
      metadata: { synthetic: true },
    });
    return true;
  }
  emitLateFrame(nowNs: bigint) {
    const cb = this.onFrame;
    void this.stop();
    cb?.({
      sequenceNumber: this.seq + 1n,
      sourceTimestampNs: nowNs,
      captureReceivedAtNs: nowNs,
      hardwareTimestamp: true,
      payload: { handleId: `late:${this.seq + 1n}`, release: () => {} },
    });
  }
  getControls() {
    return Promise.resolve(
      freeze({ controls: this.options.controls ?? [], generatedAtNs: nowDefault().toString() }),
    );
  }
  async setControl(request: CameraControlRequest): Promise<CameraControlResult> {
    const c = this.options.controls?.find((x) => x.controlId === request.controlId);
    if (!c || !c.supported)
      return freeze({
        ok: false,
        sourceId: request.sourceId,
        controlId: request.controlId,
        error: { code: 'CameraControlUnsupported', message: 'Control unsupported' },
      });
    if (
      typeof request.value === 'number' &&
      ((c.minimum !== undefined && request.value < c.minimum) ||
        (c.maximum !== undefined && request.value > c.maximum))
    )
      return freeze({
        ok: false,
        sourceId: request.sourceId,
        controlId: request.controlId,
        error: { code: 'CameraControlOutOfRange', message: 'Control out of range' },
      });
    const ok: CameraControlResult =
      request.value === undefined
        ? { ok: true, sourceId: request.sourceId, controlId: request.controlId }
        : {
            ok: true,
            sourceId: request.sourceId,
            controlId: request.controlId,
            value: request.value,
          };
    return freeze(ok);
  }
  getHealth() {
    return freeze({
      backendId: this.backendId,
      healthy: !this.onError,
      open: this.openState,
      capturing: this.capture,
      updatedAtNs: nowDefault().toString(),
    });
  }
  get releasedHandleCount() {
    return this.released.size;
  }
}

export class SyntheticCameraProvider implements CameraSourceProvider {
  readonly descriptor: SourceProviderDescriptor;
  private descriptors: CameraSourceDescriptor[];
  private lastBackend?: SyntheticCameraBackend;
  constructor(
    descriptors: readonly Partial<CameraSourceDescriptor>[] = [{}],
    private readonly format: SourceVideoFormat = createCameraVideoFormat({
      id: 'synthetic-1280x720-30-rgba',
      width: 1280,
      height: 720,
      frameRate: { numerator: 30, denominator: 1 },
      pixelFormat: 'RGBA32',
    }),
  ) {
    this.descriptor = {
      id: 'synthetic-camera-provider',
      displayName: 'Synthetic Camera Provider',
      version: '5.2.4',
      sourceTypes: ['SYNTHETIC', 'CAMERA'],
      acquisitionModes: ['PUSH'],
    };
    this.descriptors = descriptors.map((d, i) =>
      freeze({
        sourceId: d.sourceId ?? `camera:synthetic:${i}`,
        streamId: d.streamId ?? `camera:synthetic:${i}:video:0`,
        providerId: this.descriptor.id,
        category: 'SYNTHETIC_CAMERA',
        displayName: d.displayName ?? `Synthetic Camera ${i + 1}`,
        supportedFormats: d.supportedFormats ?? [this.format],
        defaultFormat: d.defaultFormat ?? this.format,
        permissionState: d.permissionState ?? 'NOT_REQUIRED',
        acquisitionMode: 'PUSH',
        clockDomain: 'DEVICE_HARDWARE',
        reconnectable: d.reconnectable ?? true,
        hotPlug: false,
        hardwareTimestamps: true,
        controlSummary: { supported: false, count: 0 },
        orientation: 'LANDSCAPE',
        facingMode: 'UNKNOWN',
        physical: false,
        latencyClass: 'REALTIME',
        available: true,
        metadata: safe(d.metadata),
        ...d,
      } as CameraSourceDescriptor),
    );
  }
  async discover(_request = {}, _context: SourceProviderContext = { nowNs: nowDefault }) {
    return freeze({
      descriptors: this.descriptors.map(cameraDescriptorToSourceDescriptor),
      unavailable: [],
      warnings: [],
      providerErrors: [],
      durationNs: '0',
      partial: false,
    });
  }
  async createSource(descriptor: SourceDescriptor, context: SourceProviderContext) {
    const cd = this.descriptors.find((d) => d.sourceId === descriptor.id);
    if (!cd)
      throw new CameraError('CameraNotFound', 'Camera not found', { sourceId: descriptor.id });
    return this.createCameraSource(cd, context as CameraProviderContext);
  }
  async listCameraDevices(_context: CameraProviderContext) {
    return freeze(this.descriptors.map((d) => ({ ...d })));
  }
  async createCameraSource(
    descriptor: CameraSourceDescriptor,
    _context: CameraProviderContext = { nowNs: nowDefault },
  ) {
    const backend = new SyntheticCameraBackend({ format: descriptor.defaultFormat });
    this.lastBackend = backend;
    return new DefaultCameraSource(descriptor, backend);
  }
  getBackendHealth() {
    return (
      this.lastBackend?.getHealth?.() ??
      freeze({
        backendId: 'synthetic-camera-backend',
        healthy: true,
        open: false,
        capturing: false,
        updatedAtNs: nowDefault().toString(),
      })
    );
  }
  async shutdown() {
    /* no hardware to release */
  }
}

export const createNativeCameraBackendBoundary = (
  platform:
    | 'windows-media-foundation'
    | 'windows-directshow'
    | 'macos-avfoundation'
    | 'linux-v4l2'
    | 'linux-pipewire',
): CameraBackendHealthSnapshot =>
  freeze({
    backendId: `native-boundary:${platform}`,
    healthy: false,
    open: false,
    capturing: false,
    lastError: 'Native binding boundary declared; implementation intentionally deferred',
    updatedAtNs: nowDefault().toString(),
  });
