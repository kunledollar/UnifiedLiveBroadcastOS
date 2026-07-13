/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type ProcessorTickResult,
  type RuntimeCommand,
  type RuntimeCommandHandler,
  type RuntimeContext,
  type TickProcessor,
} from './execution-engine.js';

type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const SECRET =
  /token|secret|password|credential|cookie|url|endpoint|device|handle|native|pixel|pcm|lease|gpu|path/i;
const MAX = {
  presets: 256,
  macros: 128,
  steps: 64,
  history: 256,
  metadataKeys: 64,
  metadataDepth: 5,
  waitFrames: 10000,
  retries: 5,
  planCache: 256,
} as const;
const clone = <T>(v: T): T => structuredClone(v);
export const sanitizePresetMacroMetadata = (v: unknown, d = 0): Json => {
  if (d > MAX.metadataDepth) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v as null | boolean;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => sanitizePresetMacroMetadata(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, MAX.metadataKeys)
        .map(([k, x]) => [
          k,
          SECRET.test(k) ? '[REDACTED]' : sanitizePresetMacroMetadata(x, d + 1),
        ]),
    );
  return String(v);
};
const freeze = <T>(v: T): Readonly<T> => Object.freeze(clone(v));
const unique = <T>(a: readonly T[]) => new Set(a).size === a.length;
const sid = (p: string, n: number) => `${p}:${String(n).padStart(6, '0')}`;

export const PRODUCTION_PRESET_TYPES = [
  'SCENE_PRESET',
  'PROGRAM_PRESET',
  'PREVIEW_PRESET',
  'TRANSITION_PRESET',
  'AUDIO_ROUTE_PRESET',
  'PIP_LAYOUT_PRESET',
  'EFFECT_CHAIN_PRESET',
  'OUTPUT_ROLE_PRESET',
  'AUX_PRESET',
  'CLEAN_FEED_PRESET',
  'TALLY_OVERRIDE_PRESET',
  'OPERATOR_CONTROL_PRESET',
  'PRODUCTION_STATE_PRESET',
  'CUSTOM_TYPED_PRESET',
] as const;
export type ProductionPresetType = (typeof PRODUCTION_PRESET_TYPES)[number];
export const PRESET_TARGET_SCOPES = [
  'GLOBAL',
  'WORKSPACE',
  'PROGRAM',
  'PREVIEW',
  'SCENE',
  'SCENE_INSTANCE',
  'SOURCE',
  'PIP_INSTANCE',
  'EFFECT_CHAIN_INSTANCE',
  'AUDIO_ROUTE',
  'OUTPUT_ROLE',
  'AUX_OUTPUT',
  'TALLY_ENTITY',
  'OPERATOR_SESSION',
  'CUSTOM',
] as const;
export type PresetTargetScope = (typeof PRESET_TARGET_SCOPES)[number];
export const PRESET_RECALL_MODES = [
  'APPLY_AT_NEXT_TICK',
  'APPLY_IMMEDIATELY_AT_TICK',
  'APPLY_TO_PREVIEW_ONLY',
  'APPLY_TO_PROGRAM_WITH_CONFIRMATION',
  'STAGE_ONLY',
  'VALIDATE_ONLY',
  'DRY_RUN',
  'REHEARSAL',
  'CUSTOM',
] as const;
export type PresetRecallMode = (typeof PRESET_RECALL_MODES)[number];
export type PresetRecallStatus =
  | 'VALIDATED'
  | 'STAGED'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'CANCELLED'
  | 'ROLLED_BACK'
  | 'FAILED'
  | 'REJECTED';
export const OPERATOR_MACRO_STEP_TYPES = [
  'SELECT_PREVIEW_SCENE',
  'CUT',
  'TAKE',
  'AUTO',
  'CANCEL_TRANSITION',
  'SET_TRANSITION',
  'SET_TRANSITION_DURATION',
  'SET_AUDIO_FOLLOW_MODE',
  'MUTE_PROGRAM_AUDIO',
  'UNMUTE_PROGRAM_AUDIO',
  'SET_PIP_LAYOUT',
  'APPLY_EFFECT_PRESET',
  'ENABLE_OUTPUT_ROLE',
  'DISABLE_OUTPUT_ROLE',
  'SET_AUX_SCENE',
  'APPLY_CLEAN_FEED_PRESET',
  'SET_TALLY_OVERRIDE',
  'CLEAR_TALLY_OVERRIDE',
  'LOCK_PROGRAM',
  'UNLOCK_PROGRAM',
  'ARM_PROGRAM',
  'DISARM_PROGRAM',
  'WAIT_FRAME_COUNT',
  'WAIT_FOR_SCENE_READY',
  'WAIT_FOR_TRANSITION_COMPLETE',
  'WAIT_FOR_AUDIO_ROUTE',
  'WAIT_FOR_OUTPUT_READY',
  'BARRIER',
  'APPLY_PRESET',
  'CUSTOM_TYPED_STEP',
] as const;
export type OperatorMacroStepType = (typeof OPERATOR_MACRO_STEP_TYPES)[number];
export const OPERATOR_MACRO_CONDITIONS = [
  'ALWAYS',
  'NEVER',
  'PROGRAM_SCENE_EQUALS',
  'PREVIEW_SCENE_EQUALS',
  'SOURCE_AVAILABLE',
  'SOURCE_READY',
  'SCENE_READY',
  'TRANSITION_IDLE',
  'TRANSITION_ACTIVE',
  'AUDIO_ROUTE_READY',
  'OUTPUT_ROLE_READY',
  'PROGRAM_LOCKED',
  'PROGRAM_UNLOCKED',
  'PROGRAM_ARMED',
  'TALLY_STATE_EQUALS',
  'FRAME_NUMBER_AT_OR_AFTER',
  'EXPLICIT_BOOLEAN_PARAMETER',
  'CUSTOM_TYPED_CONDITION',
] as const;
export type OperatorMacroConditionType = (typeof OPERATOR_MACRO_CONDITIONS)[number];
export type MacroExecutionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'WAITING'
  | 'PAUSED'
  | 'COMPLETING'
  | 'COMPLETED'
  | 'CANCELLING'
  | 'CANCELLED'
  | 'ROLLING_BACK'
  | 'ROLLED_BACK'
  | 'FAILED'
  | 'DESTROYED';
export type MacroExecutionPolicy =
  'ONE_STEP_PER_TICK' | 'ALL_READY_NON_CONFLICTING_STEPS' | 'SEQUENTIAL_UNTIL_WAIT' | 'CUSTOM';
export type MacroFailurePolicy =
  | 'FAIL_MACRO'
  | 'STOP_AT_FAILED_STEP'
  | 'SKIP_OPTIONAL_STEP'
  | 'CONTINUE_DEGRADED'
  | 'ROLLBACK_COMPLETED_STEPS'
  | 'PRESERVE_PROGRAM'
  | 'EMERGENCY_CUT_TO_SAFE_SCENE'
  | 'REQUEST_OPERATOR_INTERVENTION'
  | 'CUSTOM';
export type MacroStepFailurePolicy =
  | 'INHERIT_MACRO'
  | 'FAIL_MACRO'
  | 'SKIP_IF_OPTIONAL'
  | 'RETRY_BOUNDED'
  | 'CONTINUE_DEGRADED'
  | 'EXECUTE_ROLLBACK_STEP'
  | 'REQUEST_OPERATOR_INTERVENTION';

