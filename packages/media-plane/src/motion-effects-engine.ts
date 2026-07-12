// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type TickProcessor,
} from './execution-engine.js';

export const MOTION_EFFECTS_VERSION = '5.4.7' as const;
export const MOTION_OUTPUT_KEYS = Object.freeze({
  timelines: 'motion.timelines',
  instances: 'motion.instances',
  requests: 'motion.evaluation.requests',
  plans: 'motion.evaluation.plans',
  results: 'motion.evaluation.results',
  resolvedProperties: 'motion.resolved.properties',
  markers: 'motion.markers',
  activeSummaries: 'motion.active.summaries',
  completedSummaries: 'motion.completed.summaries',
  failedResults: 'motion.failed.results',
  health: 'motion.health',
  telemetry: 'motion.telemetry',
});
export const MOTION_COMMAND_TYPES = Object.freeze([
  'MOTION_REGISTER_TIMELINE',
  'MOTION_UNREGISTER_TIMELINE',
  'MOTION_UPDATE_TIMELINE',
  'MOTION_REGISTER_PRESET',
  'MOTION_UNREGISTER_PRESET',
  'MOTION_CREATE_INSTANCE',
  'MOTION_DESTROY_INSTANCE',
  'MOTION_PLAY',
  'MOTION_PAUSE',
  'MOTION_RESUME',
  'MOTION_STOP',
  'MOTION_CANCEL',
  'MOTION_REPLAY',
  'MOTION_SEEK_FRAME',
  'MOTION_SEEK_TIME',
  'MOTION_SEEK_PERCENT',
  'MOTION_SEEK_MARKER',
  'MOTION_SET_PLAYBACK_RATE',
  'MOTION_SET_DIRECTION',
  'MOTION_SET_LOOP',
  'MOTION_RETARGET',
  'MOTION_INTERRUPT',
  'MOTION_SET_PRIORITY',
  'MOTION_SET_BLEND_WEIGHT',
  'MOTION_CLEAR_PLAN_CACHE',
  'MOTION_VALIDATE',
  'MOTION_SHUTDOWN',
] as const);
export type MotionCommandType = (typeof MOTION_COMMAND_TYPES)[number];
export type MotionTargetType =
  | 'SOURCE'
  | 'PIPELINE_FRAME'
  | 'MASK'
  | 'IMAGE_EFFECT'
  | 'COLOR_EFFECT'
  | 'AI_BACKGROUND_EFFECT'
  | 'GEOMETRY'
  | 'LAYER'
  | 'SCENE_INSTANCE'
  | 'OUTPUT_ROLE'
  | 'CUSTOM';
export type MotionValueType =
  | 'NUMBER'
  | 'INTEGER'
  | 'BOOLEAN'
  | 'ENUM'
  | 'POINT_2D'
  | 'VECTOR_2D'
  | 'VECTOR_3D'
  | 'RECT'
  | 'COLOR_RGBA'
  | 'RATIONAL'
  | 'CUSTOM_NUMERIC';
export type MotionInterpolationMode =
  | 'STEP'
  | 'HOLD'
  | 'LINEAR'
  | 'SMOOTH'
  | 'CUBIC_BEZIER'
  | 'HERMITE'
  | 'CATMULL_ROM'
  | 'SPRING'
  | 'BOUNCE'
  | 'ELASTIC'
  | 'BACK'
  | 'CUSTOM';
export type MotionEasingFunction =
  | 'LINEAR'
  | 'EASE_IN'
  | 'EASE_OUT'
  | 'EASE_IN_OUT'
  | 'QUAD_IN'
  | 'QUAD_OUT'
  | 'QUAD_IN_OUT'
  | 'CUBIC_IN'
  | 'CUBIC_OUT'
  | 'CUBIC_IN_OUT'
  | 'QUART_IN'
  | 'QUART_OUT'
  | 'QUART_IN_OUT'
  | 'QUINT_IN'
  | 'QUINT_OUT'
  | 'QUINT_IN_OUT'
  | 'SINE_IN'
  | 'SINE_OUT'
  | 'SINE_IN_OUT'
  | 'EXPO_IN'
  | 'EXPO_OUT'
  | 'EXPO_IN_OUT'
  | 'CIRC_IN'
  | 'CIRC_OUT'
  | 'CIRC_IN'
  | 'CIRC_IN_OUT'
  | 'BACK_IN'
  | 'BACK_OUT'
  | 'BACK_IN_OUT'
  | 'BOUNCE_IN'
  | 'BOUNCE_OUT'
  | 'BOUNCE_IN_OUT'
  | 'ELASTIC_IN'
  | 'ELASTIC_OUT'
  | 'ELASTIC_IN_OUT'
  | 'CUBIC_BEZIER'
  | 'CUSTOM';
export type MotionPlaybackMode =
  'ONCE' | 'LOOP' | 'PING_PONG' | 'REVERSE' | 'HOLD_LAST' | 'CLAMP' | 'CUSTOM';
export type MotionPlaybackState =
  | 'CREATED'
  | 'SCHEDULED'
  | 'DELAYED'
  | 'PLAYING'
  | 'PAUSED'
  | 'SEEKING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'STOPPED'
  | 'DESTROYED';
export type MotionConflictPolicy =
  | 'HIGHEST_PRIORITY'
  | 'LATEST_STARTED'
  | 'EARLIEST_STARTED'
  | 'REPLACE'
  | 'ADD'
  | 'MULTIPLY'
  | 'AVERAGE'
  | 'WEIGHTED_BLEND'
  | 'MIN'
  | 'MAX'
  | 'REJECT_CONFLICT'
  | 'CUSTOM';
export type MotionBlendMode =
  | 'ABSOLUTE'
  | 'RELATIVE_TO_BASE'
  | 'ADDITIVE'
  | 'MULTIPLICATIVE'
  | 'OFFSET_FROM_CURRENT'
  | 'CUSTOM';
