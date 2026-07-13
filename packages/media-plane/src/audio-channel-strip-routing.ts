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
  AUDIO_GAIN,
  validateAudioChannelLayout,
  validateAudioSampleFormat,
  type AudioChannelLayout,
  type AudioSampleFormat,
  type AudioPcmBufferSnapshot,
} from './audio-mixer-foundation.js';
import {
  AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS,
  type ProgramAudioRouteSnapshot,
  type PreviewAudioRouteSnapshot,
} from './audio-follow-video.js';

type Json = null | boolean | number | string | readonly Json[] | { readonly [k: string]: Json };
const SECRET = /secret|credential|token|password|native|handle|pcm|payload|url|endpoint|address/i;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(structuredClone(v));
const sanitize = (v: any, d = 0): Json => {
  if (d > 6) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return Object.freeze(v.slice(0, 128).map((x) => sanitize(x, d + 1)));
  if (typeof v === 'object')
    return Object.freeze(
      Object.fromEntries(
        Object.entries(v)
          .slice(0, 128)
          .map(([k, x]) => [k, SECRET.test(k) ? '[REDACTED]' : sanitize(x, d + 1)]),
      ),
    );
  return String(v);
};
const uniq = (xs: readonly string[]) => new Set(xs).size === xs.length;
const sorted = <T extends { [k: string]: any }>(xs: readonly T[], key: keyof T) =>
  [...xs].sort((a, b) => String(a[key]).localeCompare(String(b[key])));
const finite = (n: number, name: string) => {
  if (!Number.isFinite(n))
    throw new AudioChannelStripRoutingError('AudioChannelStripInvalid', `${name} must be finite`);
  return n;
};
const validateGain = (n: number, name: string) => {
  finite(n, name);
  if (n < 0 || n > 16)
    throw new AudioChannelStripRoutingError('AudioChannelStripInvalid', `${name} out of range`);
  return n;
};

export const AUDIO_CHANNEL_STRIP_VERSION = '5.6.2' as const;
export const AUDIO_CHANNEL_STRIP_PROCESSOR_ORDER = Object.freeze({
  transitionExecution: 500,
  audioFollowVideo: 550,
  channelStripRouting: 565,
  audioMixer: 575,
  busOrchestration: 600,
});
export const AUDIO_CHANNEL_STRIP_OUTPUT_KEYS = Object.freeze({
  channelStripDefinitions: 'audio.channelStrip.definitions',
  channelStripStates: 'audio.channelStrip.states',
  groupDefinitions: 'audio.channelStrip.groups',
  groupStates: 'audio.channelStrip.groupStates',
  vcaDefinitions: 'audio.channelStrip.vcas',
  vcaStates: 'audio.channelStrip.vcaStates',
  routingGraph: 'audio.channelStrip.routingGraph',
  routingGraphSnapshot: 'audio.channelStrip.routingGraphSnapshot',
  sends: 'audio.channelStrip.sends',
  subgroups: 'audio.channelStrip.subgroups',
  cleanFeedRoutes: 'audio.channelStrip.cleanFeeds',
  mixMinusRoutes: 'audio.channelStrip.mixMinus',
  activeConfigurationTransaction: 'audio.channelStrip.activeTransaction',
  processRequest: 'audio.channelStrip.request',
  processPlan: 'audio.channelStrip.plan',
  processResult: 'audio.channelStrip.result',
  programContributionState: 'audio.channelStrip.programContribution',
  previewContributionState: 'audio.channelStrip.previewContribution',
  auxContributionStates: 'audio.channelStrip.auxContributions',
  cleanFeedContributionState: 'audio.channelStrip.cleanFeedContribution',
  monitorContributionState: 'audio.channelStrip.monitorContribution',
  stripHealth: 'audio.channelStrip.stripHealth',
  routingHealth: 'audio.channelStrip.routingHealth',
  engineHealth: 'audio.channelStrip.engineHealth',
  telemetry: 'audio.channelStrip.telemetry',
  failedRejectedResults: 'audio.channelStrip.failedRejectedResults',
});
export const AUDIO_CHANNEL_STRIP_COMMAND_TYPES = Object.freeze([
  'AUDIO_STRIP_REGISTER',
  'AUDIO_STRIP_UPDATE',
  'AUDIO_STRIP_UNREGISTER',
  'AUDIO_STRIP_SET_TRIM',
  'AUDIO_STRIP_SET_FADER',
  'AUDIO_STRIP_SET_PAN',
  'AUDIO_STRIP_SET_BALANCE',
  'AUDIO_STRIP_SET_PHASE_INVERT',
  'AUDIO_STRIP_SET_MUTE',
  'AUDIO_STRIP_SET_SOLO',
  'AUDIO_STRIP_SET_SOLO_SAFE',
  'AUDIO_STRIP_SET_PFL',
  'AUDIO_STRIP_SET_AFL',
  'AUDIO_STRIP_LINK',
  'AUDIO_STRIP_UNLINK',
  'AUDIO_GROUP_REGISTER',
  'AUDIO_GROUP_UPDATE',
  'AUDIO_GROUP_UNREGISTER',
  'AUDIO_VCA_REGISTER',
  'AUDIO_VCA_UPDATE',
  'AUDIO_VCA_UNREGISTER',
  'AUDIO_SEND_ADD',
  'AUDIO_SEND_UPDATE',
  'AUDIO_SEND_REMOVE',
  'AUDIO_ROUTE_ADD',
  'AUDIO_ROUTE_UPDATE',
  'AUDIO_ROUTE_REMOVE',
  'AUDIO_ROUTING_GRAPH_VALIDATE',
  'AUDIO_ROUTING_GRAPH_COMMIT',
  'AUDIO_ROUTING_GRAPH_ROLLBACK',
  'AUDIO_SUBGROUP_REGISTER',
  'AUDIO_SUBGROUP_UPDATE',
  'AUDIO_SUBGROUP_UNREGISTER',
  'AUDIO_CLEAN_FEED_CONFIGURE',
  'AUDIO_MIX_MINUS_CONFIGURE',
  'AUDIO_STRIP_PROCESS_BLOCK',
  'AUDIO_STRIP_CANCEL_BLOCK',
  'AUDIO_STRIP_CLEAR_PLAN_CACHE',
  'AUDIO_STRIP_VALIDATE',
  'AUDIO_STRIP_RESET',
  'AUDIO_STRIP_SHUTDOWN',
] as const);
export const AUDIO_CHANNEL_STRIP_EVENTS = Object.freeze([
  'AudioChannelStripEngineCreated',
  'AudioChannelStripRegistered',
  'AudioChannelStripUpdated',
  'AudioChannelStripRemoved',
  'AudioChannelLinked',
  'AudioChannelUnlinked',
  'AudioGroupRegistered',
  'AudioGroupUpdated',
  'AudioGroupRemoved',
  'AudioVcaRegistered',
  'AudioVcaUpdated',
  'AudioVcaRemoved',
  'AudioSendAdded',
  'AudioSendUpdated',
  'AudioSendRemoved',
  'AudioRouteAdded',
  'AudioRouteUpdated',
  'AudioRouteRemoved',
  'AudioRoutingGraphValidated',
  'AudioRoutingGraphCommitted',
  'AudioRoutingGraphRejected',
  'AudioRoutingGraphRolledBack',
  'AudioSubgroupRegistered',
  'AudioSubgroupUpdated',
  'AudioSubgroupRemoved',
  'AudioCleanFeedConfigured',
  'AudioMixMinusConfigured',
  'ChannelStripProcessRequested',
  'ChannelStripProcessPlanned',
  'ChannelStripProcessCompleted',
  'ChannelStripProcessDegraded',
  'ChannelStripProcessCancelled',
  'ChannelStripProcessFailed',
  'AudioChannelMuteChanged',
  'AudioChannelSoloChanged',
  'AudioChannelFaderChanged',
  'AudioChannelPanChanged',
  'AudioRoutingHealthChanged',
  'AudioChannelStripEngineShutdown',
] as const);
export const AUDIO_CHANNEL_STRIP_WATCHDOG_INCIDENTS = Object.freeze([
  'AUDIO_STRIP_ENGINE_STALLED',
  'AUDIO_STRIP_BLOCK_TIMEOUT',
  'AUDIO_STRIP_DUPLICATE_REQUEST',
  'AUDIO_STRIP_DUPLICATE_BLOCK',
  'AUDIO_STRIP_GENERATION_STALE',
  'AUDIO_GROUP_GENERATION_STALE',
  'AUDIO_VCA_GENERATION_STALE',
  'AUDIO_SEND_GENERATION_STALE',
  'AUDIO_ROUTING_GRAPH_GENERATION_STALE',
  'AUDIO_ROUTING_GRAPH_CYCLE',
  'AUDIO_ROUTING_DUPLICATE_EDGE',
  'AUDIO_ROUTING_INVALID_ENDPOINT',
  'AUDIO_ROUTING_SOURCE_CONTRIBUTED_TWICE',
  'AUDIO_ROUTING_PROGRAM_ROUTE_FAILED',
  'AUDIO_ROUTING_CLEAN_FEED_FAILED',
  'AUDIO_ROUTING_MIX_MINUS_SELF_RETURN',
  'AUDIO_STRIP_LINK_CYCLE',
  'AUDIO_STRIP_GAIN_INVALID',
  'AUDIO_STRIP_PAN_INVALID',
  'AUDIO_STRIP_BACKEND_FAILED',
  'AUDIO_STRIP_ALLOCATION_FAILED',
  'AUDIO_STRIP_OWNERSHIP_VIOLATION',
  'AUDIO_STRIP_OUTPUT_REGISTRY_MISMATCH',
  'AUDIO_STRIP_SOURCE_GRAPH_MISMATCH',
  'AUDIO_STRIP_INVARIANT_FAILURE',
] as const);
export const AUDIO_CHANNEL_STRIP_GAIN_STAGE_ORDER = Object.freeze([
  'SOURCE_CONTRIBUTION',
  'INPUT_TRIM',
  'PHASE_INVERSION',
  'PAN_BALANCE_COEFFICIENTS',
  'PRE_FADER_SEND_TAP',
  'FADER_GAIN',
  'POST_FADER_SEND_TAP',
  'MUTE_RESOLUTION',
  'POST_MUTE_SEND_TAP',
  'GROUP_VCA_CONTRIBUTION',
  'DESTINATION_BUS_CONTRIBUTION',
  'BUS_MASTER_GAIN',
] as const);
export const AUDIO_MUTE_PRIORITY = Object.freeze([
  'SAFETY_MUTE',
  'SOURCE_UNAVAILABLE',
  'OPERATOR_MUTE',
  'CHANNEL_MUTE',
  'MUTE_GROUP',
  'AUDIO_FOLLOW_MUTE',
  'TRANSITION_MUTE',
  'UNMUTED',
] as const);
export const AUDIO_PAN_LAWS = Object.freeze([
  'LINEAR',
  'CONSTANT_POWER',
  'MINUS_3_DB_CENTER',
  'MINUS_4_5_DB_CENTER',
  'MINUS_6_DB_CENTER',
  'CUSTOM_TYPED',
] as const);
export const AUDIO_ROUTING_TAP_POINTS = Object.freeze([
  'PRE_TRIM',
  'POST_TRIM',
  'PRE_FADER',
  'POST_FADER',
  'PRE_MUTE',
  'POST_MUTE',
  'PRE_GROUP',
  'POST_GROUP',
  'CUSTOM',
] as const);

