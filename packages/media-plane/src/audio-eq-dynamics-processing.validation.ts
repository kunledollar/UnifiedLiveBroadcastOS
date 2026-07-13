/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
const assert = {
  equal(a, b) {
    if (a !== b) throw new Error(`${a} != ${b}`);
  },
  notEqual(a, b) {
    if (a === b) throw new Error(`${a} == ${b}`);
  },
  ok(v) {
    if (!v) throw new Error('not ok');
  },
  deepEqual(a, b) {
    const A = JSON.stringify(a),
      B = JSON.stringify(b);
    if (A !== B) throw new Error(`${A} != ${B}`);
  },
  throws(fn, p) {
    try {
      fn();
    } catch (e) {
      if (!p || p(e)) return;
      throw e;
    }
    throw new Error('expected throw');
  },
};
import {
  createAudioEqDynamicsEngine,
  createSyntheticAudioEqDynamicsBackend,
  createAudioEqDynamicsSourceGraphSnapshot,
  AudioEqDynamicsProcessor,
  AUDIO_EQ_DYNAMICS_OUTPUT_KEYS,
} from './audio-eq-dynamics-processing.js';
const target = (id = 'program', type = 'BUS') => ({
  targetType: type,
  targetId: id,
  targetGeneration: 1,
  channelLayout: 'STEREO',
  sampleRateHz: 48000,
});
const band = (id, type = 'HIGH_PASS_FILTER', gen = 1) =>
  Object.freeze({
    bandId: id,
    bandVersion: '5.6.3',
    bandGeneration: gen,
    processorType: type,
    enabled: true,
    frequencyHz: type === 'LOW_PASS_FILTER' ? 18000 : 120,
    gainDb: 0,
    q: 0.707,
    bandwidthOctaves: 1,
    slopeDbPerOctave: 12,
    filterOrder: 2,
    channelSelection: ['L', 'R'],
    phaseMode: 'MINIMUM_PHASE',
    processingPrecision: 'SYNTHETIC',
    parameterPrecedence: 'Q',
    safeMetadata: { secret: 'x' },
  });
const dyn = (id, type = 'COMPRESSOR', gen = 1) =>
  Object.freeze({
    processorId: id,
    processorVersion: '5.6.3',
    processorGeneration: gen,
    processorType: type,
    target: target(),
    insertionPoint: 'BUS_PRE_MASTER',
    enabled: true,
    bypass: false,
    thresholdDb: -18,
    ratio: type === 'NOISE_GATE' ? 2 : 4,
    attackMs: 5,
    releaseMs: 100,
    holdMs: 10,
    kneeDb: 3,
    makeupGainDb: 0,
    outputCeilingDb: -1,
    rangeDb: 20,
    hysteresisDb: 3,
    lookaheadMs: 0,
    detectorMode: 'PEAK',
    detectorChannelMode: 'LINKED_MAX',
    sidechainFilterMetadata: {},
    wetDryMix: 1,
    autoMakeupGain: false,
    autoRelease: false,
    linkedChannelPolicy: 'LINKED',
    channelSelection: ['L', 'R'],
    qualityTier: 'SYNTHETIC',
    safeMetadata: {},
  });
const eqChain = (ids = ['hp']) =>
  Object.freeze({
    chainId: 'eq:program',
    chainVersion: '5.6.3',
    chainGeneration: 1,
    target: target(),
    insertionPoint: 'BUS_PRE_MASTER',
    orderedBandIds: ids,
    enabled: true,
    bypass: false,
    wetDryMix: 1,
    processingMode: 'SERIAL',
    precision: 'SYNTHETIC',
    qualityTier: 'SYNTHETIC',
    safeMetadata: {},
    createdAtNs: '1',
    updatedAtNs: '1',
  });
const procChain = (ids = ['comp']) =>
  Object.freeze({
    chainId: 'proc:program',
    chainVersion: '5.6.3',
    chainGeneration: 1,
    target: target(),
    insertionPoint: 'BUS_PRE_MASTER',
    orderedProcessorIds: ids,
    enabled: true,
    bypass: false,
    failurePolicy: 'BYPASS_FAILED_PROCESSOR',
    latencyMetadata: {},
    temporaryMemoryBudgetBytes: 4096,
    qualityTier: 'SYNTHETIC',
    safeMetadata: {},
    createdAtNs: '1',
    updatedAtNs: '1',
  });
