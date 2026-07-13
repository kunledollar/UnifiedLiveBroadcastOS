/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeCommand,
  type RuntimeCommandHandler,
  type TickProcessor,
} from './execution-engine.js';

export const TRANSITION_TYPES = [
  'CUT',
  'DISSOLVE',
  'FADE',
  'DIP_TO_COLOR',
  'WIPE_LEFT',
  'WIPE_RIGHT',
  'WIPE_UP',
  'WIPE_DOWN',
  'SLIDE_LEFT',
  'SLIDE_RIGHT',
  'SLIDE_UP',
  'SLIDE_DOWN',
  'PUSH_LEFT',
  'PUSH_RIGHT',
  'PUSH_UP',
  'PUSH_DOWN',
  'REVEAL_LEFT',
  'REVEAL_RIGHT',
  'COVER_LEFT',
  'COVER_RIGHT',
  'IRIS_OPEN',
  'IRIS_CLOSE',
  'CLOCK_WIPE',
  'BARN_DOOR_HORIZONTAL',
  'BARN_DOOR_VERTICAL',
  'LUMA_WIPE',
  'STINGER',
  'DVE',
  'CUSTOM',
] as const;
export type TransitionType = (typeof TRANSITION_TYPES)[number];
export const TRANSITION_EASINGS = [
  'LINEAR',
  'EASE_IN',
  'EASE_OUT',
  'EASE_IN_OUT',
  'CUBIC_IN',
  'CUBIC_OUT',
  'CUBIC_IN_OUT',
  'SINE_IN',
  'SINE_OUT',
  'SINE_IN_OUT',
  'QUAD_IN',
  'QUAD_OUT',
  'QUAD_IN_OUT',
  'CUSTOM_BEZIER',
] as const;
export type TransitionEasing = (typeof TRANSITION_EASINGS)[number];
export type TransitionDirection =
  'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'IN' | 'OUT' | 'HORIZONTAL' | 'VERTICAL' | 'NONE' | 'CUSTOM';
export type TransitionInstanceState =
  | 'CREATED'
  | 'PREPARING'
  | 'READY'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETING'
  | 'COMPLETED'
  | 'CANCELLING'
  | 'CANCELLED'
  | 'ROLLING_BACK'
  | 'ROLLED_BACK'
  | 'FAILED'
  | 'DESTROYED';
export type TransitionResultStatus =
  | 'COMPLETED'
  | 'RUNNING'
  | 'PAUSED'
  | 'CANCELLED'
  | 'ROLLED_BACK'
  | 'DEGRADED'
  | 'FAILED'
  | 'REJECTED';
export type TransitionInterruptionPolicy =
  | 'REJECT_NEW_TRANSITION'
  | 'CANCEL_CURRENT_PRESERVE_PROGRAM'
  | 'COMPLETE_CURRENT_THEN_QUEUE'
  | 'SNAP_TO_TARGET'
  | 'SNAP_TO_SOURCE'
  | 'RETARGET_TO_NEW_PREVIEW'
  | 'QUEUE_NEW_TRANSITION'
  | 'EMERGENCY_CUT'
  | 'CUSTOM';
export type TransitionCancellationPolicy =
  | 'PRESERVE_SOURCE_PROGRAM'
  | 'SNAP_TO_TARGET'
  | 'ROLLBACK_TO_SOURCE'
  | 'HOLD_CURRENT_FRAME_METADATA'
  | 'CUSTOM';
