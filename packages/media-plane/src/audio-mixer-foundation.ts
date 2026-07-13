/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeCommand,
  type RuntimeCommandHandler,
  type TickProcessor,
} from './execution-engine.js';
import {
  AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS,
  type ProgramAudioRouteSnapshot,
  type PreviewAudioRouteSnapshot,
} from './audio-follow-video.js';

export const AUDIO_SAMPLE_FORMATS = [
  'PCM_F32',
  'PCM_F64',
  'PCM_S16',
  'PCM_S24_PACKED',
  'PCM_S32',
  'PCM_U8',
  'OPAQUE_SYNTHETIC',
] as const;
export type AudioSampleFormat = (typeof AUDIO_SAMPLE_FORMATS)[number];
export const AUDIO_CHANNEL_LAYOUTS = [
  'MONO',
  'STEREO',
  'DUAL_MONO',
  'QUAD',
  'SURROUND_5_1',
  'SURROUND_7_1',
  'CUSTOM',
] as const;
export type AudioChannelLayout = (typeof AUDIO_CHANNEL_LAYOUTS)[number];
export const AUDIO_PCM_OWNERSHIP_STATES = [
  'SOURCE_OWNED',
  'MIXER_OWNED',
  'BUS_OWNED',
  'OUTPUT_OWNED',
  'BORROWED_READ_ONLY',
  'RELEASED',
] as const;
export type AudioPcmOwnershipState = (typeof AUDIO_PCM_OWNERSHIP_STATES)[number];
export const AUDIO_MIXER_BUS_ROLES = [
  'PROGRAM',
  'PREVIEW',
  'AUXILIARY',
  'CLEAN_FEED',
  'MONITOR',
  'RECORD',
  'STREAM',
  'CUSTOM',
] as const;
export type AudioMixerBusRole = (typeof AUDIO_MIXER_BUS_ROLES)[number];
export const AUDIO_MIX_RESULT_STATUSES = [
  'COMPLETED',
  'DEGRADED',
  'SILENT',
  'HELD',
  'DROPPED',
  'CANCELLED',
  'FAILED',
  'REJECTED',
] as const;
export type AudioMixResultStatus = (typeof AUDIO_MIX_RESULT_STATUSES)[number];
export const AUDIO_QUEUE_OVERFLOW_POLICIES = [
  'DROP_OLDEST',
  'DROP_NEWEST',
  'REJECT_NEW',
  'FAIL_CHANNEL',
  'CUSTOM',
] as const;
export type AudioQueueOverflowPolicy = (typeof AUDIO_QUEUE_OVERFLOW_POLICIES)[number];
export const AUDIO_UNDERFLOW_POLICIES = [
  'OUTPUT_SILENCE',
  'HOLD_LAST_BLOCK_METADATA',
  'DROP_OUTPUT_BLOCK',
  'FAIL_PROGRAM_BLOCK',
  'DEGRADE_CHANNEL',
  'CUSTOM',
] as const;
export type AudioUnderflowPolicy = (typeof AUDIO_UNDERFLOW_POLICIES)[number];
export const AUDIO_MIXER_COMMAND_TYPES = [
  'AUDIO_MIXER_REGISTER_BACKEND',
  'AUDIO_MIXER_UNREGISTER_BACKEND',
  'AUDIO_MIXER_REGISTER_CHANNEL',
  'AUDIO_MIXER_UPDATE_CHANNEL',
  'AUDIO_MIXER_UNREGISTER_CHANNEL',
  'AUDIO_MIXER_REGISTER_BUS',
  'AUDIO_MIXER_UPDATE_BUS',
  'AUDIO_MIXER_UNREGISTER_BUS',
  'AUDIO_MIXER_ADD_SEND',
  'AUDIO_MIXER_UPDATE_SEND',
  'AUDIO_MIXER_REMOVE_SEND',
  'AUDIO_MIXER_SET_CHANNEL_GAIN',
  'AUDIO_MIXER_SET_CHANNEL_MUTE',
  'AUDIO_MIXER_SET_CHANNEL_SOLO',
  'AUDIO_MIXER_SET_CHANNEL_PAN',
  'AUDIO_MIXER_SET_PHASE_INVERT',
  'AUDIO_MIXER_SET_BUS_GAIN',
  'AUDIO_MIXER_SET_BUS_MUTE',
  'AUDIO_MIXER_PROCESS_BLOCK',
  'AUDIO_MIXER_CANCEL_BLOCK',
  'AUDIO_MIXER_CLEAR_PLAN_CACHE',
  'AUDIO_MIXER_VALIDATE',
  'AUDIO_MIXER_RESET',
  'AUDIO_MIXER_SHUTDOWN',
] as const;
export type AudioMixerCommandType = (typeof AUDIO_MIXER_COMMAND_TYPES)[number];
export const AUDIO_MIXER_EVENTS = [
  'AudioMixerCreated',
  'AudioMixerBackendRegistered',
  'AudioMixerBackendUnregistered',
  'AudioChannelRegistered',
  'AudioChannelUpdated',
  'AudioChannelRemoved',
  'AudioBusRegistered',
  'AudioBusUpdated',
  'AudioBusRemoved',
  'AudioSendAdded',
  'AudioSendUpdated',
  'AudioSendRemoved',
  'AudioBlockReceived',
  'AudioBlockQueued',
  'AudioBlockDropped',
  'AudioMixRequested',
  'AudioMixPlanned',
  'AudioMixStarted',
  'AudioMixCompleted',
  'AudioMixDegraded',
  'AudioMixCancelled',
  'AudioMixFailed',
  'AudioUnderflowDetected',
  'AudioOverflowDetected',
  'AudioGapDetected',
  'AudioOverlapDetected',
  'AudioDiscontinuityDetected',
  'ProgramAudioPublished',
  'PreviewAudioPublished',
  'AudioMixerHealthChanged',
  'AudioMixerShutdown',
] as const;
export const AUDIO_MIXER_WATCHDOG_INCIDENTS = [
  'AUDIO_MIXER_ENGINE_STALLED',
  'AUDIO_MIXER_BLOCK_TIMEOUT',
  'AUDIO_MIXER_DUPLICATE_REQUEST',
  'AUDIO_MIXER_DUPLICATE_BLOCK',
  'AUDIO_MIXER_CHANNEL_GENERATION_STALE',
  'AUDIO_MIXER_BUS_GENERATION_STALE',
  'AUDIO_MIXER_ROUTE_GENERATION_STALE',
  'AUDIO_MIXER_TRANSITION_GENERATION_STALE',
  'AUDIO_MIXER_SAMPLE_POSITION_REGRESSION',
  'AUDIO_MIXER_SAMPLE_GAP',
  'AUDIO_MIXER_SAMPLE_OVERLAP',
  'AUDIO_MIXER_INPUT_UNDERFLOW',
  'AUDIO_MIXER_INPUT_OVERFLOW',
  'AUDIO_MIXER_PROGRAM_UNDERFLOW',
  'AUDIO_MIXER_OUTPUT_ALIAS',
  'AUDIO_MIXER_DUPLICATE_SOURCE_CONTRIBUTION',
  'AUDIO_MIXER_BACKEND_FAILED',
  'AUDIO_MIXER_ALLOCATION_FAILED',
  'AUDIO_MIXER_OWNERSHIP_VIOLATION',
  'AUDIO_MIXER_OUTPUT_REGISTRY_MISMATCH',
  'AUDIO_MIXER_SOURCE_GRAPH_MISMATCH',
  'AUDIO_MIXER_INVARIANT_FAILURE',
] as const;
export const AUDIO_MIXER_OUTPUT_KEYS = Object.freeze({
  configuration: 'audio-mixer.configuration',
  inputChannelStates: 'audio-mixer.channels.state',
  busStates: 'audio-mixer.buses.state',
  activeMixRequest: 'audio-mixer.request.active',
  mixPlan: 'audio-mixer.plan',
  mixResult: 'audio-mixer.result',
  programAudioOutput: 'audio-mixer.output.program',
  previewAudioOutput: 'audio-mixer.output.preview',
  auxiliaryAudioOutputs: 'audio-mixer.output.auxiliary',
  cleanFeedAudioOutput: 'audio-mixer.output.clean-feed',
  monitorAudioOutput: 'audio-mixer.output.monitor',
  channelHealth: 'audio-mixer.health.channels',
  busHealth: 'audio-mixer.health.buses',
  mixerHealth: 'audio-mixer.health',
  mixerTelemetry: 'audio-mixer.telemetry',
  underflowSummary: 'audio-mixer.underflow',
  overflowSummary: 'audio-mixer.overflow',
  discontinuitySummary: 'audio-mixer.discontinuity',
  failedRejectedResults: 'audio-mixer.failed-rejected',
});
export const AUDIO_MIXER_PROCESSOR_ORDER = Object.freeze({
  transitionExecution: 500,
  audioFollowVideo: 550,
  audioMixer: 575,
  busOrchestration: 600,
  sceneCompositor: 700,
  outputPublication: 800,
});

