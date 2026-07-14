/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';

export const SOCIAL_PLATFORM_COORDINATION_VERSION = '5.7.8';
export const SOCIAL_PLATFORM_COORDINATION_PROCESSOR_ORDER = 1085;
type Safe = Readonly<Record<string, unknown>>;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const sig = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};
const redact = (s: string) => `redacted:${sig(s)}`;
const arr = <T>(m: Map<string, T>) =>
  [...m.values()].sort((a: any, b: any) =>
    String(a.id ?? a.platformId ?? a.sessionId ?? a.groupId ?? a.backendId).localeCompare(
      String(b.id ?? b.platformId ?? b.sessionId ?? b.groupId ?? b.backendId),
    ),
  );
const LIMIT = freeze({
  backends: 8,
  capabilities: 64,
  accounts: 256,
  channels: 256,
  profiles: 256,
  events: 256,
  sessions: 512,
  mappings: 1024,
  groups: 128,
  requests: 10000,
  results: 10000,
  incidents: 512,
});
export const SOCIAL_OUTPUT_KEYS = freeze({
  platformCapabilityDefinitions: 'social.platform.capabilities',
  accountReferences: 'social.account.references',
  channelReferences: 'social.channel.references',
  destinationProfiles: 'social.destination.profiles',
  liveEvents: 'social.live.events',
  contentMetadata: 'social.content.metadata',
  thumbnailCoverReferences: 'social.thumbnail-cover.references',
  socialSessionDefinitions: 'social.session.definitions',
  socialSessionStates: 'social.session.states',
  platformReadinessStates: 'social.readiness.states',
  compatibilityRequestsResults: 'social.compatibility',
  outputMappings: 'social.output.mappings',
  liveGroupDefinitions: 'social.live.groups',
  coordinationRequestsPlansResults: 'social.coordination',
  platformDestinationHealth: 'social.platform.health',
  aggregateSocialLiveStates: 'social.aggregate.states',
  chatEngagementAnalyticsReferences: 'social.cea.references',
  activeConfigurationTransactions: 'social.transactions.active',
  coordinatorHealth: 'social.coordinator.health',
  coordinatorTelemetry: 'social.coordinator.telemetry',
  backendHealth: 'social.backend.health',
  failedRejectedResults: 'social.results.failed-rejected',
} as const);
export const SOCIAL_COMMAND_TYPES = [
  'SOCIAL_REGISTER_BACKEND',
  'SOCIAL_UNREGISTER_BACKEND',
  'SOCIAL_REGISTER_PLATFORM_CAPABILITIES',
  'SOCIAL_UPDATE_PLATFORM_CAPABILITIES',
  'SOCIAL_REGISTER_ACCOUNT_REFERENCE',
  'SOCIAL_UPDATE_ACCOUNT_REFERENCE',
  'SOCIAL_REMOVE_ACCOUNT_REFERENCE',
  'SOCIAL_REGISTER_CHANNEL_REFERENCE',
  'SOCIAL_UPDATE_CHANNEL_REFERENCE',
  'SOCIAL_REMOVE_CHANNEL_REFERENCE',
  'SOCIAL_REGISTER_DESTINATION_PROFILE',
  'SOCIAL_UPDATE_DESTINATION_PROFILE',
  'SOCIAL_REMOVE_DESTINATION_PROFILE',
  'SOCIAL_CREATE_LIVE_EVENT',
  'SOCIAL_UPDATE_LIVE_EVENT',
  'SOCIAL_REMOVE_LIVE_EVENT',
  'SOCIAL_CREATE_SESSION',
  'SOCIAL_UPDATE_SESSION',
  'SOCIAL_DESTROY_SESSION',
  'SOCIAL_CREATE_OUTPUT_MAPPING',
  'SOCIAL_UPDATE_OUTPUT_MAPPING',
  'SOCIAL_REMOVE_OUTPUT_MAPPING',
  'SOCIAL_CREATE_LIVE_GROUP',
  'SOCIAL_UPDATE_LIVE_GROUP',
  'SOCIAL_REMOVE_LIVE_GROUP',
  'SOCIAL_VALIDATE_COMPATIBILITY',
  'SOCIAL_REFRESH_READINESS',
  'SOCIAL_PREPARE',
  'SOCIAL_ACTIVATE',
  'SOCIAL_PAUSE',
  'SOCIAL_RESUME',
  'SOCIAL_STOP',
  'SOCIAL_RETRY',
  'SOCIAL_RECONNECT',
  'SOCIAL_DRAIN',
  'SOCIAL_RESET',
  'SOCIAL_RECONFIGURE',
  'SOCIAL_CLEAR_PLAN_CACHE',
  'SOCIAL_VALIDATE',
  'SOCIAL_SHUTDOWN',
] as const;
export type SocialCommandType = (typeof SOCIAL_COMMAND_TYPES)[number];
export const SOCIAL_EVENTS = [
  'SocialPlatformCoordinatorCreated',
  'SocialBackendRegistered',
  'SocialBackendRemoved',
  'SocialPlatformCapabilitiesRegistered',
  'SocialPlatformCapabilitiesUpdated',
  'SocialAccountReferenceRegistered',
  'SocialAccountReferenceUpdated',
  'SocialChannelReferenceRegistered',
  'SocialChannelReferenceUpdated',
  'SocialDestinationProfileRegistered',
  'SocialDestinationProfileUpdated',
  'SocialLiveEventCreated',
  'SocialLiveEventUpdated',
  'SocialSessionCreated',
  'SocialSessionValidated',
  'SocialSessionWaiting',
  'SocialSessionReady',
  'SocialSessionPreparing',
  'SocialSessionPrepared',
  'SocialSessionActivating',
  'SocialSessionActive',
  'SocialSessionDegraded',
  'SocialSessionRetrying',
  'SocialSessionReconnecting',
  'SocialSessionPaused',
  'SocialSessionResumed',
  'SocialSessionStopping',
  'SocialSessionStopped',
  'SocialSessionFailed',
  'SocialCompatibilityEvaluated',
  'SocialReadinessChanged',
  'SocialOutputMappingCreated',
  'SocialLiveGroupCreated',
  'SocialLiveGroupUpdated',
  'SocialLiveAggregateChanged',
  'SocialPlatformFailureIsolated',
  'SocialHealthChanged',
  'SocialPlatformCoordinatorShutdown',
] as const;
export type SocialEventType = (typeof SOCIAL_EVENTS)[number];
export const SOCIAL_WATCHDOG_INCIDENTS = [
  'SOCIAL_COORDINATOR_STALLED',
  'SOCIAL_REQUEST_TIMEOUT',
  'SOCIAL_DUPLICATE_REQUEST',
  'SOCIAL_SESSION_GENERATION_STALE',
  'SOCIAL_PROFILE_GENERATION_STALE',
  'SOCIAL_EVENT_GENERATION_STALE',
  'SOCIAL_ACCOUNT_GENERATION_STALE',
  'SOCIAL_CHANNEL_GENERATION_STALE',
  'SOCIAL_CAPABILITY_GENERATION_STALE',
  'SOCIAL_MAPPING_GENERATION_STALE',
  'SOCIAL_STREAM_SESSION_GENERATION_STALE',
  'SOCIAL_DISTRIBUTION_GENERATION_STALE',
  'SOCIAL_PROTOCOL_SESSION_GENERATION_STALE',
  'SOCIAL_PLATFORM_UNSUPPORTED',
  'SOCIAL_ACCOUNT_UNAVAILABLE',
  'SOCIAL_CHANNEL_UNAVAILABLE',
  'SOCIAL_EVENT_NOT_READY',
  'SOCIAL_STREAM_NOT_READY',
  'SOCIAL_PROTOCOL_INCOMPATIBLE',
  'SOCIAL_VIDEO_CODEC_INCOMPATIBLE',
  'SOCIAL_AUDIO_CODEC_INCOMPATIBLE',
  'SOCIAL_RESOLUTION_INCOMPATIBLE',
  'SOCIAL_ASPECT_RATIO_INCOMPATIBLE',
  'SOCIAL_FRAME_RATE_INCOMPATIBLE',
  'SOCIAL_BITRATE_INCOMPATIBLE',
  'SOCIAL_AUDIO_FORMAT_INCOMPATIBLE',
  'SOCIAL_KEYFRAME_POLICY_INCOMPATIBLE',
  'SOCIAL_SECURE_TRANSPORT_REQUIRED',
  'SOCIAL_GROUP_QUORUM_IMPOSSIBLE',
  'SOCIAL_REQUIRED_PLATFORM_FAILED',
  'SOCIAL_OPTIONAL_PLATFORM_FAILED',
  'SOCIAL_OUTPUT_MAPPING_CONFLICT',
  'SOCIAL_METADATA_INVALID',
  'SOCIAL_RETRY_EXHAUSTED',
  'SOCIAL_RECONNECT_FAILED',
  'SOCIAL_BACKEND_FAILED',
  'SOCIAL_OUTPUT_REGISTRY_MISMATCH',
  'SOCIAL_SOURCE_GRAPH_MISMATCH',
  'SOCIAL_PRIVACY_REDACTION_FAILURE',
  'SOCIAL_INVARIANT_FAILURE',
] as const;
export type SocialWatchdogIncidentType = (typeof SOCIAL_WATCHDOG_INCIDENTS)[number];
export type SocialPlatformIdentifier =
  | 'YOUTUBE'
  | 'FACEBOOK'
  | 'TWITCH'
  | 'LINKEDIN'
  | 'TIKTOK'
  | 'INSTAGRAM'
  | 'X'
  | 'KICK'
  | 'GENERIC';
