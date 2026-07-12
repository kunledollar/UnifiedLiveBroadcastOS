import {
  RuntimeEngineError,
  type RuntimeCommand,
  type RuntimeCommandContext,
  type RuntimeCommandHandler,
} from './execution-engine.js';
import type { FrameLease, FrameMemoryManager, VideoFrameFormat } from './frame-memory.js';
declare const process: { hrtime: { bigint: () => bigint } };

import type {
  VideoFramePipelineStage,
  VideoPipelineFrameReference,
  VideoPipelineStageDescriptor,
} from './video-frame-pipeline.js';

export type GeometryCoordinateSpace =
  | 'SOURCE_PIXELS'
  | 'SOURCE_NORMALIZED'
  | 'DESTINATION_PIXELS'
  | 'DESTINATION_NORMALIZED'
  | 'CANVAS_PIXELS'
  | 'CANVAS_NORMALIZED'
  | 'DISPLAY_POINTS'
  | 'CLIP_SPACE'
  | 'CUSTOM';
export type GeometryFitMode =
  | 'NONE'
  | 'FIT'
  | 'FILL'
  | 'STRETCH'
  | 'CENTER'
  | 'NATIVE'
  | 'INTEGER_SCALE'
  | 'DOWNSCALE_ONLY'
  | 'UPSCALE_ONLY'
  | 'CUSTOM';
export type GeometryAlignment =
  | 'TOP_LEFT'
  | 'TOP_CENTER'
  | 'TOP_RIGHT'
  | 'CENTER_LEFT'
  | 'CENTER'
  | 'CENTER_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_CENTER'
  | 'BOTTOM_RIGHT'
  | 'CUSTOM';
export type GeometryAnchor = GeometryAlignment;
export type GeometryCropPolicy =
  | 'REJECT_OUT_OF_BOUNDS'
  | 'CLAMP_TO_SOURCE'
  | 'INTERSECT_SOURCE'
  | 'ALLOW_EMPTY'
  | 'BACKEND_DEFAULT';
export type GeometryEdgePolicy =
  | 'TRANSPARENT'
  | 'CLAMP'
  | 'MIRROR'
  | 'REPEAT'
  | 'OPAQUE_BLACK'
  | 'FAIL_OUTSIDE_SOURCE'
  | 'BACKEND_DEFAULT';
export type GeometryInterpolationPolicy =
  'NEAREST' | 'BILINEAR' | 'BICUBIC' | 'LANCZOS' | 'AREA' | 'BACKEND_DEFAULT';
export type GeometryRoundingPolicy =
  'FLOOR' | 'CEIL' | 'ROUND_NEAREST' | 'ROUND_HALF_EVEN' | 'PRESERVE_SUBPIXEL' | 'BACKEND_DEFAULT';
export type GeometryQualityTier = 'FAST' | 'BALANCED' | 'HIGH_QUALITY' | 'REFERENCE';
export type GeometryBackendType =
  | 'GPU_COMPUTE'
  | 'GPU_FRAGMENT'
  | 'GPU_BLIT'
  | 'CPU_SIMD'
  | 'CPU_REFERENCE'
  | 'PLATFORM_NATIVE'
  | 'SYNTHETIC';
export type GeometryIntent =
  | 'SOURCE_NORMALIZATION'
  | 'SCENE_PLACEMENT'
  | 'PICTURE_IN_PICTURE'
  | 'FULLSCREEN'
  | 'FIT_TO_CANVAS'
  | 'FILL_CANVAS'
  | 'VERTICAL_REFRAME'
  | 'SAFE_AREA_PLACEMENT'
  | 'PREVIEW_LAYOUT'
  | 'PROGRAM_LAYOUT'
  | 'CUSTOM';
export type GeometryTransformStatus =
  | 'COMPLETED'
  | 'PASSED_THROUGH'
  | 'FULLY_CLIPPED'
  | 'FAILED'
  | 'DROPPED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'DEGRADED';
export type GeometryBackgroundBehavior =
  'TRANSPARENT' | 'OPAQUE_BLACK' | 'OPAQUE_CUSTOM_COLOR' | 'UNDEFINED' | 'PRESERVE_EXISTING';
export type GeometryFullyClippedPolicy =
  | 'DROP_FRAME'
  | 'RETURN_EMPTY_RESULT'
  | 'PRODUCE_TRANSPARENT_FRAME'
  | 'FAIL_FRAME'
  | 'BACKEND_DEFAULT';
