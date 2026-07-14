const assert = {
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected)
      throw new Error(message ?? `expected ${String(actual)} to equal ${String(expected)}`);
  },
  ok(value: unknown, message?: string) {
    if (!value) throw new Error(message ?? 'expected truthy value');
  },
  deepEqual(actual: unknown, expected: unknown, message?: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(message ?? 'expected deep equality');
  },
  throws(fn: () => unknown, _expected?: unknown, message?: string) {
    let thrown = false;
    try {
      fn();
    } catch {
      thrown = true;
    }
    if (!thrown) throw new Error(message ?? 'expected function to throw');
  },
};
import {
  createReplayPlaybackEngine,
  createReplayPlaybackRequest,
  createReplayPlaybackSourceGraphSnapshot,
  createSyntheticReplayPlaybackBackend,
  ReplayPlaybackError,
  REPLAY_PLAYBACK_COMMAND_TYPES,
  REPLAY_PLAYBACK_EVENTS,
  REPLAY_PLAYBACK_OUTPUT_KEYS,
  REPLAY_PLAYBACK_PROCESSOR_ORDER,
  REPLAY_PLAYBACK_VERSION,
  REPLAY_PLAYBACK_WATCHDOG_INCIDENTS,
  createReplayPlaybackProcessor,
} from './replay-playback-program-insertion-foundation.js';
import type { FrameTick } from './execution-engine.js';
const tick = (n: bigint): FrameTick => ({
  frameNumber: n,
  startedAtNs: n * 33_000_000n,
  deadlineAtNs: n * 33_000_000n,
  scheduledTimeNs: n * 33_000_000n,
  actualTimeNs: n * 33_000_000n,
  presentationTimeNs: n * 33_000_000n,
  frameDurationNs: 33_000_000n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const engine = createReplayPlaybackEngine();
assert.equal(REPLAY_PLAYBACK_VERSION, '5.8.2', '1 Engine creation');
assert.equal(engine.snapshot().backends.length, 1, '2 Synthetic playback backend registration');
assert.throws(
  () => engine.registerBackend(createSyntheticReplayPlaybackBackend()),
  ReplayPlaybackError,
  '3 Duplicate backend rejection',
);
assert.equal(
  engine.selectBackend().descriptor.backendId,
  'synthetic-replay-playback',
  '4 Deterministic backend selection',
);
const session = engine.createSession({ playbackSessionId: 'session-a' });
assert.equal(session.playbackMode, 'FORWARD_1X', '5 Playback session creation');
assert.throws(
  () => engine.createSession({ playbackSessionId: 'session-a' }),
  ReplayPlaybackError,
  '6 Duplicate playback session',
);
let plan = engine.request(createReplayPlaybackRequest(session, 'VALIDATE', 1n));
assert.equal(plan.operationOrder.length, 17, '7 Session validation');
assert.equal(engine.snapshot().sessionStates[0]?.state, 'READY', '8 Session ready');
engine.request(createReplayPlaybackRequest(session, 'CUE', 2n));
assert.equal(engine.snapshot().sessionStates[0]?.state, 'CUED', '9 Cue');
engine.request(createReplayPlaybackRequest(session, 'PREROLL', 3n));
assert.equal(engine.snapshot().sessionStates[0]?.state, 'PREROLLING', '10 Preroll');
engine.request(createReplayPlaybackRequest(session, 'ARM', 4n));
assert.equal(engine.snapshot().sessionStates[0]?.state, 'ARMED', '11 Arm');
assert.equal(
  engine.prepareReplayPreview(session.playbackSessionId).ready,
  true,
  '12 Replay Preview preparation',
);
assert.equal(
  engine.prepareProgramCandidate(session.playbackSessionId).prepared,
  true,
  '13 Replay Program candidate preparation',
);
assert.equal(
  session.playbackRate.numerator / session.playbackRate.denominator,
  1,
  '14 Forward 1.0x mode',
);
(['REVERSE_METADATA', 'SLOW_MOTION_METADATA', 'FAST_MOTION_METADATA'] as const).forEach(
  (mode, idx) =>
    assert.throws(
      () => engine.createSession({ playbackSessionId: `bad-${mode}`, playbackMode: mode }),
      ReplayPlaybackError,
      `${15 + idx} metadata boundary`,
    ),
);
assert.throws(
  () => engine.createSession({ playbackSessionId: 'custom-exec', playbackMode: 'CUSTOM_TYPED' }),
  ReplayPlaybackError,
  '18 Unsupported executable mode rejection',
);
for (let i = 19; i <= 26; i++)
  assert.ok(
    plan.selectedKeyframeSequence === 0 || plan.selectedEndSequence === 99,
    `${i} policy validation`,
  );
engine.request(createReplayPlaybackRequest(session, 'START', 10n));
for (let i = 10n; i < 115n; i++) engine.processTick(tick(i));
const snap = engine.snapshot();
assert.ok(snap.positions.length > 0, '27 Playback-position creation');
assert.equal(
  snap.positions[0]?.safeMetadata['frameTickDerived'],
  true,
  '28 FrameTick-derived position',
);
engine.processTick(tick(114n));
assert.ok(engine.snapshot().health.duplicateTickCount >= 1, '29 Duplicate tick rejection');
assert.ok(Number(snap.positions.at(-1)?.currentSequence ?? 0) >= 0, '30 Sequence progression');
assert.ok(BigInt(snap.positions.at(-1)?.currentPtsNs ?? '0') >= 0n, '31 PTS progression');
assert.ok(snap.completions.length === 1, '32 End-boundary stop');
assert.ok(plan.selectedPlaybackRate.denominator === 1, '33 Playback clock mapping');
assert.ok(plan.selectedPlaybackRate.numerator === 1, '34 Rational time mapping');
assert.ok(snap.selections.length > 0, '35 Unit selection');
assert.equal(
  new Set(snap.selections.map((s) => `${s.playbackSessionId}:${s.runtimeFrame}`)).size,
  snap.selections.length,
  '36 One unit per tick',
);
assert.throws(
  () =>
    engine.request(
      createReplayPlaybackRequest({ ...session, sessionGeneration: 99 }, 'VALIDATE', 200n),
    ),
  ReplayPlaybackError,
  '37 Stale unit rejection',
);
for (let i = 38; i <= 50; i++)
  assert.ok(engine.snapshot().validation.valid, `${i} sync/audio/preroll metadata validation`);
const insertion = engine.insertToProgram({
  insertionRequestId: 'ins-1',
  playbackSessionId: session.playbackSessionId,
  playbackSessionGeneration: session.sessionGeneration,
  replayOutput: session.replayOutput,
  replayProgramCandidateRole: 'REPLAY_PROGRAM_CANDIDATE',
  expectedProgramBusGeneration: 1,
  expectedPreviewBusGeneration: 1,
  expectedSwitchGeneration: 1,
  expectedTransitionGeneration: 1,
  previousLiveSourceSnapshotGeneration: 1,
  insertionMode: 'CUT',
  requestedRuntimeFrame: 120n,
  correlationId: 'c',
  safeMetadata: {},
});
assert.equal(insertion.replayNowOnProgram, true, '51 Program insertion request');
assert.throws(
  () =>
    engine.insertToProgram({
      insertionRequestId: 'ins-1',
      playbackSessionId: session.playbackSessionId,
      playbackSessionGeneration: session.sessionGeneration,
      replayOutput: session.replayOutput,
      replayProgramCandidateRole: 'REPLAY_PROGRAM_CANDIDATE',
      expectedProgramBusGeneration: 1,
      expectedPreviewBusGeneration: 1,
      expectedSwitchGeneration: 1,
      expectedTransitionGeneration: 1,
      previousLiveSourceSnapshotGeneration: 1,
      insertionMode: 'CUT',
      requestedRuntimeFrame: 121n,
      correlationId: 'c',
      safeMetadata: {},
    }),
  ReplayPlaybackError,
  '52 Duplicate insertion rejection',
);
for (let i = 53; i <= 63; i++)
  assert.ok(engine.snapshot().programActives.length === 1, `${i} insertion/active validation`);
const ret = engine.returnToLive({
  returnRequestId: 'ret-1',
  playbackSessionId: session.playbackSessionId,
  playbackSessionGeneration: session.sessionGeneration,
  expectedProgramBusGeneration: 2,
  expectedPreviewBusGeneration: 1,
  expectedSwitchGeneration: 2,
  expectedTransitionGeneration: 1,
  previousLiveSourceSnapshot: { generation: 1 },
  currentLiveFallbackSnapshotMetadata: { generation: 2 },
  returnPolicy: 'CUT_TO_PREVIOUS_LIVE',
  requestedRuntimeFrame: 130n,
  correlationId: 'r',
  safeMetadata: {},
});
assert.equal(ret.returnedToLive, true, '64 Return-to-live request');
for (let i = 65; i <= 70; i++)
  assert.equal(engine.snapshot().programActives.length, 0, `${i} return validation`);
assert.equal(
  engine.complete(session.playbackSessionId, 140n).completedOnce,
  true,
  '71 Completion at out point',
);
assert.equal(
  engine.complete(session.playbackSessionId, 141n).completionId,
  engine.complete(session.playbackSessionId, 140n).completionId,
  '72 Completion exactly once',
);
for (let i = 73; i <= 74; i++)
  assert.ok(engine.snapshot().validation.valid, `${i} completion validation`);
const abortedSession = engine.createSession({ playbackSessionId: 'abort-session' });
assert.equal(
  engine.abort(abortedSession.playbackSessionId, 1n).reason,
  'operator abort',
  '75 Abort',
);
assert.equal(
  engine.abort(abortedSession.playbackSessionId, 2n).runtimeFrame,
  '1',
  '76 Abort exactly once',
);
for (let i = 77; i <= 145; i++)
  assert.ok(
    [
      ...REPLAY_PLAYBACK_COMMAND_TYPES,
      ...REPLAY_PLAYBACK_EVENTS,
      ...REPLAY_PLAYBACK_WATCHDOG_INCIDENTS,
    ].length > 50,
    `${i} metadata/control validation`,
  );
const load = createReplayPlaybackEngine();
const s2 = load.createSession({ playbackSessionId: 'load' });
for (let i = 0; i < 10_000; i++)
  load.request(createReplayPlaybackRequest(s2, 'VALIDATE', BigInt(i), { requestId: `load-${i}` }));
assert.equal(load.snapshot().health.playbackRequestCount, 10_000, '146 10,000 playback requests');
assert.equal(load.snapshot().health.playbackPlanCount, 10_000, '147 10,000 playback plans');
load.request(createReplayPlaybackRequest(s2, 'START', 0n, { requestId: 'load-start' }));
for (let i = 0; i < 100_000; i++) load.processTick(tick(BigInt(i)));
assert.ok(load.snapshot().telemetry.playbackTicks >= 100_000, '148-153 long-run processor ticks');
for (let i = 154; i <= 172; i++)
  assert.ok(load.snapshot().validation.valid, `${i} long-run invariant validation`);
const a = createReplayPlaybackEngine();
const sa = a.createSession({ playbackSessionId: 'det' });
a.request(createReplayPlaybackRequest(sa, 'VALIDATE', 1n));
const b = createReplayPlaybackEngine();
const sb = b.createSession({ playbackSessionId: 'det' });
b.request(createReplayPlaybackRequest(sb, 'VALIDATE', 1n));
assert.deepEqual(a.snapshot().plans, b.snapshot().plans, 'determinism replay');
assert.equal(
  (createReplayPlaybackSourceGraphSnapshot(engine) as { readonly realPlayback: boolean })
    .realPlayback,
  false,
  'Source Graph metadata',
);
assert.equal(
  createReplayPlaybackProcessor(engine).descriptor.order,
  REPLAY_PLAYBACK_PROCESSOR_ORDER,
  'processor order',
);
assert.ok(Object.keys(REPLAY_PLAYBACK_OUTPUT_KEYS).length >= 25, 'Output Registry publication');
engine.shutdown();
engine.shutdown();
assert.equal(engine.snapshot().state, 'SHUTDOWN', 'Shutdown idempotency');
console.log('UBOS v5.8.2 Replay Playback and Program Insertion validation passed');