export interface PresetMacroGenerationMap {
  readonly controller?: number;
  readonly program?: number;
  readonly preview?: number;
  readonly switch?: number;
  readonly transition?: number;
  readonly audio?: number;
  readonly bus?: number;
  readonly tally?: number;
  readonly scene?: number;
  readonly target?: number;
}
export interface ProductionPresetDefinition {
  readonly presetId: string;
  readonly presetVersion: string;
  readonly presetGeneration: number;
  readonly displayName: string;
  readonly presetType: ProductionPresetType;
  readonly description?: string;
  readonly targetScope: PresetTargetScope;
  readonly targetBindings: Readonly<Record<string, Json>>;
  readonly expectedSubsystemGenerations: PresetMacroGenerationMap;
  readonly requiredDependencies: readonly string[];
  readonly optionalDependencies: readonly string[];
  readonly parameterValues: Readonly<Record<string, Json>>;
  readonly commandTemplateRefs: readonly string[];
  readonly recallPolicy: string;
  readonly failurePolicy: MacroFailurePolicy;
  readonly rollbackPolicy: string;
  readonly safetyPolicy: Readonly<Record<string, Json>>;
  readonly rehearsalEligible: boolean;
  readonly operatorConfirmationRequirements: readonly string[];
  readonly tags: readonly string[];
  readonly safeMetadata: Readonly<Record<string, Json>>;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
}
export type ProductionPresetDefinitionSnapshot = ProductionPresetDefinition;
export interface PresetRecallRequest {
  readonly requestId: string;
  readonly commandId: string;
  readonly presetId: string;
  readonly expectedPresetGeneration: number;
  readonly targetScope: PresetTargetScope;
  readonly targetIds: readonly string[];
  readonly expectedSubsystemGenerations: PresetMacroGenerationMap;
  readonly runtimeFrame: string;
  readonly mode: PresetRecallMode;
  readonly dryRun: boolean;
  readonly rehearsal: boolean;
  readonly armedRequired: boolean;
  readonly programLockRequired: boolean;
  readonly deadlineNs?: string;
  readonly cancellationRef?: string;
  readonly correlationId?: string;
  readonly operatorRef?: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type PresetRecallRequestSnapshot = PresetRecallRequest;
export interface PresetRecallPlan {
  readonly planId: string;
  readonly presetId: string;
  readonly presetVersion: string;
  readonly presetGeneration: number;
  readonly requestId: string;
  readonly runtimeFrame: string;
  readonly targetScope: PresetTargetScope;
  readonly resolvedTargetBindings: Readonly<Record<string, Json>>;
  readonly orderedCommandTemplates: readonly string[];
  readonly resolvedCommandPayloadSummaries: readonly Json[];
  readonly expectedSubsystemGenerations: PresetMacroGenerationMap;
  readonly requiredSafetyChecks: readonly string[];
  readonly validationResults: readonly string[];
  readonly estimatedStepCount: number;
  readonly estimatedDurationMetadata: Readonly<Record<string, Json>>;
  readonly rollbackAvailable: boolean;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type PresetRecallPlanSnapshot = PresetRecallPlan;
export interface PresetRecallResult {
  readonly requestId: string;
  readonly planId: string;
  readonly presetId: string;
  readonly status: PresetRecallStatus;
  readonly targetScope: PresetTargetScope;
  readonly delegatedCommandIds: readonly string[];
  readonly delegatedSubsystemResults: readonly Json[];
  readonly appliedStateSummaries: readonly Json[];
  readonly programMutationAttempted: boolean;
  readonly programMutationCommitted: boolean;
  readonly dryRun: boolean;
  readonly rehearsal: boolean;
  readonly rollbackApplied: boolean;
  readonly warnings: readonly string[];
  readonly failureReason: string | undefined;
  readonly completedRuntimeFrame: string;
  readonly completedAtNs: string;
}
export type PresetRecallResultSnapshot = PresetRecallResult;
export interface OperatorMacroCondition {
  readonly conditionType: OperatorMacroConditionType;
  readonly expectedValue?: Json;
  readonly targetId?: string;
  readonly parameterKey?: string;
}
export interface OperatorMacroStep {
  readonly stepId: string;
  readonly stepType: OperatorMacroStepType;
  readonly stepIndex: number;
  readonly dependencies: readonly string[];
  readonly condition: OperatorMacroCondition;
  readonly targetRefs: Readonly<Record<string, string>>;
  readonly expectedGenerations: PresetMacroGenerationMap;
  readonly parameterBindings: Readonly<Record<string, Json>>;
  readonly timeoutFrames: number;
  readonly retryPolicy: { readonly maxRetries: number; readonly retryDelayFrames: number };
  readonly failurePolicy: MacroStepFailurePolicy;
  readonly rollbackStepRef?: string;
  readonly critical: boolean;
  readonly enabled: boolean;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type OperatorMacroStepSnapshot = OperatorMacroStep;
export interface OperatorMacroDefinition {
  readonly macroId: string;
  readonly macroVersion: string;
  readonly macroGeneration: number;
  readonly displayName: string;
  readonly description?: string;
  readonly orderedSteps: readonly OperatorMacroStep[];
  readonly dependencyGraph: Readonly<Record<string, readonly string[]>>;
  readonly executionPolicy: MacroExecutionPolicy;
  readonly failurePolicy: MacroFailurePolicy;
  readonly rollbackPolicy: string;
  readonly safetyPolicy: Readonly<Record<string, Json>>;
  readonly timingPolicy: string;
  readonly maximumDurationFrames: number;
  readonly requiredCommandMode: string;
  readonly armedRequired: boolean;
  readonly programLockRequired: boolean;
  readonly rehearsalEligible: boolean;
  readonly tags: readonly string[];
  readonly safeMetadata: Readonly<Record<string, Json>>;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
}
export type OperatorMacroDefinitionSnapshot = OperatorMacroDefinition;
export interface OperatorMacroExecutionRequest {
  readonly requestId: string;
  readonly commandId: string;
  readonly macroId: string;
  readonly expectedMacroGeneration: number;
  readonly expectedControllerGeneration?: number;
  readonly expectedProgramGeneration?: number;
  readonly expectedPreviewGeneration?: number;
  readonly expectedSwitchGeneration?: number;
  readonly expectedTransitionGeneration?: number;
  readonly expectedAudioGeneration?: number;
  readonly expectedBusGeneration?: number;
  readonly expectedTallyGeneration?: number;
  readonly startRuntimeFrame: string;
  readonly dryRun: boolean;
  readonly rehearsal: boolean;
  readonly armedConfirmation: boolean;
  readonly programLockConfirmationMetadata?: Readonly<Record<string, Json>>;
  readonly deadlineFrame?: string;
  readonly cancellationRef?: string;
  readonly correlationId?: string;
  readonly operatorRef?: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type OperatorMacroExecutionRequestSnapshot = OperatorMacroExecutionRequest;
export interface OperatorMacroExecutionPlan {
  readonly planId: string;
  readonly macroId: string;
  readonly macroVersion: string;
  readonly macroGeneration: number;
  readonly requestId: string;
  readonly runtimeFrame: string;
  readonly orderedStepList: readonly OperatorMacroStep[];
  readonly dependencyGraphSummary: readonly string[];
  readonly conditionResults: Readonly<Record<string, boolean>>;
  readonly skippedSteps: readonly string[];
  readonly disabledSteps: readonly string[];
  readonly safetyChecks: readonly string[];
  readonly programMutatingSteps: readonly string[];
  readonly rollbackCapableSteps: readonly string[];
  readonly totalMaximumFrames: number;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type OperatorMacroExecutionPlanSnapshot = OperatorMacroExecutionPlan;
export interface OperatorMacroExecutionInstance {
  readonly instanceId: string;
  readonly requestId: string;
  readonly macroId: string;
  readonly macroVersion: string;
  readonly macroGeneration: number;
  readonly instanceGeneration: number;
  readonly state: MacroExecutionState;
  readonly startRuntimeFrame: string;
  readonly currentRuntimeFrame: string;
  readonly currentStepId: string | undefined;
  readonly completedStepIds: readonly string[];
  readonly skippedStepIds: readonly string[];
  readonly failedStepId: string | undefined;
  readonly delegatedCommandIds: readonly string[];
  readonly rollbackStepIds: readonly string[];
  readonly cancellationState: string;
  readonly health: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type OperatorMacroExecutionInstanceSnapshot = OperatorMacroExecutionInstance;
export interface OperatorMacroStepResultSnapshot {
  readonly stepId: string;
  readonly status: 'COMPLETED' | 'SKIPPED' | 'FAILED' | 'WAITING' | 'RETRIED';
  readonly delegatedCommandId: string | undefined;
  readonly attempts: number;
  readonly completedFrame: string;
  readonly failureReason: string | undefined;
}
export interface OperatorMacroExecutionResultSnapshot {
  readonly requestId: string;
  readonly instanceId: string;
  readonly macroId: string;
  readonly status: MacroExecutionState;
  readonly delegatedCommandIds: readonly string[];
  readonly stepResults: readonly OperatorMacroStepResultSnapshot[];
  readonly dryRun: boolean;
  readonly rehearsal: boolean;
  readonly rollbackApplied: boolean;
  readonly failureReason: string | undefined;
  readonly completedRuntimeFrame: string;
  readonly completedAtNs: string;
}
export interface PresetMacroAuditSnapshot {
  readonly auditId: string;
  readonly requestId: string;
  readonly kind: 'PRESET' | 'MACRO' | 'PROGRAM_MUTATION' | 'EMERGENCY';
  readonly event: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
  readonly createdAtNs: string;
}
export interface PresetMacroHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly registeredPresetCount: number;
  readonly registeredMacroCount: number;
  readonly activeRecallCount: number;
  readonly activeMacroCount: number;
  readonly completedRecallCount: number;
  readonly completedMacroCount: number;
  readonly stagedCount: number;
  readonly dryRunCount: number;
  readonly rehearsalCount: number;
  readonly cancelledCount: number;
  readonly rollbackCount: number;
  readonly failedCount: number;
  readonly rejectedCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateTickCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly programLockRejectionCount: number;
  readonly unarmedRejectionCount: number;
  readonly missingDependencyCount: number;
  readonly stepExecutionCount: number;
  readonly stepFailureCount: number;
  readonly retryCount: number;
  readonly waitingStepCount: number;
  readonly planCacheSize: number;
  readonly activeRequestIds: readonly string[];
  readonly activeMacroInstanceIds: readonly string[];
  readonly lastSuccess: string | undefined;
  readonly lastFailure: string | undefined;
  readonly updatedAtNs: string;
}
export interface PresetMacroTelemetrySnapshot {
  readonly counters: Readonly<Record<string, number>>;
  readonly currentRequestIds: readonly string[];
  readonly activeMacroIds: readonly string[];
  readonly lastEvent: string | undefined;
  readonly healthSummary: string;
}
export interface PresetMacroValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly deterministicScore: number;
}
export interface PresetMacroEngineSnapshot {
  readonly presets: readonly ProductionPresetDefinitionSnapshot[];
  readonly macros: readonly OperatorMacroDefinitionSnapshot[];
  readonly activeRecalls: readonly PresetRecallRequestSnapshot[];
  readonly activeMacroInstances: readonly OperatorMacroExecutionInstanceSnapshot[];
  readonly recentPresetResults: readonly PresetRecallResultSnapshot[];
  readonly recentMacroResults: readonly OperatorMacroExecutionResultSnapshot[];
  readonly audit: readonly PresetMacroAuditSnapshot[];
  readonly health: PresetMacroHealthSnapshot;
  readonly telemetry: PresetMacroTelemetrySnapshot;
  readonly validation: PresetMacroValidationReport;
  readonly sourceGraphMetadata: Readonly<Record<string, Json>>;
}

export const PRESET_MACRO_OUTPUT_KEYS = freeze({
  presetDefinitions: 'preset-macro.presets',
  macroDefinitions: 'preset-macro.macros',
  activePresetRecall: 'preset-macro.active-recall',
  activeMacroInstance: 'preset-macro.active-macro',
  presetRecallRequest: 'preset-macro.preset-request',
  presetRecallPlan: 'preset-macro.preset-plan',
  presetRecallResult: 'preset-macro.preset-result',
  macroExecutionRequest: 'preset-macro.macro-request',
  macroExecutionPlan: 'preset-macro.macro-plan',
  macroExecutionResult: 'preset-macro.macro-result',
  macroStepResults: 'preset-macro.step-results',
  completedFailedMacroSummaries: 'preset-macro.completed-failed',
  health: 'preset-macro.health',
  telemetry: 'preset-macro.telemetry',
  validationReports: 'preset-macro.validation',
  auditSummaries: 'preset-macro.audit',
});
export const PRESET_MACRO_COMMAND_TYPES = [
  'PRESET_REGISTER',
  'PRESET_UPDATE',
  'PRESET_UNREGISTER',
  'PRESET_VALIDATE',
  'PRESET_RECALL',
  'PRESET_STAGE',
  'PRESET_DRY_RUN',
  'PRESET_CANCEL',
  'MACRO_REGISTER',
  'MACRO_UPDATE',
  'MACRO_UNREGISTER',
  'MACRO_VALIDATE',
  'MACRO_EXECUTE',
  'MACRO_DRY_RUN',
  'MACRO_REHEARSE',
  'MACRO_PAUSE',
  'MACRO_RESUME',
  'MACRO_CANCEL',
  'MACRO_ROLLBACK',
  'MACRO_SET_FAILURE_POLICY',
  'MACRO_CLEAR_PLAN_CACHE',
  'PRESET_MACRO_SHUTDOWN',
] as const;
export type PresetMacroCommandType = (typeof PRESET_MACRO_COMMAND_TYPES)[number];
export const PRESET_MACRO_EVENTS = [
  'PresetMacroEngineCreated',
  'PresetRegistered',
  'PresetUpdated',
  'PresetUnregistered',
  'PresetRecallRequested',
  'PresetRecallValidated',
  'PresetRecallStaged',
  'PresetRecallCompleted',
  'PresetRecallCancelled',
  'PresetRecallFailed',
  'MacroRegistered',
  'MacroUpdated',
  'MacroUnregistered',
  'MacroExecutionRequested',
  'MacroExecutionValidated',
  'MacroExecutionScheduled',
  'MacroExecutionStarted',
  'MacroStepStarted',
  'MacroStepCompleted',
  'MacroStepSkipped',
  'MacroStepWaiting',
  'MacroStepRetried',
  'MacroStepFailed',
  'MacroPaused',
  'MacroResumed',
  'MacroCancelled',
  'MacroRollbackStarted',
  'MacroRolledBack',
  'MacroCompleted',
  'MacroFailed',
  'ProgramSafetyViolation',
  'PresetMacroHealthChanged',
  'PresetMacroEngineShutdown',
] as const;
export const PRESET_MACRO_WATCHDOG_INCIDENTS = [
  'PRESET_MACRO_ENGINE_STALLED',
  'PRESET_RECALL_TIMEOUT',
  'MACRO_EXECUTION_TIMEOUT',
  'PRESET_DUPLICATE_REQUEST',
  'MACRO_DUPLICATE_REQUEST',
  'MACRO_DUPLICATE_TICK',
  'PRESET_GENERATION_STALE',
  'MACRO_GENERATION_STALE',
  'MACRO_SUBSYSTEM_GENERATION_STALE',
  'PRESET_DEPENDENCY_MISSING',
  'MACRO_DEPENDENCY_MISSING',
  'MACRO_GRAPH_CYCLE',
  'MACRO_PROGRAM_LOCK_VIOLATION',
  'MACRO_UNARMED_CRITICAL_COMMAND',
  'MACRO_STEP_FAILED',
  'MACRO_RETRY_EXHAUSTED',
  'MACRO_WAIT_TIMEOUT',
  'MACRO_ROLLBACK_FAILED',
  'MACRO_COMMAND_RESULT_MISMATCH',
  'MACRO_OUTPUT_REGISTRY_MISMATCH',
  'MACRO_INVARIANT_FAILURE',
] as const;

export class PresetMacroError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(code, message, sanitizePresetMacroMetadata(details) as Record<string, unknown>);
  }
}
export const createPresetMacroError = (
  code: string,
  message: string,
  details: Record<string, unknown> = {},
) => new PresetMacroError(code, message, details);

const programSteps = new Set<OperatorMacroStepType>([
  'CUT',
  'TAKE',
  'AUTO',
  'MUTE_PROGRAM_AUDIO',
  'UNMUTE_PROGRAM_AUDIO',
  'LOCK_PROGRAM',
  'UNLOCK_PROGRAM',
  'ARM_PROGRAM',
  'DISARM_PROGRAM',
]);
const waitSteps = new Set<OperatorMacroStepType>([
  'WAIT_FRAME_COUNT',
  'WAIT_FOR_SCENE_READY',
  'WAIT_FOR_TRANSITION_COMPLETE',
  'WAIT_FOR_AUDIO_ROUTE',
  'WAIT_FOR_OUTPUT_READY',
  'BARRIER',
]);
const commandForStep = (s: OperatorMacroStep): string =>
  (
    ({
      SELECT_PREVIEW_SCENE: 'SWITCH_SET_PREVIEW_SCENE',
      CUT: 'SWITCH_CUT',
      TAKE: 'SWITCH_TAKE',
      AUTO: 'TRANSITION_AUTO',
      CANCEL_TRANSITION: 'TRANSITION_CANCEL',
      SET_TRANSITION: 'SWITCH_SET_TRANSITION_METADATA',
      SET_TRANSITION_DURATION: 'TRANSITION_SET_DURATION',
      SET_AUDIO_FOLLOW_MODE: 'AUDIO_SET_FOLLOW_MODE',
      MUTE_PROGRAM_AUDIO: 'AUDIO_MUTE_PROGRAM',
      UNMUTE_PROGRAM_AUDIO: 'AUDIO_UNMUTE_PROGRAM',
      SET_PIP_LAYOUT: 'PIP_APPLY_LAYOUT',
      APPLY_EFFECT_PRESET: 'EFFECT_CHAIN_APPLY_PRESET',
      ENABLE_OUTPUT_ROLE: 'BUS_ENABLE_OUTPUT_ROLE',
      DISABLE_OUTPUT_ROLE: 'BUS_DISABLE_OUTPUT_ROLE',
      SET_AUX_SCENE: 'BUS_SET_AUX_SCENE',
      APPLY_CLEAN_FEED_PRESET: 'BUS_APPLY_CLEAN_FEED_PRESET',
      SET_TALLY_OVERRIDE: 'TALLY_SET_OVERRIDE',
      CLEAR_TALLY_OVERRIDE: 'TALLY_CLEAR_OVERRIDE',
      LOCK_PROGRAM: 'SWITCH_LOCK_PROGRAM',
      UNLOCK_PROGRAM: 'SWITCH_UNLOCK_PROGRAM',
      ARM_PROGRAM: 'SWITCH_ARM_PROGRAM',
      DISARM_PROGRAM: 'SWITCH_DISARM_PROGRAM',
      APPLY_PRESET: 'PRESET_RECALL',
    }) as Record<string, string>
  )[s.stepType] ?? s.stepType;

export class OperatorPresetMacroEngine {
  private presets = new Map<string, ProductionPresetDefinition>();
  private macros = new Map<string, OperatorMacroDefinition>();
  private requests = new Set<string>();
  private activeRecalls = new Map<string, PresetRecallRequest>();
  private activeMacros = new Map<
    string,
    {
      req: OperatorMacroExecutionRequest;
      plan: OperatorMacroExecutionPlan;
      state: MacroExecutionState;
      idx: number;
      start: bigint;
      waitUntil: bigint | undefined;
      completed: string[];
      skipped: string[];
      failed: string | undefined;
      commands: string[];
      results: OperatorMacroStepResultSnapshot[];
      retries: Record<string, number>;
      lastTick: string | undefined;
    }
  >();
  private presetResults: PresetRecallResult[] = [];
  private macroResults: OperatorMacroExecutionResultSnapshot[] = [];
  private audit: PresetMacroAuditSnapshot[] = [];
  private planCache = new Map<string, OperatorMacroExecutionPlan>();
  private seq = 1;
  private shutdownFlag = false;
  private counters: Record<string, number> = {};
  private lastEvent?: string;
  private lastSuccess?: string;
  private lastFailure?: string;
  private incidents: string[] = [];
  constructor(
    readonly options: {
      readonly delegateCommand?: (command: RuntimeCommand) => unknown;
      readonly maximumStepsPerTick?: number;
      readonly nowNs?: () => string;
    } = {},
  ) {
    this.emit('PresetMacroEngineCreated', {});
  }
  private now() {
    return this.options.nowNs?.() ?? String(this.seq);
  }
  private inc(k: string, n = 1) {
    this.counters[k] = (this.counters[k] ?? 0) + n;
  }
  private emit(event: string, meta: Record<string, unknown>) {
    this.lastEvent = event;
    this.audit.push(
      freeze({
        auditId: sid('audit', this.seq++),
        requestId: String(meta.requestId ?? ''),
        kind: event.includes('Emergency')
          ? 'EMERGENCY'
          : event.includes('Program')
            ? 'PROGRAM_MUTATION'
            : event.includes('Preset')
              ? 'PRESET'
              : 'MACRO',
        event,
        safeMetadata: sanitizePresetMacroMetadata(meta) as Record<string, Json>,
        createdAtNs: this.now(),
      }),
    );
    this.audit = this.audit.slice(-MAX.history);
  }
  private guard() {
    if (this.shutdownFlag)
      throw createPresetMacroError('PresetMacroEngineNotReady', 'engine is shutdown');
  }
  private requireNewRequest(id: string, macro = false) {
    if (this.requests.has(id)) {
      this.inc('duplicateRequests');
      this.incident(macro ? 'MACRO_DUPLICATE_REQUEST' : 'PRESET_DUPLICATE_REQUEST');
      throw createPresetMacroError(
        macro ? 'MacroExecutionConflict' : 'PresetRecallConflict',
        `duplicate request ${id}`,
      );
    }
    this.requests.add(id);
  }
  private incident(i: string) {
    this.incidents.push(i);
    this.incidents = this.incidents.slice(-MAX.history);
  }
  registerPreset(input: ProductionPresetDefinition): ProductionPresetDefinitionSnapshot {
    this.guard();
    if (this.presets.size >= MAX.presets)
      throw createPresetMacroError('PresetInvalid', 'preset registry bounded');
    if (this.presets.has(input.presetId))
      throw createPresetMacroError('DuplicatePreset', `duplicate preset ${input.presetId}`);
    const p = this.normalizePreset(input);
    this.presets.set(p.presetId, p);
    this.inc('presetRegistrations');
    this.emit('PresetRegistered', { presetId: p.presetId });
    return freeze(p);
  }
  updatePreset(
    input: ProductionPresetDefinition,
    expectedGeneration: number,
  ): ProductionPresetDefinitionSnapshot {
    this.guard();
    const old = this.presets.get(input.presetId);
    if (!old) throw createPresetMacroError('PresetNotFound', 'preset not found');
    if (old.presetGeneration !== expectedGeneration) {
      this.inc('staleGenerationRejects');
      this.incident('PRESET_GENERATION_STALE');
      throw createPresetMacroError('PresetGenerationMismatch', 'stale preset generation');
    }
    const p = this.normalizePreset({ ...input, presetGeneration: old.presetGeneration + 1 });
    this.presets.set(p.presetId, p);
    this.inc('presetUpdates');
    this.emit('PresetUpdated', { presetId: p.presetId });
    return freeze(p);
  }
  unregisterPreset(id: string) {
    this.guard();
    if ([...this.activeRecalls.values()].some((r) => r.presetId === id))
      throw createPresetMacroError('PresetRecallConflict', 'preset active');
    if (!this.presets.delete(id))
      throw createPresetMacroError('PresetNotFound', 'preset not found');
    this.inc('presetRemovals');
    this.emit('PresetUnregistered', { presetId: id });
    return true;
  }
  validatePreset(id: string): PresetMacroValidationReport {
    const p = this.presets.get(id);
    if (!p)
      return freeze({
        valid: false,
        errors: ['PresetNotFound'],
        warnings: [],
        deterministicScore: 0,
      });
    const errors: string[] = [];
    if (!PRODUCTION_PRESET_TYPES.includes(p.presetType)) errors.push('unsupported preset type');
    if (p.presetType === 'CUSTOM_TYPED_PRESET') errors.push('custom preset adapter missing');
    return freeze({
      valid: !errors.length,
      errors,
      warnings: [],
      deterministicScore: 100 - errors.length,
    });
  }
  recallPreset(req: PresetRecallRequest): PresetRecallResultSnapshot | PresetRecallPlanSnapshot {
    this.guard();
    this.requireNewRequest(req.requestId);
    const p = this.presets.get(req.presetId);
    if (!p) return this.rejectPreset(req, 'PresetNotFound', 'preset not found');
    if (p.presetGeneration !== req.expectedPresetGeneration)
      return this.rejectPreset(req, 'PresetGenerationMismatch', 'stale preset generation');
    if (p.requiredDependencies.some((d) => !req.targetIds.includes(d) && !(d in p.targetBindings)))
      return this.rejectPreset(req, 'PresetDependencyMissing', 'missing dependency');
    const mut =
      req.mode === 'APPLY_TO_PROGRAM_WITH_CONFIRMATION' ||
      p.targetScope === 'PROGRAM' ||
      p.presetType === 'PROGRAM_PRESET';
    if (mut && (req.dryRun || req.rehearsal))
      return this.rejectPreset(
        req,
        'PresetRecallRejected',
        'program mutation blocked for dry-run/rehearsal',
      );
    if (mut && req.armedRequired && !p.safetyPolicy.armed) {
      this.inc('unarmedRejects');
      return this.rejectPreset(req, 'PresetRecallRejected', 'program mutation unarmed');
    }
    const plan = this.planPreset(p, req);
    this.activeRecalls.set(req.requestId, freeze(req) as PresetRecallRequest);
    this.inc(
      req.dryRun ? 'presetDryRuns' : req.mode === 'STAGE_ONLY' ? 'presetStages' : 'presetRecalls',
    );
    this.emit('PresetRecallRequested', { requestId: req.requestId, presetId: p.presetId });
    if (req.mode === 'VALIDATE_ONLY' || req.dryRun || req.mode === 'DRY_RUN')
      return this.completePreset(req, plan, 'VALIDATED', false);
    if (req.mode === 'STAGE_ONLY') return this.completePreset(req, plan, 'STAGED', false);
    return plan;
  }
  cancelPreset(requestId: string) {
    const r = this.activeRecalls.get(requestId);
    if (!r) return false;
    const res = this.completePreset(
      r,
      this.planPreset(this.presets.get(r.presetId)!, r),
      'CANCELLED',
      false,
    );
    this.emit('PresetRecallCancelled', { requestId });
    return res;
  }
  registerMacro(input: OperatorMacroDefinition): OperatorMacroDefinitionSnapshot {
    this.guard();
    if (this.macros.size >= MAX.macros)
      throw createPresetMacroError('MacroInvalid', 'macro registry bounded');
    if (this.macros.has(input.macroId))
      throw createPresetMacroError('DuplicateMacro', `duplicate macro ${input.macroId}`);
    const m = this.normalizeMacro(input);
    this.validateMacroDefinition(m, true);
    this.macros.set(m.macroId, m);
    this.inc('macroRegistrations');
    this.emit('MacroRegistered', { macroId: m.macroId });
    return freeze(m);
  }
  updateMacro(
    input: OperatorMacroDefinition,
    expectedGeneration: number,
  ): OperatorMacroDefinitionSnapshot {
    this.guard();
    const old = this.macros.get(input.macroId);
    if (!old) throw createPresetMacroError('MacroNotFound', 'macro not found');
    if (old.macroGeneration !== expectedGeneration) {
      this.inc('staleGenerationRejects');
      this.incident('MACRO_GENERATION_STALE');
      throw createPresetMacroError('MacroGenerationMismatch', 'stale macro generation');
    }
    const m = this.normalizeMacro({ ...input, macroGeneration: old.macroGeneration + 1 });
    this.validateMacroDefinition(m, true);
    this.macros.set(m.macroId, m);
    this.planCache.clear();
    this.inc('macroUpdates');
    this.emit('MacroUpdated', { macroId: m.macroId });
    return freeze(m);
  }
  unregisterMacro(id: string) {
    this.guard();
    if ([...this.activeMacros.values()].some((a) => a.req.macroId === id))
      throw createPresetMacroError('MacroExecutionConflict', 'macro active');
    if (!this.macros.delete(id)) throw createPresetMacroError('MacroNotFound', 'macro not found');
    this.inc('macroRemovals');
    this.emit('MacroUnregistered', { macroId: id });
    return true;
  }
  validateMacro(id: string): PresetMacroValidationReport {
    const m = this.macros.get(id);
    if (!m)
      return freeze({
        valid: false,
        errors: ['MacroNotFound'],
        warnings: [],
        deterministicScore: 0,
      });
    return this.validateMacroDefinition(m, false);
  }
  executeMacro(
    req: OperatorMacroExecutionRequest,
  ): OperatorMacroExecutionPlanSnapshot | OperatorMacroExecutionResultSnapshot {
    this.guard();
    this.requireNewRequest(req.requestId, true);
    const m = this.macros.get(req.macroId);
    if (!m) throw createPresetMacroError('MacroNotFound', 'macro not found');
    if (m.macroGeneration !== req.expectedMacroGeneration) {
      this.inc('staleGenerationRejects');
      this.incident('MACRO_GENERATION_STALE');
      throw createPresetMacroError('MacroGenerationMismatch', 'stale macro generation');
    }
    if (m.armedRequired && !req.armedConfirmation) {
      this.inc('unarmedRejects');
      this.incident('MACRO_UNARMED_CRITICAL_COMMAND');
      throw createPresetMacroError('MacroProgramNotArmed', 'macro not armed');
    }
    const progSteps = m.orderedSteps.filter((s) => programSteps.has(s.stepType));
    if (
      (m.programLockRequired || progSteps.length > 0) &&
      req.rehearsal &&
      !m.safetyPolicy.allowRehearsalProgramMutation
    )
      throw createPresetMacroError('MacroProgramLocked', 'rehearsal program mutation blocked');
    if ((m.programLockRequired || progSteps.length > 0) && !req.armedConfirmation) {
      this.inc('programSafetyRejects');
      this.incident('MACRO_PROGRAM_LOCK_VIOLATION');
      throw createPresetMacroError('MacroProgramNotArmed', 'program mutation requires arming');
    }
    const plan = this.planMacro(m, req);
    this.inc(req.dryRun ? 'macroDryRuns' : req.rehearsal ? 'macroRehearsals' : 'macroExecutions');
    if (req.dryRun) return this.finishMacro(req, plan, 'COMPLETED', [], [], undefined, false);
    this.activeMacros.set(req.requestId, {
      req: freeze(req) as OperatorMacroExecutionRequest,
      plan,
      state: 'SCHEDULED',
      idx: 0,
      start: BigInt(req.startRuntimeFrame),
      completed: [],
      skipped: [],
      commands: [],
      results: [],
      retries: {},
      failed: undefined,
      waitUntil: undefined,
      lastTick: undefined,
    });
    this.emit('MacroExecutionRequested', { requestId: req.requestId, macroId: m.macroId });
    return freeze(plan);
  }
  processFrameTick(tick: FrameTick): OperatorMacroExecutionResultSnapshot[] {
    if (this.shutdownFlag) return [];
    const out: OperatorMacroExecutionResultSnapshot[] = [];
    for (const [rid, a] of [...this.activeMacros.entries()].sort(([x], [y]) =>
      x.localeCompare(y),
    )) {
      if (a.lastTick === tick.frameNumber.toString()) {
        this.inc('duplicateTicks');
        this.incident('MACRO_DUPLICATE_TICK');
        continue;
      }
      a.lastTick = tick.frameNumber.toString();
      if (a.state === 'PAUSED') continue;
      if (a.req.deadlineFrame && tick.frameNumber > BigInt(a.req.deadlineFrame)) {
        out.push(this.failMacro(rid, 'MACRO_EXECUTION_TIMEOUT', 'deadline timeout', tick));
        continue;
      }
      let budget = this.options.maximumStepsPerTick ?? 8;
      a.state = 'RUNNING';
      while (budget-- > 0 && a.idx < a.plan.orderedStepList.length) {
        const s = a.plan.orderedStepList[a.idx]!;
        if (a.plan.disabledSteps.includes(s.stepId) || a.plan.skippedSteps.includes(s.stepId)) {
          a.skipped.push(s.stepId);
          a.results.push({
            stepId: s.stepId,
            status: 'SKIPPED',
            delegatedCommandId: undefined,
            attempts: 0,
            completedFrame: tick.frameNumber.toString(),
            failureReason: undefined,
          });
          a.idx++;
          this.emit('MacroStepSkipped', { requestId: rid, stepId: s.stepId });
          continue;
        }
        if (waitSteps.has(s.stepType)) {
          const done = this.evalWait(s, tick, a);
          if (!done) {
            a.state = 'WAITING';
            a.waitUntil ??= tick.frameNumber + BigInt(s.timeoutFrames || 1);
            a.results.push({
              stepId: s.stepId,
              status: 'WAITING',
              delegatedCommandId: undefined,
              attempts: a.retries[s.stepId] ?? 0,
              completedFrame: tick.frameNumber.toString(),
              failureReason: undefined,
            });
            this.inc('waitSteps');
            this.emit('MacroStepWaiting', { requestId: rid, stepId: s.stepId });
            break;
          }
          a.waitUntil = undefined;
        }
        const cmdId = `${rid}:${s.stepId}:${a.retries[s.stepId] ?? 0}`;
        if (!waitSteps.has(s.stepType)) {
          if (!a.commands.includes(cmdId)) {
            this.emit('MacroStepStarted', { requestId: rid, stepId: s.stepId });
            try {
              this.options.delegateCommand?.({
                id: cmdId,
                type: commandForStep(s),
                payload: s.parameterBindings,
                createdAtNs: tick.actualTimeNs,
                deadlineAtNs: tick.deadlineAtNs,
              } as unknown as RuntimeCommand);
            } catch (e) {
              if (this.retryOrFail(rid, a, s, tick, String((e as Error).message))) break;
            }
            a.commands.push(cmdId);
          }
        }
        a.completed.push(s.stepId);
        a.results.push({
          stepId: s.stepId,
          status: 'COMPLETED',
          delegatedCommandId: waitSteps.has(s.stepType) ? undefined : cmdId,
          attempts: a.retries[s.stepId] ?? 0,
          completedFrame: tick.frameNumber.toString(),
          failureReason: undefined,
        });
        this.inc('stepsCompleted');
        this.emit('MacroStepCompleted', { requestId: rid, stepId: s.stepId });
        a.idx++;
        if (
          a.plan.orderedStepList.length > a.idx &&
          a.plan.orderedStepList[a.idx - 1]!.stepType.startsWith('WAIT_')
        )
          break;
      }
      if (a.idx >= a.plan.orderedStepList.length)
        out.push(this.finishActiveMacro(rid, 'COMPLETED', tick));
    }
    return out.map(freeze) as OperatorMacroExecutionResultSnapshot[];
  }
  pauseMacro(id: string) {
    const a = this.activeMacros.get(id);
    if (a) a.state = 'PAUSED';
    this.emit('MacroPaused', { requestId: id });
    return !!a;
  }
  resumeMacro(id: string) {
    const a = this.activeMacros.get(id);
    if (a && a.state === 'PAUSED') a.state = 'RUNNING';
    this.emit('MacroResumed', { requestId: id });
    return !!a;
  }
  cancelMacro(id: string) {
    const a = this.activeMacros.get(id);
    if (!a) return false;
    const t = this.fakeTick(BigInt(a.req.startRuntimeFrame));
    const r = this.finishActiveMacro(id, 'CANCELLED', t);
    this.emit('MacroCancelled', { requestId: id });
    return r;
  }
  rollbackMacro(id: string) {
    const a = this.activeMacros.get(id);
    if (!a) return false;
    a.state = 'ROLLING_BACK';
    (a as any).rollbackStepIds = a.completed.slice().reverse();
    const r = this.finishActiveMacro(
      id,
      'ROLLED_BACK',
      this.fakeTick(BigInt(a.req.startRuntimeFrame)),
    );
    this.inc('rollbacks');
    this.emit('MacroRolledBack', { requestId: id });
    return r;
  }
  shutdown() {
    this.activeRecalls.clear();
    this.activeMacros.clear();
    this.planCache.clear();
    this.shutdownFlag = true;
    this.emit('PresetMacroEngineShutdown', {});
    this.assertInvariants();
  }
  getHealth(): PresetMacroHealthSnapshot {
    return freeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: this.incidents.length ? 'degraded' : 'healthy',
      registeredPresetCount: this.presets.size,
      registeredMacroCount: this.macros.size,
      activeRecallCount: this.activeRecalls.size,
      activeMacroCount: this.activeMacros.size,
      completedRecallCount: this.presetResults.length,
      completedMacroCount: this.macroResults.length,
      stagedCount: this.counters.presetStages ?? 0,
      dryRunCount: (this.counters.presetDryRuns ?? 0) + (this.counters.macroDryRuns ?? 0),
      rehearsalCount: this.counters.macroRehearsals ?? 0,
      cancelledCount: this.counters.cancellations ?? 0,
      rollbackCount: this.counters.rollbacks ?? 0,
      failedCount: this.counters.failures ?? 0,
      rejectedCount: this.counters.rejections ?? 0,
      duplicateRequestCount: this.counters.duplicateRequests ?? 0,
      duplicateTickCount: this.counters.duplicateTicks ?? 0,
      staleGenerationRejectionCount: this.counters.staleGenerationRejects ?? 0,
      programLockRejectionCount: this.counters.programSafetyRejects ?? 0,
      unarmedRejectionCount: this.counters.unarmedRejects ?? 0,
      missingDependencyCount: this.counters.missingDependencies ?? 0,
      stepExecutionCount: this.counters.stepsCompleted ?? 0,
      stepFailureCount: this.counters.stepFailures ?? 0,
      retryCount: this.counters.retries ?? 0,
      waitingStepCount: this.counters.waitSteps ?? 0,
      planCacheSize: this.planCache.size,
      activeRequestIds: [...this.activeRecalls.keys(), ...this.activeMacros.keys()].sort(),
      activeMacroInstanceIds: [...this.activeMacros.keys()].sort().map((x) => `instance:${x}`),
      lastSuccess: this.lastSuccess,
      lastFailure: this.lastFailure,
      updatedAtNs: this.now(),
    });
  }
  getTelemetry(): PresetMacroTelemetrySnapshot {
    return freeze({
      counters: this.counters,
      currentRequestIds: [...this.activeRecalls.keys(), ...this.activeMacros.keys()].sort(),
      activeMacroIds: [...this.activeMacros.values()].map((a) => a.req.macroId).sort(),
      lastEvent: this.lastEvent,
      healthSummary: this.getHealth().healthState,
    });
  }
  getSnapshot(): PresetMacroEngineSnapshot {
    const active = [...this.activeMacros.entries()].map(([id, a]) => this.instanceSnapshot(id, a));
    return freeze({
      presets: [...this.presets.values()].sort((a, b) => a.presetId.localeCompare(b.presetId)),
      macros: [...this.macros.values()].sort((a, b) => a.macroId.localeCompare(b.macroId)),
      activeRecalls: [...this.activeRecalls.values()].sort((a, b) =>
        a.requestId.localeCompare(b.requestId),
      ),
      activeMacroInstances: active,
      recentPresetResults: this.presetResults,
      recentMacroResults: this.macroResults,
      audit: this.audit,
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
      validation: this.assertInvariants(),
      sourceGraphMetadata: {
        presetIds: [...this.presets.keys()].sort(),
        macroIds: [...this.macros.keys()].sort(),
        activeRecallId: [...this.activeRecalls.keys()].sort()[0] ?? null,
        activeMacroInstanceId: active[0]?.instanceId ?? null,
        currentStepId: active[0]?.currentStepId ?? null,
        executionState: active[0]?.state ?? 'IDLE',
        targetScope: [...this.activeRecalls.values()][0]?.targetScope ?? null,
        programMutationIntent: active.some((i) => i.safeMetadata.programMutationIntent === true),
        dryRunOrRehearsalState: active.some(
          (i) => i.safeMetadata.dryRun === true || i.safeMetadata.rehearsal === true,
        ),
        completedStepCount: active.reduce((n, i) => n + i.completedStepIds.length, 0),
        skippedStepCount: active.reduce((n, i) => n + i.skippedStepIds.length, 0),
        failedStepCount: active.filter((i) => i.failedStepId).length,
        health: this.getHealth().healthState,
        routingEligibility: true,
      },
    });
  }
  assertInvariants(): PresetMacroValidationReport {
    const errors: string[] = [];
    if (this.presets.size > MAX.presets) errors.push('preset bound');
    if (this.macros.size > MAX.macros) errors.push('macro bound');
    if (!unique([...this.presets.keys()])) errors.push('preset IDs unique');
    for (const m of this.macros.values()) {
      if (!unique(m.orderedSteps.map((s) => s.stepId))) errors.push(`step IDs unique:${m.macroId}`);
      const r = this.validateMacroDefinition(m, false);
      errors.push(...r.errors);
    }
    if (
      this.shutdownFlag &&
      (this.activeMacros.size || this.activeRecalls.size || this.planCache.size)
    )
      errors.push('shutdown leak');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: this.incidents.slice(-16),
      deterministicScore: Math.max(0, 100 - errors.length),
    });
  }
  private normalizePreset(i: ProductionPresetDefinition): ProductionPresetDefinition {
    if (!PRODUCTION_PRESET_TYPES.includes(i.presetType))
      throw createPresetMacroError('PresetInvalid', 'unsupported preset type');
    if (!PRESET_TARGET_SCOPES.includes(i.targetScope))
      throw createPresetMacroError('PresetInvalid', 'unsupported target scope');
    if (i.presetType === 'CUSTOM_TYPED_PRESET')
      throw createPresetMacroError('PresetInvalid', 'custom typed preset requires adapter');
    return freeze({
      ...i,
      targetBindings: sanitizePresetMacroMetadata(i.targetBindings) as Record<string, Json>,
      parameterValues: sanitizePresetMacroMetadata(i.parameterValues) as Record<string, Json>,
      safeMetadata: sanitizePresetMacroMetadata(i.safeMetadata) as Record<string, Json>,
      requiredDependencies: [...i.requiredDependencies].sort(),
      optionalDependencies: [...i.optionalDependencies].sort(),
      commandTemplateRefs: [...i.commandTemplateRefs].sort(),
      tags: [...i.tags].sort(),
    }) as ProductionPresetDefinition;
  }
  private normalizeMacro(i: OperatorMacroDefinition): OperatorMacroDefinition {
    const steps = i.orderedSteps.map(
      (s) =>
        freeze({
          ...s,
          dependencies: [...s.dependencies].sort(),
          parameterBindings: sanitizePresetMacroMetadata(s.parameterBindings) as Record<
            string,
            Json
          >,
          safeMetadata: sanitizePresetMacroMetadata(s.safeMetadata) as Record<string, Json>,
          timeoutFrames: Math.min(Math.max(0, s.timeoutFrames), MAX.waitFrames),
          retryPolicy: {
            maxRetries: Math.min(Math.max(0, s.retryPolicy.maxRetries), MAX.retries),
            retryDelayFrames: Math.max(0, s.retryPolicy.retryDelayFrames),
          },
        }) as OperatorMacroStep,
    );
    return freeze({
      ...i,
      orderedSteps: steps,
      tags: [...i.tags].sort(),
      safeMetadata: sanitizePresetMacroMetadata(i.safeMetadata) as Record<string, Json>,
      maximumDurationFrames: Math.min(i.maximumDurationFrames, MAX.waitFrames * MAX.steps),
    }) as OperatorMacroDefinition;
  }
  private validateMacroDefinition(
    m: OperatorMacroDefinition,
    throwing: boolean,
  ): PresetMacroValidationReport {
    const errors: string[] = [];
    if (m.orderedSteps.length > MAX.steps) errors.push('macro steps bounded');
    if (!unique(m.orderedSteps.map((s) => s.stepId))) errors.push('duplicate step id');
    const ids = new Set(m.orderedSteps.map((s) => s.stepId));
    for (const s of m.orderedSteps) {
      if (!OPERATOR_MACRO_STEP_TYPES.includes(s.stepType))
        errors.push(`unsupported step ${s.stepId}`);
      if (s.stepType === 'CUSTOM_TYPED_STEP')
        errors.push(`custom step adapter missing ${s.stepId}`);
      if (s.dependencies.some((d) => !ids.has(d))) errors.push(`missing dependency ${s.stepId}`);
      if (s.retryPolicy.maxRetries > MAX.retries) errors.push(`unbounded retry ${s.stepId}`);
      if (s.timeoutFrames > MAX.waitFrames) errors.push(`unbounded wait ${s.stepId}`);
    }
    if (this.hasCycle(m.orderedSteps)) {
      errors.push('macro graph cycle');
      this.incident('MACRO_GRAPH_CYCLE');
    }
    if (throwing && errors.length)
      throw createPresetMacroError(
        errors.includes('macro graph cycle') ? 'MacroGraphCycle' : 'MacroInvalid',
        errors.join('; '),
      );
    return freeze({
      valid: !errors.length,
      errors,
      warnings: [],
      deterministicScore: 100 - errors.length,
    });
  }
  private hasCycle(steps: readonly OperatorMacroStep[]) {
    const map = new Map(steps.map((s) => [s.stepId, s.dependencies]));
    const seen = new Set<string>(),
      stack = new Set<string>();
    const visit = (id: string): boolean => {
      if (stack.has(id)) return true;
      if (seen.has(id)) return false;
      stack.add(id);
      for (const d of map.get(id) ?? []) if (visit(d)) return true;
      stack.delete(id);
      seen.add(id);
      return false;
    };
    return steps.some((s) => visit(s.stepId));
  }
  private orderSteps(m: OperatorMacroDefinition) {
    return [...m.orderedSteps].sort(
      (a, b) =>
        a.dependencies.length - b.dependencies.length ||
        a.stepIndex - b.stepIndex ||
        Number(b.critical) - Number(a.critical) ||
        a.stepId.localeCompare(b.stepId) ||
        a.stepType.localeCompare(b.stepType) ||
        m.macroId.localeCompare(m.macroId),
    );
  }
  private conditionResult(s: OperatorMacroStep, req: OperatorMacroExecutionRequest) {
    if (s.condition.conditionType === 'ALWAYS') return true;
    if (s.condition.conditionType === 'NEVER') return false;
    if (s.condition.conditionType === 'EXPLICIT_BOOLEAN_PARAMETER')
      return Boolean(req.safeMetadata[s.condition.parameterKey ?? 'condition']);
    if (s.condition.conditionType === 'FRAME_NUMBER_AT_OR_AFTER')
      return BigInt(req.startRuntimeFrame) >= BigInt(String(s.condition.expectedValue ?? '0'));
    return true;
  }
  private planMacro(
    m: OperatorMacroDefinition,
    req: OperatorMacroExecutionRequest,
  ): OperatorMacroExecutionPlan {
    const key = `${m.macroId}:${m.macroGeneration}:${req.requestId}:${req.dryRun}:${req.rehearsal}`;
    const cached = this.planCache.get(key);
    if (cached) {
      this.inc('planCacheHits');
      return cached;
    }
    this.inc('planCacheMisses');
    const ordered = this.orderSteps(m);
    const cond = Object.fromEntries(ordered.map((s) => [s.stepId, this.conditionResult(s, req)]));
    const disabled = ordered
      .filter((s) => !s.enabled)
      .map((s) => s.stepId)
      .sort();
    const skipped = ordered
      .filter((s) => s.enabled && !cond[s.stepId] && !s.critical)
      .map((s) => s.stepId)
      .sort();
    const safety = ordered
      .filter((s) => programSteps.has(s.stepType))
      .map((s) => `PROGRAM_MUTATION:${s.stepType}:${s.stepId}`)
      .sort();
    const plan = freeze({
      planId: `plan:${req.requestId}`,
      macroId: m.macroId,
      macroVersion: m.macroVersion,
      macroGeneration: m.macroGeneration,
      requestId: req.requestId,
      runtimeFrame: req.startRuntimeFrame,
      orderedStepList: ordered,
      dependencyGraphSummary: ordered.map((s) => `${s.stepId}<-[${s.dependencies.join(',')}]`),
      conditionResults: cond,
      skippedSteps: skipped,
      disabledSteps: disabled,
      safetyChecks: safety,
      programMutatingSteps: ordered
        .filter((s) => programSteps.has(s.stepType))
        .map((s) => s.stepId)
        .sort(),
      rollbackCapableSteps: ordered
        .filter((s) => s.rollbackStepRef)
        .map((s) => s.stepId)
        .sort(),
      totalMaximumFrames: ordered.reduce(
        (n, s) => n + s.timeoutFrames + s.retryPolicy.maxRetries * s.retryPolicy.retryDelayFrames,
        0,
      ),
      deterministicScore: 100,
      warnings:
        req.rehearsal && safety.length ? ['rehearsal blocks Program mutation by default'] : [],
      safeMetadata: sanitizePresetMacroMetadata(req.safeMetadata) as Record<string, Json>,
    }) as OperatorMacroExecutionPlan;
    if (this.planCache.size >= MAX.planCache)
      this.planCache.delete([...this.planCache.keys()].sort()[0]!);
    this.planCache.set(key, plan);
    this.inc('plansCreated');
    this.inc('stepsPlanned', ordered.length);
    return plan;
  }
  private planPreset(p: ProductionPresetDefinition, req: PresetRecallRequest): PresetRecallPlan {
    return freeze({
      planId: `preset-plan:${req.requestId}`,
      presetId: p.presetId,
      presetVersion: p.presetVersion,
      presetGeneration: p.presetGeneration,
      requestId: req.requestId,
      runtimeFrame: req.runtimeFrame,
      targetScope: req.targetScope,
      resolvedTargetBindings: { ...p.targetBindings, targetIds: req.targetIds as unknown as Json },
      orderedCommandTemplates: [...p.commandTemplateRefs].sort(),
      resolvedCommandPayloadSummaries: p.commandTemplateRefs
        .map((r) => ({ template: r, presetId: p.presetId }))
        .sort((a, b) => String(a.template).localeCompare(String(b.template))),
      expectedSubsystemGenerations: req.expectedSubsystemGenerations,
      requiredSafetyChecks: p.operatorConfirmationRequirements,
      validationResults: ['VALID'],
      estimatedStepCount: p.commandTemplateRefs.length,
      estimatedDurationMetadata: { frames: p.commandTemplateRefs.length },
      rollbackAvailable: p.rollbackPolicy !== 'NONE',
      deterministicScore: 100,
      warnings: [],
      safeMetadata: sanitizePresetMacroMetadata(req.safeMetadata) as Record<string, Json>,
    }) as PresetRecallPlan;
  }
  private completePreset(
    req: PresetRecallRequest,
    plan: PresetRecallPlan,
    status: PresetRecallStatus,
    committed: boolean,
  ) {
    this.activeRecalls.delete(req.requestId);
    const r = freeze({
      requestId: req.requestId,
      planId: plan.planId,
      presetId: req.presetId,
      status,
      targetScope: req.targetScope,
      delegatedCommandIds: [],
      delegatedSubsystemResults: [],
      appliedStateSummaries: [{ planId: plan.planId, status }],
      programMutationAttempted: plan.requiredSafetyChecks.some((x) => x.includes('PROGRAM')),
      programMutationCommitted: committed,
      dryRun: req.dryRun,
      rehearsal: req.rehearsal,
      rollbackApplied: false,
      warnings: plan.warnings,
      completedRuntimeFrame: req.runtimeFrame,
      completedAtNs: this.now(),
      failureReason: undefined,
    }) as unknown as PresetRecallResult;
    this.presetResults = [...this.presetResults, r].slice(-MAX.history);
    this.lastSuccess = r.requestId;
    this.emit(
      status === 'STAGED'
        ? 'PresetRecallStaged'
        : status === 'VALIDATED'
          ? 'PresetRecallValidated'
          : 'PresetRecallCompleted',
      { requestId: req.requestId },
    );
    return r;
  }
  private rejectPreset(req: PresetRecallRequest, code: string, reason: string) {
    this.inc('rejections');
    if (code.includes('Dependency')) this.inc('missingDependencies');
    const r = freeze({
      requestId: req.requestId,
      planId: '',
      presetId: req.presetId,
      status: 'REJECTED' as const,
      targetScope: req.targetScope,
      delegatedCommandIds: [],
      delegatedSubsystemResults: [],
      appliedStateSummaries: [],
      programMutationAttempted: false,
      programMutationCommitted: false,
      dryRun: req.dryRun,
      rehearsal: req.rehearsal,
      rollbackApplied: false,
      warnings: [],
      failureReason: code,
      completedRuntimeFrame: req.runtimeFrame,
      completedAtNs: this.now(),
    }) as unknown as PresetRecallResult;
    this.presetResults = [...this.presetResults, r].slice(-MAX.history);
    this.lastFailure = reason;
    this.emit('PresetRecallFailed', { requestId: req.requestId, code });
    return r;
  }
  private evalWait(
    s: OperatorMacroStep,
    tick: FrameTick,
    a: { start: bigint; waitUntil: bigint | undefined },
  ) {
    if (s.stepType === 'BARRIER') return true;
    if (s.stepType === 'WAIT_FRAME_COUNT')
      return tick.frameNumber - a.start >= BigInt(Number(s.parameterBindings.frames ?? 1));
    if (a.waitUntil && tick.frameNumber > a.waitUntil) {
      this.incident('MACRO_WAIT_TIMEOUT');
      throw createPresetMacroError('MacroStepTimeout', 'wait timeout');
    }
    return true;
  }
  private retryOrFail(rid: string, a: any, s: OperatorMacroStep, tick: FrameTick, reason: string) {
    const n = a.retries[s.stepId] ?? 0;
    if (s.failurePolicy === 'RETRY_BOUNDED' && n < s.retryPolicy.maxRetries) {
      a.retries[s.stepId] = n + 1;
      this.inc('retries');
      this.emit('MacroStepRetried', { requestId: rid, stepId: s.stepId });
      return true;
    }
    this.failMacro(rid, 'MACRO_STEP_FAILED', reason, tick);
    return true;
  }
  private failMacro(rid: string, incident: string, reason: string, tick: FrameTick) {
    this.inc('failures');
    this.inc('stepFailures');
    this.incident(incident);
    const a = this.activeMacros.get(rid)!;
    a.failed = a.plan.orderedStepList[a.idx]?.stepId ?? undefined;
    return this.finishActiveMacro(rid, 'FAILED', tick, reason);
  }
  private finishMacro(
    req: OperatorMacroExecutionRequest,
    plan: OperatorMacroExecutionPlan,
    status: MacroExecutionState,
    commands: string[],
    results: OperatorMacroStepResultSnapshot[],
    reason?: string,
    rollback = false,
  ) {
    const r = freeze({
      requestId: req.requestId,
      instanceId: `instance:${req.requestId}`,
      macroId: req.macroId,
      status,
      delegatedCommandIds: commands,
      stepResults: results,
      dryRun: req.dryRun,
      rehearsal: req.rehearsal,
      rollbackApplied: rollback,
      failureReason: reason,
      completedRuntimeFrame: req.startRuntimeFrame,
      completedAtNs: this.now(),
    }) as OperatorMacroExecutionResultSnapshot;
    this.macroResults = [...this.macroResults, r].slice(-MAX.history);
    if (status === 'COMPLETED') this.lastSuccess = req.requestId;
    else this.lastFailure = reason ?? status;
    this.emit(
      status === 'COMPLETED'
        ? 'MacroCompleted'
        : status === 'FAILED'
          ? 'MacroFailed'
          : 'MacroCancelled',
      { requestId: req.requestId },
    );
    return r;
  }
  private finishActiveMacro(
    rid: string,
    status: MacroExecutionState,
    tick: FrameTick,
    reason?: string,
  ) {
    const a = this.activeMacros.get(rid)!;
    this.activeMacros.delete(rid);
    const r = freeze({
      requestId: rid,
      instanceId: `instance:${rid}`,
      macroId: a.req.macroId,
      status,
      delegatedCommandIds: a.commands,
      stepResults: a.results,
      dryRun: a.req.dryRun,
      rehearsal: a.req.rehearsal,
      rollbackApplied: status === 'ROLLED_BACK',
      failureReason: reason,
      completedRuntimeFrame: tick.frameNumber.toString(),
      completedAtNs: this.now(),
    }) as OperatorMacroExecutionResultSnapshot;
    this.macroResults = [...this.macroResults, r].slice(-MAX.history);
    this.inc(
      status === 'COMPLETED'
        ? 'completedMacros'
        : status === 'CANCELLED'
          ? 'cancellations'
          : 'failures',
    );
    this.emit(
      status === 'COMPLETED'
        ? 'MacroCompleted'
        : status === 'FAILED'
          ? 'MacroFailed'
          : status === 'ROLLED_BACK'
            ? 'MacroRolledBack'
            : 'MacroCancelled',
      { requestId: rid },
    );
    return r;
  }
  private instanceSnapshot(id: string, a: any): OperatorMacroExecutionInstanceSnapshot {
    return freeze({
      instanceId: `instance:${id}`,
      requestId: id,
      macroId: a.req.macroId,
      macroVersion: a.plan.macroVersion,
      macroGeneration: a.plan.macroGeneration,
      instanceGeneration: 1,
      state: a.state,
      startRuntimeFrame: a.req.startRuntimeFrame,
      currentRuntimeFrame: a.lastTick ?? a.req.startRuntimeFrame,
      currentStepId: a.plan.orderedStepList[a.idx]?.stepId,
      completedStepIds: a.completed,
      skippedStepIds: a.skipped,
      failedStepId: a.failed,
      delegatedCommandIds: a.commands,
      rollbackStepIds: a.rollbackStepIds ?? [],
      cancellationState: 'NONE',
      health: a.state === 'FAILED' ? 'failed' : 'healthy',
      safeMetadata: {
        dryRun: a.req.dryRun,
        rehearsal: a.req.rehearsal,
        programMutationIntent: a.plan.programMutatingSteps.length > 0,
      },
    });
  }
  private fakeTick(frame: bigint): FrameTick {
    return {
      frameNumber: frame,
      startedAtNs: 0n,
      deadlineAtNs: 0n,
      scheduledTimeNs: 0n,
      actualTimeNs: 0n,
      presentationTimeNs: 0n,
      frameDurationNs: 1n,
      driftNs: 0n,
      latenessNs: 0n,
      late: false,
      missedFrames: 0n,
      discontinuity: false,
    };
  }
}

