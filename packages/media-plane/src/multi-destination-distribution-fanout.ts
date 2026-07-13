/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';
import type {
  StreamingOutputEngine,
  StreamingInputEnvelope,
  StreamingInputType,
  StreamingOutputRole,
  StreamingTransmissionResult,
} from './streaming-output-foundation.js';

export const DISTRIBUTION_VERSION = '5.7.2';
export const MULTI_DESTINATION_DISTRIBUTION_PROCESSOR_ORDER = 1075;
type Safe = Readonly<Record<string, unknown>>;
const f = <T>(v: T): Readonly<T> => Object.freeze(v);
const c = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};
const red = (s: string) => `redacted:${hash(s)}`;
const bounded = <T>(a: T[], n = 10000) => (a.length > n ? a.slice(a.length - n) : a);
const LIMIT = f({
  backends: 16,
  profiles: 128,
  groups: 128,
  destinations: 100,
  sessions: 256,
  bindings: 512,
  inputs: 10000,
  plans: 10000,
  dispatches: 50000,
  results: 10000,
  events: 512,
  incidents: 512,
  queues: 64,
});
export const DISTRIBUTION_OUTPUT_KEYS = f({
  profiles: 'distribution.profiles',
  destinationGroups: 'distribution.destination.groups',
  destinationEntries: 'distribution.destination.entries',
  sessionDefinitions: 'distribution.session.definitions',
  sessionStates: 'distribution.session.states',
  sourceBindings: 'distribution.source.bindings',
  distributionInputs: 'distribution.inputs',
  activeRequests: 'distribution.requests.active',
  distributionPlans: 'distribution.plans',
  destinationDispatches: 'distribution.dispatches',
  aggregateResults: 'distribution.results.aggregate',
  sharedOwnershipLeases: 'distribution.leases',
  destinationQueues: 'distribution.queues.destination',
  destinationHealth: 'distribution.destination.health',
  quorumStates: 'distribution.quorum.states',
  membershipSnapshots: 'distribution.membership.snapshots',
  pauseResumeStates: 'distribution.pause-resume',
  drainStates: 'distribution.drain',
  flushStates: 'distribution.flush',
  activeConfigurationTransactions: 'distribution.transactions.active',
  engineHealth: 'distribution.health',
  telemetry: 'distribution.telemetry',
  backendHealth: 'distribution.backend.health',
  failedRejectedResults: 'distribution.results.failed-rejected',
} as const);
export const DISTRIBUTION_COMMAND_TYPES = [
  'DISTRIBUTION_REGISTER_BACKEND',
  'DISTRIBUTION_UNREGISTER_BACKEND',
  'DISTRIBUTION_REGISTER_PROFILE',
  'DISTRIBUTION_UPDATE_PROFILE',
  'DISTRIBUTION_UNREGISTER_PROFILE',
  'DISTRIBUTION_CREATE_DESTINATION_GROUP',
  'DISTRIBUTION_UPDATE_DESTINATION_GROUP',
  'DISTRIBUTION_DESTROY_DESTINATION_GROUP',
  'DISTRIBUTION_ADD_DESTINATION',
  'DISTRIBUTION_UPDATE_DESTINATION',
  'DISTRIBUTION_REMOVE_DESTINATION',
  'DISTRIBUTION_CREATE_SESSION',
  'DISTRIBUTION_UPDATE_SESSION',
  'DISTRIBUTION_DESTROY_SESSION',
  'DISTRIBUTION_BIND_SOURCE',
  'DISTRIBUTION_UNBIND_SOURCE',
  'DISTRIBUTION_START',
  'DISTRIBUTION_PAUSE',
  'DISTRIBUTION_RESUME',
  'DISTRIBUTION_STOP',
  'DISTRIBUTION_SUBMIT_INPUT',
  'DISTRIBUTION_CANCEL_INPUT',
  'DISTRIBUTION_RETRY_DESTINATION',
  'DISTRIBUTION_DISABLE_DESTINATION',
  'DISTRIBUTION_ENABLE_DESTINATION',
  'DISTRIBUTION_SET_QUORUM_POLICY',
  'DISTRIBUTION_SET_DISPATCH_POLICY',
  'DISTRIBUTION_SET_FAILURE_POLICY',
  'DISTRIBUTION_SET_QUEUE_POLICY',
  'DISTRIBUTION_DRAIN',
  'DISTRIBUTION_FLUSH',
  'DISTRIBUTION_RESET_SESSION',
  'DISTRIBUTION_RECONFIGURE',
  'DISTRIBUTION_CLEAR_PLAN_CACHE',
  'DISTRIBUTION_VALIDATE',
  'DISTRIBUTION_SHUTDOWN',
] as const;
export type DistributionCommandType = (typeof DISTRIBUTION_COMMAND_TYPES)[number];
export const DISTRIBUTION_EVENTS = [
  'DistributionEngineCreated',
  'DistributionBackendRegistered',
  'DistributionBackendRemoved',
  'DistributionProfileRegistered',
  'DistributionProfileUpdated',
  'DistributionProfileRemoved',
  'DestinationGroupCreated',
  'DestinationGroupUpdated',
  'DestinationGroupRemoved',
  'DistributionDestinationAdded',
  'DistributionDestinationUpdated',
  'DistributionDestinationRemoved',
  'DistributionSessionCreated',
  'DistributionSessionValidated',
  'DistributionSessionStarted',
  'DistributionSessionPaused',
  'DistributionSessionResumed',
  'DistributionSessionDraining',
  'DistributionSessionStopped',
  'DistributionSessionDegraded',
  'DistributionSessionFailed',
  'DistributionInputSubmitted',
  'DistributionPlanCreated',
  'DestinationDispatchCreated',
  'DestinationDispatchQueued',
  'DestinationDispatchSent',
  'DestinationDispatchFailed',
  'DestinationDispatchRetrying',
  'DistributionQuorumReached',
  'DistributionQuorumFailed',
  'DistributionCompleted',
  'DistributionPartial',
  'DistributionInputReleased',
  'DistributionMembershipChanged',
  'DistributionBackpressureChanged',
  'DistributionHealthChanged',
  'DistributionEngineShutdown',
] as const;
export type DistributionEventType = (typeof DISTRIBUTION_EVENTS)[number];
export const DISTRIBUTION_WATCHDOG_INCIDENTS = [
  'DISTRIBUTION_ENGINE_STALLED',
  'DISTRIBUTION_REQUEST_TIMEOUT',
  'DISTRIBUTION_DUPLICATE_REQUEST',
  'DISTRIBUTION_DUPLICATE_SUBMISSION',
  'DISTRIBUTION_DUPLICATE_DISPATCH',
  'DISTRIBUTION_SESSION_GENERATION_STALE',
  'DISTRIBUTION_PROFILE_GENERATION_STALE',
  'DISTRIBUTION_GROUP_GENERATION_STALE',
  'DISTRIBUTION_DESTINATION_GENERATION_STALE',
  'DISTRIBUTION_SOURCE_BINDING_GENERATION_STALE',
  'DISTRIBUTION_INPUT_GENERATION_STALE',
  'DISTRIBUTION_SEQUENCE_REGRESSION',
  'DISTRIBUTION_TIMESTAMP_REGRESSION',
  'DISTRIBUTION_DESTINATION_INCOMPATIBLE',
  'DISTRIBUTION_NO_ELIGIBLE_DESTINATION',
  'DISTRIBUTION_QUORUM_IMPOSSIBLE',
  'DISTRIBUTION_QUORUM_FAILED',
  'DISTRIBUTION_REQUIRED_DESTINATION_FAILED',
  'DISTRIBUTION_DESTINATION_QUEUE_OVERFLOW',
  'DISTRIBUTION_SLOW_DESTINATION',
  'DISTRIBUTION_BACKPRESSURE_CRITICAL',
  'DISTRIBUTION_MEMBERSHIP_CONFLICT',
  'DISTRIBUTION_INPUT_RETAINED_TOO_LONG',
  'DISTRIBUTION_BACKEND_FAILED',
  'DISTRIBUTION_OWNERSHIP_VIOLATION',
  'DISTRIBUTION_OUTPUT_REGISTRY_MISMATCH',
  'DISTRIBUTION_SOURCE_GRAPH_MISMATCH',
  'DISTRIBUTION_INVARIANT_FAILURE',
] as const;
export type DistributionWatchdogIncidentType = (typeof DISTRIBUTION_WATCHDOG_INCIDENTS)[number];
export type DistributionMode =
  | 'BROADCAST_ALL'
  | 'BEST_EFFORT'
  | 'ALL_OR_NOTHING'
  | 'REQUIRED_DESTINATIONS'
  | 'QUORUM'
  | 'PRIORITY_ORDERED'
  | 'PRIMARY_WITH_MIRRORS'
  | 'ACTIVE_ACTIVE'
  | 'ACTIVE_STANDBY'
  | 'CUSTOM_TYPED';
export type DistributionInputType = StreamingInputType;
export type DistributionSessionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'STARTING'
  | 'DISTRIBUTING'
  | 'DEGRADED'
  | 'PARTIAL'
  | 'PAUSING'
  | 'PAUSED'
  | 'RESUMING'
  | 'DRAINING'
  | 'FLUSHING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'DESTROYED'
  | 'SHUTDOWN';
export type DistributionQuorumPolicyType =
  | 'ALL'
  | 'ALL_REQUIRED'
  | 'AT_LEAST_ONE'
  | 'MAJORITY'
  | 'MINIMUM_COUNT'
  | 'MINIMUM_WEIGHT'
  | 'PRIMARY_ONLY'
  | 'CUSTOM_TYPED';
export type DistributionCompatibilityPolicyType =
  | 'STRICT_MATCH'
  | 'REQUIRE_PROTOCOL_COMPATIBILITY'
  | 'REQUIRE_CODEC_COMPATIBILITY'
  | 'REQUIRE_CONTAINER_COMPATIBILITY'
  | 'REQUIRE_OUTPUT_ROLE_COMPATIBILITY'
  | 'ALLOW_METADATA_ONLY_DEGRADATION'
  | 'CUSTOM';
export type DistributionDispatchPolicyType =
  | 'PARALLEL_DETERMINISTIC'
  | 'SERIAL_PRIORITY'
  | 'REQUIRED_FIRST'
  | 'PRIMARY_FIRST'
  | 'ROUND_ROBIN_METADATA'
  | 'WEIGHTED_METADATA'
  | 'CUSTOM';
export type DistributionFailurePolicy =
  | 'FAIL_ON_ANY_REQUIRED'
  | 'FAIL_ON_ANY'
  | 'QUORUM_BASED'
  | 'DEGRADE_ON_OPTIONAL_FAILURE'
  | 'CONTINUE_WITH_AVAILABLE'
  | 'STOP_ALL_ON_PRIMARY_FAILURE'
  | 'CUSTOM';
export type DistributionRetryAggregationPolicy =
  | 'DESTINATION_INDEPENDENT'
  | 'SYNCHRONIZE_REQUIRED_RETRIES'
  | 'PAUSE_NEW_INPUT_WHILE_REQUIRED_RETRY'
  | 'DROP_OPTIONAL_RETRY_BACKLOG'
  | 'CUSTOM';
export type DistributionCompletionPolicy =
  | 'WAIT_FOR_REQUIRED'
  | 'WAIT_FOR_ALL'
  | 'RETURN_ON_QUORUM'
  | 'RETURN_ON_PRIMARY'
  | 'FIRE_AND_TRACK_BOUNDED_METADATA'
  | 'CUSTOM';
