/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeCommandHandler,
  type TickProcessor,
} from './execution-engine.js';
import {
  validateAudioChannelLayout,
  validateAudioSampleFormat,
  type AudioChannelLayout,
  type AudioSampleFormat,
} from './audio-mixer-foundation.js';

type Json = null | boolean | number | string | readonly Json[] | { readonly [k: string]: Json };
const SECRET =
  /secret|credential|token|password|native|handle|pcm|payload|url|endpoint|address|sampleValues/i;
const deepFreeze = (v: any): any => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) deepFreeze(x);
  }
  return v;
};
const freeze = <T>(v: T): Readonly<T> => deepFreeze(structuredClone(v));
const sanitize = (v: any, d = 0): Json => {
  if (d > 7) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return Object.freeze(v.slice(0, 256).map((x) => sanitize(x, d + 1)));
  if (typeof v === 'object')
    return Object.freeze(
      Object.fromEntries(
        Object.entries(v)
          .slice(0, 256)
          .map(([k, x]) => [k, SECRET.test(k) ? '[REDACTED]' : sanitize(x, d + 1)]),
      ),
    );
  return String(v);
};
const finite = (n: number, name: string) => {
  if (!Number.isFinite(n))
    throw new AudioEqDynamicsError('AudioEqDynamicsParameterInvalid', `${name} must be finite`);
  return n;
};
const between = (n: number, min: number, max: number, name: string) => {
  finite(n, name);
  if (n < min || n > max)
    throw new AudioEqDynamicsError('AudioEqDynamicsParameterInvalid', `${name} out of range`);
  return n;
};
const uniq = (xs: readonly string[]) => new Set(xs).size === xs.length;
const sorted = <T extends Record<string, any>>(xs: Iterable<T>, key: keyof T) =>
  [...xs].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};

export const AUDIO_EQ_DYNAMICS_VERSION = '5.6.3' as const;
export const AUDIO_EQ_DYNAMICS_PROCESSOR_ORDER = Object.freeze({
  transitionExecution: 500,
  audioFollowVideo: 550,
  channelStripRouting: 565,
  eqDynamics: 570,
  audioMixer: 575,
  busOrchestration: 600,
});
export const AUDIO_EQ_DYNAMICS_INSERTION_POINTS = Object.freeze([
  'CHANNEL_PRE_FADER',
  'CHANNEL_POST_FADER',
  'CHANNEL_POST_MUTE',
  'SUBGROUP_PRE_MASTER',
  'SUBGROUP_POST_MASTER',
  'BUS_PRE_MASTER',
  'BUS_POST_MASTER',
  'PROGRAM_PRE_OUTPUT',
  'PREVIEW_PRE_OUTPUT',
  'AUX_PRE_OUTPUT',
  'CLEAN_FEED_PRE_OUTPUT',
  'MONITOR_PRE_OUTPUT',
  'RECORD_PRE_OUTPUT',
  'STREAM_PRE_OUTPUT',
  'CUSTOM',
] as const);
export type AudioEqDynamicsInsertionPoint = (typeof AUDIO_EQ_DYNAMICS_INSERTION_POINTS)[number];
export const AUDIO_EQ_DYNAMICS_PROCESSOR_TYPES = Object.freeze([
  'HIGH_PASS_FILTER',
  'LOW_PASS_FILTER',
  'LOW_SHELF_EQ',
  'HIGH_SHELF_EQ',
  'PARAMETRIC_BELL_EQ',
  'NOTCH_FILTER',
  'BAND_PASS_METADATA',
  'ALL_PASS_METADATA',
  'NOISE_GATE',
  'EXPANDER',
  'COMPRESSOR',
  'LIMITER',
  'DE_ESSER_FOUNDATION',
  'SIDECHAIN_DETECTOR_FOUNDATION',
  'BYPASS',
  'CUSTOM_TYPED_PROCESSOR',
] as const);
export type AudioEqDynamicsProcessorType = (typeof AUDIO_EQ_DYNAMICS_PROCESSOR_TYPES)[number];
export const AUDIO_EQ_FILTER_TYPES = Object.freeze(AUDIO_EQ_DYNAMICS_PROCESSOR_TYPES.slice(0, 8));
export const AUDIO_DYNAMICS_PROCESSOR_TYPES = Object.freeze(
  AUDIO_EQ_DYNAMICS_PROCESSOR_TYPES.slice(8, 14),
);
export const AUDIO_DETECTOR_MODES = Object.freeze([
  'PEAK',
  'RMS',
  'AVERAGE',
  'TRUE_PEAK_METADATA',
  'ENVELOPE',
  'CUSTOM_TYPED',
] as const);
export type AudioDetectorMode = (typeof AUDIO_DETECTOR_MODES)[number];
export const AUDIO_DETECTOR_CHANNEL_MODES = Object.freeze([
  'INDEPENDENT',
  'LINKED_MAX',
  'LINKED_AVERAGE',
  'LEFT',
  'RIGHT',
  'MID',
  'SIDE',
  'CUSTOM',
] as const);
export type AudioDetectorChannelMode = (typeof AUDIO_DETECTOR_CHANNEL_MODES)[number];
export const AUDIO_PARAMETER_POLICIES = Object.freeze([
  'REJECT',
  'CLAMP_WITH_WARNING',
  'USE_SAFE_DEFAULT_WITH_WARNING',
  'CUSTOM',
] as const);
export const AUDIO_PROCESSING_RESULT_STATUSES = Object.freeze([
  'COMPLETED',
  'BYPASSED',
  'DEGRADED',
  'SILENT',
  'CANCELLED',
  'FAILED',
  'REJECTED',
] as const);
export type AudioEqDynamicsProcessStatus = (typeof AUDIO_PROCESSING_RESULT_STATUSES)[number];
export const AUDIO_EQ_DYNAMICS_OUTPUT_KEYS = Object.freeze({
  eqBandDefinitions: 'audio.eqDynamics.eqBands',
  eqChainDefinitions: 'audio.eqDynamics.eqChains',
  dynamicsProcessorDefinitions: 'audio.eqDynamics.dynamicsProcessors',
  processingChainDefinitions: 'audio.eqDynamics.processingChains',
  sidechainReferences: 'audio.eqDynamics.sidechains',
  processorStates: 'audio.eqDynamics.processorStates',
  activeConfigurationTransaction: 'audio.eqDynamics.activeTransaction',
  processRequest: 'audio.eqDynamics.request',
  processPlan: 'audio.eqDynamics.plan',
  processResult: 'audio.eqDynamics.result',
  processedChannelOutputs: 'audio.eqDynamics.processedChannelOutputs',
  processedBusOutputs: 'audio.eqDynamics.processedBusOutputs',
  programProcessingState: 'audio.eqDynamics.programState',
  previewProcessingState: 'audio.eqDynamics.previewState',
  auxProcessingStates: 'audio.eqDynamics.auxStates',
  cleanFeedProcessingState: 'audio.eqDynamics.cleanFeedState',
  monitorProcessingState: 'audio.eqDynamics.monitorState',
  engineHealth: 'audio.eqDynamics.engineHealth',
  telemetry: 'audio.eqDynamics.telemetry',
  watchdogSummary: 'audio.eqDynamics.watchdog',
  failedRejectedResults: 'audio.eqDynamics.failedRejectedResults',
});
export const AUDIO_EQ_DYNAMICS_COMMAND_TYPES = Object.freeze([
  'AUDIO_EQ_REGISTER_BAND',
  'AUDIO_EQ_UPDATE_BAND',
  'AUDIO_EQ_UNREGISTER_BAND',
  'AUDIO_EQ_REGISTER_CHAIN',
  'AUDIO_EQ_UPDATE_CHAIN',
  'AUDIO_EQ_UNREGISTER_CHAIN',
  'AUDIO_EQ_SET_BYPASS',
  'AUDIO_EQ_SET_WET_DRY',
  'AUDIO_DYNAMICS_REGISTER',
  'AUDIO_DYNAMICS_UPDATE',
  'AUDIO_DYNAMICS_UNREGISTER',
  'AUDIO_DYNAMICS_SET_BYPASS',
  'AUDIO_DYNAMICS_SET_THRESHOLD',
  'AUDIO_DYNAMICS_SET_RATIO',
  'AUDIO_DYNAMICS_SET_ATTACK',
  'AUDIO_DYNAMICS_SET_RELEASE',
  'AUDIO_DYNAMICS_SET_KNEE',
  'AUDIO_DYNAMICS_SET_MAKEUP_GAIN',
  'AUDIO_DYNAMICS_SET_CEILING',
  'AUDIO_DYNAMICS_SET_RANGE',
  'AUDIO_DYNAMICS_SET_HOLD',
  'AUDIO_DYNAMICS_SET_SIDECHAIN',
  'AUDIO_PROCESSING_CHAIN_REGISTER',
  'AUDIO_PROCESSING_CHAIN_UPDATE',
  'AUDIO_PROCESSING_CHAIN_UNREGISTER',
  'AUDIO_PROCESSING_CHAIN_SET_BYPASS',
  'AUDIO_EQ_DYNAMICS_VALIDATE',
  'AUDIO_EQ_DYNAMICS_COMMIT_CONFIGURATION',
  'AUDIO_EQ_DYNAMICS_ROLLBACK_CONFIGURATION',
  'AUDIO_EQ_DYNAMICS_PROCESS_BLOCK',
  'AUDIO_EQ_DYNAMICS_CANCEL_BLOCK',
  'AUDIO_EQ_DYNAMICS_RESET_PROCESSOR',
  'AUDIO_EQ_DYNAMICS_RESET_TARGET',
  'AUDIO_EQ_DYNAMICS_CLEAR_PLAN_CACHE',
  'AUDIO_EQ_DYNAMICS_SHUTDOWN',
] as const);
export type AudioEqDynamicsCommandType = (typeof AUDIO_EQ_DYNAMICS_COMMAND_TYPES)[number];
export const AUDIO_EQ_DYNAMICS_EVENTS = Object.freeze([
  'AudioEqDynamicsEngineCreated',
  'AudioEqBandRegistered',
  'AudioEqBandUpdated',
  'AudioEqBandRemoved',
  'AudioEqChainRegistered',
  'AudioEqChainUpdated',
  'AudioEqChainRemoved',
  'AudioDynamicsProcessorRegistered',
  'AudioDynamicsProcessorUpdated',
  'AudioDynamicsProcessorRemoved',
  'AudioProcessingChainRegistered',
  'AudioProcessingChainUpdated',
  'AudioProcessingChainRemoved',
  'AudioSidechainConfigured',
  'AudioProcessingConfigurationValidated',
  'AudioProcessingConfigurationCommitted',
  'AudioProcessingConfigurationRolledBack',
  'AudioProcessingRequested',
  'AudioProcessingPlanned',
  'AudioProcessingStarted',
  'AudioProcessingCompleted',
  'AudioProcessingBypassed',
  'AudioProcessingDegraded',
  'AudioProcessingCancelled',
  'AudioProcessingFailed',
  'AudioGateStateChanged',
  'AudioCompressorGainReductionChanged',
  'AudioLimiterActivityChanged',
  'AudioProcessorStateReset',
  'AudioEqDynamicsHealthChanged',
  'AudioEqDynamicsEngineShutdown',
] as const);
export const AUDIO_EQ_DYNAMICS_WATCHDOG_INCIDENTS = Object.freeze([
  'AUDIO_EQ_DYNAMICS_ENGINE_STALLED',
  'AUDIO_EQ_DYNAMICS_BLOCK_TIMEOUT',
  'AUDIO_EQ_DYNAMICS_DUPLICATE_REQUEST',
  'AUDIO_EQ_DYNAMICS_DUPLICATE_BLOCK',
  'AUDIO_EQ_CHAIN_GENERATION_STALE',
  'AUDIO_DYNAMICS_GENERATION_STALE',
  'AUDIO_PROCESSING_CHAIN_GENERATION_STALE',
  'AUDIO_SIDECHAIN_GENERATION_STALE',
  'AUDIO_EQ_PARAMETER_INVALID',
  'AUDIO_DYNAMICS_PARAMETER_INVALID',
  'AUDIO_EQ_FREQUENCY_INVALID',
  'AUDIO_EQ_Q_INVALID',
  'AUDIO_COMPRESSOR_RATIO_INVALID',
  'AUDIO_LIMITER_CEILING_INVALID',
  'AUDIO_SIDECHAIN_SOURCE_INVALID',
  'AUDIO_SIDECHAIN_CYCLE',
  'AUDIO_DETECTOR_STATE_STALE',
  'AUDIO_PROCESSING_STATE_RESET_FAILED',
  'AUDIO_EQ_DYNAMICS_BACKEND_FAILED',
  'AUDIO_EQ_DYNAMICS_ALLOCATION_FAILED',
  'AUDIO_EQ_DYNAMICS_OWNERSHIP_VIOLATION',
  'AUDIO_EQ_DYNAMICS_OUTPUT_ALIAS',
  'AUDIO_EQ_DYNAMICS_OUTPUT_REGISTRY_MISMATCH',
  'AUDIO_EQ_DYNAMICS_SOURCE_GRAPH_MISMATCH',
  'AUDIO_EQ_DYNAMICS_INVARIANT_FAILURE',
] as const);