export class AudioMixerError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(code, message, sanitize(details) as Record<string, unknown>);
  }
}
export const AUDIO_MIXER_ERRORS = [
  'AudioMixerNotReady',
  'AudioMixerBackendNotFound',
  'DuplicateAudioMixerBackend',
  'AudioMixerBackendUnsupported',
  'AudioMixerChannelNotFound',
  'DuplicateAudioMixerChannel',
  'AudioMixerChannelInvalid',
  'AudioMixerChannelGenerationMismatch',
  'AudioMixerBusNotFound',
  'DuplicateAudioMixerBus',
  'AudioMixerBusInvalid',
  'AudioMixerBusGenerationMismatch',
  'AudioMixerSendInvalid',
  'AudioMixerFormatUnsupported',
  'AudioMixerLayoutUnsupported',
  'AudioMixerBlockInvalid',
  'AudioMixerDuplicateRequest',
  'AudioMixerDuplicateBlock',
  'AudioMixerSamplePositionMismatch',
  'AudioMixerUnderflow',
  'AudioMixerOverflow',
  'AudioMixerAllocationFailed',
  'AudioMixerBackendFailed',
  'AudioMixerOwnershipViolation',
  'AudioMixerCancelled',
  'AudioMixerTimeout',
  'AudioMixerInvariantViolation',
  'AudioMixerShutdownError',
] as const;

export type Json =
  string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const SECRET =
  /token|secret|password|credential|cookie|url|endpoint|devicePath|native|handle|payload|pcm|sampleValues|private|address/i;
const sanitize = (v: unknown, d = 0): Json => {
  if (d > 5) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v as any;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => sanitize(x, d + 1));
  if (typeof v === 'object')
    return Object.freeze(
      Object.fromEntries(
        Object.entries(v as any)
          .slice(0, 64)
          .map(([k, x]) => [k, SECRET.test(k) ? '[REDACTED]' : sanitize(x, d + 1)]),
      ),
    );
  return String(v);
};
const freeze = <T>(v: T): Readonly<T> => Object.freeze(structuredClone(v));
const assertFinite = (n: number, name: string) => {
  if (!Number.isFinite(n))
    throw new AudioMixerError('AudioMixerChannelInvalid', `${name} must be finite`);
};
export const AUDIO_GAIN = Object.freeze({
  silentFloorDb: -120,
  unityLinear: 1,
  maximumLinear: 16,
  dbToLinear: (db: number) => {
    assertFinite(db, 'db');
    return db <= -120 ? 0 : 10 ** (db / 20);
  },
  linearToDb: (linear: number) => {
    assertFinite(linear, 'linear');
    if (linear < 0 || linear > 16)
      throw new AudioMixerError('AudioMixerChannelInvalid', 'gain out of range');
    return linear === 0 ? -120 : 20 * Math.log10(linear);
  },
  validate: (linear: number) => {
    assertFinite(linear, 'linear');
    if (linear < 0 || linear > 16)
      throw new AudioMixerError('AudioMixerChannelInvalid', 'gain out of range');
    return linear;
  },
});
export const validateAudioChannelLayout = (layout: AudioChannelLayout, count: number) => {
  const expected: any = {
    MONO: 1,
    STEREO: 2,
    DUAL_MONO: 2,
    QUAD: 4,
    SURROUND_5_1: 6,
    SURROUND_7_1: 8,
  };
  if (layout !== 'CUSTOM' && expected[layout] !== count)
    throw new AudioMixerError(
      'AudioMixerLayoutUnsupported',
      `layout ${layout} incompatible with ${count} channels`,
    );
  return true;
};
export const validateAudioSampleFormat = (format: AudioSampleFormat) => {
  if (!AUDIO_SAMPLE_FORMATS.includes(format))
    throw new AudioMixerError('AudioMixerFormatUnsupported', `unsupported format ${format}`);
  return true;
};

export interface AudioPcmBufferEnvelope {
  readonly bufferId: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly sourceGeneration: number;
  readonly streamGeneration: number;
  readonly sequenceNumber: number;
  readonly samplePosition: number;
  readonly sampleCount: number;
  readonly sampleRateHz: number;
  readonly channelCount: number;
  readonly channelLayout: AudioChannelLayout;
  readonly sampleFormat: AudioSampleFormat;
  readonly interleaving: 'INTERLEAVED' | 'PLANAR' | 'OPAQUE';
  readonly endianness?: 'LE' | 'BE' | 'NA';
  readonly timestampNs: string;
  readonly durationNs: string;
  readonly clockDomain: string;
  readonly discontinuity: boolean;
  readonly corrupted: boolean;
  readonly silent: boolean;
  readonly ownership: AudioPcmOwnershipState;
  readonly payloadRef: string;
  readonly backendId?: string;
  readonly generation: number;
  readonly metadata?: Readonly<Record<string, Json>>;
}
export type AudioPcmBufferSnapshot = Omit<AudioPcmBufferEnvelope, 'payloadRef'> & {
  readonly payload: '[REDACTED_OPAQUE_PAYLOAD]';
};
export interface AudioPcmBufferLease {
  readonly leaseId: string;
  readonly bufferId: string;
  readonly owner: AudioPcmOwnershipState;
  readonly generation: number;
  readonly acquiredAtFrame?: string;
  readonly acquiredAtSamplePosition: number;
  released: boolean;
  releaseReason?: string;
}
export type AudioPcmLeaseSnapshot = Readonly<
  Omit<AudioPcmBufferLease, 'released'> & { readonly released: boolean }
