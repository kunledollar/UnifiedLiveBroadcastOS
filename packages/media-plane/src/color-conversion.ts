import {
  RuntimeEngineError,
  type RuntimeCommand,
  type RuntimeCommandHandler,
  type TypedRuntimeCommandHandler,
} from './execution-engine.js';
import type {
  FrameLease,
  FrameMemoryManager,
  FrameMemoryDomain,
  VideoFrameFormat,
} from './frame-memory.js';
import type {
  VideoPipelineFrameReference,
  VideoFramePipelineStage,
  VideoPipelineStageInput,
  VideoPipelineStageRuntimeContext,
  VideoPipelineStageResult,
  VideoPipelineStageDescriptor,
  VideoPipelineOutputProfile,
  VideoPipelineMemoryDomain,
} from './video-frame-pipeline.js';

export type ColorPrimaries =
  | 'BT_601'
  | 'BT_709'
  | 'BT_2020'
  | 'DISPLAY_P3'
  | 'SRGB'
  | 'ADOBE_RGB'
  | 'ACES_AP0'
  | 'ACES_AP1'
  | 'UNKNOWN';
export type ColorTransfer =
  'LINEAR' | 'SRGB' | 'BT_1886' | 'GAMMA_22' | 'GAMMA_24' | 'PQ' | 'HLG' | 'LOG' | 'UNKNOWN';
export type ColorMatrix =
  | 'IDENTITY'
  | 'BT_601'
  | 'BT_709'
  | 'BT_2020_NCL'
  | 'BT_2020_CL'
  | 'FCC'
  | 'SMPTE_240M'
  | 'UNKNOWN';
export type ColorRange = 'FULL' | 'LIMITED' | 'EXTENDED' | 'UNKNOWN';
export type ChromaSiting = 'CENTERED' | 'LEFT' | 'TOP_LEFT' | 'COSITED' | 'UNKNOWN';
export type ColorAlphaMode = 'NONE' | 'STRAIGHT' | 'PREMULTIPLIED' | 'OPAQUE' | 'UNKNOWN';
export type ColorConversionIntent =
  | 'FORMAT_NORMALIZATION'
  | 'PIPELINE_COMPATIBILITY'
  | 'OUTPUT_PROFILE_MATCH'
  | 'GPU_UPLOAD_COMPATIBILITY'
  | 'COMPOSITOR_INPUT_NORMALIZATION'
  | 'RECORDING_COMPATIBILITY'
  | 'STREAMING_COMPATIBILITY'
  | 'PREVIEW_COMPATIBILITY'
  | 'CUSTOM';
export type ColorConversionQualityTier = 'FAST' | 'BALANCED' | 'HIGH_QUALITY' | 'REFERENCE';
export type ChromaResamplingPolicy =
  'NEAREST' | 'BILINEAR' | 'BICUBIC' | 'LANCZOS' | 'BACKEND_DEFAULT';
export type ColorConversionDitherPolicy =
  'NONE' | 'ORDERED' | 'BLUE_NOISE' | 'ERROR_DIFFUSION' | 'BACKEND_DEFAULT';
export type ColorConversionClippingPolicy =
  'CLAMP' | 'PRESERVE_EXTENDED' | 'FAIL_ON_OUT_OF_RANGE' | 'BACKEND_DEFAULT';
export type ColorConversionBackendType =
  | 'GPU_COMPUTE'
  | 'GPU_FRAGMENT'
  | 'GPU_VIDEO_PROCESSOR'
  | 'CPU_SIMD'
  | 'CPU_REFERENCE'
  | 'PLATFORM_NATIVE'
  | 'SYNTHETIC';
export type ColorConversionBackendPreference = 'AUTO' | ColorConversionBackendType | string;
export type ColorConversionStep =
  | 'VALIDATE_INPUT'
  | 'UNPACK'
  | 'CHROMA_UPSAMPLE'
  | 'RANGE_NORMALIZE'
  | 'YUV_TO_RGB_MATRIX'
  | 'TRANSFER_TO_LINEAR'
  | 'PRIMARIES_MATRIX'
  | 'TRANSFER_FROM_LINEAR'
  | 'RGB_TO_YUV_MATRIX'
  | 'RANGE_ENCODE'
  | 'CHROMA_DOWNSAMPLE'
  | 'BIT_DEPTH_CONVERT'
  | 'ALPHA_PREMULTIPLY'
  | 'ALPHA_UNPREMULTIPLY'
  | 'PACK'
  | 'VALIDATE_OUTPUT';
export type ColorConversionStatus =
  'COMPLETED' | 'PASSED_THROUGH' | 'FAILED' | 'DROPPED' | 'CANCELLED' | 'REJECTED' | 'DEGRADED';
export type ColorConversionFailurePolicy =
  | 'FAIL_FRAME'
  | 'DROP_FRAME'
  | 'PASS_THROUGH_IF_PROFILE_ALLOWS'
  | 'DEGRADE_PIPELINE'
  | 'REQUEST_FALLBACK_BACKEND'
  | 'REQUEST_OPERATOR_INTERVENTION';
export type ColorConversionAlphaPolicy =
  'PRESERVE' | 'PREMULTIPLY' | 'UNPREMULTIPLY' | 'DISCARD_IF_EXPLICIT' | 'REJECT_ALPHA_LOSS';
type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const redact =
  /token|secret|password|credential|cookie|url|path|handle|pointer|native|device|pixel/i;
const safe = (v: unknown, d = 0): Json => {
  if (d > 4) return '[Truncated]';
  if (v == null || ['string', 'number', 'boolean'].includes(typeof v)) return v as Json;
  if (typeof v === 'bigint') return v.toString();
  if (Array.isArray(v)) return v.slice(0, 32).map((x) => safe(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, val]) => [k, redact.test(k) ? '[REDACTED]' : safe(val, d + 1)]),
    );
  return String(v);
};
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const c of Object.values(v as Record<string, unknown>)) freeze(c);
  }
  return v as Readonly<T>;
};
const clone = <T>(v: T): Readonly<T> => freeze(structuredClone(v));
export interface ColorMetadata {
  readonly primaries: ColorPrimaries;
  readonly transfer: ColorTransfer;
  readonly matrix: ColorMatrix;
  readonly range: ColorRange;
  readonly chromaSiting: ChromaSiting;
  readonly bitDepth: 8 | 10 | 12 | 16 | 32;
  readonly alphaMode: ColorAlphaMode;
  readonly hdr: boolean;
  readonly sceneReferred: boolean;
  readonly masteringDisplayMetadataRef?: string;
  readonly contentLightLevelMetadataRef?: string;
  readonly metadata: Readonly<Record<string, Json>>;
}
export const createColorMetadata = (p: Partial<ColorMetadata> = {}): Readonly<ColorMetadata> =>
  freeze({
    primaries: 'BT_709',
    transfer: 'SRGB',
    matrix: 'IDENTITY',
    range: 'FULL',
    chromaSiting: 'CENTERED',
    bitDepth: 8,
    alphaMode: 'OPAQUE',
    hdr: false,
    sceneReferred: false,
    ...p,
    metadata: safe(p.metadata ?? {}) as Record<string, Json>,
  });
