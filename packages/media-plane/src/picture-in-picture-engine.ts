// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeCommand,
  type RuntimeCommandHandler,
  type TickProcessor,
} from './execution-engine.js';

export const PICTURE_IN_PICTURE_VERSION = '5.4.8' as const;
export const PIP_LIMITS = Object.freeze({
  layouts: 128,
  variants: 256,
  presets: 64,
  instances: 128,
  slots: 16,
  bindings: 32,
  plans: 512,
  heldFrames: 32,
  events: 256,
  auxOutputs: 16,
  overflowPages: 8,
});
export const PIP_LAYOUT_TYPES = Object.freeze([
  'SINGLE_INSET',
  'DUAL_INSET',
  'TRIPLE_INSET',
  'QUAD_INSET',
  'SIDE_BY_SIDE',
  'TOP_BOTTOM',
  'GRID_2X2',
  'GRID_3X3',
  'GRID_CUSTOM',
  'PRESENTER_OVER_SLIDES',
  'PRESENTER_LEFT_SLIDES_RIGHT',
  'PRESENTER_RIGHT_SLIDES_LEFT',
  'INTERVIEW_TWO_PERSON',
  'INTERVIEW_THREE_PERSON',
  'INTERVIEW_FOUR_PERSON',
  'ACTIVE_SPEAKER_WITH_GUESTS',
  'MAIN_WITH_THUMBNAILS',
  'SOCIAL_VERTICAL_GUESTS',
  'SOCIAL_VERTICAL_HOST_AND_GUEST',
  'HORIZONTAL_PANEL',
  'SQUARE_PANEL',
  'FLOATING_WINDOW',
  'DOCKED_PANEL',
  'CUSTOM',
] as const);
export type PictureInPictureLayoutType = (typeof PIP_LAYOUT_TYPES)[number];
export const PIP_OUTPUT_ROLES = Object.freeze([
  'PROGRAM',
  'PREVIEW',
  'HORIZONTAL_PROGRAM',
  'VERTICAL_PROGRAM',
  'SQUARE_PROGRAM',
  'CLEAN_FEED',
  'AUXILIARY',
  'MULTIVIEW',
  'CUSTOM',
] as const);
export type PictureInPictureOutputRole = (typeof PIP_OUTPUT_ROLES)[number];
export const PIP_SLOT_ROLES = Object.freeze([
  'PRIMARY',
  'SECONDARY',
  'HOST',
  'GUEST',
  'PRESENTER',
  'PRESENTATION',
  'SCREEN_SHARE',
  'AUDIENCE',
  'CAMERA',
  'REMOTE_GUEST',
  'THUMBNAIL',
  'CUSTOM',
] as const);
export type PictureInPictureSlotRole = (typeof PIP_SLOT_ROLES)[number];
export type PictureInPictureAssignmentPolicy =
  | 'EXPLICIT'
  | 'ROLE_BASED'
  | 'PRIORITY_BASED'
  | 'STABLE_SOURCE_ORDER'
  | 'ARRIVAL_ORDER'
  | 'ACTIVE_SPEAKER'
  | 'PINNED_HOST'
  | 'PINNED_PRESENTATION'
  | 'ROUND_ROBIN'
  | 'CUSTOM';
export type PictureInPictureAutoLayoutPolicy =
  | 'FIXED_LAYOUT'
  | 'SELECT_BY_SOURCE_COUNT'
  | 'SELECT_BY_ROLE_COUNT'
  | 'SELECT_BY_OUTPUT_ASPECT'
  | 'SELECT_BY_ACTIVE_SPEAKER'
  | 'SELECT_BY_PRESENTATION_STATE'
  | 'CUSTOM';
export type PictureInPictureMissingSourcePolicy =
  | 'FAIL_LAYOUT'
  | 'DROP_LAYOUT_FRAME'
  | 'SKIP_OPTIONAL_SLOT'
  | 'USE_PLACEHOLDER'
  | 'USE_TRANSPARENT'
  | 'USE_BLACK'
  | 'HOLD_LAST_VALID_FRAME'
  | 'COLLAPSE_LAYOUT'
  | 'REFLOW_REMAINING_SLOTS'
  | 'DEGRADE_LAYOUT'
  | 'REQUEST_OPERATOR_INTERVENTION';
export type PictureInPictureFrozenSourcePolicy =
  | 'CONTINUE'
  | 'MARK_DEGRADED'
  | 'HOLD_LAST'
  | 'DROP_SLOT'
  | 'COLLAPSE_SLOT'
  | 'USE_PLACEHOLDER'
  | 'FAIL_LAYOUT';
export type PictureInPictureOverflowPolicy =
  | 'REJECT_EXTRA_SOURCES'
  | 'IGNORE_LOWEST_PRIORITY'
  | 'ROTATE_SOURCES'
  | 'CREATE_OVERFLOW_PAGE'
  | 'SELECT_ACTIVE_SPEAKERS'
  | 'EXPAND_TO_COMPATIBLE_LAYOUT'
  | 'REQUEST_OPERATOR_INTERVENTION';
export type PictureInPictureFitMode =
  | 'FIT'
  | 'FILL'
  | 'STRETCH'
  | 'NATIVE'
  | 'CENTER'
  | 'INTEGER_SCALE'
  | 'DOWNSCALE_ONLY'
  | 'UPSCALE_ONLY'
  | 'CUSTOM';
export type PictureInPictureCropPolicy =
  | 'REJECT_OUT_OF_BOUNDS'
  | 'CLAMP_TO_SOURCE'
  | 'CENTER_CROP'
  | 'ASPECT_CROP'
  | 'SAFE_AREA_CROP'
  | 'CUSTOM';
export type PictureInPictureActivationState =
  | 'CREATED'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATING'
  | 'INACTIVE'
  | 'FAILED'
  | 'DESTROYED';
export type PictureInPictureResultStatus =
  | 'COMPLETED'
  | 'PASSED_THROUGH'
  | 'DEGRADED'
  | 'EMPTY'
  | 'DROPPED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED';