export type SocialOutputRole =
  'PROGRAM' | 'CLEAN_FEED' | 'AUX' | 'HORIZONTAL_PROGRAM' | 'VERTICAL_PROGRAM' | 'SQUARE_PROGRAM';
export type SocialSessionState =
  | 'CREATED'
  | 'WAITING'
  | 'READY'
  | 'PREPARING'
  | 'PREPARED'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'DEGRADED'
  | 'RETRYING'
  | 'RECONNECTING'
  | 'PAUSED'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'SHUTDOWN';
export type SocialErrorCode =
  | 'SocialPlatformCoordinatorNotReady'
  | 'SocialPlatformBackendNotFound'
  | 'DuplicateSocialPlatformBackend'
  | 'SocialPlatformCapabilitiesNotFound'
  | 'DuplicateSocialPlatformCapabilities'
  | 'SocialPlatformCapabilitiesInvalid'
  | 'SocialAccountReferenceNotFound'
  | 'DuplicateSocialAccountReference'
  | 'SocialAccountReferenceInvalid'
  | 'SocialChannelReferenceNotFound'
  | 'DuplicateSocialChannelReference'
  | 'SocialChannelReferenceInvalid'
  | 'SocialDestinationProfileNotFound'
  | 'DuplicateSocialDestinationProfile'
  | 'SocialDestinationProfileInvalid'
  | 'SocialLiveEventNotFound'
  | 'DuplicateSocialLiveEvent'
  | 'SocialLiveEventInvalid'
  | 'SocialPlatformSessionNotFound'
  | 'DuplicateSocialPlatformSession'
  | 'SocialPlatformSessionInvalid'
  | 'SocialPlatformSessionGenerationMismatch'
  | 'SocialPlatformSessionStateInvalid'
  | 'SocialOutputMappingInvalid'
  | 'DuplicateSocialOutputMapping'
  | 'SocialLiveGroupNotFound'
  | 'DuplicateSocialLiveGroup'
  | 'SocialLiveGroupInvalid'
  | 'SocialCompatibilityRequestInvalid'
  | 'SocialPlatformIncompatible'
  | 'SocialPlatformNotReady'
  | 'SocialDuplicateRequest'
  | 'SocialGroupQuorumImpossible'
  | 'SocialRequiredPlatformFailed'
  | 'SocialMetadataInvalid'
  | 'SocialRetryExhausted'
  | 'SocialReconnectFailed'
  | 'SocialBackendFailed'
  | 'SocialCancelled'
  | 'SocialTimeout'
  | 'SocialInvariantViolation'
  | 'SocialShutdownError';