export type DistributionOwnershipPolicy =
  | 'FANOUT_OWNED'
  | 'BORROWED_BY_DESTINATIONS'
  | 'RETAINED_UNTIL_REQUIRED_COMPLETE'
  | 'RETAINED_UNTIL_ALL_COMPLETE'
  | 'RELEASED';
export type DistributionResultStatus =
  | 'COMPLETED'
  | 'PARTIAL'
  | 'DEGRADED'
  | 'QUORUM_REACHED'
  | 'QUORUM_FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED';
export type DistributionDispatchState =
  | 'PENDING'
  | 'ELIGIBLE'
  | 'QUEUED'
  | 'DISPATCHING'
  | 'SENT'
  | 'RETRYING'
  | 'RECONNECTING'
  | 'FAILED_OVER'
  | 'SKIPPED'
  | 'DROPPED'
  | 'FAILED'
  | 'CANCELLED';
export class DistributionError extends Error {
  constructor(
    readonly code: DistributionErrorCode,
    msg: string,
  ) {
    super(`${code}: ${msg}`);
  }
}
export type DistributionErrorCode =
  | 'DistributionEngineNotReady'
  | 'DistributionBackendNotFound'
  | 'DuplicateDistributionBackend'
  | 'DistributionProfileNotFound'
  | 'DuplicateDistributionProfile'
  | 'DistributionProfileInvalid'
  | 'DestinationGroupNotFound'
  | 'DuplicateDestinationGroup'
  | 'DestinationGroupInvalid'
  | 'DistributionDestinationEntryInvalid'
  | 'DuplicateDistributionDestinationEntry'
  | 'DistributionSessionNotFound'
  | 'DuplicateDistributionSession'
  | 'DistributionSessionInvalid'
  | 'DistributionSessionGenerationMismatch'
  | 'DistributionSessionStateInvalid'
  | 'DistributionSourceBindingInvalid'
  | 'DistributionInputInvalid'
  | 'DistributionDuplicateRequest'
  | 'DistributionDuplicateSubmission'
  | 'DistributionDuplicateDispatch'
  | 'DistributionSequenceRegression'
  | 'DistributionTimestampRegression'
  | 'DistributionDestinationIncompatible'
  | 'DistributionNoEligibleDestination'
  | 'DistributionQuorumImpossible'
  | 'DistributionQuorumFailed'
  | 'DistributionQueueFull'
  | 'DistributionBackpressureCritical'
  | 'DistributionMembershipConflict'
  | 'DistributionBackendFailed'
  | 'DistributionOwnershipViolation'
  | 'DistributionCancelled'
  | 'DistributionTimeout'
  | 'DistributionInvariantViolation'
  | 'DistributionShutdownError';