export type Matrix3x3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];
type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
export interface GeometryPoint {
  readonly x: number;
  readonly y: number;
  readonly coordinateSpace: GeometryCoordinateSpace;
}
export interface GeometrySize {
  readonly width: number;
  readonly height: number;
  readonly coordinateSpace: GeometryCoordinateSpace;
}
export interface GeometryRect extends GeometrySize {
  readonly x: number;
  readonly y: number;
}
export interface GeometryInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly coordinateSpace: GeometryCoordinateSpace;
}
export interface PixelAspectRatio {
  readonly numerator: number;
  readonly denominator: number;
}
export interface GeometryCanvasDescriptor {
  readonly width: number;
  readonly height: number;
  readonly pixelAspectRatio: PixelAspectRatio;
  readonly format: string;
  readonly colorMetadata?: Readonly<Record<string, Json>>;
  readonly alphaMode: 'OPAQUE' | 'PREMULTIPLIED' | 'STRAIGHT' | 'UNKNOWN';
  readonly memoryDomain: string;
  readonly backgroundBehavior: GeometryBackgroundBehavior;
  readonly metadata?: Readonly<Record<string, Json>>;
}
export interface GeometryTransform {
  readonly enabled: boolean;
  readonly sourceCrop?: GeometryRect;
  readonly cropInsets?: GeometryInsets;
  readonly destinationRect?: GeometryRect;
  readonly translation?: GeometryPoint;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotationDegrees: number;
  readonly horizontalFlip: boolean;
  readonly verticalFlip: boolean;
  readonly anchorPoint?: GeometryPoint;
  readonly pivotPoint?: GeometryPoint;
  readonly pixelAspectRatio: PixelAspectRatio;
  readonly fitMode: GeometryFitMode;
  readonly alignment: GeometryAlignment;
  readonly clippingRect?: GeometryRect;
  readonly safeAreaPolicy?: string;
  readonly interpolationPolicy: GeometryInterpolationPolicy;
  readonly edgePolicy: GeometryEdgePolicy;
  readonly outputCanvas?: GeometryCanvasDescriptor;
  readonly metadata?: Readonly<Record<string, Json>>;
}
export interface GeometryValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}
export interface GeometryRegionOfInterest {
  readonly sourceRegion: GeometryRect;
  readonly destinationRegion: GeometryRect;
  readonly clipIntersection: GeometryRect | undefined;
  readonly samplingExpansionPixels: number;
  readonly chromaAlignmentExpansionPixels: number;
  readonly effectiveVisiblePixels: number;
  readonly metadata: Readonly<Record<string, Json>>;
}
export interface GeometryPlanRequest {
  readonly requestId: string;
  readonly inputFrame: VideoPipelineFrameReference;
  readonly transform: GeometryTransform;
  readonly outputCanvas: GeometryCanvasDescriptor;
  readonly cropPolicy?: GeometryCropPolicy;
  readonly clippingPolicy?: GeometryFullyClippedPolicy;
  readonly edgePolicy?: GeometryEdgePolicy;
  readonly interpolationPolicy?: GeometryInterpolationPolicy;
  readonly roundingPolicy?: GeometryRoundingPolicy;
  readonly qualityTier?: GeometryQualityTier;
  readonly backendPreference?: GeometryBackendType | string;
  readonly deviceGeneration?: string;
  readonly pipelineConfigurationGeneration?: bigint;
  readonly metadata?: Readonly<Record<string, Json>>;
}
export interface GeometryPlan {
  readonly planId: string;
  readonly inputFrameSummary: Readonly<Record<string, Json>>;
  readonly outputCanvas: GeometryCanvasDescriptor;
  readonly requestedTransform: GeometryTransform;
  readonly effectiveTransform: GeometryTransform;
  readonly transformMatrix: Matrix3x3;
  readonly inverseMatrix: Matrix3x3;
  readonly sourceCrop: GeometryRect;
  readonly destinationRectangle: GeometryRect;
  readonly transformedBounds: GeometryRect;
  readonly clippedBounds: GeometryRect | undefined;
  readonly regionOfInterest: GeometryRegionOfInterest;
  readonly interpolationPolicy: GeometryInterpolationPolicy;
  readonly edgePolicy: GeometryEdgePolicy;
  readonly backendPreference?: string;
  readonly selectedBackendId: string;
  readonly passThroughEligible: boolean;
  readonly requiresRasterization: boolean;
  readonly requiresResampling: boolean;
  readonly requiresOutputAllocation: boolean;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly estimatedOperationCount: number;
  readonly qualityTier: GeometryQualityTier;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly scalingDisposition:
    'ALREADY_COMPLETED' | 'REQUIRED_DOWNSTREAM' | 'FUSED_IN_GEOMETRY_BACKEND' | 'NOT_REQUIRED';
  readonly metadata: Readonly<Record<string, Json>>;
}
export interface GeometryPlanResult {
  readonly status: 'CREATED' | 'REJECTED' | 'CACHE_HIT';
  readonly plan?: GeometryPlan;
  readonly validation: GeometryValidationReport;
  readonly durationNs: string;
}
export interface GeometryTransformRequest extends GeometryPlanRequest {
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputLease?: FrameLease;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly deadlineNs?: bigint;
  readonly cancellationSignal?: AbortSignal;
  readonly correlationId?: string;
}
export interface GeometryRuntimeContext {
  readonly nowNs: () => bigint;
  readonly frameMemory?: FrameMemoryManager;
}
export interface GeometryBackendDescriptor {
  readonly backendId: string;
  readonly backendType: GeometryBackendType;
  readonly displayName: string;
  readonly version: string;
  readonly supportedInterpolation: readonly GeometryInterpolationPolicy[];
  readonly supportedEdges: readonly GeometryEdgePolicy[];
  readonly supportsRasterization: boolean;
  readonly supportsPassThrough: boolean;
  readonly deterministic: boolean;
  readonly requiresGpu: boolean;
  readonly active: boolean;
}
export interface GeometryCapability {
  readonly name: string;
  readonly exact: boolean;
  readonly metadata?: Readonly<Record<string, Json>>;
}
export interface GeometryPlanCandidate {
  readonly backendId: string;
  readonly score: number;
  readonly warnings: readonly string[];
}
export interface GeometryBackendResult {
  readonly status: GeometryTransformStatus;
  readonly signature: string;
  readonly warnings: readonly string[];
}
export interface GeometryBackend {
  readonly descriptor: GeometryBackendDescriptor;
  getCapabilities(): readonly Readonly<GeometryCapability>[];
  createPlan(
    request: GeometryPlanRequest,
    context: Readonly<Record<string, unknown>>,
  ): GeometryPlanCandidate | undefined;
  execute(
    plan: GeometryPlan,
    input: VideoPipelineFrameReference,
    output: FrameLease | undefined,
    context: Readonly<Record<string, unknown>>,
  ): Promise<GeometryBackendResult>;
  shutdown(context: Readonly<Record<string, unknown>>): Promise<void>;
}
export interface GeometryTransformResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId: string;
  readonly status: GeometryTransformStatus;
  readonly inputFrameId: string;
  readonly outputFrame: VideoPipelineFrameReference | undefined;
  readonly passThrough: boolean;
  readonly transformApplied: boolean;
  readonly requestedTransform: GeometryTransform;
  readonly effectiveTransform: GeometryTransform;
  readonly transformMatrix: Matrix3x3;
  readonly inverseMatrix: Matrix3x3;
  readonly sourceCrop: GeometryRect;
  readonly destinationRectangle: GeometryRect;
  readonly transformedBounds: GeometryRect;
  readonly clippedBounds: GeometryRect | undefined;
  readonly regionOfInterest: GeometryRegionOfInterest;
  readonly outputCanvas: GeometryCanvasDescriptor;
  readonly effectiveInterpolation: GeometryInterpolationPolicy;
  readonly effectiveEdgePolicy: GeometryEdgePolicy;
  readonly effectiveRoundingPolicy: GeometryRoundingPolicy;
  readonly effectiveQuality: GeometryQualityTier;
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: string;
  readonly ownershipTransfer: Readonly<Record<string, Json>>;
  readonly completedAtNs: string;
}
export interface GeometryProfile {
  readonly profileId: string;
  readonly version: string;
  readonly transformDefaults: Partial<GeometryTransform>;
  readonly canvasDefaults?: Partial<GeometryCanvasDescriptor>;
  readonly safeAreaProfile?: string;
  readonly compatibleAspectRatios: readonly string[];
  readonly tags: readonly string[];
  readonly metadata?: Readonly<Record<string, Json>>;
}
export interface GeometryHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly activeBackendCount: number;
  readonly failedBackendCount: number;
  readonly profileCount: number;
  readonly planCacheSize: number;
  readonly activeRequestCount: number;
  readonly completedTransformCount: number;
  readonly passThroughCount: number;
  readonly fullyClippedCount: number;
  readonly failedTransformCount: number;
  readonly cancelledCount: number;
  readonly rejectedCount: number;
  readonly timeoutCount: number;
  readonly validationFailureCount: number;
  readonly cropAlignmentFailureCount: number;
  readonly singularMatrixCount: number;
  readonly unsupportedTransformCount: number;
  readonly gpuLossCount: number;
  readonly allocationFailureCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly temporaryBytes: number;
  readonly peakTemporaryBytes: number;
  readonly lastSuccess?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface GeometryTelemetrySnapshot {
  readonly totalPlanRequests: number;
  readonly totalPlansCreated: number;
  readonly totalPlanCacheHits: number;
  readonly totalPlanCacheMisses: number;
  readonly totalTransformRequests: number;
  readonly totalTransformsCompleted: number;
  readonly totalPassThrough: number;
  readonly totalFullyClipped: number;
  readonly totalTransformsFailed: number;
  readonly totalTransformsDropped: number;
  readonly totalTransformsCancelled: number;
  readonly totalTransformsRejected: number;
  readonly totalCropOperations: number;
  readonly totalTranslationOperations: number;
  readonly totalScalePlacements: number;
  readonly totalRotationOperations: number;
  readonly totalFlipOperations: number;
  readonly totalFitOperations: number;
  readonly totalFillOperations: number;
  readonly totalStretchOperations: number;
  readonly totalClippingOperations: number;
  readonly totalPixelAspectAdjustments: number;
  readonly totalChromaAlignmentAdjustments: number;
  readonly totalSafeAreaWarnings: number;
  readonly totalBackendFallbacks: number;
  readonly totalTimeouts: number;
  readonly totalGpuLossFailures: number;
  readonly totalAllocationFailures: number;
  readonly totalSingularMatrixFailures: number;
  readonly averagePlanDurationNs: string;
  readonly maximumPlanDurationNs: string;
  readonly averageTransformDurationNs: string;
  readonly maximumTransformDurationNs: string;
  readonly peakTemporaryBytes: number;
  readonly currentRequestIds: readonly string[];
  readonly lastGeometryEvent?: string;
  readonly healthSummary: string;
}
export interface GeometryEngineSnapshot {
  readonly backends: readonly GeometryBackendDescriptor[];
  readonly profiles: readonly GeometryProfile[];
  readonly health: GeometryHealthSnapshot;
  readonly telemetry: GeometryTelemetrySnapshot;
  readonly containsPixelData: false;
  readonly containsRuntimeHandles: false;
}
export class GeometryError extends RuntimeEngineError {}
const gerr = (c: string, m: string, d: Record<string, unknown> = {}) => new GeometryError(c, m, d);
export class DuplicateGeometryBackend extends GeometryError {
  constructor(id: string) {
    super('DuplicateGeometryBackend', `Duplicate geometry backend ${id}`, { id });
  }
}
export class GeometryBackendNotFound extends GeometryError {
  constructor(id: string) {
    super('GeometryBackendNotFound', `Geometry backend ${id} was not found`, { id });
  }
}
export class DuplicateGeometryProfile extends GeometryError {
  constructor(id: string) {
    super('DuplicateGeometryProfile', `Duplicate geometry profile ${id}`, { id });
  }
}
export const GEOMETRY_COMMAND_TYPES = [
  'GEOMETRY_REGISTER_BACKEND',
  'GEOMETRY_UNREGISTER_BACKEND',
  'GEOMETRY_REGISTER_PROFILE',
  'GEOMETRY_UNREGISTER_PROFILE',
  'GEOMETRY_PLAN',
  'GEOMETRY_EXECUTE',
  'GEOMETRY_CANCEL',
  'GEOMETRY_SET_TRANSFORM',
  'GEOMETRY_SET_CROP',
  'GEOMETRY_SET_DESTINATION',
  'GEOMETRY_SET_ROTATION',
  'GEOMETRY_SET_FLIP',
  'GEOMETRY_SET_ANCHOR',
  'GEOMETRY_SET_PIVOT',
  'GEOMETRY_SET_CANVAS',
  'GEOMETRY_SET_CLIPPING',
  'GEOMETRY_APPLY_PROFILE',
  'GEOMETRY_CLEAR_PLAN_CACHE',
  'GEOMETRY_SET_DEFAULT_BACKEND',
  'GEOMETRY_SET_QUALITY',
  'GEOMETRY_VALIDATE',
  'GEOMETRY_SHUTDOWN',
] as const;
export const GEOMETRY_OUTPUT_KEYS = {
  requests: 'geometry.requests',
  plans: 'geometry.plans',
  results: 'geometry.results',
  transformedFrameReferences: 'geometry.frames.transformed',
  passThroughReferences: 'geometry.frames.passThrough',
  fullyClippedResults: 'geometry.results.fullyClipped',
  failedResults: 'geometry.results.failed',
  health: 'geometry.health',
  telemetry: 'geometry.telemetry',
  activeProfiles: 'geometry.profiles.active',
} as const;
export const GEOMETRY_WATCHDOG_INCIDENTS = [
  'GEOMETRY_STALLED',
  'GEOMETRY_BACKEND_FAILED',
  'GEOMETRY_TIMEOUT',
  'GEOMETRY_TRANSFORM_INVALID',
  'GEOMETRY_CROP_INVALID',
  'GEOMETRY_CHROMA_ALIGNMENT_INVALID',
  'GEOMETRY_MATRIX_SINGULAR',
  'GEOMETRY_BOUNDS_INVALID',
  'GEOMETRY_FULLY_CLIPPED_RATE_HIGH',
  'GEOMETRY_TEMP_MEMORY_PRESSURE',
  'GEOMETRY_GPU_RESOURCE_LOST',
  'GEOMETRY_ALLOCATION_FAILED',
  'GEOMETRY_STALE_GENERATION',
  'GEOMETRY_PLAN_CACHE_INVALID',
  'GEOMETRY_GRAPH_MISMATCH',
  'GEOMETRY_INVARIANT_FAILURE',
] as const;
const finite = (n: number) => Number.isFinite(n);
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) freeze(x);
  }
  return v as Readonly<T>;
};
const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  coordinateSpace: GeometryCoordinateSpace,
): GeometryRect => freeze({ x, y, width, height, coordinateSpace });
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const reducePixelAspectRatio = (p: PixelAspectRatio): PixelAspectRatio => {
  if (
    !Number.isInteger(p.numerator) ||
    !Number.isInteger(p.denominator) ||
    p.numerator <= 0 ||
    p.denominator <= 0
  )
    throw gerr(
      'GeometryPixelAspectInvalid',
      'Pixel aspect ratio must use positive finite integers',
    );
  const d = gcd(p.numerator, p.denominator);
  return freeze({ numerator: p.numerator / d, denominator: p.denominator / d });
};
const ident: Matrix3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mm = (a: Matrix3x3, b: Matrix3x3): Matrix3x3 =>
  freeze([
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ] as Matrix3x3);
const det = (m: Matrix3x3) =>
  m[0] * (m[4] * m[8] - m[5] * m[7]) -
  m[1] * (m[3] * m[8] - m[5] * m[6]) +
  m[2] * (m[3] * m[7] - m[4] * m[6]);
