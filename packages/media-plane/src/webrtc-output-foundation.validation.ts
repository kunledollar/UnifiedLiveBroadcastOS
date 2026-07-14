/* eslint-disable @typescript-eslint/no-explicit-any */
const assert = Object.assign(
  (c: unknown, m?: string) => {
    if (!c) throw new Error(m ?? 'assert');
  },
  {
    equal(a: unknown, b: unknown, m?: string) {
      if (a !== b) throw new Error(m ?? `${a} !== ${b}`);
    },
    throws(fn: () => unknown, re: RegExp) {
      let t = false;
      try {
        fn();
      } catch (e) {
        t = true;
        if (!re.test(String(e))) throw e;
      }
      if (!t) throw new Error('expected throw');
    },
  },
);
import {
  WEBRTC_OUTPUT_PROCESSOR_ORDER,
  createWebRtcOutputEngine,
  createWebRtcSourceGraphSnapshot,
  type WebRtcDestination,
  type WebRtcOutputProfile,
  type WebRtcRtpPacket,
  type WebRtcSession,
} from './webrtc-output-foundation.js';
const profile: WebRtcOutputProfile = {
  profileId: 'p',
  generation: 1,
  sessionType: 'BROADCAST',
  connectionRole: 'PUBLISHER',
  iceMode: 'FULL_ICE',
  outputRole: 'PROGRAM',
  codecs: ['OPUS', 'H264'],
  safeMetadata: {},
};
const dest: WebRtcDestination = {
  destinationId: 'd',
  generation: 1,
  enabled: true,
  transportMetadata: 'UDP',
  signalingReference: 'redacted-signaling',
  stunTurnReference: 'redacted-turn',
  safeMetadata: {},
};
const session: WebRtcSession = {
  sessionId: 's',
  generation: 1,
  profileId: 'p',
  profileGeneration: 1,
  destinationId: 'd',
  destinationGeneration: 1,
  peerId: 'peer',
  outputRole: 'PROGRAM',
  streamingSessionId: 'stream-s',
  safeMetadata: {},
};
const pkt = (i: number): WebRtcRtpPacket => ({
  packetId: `pkt-${i}`,
  sessionId: 's',
  generation: 1,
  ssrc: 1234,
  payloadType: 97,
  sequenceNumber: i,
  timestamp: i * 3000,
  marker: i % 30 === 0,
  codec: i % 2 ? 'H264' : 'OPUS',
  packetSize: 1200,
  frameReference: `frame-${i}`,
  ownership: 'BORROWED_READ_ONLY',
  safeMetadata: {},
});
function scenario() {
  const e = createWebRtcOutputEngine('validation');
  e.registerProfile(profile);
  e.registerDestination(dest);
  e.createSession(session);
  e.connect('s');
  e.negotiate('s');
  e.start('s');
  for (let i = 1; i <= 10000; i++) e.submitPacket(pkt(i), i);
  for (let i = 0; i < 10000; i++)
    e.updateCongestion('s', {
      estimatedBitrate: 4000000 - i,
      bandwidthEstimate: 4000000 - i,
      packetLoss: i % 100,
    });
  e.restartIce('s');
  e.renegotiate('s');
  for (let i = 0; i < 100000; i++) e.processTick({ frameNumber: i } as any);
  return e;
}
const e = scenario(),
  s = e.snapshot();
assert.equal(s.version, '5.7.5');
assert.equal(s.health.packetCount, 10000);
assert.equal(s.telemetry.congestionEvents, 10000);
assert.equal(s.telemetry.iceRestarts, 1);
assert.equal(s.sessionDescriptions[0]?.safeMetadata.noRawSdp, true);
assert.equal(
  s.results.every(
    (r) => !r.realWebRtcTransport && !r.realNetworkTransmission && !r.realDtls && !r.realSrtp,
  ),
  true,
);
assert.equal(s.validation.valid, true);
assert.equal(createWebRtcSourceGraphSnapshot(e).realWebRtcTransport, false);
assert.equal(WEBRTC_OUTPUT_PROCESSOR_ORDER, 1064);
assert.throws(() => e.submitPacket(pkt(1)), /Duplicate|Sequence/);
assert.throws(() => e.submitPacket({ ...pkt(10001), generation: 0 }), /Stale/);
assert.throws(() => e.submitPacket({ ...pkt(10001), ownership: 'RELEASED' }), /Ownership/);
const a = JSON.stringify(scenario().snapshot()),
  b = JSON.stringify(scenario().snapshot());
assert.equal(a, b, 'deterministic replay');
e.drain('s');
e.shutdownEngine();
const shut = e.snapshot();
assert.equal(shut.sessions.length, 0);
assert.equal(shut.plans.length, 0);
assert.equal(shut.retransmissionStates.length, 0);
console.log('UBOS v5.7.5 WebRTC output foundation validation passed');
