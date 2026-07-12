// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RuntimeEngineError,
  type RuntimeCommand,
  type RuntimeCommandHandler,
} from './execution-engine.js';
import type {
  FrameAllocationRequest,
  FrameLease,
  FrameMemoryManager,
  VideoFrameFormat,
} from './frame-memory.js';
import type {
  VideoFramePipelineStage,
  VideoPipelineFrameReference,
  VideoPipelineStageDescriptor,
  VideoPipelineStageInput,
  VideoPipelineStageResult,
  VideoPipelineStageRuntimeContext,
} from './video-frame-pipeline.js';

type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const now = () => BigInt(Date.now()) * 1000000n;
const redact =
  /token|secret|password|credential|cookie|url|path|handle|pointer|native|device|pixel|gpu/i;
const safe = (v: unknown, d = 0): Json => {
  if (d > 4) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v as Json;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 32).map((x) => safe(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, val]) => [k, redact.test(k) ? '[REDACTED]' : safe(val, d + 1)]),
    );
  return String(v);
};
export const deepFreezeBlurSharpen = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) deepFreezeBlurSharpen(x);
  }
  return v as Readonly<T>;
};
const cloneFreeze = <T>(v: T): Readonly<T> => deepFreezeBlurSharpen(structuredClone(v));
const stable = (v: unknown): string =>
  JSON.stringify(v, (_, x) =>
    typeof x === 'bigint'
      ? x.toString()
      : x && typeof x === 'object' && !Array.isArray(x)
        ? Object.keys(x)
            .sort()
            .reduce<Record<string, unknown>>((o, k) => {
              o[k] = (x as Record<string, unknown>)[k];
              return o;
            }, {})
        : x,
  );
const id = (p: string, s: string) =>
  `${p}-${Array.from(s)
    .reduce((h, ch) => ((h * 33) ^ ch.charCodeAt(0)) >>> 0, 2166136261)
    .toString(36)}`;
export type BlurSharpenMode =
  | 'GAUSSIAN_BLUR'
  | 'BOX_BLUR'
  | 'DIRECTIONAL_BLUR'
  | 'MOTION_BLUR'
  | 'RADIAL_BLUR'
  | 'ZOOM_BLUR'
  | 'BACKGROUND_BLUR'
  | 'MASKED_BLUR'
  | 'SHARPEN'
  | 'UNSHARP_MASK'
  | 'EDGE_ENHANCE'
  | 'HIGH_PASS_SHARPEN'
  | 'BYPASS'
  | 'CUSTOM';
export type BlurSharpenParameterPolicy =
  'REJECT_OUT_OF_RANGE' | 'CLAMP_TO_SUPPORTED_RANGE' | 'WARN_AND_CLAMP' | 'BACKEND_DEFAULT';
export type BlurSharpenEdgeMode =
  'TRANSPARENT' | 'CLAMP' | 'MIRROR' | 'REPEAT' | 'OPAQUE_BLACK' | 'BACKEND_DEFAULT';
export type BlurSharpenAlphaPolicy =
  | 'PRESERVE'
  | 'FILTER_ALPHA'
  | 'RGB_ONLY'
  | 'PREMULTIPLIED_SAFE'
  | 'UNPREMULTIPLY_FILTER_REPREMULTIPLY'
  | 'REJECT_ALPHA'
  | 'BACKEND_DEFAULT';
export type BlurSharpenQualityTier = 'FAST' | 'BALANCED' | 'HIGH_QUALITY' | 'REFERENCE';
export type BlurSharpenBackendType =
  'GPU_COMPUTE' | 'GPU_FRAGMENT' | 'CPU_SIMD' | 'CPU_REFERENCE' | 'PLATFORM_NATIVE' | 'SYNTHETIC';
export type BlurSharpenStatus =
  'COMPLETED' | 'PASSED_THROUGH' | 'FAILED' | 'DROPPED' | 'CANCELLED' | 'REJECTED' | 'DEGRADED';