>;
export interface AudioMixerChannelDefinition {
  readonly channelId: string;
  readonly version: string;
  readonly generation: number;
  readonly displayName: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly sourceGeneration: number;
  readonly streamGeneration: number;
  readonly sourceRole: string;
  readonly sampleFormat: AudioSampleFormat;
  readonly sampleRateHz: number;
  readonly channelCount: number;
  readonly channelLayout: AudioChannelLayout;
  readonly inputGain: number;
  readonly faderGain: number;
  readonly pan: number;
  readonly balance: number;
  readonly mute: boolean;
  readonly solo: boolean;
  readonly soloSafe?: boolean;
  readonly phaseInvert: boolean;
  readonly enabled: boolean;
  readonly latencyCompensationSamples: number;
  readonly busSendIds: readonly string[];
  readonly monitorPolicy: 'PROGRAM' | 'PREVIEW' | 'SOLO' | 'MUTE' | 'CUSTOM';
  readonly audioFollowParticipation: boolean;
  readonly metadata?: Readonly<Record<string, Json>>;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
}
export type AudioMixerChannelDefinitionSnapshot = Readonly<AudioMixerChannelDefinition>;
export interface AudioMixerChannelState {
  readonly channelId: string;
  readonly generation: number;
  readonly active: boolean;
  readonly available: boolean;
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly currentSamplePosition?: number;
  readonly expectedSamplePosition?: number;
  readonly inputQueueDepth: number;
  readonly droppedBlockCount: number;
  readonly underflowCount: number;
  readonly discontinuityCount: number;
  readonly lastInputTimestampNs?: string;
  readonly currentContribution: number;
  readonly busParticipation: readonly string[];
  readonly health: 'healthy' | 'degraded' | 'failed' | 'muted';
  readonly metadata?: Readonly<Record<string, Json>>;
}
export type AudioMixerChannelStateSnapshot = Readonly<AudioMixerChannelState>;
export interface AudioMixerBusDefinition {
  readonly busId: string;
  readonly version: string;
  readonly generation: number;
  readonly role: AudioMixerBusRole;
  readonly displayName: string;
  readonly sampleRateHz: number;
  readonly channelCount: number;
  readonly channelLayout: AudioChannelLayout;
  readonly sampleFormat: AudioSampleFormat;
  readonly blockSize: number;
  readonly masterGain: number;
  readonly mute: boolean;
  readonly soloPolicy: 'SOLO_IN_PLACE' | 'ADDITIVE' | 'EXCLUSIVE';
  readonly latencyClass: 'LOW' | 'NORMAL' | 'HIGH' | 'CUSTOM';
  readonly routingEligibility: readonly string[];
  readonly criticality: 'CRITICAL' | 'OPTIONAL' | 'INTERNAL';
  readonly metadata?: Readonly<Record<string, Json>>;
}
export type AudioMixerBusDefinitionSnapshot = Readonly<AudioMixerBusDefinition>;
export interface AudioMixerBusState {
  readonly busId: string;
  readonly generation: number;
  readonly active: boolean;
  readonly muted: boolean;
  readonly lastOutputRef?: string;
  readonly lastSamplePosition?: number;
  readonly health: 'healthy' | 'degraded' | 'failed' | 'muted';
}
export type AudioMixerBusStateSnapshot = Readonly<AudioMixerBusState>;
export interface AudioBusSend {
  readonly sendId: string;
  readonly sourceChannelId: string;
  readonly destinationBusId: string;
  readonly destinationBusGeneration: number;
  readonly enabled: boolean;
  readonly preFader: boolean;
  readonly gain: number;
  readonly panOverride?: number;
  readonly muteOverride?: boolean;
  readonly transitionContributionParticipation: boolean;
  readonly priority: number;
  readonly metadata?: Readonly<Record<string, Json>>;
}
export type AudioBusSendSnapshot = Readonly<AudioBusSend>;
export interface AudioMixRequest {
  readonly requestId: string;
  readonly runtimeFrame: string;
  readonly blockSequence: number;
  readonly requestedSamplePosition: number;
  readonly sampleCount: number;
  readonly outputBusIds: readonly string[];
  readonly inputChannelIds: readonly string[];
  readonly expectedChannelGenerations: Readonly<Record<string, number>>;
  readonly expectedBusGenerations: Readonly<Record<string, number>>;
  readonly expectedAudioFollowRouteGeneration: number;
  readonly expectedTransitionGeneration: number;
  readonly expectedMixerConfigurationGeneration: number;
  readonly deadlineNs?: string;
  readonly cancelled?: boolean;
  readonly metadata?: Readonly<Record<string, Json>>;
}
export type AudioMixRequestSnapshot = Readonly<AudioMixRequest>;
export interface AudioMixPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly mixerGeneration: number;
  readonly inputChannelOrder: readonly string[];
  readonly outputBusOrder: readonly string[];
  readonly resolvedSends: readonly AudioBusSend[];
  readonly muteSoloResolution: Readonly<Record<string, boolean>>;
  readonly contributionValues: Readonly<Record<string, number>>;
  readonly operationOrder: readonly string[];
  readonly temporaryBufferEstimateBytes: number;
  readonly outputByteEstimate: number;
  readonly expectedSamplePosition: number;
  readonly sampleCount: number;
  readonly deterministicScore: string;
  readonly warnings: readonly string[];
  readonly metadata?: Readonly<Record<string, Json>>;
}
export type AudioMixPlanSnapshot = Readonly<AudioMixPlan>;
export interface AudioOutputReference {
  readonly outputId: string;
  readonly busId: string;
  readonly role: AudioMixerBusRole;
  readonly samplePosition: number;
  readonly sampleCount: number;
  readonly generation: number;
  readonly checksum: string;
  readonly payloadRef: string;
  readonly ownership: AudioPcmOwnershipState;
}
export interface AudioMixResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: AudioMixResultStatus;
  readonly runtimeFrame: string;
  readonly blockSequence: number;
  readonly samplePosition: number;
  readonly sampleCount: number;
  readonly programOutput?: AudioOutputReference;
  readonly previewOutput?: AudioOutputReference;
  readonly auxiliaryOutputs: readonly AudioOutputReference[];
  readonly cleanFeedOutput?: AudioOutputReference;
  readonly monitorOutput?: AudioOutputReference;
  readonly activeChannelIds: readonly string[];
  readonly mutedChannelIds: readonly string[];
  readonly soloedChannelIds: readonly string[];
  readonly droppedInputIds: readonly string[];
  readonly underflowChannelIds: readonly string[];
  readonly contributionSummaries: Readonly<Record<string, Json>>;
  readonly outputByteCount: number;
  readonly temporaryByteCount: number;
  readonly realPcmMixApplied: boolean;
  readonly warnings: readonly string[];
  readonly ownershipTransfer: readonly AudioPcmLeaseSnapshot[];
  readonly durationNs: string;
  readonly completedAtNs: string;
}
export type AudioMixResultSnapshot = Readonly<AudioMixResult>;
export interface AudioMixerBackend {
  readonly descriptor: {
    readonly backendId: string;
    readonly displayName: string;
    readonly priority: number;
    readonly generation: number;
  };
  readonly capabilities: any;
  initialize(): void;
  createPlan(engine: AudioMixerEngine, request: AudioMixRequest): AudioMixPlan;
  processBlock(
    engine: AudioMixerEngine,
    request: AudioMixRequest,
    plan: AudioMixPlan,
  ): AudioMixResult;
  reset(): void;
  shutdown(): void;
}
export type AudioMixerBackendSnapshot = Readonly<{
  backendId: string;
  displayName: string;
  priority: number;
  generation: number;
  healthy: boolean;
  capabilities: Json;
}>;
export type AudioMixerHealthSnapshot = Readonly<any>;
export type AudioMixerTelemetrySnapshot = Readonly<any>;
export type AudioMixerEngineSnapshot = Readonly<any>;
export type AudioMixerValidationReport = Readonly<{
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  snapshot: AudioMixerEngineSnapshot;
}>;

class OwnershipTracker {
  leases = new Map<string, AudioPcmBufferLease>();
  released = new Set<string>();
  acquire(buffer: AudioPcmBufferEnvelope, owner: AudioPcmOwnershipState, frame = '0') {
    if (buffer.ownership === 'RELEASED' || this.released.has(buffer.bufferId))
      throw new AudioMixerError(
        'AudioMixerOwnershipViolation',
        'released buffer cannot be acquired',
      );
    const lease = {
      leaseId: `lease:${buffer.bufferId}:${buffer.generation}:${owner}`,
      bufferId: buffer.bufferId,
      owner,
      generation: buffer.generation,
      acquiredAtFrame: frame,
      acquiredAtSamplePosition: buffer.samplePosition,
      released: false,
    };
    this.leases.set(lease.leaseId, lease);
    return lease;
  }
  release(leaseId: string, reason = 'completed') {
    const l = this.leases.get(leaseId);
    if (!l || l.released)
      throw new AudioMixerError('AudioMixerOwnershipViolation', 'double release rejected');
    l.released = true;
    l.releaseReason = reason;
    this.released.add(l.bufferId);
    return freeze(l);
  }
  active() {
    return [...this.leases.values()].filter((l) => !l.released);
  }
  shutdown() {
    for (const l of this.active()) this.release(l.leaseId, 'shutdown');
  }
}
export class AudioInputQueue {
  private q: AudioPcmBufferEnvelope[] = [];
  highWater = 0;
  dropped = 0;
  bytes = 0;
  constructor(
    readonly cfg = {
      maxBlocks: 32,
      maxSamples: 48000 * 5,
      maxDurationNs: 5_000_000_000,
      maxBytes: 8_000_000,
      overflowPolicy: 'DROP_OLDEST' as AudioQueueOverflowPolicy,
    },
  ) {}
  enqueue(b: AudioPcmBufferEnvelope, onDrop: (b: AudioPcmBufferEnvelope) => void = () => {}) {
    const est = b.sampleCount * b.channelCount * 4;
    const overflow = () =>
      this.q.length >= this.cfg.maxBlocks ||
      this.bytes + est > this.cfg.maxBytes ||
      this.q.reduce((a, x) => a + x.sampleCount, 0) + b.sampleCount > this.cfg.maxSamples;
    if (overflow()) {
      if (this.cfg.overflowPolicy === 'DROP_NEWEST') {
        this.dropped++;
        onDrop(b);
        return false;
      }
      if (this.cfg.overflowPolicy === 'REJECT_NEW') return false;
      if (this.cfg.overflowPolicy === 'FAIL_CHANNEL')
        throw new AudioMixerError('AudioMixerOverflow', 'queue overflow');
      while (overflow() && this.q.length) {
        const d = this.q.shift()!;
        this.bytes -= d.sampleCount * d.channelCount * 4;
        this.dropped++;
        onDrop(d);
      }
    }
    this.q.push(freeze(b) as AudioPcmBufferEnvelope);
    this.bytes += est;
    this.highWater = Math.max(this.highWater, this.q.length);
    return true;
  }
  dequeue() {
    const b = this.q.shift();
    if (b) this.bytes -= b.sampleCount * b.channelCount * 4;
    return b;
  }
  depth() {
    return this.q.length;
  }
  clear(onDrop: (b: AudioPcmBufferEnvelope) => void = () => {}) {
    for (const b of this.q) onDrop(b);
    this.q = [];
    this.bytes = 0;
  }
}