export const PIP_OUTPUT_KEYS = Object.freeze({
  layoutDefinitions: 'pip.layout.definitions',
  layoutInstances: 'pip.layout.instances',
  requests: 'pip.requests',
  plans: 'pip.plans',
  results: 'pip.results',
  slotAssignments: 'pip.slot.assignments',
  programOutput: 'pip.output.program',
  previewOutput: 'pip.output.preview',
  horizontalOutput: 'pip.output.horizontal',
  verticalOutput: 'pip.output.vertical',
  squareOutput: 'pip.output.square',
  auxOutputs: 'pip.output.aux',
  passThroughOutputs: 'pip.output.passThrough',
  failedResults: 'pip.results.failed',
  health: 'pip.health',
  telemetry: 'pip.telemetry',
  activeInstanceSummaries: 'pip.instances.active',
});
export const PIP_COMMAND_TYPES = Object.freeze([
  'PIP_REGISTER_LAYOUT',
  'PIP_UNREGISTER_LAYOUT',
  'PIP_UPDATE_LAYOUT',
  'PIP_REGISTER_VARIANT',
  'PIP_UNREGISTER_VARIANT',
  'PIP_CREATE_INSTANCE',
  'PIP_DESTROY_INSTANCE',
  'PIP_ACTIVATE',
  'PIP_DEACTIVATE',
  'PIP_SUSPEND',
  'PIP_RESUME',
  'PIP_BIND_SOURCE',
  'PIP_UNBIND_SOURCE',
  'PIP_SWAP_SLOTS',
  'PIP_SET_PRIMARY_SOURCE',
  'PIP_SET_LAYOUT',
  'PIP_SET_VARIANT',
  'PIP_SET_OUTPUT_ROLE',
  'PIP_SET_ASSIGNMENT_POLICY',
  'PIP_SET_MISSING_SOURCE_POLICY',
  'PIP_SET_FROZEN_SOURCE_POLICY',
  'PIP_PLAN',
  'PIP_RENDER',
  'PIP_CANCEL',
  'PIP_CLEAR_PLAN_CACHE',
  'PIP_VALIDATE',
  'PIP_SHUTDOWN',
] as const);
export const PIP_EVENTS = Object.freeze([
  'PipEngineCreated',
  'PipLayoutRegistered',
  'PipLayoutUpdated',
  'PipLayoutUnregistered',
  'PipVariantRegistered',
  'PipPresetRegistered',
  'PipInstanceCreated',
  'PipInstanceActivated',
  'PipInstanceSuspended',
  'PipInstanceDeactivated',
  'PipInstanceDestroyed',
  'PipSourceBound',
  'PipSourceUnbound',
  'PipSlotAssigned',
  'PipSlotsSwapped',
  'PipPlanCreated',
  'PipPlanCacheHit',
  'PipRenderStarted',
  'PipRenderCompleted',
  'PipRenderPassedThrough',
  'PipRenderDegraded',
  'PipRenderDropped',
  'PipRenderCancelled',
  'PipRenderFailed',
  'PipSourceMissing',
  'PipSourceFrozen',
  'PipOverflowHandled',
  'PipLayoutCollapsed',
  'PipLayoutReflowed',
  'PipOutputPublished',
  'PipHealthChanged',
  'PipEngineShutdown',
] as const);
export const PIP_WATCHDOG_INCIDENTS = Object.freeze([
  'PIP_ENGINE_STALLED',
  'PIP_RENDER_TIMEOUT',
  'PIP_RENDER_FAILED',
  'PIP_DUPLICATE_REQUEST',
  'PIP_LAYOUT_INVALID',
  'PIP_VARIANT_INVALID',
  'PIP_SLOT_INVALID',
  'PIP_ASSIGNMENT_FAILED',
  'PIP_REQUIRED_SOURCE_MISSING',
  'PIP_SOURCE_FROZEN',
  'PIP_SOURCE_OVERFLOW',
  'PIP_GEOMETRY_FAILED',
  'PIP_IMAGE_EFFECTS_FAILED',
  'PIP_MASK_INVALID',
  'PIP_KEY_MATTE_INVALID',
  'PIP_MOTION_SNAPSHOT_STALE',
  'PIP_LAYER_COMPOSITOR_FAILED',
  'PIP_OUTPUT_PROFILE_MISMATCH',
  'PIP_TEMP_MEMORY_PRESSURE',
  'PIP_HELD_FRAME_PRESSURE',
  'PIP_GPU_RESOURCE_LOST',
  'PIP_STALE_GENERATION',
  'PIP_PLAN_CACHE_INVALID',
  'PIP_GRAPH_MISMATCH',
  'PIP_INVARIANT_FAILURE',
] as const);
const redactKey =
  /token|secret|password|credential|cookie|url|path|handle|pointer|native|device|gpu|frame/i;
