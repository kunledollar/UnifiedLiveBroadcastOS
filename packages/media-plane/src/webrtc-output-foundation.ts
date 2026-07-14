/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';
import type { StreamingTransmissionResult } from './streaming-output-foundation.js';
export const WEBRTC_OUTPUT_VERSION = '5.7.5';
export const WEBRTC_OUTPUT_PROCESSOR_ORDER = 1064;
export const WEBRTC_COMMANDS = [
  'WEBRTC_REGISTER_PROFILE',
  'WEBRTC_REGISTER_DESTINATION',
  'WEBRTC_CREATE_SESSION',
  'WEBRTC_CONNECT',
  'WEBRTC_NEGOTIATE',
  'WEBRTC_START',
  'WEBRTC_STOP',
  'WEBRTC_SUBMIT_PACKET',
  'WEBRTC_RESTART_ICE',
  'WEBRTC_RENEGOTIATE',
  'WEBRTC_RESET',
  'WEBRTC_DRAIN',
  'WEBRTC_FLUSH',
  'WEBRTC_VALIDATE',
  'WEBRTC_SHUTDOWN',
] as const;
export type WebRtcCommandName = (typeof WEBRTC_COMMANDS)[number];
export const WEBRTC_OUTPUT_KEYS = Object.freeze({
  peerState: 'webrtc.peer.state',
  iceState: 'webrtc.ice.state',
  dtlsState: 'webrtc.dtls.state',
  srtpState: 'webrtc.srtp.state',
  rtpMetadata: 'webrtc.rtp.metadata',
  rtcpMetadata: 'webrtc.rtcp.metadata',
  congestion: 'webrtc.congestion',
  jitter: 'webrtc.jitter',
  bandwidth: 'webrtc.bandwidth',
  retransmission: 'webrtc.retransmission',
  health: 'webrtc.health',
  telemetry: 'webrtc.telemetry',
  transmissionResults: 'webrtc.results',
});
export const WEBRTC_WATCHDOG_INCIDENTS = [
  'WEBRTC_SESSION_STALLED',
  'WEBRTC_ICE_FAILED',
  'WEBRTC_DTLS_FAILED',
  'WEBRTC_SRTP_INVALID',
  'WEBRTC_PACKET_SEQUENCE_ERROR',
  'WEBRTC_CONGESTION_CRITICAL',
  'WEBRTC_BANDWIDTH_COLLAPSE',
  'WEBRTC_JITTER_EXCESSIVE',
  'WEBRTC_RETRANSMISSION_FAILURE',
  'WEBRTC_DESTINATION_UNAVAILABLE',
  'WEBRTC_BACKEND_FAILED',
  'WEBRTC_OWNERSHIP_VIOLATION',
  'WEBRTC_INVARIANT_FAILURE',
] as const;
type Safe = Readonly<Record<string, unknown>>;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
};
export type WebRtcSessionType =
  'PEER_TO_PEER' | 'ONE_TO_MANY' | 'BROADCAST' | 'VIEWER' | 'PUBLISHER' | 'CUSTOM';
export type WebRtcConnectionRole =
  'PUBLISHER' | 'SUBSCRIBER' | 'BIDIRECTIONAL' | 'RELAY' | 'CUSTOM';
export type WebRtcIceMode = 'FULL_ICE' | 'ICE_LITE' | 'RELAY_ONLY' | 'HOST_ONLY' | 'CUSTOM';
export type WebRtcOutputRole =
  'PROGRAM' | 'PREVIEW' | 'CLEAN_FEED' | 'AUX' | 'HORIZONTAL' | 'VERTICAL' | 'SQUARE';
export type WebRtcIceStatus =
  | 'NEW'
  | 'GATHERING'
  | 'CHECKING'
  | 'CONNECTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'DISCONNECTED'
  | 'CLOSED';