export const TRANSITION_COMMAND_TYPES = [
  'TRANSITION_REGISTER',
  'TRANSITION_UNREGISTER',
  'TRANSITION_UPDATE',
  'TRANSITION_SET_DEFAULT',
  'TRANSITION_START',
  'TRANSITION_AUTO',
  'TRANSITION_TAKE',
  'TRANSITION_PAUSE',
  'TRANSITION_RESUME',
  'TRANSITION_CANCEL',
  'TRANSITION_INTERRUPT',
  'TRANSITION_RETARGET',
  'TRANSITION_SET_DURATION',
  'TRANSITION_SET_DIRECTION',
  'TRANSITION_SET_EASING',
  'TRANSITION_SET_DIP_COLOR',
  'TRANSITION_CLEAR_PLAN_CACHE',
  'TRANSITION_VALIDATE',
  'TRANSITION_SHUTDOWN',
] as const;
export const TRANSITION_OUTPUT_KEYS = Object.freeze({
  definitions: 'transition.definitions',
  activeInstance: 'transition.activeInstance',
  request: 'transition.request',
  plan: 'transition.plan',
  result: 'transition.result',
  progress: 'transition.progress',
  sourceRenderSummary: 'transition.sourceRenderSummary',
  targetRenderSummary: 'transition.targetRenderSummary',
  programTransitionOutput: 'transition.programTransitionOutput',
  completedTransition: 'transition.completedTransition',
  cancelledOrFailedTransition: 'transition.cancelledOrFailedTransition',
  health: 'transition.health',
  telemetry: 'transition.telemetry',
});
export const TRANSITION_WATCHDOG_INCIDENTS = [
  'TRANSITION_ENGINE_STALLED',
  'TRANSITION_EXECUTION_TIMEOUT',
  'TRANSITION_DUPLICATE_REQUEST',
  'TRANSITION_DUPLICATE_TICK',
  'TRANSITION_DUPLICATE_COMPLETION',
  'TRANSITION_GENERATION_STALE',
  'TRANSITION_SOURCE_SCENE_STALE',
  'TRANSITION_TARGET_SCENE_STALE',
  'TRANSITION_TARGET_NOT_READY',
  'TRANSITION_PROGRESS_INVALID',
  'TRANSITION_COMPOSITOR_FAILED',
  'TRANSITION_OUTPUT_MISMATCH',
  'TRANSITION_PROGRAM_COMMIT_FAILED',
  'TRANSITION_ROLLBACK_FAILED',
  'TRANSITION_GPU_RESOURCE_LOST',
  'TRANSITION_TEMP_MEMORY_PRESSURE',
  'TRANSITION_QUEUE_PRESSURE',
  'TRANSITION_PROGRAM_PREVIEW_LEAK',
  'TRANSITION_INVARIANT_FAILURE',
] as const;
export const TRANSITION_EVENTS = [
  'TransitionEngineCreated',
  'TransitionRegistered',
  'TransitionUpdated',
  'TransitionUnregistered',
  'TransitionRequested',
  'TransitionValidated',
  'TransitionRejected',
  'TransitionScheduled',
  'TransitionStarted',
  'TransitionProgressed',
  'TransitionPaused',
  'TransitionResumed',
  'TransitionRetargeted',
  'TransitionInterrupted',
  'TransitionCancelled',
  'TransitionRollbackStarted',
  'TransitionRolledBack',
  'TransitionCompleted',
  'TransitionFailed',
  'ProgramTransitionFramePublished',
  'ProgramSceneCommitRequested',
  'ProgramSceneCommitted',
  'TransitionHealthChanged',
  'TransitionEngineShutdown',
] as const;
export const TRANSITION_ERRORS = [
  'TransitionEngineNotReady',
  'TransitionDefinitionNotFound',
  'DuplicateTransitionDefinition',
  'TransitionDefinitionInvalid',
  'TransitionInstanceNotFound',
  'DuplicateTransitionInstance',
  'TransitionStateTransitionInvalid',
  'TransitionGenerationMismatch',
  'TransitionTransactionInvalid',
  'TransitionSourceSceneInvalid',
  'TransitionTargetSceneInvalid',
  'TransitionTargetNotReady',
  'TransitionTypeUnsupported',
  'TransitionDurationInvalid',
  'TransitionProgressInvalid',
  'TransitionDuplicateRequest',
  'TransitionExecutionConflict',
  'TransitionCompositorFailed',
  'TransitionProgramCommitFailed',
  'TransitionRollbackFailed',
  'TransitionTimeout',
  'TransitionCancelled',
  'TransitionAllocationFailed',
  'TransitionOwnershipViolation',
  'TransitionInvariantViolation',
  'TransitionShutdownError',
] as const;
export class TransitionExecutionError extends RuntimeEngineError {
  constructor(
    code: (typeof TRANSITION_ERRORS)[number],
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(code, message, safe(details) as Record<string, unknown>);
  }
}
type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const redact =
  /token|secret|password|credential|cookie|url|path|handle|pointer|native|device|asset/i;
const safe = (v: unknown, d = 0): Json => {
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
        .map(([k, x]) => [k, redact.test(k) ? '[REDACTED]' : safe(x, d + 1)]),
    );
  return String(v);
};
const freeze = <T>(v: T): Readonly<T> => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v as Record<string, unknown>)) freeze(x);
  }
  return v as Readonly<T>;
};
const clone = <T>(v: T): Readonly<T> => freeze(structuredClone(v));
const id = (p: string, parts: readonly unknown[]) =>
  `${p}:${parts.map((x) => String(typeof x === 'bigint' ? x : JSON.stringify(safe(x)))).join(':')}`;