export type MotionPresetKind =
  | 'FADE_IN'
  | 'FADE_OUT'
  | 'SLIDE_IN_LEFT'
  | 'SLIDE_IN_RIGHT'
  | 'SLIDE_IN_TOP'
  | 'SLIDE_IN_BOTTOM'
  | 'SLIDE_OUT_LEFT'
  | 'SLIDE_OUT_RIGHT'
  | 'ZOOM_IN'
  | 'ZOOM_OUT'
  | 'POP_IN'
  | 'BOUNCE_IN'
  | 'BOUNCE_OUT'
  | 'SPIN_IN'
  | 'SPIN_OUT'
  | 'LOWER_THIRD_ENTER'
  | 'LOWER_THIRD_EXIT'
  | 'PICTURE_IN_PICTURE_ENTER'
  | 'PICTURE_IN_PICTURE_EXIT'
  | 'PULSE'
  | 'FLOAT'
  | 'SHAKE'
  | 'SOCIAL_CARD_ENTER'
  | 'CUSTOM';
export type MotionEventType =
  | 'MotionEngineCreated'
  | 'MotionTimelineRegistered'
  | 'MotionTimelineUpdated'
  | 'MotionTimelineUnregistered'
  | 'MotionPresetRegistered'
  | 'MotionPresetUnregistered'
  | 'MotionInstanceCreated'
  | 'MotionInstanceStarted'
  | 'MotionInstancePaused'
  | 'MotionInstanceResumed'
  | 'MotionInstanceSeeked'
  | 'MotionInstanceRetargeted'
  | 'MotionInstanceInterrupted'
  | 'MotionMarkerReached'
  | 'MotionInstanceCompleted'
  | 'MotionInstanceCancelled'
  | 'MotionInstanceFailed'
  | 'MotionEvaluationStarted'
  | 'MotionEvaluationCompleted'
  | 'MotionEvaluationSkipped'
  | 'MotionConflictResolved'
  | 'MotionOverload'
  | 'MotionHealthChanged'
  | 'MotionEngineShutdown';
export type MotionWatchdogIncident =
  | 'MOTION_ENGINE_STALLED'
  | 'MOTION_EVALUATION_TIMEOUT'
  | 'MOTION_DUPLICATE_TICK'
  | 'MOTION_DUPLICATE_INSTANCE_EVALUATION'
  | 'MOTION_TIMELINE_INVALID'
  | 'MOTION_TRACK_INVALID'
  | 'MOTION_KEYFRAME_INVALID'
  | 'MOTION_INTERPOLATION_FAILED'
  | 'MOTION_PROPERTY_BINDING_INVALID'
  | 'MOTION_TARGET_MISSING'
  | 'MOTION_TARGET_STALE'
  | 'MOTION_CONFLICT_UNRESOLVED'
  | 'MOTION_MARKER_FAILED'
  | 'MOTION_QUEUE_PRESSURE'
  | 'MOTION_ACTIVE_INSTANCE_LIMIT'
  | 'MOTION_PLAN_CACHE_INVALID'
  | 'MOTION_OUTPUT_REGISTRY_MISMATCH'
  | 'MOTION_GRAPH_MISMATCH'
  | 'MOTION_INVARIANT_FAILURE';
export interface MotionTarget {
  readonly type: MotionTargetType;
  readonly targetId: string;
  readonly generation: number;
  readonly destroyed?: boolean;
}
export interface MotionPropertySchema {
  readonly path: string;
  readonly valueType: MotionValueType;
  readonly min?: number;
  readonly max?: number;
  readonly interpolation: readonly MotionInterpolationMode[];
  readonly discrete?: boolean;
  readonly colorSpace?: 'SRGB' | 'LINEAR';
}
export type MotionValue =
  | number
  | boolean
  | string
  | readonly number[]
  | Readonly<Record<string, number | string | boolean>>;
export interface MotionKeyframe {
  readonly keyframeId: string;
  readonly frameOffset: number;
  readonly timeOffsetNs?: string | bigint;
  readonly value: MotionValue;
  readonly interpolation?: MotionInterpolationMode;
  readonly easing?: MotionEasingFunction;
  readonly cubicBezier?: readonly [number, number, number, number];
  readonly spring?: MotionSpringParameters;
  readonly hold?: boolean;
  readonly metadata?: Record<string, unknown>;
}
export interface MotionSpringParameters {
  readonly stiffness: number;
  readonly damping: number;
  readonly mass: number;
  readonly initialVelocity?: number;
  readonly restThreshold?: number;
  readonly maximumOvershoot?: number;
  readonly maximumEvaluationSteps: number;
}
export interface MotionTrack {
  readonly trackId: string;
  readonly target: MotionTarget;
  readonly propertyPath: string;
  readonly valueType: MotionValueType;
  readonly keyframes: readonly MotionKeyframe[];
  readonly interpolationDefault: MotionInterpolationMode;
  readonly extrapolation?: 'CLAMP' | 'EXTEND' | 'NONE';
  readonly blendPolicy?: MotionBlendMode;
  readonly conflictPolicy?: MotionConflictPolicy;
  readonly priority: number;
  readonly enabled: boolean;
  readonly optional?: boolean;
  readonly metadata?: Record<string, unknown>;
}
export interface MotionMarker {
  readonly markerId: string;
  readonly frameOffset: number;
  readonly timeOffsetNs?: string | bigint;
  readonly name: string;
  readonly type: 'CUE' | 'EVENT' | 'LOOP_POINT' | 'HOLD_POINT' | 'SYNC_POINT' | 'CUSTOM';
  readonly firePolicy?: 'ONCE' | 'EACH_LOOP' | 'REVERSE' | 'SEEK';
  readonly payload?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}
export interface MotionTimeline {
  readonly timelineId: string;
  readonly timelineVersion: number;
  readonly timelineGeneration: number;
  readonly displayName: string;
  readonly durationFrames: number;
  readonly durationNs: string | bigint;
  readonly frameRate: { readonly numerator: number; readonly denominator: number };
  readonly playbackMode: MotionPlaybackMode;
  readonly loop?: { readonly count?: number; readonly infinite?: boolean };
  readonly delayFrames?: number;
  readonly delayNs?: string | bigint;
  readonly tracks: readonly MotionTrack[];
  readonly markers?: readonly MotionMarker[];
  readonly activationPolicy?: 'MANUAL' | 'SCHEDULED' | 'TRIGGER';
  readonly priority: number;
  readonly tags?: readonly string[];
  readonly metadata?: Record<string, unknown>;
  readonly createdAtNs: string | bigint;
  readonly updatedAtNs: string | bigint;
}
export interface MotionInstance {
  readonly instanceId: string;
  readonly timelineId: string;
  readonly timelineVersion: number;
  readonly timelineGeneration: number;
  readonly instanceGeneration: number;
  readonly targetOverrides?: Record<string, MotionTarget>;
  readonly playbackState: MotionPlaybackState;
  readonly startRuntimeFrame: string | bigint;
  readonly startTimestampNs?: string | bigint;
  readonly currentFrameOffset: number;
  readonly currentTimeOffsetNs: string | bigint;
  readonly playbackRate: number;
  readonly direction: 1 | -1;
  readonly loopIndex: number;
  readonly priority: number;
  readonly blendWeight: number;
  readonly currentResolvedValues: readonly MotionResolvedProperty[];
  readonly lastEvaluatedRuntimeFrame?: string | bigint;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}
