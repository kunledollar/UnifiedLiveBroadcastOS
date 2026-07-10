import {
  type RuntimeClock,
  type RuntimeEventPublisher,
  type RuntimeExecutionEngine,
  type RuntimeLifecycleState,
  type RuntimeLoopState,
  type RuntimeOverloadState,
  systemRuntimeClock,
} from './execution-engine.js';

export type WatchdogRuntimeSubsystem =
  | 'RUNTIME'
  | 'FRAME_CLOCK'
  | 'SCHEDULER'
  | 'COMMAND_EXECUTOR'
  | 'RUNTIME_LOOP'
  | 'PROCESSOR_FRAMEWORK'
  | 'EVENT_PUBLISHER'
  | 'TELEMETRY'
  | 'WORKER_SUPERVISION'
  | 'SOURCE_ACQUISITION'
  | 'VIDEO_PIPELINE'
  | 'AUDIO_PIPELINE'
  | 'GRAPHICS'
  | 'RECORDING'
  | 'STREAMING'
  | 'REPLAY';
export type RuntimeHealthState =
  | 'UNKNOWN'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'UNHEALTHY'
  | 'CRITICAL'
  | 'RECOVERING'
  | 'DISABLED'
  | 'STOPPED'
  | 'FAILED';
export type HealthSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type WatchdogState =
  'CREATED' | 'STARTING' | 'RUNNING' | 'PAUSED' | 'STOPPING' | 'STOPPED' | 'FAILED';
export type WatchdogRuleObserved = 'HEALTHY' | 'WARNING' | 'FAILURE' | 'CRITICAL' | 'UNKNOWN';
export type WatchdogRecoveryAction =
  | 'NONE'
  | 'RECORD_ONLY'
  | 'PAUSE_RUNTIME'
  | 'RESUME_RUNTIME'
  | 'STOP_RUNTIME'
  | 'FAIL_RUNTIME'
  | 'REQUEST_OPERATOR_INTERVENTION'
  | 'CLEAR_NONCRITICAL_DIAGNOSTICS';
export type RecoveryScope = WatchdogRuntimeSubsystem | 'GLOBAL';
export type IncidentLifecycleState =
  'OPEN' | 'ACKNOWLEDGED' | 'RECOVERING' | 'RESOLVED' | 'ESCALATED' | 'SUPPRESSED';

type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const ns = (ms: number) => BigInt(Math.max(0, Math.trunc(ms))) * 1_000_000n;
const zero = '0';
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const freeze = <T>(value: T): Readonly<T> => Object.freeze(clone(value)) as Readonly<T>;
const truncate = (s: string, max = 512) => (s.length > max ? `${s.slice(0, max)}…` : s);
const redactKey = /token|secret|password|stream[_-]?key|credential|auth|cookie/i;
export const redactWatchdogValue = (input: unknown, depth = 0): Json => {
  if (depth > 4) return '[Truncated]';
  if (input === null || ['string', 'number', 'boolean'].includes(typeof input))
    return typeof input === 'string' ? truncate(input) : (input as Json);
  if (typeof input === 'bigint') return input.toString();
  if (input instanceof Error) return { name: input.name, message: truncate(input.message) };
  if (Array.isArray(input)) return input.slice(0, 32).map((v) => redactWatchdogValue(v, depth + 1));
  if (typeof input === 'object')
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, v]) => [k, redactKey.test(k) ? '[REDACTED]' : redactWatchdogValue(v, depth + 1)]),
    );
  return String(input);
};

export interface WatchdogRecoveryPolicy {
  readonly enabled: boolean;
  readonly maximumAttempts: number;
  readonly cooldownMs: number;
  readonly budgetWindowMs: number;
  readonly maximumAttemptsPerWindow: number;
  readonly escalateAfterFailures: boolean;
  readonly requireHealthyWindowBeforeReset: boolean;
}
export interface RuntimeWatchdogConfig {
  readonly enabled: boolean;
  readonly watchdogIntervalMs: number;
  readonly watchdogEvaluationTimeoutMs: number;
  readonly initialGracePeriodMs: number;
  readonly healthyRecoveryWindowMs: number;
  readonly degradedRecoveryWindowMs: number;
  readonly incidentRetentionCapacity: number;
  readonly diagnosticHistoryCapacity: number;
  readonly maximumConcurrentRecoveries: number;
  readonly heartbeatWarningThresholdMs: number;
  readonly heartbeatFailureThresholdMs: number;
  readonly activeTickWarningThresholdMs: number;
  readonly activeTickFailureThresholdMs: number;
  readonly clockStallThresholdMs: number;
  readonly telemetryStaleThresholdMs: number;
  readonly driftWarningNs: string;
  readonly driftFailureNs: string;
  readonly latenessWarningNs: string;
  readonly latenessFailureNs: string;
  readonly maximumMissedFramesPerWindow: number;
  readonly maximumDiscontinuitiesPerWindow: number;
  readonly queuePressureWarningPercent: number;
  readonly queuePressureCriticalPercent: number;
  readonly maximumOldestCommandAgeMs: number;
  readonly maximumWaitingCommandAgeMs: number;
  readonly maximumOverdueCommands: number;
  readonly commandExecutionWarningMs: number;
  readonly commandExecutionFailureMs: number;
  readonly maximumCommandTimeoutsPerWindow: number;
  readonly maximumCommandFailuresPerWindow: number;
  readonly maximumConsecutiveCommandFailures: number;
  readonly maximumRetryExhaustionsPerWindow: number;
  readonly maximumUnknownHandlersPerWindow: number;
  readonly maximumSoftOverrunsPerWindow: number;
  readonly maximumHardOverrunsPerWindow: number;
  readonly maximumSevereOverrunsPerWindow: number;
  readonly maximumConsecutiveOverruns: number;
  readonly maximumBudgetExhaustionsPerWindow: number;
  readonly maximumFailedProcessors: number;
  readonly maximumDegradedProcessors: number;
  readonly maximumProcessorTimeoutsPerWindow: number;
  readonly maximumProcessorFailuresPerWindow: number;
  readonly requiredSubsystems: readonly WatchdogRuntimeSubsystem[];
  readonly subsystemCriticality: Readonly<Record<string, 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL'>>;
  readonly disabledRuleIds: readonly string[];
  readonly recovery: WatchdogRecoveryPolicy;
  readonly subsystemRecovery: Readonly<
    Partial<Record<WatchdogRuntimeSubsystem, WatchdogRecoveryPolicy>>
  >;
}
export const defaultRuntimeWatchdogConfig = (): RuntimeWatchdogConfig =>
  Object.freeze({
    enabled: true,
    watchdogIntervalMs: 1000,
    watchdogEvaluationTimeoutMs: 250,
    initialGracePeriodMs: 0,
    healthyRecoveryWindowMs: 5000,
    degradedRecoveryWindowMs: 10000,
    incidentRetentionCapacity: 512,
    diagnosticHistoryCapacity: 256,
    maximumConcurrentRecoveries: 1,
    heartbeatWarningThresholdMs: 500,
    heartbeatFailureThresholdMs: 2000,
    activeTickWarningThresholdMs: 100,
    activeTickFailureThresholdMs: 1000,
    clockStallThresholdMs: 2000,
    telemetryStaleThresholdMs: 2000,
    driftWarningNs: '2000000',
    driftFailureNs: '10000000',
    latenessWarningNs: '2000000',
    latenessFailureNs: '20000000',
    maximumMissedFramesPerWindow: 5,
    maximumDiscontinuitiesPerWindow: 3,
    queuePressureWarningPercent: 70,
    queuePressureCriticalPercent: 90,
    maximumOldestCommandAgeMs: 10000,
    maximumWaitingCommandAgeMs: 30000,
    maximumOverdueCommands: 16,
    commandExecutionWarningMs: 500,
    commandExecutionFailureMs: 5000,
    maximumCommandTimeoutsPerWindow: 3,
    maximumCommandFailuresPerWindow: 10,
    maximumConsecutiveCommandFailures: 3,
    maximumRetryExhaustionsPerWindow: 3,
    maximumUnknownHandlersPerWindow: 1,
    maximumSoftOverrunsPerWindow: 16,
    maximumHardOverrunsPerWindow: 4,
    maximumSevereOverrunsPerWindow: 1,
    maximumConsecutiveOverruns: 3,
    maximumBudgetExhaustionsPerWindow: 8,
    maximumFailedProcessors: 0,
    maximumDegradedProcessors: 2,
    maximumProcessorTimeoutsPerWindow: 2,
    maximumProcessorFailuresPerWindow: 4,
    requiredSubsystems: [
      'RUNTIME',
      'FRAME_CLOCK',
      'SCHEDULER',
      'COMMAND_EXECUTOR',
      'RUNTIME_LOOP',
      'PROCESSOR_FRAMEWORK',
      'EVENT_PUBLISHER',
      'TELEMETRY',
    ] as readonly WatchdogRuntimeSubsystem[],
    subsystemCriticality: {
      RUNTIME: 'CRITICAL',
      FRAME_CLOCK: 'CRITICAL',
      SCHEDULER: 'CRITICAL',
      COMMAND_EXECUTOR: 'CRITICAL',
      RUNTIME_LOOP: 'CRITICAL',
      PROCESSOR_FRAMEWORK: 'IMPORTANT',
      EVENT_PUBLISHER: 'IMPORTANT',
      TELEMETRY: 'IMPORTANT',
      WORKER_SUPERVISION: 'OPTIONAL',
    } as const,
    disabledRuleIds: [],
    recovery: {
      enabled: false,
      maximumAttempts: 1,
      cooldownMs: 30000,
      budgetWindowMs: 300000,
      maximumAttemptsPerWindow: 1,
      escalateAfterFailures: true,
      requireHealthyWindowBeforeReset: true,
    },
    subsystemRecovery: {},
  });

