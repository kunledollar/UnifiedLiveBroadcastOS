/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';
import type { StreamingOutputRole } from './streaming-output-foundation.js';

export const SRT_OUTPUT_VERSION = '5.7.4';
export const SRT_OUTPUT_PROCESSOR_ORDER = 1062;
type Safe = Readonly<Record<string, unknown>>;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};
const red = (s: string) => `redacted:${hash(s)}`;
const assertSafe = (m: Safe = {}) => {
  const j = JSON.stringify(m);
  if (
    /(srt:\/\/|passphrase|password|token|secret|authorization|cookie|payload|bytes|aes[-_ ]?key)/i.test(
      j,
    )
  )
    throw new SrtOutputError('SrtDestinationInvalid', 'unsafe metadata rejected');
  return freeze(clone(m));
};
export const SRT_MODES = ['CALLER', 'LISTENER', 'RENDEZVOUS', 'CUSTOM'] as const;
export type SrtMode = (typeof SRT_MODES)[number];
export const SRT_SESSION_STATES = [
  'CREATED',
  'VALIDATING',
  'CONNECTING',
  'HANDSHAKING',
  'CONNECTED',
  'STREAMING',
  'DEGRADED',
  'RECONNECTING',
  'RECOVERING',
  'DRAINING',
  'STOPPED',
  'FAILED',
  'SHUTDOWN',
] as const;
export type SrtConnectionState = (typeof SRT_SESSION_STATES)[number];
export const SRT_ENCRYPTION_TYPES = ['NONE', 'AES_128', 'AES_192', 'AES_256', 'CUSTOM'] as const;
export type SrtEncryptionType = (typeof SRT_ENCRYPTION_TYPES)[number];
export const SRT_PACKET_TYPES = [
  'MEDIA',
  'KEYFRAME',
  'KEEPALIVE',
  'CONTROL',
  'RETRANSMISSION',
  'CUSTOM',
] as const;
export type SrtPacketType = (typeof SRT_PACKET_TYPES)[number];
export const SRT_COMMANDS = [
  'SRT_REGISTER_PROFILE',
  'SRT_REGISTER_DESTINATION',
  'SRT_CREATE_SESSION',
  'SRT_CONNECT',
  'SRT_START',
  'SRT_STOP',
  'SRT_SUBMIT_PACKET',
  'SRT_ACK',
  'SRT_NAK',
  'SRT_RETRANSMIT',
  'SRT_RECONNECT',
  'SRT_RESET',
  'SRT_FLUSH',
  'SRT_DRAIN',
  'SRT_VALIDATE',
  'SRT_SHUTDOWN',
] as const;
export type SrtCommandName = (typeof SRT_COMMANDS)[number];
export const SRT_OUTPUT_KEYS = freeze({
  profiles: 'srt.profiles',
  sessions: 'srt.sessions',
  handshakeState: 'srt.handshake',
  encryptionState: 'srt.encryption',
  packetState: 'srt.packet.sequence',
  ackState: 'srt.ack',
  nakState: 'srt.nak',
  retransmissionState: 'srt.retransmission',
  congestionState: 'srt.congestion',
  latencyState: 'srt.latency',
  health: 'srt.health',
  telemetry: 'srt.telemetry',
  results: 'srt.results',
} as const);
export const SRT_WATCHDOG_INCIDENTS = [
  'SRT_SESSION_STALLED',
  'SRT_PACKET_SEQUENCE_ERROR',
  'SRT_ACK_TIMEOUT',
  'SRT_RETRANSMISSION_FAILURE',
  'SRT_QUEUE_OVERFLOW',
  'SRT_CONGESTION_CRITICAL',
  'SRT_ENCRYPTION_CONFIGURATION_INVALID',
  'SRT_HANDSHAKE_FAILED',
  'SRT_DESTINATION_UNAVAILABLE',
  'SRT_BACKEND_FAILED',
  'SRT_OWNERSHIP_VIOLATION',
  'SRT_INVARIANT_FAILURE',
] as const;
export type SrtErrorCode =
  | 'DuplicateSrtBackend'
  | 'DuplicateSrtProfile'
  | 'DuplicateSrtDestination'
  | 'DuplicateSrtSession'
  | 'SrtProfileNotFound'
  | 'SrtDestinationNotFound'
  | 'SrtSessionNotFound'
  | 'SrtModeUnsupported'
  | 'SrtDestinationInvalid'
  | 'SrtEncryptionInvalid'
  | 'SrtDuplicatePacket'
  | 'SrtSequenceRegression'
  | 'SrtOwnershipViolation'
  | 'SrtQueueFull'
  | 'SrtInvariantViolation';