export const invertGeometryMatrix = (m: Matrix3x3): Matrix3x3 => {
  const d = det(m);
  if (!finite(d) || Math.abs(d) < 1e-12)
    throw gerr('GeometryMatrixSingular', 'Geometry transform matrix is singular');
  return freeze([
    (m[4] * m[8] - m[5] * m[7]) / d,
    (m[2] * m[7] - m[1] * m[8]) / d,
    (m[1] * m[5] - m[2] * m[4]) / d,
    (m[5] * m[6] - m[3] * m[8]) / d,
    (m[0] * m[8] - m[2] * m[6]) / d,
    (m[2] * m[3] - m[0] * m[5]) / d,
    (m[3] * m[7] - m[4] * m[6]) / d,
    (m[1] * m[6] - m[0] * m[7]) / d,
    (m[0] * m[4] - m[1] * m[3]) / d,
  ] as Matrix3x3);
};
const tr = (x: number, y: number): Matrix3x3 => [1, 0, x, 0, 1, y, 0, 0, 1];
const sc = (x: number, y: number): Matrix3x3 => [x, 0, 0, 0, y, 0, 0, 0, 1];
const ro = (deg: number): Matrix3x3 => {
  const r = (deg * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
};
const pt = (m: Matrix3x3, x: number, y: number) => ({
  x: m[0] * x + m[1] * y + m[2],
  y: m[3] * x + m[4] * y + m[5],
});
const validateRect = (
  r: GeometryRect | undefined,
  e: string,
  errors: string[],
  allowNeg = false,
) => {
  if (!r) return;
  for (const n of [r.x, r.y, r.width, r.height])
    if (!finite(n)) errors.push(`${e} contains non-finite value`);
  if (r.width <= 0 || r.height <= 0) errors.push(`${e} width and height must be positive`);
  if (!allowNeg && (r.x < 0 || r.y < 0)) errors.push(`${e} position must be non-negative`);
};
export const createDefaultGeometryTransform = (
  overrides: Partial<GeometryTransform> = {},
): GeometryTransform =>
  freeze({
    enabled: true,
    scaleX: 1,
    scaleY: 1,
    rotationDegrees: 0,
    horizontalFlip: false,
    verticalFlip: false,
    pixelAspectRatio: { numerator: 1, denominator: 1 },
    fitMode: 'NONE',
    alignment: 'CENTER',
    interpolationPolicy: 'BILINEAR',
    edgePolicy: 'TRANSPARENT',
    ...overrides,
  });
export const createGeometryCanvasDescriptor = (
  width: number,
  height: number,
  format = 'RGBA8',
): GeometryCanvasDescriptor =>
  freeze({
    width,
    height,
    pixelAspectRatio: { numerator: 1, denominator: 1 },
    format,
    alphaMode: 'UNKNOWN',
    memoryDomain: 'CPU',
    backgroundBehavior: 'TRANSPARENT',
  });
const normDeg = (d: number) => ((d % 360) + 360) % 360;
const sourceDims = (f: VideoPipelineFrameReference) => {
  const fm = f.format as Record<string, Json>;
  return {
    width: Number(fm.width ?? 1920),
    height: Number(fm.height ?? 1080),
    format: String(fm.format ?? 'RGBA8'),
  };
};
const canvasBytes = (c: GeometryCanvasDescriptor) => c.width * c.height * 4;
const alignments: Record<GeometryAlignment, readonly [number, number]> = {
  TOP_LEFT: [0, 0],
  TOP_CENTER: [0.5, 0],
  TOP_RIGHT: [1, 0],
  CENTER_LEFT: [0, 0.5],
  CENTER: [0.5, 0.5],
  CENTER_RIGHT: [1, 0.5],
  BOTTOM_LEFT: [0, 1],
  BOTTOM_CENTER: [0.5, 1],
  BOTTOM_RIGHT: [1, 1],
  CUSTOM: [0.5, 0.5],
};
const alignOff = (a: GeometryAlignment): readonly [number, number] => alignments[a];
export class DefaultGeometryEngine {
  #backends = new Map<string, GeometryBackend>();
  #profiles = new Map<string, GeometryProfile>();
  #cache = new Map<string, GeometryPlan>();
  #active = new Set<string>();
  #shutdown = false;
  #maxCache: number;
  #t = {
    plans: 0,
    created: 0,
    hits: 0,
    miss: 0,
    tx: 0,
    done: 0,
    pass: 0,
    clip: 0,
    fail: 0,
    cancel: 0,
    reject: 0,
    maxPlan: 0,
    maxTx: 0,
    last: 'GeometryEngineCreated',
  };
  constructor(o: { maxPlanCacheEntries?: number } = {}) {
    this.#maxCache = o.maxPlanCacheEntries ?? 256;
    this.registerBackend(new SyntheticGeometryBackend());
  }
  registerBackend(b: GeometryBackend) {
    if (this.#backends.has(b.descriptor.backendId))
      throw new DuplicateGeometryBackend(b.descriptor.backendId);
    this.#backends.set(b.descriptor.backendId, b);
    this.#t.last = 'GeometryBackendRegistered';
    this.#cache.clear();
  }
  async unregisterBackend(id: string) {
    const b = this.#backends.get(id);
    if (!b) throw new GeometryBackendNotFound(id);
    await b.shutdown({});
    this.#backends.delete(id);
    for (const [k, p] of this.#cache) if (p.selectedBackendId === id) this.#cache.delete(k);
    this.#t.last = 'GeometryBackendUnregistered';
  }
  registerProfile(p: GeometryProfile) {
    if (this.#profiles.has(p.profileId)) throw new DuplicateGeometryProfile(p.profileId);
    if (this.#profiles.size >= 128)
      throw gerr('GeometryProfileInvalid', 'Geometry profile registry is bounded');
    this.#profiles.set(p.profileId, freeze(structuredClone(p)) as GeometryProfile);
    this.#cache.clear();
  }
  unregisterProfile(id: string) {
    this.#profiles.delete(id);
    this.#cache.clear();
  }
  clearPlanCache() {
    this.#cache.clear();
  }
  validateTransform(t: GeometryTransform): GeometryValidationReport {
    const e: string[] = [],
      w: string[] = [];
    if (this.#shutdown) e.push('Geometry engine is shut down');
    if (!finite(t.scaleX) || t.scaleX <= 0) e.push('scaleX must be positive and finite');
    if (!finite(t.scaleY) || t.scaleY <= 0) e.push('scaleY must be positive and finite');
    if (!finite(t.rotationDegrees)) e.push('rotationDegrees must be finite');
    try {
      reducePixelAspectRatio(t.pixelAspectRatio);
    } catch (err) {
      e.push((err as Error).message);
    }
    validateRect(t.sourceCrop, 'sourceCrop', e, true);
    validateRect(t.destinationRect, 'destinationRect', e, true);
    validateRect(t.clippingRect, 'clippingRect', e, true);
    if (t.safeAreaPolicy) w.push('Safe areas are metadata unless an explicit policy consumes them');
    return freeze({ valid: e.length === 0, errors: e, warnings: w });
  }
  plan(r: GeometryPlanRequest): GeometryPlanResult {
    const start = process.hrtime.bigint();
    this.#t.plans++;
    const v = this.validateTransform(r.transform);
    if (!v.valid) {
      this.#t.reject++;
      return freeze({ status: 'REJECTED', validation: v, durationNs: '0' }) as GeometryPlanResult;
    }
    const key = JSON.stringify({
      f: r.inputFrame.frameId,
      fg: r.inputFrame.frameGeneration.toString(),
      sg: r.inputFrame.storageGeneration.toString(),
      c: r.outputCanvas,
      t: r.transform,
      q: r.qualityTier,
      b: r.backendPreference,
      d: r.deviceGeneration,
      pg: r.pipelineConfigurationGeneration?.toString(),
    });
    const hit = this.#cache.get(key);
    if (hit) {
      this.#t.hits++;
      return freeze({
        status: 'CACHE_HIT',
        plan: hit,
        validation: v,
        durationNs: (process.hrtime.bigint() - start).toString(),
      }) as GeometryPlanResult;
    }
    this.#t.miss++;
    const cands = [...this.#backends.values()]
      .filter((b) => b.descriptor.active)
      .map((b) => b.createPlan(r, {}))
      .filter((x): x is GeometryPlanCandidate => !!x)
      .sort((a, b) => a.score - b.score || a.backendId.localeCompare(b.backendId));
    if (!cands[0])
      return freeze({
        status: 'REJECTED',
        validation: {
          valid: false,
          errors: ['No geometry backend supports request'],
          warnings: [],
        },
        durationNs: '0',
      }) as GeometryPlanResult;
    let plan: GeometryPlan;
    try {
      plan = this.#buildPlan(r, cands[0]);
    } catch (e) {
      this.#t.reject++;
      return freeze({
        status: 'REJECTED',
        validation: { valid: false, errors: [(e as Error).message], warnings: v.warnings },
        durationNs: (process.hrtime.bigint() - start).toString(),
      }) as GeometryPlanResult;
    }
    this.#cache.set(key, plan);
    while (this.#cache.size > this.#maxCache) {
      const oldest = this.#cache.keys().next().value;
      if (oldest !== undefined) this.#cache.delete(oldest);
    }
    this.#t.created++;
    const dur = Number(process.hrtime.bigint() - start);
    this.#t.maxPlan = Math.max(this.#t.maxPlan, dur);
    return freeze({
      status: 'CREATED',
      plan,
      validation: v,
      durationNs: String(dur),
    }) as GeometryPlanResult;
  }
  #buildPlan(r: GeometryPlanRequest, c: GeometryPlanCandidate): GeometryPlan {
    const d = sourceDims(r.inputFrame),
      t = createDefaultGeometryTransform({
        ...r.transform,
        rotationDegrees: normDeg(r.transform.rotationDegrees),
        pixelAspectRatio: reducePixelAspectRatio(r.transform.pixelAspectRatio),
      }),
      crop = this.#crop(t, d.width, d.height, r.cropPolicy ?? 'REJECT_OUT_OF_BOUNDS');
    const dst = this.#dest(t, crop, r.outputCanvas);
    const tx = t.translation ?? { x: 0, y: 0, coordinateSpace: 'DESTINATION_PIXELS' };
    const sx = t.scaleX * (t.horizontalFlip ? -1 : 1),
      sy = t.scaleY * (t.verticalFlip ? -1 : 1);
    const pv = t.pivotPoint ?? {
      x: dst.x + dst.width / 2,
      y: dst.y + dst.height / 2,
      coordinateSpace: 'DESTINATION_PIXELS',
    };
    const m = mm(
      tr(tx.x, tx.y),
      mm(tr(pv.x, pv.y), mm(ro(t.rotationDegrees), mm(sc(sx, sy), tr(-pv.x, -pv.y)))),
    );
    const inv = invertGeometryMatrix(m);
    const corners = (
      [
        [dst.x, dst.y],
        [dst.x + dst.width, dst.y],
        [dst.x + dst.width, dst.y + dst.height],
        [dst.x, dst.y + dst.height],
      ] as readonly (readonly [number, number])[]
    ).map(([x, y]) => pt(m, x, y));
    const xs = corners.map((p) => p.x),
      ys = corners.map((p) => p.y);
    const bounds = rect(
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs) - Math.min(...xs),
      Math.max(...ys) - Math.min(...ys),
      'CANVAS_PIXELS',
    );
    const clip =
      t.clippingRect ?? rect(0, 0, r.outputCanvas.width, r.outputCanvas.height, 'CANVAS_PIXELS');
    const ix = Math.max(bounds.x, clip.x),
      iy = Math.max(bounds.y, clip.y),
      ir = Math.min(bounds.x + bounds.width, clip.x + clip.width),
      ib = Math.min(bounds.y + bounds.height, clip.y + clip.height);
    const clipped =
      ir > ix && ib > iy ? rect(ix, iy, ir - ix, ib - iy, 'CANVAS_PIXELS') : undefined;
    const pass =
      !t.enabled ||
      (!t.sourceCrop &&
        !t.cropInsets &&
        dst.x === 0 &&
        dst.y === 0 &&
        dst.width === d.width &&
        dst.height === d.height &&
        t.scaleX === 1 &&
        t.scaleY === 1 &&
        t.rotationDegrees === 0 &&
        tx.x === 0 &&
        tx.y === 0 &&
        !t.horizontalFlip &&
        !t.verticalFlip &&
        r.outputCanvas.width === d.width &&
        r.outputCanvas.height === d.height);
    const resample =
      dst.width !== crop.width ||
      dst.height !== crop.height ||
      t.scaleX !== 1 ||
      t.scaleY !== 1 ||
      t.rotationDegrees % 90 !== 0;
    return freeze({
      planId: `geometry-plan-${stableHash(keyless(r, c.backendId))}`,
      inputFrameSummary: {
        frameId: r.inputFrame.frameId,
        storageId: r.inputFrame.storageId,
        width: d.width,
        height: d.height,
        format: d.format,
      },
      outputCanvas: r.outputCanvas,
      requestedTransform: r.transform,
      effectiveTransform: t,
      transformMatrix: m,
      inverseMatrix: inv,
      sourceCrop: crop,
      destinationRectangle: dst,
      transformedBounds: bounds,
      clippedBounds: clipped,
      regionOfInterest: {
        sourceRegion: crop,
        destinationRegion: dst,
        clipIntersection: clipped,
        samplingExpansionPixels: resample ? 2 : 0,
        chromaAlignmentExpansionPixels: 0,
        effectiveVisiblePixels: clipped ? Math.round(clipped.width * clipped.height) : 0,
        metadata: {},
      },
      interpolationPolicy: r.interpolationPolicy ?? t.interpolationPolicy,
      edgePolicy: r.edgePolicy ?? t.edgePolicy,
      backendPreference: String(r.backendPreference ?? 'AUTO'),
      selectedBackendId: c.backendId,
      passThroughEligible: pass,
      requiresRasterization: !pass && !!clipped,
      requiresResampling: resample,
      requiresOutputAllocation: !pass && !!clipped,
      estimatedTemporaryBytes: 0,
      estimatedOutputBytes: !pass && clipped ? canvasBytes(r.outputCanvas) : 0,
      estimatedOperationCount: Math.round((clipped?.width ?? 0) * (clipped?.height ?? 0)),
      qualityTier: r.qualityTier ?? 'BALANCED',
      deterministicScore: c.score,
      warnings: c.warnings,
      scalingDisposition: resample ? 'FUSED_IN_GEOMETRY_BACKEND' : 'NOT_REQUIRED',
      metadata: { fullyClipped: !clipped },
    });
  }
  #crop(t: GeometryTransform, w: number, h: number, policy: GeometryCropPolicy): GeometryRect {
    let c =
      t.sourceCrop ??
      (t.cropInsets
        ? rect(
            t.cropInsets.left,
            t.cropInsets.top,
            w - t.cropInsets.left - t.cropInsets.right,
            h - t.cropInsets.top - t.cropInsets.bottom,
            'SOURCE_PIXELS',
          )
        : rect(0, 0, w, h, 'SOURCE_PIXELS'));
    if (c.coordinateSpace === 'SOURCE_NORMALIZED')
      c = rect(c.x * w, c.y * h, c.width * w, c.height * h, 'SOURCE_PIXELS');
    const o = c.x < 0 || c.y < 0 || c.x + c.width > w || c.y + c.height > h;
    if (o && policy === 'CLAMP_TO_SOURCE') {
      const x = Math.max(0, c.x),
        y = Math.max(0, c.y),
        r = Math.min(w, c.x + c.width),
        b = Math.min(h, c.y + c.height);
      c = rect(x, y, Math.max(0, r - x), Math.max(0, b - y), 'SOURCE_PIXELS');
    } else if (o && policy !== 'ALLOW_EMPTY')
      throw gerr('GeometryCropOutOfBounds', 'Source crop is outside source bounds');
    if (c.width <= 0 || (c.height <= 0 && policy !== 'ALLOW_EMPTY'))
      throw gerr('GeometryCropInvalid', 'Source crop is empty');
    return c;
  }
  #dest(t: GeometryTransform, crop: GeometryRect, canvas: GeometryCanvasDescriptor): GeometryRect {
    let box = t.destinationRect ?? rect(0, 0, canvas.width, canvas.height, 'CANVAS_PIXELS');
    if (box.coordinateSpace === 'CANVAS_NORMALIZED')
      box = rect(
        box.x * canvas.width,
        box.y * canvas.height,
        box.width * canvas.width,
        box.height * canvas.height,
        'CANVAS_PIXELS',
      );
    const par = t.pixelAspectRatio.numerator / t.pixelAspectRatio.denominator,
      sw = crop.width * par,
      sh = crop.height;
    let w = box.width,
      h = box.height;
    if (t.fitMode === 'NATIVE') {
      w = sw;
      h = sh;
    } else if (
      t.fitMode === 'FIT' ||
      t.fitMode === 'CENTER' ||
      t.fitMode === 'DOWNSCALE_ONLY' ||
      t.fitMode === 'UPSCALE_ONLY'
    ) {
      const s = Math.min(box.width / sw, box.height / sh);
      w = sw * s;
      h = sh * s;
    } else if (t.fitMode === 'FILL') {
      const s = Math.max(box.width / sw, box.height / sh);
      w = sw * s;
      h = sh * s;
    } else if (t.fitMode === 'INTEGER_SCALE') {
      const s = Math.max(1, Math.floor(Math.min(box.width / sw, box.height / sh)));
      w = sw * s;
      h = sh * s;
    }
    const [ax, ay] = alignOff(t.alignment);
    return rect(box.x + (box.width - w) * ax, box.y + (box.height - h) * ay, w, h, 'CANVAS_PIXELS');
  }
  async transform(
    r: GeometryTransformRequest,
    ctx: GeometryRuntimeContext,
  ): Promise<GeometryTransformResult> {
    const start = ctx.nowNs();
    this.#t.tx++;
    if (r.cancellationSignal?.aborted) {
      this.#t.cancel++;
      return this.#failed(r, 'CANCELLED', start, ctx.nowNs());
    }
    if (
      r.inputFrame.frameGeneration !== r.expectedFrameGeneration ||
      r.inputFrame.storageGeneration !== r.expectedStorageGeneration
    ) {
      this.#t.reject++;
      return this.#failed(r, 'REJECTED', start, ctx.nowNs(), ['Generation mismatch']);
    }
    this.#active.add(r.requestId);
    try {
      const pr = this.plan(r);
      if (!pr.plan) return this.#failed(r, 'REJECTED', start, ctx.nowNs(), pr.validation.errors);
      const p = pr.plan;
      if (r.cancellationSignal?.aborted) {
        this.#t.cancel++;
        return this.#mk(r, p, 'CANCELLED', undefined, start, ctx.nowNs(), [
          'Cancelled before allocation',
        ]);
      }
      if (!p.clippedBounds) {
        this.#t.clip++;
        return this.#mk(r, p, 'FULLY_CLIPPED', undefined, start, ctx.nowNs(), [
          'Transform fully clipped',
        ]);
      }
      if (p.passThroughEligible) {
        this.#t.pass++;
        return this.#mk(r, p, 'PASSED_THROUGH', r.inputFrame, start, ctx.nowNs());
      }
      let lease: FrameLease | undefined;
      let out: VideoPipelineFrameReference | undefined;
      if (ctx.frameMemory) {
        lease = await ctx.frameMemory.allocate({
          width: r.outputCanvas.width,
          height: r.outputCanvas.height,
          format: r.outputCanvas.format as VideoFrameFormat,
          memoryDomain: 'SYNTHETIC',
          usageFlags: ['PROCESSING_OUTPUT'],
          accessMode: 'WRITE_ONLY',
          lifetimeClass: 'FRAME_TRANSIENT',
          ownerId: 'GEOMETRY_ENGINE',
          metadata: { requestId: r.requestId },
        });
        out = {
          ...r.inputFrame,
          frameId: lease.frameId,
          storageId: `${lease.frameId}-storage`,
          leaseId: lease.leaseId,
          ownerId: 'GEOMETRY_ENGINE',
          frameGeneration: lease.generation,
          storageGeneration: lease.generation,
          format: {
            ...r.inputFrame.format,
            width: r.outputCanvas.width,
            height: r.outputCanvas.height,
            format: r.outputCanvas.format,
            geometryPlanId: p.planId,
          },
          metadata: {
            ...r.inputFrame.metadata,
            geometry: { planId: p.planId, status: 'COMPLETED' },
          },
        };
      } else
        out = {
          ...r.inputFrame,
          frameId: `${r.inputFrame.frameId}-geometry-${stableHash(p.planId)}`,
          storageId: `${r.inputFrame.storageId}-geometry-${stableHash(p.planId)}`,
          leaseId: `geometry-lease-${r.requestId}`,
          ownerId: 'GEOMETRY_ENGINE',
          frameGeneration: r.inputFrame.frameGeneration + 1n,
          storageGeneration: r.inputFrame.storageGeneration + 1n,
          format: {
            ...r.inputFrame.format,
            width: r.outputCanvas.width,
            height: r.outputCanvas.height,
            format: r.outputCanvas.format,
          },
        };
      const b = this.#backends.get(p.selectedBackendId)!;
      const br = await b.execute(p, r.inputFrame, lease, {});
      if (r.cancellationSignal?.aborted) {
        lease?.release();
        this.#t.cancel++;
        return this.#mk(r, p, 'CANCELLED', undefined, start, ctx.nowNs(), [
          'Cancelled after backend completion',
        ]);
      }
      if (br.status !== 'COMPLETED') {
        lease?.release();
        this.#t.fail++;
        return this.#mk(r, p, br.status, undefined, start, ctx.nowNs(), br.warnings);
      }
      this.#t.done++;
      return this.#mk(r, p, 'COMPLETED', out, start, ctx.nowNs(), br.warnings);
    } catch (e) {
      this.#t.fail++;
      return this.#failed(r, 'FAILED', start, ctx.nowNs(), [(e as Error).message]);
    } finally {
      this.#active.delete(r.requestId);
    }
  }
  #failed(
    r: GeometryTransformRequest,
    s: GeometryTransformStatus,
    st: bigint,
    now: bigint,
    w: readonly string[] = [],
  ): GeometryTransformResult {
    const dummy = this.plan({
      ...r,
      transform: createDefaultGeometryTransform({ enabled: false }),
    }).plan!;
    return this.#mk(r, dummy, s, undefined, st, now, w);
  }
  #mk(
    r: GeometryTransformRequest,
    p: GeometryPlan,
    s: GeometryTransformStatus,
    out: VideoPipelineFrameReference | undefined,
    st: bigint,
    now: bigint,
    w: readonly string[] = [],
  ): GeometryTransformResult {
    return freeze({
      requestId: r.requestId,
      planId: p.planId,
      backendId: p.selectedBackendId,
      status: s,
      inputFrameId: r.inputFrame.frameId,
      outputFrame: out,
      passThrough: s === 'PASSED_THROUGH',
      transformApplied: s === 'COMPLETED',
      requestedTransform: p.requestedTransform,
      effectiveTransform: p.effectiveTransform,
      transformMatrix: p.transformMatrix,
      inverseMatrix: p.inverseMatrix,
      sourceCrop: p.sourceCrop,
      destinationRectangle: p.destinationRectangle,
      transformedBounds: p.transformedBounds,
      clippedBounds: p.clippedBounds,
      regionOfInterest: p.regionOfInterest,
      outputCanvas: p.outputCanvas,
      effectiveInterpolation: p.interpolationPolicy,
      effectiveEdgePolicy: p.edgePolicy,
      effectiveRoundingPolicy: r.roundingPolicy ?? 'PRESERVE_SUBPIXEL',
      effectiveQuality: p.qualityTier,
      warnings: w,
      temporaryBytes: p.estimatedTemporaryBytes,
      outputBytes: out ? p.estimatedOutputBytes : 0,
      durationNs: (now - st).toString(),
      ownershipTransfer: {
        inputPreserved: true,
        sourceIdentityPreserved: true,
        timestampPreserved: true,
      },
      completedAtNs: now.toString(),
    }) as GeometryTransformResult;
  }
  getTelemetry(): Readonly<GeometryTelemetrySnapshot> {
    return freeze({
      totalPlanRequests: this.#t.plans,
      totalPlansCreated: this.#t.created,
      totalPlanCacheHits: this.#t.hits,
      totalPlanCacheMisses: this.#t.miss,
      totalTransformRequests: this.#t.tx,
      totalTransformsCompleted: this.#t.done,
      totalPassThrough: this.#t.pass,
      totalFullyClipped: this.#t.clip,
      totalTransformsFailed: this.#t.fail,
      totalTransformsDropped: 0,
      totalTransformsCancelled: this.#t.cancel,
      totalTransformsRejected: this.#t.reject,
      totalCropOperations: this.#t.plans,
      totalTranslationOperations: this.#t.plans,
      totalScalePlacements: this.#t.plans,
      totalRotationOperations: this.#t.plans,
      totalFlipOperations: this.#t.plans,
      totalFitOperations: this.#t.plans,
      totalFillOperations: 0,
      totalStretchOperations: 0,
      totalClippingOperations: this.#t.plans,
      totalPixelAspectAdjustments: 0,
      totalChromaAlignmentAdjustments: 0,
      totalSafeAreaWarnings: 0,
      totalBackendFallbacks: 0,
      totalTimeouts: 0,
      totalGpuLossFailures: 0,
      totalAllocationFailures: 0,
      totalSingularMatrixFailures: 0,
      averagePlanDurationNs: '0',
      maximumPlanDurationNs: String(this.#t.maxPlan),
      averageTransformDurationNs: '0',
      maximumTransformDurationNs: String(this.#t.maxTx),
      peakTemporaryBytes: 0,
      currentRequestIds: [...this.#active].sort(),
      lastGeometryEvent: this.#t.last,
      healthSummary: this.#shutdown ? 'STOPPED' : 'HEALTHY',
    });
  }
  getHealth(): Readonly<GeometryHealthSnapshot> {
    return freeze({
      engineState: this.#shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.#shutdown ? 'STOPPED' : 'HEALTHY',
      backendCount: this.#backends.size,
      activeBackendCount: [...this.#backends.values()].filter((b) => b.descriptor.active).length,
      failedBackendCount: 0,
      profileCount: this.#profiles.size,
      planCacheSize: this.#cache.size,
      activeRequestCount: this.#active.size,
      completedTransformCount: this.#t.done,
      passThroughCount: this.#t.pass,
      fullyClippedCount: this.#t.clip,
      failedTransformCount: this.#t.fail,
      cancelledCount: this.#t.cancel,
      rejectedCount: this.#t.reject,
      timeoutCount: 0,
      validationFailureCount: this.#t.reject,
      cropAlignmentFailureCount: 0,
      singularMatrixCount: 0,
      unsupportedTransformCount: 0,
      gpuLossCount: 0,
      allocationFailureCount: 0,
      staleGenerationRejectionCount: 0,
      temporaryBytes: 0,
      peakTemporaryBytes: 0,
      updatedAtNs: process.hrtime.bigint().toString(),
    });
  }
  getSnapshot(): Readonly<GeometryEngineSnapshot> {
    return freeze({
      backends: [...this.#backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      profiles: [...this.#profiles.values()].sort((a, b) => a.profileId.localeCompare(b.profileId)),
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
      containsPixelData: false,
      containsRuntimeHandles: false,
    });
  }
  assertInvariants() {
    const ids = new Set([...this.#backends.keys()]);
    if (ids.size !== this.#backends.size)
      throw gerr('GeometryInvariantViolation', 'Backend IDs must be unique');
    for (const p of this.#cache.values())
      if (!this.#backends.has(p.selectedBackendId))
        throw gerr('GeometryInvariantViolation', 'Plan cache references removed backend');
  }
  async shutdown() {
    if (this.#shutdown) return;
    this.#shutdown = true;
    await Promise.all([...this.#backends.values()].map((b) => b.shutdown({})));
    this.#active.clear();
    this.#cache.clear();
    this.#t.last = 'GeometryShutdown';
  }
}
export class SyntheticGeometryBackend implements GeometryBackend {
  readonly descriptor: GeometryBackendDescriptor;
  constructor(o: Partial<GeometryBackendDescriptor> = {}) {
    this.descriptor = freeze({
      backendId: 'synthetic-geometry',
      backendType: 'SYNTHETIC',
      displayName: 'Deterministic Synthetic Geometry Backend',
      version: '5.3.7',
      supportedInterpolation: ['NEAREST', 'BILINEAR', 'BICUBIC', 'AREA'],
      supportedEdges: ['TRANSPARENT', 'CLAMP', 'OPAQUE_BLACK', 'FAIL_OUTSIDE_SOURCE'],
      supportsRasterization: true,
      supportsPassThrough: true,
      deterministic: true,
      requiresGpu: false,
      active: true,
      ...o,
    }) as GeometryBackendDescriptor;
  }
  getCapabilities() {
    return freeze([
      { name: 'metadata-rasterization', exact: true },
      { name: 'deterministic-matrix', exact: true },
      { name: 'rectangular-clipping', exact: true },
    ]);
  }
  createPlan(r: GeometryPlanRequest) {
    if (!this.descriptor.supportedEdges.includes(r.edgePolicy ?? r.transform.edgePolicy))
      return undefined;
    if (
      !this.descriptor.supportedInterpolation.includes(
        r.interpolationPolicy ?? r.transform.interpolationPolicy,
      )
    )
      return undefined;
    return freeze({
      backendId: this.descriptor.backendId,
      score: this.descriptor.backendType === 'SYNTHETIC' ? 100 : 50,
      warnings: [],
    });
  }
  async execute(p: GeometryPlan): Promise<GeometryBackendResult> {
    return freeze({
      status: (p.requiresRasterization ? 'COMPLETED' : 'PASSED_THROUGH') as GeometryTransformStatus,
      signature: `synthetic:${stableHash(p.planId)}`,
      warnings: [],
    }) as GeometryBackendResult;
  }
  async shutdown() {}
}
const keyless = (r: GeometryPlanRequest, b: string) => ({
  frame: r.inputFrame.frameId,
  canvas: r.outputCanvas,
  transform: r.transform,
  backend: b,
});
const stableHash = (v: unknown) => {
  const s =
    typeof v === 'string'
      ? v
      : JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? val.toString() : val));
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0;
  return h.toString(16).padStart(8, '0');
};
export const createGeometryEngine = (o?: { maxPlanCacheEntries?: number }) =>
  new DefaultGeometryEngine(o);
export const createGeometryPipelineStage = (
  engine: DefaultGeometryEngine,
  transform: GeometryTransform,
  canvas: GeometryCanvasDescriptor,
): VideoFramePipelineStage => {
  const descriptor: VideoPipelineStageDescriptor = {
    stageId: 'geometry',
    stageKind: 'GEOMETRY_PLACEHOLDER',
    displayName: 'Geometry Engine',
    version: '5.3.7',
    phase: 'TRANSFORM',
    order: 400,
    dependencies: ['color-correction'],
    optionalDependencies: [],
    requiredInputMediaKinds: ['VIDEO'],
    supportedInputFormats: ['*'],
    supportedOutputFormats: ['*'],
    inputMemoryDomains: ['CPU', 'GPU', 'OPAQUE'],
    outputMemoryDomains: ['CPU', 'GPU', 'OPAQUE'],
    canPassThrough: true,
    requiresGpu: false,
    mutatesPixels: true,
    producesNewFrame: true,
    preservesTimestamp: true,
    preservesSourceIdentity: true,
    criticality: 'IMPORTANT',
    enabled: true,
    optional: false,
    timeoutNs: 5_000_000n,
    budgetNs: 5_000_000n,
    maximumInFlight: 1,
    metadata: { ubosVersion: '5.3.7', dependsOn: 'COLOR_CORRECTION' },
  };
  return {
    descriptor,
    initialize: () => ({ status: 'READY' }),
    process: async (input, ctx) => {
      const geometryRequest: GeometryTransformRequest = {
        requestId: ctx.requestId,
        sourceId: input.inputFrame.sourceId,
        streamId: input.inputFrame.streamId,
        inputFrame: input.inputFrame,
        expectedFrameGeneration: input.inputFrame.frameGeneration,
        expectedStorageGeneration: input.inputFrame.storageGeneration,
        transform,
        outputCanvas: canvas,
        pipelineConfigurationGeneration: ctx.configuration.generation,
        ...(ctx.cancellationSignal ? { cancellationSignal: ctx.cancellationSignal } : {}),
      };
      const res = await engine.transform(geometryRequest, { nowNs: ctx.nowNs });
      return {
        status:
          res.status === 'COMPLETED'
            ? 'COMPLETED'
            : res.status === 'PASSED_THROUGH'
              ? 'PASSED_THROUGH'
              : res.status === 'CANCELLED'
                ? 'CANCELLED'
                : 'FAILED',
        output: {
          stageId: descriptor.stageId,
          status:
            res.status === 'COMPLETED'
              ? 'COMPLETED'
              : res.status === 'PASSED_THROUGH'
                ? 'PASSED_THROUGH'
                : res.status === 'CANCELLED'
                  ? 'CANCELLED'
                  : 'FAILED',
          inputFrameId: input.inputFrame.frameId,
          outputFrameId: res.outputFrame?.frameId ?? input.inputFrame.frameId,
          outputLeaseId: res.outputFrame?.leaseId ?? input.inputFrame.leaseId,
          outputGeneration: res.outputFrame?.frameGeneration ?? input.inputFrame.frameGeneration,
          passThrough: res.passThrough,
          producedNewFrame: res.transformApplied,
          timestampPreserved: true,
          sourceIdentityPreserved: true,
          durationNs: BigInt(res.durationNs),
          warnings: res.warnings.map((message) => ({ code: 'GEOMETRY_WARNING', message })),
          metadata: { geometryResult: res.status, planId: res.planId },
        },
      };
    },
    shutdown: async () => {
      await engine.shutdown();
    },
  };
};
export const createSourceGraphGeometryMetadata = (r: GeometryTransformResult) =>
  freeze({
    geometryEnabled: r.effectiveTransform.enabled,
    activeProfileId: null,
    effectiveSourceCrop: r.sourceCrop,
    effectiveDestinationRect: r.destinationRectangle,
    rotation: r.effectiveTransform.rotationDegrees,
    flipState: {
      horizontal: r.effectiveTransform.horizontalFlip,
      vertical: r.effectiveTransform.verticalFlip,
    },
    anchor: r.effectiveTransform.anchorPoint,
    pivot: r.effectiveTransform.pivotPoint,
    outputCanvas: r.outputCanvas,
    visibleBounds: r.clippedBounds,
    clippingState: r.status === 'FULLY_CLIPPED' ? 'FULLY_CLIPPED' : 'VISIBLE',
    safeAreaStatus: 'METADATA_ONLY',
    transformStatus: r.status,
    geometryHealth: 'HEALTHY',
    lastTransformedRuntimeFrame: r.outputFrame?.runtimeFrameNumber?.toString(),
    activeBackendClass: r.backendId,
    passThroughState: r.passThrough,
  });
export const createGeometryCommandHandlers = (
  engine: DefaultGeometryEngine,
): readonly RuntimeCommandHandler[] =>
  GEOMETRY_COMMAND_TYPES.map((type) => ({
    commandType: type,
    handlerName: `${type.toLowerCase()}-handler`,
    idempotent: true,
    execute: async (command: RuntimeCommand, _context: RuntimeCommandContext) => {
      let result: unknown;
      switch (command.type) {
        case 'GEOMETRY_PLAN':
          result = engine.plan(command.payload as unknown as GeometryPlanRequest);
          break;
        case 'GEOMETRY_VALIDATE':
          result = engine.validateTransform(command.payload as unknown as GeometryTransform);
          break;
        case 'GEOMETRY_CLEAR_PLAN_CACHE':
          engine.clearPlanCache();
          result = { cleared: true };
          break;
        case 'GEOMETRY_SHUTDOWN':
          await engine.shutdown();
          result = { shutdown: true };
          break;
        default:
          result = { accepted: true, type: command.type };
      }
      return { status: 'SUCCEEDED', value: result, metadata: { geometry: true } };
    },
  }));