export interface DistributionQuorumPolicy {
  readonly policyType: DistributionQuorumPolicyType;
  readonly minimumSuccessCount: number;
  readonly minimumSuccessWeight: number;
  readonly requiredDestinationBehavior: string;
  readonly timeoutBehavior: string;
  readonly failureBehavior: string;
  readonly safeMetadata: Safe;
}
export type DistributionQuorumPolicySnapshot = DistributionQuorumPolicy;
export interface DistributionQueuePolicy {
  readonly maxItems: number;
  readonly maxBytes: number;
  readonly maxDurationTicks: number;
  readonly maxLatencyTicks: number;
  readonly overflowPolicy:
    | 'DROP_OLDEST_NON_KEY_VIDEO'
    | 'DROP_NEWEST'
    | 'REJECT_NEW'
    | 'PRESERVE_CODEC_CONFIG'
    | 'PRESERVE_KEYFRAME'
    | 'PRESERVE_AUDIO'
    | 'PRESERVE_REQUIRED_DESTINATION'
    | 'DROP_OPTIONAL_DESTINATION_INPUT'
    | 'FAIL_DESTINATION'
    | 'FAIL_DISTRIBUTION'
    | 'CUSTOM';
  readonly slowDestinationPolicy:
    | 'ISOLATE'
    | 'DROP_FOR_SLOW_DESTINATION'
    | 'DISABLE_OPTIONAL_DESTINATION'
    | 'RETRY_BOUNDED'
    | 'FAIL_REQUIRED_DESTINATION'
    | 'FAIL_DISTRIBUTION'
    | 'CUSTOM';
  readonly safeMetadata: Safe;
}
export interface DistributionProfile {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly distributionMode: DistributionMode;
  readonly sourceOutputRole: StreamingOutputRole;
  readonly inputType: DistributionInputType;
  readonly destinationGroupId: string;
  readonly destinationGroupGeneration: number;
  readonly compatibilityPolicy: readonly DistributionCompatibilityPolicyType[];
  readonly quorumPolicy: DistributionQuorumPolicy;
  readonly dispatchPolicy: DistributionDispatchPolicyType;
  readonly retryAggregationPolicy: DistributionRetryAggregationPolicy;
  readonly failurePolicy: DistributionFailurePolicy;
  readonly timeoutPolicy: readonly string[];
  readonly queuePolicy: DistributionQueuePolicy;
  readonly ownershipPolicy: DistributionOwnershipPolicy;
  readonly completionPolicy: DistributionCompletionPolicy;
  readonly degradedStatePolicy: string;
  readonly backendPreferenceMetadata?: string;
  readonly criticality: 'CRITICAL' | 'OPTIONAL';
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type DistributionProfileSnapshot = DistributionProfile;
export interface DistributionDestinationEntry {
  readonly entryId: string;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly streamingSessionId: string;
  readonly streamingSessionGeneration: number;
  readonly priority: number;
  readonly required: boolean;
  readonly enabled: boolean;
  readonly mirror: boolean;
  readonly standby: boolean;
  readonly weight: number;
  readonly primary?: boolean;
  readonly protocolCompatibilityRequirements: readonly string[];
  readonly inputCompatibilityRequirements: readonly DistributionInputType[];
  readonly maximumQueueDepthOverride?: number;
  readonly retryOverride?: Safe;
  readonly timeoutOverride?: Safe;
  readonly failureIsolationPolicy: string;
  readonly safeMetadata: Safe;
}
export type DistributionDestinationEntrySnapshot = DistributionDestinationEntry;
export interface DistributionDestinationGroup {
  readonly destinationGroupId: string;
  readonly groupVersion: string;
  readonly groupGeneration: number;
  readonly displayName: string;
  readonly entries: readonly DistributionDestinationEntry[];
  readonly distributionMode: DistributionMode;
  readonly quorumPolicy: DistributionQuorumPolicy;
  readonly healthThreshold: number;
  readonly failoverPolicy: string;
  readonly membershipUpdatePolicy:
    | 'REJECT_WHILE_ACTIVE'
    | 'APPLY_AT_NEXT_INPUT'
    | 'APPLY_AT_NEXT_KEYFRAME'
    | 'APPLY_AT_NEXT_PACKAGE_BOUNDARY'
    | 'DRAIN_THEN_APPLY'
    | 'CUSTOM';
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type DistributionDestinationGroupSnapshot = DistributionDestinationGroup;
export interface DistributionSessionDefinition {
  readonly distributionSessionId: string;
  readonly sessionVersion: string;
  readonly sessionGeneration: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationGroupId: string;
  readonly destinationGroupGeneration: number;
  readonly sourceOutputRole: StreamingOutputRole;
  readonly sourceEncoderSessionIds: readonly string[];
  readonly sourcePackageSessionIds: readonly string[];
  readonly inputType: DistributionInputType;
  readonly startupPolicy: readonly string[];
  readonly pausePolicy: string;
  readonly stopPolicy: string;
  readonly drainPolicy: string;
  readonly failurePolicy: DistributionFailurePolicy;
  readonly enabled: boolean;
  readonly criticality: 'CRITICAL' | 'OPTIONAL';
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type DistributionSessionDefinitionSnapshot = DistributionSessionDefinition;
export interface DistributionSessionStateSnapshot {
  readonly distributionSessionId: string;
  readonly sessionGeneration: number;
  readonly state: DistributionSessionState;
  readonly lastSequence: number;
  readonly lastPts: number;
  readonly queueGeneration: number;
  readonly safeMetadata: Safe;
}
export interface DistributionSourceBinding {
  readonly bindingId: string;
  readonly bindingVersion: string;
  readonly bindingGeneration: number;
  readonly distributionSessionId: string;
  readonly sourceOutputRole: StreamingOutputRole;
  readonly inputType: DistributionInputType;
  readonly encoderSessionId?: string;
  readonly encoderSessionGeneration?: number;
  readonly packageSessionId?: string;
  readonly packageSessionGeneration?: number;
  readonly avCorrelationRequirement: 'REQUIRED' | 'OPTIONAL' | 'METADATA_ONLY';
  readonly codecConfigurationRequirement: 'REQUIRED' | 'OPTIONAL';
  readonly keyframeRequirement: 'REQUIRED_ON_START' | 'OPTIONAL';
  readonly discontinuityPolicy: string;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
}
export type DistributionSourceBindingSnapshot = DistributionSourceBinding;
export interface DistributionInputEnvelope {
  readonly inputId: string;
  readonly inputGeneration: number;
  readonly submissionId: string;
  readonly distributionSessionId: string;
  readonly sessionGeneration: number;
  readonly sourceBindingId: string;
  readonly sourceBindingGeneration: number;
  readonly inputType: DistributionInputType;
  readonly sourceMediaId: string;
  readonly sourceMediaGeneration: number;
  readonly outputRole: StreamingOutputRole;
  readonly mediaType: 'VIDEO' | 'AUDIO' | 'MUXED' | 'METADATA';
  readonly codecContainerMetadata: string;
  readonly sequence: number;
  readonly pts: number;
  readonly dts: number;
  readonly duration: number;
  readonly timeBase: string;
  readonly keyframe: boolean;
  readonly codecConfigReady: boolean;
  readonly discontinuityGeneration: number;
  readonly estimatedBytes: number;
  readonly ownership: DistributionOwnershipPolicy;
  readonly safeMetadata: Safe;
}
export type DistributionInputEnvelopeSnapshot = DistributionInputEnvelope;
export interface DistributionRequest {
  readonly requestId: string;
  readonly distributionSessionId: string;
  readonly expectedSessionGeneration: number;
  readonly expectedProfileGeneration: number;
  readonly expectedDestinationGroupGeneration: number;
  readonly expectedSourceBindingGeneration: number;
  readonly input: DistributionInputEnvelope;
  readonly expectedInputGeneration: number;
  readonly expectedStreamingSessionGenerations: Readonly<Record<string, number>>;
  readonly expectedDestinationGenerations: Readonly<Record<string, number>>;
  readonly expectedTimelineGeneration: number;
  readonly requestedRuntimeFrame: number;
  readonly deadlineNs: number;
  readonly cancellationRef?: string | undefined;
  readonly correlationId: string;
  readonly safeMetadata: Safe;
}
export type DistributionRequestSnapshot = DistributionRequest;
export interface DistributionPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly distributionSessionId: string;
  readonly sessionGeneration: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationGroupId: string;
  readonly destinationGroupGeneration: number;
  readonly inputSummary: Safe;
  readonly orderedEligibleDestinations: readonly string[];
  readonly rejectedDestinations: readonly string[];
  readonly requiredDestinations: readonly string[];
  readonly optionalDestinations: readonly string[];
  readonly dispatchOrder: readonly string[];
  readonly quorumRequirement: DistributionQuorumPolicy;
  readonly borrowingOwnershipPlan: string;
  readonly perDestinationQueueActions: Readonly<Record<string, string>>;
  readonly perDestinationRetryPolicies: Readonly<Record<string, Safe>>;
  readonly perDestinationTimeoutPolicies: Readonly<Record<string, Safe>>;
  readonly aggregateTimeoutPolicy: readonly string[];
  readonly expectedCompletionCount: number;
  readonly operationOrder: readonly string[];
  readonly retainedByteEstimate: number;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Safe;
}
export type DistributionPlanSnapshot = DistributionPlan;
export interface DistributionDestinationDispatch {
  readonly dispatchId: string;
  readonly planId: string;
  readonly destinationEntryId: string;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly streamingSessionId: string;
  readonly streamingSessionGeneration: number;
  readonly dispatchSequence: number;
  readonly required: boolean;
  readonly priority: number;
  readonly state: DistributionDispatchState;
  readonly sendRequestId: string;
  readonly retryCount: number;
  readonly reconnectCount: number;
  readonly failoverCount: number;
  readonly startedRuntimeFrame: number;
  readonly completedRuntimeFrame: number;
  readonly resultSummary: Safe;
  readonly safeMetadata: Safe;
}
export type DistributionDestinationDispatchSnapshot = DistributionDestinationDispatch;
export interface DistributionResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: DistributionResultStatus;
  readonly runtimeFrame: number;
  readonly distributionSessionId: string;
  readonly sessionGeneration: number;
  readonly inputId: string;
  readonly inputGeneration: number;
  readonly inputSequence: number;
  readonly outputRole: StreamingOutputRole;
  readonly totalDestinationCount: number;
  readonly eligibleDestinationCount: number;
  readonly requiredDestinationCount: number;
  readonly successfulDestinationIds: readonly string[];
  readonly failedDestinationIds: readonly string[];
  readonly skippedDestinationIds: readonly string[];
  readonly retryingDestinationIds: readonly string[];
  readonly destinationResultSummaries: readonly Safe[];
  readonly quorumPolicy: DistributionQuorumPolicy;
  readonly quorumReached: boolean;
  readonly requiredDestinationsSatisfied: boolean;
  readonly partialSuccess: boolean;
  readonly degraded: boolean;
  readonly ownershipReleaseState: DistributionOwnershipPolicy;
  readonly warnings: readonly string[];
  readonly completedAtNs: number;
}
export type DistributionResultSnapshot = DistributionResult;
export interface DistributionInputLease {
  readonly leaseId: string;
  readonly inputId: string;
  readonly inputGeneration: number;
  readonly distributionSessionId: string;
  readonly sessionGeneration: number;
  readonly owner: DistributionOwnershipPolicy;
  readonly destinationBorrowerIds: readonly string[];
  readonly requiredBorrowerIds: readonly string[];
  readonly acquiredSequence: number;
  readonly released: boolean;
  readonly releaseReason?: string;
  readonly safeMetadata: Safe;
}
export type DistributionInputLeaseSnapshot = DistributionInputLease;
export interface DistributionDestinationQueueSnapshot {
  readonly entryId: string;
  readonly queueGeneration: number;
  readonly depth: number;
  readonly bytes: number;
  readonly highWater: number;
  readonly maxItems: number;
  readonly overflowPolicy: string;
  readonly itemIds: readonly string[];
  readonly safeMetadata: Safe;
}
export interface DistributionDestinationHealth {
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly streamingSessionId: string;
  readonly streamingSessionGeneration: number;
  readonly enabled: boolean;
  readonly required: boolean;
  readonly connectionState: string;
  readonly queueDepth: number;
  readonly queueBytes: number;
  readonly backpressureState: string;
  readonly bandwidthState: string;
  readonly retryCount: number;
  readonly reconnectCount: number;
  readonly failoverCount: number;
  readonly successCount: number;
  readonly failureCount: number;
  readonly dropCount: number;
  readonly lastSuccessfulSequence: number;
  readonly lastSuccessfulPts: number;
  readonly lastFailure?: string | undefined;
  readonly healthState: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  readonly safeMetadata: Safe;
}
export type DistributionDestinationHealthSnapshot = DistributionDestinationHealth;
export type DistributionMembershipSnapshot = {
  readonly destinationGroupId: string;
  readonly groupGeneration: number;
  readonly entryIds: readonly string[];
  readonly createdForPlanId: string;
  readonly safeMetadata: Safe;
};
export type DistributionPauseResumeSnapshot = Safe;
export type DistributionDrainSnapshot = Safe;
export type DistributionFlushSnapshot = Safe;
export interface DistributionConfigurationTransaction {
  readonly transactionId: string;
  readonly transactionGeneration: number;
  readonly distributionSessionId: string;
  readonly currentGenerations: Safe;
  readonly requestedGenerations: Safe;
  readonly profileUpdates?: Safe;
  readonly destinationMembershipUpdates?: readonly DistributionDestinationEntry[];
  readonly quorumUpdates?: DistributionQuorumPolicy;
  readonly dispatchPolicyUpdates?: DistributionDispatchPolicyType;
  readonly failurePolicyUpdates?: DistributionFailurePolicy;
  readonly queuePolicyUpdates?: DistributionQueuePolicy;
  readonly validationReport?: DistributionValidationReport;
  readonly applicationBoundary: string;
  readonly state: 'CREATED' | 'VALIDATED' | 'COMMITTED' | 'CANCELLED' | 'FAILED' | 'COMPLETED';
  readonly failureReason?: string;
  readonly createdAtNs: number;
  readonly committedAtNs?: number;
  readonly completedAtNs?: number;
  readonly safeMetadata: Safe;
}
export type DistributionConfigurationTransactionSnapshot = DistributionConfigurationTransaction;
export interface DistributionFanOutBackend {
  readonly descriptor: DistributionBackendSnapshot;
  initializeSession(s: DistributionSessionDefinition): Safe;
  createPlan(e: MultiDestinationDistributionEngine, r: DistributionRequest): DistributionPlan;
  prepareDispatches(
    e: MultiDestinationDistributionEngine,
    p: DistributionPlan,
  ): readonly DistributionDestinationDispatch[];
  aggregateResults(
    e: MultiDestinationDistributionEngine,
    p: DistributionPlan,
    d: readonly DistributionDestinationDispatch[],
    results: readonly StreamingTransmissionResult[],
  ): DistributionResult;
  pause(id: string): Safe;
  resume(id: string): Safe;
  drain(id: string): Safe;
  flush(id: string, policy: string): Safe;
  reset(id: string): Safe;
  reconfigure(t: DistributionConfigurationTransaction): Safe;
  shutdownSession(id: string): Safe;
  shutdown(): Safe;
}
export interface DistributionBackendSnapshot {
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly displayName: string;
  readonly capabilities: {
    readonly supportedInputTypes: readonly DistributionInputType[];
    readonly supportedDistributionModes: readonly DistributionMode[];
    readonly maximumDestinations: number;
    readonly maximumSessions: number;
    readonly quorumSupport: boolean;
    readonly sharedOwnershipSupport: boolean;
    readonly destinationIsolationSupport: boolean;
    readonly membershipUpdateSupport: boolean;
    readonly deterministicBehavior: boolean;
    readonly queueMemoryLimits: Safe;
    readonly realDistribution: false;
    readonly realNetworkFanOut: false;
    readonly safeMetadata: Safe;
  };
  readonly safeMetadata: Safe;
}
export interface DistributionHealthSnapshot {
  readonly engineState: string;
  readonly healthState: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'SHUTDOWN';
  readonly backendCount: number;
  readonly profileCount: number;
  readonly destinationGroupCount: number;
  readonly destinationEntryCount: number;
  readonly sessionCount: number;
  readonly activeSessionCount: number;
  readonly distributingSessionCount: number;
  readonly degradedSessionCount: number;
  readonly failedSessionCount: number;
  readonly programDistributionSessionId?: string | undefined;
  readonly submittedInputCount: number;
  readonly plannedInputCount: number;
  readonly completedInputCount: number;
  readonly partialInputCount: number;
  readonly failedInputCount: number;
  readonly cancelledInputCount: number;
  readonly destinationDispatchCount: number;
  readonly destinationSuccessCount: number;
  readonly destinationFailureCount: number;
  readonly destinationSkipCount: number;
  readonly destinationRetryCount: number;
  readonly quorumReachedCount: number;
  readonly quorumFailedCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateSubmissionCount: number;
  readonly duplicateDispatchCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly sequenceRegressionCount: number;
  readonly timestampRegressionCount: number;
  readonly incompatibleDestinationCount: number;
  readonly noEligibleDestinationCount: number;
  readonly queueOverflowCount: number;
  readonly timeoutCount: number;
  readonly ownershipViolationCount: number;
  readonly retainedInputCount: number;
  readonly retainedInputBytes: number;
  readonly destinationQueueBytes: number;
  readonly peakRetainedBytes: number;
  readonly activeRequiredDestinationCount: number;
  readonly activeOptionalDestinationCount: number;
  readonly lastCompletedSequence: number;
  readonly lastFailure?: string | undefined;
  readonly updatedAtNs: number;
}
export type DistributionTelemetrySnapshot = Readonly<Record<string, unknown>>;
export interface DistributionValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedInvariants: readonly string[];
}
export interface DistributionEngineSnapshot {
  readonly version: string;
  readonly backends: readonly DistributionBackendSnapshot[];
  readonly profiles: readonly DistributionProfileSnapshot[];
  readonly groups: readonly DistributionDestinationGroupSnapshot[];
  readonly sessions: readonly DistributionSessionDefinitionSnapshot[];
  readonly sessionStates: readonly DistributionSessionStateSnapshot[];
  readonly sourceBindings: readonly DistributionSourceBindingSnapshot[];
  readonly plans: readonly DistributionPlanSnapshot[];
  readonly dispatches: readonly DistributionDestinationDispatchSnapshot[];
  readonly results: readonly DistributionResultSnapshot[];
  readonly leases: readonly DistributionInputLeaseSnapshot[];
  readonly queues: readonly DistributionDestinationQueueSnapshot[];
  readonly destinationHealth: readonly DistributionDestinationHealthSnapshot[];
  readonly health: DistributionHealthSnapshot;
  readonly telemetry: DistributionTelemetrySnapshot;
  readonly events: readonly DistributionEventType[];
  readonly watchdogIncidents: readonly DistributionWatchdogIncidentType[];
  readonly validation: DistributionValidationReport;
}
export function createDefaultDistributionQuorumPolicy(
  policyType: DistributionQuorumPolicyType = 'ALL_REQUIRED',
): DistributionQuorumPolicy {
  return f({
    policyType,
    minimumSuccessCount: policyType === 'AT_LEAST_ONE' ? 1 : 0,
    minimumSuccessWeight: 0,
    requiredDestinationBehavior: 'MUST_SUCCEED',
    timeoutBehavior: 'FAIL_EXPLICIT',
    failureBehavior: 'TRACEABLE',
    safeMetadata: {},
  });
}
export function createDefaultDistributionQueuePolicy(): DistributionQueuePolicy {
  return f({
    maxItems: LIMIT.queues,
    maxBytes: 64 * 1024 * 1024,
    maxDurationTicks: 300,
    maxLatencyTicks: 300,
    overflowPolicy: 'REJECT_NEW',
    slowDestinationPolicy: 'ISOLATE',
    safeMetadata: {},
  });
}
const opOrder = [
  'validate distribution session',
  'validate profile and group',
  'validate source binding and input',
  'validate input sequence/timestamp',
  'snapshot destination membership',
  'validate destination/session generations',
  'evaluate compatibility',
  'classify required and optional destinations',
  'validate quorum',
  'resolve deterministic dispatch order',
  'create destination-specific send requests',
  'reserve shared input ownership',
  'dispatch through Streaming Output Foundation',
  'collect destination results',
  'evaluate quorum and failure policy',
  'publish aggregate result',
  'release shared input when all required ownership claims resolve',
  'update session and health state',
] as const;
export class SyntheticDistributionFanOutBackend implements DistributionFanOutBackend {
  readonly descriptor: DistributionBackendSnapshot;
  constructor(id = 'synthetic-distribution-fanout') {
    this.descriptor = f({
      backendId: id,
      backendGeneration: 1,
      displayName: 'Synthetic Distribution Fan-Out Backend',
      capabilities: {
        supportedInputTypes: [
          'ENCODED_PACKET',
          'PACKAGED_OUTPUT',
          'SEGMENT_OUTPUT_FOUNDATION',
          'METADATA_ONLY',
          'CUSTOM',
        ],
        supportedDistributionModes: [
          'BROADCAST_ALL',
          'BEST_EFFORT',
          'ALL_OR_NOTHING',
          'REQUIRED_DESTINATIONS',
          'QUORUM',
          'PRIORITY_ORDERED',
          'PRIMARY_WITH_MIRRORS',
          'ACTIVE_ACTIVE',
          'ACTIVE_STANDBY',
          'CUSTOM_TYPED',
        ],
        maximumDestinations: LIMIT.destinations,
        maximumSessions: LIMIT.sessions,
        quorumSupport: true,
        sharedOwnershipSupport: true,
        destinationIsolationSupport: true,
        membershipUpdateSupport: true,
        deterministicBehavior: true,
        queueMemoryLimits: { maxItems: LIMIT.queues },
        realDistribution: false,
        realNetworkFanOut: false,
        safeMetadata: {},
      },
      safeMetadata: { syntheticOnly: true },
    });
  }
  initializeSession(s: DistributionSessionDefinition) {
    return f({
      distributionSessionId: s.distributionSessionId,
      initialized: true,
      realNetworkFanOut: false,
    });
  }
  createPlan(e: MultiDestinationDistributionEngine, r: DistributionRequest) {
    return e.buildPlan(r);
  }
  prepareDispatches(e: MultiDestinationDistributionEngine, p: DistributionPlan) {
    return e.buildDispatches(p);
  }
  aggregateResults(
    e: MultiDestinationDistributionEngine,
    p: DistributionPlan,
    d: readonly DistributionDestinationDispatch[],
    results: readonly StreamingTransmissionResult[],
  ) {
    return e.aggregate(p, d, results);
  }
  pause(id: string) {
    return f({ id, paused: true });
  }
  resume(id: string) {
    return f({ id, resumed: true });
  }
  drain(id: string) {
    return f({ id, drained: true });
  }
  flush(id: string, policy: string) {
    return f({ id, flushed: true, policy });
  }
  reset(id: string) {
    return f({ id, reset: true });
  }
  reconfigure(t: DistributionConfigurationTransaction) {
    return f({ transactionId: t.transactionId, reconfigured: true });
  }
  shutdownSession(id: string) {
    return f({ id, shutdown: true });
  }
  shutdown() {
    return f({ shutdown: true });
  }
}
export const createSyntheticDistributionFanOutBackend = (id?: string) =>
  new SyntheticDistributionFanOutBackend(id);