export class AudioChannelStripRoutingError extends RuntimeEngineError {
  constructor(code: string, message: string, metadata: any = {}) {
    super(code, message, sanitize(metadata) as any);
  }
}
export const AudioChannelStripEngineNotReady = AudioChannelStripRoutingError;
export const AudioChannelStripNotFound = AudioChannelStripRoutingError;
export const DuplicateAudioChannelStrip = AudioChannelStripRoutingError;
export const AudioChannelStripInvalid = AudioChannelStripRoutingError;

export type AudioChannelFormat = 'MONO' | 'STEREO' | 'DUAL_MONO';
export type AudioPanMode =
  | 'MONO_PAN'
  | 'STEREO_BALANCE'
  | 'DUAL_MONO_BALANCE'
  | 'CENTER'
  | 'LEFT'
  | 'RIGHT'
  | 'CUSTOM_NORMALIZED';
export type AudioPhaseInvertMode = 'NONE' | 'LEFT' | 'RIGHT' | 'ALL' | 'CUSTOM';
export type AudioSoloMode =
  'SOLO_IN_PLACE' | 'PFL' | 'AFL' | 'EXCLUSIVE_SOLO' | 'ADDITIVE_SOLO' | 'SOLO_SAFE' | 'NONE';
export type AudioGroupType =
  'MUTE_GROUP' | 'SOLO_GROUP' | 'FADER_GROUP' | 'ROUTING_GROUP' | 'MONITOR_GROUP' | 'CUSTOM';
export type AudioRoutingEndpointType =
  | 'CHANNEL_INPUT'
  | 'CHANNEL_STRIP'
  | 'SUBGROUP'
  | 'PROGRAM_BUS'
  | 'PREVIEW_BUS'
  | 'AUX_BUS'
  | 'CLEAN_FEED_BUS'
  | 'MONITOR_BUS'
  | 'RECORD_BUS'
  | 'STREAM_BUS'
  | 'CUSTOM_BUS';
export type AudioRoutingCyclePolicy =
  'REJECT_ALL_CYCLES' | 'ALLOW_APPROVED_FEEDBACK_METADATA' | 'CUSTOM';
export type ChannelStripProcessStatus =
  'COMPLETED' | 'DEGRADED' | 'SILENT' | 'CANCELLED' | 'FAILED' | 'REJECTED';