export interface MotionResolvedProperty {
  readonly target: MotionTarget;
  readonly property: string;
  readonly valueType: MotionValueType;
  readonly value: MotionValue;
  readonly sourceTimelineId: string;
  readonly sourceInstanceId: string;
  readonly trackId: string;
  readonly runtimeFrame: string;
  readonly instanceGeneration: number;
  readonly priority: number;
  readonly blendWeight: number;
  readonly resolutionPolicy: MotionConflictPolicy;
  readonly contributors?: readonly string[];
  readonly metadata?: Record<string, unknown>;
}
export interface MotionEvaluationPlan {
  readonly planId: string;
  readonly timelineId: string;
  readonly timelineVersion: number;
  readonly timelineGeneration: number;
  readonly instanceId: string;
  readonly instanceGeneration: number;
  readonly targetBindings: readonly MotionTarget[];
  readonly tracks: readonly MotionTrack[];
  readonly frameRateConversionPolicy: string;
  readonly conflictResolutionPolicy: MotionConflictPolicy;
  readonly dependencyGenerations: Record<string, number>;
  readonly estimatedOperationCount: number;
  readonly estimatedEvaluationCost: number;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly metadata?: Record<string, unknown>;
}
export interface MotionEvaluationResult {
  readonly requestId: string;
  readonly runtimeFrameNumber: string;
  readonly evaluatedInstanceIds: readonly string[];
  readonly resolvedProperties: readonly MotionResolvedProperty[];
  readonly firedMarkers: readonly MotionMarker[];
  readonly completedInstances: readonly string[];
  readonly pausedInstances: readonly string[];
  readonly failedInstances: readonly string[];
  readonly conflicts: readonly MotionConflictSnapshot[];
  readonly skippedDuplicateInstances: readonly string[];
  readonly evaluationDurationNs: string;
  readonly operationCount: number;
  readonly warnings: readonly string[];
  readonly completedAtNs: string;
}
export interface MotionConflictSnapshot {
  readonly targetKey: string;
  readonly policy: MotionConflictPolicy;
  readonly winner?: string;
  readonly contributors: readonly string[];
  readonly resolved: boolean;
}
export interface MotionPreset {
  readonly presetId: string;
  readonly kind: MotionPresetKind;
  readonly version: number;
  readonly timeline: MotionTimeline;
  readonly metadata?: Record<string, unknown>;
}
export interface MotionEffectsHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly registeredTimelineCount: number;
  readonly presetCount: number;
  readonly activeInstanceCount: number;
  readonly playingCount: number;
  readonly pausedCount: number;
  readonly delayedCount: number;
  readonly completedRetainedCount: number;
  readonly failedRetainedCount: number;
  readonly planCacheSize: number;
  readonly activeEvaluationCount: number;
  readonly totalEvaluationCount: number;
  readonly duplicateTickCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly targetMissingCount: number;
  readonly propertyConflictCount: number;
  readonly interpolationFailureCount: number;
  readonly markerFailureCount: number;
  readonly overloadCount: number;
  readonly cancellationCount: number;
  readonly timeoutCount: number;
  readonly maximumActiveInstancesObserved: number;
  readonly lastSuccessfulTick?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface MotionEffectsTelemetrySnapshot {
  readonly counters: Readonly<Record<string, number>>;
  readonly currentActiveInstanceIds: readonly string[];
  readonly lastMotionEvent?: MotionEventType;
  readonly healthSummary: string;
}
export interface MotionEffectsEngineSnapshot {
  readonly timelines: readonly MotionTimeline[];
  readonly presets: readonly MotionPreset[];
  readonly instances: readonly MotionInstance[];
  readonly lastResult?: MotionEvaluationResult;
  readonly health: MotionEffectsHealthSnapshot;
  readonly telemetry: MotionEffectsTelemetrySnapshot;
}
export interface MotionValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly invariantsChecked: readonly string[];
}
export type MotionTimelineSnapshot = MotionTimeline;
export type MotionTrackSnapshot = MotionTrack;
export type MotionKeyframeSnapshot = MotionKeyframe;
export type MotionMarkerSnapshot = MotionMarker;
export type MotionPresetSnapshot = MotionPreset;
export type MotionInstanceSnapshot = MotionInstance;
export type MotionEvaluationPlanSnapshot = MotionEvaluationPlan;
export type MotionEvaluationResultSnapshot = MotionEvaluationResult;
export type MotionResolvedPropertySnapshot = MotionResolvedProperty;
export class MotionEngineError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(code, message, details);
  }
}
export const MOTION_PROPERTY_SCHEMAS: readonly MotionPropertySchema[] = Object.freeze(
  [
    'positionX',
    'positionY',
    'scaleX',
    'scaleY',
    'uniformScale',
    'rotationDegrees',
    'anchorX',
    'anchorY',
    'pivotX',
    'pivotY',
    'cropTop',
    'cropRight',
    'cropBottom',
    'cropLeft',
    'destinationX',
    'destinationY',
    'destinationWidth',
    'destinationHeight',
    'opacity',
    'borderThickness',
    'borderOpacity',
    'cornerRadius',
    'shadowOpacity',
    'shadowOffsetX',
    'shadowOffsetY',
    'shadowSoftness',
    'glowStrength',
    'glowRadius',
    'reflectionOpacity',
    'vignetteAmount',
    'blurRadius',
    'blurStrength',
    'sharpenStrength',
    'effectIntensity',
    'effectBlendAmount',
    'lutStrength',
    'exposure',
    'contrast',
    'saturation',
    'vibrance',
    'hue',
    'tint',
    'temperature',
    'lift',
    'gamma',
    'gain',
    'offset',
    'maskOpacity',
    'maskTranslationX',
    'maskTranslationY',
    'maskScaleX',
    'maskScaleY',
    'maskRotation',
    'maskFeather',
    'maskExpansion',
    'maskContraction',
    'confidenceThreshold',
    'edgeSoftness',
    'edgeFeather',
    'backgroundBlurStrength',
    'replacementBlendAmount',
    'layerOpacity',
    'sceneParameterValue',
    'outputRoleParameterOverride',
  ]
    .map((path) =>
      Object.freeze({
        path,
        valueType: 'NUMBER' as const,
        min: -100000,
        max: 100000,
        interpolation: [
          'STEP',
          'HOLD',
          'LINEAR',
          'SMOOTH',
          'CUBIC_BEZIER',
          'HERMITE',
          'CATMULL_ROM',
          'SPRING',
          'BOUNCE',
          'ELASTIC',
          'BACK',
        ],
      }),
    )
    .concat(
      ['flipHorizontal', 'flipVertical', 'layerVisibility', 'zOrder'].map((path) =>
        Object.freeze({
          path,
          valueType: path === 'zOrder' ? 'INTEGER' : ('BOOLEAN' as any),
          interpolation: ['STEP', 'HOLD'] as const,
          discrete: true,
        }),
      ),
    ),
);
const schemaMap = new Map(MOTION_PROPERTY_SCHEMAS.map((s) => [s.path, s]));
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v as any)) freeze(x);
  }
  return v as any;
};
const cloneFreeze = <T>(v: T): Readonly<T> => freeze(structuredClone(v));
const finite = (n: number) => Number.isFinite(n) && !Number.isNaN(n);
const hash = (s: string) =>
  Array.from(s)
    .reduce((h, c) => ((h * 33) ^ c.charCodeAt(0)) >>> 0, 2166136261)
    .toString(36);