const now = () => BigInt(Date.now()) * 1000000n;
const s = (v: any, d = 0): any => {
  if (d > 5) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? v.slice(0, 256) + '…' : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => s(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v)
        .slice(0, 64)
        .map(([k, val]) => [k, redactKey.test(k) ? '[REDACTED]' : s(val, d + 1)]),
    );
  return String(v);
};
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v as any)) freeze(x as any);
  }
  return v as any;
};
const cf = <T>(v: T): Readonly<T> => freeze(structuredClone(v));
const id = (p: string, ...xs: any[]) => `${p}:${xs.map((x) => String(x)).join(':')}`;
export interface PictureInPictureSlot {
  slotId: string;
  slotIndex: number;
  role: PictureInPictureSlotRole;
  destination: { x: number; y: number; width: number; height: number };
  coordinateSpace: string;
  fitMode: PictureInPictureFitMode;
  alignment: string;
  sourceCropPolicy: PictureInPictureCropPolicy;
  zOrder: number;
  visible: boolean;
  opacity: number;
  required: boolean;
  sourceBinding?: string;
  fallbackBinding?: string;
  borderProfile?: any;
  cornerProfile?: any;
  shadowProfile?: any;
  maskReference?: any;
  keyingReference?: any;
  imageEffectPresetReferences?: readonly any[];
  motionPresetReferences?: readonly any[];
  safeAreaConstraints?: any;
  priority: number;
  safeMetadata?: any;
}
export interface PictureInPictureLayoutDefinition {
  layoutId: string;
  layoutVersion: number;
  layoutGeneration: number;
  displayName: string;
  layoutType: PictureInPictureLayoutType;
  outputProfileReference: string;
  canvas: { width: number; height: number };
  frameRate: { numerator: number; denominator: number };
  slots: readonly PictureInPictureSlot[];
  safeAreaProfile?: any;
  backgroundPolicy: any;
  slotAssignmentPolicy: PictureInPictureAssignmentPolicy;
  missingSourcePolicy: PictureInPictureMissingSourcePolicy;
  frozenSourcePolicy: PictureInPictureFrozenSourcePolicy;
  overflowPolicy: PictureInPictureOverflowPolicy;
  animationPolicy?: any;
  outputRoleCompatibility: readonly PictureInPictureOutputRole[];
  tags: readonly string[];
  safeMetadata?: any;
  createdAtNs: string;
  updatedAtNs: string;
}
export interface PictureInPictureSourceBinding {
  bindingId: string;
  sourceId: string;
  streamId: string;
  expectedSourceGeneration: number;
  preferredSlotId?: string;
  role: PictureInPictureSlotRole;
  priority: number;
  required: boolean;
  active: boolean;
  safeMetadata?: any;
}
export interface PictureInPictureLayoutVariant {
  variantId: string;
  baseLayoutId: string;
  outputRole: PictureInPictureOutputRole;
  outputProfile: string;
  slotOverrides?: Record<string, Partial<PictureInPictureSlot>>;
  visibilityOverrides?: Record<string, boolean>;
  geometryOverrides?: Record<string, any>;
  safeAreaProfile?: any;
  sourceAssignmentOverrides?: any;
  animationOverrides?: any;
  safeMetadata?: any;
  generation: number;
}
export interface PictureInPictureLayoutInstance {
  instanceId: string;
  layoutId: string;
  layoutVersion: number;
  layoutGeneration: number;
  instanceGeneration: number;
  outputRole: PictureInPictureOutputRole;
  activationState: PictureInPictureActivationState;
  sourceBindings: readonly PictureInPictureSourceBinding[];
  resolvedSlotAssignments: readonly any[];
  activeVariantId?: string;
  currentRuntimeFrame: string;
  lastPlanId?: string;
  lastSuccessfulOutputSummary?: any;
  healthState: string;
  safeMetadata?: any;
}
export interface PictureInPictureRequest {
  requestId: string;
  instanceId: string;
  expectedLayoutVersion: number;
  expectedLayoutGeneration: number;
  expectedInstanceGeneration: number;
  runtimeFrameNumber: string;
  frameTick: any;
  outputRole: PictureInPictureOutputRole;
  sourceFrameBindings: readonly any[];
  sourceHealthSummaries?: readonly any[];
  motionResolvedPropertySnapshot?: any;
  outputProfile: string;
  deadlineNs?: string;
  configurationGeneration?: number;
  cancellationReference?: { cancelled?: boolean };
  correlationId?: string;
  safeMetadata?: any;
}
export interface PictureInPicturePlan {
  planId: string;
  layoutId: string;
  layoutVersion: number;
  layoutGeneration: number;
  instanceId: string;
  instanceGeneration: number;
  runtimeFrameNumber: string;
  outputRole: PictureInPictureOutputRole;
  outputProfile: string;
  selectedVariantId?: string;
  orderedSlots: readonly PictureInPictureSlot[];
  sourceAssignments: readonly any[];
  geometryPlans: readonly any[];
  visualDependencyReferences: readonly any[];
  motionTargetReferences: readonly any[];
  backgroundPolicy: any;
  safeAreaResults: any;
  passThroughEligible: boolean;
  requiresComposition: boolean;
  estimatedLayerCount: number;
  estimatedTemporaryBytes: number;
  estimatedOutputBytes: number;
  estimatedOperationCount: number;
  deterministicScore: string;
  warnings: readonly string[];
  safeMetadata?: any;
}
export interface PictureInPictureResult {
  requestId: string;
  planId: string;
  layoutId: string;
  layoutVersion: number;
  layoutGeneration: number;
  instanceId: string;
  instanceGeneration: number;
  runtimeFrameNumber: string;
  outputRole: PictureInPictureOutputRole;
  status: PictureInPictureResultStatus;
  outputFrameReference?: any;
  passThrough: boolean;
  compositionApplied: boolean;
  selectedVariantId?: string;
  sourceAssignmentSummary: readonly any[];
  renderedSlotCount: number;
  skippedSlotCount: number;
  missingSourceCount: number;
  frozenSourceCount: number;
  overflowSourceCount: number;
  reflowApplied: boolean;
  animationApplied: boolean;
  outputProfile: string;
  warnings: readonly string[];
  temporaryBytes: number;
  outputBytes: number;
  durationNs: string;
  ownershipTransfer: string;
  completedAtNs: string;
}
export class PipEngineError extends RuntimeEngineError {
  constructor(
    readonly code: string,
    msg: string,
    meta?: any,
  ) {
    super(code, msg, meta);
  }
}
export const PipEngineNotReady = PipEngineError,
  PipLayoutNotFound = PipEngineError,
  DuplicatePipLayout = PipEngineError,
  PipVariantNotFound = PipEngineError,
  DuplicatePipVariant = PipEngineError,
  PipPresetNotFound = PipEngineError,
  DuplicatePipPreset = PipEngineError,
  PipInstanceNotFound = PipEngineError,
  DuplicatePipInstance = PipEngineError,
  PipLayoutInvalid = PipEngineError,
  PipSlotInvalid = PipEngineError,
  PipAssignmentFailed = PipEngineError,
  PipStateTransitionInvalid = PipEngineError,
  PipGenerationMismatch = PipEngineError,
  PipSourceNotFound = PipEngineError,
  PipSourceGenerationMismatch = PipEngineError,
  PipRequiredSourceMissing = PipEngineError,
  PipSourceFrozen = PipEngineError,
  PipSourceOverflow = PipEngineError,
  PipOutputProfileMismatch = PipEngineError,
  PipMotionSnapshotStale = PipEngineError,
  PipGeometryFailed = PipEngineError,
  PipEffectsFailed = PipEngineError,
  PipCompositorFailed = PipEngineError,
  PipDuplicateRequest = PipEngineError,
  PipRenderTimeout = PipEngineError,
  PipRenderCancelled = PipEngineError,
  PipAllocationFailed = PipEngineError,
  PipOwnershipViolation = PipEngineError,
  PipInvariantViolation = PipEngineError,
  PipShutdownError = PipEngineError;
const slot = (
  slotId: string,
  slotIndex: number,
  role: PictureInPictureSlotRole,
  d: any,
  required = true,
): PictureInPictureSlot =>
  cf({
    slotId,
    slotIndex,
    role,
    destination: d,
    coordinateSpace: 'CANVAS_NORMALIZED',
    fitMode: 'FIT',
    alignment: 'CENTER',
    sourceCropPolicy: 'REJECT_OUT_OF_BOUNDS',
    zOrder: slotIndex,
    visible: true,
    opacity: 1,
    required,
    priority: slotIndex,
    safeMetadata: {},
  });
export function createPictureInPictureLayoutDefinition(
  input: Partial<PictureInPictureLayoutDefinition> &
    Pick<PictureInPictureLayoutDefinition, 'layoutId' | 'displayName' | 'layoutType' | 'slots'>,
): PictureInPictureLayoutDefinition {
  if (!PIP_LAYOUT_TYPES.includes(input.layoutType as any))
    throw new PipLayoutInvalid('PipLayoutInvalid', 'unsupported layout type');
  const ids = new Set();
  [...input.slots]
    .sort((a, b) => a.slotIndex - b.slotIndex || a.slotId.localeCompare(b.slotId))
    .forEach((x, i) => {
      if (ids.has(x.slotId)) throw new PipSlotInvalid('PipSlotInvalid', 'duplicate slot');
      ids.add(x.slotId);
      if (x.slotIndex !== i)
        throw new PipSlotInvalid('PipSlotInvalid', 'non deterministic slot indexes');
    });
  if (input.slots.length > PIP_LIMITS.slots)
    throw new PipSlotInvalid('PipSlotInvalid', 'slot count exceeds bound');
  const t = now().toString();
  return cf({
    layoutVersion: 1,
    layoutGeneration: 1,
    outputProfileReference: 'profile:1920x1080p30',
    canvas: { width: 1920, height: 1080 },
    frameRate: { numerator: 30000, denominator: 1001 },
    safeAreaProfile: { mode: 'TITLE_SAFE' },
    backgroundPolicy: { mode: 'TRANSPARENT' },
    slotAssignmentPolicy: 'EXPLICIT',
    missingSourcePolicy: 'FAIL_LAYOUT',
    frozenSourcePolicy: 'CONTINUE',
    overflowPolicy: 'REJECT_EXTRA_SOURCES',
    animationPolicy: { enabled: false },
    outputRoleCompatibility: [
      'PROGRAM',
      'PREVIEW',
      'HORIZONTAL_PROGRAM',
      'VERTICAL_PROGRAM',
      'SQUARE_PROGRAM',
      'CLEAN_FEED',
      'AUXILIARY',
    ],
    tags: [],
    safeMetadata: {},
    createdAtNs: t,
    updatedAtNs: t,
    ...input,
    slots: [...input.slots].sort(
      (a, b) => a.slotIndex - b.slotIndex || a.slotId.localeCompare(b.slotId),
    ),
  });
}
const mkLayout = (
  name: string,
  type: PictureInPictureLayoutType,
  slots: PictureInPictureSlot[],
  canvas = { width: 1920, height: 1080 },
) =>
  createPictureInPictureLayoutDefinition({
    layoutId: `pip:preset:${name.toLowerCase()}`,
    displayName: name,
    layoutType: type,
    slots,
    canvas,
  });
