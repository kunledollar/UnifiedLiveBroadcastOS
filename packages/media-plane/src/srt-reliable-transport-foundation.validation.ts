/* eslint-disable @typescript-eslint/no-explicit-any */
const assert = Object.assign(
  (value: unknown, message?: string) => {
    if (!value) throw new Error(message ?? 'assertion failed');
  },
  {
    equal: (a: unknown, b: unknown, message?: string) => {
      if (a !== b) throw new Error(message ?? `expected ${String(a)} to equal ${String(b)}`);
    },
    throws: (fn: () => unknown, pattern: RegExp) => {
      try {
        fn();
      } catch (error) {
        if (pattern.test(String(error))) return;
        throw error;
      }
      throw new Error(`expected throw ${pattern}`);
    },
  },
);
import {
  createSrtOutputEngine,
  createSrtReference,
  createSyntheticSrtOutputBackend,
  SRT_OUTPUT_PROCESSOR_ORDER,
  type SrtDestination,
  type SrtOutputProfile,
  type SrtPacketEnvelope,
  type SrtSession,
} from './srt-reliable-transport-foundation.js';
const pass = createSrtReference({
    referenceId: 'pass-ref',
    providerMetadata: 'vault',
    sensitiveValue: 'never-exposed',
  }),
  stream = createSrtReference({
    referenceId: 'stream-ref',
    providerMetadata: 'control',
    sensitiveValue: '#!::u=program',
  }),
  ep = createSrtReference({
    referenceId: 'endpoint-ref',
    providerMetadata: 'routing',
    sensitiveValue: 'srt://example.invalid:9000',
  });
function profile(
  id: string,
  mode: SrtOutputProfile['mode'] = 'CALLER',
  enc: SrtOutputProfile['encryptionType'] = 'AES_256',
): SrtOutputProfile {
  return {
    profileId: id,
    profileVersion: '5.7.4',
    profileGeneration: 1,
    displayName: id,
    mode,
    outputRole: 'PROGRAM',
    latencyMs: 120,
    maxQueueDepth: 20000,
    maxRetransmissionDepth: 20000,
    encryptionType: enc,
    ...(enc === 'NONE' ? {} : { passphraseReference: pass }),
    streamIdReference: stream,
    backendPreference: 'synthetic-srt-backend',
    safeMetadata: {},
    createdAtNs: 0,
    updatedAtNs: 0,
  };
}
function dest(id: string, mode: SrtDestination['mode'] = 'CALLER'): SrtDestination {
  return {
    destinationId: id,
    destinationVersion: '5.7.4',
    destinationGeneration: 1,
    streamingDestinationId: `streaming-${id}`,
    streamingDestinationGeneration: 1,
    mode,
    endpointReference: ep,
    streamIdReference: stream,
    passphraseReference: pass,
    enabled: true,
    connectionEligibility: 'ELIGIBLE',
    safeMetadata: {},
    createdAtNs: 0,
    updatedAtNs: 0,
  };
}
function session(
  id: string,
  p: SrtOutputProfile,
  d: SrtDestination,
  role: SrtSession['outputRole'] = 'PROGRAM',
): SrtSession {
  return {
    srtSessionId: id,
    sessionVersion: '5.7.4',
    sessionGeneration: 1,
    srtProfileId: p.profileId,
    srtProfileGeneration: p.profileGeneration,
    srtDestinationId: d.destinationId,
    srtDestinationGeneration: d.destinationGeneration,
    streamingSessionId: `streaming-${id}`,
    streamingSessionGeneration: 1,
    outputRole: role,
    enabled: true,
    safeMetadata: {},
    createdAtNs: 0,
    updatedAtNs: 0,
  };
}
function packet(id: string, seq: number, sid = 's-caller'): SrtPacketEnvelope {
  return {
    packetId: `pkt-${id}-${seq}`,
    packetGeneration: 1,
    srtSessionId: sid,
    sessionGeneration: 1,
    packetSequence: seq,
    sourcePts: seq * 3000,
    destinationTimestamp: seq * 3000 + 120,
    payloadReference: `payload-ref-${seq}`,
    packetSize: 1200,
    packetType: seq % 30 === 0 ? 'KEYFRAME' : 'MEDIA',
    keyframe: seq % 30 === 0,
    ownership: 'BORROWED_READ_ONLY',
    safeMetadata: {},
  };
}
function scenario() {
  const e = createSrtOutputEngine('validation');
  e.registerBackend(createSyntheticSrtOutputBackend());
  const modes = ['CALLER', 'LISTENER', 'RENDEZVOUS'] as const;
  for (const m of modes) {
    const p = profile(`p-${m}`, m);
    const d = dest(`d-${m}`, m);
    e.registerProfile(p);
    e.registerDestination(d);
    e.createSession(
      session(
        `s-${m.toLowerCase()}`,
        p,
        d,
        m === 'CALLER' ? 'PROGRAM' : m === 'LISTENER' ? 'CLEAN_FEED' : 'AUXILIARY',
      ),
    );
    e.connect(`s-${m.toLowerCase()}`);
    e.start(`s-${m.toLowerCase()}`);
  }
  for (let i = 0; i < 10000; i++) e.submitPacket(packet('caller', i));
  e.ack('s-caller', 9999);
  e.nak('s-caller', [5, 6, 7]);
  for (let i = 0; i < 10000; i++) e.retransmit('s-caller');
  for (let i = 0; i < 100000; i++) e.processTick({ frameNumber: i } as any);
  return e;
}
const e = scenario(),
  snap = e.snapshot();
assert.equal(snap.version, '5.7.4');
assert.equal(snap.backends.length, 1);
assert.equal(snap.sessions.length, 3);
assert.equal(
  snap.handshakeStates.every((h) => h.completed),
  true,
);
assert.equal(
  snap.encryptionStates.some((x) => x.encryptionType === 'AES_256'),
  true,
);
assert.equal(snap.packetStates.find((x) => x.srtSessionId === 's-caller')?.packetCount, 10000);
assert.equal(snap.ackStates.find((x) => x.srtSessionId === 's-caller')?.ackCount, 1);
assert.equal(snap.nakStates.find((x) => x.srtSessionId === 's-caller')?.nakCount, 3);
assert.equal(
  snap.retransmissionStates.find((x) => x.srtSessionId === 's-caller')?.evaluations,
  10000,
);
assert.equal(
  snap.results.every((r) => !r.realNetworkTransmission && !r.realUdp),
  true,
);
assert.equal(JSON.stringify(snap).includes('never-exposed'), false);
assert.equal(JSON.stringify(snap).includes('srt://example'), false);
assert.equal(snap.health.ownership, 'ZERO_LEAKS');
assert.equal(snap.validation.valid, true);
assert.throws(() => e.registerBackend(createSyntheticSrtOutputBackend()), /DuplicateSrtBackend/);
assert.throws(
  () => e.submitPacket(packet('dup', 9999)),
  /SrtSequenceRegression|SrtDuplicatePacket/,
);
assert.throws(
  () => createSrtOutputEngine().registerProfile({ ...profile('bad'), mode: 'UNSUPPORTED' as any }),
  /SrtModeUnsupported/,
);
const a = JSON.stringify(scenario().snapshot());
const b = JSON.stringify(scenario().snapshot());
assert.equal(a, b, 'deterministic replay');
e.drain('s-caller');
e.flush('s-listener');
e.reset('s-rendezvous');
e.shutdownEngine();
assert.equal(e.snapshot().health.activeSessions, 0);
assert.equal(SRT_OUTPUT_PROCESSOR_ORDER, 1062);
console.log('UBOS v5.7.4 SRT reliable transport foundation validation passed');
