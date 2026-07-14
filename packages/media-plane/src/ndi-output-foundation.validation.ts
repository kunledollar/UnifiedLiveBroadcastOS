const assert = Object.assign(
  (condition: unknown, message?: string) => {
    if (!condition) throw new Error(message ?? 'assertion failed');
  },
  {
    equal(actual: unknown, expected: unknown, message?: string) {
      if (actual !== expected)
        throw new Error(message ?? `expected ${String(actual)} to equal ${String(expected)}`);
    },
    deepEqual(actual: unknown, expected: unknown, message?: string) {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(message ?? 'deep equal failed');
    },
    throws(fn: () => unknown, pattern: RegExp) {
      let threw = false;
      try {
        fn();
      } catch (error) {
        threw = true;
        if (!pattern.test(String(error))) throw error;
      }
      if (!threw) throw new Error('expected throw');
    },
  },
);
import {
  NDI_OUTPUT_PROCESSOR_ORDER,
  createNdiOutputEngine,
  createNdiSourceGraphSnapshot,
  type NdiDestination,
  type NdiFrame,
  type NdiOutputProfile,
  type NdiSession,
} from './ndi-output-foundation.js';
const profile: NdiOutputProfile = {
  profileId: 'p',
  generation: 1,
  outputRole: 'PROGRAM',
  senderType: 'PROGRAM',
  discoveryMode: 'STATIC_METADATA',
  bandwidthProfile: 'HIGH',
  videoMetadata: { format: '1080p' },
  audioMetadata: { channels: 2 },
  safeMetadata: { safe: true },
};
const dest: NdiDestination = {
  destinationId: 'd',
  generation: 1,
  enabled: true,
  receiverCompatibility: 'COMPATIBLE',
  streamReference: 'ref:stream',
  deviceReference: 'ref:device',
  groupReference: 'ref:group',
  friendlyNameSummary: 'program_sender',
  safeMetadata: {},
};
const session: NdiSession = {
  sessionId: 's',
  generation: 1,
  profileId: 'p',
  profileGeneration: 1,
  destinationId: 'd',
  destinationGeneration: 1,
  streamingSessionId: 'stream-s',
  outputRole: 'PROGRAM',
  safeMetadata: {},
};
const frame = (i: number): NdiFrame => ({
  frameId: `f-${i}`,
  sessionId: 's',
  generation: 1,
  frameSequence: i,
  timestamp: i * 3000,
  videoReference: `video-${i}`,
  audioReference: `audio-${i}`,
  ownership: 'BORROWED_READ_ONLY',
  safeMetadata: { paired: true },
});
function scenario() {
  const e = createNdiOutputEngine();
  e.registerProfile(profile);
  e.registerDestination(dest);
  e.createSession(session);
  e.advertise('s');
  for (let i = 1; i <= 10000; i++) {
    e.submitFrame(frame(i));
    if (i <= 64) e.updateMetadata('s', { summary: `m-${i}` });
    if (i % 1000 === 0) e.updateTally('s', { program: i % 2000 === 0 });
    if (i % 2500 === 0) e.updatePtz('s', { metadataOnly: true, preset: i / 2500 });
  }
  return e;
}
const e = scenario(),
  s = e.snapshot();
assert.equal(s.version, '5.7.6');
assert.equal(s.health.frameCount, 10000);
assert.equal(s.health.metadataQueueDepth, 64);
assert.equal(
  s.results.every((r) => !r.realNdiTransmission && !r.realDiscovery),
  true,
);
assert.equal(s.validation.valid, true);
assert.equal(createNdiSourceGraphSnapshot(e).realDiscovery, false);
assert.equal(NDI_OUTPUT_PROCESSOR_ORDER, 1066);
assert.throws(() => e.submitFrame(frame(10000)), /Duplicate|Sequence/);
assert.throws(() => e.submitFrame({ ...frame(10001), generation: 0 }), /Stale/);
assert.throws(() => e.submitFrame({ ...frame(10001), ownership: 'RELEASED' }), /Ownership/);
assert.throws(() => {
  const unsafe = createNdiOutputEngine();
  unsafe.registerProfile(profile);
  unsafe.registerDestination(dest);
  unsafe.createSession(session);
  unsafe.updateMetadata('s', { secret: 'bad' });
}, /unsafe/);
assert.equal(JSON.stringify(s).includes('ndi://'), false);
assert.equal(JSON.stringify(s).includes('secret'), false);
const a = JSON.stringify(scenario().snapshot()),
  b = JSON.stringify(scenario().snapshot());
assert.equal(a, b, 'deterministic replay');
e.shutdownEngine();
const shut = e.snapshot();
assert.equal(shut.sessions.length, 0);
assert.equal(shut.frames.length, 0);
assert.equal(shut.health.metadataQueueDepth, 0);
console.log('UBOS v5.7.6 NDI output foundation validation passed');