export class AudioEqDynamicsError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Record<string, Json> = {}) {
    super(code, message, sanitize(details));
    this.name = code;
  }
}
export type AudioTargetReference = Readonly<{
  targetType:
    | 'CHANNEL'
    | 'BUS'
    | 'SUBGROUP'
    | 'PROGRAM'
    | 'PREVIEW'
    | 'AUX'
    | 'CLEAN_FEED'
    | 'MONITOR'
    | 'RECORD'
    | 'STREAM'
    | 'CUSTOM';
  targetId: string;
  targetGeneration: number;
  channelLayout?: AudioChannelLayout;
  sampleRateHz?: number;
}>;
export type AudioEqBandDefinition = Readonly<{
  bandId: string;
  bandVersion: string;
  bandGeneration: number;
  processorType: AudioEqDynamicsProcessorType;
  enabled: boolean;
  frequencyHz: number;
  gainDb: number;
  q: number;
  bandwidthOctaves?: number;
  slopeDbPerOctave: number;
  filterOrder: number;
  channelSelection: readonly string[];
  phaseMode: 'MINIMUM_PHASE' | 'LINEAR_PHASE_METADATA' | 'ZERO_LATENCY_METADATA' | 'CUSTOM';
  processingPrecision: 'F32' | 'F64' | 'SYNTHETIC';
  parameterPrecedence: 'Q' | 'BANDWIDTH' | 'SLOPE';
  safeMetadata: Record<string, Json>;
}>;
export type AudioEqChainDefinition = Readonly<{
  chainId: string;
  chainVersion: string;
  chainGeneration: number;
  target: AudioTargetReference;
  insertionPoint: AudioEqDynamicsInsertionPoint;
  orderedBandIds: readonly string[];
  enabled: boolean;
  bypass: boolean;
  wetDryMix: number;
  processingMode: 'SERIAL' | 'PARALLEL_METADATA';
  precision: 'F32' | 'F64' | 'SYNTHETIC';
  qualityTier: 'LOW_LATENCY' | 'BALANCED' | 'HIGH_QUALITY' | 'SYNTHETIC';
  safeMetadata: Record<string, Json>;
  createdAtNs: string;
  updatedAtNs: string;
}>;
export type AudioSidechainReference = Readonly<{
  sidechainId: string;
  sidechainGeneration: number;
  sourceStripId?: string;
  sourceBusId?: string;
  sourceSubgroupId?: string;
  sourceGeneration: number;
  tapPoint: string;
  detectorGainDb: number;
  filterMetadata: Record<string, Json>;
  channelMode: AudioDetectorChannelMode;
  selfSidechainPolicy: 'REJECT' | 'ALLOW_METADATA_ONLY';
  safeMetadata: Record<string, Json>;
}>;
export type AudioDynamicsProcessorDefinition = Readonly<{
  processorId: string;
  processorVersion: string;
  processorGeneration: number;
  processorType: AudioEqDynamicsProcessorType;
  target: AudioTargetReference;
  insertionPoint: AudioEqDynamicsInsertionPoint;
  enabled: boolean;
  bypass: boolean;
  thresholdDb: number;
  ratio: number;
  attackMs: number;
  releaseMs: number;
  holdMs: number;
  kneeDb: number;
  makeupGainDb: number;
  outputCeilingDb: number;
  rangeDb: number;
  hysteresisDb: number;
  lookaheadMs: number;
  detectorMode: AudioDetectorMode;
  detectorChannelMode: AudioDetectorChannelMode;
  sidechainReferenceId?: string;
  sidechainFilterMetadata: Record<string, Json>;
  wetDryMix: number;
  autoMakeupGain: boolean;
  autoRelease: boolean;
  linkedChannelPolicy: 'INDEPENDENT' | 'LINKED' | 'CUSTOM';
  channelSelection: readonly string[];
  qualityTier: 'LOW_LATENCY' | 'BALANCED' | 'HIGH_QUALITY' | 'SYNTHETIC';
  safeMetadata: Record<string, Json>;
  createdAtNs: string;
  updatedAtNs: string;
}>;
export type AudioProcessingChainDefinition = Readonly<{
  chainId: string;
  chainVersion: string;
  chainGeneration: number;
  target: AudioTargetReference;
  insertionPoint: AudioEqDynamicsInsertionPoint;
  orderedProcessorIds: readonly string[];
  enabled: boolean;
  bypass: boolean;
  failurePolicy:
    | 'FAIL_BLOCK'
    | 'BYPASS_FAILED_PROCESSOR'
    | 'BYPASS_CHAIN'
    | 'MUTE_OPTIONAL_TARGET'
    | 'PRESERVE_PROGRAM';
  latencyMetadata: Record<string, Json>;
  temporaryMemoryBudgetBytes: number;
  qualityTier: string;
  safeMetadata: Record<string, Json>;
  createdAtNs: string;
  updatedAtNs: string;
}>;
export type AudioProcessorStateSnapshot = Readonly<Record<string, Json>>;
export type AudioEqDynamicsProcessRequest = Readonly<{
  requestId: string;
  runtimeFrame: string;
  blockSequence: number;
  samplePosition: number;
  sampleCount: number;
  targetChannelIds: readonly string[];
  targetBusIds: readonly string[];
  inputBufferReferences: readonly Record<string, Json>[];
  expectedEqChainGenerations: Record<string, number>;
  expectedDynamicsProcessorGenerations: Record<string, number>;
  expectedProcessingChainGenerations: Record<string, number>;
  expectedSidechainGenerations?: Record<string, number>;
  expectedStripRoutingGeneration: number;
  expectedMixerGeneration: number;
  expectedAudioFollowGeneration: number;
  expectedTransitionGeneration: number;
  expectedBackendGeneration: number;
  sampleFormat: AudioSampleFormat;
  channelLayout: AudioChannelLayout;
  sampleRateHz: number;
  deadlineNs: string;
  cancellationRef?: string;
  safeMetadata: Record<string, Json>;
}>;
export type AudioEqDynamicsProcessPlan = Readonly<Record<string, any>>;
export type AudioEqDynamicsProcessResult = Readonly<Record<string, any>>;
export type AudioEqDynamicsValidationReport = Readonly<Record<string, Json>>;
export type AudioEqDynamicsHealthSnapshot = Readonly<Record<string, Json>>;
export type AudioEqDynamicsTelemetrySnapshot = Readonly<Record<string, Json>>;
export type AudioEqDynamicsEngineSnapshot = Readonly<Record<string, Json>>;
export type AudioEqDynamicsBackendSnapshot = Readonly<Record<string, Json>>;
export type AudioEqDynamicsConfigurationTransaction = Readonly<Record<string, any>>;
export type AudioEqDynamicsConfigurationTransactionSnapshot =
  AudioEqDynamicsConfigurationTransaction;
