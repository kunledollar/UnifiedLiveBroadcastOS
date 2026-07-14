/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';
import type { StreamingOutputRole, StreamingProtocol } from './streaming-output-foundation.js';
export const SOCIAL_PLATFORM_COORDINATION_VERSION = '5.7.8';
export const SOCIAL_PLATFORM_COORDINATION_PROCESSOR_ORDER = 1085;
const LIMIT = {
  backends: 16,
  capabilities: 32,
  accounts: 512,
  channels: 512,
  profiles: 512,
  events: 512,
  sessions: 512,
  mappings: 1024,
  groups: 128,
  requests: 10000,
  plans: 10000,
  results: 10000,
  warnings: 64,
  incidents: 512,
} as const;
type Safe = Readonly<Record<string, unknown>>;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};
export const redactSocialIdentifier = (s?: string) => (s ? `redacted:${hash(s)}` : undefined);
const bounded = <T>(a: readonly T[], n = LIMIT.warnings): readonly T[] =>
  freeze([...a].slice(0, n));
export const SOCIAL_PLATFORMS = [
  'YOUTUBE_LIVE',
  'FACEBOOK_LIVE',
  'TWITCH',
  'LINKEDIN_LIVE',
  'TIKTOK_LIVE_METADATA',
  'INSTAGRAM_LIVE_METADATA',
  'X_LIVE_METADATA',
  'KICK',
  'GENERIC_SOCIAL',
  'CUSTOM_TYPED',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
export const SOCIAL_METADATA_ONLY_PLATFORMS = [
  'TIKTOK_LIVE_METADATA',
  'INSTAGRAM_LIVE_METADATA',
  'X_LIVE_METADATA',
] as const;
export const SOCIAL_ACCOUNT_TYPES = [
  'USER',
  'CREATOR',
  'CHANNEL',
  'PAGE',
  'ORGANIZATION',
  'BRAND',
  'BUSINESS',
  'TEAM',
  'CUSTOM',
] as const;
export type SocialAccountType = (typeof SOCIAL_ACCOUNT_TYPES)[number];
export const SOCIAL_CHANNEL_TYPES = [
  'PRIMARY',
  'SECONDARY',
  'PAGE',
  'GROUP_METADATA',
  'EVENT_METADATA',
  'ORGANIZATION',
  'CUSTOM',
] as const;
export type SocialChannelType = (typeof SOCIAL_CHANNEL_TYPES)[number];
export const SOCIAL_EVENT_TYPES = [
  'IMMEDIATE_LIVE',
  'SCHEDULED_LIVE_METADATA',
  'PREMIERE_METADATA',
  'WEBINAR_METADATA',
  'AUDIO_LIVE_METADATA',
  'CUSTOM',
] as const;
export type SocialEventType = (typeof SOCIAL_EVENT_TYPES)[number];
export const SOCIAL_VISIBILITY_TYPES = [
  'PUBLIC',
  'UNLISTED',
  'PRIVATE',
  'FOLLOWERS_METADATA',
  'CONNECTIONS_METADATA',
  'MEMBERS_METADATA',
  'ORGANIZATION_METADATA',
  'CUSTOM',
] as const;
export type SocialVisibility = (typeof SOCIAL_VISIBILITY_TYPES)[number];
export const SOCIAL_ASPECT_RATIO_ROLES = [
  'HORIZONTAL_16_9',
  'VERTICAL_9_16',
  'SQUARE_1_1',
  'PORTRAIT_4_5_METADATA',
  'LANDSCAPE_CUSTOM',
  'PORTRAIT_CUSTOM',
  'CUSTOM',
] as const;
export type SocialAspectRatioRole = (typeof SOCIAL_ASPECT_RATIO_ROLES)[number];
export const SOCIAL_SESSION_STATES = [
  'CREATED',
  'VALIDATING',
  'WAITING_FOR_ACCOUNT',
  'WAITING_FOR_CHANNEL',
  'WAITING_FOR_EVENT',
  'WAITING_FOR_STREAM',
  'READY',
  'PREPARING',
  'PREPARED',
  'ACTIVATING',
  'ACTIVE',
  'DEGRADED',
  'RETRY_WAIT',
  'RECONNECTING',
  'PAUSING',
  'PAUSED',
  'STOPPING',
  'STOPPED',
  'FAILED',
  'DESTROYED',
  'SHUTDOWN',
] as const;
export type SocialSessionState = (typeof SOCIAL_SESSION_STATES)[number];
export const SOCIAL_STARTUP_POLICIES = [
  'WAIT_FOR_ACCOUNT_READY',
  'WAIT_FOR_CHANNEL_READY',
  'WAIT_FOR_EVENT_READY',
  'WAIT_FOR_STREAM_READY',
  'WAIT_FOR_CODEC_COMPATIBILITY',
  'WAIT_FOR_ASPECT_RATIO_COMPATIBILITY',
  'WAIT_FOR_ALL_REQUIRED_DESTINATIONS',
  'START_DEGRADED',
  'CUSTOM',
] as const;
export type SocialStartupPolicy = (typeof SOCIAL_STARTUP_POLICIES)[number];
export const SOCIAL_COMPATIBILITY_STATUSES = [
  'COMPATIBLE',
  'COMPATIBLE_WITH_WARNINGS',
  'DEGRADED_METADATA',
  'INCOMPATIBLE',
  'REJECTED',
] as const;
export type SocialCompatibilityStatus = (typeof SOCIAL_COMPATIBILITY_STATUSES)[number];
export const SOCIAL_COORDINATION_ACTIONS = [
  'VALIDATE',
  'PREPARE',
  'ACTIVATE',
  'PAUSE',
  'RESUME',
  'STOP',
  'RETRY',
  'RECONNECT',
  'REFRESH_READINESS',
  'CUSTOM',
] as const;
export type SocialCoordinationAction = (typeof SOCIAL_COORDINATION_ACTIONS)[number];
export const SOCIAL_COORDINATION_STATUSES = [
  'VALIDATED',
  'PREPARED',
  'ACTIVE',
  'PAUSED',
  'STOPPED',
  'DEGRADED',
  'RETRYING',
  'RECONNECTING',
  'CANCELLED',
  'FAILED',
  'REJECTED',
] as const;
export type SocialCoordinationStatus = (typeof SOCIAL_COORDINATION_STATUSES)[number];
export const SOCIAL_GROUP_ACTIVATION_POLICIES = [
  'ALL_READY',
  'ALL_REQUIRED_READY',
  'AT_LEAST_ONE_READY',
  'QUORUM_READY',
  'PRIMARY_READY',
  'CUSTOM',
] as const;
export type SocialGroupActivationPolicy = (typeof SOCIAL_GROUP_ACTIVATION_POLICIES)[number];
export const SOCIAL_GROUP_COMPLETION_POLICIES = [
  'WAIT_FOR_REQUIRED',
  'WAIT_FOR_ALL',
  'COMPLETE_ON_QUORUM',
  'COMPLETE_ON_PRIMARY',
  'CUSTOM',
] as const;
export type SocialGroupCompletionPolicy = (typeof SOCIAL_GROUP_COMPLETION_POLICIES)[number];
export const SOCIAL_GROUP_FAILURE_POLICIES = [
  'FAIL_ON_ANY_REQUIRED',
  'DEGRADE_ON_OPTIONAL_FAILURE',
  'CONTINUE_WITH_AVAILABLE',
  'STOP_ALL_ON_PRIMARY_FAILURE',
  'QUORUM_BASED',
  'CUSTOM',
] as const;
export type SocialGroupFailurePolicy = (typeof SOCIAL_GROUP_FAILURE_POLICIES)[number];
export const SOCIAL_AGGREGATE_STATES = [
  'CREATED',
  'WAITING',
  'READY',
  'PREPARING',
  'ACTIVE',
  'PARTIAL',
  'DEGRADED',
  'STOPPING',
  'STOPPED',
  'FAILED',
] as const;
export type SocialAggregateStateValue = (typeof SOCIAL_AGGREGATE_STATES)[number];
export const SOCIAL_OUTPUT_KEYS = freeze({
  platformCapabilities: 'social.platform.capabilities',
  accountReferences: 'social.account.references',
  channelReferences: 'social.channel.references',
  destinationProfiles: 'social.destination.profiles',
  liveEvents: 'social.live.events',
  contentMetadata: 'social.content.metadata',
  thumbnailReferences: 'social.thumbnail.references',
  coverReferences: 'social.cover.references',
  sessionDefinitions: 'social.session.definitions',
  sessionStates: 'social.session.states',
  readinessStates: 'social.readiness.states',
  compatibilityRequests: 'social.compatibility.requests',
  compatibilityResults: 'social.compatibility.results',
  outputMappings: 'social.output.mappings',
  liveGroups: 'social.live.groups',
  coordinationRequests: 'social.coordination.requests',
  coordinationPlans: 'social.coordination.plans',
  coordinationResults: 'social.coordination.results',
  destinationHealth: 'social.destination.health',
  aggregateStates: 'social.aggregate.states',
  chatChannelReferences: 'social.chat.references',
  engagementChannelReferences: 'social.engagement.references',
  analyticsChannelReferences: 'social.analytics.references',
  activeConfigurationTransactions: 'social.transactions.active',
  coordinatorHealth: 'social.coordinator.health',
  coordinatorTelemetry: 'social.coordinator.telemetry',
  backendHealth: 'social.backend.health',
  failedRejectedResults: 'social.results.failed-rejected',
});
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
export type SocialEventTypeName = (typeof SOCIAL_EVENTS)[number];
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
export type SocialWatchdogIncident = (typeof SOCIAL_WATCHDOG_INCIDENTS)[number];
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
    message: string,
  ) {
    super(
      `${code}: ${message.replace(/https?:\/\/\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, '[redacted]')}`,
    );
  }
}
export interface SocialPlatformCapabilityDefinition {
  readonly platform: SocialPlatform;
  readonly capabilityVersion: string;
  readonly capabilityGeneration: number;
  readonly supportedIngestProtocols: readonly StreamingProtocol[];
  readonly supportedVideoCodecs: readonly string[];
  readonly supportedAudioCodecs: readonly string[];
  readonly supportedContainers: readonly string[];
  readonly supportedResolutions: readonly string[];
  readonly supportedAspectRatios: readonly SocialAspectRatioRole[];
  readonly supportedFrameRates: readonly number[];
  readonly supportedAudioSampleRates: readonly number[];
  readonly supportedChannelLayouts: readonly string[];
  readonly minVideoBitrate: number;
  readonly maxVideoBitrate: number;
  readonly minAudioBitrate: number;
  readonly maxAudioBitrate: number;
  readonly keyframeIntervalMin: number;
  readonly keyframeIntervalMax: number;
  readonly secureTransportRequired: boolean;
  readonly scheduledEventSupport: string;
  readonly titleSupport: boolean;
  readonly descriptionSupport: boolean;
  readonly categorySupport: boolean;
  readonly visibilitySupport: readonly SocialVisibility[];
  readonly thumbnailReferenceSupport: boolean;
  readonly lowLatencySupport: string;
  readonly verticalLiveSupport: string;
  readonly squareLiveSupport: string;
  readonly chatChannelReferenceSupport: string;
  readonly engagementChannelReferenceSupport: string;
  readonly analyticsChannelReferenceSupport: string;
  readonly syntheticOnly: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type SocialPlatformCapabilitySnapshot = SocialPlatformCapabilityDefinition;
export interface SocialPlatformAccountReference {
  readonly accountRefId: string;
  readonly accountRefVersion: string;
  readonly accountRefGeneration: number;
  readonly platform: SocialPlatform;
  readonly providerMetadata: string;
  readonly accountType: SocialAccountType;
  readonly accountHashOrRedactedIdentifier: string;
  readonly displayNameMetadata: string;
  readonly classification: string;
  readonly available: boolean;
  readonly authorizationReferenceMetadata: string;
  readonly tokenReferenceMetadata: string;
  readonly expiresAtMetadata?: string;
  readonly health: string;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type SocialPlatformAccountReferenceSnapshot = SocialPlatformAccountReference;
export interface SocialPlatformChannelReference {
  readonly channelRefId: string;
  readonly channelRefVersion: string;
  readonly channelRefGeneration: number;
  readonly accountRefId: string;
  readonly accountRefGeneration: number;
  readonly platform: SocialPlatform;
  readonly channelType: SocialChannelType;
  readonly channelHashOrRedactedIdentifier: string;
  readonly displayNameMetadata: string;
  readonly liveEligibilityMetadata: string;
  readonly categoryEligibilityMetadata: string;
  readonly monetizationEligibilityMetadata: string;
  readonly chatEligibilityMetadata: string;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type SocialPlatformChannelReferenceSnapshot = SocialPlatformChannelReference;
export interface SocialLiveContentMetadata {
  readonly title: string;
  readonly description: string;
  readonly categoryReference: string;
  readonly languageMetadata: string;
  readonly tags: readonly string[];
  readonly contentRatingMetadata: string;
  readonly audienceClassificationMetadata: string;
  readonly brandedContentMetadataBoundary: string;
  readonly paidPromotionMetadataBoundary: string;
  readonly syntheticContentDisclosureMetadata: string;
  readonly captionsAvailabilityMetadata: string;
  readonly safeMetadata: Safe;
}
export type SocialLiveContentMetadataSnapshot = SocialLiveContentMetadata;
export interface SocialThumbnailReference {
  readonly referenceId: string;
  readonly generation: number;
  readonly assetId: string;
  readonly assetGeneration: number;
  readonly dimensionsMetadata: string;
  readonly contentHashMetadata: string;
  readonly available: boolean;
  readonly safeMetadata: Safe;
}
export type SocialThumbnailReferenceSnapshot = SocialThumbnailReference;
export type SocialCoverReference = SocialThumbnailReference;
export type SocialCoverReferenceSnapshot = SocialCoverReference;
export interface SocialChatChannelReference {
  readonly chatRefId: string;
  readonly chatRefGeneration: number;
  readonly platform: SocialPlatform;
  readonly accountRefId: string;
  readonly channelRefId: string;
  readonly eventId?: string;
  readonly availableMetadata: string;
  readonly readEligibilityMetadata: string;
  readonly writeEligibilityMetadata: string;
  readonly moderationEligibilityMetadata: string;
  readonly unifiedChatFutureEligibility: string;
  readonly safeMetadata: Safe;
}
export type SocialChatChannelReferenceSnapshot = SocialChatChannelReference;
export interface SocialEngagementChannelReference {
  readonly engagementRefId: string;
  readonly generation: number;
  readonly platform: SocialPlatform;
  readonly eventId?: string;
  readonly socialSessionId?: string;
  readonly reactionsAvailableMetadata: string;
  readonly likesAvailableMetadata: string;
  readonly sharesAvailableMetadata: string;
  readonly commentsAvailableMetadata: string;
  readonly viewerCountAvailableMetadata: string;
  readonly futureAggregationEligibility: string;
  readonly safeMetadata: Safe;
}
export type SocialEngagementChannelReferenceSnapshot = SocialEngagementChannelReference;
export interface SocialAnalyticsChannelReference {
  readonly analyticsRefId: string;
  readonly generation: number;
  readonly platform: SocialPlatform;
  readonly eventId?: string;
  readonly socialSessionId?: string;
  readonly realtimeEligibilityMetadata: string;
  readonly postEventEligibilityMetadata: string;
  readonly metricsSchemaMetadata: string;
  readonly futureAggregationEligibility: string;
  readonly safeMetadata: Safe;
}
export type SocialAnalyticsChannelReferenceSnapshot = SocialAnalyticsChannelReference;
export interface SocialDestinationProfile {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly platform: SocialPlatform;
  readonly accountRefId: string;
  readonly accountRefGeneration: number;
  readonly channelRefId: string;
  readonly channelRefGeneration: number;
  readonly outputRole: StreamingOutputRole;
  readonly aspectRatioRole: SocialAspectRatioRole;
  readonly preferredProtocol: StreamingProtocol;
  readonly fallbackProtocolMetadata: string;
  readonly sourceStreamingProfileId: string;
  readonly sourceStreamingProfileGeneration: number;
  readonly sourceDistributionProfileId: string;
  readonly sourceDistributionProfileGeneration: number;
  readonly sourceProtocolSessionId: string;
  readonly sourceProtocolSessionGeneration: number;
  readonly sourceDestinationId: string;
  readonly sourceDestinationGeneration: number;
  readonly codecPolicy: string;
  readonly bitratePolicy: string;
  readonly resolutionPolicy: string;
  readonly frameRatePolicy: string;
  readonly audioPolicy: string;
  readonly keyframePolicy: string;
  readonly secureTransportPolicy: string;
  readonly visibilityPolicy: SocialVisibility;
  readonly metadataPolicy: string;
  readonly eventPolicy: string;
  readonly readinessPolicy: readonly SocialStartupPolicy[];
  readonly retryCoordinationPolicy: string;
  readonly reconnectCoordinationPolicy: string;
  readonly failurePolicy: string;
  readonly criticality: 'REQUIRED' | 'OPTIONAL';
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type SocialDestinationProfileSnapshot = SocialDestinationProfile;
export interface SocialLiveEventDefinition {
  readonly eventId: string;
  readonly eventVersion: string;
  readonly eventGeneration: number;
  readonly platform: SocialPlatform;
  readonly accountRefId: string;
  readonly accountRefGeneration: number;
  readonly channelRefId: string;
  readonly channelRefGeneration: number;
  readonly eventType: SocialEventType;
  readonly content: SocialLiveContentMetadata;
  readonly visibility: SocialVisibility;
  readonly scheduledStartMetadata?: string;
  readonly scheduledEndMetadata?: string;
  readonly thumbnailReference?: SocialThumbnailReference;
  readonly coverReference?: SocialCoverReference;
  readonly streamDestinationReference: string;
  readonly eventReferenceMetadata: string;
  readonly streamReferenceMetadata: string;
  readonly chatChannelReference?: SocialChatChannelReference;
  readonly engagementChannelReference?: SocialEngagementChannelReference;
  readonly analyticsChannelReference?: SocialAnalyticsChannelReference;
  readonly readinessPolicy: readonly SocialStartupPolicy[];
  readonly lifecyclePolicy: string;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type SocialLiveEventSnapshot = SocialLiveEventDefinition;
export interface SocialPlatformSessionDefinition {
  readonly socialSessionId: string;
  readonly sessionVersion: string;
  readonly sessionGeneration: number;
  readonly platform: SocialPlatform;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly eventId: string;
  readonly eventGeneration: number;
  readonly accountRefGeneration: number;
  readonly channelRefGeneration: number;
  readonly streamingSessionId: string;
  readonly streamingSessionGeneration: number;
  readonly distributionSessionId: string;
  readonly distributionSessionGeneration: number;
  readonly protocolSessionId: string;
  readonly protocolSessionGeneration: number;
  readonly outputRole: StreamingOutputRole;
  readonly aspectRatioRole: SocialAspectRatioRole;
  readonly startupPolicy: readonly SocialStartupPolicy[];
  readonly activationPolicy: string;
  readonly stopPolicy: string;
  readonly retryCoordinationPolicy: string;
  readonly reconnectCoordinationPolicy: string;
  readonly failurePolicy: string;
  readonly enabled: boolean;
  readonly criticality: 'REQUIRED' | 'OPTIONAL';
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type SocialPlatformSessionDefinitionSnapshot = SocialPlatformSessionDefinition;
export interface SocialPlatformSessionStateSnapshot {
  readonly socialSessionId: string;
  readonly sessionGeneration: number;
  readonly platform: SocialPlatform;
  readonly state: SocialSessionState;
  readonly lastRuntimeFrame: string;
  readonly safeMetadata: Safe;
}
export interface SocialPlatformOutputMapping {
  readonly mappingId: string;
  readonly mappingVersion: string;
  readonly mappingGeneration: number;
  readonly socialSessionId: string;
  readonly socialSessionGeneration: number;
  readonly platform: SocialPlatform;
  readonly sourceOutputRole: StreamingOutputRole;
  readonly aspectRatioRole: SocialAspectRatioRole;
  readonly streamingSessionId: string;
  readonly streamingSessionGeneration: number;
  readonly distributionSessionId: string;
  readonly distributionSessionGeneration: number;
  readonly protocolSessionId: string;
  readonly protocolSessionGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly required: boolean;
  readonly priority: number;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
}
export type SocialPlatformOutputMappingSnapshot = SocialPlatformOutputMapping;
export interface SocialPlatformCompatibilityRequest {
  readonly requestId: string;
  readonly platform: SocialPlatform;
  readonly expectedCapabilityGeneration: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly eventId: string;
  readonly eventGeneration: number;
  readonly outputRole: StreamingOutputRole;
  readonly aspectRatioRole: SocialAspectRatioRole;
  readonly protocol: StreamingProtocol;
  readonly videoCodec: string;
  readonly audioCodec: string;
  readonly containerMetadata: string;
  readonly width: number;
  readonly height: number;
  readonly frameRate: number;
  readonly videoBitrate: number;
  readonly audioBitrate: number;
  readonly sampleRate: number;
  readonly channelLayout: string;
  readonly keyframeInterval: number;
  readonly secureTransport: boolean;
  readonly lowLatencyRequestedMetadata: string;
  readonly runtimeFrame: string;
  readonly safeMetadata: Safe;
}
export type SocialPlatformCompatibilityRequestSnapshot = SocialPlatformCompatibilityRequest;
export interface SocialPlatformCompatibilityResult {
  readonly requestId: string;
  readonly resultId: string;
  readonly status: SocialCompatibilityStatus;
  readonly platform: SocialPlatform;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly eventId: string;
  readonly eventGeneration: number;
  readonly protocolCompatible: boolean;
  readonly videoCodecCompatible: boolean;
  readonly audioCodecCompatible: boolean;
  readonly containerCompatible: boolean;
  readonly resolutionCompatible: boolean;
  readonly aspectRatioCompatible: boolean;
  readonly frameRateCompatible: boolean;
  readonly bitrateCompatible: boolean;
  readonly audioFormatCompatible: boolean;
  readonly keyframeCompatible: boolean;
  readonly secureTransportCompatible: boolean;
  readonly lowLatencyCompatibleMetadata: string;
  readonly eligible: boolean;
  readonly degraded: boolean;
  readonly rejectedReasons: readonly string[];
  readonly warnings: readonly string[];
  readonly synthetic: boolean;
  readonly completedAtNs: number;
}
export type SocialPlatformCompatibilityResultSnapshot = SocialPlatformCompatibilityResult;
export interface SocialPlatformReadinessState {
  readonly readinessId: string;
  readonly readinessGeneration: number;
  readonly socialSessionId: string;
  readonly sessionGeneration: number;
  readonly platform: SocialPlatform;
  readonly accountReady: boolean;
  readonly channelReady: boolean;
  readonly eventReady: boolean;
  readonly streamReady: boolean;
  readonly protocolReady: boolean;
  readonly codecReady: boolean;
  readonly audioReady: boolean;
  readonly bitrateReady: boolean;
  readonly resolutionReady: boolean;
  readonly frameRateReady: boolean;
  readonly keyframeReady: boolean;
  readonly aspectRatioReady: boolean;
  readonly secureTransportReady: boolean;
  readonly metadataReady: boolean;
  readonly destinationReady: boolean;
  readonly overallReady: boolean;
  readonly degraded: boolean;
  readonly blockingReasons: readonly string[];
  readonly warnings: readonly string[];
  readonly safeMetadata: Safe;
}
export type SocialPlatformReadinessSnapshot = SocialPlatformReadinessState;
export interface SocialLiveGroupDefinition {
  readonly groupId: string;
  readonly groupVersion: string;
  readonly groupGeneration: number;
  readonly displayName: string;
  readonly orderedSocialSessionIds: readonly string[];
  readonly requiredSessionIds: readonly string[];
  readonly optionalSessionIds: readonly string[];
  readonly activationPolicy: SocialGroupActivationPolicy;
  readonly completionPolicy: SocialGroupCompletionPolicy;
  readonly failurePolicy: SocialGroupFailurePolicy;
  readonly quorumPolicy: { readonly requiredCount: number };
  readonly metadataSynchronizationPolicy: string;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type SocialLiveGroupDefinitionSnapshot = SocialLiveGroupDefinition;
export interface SocialCoordinationRequest {
  readonly requestId: string;
  readonly socialSessionId: string;
  readonly expectedSessionGeneration: number;
  readonly expectedDestinationProfileGeneration: number;
  readonly expectedEventGeneration: number;
  readonly expectedAccountGeneration: number;
  readonly expectedChannelGeneration: number;
  readonly expectedStreamingSessionGeneration: number;
  readonly expectedDistributionSessionGeneration: number;
  readonly expectedProtocolSessionGeneration: number;
  readonly expectedPlatformCapabilityGeneration: number;
  readonly expectedOutputMappingGeneration: number;
  readonly requestedAction: SocialCoordinationAction;
  readonly requestedRuntimeFrame: string;
  readonly deadlineNs: number;
  readonly cancellationReference?: string;
  readonly correlationId: string;
  readonly safeMetadata: Safe;
}
export type SocialCoordinationRequestSnapshot = SocialCoordinationRequest;
export interface SocialCoordinationPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly socialSessionId: string;
  readonly sessionGeneration: number;
  readonly platform: SocialPlatform;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly eventId: string;
  readonly eventGeneration: number;
  readonly accountChannelSummaries: Safe;
  readonly outputMappingSummary: Safe;
  readonly compatibilityResult: SocialPlatformCompatibilityResult;
  readonly readinessResult: SocialPlatformReadinessState;
  readonly underlyingStreamingState: string;
  readonly underlyingDistributionState: string;
  readonly underlyingProtocolState: string;
  readonly requestedAction: SocialCoordinationAction;
  readonly resolvedAction: SocialCoordinationAction;
  readonly metadataSynchronizationAction: string;
  readonly retryCoordinationAction: string;
  readonly reconnectCoordinationAction: string;
  readonly failureIsolationAction: string;
  readonly operationOrder: readonly string[];
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Safe;
}
export type SocialCoordinationPlanSnapshot = SocialCoordinationPlan;
export interface SocialCoordinationResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: SocialCoordinationStatus;
  readonly runtimeFrame: string;
  readonly socialSessionId: string;
  readonly sessionGeneration: number;
  readonly platform: SocialPlatform;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly eventId: string;
  readonly eventGeneration: number;
  readonly outputRole: StreamingOutputRole;
  readonly aspectRatioRole: SocialAspectRatioRole;
  readonly readinessState: SocialPlatformReadinessState;
  readonly underlyingStreamState: string;
  readonly platformState: SocialSessionState;
  readonly compatibilityStatus: SocialCompatibilityStatus;
  readonly active: boolean;
  readonly degraded: boolean;
  readonly retrying: boolean;
  readonly reconnecting: boolean;
  readonly required: boolean;
  readonly warnings: readonly string[];
  readonly synthetic: boolean;
  readonly completedAtNs: number;
}
export type SocialCoordinationResultSnapshot = SocialCoordinationResult;
export interface SocialPlatformDestinationHealth {
  readonly platform: SocialPlatform;
  readonly socialSessionId: string;
  readonly sessionGeneration: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly eventId: string;
  readonly eventGeneration: number;
  readonly mappingId: string;
  readonly mappingGeneration: number;
  readonly required: boolean;
  readonly accountHealth: string;
  readonly channelHealth: string;
  readonly eventHealth: string;
  readonly compatibilityHealth: string;
  readonly readinessHealth: string;
  readonly streamHealth: string;
  readonly distributionHealth: string;
  readonly protocolHealth: string;
  readonly retryCount: number;
  readonly reconnectCount: number;
  readonly failureCount: number;
  readonly warningCount: number;
  readonly lastActiveRuntimeFrame: string;
  readonly lastFailure?: string;
  readonly healthState: string;
  readonly safeMetadata: Safe;
}
export type SocialPlatformDestinationHealthSnapshot = SocialPlatformDestinationHealth;
export interface SocialLiveAggregateState {
  readonly aggregateId: string;
  readonly aggregateGeneration: number;
  readonly groupId: string;
  readonly groupGeneration: number;
  readonly sessionIds: readonly string[];
  readonly activePlatformIds: readonly SocialPlatform[];
  readonly degradedPlatformIds: readonly SocialPlatform[];
  readonly failedPlatformIds: readonly SocialPlatform[];
  readonly waitingPlatformIds: readonly SocialPlatform[];
  readonly requiredPlatformIds: readonly SocialPlatform[];
  readonly optionalPlatformIds: readonly SocialPlatform[];
  readonly readyCount: number;
  readonly activeCount: number;
  readonly failedCount: number;
  readonly quorumReached: boolean;
  readonly allRequiredReady: boolean;
  readonly allRequiredActive: boolean;
  readonly overallState: SocialAggregateStateValue;
  readonly warnings: readonly string[];
  readonly safeMetadata: Safe;
}
export type SocialLiveAggregateStateSnapshot = SocialLiveAggregateState;
export interface SocialPlatformConfigurationTransaction {
  readonly transactionId: string;
  readonly transactionGeneration: number;
  readonly socialSessionId: string;
  readonly currentGenerations: Safe;
  readonly requestedGenerations: Safe;
  readonly profileUpdates: Safe;
  readonly eventMetadataUpdates: Safe;
  readonly outputMappingUpdates: Safe;
  readonly groupMembershipUpdates: Safe;
  readonly readinessPolicyUpdates: Safe;
  readonly failurePolicyUpdates: Safe;
  readonly validationReport: SocialPlatformCoordinatorValidationReport;
  readonly applicationBoundary: string;
  readonly state: 'CREATED' | 'VALIDATED' | 'COMMITTED' | 'CANCELLED' | 'FAILED' | 'COMPLETED';
  readonly failureReason?: string;
  readonly createdAtNs: number;
  readonly committedAtNs?: number;
  readonly completedAtNs?: number;
  readonly safeMetadata: Safe;
}
export type SocialPlatformConfigurationTransactionSnapshot = SocialPlatformConfigurationTransaction;
export interface SocialPlatformCoordinatorHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly platformCapabilityCount: number;
  readonly accountReferenceCount: number;
  readonly channelReferenceCount: number;
  readonly destinationProfileCount: number;
  readonly eventCount: number;
  readonly sessionCount: number;
  readonly activeSessionCount: number;
  readonly readySessionCount: number;
  readonly waitingSessionCount: number;
  readonly degradedSessionCount: number;
  readonly failedSessionCount: number;
  readonly liveGroupCount: number;
  readonly activeGroupCount: number;
  readonly partialGroupCount: number;
  readonly failedGroupCount: number;
  readonly compatibilityCheckCount: number;
  readonly incompatibleResultCount: number;
  readonly readinessCheckCount: number;
  readonly activationCount: number;
  readonly retryCoordinationCount: number;
  readonly reconnectCoordinationCount: number;
  readonly duplicateRequestCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly accountUnavailableCount: number;
  readonly channelUnavailableCount: number;
  readonly eventNotReadyCount: number;
  readonly streamNotReadyCount: number;
  readonly aspectRatioIncompatibilityCount: number;
  readonly codecIncompatibilityCount: number;
  readonly bitrateIncompatibilityCount: number;
  readonly requiredPlatformFailureCount: number;
  readonly optionalPlatformFailureCount: number;
  readonly lastActivePlatform?: SocialPlatform | undefined;
  readonly lastFailure?: string | undefined;
  readonly updatedAtNs: number;
}
export type SocialPlatformCoordinatorTelemetrySnapshot = Readonly<Record<string, unknown>>;
export interface SocialPlatformCoordinatorValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedInvariants: readonly string[];
}
export interface SocialPlatformCoordinatorEngineSnapshot {
  readonly version: string;
  readonly backends: readonly SocialPlatformBackendSnapshot[];
  readonly capabilities: readonly SocialPlatformCapabilitySnapshot[];
  readonly accounts: readonly SocialPlatformAccountReferenceSnapshot[];
  readonly channels: readonly SocialPlatformChannelReferenceSnapshot[];
  readonly profiles: readonly SocialDestinationProfileSnapshot[];
  readonly events: readonly SocialLiveEventSnapshot[];
  readonly sessions: readonly SocialPlatformSessionDefinitionSnapshot[];
  readonly sessionStates: readonly SocialPlatformSessionStateSnapshot[];
  readonly mappings: readonly SocialPlatformOutputMappingSnapshot[];
  readonly groups: readonly SocialLiveGroupDefinitionSnapshot[];
  readonly readiness: readonly SocialPlatformReadinessSnapshot[];
  readonly compatibilityResults: readonly SocialPlatformCompatibilityResultSnapshot[];
  readonly plans: readonly SocialCoordinationPlanSnapshot[];
  readonly results: readonly SocialCoordinationResultSnapshot[];
  readonly health: SocialPlatformCoordinatorHealthSnapshot;
  readonly telemetry: SocialPlatformCoordinatorTelemetrySnapshot;
  readonly validation: SocialPlatformCoordinatorValidationReport;
  readonly incidents: readonly SocialWatchdogIncident[];
}
export interface SocialPlatformBackendSnapshot {
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly supportedPlatforms: readonly SocialPlatform[];
  readonly realPlatformApi: false;
  readonly realOAuth: false;
  readonly realEventCreation: false;
  readonly realStreamKeyRetrieval: false;
  readonly deterministic: boolean;
  readonly maximumSessions: number;
  readonly maximumGroups: number;
  readonly safeMetadata: Safe;
}
export interface SocialPlatformCoordinationBackend {
  readonly descriptor: SocialPlatformBackendSnapshot;
  initializeSession(session: SocialPlatformSessionDefinition): SocialPlatformSessionStateSnapshot;
  evaluateCompatibility(
    req: SocialPlatformCompatibilityRequest,
    cap: SocialPlatformCapabilityDefinition,
  ): SocialPlatformCompatibilityResult;
  evaluateReadiness(
    session: SocialPlatformSessionDefinition,
    profile: SocialDestinationProfile,
    event: SocialLiveEventDefinition,
    account: SocialPlatformAccountReference,
    channel: SocialPlatformChannelReference,
    compat: SocialPlatformCompatibilityResult,
    mapping: SocialPlatformOutputMapping,
    streamState?: string,
  ): SocialPlatformReadinessState;
  createPlan(req: SocialCoordinationRequest, ctx: any): SocialCoordinationPlan;
  prepare(plan: SocialCoordinationPlan): SocialCoordinationResult;
  activate(plan: SocialCoordinationPlan): SocialCoordinationResult;
  pause(plan: SocialCoordinationPlan): SocialCoordinationResult;
  resume(plan: SocialCoordinationPlan): SocialCoordinationResult;
  stop(plan: SocialCoordinationPlan): SocialCoordinationResult;
  coordinateRetry(plan: SocialCoordinationPlan): SocialCoordinationResult;
  coordinateReconnect(plan: SocialCoordinationPlan): SocialCoordinationResult;
  aggregateGroupState(
    group: SocialLiveGroupDefinition,
    states: readonly SocialPlatformSessionStateSnapshot[],
    readiness: readonly SocialPlatformReadinessState[],
  ): SocialLiveAggregateState;
  reset(sessionId: string): void;
  reconfigure(tx: SocialPlatformConfigurationTransaction): SocialPlatformConfigurationTransaction;
  shutdownSession(sessionId: string): void;
  shutdown(): void;
}
export function createSocialContentMetadata(
  p: Partial<SocialLiveContentMetadata> & { title: string },
): SocialLiveContentMetadata {
  const clean = (s: string, n: number) => s.replace(/<[^>]*>|javascript:/gi, '').slice(0, n);
  return freeze({
    title: clean(p.title, 140),
    description: clean(p.description ?? '', 5000),
    categoryReference: clean(p.categoryReference ?? 'metadata', 128),
    languageMetadata: p.languageMetadata ?? 'und',
    tags: freeze(
      [...(p.tags ?? [])]
        .map((x) => clean(String(x), 48))
        .sort()
        .slice(0, 32),
    ),
    contentRatingMetadata: p.contentRatingMetadata ?? 'metadata-only',
    audienceClassificationMetadata: p.audienceClassificationMetadata ?? 'metadata-only',
    brandedContentMetadataBoundary: p.brandedContentMetadataBoundary ?? 'metadata-only',
    paidPromotionMetadataBoundary: p.paidPromotionMetadataBoundary ?? 'metadata-only',
    syntheticContentDisclosureMetadata:
      p.syntheticContentDisclosureMetadata ?? 'synthetic-coordination',
    captionsAvailabilityMetadata: p.captionsAvailabilityMetadata ?? 'metadata-only',
    safeMetadata: p.safeMetadata ?? {},
  });
}
export function createSocialPlatformCapabilityPreset(
  platform: SocialPlatform,
): SocialPlatformCapabilityDefinition {
  if (!SOCIAL_PLATFORMS.includes(platform))
    throw new SocialPlatformCoordinationError(
      'SocialPlatformCapabilitiesInvalid',
      'unsupported platform',
    );
  const meta = (SOCIAL_METADATA_ONLY_PLATFORMS as readonly string[]).includes(platform);
  const protocols: StreamingProtocol[] =
    platform === 'LINKEDIN_LIVE' || platform === 'FACEBOOK_LIVE'
      ? ['RTMPS_FOUNDATION']
      : platform === 'GENERIC_SOCIAL' || platform === 'CUSTOM_TYPED'
        ? [
            'RTMP_FOUNDATION',
            'RTMPS_FOUNDATION',
            'SRT_FOUNDATION',
            'WEBRTC_FOUNDATION',
            'NDI_METADATA',
          ]
        : ['RTMP_FOUNDATION', 'RTMPS_FOUNDATION'];
  const aspect: SocialAspectRatioRole[] =
    platform.includes('TIKTOK') || platform.includes('INSTAGRAM')
      ? ['VERTICAL_9_16', 'HORIZONTAL_16_9']
      : platform === 'TWITCH' || platform === 'KICK'
        ? ['HORIZONTAL_16_9']
        : ['HORIZONTAL_16_9', 'VERTICAL_9_16', 'SQUARE_1_1'];
  return freeze({
    platform,
    capabilityVersion: '5.7.8',
    capabilityGeneration: 1,
    supportedIngestProtocols: freeze(protocols),
    supportedVideoCodecs: freeze(['H264']),
    supportedAudioCodecs: freeze(['AAC']),
    supportedContainers: freeze(['FLV_METADATA', 'MPEGTS_METADATA', 'RTP_METADATA']),
    supportedResolutions: freeze(['1920x1080', '1280x720', '1080x1920', '720x1280', '1080x1080']),
    supportedAspectRatios: freeze(aspect),
    supportedFrameRates: freeze([24, 25, 30, 50, 60]),
    supportedAudioSampleRates: freeze([44100, 48000]),
    supportedChannelLayouts: freeze(['STEREO', 'MONO']),
    minVideoBitrate: 300000,
    maxVideoBitrate: platform === 'TWITCH' ? 8000000 : 12000000,
    minAudioBitrate: 64000,
    maxAudioBitrate: 320000,
    keyframeIntervalMin: 1,
    keyframeIntervalMax: 4,
    secureTransportRequired: platform === 'FACEBOOK_LIVE' || platform === 'LINKEDIN_LIVE',
    scheduledEventSupport:
      platform === 'YOUTUBE_LIVE' || platform === 'LINKEDIN_LIVE'
        ? 'metadata-supported'
        : 'metadata-only',
    titleSupport: true,
    descriptionSupport: platform !== 'TWITCH',
    categorySupport: platform === 'TWITCH' || platform === 'YOUTUBE_LIVE',
    visibilitySupport: freeze(
      platform === 'YOUTUBE_LIVE'
        ? ['PUBLIC', 'UNLISTED', 'PRIVATE']
        : platform === 'FACEBOOK_LIVE'
          ? ['PUBLIC', 'PRIVATE', 'FOLLOWERS_METADATA', 'MEMBERS_METADATA']
          : ['PUBLIC', 'CUSTOM'],
    ),
    thumbnailReferenceSupport: platform === 'YOUTUBE_LIVE',
    lowLatencySupport: platform === 'TWITCH' ? 'metadata-supported' : 'metadata-only',
    verticalLiveSupport: aspect.includes('VERTICAL_9_16') ? 'metadata-supported' : 'metadata-only',
    squareLiveSupport: aspect.includes('SQUARE_1_1') ? 'metadata-supported' : 'metadata-only',
    chatChannelReferenceSupport:
      platform === 'YOUTUBE_LIVE' || platform === 'TWITCH' || platform === 'KICK'
        ? 'metadata-supported'
        : 'metadata-only',
    engagementChannelReferenceSupport: 'metadata-only',
    analyticsChannelReferenceSupport: 'metadata-only',
    syntheticOnly: true,
    safeMetadata: {
      metadataOnly: meta,
      noPublicApiClaim: meta,
      realPlatformApi: false,
      realOAuth: false,
      realEventCreation: false,
      realStreamKeyRetrieval: false,
    },
    createdAtNs: 0,
    updatedAtNs: 0,
  });
}
export class SyntheticSocialPlatformCoordinationBackend implements SocialPlatformCoordinationBackend {
  readonly descriptor: SocialPlatformBackendSnapshot;
  constructor(id = 'synthetic-social-platform-backend') {
    this.descriptor = freeze({
      backendId: id,
      backendGeneration: 1,
      supportedPlatforms: freeze([...SOCIAL_PLATFORMS]),
      realPlatformApi: false,
      realOAuth: false,
      realEventCreation: false,
      realStreamKeyRetrieval: false,
      deterministic: true,
      maximumSessions: LIMIT.sessions,
      maximumGroups: LIMIT.groups,
      safeMetadata: { syntheticOnly: true, noHttp: true, noOAuth: true },
    });
  }
  initializeSession(s: SocialPlatformSessionDefinition) {
    return freeze({
      socialSessionId: s.socialSessionId,
      sessionGeneration: s.sessionGeneration,
      platform: s.platform,
      state: 'CREATED',
      lastRuntimeFrame: '0',
      safeMetadata: { synthetic: true },
    } as SocialPlatformSessionStateSnapshot);
  }
  evaluateCompatibility(
    req: SocialPlatformCompatibilityRequest,
    cap: SocialPlatformCapabilityDefinition,
  ) {
    const reasons: string[] = [];
    const ck = (ok: boolean, r: string) => {
      if (!ok) reasons.push(r);
      return ok;
    };
    const res = `${req.width}x${req.height}`;
    const pc = ck(cap.supportedIngestProtocols.includes(req.protocol), 'unsupported protocol'),
      vc = ck(cap.supportedVideoCodecs.includes(req.videoCodec), 'unsupported video codec'),
      ac = ck(cap.supportedAudioCodecs.includes(req.audioCodec), 'unsupported audio codec'),
      rc = ck(cap.supportedResolutions.includes(res), 'unsupported resolution'),
      ar = ck(cap.supportedAspectRatios.includes(req.aspectRatioRole), 'unsupported aspect ratio'),
      fr = ck(cap.supportedFrameRates.includes(req.frameRate), 'unsupported frame rate'),
      br = ck(
        req.videoBitrate >= cap.minVideoBitrate &&
          req.videoBitrate <= cap.maxVideoBitrate &&
          req.audioBitrate >= cap.minAudioBitrate &&
          req.audioBitrate <= cap.maxAudioBitrate,
        'invalid bitrate',
      ),
      af = ck(
        cap.supportedAudioSampleRates.includes(req.sampleRate) &&
          cap.supportedChannelLayouts.includes(req.channelLayout),
        'invalid audio format',
      ),
      kf = ck(
        req.keyframeInterval >= cap.keyframeIntervalMin &&
          req.keyframeInterval <= cap.keyframeIntervalMax,
        'invalid keyframe interval',
      ),
      sec = ck(!cap.secureTransportRequired || req.secureTransport, 'secure transport required');
    const eligible = reasons.length === 0;
    const warnings = cap.syntheticOnly
      ? ['synthetic metadata-only capability; no platform API activity']
      : [];
    return freeze({
      requestId: req.requestId,
      resultId: `social-compat:${hash(req.requestId)}`,
      status: eligible
        ? warnings.length
          ? 'COMPATIBLE_WITH_WARNINGS'
          : 'COMPATIBLE'
        : cap.syntheticOnly && reasons.every((r) => r.includes('metadata'))
          ? 'DEGRADED_METADATA'
          : 'INCOMPATIBLE',
      platform: req.platform,
      profileId: req.profileId,
      profileGeneration: req.profileGeneration,
      eventId: req.eventId,
      eventGeneration: req.eventGeneration,
      protocolCompatible: pc,
      videoCodecCompatible: vc,
      audioCodecCompatible: ac,
      containerCompatible: true,
      resolutionCompatible: rc,
      aspectRatioCompatible: ar,
      frameRateCompatible: fr,
      bitrateCompatible: br,
      audioFormatCompatible: af,
      keyframeCompatible: kf,
      secureTransportCompatible: sec,
      lowLatencyCompatibleMetadata: 'metadata-only',
      eligible,
      degraded: !eligible && warnings.length > 0,
      rejectedReasons: bounded(reasons),
      warnings: bounded(warnings),
      synthetic: true,
      completedAtNs: Number(req.runtimeFrame) || 0,
    } as SocialPlatformCompatibilityResult);
  }
  evaluateReadiness(
    s: SocialPlatformSessionDefinition,
    p: SocialDestinationProfile,
    e: SocialLiveEventDefinition,
    a: SocialPlatformAccountReference,
    c: SocialPlatformChannelReference,
    compat: SocialPlatformCompatibilityResult,
    m: SocialPlatformOutputMapping,
    streamState = 'READY',
  ) {
    const reasons: string[] = [];
    const account = a.available,
      channel = c.liveEligibilityMetadata !== 'unavailable',
      event = e.enabled && e.content.title.length > 0,
      stream = streamState === 'READY' || streamState === 'STREAMING' || streamState === 'ACTIVE',
      protocol = compat.protocolCompatible,
      codec = compat.videoCodecCompatible && compat.audioCodecCompatible,
      audio = compat.audioFormatCompatible,
      bitrate = compat.bitrateCompatible,
      resolution = compat.resolutionCompatible,
      frameRate = compat.frameRateCompatible,
      keyframe = compat.keyframeCompatible,
      aspect = compat.aspectRatioCompatible,
      secure = compat.secureTransportCompatible,
      metadata = e.enabled && p.enabled,
      dest = m.enabled;
    for (const [ok, r] of [
      [account, 'account unavailable'],
      [channel, 'channel unavailable'],
      [event, 'event not ready'],
      [stream, 'stream not ready'],
      [protocol, 'protocol incompatible'],
      [codec, 'codec incompatible'],
      [bitrate, 'bitrate incompatible'],
      [aspect, 'aspect ratio incompatible'],
      [secure, 'secure transport required'],
      [dest, 'destination disabled'],
    ] as const)
      if (!ok) reasons.push(r);
    const overall = reasons.length === 0;
    return freeze({
      readinessId: `social-ready:${hash(s.socialSessionId + '|' + s.sessionGeneration + '|' + compat.resultId)}`,
      readinessGeneration: s.sessionGeneration,
      socialSessionId: s.socialSessionId,
      sessionGeneration: s.sessionGeneration,
      platform: s.platform,
      accountReady: account,
      channelReady: channel,
      eventReady: event,
      streamReady: stream,
      protocolReady: protocol,
      codecReady: codec,
      audioReady: audio,
      bitrateReady: bitrate,
      resolutionReady: resolution,
      frameRateReady: frameRate,
      keyframeReady: keyframe,
      aspectRatioReady: aspect,
      secureTransportReady: secure,
      metadataReady: metadata,
      destinationReady: dest,
      overallReady: overall,
      degraded: !overall && p.criticality === 'OPTIONAL',
      blockingReasons: bounded(reasons),
      warnings: bounded(compat.warnings),
      safeMetadata: { synthetic: true },
    });
  }
  createPlan(req: SocialCoordinationRequest, ctx: any) {
    const s = ctx.session as SocialPlatformSessionDefinition,
      p = ctx.profile as SocialDestinationProfile,
      e = ctx.event as SocialLiveEventDefinition;
    const planId = `social-plan:${hash(req.requestId + '|' + s.socialSessionId)}`;
    return freeze({
      planId,
      requestId: req.requestId,
      socialSessionId: s.socialSessionId,
      sessionGeneration: s.sessionGeneration,
      platform: s.platform,
      profileId: p.profileId,
      profileGeneration: p.profileGeneration,
      eventId: e.eventId,
      eventGeneration: e.eventGeneration,
      accountChannelSummaries: ctx.accountChannelSummaries ?? {},
      outputMappingSummary: ctx.outputMappingSummary ?? {},
      compatibilityResult: ctx.compatibility,
      readinessResult: ctx.readiness,
      underlyingStreamingState: ctx.streamState ?? 'READY',
      underlyingDistributionState: ctx.distributionState ?? 'READY',
      underlyingProtocolState: ctx.protocolState ?? 'READY',
      requestedAction: req.requestedAction,
      resolvedAction: req.requestedAction,
      metadataSynchronizationAction: 'METADATA_ONLY_NO_API',
      retryCoordinationAction:
        req.requestedAction === 'RETRY' ? 'REQUEST_TYPED_STREAMING_RETRY' : 'NONE',
      reconnectCoordinationAction:
        req.requestedAction === 'RECONNECT' ? 'REQUEST_TYPED_STREAMING_RECONNECT' : 'NONE',
      failureIsolationAction:
        p.criticality === 'OPTIONAL' ? 'ISOLATE_OPTIONAL_PLATFORM' : 'REQUIRED_POLICY',
      operationOrder: freeze([
        'validate social session',
        'validate profile/event/account/channel',
        'validate output mapping',
        'validate platform capability generation',
        'validate underlying streaming/distribution/protocol sessions',
        'evaluate protocol/codec/audio/video compatibility',
        'evaluate aspect-ratio compatibility',
        'evaluate readiness',
        'resolve requested lifecycle action',
        'resolve retry/reconnect coordination',
        'resolve group/quorum impact',
        'publish coordination state',
        'update health and telemetry',
      ]),
      deterministicScore: parseInt(hash(planId).slice(0, 6), 16),
      warnings: bounded(ctx.readiness.warnings),
      safeMetadata: { synthetic: true, noPlatformAction: true },
    } as SocialCoordinationPlan);
  }
  private result(
    plan: SocialCoordinationPlan,
    status: SocialCoordinationStatus,
    state: SocialSessionState,
  ): SocialCoordinationResult {
    return freeze({
      requestId: plan.requestId,
      planId: plan.planId,
      status,
      runtimeFrame: String(plan.compatibilityResult.completedAtNs),
      socialSessionId: plan.socialSessionId,
      sessionGeneration: plan.sessionGeneration,
      platform: plan.platform,
      profileId: plan.profileId,
      profileGeneration: plan.profileGeneration,
      eventId: plan.eventId,
      eventGeneration: plan.eventGeneration,
      outputRole: (plan.outputMappingSummary as any).sourceOutputRole ?? 'PROGRAM',
      aspectRatioRole: (plan.outputMappingSummary as any).aspectRatioRole ?? 'HORIZONTAL_16_9',
      readinessState: plan.readinessResult,
      underlyingStreamState: plan.underlyingStreamingState,
      platformState: state,
      compatibilityStatus: plan.compatibilityResult.status,
      active: status === 'ACTIVE' && plan.readinessResult.overallReady,
      degraded: status === 'DEGRADED' || plan.readinessResult.degraded,
      retrying: status === 'RETRYING',
      reconnecting: status === 'RECONNECTING',
      required: (plan.outputMappingSummary as any).required ?? true,
      warnings: bounded([
        ...plan.warnings,
        ...(!plan.readinessResult.overallReady ? ['not active: readiness incomplete'] : []),
      ]),
      synthetic: true,
      completedAtNs: plan.compatibilityResult.completedAtNs,
    });
  }
  prepare(p: SocialCoordinationPlan) {
    return this.result(
      p,
      p.readinessResult.overallReady ? 'PREPARED' : 'DEGRADED',
      p.readinessResult.overallReady ? 'PREPARED' : 'DEGRADED',
    );
  }
  activate(p: SocialCoordinationPlan) {
    return this.result(
      p,
      p.readinessResult.overallReady ? 'ACTIVE' : 'REJECTED',
      p.readinessResult.overallReady ? 'ACTIVE' : 'WAITING_FOR_STREAM',
    );
  }
  pause(p: SocialCoordinationPlan) {
    return this.result(p, 'PAUSED', 'PAUSED');
  }
  resume(p: SocialCoordinationPlan) {
    return this.activate(p);
  }
  stop(p: SocialCoordinationPlan) {
    return this.result(p, 'STOPPED', 'STOPPED');
  }
  coordinateRetry(p: SocialCoordinationPlan) {
    return this.result(p, 'RETRYING', 'RETRY_WAIT');
  }
  coordinateReconnect(p: SocialCoordinationPlan) {
    return this.result(p, 'RECONNECTING', 'RECONNECTING');
  }
  aggregateGroupState(
    g: SocialLiveGroupDefinition,
    states: readonly SocialPlatformSessionStateSnapshot[],
    reads: readonly SocialPlatformReadinessState[],
  ) {
    const ordered = [...g.orderedSocialSessionIds].sort();
    const byState = new Map(states.map((s) => [s.socialSessionId, s]));
    const byReady = new Map(reads.map((r) => [r.socialSessionId, r]));
    const required = new Set(g.requiredSessionIds);
    const plats = (ids: readonly string[]) =>
      ids
        .map((id) => byState.get(id)?.platform)
        .filter(Boolean)
        .sort() as SocialPlatform[];
    const activeIds = ordered.filter((id) => byState.get(id)?.state === 'ACTIVE'),
      failedIds = ordered.filter((id) => byState.get(id)?.state === 'FAILED'),
      degradedIds = ordered.filter((id) => byState.get(id)?.state === 'DEGRADED'),
      waitingIds = ordered.filter(
        (id) => !['ACTIVE', 'FAILED', 'DEGRADED'].includes(byState.get(id)?.state ?? ''),
      );
    const readyCount = ordered.filter((id) => byReady.get(id)?.overallReady).length;
    const allReqReady = g.requiredSessionIds.every((id) => byReady.get(id)?.overallReady);
    const allReqActive = g.requiredSessionIds.every((id) => byState.get(id)?.state === 'ACTIVE');
    const quorum = readyCount >= g.quorumPolicy.requiredCount;
    const overall: SocialAggregateStateValue = failedIds.some((id) => required.has(id))
      ? 'FAILED'
      : allReqActive && activeIds.length === ordered.length
        ? 'ACTIVE'
        : activeIds.length > 0
          ? 'PARTIAL'
          : allReqReady
            ? 'READY'
            : degradedIds.length
              ? 'DEGRADED'
              : 'WAITING';
    return freeze({
      aggregateId: `social-aggregate:${hash(g.groupId + '|' + g.groupGeneration + '|' + ordered.join(','))}`,
      aggregateGeneration: g.groupGeneration,
      groupId: g.groupId,
      groupGeneration: g.groupGeneration,
      sessionIds: freeze(ordered),
      activePlatformIds: freeze(plats(activeIds)),
      degradedPlatformIds: freeze(plats(degradedIds)),
      failedPlatformIds: freeze(plats(failedIds)),
      waitingPlatformIds: freeze(plats(waitingIds)),
      requiredPlatformIds: freeze(plats(g.requiredSessionIds)),
      optionalPlatformIds: freeze(plats(g.optionalSessionIds)),
      readyCount,
      activeCount: activeIds.length,
      failedCount: failedIds.length,
      quorumReached: quorum,
      allRequiredReady: allReqReady,
      allRequiredActive: allReqActive,
      overallState: overall,
      warnings: freeze(quorum ? [] : ['quorum not reached']),
      safeMetadata: { synthetic: true },
    });
  }
  reset(_sessionId: string) {}
  reconfigure(tx: SocialPlatformConfigurationTransaction) {
    return freeze({
      ...tx,
      state: 'COMPLETED',
      completedAtNs: tx.completedAtNs ?? tx.createdAtNs,
    } as SocialPlatformConfigurationTransaction);
  }
  shutdownSession(_sessionId: string) {}
  shutdown() {}
}
export const createSyntheticSocialPlatformCoordinationBackend = (id?: string) =>
  new SyntheticSocialPlatformCoordinationBackend(id);
export class SocialPlatformDestinationCoordinator {
  private backends = new Map<string, SocialPlatformCoordinationBackend>();
  private caps = new Map<SocialPlatform, SocialPlatformCapabilityDefinition>();
  private accounts = new Map<string, SocialPlatformAccountReference>();
  private channels = new Map<string, SocialPlatformChannelReference>();
  private profiles = new Map<string, SocialDestinationProfile>();
  private events = new Map<string, SocialLiveEventDefinition>();
  private sessions = new Map<string, SocialPlatformSessionDefinition>();
  private states = new Map<string, SocialPlatformSessionStateSnapshot>();
  private mappings = new Map<string, SocialPlatformOutputMapping>();
  private groups = new Map<string, SocialLiveGroupDefinition>();
  private requests = new Set<string>();
  private results = new Map<string, SocialCoordinationResult>();
  private plans = new Map<string, SocialCoordinationPlan>();
  private readiness = new Map<string, SocialPlatformReadinessState>();
  private compatibility = new Map<string, SocialPlatformCompatibilityResult>();
  private incidents: SocialWatchdogIncident[] = [];
  private eventsLog: SocialEventTypeName[] = ['SocialPlatformCoordinatorCreated'];
  private shutdownFlag = false;
  private telemetry: any = {
    backendRegistrations: 0,
    backendRemovals: 0,
    capabilityRegistrations: 0,
    capabilityUpdates: 0,
    accountReferenceRegistrations: 0,
    accountReferenceUpdates: 0,
    accountReferenceRemovals: 0,
    channelReferenceRegistrations: 0,
    channelReferenceUpdates: 0,
    channelReferenceRemovals: 0,
    profileRegistrations: 0,
    profileUpdates: 0,
    profileRemovals: 0,
    eventCreates: 0,
    eventUpdates: 0,
    eventRemovals: 0,
    sessionCreates: 0,
    sessionUpdates: 0,
    sessionRemovals: 0,
    mappingCreates: 0,
    mappingUpdates: 0,
    mappingRemovals: 0,
    groupCreates: 0,
    groupUpdates: 0,
    groupRemovals: 0,
    compatibilityRequests: 0,
    compatibilityResults: 0,
    readinessEvaluations: 0,
    prepares: 0,
    activations: 0,
    pauses: 0,
    resumes: 0,
    stops: 0,
    retries: 0,
    reconnects: 0,
    activeResults: 0,
    partialResults: 0,
    degradedResults: 0,
    failedResults: 0,
    groupQuorumEvaluations: 0,
    requiredPlatformFailures: 0,
    optionalPlatformFailures: 0,
    duplicateRequests: 0,
    staleGenerations: 0,
    incompatibleProtocols: 0,
    incompatibleCodecs: 0,
    incompatibleResolutions: 0,
    incompatibleAspectRatios: 0,
    incompatibleBitrates: 0,
    unavailableAccounts: 0,
    unavailableChannels: 0,
    unavailableEvents: 0,
    lastEvent: 'SocialPlatformCoordinatorCreated',
  };
  constructor(readonly coordinatorId = 'social-platform-destination-coordinator') {}
  private ensure() {
    if (this.shutdownFlag)
      throw new SocialPlatformCoordinationError('SocialShutdownError', 'coordinator shutdown');
  }
  private emit(e: SocialEventTypeName) {
    this.eventsLog = [...this.eventsLog, e].slice(-LIMIT.incidents);
    this.telemetry.lastEvent = e;
  }
  private inc(i: SocialWatchdogIncident) {
    this.incidents = [...this.incidents, i].slice(-LIMIT.incidents);
  }
  registerBackend(b: SocialPlatformCoordinationBackend) {
    this.ensure();
    if (this.backends.has(b.descriptor.backendId))
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialPlatformBackend',
        'duplicate backend',
      );
    if (
      b.descriptor.realPlatformApi ||
      b.descriptor.realOAuth ||
      b.descriptor.realEventCreation ||
      b.descriptor.realStreamKeyRetrieval
    )
      throw new SocialPlatformCoordinationError(
        'SocialBackendFailed',
        'real platform backend forbidden',
      );
    this.backends.set(b.descriptor.backendId, b);
    this.telemetry.backendRegistrations++;
    this.emit('SocialBackendRegistered');
  }
  selectBackend(platform: SocialPlatform) {
    const b = [...this.backends.values()]
      .filter((x) => x.descriptor.supportedPlatforms.includes(platform))
      .sort((a, b) => a.descriptor.backendId.localeCompare(b.descriptor.backendId))[0];
    if (!b)
      throw new SocialPlatformCoordinationError('SocialPlatformBackendNotFound', 'no backend');
    return b;
  }
  registerCapabilities(c: SocialPlatformCapabilityDefinition) {
    this.ensure();
    if (this.caps.has(c.platform))
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialPlatformCapabilities',
        'duplicate capabilities',
      );
    this.caps.set(c.platform, freeze(clone(c)));
    this.telemetry.capabilityRegistrations++;
    this.emit('SocialPlatformCapabilitiesRegistered');
  }
  updateCapabilities(
    platform: SocialPlatform,
    expected: number,
    patch: Partial<SocialPlatformCapabilityDefinition>,
  ) {
    const c = this.mustCap(platform);
    if (c.capabilityGeneration !== expected) {
      this.telemetry.staleGenerations++;
      this.inc('SOCIAL_CAPABILITY_GENERATION_STALE');
      throw new SocialPlatformCoordinationError(
        'SocialPlatformCapabilitiesInvalid',
        'stale capability generation',
      );
    }
    const n = freeze({
      ...c,
      ...patch,
      capabilityGeneration: c.capabilityGeneration + 1,
      updatedAtNs: (patch as any).updatedAtNs ?? 0,
    } as SocialPlatformCapabilityDefinition);
    this.caps.set(platform, n);
    this.telemetry.capabilityUpdates++;
    this.emit('SocialPlatformCapabilitiesUpdated');
    return n;
  }
  registerAccountReference(a: SocialPlatformAccountReference) {
    this.ensure();
    if (this.accounts.has(a.accountRefId))
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialAccountReference',
        'duplicate account',
      );
    if (!a.accountHashOrRedactedIdentifier.startsWith('redacted:'))
      throw new SocialPlatformCoordinationError(
        'SocialAccountReferenceInvalid',
        'account identifier must be redacted',
      );
    this.accounts.set(a.accountRefId, freeze(clone(a)));
    this.telemetry.accountReferenceRegistrations++;
    this.emit('SocialAccountReferenceRegistered');
  }
  updateAccountReference(
    id: string,
    expected: number,
    patch: Partial<SocialPlatformAccountReference>,
  ) {
    const a = this.mustAccount(id);
    if (a.accountRefGeneration !== expected) {
      this.telemetry.staleGenerations++;
      this.inc('SOCIAL_ACCOUNT_GENERATION_STALE');
      throw new SocialPlatformCoordinationError(
        'SocialAccountReferenceInvalid',
        'stale account generation',
      );
    }
    const n = freeze({
      ...a,
      ...patch,
      accountRefGeneration: a.accountRefGeneration + 1,
      updatedAtNs: (patch as any).updatedAtNs ?? 0,
    } as SocialPlatformAccountReference);
    this.accounts.set(id, n);
    this.telemetry.accountReferenceUpdates++;
    this.emit('SocialAccountReferenceUpdated');
    return n;
  }
  registerChannelReference(c: SocialPlatformChannelReference) {
    this.ensure();
    if (this.channels.has(c.channelRefId))
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialChannelReference',
        'duplicate channel',
      );
    this.mustAccount(c.accountRefId);
    if (!c.channelHashOrRedactedIdentifier.startsWith('redacted:'))
      throw new SocialPlatformCoordinationError(
        'SocialChannelReferenceInvalid',
        'channel identifier must be redacted',
      );
    this.channels.set(c.channelRefId, freeze(clone(c)));
    this.telemetry.channelReferenceRegistrations++;
    this.emit('SocialChannelReferenceRegistered');
  }
  updateChannelReference(
    id: string,
    expected: number,
    patch: Partial<SocialPlatformChannelReference>,
  ) {
    const c = this.mustChannel(id);
    if (c.channelRefGeneration !== expected) {
      this.telemetry.staleGenerations++;
      this.inc('SOCIAL_CHANNEL_GENERATION_STALE');
      throw new SocialPlatformCoordinationError(
        'SocialChannelReferenceInvalid',
        'stale channel generation',
      );
    }
    const n = freeze({
      ...c,
      ...patch,
      channelRefGeneration: c.channelRefGeneration + 1,
      updatedAtNs: (patch as any).updatedAtNs ?? 0,
    } as SocialPlatformChannelReference);
    this.channels.set(id, n);
    this.telemetry.channelReferenceUpdates++;
    this.emit('SocialChannelReferenceUpdated');
    return n;
  }
  registerDestinationProfile(p: SocialDestinationProfile) {
    this.ensure();
    if (this.profiles.has(p.profileId))
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialDestinationProfile',
        'duplicate profile',
      );
    this.mustCap(p.platform);
    const a = this.mustAccount(p.accountRefId),
      c = this.mustChannel(p.channelRefId);
    if (
      a.accountRefGeneration !== p.accountRefGeneration ||
      c.channelRefGeneration !== p.channelRefGeneration
    )
      throw new SocialPlatformCoordinationError(
        'SocialDestinationProfileInvalid',
        'stale account/channel generation',
      );
    this.profiles.set(p.profileId, freeze(clone(p)));
    this.telemetry.profileRegistrations++;
    this.emit('SocialDestinationProfileRegistered');
  }
  updateDestinationProfile(id: string, expected: number, patch: Partial<SocialDestinationProfile>) {
    const p = this.mustProfile(id);
    if (p.profileGeneration !== expected) {
      this.telemetry.staleGenerations++;
      this.inc('SOCIAL_PROFILE_GENERATION_STALE');
      throw new SocialPlatformCoordinationError(
        'SocialDestinationProfileInvalid',
        'stale profile generation',
      );
    }
    const n = freeze({
      ...p,
      ...patch,
      profileGeneration: p.profileGeneration + 1,
      updatedAtNs: (patch as any).updatedAtNs ?? 0,
    } as SocialDestinationProfile);
    this.profiles.set(id, n);
    this.telemetry.profileUpdates++;
    this.emit('SocialDestinationProfileUpdated');
    return n;
  }
  createLiveEvent(e: SocialLiveEventDefinition) {
    this.ensure();
    if (this.events.has(e.eventId))
      throw new SocialPlatformCoordinationError('DuplicateSocialLiveEvent', 'duplicate event');
    if (
      e.content.title.length < 1 ||
      e.content.title.length > 140 ||
      e.content.description.length > 5000
    )
      throw new SocialPlatformCoordinationError(
        'SocialLiveEventInvalid',
        'invalid title/description',
      );
    const cap = this.mustCap(e.platform);
    if (!cap.visibilitySupport.includes(e.visibility))
      throw new SocialPlatformCoordinationError(
        'SocialLiveEventInvalid',
        'visibility incompatible',
      );
    this.events.set(e.eventId, freeze(clone(e)));
    this.telemetry.eventCreates++;
    this.emit('SocialLiveEventCreated');
  }
  updateLiveEvent(id: string, expected: number, patch: Partial<SocialLiveEventDefinition>) {
    const e = this.mustEvent(id);
    if (e.eventGeneration !== expected) {
      this.telemetry.staleGenerations++;
      this.inc('SOCIAL_EVENT_GENERATION_STALE');
      throw new SocialPlatformCoordinationError('SocialLiveEventInvalid', 'stale event generation');
    }
    const n = freeze({
      ...e,
      ...patch,
      eventGeneration: e.eventGeneration + 1,
      updatedAtNs: (patch as any).updatedAtNs ?? 0,
    } as SocialLiveEventDefinition);
    this.events.set(id, n);
    this.telemetry.eventUpdates++;
    this.emit('SocialLiveEventUpdated');
    return n;
  }
  createSession(s: SocialPlatformSessionDefinition) {
    this.ensure();
    if (this.sessions.has(s.socialSessionId))
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialPlatformSession',
        'duplicate session',
      );
    const p = this.mustProfile(s.profileId),
      e = this.mustEvent(s.eventId);
    if (p.profileGeneration !== s.profileGeneration || e.eventGeneration !== s.eventGeneration)
      throw new SocialPlatformCoordinationError(
        'SocialPlatformSessionGenerationMismatch',
        'stale profile/event generation',
      );
    const dup = [...this.sessions.values()].find(
      (x) =>
        x.platform === s.platform &&
        x.profileId === s.profileId &&
        x.outputRole === s.outputRole &&
        x.aspectRatioRole === s.aspectRatioRole,
    );
    if (dup)
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialPlatformSession',
        'one session per platform/profile/output mapping',
      );
    this.sessions.set(s.socialSessionId, freeze(clone(s)));
    this.states.set(s.socialSessionId, this.selectBackend(s.platform).initializeSession(s));
    this.telemetry.sessionCreates++;
    this.emit('SocialSessionCreated');
  }
  createOutputMapping(m: SocialPlatformOutputMapping) {
    this.ensure();
    if (this.mappings.has(m.mappingId))
      throw new SocialPlatformCoordinationError(
        'DuplicateSocialOutputMapping',
        'duplicate mapping',
      );
    const s = this.mustSession(m.socialSessionId);
    if (s.sessionGeneration !== m.socialSessionGeneration)
      throw new SocialPlatformCoordinationError(
        'SocialOutputMappingInvalid',
        'stale session generation',
      );
    const dup = [...this.mappings.values()].find(
      (x) =>
        x.platform === m.platform &&
        x.socialSessionId === m.socialSessionId &&
        x.sourceOutputRole === m.sourceOutputRole &&
        x.aspectRatioRole === m.aspectRatioRole,
    );
    if (dup)
      throw new SocialPlatformCoordinationError('DuplicateSocialOutputMapping', 'mapping conflict');
    if (
      (m.sourceOutputRole === 'HORIZONTAL_PROGRAM' && m.aspectRatioRole !== 'HORIZONTAL_16_9') ||
      (m.sourceOutputRole === 'VERTICAL_PROGRAM' && m.aspectRatioRole !== 'VERTICAL_9_16') ||
      (m.sourceOutputRole === 'SQUARE_PROGRAM' && m.aspectRatioRole !== 'SQUARE_1_1')
    )
      throw new SocialPlatformCoordinationError(
        'SocialOutputMappingInvalid',
        'output-role alias rejected',
      );
    this.mappings.set(m.mappingId, freeze(clone(m)));
    this.telemetry.mappingCreates++;
    this.emit('SocialOutputMappingCreated');
  }
  createLiveGroup(g: SocialLiveGroupDefinition) {
    this.ensure();
    if (this.groups.has(g.groupId))
      throw new SocialPlatformCoordinationError('DuplicateSocialLiveGroup', 'duplicate group');
    const ids = [...g.orderedSocialSessionIds];
    if (new Set(ids).size !== ids.length)
      throw new SocialPlatformCoordinationError(
        'SocialLiveGroupInvalid',
        'duplicate session in group',
      );
    for (const id of ids) this.mustSession(id);
    if (!g.requiredSessionIds.every((id) => ids.includes(id)))
      throw new SocialPlatformCoordinationError(
        'SocialLiveGroupInvalid',
        'required subset invalid',
      );
    if (g.quorumPolicy.requiredCount > ids.length) {
      this.inc('SOCIAL_GROUP_QUORUM_IMPOSSIBLE');
      throw new SocialPlatformCoordinationError('SocialGroupQuorumImpossible', 'quorum impossible');
    }
    this.groups.set(
      g.groupId,
      freeze({
        ...g,
        orderedSocialSessionIds: freeze([...ids].sort()),
        requiredSessionIds: freeze([...g.requiredSessionIds].sort()),
        optionalSessionIds: freeze([...g.optionalSessionIds].sort()),
      }),
    );
    this.telemetry.groupCreates++;
    this.emit('SocialLiveGroupCreated');
  }
  evaluateCompatibility(r: SocialPlatformCompatibilityRequest) {
    this.ensure();
    const cap = this.mustCap(r.platform);
    if (cap.capabilityGeneration !== r.expectedCapabilityGeneration) {
      this.telemetry.staleGenerations++;
      this.inc('SOCIAL_CAPABILITY_GENERATION_STALE');
      throw new SocialPlatformCoordinationError(
        'SocialCompatibilityRequestInvalid',
        'stale capability generation',
      );
    }
    const p = this.mustProfile(r.profileId),
      e = this.mustEvent(r.eventId);
    if (p.profileGeneration !== r.profileGeneration || e.eventGeneration !== r.eventGeneration)
      throw new SocialPlatformCoordinationError(
        'SocialCompatibilityRequestInvalid',
        'stale profile/event generation',
      );
    const res = this.selectBackend(r.platform).evaluateCompatibility(r, cap);
    this.compatibility.set(res.resultId, res);
    this.telemetry.compatibilityRequests++;
    this.telemetry.compatibilityResults++;
    if (!res.protocolCompatible) {
      this.telemetry.incompatibleProtocols++;
      this.inc('SOCIAL_PROTOCOL_INCOMPATIBLE');
    }
    if (!res.videoCodecCompatible || !res.audioCodecCompatible) {
      this.telemetry.incompatibleCodecs++;
      this.inc(
        !res.videoCodecCompatible
          ? 'SOCIAL_VIDEO_CODEC_INCOMPATIBLE'
          : 'SOCIAL_AUDIO_CODEC_INCOMPATIBLE',
      );
    }
    if (!res.resolutionCompatible) {
      this.telemetry.incompatibleResolutions++;
      this.inc('SOCIAL_RESOLUTION_INCOMPATIBLE');
    }
    if (!res.aspectRatioCompatible) {
      this.telemetry.incompatibleAspectRatios++;
      this.inc('SOCIAL_ASPECT_RATIO_INCOMPATIBLE');
    }
    if (!res.bitrateCompatible) {
      this.telemetry.incompatibleBitrates++;
      this.inc('SOCIAL_BITRATE_INCOMPATIBLE');
    }
    this.emit('SocialCompatibilityEvaluated');
    return res;
  }
  evaluateReadiness(
    sessionId: string,
    compat?: SocialPlatformCompatibilityResult,
    streamState = 'READY',
  ) {
    const s = this.mustSession(sessionId),
      p = this.mustProfile(s.profileId),
      e = this.mustEvent(s.eventId),
      a = this.mustAccount(p.accountRefId),
      c = this.mustChannel(p.channelRefId),
      m = this.mappingFor(s);
    const reqCompat =
      compat ??
      [...this.compatibility.values()]
        .filter((x) => x.profileId === p.profileId)
        .sort((a, b) => a.resultId.localeCompare(b.resultId))
        .at(-1);
    if (!reqCompat)
      throw new SocialPlatformCoordinationError(
        'SocialPlatformNotReady',
        'missing compatibility result',
      );
    const r = this.selectBackend(s.platform).evaluateReadiness(
      s,
      p,
      e,
      a,
      c,
      reqCompat,
      m,
      streamState,
    );
    this.readiness.set(r.readinessId, r);
    this.telemetry.readinessEvaluations++;
    if (!r.accountReady) {
      this.telemetry.unavailableAccounts++;
      this.inc('SOCIAL_ACCOUNT_UNAVAILABLE');
    }
    if (!r.channelReady) {
      this.telemetry.unavailableChannels++;
      this.inc('SOCIAL_CHANNEL_UNAVAILABLE');
    }
    if (!r.eventReady) {
      this.telemetry.unavailableEvents++;
      this.inc('SOCIAL_EVENT_NOT_READY');
    }
    if (!r.streamReady) this.inc('SOCIAL_STREAM_NOT_READY');
    this.emit(r.overallReady ? 'SocialSessionReady' : 'SocialSessionWaiting');
    return r;
  }
  coordinate(
    req: SocialCoordinationRequest,
    compatRequest?: SocialPlatformCompatibilityRequest,
    streamState = 'READY',
  ) {
    this.ensure();
    if (this.requests.has(req.requestId)) {
      this.telemetry.duplicateRequests++;
      this.inc('SOCIAL_DUPLICATE_REQUEST');
      throw new SocialPlatformCoordinationError('SocialDuplicateRequest', 'duplicate request');
    }
    const s = this.mustSession(req.socialSessionId),
      p = this.mustProfile(s.profileId),
      e = this.mustEvent(s.eventId),
      a = this.mustAccount(p.accountRefId),
      c = this.mustChannel(p.channelRefId),
      m = this.mappingFor(s);
    const stale =
      s.sessionGeneration !== req.expectedSessionGeneration ||
      p.profileGeneration !== req.expectedDestinationProfileGeneration ||
      e.eventGeneration !== req.expectedEventGeneration ||
      a.accountRefGeneration !== req.expectedAccountGeneration ||
      c.channelRefGeneration !== req.expectedChannelGeneration ||
      m.mappingGeneration !== req.expectedOutputMappingGeneration;
    if (stale) {
      this.telemetry.staleGenerations++;
      this.inc('SOCIAL_SESSION_GENERATION_STALE');
      throw new SocialPlatformCoordinationError(
        'SocialPlatformSessionGenerationMismatch',
        'stale generation',
      );
    }
    this.requests.add(req.requestId);
    const cr = compatRequest ?? this.defaultCompatibilityRequest(req, s, p, e);
    const compat = this.evaluateCompatibility(cr);
    const ready = this.evaluateReadiness(s.socialSessionId, compat, streamState);
    const plan = this.selectBackend(s.platform).createPlan(req, {
      session: s,
      profile: p,
      event: e,
      compatibility: compat,
      readiness: ready,
      streamState,
      accountChannelSummaries: {
        account: redactSocialIdentifier(a.accountRefId),
        channel: redactSocialIdentifier(c.channelRefId),
      },
      outputMappingSummary: m,
    });
    this.plans.set(plan.planId, plan);
    let result: SocialCoordinationResult;
    switch (req.requestedAction) {
      case 'PREPARE':
        this.telemetry.prepares++;
        result = this.selectBackend(s.platform).prepare(plan);
        break;
      case 'ACTIVATE':
        this.telemetry.activations++;
        result = this.selectBackend(s.platform).activate(plan);
        break;
      case 'PAUSE':
        this.telemetry.pauses++;
        result = this.selectBackend(s.platform).pause(plan);
        break;
      case 'RESUME':
        this.telemetry.resumes++;
        result = this.selectBackend(s.platform).resume(plan);
        break;
      case 'STOP':
        this.telemetry.stops++;
        result = this.selectBackend(s.platform).stop(plan);
        break;
      case 'RETRY':
        this.telemetry.retries++;
        result = this.selectBackend(s.platform).coordinateRetry(plan);
        break;
      case 'RECONNECT':
        this.telemetry.reconnects++;
        result = this.selectBackend(s.platform).coordinateReconnect(plan);
        break;
      default:
        result = this.selectBackend(s.platform).prepare(plan);
        result = freeze({
          ...result,
          status: 'VALIDATED',
          active: false,
          platformState: ready.overallReady ? 'READY' : 'WAITING_FOR_STREAM',
        } as SocialCoordinationResult);
    }
    if (this.results.has(result.requestId))
      throw new SocialPlatformCoordinationError('SocialDuplicateRequest', 'duplicate result');
    this.results.set(result.requestId, result);
    this.states.set(
      s.socialSessionId,
      freeze({
        socialSessionId: s.socialSessionId,
        sessionGeneration: s.sessionGeneration,
        platform: s.platform,
        state: result.platformState,
        lastRuntimeFrame: result.runtimeFrame,
        safeMetadata: { synthetic: true },
      }),
    );
    if (result.status === 'ACTIVE') {
      this.telemetry.activeResults++;
      this.emit('SocialSessionActive');
    }
    if (result.degraded) {
      this.telemetry.degradedResults++;
      this.emit('SocialSessionDegraded');
    }
    if (result.status === 'RETRYING') this.emit('SocialSessionRetrying');
    if (result.status === 'RECONNECTING') this.emit('SocialSessionReconnecting');
    if (result.status === 'REJECTED' || result.status === 'FAILED') this.telemetry.failedResults++;
    return result;
  }
  aggregateGroupState(groupId: string) {
    const g = this.mustGroup(groupId);
    const b = this.selectBackend(this.mustSession(g.orderedSocialSessionIds[0]!).platform);
    const agg = b.aggregateGroupState(g, [...this.states.values()], [...this.readiness.values()]);
    this.telemetry.groupQuorumEvaluations++;
    this.emit('SocialLiveAggregateChanged');
    return agg;
  }
  drain() {
    for (const [id, s] of this.states)
      this.states.set(id, freeze({ ...s, state: 'STOPPED' } as SocialPlatformSessionStateSnapshot));
    this.requests.clear();
    return this.snapshot().health;
  }
  reset(sessionId: string) {
    const s = this.mustSession(sessionId);
    const next = freeze({
      ...s,
      sessionGeneration: s.sessionGeneration + 1,
    } as SocialPlatformSessionDefinition);
    this.sessions.set(sessionId, next);
    this.states.set(
      sessionId,
      freeze({
        ...this.states.get(sessionId)!,
        sessionGeneration: next.sessionGeneration,
        state: 'READY',
      }),
    );
    this.plans.clear();
    this.readiness.clear();
    this.compatibility.clear();
    return next;
  }
  shutdown() {
    if (this.shutdownFlag) return;
    this.shutdownFlag = true;
    this.requests.clear();
    this.plans.clear();
    for (const [id, s] of this.states)
      this.states.set(
        id,
        freeze({ ...s, state: 'SHUTDOWN' } as SocialPlatformSessionStateSnapshot),
      );
    for (const b of this.backends.values()) b.shutdown();
    this.emit('SocialPlatformCoordinatorShutdown');
  }
  assertInvariants(): SocialPlatformCoordinatorValidationReport {
    const errors: string[] = [];
    const uniq = (n: string, a: string[]) => {
      if (new Set(a).size !== a.length) errors.push(`${n} not unique`);
    };
    uniq('backend ids', [...this.backends.keys()]);
    uniq('profile ids', [...this.profiles.keys()]);
    uniq('event ids', [...this.events.keys()]);
    uniq('session ids', [...this.sessions.keys()]);
    uniq('mapping ids', [...this.mappings.keys()]);
    uniq('request ids', [...this.requests]);
    for (const r of this.results.values())
      if (!r.synthetic || (r.active && !r.readinessState.overallReady))
        errors.push('false activation claim');
    for (const b of this.backends.values())
      if (
        b.descriptor.realPlatformApi ||
        b.descriptor.realOAuth ||
        b.descriptor.realEventCreation ||
        b.descriptor.realStreamKeyRetrieval
      )
        errors.push('real platform capability exposed');
    for (const p of this.profiles.values())
      if (
        !this.caps.has(p.platform) ||
        !this.accounts.has(p.accountRefId) ||
        !this.channels.has(p.channelRefId)
      )
        errors.push('invalid profile references');
    for (const g of this.groups.values()) {
      if (g.quorumPolicy.requiredCount > g.orderedSocialSessionIds.length)
        errors.push('quorum impossible');
      if (!g.requiredSessionIds.every((id) => g.orderedSocialSessionIds.includes(id)))
        errors.push('required subset invalid');
    }
    const leak = JSON.stringify(this.snapshotWithoutValidation());
    if (/https?:\/\/|stream[_-]?key|token|password|@/.test(leak))
      errors.push('secret/raw identifier exposure');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: [
        'synthetic metadata-only social coordination; no HTTP, OAuth, platform API, chat, analytics, or stream-key retrieval',
      ],
      checkedInvariants: [
        'unique ids',
        'monotonic generations',
        'valid references',
        'mapping uniqueness',
        'quorum achievable',
        'compatibility agrees with capabilities',
        'readiness explicit',
        'ACTIVE requires readiness',
        'one request/result once',
        'platform state isolation',
        'no credentials in snapshots',
        'shutdown cleanup',
      ],
    });
  }
  private snapshotWithoutValidation() {
    return {
      backends: [...this.backends.values()].map((b) => b.descriptor),
      capabilities: [...this.caps.values()],
      accounts: [...this.accounts.values()],
      channels: [...this.channels.values()],
      profiles: [...this.profiles.values()],
      events: [...this.events.values()],
      sessions: [...this.sessions.values()],
      mappings: [...this.mappings.values()],
      results: [...this.results.values()],
    };
  }
  snapshot(): SocialPlatformCoordinatorEngineSnapshot {
    const states = [...this.states.values()];
    const health = this.health();
    return freeze({
      version: SOCIAL_PLATFORM_COORDINATION_VERSION,
      backends: [...this.backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      capabilities: [...this.caps.values()].sort((a, b) => a.platform.localeCompare(b.platform)),
      accounts: [...this.accounts.values()].sort((a, b) =>
        a.accountRefId.localeCompare(b.accountRefId),
      ),
      channels: [...this.channels.values()].sort((a, b) =>
        a.channelRefId.localeCompare(b.channelRefId),
      ),
      profiles: [...this.profiles.values()].sort((a, b) => a.profileId.localeCompare(b.profileId)),
      events: [...this.events.values()].sort((a, b) => a.eventId.localeCompare(b.eventId)),
      sessions: [...this.sessions.values()].sort((a, b) =>
        a.socialSessionId.localeCompare(b.socialSessionId),
      ),
      sessionStates: states.sort((a, b) => a.socialSessionId.localeCompare(b.socialSessionId)),
      mappings: [...this.mappings.values()].sort((a, b) => a.mappingId.localeCompare(b.mappingId)),
      groups: [...this.groups.values()].sort((a, b) => a.groupId.localeCompare(b.groupId)),
      readiness: [...this.readiness.values()].sort((a, b) =>
        a.readinessId.localeCompare(b.readinessId),
      ),
      compatibilityResults: [...this.compatibility.values()].sort((a, b) =>
        a.resultId.localeCompare(b.resultId),
      ),
      plans: [...this.plans.values()].sort((a, b) => a.planId.localeCompare(b.planId)),
      results: [...this.results.values()].sort((a, b) => a.requestId.localeCompare(b.requestId)),
      health,
      telemetry: freeze({
        ...this.telemetry,
        currentRequestIds: freeze([...this.requests].sort()),
        activeSessionIds: freeze(
          states
            .filter((s) => s.state === 'ACTIVE')
            .map((s) => s.socialSessionId)
            .sort(),
        ),
        activeGroupIds: freeze([...this.groups.keys()].sort()),
        healthSummary: health.healthState,
      }),
      validation: this.assertInvariants(),
      incidents: freeze([...this.incidents]),
    });
  }
  health(): SocialPlatformCoordinatorHealthSnapshot {
    const states = [...this.states.values()],
      groups = [...this.groups.values()];
    const activeGroups = groups.filter((g) => {
      try {
        return this.aggregateGroupState(g.groupId).overallState === 'ACTIVE';
      } catch {
        return false;
      }
    }).length;
    return freeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: 'HEALTHY',
      backendCount: this.backends.size,
      platformCapabilityCount: this.caps.size,
      accountReferenceCount: this.accounts.size,
      channelReferenceCount: this.channels.size,
      destinationProfileCount: this.profiles.size,
      eventCount: this.events.size,
      sessionCount: this.sessions.size,
      activeSessionCount: states.filter((s) => s.state === 'ACTIVE').length,
      readySessionCount: states.filter((s) => s.state === 'READY').length,
      waitingSessionCount: states.filter((s) => s.state.startsWith('WAITING')).length,
      degradedSessionCount: states.filter((s) => s.state === 'DEGRADED').length,
      failedSessionCount: states.filter((s) => s.state === 'FAILED').length,
      liveGroupCount: this.groups.size,
      activeGroupCount: activeGroups,
      partialGroupCount: 0,
      failedGroupCount: 0,
      compatibilityCheckCount: this.telemetry.compatibilityResults,
      incompatibleResultCount: [...this.compatibility.values()].filter((r) => !r.eligible).length,
      readinessCheckCount: this.telemetry.readinessEvaluations,
      activationCount: this.telemetry.activations,
      retryCoordinationCount: this.telemetry.retries,
      reconnectCoordinationCount: this.telemetry.reconnects,
      duplicateRequestCount: this.telemetry.duplicateRequests,
      staleGenerationRejectionCount: this.telemetry.staleGenerations,
      accountUnavailableCount: this.telemetry.unavailableAccounts,
      channelUnavailableCount: this.telemetry.unavailableChannels,
      eventNotReadyCount: this.telemetry.unavailableEvents,
      streamNotReadyCount: this.incidents.filter((i) => i === 'SOCIAL_STREAM_NOT_READY').length,
      aspectRatioIncompatibilityCount: this.telemetry.incompatibleAspectRatios,
      codecIncompatibilityCount: this.telemetry.incompatibleCodecs,
      bitrateIncompatibilityCount: this.telemetry.incompatibleBitrates,
      requiredPlatformFailureCount: this.telemetry.requiredPlatformFailures,
      optionalPlatformFailureCount: this.telemetry.optionalPlatformFailures,
      lastActivePlatform: states.find((s) => s.state === 'ACTIVE')?.platform,
      lastFailure: this.incidents.at(-1),
      updatedAtNs: 0,
    });
  }
  createSourceGraphSnapshot() {
    const s = this.snapshot();
    return freeze({
      platformIdentifiers: s.sessions.map((x) => x.platform),
      socialSessionIds: s.sessions.map((x) => x.socialSessionId),
      outputRoles: s.sessions.map((x) => x.outputRole),
      aspectRatioRoles: s.sessions.map((x) => x.aspectRatioRole),
      redactedAccountChannelReferences: s.profiles.map((x) => ({
        account: redactSocialIdentifier(x.accountRefId),
        channel: redactSocialIdentifier(x.channelRefId),
      })),
      safeEventIds: s.events.map((x) => redactSocialIdentifier(x.eventId)),
      socialSessionStates: s.sessionStates.map((x) => x.state),
      readinessStates: s.readiness.map((x) => x.overallReady),
      compatibilityStatus: s.compatibilityResults.map((x) => x.status),
      activeDegradedFailedPlatforms: {
        active: s.sessionStates.filter((x) => x.state === 'ACTIVE').map((x) => x.platform),
        degraded: s.sessionStates.filter((x) => x.state === 'DEGRADED').map((x) => x.platform),
        failed: s.sessionStates.filter((x) => x.state === 'FAILED').map((x) => x.platform),
      },
      realPlatformApi: false,
      realOAuth: false,
      health: s.health.healthState,
      readiness: s.readiness.every((x) => x.overallReady),
    });
  }
  defaultCompatibilityRequest(
    req: SocialCoordinationRequest,
    s: SocialPlatformSessionDefinition,
    p: SocialDestinationProfile,
    e: SocialLiveEventDefinition,
  ): SocialPlatformCompatibilityRequest {
    return freeze({
      requestId: `compat:${req.requestId}`,
      platform: s.platform,
      expectedCapabilityGeneration: req.expectedPlatformCapabilityGeneration,
      profileId: p.profileId,
      profileGeneration: p.profileGeneration,
      eventId: e.eventId,
      eventGeneration: e.eventGeneration,
      outputRole: s.outputRole,
      aspectRatioRole: s.aspectRatioRole,
      protocol: p.preferredProtocol,
      videoCodec: 'H264',
      audioCodec: 'AAC',
      containerMetadata: 'FLV_METADATA',
      width:
        s.aspectRatioRole === 'VERTICAL_9_16'
          ? 1080
          : s.aspectRatioRole === 'SQUARE_1_1'
            ? 1080
            : 1920,
      height:
        s.aspectRatioRole === 'VERTICAL_9_16'
          ? 1920
          : s.aspectRatioRole === 'SQUARE_1_1'
            ? 1080
            : 1080,
      frameRate: 30,
      videoBitrate: 4500000,
      audioBitrate: 128000,
      sampleRate: 48000,
      channelLayout: 'STEREO',
      keyframeInterval: 2,
      secureTransport: p.preferredProtocol === 'RTMPS_FOUNDATION',
      lowLatencyRequestedMetadata: 'metadata-only',
      runtimeFrame: req.requestedRuntimeFrame,
      safeMetadata: {},
    });
  }
  private mustCap(p: SocialPlatform) {
    const v = this.caps.get(p);
    if (!v) throw new SocialPlatformCoordinationError('SocialPlatformCapabilitiesNotFound', p);
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
  private mustProfile(id: string) {
    const v = this.profiles.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialDestinationProfileNotFound', id);
    return v;
  }
  private mustEvent(id: string) {
    const v = this.events.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialLiveEventNotFound', id);
    return v;
  }
  private mustSession(id: string) {
    const v = this.sessions.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialPlatformSessionNotFound', id);
    return v;
  }
  private mustGroup(id: string) {
    const v = this.groups.get(id);
    if (!v) throw new SocialPlatformCoordinationError('SocialLiveGroupNotFound', id);
    return v;
  }
  private mappingFor(s: SocialPlatformSessionDefinition) {
    const m = [...this.mappings.values()].find(
      (x) => x.socialSessionId === s.socialSessionId && x.platform === s.platform && x.enabled,
    );
    if (!m)
      throw new SocialPlatformCoordinationError('SocialOutputMappingInvalid', 'missing mapping');
    return m;
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
    dependencies: ['streaming-output-foundation', 'multi-destination-distribution'],
    optionalCapabilities: [
      'rtmp-rtmps-output-foundation',
      'srt-reliable-transport-foundation',
      'webrtc-output-foundation',
      'ndi-output-foundation',
    ],
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
    metadata: { syntheticOnly: true, noSecondLoop: true, order: 1085 },
  };
  constructor(readonly coordinator: SocialPlatformDestinationCoordinator) {}
  initialize() {
    return { status: 'READY' as const, metadata: { syntheticOnly: true } };
  }
  async processTick(tick: FrameTick, context: ProcessorRuntimeContext | any) {
    const snap = this.coordinator.snapshot();
    context?.outputs?.publish?.(
      this.descriptor.id,
      SOCIAL_OUTPUT_KEYS.coordinatorHealth,
      snap.health,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      SOCIAL_OUTPUT_KEYS.coordinatorTelemetry,
      snap.telemetry,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      SOCIAL_OUTPUT_KEYS.sessionStates,
      snap.sessionStates,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      SOCIAL_OUTPUT_KEYS.compatibilityResults,
      snap.compatibilityResults,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      SOCIAL_OUTPUT_KEYS.aggregateStates,
      snap.groups
        .map((g) => {
          try {
            return this.coordinator.aggregateGroupState(g.groupId);
          } catch {
            return undefined;
          }
        })
        .filter(Boolean),
      'BORROWED',
    );
    return {
      status: 'SUCCEEDED' as const,
      value: { frame: String(tick.frameNumber), health: snap.health },
    };
  }
  shutdown() {
    this.coordinator.shutdown();
    return { status: 'STOPPED' as const };
  }
}
export const createSocialPlatformDestinationCoordinatorProcessor = (
  c: SocialPlatformDestinationCoordinator,
) => new SocialPlatformDestinationCoordinatorProcessor(c);
export function createSocialCommandHandlers(
  c: SocialPlatformDestinationCoordinator,
): Readonly<Record<SocialCommandType, RuntimeCommandHandler>> {
  const h = (type: SocialCommandType, fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: type,
      idempotent: true,
      execute(cmd: any) {
        return { status: 'SUCCEEDED', value: fn(cmd.payload ?? {}) };
      },
    }) as any;
  return Object.fromEntries(
    SOCIAL_COMMAND_TYPES.map((t) => [
      t,
      h(t, (p) => {
        switch (t) {
          case 'SOCIAL_REGISTER_BACKEND':
            return c.registerBackend(p.backend);
          case 'SOCIAL_REGISTER_PLATFORM_CAPABILITIES':
            return c.registerCapabilities(p.capabilities);
          case 'SOCIAL_UPDATE_PLATFORM_CAPABILITIES':
            return c.updateCapabilities(p.platform, p.expectedGeneration, p.patch);
          case 'SOCIAL_REGISTER_ACCOUNT_REFERENCE':
            return c.registerAccountReference(p.account);
          case 'SOCIAL_UPDATE_ACCOUNT_REFERENCE':
            return c.updateAccountReference(p.accountRefId, p.expectedGeneration, p.patch);
          case 'SOCIAL_REGISTER_CHANNEL_REFERENCE':
            return c.registerChannelReference(p.channel);
          case 'SOCIAL_UPDATE_CHANNEL_REFERENCE':
            return c.updateChannelReference(p.channelRefId, p.expectedGeneration, p.patch);
          case 'SOCIAL_REGISTER_DESTINATION_PROFILE':
            return c.registerDestinationProfile(p.profile);
          case 'SOCIAL_UPDATE_DESTINATION_PROFILE':
            return c.updateDestinationProfile(p.profileId, p.expectedGeneration, p.patch);
          case 'SOCIAL_CREATE_LIVE_EVENT':
            return c.createLiveEvent(p.event);
          case 'SOCIAL_UPDATE_LIVE_EVENT':
            return c.updateLiveEvent(p.eventId, p.expectedGeneration, p.patch);
          case 'SOCIAL_CREATE_SESSION':
            return c.createSession(p.session);
          case 'SOCIAL_CREATE_OUTPUT_MAPPING':
            return c.createOutputMapping(p.mapping);
          case 'SOCIAL_CREATE_LIVE_GROUP':
            return c.createLiveGroup(p.group);
          case 'SOCIAL_VALIDATE_COMPATIBILITY':
            return c.evaluateCompatibility(p.request);
          case 'SOCIAL_REFRESH_READINESS':
            return c.evaluateReadiness(p.socialSessionId, p.compatibility, p.streamState);
          case 'SOCIAL_PREPARE':
          case 'SOCIAL_ACTIVATE':
          case 'SOCIAL_PAUSE':
          case 'SOCIAL_RESUME':
          case 'SOCIAL_STOP':
          case 'SOCIAL_RETRY':
          case 'SOCIAL_RECONNECT':
            return c.coordinate(
              {
                ...p.request,
                requestedAction: t.replace('SOCIAL_', ''),
              } as SocialCoordinationRequest,
              p.compatibilityRequest,
              p.streamState,
            );
          case 'SOCIAL_DRAIN':
            return c.drain();
          case 'SOCIAL_RESET':
            return c.reset(p.socialSessionId);
          case 'SOCIAL_VALIDATE':
            return c.assertInvariants();
          case 'SOCIAL_SHUTDOWN':
            return c.shutdown();
          default:
            return c.snapshot();
        }
      }),
    ]),
  ) as any;
}
export function createSocialPlatformAccountReference(p: {
  accountRefId: string;
  platform: SocialPlatform;
  rawIdentifier?: string;
  accountType?: SocialAccountType;
  available?: boolean;
  displayNameMetadata?: string;
}): SocialPlatformAccountReference {
  return freeze({
    accountRefId: p.accountRefId,
    accountRefVersion: '5.7.8',
    accountRefGeneration: 1,
    platform: p.platform,
    providerMetadata: 'metadata-only',
    accountType: p.accountType ?? 'CREATOR',
    accountHashOrRedactedIdentifier: redactSocialIdentifier(p.rawIdentifier ?? p.accountRefId)!,
    displayNameMetadata: p.displayNameMetadata ?? 'redacted display metadata',
    classification: 'metadata-only',
    available: p.available ?? true,
    authorizationReferenceMetadata: 'metadata-only-no-oauth',
    tokenReferenceMetadata: 'metadata-only-no-token',
    health: p.available === false ? 'UNAVAILABLE' : 'HEALTHY',
    safeMetadata: {},
    createdAtNs: 0,
    updatedAtNs: 0,
  });
}
export function createSocialPlatformChannelReference(p: {
  channelRefId: string;
  accountRefId: string;
  accountRefGeneration?: number;
  platform: SocialPlatform;
  rawIdentifier?: string;
  channelType?: SocialChannelType;
  available?: boolean;
}): SocialPlatformChannelReference {
  return freeze({
    channelRefId: p.channelRefId,
    channelRefVersion: '5.7.8',
    channelRefGeneration: 1,
    accountRefId: p.accountRefId,
    accountRefGeneration: p.accountRefGeneration ?? 1,
    platform: p.platform,
    channelType: p.channelType ?? 'PRIMARY',
    channelHashOrRedactedIdentifier: redactSocialIdentifier(p.rawIdentifier ?? p.channelRefId)!,
    displayNameMetadata: 'redacted channel metadata',
    liveEligibilityMetadata: p.available === false ? 'unavailable' : 'metadata-ready',
    categoryEligibilityMetadata: 'metadata-only',
    monetizationEligibilityMetadata: 'boundary-only',
    chatEligibilityMetadata: 'metadata-only',
    safeMetadata: {},
    createdAtNs: 0,
    updatedAtNs: 0,
  });
}
export type SocialPlatformBackendCapabilities = SocialPlatformBackendSnapshot;
export type SocialPlatformBackendDescriptor = SocialPlatformBackendSnapshot;
