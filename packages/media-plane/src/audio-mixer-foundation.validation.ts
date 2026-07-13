/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
const assert = {
  equal(a, b) {
    if (a !== b) throw new Error(`Expected ${String(a)} to equal ${String(b)}`);
  },
  notEqual(a, b) {
    if (a === b) throw new Error(`Expected ${String(a)} not to equal ${String(b)}`);
  },
  ok(v) {
    if (!v) throw new Error('Expected value to be truthy');
  },
  deepEqual(a, b) {
    const ja = JSON.stringify(a);
    const jb = JSON.stringify(b);
    if (ja !== jb) throw new Error(`Expected ${ja} to deep equal ${jb}`);
  },
  throws(fn, pred) {
    try {
      fn();
    } catch (e) {
      if (!pred || pred(e)) return;
      throw e;
    }
    throw new Error('Expected function to throw');
  },
};
import {
  AUDIO_GAIN,
  createAudioMixerEngine,
  createAudioPcmBufferEnvelope,
  createSyntheticAudioMixerBackend,
  createAudioMixerSourceGraphSnapshot,
  validateAudioChannelLayout,
  validateAudioSampleFormat,
  type AudioMixerBusDefinition,
  type AudioMixerChannelDefinition,
  type AudioBusSend,
  type AudioMixRequest,
} from './audio-mixer-foundation.js';

const bus = (
  busId: string,
  role: AudioMixerBusDefinition['role'],
  generation = 1,
): AudioMixerBusDefinition =>
  Object.freeze({
    busId,
    version: '5.6.1',
    generation,
    role,
    displayName: busId,
    sampleRateHz: 48000,
    channelCount: 2,
    channelLayout: 'STEREO',
    sampleFormat: 'OPAQUE_SYNTHETIC',
    blockSize: 480,
    masterGain: 1,
    mute: false,
    soloPolicy: 'ADDITIVE',
    latencyClass: 'LOW',
    routingEligibility: ['audio'],
    criticality: role === 'PROGRAM' ? 'CRITICAL' : 'OPTIONAL',
    metadata: {},
  });
const channel = (
  channelId: string,
  sourceId = channelId,
  generation = 1,
): AudioMixerChannelDefinition =>
  Object.freeze({
    channelId,
    version: '5.6.1',
    generation,
    displayName: channelId,
    sourceId,
    streamId: `${sourceId}:stream`,
    sourceGeneration: 1,
    streamGeneration: 1,
    sourceRole: 'HOST_MIC',
    sampleFormat: 'OPAQUE_SYNTHETIC',
    sampleRateHz: 48000,
    channelCount: 2,
    channelLayout: 'STEREO',
    inputGain: 1,
    faderGain: 1,
    pan: 0,
    balance: 0,
    mute: false,
    solo: false,
    soloSafe: false,
    phaseInvert: false,
    enabled: true,
    latencyCompensationSamples: 0,
    busSendIds: [],
    monitorPolicy: 'PROGRAM',
    audioFollowParticipation: true,
    metadata: {},
    createdAtNs: '1',
    updatedAtNs: '1',
  });
const send = (sendId: string, sourceChannelId: string, destinationBusId: string): AudioBusSend =>
  Object.freeze({
    sendId,
    sourceChannelId,
    destinationBusId,
    destinationBusGeneration: 1,
    enabled: true,
    preFader: false,
    gain: 1,
    transitionContributionParticipation: true,
    priority: 1,
    metadata: {},
  });
const request = (
  seq = 1,
  channels = ['mic'],
  buses = ['program', 'preview', 'aux', 'clean', 'monitor'],
): AudioMixRequest =>
  Object.freeze({
    requestId: `req:${seq}`,
    runtimeFrame: String(seq),
    blockSequence: seq,
    requestedSamplePosition: seq * 480,
    sampleCount: 480,
    outputBusIds: buses,
    inputChannelIds: channels,
    expectedChannelGenerations: Object.fromEntries(channels.map((c) => [c, 1])),
    expectedBusGenerations: Object.fromEntries(buses.map((b) => [b, 1])),
    expectedAudioFollowRouteGeneration: 1,
    expectedTransitionGeneration: 1,
    expectedMixerConfigurationGeneration: 1,
    deadlineNs: '0',
    metadata: {},
  });