export interface BlurSharpenMaskReference {
  readonly maskId: string;
  readonly sourceId?: string;
  readonly streamId?: string;
  readonly generation: bigint;
  readonly frameId?: string;
  readonly storageId?: string;
  readonly feathered?: boolean;
  readonly opacity?: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface BlurSharpenParameters {
  readonly enabled: boolean;
  readonly mode: BlurSharpenMode;
  readonly radius?: number;
  readonly sigma?: number;
  readonly strength?: number;
  readonly threshold?: number;
  readonly angleDegrees?: number;
  readonly horizontalRadius?: number;
  readonly verticalRadius?: number;
  readonly iterationCount?: number;
  readonly sampleCount?: number;
  readonly qualityTier?: BlurSharpenQualityTier;
  readonly edgeMode?: BlurSharpenEdgeMode;
  readonly preserveAlpha?: boolean;
  readonly premultipliedAlphaPolicy?: BlurSharpenAlphaPolicy;
  readonly maskReference?: BlurSharpenMaskReference;
  readonly maskGeneration?: bigint;
  readonly invertMask?: boolean;
  readonly blendAmount?: number;
  readonly outputMode?: 'FILTERED_FRAME' | 'PASSTHROUGH' | 'DIAGNOSTIC_PLAN';
  readonly diagnosticsEnabled?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface BlurSharpenCapability {
  readonly modes: readonly BlurSharpenMode[];
  readonly edgeModes: readonly BlurSharpenEdgeMode[];
  readonly alphaPolicies: readonly BlurSharpenAlphaPolicy[];
  readonly qualityTiers: readonly BlurSharpenQualityTier[];
  readonly supportsMask: boolean;
  readonly supportsGpu: boolean;
  readonly maxRadius: number;
  readonly maxPassCount: number;
  readonly syntheticOnly?: boolean;
}
export interface BlurSharpenBackendDescriptor {
  readonly backendId: string;
  readonly backendType: BlurSharpenBackendType;
  readonly displayName: string;
  readonly deterministic: boolean;
  readonly version: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export type BlurSharpenOperation =
  | 'VALIDATE_INPUT'
  | 'VALIDATE_PARAMETERS'
  | 'VALIDATE_MASK'
  | 'RESOLVE_ALPHA_POLICY'
  | 'RESOLVE_EDGE_MODE'
  | 'PLAN_FILTER_PASSES'
  | 'ALLOCATE_TEMPORARY_SURFACES'
  | 'EXECUTE_FILTERING_PASSES'
  | 'APPLY_MASK_BLEND_POLICY'
  | 'VALIDATE_OUTPUT'
  | 'RELEASE_TEMPORARY_RESOURCES';
export const BLUR_SHARPEN_OPERATION_ORDER: readonly BlurSharpenOperation[] = Object.freeze([
  'VALIDATE_INPUT',
  'VALIDATE_PARAMETERS',
  'VALIDATE_MASK',
  'RESOLVE_ALPHA_POLICY',
  'RESOLVE_EDGE_MODE',
  'PLAN_FILTER_PASSES',
  'ALLOCATE_TEMPORARY_SURFACES',
  'EXECUTE_FILTERING_PASSES',
  'APPLY_MASK_BLEND_POLICY',
  'VALIDATE_OUTPUT',
  'RELEASE_TEMPORARY_RESOURCES',
]);
export interface BlurSharpenPlan {
  readonly planId: string;
  readonly inputFormat: Readonly<Record<string, Json>>;
  readonly inputColorMetadata: Readonly<Record<string, Json>>;
  readonly inputAlphaMode: string;
  readonly mode: BlurSharpenMode;
  readonly effectiveParameters: Readonly<BlurSharpenParameters>;
  readonly operationOrder: readonly BlurSharpenOperation[];
  readonly selectedBackendId: string;
  readonly passThroughEligible: boolean;
  readonly requiresPixelProcessing: boolean;
  readonly requiresNewOutput: boolean;
  readonly requiresTemporarySurfaces: boolean;
  readonly requiresMask: boolean;
  readonly passCount: number;
  readonly estimatedSamples: number;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly estimatedOperationCount: number;
  readonly outputFormat: VideoFrameFormat;
  readonly outputAlphaMode: string;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly metadata: Readonly<Record<string, Json>>;
}
export interface BlurSharpenPlanRequest {
  readonly requestId: string;
  readonly inputFrame: Readonly<VideoPipelineFrameReference>;
  readonly parameters: Readonly<BlurSharpenParameters>;
  readonly maskReference?: BlurSharpenMaskReference;
  readonly backendPreference?: string;
  readonly qualityTier?: BlurSharpenQualityTier;
  readonly parameterPolicy: BlurSharpenParameterPolicy;
  readonly deviceGeneration?: string;
  readonly pipelineConfigurationGeneration: string;
}
export interface BlurSharpenPlanCandidate extends Omit<
  BlurSharpenPlan,
  'planId' | 'selectedBackendId'
> {
  readonly backendId: string;
}
export interface BlurSharpenBackendContext {
  readonly nowNs: () => bigint;
}
export interface BlurSharpenBackendRuntimeContext extends BlurSharpenBackendContext {
  readonly cancellationSignal?: AbortSignal;
  readonly deadlineNs?: bigint;
}
export interface BlurSharpenBackendShutdownContext extends BlurSharpenBackendContext {}
export interface BlurSharpenBackendResult {
  readonly signature: string;
  readonly deterministicChecksum: string;
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly staleCompletion?: boolean;
}
export interface BlurSharpenBackend {
  readonly descriptor: BlurSharpenBackendDescriptor;
  getCapabilities(): readonly Readonly<BlurSharpenCapability>[];
  createPlan(
    request: BlurSharpenPlanRequest,
    context: BlurSharpenBackendContext,
  ): BlurSharpenPlanCandidate | undefined;
  execute(
    plan: BlurSharpenPlan,
    input: VideoPipelineFrameReference,
    output: FrameLease,
    temporaryFrames: readonly FrameLease[],
    context: BlurSharpenBackendRuntimeContext,
  ): Promise<BlurSharpenBackendResult>;
  shutdown(context: BlurSharpenBackendShutdownContext): Promise<void>;
}
export interface BlurSharpenRequest extends BlurSharpenPlanRequest {
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputLease: FrameLease;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly deadlineNs?: bigint;
  readonly correlationId?: string;
  readonly cancellationSignal?: AbortSignal;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface BlurSharpenResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId: string | undefined;
  readonly status: BlurSharpenStatus;
  readonly inputFrameId: string;
  readonly outputFrame: Readonly<VideoPipelineFrameReference> | undefined;
  readonly passThrough: boolean;
  readonly effectApplied: boolean;
  readonly mode: BlurSharpenMode;
  readonly effectiveParameters: Readonly<BlurSharpenParameters>;
  readonly passCount: number;
  readonly effectiveEdgeMode: BlurSharpenEdgeMode;
  readonly effectiveAlphaPolicy: BlurSharpenAlphaPolicy;
  readonly effectiveQuality: BlurSharpenQualityTier;
  readonly maskApplied: boolean;
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: bigint;
  readonly ownershipTransfer: Readonly<Record<string, Json>>;
  readonly completedAtNs: bigint;
}
export class BlurSharpenError extends RuntimeEngineError {}
const berr = (c: string, m: string, meta?: Record<string, unknown>) =>
  new BlurSharpenError(c, m, meta);
const finite = (n: any) => typeof n === 'number' && Number.isFinite(n);
const blurModes = new Set([
  'GAUSSIAN_BLUR',
  'BOX_BLUR',
  'DIRECTIONAL_BLUR',
  'MOTION_BLUR',
  'RADIAL_BLUR',
  'ZOOM_BLUR',
  'BACKGROUND_BLUR',
  'MASKED_BLUR',
]);
const sharpModes = new Set(['SHARPEN', 'UNSHARP_MASK', 'EDGE_ENHANCE', 'HIGH_PASS_SHARPEN']);
const maskModes = new Set(['MASKED_BLUR', 'BACKGROUND_BLUR']);
const MAX_RADIUS = 256,
  MAX_SIGMA = 128,
  MAX_STRENGTH = 8,
  MAX_ITER = 16,
  MAX_SAMPLE = 512,
  MAX_PASS = 32;
export function validateBlurSharpenParameters(
  p: Readonly<BlurSharpenParameters>,
  policy: BlurSharpenParameterPolicy = 'REJECT_OUT_OF_RANGE',
) {
  const warnings: string[] = [];
  const fix = (k: string, v: number, min: number, max: number) => {
    if (!finite(v)) throw berr('BlurSharpenParametersInvalid', `${k} must be finite`);
    if (v < min || v > max) {
      if (policy === 'REJECT_OUT_OF_RANGE')
        throw berr('BlurSharpenParametersInvalid', `${k} out of range`);
      const nv = Math.min(max, Math.max(min, v));
      warnings.push(`${k} clamped from ${v} to ${nv}`);
      return nv;
    }
    return v;
  };
  if (
    ![
      'GAUSSIAN_BLUR',
      'BOX_BLUR',
      'DIRECTIONAL_BLUR',
      'MOTION_BLUR',
      'RADIAL_BLUR',
      'ZOOM_BLUR',
      'BACKGROUND_BLUR',
      'MASKED_BLUR',
      'SHARPEN',
      'UNSHARP_MASK',
      'EDGE_ENHANCE',
      'HIGH_PASS_SHARPEN',
      'BYPASS',
      'CUSTOM',
    ].includes(p.mode)
  )
    throw berr('BlurSharpenModeUnsupported', 'unsupported effect mode');
  const q = ['FAST', 'BALANCED', 'HIGH_QUALITY', 'REFERENCE', undefined];
  if (!q.includes(p.qualityTier))
    throw berr('BlurSharpenParametersInvalid', 'unsupported quality tier');
  const e = [
    'TRANSPARENT',
    'CLAMP',
    'MIRROR',
    'REPEAT',
    'OPAQUE_BLACK',
    'BACKEND_DEFAULT',
    undefined,
  ];
  if (!e.includes(p.edgeMode)) throw berr('BlurSharpenParametersInvalid', 'unsupported edge mode');
  const a = [
    'PRESERVE',
    'FILTER_ALPHA',
    'RGB_ONLY',
    'PREMULTIPLIED_SAFE',
    'UNPREMULTIPLY_FILTER_REPREMULTIPLY',
    'REJECT_ALPHA',
    'BACKEND_DEFAULT',
    undefined,
  ];
  if (!a.includes(p.premultipliedAlphaPolicy))
    throw berr('BlurSharpenParametersInvalid', 'unsupported alpha policy');
  const out = { ...p };
  for (const [k, max] of [
    ['radius', MAX_RADIUS],
    ['horizontalRadius', MAX_RADIUS],
    ['verticalRadius', MAX_RADIUS],
    ['sigma', MAX_SIGMA],
    ['strength', MAX_STRENGTH],
    ['threshold', 1],
    ['blendAmount', 1],
  ] as any) {
    if (out[k] !== undefined) out[k] = fix(k, out[k], 0, max);
  }
  if (out.angleDegrees !== undefined) {
    if (!finite(out.angleDegrees))
      throw berr('BlurSharpenParametersInvalid', 'angle must be finite');
    out.angleDegrees = ((out.angleDegrees % 360) + 360) % 360;
    if (out.angleDegrees !== p.angleDegrees) warnings.push('angle normalized');
  }
  if (out.iterationCount !== undefined)
    out.iterationCount = fix('iterationCount', out.iterationCount, 0, MAX_ITER);
  if (out.sampleCount !== undefined)
    out.sampleCount = fix('sampleCount', out.sampleCount, 0, MAX_SAMPLE);
  if (maskModes.has(p.mode)) {
    const mr = p.maskReference;
    if (!mr && !p.maskGeneration)
      throw berr('BlurSharpenMaskInvalid', 'mask-aware mode requires mask reference');
    if (mr && p.maskGeneration !== undefined && mr.generation !== p.maskGeneration)
      throw berr('BlurSharpenMaskInvalid', 'stale mask generation');
  }
  return cloneFreeze({ parameters: out, warnings });
}
const passable = (p: Readonly<BlurSharpenParameters>) =>
  !p.enabled ||
  p.mode === 'BYPASS' ||
  ((p.radius ?? 0) === 0 &&
    (p.horizontalRadius ?? 0) === 0 &&
    (p.verticalRadius ?? 0) === 0 &&
    (p.strength ?? 0) === 0 &&
    (p.blendAmount ?? 1) === 0 &&
    !maskModes.has(p.mode));
export class SyntheticBlurSharpenBackend implements BlurSharpenBackend {
  readonly descriptor = cloneFreeze({
    backendId: 'synthetic-blur-sharpen',
    backendType: 'SYNTHETIC' as const,
    displayName: 'Deterministic Synthetic Blur/Sharpen Backend',
    deterministic: true,
    version: '5.4.3',
    metadata: { realPixelProcessing: false },
  });
  constructor(
    private opts: Readonly<{
      fail?: boolean;
      timeout?: boolean;
      gpuLoss?: boolean;
      allocationFailure?: boolean;
      durationNs?: bigint;
    }> = {},
  ) {}
  getCapabilities() {
    return cloneFreeze([
      {
        modes: [
          'GAUSSIAN_BLUR',
          'BOX_BLUR',
          'DIRECTIONAL_BLUR',
          'BACKGROUND_BLUR',
          'MASKED_BLUR',
          'SHARPEN',
          'UNSHARP_MASK',
          'EDGE_ENHANCE',
          'BYPASS',
        ],
        edgeModes: ['TRANSPARENT', 'CLAMP', 'MIRROR', 'REPEAT', 'OPAQUE_BLACK', 'BACKEND_DEFAULT'],
        alphaPolicies: [
          'PRESERVE',
          'FILTER_ALPHA',
          'RGB_ONLY',
          'PREMULTIPLIED_SAFE',
          'UNPREMULTIPLY_FILTER_REPREMULTIPLY',
          'REJECT_ALPHA',
          'BACKEND_DEFAULT',
        ],
        qualityTiers: ['FAST', 'BALANCED', 'HIGH_QUALITY', 'REFERENCE'],
        supportsMask: true,
        supportsGpu: false,
        maxRadius: MAX_RADIUS,
        maxPassCount: MAX_PASS,
        syntheticOnly: true,
      },
      {
        modes: ['MOTION_BLUR', 'RADIAL_BLUR', 'ZOOM_BLUR', 'HIGH_PASS_SHARPEN', 'CUSTOM'],
        edgeModes: ['BACKEND_DEFAULT'],
        alphaPolicies: ['PRESERVE', 'BACKEND_DEFAULT'],
        qualityTiers: ['FAST'],
        supportsMask: false,
        supportsGpu: false,
        maxRadius: MAX_RADIUS,
        maxPassCount: MAX_PASS,
        syntheticOnly: true,
      },
    ]);
  }
  createPlan(r: BlurSharpenPlanRequest) {
    const vr = validateBlurSharpenParameters(r.parameters, r.parameterPolicy);
    const p = vr.parameters as BlurSharpenParameters;
    const cap = this.getCapabilities().find((c) => c.modes.includes(p.mode));
    if (!cap) return undefined;
    const pt = passable(p);
    const w = Number(r.inputFrame.format.width ?? 1),
      h = Number(r.inputFrame.format.height ?? 1),
      bytes = w * h * 4;
    const rad = Math.max(p.radius ?? 0, p.horizontalRadius ?? 0, p.verticalRadius ?? 0);
    const separable =
      p.mode === 'GAUSSIAN_BLUR' ||
      p.horizontalRadius !== undefined ||
      p.verticalRadius !== undefined;
    const passCount = pt
      ? 0
      : Math.min(MAX_PASS, Math.max(1, (p.iterationCount ?? 1) * (separable && rad > 0 ? 2 : 1)));
    return cloneFreeze({
      backendId: this.descriptor.backendId,
      inputFormat: safe(r.inputFrame.format) as Record<string, Json>,
      inputColorMetadata: safe(r.inputFrame.metadata.colorMetadata ?? {}) as Record<string, Json>,
      inputAlphaMode: String(
        r.inputFrame.format.alphaMode ?? r.inputFrame.metadata.alphaMode ?? 'UNKNOWN',
      ),
      mode: p.mode,
      effectiveParameters: { ...p, metadata: safe(p.metadata) },
      operationOrder: BLUR_SHARPEN_OPERATION_ORDER,
      passThroughEligible: pt,
      requiresPixelProcessing: !pt,
      requiresNewOutput: !pt,
      requiresTemporarySurfaces: !pt && passCount > 1,
      requiresMask: maskModes.has(p.mode) || !!p.maskReference,
      passCount,
      estimatedSamples: pt ? 0 : Math.max(1, p.sampleCount ?? Math.ceil(rad * 2 + 1)) * passCount,
      estimatedTemporaryBytes: !pt && passCount > 1 ? bytes : 0,
      estimatedOutputBytes: !pt ? bytes : 0,
      estimatedOperationCount: pt ? 1 : BLUR_SHARPEN_OPERATION_ORDER.length * passCount,
      outputFormat: String(
        r.inputFrame.format.pixelFormat ?? r.inputFrame.format.format ?? 'RGBA8',
      ) as VideoFrameFormat,
      outputAlphaMode: p.premultipliedAlphaPolicy ?? (p.preserveAlpha ? 'PRESERVE' : 'UNKNOWN'),
      deterministicScore: (cap.supportsGpu ? 10 : 0) + passCount + bytes / 1e9,
      warnings: [
        ...vr.warnings,
        ...(cap.modes.includes('CUSTOM') &&
        ['MOTION_BLUR', 'RADIAL_BLUR', 'ZOOM_BLUR', 'HIGH_PASS_SHARPEN', 'CUSTOM'].includes(p.mode)
          ? ['metadata-boundary synthetic plan; no real pixel processing']
          : []),
      ],
      metadata: {
        synthetic: true,
        realPixelProcessing: false,
        operationSignature: id('bsop', stable({ p, passCount })),
      },
    });
  }
  async execute(
    plan: BlurSharpenPlan,
    _input: VideoPipelineFrameReference,
    _output: FrameLease,
    _temps: readonly FrameLease[],
    ctx: BlurSharpenBackendRuntimeContext,
  ) {
    if (ctx.cancellationSignal?.aborted) throw berr('BlurSharpenCancelled', 'cancelled');
    if (this.opts.gpuLoss) throw berr('BlurSharpenGpuResourceLost', 'gpu loss');
    if (this.opts.allocationFailure)
      throw berr('BlurSharpenAllocationFailed', 'allocation failure');
    if (this.opts.timeout || (ctx.deadlineNs !== undefined && ctx.nowNs() > ctx.deadlineNs))
      throw berr('BlurSharpenTimeout', 'timeout');
    if (this.opts.fail) throw berr('BlurSharpenBackendFailed', 'synthetic failure');
    const sig = id(
      'bsrun',
      stable({
        plan: plan.planId,
        mode: plan.mode,
        passes: plan.passCount,
        temps: _temps.map((t) => t.frameId),
      }),
    );
    return cloneFreeze({
      signature: sig,
      deterministicChecksum: id('bschk', sig),
      warnings: [],
      temporaryBytes: plan.estimatedTemporaryBytes,
      outputBytes: plan.estimatedOutputBytes,
    });
  }
  async shutdown() {}
}
export const BLUR_SHARPEN_OUTPUT_KEYS = Object.freeze({
  REQUEST: 'blurSharpen.request',
  PLAN: 'blurSharpen.plan',
  RESULT: 'blurSharpen.result',
  FILTERED_FRAME: 'blurSharpen.filteredFrame',
  PASS_THROUGH_FRAME: 'blurSharpen.passThroughFrame',
  FAILED_RESULT: 'blurSharpen.failedResult',
  HEALTH: 'blurSharpen.health',
  TELEMETRY: 'blurSharpen.telemetry',
});
export const BLUR_SHARPEN_COMMAND_TYPES = Object.freeze([
  'BLUR_SHARPEN_REGISTER_BACKEND',
  'BLUR_SHARPEN_UNREGISTER_BACKEND',
  'BLUR_SHARPEN_PLAN',
  'BLUR_SHARPEN_EXECUTE',
  'BLUR_SHARPEN_CANCEL',
  'BLUR_SHARPEN_SET_PARAMETERS',
  'BLUR_SHARPEN_SET_MODE',
  'BLUR_SHARPEN_SET_RADIUS',
  'BLUR_SHARPEN_SET_STRENGTH',
  'BLUR_SHARPEN_SET_MASK',
  'BLUR_SHARPEN_SET_EDGE_MODE',
  'BLUR_SHARPEN_CLEAR_PLAN_CACHE',
  'BLUR_SHARPEN_SET_DEFAULT_BACKEND',
  'BLUR_SHARPEN_SET_QUALITY',
  'BLUR_SHARPEN_VALIDATE',
  'BLUR_SHARPEN_SHUTDOWN',
] as const);
export const BLUR_SHARPEN_WATCHDOG_INCIDENTS = Object.freeze([
  'BLUR_SHARPEN_STALLED',
  'BLUR_SHARPEN_BACKEND_FAILED',
  'BLUR_SHARPEN_TIMEOUT',
  'BLUR_SHARPEN_PARAMETERS_INVALID',
  'BLUR_SHARPEN_MODE_UNSUPPORTED',
  'BLUR_SHARPEN_MASK_INVALID',
  'BLUR_SHARPEN_TEMP_MEMORY_PRESSURE',
  'BLUR_SHARPEN_GPU_RESOURCE_LOST',
  'BLUR_SHARPEN_ALLOCATION_FAILED',
  'BLUR_SHARPEN_STALE_GENERATION',
  'BLUR_SHARPEN_PLAN_CACHE_INVALID',
  'BLUR_SHARPEN_GRAPH_MISMATCH',
  'BLUR_SHARPEN_INVARIANT_FAILURE',
] as const);
export class BlurSharpenEngine {
  private backends = new Map<string, BlurSharpenBackend>();
  private cache = new Map<string, BlurSharpenPlan>();
  private active = new Set<string>();
  private done = new Set<string>();
  private shutdownFlag = false;
  private t: any = {
    planRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    requests: 0,
    completedEffects: 0,
    passThrough: 0,
    failures: 0,
    cancellations: 0,
    rejections: 0,
    timeouts: 0,
    maskFailures: 0,
    allocationFailures: 0,
    gpuLoss: 0,
    staleGeneration: 0,
    temporaryBytes: 0,
    peakTemporaryBytes: 0,
    blurModeCounts: {},
    sharpenModeCounts: {},
    multiPassCounts: 0,
    fallbackCounts: 0,
    totalPlanNs: 0,
    maxPlanNs: 0,
    totalExecNs: 0,
    maxExecNs: 0,
    currentRequestIds: [],
    lastEvent: 'BLUR_SHARPEN_ENGINE_CREATED',
  };
  constructor(
    private readonly frameMemory: FrameMemoryManager,
    private readonly maxCache = 128,
    private readonly clock = now,
  ) {
    this.registerBackend(new SyntheticBlurSharpenBackend());
  }
  registerBackend(b: BlurSharpenBackend) {
    if (this.backends.has(b.descriptor.backendId))
      throw berr('DuplicateBlurSharpenBackend', 'duplicate backend');
    this.backends.set(b.descriptor.backendId, b);
    this.clearPlanCache();
  }
  unregisterBackend(id: string) {
    if (!this.backends.delete(id)) throw berr('BlurSharpenBackendNotFound', 'backend not found');
    this.clearPlanCache();
  }
  clearPlanCache() {
    this.cache.clear();
  }
  createPlan(r: BlurSharpenPlanRequest) {
    if (this.shutdownFlag) throw berr('BlurSharpenEngineNotReady', 'shutdown');
    const st = this.clock();
    this.t.planRequests++;
    const key = stable({
      f: r.inputFrame.format,
      c: r.inputFrame.metadata.colorMetadata,
      a: r.inputFrame.format.alphaMode,
      p: r.parameters,
      m: r.parameters.maskReference?.generation ?? r.maskReference?.generation,
      q: r.qualityTier,
      b: r.backendPreference,
      d: r.deviceGeneration,
      g: r.pipelineConfigurationGeneration,
    });
    const cached = this.cache.get(key);
    if (cached) {
      this.t.cacheHits++;
      return cached;
    }
    this.t.cacheMisses++;
    const cands = [...this.backends.values()]
      .filter((b) => !r.backendPreference || b.descriptor.backendId === r.backendPreference)
      .map((b) => b.createPlan(r, { nowNs: this.clock }))
      .filter(Boolean) as BlurSharpenPlanCandidate[];
    if (!cands.length) throw berr('BlurSharpenModeUnsupported', 'no backend supports request');
    cands.sort(
      (a, b) =>
        a.deterministicScore - b.deterministicScore ||
        a.passCount - b.passCount ||
        a.estimatedTemporaryBytes - b.estimatedTemporaryBytes ||
        a.backendId.localeCompare(b.backendId),
    );
    const c = cands[0]!;
    const plan = cloneFreeze({
      ...c,
      selectedBackendId: c.backendId,
      planId: id('bsplan', stable({ ...c, backendId: c.backendId })),
    } as BlurSharpenPlan);
    this.cache.set(key, plan);
    while (this.cache.size > this.maxCache)
      this.cache.delete(this.cache.keys().next().value as string);
    const d = Number(this.clock() - st);
    this.t.totalPlanNs += d;
    this.t.maxPlanNs = Math.max(this.t.maxPlanNs, d);
    return plan;
  }
  async execute(req: BlurSharpenRequest): Promise<BlurSharpenResult> {
    const st = this.clock();
    if (this.done.has(req.requestId))
      throw berr('BlurSharpenDuplicateRequest', 'duplicate request');
    this.done.add(req.requestId);
    this.active.add(req.requestId);
    this.t.requests++;
    try {
      if (req.cancellationSignal?.aborted) {
        this.t.cancellations++;
        return this.finish(req, '', undefined, 'CANCELLED', undefined, st, [
          'cancelled before planning',
        ]);
      }
      if (
        req.inputFrame.frameGeneration !== req.expectedFrameGeneration ||
        req.inputFrame.storageGeneration !== req.expectedStorageGeneration
      ) {
        this.t.staleGeneration++;
        throw berr('BlurSharpenStaleGeneration', 'frame or storage generation mismatch');
      }
      if (
        req.parameters.maskReference &&
        req.parameters.maskGeneration !== undefined &&
        req.parameters.maskReference.generation !== req.parameters.maskGeneration
      ) {
        this.t.maskFailures++;
        throw berr('BlurSharpenMaskInvalid', 'stale mask');
      }
      const plan = this.createPlan(req);
      if (plan.passThroughEligible) {
        this.t.passThrough++;
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          'PASSED_THROUGH',
          req.inputFrame,
          st,
          plan.warnings,
          true,
          0,
          0,
        );
      }
      const alloc = (temp = false) =>
        this.frameMemory.allocate({
          width: Number(req.inputFrame.format.width ?? 1),
          height: Number(req.inputFrame.format.height ?? 1),
          format: plan.outputFormat,
          memoryDomain: 'SYNTHETIC',
          usageFlags: [temp ? 'TEMPORARY' : 'PROCESSING_OUTPUT'],
          accessMode: 'WRITE_ONLY',
          lifetimeClass: temp ? 'TICK_TRANSIENT' : 'FRAME_TRANSIENT',
          ownerId: 'VIDEO_PROCESSOR',
          correlationId: req.correlationId,
          metadata: { blurSharpenPlanId: plan.planId, temporary: temp },
        } as FrameAllocationRequest);
      let out: FrameLease | undefined;
      let temps: FrameLease[] = [];
      try {
        out = await alloc(false);
        for (
          let i = 0;
          i < (plan.requiresTemporarySurfaces ? Math.max(1, plan.passCount - 1) : 0);
          i++
        )
          temps.push(await alloc(true));
        const br = await this.backends
          .get(plan.selectedBackendId)!
          .execute(plan, req.inputFrame, out, temps, {
            nowNs: this.clock,
            ...(req.cancellationSignal ? { cancellationSignal: req.cancellationSignal } : {}),
            ...(req.deadlineNs !== undefined ? { deadlineNs: req.deadlineNs } : {}),
          });
        if (req.cancellationSignal?.aborted) {
          out.release();
          temps.forEach((t) => t.release());
          this.t.cancellations++;
          return this.finish(req, plan.planId, plan.selectedBackendId, 'CANCELLED', undefined, st, [
            'cancelled after backend',
          ]);
        }
        temps.forEach((t) => t.release());
        const f = this.frameMemory.getFrame(out.frameId);
        const ref = cloneFreeze({
          ...req.inputFrame,
          frameId: out.frameId,
          storageId: f?.descriptor.storageId ?? out.frameId,
          frameGeneration: out.generation,
          storageGeneration: BigInt(f?.descriptor.storageGeneration ?? out.generation),
          leaseId: out.leaseId,
          ownerId: 'BLUR_SHARPEN_ENGINE',
          state: 'LEASED',
          metadata: {
            ...req.inputFrame.metadata,
            blurSharpen: {
              planId: plan.planId,
              status: 'COMPLETED',
              mode: plan.mode,
              passCount: plan.passCount,
              synthetic: true,
              realPixelProcessing: false,
              maskApplied: plan.requiresMask,
              alphaPolicy: plan.effectiveParameters.premultipliedAlphaPolicy ?? 'PRESERVE',
            },
          },
        });
        this.t.completedEffects++;
        this.t.temporaryBytes += br.temporaryBytes;
        this.t.peakTemporaryBytes = Math.max(this.t.peakTemporaryBytes, br.temporaryBytes);
        if (blurModes.has(plan.mode))
          this.t.blurModeCounts[plan.mode] = (this.t.blurModeCounts[plan.mode] ?? 0) + 1;
        if (sharpModes.has(plan.mode))
          this.t.sharpenModeCounts[plan.mode] = (this.t.sharpenModeCounts[plan.mode] ?? 0) + 1;
        if (plan.passCount > 1) this.t.multiPassCounts++;
        const d = Number(this.clock() - st);
        this.t.totalExecNs += d;
        this.t.maxExecNs = Math.max(this.t.maxExecNs, d);
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          'COMPLETED',
          ref,
          st,
          [...plan.warnings, ...br.warnings],
          false,
          br.temporaryBytes,
          br.outputBytes,
        );
      } catch (e) {
        try {
          out?.release();
          temps.forEach((t) => t.release());
        } catch {}
        throw e;
      }
    } catch (e) {
      const code = e instanceof RuntimeEngineError ? e.code : 'BlurSharpenBackendFailed';
      if (code.includes('Timeout')) this.t.timeouts++;
      else if (code.includes('Gpu')) this.t.gpuLoss++;
      else if (code.includes('Allocation')) this.t.allocationFailures++;
      else if (code.includes('Mask')) this.t.maskFailures++;
      else this.t.failures++;
      return this.finish(
        req,
        '',
        undefined,
        code.includes('Cancel') ? 'CANCELLED' : code.includes('Reject') ? 'REJECTED' : 'FAILED',
        undefined,
        st,
        [code],
      );
    } finally {
      this.active.delete(req.requestId);
    }
  }
  private finish(
    req: BlurSharpenRequest,
    planId: string,
    backendId: string | undefined,
    status: BlurSharpenStatus,
    out: Readonly<VideoPipelineFrameReference> | undefined,
    st: bigint,
    warnings: readonly string[],
    pass = false,
    temp = 0,
    outBytes = 0,
  ): BlurSharpenResult {
    const end = this.clock();
    return cloneFreeze({
      requestId: req.requestId,
      planId,
      backendId,
      status,
      inputFrameId: req.inputFrame.frameId,
      outputFrame: out,
      passThrough: pass,
      effectApplied: status === 'COMPLETED' && !pass,
      mode: req.parameters.mode,
      effectiveParameters: { ...req.parameters, metadata: safe(req.parameters.metadata) },
      passCount:
        status === 'PASSED_THROUGH'
          ? 0
          : Math.max(0, Number((out?.metadata as any)?.blurSharpen?.passCount ?? 0)),
      effectiveEdgeMode: req.parameters.edgeMode ?? 'CLAMP',
      effectiveAlphaPolicy:
        req.parameters.premultipliedAlphaPolicy ??
        (req.parameters.preserveAlpha ? 'PRESERVE' : 'RGB_ONLY'),
      effectiveQuality: req.qualityTier ?? req.parameters.qualityTier ?? 'BALANCED',
      maskApplied: !!req.parameters.maskReference,
      warnings,
      temporaryBytes: temp,
      outputBytes: outBytes,
      durationNs: end - st,
      ownershipTransfer: {
        outputLeaseTransferred: !!out && !pass,
        passThrough: pass,
        temporaryReleased: true,
      },
      completedAtNs: end,
    });
  }
  getHealth() {
    return cloneFreeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: 'HEALTHY',
      backendCount: this.backends.size,
      cacheSize: this.cache.size,
      activeRequests: this.active.size,
      completedEffects: this.t.completedEffects,
      passThrough: this.t.passThrough,
      failures: this.t.failures,
      cancellations: this.t.cancellations,
      rejections: this.t.rejections,
      timeouts: this.t.timeouts,
      maskFailures: this.t.maskFailures,
      allocationFailures: this.t.allocationFailures,
      gpuLoss: this.t.gpuLoss,
      staleGeneration: this.t.staleGeneration,
      temporaryBytes: this.t.temporaryBytes,
      peakTemporaryBytes: this.t.peakTemporaryBytes,
      currentRequestIds: [...this.active],
      lastEvent: this.t.lastEvent,
      healthSummary: 'Blur/sharpen synthetic backend ready',
    });
  }
  getTelemetry() {
    return cloneFreeze({
      ...this.t,
      cacheSize: this.cache.size,
      backendCount: this.backends.size,
      activeRequests: this.active.size,
      averagePlanDurationNs: this.t.planRequests ? this.t.totalPlanNs / this.t.planRequests : 0,
      maximumPlanDurationNs: this.t.maxPlanNs,
      averageExecutionDurationNs: this.t.requests ? this.t.totalExecNs / this.t.requests : 0,
      maximumExecutionDurationNs: this.t.maxExecNs,
      currentRequestIds: [...this.active],
      healthSummary: this.getHealth(),
    });
  }
  getSnapshot() {
    return cloneFreeze({
      backends: [...this.backends.values()].map((b) => ({
        descriptor: b.descriptor,
        capabilities: b.getCapabilities().map((c) => safe(c)),
      })),
      cacheSize: this.cache.size,
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
    });
  }
  assertInvariants() {
    if (this.cache.size > this.maxCache)
      throw berr('BlurSharpenInvariantFailure', 'unbounded plan cache');
    if (this.shutdownFlag && (this.active.size || this.cache.size || this.backends.size))
      throw berr('BlurSharpenInvariantFailure', 'shutdown leak');
    return true;
  }
  async shutdown() {
    this.shutdownFlag = true;
    this.cache.clear();
    await Promise.all([...this.backends.values()].map((b) => b.shutdown({ nowNs: this.clock })));
    this.backends.clear();
    this.assertInvariants();
  }
}
export const createBlurSharpenEngine = (frameMemory: FrameMemoryManager, maxCache?: number) =>
  new BlurSharpenEngine(frameMemory, maxCache);