export type AudioEqBandDefinitionSnapshot = AudioEqBandDefinition;
export type AudioEqChainDefinitionSnapshot = AudioEqChainDefinition;
export type AudioDynamicsProcessorDefinitionSnapshot = AudioDynamicsProcessorDefinition;
export type AudioSidechainReferenceSnapshot = AudioSidechainReference;
export type AudioProcessingChainDefinitionSnapshot = AudioProcessingChainDefinition;
export type AudioEqDynamicsProcessRequestSnapshot = AudioEqDynamicsProcessRequest;
export type AudioEqDynamicsProcessPlanSnapshot = AudioEqDynamicsProcessPlan;
export type AudioEqDynamicsProcessResultSnapshot = AudioEqDynamicsProcessResult;

export const validateAudioEqBandDefinition = (b: AudioEqBandDefinition, sampleRateHz = 48000) => {
  if (!AUDIO_EQ_FILTER_TYPES.includes(b.processorType))
    throw new AudioEqDynamicsError('AudioEqBandInvalid', 'unsupported EQ processor type');
  if (b.frequencyHz <= 0)
    throw new AudioEqDynamicsError('AudioEqBandInvalid', 'frequency must be positive');
  if (b.frequencyHz >= sampleRateHz / 2)
    throw new AudioEqDynamicsError('AudioEqBandInvalid', 'frequency must be below Nyquist');
  between(b.gainDb, -60, 60, 'gainDb');
  if (b.q <= 0 || !Number.isFinite(b.q))
    throw new AudioEqDynamicsError('AudioEqBandInvalid', 'q must be positive');
  if (![6, 12, 18, 24, 36, 48].includes(b.slopeDbPerOctave))
    throw new AudioEqDynamicsError('AudioEqBandInvalid', 'unsupported slope');
  if (![1, 2, 3, 4, 6, 8].includes(b.filterOrder))
    throw new AudioEqDynamicsError('AudioEqBandInvalid', 'unsupported filter order');
  if (b.wetDryMix !== undefined) between(b.wetDryMix, 0, 1, 'wetDryMix');
  return freeze({ ...b, safeMetadata: sanitize(b.safeMetadata || {}) });
};
const validateInsertion = (p: string) => {
  if (!AUDIO_EQ_DYNAMICS_INSERTION_POINTS.includes(p as any))
    throw new AudioEqDynamicsError('AudioEqDynamicsParameterInvalid', 'invalid insertion point');
};
const validateWetDry = (n: number) => between(n, 0, 1, 'wetDryMix');
export const validateAudioDynamicsProcessorDefinition = (p: AudioDynamicsProcessorDefinition) => {
  if (!AUDIO_DYNAMICS_PROCESSOR_TYPES.includes(p.processorType))
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'unsupported dynamics type');
  validateInsertion(p.insertionPoint);
  [
    p.thresholdDb,
    p.ratio,
    p.attackMs,
    p.releaseMs,
    p.holdMs,
    p.kneeDb,
    p.makeupGainDb,
    p.outputCeilingDb,
    p.rangeDb,
    p.hysteresisDb,
    p.lookaheadMs,
  ].forEach((x, i) => finite(x, `dyn${i}`));
  if (p.attackMs < 0 || p.releaseMs < 0 || p.holdMs < 0 || p.lookaheadMs < 0)
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'negative time');
  if ((p.processorType === 'COMPRESSOR' || p.processorType === 'LIMITER') && p.ratio < 1)
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'ratio must be >= 1');
  if ((p.processorType === 'NOISE_GATE' || p.processorType === 'EXPANDER') && p.ratio <= 0)
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'gate/expander ratio invalid');
  if (p.outputCeilingDb > 0)
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'limiter ceiling too high');
  if ((p.processorType === 'NOISE_GATE' || p.processorType === 'EXPANDER') && p.rangeDb < 0)
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'range invalid');
  validateWetDry(p.wetDryMix);
  if (!AUDIO_DETECTOR_MODES.includes(p.detectorMode))
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'detector invalid');
  if (!AUDIO_DETECTOR_CHANNEL_MODES.includes(p.detectorChannelMode))
    throw new AudioEqDynamicsError('AudioDynamicsProcessorInvalid', 'detector channel invalid');
  if (
    ['MID', 'SIDE', 'LEFT', 'RIGHT'].includes(p.detectorChannelMode) &&
    p.target.channelLayout === 'MONO'
  )
    throw new AudioEqDynamicsError(
      'AudioEqDynamicsLayoutUnsupported',
      'unsupported detector layout',
    );
  return freeze({
    ...p,
    safeMetadata: sanitize(p.safeMetadata || {}),
    sidechainFilterMetadata: sanitize(p.sidechainFilterMetadata || {}),
  });
};

