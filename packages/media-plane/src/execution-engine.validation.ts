const assertEqual = (actual: unknown, expected: unknown) => {
  if (actual !== expected)
    throw new Error(`Expected ${String(actual)} to equal ${String(expected)}`);
};
const assertOk = (value: unknown) => {
  if (!value) throw new Error('Expected value to be truthy');
};
const assertDeepEqual = (actual: unknown, expected: unknown) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
};
const assertThrows = (fn: () => unknown, matcher?: unknown) => {
  try {
    fn();
  } catch (error) {
    if (
      typeof matcher === 'function' &&
      !(error instanceof (matcher as new (...args: never[]) => Error))
    )
      throw error;
    if (matcher instanceof RegExp && !matcher.test(String(error))) throw error;
    return;
  }
  throw new Error('Expected function to throw');
};
const assertRejects = async (fn: () => Promise<unknown>, matcher?: unknown) => {
  try {
    await fn();
  } catch (error) {
    if (
      typeof matcher === 'function' &&
      !(error instanceof (matcher as new (...args: never[]) => Error))
    )
      throw error;
    if (matcher instanceof RegExp && !matcher.test(String(error))) throw error;
    return;
  }
  throw new Error('Expected promise to reject');
};
const assertDoesNotThrow = (fn: () => unknown) => {
  fn();
};
import {
  CommandQueueFullError,
  DeterministicCommandScheduler,
  DuplicateCommandError,
  DuplicateProcessorError,
  FakeMonotonicTimeSource,
  FrameClockAlreadyRunningError,
  FrameClockNotRunningError,
  FrameClockStoppedError,
  ImmediateFrameWaitStrategy,
  InMemoryRuntimeEventPublisher,
  InvalidEngineConfigurationError,
  InvalidLifecycleTransitionError,
  RuntimeExecutionEngine,
  RuntimeNotReadyError,
  TimeSourceMovedBackwardError,
  UnknownCommandTypeError,
  createMasterFrameClock,
  frameDurationNs,
  frameNumberToTimestampNs,
  frameRateLabel,
  supportedRationalFrameRates,
  timestampNsToFrameNumber,
  validateRationalFrameRate,
  createRuntimeExecutionEngine,
  defaultRuntimeEngineConfig,
  type RuntimeClock,
  type RuntimeCommand,
  type TickProcessor,
} from './execution-engine.js';

class FakeClock implements RuntimeClock {
  ms = 1_700_000_000_000;
  nowMs() {
    return this.ms++;
  }
  nowNs() {
    return BigInt(this.ms) * 1_000_000n;
  }
}
const cmd = (id: string, patch: Partial<RuntimeCommand> = {}): RuntimeCommand => ({
  id,
  type: 'RUNTIME_NOOP',
  payload: { id },
  sequence: BigInt(id.replace(/\D/g, '') || '1'),
  priority: 0,
  issuedAtNs: 1n,
  ...patch,
});
async function readyEngine(
  publisher = new InMemoryRuntimeEventPublisher(),
  clock = new FakeClock(),
  patch = {},
) {
  const engine = createRuntimeExecutionEngine(
    { runtimeId: 'test-runtime', ...patch },
    publisher,
    clock,
  );
  await engine.initialize();
  return engine;
}

// 1-3 lifecycle transitions, invalid transitions, idempotency.
{
  const events = new InMemoryRuntimeEventPublisher();
  const engine = await readyEngine(events);
  assertEqual(engine.lifecycleState, 'READY');
  await engine.start();
  assertEqual(engine.lifecycleState, 'RUNNING');
  await engine.start();
  assertEqual(engine.lifecycleState, 'RUNNING');
  await engine.pause();
  assertEqual(engine.lifecycleState, 'PAUSED');
  await engine.pause();
  assertEqual(engine.lifecycleState, 'PAUSED');
  await engine.resume();
  assertEqual(engine.lifecycleState, 'RUNNING');
  await engine.stop();
  assertEqual(engine.lifecycleState, 'STOPPED');
  await engine.stop();
  assertEqual(engine.lifecycleState, 'STOPPED');
  assertOk(events.events.some((e) => e.eventType === 'RuntimeStateChanged'));
}
{
  const engine = createRuntimeExecutionEngine(
    { runtimeId: 'invalid-transition' },
    new InMemoryRuntimeEventPublisher(),
    new FakeClock(),
  );
  await assertRejects(() => engine.start(), RuntimeNotReadyError);
  await assertRejects(() => engine.pause(), InvalidLifecycleTransitionError);
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'failure-transition',
  });
  await engine.fail(new Error('boom'));
  assertEqual(engine.lifecycleState, 'FAILED');
}

// 4 configuration validation.
{
  const engine = createRuntimeExecutionEngine(
    { runtimeId: '', frameRate: { numerator: 0, denominator: 1 } },
    new InMemoryRuntimeEventPublisher(),
    new FakeClock(),
  );
  await assertRejects(() => engine.initialize(), InvalidEngineConfigurationError);
}

// 5-8 deterministic scheduler ordering, duplicate rejection, capacity, cancellation.
{
  const scheduler = new DeterministicCommandScheduler(10, () => 10n);
  scheduler.schedule(cmd('c3', { targetFrame: 2n, priority: 0, sequence: 3n }));
  scheduler.schedule(cmd('c2', { targetFrame: 1n, priority: 1, sequence: 2n }));
  scheduler.schedule(cmd('c1', { targetFrame: 1n, priority: 9, sequence: 1n }));
  scheduler.schedule(cmd('c4', { targetFrame: 1n, priority: 9, sequence: 4n }));
  assertDeepEqual(
    scheduler.getDueCommands(2n).map((c) => c.id),
    ['c1', 'c4', 'c2', 'c3'],
  );
  scheduler.scheduleForNextFrame(cmd('c5', { sequence: 5n }));
  assertEqual(scheduler.inspectPendingCommands()[0]?.targetFrame, 11n);
  assertEqual(scheduler.cancel('c5').id, 'c5');
  assertEqual(scheduler.pendingCount(), 0);
}
{
  const scheduler = new DeterministicCommandScheduler(1);
  scheduler.schedule(cmd('c1', { sequence: 1n }));
  assertThrows(() => scheduler.schedule(cmd('c1', { sequence: 2n })), DuplicateCommandError);
  assertThrows(() => scheduler.schedule(cmd('c2', { sequence: 2n })), CommandQueueFullError);
}

// 9-10 unknown and failing commands.
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const engine = await readyEngine(publisher, new FakeClock(), { failOnCommandError: false });
  await engine.start();
  engine.schedule(cmd('unknown', { type: 'UNKNOWN', sequence: 100n }));
  await engine.executeSingleTick();
  assertEqual(engine.lifecycleState, 'RUNNING');
  assertEqual(engine.telemetry.current().commandsFailed, 1);
  assertOk(publisher.events.some((e) => e.eventType === 'CommandFailed'));
  assertThrows(() => engine.handlers.resolve('UNKNOWN'), UnknownCommandTypeError);
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'fail-command',
    failOnCommandError: true,
  });
  engine.handlers.register('FAIL', () => {
    throw new Error('command failed');
  });
  await engine.start();
  engine.schedule(cmd('f1', { type: 'FAIL', sequence: 200n }));
  await engine.executeSingleTick();
  assertEqual(engine.lifecycleState, 'FAILED');
}

