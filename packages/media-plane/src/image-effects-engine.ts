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
const now = () => BigInt(Date.now()) * 1000000n;
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const c of Object.values(v as Record<string, unknown>)) freeze(c);
  }
  return v as Readonly<T>;
};
const cloneFreeze = <T>(v: T): Readonly<T> => freeze(structuredClone(v));
const stable = (v: unknown): string =>
  JSON.stringify(v, (_, x) =>
    typeof x === 'bigint'
      ? x.toString()
      : x && typeof x === 'object' && !Array.isArray(x)
        ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
        : x,
  );
const id = (p: string, s: string) =>
  `${p}-${Math.abs([...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7)).toString(36)}`;
const redact =
  /token|secret|password|credential|cookie|path|url|handle|pointer|native|pixel|payload|lease|frame/i;
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
        .map(([k, x]) => [k, redact.test(k) ? '[REDACTED]' : safe(x, d + 1)]),
    );
  return String(v);
};
export class ImageEffectsError extends RuntimeEngineError {}
const ieerr = (c: string, m: string, meta?: Record<string, unknown>) =>
  new ImageEffectsError(c, m, meta);
export const IMAGE_EFFECT_TYPES = [
  'OPACITY',
  'BORDER',
  'ROUNDED_CORNERS',
  'CORNER_CLIP',
  'DROP_SHADOW',
  'INNER_SHADOW',
  'OUTER_GLOW',
  'INNER_GLOW',
  'OUTLINE',
  'STROKE',
  'REFLECTION',
  'MIRROR_REFLECTION',
  'VIGNETTE',
  'MONOCHROME',
  'GRAYSCALE',
  'SEPIA',
  'INVERT',
  'POSTERIZE',
  'THRESHOLD',
  'SOLARIZE',
  'EMBOSS',
  'EDGE_DETECT',
  'PIXELATE',
  'MOSAIC',
  'GRAIN',
  'SCANLINES',
  'HALFTONE',
  'DUOTONE',
  'TRITONE',
  'TINT_OVERLAY',
  'COLOR_OVERLAY',
  'GRADIENT_OVERLAY',
  'BLEND_WITH_ORIGINAL',
  'BYPASS',
  'CUSTOM',
] as const;
export type ImageEffectType = (typeof IMAGE_EFFECT_TYPES)[number];
export type ImageEffectParameterPolicy =
  'REJECT_OUT_OF_RANGE' | 'CLAMP_TO_SUPPORTED_RANGE' | 'WARN_AND_CLAMP' | 'BACKEND_DEFAULT';
export type ImageEffectOutputMode =
  | 'EFFECT_FRAME'
  | 'EFFECT_WITH_ALPHA'
  | 'PREMULTIPLIED_EFFECT_FRAME'
  | 'STRAIGHT_ALPHA_EFFECT_FRAME'
  | 'EFFECT_MASK_ONLY'
  | 'PASSTHROUGH'
  | 'DIAGNOSTIC_EFFECT_VIEW';
export type ImageEffectAlphaPolicy =
  | 'PRESERVE'
  | 'APPLY_TO_RGB_ONLY'
  | 'APPLY_TO_ALPHA_ONLY'
  | 'APPLY_TO_RGBA'
  | 'PREMULTIPLIED_SAFE'
  | 'UNPREMULTIPLY_PROCESS_REPREMULTIPLY'
  | 'REJECT_ALPHA'
  | 'BACKEND_DEFAULT';
export type ImageEffectEdgePolicy =
  'TRANSPARENT' | 'CLAMP' | 'MIRROR' | 'REPEAT' | 'OPAQUE_BLACK' | 'BACKEND_DEFAULT';
export type ImageEffectBlendMode =
  | 'NORMAL'
  | 'MULTIPLY'
  | 'SCREEN'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'COLOR'
  | 'LUMINOSITY'
  | 'DIFFERENCE'
  | 'CUSTOM'
  | 'BACKEND_DEFAULT';
export type ImageEffectStackExecutionPolicy =
  | 'SEQUENTIAL'
  | 'FUSE_WHERE_SAFE'
  | 'FIRST_SUPPORTED'
  | 'STOP_ON_FAILURE'
  | 'SKIP_OPTIONAL_FAILURE'
  | 'CUSTOM';
export type ImageEffectsBackendType =
  'GPU_COMPUTE' | 'GPU_FRAGMENT' | 'CPU_SIMD' | 'CPU_REFERENCE' | 'PLATFORM_NATIVE' | 'SYNTHETIC';
export type ImageEffectStatus =
  'COMPLETED' | 'PASSED_THROUGH' | 'DEGRADED' | 'FAILED' | 'DROPPED' | 'CANCELLED' | 'REJECTED';
export type ImageEffectFailurePolicy =
  | 'FAIL_FRAME'
  | 'DROP_FRAME'
  | 'PASS_THROUGH_IF_OPTIONAL'
  | 'SKIP_OPTIONAL_EFFECT'
  | 'DEGRADE_PIPELINE'
  | 'REQUEST_FALLBACK_BACKEND'
  | 'DISABLE_IMAGE_EFFECTS_STAGE'
  | 'REQUEST_OPERATOR_INTERVENTION';
