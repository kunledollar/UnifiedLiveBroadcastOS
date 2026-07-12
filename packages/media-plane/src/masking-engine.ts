// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RuntimeEngineError,
  type RuntimeCommand,
  type RuntimeCommandHandler,
} from './execution-engine.js';
import type { FrameLease, FrameMemoryManager, VideoFrameFormat } from './frame-memory.js';
declare const process: { hrtime: { bigint: () => bigint } };
import type {
  VideoFramePipelineStage,
  VideoPipelineFrameReference,
  VideoPipelineStageInput,
  VideoPipelineStageRuntimeContext,
  VideoPipelineStageResult,
} from './video-frame-pipeline.js';

type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const nowNs = () => process.hrtime.bigint();
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const safe = (m?: Readonly<Record<string, unknown>>): Readonly<Record<string, Json>> =>
  freeze(
    Object.fromEntries(
      Object.entries(m ?? {}).filter(
        ([k, v]) =>
          !/path|url|handle|gpu|native|secret|token|endpoint/i.test(k) &&
          (['string', 'number', 'boolean'].includes(typeof v) || v === null),
      ),
    ) as Record<string, Json>,
  );
const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? val.toString() : val), 0);
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};

export type MaskType =
  | 'RECTANGLE'
  | 'ROUNDED_RECTANGLE'
  | 'ELLIPSE'
  | 'CIRCLE'
  | 'POLYGON'
  | 'SOURCE_ALPHA'
  | 'KEY_MATTE'
  | 'EXTERNAL_MATTE'
  | 'PATH_REFERENCE'
  | 'FULL_FRAME'
  | 'EMPTY'
  | 'CUSTOM';
export type MaskCoordinateSpace =
  | 'SOURCE_PIXELS'
  | 'SOURCE_NORMALIZED'
  | 'FRAME_PIXELS'
  | 'FRAME_NORMALIZED'
  | 'CANVAS_PIXELS'
  | 'CANVAS_NORMALIZED'
  | 'CUSTOM';
export type PolygonFillRule = 'NON_ZERO' | 'EVEN_ODD';
export type FeatherMode = 'NONE' | 'INNER' | 'OUTER' | 'BOTH' | 'BACKEND_DEFAULT';
export type MaskCombineMode =
  | 'REPLACE'
  | 'ADD'
  | 'INTERSECT'
  | 'SUBTRACT'
  | 'XOR'
  | 'MULTIPLY'
  | 'MIN'
  | 'MAX'
  | 'INVERT'
  | 'CUSTOM';
export type MaskOutputMode =
  | 'MASKED_FRAME'
  | 'MASK_ONLY'
  | 'ALPHA_ONLY'
  | 'PREMULTIPLIED_FRAME'
  | 'STRAIGHT_ALPHA_FRAME'
  | 'PASSTHROUGH'
  | 'DIAGNOSTIC_MASK_VIEW';
export type MaskingParameterPolicy =
  'REJECT_OUT_OF_RANGE' | 'CLAMP_TO_SUPPORTED_RANGE' | 'WARN_AND_CLAMP' | 'BACKEND_DEFAULT';
export type MaskingBackendType =
  'GPU_COMPUTE' | 'GPU_FRAGMENT' | 'CPU_SIMD' | 'CPU_REFERENCE' | 'PLATFORM_NATIVE' | 'SYNTHETIC';
export type MaskingQualityTier = 'FAST' | 'BALANCED' | 'HIGH_QUALITY' | 'REFERENCE';
export type MaskingStatus =
  | 'COMPLETED'
  | 'PASSED_THROUGH'
  | 'EMPTY_MASK'
  | 'FULL_MASK'
  | 'FAILED'
  | 'DROPPED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'DEGRADED';
export type MaskingFailurePolicy =
  | 'FAIL_FRAME'
  | 'DROP_FRAME'
  | 'PASS_THROUGH_IF_OPTIONAL'
  | 'DEGRADE_PIPELINE'
  | 'REQUEST_FALLBACK_BACKEND'
  | 'DISABLE_MASKING_STAGE'
  | 'REQUEST_OPERATOR_INTERVENTION';
export interface RectangleMask {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly coordinateSpace: MaskCoordinateSpace;
}
export interface RoundedRectangleMask {
  readonly rectangle: RectangleMask;
  readonly radiusX: number;
  readonly radiusY: number;
}
export interface EllipseMask {
  readonly centerX: number;
  readonly centerY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly coordinateSpace: MaskCoordinateSpace;
}
export interface CircleMask {
  readonly centerX: number;
  readonly centerY: number;
  readonly radius: number;
  readonly coordinateSpace: MaskCoordinateSpace;
}
export interface PolygonMask {
  readonly points: readonly Readonly<{ x: number; y: number }>[];
  readonly fillRule: PolygonFillRule;
  readonly closed: boolean;
  readonly coordinateSpace: MaskCoordinateSpace;
  readonly selfIntersectionPolicy?: 'REJECT' | 'ALLOW_WITH_FILL_RULE';
}
export type MaskShape =
  | RectangleMask
  | RoundedRectangleMask
  | EllipseMask
  | CircleMask
  | PolygonMask
  | Readonly<{ coordinateSpace: MaskCoordinateSpace; referenceId?: string; pathDigest?: string }>;