export interface AudioEqDynamicsBackend {
  readonly descriptor: Readonly<Record<string, Json>>;
  readonly capabilities: Readonly<Record<string, Json>>;
  initialize(engine: any): void;
  createPlan(engine: any, request: AudioEqDynamicsProcessRequest): AudioEqDynamicsProcessPlan;
  processBlock(
    plan: AudioEqDynamicsProcessPlan,
    request: AudioEqDynamicsProcessRequest,
  ): AudioEqDynamicsProcessResult;
  resetProcessorState(processorId: string): void;
  resetTargetState(targetId: string): void;
  shutdown(): void;
}
export const createSyntheticAudioEqDynamicsBackend = (input: any = {}): AudioEqDynamicsBackend => {
  const backendId = input.backendId ?? 'synthetic-audio-eq-dynamics-backend';
  let initialized = false;
  return {
    descriptor: freeze({
      backendId,
      backendGeneration: input.backendGeneration ?? 1,
      version: AUDIO_EQ_DYNAMICS_VERSION,
      synthetic: true,
    }),
    capabilities: freeze({
      supportedSampleFormats: ['OPAQUE_SYNTHETIC', 'PCM_F32'],
      supportedSampleRates: [48000, 44100],
      supportedChannelLayouts: ['MONO', 'STEREO', 'DUAL_MONO'],
      maximumEqBands: 16,
      maximumProcessorsPerChain: 32,
      supportedFilterTypes: AUDIO_EQ_FILTER_TYPES,
      supportedDynamicsTypes: AUDIO_DYNAMICS_PROCESSOR_TYPES,
      detectorModes: AUDIO_DETECTOR_MODES,
      sidechainSupport: 'METADATA_ONLY',
      wetDrySupport: true,
      linkedChannelSupport: true,
      realEqProcessing: false,
      realDynamicsProcessing: false,
      realLimiterProcessing: false,
      deterministicBehavior: true,
      temporaryMemoryLimitBytes: 65536,
      safeMetadata: {},
    }),
    initialize() {
      initialized = true;
    },
    createPlan(engine, request) {
      if (input.failCreatePlan)
        throw new AudioEqDynamicsError('AudioEqDynamicsBackendFailed', 'synthetic plan failure');
      return engine.createPlan(request);
    },
    processBlock(plan, request) {
      if (!initialized)
        throw new AudioEqDynamicsError('AudioEqDynamicsEngineNotReady', 'backend not initialized');
      if (input.failProcess)
        throw new AudioEqDynamicsError('AudioEqDynamicsBackendFailed', 'synthetic backend failure');
      if (input.allocationFailure)
        throw new AudioEqDynamicsError(
          'AudioEqDynamicsAllocationFailed',
          'synthetic allocation failure',
        );
      if (input.timeout)
        throw new AudioEqDynamicsError('AudioEqDynamicsTimeout', 'synthetic timeout');
      const targets = [...request.targetChannelIds, ...request.targetBusIds].sort();
      const applied = plan.processorOrder.filter(
        (p: any) =>
          !plan.bypassedProcessorIds.includes(p.processorId) &&
          !plan.metadataOnlyProcessorIds.includes(p.processorId),
      );
      const bypassAll =
        plan.chainOrder.length === 0 ||
        plan.chainOrder.every((c: any) => c.bypass || !c.enabled) ||
        plan.processorOrder.every(
          (p: any) =>
            plan.bypassedProcessorIds.includes(p.bandId || p.processorId) ||
            plan.metadataOnlyProcessorIds.includes(p.bandId || p.processorId),
        );
      const sig = hash(
        JSON.stringify({
          plan: plan.planId,
          samplePosition: request.samplePosition,
          applied: applied.map((p: any) => p.processorId),
          targets,
        }),
      );
      const outputs = targets.map((targetId) =>
        freeze({
          targetId,
          outputRef: bypassAll
            ? `input:${targetId}:${request.blockSequence}`
            : `eqdyn:${targetId}:${request.blockSequence}:${sig}`,
          checksum: bypassAll ? `dry:${targetId}` : `${targetId}:${sig}`,
          ownership: 'OUTPUT_OWNED',
          containsAudioData: false,
        }),
      );
      const detectorSummaries = plan.processorOrder
        .filter((p: any) => AUDIO_DYNAMICS_PROCESSOR_TYPES.includes(p.processorType))
        .map((p: any) =>
          freeze({
            processorId: p.processorId,
            detectorMode: p.detectorMode,
            envelope: Number(
              (
                Math.abs(Math.sin((request.samplePosition + p.processorGeneration) / 997)) * -24
              ).toFixed(3),
            ),
          }),
        );
      const gainReductionSummaries = detectorSummaries.map((d: any) =>
        freeze({
          processorId: d.processorId,
          gainReductionDb: Number(Math.max(0, -18 - d.envelope).toFixed(3)),
        }),
      );
      return freeze({
        requestId: request.requestId,
        planId: plan.planId,
        status: bypassAll ? 'BYPASSED' : 'COMPLETED',
        runtimeFrame: request.runtimeFrame,
        blockSequence: request.blockSequence,
        samplePosition: request.samplePosition,
        sampleCount: request.sampleCount,
        targetIds: targets,
        processedChainIds: plan.chainOrder.map((c: any) => c.chainId),
        appliedProcessorIds: applied.map((p: any) => p.processorId),
        bypassedProcessorIds: plan.bypassedProcessorIds,
        metadataOnlyProcessorIds: plan.metadataOnlyProcessorIds,
        eqSummaries: plan.eqOperations,
        detectorSummaries,
        gainReductionSummaries,
        gateStates: detectorSummaries
          .filter((d: any) => String(d.processorId).includes('gate'))
          .map((d: any) => ({ processorId: d.processorId, open: d.envelope > -30 })),
        compressorStates: gainReductionSummaries
          .filter((d: any) => String(d.processorId).includes('comp'))
          .map((d: any) => ({
            processorId: d.processorId,
            active: d.gainReductionDb > 0,
            gainReductionDb: d.gainReductionDb,
          })),
        limiterStates: gainReductionSummaries
          .filter((d: any) => String(d.processorId).includes('lim'))
          .map((d: any) => ({
            processorId: d.processorId,
            active: d.gainReductionDb > 0,
            realLimiterApplied: false,
          })),
        sidechainSummaries: plan.sidechainDependencies,
        inputReferenceSummary: sanitize(request.inputBufferReferences),
        outputReferenceSummary: outputs,
        outputIdentityChanged: !bypassAll,
        realEqApplied: false,
        realDynamicsApplied: false,
        realLimiterApplied: false,
        warnings: plan.warnings,
        outputBytes: bypassAll ? 0 : outputs.length * 64,
        temporaryBytes: 0,
        ownershipTransfer: bypassAll ? 'PASSTHROUGH_READ_ONLY' : 'OUTPUT_OWNED',
        completedAtNs: String(BigInt(request.samplePosition) + 1n),
      });
    },
    resetProcessorState() {},
    resetTargetState() {},
    shutdown() {
      initialized = false;
    },
  };
};
export class SyntheticAudioEqDynamicsBackend {
  private b: AudioEqDynamicsBackend;
  constructor(input: any = {}) {
    this.b = createSyntheticAudioEqDynamicsBackend(input);
  }
  get descriptor() {
    return this.b.descriptor;
  }
  get capabilities() {
    return this.b.capabilities;
  }
  initialize(e: any) {
    return this.b.initialize(e);
  }
  createPlan(e: any, r: AudioEqDynamicsProcessRequest) {
    return this.b.createPlan(e, r);
  }
  processBlock(p: AudioEqDynamicsProcessPlan, r: AudioEqDynamicsProcessRequest) {
    return this.b.processBlock(p, r);
  }
  resetProcessorState(id: string) {
    return this.b.resetProcessorState(id);
  }
  resetTargetState(id: string) {
    return this.b.resetTargetState(id);
  }
  shutdown() {
    return this.b.shutdown();
  }
}