const req = (n = 1) =>
  Object.freeze({
    requestId: `req:${n}`,
    runtimeFrame: String(n),
    blockSequence: n,
    samplePosition: n * 480,
    sampleCount: 480,
    targetChannelIds: [],
    targetBusIds: ['program', 'preview'],
    inputBufferReferences: [{ bufferId: `in:${n}`, payloadRef: 'redact' }],
    expectedEqChainGenerations: { 'eq:program': 1 },
    expectedDynamicsProcessorGenerations: { comp: 1 },
    expectedProcessingChainGenerations: { 'proc:program': 1 },
    expectedSidechainGenerations: {},
    expectedStripRoutingGeneration: 1,
    expectedMixerGeneration: 1,
    expectedAudioFollowGeneration: 1,
    expectedTransitionGeneration: 1,
    expectedBackendGeneration: 1,
    sampleFormat: 'OPAQUE_SYNTHETIC',
    channelLayout: 'STEREO',
    sampleRateHz: 48000,
    deadlineNs: '0',
    safeMetadata: {},
  });
function throwsCode(fn, code) {
  assert.throws(fn, (e) => e?.code === code || e?.name === code);
}
function base() {
  const e = createAudioEqDynamicsEngine('v563');
  e.registerBackend(createSyntheticAudioEqDynamicsBackend());
  e.registerEqBand(band('hp'));
  e.registerEqBand(band('lp', 'LOW_PASS_FILTER'));
  e.registerEqBand(band('low', 'LOW_SHELF_EQ'));
  e.registerEqBand({ ...band('high', 'HIGH_SHELF_EQ'), gainDb: 3 });
  e.registerEqBand({ ...band('bell', 'PARAMETRIC_BELL_EQ'), frequencyHz: 1000, gainDb: -2 });
  e.registerEqBand({ ...band('notch', 'NOTCH_FILTER'), frequencyHz: 4000 });
  e.registerEqBand(band('bp', 'BAND_PASS_METADATA'));
  e.registerEqBand(band('ap', 'ALL_PASS_METADATA'));
  e.registerEqChain(eqChain(['hp', 'lp', 'low', 'high', 'bell', 'notch', 'bp', 'ap']));
  e.registerDynamicsProcessor(dyn('gate', 'NOISE_GATE'));
  e.registerDynamicsProcessor(dyn('exp', 'EXPANDER'));
  e.registerDynamicsProcessor(dyn('comp', 'COMPRESSOR'));
  e.registerDynamicsProcessor(dyn('lim', 'LIMITER'));
  e.registerDynamicsProcessor(dyn('de', 'DE_ESSER_FOUNDATION'));
  e.registerDynamicsProcessor(dyn('scd', 'SIDECHAIN_DETECTOR_FOUNDATION'));
  e.registerProcessingChain(procChain(['gate', 'exp', 'comp', 'de', 'lim', 'scd']));
  return e;
}
(function main() {
  let e = createAudioEqDynamicsEngine();
  assert.equal(e.state, 'READY');
  e.registerBackend(createSyntheticAudioEqDynamicsBackend());
  throwsCode(
    () => e.registerBackend(createSyntheticAudioEqDynamicsBackend()),
    'DuplicateAudioEqDynamicsBackend',
  );
  e.registerEqBand(band('hp'));
  throwsCode(() => e.registerEqBand(band('hp')), 'DuplicateAudioEqBand');
  e.updateEqBand({ ...band('hp'), bandGeneration: 2, frequencyHz: 140 }, 1);
  throwsCode(
    () => e.updateEqBand({ ...band('hp'), bandGeneration: 2 }, 1),
    'AudioEqChainGenerationMismatch',
  );
  const snap = e.getSnapshot();
  assert.throws(
    () => {
      snap.bands[0].frequencyHz = 1;
    },
    (e) => e instanceof TypeError,
  );
  for (const [id, t] of [
    ['hp2', 'HIGH_PASS_FILTER'],
    ['lp', 'LOW_PASS_FILTER'],
    ['low', 'LOW_SHELF_EQ'],
    ['high', 'HIGH_SHELF_EQ'],
    ['bell', 'PARAMETRIC_BELL_EQ'],
    ['notch', 'NOTCH_FILTER'],
    ['bp', 'BAND_PASS_METADATA'],
    ['ap', 'ALL_PASS_METADATA'],
  ])
    e.registerEqBand(band(id, t));
  throwsCode(() => e.registerEqBand({ ...band('bad'), frequencyHz: 0 }), 'AudioEqBandInvalid');
  throwsCode(() => e.registerEqBand({ ...band('bad2'), frequencyHz: 24000 }), 'AudioEqBandInvalid');
  throwsCode(() => e.registerEqBand({ ...band('bad3'), q: 0 }), 'AudioEqBandInvalid');
  throwsCode(
    () => e.registerEqBand({ ...band('bad4'), gainDb: 99 }),
    'AudioEqDynamicsParameterInvalid',
  );
  throwsCode(
    () => e.registerEqBand({ ...band('bad5'), slopeDbPerOctave: 7 }),
    'AudioEqBandInvalid',
  );
  throwsCode(() => e.registerEqBand({ ...band('bad6'), filterOrder: 5 }), 'AudioEqBandInvalid');
  e.registerEqChain(eqChain(['hp', 'lp']));
  throwsCode(() => e.registerEqChain(eqChain(['hp'])), 'DuplicateAudioEqChain');
  assert.deepEqual(e.eqChains.get('eq:program').orderedBandIds, ['hp', 'lp']);
  throwsCode(
    () =>
      e.registerEqChain({
        ...eqChain(Array.from({ length: 17 }, (_, i) => `b${i}`)),
        chainId: 'too',
      }),
    'AudioEqChainInvalid',
  );
  e.registerDynamicsProcessor(dyn('gate', 'NOISE_GATE'));
  throwsCode(
    () => e.registerDynamicsProcessor(dyn('gate', 'NOISE_GATE')),
    'DuplicateAudioDynamicsProcessor',
  );
  for (const t of [
    'EXPANDER',
    'COMPRESSOR',
    'LIMITER',
    'DE_ESSER_FOUNDATION',
    'SIDECHAIN_DETECTOR_FOUNDATION',
  ])
    e.registerDynamicsProcessor(dyn(t.toLowerCase(), t));
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad'), thresholdDb: Infinity }),
    'AudioEqDynamicsParameterInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad2'), ratio: 0.5 }),
    'AudioDynamicsProcessorInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad3'), attackMs: -1 }),
    'AudioDynamicsProcessorInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad4'), releaseMs: -1 }),
    'AudioDynamicsProcessorInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad5'), holdMs: -1 }),
    'AudioDynamicsProcessorInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad6'), kneeDb: NaN }),
    'AudioEqDynamicsParameterInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad7'), makeupGainDb: Infinity }),
    'AudioEqDynamicsParameterInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad8', 'LIMITER'), outputCeilingDb: 1 }),
    'AudioDynamicsProcessorInvalid',
  );
  throwsCode(
    () => e.registerDynamicsProcessor({ ...dyn('bad9'), wetDryMix: 2 }),
    'AudioEqDynamicsParameterInvalid',
  );
  e.registerProcessingChain(procChain(['gate', 'compressor']));
  throwsCode(
    () => e.registerProcessingChain({ ...procChain(['gate', 'gate']), chainId: 'dup' }),
    'AudioProcessingChainInvalid',
  );
  throwsCode(
    () => e.registerProcessingChain({ ...procChain(['missing']), chainId: 'missing' }),
    'AudioProcessingChainInvalid',
  );
  assert.deepEqual(e.processingChains.get('proc:program').orderedProcessorIds, [
    'gate',
    'compressor',
  ]);
  let eng = base();
  let p1 = eng.createPlan(req(1));
  let p2 = eng.createPlan(req(1));
  assert.equal(p1.planId, p2.planId);
  assert.equal(eng.telemetry.planCacheHits, 1);
  let r = eng.processBlock(req(1));
  assert.equal(r.status, 'COMPLETED');
  assert.equal(r.realEqApplied, false);
  assert.equal(r.realLimiterApplied, false);
  assert.ok(r.outputIdentityChanged);
  throwsCode(() => eng.processBlock(req(1)), 'AudioEqDynamicsDuplicateRequest');
  throwsCode(
    () => eng.processBlock({ ...req(2), expectedEqChainGenerations: { 'eq:program': 99 } }),
    'AudioEqChainGenerationMismatch',
  );
  throwsCode(
    () => eng.processBlock({ ...req(3), expectedDynamicsProcessorGenerations: { comp: 99 } }),
    'AudioDynamicsGenerationMismatch',
  );
  throwsCode(
    () =>
      eng.processBlock({ ...req(4), expectedProcessingChainGenerations: { 'proc:program': 99 } }),
    'AudioProcessingChainGenerationMismatch',
  );
  eng.configureSidechain({
    sidechainId: 'sc1',
    sidechainGeneration: 1,
    sourceStripId: 'mic',
    sourceGeneration: 1,
    tapPoint: 'POST_FADER',
    detectorGainDb: 0,
    filterMetadata: {},
    channelMode: 'LINKED_MAX',
    selfSidechainPolicy: 'REJECT',
    safeMetadata: {},
  });
  throwsCode(
    () =>
      eng.configureSidechain({
        sidechainId: 'self',
        sidechainGeneration: 1,
        sourceStripId: 'self',
        sourceGeneration: 1,
        tapPoint: 'x',
        detectorGainDb: 0,
        filterMetadata: {},
        channelMode: 'LINKED_MAX',
        selfSidechainPolicy: 'REJECT',
        safeMetadata: {},
      }),
    'AudioSidechainCycle',
  );
  let bypass = base();
  bypass.globalEqBypass = true;
  bypass.globalDynamicsBypass = true;
  let br = bypass.processBlock(req(7));
  assert.equal(br.status, 'BYPASSED');
  assert.equal(br.outputIdentityChanged, false);
  let fail = createAudioEqDynamicsEngine();
  fail.registerBackend(createSyntheticAudioEqDynamicsBackend({ failProcess: true }));
  fail.registerEqBand(band('hp'));
  fail.registerEqChain(eqChain(['hp']));
  throwsCode(
    () =>
      fail.processBlock({
        ...req(9),
        expectedDynamicsProcessorGenerations: {},
        expectedProcessingChainGenerations: {},
      }),
    'AudioEqDynamicsBackendFailed',
  );
  assert.equal(fail.failedRejectedResults.at(-1).outputBytes, 0);
  let alloc = createAudioEqDynamicsEngine();
  alloc.registerBackend(createSyntheticAudioEqDynamicsBackend({ allocationFailure: true }));
  alloc.registerEqBand(band('hp'));
  alloc.registerEqChain(eqChain(['hp']));
  throwsCode(
    () =>
      alloc.processBlock({
        ...req(10),
        expectedDynamicsProcessorGenerations: {},
        expectedProcessingChainGenerations: {},
      }),
    'AudioEqDynamicsAllocationFailed',
  );
  let timeout = createAudioEqDynamicsEngine();
  timeout.registerBackend(createSyntheticAudioEqDynamicsBackend({ timeout: true }));
  timeout.registerEqBand(band('hp'));
  timeout.registerEqChain(eqChain(['hp']));
  throwsCode(
    () =>
      timeout.processBlock({
        ...req(11),
        expectedDynamicsProcessorGenerations: {},
        expectedProcessingChainGenerations: {},
      }),
    'AudioEqDynamicsTimeout',
  );
  const tx = eng.createConfigurationTransaction({ transactionId: 'tx1' });
  assert.equal(tx.state, 'VALIDATED');
  eng.commitConfigurationTransaction('tx1');
  assert.equal(eng.activeTransaction, undefined);
  const tx2 = eng.createConfigurationTransaction({ transactionId: 'tx2' });
  eng.rollbackConfigurationTransaction('tx2');
  assert.equal(eng.activeTransaction, undefined);
  const sg = createAudioEqDynamicsSourceGraphSnapshot(eng);
  assert.ok(sg.processorIds.includes('hp'));
  assert.ok(eng.getHealthSnapshot().backendCount >= 1);
  assert.ok(eng.getTelemetrySnapshot().plansCreated >= 1);
  assert.ok(eng.assertInvariants().valid);
  const fakeReg = new Map();
  const proc = new AudioEqDynamicsProcessor(base());
  fakeReg.set(AUDIO_EQ_DYNAMICS_OUTPUT_KEYS.processRequest, req(20));
  proc.processTick(
    {} as any,
    { registry: { get: (k) => fakeReg.get(k), set: (k, v) => fakeReg.set(k, v) } } as any,
  );
  assert.equal(fakeReg.get(AUDIO_EQ_DYNAMICS_OUTPUT_KEYS.processResult).status, 'COMPLETED');
  const replay1 = base();
  const replay2 = base();
  const s1 = [];
  const s2 = [];
  for (let i = 1; i <= 1000; i++) {
    s1.push(replay1.createPlan(req(i)).deterministicScore);
    s2.push(replay2.createPlan(req(i)).deterministicScore);
  }
  assert.deepEqual(s1, s2);
  const long = base();
  for (let i = 1; i <= 10000; i++) {
    long.createPlan(req(i));
  }
  for (let i = 1; i <= 1000; i++) {
    long.processBlock(req(10000 + i));
  }
  assert.equal(long.telemetry.temporaryBytes, 0);
  assert.ok(long.assertInvariants().valid);
  long.shutdown();
  assert.equal(long.state, 'SHUTDOWN');
  long.shutdown();
  throwsCode(() => long.processBlock(req(99999)), 'AudioEqDynamicsShutdownError');
  console.log('UBOS v5.6.3 EQ/Dynamics validation passed');
})();