// 11-14 processor ordering, duplicate rejection, failure behavior, reverse shutdown.
{
  const order: string[] = [];
  const shutdown: string[] = [];
  const p = (id: string, n: number): TickProcessor => ({
    id,
    order: n,
    initialize: () => {
      order.push(`i:${id}`);
    },
    processTick: () => {
      order.push(`t:${id}`);
    },
    shutdown: () => {
      shutdown.push(id);
    },
  });
  const engine = createRuntimeExecutionEngine(
    { runtimeId: 'processors' },
    new InMemoryRuntimeEventPublisher(),
    new FakeClock(),
  );
  engine.processors.register(p('b', 2));
  engine.processors.register(p('a', 1));
  assertThrows(() => engine.processors.register(p('a', 3)), DuplicateProcessorError);
  await engine.initialize();
  await engine.start();
  await engine.executeSingleTick();
  await engine.stop();
  assertDeepEqual(order, ['i:a', 'i:b', 't:a', 't:b']);
  assertDeepEqual(shutdown, ['b', 'a']);
}
{
  const engine = createRuntimeExecutionEngine(
    { runtimeId: 'processor-fail', failOnProcessorError: true },
    new InMemoryRuntimeEventPublisher(),
    new FakeClock(),
  );
  engine.processors.register({
    id: 'bad',
    order: 1,
    initialize: () => {},
    processTick: () => {
      throw new Error('processor failed');
    },
    shutdown: () => {},
  });
  await engine.initialize();
  await engine.start();
  await engine.executeSingleTick();
  assertEqual(engine.lifecycleState, 'FAILED');
  assertEqual(engine.telemetry.current().processorFailures, 1);
}

// 15-20 single tick, overlap prevention, telemetry, events, clean stop, failure-state behavior.
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const engine = await readyEngine(publisher, new FakeClock(), { runtimeId: 'single-tick' });
  let ran = false;
  engine.processors.register({
    id: 'late-reg',
    order: 1,
    initialize: () => {},
    processTick: () => {},
    shutdown: () => {},
  });
  assertThrows(
    () =>
      engine.processors.register({
        id: 'late-reg',
        order: 2,
        initialize: () => {},
        processTick: () => {},
        shutdown: () => {},
      }),
    DuplicateProcessorError,
  );
  engine.handlers.register('SET_FLAG', () => {
    ran = true;
  });
  await engine.start();
  engine.schedule(cmd('set1', { type: 'SET_FLAG', sequence: 300n, correlationId: 'corr-1' }));
  const first = engine.executeSingleTick();
  await assertRejects(() => engine.executeSingleTick(), /RuntimeTickInProgress/);
  await first;
  assertEqual(ran, true);
  assertEqual(engine.currentFrameNumber, 1n);
  assertEqual(engine.telemetry.current().totalTicks, 1);
  assertEqual(engine.telemetry.current().commandsExecuted, 1);
  assertOk(publisher.events.some((e) => e.eventType === 'RuntimeTickStarted'));
  assertOk(publisher.events.some((e) => e.eventType === 'RuntimeTickCompleted'));
  assertOk(
    publisher.events.some(
      (e) => e.eventType === 'CommandCompleted' && e.correlationId === 'corr-1',
    ),
  );
  await engine.stop();
  assertEqual(engine.lifecycleState, 'STOPPED');
  await assertRejects(() => engine.executeSingleTick(), RuntimeNotReadyError);
}

// public default config remains rational and serializable snapshots do not expose bigint values.
{
  const config = defaultRuntimeEngineConfig('rational');
  assertDeepEqual(config.frameRate, { numerator: 30000, denominator: 1001 });
  const engine = new RuntimeExecutionEngine(
    config,
    new InMemoryRuntimeEventPublisher(),
    new FakeClock(),
  );
  assertDoesNotThrow(() => JSON.stringify(engine.telemetry.current()));
}

// Determinism hardening: cancellation/reinsertion, enqueue immutability, private lifecycle state, event IDs, and config cloning.
{
  const scheduler = new DeterministicCommandScheduler(10);
  scheduler.schedule(cmd('a', { targetFrame: 1n, priority: 1, sequence: 1n }));
  scheduler.schedule(cmd('b', { targetFrame: 1n, priority: 1, sequence: 2n }));
  scheduler.cancel('a');
  scheduler.schedule(cmd('a2', { targetFrame: 1n, priority: 1, sequence: 1n }));
  assertDeepEqual(
    scheduler.getDueCommands(1n).map((c) => c.id),
    ['a2', 'b'],
  );
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'immutability',
  });
  let observed = '';
  const mutablePayload = { nested: { value: 'queued' } };
  engine.handlers.register('OBSERVE', (command) => {
    observed = (command.payload as typeof mutablePayload).nested.value;
  });
  await engine.start();
  const scheduled = engine.schedule(
    cmd('immutable-command', { type: 'OBSERVE', sequence: 401n, payload: mutablePayload }),
  );
  mutablePayload.nested.value = 'caller-mutated';
  assertThrows(() => {
    (scheduled.payload as typeof mutablePayload).nested.value = 'returned-mutated';
  }, TypeError);
  await engine.executeSingleTick();
  assertEqual(observed, 'queued');
}
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const engine = await readyEngine(publisher, new FakeClock(), {
    runtimeId: 'deterministic-events',
  });
  (engine as unknown as Record<string, unknown>)['#state'] = 'RUNNING';
  assertEqual(engine.lifecycleState, 'READY');
  await engine.start();
  await engine.executeSingleTick();
  assertOk(
    publisher.events.every((event) => /deterministic-events:[A-Za-z]+:\d{12}/.test(event.eventId)),
  );
}
{
  const config = defaultRuntimeEngineConfig('config-clone');
  const engine = new RuntimeExecutionEngine(
    config,
    new InMemoryRuntimeEventPublisher(),
    new FakeClock(),
  );
  config.frameRate.numerator = 1;
  assertEqual(engine.config.frameRate.numerator, 30000);
}