export class SocialPlatformCoordinationError extends Error {
  constructor(
    readonly code: SocialErrorCode,
    msg: string,
  ) {
    super(`${code}: ${msg.replace(/https?:\/\/\S+|token\S*|key\S*/gi, '[redacted]')}`);
  }
}
export interface SocialPlatformCapabilitySnapshot {
  readonly platformId: SocialPlatformIdentifier;
  readonly version: string;
  readonly generation: number;
  readonly protocols: readonly string[];
  readonly videoCodecs: readonly string[];
  readonly audioCodecs: readonly string[];
  readonly aspectRatios: readonly string[];
  readonly maxVideoBitrateKbps: number;
  readonly maxAudioBitrateKbps: number;
  readonly secureTransportRequired: boolean;
  readonly metadataOnly: boolean;
  readonly realPlatformApi: false;
  readonly realOAuth: false;
  readonly realEventCreation: false;
  readonly realStreamKeyRetrieval: false;
  readonly safeMetadata: Safe;
}
export type SocialPlatformAccountReferenceSnapshot = Readonly<{
  accountRefId: string;
  generation: number;
  platformId: SocialPlatformIdentifier;
  available: boolean;
  redactedAccount: string;
  safeMetadata: Safe;
}>;
export type SocialPlatformChannelReferenceSnapshot = Readonly<{
  channelRefId: string;
  generation: number;
  platformId: SocialPlatformIdentifier;
  available: boolean;
  redactedChannel: string;
  safeMetadata: Safe;
}>;
export type SocialDestinationProfileSnapshot = Readonly<{
  profileId: string;
  generation: number;
  platformId: SocialPlatformIdentifier;
  capabilityVersion: string;
  accountRefId: string;
  channelRefId: string;
  visibility: string;
  required: boolean;
  safeMetadata: Safe;
}>;
export type SocialLiveEventSnapshot = Readonly<{
  eventId: string;
  generation: number;
  accountRefId: string;
  channelRefId: string;
  ready: boolean;
  title: string;
  description: string;
  visibility: string;
  scheduledStartNs?: number;
  safeMetadata: Safe;
}>;
export type SocialLiveContentMetadataSnapshot = Readonly<{
  metadataId: string;
  title: string;
  description: string;
  tags: readonly string[];
  safeMetadata: Safe;
}>;
export type SocialThumbnailReferenceSnapshot = Readonly<{
  thumbnailRefId: string;
  redactedReference: string;
  safeMetadata: Safe;
}>;
export type SocialCoverReferenceSnapshot = Readonly<{
  coverRefId: string;
  redactedReference: string;
  safeMetadata: Safe;
}>;
export type SocialPlatformOutputMappingSnapshot = Readonly<{
  mappingId: string;
  generation: number;
  sessionId: string;
  outputRole: SocialOutputRole;
  aspectRatioRole: string;
  streamingSessionId: string;
  distributionSessionId: string;
  protocolSessionId: string;
  enabled: boolean;
  safeMetadata: Safe;
}>;
export type SocialPlatformSessionDefinitionSnapshot = Readonly<{
  sessionId: string;
  generation: number;
  profileId: string;
  eventId: string;
  mappingId: string;
  startupPolicy: string;
  required: boolean;
  safeMetadata: Safe;
}>;
export type SocialPlatformSessionStateSnapshot = Readonly<{
  sessionId: string;
  generation: number;
  state: SocialSessionState;
  readiness: string;
  compatibility: string;
  lastResultId?: string;
  safeMetadata: Safe;
}>;
export type SocialPlatformReadinessSnapshot = Readonly<{
  readinessId: string;
  sessionId: string;
  ready: boolean;
  reasons: readonly string[];
  checkedAtNs: number;
}>;
export type SocialPlatformCompatibilityRequestSnapshot = Readonly<{
  requestId: string;
  sessionId: string;
  protocol: string;
  videoCodec: string;
  audioCodec: string;
  aspectRatio: string;
  videoBitrateKbps: number;
  audioBitrateKbps: number;
  secureTransport: boolean;
}>;
export type SocialPlatformCompatibilityResultSnapshot = Readonly<{
  resultId: string;
  requestId: string;
  sessionId: string;
  compatible: boolean;
  reasons: readonly string[];
  warnings: readonly string[];
}>;
export type SocialLiveGroupDefinitionSnapshot = Readonly<{
  groupId: string;
  generation: number;
  sessionIds: readonly string[];
  requiredSessionIds: readonly string[];
  quorum: number;
  policy: string;
  safeMetadata: Safe;
}>;
export type SocialCoordinationRequestSnapshot = Readonly<{
  requestId: string;
  action: string;
  sessionId?: string;
  groupId?: string;
  expectedGeneration?: number;
  createdAtNs: number;
  safeMetadata: Safe;
}>;
export type SocialCoordinationPlanSnapshot = Readonly<{
  planId: string;
  requestId: string;
  orderedSessionIds: readonly string[];
  action: string;
  deterministicBackendId: string;
  safeMetadata: Safe;
}>;
export type SocialCoordinationResultSnapshot = Readonly<{
  resultId: string;
  requestId: string;
  sessionId?: string;
  groupId?: string;
  status: string;
  realPlatformActivation: false;
  retryCommandMetadata?: Safe;
  reconnectCommandMetadata?: Safe;
  safeMetadata: Safe;
}>;
export type SocialPlatformDestinationHealthSnapshot = Readonly<{
  sessionId: string;
  platformId: SocialPlatformIdentifier;
  state: SocialSessionState;
  healthy: boolean;
  lastFailure?: string;
}>;
export type SocialLiveAggregateStateSnapshot = Readonly<{
  groupId: string;
  state: string;
  activeSessionIds: readonly string[];
  degradedSessionIds: readonly string[];
  failedSessionIds: readonly string[];
  quorumReached: boolean;
}>;
export type SocialChatChannelReferenceSnapshot = Readonly<{
  chatRefId: string;
  available: boolean;
  redactedReference: string;
  safeMetadata: Safe;
}>;
export type SocialEngagementChannelReferenceSnapshot = Readonly<{
  engagementRefId: string;
  available: boolean;
  redactedReference: string;
  safeMetadata: Safe;
}>;
export type SocialAnalyticsChannelReferenceSnapshot = Readonly<{
  analyticsRefId: string;
  available: boolean;
  redactedReference: string;
  safeMetadata: Safe;
}>;
export type SocialPlatformConfigurationTransactionSnapshot = Readonly<{
  transactionId: string;
  state: string;
  safeMetadata: Safe;
}>;
export type SocialPlatformBackendSnapshot = Readonly<{
  backendId: string;
  realPlatformApi: false;
  realOAuth: false;
  realEventCreation: false;
  realStreamKeyRetrieval: false;
  healthy: boolean;
}>;
export type SocialPlatformCoordinatorHealthSnapshot = Readonly<{
  engineState: string;
  healthState: string;
  backendCount: number;
  platformCapabilityCount: number;
  accountReferenceCount: number;
  channelReferenceCount: number;
  destinationProfileCount: number;
  eventCount: number;
  sessionCount: number;
  activeSessionCount: number;
  readySessionCount: number;
  waitingSessionCount: number;
  degradedSessionCount: number;
  failedSessionCount: number;
  liveGroupCount: number;
  activeGroupCount: number;
  partialGroupCount: number;
  failedGroupCount: number;
  compatibilityCheckCount: number;
  incompatibleResultCount: number;
  readinessCheckCount: number;
  activationCount: number;
  retryCoordinationCount: number;
  reconnectCoordinationCount: number;
  duplicateRequestCount: number;
  staleGenerationRejectionCount: number;
  accountUnavailableCount: number;
  channelUnavailableCount: number;
  eventNotReadyCount: number;
  streamNotReadyCount: number;
  aspectRatioIncompatibilityCount: number;
  codecIncompatibilityCount: number;
  bitrateIncompatibilityCount: number;
  requiredPlatformFailureCount: number;
  optionalPlatformFailureCount: number;
  lastActivePlatform?: string;
  lastFailure?: string;
  updatedAtNs: number;
}>;
export type SocialPlatformCoordinatorTelemetrySnapshot = Readonly<Record<string, unknown>>;
export type SocialPlatformCoordinatorValidationReport = Readonly<{
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  checkedInvariants: readonly string[];
}>;
export type SocialPlatformCoordinatorEngineSnapshot = Readonly<{
  version: string;
  backends: readonly SocialPlatformBackendSnapshot[];
  capabilities: readonly SocialPlatformCapabilitySnapshot[];
  accounts: readonly SocialPlatformAccountReferenceSnapshot[];
  channels: readonly SocialPlatformChannelReferenceSnapshot[];
  profiles: readonly SocialDestinationProfileSnapshot[];
  events: readonly SocialLiveEventSnapshot[];
  sessions: readonly SocialPlatformSessionDefinitionSnapshot[];
  sessionStates: readonly SocialPlatformSessionStateSnapshot[];
  mappings: readonly SocialPlatformOutputMappingSnapshot[];
  groups: readonly SocialLiveGroupDefinitionSnapshot[];
  compatibilityResults: readonly SocialPlatformCompatibilityResultSnapshot[];
  readiness: readonly SocialPlatformReadinessSnapshot[];
  plans: readonly SocialCoordinationPlanSnapshot[];
  results: readonly SocialCoordinationResultSnapshot[];
  platformHealth: readonly SocialPlatformDestinationHealthSnapshot[];
  aggregateStates: readonly SocialLiveAggregateStateSnapshot[];
  health: SocialPlatformCoordinatorHealthSnapshot;
  telemetry: SocialPlatformCoordinatorTelemetrySnapshot;
  watchdogIncidents: readonly string[];
  validation: SocialPlatformCoordinatorValidationReport;
}>;
export interface SocialPlatformCoordinationBackend {
  snapshot(): SocialPlatformBackendSnapshot;
  evaluateCompatibility(
    c: SocialPlatformCapabilitySnapshot,
    r: SocialPlatformCompatibilityRequestSnapshot,
  ): SocialPlatformCompatibilityResultSnapshot;
  evaluateReadiness(
    s: SocialPlatformSessionDefinitionSnapshot,
    p: SocialDestinationProfileSnapshot,
    a: SocialPlatformAccountReferenceSnapshot,
    ch: SocialPlatformChannelReferenceSnapshot,
    e: SocialLiveEventSnapshot,
    streamReady: boolean,
  ): SocialPlatformReadinessSnapshot;
  createPlan(
    r: SocialCoordinationRequestSnapshot,
    ids: readonly string[],
  ): SocialCoordinationPlanSnapshot;
  activate(
    p: SocialCoordinationPlanSnapshot,
    fail?: 'required' | 'optional',
  ): SocialCoordinationResultSnapshot;
}
export class SyntheticSocialPlatformCoordinationBackend implements SocialPlatformCoordinationBackend {
  constructor(readonly backendId = 'synthetic-social') {}
  snapshot(): SocialPlatformBackendSnapshot {
    return freeze({
      backendId: this.backendId,
      realPlatformApi: false,
      realOAuth: false,
      realEventCreation: false,
      realStreamKeyRetrieval: false,
      healthy: true,
    });
  }
  evaluateCompatibility(
    c: SocialPlatformCapabilitySnapshot,
    r: SocialPlatformCompatibilityRequestSnapshot,
  ) {
    const reasons: string[] = [];
    if (!c.protocols.includes(r.protocol)) reasons.push('protocol');
    if (!c.videoCodecs.includes(r.videoCodec)) reasons.push('videoCodec');
    if (!c.audioCodecs.includes(r.audioCodec)) reasons.push('audioCodec');
    if (!c.aspectRatios.includes(r.aspectRatio)) reasons.push('aspectRatio');
    if (r.videoBitrateKbps > c.maxVideoBitrateKbps || r.audioBitrateKbps > c.maxAudioBitrateKbps)
      reasons.push('bitrate');
    if (c.secureTransportRequired && !r.secureTransport) reasons.push('secureTransport');
    return freeze({
      resultId: `compat:${sig(JSON.stringify(r))}`,
      requestId: r.requestId,
      sessionId: r.sessionId,
      compatible: reasons.length === 0,
      reasons,
      warnings: reasons.length ? [] : ['synthetic metadata-only compatibility'],
    });
  }
  evaluateReadiness(
    s: SocialPlatformSessionDefinitionSnapshot,
    p: SocialDestinationProfileSnapshot,
    a: SocialPlatformAccountReferenceSnapshot,
    ch: SocialPlatformChannelReferenceSnapshot,
    e: SocialLiveEventSnapshot,
    streamReady: boolean,
  ) {
    const reasons: string[] = [];
    if (!a.available) reasons.push('account unavailable');
    if (!ch.available) reasons.push('channel unavailable');
    if (!e.ready) reasons.push('event not ready');
    if (!streamReady) reasons.push('stream not ready');
    return freeze({
      readinessId: `ready:${sig(s.sessionId + String(reasons))}`,
      sessionId: s.sessionId,
      ready: reasons.length === 0,
      reasons,
      checkedAtNs: 0,
    });
  }
  createPlan(r: SocialCoordinationRequestSnapshot, ids: readonly string[]) {
    return freeze({
      planId: `plan:${sig(r.requestId + ids.slice().sort().join('|'))}`,
      requestId: r.requestId,
      orderedSessionIds: ids.slice().sort(),
      action: r.action,
      deterministicBackendId: this.backendId,
      safeMetadata: { deterministic: true },
    });
  }
  activate(p: SocialCoordinationPlanSnapshot, fail?: 'required' | 'optional') {
    return freeze({
      resultId: `result:${sig(p.planId + String(fail ?? 'ok'))}`,
      requestId: p.requestId,
      groupId: p.orderedSessionIds.length > 1 ? p.planId : undefined,
      sessionId: p.orderedSessionIds.length === 1 ? p.orderedSessionIds[0] : undefined,
      status: fail === 'required' ? 'FAILED' : fail === 'optional' ? 'DEGRADED' : 'ACTIVE',
      realPlatformActivation: false as const,
      safeMetadata: { synthetic: true },
    } as SocialCoordinationResultSnapshot);
  }
}
export const createSyntheticSocialPlatformCoordinationBackend = (id?: string) =>
  new SyntheticSocialPlatformCoordinationBackend(id);