export class SyntheticAudioMixerBackend implements AudioMixerBackend {
  healthy = true;
  constructor(
    public readonly descriptor = {
      backendId: 'synthetic-audio-mixer',
      displayName: 'Synthetic Audio Mixer Backend',
      priority: 100,
      generation: 1,
    },
    private faults: Record<string, boolean> = {},
  ) {}
  capabilities = Object.freeze({
    supportedSampleFormats: AUDIO_SAMPLE_FORMATS,
    supportedSampleRates: [44100, 48000, 96000],
    supportedLayouts: AUDIO_CHANNEL_LAYOUTS,
    maximumChannels: 128,
    maximumBuses: 32,
    maximumBlockSize: 4096,
    realPcmProcessing: false,
    gainSupport: true,
    panSupport: true,
    muteSoloSupport: true,
    phaseInvertSupport: true,
    interleavedPlanarSupport: ['INTERLEAVED', 'PLANAR', 'OPAQUE'],
    temporaryMemoryLimitBytes: 8_000_000,
    deterministicBehavior: true,
  });
  initialize() {
    this.healthy = true;
  }
  reset() {
    this.faults = {};
  }
  shutdown() {
    this.healthy = false;
  }
  createPlan(engine: AudioMixerEngine, request: AudioMixRequest) {
    if (this.faults.timeout) throw new AudioMixerError('AudioMixerTimeout', 'simulated timeout');
    return engine.createDeterministicPlan(request);
  }
  processBlock(engine: AudioMixerEngine, request: AudioMixRequest, plan: AudioMixPlan) {
    if (this.faults.backendFailure)
      throw new AudioMixerError('AudioMixerBackendFailed', 'simulated backend failure');
    if (this.faults.allocationFailure)
      throw new AudioMixerError('AudioMixerAllocationFailed', 'simulated allocation failure');
    return engine.completeSyntheticMix(request, plan);
  }
}