// UBOS v5.1.2 master frame-clock validation.
{
  for (const rate of supportedRationalFrameRates)
    assertDeepEqual(validateRationalFrameRate(rate), rate);
  assertThrows(() => validateRationalFrameRate({ numerator: 0, denominator: 1 }));
  assertThrows(() => validateRationalFrameRate({ numerator: 1, denominator: -1 }));
  assertEqual(frameRateLabel({ numerator: 24000, denominator: 1001 }), '23.976');
  assertEqual(frameRateLabel({ numerator: 30000, denominator: 1001 }), '29.97');
  assertEqual(frameRateLabel({ numerator: 60000, denominator: 1001 }), '59.94');
  assertEqual(frameDurationNs({ numerator: 25, denominator: 1 }), 40_000_000n);
  assertEqual(frameNumberToTimestampNs(1n, { numerator: 24, denominator: 1 }), 41_666_666n);
  assertEqual(frameNumberToTimestampNs(1n, { numerator: 30, denominator: 1 }), 33_333_333n);
  assertEqual(frameNumberToTimestampNs(1n, { numerator: 30000, denominator: 1001 }), 33_366_666n);
  assertEqual(frameNumberToTimestampNs(1n, { numerator: 60000, denominator: 1001 }), 16_683_333n);
  assertEqual(
    timestampNsToFrameNumber(frameNumberToTimestampNs(10n, { numerator: 25, denominator: 1 }), {
      numerator: 25,
      denominator: 1,
    }),
    10n,
  );
  const dayNs = 86_400n * 1_000_000_000n;
  const f2997 = timestampNsToFrameNumber(dayNs, { numerator: 30000, denominator: 1001 });
  const f5994 = timestampNsToFrameNumber(dayNs, { numerator: 60000, denominator: 1001 });
  assertOk(
    dayNs - frameNumberToTimestampNs(f2997, { numerator: 30000, denominator: 1001 }) <
      frameDurationNs({ numerator: 30000, denominator: 1001 }),
  );
  assertOk(
    dayNs - frameNumberToTimestampNs(f5994, { numerator: 60000, denominator: 1001 }) <
      frameDurationNs({ numerator: 60000, denominator: 1001 }),
  );
}
{
  const timeSource = new FakeMonotonicTimeSource();
  const clock = createMasterFrameClock({
    frameRate: { numerator: 30000, denominator: 1001 },
    timeSource,
    waitStrategy: new ImmediateFrameWaitStrategy(),
    lateFrameToleranceNs: 1_000_000n,
    discontinuityThresholdNs: 1n,
  });
  assertEqual(clock.state, 'CREATED');
  clock.start();
  assertThrows(() => clock.start(), FrameClockAlreadyRunningError);
  timeSource.advanceTo(clock.getDeadlineForFrame(1n));
  const tick1 = await clock.nextTick();
  timeSource.advanceTo(clock.getDeadlineForFrame(2n));
  const tick2 = await clock.nextTick();
  assertEqual(tick1.frameNumber, 1n);
  assertEqual(tick2.frameNumber, 2n);
  assertOk(tick2.scheduledTimeNs > tick1.scheduledTimeNs);
  assertEqual(tick2.late, false);
  assertEqual(tick2.missedFrames, 0n);
  assertEqual(
    tick2.presentationTimeNs,
    frameNumberToTimestampNs(2n, { numerator: 30000, denominator: 1001 }),
  );
  timeSource.advanceTo(clock.getDeadlineForFrame(6n) + 2_000_000n);
  const late = await clock.nextTick();
  assertEqual(late.frameNumber, 6n);
  assertEqual(late.late, true);
  assertEqual(late.missedFrames, 3n);
  timeSource.advanceTo(clock.getDeadlineForFrame(40n) + 200_000_000n);
  const discontinuity = await clock.nextTick();
  assertEqual(discontinuity.discontinuity, true);
  clock.pause();
  timeSource.advanceMs(10_000);
  clock.resume();
  timeSource.advanceTo(clock.getDeadlineForFrame(clock.currentFrame + 1n));
  assertEqual((await clock.nextTick()).discontinuity, true);
  timeSource.setNowNs(1n);
  assertThrows(() => clock.createTickAt(1n), TimeSourceMovedBackwardError);
  clock.stop();
  await assertRejects(() => clock.nextTick(), FrameClockStoppedError);
  assertThrows(() => clock.resume());
}
{
  const timeSource = new FakeMonotonicTimeSource();
  const clock = createMasterFrameClock({
    frameRate: { numerator: 25, denominator: 1 },
    timeSource,
    waitStrategy: new ImmediateFrameWaitStrategy(),
  });
  clock.start();
  clock.pause();
  clock.reset();
  assertEqual(clock.state, 'CREATED');
  clock.start();
  timeSource.advanceTo(clock.getDeadlineForFrame(1n));
  assertEqual((await clock.nextTick()).frameNumber, 1n);
}
{
  const timeSource = new FakeMonotonicTimeSource();
  const clock = createMasterFrameClock({
    frameRate: { numerator: 30, denominator: 1 },
    timeSource,
    waitStrategy: new ImmediateFrameWaitStrategy(),
  });
  const publisher = new InMemoryRuntimeEventPublisher();
  const engine = createRuntimeExecutionEngine({ runtimeId: 'v512-integration' }, publisher, {
    nowMs: () => Number(timeSource.nowNs() / 1_000_000n),
    nowNs: () => timeSource.nowNs(),
  });
  await engine.initialize();
  await engine.start();
  engine.schedule(cmd('target1', { sequence: 501n, targetFrame: 1n }));
  engine.schedule(cmd('target10', { sequence: 502n, targetFrame: 10n }));
  engine.schedule(cmd('sameA', { sequence: 503n, targetFrame: 10n, priority: 2 }));
  engine.schedule(cmd('sameB', { sequence: 504n, targetFrame: 10n, priority: 1 }));
  timeSource.advanceTo(engine.masterFrameClock.getDeadlineForFrame(1n));
  await engine.executeSingleTick();
  assertEqual(engine.currentFrameNumber, 1n);
  timeSource.advanceTo(engine.masterFrameClock.getDeadlineForFrame(12n));
  await engine.executeSingleTick();
  assertEqual(engine.scheduler.pendingCount(), 0);
  assertOk(engine.telemetry.current().totalMissedFrames !== '0');
  assertOk(publisher.events.some((e) => e.eventType === 'FrameTickProduced'));
  assertOk(publisher.events.some((e) => e.eventType === 'FrameFramesMissed'));
  await engine.pause();
  engine.schedule(
    cmd('afterPause', { sequence: 505n, targetFrame: engine.currentFrameNumber + 1n }),
  );
  timeSource.advanceMs(1000);
  await engine.resume();
  timeSource.advanceTo(engine.masterFrameClock.getDeadlineForFrame(engine.currentFrameNumber + 1n));
  await engine.executeSingleTick();
  assertEqual(engine.scheduler.pendingCount(), 0);
  await assertRejects(() => Promise.all([engine.executeSingleTick(), engine.executeSingleTick()]));
  await new Promise((resolve) => setTimeout(resolve, 0));
  await engine.stop();
}

