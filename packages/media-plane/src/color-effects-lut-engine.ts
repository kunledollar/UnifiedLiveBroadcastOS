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
import type { MaskStack } from './masking-engine.js';
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
type Mutable<T> = { -readonly [P in keyof T]: T[P] };
const nowDefault = () => BigInt(Date.now()) * 1_000_000n;
const freeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value as Readonly<T>;
};
const cloneFreeze = <T>(value: T): Readonly<T> => freeze(structuredClone(value));
const redact =
  /token|secret|password|credential|cookie|path|url|handle|pointer|native|pixel|payload/i;
const safe = (value: unknown, depth = 0): JsonSafe => {
  if (depth > 4) return '[Truncated]';
  if (value == null || typeof value === 'boolean') return value as JsonSafe;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return value.length > 256 ? `${value.slice(0, 256)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 64).map((v) => safe(v, depth + 1));
  if (typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 96)
        .map(([k, v]) => [k, redact.test(k) ? '[REDACTED]' : safe(v, depth + 1)]),
    );
  return String(value);
};
const isFiniteNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export type ColorEffectKind =
  | 'LUT_1D'
  | 'LUT_3D'
  | 'FILM_LOOK'
  | 'CINEMATIC_LOOK'
  | 'VINTAGE'
  | 'SEPIA'
  | 'BLACK_AND_WHITE'
  | 'BLEACH_BYPASS'
  | 'CROSS_PROCESS'
  | 'TEAL_ORANGE'
  | 'DAY_FOR_NIGHT'
  | 'WARM'
  | 'COOL'
  | 'SPLIT_TONING'
  | 'LIFT'
  | 'GAMMA'
  | 'GAIN'
  | 'OFFSET'
  | 'EXPOSURE'
  | 'CONTRAST'
  | 'SATURATION'
  | 'VIBRANCE'
  | 'HUE_SHIFT'
  | 'TINT'
  | 'RGB_CURVES'
  | 'LUMA_CURVES'
  | 'CHANNEL_MIXER'
  | 'SELECTIVE_COLOR'
  | 'CREATIVE_PASS_THROUGH'
  | 'CUSTOM';
export type ColorEffectsLutType =
  | 'LUT_1D'
  | 'LUT_3D'
  | 'IDENTITY'
  | 'EXTERNAL_REFERENCE'
  | 'EMBEDDED_METADATA'
  | 'SYNTHETIC'
  | 'BACKEND_GENERATED';
export type ColorEffectsBlendMode =
  | 'REPLACE'
  | 'NORMAL'
  | 'MULTIPLY'
  | 'SCREEN'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'COLOR'
  | 'LUMINOSITY'
  | 'DIFFERENCE'
  | 'CUSTOM';
export type ColorEffectsExecutionPolicy =
  'APPLY_LUT_ONLY' | 'LUT_PLUS_GRADING' | 'GRADING_ONLY' | 'PASS_THROUGH';
export type ColorEffectsBackendType =
  'GPU_COMPUTE' | 'GPU_FRAGMENT' | 'CPU_REFERENCE' | 'PLATFORM_NATIVE' | 'SYNTHETIC';
export type ColorEffectsStatus =
  'COMPLETED' | 'PASSED_THROUGH' | 'FAILED' | 'CANCELLED' | 'REJECTED' | 'DEGRADED';
export type ColorEffectsMaskMode =
  | 'NONE'
  | 'INSIDE_MASK'
  | 'OUTSIDE_MASK'
  | 'MASKED_LUT'
  | 'MASKED_SATURATION'
  | 'MASKED_EXPOSURE'
  | 'MASKED_CURVES';
export type ColorEffectsPresetName =
  | 'Neutral'
  | 'Broadcast'
  | 'Film'
  | 'Cinema'
  | 'Documentary'
  | 'Vintage'
  | 'Warm'
  | 'Cool'
  | 'Noir'
  | 'Sepia'
  | 'Sports'
  | 'Podcast'
  | 'Interview'
  | 'Concert'
  | 'Presentation';
export type ColorEffectsCurvePoint = readonly [number, number];
export interface ColorEffectsLutReference {
  readonly lutId: string;
  readonly name: string;
  readonly type: ColorEffectsLutType;
  readonly enabled: boolean;
  readonly dimensions: readonly number[];
  readonly domainMin: readonly number[];
  readonly domainMax: readonly number[];
  readonly interpolation: 'NEAREST' | 'LINEAR' | 'TETRAHEDRAL' | 'BACKEND_DEFAULT';
  readonly version: string;
  readonly checksum: string;
  readonly cubeMetadata?: Readonly<Record<string, unknown>>;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ColorEffectsSplitTone {
  readonly hue: number;
  readonly saturation: number;
}
export interface ColorEffectsChannelMixer {
  readonly red: readonly number[];
  readonly green: readonly number[];
  readonly blue: readonly number[];
}
export interface ColorEffectsSelectiveColor {
  readonly color:
    'RED' | 'YELLOW' | 'GREEN' | 'CYAN' | 'BLUE' | 'MAGENTA' | 'WHITE' | 'NEUTRAL' | 'BLACK';
  readonly cyan: number;
  readonly magenta: number;
  readonly yellow: number;
  readonly black: number;
}
export interface ColorEffectsParameters {
  readonly enabled: boolean;
  readonly lut?: ColorEffectsLutReference;
  readonly lutStrength: number;
  readonly exposure: number;
  readonly contrast: number;
  readonly highlights: number;
  readonly shadows: number;
  readonly whites: number;
  readonly blacks: number;
  readonly gamma: number;
  readonly lift: number;
  readonly gain: number;
  readonly offset: number;
  readonly saturation: number;
  readonly vibrance: number;
  readonly hue: number;
  readonly temperature: number;
  readonly tint: number;
  readonly splitToneShadows: ColorEffectsSplitTone;
  readonly splitToneHighlights: ColorEffectsSplitTone;
  readonly balance: number;
  readonly rgbCurves: readonly ColorEffectsCurvePoint[];
  readonly lumaCurve: readonly ColorEffectsCurvePoint[];
  readonly channelMixer: ColorEffectsChannelMixer;
  readonly selectiveColor: readonly ColorEffectsSelectiveColor[];
  readonly opacity: number;
  readonly blendMode: ColorEffectsBlendMode;
  readonly diagnostics: boolean;
  readonly metadata: Readonly<Record<string, unknown>>;
}
export interface ColorEffectsBackendDescriptor {
  readonly backendId: string;
  readonly displayName: string;
  readonly backendType: ColorEffectsBackendType;
  readonly version: string;
  readonly deterministic: boolean;
  readonly supportsGpuLutExecution: boolean;
  readonly supportedLutTypes: readonly ColorEffectsLutType[];
  readonly supportedBlendModes: readonly ColorEffectsBlendMode[];
  readonly supportedEffects: readonly ColorEffectKind[];
  readonly requiresGpu: boolean;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ColorEffectsPlanRequest {
  readonly requestId: string;
  readonly inputFormat: string;
  readonly parameters?: Partial<ColorEffectsParameters>;
  readonly preset?: ColorEffectsPresetName;
  readonly backendPreference?: string;
  readonly maskStack?: MaskStack;
  readonly maskMode?: ColorEffectsMaskMode;
  readonly pipelineConfigurationGeneration?: bigint;
  readonly deadlineNs?: bigint;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
export interface ColorEffectsPlan {
  readonly planId: string;
  readonly cacheKey: string;
  readonly backendId: string;
  readonly policy: ColorEffectsExecutionPolicy;
  readonly passThrough: boolean;
  readonly lutApplied: boolean;
  readonly gradingApplied: boolean;
  readonly preset?: ColorEffectsPresetName;
  readonly effectiveParameters: ColorEffectsParameters;
  readonly maskMode: ColorEffectsMaskMode;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly effects: readonly ColorEffectKind[];
  readonly warnings: readonly string[];
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface ColorEffectsExecuteRequest extends ColorEffectsPlanRequest {
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrame: Readonly<VideoPipelineFrameReference>;
  readonly inputLease: FrameLease;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly outputFormat?: string;
  readonly cancellationSignal?: AbortSignal;
  readonly correlationId?: string;
}
export interface ColorEffectsResult {
  readonly request: Readonly<Record<string, JsonSafe>>;
  readonly plan: ColorEffectsPlan;
  readonly backend: string;
  readonly status: ColorEffectsStatus;
  readonly outputFrame?: Readonly<VideoPipelineFrameReference>;
  readonly lutApplied: boolean;
  readonly gradingApplied: boolean;
  readonly preset?: ColorEffectsPresetName;
  readonly effectiveParameters: ColorEffectsParameters;
  readonly warnings: readonly string[];
  readonly bytes: number;
  readonly durationNs: bigint;
  readonly ownership: Readonly<Record<string, JsonSafe>>;
  readonly completedAtNs: bigint;
}
export interface ColorEffectsBackend {
  readonly descriptor: ColorEffectsBackendDescriptor;
  execute(
    plan: ColorEffectsPlan,
    input: Readonly<VideoPipelineFrameReference>,
    output: FrameLease,
    ctx: { nowNs: () => bigint; cancellationSignal?: AbortSignal },
  ): Promise<{
    readonly signature: string;
    readonly temporaryBytes: number;
    readonly warnings: readonly string[];
  }>;
  shutdown(ctx: { nowNs: () => bigint }): Promise<void> | void;
}
export class ColorEffectsError extends RuntimeEngineError {}
const ceerr = (code: string, message: string, details: Record<string, unknown> = {}) =>
  new ColorEffectsError(code, message, details);

export const COLOR_EFFECTS_SUPPORTED_EFFECTS: readonly ColorEffectKind[] = freeze([
  'LUT_1D',
  'LUT_3D',
  'FILM_LOOK',
  'CINEMATIC_LOOK',
  'VINTAGE',
  'SEPIA',
  'BLACK_AND_WHITE',
  'BLEACH_BYPASS',
  'CROSS_PROCESS',
  'TEAL_ORANGE',
  'DAY_FOR_NIGHT',
  'WARM',
  'COOL',
  'SPLIT_TONING',
  'LIFT',
  'GAMMA',
  'GAIN',
  'OFFSET',
  'EXPOSURE',
  'CONTRAST',
  'SATURATION',
  'VIBRANCE',
  'HUE_SHIFT',
  'TINT',
  'RGB_CURVES',
  'LUMA_CURVES',
  'CHANNEL_MIXER',
  'SELECTIVE_COLOR',
  'CREATIVE_PASS_THROUGH',
  'CUSTOM',
]);
export const COLOR_EFFECTS_BLEND_MODES: readonly ColorEffectsBlendMode[] = freeze([
  'REPLACE',
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
]);
export const COLOR_EFFECTS_IDENTITY_LUT: ColorEffectsLutReference = freeze({
  lutId: 'identity-lut',
  name: 'Identity LUT',
  type: 'IDENTITY',
  enabled: false,
  dimensions: [1, 1, 1],
  domainMin: [0, 0, 0],
  domainMax: [1, 1, 1],
  interpolation: 'LINEAR',
  version: '1.0.0',
  checksum: 'identity:0',
});
export const COLOR_EFFECTS_NEUTRAL_PARAMETERS: ColorEffectsParameters = freeze({
  enabled: false,
  lut: COLOR_EFFECTS_IDENTITY_LUT,
  lutStrength: 0,
  exposure: 0,
  contrast: 1,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  gamma: 1,
  lift: 0,
  gain: 1,
  offset: 0,
  saturation: 1,
  vibrance: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  splitToneShadows: { hue: 0, saturation: 0 },
  splitToneHighlights: { hue: 0, saturation: 0 },
  balance: 0,
  rgbCurves: [
    [0, 0],
    [1, 1],
  ],
  lumaCurve: [
    [0, 0],
    [1, 1],
  ],
  channelMixer: { red: [1, 0, 0], green: [0, 1, 0], blue: [0, 0, 1] },
  selectiveColor: [],
  opacity: 1,
  blendMode: 'NORMAL',
  diagnostics: false,
  metadata: {},
});
const preset = (
  name: ColorEffectsPresetName,
  patch: Partial<ColorEffectsParameters>,
): ColorEffectsParameters =>
  cloneFreeze({
    ...COLOR_EFFECTS_NEUTRAL_PARAMETERS,
    enabled: name !== 'Neutral',
    ...patch,
    metadata: { preset: name },
  }) as ColorEffectsParameters;
export const COLOR_EFFECTS_PRESETS: Readonly<
  Record<ColorEffectsPresetName, ColorEffectsParameters>
> = freeze({
  Neutral: preset('Neutral', {}),
  Broadcast: preset('Broadcast', { contrast: 1.08, saturation: 1.04 }),
  Film: preset('Film', { contrast: 1.16, saturation: 0.94, highlights: -0.08, shadows: 0.06 }),
  Cinema: preset('Cinema', { contrast: 1.22, saturation: 0.96, temperature: -0.04, tint: 0.02 }),
  Documentary: preset('Documentary', { contrast: 1.05, saturation: 0.98 }),
  Vintage: preset('Vintage', { contrast: 0.92, saturation: 0.72, temperature: 0.16, blacks: 0.05 }),
  Warm: preset('Warm', { temperature: 0.18, saturation: 1.02 }),
  Cool: preset('Cool', { temperature: -0.18, tint: -0.03 }),
  Noir: preset('Noir', { saturation: 0, contrast: 1.35, shadows: -0.12 }),
  Sepia: preset('Sepia', { saturation: 0.45, temperature: 0.35, tint: 0.08 }),
  Sports: preset('Sports', { contrast: 1.12, saturation: 1.18, vibrance: 0.12 }),
  Podcast: preset('Podcast', { contrast: 1.04, saturation: 1.02, shadows: 0.04 }),
  Interview: preset('Interview', { contrast: 1.03, saturation: 1.01, highlights: -0.03 }),
  Concert: preset('Concert', { contrast: 1.18, saturation: 1.16, blacks: -0.08 }),
  Presentation: preset('Presentation', { contrast: 1.06, saturation: 1.0, whites: 0.04 }),
});
const ranges: Record<string, readonly [number, number]> = {
  lutStrength: [0, 1],
  exposure: [-5, 5],
  contrast: [0, 4],
  highlights: [-1, 1],
  shadows: [-1, 1],
  whites: [-1, 1],
  blacks: [-1, 1],
  gamma: [0.1, 4],
  lift: [-1, 1],
  gain: [0, 4],
  offset: [-1, 1],
  saturation: [0, 4],
  vibrance: [-1, 1],
  hue: [-180, 180],
  temperature: [-1, 1],
  tint: [-1, 1],
  balance: [-1, 1],
  opacity: [0, 1],
};
const neutral = (p: ColorEffectsParameters) =>
  JSON.stringify({ ...p, metadata: {} }) ===
  JSON.stringify({ ...COLOR_EFFECTS_NEUTRAL_PARAMETERS, metadata: {} });
export function validateColorEffectsParameters(
  input: Partial<ColorEffectsParameters>,
): ColorEffectsParameters {
  const p = cloneFreeze({
    ...COLOR_EFFECTS_NEUTRAL_PARAMETERS,
    ...input,
    metadata: safe(input.metadata ?? {}),
  }) as ColorEffectsParameters;
  for (const [k, [lo, hi]] of Object.entries(ranges)) {
    const v = (p as unknown as Record<string, unknown>)[k];
    if (!isFiniteNumber(v) || v < lo || v > hi)
      throw ceerr('ColorEffectsParametersInvalid', `Invalid ${k}`, { value: v, range: [lo, hi] });
  }
  if (!COLOR_EFFECTS_BLEND_MODES.includes(p.blendMode))
    throw ceerr('ColorEffectsUnsupportedBlendMode', 'Unsupported blend mode', {
      blendMode: p.blendMode,
    });
  const validateCurve = (name: string, c: readonly ColorEffectsCurvePoint[]) => {
    if (c.length < 2 || c.length > 64)
      throw ceerr('ColorEffectsInvalidCurve', `Invalid ${name} curve length`);
    let last = -Infinity;
    for (const [x, y] of c) {
      if (!isFiniteNumber(x) || !isFiniteNumber(y) || x < 0 || x > 1 || y < 0 || y > 1 || x < last)
        throw ceerr('ColorEffectsInvalidCurve', `Invalid ${name} curve point`, { x, y });
      last = x;
    }
  };
  validateCurve('rgb', p.rgbCurves);
  validateCurve('luma', p.lumaCurve);
  for (const row of [p.channelMixer.red, p.channelMixer.green, p.channelMixer.blue])
    if (row.length !== 3 || row.some((v) => !isFiniteNumber(v) || v < -2 || v > 2))
      throw ceerr('ColorEffectsInvalidChannelWeights', 'Invalid channel mixer weights');
  if (
    p.lut &&
    (!p.lut.lutId ||
      !p.lut.checksum ||
      ![
        'LUT_1D',
        'LUT_3D',
        'IDENTITY',
        'EXTERNAL_REFERENCE',
        'EMBEDDED_METADATA',
        'SYNTHETIC',
        'BACKEND_GENERATED',
      ].includes(p.lut.type))
  )
    throw ceerr('ColorEffectsInvalidLut', 'Invalid LUT metadata');
  return p;
}

export class SyntheticColorEffectsBackend implements ColorEffectsBackend {
  readonly descriptor: ColorEffectsBackendDescriptor;
  constructor(id = 'synthetic-color-effects') {
    this.descriptor = freeze({
      backendId: id,
      displayName: 'Synthetic Color Effects Backend',
      backendType: 'SYNTHETIC',
      version: '5.4.4',
      deterministic: true,
      supportsGpuLutExecution: false,
      supportedLutTypes: ['IDENTITY', 'SYNTHETIC', 'EMBEDDED_METADATA'],
      supportedBlendModes: [
        'REPLACE',
        'NORMAL',
        'MULTIPLY',
        'SCREEN',
        'OVERLAY',
        'SOFT_LIGHT',
        'HARD_LIGHT',
        'COLOR',
        'LUMINOSITY',
        'DIFFERENCE',
      ],
      supportedEffects: COLOR_EFFECTS_SUPPORTED_EFFECTS,
      requiresGpu: false,
    });
  }
  async execute(
    plan: ColorEffectsPlan,
    _input: Readonly<VideoPipelineFrameReference>,
    _output: FrameLease,
    ctx: { nowNs: () => bigint; cancellationSignal?: AbortSignal },
  ) {
    if (ctx.cancellationSignal?.aborted) throw ceerr('ColorEffectsCancelled', 'Cancelled');
    if (plan.effectiveParameters.blendMode === 'CUSTOM')
      throw ceerr(
        'ColorEffectsUnsupportedBlendMode',
        'Synthetic backend rejects custom blend mode',
      );
    return freeze({
      signature: `${this.descriptor.backendId}:${plan.planId}:${plan.policy}`,
      temporaryBytes: plan.estimatedTemporaryBytes,
      warnings: plan.warnings,
    });
  }
  shutdown() {}
}

export class ColorEffectsEngine {
  private backends = new Map<string, ColorEffectsBackend>();
  private cache = new Map<string, ColorEffectsPlan>();
  private active = new Set<string>();
  private cancelled = new Set<string>();
  private defaultBackendId?: string;
  private shutdownFlag = false;
  private telemetry = {
    plans: 0,
    gradingCount: 0,
    passThroughCount: 0,
    failures: 0,
    cancellations: 0,
    gpuLoss: 0,
    allocationFailures: 0,
    staleGeneration: 0,
    peakTemporaryBytes: 0,
    cacheInvalid: 0,
  };
  constructor(
    private readonly config: {
      readonly nowNs?: () => bigint;
      readonly maxCacheEntries?: number;
    } = {},
  ) {
    this.registerBackend(new SyntheticColorEffectsBackend());
    this.defaultBackendId = 'synthetic-color-effects';
  }
  private get now() {
    return this.config.nowNs ?? nowDefault;
  }
  registerBackend(backend: ColorEffectsBackend) {
    if (this.backends.has(backend.descriptor.backendId))
      throw ceerr('DuplicateColorEffectsBackend', 'Duplicate backend', {
        backendId: backend.descriptor.backendId,
      });
    this.backends.set(backend.descriptor.backendId, backend);
    if (!this.defaultBackendId) this.defaultBackendId = backend.descriptor.backendId;
  }
  unregisterBackend(backendId: string) {
    this.backends.delete(backendId);
    if (this.defaultBackendId === backendId) {
      const next = [...this.backends.keys()].sort()[0];
      if (next) this.defaultBackendId = next;
      else this.defaultBackendId = undefined as unknown as string;
    }
  }
  setDefaultBackend(backendId: string) {
    if (!this.backends.has(backendId))
      throw ceerr('ColorEffectsBackendNotFound', 'Backend not found');
    this.defaultBackendId = backendId;
  }
  setLut(lut: ColorEffectsLutReference) {
    validateColorEffectsParameters({ lut });
    return cloneFreeze(lut);
  }
  setPreset(preset: ColorEffectsPresetName) {
    return COLOR_EFFECTS_PRESETS[preset];
  }
  setParameters(parameters: Partial<ColorEffectsParameters>) {
    return validateColorEffectsParameters(parameters);
  }
  createPlan(req: ColorEffectsPlanRequest): ColorEffectsPlan {
    if (this.shutdownFlag) throw ceerr('ColorEffectsShutdown', 'Engine is shut down');
    const params = validateColorEffectsParameters({
      ...(req.preset ? COLOR_EFFECTS_PRESETS[req.preset] : COLOR_EFFECTS_NEUTRAL_PARAMETERS),
      ...req.parameters,
    });
    const backendId = req.backendPreference ?? this.defaultBackendId;
    const backend = backendId ? this.backends.get(backendId) : undefined;
    if (!backend || !backendId) throw ceerr('ColorEffectsBackendNotFound', 'Backend not found');
    if (params.lut?.enabled && !backend.descriptor.supportedLutTypes.includes(params.lut.type))
      throw ceerr('ColorEffectsUnsupportedLut', 'Unsupported LUT', { lutType: params.lut.type });
    if (!backend.descriptor.supportedBlendModes.includes(params.blendMode))
      throw ceerr('ColorEffectsUnsupportedBlendMode', 'Unsupported blend mode');
    if (req.maskStack?.entries.some((entry) => entry.generation < 0n))
      throw ceerr('ColorEffectsStaleMask', 'Stale mask generation');
    const lutActive = Boolean(
      params.lut?.enabled && params.lut.type !== 'IDENTITY' && params.lutStrength > 0,
    );
    const gradeActive = params.enabled && !neutral(params);
    const passThrough = !params.enabled || params.opacity === 0 || (!lutActive && !gradeActive);
    const policy: ColorEffectsExecutionPolicy = passThrough
      ? 'PASS_THROUGH'
      : lutActive && gradeActive
        ? 'LUT_PLUS_GRADING'
        : lutActive
          ? 'APPLY_LUT_ONLY'
          : 'GRADING_ONLY';
    const cacheKey = JSON.stringify(
      safe({
        f: req.inputFormat,
        p: params,
        preset: req.preset,
        backendId,
        maskMode: req.maskMode ?? 'NONE',
      }),
    );
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;
    const plan: ColorEffectsPlan = cloneFreeze({
      planId: `color-effects-plan-${this.telemetry.plans + 1}-${cacheKey.length}`,
      cacheKey,
      backendId,
      policy,
      passThrough,
      lutApplied: lutActive,
      gradingApplied: !passThrough && gradeActive,
      preset: req.preset,
      effectiveParameters: params,
      maskMode: req.maskMode ?? 'NONE',
      estimatedTemporaryBytes: passThrough ? 0 : 4096,
      estimatedOutputBytes: passThrough ? 0 : 4096,
      effects: lutActive
        ? ['LUT_3D', 'CUSTOM']
        : gradeActive
          ? ['CUSTOM']
          : ['CREATIVE_PASS_THROUGH'],
      warnings:
        params.lut?.type === 'EXTERNAL_REFERENCE'
          ? ['LUT reference is metadata only for this backend']
          : [],
      metadata: safe(req.metadata ?? {}),
    }) as ColorEffectsPlan;
    this.telemetry.plans++;
    this.telemetry.peakTemporaryBytes = Math.max(
      this.telemetry.peakTemporaryBytes,
      plan.estimatedTemporaryBytes,
    );
    this.cache.set(cacheKey, plan);
    while (this.cache.size > (this.config.maxCacheEntries ?? 64))
      this.cache.delete(this.cache.keys().next().value as string);
    return plan;
  }
  async execute(
    req: ColorEffectsExecuteRequest,
    ctx: { frameMemory: FrameMemoryManager; nowNs?: () => bigint },
  ): Promise<ColorEffectsResult> {
    const start = (ctx.nowNs ?? this.now)();
    let outputLease: FrameLease | undefined;
    try {
      if (
        req.inputFrame.frameGeneration !== req.expectedFrameGeneration ||
        req.inputFrame.storageGeneration !== req.expectedStorageGeneration
      ) {
        this.telemetry.staleGeneration++;
        throw ceerr('ColorEffectsStaleGeneration', 'Stale input frame generation');
      }
      if (req.cancellationSignal?.aborted || this.cancelled.has(req.requestId)) {
        this.telemetry.cancellations++;
        return this.result(req, this.createPlan(req), 'CANCELLED', undefined, start, ['cancelled']);
      }
      const plan = this.createPlan(req);
      if (plan.passThrough) {
        this.telemetry.passThroughCount++;
        return this.result(req, plan, 'PASSED_THROUGH', req.inputFrame, start, plan.warnings);
      }
      this.active.add(req.requestId);
      const alloc: Mutable<FrameAllocationRequest> = {
        width: Number(req.inputFrame.format['width'] ?? 1),
        height: Number(req.inputFrame.format['height'] ?? 1),
        format: (req.outputFormat as VideoFrameFormat) ?? 'RGBA8',
        memoryDomain: 'SYNTHETIC',
        usageFlags: ['PROCESSING_OUTPUT', 'TEMPORARY'],
        accessMode: 'WRITE_ONLY',
        lifetimeClass: 'FRAME_TRANSIENT',
        ownerId: 'COLOR_EFFECTS',
        metadata: { colorEffectsPlanId: plan.planId },
      };
      if (req.correlationId) alloc.correlationId = req.correlationId;
      try {
        outputLease = await ctx.frameMemory.allocate(alloc);
      } catch (error) {
        this.telemetry.allocationFailures++;
        throw error;
      }
      const backend = this.backends.get(plan.backendId);
      if (!backend) throw ceerr('ColorEffectsBackendNotFound', 'Backend not found');
      const br = await backend.execute(plan, req.inputFrame, outputLease, {
        nowNs: ctx.nowNs ?? this.now,
        ...(req.cancellationSignal ? { cancellationSignal: req.cancellationSignal } : {}),
      });
      if (req.cancellationSignal?.aborted || this.cancelled.has(req.requestId)) {
        outputLease.release();
        this.telemetry.cancellations++;
        return this.result(req, plan, 'CANCELLED', undefined, start, ['cancelled after backend']);
      }
      const frame = ctx.frameMemory.getFrame(outputLease.frameId);
      const out: VideoPipelineFrameReference = cloneFreeze({
        ...req.inputFrame,
        frameId: outputLease.frameId,
        storageId: frame?.descriptor.storageId ?? outputLease.frameId,
        frameGeneration: outputLease.generation,
        storageGeneration: BigInt(frame?.descriptor.storageGeneration ?? outputLease.generation),
        leaseId: outputLease.leaseId,
        ownerId: 'COLOR_EFFECTS',
        state: 'LEASED',
        metadata: {
          ...req.inputFrame.metadata,
          colorEffects: {
            planId: plan.planId,
            signature: br.signature,
            lutApplied: plan.lutApplied,
            gradingApplied: plan.gradingApplied,
          },
        },
      }) as VideoPipelineFrameReference;
      this.telemetry.gradingCount++;
      return this.result(req, plan, 'COMPLETED', out, start, [...plan.warnings, ...br.warnings]);
    } catch (error) {
      this.telemetry.failures++;
      if (outputLease) outputLease.release();
      throw error;
    } finally {
      this.active.delete(req.requestId);
    }
  }
  cancel(requestId: string) {
    this.cancelled.add(requestId);
    return freeze({ requestId, cancelled: true });
  }
  clearCache() {
    this.cache.clear();
  }
  validate() {
    this.assertInvariants();
    return this.getSnapshot();
  }
  getSnapshot() {
    return freeze({
      health: {
        backendCount: this.backends.size,
        activeRequests: this.active.size,
        lutCount: 1,
        presetCount: Object.keys(COLOR_EFFECTS_PRESETS).length,
        cacheSize: this.cache.size,
        gradingCount: this.telemetry.gradingCount,
        passThroughCount: this.telemetry.passThroughCount,
        failures: this.telemetry.failures,
        cancellations: this.telemetry.cancellations,
        gpuLoss: this.telemetry.gpuLoss,
        allocationFailures: this.telemetry.allocationFailures,
        staleGeneration: this.telemetry.staleGeneration,
        peakTemporaryBytes: this.telemetry.peakTemporaryBytes,
      },
      telemetry: { ...this.telemetry, containsRawPixels: false, containsNativeHandles: false },
      backends: [...this.backends.values()].map((b) => safe(b.descriptor)),
      presets: Object.keys(COLOR_EFFECTS_PRESETS),
      containsRawPixels: false,
      containsNativeHandles: false,
    });
  }
  createSourceGraphMetadata(plan?: ColorEffectsPlan) {
    return freeze({
      lutName: plan?.effectiveParameters.lut?.name ?? COLOR_EFFECTS_IDENTITY_LUT.name,
      preset: plan?.preset,
      gradingEnabled: plan?.effectiveParameters.enabled ?? false,
      blendMode: plan?.effectiveParameters.blendMode ?? 'NORMAL',
      opacity: plan?.effectiveParameters.opacity ?? 1,
      effectState: plan?.policy ?? 'PASS_THROUGH',
      health: this.getSnapshot().health,
      backend: plan?.backendId ?? this.defaultBackendId,
      passThrough: plan?.passThrough ?? true,
      containsPixels: false,
    });
  }
  publishOutputs(
    registry: {
      publish: (producer: string, key: string, value: unknown, ownership?: unknown) => void;
    },
    result?: ColorEffectsResult,
  ) {
    registry.publish(
      'color-effects',
      COLOR_EFFECTS_OUTPUT_KEYS.health,
      this.getSnapshot().health,
      'BORROWED',
    );
    registry.publish(
      'color-effects',
      COLOR_EFFECTS_OUTPUT_KEYS.telemetry,
      this.getSnapshot().telemetry,
      'BORROWED',
    );
    if (result) {
      registry.publish('color-effects', COLOR_EFFECTS_OUTPUT_KEYS.results, result, 'BORROWED');
      if (result.outputFrame)
        registry.publish(
          'color-effects',
          COLOR_EFFECTS_OUTPUT_KEYS.outputFrames,
          result.outputFrame,
          'BORROWED',
        );
    }
  }
  assertInvariants() {
    if (new Set(this.backends.keys()).size !== this.backends.size)
      throw ceerr('ColorEffectsInvariantViolation', 'Duplicate backend IDs');
    if (this.cache.size > (this.config.maxCacheEntries ?? 64))
      throw ceerr('ColorEffectsInvariantViolation', 'Cache exceeds bound');
    if (
      Object.keys(COLOR_EFFECTS_PRESETS).some(
        (p) =>
          JSON.stringify(COLOR_EFFECTS_PRESETS[p as ColorEffectsPresetName]) !==
          JSON.stringify(COLOR_EFFECTS_PRESETS[p as ColorEffectsPresetName]),
      )
    )
      throw ceerr('ColorEffectsInvariantViolation', 'Preset nondeterminism');
  }
  async shutdown() {
    for (const b of [...this.backends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    ))
      await b.shutdown({ nowNs: this.now });
    this.active.clear();
    this.cache.clear();
    this.shutdownFlag = true;
  }
  private result(
    req: ColorEffectsExecuteRequest,
    plan: ColorEffectsPlan,
    status: ColorEffectsStatus,
    outputFrame: Readonly<VideoPipelineFrameReference> | undefined,
    start: bigint,
    warnings: readonly string[],
  ): ColorEffectsResult {
    const completedAtNs = this.now();
    return cloneFreeze({
      request: safe({
        requestId: req.requestId,
        sourceId: req.sourceId,
        streamId: req.streamId,
        metadata: req.metadata,
      }),
      plan,
      backend: plan.backendId,
      status,
      ...(outputFrame ? { outputFrame } : {}),
      lutApplied: status === 'COMPLETED' && plan.lutApplied,
      gradingApplied: status === 'COMPLETED' && plan.gradingApplied,
      preset: plan.preset,
      effectiveParameters: plan.effectiveParameters,
      warnings,
      bytes: plan.estimatedOutputBytes + plan.estimatedTemporaryBytes,
      durationNs: completedAtNs - start,
      ownership: safe({ ownerId: outputFrame?.ownerId, leaseId: outputFrame?.leaseId }),
      completedAtNs,
    }) as ColorEffectsResult;
  }
}
export const createColorEffectsEngine = (
  config?: ConstructorParameters<typeof ColorEffectsEngine>[0],
) => new ColorEffectsEngine(config);
export const createSyntheticColorEffectsBackend = (id?: string) =>
  new SyntheticColorEffectsBackend(id);

export class ColorEffectsPipelineStage implements VideoFramePipelineStage {
  readonly descriptor: VideoPipelineStageDescriptor;
  constructor(
    private readonly engine: ColorEffectsEngine,
    private readonly frameMemory: FrameMemoryManager,
    descriptor: Partial<VideoPipelineStageDescriptor> = {},
  ) {
    this.descriptor = freeze({
      stageId: 'color-effects',
      stageKind: 'COLOR_EFFECTS',
      displayName: 'Color Effects & LUT',
      version: '5.4.4',
      phase: 'TRANSFORM',
      order: 544,
      dependencies: ['blur-sharpen'],
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
      metadata: { boundary: 'creative grading only; no color conversion or correction' },
      ...descriptor,
    }) as VideoPipelineStageDescriptor;
  }
  initialize() {
    return { status: 'READY' as const };
  }
  async process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> {
    const result = await this.engine.execute(
      {
        requestId: `${context.requestId}:color-effects`,
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
        pipelineConfigurationGeneration: context.configuration.generation,
        ...(context.cancellationSignal ? { cancellationSignal: context.cancellationSignal } : {}),
      },
      { frameMemory: this.frameMemory, nowNs: context.nowNs },
    );
    const out = result.outputFrame ?? input.inputFrame;
    return freeze({
      status:
        result.status === 'COMPLETED'
          ? 'COMPLETED'
          : result.status === 'PASSED_THROUGH'
            ? 'PASSED_THROUGH'
            : 'FAILED',
      output: {
        stageId: this.descriptor.stageId,
        status:
          result.status === 'COMPLETED'
            ? 'COMPLETED'
            : result.status === 'PASSED_THROUGH'
              ? 'PASSED_THROUGH'
              : 'FAILED',
        inputFrameId: input.inputFrame.frameId,
        outputFrameId: out.frameId,
        outputLeaseId: out.leaseId,
        outputGeneration: out.frameGeneration,
        passThrough: result.status === 'PASSED_THROUGH',
        producedNewFrame: result.status === 'COMPLETED',
        timestampPreserved:
          out.sourceTimestampNs === input.inputFrame.sourceTimestampNs &&
          out.normalizedTimestampNs === input.inputFrame.normalizedTimestampNs,
        sourceIdentityPreserved: out.sourceId === input.inputFrame.sourceId,
        durationNs: result.durationNs,
        warnings: result.warnings.map((w) => ({ code: 'COLOR_EFFECTS', message: w })),
        metadata: { colorEffectsResult: safe(result) },
      },
    });
  }
  shutdown() {}
}
export const createColorEffectsPipelineStage = (
  engine: ColorEffectsEngine,
  frameMemory: FrameMemoryManager,
  descriptor?: Partial<VideoPipelineStageDescriptor>,
) => new ColorEffectsPipelineStage(engine, frameMemory, descriptor);
export const COLOR_EFFECTS_COMMAND_TYPES = freeze([
  'COLOR_EFFECTS_REGISTER_BACKEND',
  'COLOR_EFFECTS_UNREGISTER_BACKEND',
  'COLOR_EFFECTS_PLAN',
  'COLOR_EFFECTS_EXECUTE',
  'COLOR_EFFECTS_CANCEL',
  'COLOR_EFFECTS_SET_LUT',
  'COLOR_EFFECTS_SET_PRESET',
  'COLOR_EFFECTS_SET_PARAMETERS',
  'COLOR_EFFECTS_CLEAR_CACHE',
  'COLOR_EFFECTS_SET_DEFAULT_BACKEND',
  'COLOR_EFFECTS_VALIDATE',
  'COLOR_EFFECTS_SHUTDOWN',
]);
export const COLOR_EFFECTS_OUTPUT_KEYS = freeze({
  plans: 'color-effects.plans',
  requests: 'color-effects.requests',
  results: 'color-effects.results',
  outputFrames: 'color-effects.output-frames',
  health: 'color-effects.health',
  telemetry: 'color-effects.telemetry',
});
export const COLOR_EFFECTS_WATCHDOG_INCIDENTS = freeze([
  'COLOR_EFFECTS_STALLED',
  'COLOR_EFFECTS_BACKEND_FAILED',
  'COLOR_EFFECTS_TIMEOUT',
  'COLOR_EFFECTS_INVALID_PARAMETERS',
  'COLOR_EFFECTS_INVALID_LUT',
  'COLOR_EFFECTS_GPU_LOST',
  'COLOR_EFFECTS_ALLOCATION_FAILED',
  'COLOR_EFFECTS_STALE_GENERATION',
  'COLOR_EFFECTS_CACHE_INVALID',
  'COLOR_EFFECTS_INVARIANT_FAILURE',
]);
export function createColorEffectsCommandHandlers(
  engine: ColorEffectsEngine,
  frameMemory?: FrameMemoryManager,
): readonly RuntimeCommandHandler[] {
  const h = (
    type: string,
    fn: (p: Record<string, unknown>) => unknown | Promise<unknown>,
  ): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: !type.includes('EXECUTE'),
    execute: async (c: RuntimeCommand) => ({
      status: 'SUCCEEDED',
      value: await fn((c.payload ?? {}) as Record<string, unknown>),
    }),
  });
  return COLOR_EFFECTS_COMMAND_TYPES.map((t) =>
    h(t, (p: Record<string, unknown>) => {
      if (t === 'COLOR_EFFECTS_REGISTER_BACKEND')
        return engine.registerBackend(p.backend as ColorEffectsBackend);
      if (t === 'COLOR_EFFECTS_UNREGISTER_BACKEND')
        return engine.unregisterBackend(String(p.backendId));
      if (t === 'COLOR_EFFECTS_PLAN')
        return engine.createPlan((p.request ?? p) as ColorEffectsPlanRequest);
      if (t === 'COLOR_EFFECTS_EXECUTE') {
        if (!frameMemory)
          throw ceerr('ColorEffectsFrameMemoryRequired', 'Frame memory is required');
        return engine.execute((p.request ?? p) as ColorEffectsExecuteRequest, { frameMemory });
      }
      if (t === 'COLOR_EFFECTS_CANCEL') return engine.cancel(String(p.requestId));
      if (t === 'COLOR_EFFECTS_SET_LUT') return engine.setLut(p.lut as ColorEffectsLutReference);
      if (t === 'COLOR_EFFECTS_SET_PRESET')
        return engine.setPreset(p.preset as ColorEffectsPresetName);
      if (t === 'COLOR_EFFECTS_SET_PARAMETERS')
        return engine.setParameters((p.parameters ?? p) as Partial<ColorEffectsParameters>);
      if (t === 'COLOR_EFFECTS_CLEAR_CACHE') return engine.clearCache();
      if (t === 'COLOR_EFFECTS_SET_DEFAULT_BACKEND')
        return engine.setDefaultBackend(String(p.backendId));
      if (t === 'COLOR_EFFECTS_VALIDATE') return engine.validate();
      if (t === 'COLOR_EFFECTS_SHUTDOWN') return engine.shutdown();
      return engine.getSnapshot();
    }),
  );
}
export const createSourceGraphColorEffectsMetadata = (
  engine: ColorEffectsEngine,
  plan?: ColorEffectsPlan,
) => engine.createSourceGraphMetadata(plan);
