import { RuntimeEngineError } from './execution-engine.js';
import type {
  FrameAllocationRequest,
  FrameLease,
  FrameMemoryManager,
  VideoFrameFormat,
} from './frame-memory.js';
import type {
  VideoFramePipelineStage,
  VideoPipelineFrameReference,
  VideoPipelineOutputProfile,
  VideoPipelineStageDescriptor,
  VideoPipelineStageInput,
  VideoPipelineStageResult,
  VideoPipelineStageRuntimeContext,
} from './video-frame-pipeline.js';

type Mutable<T> = { -readonly [P in keyof T]: T[P] };
type JsonSafe =
  string | number | boolean | null | readonly JsonSafe[] | { readonly [key: string]: JsonSafe };
const redactKey =
  /token|secret|password|credential|cookie|url|path|handle|pointer|native|device|lut/i;
const safe = (v: unknown, depth = 0): JsonSafe => {
  if (depth > 4) return '[Truncated]';
  if (v == null || typeof v === 'boolean' || typeof v === 'number')
    return Number.isFinite(v as number) ? (v as JsonSafe) : String(v);
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (typeof v === 'bigint') return v.toString();
  if (Array.isArray(v)) return v.slice(0, 32).map((x) => safe(x, depth + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, val]) => [k, redactKey.test(k) ? '[REDACTED]' : safe(val, depth + 1)]),
    );
  return String(v);
};
export const deepFreezeColorCorrection = <T>(value: T): Readonly<T> => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreezeColorCorrection(v);
  }
  return value as Readonly<T>;
};
const cloneFreeze = <T>(value: T): Readonly<T> => deepFreezeColorCorrection(structuredClone(value));
const ns = (n: bigint) => n.toString();
const nowDefault = () => BigInt(Date.now()) * 1000000n;

export type ColorCorrectionParameterPolicy =
  'REJECT_OUT_OF_RANGE' | 'CLAMP_TO_SUPPORTED_RANGE' | 'WARN_AND_CLAMP' | 'BACKEND_DEFAULT';
export type ColorCorrectionWorkingSpace =
  'LINEAR_RGB' | 'SCENE_LINEAR' | 'DISPLAY_REFERRED_RGB' | 'ACESCG' | 'BACKEND_NATIVE' | 'CUSTOM';
export type ColorCorrectionIntent =
  | 'SOURCE_NORMALIZATION'
  | 'CAMERA_MATCHING'
  | 'EXPOSURE_BALANCING'
  | 'WHITE_BALANCE'
  | 'LOOK_PREPARATION'
  | 'OUTPUT_COMPENSATION'
  | 'OPERATOR_ADJUSTMENT'
  | 'PRESET_APPLICATION'
  | 'CUSTOM';
export type ColorCorrectionQualityTier = 'FAST' | 'BALANCED' | 'HIGH_QUALITY' | 'REFERENCE';
export type ColorCorrectionAlphaPolicy =
  | 'PRESERVE'
  | 'CORRECT_RGB_ONLY'
  | 'CORRECT_PREMULTIPLIED_SAFE'
  | 'UNPREMULTIPLY_CORRECT_REPREMULTIPLY'
  | 'REJECT_ALPHA'
  | 'BACKEND_DEFAULT';
export type ColorCorrectionClampPolicy =
  | 'CLAMP_TO_LEGAL'
  | 'CLAMP_TO_FORMAT'
  | 'PRESERVE_EXTENDED'
  | 'FAIL_ON_OUT_OF_RANGE'
  | 'BACKEND_DEFAULT';
export type ColorCorrectionBackendType =
  'GPU_COMPUTE' | 'GPU_FRAGMENT' | 'CPU_SIMD' | 'CPU_REFERENCE' | 'PLATFORM_NATIVE' | 'SYNTHETIC';
export type ColorCorrectionStatus =
  'COMPLETED' | 'PASSED_THROUGH' | 'FAILED' | 'DROPPED' | 'CANCELLED' | 'REJECTED' | 'DEGRADED';
export type ColorCorrectionLutType =
  'LUT_1D' | 'LUT_3D' | 'CDL' | 'ASC_CDL' | 'ICC_PROFILE' | 'CUSTOM_LUT';
export type ColorCorrectionOperation =
  | 'VALIDATE_INPUT'
  | 'NORMALIZE_WORKING_REPRESENTATION'
  | 'EXPOSURE'
  | 'TEMPERATURE_TINT'
  | 'LIFT'
  | 'GAMMA'
  | 'GAIN'
  | 'SHADOWS'
  | 'MIDTONES'
  | 'HIGHLIGHTS'
  | 'CONTRAST'
  | 'BRIGHTNESS'
  | 'SATURATION'
  | 'HUE'
  | 'PER_CHANNEL_GAIN'
  | 'PER_CHANNEL_OFFSET'
  | 'BLACK_WHITE_LEVEL'
  | 'CLAMP_OR_EXTENDED_RANGE'
  | 'VALIDATE_OUTPUT';
export const COLOR_CORRECTION_OPERATION_ORDER: readonly ColorCorrectionOperation[] = Object.freeze([
  'VALIDATE_INPUT',
  'NORMALIZE_WORKING_REPRESENTATION',
  'EXPOSURE',
  'TEMPERATURE_TINT',
  'LIFT',
  'GAMMA',
  'GAIN',
  'SHADOWS',
  'MIDTONES',
  'HIGHLIGHTS',
  'CONTRAST',
  'BRIGHTNESS',
  'SATURATION',
  'HUE',
  'PER_CHANNEL_GAIN',
  'PER_CHANNEL_OFFSET',
  'BLACK_WHITE_LEVEL',
  'CLAMP_OR_EXTENDED_RANGE',
  'VALIDATE_OUTPUT',
]);

export interface ColorCorrectionParameters {
  readonly brightness?: number;
  readonly contrast?: number;
  readonly saturation?: number;
  readonly hueDegrees?: number;
  readonly exposureStops?: number;
  readonly gamma?: number;
  readonly temperatureKelvinOffset?: number;
  readonly tint?: number;
  readonly lift?: number;
  readonly gain?: number;
  readonly shadows?: number;
  readonly midtones?: number;
  readonly highlights?: number;
  readonly blackLevel?: number;
  readonly whiteLevel?: number;
  readonly redGain?: number;
  readonly greenGain?: number;
  readonly blueGain?: number;
  readonly redOffset?: number;
  readonly greenOffset?: number;
  readonly blueOffset?: number;
  readonly preserveLuminance?: boolean;
  readonly clampOutput?: boolean;
  readonly enabled?: boolean;
}
export type ColorCorrectionParameterSnapshot = Required<ColorCorrectionParameters>;
export const COLOR_CORRECTION_NEUTRAL_PARAMETERS: ColorCorrectionParameterSnapshot =
  deepFreezeColorCorrection({
    brightness: 0,
    contrast: 1,
    saturation: 1,
    hueDegrees: 0,
    exposureStops: 0,
    gamma: 1,
    temperatureKelvinOffset: 0,
    tint: 0,
    lift: 0,
    gain: 1,
    shadows: 0,
    midtones: 0,
    highlights: 0,
    blackLevel: 0,
    whiteLevel: 1,
    redGain: 1,
    greenGain: 1,
    blueGain: 1,
    redOffset: 0,
    greenOffset: 0,
    blueOffset: 0,
    preserveLuminance: true,
    clampOutput: true,
    enabled: true,
  });
const ranges: Record<
  keyof Omit<ColorCorrectionParameterSnapshot, 'preserveLuminance' | 'clampOutput' | 'enabled'>,
  [number, number]