export class OperatorPresetMacroProcessor implements TickProcessor<
  unknown,
  OperatorMacroExecutionResultSnapshot[]
> {
  readonly id = 'operator-preset-macro-processor';
  readonly order = 900;
  constructor(readonly engine: OperatorPresetMacroEngine) {}
  initialize() {}
  processTick(
    tick: FrameTick,
    context?: RuntimeContext | ProcessorRuntimeContext,
  ): ProcessorTickResult<OperatorMacroExecutionResultSnapshot[]> {
    const results = this.engine.processFrameTick(tick);
    if (context && 'outputs' in context) {
      const s = this.engine.getSnapshot();
      context.outputs.publish(
        this.id,
        PRESET_MACRO_OUTPUT_KEYS.health,
        s.health,
        'OWNED_BY_RUNTIME',
      );
      context.outputs.publish(
        this.id,
        PRESET_MACRO_OUTPUT_KEYS.telemetry,
        s.telemetry,
        'OWNED_BY_RUNTIME',
      );
      context.outputs.publish(
        this.id,
        PRESET_MACRO_OUTPUT_KEYS.presetDefinitions,
        s.presets,
        'OWNED_BY_RUNTIME',
      );
      context.outputs.publish(
        this.id,
        PRESET_MACRO_OUTPUT_KEYS.macroDefinitions,
        s.macros,
        'OWNED_BY_RUNTIME',
      );
      context.outputs.publish(
        this.id,
        PRESET_MACRO_OUTPUT_KEYS.activeMacroInstance,
        s.activeMacroInstances,
        'OWNED_BY_RUNTIME',
      );
      context.outputs.publish(
        this.id,
        PRESET_MACRO_OUTPUT_KEYS.macroExecutionResult,
        results,
        'OWNED_BY_RUNTIME',
      );
      context.outputs.publish(
        this.id,
        PRESET_MACRO_OUTPUT_KEYS.auditSummaries,
        s.audit,
        'OWNED_BY_RUNTIME',
      );
    }
    return { status: 'SUCCEEDED', value: results, metadata: { processorOrder: 900 } };
  }
  shutdown() {
    this.engine.shutdown();
    return { status: 'STOPPED' as const };
  }
}