const RGB = new Set<VideoFrameFormat>([
  'RGB24',
  'BGR24' as VideoFrameFormat,
  'RGBA8',
  'BGRA8',
  'RGBA16F',
  'RGBA32F',
]);
const YUV = new Set<VideoFrameFormat>([
  'YUY2',
  'UYVY',
  'NV12',
  'P010',
  'I420',
  'YV12',
  'YUV420',
  'YUV422',
  'YUV444',
]);
const depth: Record<string, ColorMetadata['bitDepth']> = {
  RGB24: 8,
  BGR24: 8,
  RGBA8: 8,
  BGRA8: 8,
  RGBA16F: 16,
  RGBA32F: 32,
  YUY2: 8,
  UYVY: 8,
  NV12: 8,
  P010: 10,
  I420: 8,
  YV12: 8,
  YUV420: 8,
  YUV422: 8,
  YUV444: 8,
};
const bytes = (f: VideoFrameFormat, w: number, h: number) =>
  Math.ceil(
    w *
      h *
      (f === 'RGBA32F'
        ? 16
        : f === 'RGBA16F'
          ? 8
          : f === 'RGBA8' || f === 'BGRA8'
            ? 4
            : f === 'RGB24' || f === 'BGR24'
              ? 3
              : f === 'P010'
                ? 3
                : f === 'NV12' || f === 'I420' || f === 'YV12' || f === 'YUV420'
                  ? 1.5
                  : f === 'YUV422' || f === 'YUY2' || f === 'UYVY'
                    ? 2
                    : 3),
  );
export interface ColorConversionCapability {
  readonly backendId: string;
  readonly inputFormat: VideoFrameFormat;
  readonly outputFormat: VideoFrameFormat;
  readonly primaries: readonly ColorPrimaries[];
  readonly transfers: readonly ColorTransfer[];
  readonly matrices: readonly ColorMatrix[];
  readonly ranges: readonly ColorRange[];
  readonly chromaSitings: readonly ChromaSiting[];
  readonly alphaModes: readonly ColorAlphaMode[];
  readonly bitDepths: readonly number[];
  readonly qualityTiers: readonly ColorConversionQualityTier[];
  readonly chromaFilters: readonly ChromaResamplingPolicy[];
  readonly ditherPolicies: readonly ColorConversionDitherPolicy[];
  readonly backendType: ColorConversionBackendType;
  readonly gpuCompatible: boolean;
}
export interface ColorConversionPlanRequest {
  readonly requestId: string;
  readonly inputFormat: VideoFrameFormat;
  readonly outputFormat: VideoFrameFormat;
  readonly width: number;
  readonly height: number;
  readonly inputColor: Readonly<ColorMetadata>;
  readonly outputColor: Readonly<ColorMetadata>;
  readonly intent: ColorConversionIntent;
  readonly qualityTier?: ColorConversionQualityTier;
  readonly backendPreference?: ColorConversionBackendPreference;
  readonly ditherPolicy?: ColorConversionDitherPolicy;
  readonly clippingPolicy?: ColorConversionClippingPolicy;
  readonly alphaPolicy?: ColorConversionAlphaPolicy;
  readonly outputMemoryDomain?: FrameMemoryDomain;
  readonly deviceGeneration?: bigint;
  readonly pipelineConfigurationGeneration?: bigint;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ColorConversionPlan {
  readonly planId: string;
  readonly backendId: string;
  readonly inputFormat: VideoFrameFormat;
  readonly outputFormat: VideoFrameFormat;
  readonly inputColor: Readonly<ColorMetadata>;
  readonly outputColor: Readonly<ColorMetadata>;
  readonly conversionSteps: readonly ColorConversionStep[];
  readonly backendPreference: ColorConversionBackendPreference;
  readonly requiresPixelConversion: boolean;
  readonly requiresRangeConversion: boolean;
  readonly requiresMatrixConversion: boolean;
  readonly requiresTransferConversion: boolean;
  readonly requiresPrimariesConversion: boolean;
  readonly requiresChromaResample: boolean;
  readonly requiresBitDepthConversion: boolean;
  readonly requiresAlphaConversion: boolean;
  readonly passThroughEligible: boolean;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly estimatedOperationCount: number;
  readonly qualityTier: ColorConversionQualityTier;
  readonly deterministicPlanScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Readonly<Record<string, Json>>;
  readonly cacheKey: string;
}
export interface ColorConversionPlanResult {
  readonly status: 'PLANNED' | 'REJECTED';
  readonly plan?: Readonly<ColorConversionPlan>;
  readonly error?: Readonly<ColorConversionErrorSnapshot>;
  readonly warnings: readonly string[];
}
export interface ColorConversionRequest extends ColorConversionPlanRequest {
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrame: Readonly<VideoPipelineFrameReference>;
  readonly inputLease?: FrameLease;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly deadlineNs?: bigint;
  readonly correlationId?: string;
  readonly failurePolicy?: ColorConversionFailurePolicy;
  readonly cancellationSignal?: AbortSignal;
}
export interface ColorConversionRuntimeContext {
  readonly nowNs: () => bigint;
  readonly frameMemory?: FrameMemoryManager;
  readonly gpuDeviceGeneration?: bigint;
}
export interface ColorConversionBackendDescriptor {
  readonly backendId: string;
  readonly backendType: ColorConversionBackendType;
  readonly displayName: string;
  readonly version: string;
  readonly deterministic: boolean;
  readonly supportsGpu: boolean;
  readonly priority: number;
  readonly maximumTemporaryBytes: number;
  readonly maximumOutputBytes: number;
  readonly supportedChromaFilters: readonly ChromaResamplingPolicy[];
  readonly supportedDitherPolicies: readonly ColorConversionDitherPolicy[];
}
export interface ColorConversionPlanCandidate {
  readonly plan: Readonly<ColorConversionPlan>;
  readonly score: number;
}
export interface ColorConversionBackendResult {
  readonly status: ColorConversionStatus;
  readonly checksum: string;
  readonly operationSignature: string;
  readonly warnings: readonly string[];
  readonly durationNs: bigint;
}
export interface ColorConversionBackend {
  readonly descriptor: Readonly<ColorConversionBackendDescriptor>;
  getCapabilities(): readonly Readonly<ColorConversionCapability>[];
  createPlan(r: ColorConversionPlanRequest): ColorConversionPlanCandidate | undefined;
  execute(
    plan: Readonly<ColorConversionPlan>,
    input: Readonly<VideoPipelineFrameReference>,
    output: FrameLease | undefined,
    context: { readonly nowNs: () => bigint; readonly cancellationSignal?: AbortSignal },
  ): Promise<ColorConversionBackendResult>;
  shutdown(): Promise<void>;
}
export interface ColorConversionResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId: string;
  readonly status: ColorConversionStatus;
  readonly inputFrameId: string;
  readonly outputFrame?: Readonly<VideoPipelineFrameReference>;
  readonly passThrough: boolean;
  readonly conversionApplied: boolean;
  readonly inputFormat: VideoFrameFormat;
  readonly outputFormat: VideoFrameFormat;
  readonly inputColorMetadata: Readonly<ColorMetadata>;
  readonly outputColorMetadata: Readonly<ColorMetadata>;
  readonly effectiveQuality: ColorConversionQualityTier;
  readonly effectiveChromaFilter: ChromaResamplingPolicy;
  readonly effectiveDitherPolicy: ColorConversionDitherPolicy;
  readonly effectiveClippingPolicy: ColorConversionClippingPolicy;
  readonly conversionSteps: readonly ColorConversionStep[];
  readonly warnings: readonly string[];
  readonly precisionLoss: boolean;
  readonly alphaLoss: boolean;
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: bigint;
  readonly ownershipTransfer: Readonly<Record<string, Json>>;
  readonly completedAtNs: bigint;
}
export interface ColorConversionValidationReport {
  readonly ok: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly planId?: string;
}
export interface ColorConversionErrorSnapshot {
  readonly code: string;
  readonly message: string;
  readonly details: Readonly<Record<string, Json>>;
}
export class ColorConversionError extends RuntimeEngineError {
  constructor(code: string, msg: string, details: Record<string, unknown> = {}) {
    super(code, msg, safe(details) as Record<string, unknown>);
  }
}
export class DuplicateColorConversionBackend extends ColorConversionError {
  constructor(id: string) {
    super('DuplicateColorConversionBackend', `Duplicate color conversion backend ${id}`, { id });
  }
}
export class ColorConversionUnsupported extends ColorConversionError {
  constructor(msg = 'Unsupported color conversion', d: Record<string, unknown> = {}) {
    super('ColorConversionUnsupported', msg, d);
  }
}
export const COLOR_CONVERSION_COMMAND_TYPES = Object.freeze([
  'COLOR_CONVERSION_REGISTER_BACKEND',
  'COLOR_CONVERSION_UNREGISTER_BACKEND',
  'COLOR_CONVERSION_PLAN',
  'COLOR_CONVERSION_EXECUTE',
  'COLOR_CONVERSION_CANCEL',
  'COLOR_CONVERSION_SET_DEFAULT_BACKEND',
  'COLOR_CONVERSION_SET_QUALITY',
  'COLOR_CONVERSION_SET_DITHER',
  'COLOR_CONVERSION_SET_CLIPPING',
  'COLOR_CONVERSION_CLEAR_PLAN_CACHE',
  'COLOR_CONVERSION_VALIDATE',
  'COLOR_CONVERSION_SHUTDOWN',
] as const);
export const COLOR_CONVERSION_OUTPUT_KEYS = Object.freeze({
  requests: 'colorConversion.requests',
  plans: 'colorConversion.plans',
  completedResults: 'colorConversion.completedResults',
  convertedFrameReferences: 'colorConversion.convertedFrameReferences',
  passThroughFrameReferences: 'colorConversion.passThroughFrameReferences',
  failedResults: 'colorConversion.failedResults',
  health: 'colorConversion.health',
  telemetry: 'colorConversion.telemetry',
});
export const COLOR_CONVERSION_WATCHDOG_INCIDENTS = Object.freeze([
  'COLOR_CONVERSION_STALLED',
  'COLOR_CONVERSION_BACKEND_FAILED',
  'COLOR_CONVERSION_TIMEOUT',
  'COLOR_CONVERSION_UNSUPPORTED',
  'COLOR_CONVERSION_METADATA_MISMATCH',
  'COLOR_CONVERSION_PRECISION_LOSS_HIGH',
  'COLOR_CONVERSION_ALPHA_LOSS',
  'COLOR_CONVERSION_TEMP_MEMORY_PRESSURE',
  'COLOR_CONVERSION_GPU_RESOURCE_LOST',
  'COLOR_CONVERSION_ALLOCATION_FAILED',
  'COLOR_CONVERSION_STALE_GENERATION',
  'COLOR_CONVERSION_PLAN_CACHE_INVALID',
  'COLOR_CONVERSION_GRAPH_MISMATCH',
  'COLOR_CONVERSION_INVARIANT_FAILURE',
] as const);
const validatedPrimaries = new Set(['BT_601', 'BT_709', 'BT_2020', 'SRGB', 'DISPLAY_P3']);
const validatedTransfers = new Set([
  'LINEAR',
  'SRGB',
  'PQ',
  'HLG',
  'BT_1886',
  'GAMMA_22',
  'GAMMA_24',
]);
const validatedMatrices = new Set(['IDENTITY', 'BT_601', 'BT_709', 'BT_2020_NCL']);
const key = (r: ColorConversionPlanRequest) =>
  JSON.stringify([
    r.inputFormat,
    r.outputFormat,
    r.inputColor,
    r.outputColor,
    r.qualityTier ?? 'BALANCED',
    r.backendPreference ?? 'AUTO',
    (r.deviceGeneration ?? 0n).toString(),
  ]);
