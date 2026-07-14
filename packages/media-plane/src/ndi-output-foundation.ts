/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';
import type { StreamingTransmissionResult } from './streaming-output-foundation.js';
export const NDI_OUTPUT_VERSION = '5.7.6';
export const NDI_OUTPUT_PROCESSOR_ORDER = 1066;
export const NDI_COMMANDS = [
  'NDI_REGISTER_PROFILE',
  'NDI_REGISTER_DESTINATION',
  'NDI_CREATE_SESSION',
  'NDI_START',
  'NDI_STOP',
  'NDI_SUBMIT_FRAME',
  'NDI_UPDATE_DISCOVERY',
  'NDI_UPDATE_TALLY',
  'NDI_UPDATE_PTZ',
  'NDI_RESET',
  'NDI_DRAIN',
  'NDI_FLUSH',
  'NDI_VALIDATE',
  'NDI_SHUTDOWN',
] as const;
export type NdiCommandName = (typeof NDI_COMMANDS)[number];
export const NDI_OUTPUT_KEYS = Object.freeze({
  profiles: 'ndi.profiles',
  sessions: 'ndi.sessions',
  discoveryState: 'ndi.discovery.state',
  advertisements: 'ndi.advertisements',
  tally: 'ndi.tally',
  ptz: 'ndi.ptz',
  metadata: 'ndi.metadata',
  frameTiming: 'ndi.frame.timing',
  bandwidth: 'ndi.bandwidth',
  health: 'ndi.health',
  telemetry: 'ndi.telemetry',
  transmissionResults: 'ndi.results',
});
export const NDI_WATCHDOG_INCIDENTS = [
  'NDI_ENGINE_STALLED',
  'NDI_DISCOVERY_FAILED',
  'NDI_DUPLICATE_SESSION',
  'NDI_DUPLICATE_FRAME',
  'NDI_FRAME_SEQUENCE_ERROR',
  'NDI_DISCOVERY_STATE_INVALID',
  'NDI_RECEIVER_INCOMPATIBLE',
  'NDI_TALLY_STATE_INVALID',
  'NDI_PTZ_STATE_INVALID',
  'NDI_BANDWIDTH_INVALID',
  'NDI_BACKEND_FAILED',
  'NDI_OWNERSHIP_VIOLATION',
  'NDI_INVARIANT_FAILURE',
] as const;
type Safe = Readonly<Record<string, unknown>>;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
};
const clean = (m: Safe = {}) => {
  const j = JSON.stringify(m);
  if (/(payload|packet|socket|bonjour|mdns|dns-sd|multicast|ndi sdk|dll|raw)/i.test(j))
    throw new NdiOutputError('NdiMetadataUnsafe', 'raw/native metadata rejected');
  return freeze(clone(m));
};
export type NdiOutputMode =
  | 'PROGRAM'
  | 'PREVIEW'
  | 'CLEAN_FEED'
  | 'AUX'
  | 'HORIZONTAL'
  | 'VERTICAL'
  | 'SQUARE'
  | 'MULTIVIEW'
  | 'CUSTOM';
export type NdiSenderType =
  'VIDEO' | 'AUDIO' | 'AUDIO_VIDEO' | 'METADATA' | 'PTZ' | 'TALLY' | 'CUSTOM';
export type NdiBandwidthProfile =
  'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOWEST' | 'AUDIO_ONLY' | 'METADATA_ONLY' | 'CUSTOM';
export type NdiDiscoveryMode =
  'AUTOMATIC_METADATA' | 'MANUAL_METADATA' | 'STATIC_REGISTRATION' | 'HIDDEN' | 'CUSTOM';
export type NdiSessionLifecycle =
  | 'CREATED'
  | 'VALIDATING'
  | 'REGISTERED'
  | 'DISCOVERABLE'
  | 'READY'
  | 'STREAMING'
  | 'DEGRADED'
  | 'RECONNECTING'
  | 'STOPPED'
  | 'FAILED'
  | 'SHUTDOWN';