export interface WatchdogRuleResult {
  readonly ruleId: string;
  readonly subsystem: WatchdogRuntimeSubsystem;
  readonly observed: WatchdogRuleObserved;
  readonly reason: string;
  readonly metrics: Readonly<Record<string, Json>>;
  readonly incidentCode?: string | undefined;
  readonly suggestedRecoveryAction?: WatchdogRecoveryAction | undefined;
  readonly recommendedAction?: string | undefined;
  readonly severity: HealthSeverity;
}
export interface WatchdogHealthRule {
  readonly id: string;
  readonly subsystem: WatchdogRuntimeSubsystem;
  readonly severity: HealthSeverity;
  evaluate(context: WatchdogEvaluationContext): WatchdogRuleResult;
}
export interface WatchdogEvaluationContext {
  readonly engine: RuntimeExecutionEngine;
  readonly telemetry: ReturnType<RuntimeExecutionEngine['telemetry']['current']>;
  readonly scheduler: ReturnType<RuntimeExecutionEngine['scheduler']['snapshot']>;
  readonly processors: ReturnType<RuntimeExecutionEngine['processors']['getSnapshot']>;
  readonly nowNs: string;
  readonly config: RuntimeWatchdogConfig;
}
export interface WatchdogIncident {
  readonly incidentId: string;
  readonly runtimeId: string;
  readonly subsystem: WatchdogRuntimeSubsystem;
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly severity: HealthSeverity;
  readonly healthImpact: RuntimeHealthState;
  readonly state: IncidentLifecycleState;
  readonly firstObservedAtNs: string;
  readonly lastObservedAtNs: string;
  readonly occurrenceCount: number;
  readonly active: boolean;
  readonly acknowledged: boolean;
  readonly acknowledgedAtNs?: string | undefined;
  readonly resolvedAtNs?: string | undefined;
  readonly frameNumber: string;
  readonly relatedCommandId?: string | undefined;
  readonly relatedProcessorId?: string | undefined;
  readonly metrics: Readonly<Record<string, Json>>;
  readonly evidence: Readonly<Record<string, Json>>;
  readonly recommendedAction: string;
  readonly recoveryAction: WatchdogRecoveryAction;
  readonly recoveryAttemptCount: number;
  readonly escalationLevel: number;
  readonly correlationId?: string | undefined;
}
export interface SubsystemHealthSnapshot {
  readonly subsystem: WatchdogRuntimeSubsystem;
  readonly healthState: RuntimeHealthState;
  readonly severity: HealthSeverity;
  readonly enabled: boolean;
  readonly lastEvaluatedAtNs: string;
  readonly lastHealthyAtNs?: string | undefined;
  readonly lastFailureAtNs?: string | undefined;
  readonly lastRecoveryAtNs?: string | undefined;
  readonly consecutiveFailures: number;
  readonly failuresInWindow: number;
  readonly warningCount: number;
  readonly errorCount: number;
  readonly criticalCount: number;
  readonly activeIncidents: readonly WatchdogIncident[];
  readonly primaryReason: string;
  readonly supportingReasons: readonly string[];
  readonly metrics: Readonly<Record<string, Json>>;
  readonly recoveryState: 'IDLE' | 'SUPPRESSED' | 'IN_PROGRESS' | 'BUDGET_EXHAUSTED';
  readonly recoveryAttempts: number;
  readonly recoveryBudgetRemaining: number;
  readonly dependencyHealth: Readonly<Record<string, RuntimeHealthState>>;
  readonly stale: boolean;
  readonly staleForNs: string;
}
export interface RuntimeHealthSnapshot {
  readonly runtimeId: string;
  readonly runtimeState: RuntimeLifecycleState;
  readonly loopState: RuntimeLoopState;
  readonly overallHealth: RuntimeHealthState;
  readonly overallSeverity: HealthSeverity;
  readonly evaluatedAtNs: string;
  readonly lastHealthyAtNs?: string | undefined;
  readonly lastDegradedAtNs?: string | undefined;
  readonly lastUnhealthyAtNs?: string | undefined;
  readonly lastCriticalAtNs?: string | undefined;
  readonly currentFrameNumber: string;
  readonly currentTickFrame?: string | undefined;
  readonly clockState: string;
  readonly overloadState: RuntimeOverloadState;
  readonly activeIncidentCount: number;
  readonly unresolvedCriticalIncidentCount: number;
  readonly recoveryInProgress: boolean;
  readonly recoveryAttemptCount: number;
  readonly recoveryBudgetRemaining: number;
  readonly subsystemHealth: readonly SubsystemHealthSnapshot[];
  readonly healthReasons: readonly string[];
  readonly recommendedOperatorActions: readonly string[];
  readonly lastFatalError?: string | undefined;
  readonly watchdogState: WatchdogState;
  readonly watchdogHeartbeatNs: string;
  readonly telemetryFreshnessNs: string;
  readonly runtimeHeartbeatFreshnessNs: string;
}
export interface RecoveryAttemptSnapshot {
  readonly recoveryId: string;
  readonly subsystem: WatchdogRuntimeSubsystem;
  readonly action: WatchdogRecoveryAction;
  readonly incidentId: string;
  readonly startedAtNs: string;
  readonly completedAtNs?: string | undefined;
  readonly success: boolean;
  readonly message: string;
}
export interface WatchdogDiagnosticsSnapshot {
  readonly runtimeHealth: RuntimeHealthSnapshot;
  readonly subsystemHealth: readonly SubsystemHealthSnapshot[];
  readonly activeIncidents: readonly WatchdogIncident[];
  readonly recentResolvedIncidents: readonly WatchdogIncident[];
  readonly recentRuleResults: readonly WatchdogRuleResult[];
  readonly recentRecoveryAttempts: readonly RecoveryAttemptSnapshot[];
  readonly recentTickHealthSummary: Readonly<Record<string, Json>>;
  readonly schedulerSummary: Readonly<Record<string, Json>>;
  readonly executorSummary: Readonly<Record<string, Json>>;
  readonly processorFrameworkSummary: Readonly<Record<string, Json>>;
  readonly clockSummary: Readonly<Record<string, Json>>;
  readonly loopSummary: Readonly<Record<string, Json>>;
  readonly telemetryFreshnessNs: string;
  readonly watchdogState: WatchdogState;
  readonly generatedAtNs: string;
}
export interface WatchdogEvaluationResult {
  readonly evaluationId: string;
  readonly startedAtNs: string;
  readonly completedAtNs: string;
  readonly durationNs: string;
  readonly health: RuntimeHealthSnapshot;
  readonly ruleResults: readonly WatchdogRuleResult[];
  readonly openedIncidents: readonly WatchdogIncident[];
  readonly resolvedIncidents: readonly WatchdogIncident[];
  readonly recoveryAttempts: readonly RecoveryAttemptSnapshot[];
}