export class AudioEqDynamicsEngine {
  readonly engineId: string;
  state = 'READY';
  max: any;
  eqBands = new Map<string, AudioEqBandDefinition>();
  eqChains = new Map<string, AudioEqChainDefinition>();
  dynamics = new Map<string, AudioDynamicsProcessorDefinition>();
  processingChains = new Map<string, AudioProcessingChainDefinition>();
  sidechains = new Map<string, AudioSidechainReference>();
  backends = new Map<string, AudioEqDynamicsBackend>();
  activeBackendId?: string;
  processedRequests = new Set<string>();
  processedBlocks = new Set<string>();
  planCache = new Map<string, AudioEqDynamicsProcessPlan>();
  processorStates = new Map<string, any>();
  events: any[] = [];
  incidents: string[] = [];
  failedRejectedResults: any[] = [];
  configurationGeneration = 1;
  transactions = new Map<string, any>();
  activeTransaction?: any;
  globalEqBypass = false;
  globalDynamicsBypass = false;
  telemetry: any = {
    eqBandRegistrations: 0,
    eqBandUpdates: 0,
    eqBandRemovals: 0,
    eqChainRegistrations: 0,
    eqChainUpdates: 0,
    eqChainRemovals: 0,
    dynamicsRegistrations: 0,
    dynamicsUpdates: 0,
    dynamicsRemovals: 0,
    processingChainRegistrations: 0,
    processingChainUpdates: 0,
    processingChainRemovals: 0,
    sidechainConfigurations: 0,
    configurationValidations: 0,
    configurationCommits: 0,
    configurationRollbacks: 0,
    plansCreated: 0,
    planCacheHits: 0,
    planCacheMisses: 0,
    blocksRequested: 0,
    blocksPlanned: 0,
    blocksProcessed: 0,
    blocksCompleted: 0,
    blocksBypassed: 0,
    blocksDegraded: 0,
    blocksFailed: 0,
    blocksCancelled: 0,
    duplicateRequests: 0,
    duplicateBlocks: 0,
    staleGenerations: 0,
    invalidParameterRejects: 0,
    unsupportedFormatRejects: 0,
    unsupportedLayoutRejects: 0,
    backendFailures: 0,
    allocationFailures: 0,
    ownershipViolations: 0,
    outputBytes: 0,
    temporaryBytes: 0,
    peakTemporaryBytes: 0,
    currentRequestId: undefined,
    activeBackendId: undefined,
    lastEvent: undefined,
  };
  constructor(engineId = 'audio-eq-dynamics', max: any = {}) {
    this.engineId = engineId;
    this.max = {
      eqBandsPerChain: 16,
      processorsPerChain: 32,
      chains: 256,
      sidechains: 256,
      planCache: 512,
      states: 1024,
      ...max,
    };
    this.event('AudioEqDynamicsEngineCreated', {});
  }
  event(type: string, payload: any) {
    const e = freeze({
      type,
      engineId: this.engineId,
      sequence: this.events.length + 1,
      payload: sanitize(payload),
    });
    this.events.push(e);
    if (this.events.length > 512) this.events.shift();
    this.telemetry.lastEvent = type;
    return e;
  }
  incident(code: string) {
    this.incidents.push(code);
    if (this.incidents.length > 512) this.incidents.shift();
  }
  backend() {
    if (!this.activeBackendId)
      throw new AudioEqDynamicsError('AudioEqDynamicsEngineNotReady', 'no active backend');
    return this.backends.get(this.activeBackendId)!;
  }
  registerBackend(b: AudioEqDynamicsBackend) {
    const id = String(b.descriptor.backendId);
    if (this.backends.has(id))
      throw new AudioEqDynamicsError('DuplicateAudioEqDynamicsBackend', 'duplicate backend');
    this.backends.set(id, b);
    if (!this.activeBackendId) this.activeBackendId = id;
    b.initialize(this);
    this.telemetry.activeBackendId = this.activeBackendId;
    return freeze(b.descriptor);
  }
  registerEqBand(b: AudioEqBandDefinition) {
    if (this.eqBands.has(b.bandId))
      throw new AudioEqDynamicsError('DuplicateAudioEqBand', 'duplicate EQ band');
    const v = validateAudioEqBandDefinition(b);
    this.eqBands.set(v.bandId, v);
    this.telemetry.eqBandRegistrations++;
    this.event('AudioEqBandRegistered', { bandId: v.bandId });
    return v;
  }
  updateEqBand(b: AudioEqBandDefinition, expectedGeneration: number) {
    const old = this.eqBands.get(b.bandId);
    if (!old) throw new AudioEqDynamicsError('AudioEqBandNotFound', 'EQ band not found');
    if (old.bandGeneration !== expectedGeneration || b.bandGeneration <= old.bandGeneration)
      throw new AudioEqDynamicsError('AudioEqChainGenerationMismatch', 'stale EQ band generation');
    const v = validateAudioEqBandDefinition(b);
    this.eqBands.set(v.bandId, v);
    this.telemetry.eqBandUpdates++;
    this.resetProcessorState(v.bandId, 'processor generation change');
    this.event('AudioEqBandUpdated', { bandId: v.bandId });
    return v;
  }
  unregisterEqBand(id: string) {
    if (!this.eqBands.delete(id))
      throw new AudioEqDynamicsError('AudioEqBandNotFound', 'EQ band not found');
    this.telemetry.eqBandRemovals++;
    this.event('AudioEqBandRemoved', { bandId: id });
  }
  registerEqChain(c: AudioEqChainDefinition) {
    if (this.eqChains.has(c.chainId))
      throw new AudioEqDynamicsError('DuplicateAudioEqChain', 'duplicate EQ chain');
    validateInsertion(c.insertionPoint);
    validateWetDry(c.wetDryMix);
    if (!uniq(c.orderedBandIds))
      throw new AudioEqDynamicsError('AudioEqChainInvalid', 'duplicate band reference');
    if (c.orderedBandIds.length > this.max.eqBandsPerChain)
      throw new AudioEqDynamicsError('AudioEqChainInvalid', 'too many bands');
    for (const id of c.orderedBandIds)
      if (!this.eqBands.has(id))
        throw new AudioEqDynamicsError('AudioEqChainInvalid', 'missing band');
    const v = freeze({ ...c, safeMetadata: sanitize(c.safeMetadata || {}) });
    this.eqChains.set(v.chainId, v);
    this.telemetry.eqChainRegistrations++;
    this.event('AudioEqChainRegistered', { chainId: v.chainId });
    return v;
  }
  updateEqChain(c: AudioEqChainDefinition, expectedGeneration: number) {
    const old = this.eqChains.get(c.chainId);
    if (!old) throw new AudioEqDynamicsError('AudioEqChainNotFound', 'EQ chain not found');
    if (old.chainGeneration !== expectedGeneration || c.chainGeneration <= old.chainGeneration)
      throw new AudioEqDynamicsError('AudioEqChainGenerationMismatch', 'stale EQ chain');
    this.eqChains.delete(c.chainId);
    try {
      return this.registerEqChain(c);
    } finally {
      this.telemetry.eqChainUpdates++;
    }
  }
  registerDynamicsProcessor(p: AudioDynamicsProcessorDefinition) {
    if (this.dynamics.has(p.processorId))
      throw new AudioEqDynamicsError(
        'DuplicateAudioDynamicsProcessor',
        'duplicate dynamics processor',
      );
    if (p.sidechainReferenceId && !this.sidechains.has(p.sidechainReferenceId))
      throw new AudioEqDynamicsError('AudioSidechainSourceNotFound', 'sidechain missing');
    const v = validateAudioDynamicsProcessorDefinition(p);
    this.dynamics.set(v.processorId, v);
    this.telemetry.dynamicsRegistrations++;
    this.event('AudioDynamicsProcessorRegistered', { processorId: v.processorId });
    return v;
  }
  updateDynamicsProcessor(p: AudioDynamicsProcessorDefinition, expectedGeneration: number) {
    const old = this.dynamics.get(p.processorId);
    if (!old)
      throw new AudioEqDynamicsError('AudioDynamicsProcessorNotFound', 'processor not found');
    if (
      old.processorGeneration !== expectedGeneration ||
      p.processorGeneration <= old.processorGeneration
    )
      throw new AudioEqDynamicsError(
        'AudioDynamicsGenerationMismatch',
        'stale dynamics generation',
      );
    const v = validateAudioDynamicsProcessorDefinition(p);
    this.dynamics.set(v.processorId, v);
    this.telemetry.dynamicsUpdates++;
    this.resetProcessorState(v.processorId, 'processor generation change');
    this.event('AudioDynamicsProcessorUpdated', { processorId: v.processorId });
    return v;
  }
  configureSidechain(s: AudioSidechainReference) {
    if ((s.sourceStripId ? 1 : 0) + (s.sourceBusId ? 1 : 0) + (s.sourceSubgroupId ? 1 : 0) !== 1)
      throw new AudioEqDynamicsError(
        'AudioSidechainInvalid',
        'exactly one sidechain source required',
      );
    if (s.sourceGeneration < 1)
      throw new AudioEqDynamicsError(
        'AudioSidechainGenerationMismatch',
        'stale sidechain generation',
      );
    if (
      (s.sourceStripId || s.sourceBusId || s.sourceSubgroupId) === s.sidechainId &&
      s.selfSidechainPolicy === 'REJECT'
    ) {
      this.incident('AUDIO_SIDECHAIN_CYCLE');
      throw new AudioEqDynamicsError('AudioSidechainCycle', 'self sidechain rejected');
    }
    const v = freeze({
      ...s,
      filterMetadata: sanitize(s.filterMetadata || {}),
      safeMetadata: sanitize(s.safeMetadata || {}),
    });
    this.sidechains.set(v.sidechainId, v);
    this.telemetry.sidechainConfigurations++;
    this.event('AudioSidechainConfigured', { sidechainId: v.sidechainId });
    return v;
  }
  registerProcessingChain(c: AudioProcessingChainDefinition) {
    if (this.processingChains.has(c.chainId))
      throw new AudioEqDynamicsError('DuplicateAudioProcessingChain', 'duplicate processing chain');
    validateInsertion(c.insertionPoint);
    if (!uniq(c.orderedProcessorIds))
      throw new AudioEqDynamicsError(
        'AudioProcessingChainInvalid',
        'duplicate processor reference',
      );
    if (c.orderedProcessorIds.length > this.max.processorsPerChain)
      throw new AudioEqDynamicsError('AudioProcessingChainInvalid', 'too many processors');
    for (const id of c.orderedProcessorIds)
      if (!this.eqBands.has(id) && !this.dynamics.has(id))
        throw new AudioEqDynamicsError('AudioProcessingChainInvalid', 'missing processor');
    const v = freeze({
      ...c,
      safeMetadata: sanitize(c.safeMetadata || {}),
      latencyMetadata: sanitize(c.latencyMetadata || {}),
    });
    this.processingChains.set(v.chainId, v);
    this.telemetry.processingChainRegistrations++;
    this.event('AudioProcessingChainRegistered', { chainId: v.chainId });
    return v;
  }
  updateProcessingChain(c: AudioProcessingChainDefinition, expectedGeneration: number) {
    const old = this.processingChains.get(c.chainId);
    if (!old)
      throw new AudioEqDynamicsError('AudioProcessingChainNotFound', 'processing chain not found');
    if (old.chainGeneration !== expectedGeneration || c.chainGeneration <= old.chainGeneration)
      throw new AudioEqDynamicsError(
        'AudioProcessingChainGenerationMismatch',
        'stale processing chain',
      );
    this.processingChains.delete(c.chainId);
    const v = this.registerProcessingChain(c);
    this.telemetry.processingChainUpdates++;
    this.event('AudioProcessingChainUpdated', { chainId: v.chainId });
    return v;
  }
  planCacheKey(r: AudioEqDynamicsProcessRequest) {
    return hash(
      JSON.stringify({
        t: [...r.targetChannelIds, ...r.targetBusIds].sort(),
        e: r.expectedEqChainGenerations,
        d: r.expectedDynamicsProcessorGenerations,
        p: r.expectedProcessingChainGenerations,
        s: r.expectedSidechainGenerations,
        b: r.expectedBackendGeneration,
        g: [
          r.expectedStripRoutingGeneration,
          r.expectedMixerGeneration,
          r.expectedAudioFollowGeneration,
          r.expectedTransitionGeneration,
        ],
        pos: r.samplePosition,
        n: r.sampleCount,
        fmt: r.sampleFormat,
        layout: r.channelLayout,
      }),
    );
  }
  validateRequest(r: AudioEqDynamicsProcessRequest) {
    if (this.state === 'SHUTDOWN')
      throw new AudioEqDynamicsError('AudioEqDynamicsShutdownError', 'engine shutdown');
    validateAudioSampleFormat(r.sampleFormat);
    validateAudioChannelLayout(r.channelLayout, r.channelLayout === 'MONO' ? 1 : 2);
    if (r.samplePosition < 0 || r.sampleCount <= 0)
      throw new AudioEqDynamicsError(
        'AudioEqDynamicsParameterInvalid',
        'invalid sample position/count',
      );
    const bg = Number(this.backend().descriptor.backendGeneration ?? 1);
    if (r.expectedBackendGeneration !== bg)
      throw new AudioEqDynamicsError('AudioEqDynamicsBackendFailed', 'stale backend generation');
    for (const [id, g] of Object.entries(r.expectedEqChainGenerations || {}))
      if (this.eqChains.get(id)?.chainGeneration !== g)
        throw new AudioEqDynamicsError(
          'AudioEqChainGenerationMismatch',
          'stale EQ chain generation',
        );
    for (const [id, g] of Object.entries(r.expectedDynamicsProcessorGenerations || {}))
      if (this.dynamics.get(id)?.processorGeneration !== g)
        throw new AudioEqDynamicsError(
          'AudioDynamicsGenerationMismatch',
          'stale dynamics generation',
        );
    for (const [id, g] of Object.entries(r.expectedProcessingChainGenerations || {}))
      if (this.processingChains.get(id)?.chainGeneration !== g)
        throw new AudioEqDynamicsError(
          'AudioProcessingChainGenerationMismatch',
          'stale processing chain generation',
        );
    for (const [id, g] of Object.entries(r.expectedSidechainGenerations || {}))
      if (this.sidechains.get(id)?.sidechainGeneration !== g)
        throw new AudioEqDynamicsError(
          'AudioSidechainGenerationMismatch',
          'stale sidechain generation',
        );
  }
  createPlan(r: AudioEqDynamicsProcessRequest): AudioEqDynamicsProcessPlan {
    this.validateRequest(r);
    const key = this.planCacheKey(r);
    if (this.planCache.has(key)) {
      this.telemetry.planCacheHits++;
      return this.planCache.get(key)!;
    }
    this.telemetry.planCacheMisses++;
    const targets = [
      ...r.targetChannelIds.map((id) => `CHANNEL:${id}`),
      ...r.targetBusIds.map((id) => `BUS:${id}`),
    ].sort();
    const eqChainOrder = sorted(this.eqChains.values(), 'chainId').filter((c) =>
      targets.includes(`${c.target.targetType}:${c.target.targetId}`),
    );
    const procChainOrder = sorted(this.processingChains.values(), 'chainId').filter((c) =>
      targets.includes(`${c.target.targetType}:${c.target.targetId}`),
    );
    const procIds = [
      ...new Set([
        ...eqChainOrder.flatMap((c) => c.orderedBandIds),
        ...procChainOrder.flatMap((c) => c.orderedProcessorIds),
      ]),
    ];
    const processorOrder = procIds
      .map((id) => this.eqBands.get(id) || this.dynamics.get(id))
      .filter(Boolean);
    const metadataOnlyProcessorIds = processorOrder
      .filter((p: any) =>
        [
          'BAND_PASS_METADATA',
          'ALL_PASS_METADATA',
          'DE_ESSER_FOUNDATION',
          'SIDECHAIN_DETECTOR_FOUNDATION',
        ].includes(p.processorType),
      )
      .map((p: any) => p.bandId || p.processorId);
    const bypassedProcessorIds = processorOrder
      .filter(
        (p: any) =>
          p.bypass ||
          !p.enabled ||
          p.processorType === 'BYPASS' ||
          (this.globalEqBypass && this.eqBands.has(p.bandId)) ||
          (this.globalDynamicsBypass && this.dynamics.has(p.processorId)),
      )
      .map((p: any) => p.bandId || p.processorId);
    const sidechainDependencies = processorOrder
      .filter((p: any) => p.sidechainReferenceId)
      .map((p: any) => sanitize(this.sidechains.get(p.sidechainReferenceId)));
    const eqOperations = processorOrder
      .filter((p: any) => this.eqBands.has(p.bandId))
      .map((p: any) =>
        sanitize({
          bandId: p.bandId,
          type: p.processorType,
          frequencyHz: p.frequencyHz,
          gainDb: p.gainDb,
          q: p.q,
        }),
      );
    const plan = freeze({
      planId: `eqdyn-plan:${key}`,
      requestId: r.requestId,
      backendId: this.activeBackendId,
      backendGeneration: this.backend().descriptor.backendGeneration ?? 1,
      inputTargetOrder: targets,
      chainOrder: [...eqChainOrder, ...procChainOrder],
      processorOrder,
      resolvedParameters: processorOrder.map((p: any) => sanitize(p)),
      sidechainDependencies,
      bypassedProcessorIds,
      metadataOnlyProcessorIds,
      operationOrder: processorOrder.map((p: any) => p.bandId || p.processorId),
      expectedDetectorOperations: processorOrder.filter((p: any) =>
        this.dynamics.has(p.processorId),
      ).length,
      expectedEqOperations: eqOperations.length,
      expectedDynamicsOperations: processorOrder.filter((p: any) =>
        this.dynamics.has(p.processorId),
      ).length,
      eqOperations,
      temporaryByteEstimate: processorOrder.length * 128,
      outputByteEstimate: targets.length * 64,
      deterministicScore: hash(JSON.stringify({ targets, procIds })),
      warnings: metadataOnlyProcessorIds.map((id: string) => `${id} metadata-only`),
      safeMetadata: {},
    });
    this.planCache.set(key, plan);
    if (this.planCache.size > this.max.planCache)
      this.planCache.delete(this.planCache.keys().next().value);
    this.telemetry.plansCreated++;
    this.event('AudioProcessingPlanned', { planId: plan.planId });
    return plan;
  }
  processBlock(r: AudioEqDynamicsProcessRequest): AudioEqDynamicsProcessResult {
    this.telemetry.blocksRequested++;
    this.telemetry.currentRequestId = r.requestId;
    try {
      if (this.processedRequests.has(r.requestId)) {
        this.telemetry.duplicateRequests++;
        this.incident('AUDIO_EQ_DYNAMICS_DUPLICATE_REQUEST');
        throw new AudioEqDynamicsError('AudioEqDynamicsDuplicateRequest', 'duplicate request');
      }
      const bk = `${r.runtimeFrame}:${r.blockSequence}:${[...r.targetChannelIds, ...r.targetBusIds].sort().join('|')}`;
      if (this.processedBlocks.has(bk)) {
        this.telemetry.duplicateBlocks++;
        this.incident('AUDIO_EQ_DYNAMICS_DUPLICATE_BLOCK');
        throw new AudioEqDynamicsError('AudioEqDynamicsDuplicateBlock', 'duplicate block');
      }
      this.event('AudioProcessingRequested', { requestId: r.requestId });
      const plan = this.backend().createPlan(this, r);
      this.telemetry.blocksPlanned++;
      this.event('AudioProcessingStarted', { requestId: r.requestId });
      const result = this.backend().processBlock(plan, r);
      this.processedRequests.add(r.requestId);
      this.processedBlocks.add(bk);
      this.telemetry.blocksProcessed++;
      if (result.status === 'BYPASSED') this.telemetry.blocksBypassed++;
      else if (result.status === 'COMPLETED') this.telemetry.blocksCompleted++;
      this.telemetry.outputBytes += result.outputBytes || 0;
      this.telemetry.temporaryBytes = 0;
      this.processorStateFromResult(result);
      this.event(
        result.status === 'BYPASSED' ? 'AudioProcessingBypassed' : 'AudioProcessingCompleted',
        { requestId: r.requestId },
      );
      return result;
    } catch (e: any) {
      this.telemetry.blocksFailed++;
      const code = e?.code || e?.name || 'AudioEqDynamicsBackendFailed';
      if (String(code).includes('Generation')) {
        this.telemetry.staleGenerations++;
        this.incident(
          String(code).includes('Sidechain')
            ? 'AUDIO_SIDECHAIN_GENERATION_STALE'
            : String(code).includes('Processing')
              ? 'AUDIO_PROCESSING_CHAIN_GENERATION_STALE'
              : String(code).includes('Dynamics')
                ? 'AUDIO_DYNAMICS_GENERATION_STALE'
                : 'AUDIO_EQ_CHAIN_GENERATION_STALE',
        );
      }
      if (String(code).includes('Parameter') || String(code).includes('Invalid'))
        this.telemetry.invalidParameterRejects++;
      if (String(code).includes('Allocation')) this.telemetry.allocationFailures++;
      if (String(code).includes('Backend') || String(code).includes('Timeout'))
        this.telemetry.backendFailures++;
      const res = freeze({
        requestId: r.requestId,
        status: 'FAILED',
        error: sanitize({ code, message: e?.message }),
        outputReferenceSummary: [],
        outputBytes: 0,
        temporaryBytes: 0,
      });
      this.failedRejectedResults.push(res);
      this.event('AudioProcessingFailed', res);
      throw e;
    }
  }
  processorStateFromResult(result: any) {
    for (const g of result.gainReductionSummaries || [])
      this.processorStates.set(
        g.processorId,
        freeze({
          processorId: g.processorId,
          detectorEnvelope: g.gainReductionDb,
          gainReductionDb: g.gainReductionDb,
          previousSamplePosition: result.samplePosition,
          resetGeneration: 0,
          safeMetadata: {},
        }),
      );
    if (this.processorStates.size > this.max.states)
      this.processorStates.delete(this.processorStates.keys().next().value);
  }
  resetProcessorState(processorId: string, reason = 'explicit reset') {
    this.processorStates.delete(processorId);
    this.event('AudioProcessorStateReset', { processorId, reason });
  }
  resetTargetState(targetId: string) {
    for (const k of [...this.processorStates.keys()].filter((k) => k.includes(targetId)))
      this.processorStates.delete(k);
    this.event('AudioProcessorStateReset', { targetId });
  }
  createConfigurationTransaction(input: any) {
    const tx = freeze({
      transactionId: input.transactionId,
      transactionGeneration: input.transactionGeneration ?? 1,
      currentConfigurationGeneration: this.configurationGeneration,
      requestedConfigurationGeneration: this.configurationGeneration + 1,
      eqChainUpdates: input.eqChainUpdates ?? [],
      processorUpdates: input.processorUpdates ?? [],
      processingChainUpdates: input.processingChainUpdates ?? [],
      sidechainUpdates: input.sidechainUpdates ?? [],
      validationReport: this.validateConfiguration(),
      scheduledSamplePosition: input.scheduledSamplePosition,
      scheduledRuntimeFrame: input.scheduledRuntimeFrame,
      state: 'VALIDATED',
      failureReason: undefined,
      createdAtNs: input.createdAtNs ?? '0',
      committedAtNs: undefined,
      completedAtNs: undefined,
      safeMetadata: sanitize(input.safeMetadata || {}),
    });
    this.activeTransaction = tx;
    this.transactions.set(tx.transactionId, tx);
    this.telemetry.configurationValidations++;
    this.event('AudioProcessingConfigurationValidated', { transactionId: tx.transactionId });
    return tx;
  }
  commitConfigurationTransaction(id: string) {
    if (!this.activeTransaction || this.activeTransaction.transactionId !== id)
      throw new AudioEqDynamicsError('AudioEqDynamicsInvariantViolation', 'transaction not active');
    const tx = freeze({
      ...this.activeTransaction,
      state: 'COMMITTED',
      committedAtNs: String(this.configurationGeneration),
      completedAtNs: String(this.configurationGeneration + 1),
    });
    this.configurationGeneration++;
    this.transactions.set(id, tx);
    this.activeTransaction = undefined;
    this.telemetry.configurationCommits++;
    this.event('AudioProcessingConfigurationCommitted', { transactionId: id });
    return tx;
  }
  rollbackConfigurationTransaction(id: string) {
    if (!this.transactions.has(id))
      throw new AudioEqDynamicsError('AudioEqDynamicsInvariantViolation', 'transaction not found');
    this.activeTransaction = undefined;
    this.telemetry.configurationRollbacks++;
    this.event('AudioProcessingConfigurationRolledBack', { transactionId: id });
  }
  validateConfiguration(): AudioEqDynamicsValidationReport {
    const errors: string[] = [];
    for (const c of this.eqChains.values())
      if (!uniq(c.orderedBandIds)) errors.push(`duplicate band in ${c.chainId}`);
    for (const c of this.processingChains.values())
      if (!uniq(c.orderedProcessorIds)) errors.push(`duplicate processor in ${c.chainId}`);
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: [],
      configurationGeneration: this.configurationGeneration,
      safeMetadata: {},
    });
  }
  getHealthSnapshot(): AudioEqDynamicsHealthSnapshot {
    return freeze({
      engineState: this.state,
      healthState: this.telemetry.blocksFailed ? 'degraded' : 'healthy',
      backendCount: this.backends.size,
      activeBackendId: this.activeBackendId,
      eqBandCount: this.eqBands.size,
      eqChainCount: this.eqChains.size,
      dynamicsProcessorCount: this.dynamics.size,
      processingChainCount: this.processingChains.size,
      sidechainCount: this.sidechains.size,
      activeProcessorStateCount: this.processorStates.size,
      processedBlockCount: this.processedBlocks.size,
      completedBlockCount: this.telemetry.blocksCompleted,
      bypassedBlockCount: this.telemetry.blocksBypassed,
      degradedBlockCount: this.telemetry.blocksDegraded,
      silentBlockCount: 0,
      failedBlockCount: this.telemetry.blocksFailed,
      cancelledBlockCount: this.telemetry.blocksCancelled,
      duplicateRequestCount: this.telemetry.duplicateRequests,
      duplicateBlockCount: this.telemetry.duplicateBlocks,
      staleGenerationRejectionCount: this.telemetry.staleGenerations,
      invalidParameterCount: this.telemetry.invalidParameterRejects,
      unsupportedFormatCount: this.telemetry.unsupportedFormatRejects,
      unsupportedLayoutCount: this.telemetry.unsupportedLayoutRejects,
      sidechainFailureCount: this.incidents.filter((x) => x.includes('SIDECHAIN')).length,
      detectorResetCount: this.events.filter((e) => e.type === 'AudioProcessorStateReset').length,
      gateOpenCount: 0,
      gateCloseCount: 0,
      compressorActiveCount: 0,
      limiterActiveCount: 0,
      backendFailureCount: this.telemetry.backendFailures,
      allocationFailureCount: this.telemetry.allocationFailures,
      ownershipViolationCount: this.telemetry.ownershipViolations,
      temporaryBytes: this.telemetry.temporaryBytes,
      peakTemporaryBytes: this.telemetry.peakTemporaryBytes,
      lastSamplePosition: [...this.processedBlocks].length,
      lastSuccessfulBlock: [...this.processedBlocks].at(-1),
      lastConfigurationCommit: this.configurationGeneration,
      lastFailure: this.failedRejectedResults.at(-1)?.error,
      updatedAtNs: String(this.events.length),
    });
  }
  getTelemetrySnapshot(): AudioEqDynamicsTelemetrySnapshot {
    return freeze({ ...this.telemetry, healthSummary: this.getHealthSnapshot() });
  }
  getSnapshot(): AudioEqDynamicsEngineSnapshot {
    return freeze({
      engineId: this.engineId,
      version: AUDIO_EQ_DYNAMICS_VERSION,
      bands: sorted(this.eqBands.values(), 'bandId'),
      eqChains: sorted(this.eqChains.values(), 'chainId'),
      dynamicsProcessors: sorted(this.dynamics.values(), 'processorId'),
      processingChains: sorted(this.processingChains.values(), 'chainId'),
      sidechains: sorted(this.sidechains.values(), 'sidechainId'),
      processorStates: sorted(this.processorStates.values(), 'processorId'),
      backend: this.activeBackendId,
      health: this.getHealthSnapshot(),
      telemetry: this.getTelemetrySnapshot(),
      watchdogIncidents: [...this.incidents].sort(),
      activeTransaction: this.activeTransaction,
    });
  }
  assertInvariants() {
    if (this.planCache.size > this.max.planCache)
      throw new AudioEqDynamicsError('AudioEqDynamicsInvariantViolation', 'plan cache unbounded');
    for (const c of this.processingChains.values())
      if (!uniq(c.orderedProcessorIds))
        throw new AudioEqDynamicsError(
          'AudioEqDynamicsInvariantViolation',
          'duplicate processor reference',
        );
    if (this.telemetry.temporaryBytes !== 0)
      throw new AudioEqDynamicsError('AudioEqDynamicsInvariantViolation', 'temporary bytes leaked');
    return freeze({ valid: true, errors: [], checkedAtNs: String(this.events.length) });
  }
  shutdown() {
    if (this.state === 'SHUTDOWN') return this.getSnapshot();
    for (const b of this.backends.values()) b.shutdown();
    this.processorStates.clear();
    this.planCache.clear();
    this.activeTransaction = undefined;
    this.state = 'SHUTDOWN';
    this.event('AudioEqDynamicsEngineShutdown', {});
    return this.getSnapshot();
  }
}
export const createAudioEqDynamicsEngine = (engineId?: string, max?: any) =>
  new AudioEqDynamicsEngine(engineId, max);