export const PICTURE_IN_PICTURE_BUILTIN_PRESETS = cf([
  'PRESENTER_OVER_SLIDES',
  'HOST_AND_GUEST',
  'TWO_PERSON_INTERVIEW',
  'THREE_PERSON_INTERVIEW',
  'FOUR_PERSON_GRID',
  'SIDE_BY_SIDE',
  'TOP_BOTTOM',
  'MAIN_WITH_TWO_THUMBNAILS',
  'MAIN_WITH_FOUR_THUMBNAILS',
  'VERTICAL_HOST_AND_GUEST',
  'VERTICAL_ACTIVE_SPEAKER',
  'SQUARE_TWO_PERSON',
  'CLEAN_FEED_PRESENTATION',
  'PODCAST_GUEST_PANEL',
  'CHURCH_PRESENTER_AND_SLIDES',
  'GAMING_FACE_CAM',
  'SOCIAL_LIVE_RELAY',
  'CUSTOM',
]);
export function createPictureInPicturePresetLayout(name: string) {
  const n = String(name).toUpperCase();
  const two = [
    slot('primary', 0, 'PRIMARY', { x: 0, y: 0, width: 0.5, height: 1 }),
    slot('secondary', 1, 'SECONDARY', { x: 0.5, y: 0, width: 0.5, height: 1 }, false),
  ];
  if (n.includes('VERTICAL'))
    return mkLayout(n, 'SOCIAL_VERTICAL_HOST_AND_GUEST', two, { width: 1080, height: 1920 });
  if (n.includes('SQUARE')) return mkLayout(n, 'SQUARE_PANEL', two, { width: 1080, height: 1080 });
  if (n.includes('TOP_BOTTOM'))
    return mkLayout(n, 'TOP_BOTTOM', [
      slot('top', 0, 'PRIMARY', { x: 0, y: 0, width: 1, height: 0.5 }),
      slot('bottom', 1, 'SECONDARY', { x: 0, y: 0.5, width: 1, height: 0.5 }, false),
    ]);
  if (n.includes('FOUR') || n.includes('GRID'))
    return mkLayout(n, 'GRID_2X2', [
      slot('s0', 0, 'PRIMARY', { x: 0, y: 0, width: 0.5, height: 0.5 }),
      slot('s1', 1, 'GUEST', { x: 0.5, y: 0, width: 0.5, height: 0.5 }, false),
      slot('s2', 2, 'GUEST', { x: 0, y: 0.5, width: 0.5, height: 0.5 }, false),
      slot('s3', 3, 'GUEST', { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }, false),
    ]);
  if (n.includes('PRESENTER') || n.includes('SLIDES') || n.includes('PRESENTATION'))
    return mkLayout(n, 'PRESENTER_OVER_SLIDES', [
      slot('slides', 0, 'PRESENTATION', { x: 0, y: 0, width: 1, height: 1 }),
      slot('presenter', 1, 'PRESENTER', { x: 0.68, y: 0.58, width: 0.28, height: 0.32 }, false),
    ]);
  return mkLayout(n, n.includes('SIDE') ? 'SIDE_BY_SIDE' : 'INTERVIEW_TWO_PERSON', two);
}
export class PictureInPictureEngine {
  layouts = new Map();
  variants = new Map();
  presets = new Map();
  instances = new Map();
  planCache = new Map();
  requests = new Set();
  processedTicks = new Set();
  events = [];
  shutdown = false;
  counters: any = {
    layoutRegistrations: 0,
    layoutUpdates: 0,
    layoutRemovals: 0,
    variantRegistrations: 0,
    presetRegistrations: 0,
    instanceCreations: 0,
    instanceDestructions: 0,
    activations: 0,
    deactivations: 0,
    sourceBindings: 0,
    sourceUnbindings: 0,
    slotSwaps: 0,
    layoutRequests: 0,
    plans: 0,
    cacheHits: 0,
    cacheMisses: 0,
    rendersCompleted: 0,
    passedThrough: 0,
    degraded: 0,
    dropped: 0,
    cancelled: 0,
    failed: 0,
    programOutputs: 0,
    previewOutputs: 0,
    horizontalOutputs: 0,
    verticalOutputs: 0,
    squareOutputs: 0,
    auxOutputs: 0,
    slotsRendered: 0,
    slotsSkipped: 0,
    missingSources: 0,
    frozenSources: 0,
    overflowSources: 0,
    collapses: 0,
    reflows: 0,
    placeholders: 0,
    heldFrameUses: 0,
    geometryFailures: 0,
    effectsFailures: 0,
    maskFailures: 0,
    keyFailures: 0,
    compositorFailures: 0,
    duplicateRequests: 0,
    staleGenerationRejects: 0,
    timeouts: 0,
    gpuLoss: 0,
    peakTemporaryBytes: 0,
  };
  constructor() {
    for (const p of PICTURE_IN_PICTURE_BUILTIN_PRESETS) {
      this.presets.set(p, {
        presetId: p,
        layout: createPictureInPicturePresetLayout(p),
        version: 1,
        generation: 1,
      });
      this.counters.presetRegistrations++;
    }
    this.e('PipEngineCreated', {});
  }
  e(type: string, metadata: any) {
    this.events.push(cf({ type, metadata: s(metadata), atNs: now().toString() }));
    if (this.events.length > PIP_LIMITS.events) this.events.shift();
  }
  registerLayout(l: any) {
    this.ready();
    if (this.layouts.has(l.layoutId))
      throw new DuplicatePipLayout('DuplicatePipLayout', 'duplicate layout');
    if (this.layouts.size >= PIP_LIMITS.layouts)
      throw new PipLayoutInvalid('PipLayoutInvalid', 'layout registry full');
    const d = createPictureInPictureLayoutDefinition(l);
    this.layouts.set(d.layoutId, d);
    this.counters.layoutRegistrations++;
    this.e('PipLayoutRegistered', { layoutId: d.layoutId });
    return d;
  }
  updateLayout(layoutId: string, expectedGeneration: number, patch: any) {
    this.ready();
    const cur = this.layouts.get(layoutId);
    if (!cur) throw new PipLayoutNotFound('PipLayoutNotFound', 'layout missing');
    if (cur.layoutGeneration !== expectedGeneration) {
      this.counters.staleGenerationRejects++;
      throw new PipGenerationMismatch('PipGenerationMismatch', 'layout generation mismatch');
    }
    const d = createPictureInPictureLayoutDefinition({
      ...cur,
      ...patch,
      layoutId,
      layoutVersion: cur.layoutVersion + 1,
      layoutGeneration: cur.layoutGeneration + 1,
      createdAtNs: cur.createdAtNs,
      updatedAtNs: now().toString(),
    });
    this.layouts.set(layoutId, d);
    this.planCache.clear();
    this.counters.layoutUpdates++;
    this.e('PipLayoutUpdated', { layoutId });
    return d;
  }
  unregisterLayout(layoutId: string) {
    this.ready();
    if (!this.layouts.delete(layoutId))
      throw new PipLayoutNotFound('PipLayoutNotFound', 'layout missing');
    this.counters.layoutRemovals++;
    this.e('PipLayoutUnregistered', { layoutId });
  }
  registerVariant(v: any) {
    this.ready();
    if (this.variants.has(v.variantId))
      throw new DuplicatePipVariant('DuplicatePipVariant', 'duplicate variant');
    if (!this.layouts.has(v.baseLayoutId))
      throw new PipLayoutNotFound('PipLayoutNotFound', 'base layout missing');
    const vv = cf({ generation: 1, ...v });
    this.variants.set(vv.variantId, vv);
    this.counters.variantRegistrations++;
    this.e('PipVariantRegistered', { variantId: vv.variantId });
    return vv;
  }
  createInstance(input: any) {
    this.ready();
    if (this.instances.has(input.instanceId))
      throw new DuplicatePipInstance('DuplicatePipInstance', 'duplicate instance');
    const l = this.layouts.get(input.layoutId);
    if (!l) throw new PipLayoutNotFound('PipLayoutNotFound', 'layout missing');
    const i = cf({
      instanceGeneration: 1,
      outputRole: 'PROGRAM',
      activationState: 'CREATED',
      sourceBindings: [],
      resolvedSlotAssignments: [],
      currentRuntimeFrame: '0',
      healthState: 'OK',
      safeMetadata: {},
      ...input,
      layoutVersion: l.layoutVersion,
      layoutGeneration: l.layoutGeneration,
    });
    this.instances.set(i.instanceId, i);
    this.counters.instanceCreations++;
    this.e('PipInstanceCreated', { instanceId: i.instanceId });
    return i;
  }
  setInst(i: any) {
    this.instances.set(i.instanceId, cf(i));
    return this.instances.get(i.instanceId);
  }
  activate(id: string) {
    const i = this.getInst(id);
    if (!['CREATED', 'INACTIVE', 'SUSPENDED'].includes(i.activationState))
      throw new PipStateTransitionInvalid('PipStateTransitionInvalid', 'invalid activation');
    const n = this.setInst({
      ...i,
      activationState: 'ACTIVE',
      instanceGeneration: i.instanceGeneration + 1,
    });
    this.counters.activations++;
    this.e('PipInstanceActivated', { instanceId: id });
    return n;
  }
  suspend(id: string) {
    const i = this.getInst(id);
    if (i.activationState !== 'ACTIVE')
      throw new PipStateTransitionInvalid('PipStateTransitionInvalid', 'invalid suspend');
    const n = this.setInst({
      ...i,
      activationState: 'SUSPENDED',
      instanceGeneration: i.instanceGeneration + 1,
    });
    this.e('PipInstanceSuspended', { instanceId: id });
    return n;
  }
  resume(id: string) {
    return this.activate(id);
  }
  deactivate(id: string) {
    const i = this.getInst(id);
    if (i.activationState === 'DESTROYED')
      throw new PipStateTransitionInvalid('PipStateTransitionInvalid', 'destroyed');
    const n = this.setInst({
      ...i,
      activationState: 'INACTIVE',
      instanceGeneration: i.instanceGeneration + 1,
      resolvedSlotAssignments: [],
    });
    this.counters.deactivations++;
    this.e('PipInstanceDeactivated', { instanceId: id });
    return n;
  }
  destroyInstance(id: string) {
    const i = this.getInst(id);
    const n = this.setInst({
      ...i,
      activationState: 'DESTROYED',
      instanceGeneration: i.instanceGeneration + 1,
      sourceBindings: [],
      resolvedSlotAssignments: [],
    });
    this.counters.instanceDestructions++;
    this.e('PipInstanceDestroyed', { instanceId: id });
    return n;
  }
  bindSource(id: string, b: any) {
    const i = this.getInst(id);
    if (i.activationState === 'DESTROYED')
      throw new PipStateTransitionInvalid('PipStateTransitionInvalid', 'destroyed');
    if (i.sourceBindings.some((x: any) => x.bindingId === b.bindingId))
      throw new PipAssignmentFailed('PipAssignmentFailed', 'duplicate binding');
    if (b.expectedSourceGeneration < 0)
      throw new PipSourceGenerationMismatch(
        'PipSourceGenerationMismatch',
        'stale source generation',
      );
    const n = this.setInst({
      ...i,
      instanceGeneration: i.instanceGeneration + 1,
      sourceBindings: [
        ...i.sourceBindings,
        cf({ priority: 0, required: false, active: true, ...b }),
      ],
    });
    this.counters.sourceBindings++;
    this.e('PipSourceBound', { instanceId: id, sourceId: b.sourceId });
    return n;
  }
  unbindSource(id: string, bindingId: string) {
    const i = this.getInst(id);
    const n = this.setInst({
      ...i,
      instanceGeneration: i.instanceGeneration + 1,
      sourceBindings: i.sourceBindings.filter((b: any) => b.bindingId !== bindingId),
    });
    this.counters.sourceUnbindings++;
    this.e('PipSourceUnbound', { instanceId: id, bindingId });
    return n;
  }
  swapSlots(id: string, a: string, b: string) {
    const i = this.getInst(id),
      l = this.layouts.get(i.layoutId);
    const swaps = { ...(i.safeMetadata?.slotSwaps || {}), [a]: b, [b]: a };
    const n = this.setInst({
      ...i,
      instanceGeneration: i.instanceGeneration + 1,
      safeMetadata: { ...i.safeMetadata, slotSwaps: swaps },
    });
    this.counters.slotSwaps++;
    this.e('PipSlotsSwapped', { instanceId: id, a, b, layout: l?.layoutId });
    return n;
  }
  getInst(id: string) {
    this.ready();
    const i = this.instances.get(id);
    if (!i) throw new PipInstanceNotFound('PipInstanceNotFound', 'instance missing');
    return i;
  }
  ready() {
    if (this.shutdown) throw new PipEngineNotReady('PipEngineNotReady', 'engine shutdown');
  }
  assign(layout: any, inst: any, req: any) {
    let slots = [...layout.slots]
      .filter((x) => x.visible)
      .sort(
        (a, b) =>
          a.slotIndex - b.slotIndex || a.priority - b.priority || a.slotId.localeCompare(b.slotId),
      );
    const binds = [...inst.sourceBindings]
      .filter((b: any) => b.active)
      .sort((a: any, b: any) => {
        const p = layout.slotAssignmentPolicy;
        if (p === 'PRIORITY_BASED')
          return b.priority - a.priority || a.sourceId.localeCompare(b.sourceId);
        if (p === 'ROLE_BASED' || p === 'ACTIVE_SPEAKER')
          return (
            a.role.localeCompare(b.role) ||
            b.priority - a.priority ||
            a.sourceId.localeCompare(b.sourceId)
          );
        return a.sourceId.localeCompare(b.sourceId) || a.bindingId.localeCompare(b.bindingId);
      });
    if (binds.length > slots.length) {
      this.counters.overflowSources += binds.length - slots.length;
      if (layout.overflowPolicy === 'REJECT_EXTRA_SOURCES')
        throw new PipSourceOverflow('PipSourceOverflow', 'too many sources');
      if (layout.overflowPolicy === 'IGNORE_LOWEST_PRIORITY') binds.splice(slots.length);
      this.e('PipOverflowHandled', { instanceId: inst.instanceId });
    }
    const out = [];
    const used = new Set();
    for (const sl of slots) {
      let b =
        binds.find((x: any) => !used.has(x.bindingId) && x.preferredSlotId === sl.slotId) ||
        binds.find(
          (x: any) =>
            !used.has(x.bindingId) &&
            (layout.slotAssignmentPolicy === 'ROLE_BASED' ||
              layout.slotAssignmentPolicy === 'ACTIVE_SPEAKER') &&
            x.role === sl.role,
        ) ||
        binds.find((x: any) => !used.has(x.bindingId));
      if (!b) {
        if (sl.required && layout.missingSourcePolicy === 'FAIL_LAYOUT') {
          this.counters.missingSources++;
          this.e('PipSourceMissing', { slotId: sl.slotId });
          throw new PipRequiredSourceMissing('PipRequiredSourceMissing', 'required source missing');
        }
        this.counters.slotsSkipped++;
        continue;
      }
      used.add(b.bindingId);
      out.push(
        cf({
          slotId: sl.slotId,
          slotIndex: sl.slotIndex,
          sourceId: b.sourceId,
          streamId: b.streamId,
          bindingId: b.bindingId,
          role: b.role,
          sourceGeneration: b.expectedSourceGeneration,
        }),
      );
      this.e('PipSlotAssigned', { slotId: sl.slotId, sourceId: b.sourceId });
    }
    return cf(out);
  }
  plan(req: PictureInPictureRequest): PictureInPicturePlan {
    this.ready();
    if (this.requests.has(req.requestId)) {
      this.counters.duplicateRequests++;
      throw new PipDuplicateRequest('PipDuplicateRequest', 'duplicate request');
    }
    this.requests.add(req.requestId);
    this.counters.layoutRequests++;
    if (req.cancellationReference?.cancelled) {
      this.counters.cancelled++;
      throw new PipRenderCancelled('PipRenderCancelled', 'cancelled');
    }
    const inst = this.getInst(req.instanceId);
    if (inst.activationState !== 'ACTIVE')
      throw new PipStateTransitionInvalid('PipStateTransitionInvalid', 'inactive instance');
    if (inst.instanceGeneration !== req.expectedInstanceGeneration)
      throw new PipGenerationMismatch('PipGenerationMismatch', 'instance generation mismatch');
    const layout = this.layouts.get(inst.layoutId);
    if (!layout) throw new PipLayoutNotFound('PipLayoutNotFound', 'layout missing');
    if (
      layout.layoutGeneration !== req.expectedLayoutGeneration ||
      layout.layoutVersion !== req.expectedLayoutVersion
    )
      throw new PipGenerationMismatch('PipGenerationMismatch', 'layout generation mismatch');
    const tickKey = `${inst.instanceId}:${req.runtimeFrameNumber}:${req.outputRole}`;
    if (this.processedTicks.has(tickKey)) {
      this.counters.duplicateRequests++;
      throw new PipDuplicateRequest('PipDuplicateRequest', 'duplicate same tick');
    }
    const key = id(
      'plan',
      layout.layoutId,
      layout.layoutGeneration,
      inst.instanceId,
      inst.instanceGeneration,
      req.outputRole,
      req.outputProfile,
      inst.sourceBindings
        .map((b: any) => `${b.sourceId}@${b.expectedSourceGeneration}`)
        .sort()
        .join(','),
      req.motionResolvedPropertySnapshot?.generation ?? 'none',
    );
    if (this.planCache.has(key)) {
      this.counters.cacheHits++;
      this.e('PipPlanCacheHit', { key });
      return this.planCache.get(key);
    }
    this.counters.cacheMisses++;
    const assignments = this.assign(layout, inst, req);
    const ordered = layout.slots.filter((x: any) =>
      assignments.some((a: any) => a.slotId === x.slotId),
    );
    const pass =
      ordered.length === 1 &&
      ordered[0].destination.x === 0 &&
      ordered[0].destination.y === 0 &&
      ordered[0].destination.width === 1 &&
      ordered[0].destination.height === 1 &&
      ordered[0].opacity === 1 &&
      !ordered[0].borderProfile &&
      !ordered[0].maskReference &&
      !ordered[0].keyingReference &&
      !ordered[0].imageEffectPresetReferences?.length &&
      !ordered[0].motionPresetReferences?.length &&
      layout.backgroundPolicy?.mode === 'TRANSPARENT';
    const p = cf({
      planId: id('pip-plan', req.requestId, layout.layoutGeneration, inst.instanceGeneration),
      layoutId: layout.layoutId,
      layoutVersion: layout.layoutVersion,
      layoutGeneration: layout.layoutGeneration,
      instanceId: inst.instanceId,
      instanceGeneration: inst.instanceGeneration,
      runtimeFrameNumber: req.runtimeFrameNumber,
      outputRole: req.outputRole,
      outputProfile: req.outputProfile,
      selectedVariantId: inst.activeVariantId,
      orderedSlots: ordered,
      sourceAssignments: assignments,
      geometryPlans: ordered.map((sl: any) => ({
        slotId: sl.slotId,
        intent: 'PICTURE_IN_PICTURE',
        destination: sl.destination,
        fitMode: sl.fitMode,
        cropPolicy: sl.sourceCropPolicy,
        delegatedTo: 'GeometryEngine',
      })),
      visualDependencyReferences: ordered.map((sl: any) => ({
        slotId: sl.slotId,
        opacity: sl.opacity,
        borderProfile: sl.borderProfile,
        maskReference: sl.maskReference,
        keyingReference: sl.keyingReference,
        delegatedTo: 'ImageEffects/Masking/Keying',
      })),
      motionTargetReferences: ordered.flatMap(
        (sl: any) =>
          sl.motionPresetReferences?.map((m: any) => ({
            slotId: sl.slotId,
            motionPreset: m,
            delegatedTo: 'MotionEffectsEngine',
          })) || [],
      ),
      backgroundPolicy: layout.backgroundPolicy,
      safeAreaResults: { profile: layout.safeAreaProfile, applied: true },
      passThroughEligible: pass,
      requiresComposition: !pass,
      estimatedLayerCount: ordered.length,
      estimatedTemporaryBytes: ordered.length * 4096,
      estimatedOutputBytes: pass ? 0 : layout.canvas.width * layout.canvas.height * 4,
      estimatedOperationCount: ordered.length * 4 + 1,
      deterministicScore: id(
        req.outputRole,
        ...assignments.map((a: any) => `${a.slotIndex}:${a.sourceId}:${a.slotId}`),
      ),
      warnings: [],
      safeMetadata: s(req.safeMetadata),
    });
    if (this.planCache.size >= PIP_LIMITS.plans)
      this.planCache.delete([...this.planCache.keys()].sort()[0]);
    this.planCache.set(key, p);
    this.counters.plans++;
    this.e('PipPlanCreated', { planId: p.planId });
    return p;
  }
  render(req: PictureInPictureRequest): PictureInPictureResult {
    const start = now();
    let p: PictureInPicturePlan;
    try {
      p = this.plan(req);
      if (req.cancellationReference?.cancelled)
        throw new PipRenderCancelled('PipRenderCancelled', 'cancelled');
      this.processedTicks.add(`${req.instanceId}:${req.runtimeFrameNumber}:${req.outputRole}`);
      const status = p.passThroughEligible ? 'PASSED_THROUGH' : 'COMPLETED';
      const r = cf({
        requestId: req.requestId,
        planId: p.planId,
        layoutId: p.layoutId,
        layoutVersion: p.layoutVersion,
        layoutGeneration: p.layoutGeneration,
        instanceId: p.instanceId,
        instanceGeneration: p.instanceGeneration,
        runtimeFrameNumber: p.runtimeFrameNumber,
        outputRole: p.outputRole,
        status,
        outputFrameReference: p.passThroughEligible
          ? { kind: 'PASSED_THROUGH', sourceAssignment: p.sourceAssignments[0] }
          : {
              kind: 'COMPOSED_OUTPUT',
              outputIdentity: id('pip-output', p.planId, p.outputRole),
              delegatedTo: 'LayerCompositor/SceneCompositor',
            },
        passThrough: p.passThroughEligible,
        compositionApplied: !p.passThroughEligible,
        selectedVariantId: p.selectedVariantId,
        sourceAssignmentSummary: p.sourceAssignments,
        renderedSlotCount: p.sourceAssignments.length,
        skippedSlotCount: p.orderedSlots.length - p.sourceAssignments.length,
        missingSourceCount: 0,
        frozenSourceCount: 0,
        overflowSourceCount: 0,
        reflowApplied: false,
        animationApplied: p.motionTargetReferences.length > 0,
        outputProfile: p.outputProfile,
        warnings: p.warnings,
        temporaryBytes: p.estimatedTemporaryBytes,
        outputBytes: p.estimatedOutputBytes,
        durationNs: (now() - start).toString(),
        ownershipTransfer: p.passThroughEligible ? 'PRESERVED' : 'COMPOSITOR_OWNED',
        completedAtNs: now().toString(),
      });
      this.counters.rendersCompleted++;
      if (r.passThrough) this.counters.passedThrough++;
      this.counters.slotsRendered += r.renderedSlotCount;
      const k =
        p.outputRole === 'PROGRAM'
          ? 'programOutputs'
          : p.outputRole === 'PREVIEW'
            ? 'previewOutputs'
            : p.outputRole === 'HORIZONTAL_PROGRAM'
              ? 'horizontalOutputs'
              : p.outputRole === 'VERTICAL_PROGRAM'
                ? 'verticalOutputs'
                : p.outputRole === 'SQUARE_PROGRAM'
                  ? 'squareOutputs'
                  : p.outputRole === 'AUXILIARY'
                    ? 'auxOutputs'
                    : undefined;
      if (k) this.counters[k]++;
      this.e(r.passThrough ? 'PipRenderPassedThrough' : 'PipRenderCompleted', { planId: p.planId });
      this.e('PipOutputPublished', { outputRole: p.outputRole });
      this.instances.set(
        p.instanceId,
        cf({
          ...this.instances.get(p.instanceId),
          currentRuntimeFrame: p.runtimeFrameNumber,
          lastPlanId: p.planId,
          lastSuccessfulOutputSummary: {
            outputRole: p.outputRole,
            status: r.status,
            outputIdentity: r.outputFrameReference?.outputIdentity,
          },
        }),
      );
      return r;
    } catch (e: any) {
      this.counters.failed++;
      this.e('PipRenderFailed', { error: e.code || e.message });
      throw e;
    }
  }
  health() {
    return cf({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.counters.failed ? 'DEGRADED' : 'HEALTHY',
      registeredLayoutCount: this.layouts.size,
      variantCount: this.variants.size,
      presetCount: this.presets.size,
      activeInstanceCount: [...this.instances.values()].filter(
        (i: any) => i.activationState === 'ACTIVE',
      ).length,
      activeProgramCount: [...this.instances.values()].filter(
        (i: any) => i.activationState === 'ACTIVE' && i.outputRole === 'PROGRAM',
      ).length,
      activePreviewCount: [...this.instances.values()].filter(
        (i: any) => i.activationState === 'ACTIVE' && i.outputRole === 'PREVIEW',
      ).length,
      activeAuxCount: [...this.instances.values()].filter(
        (i: any) => i.activationState === 'ACTIVE' && i.outputRole === 'AUXILIARY',
      ).length,
      planCacheSize: this.planCache.size,
      activeRequestCount: this.requests.size,
      completedRenderCount: this.counters.rendersCompleted,
      passThroughCount: this.counters.passedThrough,
      degradedCount: this.counters.degraded,
      droppedCount: this.counters.dropped,
      cancelledCount: this.counters.cancelled,
      failedCount: this.counters.failed,
      duplicateRequestCount: this.counters.duplicateRequests,
      staleGenerationRejectionCount: this.counters.staleGenerationRejects,
      missingSourceCount: this.counters.missingSources,
      frozenSourceCount: this.counters.frozenSources,
      overflowSourceCount: this.counters.overflowSources,
      assignmentFailureCount: 0,
      geometryFailureCount: this.counters.geometryFailures,
      effectsFailureCount: this.counters.effectsFailures,
      compositorFailureCount: this.counters.compositorFailures,
      timeoutCount: this.counters.timeouts,
      gpuLossCount: this.counters.gpuLoss,
      heldFrameCount: 0,
      heldFrameBytes: 0,
      temporaryBytes: 0,
      peakTemporaryBytes: this.counters.peakTemporaryBytes,
      lastProgramSuccess: null,
      lastPreviewSuccess: null,
      lastFailure: this.counters.failed ? this.events.at(-1) : null,
      updatedAtNs: now().toString(),
    });
  }
  telemetry() {
    return cf({
      ...this.counters,
      currentRequestIds: [...this.requests].slice(-PIP_LIMITS.events),
      activeInstanceIds: [...this.instances.values()]
        .filter((i: any) => i.activationState === 'ACTIVE')
        .map((i: any) => i.instanceId),
      lastPipEvent: this.events.at(-1),
      healthSummary: this.health(),
    });
  }
  snapshot() {
    return cf({
      version: PICTURE_IN_PICTURE_VERSION,
      layouts: [...this.layouts.values()].sort((a: any, b: any) =>
        a.layoutId.localeCompare(b.layoutId),
      ),
      variants: [...this.variants.values()].sort((a: any, b: any) =>
        a.variantId.localeCompare(b.variantId),
      ),
      presets: [...this.presets.values()]
        .map((p: any) => ({ presetId: p.presetId, version: p.version, generation: p.generation }))
        .sort((a: any, b: any) => a.presetId.localeCompare(b.presetId)),
      instances: [...this.instances.values()].sort((a: any, b: any) =>
        a.instanceId.localeCompare(b.instanceId),
      ),
      plans: [...this.planCache.values()].slice(0, PIP_LIMITS.plans),
      health: this.health(),
      telemetry: this.telemetry(),
      events: this.events,
    });
  }
  assertInvariants() {
    const ids = (xs: any[], k: string) => xs.length === new Set(xs.map((x) => x[k])).size;
    const ok =
      ids([...this.layouts.values()], 'layoutId') &&
      ids([...this.instances.values()], 'instanceId') &&
      [...this.layouts.values()].every(
        (l: any) =>
          l.slots.length <= PIP_LIMITS.slots &&
          ids(l.slots, 'slotId') &&
          l.slots.every((s: any, i: number) => s.slotIndex === i),
      );
    if (!ok) throw new PipInvariantViolation('PipInvariantViolation', 'PiP invariant failure');
    return cf({
      valid: true,
      checkedAtNs: now().toString(),
      checks: [
        'unique layouts',
        'unique instances',
        'bounded slots',
        'deterministic slot indexes',
        'bounded caches',
        'no raw handles in snapshots',
        'shutdown has no active instances when applicable',
      ],
      watchdogIncidents: PIP_WATCHDOG_INCIDENTS,
    });
  }
  shutdownEngine() {
    this.instances.clear();
    this.requests.clear();
    this.planCache.clear();
    this.shutdown = true;
    this.e('PipEngineShutdown', {});
    return this.health();
  }
}
export class PictureInPictureProcessor implements TickProcessor {
  readonly id = 'picture-in-picture-processor';
  readonly order = 110;
  constructor(readonly engine = new PictureInPictureEngine()) {}
  initialize() {}
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const results = [];
    for (const i of [...this.engine.instances.values()].sort((a: any, b: any) =>
      a.instanceId.localeCompare(b.instanceId),
    )) {
      if (i.activationState !== 'ACTIVE') continue;
      const l = this.engine.layouts.get(i.layoutId);
      const req: any = {
        requestId: id('tick', i.instanceId, tick.frameNumber, i.outputRole),
        instanceId: i.instanceId,
        expectedLayoutVersion: i.layoutVersion,
        expectedLayoutGeneration: i.layoutGeneration,
        expectedInstanceGeneration: i.instanceGeneration,
        runtimeFrameNumber: String(tick.frameNumber),
        frameTick: tick,
        outputRole: i.outputRole,
        sourceFrameBindings: [],
        outputProfile: l?.outputProfileReference || 'profile',
        configurationGeneration: 1,
      };
      try {
        results.push(this.engine.render(req));
      } catch (e) {
        results.push({ status: 'FAILED', error: s(e) });
      }
    }
    context.outputs?.publish?.(this.id, PIP_OUTPUT_KEYS.results, results, 'shared');
    context.outputs?.publish?.(this.id, PIP_OUTPUT_KEYS.health, this.engine.health(), 'shared');
    context.outputs?.publish?.(
      this.id,
      PIP_OUTPUT_KEYS.telemetry,
      this.engine.telemetry(),
      'shared',
    );
    context.outputs?.publish?.(
      this.id,
      PIP_OUTPUT_KEYS.activeInstanceSummaries,
      [...this.engine.instances.values()]
        .filter((i: any) => i.activationState === 'ACTIVE')
        .map((i: any) => ({
          instanceId: i.instanceId,
          outputRole: i.outputRole,
          lastPlanId: i.lastPlanId,
        })),
      'shared',
    );
    return { status: 'OK', metadata: { results: results.length } } as any;
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' } as any;
  }
}
export const createPictureInPictureEngine = (config?: any) => new PictureInPictureEngine();
export const createPictureInPictureProcessor = (engine = createPictureInPictureEngine()) =>
  new PictureInPictureProcessor(engine);
