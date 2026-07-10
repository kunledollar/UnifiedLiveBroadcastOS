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
  InMemoryRuntimeEventPublisher,
  InvalidEngineConfigurationError,
  InvalidLifecycleTransitionError,
  RuntimeExecutionEngine,
  RuntimeNotReadyError,
  UnknownCommandTypeError,
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

console.log('execution-engine validation passed');