const block = (seq = 1, channelId = 'mic') =>
  createAudioPcmBufferEnvelope({
    bufferId: `buf:${channelId}:${seq}`,
    sourceId: channelId,
    streamId: `${channelId}:stream`,
    sourceGeneration: 1,
    streamGeneration: 1,
    sequenceNumber: seq,
    samplePosition: seq * 480,
    sampleCount: 480,
    sampleRateHz: 48000,
    channelCount: 2,
    channelLayout: 'STEREO',
    sampleFormat: 'OPAQUE_SYNTHETIC',
    interleaving: 'OPAQUE',
    endianness: 'NA',
    timestampNs: String(seq * 10_000_000),
    clockDomain: 'synthetic-source',
    discontinuity: false,
    corrupted: false,
    silent: false,
    ownership: 'SOURCE_OWNED',
    payloadRef: `opaque:${seq}`,
    backendId: 'synthetic-audio-mixer',
    generation: 1,
  });
function throwsCode(fn: () => unknown, code: string) {
  assert.throws(fn, (e: any) => e?.code === code || e?.name === code);
}
function engine() {
  const m = createAudioMixerEngine('validation');
  m.registerBackend(createSyntheticAudioMixerBackend());
  for (const b of [
    bus('program', 'PROGRAM'),
    bus('preview', 'PREVIEW'),
    bus('aux', 'AUXILIARY'),
    bus('clean', 'CLEAN_FEED'),
    bus('monitor', 'MONITOR'),
  ])
    m.registerBus(b);
  m.registerChannel(channel('mic'));
  for (const b of ['program', 'preview', 'aux', 'clean', 'monitor'])
    m.addSend(send(`send:${b}`, 'mic', b));
  return m;
}

// 1-23 core creation/registration/generation/gain/format/layout.
{
  const m = createAudioMixerEngine();
  assert.equal(m.snapshot().state, 'READY');
  m.registerBackend(createSyntheticAudioMixerBackend());
  throwsCode(
    () => m.registerBackend(createSyntheticAudioMixerBackend()),
    'DuplicateAudioMixerBackend',
  );
  m.registerBus(bus('program', 'PROGRAM'));
  m.registerBus(bus('preview', 'PREVIEW'));
  m.registerBus(bus('aux', 'AUXILIARY'));
  m.registerBus(bus('clean', 'CLEAN_FEED'));
  m.registerBus(bus('monitor', 'MONITOR'));
  throwsCode(() => m.registerBus(bus('program', 'PROGRAM')), 'DuplicateAudioMixerBus');
  m.updateBus('aux', { expectedGeneration: 1, masterGain: 0.5 });
  throwsCode(
    () => m.updateBus('aux', { expectedGeneration: 1, masterGain: 0.25 }),
    'AudioMixerBusGenerationMismatch',
  );
  throwsCode(() => m.unregisterBus('program'), 'AudioMixerBusInvalid');
  m.registerChannel(channel('mic'));
  throwsCode(() => m.registerChannel(channel('mic')), 'DuplicateAudioMixerChannel');
  m.updateChannel('mic', { expectedGeneration: 1, mute: true });
  throwsCode(
    () => m.updateChannel('mic', { expectedGeneration: 1, mute: false }),
    'AudioMixerChannelGenerationMismatch',
  );
  throwsCode(
    () =>
      m.receiveBlock(
        'mic',
        createAudioPcmBufferEnvelope({
          ...block(1),
          sourceGeneration: 2,
          durationNs: undefined as never,
        } as any),
      ),
    'AudioMixerChannelGenerationMismatch',
  );
  m.addSend(send('send:program', 'mic', 'program'));
  throwsCode(() => m.addSend(send('send:program', 'mic', 'program')), 'AudioMixerSendInvalid');
  m.updateSend('send:program', { gain: 0.25 });
  throwsCode(() => m.addSend(send('bad', 'mic', 'missing')), 'AudioMixerSendInvalid');
}
for (const g of [0, 1, 16]) assert.equal(AUDIO_GAIN.validate(g), g);
for (const g of [NaN, Infinity, -1, 17]) assert.throws(() => AUDIO_GAIN.validate(g));
assert.equal(AUDIO_GAIN.dbToLinear(-120), 0);
assert.equal(validateAudioSampleFormat('PCM_F32'), true);
assert.equal(validateAudioSampleFormat('PCM_S16'), true);
assert.equal(validateAudioSampleFormat('OPAQUE_SYNTHETIC'), true);
throwsCode(() => validateAudioSampleFormat('MP3' as any), 'AudioMixerFormatUnsupported');
assert.equal(validateAudioChannelLayout('MONO', 1), true);
assert.equal(validateAudioChannelLayout('STEREO', 2), true);
throwsCode(() => validateAudioChannelLayout('STEREO', 1), 'AudioMixerLayoutUnsupported');