export class AudioMixerEngine {
  private backends = new Map<string, AudioMixerBackend>();
  private channels = new Map<string, AudioMixerChannelDefinition>();
  private buses = new Map<string, AudioMixerBusDefinition>();
  private sends = new Map<string, AudioBusSend>();
  private queues = new Map<string, AudioInputQueue>();
  private processed = new Set<string>();
  private requests = new Set<string>();
  private programOutputs = new Set<number>();
  private generation = 1;
  private shutdownState = false;
  private ownership = new OwnershipTracker();
  private planCache = new Map<string, AudioMixPlan>();
  private events: string[] = ['AudioMixerCreated'];
  private incidents: string[] = [];
  private lastSamplePosition = -1;
  private counters: any = {
    backendRegistrations: 0,
    backendRemovals: 0,
    channelRegistrations: 0,
    channelUpdates: 0,
    channelRemovals: 0,
    busRegistrations: 0,
    busUpdates: 0,
    busRemovals: 0,
    sendAdditions: 0,
    sendUpdates: 0,
    sendRemovals: 0,
    blocksReceived: 0,
    blocksQueued: 0,
    blocksDropped: 0,
    plansCreated: 0,
    planCacheHits: 0,
    planCacheMisses: 0,
    blocksProcessed: 0,
    blocksCompleted: 0,
    blocksDegraded: 0,
    blocksSilent: 0,
    blocksFailed: 0,
    blocksCancelled: 0,
    programPublications: 0,
    previewPublications: 0,
    auxPublications: 0,
    cleanFeedPublications: 0,
    monitorPublications: 0,
    gainOperations: 0,
    panOperations: 0,
    muteSoloResolutions: 0,
    phaseInversions: 0,
    underflows: 0,
    overflows: 0,
    gaps: 0,
    overlaps: 0,
    discontinuities: 0,
    duplicateRequests: 0,
    duplicateBlocks: 0,
    staleGenerationRejects: 0,
    ownershipViolations: 0,
    outputBytes: 0,
    temporaryBytes: 0,
    maximumActiveChannels: 0,
    maximumBusesPerBlock: 0,
  };
  constructor(readonly engineId = 'audio-mixer') {}
  registerBackend(b: AudioMixerBackend) {
    this.ensureOpen();
    if (this.backends.has(b.descriptor.backendId))
      throw new AudioMixerError('DuplicateAudioMixerBackend', 'duplicate backend');
    b.initialize();
    this.backends.set(b.descriptor.backendId, b);
    this.counters.backendRegistrations++;
    this.event('AudioMixerBackendRegistered');
    this.bump();
  }
  unregisterBackend(id: string) {
    this.ensureOpen();
    const b = this.backends.get(id);
    if (!b) throw new AudioMixerError('AudioMixerBackendNotFound', 'backend not found');
    b.shutdown();
    this.backends.delete(id);
    this.counters.backendRemovals++;
    this.event('AudioMixerBackendUnregistered');
    this.bump();
  }
  activeBackend() {
    const b = [...this.backends.values()].sort(
      (a, b) =>
        b.descriptor.priority - a.descriptor.priority ||
        a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    )[0];
    if (!b) throw new AudioMixerError('AudioMixerBackendNotFound', 'no backend registered');
    return b;
  }
  registerBus(bus: AudioMixerBusDefinition) {
    this.ensureOpen();
    validateAudioSampleFormat(bus.sampleFormat);
    validateAudioChannelLayout(bus.channelLayout, bus.channelCount);
    AUDIO_GAIN.validate(bus.masterGain);
    if (this.buses.has(bus.busId))
      throw new AudioMixerError('DuplicateAudioMixerBus', 'duplicate bus');
    this.buses.set(bus.busId, freeze(bus) as any);
    this.counters.busRegistrations++;
    this.event('AudioBusRegistered');
    this.bump();
  }
  updateBus(
    busId: string,
    patch: Partial<AudioMixerBusDefinition> & { expectedGeneration: number },
  ) {
    const cur = this.buses.get(busId);
    if (!cur) throw new AudioMixerError('AudioMixerBusNotFound', 'bus not found');
    if (cur.generation !== patch.expectedGeneration) {
      this.stale('AUDIO_MIXER_BUS_GENERATION_STALE');
      throw new AudioMixerError('AudioMixerBusGenerationMismatch', 'stale bus generation');
    }
    const next = { ...cur, ...patch, generation: cur.generation + 1, updatedAtNs: undefined };
    this.registeredBusValid(next as any);
    this.buses.set(busId, freeze(next) as any);
    this.counters.busUpdates++;
    this.event('AudioBusUpdated');
    this.bump();
  }
  private registeredBusValid(bus: AudioMixerBusDefinition) {
    validateAudioSampleFormat(bus.sampleFormat);
    validateAudioChannelLayout(bus.channelLayout, bus.channelCount);
    AUDIO_GAIN.validate(bus.masterGain);
  }
  unregisterBus(id: string) {
    const b = this.buses.get(id);
    if (!b) throw new AudioMixerError('AudioMixerBusNotFound', 'bus not found');
    if (b.role === 'PROGRAM')
      throw new AudioMixerError('AudioMixerBusInvalid', 'active Program bus cannot be removed');
    this.buses.delete(id);
    this.counters.busRemovals++;
    this.event('AudioBusRemoved');
    this.bump();
  }
  registerChannel(c: AudioMixerChannelDefinition) {
    this.ensureOpen();
    validateAudioSampleFormat(c.sampleFormat);
    validateAudioChannelLayout(c.channelLayout, c.channelCount);
    [c.inputGain, c.faderGain].forEach(AUDIO_GAIN.validate);
    assertFinite(c.pan, 'pan');
    assertFinite(c.balance, 'balance');
    if (Math.abs(c.pan) > 1 || Math.abs(c.balance) > 1)
      throw new AudioMixerError('AudioMixerChannelInvalid', 'pan/balance out of range');
    if (this.channels.has(c.channelId))
      throw new AudioMixerError('DuplicateAudioMixerChannel', 'duplicate channel');
    this.channels.set(c.channelId, freeze(c) as any);
    this.queues.set(c.channelId, new AudioInputQueue());
    this.counters.channelRegistrations++;
    this.event('AudioChannelRegistered');
    this.bump();
  }
  updateChannel(
    id: string,
    patch: Partial<AudioMixerChannelDefinition> & { expectedGeneration: number },
  ) {
    const cur = this.channels.get(id);
    if (!cur) throw new AudioMixerError('AudioMixerChannelNotFound', 'channel not found');
    if (cur.generation !== patch.expectedGeneration) {
      this.stale('AUDIO_MIXER_CHANNEL_GENERATION_STALE');
      throw new AudioMixerError('AudioMixerChannelGenerationMismatch', 'stale channel generation');
    }
    const next = {
      ...cur,
      ...patch,
      generation: cur.generation + 1,
      updatedAtNs: String(BigInt(cur.updatedAtNs) + 1n),
    } as AudioMixerChannelDefinition;
    validateAudioSampleFormat(next.sampleFormat);
    validateAudioChannelLayout(next.channelLayout, next.channelCount);
    [next.inputGain, next.faderGain].forEach(AUDIO_GAIN.validate);
    assertFinite(next.pan, 'pan');
    assertFinite(next.balance, 'balance');
    if (Math.abs(next.pan) > 1 || Math.abs(next.balance) > 1)
      throw new AudioMixerError('AudioMixerChannelInvalid', 'pan/balance out of range');
    this.channels.set(id, freeze(next) as any);
    this.counters.channelUpdates++;
    this.event('AudioChannelUpdated');
    this.bump();
  }
  unregisterChannel(id: string) {
    if (!this.channels.has(id))
      throw new AudioMixerError('AudioMixerChannelNotFound', 'channel not found');
    this.queues.get(id)?.clear();
    this.channels.delete(id);
    this.queues.delete(id);
    this.counters.channelRemovals++;
    this.event('AudioChannelRemoved');
    this.bump();
  }
  addSend(s: AudioBusSend) {
    if (this.sends.has(s.sendId))
      throw new AudioMixerError('AudioMixerSendInvalid', 'duplicate send');
    const c = this.channels.get(s.sourceChannelId);
    const b = this.buses.get(s.destinationBusId);
    if (!c || !b) throw new AudioMixerError('AudioMixerSendInvalid', 'invalid send endpoint');
    if (b.generation !== s.destinationBusGeneration)
      throw new AudioMixerError(
        'AudioMixerBusGenerationMismatch',
        'stale destination bus generation',
      );
    AUDIO_GAIN.validate(s.gain);
    if (
      c.sampleFormat !== b.sampleFormat ||
      c.sampleRateHz !== b.sampleRateHz ||
      c.channelLayout !== b.channelLayout
    )
      throw new AudioMixerError(
        'AudioMixerFormatUnsupported',
        'incompatible routed channel rejected',
      );
    this.sends.set(s.sendId, freeze(s) as any);
    this.counters.sendAdditions++;
    this.event('AudioSendAdded');
    this.bump();
  }
  updateSend(id: string, patch: Partial<AudioBusSend>) {
    const s = this.sends.get(id);
    if (!s) throw new AudioMixerError('AudioMixerSendInvalid', 'send not found');
    const n = { ...s, ...patch };
    AUDIO_GAIN.validate(n.gain);
    this.sends.set(id, freeze(n) as any);
    this.counters.sendUpdates++;
    this.event('AudioSendUpdated');
    this.bump();
  }
  removeSend(id: string) {
    if (!this.sends.delete(id))
      throw new AudioMixerError('AudioMixerSendInvalid', 'send not found');
    this.counters.sendRemovals++;
    this.event('AudioSendRemoved');
    this.bump();
  }
  receiveBlock(channelId: string, b: AudioPcmBufferEnvelope) {
    this.ensureOpen();
    const c = this.channels.get(channelId);
    if (!c) throw new AudioMixerError('AudioMixerChannelNotFound', 'channel not found');
    if (c.sourceGeneration !== b.sourceGeneration || c.streamGeneration !== b.streamGeneration)
      throw new AudioMixerError(
        'AudioMixerChannelGenerationMismatch',
        'source generation mismatch',
      );
    validateAudioSampleFormat(b.sampleFormat);
    validateAudioChannelLayout(b.channelLayout, b.channelCount);
    if (b.sampleCount <= 0 || b.sampleCount > 4096)
      throw new AudioMixerError('AudioMixerBlockInvalid', 'invalid sample count');
    if (b.ownership === 'RELEASED')
      throw new AudioMixerError(
        'AudioMixerOwnershipViolation',
        'released buffer processing rejected',
      );
    this.counters.blocksReceived++;
    this.ownership.acquire(b, 'MIXER_OWNED');
    const q = this.queues.get(channelId)!;
    const ok = q.enqueue(b, (d) => {
      this.counters.blocksDropped++;
      this.ownership.release(`lease:${d.bufferId}:${d.generation}:MIXER_OWNED`, 'dropped');
    });
    if (ok) this.counters.blocksQueued++;
    this.event(ok ? 'AudioBlockQueued' : 'AudioBlockDropped');
    return ok;
  }
  processBlock(request: AudioMixRequest) {
    this.ensureOpen();
    if (request.cancelled) {
      this.counters.blocksCancelled++;
      return freeze({
        requestId: request.requestId,
        planId: 'cancelled',
        status: 'CANCELLED',
        runtimeFrame: request.runtimeFrame,
        blockSequence: request.blockSequence,
        samplePosition: request.requestedSamplePosition,
        sampleCount: request.sampleCount,
        auxiliaryOutputs: [],
        activeChannelIds: [],
        mutedChannelIds: [],
        soloedChannelIds: [],
        droppedInputIds: [],
        underflowChannelIds: [],
        contributionSummaries: {},
        outputByteCount: 0,
        temporaryByteCount: 0,
        realPcmMixApplied: false,
        warnings: ['cancelled before processing'],
        ownershipTransfer: [],
        durationNs: '0',
        completedAtNs: '0',
      } satisfies AudioMixResult);
    }
    if (this.requests.has(request.requestId)) {
      this.counters.duplicateRequests++;
      this.incident('AUDIO_MIXER_DUPLICATE_REQUEST');
      throw new AudioMixerError('AudioMixerDuplicateRequest', 'duplicate request');
    }
    const blockKey = `${request.blockSequence}:${request.requestedSamplePosition}`;
    if (this.processed.has(blockKey)) {
      this.counters.duplicateBlocks++;
      this.incident('AUDIO_MIXER_DUPLICATE_BLOCK');
      throw new AudioMixerError('AudioMixerDuplicateBlock', 'duplicate block');
    }
    if (request.requestedSamplePosition < this.lastSamplePosition) {
      this.incident('AUDIO_MIXER_SAMPLE_POSITION_REGRESSION');
      throw new AudioMixerError('AudioMixerSamplePositionMismatch', 'sample position regression');
    }
    if (this.lastSamplePosition >= 0 && request.requestedSamplePosition > this.lastSamplePosition) {
      this.counters.gaps++;
      this.incident('AUDIO_MIXER_SAMPLE_GAP');
    }
    for (const [id, g] of Object.entries(request.expectedChannelGenerations)) {
      if (this.channels.get(id)?.generation !== g) {
        this.stale('AUDIO_MIXER_CHANNEL_GENERATION_STALE');
        throw new AudioMixerError('AudioMixerChannelGenerationMismatch', 'stale channel');
      }
    }
    for (const [id, g] of Object.entries(request.expectedBusGenerations)) {
      if (this.buses.get(id)?.generation !== g) {
        this.stale('AUDIO_MIXER_BUS_GENERATION_STALE');
        throw new AudioMixerError('AudioMixerBusGenerationMismatch', 'stale bus');
      }
    }
    this.requests.add(request.requestId);
    this.processed.add(blockKey);
    this.event('AudioMixRequested');
    const backend = this.activeBackend();
    const plan = backend.createPlan(this, request);
    this.event('AudioMixPlanned');
    this.event('AudioMixStarted');
    try {
      const r = backend.processBlock(this, request, plan);
      this.lastSamplePosition = request.requestedSamplePosition + request.sampleCount;
      this.counters.blocksProcessed++;
      if (r.status === 'COMPLETED') this.counters.blocksCompleted++;
      this.event(r.status === 'COMPLETED' ? 'AudioMixCompleted' : 'AudioMixDegraded');
      return freeze(r);
    } catch (e) {
      this.counters.blocksFailed++;
      this.event('AudioMixFailed');
      this.incident(
        e instanceof AudioMixerError && e.code === 'AudioMixerAllocationFailed'
          ? 'AUDIO_MIXER_ALLOCATION_FAILED'
          : 'AUDIO_MIXER_BACKEND_FAILED',
      );
      throw e;
    }
  }
  createDeterministicPlan(r: AudioMixRequest): AudioMixPlan {
    const key = JSON.stringify([
      r.inputChannelIds.slice().sort(),
      r.outputBusIds.slice().sort(),
      this.generation,
      Object.entries(r.expectedChannelGenerations).sort(),
      Object.entries(r.expectedBusGenerations).sort(),
    ]);
    const cached = this.planCache.get(key);
    if (cached) {
      this.counters.planCacheHits++;
      return cached;
    }
    this.counters.planCacheMisses++;
    const channels = r.inputChannelIds.slice().sort();
    const buses = r.outputBusIds.slice().sort();
    const sends = [...this.sends.values()]
      .filter(
        (s) =>
          channels.includes(s.sourceChannelId) && buses.includes(s.destinationBusId) && s.enabled,
      )
      .sort((a, b) => a.priority - b.priority || a.sendId.localeCompare(b.sendId));
    const soloed = channels.filter((id) => this.channels.get(id)?.solo);
    const resolution: Object = Object.fromEntries(
      channels.map((id) => [
        id,
        this.channels.get(id)!.enabled &&
          !this.channels.get(id)!.mute &&
          (soloed.length === 0 ||
            !!this.channels.get(id)!.solo ||
            !!this.channels.get(id)!.soloSafe),
      ]),
    );
    const contrib = Object.fromEntries(channels.map((id) => [id, (resolution as any)[id] ? 1 : 0]));
    const plan = freeze({
      planId: `plan:${hash(key)}`,
      requestId: r.requestId,
      mixerGeneration: this.generation,
      inputChannelOrder: channels,
      outputBusOrder: buses,
      resolvedSends: sends,
      muteSoloResolution: resolution as any,
      contributionValues: contrib,
      operationOrder: [
        'validate input block',
        'apply source contribution',
        'apply input gain',
        'apply phase inversion',
        'apply pan/balance',
        'apply fader gain',
        'apply send gain',
        'sum into destination bus',
        'apply bus master gain',
        'validate output',
        'transfer ownership',
        'release temporary buffers',
      ],
      temporaryBufferEstimateBytes: 0,
      outputByteEstimate: buses.reduce(
        (a, id) =>
          a +
          (this.buses.get(id)?.blockSize ?? r.sampleCount) *
            (this.buses.get(id)?.channelCount ?? 2) *
            4,
        0,
      ),
      expectedSamplePosition: r.requestedSamplePosition,
      sampleCount: r.sampleCount,
      deterministicScore: hash(key),
      warnings: [],
      metadata: { cacheKey: hash(key) },
    } satisfies AudioMixPlan) as AudioMixPlan;
    if (this.planCache.size >= 64) this.planCache.delete(this.planCache.keys().next().value);
    this.planCache.set(key, plan);
    this.counters.plansCreated++;
    return plan;
  }
  completeSyntheticMix(r: AudioMixRequest, p: AudioMixPlan): AudioMixResult {
    const active = p.inputChannelOrder.filter((id) => (p.muteSoloResolution as any)[id]);
    const underflow: string[] = [];
    const outputs: AudioOutputReference[] = [];
    const consumed: AudioPcmLeaseSnapshot[] = [];
    const sourcePerBus = new Set<string>();
    for (const id of active) {
      const c = this.channels.get(id)!;
      const q = this.queues.get(id)!;
      const b = q.dequeue();
      if (!b) {
        underflow.push(id);
        this.counters.underflows++;
        this.incident('AUDIO_MIXER_INPUT_UNDERFLOW');
        continue;
      }
      if (b.samplePosition < r.requestedSamplePosition) {
        this.counters.overlaps++;
        this.incident('AUDIO_MIXER_SAMPLE_OVERLAP');
      }
      if (b.discontinuity) {
        this.counters.discontinuities++;
        this.incident('AUDIO_MIXER_SAMPLE_GAP');
      }
      const leaseId = `lease:${b.bufferId}:${b.generation}:MIXER_OWNED`;
      try {
        consumed.push(this.ownership.release(leaseId, 'mixed'));
      } catch {
        this.counters.ownershipViolations++;
        this.incident('AUDIO_MIXER_OWNERSHIP_VIOLATION');
      }
      for (const s of p.resolvedSends.filter((x) => x.sourceChannelId === id)) {
        const k = `${s.destinationBusId}:${c.sourceId}`;
        if (sourcePerBus.has(k)) {
          this.incident('AUDIO_MIXER_DUPLICATE_SOURCE_CONTRIBUTION');
          continue;
        }
        sourcePerBus.add(k);
        this.counters.gainOperations += 3;
        if (c.phaseInvert) this.counters.phaseInversions++;
        if (c.pan !== 0 || c.balance !== 0 || s.panOverride != null) this.counters.panOperations++;
      }
    }
    for (const busId of p.outputBusOrder) {
      const b = this.buses.get(busId)!;
      if (underflow.length && b.role === 'PROGRAM') this.incident('AUDIO_MIXER_PROGRAM_UNDERFLOW');
      const out = {
        outputId: `audio-out:${b.role}:${r.blockSequence}:${r.requestedSamplePosition}:${hash(busId + p.deterministicScore)}`,
        busId: b.busId,
        role: b.role,
        samplePosition: r.requestedSamplePosition,
        sampleCount: r.sampleCount,
        generation: this.generation,
        checksum: hash(
          `${p.deterministicScore}:${busId}:${active.join(',')}:${underflow.join(',')}`,
        ),
        payloadRef: '[OPAQUE_SYNTHETIC_BUS_OUTPUT]',
        ownership: 'OUTPUT_OWNED' as AudioPcmOwnershipState,
      };
      outputs.push(out);
      this.counters.outputBytes += r.sampleCount * b.channelCount * 4;
      if (b.role === 'PROGRAM') {
        if (this.programOutputs.has(r.blockSequence)) {
          this.incident('AUDIO_MIXER_OUTPUT_ALIAS');
          throw new AudioMixerError('AudioMixerInvariantViolation', 'duplicate Program output');
        }
        this.programOutputs.add(r.blockSequence);
        this.counters.programPublications++;
        this.event('ProgramAudioPublished');
      }
      if (b.role === 'PREVIEW') {
        this.counters.previewPublications++;
        this.event('PreviewAudioPublished');
      }
      if (b.role === 'AUXILIARY') this.counters.auxPublications++;
      if (b.role === 'CLEAN_FEED') this.counters.cleanFeedPublications++;
      if (b.role === 'MONITOR') this.counters.monitorPublications++;
    }
    const programOutput = outputs.find((o) => o.role === 'PROGRAM');
    const previewOutput = outputs.find((o) => o.role === 'PREVIEW');
    if (programOutput && previewOutput && programOutput.outputId === previewOutput.outputId)
      throw new AudioMixerError('AudioMixerInvariantViolation', 'Program/Preview alias');
    this.counters.maximumActiveChannels = Math.max(
      this.counters.maximumActiveChannels,
      active.length,
    );
    this.counters.maximumBusesPerBlock = Math.max(
      this.counters.maximumBusesPerBlock,
      p.outputBusOrder.length,
    );
    return {
      requestId: r.requestId,
      planId: p.planId,
      status: underflow.length ? 'DEGRADED' : 'COMPLETED',
      runtimeFrame: r.runtimeFrame,
      blockSequence: r.blockSequence,
      samplePosition: r.requestedSamplePosition,
      sampleCount: r.sampleCount,
      programOutput,
      previewOutput,
      auxiliaryOutputs: outputs.filter((o) => o.role === 'AUXILIARY'),
      cleanFeedOutput: outputs.find((o) => o.role === 'CLEAN_FEED'),
      monitorOutput: outputs.find((o) => o.role === 'MONITOR'),
      activeChannelIds: active,
      mutedChannelIds: p.inputChannelOrder.filter((id) => !(p.muteSoloResolution as any)[id]),
      soloedChannelIds: p.inputChannelOrder.filter((id) => this.channels.get(id)?.solo),
      droppedInputIds: [],
      underflowChannelIds: underflow,
      contributionSummaries: sanitize(
        Object.fromEntries([...sourcePerBus].map((x) => [x, 1])),
      ) as any,
      outputByteCount: outputs.length * r.sampleCount * 2 * 4,
      temporaryByteCount: 0,
      realPcmMixApplied: false,
      warnings: underflow.map((id) => `underflow:${id}`),
      ownershipTransfer: consumed,
      durationNs: String(
        Math.floor(
          (r.sampleCount * 1_000_000_000) /
            (this.buses.get(p.outputBusOrder[0])?.sampleRateHz ?? 48000),
        ),
      ),
      completedAtNs: r.deadlineNs ?? '0',
    };
  }
  snapshot(): AudioMixerEngineSnapshot {
    return freeze({
      engineId: this.engineId,
      generation: this.generation,
      state: this.shutdownState ? 'SHUTDOWN' : 'READY',
      activeBackendId: [...this.backends.values()].sort(
        (a, b) =>
          b.descriptor.priority - a.descriptor.priority ||
          a.descriptor.backendId.localeCompare(b.descriptor.backendId),
      )[0]?.descriptor.backendId,
      backends: [...this.backends.values()]
        .map((b) => ({
          backendId: b.descriptor.backendId,
          displayName: b.descriptor.displayName,
          priority: b.descriptor.priority,
          generation: b.descriptor.generation,
          healthy: (b as any).healthy !== false,
          capabilities: sanitize(b.capabilities),
        }))
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      channels: [...this.channels.values()].sort((a, b) => a.channelId.localeCompare(b.channelId)),
      buses: [...this.buses.values()].sort((a, b) => a.busId.localeCompare(b.busId)),
      sends: [...this.sends.values()].sort((a, b) => a.sendId.localeCompare(b.sendId)),
      health: this.health(),
      telemetry: this.telemetry(),
      watchdogIncidents: this.incidents.slice(-64),
      events: this.events.slice(-64),
    });
  }
  health(): AudioMixerHealthSnapshot {
    const program = [...this.buses.values()].find((b) => b.role === 'PROGRAM')?.busId;
    const preview = [...this.buses.values()].find((b) => b.role === 'PREVIEW')?.busId;
    return freeze({
      engineState: this.shutdownState ? 'SHUTDOWN' : 'READY',
      healthState: this.counters.blocksFailed ? 'degraded' : 'healthy',
      backendCount: this.backends.size,
      activeBackendId: this.snapshotActive(),
      registeredChannelCount: this.channels.size,
      activeChannelCount: [...this.channels.values()].filter((c) => c.enabled).length,
      registeredBusCount: this.buses.size,
      activeBusCount: this.buses.size,
      programBusId: program,
      previewBusId: preview,
      processedBlockCount: this.counters.blocksProcessed,
      completedBlockCount: this.counters.blocksCompleted,
      degradedBlockCount: this.counters.blocksDegraded,
      silentBlockCount: this.counters.blocksSilent,
      droppedBlockCount: this.counters.blocksDropped,
      failedBlockCount: this.counters.blocksFailed,
      cancelledBlockCount: this.counters.blocksCancelled,
      duplicateRequestCount: this.counters.duplicateRequests,
      duplicateBlockCount: this.counters.duplicateBlocks,
      staleGenerationRejectionCount: this.counters.staleGenerationRejects,
      underflowCount: this.counters.underflows,
      overflowCount: this.counters.overflows,
      gapCount: this.counters.gaps,
      overlapCount: this.counters.overlaps,
      discontinuityCount: this.counters.discontinuities,
      ownershipViolationCount: this.counters.ownershipViolations,
      inputQueueBytes: [...this.queues.values()].reduce((a, q) => a + q.bytes, 0),
      peakInputQueueBytes: 0,
      temporaryBytes: this.counters.temporaryBytes,
      peakTemporaryBytes: 0,
      programOutputBytes: this.counters.outputBytes,
      lastSamplePosition: this.lastSamplePosition,
      lastSuccessfulBlock: [...this.programOutputs].at(-1),
      lastFailure: undefined,
      updatedAtNs: '0',
    });
  }
  telemetry(): AudioMixerTelemetrySnapshot {
    return freeze({
      ...this.counters,
      currentRequestId: undefined,
      activeBackendId: this.snapshotActive(),
      lastMixerEvent: this.events.at(-1),
      healthSummary: this.counters.blocksFailed ? 'degraded' : 'healthy',
    });
  }
  channelStates() {
    return freeze(
      [...this.channels.values()]
        .sort((a, b) => a.channelId.localeCompare(b.channelId))
        .map(
          (c) =>
            ({
              channelId: c.channelId,
              generation: c.generation,
              active: c.enabled,
              available: true,
              muted: c.mute,
              soloed: c.solo,
              currentSamplePosition: undefined,
              expectedSamplePosition: undefined,
              inputQueueDepth: this.queues.get(c.channelId)?.depth() ?? 0,
              droppedBlockCount: this.queues.get(c.channelId)?.dropped ?? 0,
              underflowCount: this.counters.underflows,
              discontinuityCount: this.counters.discontinuities,
              lastInputTimestampNs: undefined,
              currentContribution: c.mute ? 0 : 1,
              busParticipation: [...this.sends.values()]
                .filter((s) => s.sourceChannelId === c.channelId)
                .map((s) => s.destinationBusId)
                .sort(),
              health: c.mute ? 'muted' : 'healthy',
              metadata: c.metadata,
            }) satisfies AudioMixerChannelState,
        ),
    );
  }
  busStates() {
    return freeze(
      [...this.buses.values()]
        .sort((a, b) => a.busId.localeCompare(b.busId))
        .map(
          (b) =>
            ({
              busId: b.busId,
              generation: b.generation,
              active: true,
              muted: b.mute,
              lastOutputRef: undefined,
              lastSamplePosition: this.lastSamplePosition,
              health: b.mute ? 'muted' : 'healthy',
            }) satisfies AudioMixerBusState,
        ),
    );
  }
  validate(): AudioMixerValidationReport {
    const errors: string[] = [];
    const ids = (arr: string[], name: string) => {
      if (new Set(arr).size !== arr.length) errors.push(`${name} duplicate`);
    };
    ids([...this.backends.keys()], 'backend');
    ids([...this.channels.keys()], 'channel');
    ids([...this.buses.keys()], 'bus');
    ids([...this.sends.keys()], 'send');
    const program = [...this.buses.values()].filter((b) => b.role === 'PROGRAM');
    const preview = [...this.buses.values()].filter((b) => b.role === 'PREVIEW');
    if (program[0] && preview[0] && program[0].busId === preview[0].busId)
      errors.push('Program and Preview bus IDs must be distinct');
    for (const s of this.sends.values())
      if (!this.channels.has(s.sourceChannelId) || !this.buses.has(s.destinationBusId))
        errors.push(`invalid send ${s.sendId}`);
    if (this.ownership.active().length) errors.push('active leases remain');
    if (this.counters.temporaryBytes !== 0) errors.push('temporary bytes leak');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: this.incidents.slice(-16),
      snapshot: this.snapshot(),
    });
  }
  assertInvariants() {
    const r = this.validate();
    if (!r.valid) {
      this.incident('AUDIO_MIXER_INVARIANT_FAILURE');
      throw new AudioMixerError('AudioMixerInvariantViolation', 'invariants failed', {
        errors: r.errors,
      });
    }
    return r;
  }
  shutdown() {
    if (this.shutdownState) return;
    for (const q of this.queues.values()) q.clear();
    this.ownership.shutdown();
    for (const b of this.backends.values()) b.shutdown();
    this.backends.clear();
    this.planCache.clear();
    this.shutdownState = true;
    this.event('AudioMixerShutdown');
  }
  private bump() {
    this.generation++;
  }
  private ensureOpen() {
    if (this.shutdownState)
      throw new AudioMixerError('AudioMixerShutdownError', 'mixer is shutdown');
  }
  private event(e: string) {
    this.events.push(e);
    if (this.events.length > 128) this.events.shift();
  }
  private incident(i: string) {
    this.incidents.push(i);
    if (this.incidents.length > 128) this.incidents.shift();
  }
  private stale(i: string) {
    this.counters.staleGenerationRejects++;
    this.incident(i);
  }
  private snapshotActive() {
    return [...this.backends.values()].sort(
      (a, b) =>
        b.descriptor.priority - a.descriptor.priority ||
        a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    )[0]?.descriptor.backendId;
  }
}
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
};