> = {
  brightness: [-1, 1],
  contrast: [0, 4],
  saturation: [0, 4],
  hueDegrees: [-180, 180],
  exposureStops: [-10, 10],
  gamma: [0.1, 10],
  temperatureKelvinOffset: [-20000, 20000],
  tint: [-1, 1],
  lift: [-1, 1],
  gain: [0, 4],
  shadows: [-1, 1],
  midtones: [-1, 1],
  highlights: [-1, 1],
  blackLevel: [0, 1],
  whiteLevel: [0, 1],
  redGain: [0, 4],
  greenGain: [0, 4],
  blueGain: [0, 4],
  redOffset: [-1, 1],
  greenOffset: [-1, 1],
  blueOffset: [-1, 1],
};
export interface ColorCorrectionParameterValidationReport {
  readonly ok: boolean;
  readonly policy: ColorCorrectionParameterPolicy;
  readonly effectiveParameters: Readonly<ColorCorrectionParameterSnapshot>;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly clampedParameterNames: readonly string[];
}
export class ColorCorrectionError extends RuntimeEngineError {}
const ccerr = (code: string, msg: string, details: Record<string, unknown> = {}) =>
  new ColorCorrectionError(code, msg, details);
export const ColorCorrectionErrors = Object.freeze([
  'ColorCorrectionEngineNotReady',
  'ColorCorrectionBackendNotFound',
  'DuplicateColorCorrectionBackend',
  'ColorCorrectionPresetNotFound',
  'DuplicateColorCorrectionPreset',
  'ColorCorrectionPresetInvalid',
  'ColorCorrectionPresetCycle',
  'ColorCorrectionPresetStackExceeded',
  'ColorCorrectionParametersInvalid',
  'ColorCorrectionParameterOutOfRange',
  'ColorCorrectionWorkingSpaceUnsupported',
  'ColorCorrectionInputInvalid',
  'ColorCorrectionOutputInvalid',
  'ColorCorrectionLutUnsupported',
  'ColorCorrectionLutInvalid',
  'ColorCorrectionHdrPolicyViolation',
  'ColorCorrectionAlphaPolicyViolation',
  'ColorCorrectionLeaseInvalid',
  'ColorCorrectionFrameLost',
  'ColorCorrectionGenerationMismatch',
  'ColorCorrectionAllocationFailed',
  'ColorCorrectionTemporaryMemoryExceeded',
  'ColorCorrectionBackendFailed',
  'ColorCorrectionTimeout',
  'ColorCorrectionCancelled',
  'ColorCorrectionOwnershipViolation',
  'ColorCorrectionInvariantViolation',
  'ColorCorrectionShutdownError',
]);

export interface ColorCorrectionLutReference {
  readonly lutRef: string;
  readonly lutType: ColorCorrectionLutType;
  readonly domainMin?: readonly number[];
  readonly domainMax?: readonly number[];
  readonly interpolation?: string;
  readonly expectedWorkingSpace?: ColorCorrectionWorkingSpace;
  readonly checksumRef?: string;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}
export interface ColorCorrectionPreset {
  readonly presetId: string;
  readonly displayName: string;
  readonly version: number;
  readonly description?: string;
  readonly parameters: Readonly<ColorCorrectionParameters>;
  readonly workingSpace?: ColorCorrectionWorkingSpace | undefined;
  readonly expectedInputColorMetadata?: Readonly<Record<string, unknown>>;
  readonly expectedOutputColorMetadata?: Readonly<Record<string, unknown>>;
  readonly compatibleFormats?: readonly string[];
  readonly compatibleHdrState?: readonly string[];
  readonly tags?: readonly string[];
  readonly authorRef?: string;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}
export type ColorCorrectionPresetSnapshot = Omit<
  ColorCorrectionPreset,
  | 'createdAtNs'
  | 'updatedAtNs'
  | 'parameters'
  | 'metadata'
  | 'expectedInputColorMetadata'
  | 'expectedOutputColorMetadata'