export class MultiDestinationDistributionEngine {
  private backends = new Map<string, DistributionFanOutBackend>();
  private profiles = new Map<string, DistributionProfile>();
  private groups = new Map<string, DistributionDestinationGroup>();
  private sessions = new Map<string, DistributionSessionDefinition>();
  private states = new Map<string, DistributionSessionStateSnapshot>();
  private bindings = new Map<string, DistributionSourceBinding>();
  private inputs = new Map<string, DistributionInputEnvelope>();
  private submissions = new Set<string>();
  private requests = new Set<string>();
  private dispatchIds = new Set<string>();
  private resultInputs = new Set<string>();
  private plans = new Map<string, DistributionPlan>();
  private dispatches = new Map<string, DistributionDestinationDispatch>();
  private results = new Map<string, DistributionResult>();
  private leases = new Map<string, DistributionInputLease>();
  private queues = new Map<string, DistributionDestinationQueueSnapshot>();
  private healthDest = new Map<string, DistributionDestinationHealth>();
  private events: DistributionEventType[] = ['DistributionEngineCreated'];
  private incidents: DistributionWatchdogIncidentType[] = [];
  private transactions = new Map<string, DistributionConfigurationTransaction>();
  private shutdown = false;
  private telemetry: any = {
    backendRegistrations: 0,
    backendRemovals: 0,
    profileRegistrations: 0,
    profileUpdates: 0,
    profileRemovals: 0,
    groupCreates: 0,
    groupUpdates: 0,
    groupRemovals: 0,
    destinationAdditions: 0,
    destinationUpdates: 0,
    destinationRemovals: 0,
    sessionCreates: 0,
    sessionStarts: 0,
    sessionPauses: 0,
    sessionResumes: 0,
    sessionStops: 0,
    sessionFailures: 0,
    sourceBindings: 0,
    sourceUnbindings: 0,
    inputSubmissions: 0,
    plansCreated: 0,
    planCacheHits: 0,
    planCacheMisses: 0,
    destinationDispatches: 0,
    destinationSends: 0,
    destinationFailures: 0,
    destinationSkips: 0,
    destinationRetries: 0,
    aggregateCompletions: 0,
    aggregatePartials: 0,
    aggregateDegradations: 0,
    aggregateFailures: 0,
    quorumEvaluations: 0,
    quorumReached: 0,
    quorumFailed: 0,
    requiredDestinationFailures: 0,
    optionalDestinationFailures: 0,
    membershipChanges: 0,
    queueHighWaterMarks: 0,
    backpressureTransitions: 0,
    duplicateRequests: 0,
    duplicateSubmissions: 0,
    duplicateDispatches: 0,
    staleGenerations: 0,
    sequenceRegressions: 0,
    timestampRegressions: 0,
    compatibilityRejections: 0,
    timeouts: 0,
    backendFailures: 0,
    ownershipViolations: 0,
    retainedBytes: 0,
    estimatedDistributedBytes: 0,
    maximumDestinationsPerInput: 0,
    currentRequestIds: [],
    activeSessionIds: [],
    lastEvent: 'DistributionEngineCreated',
    healthSummary: 'HEALTHY',
  };
  constructor(
    readonly engineId = 'multi-destination-distribution',
    readonly streamingEngine?: StreamingOutputEngine,
  ) {}
  private emit(e: DistributionEventType) {
    this.events = bounded([...this.events, e], LIMIT.events);
    this.telemetry.lastEvent = e;
  }
  private incident(i: DistributionWatchdogIncidentType) {
    this.incidents = bounded([...this.incidents, i], LIMIT.incidents);
  }
  private ensure() {
    if (this.shutdown)
      throw new DistributionError('DistributionShutdownError', 'distribution engine shutdown');
  }
  registerBackend(b: DistributionFanOutBackend) {
    this.ensure();
    if (this.backends.has(b.descriptor.backendId)) {
      this.incident('DISTRIBUTION_BACKEND_FAILED');
      throw new DistributionError('DuplicateDistributionBackend', 'duplicate backend');
    }
    if (b.descriptor.capabilities.realDistribution || b.descriptor.capabilities.realNetworkFanOut)
      throw new DistributionError('DistributionBackendFailed', 'real fan-out backend rejected');
    this.backends.set(b.descriptor.backendId, b);
    this.telemetry.backendRegistrations++;
    this.emit('DistributionBackendRegistered');
  }
  selectBackend(p: DistributionProfile) {
    const a = [...this.backends.values()]
      .filter(
        (b) =>
          b.descriptor.capabilities.supportedInputTypes.includes(p.inputType) &&
          b.descriptor.capabilities.supportedDistributionModes.includes(p.distributionMode),
      )
      .sort((x, y) => x.descriptor.backendId.localeCompare(y.descriptor.backendId));
    if (!a[0])
      throw new DistributionError('DistributionBackendNotFound', 'no capable distribution backend');
    return a[0];
  }
  registerProfile(p: DistributionProfile) {
    this.ensure();
    if (this.profiles.has(p.profileId))
      throw new DistributionError('DuplicateDistributionProfile', 'duplicate profile');
    if (!p.compatibilityPolicy.length)
      throw new DistributionError(
        'DistributionProfileInvalid',
        'explicit compatibility policy required',
      );
    this.profiles.set(p.profileId, f(c(p)));
    this.telemetry.profileRegistrations++;
    this.emit('DistributionProfileRegistered');
  }
  updateProfile(id: string, expected: number, patch: Partial<DistributionProfile>) {
    const p = this.mustProfile(id);
    if (p.profileGeneration !== expected) {
      this.telemetry.staleGenerations++;
      this.incident('DISTRIBUTION_PROFILE_GENERATION_STALE');
      throw new DistributionError('DistributionProfileInvalid', 'stale profile generation');
    }
    const n = f({
      ...p,
      ...patch,
      profileGeneration: p.profileGeneration + 1,
      updatedAtNs: patch.updatedAtNs ?? p.updatedAtNs,
    } as DistributionProfile);
    this.profiles.set(id, n);
    this.telemetry.profileUpdates++;
    this.emit('DistributionProfileUpdated');
    return n;
  }
  createDestinationGroup(g: DistributionDestinationGroup) {
    this.ensure();
    if (this.groups.has(g.destinationGroupId))
      throw new DistributionError('DuplicateDestinationGroup', 'duplicate group');
    this.validateGroup(g);
    this.groups.set(g.destinationGroupId, f(c(g)));
    for (const e of g.entries) this.initEntry(e);
    this.telemetry.groupCreates++;
    this.emit('DestinationGroupCreated');
  }
  updateDestinationGroup(
    id: string,
    expected: number,
    patch: Partial<DistributionDestinationGroup>,
  ) {
    const g = this.mustGroup(id);
    if (g.groupGeneration !== expected) {
      this.telemetry.staleGenerations++;
      this.incident('DISTRIBUTION_GROUP_GENERATION_STALE');
      throw new DistributionError('DestinationGroupInvalid', 'stale group generation');
    }
    const n = f({
      ...g,
      ...patch,
      groupGeneration: g.groupGeneration + 1,
      updatedAtNs: patch.updatedAtNs ?? g.updatedAtNs,
    } as DistributionDestinationGroup);
    this.validateGroup(n);
    this.groups.set(id, n);
    for (const e of n.entries) this.initEntry(e);
    this.telemetry.groupUpdates++;
    this.telemetry.membershipChanges++;
    this.emit('DestinationGroupUpdated');
    return n;
  }
  addDestination(groupId: string, expected: number, entry: DistributionDestinationEntry) {
    const g = this.mustGroup(groupId);
    return this.updateDestinationGroup(groupId, expected, { entries: [...g.entries, entry] });
  }
  removeDestination(groupId: string, expected: number, entryId: string) {
    const g = this.mustGroup(groupId);
    return this.updateDestinationGroup(groupId, expected, {
      entries: g.entries.filter((e) => e.entryId !== entryId),
    });
  }
  createSession(s: DistributionSessionDefinition) {
    this.ensure();
    if (this.sessions.has(s.distributionSessionId))
      throw new DistributionError('DuplicateDistributionSession', 'duplicate session');
    const p = this.mustProfile(s.profileId),
      g = this.mustGroup(s.destinationGroupId);
    if (
      p.profileGeneration !== s.profileGeneration ||
      g.groupGeneration !== s.destinationGroupGeneration
    )
      throw new DistributionError('DistributionSessionGenerationMismatch', 'stale profile/group');
    this.sessions.set(s.distributionSessionId, f(c(s)));
    this.states.set(
      s.distributionSessionId,
      f({
        distributionSessionId: s.distributionSessionId,
        sessionGeneration: s.sessionGeneration,
        state: 'READY',
        lastSequence: -1,
        lastPts: -1,
        queueGeneration: 0,
        safeMetadata: {},
      }),
    );
    this.selectBackend(p).initializeSession(s);
    this.telemetry.sessionCreates++;
    this.emit('DistributionSessionCreated');
  }
  bindSource(b: DistributionSourceBinding) {
    this.ensure();
    if (this.bindings.has(b.bindingId))
      throw new DistributionError('DistributionSourceBindingInvalid', 'duplicate binding');
    if (
      [...this.bindings.values()].some(
        (x) => x.distributionSessionId === b.distributionSessionId && x.enabled,
      )
    )
      throw new DistributionError(
        'DistributionSourceBindingInvalid',
        'one authoritative source binding per session',
      );
    this.mustSession(b.distributionSessionId);
    this.bindings.set(b.bindingId, f(c(b)));
    this.telemetry.sourceBindings++;
  }
  transition(id: string, next: DistributionSessionState) {
    const st = this.mustState(id);
    const ok: Record<DistributionSessionState, DistributionSessionState[]> = {
      CREATED: ['VALIDATING', 'READY', 'DESTROYED'],
      VALIDATING: ['READY', 'FAILED'],
      READY: ['STARTING', 'STOPPED'],
      STARTING: ['DISTRIBUTING', 'DEGRADED', 'FAILED'],
      DISTRIBUTING: ['PAUSING', 'DRAINING', 'STOPPING', 'DEGRADED', 'PARTIAL'],
      DEGRADED: ['DISTRIBUTING', 'STOPPING', 'FAILED'],
      PARTIAL: ['DISTRIBUTING', 'STOPPING'],
      PAUSING: ['PAUSED'],
      PAUSED: ['RESUMING', 'STOPPING'],
      RESUMING: ['DISTRIBUTING', 'DEGRADED'],
      DRAINING: ['STOPPED'],
      FLUSHING: ['STOPPED', 'DISTRIBUTING'],
      STOPPING: ['STOPPED'],
      STOPPED: ['READY', 'DESTROYED'],
      FAILED: ['DESTROYED'],
      DESTROYED: ['SHUTDOWN'],
      SHUTDOWN: [],
    };
    if (!ok[st.state].includes(next))
      throw new DistributionError(
        'DistributionSessionStateInvalid',
        `invalid ${st.state}->${next}`,
      );
    this.states.set(id, f({ ...st, state: next }));
  }
  start(id: string) {
    if (this.mustState(id).state === 'STOPPED') this.transition(id, 'READY');
    this.transition(id, 'STARTING');
    this.transition(id, 'DISTRIBUTING');
    this.telemetry.sessionStarts++;
    this.emit('DistributionSessionStarted');
  }
  pause(id: string) {
    this.transition(id, 'PAUSING');
    this.transition(id, 'PAUSED');
    this.telemetry.sessionPauses++;
    this.emit('DistributionSessionPaused');
  }
  resume(id: string) {
    this.transition(id, 'RESUMING');
    this.transition(id, 'DISTRIBUTING');
    this.telemetry.sessionResumes++;
    this.emit('DistributionSessionResumed');
  }
  stop(id: string) {
    const st = this.mustState(id);
    if (st.state === 'DISTRIBUTING' || st.state === 'DEGRADED' || st.state === 'PARTIAL')
      this.transition(id, 'STOPPING');
    else if (st.state === 'PAUSED') this.transition(id, 'STOPPING');
    this.transition(id, 'STOPPED');
    this.telemetry.sessionStops++;
    this.emit('DistributionSessionStopped');
  }
  drain(id: string) {
    this.transition(id, 'DRAINING');
    this.stop(id);
    this.emit('DistributionSessionDraining');
  }
  flush(id: string, policy = 'DISCARD_OPTIONAL') {
    const st = this.mustState(id);
    this.states.set(id, f({ ...st, state: 'FLUSHING', queueGeneration: st.queueGeneration + 1 }));
    for (const [k, q] of this.queues)
      this.queues.set(
        k,
        f({ ...q, queueGeneration: q.queueGeneration + 1, depth: 0, bytes: 0, itemIds: [] }),
      );
    if (policy === 'DISCARD_ALL' || policy === 'DISCARD_OPTIONAL')
      this.releaseOpenLeases('flush-discard');
    this.states.set(id, f({ ...this.mustState(id), state: 'DISTRIBUTING' }));
  }
  reset(id: string) {
    const st = this.mustState(id);
    this.states.set(
      id,
      f({
        ...st,
        sessionGeneration: st.sessionGeneration + 1,
        lastSequence: -1,
        lastPts: -1,
        queueGeneration: st.queueGeneration + 1,
      }),
    );
    this.plans.clear();
    this.dispatches.clear();
    this.results.clear();
    this.leases.clear();
    this.queues.clear();
    this.dispatchIds.clear();
    this.resultInputs.clear();
  }
  shutdownEngine() {
    if (this.shutdown) return;
    this.releaseOpenLeases('shutdown');
    this.sessions.forEach((_, id) =>
      this.states.set(id, f({ ...this.mustState(id), state: 'SHUTDOWN' })),
    );
    this.plans.clear();
    this.dispatches.clear();
    this.queues.clear();
    this.transactions.clear();
    this.shutdown = true;
    this.emit('DistributionEngineShutdown');
  }
  submitInput(input: DistributionInputEnvelope, frame = 0) {
    this.ensure();
    const s = this.mustSession(input.distributionSessionId),
      st = this.mustState(s.distributionSessionId),
      p = this.mustProfile(s.profileId),
      g = this.mustGroup(s.destinationGroupId),
      b = this.mustBinding(input.sourceBindingId);
    if (st.state !== 'DISTRIBUTING')
      throw new DistributionError('DistributionSessionStateInvalid', 'session not distributing');
    if (this.submissions.has(input.submissionId)) {
      this.telemetry.duplicateSubmissions++;
      this.incident('DISTRIBUTION_DUPLICATE_SUBMISSION');
      throw new DistributionError('DistributionDuplicateSubmission', 'duplicate submission');
    }
    if (
      input.sessionGeneration !== s.sessionGeneration ||
      input.sessionGeneration !== st.sessionGeneration
    )
      throw new DistributionError('DistributionSessionGenerationMismatch', 'stale session');
    if (p.profileGeneration !== s.profileGeneration)
      throw new DistributionError('DistributionSessionGenerationMismatch', 'stale profile');
    if (g.groupGeneration !== s.destinationGroupGeneration)
      throw new DistributionError('DistributionSessionGenerationMismatch', 'stale group');
    if (b.bindingGeneration !== input.sourceBindingGeneration) {
      this.incident('DISTRIBUTION_SOURCE_BINDING_GENERATION_STALE');
      throw new DistributionError('DistributionSourceBindingInvalid', 'stale source binding');
    }
    if (input.inputGeneration < 1)
      throw new DistributionError('DistributionInputInvalid', 'stale input generation');
    if (input.sequence <= st.lastSequence) {
      this.telemetry.sequenceRegressions++;
      this.incident('DISTRIBUTION_SEQUENCE_REGRESSION');
      throw new DistributionError('DistributionSequenceRegression', 'sequence regression');
    }
    if (input.pts < st.lastPts) {
      this.telemetry.timestampRegressions++;
      this.incident('DISTRIBUTION_TIMESTAMP_REGRESSION');
      throw new DistributionError('DistributionTimestampRegression', 'timestamp regression');
    }
    if (input.outputRole !== s.sourceOutputRole || input.outputRole !== b.sourceOutputRole)
      throw new DistributionError('DistributionInputInvalid', 'source role mismatch');
    if (input.ownership === 'RELEASED')
      throw new DistributionError(
        'DistributionOwnershipViolation',
        'released input dispatch rejected',
      );
    this.submissions.add(input.submissionId);
    this.inputs.set(input.inputId, f(c(input)));
    this.telemetry.inputSubmissions++;
    this.emit('DistributionInputSubmitted');
    const requestId = `distribution-request:${hash(input.submissionId)}`;
    if (this.requests.has(requestId)) {
      this.telemetry.duplicateRequests++;
      throw new DistributionError('DistributionDuplicateRequest', 'duplicate request');
    }
    this.requests.add(requestId);
    const req: DistributionRequest = f({
      requestId,
      distributionSessionId: s.distributionSessionId,
      expectedSessionGeneration: s.sessionGeneration,
      expectedProfileGeneration: p.profileGeneration,
      expectedDestinationGroupGeneration: g.groupGeneration,
      expectedSourceBindingGeneration: b.bindingGeneration,
      input,
      expectedInputGeneration: input.inputGeneration,
      expectedStreamingSessionGenerations: Object.fromEntries(
        g.entries.map((e) => [e.streamingSessionId, e.streamingSessionGeneration]),
      ),
      expectedDestinationGenerations: Object.fromEntries(
        g.entries.map((e) => [e.destinationId, e.destinationGeneration]),
      ),
      expectedTimelineGeneration: 1,
      requestedRuntimeFrame: frame,
      deadlineNs: input.pts + input.duration,
      cancellationRef: undefined,
      correlationId: `distribution-corr:${hash(input.submissionId)}`,
      safeMetadata: {},
    });
    const be = this.selectBackend(p);
    const plan = be.createPlan(this, req);
    const dispatches = be.prepareDispatches(this, plan);
    const lease = this.acquireLease(plan, input);
    const streamResults = this.dispatchSynthetic(input, plan, dispatches, frame);
    const result = be.aggregateResults(this, plan, dispatches, streamResults);
    this.leases.set(
      lease.leaseId,
      f({
        ...lease,
        released: true,
        releaseReason:
          result.ownershipReleaseState === 'RELEASED' ? 'required-or-all-complete' : 'tracked',
      }),
    );
    this.results.set(result.requestId, result);
    this.resultInputs.add(input.inputId);
    this.states.set(
      s.distributionSessionId,
      f({
        ...st,
        lastSequence: input.sequence,
        lastPts: input.pts,
        state: result.degraded ? 'DEGRADED' : st.state,
      }),
    );
    this.emit(
      result.status === 'COMPLETED' || result.status === 'QUORUM_REACHED'
        ? 'DistributionCompleted'
        : 'DistributionPartial',
    );
    return result;
  }
  buildPlan(r: DistributionRequest): DistributionPlan {
    const s = this.mustSession(r.distributionSessionId),
      p = this.mustProfile(s.profileId),
      g = this.mustGroup(s.destinationGroupId);
    const entries = this.order(
      g.entries.filter((e) => e.enabled && this.compatible(p, r.input, e)),
      p.dispatchPolicy,
    );
    if (!entries.length) {
      this.telemetry.noEligibleDestinationCount =
        (this.telemetry.noEligibleDestinationCount ?? 0) + 1;
      this.incident('DISTRIBUTION_NO_ELIGIBLE_DESTINATION');
      throw new DistributionError('DistributionNoEligibleDestination', 'no eligible destination');
    }
    this.validateQuorum(p.quorumPolicy, entries);
    const planId = `distribution-plan:${hash([r.requestId, s.sessionGeneration, p.profileGeneration, g.groupGeneration].join(':'))}`;
    const plan: DistributionPlan = f({
      planId,
      requestId: r.requestId,
      distributionSessionId: s.distributionSessionId,
      sessionGeneration: s.sessionGeneration,
      profileId: p.profileId,
      profileGeneration: p.profileGeneration,
      destinationGroupId: g.destinationGroupId,
      destinationGroupGeneration: g.groupGeneration,
      inputSummary: {
        inputId: r.input.inputId,
        sequence: r.input.sequence,
        role: r.input.outputRole,
        type: r.input.inputType,
      },
      orderedEligibleDestinations: entries.map((e) => e.destinationId),
      rejectedDestinations: g.entries
        .filter((e) => !entries.includes(e))
        .map((e) => e.destinationId)
        .sort(),
      requiredDestinations: entries.filter((e) => e.required).map((e) => e.destinationId),
      optionalDestinations: entries.filter((e) => !e.required).map((e) => e.destinationId),
      dispatchOrder: entries.map((e) => e.entryId),
      quorumRequirement: p.quorumPolicy,
      borrowingOwnershipPlan: p.ownershipPolicy,
      perDestinationQueueActions: Object.fromEntries(entries.map((e) => [e.entryId, 'SEND_NOW'])),
      perDestinationRetryPolicies: Object.fromEntries(
        entries.map((e) => [e.entryId, e.retryOverride ?? {}]),
      ),
      perDestinationTimeoutPolicies: Object.fromEntries(
        entries.map((e) => [e.entryId, e.timeoutOverride ?? {}]),
      ),
      aggregateTimeoutPolicy: p.timeoutPolicy,
      expectedCompletionCount: entries.length,
      operationOrder: opOrder,
      retainedByteEstimate: r.input.estimatedBytes,
      deterministicScore: parseInt(hash(planId).slice(0, 6), 16),
      warnings: [],
      safeMetadata: {},
    });
    this.plans.set(planId, plan);
    this.telemetry.plansCreated++;
    this.telemetry.planCacheMisses++;
    this.emit('DistributionPlanCreated');
    return plan;
  }
  buildDispatches(p: DistributionPlan): readonly DistributionDestinationDispatch[] {
    const g = this.mustGroup(p.destinationGroupId);
    const entries = p.dispatchOrder
      .map((id) => g.entries.find((e) => e.entryId === id))
      .filter((e): e is DistributionDestinationEntry => !!e);
    const ds = entries.map((e, i) => {
      const dispatchId = `distribution-dispatch:${hash(p.planId)}:${e.entryId}:${i}`;
      if (this.dispatchIds.has(dispatchId)) {
        this.telemetry.duplicateDispatches++;
        this.incident('DISTRIBUTION_DUPLICATE_DISPATCH');
        throw new DistributionError('DistributionDuplicateDispatch', 'duplicate dispatch');
      }
      this.dispatchIds.add(dispatchId);
      const d: DistributionDestinationDispatch = f({
        dispatchId,
        planId: p.planId,
        destinationEntryId: e.entryId,
        destinationId: e.destinationId,
        destinationGeneration: e.destinationGeneration,
        streamingSessionId: e.streamingSessionId,
        streamingSessionGeneration: e.streamingSessionGeneration,
        dispatchSequence: i,
        required: e.required,
        priority: e.priority,
        state: 'DISPATCHING',
        sendRequestId: `stream-request:${hash(dispatchId)}`,
        retryCount: 0,
        reconnectCount: e.safeMetadata['simulateReconnect'] ? 1 : 0,
        failoverCount: e.standby && e.safeMetadata['activateBackup'] ? 1 : 0,
        startedRuntimeFrame: 0,
        completedRuntimeFrame: 0,
        resultSummary: {},
        safeMetadata: { redactedDestinationId: red(e.destinationId) },
      });
      this.dispatches.set(dispatchId, d);
      this.telemetry.destinationDispatches++;
      this.emit('DestinationDispatchCreated');
      return d;
    });
    return f(ds);
  }
  aggregate(
    p: DistributionPlan,
    d: readonly DistributionDestinationDispatch[],
    streamResults: readonly StreamingTransmissionResult[],
  ): DistributionResult {
    const ok = streamResults
      .filter((r) => r.status === 'SENT')
      .map((r) => r.destinationId)
      .sort();
    const failed = streamResults
      .filter((r) => r.status === 'FAILED')
      .map((r) => r.destinationId)
      .sort();
    const retry = streamResults
      .filter((r) => r.status === 'RETRYING')
      .map((r) => r.destinationId)
      .sort();
    const reqOk = p.requiredDestinations.every((id) => ok.includes(id));
    const quorum = this.evalQuorum(p.quorumRequirement, d, ok);
    let status: DistributionResultStatus = quorum ? 'COMPLETED' : 'QUORUM_FAILED';
    if (retry.length) status = 'RETRYING';
    else if (quorum && ok.length < d.length)
      status =
        p.quorumRequirement.policyType === 'AT_LEAST_ONE' ||
        p.quorumRequirement.policyType === 'MAJORITY' ||
        p.quorumRequirement.policyType === 'MINIMUM_COUNT' ||
        p.quorumRequirement.policyType === 'MINIMUM_WEIGHT'
          ? 'QUORUM_REACHED'
          : 'PARTIAL';
    if (!reqOk) status = 'QUORUM_FAILED';
    const input = this.plans.get(p.planId)?.inputSummary as any;
    const res: DistributionResult = f({
      requestId: p.requestId,
      planId: p.planId,
      status,
      runtimeFrame: 0,
      distributionSessionId: p.distributionSessionId,
      sessionGeneration: p.sessionGeneration,
      inputId: String(input.inputId),
      inputGeneration: 1,
      inputSequence: Number(input.sequence),
      outputRole: input.role,
      totalDestinationCount: d.length,
      eligibleDestinationCount: d.length,
      requiredDestinationCount: p.requiredDestinations.length,
      successfulDestinationIds: ok,
      failedDestinationIds: failed,
      skippedDestinationIds: [],
      retryingDestinationIds: retry,
      destinationResultSummaries: streamResults.map((r) => ({
        destinationId: r.destinationId,
        status: r.status,
        syntheticDeliveryReference: r.syntheticDeliveryReference,
        realNetworkTransmission: false,
      })),
      quorumPolicy: p.quorumRequirement,
      quorumReached: quorum,
      requiredDestinationsSatisfied: reqOk,
      partialSuccess: ok.length > 0 && ok.length < d.length,
      degraded: failed.length > 0 || retry.length > 0 || !reqOk,
      ownershipReleaseState: 'RELEASED',
      warnings: failed.length ? ['destination failure isolated by explicit policy'] : [],
      completedAtNs: 0,
    });
    this.telemetry.quorumEvaluations++;
    if (quorum) this.telemetry.quorumReached++;
    else {
      this.telemetry.quorumFailed++;
      this.incident('DISTRIBUTION_QUORUM_FAILED');
    }
    if (res.partialSuccess) this.telemetry.aggregatePartials++;
    else if (res.status === 'COMPLETED') this.telemetry.aggregateCompletions++;
    if (res.degraded) this.telemetry.aggregateDegradations++;
    return res;
  }
  private dispatchSynthetic(
    input: DistributionInputEnvelope,
    p: DistributionPlan,
    d: readonly DistributionDestinationDispatch[],
    frame: number,
  ) {
    return d.map((x) => {
      const entry = this.mustGroup(p.destinationGroupId).entries.find(
        (e) => e.entryId === x.destinationEntryId,
      )!;
      const sim = entry.safeMetadata;
      const status: any = sim['simulateRetry']
        ? 'RETRYING'
        : sim['simulateFailure']
          ? 'FAILED'
          : 'SENT';
      if (status === 'FAILED') {
        this.telemetry.destinationFailures++;
        if (entry.required) {
          this.telemetry.requiredDestinationFailures++;
          this.incident('DISTRIBUTION_REQUIRED_DESTINATION_FAILED');
        } else this.telemetry.optionalDestinationFailures++;
      } else if (status === 'RETRYING') this.telemetry.destinationRetries++;
      else this.telemetry.destinationSends++;
      this.updateHealth(entry, status, input);
      const nd = f({
        ...x,
        state: status === 'SENT' ? 'SENT' : status === 'RETRYING' ? 'RETRYING' : 'FAILED',
        completedRuntimeFrame: frame,
        resultSummary: { status },
      } as DistributionDestinationDispatch);
      this.dispatches.set(x.dispatchId, nd);
      return f({
        requestId: x.sendRequestId,
        planId: p.planId,
        status,
        runtimeFrame: frame,
        streamingSessionId: x.streamingSessionId,
        sessionGeneration: x.streamingSessionGeneration,
        destinationId: x.destinationId,
        destinationGeneration: x.destinationGeneration,
        protocol: 'RTMP_FOUNDATION',
        inputId: input.inputId,
        inputGeneration: input.inputGeneration,
        inputSequence: input.sequence,
        transmittedSequence: input.sequence,
        pts: input.pts,
        dts: input.dts,
        estimatedBytes: input.estimatedBytes,
        syntheticDeliveryReference: `synthetic-distribution:${hash(x.dispatchId)}`,
        connected: status === 'SENT',
        retryCount: status === 'RETRYING' ? 1 : 0,
        reconnectCount: 0,
        failoverCount: entry.standby && sim['activateBackup'] ? 1 : 0,
        backpressureState: sim['slow'] ? 'SOFT' : 'NONE',
        acknowledgedMetadata: `ack:${hash(x.dispatchId)}`,
        realNetworkTransmission: false,
        warnings: sim['slow'] ? ['slow destination isolated'] : [],
        completedAtNs: 0,
      } as StreamingTransmissionResult);
    });
  }
  private compatible(
    p: DistributionProfile,
    input: DistributionInputEnvelope,
    e: DistributionDestinationEntry,
  ) {
    const ok =
      e.inputCompatibilityRequirements.includes(input.inputType) &&
      (!p.compatibilityPolicy.includes('REQUIRE_OUTPUT_ROLE_COMPATIBILITY') ||
        input.outputRole === p.sourceOutputRole);
    if (!ok) {
      this.telemetry.compatibilityRejections++;
      this.incident('DISTRIBUTION_DESTINATION_INCOMPATIBLE');
    }
    return ok;
  }
  private order(
    entries: readonly DistributionDestinationEntry[],
    policy: DistributionDispatchPolicyType,
  ) {
    const base = [...entries].sort(
      (a, b) =>
        a.priority - b.priority ||
        a.destinationId.localeCompare(b.destinationId) ||
        a.entryId.localeCompare(b.entryId),
    );
    if (policy === 'REQUIRED_FIRST')
      return base.sort(
        (a, b) =>
          Number(b.required) - Number(a.required) ||
          a.priority - b.priority ||
          a.entryId.localeCompare(b.entryId),
      );
    if (policy === 'PRIMARY_FIRST')
      return base.sort(
        (a, b) =>
          Number(Boolean(b.primary)) - Number(Boolean(a.primary)) ||
          a.priority - b.priority ||
          a.entryId.localeCompare(b.entryId),
      );
    return base;
  }
  private validateQuorum(
    q: DistributionQuorumPolicy,
    entries: readonly DistributionDestinationEntry[],
  ) {
    const weight = entries.reduce((a, e) => a + e.weight, 0);
    const impossible =
      (q.policyType === 'MINIMUM_COUNT' && q.minimumSuccessCount > entries.length) ||
      (q.policyType === 'MINIMUM_WEIGHT' && q.minimumSuccessWeight > weight) ||
      !entries.length;
    if (impossible) {
      this.incident('DISTRIBUTION_QUORUM_IMPOSSIBLE');
      throw new DistributionError('DistributionQuorumImpossible', 'impossible quorum');
    }
  }
  private evalQuorum(
    q: DistributionQuorumPolicy,
    d: readonly DistributionDestinationDispatch[],
    ok: readonly string[],
  ) {
    const req = d.filter((x) => x.required);
    const w = d.filter((x) => ok.includes(x.destinationId)).length;
    switch (q.policyType) {
      case 'ALL':
        return ok.length === d.length;
      case 'ALL_REQUIRED':
        return req.every((x) => ok.includes(x.destinationId));
      case 'AT_LEAST_ONE':
        return ok.length >= 1;
      case 'MAJORITY':
        return ok.length > Math.floor(d.length / 2);
      case 'MINIMUM_COUNT':
        return ok.length >= q.minimumSuccessCount;
      case 'MINIMUM_WEIGHT':
        return d.filter((x) => ok.includes(x.destinationId)).length >= q.minimumSuccessWeight;
      case 'PRIMARY_ONLY':
        return w >= 1;
      default:
        return ok.length >= 1;
    }
  }
  private acquireLease(p: DistributionPlan, input: DistributionInputEnvelope) {
    const lease: frozenLease = f({
      leaseId: `distribution-lease:${hash(input.inputId)}`,
      inputId: input.inputId,
      inputGeneration: input.inputGeneration,
      distributionSessionId: p.distributionSessionId,
      sessionGeneration: p.sessionGeneration,
      owner: p.borrowingOwnershipPlan as DistributionOwnershipPolicy,
      destinationBorrowerIds: p.orderedEligibleDestinations,
      requiredBorrowerIds: p.requiredDestinations,
      acquiredSequence: input.sequence,
      released: false,
      safeMetadata: {},
    });
    this.leases.set(lease.leaseId, lease);
    this.telemetry.retainedBytes += input.estimatedBytes;
    return lease;
  }
  private releaseOpenLeases(reason: string) {
    for (const [k, l] of this.leases)
      if (!l.released) this.leases.set(k, f({ ...l, released: true, releaseReason: reason }));
  }
  private updateHealth(
    e: DistributionDestinationEntry,
    status: string,
    input: DistributionInputEnvelope,
  ) {
    const prev = this.healthDest.get(e.entryId);
    const h: frozenHealth = f({
      destinationId: red(e.destinationId),
      destinationGeneration: e.destinationGeneration,
      streamingSessionId: e.streamingSessionId,
      streamingSessionGeneration: e.streamingSessionGeneration,
      enabled: e.enabled,
      required: e.required,
      connectionState: status === 'SENT' ? 'READY' : 'DEGRADED',
      queueDepth: this.queues.get(e.entryId)?.depth ?? 0,
      queueBytes: this.queues.get(e.entryId)?.bytes ?? 0,
      backpressureState: e.safeMetadata['slow'] ? 'SOFT' : 'NONE',
      bandwidthState: 'SYNTHETIC',
      retryCount: (prev?.retryCount ?? 0) + (status === 'RETRYING' ? 1 : 0),
      reconnectCount: prev?.reconnectCount ?? 0,
      failoverCount:
        (prev?.failoverCount ?? 0) + (e.standby && e.safeMetadata['activateBackup'] ? 1 : 0),
      successCount: (prev?.successCount ?? 0) + (status === 'SENT' ? 1 : 0),
      failureCount: (prev?.failureCount ?? 0) + (status === 'FAILED' ? 1 : 0),
      dropCount: prev?.dropCount ?? 0,
      lastSuccessfulSequence:
        status === 'SENT' ? input.sequence : (prev?.lastSuccessfulSequence ?? -1),
      lastSuccessfulPts: status === 'SENT' ? input.pts : (prev?.lastSuccessfulPts ?? -1),
      lastFailure: status === 'FAILED' ? 'synthetic failure' : prev?.lastFailure,
      healthState: status === 'FAILED' ? 'FAILED' : e.safeMetadata['slow'] ? 'DEGRADED' : 'HEALTHY',
      safeMetadata: {},
    });
    this.healthDest.set(e.entryId, h);
  }
  private initEntry(e: DistributionDestinationEntry) {
    if (!this.queues.has(e.entryId))
      this.queues.set(
        e.entryId,
        f({
          entryId: e.entryId,
          queueGeneration: 1,
          depth: 0,
          bytes: 0,
          highWater: 0,
          maxItems: e.maximumQueueDepthOverride ?? LIMIT.queues,
          overflowPolicy: 'REJECT_NEW',
          itemIds: [],
          safeMetadata: {},
        }),
      );
    if (!this.healthDest.has(e.entryId))
      this.updateHealth(e, 'INIT', { sequence: -1, pts: -1 } as any);
  }
  private validateGroup(g: DistributionDestinationGroup) {
    if (g.entries.length > LIMIT.destinations)
      throw new DistributionError('DestinationGroupInvalid', 'too many destinations');
    const ids = new Set<string>(),
      pairs = new Set<string>();
    let prim = 0;
    for (const e of g.entries) {
      if (ids.has(e.entryId))
        throw new DistributionError('DuplicateDistributionDestinationEntry', 'duplicate entry');
      ids.add(e.entryId);
      const pair = `${e.destinationId}:${e.streamingSessionId}`;
      if (pairs.has(pair))
        throw new DistributionError(
          'DuplicateDistributionDestinationEntry',
          'duplicate destination/session pair',
        );
      pairs.add(pair);
      if (e.primary) prim++;
      if (!Number.isFinite(e.weight) || e.weight < 0 || e.weight > 1000000)
        throw new DistributionError('DistributionDestinationEntryInvalid', 'bad weight');
    }
    if (prim > 1) throw new DistributionError('DestinationGroupInvalid', 'duplicate primary');
    this.validateQuorum(
      g.quorumPolicy,
      g.entries.filter((e) => e.enabled),
    );
  }
  assertInvariants(): DistributionValidationReport {
    const errors: string[] = [];
    const check = (v: boolean, m: string) => {
      if (!v) errors.push(m);
    };
    check(this.backends.size <= LIMIT.backends, 'backend bound');
    check(this.profiles.size <= LIMIT.profiles, 'profile bound');
    check(this.groups.size <= LIMIT.groups, 'group bound');
    check(this.sessions.size <= LIMIT.sessions, 'session bound');
    check(this.dispatches.size <= LIMIT.dispatches, 'dispatch bound');
    check(this.results.size <= LIMIT.results, 'result bound');
    for (const g of this.groups.values()) {
      try {
        this.validateGroup(g);
      } catch (e) {
        errors.push((e as Error).message);
      }
    }
    for (const l of this.leases.values())
      check(l.released || !this.shutdown, 'shutdown lease release');
    return f({
      valid: errors.length === 0,
      errors,
      warnings: [],
      checkedInvariants: [
        'unique registries',
        'monotonic generations',
        'membership valid',
        'quorum achievable',
        'one input submitted once',
        'one dispatch per input/destination',
        'one aggregate result per input',
        'queues bounded',
        'ownership released on shutdown',
        'redacted metadata',
        'no real network fan-out',
      ],
    });
  }
  snapshot(): DistributionEngineSnapshot {
    const states = [...this.states.values()];
    const results = [...this.results.values()].sort((a, b) =>
      a.requestId.localeCompare(b.requestId),
    );
    const health = this.health(results, states);
    return f({
      version: DISTRIBUTION_VERSION,
      backends: [...this.backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      profiles: [...this.profiles.values()].sort((a, b) => a.profileId.localeCompare(b.profileId)),
      groups: [...this.groups.values()]
        .map((g) =>
          f({
            ...g,
            entries: [...g.entries]
              .sort((a, b) => a.entryId.localeCompare(b.entryId))
              .map((e) => f({ ...e, destinationId: red(e.destinationId) })),
          }),
        )
        .sort((a, b) => a.destinationGroupId.localeCompare(b.destinationGroupId)),
      sessions: [...this.sessions.values()].sort((a, b) =>
        a.distributionSessionId.localeCompare(b.distributionSessionId),
      ),
      sessionStates: states.sort((a, b) =>
        a.distributionSessionId.localeCompare(b.distributionSessionId),
      ),
      sourceBindings: [...this.bindings.values()].sort((a, b) =>
        a.bindingId.localeCompare(b.bindingId),
      ),
      plans: [...this.plans.values()].sort((a, b) => a.planId.localeCompare(b.planId)),
      dispatches: [...this.dispatches.values()].sort((a, b) =>
        a.dispatchId.localeCompare(b.dispatchId),
      ),
      results,
      leases: [...this.leases.values()].sort((a, b) => a.leaseId.localeCompare(b.leaseId)),
      queues: [...this.queues.values()].sort((a, b) => a.entryId.localeCompare(b.entryId)),
      destinationHealth: [...this.healthDest.values()].sort((a, b) =>
        a.destinationId.localeCompare(b.destinationId),
      ),
      health,
      telemetry: f(
        c({
          ...this.telemetry,
          averageDestinationsPerInput: this.results.size
            ? this.telemetry.destinationDispatches / this.results.size
            : 0,
          averageSuccessfulDestinations: this.results.size
            ? this.telemetry.destinationSends / this.results.size
            : 0,
          activeSessionIds: states
            .filter((s) => s.state === 'DISTRIBUTING')
            .map((s) => s.distributionSessionId)
            .sort(),
          healthSummary: health.healthState,
        }),
      ),
      events: this.events,
      watchdogIncidents: this.incidents,
      validation: this.assertInvariants(),
    });
  }
  private health(
    results: DistributionResult[],
    states: DistributionSessionStateSnapshot[],
  ): DistributionHealthSnapshot {
    const entries = [...this.groups.values()].flatMap((g) => g.entries);
    return f({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.shutdown ? 'SHUTDOWN' : this.incidents.length ? 'DEGRADED' : 'HEALTHY',
      backendCount: this.backends.size,
      profileCount: this.profiles.size,
      destinationGroupCount: this.groups.size,
      destinationEntryCount: entries.length,
      sessionCount: this.sessions.size,
      activeSessionCount: states.filter(
        (s) => !['STOPPED', 'SHUTDOWN', 'DESTROYED'].includes(s.state),
      ).length,
      distributingSessionCount: states.filter((s) => s.state === 'DISTRIBUTING').length,
      degradedSessionCount: states.filter((s) => s.state === 'DEGRADED').length,
      failedSessionCount: states.filter((s) => s.state === 'FAILED').length,
      programDistributionSessionId: [...this.sessions.values()].find(
        (s) => s.sourceOutputRole === 'PROGRAM',
      )?.distributionSessionId,
      submittedInputCount: this.submissions.size,
      plannedInputCount: this.plans.size,
      completedInputCount: results.filter(
        (r) => r.status === 'COMPLETED' || r.status === 'QUORUM_REACHED',
      ).length,
      partialInputCount: results.filter((r) => r.partialSuccess).length,
      failedInputCount: results.filter((r) => r.status === 'FAILED' || r.status === 'QUORUM_FAILED')
        .length,
      cancelledInputCount: results.filter((r) => r.status === 'CANCELLED').length,
      destinationDispatchCount: this.dispatches.size,
      destinationSuccessCount: this.telemetry.destinationSends,
      destinationFailureCount: this.telemetry.destinationFailures,
      destinationSkipCount: this.telemetry.destinationSkips,
      destinationRetryCount: this.telemetry.destinationRetries,
      quorumReachedCount: this.telemetry.quorumReached,
      quorumFailedCount: this.telemetry.quorumFailed,
      duplicateRequestCount: this.telemetry.duplicateRequests,
      duplicateSubmissionCount: this.telemetry.duplicateSubmissions,
      duplicateDispatchCount: this.telemetry.duplicateDispatches,
      staleGenerationRejectionCount: this.telemetry.staleGenerations,
      sequenceRegressionCount: this.telemetry.sequenceRegressions,
      timestampRegressionCount: this.telemetry.timestampRegressions,
      incompatibleDestinationCount: this.telemetry.compatibilityRejections,
      noEligibleDestinationCount: this.telemetry.noEligibleDestinationCount ?? 0,
      queueOverflowCount: this.telemetry.queueOverflow ?? 0,
      timeoutCount: this.telemetry.timeouts,
      ownershipViolationCount: this.telemetry.ownershipViolations,
      retainedInputCount: [...this.leases.values()].filter((l) => !l.released).length,
      retainedInputBytes: this.telemetry.retainedBytes,
      destinationQueueBytes: [...this.queues.values()].reduce((a, q) => a + q.bytes, 0),
      peakRetainedBytes: this.telemetry.retainedBytes,
      activeRequiredDestinationCount: entries.filter((e) => e.required && e.enabled).length,
      activeOptionalDestinationCount: entries.filter((e) => !e.required && e.enabled).length,
      lastCompletedSequence: results.at(-1)?.inputSequence ?? -1,
      lastFailure: this.incidents.at(-1),
      updatedAtNs: 0,
    });
  }
  private mustProfile(id: string) {
    const v = this.profiles.get(id);
    if (!v) throw new DistributionError('DistributionProfileNotFound', id);
    return v;
  }
  private mustGroup(id: string) {
    const v = this.groups.get(id);
    if (!v) throw new DistributionError('DestinationGroupNotFound', id);
    return v;
  }
  private mustSession(id: string) {
    const v = this.sessions.get(id);
    if (!v) throw new DistributionError('DistributionSessionNotFound', id);
    return v;
  }
  private mustState(id: string) {
    const v = this.states.get(id);
    if (!v) throw new DistributionError('DistributionSessionNotFound', id);
    return v;
  }
  private mustBinding(id: string) {
    const v = this.bindings.get(id);
    if (!v) throw new DistributionError('DistributionSourceBindingInvalid', id);
    return v;
  }
}
type frozenLease = Readonly<DistributionInputLease>;
type frozenHealth = Readonly<DistributionDestinationHealth>;
export const createMultiDestinationDistributionEngine = (
  streamingEngine?: StreamingOutputEngine,
  id?: string,
) => new MultiDestinationDistributionEngine(id, streamingEngine);
export class MultiDestinationDistributionProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'multi-destination-distribution',
    name: 'Multi-Destination Distribution and Fan-Out',
    version: DISTRIBUTION_VERSION,
    order: MULTI_DESTINATION_DISTRIBUTION_PROCESSOR_ORDER,
    phase: 'OUTPUT',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: ['streaming-output-foundation'],
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
  constructor(readonly engine: MultiDestinationDistributionEngine) {}
  initialize() {
    return { status: 'READY' as const, metadata: { order: this.descriptor.order } };
  }
  async processTick(_tick: FrameTick, context: ProcessorRuntimeContext | any) {
    const snap = this.engine.snapshot();
    context?.outputs?.publish?.(
      this.descriptor.id,
      DISTRIBUTION_OUTPUT_KEYS.engineHealth,
      snap.health,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      DISTRIBUTION_OUTPUT_KEYS.telemetry,
      snap.telemetry,
      'BORROWED',
    );
    return { status: 'SUCCEEDED' as const, value: snap.health };
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' as const };
  }
}
export const createMultiDestinationDistributionProcessor = (
  engine: MultiDestinationDistributionEngine,
) => new MultiDestinationDistributionProcessor(engine);
export function createDistributionCommandHandlers(
  engine: MultiDestinationDistributionEngine,
): Readonly<Record<DistributionCommandType, RuntimeCommandHandler>> {
  const h = (type: DistributionCommandType, fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: type,
      idempotent: true,
      execute(c: any) {
        return { status: 'SUCCEEDED', value: fn((c as any).payload ?? {}) };
      },
    }) as any;
  return {
    DISTRIBUTION_REGISTER_BACKEND: h('DISTRIBUTION_REGISTER_BACKEND', (p) =>
      engine.registerBackend(p.backend),
    ),
    DISTRIBUTION_UNREGISTER_BACKEND: h('DISTRIBUTION_UNREGISTER_BACKEND', () => undefined),
    DISTRIBUTION_REGISTER_PROFILE: h('DISTRIBUTION_REGISTER_PROFILE', (p) =>
      engine.registerProfile(p.profile),
    ),
    DISTRIBUTION_UPDATE_PROFILE: h('DISTRIBUTION_UPDATE_PROFILE', (p) =>
      engine.updateProfile(p.profileId, p.expectedGeneration, p.patch),
    ),
    DISTRIBUTION_UNREGISTER_PROFILE: h('DISTRIBUTION_UNREGISTER_PROFILE', () => undefined),
    DISTRIBUTION_CREATE_DESTINATION_GROUP: h('DISTRIBUTION_CREATE_DESTINATION_GROUP', (p) =>
      engine.createDestinationGroup(p.group),
    ),
    DISTRIBUTION_UPDATE_DESTINATION_GROUP: h('DISTRIBUTION_UPDATE_DESTINATION_GROUP', (p) =>
      engine.updateDestinationGroup(p.destinationGroupId, p.expectedGeneration, p.patch),
    ),
    DISTRIBUTION_DESTROY_DESTINATION_GROUP: h(
      'DISTRIBUTION_DESTROY_DESTINATION_GROUP',
      () => undefined,
    ),
    DISTRIBUTION_ADD_DESTINATION: h('DISTRIBUTION_ADD_DESTINATION', (p) =>
      engine.addDestination(p.destinationGroupId, p.expectedGeneration, p.entry),
    ),
    DISTRIBUTION_UPDATE_DESTINATION: h('DISTRIBUTION_UPDATE_DESTINATION', () => undefined),
    DISTRIBUTION_REMOVE_DESTINATION: h('DISTRIBUTION_REMOVE_DESTINATION', (p) =>
      engine.removeDestination(p.destinationGroupId, p.expectedGeneration, p.entryId),
    ),
    DISTRIBUTION_CREATE_SESSION: h('DISTRIBUTION_CREATE_SESSION', (p) =>
      engine.createSession(p.session),
    ),
    DISTRIBUTION_UPDATE_SESSION: h('DISTRIBUTION_UPDATE_SESSION', () => undefined),
    DISTRIBUTION_DESTROY_SESSION: h('DISTRIBUTION_DESTROY_SESSION', (p) =>
      engine.transition(p.distributionSessionId, 'DESTROYED'),
    ),
    DISTRIBUTION_BIND_SOURCE: h('DISTRIBUTION_BIND_SOURCE', (p) => engine.bindSource(p.binding)),
    DISTRIBUTION_UNBIND_SOURCE: h('DISTRIBUTION_UNBIND_SOURCE', () => undefined),
    DISTRIBUTION_START: h('DISTRIBUTION_START', (p) => engine.start(p.distributionSessionId)),
    DISTRIBUTION_PAUSE: h('DISTRIBUTION_PAUSE', (p) => engine.pause(p.distributionSessionId)),
    DISTRIBUTION_RESUME: h('DISTRIBUTION_RESUME', (p) => engine.resume(p.distributionSessionId)),
    DISTRIBUTION_STOP: h('DISTRIBUTION_STOP', (p) => engine.stop(p.distributionSessionId)),
    DISTRIBUTION_SUBMIT_INPUT: h('DISTRIBUTION_SUBMIT_INPUT', (p) =>
      engine.submitInput(p.input, p.runtimeFrame),
    ),
    DISTRIBUTION_CANCEL_INPUT: h('DISTRIBUTION_CANCEL_INPUT', () => undefined),
    DISTRIBUTION_RETRY_DESTINATION: h('DISTRIBUTION_RETRY_DESTINATION', () => undefined),
    DISTRIBUTION_DISABLE_DESTINATION: h('DISTRIBUTION_DISABLE_DESTINATION', () => undefined),
    DISTRIBUTION_ENABLE_DESTINATION: h('DISTRIBUTION_ENABLE_DESTINATION', () => undefined),
    DISTRIBUTION_SET_QUORUM_POLICY: h('DISTRIBUTION_SET_QUORUM_POLICY', () => undefined),
    DISTRIBUTION_SET_DISPATCH_POLICY: h('DISTRIBUTION_SET_DISPATCH_POLICY', () => undefined),
    DISTRIBUTION_SET_FAILURE_POLICY: h('DISTRIBUTION_SET_FAILURE_POLICY', () => undefined),
    DISTRIBUTION_SET_QUEUE_POLICY: h('DISTRIBUTION_SET_QUEUE_POLICY', () => undefined),
    DISTRIBUTION_DRAIN: h('DISTRIBUTION_DRAIN', (p) => engine.drain(p.distributionSessionId)),
    DISTRIBUTION_FLUSH: h('DISTRIBUTION_FLUSH', (p) =>
      engine.flush(p.distributionSessionId, p.policy),
    ),
    DISTRIBUTION_RESET_SESSION: h('DISTRIBUTION_RESET_SESSION', (p) =>
      engine.reset(p.distributionSessionId),
    ),
    DISTRIBUTION_RECONFIGURE: h('DISTRIBUTION_RECONFIGURE', () => undefined),
    DISTRIBUTION_CLEAR_PLAN_CACHE: h('DISTRIBUTION_CLEAR_PLAN_CACHE', () => undefined),
    DISTRIBUTION_VALIDATE: h('DISTRIBUTION_VALIDATE', () => engine.assertInvariants()),
    DISTRIBUTION_SHUTDOWN: h('DISTRIBUTION_SHUTDOWN', () => engine.shutdownEngine()),
  };
}
export function createDistributionSourceGraphSnapshot(engine: MultiDestinationDistributionEngine) {
  const s = engine.snapshot();
  return f({
    distributionSessionIds: s.sessions.map((x) => x.distributionSessionId),
    sourceOutputRoles: s.sessions.map((x) => x.sourceOutputRole),
    destinationGroupIds: s.groups.map((x) => x.destinationGroupId),
    destinationIds: s.groups.flatMap((g) => g.entries.map((e) => e.destinationId)),
    requiredOptionalStatus: s.groups.flatMap((g) =>
      g.entries.map((e) => ({ entryId: e.entryId, required: e.required })),
    ),
    sessionState: s.sessionStates.map((x) => x.state),
    distributionModes: s.profiles.map((x) => x.distributionMode),
    quorumState: { reached: s.health.quorumReachedCount, failed: s.health.quorumFailedCount },
    destinationHealthSummaries: s.destinationHealth.map((h) => ({
      destinationId: h.destinationId,
      health: h.healthState,
      queueDepth: h.queueDepth,
    })),
    queueDepthSummaries: s.queues.map((q) => ({ entryId: q.entryId, depth: q.depth })),
    retryReconnectFailoverSummaries: s.destinationHealth.map((h) => ({
      destinationId: h.destinationId,
      retry: h.retryCount,
      reconnect: h.reconnectCount,
      failover: h.failoverCount,
    })),
    successfulFailedDestinationCounts: {
      successful: s.health.destinationSuccessCount,
      failed: s.health.destinationFailureCount,
    },
    retainedInputSummaries: {
      count: s.health.retainedInputCount,
      bytes: s.health.retainedInputBytes,
    },
    aggregateResultStatus: s.results.at(-1)?.status,
    realNetworkFanOut: false,
    health: s.health.healthState,
    routingEligibility: s.health.healthState !== 'FAILED',
  });
}