export const defaultBlurSharpenParameters = (): BlurSharpenParameters =>
  cloneFreeze({
    enabled: true,
    mode: 'GAUSSIAN_BLUR',
    radius: 4,
    sigma: 2,
    strength: 1,
    threshold: 0,
    angleDegrees: 0,
    horizontalRadius: 4,
    verticalRadius: 4,
    iterationCount: 1,
    sampleCount: 9,
    qualityTier: 'BALANCED',
    edgeMode: 'CLAMP',
    preserveAlpha: true,
    premultipliedAlphaPolicy: 'PRESERVE',
    invertMask: false,
    blendAmount: 1,
    outputMode: 'FILTERED_FRAME',
    diagnosticsEnabled: false,
    metadata: { preset: 'default' },
  });
export class BlurSharpenPipelineStage implements VideoFramePipelineStage {
  readonly descriptor: VideoPipelineStageDescriptor = cloneFreeze({
    stageId: 'ubos-v5.4.3-blur-sharpen',
    stageKind: 'BLUR_SHARPEN',
    displayName: 'UBOS v5.4.3 Blur and Sharpen Engine',
    version: '5.4.3',
    phase: 'TRANSFORM',
    order: 630,
    dependencies: ['MASKING'],
    requiredInputMediaKinds: ['VIDEO'],
    supportedInputFormats: ['RGBA8', 'BGRA8', 'RGBA16F', 'RGBA32F'],
    supportedOutputFormats: ['RGBA8', 'BGRA8', 'RGBA16F', 'RGBA32F'],
    inputMemoryDomains: ['OPAQUE', 'CPU', 'GPU', 'DMA', 'HARDWARE'],
    outputMemoryDomains: ['CPU', 'GPU', 'OPAQUE'],
    canPassThrough: true,
    requiresGpu: false,
    mutatesPixels: true,
    producesNewFrame: true,
    preservesTimestamp: true,
    preservesSourceIdentity: true,
    criticality: 'IMPORTANT',
    enabled: true,
    optional: true,
    timeoutNs: 5_000_000n,
    budgetNs: 2_000_000n,
    maximumInFlight: 1,
    metadata: { after: 'MASKING', before: ['GEOMETRY', 'LAYER_COMPOSITOR'], version: '5.4.3' },
  } as any);
  constructor(
    private engine: BlurSharpenEngine,
    private parameters: BlurSharpenParameters = defaultBlurSharpenParameters(),
  ) {}
  initialize() {
    return { status: 'READY' as const };
  }
  async process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> {
    const started = context.nowNs();
    const lease = {
      leaseId: input.inputFrame.leaseId,
      frameId: input.inputFrame.frameId,
      ownerId: input.inputFrame.ownerId,
      access: 'READ_ONLY' as const,
      generation: input.inputFrame.frameGeneration,
      acquiredAtNs: started,
      release() {},
    };
    const req: BlurSharpenRequest = {
      requestId: `blur-sharpen-stage-${context.requestId}`,
      sourceId: input.inputFrame.sourceId,
      streamId: input.inputFrame.streamId,
      inputFrame: input.inputFrame,
      inputLease: lease,
      expectedFrameGeneration: input.inputFrame.frameGeneration,
      expectedStorageGeneration: input.inputFrame.storageGeneration,
      parameters: this.parameters,
      qualityTier: this.parameters.qualityTier ?? 'BALANCED',
      parameterPolicy: 'REJECT_OUT_OF_RANGE',
      pipelineConfigurationGeneration: String(context.configuration.generation),
      ...(context.cancellationSignal ? { cancellationSignal: context.cancellationSignal } : {}),
    };
    const r = await this.engine.execute(req);
    const out = r.outputFrame ?? input.inputFrame;
    return {
      status:
        r.status === 'PASSED_THROUGH'
          ? 'PASSED_THROUGH'
          : r.status === 'COMPLETED'
            ? 'COMPLETED'
            : 'FAILED',
      output: {
        stageId: this.descriptor.stageId,
        status:
          r.status === 'PASSED_THROUGH'
            ? 'PASSED_THROUGH'
            : r.status === 'COMPLETED'
              ? 'COMPLETED'
              : 'FAILED',
        inputFrameId: input.inputFrame.frameId,
        outputFrameId: out.frameId,
        outputLeaseId: out.leaseId,
        outputGeneration: out.frameGeneration,
        passThrough: r.passThrough,
        producedNewFrame: !!r.outputFrame && !r.passThrough,
        timestampPreserved: out.sourceTimestampNs === input.inputFrame.sourceTimestampNs,
        sourceIdentityPreserved: out.sourceId === input.inputFrame.sourceId,
        durationNs: r.completedAtNs - started,
        warnings: r.warnings.map((w) => ({ code: 'BLUR_SHARPEN_WARNING', message: w })),
        metadata: {
          filterMode: r.mode,
          effectiveRadius: r.effectiveParameters.radius,
          effectiveStrength: r.effectiveParameters.strength,
          maskReferenceSummary: r.effectiveParameters.maskReference
            ? {
                maskId: r.effectiveParameters.maskReference.maskId,
                generation: r.effectiveParameters.maskReference.generation.toString(),
                feathered: !!r.effectiveParameters.maskReference.feathered,
              }
            : undefined,
          alphaMode: r.effectiveAlphaPolicy,
          filterGeneration: r.outputFrame?.frameGeneration.toString(),
          passThroughState: r.passThrough ? 'PASSED_THROUGH' : 'FILTERED',
        },
      },
    };
  }
  async shutdown() {
    await this.engine.shutdown();
  }
}
export const createBlurSharpenPipelineStage = (
  engine: BlurSharpenEngine,
  parameters?: BlurSharpenParameters,
) => new BlurSharpenPipelineStage(engine, parameters);
export function createBlurSharpenCommandHandlers(
  engine: BlurSharpenEngine,
): Readonly<Record<string, RuntimeCommandHandler>> {
  const h = (type: string, fn: (p: any) => unknown | Promise<unknown>): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute: async (c: RuntimeCommand) => ({ status: 'SUCCEEDED', value: await fn(c.payload) }),
  });
  return {
    BLUR_SHARPEN_REGISTER_BACKEND: h('BLUR_SHARPEN_REGISTER_BACKEND', () => ({
      registered: false,
      reason: 'backend objects are private',
    })),
    BLUR_SHARPEN_UNREGISTER_BACKEND: h('BLUR_SHARPEN_UNREGISTER_BACKEND', (p) =>
      engine.unregisterBackend(String(p.backendId)),
    ),
    BLUR_SHARPEN_PLAN: h('BLUR_SHARPEN_PLAN', (p) => engine.createPlan(p)),
    BLUR_SHARPEN_EXECUTE: h('BLUR_SHARPEN_EXECUTE', () => ({
      accepted: false,
      reason: 'execute requires frame memory runtime context',
    })),
    BLUR_SHARPEN_CANCEL: h('BLUR_SHARPEN_CANCEL', () => ({ cancelled: true })),
    BLUR_SHARPEN_SET_PARAMETERS: h('BLUR_SHARPEN_SET_PARAMETERS', (p) =>
      validateBlurSharpenParameters(p.parameters, p.policy),
    ),
    BLUR_SHARPEN_SET_MODE: h('BLUR_SHARPEN_SET_MODE', (p) =>
      validateBlurSharpenParameters({ ...p.parameters, mode: p.mode }, p.policy),
    ),
    BLUR_SHARPEN_SET_RADIUS: h('BLUR_SHARPEN_SET_RADIUS', (p) =>
      validateBlurSharpenParameters({ ...p.parameters, radius: p.radius }, p.policy),
    ),
    BLUR_SHARPEN_SET_STRENGTH: h('BLUR_SHARPEN_SET_STRENGTH', (p) =>
      validateBlurSharpenParameters({ ...p.parameters, strength: p.strength }, p.policy),
    ),
    BLUR_SHARPEN_SET_MASK: h('BLUR_SHARPEN_SET_MASK', (p) =>
      validateBlurSharpenParameters(
        {
          ...p.parameters,
          maskReference: p.maskReference,
          maskGeneration: p.maskReference?.generation,
        },
        p.policy,
      ),
    ),
    BLUR_SHARPEN_SET_EDGE_MODE: h('BLUR_SHARPEN_SET_EDGE_MODE', (p) =>
      validateBlurSharpenParameters({ ...p.parameters, edgeMode: p.edgeMode }, p.policy),
    ),
    BLUR_SHARPEN_CLEAR_PLAN_CACHE: h('BLUR_SHARPEN_CLEAR_PLAN_CACHE', () =>
      engine.clearPlanCache(),
    ),
    BLUR_SHARPEN_SET_DEFAULT_BACKEND: h('BLUR_SHARPEN_SET_DEFAULT_BACKEND', (p) => ({
      backendId: p.backendId,
      observable: true,
    })),
    BLUR_SHARPEN_SET_QUALITY: h('BLUR_SHARPEN_SET_QUALITY', (p) => ({ quality: p.qualityTier })),
    BLUR_SHARPEN_VALIDATE: h('BLUR_SHARPEN_VALIDATE', (p) =>
      validateBlurSharpenParameters(p.parameters, p.policy),
    ),
    BLUR_SHARPEN_SHUTDOWN: h('BLUR_SHARPEN_SHUTDOWN', () => engine.shutdown()),
  };
}
export function createBlurSharpenSourceGraphMetadata(r: BlurSharpenResult) {
  return cloneFreeze({
    effectEnabled: r.effectiveParameters.enabled,
    mode: r.mode,
    radius:
      r.effectiveParameters.radius ??
      r.effectiveParameters.horizontalRadius ??
      r.effectiveParameters.verticalRadius ??
      0,
    strength: r.effectiveParameters.strength ?? 0,
    maskUsage: r.maskApplied
      ? {
          maskId: r.effectiveParameters.maskReference?.maskId,
          generation: r.effectiveParameters.maskReference?.generation.toString(),
          inverted: !!r.effectiveParameters.invertMask,
        }
      : undefined,
    passCount: r.passCount,
    effectStatus: r.status,
    health: r.status === 'COMPLETED' || r.status === 'PASSED_THROUGH' ? 'HEALTHY' : 'DEGRADED',
    lastProcessedRuntimeFrame: r.outputFrame?.runtimeFrameNumber.toString(),
    backendClass: r.backendId ? 'SYNTHETIC' : undefined,
    passThroughState: r.passThrough ? 'PASSED_THROUGH' : 'FILTERED',
  });
}