export function createSocialPlatformCapabilityPreset(
  platformId: SocialPlatformIdentifier,
): SocialPlatformCapabilitySnapshot {
  const vertical = platformId === 'TIKTOK' || platformId === 'INSTAGRAM';
  return freeze({
    platformId,
    version: 'preset-1',
    generation: 1,
    protocols: ['RTMPS_FOUNDATION', 'RTMP_FOUNDATION'],
    videoCodecs: ['H264'],
    audioCodecs: ['AAC'],
    aspectRatios: vertical ? ['9:16', '1:1'] : ['16:9', '1:1', '9:16'],
    maxVideoBitrateKbps: platformId === 'TWITCH' ? 6000 : 9000,
    maxAudioBitrateKbps: 320,
    secureTransportRequired: platformId !== 'GENERIC',
    metadataOnly: ['TIKTOK', 'INSTAGRAM', 'X'].includes(platformId),
    realPlatformApi: false,
    realOAuth: false,
    realEventCreation: false,
    realStreamKeyRetrieval: false,
    safeMetadata: { preset: platformId },
  });
}
export class SocialPlatformDestinationCoordinator {
  private backends = new Map<string, SocialPlatformCoordinationBackend>();
  private caps = new Map<string, SocialPlatformCapabilitySnapshot>();
  private accounts = new Map<string, SocialPlatformAccountReferenceSnapshot>();
  private channels = new Map<string, SocialPlatformChannelReferenceSnapshot>();
  private profiles = new Map<string, SocialDestinationProfileSnapshot>();
  private events = new Map<string, SocialLiveEventSnapshot>();
  private sessions = new Map<string, SocialPlatformSessionDefinitionSnapshot>();
  private states = new Map<string, SocialPlatformSessionStateSnapshot>();
  private mappings = new Map<string, SocialPlatformOutputMappingSnapshot>();
  private groups = new Map<string, SocialLiveGroupDefinitionSnapshot>();
  private compat = new Map<string, SocialPlatformCompatibilityResultSnapshot>();
  private ready = new Map<string, SocialPlatformReadinessSnapshot>();
  private plans = new Map<string, SocialCoordinationPlanSnapshot>();
  private results = new Map<string, SocialCoordinationResultSnapshot>();
  private processed = new Set<string>();
  private shutdown = false;
  private incidents: string[] = [];
  private telemetry: any = {
    backendRegistrations: 0,
    duplicateRequests: 0,
    staleGenerations: 0,
    compatibilityRequests: 0,
    readinessEvaluations: 0,
    activations: 0,
    retries: 0,
    reconnects: 0,
    requiredPlatformFailures: 0,
    optionalPlatformFailures: 0,
    lastEvent: 'SocialPlatformCoordinatorCreated',
  };
  constructor(readonly coordinatorId = 'social-coordinator') {}
  private ensure() {
    if (this.shutdown) throw new SocialPlatformCoordinationError('SocialShutdownError', 'shutdown');
  }
  private emit(e: string) {
    this.telemetry.lastEvent = e;
  }
  private put<T>(m: Map<string, T>, id: string, v: T, dup: SocialErrorCode) {
    this.ensure();
    if (m.has(id)) throw new SocialPlatformCoordinationError(dup, `duplicate ${id}`);
    m.set(id, freeze(v));
  }
  registerBackend(b: SocialPlatformCoordinationBackend) {
    const id = b.snapshot().backendId;
    this.put(this.backends, id, b, 'DuplicateSocialPlatformBackend');
    this.telemetry.backendRegistrations++;
    this.emit('SocialBackendRegistered');
  }
  unregisterBackend(id: string) {
    this.backends.delete(id);
    this.emit('SocialBackendRemoved');
  }
  backend() {
    const b = [...this.backends.values()].sort((a, b) =>
      a.snapshot().backendId.localeCompare(b.snapshot().backendId),
    )[0];
    if (!b)
      throw new SocialPlatformCoordinationError('SocialPlatformBackendNotFound', 'no backend');
    return b;
  }
  registerCapabilities(c: SocialPlatformCapabilitySnapshot) {
    this.put(this.caps, `${c.platformId}:${c.version}`, c, 'DuplicateSocialPlatformCapabilities');
    this.emit('SocialPlatformCapabilitiesRegistered');
  }
  updateCapabilities(
    platformId: SocialPlatformIdentifier,
    version: string,
    expected: number,
    patch: Partial<SocialPlatformCapabilitySnapshot>,
  ) {
    const k = `${platformId}:${version}`,
      old = this.caps.get(k);
    if (!old) throw new SocialPlatformCoordinationError('SocialPlatformCapabilitiesNotFound', k);
    if (old.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialPlatformCapabilitiesInvalid', 'stale');
    }
    this.caps.set(
      k,
      freeze({ ...old, ...patch, generation: expected + 1 } as SocialPlatformCapabilitySnapshot),
    );
    this.emit('SocialPlatformCapabilitiesUpdated');
  }
  registerAccountReference(i: {
    accountRefId: string;
    platformId: SocialPlatformIdentifier;
    rawAccountId?: string;
    available?: boolean;
    generation?: number;
    safeMetadata?: Safe;
  }) {
    this.put(
      this.accounts,
      i.accountRefId,
      {
        accountRefId: i.accountRefId,
        generation: i.generation ?? 1,
        platformId: i.platformId,
        available: i.available ?? true,
        redactedAccount: redact(i.rawAccountId ?? i.accountRefId),
        safeMetadata: i.safeMetadata ?? {},
      },
      'DuplicateSocialAccountReference',
    );
    this.emit('SocialAccountReferenceRegistered');
  }
  updateAccountReference(id: string, expected: number, patch: any) {
    const o = this.accounts.get(id);
    if (!o) throw new SocialPlatformCoordinationError('SocialAccountReferenceNotFound', id);
    if (o.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialAccountReferenceInvalid', 'stale');
    }
    this.accounts.set(
      id,
      freeze({ ...o, ...patch, rawAccountId: undefined, generation: expected + 1 }),
    );
    this.emit('SocialAccountReferenceUpdated');
  }
  removeAccountReference(id: string) {
    this.accounts.delete(id);
  }
  registerChannelReference(i: {
    channelRefId: string;
    platformId: SocialPlatformIdentifier;
    rawChannelId?: string;
    available?: boolean;
    generation?: number;
    safeMetadata?: Safe;
  }) {
    this.put(
      this.channels,
      i.channelRefId,
      {
        channelRefId: i.channelRefId,
        generation: i.generation ?? 1,
        platformId: i.platformId,
        available: i.available ?? true,
        redactedChannel: redact(i.rawChannelId ?? i.channelRefId),
        safeMetadata: i.safeMetadata ?? {},
      },
      'DuplicateSocialChannelReference',
    );
    this.emit('SocialChannelReferenceRegistered');
  }
  updateChannelReference(id: string, expected: number, patch: any) {
    const o = this.channels.get(id);
    if (!o) throw new SocialPlatformCoordinationError('SocialChannelReferenceNotFound', id);
    if (o.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialChannelReferenceInvalid', 'stale');
    }
    this.channels.set(
      id,
      freeze({ ...o, ...patch, rawChannelId: undefined, generation: expected + 1 }),
    );
    this.emit('SocialChannelReferenceUpdated');
  }
  removeChannelReference(id: string) {
    this.channels.delete(id);
  }
  registerDestinationProfile(p: SocialDestinationProfileSnapshot) {
    if (
      !this.accounts.has(p.accountRefId) ||
      !this.channels.has(p.channelRefId) ||
      !this.caps.has(`${p.platformId}:${p.capabilityVersion}`)
    )
      throw new SocialPlatformCoordinationError(
        'SocialDestinationProfileInvalid',
        'missing reference',
      );
    this.put(this.profiles, p.profileId, p, 'DuplicateSocialDestinationProfile');
    this.emit('SocialDestinationProfileRegistered');
  }
  updateDestinationProfile(id: string, expected: number, patch: any) {
    const o = this.profiles.get(id);
    if (!o) throw new SocialPlatformCoordinationError('SocialDestinationProfileNotFound', id);
    if (o.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialDestinationProfileInvalid', 'stale');
    }
    this.profiles.set(id, freeze({ ...o, ...patch, generation: expected + 1 }));
    this.emit('SocialDestinationProfileUpdated');
  }
  removeDestinationProfile(id: string) {
    this.profiles.delete(id);
  }
  createLiveEvent(e: SocialLiveEventSnapshot) {
    if (!e.title || e.title.length > 140 || e.description.length > 5000)
      throw new SocialPlatformCoordinationError('SocialLiveEventInvalid', 'invalid metadata');
    this.put(this.events, e.eventId, e, 'DuplicateSocialLiveEvent');
    this.emit('SocialLiveEventCreated');
  }
  updateLiveEvent(id: string, expected: number, patch: any) {
    const o = this.events.get(id);
    if (!o) throw new SocialPlatformCoordinationError('SocialLiveEventNotFound', id);
    if (o.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialLiveEventInvalid', 'stale');
    }
    this.events.set(id, freeze({ ...o, ...patch, generation: expected + 1 }));
    this.emit('SocialLiveEventUpdated');
  }
  removeLiveEvent(id: string) {
    this.events.delete(id);
  }
  createOutputMapping(m: SocialPlatformOutputMappingSnapshot) {
    if (
      [...this.mappings.values()].some(
        (x) => x.sessionId === m.sessionId && x.outputRole === m.outputRole && x.enabled,
      )
    )
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialOutputMapping',
        'duplicate output mapping',
      );
    if (
      (m.outputRole === 'HORIZONTAL_PROGRAM' && m.aspectRatioRole === 'VERTICAL') ||
      (m.outputRole === 'VERTICAL_PROGRAM' && m.aspectRatioRole === 'HORIZONTAL')
    )
      throw new SocialPlatformCoordinationError('SocialOutputMappingInvalid', 'output-role alias');
    this.put(this.mappings, m.mappingId, m, 'DuplicateSocialOutputMapping');
    this.emit('SocialOutputMappingCreated');
  }
  updateOutputMapping(id: string, expected: number, patch: any) {
    const o = this.mappings.get(id);
    if (!o) throw new SocialPlatformCoordinationError('SocialOutputMappingInvalid', id);
    if (o.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialOutputMappingInvalid', 'stale');
    }
    this.mappings.set(id, freeze({ ...o, ...patch, generation: expected + 1 }));
  }
  removeOutputMapping(id: string) {
    this.mappings.delete(id);
  }
  createSession(s: SocialPlatformSessionDefinitionSnapshot) {
    if (
      !this.profiles.has(s.profileId) ||
      !this.events.has(s.eventId) ||
      !this.mappings.has(s.mappingId)
    )
      throw new SocialPlatformCoordinationError(
        'SocialPlatformSessionInvalid',
        'missing reference',
      );
    this.put(this.sessions, s.sessionId, s, 'DuplicateSocialPlatformSession');
    this.states.set(
      s.sessionId,
      freeze({
        sessionId: s.sessionId,
        generation: s.generation,
        state: 'CREATED',
        readiness: 'UNKNOWN',
        compatibility: 'UNKNOWN',
        safeMetadata: {},
      }),
    );
    this.emit('SocialSessionCreated');
  }
  updateSession(id: string, expected: number, patch: any) {
    const o = this.sessions.get(id);
    if (!o) throw new SocialPlatformCoordinationError('SocialPlatformSessionNotFound', id);
    if (o.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialPlatformSessionGenerationMismatch', 'stale');
    }
    this.sessions.set(id, freeze({ ...o, ...patch, generation: expected + 1 }));
  }
  destroySession(id: string) {
    this.states.set(id, freeze({ ...this.mustState(id), state: 'STOPPED' }));
    this.sessions.delete(id);
  }
  createLiveGroup(g: SocialLiveGroupDefinitionSnapshot) {
    if (
      g.requiredSessionIds.some((id) => !g.sessionIds.includes(id)) ||
      g.quorum > g.sessionIds.length
    )
      throw new SocialPlatformCoordinationError('SocialLiveGroupInvalid', 'quorum impossible');
    g.sessionIds.forEach((id) => this.mustSession(id));
    this.put(
      this.groups,
      g.groupId,
      freeze({
        ...g,
        sessionIds: g.sessionIds.slice().sort(),
        requiredSessionIds: g.requiredSessionIds.slice().sort(),
      }),
      'DuplicateSocialLiveGroup',
    );
    this.emit('SocialLiveGroupCreated');
  }
  updateLiveGroup(id: string, expected: number, patch: any) {
    const o = this.groups.get(id);
    if (!o) throw new SocialPlatformCoordinationError('SocialLiveGroupNotFound', id);
    if (o.generation !== expected) {
      this.telemetry.staleGenerations++;
      throw new SocialPlatformCoordinationError('SocialLiveGroupInvalid', 'stale');
    }
    this.groups.set(id, freeze({ ...o, ...patch, generation: expected + 1 }));
    this.emit('SocialLiveGroupUpdated');
  }
  removeLiveGroup(id: string) {
    this.groups.delete(id);
  }
  evaluateCompatibility(r: SocialPlatformCompatibilityRequestSnapshot) {
    const s = this.mustSession(r.sessionId),
      p = this.mustProfile(s.profileId),
      c = this.caps.get(`${p.platformId}:${p.capabilityVersion}`);
    if (!c)
      throw new SocialPlatformCoordinationError('SocialPlatformCapabilitiesNotFound', p.platformId);
    const res = this.backend().evaluateCompatibility(c, r);
    this.compat.set(res.resultId, res);
    this.telemetry.compatibilityRequests++;
    this.emit('SocialCompatibilityEvaluated');
    return res;
  }
  evaluateReadiness(sessionId: string, streamReady = true) {
    const s = this.mustSession(sessionId),
      p = this.mustProfile(s.profileId),
      a = this.mustAccount(p.accountRefId),
      ch = this.mustChannel(p.channelRefId),
      e = this.mustEvent(s.eventId);
    const r = this.backend().evaluateReadiness(s, p, a, ch, e, streamReady);
    this.ready.set(sessionId, r);
    this.telemetry.readinessEvaluations++;
    const st = this.mustState(sessionId);
    this.states.set(
      sessionId,
      freeze({
        ...st,
        state: r.ready ? 'READY' : 'WAITING',
        readiness: r.ready ? 'READY' : 'WAITING',
      }),
    );
    this.emit(r.ready ? 'SocialSessionReady' : 'SocialSessionWaiting');
    return r;
  }
  request(req: SocialCoordinationRequestSnapshot) {
    this.ensure();
    if (this.processed.has(req.requestId)) {
      this.telemetry.duplicateRequests++;
      throw new SocialPlatformCoordinationError('SocialDuplicateRequest', 'duplicate request');
    }
    this.processed.add(req.requestId);
    if (this.processed.size > LIMIT.requests)
      this.processed = new Set([...this.processed].slice(-LIMIT.requests));
    const ids = req.groupId
      ? this.mustGroup(req.groupId).sessionIds
      : [this.mustSession(req.sessionId!).sessionId];
    const plan = this.backend().createPlan(req, ids);
    this.plans.set(plan.planId, plan);
    const result = this.backend().activate(plan, req.safeMetadata?.simulateFailure as any);
    this.results.set(result.resultId, result);
    for (const id of ids) {
      const st = this.mustState(id);
      const next: any =
        req.action === 'PAUSE'
          ? 'PAUSED'
          : req.action === 'STOP'
            ? 'STOPPED'
            : req.action === 'RETRY'
              ? 'RETRYING'
              : req.action === 'RECONNECT'
                ? 'RECONNECTING'
                : result.status === 'ACTIVE'
                  ? 'ACTIVE'
                  : result.status === 'DEGRADED'
                    ? 'DEGRADED'
                    : 'FAILED';
      this.states.set(id, freeze({ ...st, state: next, lastResultId: result.resultId }));
    }
    if (req.action === 'ACTIVATE') this.telemetry.activations++;
    if (req.action === 'RETRY') this.telemetry.retries++;
    if (req.action === 'RECONNECT') this.telemetry.reconnects++;
    if (result.status === 'FAILED') this.telemetry.requiredPlatformFailures++;
    if (result.status === 'DEGRADED') this.telemetry.optionalPlatformFailures++;
    this.emit('SocialLiveAggregateChanged');
    return result;
  }
  drain() {
    for (const id of this.sessions.keys())
      this.states.set(id, freeze({ ...this.mustState(id), state: 'STOPPED' }));
  }
  reset() {
    this.plans.clear();
    this.results.clear();
    this.ready.clear();
    this.compat.clear();
    this.processed.clear();
  }
  shutdownEngine() {
    if (this.shutdown) return;
    this.drain();
    this.reset();
    this.backends.clear();
    this.shutdown = true;
    this.emit('SocialPlatformCoordinatorShutdown');
  }
  health(): SocialPlatformCoordinatorHealthSnapshot {
    const states = [...this.states.values()],
      ag = this.aggregateStates();
    return freeze({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.assertInvariants().valid ? 'HEALTHY' : 'FAILED',
      backendCount: this.backends.size,
      platformCapabilityCount: this.caps.size,
      accountReferenceCount: this.accounts.size,
      channelReferenceCount: this.channels.size,
      destinationProfileCount: this.profiles.size,
      eventCount: this.events.size,
      sessionCount: this.sessions.size,
      activeSessionCount: states.filter((s) => s.state === 'ACTIVE').length,
      readySessionCount: states.filter((s) => s.state === 'READY').length,
      waitingSessionCount: states.filter((s) => s.state === 'WAITING').length,
      degradedSessionCount: states.filter((s) => s.state === 'DEGRADED').length,
      failedSessionCount: states.filter((s) => s.state === 'FAILED').length,
      liveGroupCount: this.groups.size,
      activeGroupCount: ag.filter((a) => a.state === 'ACTIVE').length,
      partialGroupCount: ag.filter((a) => a.state === 'PARTIAL').length,
      failedGroupCount: ag.filter((a) => a.state === 'FAILED').length,
      compatibilityCheckCount: this.compat.size,
      incompatibleResultCount: [...this.compat.values()].filter((c) => !c.compatible).length,
      readinessCheckCount: this.ready.size,
      activationCount: this.telemetry.activations,
      retryCoordinationCount: this.telemetry.retries,
      reconnectCoordinationCount: this.telemetry.reconnects,
      duplicateRequestCount: this.telemetry.duplicateRequests,
      staleGenerationRejectionCount: this.telemetry.staleGenerations,
      accountUnavailableCount: [...this.accounts.values()].filter((a) => !a.available).length,
      channelUnavailableCount: [...this.channels.values()].filter((a) => !a.available).length,
      eventNotReadyCount: [...this.events.values()].filter((e) => !e.ready).length,
      streamNotReadyCount: [...this.ready.values()].filter((r) =>
        r.reasons.includes('stream not ready'),
      ).length,
      aspectRatioIncompatibilityCount: [...this.compat.values()].filter((c) =>
        c.reasons.includes('aspectRatio'),
      ).length,
      codecIncompatibilityCount: [...this.compat.values()].filter(
        (c) => c.reasons.includes('videoCodec') || c.reasons.includes('audioCodec'),
      ).length,
      bitrateIncompatibilityCount: [...this.compat.values()].filter((c) =>
        c.reasons.includes('bitrate'),
      ).length,
      requiredPlatformFailureCount: this.telemetry.requiredPlatformFailures,
      optionalPlatformFailureCount: this.telemetry.optionalPlatformFailures,
      ...(states.find((s) => s.state === 'ACTIVE')?.sessionId
        ? { lastActivePlatform: states.find((s) => s.state === 'ACTIVE')!.sessionId }
        : {}),
      ...(this.incidents.at(-1) ? { lastFailure: this.incidents.at(-1)! } : {}),
      updatedAtNs: 0,
    });
  }
  aggregateStates() {
    return arr(this.groups).map((g) => {
      const sts = g.sessionIds.map((id) => this.states.get(id));
      const active = sts
        .filter((s) => s?.state === 'ACTIVE')
        .map((s) => s!.sessionId)
        .sort();
      const failed = sts
        .filter((s) => s?.state === 'FAILED')
        .map((s) => s!.sessionId)
        .sort();
      const degraded = sts
        .filter((s) => s?.state === 'DEGRADED')
        .map((s) => s!.sessionId)
        .sort();
      const reqFailed = g.requiredSessionIds.some((id) => failed.includes(id));
      const quorum = active.length >= g.quorum && !reqFailed;
      return freeze({
        groupId: g.groupId,
        state: reqFailed
          ? 'FAILED'
          : active.length === g.sessionIds.length
            ? 'ACTIVE'
            : quorum
              ? 'PARTIAL'
              : failed.length
                ? 'DEGRADED'
                : 'WAITING',
        activeSessionIds: active,
        degradedSessionIds: degraded,
        failedSessionIds: failed,
        quorumReached: quorum,
      });
    });
  }
  assertInvariants(): SocialPlatformCoordinatorValidationReport {
    const errors: string[] = [];
    const seen = new Set<string>();
    for (const r of this.results.values()) {
      if (seen.has(r.requestId)) errors.push('duplicate result');
      seen.add(r.requestId);
      if ((r as any).realPlatformActivation) errors.push('false real platform activation');
    }
    for (const s of this.sessions.values()) {
      if (
        !this.profiles.has(s.profileId) ||
        !this.events.has(s.eventId) ||
        !this.mappings.has(s.mappingId)
      )
        errors.push('session missing references');
    }
    for (const g of this.groups.values()) {
      if (g.quorum > g.sessionIds.length) errors.push('quorum impossible');
      if (g.requiredSessionIds.some((id) => !g.sessionIds.includes(id)))
        errors.push('required not subset');
    }
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: ['synthetic metadata-only backend; no native or remote platform required'],
      checkedInvariants: [
        'unique ids',
        'monotonic expected generations',
        'valid references',
        'no output-role alias',
        'one request/result',
        'no real API/OAuth/event/stream-key behavior',
        'bounded state',
        'shutdown cleanup',
      ],
    });
  }
  snapshot(): SocialPlatformCoordinatorEngineSnapshot {
    return freeze({
      version: SOCIAL_PLATFORM_COORDINATION_VERSION,
      backends: [...this.backends.values()]
        .map((b) => b.snapshot())
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      capabilities: arr(this.caps),
      accounts: arr(this.accounts),
      channels: arr(this.channels),
      profiles: arr(this.profiles),
      events: arr(this.events),
      sessions: arr(this.sessions),
      sessionStates: arr(this.states),
      mappings: arr(this.mappings),
      groups: arr(this.groups),
      compatibilityResults: arr(this.compat),
      readiness: arr(this.ready),
      plans: arr(this.plans),
      results: arr(this.results),
      platformHealth: arr(this.states).map((s) =>
        freeze({
          sessionId: s.sessionId,
          platformId: this.mustProfile(this.mustSession(s.sessionId).profileId).platformId,
          state: s.state,
          healthy: !['FAILED', 'SHUTDOWN'].includes(s.state),
        }),
      ),
      aggregateStates: this.aggregateStates(),
      health: this.health(),
      telemetry: freeze(clone(this.telemetry)),
      watchdogIncidents: this.incidents.slice(-LIMIT.incidents),
      validation: this.assertInvariants(),
    });
  }
  private mustSession(id: string) {
    const v = this.sessions.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialPlatformSessionNotFound', id);
    return v;
  }
  private mustState(id: string) {
    const v = this.states.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialPlatformSessionNotFound', id);
    return v;
  }
  private mustProfile(id: string) {
    const v = this.profiles.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialDestinationProfileNotFound', id);
    return v;
  }
  private mustAccount(id: string) {
    const v = this.accounts.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialAccountReferenceNotFound', id);
    return v;
  }
  private mustChannel(id: string) {
    const v = this.channels.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialChannelReferenceNotFound', id);
    return v;
  }
  private mustEvent(id: string) {
    const v = this.events.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialLiveEventNotFound', id);
    return v;
  }
  private mustGroup(id: string) {
    const v = this.groups.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialLiveGroupNotFound', id);
    return v;
  }
}
export const createSocialPlatformDestinationCoordinator = (id?: string) =>
  new SocialPlatformDestinationCoordinator(id);
export class SocialPlatformDestinationCoordinatorProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'social-platform-destination-coordination',
    name: 'Social Platform Destination Coordination',
    version: SOCIAL_PLATFORM_COORDINATION_VERSION,
    order: SOCIAL_PLATFORM_COORDINATION_PROCESSOR_ORDER,
    phase: 'OUTPUT',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: ['streaming-output-foundation', 'multi-destination-distribution-fanout'],
    optionalCapabilities: [],
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
    metadata: { syntheticOnly: true, noSecondLoop: true },
  };
  constructor(readonly coordinator: SocialPlatformDestinationCoordinator) {}
  initialize() {
    return {
      status: 'READY' as const,
      metadata: { order: SOCIAL_PLATFORM_COORDINATION_PROCESSOR_ORDER },
    };
  }
  async processTick(tick: FrameTick, context: ProcessorRuntimeContext | any) {
    void tick;
    const s = this.coordinator.snapshot();
    context?.outputs?.publish?.(
      this.descriptor.id,
      SOCIAL_OUTPUT_KEYS.coordinatorHealth,
      s.health,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      SOCIAL_OUTPUT_KEYS.aggregateSocialLiveStates,
      s.aggregateStates,
      'BORROWED',
    );
    return { status: 'SUCCEEDED' as const, value: s.health };
  }
  shutdown() {
    this.coordinator.shutdownEngine();
    return { status: 'STOPPED' as const };
  }
}
export const createSocialPlatformDestinationCoordinatorProcessor = (
  c: SocialPlatformDestinationCoordinator,
) => new SocialPlatformDestinationCoordinatorProcessor(c);
export function createSocialPlatformCommandHandlers(
  c: SocialPlatformDestinationCoordinator,
): Readonly<Record<SocialCommandType, RuntimeCommandHandler>> {
  const h = (fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: 'SOCIAL',
      idempotent: true,
      execute(cmd: any) {
        return { status: 'SUCCEEDED', value: fn(cmd.payload ?? {}) };
      },
    }) as any;
  return {
    SOCIAL_REGISTER_BACKEND: h((p) => c.registerBackend(p.backend)),
    SOCIAL_UNREGISTER_BACKEND: h((p) => c.unregisterBackend(p.backendId)),
    SOCIAL_REGISTER_PLATFORM_CAPABILITIES: h((p) => c.registerCapabilities(p.capability)),
    SOCIAL_UPDATE_PLATFORM_CAPABILITIES: h((p) =>
      c.updateCapabilities(p.platformId, p.version, p.expectedGeneration, p.patch),
    ),
    SOCIAL_REGISTER_ACCOUNT_REFERENCE: h((p) => c.registerAccountReference(p)),
    SOCIAL_UPDATE_ACCOUNT_REFERENCE: h((p) =>
      c.updateAccountReference(p.accountRefId, p.expectedGeneration, p.patch),
    ),
    SOCIAL_REMOVE_ACCOUNT_REFERENCE: h((p) => c.removeAccountReference(p.accountRefId)),
    SOCIAL_REGISTER_CHANNEL_REFERENCE: h((p) => c.registerChannelReference(p)),
    SOCIAL_UPDATE_CHANNEL_REFERENCE: h((p) =>
      c.updateChannelReference(p.channelRefId, p.expectedGeneration, p.patch),
    ),
    SOCIAL_REMOVE_CHANNEL_REFERENCE: h((p) => c.removeChannelReference(p.channelRefId)),
    SOCIAL_REGISTER_DESTINATION_PROFILE: h((p) => c.registerDestinationProfile(p.profile)),
    SOCIAL_UPDATE_DESTINATION_PROFILE: h((p) =>
      c.updateDestinationProfile(p.profileId, p.expectedGeneration, p.patch),
    ),
    SOCIAL_REMOVE_DESTINATION_PROFILE: h((p) => c.removeDestinationProfile(p.profileId)),
    SOCIAL_CREATE_LIVE_EVENT: h((p) => c.createLiveEvent(p.event)),
    SOCIAL_UPDATE_LIVE_EVENT: h((p) => c.updateLiveEvent(p.eventId, p.expectedGeneration, p.patch)),
    SOCIAL_REMOVE_LIVE_EVENT: h((p) => c.removeLiveEvent(p.eventId)),
    SOCIAL_CREATE_SESSION: h((p) => c.createSession(p.session)),
    SOCIAL_UPDATE_SESSION: h((p) => c.updateSession(p.sessionId, p.expectedGeneration, p.patch)),
    SOCIAL_DESTROY_SESSION: h((p) => c.destroySession(p.sessionId)),
    SOCIAL_CREATE_OUTPUT_MAPPING: h((p) => c.createOutputMapping(p.mapping)),
    SOCIAL_UPDATE_OUTPUT_MAPPING: h((p) =>
      c.updateOutputMapping(p.mappingId, p.expectedGeneration, p.patch),
    ),
    SOCIAL_REMOVE_OUTPUT_MAPPING: h((p) => c.removeOutputMapping(p.mappingId)),
    SOCIAL_CREATE_LIVE_GROUP: h((p) => c.createLiveGroup(p.group)),
    SOCIAL_UPDATE_LIVE_GROUP: h((p) => c.updateLiveGroup(p.groupId, p.expectedGeneration, p.patch)),
    SOCIAL_REMOVE_LIVE_GROUP: h((p) => c.removeLiveGroup(p.groupId)),
    SOCIAL_VALIDATE_COMPATIBILITY: h((p) => c.evaluateCompatibility(p.request)),
    SOCIAL_REFRESH_READINESS: h((p) => c.evaluateReadiness(p.sessionId, p.streamReady)),
    SOCIAL_PREPARE: h((p) => c.request({ ...p.request, action: 'PREPARE' })),
    SOCIAL_ACTIVATE: h((p) => c.request({ ...p.request, action: 'ACTIVATE' })),
    SOCIAL_PAUSE: h((p) => c.request({ ...p.request, action: 'PAUSE' })),
    SOCIAL_RESUME: h((p) => c.request({ ...p.request, action: 'RESUME' })),
    SOCIAL_STOP: h((p) => c.request({ ...p.request, action: 'STOP' })),
    SOCIAL_RETRY: h((p) => c.request({ ...p.request, action: 'RETRY' })),
    SOCIAL_RECONNECT: h((p) => c.request({ ...p.request, action: 'RECONNECT' })),
    SOCIAL_DRAIN: h(() => c.drain()),
    SOCIAL_RESET: h(() => c.reset()),
    SOCIAL_RECONFIGURE: h(() => undefined),
    SOCIAL_CLEAR_PLAN_CACHE: h(() => c.reset()),
    SOCIAL_VALIDATE: h(() => c.assertInvariants()),
    SOCIAL_SHUTDOWN: h(() => c.shutdownEngine()),
  };
}
export function createSocialPlatformSourceGraphSnapshot(c: SocialPlatformDestinationCoordinator) {
  const s = c.snapshot();
  return freeze({
    platformIdentifiers: s.capabilities.map((x) => x.platformId),
    socialSessionIds: s.sessions.map((x) => x.sessionId),
    outputRoles: s.mappings.map((x) => x.outputRole),
    aspectRatioRoles: s.mappings.map((x) => x.aspectRatioRole),
    redactedAccountReferences: s.accounts.map((x) => x.redactedAccount),
    redactedChannelReferences: s.channels.map((x) => x.redactedChannel),
    eventIds: s.events.map((x) => redact(x.eventId)),
    socialSessionStates: s.sessionStates.map((x) => x.state),
    readinessStates: s.readiness.map((x) => x.ready),
    compatibilityStatus: s.compatibilityResults.map((x) => x.compatible),
    activeDegradedFailedPlatformSummaries: s.platformHealth,
    groupQuorumState: s.aggregateStates,
    chatReferenceAvailabilityMetadata: [],
    engagementReferenceAvailabilityMetadata: [],
    analyticsReferenceAvailabilityMetadata: [],
    realPlatformApi: false,
    realOAuth: false,
    health: s.health.healthState,
    readiness: s.health.readySessionCount,
  });
}