const stateFrom = (observed: WatchdogRuleObserved): RuntimeHealthState =>
  observed === 'CRITICAL'
    ? 'CRITICAL'
    : observed === 'FAILURE'
      ? 'UNHEALTHY'
      : observed === 'WARNING'
        ? 'DEGRADED'
        : observed === 'UNKNOWN'
          ? 'UNKNOWN'
          : 'HEALTHY';
const sevRank: Record<HealthSeverity, number> = { INFO: 0, WARNING: 1, ERROR: 2, CRITICAL: 3 };
const stateRank: Record<RuntimeHealthState, number> = {
  UNKNOWN: 0,
  HEALTHY: 1,
  DEGRADED: 2,
  UNHEALTHY: 3,
  CRITICAL: 4,
  RECOVERING: 2,
  DISABLED: 0,
  STOPPED: 0,
  FAILED: 5,
};
const severityFor = (s: RuntimeHealthState): HealthSeverity =>
  s === 'CRITICAL' || s === 'FAILED'
    ? 'CRITICAL'
    : s === 'UNHEALTHY'
      ? 'ERROR'
      : s === 'DEGRADED'
        ? 'WARNING'
        : 'INFO';
const result = (
  ruleId: string,
  subsystem: WatchdogRuntimeSubsystem,
  observed: WatchdogRuleObserved,
  reason: string,
  metrics: Record<string, unknown> = {},
  incidentCode?: string,
  suggestedRecoveryAction: WatchdogRecoveryAction = 'RECORD_ONLY',
  recommendedAction = 'Inspect subsystem diagnostics.',
): WatchdogRuleResult =>
  Object.freeze({
    ruleId,
    subsystem,
    observed,
    reason,
    metrics: redactWatchdogValue(metrics) as Record<string, Json>,
    ...(incidentCode ? { incidentCode } : {}),
    ...(suggestedRecoveryAction ? { suggestedRecoveryAction } : {}),
    ...(recommendedAction ? { recommendedAction } : {}),
    severity:
      observed === 'CRITICAL'
        ? 'CRITICAL'
        : observed === 'FAILURE'
          ? 'ERROR'
          : observed === 'WARNING'
            ? 'WARNING'
            : 'INFO',
  });