export interface MaskTransform {
  readonly translateX: number;
  readonly translateY: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly rotationDegrees: number;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly pivotX: number;
  readonly pivotY: number;
  readonly flipX: boolean;
  readonly flipY: boolean;
  readonly order?: readonly string[];
}
export const IDENTITY_MASK_TRANSFORM: MaskTransform = freeze({
  translateX: 0,
  translateY: 0,
  scaleX: 1,
  scaleY: 1,
  rotationDegrees: 0,
  anchorX: 0,
  anchorY: 0,
  pivotX: 0,
  pivotY: 0,
  flipX: false,
  flipY: false,
  order: ['anchor', 'pivot', 'scale', 'flip', 'rotate', 'translate'],
});
export interface MatteReference {
  readonly matteId: string;
  readonly sourceId?: string;
  readonly streamId?: string;
  readonly generation: bigint;
  readonly frameId?: string;
  readonly storageGeneration?: bigint;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface MaskingParameters {
  readonly enabled: boolean;
  readonly maskType: MaskType;
  readonly shape?: MaskShape;
  readonly invert: boolean;
  readonly opacity: number;
  readonly featherRadius: number;
  readonly featherMode: FeatherMode;
  readonly expandPixels: number;
  readonly contractPixels: number;
  readonly edgeHardness: number;
  readonly transform: MaskTransform;
  readonly combineMode: MaskCombineMode;
  readonly sourceMaskReference?: MatteReference;
  readonly matteReference?: MatteReference;
  readonly outputMode: MaskOutputMode;
  readonly diagnosticsEnabled: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface MaskStackEntry {
  readonly entryId: string;
  readonly parameters: MaskingParameters;
  readonly optional?: boolean;
  readonly generation: bigint;
}
export interface MaskStack {
  readonly stackId: string;
  readonly entries: readonly MaskStackEntry[];
  readonly maximumDepth: number;
  readonly outputMode: MaskOutputMode;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface MaskingBackendDescriptor {
  readonly backendId: string;
  readonly backendType: MaskingBackendType;
  readonly version: string;
  readonly priority: number;
  readonly active: boolean;
  readonly supportsPathReferences?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface MaskingCapability {
  readonly maskTypes: readonly MaskType[];
  readonly combineModes: readonly MaskCombineMode[];
  readonly outputModes: readonly MaskOutputMode[];
  readonly maxStackDepth: number;
  readonly maxPolygonPoints: number;
  readonly maxFeatherRadius: number;
  readonly maxMorphologyPixels: number;
  readonly supportsGpu: boolean;
  readonly metadataOnlyFeather: boolean;
}
export interface MaskingPlanRequest {
  readonly requestId: string;
  readonly inputFormat: VideoFrameFormat | string;
  readonly alphaMode: string;
  readonly stack: MaskStack;
  readonly outputMode: MaskOutputMode;
  readonly qualityTier: MaskingQualityTier;
  readonly backendPreference?: string;
  readonly deviceGeneration?: bigint;
  readonly pipelineConfigurationGeneration: bigint;
}
export interface MaskingPlanCandidate {
  readonly backendId: string;
  readonly score: number;
  readonly requiresPixelProcessing: boolean;
  readonly requiresNewOutput: boolean;
  readonly requiresTemporaryMask: boolean;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly operationCount: number;
  readonly warnings: readonly string[];
}
export interface MaskingPlan extends MaskingPlanCandidate {
  readonly planId: string;
  readonly inputFormat: string;
  readonly inputColorMetadata: Readonly<Record<string, Json>>;
  readonly inputAlphaMode: string;
  readonly effectiveMaskStack: MaskStack;
  readonly operationOrder: readonly string[];
  readonly selectedBackendId: string;
  readonly passThroughEligible: boolean;
  readonly outputMode: MaskOutputMode;
  readonly outputFormat: string;
  readonly outputAlphaMode: string;
  readonly deterministicScore: number;
  readonly metadata: Readonly<Record<string, Json>>;
}
export interface MaskingRequest {
  readonly requestId: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrame: VideoPipelineFrameReference;
  readonly inputLease: FrameLease;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly parameters: MaskingParameters;
  readonly maskStack?: MaskStack;
  readonly outputMode: MaskOutputMode;
  readonly backendPreference?: string;
  readonly qualityTier: MaskingQualityTier;
  readonly parameterPolicy: MaskingParameterPolicy;
  readonly deadlineNs?: bigint;
  readonly pipelineConfigurationGeneration: bigint;
  readonly correlationId?: string;
  readonly cancellationSignal?: AbortSignal;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface MaskingBackendResult {
  readonly status: MaskingStatus;
  readonly operationSignature: string;
  readonly warnings: readonly string[];
  readonly durationNs: bigint;
}
export interface MaskingBackend {
  readonly descriptor: MaskingBackendDescriptor;
  getCapabilities(): readonly Readonly<MaskingCapability>[];
  createPlan(
    request: MaskingPlanRequest,
    context: MaskingBackendContext,
  ): MaskingPlanCandidate | undefined;
  execute(
    plan: MaskingPlan,
    input: VideoPipelineFrameReference,
    output: FrameLease,
    maskOutput: FrameLease | undefined,
    context: MaskingBackendRuntimeContext,
  ): Promise<MaskingBackendResult>;
  shutdown(context: MaskingBackendShutdownContext): Promise<void>;
}
export interface MaskingBackendContext {
  readonly nowNs: () => bigint;
  readonly deviceGeneration?: bigint;
}
export interface MaskingBackendRuntimeContext extends MaskingBackendContext {
  readonly cancellationSignal?: AbortSignal;
  readonly deterministicSeed: string;
}
export interface MaskingBackendShutdownContext {
  readonly reason: string;
  readonly nowNs: () => bigint;
}
export interface MaskingResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId: string;
  readonly status: MaskingStatus;
  readonly inputFrameId: string;
  readonly maskedOutputReference?: VideoPipelineFrameReference;
  readonly maskOutputReference?: VideoPipelineFrameReference;
  readonly passThrough: boolean;
  readonly maskingApplied: boolean;
  readonly effectiveMaskStack: MaskStack;
  readonly outputMode: MaskOutputMode;
  readonly operationOrder: readonly string[];
  readonly effectiveQuality: MaskingQualityTier;
  readonly effectiveFeather: Readonly<Record<string, Json>>;
  readonly effectiveMorphology: Readonly<Record<string, Json>>;
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: bigint;
  readonly ownershipTransfer: Readonly<Record<string, Json>>;
  readonly completedAtNs: bigint;
}
export interface MaskingHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly activeBackendCount: number;
  readonly failedBackendCount: number;
  readonly planCacheSize: number;
  readonly activeRequestCount: number;
  readonly completedMaskCount: number;
  readonly passThroughCount: number;
  readonly failedCount: number;
  readonly cancelledCount: number;
  readonly rejectedCount: number;
  readonly timeoutCount: number;
  readonly parameterValidationFailureCount: number;
  readonly unsupportedTypeCount: number;
  readonly polygonValidationFailureCount: number;
  readonly externalMatteFailureCount: number;
  readonly featherWarningCount: number;
  readonly morphologyWarningCount: number;
  readonly gpuLossCount: number;
  readonly allocationFailureCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly temporaryBytes: number;
  readonly peakTemporaryBytes: number;
  readonly lastSuccess?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface MaskingTelemetrySnapshot {
  readonly planRequests: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
  readonly maskingRequests: number;
  readonly completions: number;
  readonly passThrough: number;
  readonly maskCounts: Readonly<Record<string, number>>;
  readonly failures: number;
  readonly cancellations: number;
  readonly rejections: number;
  readonly timeouts: number;
  readonly backendFallback: number;
  readonly gpuLoss: number;
  readonly allocationFailure: number;
  readonly staleGeneration: number;
  readonly averagePlanningDurationNs: string;
  readonly maximumPlanningDurationNs: string;
  readonly averageExecutionDurationNs: string;
  readonly maximumExecutionDurationNs: string;
  readonly peakTemporaryBytes: number;
  readonly currentRequestIds: readonly string[];
  readonly lastEvent: string;
  readonly healthSummary: string;
}
export interface MaskingEngineSnapshot {
  readonly backends: readonly Readonly<MaskingBackendDescriptor>[];
  readonly health: MaskingHealthSnapshot;
  readonly telemetry: MaskingTelemetrySnapshot;
  readonly planCacheKeys: readonly string[];
}
export interface MaskingValidationReport {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly snapshot: MaskingEngineSnapshot;
}
export class MaskingError extends RuntimeEngineError {}
const maskErr = (name: string, msg: string, meta?: Record<string, unknown>) =>
  new MaskingError(name, msg, safe(meta));

export const MASKING_COMMAND_TYPES = [
  'MASKING_REGISTER_BACKEND',
  'MASKING_UNREGISTER_BACKEND',
  'MASKING_PLAN',
  'MASKING_EXECUTE',
  'MASKING_CANCEL',
  'MASKING_SET_PARAMETERS',
  'MASKING_SET_MASK_STACK',
  'MASKING_ADD_MASK',
  'MASKING_REMOVE_MASK',
  'MASKING_REORDER_MASK',
  'MASKING_SET_OUTPUT_MODE',
  'MASKING_SET_FEATHER',
  'MASKING_SET_MORPHOLOGY',
  'MASKING_CLEAR_PLAN_CACHE',
  'MASKING_SET_DEFAULT_BACKEND',
  'MASKING_SET_QUALITY',
  'MASKING_VALIDATE',
  'MASKING_SHUTDOWN',
] as const;
export const MASKING_OUTPUT_KEYS = freeze({
  requests: 'masking.requests',
  plans: 'masking.plans',
  results: 'masking.results',
  maskedFrames: 'masking.maskedFrameReferences',
  maskOnly: 'masking.maskOnlyReferences',
  passThrough: 'masking.passThroughReferences',
  failed: 'masking.failedResults',
  health: 'masking.health',
  telemetry: 'masking.telemetry',
});
export const MASKING_WATCHDOG_INCIDENTS = [
  'MASKING_STALLED',
  'MASKING_BACKEND_FAILED',
  'MASKING_TIMEOUT',
  'MASKING_PARAMETERS_INVALID',
  'MASKING_TYPE_UNSUPPORTED',
  'MASKING_POLYGON_INVALID',
  'MASKING_EXTERNAL_MATTE_INVALID',
  'MASKING_KEY_MATTE_STALE',
  'MASKING_MASK_STACK_EXCEEDED',
  'MASKING_TEMP_MEMORY_PRESSURE',
  'MASKING_GPU_RESOURCE_LOST',
  'MASKING_ALLOCATION_FAILED',
  'MASKING_STALE_GENERATION',
  'MASKING_PLAN_CACHE_INVALID',
  'MASKING_GRAPH_MISMATCH',
  'MASKING_INVARIANT_FAILURE',
] as const;

const finite = (n: number, name: string) => {
  if (!Number.isFinite(n)) throw maskErr('MaskingParameterOutOfRange', `${name} must be finite`);
};
export function validateMaskingParameters(
  p: MaskingParameters,
  policy: MaskingParameterPolicy = 'REJECT_OUT_OF_RANGE',
  limits = { maxPolygonPoints: 128, maxFeatherRadius: 256, maxMorphologyPixels: 512 },
) {
  if (policy === 'BACKEND_DEFAULT')
    throw maskErr(
      'MaskingParametersInvalid',
      'BACKEND_DEFAULT is not accepted before backend selection',
    );
  ['opacity', 'featherRadius', 'expandPixels', 'contractPixels', 'edgeHardness'].forEach((k) =>
    finite((p as any)[k], k),
  );
  if (p.opacity < 0 || p.opacity > 1)
    throw maskErr('MaskingParameterOutOfRange', 'opacity outside 0..1');
  if (p.featherRadius < 0 || p.featherRadius > limits.maxFeatherRadius)
    throw maskErr('MaskingParameterOutOfRange', 'feather radius out of range');
  if (p.expandPixels && p.contractPixels)
    throw maskErr('MaskingParametersInvalid', 'expand and contract are mutually exclusive');
  if (
    Math.abs(p.expandPixels) > limits.maxMorphologyPixels ||
    Math.abs(p.contractPixels) > limits.maxMorphologyPixels
  )
    throw maskErr('MaskingParameterOutOfRange', 'morphology out of range');
  validateTransform(p.transform);
  if (p.shape) validateShape(p.maskType, p.shape, limits.maxPolygonPoints);
  if (p.maskType === 'EXTERNAL_MATTE' && !p.matteReference)
    throw maskErr('MaskingExternalMatteInvalid', 'external matte reference is required');
  if (p.maskType === 'KEY_MATTE' && !p.matteReference)
    throw maskErr('MaskingKeyMatteInvalid', 'key matte reference is required');
  if (p.maskType === 'CUSTOM')
    throw maskErr('MaskingTypeUnsupported', 'custom mask requires explicit backend support');
}
export function validateTransform(t: MaskTransform) {
  [
    'translateX',
    'translateY',
    'scaleX',
    'scaleY',
    'rotationDegrees',
    'anchorX',
    'anchorY',
    'pivotX',
    'pivotY',
  ].forEach((k) => finite((t as any)[k], k));
  if (t.scaleX === 0 || t.scaleY === 0)
    throw maskErr('MaskingParametersInvalid', 'zero scale rejected');
  if (t.scaleX < 0 || t.scaleY < 0)
    throw maskErr('MaskingParametersInvalid', 'negative scale is not an implicit flip');
}
export function validateShape(type: MaskType, s: MaskShape, maxPolygonPoints = 128) {
  const nums = (o: any) =>
    Object.entries(o).forEach(([k, v]) => typeof v === 'number' && finite(v, k));
  nums(s);
  const cs = (s as any).coordinateSpace ?? (s as any).rectangle?.coordinateSpace;
  if (!cs) throw maskErr('MaskingCoordinateSpaceUnsupported', 'shape coordinate space required');
  if (type === 'RECTANGLE') {
    const r = s as RectangleMask;
    if (r.width <= 0 || r.height <= 0)
      throw maskErr('MaskingShapeInvalid', 'rectangle dimensions must be positive');
  }
  if (type === 'ROUNDED_RECTANGLE') {
    const r = s as RoundedRectangleMask;
    validateShape('RECTANGLE', r.rectangle, maxPolygonPoints);
    if (r.radiusX <= 0 || r.radiusY <= 0)
      throw maskErr('MaskingShapeInvalid', 'rounded radii must be positive');
  }
  if (type === 'ELLIPSE') {
    const e = s as EllipseMask;
    if (e.radiusX <= 0 || e.radiusY <= 0)
      throw maskErr('MaskingShapeInvalid', 'ellipse radii must be positive');
  }
  if (type === 'CIRCLE') {
    const c = s as CircleMask;
    if (c.radius <= 0) throw maskErr('MaskingShapeInvalid', 'circle radius must be positive');
  }
  if (type === 'POLYGON') {
    const p = s as PolygonMask;
    if (!p.closed || p.points.length < 3)
      throw maskErr('MaskingPolygonInvalid', 'closed polygon with at least three points required');
    if (p.points.length > maxPolygonPoints)
      throw maskErr('MaskingPolygonInvalid', 'polygon point limit exceeded');
    p.points.forEach((pt) => {
      finite(pt.x, 'x');
      finite(pt.y, 'y');
    });
    if (!p.fillRule) throw maskErr('MaskingPolygonInvalid', 'fill rule required');
    if ((p.selfIntersectionPolicy ?? 'REJECT') === 'REJECT' && hasSelfIntersection(p.points))
      throw maskErr('MaskingPolygonInvalid', 'self-intersection rejected');
  }
}
const orient = (a: any, b: any, c: any) =>
  Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
function hasSelfIntersection(points: readonly Readonly<{ x: number; y: number }>[]) {
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === points.length - 1)) continue;
      const a = points[i],
        b = points[(i + 1) % points.length],
        c = points[j],
        d = points[(j + 1) % points.length];
      if (orient(a, b, c) !== orient(a, b, d) && orient(c, d, a) !== orient(c, d, b)) return true;
    }
  return false;
}
export function createMaskStack(stack: MaskStack) {
  if (stack.entries.length > stack.maximumDepth)
    throw maskErr('MaskingStackExceeded', 'mask stack depth exceeded');
  const ids = new Set<string>();
  for (const e of stack.entries) {
    if (ids.has(e.entryId)) throw maskErr('MaskingStackCycle', 'duplicate mask entry id rejected');
    ids.add(e.entryId);
    validateMaskingParameters(e.parameters);
  }
  return freeze({ ...stack, entries: freeze([...stack.entries]) }) as MaskStack;
}

export class SyntheticMaskingBackend implements MaskingBackend {
  readonly descriptor: MaskingBackendDescriptor;
  constructor(
    id = 'synthetic-masking-backend',
    private readonly opts: Readonly<{ fail?: boolean; timeout?: boolean; gpuLoss?: boolean }> = {},
  ) {
    this.descriptor = freeze({
      backendId: id,
      backendType: 'SYNTHETIC',
      version: '5.4.2',
      priority: 100,
      active: true,
    });
  }
  getCapabilities() {
    return [
      freeze({
        maskTypes: [
          'RECTANGLE',
          'ROUNDED_RECTANGLE',
          'ELLIPSE',
          'CIRCLE',
          'POLYGON',
          'SOURCE_ALPHA',
          'KEY_MATTE',
          'EXTERNAL_MATTE',
          'FULL_FRAME',
          'EMPTY',
          'PATH_REFERENCE',
        ],
        combineModes: [
          'REPLACE',
          'ADD',
          'INTERSECT',
          'SUBTRACT',
          'XOR',
          'MULTIPLY',
          'MIN',
          'MAX',
          'INVERT',
        ],
        outputModes: [
          'MASKED_FRAME',
          'MASK_ONLY',
          'ALPHA_ONLY',
          'PREMULTIPLIED_FRAME',
          'STRAIGHT_ALPHA_FRAME',
          'PASSTHROUGH',
          'DIAGNOSTIC_MASK_VIEW',
        ],
        maxStackDepth: 32,
        maxPolygonPoints: 128,
        maxFeatherRadius: 256,
        maxMorphologyPixels: 512,
        supportsGpu: false,
        metadataOnlyFeather: true,
      }),
    ];
  }
  createPlan(r: MaskingPlanRequest) {
    const cap = this.getCapabilities()[0];
    if (r.backendPreference && r.backendPreference !== this.descriptor.backendId) return undefined;
    if (r.stack.entries.some((e) => !cap.maskTypes.includes(e.parameters.maskType)))
      return undefined;
    return freeze({
      backendId: this.descriptor.backendId,
      score: 1000 + r.stack.entries.length,
      requiresPixelProcessing: r.stack.entries.length > 0 && r.outputMode !== 'PASSTHROUGH',
      requiresNewOutput: r.outputMode !== 'PASSTHROUGH' && r.stack.entries.length > 0,
      requiresTemporaryMask:
        r.stack.entries.length > 1 ||
        ['MASK_ONLY', 'ALPHA_ONLY', 'DIAGNOSTIC_MASK_VIEW'].includes(r.outputMode),
      estimatedTemporaryBytes: r.stack.entries.length > 1 ? 4096 : 0,
      estimatedOutputBytes: r.outputMode === 'PASSTHROUGH' ? 0 : 8192,
      operationCount: Math.max(1, r.stack.entries.length),
      warnings: r.stack.entries.some((e) => e.parameters.featherRadius > 0)
        ? ['Synthetic backend records feather metadata only']
        : [],
    });
  }
  async execute(
    plan: MaskingPlan,
    _input: VideoPipelineFrameReference,
    _output: FrameLease,
    _maskOutput: FrameLease | undefined,
    ctx: MaskingBackendRuntimeContext,
  ) {
    const s = nowNs();
    if (ctx.cancellationSignal?.aborted) throw maskErr('MaskingCancelled', 'masking cancelled');
    if (this.opts.gpuLoss) throw maskErr('MaskingBackendFailed', 'synthetic GPU loss');
    if (this.opts.timeout) throw maskErr('MaskingTimeout', 'synthetic timeout');
    if (this.opts.fail) throw maskErr('MaskingBackendFailed', 'synthetic backend failure');
    return freeze({
      status: 'COMPLETED',
      operationSignature: hash(plan.planId + ctx.deterministicSeed),
      warnings: plan.warnings,
      durationNs: nowNs() - s,
    });
  }
  async shutdown() {
    /* no native resources */
  }
}

export class MaskingEngine {
  private backends = new Map<string, MaskingBackend>();
  private cache = new Map<string, MaskingPlan>();
  private active = new Set<string>();
  private done = new Set<string>();
  private state: 'READY' | 'SHUTDOWN' = 'READY';
  private t: MaskingTelemetrySnapshot = freeze({
    planRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    maskingRequests: 0,
    completions: 0,
    passThrough: 0,
    maskCounts: {},
    failures: 0,
    cancellations: 0,
    rejections: 0,
    timeouts: 0,
    backendFallback: 0,
    gpuLoss: 0,
    allocationFailure: 0,
    staleGeneration: 0,
    averagePlanningDurationNs: '0',
    maximumPlanningDurationNs: '0',
    averageExecutionDurationNs: '0',
    maximumExecutionDurationNs: '0',
    peakTemporaryBytes: 0,
    currentRequestIds: [],
    lastEvent: 'MASKING_ENGINE_CREATED',
    healthSummary: 'READY',
  });
  constructor(
    private readonly frameMemory?: FrameMemoryManager,
    private readonly maxPlans = 256,
  ) {
    this.registerBackend(new SyntheticMaskingBackend());
  }
  registerBackend(b: MaskingBackend) {
    if (this.backends.has(b.descriptor.backendId))
      throw maskErr('DuplicateMaskingBackend', 'duplicate masking backend');
    this.backends.set(b.descriptor.backendId, b);
    this.cache.clear();
    this.event('MASKING_BACKEND_REGISTERED');
  }
  unregisterBackend(id: string) {
    if (!this.backends.delete(id)) throw maskErr('MaskingBackendNotFound', 'backend not found');
    for (const [k, p] of this.cache) if (p.selectedBackendId === id) this.cache.delete(k);
    this.event('MASKING_BACKEND_UNREGISTERED');
  }
  clearPlanCache() {
    this.cache.clear();
  }
  createPlan(req: MaskingRequest): MaskingPlan {
    const s = nowNs();
    this.ensure();
    this.validateRequest(req);
    const stack = createMaskStack(
      req.maskStack ?? {
        stackId: `stack-${req.requestId}`,
        entries: [
          { entryId: `entry-${req.requestId}`, parameters: req.parameters, generation: 1n },
        ],
        maximumDepth: 32,
        outputMode: req.outputMode,
      },
    );
    const key = this.cacheKey(req, stack);
    this.t = { ...this.t, planRequests: this.t.planRequests + 1 } as MaskingTelemetrySnapshot;
    const hit = this.cache.get(key);
    if (hit) {
      this.t = {
        ...this.t,
        cacheHits: this.t.cacheHits + 1,
        lastEvent: 'MASKING_PLAN_CACHE_HIT',
      } as MaskingTelemetrySnapshot;
      return hit;
    }
    const pr: MaskingPlanRequest = {
      requestId: req.requestId,
      inputFormat: (req.inputFrame.format?.pixelFormat as string) ?? 'RGBA8',
      alphaMode: (req.inputFrame.metadata?.alphaMode as string) ?? 'UNKNOWN',
      stack,
      outputMode: req.outputMode,
      qualityTier: req.qualityTier,
      backendPreference: req.backendPreference,
      pipelineConfigurationGeneration: req.pipelineConfigurationGeneration,
    };
    const candidates = [...this.backends.values()]
      .flatMap((b) => {
        const c = b.createPlan(pr, { nowNs });
        return c ? [c] : [];
      })
      .sort((a, b) => a.score - b.score || a.backendId.localeCompare(b.backendId));
    if (!candidates.length)
      throw maskErr('MaskingBackendNotFound', 'no backend supports masking request');
    const c = candidates[0];
    const passthrough = this.passThroughEligible(stack, req);
    const plan = freeze({
      ...c,
      planId: `mask-plan-${hash(key + '|' + c.backendId)}`,
      inputFormat: String(pr.inputFormat),
      inputColorMetadata: safe(req.inputFrame.metadata),
      inputAlphaMode: pr.alphaMode,
      effectiveMaskStack: stack,
      operationOrder: stack.entries.map(
        (e) => `${e.entryId}:${e.parameters.maskType}:${e.parameters.combineMode}`,
      ),
      selectedBackendId: c.backendId,
      passThroughEligible: passthrough,
      requiresPixelProcessing: !passthrough && c.requiresPixelProcessing,
      requiresNewOutput: !passthrough && c.requiresNewOutput,
      outputMode: req.outputMode,
      outputFormat: String(pr.inputFormat),
      outputAlphaMode:
        req.outputMode === 'PREMULTIPLIED_FRAME'
          ? 'PREMULTIPLIED'
          : req.outputMode === 'STRAIGHT_ALPHA_FRAME'
            ? 'STRAIGHT'
            : pr.alphaMode,
      deterministicScore: c.score,
      warnings: c.warnings,
      metadata: safe(req.metadata),
    });
    this.cache.set(key, plan);
    if (this.cache.size > this.maxPlans) this.cache.delete([...this.cache.keys()].sort()[0]);
    const d = nowNs() - s;
    this.t = {
      ...this.t,
      cacheMisses: this.t.cacheMisses + 1,
      maximumPlanningDurationNs: (d > BigInt(this.t.maximumPlanningDurationNs)
        ? d
        : BigInt(this.t.maximumPlanningDurationNs)
      ).toString(),
      lastEvent: 'MASKING_PLAN_CREATED',
    } as MaskingTelemetrySnapshot;
    return plan;
  }
  async execute(req: MaskingRequest): Promise<MaskingResult> {
    const s = nowNs();
    this.ensure();
    if (this.done.has(req.requestId))
      throw maskErr('MaskingInvariantViolation', 'duplicate request rejected');
    if (req.cancellationSignal?.aborted) return this.cancelled(req, 'before planning');
    this.active.add(req.requestId);
    this.t = {
      ...this.t,
      maskingRequests: this.t.maskingRequests + 1,
      currentRequestIds: [...this.active].sort(),
    } as MaskingTelemetrySnapshot;
    let output: FrameLease | undefined;
    let maskOutput: FrameLease | undefined;
    try {
      const plan = this.createPlan(req);
      if (req.cancellationSignal?.aborted) return this.cancelled(req, 'before allocation');
      if (plan.passThroughEligible) {
        this.done.add(req.requestId);
        this.active.delete(req.requestId);
        this.t = {
          ...this.t,
          passThrough: this.t.passThrough + 1,
          currentRequestIds: [...this.active].sort(),
          lastEvent: 'MASKING_PASSED_THROUGH',
        } as MaskingTelemetrySnapshot;
        return this.result(req, plan, 'PASSED_THROUGH', undefined, undefined, nowNs() - s);
      }
      if (!this.frameMemory)
        throw maskErr(
          'MaskingAllocationFailed',
          'FrameMemoryManager required for masking output allocation',
        );
      output = await this.frameMemory.allocate({
        width: Number(req.inputFrame.format.width ?? 1),
        height: Number(req.inputFrame.format.height ?? 1),
        format: String(req.inputFrame.format.pixelFormat ?? 'RGBA8') as VideoFrameFormat,
        memoryDomain: 'SYNTHETIC',
        usageFlags: ['PROCESSING_OUTPUT'],
        accessMode: 'READ_WRITE',
        ownerId: 'MASKING_ENGINE',
        lifetimeClass: 'FRAME_TRANSIENT',
        metadata: {
          masking: true,
          sourceId: req.sourceId,
          streamId: req.streamId,
          parentFrameId: req.inputFrame.frameId,
        },
      });
      if (['MASK_ONLY', 'ALPHA_ONLY', 'DIAGNOSTIC_MASK_VIEW'].includes(req.outputMode))
        maskOutput = await this.frameMemory.allocate({
          width: Number(req.inputFrame.format.width ?? 1),
          height: Number(req.inputFrame.format.height ?? 1),
          format: 'RGBA8',
          memoryDomain: 'SYNTHETIC',
          usageFlags: ['PROCESSING_OUTPUT', 'TEMPORARY'],
          accessMode: 'READ_WRITE',
          ownerId: 'MASKING_ENGINE',
          lifetimeClass: 'TICK_TRANSIENT',
          metadata: { maskOnly: true, maskStackId: plan.effectiveMaskStack.stackId },
        });
      if (req.cancellationSignal?.aborted)
        throw maskErr('MaskingCancelled', 'cancelled after allocation');
      const b = this.backends.get(plan.selectedBackendId);
      if (!b) throw maskErr('MaskingBackendNotFound', 'selected backend missing');
      const br = await b.execute(plan, req.inputFrame, output, maskOutput, {
        nowNs,
        cancellationSignal: req.cancellationSignal,
        deterministicSeed: req.requestId,
      });
      if (req.cancellationSignal?.aborted)
        throw maskErr('MaskingCancelled', 'late completion discarded');
      this.done.add(req.requestId);
      this.active.delete(req.requestId);
      this.t = {
        ...this.t,
        completions: this.t.completions + 1,
        currentRequestIds: [...this.active].sort(),
        maximumExecutionDurationNs: (br.durationNs > BigInt(this.t.maximumExecutionDurationNs)
          ? br.durationNs
          : BigInt(this.t.maximumExecutionDurationNs)
        ).toString(),
        lastEvent: 'MASKING_COMPLETED',
      } as MaskingTelemetrySnapshot;
      return this.result(req, plan, 'COMPLETED', output, maskOutput, nowNs() - s, br.warnings);
    } catch (e) {
      output?.release();
      maskOutput?.release();
      this.active.delete(req.requestId);
      const name = (e as Error).name;
      const status: MaskingStatus =
        name === 'MaskingCancelled'
          ? 'CANCELLED'
          : name === 'MaskingTimeout'
            ? 'DROPPED'
            : 'FAILED';
      this.t = {
        ...this.t,
        failures: this.t.failures + (status === 'FAILED' ? 1 : 0),
        cancellations: this.t.cancellations + (status === 'CANCELLED' ? 1 : 0),
        timeouts: this.t.timeouts + (status === 'DROPPED' ? 1 : 0),
        currentRequestIds: [...this.active].sort(),
        lastEvent: 'MASKING_FAILED',
      } as MaskingTelemetrySnapshot;
      throw e;
    }
  }
  private result(
    req: MaskingRequest,
    plan: MaskingPlan,
    status: MaskingStatus,
    out?: FrameLease,
    mask?: FrameLease,
    durationNs = 0n,
    warnings: readonly string[] = plan.warnings,
  ): MaskingResult {
    const ref = (l: FrameLease | undefined): VideoPipelineFrameReference | undefined =>
      l
        ? (freeze({
            ...req.inputFrame,
            frameId: l.frameId,
            storageId: this.frameMemory?.getFrame(l.frameId)?.identity.storageId ?? l.frameId,
            leaseId: l.leaseId,
            ownerId: l.ownerId,
            frameGeneration: l.generation,
            storageGeneration: BigInt(
              this.frameMemory?.getFrame(l.frameId)?.identity.storageGeneration ??
                l.generation.toString(),
            ),
            metadata: safe({
              maskingStatus: status,
              maskStackId: plan.effectiveMaskStack.stackId,
              alphaMode: plan.outputAlphaMode,
            }),
          }) as VideoPipelineFrameReference)
        : undefined;
    return freeze({
      requestId: req.requestId,
      planId: plan.planId,
      backendId: plan.selectedBackendId,
      status,
      inputFrameId: req.inputFrame.frameId,
      maskedOutputReference: status === 'PASSED_THROUGH' ? req.inputFrame : ref(out),
      maskOutputReference: ref(mask),
      passThrough: status === 'PASSED_THROUGH',
      maskingApplied: status === 'COMPLETED',
      effectiveMaskStack: plan.effectiveMaskStack,
      outputMode: req.outputMode,
      operationOrder: plan.operationOrder,
      effectiveQuality: req.qualityTier,
      effectiveFeather: { mode: req.parameters.featherMode, radius: req.parameters.featherRadius },
      effectiveMorphology: {
        signedPixels: req.parameters.expandPixels - req.parameters.contractPixels,
        order: 'feather-after-morphology-metadata',
      },
      warnings,
      temporaryBytes: plan.estimatedTemporaryBytes,
      outputBytes: plan.estimatedOutputBytes,
      durationNs,
      ownershipTransfer: { inputPreserved: true, outputOwner: out?.ownerId ?? 'INPUT' },
      completedAtNs: nowNs(),
    });
  }
  private cancelled(req: MaskingRequest, why: string): MaskingResult {
    const stack = req.maskStack ?? {
      stackId: 'cancelled',
      entries: [],
      maximumDepth: 0,
      outputMode: req.outputMode,
    };
    const plan = freeze({
      backendId: 'none',
      score: 0,
      requiresPixelProcessing: false,
      requiresNewOutput: false,
      requiresTemporaryMask: false,
      estimatedTemporaryBytes: 0,
      estimatedOutputBytes: 0,
      operationCount: 0,
      warnings: [why],
      planId: 'cancelled',
      inputFormat: 'UNKNOWN',
      inputColorMetadata: {},
      inputAlphaMode: 'UNKNOWN',
      effectiveMaskStack: stack,
      operationOrder: [],
      selectedBackendId: 'none',
      passThroughEligible: false,
      outputMode: req.outputMode,
      outputFormat: 'UNKNOWN',
      outputAlphaMode: 'UNKNOWN',
      deterministicScore: 0,
      metadata: {},
    }) as MaskingPlan;
    return this.result(req, plan, 'CANCELLED', undefined, undefined, 0n, [why]);
  }
  private validateRequest(req: MaskingRequest) {
    if (
      req.inputLease.frameId !== req.inputFrame.frameId ||
      req.inputLease.leaseId !== req.inputFrame.leaseId
    )
      throw maskErr('MaskingLeaseInvalid', 'input lease/frame mismatch');
    if (
      req.expectedFrameGeneration !== req.inputFrame.frameGeneration ||
      req.expectedStorageGeneration !== req.inputFrame.storageGeneration
    ) {
      this.t = {
        ...this.t,
        staleGeneration: this.t.staleGeneration + 1,
      } as MaskingTelemetrySnapshot;
      throw maskErr('MaskingGenerationMismatch', 'frame or storage generation mismatch');
    }
    validateMaskingParameters(req.parameters, req.parameterPolicy);
    if (
      req.parameters.maskType === 'KEY_MATTE' &&
      req.parameters.matteReference?.sourceId &&
      req.parameters.matteReference.sourceId !== req.sourceId
    )
      throw maskErr('MaskingKeyMatteInvalid', 'key matte source mismatch');
  }
  private passThroughEligible(stack: MaskStack, req: MaskingRequest) {
    if (!req.parameters.enabled || stack.entries.length === 0 || req.outputMode === 'PASSTHROUGH')
      return true;
    return (
      stack.entries.length === 1 &&
      stack.entries[0].parameters.maskType === 'FULL_FRAME' &&
      stack.entries[0].parameters.opacity === 1 &&
      !stack.entries[0].parameters.invert &&
      stack.entries[0].parameters.featherRadius === 0 &&
      ['MASKED_FRAME', 'PASSTHROUGH'].includes(req.outputMode)
    );
  }
  private cacheKey(req: MaskingRequest, stack: MaskStack) {
    return stable({
      f: req.inputFrame.format,
      alpha: req.inputFrame.metadata?.alphaMode,
      stack,
      mode: req.outputMode,
      q: req.qualityTier,
      b: req.backendPreference,
      pcg: req.pipelineConfigurationGeneration,
      kg: stack.entries.map((e) => e.parameters.matteReference?.generation.toString()),
    });
  }
  private ensure() {
    if (this.state === 'SHUTDOWN')
      throw maskErr('MaskingEngineNotReady', 'masking engine is shut down');
  }
  private event(e: string) {
    this.t = { ...this.t, lastEvent: e } as MaskingTelemetrySnapshot;
  }
  createSourceGraphMaskingMetadata(result?: MaskingResult) {
    return freeze({
      maskingEnabled: true,
      maskStackId: result?.effectiveMaskStack.stackId,
      maskCount: result?.effectiveMaskStack.entries.length ?? 0,
      maskTypes: result?.effectiveMaskStack.entries.map((e) => e.parameters.maskType) ?? [],
      outputMode: result?.outputMode,
      featherEnabled: !!result?.effectiveMaskStack.entries.some(
        (e) => e.parameters.featherRadius > 0,
      ),
      morphologyEnabled: !!result?.effectiveMaskStack.entries.some(
        (e) => e.parameters.expandPixels || e.parameters.contractPixels,
      ),
      maskingStatus: result?.status ?? 'IDLE',
      maskingHealth: this.getHealth().healthState,
      lastMaskedRuntimeFrame: result?.maskedOutputReference?.runtimeFrameNumber?.toString(),
      activeBackendClass: [...this.backends.values()].sort((a, b) =>
        a.descriptor.backendId.localeCompare(b.descriptor.backendId),
      )[0]?.descriptor.backendType,
      passThroughState: result?.passThrough ?? false,
    });
  }
  getHealth(): MaskingHealthSnapshot {
    return freeze({
      engineState: this.state,
      healthState: this.t.failures ? 'DEGRADED' : 'READY',
      backendCount: this.backends.size,
      activeBackendCount: [...this.backends.values()].filter((b) => b.descriptor.active).length,
      failedBackendCount: 0,
      planCacheSize: this.cache.size,
      activeRequestCount: this.active.size,
      completedMaskCount: this.t.completions,
      passThroughCount: this.t.passThrough,
      failedCount: this.t.failures,
      cancelledCount: this.t.cancellations,
      rejectedCount: this.t.rejections,
      timeoutCount: this.t.timeouts,
      parameterValidationFailureCount: 0,
      unsupportedTypeCount: 0,
      polygonValidationFailureCount: 0,
      externalMatteFailureCount: 0,
      featherWarningCount: 0,
      morphologyWarningCount: 0,
      gpuLossCount: this.t.gpuLoss,
      allocationFailureCount: this.t.allocationFailure,
      staleGenerationRejectionCount: this.t.staleGeneration,
      temporaryBytes: 0,
      peakTemporaryBytes: this.t.peakTemporaryBytes,
      lastSuccess: this.t.completions ? this.t.lastEvent : undefined,
      lastFailure: this.t.failures ? this.t.lastEvent : undefined,
      updatedAtNs: nowNs().toString(),
    });
  }
  getTelemetry() {
    return freeze({ ...this.t, currentRequestIds: [...this.active].sort() });
  }
  getSnapshot(): MaskingEngineSnapshot {
    return freeze({
      backends: [...this.backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
      planCacheKeys: [...this.cache.keys()].sort(),
    });
  }
  validate(): MaskingValidationReport {
    try {
      this.assertInvariants();
      return freeze({ ok: true, errors: [], warnings: [], snapshot: this.getSnapshot() });
    } catch (e) {
      return freeze({
        ok: false,
        errors: [(e as Error).message],
        warnings: [],
        snapshot: this.getSnapshot(),
      });
    }
  }
  assertInvariants() {
    if (this.cache.size > this.maxPlans)
      throw maskErr('MaskingInvariantViolation', 'unbounded plan cache');
    for (const p of this.cache.values())
      if (!this.backends.has(p.selectedBackendId))
        throw maskErr('MaskingInvariantViolation', 'stale cached backend');
  }
  async shutdown() {
    this.cache.clear();
    this.active.clear();
    await Promise.all(
      [...this.backends.values()].map((b) => b.shutdown({ reason: 'shutdown', nowNs })),
    );
    this.backends.clear();
    this.state = 'SHUTDOWN';
    this.event('MASKING_SHUTDOWN');
  }
}
export const createMaskingEngine = (frameMemory?: FrameMemoryManager) =>
  new MaskingEngine(frameMemory);
export function createMaskingCommandHandlers(
  engine: MaskingEngine,
): readonly RuntimeCommandHandler[] {
  const h = (type: string, fn: (p: any) => unknown | Promise<unknown>): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute: async (c: RuntimeCommand) => ({ status: 'SUCCEEDED', value: await fn(c.payload) }),
  });
  return MASKING_COMMAND_TYPES.map((t) =>
    h(t, (p) => {
      if (t === 'MASKING_CLEAR_PLAN_CACHE') return engine.clearPlanCache();
      if (t === 'MASKING_VALIDATE') return engine.validate();
      if (t === 'MASKING_SHUTDOWN') return engine.shutdown();
      if (t === 'MASKING_UNREGISTER_BACKEND') return engine.unregisterBackend(p.backendId);
      if (t === 'MASKING_PLAN') return engine.createPlan(p.request);
      if (t === 'MASKING_EXECUTE') return engine.execute(p.request);
      return { accepted: true, type: t, redacted: true };
    }),
  );
}
export class MaskingPipelineStage implements VideoFramePipelineStage {
  readonly descriptor = freeze({
    id: 'masking',
    name: 'MaskingPipelineStage',
    kind: 'MASKING',
    phase: 'TRANSFORM',
    version: '5.4.2',
    order: 460,
    dependencies: ['keying'],
    mutatesPixels: true,
    producesNewFrame: true,
    canPassThrough: true,
    preservesTimestamp: true,
    preservesSourceIdentity: true,
    requiresGpu: false,
    metadata: { executesBefore: ['geometry', 'layer-compositor'] },
  }) as any;
  constructor(
    private readonly engine: MaskingEngine,
    private readonly parameters: MaskingParameters,
  ) {}
  initialize() {
    return { status: 'READY' as const };
  }
  async process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> {
    const req: MaskingRequest = {
      requestId: context.requestId,
      sourceId: input.inputFrame.sourceId,
      streamId: input.inputFrame.streamId,
      inputFrame: input.inputFrame,
      inputLease: {
        leaseId: input.inputFrame.leaseId,
        frameId: input.inputFrame.frameId,
        ownerId: input.inputFrame.ownerId,
        access: 'READ_ONLY',
        generation: input.inputFrame.frameGeneration,
        acquiredAtNs: context.nowNs(),
        release: () => {},
      },
      expectedFrameGeneration: input.inputFrame.frameGeneration,
      expectedStorageGeneration: input.inputFrame.storageGeneration,
      parameters: this.parameters,
      outputMode: this.parameters.outputMode,
      qualityTier: 'BALANCED',
      parameterPolicy: 'REJECT_OUT_OF_RANGE',
      pipelineConfigurationGeneration: input.frameContext.configurationGeneration,
      cancellationSignal: context.cancellationSignal,
      metadata: { stage: 'masking' },
    };
    const r = await this.engine.execute(req);
    const out = r.maskedOutputReference ?? input.inputFrame;
    return {
      status: r.status === 'PASSED_THROUGH' ? 'PASSED_THROUGH' : 'COMPLETED',
      output: {
        stageId: this.descriptor.id,
        status: r.status === 'PASSED_THROUGH' ? 'PASSED_THROUGH' : 'COMPLETED',
        inputFrameId: input.inputFrame.frameId,
        outputFrameId: out.frameId,
        outputLeaseId: out.leaseId,
        outputGeneration: out.frameGeneration,
        passThrough: r.passThrough,
        producedNewFrame: !r.passThrough,
        timestampPreserved: true,
        sourceIdentityPreserved: true,
        durationNs: r.durationNs,
        warnings: r.warnings.map((w) => ({ code: 'MASKING_WARNING', message: w })),
        metadata: safe({
          maskingStatus: r.status,
          maskStackId: r.effectiveMaskStack.stackId,
          maskOutputFrameId: r.maskOutputReference?.frameId,
        }),
      },
    };
  }
  shutdown() {}
}
export const createMaskingPipelineStage = (engine: MaskingEngine, parameters: MaskingParameters) =>
  new MaskingPipelineStage(engine, parameters);