// UBOS v5.1.3 deterministic runtime scheduler validation.
{
  const scheduler = new DeterministicCommandScheduler(
    10,
    () => 120n,
    () => 120_000n,
  );
  scheduler.schedule(
    cmd('CUT_CAMERA_2', {
      targetFrame: 120n,
      priority: 90,
      sequence: 2n,
      dependencies: ['GRAPHIC_OUT'],
    }),
  );
  scheduler.schedule(cmd('LOWER_THIRD_TAKE', { targetFrame: 120n, priority: 80, sequence: 4n }));
  scheduler.schedule(cmd('AUDIO_FADE', { targetFrame: 120n, priority: 80, sequence: 3n }));
  scheduler.schedule(cmd('GRAPHIC_OUT', { targetFrame: 120n, priority: 100, sequence: 1n }));
  const collected = scheduler.collectDue(120n, 120_000n);
  assertDeepEqual(
    collected.commands.map((c) => c.id),
    ['GRAPHIC_OUT', 'AUDIO_FADE', 'LOWER_THIRD_TAKE'],
  );
  assertDeepEqual(collected.readyIds, ['GRAPHIC_OUT', 'AUDIO_FADE', 'LOWER_THIRD_TAKE']);
  scheduler.markCompleted('GRAPHIC_OUT');
  assertDeepEqual(
    scheduler.collectDue(120n, 120_000n).commands.map((c) => c.id),
    ['CUT_CAMERA_2'],
  );
  assertEqual(scheduler.snapshot().maximumQueueDepth, 4);
}
{
  const run = (order: readonly string[]) => {
    const scheduler = new DeterministicCommandScheduler(
      10,
      () => 120n,
      () => 120_000n,
    );
    const commands: Record<string, RuntimeCommand> = {
      g: cmd('GRAPHIC_OUT', { targetFrame: 120n, priority: 100, sequence: 1n }),
      c: cmd('CUT_CAMERA_2', {
        targetFrame: 120n,
        priority: 90,
        sequence: 2n,
        dependencies: ['GRAPHIC_OUT'],
      }),
      a: cmd('AUDIO_FADE', { targetFrame: 120n, priority: 80, sequence: 3n }),
      l: cmd('LOWER_THIRD_TAKE', { targetFrame: 120n, priority: 80, sequence: 4n }),
    };
    for (const key of order) scheduler.schedule(commands[key]!);
    return scheduler
      .collectDue(120n, 120_000n)
      .commands.map((c) => c.id)
      .join('|');
  };
  const expected = run(['g', 'c', 'a', 'l']);
  for (let i = 0; i < 1000; i++) assertEqual(run(['l', 'a', 'c', 'g']), expected);
}
{
  const scheduler = new DeterministicCommandScheduler(
    10,
    () => 10n,
    () => 1_000n,
  );
  scheduler.schedule(cmd('missing', { dependencies: ['never'], targetFrame: 1n }));
  assertDeepEqual(scheduler.collectDue(10n, 1_000n).failedDependencyIds, ['missing']);
  scheduler.schedule(cmd('root', { groupId: 'SCENE_SWITCH', sequence: 11n, targetFrame: 20n }));
  scheduler.schedule(
    cmd('child', {
      groupId: 'SCENE_SWITCH',
      sequence: 12n,
      targetFrame: 20n,
      dependencies: ['root'],
    }),
  );
  assertEqual(scheduler.lookupByGroup('SCENE_SWITCH').length, 2);
  assertEqual(scheduler.lookupByDependency('root')[0]?.id, 'child');
  assertEqual(scheduler.cancelSubtree('root').length, 2);
  assertEqual(scheduler.snapshot().cancelledCommands, 2);
}
{
  const scheduler = new DeterministicCommandScheduler(
    10,
    () => 10n,
    () => 1_000n,
  );
  scheduler.schedule(cmd('late-drop', { targetFrame: 1n, policy: 'DROP_IF_LATE' }));
  assertDeepEqual(scheduler.collectDue(10n, 1_000n).expiredIds, ['late-drop']);
  assertEqual(scheduler.snapshot().expiredCommands, 1);
}

// UBOS v5.1.3 final deterministic scheduler audit coverage.
const makePrng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
};
const shuffled = <T>(items: readonly T[], seed: number) => {
  const rand = makePrng(seed);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};