export const createAudioEqDynamicsSourceGraphSnapshot = (engine: AudioEqDynamicsEngine) =>
  freeze({
    eqChainIds: sorted(engine.eqChains.values(), 'chainId').map((c) => c.chainId),
    processorIds: [
      ...sorted(engine.eqBands.values(), 'bandId').map((b) => b.bandId),
      ...sorted(engine.dynamics.values(), 'processorId').map((p) => p.processorId),
    ],
    processorTypes: [...engine.eqBands.values(), ...engine.dynamics.values()]
      .map((p: any) => p.processorType)
      .sort(),
    insertionPoints: [
      ...new Set(
        [...engine.eqChains.values(), ...engine.processingChains.values()].map(
          (c: any) => c.insertionPoint,
        ),
      ),
    ].sort(),
    bypassState: {
      globalEqBypass: engine.globalEqBypass,
      globalDynamicsBypass: engine.globalDynamicsBypass,
    },
    gainReductionSummaries: sorted(engine.processorStates.values(), 'processorId').map((s) =>
      sanitize(s),
    ),
    sidechainReferences: sorted(engine.sidechains.values(), 'sidechainId').map((s) =>
      sanitize({
        sidechainId: s.sidechainId,
        sourceGeneration: s.sourceGeneration,
        tapPoint: s.tapPoint,
        channelMode: s.channelMode,
      }),
    ),
    processingChainGeneration: Object.fromEntries(
      [...engine.processingChains.values()].map((c) => [c.chainId, c.chainGeneration]),
    ),
    processorHealth: 'metadata-only-synthetic',
    lastSamplePosition: engine.getHealthSnapshot().lastSamplePosition,
    routingEligibility: 'metadata-only',
  });