export interface AudioRoutingEndpoint {
  readonly endpointType: AudioRoutingEndpointType;
  readonly endpointId: string;
  readonly endpointGeneration: number;
}
export interface AudioChannelStripDefinition {
  readonly stripId: string;
  readonly stripVersion: string;
  readonly stripGeneration: number;
  readonly channelId: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly sourceGeneration: number;
  readonly streamGeneration: number;
  readonly displayName: string;
  readonly role: string;
  readonly channelFormat: AudioChannelFormat;
  readonly sampleRate: number;
  readonly channelLayout: AudioChannelLayout;
  readonly inputTrimDb: number;
  readonly inputTrimLinear: number;
  readonly phaseInvert: {
    readonly mode: AudioPhaseInvertMode;
    readonly channelLabels: readonly string[];
  };
  readonly pan: number;
  readonly balance: number;
  readonly panMode: AudioPanMode;
  readonly panLaw: (typeof AUDIO_PAN_LAWS)[number];
  readonly faderDb: number;
  readonly faderLinear: number;
  readonly mute: boolean;
  readonly solo: AudioSoloMode;
  readonly soloSafe: boolean;
  readonly preFaderListen: boolean;
  readonly afterFaderListen: boolean;
  readonly enabled: boolean;
  readonly audioFollowVideo: boolean;
  readonly transitionContribution: boolean;
  readonly groupIds: readonly string[];
  readonly linkedStripIds: readonly string[];
  readonly sendIds: readonly string[];
  readonly routingEdgeIds: readonly string[];
  readonly monitorPolicy: string;
  readonly metadata: Readonly<Record<string, Json>>;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
}
export type AudioChannelStripDefinitionSnapshot = AudioChannelStripDefinition;
export interface AudioChannelStripState {
  readonly stripId: string;
  readonly stripGeneration: number;
  readonly runtimeFrame: string;
  readonly currentSamplePosition: number;
  readonly active: boolean;
  readonly available: boolean;
  readonly muted: boolean;
  readonly soloed: boolean;
  readonly effectivelyMuted: boolean;
  readonly effectiveMuteReason: string;
  readonly soloSafe: boolean;
  readonly preFaderListen: boolean;
  readonly afterFaderListen: boolean;
  readonly effectiveInputTrim: number;
  readonly effectiveFaderGain: number;
  readonly effectivePan: { readonly left: number; readonly right: number };
  readonly effectiveBalance: number;
  readonly groupGainContribution: number;
  readonly vcaContribution: number;
  readonly transitionContribution: number;
  readonly audioFollowContribution: number;
  readonly activeSends: readonly string[];
  readonly activeRoutes: readonly string[];
  readonly lastProcessedBlock?: number;
  readonly health: string;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioChannelStripStateSnapshot = AudioChannelStripState;
export interface AudioChannelGroupDefinition {
  readonly groupId: string;
  readonly version: string;
  readonly generation: number;
  readonly groupType: AudioGroupType;
  readonly memberStripIds: readonly string[];
  readonly masterValue: number;
  readonly enabled: boolean;
  readonly priority: number;
  readonly conflictPolicy: string;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioChannelGroupSnapshot = AudioChannelGroupDefinition;
export interface AudioVcaDefinition {
  readonly vcaId: string;
  readonly generation: number;
  readonly memberStripIds: readonly string[];
  readonly controlGain: number;
  readonly mute: boolean;
  readonly solo: AudioSoloMode;
  readonly priority: number;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioVcaSnapshot = AudioVcaDefinition;
export interface AudioRoutingEdge {
  readonly edgeId: string;
  readonly edgeVersion: string;
  readonly edgeGeneration: number;
  readonly source: AudioRoutingEndpoint;
  readonly destination: AudioRoutingEndpoint;
  readonly tapPoint: (typeof AUDIO_ROUTING_TAP_POINTS)[number];
  readonly gain: number;
  readonly panOverride?: number;
  readonly muteOverride?: boolean;
  readonly enabled: boolean;
  readonly priority: number;
  readonly feedbackAllowed: boolean;
  readonly latencyMetadata: Readonly<Record<string, Json>>;
  readonly audioFollowVideo: boolean;
  readonly transitionContribution: boolean;
  readonly cleanFeedEligible: boolean;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioRoutingEdgeSnapshot = AudioRoutingEdge;
export type AudioRoutingEndpointSnapshot = AudioRoutingEndpoint;
export interface AudioBusSend {
  readonly sendId: string;
  readonly version: string;
  readonly generation: number;
  readonly sourceStripId: string;
  readonly destination: AudioRoutingEndpoint;
  readonly tapPoint: (typeof AUDIO_ROUTING_TAP_POINTS)[number];
  readonly gain: number;
  readonly panOverride?: number;
  readonly muteOverride?: boolean;
  readonly enabled: boolean;
  readonly priority: number;
  readonly audioFollowVideo: boolean;
  readonly transitionContribution: boolean;
  readonly cleanFeedInclusion: boolean;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioSendSnapshot = AudioBusSend;
export interface AudioRoutingGraph {
  readonly graphId: string;
  readonly graphVersion: string;
  readonly graphGeneration: number;
  readonly nodes: readonly AudioRoutingEndpoint[];
  readonly edges: readonly AudioRoutingEdge[];
  readonly topologicalOrder: readonly string[];
  readonly cyclePolicy: AudioRoutingCyclePolicy;
  readonly health: string;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioRoutingGraphSnapshot = AudioRoutingGraph;
export interface AudioSubgroupDefinition {
  readonly subgroupId: string;
  readonly version: string;
  readonly generation: number;
  readonly role: string;
  readonly inputStripIds: readonly string[];
  readonly outputRouteIds: readonly string[];
  readonly masterGain: number;
  readonly mute: boolean;
  readonly solo: boolean;
  readonly sampleFormat: AudioSampleFormat;
  readonly sampleRate: number;
  readonly channelLayout: AudioChannelLayout;
  readonly criticality: string;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioSubgroupSnapshot = AudioSubgroupDefinition;
export interface AudioCleanFeedRoutingSnapshot {
  readonly cleanFeedId: string;
  readonly generation: number;
  readonly destinationBusId: string;
  readonly excludedRoles: readonly string[];
  readonly excludedStripIds: readonly string[];
  readonly metadata: Readonly<Record<string, Json>>;
}
export interface AudioMixMinusSnapshot {
  readonly mixMinusId: string;
  readonly generation: number;
  readonly destinationBusId: string;
  readonly excludedStripIds: readonly string[];
  readonly selfReturnAllowed: boolean;
  readonly metadata: Readonly<Record<string, Json>>;
}
export interface AudioRoutingConfigurationTransaction {
  readonly transactionId: string;
  readonly transactionGeneration: number;
  readonly currentGraphGeneration: number;
  readonly requestedGraphGeneration: number;
  readonly stripUpdates: readonly string[];
  readonly groupUpdates: readonly string[];
  readonly sendUpdates: readonly string[];
  readonly routeUpdates: readonly string[];
  readonly validationReport: AudioChannelStripRoutingValidationReport;
  readonly scheduledSamplePosition?: number;
  readonly scheduledRuntimeFrame?: string;
  readonly state:
    | 'CREATED'
    | 'VALIDATING'
    | 'READY'
    | 'SCHEDULED'
    | 'COMMITTING'
    | 'COMMITTED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'FAILED'
    | 'ROLLED_BACK';
  readonly failureReason?: string;
  readonly createdAtNs: string;
  readonly committedAtNs?: string;
  readonly completedAtNs?: string;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type AudioRoutingConfigurationTransactionSnapshot = AudioRoutingConfigurationTransaction;
export interface ChannelStripProcessRequest {
  readonly requestId: string;
  readonly runtimeFrame: string;
  readonly blockSequence: number;
  readonly samplePosition: number;
  readonly sampleCount: number;
  readonly inputBufferRefs: readonly AudioPcmBufferSnapshot[];
  readonly expectedStripGenerations: Readonly<Record<string, number>>;
  readonly expectedGroupGenerations: Readonly<Record<string, number>>;
  readonly expectedSendGenerations: Readonly<Record<string, number>>;
  readonly expectedRoutingGraphGeneration: number;
  readonly expectedAudioFollowGeneration: number;
  readonly expectedTransitionGeneration: number;
  readonly expectedMixerGeneration: number;
  readonly outputBusIds: readonly string[];
  readonly deadlineNs: string;
  readonly cancellationRef?: string;
  readonly metadata: Readonly<Record<string, Json>>;
}
export type ChannelStripProcessRequestSnapshot = ChannelStripProcessRequest;
export interface ChannelStripProcessPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly graphId: string;
  readonly graphGeneration: number;
  readonly orderedStripIds: readonly string[];
  readonly orderedGroupIds: readonly string[];
  readonly orderedRoutingEdges: readonly AudioRoutingEdge[];
  readonly resolvedMuteStates: Readonly<Record<string, string>>;
  readonly resolvedSoloStates: Readonly<Record<string, boolean>>;
  readonly resolvedLinkedControls: readonly Json[];
  readonly resolvedVcaContributions: Readonly<Record<string, number>>;
  readonly resolvedSends: readonly AudioBusSend[];
  readonly resolvedAudioFollowContributions: Readonly<Record<string, number>>;
  readonly resolvedTransitionContributions: Readonly<Record<string, number>>;
  readonly outputBusOrder: readonly string[];
  readonly operationOrder: readonly string[];
  readonly expectedOperationCount: number;
  readonly temporaryByteEstimate: number;
  readonly outputByteEstimate: number;
  readonly deterministicScore: string;
  readonly warnings: readonly string[];
  readonly metadata: Readonly<Record<string, Json>>;
}
export type ChannelStripProcessPlanSnapshot = ChannelStripProcessPlan;
export interface ChannelStripProcessResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: ChannelStripProcessStatus;
  readonly runtimeFrame: string;
  readonly blockSequence: number;
  readonly samplePosition: number;
  readonly sampleCount: number;
  readonly processedStripIds: readonly string[];
  readonly mutedStripIds: readonly string[];
  readonly soloedStripIds: readonly string[];
  readonly pflStripIds: readonly string[];
  readonly aflStripIds: readonly string[];
  readonly groupSummaries: readonly Json[];
  readonly vcaSummaries: readonly Json[];
  readonly sendSummaries: readonly Json[];
  readonly routeSummaries: readonly Json[];
  readonly programContributionSummary: Json;
  readonly previewContributionSummary: Json;
  readonly auxSummaries: readonly Json[];
  readonly cleanFeedSummary: Json;
  readonly monitorSummary: Json;
  readonly outputReferences: readonly Json[];
  readonly droppedStrips: readonly string[];
  readonly degradedStrips: readonly string[];
  readonly warnings: readonly string[];
  readonly realPcmProcessingApplied: boolean;
  readonly outputBytes: number;
  readonly temporaryBytes: number;
  readonly ownershipTransfer: string;
  readonly completedAtNs: string;
}
export type ChannelStripProcessResultSnapshot = ChannelStripProcessResult;
export interface AudioChannelStripRoutingValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly topologicalOrder: readonly string[];
  readonly duplicateRoutes: readonly string[];
  readonly cycles: readonly string[];
  readonly metadata: Readonly<Record<string, Json>>;
}
export interface AudioChannelStripRoutingHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly activeBackendId?: string;
  readonly stripCount: number;
  readonly activeStripCount: number;
  readonly linkedStripCount: number;
  readonly groupCount: number;
  readonly vcaCount: number;
  readonly sendCount: number;
  readonly routingEdgeCount: number;
  readonly subgroupCount: number;
  readonly cleanFeedRouteCount: number;
  readonly mixMinusRouteCount: number;
  readonly routingGraphGeneration: number;
  readonly activeConfigurationTransactionCount: number;
  readonly processedBlockCount: number;
  readonly completedBlockCount: number;
  readonly degradedBlockCount: number;
  readonly failedBlockCount: number;
  readonly cancelledBlockCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateBlockCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly cycleRejectionCount: number;
  readonly duplicateRouteRejectionCount: number;
  readonly invalidRouteCount: number;
  readonly ownershipViolationCount: number;
  readonly programRouteFailureCount: number;
  readonly previewRouteFailureCount: number;
  readonly optionalRouteFailureCount: number;
  readonly currentSamplePosition: number;
  readonly lastSuccessfulBlock?: number;
  readonly lastGraphCommit?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export type AudioChannelStripRoutingTelemetrySnapshot = Readonly<Record<string, Json>>;
export type AudioChannelStripBackendSnapshot = Readonly<Record<string, Json>>;
export type AudioChannelLinkSnapshot = Readonly<Record<string, Json>>;
export type AudioChannelStripRoutingEngineSnapshot = Readonly<Record<string, Json>>;

export const dbToLinear = AUDIO_GAIN.dbToLinear;
export const linearToDb = AUDIO_GAIN.linearToDb;
export const resolvePanCoefficients = (
  mode: AudioPanMode,
  value: number,
  law: (typeof AUDIO_PAN_LAWS)[number],
  layout: AudioChannelLayout,
) => {
  finite(value, 'pan');
  if (layout !== 'MONO' && layout !== 'STEREO' && layout !== 'DUAL_MONO')
    throw new AudioChannelStripRoutingError('AudioChannelStripInvalid', 'unsupported surround pan');
  const v = Math.max(-1, Math.min(1, value));
  if (mode === 'LEFT') return freeze({ left: 1, right: 0 });
  if (mode === 'RIGHT') return freeze({ left: 0, right: 1 });
  if (mode === 'CENTER') return freeze({ left: 1, right: 1 });
  if (law === 'CONSTANT_POWER' || law === 'MINUS_3_DB_CENTER')
    return freeze({
      left: Math.cos(((v + 1) * Math.PI) / 4),
      right: Math.sin(((v + 1) * Math.PI) / 4),
    });
  if (law === 'MINUS_4_5_DB_CENTER')
    return freeze({ left: v <= 0 ? 1 : 1 - v * 0.405, right: v >= 0 ? 1 : 1 + v * 0.405 });
  if (law === 'MINUS_6_DB_CENTER') return freeze({ left: (1 - v) / 2, right: (1 + v) / 2 });
  return freeze({ left: v <= 0 ? 1 : 1 - v, right: v >= 0 ? 1 : 1 + v });
};
const endpointKey = (e: AudioRoutingEndpoint) => `${e.endpointType}:${e.endpointId}`;
export const validateRoutingGraph = (
  graph: Omit<AudioRoutingGraph, 'topologicalOrder' | 'health'> & {
    topologicalOrder?: readonly string[];
    health?: string;
  },
): AudioChannelStripRoutingValidationReport => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const edgeKeys = graph.edges.map(
    (e) => `${endpointKey(e.source)}>${endpointKey(e.destination)}@${e.tapPoint}`,
  );
  const dups = edgeKeys.filter((x, i) => edgeKeys.indexOf(x) !== i);
  if (dups.length) errors.push('duplicate route edge');
  for (const e of graph.edges) {
    if (!AUDIO_ROUTING_TAP_POINTS.includes(e.tapPoint))
      errors.push(`unsupported tap ${e.tapPoint}`);
    if (!e.feedbackAllowed && endpointKey(e.source) === endpointKey(e.destination))
      errors.push('direct cycle');
    validateGain(e.gain, 'edge gain');
  }
  const nodes = [
    ...new Set([
      ...graph.nodes.map(endpointKey),
      ...graph.edges.flatMap((e) => [endpointKey(e.source), endpointKey(e.destination)]),
    ]),
  ].sort();
  const indeg = Object.fromEntries(nodes.map((n) => [n, 0]));
  const adj = Object.fromEntries(nodes.map((n) => [n, []]));
  for (const e of graph.edges.filter((e) => e.enabled)) {
    const a = endpointKey(e.source),
      b = endpointKey(e.destination);
    adj[a].push(b);
    indeg[b]++;
  }
  const q = nodes.filter((n) => indeg[n] === 0).sort();
  const order: string[] = [];
  while (q.length) {
    const n = q.shift();
    order.push(n);
    for (const m of adj[n].sort()) {
      indeg[m]--;
      if (indeg[m] === 0) (q.push(m), q.sort());
    }
  }
  if (order.length !== nodes.length) errors.push('routing graph cycle');
  return freeze({
    valid: errors.length === 0,
    errors,
    warnings,
    topologicalOrder: order,
    duplicateRoutes: [...new Set(dups)].sort(),
    cycles: errors.filter((e) => e.includes('cycle')),
    metadata: {},
  });
};

export interface AudioChannelStripBackend {
  readonly descriptor: Readonly<Record<string, Json>>;
  readonly capabilities: Readonly<Record<string, Json>>;
  initialize(engine: any): void;
  createPlan(engine: any, request: ChannelStripProcessRequest): ChannelStripProcessPlan;
  process(
    plan: ChannelStripProcessPlan,
    request: ChannelStripProcessRequest,
  ): ChannelStripProcessResult;
  reset(): void;
  shutdown(): void;
}
export const createSyntheticAudioChannelStripBackend = (
  input: any = {},
): AudioChannelStripBackend => {
  const backendId = input.backendId ?? 'synthetic-channel-strip-backend';
  let initialized = false;
  let currentEngine: any;
  return {
    descriptor: freeze({ backendId, version: AUDIO_CHANNEL_STRIP_VERSION, synthetic: true }),
    capabilities: freeze({
      gain: true,
      phaseInversion: true,
      monoPan: true,
      stereoBalance: true,
      mute: true,
      solo: true,
      pflAflMetadata: true,
      groups: true,
      vcaControlMetadata: true,
      prePostFaderSends: true,
      subgroupRouting: true,
      cleanFeedRouting: true,
      mixMinusMetadata: true,
      realPcmProcessing: false,
      maximumStrips: 256,
      maximumGroups: 128,
      maximumSends: 512,
      maximumEdges: 1024,
      deterministicBehavior: true,
    }),
    initialize(engine) {
      initialized = true;
      currentEngine = engine;
    },
    createPlan(engine, request) {
      if (input.failCreatePlan)
        throw new AudioChannelStripRoutingError(
          'AudioChannelStripBackendFailed',
          'synthetic plan failure',
        );
      return engine.createPlan(request);
    },
    process(plan, request) {
      if (!initialized)
        throw new AudioChannelStripRoutingError(
          'AudioChannelStripEngineNotReady',
          'backend not initialized',
        );
      if (input.failProcess)
        throw new AudioChannelStripRoutingError(
          'AudioChannelStripBackendFailed',
          'synthetic backend failure',
        );
      if (input.allocationFailure)
        throw new AudioChannelStripRoutingError(
          'AudioChannelStripAllocationFailed',
          'synthetic allocation failure',
        );
      if (input.timeout)
        throw new AudioChannelStripRoutingError('AudioChannelStripTimeout', 'synthetic timeout');
      const outputs = plan.outputBusOrder.map((busId) =>
        freeze({
          outputRef: `synthetic:${busId}:${request.blockSequence}:${plan.deterministicScore}`,
          busId,
          checksum: `${busId}:${plan.orderedStripIds.join('|')}:${plan.orderedRoutingEdges.map((e) => e.edgeId).join('|')}`,
          ownership: 'OUTPUT_OWNED',
          containsAudioData: false,
        }),
      );
      return freeze({
        requestId: request.requestId,
        planId: plan.planId,
        status: plan.orderedStripIds.length ? 'COMPLETED' : 'SILENT',
        runtimeFrame: request.runtimeFrame,
        blockSequence: request.blockSequence,
        samplePosition: request.samplePosition,
        sampleCount: request.sampleCount,
        processedStripIds: plan.orderedStripIds,
        mutedStripIds: Object.entries(plan.resolvedMuteStates)
          .filter(([, v]) => v !== 'UNMUTED')
          .map(([k]) => k)
          .sort(),
        soloedStripIds: Object.entries(plan.resolvedSoloStates)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .sort(),
        pflStripIds: plan.orderedStripIds.filter(
          (id) => currentEngine.strips.get(id)?.preFaderListen,
        ),
        aflStripIds: plan.orderedStripIds.filter(
          (id) => currentEngine.strips.get(id)?.afterFaderListen,
        ),
        groupSummaries: plan.orderedGroupIds.map((groupId) =>
          sanitize(currentEngine.groups.get(groupId)),
        ),
        vcaSummaries: Object.entries(plan.resolvedVcaContributions).map(([stripId, gain]) =>
          sanitize({ stripId, gain }),
        ),
        sendSummaries: plan.resolvedSends.map((s) =>
          sanitize({ sendId: s.sendId, tapPoint: s.tapPoint, gain: s.gain }),
        ),
        routeSummaries: plan.orderedRoutingEdges.map((e) =>
          sanitize({
            edgeId: e.edgeId,
            destination: e.destination.endpointId,
            tapPoint: e.tapPoint,
            gain: e.gain,
          }),
        ),
        programContributionSummary: sanitize({
          bus: 'PROGRAM',
          count: outputs.filter((o) => String(o.busId).includes('program')).length,
        }),
        previewContributionSummary: sanitize({
          bus: 'PREVIEW',
          count: outputs.filter((o) => String(o.busId).includes('preview')).length,
        }),
        auxSummaries: outputs
          .filter((o) => String(o.busId).includes('aux'))
          .map((o) => sanitize(o)),
        cleanFeedSummary: sanitize({ bus: 'CLEAN_FEED', excluded: currentEngine.cleanFeeds.size }),
        monitorSummary: sanitize({
          bus: 'MONITOR',
          pfl: plan.orderedStripIds.filter((id) => currentEngine.strips.get(id)?.preFaderListen)
            .length,
          afl: plan.orderedStripIds.filter((id) => currentEngine.strips.get(id)?.afterFaderListen)
            .length,
        }),
        outputReferences: outputs,
        droppedStrips: [],
        degradedStrips: [],
        warnings: plan.warnings,
        realPcmProcessingApplied: false,
        outputBytes: outputs.length * 64,
        temporaryBytes: 0,
        ownershipTransfer: 'OUTPUT_OWNED',
        completedAtNs: String(BigInt(request.samplePosition) + 1n),
      });
    },
    reset() {},
    shutdown() {
      initialized = false;
    },
  };
};
export class SyntheticAudioChannelStripBackend {
  private b = createSyntheticAudioChannelStripBackend();
  get descriptor() {
    return this.b.descriptor;
  }
  get capabilities() {
    return this.b.capabilities;
  }
  initialize(e: any) {
    return this.b.initialize(e);
  }
  createPlan(e: any, r: ChannelStripProcessRequest) {
    return this.b.createPlan(e, r);
  }
  process(p: ChannelStripProcessPlan, r: ChannelStripProcessRequest) {
    return this.b.process(p, r);
  }
  reset() {
    return this.b.reset();
  }
  shutdown() {
    return this.b.shutdown();
  }
}

export class AudioChannelStripRoutingEngine {
  readonly engineId: string;
  readonly max: any;
  state = 'READY';
  strips = new Map<string, AudioChannelStripDefinition>();
  groups = new Map<string, AudioChannelGroupDefinition>();
  vcas = new Map<string, AudioVcaDefinition>();
  sends = new Map<string, AudioBusSend>();
  subgroups = new Map<string, AudioSubgroupDefinition>();
  cleanFeeds = new Map<string, AudioCleanFeedRoutingSnapshot>();
  mixMinus = new Map<string, AudioMixMinusSnapshot>();
  backends = new Map<string, AudioChannelStripBackend>();
  processedRequests = new Set<string>();
  processedBlocks = new Set<string>();
  planCache = new Map<string, ChannelStripProcessPlan>();
  events: any[] = [];
  incidents: string[] = [];
  currentGraph: AudioRoutingGraph;
  activeBackendId?: string;
  telemetry: any = {
    stripRegistrations: 0,
    stripUpdates: 0,
    stripRemovals: 0,
    linkOperations: 0,
    unlinkOperations: 0,
    groupRegistrations: 0,
    vcaRegistrations: 0,
    sendAdditions: 0,
    routeAdditions: 0,
    graphValidations: 0,
    graphCommits: 0,
    graphRejections: 0,
    processRequests: 0,
    processPlans: 0,
    processCompletions: 0,
    processFailures: 0,
    duplicateRequests: 0,
    duplicateBlocks: 0,
    staleGenerations: 0,
    cycleRejections: 0,
    invalidRoutes: 0,
    currentRequestId: undefined,
    activeGraphId: 'default',
    lastEvent: undefined,
    healthSummary: 'healthy',
  };
  constructor(input: any = {}) {
    this.engineId = input.engineId ?? 'audio-channel-strip-routing';
    this.max = {
      strips: 256,
      groups: 128,
      vcas: 128,
      sends: 512,
      edges: 1024,
      subgroups: 64,
      cache: 256,
      ...input.maximums,
    };
    this.currentGraph = freeze({
      graphId: 'routing:empty',
      graphVersion: AUDIO_CHANNEL_STRIP_VERSION,
      graphGeneration: 1,
      nodes: [],
      edges: [],
      topologicalOrder: [],
      cyclePolicy: 'REJECT_ALL_CYCLES',
      health: 'healthy',
      metadata: {},
    });
    this.emit('AudioChannelStripEngineCreated', {});
  }
  now() {
    return String(BigInt(this.events.length + 1));
  }
  emit(type: string, metadata: any) {
    const e = freeze({
      id: `${type}:${this.events.length + 1}`,
      type,
      atNs: this.now(),
      metadata: sanitize(metadata),
    });
    this.events = [e, ...this.events].slice(0, 256);
    this.telemetry.lastEvent = type;
    return e;
  }
  incident(code: string) {
    this.incidents = [code, ...this.incidents].slice(0, 256);
  }
  registerBackend(b: AudioChannelStripBackend) {
    const id = String(b.descriptor.backendId);
    if (this.backends.has(id))
      throw new AudioChannelStripRoutingError(
        'DuplicateAudioChannelStripBackend',
        `duplicate backend ${id}`,
      );
    this.backends.set(id, b);
    if (!this.activeBackendId) this.activeBackendId = [...this.backends.keys()].sort()[0];
    b.initialize(this);
    return this.snapshot();
  }
  backend() {
    if (!this.activeBackendId) this.registerBackend(createSyntheticAudioChannelStripBackend());
    return this.backends.get(this.activeBackendId)!;
  }
  makeStrip(
    input: Partial<AudioChannelStripDefinition> & {
      stripId: string;
      channelId: string;
      sourceId: string;
      streamId?: string;
    },
  ): AudioChannelStripDefinition {
    const trimDb = input.inputTrimDb ?? 0,
      trim = input.inputTrimLinear ?? dbToLinear(trimDb),
      faderDb = input.faderDb ?? 0,
      fader = input.faderLinear ?? dbToLinear(faderDb);
    validateGain(trim, 'inputTrimLinear');
    validateGain(fader, 'faderLinear');
    if (Math.abs(trim - dbToLinear(trimDb)) > 1e-6 && trimDb > -120)
      throw new AudioChannelStripRoutingError(
        'AudioChannelStripInvalid',
        'trim dB/linear mismatch',
      );
    if (Math.abs(fader - dbToLinear(faderDb)) > 1e-6 && faderDb > -120)
      throw new AudioChannelStripRoutingError(
        'AudioChannelStripInvalid',
        'fader dB/linear mismatch',
      );
    validateAudioSampleFormat((input as any).sampleFormat ?? 'OPAQUE_SYNTHETIC');
    validateAudioChannelLayout(
      input.channelLayout ?? 'STEREO',
      input.channelFormat === 'MONO' ? 1 : 2,
    );
    resolvePanCoefficients(
      input.panMode ?? 'CENTER',
      input.pan ?? 0,
      input.panLaw ?? 'LINEAR',
      input.channelLayout ?? 'STEREO',
    );
    return freeze({
      stripId: input.stripId,
      stripVersion: AUDIO_CHANNEL_STRIP_VERSION,
      stripGeneration: input.stripGeneration ?? 1,
      channelId: input.channelId,
      sourceId: input.sourceId,
      streamId: input.streamId ?? `${input.sourceId}:stream`,
      sourceGeneration: input.sourceGeneration ?? 1,
      streamGeneration: input.streamGeneration ?? 1,
      displayName: input.displayName ?? input.stripId,
      role: input.role ?? 'custom',
      channelFormat: input.channelFormat ?? 'STEREO',
      sampleRate: input.sampleRate ?? 48000,
      channelLayout: input.channelLayout ?? 'STEREO',
      inputTrimDb: trimDb,
      inputTrimLinear: trim,
      phaseInvert: input.phaseInvert ?? { mode: 'NONE', channelLabels: [] },
      pan: input.pan ?? 0,
      balance: input.balance ?? 0,
      panMode: input.panMode ?? 'CENTER',
      panLaw: input.panLaw ?? 'LINEAR',
      faderDb,
      faderLinear: fader,
      mute: input.mute ?? false,
      solo: input.solo ?? 'NONE',
      soloSafe: input.soloSafe ?? false,
      preFaderListen: input.preFaderListen ?? false,
      afterFaderListen: input.afterFaderListen ?? false,
      enabled: input.enabled ?? true,
      audioFollowVideo: input.audioFollowVideo ?? true,
      transitionContribution: input.transitionContribution ?? true,
      groupIds: input.groupIds ?? [],
      linkedStripIds: input.linkedStripIds ?? [],
      sendIds: input.sendIds ?? [],
      routingEdgeIds: input.routingEdgeIds ?? [],
      monitorPolicy: input.monitorPolicy ?? 'MONITOR_BUS_ONLY',
      metadata: sanitize(input.metadata ?? {}) as any,
      createdAtNs: input.createdAtNs ?? this.now(),
      updatedAtNs: this.now(),
    });
  }
  registerStrip(input: any) {
    if (this.strips.size >= this.max.strips)
      throw new AudioChannelStripRoutingError('AudioChannelStripInvalid', 'strip count bounded');
    if (this.strips.has(input.stripId))
      throw new AudioChannelStripRoutingError(
        'DuplicateAudioChannelStrip',
        `duplicate strip ${input.stripId}`,
      );
    const s = this.makeStrip(input);
    this.strips.set(s.stripId, s);
    this.telemetry.stripRegistrations++;
    this.emit('AudioChannelStripRegistered', { stripId: s.stripId });
    return s;
  }
  updateStrip(stripId: string, patch: any) {
    const old = this.strips.get(stripId);
    if (!old) throw new AudioChannelStripRoutingError('AudioChannelStripNotFound', stripId);
    if (
      patch.expectedGeneration !== undefined &&
      patch.expectedGeneration !== old.stripGeneration
    ) {
      this.telemetry.staleGenerations++;
      throw new AudioChannelStripRoutingError(
        'AudioChannelStripGenerationMismatch',
        'stale strip generation',
      );
    }
    const s = this.makeStrip({
      ...old,
      ...patch,
      stripGeneration: old.stripGeneration + 1,
      updatedAtNs: this.now(),
    });
    this.strips.set(stripId, s);
    this.telemetry.stripUpdates++;
    this.emit('AudioChannelStripUpdated', { stripId });
    return s;
  }
  unregisterStrip(stripId: string) {
    if (!this.strips.delete(stripId))
      throw new AudioChannelStripRoutingError('AudioChannelStripNotFound', stripId);
    this.telemetry.stripRemovals++;
    this.emit('AudioChannelStripRemoved', { stripId });
  }
  linkStrips(a: string, b: string, type = 'STEREO_LINK') {
    if (a === b)
      throw new AudioChannelStripRoutingError('AudioChannelLinkInvalid', 'self-link rejected');
    if (!this.strips.has(a) || !this.strips.has(b))
      throw new AudioChannelStripRoutingError('AudioChannelLinkInvalid', 'missing strip');
    if (this.strips.get(b)?.linkedStripIds.includes(a)) {
      this.incident('AUDIO_STRIP_LINK_CYCLE');
      throw new AudioChannelStripRoutingError('AudioChannelLinkCycle', 'linked-strip cycle');
    }
    this.updateStrip(a, {
      expectedGeneration: this.strips.get(a).stripGeneration,
      linkedStripIds: [...new Set([...this.strips.get(a).linkedStripIds, b])],
      metadata: { linkType: type },
    });
    this.telemetry.linkOperations++;
    this.emit('AudioChannelLinked', { a, b, type });
  }
  registerGroup(g: any) {
    if (this.groups.has(g.groupId))
      throw new AudioChannelStripRoutingError('DuplicateAudioChannelGroup', 'duplicate group');
    if (!uniq(g.memberStripIds ?? []))
      throw new AudioChannelStripRoutingError('AudioChannelGroupInvalid', 'duplicate member');
    for (const id of g.memberStripIds ?? [])
      if (!this.strips.has(id))
        throw new AudioChannelStripRoutingError('AudioChannelGroupInvalid', 'stale member');
    const group = freeze({
      version: AUDIO_CHANNEL_STRIP_VERSION,
      generation: 1,
      masterValue: 1,
      enabled: true,
      priority: 0,
      conflictPolicy: 'HIGHEST_PRIORITY_WINS',
      metadata: {},
      ...g,
    });
    this.groups.set(group.groupId, group);
    this.telemetry.groupRegistrations++;
    this.emit('AudioGroupRegistered', { groupId: group.groupId });
    return group;
  }
  registerVca(v: any) {
    if (this.vcas.has(v.vcaId))
      throw new AudioChannelStripRoutingError('DuplicateAudioVca', 'duplicate vca');
    if (!uniq(v.memberStripIds ?? []))
      throw new AudioChannelStripRoutingError('AudioVcaInvalid', 'duplicate member');
    const vca = freeze({
      generation: 1,
      controlGain: 1,
      mute: false,
      solo: 'NONE',
      priority: 0,
      metadata: {},
      ...v,
    });
    this.vcas.set(vca.vcaId, vca);
    this.telemetry.vcaRegistrations++;
    this.emit('AudioVcaRegistered', { vcaId: vca.vcaId });
    return vca;
  }
  addSend(s: any) {
    if (this.sends.has(s.sendId))
      throw new AudioChannelStripRoutingError('DuplicateAudioSend', 'duplicate send');
    if (!this.strips.has(s.sourceStripId))
      throw new AudioChannelStripRoutingError('AudioSendInvalid', 'invalid source strip');
    const key = `${s.sourceStripId}>${endpointKey(s.destination)}@${s.tapPoint}`;
    if (
      [...this.sends.values()].some(
        (x) => `${x.sourceStripId}>${endpointKey(x.destination)}@${x.tapPoint}` === key,
      )
    )
      throw new AudioChannelStripRoutingError('DuplicateAudioSend', 'duplicate send');
    const send = freeze({
      version: AUDIO_CHANNEL_STRIP_VERSION,
      generation: 1,
      gain: 1,
      enabled: true,
      priority: 0,
      audioFollowVideo: true,
      transitionContribution: true,
      cleanFeedInclusion: true,
      metadata: {},
      ...s,
    });
    validateGain(send.gain, 'send gain');
    this.sends.set(send.sendId, send);
    this.telemetry.sendAdditions++;
    this.emit('AudioSendAdded', { sendId: send.sendId });
    return send;
  }
  commitGraph(graph: any, expectedGeneration = this.currentGraph.graphGeneration) {
    if (expectedGeneration !== this.currentGraph.graphGeneration)
      throw new AudioChannelStripRoutingError(
        'AudioRoutingGraphGenerationMismatch',
        'stale graph generation',
      );
    const report = validateRoutingGraph(graph);
    this.telemetry.graphValidations++;
    if (!report.valid) {
      this.telemetry.graphRejections++;
      if (report.cycles.length) {
        this.telemetry.cycleRejections++;
        this.incident('AUDIO_ROUTING_GRAPH_CYCLE');
      }
      if (report.duplicateRoutes.length) this.incident('AUDIO_ROUTING_DUPLICATE_EDGE');
      throw new AudioChannelStripRoutingError(
        report.cycles.length ? 'AudioRoutingGraphCycle' : 'AudioRoutingGraphInvalid',
        report.errors.join('; '),
      );
    }
    this.currentGraph = freeze({
      ...graph,
      graphVersion: AUDIO_CHANNEL_STRIP_VERSION,
      graphGeneration: this.currentGraph.graphGeneration + 1,
      topologicalOrder: report.topologicalOrder,
      health: 'healthy',
    });
    this.telemetry.graphCommits++;
    this.emit('AudioRoutingGraphCommitted', { graphId: this.currentGraph.graphId });
    return this.currentGraph;
  }
  resolveState(stripId: string, request?: ChannelStripProcessRequest): AudioChannelStripState {
    const s = this.strips.get(stripId);
    const pan = resolvePanCoefficients(s.panMode, s.pan || s.balance, s.panLaw, s.channelLayout);
    let reason = 'UNMUTED';
    if (!s.enabled) reason = 'SOURCE_UNAVAILABLE';
    if (s.mute) reason = 'CHANNEL_MUTE';
    for (const g of this.groups.values())
      if (
        g.enabled &&
        g.groupType === 'MUTE_GROUP' &&
        g.memberStripIds.includes(stripId) &&
        g.masterValue > 0
      )
        reason = 'MUTE_GROUP';
    return freeze({
      stripId,
      stripGeneration: s.stripGeneration,
      runtimeFrame: request?.runtimeFrame ?? '0',
      currentSamplePosition: request?.samplePosition ?? 0,
      active: s.enabled,
      available: s.enabled,
      muted: s.mute,
      soloed: s.solo !== 'NONE',
      effectivelyMuted: reason !== 'UNMUTED',
      effectiveMuteReason: reason,
      soloSafe: s.soloSafe,
      preFaderListen: s.preFaderListen,
      afterFaderListen: s.afterFaderListen,
      effectiveInputTrim: s.inputTrimLinear,
      effectiveFaderGain: s.faderLinear,
      effectivePan: pan,
      effectiveBalance: s.balance,
      groupGainContribution: [...this.groups.values()]
        .filter(
          (g) => g.enabled && g.groupType === 'FADER_GROUP' && g.memberStripIds.includes(stripId),
        )
        .reduce((a, g) => a * g.masterValue, 1),
      vcaContribution: [...this.vcas.values()]
        .filter((v) => v.memberStripIds.includes(stripId))
        .reduce((a, v) => a * v.controlGain, 1),
      transitionContribution: s.transitionContribution ? 1 : 0,
      audioFollowContribution: s.audioFollowVideo ? 1 : 0,
      activeSends: [...this.sends.values()]
        .filter((x) => x.sourceStripId === stripId && x.enabled)
        .map((x) => x.sendId)
        .sort(),
      activeRoutes: this.currentGraph.edges
        .filter((e) => e.source.endpointId === stripId && e.enabled)
        .map((e) => e.edgeId)
        .sort(),
      lastProcessedBlock: request?.blockSequence,
      health: 'healthy',
      metadata: {},
    });
  }
  createPlan(request: ChannelStripProcessRequest): ChannelStripProcessPlan {
    if (this.state === 'SHUTDOWN')
      throw new AudioChannelStripRoutingError('AudioChannelStripShutdownError', 'shutdown');
    if (this.processedRequests.has(request.requestId)) {
      this.telemetry.duplicateRequests++;
      this.incident('AUDIO_STRIP_DUPLICATE_REQUEST');
      throw new AudioChannelStripRoutingError(
        'AudioChannelStripDuplicateRequest',
        'duplicate request',
      );
    }
    const blockKey = `${request.runtimeFrame}:${request.blockSequence}`;
    if (this.processedBlocks.has(blockKey)) {
      this.telemetry.duplicateBlocks++;
      this.incident('AUDIO_STRIP_DUPLICATE_BLOCK');
      throw new AudioChannelStripRoutingError('AudioChannelStripDuplicateBlock', 'duplicate block');
    }
    if (request.expectedRoutingGraphGeneration !== this.currentGraph.graphGeneration) {
      this.telemetry.staleGenerations++;
      this.incident('AUDIO_ROUTING_GRAPH_GENERATION_STALE');
      throw new AudioChannelStripRoutingError('AudioRoutingGraphGenerationMismatch', 'stale graph');
    }
    for (const [id, gen] of Object.entries(request.expectedStripGenerations ?? {}))
      if (this.strips.get(id)?.stripGeneration !== gen)
        throw new AudioChannelStripRoutingError(
          'AudioChannelStripGenerationMismatch',
          'stale strip',
        );
    const strips = sorted(
      [...this.strips.values()].filter((s) => s.enabled),
      'stripId',
    ).map((s) => s.stripId);
    const groups = sorted(
      [...this.groups.values()].filter((g) => g.enabled),
      'groupId',
    ).map((g) => g.groupId);
    const sends = sorted(
      [...this.sends.values()].filter((s) => s.enabled),
      'sendId',
    );
    const edges = sorted(
      this.currentGraph.edges.filter((e) => e.enabled),
      'edgeId',
    );
    const state = Object.fromEntries(strips.map((id) => [id, this.resolveState(id, request)]));
    const sourceDest = new Set<string>();
    for (const e of edges) {
      const source = this.strips.get(e.source.endpointId)?.sourceId ?? e.source.endpointId;
      const k = `${source}>${endpointKey(e.destination)}`;
      if (sourceDest.has(k)) {
        this.incident('AUDIO_ROUTING_SOURCE_CONTRIBUTED_TWICE');
        throw new AudioChannelStripRoutingError(
          'AudioChannelStripInvariantViolation',
          'source contributed twice',
        );
      }
      sourceDest.add(k);
    }
    const plan = freeze({
      planId: `plan:${request.requestId}:${this.currentGraph.graphGeneration}`,
      requestId: request.requestId,
      graphId: this.currentGraph.graphId,
      graphGeneration: this.currentGraph.graphGeneration,
      orderedStripIds: strips,
      orderedGroupIds: groups,
      orderedRoutingEdges: edges,
      resolvedMuteStates: Object.fromEntries(
        Object.entries(state).map(([id, st]) => [id, st.effectiveMuteReason]),
      ),
      resolvedSoloStates: Object.fromEntries(
        strips.map((id) => [id, this.strips.get(id).solo !== 'NONE']),
      ),
      resolvedLinkedControls: strips.flatMap((id) =>
        this.strips.get(id).linkedStripIds.map((x) => sanitize({ stripId: id, linkedStripId: x })),
      ),
      resolvedVcaContributions: Object.fromEntries(
        strips.map((id) => [id, state[id].vcaContribution]),
      ),
      resolvedSends: sends,
      resolvedAudioFollowContributions: Object.fromEntries(
        strips.map((id) => [id, state[id].audioFollowContribution]),
      ),
      resolvedTransitionContributions: Object.fromEntries(
        strips.map((id) => [id, state[id].transitionContribution]),
      ),
      outputBusOrder: [...request.outputBusIds].sort(),
      operationOrder: AUDIO_CHANNEL_STRIP_GAIN_STAGE_ORDER,
      expectedOperationCount: strips.length * 12 + sends.length + edges.length,
      temporaryByteEstimate: strips.length * 32 + sends.length * 16,
      outputByteEstimate: request.outputBusIds.length * 64,
      deterministicScore: `${strips.join('|')}#${edges.map((e) => e.edgeId).join('|')}#${sends.map((s) => s.sendId).join('|')}`,
      warnings: [],
      metadata: sanitize(request.metadata ?? {}) as any,
    });
    this.planCache.set(plan.planId, plan);
    while (this.planCache.size > this.max.cache)
      this.planCache.delete(this.planCache.keys().next().value);
    this.telemetry.processPlans++;
    return plan;
  }
  processBlock(request: ChannelStripProcessRequest) {
    this.telemetry.processRequests++;
    this.telemetry.currentRequestId = request.requestId;
    try {
      const plan = this.backend().createPlan(this, request);
      const result = this.backend().process(plan, request);
      this.processedRequests.add(request.requestId);
      this.processedBlocks.add(`${request.runtimeFrame}:${request.blockSequence}`);
      this.telemetry.processCompletions++;
      this.emit(
        result.status === 'COMPLETED'
          ? 'ChannelStripProcessCompleted'
          : 'ChannelStripProcessDegraded',
        { requestId: request.requestId },
      );
      return result;
    } catch (e) {
      this.telemetry.processFailures++;
      this.emit('ChannelStripProcessFailed', { requestId: request.requestId, error: e?.message });
      throw e;
    }
  }
  health(): AudioChannelStripRoutingHealthSnapshot {
    return freeze({
      engineState: this.state,
      healthState: this.telemetry.processFailures ? 'degraded' : 'healthy',
      backendCount: this.backends.size,
      activeBackendId: this.activeBackendId,
      stripCount: this.strips.size,
      activeStripCount: [...this.strips.values()].filter((s) => s.enabled).length,
      linkedStripCount: [...this.strips.values()].filter((s) => s.linkedStripIds.length).length,
      groupCount: this.groups.size,
      vcaCount: this.vcas.size,
      sendCount: this.sends.size,
      routingEdgeCount: this.currentGraph.edges.length,
      subgroupCount: this.subgroups.size,
      cleanFeedRouteCount: this.cleanFeeds.size,
      mixMinusRouteCount: this.mixMinus.size,
      routingGraphGeneration: this.currentGraph.graphGeneration,
      activeConfigurationTransactionCount: 0,
      processedBlockCount: this.processedBlocks.size,
      completedBlockCount: this.telemetry.processCompletions,
      degradedBlockCount: 0,
      failedBlockCount: this.telemetry.processFailures,
      cancelledBlockCount: 0,
      duplicateRequestCount: this.telemetry.duplicateRequests,
      duplicateBlockCount: this.telemetry.duplicateBlocks,
      staleGenerationRejectionCount: this.telemetry.staleGenerations,
      cycleRejectionCount: this.telemetry.cycleRejections,
      duplicateRouteRejectionCount: 0,
      invalidRouteCount: this.telemetry.invalidRoutes,
      ownershipViolationCount: 0,
      programRouteFailureCount: 0,
      previewRouteFailureCount: 0,
      optionalRouteFailureCount: 0,
      currentSamplePosition: 0,
      lastSuccessfulBlock: [...this.processedBlocks].length,
      lastGraphCommit: this.events.find((e) => e.type === 'AudioRoutingGraphCommitted')?.atNs,
      lastFailure: this.events.find((e) => e.type === 'ChannelStripProcessFailed')?.metadata?.error,
      updatedAtNs: this.now(),
    });
  }
  snapshot(): AudioChannelStripRoutingEngineSnapshot {
    return freeze({
      engineId: this.engineId,
      version: AUDIO_CHANNEL_STRIP_VERSION,
      state: this.state,
      strips: sorted([...this.strips.values()], 'stripId').map(sanitize),
      groups: sorted([...this.groups.values()], 'groupId').map(sanitize),
      vcas: sorted([...this.vcas.values()], 'vcaId').map(sanitize),
      sends: sorted([...this.sends.values()], 'sendId').map(sanitize),
      subgroups: sorted([...this.subgroups.values()], 'subgroupId').map(sanitize),
      cleanFeeds: sorted([...this.cleanFeeds.values()], 'cleanFeedId').map(sanitize),
      mixMinus: sorted([...this.mixMinus.values()], 'mixMinusId').map(sanitize),
      routingGraph: sanitize(this.currentGraph),
      health: sanitize(this.health()),
      telemetry: sanitize({ ...this.telemetry, activeGraphId: this.currentGraph.graphId }),
      events: this.events.map(sanitize),
      watchdogIncidents: this.incidents,
      containsPcmBytes: false,
      containsNativeHandles: false,
    });
  }
  assertInvariants() {
    const errors: string[] = [];
    if (!uniq([...this.strips.keys()])) errors.push('strip ids unique');
    const report = validateRoutingGraph(this.currentGraph);
    if (!report.valid) errors.push(...report.errors);
    for (const s of this.sends.values())
      if (!this.strips.has(s.sourceStripId)) errors.push('send references invalid strip');
    for (const g of this.groups.values())
      for (const id of g.memberStripIds)
        if (!this.strips.has(id)) errors.push('group references invalid strip');
    for (const v of this.vcas.values())
      for (const id of v.memberStripIds)
        if (!this.strips.has(id)) errors.push('vca references invalid strip');
    if (this.planCache.size > this.max.cache) errors.push('cache bounded');
    if (errors.length)
      throw new AudioChannelStripRoutingError(
        'AudioChannelStripInvariantViolation',
        errors.join('; '),
      );
    return freeze({
      valid: true,
      errors: [],
      warnings: [],
      topologicalOrder: this.currentGraph.topologicalOrder,
      duplicateRoutes: [],
      cycles: [],
      metadata: {},
    });
  }
  shutdown() {
    if (this.state === 'SHUTDOWN') return this.snapshot();
    for (const b of this.backends.values()) b.shutdown();
    this.planCache.clear();
    this.processedBlocks.clear();
    this.processedRequests.clear();
    this.state = 'SHUTDOWN';
    this.emit('AudioChannelStripEngineShutdown', {});
    return this.snapshot();
  }
}
export const createAudioChannelStripRoutingEngine = (input: any = {}) =>
  new AudioChannelStripRoutingEngine(input);
export class AudioChannelStripRoutingProcessor implements TickProcessor {
  readonly id = 'audio-channel-strip-routing-processor';
  readonly order = AUDIO_CHANNEL_STRIP_PROCESSOR_ORDER.channelStripRouting;
  constructor(readonly engine: AudioChannelStripRoutingEngine) {}
  initialize() {
    this.engine.backend();
    return { status: 'READY' as const, state: this.engine.snapshot() };
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
    const strips = [...this.engine.strips.values()];
    const req: ChannelStripProcessRequest = freeze({
      requestId: `strip:${tick.frameNumber}`,
      runtimeFrame: String(tick.frameNumber),
      blockSequence: Number(tick.frameNumber % 9007199254740991n),
      samplePosition: Number(tick.frameNumber) * 480,
      sampleCount: 480,
      inputBufferRefs: [],
      expectedStripGenerations: Object.fromEntries(
        strips.map((s) => [s.stripId, s.stripGeneration]),
      ),
      expectedGroupGenerations: Object.fromEntries(
        [...this.engine.groups.values()].map((g) => [g.groupId, g.generation]),
      ),
      expectedSendGenerations: Object.fromEntries(
        [...this.engine.sends.values()].map((s) => [s.sendId, s.generation]),
      ),
      expectedRoutingGraphGeneration: this.engine.currentGraph.graphGeneration,
      expectedAudioFollowGeneration: (program as any)?.generation ?? 0,
      expectedTransitionGeneration: (program as any)?.transitionGeneration ?? 0,
      expectedMixerGeneration: 0,
      outputBusIds: [
        ...new Set(
          this.engine.currentGraph.edges.map((e) => e.destination.endpointId).concat(['program']),
        ),
      ],
      deadlineNs: String(tick.deadlineAtNs ?? 0n),
      metadata: {
        programGeneration: (program as any)?.generation ?? 0,
        previewGeneration: (preview as any)?.generation ?? 0,
      },
    });
    let result;
    try {
      result = this.engine.processBlock(req);
      context.outputs.publish(
        this.id,
        AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.processPlan,
        this.engine.planCache.get(result.planId),
        'OWNED_BY_PROCESSOR',
      );
      context.outputs.publish(
        this.id,
        AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.processResult,
        result,
        'OWNED_BY_PROCESSOR',
      );
    } catch (e) {
      context.outputs.publish(
        this.id,
        AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.failedRejectedResults,
        sanitize({ requestId: req.requestId, error: e?.message }),
        'OWNED_BY_PROCESSOR',
      );
    }
    context.outputs.publish(
      this.id,
      AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.processRequest,
      req,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.routingGraphSnapshot,
      this.engine.currentGraph,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.channelStripStates,
      strips.map((s) => this.engine.resolveState(s.stripId, req)),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.engineHealth,
      this.engine.health(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      AUDIO_CHANNEL_STRIP_OUTPUT_KEYS.telemetry,
      this.engine.snapshot().telemetry,
      'OWNED_BY_PROCESSOR',
    );
    return { status: 'COMPLETED' as const, result: result ?? this.engine.snapshot() };
  }
  shutdown() {
    return { status: 'COMPLETED' as const, state: this.engine.shutdown() };
  }
}
export const createAudioChannelStripCommandHandlers = (
  engine: AudioChannelStripRoutingEngine,
): readonly RuntimeCommandHandler[] =>
  AUDIO_CHANNEL_STRIP_COMMAND_TYPES.map((type) =>
    freeze({
      id: `channel-strip:${type}`,
      type,
      execute(command: any) {
        const p = command.payload ?? {};
        switch (type) {
          case 'AUDIO_STRIP_REGISTER':
            return engine.registerStrip(p);
          case 'AUDIO_STRIP_UPDATE':
            return engine.updateStrip(p.stripId, p);
          case 'AUDIO_STRIP_UNREGISTER':
            return engine.unregisterStrip(p.stripId);
          case 'AUDIO_STRIP_SET_TRIM':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              inputTrimDb: p.inputTrimDb,
              inputTrimLinear: p.inputTrimLinear,
            });
          case 'AUDIO_STRIP_SET_FADER':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              faderDb: p.faderDb,
              faderLinear: p.faderLinear,
            });
          case 'AUDIO_STRIP_SET_PAN':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              pan: p.pan,
              panMode: p.panMode,
            });
          case 'AUDIO_STRIP_SET_BALANCE':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              balance: p.balance,
              panMode: 'STEREO_BALANCE',
            });
          case 'AUDIO_STRIP_SET_PHASE_INVERT':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              phaseInvert: p.phaseInvert,
            });
          case 'AUDIO_STRIP_SET_MUTE':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              mute: p.mute,
            });
          case 'AUDIO_STRIP_SET_SOLO':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              solo: p.solo,
            });
          case 'AUDIO_STRIP_SET_SOLO_SAFE':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              soloSafe: p.soloSafe,
            });
          case 'AUDIO_STRIP_SET_PFL':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              preFaderListen: p.preFaderListen,
            });
          case 'AUDIO_STRIP_SET_AFL':
            return engine.updateStrip(p.stripId, {
              expectedGeneration: p.expectedGeneration,
              afterFaderListen: p.afterFaderListen,
            });
          case 'AUDIO_STRIP_LINK':
            return engine.linkStrips(p.sourceStripId, p.destinationStripId, p.linkType);
          case 'AUDIO_GROUP_REGISTER':
            return engine.registerGroup(p);
          case 'AUDIO_VCA_REGISTER':
            return engine.registerVca(p);
          case 'AUDIO_SEND_ADD':
            return engine.addSend(p);
          case 'AUDIO_ROUTE_ADD':
            return engine.commitGraph(
              {
                ...engine.currentGraph,
                edges: [...engine.currentGraph.edges, p.edge],
                nodes: [...engine.currentGraph.nodes, p.edge.source, p.edge.destination],
              },
              engine.currentGraph.graphGeneration,
            );
          case 'AUDIO_ROUTING_GRAPH_VALIDATE':
            return validateRoutingGraph(p.graph);
          case 'AUDIO_ROUTING_GRAPH_COMMIT':
            return engine.commitGraph(p.graph, p.expectedGeneration);
          case 'AUDIO_STRIP_PROCESS_BLOCK':
            return engine.processBlock(p.request);
          case 'AUDIO_STRIP_CLEAR_PLAN_CACHE':
            engine.planCache.clear();
            return engine.snapshot();
          case 'AUDIO_STRIP_VALIDATE':
            return engine.assertInvariants();
          case 'AUDIO_STRIP_SHUTDOWN':
            return engine.shutdown();
          default:
            return engine.snapshot();
        }
      },
    }),
  );
