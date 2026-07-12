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

type JsonSafe =
  string | number | boolean | null | readonly JsonSafe[] | { readonly [key: string]: JsonSafe };
const now = () => BigInt(Date.now()) * 1_000_000n;
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
const hash = (s: string) =>
  Array.from(s)
    .reduce((h, ch) => ((h * 33) ^ ch.charCodeAt(0)) >>> 0, 2166136261)
    .toString(36);
const id = (p: string, s: string) => `${p}-${hash(s)}`;
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const c of Object.values(v as Record<string, unknown>)) freeze(c);
  }
  return v as Readonly<T>;
};
const cloneFreeze = <T>(v: T): Readonly<T> => freeze(structuredClone(v));
const redact =
  /token|secret|password|credential|cookie|path|url|handle|pointer|native|pixel|tensor|biometric|face|identity|device/i;
const safe = (v: unknown, d = 0): JsonSafe => {
  if (d > 4) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v as JsonSafe;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => safe(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 96)
        .map(([k, val]) => [k, redact.test(k) ? '[REDACTED]' : safe(val, d + 1)]),
    );
  return String(v);
};
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
export class AiBackgroundError extends RuntimeEngineError {}
const err = (c: string, m: string, details: Record<string, unknown> = {}) =>
  new AiBackgroundError(
    c,
    m,
    Object.fromEntries(Object.entries(details).map(([k, v]) => [k, safe(v)])),
  );
export class AiBackgroundBackendNotFound extends AiBackgroundError {
  constructor(id: string) {
    super('AiBackgroundBackendNotFound', `AI background backend ${id} was not found`, { id });
  }
}
export class DuplicateAiBackgroundBackend extends AiBackgroundError {
  constructor(id: string) {
    super('DuplicateAiBackgroundBackend', `Duplicate AI background backend ${id}`, { id });
  }
}
export class AiBackgroundModelNotFound extends AiBackgroundError {
  constructor(id: string) {
    super('AiBackgroundModelNotFound', `AI background model ${id} was not found`, { id });
  }
}
export class DuplicateAiBackgroundModel extends AiBackgroundError {
  constructor(id: string) {
    super('DuplicateAiBackgroundModel', `Duplicate AI background model ${id}`, { id });
  }
}
export class AiBackgroundParametersInvalid extends AiBackgroundError {
  constructor(m: string, d: Record<string, unknown> = {}) {
    super('AiBackgroundParametersInvalid', m, d);
  }
}
export class AiBackgroundParameterOutOfRange extends AiBackgroundError {
  constructor(m: string, d: Record<string, unknown> = {}) {
    super('AiBackgroundParameterOutOfRange', m, d);
  }
}
export type BackgroundProcessingMode =
  | 'PERSON_SEGMENTATION'
  | 'FOREGROUND_SEGMENTATION'
  | 'BACKGROUND_REMOVAL'
  | 'TRANSPARENT_BACKGROUND'
  | 'BACKGROUND_BLUR'
  | 'BACKGROUND_REPLACEMENT'
  | 'BACKGROUND_COLOR'
  | 'MATTE_ONLY'
  | 'FOREGROUND_ONLY'
  | 'BACKGROUND_ONLY'
  | 'VIRTUAL_BACKGROUND'
  | 'BYPASS'
  | 'CUSTOM';
export type AiBackgroundSubjectType =
  'PERSON' | 'MULTIPLE_PERSONS' | 'FOREGROUND_GENERAL' | 'PRESENTER' | 'CUSTOM';
export type BackgroundParameterPolicy =
  'REJECT_OUT_OF_RANGE' | 'CLAMP_TO_SUPPORTED_RANGE' | 'WARN_AND_CLAMP' | 'BACKEND_DEFAULT';
export type BackgroundOutputMode =
  | 'FOREGROUND_WITH_ALPHA'
  | 'PREMULTIPLIED_FOREGROUND'
  | 'STRAIGHT_ALPHA_FOREGROUND'
  | 'MATTE_ONLY'
  | 'BACKGROUND_ONLY'
  | 'COMPOSITING_PAIR'
  | 'REPLACED_BACKGROUND_FRAME'
  | 'BLURRED_BACKGROUND_FRAME'
  | 'PASSTHROUGH'
  | 'DIAGNOSTIC_SEGMENTATION_VIEW';
export type BackgroundSourceType =
  | 'TRANSPARENT'
  | 'SOLID_COLOR'
  | 'IMAGE_ASSET_REFERENCE'
  | 'VIDEO_ASSET_REFERENCE'
  | 'LIVE_SOURCE_REFERENCE'
  | 'BLURRED_ORIGINAL'
  | 'GENERATED_REFERENCE'
  | 'VIRTUAL_SET_REFERENCE'
  | 'CUSTOM';
export type BackgroundReplacementPolicy =
  | 'FAIL_IF_BACKGROUND_MISSING'
  | 'USE_TRANSPARENT'
  | 'USE_SOLID_COLOR'
  | 'USE_ORIGINAL_BACKGROUND'
  | 'HOLD_LAST_VALID_BACKGROUND'
  | 'DROP_FRAME'
  | 'REQUEST_OPERATOR_INTERVENTION';
export type AiBackgroundBackendType =
  'GPU_INFERENCE' | 'CPU_INFERENCE' | 'PLATFORM_ML' | 'REMOTE_INFERENCE' | 'SYNTHETIC';
export type AiBackgroundQualityTier = 'FAST' | 'BALANCED' | 'HIGH_QUALITY' | 'REFERENCE';
export type AiBackgroundConfidencePolicy =
  | 'FAIL_BELOW_THRESHOLD'
  | 'PASS_THROUGH_BELOW_THRESHOLD'
  | 'USE_KEY_MATTE_FALLBACK'
  | 'USE_MASK_FALLBACK'
  | 'HOLD_LAST_VALID_MATTE'
  | 'DEGRADE_OUTPUT'
  | 'REQUEST_OPERATOR_INTERVENTION';
export type AiBackgroundFailurePolicy =
  | 'FAIL_FRAME'
  | 'DROP_FRAME'
  | 'PASS_THROUGH_IF_OPTIONAL'
  | 'USE_KEY_MATTE_FALLBACK'
  | 'USE_MASK_FALLBACK'
  | 'HOLD_LAST_VALID_MATTE'
  | 'USE_ORIGINAL_BACKGROUND'
  | 'DEGRADE_PIPELINE'
  | 'REQUEST_FALLBACK_BACKEND'
  | 'DISABLE_AI_BACKGROUND_STAGE'
  | 'REQUEST_OPERATOR_INTERVENTION';
export type BackgroundProcessingStatus =
  | 'COMPLETED'
  | 'PASSED_THROUGH'
  | 'DEGRADED'
  | 'LOW_CONFIDENCE'
  | 'FAILED'
  | 'DROPPED'
  | 'CANCELLED'
  | 'REJECTED';