export interface ImageEffectColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a?: number;
}
export interface ImageEffectMaskReference {
  readonly maskId: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly generation: bigint;
  readonly ownerId: string;
  readonly feathered?: boolean;
  readonly opacity?: number;
}
export interface ImageEffectParameters {
  readonly enabled: boolean;
  readonly effectType: ImageEffectType;
  readonly opacity?: number;
  readonly intensity?: number;
  readonly radius?: number;
  readonly thickness?: number;
  readonly softness?: number;
  readonly spread?: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly angleDegrees?: number;
  readonly scale?: number;
  readonly threshold?: number;
  readonly posterizeLevels?: number;
  readonly pixelSize?: number;
  readonly mosaicCellWidth?: number;
  readonly mosaicCellHeight?: number;
  readonly reflectionOpacity?: number;
  readonly reflectionDistance?: number;
  readonly reflectionFade?: number;
  readonly vignetteAmount?: number;
  readonly vignetteMidpoint?: number;
  readonly vignetteRoundness?: number;
  readonly grainAmount?: number;
  readonly grainSize?: number;
  readonly scanlineSpacing?: number;
  readonly scanlineOpacity?: number;
  readonly primaryColor?: ImageEffectColor;
  readonly secondaryColor?: ImageEffectColor;
  readonly tertiaryColor?: ImageEffectColor;
  readonly overlayBlendMode?: ImageEffectBlendMode;
  readonly originalBlendAmount?: number;
  readonly preserveAlpha?: boolean;
  readonly alphaPolicy: ImageEffectAlphaPolicy;
  readonly edgePolicy: ImageEffectEdgePolicy;
  readonly maskReference?: ImageEffectMaskReference;
  readonly maskGeneration?: bigint;
  readonly invertMask?: boolean;
  readonly outputMode: ImageEffectOutputMode;
  readonly diagnosticsEnabled?: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ImageEffectStackEntry {
  readonly entryId: string;
  readonly parameters: ImageEffectParameters;
  readonly optional?: boolean;
  readonly presetId?: string;
  readonly dependsOnEntryIds?: readonly string[];
}
export interface ImageEffectStack {
  readonly stackId: string;
  readonly entries: readonly ImageEffectStackEntry[];
  readonly maximumDepth: number;
  readonly executionPolicy: ImageEffectStackExecutionPolicy;
  readonly outputMode: ImageEffectOutputMode;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ImageEffectPreset {
  readonly presetId: string;
  readonly displayName: string;
  readonly version: string;
  readonly generation: bigint;
  readonly effects: readonly ImageEffectParameters[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ImageEffectsBackendDescriptor {
  readonly backendId: string;
  readonly displayName: string;
  readonly backendType: ImageEffectsBackendType;
  readonly version: string;
  readonly deterministic: boolean;
  readonly supportedEffects: readonly ImageEffectType[];
  readonly supportedAlphaPolicies: readonly ImageEffectAlphaPolicy[];
  readonly supportedEdgePolicies: readonly ImageEffectEdgePolicy[];
  readonly supportsMasks: boolean;
  readonly supportsBlurDependencies: boolean;
  readonly requiresGpu: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ImageEffectCapability {
  readonly effectType: ImageEffectType;
  readonly realPixelProcessing: boolean;
  readonly metadataBoundary: boolean;
  readonly requiresBlurDependency?: boolean;
  readonly requiresTemporarySurface?: boolean;
}
export interface ImageEffectPlanRequest {
  readonly requestId: string;
  readonly inputFormat: string;
  readonly inputColorMetadata?: Readonly<Record<string, unknown>> | undefined;
  readonly inputAlphaMode?: string | undefined;
  readonly parameters?: ImageEffectParameters;
  readonly effectStack?: ImageEffectStack;
  readonly presetIds?: readonly string[];
  readonly backendPreference?: string;
  readonly qualityTier?: 'LOW' | 'BALANCED' | 'HIGH' | 'ULTRA';
  readonly parameterPolicy?: ImageEffectParameterPolicy;
  readonly maskGeneration?: bigint;
  readonly blurPlanGeneration?: bigint;
  readonly deviceGeneration?: bigint;
  readonly pipelineConfigurationGeneration?: bigint;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ImageEffectPlanCandidate {
  readonly backendId: string;
  readonly operationOrder: readonly string[];
  readonly passThroughEligible: boolean;
  readonly requiresPixelProcessing: boolean;
  readonly requiresNewOutput: boolean;
  readonly requiresTemporarySurfaces: boolean;
  readonly requiresMask: boolean;
  readonly requiresBlurDependency: boolean;
  readonly requiresAlphaTransformation: boolean;
  readonly outputMode: ImageEffectOutputMode;
  readonly outputFormat: string;
  readonly outputAlphaMode: string;
  readonly passCount: number;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly estimatedOperationCount: number;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
}
export interface ImageEffectPlan extends ImageEffectPlanCandidate {
  readonly planId: string;
  readonly inputFormat: string;
  readonly inputColorMetadata?: Readonly<Record<string, unknown>> | undefined;
  readonly inputAlphaMode?: string | undefined;
  readonly effectiveEffectStack: ImageEffectStack;
  readonly resolvedPresetIdsAndVersions: Readonly<Record<string, string>>;
  readonly selectedBackendId: string;
  readonly safeMetadata: Readonly<Record<string, JsonSafe>>;
}
export interface ImageEffectsBackendContext {
  readonly nowNs: () => bigint;
}
export interface ImageEffectsBackendRuntimeContext extends ImageEffectsBackendContext {
  readonly deadlineNs?: bigint | undefined;
  readonly cancellationSignal?: AbortSignal | undefined;
}
export interface ImageEffectsBackendShutdownContext extends ImageEffectsBackendContext {}
export interface ImageEffectsBackendResult {
  readonly effectsApplied: readonly ImageEffectType[];
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly operationSignature: string;
  readonly checksum: string;
  readonly realPixelProcessing: boolean;
}
export interface ImageEffectsBackend {
  readonly descriptor: ImageEffectsBackendDescriptor;
  getCapabilities(): readonly Readonly<ImageEffectCapability>[];
  createPlan(
    request: ImageEffectPlanRequest,
    context: ImageEffectsBackendContext,
  ): ImageEffectPlanCandidate | undefined;
  execute(
    plan: ImageEffectPlan,
    input: VideoPipelineFrameReference,
    output: FrameLease,
    temporaryFrames: readonly FrameLease[],
    context: ImageEffectsBackendRuntimeContext,
  ): Promise<ImageEffectsBackendResult>;
  shutdown(context: ImageEffectsBackendShutdownContext): Promise<void>;
}

interface ImageEffectsTelemetry {
  planRequests: number;
  cacheHits: number;
  cacheMisses: number;
  effectRequests: number;
  completions: number;
  passThrough: number;
  failures: number;
  drops: number;
  cancellations: number;
  rejections: number;
  timeouts: number;
  backendFallback: number;
  gpuLoss: number;
  allocationFailure: number;
  staleGeneration: number;
  presetApplications: number;
  blurDependencyUses: number;
  maskAwareOperations: number;
  peakTemporaryBytes: number;
  currentRequestIds: readonly string[];
  lastEvent: string;
}
type ImageEffectsCommandPayload = Record<string, unknown> & {
  backendId?: string;
  preset?: ImageEffectPreset;
  presetId?: string;
  presetIds?: readonly string[];
  requestId?: string;
  inputFormat?: string;
  parameters?: ImageEffectParameters;
  policy?: ImageEffectParameterPolicy;
  stack?: ImageEffectStack;
  entryId?: string;
  index?: number;
  maskReference?: unknown;
  opacity?: number;
  qualityTier?: string;
};
export interface ImageEffectRequest extends ImageEffectPlanRequest {
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrame: Readonly<VideoPipelineFrameReference>;
  readonly inputLease?: FrameLease;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly deadlineNs?: bigint;
  readonly correlationId?: string;
  readonly cancellationSignal?: AbortSignal;
  readonly failurePolicy?: ImageEffectFailurePolicy;
}
export interface ImageEffectResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId?: string | undefined;
  readonly status: ImageEffectStatus;
  readonly inputFrameId: string;
  readonly outputFrame?: Readonly<VideoPipelineFrameReference> | undefined;
  readonly effectMaskFrame?: Readonly<VideoPipelineFrameReference> | undefined;
  readonly passThrough: boolean;
  readonly effectsApplied: readonly ImageEffectType[];
  readonly effectiveEffectStack?: ImageEffectStack | undefined;
  readonly appliedPresetIds: readonly string[];
  readonly operationOrder: readonly string[];
  readonly effectiveAlphaPolicy: ImageEffectAlphaPolicy;
  readonly effectiveEdgePolicy: ImageEffectEdgePolicy;
  readonly effectiveQuality: string;
  readonly maskApplied: boolean;
  readonly blurDependencyUsed: boolean;
  readonly warnings: readonly string[];
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: bigint;
  readonly ownershipTransfer: Readonly<Record<string, boolean>>;
  readonly completedAtNs: bigint;
}
export const IMAGE_EFFECT_OPERATION_ORDER = [
  'validate input',
  'validate effect stack',
  'resolve presets',
  'validate masks',
  'resolve alpha and edge policies',
  'apply opacity and overlays',
  'apply monochrome/sepia/invert/posterize-type effects',
  'apply borders, corners, outlines, and strokes',
  'apply shadows and glow through declared blur dependencies',
  'apply vignette, reflection, pixelate, mosaic, scanlines, or grain',
  'blend with original',
  'validate output',
  'release temporary resources',
] as const;
const allTypes = new Set<string>(IMAGE_EFFECT_TYPES);
const alphaSet = new Set([
  'PRESERVE',
  'APPLY_TO_RGB_ONLY',
  'APPLY_TO_ALPHA_ONLY',
  'APPLY_TO_RGBA',
  'PREMULTIPLIED_SAFE',
  'UNPREMULTIPLY_PROCESS_REPREMULTIPLY',
  'REJECT_ALPHA',
  'BACKEND_DEFAULT',
]);
const edgeSet = new Set([
  'TRANSPARENT',
  'CLAMP',
  'MIRROR',
  'REPEAT',
  'OPAQUE_BLACK',
  'BACKEND_DEFAULT',
]);
const blendSet = new Set([
  'NORMAL',
  'MULTIPLY',
  'SCREEN',
  'OVERLAY',
  'SOFT_LIGHT',
  'HARD_LIGHT',
  'COLOR',
  'LUMINOSITY',
  'DIFFERENCE',
  'CUSTOM',
  'BACKEND_DEFAULT',
]);
const bounded = (n: unknown, min: number, max: number, name: string) => {
  if (n === undefined) return;
  if (typeof n !== 'number' || !Number.isFinite(n))
    throw ieerr('ImageEffectParametersInvalid', `${name} must be finite`);
  if (n < min || n > max)
    throw ieerr('ImageEffectParameterOutOfRange', `${name} out of range`, { name, min, max });
};
export function validateImageEffectParameters(
  p: ImageEffectParameters,
  policy: ImageEffectParameterPolicy = 'REJECT_OUT_OF_RANGE',
): Readonly<ImageEffectParameters> {
  if (policy === 'BACKEND_DEFAULT') return cloneFreeze(p);
  if (!allTypes.has(p.effectType))
    throw ieerr('ImageEffectTypeUnsupported', 'unsupported image effect type', {
      effectType: p.effectType,
    });
  if (!alphaSet.has(p.alphaPolicy))
    throw ieerr('ImageEffectAlphaUnsupported', 'unsupported alpha policy', {
      alphaPolicy: p.alphaPolicy,
    });
  if (!edgeSet.has(p.edgePolicy))
    throw ieerr('ImageEffectParametersInvalid', 'unsupported edge policy', {
      edgePolicy: p.edgePolicy,
    });
  if (p.overlayBlendMode && !blendSet.has(p.overlayBlendMode))
    throw ieerr('ImageEffectBlendModeUnsupported', 'unsupported blend mode', {
      blendMode: p.overlayBlendMode,
    });
  for (const [k, v] of Object.entries(p))
    if (typeof v === 'number' && !Number.isFinite(v))
      throw ieerr('ImageEffectParametersInvalid', `${k} must be finite`);
  bounded(p.opacity, 0, 1, 'opacity');
  bounded(p.intensity, 0, 1, 'intensity');
  bounded(p.radius, 0, 4096, 'radius');
  bounded(p.thickness, 0, 1024, 'thickness');
  bounded(p.softness, 0, 4096, 'softness');
  bounded(p.spread, 0, 4096, 'spread');
  bounded(p.offsetX, -8192, 8192, 'offsetX');
  bounded(p.offsetY, -8192, 8192, 'offsetY');
  bounded(p.threshold, 0, 1, 'threshold');
  if (
    p.posterizeLevels !== undefined &&
    (!Number.isInteger(p.posterizeLevels) || p.posterizeLevels < 2 || p.posterizeLevels > 256)
  )
    throw ieerr('ImageEffectParameterOutOfRange', 'posterizeLevels out of range');
  bounded(p.pixelSize, 1, 1024, 'pixelSize');
  bounded(p.mosaicCellWidth, 1, 1024, 'mosaicCellWidth');
  bounded(p.mosaicCellHeight, 1, 1024, 'mosaicCellHeight');
  bounded(p.reflectionOpacity, 0, 1, 'reflectionOpacity');
  bounded(p.reflectionDistance, 0, 4096, 'reflectionDistance');
  bounded(p.reflectionFade, 0, 1, 'reflectionFade');
  bounded(p.vignetteAmount, 0, 1, 'vignetteAmount');
  bounded(p.vignetteMidpoint, 0, 1, 'vignetteMidpoint');
  bounded(p.vignetteRoundness, 0, 1, 'vignetteRoundness');
  bounded(p.grainAmount, 0, 1, 'grainAmount');
  bounded(p.grainSize, 1, 256, 'grainSize');
  bounded(p.scanlineSpacing, 1, 256, 'scanlineSpacing');
  bounded(p.scanlineOpacity, 0, 1, 'scanlineOpacity');
  bounded(p.originalBlendAmount, 0, 1, 'originalBlendAmount');
  for (const c of [p.primaryColor, p.secondaryColor, p.tertiaryColor].filter(
    Boolean,
  ) as ImageEffectColor[]) {
    bounded(c.r, 0, 1, 'color.r');
    bounded(c.g, 0, 1, 'color.g');
    bounded(c.b, 0, 1, 'color.b');
    bounded(c.a, 0, 1, 'color.a');
  }
  if (
    p.maskReference &&
    p.maskGeneration !== undefined &&
    p.maskReference.generation !== p.maskGeneration
  )
    throw ieerr('ImageEffectMaskInvalid', 'stale mask generation');
  return cloneFreeze(p);
}
const neutral = (p: ImageEffectParameters) =>
  !p.enabled ||
  p.effectType === 'BYPASS' ||
  (p.effectType === 'OPACITY' && (p.opacity ?? 1) === 1) ||
  p.originalBlendAmount === 1;
const blurTypes = new Set<ImageEffectType>([
  'DROP_SHADOW',
  'INNER_SHADOW',
  'OUTER_GLOW',
  'INNER_GLOW',
  'VIGNETTE',
]);
const tempTypes = new Set<ImageEffectType>([
  'DROP_SHADOW',
  'INNER_SHADOW',
  'OUTER_GLOW',
  'INNER_GLOW',
  'REFLECTION',
  'MIRROR_REFLECTION',
  'MOSAIC',
  'PIXELATE',
]);
const metadataBoundary = new Set<ImageEffectType>([
  'SOLARIZE',
  'EMBOSS',
  'EDGE_DETECT',
  'GRAIN',
  'HALFTONE',
  'GRADIENT_OVERLAY',
  'TRITONE',
]);
export function validateImageEffectStack(s: ImageEffectStack): Readonly<ImageEffectStack> {
  if (s.maximumDepth < 0 || s.maximumDepth > 32)
    throw ieerr('ImageEffectStackExceeded', 'stack maximum depth invalid');
  if (s.entries.length > s.maximumDepth)
    throw ieerr('ImageEffectStackExceeded', 'effect stack exceeded');
  const ids = new Set<string>();
  for (const e of s.entries) {
    if (ids.has(e.entryId)) throw ieerr('ImageEffectStackInvalid', 'duplicate stack entry');
    ids.add(e.entryId);
    validateImageEffectParameters(e.parameters);
    if (e.dependsOnEntryIds?.includes(e.entryId))
      throw ieerr('ImageEffectStackCycle', 'stack cycle');
  }
  return cloneFreeze(s);
}
const param = (
  effectType: ImageEffectType,
  extra: Partial<ImageEffectParameters> = {},
): ImageEffectParameters => ({
  enabled: true,
  effectType,
  alphaPolicy: 'PRESERVE',
  edgePolicy: 'TRANSPARENT',
  outputMode: 'EFFECT_FRAME',
  ...extra,
});
export const createDefaultImageEffectPresets = (): readonly ImageEffectPreset[] =>
  [
    'NONE',
    'SOFT_SHADOW',
    'HARD_SHADOW',
    'SUBTLE_GLOW',
    'NEON_GLOW',
    'ROUNDED_CARD',
    'CLASSIC_BORDER',
    'CINEMA_VIGNETTE',
    'BLACK_AND_WHITE',
    'SEPIA_CLASSIC',
    'HIGH_CONTRAST_MONO',
    'SECURITY_CAMERA',
    'RETRO_SCANLINES',
    'COMIC_POSTERIZE',
    'PIXEL_ART',
    'PRESENTATION_FRAME',
    'PODCAST_CARD',
    'SOCIAL_VERTICAL_CARD',
    'CUSTOM',
  ].map((name, i) =>
    cloneFreeze({
      presetId: name,
      displayName: name.replaceAll('_', ' '),
      version: '5.4.6',
      generation: 1n,
      effects:
        name === 'NONE' || name === 'CUSTOM'
          ? []
          : [
              param(
                (
                  [
                    'DROP_SHADOW',
                    'DROP_SHADOW',
                    'OUTER_GLOW',
                    'OUTER_GLOW',
                    'ROUNDED_CORNERS',
                    'BORDER',
                    'VIGNETTE',
                    'GRAYSCALE',
                    'SEPIA',
                    'MONOCHROME',
                    'SCANLINES',
                    'SCANLINES',
                    'POSTERIZE',
                    'PIXELATE',
                    'BORDER',
                    'BORDER',
                    'ROUNDED_CORNERS',
                  ] as ImageEffectType[]
                )[Math.max(0, i - 1)] ?? 'BYPASS',
                { opacity: 1, intensity: 0.5, radius: 8, softness: 8, thickness: 2 },
              ),
            ],
      metadata: { builtin: true },
    }),
  );
export class SyntheticImageEffectsBackend implements ImageEffectsBackend {
  readonly descriptor = cloneFreeze({
    backendId: 'synthetic-image-effects',
    displayName: 'Synthetic Image Effects Backend',
    backendType: 'SYNTHETIC' as const,
    version: '5.4.6',
    deterministic: true,
    supportedEffects: IMAGE_EFFECT_TYPES,
    supportedAlphaPolicies: [...alphaSet] as ImageEffectAlphaPolicy[],
    supportedEdgePolicies: [...edgeSet] as ImageEffectEdgePolicy[],
    supportsMasks: true,
    supportsBlurDependencies: true,
    requiresGpu: false,
    metadata: { realPixelProcessing: false },
  });
  constructor(private opts: { fail?: boolean; gpuLoss?: boolean; durationNs?: bigint } = {}) {}
  getCapabilities() {
    return IMAGE_EFFECT_TYPES.map((effectType) =>
      cloneFreeze({
        effectType,
        realPixelProcessing: false,
        metadataBoundary: metadataBoundary.has(effectType),
        requiresBlurDependency: blurTypes.has(effectType),
        requiresTemporarySurface: tempTypes.has(effectType),
      }),
    );
  }
  createPlan(r: ImageEffectPlanRequest): ImageEffectPlanCandidate | undefined {
    const entries = [
      ...(r.effectStack?.entries ?? []),
      ...(r.parameters
        ? [{ entryId: 'parameters', parameters: r.parameters } as ImageEffectStackEntry]
        : []),
    ];
    const effects = entries.map((e) => e.parameters).filter((p) => p.enabled);
    const pass = effects.length === 0 || effects.every(neutral);
    const requiresBlur = effects.some((p) => blurTypes.has(p.effectType) && (p.softness ?? 0) > 0);
    const requiresTemp = effects.some((p) => tempTypes.has(p.effectType));
    const requiresMask = effects.some((p) => !!p.maskReference);
    return cloneFreeze({
      backendId: this.descriptor.backendId,
      operationOrder: IMAGE_EFFECT_OPERATION_ORDER,
      passThroughEligible: pass,
      requiresPixelProcessing: !pass && !effects.every((e) => metadataBoundary.has(e.effectType)),
      requiresNewOutput: !pass,
      requiresTemporarySurfaces: requiresTemp || requiresBlur,
      requiresMask,
      requiresBlurDependency: requiresBlur,
      requiresAlphaTransformation: effects.some((p) => p.alphaPolicy !== 'PRESERVE'),
      outputMode: r.effectStack?.outputMode ?? r.parameters?.outputMode ?? 'EFFECT_FRAME',
      outputFormat: r.inputFormat,
      outputAlphaMode: r.inputAlphaMode ?? 'UNKNOWN',
      passCount: pass ? 0 : 1 + (requiresBlur ? 1 : 0),
      estimatedTemporaryBytes: requiresTemp || requiresBlur ? 4096 * effects.length : 0,
      estimatedOutputBytes: pass ? 0 : 4096,
      estimatedOperationCount: effects.length,
      deterministicScore: (pass ? 0 : 100) + effects.length,
      warnings: effects
        .filter((e) => metadataBoundary.has(e.effectType))
        .map((e) => `${e.effectType} is metadata-boundary only in synthetic backend`),
    });
  }
  async execute(
    plan: ImageEffectPlan,
    input: VideoPipelineFrameReference,
    output: FrameLease,
    temporaryFrames: readonly FrameLease[],
    ctx: ImageEffectsBackendRuntimeContext,
  ): Promise<ImageEffectsBackendResult> {
    if (ctx.cancellationSignal?.aborted) throw ieerr('ImageEffectCancelled', 'cancelled');
    if (this.opts.gpuLoss) throw ieerr('ImageEffectsGpuResourceLost', 'synthetic GPU loss');
    if (this.opts.fail) throw ieerr('ImageEffectBackendFailed', 'synthetic failure');
    if (ctx.deadlineNs !== undefined && ctx.nowNs() + (this.opts.durationNs ?? 0n) > ctx.deadlineNs)
      throw ieerr('ImageEffectTimeout', 'deadline exceeded');
    const applied = plan.effectiveEffectStack.entries
      .map((e) => e.parameters.effectType)
      .filter((t) => t !== 'BYPASS');
    return cloneFreeze({
      effectsApplied: applied,
      warnings: plan.warnings,
      temporaryBytes: temporaryFrames.length * 4096,
      outputBytes: 4096,
      operationSignature: stable({
        plan: plan.planId,
        input: input.frameId,
        out: output.frameId,
        applied,
      }),
      checksum: id('chk', stable({ plan: plan.planId, applied })),
      realPixelProcessing: false,
    });
  }
  async shutdown() {}
}
export class ImageEffectsEngine {
  private backends = new Map<string, ImageEffectsBackend>();
  private presets = new Map<string, ImageEffectPreset>();
  private cache = new Map<string, ImageEffectPlan>();
  private active = new Set<string>();
  private done = new Set<string>();
  private shutdownFlag = false;
  private telemetry: ImageEffectsTelemetry = {
    planRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    effectRequests: 0,
    completions: 0,
    passThrough: 0,
    failures: 0,
    drops: 0,
    cancellations: 0,
    rejections: 0,
    timeouts: 0,
    backendFallback: 0,
    gpuLoss: 0,
    allocationFailure: 0,
    staleGeneration: 0,
    presetApplications: 0,
    blurDependencyUses: 0,
    maskAwareOperations: 0,
    peakTemporaryBytes: 0,
    currentRequestIds: [],
    lastEvent: 'IMAGE_EFFECTS_ENGINE_CREATED',
  };
  constructor(
    private readonly maxCache = 128,
    private readonly maxPresets = 64,
    private readonly clock = now,
  ) {
    this.registerBackend(new SyntheticImageEffectsBackend());
    for (const p of createDefaultImageEffectPresets()) this.registerPreset(p);
  }
  registerBackend(b: ImageEffectsBackend) {
    if (this.backends.has(b.descriptor.backendId))
      throw ieerr('DuplicateImageEffectsBackend', 'duplicate backend');
    this.backends.set(b.descriptor.backendId, b);
    this.clearPlanCache();
  }
  unregisterBackend(id: string) {
    if (!this.backends.delete(id)) throw ieerr('ImageEffectsBackendNotFound', 'backend not found');
    this.clearPlanCache();
  }
  registerPreset(p: ImageEffectPreset) {
    if (this.presets.has(p.presetId)) throw ieerr('DuplicateImageEffectPreset', 'duplicate preset');
    if (this.presets.size >= this.maxPresets)
      throw ieerr('ImageEffectPresetInvalid', 'preset registry full');
    for (const e of p.effects) validateImageEffectParameters(e);
    this.presets.set(p.presetId, cloneFreeze(p));
    this.clearPlanCache();
  }
  unregisterPreset(id: string) {
    if (!this.presets.delete(id)) throw ieerr('ImageEffectPresetNotFound', 'preset not found');
    this.clearPlanCache();
  }
  clearPlanCache() {
    this.cache.clear();
  }
  plan(r: ImageEffectPlanRequest): ImageEffectPlan {
    if (this.shutdownFlag) throw ieerr('ImageEffectsEngineNotReady', 'shutdown');
    this.telemetry.planRequests++;
    const presetEffects = (r.presetIds ?? []).flatMap((pid) => {
      const p = this.presets.get(pid);
      if (!p) throw ieerr('ImageEffectPresetNotFound', 'preset not found', { presetId: pid });
      this.telemetry.presetApplications++;
      return p.effects.map(
        (parameters, i) =>
          ({ entryId: `preset:${pid}:${i}`, parameters, presetId: pid }) as ImageEffectStackEntry,
      );
    });
    const stack = validateImageEffectStack(
      r.effectStack ??
        cloneFreeze({
          stackId: 'implicit',
          entries: [
            ...presetEffects,
            ...(r.parameters
              ? [{ entryId: 'parameters', parameters: r.parameters } as ImageEffectStackEntry]
              : []),
          ],
          maximumDepth: 32,
          executionPolicy: 'SEQUENTIAL',
          outputMode: r.parameters?.outputMode ?? 'EFFECT_FRAME',
          metadata: { implicit: true },
        }),
    );
    const key = stable({
      f: r.inputFormat,
      c: r.inputColorMetadata,
      a: r.inputAlphaMode,
      s: stack,
      p: r.presetIds?.map((pid) => [
        pid,
        this.presets.get(pid)?.version,
        this.presets.get(pid)?.generation,
      ]),
      m: r.maskGeneration,
      bg: r.blurPlanGeneration,
      q: r.qualityTier,
      b: r.backendPreference,
      d: r.deviceGeneration,
      g: r.pipelineConfigurationGeneration,
    });
    const cached = this.cache.get(key);
    if (cached) {
      this.telemetry.cacheHits++;
      return cached;
    }
    this.telemetry.cacheMisses++;
    const req = { ...r, effectStack: stack };
    const candidates = [...this.backends.values()]
      .filter((b) => !r.backendPreference || b.descriptor.backendId === r.backendPreference)
      .map((b) => b.createPlan(req, { nowNs: this.clock }))
      .filter(Boolean) as ImageEffectPlanCandidate[];
    if (!candidates.length)
      throw ieerr('ImageEffectsBackendNotFound', 'no backend supports image effects request');
    candidates.sort(
      (a, b) =>
        (a.requiresPixelProcessing === b.requiresPixelProcessing
          ? 0
          : a.requiresPixelProcessing
            ? -1
            : 1) ||
        a.passCount - b.passCount ||
        a.estimatedTemporaryBytes - b.estimatedTemporaryBytes ||
        a.backendId.localeCompare(b.backendId),
    );
    const c = candidates[0]!;
    const plan = cloneFreeze({
      ...c,
      planId: id('ieplan', stable({ key, c })),
      inputFormat: r.inputFormat,
      inputColorMetadata: r.inputColorMetadata,
      inputAlphaMode: r.inputAlphaMode,
      effectiveEffectStack: stack,
      resolvedPresetIdsAndVersions: Object.fromEntries(
        (r.presetIds ?? []).map((pid) => [pid, this.presets.get(pid)!.version]),
      ),
      selectedBackendId: c.backendId,
      safeMetadata: safe(r.metadata ?? {}) as Record<string, JsonSafe>,
    });
    this.cache.set(key, plan);
    while (this.cache.size > this.maxCache)
      this.cache.delete(this.cache.keys().next().value as string);
    return plan;
  }
  async execute(
    req: ImageEffectRequest,
    ctx: { frameMemory: FrameMemoryManager; nowNs?: () => bigint },
  ): Promise<ImageEffectResult> {
    const start = (ctx.nowNs ?? this.clock)();
    if (this.done.has(req.requestId))
      throw ieerr('ImageEffectInvariantViolation', 'duplicate request');
    this.done.add(req.requestId);
    this.active.add(req.requestId);
    this.telemetry.effectRequests++;
    let out: FrameLease | undefined;
    const temps: FrameLease[] = [];
    try {
      if (req.cancellationSignal?.aborted)
        return this.finish(req, '', undefined, 'CANCELLED', undefined, [], start, [
          'cancelled before planning',
        ]);
      if (
        req.inputFrame.frameGeneration !== req.expectedFrameGeneration ||
        req.inputFrame.storageGeneration !== req.expectedStorageGeneration
      ) {
        this.telemetry.staleGeneration++;
        throw ieerr('ImageEffectGenerationMismatch', 'generation mismatch');
      }
      const plan = this.plan(req);
      if (plan.requiresMask) this.telemetry.maskAwareOperations++;
      if (plan.requiresBlurDependency) this.telemetry.blurDependencyUses++;
      if (plan.passThroughEligible) {
        this.telemetry.passThrough++;
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          'PASSED_THROUGH',
          req.inputFrame,
          [],
          start,
          plan.warnings,
          true,
          plan,
        );
      }
      if (req.cancellationSignal?.aborted)
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          'CANCELLED',
          undefined,
          [],
          start,
          ['cancelled before allocation'],
          false,
          plan,
        );
      const alloc = async (lifetimeClass: 'FRAME_TRANSIENT' | 'TICK_TRANSIENT') =>
        ctx.frameMemory.allocate({
          width: Number(req.inputFrame.format.width ?? 1),
          height: Number(req.inputFrame.format.height ?? 1),
          format: ((
            [
              'RGBA8',
              'BGRA8',
              'RGB24',
              'BGR24',
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
            ] as readonly string[]
          ).includes(plan.outputFormat)
            ? plan.outputFormat
            : 'RGBA8') as VideoFrameFormat,
          memoryDomain: 'SYNTHETIC',
          usageFlags: ['PROCESSING_OUTPUT'],
          accessMode: 'WRITE_ONLY',
          lifetimeClass,
          ownerId: 'IMAGE_EFFECTS_ENGINE',
          correlationId: req.correlationId,
          metadata: { imageEffectsPlanId: plan.planId },
        } as FrameAllocationRequest);
      out = await alloc('FRAME_TRANSIENT');
      for (
        let i = 0;
        i < (plan.requiresTemporarySurfaces ? Math.max(1, plan.passCount - 1) : 0);
        i++
      )
        temps.push(await alloc('TICK_TRANSIENT'));
      const runtimeContext: ImageEffectsBackendRuntimeContext = {
        nowNs: ctx.nowNs ?? this.clock,
        ...(req.cancellationSignal ? { cancellationSignal: req.cancellationSignal } : {}),
        ...(req.deadlineNs !== undefined ? { deadlineNs: req.deadlineNs } : {}),
      };
      const br = await this.backends
        .get(plan.selectedBackendId)!
        .execute(plan, req.inputFrame, out, temps, runtimeContext);
      if (req.cancellationSignal?.aborted) {
        out.release();
        temps.forEach((t) => t.release());
        return this.finish(
          req,
          plan.planId,
          plan.selectedBackendId,
          'CANCELLED',
          undefined,
          [],
          start,
          ['cancelled after backend'],
          false,
          plan,
        );
      }
      const frame = ctx.frameMemory.getFrame(out.frameId);
      const ref = cloneFreeze({
        ...req.inputFrame,
        frameId: out.frameId,
        storageId: frame?.descriptor.storageId ?? out.frameId,
        frameGeneration: out.generation,
        storageGeneration: BigInt(frame?.descriptor.storageGeneration ?? out.generation),
        leaseId: out.leaseId,
        ownerId: 'IMAGE_EFFECTS_ENGINE',
        state: 'LEASED' as const,
        metadata: {
          ...req.inputFrame.metadata,
          imageEffects: {
            planId: plan.planId,
            status: 'COMPLETED',
            effectTypes: br.effectsApplied,
            operationSignature: br.operationSignature,
            checksum: br.checksum,
            realPixelProcessing: br.realPixelProcessing,
            alphaMode: plan.outputAlphaMode,
            passThrough: false,
          },
        },
      });
      temps.forEach((t) => t.release());
      this.telemetry.completions++;
      this.telemetry.peakTemporaryBytes = Math.max(
        this.telemetry.peakTemporaryBytes,
        br.temporaryBytes,
      );
      return this.finish(
        req,
        plan.planId,
        plan.selectedBackendId,
        'COMPLETED',
        ref,
        br.effectsApplied,
        start,
        [...plan.warnings, ...br.warnings],
        false,
        plan,
        br.temporaryBytes,
        br.outputBytes,
      );
    } catch (e) {
      try {
        out?.release();
        temps.forEach((t) => t.release());
      } catch {}
      const code = e instanceof RuntimeEngineError ? e.code : 'ImageEffectBackendFailed';
      if (code === 'ImageEffectTimeout') this.telemetry.timeouts++;
      else if (code.includes('Gpu') || code.includes('GPU')) this.telemetry.gpuLoss++;
      else this.telemetry.failures++;
      return this.finish(
        req,
        '',
        undefined,
        code === 'ImageEffectCancelled'
          ? 'CANCELLED'
          : req.failurePolicy === 'DROP_FRAME'
            ? 'DROPPED'
            : 'FAILED',
        undefined,
        [],
        start,
        [code],
      );
    } finally {
      this.active.delete(req.requestId);
    }
  }
  private finish(
    req: ImageEffectRequest,
    planId: string,
    backendId: string | undefined,
    status: ImageEffectStatus,
    output: Readonly<VideoPipelineFrameReference> | undefined,
    effects: readonly ImageEffectType[],
    start: bigint,
    warnings: readonly string[],
    pass = false,
    plan?: ImageEffectPlan,
    temp = 0,
    outBytes = 0,
  ): ImageEffectResult {
    const end = this.clock();
    return cloneFreeze({
      requestId: req.requestId,
      planId,
      backendId,
      status,
      inputFrameId: req.inputFrame.frameId,
      outputFrame: output,
      passThrough: pass,
      effectsApplied: effects,
      effectiveEffectStack: plan?.effectiveEffectStack,
      appliedPresetIds: req.presetIds ?? [],
      operationOrder: plan?.operationOrder ?? [],
      effectiveAlphaPolicy:
        plan?.effectiveEffectStack.entries[0]?.parameters.alphaPolicy ?? 'PRESERVE',
      effectiveEdgePolicy:
        plan?.effectiveEffectStack.entries[0]?.parameters.edgePolicy ?? 'TRANSPARENT',
      effectiveQuality: req.qualityTier ?? 'BALANCED',
      maskApplied: !!plan?.requiresMask,
      blurDependencyUsed: !!plan?.requiresBlurDependency,
      warnings,
      temporaryBytes: temp,
      outputBytes: outBytes,
      durationNs: end - start,
      ownershipTransfer: { outputLeaseTransferred: !!output && !pass, passThrough: pass },
      completedAtNs: end,
    });
  }
  getHealth() {
    return cloneFreeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: this.telemetry.failures ? 'DEGRADED' : 'HEALTHY',
      backendCount: this.backends.size,
      activeBackendCount: this.backends.size,
      presetCount: this.presets.size,
      planCacheSize: this.cache.size,
      activeRequestCount: this.active.size,
      completedEffectCount: this.telemetry.completions,
      passThroughCount: this.telemetry.passThrough,
      degradedCount: 0,
      failedCount: this.telemetry.failures,
      cancelledCount: this.telemetry.cancellations,
      rejectedCount: this.telemetry.rejections,
      timeoutCount: this.telemetry.timeouts,
      parameterValidationFailureCount: 0,
      presetValidationFailureCount: 0,
      effectStackFailureCount: 0,
      maskFailureCount: 0,
      blurDependencyFailureCount: 0,
      gpuLossCount: this.telemetry.gpuLoss,
      allocationFailureCount: this.telemetry.allocationFailure,
      staleGenerationRejectionCount: this.telemetry.staleGeneration,
      temporaryBytes: 0,
      peakTemporaryBytes: this.telemetry.peakTemporaryBytes,
      lastSuccess: this.telemetry.completions ? String(this.clock()) : undefined,
      lastFailure: this.telemetry.failures ? String(this.clock()) : undefined,
      updatedAtNs: String(this.clock()),
    });
  }
  getTelemetry() {
    return cloneFreeze({
      ...this.telemetry,
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
      presets: [...this.presets.values()].map((p) => ({
        presetId: p.presetId,
        version: p.version,
        generation: String(p.generation),
        effectCount: p.effects.length,
      })),
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
      planCacheSize: this.cache.size,
    });
  }
  assertInvariants() {
    if (this.cache.size > this.maxCache)
      throw ieerr('ImageEffectInvariantViolation', 'unbounded cache');
    if (this.presets.size > this.maxPresets)
      throw ieerr('ImageEffectInvariantViolation', 'unbounded presets');
    if (this.shutdownFlag && (this.active.size || this.cache.size))
      throw ieerr('ImageEffectInvariantViolation', 'shutdown leak');
  }
  async shutdown() {
    this.shutdownFlag = true;
    this.cache.clear();
    await Promise.all([...this.backends.values()].map((b) => b.shutdown({ nowNs: this.clock })));
    this.backends.clear();
    this.active.clear();
    this.assertInvariants();
  }
}
export const createImageEffectsEngine = () => new ImageEffectsEngine();
export class ImageEffectsPipelineStage implements VideoFramePipelineStage {
  readonly descriptor: VideoPipelineStageDescriptor = cloneFreeze({
    stageId: 'image-effects',
    stageKind: 'IMAGE_EFFECTS',
    displayName: 'Image Effects',
    version: '5.4.6',
    phase: 'TRANSFORM',
    order: 760,
    dependencies: ['ai-background-processing'],
    optionalDependencies: ['masking', 'blur-sharpen'],
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
    optional: true,
    timeoutNs: 8_000_000n,
    budgetNs: 4_000_000n,
    maximumInFlight: 1,
    metadata: {
      after: ['AI_BACKGROUND_PROCESSING', 'MASKING', 'BLUR_SHARPEN'],
      before: ['GEOMETRY', 'LAYER_COMPOSITOR'],
    },
  } as VideoPipelineStageDescriptor);
  constructor(
    private engine: ImageEffectsEngine,
    private frameMemory: FrameMemoryManager,
    private stack?: ImageEffectStack,
  ) {}
  initialize() {
    return { status: 'READY' as const, warnings: [] };
  }
  async process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> {
    const r = await this.engine.execute(
      {
        requestId: `ie-stage-${input.frameContext.runtimeFrameNumber}-${input.inputFrame.frameId}`,
        sourceId: input.inputFrame.sourceId,
        streamId: input.inputFrame.streamId,
        inputFrame: input.inputFrame,
        expectedFrameGeneration: input.inputFrame.frameGeneration,
        expectedStorageGeneration: input.inputFrame.storageGeneration,
        effectStack: this.stack ?? {
          stackId: 'stage-empty',
          entries: [],
          maximumDepth: 32,
          executionPolicy: 'SEQUENTIAL',
          outputMode: 'PASSTHROUGH',
        },
        inputFormat: String((input.inputFrame.format as Record<string, unknown>).format ?? 'RGBA8'),
        inputAlphaMode: String(
          (input.inputFrame.format as Record<string, unknown>).alphaMode ?? 'UNKNOWN',
        ),
        qualityTier: 'BALANCED',
        pipelineConfigurationGeneration: context.configuration.generation,
        correlationId: input.frameContext.requestId,
      },
      { frameMemory: this.frameMemory, nowNs: context.nowNs },
    );
    const of = r.outputFrame ?? input.inputFrame;
    return {
      status:
        r.status === 'PASSED_THROUGH'
          ? 'PASSED_THROUGH'
          : r.status === 'FAILED'
            ? 'FAILED'
            : 'COMPLETED',
      output: {
        stageId: this.descriptor.stageId,
        status:
          r.status === 'PASSED_THROUGH'
            ? 'PASSED_THROUGH'
            : r.status === 'FAILED'
              ? 'FAILED'
              : 'COMPLETED',
        inputFrameId: input.inputFrame.frameId,
        outputFrameId: of.frameId,
        outputLeaseId: of.leaseId,
        outputGeneration: of.frameGeneration,
        passThrough: r.passThrough,
        producedNewFrame: !r.passThrough,
        timestampPreserved: true,
        sourceIdentityPreserved: true,
        durationNs: r.durationNs,
        warnings: r.warnings.map((w) => ({ code: 'IMAGE_EFFECTS_WARNING', message: w })),
        metadata: {
          imageEffects: safe({
            status: r.status,
            planId: r.planId,
            effects: r.effectsApplied,
            passThrough: r.passThrough,
            alphaMode: r.effectiveAlphaPolicy,
          }) as JsonSafe,
        },
      },
    };
  }
  reconfigure() {
    return { status: 'RECONFIGURED' as const, warnings: [] };
  }
  shutdown() {
    return this.engine.shutdown();
  }
}
export const createImageEffectsPipelineStage = (
  engine: ImageEffectsEngine,
  frameMemory: FrameMemoryManager,
  stack?: ImageEffectStack,
) => new ImageEffectsPipelineStage(engine, frameMemory, stack);
export const IMAGE_EFFECTS_COMMAND_TYPES = [
  'IMAGE_EFFECTS_REGISTER_BACKEND',
  'IMAGE_EFFECTS_UNREGISTER_BACKEND',
  'IMAGE_EFFECTS_REGISTER_PRESET',
  'IMAGE_EFFECTS_UNREGISTER_PRESET',
  'IMAGE_EFFECTS_PLAN',
  'IMAGE_EFFECTS_EXECUTE',
  'IMAGE_EFFECTS_CANCEL',
  'IMAGE_EFFECTS_SET_PARAMETERS',
  'IMAGE_EFFECTS_SET_STACK',
  'IMAGE_EFFECTS_ADD_EFFECT',
  'IMAGE_EFFECTS_REMOVE_EFFECT',
  'IMAGE_EFFECTS_REORDER_EFFECT',
  'IMAGE_EFFECTS_APPLY_PRESET',
  'IMAGE_EFFECTS_SET_MASK',
  'IMAGE_EFFECTS_SET_OPACITY',
  'IMAGE_EFFECTS_CLEAR_PLAN_CACHE',
  'IMAGE_EFFECTS_SET_DEFAULT_BACKEND',
  'IMAGE_EFFECTS_SET_QUALITY',
  'IMAGE_EFFECTS_VALIDATE',
  'IMAGE_EFFECTS_SHUTDOWN',
] as const;
export const IMAGE_EFFECTS_OUTPUT_KEYS = cloneFreeze({
  requests: 'image-effects.requests',
  plans: 'image-effects.plans',
  results: 'image-effects.results',
  effectedFrameReferences: 'image-effects.effected-frame-references',
  effectMaskReferences: 'image-effects.effect-mask-references',
  passThroughReferences: 'image-effects.pass-through-references',
  failedResults: 'image-effects.failed-results',
  health: 'image-effects.health',
  telemetry: 'image-effects.telemetry',
  activePresetSummaries: 'image-effects.active-preset-summaries',
});
export function createImageEffectsCommandHandlers(
  engine: ImageEffectsEngine,
): Readonly<Record<string, RuntimeCommandHandler>> {
  const h = (
    type: string,
    fn: (p: ImageEffectsCommandPayload) => unknown | Promise<unknown>,
  ): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute: async (c: RuntimeCommand) => ({
      status: 'SUCCEEDED',
      value: await fn((c.payload ?? {}) as ImageEffectsCommandPayload),
    }),
  });
  return {
    IMAGE_EFFECTS_REGISTER_BACKEND: h('IMAGE_EFFECTS_REGISTER_BACKEND', () => ({
      registered: false,
      reason: 'backend objects are private',
    })),
    IMAGE_EFFECTS_UNREGISTER_BACKEND: h('IMAGE_EFFECTS_UNREGISTER_BACKEND', (p) =>
      engine.unregisterBackend(String(p.backendId)),
    ),
    IMAGE_EFFECTS_REGISTER_PRESET: h('IMAGE_EFFECTS_REGISTER_PRESET', (p) =>
      engine.registerPreset(p.preset as ImageEffectPreset),
    ),
    IMAGE_EFFECTS_UNREGISTER_PRESET: h('IMAGE_EFFECTS_UNREGISTER_PRESET', (p) =>
      engine.unregisterPreset(String(p.presetId)),
    ),
    IMAGE_EFFECTS_PLAN: h('IMAGE_EFFECTS_PLAN', (p) => engine.plan(p as ImageEffectPlanRequest)),
    IMAGE_EFFECTS_EXECUTE: h('IMAGE_EFFECTS_EXECUTE', () => ({
      accepted: false,
      reason: 'execute requires frame memory runtime context',
    })),
    IMAGE_EFFECTS_CANCEL: h('IMAGE_EFFECTS_CANCEL', () => ({ cancelled: true })),
    IMAGE_EFFECTS_SET_PARAMETERS: h('IMAGE_EFFECTS_SET_PARAMETERS', (p) =>
      validateImageEffectParameters(p.parameters as ImageEffectParameters, p.policy),
    ),
    IMAGE_EFFECTS_SET_STACK: h('IMAGE_EFFECTS_SET_STACK', (p) =>
      validateImageEffectStack(p.stack as ImageEffectStack),
    ),
    IMAGE_EFFECTS_ADD_EFFECT: h('IMAGE_EFFECTS_ADD_EFFECT', (p) =>
      validateImageEffectParameters(p.parameters as ImageEffectParameters, p.policy),
    ),
    IMAGE_EFFECTS_REMOVE_EFFECT: h('IMAGE_EFFECTS_REMOVE_EFFECT', (p) => ({
      removedEntryId: p.entryId,
    })),
    IMAGE_EFFECTS_REORDER_EFFECT: h('IMAGE_EFFECTS_REORDER_EFFECT', (p) => ({
      entryId: p.entryId,
      index: p.index,
    })),
    IMAGE_EFFECTS_APPLY_PRESET: h('IMAGE_EFFECTS_APPLY_PRESET', (p) =>
      engine.plan({
        requestId: p.requestId ?? 'preset-plan',
        inputFormat: p.inputFormat ?? 'RGBA8',
        presetIds: p.presetIds ?? (p.presetId ? [String(p.presetId)] : []),
      }),
    ),
    IMAGE_EFFECTS_SET_MASK: h('IMAGE_EFFECTS_SET_MASK', (p) => ({
      maskReference: safe(p.maskReference),
    })),
    IMAGE_EFFECTS_SET_OPACITY: h('IMAGE_EFFECTS_SET_OPACITY', (p) =>
      validateImageEffectParameters(
        {
          ...(p.parameters as ImageEffectParameters),
          ...(typeof p.opacity === 'number' ? { opacity: p.opacity } : {}),
        },
        p.policy,
      ),
    ),
    IMAGE_EFFECTS_CLEAR_PLAN_CACHE: h('IMAGE_EFFECTS_CLEAR_PLAN_CACHE', () =>
      engine.clearPlanCache(),
    ),
    IMAGE_EFFECTS_SET_DEFAULT_BACKEND: h('IMAGE_EFFECTS_SET_DEFAULT_BACKEND', (p) => ({
      backendId: p.backendId,
      observable: true,
    })),
    IMAGE_EFFECTS_SET_QUALITY: h('IMAGE_EFFECTS_SET_QUALITY', (p) => ({ quality: p.qualityTier })),
    IMAGE_EFFECTS_VALIDATE: h('IMAGE_EFFECTS_VALIDATE', (p) =>
      p.stack
        ? validateImageEffectStack(p.stack as ImageEffectStack)
        : validateImageEffectParameters(p.parameters as ImageEffectParameters, p.policy),
    ),
    IMAGE_EFFECTS_SHUTDOWN: h('IMAGE_EFFECTS_SHUTDOWN', () => engine.shutdown()),
  };
}
export function createImageEffectsSourceGraphMetadata(result: ImageEffectResult) {
  return cloneFreeze({
    imageEffectsEnabled: true,
    effectCount: result.effectsApplied.length,
    effectTypes: result.effectsApplied,
    activePresetIds: result.appliedPresetIds,
    opacity: result.effectiveEffectStack?.entries[0]?.parameters.opacity ?? 1,
    maskUsage: result.maskApplied,
    blurDependencyUsage: result.blurDependencyUsed,
    effectStatus: result.status,
    health:
      result.status === 'COMPLETED' || result.status === 'PASSED_THROUGH' ? 'HEALTHY' : 'DEGRADED',
    lastProcessedRuntimeFrame: result.completedAtNs.toString(),
    backendClass: result.backendId ? 'SYNTHETIC' : 'NONE',
    passThroughState: result.passThrough ? 'PASSED_THROUGH' : 'PROCESSED',
  });
}
export const IMAGE_EFFECTS_WATCHDOG_INCIDENTS = [
  'IMAGE_EFFECTS_STALLED',
  'IMAGE_EFFECTS_BACKEND_FAILED',
  'IMAGE_EFFECTS_TIMEOUT',
  'IMAGE_EFFECTS_PARAMETERS_INVALID',
  'IMAGE_EFFECTS_PRESET_INVALID',
  'IMAGE_EFFECTS_STACK_INVALID',
  'IMAGE_EFFECTS_MODE_UNSUPPORTED',
  'IMAGE_EFFECTS_MASK_INVALID',
  'IMAGE_EFFECTS_BLUR_DEPENDENCY_FAILED',
  'IMAGE_EFFECTS_TEMP_MEMORY_PRESSURE',
  'IMAGE_EFFECTS_GPU_RESOURCE_LOST',
  'IMAGE_EFFECTS_ALLOCATION_FAILED',
  'IMAGE_EFFECTS_STALE_GENERATION',
  'IMAGE_EFFECTS_PLAN_CACHE_INVALID',
  'IMAGE_EFFECTS_GRAPH_MISMATCH',
  'IMAGE_EFFECTS_INVARIANT_FAILURE',
] as const;