export class AudioEqDynamicsProcessor implements TickProcessor {
  readonly id = 'audio-eq-dynamics-processor';
  readonly order = AUDIO_EQ_DYNAMICS_PROCESSOR_ORDER.eqDynamics;
  readonly dependencies = ['audio-channel-strip-routing-processor'];
  constructor(readonly engine: AudioEqDynamicsEngine) {}
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const req =
      (context as any).registry?.get?.(AUDIO_EQ_DYNAMICS_OUTPUT_KEYS.processRequest) ??
      (tick as any).audioEqDynamicsRequest;
    if (!req) return;
    const result = this.engine.processBlock(req);
    (context as any).registry?.set?.(
      AUDIO_EQ_DYNAMICS_OUTPUT_KEYS.processPlan,
      this.engine.planCache.values().next().value,
    );
    (context as any).registry?.set?.(AUDIO_EQ_DYNAMICS_OUTPUT_KEYS.processResult, result);
    (context as any).registry?.set?.(
      AUDIO_EQ_DYNAMICS_OUTPUT_KEYS.engineHealth,
      this.engine.getHealthSnapshot(),
    );
    (context as any).registry?.set?.(
      AUDIO_EQ_DYNAMICS_OUTPUT_KEYS.telemetry,
      this.engine.getTelemetrySnapshot(),
    );
    return result;
  }
}
export const createAudioEqDynamicsProcessor = (engine: AudioEqDynamicsEngine) =>
  new AudioEqDynamicsProcessor(engine);