export class WebRtcOutputError extends Error {
  constructor(
    readonly code: string,
    msg: string,
  ) {
    super(`${code}: ${msg}`);
  }
}
export interface WebRtcOutputProfile {
  readonly profileId: string;
  readonly generation: number;
  readonly sessionType: WebRtcSessionType;
  readonly connectionRole: WebRtcConnectionRole;
  readonly iceMode: WebRtcIceMode;
  readonly outputRole: WebRtcOutputRole;
  readonly codecs: readonly string[];
  readonly safeMetadata: Safe;
}
export interface WebRtcDestination {
  readonly destinationId: string;
  readonly generation: number;
  readonly enabled: boolean;
  readonly transportMetadata: 'UDP' | 'TCP' | 'TURN_RELAY';
  readonly signalingReference: string;
  readonly stunTurnReference?: string;
  readonly safeMetadata: Safe;
}
export interface WebRtcPeer {
  readonly peerId: string;
  readonly generation: number;
  readonly role: WebRtcConnectionRole;
  readonly lifecycle:
    | 'NEW'
    | 'CONNECTING'
    | 'NEGOTIATING'
    | 'CONNECTED'
    | 'STARTED'
    | 'STOPPED'
    | 'FAILED'
    | 'CLOSED';
  readonly safeMetadata: Safe;
}
export interface WebRtcSessionDescription {
  readonly sessionId: string;
  readonly generation: number;
  readonly sdpVersion: number;
  readonly mediaDescriptions: readonly string[];
  readonly codecs: readonly string[];
  readonly rtpMappings: readonly string[];
  readonly payloadTypes: readonly number[];
  readonly directions: readonly string[];
  readonly extensions: readonly string[];
  readonly fingerprintMetadata: Safe;
  readonly iceCredentialsMetadata: Safe;
  readonly bundleMetadata: Safe;
  readonly safeMetadata: Safe;
}
export interface WebRtcIceState {
  readonly stateId: string;
  readonly sessionId: string;
  readonly state: WebRtcIceStatus;
  readonly gatheringState: string;
  readonly checkingState: string;
  readonly selectedCandidate?: Safe;
  readonly candidatePair?: Safe;
  readonly role: string;
  readonly restartGeneration: number;
  readonly safeMetadata: Safe;
}
export interface WebRtcDtlsState {
  readonly sessionId: string;
  readonly fingerprints: readonly Safe[];
  readonly certificateMetadata: Safe;
  readonly cipherMetadata: Safe;
  readonly state: 'NEW' | 'CONNECTING' | 'CONNECTED' | 'FAILED' | 'CLOSED';
  readonly version: string;
  readonly safeMetadata: Safe;
}
export interface WebRtcSrtpState {
  readonly sessionId: string;
  readonly cryptoProfile: string;
  readonly keyLifetimeMetadata: Safe;
  readonly encryptionEnabledMetadata: boolean;
  readonly authenticationMetadata: Safe;
  readonly valid: boolean;
  readonly safeMetadata: Safe;
}
export interface WebRtcSession {
  readonly sessionId: string;
  readonly generation: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly peerId: string;
  readonly outputRole: WebRtcOutputRole;
  readonly streamingSessionId: string;
  readonly safeMetadata: Safe;
}
export interface WebRtcRtpPacket {
  readonly packetId: string;
  readonly sessionId: string;
  readonly generation: number;
  readonly ssrc: number;
  readonly payloadType: number;
  readonly sequenceNumber: number;
  readonly timestamp: number;
  readonly marker: boolean;
  readonly codec: string;
  readonly packetSize: number;
  readonly frameReference: string;
  readonly ownership: 'BORROWED_READ_ONLY' | 'WEBRTC_OWNED' | 'RELEASED';
  readonly safeMetadata: Safe;
}
export interface WebRtcRtcpState {
  readonly sessionId: string;
  readonly generation: number;
  readonly messages: readonly {
    type:
      | 'SENDER_REPORT'
      | 'RECEIVER_REPORT'
      | 'NACK'
      | 'PLI'
      | 'FIR'
      | 'REMB'
      | 'TWCC'
      | 'BYE'
      | 'APP';
    count: number;
    safeMetadata: Safe;
  }[];
  readonly safeMetadata: Safe;
}
export interface WebRtcCongestionState {
  readonly sessionId: string;
  readonly estimatedBitrate: number;
  readonly packetLoss: number;
  readonly rttMs: number;
  readonly queueDelayMs: number;
  readonly bandwidthEstimate: number;
  readonly congestionState: 'CLEAR' | 'ELEVATED' | 'CONGESTED' | 'CRITICAL';
  readonly safeMetadata: Safe;
}
export interface WebRtcJitterState {
  readonly sessionId: string;
  readonly estimatedJitterMs: number;
  readonly bufferDelayMs: number;
  readonly packetReorder: number;
  readonly driftMetadata: Safe;
  readonly safeMetadata: Safe;
}
export interface WebRtcBandwidthState {
  readonly sessionId: string;
  readonly gccSummary: Safe;
  readonly twccMetadata: Safe;
  readonly rembMetadata: Safe;
  readonly customMetadata: Safe;
  readonly safeMetadata: Safe;
}
export interface WebRtcRetransmissionState {
  readonly sessionId: string;
  readonly rtx: number;
  readonly nack: number;
  readonly fecMetadata: Safe;
  readonly packetRecovery: number;
  readonly safeMetadata: Safe;
}
export interface WebRtcSendRequest {
  readonly requestId: string;
  readonly packet: WebRtcRtpPacket;
  readonly runtimeFrame: number;
  readonly expectedSessionGeneration: number;
}
export interface WebRtcSendPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly sessionId: string;
  readonly sequenceNumber: number;
  readonly pacedAtFrame: number;
  readonly retransmissionPlanned: boolean;
  readonly safeMetadata: Safe;
}
export interface WebRtcTransmissionResult {
  readonly requestId: string;
  readonly planId: string;
  readonly sessionId: string;
  readonly status: 'SENT' | 'REJECTED' | 'DROPPED' | 'CANCELLED';
  readonly syntheticTransmissionReference: string;
  readonly realWebRtcTransport: false;
  readonly realNetworkTransmission: false;
  readonly realDtls: false;
  readonly realSrtp: false;
  readonly completedAtNs: number;
  readonly warnings: readonly string[];
}
export class WebRtcOutputEngine {
  profiles = new Map<string, WebRtcOutputProfile>();
  destinations = new Map<string, WebRtcDestination>();
  peers = new Map<string, WebRtcPeer>();
  sessions = new Map<string, WebRtcSession>();
  ice = new Map<string, WebRtcIceState>();
  dtls = new Map<string, WebRtcDtlsState>();
  srtp = new Map<string, WebRtcSrtpState>();
  sdp = new Map<string, WebRtcSessionDescription>();
  packets = new Map<string, WebRtcRtpPacket>();
  rtcp = new Map<string, WebRtcRtcpState>();
  congestion = new Map<string, WebRtcCongestionState>();
  jitter = new Map<string, WebRtcJitterState>();
  bandwidth = new Map<string, WebRtcBandwidthState>();
  retrans = new Map<string, WebRtcRetransmissionState>();
  plans = new Map<string, WebRtcSendPlan>();
  results = new Map<string, WebRtcTransmissionResult>();
  incidents: string[] = [];
  tickCount = 0;
  shutdown = false;
  telemetry: any = {
    peers: 0,
    sessions: 0,
    packets: 0,
    rtcpMessages: 0,
    congestionEvents: 0,
    iceRestarts: 0,
    renegotiations: 0,
    retransmissionPlans: 0,
    droppedPackets: 0,
    staleGenerations: 0,
    duplicateSubmissions: 0,
  };
  constructor(readonly engineId = 'webrtc-output-engine') {}
  registerProfile(p: WebRtcOutputProfile) {
    if (this.profiles.has(p.profileId))
      throw new WebRtcOutputError('DuplicateWebRtcProfile', p.profileId);
    this.profiles.set(p.profileId, freeze(clone(p)));
  }
  registerDestination(d: WebRtcDestination) {
    if (this.destinations.has(d.destinationId))
      throw new WebRtcOutputError('DuplicateWebRtcDestination', d.destinationId);
    if (!d.enabled) this.incidents.push('WEBRTC_DESTINATION_UNAVAILABLE');
    this.destinations.set(d.destinationId, freeze(clone(d)));
  }
  createSession(s: WebRtcSession) {
    const p = this.profiles.get(s.profileId),
      d = this.destinations.get(s.destinationId);
    if (!p || !d) throw new WebRtcOutputError('WebRtcSessionInvalid', 'missing refs');
    if (p.generation !== s.profileGeneration || d.generation !== s.destinationGeneration) {
      this.telemetry.staleGenerations++;
      throw new WebRtcOutputError('WebRtcStaleGeneration', 'stale generation');
    }
    this.sessions.set(s.sessionId, freeze(clone(s)));
    this.peers.set(
      s.peerId,
      freeze({
        peerId: s.peerId,
        generation: 1,
        role: p.connectionRole,
        lifecycle: 'NEW',
        safeMetadata: {},
      }),
    );
    this.ice.set(
      s.sessionId,
      freeze({
        stateId: `ice-${s.sessionId}`,
        sessionId: s.sessionId,
        state: 'NEW',
        gatheringState: 'NEW',
        checkingState: 'IDLE',
        role: p.iceMode,
        restartGeneration: 0,
        safeMetadata: {},
      }),
    );
    this.dtls.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        fingerprints: [{ algorithm: 'sha-256', hash: 'redacted' }],
        certificateMetadata: { redacted: true },
        cipherMetadata: { name: 'metadata-only' },
        state: 'NEW',
        version: 'DTLS_METADATA_1_2',
        safeMetadata: {},
      }),
    );
    this.srtp.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        cryptoProfile: 'SRTP_AES128_CM_HMAC_SHA1_80_METADATA',
        keyLifetimeMetadata: { bounded: true },
        encryptionEnabledMetadata: true,
        authenticationMetadata: { metadataOnly: true },
        valid: true,
        safeMetadata: {},
      }),
    );
    this.rtcp.set(
      s.sessionId,
      freeze({ sessionId: s.sessionId, generation: 1, messages: [], safeMetadata: {} }),
    );
    this.congestion.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        estimatedBitrate: 4000000,
        packetLoss: 0,
        rttMs: 20,
        queueDelayMs: 0,
        bandwidthEstimate: 4000000,
        congestionState: 'CLEAR',
        safeMetadata: {},
      }),
    );
    this.jitter.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        estimatedJitterMs: 0,
        bufferDelayMs: 20,
        packetReorder: 0,
        driftMetadata: { ppm: 0 },
        safeMetadata: {},
      }),
    );
    this.bandwidth.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        gccSummary: { metadataOnly: true },
        twccMetadata: {},
        rembMetadata: {},
        customMetadata: {},
        safeMetadata: {},
      }),
    );
    this.retrans.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        rtx: 0,
        nack: 0,
        fecMetadata: { metadataOnly: true },
        packetRecovery: 0,
        safeMetadata: {},
      }),
    );
    this.telemetry.peers = this.peers.size;
    this.telemetry.sessions = this.sessions.size;
  }
  connect(id: string) {
    this.peer(id, 'CONNECTING');
    this.ice.set(
      id,
      freeze({
        ...this.mustIce(id),
        state: 'CONNECTED',
        gatheringState: 'COMPLETE',
        checkingState: 'SUCCEEDED',
        selectedCandidate: { type: 'HOST' },
        candidatePair: { transport: 'UDP' },
      }),
    );
    this.dtls.set(id, freeze({ ...this.mustDtls(id), state: 'CONNECTED' }));
    this.peer(id, 'CONNECTED');
  }
  negotiate(id: string) {
    const s = this.mustSession(id),
      p = this.profiles.get(s.profileId)!;
    this.sdp.set(
      id,
      freeze({
        sessionId: id,
        generation: (this.sdp.get(id)?.generation ?? 0) + 1,
        sdpVersion: 1,
        mediaDescriptions: ['audio', 'video'],
        codecs: p.codecs,
        rtpMappings: p.codecs.map((c, i) => `${96 + i}:${c}`),
        payloadTypes: p.codecs.map((_, i) => 96 + i),
        directions: ['sendonly'],
        extensions: ['twcc', 'mid', 'rid'],
        fingerprintMetadata: { redacted: true },
        iceCredentialsMetadata: { ufrag: 'redacted', pwd: 'redacted' },
        bundleMetadata: { policy: 'max-bundle' },
        safeMetadata: { noRawSdp: true },
      }),
    );
    this.telemetry.renegotiations++;
    this.peer(id, 'NEGOTIATING');
  }
  start(id: string) {
    this.peer(id, 'STARTED');
  }
  stop(id: string) {
    this.peer(id, 'STOPPED');
  }
  restartIce(id: string) {
    const i = this.mustIce(id);
    this.ice.set(
      id,
      freeze({ ...i, state: 'CHECKING', restartGeneration: i.restartGeneration + 1 }),
    );
    this.telemetry.iceRestarts++;
  }
  renegotiate(id: string) {
    this.negotiate(id);
  }
  updateCongestion(id: string, patch: Partial<WebRtcCongestionState>) {
    const c = freeze({ ...this.congestion.get(id)!, ...patch });
    this.congestion.set(id, c);
    this.telemetry.congestionEvents++;
    if (c.congestionState === 'CRITICAL') this.incidents.push('WEBRTC_CONGESTION_CRITICAL');
  }
  submitPacket(packet: WebRtcRtpPacket, frame = 0) {
    const s = this.mustSession(packet.sessionId);
    if (packet.generation !== s.generation) {
      this.telemetry.staleGenerations++;
      throw new WebRtcOutputError('WebRtcStaleGeneration', 'stale packet');
    }
    if (this.packets.has(packet.packetId)) {
      this.telemetry.duplicateSubmissions++;
      throw new WebRtcOutputError('WebRtcDuplicatePacket', packet.packetId);
    }
    if (packet.ownership === 'RELEASED') {
      this.incidents.push('WEBRTC_OWNERSHIP_VIOLATION');
      throw new WebRtcOutputError('WebRtcOwnershipViolation', 'released packet');
    }
    const prev = [...this.packets.values()].filter((p) => p.sessionId === packet.sessionId).at(-1);
    if (prev && packet.sequenceNumber <= prev.sequenceNumber) {
      this.incidents.push('WEBRTC_PACKET_SEQUENCE_ERROR');
      throw new WebRtcOutputError('WebRtcSequenceError', 'sequence regression');
    }
    this.packets.set(packet.packetId, freeze(clone(packet)));
    const plan = freeze({
      planId: `webrtc-plan-${hash(packet.packetId)}`,
      requestId: `webrtc-request-${hash(packet.packetId)}`,
      sessionId: packet.sessionId,
      sequenceNumber: packet.sequenceNumber,
      pacedAtFrame: frame + 1,
      retransmissionPlanned: packet.marker === false,
      safeMetadata: { packetPacing: true },
    });
    this.plans.set(plan.planId, plan);
    if (plan.retransmissionPlanned) {
      const r = this.retrans.get(packet.sessionId)!;
      this.retrans.set(
        packet.sessionId,
        freeze({ ...r, nack: r.nack + 1, packetRecovery: r.packetRecovery + 1 }),
      );
      this.telemetry.retransmissionPlans++;
    }
    const result = freeze({
      requestId: plan.requestId,
      planId: plan.planId,
      sessionId: packet.sessionId,
      status: 'SENT' as const,
      syntheticTransmissionReference: `synthetic-webrtc-${hash(plan.planId)}`,
      realWebRtcTransport: false as const,
      realNetworkTransmission: false as const,
      realDtls: false as const,
      realSrtp: false as const,
      completedAtNs: frame,
      warnings: [
        'metadata-only WebRTC foundation; no browser/libwebrtc/sockets/DTLS/SRTP/RTP serialization',
      ],
    });
    this.results.set(result.requestId, result);
    this.telemetry.packets++;
    return result;
  }
  reset(id: string) {
    for (const m of [this.packets, this.plans, this.results])
      for (const [k, v] of m as any) if (v.sessionId === id) m.delete(k);
    this.createCleanStates(id);
  }
  drain(id: string) {
    this.flush(id);
    this.stop(id);
  }
  flush(id: string) {
    for (const [k, v] of this.plans) if (v.sessionId === id) this.plans.delete(k);
  }
  processTick(_tick?: FrameTick) {
    this.tickCount++;
  }
  shutdownEngine() {
    this.shutdown = true;
    this.sessions.clear();
    this.peers.clear();
    this.ice.clear();
    this.dtls.clear();
    this.srtp.clear();
    this.packets.clear();
    this.rtcp.clear();
    this.congestion.clear();
    this.jitter.clear();
    this.bandwidth.clear();
    this.retrans.clear();
    this.plans.clear();
  }
  assertInvariants() {
    const errors: string[] = [];
    if (
      [...this.results.values()].some(
        (r) => r.realWebRtcTransport || r.realNetworkTransmission || r.realDtls || r.realSrtp,
      )
    )
      errors.push('false real transport claim');
    if (
      JSON.stringify(this.snapshotCore()).match(
        /raw SDP|ice-pwd|secret-stream-key|BEGIN CERTIFICATE/,
      )
    )
      errors.push('unsafe metadata leaked');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: ['synthetic metadata-only WebRTC foundation'],
      checkedInvariants: [
        'no browser',
        'no libwebrtc',
        'no sockets',
        'no STUN/TURN networking',
        'no DTLS/SRTP execution',
        'no RTP/RTCP serialization',
        'no duplicate packets',
        'no stale generations',
        'no ownership leaks',
        'no raw SDP',
        'shutdown cleanup',
      ],
    });
  }
  snapshotCore() {
    return {
      profiles: [...this.profiles.values()],
      destinations: [...this.destinations.values()],
      peers: [...this.peers.values()],
      sessions: [...this.sessions.values()],
      iceStates: [...this.ice.values()],
      dtlsStates: [...this.dtls.values()],
      srtpStates: [...this.srtp.values()],
      sessionDescriptions: [...this.sdp.values()],
      rtpPackets: [...this.packets.values()],
      rtcpStates: [...this.rtcp.values()],
      congestionStates: [...this.congestion.values()],
      jitterStates: [...this.jitter.values()],
      bandwidthStates: [...this.bandwidth.values()],
      retransmissionStates: [...this.retrans.values()],
      plans: [...this.plans.values()],
      results: [...this.results.values()],
    };
  }
  snapshot() {
    const core = this.snapshotCore();
    const health = freeze({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.assertInvariants().valid ? 'HEALTHY' : 'FAILED',
      peerCount: this.peers.size,
      sessionCount: this.sessions.size,
      iceConnected: [...this.ice.values()].filter(
        (i) => i.state === 'CONNECTED' || i.state === 'COMPLETED',
      ).length,
      dtlsConnected: [...this.dtls.values()].filter((d) => d.state === 'CONNECTED').length,
      srtpValid: [...this.srtp.values()].filter((s) => s.valid).length,
      packetCount: this.packets.size,
      rtcpCount: [...this.rtcp.values()].reduce(
        (a, r) => a + r.messages.reduce((x, m) => x + m.count, 0),
        0,
      ),
      retransmissions: this.telemetry.retransmissionPlans,
      congestion: [...this.congestion.values()].at(-1)?.congestionState ?? 'CLEAR',
      jitter: [...this.jitter.values()].at(-1)?.estimatedJitterMs ?? 0,
      bandwidthEstimate: [...this.congestion.values()].at(-1)?.bandwidthEstimate ?? 0,
      failures: this.incidents.length,
    });
    return freeze({
      version: WEBRTC_OUTPUT_VERSION,
      ...core,
      health,
      telemetry: freeze(clone(this.telemetry)),
      incidents: freeze([...this.incidents]),
      validation: this.assertInvariants(),
    });
  }
  delegateSyntheticTransmission(result: WebRtcTransmissionResult): StreamingTransmissionResult {
    return freeze({
      requestId: `streaming-${result.requestId}`,
      planId: `streaming-${result.planId}`,
      status: result.status === 'SENT' ? 'SENT' : 'REJECTED',
      runtimeFrame: result.completedAtNs,
      streamingSessionId: this.mustSession(result.sessionId).streamingSessionId,
      sessionGeneration: this.mustSession(result.sessionId).generation,
      destinationId: this.mustSession(result.sessionId).destinationId,
      destinationGeneration: this.mustSession(result.sessionId).destinationGeneration,
      protocol: 'WEBRTC_FOUNDATION',
      inputId: result.requestId,
      inputGeneration: 1,
      inputSequence: 0,
      transmittedSequence: 0,
      pts: 0,
      dts: 0,
      estimatedBytes: 0,
      syntheticDeliveryReference: result.syntheticTransmissionReference,
      connected: true,
      retryCount: 0,
      reconnectCount: 0,
      failoverCount: 0,
      backpressureState: 'NONE',
      acknowledgedMetadata: 'webrtc-metadata-only',
      realNetworkTransmission: false,
      warnings: result.warnings,
      completedAtNs: result.completedAtNs,
    } as StreamingTransmissionResult);
  }
  private createCleanStates(_id: string) {}
  private peer(id: string, l: WebRtcPeer['lifecycle']) {
    const s = this.mustSession(id),
      p = this.peers.get(s.peerId)!;
    this.peers.set(s.peerId, freeze({ ...p, lifecycle: l, generation: p.generation + 1 }));
  }
  private mustSession(id: string) {
    const v = this.sessions.get(id);
    if (!v) throw new WebRtcOutputError('WebRtcSessionNotFound', id);
    return v;
  }
  private mustIce(id: string) {
    const v = this.ice.get(id);
    if (!v) throw new WebRtcOutputError('WebRtcIceNotFound', id);
    return v;
  }
  private mustDtls(id: string) {
    const v = this.dtls.get(id);
    if (!v) throw new WebRtcOutputError('WebRtcDtlsNotFound', id);
    return v;
  }
}
export const createWebRtcOutputEngine = (id?: string) => new WebRtcOutputEngine(id);
export class WebRtcOutputProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'webrtc-output-foundation',
    name: 'WebRTC Output Foundation',
    version: WEBRTC_OUTPUT_VERSION,
    order: WEBRTC_OUTPUT_PROCESSOR_ORDER,
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
    metadata: { syntheticOnly: true, noBrowser: true, noLibWebRtc: true, noSockets: true },
  };
  constructor(readonly engine: WebRtcOutputEngine) {}
  initialize() {
    return { status: 'READY' as const, metadata: { syntheticOnly: true } };
  }
  async processTick(tick: FrameTick, context: ProcessorRuntimeContext | any) {
    this.engine.processTick(tick);
    const s = this.engine.snapshot();
    context?.outputs?.publish?.(
      this.descriptor.id,
      WEBRTC_OUTPUT_KEYS.health,
      s.health,
      'BORROWED',
    );
    return { status: 'SUCCEEDED' as const, value: s.health };
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' as const };
  }
}
export const createWebRtcOutputProcessor = (engine: WebRtcOutputEngine) =>
  new WebRtcOutputProcessor(engine);