> & {
  readonly parameters: Readonly<ColorCorrectionParameterSnapshot>;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
  readonly expectedInputColorMetadata?: Readonly<Record<string, JsonSafe>> | undefined;
  readonly expectedOutputColorMetadata?: Readonly<Record<string, JsonSafe>> | undefined;
};
export interface ColorCorrectionBackendDescriptor {
  readonly backendId: string;
  readonly displayName: string;
  readonly backendType: ColorCorrectionBackendType;
  readonly version: string;
  readonly deterministic: boolean;
  readonly supportedWorkingSpaces: readonly ColorCorrectionWorkingSpace[];
  readonly supportedQualityTiers: readonly ColorCorrectionQualityTier[];
  readonly supportsHdr: boolean;
  readonly supportsLut: boolean;
  readonly requiresGpu: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ColorCorrectionCapability {
  readonly backendId: string;
  readonly workingSpace: ColorCorrectionWorkingSpace;
  readonly formats: readonly string[];
  readonly operationOrder: readonly ColorCorrectionOperation[];
  readonly qualityTiers: readonly ColorCorrectionQualityTier[];
  readonly supportsAlphaPolicies: readonly ColorCorrectionAlphaPolicy[];
  readonly supportsClampPolicies: readonly ColorCorrectionClampPolicy[];
  readonly precisionLoss: boolean;
  readonly alphaLoss: boolean;
  readonly extraColorConversion: boolean;
  readonly estimatedTemporaryBytes: number;
}
export type ColorCorrectionCapabilitySnapshot = ColorCorrectionCapability;
export interface ColorCorrectionPlanRequest {
  readonly requestId: string;
  readonly inputFormat: string;
  readonly inputColorMetadata?: Readonly<Record<string, unknown>> | undefined;
  readonly outputFormat?: string | undefined;
  readonly outputColorMetadata?: Readonly<Record<string, unknown>> | undefined;
  readonly parameters?: Readonly<ColorCorrectionParameters> | undefined;
  readonly presetIds?: readonly string[] | undefined;
  readonly allowPresetStacking?: boolean;
  readonly lutReferences?: readonly ColorCorrectionLutReference[] | undefined;
  readonly workingSpace?: ColorCorrectionWorkingSpace | undefined;
  readonly backendPreference?: string | undefined;
  readonly qualityTier?: ColorCorrectionQualityTier | undefined;
  readonly parameterPolicy: ColorCorrectionParameterPolicy;
  readonly targetOutputProfile?: Readonly<VideoPipelineOutputProfile> | undefined;
  readonly deviceGeneration?: bigint | undefined;
  readonly pipelineConfigurationGeneration?: bigint | undefined;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}
export interface ColorCorrectionPlan {
  readonly planId: string;
  readonly cacheKey: string;
  readonly inputFormat: string;
  readonly inputColorMetadata: Readonly<Record<string, JsonSafe>>;
  readonly outputFormat: string;
  readonly outputColorMetadata: Readonly<Record<string, JsonSafe>>;
  readonly workingSpace: ColorCorrectionWorkingSpace;
  readonly effectiveParameters: Readonly<ColorCorrectionParameterSnapshot>;
  readonly operationOrder: readonly ColorCorrectionOperation[];
  readonly presetIds: readonly string[];
  readonly lutReferences: readonly Readonly<Record<string, JsonSafe>>[];
  readonly backendPreference?: string | undefined;
  readonly selectedBackendId?: string | undefined;
  readonly passThroughEligible: boolean;
  readonly requiresPixelCorrection: boolean;
  readonly requiresOutputAllocation: boolean;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly estimatedOperationCount: number;
  readonly qualityTier: ColorCorrectionQualityTier;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export type ColorCorrectionPlanSnapshot = Omit<
  ColorCorrectionPlan,
  'inputColorMetadata' | 'outputColorMetadata'
> & {
  readonly inputColorMetadata: Readonly<Record<string, JsonSafe>>;
  readonly outputColorMetadata: Readonly<Record<string, JsonSafe>>;
};
export interface ColorCorrectionPlanResult {
  readonly ok: boolean;
  readonly plan?: Readonly<ColorCorrectionPlan>;
  readonly error?: string;
  readonly validation: Readonly<ColorCorrectionParameterValidationReport>;
  readonly cacheHit: boolean;
}
export interface ColorCorrectionRequest extends ColorCorrectionPlanRequest {
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrame: Readonly<VideoPipelineFrameReference>;
  readonly inputLease: Readonly<FrameLease>;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly correctionIntent: ColorCorrectionIntent;
  readonly alphaPolicy?: ColorCorrectionAlphaPolicy;
  readonly clampPolicy?: ColorCorrectionClampPolicy;
  readonly deadlineNs?: bigint | undefined;
  readonly correlationId?: string | undefined;
  readonly cancellationSignal?: AbortSignal | undefined;
}
export type ColorCorrectionRequestSnapshot = Omit<
  ColorCorrectionRequest,
  | 'inputFrame'
  | 'inputLease'
  | 'expectedFrameGeneration'
  | 'expectedStorageGeneration'
  | 'deadlineNs'
  | 'cancellationSignal'
> & {
  readonly inputFrameId: string;
  readonly inputStorageId: string;
  readonly inputLeaseId: string;
  readonly expectedFrameGeneration: string;
  readonly expectedStorageGeneration: string;
  readonly deadlineNs?: string | undefined;
};
export interface ColorCorrectionRuntimeContext {
  readonly frameMemory: FrameMemoryManager;
  readonly nowNs?: () => bigint;
  readonly deviceGeneration?: bigint | undefined;
}
export interface ColorCorrectionBackendContext {
  readonly nowNs: () => bigint;
}
export interface ColorCorrectionBackendRuntimeContext extends ColorCorrectionBackendContext {
  readonly cancellationSignal?: AbortSignal | undefined;
  readonly deadlineNs?: bigint | undefined;
}
export interface ColorCorrectionBackendResult {
  readonly ok: boolean;
  readonly warnings: readonly string[];
  readonly clampCount: number;
  readonly signature: string;
  readonly precisionLoss: boolean;
}
export interface ColorCorrectionPlanCandidate {
  readonly backendId: string;
  readonly score: number;
  readonly estimatedTemporaryBytes: number;
  readonly precisionLoss: boolean;
  readonly alphaLoss: boolean;
  readonly extraColorConversion: boolean;
  readonly qualitySupported: boolean;
  readonly warnings?: readonly string[];
}
export interface ColorCorrectionBackend {
  readonly descriptor: Readonly<ColorCorrectionBackendDescriptor>;
  getCapabilities(): readonly Readonly<ColorCorrectionCapability>[];
  createPlan(
    request: ColorCorrectionPlanRequest,
    context: ColorCorrectionBackendContext,
  ): ColorCorrectionPlanCandidate | undefined;
  execute(
    plan: ColorCorrectionPlan,
    input: VideoPipelineFrameReference,
    output: FrameLease,
    context: ColorCorrectionBackendRuntimeContext,
  ): Promise<ColorCorrectionBackendResult>;
  shutdown(context: { readonly nowNs: () => bigint }): Promise<void>;
}
export interface ColorCorrectionResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId?: string | undefined;
  readonly status: ColorCorrectionStatus;
  readonly inputFrameId: string;
  readonly outputFrame?: Readonly<VideoPipelineFrameReference> | undefined;
  readonly passThrough: boolean;
  readonly correctionApplied: boolean;
  readonly effectiveParameters: Readonly<ColorCorrectionParameterSnapshot>;
  readonly appliedPresetIds: readonly string[];
  readonly workingSpace: ColorCorrectionWorkingSpace;
  readonly operationOrder: readonly ColorCorrectionOperation[];
  readonly effectiveQuality: ColorCorrectionQualityTier;
  readonly effectiveAlphaPolicy: ColorCorrectionAlphaPolicy;
  readonly effectiveClampPolicy: ColorCorrectionClampPolicy;
  readonly warnings: readonly string[];
  readonly clampedParameterNames: readonly string[];
  readonly precisionLoss: boolean;
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: bigint;
  readonly ownershipTransfer: Readonly<Record<string, JsonSafe>>;
  readonly completedAtNs: bigint;
}
export type ColorCorrectionResultSnapshot = Omit<
  ColorCorrectionResult,
  'durationNs' | 'completedAtNs'
> & { readonly durationNs: string; readonly completedAtNs: string };
export interface ColorCorrectionHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly activeBackendCount: number;
  readonly failedBackendCount: number;
  readonly presetCount: number;
  readonly planCacheSize: number;
  readonly activeRequestCount: number;
  readonly completedCorrectionCount: number;
  readonly passThroughCount: number;
  readonly failedCorrectionCount: number;
  readonly cancelledCount: number;
  readonly rejectedCount: number;
  readonly timeoutCount: number;
  readonly parameterValidationFailureCount: number;
  readonly presetValidationFailureCount: number;
  readonly unsupportedLutCount: number;
  readonly clampWarningCount: number;
  readonly precisionWarningCount: number;
  readonly gpuLossCount: number;
  readonly allocationFailureCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly temporaryBytes: number;
  readonly peakTemporaryBytes: number;
  readonly lastSuccess?: string;
  readonly lastFailure?: Readonly<Record<string, JsonSafe>>;
  readonly updatedAtNs: string;
}
export interface ColorCorrectionTelemetrySnapshot {
  readonly totalPlanRequests: number;
  readonly totalPlansCreated: number;
  readonly totalPlanCacheHits: number;
  readonly totalPlanCacheMisses: number;
  readonly totalCorrectionRequests: number;
  readonly totalCorrectionsCompleted: number;
  readonly totalPassThrough: number;
  readonly totalCorrectionsFailed: number;
  readonly totalCorrectionsDropped: number;
  readonly totalCorrectionsCancelled: number;
  readonly totalCorrectionsRejected: number;
  readonly totalParameterValidationFailures: number;
  readonly totalPresetApplications: number;
  readonly totalPresetResolutionFailures: number;
  readonly totalLutRequests: number;
  readonly totalUnsupportedLutRequests: number;
  readonly totalBrightnessAdjustments: number;
  readonly totalContrastAdjustments: number;
  readonly totalSaturationAdjustments: number;
  readonly totalHueAdjustments: number;
  readonly totalExposureAdjustments: number;
  readonly totalGammaAdjustments: number;
  readonly totalTemperatureAdjustments: number;
  readonly totalTintAdjustments: number;
  readonly totalLiftGammaGainAdjustments: number;
  readonly totalShadowMidtoneHighlightAdjustments: number;
  readonly totalChannelAdjustments: number;
  readonly totalClampWarnings: number;
  readonly totalPrecisionWarnings: number;
  readonly totalBackendFallbacks: number;
  readonly totalTimeouts: number;
  readonly totalGpuLossFailures: number;
  readonly totalAllocationFailures: number;
  readonly averagePlanDurationNs: string;
  readonly maximumPlanDurationNs: string;
  readonly averageCorrectionDurationNs: string;
  readonly maximumCorrectionDurationNs: string;
  readonly peakTemporaryBytes: number;
  readonly currentRequestIds: readonly string[];
  readonly lastCorrectionEvent?: string | undefined;
  readonly healthSummary: string;
}
export interface ColorCorrectionEngineSnapshot {
  readonly engineState: string;
  readonly backends: readonly Readonly<ColorCorrectionBackendDescriptor>[];
  readonly presets: readonly Readonly<ColorCorrectionPresetSnapshot>[];
  readonly planCacheSize: number;
  readonly health: Readonly<ColorCorrectionHealthSnapshot>;
  readonly telemetry: Readonly<ColorCorrectionTelemetrySnapshot>;
  readonly containsPixelData: false;
  readonly containsLutContents: false;
  readonly containsRawHandles: false;
}
export type ColorCorrectionValidationReport = ColorCorrectionParameterValidationReport;