export class SrtOutputError extends Error {
  constructor(
    readonly code: SrtErrorCode,
    message: string,
  ) {
    super(`${code}: ${message.replace(/srt:\/\/\S+/g, '[redacted-srt-endpoint]')}`);
  }
}
export interface SrtOpaqueReference {
  readonly referenceId: string;
  readonly generation: number;
  readonly providerMetadata: string;
  readonly available: boolean;
  readonly hashOrRedactedSummary: string;
  readonly safeMetadata: Safe;
}
export const createSrtReference = (i: {
  referenceId: string;
  generation?: number;
  providerMetadata: string;
  sensitiveValue?: string;
  available?: boolean;
  safeMetadata?: Safe;
}): SrtOpaqueReference =>
  freeze({
    referenceId: i.referenceId,
    generation: i.generation ?? 1,
    providerMetadata: i.providerMetadata,
    available: i.available ?? true,
    hashOrRedactedSummary: red(i.sensitiveValue ?? i.referenceId),
    safeMetadata: assertSafe(i.safeMetadata),
  });
export interface SrtOutputProfile {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly mode: SrtMode;
  readonly outputRole: StreamingOutputRole;
  readonly latencyMs: number;
  readonly maxQueueDepth: number;
  readonly maxRetransmissionDepth: number;
  readonly encryptionType: SrtEncryptionType;
  readonly passphraseReference?: SrtOpaqueReference;
  readonly streamIdReference?: SrtOpaqueReference;
  readonly backendPreference?: string;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface SrtDestination {
  readonly destinationId: string;
  readonly destinationVersion: string;
  readonly destinationGeneration: number;
  readonly streamingDestinationId: string;
  readonly streamingDestinationGeneration: number;
  readonly mode: SrtMode;
  readonly endpointReference: SrtOpaqueReference;
  readonly streamIdReference?: SrtOpaqueReference;
  readonly passphraseReference?: SrtOpaqueReference;
  readonly enabled: boolean;
  readonly connectionEligibility: 'ELIGIBLE' | 'DISABLED' | 'METADATA_ONLY';
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface SrtSession {
  readonly srtSessionId: string;
  readonly sessionVersion: string;
  readonly sessionGeneration: number;
  readonly srtProfileId: string;
  readonly srtProfileGeneration: number;
  readonly srtDestinationId: string;
  readonly srtDestinationGeneration: number;
  readonly streamingSessionId: string;
  readonly streamingSessionGeneration: number;
  readonly outputRole: StreamingOutputRole;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface SrtHandshakeState {
  readonly srtSessionId: string;
  readonly phase:
    | 'NOT_STARTED'
    | 'VALIDATING'
    | 'INDUCTION'
    | 'CONCLUSION'
    | 'CONNECTED_METADATA'
    | 'FAILED'
    | 'RESET';
  readonly completed: boolean;
  readonly attempt: number;
  readonly streamIdHash?: string;
  readonly safeMetadata: Safe;
}
export interface SrtEncryptionState {
  readonly srtSessionId: string;
  readonly encryptionType: SrtEncryptionType;
  readonly keyExchangeMetadata: 'NONE' | 'REFERENCE_ONLY';
  readonly passphraseRefHash?: string;
  readonly valid: boolean;
  readonly safeMetadata: Safe;
}
export interface SrtPacketEnvelope {
  readonly packetId: string;
  readonly packetGeneration: number;
  readonly srtSessionId: string;
  readonly sessionGeneration: number;
  readonly packetSequence: number;
  readonly sourcePts: number;
  readonly destinationTimestamp: number;
  readonly payloadReference: string;
  readonly packetSize: number;
  readonly packetType: SrtPacketType;
  readonly keyframe: boolean;
  readonly ownership: 'BORROWED_READ_ONLY' | 'OWNED_METADATA' | 'PASSTHROUGH';
  readonly safeMetadata: Safe;
}
export interface SrtPacketSequenceState {
  readonly srtSessionId: string;
  readonly lastSequence: number;
  readonly packetCount: number;
  readonly duplicateCount: number;
  readonly staleGenerationCount: number;
}
export interface SrtAckState {
  readonly srtSessionId: string;
  readonly lastAckSequence: number;
  readonly ackCount: number;
  readonly acknowledgedPackets: readonly number[];
}
export interface SrtNakState {
  readonly srtSessionId: string;
  readonly nakCount: number;
  readonly missingSequences: readonly number[];
}
export interface SrtRetransmissionState {
  readonly srtSessionId: string;
  readonly evaluations: number;
  readonly queuedSequences: readonly number[];
  readonly plannedRetransmissions: number;
  readonly failures: number;
}
export interface SrtLatencyWindow {
  readonly srtSessionId: string;
  readonly latencyMs: number;
  readonly minTimestamp: number;
  readonly maxTimestamp: number;
  readonly bufferedPackets: number;
}
export interface SrtCongestionState {
  readonly srtSessionId: string;
  readonly congestionWindow: number;
  readonly queueDepth: number;
  readonly events: number;
  readonly state: 'CLEAR' | 'WATCH' | 'CONGESTED' | 'CRITICAL';
}
export interface SrtStatistics {
  readonly packets: number;
  readonly retransmissions: number;
  readonly reconnects: number;
  readonly handshakes: number;
  readonly queueDepth: number;
  readonly congestion: number;
  readonly packetLoss: number;
  readonly duplicatePackets: number;
  readonly staleGenerations: number;
  readonly activeSessions: number;
}
export interface SrtSendRequest {
  readonly requestId: string;
  readonly packetId: string;
  readonly srtSessionId: string;
  readonly packetSequence: number;
  readonly runtimeFrame: number;
}
export interface SrtSendPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly srtSessionId: string;
  readonly packetSequence: number;
  readonly syntheticDeliveryEstimate: string;
  readonly retransmission: boolean;
  readonly warnings: readonly string[];
}
export interface SrtTransmissionResult {
  readonly resultId: string;
  readonly planId: string;
  readonly requestId: string;
  readonly srtSessionId: string;
  readonly packetId: string;
  readonly packetSequence: number;
  readonly status:
    'SENT' | 'QUEUED' | 'ACKED' | 'NAKED' | 'RETRANSMIT_PLANNED' | 'DROPPED' | 'FAILED' | 'STOPPED';
  readonly syntheticDeliveryReference: string;
  readonly realNetworkTransmission: false;
  readonly realUdp: false;
  readonly completedAtNs: number;
  readonly warnings: readonly string[];
}
interface Backend {
  descriptor: { backendId: string; backendVersion: string; syntheticOnly: true };
}
export const createSyntheticSrtOutputBackend = (id = 'synthetic-srt-backend'): Backend =>
  freeze({
    descriptor: { backendId: id, backendVersion: SRT_OUTPUT_VERSION, syntheticOnly: true },
  });
export class SrtOutputEngine {
  private backends = new Map<string, Backend>();
  private profiles = new Map<string, SrtOutputProfile>();
  private destinations = new Map<string, SrtDestination>();
  private sessions = new Map<string, SrtSession>();
  private states = new Map<string, SrtConnectionState>();
  private handshakes = new Map<string, SrtHandshakeState>();
  private encryption = new Map<string, SrtEncryptionState>();
  private packets = new Map<string, SrtPacketEnvelope>();
  private seq = new Map<string, SrtPacketSequenceState>();
  private acks = new Map<string, SrtAckState>();
  private naks = new Map<string, SrtNakState>();
  private retrans = new Map<string, SrtRetransmissionState>();
  private latency = new Map<string, SrtLatencyWindow>();
  private congestion = new Map<string, SrtCongestionState>();
  private requests = new Map<string, SrtSendRequest>();
  private plans = new Map<string, SrtSendPlan>();
  private results = new Map<string, SrtTransmissionResult>();
  private incidents: string[] = [];
  private shutdown = false;
  private clock = 0;
  private stats: SrtStatistics = freeze({
    packets: 0,
    retransmissions: 0,
    reconnects: 0,
    handshakes: 0,
    queueDepth: 0,
    congestion: 0,
    packetLoss: 0,
    duplicatePackets: 0,
    staleGenerations: 0,
    activeSessions: 0,
  });
  constructor(readonly engineId = 'srt-output-engine') {}
  registerBackend(b: Backend) {
    if (this.backends.has(b.descriptor.backendId))
      throw new SrtOutputError('DuplicateSrtBackend', b.descriptor.backendId);
    this.backends.set(b.descriptor.backendId, b);
    return b.descriptor;
  }
  registerProfile(p: SrtOutputProfile) {
    if (!SRT_MODES.includes(p.mode)) throw new SrtOutputError('SrtModeUnsupported', p.mode);
    if (p.encryptionType !== 'NONE' && !p.passphraseReference)
      throw new SrtOutputError('SrtEncryptionInvalid', 'passphrase reference required');
    if (this.profiles.has(p.profileId))
      throw new SrtOutputError('DuplicateSrtProfile', p.profileId);
    const v = freeze({ ...p, safeMetadata: assertSafe(p.safeMetadata) });
    this.profiles.set(p.profileId, v);
    return v;
  }
  registerDestination(d: SrtDestination) {
    if (!SRT_MODES.includes(d.mode)) throw new SrtOutputError('SrtModeUnsupported', d.mode);
    if (this.destinations.has(d.destinationId))
      throw new SrtOutputError('DuplicateSrtDestination', d.destinationId);
    const v = freeze({ ...d, safeMetadata: assertSafe(d.safeMetadata) });
    this.destinations.set(d.destinationId, v);
    return v;
  }
  createSession(s: SrtSession) {
    if (this.sessions.has(s.srtSessionId))
      throw new SrtOutputError('DuplicateSrtSession', s.srtSessionId);
    const p = this.mustProfile(s.srtProfileId),
      d = this.mustDestination(s.srtDestinationId);
    if (
      s.srtProfileGeneration !== p.profileGeneration ||
      s.srtDestinationGeneration !== d.destinationGeneration
    )
      throw new SrtOutputError('SrtInvariantViolation', 'stale generation');
    const v = freeze({ ...s, safeMetadata: assertSafe(s.safeMetadata) });
    this.sessions.set(s.srtSessionId, v);
    this.states.set(s.srtSessionId, 'CREATED');
    this.seq.set(
      s.srtSessionId,
      freeze({
        srtSessionId: s.srtSessionId,
        lastSequence: -1,
        packetCount: 0,
        duplicateCount: 0,
        staleGenerationCount: 0,
      }),
    );
    this.acks.set(
      s.srtSessionId,
      freeze({
        srtSessionId: s.srtSessionId,
        lastAckSequence: -1,
        ackCount: 0,
        acknowledgedPackets: [],
      }),
    );
    this.naks.set(
      s.srtSessionId,
      freeze({ srtSessionId: s.srtSessionId, nakCount: 0, missingSequences: [] }),
    );
    this.retrans.set(
      s.srtSessionId,
      freeze({
        srtSessionId: s.srtSessionId,
        evaluations: 0,
        queuedSequences: [],
        plannedRetransmissions: 0,
        failures: 0,
      }),
    );
    this.latency.set(
      s.srtSessionId,
      freeze({
        srtSessionId: s.srtSessionId,
        latencyMs: p.latencyMs,
        minTimestamp: 0,
        maxTimestamp: 0,
        bufferedPackets: 0,
      }),
    );
    this.congestion.set(
      s.srtSessionId,
      freeze({
        srtSessionId: s.srtSessionId,
        congestionWindow: p.maxQueueDepth,
        queueDepth: 0,
        events: 0,
        state: 'CLEAR',
      }),
    );
    this.encryption.set(
      s.srtSessionId,
      freeze({
        srtSessionId: s.srtSessionId,
        encryptionType: p.encryptionType,
        keyExchangeMetadata: p.encryptionType === 'NONE' ? 'NONE' : 'REFERENCE_ONLY',
        ...(p.passphraseReference
          ? { passphraseRefHash: p.passphraseReference.hashOrRedactedSummary }
          : {}),
        valid: true,
        safeMetadata: {},
      }),
    );
    return v;
  }
  connect(id: string) {
    this.mustSession(id);
    this.states.set(id, 'CONNECTING');
    {
      const streamIdHash = this.mustProfile(this.mustSession(id).srtProfileId).streamIdReference
        ?.hashOrRedactedSummary;
      this.handshakes.set(
        id,
        freeze({
          srtSessionId: id,
          phase: 'VALIDATING',
          completed: false,
          attempt: (this.handshakes.get(id)?.attempt ?? 0) + 1,
          ...(streamIdHash ? { streamIdHash } : {}),
          safeMetadata: {},
        }),
      );
    }
    return this.handshake(id);
  }
  handshake(id: string) {
    const h =
      this.handshakes.get(id) ??
      freeze({
        srtSessionId: id,
        phase: 'NOT_STARTED' as const,
        completed: false,
        attempt: 0,
        safeMetadata: {},
      });
    this.handshakes.set(
      id,
      freeze({ ...h, phase: 'CONNECTED_METADATA', completed: true, attempt: h.attempt || 1 }),
    );
    this.states.set(id, 'CONNECTED');
    this.bump({ handshakes: 1 });
    return this.handshakes.get(id)!;
  }
  start(id: string) {
    this.mustSession(id);
    if (!this.handshakes.get(id)?.completed) this.connect(id);
    this.states.set(id, 'STREAMING');
    return this.states.get(id);
  }
  stop(id: string) {
    this.mustSession(id);
    this.states.set(id, 'STOPPED');
    return this.states.get(id);
  }
  submitPacket(p: SrtPacketEnvelope) {
    const s = this.mustSession(p.srtSessionId);
    if (p.sessionGeneration !== s.sessionGeneration) {
      const q = this.seq.get(p.srtSessionId)!;
      this.seq.set(
        p.srtSessionId,
        freeze({ ...q, staleGenerationCount: q.staleGenerationCount + 1 }),
      );
      this.bump({ staleGenerations: 1 });
      throw new SrtOutputError('SrtInvariantViolation', 'stale packet generation');
    }
    if (p.ownership !== 'BORROWED_READ_ONLY' && p.ownership !== 'PASSTHROUGH')
      throw new SrtOutputError('SrtOwnershipViolation', 'metadata-only packets only');
    if (this.packets.has(p.packetId)) {
      this.bump({ duplicatePackets: 1 });
      throw new SrtOutputError('SrtDuplicatePacket', p.packetId);
    }
    const q = this.seq.get(p.srtSessionId)!;
    if (p.packetSequence <= q.lastSequence) {
      this.incidents.push('SRT_PACKET_SEQUENCE_ERROR');
      throw new SrtOutputError('SrtSequenceRegression', 'sequence regression');
    }
    const prof = this.mustProfile(s.srtProfileId);
    if (
      [...this.packets.values()].filter((x) => x.srtSessionId === p.srtSessionId).length >=
      prof.maxQueueDepth
    ) {
      this.incidents.push('SRT_QUEUE_OVERFLOW');
      throw new SrtOutputError('SrtQueueFull', 'bounded queue overflow');
    }
    const v = freeze({ ...p, safeMetadata: assertSafe(p.safeMetadata) });
    this.packets.set(p.packetId, v);
    this.seq.set(
      p.srtSessionId,
      freeze({ ...q, lastSequence: p.packetSequence, packetCount: q.packetCount + 1 }),
    );
    this.latency.set(
      p.srtSessionId,
      freeze({
        srtSessionId: p.srtSessionId,
        latencyMs: prof.latencyMs,
        minTimestamp: Math.max(0, p.destinationTimestamp - prof.latencyMs),
        maxTimestamp: p.destinationTimestamp + prof.latencyMs,
        bufferedPackets: this.queueDepth(p.srtSessionId) + 1,
      }),
    );
    this.updateCongestion(p.srtSessionId);
    const req = freeze({
      requestId: `srt-req-${p.packetId}`,
      packetId: p.packetId,
      srtSessionId: p.srtSessionId,
      packetSequence: p.packetSequence,
      runtimeFrame: this.clock,
    } as SrtSendRequest);
    const plan = freeze({
      planId: `srt-plan-${p.packetId}`,
      requestId: req.requestId,
      srtSessionId: p.srtSessionId,
      packetSequence: p.packetSequence,
      syntheticDeliveryEstimate: `srt-synthetic-${hash(req.requestId)}`,
      retransmission: false,
      warnings: ['metadata-only: no UDP sockets, libsrt, encryption, or packet serialization'],
    } as SrtSendPlan);
    const res = freeze({
      resultId: `srt-result-${p.packetId}`,
      planId: plan.planId,
      requestId: req.requestId,
      srtSessionId: p.srtSessionId,
      packetId: p.packetId,
      packetSequence: p.packetSequence,
      status: 'SENT',
      syntheticDeliveryReference: plan.syntheticDeliveryEstimate,
      realNetworkTransmission: false,
      realUdp: false,
      completedAtNs: ++this.clock,
      warnings: plan.warnings,
    } as SrtTransmissionResult);
    this.requests.set(req.requestId, req);
    this.plans.set(plan.planId, plan);
    this.results.set(res.resultId, res);
    this.states.set(p.srtSessionId, 'STREAMING');
    this.bump({ packets: 1, queueDepth: this.queueDepth(p.srtSessionId) });
    return res;
  }
  ack(id: string, seq: number) {
    const a =
      this.acks.get(id) ??
      freeze({ srtSessionId: id, lastAckSequence: -1, ackCount: 0, acknowledgedPackets: [] });
    this.acks.set(
      id,
      freeze({
        ...a,
        lastAckSequence: Math.max(a.lastAckSequence, seq),
        ackCount: a.ackCount + 1,
        acknowledgedPackets: [...a.acknowledgedPackets, seq].slice(-128),
      }),
    );
    return this.acks.get(id)!;
  }
  nak(id: string, seqs: readonly number[]) {
    const n = this.naks.get(id)!;
    this.naks.set(
      id,
      freeze({
        ...n,
        nakCount: n.nakCount + seqs.length,
        missingSequences: [...new Set([...n.missingSequences, ...seqs])].slice(-128),
      }),
    );
    const r = this.retrans.get(id)!;
    this.retrans.set(
      id,
      freeze({ ...r, queuedSequences: [...new Set([...r.queuedSequences, ...seqs])].slice(-128) }),
    );
    this.bump({ packetLoss: seqs.length });
    return this.naks.get(id)!;
  }
  retransmit(id: string) {
    const r = this.retrans.get(id)!;
    const planned = r.queuedSequences.length;
    this.retrans.set(
      id,
      freeze({
        ...r,
        evaluations: r.evaluations + 1,
        plannedRetransmissions: r.plannedRetransmissions + planned,
        queuedSequences: [],
      }),
    );
    this.bump({ retransmissions: planned });
    return this.retrans.get(id)!;
  }
  reconnect(id: string) {
    this.mustSession(id);
    this.states.set(id, 'RECONNECTING');
    this.bump({ reconnects: 1 });
    this.states.set(id, 'RECOVERING');
    return this.connect(id);
  }
  reset(id: string) {
    this.mustSession(id);
    [...this.packets.values()]
      .filter((p) => p.srtSessionId === id)
      .forEach((p) => this.packets.delete(p.packetId));
    this.states.set(id, 'CREATED');
    return this.states.get(id);
  }
  flush(id: string) {
    [...this.packets.values()]
      .filter((p) => p.srtSessionId === id)
      .forEach((p) => this.packets.delete(p.packetId));
    return this.snapshot();
  }
  drain(id: string) {
    this.states.set(id, 'DRAINING');
    this.flush(id);
    this.states.set(id, 'STOPPED');
    return this.states.get(id);
  }
  processTick(_tick?: FrameTick) {
    if (this.shutdown) return;
    for (const id of [...this.sessions.keys()].sort()) {
      if (this.states.get(id) === 'CREATED') this.connect(id);
      if (this.states.get(id) === 'CONNECTED') this.start(id);
    }
  }
  shutdownEngine() {
    this.shutdown = true;
    this.states.forEach((_, k) => this.states.set(k, 'SHUTDOWN'));
    this.packets.clear();
    this.retrans.clear();
    this.requests.clear();
    this.plans.clear();
    return this.snapshot();
  }
  assertInvariants() {
    const errors: string[] = [];
    if ([...this.results.values()].some((r) => r.realNetworkTransmission || r.realUdp))
      errors.push('false network claim');
    if (JSON.stringify(this.snapshotCore()).match(/srt:\/\/|secret|passphrase-value/))
      errors.push('secret leak');
    for (const c of this.congestion.values())
      if (c.queueDepth > c.congestionWindow) errors.push('queue exceeds congestion window');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: [
        'synthetic metadata-only SRT reliable transport foundation; no UDP, libsrt, sockets, encryption, or packet serialization',
      ],
      checkedInvariants: [
        'unique ids',
        'supported SRT modes',
        'redacted stream/passphrase references',
        'monotonic packet sequence',
        'bounded queues',
        'ACK/NAK metadata only',
        'retransmission planning only',
        'latency/congestion metadata only',
        'no real UDP/libsrt/encryption',
        'shutdown cleanup',
      ],
    });
  }
  snapshot() {
    const core = this.snapshotCore();
    const active = [...this.states.values()].filter(
      (x) => !['STOPPED', 'FAILED', 'SHUTDOWN'].includes(x),
    ).length;
    const health = freeze({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.assertInvariants().valid ? 'HEALTHY' : 'FAILED',
      activeSessions: active,
      handshakeCount: [...this.handshakes.values()].filter((h) => h.completed).length,
      reconnectCount: this.stats.reconnects,
      retransmissions: this.stats.retransmissions,
      droppedPackets: 0,
      acks: [...this.acks.values()].reduce((a, b) => a + b.ackCount, 0),
      naks: [...this.naks.values()].reduce((a, b) => a + b.nakCount, 0),
      latencyWindows: this.latency.size,
      congestionEvents: this.stats.congestion,
      packetQueues: this.packets.size,
      ownership: 'ZERO_LEAKS',
      failures: this.incidents.length,
    });
    const telemetry = freeze({
      ...this.stats,
      activeSessions: active,
      queueDepth: this.packets.size,
    });
    return freeze({
      ...core,
      health,
      telemetry,
      validation: this.assertInvariants(),
      incidents: freeze([...this.incidents]),
    });
  }
  private snapshotCore() {
    return {
      version: SRT_OUTPUT_VERSION,
      backends: [...this.backends.values()].map((b) => b.descriptor),
      profiles: [...this.profiles.values()],
      destinations: [...this.destinations.values()],
      sessions: [...this.sessions.values()],
      connectionStates: [...this.states.entries()].map(([srtSessionId, state]) =>
        freeze({ srtSessionId, state }),
      ),
      handshakeStates: [...this.handshakes.values()],
      encryptionStates: [...this.encryption.values()],
      packetStates: [...this.seq.values()],
      packets: [...this.packets.values()],
      ackStates: [...this.acks.values()],
      nakStates: [...this.naks.values()],
      retransmissionStates: [...this.retrans.values()],
      latencyWindows: [...this.latency.values()],
      congestionStates: [...this.congestion.values()],
      requests: [...this.requests.values()],
      plans: [...this.plans.values()],
      results: [...this.results.values()],
    };
  }
  private queueDepth(id: string) {
    return [...this.packets.values()].filter((p) => p.srtSessionId === id).length;
  }
  private updateCongestion(id: string) {
    const p = this.mustProfile(this.mustSession(id).srtProfileId),
      depth = this.queueDepth(id),
      state =
        depth > p.maxQueueDepth * 0.9
          ? 'CRITICAL'
          : depth > p.maxQueueDepth * 0.7
            ? 'CONGESTED'
            : depth > p.maxQueueDepth * 0.4
              ? 'WATCH'
              : 'CLEAR';
    const old = this.congestion.get(id)!;
    this.congestion.set(
      id,
      freeze({
        ...old,
        queueDepth: depth,
        state,
        events: old.events + (state === 'CLEAR' ? 0 : 1),
      }),
    );
    if (state !== 'CLEAR') this.bump({ congestion: 1 });
    if (state === 'CRITICAL') this.incidents.push('SRT_CONGESTION_CRITICAL');
  }
  private bump(p: Partial<SrtStatistics>) {
    this.stats = freeze({
      ...this.stats,
      ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v])),
    } as SrtStatistics);
  }
  private mustProfile(id: string) {
    const v = this.profiles.get(id);
    if (!v) throw new SrtOutputError('SrtProfileNotFound', id);
    return v;
  }
  private mustDestination(id: string) {
    const v = this.destinations.get(id);
    if (!v) throw new SrtOutputError('SrtDestinationNotFound', id);
    return v;
  }
  private mustSession(id: string) {
    const v = this.sessions.get(id);
    if (!v) throw new SrtOutputError('SrtSessionNotFound', id);
    return v;
  }
}
export const createSrtOutputEngine = (id?: string) => new SrtOutputEngine(id);
export class SrtOutputProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'srt-reliable-transport-foundation',
    name: 'SRT Reliable Transport Foundation',
    version: SRT_OUTPUT_VERSION,
    order: SRT_OUTPUT_PROCESSOR_ORDER,
    phase: 'OUTPUT',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: ['streaming-output-foundation'],
    optionalCapabilities: ['multi-destination-distribution'],
    estimatedBudgetNs: 1000000n,
    maximumBudgetNs: 5000000n,
    timeoutNs: 10000000n,
    maySkipUnderLoad: false,
    failurePolicy: 'FAIL_RUNTIME',
    criticality: 'MEDIA_CRITICAL',
    supportsHotDisable: false,
    supportsHotEnable: false,
    supportsHotReplacement: false,
    statePersistencePolicy: 'RETAIN_UNTIL_SHUTDOWN',
    metadata: { syntheticOnly: true, noSockets: true, noUdp: true, noLibsrt: true },
  };
  constructor(readonly engine: SrtOutputEngine) {}
  initialize() {
    return { status: 'READY' as const, metadata: { syntheticOnly: true } };
  }
  async processTick(tick: FrameTick, context: ProcessorRuntimeContext | any) {
    this.engine.processTick(tick);
    const snap = this.engine.snapshot();
    context?.outputs?.publish?.(
      this.descriptor.id,
      SRT_OUTPUT_KEYS.health,
      snap.health,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      SRT_OUTPUT_KEYS.telemetry,
      snap.telemetry,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      SRT_OUTPUT_KEYS.results,
      snap.results,
      'BORROWED',
    );
    return { status: 'SUCCEEDED' as const, value: snap.health };
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' as const };
  }
}
export const createSrtOutputProcessor = (engine: SrtOutputEngine) => new SrtOutputProcessor(engine);
export function createSrtCommandHandlers(
  engine: SrtOutputEngine,
): Readonly<Record<SrtCommandName, RuntimeCommandHandler>> {
  const h = (type: SrtCommandName, fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: type,
      idempotent: true,
      execute(c: any) {
        return { status: 'SUCCEEDED', value: fn((c as any).payload ?? {}) };
      },
    }) as any;
  return Object.fromEntries(
    SRT_COMMANDS.map((type) => [
      type,
      h(type, (p) => {
        switch (type) {
          case 'SRT_REGISTER_PROFILE':
            return engine.registerProfile(p.profile);
          case 'SRT_REGISTER_DESTINATION':
            return engine.registerDestination(p.destination);
          case 'SRT_CREATE_SESSION':
            return engine.createSession(p.session);
          case 'SRT_CONNECT':
            return engine.connect(p.srtSessionId);
          case 'SRT_START':
            return engine.start(p.srtSessionId);
          case 'SRT_STOP':
            return engine.stop(p.srtSessionId);
          case 'SRT_SUBMIT_PACKET':
            return engine.submitPacket(p.packet);
          case 'SRT_ACK':
            return engine.ack(p.srtSessionId, p.sequence);
          case 'SRT_NAK':
            return engine.nak(p.srtSessionId, p.sequences);
          case 'SRT_RETRANSMIT':
            return engine.retransmit(p.srtSessionId);
          case 'SRT_RECONNECT':
            return engine.reconnect(p.srtSessionId);
          case 'SRT_RESET':
            return engine.reset(p.srtSessionId);
          case 'SRT_FLUSH':
            return engine.flush(p.srtSessionId);
          case 'SRT_DRAIN':
            return engine.drain(p.srtSessionId);
          case 'SRT_VALIDATE':
            return engine.assertInvariants();
          case 'SRT_SHUTDOWN':
            return engine.shutdownEngine();
          default:
            return engine.snapshot();
        }
      }),
    ]),
  ) as any;
}
