/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import assert from 'node:assert/strict';
import {
  createTransitionExecutionEngine,
  evaluateTransitionProgress,
  TRANSITION_TYPES,
  type TransitionDefinition,
  type TransitionExecutionRequest,
} from './transition-execution-engine.js';
import type { FrameTick } from './execution-engine.js';
const tick = (n: number): FrameTick => ({
  frameNumber: BigInt(n),
  startedAtNs: BigInt(n),
  deadlineAtNs: BigInt(n),
  scheduledTimeNs: BigInt(n),
  actualTimeNs: BigInt(n),
  presentationTimeNs: BigInt(n),
  frameDurationNs: 33333333n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const def = (id: string, type: any = 'DISSOLVE', frames = 10): TransitionDefinition => ({
  transitionId: id,
  transitionVersion: 1,
  transitionGeneration: 1,
  displayName: id,
  transitionType: type,
  durationFrames: frames,
  durationNs: String(BigInt(frames) * 33333333n),
  direction: 'LEFT',
  easing: 'LINEAR',
  inputPolicy: 'TWO_SCENE',
  outputPolicy: 'PROGRAM_TRANSITION',
  sourceSceneRequirements: [],
  targetSceneRequirements: ['ready'],
  backendPreference: 'metadata-compositor',
  qualityTier: 'production',
  safeMetadata: {},
  createdAtNs: '1',
  updatedAtNs: '1',
});
const req = (
  id: string,
  transitionDefinitionRef = 'dissolve',
  start = 0,
): TransitionExecutionRequest => ({
  requestId: id,
  transactionId: `tx-${id}`,
  expectedTransactionGeneration: 1,
  transitionDefinitionRef,
  expectedTransitionGeneration: 1,
  sourceScene: {
    sceneId: `source-${id}`,
    sceneGeneration: 1,
    ready: true,
    outputRef: `source-out-${id}`,
  },
  targetScene: {
    sceneId: `target-${id}`,
    sceneGeneration: 1,
    ready: true,
    outputRef: `target-out-${id}`,
  },
  expectedProgramGeneration: 1,
  expectedPreviewGeneration: 1,
  startFrameTick: tick(start),
  interruptionPolicy: 'REJECT_NEW_TRANSITION',
  failurePolicy: 'FAIL',
  mode: 'TAKE',
  safeMetadata: { operator: 'redacted' },
});
let commits = 0;
let publishes = 0;
const engine = createTransitionExecutionEngine(
  {
    compose: (r) => ({
      outputFrameReference: `out:${(r.progress as any).runtimeFrame}`,
      summary: { ok: true },
    }),
  },
  {
    commit: () => {
      commits++;
      return { programGeneration: commits };
    },
    publish: () => {
      publishes++;
    },
  },
  () => 123n,
);
assert.equal(engine.snapshot().health.registeredTransitionCount, 0, 'Engine creation');
const d = engine.registerDefinition(def('dissolve'));
assert.equal(d.transitionType, 'DISSOLVE', 'Transition registration');
assert.throws(
  () => engine.registerDefinition(def('dissolve')),
  /DuplicateTransitionDefinition/,
  'Duplicate definition rejection',
);
engine.updateDefinition(
  { ...def('dissolve'), transitionVersion: 2, transitionGeneration: 2, durationFrames: 12 },
  1,
);
assert.throws(
  () => engine.updateDefinition({ ...def('dissolve'), transitionGeneration: 2 }, 1),
  /TransitionGenerationMismatch/,
  'Stale update rejection',
);
assert(Object.isFrozen(engine.snapshot().definitions[0]), 'Definition immutability');
const cutEngine = createTransitionExecutionEngine(
  undefined,
  {
    commit: () => {
      commits++;
      return { programGeneration: commits };
    },
    publish: () => {
      publishes++;
    },
  },
  () => 1n,
);
cutEngine.registerDefinition(def('cut', 'CUT', 1));
const cut = cutEngine.start(req('cut', 'cut'));
assert.equal(cut.status, 'COMPLETED');
assert.equal(cut.transitionAnimationApplied, false, 'CUT animationApplied false');
for (const [type, i] of TRANSITION_TYPES.map((t, i) => [t, i] as const)) {
  const e = createTransitionExecutionEngine();
  const dd = {
    ...def(`d-${type}`, type, type === 'CUT' ? 1 : 4),
    backendPreference: ['STINGER', 'DVE', 'LUMA_WIPE', 'CUSTOM'].includes(type)
      ? 'metadata-plan-only'
      : 'metadata-compositor',
  };
  e.registerDefinition(dd);
  assert.equal(e.snapshot().definitions[0].transitionType, type, `type ${type}`);
}
assert.throws(
  () => createTransitionExecutionEngine().registerDefinition(def('bad', 'NOPE')),
  /TransitionTypeUnsupported/,
  'Unsupported transition rejection',
);
assert.throws(
  () => createTransitionExecutionEngine().registerDefinition(def('bad2', 'DISSOLVE', 0)),
  /TransitionDurationInvalid/,
  'Duration validation',
);
assert.throws(
  () =>
    createTransitionExecutionEngine().registerDefinition({
      ...def('bez'),
      easing: 'CUSTOM_BEZIER',
      cubicBezier: [-1, 0, 1, 1],
    } as any),
  /TransitionDefinitionInvalid/,
  'Easing validation',
);
const p0 = evaluateTransitionProgress(tick(0), 0n, 10, 'LINEAR');
assert.equal(p0.rawProgress, 0, 'Progress at start');
const p5 = evaluateTransitionProgress(tick(5), 0n, 10, 'LINEAR');
assert.equal(p5.rawProgress, 0.5, 'Progress midpoint');
const p10 = evaluateTransitionProgress(tick(10), 0n, 10, 'LINEAR');
assert.equal(p10.rawProgress, 1, 'Progress at completion');
assert.equal(p10.easedProgress, 1, 'Final progress exactly 1.0');
engine.start({ ...req('a', 'dissolve'), expectedTransitionGeneration: 2 });
engine.processTick(tick(0));
assert.equal(
  engine.snapshot().activeInstance?.progress,
  0,
  'Program identity remains source during transition',
);
engine.processTick(tick(6));
const before = publishes;
engine.processTick(tick(6));
assert.equal(publishes, before, 'Duplicate tick');
engine.processTick(tick(12));
const after = publishes;
engine.processTick(tick(13));
assert.equal(publishes, after, 'No frame after completion');
assert.equal(commits >= 1, true, 'Final target commit');
assert.throws(
  () => engine.start({ ...req('a', 'dissolve'), expectedTransitionGeneration: 2 }),
  /TransitionDuplicateRequest/,
  'Duplicate request',
);
assert.throws(
  () => engine.start({ ...req('stale', 'dissolve'), expectedTransitionGeneration: 1 }),
  /TransitionGenerationMismatch|TransitionDefinitionNotFound/,
  'Stale definition generation',
);
const e2 = createTransitionExecutionEngine();
e2.registerDefinition(def('fade', 'FADE', 4));
assert.throws(
  () =>
    e2.start({
      ...req('notready', 'fade'),
      targetScene: { sceneId: 't', sceneGeneration: 1, ready: false },
    }),
  /TransitionTargetNotReady/,
  'Target not ready',
);
e2.start(req('c1', 'fade'));
e2.cancel('PRESERVE_SOURCE_PROGRAM');
assert.equal(e2.snapshot().health.cancelledCount, 1, 'Cancellation mid-transition');
e2.start(req('c2', 'fade'));
e2.rollback();
assert.equal(e2.snapshot().health.rollbackCount, 1, 'Rollback');
e2.start(req('pause', 'fade'));
e2.pause();
e2.processTick(tick(2));
assert.equal(e2.snapshot().activeInstance?.progress, 0, 'Pause');
e2.resume();
e2.processTick(tick(3));
assert.equal(e2.snapshot().activeInstance?.progress, 0.75, 'Resume');
assert.equal(e2.assertInvariants().valid, true, 'Invariants');
e2.shutdown();
assert.equal(e2.assertInvariants().valid, true, 'Shutdown');
assert.throws(
  () => e2.start(req('after', 'fade')),
  /TransitionShutdownError/,
  'No execution after shutdown',
);
const long = createTransitionExecutionEngine();
long.registerDefinition(def('l', 'DISSOLVE', 3));
for (let i = 0; i < 10000; i++) {
  const ce = createTransitionExecutionEngine();
  ce.registerDefinition(def('c', 'CUT', 1));
  ce.start(req(`cut-${i}`, 'c'));
}
for (let i = 0; i < 1000; i++) {
  const r = req(`l-${i}`, 'l', i * 4);
  long.start(r);
  for (let f = i * 4; f <= i * 4 + 3; f++) long.processTick(tick(f));
}
for (let f = 0; f < 100000; f++) long.processTick(tick(1000000 + f));
assert.equal(long.assertInvariants().valid, true, 'Long-run validation subset');
console.log('UBOS v5.5.2 transition execution validation passed', { commits, publishes });
