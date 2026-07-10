/**
 * UBOS v5.1.1 deterministic runtime foundation public API.
 *
 * All clocks, event IDs, command ordering, processor ordering, and telemetry serialization are
 * defined here so downstream media systems can extend the runtime without bypassing lifecycle control.
 */
/** Public UBOS runtime execution-engine API. */
export type RuntimeLifecycleState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'RUNNING'
  | 'PAUSED'
  | 'DEGRADED'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED';
/** Public UBOS runtime execution-engine API. */
export type RuntimeHealthStatus = 'healthy' | 'degraded' | 'failed' | 'stopped';
/** Public UBOS runtime execution-engine API. */
export const RUNTIME_COMMAND_TYPES = [
  'RUNTIME_NOOP',
  'RUNTIME_BARRIER',
  'ENGINE_PAUSE',
  'ENGINE_RESUME',
  'ENGINE_STOP',
  'WORKER_START',
  'WORKER_STOP',
  'WORKER_RESTART',
] as const;
/** Public UBOS runtime execution-engine API. */
export type RuntimeCommandType = (typeof RUNTIME_COMMAND_TYPES)[number] | string;
/** Public UBOS runtime execution-engine API. */
export interface RationalFrameRate {
  numerator: number;
  denominator: number;
}
/** Public UBOS runtime execution-engine API. */
export type RuntimeFrameRate = RationalFrameRate;
/** Public UBOS runtime execution-engine API. */
export interface RuntimeEngineConfig {
  runtimeId: string;
  frameRate: RuntimeFrameRate;
  commandQueueCapacity: number;
  maximumCommandsPerTick: number;
  tickDeadlineWarningMs: number;
  watchdogTimeoutMs: number;
  telemetryIntervalMs: number;
  lateFrameToleranceNs: bigint;
  maximumCatchUpFrames: number;
  discontinuityThresholdNs: bigint;
  clockSpinThresholdNs: bigint;
  coarseSleepThresholdNs: bigint;
  failOnProcessorError: boolean;
  failOnCommandError: boolean;
}
/** Public UBOS runtime execution-engine API. */
export const defaultRuntimeEngineConfig = (runtimeId = 'ubos-runtime'): RuntimeEngineConfig => ({
  runtimeId,
  frameRate: { numerator: 30000, denominator: 1001 },
  commandQueueCapacity: 1024,
  maximumCommandsPerTick: 128,
  tickDeadlineWarningMs: 20,
  watchdogTimeoutMs: 1000,
  telemetryIntervalMs: 1000,
  lateFrameToleranceNs: 2_000_000n,
  maximumCatchUpFrames: 5,
  discontinuityThresholdNs: 500_000_000n,
  clockSpinThresholdNs: 500_000n,
  coarseSleepThresholdNs: 2_000_000n,
  failOnProcessorError: true,
  failOnCommandError: false,
});
/** Public UBOS runtime execution-engine API. */
export class RuntimeEngineError extends Error {
  /** Public UBOS runtime execution-engine API. */
  constructor(
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = code;
  }
}
/** Public UBOS runtime execution-engine API. */
export class InvalidLifecycleTransitionError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(from: RuntimeLifecycleState, to: RuntimeLifecycleState) {
    super('InvalidLifecycleTransition', `Invalid lifecycle transition from ${from} to ${to}`, {
      from,
      to,
    });
  }
}
/** Public UBOS runtime execution-engine API. */
export class InvalidEngineConfigurationError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(message: string) {
    super('InvalidEngineConfiguration', message);
  }
}
/** Public UBOS runtime execution-engine API. */
export class DuplicateCommandError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(id: string) {
    super('DuplicateCommand', `Duplicate command ${id}`, { id });
  }
}
/** Public UBOS runtime execution-engine API. */
export class CommandQueueFullError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(capacity: number) {
    super('CommandQueueFull', `Command queue capacity ${capacity} exceeded`, { capacity });
  }
}
/** Public UBOS runtime execution-engine API. */
export class CommandNotFoundError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(id: string) {
    super('CommandNotFound', `Command ${id} was not found`, { id });
  }
}
/** Public UBOS runtime execution-engine API. */
export class UnknownCommandTypeError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(type: string) {
    super('UnknownCommandType', `Unknown runtime command type ${type}`, { type });
  }
}
/** Public UBOS runtime execution-engine API. */
export class CommandExecutionFailedError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(id: string, cause: unknown) {
    super(
      'CommandExecutionFailed',
      `Command ${id} failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      { id, cause },
    );
  }
}
/** Public UBOS runtime execution-engine API. */
export class DuplicateProcessorError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(id: string) {
    super('DuplicateProcessor', `Duplicate processor ${id}`, { id });
  }
}
/** Public UBOS runtime execution-engine API. */
export class ProcessorExecutionFailedError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(id: string, cause: unknown) {
    super(
      'ProcessorExecutionFailed',
      `Processor ${id} failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      { id, cause },
    );
  }
}
/** Public UBOS runtime execution-engine API. */
export class RuntimeNotReadyError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor(state: RuntimeLifecycleState) {
    super('RuntimeNotReady', `Runtime is not ready from state ${state}`, { state });
  }
}
/** Public UBOS runtime execution-engine API. */
export class RuntimeAlreadyStoppedError extends RuntimeEngineError {
  /** Public UBOS runtime execution-engine API. */
  constructor() {
    super('RuntimeAlreadyStopped', 'Runtime is already stopped');
  }
}
/** Public UBOS runtime execution-engine API. */
export interface RuntimeCommand<TPayload = unknown> {
  id: string;
  type: RuntimeCommandType;
  payload: TPayload;
  sequence: bigint;
  priority: number;
  issuedAtNs: bigint;
  targetFrame?: bigint;
  correlationId?: string;
  source?: string;
  scheduledTimeNs?: bigint;
  delayFrames?: bigint;
  delayNs?: bigint;
  dependencies?: readonly string[];
  groupId?: string;
  expiresAtFrame?: bigint;
  expiresAtNs?: bigint;
  policy?: CommandExecutionPolicy;
}
/** Public UBOS runtime execution-engine API. */
export type CommandExecutionPolicy =
  | 'EXECUTE_ONCE'
  | 'EXECUTE_IF_PRESENT'
  | 'EXECUTE_UNTIL_SUCCESS'
  | 'DROP_IF_LATE'
  | 'RUN_IMMEDIATELY_IF_MISSED';
/** Public UBOS runtime execution-engine API. */
export type RuntimeCommandState =
  | 'CREATED'
  | 'QUEUED'
  | 'WAITING'
  | 'READY'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';
/** Public UBOS runtime execution-engine API. */
export interface ScheduledCommandRecord {
  readonly command: RuntimeCommand;
  readonly state: RuntimeCommandState;
  readonly queuedAtNs: bigint;
  readonly sequence: bigint;
  readonly dependencies: readonly string[];
  readonly groupId?: string;
  readonly attempts: number;
  readonly latenessFrames: bigint;
  readonly latenessNs: bigint;
}
/** Public UBOS runtime execution-engine API. */
export interface SchedulerSnapshot {
  readonly pendingCommands: number;
  readonly readyCommands: number;
  readonly waitingCommands: number;
  readonly completedCommands: number;
  readonly failedCommands: number;
  readonly cancelledCommands: number;
  readonly expiredCommands: number;
  readonly dependencyWaitCount: number;
  readonly maximumQueueDepth: number;
  readonly averageQueueLatencyNs: string;
  readonly maximumQueueLatencyNs: string;
}

/** Public UBOS runtime execution-engine API. */
export interface RuntimeLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
/** Public UBOS runtime execution-engine API. */
export interface RuntimeClock {
  nowMs(): number;
  nowNs(): bigint;
}
/** Public UBOS runtime execution-engine API. */
export const systemRuntimeClock: RuntimeClock = {
  nowMs: () => Date.now(),
  nowNs: () => BigInt(Date.now()) * 1_000_000n,
};
/** Public UBOS runtime execution-engine API. */
export type RuntimeEventType =
  | 'FrameClockStarted'
  | 'FrameClockPaused'
  | 'FrameClockResumed'
  | 'FrameClockStopped'
  | 'FrameClockReset'
  | 'FrameTickProduced'
  | 'FrameTickLate'
  | 'FrameFramesMissed'
  | 'FrameClockDiscontinuity'
  | 'FrameClockError'
  | 'RuntimeStateChanged'
  | 'RuntimeInitialized'
  | 'RuntimeStarted'
  | 'RuntimePaused'
  | 'RuntimeResumed'
  | 'RuntimeStopping'
  | 'RuntimeStopped'
  | 'RuntimeFailed'
  | 'RuntimeTickStarted'
  | 'RuntimeTickCompleted'
  | 'RuntimeTickOverrun'
  | 'CommandScheduled'
  | 'CommandQueued'
  | 'CommandReady'
  | 'CommandExecuting'
  | 'CommandStarted'
  | 'CommandCompleted'
  | 'CommandFailed'
  | 'CommandCancelled'
  | 'CommandExpired'
  | 'DependencySatisfied'
  | 'DependencyFailed'
  | 'SchedulerIdle'
  | 'SchedulerBusy'
  | 'ProcessorRegistered'
  | 'ProcessorStarted'
  | 'ProcessorCompleted'
  | 'ProcessorFailed'
  | 'WorkerHealthChanged';