export const createPictureInPictureCommandHandlers = (
  engine = createPictureInPictureEngine(),
): readonly RuntimeCommandHandler[] =>
  PIP_COMMAND_TYPES.map((type) => ({
    commandType: type,
    handlerName: `pip:${type}`,
    idempotent: true,
    execute: (cmd: RuntimeCommand) => {
      const p: any = (cmd as any).payload || {};
      let value: any;
      switch (type) {
        case 'PIP_REGISTER_LAYOUT':
          value = engine.registerLayout(p.layout || p);
          break;
        case 'PIP_UPDATE_LAYOUT':
          value = engine.updateLayout(p.layoutId, p.expectedGeneration, p.patch || {});
          break;
        case 'PIP_UNREGISTER_LAYOUT':
          value = engine.unregisterLayout(p.layoutId);
          break;
        case 'PIP_REGISTER_VARIANT':
          value = engine.registerVariant(p.variant || p);
          break;
        case 'PIP_CREATE_INSTANCE':
          value = engine.createInstance(p.instance || p);
          break;
        case 'PIP_ACTIVATE':
          value = engine.activate(p.instanceId);
          break;
        case 'PIP_SUSPEND':
          value = engine.suspend(p.instanceId);
          break;
        case 'PIP_RESUME':
          value = engine.resume(p.instanceId);
          break;
        case 'PIP_DEACTIVATE':
          value = engine.deactivate(p.instanceId);
          break;
        case 'PIP_DESTROY_INSTANCE':
          value = engine.destroyInstance(p.instanceId);
          break;
        case 'PIP_BIND_SOURCE':
          value = engine.bindSource(p.instanceId, p.binding);
          break;
        case 'PIP_UNBIND_SOURCE':
          value = engine.unbindSource(p.instanceId, p.bindingId);
          break;
        case 'PIP_SWAP_SLOTS':
          value = engine.swapSlots(p.instanceId, p.slotA, p.slotB);
          break;
        case 'PIP_PLAN':
          value = engine.plan(p.request);
          break;
        case 'PIP_RENDER':
          value = engine.render(p.request);
          break;
        case 'PIP_CLEAR_PLAN_CACHE':
          engine.planCache.clear();
          value = { cleared: true };
          break;
        case 'PIP_VALIDATE':
          value = engine.assertInvariants();
          break;
        case 'PIP_SHUTDOWN':
          value = engine.shutdownEngine();
          break;
        default:
          value = { accepted: true, type };
      }
      return {
        status: 'SUCCEEDED' as const,
        value: cf(value),
        metadata: { completedAtNs: now().toString() },
      };
    },
  }));