const neutralize = (p?: Readonly<ColorCorrectionParameters>): ColorCorrectionParameterSnapshot => ({
  ...COLOR_CORRECTION_NEUTRAL_PARAMETERS,
  ...(p ?? {}),
});
const isNeutral = (p: ColorCorrectionParameterSnapshot) =>
  !p.enabled ||
  (
    Object.keys(COLOR_CORRECTION_NEUTRAL_PARAMETERS) as Array<
      keyof ColorCorrectionParameterSnapshot
    >
  ).every((k) => k === 'enabled' || p[k] === COLOR_CORRECTION_NEUTRAL_PARAMETERS[k]);
function validateParams(
  parameters: ColorCorrectionParameters = {},
  policy: ColorCorrectionParameterPolicy,
): ColorCorrectionParameterValidationReport {
  const effective: Mutable<ColorCorrectionParameterSnapshot> = { ...neutralize(parameters) };
  const errors: string[] = [];
  const warnings: string[] = [];
  const clamped: string[] = [];
  for (const [name, [min, max]] of Object.entries(ranges)) {
    const parameterName = name as keyof typeof ranges;
    const value = effective[parameterName];
    if (typeof value !== 'number' || !Number.isFinite(value)) errors.push(`${name} must be finite`);
    else if (value < min || value > max) {
      if (policy === 'CLAMP_TO_SUPPORTED_RANGE' || policy === 'WARN_AND_CLAMP') {
        effective[parameterName] = Math.min(max, Math.max(min, value));
        clamped.push(parameterName);
        if (policy === 'WARN_AND_CLAMP') warnings.push(`${parameterName} clamped`);
      } else errors.push(`${parameterName} out of range ${min}..${max}`);
    }
  }
  if (effective.gamma <= 0) errors.push('gamma must be positive');
  if (effective.blackLevel >= effective.whiteLevel)
    errors.push('blackLevel must be less than whiteLevel');
  return cloneFreeze({
    ok: errors.length === 0,
    policy,
    effectiveParameters: effective,
    errors,
    warnings,
    clampedParameterNames: clamped,
  });
}
const toPresetSnapshot = (p: ColorCorrectionPreset): ColorCorrectionPresetSnapshot =>
  cloneFreeze({
    ...p,
    parameters: validateParams(p.parameters, 'REJECT_OUT_OF_RANGE').effectiveParameters,
    createdAtNs: ns(p.createdAtNs),
    updatedAtNs: ns(p.updatedAtNs),
    metadata: safe(p.metadata ?? {}) as Record<string, JsonSafe>,
    expectedInputColorMetadata: p.expectedInputColorMetadata
      ? (safe(p.expectedInputColorMetadata) as Record<string, JsonSafe>)
      : undefined,
    expectedOutputColorMetadata: p.expectedOutputColorMetadata
      ? (safe(p.expectedOutputColorMetadata) as Record<string, JsonSafe>)
      : undefined,
  });

export class SyntheticColorCorrectionBackend implements ColorCorrectionBackend {
  readonly descriptor: ColorCorrectionBackendDescriptor;
  constructor(
    private readonly options: {
      readonly backendId?: string;
      readonly fail?: boolean;
      readonly timeout?: boolean;
      readonly precisionWarning?: boolean;
      readonly clampWarning?: boolean;
      readonly unsupportedParameters?: readonly string[];
    } = {},
  ) {
    this.descriptor = deepFreezeColorCorrection({
      backendId: options.backendId ?? 'synthetic-color-correction',
      displayName: 'Synthetic Color Correction Backend',
      backendType: 'SYNTHETIC',
      version: '5.3.6',
      deterministic: true,
      supportedWorkingSpaces: ['LINEAR_RGB', 'DISPLAY_REFERRED_RGB', 'SCENE_LINEAR'],
      supportedQualityTiers: ['FAST', 'BALANCED', 'HIGH_QUALITY'],
      supportsHdr: true,
      supportsLut: false,
      requiresGpu: false,
      metadata: {},
    });
  }
  getCapabilities(): readonly Readonly<ColorCorrectionCapability>[] {
    return [
      deepFreezeColorCorrection({
        backendId: this.descriptor.backendId,
        workingSpace: 'LINEAR_RGB' as ColorCorrectionWorkingSpace,
        formats: ['RGBA8', 'BGRA8', 'RGB24', 'RGBA16F', 'RGBA32F'],
        operationOrder: COLOR_CORRECTION_OPERATION_ORDER,
        qualityTiers: this.descriptor.supportedQualityTiers,
        supportsAlphaPolicies: ['PRESERVE', 'CORRECT_RGB_ONLY', 'CORRECT_PREMULTIPLIED_SAFE'],
        supportsClampPolicies: ['CLAMP_TO_FORMAT', 'PRESERVE_EXTENDED', 'FAIL_ON_OUT_OF_RANGE'],
        precisionLoss: false,
        alphaLoss: false,
        extraColorConversion: false,
        estimatedTemporaryBytes: 0,
      }),
    ];
  }
  createPlan(request: ColorCorrectionPlanRequest) {
    if (request.lutReferences?.length) return undefined;
    if (!this.descriptor.supportedWorkingSpaces.includes(request.workingSpace ?? 'LINEAR_RGB'))
      return undefined;
    return {
      backendId: this.descriptor.backendId,
      score: 100,
      estimatedTemporaryBytes: 0,
      precisionLoss: false,
      alphaLoss: false,
      extraColorConversion: false,
      qualitySupported: this.descriptor.supportedQualityTiers.includes(
        request.qualityTier ?? 'BALANCED',
      ),
      warnings: this.options.precisionWarning ? ['Synthetic precision warning'] : [],
    };
  }
  async execute(
    plan: ColorCorrectionPlan,
    _input: VideoPipelineFrameReference,
    _output: FrameLease,
    context: ColorCorrectionBackendRuntimeContext,
  ) {
    if (context.cancellationSignal?.aborted)
      throw ccerr('ColorCorrectionCancelled', 'Correction was cancelled');
    if (this.options.timeout)
      throw ccerr('ColorCorrectionTimeout', 'Synthetic correction timed out');
    if (this.options.fail)
      throw ccerr('ColorCorrectionBackendFailed', 'Synthetic correction failed');
    const unsupported =
      this.options.unsupportedParameters?.filter(
        (p) =>
          plan.effectiveParameters[p as keyof ColorCorrectionParameterSnapshot] !==
          COLOR_CORRECTION_NEUTRAL_PARAMETERS[p as keyof ColorCorrectionParameterSnapshot],
      ) ?? [];
    if (unsupported.length)
      throw ccerr('ColorCorrectionBackendFailed', 'Unsupported synthetic parameter', {
        parameters: unsupported,
      });
    return cloneFreeze({
      ok: true,
      warnings: [
        ...(this.options.clampWarning ? ['Synthetic clamp warning'] : []),
        ...plan.warnings,
      ],
      clampCount: this.options.clampWarning ? 1 : 0,
      signature: `cc:${plan.planId}:${plan.operationOrder.join('>')}`,
      precisionLoss: !!this.options.precisionWarning,
    });
  }
  async shutdown() {}
}

