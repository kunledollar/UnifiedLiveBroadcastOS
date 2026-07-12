import {
  RuntimeEngineError,
  type RuntimeCommand,
  type RuntimeCommandHandler,
} from './execution-engine.js';
import type {
  FrameLease,
  FrameMemoryManager,
  VideoFrameFormat,
  FrameMemoryDomain,
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
const redactKey = /token|secret|password|credential|cookie|url|path|handle|pointer|native|device/i;
const safe = (v: unknown, d = 0): JsonSafe => {
  if (d > 4) return '[Truncated]';
  if (v === null || typeof v === 'boolean') return v;
  if (v === undefined) return '[Undefined]';
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => safe(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, val]) => [k, redactKey.test(k) ? '[REDACTED]' : safe(val, d + 1)]),
    );
  return String(v);
};
export const deepFreezeLayerCompositor = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) deepFreezeLayerCompositor(x);
  }
  return v as Readonly<T>;
};
const cloneFreeze = <T>(v: T): Readonly<T> => deepFreezeLayerCompositor(structuredClone(v));
const ns = (n: bigint) => n.toString();
const nowDefault = () => BigInt(Date.now()) * 1000000n;

export type LayerRole =
  | 'BACKGROUND'
  | 'PRIMARY_VIDEO'
  | 'SECONDARY_VIDEO'
  | 'PICTURE_IN_PICTURE'
  | 'OVERLAY'
  | 'GRAPHIC'
  | 'LOGO'
  | 'BUG'
  | 'LOWER_THIRD'
  | 'CAPTION'
  | 'MASK_PLACEHOLDER'
  | 'EFFECT_PLACEHOLDER'
  | 'CUSTOM';
export type LayerBlendMode =
  | 'NORMAL'
  | 'REPLACE'
  | 'ADD'
  | 'MULTIPLY'
  | 'SCREEN'
  | 'DARKEN'
  | 'LIGHTEN'
  | 'DIFFERENCE'
  | 'SUBTRACT'
  | 'MIN'
  | 'MAX'
  | 'PREMULTIPLIED_OVER'
  | 'STRAIGHT_ALPHA_OVER'
  | 'CUSTOM';
export type LayerAlphaMode = 'NONE' | 'OPAQUE' | 'STRAIGHT' | 'PREMULTIPLIED' | 'UNKNOWN';
export type LayerIsolationMode = 'NONE' | 'ISOLATED' | 'PASSTHROUGH' | 'BACKEND_DEFAULT';
export type LayerTemporalPolicy =
  | 'CURRENT_FRAME_ONLY'
  | 'HOLD_LAST_VALID'
  | 'DROP_IF_MISSING'
  | 'REQUIRE_FRESH_FRAME'
  | 'ALLOW_STALE_WITH_LIMIT'
  | 'DISABLE_LAYER_IF_MISSING';
export type LayerCachePolicy =
  | 'NONE'
  | 'REUSE_STATIC_LAYER'
  | 'REUSE_UNCHANGED_LAYER'
  | 'REUSE_UNTIL_GENERATION_CHANGE'
  | 'BACKEND_DEFAULT';
export type LayerCriticality = 'CRITICAL' | 'OPTIONAL';
export type LayerOutputAlphaPolicy =
  | 'OPAQUE'
  | 'STRAIGHT'
  | 'PREMULTIPLIED'
  | 'PRESERVE_IF_POSSIBLE'
  | 'REJECT_MIXED_ALPHA'
  | 'BACKEND_DEFAULT';
export type LayerBackgroundMode =
  | 'TRANSPARENT'
  | 'OPAQUE_BLACK'
  | 'OPAQUE_WHITE'
  | 'OPAQUE_CUSTOM_COLOR'
  | 'BACKGROUND_LAYER'
  | 'PRESERVE_EXISTING'
  | 'UNDEFINED';
export type LayerEmptyCompositionPolicy =
  | 'PRODUCE_BACKGROUND'
  | 'PRODUCE_TRANSPARENT'
  | 'RETURN_EMPTY'
  | 'FAIL_COMPOSITION'
  | 'HOLD_LAST_OUTPUT'
  | 'BACKEND_DEFAULT';
export type LayerMissingLayerPolicy =
  | 'FAIL_IF_CRITICAL'
  | 'SKIP_OPTIONAL'
  | 'DROP_COMPOSITION'
  | 'RETURN_BACKGROUND'
  | 'HOLD_LAST_VALID_WHEN_EXPLICIT'
  | 'BACKEND_DEFAULT';
export type LayerQualityTier = 'FAST' | 'BALANCED' | 'HIGH_QUALITY' | 'REFERENCE';
export type LayerCompositorBackendType =
  | 'GPU_RENDER_PASS'
  | 'GPU_COMPUTE'
  | 'GPU_FRAGMENT'
  | 'CPU_SIMD'
  | 'CPU_REFERENCE'
  | 'PLATFORM_NATIVE'
  | 'SYNTHETIC';
export type LayerTimestampPolicy =
  | 'USE_RUNTIME_TICK_TIME'
  | 'USE_PRIMARY_LAYER_TIMESTAMP'
  | 'USE_LATEST_LAYER_TIMESTAMP'
  | 'USE_EARLIEST_LAYER_TIMESTAMP'
  | 'REQUIRE_ALIGNED_TIMESTAMPS'
  | 'CUSTOM';
export type LayerCompositionStatus =
  | 'COMPLETED'
  | 'PASSED_THROUGH'
  | 'EMPTY'
  | 'BACKGROUND_ONLY'
  | 'DEGRADED'
  | 'FAILED'
  | 'DROPPED'
  | 'CANCELLED'
  | 'REJECTED';
export type LayerFailureFallbackPolicy =
  | 'FAIL_FRAME'
  | 'DROP_FRAME'
  | 'RETURN_BACKGROUND'
  | 'RETURN_EMPTY'
  | 'PASS_THROUGH_SINGLE_LAYER_IF_ELIGIBLE'
  | 'REQUEST_FALLBACK_BACKEND'
  | 'DEGRADE_PIPELINE'
  | 'DISABLE_OPTIONAL_LAYERS'
  | 'REQUEST_OPERATOR_INTERVENTION';
export interface LayerRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface LayerGeometryReference {
  readonly geometryId: string;
  readonly frameGeneration: bigint;
  readonly storageGeneration: bigint;
  readonly transformedDestination: LayerRect;
  readonly sourceCrop?: LayerRect;
  readonly clippedBounds?: LayerRect;
  readonly visibleBounds?: LayerRect;
  readonly transformMatrix?: readonly number[];
  readonly pixelAspectRatio?: number;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}
export interface LayerDescriptor {
  readonly layerId: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly frame?: Readonly<VideoPipelineFrameReference>;
  readonly frameGeneration: bigint;
  readonly storageGeneration: bigint;
  readonly geometry: Readonly<LayerGeometryReference>;
  readonly zIndex: number;
  readonly order: number;
  readonly enabled: boolean;
  readonly visible: boolean;
  readonly opacity: number;
  readonly blendMode: LayerBlendMode;
  readonly alphaMode: LayerAlphaMode;
  readonly clip?: LayerRect;
  readonly layerBounds: LayerRect;
  readonly contentBounds: LayerRect;
  readonly role: LayerRole;
  readonly groupId?: string;
  readonly isolationMode: LayerIsolationMode;
  readonly cachePolicy: LayerCachePolicy;
  readonly temporalPolicy: LayerTemporalPolicy;
  readonly criticality: LayerCriticality;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}