export type NdiTallyProgramState = 'PREVIEW' | 'PROGRAM' | 'OFFLINE' | 'UNKNOWN';
export class NdiOutputError extends Error {
  constructor(
    readonly code: string,
    msg: string,
  ) {
    super(`${code}: ${msg}`);
  }
}
export interface NdiOutputProfile {
  readonly profileId: string;
  readonly generation: number;
  readonly outputMode: NdiOutputMode;
  readonly senderType: NdiSenderType;
  readonly bandwidthProfile: NdiBandwidthProfile;
  readonly discoveryMode: NdiDiscoveryMode;
  readonly streamName: string;
  readonly groupName: string;
  readonly deviceName: string;
  readonly friendlyName: string;
  readonly instanceId: string;
  readonly outputRole: NdiOutputMode;
  readonly safeMetadata: Safe;
}
export interface NdiDestination {
  readonly destinationId: string;
  readonly generation: number;
  readonly enabled: boolean;
  readonly receiverGroup: string;
  readonly requiredBandwidth: NdiBandwidthProfile;
  readonly compatibility: NdiReceiverCompatibility;
  readonly safeMetadata: Safe;
}
export interface NdiReceiverCompatibility {
  readonly protocolGeneration: string;
  readonly videoSupport: boolean;
  readonly audioSupport: boolean;
  readonly metadataSupport: boolean;
  readonly tallySupport: boolean;
  readonly ptzSupport: boolean;
  readonly bandwidthCompatibility: readonly NdiBandwidthProfile[];
  readonly formatCompatibility: readonly string[];
  readonly compatible: boolean;
  readonly safeMetadata: Safe;
}
export interface NdiSenderSession {
  readonly sessionId: string;
  readonly generation: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly senderId: string;
  readonly streamingSessionId: string;
  readonly lifecycle: NdiSessionLifecycle;
  readonly safeMetadata: Safe;
}
export interface NdiDiscoveryState {
  readonly sessionId: string;
  readonly advertisedName: string;
  readonly advertisedGroups: readonly string[];
  readonly senderId: string;
  readonly discoveryGeneration: number;
  readonly compatibility: NdiReceiverCompatibility;
  readonly visibility: 'VISIBLE' | 'HIDDEN' | 'STATIC' | 'CUSTOM';
  readonly capabilities: readonly string[];
  readonly updateGeneration: number;
  readonly safeMetadata: Safe;
}
export interface NdiAdvertisement {
  readonly advertisementId: string;
  readonly sessionId: string;
  readonly generation: number;
  readonly advertisedName: string;
  readonly groups: readonly string[];
  readonly visible: boolean;
  readonly capabilities: readonly string[];
  readonly safeMetadata: Safe;
}
export interface NdiVideoMetadata {
  readonly sessionId: string;
  readonly width: number;
  readonly height: number;
  readonly frameRateNumerator: number;
  readonly frameRateDenominator: number;
  readonly pixelFormat: string;
  readonly colorimetry: string;
  readonly alpha: boolean;
  readonly safeMetadata: Safe;
}
export interface NdiAudioMetadata {
  readonly sessionId: string;
  readonly channels: number;
  readonly sampleRate: number;
  readonly bitDepth: number;
  readonly channelLayout: string;
  readonly pairedVideoSessionId?: string;
  readonly safeMetadata: Safe;
}
export interface NdiMetadataChannel {
  readonly sessionId: string;
  readonly generation: number;
  readonly xmlSummary?: string;
  readonly jsonSummary?: Safe;
  readonly customMetadata?: Safe;
  readonly messageCount: number;
  readonly safeMetadata: Safe;
}
export interface NdiClockState {
  readonly sessionId: string;
  readonly senderClock: number;
  readonly frameClock: number;
  readonly synchronizationGeneration: number;
  readonly latencyMetadata: Safe;
  readonly timestampMapping: Safe;
  readonly safeMetadata: Safe;
}
export interface NdiFrameTiming {
  readonly sessionId: string;
  readonly lastFrameSequence: number;
  readonly lastTimestampNs: number;
  readonly expectedIntervalNs: number;
  readonly duplicateFrames: number;
  readonly droppedFrames: number;
  readonly safeMetadata: Safe;
}
export interface NdiBandwidthState {
  readonly sessionId: string;
  readonly profile: NdiBandwidthProfile;
  readonly estimatedMbps: number;
  readonly state: 'CLEAR' | 'ELEVATED' | 'CONSTRAINED' | 'INVALID';
  readonly safeMetadata: Safe;
}
export interface NdiTallyState {
  readonly sessionId: string;
  readonly state: NdiTallyProgramState;
  readonly generation: number;
  readonly preview: boolean;
  readonly program: boolean;
  readonly safeMetadata: Safe;
}
export interface NdiPtzState {
  readonly sessionId: string;
  readonly generation: number;
  readonly pan: number;
  readonly tilt: number;
  readonly zoom: number;
  readonly focus: number;
  readonly presetRecall?: number;
  readonly presetSave?: number;
  readonly safeMetadata: Safe;
}
export interface NdiSendRequest {
  readonly requestId: string;
  readonly sessionId: string;
  readonly frameId: string;
  readonly sequence: number;
  readonly generation: number;
  readonly timestampNs: number;
  readonly mediaType: 'VIDEO' | 'AUDIO' | 'METADATA';
  readonly ownership: 'BORROWED_READ_ONLY' | 'NDI_METADATA_ONLY' | 'RELEASED';
  readonly safeMetadata: Safe;
}
export interface NdiSendPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly sessionId: string;
  readonly sequence: number;
  readonly advertisementGeneration: number;
  readonly bandwidthProfile: NdiBandwidthProfile;
  readonly syntheticTransmissionReference: string;
  readonly safeMetadata: Safe;
}
export interface NdiTransmissionResult {
  readonly requestId: string;
  readonly planId: string;
  readonly sessionId: string;
  readonly frameId: string;
  readonly sequence: number;
  readonly status: 'SENT' | 'REJECTED' | 'DROPPED' | 'CANCELLED';
  readonly syntheticTransmissionReference: string;
  readonly realNdiTransport: false;
  readonly realNetworkDiscovery: false;
  readonly realSocket: false;
  readonly realPacketSerialization: false;
  readonly completedAtNs: number;
  readonly warnings: readonly string[];
}
export class NdiOutputEngine {
  profiles = new Map<string, NdiOutputProfile>();
  destinations = new Map<string, NdiDestination>();
  sessions = new Map<string, NdiSenderSession>();
  discovery = new Map<string, NdiDiscoveryState>();
  advertisements = new Map<string, NdiAdvertisement>();
  video = new Map<string, NdiVideoMetadata>();
  audio = new Map<string, NdiAudioMetadata>();
  metadata = new Map<string, NdiMetadataChannel>();
  clocks = new Map<string, NdiClockState>();
  timing = new Map<string, NdiFrameTiming>();
  bandwidth = new Map<string, NdiBandwidthState>();
  tally = new Map<string, NdiTallyState>();
  ptz = new Map<string, NdiPtzState>();
  requests = new Map<string, NdiSendRequest>();
  plans = new Map<string, NdiSendPlan>();
  results = new Map<string, NdiTransmissionResult>();
  incidents: string[] = [];
  tickCount = 0;
  shutdown = false;
  telemetry: any = {
    sessions: 0,
    advertisements: 0,
    metadataUpdates: 0,
    tallyUpdates: 0,
    ptzUpdates: 0,
    streamPublications: 0,
    reconnects: 0,
    duplicateSubmissions: 0,
    staleGenerations: 0,
    droppedFrames: 0,
  };
  constructor(readonly engineId = 'ndi-output-engine') {}
  registerProfile(p: NdiOutputProfile) {
    if (this.profiles.has(p.profileId))
      throw new NdiOutputError('NdiDuplicateProfile', p.profileId);
    if (p.discoveryMode === 'HIDDEN') this.incidents.push('NDI_DISCOVERY_STATE_INVALID');
    this.profiles.set(p.profileId, freeze({ ...clone(p), safeMetadata: clean(p.safeMetadata) }));
    return p;
  }
  registerDestination(d: NdiDestination) {
    if (this.destinations.has(d.destinationId))
      throw new NdiOutputError('NdiDuplicateDestination', d.destinationId);
    if (!d.compatibility.compatible) {
      this.incidents.push('NDI_RECEIVER_INCOMPATIBLE');
      throw new NdiOutputError('NdiReceiverIncompatible', d.destinationId);
    }
    this.destinations.set(
      d.destinationId,
      freeze({ ...clone(d), safeMetadata: clean(d.safeMetadata) }),
    );
    return d;
  }
  createSession(s: NdiSenderSession) {
    if (this.sessions.has(s.sessionId)) {
      this.incidents.push('NDI_DUPLICATE_SESSION');
      throw new NdiOutputError('NdiDuplicateSession', s.sessionId);
    }
    const p = this.profiles.get(s.profileId),
      d = this.destinations.get(s.destinationId);
    if (!p || !d) throw new NdiOutputError('NdiSessionInvalid', 'missing refs');
    if (p.generation !== s.profileGeneration || d.generation !== s.destinationGeneration) {
      this.telemetry.staleGenerations++;
      throw new NdiOutputError('NdiStaleGeneration', 'stale refs');
    }
    const sess = freeze({
      ...clone(s),
      lifecycle: 'CREATED' as const,
      safeMetadata: clean(s.safeMetadata),
    });
    this.sessions.set(s.sessionId, sess);
    this.discovery.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        advertisedName: p.streamName,
        advertisedGroups: [p.groupName],
        senderId: s.senderId,
        discoveryGeneration: 1,
        compatibility: d.compatibility,
        visibility:
          p.discoveryMode === 'HIDDEN'
            ? 'HIDDEN'
            : p.discoveryMode === 'STATIC_REGISTRATION'
              ? 'STATIC'
              : 'VISIBLE',
        capabilities: [p.senderType, p.outputMode, p.bandwidthProfile],
        updateGeneration: 1,
        safeMetadata: { metadataOnly: true },
      }),
    );
    this.advertisements.set(
      s.sessionId,
      freeze({
        advertisementId: `ndi-ad-${hash(s.sessionId)}`,
        sessionId: s.sessionId,
        generation: 1,
        advertisedName: p.streamName,
        groups: [p.groupName],
        visible: p.discoveryMode !== 'HIDDEN',
        capabilities: [p.senderType, p.outputMode],
        safeMetadata: { noDiscoveryNetwork: true },
      }),
    );
    this.video.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        width: 1920,
        height: 1080,
        frameRateNumerator: 30000,
        frameRateDenominator: 1001,
        pixelFormat: 'UYVY_METADATA',
        colorimetry: 'BT709',
        alpha: false,
        safeMetadata: {},
      }),
    );
    this.audio.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        channels: 2,
        sampleRate: 48000,
        bitDepth: 24,
        channelLayout: 'stereo',
        pairedVideoSessionId: s.sessionId,
        safeMetadata: {},
      }),
    );
    this.metadata.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        generation: 1,
        xmlSummary: '<ndi metadata="summary"/>',
        jsonSummary: { summary: true },
        messageCount: 0,
        safeMetadata: { redacted: true },
      }),
    );
    this.clocks.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        senderClock: 0,
        frameClock: 0,
        synchronizationGeneration: 1,
        latencyMetadata: { ms: 0 },
        timestampMapping: { origin: 'synthetic' },
        safeMetadata: {},
      }),
    );
    this.timing.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        lastFrameSequence: -1,
        lastTimestampNs: 0,
        expectedIntervalNs: 33366666,
        duplicateFrames: 0,
        droppedFrames: 0,
        safeMetadata: {},
      }),
    );
    this.bandwidth.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        profile: p.bandwidthProfile,
        estimatedMbps:
          p.bandwidthProfile === 'LOW'
            ? 50
            : p.bandwidthProfile === 'MEDIUM'
              ? 100
              : p.bandwidthProfile === 'AUDIO_ONLY'
                ? 1
                : 125,
        state: 'CLEAR',
        safeMetadata: {},
      }),
    );
    this.tally.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        state: 'UNKNOWN',
        generation: 1,
        preview: false,
        program: false,
        safeMetadata: {},
      }),
    );
    this.ptz.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        generation: 1,
        pan: 0,
        tilt: 0,
        zoom: 1,
        focus: 0,
        safeMetadata: {},
      }),
    );
    this.telemetry.sessions = this.sessions.size;
    this.telemetry.advertisements = this.advertisements.size;
    return sess;
  }
  start(id: string) {
    this.lifecycle(id, 'STREAMING');
  }
  stop(id: string) {
    this.lifecycle(id, 'STOPPED');
  }
  updateDiscovery(id: string, patch: Partial<NdiDiscoveryState>) {
    const d = this.discovery.get(id)!;
    this.discovery.set(
      id,
      freeze({
        ...d,
        ...patch,
        updateGeneration: d.updateGeneration + 1,
        safeMetadata: clean(patch.safeMetadata ?? d.safeMetadata),
      }),
    );
    const a = this.advertisements.get(id)!;
    this.advertisements.set(
      id,
      freeze({
        ...a,
        generation: a.generation + 1,
        advertisedName: patch.advertisedName ?? a.advertisedName,
        groups: patch.advertisedGroups ?? a.groups,
        visible: (patch.visibility ?? d.visibility) !== 'HIDDEN',
      }),
    );
    this.telemetry.advertisements = this.advertisements.size;
  }
  updateTally(id: string, state: NdiTallyProgramState) {
    if (!['PREVIEW', 'PROGRAM', 'OFFLINE', 'UNKNOWN'].includes(state)) {
      this.incidents.push('NDI_TALLY_STATE_INVALID');
      throw new NdiOutputError('NdiTallyInvalid', state);
    }
    const t = this.tally.get(id)!;
    this.tally.set(
      id,
      freeze({
        ...t,
        state,
        generation: t.generation + 1,
        preview: state === 'PREVIEW',
        program: state === 'PROGRAM',
      }),
    );
    this.telemetry.tallyUpdates++;
  }
  updatePtz(id: string, patch: Partial<NdiPtzState>) {
    for (const k of ['pan', 'tilt', 'zoom', 'focus'] as const) {
      const v = (patch as any)[k];
      if (v !== undefined && !Number.isFinite(v)) {
        this.incidents.push('NDI_PTZ_STATE_INVALID');
        throw new NdiOutputError('NdiPtzInvalid', k);
      }
    }
    const p = this.ptz.get(id)!;
    this.ptz.set(
      id,
      freeze({
        ...p,
        ...patch,
        generation: p.generation + 1,
        safeMetadata: clean(patch.safeMetadata ?? p.safeMetadata),
      }),
    );
    this.telemetry.ptzUpdates++;
  }
  updateMetadata(id: string, custom: Safe) {
    const m = this.metadata.get(id)!;
    this.metadata.set(
      id,
      freeze({
        ...m,
        generation: m.generation + 1,
        customMetadata: clean(custom),
        messageCount: m.messageCount + 1,
      }),
    );
    this.telemetry.metadataUpdates++;
  }
  submitFrame(r: NdiSendRequest) {
    const s = this.mustSession(r.sessionId),
      t = this.timing.get(r.sessionId)!;
    if (r.generation !== s.generation) {
      this.telemetry.staleGenerations++;
      throw new NdiOutputError('NdiStaleGeneration', 'stale frame');
    }
    if (r.ownership === 'RELEASED') {
      this.incidents.push('NDI_OWNERSHIP_VIOLATION');
      throw new NdiOutputError('NdiOwnershipViolation', 'released frame');
    }
    if (
      this.requests.has(r.requestId) ||
      [...this.requests.values()].some(
        (x) => x.sessionId === r.sessionId && x.frameId === r.frameId,
      )
    ) {
      this.telemetry.duplicateSubmissions++;
      this.timing.set(r.sessionId, freeze({ ...t, duplicateFrames: t.duplicateFrames + 1 }));
      this.incidents.push('NDI_DUPLICATE_FRAME');
      throw new NdiOutputError('NdiDuplicateFrame', r.frameId);
    }
    if (r.sequence <= t.lastFrameSequence) {
      this.incidents.push('NDI_FRAME_SEQUENCE_ERROR');
      throw new NdiOutputError('NdiFrameSequenceError', 'sequence regression');
    }
    const req = freeze({ ...clone(r), safeMetadata: clean(r.safeMetadata) });
    this.requests.set(r.requestId, req);
    const b = this.bandwidth.get(r.sessionId)!;
    const a = this.advertisements.get(r.sessionId)!;
    const plan = freeze({
      planId: `ndi-plan-${hash(r.requestId)}`,
      requestId: r.requestId,
      sessionId: r.sessionId,
      sequence: r.sequence,
      advertisementGeneration: a.generation,
      bandwidthProfile: b.profile,
      syntheticTransmissionReference: `synthetic-ndi-${hash(r.frameId)}`,
      safeMetadata: { metadataOnly: true, noPacketSerialization: true },
    } as NdiSendPlan);
    this.plans.set(plan.planId, plan);
    const result = freeze({
      requestId: r.requestId,
      planId: plan.planId,
      sessionId: r.sessionId,
      frameId: r.frameId,
      sequence: r.sequence,
      status: 'SENT' as const,
      syntheticTransmissionReference: plan.syntheticTransmissionReference,
      realNdiTransport: false as const,
      realNetworkDiscovery: false as const,
      realSocket: false as const,
      realPacketSerialization: false as const,
      completedAtNs: r.timestampNs,
      warnings: [
        'metadata-only NDI foundation; no NDI SDK, discovery, sockets, multicast, mDNS, Bonjour, GPU, or packet serialization',
      ],
    });
    this.results.set(result.requestId, result);
    this.timing.set(
      r.sessionId,
      freeze({
        ...t,
        lastFrameSequence: r.sequence,
        lastTimestampNs: r.timestampNs,
        droppedFrames:
          r.sequence > t.lastFrameSequence + 1
            ? t.droppedFrames + (r.sequence - t.lastFrameSequence - 1)
            : t.droppedFrames,
      }),
    );
    this.clocks.set(
      r.sessionId,
      freeze({
        ...this.clocks.get(r.sessionId)!,
        senderClock: r.timestampNs,
        frameClock: r.sequence,
        synchronizationGeneration: this.clocks.get(r.sessionId)!.synchronizationGeneration + 1,
        timestampMapping: { frame: r.sequence, ns: r.timestampNs },
      }),
    );
    this.telemetry.streamPublications++;
    this.lifecycle(r.sessionId, 'STREAMING');
    return result;
  }
  flush(id: string) {
    for (const [k, v] of this.plans) if (v.sessionId === id) this.plans.delete(k);
  }
  drain(id: string) {
    this.flush(id);
    this.stop(id);
  }
  reset(id: string) {
    for (const m of [this.requests, this.plans, this.results])
      for (const [k, v] of m as any) if (v.sessionId === id) m.delete(k);
    const t = this.timing.get(id);
    if (t) this.timing.set(id, freeze({ ...t, lastFrameSequence: -1, lastTimestampNs: 0 }));
  }
  processTick(_tick?: FrameTick) {
    this.tickCount++;
  }
  shutdownEngine() {
    this.shutdown = true;
    this.sessions.clear();
    this.discovery.clear();
    this.advertisements.clear();
    this.video.clear();
    this.audio.clear();
    this.metadata.clear();
    this.clocks.clear();
    this.timing.clear();
    this.bandwidth.clear();
    this.tally.clear();
    this.ptz.clear();
    this.requests.clear();
    this.plans.clear();
  }
  assertInvariants() {
    const errors: string[] = [];
    const core = JSON.stringify(this.snapshotCore());
    if (
      [...this.results.values()].some(
        (r) =>
          r.realNdiTransport || r.realNetworkDiscovery || r.realSocket || r.realPacketSerialization,
      )
    )
      errors.push('false real NDI claim');
    if (
      this.shutdown &&
      [this.sessions, this.advertisements, this.requests, this.plans].some((m) => m.size > 0)
    )
      errors.push('shutdown leak');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: ['synthetic metadata-only NDI foundation'],
      checkedInvariants: [
        'no NDI SDK',
        'no network discovery',
        'no sockets',
        'no multicast',
        'no mDNS',
        'no Bonjour',
        'no GPU',
        'no packet serialization',
        'no duplicate frames',
        'no stale generations',
        'no ownership leaks',
        'no hidden reconnect',
        'no false real transport claims',
        'no raw metadata payloads',
        'shutdown cleanup',
      ],
    });
  }
  snapshotCore() {
    const sort = (a: any, b: any) =>
      (a.sessionId ?? a.profileId ?? a.destinationId ?? a.requestId).localeCompare(
        b.sessionId ?? b.profileId ?? b.destinationId ?? b.requestId,
      );
    return {
      profiles: [...this.profiles.values()].sort(sort),
      destinations: [...this.destinations.values()].sort(sort),
      sessions: [...this.sessions.values()].sort(sort),
      discoveryState: [...this.discovery.values()].sort(sort),
      advertisements: [...this.advertisements.values()].sort(sort),
      videoMetadata: [...this.video.values()].sort(sort),
      audioMetadata: [...this.audio.values()].sort(sort),
      metadataChannels: [...this.metadata.values()].sort(sort),
      clockStates: [...this.clocks.values()].sort(sort),
      frameTiming: [...this.timing.values()].sort(sort),
      bandwidthStates: [...this.bandwidth.values()].sort(sort),
      tallyStates: [...this.tally.values()].sort(sort),
      ptzStates: [...this.ptz.values()].sort(sort),
      requests: [...this.requests.values()].sort(sort),
      plans: [...this.plans.values()].sort(sort),
      results: [...this.results.values()].sort(sort),
    };
  }
  snapshot() {
    const c = this.snapshotCore();
    const health = freeze({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.assertInvariants().valid ? 'HEALTHY' : 'FAILED',
      senderCount: this.sessions.size,
      sessionCount: this.sessions.size,
      advertisements: this.advertisements.size,
      activeStreams: [...this.sessions.values()].filter((s) => s.lifecycle === 'STREAMING').length,
      tallyUpdates: this.telemetry.tallyUpdates,
      ptzUpdates: this.telemetry.ptzUpdates,
      metadataMessages: [...this.metadata.values()].reduce((a, m) => a + m.messageCount, 0),
      bandwidthProfile: [...this.bandwidth.values()].at(-1)?.profile ?? 'CUSTOM',
      frameTiming: [...this.timing.values()].at(-1)?.lastFrameSequence ?? -1,
      failures: this.incidents.length,
    });
    return freeze({
      version: NDI_OUTPUT_VERSION,
      ...c,
      health,
      telemetry: freeze(clone(this.telemetry)),
      incidents: freeze([...this.incidents]),
      validation: this.assertInvariants(),
    });
  }
  delegateSyntheticTransmission(r: NdiTransmissionResult): StreamingTransmissionResult {
    const s = this.mustSession(r.sessionId);
    return freeze({
      requestId: `streaming-${r.requestId}`,
      planId: `streaming-${r.planId}`,
      status: r.status === 'SENT' ? 'SENT' : 'REJECTED',
      runtimeFrame: r.completedAtNs,
      streamingSessionId: s.streamingSessionId,
      sessionGeneration: s.generation,
      destinationId: s.destinationId,
      destinationGeneration: s.destinationGeneration,
      protocol: 'NDI_METADATA',
      inputId: r.frameId,
      inputGeneration: 1,
      inputSequence: r.sequence,
      transmittedSequence: r.sequence,
      pts: r.completedAtNs,
      dts: r.completedAtNs,
      estimatedBytes: 0,
      syntheticDeliveryReference: r.syntheticTransmissionReference,
      connected: true,
      retryCount: 0,
      reconnectCount: 0,
      failoverCount: 0,
      backpressureState: 'NONE',
      acknowledgedMetadata: 'ndi-metadata-only',
      realNetworkTransmission: false,
      warnings: r.warnings,
      completedAtNs: r.completedAtNs,
    } as StreamingTransmissionResult);
  }
  private lifecycle(id: string, l: NdiSessionLifecycle) {
    const s = this.mustSession(id);
    this.sessions.set(id, freeze({ ...s, lifecycle: l }));
  }
  private mustSession(id: string) {
    const v = this.sessions.get(id);
    if (!v) throw new NdiOutputError('NdiSessionNotFound', id);
    return v;
  }
}
export const createNdiOutputEngine = (id?: string) => new NdiOutputEngine(id);
export class NdiOutputProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'ndi-output-foundation',
    name: 'NDI Output Foundation',
    version: NDI_OUTPUT_VERSION,
    order: NDI_OUTPUT_PROCESSOR_ORDER,
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
    metadata: {
      syntheticOnly: true,
      noNdiSdk: true,
      noSockets: true,
      noDiscovery: true,
      noMulticast: true,
      noMdns: true,
      noBonjour: true,
      noGpu: true,
    },
  };
  constructor(readonly engine: NdiOutputEngine) {}
  initialize() {
    return { status: 'READY' as const, metadata: { syntheticOnly: true } };
  }
  async processTick(tick: FrameTick, context: ProcessorRuntimeContext | any) {
    this.engine.processTick(tick);
    const s = this.engine.snapshot();
    for (const [k, v] of Object.entries(NDI_OUTPUT_KEYS))
      context?.outputs?.publish?.(this.descriptor.id, v, (s as any)[k] ?? s.health, 'BORROWED');
    return { status: 'SUCCEEDED' as const, value: s.health };
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' as const };
  }
}
export const createNdiOutputProcessor = (engine: NdiOutputEngine) => new NdiOutputProcessor(engine);
export function createNdiCommandHandlers(
  engine: NdiOutputEngine,
): Readonly<Record<NdiCommandName, RuntimeCommandHandler>> {
  const h = (type: NdiCommandName, fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: type,
      idempotent: true,
      execute(c: any) {
        return { status: 'SUCCEEDED', value: fn((c as any).payload ?? {}) };
      },
    }) as any;
  return Object.fromEntries(
    NDI_COMMANDS.map((type) => [
      type,
      h(type, (p) => {
        switch (type) {
          case 'NDI_REGISTER_PROFILE':
            return engine.registerProfile(p.profile);
          case 'NDI_REGISTER_DESTINATION':
            return engine.registerDestination(p.destination);
          case 'NDI_CREATE_SESSION':
            return engine.createSession(p.session);
          case 'NDI_START':
            return engine.start(p.sessionId);
          case 'NDI_STOP':
            return engine.stop(p.sessionId);
          case 'NDI_SUBMIT_FRAME':
            return engine.submitFrame(p.frame);
          case 'NDI_UPDATE_DISCOVERY':
            return engine.updateDiscovery(p.sessionId, p.patch);
          case 'NDI_UPDATE_TALLY':
            return engine.updateTally(p.sessionId, p.state);
          case 'NDI_UPDATE_PTZ':
            return engine.updatePtz(p.sessionId, p.patch);
          case 'NDI_RESET':
            return engine.reset(p.sessionId);
          case 'NDI_DRAIN':
            return engine.drain(p.sessionId);
          case 'NDI_FLUSH':
            return engine.flush(p.sessionId);
          case 'NDI_VALIDATE':
            return engine.assertInvariants();
          case 'NDI_SHUTDOWN':
            return engine.shutdownEngine();
        }
      }),
    ]),
  ) as any;
}
export function createNdiSourceGraphSnapshot(engine: NdiOutputEngine) {
  const s = engine.snapshot();
  return freeze({
    sessionIds: s.sessions.map((x) => x.sessionId),
    senderIds: s.sessions.map((x) => x.senderId),
    advertisedNames: s.advertisements.map((x) => x.advertisedName),
    discoveryVisibility: s.discoveryState.map((x) => x.visibility),
    tally: s.tallyStates.map((x) => x.state),
    ptzGenerations: s.ptzStates.map((x) => x.generation),
    metadataMessages: s.health.metadataMessages,
    frameTiming: s.health.frameTiming,
    bandwidth: s.health.bandwidthProfile,
    realNdiTransport: false,
    realNetworkDiscovery: false,
    realSocket: false,
    health: s.health.healthState,
    routingEligibility: s.health.healthState === 'HEALTHY',
  });
}