export class DefaultColorCorrectionEngine {
  private backends = new Map<string, ColorCorrectionBackend>();
  private presets = new Map<string, ColorCorrectionPresetSnapshot>();
  private cache = new Map<string, ColorCorrectionPlan>();
  private requests = new Set<string>();
  private active = new Set<string>();
  private shutdownFlag = false;
  private seq = 0;
  private telemetry: ColorCorrectionTelemetrySnapshot;
  constructor(
    private readonly config: {
      readonly nowNs?: () => bigint;
      readonly maxPlanCacheEntries?: number;
      readonly maxPresetCount?: number;
      readonly maxPresetStackDepth?: number;
    } = {},
  ) {
    this.telemetry = this.emptyTelemetry('CREATED');
  }
  private now = () => (this.config.nowNs ?? nowDefault)();
  private nextId = () => `color-correction-plan-${++this.seq}`;
  private emptyTelemetry(event?: string): ColorCorrectionTelemetrySnapshot {
    return {
      totalPlanRequests: 0,
      totalPlansCreated: 0,
      totalPlanCacheHits: 0,
      totalPlanCacheMisses: 0,
      totalCorrectionRequests: 0,
      totalCorrectionsCompleted: 0,
      totalPassThrough: 0,
      totalCorrectionsFailed: 0,
      totalCorrectionsDropped: 0,
      totalCorrectionsCancelled: 0,
      totalCorrectionsRejected: 0,
      totalParameterValidationFailures: 0,
      totalPresetApplications: 0,
      totalPresetResolutionFailures: 0,
      totalLutRequests: 0,
      totalUnsupportedLutRequests: 0,
      totalBrightnessAdjustments: 0,
      totalContrastAdjustments: 0,
      totalSaturationAdjustments: 0,
      totalHueAdjustments: 0,
      totalExposureAdjustments: 0,
      totalGammaAdjustments: 0,
      totalTemperatureAdjustments: 0,
      totalTintAdjustments: 0,
      totalLiftGammaGainAdjustments: 0,
      totalShadowMidtoneHighlightAdjustments: 0,
      totalChannelAdjustments: 0,
      totalClampWarnings: 0,
      totalPrecisionWarnings: 0,
      totalBackendFallbacks: 0,
      totalTimeouts: 0,
      totalGpuLossFailures: 0,
      totalAllocationFailures: 0,
      averagePlanDurationNs: '0',
      maximumPlanDurationNs: '0',
      averageCorrectionDurationNs: '0',
      maximumCorrectionDurationNs: '0',
      peakTemporaryBytes: 0,
      currentRequestIds: [],
      lastCorrectionEvent: event,
      healthSummary: 'HEALTHY',
    };
  }
  private inc(delta: Partial<ColorCorrectionTelemetrySnapshot>, event: string) {
    this.telemetry = cloneFreeze({
      ...this.telemetry,
      ...Object.fromEntries(
        Object.entries(delta).map(([k, v]) => [
          k,
          typeof v === 'number'
            ? Number(this.telemetry[k as keyof ColorCorrectionTelemetrySnapshot] ?? 0) + v
            : v,
        ]),
      ),
      currentRequestIds: [...this.active].sort(),
      lastCorrectionEvent: event,
    });
  }
  registerBackend(b: ColorCorrectionBackend) {
    if (this.shutdownFlag) throw ccerr('ColorCorrectionShutdownError', 'Engine is shut down');
    if (this.backends.has(b.descriptor.backendId))
      throw ccerr('DuplicateColorCorrectionBackend', 'Duplicate backend', {
        backendId: b.descriptor.backendId,
      });
    this.backends.set(b.descriptor.backendId, b);
    this.cache.clear();
    this.inc({}, 'ColorCorrectionBackendRegistered');
  }
  async unregisterBackend(id: string) {
    const b = this.backends.get(id);
    if (!b) throw ccerr('ColorCorrectionBackendNotFound', 'Backend not found', { backendId: id });
    this.backends.delete(id);
    for (const [k, p] of [...this.cache]) if (p.selectedBackendId === id) this.cache.delete(k);
    await b.shutdown({ nowNs: this.now });
    this.inc({}, 'ColorCorrectionBackendUnregistered');
  }
  registerPreset(p: ColorCorrectionPreset) {
    if (this.presets.size >= (this.config.maxPresetCount ?? 128))
      throw ccerr('ColorCorrectionPresetInvalid', 'Preset registry is full');
    if (this.presets.has(p.presetId))
      throw ccerr('DuplicateColorCorrectionPreset', 'Duplicate preset', { presetId: p.presetId });
    const snap = toPresetSnapshot(p);
    const vr = validateParams(snap.parameters, 'REJECT_OUT_OF_RANGE');
    if (!vr.ok)
      throw ccerr('ColorCorrectionPresetInvalid', 'Preset parameters invalid', {
        errors: vr.errors,
      });
    this.presets.set(p.presetId, snap);
    this.cache.clear();
    this.inc({}, 'ColorCorrectionPresetRegistered');
  }
  unregisterPreset(id: string) {
    if (!this.presets.delete(id))
      throw ccerr('ColorCorrectionPresetNotFound', 'Preset not found', { presetId: id });
    this.cache.clear();
    this.inc({}, 'ColorCorrectionPresetUnregistered');
  }
  getPreset(id: string) {
    return this.presets.get(id);
  }
  listPresets() {
    return cloneFreeze(
      [...this.presets.values()].sort((a, b) => a.presetId.localeCompare(b.presetId)),
    );
  }
  validateParameters(parameters: ColorCorrectionParameters) {
    return validateParams(parameters, 'REJECT_OUT_OF_RANGE');
  }
  private resolve(req: ColorCorrectionPlanRequest) {
    const max = this.config.maxPresetStackDepth ?? 8;
    const ids = req.presetIds ?? [];
    if (ids.length && !req.allowPresetStacking && ids.length > 1)
      throw ccerr('ColorCorrectionPresetStackExceeded', 'Preset stacking not enabled');
    if (ids.length > max)
      throw ccerr('ColorCorrectionPresetStackExceeded', 'Preset stack exceeds maximum');
    const seen = new Set<string>();
    let merged: ColorCorrectionParameters = {};
    for (const id of ids) {
      if (seen.has(id))
        throw ccerr('ColorCorrectionPresetCycle', 'Duplicate preset in stack rejected');
      seen.add(id);
      const p = this.presets.get(id);
      if (!p) throw ccerr('ColorCorrectionPresetNotFound', 'Preset not found', { presetId: id });
      merged = { ...merged, ...p.parameters };
    }
    return { presetIds: ids, parameters: { ...merged, ...(req.parameters ?? {}) } };
  }
  private key(req: ColorCorrectionPlanRequest, eff: ColorCorrectionParameterSnapshot) {
    return JSON.stringify({
      inputFormat: req.inputFormat,
      inputColorMetadata: safe(req.inputColorMetadata ?? {}),
      outputFormat: req.outputFormat ?? req.inputFormat,
      outputColorMetadata: safe(req.outputColorMetadata ?? req.inputColorMetadata ?? {}),
      workingSpace: req.workingSpace ?? 'LINEAR_RGB',
      eff,
      presets: req.presetIds ?? [],
      luts: (req.lutReferences ?? []).map((l) => safe(l)),
      quality: req.qualityTier ?? 'BALANCED',
      backend: req.backendPreference ?? '',
      deviceGeneration: ns(req.deviceGeneration ?? 0n),
      pipelineConfigurationGeneration: ns(req.pipelineConfigurationGeneration ?? 0n),
    });
  }
  plan(req: ColorCorrectionPlanRequest): ColorCorrectionPlanResult {
    const start = this.now();
    this.inc({ totalPlanRequests: 1 }, 'ColorCorrectionPlanRequested');
    if (this.shutdownFlag) throw ccerr('ColorCorrectionShutdownError', 'Engine is shut down');
    if (req.lutReferences?.length) {
      this.inc(
        {
          totalLutRequests: req.lutReferences.length,
          totalUnsupportedLutRequests: req.lutReferences.length,
        },
        'ColorCorrectionPlanRejected',
      );
      return cloneFreeze({
        ok: false,
        error: 'ColorCorrectionLutUnsupported',
        validation: validateParams(req.parameters, 'REJECT_OUT_OF_RANGE'),
        cacheHit: false,
      });
    }
    const resolved = this.resolve(req);
    const validation = validateParams(resolved.parameters, req.parameterPolicy);
    if (!validation.ok) {
      this.inc({ totalParameterValidationFailures: 1 }, 'ColorCorrectionPlanRejected');
      return cloneFreeze({
        ok: false,
        error: 'ColorCorrectionParametersInvalid',
        validation,
        cacheHit: false,
      });
    }
    const cacheKey = this.key(req, validation.effectiveParameters);
    const hit = this.cache.get(cacheKey);
    if (hit) {
      this.inc({ totalPlanCacheHits: 1 }, 'ColorCorrectionPlanCacheHit');
      return cloneFreeze({ ok: true, plan: hit, validation, cacheHit: true });
    }
    const candidates = [...this.backends.values()]
      .map((b) => b.createPlan(req, { nowNs: this.now }))
      .filter((x): x is ColorCorrectionPlanCandidate => !!x)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.estimatedTemporaryBytes - b.estimatedTemporaryBytes ||
          a.backendId.localeCompare(b.backendId),
      );
    const backend = req.backendPreference
      ? candidates.find((c) => c.backendId === req.backendPreference)
      : candidates[0];
    const pass =
      isNeutral(validation.effectiveParameters) &&
      !req.lutReferences?.length &&
      (!req.outputFormat || req.outputFormat === req.inputFormat);
    if (!backend && !pass)
      return cloneFreeze({
        ok: false,
        error: 'ColorCorrectionBackendNotFound',
        validation,
        cacheHit: false,
      });
    const plan: ColorCorrectionPlan = cloneFreeze({
      planId: this.nextId(),
      cacheKey,
      inputFormat: req.inputFormat,
      inputColorMetadata: safe(req.inputColorMetadata ?? {}) as Record<string, JsonSafe>,
      outputFormat: req.outputFormat ?? req.inputFormat,
      outputColorMetadata: safe(req.outputColorMetadata ?? req.inputColorMetadata ?? {}) as Record<
        string,
        JsonSafe
      >,
      workingSpace: req.workingSpace ?? 'LINEAR_RGB',
      effectiveParameters: validation.effectiveParameters,
      operationOrder: COLOR_CORRECTION_OPERATION_ORDER,
      presetIds: [...resolved.presetIds].sort(),
      lutReferences: (req.lutReferences ?? []).map((l) => safe(l) as Record<string, JsonSafe>),
      backendPreference: req.backendPreference,
      selectedBackendId: backend?.backendId,
      passThroughEligible: pass,
      requiresPixelCorrection: !pass,
      requiresOutputAllocation: !pass,
      estimatedTemporaryBytes: backend?.estimatedTemporaryBytes ?? 0,
      estimatedOutputBytes: pass ? 0 : 1,
      estimatedOperationCount: COLOR_CORRECTION_OPERATION_ORDER.length,
      qualityTier: req.qualityTier ?? 'BALANCED',
      deterministicScore: backend?.score ?? 0,
      warnings: [...validation.warnings, ...(backend?.warnings ?? [])],
      metadata: safe(req.metadata ?? {}) as Record<string, JsonSafe>,
    });
    this.cache.set(cacheKey, plan);
    while (this.cache.size > (this.config.maxPlanCacheEntries ?? 64))
      this.cache.delete(this.cache.keys().next().value!);
    const dur = this.now() - start;
    this.inc(
      { totalPlansCreated: 1, totalPlanCacheMisses: 1, maximumPlanDurationNs: ns(dur) },
      'ColorCorrectionPlanCreated',
    );
    return cloneFreeze({ ok: true, plan, validation, cacheHit: false });
  }
  async correct(
    req: ColorCorrectionRequest,
    ctx: ColorCorrectionRuntimeContext,
  ): Promise<ColorCorrectionResult> {
    const start = (ctx.nowNs ?? this.now)();
    this.inc({ totalCorrectionRequests: 1 }, 'ColorCorrectionStarted');
    if (req.cancellationSignal?.aborted)
      return this.result(req, '', undefined, 'CANCELLED', true, false, undefined, start, start, [
        'cancelled before planning',
      ]);
    if (this.requests.has(req.requestId))
      throw ccerr('ColorCorrectionInputInvalid', 'Duplicate request');
    this.requests.add(req.requestId);
    this.active.add(req.requestId);
    try {
      if (req.inputFrame.state === 'LOST' || req.inputFrame.state === 'RELEASED')
        throw ccerr('ColorCorrectionFrameLost', 'Input frame is not usable');
      if (
        req.inputFrame.frameGeneration !== req.expectedFrameGeneration ||
        req.inputFrame.storageGeneration !== req.expectedStorageGeneration
      )
        throw ccerr('ColorCorrectionGenerationMismatch', 'Input generation mismatch');
      if (/YUV|NV12|P010|I420|YUY2|UYVY/.test(req.inputFormat))
        throw ccerr(
          'ColorCorrectionWorkingSpaceUnsupported',
          'YUV input requires color conversion before correction',
        );
      const pr = this.plan(req);
      if (!pr.ok || !pr.plan)
        return this.result(
          req,
          '',
          undefined,
          'REJECTED',
          true,
          false,
          undefined,
          start,
          (ctx.nowNs ?? this.now)(),
          [pr.error ?? 'planning failed'],
        );
      const plan = pr.plan;
      if (plan.passThroughEligible) {
        this.inc({ totalPassThrough: 1 }, 'ColorCorrectionPassedThrough');
        return this.result(
          req,
          plan.planId,
          plan.selectedBackendId,
          'PASSED_THROUGH',
          true,
          false,
          req.inputFrame,
          start,
          (ctx.nowNs ?? this.now)(),
          plan.warnings,
        );
      }
      if (req.cancellationSignal?.aborted)
        return this.result(
          req,
          plan.planId,
          plan.selectedBackendId,
          'CANCELLED',
          false,
          false,
          undefined,
          start,
          (ctx.nowNs ?? this.now)(),
          ['cancelled before allocation'],
        );
      const allocReq: Mutable<FrameAllocationRequest> = {
        width: Number(req.inputFrame.format['width'] ?? 1),
        height: Number(req.inputFrame.format['height'] ?? 1),
        format: (req.outputFormat as VideoFrameFormat) ?? 'RGBA8',
        memoryDomain: 'SYNTHETIC',
        usageFlags: ['PROCESSING_OUTPUT'],
        accessMode: 'WRITE_ONLY',
        lifetimeClass: 'FRAME_TRANSIENT',
        ownerId: 'COLOR_CORRECTION',
        metadata: { colorCorrectionPlanId: plan.planId },
      };
      if (req.correlationId) allocReq.correlationId = req.correlationId;
      const outputLease = await ctx.frameMemory.allocate(allocReq);
      try {
        const backend = this.backends.get(plan.selectedBackendId ?? '');
        if (!backend) throw ccerr('ColorCorrectionBackendNotFound', 'Backend not found');
        const br = await backend.execute(plan, req.inputFrame, outputLease, {
          nowNs: ctx.nowNs ?? this.now,
          ...(req.cancellationSignal ? { cancellationSignal: req.cancellationSignal } : {}),
          ...(req.deadlineNs !== undefined ? { deadlineNs: req.deadlineNs } : {}),
        });
        if (req.cancellationSignal?.aborted) {
          outputLease.release();
          return this.result(
            req,
            plan.planId,
            plan.selectedBackendId,
            'CANCELLED',
            false,
            false,
            undefined,
            start,
            (ctx.nowNs ?? this.now)(),
            ['cancelled after backend'],
          );
        }
        const frame = ctx.frameMemory.getFrame(outputLease.frameId);
        const out: VideoPipelineFrameReference = cloneFreeze({
          ...req.inputFrame,
          frameId: outputLease.frameId,
          storageId: frame?.descriptor.storageId ?? outputLease.frameId,
          frameGeneration: outputLease.generation,
          storageGeneration: BigInt(frame?.descriptor.storageGeneration ?? outputLease.generation),
          leaseId: outputLease.leaseId,
          ownerId: 'COLOR_CORRECTION',
          state: 'LEASED',
          metadata: {
            ...req.inputFrame.metadata,
            colorCorrection: { planId: plan.planId, signature: br.signature, applied: true },
          },
        });
        this.inc(
          {
            totalCorrectionsCompleted: 1,
            totalClampWarnings: br.clampCount ? 1 : 0,
            totalPrecisionWarnings: br.precisionLoss ? 1 : 0,
          },
          'ColorCorrectionCompleted',
        );
        return this.result(
          req,
          plan.planId,
          plan.selectedBackendId,
          'COMPLETED',
          false,
          true,
          out,
          start,
          (ctx.nowNs ?? this.now)(),
          [...plan.warnings, ...br.warnings],
          br.precisionLoss,
        );
      } catch (e) {
        try {
          outputLease.release();
        } catch {}
        throw e;
      }
    } catch (e) {
      const code = e instanceof RuntimeEngineError ? e.code : 'ColorCorrectionBackendFailed';
      this.inc(
        {
          totalCorrectionsFailed: 1,
          ...(code === 'ColorCorrectionTimeout' ? { totalTimeouts: 1 } : {}),
        },
        code,
      );
      return this.result(
        req,
        '',
        undefined,
        code === 'ColorCorrectionCancelled'
          ? 'CANCELLED'
          : code === 'ColorCorrectionTimeout'
            ? 'FAILED'
            : 'FAILED',
        false,
        false,
        undefined,
        start,
        (ctx.nowNs ?? this.now)(),
        [code],
      );
    } finally {
      this.active.delete(req.requestId);
    }
  }
  private result(
    req: ColorCorrectionRequest,
    planId: string,
    backendId: string | undefined,
    status: ColorCorrectionStatus,
    passThrough: boolean,
    applied: boolean,
    output: Readonly<VideoPipelineFrameReference> | undefined,
    start: bigint,
    end: bigint,
    warnings: readonly string[],
    precisionLoss = false,
  ): ColorCorrectionResult {
    return cloneFreeze({
      requestId: req.requestId,
      planId,
      backendId,
      status,
      inputFrameId: req.inputFrame.frameId,
      outputFrame: output,
      passThrough,
      correctionApplied: applied,
      effectiveParameters: neutralize(req.parameters),
      appliedPresetIds: req.presetIds ?? [],
      workingSpace: req.workingSpace ?? 'LINEAR_RGB',
      operationOrder: COLOR_CORRECTION_OPERATION_ORDER,
      effectiveQuality: req.qualityTier ?? 'BALANCED',
      effectiveAlphaPolicy: req.alphaPolicy ?? 'PRESERVE',
      effectiveClampPolicy: req.clampPolicy ?? 'CLAMP_TO_FORMAT',
      warnings,
      clampedParameterNames: [],
      precisionLoss,
      temporaryBytes: 0,
      outputBytes: applied ? 1 : 0,
      durationNs: end - start,
      ownershipTransfer: { outputLeaseTransferred: applied, passThrough },
      completedAtNs: end,
    });
  }
  getTelemetry() {
    return cloneFreeze(this.telemetry);
  }
  getHealth(): ColorCorrectionHealthSnapshot {
    return cloneFreeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: 'HEALTHY',
      backendCount: this.backends.size,
      activeBackendCount: this.backends.size,
      failedBackendCount: 0,
      presetCount: this.presets.size,
      planCacheSize: this.cache.size,
      activeRequestCount: this.active.size,
      completedCorrectionCount: this.telemetry.totalCorrectionsCompleted,
      passThroughCount: this.telemetry.totalPassThrough,
      failedCorrectionCount: this.telemetry.totalCorrectionsFailed,
      cancelledCount: this.telemetry.totalCorrectionsCancelled,
      rejectedCount: this.telemetry.totalCorrectionsRejected,
      timeoutCount: this.telemetry.totalTimeouts,
      parameterValidationFailureCount: this.telemetry.totalParameterValidationFailures,
      presetValidationFailureCount: this.telemetry.totalPresetResolutionFailures,
      unsupportedLutCount: this.telemetry.totalUnsupportedLutRequests,
      clampWarningCount: this.telemetry.totalClampWarnings,
      precisionWarningCount: this.telemetry.totalPrecisionWarnings,
      gpuLossCount: this.telemetry.totalGpuLossFailures,
      allocationFailureCount: this.telemetry.totalAllocationFailures,
      staleGenerationRejectionCount: 0,
      temporaryBytes: 0,
      peakTemporaryBytes: this.telemetry.peakTemporaryBytes,
      updatedAtNs: ns(this.now()),
    });
  }
  getSnapshot(): ColorCorrectionEngineSnapshot {
    return cloneFreeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      backends: [...this.backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      presets: this.listPresets(),
      planCacheSize: this.cache.size,
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
      containsPixelData: false,
      containsLutContents: false,
      containsRawHandles: false,
    });
  }
  clearPlanCache() {
    this.cache.clear();
  }
  assertInvariants() {
    if (new Set(this.backends.keys()).size !== this.backends.size)
      throw ccerr('ColorCorrectionInvariantViolation', 'Duplicate backend IDs');
    if (this.cache.size > (this.config.maxPlanCacheEntries ?? 64))
      throw ccerr('ColorCorrectionInvariantViolation', 'Plan cache exceeds bound');
    if (this.presets.size > (this.config.maxPresetCount ?? 128))
      throw ccerr('ColorCorrectionInvariantViolation', 'Preset registry exceeds bound');
  }
  async shutdown() {
    if (this.shutdownFlag) return;
    this.shutdownFlag = true;
    for (const b of [...this.backends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    ))
      await b.shutdown({ nowNs: this.now });
    this.active.clear();
    this.cache.clear();
    this.inc({}, 'ColorCorrectionShutdown');
  }
}
export const createColorCorrectionEngine = (
  config?: ConstructorParameters<typeof DefaultColorCorrectionEngine>[0],
) => new DefaultColorCorrectionEngine(config);
export const createSyntheticColorCorrectionBackend = (
  options?: ConstructorParameters<typeof SyntheticColorCorrectionBackend>[0],
) => new SyntheticColorCorrectionBackend(options);