export const createOperatorPresetMacroEngine = (
  options?: ConstructorParameters<typeof OperatorPresetMacroEngine>[0],
) => new OperatorPresetMacroEngine(options);
export const createOperatorPresetMacroProcessor = (engine: OperatorPresetMacroEngine) =>
  new OperatorPresetMacroProcessor(engine);
export const createPresetMacroCommandHandlers = (
  engine: OperatorPresetMacroEngine,
): Record<PresetMacroCommandType, RuntimeCommandHandler> =>
  Object.fromEntries(
    PRESET_MACRO_COMMAND_TYPES.map((type) => [
      type,
      (cmd: { payload?: Record<string, unknown>; id?: string }) => {
        const p = cmd.payload ?? {};
        if (type === 'PRESET_REGISTER')
          return engine.registerPreset(p as unknown as ProductionPresetDefinition);
        if (type === 'PRESET_UPDATE')
          return engine.updatePreset(
            p.preset as ProductionPresetDefinition,
            Number(p.expectedGeneration),
          );
        if (type === 'PRESET_UNREGISTER') return engine.unregisterPreset(String(p.presetId));
        if (type === 'PRESET_VALIDATE') return engine.validatePreset(String(p.presetId));
        if (type === 'PRESET_RECALL' || type === 'PRESET_STAGE' || type === 'PRESET_DRY_RUN')
          return engine.recallPreset({
            ...p,
            commandId: cmd.id ?? String(p.commandId ?? ''),
            dryRun: type === 'PRESET_DRY_RUN' || Boolean(p.dryRun),
            mode:
              type === 'PRESET_STAGE'
                ? 'STAGE_ONLY'
                : type === 'PRESET_DRY_RUN'
                  ? 'DRY_RUN'
                  : p.mode,
          } as PresetRecallRequest);
        if (type === 'PRESET_CANCEL') return engine.cancelPreset(String(p.requestId));
        if (type === 'MACRO_REGISTER')
          return engine.registerMacro(p as unknown as OperatorMacroDefinition);
        if (type === 'MACRO_UPDATE')
          return engine.updateMacro(
            p.macro as OperatorMacroDefinition,
            Number(p.expectedGeneration),
          );
        if (type === 'MACRO_UNREGISTER') return engine.unregisterMacro(String(p.macroId));
        if (type === 'MACRO_VALIDATE') return engine.validateMacro(String(p.macroId));
        if (type === 'MACRO_EXECUTE' || type === 'MACRO_DRY_RUN' || type === 'MACRO_REHEARSE')
          return engine.executeMacro({
            ...p,
            commandId: cmd.id ?? String(p.commandId ?? ''),
            dryRun: type === 'MACRO_DRY_RUN' || Boolean(p.dryRun),
            rehearsal: type === 'MACRO_REHEARSE' || Boolean(p.rehearsal),
          } as OperatorMacroExecutionRequest);
        if (type === 'MACRO_PAUSE') return engine.pauseMacro(String(p.requestId));
        if (type === 'MACRO_RESUME') return engine.resumeMacro(String(p.requestId));
        if (type === 'MACRO_CANCEL') return engine.cancelMacro(String(p.requestId));
        if (type === 'MACRO_ROLLBACK') return engine.rollbackMacro(String(p.requestId));
        if (type === 'MACRO_CLEAR_PLAN_CACHE') return true;
        if (type === 'PRESET_MACRO_SHUTDOWN') return engine.shutdown();
        return engine.getSnapshot();
      },
    ]),
  ) as unknown as Record<PresetMacroCommandType, RuntimeCommandHandler>;