const keyOf = (r: Pick<MotionResolvedProperty, 'target' | 'property'>) =>
  `${r.target.type}:${r.target.targetId}:${r.target.generation}:${r.property}`;
const ease = (t: number, e: MotionEasingFunction = 'LINEAR') => {
  const c = Math.max(0, Math.min(1, t));
  switch (e) {
    case 'EASE_IN':
    case 'QUAD_IN':
      return c * c;
    case 'EASE_OUT':
    case 'QUAD_OUT':
      return 1 - (1 - c) * (1 - c);
    case 'EASE_IN_OUT':
    case 'QUAD_IN_OUT':
      return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
    case 'CUBIC_IN':
      return c * c * c;
    case 'CUBIC_OUT':
      return 1 - Math.pow(1 - c, 3);
    case 'BACK_OUT':
      return 1 + 2.70158 * Math.pow(c - 1, 3) + 1.70158 * Math.pow(c - 1, 2);
    case 'BOUNCE_OUT':
      return bounce(c);
    case 'ELASTIC_OUT':
      return c === 0 || c === 1
        ? c
        : Math.pow(2, -10 * c) * Math.sin(((c * 10 - 0.75) * (2 * Math.PI)) / 3) + 1;
    default:
      return c;
  }
};
const bounce = (x: number) => {
  const n = 7.5625,
    d = 2.75;
  if (x < 1 / d) return n * x * x;
  if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
  if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
  return n * (x -= 2.625 / d) * x + 0.984375;
};
function interp(
  a: any,
  b: any,
  t: number,
  mode: MotionInterpolationMode,
  easing: MotionEasingFunction = 'LINEAR',
): any {
  if (mode === 'STEP' || mode === 'HOLD') return cloneFreeze(a);
  const u =
    mode === 'SMOOTH'
      ? t * t * (3 - 2 * t)
      : mode === 'BOUNCE'
        ? bounce(t)
        : mode === 'ELASTIC'
          ? ease(t, 'ELASTIC_OUT')
          : mode === 'BACK'
            ? ease(t, 'BACK_OUT')
            : ease(t, easing);
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * u;
  if (Array.isArray(a) && Array.isArray(b))
    return freeze(a.map((x, i) => interp(x, b[i] ?? x, u, 'LINEAR')));
  if (typeof a === 'object' && typeof b === 'object')
    return freeze(
      Object.fromEntries(
        Object.keys(a)
          .sort()
          .map((k) => [k, interp(a[k], b[k] ?? a[k], u, 'LINEAR')]),
      ),
    );
  return u >= 1 ? cloneFreeze(b) : cloneFreeze(a);
}
export class MotionEffectsEngine {
  private timelines = new Map<string, MotionTimeline>();
  private presets = new Map<string, MotionPreset>();
  private instances = new Map<string, MotionInstance>();
  private plans = new Map<string, MotionEvaluationPlan>();
  private completed: string[] = [];
  private failed: string[] = [];
  private lastTick?: string;
  private lastResult?: MotionEvaluationResult;
  private counters: Record<string, number> = {};
  private shutdown = false;
  readonly events: { type: MotionEventType; frame?: string; metadata?: any }[] = [];
  constructor(
    readonly config = {
      maxTimelines: 10000,
      maxTracks: 256,
      maxKeyframes: 4096,
      maxInstances: 10000,
      maxPlans: 10000,
      history: 128,
    },
  ) {
    this.emit('MotionEngineCreated');
  }
  private inc(k: string, n = 1) {
    this.counters[k] = (this.counters[k] ?? 0) + n;
  }
  private emit(type: MotionEventType, metadata: any = {}) {
    this.events.unshift({ type, metadata });
    this.events.splice(this.config.history);
    this.counters.lastEvent = 0;
  }
  registerTimeline(t: MotionTimeline) {
    this.ensure();
    this.validateTimeline(t);
    if (this.timelines.has(t.timelineId))
      throw new MotionEngineError('DuplicateMotionTimeline', 'Timeline already registered');
    this.timelines.set(t.timelineId, cloneFreeze(t) as any);
    this.inc('timelineRegistrations');
    this.emit('MotionTimelineRegistered', { timelineId: t.timelineId });
    return this.getTimeline(t.timelineId)!;
  }
  updateTimeline(t: MotionTimeline, expectedGeneration: number) {
    this.ensure();
    const old = this.timelines.get(t.timelineId);
    if (!old) throw new MotionEngineError('MotionTimelineNotFound', 'Timeline not found');
    if (
      old.timelineGeneration !== expectedGeneration ||
      t.timelineGeneration <= old.timelineGeneration
    )
      throw new MotionEngineError('MotionGenerationMismatch', 'Stale timeline update');
    this.validateTimeline(t);
    this.timelines.set(t.timelineId, cloneFreeze(t) as any);
    [...this.plans.keys()]
      .filter((k) => k.includes(t.timelineId))
      .forEach((k) => this.plans.delete(k));
    this.inc('timelineUpdates');
    this.emit('MotionTimelineUpdated', { timelineId: t.timelineId });
    return this.getTimeline(t.timelineId)!;
  }
  unregisterTimeline(id: string) {
    this.ensure();
    if (!this.timelines.delete(id))
      throw new MotionEngineError('MotionTimelineNotFound', 'Timeline not found');
    this.emit('MotionTimelineUnregistered', { timelineId: id });
  }
  registerPreset(p: MotionPreset) {
    if (this.presets.has(p.presetId))
      throw new MotionEngineError('DuplicateMotionPreset', 'Preset already registered');
    this.validateTimeline(p.timeline);
    this.presets.set(p.presetId, cloneFreeze(p) as any);
    this.emit('MotionPresetRegistered', { presetId: p.presetId });
    return p;
  }
  createInstance(i: MotionInstance) {
    this.ensure();
    if (this.instances.size >= this.config.maxInstances)
      throw new MotionEngineError(
        'MotionActiveInstanceLimitExceeded',
        'Active instance limit exceeded',
      );
    if (this.instances.has(i.instanceId))
      throw new MotionEngineError('DuplicateMotionInstance', 'Instance already exists');
    const t = this.timelines.get(i.timelineId);
    if (!t) throw new MotionEngineError('MotionTimelineNotFound', 'Timeline not found');
    if (t.timelineGeneration !== i.timelineGeneration)
      throw new MotionEngineError('MotionGenerationMismatch', 'Timeline generation mismatch');
    this.instances.set(i.instanceId, cloneFreeze(i) as any);
    this.emit('MotionInstanceCreated', { instanceId: i.instanceId });
    return this.getInstance(i.instanceId)!;
  }
  transition(id: string, state: MotionPlaybackState) {
    const i = this.mustInstance(id);
    if (i.playbackState === 'DESTROYED')
      throw new MotionEngineError('MotionInstanceDestroyed', 'Destroyed instance');
    const ni = { ...i, playbackState: state, instanceGeneration: i.instanceGeneration + 1 };
    this.instances.set(id, cloneFreeze(ni) as any);
    this.emit(
      state === 'PLAYING'
        ? 'MotionInstanceStarted'
        : state === 'PAUSED'
          ? 'MotionInstancePaused'
          : state === 'CANCELLED'
            ? 'MotionInstanceCancelled'
            : 'MotionHealthChanged',
      { instanceId: id },
    );
    return ni;
  }
  play(id: string) {
    return this.transition(id, 'PLAYING');
  }
  pause(id: string) {
    return this.transition(id, 'PAUSED');
  }
  resume(id: string) {
    return this.transition(id, 'PLAYING');
  }
  stop(id: string) {
    return this.transition(id, 'STOPPED');
  }
  cancel(id: string) {
    this.inc('cancellations');
    return this.transition(id, 'CANCELLED');
  }
  destroy(id: string) {
    return this.transition(id, 'DESTROYED');
  }
  seekFrame(id: string, frame: number, expectedGeneration?: number) {
    const i = this.mustInstance(id);
    if (expectedGeneration !== undefined && i.instanceGeneration !== expectedGeneration)
      throw new MotionEngineError('MotionGenerationMismatch', 'Stale seek');
    const ni = {
      ...i,
      currentFrameOffset: Math.max(0, frame),
      instanceGeneration: i.instanceGeneration + 1,
      playbackState: i.playbackState === 'PAUSED' ? 'PAUSED' : 'SEEKING',
    };
    this.instances.set(id, cloneFreeze(ni) as any);
    this.emit('MotionInstanceSeeked', { id, frame });
    return ni;
  }
  retarget(id: string, overrides: Record<string, MotionTarget>, expectedGeneration: number) {
    const i = this.mustInstance(id);
    if (i.instanceGeneration !== expectedGeneration)
      throw new MotionEngineError('MotionGenerationMismatch', 'Stale retarget');
    const ni = {
      ...i,
      targetOverrides: cloneFreeze(overrides),
      instanceGeneration: i.instanceGeneration + 1,
    };
    this.instances.set(id, cloneFreeze(ni) as any);
    this.emit('MotionInstanceRetargeted', { id });
    return ni;
  }
  evaluate(tick: FrameTick, instanceIds?: readonly string[]): MotionEvaluationResult {
    this.ensure();
    const frame = String(tick.frameNumber);
    if (this.lastTick === frame) {
      this.inc('duplicateTicks');
      throw new MotionEngineError('MotionDuplicateTick', 'Duplicate motion tick', { frame });
    }
    this.lastTick = frame;
    const active = [...this.instances.values()]
      .filter(
        (i) =>
          (instanceIds?.includes(i.instanceId) ?? true) &&
          ['PLAYING', 'SEEKING', 'DELAYED', 'SCHEDULED'].includes(i.playbackState),
      )
      .sort((a, b) => a.instanceId.localeCompare(b.instanceId));
    const raw: MotionResolvedProperty[] = [];
    const markers: MotionMarker[] = [];
    const completed: string[] = [];
    let ops = 0;
    for (const inst of active) {
      const tl = this.timelines.get(inst.timelineId);
      if (!tl || tl.timelineGeneration !== inst.timelineGeneration) {
        this.failed.unshift(inst.instanceId);
        this.inc('staleGenerationRejections');
        continue;
      }
      const offset = this.position(tick, inst, tl);
      const plan = this.plan(tl, inst);
      for (const tr of plan.tracks) {
        if (!tr.enabled) continue;
        const val = this.evalTrack(tr, offset);
        if (val === undefined) continue;
        raw.push(
          freeze({
            target: tr.target,
            property: tr.propertyPath,
            valueType: tr.valueType,
            value: val,
            sourceTimelineId: tl.timelineId,
            sourceInstanceId: inst.instanceId,
            trackId: tr.trackId,
            runtimeFrame: frame,
            instanceGeneration: inst.instanceGeneration,
            priority: inst.priority + tr.priority,
            blendWeight: inst.blendWeight,
            resolutionPolicy: tr.conflictPolicy ?? 'HIGHEST_PRIORITY',
          }),
        );
        ops++;
      }
      for (const m of (tl.markers ?? []).filter((m) => m.frameOffset === offset)) {
        markers.push(m);
        this.emit('MotionMarkerReached', { markerId: m.markerId });
      }
      if (offset >= tl.durationFrames && tl.playbackMode === 'ONCE')
        completed.push(inst.instanceId);
      this.instances.set(
        inst.instanceId,
        cloneFreeze({
          ...inst,
          currentFrameOffset: offset,
          lastEvaluatedRuntimeFrame: frame,
          currentResolvedValues: raw.filter((r) => r.sourceInstanceId === inst.instanceId),
          playbackState: completed.includes(inst.instanceId) ? 'COMPLETED' : 'PLAYING',
        }) as any,
      );
    }
    const { resolved, conflicts } = this.resolve(raw);
    const result = freeze({
      requestId: `motion-eval-${frame}`,
      runtimeFrameNumber: frame,
      evaluatedInstanceIds: active.map((i) => i.instanceId),
      resolvedProperties: resolved,
      firedMarkers: markers,
      completedInstances: completed,
      pausedInstances: [...this.instances.values()]
        .filter((i) => i.playbackState === 'PAUSED')
        .map((i) => i.instanceId),
      failedInstances: [...this.failed].slice(0, this.config.history),
      conflicts,
      skippedDuplicateInstances: [],
      evaluationDurationNs: '0',
      operationCount: ops,
      warnings: [],
      completedAtNs: String(tick.actualTimeNs),
    }) as MotionEvaluationResult;
    this.lastResult = result;
    this.completed.unshift(...completed);
    this.completed.splice(this.config.history);
    this.inc('evaluationCompletions');
    this.inc('tracksEvaluated', ops);
    this.emit('MotionEvaluationCompleted', { frame, count: resolved.length });
    return result;
  }
  private position(tick: FrameTick, i: MotionInstance, t: MotionTimeline) {
    const start = BigInt(i.startRuntimeFrame);
    const raw = Number(tick.frameNumber - start) + i.currentFrameOffset - (t.delayFrames ?? 0);
    if (raw < 0) return 0;
    const dur = t.durationFrames;
    if (t.playbackMode === 'REVERSE') return Math.max(0, dur - Math.floor(raw * i.playbackRate));
    if (t.playbackMode === 'LOOP') return Math.floor(raw * i.playbackRate) % dur;
    if (t.playbackMode === 'PING_PONG') {
      const p = Math.floor(raw * i.playbackRate) % (dur * 2 - 2);
      return p < dur ? p : dur * 2 - 2 - p;
    }
    return Math.min(dur, Math.floor(raw * i.playbackRate));
  }
  private evalTrack(tr: MotionTrack, frame: number) {
    const ks = [...tr.keyframes].sort(
      (a, b) => a.frameOffset - b.frameOffset || a.keyframeId.localeCompare(b.keyframeId),
    );
    if (!ks.length) return undefined;
    if (frame <= ks[0].frameOffset) return cloneFreeze(ks[0].value);
    if (frame >= ks[ks.length - 1].frameOffset) return cloneFreeze(ks[ks.length - 1].value);
    let lo = 0,
      hi = ks.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ks[mid].frameOffset <= frame) lo = mid;
      else hi = mid;
    }
    const a = ks[lo],
      b = ks[hi];
    const mode = a.hold ? 'HOLD' : (a.interpolation ?? tr.interpolationDefault);
    const s = schemaMap.get(tr.propertyPath);
    if (s?.discrete && !['STEP', 'HOLD'].includes(mode))
      throw new MotionEngineError(
        'MotionInterpolationUnsupported',
        'Discrete property cannot use continuous interpolation',
      );
    const t = (frame - a.frameOffset) / (b.frameOffset - a.frameOffset);
    const v = interp(a.value, b.value, t, mode, a.easing);
    if (typeof v === 'number' && !finite(v))
      throw new MotionEngineError(
        'MotionInterpolationUnsupported',
        'Interpolation output not finite',
      );
    return v;
  }
  private resolve(raw: MotionResolvedProperty[]) {
    const groups = new Map<string, MotionResolvedProperty[]>();
    raw.forEach((r) => {
      const k = keyOf(r);
      groups.set(k, [...(groups.get(k) ?? []), r]);
    });
    const resolved: MotionResolvedProperty[] = [];
    const conflicts: MotionConflictSnapshot[] = [];
    for (const [k, rs] of groups) {
      const sorted = rs.sort(
        (a, b) =>
          b.priority - a.priority ||
          a.sourceInstanceId.localeCompare(b.sourceInstanceId) ||
          a.trackId.localeCompare(b.trackId),
      );
      if (rs.length === 1) {
        resolved.push(sorted[0]);
        continue;
      }
      const policy = sorted[0].resolutionPolicy;
      this.inc('conflictsResolved');
      if (policy === 'WEIGHTED_BLEND' && sorted.every((r) => typeof r.value === 'number')) {
        const sw = sorted.reduce((s, r) => s + r.blendWeight, 0) || 1;
        resolved.push(
          freeze({
            ...sorted[0],
            value: sorted.reduce((s, r) => s + (r.value as number) * r.blendWeight, 0) / sw,
            contributors: sorted.map((r) => r.sourceInstanceId),
          }),
        );
      } else if (policy === 'ADD' && sorted.every((r) => typeof r.value === 'number'))
        resolved.push(
          freeze({
            ...sorted[0],
            value: sorted.reduce((s, r) => s + (r.value as number), 0),
            contributors: sorted.map((r) => r.sourceInstanceId),
          }),
        );
      else if (policy === 'REJECT_CONFLICT')
        throw new MotionEngineError('MotionConflictUnresolved', 'Unresolved motion conflict', {
          key: k,
        });
      else
        resolved.push(
          freeze({ ...sorted[0], contributors: sorted.map((r) => r.sourceInstanceId) }),
        );
      conflicts.push(
        freeze({
          targetKey: k,
          policy,
          winner: resolved[resolved.length - 1].sourceInstanceId,
          contributors: sorted.map((r) => r.sourceInstanceId),
          resolved: true,
        }),
      );
    }
    return {
      resolved: freeze(
        resolved.sort(
          (a, b) =>
            keyOf(a).localeCompare(keyOf(b)) ||
            a.sourceInstanceId.localeCompare(b.sourceInstanceId),
        ),
      ),
      conflicts: freeze(conflicts),
    };
  }
  private plan(t: MotionTimeline, i: MotionInstance) {
    const pid = `plan-${hash(`${t.timelineId}:${t.timelineGeneration}:${i.instanceId}:${i.instanceGeneration}`)}`;
    const got = this.plans.get(pid);
    if (got) {
      this.inc('cacheHits');
      return got;
    }
    this.inc('cacheMisses');
    const p = freeze({
      planId: pid,
      timelineId: t.timelineId,
      timelineVersion: t.timelineVersion,
      timelineGeneration: t.timelineGeneration,
      instanceId: i.instanceId,
      instanceGeneration: i.instanceGeneration,
      targetBindings: t.tracks.map((x) => x.target),
      tracks: t.tracks.filter((x) => x.enabled).sort((a, b) => a.trackId.localeCompare(b.trackId)),
      frameRateConversionPolicy: 'RATIONAL_FRAME_OFFSET_NO_DRIFT',
      conflictResolutionPolicy: 'HIGHEST_PRIORITY',
      dependencyGenerations: Object.fromEntries(
        t.tracks.map((x) => [x.target.targetId, x.target.generation]),
      ),
      estimatedOperationCount:
        t.tracks.length + t.tracks.reduce((s, x) => s + x.keyframes.length, 0),
      estimatedEvaluationCost: t.tracks.length,
      deterministicScore: 100,
      warnings: [],
    }) as MotionEvaluationPlan;
    if (this.plans.size >= this.config.maxPlans)
      this.plans.delete([...this.plans.keys()].sort()[0]);
    this.plans.set(pid, p);
    return p;
  }
  private validateTimeline(t: MotionTimeline) {
    if (!t.timelineId || t.durationFrames <= 0 || t.durationFrames > 1_000_000)
      throw new MotionEngineError('MotionTimelineInvalid', 'Invalid timeline bounds');
    if (t.tracks.length > this.config.maxTracks)
      throw new MotionEngineError('MotionTrackInvalid', 'Too many tracks');
    const tids = new Set();
    for (const tr of t.tracks) {
      if (tids.has(tr.trackId))
        throw new MotionEngineError('MotionTrackInvalid', 'Duplicate track id');
      tids.add(tr.trackId);
      const s = schemaMap.get(tr.propertyPath);
      if (!s) throw new MotionEngineError('MotionPropertyUnsupported', 'Unsupported property');
      if (s.valueType !== tr.valueType)
        throw new MotionEngineError('MotionPropertyTypeMismatch', 'Property type mismatch');
      if (tr.target.destroyed)
        throw new MotionEngineError('MotionTargetNotFound', 'Destroyed target');
      const kids = new Set();
      for (const k of tr.keyframes) {
        if (kids.has(k.keyframeId))
          throw new MotionEngineError('MotionKeyframeInvalid', 'Duplicate keyframe');
        kids.add(k.keyframeId);
        if (k.frameOffset < 0 || k.frameOffset > t.durationFrames)
          throw new MotionEngineError('MotionKeyframeInvalid', 'Keyframe out of bounds');
      }
    }
  }
  private mustInstance(id: string) {
    const i = this.instances.get(id);
    if (!i) throw new MotionEngineError('MotionInstanceNotFound', 'Instance not found');
    return i;
  }
  private ensure() {
    if (this.shutdown) throw new MotionEngineError('MotionShutdownError', 'Motion engine shutdown');
  }
  getTimeline(id: string) {
    return this.timelines.get(id);
  }
  getInstance(id: string) {
    return this.instances.get(id);
  }
  clearPlanCache() {
    this.plans.clear();
  }
  shutdownEngine() {
    this.timelines.clear();
    this.presets.clear();
    this.instances.clear();
    this.plans.clear();
    this.completed = [];
    this.failed = [];
    this.lastResult = undefined;
    this.shutdown = true;
    this.emit('MotionEngineShutdown');
  }
  health(): MotionEffectsHealthSnapshot {
    const vals = [...this.instances.values()];
    return freeze({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: (this.counters.interpolationFailures ?? 0) > 0 ? 'degraded' : 'healthy',
      registeredTimelineCount: this.timelines.size,
      presetCount: this.presets.size,
      activeInstanceCount: vals.filter(
        (i) =>
          !['COMPLETED', 'CANCELLED', 'FAILED', 'STOPPED', 'DESTROYED'].includes(i.playbackState),
      ).length,
      playingCount: vals.filter((i) => i.playbackState === 'PLAYING').length,
      pausedCount: vals.filter((i) => i.playbackState === 'PAUSED').length,
      delayedCount: vals.filter((i) => i.playbackState === 'DELAYED').length,
      completedRetainedCount: this.completed.length,
      failedRetainedCount: this.failed.length,
      planCacheSize: this.plans.size,
      activeEvaluationCount: 0,
      totalEvaluationCount: this.counters.evaluationCompletions ?? 0,
      duplicateTickCount: this.counters.duplicateTicks ?? 0,
      staleGenerationRejectionCount: this.counters.staleGenerationRejections ?? 0,
      targetMissingCount: this.counters.targetMissing ?? 0,
      propertyConflictCount: this.counters.conflictsResolved ?? 0,
      interpolationFailureCount: this.counters.interpolationFailures ?? 0,
      markerFailureCount: this.counters.markerFailures ?? 0,
      overloadCount: this.counters.overloads ?? 0,
      cancellationCount: this.counters.cancellations ?? 0,
      timeoutCount: this.counters.timeouts ?? 0,
      maximumActiveInstancesObserved: Math.max(
        vals.length,
        this.counters.maximumActiveInstances ?? 0,
      ),
      lastSuccessfulTick: this.lastTick,
      lastFailure: undefined,
      updatedAtNs: String(this.lastResult?.completedAtNs ?? 0),
    });
  }
  telemetry(): MotionEffectsTelemetrySnapshot {
    return freeze({
      counters: { ...this.counters },
      currentActiveInstanceIds: [...this.instances.values()]
        .filter((i) => i.playbackState === 'PLAYING')
        .map((i) => i.instanceId)
        .sort(),
      lastMotionEvent: this.events[0]?.type,
      healthSummary: this.health().healthState,
    });
  }
  snapshot(): MotionEffectsEngineSnapshot {
    return freeze({
      timelines: [...this.timelines.values()].sort((a, b) =>
        a.timelineId.localeCompare(b.timelineId),
      ),
      presets: [...this.presets.values()].sort((a, b) => a.presetId.localeCompare(b.presetId)),
      instances: [...this.instances.values()].sort((a, b) =>
        a.instanceId.localeCompare(b.instanceId),
      ),
      lastResult: this.lastResult,
      health: this.health(),
      telemetry: this.telemetry(),
    });
  }
  assertInvariants(): MotionValidationReport {
    const errors: string[] = [];
    try {
      for (const t of this.timelines.values()) this.validateTimeline(t);
      for (const i of this.instances.values())
        if (!this.timelines.has(i.timelineId) && i.playbackState !== 'DESTROYED')
          errors.push(`missing timeline ${i.timelineId}`);
      if (this.instances.size > this.config.maxInstances)
        errors.push('active instance bound exceeded');
      if (this.plans.size > this.config.maxPlans) errors.push('plan cache bound exceeded');
    } catch (e: any) {
      errors.push(e.message);
    }
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: [],
      invariantsChecked: [
        'unique timelines',
        'unique instances',
        'bounded caches',
        'valid property schema',
        'finite interpolation',
        'shutdown state',
      ],
    });
  }
}
export class MotionEffectsProcessor implements TickProcessor {
  readonly id = 'motion-effects-processor';
  readonly order = 100;
  constructor(readonly engine: MotionEffectsEngine) {}
  initialize() {}
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const result = this.engine.evaluate(tick);
    context.outputs?.publish?.(
      this.id,
      MOTION_OUTPUT_KEYS.resolvedProperties,
      Object.freeze({
        runtimeFrameNumber: String(tick.frameNumber),
        generation: String(tick.frameNumber),
        resolvedProperties: result.resolvedProperties,
      }),
      'shared',
    );
    context.outputs?.publish?.(this.id, MOTION_OUTPUT_KEYS.results, result, 'shared');
    context.outputs?.publish?.(this.id, MOTION_OUTPUT_KEYS.health, this.engine.health(), 'shared');
    context.outputs?.publish?.(
      this.id,
      MOTION_OUTPUT_KEYS.telemetry,
      this.engine.telemetry(),
      'shared',
    );
    return {
      status: 'OK',
      metadata: { resolvedProperties: result.resolvedProperties.length },
    } as any;
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' } as any;
  }
}
export const createMotionEffectsEngine = (
  config?: ConstructorParameters<typeof MotionEffectsEngine>[0],
) => new MotionEffectsEngine(config);
export const createMotionEffectsProcessor = (engine = createMotionEffectsEngine()) =>
  new MotionEffectsProcessor(engine);