export class ColorCorrectionPipelineStage implements VideoFramePipelineStage {
  readonly descriptor: VideoPipelineStageDescriptor;
  constructor(
    private readonly engine: DefaultColorCorrectionEngine,
    private readonly frameMemory: FrameMemoryManager,
    descriptor: Partial<VideoPipelineStageDescriptor> = {},
  ) {
    this.descriptor = deepFreezeColorCorrection({
      stageId: 'color-correction',
      stageKind: 'COLOR_CORRECTION',
      displayName: 'Color Correction',
      version: '5.3.6',
      phase: 'TRANSFORM',
      order: 360,
      dependencies: ['color-conversion'],
      requiredInputMediaKinds: ['VIDEO'],
      supportedInputFormats: ['RGBA8', 'BGRA8', 'RGB24', 'RGBA16F', 'RGBA32F'],
      supportedOutputFormats: ['RGBA8', 'BGRA8', 'RGB24', 'RGBA16F', 'RGBA32F'],
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
      metadata: {},
      ...descriptor,
    });
  }
  initialize() {
    return { status: 'READY' as const };
  }
  async process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> {
    const result = await this.engine.correct(
      {
        requestId: `${context.requestId}:color-correction`,
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
          release() {},
        },
        expectedFrameGeneration: input.inputFrame.frameGeneration,
        expectedStorageGeneration: input.inputFrame.storageGeneration,
        inputFormat: String(
          input.inputFrame.format['format'] ?? input.inputFrame.format['pixelFormat'] ?? 'RGBA8',
        ),
        parameterPolicy: 'REJECT_OUT_OF_RANGE',
        correctionIntent: 'OPERATOR_ADJUSTMENT',
        pipelineConfigurationGeneration: context.configuration.generation,
        ...(context.cancellationSignal ? { cancellationSignal: context.cancellationSignal } : {}),
        targetOutputProfile: context.configuration.outputProfile,
      },
      { frameMemory: this.frameMemory, nowNs: context.nowNs },
    );
    const outFrame = result.outputFrame ?? input.inputFrame;
    return {
      status:
        result.status === 'COMPLETED'
          ? 'COMPLETED'
          : result.status === 'PASSED_THROUGH'
            ? 'PASSED_THROUGH'
            : 'FAILED',
      output: deepFreezeColorCorrection({
        stageId: this.descriptor.stageId,
        status:
          result.status === 'COMPLETED'
            ? 'COMPLETED'
            : result.status === 'PASSED_THROUGH'
              ? 'PASSED_THROUGH'
              : 'FAILED',
        inputFrameId: input.inputFrame.frameId,
        outputFrameId: outFrame.frameId,
        outputLeaseId: outFrame.leaseId,
        outputGeneration: outFrame.frameGeneration,
        passThrough: result.passThrough,
        producedNewFrame: result.correctionApplied,
        timestampPreserved:
          outFrame.sourceTimestampNs === input.inputFrame.sourceTimestampNs &&
          outFrame.normalizedTimestampNs === input.inputFrame.normalizedTimestampNs,
        sourceIdentityPreserved: outFrame.sourceId === input.inputFrame.sourceId,
        durationNs: result.durationNs,
        warnings: result.warnings.map((w) => ({ code: 'COLOR_CORRECTION', message: w })),
        metadata: { colorCorrectionResult: safe(result) },
      }),
    };
  }
  shutdown() {}
}
export const createColorCorrectionPipelineStage = (
  engine: DefaultColorCorrectionEngine,
  frameMemory: FrameMemoryManager,
  descriptor?: Partial<VideoPipelineStageDescriptor>,
) => new ColorCorrectionPipelineStage(engine, frameMemory, descriptor);

