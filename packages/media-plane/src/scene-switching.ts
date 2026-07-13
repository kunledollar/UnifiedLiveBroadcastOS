import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeContext,
  type ProcessorTickResult,
  type TickProcessor,
} from './execution-engine.js';

type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const SECRET =
  /token|secret|password|credential|cookie|url|endpoint|device|handle|native|pixel|lease|gpu/i;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(structuredClone(v));
const safe = (v: unknown, d = 0): Json => {
  if (d > 4) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v as null | boolean;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => safe(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, x]) => [k, SECRET.test(k) ? '[REDACTED]' : safe(x, d + 1)]),
    );
  return String(v);
};
const id = (p: string, n: number) => `${p}:${n.toString().padStart(6, '0')}`;
export const SCENE_SWITCHING_OUTPUT_KEYS = freeze({
  programBusSnapshot: 'scene-switching.program-bus',
  previewBusSnapshot: 'scene-switching.preview-bus',
  previousProgramSnapshot: 'scene-switching.previous-program',
  activeSwitchTransaction: 'scene-switching.active-transaction',
  switchRequest: 'scene-switching.request',
  switchResult: 'scene-switching.result',
  queueSnapshot: 'scene-switching.queue',
  programReadiness: 'scene-switching.program-readiness',
  previewReadiness: 'scene-switching.preview-readiness',
  switchingHealth: 'scene-switching.health',
  switchingTelemetry: 'scene-switching.telemetry',
  failedRejectedResults: 'scene-switching.failed-rejected',
});
export const SCENE_SWITCHING_COMMAND_TYPES = [
  'SWITCH_SET_PREVIEW_SCENE',
  'SWITCH_CLEAR_PREVIEW',
  'SWITCH_CUT',
  'SWITCH_TAKE',
  'SWITCH_CANCEL',
  'SWITCH_SET_MODE',
  'SWITCH_SET_TRANSITION_METADATA',
  'SWITCH_LOCK_PROGRAM',
  'SWITCH_UNLOCK_PROGRAM',
  'SWITCH_ARM_PROGRAM',
  'SWITCH_EMERGENCY_OVERRIDE',
  'SWITCH_SET_PREVIEW_AFTER_CUT_POLICY',
  'SWITCH_SET_QUEUE_POLICY',
  'SWITCH_SET_FAILURE_POLICY',
  'SWITCH_VALIDATE',
  'SWITCH_SHUTDOWN',
] as const;
export type SceneSwitchingCommandType = (typeof SCENE_SWITCHING_COMMAND_TYPES)[number];
export const SCENE_SWITCHING_EVENTS = [
  'SwitchingEngineCreated',
  'PreviewSceneSelected',
  'PreviewSceneCleared',
  'SwitchRequested',
  'SwitchValidated',
  'SwitchRejected',
  'SwitchQueued',
  'SwitchScheduled',
  'SwitchCommitStarted',
  'ProgramSceneChanged',
  'PreviewSceneChanged',
  'SwitchCommitted',
  'SwitchCompleted',
  'SwitchCancelled',
  'SwitchFailed',
  'SwitchRollbackStarted',
  'SwitchRolledBack',
  'ProgramLocked',
  'ProgramUnlocked',
  'ProgramArmed',
  'EmergencyOverrideUsed',
  'SceneReadinessChanged',
  'SwitchingHealthChanged',
  'SwitchingEngineShutdown',
] as const;
export const SCENE_SWITCHING_WATCHDOG_INCIDENTS = [
  'SWITCH_ENGINE_STALLED',
  'SWITCH_TRANSACTION_TIMEOUT',
  'SWITCH_DUPLICATE_REQUEST',
  'SWITCH_DUPLICATE_COMMIT',
  'SWITCH_DUPLICATE_TICK',
  'SWITCH_PROGRAM_GENERATION_STALE',
  'SWITCH_PREVIEW_GENERATION_STALE',
  'SWITCH_SCENE_GENERATION_STALE',
  'SWITCH_PROGRAM_LOCK_VIOLATION',
  'SWITCH_PREVIEW_NOT_READY',
  'SWITCH_COMMIT_FAILED',
  'SWITCH_ROLLBACK_FAILED',
  'SWITCH_QUEUE_PRESSURE',
  'SWITCH_OUTPUT_REGISTRY_MISMATCH',
  'SWITCH_SCENE_COMPOSITOR_MISMATCH',
  'SWITCH_PROGRAM_PREVIEW_LEAK',
  'SWITCH_INVARIANT_FAILURE',
] as const;
export type SceneBusRole =
  'PROGRAM' | 'PREVIEW' | 'AUXILIARY' | 'CLEAN_FEED' | 'MULTIVIEW' | 'CUSTOM';
export type SceneReadinessState =
  'UNKNOWN' | 'LOADING' | 'READY' | 'DEGRADED' | 'FAILED' | 'UNAVAILABLE';
export type SceneSwitchMode =
  'CUT' | 'TAKE' | 'AUTO_METADATA' | 'PREVIEW_ONLY' | 'PROGRAM_DIRECT' | 'CUSTOM';
export type PreviewAfterCutPolicy =
  | 'KEEP_SELECTED_SCENE'
  | 'SWAP_WITH_PREVIOUS_PROGRAM'
  | 'CLEAR_PREVIEW'
  | 'FOLLOW_PROGRAM'
  | 'SELECT_NEXT_SCENE'
  | 'CUSTOM';