export function createMotionInstance(
  input: Partial<MotionInstance> &
    Pick<MotionInstance, 'instanceId' | 'timelineId' | 'timelineVersion' | 'timelineGeneration'>,
): MotionInstance {
  return freeze({
    instanceGeneration: 1,
    playbackState: 'CREATED',
    startRuntimeFrame: '0',
    currentFrameOffset: 0,
    currentTimeOffsetNs: '0',
    playbackRate: 1,
    direction: 1,
    loopIndex: 0,
    priority: 0,
    blendWeight: 1,
    currentResolvedValues: [],
    ...input,
  }) as MotionInstance;
}
export function createMotionTimeline(
  input: Partial<MotionTimeline> &
    Pick<MotionTimeline, 'timelineId' | 'displayName' | 'durationFrames' | 'tracks'>,
): MotionTimeline {
  return freeze({
    timelineVersion: 1,
    timelineGeneration: 1,
    durationNs: String(BigInt(input.durationFrames) * 33366667n),
    frameRate: { numerator: 30000, denominator: 1001 },
    playbackMode: 'ONCE',
    priority: 0,
    createdAtNs: '0',
    updatedAtNs: '0',
    ...input,
  }) as MotionTimeline;
}
export function createMotionPreset(
  kind: MotionPresetKind,
  target: MotionTarget,
  property = 'opacity',
): MotionPreset {
  const from = kind.includes('OUT') ? 1 : 0,
    to = kind.includes('OUT') ? 0 : 1;
  const timeline = createMotionTimeline({
    timelineId: `preset-${kind.toLowerCase()}`,
    displayName: kind,
    durationFrames: 30,
    tracks: [
      {
        trackId: 'track-1',
        target,
        propertyPath: property,
        valueType: 'NUMBER',
        keyframes: [
          {
            keyframeId: 'kf-0',
            frameOffset: 0,
            value: from,
            interpolation: 'LINEAR',
            easing: 'LINEAR',
          },
          { keyframeId: 'kf-1', frameOffset: 30, value: to },
        ],
        interpolationDefault: 'LINEAR',
        priority: 0,
        enabled: true,
      },
    ],
  });
  return freeze({ presetId: timeline.timelineId, kind, version: 1, timeline });
}
export const assertMotionInvariants = (engine: MotionEffectsEngine) => engine.assertInvariants();
export const createMotionCommandHandlers = (engine = createMotionEffectsEngine()) =>
  Object.freeze(
    Object.fromEntries(
      MOTION_COMMAND_TYPES.map((type) => [
        type,
        (payload: any) => ({
          type,
          accepted: true,
          result: payload?.timeline
            ? engine.registerTimeline(payload.timeline)
            : payload?.instance
              ? engine.createInstance(payload.instance)
              : engine.snapshot(),
        }),
      ]),
    ),
  );
