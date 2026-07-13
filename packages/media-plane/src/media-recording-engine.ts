import type {
  FrameTick,
  RuntimeCommand,
  RuntimeCommandHandler,
  RuntimeContext,
  ProcessorRuntimeContext,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';

export const RECORDING_ENGINE_VERSION = '5.6.8';
export const RECORDING_PROCESSOR_ORDER = 1000;
const LIMIT = Object.freeze({
  profiles: 128,
  destinations: 128,
  sessions: 256,
  bindings: 1024,
  requests: 4096,
  submissions: 8192,
  partsPerSession: 512,
  artifacts: 4096,
  events: 256,
});

export const RECORDING_OUTPUT_KEYS = Object.freeze({
  profiles: 'recording.profiles',
  destinations: 'recording.destinations',
  sessionDefinitions: 'recording.session.definitions',
  sessionStates: 'recording.session.states',
  sourceBindings: 'recording.source.bindings',
  packageSubmissions: 'recording.package.submissions',
  activeRequests: 'recording.requests.active',
  plans: 'recording.plans',
  parts: 'recording.parts',
  storageReservations: 'recording.storage.reservations',
  storagePressure: 'recording.storage.pressure',
  manifests: 'recording.manifests',
  indexes: 'recording.indexes',
  sidecars: 'recording.sidecars',
  artifacts: 'recording.artifacts',
  artifactLeases: 'recording.artifact.leases',
  packageInputQueues: 'recording.queues.package-input',
  artifactOutputQueues: 'recording.queues.artifact-output',
  backpressure: 'recording.backpressure',
  rollover: 'recording.rollover',
  split: 'recording.split',
  pauseResume: 'recording.pause-resume',
  drain: 'recording.drain',
  finalization: 'recording.finalization',
  abort: 'recording.abort',
  recovery: 'recording.recovery',
  transactions: 'recording.transactions.active',
  health: 'recording.health',
  telemetry: 'recording.telemetry',
  watchdog: 'recording.watchdog',
  sourceGraph: 'recording.source-graph',
  backendHealth: 'recording.backend.health',
  rejectedResults: 'recording.rejected',
} as const);
export const RECORDING_COMMAND_TYPES = [
  'RECORDING_REGISTER_BACKEND',
  'RECORDING_UNREGISTER_BACKEND',
  'RECORDING_REGISTER_PROFILE',
  'RECORDING_UPDATE_PROFILE',
  'RECORDING_UNREGISTER_PROFILE',
  'RECORDING_REGISTER_DESTINATION',
  'RECORDING_UPDATE_DESTINATION',
  'RECORDING_UNREGISTER_DESTINATION',
  'RECORDING_CREATE_SESSION',
  'RECORDING_UPDATE_SESSION',
  'RECORDING_DESTROY_SESSION',
  'RECORDING_BIND_SOURCE',
  'RECORDING_UNBIND_SOURCE',
  'RECORDING_START',
  'RECORDING_PAUSE',
  'RECORDING_RESUME',
  'RECORDING_STOP',
  'RECORDING_ABORT',
  'RECORDING_SUBMIT_PACKAGE',
  'RECORDING_FORCE_ROLLOVER',
  'RECORDING_FORCE_SPLIT',
  'RECORDING_ADD_MARKER',
  'RECORDING_DRAIN',
  'RECORDING_FINALIZE',
  'RECORDING_RECOVER',
  'RECORDING_RESET_SESSION',
  'RECORDING_RECONFIGURE',
  'RECORDING_SET_STORAGE_POLICY',
  'RECORDING_SET_QUEUE_POLICY',
  'RECORDING_CLEAR_PLAN_CACHE',
  'RECORDING_VALIDATE',
  'RECORDING_SHUTDOWN',
] as const;
export type RecordingCommandType = (typeof RECORDING_COMMAND_TYPES)[number];
export const RECORDING_EVENTS = [
  'RecordingEngineCreated',
  'RecordingBackendRegistered',
  'RecordingBackendRemoved',
  'RecordingProfileRegistered',
  'RecordingProfileUpdated',
  'RecordingProfileRemoved',
  'RecordingDestinationRegistered',
  'RecordingDestinationUpdated',
  'RecordingDestinationRemoved',
  'RecordingSessionCreated',
  'RecordingSessionValidated',
  'RecordingSessionStarted',
  'RecordingSessionPaused',
  'RecordingSessionResumed',
  'RecordingSessionRollingOver',
  'RecordingSessionDraining',
  'RecordingSessionStopping',
  'RecordingSessionFinalizing',
  'RecordingSessionFinalized',
  'RecordingSessionAborting',
  'RecordingSessionAborted',
  'RecordingSessionRecovering',
  'RecordingSessionRecovered',
  'RecordingSessionFailed',
  'RecordingSourceBound',
  'RecordingSourceUnbound',
  'RecordingPackageSubmitted',
  'RecordingWritePlanned',
  'RecordingPackageConsumed',
  'RecordingPartCreated',
  'RecordingPartFinalized',
  'RecordingRolloverCompleted',
  'RecordingSplitCompleted',
  'RecordingManifestUpdated',
  'RecordingManifestFinalized',
  'RecordingIndexUpdated',
  'RecordingArtifactCreated',
  'RecordingStoragePressureChanged',
  'RecordingQuotaReached',
  'RecordingRecoveryRequired',
  'RecordingRecoveryCompleted',
  'RecordingBackpressureChanged',
  'RecordingHealthChanged',
  'RecordingEngineShutdown',
] as const;
export type RecordingEventType = (typeof RECORDING_EVENTS)[number];
export const RECORDING_WATCHDOG_INCIDENTS = [
  'RECORDING_ENGINE_STALLED',
  'RECORDING_REQUEST_TIMEOUT',
  'RECORDING_DUPLICATE_REQUEST',
  'RECORDING_DUPLICATE_SUBMISSION',
  'RECORDING_SESSION_GENERATION_STALE',
  'RECORDING_PROFILE_GENERATION_STALE',
  'RECORDING_DESTINATION_GENERATION_STALE',
  'RECORDING_PACKAGE_GENERATION_STALE',
  'RECORDING_TIMELINE_GENERATION_STALE',
  'RECORDING_PACKAGE_INCOMPATIBLE',
  'RECORDING_PACKAGE_NOT_FINALIZED',
  'RECORDING_PROGRAM_PACKAGE_MISSING',
  'RECORDING_PART_STATE_INVALID',
  'RECORDING_DUPLICATE_PART_FINALIZATION',
  'RECORDING_DUPLICATE_ARTIFACT',
  'RECORDING_ROLLOVER_FAILED',
  'RECORDING_SPLIT_FAILED',
  'RECORDING_STORAGE_RESERVATION_FAILED',
  'RECORDING_STORAGE_PRESSURE_HIGH',
  'RECORDING_STORAGE_EXHAUSTED',
  'RECORDING_QUOTA_EXCEEDED',
  'RECORDING_INPUT_QUEUE_OVERFLOW',
  'RECORDING_ARTIFACT_QUEUE_OVERFLOW',
  'RECORDING_BACKPRESSURE_CRITICAL',
  'RECORDING_FINALIZATION_FAILED',
  'RECORDING_ABORT_FAILED',
  'RECORDING_RECOVERY_REQUIRED',
  'RECORDING_RECOVERY_FAILED',
  'RECORDING_BACKEND_FAILED',
  'RECORDING_ALLOCATION_FAILED',
  'RECORDING_OWNERSHIP_VIOLATION',
  'RECORDING_OUTPUT_REGISTRY_MISMATCH',
  'RECORDING_SOURCE_GRAPH_MISMATCH',
  'RECORDING_INVARIANT_FAILURE',
] as const;
export type RecordingWatchdogIncidentType = (typeof RECORDING_WATCHDOG_INCIDENTS)[number];

export type RecordingType =
  | 'PROGRAM'
  | 'PREVIEW_METADATA'
  | 'CLEAN_FEED'
  | 'AUXILIARY'
  | 'ISO_VIDEO'
  | 'ISO_AUDIO'
  | 'ISO_AUDIO_VIDEO'
  | 'MULTITRACK'
  | 'PROXY_METADATA'
  | 'ARCHIVE_FOUNDATION'
  | 'CUSTOM_TYPED';
export type RecordingOutputRole =
  'PROGRAM' | 'PREVIEW' | 'AUX' | 'CLEAN_FEED' | 'RECORD' | 'STREAM' | 'CUSTOM';
export type DestinationType =
  | 'SYNTHETIC_MEMORY_REFERENCE'
  | 'LOCAL_STORAGE_METADATA'
  | 'REMOVABLE_STORAGE_METADATA'
  | 'NETWORK_STORAGE_METADATA'
  | 'CLOUD_STORAGE_METADATA'
  | 'ARCHIVE_STORAGE_METADATA'
  | 'CUSTOM_TYPED';
export type StorageClass =
  | 'TEMPORARY'
  | 'STANDARD'
  | 'HIGH_PERFORMANCE'
  | 'REMOVABLE'
  | 'NETWORK'
  | 'CLOUD'
  | 'ARCHIVE'
  | 'SYNTHETIC'
  | 'CUSTOM';
export type RecordingSessionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'STARTING'
  | 'RECORDING'
  | 'PAUSING'
  | 'PAUSED'
  | 'RESUMING'
  | 'ROLLING_OVER'
  | 'DRAINING'
  | 'STOPPING'
  | 'FINALIZING'
  | 'FINALIZED'
  | 'ABORTING'
  | 'ABORTED'
  | 'RECOVERING'
  | 'RECOVERED'
  | 'FAILED'
  | 'DESTROYED'
  | 'SHUTDOWN';
export type RolloverPolicyType =
  | 'NONE'
  | 'FIXED_DURATION'
  | 'MAXIMUM_DURATION'
  | 'FIXED_SIZE'
  | 'MAXIMUM_SIZE'
  | 'PACKAGE_COUNT'
  | 'SEGMENT_COUNT'
  | 'DISCONTINUITY'
  | 'MANUAL'
  | 'DAILY_BOUNDARY_METADATA'
  | 'CUSTOM';
export type SplitPolicyType =
  | 'NEVER'
  | 'ON_SCENE_CHANGE_METADATA'
  | 'ON_SOURCE_CHANGE_METADATA'
  | 'ON_DISCONTINUITY'
  | 'ON_MARKER'
  | 'ON_MANUAL_REQUEST'
  | 'ON_OUTPUT_ROLE_CHANGE'
  | 'CUSTOM';
export type ArtifactOwnership =
  | 'RECORDER_OWNED'
  | 'ARTIFACT_REGISTRY_OWNED'
  | 'ARCHIVE_FUTURE_OWNED'
  | 'REPLAY_FUTURE_OWNED'
  | 'BORROWED_READ_ONLY'
  | 'RELEASED';
export type StoragePressureState =
  'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'EXHAUSTED' | 'FAILED';
export type BackpressureState = 'NONE' | 'SOFT' | 'HARD' | 'CRITICAL' | 'FAILED';
export type ReservationState =
  'REQUESTED' | 'RESERVED' | 'PARTIALLY_CONSUMED' | 'CONSUMED' | 'RELEASED' | 'FAILED' | 'EXPIRED';
export type PackageOwnership = 'BORROWED_READ_ONLY' | 'TRANSFERRED_TO_RECORDER' | 'RELEASED';
export type ContainerFormat =
  | 'MP4_METADATA'
  | 'MPEG_TS_METADATA'
  | 'MATROSKA_METADATA'
  | 'WEBM_METADATA'
  | 'FRAGMENTED_MP4_METADATA'
  | 'CUSTOM_METADATA';
export type StartPolicy =
  | 'WAIT_FOR_PACKAGE_READY'
  | 'WAIT_FOR_INITIALIZATION_PACKAGE'
  | 'WAIT_FOR_VIDEO_KEYFRAME'
  | 'WAIT_FOR_ALL_CRITICAL_TRACKS'
  | 'START_AT_NEXT_SEGMENT'
  | 'START_AT_NEXT_FRAME_TICK'
  | 'START_DEGRADED'
  | 'CUSTOM';
export type PausePolicy =
  | 'CLOSE_CURRENT_PART'
  | 'KEEP_PART_OPEN_METADATA'
  | 'START_NEW_PART_ON_RESUME'
  | 'INSERT_DISCONTINUITY_METADATA'
  | 'REJECT_PAUSE'
  | 'CUSTOM';
export type StopPolicy =
  | 'DRAIN_AND_FINALIZE'
  | 'FINALIZE_CURRENT_PART'
  | 'ABORT_CURRENT_PART'
  | 'STOP_AT_NEXT_SEGMENT'
  | 'STOP_AT_NEXT_KEYFRAME_METADATA'
  | 'CUSTOM';
export type RecordingSafeMetadata = Readonly<Record<string, string | number | boolean | null>>;
export type RecordingErrorCode =
  | 'RecordingEngineNotReady'
  | 'RecordingBackendNotFound'
  | 'DuplicateRecordingBackend'
  | 'RecordingProfileNotFound'
  | 'DuplicateRecordingProfile'
  | 'RecordingProfileInvalid'
  | 'RecordingDestinationNotFound'
  | 'DuplicateRecordingDestination'
  | 'RecordingDestinationInvalid'
  | 'RecordingSessionNotFound'
  | 'DuplicateRecordingSession'
  | 'RecordingSessionInvalid'
  | 'RecordingSessionGenerationMismatch'
  | 'RecordingSessionStateInvalid'
  | 'RecordingSourceBindingInvalid'
  | 'RecordingPackageInputInvalid'
  | 'RecordingDuplicateRequest'
  | 'RecordingDuplicateSubmission'
  | 'RecordingPackageIncompatible'
  | 'RecordingStorageReservationFailed'
  | 'RecordingStoragePressureCritical'
  | 'RecordingQuotaExceeded'
  | 'RecordingQueueFull'
  | 'RecordingBackpressureCritical'
  | 'RecordingRolloverFailed'
  | 'RecordingSplitFailed'
  | 'RecordingPartFinalizationFailed'
  | 'RecordingFinalizationFailed'
  | 'RecordingAbortFailed'
  | 'RecordingRecoveryFailed'
  | 'RecordingBackendFailed'
  | 'RecordingAllocationFailed'
  | 'RecordingOwnershipViolation'
  | 'RecordingCancelled'
  | 'RecordingTimeout'
  | 'RecordingInvariantViolation'
  | 'RecordingShutdownError';
export class RecordingEngineError extends Error {
  readonly name: RecordingErrorCode;
  readonly safeMetadata: RecordingSafeMetadata;
  constructor(code: RecordingErrorCode, message: string, safeMetadata: RecordingSafeMetadata = {}) {
    super(redact(message));
    this.name = code;
    this.safeMetadata = sanitizeMetadata(safeMetadata);
  }
}

export interface RecordingFilenamePolicy {
  readonly templateId: string;
  readonly templateVersion: number;
  readonly allowedTokens: readonly string[];
  readonly namingPatternMetadata: string;
  readonly sequenceFormatting: string;
  readonly timestampTokenPolicy: string;
  readonly collisionPolicy:
    | 'REJECT'
    | 'INCREMENT_SEQUENCE'
    | 'APPEND_DETERMINISTIC_SUFFIX'
    | 'REPLACE_METADATA_ONLY'
    | 'CREATE_NEW_PART'
    | 'CUSTOM';
  readonly extensionPolicy: string;
  readonly sanitizationPolicy: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingProfile {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly recordingType: RecordingType;
  readonly outputRole: RecordingOutputRole;
  readonly packageProfileRef: string;
  readonly expectedContainerFormat: ContainerFormat;
  readonly sourcePackageSessionIds: readonly string[];
  readonly destinationId: string;
  readonly filenamePolicy: RecordingFilenamePolicy;
  readonly rolloverPolicy: Readonly<{ type: RolloverPolicyType; threshold?: number }>;
  readonly splitPolicy: Readonly<{ type: SplitPolicyType; threshold?: number }>;
  readonly manifestPolicy: RecordingSafeMetadata;
  readonly sidecarPolicy: RecordingSafeMetadata;
  readonly recoveryPolicy: RecordingSafeMetadata;
  readonly storagePolicy: RecordingSafeMetadata;
  readonly queuePolicy: RecordingSafeMetadata;
  readonly finalizationPolicy: RecordingSafeMetadata;
  readonly retentionMetadata: RecordingSafeMetadata;
  readonly failurePolicy: RecordingSafeMetadata;
  readonly backendPreference?: string;
  readonly criticality: 'PROGRAM_CRITICAL' | 'OPTIONAL' | 'ISO_CRITICAL' | 'CUSTOM';
  readonly safeMetadata: RecordingSafeMetadata;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
}
export interface RecordingDestinationDefinition {
  readonly destinationId: string;
  readonly destinationVersion: string;
  readonly destinationGeneration: number;
  readonly destinationType: DestinationType;
  readonly displayName: string;
  readonly storageClass: StorageClass;
  readonly capacityBytes: number;
  readonly availableBytes: number;
  readonly reservedBytes: number;
  readonly writeEligibility: 'EXECUTABLE' | 'METADATA_ONLY' | 'DISABLED';
  readonly persistenceCapability: 'NONE' | 'METADATA_ONLY' | 'REAL_VALIDATED';
  readonly atomicFinalizeCapability: boolean;
  readonly recoveryCapability: boolean;
  readonly directoryReferenceMetadata: string;
  readonly quotaPolicy: Readonly<{
    type?: string;
    maxBytes?: number;
    maxDuration?: number;
    maxPartCount?: number;
  }>;
  readonly collisionPolicy: string;
  readonly safeMetadata: RecordingSafeMetadata;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
}
export interface RecordingSessionDefinition {
  readonly recordingSessionId: string;
  readonly sessionVersion: string;
  readonly sessionGeneration: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly recordingType: RecordingType;
  readonly outputRole: RecordingOutputRole;
  readonly packageSessionIds: readonly string[];
  readonly trackBindings: readonly string[];
  readonly startPolicy: readonly StartPolicy[];
  readonly pausePolicy: PausePolicy;
  readonly resumePolicy: RecordingSafeMetadata;
  readonly stopPolicy: StopPolicy;
  readonly rolloverPolicy: Readonly<{ type: RolloverPolicyType; threshold?: number }>;
  readonly recoveryPolicy: RecordingSafeMetadata;
  readonly queuePolicy: RecordingSafeMetadata;
  readonly criticality: string;
  readonly enabled: boolean;
  readonly safeMetadata: RecordingSafeMetadata;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
}
export interface RecordingSourceBinding {
  readonly bindingId: string;
  readonly bindingVersion: string;
  readonly bindingGeneration: number;
  readonly recordingSessionId: string;
  readonly packageSessionId: string;
  readonly packagedOutputRole: RecordingOutputRole;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly sourceGeneration: number;
  readonly trackIds: readonly string[];
  readonly required: boolean;
  readonly enabled: boolean;
  readonly isoDesignation?: string;
  readonly priority: number;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingPackageInput {
  readonly submissionId: string;
  readonly recordingSessionId: string;
  readonly recordingSessionGeneration: number;
  readonly packageOutputId: string;
  readonly packageOutputGeneration: number;
  readonly packageSessionId: string;
  readonly packageSessionGeneration: number;
  readonly outputRole: RecordingOutputRole;
  readonly containerFormat: ContainerFormat;
  readonly packageType: 'INITIALIZATION' | 'SEGMENT' | 'FRAGMENT' | 'SIDECAR_METADATA' | 'CUSTOM';
  readonly segmentId?: string;
  readonly fragmentId?: string;
  readonly initializationId?: string;
  readonly startPts: number;
  readonly endPts: number;
  readonly duration: number;
  readonly discontinuityGeneration: number;
  readonly finalized: boolean;
  readonly ownership: PackageOwnership;
  readonly estimatedSizeBytes: number;
  readonly checksum: string;
  readonly timelineGeneration: number;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingWriteRequest {
  readonly requestId: string;
  readonly recordingSessionId: string;
  readonly expectedRecordingSessionGeneration: number;
  readonly expectedProfileGeneration: number;
  readonly expectedDestinationGeneration: number;
  readonly packageInput: RecordingPackageInputSnapshot;
  readonly expectedPackageSessionGeneration: number;
  readonly expectedPackageOutputGeneration: number;
  readonly expectedTimelineGeneration: number;
  readonly requestedRuntimeFrame: string;
  readonly deadlineNs: string;
  readonly cancellationRef?: string;
  readonly correlationId: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingWritePlan {
  readonly planId: string;
  readonly requestId: string;
  readonly recordingSessionId: string;
  readonly recordingSessionGeneration: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly packageInputSummary: RecordingSafeMetadata;
  readonly activePartId: string;
  readonly activePartGeneration: number;
  readonly filenameTemplateResolutionMetadata: string;
  readonly collisionAction: string;
  readonly storageReservationAction: string;
  readonly rolloverDecision: string;
  readonly splitDecision: string;
  readonly manifestAction: string;
  readonly sidecarAction: string;
  readonly recoveryAction: string;
  readonly ownershipAction: string;
  readonly operationOrder: readonly string[];
  readonly estimatedWriteBytes: number;
  readonly retainedByteEstimate: number;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingPartState {
  readonly partId: string;
  readonly partVersion: string;
  readonly partGeneration: number;
  readonly recordingSessionId: string;
  readonly recordingSessionGeneration: number;
  readonly partSequence: number;
  readonly syntheticFilenameReference: string;
  readonly containerFormat: ContainerFormat;
  readonly startRuntimeFrame: string;
  readonly endRuntimeFrame: string;
  readonly startPts: number;
  readonly endPts: number;
  readonly duration: number;
  readonly packageCount: number;
  readonly segmentCount: number;
  readonly fragmentCount: number;
  readonly initializationCount: number;
  readonly videoPacketCountMetadata: number;
  readonly audioPacketCountMetadata: number;
  readonly estimatedSizeBytes: number;
  readonly reservedSizeBytes: number;
  readonly discontinuityGeneration: number;
  readonly finalized: boolean;
  readonly recoverable: boolean;
  readonly checksum: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface StorageReservationState {
  readonly reservationId: string;
  readonly reservationGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly recordingSessionId: string;
  readonly recordingSessionGeneration: number;
  readonly requestedBytes: number;
  readonly reservedBytes: number;
  readonly consumedBytes: number;
  readonly remainingBytes: number;
  readonly state: ReservationState;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingManifest {
  readonly manifestId: string;
  readonly manifestVersion: string;
  readonly manifestGeneration: number;
  readonly recordingSessionId: string;
  readonly recordingSessionGeneration: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly recordingType: RecordingType;
  readonly outputRole: RecordingOutputRole;
  readonly sessionStartPts: number;
  readonly sessionEndPts: number;
  readonly duration: number;
  readonly partReferences: readonly string[];
  readonly trackSummaries: readonly string[];
  readonly packageCounts: number;
  readonly segmentCounts: number;
  readonly fragmentCounts: number;
  readonly discontinuities: number;
  readonly rolloverCount: number;
  readonly splitCount: number;
  readonly recoveryState: string;
  readonly finalizationState: string;
  readonly estimatedTotalBytes: number;
  readonly checksum: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingIndex {
  readonly indexId: string;
  readonly indexGeneration: number;
  readonly recordingSessionId: string;
  readonly timelineEntries: readonly string[];
  readonly partBoundaries: readonly string[];
  readonly segmentBoundaries: readonly string[];
  readonly sceneChangeMarkers: readonly string[];
  readonly sourceChangeMarkers: readonly string[];
  readonly discontinuityMarkers: readonly string[];
  readonly customMetadataMarkers: readonly string[];
  readonly checksum: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingSidecarMetadataSnapshot {
  readonly sidecarId: string;
  readonly recordingSessionId: string;
  readonly schemaVersion: string;
  readonly kind: string;
  readonly summary: RecordingSafeMetadata;
  readonly checksum: string;
}
export interface RecordedMediaArtifact {
  readonly artifactId: string;
  readonly artifactGeneration: number;
  readonly recordingSessionId: string;
  readonly recordingSessionGeneration: number;
  readonly partId: string;
  readonly partGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly recordingType: RecordingType;
  readonly outputRole: RecordingOutputRole;
  readonly containerFormat: ContainerFormat;
  readonly syntheticFilenameReference: string;
  readonly startPts: number;
  readonly endPts: number;
  readonly duration: number;
  readonly packageCount: number;
  readonly estimatedSizeBytes: number;
  readonly finalized: boolean;
  readonly recoverable: boolean;
  readonly complete: boolean;
  readonly aborted: boolean;
  readonly checksum: string;
  readonly syntheticPayloadReference: string;
  readonly ownership: ArtifactOwnership;
  readonly backendId: string;
  readonly realPersistence: false;
  readonly realFileOutput: false;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordedArtifactLease {
  readonly leaseId: string;
  readonly artifactId: string;
  readonly artifactGeneration: number;
  readonly owner: ArtifactOwnership;
  readonly acquiredSequence: number;
  readonly released: boolean;
  readonly releaseReason?: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingRecoveryState {
  readonly recoveryId: string;
  readonly recoveryGeneration: number;
  readonly recordingSessionId: string;
  readonly recordingSessionGeneration: number;
  readonly affectedPartId?: string;
  readonly affectedPartGeneration?: number;
  readonly recoveryReason:
    | 'CRASH_METADATA'
    | 'PROCESS_INTERRUPTION'
    | 'STORAGE_PRESSURE'
    | 'BACKEND_FAILURE'
    | 'FINALIZATION_FAILURE'
    | 'DISCONTINUITY'
    | 'STALE_COMPLETION'
    | 'CUSTOM';
  readonly lastValidPackageId?: string;
  readonly lastValidPts?: number;
  readonly manifestGeneration: number;
  readonly indexGeneration: number;
  readonly recoverable: boolean;
  readonly recoveryAction:
    | 'FINALIZE_LAST_VALID_PART'
    | 'MARK_INCOMPLETE'
    | 'REBUILD_MANIFEST_METADATA'
    | 'REBUILD_INDEX_METADATA'
    | 'START_NEW_PART'
    | 'ABORT_SESSION'
    | 'REQUEST_OPERATOR_INTERVENTION'
    | 'CUSTOM';
  readonly recoveryStatus: string;
  readonly warnings: readonly string[];
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingQueueSnapshot {
  readonly queueId: string;
  readonly recordingSessionId: string;
  readonly kind: 'INPUT' | 'ARTIFACT';
  readonly depth: number;
  readonly queuedBytes: number;
  readonly highWaterDepth: number;
  readonly highWaterBytes: number;
  readonly maxDepth: number;
  readonly maxBytes: number;
  readonly overflowPolicy: string;
}
export type RecordingInputQueueSnapshot = RecordingQueueSnapshot;
export type RecordingArtifactQueueSnapshot = RecordingQueueSnapshot;
export interface RecordingBackpressureSnapshot {
  readonly recordingSessionId: string;
  readonly state: BackpressureState;
  readonly packageQueueDepth: number;
  readonly artifactQueueDepth: number;
  readonly queuedBytes: number;
  readonly retainedBytes: number;
  readonly pendingFinalizationBytes: number;
  readonly estimatedLatency: number;
  readonly blockedRequestCount: number;
  readonly droppedPackageCount: number;
  readonly droppedArtifactCount: number;
  readonly highWaterMark: number;
}
export interface RecordingLifecycleSnapshot {
  readonly id: string;
  readonly recordingSessionId: string;
  readonly generation: number;
  readonly state: string;
  readonly action: string;
  readonly safeMetadata: RecordingSafeMetadata;
}
export type RecordingRolloverSnapshot = RecordingLifecycleSnapshot;
export type RecordingSplitSnapshot = RecordingLifecycleSnapshot;
export type RecordingPauseResumeSnapshot = RecordingLifecycleSnapshot;
export type RecordingFinalizationSnapshot = RecordingLifecycleSnapshot;
export type RecordingAbortSnapshot = RecordingLifecycleSnapshot;
export interface RecordingConfigurationTransactionSnapshot {
  readonly transactionId: string;
  readonly generation: number;
  readonly state: 'OPEN' | 'COMMITTED' | 'ABORTED';
  readonly affectedIds: readonly string[];
}
export interface RecordingBackendCapabilities {
  readonly destinationTypes: readonly DestinationType[];
  readonly recordingTypes: readonly RecordingType[];
  readonly supportedContainers: readonly ContainerFormat[];
  readonly multitrackSupport: boolean;
  readonly isoSupport: boolean;
  readonly rolloverSupport: boolean;
  readonly pauseResumeSupport: boolean;
  readonly recoverySupport: boolean;
  readonly sidecarSupport: boolean;
  readonly atomicFinalizationSupport: boolean;
  readonly realPersistence: boolean;
  readonly realFileOutput: boolean;
  readonly deterministicBehavior: boolean;
  readonly maximumSessions: number;
  readonly maximumParts: number;
  readonly queueMemoryLimits: RecordingSafeMetadata;
  readonly safeMetadata: RecordingSafeMetadata;
}
export interface RecordingBackendSnapshot {
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly displayName: string;
  readonly capabilities: RecordingBackendCapabilities;
  readonly healthy: boolean;
}
export interface RecordingBackend {
  readonly descriptor: Readonly<{
    backendId: string;
    backendGeneration: number;
    displayName: string;
  }>;
  readonly capabilities: RecordingBackendCapabilities;
  initializeSession(session: RecordingSessionDefinition): void;
  createPlan(
    request: RecordingWriteRequest,
    profile: RecordingProfile,
    destination: RecordingDestinationDefinition,
    part: RecordingPartState,
  ): RecordingWritePlan;
  createPart(
    session: RecordingSessionDefinition,
    profile: RecordingProfile,
    destination: RecordingDestinationDefinition,
    sequence: number,
    tick: FrameTick,
  ): RecordingPartState;
  finalizePart(
    part: RecordingPartState,
    session: RecordingSessionDefinition,
    destination: RecordingDestinationDefinition,
  ): RecordedMediaArtifact;
  pauseSession(id: string): void;
  resumeSession(id: string): void;
  rollover(id: string): void;
  drain(id: string): void;
  finalizeSession(id: string): void;
  abortSession(id: string): void;
  recoverSession(id: string): RecordingRecoveryState;
  reset(): void;
  reconfigure(): void;
  shutdownSession(id: string): void;
  shutdown(): void;
}
export type RecordingFilenamePolicySnapshot = RecordingFilenamePolicy;
export type RecordingProfileSnapshot = Omit<RecordingProfile, 'createdAtNs' | 'updatedAtNs'> & {
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
};
export type RecordingDestinationSnapshot = Omit<
  RecordingDestinationDefinition,
  'createdAtNs' | 'updatedAtNs'
> & { readonly createdAtNs: string; readonly updatedAtNs: string };
export type RecordingSessionDefinitionSnapshot = Omit<
  RecordingSessionDefinition,
  'createdAtNs' | 'updatedAtNs'
> & { readonly createdAtNs: string; readonly updatedAtNs: string };
export interface RecordingSessionStateSnapshot {
  readonly recordingSessionId: string;
  readonly sessionGeneration: number;
  readonly state: RecordingSessionState;
  readonly activePartId: string | undefined;
  readonly activePartSequence?: number;
}
export type RecordingSourceBindingSnapshot = RecordingSourceBinding;
export type RecordingPackageInputSnapshot = RecordingPackageInput;
export type RecordingWriteRequestSnapshot = RecordingWriteRequest;
export type RecordingWritePlanSnapshot = RecordingWritePlan;
export type RecordingPartSnapshot = RecordingPartState;
export type StorageReservationSnapshot = StorageReservationState;
export type RecordingManifestSnapshot = RecordingManifest;
export type RecordingIndexSnapshot = RecordingIndex;
export type RecordedMediaArtifactSnapshot = RecordedMediaArtifact;
export type RecordedArtifactLeaseSnapshot = RecordedArtifactLease;
export type RecordingRecoverySnapshot = RecordingRecoveryState;
export interface RecordingStoragePressureSnapshot {
  readonly destinationId: string;
  readonly state: StoragePressureState;
  readonly availableBytes: number;
  readonly reservedBytes: number;
  readonly consumedBytes: number;
  readonly estimatedRemainingDuration: number;
  readonly activeRecordingCount: number;
  readonly queueBytes: number;
  readonly pendingFinalizationBytes: number;
  readonly warningThreshold: number;
  readonly criticalThreshold: number;
}
export interface RecordingHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly activeBackendIds: readonly string[];
  readonly registeredProfileCount: number;
  readonly registeredDestinationCount: number;
  readonly registeredSessionCount: number;
  readonly activeSessionCount: number;
  readonly recordingSessionCount: number;
  readonly pausedSessionCount: number;
  readonly finalizingSessionCount: number;
  readonly finalizedSessionCount: number;
  readonly failedSessionCount: number;
  readonly abortedSessionCount: number;
  readonly recoverableSessionCount: number;
  readonly programRecordingSessionId?: string;
  readonly activeProgramPartId?: string;
  readonly submittedPackageCount: number;
  readonly consumedPackageCount: number;
  readonly droppedPackageCount: number;
  readonly partCount: number;
  readonly finalizedPartCount: number;
  readonly artifactCount: number;
  readonly manifestUpdateCount: number;
  readonly indexUpdateCount: number;
  readonly rolloverCount: number;
  readonly splitCount: number;
  readonly pauseCount: number;
  readonly resumeCount: number;
  readonly recoveryCount: number;
  readonly finalizationFailureCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateSubmissionCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly packageIncompatibilityCount: number;
  readonly storageReservationFailureCount: number;
  readonly quotaExceededCount: number;
  readonly storagePressureState: StoragePressureState;
  readonly inputQueueBytes: number;
  readonly artifactQueueBytes: number;
  readonly retainedPackageBytes: number;
  readonly pendingFinalizationBytes: number;
  readonly peakRetainedBytes: number;
  readonly estimatedRecordedBytes: number;
  readonly estimatedAvailableBytes: number;
  readonly lastRecordedPts?: number;
  readonly lastSuccessfulArtifact?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface RecordingTelemetrySnapshot {
  readonly backendRegistrations: number;
  readonly backendRemovals: number;
  readonly profileRegistrations: number;
  readonly profileUpdates: number;
  readonly profileRemovals: number;
  readonly destinationRegistrations: number;
  readonly destinationUpdates: number;
  readonly destinationRemovals: number;
  readonly sessionCreates: number;
  readonly sessionStarts: number;
  readonly sessionPauses: number;
  readonly sessionResumes: number;
  readonly sessionStops: number;
  readonly sessionAborts: number;
  readonly sessionFinalizations: number;
  readonly sessionRecoveries: number;
  readonly sessionFailures: number;
  readonly sourceBindings: number;
  readonly sourceUnbindings: number;
  readonly packageSubmissions: number;
  readonly packageConsumptions: number;
  readonly packageDrops: number;
  readonly plansCreated: number;
  readonly planCacheHits: number;
  readonly planCacheMisses: number;
  readonly partCreations: number;
  readonly partFinalizations: number;
  readonly rollovers: number;
  readonly splits: number;
  readonly manifestUpdates: number;
  readonly manifestFinalizations: number;
  readonly indexUpdates: number;
  readonly markerAdditions: number;
  readonly artifactCreations: number;
  readonly artifactDrops: number;
  readonly artifactReleases: number;
  readonly storageReservations: number;
  readonly storageReservationReleases: number;
  readonly storageReservationFailures: number;
  readonly storagePressureTransitions: number;
  readonly quotaWarnings: number;
  readonly quotaExceeds: number;
  readonly drains: number;
  readonly finalizations: number;
  readonly aborts: number;
  readonly recoveries: number;
  readonly queueHighWaterMarks: number;
  readonly backpressureTransitions: number;
  readonly duplicateRequests: number;
  readonly duplicateSubmissions: number;
  readonly staleGenerations: number;
  readonly incompatiblePackageRejects: number;
  readonly backendFailures: number;
  readonly timeouts: number;
  readonly allocationFailures: number;
  readonly ownershipViolations: number;
  readonly estimatedRecordingBytes: number;
  readonly averagePartDuration: number;
  readonly maximumPartDuration: number;
  readonly averagePartSize: number;
  readonly maximumPartSize: number;
  readonly averageQueueDepth: number;
  readonly maximumQueueDepth: number;
  readonly currentRequestIds: readonly string[];
  readonly activeSessionIds: readonly string[];
  readonly lastRecordingEvent: string;
  readonly healthSummary: string;
}
export interface RecordingWatchdogIncidentSnapshot {
  readonly incidentId: string;
  readonly type: RecordingWatchdogIncidentType;
  readonly severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  readonly safeRecovery: readonly string[];
  readonly message: string;
  readonly atNs: string;
}
export interface RecordingSourceGraphSessionSnapshot {
  readonly recordingSessionId: string;
  readonly recordingType: RecordingType;
  readonly outputRole: RecordingOutputRole;
  readonly profileId: string;
  readonly destinationType: DestinationType;
  readonly storageClass: StorageClass;
  readonly sessionState: RecordingSessionState;
  readonly activePartId: string | undefined;
  readonly activePartSequence?: number;
  readonly packageCount: number;
  readonly duration: number;
  readonly estimatedBytes: number;
  readonly rolloverCount: number;
  readonly splitCount: number;
  readonly manifestGeneration: number;
  readonly indexGeneration: number;
  readonly artifactReady: boolean;
  readonly recoveryState: string;
  readonly futureArchiveReplayEligibility: boolean;
  readonly health: string;
  readonly routingEligibility: boolean;
}
export interface RecordingSourceGraphSnapshot {
  readonly recordingSessions: readonly RecordingSourceGraphSessionSnapshot[];
  readonly storagePressureState: StoragePressureState;
  readonly health: string;
  readonly routingEligibility: boolean;
  readonly containsMediaPayloads: false;
  readonly containsPathsUrlsCredentialsOrHandles: false;
}
export interface RecordingValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedAtNs: string;
}
export interface RecordingEngineSnapshot {
  readonly profiles: readonly RecordingProfileSnapshot[];
  readonly destinations: readonly RecordingDestinationSnapshot[];
  readonly sessions: readonly RecordingSessionDefinitionSnapshot[];
  readonly sessionStates: readonly RecordingSessionStateSnapshot[];
  readonly bindings: readonly RecordingSourceBindingSnapshot[];
  readonly requests: readonly RecordingWriteRequestSnapshot[];
  readonly plans: readonly RecordingWritePlanSnapshot[];
  readonly parts: readonly RecordingPartSnapshot[];
  readonly manifests: readonly RecordingManifestSnapshot[];
  readonly indexes: readonly RecordingIndexSnapshot[];
  readonly sidecars: readonly RecordingSidecarMetadataSnapshot[];
  readonly artifacts: readonly RecordedMediaArtifactSnapshot[];
  readonly leases: readonly RecordedArtifactLeaseSnapshot[];
  readonly reservations: readonly StorageReservationSnapshot[];
  readonly inputQueues: readonly RecordingInputQueueSnapshot[];
  readonly artifactQueues: readonly RecordingArtifactQueueSnapshot[];
  readonly backpressure: readonly RecordingBackpressureSnapshot[];
  readonly rollovers: readonly RecordingRolloverSnapshot[];
  readonly splits: readonly RecordingSplitSnapshot[];
  readonly pauseResume: readonly RecordingPauseResumeSnapshot[];
  readonly finalizations: readonly RecordingFinalizationSnapshot[];
  readonly aborts: readonly RecordingAbortSnapshot[];
  readonly recoveries: readonly RecordingRecoverySnapshot[];
  readonly transactions: readonly RecordingConfigurationTransactionSnapshot[];
  readonly backend: RecordingBackendSnapshot;
  readonly health: RecordingHealthSnapshot;
  readonly telemetry: RecordingTelemetrySnapshot;
  readonly watchdog: readonly RecordingWatchdogIncidentSnapshot[];
  readonly sourceGraph: RecordingSourceGraphSnapshot;
  readonly validation: RecordingValidationReport;
  readonly containsMediaPayloads: false;
  readonly containsFileHandles: false;
  readonly containsNativeHandles: false;
}

const order = [
  'validate recording session',
  'validate profile and destination',
  'validate package generation',
  'validate package compatibility',
  'validate package finalization/readiness',
  'validate storage metadata',
  'reserve synthetic capacity',
  'resolve active recording part',
  'evaluate rollover/split policy',
  'update manifest/index plan',
  'reserve artifact ownership',
  'invoke recording backend',
  'validate synthetic artifact',
  'update session/part state',
  'transfer package ownership',
  'release temporary resources',
] as const;
const recoveryActions = [
  'reject invalid package',
  'preserve prior finalized parts',
  'stop optional ISO/Preview recording',
  'preserve Program recording',
  'finalize current valid part',
  'start deterministic new part',
  'release invalid package ownership',
  'mark incomplete artifact',
  'create recovery metadata',
  'drain session',
  'abort session under explicit policy',
  'clear invalid plan cache',
  'mark recorder degraded',
  'request operator intervention',
] as const;
const redaction =
  /(\/[^\s]+|https?:\/\/[^\s]+|s3:\/\/[^\s]+|[A-Za-z]:\\[^\s]+|token=[^\s]+|key=[^\s]+|secret=[^\s]+|credential[^\s]*)/gi;
const terminal = new Set<RecordingSessionState>([
  'FINALIZED',
  'ABORTED',
  'FAILED',
  'DESTROYED',
  'SHUTDOWN',
]);
const f = <T>(v: T): Readonly<T> => Object.freeze(v);
const ns = () => BigInt(Date.now()) * 1_000_000n;
const redact = (s: string) => s.replace(redaction, '[REDACTED]').slice(0, 256);
const token = (s: string) =>
  redact(s)
    .replace(/[^A-Za-z0-9._:-]/g, '_')
    .slice(0, 96);
const sig = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return `synthetic:${h.toString(16).padStart(8, '0')}`;
};
const sanitizeMetadata = (m: Readonly<Record<string, unknown>> = {}): RecordingSafeMetadata => {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(m).slice(0, 32)) {
    const key = token(k);
    if (/path|url|token|credential|secret|handle|endpoint|bucket|payload/i.test(key)) continue;
    if (typeof v === 'string') out[key] = redact(v);
    else if (typeof v === 'number') out[key] = Number.isFinite(v) ? v : 0;
    else if (typeof v === 'boolean' || v === null) out[key] = v;
    else out[key] = redact(JSON.stringify(v));
  }
  return f(out) as RecordingSafeMetadata;
};
const fakeTick = (n = 0n): FrameTick =>
  f({
    frameNumber: n,
    startedAtNs: n * 33333333n,
    deadlineAtNs: n * 33333333n + 33333333n,
    scheduledTimeNs: n * 33333333n,
    actualTimeNs: n * 33333333n,
    presentationTimeNs: n * 33333333n,
    frameDurationNs: 33333333n,
    driftNs: 0n,
    latenessNs: 0n,
    late: false,
    missedFrames: 0n,
    discontinuity: false,
  });
const thresholdOk = (p: { readonly threshold?: number }) =>
  p.threshold === undefined || (Number.isFinite(p.threshold) && p.threshold > 0);
const profileSnap = (p: RecordingProfile): RecordingProfileSnapshot =>
  f({ ...p, createdAtNs: p.createdAtNs.toString(), updatedAtNs: p.updatedAtNs.toString() });
const destinationSnap = (d: RecordingDestinationDefinition): RecordingDestinationSnapshot =>
  f({ ...d, createdAtNs: d.createdAtNs.toString(), updatedAtNs: d.updatedAtNs.toString() });
const sessionSnap = (s: RecordingSessionDefinition): RecordingSessionDefinitionSnapshot =>
  f({ ...s, createdAtNs: s.createdAtNs.toString(), updatedAtNs: s.updatedAtNs.toString() });
interface RuntimeState {
  readonly state: RecordingSessionState;
  readonly activePartId: string | undefined;
  readonly finalized: boolean;
  readonly aborted: boolean;
  readonly recovered: boolean;
  readonly starts: number;
  readonly finalizations: number;
  readonly aborts: number;
  readonly recoveries: number;
}
interface QueueState {
  readonly depth: number;
  readonly bytes: number;
  readonly highWaterDepth: number;
  readonly highWaterBytes: number;
  readonly maxDepth: number;
  readonly maxBytes: number;
  readonly overflowPolicy: string;
}
const emptyTelemetry = (): RecordingTelemetrySnapshot =>
  f({
    backendRegistrations: 1,
    backendRemovals: 0,
    profileRegistrations: 0,
    profileUpdates: 0,
    profileRemovals: 0,
    destinationRegistrations: 0,
    destinationUpdates: 0,
    destinationRemovals: 0,
    sessionCreates: 0,
    sessionStarts: 0,
    sessionPauses: 0,
    sessionResumes: 0,
    sessionStops: 0,
    sessionAborts: 0,
    sessionFinalizations: 0,
    sessionRecoveries: 0,
    sessionFailures: 0,
    sourceBindings: 0,
    sourceUnbindings: 0,
    packageSubmissions: 0,
    packageConsumptions: 0,
    packageDrops: 0,
    plansCreated: 0,
    planCacheHits: 0,
    planCacheMisses: 0,
    partCreations: 0,
    partFinalizations: 0,
    rollovers: 0,
    splits: 0,
    manifestUpdates: 0,
    manifestFinalizations: 0,
    indexUpdates: 0,
    markerAdditions: 0,
    artifactCreations: 0,
    artifactDrops: 0,
    artifactReleases: 0,
    storageReservations: 0,
    storageReservationReleases: 0,
    storageReservationFailures: 0,
    storagePressureTransitions: 0,
    quotaWarnings: 0,
    quotaExceeds: 0,
    drains: 0,
    finalizations: 0,
    aborts: 0,
    recoveries: 0,
    queueHighWaterMarks: 0,
    backpressureTransitions: 0,
    duplicateRequests: 0,
    duplicateSubmissions: 0,
    staleGenerations: 0,
    incompatiblePackageRejects: 0,
    backendFailures: 0,
    timeouts: 0,
    allocationFailures: 0,
    ownershipViolations: 0,
    estimatedRecordingBytes: 0,
    averagePartDuration: 0,
    maximumPartDuration: 0,
    averagePartSize: 0,
    maximumPartSize: 0,
    averageQueueDepth: 0,
    maximumQueueDepth: 0,
    currentRequestIds: [],
    activeSessionIds: [],
    lastRecordingEvent: 'RecordingEngineCreated',
    healthSummary: 'HEALTHY',
  });
export class SyntheticRecordingBackend implements RecordingBackend {
  readonly descriptor = f({
    backendId: 'recording-backend:synthetic-memory',
    backendGeneration: 1,
    displayName: 'Synthetic memory recording reference backend',
  });
  readonly capabilities: RecordingBackendCapabilities = f({
    destinationTypes: ['SYNTHETIC_MEMORY_REFERENCE'],
    recordingTypes: [
      'PROGRAM',
      'PREVIEW_METADATA',
      'CLEAN_FEED',
      'AUXILIARY',
      'ISO_VIDEO',
      'ISO_AUDIO',
      'ISO_AUDIO_VIDEO',
      'MULTITRACK',
      'PROXY_METADATA',
      'ARCHIVE_FOUNDATION',
      'CUSTOM_TYPED',
    ],
    supportedContainers: [
      'MP4_METADATA',
      'MPEG_TS_METADATA',
      'MATROSKA_METADATA',
      'WEBM_METADATA',
      'FRAGMENTED_MP4_METADATA',
      'CUSTOM_METADATA',
    ],
    multitrackSupport: true,
    isoSupport: true,
    rolloverSupport: true,
    pauseResumeSupport: true,
    recoverySupport: true,
    sidecarSupport: true,
    atomicFinalizationSupport: true,
    realPersistence: false,
    realFileOutput: false,
    deterministicBehavior: true,
    maximumSessions: LIMIT.sessions,
    maximumParts: LIMIT.partsPerSession,
    queueMemoryLimits: {
      packages: LIMIT.submissions,
      artifacts: LIMIT.artifacts,
      bytes: 512 * 1024 * 1024,
    },
    safeMetadata: { noDiskIo: true, noPayloadBytes: true, noNativeHandles: true },
  });
  initializeSession() {}
  pauseSession() {}
  resumeSession() {}
  rollover() {}
  drain() {}
  finalizeSession() {}
  abortSession() {}
  reset() {}
  reconfigure() {}
  shutdownSession() {}
  shutdown() {}
  createPart(
    s: RecordingSessionDefinition,
    p: RecordingProfile,
    _d: RecordingDestinationDefinition,
    seq: number,
    tick: FrameTick,
  ): RecordingPartState {
    const id = `recording-part:${token(s.recordingSessionId)}:${seq.toString().padStart(6, '0')}`;
    const ext = p.expectedContainerFormat
      .toLowerCase()
      .replace('_metadata', '')
      .replace('fragmented_', 'f');
    return f({
      partId: id,
      partVersion: RECORDING_ENGINE_VERSION,
      partGeneration: 1,
      recordingSessionId: s.recordingSessionId,
      recordingSessionGeneration: s.sessionGeneration,
      partSequence: seq,
      syntheticFilenameReference: `${token(p.profileId)}_${token(s.outputRole)}_${seq.toString().padStart(6, '0')}.${ext}.synthetic`,
      containerFormat: p.expectedContainerFormat,
      startRuntimeFrame: tick.frameNumber.toString(),
      endRuntimeFrame: tick.frameNumber.toString(),
      startPts: 0,
      endPts: 0,
      duration: 0,
      packageCount: 0,
      segmentCount: 0,
      fragmentCount: 0,
      initializationCount: 0,
      videoPacketCountMetadata: 0,
      audioPacketCountMetadata: 0,
      estimatedSizeBytes: 0,
      reservedSizeBytes: 0,
      discontinuityGeneration: 0,
      finalized: false,
      recoverable: true,
      checksum: sig(id),
      safeMetadata: { synthetic: true, realFileOutput: false },
    });
  }
  createPlan(
    r: RecordingWriteRequest,
    p: RecordingProfile,
    d: RecordingDestinationDefinition,
    part: RecordingPartState,
  ): RecordingWritePlan {
    const rollover = decideRollover(p.rolloverPolicy, part, r.packageInput);
    return f({
      planId: `recording-plan:${sig(`${r.requestId}:${part.partId}:${p.profileGeneration}:${d.destinationGeneration}`)}`,
      requestId: r.requestId,
      recordingSessionId: r.recordingSessionId,
      recordingSessionGeneration: r.expectedRecordingSessionGeneration,
      profileId: p.profileId,
      profileGeneration: p.profileGeneration,
      destinationId: d.destinationId,
      destinationGeneration: d.destinationGeneration,
      backendId: this.descriptor.backendId,
      backendGeneration: this.descriptor.backendGeneration,
      packageInputSummary: sanitizeMetadata({
        submissionId: r.packageInput.submissionId,
        packageOutputId: r.packageInput.packageOutputId,
        duration: r.packageInput.duration,
        estimatedSizeBytes: r.packageInput.estimatedSizeBytes,
      }),
      activePartId: part.partId,
      activePartGeneration: part.partGeneration,
      filenameTemplateResolutionMetadata: part.syntheticFilenameReference,
      collisionAction: p.filenamePolicy.collisionPolicy,
      storageReservationAction: 'SYNTHETIC_RESERVE_ONLY',
      rolloverDecision: rollover,
      splitDecision: decideSplit(p.splitPolicy, r.packageInput),
      manifestAction: 'UPDATE_METADATA',
      sidecarAction: 'UPDATE_METADATA_ONLY',
      recoveryAction: 'TRACK_LAST_VALID_PACKAGE',
      ownershipAction: 'BORROW_OR_TRANSFER_EXACT_ONCE',
      operationOrder: order,
      estimatedWriteBytes: r.packageInput.estimatedSizeBytes,
      retainedByteEstimate: part.estimatedSizeBytes + r.packageInput.estimatedSizeBytes,
      deterministicScore: sig(r.requestId)
        .split('')
        .reduce((a, c) => a + c.charCodeAt(0), 0),
      warnings:
        d.destinationType === 'SYNTHETIC_MEMORY_REFERENCE'
          ? []
          : ['destination is metadata-only and not executable in v5.6.8'],
      safeMetadata: { synthetic: true, noFileOutput: true },
    });
  }
  finalizePart(
    part: RecordingPartState,
    s: RecordingSessionDefinition,
    d: RecordingDestinationDefinition,
  ): RecordedMediaArtifact {
    return f({
      artifactId: `recording-artifact:${sig(`${part.partId}:final:${s.recordingType}:${s.outputRole}`)}`,
      artifactGeneration: 1,
      recordingSessionId: s.recordingSessionId,
      recordingSessionGeneration: s.sessionGeneration,
      partId: part.partId,
      partGeneration: part.partGeneration,
      destinationId: d.destinationId,
      destinationGeneration: d.destinationGeneration,
      recordingType: s.recordingType,
      outputRole: s.outputRole,
      containerFormat: part.containerFormat,
      syntheticFilenameReference: part.syntheticFilenameReference,
      startPts: part.startPts,
      endPts: part.endPts,
      duration: part.duration,
      packageCount: part.packageCount,
      estimatedSizeBytes: part.estimatedSizeBytes,
      finalized: true,
      recoverable: true,
      complete: true,
      aborted: false,
      checksum: sig(`${part.checksum}:artifact:${part.packageCount}:${part.estimatedSizeBytes}`),
      syntheticPayloadReference: `synthetic-payload:${sig(part.partId)}`,
      ownership: 'RECORDER_OWNED',
      backendId: this.descriptor.backendId,
      realPersistence: false,
      realFileOutput: false,
      safeMetadata: { synthetic: true, noFileBytes: true, noFileHandle: true },
    });
  }
  recoverSession(id: string): RecordingRecoveryState {
    return f({
      recoveryId: `recording-recovery:${sig(id)}`,
      recoveryGeneration: 1,
      recordingSessionId: id,
      recordingSessionGeneration: 1,
      recoveryReason: 'CRASH_METADATA',
      manifestGeneration: 0,
      indexGeneration: 0,
      recoverable: true,
      recoveryAction: 'REBUILD_MANIFEST_METADATA',
      recoveryStatus: 'METADATA_ONLY_READY',
      warnings: ['synthetic backend performs no file repair'],
      safeMetadata: { synthetic: true },
    });
  }
}
const decideRollover = (
  p: Readonly<{ type: RolloverPolicyType; threshold?: number }>,
  part: RecordingPartState,
  input: RecordingPackageInputSnapshot,
) => {
  const t = p.threshold ?? Number.POSITIVE_INFINITY;
  if (p.type === 'PACKAGE_COUNT' && part.packageCount + 1 >= t) return 'ROLLOVER_AFTER_PACKAGE';
  if (
    (p.type === 'FIXED_SIZE' || p.type === 'MAXIMUM_SIZE') &&
    part.estimatedSizeBytes + input.estimatedSizeBytes >= t
  )
    return 'ROLLOVER_AFTER_PACKAGE';
  if (
    (p.type === 'FIXED_DURATION' || p.type === 'MAXIMUM_DURATION') &&
    part.duration + input.duration >= t
  )
    return 'ROLLOVER_AFTER_PACKAGE';
  if (p.type === 'SEGMENT_COUNT' && part.segmentCount + (input.segmentId ? 1 : 0) >= t)
    return 'ROLLOVER_AFTER_PACKAGE';
  if (p.type === 'DISCONTINUITY' && input.discontinuityGeneration > part.discontinuityGeneration)
    return 'ROLLOVER_AFTER_PACKAGE';
  return p.type === 'MANUAL' ? 'MANUAL_ONLY' : 'KEEP_CURRENT_PART';
};
const decideSplit = (
  p: Readonly<{ type: SplitPolicyType; threshold?: number }>,
  input: RecordingPackageInputSnapshot,
) =>
  p.type === 'NEVER'
    ? 'NO_SPLIT'
    : p.type === 'ON_DISCONTINUITY' && input.discontinuityGeneration > 0
      ? 'SPLIT_AFTER_PACKAGE'
      : p.type === 'ON_MARKER'
        ? 'MARKER_METADATA_ONLY'
        : 'METADATA_EVALUATED';

export class RecordingEngine {
  private backend: RecordingBackend = new SyntheticRecordingBackend();
  private profiles = new Map<string, RecordingProfile>();
  private destinations = new Map<string, RecordingDestinationDefinition>();
  private sessions = new Map<string, RecordingSessionDefinition>();
  private states = new Map<string, RuntimeState>();
  private bindings = new Map<string, RecordingSourceBinding>();
  private requests = new Map<string, RecordingWriteRequest>();
  private submissions = new Set<string>();
  private consumed = new Set<string>();
  private parts = new Map<string, RecordingPartState>();
  private partsBySession = new Map<string, string[]>();
  private plans = new Map<string, RecordingWritePlan>();
  private manifests = new Map<string, RecordingManifest>();
  private indexes = new Map<string, RecordingIndex>();
  private sidecars = new Map<string, RecordingSidecarMetadataSnapshot>();
  private artifacts = new Map<string, RecordedMediaArtifact>();
  private artifactByPart = new Map<string, string>();
  private leases = new Map<string, RecordedArtifactLease>();
  private reservations = new Map<string, StorageReservationState>();
  private recoveries = new Map<string, RecordingRecoveryState>();
  private inputQueues = new Map<string, QueueState>();
  private artifactQueues = new Map<string, QueueState>();
  private backpressure = new Map<string, RecordingBackpressureSnapshot>();
  private rollovers: RecordingRolloverSnapshot[] = [];
  private splits: RecordingSplitSnapshot[] = [];
  private pauseResume: RecordingPauseResumeSnapshot[] = [];
  private finalizations: RecordingFinalizationSnapshot[] = [];
  private aborts: RecordingAbortSnapshot[] = [];
  private transactions: RecordingConfigurationTransactionSnapshot[] = [];
  private watchdog: RecordingWatchdogIncidentSnapshot[] = [];
  private telemetry: RecordingTelemetrySnapshot = emptyTelemetry();
  private pressure: StoragePressureState = 'NORMAL';
  private shutdownFlag = false;
  private lastFailure: string | undefined;
  registerBackend(b: RecordingBackend) {
    this.open();
    if (b.descriptor.backendId === this.backend.descriptor.backendId) {
      this.incident('RECORDING_BACKEND_FAILED', 'ERROR', 'duplicate backend rejected');
      throw new RecordingEngineError('DuplicateRecordingBackend', 'duplicate backend');
    }
    if (
      !b.capabilities.deterministicBehavior ||
      b.capabilities.realFileOutput ||
      b.capabilities.realPersistence
    )
      throw new RecordingEngineError(
        'RecordingBackendFailed',
        'only deterministic non-persistent backends accepted',
      );
    this.backend = b;
    this.bump('backendRegistrations', 'RecordingBackendRegistered');
    return this.backendSnapshot();
  }
  unregisterBackend(id: string) {
    this.open();
    if (id === this.backend.descriptor.backendId)
      throw new RecordingEngineError(
        'RecordingBackendNotFound',
        'built-in backend cannot be removed',
        { backendId: id },
      );
    this.bump('backendRemovals', 'RecordingBackendRemoved');
    return false;
  }
  registerProfile(p: RecordingProfile) {
    this.open();
    if (this.profiles.size >= LIMIT.profiles)
      throw new RecordingEngineError('RecordingAllocationFailed', 'profile registry full');
    if (this.profiles.has(p.profileId))
      throw new RecordingEngineError('DuplicateRecordingProfile', 'duplicate profile', {
        profileId: p.profileId,
      });
    this.validateProfile(p);
    const safe = f({ ...p, safeMetadata: sanitizeMetadata(p.safeMetadata) }) as RecordingProfile;
    this.profiles.set(p.profileId, safe);
    this.bump('profileRegistrations', 'RecordingProfileRegistered');
    return safe;
  }
  updateProfile(p: RecordingProfile, expected: number) {
    this.open();
    const cur = this.mustProfile(p.profileId);
    if (cur.profileGeneration !== expected) {
      this.bump('staleGenerations', 'RecordingProfileUpdated');
      this.incident('RECORDING_PROFILE_GENERATION_STALE', 'ERROR', 'stale profile update');
      throw new RecordingEngineError('RecordingProfileInvalid', 'stale profile generation');
    }
    if (p.profileGeneration !== cur.profileGeneration + 1)
      throw new RecordingEngineError('RecordingProfileInvalid', 'profile generation must increase');
    this.validateProfile(p);
    this.profiles.set(p.profileId, p);
    this.bump('profileUpdates', 'RecordingProfileUpdated');
    return p;
  }
  unregisterProfile(id: string, expected: number) {
    this.open();
    const cur = this.mustProfile(id);
    if (cur.profileGeneration !== expected)
      throw new RecordingEngineError('RecordingProfileInvalid', 'stale profile generation');
    this.profiles.delete(id);
    this.bump('profileRemovals', 'RecordingProfileRemoved');
    return true;
  }
  registerDestination(d: RecordingDestinationDefinition) {
    this.open();
    if (this.destinations.size >= LIMIT.destinations)
      throw new RecordingEngineError('RecordingAllocationFailed', 'destination registry full');
    if (this.destinations.has(d.destinationId))
      throw new RecordingEngineError('DuplicateRecordingDestination', 'duplicate destination', {
        destinationId: d.destinationId,
      });
    this.validateDestination(d);
    const safe = f({
      ...d,
      directoryReferenceMetadata: 'redacted-metadata-reference',
      safeMetadata: sanitizeMetadata(d.safeMetadata),
    }) as RecordingDestinationDefinition;
    this.destinations.set(d.destinationId, safe);
    this.bump('destinationRegistrations', 'RecordingDestinationRegistered');
    this.evaluatePressure(safe);
    return safe;
  }
  updateDestination(d: RecordingDestinationDefinition, expected: number) {
    this.open();
    const cur = this.mustDestination(d.destinationId);
    if (cur.destinationGeneration !== expected) {
      this.bump('staleGenerations', 'RecordingDestinationUpdated');
      this.incident('RECORDING_DESTINATION_GENERATION_STALE', 'ERROR', 'stale destination update');
      throw new RecordingEngineError('RecordingDestinationInvalid', 'stale destination generation');
    }
    if (d.destinationGeneration !== cur.destinationGeneration + 1)
      throw new RecordingEngineError(
        'RecordingDestinationInvalid',
        'destination generation must increase',
      );
    this.validateDestination(d);
    this.destinations.set(d.destinationId, d);
    this.bump('destinationUpdates', 'RecordingDestinationUpdated');
    this.evaluatePressure(d);
    return d;
  }
  unregisterDestination(id: string, expected: number) {
    this.open();
    const cur = this.mustDestination(id);
    if (cur.destinationGeneration !== expected)
      throw new RecordingEngineError('RecordingDestinationInvalid', 'stale destination generation');
    this.destinations.delete(id);
    this.bump('destinationRemovals', 'RecordingDestinationRemoved');
    return true;
  }
  createSession(s: RecordingSessionDefinition) {
    this.open();
    if (this.sessions.size >= LIMIT.sessions)
      throw new RecordingEngineError('RecordingAllocationFailed', 'session registry full');
    if (this.sessions.has(s.recordingSessionId))
      throw new RecordingEngineError('DuplicateRecordingSession', 'duplicate session');
    this.validateSession(s);
    for (const e of this.sessions.values()) {
      const st = this.states.get(e.recordingSessionId)?.state;
      if (
        !s.safeMetadata.parallelRecordingAllowed &&
        e.profileId === s.profileId &&
        e.outputRole === s.outputRole &&
        st !== 'DESTROYED'
      )
        throw new RecordingEngineError(
          'RecordingSessionInvalid',
          'parallel recording requires explicit policy',
        );
    }
    this.sessions.set(s.recordingSessionId, s);
    this.states.set(
      s.recordingSessionId,
      f({
        state: 'READY',
        activePartId: undefined,
        finalized: false,
        aborted: false,
        recovered: false,
        starts: 0,
        finalizations: 0,
        aborts: 0,
        recoveries: 0,
      }),
    );
    this.inputQueues.set(s.recordingSessionId, this.newQueue(s.queuePolicy));
    this.artifactQueues.set(s.recordingSessionId, this.newQueue(s.queuePolicy));
    this.backend.initializeSession(s);
    this.bump('sessionCreates', 'RecordingSessionCreated');
    return s;
  }
  bindSource(b: RecordingSourceBinding) {
    this.open();
    if (this.bindings.has(b.bindingId))
      throw new RecordingEngineError('RecordingSourceBindingInvalid', 'duplicate source binding');
    this.mustSession(b.recordingSessionId);
    if (!b.packageSessionId || b.sourceGeneration <= 0 || b.trackIds.length === 0)
      throw new RecordingEngineError('RecordingSourceBindingInvalid', 'invalid source binding');
    for (const e of this.bindings.values())
      if (
        e.recordingSessionId === b.recordingSessionId &&
        e.packageSessionId === b.packageSessionId &&
        e.enabled &&
        b.enabled
      )
        throw new RecordingEngineError(
          'RecordingSourceBindingInvalid',
          'duplicate writable binding',
        );
    const safe = f({
      ...b,
      sourceId: token(b.sourceId),
      safeMetadata: sanitizeMetadata(b.safeMetadata),
    }) as RecordingSourceBinding;
    this.bindings.set(b.bindingId, safe);
    this.bump('sourceBindings', 'RecordingSourceBound');
    return safe;
  }
  unbindSource(id: string, expected: number) {
    this.open();
    const b = this.bindings.get(id);
    if (!b) throw new RecordingEngineError('RecordingSourceBindingInvalid', 'binding not found');
    if (b.bindingGeneration !== expected)
      throw new RecordingEngineError('RecordingSourceBindingInvalid', 'stale binding generation');
    this.bindings.delete(id);
    this.bump('sourceUnbindings', 'RecordingSourceUnbound');
    return true;
  }
  start(id: string, tick = fakeTick()) {
    this.open();
    const s = this.mustSession(id),
      r = this.mustRuntime(id);
    if (!['READY', 'CREATED', 'RECOVERED'].includes(r.state))
      throw new RecordingEngineError(
        'RecordingSessionStateInvalid',
        `cannot start from ${r.state}`,
      );
    const p = this.mustProfile(s.profileId),
      d = this.mustDestination(s.destinationId),
      part = this.createPart(s, p, d, tick);
    this.states.set(
      id,
      f({ ...r, state: 'RECORDING', activePartId: part.partId, starts: r.starts + 1 }),
    );
    this.bump('sessionStarts', 'RecordingSessionStarted');
    this.updateManifestIndex(s, p, d, 'OPEN');
    return part;
  }
  pause(id: string) {
    this.open();
    const r = this.mustRuntime(id);
    if (r.state !== 'RECORDING')
      throw new RecordingEngineError('RecordingSessionStateInvalid', 'pause requires RECORDING');
    this.states.set(id, f({ ...r, state: 'PAUSED' }));
    this.pauseResume = this.life(
      this.pauseResume,
      id,
      'PAUSED',
      'pause',
    ) as RecordingPauseResumeSnapshot[];
    this.bump('sessionPauses', 'RecordingSessionPaused');
  }
  resume(id: string, tick = fakeTick()) {
    this.open();
    const s = this.mustSession(id),
      r = this.mustRuntime(id);
    if (r.state !== 'PAUSED')
      throw new RecordingEngineError('RecordingSessionStateInvalid', 'resume requires PAUSED');
    let activePartId = r.activePartId;
    if (s.pausePolicy === 'START_NEW_PART_ON_RESUME')
      activePartId = this.createPart(
        s,
        this.mustProfile(s.profileId),
        this.mustDestination(s.destinationId),
        tick,
      ).partId;
    this.states.set(id, f({ ...r, state: 'RECORDING', activePartId }));
    this.pauseResume = this.life(
      this.pauseResume,
      id,
      'RECORDING',
      'resume',
    ) as RecordingPauseResumeSnapshot[];
    this.bump('sessionResumes', 'RecordingSessionResumed');
  }
  submitPackage(input: RecordingPackageInput, tick = fakeTick()): RecordingWritePlan {
    this.open();
    if (this.submissions.has(input.submissionId)) {
      this.bump('duplicateSubmissions', 'RecordingPackageSubmitted');
      this.incident('RECORDING_DUPLICATE_SUBMISSION', 'ERROR', 'duplicate submission');
      throw new RecordingEngineError(
        'RecordingDuplicateSubmission',
        'duplicate package submission',
      );
    }
    const s = this.mustSession(input.recordingSessionId),
      r = this.mustRuntime(input.recordingSessionId),
      p = this.mustProfile(s.profileId),
      d = this.mustDestination(s.destinationId);
    if (r.state !== 'RECORDING' && r.state !== 'ROLLING_OVER')
      throw new RecordingEngineError(
        'RecordingSessionStateInvalid',
        `session not recording: ${r.state}`,
      );
    this.validatePackage(input, s, p, d);
    const part = this.activePart(input.recordingSessionId);
    const req = this.request(input, s, p, d, tick);
    if (this.requests.has(req.requestId)) {
      this.bump('duplicateRequests', 'RecordingWritePlanned');
      this.incident('RECORDING_DUPLICATE_REQUEST', 'ERROR', 'duplicate request');
      throw new RecordingEngineError('RecordingDuplicateRequest', 'duplicate request');
    }
    const key = `${req.requestId}:${s.sessionGeneration}:${p.profileGeneration}:${d.destinationGeneration}:${part.partGeneration}:${input.packageOutputGeneration}:${input.packageSessionGeneration}:${input.timelineGeneration}`;
    const cached = this.plans.get(key);
    if (cached) {
      this.bump('planCacheHits', 'RecordingWritePlanned');
      return cached;
    }
    this.bump('planCacheMisses', 'RecordingWritePlanned');
    this.reserve(input, d, s);
    const plan = this.backend.createPlan(req, p, d, part);
    this.put(this.requests, req.requestId, req, LIMIT.requests);
    this.put(this.plans, key, plan, LIMIT.requests);
    this.submissions.add(input.submissionId);
    this.consumed.add(input.submissionId);
    const updated = this.applyPackage(part, input, tick);
    this.parts.set(updated.partId, updated);
    this.queueInput(input.recordingSessionId, input.estimatedSizeBytes);
    this.bump('packageSubmissions', 'RecordingPackageSubmitted');
    this.bump('packageConsumptions', 'RecordingPackageConsumed');
    this.bump('plansCreated', 'RecordingWritePlanned');
    if (plan.rolloverDecision === 'ROLLOVER_AFTER_PACKAGE')
      this.rollover(input.recordingSessionId, tick);
    else this.updateManifestIndex(s, p, d, 'OPEN');
    return plan;
  }
  forceSplit(id: string) {
    this.open();
    this.mustSession(id);
    if (this.splits.at(-1)?.recordingSessionId === id)
      throw new RecordingEngineError('RecordingSplitFailed', 'duplicate split');
    const split = this.life([], id, 'SPLIT', 'manual')[0]!;
    this.splits = [...this.splits, split].slice(-LIMIT.events) as RecordingSplitSnapshot[];
    this.bump('splits', 'RecordingSplitCompleted');
    return split;
  }
  rollover(id: string, tick = fakeTick()) {
    this.open();
    const s = this.mustSession(id),
      r = this.mustRuntime(id),
      current = this.activePart(id);
    if (current.finalized) {
      this.incident('RECORDING_DUPLICATE_PART_FINALIZATION', 'ERROR', 'duplicate rollover');
      throw new RecordingEngineError('RecordingRolloverFailed', 'current part already finalized');
    }
    const fin = this.finalizePart(current);
    this.parts.set(fin.partId, fin);
    const next = this.createPart(
      s,
      this.mustProfile(s.profileId),
      this.mustDestination(s.destinationId),
      tick,
    );
    this.states.set(id, f({ ...r, state: 'RECORDING', activePartId: next.partId }));
    this.rollovers = this.life(
      this.rollovers,
      id,
      'ROLLED_OVER',
      'policy',
    ) as RecordingRolloverSnapshot[];
    this.bump('rollovers', 'RecordingRolloverCompleted');
    this.bump('partFinalizations', 'RecordingPartFinalized');
    return next;
  }
  drain(id: string) {
    this.open();
    this.bump('drains', 'RecordingSessionDraining');
    return this.finalize(id);
  }
  stop(id: string) {
    this.bump('sessionStops', 'RecordingSessionStopping');
    return this.finalize(id);
  }
  finalize(id: string) {
    this.open();
    const s = this.mustSession(id),
      r = this.mustRuntime(id);
    if (r.finalized)
      throw new RecordingEngineError('RecordingFinalizationFailed', 'duplicate finalization');
    if (r.aborted || (terminal.has(r.state) && r.state !== 'RECOVERED'))
      throw new RecordingEngineError('RecordingFinalizationFailed', `cannot finalize ${r.state}`);
    this.states.set(id, f({ ...r, state: 'FINALIZING' }));
    const d = this.mustDestination(s.destinationId),
      p = this.mustProfile(s.profileId),
      current = r.activePartId ? this.activePart(id) : undefined;
    if (current && !current.finalized) {
      const fin = this.finalizePart(current);
      this.parts.set(fin.partId, fin);
      this.publishArtifact(fin, s, d, false);
      this.bump('partFinalizations', 'RecordingPartFinalized');
    }
    const m = this.updateManifestIndex(s, p, d, 'FINALIZED');
    this.releaseReservations(id);
    this.finalizations = this.life(
      this.finalizations,
      id,
      'FINALIZED',
      'finalize',
    ) as RecordingFinalizationSnapshot[];
    this.states.set(
      id,
      f({
        ...this.mustRuntime(id),
        state: 'FINALIZED',
        finalized: true,
        activePartId: undefined,
        finalizations: r.finalizations + 1,
      }),
    );
    this.bump('sessionFinalizations', 'RecordingSessionFinalized');
    this.bump('finalizations', 'RecordingManifestFinalized');
    this.bump('manifestFinalizations', 'RecordingManifestFinalized');
    return m;
  }
  abort(id: string) {
    this.open();
    const s = this.mustSession(id),
      r = this.mustRuntime(id);
    if (r.aborted) throw new RecordingEngineError('RecordingAbortFailed', 'duplicate abort');
    const current = r.activePartId ? this.parts.get(r.activePartId) : undefined;
    if (current) this.publishArtifact(current, s, this.mustDestination(s.destinationId), true);
    this.releaseReservations(id);
    this.aborts = this.life(this.aborts, id, 'ABORTED', 'abort') as RecordingAbortSnapshot[];
    this.states.set(
      id,
      f({ ...r, state: 'ABORTED', aborted: true, activePartId: undefined, aborts: r.aborts + 1 }),
    );
    this.bump('sessionAborts', 'RecordingSessionAborted');
    this.bump('aborts', 'RecordingSessionAborted');
  }
  recover(id: string) {
    this.open();
    const s = this.mustSession(id),
      r = this.mustRuntime(id);
    if (r.recoveries > 0)
      throw new RecordingEngineError('RecordingRecoveryFailed', 'duplicate recovery');
    const rec = f({
      ...this.backend.recoverSession(id),
      recordingSessionGeneration: s.sessionGeneration,
      manifestGeneration: this.manifests.get(`recording-manifest:${id}`)?.manifestGeneration ?? 0,
      indexGeneration: this.indexes.get(`recording-index:${id}`)?.indexGeneration ?? 0,
    }) as RecordingRecoveryState;
    this.put(this.recoveries, rec.recoveryId, rec, LIMIT.events);
    this.states.set(
      id,
      f({ ...r, state: 'RECOVERED', recovered: true, recoveries: r.recoveries + 1 }),
    );
    this.incident('RECORDING_RECOVERY_REQUIRED', 'WARNING', 'recovery metadata created');
    this.bump('sessionRecoveries', 'RecordingSessionRecovered');
    this.bump('recoveries', 'RecordingRecoveryCompleted');
    return rec;
  }
  addMarker(id: string, markerId: string) {
    this.open();
    this.mustSession(id);
    const side = f({
      sidecarId: `recording-sidecar:${token(id)}:${token(markerId)}`,
      recordingSessionId: id,
      schemaVersion: RECORDING_ENGINE_VERSION,
      kind: 'marker metadata',
      summary: sanitizeMetadata({ markerId }),
      checksum: sig(`${id}:${markerId}`),
    });
    this.put(this.sidecars, side.sidecarId, side, LIMIT.events);
    this.bump('markerAdditions', 'RecordingIndexUpdated');
    return side;
  }
  releaseArtifact(leaseId: string, reason: string) {
    this.open();
    const l = this.leases.get(leaseId);
    if (!l) throw new RecordingEngineError('RecordingOwnershipViolation', 'lease not found');
    if (l.released) throw new RecordingEngineError('RecordingOwnershipViolation', 'double release');
    const rel = f({ ...l, released: true, releaseReason: redact(reason) }) as RecordedArtifactLease;
    this.leases.set(leaseId, rel);
    this.bump('artifactReleases', 'RecordingArtifactCreated');
    return rel;
  }
  resetSession(id: string) {
    this.open();
    const r = this.mustRuntime(id);
    if (!terminal.has(r.state))
      throw new RecordingEngineError(
        'RecordingSessionStateInvalid',
        'reset requires terminal state',
      );
    this.states.set(
      id,
      f({ ...r, state: 'READY', activePartId: undefined, finalized: false, aborted: false }),
    );
  }
  assertInvariants(): RecordingValidationReport {
    const errors: string[] = [];
    const uniq = (n: string, vals: string[]) => {
      if (new Set(vals).size !== vals.length) errors.push(`${n} IDs unique`);
    };
    uniq('profile', [...this.profiles.keys()]);
    uniq('destination', [...this.destinations.keys()]);
    uniq('session', [...this.sessions.keys()]);
    uniq('binding', [...this.bindings.keys()]);
    uniq('request', [...this.requests.keys()]);
    uniq('part', [...this.parts.keys()]);
    uniq('artifact', [...this.artifacts.keys()]);
    uniq('lease', [...this.leases.keys()]);
    uniq('reservation', [...this.reservations.keys()]);
    for (const s of this.sessions.values()) {
      if (!this.profiles.has(s.profileId)) errors.push('session profile missing');
      if (!this.destinations.has(s.destinationId)) errors.push('session destination missing');
      const active = this.partsFor(s.recordingSessionId).filter((p) => !p.finalized);
      if (active.length > 1 && !this.shutdownFlag) errors.push('more than one active part');
      let seq = 0;
      for (const p of this.partsFor(s.recordingSessionId)) {
        if (p.partSequence <= seq) errors.push('part sequence not monotonic');
        seq = p.partSequence;
      }
    }
    for (const r of this.reservations.values())
      if ([r.requestedBytes, r.reservedBytes, r.consumedBytes, r.remainingBytes].some((v) => v < 0))
        errors.push('reservation values invalid');
    if (this.shutdownFlag) {
      for (const r of this.states.values())
        if (!terminal.has(r.state)) errors.push('shutdown left active session');
      for (const l of this.leases.values())
        if (!l.released) errors.push('shutdown left active lease');
      for (const r of this.reservations.values())
        if (!['RELEASED', 'FAILED', 'EXPIRED'].includes(r.state))
          errors.push('shutdown left active reservation');
    }
    const report = f({
      valid: errors.length === 0,
      errors: f(errors),
      warnings: f([]),
      checkedAtNs: ns().toString(),
    });
    if (!report.valid)
      this.incident('RECORDING_INVARIANT_FAILURE', 'CRITICAL', errors[0] ?? 'invariant failure');
    return report;
  }
  shutdown() {
    if (this.shutdownFlag) return;
    for (const [id, r] of this.states)
      if (!terminal.has(r.state))
        this.states.set(id, f({ ...r, state: 'SHUTDOWN', activePartId: undefined }));
    for (const [id, l] of this.leases)
      if (!l.released)
        this.leases.set(
          id,
          f({ ...l, released: true, releaseReason: 'shutdown' }) as RecordedArtifactLease,
        );
    for (const [id, r] of this.reservations)
      if (!['RELEASED', 'FAILED', 'EXPIRED'].includes(r.state))
        this.reservations.set(
          id,
          f({
            ...r,
            state: 'RELEASED',
            remainingBytes: 0,
            updatedAtNs: ns().toString(),
          }) as StorageReservationState,
        );
    this.requests.clear();
    this.plans.clear();
    this.inputQueues.clear();
    this.artifactQueues.clear();
    this.backpressure.clear();
    this.shutdownFlag = true;
    this.backend.shutdown();
    this.bump('artifactReleases', 'RecordingEngineShutdown');
  }
  snapshot(): RecordingEngineSnapshot {
    const validation = this.assertInvariants();
    return f({
      profiles: [...this.profiles.values()]
        .sort((a, b) => a.profileId.localeCompare(b.profileId))
        .map(profileSnap),
      destinations: [...this.destinations.values()]
        .sort((a, b) => a.destinationId.localeCompare(b.destinationId))
        .map(destinationSnap),
      sessions: [...this.sessions.values()]
        .sort((a, b) => a.recordingSessionId.localeCompare(b.recordingSessionId))
        .map(sessionSnap),
      sessionStates: this.sessionStates(),
      bindings: [...this.bindings.values()].sort((a, b) => a.bindingId.localeCompare(b.bindingId)),
      requests: [...this.requests.values()].sort((a, b) => a.requestId.localeCompare(b.requestId)),
      plans: [...this.plans.values()].sort((a, b) => a.planId.localeCompare(b.planId)),
      parts: [...this.parts.values()].sort((a, b) => a.partId.localeCompare(b.partId)),
      manifests: [...this.manifests.values()].sort((a, b) =>
        a.manifestId.localeCompare(b.manifestId),
      ),
      indexes: [...this.indexes.values()].sort((a, b) => a.indexId.localeCompare(b.indexId)),
      sidecars: [...this.sidecars.values()].sort((a, b) => a.sidecarId.localeCompare(b.sidecarId)),
      artifacts: [...this.artifacts.values()].sort((a, b) =>
        a.artifactId.localeCompare(b.artifactId),
      ),
      leases: [...this.leases.values()].sort((a, b) => a.leaseId.localeCompare(b.leaseId)),
      reservations: [...this.reservations.values()].sort((a, b) =>
        a.reservationId.localeCompare(b.reservationId),
      ),
      inputQueues: this.queueSnaps('INPUT'),
      artifactQueues: this.queueSnaps('ARTIFACT'),
      backpressure: [...this.backpressure.values()].sort((a, b) =>
        a.recordingSessionId.localeCompare(b.recordingSessionId),
      ),
      rollovers: f([...this.rollovers]),
      splits: f([...this.splits]),
      pauseResume: f([...this.pauseResume]),
      finalizations: f([...this.finalizations]),
      aborts: f([...this.aborts]),
      recoveries: [...this.recoveries.values()].sort((a, b) =>
        a.recoveryId.localeCompare(b.recoveryId),
      ),
      transactions: f([...this.transactions]),
      backend: this.backendSnapshot(),
      health: this.health(),
      telemetry: this.telemetrySnapshot(),
      watchdog: f([...this.watchdog]),
      sourceGraph: this.sourceGraph(),
      validation,
      containsMediaPayloads: false,
      containsFileHandles: false,
      containsNativeHandles: false,
    });
  }
  health(): RecordingHealthSnapshot {
    const states = [...this.states.values()],
      parts = [...this.parts.values()],
      program = [...this.sessions.values()].find(
        (s) =>
          s.recordingType === 'PROGRAM' &&
          this.states.get(s.recordingSessionId)?.state === 'RECORDING',
      );
    const base = {
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: this.lastFailure ? 'DEGRADED' : 'HEALTHY',
      backendCount: 1,
      activeBackendIds: [this.backend.descriptor.backendId],
      registeredProfileCount: this.profiles.size,
      registeredDestinationCount: this.destinations.size,
      registeredSessionCount: this.sessions.size,
      activeSessionCount: states.filter((s) => !terminal.has(s.state)).length,
      recordingSessionCount: states.filter((s) => s.state === 'RECORDING').length,
      pausedSessionCount: states.filter((s) => s.state === 'PAUSED').length,
      finalizingSessionCount: states.filter((s) => s.state === 'FINALIZING').length,
      finalizedSessionCount: states.filter((s) => s.state === 'FINALIZED').length,
      failedSessionCount: states.filter((s) => s.state === 'FAILED').length,
      abortedSessionCount: states.filter((s) => s.state === 'ABORTED').length,
      recoverableSessionCount: this.recoveries.size,
      programRecordingSessionId: program?.recordingSessionId,
      activeProgramPartId: program
        ? this.states.get(program.recordingSessionId)?.activePartId
        : undefined,
      submittedPackageCount: this.telemetry.packageSubmissions,
      consumedPackageCount: this.telemetry.packageConsumptions,
      droppedPackageCount: this.telemetry.packageDrops,
      partCount: parts.length,
      finalizedPartCount: parts.filter((p) => p.finalized).length,
      artifactCount: this.artifacts.size,
      manifestUpdateCount: this.telemetry.manifestUpdates,
      indexUpdateCount: this.telemetry.indexUpdates,
      rolloverCount: this.telemetry.rollovers,
      splitCount: this.telemetry.splits,
      pauseCount: this.telemetry.sessionPauses,
      resumeCount: this.telemetry.sessionResumes,
      recoveryCount: this.telemetry.recoveries,
      finalizationFailureCount: this.telemetry.sessionFailures,
      duplicateRequestCount: this.telemetry.duplicateRequests,
      duplicateSubmissionCount: this.telemetry.duplicateSubmissions,
      staleGenerationRejectionCount: this.telemetry.staleGenerations,
      packageIncompatibilityCount: this.telemetry.incompatiblePackageRejects,
      storageReservationFailureCount: this.telemetry.storageReservationFailures,
      quotaExceededCount: this.telemetry.quotaExceeds,
      storagePressureState: this.pressure,
      inputQueueBytes: [...this.inputQueues.values()].reduce((a, q) => a + q.bytes, 0),
      artifactQueueBytes: [...this.artifactQueues.values()].reduce((a, q) => a + q.bytes, 0),
      retainedPackageBytes: 0,
      pendingFinalizationBytes: 0,
      peakRetainedBytes: parts.reduce((m, p) => Math.max(m, p.estimatedSizeBytes), 0),
      estimatedRecordedBytes: parts.reduce((a, p) => a + p.estimatedSizeBytes, 0),
      estimatedAvailableBytes: [...this.destinations.values()].reduce(
        (a, d) => a + d.availableBytes,
        0,
      ),
      lastRecordedPts: parts.at(-1)?.endPts,
      lastSuccessfulArtifact: [...this.artifacts.keys()].at(-1),
      lastFailure: this.lastFailure,
      updatedAtNs: ns().toString(),
    };
    return f(
      Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)),
    ) as unknown as RecordingHealthSnapshot;
  }
  private validateProfile(p: RecordingProfile) {
    if (!p.profileId || p.profileId.includes('/') || p.profileId.includes('..'))
      throw new RecordingEngineError('RecordingProfileInvalid', 'invalid profile ID');
    if (!this.backend.capabilities.recordingTypes.includes(p.recordingType))
      throw new RecordingEngineError('RecordingProfileInvalid', 'unsupported recording type');
    if (!p.destinationId)
      throw new RecordingEngineError(
        'RecordingProfileInvalid',
        'profile requires explicit destination',
      );
    if (!thresholdOk(p.rolloverPolicy) || !thresholdOk(p.splitPolicy))
      throw new RecordingEngineError('RecordingProfileInvalid', 'thresholds must be positive');
    if (
      p.filenamePolicy.namingPatternMetadata.includes('..') ||
      p.filenamePolicy.namingPatternMetadata.includes('/')
    )
      throw new RecordingEngineError('RecordingProfileInvalid', 'filename path traversal rejected');
  }
  private validateDestination(d: RecordingDestinationDefinition) {
    if (!d.destinationId || d.destinationId.includes('/') || d.destinationId.includes('..'))
      throw new RecordingEngineError('RecordingDestinationInvalid', 'invalid destination ID');
    if (
      [d.capacityBytes, d.availableBytes, d.reservedBytes].some(
        (v) => !Number.isFinite(v) || v < 0,
      ) ||
      d.availableBytes + d.reservedBytes > d.capacityBytes
    )
      throw new RecordingEngineError('RecordingDestinationInvalid', 'invalid capacity metadata');
    if (d.destinationType !== 'SYNTHETIC_MEMORY_REFERENCE' && d.writeEligibility === 'EXECUTABLE')
      throw new RecordingEngineError(
        'RecordingDestinationInvalid',
        'only synthetic destination executable',
      );
    if (d.persistenceCapability === 'REAL_VALIDATED')
      throw new RecordingEngineError(
        'RecordingDestinationInvalid',
        'real persistence unavailable in v5.6.8',
      );
  }
  private validateSession(s: RecordingSessionDefinition) {
    const p = this.mustProfile(s.profileId),
      d = this.mustDestination(s.destinationId);
    if (
      p.profileGeneration !== s.profileGeneration ||
      d.destinationGeneration !== s.destinationGeneration
    )
      throw new RecordingEngineError(
        'RecordingSessionGenerationMismatch',
        'stale profile/destination generation',
      );
    if (p.recordingType !== s.recordingType || p.outputRole !== s.outputRole)
      throw new RecordingEngineError('RecordingSessionInvalid', 'session must match profile');
    if (!s.enabled || s.startPolicy.length === 0)
      throw new RecordingEngineError(
        'RecordingSessionInvalid',
        'session must be enabled with explicit policy',
      );
  }
  private validatePackage(
    i: RecordingPackageInput,
    s: RecordingSessionDefinition,
    p: RecordingProfile,
    d: RecordingDestinationDefinition,
  ) {
    if (i.recordingSessionGeneration !== s.sessionGeneration) {
      this.bump('staleGenerations', 'RecordingPackageSubmitted');
      this.incident('RECORDING_SESSION_GENERATION_STALE', 'ERROR', 'stale session');
      throw new RecordingEngineError('RecordingSessionGenerationMismatch', 'stale session');
    }
    if (p.profileGeneration !== s.profileGeneration) {
      this.bump('staleGenerations', 'RecordingPackageSubmitted');
      this.incident('RECORDING_PROFILE_GENERATION_STALE', 'ERROR', 'stale profile');
      throw new RecordingEngineError('RecordingSessionGenerationMismatch', 'stale profile');
    }
    if (d.destinationGeneration !== s.destinationGeneration) {
      this.bump('staleGenerations', 'RecordingPackageSubmitted');
      this.incident('RECORDING_DESTINATION_GENERATION_STALE', 'ERROR', 'stale destination');
      throw new RecordingEngineError('RecordingSessionGenerationMismatch', 'stale destination');
    }
    if (
      i.packageOutputGeneration <= 0 ||
      i.packageSessionGeneration <= 0 ||
      i.timelineGeneration <= 0
    ) {
      this.bump('staleGenerations', 'RecordingPackageSubmitted');
      this.incident('RECORDING_PACKAGE_GENERATION_STALE', 'ERROR', 'stale package');
      throw new RecordingEngineError(
        'RecordingPackageInputInvalid',
        'stale package/session/timeline',
      );
    }
    if (i.containerFormat !== p.expectedContainerFormat) {
      this.bump('incompatiblePackageRejects', 'RecordingPackageSubmitted');
      this.incident('RECORDING_PACKAGE_INCOMPATIBLE', 'ERROR', 'incompatible package');
      throw new RecordingEngineError('RecordingPackageIncompatible', 'incompatible container');
    }
    if (!i.finalized) {
      this.bump('incompatiblePackageRejects', 'RecordingPackageSubmitted');
      this.incident('RECORDING_PACKAGE_NOT_FINALIZED', 'ERROR', 'unfinalized package');
      throw new RecordingEngineError('RecordingPackageInputInvalid', 'unfinalized package');
    }
    if (i.ownership === 'RELEASED') {
      this.bump('ownershipViolations', 'RecordingPackageSubmitted');
      this.incident('RECORDING_OWNERSHIP_VIOLATION', 'ERROR', 'released package');
      throw new RecordingEngineError('RecordingOwnershipViolation', 'released package');
    }
  }
  private request(
    i: RecordingPackageInput,
    s: RecordingSessionDefinition,
    p: RecordingProfile,
    d: RecordingDestinationDefinition,
    t: FrameTick,
  ): RecordingWriteRequest {
    return f({
      requestId: `recording-request:${i.submissionId}`,
      recordingSessionId: s.recordingSessionId,
      expectedRecordingSessionGeneration: s.sessionGeneration,
      expectedProfileGeneration: p.profileGeneration,
      expectedDestinationGeneration: d.destinationGeneration,
      packageInput: f({
        ...i,
        safeMetadata: sanitizeMetadata(i.safeMetadata),
      }) as RecordingPackageInputSnapshot,
      expectedPackageSessionGeneration: i.packageSessionGeneration,
      expectedPackageOutputGeneration: i.packageOutputGeneration,
      expectedTimelineGeneration: i.timelineGeneration,
      requestedRuntimeFrame: t.frameNumber.toString(),
      deadlineNs: (t.scheduledTimeNs + 10000000n).toString(),
      correlationId: i.submissionId,
      safeMetadata: {},
    });
  }
  private createPart(
    s: RecordingSessionDefinition,
    p: RecordingProfile,
    d: RecordingDestinationDefinition,
    t: FrameTick,
  ) {
    const seq = (this.partsBySession.get(s.recordingSessionId)?.length ?? 0) + 1;
    if (seq > LIMIT.partsPerSession)
      throw new RecordingEngineError('RecordingAllocationFailed', 'part bound reached');
    const part = this.backend.createPart(s, p, d, seq, t);
    if (this.parts.has(part.partId))
      throw new RecordingEngineError('RecordingInvariantViolation', 'duplicate part');
    this.parts.set(part.partId, part);
    this.partsBySession.set(s.recordingSessionId, [
      ...(this.partsBySession.get(s.recordingSessionId) ?? []),
      part.partId,
    ]);
    this.bump('partCreations', 'RecordingPartCreated');
    return part;
  }
  private applyPackage(
    part: RecordingPartState,
    i: RecordingPackageInput,
    t: FrameTick,
  ): RecordingPartState {
    return f({
      ...part,
      partGeneration: part.partGeneration + 1,
      endRuntimeFrame: t.frameNumber.toString(),
      startPts: part.packageCount === 0 ? i.startPts : part.startPts,
      endPts: i.endPts,
      duration: part.packageCount === 0 ? i.duration : i.endPts - part.startPts,
      packageCount: part.packageCount + 1,
      segmentCount: part.segmentCount + (i.segmentId ? 1 : 0),
      fragmentCount: part.fragmentCount + (i.fragmentId ? 1 : 0),
      initializationCount: part.initializationCount + (i.initializationId ? 1 : 0),
      estimatedSizeBytes: part.estimatedSizeBytes + i.estimatedSizeBytes,
      reservedSizeBytes: part.reservedSizeBytes + i.estimatedSizeBytes,
      discontinuityGeneration: Math.max(part.discontinuityGeneration, i.discontinuityGeneration),
      checksum: sig(`${part.partId}:${i.submissionId}:${i.checksum}`),
    }) as RecordingPartState;
  }
  private finalizePart(part: RecordingPartState) {
    if (part.finalized) {
      this.incident(
        'RECORDING_DUPLICATE_PART_FINALIZATION',
        'ERROR',
        'duplicate part finalization',
      );
      throw new RecordingEngineError(
        'RecordingPartFinalizationFailed',
        'duplicate part finalization',
      );
    }
    return f({
      ...part,
      finalized: true,
      partGeneration: part.partGeneration + 1,
      checksum: sig(`${part.partId}:finalized:${part.checksum}`),
    }) as RecordingPartState;
  }
  private publishArtifact(
    part: RecordingPartState,
    s: RecordingSessionDefinition,
    d: RecordingDestinationDefinition,
    aborted: boolean,
  ) {
    if (this.artifactByPart.has(part.partId)) {
      this.incident('RECORDING_DUPLICATE_ARTIFACT', 'ERROR', 'duplicate artifact');
      throw new RecordingEngineError('RecordingInvariantViolation', 'duplicate artifact');
    }
    const base = this.backend.finalizePart(part, s, d);
    const a = aborted
      ? (f({
          ...base,
          artifactId: `recording-artifact:${sig(`${part.partId}:aborted:${s.recordingType}:${s.outputRole}`)}`,
          finalized: false,
          complete: false,
          aborted: true,
          checksum: sig(`${part.checksum}:aborted`),
        }) as RecordedMediaArtifact)
      : base;
    this.put(this.artifacts, a.artifactId, a, LIMIT.artifacts);
    this.artifactByPart.set(part.partId, a.artifactId);
    const lease = f({
      leaseId: `recording-lease:${a.artifactId}`,
      artifactId: a.artifactId,
      artifactGeneration: a.artifactGeneration,
      owner: 'RECORDER_OWNED' as const,
      acquiredSequence: this.leases.size + 1,
      released: false,
      safeMetadata: {},
    });
    this.put(this.leases, lease.leaseId, lease, LIMIT.artifacts);
    this.queueArtifact(s.recordingSessionId, a.estimatedSizeBytes);
    this.bump('artifactCreations', 'RecordingArtifactCreated');
    return a;
  }
  private updateManifestIndex(
    s: RecordingSessionDefinition,
    p: RecordingProfile,
    d: RecordingDestinationDefinition,
    finalizationState: string,
  ) {
    const parts = this.partsFor(s.recordingSessionId);
    const manifest: RecordingManifest = f({
      manifestId: `recording-manifest:${s.recordingSessionId}`,
      manifestVersion: RECORDING_ENGINE_VERSION,
      manifestGeneration:
        (this.manifests.get(`recording-manifest:${s.recordingSessionId}`)?.manifestGeneration ??
          0) + 1,
      recordingSessionId: s.recordingSessionId,
      recordingSessionGeneration: s.sessionGeneration,
      profileId: p.profileId,
      profileGeneration: p.profileGeneration,
      destinationId: d.destinationId,
      destinationGeneration: d.destinationGeneration,
      recordingType: s.recordingType,
      outputRole: s.outputRole,
      sessionStartPts: parts[0]?.startPts ?? 0,
      sessionEndPts: parts.at(-1)?.endPts ?? 0,
      duration: parts.reduce((a, x) => a + x.duration, 0),
      partReferences: f(parts.map((x) => x.partId).slice(-LIMIT.partsPerSession)),
      trackSummaries: f([...s.trackBindings].sort().slice(0, 64)),
      packageCounts: parts.reduce((a, x) => a + x.packageCount, 0),
      segmentCounts: parts.reduce((a, x) => a + x.segmentCount, 0),
      fragmentCounts: parts.reduce((a, x) => a + x.fragmentCount, 0),
      discontinuities: parts.reduce((a, x) => Math.max(a, x.discontinuityGeneration), 0),
      rolloverCount: this.rollovers.filter((x) => x.recordingSessionId === s.recordingSessionId)
        .length,
      splitCount: this.splits.filter((x) => x.recordingSessionId === s.recordingSessionId).length,
      recoveryState: [...this.recoveries.values()].some(
        (r) => r.recordingSessionId === s.recordingSessionId,
      )
        ? 'RECOVERY_METADATA_PRESENT'
        : 'NONE',
      finalizationState,
      estimatedTotalBytes: parts.reduce((a, x) => a + x.estimatedSizeBytes, 0),
      checksum: sig(
        `${s.recordingSessionId}:${parts.map((x) => x.checksum).join('|')}:${finalizationState}`,
      ),
      safeMetadata: { noRawPath: true, noPayload: true },
    });
    const index: RecordingIndex = f({
      indexId: `recording-index:${s.recordingSessionId}`,
      indexGeneration:
        (this.indexes.get(`recording-index:${s.recordingSessionId}`)?.indexGeneration ?? 0) + 1,
      recordingSessionId: s.recordingSessionId,
      timelineEntries: f(
        parts
          .map((x) => `${x.partSequence}:${x.startPts}-${x.endPts}`)
          .slice(-LIMIT.partsPerSession),
      ),
      partBoundaries: f(
        parts.map((x) => `${x.partId}:${x.startPts}:${x.endPts}`).slice(-LIMIT.partsPerSession),
      ),
      segmentBoundaries: f(
        parts
          .flatMap((x) => (x.segmentCount ? [`${x.partId}:segments:${x.segmentCount}`] : []))
          .slice(-LIMIT.partsPerSession),
      ),
      sceneChangeMarkers: f([]),
      sourceChangeMarkers: f([]),
      discontinuityMarkers: f(
        parts
          .filter((x) => x.discontinuityGeneration > 0)
          .map((x) => `${x.partId}:${x.discontinuityGeneration}`)
          .slice(-LIMIT.partsPerSession),
      ),
      customMetadataMarkers: f(
        [...this.sidecars.values()]
          .filter((x) => x.recordingSessionId === s.recordingSessionId)
          .map((x) => x.sidecarId)
          .slice(-LIMIT.partsPerSession),
      ),
      checksum: sig(`index:${s.recordingSessionId}:${parts.length}:${finalizationState}`),
      safeMetadata: { bounded: true },
    });
    this.manifests.set(manifest.manifestId, manifest);
    this.indexes.set(index.indexId, index);
    this.bump(
      'manifestUpdates',
      finalizationState === 'FINALIZED' ? 'RecordingManifestFinalized' : 'RecordingManifestUpdated',
    );
    this.bump('indexUpdates', 'RecordingIndexUpdated');
    return manifest;
  }
  private reserve(
    i: RecordingPackageInput,
    d: RecordingDestinationDefinition,
    s: RecordingSessionDefinition,
  ) {
    if (
      d.destinationType !== 'SYNTHETIC_MEMORY_REFERENCE' ||
      i.estimatedSizeBytes > d.availableBytes
    ) {
      this.bump('storageReservationFailures', 'RecordingStoragePressureChanged');
      this.incident('RECORDING_STORAGE_RESERVATION_FAILED', 'ERROR', 'reservation failed');
      throw new RecordingEngineError(
        'RecordingStorageReservationFailed',
        'synthetic capacity insufficient',
      );
    }
    const id = `recording-reservation:${i.submissionId}`;
    this.put(
      this.reservations,
      id,
      f({
        reservationId: id,
        reservationGeneration: 1,
        destinationId: d.destinationId,
        destinationGeneration: d.destinationGeneration,
        recordingSessionId: s.recordingSessionId,
        recordingSessionGeneration: s.sessionGeneration,
        requestedBytes: i.estimatedSizeBytes,
        reservedBytes: i.estimatedSizeBytes,
        consumedBytes: i.estimatedSizeBytes,
        remainingBytes: 0,
        state: 'CONSUMED',
        createdAtNs: ns().toString(),
        updatedAtNs: ns().toString(),
        safeMetadata: { synthetic: true },
      }),
      LIMIT.artifacts,
    );
    this.bump('storageReservations', 'RecordingStoragePressureChanged');
  }
  private releaseReservations(id: string) {
    for (const [rid, r] of this.reservations)
      if (r.recordingSessionId === id && r.state !== 'RELEASED') {
        this.reservations.set(
          rid,
          f({
            ...r,
            state: 'RELEASED',
            remainingBytes: 0,
            updatedAtNs: ns().toString(),
          }) as StorageReservationState,
        );
        this.bump('storageReservationReleases', 'RecordingStoragePressureChanged');
      }
  }
  private evaluatePressure(d: RecordingDestinationDefinition) {
    const ratio = d.capacityBytes === 0 ? 0 : d.availableBytes / d.capacityBytes;
    const next: StoragePressureState =
      ratio <= 0
        ? 'EXHAUSTED'
        : ratio < 0.1
          ? 'CRITICAL'
          : ratio < 0.2
            ? 'HIGH'
            : ratio < 0.35
              ? 'ELEVATED'
              : 'NORMAL';
    if (next !== this.pressure) {
      this.pressure = next;
      this.bump('storagePressureTransitions', 'RecordingStoragePressureChanged');
      if (next === 'HIGH' || next === 'CRITICAL')
        this.incident('RECORDING_STORAGE_PRESSURE_HIGH', 'WARNING', 'storage pressure high');
      if (next === 'EXHAUSTED')
        this.incident('RECORDING_STORAGE_EXHAUSTED', 'CRITICAL', 'storage exhausted');
    }
  }
  private queueInput(id: string, bytes: number) {
    const q = this.inputQueues.get(id) ?? this.newQueue({});
    const depth = Math.min(q.maxDepth, q.depth + 1),
      b = Math.min(q.maxBytes, q.bytes + bytes);
    if (q.depth + 1 > q.maxDepth || q.bytes + bytes > q.maxBytes) {
      this.bump('packageDrops', 'RecordingPackageSubmitted');
      this.incident('RECORDING_INPUT_QUEUE_OVERFLOW', 'WARNING', 'input queue overflow');
    }
    const next = f({
      ...q,
      depth,
      bytes: b,
      highWaterDepth: Math.max(q.highWaterDepth, depth),
      highWaterBytes: Math.max(q.highWaterBytes, b),
    });
    this.inputQueues.set(id, next);
    if (next.highWaterDepth > q.highWaterDepth)
      this.bump('queueHighWaterMarks', 'RecordingBackpressureChanged');
    this.updateBackpressure(id);
  }
  private queueArtifact(id: string, bytes: number) {
    const q = this.artifactQueues.get(id) ?? this.newQueue({});
    const depth = Math.min(q.maxDepth, q.depth + 1),
      b = Math.min(q.maxBytes, q.bytes + bytes);
    if (q.depth + 1 > q.maxDepth || q.bytes + bytes > q.maxBytes) {
      this.bump('artifactDrops', 'RecordingArtifactCreated');
      this.incident('RECORDING_ARTIFACT_QUEUE_OVERFLOW', 'WARNING', 'artifact queue overflow');
    }
    this.artifactQueues.set(
      id,
      f({
        ...q,
        depth,
        bytes: b,
        highWaterDepth: Math.max(q.highWaterDepth, depth),
        highWaterBytes: Math.max(q.highWaterBytes, b),
      }),
    );
    this.updateBackpressure(id);
  }
  private updateBackpressure(id: string) {
    const i = this.inputQueues.get(id) ?? this.newQueue({}),
      a = this.artifactQueues.get(id) ?? this.newQueue({});
    const ratio = Math.max(
      i.depth / i.maxDepth,
      a.depth / a.maxDepth,
      i.bytes / i.maxBytes,
      a.bytes / a.maxBytes,
    );
    const state: BackpressureState =
      ratio >= 1 ? 'CRITICAL' : ratio > 0.75 ? 'HARD' : ratio > 0.5 ? 'SOFT' : 'NONE';
    if ((this.backpressure.get(id)?.state ?? 'NONE') !== state) {
      this.bump('backpressureTransitions', 'RecordingBackpressureChanged');
      if (state === 'CRITICAL')
        this.incident('RECORDING_BACKPRESSURE_CRITICAL', 'ERROR', 'backpressure critical');
    }
    this.backpressure.set(
      id,
      f({
        recordingSessionId: id,
        state,
        packageQueueDepth: i.depth,
        artifactQueueDepth: a.depth,
        queuedBytes: i.bytes + a.bytes,
        retainedBytes: 0,
        pendingFinalizationBytes: 0,
        estimatedLatency: i.depth,
        blockedRequestCount: state === 'CRITICAL' ? 1 : 0,
        droppedPackageCount: this.telemetry.packageDrops,
        droppedArtifactCount: this.telemetry.artifactDrops,
        highWaterMark: Math.max(i.highWaterDepth, a.highWaterDepth),
      }),
    );
  }
  private newQueue(policy: Readonly<Record<string, unknown>>): QueueState {
    const maxDepth =
      typeof policy.maxPackages === 'number'
        ? Math.max(1, Math.min(policy.maxPackages, 1024))
        : 128;
    const maxBytes =
      typeof policy.maxBytes === 'number'
        ? Math.max(1, Math.min(policy.maxBytes, 512 * 1024 * 1024))
        : 64 * 1024 * 1024;
    return f({
      depth: 0,
      bytes: 0,
      highWaterDepth: 0,
      highWaterBytes: 0,
      maxDepth,
      maxBytes,
      overflowPolicy: typeof policy.overflow === 'string' ? policy.overflow : 'REJECT_NEW',
    });
  }
  private queueSnaps(kind: 'INPUT' | 'ARTIFACT') {
    const src = kind === 'INPUT' ? this.inputQueues : this.artifactQueues;
    return f(
      [...src.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([recordingSessionId, q]) =>
          f({
            queueId: `recording-${kind.toLowerCase()}-queue:${recordingSessionId}`,
            recordingSessionId,
            kind,
            depth: q.depth,
            queuedBytes: q.bytes,
            highWaterDepth: q.highWaterDepth,
            highWaterBytes: q.highWaterBytes,
            maxDepth: q.maxDepth,
            maxBytes: q.maxBytes,
            overflowPolicy: q.overflowPolicy,
          }),
        ),
    );
  }
  private life<T extends RecordingLifecycleSnapshot>(
    list: readonly T[],
    id: string,
    state: string,
    action: string,
  ) {
    return f(
      [
        ...list,
        f({
          id: `recording-lifecycle:${sig(`${id}:${action}:${list.length}`)}`,
          recordingSessionId: id,
          generation: list.length + 1,
          state,
          action,
          safeMetadata: {},
        }) as T,
      ].slice(-LIMIT.events),
    );
  }
  private bump(counter: keyof RecordingTelemetrySnapshot, event: RecordingEventType) {
    const cur = this.telemetry[counter];
    const patch: Partial<RecordingTelemetrySnapshot> = { lastRecordingEvent: event };
    if (typeof cur === 'number')
      (patch as Record<string, unknown>)[counter] = Math.min(Number.MAX_SAFE_INTEGER, cur + 1);
    this.telemetry = f({ ...this.telemetry, ...patch }) as RecordingTelemetrySnapshot;
    this.metrics();
  }
  private metrics() {
    const parts = [...this.parts.values()],
      queues = [...this.inputQueues.values(), ...this.artifactQueues.values()],
      totalDur = parts.reduce((a, p) => a + p.duration, 0),
      totalSize = parts.reduce((a, p) => a + p.estimatedSizeBytes, 0),
      totalDepth = queues.reduce((a, q) => a + q.depth, 0);
    this.telemetry = f({
      ...this.telemetry,
      estimatedRecordingBytes: totalSize,
      averagePartDuration: parts.length ? Math.round(totalDur / parts.length) : 0,
      maximumPartDuration: parts.reduce((m, p) => Math.max(m, p.duration), 0),
      averagePartSize: parts.length ? Math.round(totalSize / parts.length) : 0,
      maximumPartSize: parts.reduce((m, p) => Math.max(m, p.estimatedSizeBytes), 0),
      averageQueueDepth: queues.length ? Math.round(totalDepth / queues.length) : 0,
      maximumQueueDepth: queues.reduce((m, q) => Math.max(m, q.highWaterDepth), 0),
      currentRequestIds: f([...this.requests.keys()].sort().slice(-128)),
      activeSessionIds: f(
        [...this.states.entries()]
          .filter(([, r]) => !terminal.has(r.state))
          .map(([id]) => id)
          .sort(),
      ),
      healthSummary: this.lastFailure ? 'DEGRADED' : 'HEALTHY',
    }) as RecordingTelemetrySnapshot;
  }
  private incident(
    type: RecordingWatchdogIncidentType,
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL',
    message: string,
  ) {
    const inc = f({
      incidentId: `${type}:${(this.watchdog.length + 1).toString().padStart(8, '0')}`,
      type,
      severity,
      safeRecovery: recoveryActions,
      message: redact(message),
      atNs: ns().toString(),
    });
    this.watchdog = [...this.watchdog, inc].slice(-LIMIT.events);
    if (severity === 'ERROR' || severity === 'CRITICAL') this.lastFailure = inc.message;
  }
  private sessionStates() {
    return f(
      [...this.sessions.values()]
        .sort((a, b) => a.recordingSessionId.localeCompare(b.recordingSessionId))
        .map((s) => {
          const r = this.states.get(s.recordingSessionId),
            p = r?.activePartId ? this.parts.get(r.activePartId) : undefined;
          const base = {
            recordingSessionId: s.recordingSessionId,
            sessionGeneration: s.sessionGeneration,
            state: r?.state ?? 'CREATED',
            activePartId: p?.partId,
            activePartSequence: p?.partSequence,
          };
          return f(
            Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)),
          ) as unknown as RecordingSessionStateSnapshot;
        }),
    );
  }
  private sourceGraph(): RecordingSourceGraphSnapshot {
    return f({
      recordingSessions: f(
        [...this.sessions.values()]
          .sort((a, b) => a.recordingSessionId.localeCompare(b.recordingSessionId))
          .map((s) => {
            const d = this.destinations.get(s.destinationId)!,
              m = this.manifests.get(`recording-manifest:${s.recordingSessionId}`),
              idx = this.indexes.get(`recording-index:${s.recordingSessionId}`),
              r = this.states.get(s.recordingSessionId),
              p = r?.activePartId ? this.parts.get(r.activePartId) : undefined,
              ready = [...this.artifacts.values()].some(
                (a) => a.recordingSessionId === s.recordingSessionId && a.complete,
              );
            const base = {
              recordingSessionId: s.recordingSessionId,
              recordingType: s.recordingType,
              outputRole: s.outputRole,
              profileId: s.profileId,
              destinationType: d.destinationType,
              storageClass: d.storageClass,
              sessionState: r?.state ?? 'CREATED',
              activePartId: p?.partId,
              activePartSequence: p?.partSequence,
              packageCount: m?.packageCounts ?? 0,
              duration: m?.duration ?? 0,
              estimatedBytes: m?.estimatedTotalBytes ?? 0,
              rolloverCount: m?.rolloverCount ?? 0,
              splitCount: m?.splitCount ?? 0,
              manifestGeneration: m?.manifestGeneration ?? 0,
              indexGeneration: idx?.indexGeneration ?? 0,
              artifactReady: ready,
              recoveryState: m?.recoveryState ?? 'NONE',
              futureArchiveReplayEligibility: ready,
              health: this.lastFailure ? 'DEGRADED' : 'HEALTHY',
              routingEligibility: !terminal.has(r?.state ?? 'CREATED'),
            };
            return f(
              Object.fromEntries(Object.entries(base).filter(([, v]) => v !== undefined)),
            ) as unknown as RecordingSourceGraphSessionSnapshot;
          }),
      ),
      storagePressureState: this.pressure,
      health: this.lastFailure ? 'DEGRADED' : 'HEALTHY',
      routingEligibility: true,
      containsMediaPayloads: false,
      containsPathsUrlsCredentialsOrHandles: false,
    });
  }
  private backendSnapshot(): RecordingBackendSnapshot {
    return f({
      backendId: this.backend.descriptor.backendId,
      backendGeneration: this.backend.descriptor.backendGeneration,
      displayName: this.backend.descriptor.displayName,
      capabilities: this.backend.capabilities,
      healthy: !this.lastFailure,
    });
  }
  private telemetrySnapshot() {
    this.metrics();
    return this.telemetry;
  }
  private partsFor(id: string) {
    return (this.partsBySession.get(id) ?? [])
      .map((pid) => this.parts.get(pid))
      .filter((p): p is RecordingPartState => Boolean(p))
      .sort((a, b) => a.partSequence - b.partSequence);
  }
  private activePart(id: string) {
    const r = this.mustRuntime(id);
    if (!r.activePartId)
      throw new RecordingEngineError('RecordingPartFinalizationFailed', 'no active part');
    const p = this.parts.get(r.activePartId);
    if (!p)
      throw new RecordingEngineError('RecordingPartFinalizationFailed', 'missing active part');
    return p;
  }
  private mustProfile(id: string) {
    const p = this.profiles.get(id);
    if (!p)
      throw new RecordingEngineError('RecordingProfileNotFound', 'profile not found', {
        profileId: id,
      });
    return p;
  }
  private mustDestination(id: string) {
    const d = this.destinations.get(id);
    if (!d)
      throw new RecordingEngineError('RecordingDestinationNotFound', 'destination not found', {
        destinationId: id,
      });
    return d;
  }
  private mustSession(id: string) {
    const s = this.sessions.get(id);
    if (!s)
      throw new RecordingEngineError('RecordingSessionNotFound', 'session not found', {
        recordingSessionId: id,
      });
    return s;
  }
  private mustRuntime(id: string) {
    const r = this.states.get(id);
    if (!r)
      throw new RecordingEngineError('RecordingSessionNotFound', 'session state not found', {
        recordingSessionId: id,
      });
    return r;
  }
  private open() {
    if (this.shutdownFlag)
      throw new RecordingEngineError('RecordingShutdownError', 'recording engine is shutdown');
  }
  private put<T>(map: Map<string, T>, key: string, value: T, limit: number) {
    map.set(key, value);
    while (map.size > limit) map.delete(map.keys().next().value as string);
  }
}

export const createRecordingEngine = () => new RecordingEngine();
export function createSyntheticRecordingProfile(
  input: Partial<RecordingProfile> & Pick<RecordingProfile, 'profileId' | 'destinationId'>,
): RecordingProfile {
  const t = ns();
  return f({
    profileVersion: RECORDING_ENGINE_VERSION,
    profileGeneration: 1,
    displayName: input.profileId,
    recordingType: 'PROGRAM',
    outputRole: 'PROGRAM',
    packageProfileRef: 'package-profile:synthetic',
    expectedContainerFormat: 'FRAGMENTED_MP4_METADATA',
    sourcePackageSessionIds: [],
    filenamePolicy: {
      templateId: 'default',
      templateVersion: 1,
      allowedTokens: [
        'project',
        'session',
        'output role',
        'part sequence',
        'runtime frame',
        'profile',
      ],
      namingPatternMetadata: 'profile_role_sequence.extension.synthetic',
      sequenceFormatting: '000000',
      timestampTokenPolicy: 'metadata-only',
      collisionPolicy: 'APPEND_DETERMINISTIC_SUFFIX',
      extensionPolicy: 'container-compatible-metadata',
      sanitizationPolicy: 'strict-ascii-safe',
      safeMetadata: {},
    },
    rolloverPolicy: { type: 'NONE' },
    splitPolicy: { type: 'NEVER' },
    manifestPolicy: { enabled: true },
    sidecarPolicy: { metadataOnly: true },
    recoveryPolicy: { metadataOnly: true },
    storagePolicy: { syntheticOnly: true },
    queuePolicy: { maxPackages: 128, maxBytes: 64 * 1024 * 1024, overflow: 'REJECT_NEW' },
    finalizationPolicy: { timeoutNs: '1000000000' },
    retentionMetadata: { metadataOnly: true },
    failurePolicy: { preserveProgram: true },
    criticality: 'PROGRAM_CRITICAL',
    safeMetadata: {},
    createdAtNs: t,
    updatedAtNs: t,
    ...input,
  });
}
export function createSyntheticRecordingDestination(
  input: Partial<RecordingDestinationDefinition> &
    Pick<RecordingDestinationDefinition, 'destinationId'>,
): RecordingDestinationDefinition {
  const t = ns(),
    capacity = input.capacityBytes ?? 1024 * 1024 * 1024,
    reserved = input.reservedBytes ?? 0;
  return f({
    destinationVersion: RECORDING_ENGINE_VERSION,
    destinationGeneration: 1,
    destinationType: 'SYNTHETIC_MEMORY_REFERENCE',
    displayName: input.destinationId,
    storageClass: 'SYNTHETIC',
    capacityBytes: capacity,
    availableBytes: input.availableBytes ?? capacity - reserved,
    reservedBytes: reserved,
    writeEligibility: 'EXECUTABLE',
    persistenceCapability: 'METADATA_ONLY',
    atomicFinalizeCapability: true,
    recoveryCapability: true,
    directoryReferenceMetadata: 'synthetic-memory-reference',
    quotaPolicy: { type: 'NO_QUOTA' },
    collisionPolicy: 'APPEND_DETERMINISTIC_SUFFIX',
    safeMetadata: { noPath: true, noUrl: true, noCredentials: true },
    createdAtNs: t,
    updatedAtNs: t,
    ...input,
  });
}
export function createSyntheticRecordingSession(
  input: Partial<RecordingSessionDefinition> &
    Pick<RecordingSessionDefinition, 'recordingSessionId' | 'profileId' | 'destinationId'>,
): RecordingSessionDefinition {
  const t = ns();
  return f({
    sessionVersion: RECORDING_ENGINE_VERSION,
    sessionGeneration: 1,
    profileGeneration: 1,
    destinationGeneration: 1,
    recordingType: 'PROGRAM',
    outputRole: 'PROGRAM',
    packageSessionIds: ['package-session:program'],
    trackBindings: ['program-video', 'program-audio'],
    startPolicy: [
      'WAIT_FOR_PACKAGE_READY',
      'WAIT_FOR_INITIALIZATION_PACKAGE',
      'WAIT_FOR_VIDEO_KEYFRAME',
      'WAIT_FOR_ALL_CRITICAL_TRACKS',
    ],
    pausePolicy: 'CLOSE_CURRENT_PART',
    resumePolicy: { validateGenerations: true },
    stopPolicy: 'DRAIN_AND_FINALIZE',
    rolloverPolicy: { type: 'NONE' },
    recoveryPolicy: { metadataOnly: true },
    queuePolicy: { maxPackages: 128, overflow: 'PRESERVE_PROGRAM' },
    criticality: 'PROGRAM_CRITICAL',
    enabled: true,
    safeMetadata: {},
    createdAtNs: t,
    updatedAtNs: t,
    ...input,
  });
}
export class RecordingEngineProcessor implements TickProcessor<
  RecordingEngineSnapshot,
  RecordingHealthSnapshot
> {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'ubos.media.recording-engine',
    name: 'UBOS v5.6.8 Production-Safe Recording Engine',
    version: RECORDING_ENGINE_VERSION,
    order: RECORDING_PROCESSOR_ORDER,
    phase: 'OUTPUT',
    workloadClass: 'BACKGROUND',
    enabledByDefault: true,
    dependencies: ['ubos.media.muxer-packaging'],
    optionalCapabilities: ['synthetic-recording-artifacts', 'recording-source-graph-metadata'],
    estimatedBudgetNs: 1000000n,
    maximumBudgetNs: 5000000n,
    timeoutNs: 10000000n,
    maySkipUnderLoad: false,
    failurePolicy: 'FAIL_RUNTIME',
    criticality: 'MEDIA_CRITICAL',
    supportsHotDisable: true,
    supportsHotEnable: true,
    supportsHotReplacement: false,
    statePersistencePolicy: 'RETAIN_UNTIL_SHUTDOWN',
    metadata: { realPersistence: false, realFileOutput: false, orderAfterPackaging: 1000 },
  };
  constructor(readonly engine = new RecordingEngine()) {}
  initialize() {
    return {
      status: 'READY' as const,
      state: this.engine.snapshot(),
      metadata: { version: RECORDING_ENGINE_VERSION },
    };
  }
  processTick(
    _tick: FrameTick,
    context: RuntimeContext | ProcessorRuntimeContext<RecordingEngineSnapshot>,
  ) {
    const outputs = 'outputs' in context ? context.outputs : undefined;
    const s = this.engine.snapshot();
    outputs?.publish(this.descriptor.id, RECORDING_OUTPUT_KEYS.health, s.health, 'BORROWED');
    outputs?.publish(this.descriptor.id, RECORDING_OUTPUT_KEYS.telemetry, s.telemetry, 'BORROWED');
    outputs?.publish(this.descriptor.id, RECORDING_OUTPUT_KEYS.watchdog, s.watchdog, 'BORROWED');
    outputs?.publish(
      this.descriptor.id,
      RECORDING_OUTPUT_KEYS.sourceGraph,
      s.sourceGraph,
      'BORROWED',
    );
    outputs?.publish(this.descriptor.id, RECORDING_OUTPUT_KEYS.manifests, s.manifests, 'BORROWED');
    outputs?.publish(this.descriptor.id, RECORDING_OUTPUT_KEYS.artifacts, s.artifacts, 'BORROWED');
    return {
      status: 'SUCCEEDED' as const,
      value: s.health,
      metadata: { recordingEngineVersion: RECORDING_ENGINE_VERSION },
    };
  }
  shutdown() {
    this.engine.shutdown();
    return { status: 'STOPPED' as const, metadata: { releasedRecorderOwnedArtifacts: true } };
  }
}
export const createRecordingEngineProcessor = (engine?: RecordingEngine) =>
  new RecordingEngineProcessor(engine);
export function createRecordingCommandHandlers(
  engine: RecordingEngine,
): Readonly<Record<RecordingCommandType, RuntimeCommandHandler>> {
  const h = (
    type: RecordingCommandType,
    fn: (payload: Record<string, unknown>) => unknown,
  ): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute: async (c: RuntimeCommand) => ({
      status: 'SUCCEEDED',
      value: fn((c.payload ?? {}) as Record<string, unknown>),
    }),
  });
  return {
    RECORDING_REGISTER_BACKEND: h('RECORDING_REGISTER_BACKEND', () => ({
      registered: false,
      reason: 'synthetic backend is built in',
    })),
    RECORDING_UNREGISTER_BACKEND: h('RECORDING_UNREGISTER_BACKEND', (p) =>
      engine.unregisterBackend(String(p.backendId)),
    ),
    RECORDING_REGISTER_PROFILE: h('RECORDING_REGISTER_PROFILE', (p) =>
      engine.registerProfile(p.profile as RecordingProfile),
    ),
    RECORDING_UPDATE_PROFILE: h('RECORDING_UPDATE_PROFILE', (p) =>
      engine.updateProfile(p.profile as RecordingProfile, Number(p.expectedGeneration)),
    ),
    RECORDING_UNREGISTER_PROFILE: h('RECORDING_UNREGISTER_PROFILE', (p) =>
      engine.unregisterProfile(String(p.profileId), Number(p.expectedGeneration)),
    ),
    RECORDING_REGISTER_DESTINATION: h('RECORDING_REGISTER_DESTINATION', (p) =>
      engine.registerDestination(p.destination as RecordingDestinationDefinition),
    ),
    RECORDING_UPDATE_DESTINATION: h('RECORDING_UPDATE_DESTINATION', (p) =>
      engine.updateDestination(
        p.destination as RecordingDestinationDefinition,
        Number(p.expectedGeneration),
      ),
    ),
    RECORDING_UNREGISTER_DESTINATION: h('RECORDING_UNREGISTER_DESTINATION', (p) =>
      engine.unregisterDestination(String(p.destinationId), Number(p.expectedGeneration)),
    ),
    RECORDING_CREATE_SESSION: h('RECORDING_CREATE_SESSION', (p) =>
      engine.createSession(p.session as RecordingSessionDefinition),
    ),
    RECORDING_UPDATE_SESSION: h('RECORDING_UPDATE_SESSION', () => ({
      updated: false,
      reason: 'session replacement remains generation-protected metadata',
    })),
    RECORDING_DESTROY_SESSION: h('RECORDING_DESTROY_SESSION', (p) =>
      engine.abort(String(p.recordingSessionId)),
    ),
    RECORDING_BIND_SOURCE: h('RECORDING_BIND_SOURCE', (p) =>
      engine.bindSource(p.binding as RecordingSourceBinding),
    ),
    RECORDING_UNBIND_SOURCE: h('RECORDING_UNBIND_SOURCE', (p) =>
      engine.unbindSource(String(p.bindingId), Number(p.expectedGeneration)),
    ),
    RECORDING_START: h('RECORDING_START', (p) => engine.start(String(p.recordingSessionId))),
    RECORDING_PAUSE: h('RECORDING_PAUSE', (p) => engine.pause(String(p.recordingSessionId))),
    RECORDING_RESUME: h('RECORDING_RESUME', (p) => engine.resume(String(p.recordingSessionId))),
    RECORDING_STOP: h('RECORDING_STOP', (p) => engine.stop(String(p.recordingSessionId))),
    RECORDING_ABORT: h('RECORDING_ABORT', (p) => engine.abort(String(p.recordingSessionId))),
    RECORDING_SUBMIT_PACKAGE: h('RECORDING_SUBMIT_PACKAGE', (p) =>
      engine.submitPackage(p.packageInput as RecordingPackageInput),
    ),
    RECORDING_FORCE_ROLLOVER: h('RECORDING_FORCE_ROLLOVER', (p) =>
      engine.rollover(String(p.recordingSessionId)),
    ),
    RECORDING_FORCE_SPLIT: h('RECORDING_FORCE_SPLIT', (p) =>
      engine.forceSplit(String(p.recordingSessionId)),
    ),
    RECORDING_ADD_MARKER: h('RECORDING_ADD_MARKER', (p) =>
      engine.addMarker(String(p.recordingSessionId), String(p.markerId ?? 'marker')),
    ),
    RECORDING_DRAIN: h('RECORDING_DRAIN', (p) => engine.drain(String(p.recordingSessionId))),
    RECORDING_FINALIZE: h('RECORDING_FINALIZE', (p) =>
      engine.finalize(String(p.recordingSessionId)),
    ),
    RECORDING_RECOVER: h('RECORDING_RECOVER', (p) => engine.recover(String(p.recordingSessionId))),
    RECORDING_RESET_SESSION: h('RECORDING_RESET_SESSION', (p) =>
      engine.resetSession(String(p.recordingSessionId)),
    ),
    RECORDING_RECONFIGURE: h('RECORDING_RECONFIGURE', () => ({
      reconfigured: false,
      reason: 'synthetic backend has no mutable native state',
    })),
    RECORDING_SET_STORAGE_POLICY: h('RECORDING_SET_STORAGE_POLICY', (p) => ({
      policy: sanitizeMetadata(p.policy as Record<string, unknown>),
      metadataOnly: true,
    })),
    RECORDING_SET_QUEUE_POLICY: h('RECORDING_SET_QUEUE_POLICY', (p) => ({
      policy: sanitizeMetadata(p.policy as Record<string, unknown>),
      metadataOnly: true,
    })),
    RECORDING_CLEAR_PLAN_CACHE: h('RECORDING_CLEAR_PLAN_CACHE', () => ({ cleared: true })),
    RECORDING_VALIDATE: h('RECORDING_VALIDATE', () => engine.assertInvariants()),
    RECORDING_SHUTDOWN: h('RECORDING_SHUTDOWN', () => engine.shutdown()),
  };
}