export const createDefaultWatchdogRules = (): readonly WatchdogHealthRule[] => [
  {
    id: 'runtime-state',
    subsystem: 'RUNTIME',
    severity: 'CRITICAL',
    evaluate: (c) =>
      c.engine.lifecycleState === 'FAILED'
        ? result(
            'runtime-state',
            'RUNTIME',
            'CRITICAL',
            'Runtime lifecycle is FAILED',
            {},
            'RUNTIME_FAILED',
            'REQUEST_OPERATOR_INTERVENTION',
            'Stop and restart runtime after reviewing last fatal error.',
          )
        : c.engine.lifecycleState === 'STOPPED'
          ? result('runtime-state', 'RUNTIME', 'UNKNOWN', 'Runtime is stopped')
          : result('runtime-state', 'RUNTIME', 'HEALTHY', 'Runtime lifecycle is compatible'),
  },
  {
    id: 'loop-heartbeat-stale',
    subsystem: 'RUNTIME_LOOP',
    severity: 'ERROR',
    evaluate: (c) => {
      const age = BigInt(c.nowNs) - BigInt(c.telemetry.lastLoopHeartbeatNs || '0');
      if (c.engine.lifecycleState === 'RUNNING' && age > ns(c.config.heartbeatFailureThresholdMs))
        return result(
          'loop-heartbeat-stale',
          'RUNTIME_LOOP',
          'FAILURE',
          'Loop heartbeat exceeded failure threshold',
          { ageNs: age },
          'LOOP_HEARTBEAT_STALE',
          'PAUSE_RUNTIME',
          'Investigate runtime loop stall and system pressure.',
        );
      if (c.engine.lifecycleState === 'RUNNING' && age > ns(c.config.heartbeatWarningThresholdMs))
        return result(
          'loop-heartbeat-stale',
          'RUNTIME_LOOP',
          'WARNING',
          'Loop heartbeat exceeded warning threshold',
          { ageNs: age },
          'LOOP_HEARTBEAT_WARNING',
        );
      return result('loop-heartbeat-stale', 'RUNTIME_LOOP', 'HEALTHY', 'Loop heartbeat fresh', {
        ageNs: age,
      });
    },
  },
  {
    id: 'active-tick-stall',
    subsystem: 'RUNTIME_LOOP',
    severity: 'CRITICAL',
    evaluate: (c) => {
      const base = BigInt(c.telemetry.lastLoopHeartbeatNs || '0');
      const age = BigInt(c.nowNs) - base;
      if (c.telemetry.activeTick && age > ns(c.config.activeTickFailureThresholdMs))
        return result(
          'active-tick-stall',
          'RUNTIME_LOOP',
          'CRITICAL',
          'Active tick exceeded failure threshold',
          { ageNs: age, phase: c.telemetry.currentLoopPhase },
          'ACTIVE_TICK_STALL',
          'PAUSE_RUNTIME',
          'Inspect command handlers and processors for blocking work.',
        );
      if (c.telemetry.activeTick && age > ns(c.config.activeTickWarningThresholdMs))
        return result(
          'active-tick-stall',
          'RUNTIME_LOOP',
          'WARNING',
          'Active tick exceeded warning threshold',
          { ageNs: age },
          'ACTIVE_TICK_SLOW',
        );
      return result('active-tick-stall', 'RUNTIME_LOOP', 'HEALTHY', 'No active tick stall');
    },
  },
  {
    id: 'clock-health',
    subsystem: 'FRAME_CLOCK',
    severity: 'ERROR',
    evaluate: (c) => {
      const drift = BigInt(c.telemetry.currentDriftNs || '0');
      const late = BigInt(c.telemetry.currentLatenessNs || '0');
      if (c.engine.lifecycleState === 'RUNNING' && c.telemetry.clockState !== 'RUNNING')
        return result(
          'clock-health',
          'FRAME_CLOCK',
          'CRITICAL',
          'Runtime running while frame clock is not running',
          { clockState: c.telemetry.clockState },
          'CLOCK_STATE_MISMATCH',
          'PAUSE_RUNTIME',
          'Investigate clock lifecycle mismatch.',
        );
      if (late >= BigInt(c.config.latenessFailureNs) || drift >= BigInt(c.config.driftFailureNs))
        return result(
          'clock-health',
          'FRAME_CLOCK',
          'FAILURE',
          'Clock lateness/drift exceeded failure threshold',
          { lateNs: late, driftNs: drift },
          'CLOCK_DRIFT_FAILURE',
        );
      if (late >= BigInt(c.config.latenessWarningNs) || drift >= BigInt(c.config.driftWarningNs))
        return result(
          'clock-health',
          'FRAME_CLOCK',
          'WARNING',
          'Clock lateness/drift exceeded warning threshold',
          { lateNs: late, driftNs: drift },
          'CLOCK_DRIFT_WARNING',
        );
      return result('clock-health', 'FRAME_CLOCK', 'HEALTHY', 'Clock timing within thresholds');
    },
  },
  {
    id: 'clock-window',
    subsystem: 'FRAME_CLOCK',
    severity: 'ERROR',
    evaluate: (c) => {
      const missed = c.telemetry.recentTickHealthWindow.reduce(
        (n, e) => n + Number(BigInt(e.missedFrames)),
        0,
      );
      const disc = c.telemetry.recentTickHealthWindow.filter(
        (e) => BigInt(e.latenessNs) > BigInt(c.config.latenessFailureNs),
      ).length;
      if (missed > c.config.maximumMissedFramesPerWindow)
        return result(
          'clock-window',
          'FRAME_CLOCK',
          'FAILURE',
          'Missed frames exceeded window threshold',
          { missed },
          'MISSED_FRAME_THRESHOLD',
        );
      if (disc > c.config.maximumDiscontinuitiesPerWindow)
        return result(
          'clock-window',
          'FRAME_CLOCK',
          'FAILURE',
          'Clock discontinuity proxy exceeded threshold',
          { discontinuities: disc },
          'CLOCK_DISCONTINUITY_THRESHOLD',
        );
      return result('clock-window', 'FRAME_CLOCK', 'HEALTHY', 'Clock window healthy', {
        missed,
        discontinuities: disc,
      });
    },
  },
  {
    id: 'scheduler-pressure',
    subsystem: 'SCHEDULER',
    severity: 'ERROR',
    evaluate: (c) => {
      const cap = c.engine.config.commandQueueCapacity;
      const used = c.scheduler.pendingCommands;
      const pct = cap ? (used / cap) * 100 : 0;
      if (pct >= c.config.queuePressureCriticalPercent)
        return result(
          'scheduler-pressure',
          'SCHEDULER',
          'CRITICAL',
          'Scheduler queue pressure critical',
          { used, cap, pct },
          'SCHEDULER_PRESSURE_CRITICAL',
          'REQUEST_OPERATOR_INTERVENTION',
          'Clear command backlog or reduce automation bursts.',
        );
      if (pct >= c.config.queuePressureWarningPercent)
        return result(
          'scheduler-pressure',
          'SCHEDULER',
          'WARNING',
          'Scheduler queue pressure warning',
          { used, cap, pct },
          'SCHEDULER_PRESSURE_WARNING',
        );
      return result(
        'scheduler-pressure',
        'SCHEDULER',
        'HEALTHY',
        'Scheduler queue pressure normal',
        { used, cap, pct },
      );
    },
  },
  {
    id: 'scheduler-invariants',
    subsystem: 'SCHEDULER',
    severity: 'CRITICAL',
    evaluate: (c) => {
      try {
        c.engine.scheduler.assertInvariants();
        return result('scheduler-invariants', 'SCHEDULER', 'HEALTHY', 'Scheduler invariants pass');
      } catch (e) {
        return result(
          'scheduler-invariants',
          'SCHEDULER',
          'CRITICAL',
          'Scheduler invariant failure',
          { error: redactWatchdogValue(e) },
          'SCHEDULER_INVARIANT_FAILURE',
          'REQUEST_OPERATOR_INTERVENTION',
        );
      }
    },
  },
  {
    id: 'command-executor-health',
    subsystem: 'COMMAND_EXECUTOR',
    severity: 'ERROR',
    evaluate: (c) => {
      if (c.telemetry.unknownHandlerFailures > c.config.maximumUnknownHandlersPerWindow)
        return result(
          'command-executor-health',
          'COMMAND_EXECUTOR',
          'FAILURE',
          'Unknown command handler failures exceeded threshold',
          { unknownHandlerFailures: c.telemetry.unknownHandlerFailures },
          'UNKNOWN_HANDLER_THRESHOLD',
        );
      if (c.telemetry.timedOutCommandExecutions > c.config.maximumCommandTimeoutsPerWindow)
        return result(
          'command-executor-health',
          'COMMAND_EXECUTOR',
          'FAILURE',
          'Command timeouts exceeded threshold',
          { timeouts: c.telemetry.timedOutCommandExecutions },
          'COMMAND_TIMEOUT_THRESHOLD',
        );
      if (c.telemetry.consecutiveCommandFailures > c.config.maximumConsecutiveCommandFailures)
        return result(
          'command-executor-health',
          'COMMAND_EXECUTOR',
          'FAILURE',
          'Consecutive command failures exceeded threshold',
          { consecutive: c.telemetry.consecutiveCommandFailures },
          'COMMAND_FAILURE_LOOP',
        );
      return result(
        'command-executor-health',
        'COMMAND_EXECUTOR',
        'HEALTHY',
        'Command executor counters healthy',
      );
    },
  },
  {
    id: 'command-executor-invariants',
    subsystem: 'COMMAND_EXECUTOR',
    severity: 'CRITICAL',
    evaluate: (c) => {
      try {
        c.engine.commandExecutionEngine.assertInvariants();
        return result(
          'command-executor-invariants',
          'COMMAND_EXECUTOR',
          'HEALTHY',
          'Command executor invariants pass',
        );
      } catch (e) {
        return result(
          'command-executor-invariants',
          'COMMAND_EXECUTOR',
          'CRITICAL',
          'Command executor invariant failure',
          { error: redactWatchdogValue(e) },
          'EXECUTOR_INVARIANT_FAILURE',
          'REQUEST_OPERATOR_INTERVENTION',
        );
      }
    },
  },
  {
    id: 'runtime-overruns',
    subsystem: 'RUNTIME_LOOP',
    severity: 'ERROR',
    evaluate: (c) => {
      const w = c.telemetry.recentTickHealthWindow;
      const soft = w.filter((e) => BigInt(e.overrunNs) > 0n).length;
      const hard = w.filter(
        (e) => BigInt(e.overrunNs) > BigInt(c.engine.config.maximumTickOverrunNs),
      ).length;
      const severe = w.filter(
        (e) => BigInt(e.overrunNs) > BigInt(c.engine.config.severeTickOverrunNs),
      ).length;
      if (
        severe > c.config.maximumSevereOverrunsPerWindow ||
        c.telemetry.consecutiveTickOverruns > c.config.maximumConsecutiveOverruns
      )
        return result(
          'runtime-overruns',
          'RUNTIME_LOOP',
          'CRITICAL',
          'Severe/consecutive overruns exceeded threshold',
          { soft, hard, severe, consecutive: c.telemetry.consecutiveTickOverruns },
          'RUNTIME_SEVERE_OVERRUNS',
        );
      if (hard > c.config.maximumHardOverrunsPerWindow)
        return result(
          'runtime-overruns',
          'RUNTIME_LOOP',
          'FAILURE',
          'Hard overruns exceeded threshold',
          { soft, hard, severe },
          'RUNTIME_HARD_OVERRUNS',
        );
      if (soft > c.config.maximumSoftOverrunsPerWindow)
        return result(
          'runtime-overruns',
          'RUNTIME_LOOP',
          'WARNING',
          'Soft overruns exceeded threshold',
          { soft, hard, severe },
          'RUNTIME_SOFT_OVERRUNS',
        );
      return result(
        'runtime-overruns',
        'RUNTIME_LOOP',
        'HEALTHY',
        'Runtime loop timing window healthy',
        { soft, hard, severe },
      );
    },
  },
  {
    id: 'processor-framework-health',
    subsystem: 'PROCESSOR_FRAMEWORK',
    severity: 'ERROR',
    evaluate: (c) => {
      const hc = c.processors.healthCounts as Record<string, number>;
      const failed = hc.FAILED ?? 0;
      const degraded = hc.DEGRADED ?? 0;
      if (failed > c.config.maximumFailedProcessors)
        return result(
          'processor-framework-health',
          'PROCESSOR_FRAMEWORK',
          'CRITICAL',
          'Failed processors exceeded threshold',
          { failed, degraded },
          'PROCESSOR_FAILURE_THRESHOLD',
          'REQUEST_OPERATOR_INTERVENTION',
          'Inspect processor dependency chain and disable optional processors if needed.',
        );
      if (degraded > c.config.maximumDegradedProcessors)
        return result(
          'processor-framework-health',
          'PROCESSOR_FRAMEWORK',
          'WARNING',
          'Degraded processors exceeded threshold',
          { failed, degraded },
          'PROCESSOR_DEGRADED_THRESHOLD',
        );
      return result(
        'processor-framework-health',
        'PROCESSOR_FRAMEWORK',
        'HEALTHY',
        'Processor framework health counts within thresholds',
        { failed, degraded },
      );
    },
  },
  {
    id: 'processor-framework-invariants',
    subsystem: 'PROCESSOR_FRAMEWORK',
    severity: 'CRITICAL',
    evaluate: (c) => {
      try {
        c.engine.processors.assertInvariants();
        return result(
          'processor-framework-invariants',
          'PROCESSOR_FRAMEWORK',
          'HEALTHY',
          'Processor framework invariants pass',
        );
      } catch (e) {
        return result(
          'processor-framework-invariants',
          'PROCESSOR_FRAMEWORK',
          'CRITICAL',
          'Processor framework invariant failure',
          { error: redactWatchdogValue(e) },
          'PROCESSOR_INVARIANT_FAILURE',
          'REQUEST_OPERATOR_INTERVENTION',
        );
      }
    },
  },
  {
    id: 'event-publisher-health',
    subsystem: 'EVENT_PUBLISHER',
    severity: 'WARNING',
    evaluate: (c) =>
      c.telemetry.eventPublisherFailures > 0
        ? result(
            'event-publisher-health',
            'EVENT_PUBLISHER',
            'WARNING',
            'Event publisher has recorded failures',
            { failures: c.telemetry.eventPublisherFailures },
            'EVENT_PUBLISHER_UNHEALTHY',
            'RECORD_ONLY',
            'Inspect runtime event sink; watchdog has in-memory incident fallback.',
          )
        : result(
            'event-publisher-health',
            'EVENT_PUBLISHER',
            'HEALTHY',
            'Event publisher has no recorded failures',
          ),
  },
  {
    id: 'telemetry-freshness',
    subsystem: 'TELEMETRY',
    severity: 'ERROR',
    evaluate: (c) => {
      const latest = [
        c.telemetry.lastLoopHeartbeatNs,
        c.telemetry.lastHealthyTickNs,
        c.telemetry.lastWatchdogEvaluationNs,
      ]
        .filter(Boolean)
        .map(String)
        .map(BigInt)
        .reduce((a, b) => (b > a ? b : a), 0n);
      const age = BigInt(c.nowNs) - latest;
      if (age > ns(c.config.telemetryStaleThresholdMs))
        return result(
          'telemetry-freshness',
          'TELEMETRY',
          'FAILURE',
          'Telemetry freshness exceeded threshold',
          { ageNs: age },
          'TELEMETRY_STALE',
          'RECORD_ONLY',
          'Verify telemetry commits and snapshot generation.',
        );
      return result('telemetry-freshness', 'TELEMETRY', 'HEALTHY', 'Telemetry fresh', {
        ageNs: age,
      });
    },
  },
  {
    id: 'worker-supervision-placeholder',
    subsystem: 'WORKER_SUPERVISION',
    severity: 'INFO',
    evaluate: () =>
      result(
        'worker-supervision-placeholder',
        'WORKER_SUPERVISION',
        'HEALTHY',
        'Worker supervision contracts are placeholder-only in v5.1.7',
      ),
  },
];