/** Public UBOS runtime execution-engine API. */
export interface RuntimeEvent<TPayload = Record<string, unknown>> {
  eventId: string;
  eventType: RuntimeEventType;
  runtimeId: string;
  timestamp: string;
  frameNumber?: string;
  correlationId?: string;
  payload: TPayload;
}
/** Public UBOS runtime execution-engine API. */
export interface RuntimeEventPublisher {
  /** Public UBOS runtime execution-engine API. */
  publish(event: RuntimeEvent): void | Promise<void>;
}
/** Public UBOS runtime execution-engine API. */
export class InMemoryRuntimeEventPublisher implements RuntimeEventPublisher {
  readonly events: RuntimeEvent[] = [];
  /** Public UBOS runtime execution-engine API. */
  publish(event: RuntimeEvent) {
    this.events.push(Object.freeze(event));
  }
}
/** Public UBOS runtime execution-engine API. */
export interface RuntimeTelemetrySnapshot {
  runtimeId: string;
  state: RuntimeLifecycleState;
  frameNumber: string;
  startedAt?: string;
  uptimeMs: number;
  lastTickStartedAt?: string;
  lastTickCompletedAt?: string;
  lastTickDurationMs: number;
  maximumTickDurationMs: number;
  totalTicks: number;
  lateTicks: number;
  droppedTicks: number;
  pendingCommands: number;
  readyCommands: number;
  waitingCommands: number;
  completedCommands: number;
  failedCommands: number;
  cancelledCommands: number;
  expiredCommands: number;
  averageQueueLatencyNs: string;
  maximumQueueLatencyNs: string;
  dependencyWaitCount: number;
  commandsExecutedPerSecond: number;
  maximumQueueDepth: number;
  commandsExecuted: number;
  commandsFailed: number;
  processorExecutions: number;
  processorFailures: number;
  lastError?: string;
  healthStatus: RuntimeHealthStatus;
  configuredFrameRate: { numerator: number; denominator: number; label: string };
  currentFrameNumber: string;
  scheduledFrameTimeNs: string;
  actualFrameTimeNs: string;
  frameDurationNs: string;
  currentDriftNs: string;
  maximumAbsoluteDriftNs: string;
  currentLatenessNs: string;
  maximumLatenessNs: string;
  totalLateFrames: number;
  totalMissedFrames: string;
  clockDiscontinuities: number;
  clockStartedAtNs?: string;
  clockState: FrameClockState;
  effectiveFrameRate: number;
  averageTickIntervalNs: string;
}
/** Public UBOS runtime execution-engine API. */
export class RuntimeTelemetryCollector {
  private snapshot: RuntimeTelemetrySnapshot;
  /** Public UBOS runtime execution-engine API. */
  constructor(runtimeId: string) {
    this.snapshot = {
      runtimeId,
      state: 'CREATED',
      frameNumber: '0',
      uptimeMs: 0,
      lastTickDurationMs: 0,
      maximumTickDurationMs: 0,
      totalTicks: 0,
      lateTicks: 0,
      droppedTicks: 0,
      pendingCommands: 0,
      readyCommands: 0,
      waitingCommands: 0,
      completedCommands: 0,
      failedCommands: 0,
      cancelledCommands: 0,
      expiredCommands: 0,
      averageQueueLatencyNs: '0',
      maximumQueueLatencyNs: '0',
      dependencyWaitCount: 0,
      commandsExecutedPerSecond: 0,
      maximumQueueDepth: 0,
      commandsExecuted: 0,
      commandsFailed: 0,
      processorExecutions: 0,
      processorFailures: 0,
      healthStatus: 'stopped',
      configuredFrameRate: { numerator: 30000, denominator: 1001, label: '29.97' },
      currentFrameNumber: '0',
      scheduledFrameTimeNs: '0',
      actualFrameTimeNs: '0',
      frameDurationNs: '0',
      currentDriftNs: '0',
      maximumAbsoluteDriftNs: '0',
      currentLatenessNs: '0',
      maximumLatenessNs: '0',
      totalLateFrames: 0,
      totalMissedFrames: '0',
      clockDiscontinuities: 0,
      clockState: 'CREATED',
      effectiveFrameRate: 0,
      averageTickIntervalNs: '0',
    };
  }
  /** Public UBOS runtime execution-engine API. */
  commit(patch: Partial<RuntimeTelemetrySnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    return this.current();
  }
  /** Public UBOS runtime execution-engine API. */
  current() {
    return Object.freeze({ ...this.snapshot });
  }
}

/** Public UBOS runtime execution-engine API. */
export type FrameClockState = 'CREATED' | 'RUNNING' | 'PAUSED' | 'STOPPED';
/** Public UBOS runtime execution-engine API. */
export interface MonotonicTimeSource {
  nowNs(): bigint;
}
/** Public UBOS runtime execution-engine API. */
export interface FrameWaitStrategy {
  waitUntil(
    deadlineNs: bigint,
    timeSource: MonotonicTimeSource,
    signal?: AbortSignal,
  ): Promise<void>;
}
const NS_PER_SECOND = 1_000_000_000n;
export const supportedRationalFrameRates: readonly RationalFrameRate[] = Object.freeze([
  { numerator: 24000, denominator: 1001 },
  { numerator: 24, denominator: 1 },
  { numerator: 25, denominator: 1 },
  { numerator: 30000, denominator: 1001 },
  { numerator: 30, denominator: 1 },
  { numerator: 50, denominator: 1 },
  { numerator: 60000, denominator: 1001 },
  { numerator: 60, denominator: 1 },
]);
export class FrameClockError extends RuntimeEngineError {}
export class InvalidFrameRateError extends FrameClockError {
  constructor(message: string) {
    super('InvalidFrameRate', message);
  }
}
export class InvalidFrameClockTransitionError extends FrameClockError {
  constructor(from: FrameClockState, to: FrameClockState) {
    super('InvalidFrameClockTransition', `Invalid frame clock transition from ${from} to ${to}`, {
      from,
      to,
    });
  }
}
export class FrameClockNotRunningError extends FrameClockError {
  constructor(state: FrameClockState) {
    super('FrameClockNotRunning', `Frame clock is not running from state ${state}`, { state });
  }
}
export class FrameClockAlreadyRunningError extends FrameClockError {
  constructor() {
    super('FrameClockAlreadyRunning', 'Frame clock is already running');
  }
}
export class FrameClockStoppedError extends FrameClockError {
  constructor() {
    super('FrameClockStopped', 'Frame clock is stopped');
  }
}
export class FrameClockWaitCancelledError extends FrameClockError {
  constructor() {
    super('FrameClockWaitCancelled', 'Frame clock wait was cancelled');
  }
}
export class InvalidFrameNumberError extends FrameClockError {
  constructor(frameNumber: bigint) {
    super('InvalidFrameNumber', 'Frame number cannot be negative', {
      frameNumber: frameNumber.toString(),
    });
  }
}
export class InvalidClockConfigurationError extends FrameClockError {
  constructor(message: string) {
    super('InvalidClockConfiguration', message);
  }
}
export class TimeSourceMovedBackwardError extends FrameClockError {
  constructor(previous: bigint, current: bigint) {
    super('TimeSourceMovedBackward', 'Monotonic time source moved backward', {
      previous: previous.toString(),
      current: current.toString(),
    });
  }
}
export const validateRationalFrameRate = (rate: RationalFrameRate): RationalFrameRate => {
  for (const [name, value] of Object.entries(rate))
    if (!Number.isSafeInteger(value) || value <= 0)
      throw new InvalidFrameRateError(`${name} must be a positive safe integer`);
  return Object.freeze({ numerator: rate.numerator, denominator: rate.denominator });
};
export const rationalFrameRatesEqual = (a: RationalFrameRate, b: RationalFrameRate) =>
  BigInt(a.numerator) * BigInt(b.denominator) === BigInt(b.numerator) * BigInt(a.denominator);
export const framesPerSecond = (rate: RationalFrameRate) =>
  validateRationalFrameRate(rate).numerator / rate.denominator;