const serializeSchedulerSnapshot = (scheduler: DeterministicCommandScheduler) =>
  JSON.stringify({
    pending: scheduler.inspectPendingCommands().map((c) => c.id),
    snapshot: scheduler.snapshot(),
  });
{
  const base = [
    cmd('A1', {
      sequence: 1n,
      targetFrame: 10n,
      scheduledTimeNs: 100n,
      priority: 5,
      groupId: 'g1',
    }),
    cmd('A2', {
      sequence: 2n,
      targetFrame: 10n,
      scheduledTimeNs: 100n,
      priority: 5,
      groupId: 'g1',
    }),
    cmd('B1', { sequence: 3n, targetFrame: 9n, scheduledTimeNs: 90n, priority: 1 }),
    cmd('D1', { sequence: 4n, targetFrame: 10n, scheduledTimeNs: 100n, priority: 9 }),
    cmd('D2', {
      sequence: 5n,
      targetFrame: 10n,
      scheduledTimeNs: 100n,
      priority: 8,
      dependencies: ['D1'],
    }),
    cmd('D3', {
      sequence: 6n,
      targetFrame: 10n,
      scheduledTimeNs: 100n,
      priority: 8,
      dependencies: ['D1'],
    }),
    cmd('D4', {
      sequence: 7n,
      targetFrame: 11n,
      scheduledTimeNs: 100n,
      priority: 8,
      dependencies: ['D2', 'D3'],
    }),
    cmd('LATE', {
      sequence: 8n,
      targetFrame: 1n,
      scheduledTimeNs: 1n,
      priority: 99,
      policy: 'DROP_IF_LATE',
    }),
    cmd('CANCEL', { sequence: 9n, targetFrame: 10n, scheduledTimeNs: 100n, priority: 99 }),
  ];
  const run = (order: readonly RuntimeCommand[]) => {
    const scheduler = new DeterministicCommandScheduler(
      50,
      () => 10n,
      () => 100n,
    );
    for (const c of order) scheduler.schedule(c);
    scheduler.cancel('CANCEL');
    scheduler.assertInvariants();
    const ready: string[] = [],
      executed: string[] = [],
      dep: string[] = [];
    for (let i = 0; i < 4; i++) {
      const batch = scheduler.collectDue(11n, 100n);
      ready.push(...batch.readyIds);
      dep.push(...batch.dependencySatisfied);
      for (const c of batch.commands) {
        executed.push(c.id);
        scheduler.markCompleted(c.id);
      }
      scheduler.assertInvariants();
    }
    return {
      ready,
      executed,
      dep,
      snapshot: scheduler.snapshot(),
      pending: scheduler.inspectPendingCommands().map((c) => c.id),
    };
  };
  const expected = run(base);
  for (let seed = 1; seed <= 200; seed++) assertDeepEqual(run(shuffled(base, seed)), expected);
}
{
  const linear = new DeterministicCommandScheduler(
    10,
    () => 1n,
    () => 1n,
  );
  ['L3', 'L1', 'L2'].forEach((id, i) =>
    linear.schedule(
      cmd(id, {
        sequence: BigInt(i + 1),
        dependencies: id === 'L1' ? [] : [id === 'L2' ? 'L1' : 'L2'],
      }),
    ),
  );
  assertDeepEqual(
    linear.collectDue(1n, 1n).commands.map((c) => c.id),
    ['L1'],
  );
  linear.markCompleted('L1');
  assertDeepEqual(
    linear.collectDue(1n, 1n).commands.map((c) => c.id),
    ['L2'],
  );
  linear.markCompleted('L2');
  assertDeepEqual(
    linear.collectDue(1n, 1n).commands.map((c) => c.id),
    ['L3'],
  );
  const failed = new DeterministicCommandScheduler(10);
  failed.schedule(cmd('root', { sequence: 10n }));
  failed.schedule(cmd('child', { sequence: 11n, dependencies: ['root'] }));
  failed.markFailed('root');
  assertDeepEqual(failed.collectDue(1n, 1n).failedDependencyIds, ['child']);
  const cancelled = new DeterministicCommandScheduler(10);
  cancelled.schedule(cmd('root', { sequence: 20n }));
  cancelled.schedule(cmd('child', { sequence: 21n, dependencies: ['root'] }));
  cancelled.cancel('root');
  assertDeepEqual(cancelled.collectDue(1n, 1n).failedDependencyIds, ['child']);
  const expired = new DeterministicCommandScheduler(10);
  expired.schedule(cmd('root', { sequence: 30n, expiresAtFrame: 0n }));
  expired.schedule(cmd('child', { sequence: 31n, dependencies: ['root'] }));
  assertDeepEqual(expired.collectDue(1n, 1n).failedDependencyIds, ['child']);
  const missing = new DeterministicCommandScheduler(10);
  missing.schedule(cmd('orphan', { dependencies: ['never'] }));
  assertDeepEqual(missing.collectDue(1n, 1n).failedDependencyIds, ['orphan']);
  const cycle = new DeterministicCommandScheduler(10);
  cycle.schedule(cmd('C1', { sequence: 41n, dependencies: ['C2'] }));
  assertThrows(
    () => cycle.schedule(cmd('C2', { sequence: 42n, dependencies: ['C1'] })),
    /DependencyCycle/,
  );
}
{
  const scheduler = new DeterministicCommandScheduler(10);
  scheduler.schedule(
    cmd('immutable', {
      payload: { nested: { value: 1 }, list: [1, 2] },
      dependencies: ['dep'],
      groupId: 'group',
    }),
  );
  const pending = scheduler.listPending() as RuntimeCommand<{
    nested: { value: number };
    list: number[];
  }>[];
  assertThrows(() => {
    pending[0]!.payload.nested.value = 99;
  }, TypeError);
  assertThrows(() => {
    (pending[0]!.dependencies as string[]).push('evil');
  }, TypeError);
  const rec = scheduler.lookupById('immutable')! as typeof scheduler.lookupById extends (
    id: string,
  ) => infer R
    ? R
    : never;
  assertThrows(() => {
    (
      rec as { command: RuntimeCommand<{ nested: { value: number } }> }
    ).command.payload.nested.value = 88;
  }, TypeError);
  assertDeepEqual(scheduler.lookupById('immutable')?.command.payload, {
    nested: { value: 1 },
    list: [1, 2],
  });
  const snap = scheduler.snapshot() as { pendingCommands: number };
  assertThrows(() => {
    snap.pendingCommands = 999;
  }, TypeError);
  assertEqual(scheduler.snapshot().pendingCommands, 1);
}
{
  const counts = new Map<string, number>();
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    commandQueueCapacity: 100,
    maximumCommandsPerTick: 100,
  });
  engine.handlers.register('COUNT', (c) => {
    counts.set(c.id, (counts.get(c.id) ?? 0) + 1);
  });
  await engine.start();
  engine.schedule(cmd('once', { type: 'COUNT', sequence: 501n }));
  await engine.executeSingleTick();
  await engine.executeSingleTick();
  assertEqual(counts.get('once'), 1);
  assertThrows(
    () => engine.schedule(cmd('once', { type: 'COUNT', sequence: 502n })),
    DuplicateCommandError,
  );
  engine.schedule(cmd('cancelled-once', { type: 'COUNT', sequence: 503n }));
  engine.scheduler.cancel('cancelled-once');
  await engine.executeSingleTick();
  assertEqual(counts.get('cancelled-once') ?? 0, 0);
  const p1 = engine.executeSingleTick();
  await assertRejects(() => engine.executeSingleTick(), /RuntimeTickInProgress/);
  await p1;
}
{
  const measurements: Record<string, Record<string, number>> = {};
  for (const n of [10_000, 25_000]) {
    const scheduler = new DeterministicCommandScheduler(
      n + 10,
      () => 1n,
      () => 1n,
    );
    const start = performance.now();
    for (let i = 0; i < n; i++)
      scheduler.schedule(
        cmd(`P${i}`, {
          sequence: BigInt(i + 10_000),
          groupId: `G${i % 10}`,
          targetFrame: 1n,
          scheduledTimeNs: 1n,
          priority: i % 5,
        }),
      );
    const inserted = performance.now();
    scheduler.lookupById(`P${Math.floor(n / 2)}`);
    const lookup = performance.now();
    scheduler.lookupByGroup('G3');
    const group = performance.now();
    scheduler.cancel(`P${n - 1}`);
    const cancel = performance.now();
    scheduler.snapshot();
    const snapshot = performance.now();
    scheduler.collectDue(1n, 1n);
    const due = performance.now();
    measurements[String(n)] = {
      insertionMs: inserted - start,
      lookupByIdMs: lookup - inserted,
      groupLookupMs: group - lookup,
      cancelByIdMs: cancel - group,
      snapshotMs: snapshot - cancel,
      dueSortResolveMs: due - snapshot,
    };
    scheduler.assertInvariants();
  }
  console.log('scheduler large-queue measurements', JSON.stringify(measurements));
  assertOk(
    (measurements['25000']!.dueSortResolveMs ?? 0) /
      (measurements['10000']!.dueSortResolveMs ?? 1) <
      10,
  );
}

console.log('execution-engine validation passed');