// 24-61 mute/solo/pan/phase/ownership/queues/sample positions/mixes.
{
  const m = engine();
  m.updateChannel('mic', { expectedGeneration: 1, solo: true, phaseInvert: true, pan: -1 });
  m.updateChannel('mic', { expectedGeneration: 2, pan: 0 });
  m.updateChannel('mic', { expectedGeneration: 3, pan: 1 });
  m.updateChannel('mic', { expectedGeneration: 4, balance: 0.5 });
  throwsCode(
    () => m.updateChannel('mic', { expectedGeneration: 5, pan: 2 }),
    'AudioMixerChannelInvalid',
  );
  const b = block(1);
  assert.equal(m.receiveBlock('mic', b), true);
  const r = m.processBlock({ ...request(1), expectedChannelGenerations: { mic: 5 } });
  assert.equal(r.status, 'COMPLETED');
  assert.ok(r.programOutput);
  assert.ok(r.previewOutput);
  assert.notEqual(r.programOutput?.outputId, r.previewOutput?.outputId);
  assert.equal(r.auxiliaryOutputs.length, 1);
  assert.ok(r.cleanFeedOutput);
  assert.ok(r.monitorOutput);
  throwsCode(
    () => m.processBlock({ ...request(1), expectedChannelGenerations: { mic: 5 } }),
    'AudioMixerDuplicateRequest',
  );
  throwsCode(
    () => m.receiveBlock('mic', { ...b, ownership: 'RELEASED', bufferId: 'released' } as any),
    'AudioMixerOwnershipViolation',
  );
  m.assertInvariants();
}
{
  const m = engine();
  const r = m.processBlock(request(2));
  assert.equal(r.status, 'DEGRADED');
  assert.deepEqual(r.underflowChannelIds, ['mic']);
  throwsCode(
    () => m.processBlock({ ...request(3), requestedSamplePosition: 1 }),
    'AudioMixerSamplePositionMismatch',
  );
}

// 62-101 routing/source graph/health/telemetry/faults/cancel/shutdown.
{
  const m = engine();
  m.receiveBlock('mic', block(10));
  const r = m.processBlock(request(10));
  assert.ok(r.programOutput);
  const sg = createAudioMixerSourceGraphSnapshot(m);
  assert.equal(sg.channels.length, 1);
  assert.equal((m.health() as any).programBusId, 'program');
  assert.ok((m.telemetry() as any).programPublications >= 1);
  assert.equal(Object.isFrozen(m.snapshot()), true);
  {
    const fm = createAudioMixerEngine('fault');
    fm.registerBackend(
      createSyntheticAudioMixerBackend(
        { backendId: 'fail', displayName: 'Fail', priority: 200, generation: 1 },
        { backendFailure: true },
      ),
    );
    fm.registerBus(bus('program', 'PROGRAM'));
    fm.registerChannel(channel('mic'));
    fm.addSend(send('send:program', 'mic', 'program'));
    fm.receiveBlock('mic', block(12));
    throwsCode(
      () =>
        fm.processBlock({
          ...request(12, ['mic'], ['program']),
          expectedBusGenerations: { program: 1 },
        }),
      'AudioMixerBackendFailed',
    );
  }
  const cancelled = m.processBlock({ ...request(11), requestId: 'cancel', cancelled: true });
  assert.equal(cancelled.status, 'CANCELLED');
  m.shutdown();
  m.shutdown();
  throwsCode(() => m.registerChannel(channel('late')), 'AudioMixerShutdownError');
}

// 102-121 deterministic long-run/replay/performance without sleeps.
function scenario() {
  const m = engine();
  for (let i = 100; i < 10100; i++) {
    m.receiveBlock('mic', block(i));
    const r = m.processBlock(request(i));
    assert.ok(r.programOutput);
  }
  const snap = m.snapshot();
  m.shutdown();
  return JSON.stringify({
    health: snap.health,
    telemetry: snap.telemetry,
    buses: snap.buses,
    channels: snap.channels,
  });
}
const a = scenario();
const b = scenario();
assert.equal(a, b);
{
  const m = engine();
  for (let i = 20000; i < 120000; i++) {
    if (i < 30000) m.receiveBlock('mic', block(i));
    m.processBlock(request(i));
  }
  const h: any = m.health();
  assert.equal(h.duplicateBlockCount, 0);
  assert.equal(h.ownershipViolationCount, 0);
  m.shutdown();
  assert.equal(m.validate().valid, true);
}
console.log('UBOS v5.6.1 audio mixer validation passed');
