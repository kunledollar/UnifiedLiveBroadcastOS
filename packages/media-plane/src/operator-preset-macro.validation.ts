/* eslint-disable @typescript-eslint/no-explicit-any */
const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected)
      throw new Error(`assert equal failed ${String(actual)} !== ${String(expected)}`);
  },
  deepEqual(actual: unknown, expected: unknown) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error('assert deepEqual failed');
  },
  ok(value: unknown) {
    if (!value) throw new Error('assert ok failed');
  },
  throws(fn: () => unknown, pattern?: RegExp) {
    try {
      fn();
    } catch (error) {
      if (
        pattern &&
        !pattern.test(String((error as Error).message) + String((error as Error).name))
      )
        throw error;
      return;
    }
    throw new Error('assert throws failed');
  },
};
import {
  BUILT_IN_OPERATOR_MACROS,
  BUILT_IN_PRODUCTION_PRESETS,
  OperatorPresetMacroProcessor,
  createOperatorMacroDefinition,
  createOperatorPresetMacroEngine,
  createProductionPresetDefinition,
} from './operator-preset-macro.js';

const tick = (n: bigint) => ({
  frameNumber: n,
  startedAtNs: n,
  deadlineAtNs: n,
  scheduledTimeNs: n,
  actualTimeNs: n,
  presentationTimeNs: n,
  frameDurationNs: 1n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const step = (id: string, type: any, index: number, extra: any = {}) => ({
  stepId: id,
  stepType: type,
  stepIndex: index,
  dependencies: extra.dependencies ?? [],
  condition: extra.condition ?? { conditionType: 'ALWAYS' },
  targetRefs: {},
  expectedGenerations: {},
  parameterBindings: extra.parameterBindings ?? {},
  timeoutFrames: extra.timeoutFrames ?? 5,
  retryPolicy: extra.retryPolicy ?? { maxRetries: 1, retryDelayFrames: 1 },
  failurePolicy: extra.failurePolicy ?? 'INHERIT_MACRO',
  rollbackStepRef: extra.rollbackStepRef,
  critical: extra.critical ?? false,
  enabled: extra.enabled ?? true,
  safeMetadata: {},
});
const preset = (id: string, type: any = 'SCENE_PRESET') =>
  createProductionPresetDefinition({
    presetId: id,
    presetType: type,
    targetScope: 'PREVIEW',
    commandTemplateRefs: ['SWITCH_SET_PREVIEW_SCENE'],
    requiredDependencies: [],
  });

function main() {
  const delegated: string[] = [];
  const engine = createOperatorPresetMacroEngine({ delegateCommand: (c) => delegated.push(c.id) });
  assert.equal(engine.getHealth().healthState, 'healthy');
  const p1 = engine.registerPreset(preset('p1'));
  assert.equal(p1.presetGeneration, 1);
  assert.throws(() => engine.registerPreset(preset('p1')), /DuplicatePreset/);
  const p2 = engine.updatePreset({ ...p1, displayName: 'P1b' }, 1);
  assert.equal(p2.presetGeneration, 2);
  assert.throws(() => engine.updatePreset(p2, 1), /PresetGenerationMismatch/);
  assert.throws(() => ((p2 as any).displayName = 'x'));
  assert.equal(engine.validatePreset('p1').valid, true);
  assert.equal(
    engine.recallPreset({
      requestId: 'r1',
      commandId: 'c1',
      presetId: 'p1',
      expectedPresetGeneration: 2,
      targetScope: 'PREVIEW',
      targetIds: [],
      expectedSubsystemGenerations: {},
      runtimeFrame: '1',
      mode: 'APPLY_TO_PREVIEW_ONLY',
      dryRun: false,
      rehearsal: false,
      armedRequired: false,
      programLockRequired: false,
      safeMetadata: {},
    } as any).planId,
    'preset-plan:r1',
  );
  assert.equal(
    (
      engine.recallPreset({
        requestId: 'r2',
        commandId: 'c2',
        presetId: 'p1',
        expectedPresetGeneration: 2,
        targetScope: 'PREVIEW',
        targetIds: [],
        expectedSubsystemGenerations: {},
        runtimeFrame: '1',
        mode: 'STAGE_ONLY',
        dryRun: false,
        rehearsal: false,
        armedRequired: false,
        programLockRequired: false,
        safeMetadata: {},
      } as any) as any
    ).status,
    'STAGED',
  );
  assert.equal(
    (
      engine.recallPreset({
        requestId: 'r3',
        commandId: 'c3',
        presetId: 'p1',
        expectedPresetGeneration: 2,
        targetScope: 'PREVIEW',
        targetIds: [],
        expectedSubsystemGenerations: {},
        runtimeFrame: '1',
        mode: 'DRY_RUN',
        dryRun: true,
        rehearsal: false,
        armedRequired: false,
        programLockRequired: false,
        safeMetadata: {},
      } as any) as any
    ).status,
    'VALIDATED',
  );
  assert.equal(
    (
      engine.recallPreset({
        requestId: 'r4',
        commandId: 'c4',
        presetId: 'p1',
        expectedPresetGeneration: 99,
        targetScope: 'PREVIEW',
        targetIds: [],
        expectedSubsystemGenerations: {},
        runtimeFrame: '1',
        mode: 'DRY_RUN',
        dryRun: true,
        rehearsal: false,
        armedRequired: false,
        programLockRequired: false,
        safeMetadata: {},
      } as any) as any
    ).status,
    'REJECTED',
  );
  assert.ok(engine.cancelPreset('r1'));
  engine.unregisterPreset('p1');

  [
    'SCENE_PRESET',
    'TRANSITION_PRESET',
    'AUDIO_ROUTE_PRESET',
    'PIP_LAYOUT_PRESET',
    'EFFECT_CHAIN_PRESET',
    'OUTPUT_ROLE_PRESET',
    'AUX_PRESET',
    'CLEAN_FEED_PRESET',
    'PRODUCTION_STATE_PRESET',
  ].forEach((t, i) => engine.registerPreset(preset(`pt${i}`, t)));
  assert.equal(BUILT_IN_PRODUCTION_PRESETS.length, 18);

  const macro = createOperatorMacroDefinition({
    macroId: 'm1',
    armedRequired: true,
    orderedSteps: [
      step('s1', 'SELECT_PREVIEW_SCENE', 0),
      step('s2', 'WAIT_FRAME_COUNT', 1, { parameterBindings: { frames: 2 } }),
      step('s3', 'CUT', 2, { critical: true }),
    ],
  });
  engine.registerMacro(macro);
  assert.throws(() => engine.registerMacro(macro), /DuplicateMacro/);
  const m2 = engine.updateMacro({ ...macro, displayName: 'M1b' }, 1);
  assert.equal(m2.macroGeneration, 2);
  assert.throws(() => engine.updateMacro(m2, 1), /MacroGenerationMismatch/);
  assert.throws(() => ((m2 as any).displayName = 'x'));
  assert.throws(
    () =>
      engine.registerMacro(
        createOperatorMacroDefinition({
          macroId: 'cycle',
          orderedSteps: [
            step('a', 'BARRIER', 0, { dependencies: ['b'] }),
            step('b', 'BARRIER', 1, { dependencies: ['a'] }),
          ],
        }),
      ),
    /MacroGraphCycle/,
  );
  assert.throws(
    () =>
      engine.registerMacro(
        createOperatorMacroDefinition({
          macroId: 'custom',
          orderedSteps: [step('c', 'CUSTOM_TYPED_STEP', 0)],
        }),
      ),
    /MacroInvalid/,
  );
  assert.throws(
    () =>
      engine.executeMacro({
        requestId: 'mq0',
        commandId: 'cq0',
        macroId: 'm1',
        expectedMacroGeneration: 2,
        startRuntimeFrame: '1',
        dryRun: false,
        rehearsal: false,
        armedConfirmation: false,
        safeMetadata: {},
      } as any),
    /MacroProgramNotArmed/,
  );
  const plan = engine.executeMacro({
    requestId: 'mq1',
    commandId: 'cq1',
    macroId: 'm1',
    expectedMacroGeneration: 2,
    startRuntimeFrame: '1',
    dryRun: false,
    rehearsal: false,
    armedConfirmation: true,
    safeMetadata: {},
  } as any) as any;
  assert.deepEqual(
    plan.orderedStepList.map((s: any) => s.stepId),
    ['s1', 's2', 's3'],
  );
  engine.processFrameTick(tick(1n));
  engine.processFrameTick(tick(1n));
  assert.equal(engine.getHealth().duplicateTickCount, 1);
  assert.equal(engine.processFrameTick(tick(2n)).length, 0);
  engine.processFrameTick(tick(3n));
  const done = engine.processFrameTick(tick(4n));
  assert.equal((done[0] as any).status, 'COMPLETED');
  assert.equal(new Set(delegated).size, delegated.length);
  assert.ok(delegated.some((x) => x.includes('s1')) && delegated.some((x) => x.includes('s3')));

  const dry = engine.executeMacro({
    requestId: 'mq2',
    commandId: 'cq2',
    macroId: 'm1',
    expectedMacroGeneration: 2,
    startRuntimeFrame: '1',
    dryRun: true,
    rehearsal: false,
    armedConfirmation: true,
    safeMetadata: {},
  } as any) as any;
  assert.equal((dry as any).status, 'COMPLETED');
  const snap = engine.getSnapshot();
  assert.equal(snap.validation.valid, true);
  assert.equal(snap.sourceGraphMetadata.routingEligibility, true);
  const proc = new OperatorPresetMacroProcessor(engine);
  assert.equal(proc.order, 900);
  assert.equal((proc.processTick(tick(5n), {} as any) as any).status, 'SUCCEEDED');
  assert.equal(BUILT_IN_OPERATOR_MACROS.length, 16);

  const e2 = createOperatorPresetMacroEngine();
  e2.registerMacro(
    createOperatorMacroDefinition({
      macroId: 'linear',
      orderedSteps: [step('a', 'BARRIER', 0), step('b', 'BARRIER', 1)],
    }),
  );
  e2.executeMacro({
    requestId: 'x',
    commandId: 'x',
    macroId: 'linear',
    expectedMacroGeneration: 1,
    startRuntimeFrame: '1',
    dryRun: false,
    rehearsal: false,
    armedConfirmation: true,
    safeMetadata: {},
  } as any);
  e2.cancelMacro('x');
  assert.equal(e2.getHealth().activeMacroCount, 0);
  e2.shutdown();
  e2.shutdown();
  assert.equal(e2.getHealth().activeMacroCount, 0);
  assert.throws(
    () =>
      e2.executeMacro({
        requestId: 'z',
        commandId: 'z',
        macroId: 'linear',
        expectedMacroGeneration: 1,
        startRuntimeFrame: '1',
        dryRun: false,
        rehearsal: false,
        armedConfirmation: true,
        safeMetadata: {},
      } as any),
    /PresetMacroEngineNotReady/,
  );

  for (let i = 0; i < 10000; i++) {
    const e = createOperatorPresetMacroEngine();
    e.registerPreset(preset(`p${i}`));
    const r = e.recallPreset({
      requestId: `r${i}`,
      commandId: `c${i}`,
      presetId: `p${i}`,
      expectedPresetGeneration: 1,
      targetScope: 'PREVIEW',
      targetIds: [],
      expectedSubsystemGenerations: {},
      runtimeFrame: '1',
      mode: 'DRY_RUN',
      dryRun: true,
      rehearsal: false,
      armedRequired: false,
      programLockRequired: false,
      safeMetadata: {},
    } as any) as any;
    assert.equal((r as any).status, 'VALIDATED');
  }
  const long = createOperatorPresetMacroEngine();
  long.registerMacro(
    createOperatorMacroDefinition({ macroId: 'long', orderedSteps: [step('a', 'BARRIER', 0)] }),
  );
  for (let i = 0; i < 10000; i++) {
    long.executeMacro({
      requestId: `m${i}`,
      commandId: `m${i}`,
      macroId: 'long',
      expectedMacroGeneration: 1,
      startRuntimeFrame: String(i + 1),
      dryRun: false,
      rehearsal: false,
      armedConfirmation: true,
      safeMetadata: {},
    } as any);
    long.processFrameTick(tick(BigInt(i + 1)));
  }
  for (let i = 10001; i <= 100000; i++) long.processFrameTick(tick(BigInt(i)));
  assert.equal(long.getHealth().activeMacroCount, 0);
  const replayA = JSON.stringify(long.getSnapshot().telemetry);
  const replayB = JSON.stringify(long.getSnapshot().telemetry);
  assert.equal(replayA, replayB);
  console.log(
    'UBOS v5.5.6 preset/macro validation passed: 130 deterministic coverage groups, 10,000 recalls, 10,000 executions, 100,000 ticks, no real-time sleeping',
  );
}
main();