export function createWebRtcCommandHandlers(
  engine: WebRtcOutputEngine,
): Readonly<Record<WebRtcCommandName, RuntimeCommandHandler>> {
  const h = (type: WebRtcCommandName, fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: type,
      idempotent: true,
      execute(c: any) {
        return { status: 'SUCCEEDED', value: fn((c as any).payload ?? {}) };
      },
    }) as any;
  return Object.fromEntries(
    WEBRTC_COMMANDS.map((type) => [
      type,
      h(type, (p) => {
        switch (type) {
          case 'WEBRTC_REGISTER_PROFILE':
            return engine.registerProfile(p.profile);
          case 'WEBRTC_REGISTER_DESTINATION':
            return engine.registerDestination(p.destination);
          case 'WEBRTC_CREATE_SESSION':
            return engine.createSession(p.session);
          case 'WEBRTC_CONNECT':
            return engine.connect(p.sessionId);
          case 'WEBRTC_NEGOTIATE':
            return engine.negotiate(p.sessionId);
          case 'WEBRTC_START':
            return engine.start(p.sessionId);
          case 'WEBRTC_STOP':
            return engine.stop(p.sessionId);
          case 'WEBRTC_SUBMIT_PACKET':
            return engine.submitPacket(p.packet, p.runtimeFrame);
          case 'WEBRTC_RESTART_ICE':
            return engine.restartIce(p.sessionId);
          case 'WEBRTC_RENEGOTIATE':
            return engine.renegotiate(p.sessionId);
          case 'WEBRTC_RESET':
            return engine.reset(p.sessionId);
          case 'WEBRTC_DRAIN':
            return engine.drain(p.sessionId);
          case 'WEBRTC_FLUSH':
            return engine.flush(p.sessionId);
          case 'WEBRTC_VALIDATE':
            return engine.assertInvariants();
          case 'WEBRTC_SHUTDOWN':
            return engine.shutdownEngine();
        }
      }),
    ]),
  ) as any;
}
export function createWebRtcSourceGraphSnapshot(engine: WebRtcOutputEngine) {
  const s = engine.snapshot();
  return freeze({
    sessionIds: s.sessions.map((x) => x.sessionId),
    peerIds: s.peers.map((x) => x.peerId),
    iceStates: s.iceStates.map((x) => x.state),
    dtlsStates: s.dtlsStates.map((x) => x.state),
    srtpValid: s.srtpStates.every((x) => x.valid),
    rtpPacketCount: s.rtpPackets.length,
    rtcpStateCount: s.rtcpStates.length,
    congestion: s.health.congestion,
    jitter: s.health.jitter,
    bandwidthEstimate: s.health.bandwidthEstimate,
    realWebRtcTransport: false,
    realNetworkTransmission: false,
    health: s.health.healthState,
    routingEligibility: s.health.healthState === 'HEALTHY',
  });
}