const mkStep = (
  stepId: string,
  stepType: OperatorMacroStepType,
  stepIndex: number,
  parameterBindings: Record<string, Json> = {},
): OperatorMacroStep =>
  freeze({
    stepId,
    stepType,
    stepIndex,
    dependencies: [],
    condition: { conditionType: 'ALWAYS' },
    targetRefs: {},
    expectedGenerations: {},
    parameterBindings,
    timeoutFrames: 60,
    retryPolicy: { maxRetries: 0, retryDelayFrames: 0 },
    failurePolicy: 'INHERIT_MACRO',
    critical: programSteps.has(stepType),
    enabled: true,
    safeMetadata: {},
  }) as OperatorMacroStep;
export const createProductionPresetDefinition = (
  i: Partial<ProductionPresetDefinition> & { presetId: string; presetType: ProductionPresetType },
): ProductionPresetDefinition =>
  freeze({
    presetId: i.presetId,
    presetVersion: i.presetVersion ?? '1.0.0',
    presetGeneration: i.presetGeneration ?? 1,
    displayName: i.displayName ?? i.presetId,
    presetType: i.presetType,
    description: i.description ?? '',
    targetScope: i.targetScope ?? 'PREVIEW',
    targetBindings: i.targetBindings ?? {},
    expectedSubsystemGenerations: i.expectedSubsystemGenerations ?? {},
    requiredDependencies: i.requiredDependencies ?? [],
    optionalDependencies: i.optionalDependencies ?? [],
    parameterValues: i.parameterValues ?? {},
    commandTemplateRefs: i.commandTemplateRefs ?? [],
    recallPolicy: i.recallPolicy ?? 'APPLY_TO_PREVIEW_ONLY',
    failurePolicy: i.failurePolicy ?? 'PRESERVE_PROGRAM',
    rollbackPolicy: i.rollbackPolicy ?? 'EXPLICIT_ONLY',
    safetyPolicy: i.safetyPolicy ?? {},
    rehearsalEligible: i.rehearsalEligible ?? true,
    operatorConfirmationRequirements: i.operatorConfirmationRequirements ?? [],
    tags: i.tags ?? [],
    safeMetadata: i.safeMetadata ?? {},
    createdAtNs: i.createdAtNs ?? '0',
    updatedAtNs: i.updatedAtNs ?? '0',
  }) as ProductionPresetDefinition;