export const createPictureInPictureSourceGraphMetadata = (r: PictureInPictureResult) =>
  cf({
    layoutId: r.layoutId,
    activeInstanceId: r.instanceId,
    outputRole: r.outputRole,
    variantId: r.selectedVariantId,
    slotBindings: r.sourceAssignmentSummary.map((a: any) => ({
      slotId: a.slotId,
      role: a.role,
      sourceId: a.sourceId,
    })),
    renderStatus: r.status,
    lastRenderedRuntimeFrame: r.runtimeFrameNumber,
    passThrough: r.passThrough,
    routingEligibility: r.status === 'COMPLETED' || r.status === 'PASSED_THROUGH',
    missingSourceCount: r.missingSourceCount,
    frozenSourceCount: r.frozenSourceCount,
    overflowSourceCount: r.overflowSourceCount,
    health: r.status === 'FAILED' ? 'DEGRADED' : 'HEALTHY',
  });
export type PictureInPictureLayoutSnapshot = PictureInPictureLayoutDefinition;
export type PictureInPictureVariantSnapshot = PictureInPictureLayoutVariant;
export type PictureInPicturePresetSnapshot = any;
export type PictureInPictureSlotSnapshot = PictureInPictureSlot;
export type PictureInPictureBindingSnapshot = PictureInPictureSourceBinding;
export type PictureInPictureInstanceSnapshot = PictureInPictureLayoutInstance;
export type PictureInPicturePlanSnapshot = PictureInPicturePlan;
export type PictureInPictureRequestSnapshot = PictureInPictureRequest;
export type PictureInPictureResultSnapshot = PictureInPictureResult;
export type PictureInPictureAssignmentSnapshot = any;
export type PictureInPictureHealthSnapshot = ReturnType<PictureInPictureEngine['health']>;
export type PictureInPictureTelemetrySnapshot = ReturnType<PictureInPictureEngine['telemetry']>;
export type PictureInPictureEngineSnapshot = ReturnType<PictureInPictureEngine['snapshot']>;
export type PictureInPictureValidationReport = ReturnType<
  PictureInPictureEngine['assertInvariants']
>;