export const createAudioChannelStripSourceGraphSnapshot = (
  engine: AudioChannelStripRoutingEngine,
) => {
  const s = engine.snapshot();
  return freeze({
    stripIds: s.strips.map((x: any) => x.stripId),
    sourceChannelRelationships: s.strips.map((x: any) =>
      sanitize({ stripId: x.stripId, sourceId: x.sourceId, channelId: x.channelId, role: x.role }),
    ),
    groupMemberships: s.groups.map((g: any) =>
      sanitize({ groupId: g.groupId, memberStripIds: g.memberStripIds }),
    ),
    vcaMemberships: s.vcas.map((v: any) =>
      sanitize({ vcaId: v.vcaId, memberStripIds: v.memberStripIds }),
    ),
    muteSoloPflAfl: s.strips.map((x: any) =>
      sanitize({
        stripId: x.stripId,
        mute: x.mute,
        solo: x.solo,
        preFaderListen: x.preFaderListen,
        afterFaderListen: x.afterFaderListen,
      }),
    ),
    faderTrimPanSummaries: s.strips.map((x: any) =>
      sanitize({
        stripId: x.stripId,
        inputTrimDb: x.inputTrimDb,
        faderDb: x.faderDb,
        pan: x.pan,
        balance: x.balance,
      }),
    ),
    sendRelationships: s.sends,
    routingGraphGeneration: s.routingGraph.graphGeneration,
    routingEndpoints: s.routingGraph.nodes,
    participation: s.routingGraph.edges,
    mixMinusExclusions: s.mixMinus,
    routingHealth: s.health,
    eligibility: 'metadata-only',
    containsPcmBytes: false,
    containsNativeHandles: false,
  });
};