export interface LayerGroupDescriptor {
  readonly groupId: string;
  readonly parentGroupId?: string;
  readonly order: number;
  readonly opacity: number;
  readonly visible: boolean;
  readonly isolation: LayerIsolationMode;
  readonly clip?: LayerRect;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}
export interface LayerBackgroundDescriptor {
  readonly mode: LayerBackgroundMode;
  readonly color?: readonly [number, number, number, number];
  readonly alpha?: number;
  readonly colorMetadata?: Readonly<Record<string, JsonSafe>>;
  readonly layerId?: string;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}
export interface LayerCompositionCanvas {
  readonly canvasId: string;
  readonly width: number;
  readonly height: number;
  readonly format: VideoFrameFormat | string;
  readonly colorMetadata: Readonly<Record<string, JsonSafe>>;
  readonly alphaMode: LayerAlphaMode;
  readonly memoryDomain: FrameMemoryDomain | string;
  readonly pixelAspectRatio: number;
  readonly background: Readonly<LayerBackgroundDescriptor>;
  readonly safeArea?: LayerRect;
  readonly maximumLayers: number;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}
export interface DirtyRegionSnapshot {
  readonly changedLayerIds: readonly string[];
  readonly priorBounds: Readonly<Record<string, LayerRect>>;
  readonly currentBounds: Readonly<Record<string, LayerRect>>;
  readonly unionDirtyRect?: LayerRect;
  readonly fullFrameDirty: boolean;
  readonly backgroundDirty: boolean;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface LayerSkippedResult {
  readonly layerId: string;
  readonly reason: string;
  readonly effectiveClip?: LayerRect;
}
export interface LayerCompositionPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly canvas: Readonly<LayerCompositionCanvas>;
  readonly orderedLayers: readonly Readonly<LayerDescriptor>[];
  readonly contributingLayerIds: readonly string[];
  readonly skippedLayers: readonly LayerSkippedResult[];
  readonly occludedLayerIds: readonly string[];
  readonly missingLayerIds: readonly string[];
  readonly blendOperations: readonly string[];
  readonly alphaOperations: readonly string[];
  readonly groupOperations: readonly string[];
  readonly backgroundOperation: string;
  readonly dirtyRegion: Readonly<DirtyRegionSnapshot>;
  readonly passThroughEligible: boolean;
  readonly emptyComposition: boolean;
  readonly requiresOutputAllocation: boolean;
  readonly requiresTemporaryResources: boolean;
  readonly estimatedTemporaryBytes: number;
  readonly estimatedOutputBytes: number;
  readonly estimatedOperationCount: number;
  readonly backendPreference?: string;
  readonly selectedBackendId?: string;
  readonly qualityTier: LayerQualityTier;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface LayerCompositionRequest {
  readonly requestId: string;
  readonly runtimeFrameNumber: bigint;
  readonly frameTick: Readonly<Record<string, unknown>>;
  readonly canvas: Readonly<LayerCompositionCanvas>;
  readonly layers: readonly Readonly<LayerDescriptor>[];
  readonly groups?: readonly Readonly<LayerGroupDescriptor>[];
  readonly background: Readonly<LayerBackgroundDescriptor>;
  readonly outputProfile?: Readonly<Record<string, JsonSafe>>;
  readonly backendPreference?: string;
  readonly qualityTier: LayerQualityTier;
  readonly emptyCompositionPolicy: LayerEmptyCompositionPolicy;
  readonly alphaPolicy: LayerOutputAlphaPolicy;
  readonly missingLayerPolicy: LayerMissingLayerPolicy;
  readonly timestampPolicy: LayerTimestampPolicy;
  readonly deadlineNs?: bigint;
  readonly pipelineConfigurationGeneration: bigint;
  readonly correlationId?: string;
  readonly cancellationSignal?: AbortSignal;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}
export type LayerCompositionPlanRequest = LayerCompositionRequest;
export interface LayerCompositionRuntimeContext {
  readonly frameMemory?: FrameMemoryManager;
  readonly nowNs: () => bigint;
  readonly ownerId?: string;
  readonly deviceGeneration?: bigint;
}
export interface LayerCompositionInput {
  readonly layerId: string;
  readonly frame: Readonly<VideoPipelineFrameReference>;
}
export interface LayerCompositeIdentity {
  readonly compositionId: string;
  readonly frameId: string;
  readonly storageId: string;
  readonly runtimeFrameNumber: string;
  readonly pipelineGeneration: string;
  readonly compositionGeneration: string;
  readonly contributingLayerIds: readonly string[];
  readonly primarySourceId?: string;
  readonly outputProfileId?: string;
  readonly canvasId: string;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface LayerCompositionResult {
  readonly requestId: string;
  readonly planId: string;
  readonly backendId?: string;
  readonly status: LayerCompositionStatus;
  readonly runtimeFrameNumber: string;
  readonly compositionIdentity?: Readonly<LayerCompositeIdentity>;
  readonly canvas: Readonly<LayerCompositionCanvas>;
  readonly orderedLayerIds: readonly string[];
  readonly contributingLayerIds: readonly string[];
  readonly skippedLayers: readonly LayerSkippedResult[];
  readonly occludedLayerIds: readonly string[];
  readonly missingLayerIds: readonly string[];
  readonly outputFrame?: Readonly<VideoPipelineFrameReference>;
  readonly passThrough: boolean;
  readonly emptyComposition: boolean;
  readonly backgroundApplied: boolean;
  readonly effectiveAlphaMode: LayerAlphaMode;
  readonly effectiveQuality: LayerQualityTier;
  readonly dirtyRegion: Readonly<DirtyRegionSnapshot>;
  readonly warnings: readonly string[];
  readonly timestampPolicy: LayerTimestampPolicy;
  readonly layerTimestampSkewSummary: Readonly<Record<string, JsonSafe>>;
  readonly temporaryBytes: number;
  readonly outputBytes: number;
  readonly durationNs: string;
  readonly ownershipTransfer: Readonly<Record<string, JsonSafe>>;
  readonly completedAtNs: string;
}
export interface LayerCompositorCapability {
  readonly backendId: string;
  readonly backendType: LayerCompositorBackendType;
  readonly blendModes: readonly LayerBlendMode[];
  readonly alphaModes: readonly LayerAlphaMode[];
  readonly qualityTiers: readonly LayerQualityTier[];
  readonly maximumLayers: number;
  readonly supportsPassThrough: boolean;
}
export interface LayerCompositorBackendDescriptor {
  readonly backendId: string;
  readonly backendType: LayerCompositorBackendType;
  readonly priority: number;
  readonly displayName: string;
  readonly version: string;
  readonly active: boolean;
}
export interface LayerCompositionPlanCandidate {
  readonly backendId: string;
  readonly score: number;
  readonly warnings?: readonly string[];
}
export interface LayerCompositorBackendContext {
  readonly nowNs: () => bigint;
  readonly capabilities: readonly LayerCompositorCapability[];
}
export interface LayerCompositorBackendRuntimeContext extends LayerCompositorBackendContext {
  readonly cancellationSignal?: AbortSignal;
}
export interface LayerCompositorBackendResult {
  readonly status: 'COMPLETED';
  readonly operationSignature: string;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface LayerCompositorBackendShutdownContext {
  readonly nowNs: () => bigint;
}
export interface LayerCompositorBackend {
  readonly descriptor: Readonly<LayerCompositorBackendDescriptor>;
  getCapabilities(): readonly Readonly<LayerCompositorCapability>[];
  createPlan(
    request: LayerCompositionPlanRequest,
    context: LayerCompositorBackendContext,
  ): LayerCompositionPlanCandidate | undefined;
  execute(
    plan: LayerCompositionPlan,
    inputs: readonly Readonly<LayerCompositionInput>[],
    output: FrameLease | undefined,
    context: LayerCompositorBackendRuntimeContext,
  ): Promise<LayerCompositorBackendResult>;
  shutdown(context: LayerCompositorBackendShutdownContext): Promise<void>;
}
export type LayerStackValidationRequest = LayerCompositionPlanRequest;
export interface LayerStackValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly orderedLayerIds: readonly string[];
  readonly contributingLayerIds: readonly string[];
}
export interface LayerCompositorHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly activeBackendCount: number;
  readonly failedBackendCount: number;
  readonly planCacheSize: number;
  readonly activeRequestCount: number;
  readonly completedCompositionCount: number;
  readonly passThroughCount: number;
  readonly emptyCompositionCount: number;
  readonly backgroundOnlyCount: number;
  readonly degradedCount: number;
  readonly failedCount: number;
  readonly cancelledCount: number;
  readonly rejectedCount: number;
  readonly timeoutCount: number;
  readonly invalidLayerCount: number;
  readonly missingCriticalLayerCount: number;
  readonly alphaMismatchCount: number;
  readonly unsupportedBlendCount: number;
  readonly excessiveSkewCount: number;
  readonly gpuLossCount: number;
  readonly allocationFailureCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly temporaryBytes: number;
  readonly peakTemporaryBytes: number;
  readonly lastSuccess?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface LayerCompositorTelemetrySnapshot {
  readonly totalPlanRequests: number;
  readonly totalPlansCreated: number;
  readonly totalPlanCacheHits: number;
  readonly totalPlanCacheMisses: number;
  readonly totalCompositionRequests: number;
  readonly totalCompositionsCompleted: number;
  readonly totalPassThrough: number;
  readonly totalEmptyCompositions: number;
  readonly totalBackgroundOnlyCompositions: number;
  readonly totalCompositionsFailed: number;
  readonly totalCompositionsDropped: number;
  readonly totalCompositionsCancelled: number;
  readonly totalCompositionsRejected: number;
  readonly totalLayersSubmitted: number;
  readonly totalLayersContributed: number;
  readonly totalLayersSkipped: number;
  readonly totalLayersOccluded: number;
  readonly totalLayersMissing: number;
  readonly totalOpacityOperations: number;
  readonly totalBlendOperations: number;
  readonly totalAlphaOperations: number;
  readonly totalClipOperations: number;
  readonly totalBackgroundOperations: number;
  readonly totalGroupOperations: number;
  readonly totalDirtyRegionFullFrames: number;
  readonly totalBackendFallbacks: number;
  readonly totalTimeouts: number;
  readonly totalGpuLossFailures: number;
  readonly totalAllocationFailures: number;
  readonly totalTimestampSkewWarnings: number;
  readonly averagePlanDurationNs: string;
  readonly maximumPlanDurationNs: string;
  readonly averageCompositionDurationNs: string;
  readonly maximumCompositionDurationNs: string;
  readonly peakTemporaryBytes: number;
  readonly currentRequestIds: readonly string[];
  readonly lastCompositorEvent?: string;
  readonly healthSummary: string;
}
export interface LayerCompositorSnapshot {
  readonly engineState: string;
  readonly backends: readonly LayerCompositorBackendDescriptor[];
  readonly health: LayerCompositorHealthSnapshot;
  readonly telemetry: LayerCompositorTelemetrySnapshot;
  readonly containsPixels: false;
  readonly containsRuntimeHandles: false;
}
export interface LayerCompositor {
  registerBackend(backend: LayerCompositorBackend): void;
  unregisterBackend(backendId: string): Promise<void>;
  compose(
    request: LayerCompositionRequest,
    context: LayerCompositionRuntimeContext,
  ): Promise<LayerCompositionResult>;
  plan(request: LayerCompositionPlanRequest): {
    readonly status: 'PLANNED' | 'REJECTED';
    readonly plan?: Readonly<LayerCompositionPlan>;
    readonly errors: readonly string[];
  };
  validateLayerStack(request: LayerStackValidationRequest): Readonly<LayerStackValidationReport>;
  getSnapshot(): Readonly<LayerCompositorSnapshot>;
  getTelemetry(): Readonly<LayerCompositorTelemetrySnapshot>;
  assertInvariants(): void;
  shutdown(): Promise<void>;
}

export class LayerCompositorError extends RuntimeEngineError {}
const lerr = (code: string, msg: string, details: Record<string, unknown> = {}) =>
  new LayerCompositorError(code, msg, safe(details) as Record<string, unknown>);
export const LayerCompositorErrors = {
  LayerCompositorNotReady: 'LayerCompositorNotReady',
  LayerCompositorBackendNotFound: 'LayerCompositorBackendNotFound',
  DuplicateLayerCompositorBackend: 'DuplicateLayerCompositorBackend',
  LayerCompositionInvalid: 'LayerCompositionInvalid',
  DuplicateLayerId: 'DuplicateLayerId',
  LayerOpacityInvalid: 'LayerOpacityInvalid',
  LayerBlendUnsupported: 'LayerBlendUnsupported',
  LayerAlphaInvalid: 'LayerAlphaInvalid',
  LayerAlphaMismatch: 'LayerAlphaMismatch',
  LayerCompositionCanvasInvalid: 'LayerCompositionCanvasInvalid',
  LayerCompositionCancelled: 'LayerCompositionCancelled',
  LayerCompositionTimeout: 'LayerCompositionTimeout',
  LayerCompositionInvariantViolation: 'LayerCompositionInvariantViolation',
} as const;
export const LAYER_COMPOSITOR_COMMAND_TYPES = [
  'COMPOSITOR_REGISTER_BACKEND',
  'COMPOSITOR_UNREGISTER_BACKEND',
  'COMPOSITOR_PLAN',
  'COMPOSITOR_COMPOSE',
  'COMPOSITOR_CANCEL',
  'COMPOSITOR_SET_CANVAS',
  'COMPOSITOR_SET_BACKGROUND',
  'COMPOSITOR_SET_ALPHA_POLICY',
  'COMPOSITOR_SET_EMPTY_POLICY',
  'COMPOSITOR_SET_MISSING_LAYER_POLICY',
  'COMPOSITOR_SET_TIMESTAMP_POLICY',
  'COMPOSITOR_SET_QUALITY',
  'COMPOSITOR_CLEAR_PLAN_CACHE',
  'COMPOSITOR_VALIDATE',
  'COMPOSITOR_SHUTDOWN',
] as const;
export const LAYER_COMPOSITOR_OUTPUT_KEYS = [
  'layer.composition.requests',
  'layer.composition.plans',
  'layer.composition.results',
  'layer.composition.frame',
  'layer.composition.passThrough',
  'layer.composition.empty',
  'layer.composition.failed',
  'layer.compositor.health',
  'layer.compositor.telemetry',
  'layer.stack.summary',
] as const;
export const LAYER_COMPOSITOR_EVENTS = [
  'LayerCompositorCreated',
  'LayerCompositorBackendRegistered',
  'LayerCompositorBackendUnregistered',
  'LayerCompositionPlanRequested',
  'LayerCompositionPlanCreated',
  'LayerCompositionPlanRejected',
  'LayerCompositionPlanCacheHit',
  'LayerCompositionStarted',
  'LayerCompositionCompleted',
  'LayerCompositionPassedThrough',
  'LayerCompositionEmpty',
  'LayerCompositionBackgroundOnly',
  'LayerCompositionFailed',
  'LayerCompositionDropped',
  'LayerCompositionCancelled',
  'LayerSkipped',
  'LayerOccluded',
  'LayerMissing',
  'LayerAlphaMismatch',
  'LayerBlendUnsupported',
  'LayerTimestampSkewWarning',
  'LayerCompositorBackendFallback',
  'LayerCompositorTimeout',
  'LayerCompositorGpuLost',
  'LayerCompositorHealthChanged',
  'LayerCompositorShutdown',
] as const;
export const LAYER_COMPOSITOR_WATCHDOG_INCIDENTS = [
  'COMPOSITOR_STALLED',
  'COMPOSITOR_BACKEND_FAILED',
  'COMPOSITOR_TIMEOUT',
  'COMPOSITOR_LAYER_INVALID',
  'COMPOSITOR_LAYER_MISSING',
  'COMPOSITOR_ALPHA_MISMATCH',
  'COMPOSITOR_BLEND_UNSUPPORTED',
  'COMPOSITOR_TIMESTAMP_SKEW_HIGH',
  'COMPOSITOR_TEMP_MEMORY_PRESSURE',
  'COMPOSITOR_GPU_RESOURCE_LOST',
  'COMPOSITOR_ALLOCATION_FAILED',
  'COMPOSITOR_STALE_GENERATION',
  'COMPOSITOR_PLAN_CACHE_INVALID',
  'COMPOSITOR_GRAPH_MISMATCH',
  'COMPOSITOR_OUTPUT_INVALID',
  'COMPOSITOR_INVARIANT_FAILURE',
] as const;
const roleRank: Record<LayerRole, number> = {
  BACKGROUND: 0,
  PRIMARY_VIDEO: 10,
  SECONDARY_VIDEO: 20,
  PICTURE_IN_PICTURE: 30,
  OVERLAY: 40,
  GRAPHIC: 50,
  LOGO: 60,
  BUG: 70,
  LOWER_THIRD: 80,
  CAPTION: 90,
  MASK_PLACEHOLDER: 100,
  EFFECT_PLACEHOLDER: 110,
  CUSTOM: 120,
};
const rectInt = (a: LayerRect, b: LayerRect): LayerRect | undefined => {
  const x = Math.max(a.x, b.x),
    y = Math.max(a.y, b.y),
    r = Math.min(a.x + a.width, b.x + b.width),
    bt = Math.min(a.y + a.height, b.y + b.height);
  return r > x && bt > y ? { x, y, width: r - x, height: bt - y } : undefined;
};
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const bytes = (c: LayerCompositionCanvas) => c.width * c.height * 4;

export class SyntheticLayerCompositorBackend implements LayerCompositorBackend {
  readonly descriptor: LayerCompositorBackendDescriptor;
  private readonly fail: boolean;
  private readonly supportedBlendModes: readonly LayerBlendMode[];
  constructor(
    o: Partial<LayerCompositorBackendDescriptor> & {
      fail?: boolean;
      supportedBlendModes?: readonly LayerBlendMode[];
    } = {},
  ) {
    this.descriptor = deepFreezeLayerCompositor({
      backendId: o.backendId ?? 'synthetic-layer-compositor',
      backendType: o.backendType ?? 'SYNTHETIC',
      priority: o.priority ?? 100,
      displayName: o.displayName ?? 'Synthetic Layer Compositor',
      version: o.version ?? '5.3.8',
      active: o.active ?? true,
    });
    this.fail = !!o.fail;
    this.supportedBlendModes = o.supportedBlendModes ?? [
      'NORMAL',
      'REPLACE',
      'ADD',
      'MULTIPLY',
      'SCREEN',
      'DARKEN',
      'LIGHTEN',
      'DIFFERENCE',
      'SUBTRACT',
      'MIN',
      'MAX',
      'PREMULTIPLIED_OVER',
      'STRAIGHT_ALPHA_OVER',
    ];
  }
  getCapabilities(): readonly Readonly<LayerCompositorCapability>[] {
    const cap: LayerCompositorCapability = {
      backendId: this.descriptor.backendId,
      backendType: this.descriptor.backendType,
      blendModes: this.supportedBlendModes,
      alphaModes: ['NONE', 'OPAQUE', 'STRAIGHT', 'PREMULTIPLIED'],
      qualityTiers: ['FAST', 'BALANCED', 'HIGH_QUALITY'],
      maximumLayers: 64,
      supportsPassThrough: true,
    };
    return [deepFreezeLayerCompositor(cap)];
  }
  createPlan(r: LayerCompositionPlanRequest) {
    const cap = this.getCapabilities()[0]!;
    if (!this.descriptor.active || r.layers.length > cap.maximumLayers) return undefined;
    if (
      r.layers.some(
        (l) => !cap.blendModes.includes(l.blendMode) || !cap.alphaModes.includes(l.alphaMode),
      )
    )
      return undefined;
    return { backendId: this.descriptor.backendId, score: this.descriptor.priority };
  }
  async execute(
    plan: LayerCompositionPlan,
    inputs: readonly Readonly<LayerCompositionInput>[],
    output: FrameLease | undefined,
    ctx: LayerCompositorBackendRuntimeContext,
  ) {
    if (ctx.cancellationSignal?.aborted)
      throw lerr('LayerCompositionCancelled', 'composition cancelled');
    if (this.fail) throw lerr('LayerCompositionBackendFailed', 'backend failed');
    return deepFreezeLayerCompositor({
      status: 'COMPLETED' as const,
      operationSignature: `${plan.planId}:${inputs.map((i) => i.layerId).join('|')}:${output?.frameId ?? 'pass'}`,
      metadata: { syntheticChecksum: plan.deterministicScore },
    });
  }
  async shutdown() {}
}

export class DefaultLayerCompositor implements LayerCompositor {
  private backends = new Map<string, LayerCompositorBackend>();
  private cache = new Map<string, LayerCompositionPlan>();
  private shutdownFlag = false;
  private active = new Set<string>();
  private completed = 0;
  private pass = 0;
  private empty = 0;
  private failed = 0;
  private rejected = 0;
  private lastEvent = 'LayerCompositorCreated';
  constructor(private readonly opts: { nowNs?: () => bigint; planCacheEntries?: number } = {}) {
    this.registerBackend(new SyntheticLayerCompositorBackend());
  }
  registerBackend(b: LayerCompositorBackend) {
    if (this.backends.has(b.descriptor.backendId))
      throw lerr('DuplicateLayerCompositorBackend', `duplicate backend ${b.descriptor.backendId}`);
    this.backends.set(b.descriptor.backendId, b);
    this.lastEvent = 'LayerCompositorBackendRegistered';
    this.cache.clear();
  }
  async unregisterBackend(id: string) {
    const b = this.backends.get(id);
    if (!b) throw lerr('LayerCompositorBackendNotFound', `backend ${id} not found`);
    await b.shutdown({ nowNs: this.now });
    this.backends.delete(id);
    this.cache.clear();
    this.lastEvent = 'LayerCompositorBackendUnregistered';
  }
  private get now() {
    return this.opts.nowNs ?? nowDefault;
  }
  private key(r: LayerCompositionPlanRequest) {
    return JSON.stringify(
      safe({
        canvas: r.canvas,
        layers: this.order(r.layers).map((l) => ({
          id: l.layerId,
          z: l.zIndex,
          o: l.order,
          role: l.role,
          fg: ns(l.frameGeneration),
          sg: ns(l.storageGeneration),
          gg: ns(l.geometry.frameGeneration),
          v: l.visible,
          e: l.enabled,
          op: l.opacity,
          b: l.blendMode,
          a: l.alphaMode,
          bounds: l.layerBounds,
          clip: l.clip,
          g: l.groupId,
        })),
        groups: r.groups,
        background: r.background,
        backend: r.backendPreference,
        quality: r.qualityTier,
        gen: ns(r.pipelineConfigurationGeneration),
      }),
    );
  }
  private order(layers: readonly Readonly<LayerDescriptor>[]) {
    return [...layers].sort(
      (a, b) =>
        a.zIndex - b.zIndex ||
        a.order - b.order ||
        roleRank[a.role] - roleRank[b.role] ||
        a.layerId.localeCompare(b.layerId),
    );
  }
  validateLayerStack(r: LayerStackValidationRequest) {
    const errors: string[] = [],
      warnings: string[] = [];
    const ids = new Set<string>();
    if (
      r.canvas.width <= 0 ||
      r.canvas.height <= 0 ||
      r.canvas.width > 16384 ||
      r.canvas.height > 16384
    )
      errors.push('LayerCompositionCanvasInvalid');
    if (r.layers.length > r.canvas.maximumLayers) errors.push('LayerCountExceeded');
    for (const g of r.groups ?? []) {
      if (g.opacity < 0 || g.opacity > 1 || !Number.isFinite(g.opacity))
        errors.push(`LayerGroupInvalid:${g.groupId}`);
      if (g.parentGroupId) errors.push(`LayerGroupInvalid:depth:${g.groupId}`);
      if (g.isolation !== 'NONE' && g.isolation !== 'BACKEND_DEFAULT')
        errors.push(`LayerGroupInvalid:isolation:${g.groupId}`);
    }
    for (const l of r.layers) {
      if (ids.has(l.layerId)) errors.push(`DuplicateLayerId:${l.layerId}`);
      ids.add(l.layerId);
      if (!Number.isInteger(l.zIndex) || Math.abs(l.zIndex) > 1_000_000)
        errors.push(`LayerCompositionInvalid:zIndex:${l.layerId}`);
      if (!Number.isFinite(l.opacity) || l.opacity < 0 || l.opacity > 1)
        errors.push(`LayerOpacityInvalid:${l.layerId}`);
      if (l.alphaMode === 'UNKNOWN') errors.push(`LayerAlphaInvalid:${l.layerId}`);
      if (
        l.geometry.frameGeneration !== l.frameGeneration ||
        l.geometry.storageGeneration !== l.storageGeneration
      )
        errors.push(`LayerGeometryInvalid:${l.layerId}`);
      if (
        l.frame &&
        (l.frame.state === 'LOST' ||
          l.frame.state === 'RELEASED' ||
          l.frame.frameGeneration !== l.frameGeneration ||
          l.frame.storageGeneration !== l.storageGeneration)
      )
        errors.push(`LayerFrameInvalid:${l.layerId}`);
    }
    const ordered = this.order(r.layers);
    return cloneFreeze({
      valid: errors.length === 0,
      errors,
      warnings,
      orderedLayerIds: ordered.map((l) => l.layerId),
      contributingLayerIds: ordered
        .filter((l) => l.enabled && l.visible && l.opacity > 0)
        .map((l) => l.layerId),
    });
  }
  plan(r: LayerCompositionPlanRequest) {
    const start = this.now();
    if (this.shutdownFlag)
      return { status: 'REJECTED' as const, errors: ['LayerCompositorNotReady'] };
    const rep = this.validateLayerStack(r);
    if (!rep.valid) {
      this.rejected++;
      return { status: 'REJECTED' as const, errors: rep.errors };
    }
    const k = this.key(r);
    const cached = this.cache.get(k);
    if (cached) {
      this.lastEvent = 'LayerCompositionPlanCacheHit';
      return { status: 'PLANNED' as const, plan: cached, errors: [] };
    }
    const ordered = this.order(r.layers);
    const canvasRect = { x: 0, y: 0, width: r.canvas.width, height: r.canvas.height };
    const skipped: LayerSkippedResult[] = [];
    const contrib: LayerDescriptor[] = [];
    const groups = new Map((r.groups ?? []).map((g) => [g.groupId, g]));
    for (const l of ordered) {
      const g = l.groupId ? groups.get(l.groupId) : undefined;
      const effOp = l.opacity * (g?.opacity ?? 1);
      const bounds = l.geometry.visibleBounds ?? l.geometry.clippedBounds ?? l.layerBounds;
      const clip = l.clip ? rectInt(bounds, l.clip) : bounds;
      const final = clip ? rectInt(clip, canvasRect) : undefined;
      let reason = '';
      if (!l.enabled) reason = 'DISABLED';
      else if (!l.visible || g?.visible === false) reason = 'INVISIBLE';
      else if (!l.frame) reason = 'MISSING';
      else if (effOp <= 0) reason = 'ZERO_OPACITY';
      else if (!final) reason = 'FULLY_CLIPPED_OR_OFF_CANVAS';
      if (reason) {
        const skippedLayer: LayerSkippedResult = final
          ? { layerId: l.layerId, reason, effectiveClip: final }
          : { layerId: l.layerId, reason };
        skipped.push(skippedLayer);
      } else contrib.push({ ...l, opacity: effOp });
    }
    const missing = skipped.filter((s) => s.reason === 'MISSING').map((s) => s.layerId);
    if (
      missing.length &&
      r.missingLayerPolicy === 'FAIL_IF_CRITICAL' &&
      ordered.some((l) => missing.includes(l.layerId) && l.criticality === 'CRITICAL')
    ) {
      this.rejected++;
      return { status: 'REJECTED' as const, errors: ['LayerMissingCritical'] };
    }
    const caps = [...this.backends.values()]
      .flatMap((b) => b.getCapabilities())
      .sort((a, b) => a.backendId.localeCompare(b.backendId));
    const unsupported = contrib.find(
      (l) =>
        !caps.some(
          (c) =>
            (!r.backendPreference || c.backendId === r.backendPreference) &&
            c.blendModes.includes(l.blendMode) &&
            c.alphaModes.includes(l.alphaMode),
        ),
    );
    if (unsupported) {
      this.rejected++;
      return {
        status: 'REJECTED' as const,
        errors: [`LayerBlendUnsupported:${unsupported.layerId}`],
      };
    }
    const alphaSet = new Set(
      contrib.map((l) => l.alphaMode).filter((a) => a !== 'NONE' && a !== 'OPAQUE'),
    );
    if (r.alphaPolicy === 'REJECT_MIXED_ALPHA' && alphaSet.size > 1) {
      this.rejected++;
      return { status: 'REJECTED' as const, errors: ['LayerAlphaMismatch'] };
    }
    const candidates = [...this.backends.values()]
      .map((b) => ({
        b,
        c: b.createPlan(r, { nowNs: this.now, capabilities: b.getCapabilities() }),
      }))
      .filter(
        (x) => x.c && (!r.backendPreference || x.b.descriptor.backendId === r.backendPreference),
      )
      .sort(
        (a, b) =>
          b.c!.score - a.c!.score ||
          a.b.descriptor.backendId.localeCompare(b.b.descriptor.backendId),
      );
    if (!candidates.length) {
      this.rejected++;
      return { status: 'REJECTED' as const, errors: ['LayerCompositorBackendNotFound'] };
    }
    const selected = candidates[0]!.b.descriptor.backendId;
    const full = (l: LayerDescriptor) =>
      l.opacity === 1 &&
      (l.blendMode === 'NORMAL' || l.blendMode === 'REPLACE') &&
      (l.alphaMode === 'OPAQUE' || l.alphaMode === 'NONE') &&
      eq(l.geometry.visibleBounds ?? l.layerBounds, canvasRect);
    const occluded: string[] = [];
    for (let i = 0; i < contrib.length - 1; i++)
      if (contrib.slice(i + 1).some(full)) occluded.push(contrib[i]!.layerId);
    const visible = contrib.filter((l) => !occluded.includes(l.layerId));
    const pass =
      visible.length === 1 &&
      visible[0]!.opacity === 1 &&
      ['NORMAL', 'REPLACE'].includes(visible[0]!.blendMode) &&
      eq(visible[0]!.geometry.visibleBounds ?? visible[0]!.layerBounds, canvasRect) &&
      !visible[0]!.clip &&
      eq(visible[0]!.frame?.format?.pixelFormat, r.canvas.format) &&
      eq(visible[0]!.frame?.format?.colorMetadata, r.canvas.colorMetadata) &&
      String(visible[0]!.frame?.memoryDomain) ===
        (String(r.canvas.memoryDomain).startsWith('CPU') ? 'CPU' : 'GPU') &&
      r.background.mode === 'TRANSPARENT';
    const dirty = {
      changedLayerIds: visible.map((l) => l.layerId).sort(),
      priorBounds: {},
      currentBounds: Object.fromEntries(visible.map((l) => [l.layerId, l.layerBounds])),
      ...(visible.length ? { unionDirtyRect: canvasRect } : {}),
      fullFrameDirty: true,
      backgroundDirty: r.background.mode !== 'UNDEFINED',
      metadata: {},
    };
    const plan: LayerCompositionPlan = cloneFreeze({
      planId: `lcp:${k.slice(0, 48)}`,
      requestId: r.requestId,
      canvas: r.canvas,
      orderedLayers: ordered,
      contributingLayerIds: visible.map((l) => l.layerId),
      skippedLayers: skipped,
      occludedLayerIds: occluded,
      missingLayerIds: missing,
      blendOperations: visible.map((l) => l.blendMode),
      alphaOperations: visible.map((l) => l.alphaMode),
      groupOperations: [...(r.groups ?? [])].map((g) => g.groupId),
      backgroundOperation: r.background.mode,
      dirtyRegion: dirty,
      passThroughEligible: pass,
      emptyComposition: visible.length === 0,
      requiresOutputAllocation:
        !pass && !(visible.length === 0 && r.emptyCompositionPolicy === 'RETURN_EMPTY'),
      requiresTemporaryResources: false,
      estimatedTemporaryBytes: 0,
      estimatedOutputBytes: pass ? 0 : bytes(r.canvas),
      estimatedOperationCount: visible.length,
      ...(r.backendPreference ? { backendPreference: r.backendPreference } : {}),
      selectedBackendId: selected,
      qualityTier: r.qualityTier,
      deterministicScore: Number(BigInt(k.length) + BigInt(start % 997n)),
      warnings: [],
      metadata: { durationNs: ns(this.now() - start) },
    });
    this.cache.set(k, plan);
    while (this.cache.size > (this.opts.planCacheEntries ?? 128))
      this.cache.delete([...this.cache.keys()].sort()[0]!);
    this.lastEvent = 'LayerCompositionPlanCreated';
    return { status: 'PLANNED' as const, plan, errors: [] };
  }
  async compose(r: LayerCompositionRequest, ctx: LayerCompositionRuntimeContext) {
    const start = ctx.nowNs();
    this.active.add(r.requestId);
    try {
      if (r.cancellationSignal?.aborted)
        return this.cancelled(r, 'BEFORE_PLANNING', start, ctx.nowNs());
      const pr = this.plan(r);
      if (pr.status !== 'PLANNED' || !pr.plan)
        return this.simple(r, 'REJECTED', start, ctx.nowNs(), pr.errors);
      const plan = pr.plan;
      if (r.cancellationSignal?.aborted)
        return this.cancelled(r, 'AFTER_PLANNING', start, ctx.nowNs());
      if (plan.emptyComposition) {
        this.empty++;
        return this.simple(
          r,
          r.background.mode !== 'UNDEFINED' && r.emptyCompositionPolicy === 'PRODUCE_BACKGROUND'
            ? 'BACKGROUND_ONLY'
            : 'EMPTY',
          start,
          ctx.nowNs(),
          [],
          plan,
        );
      }
      if (plan.passThroughEligible) {
        this.pass++;
        const l = r.layers.find((x) => x.layerId === plan.contributingLayerIds[0])!;
        return this.result(r, plan, 'PASSED_THROUGH', start, ctx.nowNs(), l.frame, undefined);
      }
      const b = this.backends.get(plan.selectedBackendId!);
      if (!b)
        return this.simple(
          r,
          'FAILED',
          start,
          ctx.nowNs(),
          ['LayerCompositorBackendNotFound'],
          plan,
        );
      let out: FrameLease | undefined;
      try {
        if (ctx.frameMemory)
          out = await ctx.frameMemory.allocate({
            width: r.canvas.width,
            height: r.canvas.height,
            format: r.canvas.format as VideoFrameFormat,
            memoryDomain: r.canvas.memoryDomain as FrameMemoryDomain,
            usageFlags: ['PROCESSING_OUTPUT', 'RENDER_TARGET'],
            accessMode: 'WRITE_ONLY',
            lifetimeClass: 'TICK_TRANSIENT',
            ownerId: ctx.ownerId ?? 'layer-compositor',
            metadata: { requestId: r.requestId },
          });
        if (r.cancellationSignal?.aborted) {
          out?.release();
          return this.cancelled(r, 'BEFORE_BACKEND', start, ctx.nowNs(), plan);
        }
        await b.execute(
          plan,
          plan.contributingLayerIds.map((id) => ({
            layerId: id,
            frame: r.layers.find((l) => l.layerId === id)!.frame!,
          })),
          out,
          {
            nowNs: ctx.nowNs,
            capabilities: b.getCapabilities(),
            ...(r.cancellationSignal ? { cancellationSignal: r.cancellationSignal } : {}),
          },
        );
        if (r.cancellationSignal?.aborted) {
          out?.release();
          return this.cancelled(r, 'AFTER_BACKEND', start, ctx.nowNs(), plan);
        }
        const output = out ? this.frameFromLease(out, r, plan) : undefined;
        this.completed++;
        return this.result(r, plan, 'COMPLETED', start, ctx.nowNs(), output, out);
      } catch (e) {
        out?.release();
        this.failed++;
        return this.simple(
          r,
          'FAILED',
          start,
          ctx.nowNs(),
          [String((e as Error).message ?? e)],
          plan,
        );
      }
    } finally {
      this.active.delete(r.requestId);
    }
  }
  private frameFromLease(
    l: FrameLease,
    r: LayerCompositionRequest,
    p: LayerCompositionPlan,
  ): VideoPipelineFrameReference {
    return deepFreezeLayerCompositor({
      frameId: l.frameId,
      storageId: `storage:${l.frameId}`,
      frameGeneration: l.generation,
      storageGeneration: l.generation,
      leaseId: l.leaseId,
      ownerId: l.ownerId,
      sourceId: 'composite',
      streamId: 'video',
      sequenceNumber: r.runtimeFrameNumber,
      runtimeFrameNumber: r.runtimeFrameNumber,
      format: {
        width: r.canvas.width,
        height: r.canvas.height,
        pixelFormat: r.canvas.format,
        colorMetadata: r.canvas.colorMetadata,
      },
      memoryDomain: String(r.canvas.memoryDomain).startsWith('GPU') ? 'GPU' : 'CPU',
      state: 'LEASED',
      sourceTimestampNs: r.timestampPolicy === 'USE_RUNTIME_TICK_TIME' ? r.runtimeFrameNumber : 0n,
      normalizedTimestampNs: r.runtimeFrameNumber,
      discontinuity: false,
      metadata: { compositionPlanId: p.planId },
    });
  }
  private simple(
    r: LayerCompositionRequest,
    status: LayerCompositionStatus,
    start: bigint,
    end: bigint,
    warnings: string[],
    p?: LayerCompositionPlan,
  ) {
    return this.result(
      r,
      p ?? this.plan(r).plan!,
      status,
      start,
      end,
      undefined,
      undefined,
      warnings,
    );
  }
  private cancelled(
    r: LayerCompositionRequest,
    point: string,
    start: bigint,
    end: bigint,
    p?: LayerCompositionPlan,
  ) {
    return this.simple(r, 'CANCELLED', start, end, [`LayerCompositionCancelled:${point}`], p);
  }
  private result(
    r: LayerCompositionRequest,
    p: LayerCompositionPlan,
    status: LayerCompositionStatus,
    start: bigint,
    end: bigint,
    out?: Readonly<VideoPipelineFrameReference>,
    lease?: FrameLease,
    warnings: string[] = [],
  ): LayerCompositionResult {
    const id = out
      ? {
          compositionId: `composition:${r.requestId}`,
          frameId: out.frameId,
          storageId: out.storageId,
          runtimeFrameNumber: ns(r.runtimeFrameNumber),
          pipelineGeneration: ns(r.pipelineConfigurationGeneration),
          compositionGeneration: ns(BigInt(p.deterministicScore)),
          contributingLayerIds: p.contributingLayerIds,
          ...(r.layers.find((l) => l.role === 'PRIMARY_VIDEO')?.sourceId
            ? { primarySourceId: r.layers.find((l) => l.role === 'PRIMARY_VIDEO')!.sourceId }
            : {}),
          ...(r.outputProfile?.profileId
            ? { outputProfileId: String(r.outputProfile.profileId) }
            : {}),
          canvasId: r.canvas.canvasId,
          metadata: {},
        }
      : undefined;
    const base: Omit<
      LayerCompositionResult,
      'backendId' | 'compositionIdentity' | 'outputFrame'
    > & {
      backendId?: string;
      compositionIdentity?: Readonly<LayerCompositeIdentity>;
      outputFrame?: Readonly<VideoPipelineFrameReference>;
    } = {
      requestId: r.requestId,
      planId: p.planId,
      status,
      runtimeFrameNumber: ns(r.runtimeFrameNumber),
      canvas: r.canvas,
      orderedLayerIds: p.orderedLayers.map((l) => l.layerId),
      contributingLayerIds: p.contributingLayerIds,
      skippedLayers: p.skippedLayers,
      occludedLayerIds: p.occludedLayerIds,
      missingLayerIds: p.missingLayerIds,
      passThrough: status === 'PASSED_THROUGH',
      emptyComposition: status === 'EMPTY',
      backgroundApplied: status === 'BACKGROUND_ONLY' || r.background.mode !== 'TRANSPARENT',
      effectiveAlphaMode: r.canvas.alphaMode,
      effectiveQuality: r.qualityTier,
      dirtyRegion: p.dirtyRegion,
      warnings,
      timestampPolicy: r.timestampPolicy,
      layerTimestampSkewSummary: { policy: r.timestampPolicy },
      temporaryBytes: p.estimatedTemporaryBytes,
      outputBytes: p.estimatedOutputBytes,
      durationNs: ns(end - start),
      ownershipTransfer: {
        outputLeaseId: lease?.leaseId ?? out?.leaseId ?? '',
        ownedBy: 'layer-compositor',
      },
      completedAtNs: ns(end),
    };
    return cloneFreeze({
      ...base,
      ...(p.selectedBackendId ? { backendId: p.selectedBackendId } : {}),
      ...(id ? { compositionIdentity: id } : {}),
      ...(out ? { outputFrame: out } : {}),
    });
  }
  getTelemetry() {
    return cloneFreeze({
      totalPlanRequests: this.cache.size,
      totalPlansCreated: this.cache.size,
      totalPlanCacheHits: 0,
      totalPlanCacheMisses: this.cache.size,
      totalCompositionRequests:
        this.completed + this.pass + this.empty + this.failed + this.rejected,
      totalCompositionsCompleted: this.completed,
      totalPassThrough: this.pass,
      totalEmptyCompositions: this.empty,
      totalBackgroundOnlyCompositions: 0,
      totalCompositionsFailed: this.failed,
      totalCompositionsDropped: 0,
      totalCompositionsCancelled: 0,
      totalCompositionsRejected: this.rejected,
      totalLayersSubmitted: 0,
      totalLayersContributed: 0,
      totalLayersSkipped: 0,
      totalLayersOccluded: 0,
      totalLayersMissing: 0,
      totalOpacityOperations: 0,
      totalBlendOperations: 0,
      totalAlphaOperations: 0,
      totalClipOperations: 0,
      totalBackgroundOperations: 0,
      totalGroupOperations: 0,
      totalDirtyRegionFullFrames: 0,
      totalBackendFallbacks: 0,
      totalTimeouts: 0,
      totalGpuLossFailures: 0,
      totalAllocationFailures: 0,
      totalTimestampSkewWarnings: 0,
      averagePlanDurationNs: '0',
      maximumPlanDurationNs: '0',
      averageCompositionDurationNs: '0',
      maximumCompositionDurationNs: '0',
      peakTemporaryBytes: 0,
      currentRequestIds: [...this.active].sort(),
      lastCompositorEvent: this.lastEvent,
      healthSummary: this.shutdownFlag ? 'SHUTDOWN' : 'HEALTHY',
    });
  }
  private health(): LayerCompositorHealthSnapshot {
    return cloneFreeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: this.failed ? 'DEGRADED' : 'HEALTHY',
      backendCount: this.backends.size,
      activeBackendCount: [...this.backends.values()].filter((b) => b.descriptor.active).length,
      failedBackendCount: 0,
      planCacheSize: this.cache.size,
      activeRequestCount: this.active.size,
      completedCompositionCount: this.completed,
      passThroughCount: this.pass,
      emptyCompositionCount: this.empty,
      backgroundOnlyCount: 0,
      degradedCount: 0,
      failedCount: this.failed,
      cancelledCount: 0,
      rejectedCount: this.rejected,
      timeoutCount: 0,
      invalidLayerCount: 0,
      missingCriticalLayerCount: 0,
      alphaMismatchCount: 0,
      unsupportedBlendCount: 0,
      excessiveSkewCount: 0,
      gpuLossCount: 0,
      allocationFailureCount: 0,
      staleGenerationRejectionCount: 0,
      temporaryBytes: 0,
      peakTemporaryBytes: 0,
      ...(this.completed ? { lastSuccess: ns(this.now()) } : {}),
      ...(this.failed ? { lastFailure: ns(this.now()) } : {}),
      updatedAtNs: ns(this.now()),
    });
  }
  getSnapshot() {
    return cloneFreeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      backends: [...this.backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      health: this.health(),
      telemetry: this.getTelemetry(),
      containsPixels: false as false,
      containsRuntimeHandles: false as false,
    });
  }
  assertInvariants() {
    if (new Set([...this.backends.keys()]).size !== this.backends.size)
      throw lerr('LayerCompositionInvariantViolation', 'backend ids not unique');
    if (this.cache.size > (this.opts.planCacheEntries ?? 128))
      throw lerr('LayerCompositionInvariantViolation', 'plan cache unbounded');
  }
  async shutdown() {
    if (this.shutdownFlag) return;
    await Promise.all([...this.backends.values()].map((b) => b.shutdown({ nowNs: this.now })));
    this.active.clear();
    this.cache.clear();
    this.shutdownFlag = true;
    this.lastEvent = 'LayerCompositorShutdown';
  }
}
export const createLayerCompositor = (o?: { nowNs?: () => bigint; planCacheEntries?: number }) =>
  new DefaultLayerCompositor(o);