export const frameRateLabel = (rate: RationalFrameRate) =>
  rationalFrameRatesEqual(rate, { numerator: 24000, denominator: 1001 })
    ? '23.976'
    : rationalFrameRatesEqual(rate, { numerator: 30000, denominator: 1001 })
      ? '29.97'
      : rationalFrameRatesEqual(rate, { numerator: 60000, denominator: 1001 })
        ? '59.94'
        : String(framesPerSecond(rate));
export const frameDurationNs = (rate: RationalFrameRate) =>
  (NS_PER_SECOND * BigInt(validateRationalFrameRate(rate).denominator)) / BigInt(rate.numerator);
export const frameNumberToTimestampNs = (frameNumber: bigint, rate: RationalFrameRate) => {
  if (frameNumber < 0n) throw new InvalidFrameNumberError(frameNumber);
  return (
    (frameNumber * NS_PER_SECOND * BigInt(validateRationalFrameRate(rate).denominator)) /
    BigInt(rate.numerator)
  );
};
export const timestampNsToFrameNumber = (timestampNs: bigint, rate: RationalFrameRate) => {
  if (timestampNs < 0n) throw new InvalidClockConfigurationError('timestamp cannot be negative');
  return (
    (timestampNs * BigInt(validateRationalFrameRate(rate).numerator)) /
    (NS_PER_SECOND * BigInt(rate.denominator))
  );
};
export class NodeMonotonicTimeSource implements MonotonicTimeSource {
  nowNs() {
    return BigInt(Math.floor(performance.now() * 1_000_000));
  }
}
export class AsyncTimerFrameWaitStrategy implements FrameWaitStrategy {
  async waitUntil(deadlineNs: bigint, timeSource: MonotonicTimeSource, signal?: AbortSignal) {
    const delayMs = Number((deadlineNs - timeSource.nowNs()) / 1_000_000n);
    if (delayMs <= 0) return;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, delayMs);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(t);
          reject(new FrameClockWaitCancelledError());
        },
        { once: true },
      );
    });
  }
}
export class FakeMonotonicTimeSource implements MonotonicTimeSource {
  constructor(private currentNs = 0n) {}
  nowNs() {
    return this.currentNs;
  }
  setNowNs(ns: bigint) {
    this.currentNs = ns;
  }
  advanceNs(ns: bigint) {
    this.currentNs += ns;
  }
  advanceMs(ms: number) {
    this.advanceNs(BigInt(ms) * 1_000_000n);
  }
  advanceByFrames(frames: bigint, rate: RationalFrameRate) {
    this.advanceNs(frameNumberToTimestampNs(frames, rate));
  }
  advanceTo(ns: bigint) {
    this.currentNs = ns;
  }
  simulateLateWakeup(ns: bigint) {
    this.advanceNs(ns);
  }
  simulateLargeTimeJump(ns: bigint) {
    this.advanceNs(ns);
  }
}
export class ImmediateFrameWaitStrategy implements FrameWaitStrategy {
  async waitUntil() {}
}
export interface MasterFrameClockConfig {
  frameRate: RationalFrameRate;
  timeSource?: MonotonicTimeSource;
  waitStrategy?: FrameWaitStrategy;
  lateFrameToleranceNs?: bigint;
  maximumCatchUpFrames?: number;
  discontinuityThresholdNs?: bigint;
}

/** Public UBOS runtime execution-engine API. */
export interface RuntimeContext {
  readonly runtimeId: string;
  readonly state: RuntimeLifecycleState;
  readonly frameNumber: bigint;
  readonly monotonicTimeNs: bigint;
  readonly config: Readonly<RuntimeEngineConfig>;
  readonly logger: RuntimeLogger;
  readonly events: RuntimeEventPublisher;
  readonly telemetry: RuntimeTelemetryCollector;
  readonly shutdownSignal: AbortSignal;
  readonly services: ReadonlyMap<string, unknown>;
}
/** Public UBOS runtime execution-engine API. */
export interface FrameTick {
  /** Logical frame being executed; UBOS v5.1.2 emits frame 1 after one complete frame interval. */
  frameNumber: bigint;
  /** Backward-compatible alias for actualTimeNs. */
  startedAtNs: bigint;
  /** Backward-compatible alias for scheduledTimeNs. */
  deadlineAtNs: bigint;
  /** Absolute monotonic deadline for this frame. */
  scheduledTimeNs: bigint;
  /** Monotonic time when the tick was produced. */
  actualTimeNs: bigint;
  /** Media timeline timestamp for this frame relative to the clock epoch. */
  presentationTimeNs: bigint;
  /** Floor of one rational frame duration for diagnostics only. */
  frameDurationNs: bigint;
  /** actualTimeNs - scheduledTimeNs. */
  driftNs: bigint;
  /** Positive amount by which execution missed its deadline. */
  latenessNs: bigint;
  /** True when lateness exceeds configured tolerance. */
  late: boolean;
  /** Frame boundaries skipped since the previous emitted tick. */
  missedFrames: bigint;
  /** True after pause/resume/reset, severe delay, or time-source jump. */
  discontinuity: boolean;
}