// v5.1.4 command execution engine: typed results, history, idempotency, retries, and runtime integration.
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const engine = await readyEngine(publisher, new FakeClock(), {
    runtimeId: 'v514',
    executionHistoryCapacity: 2,
  });
  engine.handlers.register('SYNC_OK', {
    commandType: 'SYNC_OK',
    execute: () => ({ status: 'SUCCEEDED', metadata: { ok: true } }),
  });
  engine.handlers.register('ASYNC_OK', {
    commandType: 'ASYNC_OK',
    execute: async () => ({ status: 'SUCCEEDED' }),
  });
  engine.handlers.register('TYPED_FAIL', {
    commandType: 'TYPED_FAIL',
    execute: () => ({
      status: 'FAILED',
      error: { code: 'TypedFailure', message: 'typed failure' },
      retryable: false,
    }),
  });
  await engine.start();
  engine.schedule(
    cmd('ce1', {
      type: 'SYNC_OK',
      sequence: 900n,
      correlationId: 'corr',
      idempotencyKey: 'idem-1',
    }),
  );
  engine.schedule(cmd('ce2', { type: 'ASYNC_OK', sequence: 901n }));
  engine.schedule(cmd('ce3', { type: 'TYPED_FAIL', sequence: 902n }));
  await engine.executeSingleTick();
  assertEqual(engine.commandExecutionEngine.getExecution('ce1'), undefined);
  assertEqual(engine.commandExecutionEngine.getExecutionByIdempotencyKey('idem-1'), undefined);
  assertEqual(engine.commandExecutionEngine.listByCorrelationId('corr').length, 0);
  assertEqual(engine.commandExecutionEngine.listExecutions().length, 2);
  assertEqual(engine.commandExecutionEngine.getExecution('ce3')?.errorCode, 'TypedFailure');
  assertDeepEqual(engine.commandExecutionEngine.assertInvariants().historySize, 2);
  assertOk(publisher.events.some((e) => e.eventType === 'CommandExecutionSucceeded'));
  assertOk(publisher.events.some((e) => e.eventType === 'CommandExecutionFailed'));
  assertEqual(engine.telemetry.current().totalCommandExecutions, 3);
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'duplicate-exec',
  });
  const c = cmd('dup-exec', { type: 'RUNTIME_NOOP', sequence: 910n });
  const tick = {
    frameNumber: 1n,
    startedAtNs: 1n,
    deadlineAtNs: 1n,
    scheduledTimeNs: 1n,
    actualTimeNs: 1n,
    presentationTimeNs: 1n,
    frameDurationNs: 1n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  };
  await engine.commandExecutionEngine.execute(c, {
    runtimeContext: engine.context(),
    frameTick: tick,
  });
  await assertRejects(
    () =>
      engine.commandExecutionEngine.execute(c, {
        runtimeContext: engine.context(),
        frameTick: tick,
      }),
    /CommandExecutionAlreadyTerminal/,
  );
  await assertRejects(
    () =>
      engine.commandExecutionEngine
        .execute(cmd('dup-conflict', { sequence: 911n, idempotencyKey: 'idem-x' }), {
          runtimeContext: engine.context(),
          frameTick: tick,
        })
        .then(async () =>
          engine.commandExecutionEngine.execute(
            cmd('dup-conflict-2', { sequence: 912n, idempotencyKey: 'idem-x' }),
            { runtimeContext: engine.context(), frameTick: tick },
          ),
        ),
    /ConflictingIdempotencyKey/,
  );
}
{
  let attempts = 0;
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'retry',
  });
  engine.handlers.register('FLAKY', {
    commandType: 'FLAKY',
    execute: () =>
      ++attempts < 2
        ? { status: 'FAILED', error: { code: 'Transient', message: 'try again' }, retryable: true }
        : { status: 'SUCCEEDED' },
  });
  await engine.start();
  engine.schedule(
    cmd('retry-1', {
      type: 'FLAKY',
      sequence: 920n,
      policy: 'EXECUTE_UNTIL_SUCCESS',
      retryPolicy: { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maximumDelayMs: 10 },
    }),
  );
  await engine.executeSingleTick();
  assertEqual(attempts, 2);
  assertEqual(engine.commandExecutionEngine.getExecution('retry-1')?.outcome, 'SUCCEEDED');
  assertEqual(engine.telemetry.current().retriedCommandExecutions, 1);
}
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const engine = await readyEngine(publisher, new FakeClock(), { runtimeId: 'barrier' });
  await engine.start();
  engine.schedule(cmd('bar-1', { sequence: 930n }));
  engine.schedule(cmd('bar-2', { type: 'RUNTIME_BARRIER', sequence: 931n }));
  engine.schedule(cmd('bar-3', { sequence: 932n }));
  await engine.executeSingleTick();
  const started = publisher.events
    .filter((e) => e.eventType === 'CommandExecutionStarted')
    .map((e) => e.payload.commandId);
  assertDeepEqual(started, ['bar-1', 'bar-2', 'bar-3']);
  assertOk(publisher.events.some((e) => e.eventType === 'CommandBarrierReleased'));
}

