import {
  RuntimeEngineError,
  type RuntimeCommand,
  type RuntimeCommandHandler,
} from './execution-engine.js';
import type { SourcePayloadRef, VideoFrameEnvelope } from './source-acquisition.js';
import type { GpuResourceReference } from './gpu-runtime/index.js';

export type FrameMemoryDomain =
  | 'CPU_HEAP'
  | 'CPU_PINNED'
  | 'CPU_SHARED'
  | 'GPU_LOCAL'
  | 'GPU_UPLOAD'
  | 'GPU_READBACK'
  | 'GPU_SHARED'
  | 'EXTERNAL_DEVICE'
  | 'EXTERNAL_PROCESS'
  | 'IMPORTED_HANDLE'
  | 'SYNTHETIC'
  | 'UNKNOWN';
export type FrameStorageType =
  | 'OWNED_ALLOCATION'
  | 'IMPORTED_RESOURCE'
  | 'SHARED_RESOURCE'
  | 'BORROWED_RESOURCE'
  | 'EXTERNAL_HANDLE'
  | 'FRAME_VIEW'
  | 'STAGING_RESOURCE'
  | 'SYNTHETIC_RESOURCE';
export type VideoFrameFormat =
  | 'RGBA8'
  | 'BGRA8'
  | 'RGB24'
  | 'RGBA16F'
  | 'RGBA32F'
  | 'YUY2'
  | 'UYVY'
  | 'NV12'
  | 'P010'
  | 'I420'
  | 'YV12'
  | 'YUV420'
  | 'YUV422'
  | 'YUV444';
export type FramePlaneRole = 'PACKED' | 'Y' | 'U' | 'V' | 'UV' | 'VU' | 'A' | 'UNKNOWN';
export type FrameUsageFlag =
  | 'SOURCE_INPUT'
  | 'PROCESSING_INPUT'
  | 'PROCESSING_OUTPUT'
  | 'RENDER_TARGET'
  | 'SHADER_READ'
  | 'SHADER_WRITE'
  | 'COPY_SOURCE'
  | 'COPY_DESTINATION'
  | 'RECORDING_READ'
  | 'STREAMING_READ'
  | 'REPLAY_RETAIN'
  | 'CPU_READ'
  | 'CPU_WRITE'
  | 'GPU_READ'
  | 'GPU_WRITE'
  | 'EXTERNAL_SHARE'
  | 'TEMPORARY'
  | 'PERSISTENT';
export type FrameAccessMode =
  'READ_ONLY' | 'WRITE_ONLY' | 'READ_WRITE' | 'IMMUTABLE' | 'COPY_ON_WRITE';
export type FrameOwnerRole =
  | 'SOURCE'
  | 'FRAME_MEMORY_SYSTEM'
  | 'GPU_RESOURCE_MANAGER'
  | 'VIDEO_PROCESSOR'
  | 'COMPOSITOR'
  | 'RECORDER'
  | 'STREAMER'
  | 'REPLAY'
  | 'DIAGNOSTICS'
  | 'EXTERNAL_BACKEND'
  | 'TEST';
export type FramePinReason =
  | 'ACTIVE_RUNTIME_TICK'
  | 'GPU_SUBMISSION'
  | 'COMPOSITOR_INPUT'
  | 'RECORDING_PENDING'
  | 'STREAMING_PENDING'
  | 'REPLAY_BUFFER'
  | 'DIAGNOSTIC_CAPTURE'
  | 'EXTERNAL_EXPORT'
  | 'INTERNAL_TRANSITION';
export type FrameLifetimeClass =
  | 'TICK_TRANSIENT'
  | 'FRAME_TRANSIENT'
  | 'SHORT_LIVED'
  | 'PIPELINE_RETAINED'
  | 'RECORDING_RETAINED'
  | 'STREAMING_RETAINED'
  | 'REPLAY_RETAINED'
  | 'EXTERNAL_LIFETIME'
  | 'PERSISTENT';
export type FrameState =
  | 'ALLOCATING'
  | 'READY'
  | 'LEASED'
  | 'MAPPED'
  | 'IN_TRANSITION'
  | 'GPU_PENDING'
  | 'PINNED'
  | 'PENDING_RELEASE'
  | 'POOLED'
  | 'QUARANTINED'
  | 'LOST'
  | 'RELEASED'
  | 'FAILED';
export type FrameImportOwnershipMode = 'TRANSFER' | 'RETAIN' | 'BORROW' | 'REFERENCE';
export type FrameImportPolicy =
  'ZERO_COPY_ONLY' | 'EXPLICIT_COPY_FALLBACK' | 'IMPORT_OPAQUE' | 'BORROW_ONLY';
export type ZeroCopyReasonCode =
  | 'SOURCE_NOT_GPU_OR_SHARED'
  | 'BACKEND_IMPORT_UNSUPPORTED'
  | 'FORMAT_INCOMPATIBLE'
  | 'ALIGNMENT_INCOMPATIBLE'
  | 'SYNC_UNSUPPORTED'
  | 'OWNERSHIP_INVALID'
  | 'SECURITY_POLICY_REJECTED'
  | 'ELIGIBLE';
export type FramePoolPressureState = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'EXHAUSTED';