export type SceneSwitchPolicy =
  | 'REQUIRE_PREVIEW_READY'
  | 'ALLOW_DEGRADED_PREVIEW'
  | 'REJECT_FAILED_PREVIEW'
  | 'REJECT_SAME_SCENE'
  | 'ALLOW_SAME_SCENE_REFRESH'
  | 'QUEUE_WHEN_BUSY'
  | 'REJECT_WHEN_BUSY'
  | 'REPLACE_PENDING_REQUEST'
  | 'PRESERVE_PROGRAM_ON_FAILURE'
  | 'ROLLBACK_ON_COMMIT_FAILURE'
  | 'REQUIRE_OPERATOR_CONFIRMATION'
  | 'PROGRAM_LOCK_REQUIRED'
  | 'CUSTOM';
export type ProgramLockState = 'UNLOCKED' | 'LOCKED' | 'ARMED' | 'EMERGENCY_OVERRIDE';
export type SceneSwitchQueuePolicy =
  'FIFO' | 'PRIORITY' | 'REPLACE_LATEST' | 'REPLACE_SAME_TARGET' | 'REJECT_NEW' | 'CUSTOM';
export type SceneSwitchTransactionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'SCHEDULED'
  | 'COMMITTING'
  | 'COMMITTED'
  | 'COMPLETED'
  | 'CANCELLING'
  | 'CANCELLED'
  | 'ROLLING_BACK'
  | 'ROLLED_BACK'
  | 'FAILED';
export type SceneSwitchResultStatus =
  'COMPLETED' | 'SCHEDULED' | 'CANCELLED' | 'REJECTED' | 'FAILED' | 'ROLLED_BACK' | 'DEGRADED';