export const createSyntheticLayerCompositorBackend = (
  o?: Partial<LayerCompositorBackendDescriptor> & {
    fail?: boolean;
    supportedBlendModes?: readonly LayerBlendMode[];
  },
) => new SyntheticLayerCompositorBackend(o);
export const createLayerCompositorCommandHandlers = (
  c: LayerCompositor,
): readonly RuntimeCommandHandler[] =>
  LAYER_COMPOSITOR_COMMAND_TYPES.map((type) => ({
    commandType: type,
    handlerName: `layer-compositor:${type}`,
    idempotent: true,
    execute: (cmd: RuntimeCommand) => ({
      status: 'SUCCEEDED' as const,
      value: safe({
        commandId: cmd.id,
        type,
        snapshot: type === 'COMPOSITOR_VALIDATE' ? c.getSnapshot() : undefined,
      }),
      metadata: { completedAtNs: nowDefault().toString() },
    }),
  }));
export const createLayerCompositorSourceGraphMetadata = (r: LayerCompositionResult) =>
  cloneFreeze({
    activeLayerCount: r.contributingLayerIds.length,
    visibleLayerCount: r.contributingLayerIds.length,
    orderedLayerIds: r.orderedLayerIds,
    primarySourceId: r.compositionIdentity?.primarySourceId,
    canvas: r.canvas,
    backgroundPolicy: r.canvas.background.mode,
    outputAlphaMode: r.effectiveAlphaMode,
    compositionStatus: r.status,
    compositorHealth: 'HEALTHY',
    lastComposedRuntimeFrame: r.runtimeFrameNumber,
    activeBackendClass: r.backendId,
    passThroughState: r.passThrough,
    dirtyRegionSummary: r.dirtyRegion,
    timestampPolicy: r.timestampPolicy,
  });