export const createAudioEqDynamicsCommandHandlers = (
  engine: AudioEqDynamicsEngine,
): readonly RuntimeCommandHandler[] =>
  AUDIO_EQ_DYNAMICS_COMMAND_TYPES.map((type) => ({
    type,
    execute(command: any) {
      const p = command.payload ?? command;
      switch (type) {
        case 'AUDIO_EQ_REGISTER_BAND':
          return engine.registerEqBand(p.band);
        case 'AUDIO_EQ_UPDATE_BAND':
          return engine.updateEqBand(p.band, p.expectedGeneration);
        case 'AUDIO_EQ_UNREGISTER_BAND':
          return engine.unregisterEqBand(p.bandId);
        case 'AUDIO_EQ_REGISTER_CHAIN':
          return engine.registerEqChain(p.chain);
        case 'AUDIO_EQ_UPDATE_CHAIN':
          return engine.updateEqChain(p.chain, p.expectedGeneration);
        case 'AUDIO_EQ_SET_BYPASS': {
          const c = engine.eqChains.get(p.chainId);
          if (!c) throw new AudioEqDynamicsError('AudioEqChainNotFound', 'chain not found');
          return engine.updateEqChain(
            {
              ...c,
              bypass: p.bypass,
              chainGeneration: c.chainGeneration + 1,
              updatedAtNs: p.updatedAtNs ?? '0',
            },
            c.chainGeneration,
          );
        }
        case 'AUDIO_EQ_SET_WET_DRY': {
          const c = engine.eqChains.get(p.chainId);
          if (!c) throw new AudioEqDynamicsError('AudioEqChainNotFound', 'chain not found');
          return engine.updateEqChain(
            {
              ...c,
              wetDryMix: p.wetDryMix,
              chainGeneration: c.chainGeneration + 1,
              updatedAtNs: p.updatedAtNs ?? '0',
            },
            c.chainGeneration,
          );
        }
        case 'AUDIO_DYNAMICS_REGISTER':
          return engine.registerDynamicsProcessor(p.processor);
        case 'AUDIO_DYNAMICS_UPDATE':
          return engine.updateDynamicsProcessor(p.processor, p.expectedGeneration);
        case 'AUDIO_DYNAMICS_SET_SIDECHAIN':
          return engine.configureSidechain(p.sidechain);
        case 'AUDIO_PROCESSING_CHAIN_REGISTER':
          return engine.registerProcessingChain(p.chain);
        case 'AUDIO_PROCESSING_CHAIN_UPDATE':
          return engine.updateProcessingChain(p.chain, p.expectedGeneration);
        case 'AUDIO_EQ_DYNAMICS_VALIDATE':
          return engine.validateConfiguration();
        case 'AUDIO_EQ_DYNAMICS_COMMIT_CONFIGURATION':
          return engine.commitConfigurationTransaction(p.transactionId);
        case 'AUDIO_EQ_DYNAMICS_ROLLBACK_CONFIGURATION':
          return engine.rollbackConfigurationTransaction(p.transactionId);
        case 'AUDIO_EQ_DYNAMICS_PROCESS_BLOCK':
          return engine.processBlock(p.request);
        case 'AUDIO_EQ_DYNAMICS_RESET_PROCESSOR':
          return engine.resetProcessorState(p.processorId);
        case 'AUDIO_EQ_DYNAMICS_RESET_TARGET':
          return engine.resetTargetState(p.targetId);
        case 'AUDIO_EQ_DYNAMICS_CLEAR_PLAN_CACHE':
          return engine.planCache.clear();
        case 'AUDIO_EQ_DYNAMICS_SHUTDOWN':
          return engine.shutdown();
        default:
          return freeze({ metadataOnly: true, type, payload: sanitize(p) });
      }
    },
  }));