export interface SceneReadinessSnapshot {
  readonly state: SceneReadinessState;
  readonly dependencySummary: readonly string[];
  readonly generation: number;
  readonly updatedAtNs: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface SceneSwitchReferenceSnapshot {
  readonly sceneId: string;
  readonly sceneVersion: string;
  readonly sceneGeneration: number;
  readonly sceneInstanceId: string;
  readonly sceneInstanceGeneration: number;
  readonly outputProfile: string;
  readonly readiness: SceneReadinessSnapshot;
  readonly healthState: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'DESTROYED';
  readonly sourceDependencySummary: readonly string[];
  readonly compositorPlanGeneration: number;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type SceneSwitchReference = SceneSwitchReferenceSnapshot;
export interface SceneBusSnapshot {
  readonly busId: string;
  readonly role: SceneBusRole;
  readonly scene: SceneSwitchReferenceSnapshot | null;
  readonly busGeneration: number;
  readonly switchGeneration: number;
  readonly runtimeFrameNumber: string;
  readonly readiness: SceneReadinessState;
  readonly health: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  readonly outputProfile: string;
  readonly lastTransactionId?: string | undefined;
  readonly updatedAtNs: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface SceneSwitchRequestSnapshot {
  readonly requestId: string;
  readonly commandId: string;
  readonly mode: SceneSwitchMode;
  readonly sourceBus: SceneBusRole;
  readonly destinationBus: SceneBusRole;
  readonly currentProgramScene: string | null;
  readonly selectedPreviewScene: string | null;
  readonly expectedProgramGeneration: number;
  readonly expectedPreviewGeneration: number;
  readonly expectedSceneGenerations: Readonly<Record<string, number>>;
  readonly requestedTransitionType?: string | undefined;
  readonly requestedDurationNs?: string | undefined;
  readonly requestedFrameTick?: string | undefined;
  readonly operatorId?: string | undefined;
  readonly priority: number;
  readonly deadlineNs?: string | undefined;
  readonly cancellationId?: string | undefined;
  readonly correlationId?: string | undefined;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface SceneSwitchingValidationReport {
  readonly valid: boolean;
  readonly code: string;
  readonly warnings: readonly string[];
  readonly checkedAtNs: string;
  readonly safeDetails: Readonly<Record<string, Json>>;
}
export interface SceneSwitchTransactionSnapshot {
  readonly transactionId: string;
  readonly requestId: string;
  readonly transactionGeneration: number;
  readonly state: SceneSwitchTransactionState;
  readonly sourceProgramScene: string | null;
  readonly targetPreviewScene: string | null;
  readonly previousProgramScene: string | null;
  readonly mode: SceneSwitchMode;
  readonly requestedTransitionMetadata: Readonly<Record<string, Json>>;
  readonly scheduledFrameTick: string;
  readonly validationReport: SceneSwitchingValidationReport;
  readonly preparationSnapshot?: Readonly<Record<string, Json>>;
  readonly commitSnapshot?: Readonly<Record<string, Json>>;
  readonly rollbackSnapshot?: Readonly<Record<string, Json>>;
  readonly failureReason?: string;
  readonly createdAtNs: string;
  readonly committedAtNs?: string;
  readonly completedAtNs?: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface SceneSwitchResultSnapshot {
  readonly requestId: string;
  readonly transactionId: string;
  readonly status: SceneSwitchResultStatus;
  readonly mode: SceneSwitchMode;
  readonly previousProgramScene: string | null;
  readonly newProgramScene: string | null;
  readonly newPreviewScene: string | null;
  readonly programGeneration: number;
  readonly previewGeneration: number;
  readonly switchGeneration: number;
  readonly committedRuntimeFrame?: string | undefined;
  readonly transitionMetadata: Readonly<Record<string, Json>>;
  readonly transitionAnimationApplied: boolean;
  readonly rollbackApplied: boolean;
  readonly warnings: readonly string[];
  readonly durationNs: string;
  readonly completedAtNs: string;
}
export interface SceneSwitchQueueSnapshot {
  readonly policy: SceneSwitchQueuePolicy;
  readonly capacity: number;
  readonly size: number;
  readonly requestIds: readonly string[];
  readonly highWaterMark: number;
}
export interface SceneSwitchingTelemetrySnapshot {
  readonly previewSelections: number;
  readonly previewClears: number;
  readonly switchRequests: number;
  readonly cutRequests: number;
  readonly cutCompletions: number;
  readonly takeRequests: number;
  readonly takeCompletions: number;
  readonly queuedRequests: number;
  readonly replacedRequests: number;
  readonly rejectedRequests: number;
  readonly commits: number;
  readonly rollbacks: number;
  readonly cancellations: number;
  readonly sameSceneRejects: number;
  readonly readinessRejects: number;
  readonly lockRejects: number;
  readonly duplicateRequests: number;
  readonly duplicateTicks: number;
  readonly staleGenerationRejects: number;
  readonly programUpdates: number;
  readonly previewUpdates: number;
  readonly queueHighWaterMark: number;
  readonly averageValidationDurationNs: string;
  readonly maximumValidationDurationNs: string;
  readonly averageCommitDurationNs: string;
  readonly maximumCommitDurationNs: string;
  readonly currentTransactionId?: string | undefined;
  readonly queuedRequestIds: readonly string[];
  readonly lastSwitchingEvent: string;
  readonly healthSummary: string;
}
export interface SceneSwitchingHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly programSceneId: string | null;
  readonly previewSceneId: string | null;
  readonly previousProgramSceneId: string | null;
  readonly programGeneration: number;
  readonly previewGeneration: number;
  readonly switchGeneration: number;
  readonly activeTransactionCount: number;
  readonly queuedRequestCount: number;
  readonly completedSwitchCount: number;
  readonly cutCount: number;
  readonly takeCount: number;
  readonly rejectedCount: number;
  readonly failedCount: number;
  readonly cancelledCount: number;
  readonly rollbackCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateTickCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly programLockState: ProgramLockState;
  readonly programReadiness: SceneReadinessState;
  readonly previewReadiness: SceneReadinessState;
  readonly queuePressure: number;
  readonly lastSuccessfulSwitch?: string | undefined;
  readonly lastFailure?: string | undefined;
  readonly updatedAtNs: string;
}
export interface SceneSwitchingEngineSnapshot {
  readonly program: SceneBusSnapshot;
  readonly preview: SceneBusSnapshot;
  readonly previousProgram: SceneBusSnapshot;
  readonly activeTransaction: SceneSwitchTransactionSnapshot | null;
  readonly queue: SceneSwitchQueueSnapshot;
  readonly health: SceneSwitchingHealthSnapshot;
  readonly telemetry: SceneSwitchingTelemetrySnapshot;
  readonly recentResults: readonly SceneSwitchResultSnapshot[];
  readonly sourceGraphMetadata: Readonly<Record<string, Json>>;
}

interface MutableSceneSwitchingTelemetry {
  previewSelections: number;
  previewClears: number;
  switchRequests: number;
  cutRequests: number;
  cutCompletions: number;
  takeRequests: number;
  takeCompletions: number;
  queuedRequests: number;
  replacedRequests: number;
  rejectedRequests: number;
  commits: number;
  rollbacks: number;
  cancellations: number;
  sameSceneRejects: number;
  readinessRejects: number;
  lockRejects: number;
  duplicateRequests: number;
  duplicateTicks: number;
  staleGenerationRejects: number;
  programUpdates: number;
  previewUpdates: number;
  queueHighWaterMark: number;
  lastSwitchingEvent: string;
}
export class SceneSwitchingError extends RuntimeEngineError {}
export const createSceneSwitchingError = (
  code: string,
  msg: string,
  details: Record<string, unknown> = {},
) =>
  new SceneSwitchingError(
    code,
    msg,
    Object.fromEntries(Object.entries(details).map(([k, v]) => [k, safe(v)])),
  );
export class SceneSwitchQueue {
  private q: SceneSwitchRequestSnapshot[] = [];
  highWaterMark = 0;
  seen = new Set<string>();
  constructor(
    public policy: SceneSwitchQueuePolicy = 'FIFO',
    public capacity = 32,
  ) {}
  enqueue(r: SceneSwitchRequestSnapshot) {
    if (this.seen.has(r.requestId))
      throw createSceneSwitchingError('SceneSwitchDuplicateRequest', 'duplicate request', {
        requestId: r.requestId,
      });
    if (this.q.length >= this.capacity) {
      if (this.policy === 'REPLACE_LATEST') this.q.pop();
      else if (this.policy === 'REPLACE_SAME_TARGET') {
        const i = this.q.findIndex((x) => x.selectedPreviewScene === r.selectedPreviewScene);
        if (i >= 0) this.q.splice(i, 1);
        else throw createSceneSwitchingError('SceneSwitchQueueFull', 'queue full');
      } else throw createSceneSwitchingError('SceneSwitchQueueFull', 'queue full');
    }
    this.q.push(r);
    this.seen.add(r.requestId);
    if (this.policy === 'PRIORITY')
      this.q.sort((a, b) => b.priority - a.priority || a.requestId.localeCompare(b.requestId));
    this.highWaterMark = Math.max(this.highWaterMark, this.q.length);
  }
  dequeue(now: bigint) {
    this.q = this.q.filter((r) => !r.deadlineNs || BigInt(r.deadlineNs) >= now);
    const r = this.q.shift();
    if (r) this.seen.delete(r.requestId);
    return r;
  }
  cancel(id: string) {
    const n = this.q.length;
    this.q = this.q.filter((r) => r.requestId !== id);
    this.seen.delete(id);
    return this.q.length !== n;
  }
  clear() {
    this.q = [];
    this.seen.clear();
  }
  snapshot(): SceneSwitchQueueSnapshot {
    return freeze({
      policy: this.policy,
      capacity: this.capacity,
      size: this.q.length,
      requestIds: this.q.map((r) => r.requestId),
      highWaterMark: this.highWaterMark,
    });
  }
}
export class SceneSwitchingController {
  private scenes = new Map<string, SceneSwitchReference>();
  private program: SceneSwitchReference | null = null;
  private preview: SceneSwitchReference | null = null;
  private previous: SceneSwitchReference | null = null;
  private pg = 0;
  private vg = 0;
  private sg = 0;
  private txg = 0;
  private reqn = 0;
  private txn = 0;
  private active: SceneSwitchTransactionSnapshot | null = null;
  private processedTicks = new Set<string>();
  private doneReq = new Set<string>();
  private results: SceneSwitchResultSnapshot[] = [];
  private shutdownFlag = false;
  private lock: ProgramLockState = 'UNLOCKED';
  private lockGen = 0;
  private lastFrame = '0';
  readonly queue: SceneSwitchQueue;
  readonly events: { type: string; payload: Json }[] = [];
  telemetry: MutableSceneSwitchingTelemetry = {
    previewSelections: 0,
    previewClears: 0,
    switchRequests: 0,
    cutRequests: 0,
    cutCompletions: 0,
    takeRequests: 0,
    takeCompletions: 0,
    queuedRequests: 0,
    replacedRequests: 0,
    rejectedRequests: 0,
    commits: 0,
    rollbacks: 0,
    cancellations: 0,
    sameSceneRejects: 0,
    readinessRejects: 0,
    lockRejects: 0,
    duplicateRequests: 0,
    duplicateTicks: 0,
    staleGenerationRejects: 0,
    programUpdates: 0,
    previewUpdates: 0,
    queueHighWaterMark: 0,
    lastSwitchingEvent: 'SwitchingEngineCreated',
  };
  constructor(
    init: {
      programScene?: SceneSwitchReference;
      previewScene?: SceneSwitchReference;
      queueCapacity?: number;
    } = {},
  ) {
    this.queue = new SceneSwitchQueue('FIFO', init.queueCapacity ?? 32);
    if (init.programScene)
      (this.registerScene(init.programScene), (this.program = init.programScene));
    if (init.previewScene)
      (this.registerScene(init.previewScene), (this.preview = init.previewScene));
    this.emit('SwitchingEngineCreated', {});
  }
  private now() {
    return BigInt(this.telemetry.switchRequests + this.telemetry.previewSelections + 1) * 1000n;
  }
  private emit(type: string, payload: unknown) {
    this.telemetry.lastSwitchingEvent = type;
    this.events.push({ type, payload: safe(payload) });
    if (this.events.length > 512) this.events.shift();
  }
  registerScene(ref: SceneSwitchReference) {
    this.scenes.set(ref.sceneId, freeze(ref) as SceneSwitchReference);
    return this.scenes.get(ref.sceneId)!;
  }
  setPreviewScene(sceneId: string, expectedPreviewGeneration = this.vg) {
    this.guard();
    if (expectedPreviewGeneration !== this.vg)
      throw this.reject('SceneSwitchGenerationMismatch', 'stale preview generation', true);
    const s = this.scenes.get(sceneId);
    if (!s) throw this.reject('SceneSwitchSceneNotFound', 'scene not found');
    this.preview = s;
    this.vg++;
    this.telemetry.previewSelections++;
    this.telemetry.previewUpdates++;
    this.emit('PreviewSceneSelected', { sceneId });
    return this.bus('PREVIEW');
  }
  clearPreview() {
    this.guard();
    this.preview = null;
    this.vg++;
    this.telemetry.previewClears++;
    this.telemetry.previewUpdates++;
    this.emit('PreviewSceneCleared', {});
  }
  lockProgram() {
    this.lock = 'LOCKED';
    this.lockGen++;
    this.emit('ProgramLocked', { lockGeneration: this.lockGen });
  }
  unlockProgram() {
    this.lock = 'UNLOCKED';
    this.lockGen++;
    this.emit('ProgramUnlocked', { lockGeneration: this.lockGen });
  }
  armProgram() {
    this.lock = 'ARMED';
    this.lockGen++;
    this.emit('ProgramArmed', { lockGeneration: this.lockGen });
  }
  emergencyOverride() {
    this.lock = 'EMERGENCY_OVERRIDE';
    this.lockGen++;
    this.emit('EmergencyOverrideUsed', { lockGeneration: this.lockGen });
  }
  requestSwitch(
    partial: Partial<SceneSwitchRequestSnapshot> & {
      mode: SceneSwitchMode;
      commandId?: string;
      requestId?: string;
    },
  ): SceneSwitchResultSnapshot | SceneSwitchTransactionSnapshot {
    this.guard();
    const r = this.makeRequest(partial);
    try {
      const tx = this.prepare(r);
      this.active = tx;
      this.emit('SwitchScheduled', { transactionId: tx.transactionId });
      return tx;
    } catch (e) {
      if (
        e instanceof SceneSwitchingError &&
        e.code === 'SceneSwitchTransactionConflict' &&
        (partial.safeMetadata as Record<string, unknown> | undefined)?.busyPolicy ===
          'QUEUE_WHEN_BUSY'
      ) {
        this.queue.enqueue(r);
        this.telemetry.queuedRequests++;
        return this.result(r, 'SCHEDULED', null, []);
      }
      throw e;
    }
  }
  private makeRequest(
    p: Partial<SceneSwitchRequestSnapshot> & {
      mode: SceneSwitchMode;
      commandId?: string;
      requestId?: string;
    },
  ): SceneSwitchRequestSnapshot {
    const requestId = p.requestId ?? id('switch-request', ++this.reqn);
    if (this.doneReq.has(requestId) || this.queue.seen.has(requestId)) {
      this.telemetry.duplicateRequests++;
      throw this.reject('SceneSwitchDuplicateRequest', 'duplicate request');
    }
    const r = freeze({
      requestId,
      commandId: p.commandId ?? requestId,
      mode: p.mode,
      sourceBus: p.sourceBus ?? 'PREVIEW',
      destinationBus: p.destinationBus ?? 'PROGRAM',
      currentProgramScene: this.program?.sceneId ?? null,
      selectedPreviewScene: this.preview?.sceneId ?? null,
      expectedProgramGeneration: p.expectedProgramGeneration ?? this.pg,
      expectedPreviewGeneration: p.expectedPreviewGeneration ?? this.vg,
      expectedSceneGenerations: p.expectedSceneGenerations ?? {},
      requestedTransitionType: p.requestedTransitionType,
      requestedDurationNs: p.requestedDurationNs,
      requestedFrameTick: p.requestedFrameTick,
      operatorId: p.operatorId ? '[REDACTED]' : undefined,
      priority: p.priority ?? 0,
      deadlineNs: p.deadlineNs,
      cancellationId: p.cancellationId,
      correlationId: p.correlationId,
      safeMetadata: safe(p.safeMetadata ?? {}) as Record<string, Json>,
    });
    this.doneReq.add(requestId);
    this.telemetry.switchRequests++;
    if (r.mode === 'CUT') this.telemetry.cutRequests++;
    if (r.mode === 'TAKE') this.telemetry.takeRequests++;
    this.emit('SwitchRequested', { requestId, mode: r.mode });
    return r;
  }
  private prepare(r: SceneSwitchRequestSnapshot): SceneSwitchTransactionSnapshot {
    const report = this.validate(r);
    if (!report.valid) throw this.reject(report.code, report.warnings[0] ?? 'invalid');
    if (this.active)
      throw createSceneSwitchingError(
        'SceneSwitchTransactionConflict',
        'active transaction exists',
      );
    const tx = freeze({
      transactionId: id('switch-transaction', ++this.txn),
      requestId: r.requestId,
      transactionGeneration: ++this.txg,
      state: 'SCHEDULED' as const,
      sourceProgramScene: this.program?.sceneId ?? null,
      targetPreviewScene: this.preview?.sceneId ?? null,
      previousProgramScene: this.previous?.sceneId ?? null,
      mode: r.mode,
      requestedTransitionMetadata: safe({
        type: r.requestedTransitionType,
        durationNs: r.requestedDurationNs,
      }) as Record<string, Json>,
      scheduledFrameTick: r.requestedFrameTick ?? 'NEXT',
      validationReport: report,
      preparationSnapshot: { programGeneration: this.pg, previewGeneration: this.vg },
      createdAtNs: String(this.now()),
      safeMetadata: r.safeMetadata,
    });
    this.emit('SwitchValidated', { requestId: r.requestId });
    return tx;
  }
  validate(r: SceneSwitchRequestSnapshot): SceneSwitchingValidationReport {
    const fail = (code: string, w: string) =>
      freeze({
        valid: false,
        code,
        warnings: [w],
        checkedAtNs: String(this.now()),
        safeDetails: {},
      });
    if (this.shutdownFlag) return fail('SceneSwitchingEngineNotReady', 'shutdown');
    if (this.lock === 'LOCKED' && r.mode !== 'PREVIEW_ONLY') {
      this.telemetry.lockRejects++;
      return fail('SceneSwitchProgramLocked', 'program locked');
    }
    if (r.expectedProgramGeneration !== this.pg) {
      this.telemetry.staleGenerationRejects++;
      return fail('SceneSwitchGenerationMismatch', 'stale program generation');
    }
    if (r.expectedPreviewGeneration !== this.vg) {
      this.telemetry.staleGenerationRejects++;
      return fail('SceneSwitchGenerationMismatch', 'stale preview generation');
    }
    if (!this.preview && r.mode !== 'PREVIEW_ONLY')
      return fail('SceneSwitchSceneNotFound', 'missing preview');
    if (this.preview) {
      const exp = r.expectedSceneGenerations[this.preview.sceneId];
      if (exp !== undefined && exp !== this.preview.sceneGeneration) {
        this.telemetry.staleGenerationRejects++;
        return fail('SceneSwitchGenerationMismatch', 'stale scene generation');
      }
      if (
        this.preview.healthState === 'FAILED' ||
        this.preview.healthState === 'DESTROYED' ||
        this.preview.readiness.state === 'FAILED' ||
        this.preview.readiness.state === 'UNAVAILABLE'
      ) {
        this.telemetry.readinessRejects++;
        return fail('SceneSwitchSceneNotReady', 'preview failed');
      }
      if (this.preview.readiness.state !== 'READY' && this.preview.readiness.state !== 'DEGRADED') {
        this.telemetry.readinessRejects++;
        return fail('SceneSwitchSceneNotReady', 'preview not ready');
      }
      if (
        this.preview.readiness.state === 'DEGRADED' &&
        !(r.safeMetadata as Record<string, unknown>).allowDegradedPreview
      ) {
        this.telemetry.readinessRejects++;
        return fail('SceneSwitchSceneNotReady', 'preview degraded');
      }
      if (
        this.program?.sceneId === this.preview.sceneId &&
        !(r.safeMetadata as Record<string, unknown>).allowSameSceneRefresh
      ) {
        this.telemetry.sameSceneRejects++;
        return fail('SceneSwitchGenerationMismatch', 'same scene rejected');
      }
    }
    return freeze({
      valid: true,
      code: 'OK',
      warnings: [],
      checkedAtNs: String(this.now()),
      safeDetails: { policy: 'explicit' },
    });
  }
  processFrameTick(tick: FrameTick) {
    this.guard(false);
    const f = String(tick.frameNumber);
    if (this.processedTicks.has(f)) {
      this.telemetry.duplicateTicks++;
      this.emit('SwitchFailed', { reason: 'duplicate tick' });
      return undefined;
    }
    this.processedTicks.add(f);
    this.lastFrame = f;
    if (!this.active) {
      const next = this.queue.dequeue(tick.actualTimeNs);
      if (next) this.active = this.prepare(next);
    }
    if (!this.active) return undefined;
    const tx = this.active;
    this.emit('SwitchCommitStarted', { transactionId: tx.transactionId });
    const before = this.program;
    const target = this.preview;
    if (!target) {
      this.active = null;
      return this.fail(tx, 'SceneSwitchSceneNotFound', 'missing target');
    }
    this.previous = before;
    this.program = target;
    this.pg++;
    this.sg++;
    const pol =
      (tx.safeMetadata.previewAfterCutPolicy as PreviewAfterCutPolicy | undefined) ??
      'SWAP_WITH_PREVIOUS_PROGRAM';
    if (pol === 'SWAP_WITH_PREVIOUS_PROGRAM') this.preview = before;
    else if (pol === 'CLEAR_PREVIEW') this.preview = null;
    else if (pol === 'FOLLOW_PROGRAM') this.preview = this.program;
    this.vg++;
    this.telemetry.commits++;
    this.telemetry.programUpdates++;
    this.telemetry.previewUpdates++;
    if (tx.mode === 'CUT') this.telemetry.cutCompletions++;
    if (tx.mode === 'TAKE') this.telemetry.takeCompletions++;
    const res = this.result(
      { requestId: tx.requestId, mode: tx.mode } as SceneSwitchRequestSnapshot,
      'COMPLETED',
      tx,
      [],
    );
    this.results.push(res);
    while (this.results.length > 128) this.results.shift();
    this.emit('ProgramSceneChanged', { sceneId: this.program.sceneId });
    this.emit('SwitchCommitted', { transactionId: tx.transactionId });
    this.emit('SwitchCompleted', { transactionId: tx.transactionId });
    this.active = null;
    return res;
  }
  cancel(requestOrTransactionId: string) {
    if (
      this.active &&
      (this.active.requestId === requestOrTransactionId ||
        this.active.transactionId === requestOrTransactionId)
    ) {
      this.active = freeze({
        ...this.active,
        state: 'CANCELLED',
        completedAtNs: String(this.now()),
      });
      this.telemetry.cancellations++;
      const res = this.result(
        { requestId: this.active.requestId, mode: this.active.mode } as SceneSwitchRequestSnapshot,
        'CANCELLED',
        this.active,
        [],
      );
      this.active = null;
      this.emit('SwitchCancelled', { id: requestOrTransactionId });
      return res;
    }
    if (this.queue.cancel(requestOrTransactionId)) {
      this.telemetry.cancellations++;
      this.emit('SwitchCancelled', { id: requestOrTransactionId });
      return true;
    }
    throw createSceneSwitchingError('SceneSwitchTransactionNotFound', 'not found');
  }
  private fail(tx: SceneSwitchTransactionSnapshot, code: string, msg: string) {
    this.telemetry.rejectedRequests++;
    this.emit('SwitchFailed', { code, msg });
    const res = this.result(
      { requestId: tx.requestId, mode: tx.mode } as SceneSwitchRequestSnapshot,
      'FAILED',
      tx,
      [msg],
    );
    this.results.push(res);
    return res;
  }
  private result(
    r: SceneSwitchRequestSnapshot,
    status: SceneSwitchResultStatus,
    tx: SceneSwitchTransactionSnapshot | null,
    warnings: readonly string[],
  ): SceneSwitchResultSnapshot {
    return freeze({
      requestId: r.requestId,
      transactionId: tx?.transactionId ?? '',
      status,
      mode: r.mode,
      previousProgramScene: this.previous?.sceneId ?? null,
      newProgramScene: this.program?.sceneId ?? null,
      newPreviewScene: this.preview?.sceneId ?? null,
      programGeneration: this.pg,
      previewGeneration: this.vg,
      switchGeneration: this.sg,
      committedRuntimeFrame: status === 'COMPLETED' ? this.lastFrame : undefined,
      transitionMetadata: tx?.requestedTransitionMetadata ?? {},
      transitionAnimationApplied: false,
      rollbackApplied: false,
      warnings,
      durationNs: '0',
      completedAtNs: String(this.now()),
    });
  }
  private bus(role: SceneBusRole): SceneBusSnapshot {
    const scene =
      role === 'PROGRAM' ? this.program : role === 'PREVIEW' ? this.preview : this.previous;
    return freeze({
      busId: `bus:${role.toLowerCase()}`,
      role,
      scene,
      busGeneration: role === 'PROGRAM' ? this.pg : this.vg,
      switchGeneration: this.sg,
      runtimeFrameNumber: this.lastFrame,
      readiness: scene?.readiness.state ?? 'UNKNOWN',
      health:
        scene?.healthState === 'FAILED'
          ? 'FAILED'
          : scene?.healthState === 'DEGRADED'
            ? 'DEGRADED'
            : 'HEALTHY',
      outputProfile: scene?.outputProfile ?? 'none',
      lastTransactionId: this.active?.transactionId,
      updatedAtNs: String(this.now()),
      safeMetadata: { writableStorageAlias: false },
    });
  }
  getHealth(): SceneSwitchingHealthSnapshot {
    return freeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: 'HEALTHY',
      programSceneId: this.program?.sceneId ?? null,
      previewSceneId: this.preview?.sceneId ?? null,
      previousProgramSceneId: this.previous?.sceneId ?? null,
      programGeneration: this.pg,
      previewGeneration: this.vg,
      switchGeneration: this.sg,
      activeTransactionCount: this.active ? 1 : 0,
      queuedRequestCount: this.queue.snapshot().size,
      completedSwitchCount: this.telemetry.commits,
      cutCount: this.telemetry.cutCompletions,
      takeCount: this.telemetry.takeCompletions,
      rejectedCount: this.telemetry.rejectedRequests,
      failedCount: 0,
      cancelledCount: this.telemetry.cancellations,
      rollbackCount: this.telemetry.rollbacks,
      duplicateRequestCount: this.telemetry.duplicateRequests,
      duplicateTickCount: this.telemetry.duplicateTicks,
      staleGenerationRejectionCount: this.telemetry.staleGenerationRejects,
      programLockState: this.lock,
      programReadiness: this.program?.readiness.state ?? 'UNKNOWN',
      previewReadiness: this.preview?.readiness.state ?? 'UNKNOWN',
      queuePressure: this.queue.snapshot().size / this.queue.capacity,
      lastSuccessfulSwitch: this.results.at(-1)?.transactionId,
      lastFailure: undefined,
      updatedAtNs: String(this.now()),
    });
  }
  getTelemetry(): SceneSwitchingTelemetrySnapshot {
    return freeze({
      previewSelections: this.telemetry.previewSelections,
      previewClears: this.telemetry.previewClears,
      switchRequests: this.telemetry.switchRequests,
      cutRequests: this.telemetry.cutRequests,
      cutCompletions: this.telemetry.cutCompletions,
      takeRequests: this.telemetry.takeRequests,
      takeCompletions: this.telemetry.takeCompletions,
      queuedRequests: this.telemetry.queuedRequests,
      replacedRequests: this.telemetry.replacedRequests,
      rejectedRequests: this.telemetry.rejectedRequests,
      commits: this.telemetry.commits,
      rollbacks: this.telemetry.rollbacks,
      cancellations: this.telemetry.cancellations,
      sameSceneRejects: this.telemetry.sameSceneRejects,
      readinessRejects: this.telemetry.readinessRejects,
      lockRejects: this.telemetry.lockRejects,
      duplicateRequests: this.telemetry.duplicateRequests,
      duplicateTicks: this.telemetry.duplicateTicks,
      staleGenerationRejects: this.telemetry.staleGenerationRejects,
      programUpdates: this.telemetry.programUpdates,
      previewUpdates: this.telemetry.previewUpdates,
      lastSwitchingEvent: this.telemetry.lastSwitchingEvent,
      queueHighWaterMark: this.queue.highWaterMark,
      averageValidationDurationNs: '0',
      maximumValidationDurationNs: '0',
      averageCommitDurationNs: '0',
      maximumCommitDurationNs: '0',
      currentTransactionId: this.active?.transactionId,
      queuedRequestIds: this.queue.snapshot().requestIds,
      healthSummary: this.getHealth().healthState,
    });
  }
  getSnapshot(): SceneSwitchingEngineSnapshot {
    return freeze({
      program: this.bus('PROGRAM'),
      preview: this.bus('PREVIEW'),
      previousProgram: this.bus('AUXILIARY'),
      activeTransaction: this.active,
      queue: this.queue.snapshot(),
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
      recentResults: this.results,
      sourceGraphMetadata: {
        programSceneId: this.program?.sceneId ?? null,
        previewSceneId: this.preview?.sceneId ?? null,
        previousProgramSceneId: this.previous?.sceneId ?? null,
        programGeneration: this.pg,
        previewGeneration: this.vg,
        switchGeneration: this.sg,
        activeTransactionId: this.active?.transactionId ?? null,
        switchMode: this.active?.mode ?? null,
        lockState: this.lock,
        queueDepth: this.queue.snapshot().size,
        lastCommittedRuntimeFrame: this.lastFrame,
        switchingHealth: this.getHealth().healthState,
        routingEligibility: this.preview?.readiness.state === 'READY',
      },
    });
  }
  assertInvariants() {
    const s = this.getSnapshot();
    if (s.program.busId === s.preview.busId)
      throw createSceneSwitchingError('SceneSwitchInvariantViolation', 'bus id collision');
    if (this.queue.snapshot().size > this.queue.capacity)
      throw createSceneSwitchingError('SceneSwitchInvariantViolation', 'unbounded queue');
    if (this.shutdownFlag && (this.active || this.queue.snapshot().size))
      throw createSceneSwitchingError('SceneSwitchInvariantViolation', 'shutdown leak');
    return true;
  }
  shutdown() {
    this.active = null;
    this.queue.clear();
    this.shutdownFlag = true;
    this.emit('SwitchingEngineShutdown', {});
    this.assertInvariants();
  }
  private guard(throwOnShutdown = true) {
    if (this.shutdownFlag && throwOnShutdown)
      throw createSceneSwitchingError('SceneSwitchingEngineNotReady', 'shutdown');
  }
  private reject(code: string, msg: string, stale = false) {
    if (stale) this.telemetry.staleGenerationRejects++;
    this.telemetry.rejectedRequests++;
    return createSceneSwitchingError(code, msg);
  }
}
export class SceneSwitchingProcessor implements TickProcessor {
  readonly id = 'scene-switching-processor';
  readonly order = 450;
  constructor(readonly controller: SceneSwitchingController) {}
  initialize() {}
  processTick(
    tick: FrameTick,
    context?: RuntimeContext | ProcessorRuntimeContext,
  ): ProcessorTickResult<SceneSwitchResultSnapshot | undefined> {
    const result = this.controller.processFrameTick(tick);
    context &&
      'outputs' in context &&
      context.outputs.publish(
        this.id,
        SCENE_SWITCHING_OUTPUT_KEYS.programBusSnapshot,
        this.controller.getSnapshot().program,
        'OWNED_BY_RUNTIME',
      );
    context &&
      'outputs' in context &&
      context.outputs.publish(
        this.id,
        SCENE_SWITCHING_OUTPUT_KEYS.previewBusSnapshot,
        this.controller.getSnapshot().preview,
        'OWNED_BY_RUNTIME',
      );
    if (result)
      context &&
        'outputs' in context &&
        context.outputs.publish(
          this.id,
          SCENE_SWITCHING_OUTPUT_KEYS.switchResult,
          result,
          'OWNED_BY_RUNTIME',
        );
    return { status: 'SUCCEEDED', value: result, metadata: { transitionAnimationApplied: false } };
  }
  shutdown() {
    this.controller.shutdown();
    return { status: 'STOPPED' as const };
  }
}
export const createSceneSwitchReference = (
  input: Partial<SceneSwitchReference> & { sceneId: string },
): SceneSwitchReference =>
  freeze({
    sceneId: input.sceneId,
    sceneVersion: String(input.sceneVersion ?? '1'),
    sceneGeneration: input.sceneGeneration ?? 1,
    sceneInstanceId: input.sceneInstanceId ?? `${input.sceneId}:instance`,
    sceneInstanceGeneration: input.sceneInstanceGeneration ?? 1,
    outputProfile: input.outputProfile ?? 'default',
    readiness: input.readiness ?? {
      state: 'READY',
      dependencySummary: [],
      generation: 1,
      updatedAtNs: '0',
      safeMetadata: {},
    },
    healthState: input.healthState ?? 'HEALTHY',
    sourceDependencySummary: input.sourceDependencySummary ?? [],
    compositorPlanGeneration: input.compositorPlanGeneration ?? 1,
    safeMetadata: safe(input.safeMetadata ?? {}) as Record<string, Json>,
  });
export const createSceneSwitchingController = (init?: {
  programScene?: SceneSwitchReference;
  previewScene?: SceneSwitchReference;
  queueCapacity?: number;
}) => new SceneSwitchingController(init);
export const createSceneSwitchingCommandHandlers = (controller: SceneSwitchingController) =>
  Object.fromEntries(
    SCENE_SWITCHING_COMMAND_TYPES.map((type) => [
      type,
      (cmd: { payload?: Record<string, unknown>; id?: string }) => {
        const p = cmd.payload ?? {};
        if (type === 'SWITCH_SET_PREVIEW_SCENE')
          return controller.setPreviewScene(String(p.sceneId), Number(p.expectedPreviewGeneration));
        if (type === 'SWITCH_CLEAR_PREVIEW') return controller.clearPreview();
        if (type === 'SWITCH_CUT')
          return controller.requestSwitch({
            ...p,
            mode: 'CUT',
            ...(cmd.id ? { commandId: cmd.id } : {}),
          });
        if (type === 'SWITCH_TAKE')
          return controller.requestSwitch({
            ...p,
            mode: 'TAKE',
            ...(cmd.id ? { commandId: cmd.id } : {}),
          });
        if (type === 'SWITCH_CANCEL')
          return controller.cancel(String(p.requestId ?? p.transactionId));
        if (type === 'SWITCH_LOCK_PROGRAM') return controller.lockProgram();
        if (type === 'SWITCH_UNLOCK_PROGRAM') return controller.unlockProgram();
        if (type === 'SWITCH_ARM_PROGRAM') return controller.armProgram();
        if (type === 'SWITCH_EMERGENCY_OVERRIDE') return controller.emergencyOverride();
        if (type === 'SWITCH_SHUTDOWN') return controller.shutdown();
        if (type === 'SWITCH_VALIDATE')
          return controller.validate(p as unknown as SceneSwitchRequestSnapshot);
        return controller.getSnapshot();
      },
    ]),
  );