export class LayerCompositorPipelineStage implements VideoFramePipelineStage {
  readonly descriptor: VideoPipelineStageDescriptor = deepFreezeLayerCompositor({
    stageId: 'layer-compositor',
    stageKind: 'LAYER_COMPOSITOR_PLACEHOLDER',
    displayName: 'Layer Compositor',
    version: '5.3.8',
    phase: 'TRANSFORM',
    order: 700,
    dependencies: ['geometry-engine'],
    requiredInputMediaKinds: ['VIDEO'],
    supportedInputFormats: ['*'],
    supportedOutputFormats: ['*'],
    inputMemoryDomains: ['OPAQUE', 'CPU', 'GPU'],
    outputMemoryDomains: ['OPAQUE', 'CPU', 'GPU'],
    canPassThrough: true,
    requiresGpu: false,
    mutatesPixels: true,
    producesNewFrame: true,
    preservesTimestamp: false,
    preservesSourceIdentity: false,
    criticality: 'IMPORTANT',
    enabled: true,
    optional: false,
    timeoutNs: 16_000_000n,
    budgetNs: 16_000_000n,
    maximumInFlight: 4,
    metadata: { ubosVersion: '5.3.8' },
  });
  constructor(private readonly compositor: LayerCompositor = createLayerCompositor()) {}
  initialize() {
    return { status: 'READY' as const };
  }
  process(
    input: VideoPipelineStageInput,
    ctx: VideoPipelineStageRuntimeContext,
  ): VideoPipelineStageResult {
    const start = ctx.nowNs();
    return {
      status: 'PASSED_THROUGH',
      output: {
        stageId: this.descriptor.stageId,
        status: 'PASSED_THROUGH',
        inputFrameId: input.inputFrame.frameId,
        outputFrameId: input.inputFrame.frameId,
        outputLeaseId: input.inputFrame.leaseId,
        outputGeneration: input.inputFrame.frameGeneration,
        passThrough: true,
        producedNewFrame: false,
        timestampPreserved: true,
        sourceIdentityPreserved: true,
        durationNs: ctx.nowNs() - start,
        warnings: [],
        metadata: { layerCompositor: 'requires multi-layer request metadata' },
      },
    };
  }
  async shutdown() {
    await this.compositor.shutdown();
  }
}
export const createLayerCompositorPipelineStage = (c?: LayerCompositor) =>
  new LayerCompositorPipelineStage(c);