export interface BackgroundRegionOfInterest {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface BackgroundProcessingParameters {
  readonly enabled: boolean;
  readonly mode: BackgroundProcessingMode;
  readonly subjectType: AiBackgroundSubjectType;
  readonly confidenceThreshold: number;
  readonly foregroundThreshold: number;
  readonly backgroundThreshold: number;
  readonly edgeSoftness: number;
  readonly edgeFeather: number;
  readonly edgeChoke: number;
  readonly edgeExpand: number;
  readonly matteGamma: number;
  readonly temporalStabilization: boolean;
  readonly temporalWindowFrames: number;
  readonly temporalSmoothing: number;
  readonly motionSensitivity: number;
  readonly preserveFineHair: boolean;
  readonly preserveSemiTransparentRegions: boolean;
  readonly fillSmallHoles: boolean;
  readonly removeSmallIslands: boolean;
  readonly maximumSubjects: number;
  readonly regionOfInterest?: BackgroundRegionOfInterest;
  readonly outputMode: BackgroundOutputMode;
  readonly fallbackPolicy: AiBackgroundFailurePolicy;
  readonly confidencePolicy: AiBackgroundConfidencePolicy;
  readonly replacementPolicy: BackgroundReplacementPolicy;
  readonly qualityTier: AiBackgroundQualityTier;
  readonly diagnosticsEnabled: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface BackgroundSourceReference {
  readonly type: BackgroundSourceType;
  readonly sourceId?: string;
  readonly assetId?: string;
  readonly generation?: bigint;
  readonly maxAgeFrames?: number;
  readonly color?: readonly [number, number, number, number];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface AiBackgroundBackendDescriptor {
  readonly backendId: string;
  readonly displayName: string;
  readonly backendType: AiBackgroundBackendType;
  readonly version: string;
  readonly deterministic: boolean;
  readonly requiresGpu: boolean;
  readonly maximumSubjects: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface AiBackgroundCapability {
  readonly modes: readonly BackgroundProcessingMode[];
  readonly subjectTypes: readonly AiBackgroundSubjectType[];
  readonly inputFormats: readonly string[];
  readonly memoryDomains: readonly string[];
  readonly qualityTiers: readonly AiBackgroundQualityTier[];
  readonly maximumSubjects: number;
  readonly supportsTemporalState: boolean;
  readonly supportsAlphaDetail: boolean;
  readonly supportsHairDetail: boolean;
  readonly supportsSemiTransparency: boolean;
}
export interface AiBackgroundModelDescriptor {
  readonly modelId: string;
  readonly modelVersion: string;
  readonly modelFamily: string;
  readonly modelChecksum: string;
  readonly backendId: string;
  readonly supportedModes: readonly BackgroundProcessingMode[];
  readonly supportedSubjectTypes: readonly AiBackgroundSubjectType[];
  readonly supportedInputFormats: readonly string[];
  readonly supportedDimensions: Readonly<{
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  }>;
  readonly supportedMemoryDomains: readonly string[];
  readonly maximumSubjects: number;
  readonly qualityTiers: readonly AiBackgroundQualityTier[];
  readonly requiresGpu: boolean;
  readonly supportsTemporalState: boolean;
  readonly supportsAlphaDetail: boolean;
  readonly supportsHairDetail: boolean;
  readonly supportsSemiTransparency: boolean;
  readonly expectedInputColorMetadata: Readonly<Record<string, unknown>>;
  readonly modelOrigin: 'SYNTHETIC_BUILT_IN' | 'LOCAL_REFERENCE' | 'OPERATOR_REGISTERED_METADATA';
  readonly licenseReference: string;
  readonly privacyClassification: 'NON_BIOMETRIC_SEGMENTATION' | 'METADATA_ONLY_SYNTHETIC';
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface BackgroundProcessingPlanRequest {
  readonly requestId: string;
  readonly inputFrame: Readonly<VideoPipelineFrameReference>;
  readonly parameters: BackgroundProcessingParameters;
  readonly selectedModelId?: string;
  readonly backendPreference?: string;
  readonly qualityTier?: AiBackgroundQualityTier;
  readonly parameterPolicy?: BackgroundParameterPolicy;
  readonly keyMatteGeneration?: bigint;
  readonly maskGeneration?: bigint;
  readonly backgroundSourceGeneration?: bigint;
  readonly deviceGeneration?: bigint;
  readonly pipelineConfigurationGeneration?: bigint;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface BackgroundProcessingPlan {
  readonly planId: string;
  readonly inputFormat: Readonly<Record<string, JsonSafe>>;
  readonly inputColorMetadata: Readonly<Record<string, JsonSafe>>;
  readonly inputAlphaMode: string;
  readonly processingMode: BackgroundProcessingMode;
  readonly subjectType: AiBackgroundSubjectType;
  readonly effectiveParameters: BackgroundProcessingParameters;
  readonly selectedModelId: string;
  readonly selectedModelVersion: string;
  readonly selectedBackendId: string;
  readonly operationOrder: readonly string[];
  readonly passThroughEligible: boolean;
  readonly requiresInference: boolean;
  readonly requiresNewOutput: boolean;
  readonly requiresMatteOutput: boolean;
  readonly requiresForegroundOutput: boolean;
  readonly requiresBackgroundOutput: boolean;
  readonly requiresComposition: boolean;
  readonly requiresTemporalState: boolean;
  readonly requiresTemporarySurfaces: boolean;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly estimatedOperationCount: number;
  readonly estimatedInferenceCost: number;
  readonly confidencePolicy: AiBackgroundConfidencePolicy;
  readonly fallbackPolicy: AiBackgroundFailurePolicy;
  readonly outputMode: BackgroundOutputMode;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export type BackgroundProcessingPlanCandidate = Omit<
  BackgroundProcessingPlan,
  'planId' | 'selectedBackendId' | 'selectedModelId' | 'selectedModelVersion'
> & {
  readonly backendId: string;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly modelChecksum: string;
};
export interface BackgroundTemporalState {
  readonly sourceId: string;
  readonly streamId: string;
  readonly stateGeneration: bigint;
  readonly modelId: string;
  readonly modelVersion: string;
  readonly recentMatteSummaries: readonly Readonly<Record<string, JsonSafe>>[];
  readonly confidenceSummaries: readonly number[];
  readonly motionSummaries: readonly number[];
  readonly lastRuntimeFrame: bigint;
  readonly lastTimestampNs: bigint;
  readonly discontinuity: boolean;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface BackgroundProcessingOutputLeases {
  readonly foreground?: FrameLease | undefined;
  readonly matte?: FrameLease | undefined;
  readonly background?: FrameLease | undefined;
  readonly composed?: FrameLease | undefined;
}
export interface AiBackgroundBackendResult {
  readonly confidence: number;
  readonly signature: string;
  readonly temporalState?: BackgroundTemporalState | undefined;
  readonly edgeRefinementApplied: boolean;
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface AiBackgroundBackendContext {
  readonly models: readonly AiBackgroundModelDescriptor[];
  readonly nowNs: () => bigint;
}
export interface AiBackgroundBackendRuntimeContext extends AiBackgroundBackendContext {
  readonly cancellationSignal?: AbortSignal;
  readonly deadlineNs?: bigint;
}
export interface AiBackgroundBackendShutdownContext {
  readonly nowNs: () => bigint;
}
export interface AiBackgroundBackend {
  readonly descriptor: AiBackgroundBackendDescriptor;
  getCapabilities(): readonly Readonly<AiBackgroundCapability>[];
  createPlan(
    request: BackgroundProcessingPlanRequest,
    context: AiBackgroundBackendContext,
  ): BackgroundProcessingPlanCandidate | undefined;
  execute(
    plan: BackgroundProcessingPlan,
    input: VideoPipelineFrameReference,
    outputs: BackgroundProcessingOutputLeases,
    temporalState: Readonly<BackgroundTemporalState> | undefined,
    context: AiBackgroundBackendRuntimeContext,
  ): Promise<AiBackgroundBackendResult>;
  resetTemporalState?(sourceId: string, streamId: string): Promise<void>;
  shutdown(context: AiBackgroundBackendShutdownContext): Promise<void>;
}
export interface BackgroundProcessingRequest extends BackgroundProcessingPlanRequest {
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputLeaseId: string;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly optionalKeyMatteReference?: Readonly<VideoPipelineFrameReference>;
  readonly optionalMaskReference?: Readonly<VideoPipelineFrameReference>;
  readonly optionalBackgroundSourceReference?: BackgroundSourceReference;
  readonly deadlineNs?: bigint;
  readonly correlationId?: string;
  readonly cancellationSignal?: AbortSignal;
}
export interface BackgroundProcessingResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId?: string | undefined;
  readonly modelId?: string | undefined;
  readonly modelVersion?: string | undefined;
  readonly status: BackgroundProcessingStatus;
  readonly inputFrameId: string;
  readonly foregroundReference?: Readonly<VideoPipelineFrameReference> | undefined;
  readonly matteReference?: Readonly<VideoPipelineFrameReference> | undefined;
  readonly backgroundReference?: Readonly<VideoPipelineFrameReference> | undefined;
  readonly composedOutputReference?: Readonly<VideoPipelineFrameReference> | undefined;
  readonly passThrough: boolean;
  readonly processingApplied: boolean;
  readonly mode: BackgroundProcessingMode;
  readonly subjectType: AiBackgroundSubjectType;
  readonly confidence?: number | undefined;
  readonly confidencePolicyResult: string;
  readonly temporalStabilizationApplied: boolean;
  readonly edgeRefinementApplied: boolean;
  readonly blurApplied: boolean;
  readonly replacementApplied: boolean;
  readonly fallbackUsed?: string | undefined;
  readonly effectiveParameters: BackgroundProcessingParameters;
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: bigint;
  readonly ownershipTransfer: Readonly<Record<string, boolean>>;
  readonly completedAtNs: bigint;
}
export const AI_BACKGROUND_OPERATION_ORDER = freeze([
  'validate input',
  'validate parameters',
  'resolve model and backend',
  'validate ROI',
  'validate optional key/mask input',
  'allocate model input surface if needed',
  'execute segmentation',
  'validate confidence',
  'refine matte',
  'stabilize temporal matte',
  'generate foreground/background outputs',
  'invoke blur or replacement dependency if required',
  'validate output generations',
  'release temporary resources',
] as const);
export const AI_BACKGROUND_OUTPUT_KEYS = freeze({
  requests: 'ai-background.requests',
  plans: 'ai-background.plans',
  results: 'ai-background.results',
  foregroundReferences: 'ai-background.foreground',
  matteReferences: 'ai-background.matte',
  backgroundReferences: 'ai-background.background',
  composedOutputReferences: 'ai-background.composed',
  passThroughReferences: 'ai-background.passThrough',
  lowConfidenceResults: 'ai-background.lowConfidence',
  failedResults: 'ai-background.failed',
  health: 'ai-background.health',
  telemetry: 'ai-background.telemetry',
  activeModelSummaries: 'ai-background.activeModels',
});
export const AI_BACKGROUND_COMMAND_TYPES = freeze([
  'AI_BACKGROUND_REGISTER_BACKEND',
  'AI_BACKGROUND_UNREGISTER_BACKEND',
  'AI_BACKGROUND_REGISTER_MODEL',
  'AI_BACKGROUND_UNREGISTER_MODEL',
  'AI_BACKGROUND_ACTIVATE_MODEL',
  'AI_BACKGROUND_DEACTIVATE_MODEL',
  'AI_BACKGROUND_PLAN',
  'AI_BACKGROUND_EXECUTE',
  'AI_BACKGROUND_CANCEL',
  'AI_BACKGROUND_SET_PARAMETERS',
  'AI_BACKGROUND_SET_MODE',
  'AI_BACKGROUND_SET_BACKGROUND',
  'AI_BACKGROUND_SET_CONFIDENCE_POLICY',
  'AI_BACKGROUND_RESET_TEMPORAL_STATE',
  'AI_BACKGROUND_CLEAR_PLAN_CACHE',
  'AI_BACKGROUND_SET_DEFAULT_BACKEND',
  'AI_BACKGROUND_SET_QUALITY',
  'AI_BACKGROUND_VALIDATE',
  'AI_BACKGROUND_SHUTDOWN',
] as const);
export const AI_BACKGROUND_EVENTS = freeze([
  'AI_BACKGROUND_ENGINE_CREATED',
  'AI_BACKGROUND_BACKEND_REGISTERED',
  'AI_BACKGROUND_BACKEND_UNREGISTERED',
  'AI_BACKGROUND_MODEL_REGISTERED',
  'AI_BACKGROUND_MODEL_UNREGISTERED',
  'AI_BACKGROUND_MODEL_ACTIVATED',
  'AI_BACKGROUND_MODEL_DEACTIVATED',
  'AI_BACKGROUND_PLAN_REQUESTED',
  'AI_BACKGROUND_PLAN_CREATED',
  'AI_BACKGROUND_PLAN_REJECTED',
  'AI_BACKGROUND_PLAN_CACHE_HIT',
  'AI_BACKGROUND_PROCESSING_STARTED',
  'AI_BACKGROUND_PROCESSING_COMPLETED',
  'AI_BACKGROUND_PROCESSING_PASSED_THROUGH',
  'AI_BACKGROUND_SEGMENTATION_COMPLETED',
  'AI_BACKGROUND_CONFIDENCE_LOW',
  'AI_BACKGROUND_MATTE_GENERATED',
  'AI_BACKGROUND_TEMPORAL_STATE_RESET',
  'AI_BACKGROUND_BACKGROUND_BLURRED',
  'AI_BACKGROUND_BACKGROUND_REPLACED',
  'AI_BACKGROUND_FALLBACK_USED',
  'AI_BACKGROUND_PROCESSING_FAILED',
  'AI_BACKGROUND_PROCESSING_DROPPED',
  'AI_BACKGROUND_PROCESSING_CANCELLED',
  'AI_BACKGROUND_TIMEOUT',
  'AI_BACKGROUND_GPU_LOSS',
  'AI_BACKGROUND_HEALTH_CHANGE',
  'AI_BACKGROUND_SHUTDOWN',
] as const);
export const AI_BACKGROUND_WATCHDOG_INCIDENTS = freeze([
  'AI_BACKGROUND_STALLED',
  'AI_BACKGROUND_BACKEND_FAILED',
  'AI_BACKGROUND_MODEL_INVALID',
  'AI_BACKGROUND_MODEL_UNAVAILABLE',
  'AI_BACKGROUND_TIMEOUT',
  'AI_BACKGROUND_PARAMETERS_INVALID',
  'AI_BACKGROUND_SEGMENTATION_FAILED',
  'AI_BACKGROUND_CONFIDENCE_LOW',
  'AI_BACKGROUND_TEMPORAL_STATE_INVALID',
  'AI_BACKGROUND_HELD_MATTE_PRESSURE',
  'AI_BACKGROUND_MASK_INVALID',
  'AI_BACKGROUND_KEY_MATTE_INVALID',
  'AI_BACKGROUND_SOURCE_INVALID',
  'AI_BACKGROUND_BLUR_DEPENDENCY_FAILED',
  'AI_BACKGROUND_TEMP_MEMORY_PRESSURE',
  'AI_BACKGROUND_GPU_RESOURCE_LOST',
  'AI_BACKGROUND_ALLOCATION_FAILED',
  'AI_BACKGROUND_STALE_GENERATION',
  'AI_BACKGROUND_PLAN_CACHE_INVALID',
  'AI_BACKGROUND_GRAPH_MISMATCH',
  'AI_BACKGROUND_PRIVACY_POLICY_VIOLATION',
  'AI_BACKGROUND_INVARIANT_FAILURE',
] as const);
export const createDefaultBackgroundProcessingParameters = (
  p: Partial<BackgroundProcessingParameters> = {},
): BackgroundProcessingParameters =>
  cloneFreeze({
    enabled: true,
    mode: 'PERSON_SEGMENTATION',
    subjectType: 'PERSON',
    confidenceThreshold: 0.55,
    foregroundThreshold: 0.65,
    backgroundThreshold: 0.35,
    edgeSoftness: 0.2,
    edgeFeather: 0,
    edgeChoke: 0,
    edgeExpand: 0,
    matteGamma: 1,
    temporalStabilization: true,
    temporalWindowFrames: 4,
    temporalSmoothing: 0.5,
    motionSensitivity: 0.5,
    preserveFineHair: false,
    preserveSemiTransparentRegions: false,
    fillSmallHoles: true,
    removeSmallIslands: true,
    maximumSubjects: 1,
    outputMode: 'FOREGROUND_WITH_ALPHA',
    fallbackPolicy: 'FAIL_FRAME',
    confidencePolicy: 'FAIL_BELOW_THRESHOLD',
    replacementPolicy: 'FAIL_IF_BACKGROUND_MISSING',
    qualityTier: 'BALANCED',
    diagnosticsEnabled: false,
    metadata: {},
    ...p,
  });
const modes = new Set<BackgroundProcessingMode>([
  'PERSON_SEGMENTATION',
  'FOREGROUND_SEGMENTATION',
  'BACKGROUND_REMOVAL',
  'TRANSPARENT_BACKGROUND',
  'BACKGROUND_BLUR',
  'BACKGROUND_REPLACEMENT',
  'BACKGROUND_COLOR',
  'MATTE_ONLY',
  'FOREGROUND_ONLY',
  'BACKGROUND_ONLY',
  'VIRTUAL_BACKGROUND',
  'BYPASS',
  'CUSTOM',
]);
const subjects = new Set<AiBackgroundSubjectType>([
  'PERSON',
  'MULTIPLE_PERSONS',
  'FOREGROUND_GENERAL',
  'PRESENTER',
  'CUSTOM',
]);
const tiers = new Set<AiBackgroundQualityTier>(['FAST', 'BALANCED', 'HIGH_QUALITY', 'REFERENCE']);
export function validateBackgroundProcessingParameters(
  input: Partial<BackgroundProcessingParameters>,
  policy: BackgroundParameterPolicy = 'REJECT_OUT_OF_RANGE',
): BackgroundProcessingParameters {
  const p = createDefaultBackgroundProcessingParameters(input);
  const bad = (m: string, d: Record<string, unknown> = {}) => {
    if (policy === 'REJECT_OUT_OF_RANGE' || policy === 'BACKEND_DEFAULT')
      throw new AiBackgroundParameterOutOfRange(m, d);
  };
  const nums: [keyof BackgroundProcessingParameters, number, number][] = [
    ['confidenceThreshold', 0, 1],
    ['foregroundThreshold', 0, 1],
    ['backgroundThreshold', 0, 1],
    ['edgeSoftness', 0, 1],
    ['edgeFeather', 0, 128],
    ['edgeChoke', 0, 128],
    ['edgeExpand', 0, 128],
    ['matteGamma', 0.01, 8],
    ['temporalSmoothing', 0, 1],
    ['motionSensitivity', 0, 1],
  ];
  for (const [k, min, max] of nums) {
    const v = p[k];
    if (!finite(v)) throw new AiBackgroundParametersInvalid(`Invalid ${String(k)}`, { [k]: v });
    if ((v as number) < min || (v as number) > max)
      bad(`${String(k)} out of range`, { [k]: v, min, max });
  }
  if (
    !Number.isInteger(p.temporalWindowFrames) ||
    p.temporalWindowFrames < 0 ||
    p.temporalWindowFrames > 30
  )
    bad('temporalWindowFrames out of range', { temporalWindowFrames: p.temporalWindowFrames });
  if (!Number.isInteger(p.maximumSubjects) || p.maximumSubjects < 1 || p.maximumSubjects > 16)
    bad('maximumSubjects out of range', { maximumSubjects: p.maximumSubjects });
  if (p.backgroundThreshold > p.foregroundThreshold)
    throw new AiBackgroundParametersInvalid(
      'backgroundThreshold cannot exceed foregroundThreshold',
    );
  if (!modes.has(p.mode))
    throw err('AiBackgroundModeUnsupported', 'unsupported mode', { mode: p.mode });
  if (!subjects.has(p.subjectType))
    throw err('AiBackgroundSubjectUnsupported', 'unsupported subject', {
      subjectType: p.subjectType,
    });
  if (!tiers.has(p.qualityTier))
    throw new AiBackgroundParametersInvalid('unsupported quality tier', {
      qualityTier: p.qualityTier,
    });
  if (p.regionOfInterest) {
    const r = p.regionOfInterest;
    if (
      !finite(r.x) ||
      !finite(r.y) ||
      !finite(r.width) ||
      !finite(r.height) ||
      r.x < 0 ||
      r.y < 0 ||
      r.width <= 0 ||
      r.height <= 0 ||
      r.x + r.width > 1 ||
      r.y + r.height > 1
    )
      throw new AiBackgroundParametersInvalid('invalid ROI', { roi: r });
  }
  return cloneFreeze(p);
}
export const createSyntheticAiBackgroundModel = (
  backendId = 'synthetic-ai-background-reference',
): AiBackgroundModelDescriptor =>
  cloneFreeze({
    modelId: 'synthetic-ai-background-person-v1',
    modelVersion: '5.4.5-synthetic.1',
    modelFamily: 'synthetic-segmentation',
    modelChecksum: 'sha256:synthetic-ai-background-v5.4.5',
    backendId,
    supportedModes: [...modes],
    supportedSubjectTypes: [...subjects],
    supportedInputFormats: ['RGBA8', 'BGRA8', 'NV12', 'I420', 'UNKNOWN'],
    supportedDimensions: { minWidth: 1, minHeight: 1, maxWidth: 8192, maxHeight: 8192 },
    supportedMemoryDomains: ['CPU', 'GPU', 'OPAQUE', 'SYNTHETIC'],
    maximumSubjects: 4,
    qualityTiers: ['FAST', 'BALANCED', 'HIGH_QUALITY', 'REFERENCE'],
    requiresGpu: false,
    supportsTemporalState: true,
    supportsAlphaDetail: true,
    supportsHairDetail: true,
    supportsSemiTransparency: true,
    expectedInputColorMetadata: {},
    modelOrigin: 'SYNTHETIC_BUILT_IN',
    licenseReference: 'UBOS synthetic metadata only',
    privacyClassification: 'METADATA_ONLY_SYNTHETIC',
    metadata: { synthetic: true, noRealInference: true },
  });
export class SyntheticAiBackgroundBackend implements AiBackgroundBackend {
  readonly descriptor: AiBackgroundBackendDescriptor;
  constructor(
    private opts: Readonly<{
      backendId?: string;
      fail?: boolean;
      timeout?: boolean;
      gpuLoss?: boolean;
      confidence?: number;
    }> = {},
  ) {
    this.descriptor = cloneFreeze({
      backendId: opts.backendId ?? 'synthetic-ai-background-reference',
      displayName: 'Deterministic Synthetic AI Background Backend',
      backendType: 'SYNTHETIC',
      version: '5.4.5',
      deterministic: true,
      requiresGpu: false,
      maximumSubjects: 4,
      metadata: { noRealInference: true },
    });
  }
  getCapabilities(): readonly Readonly<AiBackgroundCapability>[] {
    return cloneFreeze<AiBackgroundCapability[]>([
      {
        modes: [...modes],
        subjectTypes: [...subjects],
        inputFormats: ['RGBA8', 'BGRA8', 'NV12', 'I420', 'UNKNOWN'],
        memoryDomains: ['CPU', 'GPU', 'OPAQUE', 'SYNTHETIC'],
        qualityTiers: ['FAST', 'BALANCED', 'HIGH_QUALITY', 'REFERENCE'],
        maximumSubjects: 4,
        supportsTemporalState: true,
        supportsAlphaDetail: true,
        supportsHairDetail: true,
        supportsSemiTransparency: true,
      },
    ]);
  }
  createPlan(r: BackgroundProcessingPlanRequest, ctx: AiBackgroundBackendContext) {
    const m = ctx.models.find(
      (x) =>
        x.backendId === this.descriptor.backendId &&
        (!r.selectedModelId || x.modelId === r.selectedModelId),
    );
    if (!m) return undefined;
    const p = r.parameters;
    if (
      !m.supportedModes.includes(p.mode) ||
      !m.supportedSubjectTypes.includes(p.subjectType) ||
      p.maximumSubjects > m.maximumSubjects
    )
      return undefined;
    const pt =
      (!p.enabled && p.mode === 'BYPASS') ||
      (p.mode === 'BYPASS' && p.outputMode === 'PASSTHROUGH');
    const w = Number(r.inputFrame.format.width ?? 1),
      h = Number(r.inputFrame.format.height ?? 1),
      bytes = Math.max(1, w * h * 4);
    const matte =
      [
        'MATTE_ONLY',
        'FOREGROUND_WITH_ALPHA',
        'PREMULTIPLIED_FOREGROUND',
        'STRAIGHT_ALPHA_FOREGROUND',
        'COMPOSITING_PAIR',
        'DIAGNOSTIC_SEGMENTATION_VIEW',
      ].includes(p.outputMode) || !pt;
    return cloneFreeze({
      inputFormat: safe(r.inputFrame.format) as Record<string, JsonSafe>,
      inputColorMetadata: safe(r.inputFrame.metadata.colorMetadata ?? {}) as Record<
        string,
        JsonSafe
      >,
      inputAlphaMode: String(
        r.inputFrame.format.alphaMode ?? r.inputFrame.metadata.alphaMode ?? 'UNKNOWN',
      ),
      processingMode: p.mode,
      subjectType: p.subjectType,
      effectiveParameters: p,
      operationOrder: AI_BACKGROUND_OPERATION_ORDER,
      passThroughEligible: pt,
      requiresInference: !pt,
      requiresNewOutput: !pt,
      requiresMatteOutput: matte && !pt,
      requiresForegroundOutput:
        [
          'FOREGROUND_WITH_ALPHA',
          'PREMULTIPLIED_FOREGROUND',
          'STRAIGHT_ALPHA_FOREGROUND',
          'FOREGROUND_ONLY',
          'COMPOSITING_PAIR',
        ].includes(p.outputMode) && !pt,
      requiresBackgroundOutput:
        [
          'BACKGROUND_ONLY',
          'COMPOSITING_PAIR',
          'BLURRED_BACKGROUND_FRAME',
          'REPLACED_BACKGROUND_FRAME',
        ].includes(p.outputMode) && !pt,
      requiresComposition:
        ['REPLACED_BACKGROUND_FRAME', 'BLURRED_BACKGROUND_FRAME'].includes(p.outputMode) && !pt,
      requiresTemporalState: p.temporalStabilization && !pt,
      requiresTemporarySurfaces: !pt,
      estimatedTemporaryBytes: !pt ? Math.min(bytes, 16_777_216) : 0,
      estimatedOutputBytes: !pt ? bytes * (p.outputMode === 'COMPOSITING_PAIR' ? 3 : 1) : 0,
      estimatedOperationCount: pt ? 1 : AI_BACKGROUND_OPERATION_ORDER.length,
      estimatedInferenceCost: pt
        ? 0
        : p.qualityTier === 'FAST'
          ? 1
          : p.qualityTier === 'BALANCED'
            ? 2
            : p.qualityTier === 'HIGH_QUALITY'
              ? 3
              : 4,
      confidencePolicy: p.confidencePolicy,
      fallbackPolicy: p.fallbackPolicy,
      outputMode: p.outputMode,
      deterministicScore: (pt ? 0 : 10) + (p.qualityTier === 'FAST' ? 0 : 1) + bytes / 1e9,
      warnings: [
        ...(this.descriptor.backendType === 'SYNTHETIC'
          ? ['synthetic backend; no real AI inference claimed']
          : []),
      ],
      metadata: { synthetic: true, privacy: 'metadata-only' },
      backendId: this.descriptor.backendId,
      modelId: m.modelId,
      modelVersion: m.modelVersion,
      modelChecksum: m.modelChecksum,
    });
  }
  async execute(
    plan: BackgroundProcessingPlan,
    input: VideoPipelineFrameReference,
    _outputs: BackgroundProcessingOutputLeases,
    temporalState: Readonly<BackgroundTemporalState> | undefined,
    ctx: AiBackgroundBackendRuntimeContext,
  ) {
    if (ctx.cancellationSignal?.aborted) throw err('AiBackgroundCancelled', 'cancelled');
    if (this.opts.gpuLoss) throw err('AiBackgroundGpuResourceLost', 'gpu loss');
    if (this.opts.timeout || (ctx.deadlineNs !== undefined && ctx.nowNs() > ctx.deadlineNs))
      throw err('AiBackgroundTimeout', 'timeout');
    if (this.opts.fail) throw err('AiBackgroundBackendFailed', 'synthetic failure');
    const confidence =
      this.opts.confidence ??
      0.55 +
        (parseInt(hash(stable({ p: plan.planId, f: input.frameId })).slice(0, 2), 36) % 40) / 100;
    const state: BackgroundTemporalState | undefined = plan.requiresTemporalState
      ? cloneFreeze({
          sourceId: input.sourceId,
          streamId: input.streamId,
          stateGeneration: (temporalState?.stateGeneration ?? 0n) + 1n,
          modelId: plan.selectedModelId,
          modelVersion: plan.selectedModelVersion,
          recentMatteSummaries: [
            ...(temporalState?.recentMatteSummaries ?? []),
            { signature: hash(plan.planId), frame: input.runtimeFrameNumber.toString() },
          ].slice(-plan.effectiveParameters.temporalWindowFrames),
          confidenceSummaries: [...(temporalState?.confidenceSummaries ?? []), confidence].slice(
            -plan.effectiveParameters.temporalWindowFrames,
          ),
          motionSummaries: [
            ...(temporalState?.motionSummaries ?? []),
            plan.effectiveParameters.motionSensitivity,
          ].slice(-plan.effectiveParameters.temporalWindowFrames),
          lastRuntimeFrame: input.runtimeFrameNumber,
          lastTimestampNs: input.normalizedTimestampNs,
          discontinuity: input.discontinuity,
          metadata: { bounded: true, noRawFrames: true },
        })
      : undefined;
    const result: AiBackgroundBackendResult = {
      confidence,
      signature: id('aibgop', stable({ plan: plan.planId, input: input.frameId })),
      temporalState: state,
      edgeRefinementApplied: !!(
        plan.effectiveParameters.edgeFeather ||
        plan.effectiveParameters.edgeChoke ||
        plan.effectiveParameters.edgeExpand ||
        plan.effectiveParameters.edgeSoftness
      ),
      warnings: [],
      temporaryBytes: plan.estimatedTemporaryBytes,
      outputBytes: plan.estimatedOutputBytes,
      metadata: { synthetic: true, noPixels: true },
    };
    return cloneFreeze(result);
  }
  async shutdown() {}
}
export class AiBackgroundProcessingEngine {
  private backends = new Map<string, AiBackgroundBackend>();
  private models = new Map<string, AiBackgroundModelDescriptor>();
  private activeModels = new Set<string>();
  private cache = new Map<string, BackgroundProcessingPlan>();
  private temporal = new Map<string, BackgroundTemporalState>();
  private active = new Set<string>();
  private done = new Set<string>();
  private shutdownFlag = false;
  private defaultBackend = 'synthetic-ai-background-reference';
  private telemetry: any = {
    planRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    processingRequests: 0,
    completions: 0,
    passThrough: 0,
    lowConfidence: 0,
    failures: 0,
    drops: 0,
    cancellations: 0,
    rejections: 0,
    timeouts: 0,
    personSegmentation: 0,
    generalForegroundSegmentation: 0,
    backgroundRemoval: 0,
    backgroundBlur: 0,
    backgroundReplacement: 0,
    matteOnlyOutputs: 0,
    foregroundOutputs: 0,
    backgroundOutputs: 0,
    composedOutputs: 0,
    temporalStabilizationOperations: 0,
    temporalStateResets: 0,
    edgeRefinementOperations: 0,
    keyMatteFallbacks: 0,
    maskFallbacks: 0,
    heldMatteUses: 0,
    heldMatteEvictions: 0,
    backgroundSourceFailures: 0,
    dependencyFailures: 0,
    backendFallback: 0,
    gpuLoss: 0,
    allocationFailure: 0,
    staleGeneration: 0,
    peakTemporaryBytes: 0,
    lastEvent: 'AI_BACKGROUND_ENGINE_CREATED',
  };
  constructor(
    private readonly maxCache = 128,
    private readonly maxModels = 32,
    private readonly clock = now,
  ) {
    const b = new SyntheticAiBackgroundBackend();
    this.registerBackend(b);
    const m = createSyntheticAiBackgroundModel(b.descriptor.backendId);
    this.registerModel(m);
    this.activateModel(m.modelId);
  }
  registerBackend(b: AiBackgroundBackend) {
    if (this.backends.has(b.descriptor.backendId))
      throw new DuplicateAiBackgroundBackend(b.descriptor.backendId);
    if (b.descriptor.backendType === 'REMOTE_INFERENCE')
      throw err('AiBackgroundPrivacyViolation', 'remote inference is not enabled');
    this.backends.set(b.descriptor.backendId, b);
    this.clearPlanCache();
  }
  unregisterBackend(id: string) {
    if (!this.backends.delete(id)) throw new AiBackgroundBackendNotFound(id);
    for (const m of this.models.values())
      if (m.backendId === id && this.activeModels.has(m.modelId))
        throw err('AiBackgroundModelIncompatible', 'cannot remove backend for active model', {
          id,
        });
    this.clearPlanCache();
  }
  registerModel(m: AiBackgroundModelDescriptor) {
    if (this.models.size >= this.maxModels)
      throw err('AiBackgroundModelInvalid', 'model registry bounded');
    if (this.models.has(m.modelId)) throw new DuplicateAiBackgroundModel(m.modelId);
    if (!this.backends.has(m.backendId)) throw new AiBackgroundBackendNotFound(m.backendId);
    if (!m.modelChecksum) throw err('AiBackgroundModelInvalid', 'model checksum required');
    this.models.set(m.modelId, cloneFreeze(m));
    this.clearPlanCache();
  }
  unregisterModel(id: string) {
    if (this.activeModels.has(id))
      throw err('AiBackgroundModelInvalid', 'cannot unregister active model');
    if (!this.models.delete(id)) throw new AiBackgroundModelNotFound(id);
    this.clearPlanCache();
  }
  activateModel(id: string) {
    if (!this.models.has(id)) throw new AiBackgroundModelNotFound(id);
    this.activeModels.add(id);
    this.clearPlanCache();
  }
  deactivateModel(id: string) {
    this.activeModels.delete(id);
    this.clearPlanCache();
  }
  listModels() {
    return cloneFreeze([...this.models.values()]);
  }
  clearPlanCache() {
    this.cache.clear();
  }
  resetTemporalState(sourceId?: string, streamId?: string) {
    for (const k of [...this.temporal.keys()])
      if (!sourceId || k === `${sourceId}/${streamId}`) this.temporal.delete(k);
    this.telemetry.temporalStateResets++;
  }
  createPlan(r: BackgroundProcessingPlanRequest): BackgroundProcessingPlan {
    if (this.shutdownFlag) throw err('AiBackgroundEngineNotReady', 'shutdown');
    const parameters = validateBackgroundProcessingParameters(r.parameters, r.parameterPolicy);
    this.telemetry.planRequests++;
    const key = stable({
      f: r.inputFrame.format,
      c: r.inputFrame.metadata.colorMetadata,
      a: r.inputFrame.format.alphaMode,
      p: parameters,
      m: r.selectedModelId,
      b: r.backendPreference,
      q: r.qualityTier,
      kg: r.keyMatteGeneration,
      mg: r.maskGeneration,
      bg: r.backgroundSourceGeneration,
      d: r.deviceGeneration,
      g: r.pipelineConfigurationGeneration,
    });
    const cached = this.cache.get(key);
    if (cached) {
      this.telemetry.cacheHits++;
      return cached;
    }
    this.telemetry.cacheMisses++;
    const models = [...this.models.values()].filter(
      (m) =>
        this.activeModels.has(m.modelId) && (!r.selectedModelId || m.modelId === r.selectedModelId),
    );
    if (r.selectedModelId && !models.length) throw new AiBackgroundModelNotFound(r.selectedModelId);
    const candidates = [...this.backends.values()]
      .filter(
        (b) =>
          (!r.backendPreference || b.descriptor.backendId === r.backendPreference) &&
          models.some((m) => m.backendId === b.descriptor.backendId),
      )
      .map((b) => b.createPlan({ ...r, parameters }, { models, nowNs: this.clock }))
      .filter(Boolean) as BackgroundProcessingPlanCandidate[];
    if (!candidates.length)
      throw err('AiBackgroundModelIncompatible', 'no compatible model/backend');
    candidates.sort(
      (a, b) =>
        Number(b.effectiveParameters.qualityTier === parameters.qualityTier) -
          Number(a.effectiveParameters.qualityTier === parameters.qualityTier) ||
        a.estimatedTemporaryBytes - b.estimatedTemporaryBytes ||
        a.estimatedInferenceCost - b.estimatedInferenceCost ||
        a.backendId.localeCompare(b.backendId) ||
        a.modelId.localeCompare(b.modelId),
    );
    const c = candidates[0]!;
    const plan = cloneFreeze({
      ...c,
      selectedBackendId: c.backendId,
      selectedModelId: c.modelId,
      selectedModelVersion: c.modelVersion,
      planId: id('aibgplan', stable({ ...c, backendId: c.backendId, modelId: c.modelId })),
    } as BackgroundProcessingPlan);
    this.cache.set(key, plan);
    while (this.cache.size > this.maxCache)
      this.cache.delete(this.cache.keys().next().value as string);
    return plan;
  }
  async execute(
    req: BackgroundProcessingRequest,
    ctx: { frameMemory: FrameMemoryManager; nowNs?: () => bigint },
  ): Promise<BackgroundProcessingResult> {
    const start = (ctx.nowNs ?? this.clock)();
    if (this.done.has(req.requestId))
      throw err('AiBackgroundInvariantViolation', 'duplicate request', {
        requestId: req.requestId,
      });
    this.done.add(req.requestId);
    this.active.add(req.requestId);
    this.telemetry.processingRequests++;
    try {
      if (req.cancellationSignal?.aborted)
        return this.finish(
          req,
          '',
          undefined,
          undefined,
          undefined,
          'CANCELLED',
          [],
          start,
          'cancelled before planning',
        );
      if (
        req.inputFrame.frameGeneration !== req.expectedFrameGeneration ||
        req.inputFrame.storageGeneration !== req.expectedStorageGeneration
      ) {
        this.telemetry.staleGeneration++;
        throw err('AiBackgroundGenerationMismatch', 'generation mismatch');
      }
      const plan = this.createPlan(req);
      if (plan.passThroughEligible) {
        this.telemetry.passThrough++;
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          plan,
          req.inputFrame,
          'PASSED_THROUGH',
          plan.warnings,
          start,
          'PASSED_THROUGH',
          undefined,
          undefined,
          undefined,
          undefined,
          true,
        );
      }
      if (req.cancellationSignal?.aborted)
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          plan,
          undefined,
          'CANCELLED',
          ['cancelled before allocation'],
          start,
          'CANCELLED',
        );
      const out: BackgroundProcessingOutputLeases = {
        ...(plan.requiresForegroundOutput
          ? { foreground: await this.alloc(ctx.frameMemory, req, plan, false) }
          : {}),
        ...(plan.requiresMatteOutput
          ? { matte: await this.alloc(ctx.frameMemory, req, plan, true) }
          : {}),
        ...(plan.requiresBackgroundOutput
          ? { background: await this.alloc(ctx.frameMemory, req, plan, false) }
          : {}),
        ...(plan.requiresComposition
          ? { composed: await this.alloc(ctx.frameMemory, req, plan, false) }
          : {}),
      };
      try {
        const tk = `${req.sourceId}/${req.streamId}`;
        const br = await this.backends
          .get(plan.selectedBackendId)!
          .execute(plan, req.inputFrame, out, this.temporal.get(tk), {
            models: [...this.models.values()],
            nowNs: ctx.nowNs ?? this.clock,
            ...(req.cancellationSignal ? { cancellationSignal: req.cancellationSignal } : {}),
            ...(req.deadlineNs !== undefined ? { deadlineNs: req.deadlineNs } : {}),
          });
        if (req.cancellationSignal?.aborted) {
          this.release(out);
          return this.finish(
            req,
            plan.planId,
            plan.selectedBackendId,
            plan,
            undefined,
            'CANCELLED',
            ['cancelled after backend'],
            start,
            'CANCELLED',
          );
        }
        if (br.confidence < plan.effectiveParameters.confidenceThreshold) {
          this.release(out);
          this.telemetry.lowConfidence++;
          if (plan.confidencePolicy === 'PASS_THROUGH_BELOW_THRESHOLD')
            return this.finish(
              req,
              plan.planId,
              plan.selectedBackendId,
              plan,
              req.inputFrame,
              'LOW_CONFIDENCE',
              [...plan.warnings, 'low confidence pass-through'],
              start,
              'PASS_THROUGH_BELOW_THRESHOLD',
              br.confidence,
              undefined,
              undefined,
              undefined,
              true,
            );
          return this.finish(
            req,
            plan.planId,
            plan.selectedBackendId,
            plan,
            undefined,
            'LOW_CONFIDENCE',
            [...plan.warnings, 'low confidence'],
            start,
            plan.confidencePolicy,
            br.confidence,
          );
        }
        if (br.temporalState) this.temporal.set(tk, br.temporalState);
        const ref = (lease: FrameLease | undefined, kind: string) =>
          lease ? this.ref(ctx.frameMemory, req, plan, lease, kind) : undefined;
        const fg = ref(out.foreground, 'foreground'),
          matte = ref(out.matte, 'matte'),
          bg = ref(out.background, 'background'),
          comp = ref(out.composed, 'composed');
        this.count(plan, br);
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          plan,
          comp ?? fg ?? bg ?? matte,
          'COMPLETED',
          [...plan.warnings, ...br.warnings],
          start,
          'ACCEPTED',
          br.confidence,
          fg,
          matte,
          bg,
          false,
          comp,
          br.temporaryBytes,
          br.outputBytes,
          br.edgeRefinementApplied,
        );
      } catch (e) {
        this.release(out);
        throw e;
      }
    } catch (e) {
      const code = e instanceof RuntimeEngineError ? e.code : 'AiBackgroundBackendFailed';
      if (code.includes('Timeout')) this.telemetry.timeouts++;
      else if (code.includes('Gpu')) this.telemetry.gpuLoss++;
      else this.telemetry.failures++;
      return this.finish(
        req,
        '',
        undefined,
        undefined,
        undefined,
        code.includes('Cancelled') ? 'CANCELLED' : code.includes('Timeout') ? 'FAILED' : 'FAILED',
        [code],
        start,
        code,
      );
    } finally {
      this.active.delete(req.requestId);
    }
  }
  private async alloc(
    fm: FrameMemoryManager,
    req: BackgroundProcessingRequest,
    plan: BackgroundProcessingPlan,
    matte: boolean,
  ) {
    return fm.allocate({
      width: Number(req.inputFrame.format.width ?? 1),
      height: Number(req.inputFrame.format.height ?? 1),
      format: matte
        ? 'RGBA8'
        : (String(req.inputFrame.format.format ?? 'RGBA8') as VideoFrameFormat),
      memoryDomain: 'SYNTHETIC',
      usageFlags: ['PROCESSING_OUTPUT'],
      accessMode: 'WRITE_ONLY',
      lifetimeClass: matte ? 'TICK_TRANSIENT' : 'FRAME_TRANSIENT',
      ownerId: 'AI_BACKGROUND_PROCESSOR',
      correlationId: req.correlationId,
      metadata: { aiBackgroundPlanId: plan.planId, matte },
    } as FrameAllocationRequest);
  }
  private ref(
    fm: FrameMemoryManager,
    req: BackgroundProcessingRequest,
    plan: BackgroundProcessingPlan,
    lease: FrameLease,
    kind: string,
  ): Readonly<VideoPipelineFrameReference> {
    const f = fm.getFrame(lease.frameId);
    return cloneFreeze({
      ...req.inputFrame,
      frameId: lease.frameId,
      storageId: f?.descriptor.storageId ?? lease.frameId,
      frameGeneration: lease.generation,
      storageGeneration: BigInt(f?.descriptor.storageGeneration ?? lease.generation),
      leaseId: lease.leaseId,
      ownerId: 'AI_BACKGROUND_PROCESSOR',
      state: 'LEASED',
      metadata: {
        ...req.inputFrame.metadata,
        aiBackground: {
          planId: plan.planId,
          kind,
          status: 'COMPLETED',
          mode: plan.processingMode,
          modelId: plan.selectedModelId,
          noPixels: true,
        },
      },
    });
  }
  private release(o: BackgroundProcessingOutputLeases) {
    try {
      o.foreground?.release();
      o.matte?.release();
      o.background?.release();
      o.composed?.release();
    } catch {}
  }
  private count(p: BackgroundProcessingPlan, br: AiBackgroundBackendResult) {
    this.telemetry.completions++;
    if (p.processingMode === 'PERSON_SEGMENTATION') this.telemetry.personSegmentation++;
    if (p.processingMode === 'FOREGROUND_SEGMENTATION')
      this.telemetry.generalForegroundSegmentation++;
    if (p.processingMode === 'BACKGROUND_REMOVAL') this.telemetry.backgroundRemoval++;
    if (p.processingMode === 'BACKGROUND_BLUR') this.telemetry.backgroundBlur++;
    if (
      ['BACKGROUND_REPLACEMENT', 'BACKGROUND_COLOR', 'VIRTUAL_BACKGROUND'].includes(
        p.processingMode,
      )
    )
      this.telemetry.backgroundReplacement++;
    if (p.requiresMatteOutput) this.telemetry.matteOnlyOutputs++;
    if (p.requiresForegroundOutput) this.telemetry.foregroundOutputs++;
    if (p.requiresBackgroundOutput) this.telemetry.backgroundOutputs++;
    if (p.requiresComposition) this.telemetry.composedOutputs++;
    if (p.requiresTemporalState) this.telemetry.temporalStabilizationOperations++;
    if (br.edgeRefinementApplied) this.telemetry.edgeRefinementOperations++;
    this.telemetry.peakTemporaryBytes = Math.max(
      this.telemetry.peakTemporaryBytes,
      br.temporaryBytes,
    );
  }
  private finish(
    req: BackgroundProcessingRequest,
    planId: string,
    backendId: string | undefined,
    plan: BackgroundProcessingPlan | undefined,
    out: Readonly<VideoPipelineFrameReference> | undefined,
    status: BackgroundProcessingStatus,
    warnings: readonly string[],
    start: bigint,
    confidencePolicyResult: string,
    confidence?: number,
    fg?: Readonly<VideoPipelineFrameReference>,
    matte?: Readonly<VideoPipelineFrameReference>,
    bg?: Readonly<VideoPipelineFrameReference>,
    pass = false,
    comp?: Readonly<VideoPipelineFrameReference>,
    temp = 0,
    outBytes = 0,
    edge = false,
  ): BackgroundProcessingResult {
    const end = this.clock();
    const p = plan?.effectiveParameters ?? req.parameters;
    const base: any = {
      requestId: req.requestId,
      planId,
      status,
      inputFrameId: req.inputFrame.frameId,
      passThrough: pass || status === 'PASSED_THROUGH',
      processingApplied: status === 'COMPLETED' && !pass,
      mode: p.mode,
      subjectType: p.subjectType,
      confidencePolicyResult,
      temporalStabilizationApplied: !!plan?.requiresTemporalState && status === 'COMPLETED',
      edgeRefinementApplied: edge,
      blurApplied: p.mode === 'BACKGROUND_BLUR' && status === 'COMPLETED',
      replacementApplied:
        ['BACKGROUND_REPLACEMENT', 'BACKGROUND_COLOR', 'VIRTUAL_BACKGROUND'].includes(p.mode) &&
        status === 'COMPLETED',
      effectiveParameters: p,
      warnings,
      temporaryBytes: temp,
      outputBytes: outBytes,
      durationNs: end - start,
      ownershipTransfer: {
        foregroundLeaseTransferred: !!fg,
        matteLeaseTransferred: !!matte,
        backgroundLeaseTransferred: !!bg,
        composedLeaseTransferred: !!comp,
        passThrough: pass,
      },
      completedAtNs: end,
    };
    if (backendId) base.backendId = backendId;
    if (plan?.selectedModelId) base.modelId = plan.selectedModelId;
    if (plan?.selectedModelVersion) base.modelVersion = plan.selectedModelVersion;
    const foregroundReference = fg ?? (out && !pass ? out : undefined);
    if (foregroundReference) base.foregroundReference = foregroundReference;
    if (matte) base.matteReference = matte;
    if (bg) base.backgroundReference = bg;
    if (comp) base.composedOutputReference = comp;
    if (confidence !== undefined) base.confidence = confidence;
    if (confidencePolicyResult !== 'ACCEPTED') base.fallbackUsed = confidencePolicyResult;
    return cloneFreeze(base) as BackgroundProcessingResult;
  }
  getHealth() {
    return cloneFreeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: this.telemetry.failures ? 'DEGRADED' : 'HEALTHY',
      backendCount: this.backends.size,
      activeBackendCount: this.backends.size,
      modelCount: this.models.size,
      activeModelCount: this.activeModels.size,
      planCacheSize: this.cache.size,
      activeRequestCount: this.active.size,
      completedProcessingCount: this.telemetry.completions,
      passThroughCount: this.telemetry.passThrough,
      degradedCount: 0,
      lowConfidenceCount: this.telemetry.lowConfidence,
      failedCount: this.telemetry.failures,
      cancelledCount: this.telemetry.cancellations,
      rejectedCount: this.telemetry.rejections,
      timeoutCount: this.telemetry.timeouts,
      modelValidationFailureCount: 0,
      segmentationFailureCount: this.telemetry.failures,
      temporalStateResetCount: this.telemetry.temporalStateResets,
      fallbackCount: this.telemetry.keyMatteFallbacks + this.telemetry.maskFallbacks,
      backgroundSourceFailureCount: this.telemetry.backgroundSourceFailures,
      blurDependencyFailureCount: this.telemetry.dependencyFailures,
      gpuLossCount: this.telemetry.gpuLoss,
      allocationFailureCount: this.telemetry.allocationFailure,
      staleGenerationRejectionCount: this.telemetry.staleGeneration,
      heldMatteCount: 0,
      heldMatteBytes: 0,
      temporaryBytes: 0,
      peakTemporaryBytes: this.telemetry.peakTemporaryBytes,
      lastSuccess: this.telemetry.completions ? this.clock().toString() : undefined,
      lastFailure: this.telemetry.failures ? this.clock().toString() : undefined,
      updatedAtNs: this.clock().toString(),
    });
  }
  getTelemetry() {
    return cloneFreeze({
      ...this.telemetry,
      currentRequestIds: [...this.active],
      activeModelIds: [...this.activeModels],
      healthSummary: this.getHealth(),
    });
  }
  getSnapshot() {
    return cloneFreeze({
      backends: [...this.backends.values()].map((b) => ({
        descriptor: b.descriptor,
        capabilities: b.getCapabilities(),
      })),
      models: [...this.models.values()].map((m) => ({ ...m, metadata: safe(m.metadata) })),
      activeModelSummaries: [...this.activeModels].map((modelId) => {
        const m = this.models.get(modelId);
        return { modelId, modelVersion: m?.modelVersion, backendId: m?.backendId };
      }),
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
      planCacheSize: this.cache.size,
      temporalStateCount: this.temporal.size,
    });
  }
  createSourceGraphMetadata(r?: BackgroundProcessingResult) {
    return cloneFreeze({
      processingEnabled: r?.effectiveParameters.enabled,
      mode: r?.mode,
      subjectType: r?.subjectType,
      activeModelId: r?.modelId,
      activeModelVersion: r?.modelVersion,
      confidenceSummary: r?.confidence,
      temporalStabilizationEnabled: r?.effectiveParameters.temporalStabilization,
      foregroundAvailable: !!r?.foregroundReference,
      matteAvailable: !!r?.matteReference,
      replacementBackgroundSummary: r?.replacementApplied ? 'reference-only' : undefined,
      blurEnabled: r?.blurApplied,
      fallbackState: r?.fallbackUsed,
      processingStatus: r?.status,
      health: this.getHealth().healthState,
      lastProcessedRuntimeFrame: r?.foregroundReference?.runtimeFrameNumber.toString(),
      backendClass: r?.backendId ? 'SYNTHETIC' : undefined,
      passThroughState: r?.passThrough ? 'PASSED_THROUGH' : 'PROCESSED',
    });
  }
  assertInvariants() {
    if (this.cache.size > this.maxCache)
      throw err('AiBackgroundInvariantViolation', 'plan cache exceeded bound');
    if (this.models.size > this.maxModels)
      throw err('AiBackgroundInvariantViolation', 'model registry exceeded bound');
    for (const s of this.temporal.values())
      if (s.recentMatteSummaries.length > 30 || s.confidenceSummaries.length > 30)
        throw err('AiBackgroundInvariantViolation', 'temporal history exceeded bound');
    if (this.shutdownFlag && (this.active.size || this.cache.size || this.temporal.size))
      throw err('AiBackgroundInvariantViolation', 'shutdown leak');
    return true;
  }
  async shutdown() {
    this.shutdownFlag = true;
    this.cache.clear();
    this.temporal.clear();
    await Promise.all([...this.backends.values()].map((b) => b.shutdown({ nowNs: this.clock })));
    this.backends.clear();
    this.activeModels.clear();
    this.active.clear();
    this.assertInvariants();
  }
}
export class AiBackgroundProcessingPipelineStage implements VideoFramePipelineStage {
  readonly descriptor: Readonly<VideoPipelineStageDescriptor>;
  constructor(
    private engine: AiBackgroundProcessingEngine,
    private frameMemory: FrameMemoryManager,
    private parameters: BackgroundProcessingParameters = createDefaultBackgroundProcessingParameters(
      { mode: 'BYPASS', enabled: false, outputMode: 'PASSTHROUGH' },
    ),
    descriptor: Partial<VideoPipelineStageDescriptor> = {},
  ) {
    this.descriptor = cloneFreeze({
      stageId: 'ubos-v5.4.5-ai-background-processing',
      stageKind: 'AI_BACKGROUND_PROCESSING',
      displayName: 'UBOS v5.4.5 AI Background Processing',
      version: '5.4.5',
      phase: 'TRANSFORM',
      order: 660,
      dependencies: ['KEYING', 'MASKING', 'BLUR_SHARPEN', 'COLOR_EFFECTS'],
      optionalDependencies: ['KEYING', 'MASKING', 'BLUR_SHARPEN', 'COLOR_EFFECTS'],
      requiredInputMediaKinds: ['VIDEO'],
      supportedInputFormats: ['RGBA8', 'BGRA8', 'NV12', 'I420', 'UNKNOWN'],
      supportedOutputFormats: ['RGBA8', 'BGRA8', 'NV12', 'I420', 'UNKNOWN'],
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
      optional: true,
      timeoutNs: 8_000_000n,
      budgetNs: 8_000_000n,
      maximumInFlight: 1,
      metadata: {
        architecturalPosition: 'after color effects before geometry/layer compositor',
        privacy: 'metadata-only',
      },
      ...descriptor,
    });
  }
  initialize() {
    return { status: 'READY' as const };
  }
  async process(
    input: VideoPipelineStageInput,
    ctx: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> {
    const start = ctx.nowNs();
    const r = await this.engine.execute(
      {
        requestId: `${ctx.requestId}:ai-background`,
        sourceId: input.inputFrame.sourceId,
        streamId: input.inputFrame.streamId,
        inputFrame: input.inputFrame,
        inputLeaseId: input.inputFrame.leaseId,
        expectedFrameGeneration: input.inputFrame.frameGeneration,
        expectedStorageGeneration: input.inputFrame.storageGeneration,
        parameters: this.parameters,
        pipelineConfigurationGeneration: ctx.configuration.generation,
        deadlineNs: input.frameContext.deadlineNs,
        ...(ctx.cancellationSignal ? { cancellationSignal: ctx.cancellationSignal } : {}),
        metadata: { stage: true },
      },
      { frameMemory: this.frameMemory, nowNs: ctx.nowNs },
    );
    const out =
      r.composedOutputReference ??
      r.foregroundReference ??
      r.backgroundReference ??
      r.matteReference ??
      input.inputFrame;
    return cloneFreeze({
      status:
        r.status === 'COMPLETED'
          ? 'COMPLETED'
          : r.status === 'PASSED_THROUGH'
            ? 'PASSED_THROUGH'
            : r.status === 'CANCELLED'
              ? 'CANCELLED'
              : 'FAILED',
      output: {
        stageId: this.descriptor.stageId,
        status:
          r.status === 'COMPLETED'
            ? 'COMPLETED'
            : r.status === 'PASSED_THROUGH'
              ? 'PASSED_THROUGH'
              : r.status === 'CANCELLED'
                ? 'CANCELLED'
                : 'FAILED',
        inputFrameId: input.inputFrame.frameId,
        outputFrameId: out.frameId,
        outputLeaseId: out.leaseId,
        outputGeneration: out.frameGeneration,
        passThrough: r.passThrough,
        producedNewFrame: r.processingApplied,
        timestampPreserved: out.sourceTimestampNs === input.inputFrame.sourceTimestampNs,
        sourceIdentityPreserved: out.sourceId === input.inputFrame.sourceId,
        durationNs: r.completedAtNs - start,
        warnings: r.warnings.map((w) => ({ code: 'AI_BACKGROUND_WARNING', message: w })),
        metadata: safe({
          aiBackgroundStatus: r.status,
          confidence: r.confidence,
          foregroundFrameId: r.foregroundReference?.frameId,
          matteFrameId: r.matteReference?.frameId,
          backgroundFrameId: r.backgroundReference?.frameId,
          composedFrameId: r.composedOutputReference?.frameId,
          modelId: r.modelId,
        }) as Record<string, JsonSafe>,
      },
    });
  }
  shutdown() {}
}
export const createAiBackgroundProcessingEngine = () => new AiBackgroundProcessingEngine();
export const createAiBackgroundProcessingPipelineStage = (
  engine: AiBackgroundProcessingEngine,
  frameMemory: FrameMemoryManager,
  parameters?: BackgroundProcessingParameters,
  descriptor?: Partial<VideoPipelineStageDescriptor>,
) => new AiBackgroundProcessingPipelineStage(engine, frameMemory, parameters, descriptor);
export function createAiBackgroundCommandHandlers(
  engine: AiBackgroundProcessingEngine,
  frameMemory?: FrameMemoryManager,
): Readonly<Record<string, RuntimeCommandHandler>> {
  const h = (type: string, fn: (p: any) => unknown | Promise<unknown>): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: !type.includes('EXECUTE'),
    execute: async (c: RuntimeCommand) => ({
      status: 'SUCCEEDED',
      value: await fn(c.payload as Record<string, unknown>),
    }),
  });
  return {
    AI_BACKGROUND_REGISTER_BACKEND: h('AI_BACKGROUND_REGISTER_BACKEND', () => ({
      registered: false,
      reason: 'backend objects are private',
    })),
    AI_BACKGROUND_UNREGISTER_BACKEND: h('AI_BACKGROUND_UNREGISTER_BACKEND', (p) =>
      engine.unregisterBackend(String(p.backendId)),
    ),
    AI_BACKGROUND_REGISTER_MODEL: h('AI_BACKGROUND_REGISTER_MODEL', (p) =>
      engine.registerModel(p.model as AiBackgroundModelDescriptor),
    ),
    AI_BACKGROUND_UNREGISTER_MODEL: h('AI_BACKGROUND_UNREGISTER_MODEL', (p) =>
      engine.unregisterModel(String(p.modelId)),
    ),
    AI_BACKGROUND_ACTIVATE_MODEL: h('AI_BACKGROUND_ACTIVATE_MODEL', (p) =>
      engine.activateModel(String(p.modelId)),
    ),
    AI_BACKGROUND_DEACTIVATE_MODEL: h('AI_BACKGROUND_DEACTIVATE_MODEL', (p) =>
      engine.deactivateModel(String(p.modelId)),
    ),
    AI_BACKGROUND_PLAN: h('AI_BACKGROUND_PLAN', (p) =>
      engine.createPlan((p.request ?? p) as BackgroundProcessingPlanRequest),
    ),
    AI_BACKGROUND_EXECUTE: h('AI_BACKGROUND_EXECUTE', (p) => {
      if (!frameMemory) throw err('AiBackgroundFrameMemoryRequired', 'frame memory required');
      return engine.execute((p.request ?? p) as BackgroundProcessingRequest, { frameMemory });
    }),
    AI_BACKGROUND_CANCEL: h('AI_BACKGROUND_CANCEL', () => ({ cancelled: true })),
    AI_BACKGROUND_SET_PARAMETERS: h('AI_BACKGROUND_SET_PARAMETERS', (p) =>
      validateBackgroundProcessingParameters(
        p.parameters as Partial<BackgroundProcessingParameters>,
        p.policy as BackgroundParameterPolicy,
      ),
    ),
    AI_BACKGROUND_SET_MODE: h('AI_BACKGROUND_SET_MODE', (p) =>
      validateBackgroundProcessingParameters(
        {
          ...(p.parameters as Partial<BackgroundProcessingParameters>),
          mode: p.mode as BackgroundProcessingMode,
        },
        p.policy as BackgroundParameterPolicy,
      ),
    ),
    AI_BACKGROUND_SET_BACKGROUND: h('AI_BACKGROUND_SET_BACKGROUND', (p) => ({
      background: safe(p.background),
      observable: true,
    })),
    AI_BACKGROUND_SET_CONFIDENCE_POLICY: h('AI_BACKGROUND_SET_CONFIDENCE_POLICY', (p) =>
      validateBackgroundProcessingParameters(
        {
          ...(p.parameters as Partial<BackgroundProcessingParameters>),
          confidencePolicy: p.confidencePolicy as AiBackgroundConfidencePolicy,
        },
        p.policy as BackgroundParameterPolicy,
      ),
    ),
    AI_BACKGROUND_RESET_TEMPORAL_STATE: h('AI_BACKGROUND_RESET_TEMPORAL_STATE', (p) =>
      engine.resetTemporalState(p.sourceId, p.streamId),
    ),
    AI_BACKGROUND_CLEAR_PLAN_CACHE: h('AI_BACKGROUND_CLEAR_PLAN_CACHE', () =>
      engine.clearPlanCache(),
    ),
    AI_BACKGROUND_SET_DEFAULT_BACKEND: h('AI_BACKGROUND_SET_DEFAULT_BACKEND', (p) => ({
      backendId: p.backendId,
      observable: true,
    })),
    AI_BACKGROUND_SET_QUALITY: h('AI_BACKGROUND_SET_QUALITY', (p) => ({
      quality: p.qualityTier,
      observable: true,
    })),
    AI_BACKGROUND_VALIDATE: h('AI_BACKGROUND_VALIDATE', (p) =>
      p.parameters
        ? validateBackgroundProcessingParameters(
            p.parameters as Partial<BackgroundProcessingParameters>,
            p.policy as BackgroundParameterPolicy,
          )
        : engine.assertInvariants(),
    ),
    AI_BACKGROUND_SHUTDOWN: h('AI_BACKGROUND_SHUTDOWN', () => engine.shutdown()),
  };
}
export const createSourceGraphAiBackgroundMetadata = (
  engine: AiBackgroundProcessingEngine,
  result?: BackgroundProcessingResult,
) => engine.createSourceGraphMetadata(result);