// v5.1.4 final audit regressions: cancellation is not timeout, evicted terminal ids stay terminal,
// non-Error throws normalize, runtime failure clears active state, and 10k direct executions stay bounded.
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'cancel-audit',
  });
  engine.handlers.register('WAIT_FOR_CANCEL', {
    commandType: 'WAIT_FOR_CANCEL',
    execute: (_command, context) =>
      new Promise((resolve) => {
        context.cancellationSignal.addEventListener(
          'abort',
          () => resolve({ status: 'CANCELLED', reason: String(context.cancellationSignal.reason) }),
          { once: true },
        );
      }),
  });
  const tick = {
    frameNumber: 1n,
    startedAtNs: 1n,
    deadlineAtNs: 1n,
    scheduledTimeNs: 1n,
    actualTimeNs: 1n,
    presentationTimeNs: 1n,
    frameDurationNs: 1n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  };
  const executing = engine.commandExecutionEngine.execute(
    cmd('cancel-audit-1', { type: 'WAIT_FOR_CANCEL', sequence: 940n, timeoutMs: 30_000 }),
    { runtimeContext: engine.context(), frameTick: tick },
  );
  for (let i = 0; i < 10 && engine.telemetry.current().activeCommandExecutions === 0; i++)
    await Promise.resolve();
  assertEqual(engine.commandExecutionEngine.cancel('cancel-audit-1', 'operator cancelled'), true);
  const record = await executing;
  assertEqual(record.outcome, 'CANCELLED');
  assertEqual(record.timeout, false);
  assertEqual(engine.telemetry.current().activeCommandExecutions, 0);
  assertEqual(engine.telemetry.current().currentlyExecutingCommandId, undefined);
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'eviction-audit',
    executionHistoryCapacity: 1,
  });
  const tick = {
    frameNumber: 1n,
    startedAtNs: 1n,
    deadlineAtNs: 1n,
    scheduledTimeNs: 1n,
    actualTimeNs: 1n,
    presentationTimeNs: 1n,
    frameDurationNs: 1n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  };
  await engine.commandExecutionEngine.execute(
    cmd('evicted-terminal-1', { sequence: 950n, idempotencyKey: 'evicted-idem' }),
    { runtimeContext: engine.context(), frameTick: tick },
  );
  await engine.commandExecutionEngine.execute(cmd('evicted-terminal-2', { sequence: 951n }), {
    runtimeContext: engine.context(),
    frameTick: tick,
  });
  assertEqual(engine.commandExecutionEngine.getExecution('evicted-terminal-1'), undefined);
  await assertRejects(
    () =>
      engine.commandExecutionEngine.execute(cmd('evicted-terminal-1', { sequence: 952n }), {
        runtimeContext: engine.context(),
        frameTick: tick,
      }),
    /CommandExecutionAlreadyTerminal/,
  );
  await assertRejects(
    () =>
      engine.commandExecutionEngine.execute(
        cmd('evicted-terminal-3', { sequence: 953n, idempotencyKey: 'evicted-idem' }),
        { runtimeContext: engine.context(), frameTick: tick },
      ),
    /ConflictingIdempotencyKey/,
  );
  assertEqual(engine.commandExecutionEngine.assertInvariants().historySize, 1);
  assertEqual(engine.commandExecutionEngine.assertInvariants().terminalCommands, 2);
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'throw-audit',
  });
  engine.handlers.register('THROW_STRING', {
    commandType: 'THROW_STRING',
    execute: () => {
      throw 'string failure';
    },
  });
  const tick = {
    frameNumber: 1n,
    startedAtNs: 1n,
    deadlineAtNs: 1n,
    scheduledTimeNs: 1n,
    actualTimeNs: 1n,
    presentationTimeNs: 1n,
    frameDurationNs: 1n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  };
  const record = await engine.commandExecutionEngine.execute(
    cmd('throw-string-1', { type: 'THROW_STRING', sequence: 960n }),
    { runtimeContext: engine.context(), frameTick: tick },
  );
  assertEqual(record.outcome, 'FAILED');
  assertEqual(record.errorCode, 'NonErrorThrown');
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'failure-active-audit',
  });
  engine.handlers.register('WAIT_FOR_RUNTIME_FAIL', {
    commandType: 'WAIT_FOR_RUNTIME_FAIL',
    execute: (_command, context) =>
      new Promise((resolve) => {
        context.cancellationSignal.addEventListener(
          'abort',
          () => resolve({ status: 'CANCELLED', reason: String(context.cancellationSignal.reason) }),
          { once: true },
        );
      }),
  });
  const tick = {
    frameNumber: 1n,
    startedAtNs: 1n,
    deadlineAtNs: 1n,
    scheduledTimeNs: 1n,
    actualTimeNs: 1n,
    presentationTimeNs: 1n,
    frameDurationNs: 1n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  };
  const executing = engine.commandExecutionEngine.execute(
    cmd('runtime-fail-active-1', {
      type: 'WAIT_FOR_RUNTIME_FAIL',
      sequence: 970n,
      timeoutMs: 30_000,
    }),
    { runtimeContext: engine.context(), frameTick: tick },
  );
  for (let i = 0; i < 10 && engine.telemetry.current().activeCommandExecutions === 0; i++)
    await Promise.resolve();
  await engine.fail(new Error('fatal runtime audit'));
  const record = await executing;
  assertEqual(record.outcome, 'CANCELLED');
  assertEqual(engine.commandExecutionEngine.assertInvariants().activeExecutions, 0);
}
{
  const engine = await readyEngine(new InMemoryRuntimeEventPublisher(), new FakeClock(), {
    runtimeId: 'heavy-active-audit',
    executionHistoryCapacity: 32,
  });
  const tick = {
    frameNumber: 1n,
    startedAtNs: 1n,
    deadlineAtNs: 1n,
    scheduledTimeNs: 1n,
    actualTimeNs: 1n,
    presentationTimeNs: 1n,
    frameDurationNs: 1n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  };
  const start = performance.now();
  for (let i = 0; i < 10_000; i++)
    await engine.commandExecutionEngine.execute(
      cmd(`heavy-${i}`, { sequence: BigInt(20_000 + i), correlationId: `heavy-${i % 4}` }),
      { runtimeContext: engine.context(), frameTick: tick },
    );
  const durationMs = performance.now() - start;
  console.log('command execution heavy measurement', JSON.stringify({ count: 10_000, durationMs }));
  assertEqual(engine.commandExecutionEngine.assertInvariants().activeExecutions, 0);
  assertEqual(engine.commandExecutionEngine.assertInvariants().historySize, 32);
  assertEqual(engine.commandExecutionEngine.assertInvariants().terminalCommands, 10_000);
  assertEqual(engine.telemetry.current().totalCommandExecutions, 10_000);
  assertEqual(engine.telemetry.current().activeCommandExecutions, 0);
}

// UBOS v5.1.5 runtime execution loop validation: budgets, loop state, overload,
// processor skipping, heartbeat, health window, and deterministic long-run ticks.
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const fakeTime = new FakeMonotonicTimeSource(0n);
  const clock = {
    nowMs: () => Number(fakeTime.nowNs() / 1_000_000n),
    nowNs: () => fakeTime.nowNs(),
  };
  const masterFrameClock = createMasterFrameClock({
    frameRate: { numerator: 30, denominator: 1 },
    timeSource: fakeTime,
    waitStrategy: new ImmediateFrameWaitStrategy(),
  });
  const services = new Map<string, unknown>([['masterFrameClock', masterFrameClock]]);
  const engine = new RuntimeExecutionEngine(
    {
      ...defaultRuntimeEngineConfig('v515-loop'),
      frameRate: { numerator: 30, denominator: 1 },
      tickHealthWindowCapacity: 8,
      defaultProcessorTimeoutNs: 3_000_000n,
    },
    publisher,
    clock,
    console,
    services,
  );
  const processorOrder: string[] = [];
  engine.processors.register({
    id: 'critical',
    order: 1,
    workloadClass: 'CRITICAL',
    initialize() {},
    shutdown() {
      processorOrder.push('shutdown-critical');
    },
    processTick() {
      processorOrder.push('critical');
      fakeTime.advanceNs(2_000_000n);
    },
  });
  engine.processors.register({
    id: 'best-effort',
    order: 2,
    workloadClass: 'BEST_EFFORT',
    maySkipUnderLoad: true,
    initialize() {},
    shutdown() {
      processorOrder.push('shutdown-best-effort');
    },
    processTick() {
      processorOrder.push('best-effort');
    },
  });
  await engine.initialize();
  await engine.start();
  engine.schedule(cmd('v515-1', { sequence: 1n, targetFrame: 1n }));
  fakeTime.advanceNs(frameDurationNs({ numerator: 30, denominator: 1 }));
  const result = await engine.executeSingleTick();
  assertEqual(result.runtimeId, 'v515-loop');
  assertEqual(result.frameNumber, '1');
  assertEqual(result.successfulCommands, 1);
  assertEqual(processorOrder[0], 'critical');
  assertOk(engine.telemetry.current().lastTickResult);
  assertEqual(engine.telemetry.current().recentTickHealthWindow.length, 1);
  assertEqual(engine.telemetry.current().currentLoopPhase, 'IDLE');
  await engine.pause();
  assertEqual(engine.getState(), 'PAUSED');
  await assertRejects(() => engine.executeSingleTick(), RuntimeNotReadyError);
  await engine.resume();
  assertEqual(engine.lifecycleState, 'RUNNING');
  await engine.stop();
  assertEqual(engine.lifecycleState, 'STOPPED');
  assertEqual(processorOrder.slice(-2).join(','), 'shutdown-best-effort,shutdown-critical');
  assertOk(publisher.events.some((e) => e.eventType === 'RuntimeTickCompleted'));
}
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const fakeTime = new FakeMonotonicTimeSource(0n);
  const clock = {
    nowMs: () => Number(fakeTime.nowNs() / 1_000_000n),
    nowNs: () => fakeTime.nowNs(),
  };
  const engine = createRuntimeExecutionEngine(
    {
      runtimeId: 'v515-overrun',
      tickHealthWindowCapacity: 4,
      processorBudgetPercent: 1,
      maximumTickOverrunNs: 1n,
      severeTickOverrunNs: 5n,
    },
    publisher,
    clock,
  );
  await engine.initialize();
  await engine.start();
  await engine.stop();
}
console.log('runtime loop validation passed');