export class RuntimeWatchdog {
  private state: WatchdogState = 'CREATED';
  private rules: WatchdogHealthRule[];
  private evaluating = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private sequence = 0;
  private incidents = new Map<string, WatchdogIncident>();
  private dedupe = new Map<string, string>();
  private diagnostics: WatchdogDiagnosticsSnapshot[] = [];
  private recoveryAttempts: RecoveryAttemptSnapshot[] = [];
  private subsystem = new Map<WatchdogRuntimeSubsystem, SubsystemHealthSnapshot>();
  private health: RuntimeHealthSnapshot;
  private heartbeatNs = zero;
  private startedAtNs: string | undefined;
  private stoppedAtNs: string | undefined;
  constructor(
    private readonly engine: RuntimeExecutionEngine,
    config: Partial<RuntimeWatchdogConfig> = {},
    private readonly clock: RuntimeClock = systemRuntimeClock,
    rules: readonly WatchdogHealthRule[] = createDefaultWatchdogRules(),
    private readonly publisher?: RuntimeEventPublisher,
  ) {
    this.config = Object.freeze({
      ...defaultRuntimeWatchdogConfig(),
      ...config,
      recovery: { ...defaultRuntimeWatchdogConfig().recovery, ...(config.recovery ?? {}) },
      subsystemRecovery: {
        ...defaultRuntimeWatchdogConfig().subsystemRecovery,
        ...(config.subsystemRecovery ?? {}),
      },
    });
    this.validateConfig();
    const ids = new Set<string>();
    this.rules = rules
      .filter((r) => !this.config.disabledRuleIds.includes(r.id))
      .sort((a, b) => a.subsystem.localeCompare(b.subsystem) || a.id.localeCompare(b.id));
    for (const r of this.rules) {
      if (ids.has(r.id)) throw new Error(`Duplicate watchdog rule ${r.id}`);
      ids.add(r.id);
    }
    this.health = this.emptyHealth('UNKNOWN');
  }
  readonly config: RuntimeWatchdogConfig;
  async start() {
    if (this.state === 'RUNNING' || this.state === 'STARTING') return;
    if (!this.config.enabled) {
      this.state = 'STOPPED';
      return;
    }
    this.state = 'STARTING';
    this.startedAtNs = this.clock.nowNs().toString();
    await this.publish('WatchdogStarting', {});
    this.state = 'RUNNING';
    this.heartbeatNs = this.startedAtNs;
    this.schedule();
    this.commitTelemetry({
      watchdogState: this.state,
      watchdogStartedAtNs: this.startedAtNs,
      watchdogHeartbeatNs: this.heartbeatNs,
    });
    await this.publish('WatchdogStarted', {});
  }
  async stop() {
    if (this.state === 'STOPPED' || this.state === 'STOPPING') return;
    this.state = 'STOPPING';
    await this.publish('WatchdogStopping', {});
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.stoppedAtNs = this.clock.nowNs().toString();
    this.state = 'STOPPED';
    this.commitTelemetry({ watchdogState: this.state, watchdogStoppedAtNs: this.stoppedAtNs });
    await this.publish('WatchdogStopped', {});
  }
  async evaluateNow(): Promise<WatchdogEvaluationResult> {
    if (this.evaluating) throw new Error('WatchdogEvaluationOverlap');
    if (this.state === 'FAILED') throw new Error('WatchdogFailedCannotEvaluate');
    this.evaluating = true;
    const started = this.clock.nowNs();
    const id = `watchdog-eval-${++this.sequence}`;
    await this.publish('WatchdogEvaluationStarted', { evaluationId: id });
    try {
      const context = this.context(started);
      if (this.rules.length === 0) {
        const completedFast = this.clock.nowNs();
        this.heartbeatNs = completedFast.toString();
        this.health = this.calculateOverall(completedFast);
        this.commitTelemetry({
          watchdogState: this.state,
          watchdogHeartbeatNs: this.heartbeatNs,
          watchdogEvaluations: (this.engine.telemetry.current().watchdogEvaluations ?? 0) + 1,
          lastWatchdogEvaluationNs: completedFast.toString(),
          lastWatchdogEvaluationDurationNs: (completedFast - started).toString(),
          diagnosticHistorySize: this.diagnostics.length,
          overallHealth: this.health.overallHealth,
        });
        return freeze({
          evaluationId: id,
          startedAtNs: started.toString(),
          completedAtNs: completedFast.toString(),
          durationNs: (completedFast - started).toString(),
          health: this.health,
          ruleResults: [],
          openedIncidents: [],
          resolvedIncidents: [],
          recoveryAttempts: [],
        });
      }
      const raw = this.rules.map((r) => {
        try {
          return r.evaluate(context);
        } catch (e) {
          return result(
            r.id,
            r.subsystem,
            'FAILURE',
            'Watchdog rule failed',
            { error: redactWatchdogValue(e) },
            'WATCHDOG_RULE_FAILURE',
            'RECORD_ONLY',
          );
        }
      });
      const ruleResults = raw.map((r) => Object.freeze(r));
      const opened = this.updateIncidents(ruleResults, started);
      const resolved = this.resolveIncidents(ruleResults, started);
      this.updateSubsystemHealth(ruleResults, started);
      const health = this.calculateOverall(started);
      const recoveries = await this.recover(opened, started);
      const completed = this.clock.nowNs();
      const duration = completed - started;
      this.heartbeatNs = completed.toString();
      this.health = health;
      const evalResult = freeze({
        evaluationId: id,
        startedAtNs: started.toString(),
        completedAtNs: completed.toString(),
        durationNs: duration.toString(),
        health,
        ruleResults,
        openedIncidents: opened,
        resolvedIncidents: resolved,
        recoveryAttempts: recoveries,
      });
      this.recordDiagnostics(ruleResults, completed);
      this.commitTelemetry({
        watchdogState: this.state,
        watchdogHeartbeatNs: this.heartbeatNs,
        watchdogEvaluations: (this.engine.telemetry.current().watchdogEvaluations ?? 0) + 1,
        lastWatchdogEvaluationNs: completed.toString(),
        lastWatchdogEvaluationDurationNs: duration.toString(),
        maximumWatchdogEvaluationDurationNs:
          duration >
          BigInt(this.engine.telemetry.current().maximumWatchdogEvaluationDurationNs ?? '0')
            ? duration.toString()
            : (this.engine.telemetry.current().maximumWatchdogEvaluationDurationNs ?? '0'),
        activeIncidentCount: this.activeIncidents().length,
        resolvedIncidentCount: this.resolvedIncidents().length,
        acknowledgedIncidentCount: [...this.incidents.values()].filter((i) => i.acknowledged)
          .length,
        criticalIncidentCount: this.activeIncidents().filter((i) => i.severity === 'CRITICAL')
          .length,
        overallHealth: health.overallHealth,
        subsystemHealthSummary: Object.fromEntries(
          health.subsystemHealth.map((s) => [s.subsystem, s.healthState]),
        ),
        staleSubsystemCount: health.subsystemHealth.filter((s) => s.stale).length,
        diagnosticHistorySize: this.diagnostics.length,
        lastIncident: opened.at(-1),
      });
      await this.publish('WatchdogEvaluationCompleted', {
        evaluationId: id,
        overallHealth: health.overallHealth,
      });
      return evalResult;
    } catch (e) {
      this.state = 'FAILED';
      this.commitTelemetry({
        watchdogState: this.state,
        watchdogEvaluationFailures:
          (this.engine.telemetry.current().watchdogEvaluationFailures ?? 0) + 1,
        lastError: String(e),
      });
      await this.publish('WatchdogEvaluationFailed', { error: String(e) });
      throw e;
    } finally {
      this.evaluating = false;
      if (this.state === 'RUNNING') this.schedule();
    }
  }
  getHealth() {
    return freeze(this.health);
  }
  getSubsystemHealth(subsystem: WatchdogRuntimeSubsystem) {
    const s = this.subsystem.get(subsystem);
    return s ? freeze(s) : undefined;
  }
  getDiagnostics() {
    return this.diagnostics.at(-1)
      ? freeze(this.diagnostics.at(-1)!)
      : this.buildDiagnostics([], this.clock.nowNs());
  }
  acknowledgeIncident(incidentId: string) {
    const i = this.incidents.get(incidentId);
    if (!i || !i.active) return false;
    const next = freeze({
      ...i,
      acknowledged: true,
      acknowledgedAtNs: this.clock.nowNs().toString(),
      state: 'ACKNOWLEDGED' as IncidentLifecycleState,
    });
    this.incidents.set(incidentId, next);
    this.publish('IncidentAcknowledged', { incidentId }).catch(() => {});
    return true;
  }
  resetRecoveryBudget(_scope: RecoveryScope = 'GLOBAL') {
    this.recoveryAttempts = [];
  }
  registerRule(rule: WatchdogHealthRule) {
    if (this.rules.some((r) => r.id === rule.id))
      throw new Error(`Duplicate watchdog rule ${rule.id}`);
    this.rules = [...this.rules, rule].sort(
      (a, b) => a.subsystem.localeCompare(b.subsystem) || a.id.localeCompare(b.id),
    );
  }
  assertInvariants() {
    if (this.timer && this.state !== 'RUNNING')
      throw new Error('Watchdog timer active while not running');
    if (this.evaluating && this.state === 'FAILED')
      throw new Error('Failed watchdog cannot continue evaluation');
    if (this.diagnostics.length > this.config.diagnosticHistoryCapacity)
      throw new Error('Diagnostic history capacity exceeded');
    if (this.incidents.size > this.config.incidentRetentionCapacity)
      throw new Error('Incident retention capacity exceeded');
    const ids = new Set<string>();
    for (const i of this.incidents.values()) {
      if (ids.has(i.incidentId)) throw new Error('Duplicate incident id');
      ids.add(i.incidentId);
      if (!i.active && !i.resolvedAtNs) throw new Error('Resolved incident missing resolvedAtNs');
    }
    const expected = this.calculateOverall(BigInt(this.health.evaluatedAtNs || '0')).overallHealth;
    if (expected !== this.health.overallHealth)
      throw new Error(`Overall health invariant mismatch ${expected} ${this.health.overallHealth}`);
    return freeze({
      watchdogState: this.state,
      incidents: this.incidents.size,
      diagnostics: this.diagnostics.length,
      rules: this.rules.length,
    });
  }
  private schedule() {
    if (this.timer) clearTimeout(this.timer);
    if (this.state !== 'RUNNING') return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.evaluateNow().catch(() => {});
    }, this.config.watchdogIntervalMs);
    (this.timer as unknown as { unref?: () => void }).unref?.();
  }
  private validateConfig() {
    for (const [k, v] of Object.entries(this.config))
      if (typeof v === 'number' && (!Number.isFinite(v) || v < 0))
        throw new Error(`Invalid watchdog config ${k}`);
    if (this.config.incidentRetentionCapacity <= 0 || this.config.diagnosticHistoryCapacity <= 0)
      throw new Error('Watchdog capacities must be positive');
  }
  private context(now: bigint): WatchdogEvaluationContext {
    return Object.freeze({
      engine: this.engine,
      telemetry: this.engine.telemetry.current(),
      scheduler: this.engine.scheduler.snapshot(),
      processors: this.engine.processors.getSnapshot(),
      nowNs: now.toString(),
      config: this.config,
    });
  }
  private key(r: WatchdogRuleResult) {
    return `${r.subsystem}:${r.incidentCode ?? r.ruleId}`;
  }
  private updateIncidents(results: readonly WatchdogRuleResult[], now: bigint) {
    const opened: WatchdogIncident[] = [];
    for (const r of results.filter((x) => x.observed !== 'HEALTHY')) {
      const key = this.key(r);
      const existingId = this.dedupe.get(key);
      const existing = existingId ? this.incidents.get(existingId) : undefined;
      if (existing?.active) {
        const next = freeze({
          ...existing,
          lastObservedAtNs: now.toString(),
          occurrenceCount: existing.occurrenceCount + 1,
          metrics: r.metrics,
          escalationLevel:
            existing.occurrenceCount > 3 ? existing.escalationLevel + 1 : existing.escalationLevel,
          state:
            existing.occurrenceCount > 3 ? ('ESCALATED' as IncidentLifecycleState) : existing.state,
        });
        this.incidents.set(existing.incidentId, next);
        continue;
      }
      const incident: WatchdogIncident = freeze({
        incidentId: `${this.engine.config.runtimeId}:incident:${this.incidents.size + 1}`,
        runtimeId: this.engine.config.runtimeId,
        subsystem: r.subsystem,
        code: r.incidentCode ?? r.ruleId,
        title: r.reason,
        description: r.reason,
        severity:
          r.observed === 'CRITICAL'
            ? 'CRITICAL'
            : r.observed === 'FAILURE'
              ? 'ERROR'
              : r.observed === 'WARNING'
                ? 'WARNING'
                : 'INFO',
        healthImpact: stateFrom(r.observed),
        state: 'OPEN',
        firstObservedAtNs: now.toString(),
        lastObservedAtNs: now.toString(),
        occurrenceCount: 1,
        active: true,
        acknowledged: false,
        frameNumber: this.engine.currentFrameNumber.toString(),
        metrics: r.metrics,
        evidence: { ruleId: r.ruleId },
        recommendedAction: r.recommendedAction ?? 'Inspect subsystem diagnostics.',
        recoveryAction: r.suggestedRecoveryAction ?? 'RECORD_ONLY',
        recoveryAttemptCount: 0,
        escalationLevel: 0,
      });
      this.incidents.set(incident.incidentId, incident);
      this.dedupe.set(key, incident.incidentId);
      opened.push(incident);
      this.publish('IncidentOpened', {
        incidentId: incident.incidentId,
        subsystem: r.subsystem,
        code: incident.code,
      }).catch(() => {});
    }
    this.enforceIncidentCapacity();
    return opened;
  }
  private resolveIncidents(results: readonly WatchdogRuleResult[], now: bigint) {
    const unhealthy = new Set(
      results.filter((r) => r.observed !== 'HEALTHY').map((r) => this.key(r)),
    );
    const resolved: WatchdogIncident[] = [];
    for (const [key, id] of this.dedupe) {
      if (unhealthy.has(key)) continue;
      const i = this.incidents.get(id);
      if (i?.active) {
        const next = freeze({
          ...i,
          active: false,
          state: 'RESOLVED' as IncidentLifecycleState,
          resolvedAtNs: now.toString(),
          lastObservedAtNs: now.toString(),
        });
        this.incidents.set(id, next);
        resolved.push(next);
        this.publish('IncidentResolved', { incidentId: id }).catch(() => {});
      }
    }
    return resolved;
  }
  private updateSubsystemHealth(results: readonly WatchdogRuleResult[], now: bigint) {
    const subs = new Set<WatchdogRuntimeSubsystem>([
      ...this.config.requiredSubsystems,
      ...results.map((r) => r.subsystem),
    ]);
    for (const s of subs) {
      const rs = results.filter((r) => r.subsystem === s);
      const worst =
        rs.map((r) => stateFrom(r.observed)).sort((a, b) => stateRank[b] - stateRank[a])[0] ??
        'UNKNOWN';
      const prev = this.subsystem.get(s);
      const active = this.activeIncidents().filter((i) => i.subsystem === s);
      const snap: SubsystemHealthSnapshot = freeze({
        subsystem: s,
        healthState: worst,
        severity:
          rs.map((r) => r.severity).sort((a, b) => sevRank[b] - sevRank[a])[0] ??
          severityFor(worst),
        enabled: true,
        lastEvaluatedAtNs: now.toString(),
        lastHealthyAtNs: worst === 'HEALTHY' ? now.toString() : prev?.lastHealthyAtNs,
        lastFailureAtNs:
          stateRank[worst] >= stateRank.UNHEALTHY ? now.toString() : prev?.lastFailureAtNs,
        lastRecoveryAtNs: prev?.lastRecoveryAtNs,
        consecutiveFailures:
          stateRank[worst] >= stateRank.UNHEALTHY ? (prev?.consecutiveFailures ?? 0) + 1 : 0,
        failuresInWindow: active.length,
        warningCount: rs.filter((r) => r.observed === 'WARNING').length,
        errorCount: rs.filter((r) => r.observed === 'FAILURE').length,
        criticalCount: rs.filter((r) => r.observed === 'CRITICAL').length,
        activeIncidents: active,
        primaryReason: rs.find((r) => r.observed !== 'HEALTHY')?.reason ?? 'Subsystem healthy',
        supportingReasons: rs.map((r) => r.reason),
        metrics: Object.fromEntries(rs.map((r) => [r.ruleId, r.metrics])),
        recoveryState: 'IDLE',
        recoveryAttempts: this.recoveryAttempts.filter((a) => a.subsystem === s).length,
        recoveryBudgetRemaining: this.recoveryBudgetRemaining(s, now),
        dependencyHealth: {},
        stale: rs.some((r) => r.observed === 'UNKNOWN'),
        staleForNs: '0',
      });
      this.subsystem.set(s, snap);
    }
  }
  private calculateOverall(now: bigint): RuntimeHealthSnapshot {
    const subs = [...this.subsystem.values()];
    let overall: RuntimeHealthState = subs.length ? 'HEALTHY' : 'UNKNOWN';
    for (const s of subs) {
      const crit = this.config.subsystemCriticality[s.subsystem] ?? 'IMPORTANT';
      if (crit === 'OPTIONAL') continue;
      if (s.healthState === 'FAILED') {
        overall = 'FAILED';
        break;
      }
      if (s.healthState === 'CRITICAL') overall = stateRank[overall] < 4 ? 'CRITICAL' : overall;
      else if (s.healthState === 'UNHEALTHY' && stateRank[overall] < 3) overall = 'UNHEALTHY';
      else if (s.healthState === 'DEGRADED' && stateRank[overall] < 2) overall = 'DEGRADED';
      else if (s.healthState === 'UNKNOWN' && overall === 'HEALTHY') overall = 'UNKNOWN';
    }
    const prev = this.health;
    const t = now.toString();
    return freeze({
      runtimeId: this.engine.config.runtimeId,
      runtimeState: this.engine.lifecycleState,
      loopState: this.engine.getState(),
      overallHealth: overall,
      overallSeverity: severityFor(overall),
      evaluatedAtNs: t,
      lastHealthyAtNs: overall === 'HEALTHY' ? t : prev.lastHealthyAtNs,
      lastDegradedAtNs: overall === 'DEGRADED' ? t : prev.lastDegradedAtNs,
      lastUnhealthyAtNs: overall === 'UNHEALTHY' ? t : prev.lastUnhealthyAtNs,
      lastCriticalAtNs: overall === 'CRITICAL' ? t : prev.lastCriticalAtNs,
      currentFrameNumber: this.engine.currentFrameNumber.toString(),
      currentTickFrame: this.engine.telemetry.current().currentTickFrame,
      clockState: this.engine.telemetry.current().clockState,
      overloadState: this.engine.telemetry.current().currentOverloadState,
      activeIncidentCount: this.activeIncidents().length,
      unresolvedCriticalIncidentCount: this.activeIncidents().filter(
        (i) => i.severity === 'CRITICAL',
      ).length,
      recoveryInProgress: false,
      recoveryAttemptCount: this.recoveryAttempts.length,
      recoveryBudgetRemaining: this.recoveryBudgetRemaining('GLOBAL', now),
      subsystemHealth: subs,
      healthReasons: subs
        .filter((s) => s.healthState !== 'HEALTHY')
        .map((s) => `${s.subsystem}: ${s.primaryReason}`),
      recommendedOperatorActions: [
        ...new Set(this.activeIncidents().map((i) => i.recommendedAction)),
      ],
      lastFatalError: this.engine.telemetry.current().lastError,
      watchdogState: this.state,
      watchdogHeartbeatNs: this.heartbeatNs,
      telemetryFreshnessNs: (
        now -
        BigInt(
          this.engine.telemetry.current().lastWatchdogEvaluationNs ??
            this.engine.telemetry.current().lastLoopHeartbeatNs ??
            '0',
        )
      ).toString(),
      runtimeHeartbeatFreshnessNs: (
        now - BigInt(this.engine.telemetry.current().lastLoopHeartbeatNs || '0')
      ).toString(),
    });
  }
  private async recover(incidents: readonly WatchdogIncident[], now: bigint) {
    const attempts: RecoveryAttemptSnapshot[] = [];
    if (
      !this.config.recovery.enabled ||
      this.engine.lifecycleState === 'STOPPED' ||
      this.engine.lifecycleState === 'FAILED'
    )
      return attempts;
    for (const i of incidents.slice(0, this.config.maximumConcurrentRecoveries)) {
      if (
        i.recoveryAction === 'NONE' ||
        i.recoveryAction === 'RECORD_ONLY' ||
        this.recoveryBudgetRemaining(i.subsystem, now) <= 0
      )
        continue;
      const started = this.clock.nowNs();
      let success = false,
        message = 'recorded';
      try {
        await this.publish('RecoveryStarted', {
          incidentId: i.incidentId,
          action: i.recoveryAction,
        });
        if (i.recoveryAction === 'PAUSE_RUNTIME') {
          await this.engine.pause();
          success = true;
          message = 'runtime paused';
        } else if (i.recoveryAction === 'RESUME_RUNTIME') {
          await this.engine.resume();
          success = true;
          message = 'runtime resumed';
        } else if (i.recoveryAction === 'STOP_RUNTIME') {
          await this.engine.stop();
          success = true;
          message = 'runtime stopped';
        } else if (i.recoveryAction === 'FAIL_RUNTIME') {
          await this.engine.fail(new Error(`Watchdog recovery ${i.code}`));
          success = true;
          message = 'runtime failed by policy';
        } else if (i.recoveryAction === 'CLEAR_NONCRITICAL_DIAGNOSTICS') {
          this.diagnostics = [];
          success = true;
          message = 'diagnostics cleared';
        }
        const a = freeze({
          recoveryId: `recovery-${this.recoveryAttempts.length + 1}`,
          subsystem: i.subsystem,
          action: i.recoveryAction,
          incidentId: i.incidentId,
          startedAtNs: started.toString(),
          completedAtNs: this.clock.nowNs().toString(),
          success,
          message,
        });
        attempts.push(a);
        this.recoveryAttempts.push(a);
        await this.publish(success ? 'RecoverySucceeded' : 'RecoveryFailed', {
          recoveryId: a.recoveryId,
          message,
        });
      } catch (e) {
        const a = freeze({
          recoveryId: `recovery-${this.recoveryAttempts.length + 1}`,
          subsystem: i.subsystem,
          action: i.recoveryAction,
          incidentId: i.incidentId,
          startedAtNs: started.toString(),
          completedAtNs: this.clock.nowNs().toString(),
          success: false,
          message: truncate(String(e)),
        });
        attempts.push(a);
        this.recoveryAttempts.push(a);
        await this.publish('RecoveryFailed', { recoveryId: a.recoveryId, message: a.message });
      }
    }
    return attempts;
  }
  private recoveryBudgetRemaining(scope: RecoveryScope, now: bigint) {
    const policy =
      scope === 'GLOBAL'
        ? this.config.recovery
        : (this.config.subsystemRecovery[scope as WatchdogRuntimeSubsystem] ??
          this.config.recovery);
    const start = now - ns(policy.budgetWindowMs);
    const used = this.recoveryAttempts.filter(
      (a) => (scope === 'GLOBAL' || a.subsystem === scope) && BigInt(a.startedAtNs) >= start,
    ).length;
    return Math.max(0, policy.maximumAttemptsPerWindow - used);
  }
  private activeIncidents() {
    return [...this.incidents.values()].filter((i) => i.active);
  }
  private resolvedIncidents() {
    return [...this.incidents.values()].filter((i) => !i.active);
  }
  private enforceIncidentCapacity() {
    while (this.incidents.size > this.config.incidentRetentionCapacity) {
      const evict = [...this.incidents.values()]
        .filter((i) => !i.active)
        .sort((a, b) =>
          BigInt(a.resolvedAtNs ?? a.lastObservedAtNs) <
          BigInt(b.resolvedAtNs ?? b.lastObservedAtNs)
            ? -1
            : 1,
        )[0];
      if (!evict) break;
      this.incidents.delete(evict.incidentId);
    }
  }
  private recordDiagnostics(rules: readonly WatchdogRuleResult[], now: bigint) {
    this.diagnostics.push(this.buildDiagnostics(rules, now));
    this.diagnostics = this.diagnostics.slice(-this.config.diagnosticHistoryCapacity);
  }
  private buildDiagnostics(
    rules: readonly WatchdogRuleResult[],
    now: bigint,
  ): WatchdogDiagnosticsSnapshot {
    const t = this.engine.telemetry.current();
    return freeze({
      runtimeHealth: this.health,
      subsystemHealth: [...this.subsystem.values()],
      activeIncidents: this.activeIncidents(),
      recentResolvedIncidents: this.resolvedIncidents().slice(-32),
      recentRuleResults: rules.slice(-64),
      recentRecoveryAttempts: this.recoveryAttempts.slice(-32),
      recentTickHealthSummary: {
        entries: t.recentTickHealthWindow.length,
        overruns: t.totalTickOverruns,
        missedFrames: t.totalMissedFrames,
      },
      schedulerSummary: redactWatchdogValue(this.engine.scheduler.snapshot()) as Record<
        string,
        Json
      >,
      executorSummary: {
        active: t.activeCommandExecutions,
        failed: t.failedCommandExecutions,
        timedOut: t.timedOutCommandExecutions,
        historySize: t.executionHistorySize,
      },
      processorFrameworkSummary: redactWatchdogValue(
        this.engine.processors.getSnapshot(),
      ) as Record<string, Json>,
      clockSummary: {
        state: t.clockState,
        frame: t.currentFrameNumber,
        driftNs: t.currentDriftNs,
        latenessNs: t.currentLatenessNs,
      },
      loopSummary: {
        state: t.loopState,
        phase: t.currentLoopPhase,
        activeTick: t.activeTick,
        overload: t.currentOverloadState,
      },
      telemetryFreshnessNs: (now - BigInt(t.lastLoopHeartbeatNs || '0')).toString(),
      watchdogState: this.state,
      generatedAtNs: now.toString(),
    });
  }
  private emptyHealth(overall: RuntimeHealthState): RuntimeHealthSnapshot {
    const t = this.engine.telemetry.current();
    return freeze({
      runtimeId: this.engine.config.runtimeId,
      runtimeState: this.engine.lifecycleState,
      loopState: this.engine.getState(),
      overallHealth: overall,
      overallSeverity: severityFor(overall),
      evaluatedAtNs: this.clock.nowNs().toString(),
      currentFrameNumber: this.engine.currentFrameNumber.toString(),
      clockState: t.clockState,
      overloadState: t.currentOverloadState,
      activeIncidentCount: 0,
      unresolvedCriticalIncidentCount: 0,
      recoveryInProgress: false,
      recoveryAttemptCount: 0,
      recoveryBudgetRemaining: this.config.recovery.maximumAttemptsPerWindow,
      subsystemHealth: [],
      healthReasons: [],
      recommendedOperatorActions: [],
      lastFatalError: t.lastError,
      watchdogState: this.state,
      watchdogHeartbeatNs: this.heartbeatNs,
      telemetryFreshnessNs: '0',
      runtimeHeartbeatFreshnessNs: '0',
    });
  }
  private commitTelemetry(patch: Record<string, unknown>) {
    this.engine.telemetry.commit(patch as never);
  }
  private async publish(eventType: string, payload: Record<string, unknown>) {
    const pub = this.publisher ?? this.engine.context().events;
    try {
      await pub.publish({
        eventId: `${this.engine.config.runtimeId}:${eventType}:${this.sequence}:${this.clock.nowNs()}`,
        eventType: eventType as never,
        runtimeId: this.engine.config.runtimeId,
        timestamp: new Date(this.clock.nowMs()).toISOString(),
        payload: redactWatchdogValue(payload) as Record<string, unknown>,
      });
    } catch {
      this.commitTelemetry({
        eventPublisherFailures: this.engine.telemetry.current().eventPublisherFailures + 1,
      });
    }
  }
}
export const createRuntimeWatchdog = (
  engine: RuntimeExecutionEngine,
  config?: Partial<RuntimeWatchdogConfig>,
  clock?: RuntimeClock,
  rules?: readonly WatchdogHealthRule[],
  publisher?: RuntimeEventPublisher,
) => new RuntimeWatchdog(engine, config, clock, rules, publisher);