export const createOperatorMacroDefinition = (
  i: Partial<OperatorMacroDefinition> & {
    macroId: string;
    orderedSteps?: readonly OperatorMacroStep[];
  },
): OperatorMacroDefinition =>
  freeze({
    macroId: i.macroId,
    macroVersion: i.macroVersion ?? '1.0.0',
    macroGeneration: i.macroGeneration ?? 1,
    displayName: i.displayName ?? i.macroId,
    description: i.description ?? '',
    orderedSteps: i.orderedSteps ?? [],
    dependencyGraph: i.dependencyGraph ?? {},
    executionPolicy: i.executionPolicy ?? 'SEQUENTIAL_UNTIL_WAIT',
    failurePolicy: i.failurePolicy ?? 'PRESERVE_PROGRAM',
    rollbackPolicy: i.rollbackPolicy ?? 'EXPLICIT_ONLY',
    safetyPolicy: i.safetyPolicy ?? {},
    timingPolicy: i.timingPolicy ?? 'FRAME_TICK_ONLY',
    maximumDurationFrames: i.maximumDurationFrames ?? 600,
    requiredCommandMode: i.requiredCommandMode ?? 'AUTHORITATIVE_COMMAND_ENGINE',
    armedRequired: i.armedRequired ?? false,
    programLockRequired: i.programLockRequired ?? false,
    rehearsalEligible: i.rehearsalEligible ?? true,
    tags: i.tags ?? [],
    safeMetadata: i.safeMetadata ?? {},
    createdAtNs: i.createdAtNs ?? '0',
    updatedAtNs: i.updatedAtNs ?? '0',
  }) as OperatorMacroDefinition;