export const createAudioPcmBufferEnvelope = (
  p: Omit<AudioPcmBufferEnvelope, 'durationNs' | 'metadata'> & {
    metadata?: Record<string, unknown>;
  },
): AudioPcmBufferEnvelope => {
  validateAudioSampleFormat(p.sampleFormat);
  validateAudioChannelLayout(p.channelLayout, p.channelCount);
  if (p.sampleCount <= 0 || p.sampleCount > 4096)
    throw new AudioMixerError('AudioMixerBlockInvalid', 'sample count positive and bounded');
  return freeze({
    ...p,
    durationNs: String(Math.floor((p.sampleCount * 1_000_000_000) / p.sampleRateHz)),
    metadata: sanitize(p.metadata ?? {}) as any,
  }) as AudioPcmBufferEnvelope;
};
export const createAudioMixerEngine = (id?: string) => new AudioMixerEngine(id);
export const createSyntheticAudioMixerBackend = (
  descriptor?: SyntheticAudioMixerBackend['descriptor'],
  faults?: Record<string, boolean>,
) => new SyntheticAudioMixerBackend(descriptor, faults);
export class AudioMixerProcessor implements TickProcessor {
  readonly id = 'audio-mixer-processor';
  readonly order = AUDIO_MIXER_PROCESSOR_ORDER.audioMixer;
  constructor(readonly mixer: AudioMixerEngine) {}
  initialize() {
    return { status: 'READY' as const, state: this.mixer.snapshot() };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const program = context.outputs.readDependencyOutput<ProgramAudioRouteSnapshot>(
      'audio-follow-video-processor',
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.programAudioRoute,
    );
    const preview = context.outputs.readDependencyOutput<PreviewAudioRouteSnapshot>(
      'audio-follow-video-processor',
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.previewAudioRoute,
    );
    const buses = (this.mixer.snapshot().buses as AudioMixerBusDefinition[]).map((b) => b.busId);
    const channels = (this.mixer.snapshot().channels as AudioMixerChannelDefinition[]).map(
      (c) => c.channelId,
    );
    if (!buses.length) {
      context.outputs.publish(
        this.id,
        AUDIO_MIXER_OUTPUT_KEYS.mixerHealth,
        this.mixer.health(),
        'OWNED_BY_PROCESSOR',
      );
      return { status: 'COMPLETED' as const, result: this.mixer.snapshot() };
    }
    const req: AudioMixRequest = {
      requestId: `tick:${tick.frameNumber.toString()}:${tick.generation}`,
      runtimeFrame: tick.frameNumber.toString(),
      blockSequence: Number(tick.frameNumber % 9007199254740991n),
      requestedSamplePosition: Number(tick.frameNumber) * 480,
      sampleCount: 480,
      outputBusIds: buses,
      inputChannelIds: channels,
      expectedChannelGenerations: Object.fromEntries(
        (this.mixer.snapshot().channels as AudioMixerChannelDefinition[]).map((c) => [
          c.channelId,
          c.generation,
        ]),
      ),
      expectedBusGenerations: Object.fromEntries(
        (this.mixer.snapshot().buses as AudioMixerBusDefinition[]).map((b) => [
          b.busId,
          b.generation,
        ]),
      ),
      expectedAudioFollowRouteGeneration: (program as any)?.generation ?? 0,
      expectedTransitionGeneration: (program as any)?.transitionGeneration ?? 0,
      expectedMixerConfigurationGeneration: (this.mixer.snapshot() as any).generation,
      deadlineNs: tick.deadlineNs?.toString?.() ?? '0',
      metadata: {
        programRouteGeneration: (program as any)?.generation ?? 0,
        previewRouteGeneration: (preview as any)?.generation ?? 0,
      },
    };
    let result: AudioMixResult | undefined;
    try {
      result = this.mixer.processBlock(req);
    } catch {}
    context.outputs.publish(
      this.id,
      AUDIO_MIXER_OUTPUT_KEYS.activeMixRequest,
      req,
      'OWNED_BY_PROCESSOR',
    );
    if (result) {
      context.outputs.publish(
        this.id,
        AUDIO_MIXER_OUTPUT_KEYS.mixResult,
        result,
        'OWNED_BY_PROCESSOR',
      );
      if (result.programOutput)
        context.outputs.publish(
          this.id,
          AUDIO_MIXER_OUTPUT_KEYS.programAudioOutput,
          result.programOutput,
          'OWNED_BY_PROCESSOR',
        );
      if (result.previewOutput)
        context.outputs.publish(
          this.id,
          AUDIO_MIXER_OUTPUT_KEYS.previewAudioOutput,
          result.previewOutput,
          'OWNED_BY_PROCESSOR',
        );
      context.outputs.publish(
        this.id,
        AUDIO_MIXER_OUTPUT_KEYS.auxiliaryAudioOutputs,
        result.auxiliaryOutputs,
        'OWNED_BY_PROCESSOR',
      );
      context.outputs.publish(
        this.id,
        AUDIO_MIXER_OUTPUT_KEYS.cleanFeedAudioOutput,
        result.cleanFeedOutput,
        'OWNED_BY_PROCESSOR',
      );
      context.outputs.publish(
        this.id,
        AUDIO_MIXER_OUTPUT_KEYS.monitorAudioOutput,
        result.monitorOutput,
        'OWNED_BY_PROCESSOR',
      );
    }
    context.outputs.publish(
      this.id,
      AUDIO_MIXER_OUTPUT_KEYS.inputChannelStates,
      this.mixer.channelStates(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_MIXER_OUTPUT_KEYS.busStates,
      this.mixer.busStates(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_MIXER_OUTPUT_KEYS.mixerHealth,
      this.mixer.health(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_MIXER_OUTPUT_KEYS.mixerTelemetry,
      this.mixer.telemetry(),
      'OWNED_BY_PROCESSOR',
    );
    return { status: 'COMPLETED' as const, result: this.mixer.snapshot() };
  }
  shutdown() {
    this.mixer.shutdown();
    return { status: 'STOPPED' as const };
  }
}
export const createAudioMixerProcessor = (mixer: AudioMixerEngine) =>
  new AudioMixerProcessor(mixer);
export const createAudioMixerCommandHandlers = (mixer: AudioMixerEngine): RuntimeCommandHandler[] =>
  AUDIO_MIXER_COMMAND_TYPES.map((type) => ({
    type,
    execute(command: RuntimeCommand) {
      const p = command.payload as any;
      switch (command.type) {
        case 'AUDIO_MIXER_REGISTER_BACKEND':
          mixer.registerBackend(p.backend);
          break;
        case 'AUDIO_MIXER_UNREGISTER_BACKEND':
          mixer.unregisterBackend(p.backendId);
          break;
        case 'AUDIO_MIXER_REGISTER_CHANNEL':
          mixer.registerChannel(p.channel);
          break;
        case 'AUDIO_MIXER_UPDATE_CHANNEL':
          mixer.updateChannel(p.channelId, p.patch);
          break;
        case 'AUDIO_MIXER_UNREGISTER_CHANNEL':
          mixer.unregisterChannel(p.channelId);
          break;
        case 'AUDIO_MIXER_REGISTER_BUS':
          mixer.registerBus(p.bus);
          break;
        case 'AUDIO_MIXER_UPDATE_BUS':
          mixer.updateBus(p.busId, p.patch);
          break;
        case 'AUDIO_MIXER_UNREGISTER_BUS':
          mixer.unregisterBus(p.busId);
          break;
        case 'AUDIO_MIXER_ADD_SEND':
          mixer.addSend(p.send);
          break;
        case 'AUDIO_MIXER_UPDATE_SEND':
          mixer.updateSend(p.sendId, p.patch);
          break;
        case 'AUDIO_MIXER_REMOVE_SEND':
          mixer.removeSend(p.sendId);
          break;
        case 'AUDIO_MIXER_SET_CHANNEL_GAIN':
          mixer.updateChannel(p.channelId, {
            expectedGeneration: p.expectedGeneration,
            faderGain: p.gain,
          });
          break;
        case 'AUDIO_MIXER_SET_CHANNEL_MUTE':
          mixer.updateChannel(p.channelId, {
            expectedGeneration: p.expectedGeneration,
            mute: p.mute,
          });
          break;
        case 'AUDIO_MIXER_SET_CHANNEL_SOLO':
          mixer.updateChannel(p.channelId, {
            expectedGeneration: p.expectedGeneration,
            solo: p.solo,
          });
          break;
        case 'AUDIO_MIXER_SET_CHANNEL_PAN':
          mixer.updateChannel(p.channelId, {
            expectedGeneration: p.expectedGeneration,
            pan: p.pan,
          });
          break;
        case 'AUDIO_MIXER_SET_PHASE_INVERT':
          mixer.updateChannel(p.channelId, {
            expectedGeneration: p.expectedGeneration,
            phaseInvert: p.phaseInvert,
          });
          break;
        case 'AUDIO_MIXER_SET_BUS_GAIN':
          mixer.updateBus(p.busId, {
            expectedGeneration: p.expectedGeneration,
            masterGain: p.gain,
          });
          break;
        case 'AUDIO_MIXER_SET_BUS_MUTE':
          mixer.updateBus(p.busId, { expectedGeneration: p.expectedGeneration, mute: p.mute });
          break;
        case 'AUDIO_MIXER_PROCESS_BLOCK':
          return mixer.processBlock(p.request);
        case 'AUDIO_MIXER_CLEAR_PLAN_CACHE':
          (mixer as any).planCache.clear();
          break;
        case 'AUDIO_MIXER_VALIDATE':
          return mixer.validate();
        case 'AUDIO_MIXER_RESET':
          return mixer.validate();
        case 'AUDIO_MIXER_SHUTDOWN':
          mixer.shutdown();
          break;
      }
      return mixer.snapshot();
    },
  }));
export type AudioMixerSourceGraphSnapshot = Readonly<{
  mixerState: string;
  channels: readonly Json[];
  buses: readonly Json[];
  sends: readonly Json[];
  health: Json;
  routingEligibility: readonly string[];
}>;
export const createAudioMixerSourceGraphSnapshot = (
  mixer: AudioMixerEngine,
): AudioMixerSourceGraphSnapshot => {
  const s = mixer.snapshot();
  return freeze({
    mixerState: s.state,
    channels: (s.channels as any[]).map((c) =>
      sanitize({
        channelId: c.channelId,
        sourceRole: c.sourceRole,
        available: true,
        mute: c.mute,
        solo: c.solo,
        sampleRateHz: c.sampleRateHz,
        channelLayout: c.channelLayout,
        queueDepth: mixer.channelStates().find((x: any) => x.channelId === c.channelId)
          ?.inputQueueDepth,
        lastSamplePosition: undefined,
      }),
    ),
    buses: (s.buses as any[]).map((b) =>
      sanitize({
        busId: b.busId,
        role: b.role,
        sampleRateHz: b.sampleRateHz,
        channelLayout: b.channelLayout,
        routingEligibility: b.routingEligibility,
      }),
    ),
    sends: (s.sends as any[]).map((x) => sanitize(x)),
    health: sanitize(s.health),
    routingEligibility: (s.buses as any[]).flatMap((b) => b.routingEligibility ?? []).sort(),
  });
};