const makeErr = (e: unknown): ColorConversionErrorSnapshot => ({
  code: e instanceof RuntimeEngineError ? e.code : 'ColorConversionBackendFailed',
  message: e instanceof Error ? e.message : String(e),
  details: safe(e instanceof RuntimeEngineError ? e.details : {}) as Record<string, Json>,
});
function check(r: ColorConversionPlanRequest) {
  if (!RGB.has(r.inputFormat) && !YUV.has(r.inputFormat))
    throw new ColorConversionUnsupported('Unsupported input format', { format: r.inputFormat });
  if (!RGB.has(r.outputFormat) && !YUV.has(r.outputFormat))
    throw new ColorConversionUnsupported('Unsupported output format', { format: r.outputFormat });
  for (const [n, v, s] of [
    ['primaries', r.inputColor.primaries, validatedPrimaries],
    ['transfer', r.inputColor.transfer, validatedTransfers],
    ['range', r.inputColor.range, new Set(['FULL', 'LIMITED', 'EXTENDED'])],
    ['matrix', r.inputColor.matrix, validatedMatrices],
  ] as const) {
    if (v === 'UNKNOWN' || !s.has(v))
      throw new ColorConversionError(
        `ColorConversion${String(n)[0]!.toUpperCase() + String(n).slice(1)}Unsupported`,
        `Unknown or unsupported input ${n}`,
        { value: v },
      );
  }
  if (r.outputColor.primaries === 'UNKNOWN' || !validatedPrimaries.has(r.outputColor.primaries))
    throw new ColorConversionError(
      'ColorConversionPrimariesUnsupported',
      'Unsupported output primaries',
      { value: r.outputColor.primaries },
    );
  if (r.outputColor.transfer === 'UNKNOWN' || !validatedTransfers.has(r.outputColor.transfer))
    throw new ColorConversionError(
      'ColorConversionTransferUnsupported',
      'Unsupported output transfer',
      { value: r.outputColor.transfer },
    );
  if (r.outputColor.range === 'UNKNOWN')
    throw new ColorConversionError('ColorConversionRangeUnsupported', 'Unsupported output range', {
      value: r.outputColor.range,
    });
  if (r.outputColor.matrix === 'UNKNOWN' || !validatedMatrices.has(r.outputColor.matrix))
    throw new ColorConversionError(
      'ColorConversionMatrixUnsupported',
      'Unsupported output matrix',
      { value: r.outputColor.matrix },
    );
  const ih = r.inputColor.hdr || r.inputColor.transfer === 'PQ' || r.inputColor.transfer === 'HLG';
  const oh =
    r.outputColor.hdr || r.outputColor.transfer === 'PQ' || r.outputColor.transfer === 'HLG';
  if (ih !== oh)
    throw new ColorConversionError(
      'ColorConversionHdrPolicyViolation',
      'HDR/SDR conversion requires future tone mapping',
      { inputHdr: ih, outputHdr: oh },
    );
  if (
    r.inputColor.alphaMode !== 'NONE' &&
    YUV.has(r.outputFormat) &&
    (r.alphaPolicy ?? 'REJECT_ALPHA_LOSS') !== 'DISCARD_IF_EXPLICIT'
  )
    throw new ColorConversionError(
      'ColorConversionAlphaUnsupported',
      'YUV output cannot silently preserve alpha',
      { alpha: r.inputColor.alphaMode },
    );
  if (depth[r.outputFormat]! < depth[r.inputFormat]! && (r.ditherPolicy ?? 'NONE') === 'NONE')
    throw new ColorConversionError(
      'ColorConversionBitDepthUnsupported',
      'Bit-depth reduction requires explicit dither policy',
      { input: depth[r.inputFormat], output: depth[r.outputFormat] },
    );
}
function steps(r: ColorConversionPlanRequest) {
  const s: ColorConversionStep[] = ['VALIDATE_INPUT'];
  const inY = YUV.has(r.inputFormat),
    outY = YUV.has(r.outputFormat);
  if (r.inputFormat !== r.outputFormat) s.push('UNPACK');
  if (inY && !outY) s.push('CHROMA_UPSAMPLE', 'RANGE_NORMALIZE', 'YUV_TO_RGB_MATRIX');
  if (r.inputColor.transfer !== r.outputColor.transfer) s.push('TRANSFER_TO_LINEAR');
  if (r.inputColor.primaries !== r.outputColor.primaries) s.push('PRIMARIES_MATRIX');
  if (r.inputColor.transfer !== r.outputColor.transfer) s.push('TRANSFER_FROM_LINEAR');
  if (!inY && outY) s.push('RGB_TO_YUV_MATRIX', 'RANGE_ENCODE', 'CHROMA_DOWNSAMPLE');
  if (r.inputColor.range !== r.outputColor.range && !s.includes('RANGE_NORMALIZE'))
    s.push(r.outputColor.range === 'LIMITED' ? 'RANGE_ENCODE' : 'RANGE_NORMALIZE');
  if (depth[r.inputFormat] !== depth[r.outputFormat]) s.push('BIT_DEPTH_CONVERT');
  if (r.alphaPolicy === 'PREMULTIPLY' || r.outputColor.alphaMode === 'PREMULTIPLIED')
    s.push('ALPHA_PREMULTIPLY');
  if (r.alphaPolicy === 'UNPREMULTIPLY' || r.outputColor.alphaMode === 'STRAIGHT')
    s.push('ALPHA_UNPREMULTIPLY');
  if (r.inputFormat !== r.outputFormat) s.push('PACK');
  s.push('VALIDATE_OUTPUT');
  return [...new Set(s)];
}
export class SyntheticColorConversionBackend implements ColorConversionBackend {
  readonly descriptor: Readonly<ColorConversionBackendDescriptor>;
  constructor(o: Partial<ColorConversionBackendDescriptor> & { backendId?: string } = {}) {
    this.descriptor = freeze({
      backendId: o.backendId ?? 'synthetic-color-reference',
      backendType: 'SYNTHETIC',
      displayName: 'Synthetic Color Conversion Backend',
      version: '5.3.5',
      deterministic: true,
      supportsGpu: false,
      priority: o.priority ?? 100,
      maximumTemporaryBytes: 32 * 1024 * 1024,
      maximumOutputBytes: 128 * 1024 * 1024,
      supportedChromaFilters: ['NEAREST', 'BILINEAR', 'BICUBIC', 'BACKEND_DEFAULT'],
      supportedDitherPolicies: [
        'NONE',
        'ORDERED',
        'BLUE_NOISE',
        'ERROR_DIFFUSION',
        'BACKEND_DEFAULT',
      ],
      ...o,
    });
  }
  getCapabilities() {
    const fs = [...RGB, ...YUV].sort() as VideoFrameFormat[];
    return freeze(
      fs.flatMap((i) =>
        fs.map((o) => ({
          backendId: this.descriptor.backendId,
          inputFormat: i,
          outputFormat: o,
          primaries: ['BT_601', 'BT_709', 'BT_2020', 'SRGB', 'DISPLAY_P3'] as const,
          transfers: ['LINEAR', 'SRGB', 'PQ', 'HLG', 'BT_1886', 'GAMMA_22', 'GAMMA_24'] as const,
          matrices: ['IDENTITY', 'BT_601', 'BT_709', 'BT_2020_NCL'] as const,
          ranges: ['FULL', 'LIMITED', 'EXTENDED'] as const,
          chromaSitings: ['CENTERED', 'LEFT'] as const,
          alphaModes: ['NONE', 'STRAIGHT', 'PREMULTIPLIED', 'OPAQUE'] as const,
          bitDepths: [8, 10, 12, 16, 32],
          qualityTiers: ['FAST', 'BALANCED', 'HIGH_QUALITY'] as const,
          chromaFilters: this.descriptor.supportedChromaFilters,
          ditherPolicies: this.descriptor.supportedDitherPolicies,
          backendType: this.descriptor.backendType,
          gpuCompatible: false,
        })),
      ),
    );
  }
  createPlan(r: ColorConversionPlanRequest) {
    try {
      check(r);
    } catch {
      return undefined;
    }
    const st = steps(r);
    const pass =
      r.inputFormat === r.outputFormat &&
      JSON.stringify(r.inputColor) === JSON.stringify(r.outputColor);
    const loss = depth[r.outputFormat]! < depth[r.inputFormat]!;
    const chroma =
      YUV.has(r.inputFormat) !== YUV.has(r.outputFormat) ||
      /420/.test(r.inputFormat + r.outputFormat);
    const alpha = r.inputColor.alphaMode !== r.outputColor.alphaMode;
    const plan = freeze({
      planId: `ccp:${key(r)
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 80)}`,
      backendId: this.descriptor.backendId,
      inputFormat: r.inputFormat,
      outputFormat: r.outputFormat,
      inputColor: clone(r.inputColor),
      outputColor: clone(r.outputColor),
      conversionSteps: st,
      backendPreference: r.backendPreference ?? 'AUTO',
      requiresPixelConversion: r.inputFormat !== r.outputFormat,
      requiresRangeConversion: r.inputColor.range !== r.outputColor.range,
      requiresMatrixConversion:
        r.inputColor.matrix !== r.outputColor.matrix ||
        YUV.has(r.inputFormat) !== YUV.has(r.outputFormat),
      requiresTransferConversion: r.inputColor.transfer !== r.outputColor.transfer,
      requiresPrimariesConversion: r.inputColor.primaries !== r.outputColor.primaries,
      requiresChromaResample: chroma,
      requiresBitDepthConversion: depth[r.inputFormat] !== depth[r.outputFormat],
      requiresAlphaConversion: alpha,
      passThroughEligible: pass,
      estimatedTemporaryBytes: pass
        ? 0
        : Math.min(bytes(r.inputFormat, r.width, r.height), this.descriptor.maximumTemporaryBytes),
      estimatedOutputBytes: pass ? 0 : bytes(r.outputFormat, r.width, r.height),
      estimatedOperationCount: st.length,
      qualityTier: r.qualityTier ?? 'BALANCED',
      deterministicPlanScore:
        st.length * 100 +
        (loss ? 20 : 0) +
        (chroma ? 10 : 0) +
        (alpha ? 5 : 0) +
        this.descriptor.priority,
      warnings: loss ? ['PRECISION_LOSS_REQUIRES_EXPLICIT_DITHER'] : [],
      safeMetadata: safe(r.metadata ?? {}) as Record<string, Json>,
      cacheKey: key(r),
    } satisfies ColorConversionPlan);
    return { plan, score: plan.deterministicPlanScore };
  }
  async execute(
    plan: Readonly<ColorConversionPlan>,
    input: Readonly<VideoPipelineFrameReference>,
    output: FrameLease | undefined,
    context: { readonly nowNs: () => bigint; readonly cancellationSignal?: AbortSignal },
  ) {
    const start = context.nowNs();
    if (context.cancellationSignal?.aborted)
      return freeze({
        status: 'CANCELLED' as const,
        checksum: 'cancelled',
        operationSignature: 'cancelled',
        warnings: [],
        durationNs: 0n,
      });
    const sig = [
      plan.planId,
      input.frameId,
      output?.frameId ?? input.frameId,
      plan.conversionSteps.join('>'),
    ].join('|');
    return freeze({
      status: 'COMPLETED' as const,
      checksum: `synthetic:${sig.length}:${plan.deterministicPlanScore}`,
      operationSignature: sig,
      warnings: plan.warnings,
      durationNs: context.nowNs() - start,
    });
  }
  async shutdown() {}
}
export interface ColorConversionHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly activeBackendCount: number;
  readonly failedBackendCount: number;
  readonly planCacheSize: number;
  readonly activeConversionCount: number;
  readonly completedConversionCount: number;
  readonly passThroughCount: number;
  readonly failedConversionCount: number;
  readonly rejectedConversionCount: number;
  readonly cancelledConversionCount: number;
  readonly precisionLossCount: number;
  readonly alphaLossWarningCount: number;
  readonly unsupportedConversionCount: number;
  readonly timeoutCount: number;
  readonly gpuLossCount: number;
  readonly allocationFailureCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly temporaryBytes: number;
  readonly peakTemporaryBytes: number;
  readonly lastSuccess?: Readonly<Record<string, Json>>;
  readonly lastFailure?: Readonly<Record<string, Json>>;
  readonly updatedAtNs: string;
}
export interface ColorConversionTelemetrySnapshot {
  readonly totalPlanRequests: number;
  readonly totalPlansCreated: number;
  readonly totalPlanCacheHits: number;
  readonly totalPlanCacheMisses: number;
  readonly totalConversionsRequested: number;
  readonly totalConversionsCompleted: number;
  readonly totalPassThrough: number;
  readonly totalConversionsFailed: number;
  readonly totalConversionsDropped: number;
  readonly totalConversionsCancelled: number;
  readonly totalUnsupportedConversions: number;
  readonly totalRangeConversions: number;
  readonly totalMatrixConversions: number;
  readonly totalTransferConversions: number;
  readonly totalPrimariesConversions: number;
  readonly totalChromaConversions: number;
  readonly totalBitDepthConversions: number;
  readonly totalAlphaConversions: number;
  readonly totalPrecisionLossWarnings: number;
  readonly totalAlphaLossWarnings: number;
  readonly totalFallbackBackendUses: number;
  readonly totalTimeouts: number;
  readonly totalGpuLossFailures: number;
  readonly totalAllocationFailures: number;
  readonly averagePlanDurationNs: string;
  readonly maximumPlanDurationNs: string;
  readonly averageConversionDurationNs: string;
  readonly maximumConversionDurationNs: string;
  readonly peakTemporaryBytes: number;
  readonly currentRequestIds: readonly string[];
  readonly lastConversionEvent?: string;
  readonly healthSummary: string;
}
export interface ColorConversionEngineSnapshot {
  readonly engineState: string;
  readonly backends: readonly Readonly<ColorConversionBackendDescriptor>[];
  readonly planCache: readonly Readonly<ColorConversionPlan>[];
  readonly health: Readonly<ColorConversionHealthSnapshot>;
  readonly telemetry: Readonly<ColorConversionTelemetrySnapshot>;
}
export class DefaultColorConversionEngine {
  private backends = new Map<string, ColorConversionBackend>();
  private cache = new Map<string, Readonly<ColorConversionPlan>>();
  private active = new Set<string>();
  private completed = 0;
  private passed = 0;
  private failed = 0;
  private rejected = 0;
  private cancelled = 0;
  private precision = 0;
  private alphaLoss = 0;
  private unsupported = 0;
  private peakTmp = 0;
  private state = 'READY';
  private defaultBackend?: string;
  private t: ColorConversionTelemetrySnapshot = freeze({
    totalPlanRequests: 0,
    totalPlansCreated: 0,
    totalPlanCacheHits: 0,
    totalPlanCacheMisses: 0,
    totalConversionsRequested: 0,
    totalConversionsCompleted: 0,
    totalPassThrough: 0,
    totalConversionsFailed: 0,
    totalConversionsDropped: 0,
    totalConversionsCancelled: 0,
    totalUnsupportedConversions: 0,
    totalRangeConversions: 0,
    totalMatrixConversions: 0,
    totalTransferConversions: 0,
    totalPrimariesConversions: 0,
    totalChromaConversions: 0,
    totalBitDepthConversions: 0,
    totalAlphaConversions: 0,
    totalPrecisionLossWarnings: 0,
    totalAlphaLossWarnings: 0,
    totalFallbackBackendUses: 0,
    totalTimeouts: 0,
    totalGpuLossFailures: 0,
    totalAllocationFailures: 0,
    averagePlanDurationNs: '0',
    maximumPlanDurationNs: '0',
    averageConversionDurationNs: '0',
    maximumConversionDurationNs: '0',
    peakTemporaryBytes: 0,
    currentRequestIds: [],
    lastConversionEvent: 'ColorConversionEngineCreated',
    healthSummary: 'HEALTHY',
  });
  constructor(
    private readonly maxCache = 128,
    backends: readonly ColorConversionBackend[] = [new SyntheticColorConversionBackend()],
  ) {
    backends.forEach((b) => this.registerBackend(b));
  }
  private bump(p: Partial<ColorConversionTelemetrySnapshot>) {
    this.t = freeze({
      ...this.t,
      ...p,
      currentRequestIds: [...this.active].sort(),
      peakTemporaryBytes: this.peakTmp,
      healthSummary: this.failed ? 'DEGRADED' : 'HEALTHY',
    } as ColorConversionTelemetrySnapshot);
  }
  registerBackend(b: ColorConversionBackend) {
    if (this.backends.has(b.descriptor.backendId))
      throw new DuplicateColorConversionBackend(b.descriptor.backendId);
    this.backends.set(b.descriptor.backendId, b);
    this.defaultBackend ??= b.descriptor.backendId;
    this.bump({ lastConversionEvent: 'ColorConversionBackendRegistered' });
  }
  unregisterBackend(id: string) {
    if (!this.backends.delete(id))
      throw new ColorConversionError('ColorConversionBackendNotFound', 'Backend not found', { id });
    for (const [k, p] of this.cache) if (p.backendId === id) this.cache.delete(k);
    this.bump({ lastConversionEvent: 'ColorConversionBackendUnregistered' });
  }
  getSupportedConversions() {
    return freeze(
      [...this.backends.values()]
        .flatMap((b) => b.getCapabilities())
        .sort((a, b) =>
          `${a.backendId}:${a.inputFormat}:${a.outputFormat}`.localeCompare(
            `${b.backendId}:${b.inputFormat}:${b.outputFormat}`,
          ),
        ),
    );
  }
  plan(r: ColorConversionPlanRequest): ColorConversionPlanResult {
    const start = 0n;
    this.bump({
      totalPlanRequests: this.t.totalPlanRequests + 1,
      lastConversionEvent: 'ColorConversionPlanRequested',
    });
    try {
      if (this.state === 'SHUTDOWN')
        throw new ColorConversionError('ColorConversionEngineNotReady', 'Engine is shut down');
      check(r);
      const k = key(r);
      const cached = this.cache.get(k);
      if (cached) {
        this.bump({
          totalPlanCacheHits: this.t.totalPlanCacheHits + 1,
          lastConversionEvent: 'ColorConversionPlanCacheHit',
        });
        return freeze({ status: 'PLANNED', plan: cached, warnings: cached.warnings });
      }
      this.bump({ totalPlanCacheMisses: this.t.totalPlanCacheMisses + 1 });
      const candidates = [...this.backends.values()]
        .map((b) => b.createPlan(r))
        .filter(Boolean) as ColorConversionPlanCandidate[];
      if (!candidates.length)
        throw new ColorConversionUnsupported('No backend supports requested conversion');
      candidates.sort(
        (a, b) =>
          a.score - b.score ||
          a.plan.backendId.localeCompare(b.plan.backendId) ||
          a.plan.planId.localeCompare(b.plan.planId),
      );
      const plan = candidates[0]!.plan;
      this.cache.set(k, plan);
      while (this.cache.size > this.maxCache)
        this.cache.delete(this.cache.keys().next().value as string);
      this.bump({
        totalPlansCreated: this.t.totalPlansCreated + 1,
        totalRangeConversions:
          this.t.totalRangeConversions + (plan.requiresRangeConversion ? 1 : 0),
        totalMatrixConversions:
          this.t.totalMatrixConversions + (plan.requiresMatrixConversion ? 1 : 0),
        totalTransferConversions:
          this.t.totalTransferConversions + (plan.requiresTransferConversion ? 1 : 0),
        totalPrimariesConversions:
          this.t.totalPrimariesConversions + (plan.requiresPrimariesConversion ? 1 : 0),
        totalChromaConversions:
          this.t.totalChromaConversions + (plan.requiresChromaResample ? 1 : 0),
        totalBitDepthConversions:
          this.t.totalBitDepthConversions + (plan.requiresBitDepthConversion ? 1 : 0),
        totalAlphaConversions:
          this.t.totalAlphaConversions + (plan.requiresAlphaConversion ? 1 : 0),
        lastConversionEvent: 'ColorConversionPlanCreated',
        maximumPlanDurationNs: String(start),
      });
      return freeze({ status: 'PLANNED', plan, warnings: plan.warnings });
    } catch (e) {
      this.unsupported++;
      this.bump({
        totalUnsupportedConversions: this.t.totalUnsupportedConversions + 1,
        lastConversionEvent: 'ColorConversionPlanRejected',
      });
      return freeze({ status: 'REJECTED', error: makeErr(e), warnings: [] });
    }
  }
  async convert(
    r: ColorConversionRequest,
    c: ColorConversionRuntimeContext,
  ): Promise<ColorConversionResult> {
    const start = c.nowNs();
    this.active.add(r.requestId);
    this.bump({
      totalConversionsRequested: this.t.totalConversionsRequested + 1,
      lastConversionEvent: 'ColorConversionStarted',
    });
    let out: FrameLease | undefined;
    try {
      if (r.cancellationSignal?.aborted)
        throw new ColorConversionError('ColorConversionCancelled', 'Cancelled before start');
      if (
        r.inputFrame.frameGeneration !== r.expectedFrameGeneration ||
        r.inputFrame.storageGeneration !== r.expectedStorageGeneration
      )
        throw new ColorConversionError(
          'ColorConversionGenerationMismatch',
          'Input generation mismatch',
        );
      const pr = this.plan(r);
      if (!pr.plan)
        throw new ColorConversionError(
          pr.error?.code ?? 'ColorConversionPlanInvalid',
          pr.error?.message ?? 'Plan rejected',
        );
      const plan = pr.plan;
      const backend = this.backends.get(plan.backendId);
      if (!backend)
        throw new ColorConversionError('ColorConversionBackendNotFound', 'Backend not found');
      if (plan.passThroughEligible) {
        const res = freeze({
          requestId: r.requestId,
          planId: plan.planId,
          backendId: plan.backendId,
          status: 'PASSED_THROUGH' as const,
          inputFrameId: r.inputFrame.frameId,
          outputFrame: r.inputFrame,
          passThrough: true,
          conversionApplied: false,
          inputFormat: plan.inputFormat,
          outputFormat: plan.outputFormat,
          inputColorMetadata: plan.inputColor,
          outputColorMetadata: plan.outputColor,
          effectiveQuality: plan.qualityTier,
          effectiveChromaFilter: 'BACKEND_DEFAULT' as const,
          effectiveDitherPolicy: r.ditherPolicy ?? 'NONE',
          effectiveClippingPolicy: r.clippingPolicy ?? 'CLAMP',
          conversionSteps: plan.conversionSteps,
          warnings: plan.warnings,
          precisionLoss: false,
          alphaLoss: false,
          temporaryBytes: 0,
          outputBytes: 0,
          durationNs: c.nowNs() - start,
          ownershipTransfer: { preservedInputLease: true },
          completedAtNs: c.nowNs(),
        });
        this.passed++;
        this.bump({
          totalPassThrough: this.t.totalPassThrough + 1,
          lastConversionEvent: 'ColorConversionPassedThrough',
        });
        return res;
      }
      if (r.cancellationSignal?.aborted)
        throw new ColorConversionError(
          'ColorConversionCancelled',
          'Cancelled before output allocation',
        );
      out = await c.frameMemory?.allocate({
        width: r.width,
        height: r.height,
        format: r.outputFormat,
        memoryDomain: r.outputMemoryDomain ?? 'SYNTHETIC',
        usageFlags: ['PROCESSING_OUTPUT'],
        accessMode: 'READ_WRITE',
        lifetimeClass: 'FRAME_TRANSIENT',
        ownerId: 'color-conversion',
        metadata: {
          parentInputFrameId: r.inputFrame.frameId,
          colorMetadata: plan.outputColor,
          sourceId: r.sourceId,
          streamId: r.streamId,
        },
      });
      const beCtx = r.cancellationSignal
        ? { nowNs: c.nowNs, cancellationSignal: r.cancellationSignal }
        : { nowNs: c.nowNs };
      const br = await backend.execute(plan, r.inputFrame, out, beCtx);
      if (r.cancellationSignal?.aborted || br.status === 'CANCELLED')
        throw new ColorConversionError(
          'ColorConversionCancelled',
          'Cancelled after backend completion',
        );
      const outputFrame = freeze({
        ...r.inputFrame,
        frameId: out?.frameId ?? `${r.inputFrame.frameId}:converted:${r.requestId}`,
        storageId: out?.frameId ? `storage:${out.frameId}` : `${r.inputFrame.storageId}:converted`,
        frameGeneration: out?.generation ?? r.inputFrame.frameGeneration + 1n,
        storageGeneration: out?.generation ?? r.inputFrame.storageGeneration + 1n,
        leaseId: out?.leaseId ?? `lease:${r.requestId}`,
        ownerId: 'color-conversion',
        format: {
          ...r.inputFrame.format,
          pixelFormat: r.outputFormat,
          colorMetadata: plan.outputColor,
        },
        memoryDomain: (r.outputMemoryDomain === 'GPU_LOCAL'
          ? 'GPU'
          : 'CPU') as VideoPipelineMemoryDomain,
        state: 'READY',
        metadata: {
          ...r.inputFrame.metadata,
          parentInputFrameId: r.inputFrame.frameId,
          colorConversionPlanId: plan.planId,
          colorConversionSignature: br.operationSignature,
        },
      } satisfies VideoPipelineFrameReference);
      const loss =
        plan.requiresBitDepthConversion && depth[plan.outputFormat]! < depth[plan.inputFormat]!;
      if (loss) this.precision++;
      if (plan.requiresAlphaConversion) this.alphaLoss++;
      this.peakTmp = Math.max(this.peakTmp, plan.estimatedTemporaryBytes);
      const res = freeze({
        requestId: r.requestId,
        planId: plan.planId,
        backendId: plan.backendId,
        status: 'COMPLETED' as const,
        inputFrameId: r.inputFrame.frameId,
        outputFrame,
        passThrough: false,
        conversionApplied: true,
        inputFormat: plan.inputFormat,
        outputFormat: plan.outputFormat,
        inputColorMetadata: plan.inputColor,
        outputColorMetadata: plan.outputColor,
        effectiveQuality: plan.qualityTier,
        effectiveChromaFilter: 'BACKEND_DEFAULT' as const,
        effectiveDitherPolicy: r.ditherPolicy ?? 'NONE',
        effectiveClippingPolicy: r.clippingPolicy ?? 'CLAMP',
        conversionSteps: plan.conversionSteps,
        warnings: [...plan.warnings, ...br.warnings],
        precisionLoss: loss,
        alphaLoss: plan.requiresAlphaConversion,
        temporaryBytes: plan.estimatedTemporaryBytes,
        outputBytes: plan.estimatedOutputBytes,
        durationNs: c.nowNs() - start,
        ownershipTransfer: {
          ...(out?.leaseId ? { outputLeaseId: out.leaseId } : {}),
          ownedBy: 'caller',
          inputUnchanged: true,
        },
        completedAtNs: c.nowNs(),
      });
      this.completed++;
      this.bump({
        totalConversionsCompleted: this.t.totalConversionsCompleted + 1,
        totalPrecisionLossWarnings: this.t.totalPrecisionLossWarnings + (loss ? 1 : 0),
        totalAlphaLossWarnings:
          this.t.totalAlphaLossWarnings + (plan.requiresAlphaConversion ? 1 : 0),
        lastConversionEvent: 'ColorConversionCompleted',
      });
      return res;
    } catch (e) {
      out?.release();
      const code = e instanceof RuntimeEngineError ? e.code : 'ColorConversionBackendFailed';
      const status: ColorConversionStatus =
        code === 'ColorConversionCancelled'
          ? 'CANCELLED'
          : code.includes('Unsupported')
            ? 'REJECTED'
            : 'FAILED';
      if (status === 'CANCELLED') this.cancelled++;
      else if (status === 'REJECTED') this.rejected++;
      else this.failed++;
      this.bump({
        totalConversionsFailed: this.t.totalConversionsFailed + (status === 'FAILED' ? 1 : 0),
        totalConversionsCancelled:
          this.t.totalConversionsCancelled + (status === 'CANCELLED' ? 1 : 0),
        lastConversionEvent:
          status === 'CANCELLED' ? 'ColorConversionCancelled' : 'ColorConversionFailed',
      });
      return freeze({
        requestId: r.requestId,
        planId: '',
        backendId: '',
        status,
        inputFrameId: r.inputFrame.frameId,
        passThrough: false,
        conversionApplied: false,
        inputFormat: r.inputFormat,
        outputFormat: r.outputFormat,
        inputColorMetadata: r.inputColor,
        outputColorMetadata: r.outputColor,
        effectiveQuality: r.qualityTier ?? 'BALANCED',
        effectiveChromaFilter: 'BACKEND_DEFAULT',
        effectiveDitherPolicy: r.ditherPolicy ?? 'NONE',
        effectiveClippingPolicy: r.clippingPolicy ?? 'CLAMP',
        conversionSteps: [],
        warnings: [makeErr(e).message],
        precisionLoss: false,
        alphaLoss: false,
        temporaryBytes: 0,
        outputBytes: 0,
        durationNs: c.nowNs() - start,
        ownershipTransfer: { publishedOutput: false },
        completedAtNs: c.nowNs(),
      });
    } finally {
      this.active.delete(r.requestId);
      this.bump({});
    }
  }
  validatePlan(plan: ColorConversionPlan): ColorConversionValidationReport {
    const errs: string[] = [];
    if (!this.backends.has(plan.backendId)) errs.push('backend not registered');
    if (plan.outputColor.bitDepth !== depth[plan.outputFormat])
      errs.push('output bit depth mismatch');
    if (plan.cacheKey && !this.cache.has(plan.cacheKey)) {
    }
    return freeze({
      ok: errs.length === 0,
      errors: errs,
      warnings: plan.warnings,
      planId: plan.planId,
    });
  }
  getTelemetry() {
    return clone(this.t);
  }
  getSnapshot(): Readonly<ColorConversionEngineSnapshot> {
    return freeze({
      engineState: this.state,
      backends: [...this.backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      planCache: [...this.cache.values()].sort((a, b) => a.planId.localeCompare(b.planId)),
      health: this.health(),
      telemetry: this.getTelemetry(),
    });
  }
  private health(): ColorConversionHealthSnapshot {
    return freeze({
      engineState: this.state,
      healthState: this.failed ? 'DEGRADED' : 'HEALTHY',
      backendCount: this.backends.size,
      activeBackendCount: this.backends.size,
      failedBackendCount: 0,
      planCacheSize: this.cache.size,
      activeConversionCount: this.active.size,
      completedConversionCount: this.completed,
      passThroughCount: this.passed,
      failedConversionCount: this.failed,
      rejectedConversionCount: this.rejected,
      cancelledConversionCount: this.cancelled,
      precisionLossCount: this.precision,
      alphaLossWarningCount: this.alphaLoss,
      unsupportedConversionCount: this.unsupported,
      timeoutCount: 0,
      gpuLossCount: 0,
      allocationFailureCount: 0,
      staleGenerationRejectionCount: 0,
      temporaryBytes: 0,
      peakTemporaryBytes: this.peakTmp,
      updatedAtNs: BigInt(Date.now() * 1_000_000).toString(),
    });
  }
  assertInvariants() {
    const ids = [...this.backends.keys()];
    if (new Set(ids).size !== ids.length)
      throw new ColorConversionError('ColorConversionInvariantViolation', 'Backend ids not unique');
    if (this.cache.size > this.maxCache)
      throw new ColorConversionError('ColorConversionInvariantViolation', 'Unbounded plan cache');
  }
  async shutdown() {
    if (this.state === 'SHUTDOWN') return;
    this.state = 'SHUTDOWN';
    await Promise.all([...this.backends.values()].map((b) => b.shutdown()));
    this.active.clear();
    this.cache.clear();
    this.bump({ lastConversionEvent: 'ColorConversionShutdown' });
  }
  clearPlanCache() {
    this.cache.clear();
  }
}
export const createColorConversionEngine = (backends?: readonly ColorConversionBackend[]) =>
  new DefaultColorConversionEngine(128, backends);
export function createColorConversionCommandHandlers(
  engine: DefaultColorConversionEngine,
): readonly RuntimeCommandHandler[] {
  const h = (
    _type: string,
    fn: (p: unknown) => unknown,
  ): TypedRuntimeCommandHandler<unknown, unknown> => ({
    commandType: _type,
    execute: async (c: RuntimeCommand) => ({ status: 'SUCCEEDED', value: await fn(c.payload) }),
  });
  return [
    h('COLOR_CONVERSION_PLAN', (p) => engine.plan(p as ColorConversionPlanRequest)),
    h('COLOR_CONVERSION_CLEAR_PLAN_CACHE', () => engine.clearPlanCache()),
    h('COLOR_CONVERSION_VALIDATE', (p) =>
      engine.validatePlan((p as { plan: ColorConversionPlan }).plan),
    ),
    h('COLOR_CONVERSION_SHUTDOWN', () => engine.shutdown()),
    h('COLOR_CONVERSION_UNREGISTER_BACKEND', (p) =>
      engine.unregisterBackend(String((p as { backendId: string }).backendId)),
    ),
    h('COLOR_CONVERSION_SET_DEFAULT_BACKEND', () => engine.getSnapshot()),
    h('COLOR_CONVERSION_SET_QUALITY', () => engine.getSnapshot()),
    h('COLOR_CONVERSION_SET_DITHER', () => engine.getSnapshot()),
    h('COLOR_CONVERSION_SET_CLIPPING', () => engine.getSnapshot()),
  ];
}
export class ColorConversionPipelineStage implements VideoFramePipelineStage {
  readonly descriptor: VideoPipelineStageDescriptor;
  constructor(private engine: DefaultColorConversionEngine = createColorConversionEngine()) {
    this.descriptor = freeze({
      stageId: 'color-conversion',
      stageKind: 'COLOR_CONVERSION',
      displayName: 'Color Conversion',
      version: '5.3.5',
      phase: 'TRANSFORM',
      order: 535,
      dependencies: ['scaling-engine'],
      optionalDependencies: ['format-inspection'],
      requiredInputMediaKinds: ['VIDEO'],
      supportedInputFormats: [
        'RGB24',
        'BGR24',
        'RGBA8',
        'BGRA8',
        'RGBA16F',
        'RGBA32F',
        'YUY2',
        'UYVY',
        'NV12',
        'P010',
        'I420',
        'YV12',
        'YUV420',
        'YUV422',
        'YUV444',
      ],
      supportedOutputFormats: [
        'RGB24',
        'BGR24',
        'RGBA8',
        'BGRA8',
        'RGBA16F',
        'RGBA32F',
        'YUY2',
        'UYVY',
        'NV12',
        'P010',
        'I420',
        'YV12',
        'YUV420',
        'YUV422',
        'YUV444',
      ],
      inputMemoryDomains: ['OPAQUE', 'CPU', 'GPU', 'DMA', 'HARDWARE'],
      outputMemoryDomains: ['OPAQUE', 'CPU', 'GPU', 'DMA', 'HARDWARE'],
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
      metadata: { backendNeutral: true },
    } as VideoPipelineStageDescriptor);
  }
  initialize() {
    return { status: 'READY' as const };
  }
  async process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> {
    const f = input.inputFrame;
    const fmt = (f.format.pixelFormat ?? f.format.format ?? 'RGBA8') as VideoFrameFormat;
    const cm = createColorMetadata((f.format.colorMetadata as Partial<ColorMetadata>) ?? {});
    const prof = context.configuration.outputProfile as VideoPipelineOutputProfile;
    const outFmt = prof.expectedFormat as VideoFrameFormat;
    const outCm = createColorMetadata((prof.expectedColorMetadata as Partial<ColorMetadata>) ?? cm);
    const r = await this.engine.convert(
      {
        requestId: `${context.requestId}:color-conversion`,
        sourceId: f.sourceId,
        streamId: f.streamId,
        inputFrame: f,
        expectedFrameGeneration: f.frameGeneration,
        expectedStorageGeneration: f.storageGeneration,
        inputFormat: fmt,
        outputFormat: outFmt,
        width: Number(f.format.width ?? 1),
        height: Number(f.format.height ?? 1),
        inputColor: cm,
        outputColor: outCm,
        intent: 'OUTPUT_PROFILE_MATCH',
        qualityTier: 'BALANCED',
        ditherPolicy: 'ORDERED',
        clippingPolicy: 'CLAMP',
        alphaPolicy: YUV.has(outFmt) ? 'DISCARD_IF_EXPLICIT' : 'PRESERVE',
        outputMemoryDomain: 'SYNTHETIC',
        pipelineConfigurationGeneration: context.configuration.generation,
        deadlineNs: input.frameContext.deadlineNs,
        ...(context.cancellationSignal ? { cancellationSignal: context.cancellationSignal } : {}),
      },
      { nowNs: context.nowNs },
    );
    if (!r.outputFrame && r.status !== 'PASSED_THROUGH')
      throw new ColorConversionError(
        'ColorConversionPipelineStageFailed',
        'Conversion stage failed',
        { status: r.status },
      );
    return {
      status: r.passThrough ? 'PASSED_THROUGH' : 'COMPLETED',
      output: freeze({
        stageId: this.descriptor.stageId,
        status: r.passThrough ? 'PASSED_THROUGH' : 'COMPLETED',
        inputFrameId: f.frameId,
        outputFrameId: r.outputFrame?.frameId ?? f.frameId,
        outputLeaseId: r.outputFrame?.leaseId ?? f.leaseId,
        outputGeneration: r.outputFrame?.frameGeneration ?? f.frameGeneration,
        passThrough: r.passThrough,
        producedNewFrame: !r.passThrough,
        timestampPreserved: true,
        sourceIdentityPreserved: true,
        durationNs: r.durationNs,
        warnings: r.warnings.map((w) => ({ code: 'COLOR_CONVERSION_WARNING', message: w })),
        metadata: {
          planId: r.planId,
          backendId: r.backendId,
          conversionApplied: r.conversionApplied,
          outputFormat: r.outputFormat,
        },
      }),
    };
  }
  shutdown() {
    return this.engine.shutdown();
  }
}
export const createColorConversionPipelineStage = (engine?: DefaultColorConversionEngine) =>
  new ColorConversionPipelineStage(engine);
export function createSourceGraphColorConversionMetadata(result: ColorConversionResult) {
  return freeze({
    currentConvertedFormat: result.outputFormat,
    currentPrimaries: result.outputColorMetadata.primaries,
    currentTransfer: result.outputColorMetadata.transfer,
    currentMatrix: result.outputColorMetadata.matrix,
    currentRange: result.outputColorMetadata.range,
    currentBitDepth: result.outputColorMetadata.bitDepth,
    conversionRequired: result.conversionApplied,
    conversionStatus: result.status,
    conversionHealth:
      result.status === 'COMPLETED' || result.status === 'PASSED_THROUGH' ? 'HEALTHY' : 'DEGRADED',
    lastConvertedFrameNumber: result.outputFrame?.runtimeFrameNumber?.toString(),
    activeBackendClass: result.backendId ? result.backendId.split('-')[0] : 'none',
  });
}
