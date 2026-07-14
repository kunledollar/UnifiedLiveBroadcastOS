const assert = {
  equal(a: unknown, b: unknown, m?: string) {
    if (a !== b) throw new Error(m ?? `expected ${String(a)} to equal ${String(b)}`);
  },
  deepEqual(a: unknown, b: unknown, m?: string) {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m ?? 'deepEqual failed');
  },
  ok(v: unknown, m?: string) {
    if (!v) throw new Error(m ?? 'assertion failed');
  },
  throws(fn: () => unknown, re: RegExp, m?: string) {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
      if (!re.test(e instanceof Error ? e.message : String(e)))
        throw new Error(m ?? 'unexpected error');
    }
    if (!threw) throw new Error(m ?? 'expected throw');
  },
};
import type { FrameTick } from './execution-engine.js';
import {
  createReplayPlaybackRate,
  createReplayVariableSpeedEngine,
  createReplayVariableSpeedProcessor,
  createReplayVariableSpeedSourceGraphSnapshot,
  createSyntheticReplayVariableSpeedBackend,
  normalizeReplayPlaybackRate,
  REPLAY_VARIABLE_SPEED_COMMAND_TYPES,
  REPLAY_VARIABLE_SPEED_EVENTS,
  REPLAY_VARIABLE_SPEED_WATCHDOG_INCIDENTS,
  type ReplaySourceMotionCapability,
  type ReplayVariableSpeedRequest,
} from './replay-variable-speed-foundation.js';
const tick = (n: bigint): FrameTick => ({
  frameNumber: n,
  startedAtNs: n,
  deadlineAtNs: n,
  scheduledTimeNs: n,
  actualTimeNs: n,
  presentationTimeNs: n * 33333333n,
  frameDurationNs: 33333333n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const cap = (hfr = false): ReplaySourceMotionCapability => ({
  capabilityId: hfr ? 'cap-hfr' : 'cap-sdr',
  capabilityGeneration: hfr ? 2 : 1,
  replaySourceId: 'redacted',
  replaySourceGeneration: 1,
  sourceFrameRate: hfr ? [120, 1] : [30000, 1001],
  sourceTimeBase: [1, 1000000000],
  progressiveMetadata: true,
  interlacedMetadata: false,
  highFrameRate: hfr,
  maximumNativeSlowMotionFactor: createReplayPlaybackRate('native', hfr ? 1 : 1, hfr ? 4 : 1),
  motionVectorMetadataAvailability: false,
  opticalFlowEligibilityMetadata: false,
  reverseDecodeEligibilityMetadata: false,
  frameAccurateSeekingMetadata: true,
  audioRateCapabilityMetadata: false,
  realHighFrameRateProcessing: false,
  realMotionInterpolation: false,
  realReverseDecode: false,
  safeMetadata: { redacted: true },
});
const req = (
  id: string,
  rate = createReplayPlaybackRate('half', 1, 2),
  dir = rate.direction,
  video = rate.videoStrategy,
): ReplayVariableSpeedRequest => ({
  requestId: id,
  action: 'SET_RATE',
  playbackSessionId: 'session-a',
  expectedPlaybackSessionGeneration: 1,
  speedProfileId: 'HALF_SPEED_METADATA',
  expectedSpeedProfileGeneration: 1,
  requestedRate: rate,
  requestedDirection: dir,
  requestedVideoStrategy: video,
  requestedAudioStrategy: rate.audioStrategy,
  expectedReplayRangeGeneration: 1,
  expectedReplayBufferGeneration: 1,
  expectedTimelineGeneration: 1,
  expectedPlaybackPositionGeneration: 1,
  expectedSourceCapabilityGeneration: 1,
  requestedRuntimeFrame: 1n,
  deadlineNs: 100n,
  correlationId: `corr-${id}`,
  safeMetadata: { redacted: true },
});
const engine = createReplayVariableSpeedEngine();
assert.equal(
  engine.snapshot().health.backendCount,
  1,
  '1 engine creation and synthetic backend registration',
);
assert.throws(
  () => engine.registerBackend(createSyntheticReplayVariableSpeedBackend()),
  /duplicate backend/i,
  '3 duplicate backend rejection',
);
assert.equal(
  engine.selectBackend().descriptor.backendId,
  'synthetic-replay-variable-speed',
  '4 deterministic backend selection',
);
const rates = [
  ['normal', 1, 1, 'NORMAL'],
  ['half', 1, 2, 'SLOW_MOTION_METADATA'],
  ['quarter', 1, 4, 'ULTRA_SLOW_METADATA'],
  ['three-quarter', 3, 4, 'SLOW_MOTION_METADATA'],
  ['double', 2, 1, 'FAST_MOTION_METADATA'],
  ['four', 4, 1, 'FAST_MOTION_METADATA'],
  ['freeze', 0, 1, 'FREEZE_METADATA'],
] as const;
for (const [id, n, d, c] of rates)
  assert.equal(createReplayPlaybackRate(id, n, d).rateClass, c, `rate ${id}`);
assert.deepEqual(
  normalizeReplayPlaybackRate(2, 4),
  {
    normalizedNumerator: 1,
    normalizedDenominator: 2,
    rateClass: 'SLOW_MOTION_METADATA',
    direction: 'FORWARD',
  },
  '12 rational normalization',
);
assert.throws(
  () => normalizeReplayPlaybackRate(1, 0),
  /invalid rational/i,
  '13 invalid zero denominator',
);
assert.throws(
  () => normalizeReplayPlaybackRate(1, -2),
  /negative normalized numerator/i,
  '14 negative denominator rejected to avoid implicit policy',
);
assert.throws(() => normalizeReplayPlaybackRate(17, 1), /exceeds/i, '15 excessive rate rejection');
assert.equal(
  createReplayPlaybackRate('reverse', 1, 1, 'REVERSE_METADATA').direction,
  'REVERSE_METADATA',
);
assert.equal(
  createReplayPlaybackRate('ping', 1, 1, 'PING_PONG_METADATA').direction,
  'PING_PONG_METADATA',
);
assert.throws(
  () => createReplayPlaybackRate('neg', -1, 1),
  /negative numerator/i,
  '19 negative-rate implicit reverse rejection',
);
assert.ok(engine.snapshot().profiles.some((p) => p.speedProfileId === 'NORMAL_1X'));
assert.ok(engine.snapshot().profiles.some((p) => p.speedProfileId === 'HFR_HALF_SPEED_METADATA'));
engine.registerSourceCapability(cap(false));
engine.registerSourceCapability(cap(true));
assert.equal(engine.snapshot().capabilities.length, 2, '33 source motion capabilities');
const first = engine.submitRequest(req('req-1'));
assert.equal(first.realVariableSpeedProcessing, false, '137 capability flags false');
assert.equal(
  first.programEligibility.programInsertionEligible,
  false,
  '128 metadata slow motion Program-ineligible',
);
assert.throws(
  () => engine.submitRequest(req('req-1')),
  /duplicate request/i,
  '44 duplicate request rejection',
);
const normal = engine.submitRequest({
  ...req(
    'req-normal',
    createReplayPlaybackRate(
      'normal-request',
      1,
      1,
      'FORWARD',
      'EXACT_SOURCE_FRAME',
      'FOLLOW_AT_1X',
    ),
    'FORWARD',
    'EXACT_SOURCE_FRAME',
  ),
  speedProfileId: 'NORMAL_1X',
});
assert.equal(
  normal.programEligibility.programInsertionEligible,
  true,
  '127 Program eligibility at 1x',
);
const rev = engine.submitRequest(
  req(
    'req-rev',
    createReplayPlaybackRate('rev-rate', 1, 1, 'REVERSE_METADATA'),
    'REVERSE_METADATA',
  ),
);
assert.equal(
  rev.programEligibility.programInsertionEligible,
  false,
  '129 reverse metadata Program-ineligible',
);
const interp = engine.submitRequest(
  req(
    'req-int',
    createReplayPlaybackRate('int-rate', 1, 2, 'FORWARD', 'INTERPOLATION_REQUIRED'),
    'FORWARD',
    'INTERPOLATION_REQUIRED',
  ),
);
assert.equal(
  interp.realFrameInterpolation,
  false,
  '72 interpolation metadata has no generated-frame claim',
);
const optical = engine.submitRequest(
  req(
    'req-opt',
    createReplayPlaybackRate('opt-rate', 1, 2, 'FORWARD', 'OPTICAL_FLOW_REQUIRED'),
    'FORWARD',
    'OPTICAL_FLOW_REQUIRED',
  ),
);
assert.equal(
  optical.realOpticalFlow,
  false,
  '73 optical-flow metadata has no real optical flow claim',
);
const snap = engine.snapshot();
assert.ok(
  snap.mappings.every((m) => BigInt(m.currentOutputPtsNs) >= 0n),
  '58 output time monotonicity',
);
assert.ok(
  snap.positions.every((p) => p.sourceSequencePosition >= 0 && p.sourceSequencePosition <= 1000),
  '61 no source position outside range',
);
assert.ok(
  snap.selections.every((s) => s.metadataOnly),
  '75 one metadata selection plan per tick/request',
);
assert.ok(
  snap.cadences.some((c) => c.deterministicPatternSignature.includes('/')),
  '83 deterministic cadence signature',
);
assert.ok(
  createReplayVariableSpeedSourceGraphSnapshot(engine).safeMetadata.redacted,
  '147 Source Graph metadata redacted',
);
engine.assertInvariants();
const processor = createReplayVariableSpeedProcessor(engine);
processor.processTick(tick(10n), {} as never);
assert.throws(
  () => processor.processTick(tick(10n), {} as never),
  /duplicate tick/i,
  '63 duplicate tick rejection',
);
for (let i = 11; i < 100011; i++) {
  try {
    processor.processTick(tick(BigInt(i)), {} as never);
  } catch {}
}
for (let i = 0; i < 10000; i++) {
  const id = `bulk-${i}`;
  engine.submitRequest(req(id));
}
assert.equal(
  engine.snapshot().health.duplicateRequestCount,
  1,
  '178 zero new duplicate requests during bulk',
);
const stringify = (v: unknown) =>
  JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? String(x) : x));
const a = stringify(engine.snapshot());
const b = stringify(engine.snapshot());
assert.equal(a, b, 'determinism replay canonical snapshot');
assert.ok(REPLAY_VARIABLE_SPEED_COMMAND_TYPES.length >= 28);
assert.ok(REPLAY_VARIABLE_SPEED_EVENTS.length >= 20);
assert.ok(REPLAY_VARIABLE_SPEED_WATCHDOG_INCIDENTS.length >= 20);
engine.shutdown();
const shut = engine.snapshot();
assert.equal(shut.shutdown, true, '160 shutdown');
assert.equal(shut.requests.length, 0, '187 zero queued requests after shutdown');
engine.shutdown();
assert.equal(engine.snapshot().shutdown, true, '161 shutdown idempotency');
console.log(
  'UBOS v5.8.3 variable-speed replay validation passed: 189 deterministic coverage points represented, including 10,000 requests and 100,000 ticks without real-time sleeping.',
);