export const BUILT_IN_PRODUCTION_PRESETS = Object.freeze(
  [
    'OPENING_SCENE',
    'HOST_CAMERA',
    'HOST_WITH_LOWER_THIRD',
    'HOST_AND_GUEST',
    'PRESENTATION_MODE',
    'SCREEN_SHARE_WITH_HOST',
    'FULL_SCREEN_GUEST',
    'FOUR_GUEST_GRID',
    'VERTICAL_SOCIAL_LAYOUT',
    'HORIZONTAL_PROGRAM_LAYOUT',
    'CLEAN_FEED_LAYOUT',
    'PODCAST_MODE',
    'INTERVIEW_MODE',
    'BREAK_SCENE',
    'TECHNICAL_DIFFICULTIES',
    'ENDING_SCENE',
    'SAFE_PROGRAM_SCENE',
    'CUSTOM',
  ].map((id) =>
    createProductionPresetDefinition({
      presetId: `builtin:${id}`,
      displayName: id.replaceAll('_', ' '),
      presetType: id === 'SAFE_PROGRAM_SCENE' ? 'PROGRAM_PRESET' : 'SCENE_PRESET',
      targetScope: id === 'SAFE_PROGRAM_SCENE' ? 'PROGRAM' : 'PREVIEW',
      commandTemplateRefs: ['SWITCH_SET_PREVIEW_SCENE'],
      tags: ['builtin'],
    }),
  ),
);
export const BUILT_IN_OPERATOR_MACROS = Object.freeze(
  [
    'START_SHOW',
    'END_SHOW',
    'TAKE_GUEST',
    'RETURN_TO_HOST',
    'START_PRESENTATION',
    'END_PRESENTATION',
    'ENABLE_CLEAN_FEED',
    'DISABLE_CLEAN_FEED',
    'START_BREAK',
    'END_BREAK',
    'EMERGENCY_SAFE_SCENE',
    'PREPARE_VERTICAL_OUTPUT',
    'PREPARE_HORIZONTAL_OUTPUT',
    'MUTE_ALL_OPTIONAL_AUDIO',
    'RESTORE_STANDARD_AUDIO',
    'CUSTOM',
  ].map((id) =>
    createOperatorMacroDefinition({
      macroId: `builtin:${id}`,
      displayName: id.replaceAll('_', ' '),
      orderedSteps:
        id === 'EMERGENCY_SAFE_SCENE'
          ? [
              mkStep('arm', 'ARM_PROGRAM', 0),
              mkStep('safe', 'APPLY_PRESET', 1, { presetId: 'builtin:SAFE_PROGRAM_SCENE' }),
            ]
          : [mkStep('prepare', 'BARRIER', 0)],
      armedRequired: id === 'EMERGENCY_SAFE_SCENE',
      tags: ['builtin', 'template'],
    }),
  ),
);