export interface FramePlaneLayout {
  readonly planeIndex: number;
  readonly planeRole: FramePlaneRole;
  readonly width: number;
  readonly height: number;
  readonly rowStrideBytes: number;
  readonly pixelStrideBytes: number;
  readonly offsetBytes: number;
  readonly sizeBytes: number;
  readonly alignment: number;
  readonly subsamplingX: number;
  readonly subsamplingY: number;
  readonly bitDepth: number;
  readonly componentOrder: readonly string[];
}
export interface FrameMemoryDescriptor {
  readonly frameId: string;
  readonly storageId: string;
  readonly format: VideoFrameFormat;
  readonly width: number;
  readonly height: number;
  readonly planes: readonly FramePlaneLayout[];
  readonly memoryDomain: FrameMemoryDomain;
  readonly storageType: FrameStorageType;
  readonly allocationSizeBytes: number;
  readonly rowStrides: readonly number[];
  readonly planeOffsets: readonly number[];
  readonly alignment: number;
  readonly usageFlags: readonly FrameUsageFlag[];
  readonly accessMode: FrameAccessMode;
  readonly colorMetadata: Readonly<Record<string, unknown>>;
  readonly alphaMode: 'OPAQUE' | 'PREMULTIPLIED' | 'STRAIGHT' | 'UNKNOWN';
  readonly orientation: 'NORMAL' | 'ROTATED_90' | 'ROTATED_180' | 'ROTATED_270' | 'UNKNOWN';
  readonly timestampMetadata: Readonly<Record<string, string>>;
  readonly frameGeneration: string;
  readonly storageGeneration: string;
  readonly importCapable: boolean;
  readonly exportCapable: boolean;
  readonly zeroCopyCapable: boolean;
  readonly mappable: boolean;
  readonly gpuResource?: GpuResourceReference;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface FrameIdentity {
  readonly frameId: string;
  readonly storageId: string;
  readonly sourceId?: string;
  readonly streamId?: string;
  readonly sequenceNumber?: string;
  readonly frameGeneration: string;
  readonly storageGeneration: string;
  readonly runtimeFrameNumber?: string;
  readonly creationTimestampNs: string;
  readonly sourceTimestampNs?: string;
  readonly normalizedTimestampNs?: string;
  readonly contentVersion: string;
  readonly parentFrameId?: string;
  readonly origin: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface FrameReferenceCounts {
  readonly activeLeases: number;
  readonly readLeases: number;
  readonly writeLeases: number;
  readonly externalReferences: number;
  readonly parentViewReferences: number;
  readonly childViewReferences: number;
  readonly activeMappings: number;
  readonly activeGpuSubmissions: number;
  readonly pinCount: number;
}
export interface FrameLease {
  readonly leaseId: string;
  readonly frameId: string;
  readonly ownerId: string;
  readonly access: FrameAccessMode;
  readonly generation: bigint;
  readonly acquiredAtNs: bigint;
  readonly expiresAtNs?: bigint;
  release(): void;
}
export interface FrameLeaseSnapshot extends Omit<
  FrameLease,
  'generation' | 'acquiredAtNs' | 'expiresAtNs' | 'release'
> {
  readonly generation: string;
  readonly acquiredAtNs: string;
  readonly expiresAtNs?: string;
  readonly released: boolean;
  readonly expired: boolean;
}
export interface FrameMappedPlane {
  readonly planeIndex: number;
  readonly byteRangeRef: string;
  readonly offsetBytes: number;
  readonly sizeBytes: number;
  readonly rowStrideBytes: number;
}
export interface FrameMappedView {
  readonly mapId: string;
  readonly frameId: string;
  readonly generation: bigint;
  readonly access: FrameAccessMode;
  readonly planes: readonly FrameMappedPlane[];
  readonly mappedAtNs: bigint;
}
export interface FrameMappedViewSnapshot extends Omit<
  FrameMappedView,
  'generation' | 'mappedAtNs'
> {
  readonly generation: string;
  readonly mappedAtNs: string;
}
export interface FrameMemorySnapshot {
  readonly identity: FrameIdentity;
  readonly descriptor: FrameMemoryDescriptor;
  readonly state: FrameState;
  readonly lifetimeClass: FrameLifetimeClass;
  readonly referenceCounts: FrameReferenceCounts;
  readonly pinReasons: Readonly<Record<string, number>>;
  readonly leaseIds: readonly string[];
  readonly mappingIds: readonly string[];
  readonly lost: boolean;
  readonly quarantined: boolean;
}
export interface FramePoolClassSnapshot {
  readonly key: string;
  readonly idleFrames: number;
  readonly idleBytes: number;
  readonly generationHighWater: string;
}
export interface FrameMemoryPoolSnapshot {
  readonly classes: readonly FramePoolClassSnapshot[];
  readonly totalIdleFrames: number;
  readonly totalIdleBytes: number;
  readonly pressureState: FramePoolPressureState;
  readonly maximumFrames: number;
  readonly maximumBytes: number;
}
export interface FrameMemoryTransitionSnapshot {
  readonly operationId: string;
  readonly frameId: string;
  readonly fromDomain: FrameMemoryDomain;
  readonly toDomain: FrameMemoryDomain;
  readonly generation: string;
  readonly state: 'STARTED' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  readonly explicitCopy: boolean;
  readonly synchronizationRequired: boolean;
}
export interface FrameMemoryHealthSnapshot {
  readonly managerState: 'CREATED' | 'READY' | 'SHUTTING_DOWN' | 'SHUTDOWN' | 'FAILED';
  readonly totalActiveFrames: number;
  readonly totalPooledFrames: number;
  readonly totalLeasedFrames: number;
  readonly totalMappedFrames: number;
  readonly totalPinnedFrames: number;
  readonly totalTransitioningFrames: number;
  readonly totalLostFrames: number;
  readonly totalQuarantinedFrames: number;
  readonly cpuBytesAllocated: number;
  readonly gpuBytesReferenced: number;
  readonly sharedBytesReferenced: number;
  readonly poolBytes: number;
  readonly peakBytes: number;
  readonly allocationFailures: number;
  readonly importFailures: number;
  readonly transitionFailures: number;
  readonly staleGenerationRejections: number;
  readonly doubleReleaseAttempts: number;
  readonly mappingLeaks: number;
  readonly leaseLeaks: number;
  readonly pinLeaks: number;
  readonly poolPressureState: FramePoolPressureState;
  readonly deviceLossCount: number;
  readonly lastError?: string;
  readonly updatedAtNs: string;
}
export interface FrameMemoryTelemetrySnapshot {
  readonly totalFrameAllocations: number;
  readonly totalFrameImports: number;
  readonly totalFrameViews: number;
  readonly totalFrameClones: number;
  readonly totalFrameReuses: number;
  readonly totalFrameReleases: number;
  readonly totalFrameMappings: number;
  readonly totalFrameUnmappings: number;
  readonly totalFramePins: number;
  readonly totalFrameUnpins: number;
  readonly totalDomainTransitions: number;
  readonly successfulDomainTransitions: number;
  readonly failedDomainTransitions: number;
  readonly zeroCopyEligibleCount: number;
  readonly zeroCopyImportCount: number;
  readonly fallbackCopyCount: number;
  readonly allocationFailureCount: number;
  readonly staleGenerationRejectCount: number;
  readonly doubleReleaseAttemptCount: number;
  readonly leakedLeaseCount: number;
  readonly leakedMappingCount: number;
  readonly lostFrameCount: number;
  readonly quarantinedFrameCount: number;
  readonly poolTrimCount: number;
  readonly garbageCollectionCount: number;
  readonly currentCPUBytes: number;
  readonly currentGPUBytes: number;
  readonly currentSharedBytes: number;
  readonly peakTotalBytes: number;
  readonly poolHitCount: number;
  readonly poolMissCount: number;
  readonly averageAllocationLatencyNs: string;
  readonly maximumAllocationLatencyNs: string;
  readonly currentFrameIds: readonly string[];
  readonly lastFrameMemoryEvent?: string;
  readonly healthSummary: string;
}
export interface FrameMemorySystemSnapshot {
  readonly health: FrameMemoryHealthSnapshot;
  readonly telemetry: FrameMemoryTelemetrySnapshot;
  readonly frames: readonly FrameMemorySnapshot[];
  readonly leases: readonly FrameLeaseSnapshot[];
  readonly mappings: readonly FrameMappedViewSnapshot[];
  readonly pools: FrameMemoryPoolSnapshot;
  readonly transitions: readonly FrameMemoryTransitionSnapshot[];
  readonly containsMediaPayloads: false;
  readonly containsRuntimeHandles: false;
}
export interface ZeroCopyAssessment {
  readonly eligible: boolean;
  readonly reasonCodes: readonly ZeroCopyReasonCode[];
  readonly requiredTransition?: FrameMemoryDomain;
  readonly synchronizationRequired: boolean;
}
export interface FrameAllocationRequest {
  readonly width: number;
  readonly height: number;
  readonly format: VideoFrameFormat;
  readonly memoryDomain: FrameMemoryDomain;
  readonly usageFlags?: readonly FrameUsageFlag[];
  readonly accessMode?: FrameAccessMode;
  readonly alignment?: number;
  readonly planeLayoutOverride?: readonly FramePlaneLayout[];
  readonly zeroInitialize?: boolean;
  readonly poolEligible?: boolean;
  readonly lifetimeClass?: FrameLifetimeClass;
  readonly ownerId: string;
  readonly correlationId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface FrameImportRequest {
  readonly sourceEnvelope?: VideoFrameEnvelope;
  readonly payload?: SourcePayloadRef;
  readonly ownershipMode: FrameImportOwnershipMode;
  readonly importPolicy: FrameImportPolicy;
  readonly expectedFormat?: VideoFrameFormat;
  readonly expectedGeneration?: bigint;
  readonly releaseCallback?: () => void;
  readonly synchronizationMetadata?: Readonly<Record<string, unknown>>;
  readonly ownerId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface FrameViewRequest {
  readonly frameId: string;
  readonly ownerId: string;
  readonly access?: FrameAccessMode;
  readonly planeIndexes?: readonly number[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface FrameCloneRequest {
  readonly frameId: string;
  readonly ownerId: string;
  readonly access?: FrameAccessMode;
  readonly copyOnWrite?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface FrameMapRequest {
  readonly frameId: string;
  readonly access: 'READ' | 'WRITE' | 'READ_WRITE';
  readonly planeIndexes?: readonly number[];
  readonly timeoutNs?: bigint;
  readonly expectedGeneration?: bigint;
}
export interface FrameMemoryTransitionRequest {
  readonly frameId: string;
  readonly toDomain: FrameMemoryDomain;
  readonly explicitCopy: boolean;
  readonly expectedGeneration?: bigint;
  readonly ownerId: string;
  readonly synchronizationRequired?: boolean;
}
export interface FrameMemoryTransitionResult {
  readonly operationId: string;
  readonly frameId: string;
  readonly fromDomain: FrameMemoryDomain;
  readonly toDomain: FrameMemoryDomain;
  readonly generation: bigint;
  readonly completed: boolean;
}
export interface FrameMemoryFilter {
  readonly sourceId?: string;
  readonly streamId?: string;
  readonly memoryDomain?: FrameMemoryDomain;
  readonly state?: FrameState;
}
export interface FrameGarbageCollectionResult {
  readonly releasedFrames: number;
  readonly pooledFrames: number;
  readonly trimmedBytes: number;
}
export interface FrameMemoryManager {
  allocate(r: FrameAllocationRequest): Promise<FrameLease>;
  importFrame(r: FrameImportRequest): Promise<FrameLease>;
  createView(r: FrameViewRequest): FrameLease;
  cloneFrame(r: FrameCloneRequest): Promise<FrameLease>;
  retain(frameId: string, ownerId: string, access?: FrameAccessMode): FrameLease;
  release(frameId: string, ownerId: string): void;
  map(r: FrameMapRequest): Promise<FrameMappedView>;
  unmap(frameId: string, mapId: string): Promise<void>;
  pin(frameId: string, reason: FramePinReason): void;
  unpin(frameId: string, reason: FramePinReason): void;
  transition(r: FrameMemoryTransitionRequest): Promise<FrameMemoryTransitionResult>;
  getFrame(frameId: string): Readonly<FrameMemorySnapshot> | undefined;
  listFrames(f?: FrameMemoryFilter): readonly Readonly<FrameMemorySnapshot>[];
  getPoolSnapshot(): Readonly<FrameMemoryPoolSnapshot>;
  getSnapshot(): Readonly<FrameMemorySystemSnapshot>;
  collectGarbage(): FrameGarbageCollectionResult;
  shutdown(): Promise<void>;
  assertInvariants(): void;
}
export class FrameMemoryError extends RuntimeEngineError {}
const err = (name: string, msg: string, meta?: Record<string, unknown>) =>
  new FrameMemoryError(name, msg, meta);
export const FRAME_MEMORY_COMMAND_TYPES = [
  'FRAME_ALLOCATE',
  'FRAME_IMPORT',
  'FRAME_CLONE',
  'FRAME_CREATE_VIEW',
  'FRAME_MAP',
  'FRAME_UNMAP',
  'FRAME_PIN',
  'FRAME_UNPIN',
  'FRAME_TRANSITION_DOMAIN',
  'FRAME_RELEASE',
  'FRAME_TRIM_POOLS',
  'FRAME_COLLECT_GARBAGE',
  'FRAME_INVALIDATE_SOURCE',
  'FRAME_PURGE_LOST',
  'FRAME_SET_BUDGET',
] as const;
export type FrameMemoryCommandType = (typeof FRAME_MEMORY_COMMAND_TYPES)[number];
type Rec = {
  identity: FrameIdentity;
  descriptor: FrameMemoryDescriptor;
  state: FrameState;
  lifetimeClass: FrameLifetimeClass;
  counts: FrameReferenceCounts;
  leaseIds: Set<string>;
  mappingIds: Set<string>;
  pins: Map<FramePinReason, number>;
  releaseCallback?: () => void;
  poolEligible: boolean;
};
type LeaseRec = { lease: FrameLease; released: boolean };
type MapRec = { view: FrameMappedView };
const freeze = <T>(v: T): T => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const c of Object.values(v as Record<string, unknown>)) freeze(c);
  }
  return v;
};
const safe = (m?: Readonly<Record<string, unknown>>) =>
  freeze(JSON.parse(JSON.stringify(m ?? {}))) as Readonly<Record<string, unknown>>;
const big = (n?: bigint) => n?.toString();
const fmtMap: Record<
  VideoFrameFormat,
  { planes: FramePlaneRole[]; bpp: number[]; sx: number[]; sy: number[]; bits: number }
> = {
  RGBA8: { planes: ['PACKED'], bpp: [4], sx: [1], sy: [1], bits: 8 },
  BGRA8: { planes: ['PACKED'], bpp: [4], sx: [1], sy: [1], bits: 8 },
  RGB24: { planes: ['PACKED'], bpp: [3], sx: [1], sy: [1], bits: 8 },
  RGBA16F: { planes: ['PACKED'], bpp: [8], sx: [1], sy: [1], bits: 16 },
  RGBA32F: { planes: ['PACKED'], bpp: [16], sx: [1], sy: [1], bits: 32 },
  YUY2: { planes: ['PACKED'], bpp: [2], sx: [1], sy: [1], bits: 8 },
  UYVY: { planes: ['PACKED'], bpp: [2], sx: [1], sy: [1], bits: 8 },
  NV12: { planes: ['Y', 'UV'], bpp: [1, 2], sx: [1, 2], sy: [1, 2], bits: 8 },
  P010: { planes: ['Y', 'UV'], bpp: [2, 4], sx: [1, 2], sy: [1, 2], bits: 10 },
  I420: { planes: ['Y', 'U', 'V'], bpp: [1, 1, 1], sx: [1, 2, 2], sy: [1, 2, 2], bits: 8 },
  YV12: { planes: ['Y', 'V', 'U'], bpp: [1, 1, 1], sx: [1, 2, 2], sy: [1, 2, 2], bits: 8 },
  YUV420: { planes: ['Y', 'U', 'V'], bpp: [1, 1, 1], sx: [1, 2, 2], sy: [1, 2, 2], bits: 8 },
  YUV422: { planes: ['Y', 'U', 'V'], bpp: [1, 1, 1], sx: [1, 2, 2], sy: [1, 1, 1], bits: 8 },
  YUV444: { planes: ['Y', 'U', 'V'], bpp: [1, 1, 1], sx: [1, 1, 1], sy: [1, 1, 1], bits: 8 },
};
const align = (n: number, a: number) => Math.ceil(n / a) * a;
export function createFramePlaneLayout(
  format: VideoFrameFormat,
  width: number,
  height: number,
  alignment = 1,
) {
  const d = fmtMap[format];
  if (!d) throw err('FrameFormatUnsupported', `Unsupported frame format ${format}`);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0)
    throw err('FrameAllocationInvalid', 'Invalid frame dimensions');
  let off = 0;
  return d.planes.map((role, i) => {
    const w = Math.ceil(width / d.sx[i]!);
    const h = Math.ceil(height / d.sy[i]!);
    const stride = align(w * d.bpp[i]!, alignment);
    const size = stride * h;
    const p = {
      planeIndex: i,
      planeRole: role,
      width: w,
      height: h,
      rowStrideBytes: stride,
      pixelStrideBytes: d.bpp[i]!,
      offsetBytes: off,
      sizeBytes: size,
      alignment,
      subsamplingX: d.sx[i]!,
      subsamplingY: d.sy[i]!,
      bitDepth: d.bits,
      componentOrder: role === 'PACKED' ? [format] : [role],
    };
    off += size;
    return freeze(p);
  });
}
export function validateFramePlaneLayout(
  planes: readonly FramePlaneLayout[],
  size: number,
  format: VideoFrameFormat,
) {
  if (planes.length !== fmtMap[format].planes.length)
    throw err('FramePlaneLayoutInvalid', 'Invalid plane count');
  const ranges: [number, number][] = [];
  for (const p of planes) {
    if (
      p.width <= 0 ||
      p.height <= 0 ||
      p.rowStrideBytes <= 0 ||
      p.sizeBytes <= 0 ||
      p.offsetBytes < 0
    )
      throw err('FramePlaneLayoutInvalid', 'Invalid plane dimensions');
    if (p.offsetBytes + p.sizeBytes > size)
      throw err('FramePlaneLayoutInvalid', 'Plane exceeds allocation');
    for (const [a, b] of ranges)
      if (Math.max(a, p.offsetBytes) < Math.min(b, p.offsetBytes + p.sizeBytes))
        throw err('FramePlaneLayoutInvalid', 'Overlapping planes');
    ranges.push([p.offsetBytes, p.offsetBytes + p.sizeBytes]);
  }
}
export function assessFrameZeroCopy(input: {
  memoryDomain: FrameMemoryDomain;
  format?: VideoFrameFormat;
  backendSupportsImport?: boolean;
  alignmentCompatible?: boolean;
  synchronizationCompatible?: boolean;
  ownershipValid?: boolean;
  securityAllowed?: boolean;
}): ZeroCopyAssessment {
  const reasons: ZeroCopyReasonCode[] = [];
  if (
    !['GPU_LOCAL', 'GPU_SHARED', 'EXTERNAL_DEVICE', 'IMPORTED_HANDLE', 'CPU_SHARED'].includes(
      input.memoryDomain,
    )
  )
    reasons.push('SOURCE_NOT_GPU_OR_SHARED');
  if (!input.backendSupportsImport) reasons.push('BACKEND_IMPORT_UNSUPPORTED');
  if (!input.format || !fmtMap[input.format]) reasons.push('FORMAT_INCOMPATIBLE');
  if (input.alignmentCompatible === false) reasons.push('ALIGNMENT_INCOMPATIBLE');
  if (input.synchronizationCompatible === false) reasons.push('SYNC_UNSUPPORTED');
  if (input.ownershipValid === false) reasons.push('OWNERSHIP_INVALID');
  if (input.securityAllowed === false) reasons.push('SECURITY_POLICY_REJECTED');
  const eligible = reasons.length === 0;
  const out: ZeroCopyAssessment = {
    eligible,
    reasonCodes: eligible ? ['ELIGIBLE'] : reasons,
    synchronizationRequired: input.synchronizationCompatible !== true,
    ...(eligible && input.memoryDomain === 'CPU_SHARED'
      ? { requiredTransition: 'GPU_SHARED' as FrameMemoryDomain }
      : {}),
  };
  return freeze(out);
}
export class SyntheticFrameMemoryManager implements FrameMemoryManager {
  private frames = new Map<string, Rec>();
  private leases = new Map<string, LeaseRec>();
  private maps = new Map<string, MapRec>();
  private pool = new Map<string, Rec[]>();
  private transitions: FrameMemoryTransitionSnapshot[] = [];
  private seq = 0n;
  private storageGen = 0n;
  private state: FrameMemoryHealthSnapshot['managerState'] = 'READY';
  private t: FrameMemoryTelemetrySnapshot;
  constructor(
    private nowNs: () => bigint = () => BigInt(Date.now()) * 1000000n,
    private budget = {
      maximumFrames: 1024,
      maximumBytes: 512 * 1024 * 1024,
      maximumIdleFrames: 128,
      maximumIdleBytes: 128 * 1024 * 1024,
    },
  ) {
    this.t = this.telemetry();
  }
  private id(p: string) {
    this.seq++;
    return `frame-memory:${p}:${this.seq}`;
  }
  private key(r: FrameAllocationRequest) {
    return [
      r.memoryDomain,
      r.format,
      r.width,
      r.height,
      r.alignment ?? 1,
      (r.usageFlags ?? []).join('|'),
    ].join(':');
  }
  private bytes() {
    let cpu = 0,
      gpu = 0,
      shared = 0;
    for (const r of this.frames.values()) {
      const b = r.descriptor.allocationSizeBytes;
      if (r.state === 'RELEASED' || r.state === 'POOLED') continue;
      if (r.descriptor.memoryDomain.startsWith('GPU')) gpu += b;
      else if (r.descriptor.memoryDomain.includes('SHARED')) shared += b;
      else cpu += b;
    }
    return { cpu, gpu, shared, total: cpu + gpu + shared };
  }
  private telemetry(): FrameMemoryTelemetrySnapshot {
    return freeze({
      totalFrameAllocations: 0,
      totalFrameImports: 0,
      totalFrameViews: 0,
      totalFrameClones: 0,
      totalFrameReuses: 0,
      totalFrameReleases: 0,
      totalFrameMappings: 0,
      totalFrameUnmappings: 0,
      totalFramePins: 0,
      totalFrameUnpins: 0,
      totalDomainTransitions: 0,
      successfulDomainTransitions: 0,
      failedDomainTransitions: 0,
      zeroCopyEligibleCount: 0,
      zeroCopyImportCount: 0,
      fallbackCopyCount: 0,
      allocationFailureCount: 0,
      staleGenerationRejectCount: 0,
      doubleReleaseAttemptCount: 0,
      leakedLeaseCount: 0,
      leakedMappingCount: 0,
      lostFrameCount: 0,
      quarantinedFrameCount: 0,
      poolTrimCount: 0,
      garbageCollectionCount: 0,
      currentCPUBytes: 0,
      currentGPUBytes: 0,
      currentSharedBytes: 0,
      peakTotalBytes: 0,
      poolHitCount: 0,
      poolMissCount: 0,
      averageAllocationLatencyNs: '0',
      maximumAllocationLatencyNs: '0',
      currentFrameIds: [],
      healthSummary: 'READY',
    });
  }
  private bump(p: Partial<FrameMemoryTelemetrySnapshot>) {
    const b = this.bytes();
    this.t = freeze({
      ...this.t,
      ...p,
      currentCPUBytes: b.cpu,
      currentGPUBytes: b.gpu,
      currentSharedBytes: b.shared,
      peakTotalBytes: Math.max(this.t.peakTotalBytes, b.total),
      currentFrameIds: [...this.frames.keys()].sort(),
      healthSummary: this.state,
    });
  }
  async allocate(r: FrameAllocationRequest) {
    if (this.state === 'SHUTDOWN') throw err('FrameShutdownError', 'No allocation after shutdown');
    const start = this.nowNs();
    const planes =
      r.planeLayoutOverride ??
      createFramePlaneLayout(r.format, r.width, r.height, r.alignment ?? 1);
    const size = planes.reduce((m, p) => Math.max(m, p.offsetBytes + p.sizeBytes), 0);
    validateFramePlaneLayout(planes, size, r.format);
    if (
      this.frames.size >= this.budget.maximumFrames ||
      this.bytes().total + size > this.budget.maximumBytes
    ) {
      this.bump({
        allocationFailureCount: this.t.allocationFailureCount + 1,
        lastFrameMemoryEvent: 'FrameAllocationFailed',
      } as Partial<FrameMemoryTelemetrySnapshot>);
      throw err('FrameAllocationBudgetExceeded', 'Frame allocation budget exceeded');
    }
    const k = this.key(r);
    let rec = this.pool.get(k)?.shift();
    const reuse = !!rec;
    const frameId = this.id('frame');
    const storageId = reuse ? rec!.identity.storageId : this.id('storage');
    const sg = ++this.storageGen;
    const fg = sg;
    const ident = freeze({
      frameId,
      storageId,
      frameGeneration: fg.toString(),
      storageGeneration: sg.toString(),
      creationTimestampNs: this.nowNs().toString(),
      contentVersion: '1',
      origin: 'ALLOCATE',
      metadata: safe(r.metadata),
    });
    const desc = freeze({
      frameId,
      storageId,
      format: r.format,
      width: r.width,
      height: r.height,
      planes,
      memoryDomain: r.memoryDomain,
      storageType: r.memoryDomain === 'SYNTHETIC' ? 'SYNTHETIC_RESOURCE' : 'OWNED_ALLOCATION',
      allocationSizeBytes: size,
      rowStrides: planes.map((p) => p.rowStrideBytes),
      planeOffsets: planes.map((p) => p.offsetBytes),
      alignment: r.alignment ?? 1,
      usageFlags: [...(r.usageFlags ?? [])],
      accessMode: r.accessMode ?? 'READ_WRITE',
      colorMetadata: {},
      alphaMode: 'UNKNOWN',
      orientation: 'NORMAL',
      timestampMetadata: {},
      frameGeneration: fg.toString(),
      storageGeneration: sg.toString(),
      importCapable: false,
      exportCapable: r.usageFlags?.includes('EXTERNAL_SHARE') ?? false,
      zeroCopyCapable: r.memoryDomain.includes('GPU') || r.memoryDomain.includes('SHARED'),
      mappable: [
        'CPU_HEAP',
        'CPU_PINNED',
        'CPU_SHARED',
        'GPU_UPLOAD',
        'GPU_READBACK',
        'SYNTHETIC',
      ].includes(r.memoryDomain),
      metadata: safe(r.metadata),
    }) as FrameMemoryDescriptor;
    rec = {
      identity: ident,
      descriptor: desc,
      state: 'READY',
      lifetimeClass: r.lifetimeClass ?? 'SHORT_LIVED',
      counts: {
        activeLeases: 0,
        readLeases: 0,
        writeLeases: 0,
        externalReferences: 0,
        parentViewReferences: 0,
        childViewReferences: 0,
        activeMappings: 0,
        activeGpuSubmissions: 0,
        pinCount: 0,
      },
      leaseIds: new Set(),
      mappingIds: new Set(),
      pins: new Map(),
      poolEligible: r.poolEligible !== false,
    };
    this.frames.set(frameId, rec);
    const dur = this.nowNs() - start;
    this.bump({
      totalFrameAllocations: this.t.totalFrameAllocations + 1,
      totalFrameReuses: this.t.totalFrameReuses + (reuse ? 1 : 0),
      poolHitCount: this.t.poolHitCount + (reuse ? 1 : 0),
      poolMissCount: this.t.poolMissCount + (reuse ? 0 : 1),
      maximumAllocationLatencyNs:
        dur > BigInt(this.t.maximumAllocationLatencyNs)
          ? dur.toString()
          : this.t.maximumAllocationLatencyNs,
      lastFrameMemoryEvent: 'FrameAllocated',
    });
    return this.retain(frameId, r.ownerId, r.accessMode ?? 'READ_WRITE');
  }
  async importFrame(r: FrameImportRequest) {
    const env = r.sourceEnvelope;
    const f =
      r.expectedFormat ?? ((env?.format.pixelFormat?.toUpperCase() as VideoFrameFormat) || 'RGBA8');
    const domain: FrameMemoryDomain =
      env?.memoryDomain === 'GPU'
        ? 'GPU_LOCAL'
        : env?.memoryDomain === 'CPU'
          ? 'CPU_HEAP'
          : r.ownershipMode === 'BORROW'
            ? 'IMPORTED_HANDLE'
            : 'SYNTHETIC';
    const z = assessFrameZeroCopy({
      memoryDomain: domain,
      format: f,
      backendSupportsImport: r.importPolicy === 'ZERO_COPY_ONLY',
      securityAllowed: true,
      ownershipValid: r.ownershipMode !== 'BORROW',
    });
    this.bump({
      totalFrameImports: this.t.totalFrameImports + 1,
      zeroCopyEligibleCount: this.t.zeroCopyEligibleCount + (z.eligible ? 1 : 0),
      zeroCopyImportCount: this.t.zeroCopyImportCount + (z.eligible ? 1 : 0),
      fallbackCopyCount:
        this.t.fallbackCopyCount +
        (!z.eligible && r.importPolicy === 'EXPLICIT_COPY_FALLBACK' ? 1 : 0),
      lastFrameMemoryEvent: z.eligible ? 'FrameZeroCopyEligible' : 'FrameZeroCopyRejected',
    });
    if (!z.eligible && r.importPolicy === 'ZERO_COPY_ONLY')
      throw err('FrameImportFailed', 'Zero-copy import rejected');
    const lease = await this.allocate({
      width: env?.format.width ?? 1,
      height: env?.format.height ?? 1,
      format: f,
      memoryDomain: domain,
      accessMode: 'READ_ONLY',
      usageFlags: ['SOURCE_INPUT'],
      ownerId: r.ownerId,
      metadata: { ...r.metadata, sourcePayloadKind: r.payload?.kind ?? env?.payload.kind },
    });
    const rec = this.need(lease.frameId);
    rec.identity = freeze({
      ...rec.identity,
      ...(env?.sourceId ? { sourceId: env.sourceId } : {}),
      ...(env?.streamId ? { streamId: env.streamId } : {}),
      ...(env?.sequenceNumber !== undefined
        ? { sequenceNumber: env.sequenceNumber.toString() }
        : {}),
      ...(env?.sourceTimestampNs !== undefined
        ? { sourceTimestampNs: env.sourceTimestampNs.toString() }
        : {}),
      ...(env?.normalizedTimestampNs !== undefined
        ? { normalizedTimestampNs: env.normalizedTimestampNs.toString() }
        : {}),
      ...(env?.frameNumberHint !== undefined
        ? { runtimeFrameNumber: env.frameNumberHint.toString() }
        : {}),
      origin: 'IMPORT',
    });
    if (r.releaseCallback) rec.releaseCallback = r.releaseCallback;
    return lease;
  }
  createView(r: FrameViewRequest) {
    const p = this.need(r.frameId);
    const lease = this.retain(r.frameId, r.ownerId, r.access ?? 'READ_ONLY');
    p.counts = { ...p.counts, childViewReferences: p.counts.childViewReferences + 1 };
    this.bump({
      totalFrameViews: this.t.totalFrameViews + 1,
      lastFrameMemoryEvent: 'FrameViewCreated',
    });
    return lease;
  }
  async cloneFrame(r: FrameCloneRequest) {
    const src = this.need(r.frameId);
    this.bump({
      totalFrameClones: this.t.totalFrameClones + 1,
      lastFrameMemoryEvent: 'FrameCloneStarted',
    });
    return this.allocate({
      width: src.descriptor.width,
      height: src.descriptor.height,
      format: src.descriptor.format,
      memoryDomain: src.descriptor.memoryDomain,
      usageFlags: src.descriptor.usageFlags,
      accessMode: r.access ?? (r.copyOnWrite ? 'COPY_ON_WRITE' : src.descriptor.accessMode),
      ownerId: r.ownerId,
      metadata: { ...r.metadata, parentFrameId: r.frameId, copyOnWrite: !!r.copyOnWrite },
    });
  }
  retain(frameId: string, ownerId: string, access: FrameAccessMode = 'READ_ONLY') {
    const r = this.need(frameId);
    if (r.state === 'LOST' || r.state === 'RELEASED')
      throw err('FrameResourceLost', 'Frame is not accessible');
    if (
      r.descriptor.accessMode === 'IMMUTABLE' &&
      (access === 'WRITE_ONLY' || access === 'READ_WRITE')
    )
      throw err('FrameImmutable', 'Immutable frame cannot be writable');
    if (
      (access === 'WRITE_ONLY' || access === 'READ_WRITE') &&
      (r.counts.activeLeases > 0 || r.counts.activeMappings > 0)
    )
      throw err('FrameWriteConflict', 'Writable lease requires exclusive access');
    if (r.counts.writeLeases > 0 && (access === 'READ_ONLY' || access === 'READ_WRITE'))
      throw err('FrameWriteConflict', 'Write lease is active');
    const id = this.id('lease');
    const gen = BigInt(r.identity.frameGeneration);
    const lease = freeze({
      leaseId: id,
      frameId,
      ownerId,
      access,
      generation: gen,
      acquiredAtNs: this.nowNs(),
      release: () => this.releaseLease(id),
    }) as FrameLease;
    this.leases.set(id, { lease, released: false });
    r.leaseIds.add(id);
    r.counts = {
      ...r.counts,
      activeLeases: r.counts.activeLeases + 1,
      readLeases: r.counts.readLeases + (access === 'READ_ONLY' ? 1 : 0),
      writeLeases: r.counts.writeLeases + (access !== 'READ_ONLY' ? 1 : 0),
    };
    r.state = 'LEASED';
    this.bump({ lastFrameMemoryEvent: 'FrameLeaseAcquired' });
    return lease;
  }
  release(frameId: string, ownerId: string) {
    const l = [...this.leases.values()].find(
      (x) => x.lease.frameId === frameId && x.lease.ownerId === ownerId && !x.released,
    );
    if (!l) throw err('FrameLeaseNotFound', 'Lease not found');
    this.releaseLease(l.lease.leaseId);
  }
  private releaseLease(id: string) {
    const lr = this.leases.get(id);
    if (!lr) throw err('FrameLeaseNotFound', 'Lease not found');
    if (lr.released) {
      this.bump({
        doubleReleaseAttemptCount: this.t.doubleReleaseAttemptCount + 1,
        lastFrameMemoryEvent: 'FrameMemoryDoubleRelease',
      });
      throw err('FrameLeaseAlreadyReleased', 'Lease already released');
    }
    const r = this.need(lr.lease.frameId);
    lr.released = true;
    r.leaseIds.delete(id);
    r.counts = {
      ...r.counts,
      activeLeases: r.counts.activeLeases - 1,
      readLeases: r.counts.readLeases - (lr.lease.access === 'READ_ONLY' ? 1 : 0),
      writeLeases: r.counts.writeLeases - (lr.lease.access !== 'READ_ONLY' ? 1 : 0),
    };
    if (r.counts.activeLeases === 0) r.state = 'READY';
    this.bump({
      totalFrameReleases: this.t.totalFrameReleases + 1,
      lastFrameMemoryEvent: 'FrameLeaseReleased',
    });
  }
  async map(q: FrameMapRequest) {
    const r = this.need(q.frameId);
    if (
      q.expectedGeneration !== undefined &&
      q.expectedGeneration !== BigInt(r.identity.frameGeneration)
    ) {
      this.bump({ staleGenerationRejectCount: this.t.staleGenerationRejectCount + 1 });
      throw err('FrameGenerationMismatch', 'Stale frame generation');
    }
    if (!r.descriptor.mappable)
      throw err('FrameMappingUnsupported', 'Frame domain is not mappable');
    const writable = q.access !== 'READ';
    if (r.descriptor.accessMode === 'IMMUTABLE' && writable)
      throw err('FrameImmutable', 'Immutable frame cannot be mapped writable');
    if (writable && (r.counts.activeMappings > 0 || r.counts.activeLeases > 0))
      throw err('FrameMappingConflict', 'Writable map requires exclusive access');
    const planes = (q.planeIndexes ?? r.descriptor.planes.map((p) => p.planeIndex)).map((i) => {
      const p = r.descriptor.planes[i];
      if (!p) throw err('FramePlaneLayoutInvalid', 'Unknown plane');
      return freeze({
        planeIndex: i,
        byteRangeRef: `opaque-byte-range:${q.frameId}:${i}`,
        offsetBytes: p.offsetBytes,
        sizeBytes: p.sizeBytes,
        rowStrideBytes: p.rowStrideBytes,
      });
    });
    const view = freeze({
      mapId: this.id('map'),
      frameId: q.frameId,
      generation: BigInt(r.identity.frameGeneration),
      access:
        q.access === 'READ' ? 'READ_ONLY' : q.access === 'WRITE' ? 'WRITE_ONLY' : 'READ_WRITE',
      planes,
      mappedAtNs: this.nowNs(),
    }) as FrameMappedView;
    this.maps.set(view.mapId, { view });
    r.mappingIds.add(view.mapId);
    r.counts = { ...r.counts, activeMappings: r.counts.activeMappings + 1 };
    r.state = 'MAPPED';
    this.bump({
      totalFrameMappings: this.t.totalFrameMappings + 1,
      lastFrameMemoryEvent: 'FrameMapped',
    });
    return view;
  }
  async unmap(frameId: string, mapId: string) {
    const r = this.need(frameId);
    const m = this.maps.get(mapId);
    if (!m) throw err('FrameMappingNotFound', 'Mapping not found');
    if (m.view.frameId !== frameId) throw err('FrameMappingNotFound', 'Mapping/frame mismatch');
    this.maps.delete(mapId);
    r.mappingIds.delete(mapId);
    r.counts = { ...r.counts, activeMappings: r.counts.activeMappings - 1 };
    if (r.counts.activeMappings === 0) r.state = r.counts.activeLeases ? 'LEASED' : 'READY';
    this.bump({
      totalFrameUnmappings: this.t.totalFrameUnmappings + 1,
      lastFrameMemoryEvent: 'FrameUnmapped',
    });
  }
  pin(id: string, reason: FramePinReason) {
    const r = this.need(id);
    r.pins.set(reason, (r.pins.get(reason) ?? 0) + 1);
    r.counts = { ...r.counts, pinCount: r.counts.pinCount + 1 };
    r.state = 'PINNED';
    this.bump({ totalFramePins: this.t.totalFramePins + 1, lastFrameMemoryEvent: 'FramePinned' });
  }
  unpin(id: string, reason: FramePinReason) {
    const r = this.need(id);
    const n = r.pins.get(reason) ?? 0;
    if (n <= 0) throw err('FramePinNotFound', 'Pin not found');
    n === 1 ? r.pins.delete(reason) : r.pins.set(reason, n - 1);
    r.counts = { ...r.counts, pinCount: r.counts.pinCount - 1 };
    if (r.counts.pinCount === 0) r.state = r.counts.activeLeases ? 'LEASED' : 'READY';
    this.bump({
      totalFrameUnpins: this.t.totalFrameUnpins + 1,
      lastFrameMemoryEvent: 'FrameUnpinned',
    });
  }
  async transition(q: FrameMemoryTransitionRequest) {
    const r = this.need(q.frameId);
    if (
      q.expectedGeneration !== undefined &&
      q.expectedGeneration !== BigInt(r.identity.frameGeneration)
    ) {
      this.bump({ staleGenerationRejectCount: this.t.staleGenerationRejectCount + 1 });
      throw err('FrameGenerationMismatch', 'Stale transition generation');
    }
    const ok = new Set([
      'CPU_HEAP>GPU_UPLOAD',
      'GPU_UPLOAD>GPU_LOCAL',
      'GPU_LOCAL>GPU_READBACK',
      'GPU_READBACK>CPU_HEAP',
      'EXTERNAL_DEVICE>GPU_SHARED',
      'IMPORTED_HANDLE>GPU_LOCAL',
      'CPU_SHARED>GPU_SHARED',
    ]);
    const from = r.descriptor.memoryDomain;
    const operationId = this.id('transition');
    if (!ok.has(`${from}>${q.toDomain}`)) {
      this.bump({
        totalDomainTransitions: this.t.totalDomainTransitions + 1,
        failedDomainTransitions: this.t.failedDomainTransitions + 1,
      });
      throw err('FrameMemoryTransitionUnsupported', 'Unsupported frame domain transition');
    }
    r.state = 'IN_TRANSITION';
    const gen = BigInt(r.identity.frameGeneration);
    const snap = freeze({
      operationId,
      frameId: q.frameId,
      fromDomain: from,
      toDomain: q.toDomain,
      generation: gen.toString(),
      state: 'COMPLETED',
      explicitCopy: q.explicitCopy,
      synchronizationRequired: q.synchronizationRequired ?? false,
    }) as FrameMemoryTransitionSnapshot;
    this.transitions.push(snap);
    if (this.transitions.length > 64) this.transitions.shift();
    r.descriptor = freeze({
      ...r.descriptor,
      memoryDomain: q.toDomain,
      mappable: [
        'CPU_HEAP',
        'CPU_PINNED',
        'CPU_SHARED',
        'GPU_UPLOAD',
        'GPU_READBACK',
        'SYNTHETIC',
      ].includes(q.toDomain),
    });
    r.state = 'READY';
    this.bump({
      totalDomainTransitions: this.t.totalDomainTransitions + 1,
      successfulDomainTransitions: this.t.successfulDomainTransitions + 1,
      lastFrameMemoryEvent: 'FrameTransitionCompleted',
    });
    return freeze({
      operationId,
      frameId: q.frameId,
      fromDomain: from,
      toDomain: q.toDomain,
      generation: gen,
      completed: true,
    });
  }
  getFrame(id: string) {
    const r = this.frames.get(id);
    return r ? this.snap(r) : undefined;
  }
  listFrames(f: FrameMemoryFilter = {}) {
    return [...this.frames.values()]
      .filter(
        (r) =>
          (!f.sourceId || r.identity.sourceId === f.sourceId) &&
          (!f.streamId || r.identity.streamId === f.streamId) &&
          (!f.memoryDomain || r.descriptor.memoryDomain === f.memoryDomain) &&
          (!f.state || r.state === f.state),
      )
      .sort((a, b) => a.identity.frameId.localeCompare(b.identity.frameId))
      .map((r) => this.snap(r));
  }
  getPoolSnapshot() {
    let total = 0,
      bytes = 0;
    const classes = [...this.pool.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, rs]) => {
        const idleBytes = rs.reduce((s, r) => s + r.descriptor.allocationSizeBytes, 0);
        total += rs.length;
        bytes += idleBytes;
        return freeze({
          key,
          idleFrames: rs.length,
          idleBytes,
          generationHighWater: this.storageGen.toString(),
        });
      });
    return freeze({
      classes,
      totalIdleFrames: total,
      totalIdleBytes: bytes,
      pressureState: (bytes > this.budget.maximumIdleBytes
        ? 'HIGH'
        : 'NORMAL') as FramePoolPressureState,
      maximumFrames: this.budget.maximumFrames,
      maximumBytes: this.budget.maximumBytes,
    });
  }
  getSnapshot() {
    return freeze({
      health: this.health(),
      telemetry: this.t,
      frames: this.listFrames(),
      leases: [...this.leases.values()].map((l) =>
        freeze({
          leaseId: l.lease.leaseId,
          frameId: l.lease.frameId,
          ownerId: l.lease.ownerId,
          access: l.lease.access,
          generation: l.lease.generation.toString(),
          acquiredAtNs: l.lease.acquiredAtNs.toString(),
          ...(l.lease.expiresAtNs !== undefined
            ? { expiresAtNs: l.lease.expiresAtNs.toString() }
            : {}),
          released: l.released,
          expired: !!l.lease.expiresAtNs && this.nowNs() > l.lease.expiresAtNs,
        }),
      ),
      mappings: [...this.maps.values()].map((m) =>
        freeze({
          ...m.view,
          generation: m.view.generation.toString(),
          mappedAtNs: m.view.mappedAtNs.toString(),
        }),
      ),
      pools: this.getPoolSnapshot(),
      transitions: [...this.transitions],
      containsMediaPayloads: false as false,
      containsRuntimeHandles: false as false,
    });
  }
  collectGarbage() {
    let pooled = 0;
    for (const [id, r] of [...this.frames])
      if (
        r.poolEligible &&
        r.counts.activeLeases === 0 &&
        r.counts.activeMappings === 0 &&
        r.counts.pinCount === 0 &&
        !['LOST', 'QUARANTINED', 'RELEASED'].includes(r.state)
      ) {
        r.state = 'POOLED';
        this.frames.delete(id);
        const k = [
          r.descriptor.memoryDomain,
          r.descriptor.format,
          r.descriptor.width,
          r.descriptor.height,
          r.descriptor.alignment,
          r.descriptor.usageFlags.join('|'),
        ].join(':');
        const arr = this.pool.get(k) ?? [];
        if (arr.length < this.budget.maximumIdleFrames) {
          arr.push(r);
          this.pool.set(k, arr);
          pooled++;
        }
      }
    this.bump({ garbageCollectionCount: this.t.garbageCollectionCount + 1 });
    return freeze({ releasedFrames: 0, pooledFrames: pooled, trimmedBytes: 0 });
  }
  async shutdown() {
    if (this.state === 'SHUTDOWN') return;
    this.state = 'SHUTTING_DOWN';
    const leakedL = [...this.leases.values()].filter((l) => !l.released).length;
    const leakedM = this.maps.size;
    for (const r of this.frames.values()) {
      r.leaseIds.clear();
      r.mappingIds.clear();
      r.pins.clear();
      r.counts = {
        activeLeases: 0,
        readLeases: 0,
        writeLeases: 0,
        externalReferences: 0,
        parentViewReferences: 0,
        childViewReferences: 0,
        activeMappings: 0,
        activeGpuSubmissions: 0,
        pinCount: 0,
      };
      r.state = 'RELEASED';
      r.releaseCallback?.();
    }
    this.frames.clear();
    this.leases.clear();
    this.maps.clear();
    this.pool.clear();
    this.transitions = [];
    this.state = 'SHUTDOWN';
    this.bump({
      leakedLeaseCount: this.t.leakedLeaseCount + leakedL,
      leakedMappingCount: this.t.leakedMappingCount + leakedM,
      lastFrameMemoryEvent: 'FrameReleased',
    });
  }
  assertInvariants() {
    for (const [id, r] of this.frames) {
      if (id !== r.identity.frameId)
        throw err('FrameMemoryInvariantViolation', 'Frame id index mismatch');
      if (r.counts.activeLeases !== r.leaseIds.size)
        throw err('FrameMemoryInvariantViolation', 'Lease count mismatch');
      if (r.counts.activeMappings !== r.mappingIds.size)
        throw err('FrameMemoryInvariantViolation', 'Mapping count mismatch');
      if (Object.values(r.counts).some((n) => n < 0))
        throw err('FrameReferenceCountUnderflow', 'Negative reference count');
      if (
        r.state === 'POOLED' &&
        (r.counts.activeLeases || r.counts.activeMappings || r.counts.pinCount)
      )
        throw err('FrameMemoryInvariantViolation', 'Pooled frame has active references');
    }
  }
  private need(id: string) {
    const r = this.frames.get(id);
    if (!r) throw err('FrameNotFound', `Frame not found ${id}`);
    return r;
  }
  private snap(r: Rec): FrameMemorySnapshot {
    return freeze({
      identity: r.identity,
      descriptor: r.descriptor,
      state: r.state,
      lifetimeClass: r.lifetimeClass,
      referenceCounts: r.counts,
      pinReasons: Object.fromEntries([...r.pins.entries()].sort()),
      leaseIds: [...r.leaseIds].sort(),
      mappingIds: [...r.mappingIds].sort(),
      lost: r.state === 'LOST',
      quarantined: r.state === 'QUARANTINED',
    });
  }
  private health(): FrameMemoryHealthSnapshot {
    const b = this.bytes(),
      p = this.getPoolSnapshot();
    return freeze({
      managerState: this.state,
      totalActiveFrames: this.frames.size,
      totalPooledFrames: p.totalIdleFrames,
      totalLeasedFrames: [...this.frames.values()].filter((r) => r.counts.activeLeases).length,
      totalMappedFrames: this.maps.size,
      totalPinnedFrames: [...this.frames.values()].filter((r) => r.counts.pinCount).length,
      totalTransitioningFrames: [...this.frames.values()].filter((r) => r.state === 'IN_TRANSITION')
        .length,
      totalLostFrames: [...this.frames.values()].filter((r) => r.state === 'LOST').length,
      totalQuarantinedFrames: [...this.frames.values()].filter((r) => r.state === 'QUARANTINED')
        .length,
      cpuBytesAllocated: b.cpu,
      gpuBytesReferenced: b.gpu,
      sharedBytesReferenced: b.shared,
      poolBytes: p.totalIdleBytes,
      peakBytes: this.t.peakTotalBytes,
      allocationFailures: this.t.allocationFailureCount,
      importFailures: 0,
      transitionFailures: this.t.failedDomainTransitions,
      staleGenerationRejections: this.t.staleGenerationRejectCount,
      doubleReleaseAttempts: this.t.doubleReleaseAttemptCount,
      mappingLeaks: this.t.leakedMappingCount,
      leaseLeaks: this.t.leakedLeaseCount,
      pinLeaks: this.t.leakedLeaseCount,
      poolPressureState: p.pressureState,
      deviceLossCount: this.t.lostFrameCount,
      updatedAtNs: this.nowNs().toString(),
    });
  }
}
export const createFrameMemoryManager = (
  nowNs?: () => bigint,
  budget?: {
    maximumFrames: number;
    maximumBytes: number;
    maximumIdleFrames: number;
    maximumIdleBytes: number;
  },
) => new SyntheticFrameMemoryManager(nowNs, budget);
export function createFrameMemoryCommandHandlers(
  manager: FrameMemoryManager,
): readonly RuntimeCommandHandler[] {
  const h = (
    type: FrameMemoryCommandType,
    fn: (p: Record<string, unknown>) => unknown,
  ): RuntimeCommandHandler => ({
    commandType: type,
    execute: async (c: RuntimeCommand) => ({
      status: 'SUCCEEDED',
      metadata: safe((await fn(c.payload as Record<string, unknown>)) as Record<string, unknown>),
    }),
  });
  return [
    h('FRAME_COLLECT_GARBAGE', () => manager.collectGarbage()),
    h('FRAME_RELEASE', (p) => manager.release(String(p.frameId), String(p.ownerId))),
    h('FRAME_PIN', (p) => manager.pin(String(p.frameId), p.reason as FramePinReason)),
    h('FRAME_UNPIN', (p) => manager.unpin(String(p.frameId), p.reason as FramePinReason)),
    h('FRAME_TRIM_POOLS', () => manager.collectGarbage()),
  ];
}