export const COLOR_CORRECTION_COMMAND_TYPES = Object.freeze([
  'COLOR_CORRECTION_REGISTER_BACKEND',
  'COLOR_CORRECTION_UNREGISTER_BACKEND',
  'COLOR_CORRECTION_REGISTER_PRESET',
  'COLOR_CORRECTION_UNREGISTER_PRESET',
  'COLOR_CORRECTION_PLAN',
  'COLOR_CORRECTION_EXECUTE',
  'COLOR_CORRECTION_CANCEL',
  'COLOR_CORRECTION_SET_PARAMETERS',
  'COLOR_CORRECTION_APPLY_PRESET',
  'COLOR_CORRECTION_CLEAR_PRESETS',
  'COLOR_CORRECTION_CLEAR_PLAN_CACHE',
  'COLOR_CORRECTION_SET_DEFAULT_BACKEND',
  'COLOR_CORRECTION_SET_QUALITY',
  'COLOR_CORRECTION_VALIDATE',
  'COLOR_CORRECTION_SHUTDOWN',
] as const);
export const COLOR_CORRECTION_OUTPUT_KEYS = Object.freeze({
  requests: 'colorCorrection.requests',
  plans: 'colorCorrection.plans',
  results: 'colorCorrection.results',
  correctedFrameReferences: 'colorCorrection.correctedFrameReferences',
  passThroughReferences: 'colorCorrection.passThroughReferences',
  failedResults: 'colorCorrection.failedResults',
  health: 'colorCorrection.health',
  telemetry: 'colorCorrection.telemetry',
  activePresetSummaries: 'colorCorrection.activePresetSummaries',
});
export const COLOR_CORRECTION_WATCHDOG_INCIDENTS = Object.freeze([
  'COLOR_CORRECTION_STALLED',
  'COLOR_CORRECTION_BACKEND_FAILED',
  'COLOR_CORRECTION_TIMEOUT',
  'COLOR_CORRECTION_PARAMETERS_INVALID',
  'COLOR_CORRECTION_PRESET_INVALID',
  'COLOR_CORRECTION_UNSUPPORTED_LUT',
  'COLOR_CORRECTION_EXCESSIVE_CLAMPING',
  'COLOR_CORRECTION_PRECISION_LOSS_HIGH',
  'COLOR_CORRECTION_TEMP_MEMORY_PRESSURE',
  'COLOR_CORRECTION_GPU_RESOURCE_LOST',
  'COLOR_CORRECTION_ALLOCATION_FAILED',
  'COLOR_CORRECTION_STALE_GENERATION',
  'COLOR_CORRECTION_PLAN_CACHE_INVALID',
  'COLOR_CORRECTION_GRAPH_MISMATCH',
  'COLOR_CORRECTION_INVARIANT_FAILURE',
] as const);
export const COLOR_CORRECTION_EVENTS = Object.freeze([
  'ColorCorrectionEngineCreated',
  'ColorCorrectionBackendRegistered',
  'ColorCorrectionBackendUnregistered',
  'ColorCorrectionPresetRegistered',
  'ColorCorrectionPresetUnregistered',
  'ColorCorrectionPlanRequested',
  'ColorCorrectionPlanCreated',
  'ColorCorrectionPlanRejected',
  'ColorCorrectionPlanCacheHit',
  'ColorCorrectionStarted',
  'ColorCorrectionCompleted',
  'ColorCorrectionPassedThrough',
  'ColorCorrectionFailed',
  'ColorCorrectionDropped',
  'ColorCorrectionCancelled',
  'ColorCorrectionPresetApplied',
  'ColorCorrectionParameterClamped',
  'ColorCorrectionPrecisionWarning',
  'ColorCorrectionBackendFallback',
  'ColorCorrectionTimeout',
  'ColorCorrectionGpuLost',
  'ColorCorrectionHealthChanged',
  'ColorCorrectionShutdown',
] as const);
