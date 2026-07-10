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
export interface RuntimeFrameRate {
  numerator: number;
  denominator: number;
}
/** Public UBOS runtime execution-engine API. */
export interface RuntimeEngineConfig {
  runtimeId: string;
  frameRate: RuntimeFrameRate;
  commandQueueCapacity: number;
  maximumCommandsPerTick: number;
  tickDeadlineWarningMs: number;
  watchdogTimeoutMs: number;
  telemetryIntervalMs: number;
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
  | 'CommandStarted'
  | 'CommandCompleted'
  | 'CommandFailed'
  | 'CommandCancelled'
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
  commandsExecuted: number;
  commandsFailed: number;
  processorExecutions: number;
  processorFailures: number;
  lastError?: string;
  healthStatus: RuntimeHealthStatus;
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
      commandsExecuted: 0,
      commandsFailed: 0,
      processorExecutions: 0,
      processorFailures: 0,
      healthStatus: 'stopped',
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
  frameNumber: bigint;
  startedAtNs: bigint;
  deadlineAtNs: bigint;
}
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
export class DeterministicCommandScheduler {
  private pending = new Map<string, RuntimeCommand>();
  private sequences = new Set<string>();
  private draining = false;
  /** Public UBOS runtime execution-engine API. */
  constructor(
    private capacity: number,
    private currentFrame: () => bigint = () => 0n,
  ) {}
  /** Public UBOS runtime execution-engine API. */
  schedule(command: RuntimeCommand) {
    if ((command.targetFrame ?? 0n) < 0n)
      throw new RuntimeEngineError(
        'InvalidCommandTargetFrame',
        'Command targetFrame cannot be negative',
      );
    if (this.pending.has(command.id)) throw new DuplicateCommandError(command.id);
    const seqKey = command.sequence.toString();
    if (this.sequences.has(seqKey)) throw new DuplicateCommandError(`sequence:${seqKey}`);
    if (this.pending.size >= this.capacity) throw new CommandQueueFullError(this.capacity);
    const copy = cloneCommand(command);
    this.pending.set(copy.id, copy);
    this.sequences.add(seqKey);
    return copy;
  }
  /** Public UBOS runtime execution-engine API. */
  scheduleForNextFrame(command: RuntimeCommand) {
    return this.schedule({ ...command, targetFrame: this.currentFrame() + 1n });
  }
  /** Public UBOS runtime execution-engine API. */
  getDueCommands(frameNumber: bigint) {
    if (this.draining) return [];
    this.draining = true;
    try {
      const due = [...this.pending.values()]
        .filter((c) => targetOf(c) <= frameNumber)
        .sort(compareCommands)
        .slice(0);
      for (const c of due) {
        this.pending.delete(c.id);
        this.sequences.delete(c.sequence.toString());
      }
      return due.map(cloneCommand);
    } finally {
      this.draining = false;
    }
  }
  /** Public UBOS runtime execution-engine API. */
  cancel(commandId: string) {
    const c = this.pending.get(commandId);
    if (!c) throw new CommandNotFoundError(commandId);
    this.pending.delete(commandId);
    this.sequences.delete(c.sequence.toString());
    return cloneCommand(c);
  }
  /** Public UBOS runtime execution-engine API. */
  has(id: string) {
    return this.pending.has(id);
  }
  /** Public UBOS runtime execution-engine API. */
  pendingCount() {
    return this.pending.size;
  }
  /** Public UBOS runtime execution-engine API. */
  clear() {
    this.pending.clear();
    this.sequences.clear();
  }
  /** Public UBOS runtime execution-engine API. */
  inspectPendingCommands() {
    return [...this.pending.values()].sort(compareCommands).map(cloneCommand);
  }
}
/** Public UBOS runtime execution-engine API. */
export function compareCommands(a: RuntimeCommand, b: RuntimeCommand) {
  const tf = targetOf(a) < targetOf(b) ? -1 : targetOf(a) > targetOf(b) ? 1 : 0;
  if (tf) return tf;
  const pr = b.priority - a.priority;
  if (pr) return pr;
  const sq = a.sequence < b.sequence ? -1 : a.sequence > b.sequence ? 1 : 0;
  if (sq) return sq;
  return a.id.localeCompare(b.id);
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
    this.scheduler = new DeterministicCommandScheduler(
      this.config.commandQueueCapacity,
      () => this.#frameNumber,
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
    for (const [k, v] of Object.entries({
      numerator: c.frameRate.numerator,
      denominator: c.frameRate.denominator,
      commandQueueCapacity: c.commandQueueCapacity,
      maximumCommandsPerTick: c.maximumCommandsPerTick,
      tickDeadlineWarningMs: c.tickDeadlineWarningMs,
      watchdogTimeoutMs: c.watchdogTimeoutMs,
      telemetryIntervalMs: c.telemetryIntervalMs,
    }))
      if (!Number.isFinite(v) || v <= 0)
        throw new InvalidEngineConfigurationError(`${k} must be positive`);
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
    this.transition('RUNNING');
    await this.emit('RuntimeStarted', {});
  }
  /** Public UBOS runtime execution-engine API. */
  async pause() {
    if (this.#state === 'PAUSED') return;
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
    const tick: FrameTick = {
      frameNumber: this.#frameNumber,
      startedAtNs: this.clock.nowNs(),
      deadlineAtNs:
        this.clock.nowNs() +
        BigInt(
          Math.round(
            (1_000_000_000 * this.config.frameRate.denominator) / this.config.frameRate.numerator,
          ),
        ),
    };
    await this.emit('RuntimeTickStarted', {}, undefined, this.#frameNumber);
    let commandErrors = 0,
      processorErrors = 0;
    try {
      const due = this.scheduler
        .getDueCommands(this.#frameNumber)
        .slice(0, this.config.maximumCommandsPerTick);
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
      const late = dur > this.config.tickDeadlineWarningMs;
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
        processorExecutions:
          this.telemetry.current().processorExecutions + this.processors.ordered().length,
        processorFailures: this.telemetry.current().processorFailures + processorErrors,
        healthStatus:
          (this.#state as RuntimeLifecycleState) === 'FAILED'
            ? 'failed'
            : late
              ? 'degraded'
              : 'healthy',
      });
      await this.emit('RuntimeTickCompleted', { durationMs: dur }, undefined, this.#frameNumber);
      this.#frameNumber++;
    } finally {
      this.processors.markLocked(false);
      this.#tickInProgress = false;
    }
  }
  private async executeCommand(c: RuntimeCommand) {
    await this.emit(
      'CommandStarted',
      { commandType: c.type, commandId: c.id },
      c.correlationId,
      this.#frameNumber,
    );
    try {
      await this.handlers.resolve(c.type)(c, this.context());
      this.telemetry.commit({ commandsExecuted: this.telemetry.current().commandsExecuted + 1 });
      await this.emit(
        'CommandCompleted',
        { commandType: c.type, commandId: c.id },
        c.correlationId,
        this.#frameNumber,
      );
    } catch (e) {
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