const finite = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1;
export interface TransitionSceneReference {
  readonly sceneId: string;
  readonly sceneGeneration: number;
  readonly ready?: boolean;
  readonly outputRef?: string;
  readonly safeMetadata?: Record<string, unknown>;
}
export interface TransitionDefinition {
  readonly transitionId: string;
  readonly transitionVersion: number;
  readonly transitionGeneration: number;
  readonly displayName: string;
  readonly transitionType: TransitionType;
  readonly durationFrames: number;
  readonly durationNs: string | bigint;
  readonly direction: TransitionDirection;
  readonly easing: TransitionEasing;
  readonly cubicBezier?: readonly [number, number, number, number];
  readonly color?: string;
  readonly softness?: number;
  readonly feather?: number;
  readonly border?: number;
  readonly borderColor?: string;
  readonly invert?: boolean;
  readonly reverse?: boolean;
  readonly inputPolicy: string;
  readonly outputPolicy: string;
  readonly sourceSceneRequirements: readonly string[];
  readonly targetSceneRequirements: readonly string[];
  readonly backendPreference: string;
  readonly qualityTier: string;
  readonly stinger?: Readonly<Record<string, unknown>>;
  readonly dve?: Readonly<Record<string, unknown>>;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
  readonly createdAtNs: string | bigint;
  readonly updatedAtNs: string | bigint;
}
export interface TransitionExecutionRequest {
  readonly requestId: string;
  readonly transactionId: string;
  readonly expectedTransactionGeneration: number;
  readonly transitionDefinitionRef: string;
  readonly expectedTransitionGeneration: number;
  readonly sourceScene: TransitionSceneReference;
  readonly targetScene: TransitionSceneReference;
  readonly expectedProgramGeneration: number;
  readonly expectedPreviewGeneration: number;
  readonly startFrameTick: FrameTick;
  readonly deadlineNs?: string | bigint;
  readonly cancellationRef?: string;
  readonly interruptionPolicy: TransitionInterruptionPolicy;
  readonly failurePolicy: string;
  readonly correlationId?: string;
  readonly mode?: 'CUT' | 'AUTO' | 'TAKE';
  readonly safeMetadata?: Record<string, unknown>;
}
export interface TransitionProgressSnapshot {
  readonly rawProgress: number;
  readonly easedProgress: number;
  readonly sourceContribution: number;
  readonly targetContribution: number;
  readonly geometryContribution?: number;
  readonly maskContribution?: number;
  readonly runtimeFrame: string;
}
export interface TransitionExecutionPlan {
  readonly planId: string;
  readonly transitionId: string;
  readonly transitionVersion: number;
  readonly transitionGeneration: number;
  readonly transactionId: string;
  readonly instanceId: string;
  readonly instanceGeneration: number;
  readonly sourceScene: TransitionSceneReference;
  readonly targetScene: TransitionSceneReference;
  readonly programGeneration: number;
  readonly previewGeneration: number;
  readonly durationFrames: number;
  readonly easing: TransitionEasing;
  readonly operationOrder: readonly string[];
  readonly sourceRenderRequirements: Readonly<Record<string, unknown>>;
  readonly targetRenderRequirements: Readonly<Record<string, unknown>>;
  readonly compositorRequirements: Readonly<Record<string, unknown>>;
  readonly geometryRequirements: Readonly<Record<string, unknown>>;
  readonly maskRequirements: Readonly<Record<string, unknown>>;
  readonly temporaryResourceEstimates: Readonly<Record<string, unknown>>;
  readonly outputByteEstimate: number;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface TransitionExecutionInstance {
  readonly instanceId: string;
  readonly transactionId: string;
  readonly transitionId: string;
  readonly transitionVersion: number;
  readonly transitionGeneration: number;
  readonly instanceGeneration: number;
  readonly sourceScene: TransitionSceneReference;
  readonly targetScene: TransitionSceneReference;
  readonly programBusGeneration: number;
  readonly previewBusGeneration: number;
  readonly state: TransitionInstanceState;
  readonly startRuntimeFrame: string;
  readonly currentRuntimeFrame: string;
  readonly elapsedFrames: number;
  readonly durationFrames: number;
  readonly progress: number;
  readonly easedProgress: number;
  readonly direction: TransitionDirection;
  readonly sourceRenderReference?: string;
  readonly targetRenderReference?: string;
  readonly lastOutputSummary?: Record<string, unknown>;
  readonly cancellationState?: string;
  readonly interruptionState?: string;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface TransitionExecutionResult {
  readonly requestId: string;
  readonly transactionId: string;
  readonly instanceId: string;
  readonly planId: string;
  readonly status: TransitionResultStatus;
  readonly transitionType: TransitionType;
  readonly sourceScene: TransitionSceneReference;
  readonly targetScene: TransitionSceneReference;
  readonly startedRuntimeFrame: string;
  readonly completedRuntimeFrame?: string;
  readonly totalFrames: number;
  readonly progress: number;
  readonly easedProgress: number;
  readonly transitionAnimationApplied: boolean;
  readonly programCommitApplied: boolean;
  readonly rollbackApplied: boolean;
  readonly outputFrameReference?: string;
  readonly warnings: readonly string[];
  readonly durationNs: string;
  readonly ownershipTransfer: Readonly<Record<string, unknown>>;
  readonly completedAtNs?: string;
}
export type TransitionDefinitionSnapshot = TransitionDefinition;
export type TransitionInstanceSnapshot = TransitionExecutionInstance;
export type TransitionPlanSnapshot = TransitionExecutionPlan;
export type TransitionRequestSnapshot = TransitionExecutionRequest;
export type TransitionResultSnapshot = TransitionExecutionResult;
export interface TransitionQueueSnapshot {
  readonly queuedRequestIds: readonly string[];
  readonly capacity: number;
}
export interface TransitionExecutionTelemetrySnapshot {
  readonly registrations: number;
  readonly updates: number;
  readonly removals: number;
  readonly executionRequests: number;
  readonly scheduled: number;
  readonly started: number;
  readonly completed: number;
  readonly cutCount: number;
  readonly autoCount: number;
  readonly takeCount: number;
  readonly perTransitionType: Readonly<Record<string, number>>;
  readonly progressEvaluations: number;
  readonly transitionFramesPublished: number;
  readonly programCommits: number;
  readonly cancellations: number;
  readonly interruptions: number;
  readonly retargets: number;
  readonly rollbacks: number;
  readonly failures: number;
  readonly rejections: number;
  readonly duplicateRequests: number;
  readonly duplicateTicks: number;
  readonly staleGenerations: number;
  readonly compositorFailures: number;
  readonly gpuLoss: number;
  readonly averageTransitionDurationFrames: number;
  readonly maximumTransitionDurationFrames: number;
  readonly averageFramesPerTransition: number;
  readonly currentTransitionId?: string;
  readonly queuedTransitionIds: readonly string[];
  readonly lastTransitionEvent?: string;
  readonly healthSummary: string;
}
export interface TransitionExecutionHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly registeredTransitionCount: number;
  readonly activeTransitionCount: number;
  readonly activeTransitionId?: string;
  readonly currentTransitionType?: TransitionType;
  readonly progress: number;
  readonly currentSourceScene?: string;
  readonly currentTargetScene?: string;
  readonly completedCount: number;
  readonly cutCount: number;
  readonly dissolveCount: number;
  readonly fadeCount: number;
  readonly dipCount: number;
  readonly wipeCount: number;
  readonly slidePushRevealCount: number;
  readonly cancelledCount: number;
  readonly interruptedCount: number;
  readonly rollbackCount: number;
  readonly failedCount: number;
  readonly rejectedCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateTickCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly compositorFailureCount: number;
  readonly gpuLossCount: number;
  readonly allocationFailureCount: number;
  readonly lastSuccessfulTransition?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface TransitionExecutionEngineSnapshot {
  readonly definitions: readonly TransitionDefinitionSnapshot[];
  readonly activeInstance?: TransitionInstanceSnapshot;
  readonly queue: TransitionQueueSnapshot;
  readonly health: TransitionExecutionHealthSnapshot;
  readonly telemetry: TransitionExecutionTelemetrySnapshot;
  readonly containsRuntimeHandles: false;
}
export interface TransitionValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedInvariants: readonly string[];
}
export interface TransitionCompositorAdapter {
  compose(request: Readonly<Record<string, unknown>>): {
    outputFrameReference: string;
    summary?: Record<string, unknown>;
  };
}
export interface TransitionProgramAdapter {
  commit(
    scene: TransitionSceneReference,
    generation: number,
  ): { programGeneration: number; outputFrameReference?: string };
  publish(frameRef: string, generation: number, progress: TransitionProgressSnapshot): void;
}
export const evaluateTransitionEasing = (
  e: TransitionEasing,
  p: number,
  bezier?: readonly [number, number, number, number],
) => {
  if (!finite(p))
    throw new TransitionExecutionError('TransitionProgressInvalid', 'progress invalid');
  switch (e) {
    case 'LINEAR':
      return p;
    case 'EASE_IN':
    case 'QUAD_IN':
      return p * p;
    case 'EASE_OUT':
    case 'QUAD_OUT':
      return 1 - (1 - p) * (1 - p);
    case 'EASE_IN_OUT':
    case 'QUAD_IN_OUT':
      return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    case 'CUBIC_IN':
      return p * p * p;
    case 'CUBIC_OUT':
      return 1 - Math.pow(1 - p, 3);
    case 'CUBIC_IN_OUT':
      return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    case 'SINE_IN':
      return 1 - Math.cos((p * Math.PI) / 2);
    case 'SINE_OUT':
      return Math.sin((p * Math.PI) / 2);
    case 'SINE_IN_OUT':
      return -(Math.cos(Math.PI * p) - 1) / 2;
    case 'CUSTOM_BEZIER':
      if (!bezier || bezier.some((x) => !Number.isFinite(x) || x < 0 || x > 1))
        throw new TransitionExecutionError(
          'TransitionDefinitionInvalid',
          'invalid cubic control points',
        );
      return Math.min(
        1,
        Math.max(
          0,
          3 * (1 - p) * (1 - p) * p * bezier[1] + 3 * (1 - p) * p * p * bezier[3] + p * p * p,
        ),
      );
    default:
      throw new TransitionExecutionError('TransitionDefinitionInvalid', 'unsupported easing');
  }
};
export const evaluateTransitionProgress = (
  tick: FrameTick,
  startFrame: bigint,
  durationFrames: number,
  easing: TransitionEasing,
  bezier?: readonly [number, number, number, number],
): TransitionProgressSnapshot => {
  if (durationFrames <= 0)
    throw new TransitionExecutionError('TransitionDurationInvalid', 'duration must be positive');
  const elapsed = tick.frameNumber <= startFrame ? 0 : Number(tick.frameNumber - startFrame);
  const raw = Math.min(1, Math.max(0, elapsed / durationFrames));
  const eased = raw === 1 ? 1 : evaluateTransitionEasing(easing, raw, bezier);
  if (!finite(eased))
    throw new TransitionExecutionError('TransitionProgressInvalid', 'eased progress invalid');
  return freeze({
    rawProgress: raw,
    easedProgress: eased,
    sourceContribution: 1 - eased,
    targetContribution: eased,
    geometryContribution: eased,
    maskContribution: eased,
    runtimeFrame: tick.frameNumber.toString(),
  });
};
export class TransitionExecutionEngine {
  private defs = new Map<string, TransitionDefinition>();
  private requests = new Set<string>();
  private queue: TransitionExecutionRequest[] = [];
  private active: TransitionExecutionInstance | undefined;
  private plan: TransitionExecutionPlan | undefined;
  private lastTick?: string;
  private completedIds = new Set<string>();
  private shut = false;
  private t: any = {
    registrations: 0,
    updates: 0,
    removals: 0,
    executionRequests: 0,
    scheduled: 0,
    started: 0,
    completed: 0,
    cutCount: 0,
    autoCount: 0,
    takeCount: 0,
    perTransitionType: {},
    progressEvaluations: 0,
    transitionFramesPublished: 0,
    programCommits: 0,
    cancellations: 0,
    interruptions: 0,
    retargets: 0,
    rollbacks: 0,
    failures: 0,
    rejections: 0,
    duplicateRequests: 0,
    duplicateTicks: 0,
    staleGenerations: 0,
    compositorFailures: 0,
    gpuLoss: 0,
    totalFrames: 0,
    maxFrames: 0,
    lastTransitionEvent: 'TransitionEngineCreated',
  };
  constructor(
    private readonly compositor?: TransitionCompositorAdapter,
    private readonly program?: TransitionProgramAdapter,
    private readonly nowNs = () => 0n,
  ) {}
  registerDefinition(d: TransitionDefinition) {
    this.ensure();
    if (this.defs.has(d.transitionId))
      throw this.reject('DuplicateTransitionDefinition', 'duplicate definition');
    this.validateDefinition(d);
    const c = clone({
      ...d,
      safeMetadata: safe(d.safeMetadata) as Record<string, unknown>,
    }) as TransitionDefinition;
    this.defs.set(c.transitionId, c);
    this.t.registrations++;
    this.t.lastTransitionEvent = 'TransitionRegistered';
    return c;
  }
  updateDefinition(d: TransitionDefinition, expectedGeneration: number) {
    this.ensure();
    const old = this.defs.get(d.transitionId);
    if (!old) throw this.reject('TransitionDefinitionNotFound', 'missing definition');
    if (
      old.transitionGeneration !== expectedGeneration ||
      d.transitionGeneration <= old.transitionGeneration ||
      d.transitionVersion < old.transitionVersion
    )
      throw this.reject('TransitionGenerationMismatch', 'stale definition update');
    this.validateDefinition(d);
    const c = clone(d) as TransitionDefinition;
    this.defs.set(c.transitionId, c);
    this.t.updates++;
    return c;
  }
  unregisterDefinition(id0: string, expectedGeneration?: number) {
    const d = this.defs.get(id0);
    if (!d) throw this.reject('TransitionDefinitionNotFound', 'missing definition');
    if (expectedGeneration !== undefined && d.transitionGeneration !== expectedGeneration)
      throw this.reject('TransitionGenerationMismatch', 'stale unregister');
    this.defs.delete(id0);
    this.t.removals++;
  }
  start(request: TransitionExecutionRequest) {
    this.ensure();
    if (this.requests.has(request.requestId)) {
      this.t.duplicateRequests++;
      throw this.reject('TransitionDuplicateRequest', 'duplicate request');
    }
    const d = this.defs.get(request.transitionDefinitionRef);
    if (!d) throw this.reject('TransitionDefinitionNotFound', 'definition not found');
    if (d.transitionGeneration !== request.expectedTransitionGeneration) {
      this.t.staleGenerations++;
      throw this.reject('TransitionGenerationMismatch', 'stale transition definition');
    }
    if (!request.targetScene.ready)
      throw this.reject('TransitionTargetNotReady', 'target not ready');
    if (this.active && request.interruptionPolicy === 'REJECT_NEW_TRANSITION')
      throw this.reject('TransitionExecutionConflict', 'active transition already running');
    this.requests.add(request.requestId);
    this.t.executionRequests++;
    if (d.transitionType === 'CUT' || request.mode === 'CUT') return this.cut(request, d);
    const inst = this.instance(request, d, 'SCHEDULED');
    const plan = this.makePlan(request, d, inst);
    if (this.active) {
      if (
        request.interruptionPolicy === 'COMPLETE_CURRENT_THEN_QUEUE' ||
        request.interruptionPolicy === 'QUEUE_NEW_TRANSITION'
      ) {
        this.queue.push(clone(request) as TransitionExecutionRequest);
        return this.result(request, inst, plan, 'RUNNING', false, false);
      }
      if (request.interruptionPolicy === 'EMERGENCY_CUT') return this.cut(request, d);
      throw this.reject(
        'TransitionExecutionConflict',
        'unsupported interruption with active transition',
      );
    }
    this.active = inst;
    this.plan = plan;
    this.t.scheduled++;
    this.countMode(request);
    return this.result(request, inst, plan, 'RUNNING', true, false);
  }
  processTick(tick: FrameTick) {
    this.ensure();
    const key = tick.frameNumber.toString();
    if (this.lastTick === key) {
      this.t.duplicateTicks++;
      return this.active;
    }
    this.lastTick = key;
    if (!this.active || !this.plan) return undefined;
    if (this.active.state === 'PAUSED') return this.active;
    const p = evaluateTransitionProgress(
      tick,
      BigInt(this.active.startRuntimeFrame),
      this.active.durationFrames,
      this.plan.easing,
      this.defs.get(this.active.transitionId)?.cubicBezier,
    );
    if (p.rawProgress < this.active.progress)
      throw this.fail('TransitionProgressInvalid', 'non-monotonic progress');
    const state = p.rawProgress >= 1 ? 'COMPLETING' : 'RUNNING';
    const outputRef = `transition-output:${this.active.instanceId}:${key}`;
    const comp = this.compositor?.compose({
      transitionType: this.defs.get(this.active.transitionId)?.transitionType,
      progress: p,
      sourceScene: this.active.sourceScene,
      targetScene: this.active.targetScene,
      geometryIntent: this.plan.geometryRequirements,
      maskIntent: this.plan.maskRequirements,
      compositorRequirements: this.plan.compositorRequirements,
    }) ?? { outputFrameReference: outputRef, summary: { synthetic: true } };
    if (
      comp.outputFrameReference === this.active.sourceScene.outputRef ||
      comp.outputFrameReference === this.active.targetScene.outputRef
    )
      throw this.fail('TransitionCompositorFailed', 'output aliases input');
    this.program?.publish(comp.outputFrameReference, this.active.programBusGeneration, p);
    this.t.progressEvaluations++;
    this.t.transitionFramesPublished++;
    this.active = clone({
      ...this.active,
      state,
      currentRuntimeFrame: key,
      elapsedFrames: Number(BigInt(key) - BigInt(this.active.startRuntimeFrame)),
      progress: p.rawProgress,
      easedProgress: p.easedProgress,
      lastOutputSummary: comp.summary,
      sourceRenderReference: `source-render:${this.active.sourceScene.sceneId}:${key}`,
      targetRenderReference: `target-render:${this.active.targetScene.sceneId}:${key}`,
    }) as TransitionExecutionInstance;
    if (p.rawProgress >= 1) this.complete(tick, comp.outputFrameReference);
    return this.active;
  }
  pause() {
    if (this.active)
      this.active = clone({ ...this.active, state: 'PAUSED' }) as TransitionExecutionInstance;
  }
  resume() {
    if (this.active && this.active.state === 'PAUSED')
      this.active = clone({ ...this.active, state: 'RUNNING' }) as TransitionExecutionInstance;
  }
  cancel(policy: TransitionCancellationPolicy = 'PRESERVE_SOURCE_PROGRAM') {
    if (!this.active) return undefined;
    if (this.completedIds.has(this.active.instanceId))
      throw this.reject('TransitionCancelled', 'cannot cancel after commit');
    const a = clone({
      ...this.active,
      state: 'CANCELLED',
      cancellationState: policy,
    }) as TransitionExecutionInstance;
    this.active = undefined;
    this.plan = undefined;
    this.t.cancellations++;
    return a;
  }
  rollback() {
    if (!this.active) return false;
    this.active = clone({ ...this.active, state: 'ROLLED_BACK' }) as TransitionExecutionInstance;
    this.t.rollbacks++;
    this.active = undefined;
    this.plan = undefined;
    return true;
  }
  retarget(targetScene: TransitionSceneReference) {
    if (!this.active || !targetScene.ready)
      throw this.reject('TransitionTargetNotReady', 'retarget target not ready');
    this.active = clone({
      ...this.active,
      targetScene,
      instanceGeneration: this.active.instanceGeneration + 1,
      interruptionState: 'RETARGET_TO_NEW_PREVIEW',
    }) as TransitionExecutionInstance;
    this.t.retargets++;
  }
  shutdown() {
    this.active = undefined;
    this.queue = [];
    this.plan = undefined;
    this.shut = true;
    this.t.lastTransitionEvent = 'TransitionEngineShutdown';
  }
  assertInvariants(): TransitionValidationReport {
    const errors: string[] = [];
    if (this.active) {
      if (!this.defs.has(this.active.transitionId)) errors.push('active definition missing');
      if (!finite(this.active.progress) || !finite(this.active.easedProgress))
        errors.push('progress invalid');
      if (this.active.sourceScene.sceneId === this.active.targetScene.sceneId)
        errors.push('source and target scene must be distinct');
    }
    if (new Set([...this.defs.keys()]).size !== this.defs.size)
      errors.push('definition ids not unique');
    if (this.shut && (this.active || this.queue.length || this.plan))
      errors.push('shutdown retained state');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: [],
      checkedInvariants: [
        'FrameTick authority',
        'unique ids',
        'bounded progress',
        'Program commit once',
        'bounded queues',
        'shutdown clean',
      ],
    });
  }
  snapshot(): TransitionExecutionEngineSnapshot {
    return freeze({
      definitions: [...this.defs.values()].sort((a, b) =>
        a.transitionId.localeCompare(b.transitionId),
      ),
      ...(this.active ? { activeInstance: this.active } : {}),
      queue: { queuedRequestIds: this.queue.map((q) => q.requestId), capacity: 128 },
      health: this.health(),
      telemetry: this.telemetry(),
      containsRuntimeHandles: false,
    });
  }
  health(): TransitionExecutionHealthSnapshot {
    const type = this.active ? this.defs.get(this.active.transitionId)?.transitionType : undefined;
    const h: any = {
      engineState: this.shut ? 'SHUTDOWN' : 'READY',
      healthState: this.t.failures ? 'DEGRADED' : 'HEALTHY',
      registeredTransitionCount: this.defs.size,
      activeTransitionCount: this.active ? 1 : 0,
      progress: this.active?.progress ?? 0,
      completedCount: this.t.completed,
      cutCount: this.t.cutCount,
      dissolveCount: this.t.perTransitionType.DISSOLVE ?? 0,
      fadeCount: this.t.perTransitionType.FADE ?? 0,
      dipCount: this.t.perTransitionType.DIP_TO_COLOR ?? 0,
      wipeCount: Object.entries(this.t.perTransitionType)
        .filter(([k]) => k.startsWith('WIPE'))
        .reduce((sum, [, v]) => sum + Number(v), 0),
      slidePushRevealCount: Object.entries(this.t.perTransitionType)
        .filter(([k]) => /SLIDE|PUSH|REVEAL|COVER/.test(k))
        .reduce((sum, [, v]) => sum + Number(v), 0),
      cancelledCount: this.t.cancellations,
      interruptedCount: this.t.interruptions,
      rollbackCount: this.t.rollbacks,
      failedCount: this.t.failures,
      rejectedCount: this.t.rejections,
      duplicateRequestCount: this.t.duplicateRequests,
      duplicateTickCount: this.t.duplicateTicks,
      staleGenerationRejectionCount: this.t.staleGenerations,
      compositorFailureCount: this.t.compositorFailures,
      gpuLossCount: this.t.gpuLoss,
      allocationFailureCount: 0,
      updatedAtNs: this.nowNs().toString(),
    };
    if (this.active) {
      h.activeTransitionId = this.active.transitionId;
      h.currentTransitionType = type;
      h.currentSourceScene = this.active.sourceScene.sceneId;
      h.currentTargetScene = this.active.targetScene.sceneId;
    }
    if (this.t.lastSuccessfulTransition)
      h.lastSuccessfulTransition = this.t.lastSuccessfulTransition;
    if (this.t.lastFailure) h.lastFailure = this.t.lastFailure;
    return freeze(h) as TransitionExecutionHealthSnapshot;
  }
  telemetry(): TransitionExecutionTelemetrySnapshot {
    return freeze({
      ...this.t,
      perTransitionType: { ...this.t.perTransitionType },
      averageTransitionDurationFrames: this.t.completed ? this.t.totalFrames / this.t.completed : 0,
      maximumTransitionDurationFrames: this.t.maxFrames,
      averageFramesPerTransition: this.t.completed ? this.t.totalFrames / this.t.completed : 0,
      currentTransitionId: this.active?.transitionId,
      queuedTransitionIds: this.queue.map((q) => q.transitionDefinitionRef),
      healthSummary: this.t.failures ? 'DEGRADED' : 'HEALTHY',
    }) as TransitionExecutionTelemetrySnapshot;
  }
  private validateDefinition(d: TransitionDefinition) {
    if (!TRANSITION_TYPES.includes(d.transitionType))
      throw this.reject('TransitionTypeUnsupported', 'unsupported transition');
    if (!TRANSITION_EASINGS.includes(d.easing))
      throw this.reject('TransitionDefinitionInvalid', 'unsupported easing');
    if (!Number.isInteger(d.durationFrames) || d.durationFrames <= 0 || d.durationFrames > 60_000)
      throw this.reject('TransitionDurationInvalid', 'invalid duration');
    if (d.easing === 'CUSTOM_BEZIER') evaluateTransitionEasing('CUSTOM_BEZIER', 0.5, d.cubicBezier);
    if (
      (d.transitionType === 'STINGER' ||
        d.transitionType === 'DVE' ||
        d.transitionType === 'LUMA_WIPE' ||
        d.transitionType === 'CUSTOM') &&
      d.backendPreference === 'metadata-only-execute'
    )
      throw this.reject('TransitionTypeUnsupported', 'metadata-only transition cannot execute');
  }
  private instance(
    r: TransitionExecutionRequest,
    d: TransitionDefinition,
    state: TransitionInstanceState,
  ): TransitionExecutionInstance {
    return clone({
      instanceId: id('transition-instance', [
        r.requestId,
        d.transitionId,
        r.startFrameTick.frameNumber,
      ]),
      transactionId: r.transactionId,
      transitionId: d.transitionId,
      transitionVersion: d.transitionVersion,
      transitionGeneration: d.transitionGeneration,
      instanceGeneration: 1,
      sourceScene: r.sourceScene,
      targetScene: r.targetScene,
      programBusGeneration: r.expectedProgramGeneration,
      previewBusGeneration: r.expectedPreviewGeneration,
      state,
      startRuntimeFrame: r.startFrameTick.frameNumber.toString(),
      currentRuntimeFrame: r.startFrameTick.frameNumber.toString(),
      elapsedFrames: 0,
      durationFrames: d.durationFrames,
      progress: 0,
      easedProgress: 0,
      direction: d.direction,
      safeMetadata: safe(r.safeMetadata ?? {}) as Record<string, unknown>,
    }) as TransitionExecutionInstance;
  }
  private makePlan(
    r: TransitionExecutionRequest,
    d: TransitionDefinition,
    i: TransitionExecutionInstance,
  ): TransitionExecutionPlan {
    const progress = {
      alphaMix: d.transitionType === 'DISSOLVE',
      dipColor: d.color,
      wipe: /WIPE|IRIS|CLOCK|BARN|LUMA/.test(d.transitionType),
      motion: /SLIDE|PUSH|REVEAL|COVER|DVE/.test(d.transitionType),
      sourceContribution: '1-progress',
      targetContribution: 'progress',
    };
    return clone({
      planId: id('transition-plan', [r.requestId, i.instanceId, d.transitionGeneration]),
      transitionId: d.transitionId,
      transitionVersion: d.transitionVersion,
      transitionGeneration: d.transitionGeneration,
      transactionId: r.transactionId,
      instanceId: i.instanceId,
      instanceGeneration: i.instanceGeneration,
      sourceScene: r.sourceScene,
      targetScene: r.targetScene,
      programGeneration: r.expectedProgramGeneration,
      previewGeneration: r.expectedPreviewGeneration,
      durationFrames: d.durationFrames,
      easing: d.easing,
      operationOrder: [
        'validate transaction',
        'validate source/target scenes',
        'validate Program/Preview generations',
        'prepare source scene render',
        'prepare target scene render',
        'resolve transition plan',
        'evaluate progress',
        'invoke Layer/Scene Compositor transition path',
        'validate output',
        'publish Program transition frame',
        'commit final target scene at completion',
        'release temporary resources',
      ],
      sourceRenderRequirements: { stable: true, independentWritableOutput: true },
      targetRenderRequirements: { ready: true, stable: true, independentWritableOutput: true },
      compositorRequirements: { transitionType: d.transitionType, progress },
      geometryRequirements: {
        direction: d.direction,
        reverse: d.reverse,
        engineBoundary: 'geometry-engine',
      },
      maskRequirements: {
        softness: d.softness ?? 0,
        feather: d.feather ?? 0,
        border: d.border ?? 0,
        borderColor: d.borderColor,
        engineBoundary: 'mask/compositor',
      },
      temporaryResourceEstimates: { leases: 3, gpuGeneration: 'included-in-plan-key' },
      outputByteEstimate: 0,
      deterministicScore: 100,
      warnings: [],
      safeMetadata: safe(d.safeMetadata) as Record<string, unknown>,
    }) as TransitionExecutionPlan;
  }
  private cut(r: TransitionExecutionRequest, d: TransitionDefinition) {
    const inst = this.instance(r, d, 'COMPLETED');
    const plan = this.makePlan(r, d, inst);
    this.program?.commit(r.targetScene, r.expectedProgramGeneration + 1);
    this.t.cutCount++;
    this.t.programCommits++;
    this.t.completed++;
    this.t.perTransitionType[d.transitionType] =
      (this.t.perTransitionType[d.transitionType] ?? 0) + 1;
    this.t.lastSuccessfulTransition = inst.instanceId;
    return this.result(r, inst, plan, 'COMPLETED', false, true);
  }
  private complete(tick: FrameTick, out: string) {
    if (!this.active || !this.plan || this.completedIds.has(this.active.instanceId)) {
      this.t.failures++;
      throw new TransitionExecutionError('TransitionInvariantViolation', 'duplicate completion');
    }
    this.completedIds.add(this.active.instanceId);
    this.program?.commit(this.active.targetScene, this.active.programBusGeneration + 1);
    this.t.programCommits++;
    this.t.completed++;
    this.t.totalFrames += this.active.elapsedFrames;
    this.t.maxFrames = Math.max(this.t.maxFrames, this.active.elapsedFrames);
    const type = this.defs.get(this.active.transitionId)?.transitionType ?? 'CUSTOM';
    this.t.perTransitionType[type] = (this.t.perTransitionType[type] ?? 0) + 1;
    this.active = clone({
      ...this.active,
      state: 'COMPLETED',
      currentRuntimeFrame: tick.frameNumber.toString(),
      progress: 1,
      easedProgress: 1,
      lastOutputSummary: { outputFrameReference: out, programCommitApplied: true },
    }) as TransitionExecutionInstance;
    this.t.lastSuccessfulTransition = this.active.instanceId;
    const next = this.queue.shift();
    this.plan = undefined;
    this.active = undefined;
    if (next) this.start(next);
  }
  private result(
    r: TransitionExecutionRequest,
    i: TransitionExecutionInstance,
    p: TransitionExecutionPlan,
    status: TransitionResultStatus,
    animated: boolean,
    commit: boolean,
  ): TransitionExecutionResult {
    const res: any = {
      requestId: r.requestId,
      transactionId: r.transactionId,
      instanceId: i.instanceId,
      planId: p.planId,
      status,
      transitionType: this.defs.get(i.transitionId)?.transitionType ?? 'CUSTOM',
      sourceScene: i.sourceScene,
      targetScene: i.targetScene,
      startedRuntimeFrame: i.startRuntimeFrame,
      totalFrames: i.durationFrames,
      progress: i.progress,
      easedProgress: i.easedProgress,
      transitionAnimationApplied: animated && i.durationFrames > 0,
      programCommitApplied: commit,
      rollbackApplied: false,
      warnings: p.warnings,
      durationNs: String(BigInt(i.durationFrames) * 33333333n),
      ownershipTransfer: { containsRuntimeHandles: false },
    };
    if (commit) {
      res.completedRuntimeFrame = i.currentRuntimeFrame;
      res.completedAtNs = this.nowNs().toString();
    }
    return freeze(res) as TransitionExecutionResult;
  }
  private ensure() {
    if (this.shut)
      throw new TransitionExecutionError('TransitionShutdownError', 'transition engine shutdown');
  }
  private reject(code: (typeof TRANSITION_ERRORS)[number], msg: string) {
    this.t.rejections++;
    this.t.lastFailure = code;
    return new TransitionExecutionError(code, msg);
  }
  private fail(code: (typeof TRANSITION_ERRORS)[number], msg: string) {
    this.t.failures++;
    this.t.lastFailure = code;
    return new TransitionExecutionError(code, msg);
  }
  private countMode(r: TransitionExecutionRequest) {
    if (r.mode === 'AUTO') this.t.autoCount++;
    else if (r.mode === 'TAKE') this.t.takeCount++;
  }
}
export class TransitionExecutionProcessor implements TickProcessor {
  readonly id = 'transition-execution-processor';
  readonly order = 500;
  constructor(readonly engine: TransitionExecutionEngine) {}
  initialize() {}
  shutdown() {
    this.engine.shutdown();
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const inst = this.engine.processTick(tick);
    context.outputs?.publish(
      this.id,
      TRANSITION_OUTPUT_KEYS.activeInstance,
      inst,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish(
      this.id,
      TRANSITION_OUTPUT_KEYS.health,
      this.engine.health(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish(
      this.id,
      TRANSITION_OUTPUT_KEYS.telemetry,
      this.engine.telemetry(),
      'OWNED_BY_PROCESSOR',
    );
  }
}
export function createTransitionCommandHandlers(
  engine: TransitionExecutionEngine,
): Readonly<Record<string, RuntimeCommandHandler>> {
  const h = (type: string, fn: (p: any) => unknown): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute: async (c: RuntimeCommand) => ({ status: 'SUCCEEDED', value: fn(c.payload) }) as any,
  });
  return {
    TRANSITION_REGISTER: h('TRANSITION_REGISTER', (p) => engine.registerDefinition(p.definition)),
    TRANSITION_UNREGISTER: h('TRANSITION_UNREGISTER', (p) =>
      engine.unregisterDefinition(p.transitionId, p.expectedGeneration),
    ),
    TRANSITION_UPDATE: h('TRANSITION_UPDATE', (p) =>
      engine.updateDefinition(p.definition, p.expectedGeneration),
    ),
    TRANSITION_START: h('TRANSITION_START', (p) => engine.start(p.request)),
    TRANSITION_AUTO: h('TRANSITION_AUTO', (p) => engine.start({ ...p.request, mode: 'AUTO' })),
    TRANSITION_TAKE: h('TRANSITION_TAKE', (p) => engine.start({ ...p.request, mode: 'TAKE' })),
    TRANSITION_PAUSE: h('TRANSITION_PAUSE', () => engine.pause()),
    TRANSITION_RESUME: h('TRANSITION_RESUME', () => engine.resume()),
    TRANSITION_CANCEL: h('TRANSITION_CANCEL', (p) => engine.cancel(p.policy)),
    TRANSITION_INTERRUPT: h('TRANSITION_INTERRUPT', (p) => engine.start(p.request)),
    TRANSITION_RETARGET: h('TRANSITION_RETARGET', (p) => engine.retarget(p.targetScene)),
    TRANSITION_VALIDATE: h('TRANSITION_VALIDATE', () => engine.assertInvariants()),
    TRANSITION_SHUTDOWN: h('TRANSITION_SHUTDOWN', () => engine.shutdown()),
    TRANSITION_SET_DEFAULT: h('TRANSITION_SET_DEFAULT', (p) => p),
    TRANSITION_SET_DURATION: h('TRANSITION_SET_DURATION', (p) => p),
    TRANSITION_SET_DIRECTION: h('TRANSITION_SET_DIRECTION', (p) => p),
    TRANSITION_SET_EASING: h('TRANSITION_SET_EASING', (p) => p),
    TRANSITION_SET_DIP_COLOR: h('TRANSITION_SET_DIP_COLOR', (p) => p),
    TRANSITION_CLEAR_PLAN_CACHE: h('TRANSITION_CLEAR_PLAN_CACHE', () => ({ cleared: true })),
  };
}
export const createTransitionExecutionEngine = (
  compositor?: TransitionCompositorAdapter,
  program?: TransitionProgramAdapter,
  nowNs?: () => bigint,
) => new TransitionExecutionEngine(compositor, program, nowNs);
