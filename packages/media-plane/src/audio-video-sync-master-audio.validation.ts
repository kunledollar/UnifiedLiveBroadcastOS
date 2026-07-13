import {
  AudioVideoSyncMasterAudioError,
  createAudioVideoSyncMasterAudioEngine,
  type AudioSyncReference,
  type AudioVideoSyncMode,
  type AudioVideoSyncOutputRole,
  type AudioVideoSyncRequest,
  type VideoSyncReference,
} from './audio-video-sync-master-audio.js';
const assert = {
  equal(a: unknown, b: unknown, m?: string) {
    if (a !== b) throw new Error(m ?? `${a} !== ${b}`);
  },
  ok(v: unknown, m?: string) {
    if (!v) throw new Error(m ?? 'assert ok failed');
  },
  deepEqual(a: unknown, b: unknown, m?: string) {
    const aa = JSON.stringify(a),
      bb = JSON.stringify(b);
    if (aa !== bb) throw new Error(m ?? `${aa} !== ${bb}`);
  },
  throws(fn: () => unknown, code: string) {
    let thrown = false;
    try {
      fn();
    } catch (e) {
      thrown = true;
      if (!(e instanceof AudioVideoSyncMasterAudioError) || e.code !== code) throw e;
    }
    if (!thrown) throw new Error(`expected ${code}`);
  },
};
const vtb = { numerator: 1, denominator: 60 };
const atb = { numerator: 1, denominator: 48_000 };
const video = (
  tick: number,
  role: AudioVideoSyncOutputRole = 'PROGRAM',
  generation = 1,
  frameRate = 60,
): VideoSyncReference => ({
  referenceId: `video:${role}:${tick}`,
  role,
  generation,
  runtimeFrame: String(tick),
  pts: tick,
  duration: 1,
  timeBase: { numerator: 1, denominator: frameRate },
  width: 1920,
  height: 1080,
  safeMetadata: {},
});
const audio = (
  tick: number,
  role: AudioVideoSyncOutputRole = 'PROGRAM',
  sampleRate = 48_000,
  leadSamples = 0,
): AudioSyncReference => ({
  referenceId: `audio:${role}:${tick}:${leadSamples}`,
  role,
  generation: 1,
  runtimeFrame: String(tick),
  samplePosition: tick * Math.round(sampleRate / 60) + leadSamples,
  sampleCount: Math.round(sampleRate / 60),
  pts: tick * Math.round(sampleRate / 60) + leadSamples,
  duration: Math.round(sampleRate / 60),
  timeBase: { numerator: 1, denominator: sampleRate },
  sampleRate,
  channelLayout: 'STEREO',
  safeMetadata: {},
});
const req = (
  e: ReturnType<typeof createAudioVideoSyncMasterAudioEngine>,
  tick: number,
  role: AudioVideoSyncOutputRole = 'PROGRAM',
  a = audio(tick, role),
  v = video(tick, role),
  mode: AudioVideoSyncMode = 'BOUNDED_AUDIO_DELAY',
  generation?: number,
): AudioVideoSyncRequest => ({
  requestId: `req:${role}:${tick}`,
  role,
  tickFrame: String(tick),
  video: v,
  audio: a,
  expectedTimelineGeneration: generation ?? e.snapshot().timeline.generation,
  expectedVideoGeneration: v?.generation,
  expectedAudioGeneration: a?.generation,
  mode,
  toleranceNs: 2_000_000,
  safeMetadata: {},
});
function runScenario() {
  const e = createAudioVideoSyncMasterAudioEngine();
  e.updateClockCorrelation('program-video', 0);
  e.updateClockCorrelation('program-audio', 0);
  const rates = [24, 25, 30, 50, 60];
  const audioRates = [32_000, 44_100, 48_000, 96_000];
  const roles: AudioVideoSyncOutputRole[] = [
    'PROGRAM',
    'PREVIEW',
    'AUX',
    'CLEAN_FEED',
    'MONITOR',
    'RECORD',
    'STREAM',
  ];
  let generation = 1;
  for (let i = 0; i < 100_000; i++) {
    const role = roles[i % roles.length];
    const frameRate = rates[i % rates.length];
    const sampleRate = audioRates[i % audioRates.length];
    const drift = Math.trunc(i / 10_000);
    const lead = i % 997 === 0 ? 120 : i % 991 === 0 ? -120 : drift;
    if (i > 0 && i % 20_000 === 0) {
      e.resetTimeline(`discontinuity:${i}`);
      generation += 1;
    }
    const r = req(
      e,
      i,
      role,
      audio(i, role, sampleRate, lead),
      video(i, role, 1, frameRate),
      'BOUNDED_AUDIO_DELAY',
      generation,
    );
    try {
      e.processRequest(r);
    } catch (err) {
      if (
        !(err instanceof AudioVideoSyncMasterAudioError) ||
        ![
          'AV_SYNC_DUPLICATE_PROGRAM_MASTER_OUTPUT',
          'AV_SYNC_TIMESTAMP_REGRESSION',
          'AV_SYNC_SAMPLE_POSITION_REGRESSION',
        ].includes(err.code)
      )
        throw err;
    }
    if (i % 2048 === 0) {
      const p = e.performanceCounters();
      assert.equal(p.timelineLookup, 'O(1)');
      assert.equal(p.masterBusProcessing, 'O(active buses)');
    }
  }
  return e;
}
const e = createAudioVideoSyncMasterAudioEngine();
assert.equal(e.snapshot().version, '5.6.5');
const p0 = e.processRequest(req(e, 0));
assert.equal(p0.published, true);
assert.equal(e.correlation('PROGRAM').validForPublication, true);
assert.throws(() => e.processRequest(req(e, 0)), 'AV_SYNC_DUPLICATE_PROCESSING');
assert.throws(
  () => e.processRequest({ ...req(e, 0), requestId: 'same-tick-program-again' }),
  'AV_SYNC_DUPLICATE_PROGRAM_MASTER_OUTPUT',
);
assert.throws(
  () => e.processRequest({ ...req(e, 1), expectedTimelineGeneration: 0 }),
  'AV_SYNC_STALE_TIMELINE_GENERATION',
);
e.processRequest(req(e, 1));
assert.throws(
  () => e.processRequest({ ...req(e, 2), video: { ...video(2), pts: 0 }, requestId: 'regress-v' }),
  'AV_SYNC_TIMESTAMP_REGRESSION',
);
assert.throws(
  () =>
    e.processRequest({
      ...req(e, 2),
      audio: { ...audio(2), samplePosition: 0 },
      requestId: 'regress-a',
    }),
  'AV_SYNC_SAMPLE_POSITION_REGRESSION',
);
const aLead = createAudioVideoSyncMasterAudioEngine();
const planA = aLead.createPlan(
  req(aLead, 10, 'PREVIEW', audio(10, 'PREVIEW', 48_000, 480), video(10, 'PREVIEW')),
);
assert.equal(planA.correctionPolicy, 'DELAY_AUDIO');
const vLead = createAudioVideoSyncMasterAudioEngine();
const planV = vLead.createPlan(
  req(vLead, 10, 'PREVIEW', audio(10, 'PREVIEW', 48_000, -480), video(10, 'PREVIEW')),
);
assert.equal(planV.correctionPolicy, 'HOLD_VIDEO');
const first = runScenario().snapshot();
const second = runScenario().snapshot();
assert.deepEqual(first.timeline, second.timeline);
assert.deepEqual(first.programCorrelation, second.programCorrelation);
assert.deepEqual(first.previewCorrelation, second.previewCorrelation);
assert.deepEqual(first.health.processedTickCount, second.health.processedTickCount);
assert.deepEqual(first.telemetry.syncPlans, second.telemetry.syncPlans);
assert.equal(first.containsPcm, false);
assert.equal(first.containsPixels, false);
assert.equal(first.health.heldResourceCount, 0);
assert.equal(first.health.activeBusCount, 7);
assert.ok(first.telemetry.syncPlans > 0);
const perf = createAudioVideoSyncMasterAudioEngine().performanceCounters();
assert.equal(perf.timestampConversions10000, 10000);
assert.equal(perf.processorTicks100000, 100000);
const shut = createAudioVideoSyncMasterAudioEngine();
shut.processRequest(req(shut, 1));
const snap = shut.shutdown();
assert.equal(snap.health.engineState, 'SHUTDOWN');
assert.equal(shut.assertInvariants().valid, true);
console.log('UBOS v5.6.5 audio/video sync and master audio validation passed');