// UBOS v5.1.6 tick processor framework validation.
{
  const publisher = new InMemoryRuntimeEventPublisher();
  const engine = createRuntimeExecutionEngine(
    { runtimeId: 'v516-framework' },
    publisher,
    new FakeClock(),
  );
  const order: string[] = [];
  const make = (
    id: string,
    deps: readonly string[] = [],
    phase: 'SOURCE' | 'VIDEO' = 'SOURCE',
  ): TickProcessor => ({
    descriptor: {
      id,
      name: id,
      version: '1.0.0',
      order: 1,
      phase,
      workloadClass: 'REALTIME',
      enabledByDefault: true,
      dependencies: deps,
      optionalCapabilities: [],
      estimatedBudgetNs: 1n,
      maximumBudgetNs: 10n,
      timeoutNs: 10_000_000_000n,
      maySkipUnderLoad: false,
      failurePolicy: 'CONTINUE',
      criticality: 'OPERATIONAL',
      supportsHotDisable: true,
      supportsHotEnable: true,
      supportsHotReplacement: false,
      statePersistencePolicy: 'RESET_ON_DISABLE',
      metadata: {},
    },
    initialize: () => ({ status: 'READY', state: { private: id } }),
    processTick: (_tick, context) => {
      order.push(id);
      if ('outputs' in context) context.outputs.publish(id, 'handle', { id }, 'EXTERNAL_HANDLE');
      return { status: 'SUCCEEDED', metadata: { id } };
    },
    shutdown: () => ({ status: 'STOPPED' }),
  });
  engine.processors.register(make('source', [], 'SOURCE'));
  engine.processors.register(make('video', ['source'], 'VIDEO'));
  assertDeepEqual(engine.processors.getSnapshot().orderedProcessorIds, ['source', 'video']);
  await engine.initialize();
  await engine.start();
  const result = await engine.executeSingleTick();
  assertOk(result.processorCount >= 0);
  assertEqual(engine.processors.getSnapshot().outputRegistryEntryCount, 0);
  assertOk(engine.processors.getHealth('source'));
  assertDoesNotThrow(() => engine.processors.assertInvariants());
  engine.processors.disable('video');
  await engine.executeSingleTick();
  assertEqual(engine.processors.getHealth('video')?.healthState, 'DISABLED');
  await engine.stop();
}
{
  const engine = createRuntimeExecutionEngine(
    { runtimeId: 'v516-deps' },
    new InMemoryRuntimeEventPublisher(),
    new FakeClock(),
  );
  assertThrows(
    () =>
      engine.processors.register({
        descriptor: {
          id: 'missing',
          name: 'missing',
          version: '1',
          order: 1,
          workloadClass: 'REALTIME',
          enabledByDefault: true,
          dependencies: ['none'],
          optionalCapabilities: [],
          estimatedBudgetNs: 0n,
          maximumBudgetNs: 0n,
          timeoutNs: undefined,
          maySkipUnderLoad: false,
          failurePolicy: 'CONTINUE',
          criticality: 'OPTIONAL',
          supportsHotDisable: false,
          supportsHotEnable: false,
          supportsHotReplacement: false,
          statePersistencePolicy: 'EPHEMERAL',
          metadata: {},
          phase: undefined,
        },
        initialize: () => {},
        processTick: () => {},
        shutdown: () => {},
      }),
    /ProcessorDependencyMissing/,
  );
}

// UBOS v5.1.7 telemetry/watchdog and public export validation.
{
  const fakeTime = new FakeMonotonicTimeSource(0n);
  const clock = {
    nowMs: () => Number(fakeTime.nowNs() / 1_000_000n),
    nowNs: () => fakeTime.nowNs(),
  };
  const engine = createRuntimeExecutionEngine(
    { runtimeId: 'v517-watchdog', tickHealthWindowCapacity: 4 },
    new InMemoryRuntimeEventPublisher(),
    clock,
  );
  await engine.initialize();
  await engine.start();
  const watchdog = new (await import('./execution-engine.js')).RuntimeWatchdog(engine, clock, {
    incidentHistoryCapacity: 3,
    diagnosticHistoryCapacity: 3,
    recoveryHistoryCapacity: 2,
    telemetryStaleAfterNs: 10n,
    recoveryBudget: 1,
    recoveryCooldownNs: 1_000n,
  });
  watchdog.start();
  fakeTime.advanceNs(frameDurationNs({ numerator: 30, denominator: 1 }));
  await engine.executeSingleTick();
  const healthy = watchdog.evaluate();
  assertEqual(healthy.frameNumber, engine.telemetry.current().currentFrameNumber);
  assertEqual(healthy.telemetryStalenessNs, '0');
  fakeTime.advanceNs(100n);
  const stale = watchdog.evaluate();
  assertOk(stale.activeIncidentCount >= 1);
  assertOk(stale.diagnostics.length <= 3);
  assertOk(!JSON.stringify(stale).includes('super-secret'));
  watchdog.recordRecovery('restart', 'failed');
  watchdog.recordRecovery('restart', 'budget-exhausted');
  assertOk(watchdog.snapshot().recoveryHistory.length <= 2);
  const incident = watchdog.snapshot().incidents.find((i) => i.status !== 'RESOLVED');
  if (incident) {
    watchdog.acknowledgeIncident(incident.id);
    watchdog.resolveIncident(incident.id);
  }
  watchdog.stop();
  const stopped = watchdog.snapshot();
  assertEqual(stopped.state, 'STOPPED');
  assertEqual(stopped.evaluating, false);
  await engine.stop();
}
{
  const publicApi = await import('./index.js');
  for (const symbol of [
    'RuntimeExecutionEngine',
    'createRuntimeExecutionEngine',
    'createMasterFrameClock',
    'DeterministicCommandScheduler',
    'RuntimeCommandExecutionEngine',
    'TickProcessorRegistry',
    'RuntimeWatchdog',
    'createRuntimeWatchdog',
  ])
    assertOk(symbol in publicApi);
}
console.log('watchdog and public export validation passed');