/** Public UBOS runtime execution-engine API. */
export interface MasterFrameClock {
  readonly state: FrameClockState;
  readonly frameRate: RationalFrameRate;
  readonly currentFrame: bigint;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  reset(): void;
  nextTick(): Promise<FrameTick>;
  createTickAt(nowNs: bigint): FrameTick;
  getDeadlineForFrame(frameNumber: bigint): bigint;
}
/** Public UBOS runtime execution-engine API. */
export class RationalMasterFrameClock implements MasterFrameClock {
  readonly frameRate: RationalFrameRate;
  private readonly timeSource: MonotonicTimeSource;
  private readonly waitStrategy: FrameWaitStrategy;
  private readonly lateFrameToleranceNs: bigint;
  private readonly maximumCatchUpFrames: number;
  private readonly discontinuityThresholdNs: bigint;
  private abort = new AbortController();
  private epochNs = 0n;
  private nextFrame = 1n;
  private lastEmittedFrame = 0n;
  private lastNowNs: bigint | undefined;
  private markDiscontinuity = false;
  #state: FrameClockState = 'CREATED';
  constructor(config: MasterFrameClockConfig) {
    this.frameRate = validateRationalFrameRate(config.frameRate);
    this.timeSource = config.timeSource ?? new NodeMonotonicTimeSource();
    this.waitStrategy = config.waitStrategy ?? new AsyncTimerFrameWaitStrategy();
    this.lateFrameToleranceNs = config.lateFrameToleranceNs ?? 2_000_000n;
    this.maximumCatchUpFrames = config.maximumCatchUpFrames ?? 5;
    this.discontinuityThresholdNs = config.discontinuityThresholdNs ?? 500_000_000n;
    if (this.maximumCatchUpFrames < 0 || !Number.isSafeInteger(this.maximumCatchUpFrames))
      throw new InvalidClockConfigurationError(
        'maximumCatchUpFrames must be a non-negative safe integer',
      );
  }
  get state() {
    return this.#state;
  }
  get currentFrame() {
    return this.lastEmittedFrame;
  }
  start() {
    if (this.#state === 'RUNNING') throw new FrameClockAlreadyRunningError();
    if (this.#state === 'STOPPED') throw new FrameClockStoppedError();
    if (this.#state !== 'CREATED')
      throw new InvalidFrameClockTransitionError(this.#state, 'RUNNING');
    this.epochNs = this.timeSource.nowNs();
    this.nextFrame = 1n;
    this.lastEmittedFrame = 0n;
    this.lastNowNs = this.epochNs;
    this.abort = new AbortController();
    this.#state = 'RUNNING';
  }
  pause() {
    if (this.#state !== 'RUNNING')
      throw new InvalidFrameClockTransitionError(this.#state, 'PAUSED');
    this.#state = 'PAUSED';
    this.markDiscontinuity = true;
  }
  resume() {
    if (this.#state !== 'PAUSED')
      throw new InvalidFrameClockTransitionError(this.#state, 'RUNNING');
    const now = this.timeSource.nowNs();
    this.epochNs = now - frameNumberToTimestampNs(this.nextFrame - 1n, this.frameRate);
    this.lastNowNs = now;
    this.#state = 'RUNNING';
    this.markDiscontinuity = true;
  }
  stop() {
    if (this.#state === 'STOPPED') return;
    this.abort.abort();
    this.#state = 'STOPPED';
  }
  reset() {
    if (this.#state === 'RUNNING')
      throw new InvalidFrameClockTransitionError(this.#state, 'CREATED');
    this.epochNs = 0n;
    this.nextFrame = 1n;
    this.lastEmittedFrame = 0n;
    this.lastNowNs = undefined;
    this.markDiscontinuity = true;
    this.abort = new AbortController();
    this.#state = 'CREATED';
  }
  async nextTick() {
    if (this.#state === 'STOPPED') throw new FrameClockStoppedError();
    if (this.#state !== 'RUNNING') throw new FrameClockNotRunningError(this.#state);
    const deadline = this.getDeadlineForFrame(this.nextFrame);
    await this.waitStrategy.waitUntil(deadline, this.timeSource, this.abort.signal);
    if ((this.#state as FrameClockState) === 'STOPPED') throw new FrameClockWaitCancelledError();
    return this.createTickAt(this.timeSource.nowNs());
  }
  getDeadlineForFrame(frameNumber: bigint) {
    if (frameNumber < 0n) throw new InvalidFrameNumberError(frameNumber);
    return this.epochNs + frameNumberToTimestampNs(frameNumber, this.frameRate);
  }
  createTickAt(nowNs: bigint) {
    if (this.#state !== 'RUNNING') throw new FrameClockNotRunningError(this.#state);
    if (this.lastNowNs !== undefined && nowNs < this.lastNowNs)
      throw new TimeSourceMovedBackwardError(this.lastNowNs, nowNs);
    const timelineFrame = timestampNsToFrameNumber(
      nowNs - this.epochNs > 0n ? nowNs - this.epochNs : 0n,
      this.frameRate,
    );
    const frameNumber = timelineFrame > this.nextFrame ? timelineFrame : this.nextFrame;
    const scheduledTimeNs = this.getDeadlineForFrame(frameNumber);
    const presentationTimeNs = frameNumberToTimestampNs(frameNumber, this.frameRate);
    const driftNs = nowNs - scheduledTimeNs;
    const latenessNs = driftNs > 0n ? driftNs : 0n;
    const skipped =
      frameNumber > this.lastEmittedFrame + 1n ? frameNumber - this.lastEmittedFrame - 1n : 0n;
    const missedFrames = skipped > BigInt(this.maximumCatchUpFrames) ? skipped : skipped;
    const tick = Object.freeze({
      frameNumber,
      startedAtNs: nowNs,
      deadlineAtNs: scheduledTimeNs,
      scheduledTimeNs,
      actualTimeNs: nowNs,
      presentationTimeNs,
      frameDurationNs: frameDurationNs(this.frameRate),
      driftNs,
      latenessNs,
      late: latenessNs > this.lateFrameToleranceNs,
      missedFrames,
      discontinuity: this.markDiscontinuity || latenessNs > this.discontinuityThresholdNs,
    }) satisfies FrameTick;
    this.lastEmittedFrame = frameNumber;
    this.nextFrame = frameNumber + 1n;
    this.lastNowNs = nowNs;
    this.markDiscontinuity = false;
    return tick;
  }
}
export const createMasterFrameClock = (config: MasterFrameClockConfig) =>
  new RationalMasterFrameClock(config);

/** Public UBOS runtime execution-engine API. */
export type RuntimeCommandHandler<T extends RuntimeCommand = RuntimeCommand> = (
  command: T,
  context: RuntimeContext,
) => void | Promise<void>;
/** Public UBOS runtime execution-engine API. */
export class CommandHandlerRegistry {
  private handlers = new Map<string, RuntimeCommandHandler>();
  /** Public UBOS runtime execution-engine API. */
  register(type: string, handler: RuntimeCommandHandler) {
    if (this.handlers.has(type))
      throw new RuntimeEngineError(
        'DuplicateCommandHandler',
        `Handler already registered for ${type}`,
      );
    this.handlers.set(type, handler);
  }
  /** Public UBOS runtime execution-engine API. */
  unregister(type: string) {
    return this.handlers.delete(type);
  }
  /** Public UBOS runtime execution-engine API. */
  resolve(type: string) {
    const h = this.handlers.get(type);
    if (!h) throw new UnknownCommandTypeError(type);
    return h;
  }
  /** Public UBOS runtime execution-engine API. */
  has(type: string) {
    return this.handlers.has(type);
  }
}
const cloneCommand = <T extends RuntimeCommand>(c: T): T =>
  deepFreeze({ ...c, payload: structuredCloneSafe(c.payload) }) as T;
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
};
const structuredCloneSafe = <T>(v: T): T =>
  typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v));
const targetOf = (c: RuntimeCommand) => c.targetFrame ?? 0n;
/** Public UBOS runtime execution-engine API. */
export class MissingDependencyError extends RuntimeEngineError {
  constructor(id: string, dependencyId: string) {
    super('MissingDependency', `Command ${id} depends on missing command ${dependencyId}`, {
      id,
      dependencyId,
    });
  }
}
export class DependencyCycleError extends RuntimeEngineError {
  constructor(ids: readonly string[]) {
    super('DependencyCycle', `Dependency cycle detected: ${ids.join(' -> ')}`, { ids });
  }
}
export class SchedulerOverflowError extends CommandQueueFullError {
  constructor(capacity: number) {
    super(capacity);
    this.name = 'SchedulerOverflow';
  }
}
export class InvalidPolicyError extends RuntimeEngineError {
  constructor(policy: string) {
    super('InvalidPolicy', `Invalid execution policy ${policy}`, { policy });
  }
}
export class InvalidPriorityError extends RuntimeEngineError {
  constructor(priority: number) {
    super('InvalidPriority', `Invalid command priority ${priority}`, { priority });
  }
}
export class CommandExpiredError extends RuntimeEngineError {
  constructor(id: string) {
    super('CommandExpired', `Command ${id} expired`, { id });
  }
}
export class InvalidCommandStateError extends RuntimeEngineError {
  constructor(id: string, from: RuntimeCommandState, to: RuntimeCommandState) {
    super('InvalidCommandState', `Invalid command state transition for ${id}: ${from} -> ${to}`, {
      id,
      from,
      to,
    });
  }
}
const policies = new Set<CommandExecutionPolicy>([
  'EXECUTE_ONCE',
  'EXECUTE_IF_PRESENT',
  'EXECUTE_UNTIL_SUCCESS',
  'DROP_IF_LATE',
  'RUN_IMMEDIATELY_IF_MISSED',
]);
const terminalStates = new Set<RuntimeCommandState>([
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
]);
const schedulerTransitions: Record<RuntimeCommandState, readonly RuntimeCommandState[]> = {
  CREATED: ['QUEUED'],
  QUEUED: ['WAITING', 'READY', 'CANCELLED', 'EXPIRED'],
  WAITING: ['READY', 'CANCELLED', 'EXPIRED', 'FAILED'],
  READY: ['EXECUTING', 'CANCELLED', 'EXPIRED'],
  EXECUTING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: ['READY'],
  CANCELLED: [],
  EXPIRED: [],
};
const effectiveTarget = (c: RuntimeCommand, nowFrame: bigint) =>
  c.targetFrame ?? (c.delayFrames !== undefined ? nowFrame + c.delayFrames : 0n);
const effectiveTime = (c: RuntimeCommand, nowNs: bigint) =>
  c.scheduledTimeNs ?? (c.delayNs !== undefined ? nowNs + c.delayNs : 0n);
/** Public UBOS runtime execution-engine API. */
export class DeterministicCommandScheduler {
  private records = new Map<string, ScheduledCommandRecord>();
  private sequences = new Set<string>();
  private completed = new Set<string>();
  private failed = new Set<string>();
  private cancelled = new Set<string>();
  private expired = new Set<string>();
  private draining = false;
  private depthMax = 0;
  private totalLatencyNs = 0n;
  private maxLatencyNs = 0n;
  private latencySamples = 0n;
  /** Public UBOS runtime execution-engine API. */
  constructor(
    private capacity: number,
    private currentFrame: () => bigint = () => 0n,
    private currentTimeNs: () => bigint = () => 0n,
  ) {}
  private transition(r: ScheduledCommandRecord, state: RuntimeCommandState) {
    if (r.state === state) return r;
    if (!schedulerTransitions[r.state].includes(state))
      throw new InvalidCommandStateError(r.command.id, r.state, state);
    const next = Object.freeze({ ...r, state });
    this.records.set(r.command.id, next);
    return next;
  }
  /** Public UBOS runtime execution-engine API. */
  schedule(command: RuntimeCommand) {
    if ((command.targetFrame ?? 0n) < 0n)
      throw new RuntimeEngineError(
        'InvalidCommandTargetFrame',
        'Command targetFrame cannot be negative',
      );
    if (!Number.isFinite(command.priority)) throw new InvalidPriorityError(command.priority);
    const policy = command.policy ?? 'EXECUTE_ONCE';
    if (!policies.has(policy)) throw new InvalidPolicyError(String(command.policy));
    if (
      this.records.has(command.id) ||
      this.completed.has(command.id) ||
      this.failed.has(command.id) ||
      this.cancelled.has(command.id) ||
      this.expired.has(command.id)
    )
      throw new DuplicateCommandError(command.id);
    const seqKey = command.sequence.toString();
    if (this.sequences.has(seqKey)) throw new DuplicateCommandError(`sequence:${seqKey}`);
    if (this.records.size >= this.capacity) throw new SchedulerOverflowError(this.capacity);
    const base = cloneCommand({
      ...command,
      policy,
      targetFrame: effectiveTarget(command, this.currentFrame()),
      scheduledTimeNs: effectiveTime(command, this.currentTimeNs()),
    });
    const deps = [...new Set(base.dependencies ?? [])].sort();
    if (deps.includes(base.id)) throw new DependencyCycleError([base.id, base.id]);
    const rec = Object.freeze({
      command: base,
      state: 'QUEUED' as RuntimeCommandState,
      queuedAtNs: this.currentTimeNs(),
      sequence: base.sequence,
      dependencies: Object.freeze(deps),
      ...(base.groupId ? { groupId: base.groupId } : {}),
      attempts: 0,
      latenessFrames: 0n,
      latenessNs: 0n,
    });
    this.records.set(base.id, rec);
    this.sequences.add(seqKey);
    this.depthMax = Math.max(this.depthMax, this.records.size);
    this.detectCyclesFrom(base.id);
    return cloneCommand(base);
  }
  scheduleForNextFrame(command: RuntimeCommand) {
    return this.schedule({ ...command, targetFrame: this.currentFrame() + 1n });
  }
  private detectCyclesFrom(rootId: string) {
    const visiting = new Set<string>();
    const path: string[] = [];
    const visit = (id: string) => {
      if (visiting.has(id)) throw new DependencyCycleError([...path.slice(path.indexOf(id)), id]);
      const r = this.records.get(id);
      if (!r) return;
      visiting.add(id);
      path.push(id);
      for (const d of r.dependencies) if (this.records.has(d)) visit(d);
      path.pop();
      visiting.delete(id);
    };
    visit(rootId);
  }
  private isExpired(r: ScheduledCommandRecord, frame: bigint, nowNs: bigint) {
    return (
      (r.command.expiresAtFrame !== undefined && r.command.expiresAtFrame < frame) ||
      (r.command.expiresAtNs !== undefined && r.command.expiresAtNs < nowNs)
    );
  }
  private due(r: ScheduledCommandRecord, frame: bigint, nowNs: bigint) {
    return targetOf(r.command) <= frame && (r.command.scheduledTimeNs ?? 0n) <= nowNs;
  }
  private ready(r: ScheduledCommandRecord) {
    return r.dependencies.every((d) => this.completed.has(d));
  }
  /** Public UBOS runtime execution-engine API. */
  getDueCommands(frameNumber: bigint, nowNs: bigint = this.currentTimeNs()) {
    return this.collectDue(frameNumber, nowNs).commands;
  }
  collectDue(frameNumber: bigint, nowNs: bigint = this.currentTimeNs()) {
    if (this.draining)
      return {
        commands: [],
        readyIds: [],
        expiredIds: [],
        failedDependencyIds: [],
        dependencySatisfied: [],
      };
    this.draining = true;
    const readyIds: string[] = [],
      expiredIds: string[] = [],
      failedDependencyIds: string[] = [],
      dependencySatisfied: string[] = [];
    try {
      for (const r of [...this.records.values()].sort(compareRecords)) {
        if (
          this.isExpired(r, frameNumber, nowNs) ||
          (r.command.policy === 'DROP_IF_LATE' && targetOf(r.command) < frameNumber)
        ) {
          this.records.delete(r.command.id);
          this.sequences.delete(r.sequence.toString());
          this.expired.add(r.command.id);
          expiredIds.push(r.command.id);
          continue;
        }
        if (
          r.dependencies.some(
            (d) => this.failed.has(d) || this.cancelled.has(d) || this.expired.has(d),
          )
        ) {
          this.records.delete(r.command.id);
          this.sequences.delete(r.sequence.toString());
          this.failed.add(r.command.id);
          failedDependencyIds.push(r.command.id);
          continue;
        }
        if (this.due(r, frameNumber, nowNs)) this.transition(r, 'WAITING');
      }
      const candidates = new Map(
        [...this.records.values()]
          .filter((r) => r.state === 'WAITING')
          .map((r) => [r.command.id, r]),
      );
      for (const r of [...candidates.values()].sort(compareRecords)) {
        const missing = r.dependencies.find(
          (d) =>
            !this.completed.has(d) &&
            !this.failed.has(d) &&
            !this.cancelled.has(d) &&
            !this.expired.has(d) &&
            !this.records.has(d),
        );
        if (missing) {
          this.records.delete(r.command.id);
          this.sequences.delete(r.sequence.toString());
          this.failed.add(r.command.id);
          candidates.delete(r.command.id);
          failedDependencyIds.push(r.command.id);
        }
      }
      const due = [...candidates.values()]
        .filter((r) => r.dependencies.every((d) => this.completed.has(d)))
        .sort(compareRecords);
      for (const r of due) {
        this.transition(r, 'READY');
        this.records.delete(r.command.id);
        this.sequences.delete(r.sequence.toString());
        readyIds.push(r.command.id);
        if (r.dependencies.length) dependencySatisfied.push(r.command.id);
        const latency = nowNs - r.queuedAtNs;
        this.totalLatencyNs += latency;
        this.maxLatencyNs = latency > this.maxLatencyNs ? latency : this.maxLatencyNs;
        this.latencySamples++;
      }
      return {
        commands: due.map((r) => cloneCommand(r.command)),
        readyIds,
        expiredIds,
        failedDependencyIds,
        dependencySatisfied,
      };
    } finally {
      this.draining = false;
    }
  }
  markCompleted(id: string) {
    const r = this.records.get(id);
    if (r) {
      this.records.delete(id);
      this.sequences.delete(r.sequence.toString());
    }
    this.completed.add(id);
  }
  markFailed(id: string) {
    const r = this.records.get(id);
    if (r) {
      this.records.delete(id);
      this.sequences.delete(r.sequence.toString());
    }
    this.failed.add(id);
  }
  cancel(commandId: string) {
    const c = this.cancelIds([commandId])[0];
    if (!c) throw new CommandNotFoundError(commandId);
    return c;
  }
  cancelIds(ids: readonly string[]) {
    const out: RuntimeCommand[] = [];
    for (const id of [...ids].sort()) {
      const r = this.records.get(id);
      if (!r) continue;
      this.records.delete(id);
      this.sequences.delete(r.sequence.toString());
      this.cancelled.add(id);
      out.push(cloneCommand(r.command));
    }
    return out;
  }
  cancelGroup(groupId: string) {
    return this.cancelIds(
      [...this.records.values()].filter((r) => r.groupId === groupId).map((r) => r.command.id),
    );
  }
  cancelSubtree(commandId: string) {
    const ids = new Set([commandId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const r of this.records.values())
        if (r.dependencies.some((d) => ids.has(d)) && !ids.has(r.command.id)) {
          ids.add(r.command.id);
          changed = true;
        }
    }
    return this.cancelIds([...ids]);
  }
  cancelDependencyChain(commandId: string) {
    const ids = new Set<string>();
    const visit = (id: string) => {
      const r = this.records.get(id);
      if (!r) return;
      ids.add(id);
      for (const d of r.dependencies) visit(d);
    };
    visit(commandId);
    return this.cancelIds([...ids]);
  }
  has(id: string) {
    return this.records.has(id);
  }
  pendingCount() {
    return this.records.size;
  }
  clear() {
    this.records.clear();
    this.sequences.clear();
  }
  inspectPendingCommands() {
    return [...this.records.values()].sort(compareRecords).map((r) => cloneCommand(r.command));
  }
  listPending() {
    return this.inspectPendingCommands();
  }
  listWaiting() {
    return [...this.records.values()]
      .filter((r) => r.state === 'WAITING')
      .sort(compareRecords)
      .map((r) => cloneCommand(r.command));
  }
  listReady() {
    return [...this.records.values()]
      .filter((r) => r.state === 'READY')
      .sort(compareRecords)
      .map((r) => cloneCommand(r.command));
  }
  lookupById(id: string) {
    const r = this.records.get(id);
    return r ? Object.freeze({ ...r, command: cloneCommand(r.command) }) : undefined;
  }
  lookupByGroup(groupId: string) {
    return [...this.records.values()]
      .filter((r) => r.groupId === groupId)
      .sort(compareRecords)
      .map((r) => cloneCommand(r.command));
  }
  lookupByDependency(dependencyId: string) {
    return [...this.records.values()]
      .filter((r) => r.dependencies.includes(dependencyId))
      .sort(compareRecords)
      .map((r) => cloneCommand(r.command));
  }

  /** Public UBOS runtime execution-engine API. */
  assertInvariants() {
    const activeIds = new Set<string>();
    for (const r of this.records.values()) {
      if (activeIds.has(r.command.id))
        throw new RuntimeEngineError(
          'SchedulerInvariantViolation',
          `Duplicate active command ${r.command.id}`,
        );
      activeIds.add(r.command.id);
      if (terminalStates.has(r.state))
        throw new RuntimeEngineError(
          'SchedulerInvariantViolation',
          `Terminal command ${r.command.id} remains active`,
        );
      if (r.state === 'READY' && !this.ready(r))
        throw new RuntimeEngineError(
          'SchedulerInvariantViolation',
          `Ready command ${r.command.id} has unsatisfied dependencies`,
        );
      if (this.cancelled.has(r.command.id))
        throw new RuntimeEngineError(
          'SchedulerInvariantViolation',
          `Cancelled command ${r.command.id} remains active`,
        );
      if (this.failed.has(r.command.id))
        throw new RuntimeEngineError(
          'SchedulerInvariantViolation',
          `Failed command ${r.command.id} remains active`,
        );
      if (this.expired.has(r.command.id))
        throw new RuntimeEngineError(
          'SchedulerInvariantViolation',
          `Expired command ${r.command.id} remains active`,
        );
      if (!this.sequences.has(r.sequence.toString()))
        throw new RuntimeEngineError(
          'SchedulerInvariantViolation',
          `Missing sequence index for ${r.command.id}`,
        );
    }
    if (this.sequences.size !== this.records.size)
      throw new RuntimeEngineError(
        'SchedulerInvariantViolation',
        'Sequence index count differs from active record count',
      );
    return Object.freeze({
      activeCommands: activeIds.size,
      sequenceIndexes: this.sequences.size,
      terminalCommands:
        this.completed.size + this.failed.size + this.cancelled.size + this.expired.size,
    });
  }
  snapshot(): SchedulerSnapshot {
    const vals = [...this.records.values()];
    const waiting = vals.filter((r) => r.state === 'WAITING').length;
    const ready = vals.filter((r) => r.state === 'READY').length;
    return Object.freeze({
      pendingCommands: vals.length,
      readyCommands: ready,
      waitingCommands: waiting,
      completedCommands: this.completed.size,
      failedCommands: this.failed.size,
      cancelledCommands: this.cancelled.size,
      expiredCommands: this.expired.size,
      dependencyWaitCount: vals.filter((r) => r.dependencies.length && r.state === 'WAITING')
        .length,
      maximumQueueDepth: this.depthMax,
      averageQueueLatencyNs: this.latencySamples
        ? (this.totalLatencyNs / this.latencySamples).toString()
        : '0',
      maximumQueueLatencyNs: this.maxLatencyNs.toString(),
    });
  }
}
export function compareCommands(a: RuntimeCommand, b: RuntimeCommand) {
  const tf = targetOf(a) < targetOf(b) ? -1 : targetOf(a) > targetOf(b) ? 1 : 0;
  if (tf) return tf;
  const ts =
    (a.scheduledTimeNs ?? 0n) < (b.scheduledTimeNs ?? 0n)
      ? -1
      : (a.scheduledTimeNs ?? 0n) > (b.scheduledTimeNs ?? 0n)
        ? 1
        : 0;
  if (ts) return ts;
  const pr = b.priority - a.priority;
  if (pr) return pr;
  const sq = a.sequence < b.sequence ? -1 : a.sequence > b.sequence ? 1 : 0;
  if (sq) return sq;
  return a.id.localeCompare(b.id);
}
/** Public UBOS runtime execution-engine API. */
export function compareRecords(a: ScheduledCommandRecord, b: ScheduledCommandRecord) {
  return compareCommands(a.command, b.command);
}
/** Public UBOS runtime execution-engine API. */
export interface TickProcessor {
  id: string;
  order: number;
  /** Public UBOS runtime execution-engine API. */
  initialize(context: RuntimeContext): Promise<void> | void;
  processTick(tick: FrameTick, context: RuntimeContext): Promise<void> | void;
  /** Public UBOS runtime execution-engine API. */
  shutdown(context: RuntimeContext): Promise<void> | void;
}
/** Public UBOS runtime execution-engine API. */
export interface ProcessorMetric {
  id: string;
  initialized: boolean;
  executions: number;
  failures: number;
  lastDurationMs: number;
  maximumDurationMs: number;
  lastError?: string;
}
/** Public UBOS runtime execution-engine API. */
export class TickProcessorRegistry {
  private processors = new Map<string, TickProcessor>();
  private metrics = new Map<string, ProcessorMetric>();
  private locked = false;
  /** Public UBOS runtime execution-engine API. */
  register(p: TickProcessor) {
    if (this.locked)
      throw new RuntimeEngineError(
        'ProcessorRegistryLocked',
        'Cannot register processor while tick is executing',
      );
    if (this.processors.has(p.id)) throw new DuplicateProcessorError(p.id);
    this.processors.set(p.id, Object.freeze({ ...p }));
    this.metrics.set(p.id, {
      id: p.id,
      initialized: false,
      executions: 0,
      failures: 0,
      lastDurationMs: 0,
      maximumDurationMs: 0,
    });
  }
  /** Public UBOS runtime execution-engine API. */
  ordered() {
    return [...this.processors.values()].sort(
      (a, b) => a.order - b.order || a.id.localeCompare(b.id),
    );
  }
  /** Public UBOS runtime execution-engine API. */
  markLocked(v: boolean) {
    this.locked = v;
  }
  /** Public UBOS runtime execution-engine API. */
  metric(id: string) {
    return this.metrics.get(id);
  }
  /** Public UBOS runtime execution-engine API. */
  allMetrics() {
    return [...this.metrics.values()].map((m) => Object.freeze({ ...m }));
  }
  /** Public UBOS runtime execution-engine API. */
  async initializeAll(ctx: RuntimeContext) {
    for (const p of this.ordered()) {
      await p.initialize(ctx);
      this.metrics.get(p.id)!.initialized = true;
    }
  }
  /** Public UBOS runtime execution-engine API. */
  async shutdownAll(ctx: RuntimeContext) {
    for (const p of this.ordered().reverse()) await p.shutdown(ctx);
  }
  /** Public UBOS runtime execution-engine API. */
  record(id: string, durationMs: number, error?: unknown) {
    const m = this.metrics.get(id)!;
    m.executions++;
    m.lastDurationMs = durationMs;
    m.maximumDurationMs = Math.max(m.maximumDurationMs, durationMs);
    if (error) {
      m.failures++;
      m.lastError = error instanceof Error ? error.message : String(error);
    }
  }
}
const validTransitions: Record<RuntimeLifecycleState, RuntimeLifecycleState[]> = {
  CREATED: ['INITIALIZING', 'FAILED'],
  INITIALIZING: ['READY', 'FAILED'],
  READY: ['RUNNING', 'STOPPING', 'FAILED'],
  RUNNING: ['PAUSED', 'DEGRADED', 'STOPPING', 'FAILED'],
  PAUSED: ['RUNNING', 'STOPPING', 'FAILED'],
  DEGRADED: ['RUNNING', 'STOPPING', 'FAILED'],
  STOPPING: ['STOPPED', 'FAILED'],
  STOPPED: [],
  FAILED: ['STOPPING'],
};
/** Public UBOS runtime execution-engine API. */
export class RuntimeExecutionEngine {
  readonly handlers = new CommandHandlerRegistry();
  readonly processors = new TickProcessorRegistry();
  readonly scheduler: DeterministicCommandScheduler;
  readonly telemetry: RuntimeTelemetryCollector;
  readonly config: Readonly<RuntimeEngineConfig>;
  private readonly publisher: RuntimeEventPublisher;
  private readonly clock: RuntimeClock;
  private readonly logger: RuntimeLogger;
  private readonly services: ReadonlyMap<string, unknown>;
  #state: RuntimeLifecycleState = 'CREATED';
  #frameNumber = 0n;
  #abort = new AbortController();
  #tickInProgress = false;
  #startedAtMs?: number;
  #eventSequence = 0n;
  readonly masterFrameClock: MasterFrameClock;
  /** Public UBOS runtime execution-engine API. */
  constructor(
    config: RuntimeEngineConfig = defaultRuntimeEngineConfig(),
    publisher: RuntimeEventPublisher = new InMemoryRuntimeEventPublisher(),
    clock: RuntimeClock = systemRuntimeClock,
    logger: RuntimeLogger = console,
    services = new Map<string, unknown>(),
  ) {
    this.config = Object.freeze({ ...config, frameRate: Object.freeze({ ...config.frameRate }) });
    this.publisher = publisher;
    this.clock = clock;
    this.logger = logger;
    this.services = new Map([...services.entries()].sort(([a], [b]) => a.localeCompare(b)));
    const injectedClock = services.get('masterFrameClock') as MasterFrameClock | undefined;
    this.masterFrameClock =
      injectedClock ??
      createMasterFrameClock({
        frameRate:
          Number.isSafeInteger(this.config.frameRate.numerator) &&
          this.config.frameRate.numerator > 0 &&
          Number.isSafeInteger(this.config.frameRate.denominator) &&
          this.config.frameRate.denominator > 0
            ? this.config.frameRate
            : defaultRuntimeEngineConfig().frameRate,
        timeSource: this.clock,
        lateFrameToleranceNs: this.config.lateFrameToleranceNs,
        maximumCatchUpFrames: this.config.maximumCatchUpFrames,
        discontinuityThresholdNs: this.config.discontinuityThresholdNs,
      });
    this.scheduler = new DeterministicCommandScheduler(
      this.config.commandQueueCapacity,
      () => this.masterFrameClock.currentFrame || this.#frameNumber,
      () => this.clock.nowNs(),
    );
    this.telemetry = new RuntimeTelemetryCollector(this.config.runtimeId);
    this.registerBuiltIns();
  }
  /** Public UBOS runtime execution-engine API. */
  get lifecycleState() {
    return this.#state;
  }
  /** Public UBOS runtime execution-engine API. */
  get currentFrameNumber() {
    return this.#frameNumber;
  }
  /** Public UBOS runtime execution-engine API. */
  context(): RuntimeContext {
    return Object.freeze({
      runtimeId: this.config.runtimeId,
      state: this.#state,
      frameNumber: this.#frameNumber,
      monotonicTimeNs: this.clock.nowNs(),
      config: this.config,
      logger: this.logger,
      events: this.publisher,
      telemetry: this.telemetry,
      shutdownSignal: this.#abort.signal,
      services: new Map([...this.services.entries()]),
    });
  }
  /** Public UBOS runtime execution-engine API. */
  validateConfig() {
    const c = this.config;
    if (!c.runtimeId.trim()) throw new InvalidEngineConfigurationError('runtimeId is required');
    validateRationalFrameRate(c.frameRate);
    for (const [k, v] of Object.entries({
      commandQueueCapacity: c.commandQueueCapacity,
      maximumCommandsPerTick: c.maximumCommandsPerTick,
      tickDeadlineWarningMs: c.tickDeadlineWarningMs,
      watchdogTimeoutMs: c.watchdogTimeoutMs,
      telemetryIntervalMs: c.telemetryIntervalMs,
      maximumCatchUpFrames: c.maximumCatchUpFrames,
    }))
      if (!Number.isFinite(v) || v <= 0)
        throw new InvalidEngineConfigurationError(`${k} must be positive`);
    for (const [k, v] of Object.entries({
      lateFrameToleranceNs: c.lateFrameToleranceNs,
      discontinuityThresholdNs: c.discontinuityThresholdNs,
      clockSpinThresholdNs: c.clockSpinThresholdNs,
      coarseSleepThresholdNs: c.coarseSleepThresholdNs,
    }))
      if (v < 0n) throw new InvalidEngineConfigurationError(`${k} must be non-negative`);
  }
  /** Public UBOS runtime execution-engine API. */
  async initialize() {
    if (this.#state === 'READY') return;
    this.transition('INITIALIZING');
    this.validateConfig();
    await this.processors.initializeAll(this.context());
    this.transition('READY');
    await this.emit('RuntimeInitialized', {});
  }
  /** Public UBOS runtime execution-engine API. */
  async start() {
    if (this.#state === 'RUNNING') return;
    if (this.#state !== 'READY' && this.#state !== 'PAUSED' && this.#state !== 'DEGRADED')
      throw new RuntimeNotReadyError(this.#state);
    this.#startedAtMs ??= this.clock.nowMs();
    if (this.masterFrameClock.state === 'CREATED') {
      this.masterFrameClock.start();
      await this.emit('FrameClockStarted', { frameRate: frameRateLabel(this.config.frameRate) });
    } else if (this.masterFrameClock.state === 'PAUSED') {
      this.masterFrameClock.resume();
      await this.emit('FrameClockResumed', {});
    }
    this.transition('RUNNING');
    await this.emit('RuntimeStarted', {});
  }
  /** Public UBOS runtime execution-engine API. */
  async pause() {
    if (this.#state === 'PAUSED') return;
    if (this.masterFrameClock.state === 'RUNNING') {
      this.masterFrameClock.pause();
      await this.emit('FrameClockPaused', {});
    }
    this.transition('PAUSED');
    await this.emit('RuntimePaused', {});
  }
  /** Public UBOS runtime execution-engine API. */
  async resume() {
    return this.start().then(() => this.emit('RuntimeResumed', {}));
  }
  /** Public UBOS runtime execution-engine API. */
  async stop() {
    if (this.#state === 'STOPPED') return;
    if (this.#tickInProgress)
      throw new RuntimeEngineError('RuntimeTickInProgress', 'Cannot stop while tick is executing');
    this.transition('STOPPING');
    await this.emit('RuntimeStopping', {});
    this.#abort.abort();
    this.masterFrameClock.stop();
    await this.emit('FrameClockStopped', {});
    await this.processors.shutdownAll(this.context());
    this.transition('STOPPED');
    await this.emit('RuntimeStopped', {});
  }
  /** Public UBOS runtime execution-engine API. */
  async shutdown() {
    return this.stop();
  }
  /** Public UBOS runtime execution-engine API. */
  async fail(error: unknown) {
    if (this.#state === 'FAILED') return;
    this.telemetry.commit({
      lastError: error instanceof Error ? error.message : String(error),
      healthStatus: 'failed',
    });
    this.transition('FAILED');
    await this.emit('RuntimeFailed', { error: this.telemetry.current().lastError });
  }
  /** Public UBOS runtime execution-engine API. */
  schedule(command: RuntimeCommand) {
    const c = this.scheduler.schedule(command);
    void this.emit('CommandScheduled', { commandType: c.type, commandId: c.id }, c.correlationId);
    void this.emit('CommandQueued', { commandType: c.type, commandId: c.id }, c.correlationId);
    return c;
  }
  /** Public UBOS runtime execution-engine API. */
  async executeSingleTick() {
    if (this.#tickInProgress)
      throw new RuntimeEngineError('RuntimeTickInProgress', 'A tick is already executing');
    if (this.#state !== 'RUNNING') throw new RuntimeNotReadyError(this.#state);
    this.#tickInProgress = true;
    this.processors.markLocked(true);
    const startMs = this.clock.nowMs();
    const tick = this.masterFrameClock.createTickAt(this.clock.nowNs());
    this.#frameNumber = tick.frameNumber;
    await this.emit(
      'FrameTickProduced',
      {
        scheduledTimeNs: tick.scheduledTimeNs.toString(),
        actualTimeNs: tick.actualTimeNs.toString(),
        latenessNs: tick.latenessNs.toString(),
        missedFrames: tick.missedFrames.toString(),
        discontinuity: tick.discontinuity,
      },
      undefined,
      this.#frameNumber,
    );
    if (tick.late)
      await this.emit(
        'FrameTickLate',
        { latenessNs: tick.latenessNs.toString() },
        undefined,
        this.#frameNumber,
      );
    if (tick.missedFrames > 0n)
      await this.emit(
        'FrameFramesMissed',
        { missedFrames: tick.missedFrames.toString() },
        undefined,
        this.#frameNumber,
      );
    if (tick.discontinuity)
      await this.emit(
        'FrameClockDiscontinuity',
        { frameNumber: tick.frameNumber.toString() },
        undefined,
        this.#frameNumber,
      );
    await this.emit('RuntimeTickStarted', {}, undefined, this.#frameNumber);
    let commandErrors = 0,
      processorErrors = 0;
    try {
      const collected = this.scheduler.collectDue(this.#frameNumber, this.clock.nowNs());
      for (const id of collected.expiredIds)
        await this.emit('CommandExpired', { commandId: id }, undefined, this.#frameNumber);
      for (const id of collected.failedDependencyIds)
        await this.emit('DependencyFailed', { commandId: id }, undefined, this.#frameNumber);
      for (const id of collected.dependencySatisfied)
        await this.emit('DependencySatisfied', { commandId: id }, undefined, this.#frameNumber);
      for (const id of collected.readyIds)
        await this.emit('CommandReady', { commandId: id }, undefined, this.#frameNumber);
      await this.emit(
        collected.commands.length ? 'SchedulerBusy' : 'SchedulerIdle',
        { dueCommands: collected.commands.length },
        undefined,
        this.#frameNumber,
      );
      const due = collected.commands.slice(0, this.config.maximumCommandsPerTick);
      for (const c of due) await this.executeCommand(c);
      for (const p of this.processors.ordered()) {
        const ps = this.clock.nowMs();
        await this.emit('ProcessorStarted', { processorId: p.id }, undefined, this.#frameNumber);
        try {
          await p.processTick(tick, this.context());
          const d = this.clock.nowMs() - ps;
          this.processors.record(p.id, d);
          await this.emit(
            'ProcessorCompleted',
            { processorId: p.id, durationMs: d },
            undefined,
            this.#frameNumber,
          );
        } catch (e) {
          processorErrors++;
          this.processors.record(p.id, this.clock.nowMs() - ps, e);
          await this.emit(
            'ProcessorFailed',
            { processorId: p.id, error: String(e) },
            undefined,
            this.#frameNumber,
          );
          if (this.config.failOnProcessorError)
            await this.fail(new ProcessorExecutionFailedError(p.id, e));
        }
      }
      const dur = this.clock.nowMs() - startMs;
      const late = dur > this.config.tickDeadlineWarningMs || tick.late;
      if (late)
        await this.emit('RuntimeTickOverrun', { durationMs: dur }, undefined, this.#frameNumber);
      this.telemetry.commit({
        state: this.#state,
        frameNumber: this.#frameNumber.toString(),
        uptimeMs: this.#startedAtMs === undefined ? 0 : this.clock.nowMs() - this.#startedAtMs,
        lastTickStartedAt: new Date(startMs).toISOString(),
        lastTickCompletedAt: new Date(this.clock.nowMs()).toISOString(),
        lastTickDurationMs: dur,
        maximumTickDurationMs: Math.max(this.telemetry.current().maximumTickDurationMs, dur),
        totalTicks: this.telemetry.current().totalTicks + 1,
        lateTicks: this.telemetry.current().lateTicks + (late ? 1 : 0),
        pendingCommands: this.scheduler.pendingCount(),
        readyCommands: this.scheduler.snapshot().readyCommands,
        waitingCommands: this.scheduler.snapshot().waitingCommands,
        completedCommands: this.scheduler.snapshot().completedCommands,
        failedCommands: this.scheduler.snapshot().failedCommands,
        cancelledCommands: this.scheduler.snapshot().cancelledCommands,
        expiredCommands: this.scheduler.snapshot().expiredCommands,
        averageQueueLatencyNs: this.scheduler.snapshot().averageQueueLatencyNs,
        maximumQueueLatencyNs: this.scheduler.snapshot().maximumQueueLatencyNs,
        dependencyWaitCount: this.scheduler.snapshot().dependencyWaitCount,
        commandsExecutedPerSecond:
          this.#startedAtMs === undefined || this.clock.nowMs() === this.#startedAtMs
            ? 0
            : this.telemetry.current().commandsExecuted /
              ((this.clock.nowMs() - this.#startedAtMs) / 1000),
        maximumQueueDepth: this.scheduler.snapshot().maximumQueueDepth,
        processorExecutions:
          this.telemetry.current().processorExecutions + this.processors.ordered().length,
        processorFailures: this.telemetry.current().processorFailures + processorErrors,
        healthStatus:
          (this.#state as RuntimeLifecycleState) === 'FAILED'
            ? 'failed'
            : late
              ? 'degraded'
              : 'healthy',
        configuredFrameRate: {
          ...this.config.frameRate,
          label: frameRateLabel(this.config.frameRate),
        },
        currentFrameNumber: this.#frameNumber.toString(),
        scheduledFrameTimeNs: tick.scheduledTimeNs.toString(),
        actualFrameTimeNs: tick.actualTimeNs.toString(),
        frameDurationNs: tick.frameDurationNs.toString(),
        currentDriftNs: tick.driftNs.toString(),
        maximumAbsoluteDriftNs:
          (tick.driftNs < 0n ? -tick.driftNs : tick.driftNs) >
          BigInt(this.telemetry.current().maximumAbsoluteDriftNs)
            ? (tick.driftNs < 0n ? -tick.driftNs : tick.driftNs).toString()
            : this.telemetry.current().maximumAbsoluteDriftNs,
        currentLatenessNs: tick.latenessNs.toString(),
        maximumLatenessNs:
          tick.latenessNs > BigInt(this.telemetry.current().maximumLatenessNs)
            ? tick.latenessNs.toString()
            : this.telemetry.current().maximumLatenessNs,
        totalLateFrames: this.telemetry.current().totalLateFrames + (tick.late ? 1 : 0),
        totalMissedFrames: (
          BigInt(this.telemetry.current().totalMissedFrames) + tick.missedFrames
        ).toString(),
        clockDiscontinuities:
          this.telemetry.current().clockDiscontinuities + (tick.discontinuity ? 1 : 0),
        clockStartedAtNs: this.masterFrameClock.getDeadlineForFrame(0n).toString(),
        clockState: this.masterFrameClock.state,
        effectiveFrameRate: framesPerSecond(this.config.frameRate),
        averageTickIntervalNs:
          this.telemetry.current().totalTicks === 0
            ? '0'
            : (tick.actualTimeNs / BigInt(this.telemetry.current().totalTicks + 1)).toString(),
      });
      await this.emit('RuntimeTickCompleted', { durationMs: dur }, undefined, this.#frameNumber);
    } finally {
      this.processors.markLocked(false);
      this.#tickInProgress = false;
    }
  }
  private async executeCommand(c: RuntimeCommand) {
    await this.emit(
      'CommandExecuting',
      { commandType: c.type, commandId: c.id },
      c.correlationId,
      this.#frameNumber,
    );
    await this.emit(
      'CommandStarted',
      { commandType: c.type, commandId: c.id },
      c.correlationId,
      this.#frameNumber,
    );
    try {
      await this.handlers.resolve(c.type)(c, this.context());
      this.scheduler.markCompleted(c.id);
      this.telemetry.commit({ commandsExecuted: this.telemetry.current().commandsExecuted + 1 });
      await this.emit(
        'CommandCompleted',
        { commandType: c.type, commandId: c.id },
        c.correlationId,
        this.#frameNumber,
      );
    } catch (e) {
      this.scheduler.markFailed(c.id);
      this.telemetry.commit({
        commandsFailed: this.telemetry.current().commandsFailed + 1,
        lastError: e instanceof Error ? e.message : String(e),
      });
      await this.emit(
        'CommandFailed',
        { commandType: c.type, commandId: c.id, error: String(e) },
        c.correlationId,
        this.#frameNumber,
      );
      if (this.config.failOnCommandError) await this.fail(new CommandExecutionFailedError(c.id, e));
    }
  }
  private transition(next: RuntimeLifecycleState) {
    if (this.#state === next) return;
    if (!validTransitions[this.#state].includes(next))
      throw new InvalidLifecycleTransitionError(this.#state, next);
    const previous = this.#state;
    this.#state = next;
    this.telemetry.commit({
      state: next,
      healthStatus:
        next === 'FAILED'
          ? 'failed'
          : next === 'STOPPED'
            ? 'stopped'
            : next === 'DEGRADED'
              ? 'degraded'
              : 'healthy',
    });
    void this.emit('RuntimeStateChanged', { previousState: previous, nextState: next });
  }
  private async emit(
    eventType: RuntimeEventType,
    payload: Record<string, unknown>,
    correlationId?: string,
    frameNumber?: bigint,
  ) {
    await this.publisher.publish({
      eventId: `${this.config.runtimeId}:${eventType}:${(++this.#eventSequence).toString().padStart(12, '0')}`,
      eventType,
      runtimeId: this.config.runtimeId,
      timestamp: new Date(this.clock.nowMs()).toISOString(),
      ...(frameNumber !== undefined ? { frameNumber: frameNumber.toString() } : {}),
      ...(correlationId ? { correlationId } : {}),
      payload,
    });
  }
  private registerBuiltIns() {
    this.handlers.register('RUNTIME_NOOP', () => {});
    this.handlers.register('RUNTIME_BARRIER', () => {});
    this.handlers.register('ENGINE_PAUSE', () => this.pause());
    this.handlers.register('ENGINE_RESUME', () => this.resume());
    this.handlers.register('ENGINE_STOP', () => this.stop());
    this.handlers.register('WORKER_START', (c) =>
      this.emit('WorkerHealthChanged', { commandId: c.id, status: 'started' }, c.correlationId),
    );
    this.handlers.register('WORKER_STOP', (c) =>
      this.emit('WorkerHealthChanged', { commandId: c.id, status: 'stopped' }, c.correlationId),
    );
    this.handlers.register('WORKER_RESTART', (c) =>
      this.emit('WorkerHealthChanged', { commandId: c.id, status: 'restarted' }, c.correlationId),
    );
  }
}
/** Public UBOS runtime execution-engine API. */
export const createRuntimeExecutionEngine = (
  config?: Partial<RuntimeEngineConfig>,
  publisher?: RuntimeEventPublisher,
  clock?: RuntimeClock,
) =>
  new RuntimeExecutionEngine(
    {
      ...defaultRuntimeEngineConfig(config?.runtimeId),
      ...config,
      frameRate: config?.frameRate ?? defaultRuntimeEngineConfig().frameRate,
    },
    publisher,
    clock,
  );
