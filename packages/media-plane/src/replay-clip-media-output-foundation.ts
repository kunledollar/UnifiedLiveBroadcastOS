import type {
  FrameTick,
  ProcessorRuntimeContext,
  TickProcessor,
  TickProcessorDescriptor,
  RuntimeCommand,
  RuntimeCommandHandler,
} from './execution-engine.js';
import type {
  ReplayAssemblyReadinessState,
  ReplayAssemblySourceType,
  ReplayClipAssemblyPlan,
  ReplayClipAssemblyResult,
  ReplayClipAudioPolicy,
  ReplayClipGraphicsPolicy,
  ReplayClipSegment,
  ReplayClipTransitionPolicy,
} from './replay-playlist-highlight-clip-assembly.js';

export const REPLAY_MEDIA_OUTPUT_VERSION = '5.8.5';
export const REPLAY_MEDIA_OUTPUT_PROCESSOR_ORDER = 1150;
export const REPLAY_MEDIA_OUTPUT_OUTPUT_KEYS = {
  renderProfiles: 'replay.mediaOutput.renderProfiles',
  exportProfiles: 'replay.mediaOutput.exportProfiles',
  deliveryProfiles: 'replay.mediaOutput.deliveryProfiles',
  destinationReferences: 'replay.mediaOutput.destinations',
  renderJobs: 'replay.mediaOutput.renderJobs',
  renderRequests: 'replay.mediaOutput.renderRequests',
  renderPlans: 'replay.mediaOutput.renderPlans',
  renderResults: 'replay.mediaOutput.renderResults',
  artifacts: 'replay.mediaOutput.artifacts',
  exportJobs: 'replay.mediaOutput.exportJobs',
  exportRequests: 'replay.mediaOutput.exportRequests',
  exportPlans: 'replay.mediaOutput.exportPlans',
  exportResults: 'replay.mediaOutput.exportResults',
  exportReceipts: 'replay.mediaOutput.exportReceipts',
  deliveryJobs: 'replay.mediaOutput.deliveryJobs',
  deliveryRequests: 'replay.mediaOutput.deliveryRequests',
  deliveryPlans: 'replay.mediaOutput.deliveryPlans',
  deliveryResults: 'replay.mediaOutput.deliveryResults',
  deliveryReceipts: 'replay.mediaOutput.deliveryReceipts',
  namingPolicies: 'replay.mediaOutput.namingPolicies',
  manifests: 'replay.mediaOutput.manifests',
  progress: 'replay.mediaOutput.progress',
  leases: 'replay.mediaOutput.leases',
  queues: 'replay.mediaOutput.queues',
  transactions: 'replay.mediaOutput.transactions',
  health: 'replay.mediaOutput.health',
  telemetry: 'replay.mediaOutput.telemetry',
  backendHealth: 'replay.mediaOutput.backendHealth',
  failedResults: 'replay.mediaOutput.failedResults',
} as const;
export const REPLAY_MEDIA_OUTPUT_COMMAND_TYPES = [
  'REPLAY_MEDIA_OUTPUT_REGISTER_BACKEND',
  'REPLAY_MEDIA_OUTPUT_UNREGISTER_BACKEND',
  'REPLAY_RENDER_REGISTER_PROFILE',
  'REPLAY_RENDER_UPDATE_PROFILE',
  'REPLAY_RENDER_REMOVE_PROFILE',
  'REPLAY_EXPORT_REGISTER_PROFILE',
  'REPLAY_EXPORT_UPDATE_PROFILE',
  'REPLAY_EXPORT_REMOVE_PROFILE',
  'REPLAY_DELIVERY_REGISTER_PROFILE',
  'REPLAY_DELIVERY_UPDATE_PROFILE',
  'REPLAY_DELIVERY_REMOVE_PROFILE',
  'REPLAY_DELIVERY_REGISTER_DESTINATION_REFERENCE',
  'REPLAY_DELIVERY_UPDATE_DESTINATION_REFERENCE',
  'REPLAY_DELIVERY_REMOVE_DESTINATION_REFERENCE',
  'REPLAY_RENDER_CREATE_JOB',
  'REPLAY_RENDER_UPDATE_JOB',
  'REPLAY_RENDER_DESTROY_JOB',
  'REPLAY_RENDER_SUBMIT',
  'REPLAY_RENDER_CANCEL',
  'REPLAY_RENDER_RETRY',
  'REPLAY_EXPORT_CREATE_JOB',
  'REPLAY_EXPORT_UPDATE_JOB',
  'REPLAY_EXPORT_DESTROY_JOB',
  'REPLAY_EXPORT_SUBMIT',
  'REPLAY_EXPORT_CANCEL',
  'REPLAY_EXPORT_RETRY',
  'REPLAY_DELIVERY_CREATE_JOB',
  'REPLAY_DELIVERY_UPDATE_JOB',
  'REPLAY_DELIVERY_DESTROY_JOB',
  'REPLAY_DELIVERY_SUBMIT',
  'REPLAY_DELIVERY_CANCEL',
  'REPLAY_DELIVERY_RETRY',
  'REPLAY_MEDIA_OUTPUT_CREATE_MANIFEST',
  'REPLAY_MEDIA_OUTPUT_UPDATE_NAMING_POLICY',
  'REPLAY_MEDIA_OUTPUT_DRAIN',
  'REPLAY_MEDIA_OUTPUT_RESET',
  'REPLAY_MEDIA_OUTPUT_RECONFIGURE',
  'REPLAY_MEDIA_OUTPUT_CLEAR_PLAN_CACHE',
  'REPLAY_MEDIA_OUTPUT_VALIDATE',
  'REPLAY_MEDIA_OUTPUT_SHUTDOWN',
] as const;
export type ReplayMediaOutputCommandType = (typeof REPLAY_MEDIA_OUTPUT_COMMAND_TYPES)[number];
export const REPLAY_MEDIA_OUTPUT_EVENTS = [
  'ReplayClipMediaOutputEngineCreated',
  'ReplayClipMediaOutputBackendRegistered',
  'ReplayClipMediaOutputBackendRemoved',
  'ReplayRenderProfileRegistered',
  'ReplayExportProfileRegistered',
  'ReplayDeliveryProfileRegistered',
  'ReplayRenderJobCreated',
  'ReplayRenderJobValidated',
  'ReplayRenderJobQueued',
  'ReplayRenderPlanCreated',
  'ReplayRenderMetadataCompleted',
  'ReplayExportJobCreated',
  'ReplayExportPlanCreated',
  'ReplayExportMetadataCompleted',
  'ReplayDeliveryJobCreated',
  'ReplayDeliveryPlanCreated',
  'ReplayDeliveryMetadataCompleted',
  'ReplayMediaManifestCreated',
  'ReplayMediaJobProgressChanged',
  'ReplayMediaJobRetrying',
  'ReplayMediaJobCancelled',
  'ReplayMediaJobDegraded',
  'ReplayMediaJobFailed',
  'ReplayClipMediaOutputHealthChanged',
  'ReplayClipMediaOutputEngineShutdown',
] as const;
export const REPLAY_MEDIA_OUTPUT_WATCHDOG_INCIDENTS = [
  'REPLAY_MEDIA_OUTPUT_ENGINE_STALLED',
  'REPLAY_MEDIA_OUTPUT_REQUEST_TIMEOUT',
  'REPLAY_MEDIA_OUTPUT_DUPLICATE_REQUEST',
  'REPLAY_MEDIA_OUTPUT_DUPLICATE_JOB',
  'REPLAY_MEDIA_OUTPUT_DUPLICATE_RESULT',
  'REPLAY_RENDER_JOB_GENERATION_STALE',
  'REPLAY_EXPORT_JOB_GENERATION_STALE',
  'REPLAY_DELIVERY_JOB_GENERATION_STALE',
  'REPLAY_RENDER_PROFILE_GENERATION_STALE',
  'REPLAY_EXPORT_PROFILE_GENERATION_STALE',
  'REPLAY_DELIVERY_PROFILE_GENERATION_STALE',
  'REPLAY_ARTIFACT_GENERATION_STALE',
  'REPLAY_MANIFEST_GENERATION_STALE',
  'REPLAY_DESTINATION_REFERENCE_GENERATION_STALE',
  'REPLAY_SOURCE_ASSEMBLY_GENERATION_STALE',
  'REPLAY_REQUIRED_SOURCE_MISSING',
  'REPLAY_SOURCE_RANGE_EVICTED',
  'REPLAY_CODEC_INCOMPATIBLE',
  'REPLAY_CONTAINER_INCOMPATIBLE',
  'REPLAY_RENDER_REQUIREMENT_UNSUPPORTED',
  'REPLAY_ENCODER_DELEGATION_INVALID',
  'REPLAY_PACKAGING_DELEGATION_INVALID',
  'REPLAY_EXPORT_DESTINATION_UNAVAILABLE',
  'REPLAY_DELIVERY_DESTINATION_UNAVAILABLE',
  'REPLAY_OUTPUT_NAME_INVALID',
  'REPLAY_OUTPUT_NAME_COLLISION',
  'REPLAY_MANIFEST_INVALID',
  'REPLAY_PROGRESS_REGRESSION',
  'REPLAY_MEDIA_OUTPUT_QUEUE_OVERFLOW',
  'REPLAY_MEDIA_OUTPUT_RETRY_EXHAUSTED',
  'REPLAY_MEDIA_OUTPUT_BACKEND_FAILED',
  'REPLAY_MEDIA_OUTPUT_OWNERSHIP_VIOLATION',
  'REPLAY_MEDIA_OUTPUT_OUTPUT_REGISTRY_MISMATCH',
  'REPLAY_MEDIA_OUTPUT_SOURCE_GRAPH_MISMATCH',
  'REPLAY_MEDIA_OUTPUT_REDACTION_FAILURE',
  'REPLAY_MEDIA_OUTPUT_INVARIANT_FAILURE',
] as const;
export type ReplayMediaOutputWatchdogIncident =
  (typeof REPLAY_MEDIA_OUTPUT_WATCHDOG_INCIDENTS)[number];

export type ReplayRenderJobType =
  | 'CLIP_RENDER'
  | 'HIGHLIGHT_RENDER'
  | 'PLAYLIST_RENDER'
  | 'EVENT_PACKAGE_RENDER'
  | 'PROGRAM_SUMMARY_RENDER'
  | 'SOCIAL_CLIP_RENDER_METADATA'
  | 'ARCHIVE_RENDER_METADATA'
  | 'PROXY_RENDER_METADATA'
  | 'THUMBNAIL_RENDER_METADATA'
  | 'AUDIO_ONLY_RENDER_METADATA'
  | 'CUSTOM_TYPED';
export type ReplayOutputContainer =
  | 'MP4'
  | 'MOV'
  | 'MPEG_TS'
  | 'MATROSKA'
  | 'WEBM'
  | 'HLS_PACKAGE_METADATA'
  | 'DASH_PACKAGE_METADATA'
  | 'AUDIO_ONLY_CONTAINER_METADATA'
  | 'IMAGE_SEQUENCE_METADATA'
  | 'CUSTOM';
export type ReplayVideoCodec =
  | 'H264'
  | 'H265_METADATA'
  | 'AV1_METADATA'
  | 'VP9_METADATA'
  | 'PRORES_METADATA'
  | 'DNX_METADATA'
  | 'RAW_METADATA'
  | 'NONE'
  | 'CUSTOM';
export type ReplayAudioCodec =
  'AAC' | 'PCM_METADATA' | 'OPUS_METADATA' | 'MP3_METADATA' | 'FLAC_METADATA' | 'NONE' | 'CUSTOM';
export type ReplayExportMode =
  | 'LOCAL_REFERENCE_METADATA'
  | 'ARCHIVE_REFERENCE_METADATA'
  | 'OBJECT_STORAGE_REFERENCE_METADATA'
  | 'CDN_REFERENCE_METADATA'
  | 'DOWNLOAD_REFERENCE_METADATA'
  | 'STREAMING_HANDOFF_METADATA'
  | 'SOCIAL_DELIVERY_HANDOFF_METADATA'
  | 'CUSTOM';
export type ReplayMediaDeliveryType =
  | 'ARCHIVE_METADATA'
  | 'DOWNLOAD_METADATA'
  | 'OBJECT_STORAGE_METADATA'
  | 'CDN_METADATA'
  | 'STREAMING_METADATA'
  | 'SOCIAL_PLATFORM_METADATA'
  | 'INTERNAL_LIBRARY_METADATA'
  | 'REVIEW_LINK_METADATA'
  | 'CUSTOM';
export type ReplayRenderJobState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'QUEUED'
  | 'PREPARING'
  | 'RENDERING_METADATA'
  | 'ENCODING_METADATA'
  | 'PACKAGING_METADATA'
  | 'FINALIZING_METADATA'
  | 'COMPLETE_METADATA'
  | 'DEGRADED'
  | 'RETRY_WAIT'
  | 'CANCELLED'
  | 'FAILED'
  | 'DESTROYED'
  | 'SHUTDOWN';
export type ReplayExportJobState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'QUEUED'
  | 'EXPORTING_METADATA'
  | 'FINALIZING_METADATA'
  | 'COMPLETE_METADATA'
  | 'DEGRADED'
  | 'CANCELLED'
  | 'FAILED'
  | 'DESTROYED'
  | 'SHUTDOWN';
export type ReplayMediaDeliveryJobState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'QUEUED'
  | 'PREPARING_METADATA'
  | 'DELIVERING_METADATA'
  | 'RETRY_WAIT'
  | 'COMPLETE_METADATA'
  | 'DEGRADED'
  | 'CANCELLED'
  | 'FAILED'
  | 'DESTROYED'
  | 'SHUTDOWN';
export type ReplayMediaOutputResultStatus =
  | 'VALIDATED'
  | 'QUEUED'
  | 'PLANNED'
  | 'COMPLETE_METADATA'
  | 'DEGRADED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED';
export type ReplayArtifactType =
  | 'VIDEO_CLIP_METADATA'
  | 'AUDIO_CLIP_METADATA'
  | 'HIGHLIGHT_PACKAGE_METADATA'
  | 'PLAYLIST_PACKAGE_METADATA'
  | 'PROXY_METADATA'
  | 'THUMBNAIL_METADATA'
  | 'CAPTION_SIDECAR_METADATA'
  | 'METADATA_SIDECAR'
  | 'MANIFEST'
  | 'CUSTOM';
export type ReplayOutputCollisionPolicy =
  | 'REJECT'
  | 'APPEND_REVISION'
  | 'APPEND_SEQUENCE'
  | 'APPEND_METADATA_HASH'
  | 'REPLACE_METADATA_ONLY'
  | 'CUSTOM';
export type ReplayMediaRetryFailurePolicy =
  | 'FAIL_FAST'
  | 'RETRY_BOUNDED'
  | 'DEGRADE_OPTIONAL_OUTPUT'
  | 'PRESERVE_PRIMARY_ARTIFACT_METADATA'
  | 'SKIP_OPTIONAL_DELIVERY'
  | 'OPERATOR_REQUIRED'
  | 'CUSTOM';
export type ReplayMediaJobProgressStage =
  | 'VALIDATION'
  | 'PREPARATION'
  | 'RENDER_METADATA'
  | 'ENCODE_METADATA'
  | 'PACKAGE_METADATA'
  | 'EXPORT_METADATA'
  | 'DELIVERY_METADATA'
  | 'FINALIZATION'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';
export type ReplayMediaJobClass = 'RENDER' | 'EXPORT' | 'DELIVERY';
export type ReplayMediaJobLeaseOwner =
  | 'RENDER_JOB_OWNED'
  | 'RENDER_PLAN_LEASED'
  | 'ARTIFACT_METADATA_OWNED'
  | 'EXPORT_JOB_OWNED'
  | 'DELIVERY_JOB_OWNED'
  | 'DOWNSTREAM_BORROWED'
  | 'RELEASED';
export type SafeMetadata = Readonly<Record<string, unknown>>;
export interface ReplayGenerationRef {
  readonly id: string;
  readonly generation: number;
}
export interface ReplayOutputNamingPolicy {
  readonly prefixMetadata: string;
  readonly suffixMetadata: string;
  readonly includeClipName: boolean;
  readonly eventNameMetadata?: string;
  readonly includeRevision: boolean;
  readonly timestampMetadata?: string;
  readonly includeAspectRatio: boolean;
  readonly includeCodec: boolean;
  readonly containerExtensionMetadata: string;
  readonly collisionPolicy: ReplayOutputCollisionPolicy;
  readonly sanitizationPolicy: 'STRICT_METADATA_SAFE' | 'CUSTOM';
  readonly maximumLength: number;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayRenderProfile {
  readonly renderProfileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly jobTypes: readonly ReplayRenderJobType[];
  readonly sourceAssemblyTypes: readonly ReplayAssemblySourceType[];
  readonly outputRole: string;
  readonly aspectRatioRole: string;
  readonly outputWidth: number;
  readonly outputHeight: number;
  readonly frameRate: number;
  readonly videoCodec: ReplayVideoCodec;
  readonly audioCodec: ReplayAudioCodec;
  readonly container: ReplayOutputContainer;
  readonly videoBitratePolicy: string;
  readonly audioBitratePolicy: string;
  readonly sampleRate: number;
  readonly channelLayout: string;
  readonly pixelFormatMetadata: string;
  readonly colorSpaceMetadata: string;
  readonly transferFunctionMetadata: string;
  readonly colorRangeMetadata: string;
  readonly alphaPolicy: string;
  readonly graphicsPolicy: ReplayClipGraphicsPolicy;
  readonly transitionPolicy: ReplayClipTransitionPolicy;
  readonly captionPolicy: string;
  readonly audioPolicy: ReplayClipAudioPolicy;
  readonly variableSpeedPolicy: string;
  readonly encoderProfileReference?: ReplayGenerationRef;
  readonly packagingProfileReference?: ReplayGenerationRef;
  readonly qualityTier: string;
  readonly backendPreference?: string;
  readonly enabled: boolean;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface ReplayExportProfile {
  readonly exportProfileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly renderProfileId: string;
  readonly renderProfileGeneration: number;
  readonly exportMode: ReplayExportMode;
  readonly outputNamingPolicy: ReplayOutputNamingPolicy;
  readonly destinationReferencePolicy: string;
  readonly overwritePolicy: string;
  readonly revisionPolicy: string;
  readonly checksumPolicy: string;
  readonly manifestPolicy: string;
  readonly metadataSidecarPolicy: string;
  readonly thumbnailPolicyMetadata: string;
  readonly waveformPolicyMetadata: string;
  readonly proxyPolicyMetadata: string;
  readonly retentionPolicyMetadata: string;
  readonly deliveryHandoffPolicy: string;
  readonly enabled: boolean;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface ReplayDeliveryDestinationReference {
  readonly destinationRefId: string;
  readonly generation: number;
  readonly destinationClass: string;
  readonly providerMetadata: string;
  readonly redactedIdentifier: string;
  readonly available: boolean;
  readonly authorizationReferenceMetadata?: string;
  readonly expirationMetadata?: string;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayMediaDeliveryProfile {
  readonly deliveryProfileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly deliveryType: ReplayMediaDeliveryType;
  readonly exportProfileId: string;
  readonly exportProfileGeneration: number;
  readonly destinationClass: string;
  readonly destinationReference: ReplayGenerationRef;
  readonly streamingProfileReference?: ReplayGenerationRef;
  readonly distributionProfileReference?: ReplayGenerationRef;
  readonly socialDestinationProfileReference?: ReplayGenerationRef;
  readonly required: boolean;
  readonly priority: number;
  readonly retryPolicy: ReplayMediaRetryFailurePolicy;
  readonly failurePolicy: ReplayMediaRetryFailurePolicy;
  readonly completionPolicy: string;
  readonly receiptPolicy: string;
  readonly authorizationReferenceMetadata?: string;
  readonly expiryMetadata?: string;
  readonly enabled: boolean;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface ReplayRenderJobDefinition {
  readonly renderJobId: string;
  readonly jobVersion: string;
  readonly jobGeneration: number;
  readonly jobType: ReplayRenderJobType;
  readonly sourceClipId?: string;
  readonly sourceClipGeneration?: number;
  readonly sourceHighlightId?: string;
  readonly sourceHighlightGeneration?: number;
  readonly sourcePlaylistId?: string;
  readonly sourcePlaylistGeneration?: number;
  readonly sourceAssemblyPlanId: string;
  readonly sourceAssemblyPlanGeneration: number;
  readonly sourceAssemblyResultId: string;
  readonly sourceAssemblyResultGeneration: number;
  readonly renderProfileId: string;
  readonly renderProfileGeneration: number;
  readonly expectedSourceGenerations: readonly ReplayGenerationRef[];
  readonly outputArtifactRole: string;
  readonly priority: number;
  readonly deadlineMetadata?: string;
  readonly retryPolicy: ReplayMediaRetryFailurePolicy;
  readonly failurePolicy: ReplayMediaRetryFailurePolicy;
  readonly enabled: boolean;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface ReplayRenderRequest {
  readonly requestId: string;
  readonly renderJobId: string;
  readonly expectedRenderJobGeneration: number;
  readonly expectedRenderProfileGeneration: number;
  readonly expectedAssemblyPlanGeneration: number;
  readonly expectedAssemblyResultGeneration: number;
  readonly expectedClipGeneration?: number;
  readonly expectedHighlightGeneration?: number;
  readonly expectedPlaylistGeneration?: number;
  readonly expectedSourceGenerations: readonly ReplayGenerationRef[];
  readonly expectedSpeedProfileGenerations: readonly ReplayGenerationRef[];
  readonly expectedTransitionGenerations: readonly ReplayGenerationRef[];
  readonly expectedGraphicsGenerations: readonly ReplayGenerationRef[];
  readonly expectedEncoderGenerationMetadata?: ReplayGenerationRef;
  readonly expectedPackagingGenerationMetadata?: ReplayGenerationRef;
  readonly expectedTimelineGeneration: number;
  readonly requestedRuntimeFrame: number;
  readonly deadlineNs?: number;
  readonly cancellationReference?: string;
  readonly correlationId?: string;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayRenderedArtifactMetadata {
  readonly artifactId: string;
  readonly artifactVersion: string;
  readonly artifactGeneration: number;
  readonly renderJobId: string;
  readonly renderJobGeneration: number;
  readonly sourceAssemblyId: string;
  readonly sourceAssemblyGeneration: number;
  readonly artifactType: ReplayArtifactType;
  readonly outputRole: string;
  readonly aspectRatioRole: string;
  readonly width: number;
  readonly height: number;
  readonly frameRate: number;
  readonly videoCodec: ReplayVideoCodec;
  readonly audioCodec: ReplayAudioCodec;
  readonly container: ReplayOutputContainer;
  readonly sourceDuration: number;
  readonly effectiveDuration: number;
  readonly estimatedBytes: number;
  readonly metadataChecksum: string;
  readonly contentChecksumUnavailableMetadata: string;
  readonly manifestReference: ReplayGenerationRef;
  readonly filenameMetadata: string;
  readonly revisionMetadata: string;
  readonly metadataOnly: true;
  readonly realMediaArtifact: false;
  readonly available: boolean;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
}
export interface ReplayMediaManifest {
  readonly manifestId: string;
  readonly manifestVersion: string;
  readonly manifestGeneration: number;
  readonly artifactId: string;
  readonly artifactGeneration: number;
  readonly sourceReferences: readonly ReplayGenerationRef[];
  readonly sourceSegmentReferences: readonly ReplayGenerationRef[];
  readonly sourceRangeReferences: readonly string[];
  readonly renderProfileReference: ReplayGenerationRef;
  readonly exportProfileReference?: ReplayGenerationRef;
  readonly outputSpecification: SafeMetadata;
  readonly durationMetadata: string;
  readonly estimatedByteMetadata: string;
  readonly transitionGraphicsAudioSummaries: readonly string[];
  readonly variableSpeedSummaries: readonly string[];
  readonly lineageSummary: string;
  readonly revisionSummary: string;
  readonly metadataChecksum: string;
  readonly contentChecksumUnavailable: true;
  readonly metadataOnly: true;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
}
export interface ReplayRenderPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly renderJobId: string;
  readonly renderJobGeneration: number;
  readonly sourceAssemblySummary: string;
  readonly orderedSegmentSummaries: readonly string[];
  readonly renderProfileSummary: string;
  readonly outputVideoSpecification: SafeMetadata;
  readonly outputAudioSpecification: SafeMetadata;
  readonly colorSpecification: SafeMetadata;
  readonly alphaSpecification: SafeMetadata;
  readonly graphicsRequirements: string;
  readonly transitionRequirements: string;
  readonly captionRequirements: string;
  readonly variableSpeedRequirements: string;
  readonly encoderDelegationPlan: SafeMetadata;
  readonly packagingDelegationPlan: SafeMetadata;
  readonly temporaryResourceEstimateMetadata: string;
  readonly ownershipPlan: string;
  readonly progressStagePlan: readonly ReplayMediaJobProgressStage[];
  readonly outputArtifactPlan: ReplayRenderedArtifactMetadata;
  readonly metadataManifestPlan: ReplayMediaManifest;
  readonly operationOrder: readonly string[];
  readonly deterministicScore: string;
  readonly warnings: readonly string[];
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayRenderResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: ReplayMediaOutputResultStatus;
  readonly runtimeFrame: number;
  readonly renderJobId: string;
  readonly renderJobGeneration: number;
  readonly artifactMetadata?: ReplayRenderedArtifactMetadata;
  readonly encoderDelegationStatus: string;
  readonly packagingDelegationStatus: string;
  readonly progressSummary: string;
  readonly metadataOnly: true;
  readonly realRendering: false;
  readonly realEncoding: false;
  readonly realMuxing: false;
  readonly realFileOutput: false;
  readonly warnings: readonly string[];
  readonly completedAtNs: number;
}
export interface ReplayExportJobDefinition {
  readonly exportJobId: string;
  readonly jobVersion: string;
  readonly jobGeneration: number;
  readonly renderArtifactId: string;
  readonly renderArtifactGeneration: number;
  readonly exportProfileId: string;
  readonly exportProfileGeneration: number;
  readonly destinationReferenceId: string;
  readonly destinationReferenceGeneration: number;
  readonly outputNamingMetadata: string;
  readonly revisionMetadata: string;
  readonly manifestRequirement: string;
  readonly sidecarRequirements: readonly string[];
  readonly overwritePolicy: string;
  readonly retentionPolicy: string;
  readonly deliveryHandoffPolicy: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface ReplayExportRequest {
  readonly requestId: string;
  readonly exportJobId: string;
  readonly expectedExportJobGeneration: number;
  readonly expectedArtifactGeneration: number;
  readonly expectedExportProfileGeneration: number;
  readonly expectedDestinationReferenceGeneration: number;
  readonly expectedManifestGeneration: number;
  readonly requestedRuntimeFrame: number;
  readonly deadlineNs?: number;
  readonly cancellationReference?: string;
  readonly correlationId?: string;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayExportReceipt {
  readonly receiptId: string;
  readonly receiptGeneration: number;
  readonly exportJobId: string;
  readonly exportJobGeneration: number;
  readonly artifactId: string;
  readonly artifactGeneration: number;
  readonly exportMode: ReplayExportMode;
  readonly destinationClass: string;
  readonly redactedDestinationReference: string;
  readonly outputNameMetadata: string;
  readonly revision: string;
  readonly manifestReference: ReplayGenerationRef;
  readonly metadataChecksum: string;
  readonly availableMetadata: boolean;
  readonly metadataOnly: true;
  readonly realFileOutput: false;
  readonly realUpload: false;
  readonly completedAtNs: number;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayExportPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly exportJobId: string;
  readonly exportJobGeneration: number;
  readonly artifactSummary: string;
  readonly exportProfileSummary: string;
  readonly destinationReferenceSummary: string;
  readonly outputNamingResult: string;
  readonly revisionResult: string;
  readonly overwriteDecision: string;
  readonly manifestAction: string;
  readonly sidecarAction: string;
  readonly retentionAction: string;
  readonly deliveryHandoffAction: string;
  readonly ownershipAction: string;
  readonly operationOrder: readonly string[];
  readonly deterministicScore: string;
  readonly warnings: readonly string[];
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayExportResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: Exclude<ReplayMediaOutputResultStatus, 'QUEUED' | 'RETRYING'>;
  readonly runtimeFrame: number;
  readonly exportJobId: string;
  readonly exportJobGeneration: number;
  readonly artifactId: string;
  readonly artifactGeneration: number;
  readonly receipt?: ReplayExportReceipt;
  readonly metadataOnly: true;
  readonly realFileOutput: false;
  readonly realUpload: false;
  readonly warnings: readonly string[];
  readonly completedAtNs: number;
}
export interface ReplayMediaDeliveryJobDefinition {
  readonly deliveryJobId: string;
  readonly jobVersion: string;
  readonly jobGeneration: number;
  readonly exportReceiptId: string;
  readonly exportReceiptGeneration: number;
  readonly deliveryProfileId: string;
  readonly deliveryProfileGeneration: number;
  readonly destinationReferenceId: string;
  readonly destinationReferenceGeneration: number;
  readonly streamingReference?: ReplayGenerationRef;
  readonly distributionReference?: ReplayGenerationRef;
  readonly socialReference?: ReplayGenerationRef;
  readonly required: boolean;
  readonly priority: number;
  readonly retryPolicy: ReplayMediaRetryFailurePolicy;
  readonly failurePolicy: ReplayMediaRetryFailurePolicy;
  readonly completionPolicy: string;
  readonly enabled: boolean;
  readonly safeMetadata?: SafeMetadata;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export interface ReplayMediaDeliveryRequest {
  readonly requestId: string;
  readonly deliveryJobId: string;
  readonly expectedDeliveryJobGeneration: number;
  readonly expectedExportReceiptGeneration: number;
  readonly expectedDeliveryProfileGeneration: number;
  readonly expectedDestinationReferenceGeneration: number;
  readonly expectedStreamingDistributionSocialGenerations: readonly ReplayGenerationRef[];
  readonly requestedRuntimeFrame: number;
  readonly deadlineNs?: number;
  readonly cancellationReference?: string;
  readonly correlationId?: string;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayMediaDeliveryReceipt {
  readonly receiptId: string;
  readonly receiptGeneration: number;
  readonly deliveryJobId: string;
  readonly deliveryJobGeneration: number;
  readonly exportReceiptId: string;
  readonly exportReceiptGeneration: number;
  readonly deliveryType: ReplayMediaDeliveryType;
  readonly destinationClass: string;
  readonly redactedDestinationReference: string;
  readonly underlyingStreamingResultReferenceMetadata: string | undefined;
  readonly underlyingDistributionResultReferenceMetadata: string | undefined;
  readonly underlyingSocialResultReferenceMetadata: string | undefined;
  readonly status: ReplayMediaOutputResultStatus;
  readonly attemptCount: number;
  readonly metadataOnly: true;
  readonly realDelivery: false;
  readonly realUpload: false;
  readonly realPlatformPublication: false;
  readonly completedAtNs: number;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayMediaDeliveryPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly deliveryJobId: string;
  readonly deliveryJobGeneration: number;
  readonly exportReceiptSummary: string;
  readonly deliveryProfileSummary: string;
  readonly destinationSummary: string;
  readonly deliveryType: ReplayMediaDeliveryType;
  readonly streamingDelegationMetadata: SafeMetadata;
  readonly distributionDelegationMetadata: SafeMetadata;
  readonly socialCoordinationDelegationMetadata: SafeMetadata;
  readonly retryPlan: string;
  readonly completionPolicy: string;
  readonly ownershipPlan: string;
  readonly operationOrder: readonly string[];
  readonly deterministicScore: string;
  readonly warnings: readonly string[];
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayMediaDeliveryResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: ReplayMediaOutputResultStatus;
  readonly runtimeFrame: number;
  readonly deliveryJobId: string;
  readonly deliveryJobGeneration: number;
  readonly deliveryReceipt?: ReplayMediaDeliveryReceipt;
  readonly metadataOnly: true;
  readonly realDelivery: false;
  readonly realUpload: false;
  readonly realPlatformPublication: false;
  readonly warnings: readonly string[];
  readonly completedAtNs: number;
}
export interface ReplayMediaJobProgressState {
  readonly progressId: string;
  readonly progressGeneration: number;
  readonly jobClass: ReplayMediaJobClass;
  readonly jobId: string;
  readonly jobGeneration: number;
  readonly stage: ReplayMediaJobProgressStage;
  readonly completedOperationCount: number;
  readonly totalOperationCount: number;
  readonly estimatedProgressNumerator: number;
  readonly estimatedProgressDenominator: number;
  readonly currentSegmentIndexMetadata?: number;
  readonly completedSegmentCount: number;
  readonly warningCount: number;
  readonly retryCount: number;
  readonly state: string;
  readonly metadataOnly: true;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayMediaJobLease {
  readonly leaseId: string;
  readonly jobClass: ReplayMediaJobClass;
  readonly jobId: string;
  readonly jobGeneration: number;
  readonly sourceReference?: ReplayGenerationRef;
  readonly owner: ReplayMediaJobLeaseOwner;
  readonly acquiredSequence: number;
  readonly expirationPolicy: string;
  readonly released: boolean;
  readonly releaseReason?: string;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayMediaOutputConfigurationTransaction {
  readonly transactionId: string;
  readonly transactionGeneration: number;
  readonly jobId: string;
  readonly currentGenerations: readonly ReplayGenerationRef[];
  readonly requestedGenerations: readonly ReplayGenerationRef[];
  readonly validationReport: ReplayClipMediaOutputValidationReport;
  readonly applicationBoundary: string;
  readonly state: 'CREATED' | 'COMMITTED' | 'CANCELLED' | 'FAILED';
  readonly failureReason?: string;
  readonly createdAtNs: number;
  readonly committedAtNs?: number;
  readonly completedAtNs?: number;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayClipMediaOutputValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedAtNs: number;
}
export interface ReplayClipMediaOutputCapabilities {
  readonly supportedJobTypes: readonly ReplayRenderJobType[];
  readonly supportedSourceAssemblyTypes: readonly ReplayAssemblySourceType[];
  readonly supportedCodecs: readonly ReplayVideoCodec[];
  readonly supportedAudioCodecs: readonly ReplayAudioCodec[];
  readonly supportedContainers: readonly ReplayOutputContainer[];
  readonly supportedAspectRatios: readonly string[];
  readonly supportedOutputRoles: readonly string[];
  readonly encoderDelegation: boolean;
  readonly packagingDelegation: boolean;
  readonly streamingHandoffMetadata: boolean;
  readonly distributionHandoffMetadata: boolean;
  readonly socialDeliveryHandoffMetadata: boolean;
  readonly manifestGeneration: boolean;
  readonly metadataChecksums: boolean;
  readonly realRendering: false;
  readonly realEncoding: false;
  readonly realMuxing: false;
  readonly realFileOutput: false;
  readonly realUpload: false;
  readonly realDelivery: false;
  readonly realPlatformPublication: false;
  readonly realThumbnailGeneration: false;
  readonly realWaveformGeneration: false;
  readonly deterministicBehavior: true;
  readonly maximumConcurrentJobs: number;
  readonly maximumQueuedJobs: number;
  readonly queueMemoryLimits: number;
  readonly safeMetadata?: SafeMetadata;
}
export interface ReplayClipMediaOutputBackend {
  readonly descriptor: {
    readonly backendId: string;
    readonly displayName: string;
    readonly generation: number;
  };
  readonly capabilities: ReplayClipMediaOutputCapabilities;
  initialize(): void;
  validateRenderProfile(profile: ReplayRenderProfile): ReplayClipMediaOutputValidationReport;
  createRenderPlan(input: {
    request: ReplayRenderRequest;
    job: ReplayRenderJobDefinition;
    profile: ReplayRenderProfile;
    assemblyPlan: ReplayClipAssemblyPlan;
    assemblyResult: ReplayClipAssemblyResult;
    nowNs: number;
  }): ReplayRenderPlan;
  createArtifactMetadata(plan: ReplayRenderPlan): ReplayRenderedArtifactMetadata;
  validateExportProfile(profile: ReplayExportProfile): ReplayClipMediaOutputValidationReport;
  createExportPlan(input: {
    request: ReplayExportRequest;
    job: ReplayExportJobDefinition;
    profile: ReplayExportProfile;
    artifact: ReplayRenderedArtifactMetadata;
    destination: ReplayDeliveryDestinationReference;
  }): ReplayExportPlan;
  createExportReceipt(input: {
    plan: ReplayExportPlan;
    job: ReplayExportJobDefinition;
    profile: ReplayExportProfile;
    artifact: ReplayRenderedArtifactMetadata;
    destination: ReplayDeliveryDestinationReference;
    nowNs: number;
  }): ReplayExportReceipt;
  validateDeliveryProfile(
    profile: ReplayMediaDeliveryProfile,
  ): ReplayClipMediaOutputValidationReport;
  createDeliveryPlan(input: {
    request: ReplayMediaDeliveryRequest;
    job: ReplayMediaDeliveryJobDefinition;
    profile: ReplayMediaDeliveryProfile;
    receipt: ReplayExportReceipt;
    destination: ReplayDeliveryDestinationReference;
  }): ReplayMediaDeliveryPlan;
  createDeliveryReceipt(input: {
    plan: ReplayMediaDeliveryPlan;
    job: ReplayMediaDeliveryJobDefinition;
    profile: ReplayMediaDeliveryProfile;
    receipt: ReplayExportReceipt;
    destination: ReplayDeliveryDestinationReference;
    nowNs: number;
  }): ReplayMediaDeliveryReceipt;
  updateProgress(progress: ReplayMediaJobProgressState): ReplayMediaJobProgressState;
  cancelJob(jobId: string): void;
  retryJob(jobId: string): void;
  reset(): void;
  drain(): void;
  reconfigure(): void;
  shutdown(): void;
}
export type ReplayRenderProfileSnapshot = ReplayRenderProfile;
export type ReplayExportProfileSnapshot = ReplayExportProfile;
export type ReplayMediaDeliveryProfileSnapshot = ReplayMediaDeliveryProfile;
export type ReplayDeliveryDestinationReferenceSnapshot = ReplayDeliveryDestinationReference;
export type ReplayRenderJobDefinitionSnapshot = ReplayRenderJobDefinition;
export interface ReplayRenderJobStateSnapshot {
  readonly jobId: string;
  readonly generation: number;
  readonly state: ReplayRenderJobState;
}
export type ReplayRenderRequestSnapshot = ReplayRenderRequest;
export type ReplayRenderPlanSnapshot = ReplayRenderPlan;
export type ReplayRenderedArtifactMetadataSnapshot = ReplayRenderedArtifactMetadata;
export type ReplayRenderResultSnapshot = ReplayRenderResult;
export type ReplayExportJobDefinitionSnapshot = ReplayExportJobDefinition;
export interface ReplayExportJobStateSnapshot {
  readonly jobId: string;
  readonly generation: number;
  readonly state: ReplayExportJobState;
}
export type ReplayExportRequestSnapshot = ReplayExportRequest;
export type ReplayExportPlanSnapshot = ReplayExportPlan;
export type ReplayExportReceiptSnapshot = ReplayExportReceipt;
export type ReplayExportResultSnapshot = ReplayExportResult;
export type ReplayMediaDeliveryJobDefinitionSnapshot = ReplayMediaDeliveryJobDefinition;
export interface ReplayMediaDeliveryJobStateSnapshot {
  readonly jobId: string;
  readonly generation: number;
  readonly state: ReplayMediaDeliveryJobState;
}
export type ReplayMediaDeliveryRequestSnapshot = ReplayMediaDeliveryRequest;
export type ReplayMediaDeliveryPlanSnapshot = ReplayMediaDeliveryPlan;
export type ReplayMediaDeliveryReceiptSnapshot = ReplayMediaDeliveryReceipt;
export type ReplayMediaDeliveryResultSnapshot = ReplayMediaDeliveryResult;
export type ReplayOutputNamingPolicySnapshot = ReplayOutputNamingPolicy;
export type ReplayMediaManifestSnapshot = ReplayMediaManifest;
export type ReplayMediaJobProgressSnapshot = ReplayMediaJobProgressState;
export type ReplayMediaJobLeaseSnapshot = ReplayMediaJobLease;
export interface ReplayMediaJobQueueSnapshot {
  readonly renderDepth: number;
  readonly exportDepth: number;
  readonly deliveryDepth: number;
  readonly retryDepth: number;
  readonly cancellationDepth: number;
  readonly maximumDepth: number;
}
export type ReplayMediaOutputConfigurationTransactionSnapshot =
  ReplayMediaOutputConfigurationTransaction;
export interface ReplayClipMediaOutputBackendSnapshot {
  readonly backendId: string;
  readonly generation: number;
  readonly capabilities: ReplayClipMediaOutputCapabilities;
}
export interface ReplayClipMediaOutputHealthSnapshot {
  readonly engineState: 'READY' | 'SHUTDOWN';
  readonly healthState: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  readonly backendCount: number;
  readonly renderProfileCount: number;
  readonly exportProfileCount: number;
  readonly deliveryProfileCount: number;
  readonly destinationReferenceCount: number;
  readonly renderJobCount: number;
  readonly exportJobCount: number;
  readonly deliveryJobCount: number;
  readonly queuedJobCount: number;
  readonly activeJobCount: number;
  readonly completedMetadataJobCount: number;
  readonly degradedJobCount: number;
  readonly failedJobCount: number;
  readonly cancelledJobCount: number;
  readonly renderPlanCount: number;
  readonly exportPlanCount: number;
  readonly deliveryPlanCount: number;
  readonly artifactMetadataCount: number;
  readonly manifestCount: number;
  readonly exportReceiptCount: number;
  readonly deliveryReceiptCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateJobCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly unsupportedCodecCount: number;
  readonly unsupportedContainerCount: number;
  readonly missingSourceCount: number;
  readonly evictedRangeCount: number;
  readonly encoderIncompatibilityCount: number;
  readonly packagingIncompatibilityCount: number;
  readonly deliveryUnavailableCount: number;
  readonly retryCount: number;
  readonly timeoutCount: number;
  readonly ownershipViolationCount: number;
  readonly activeLeaseCount: number;
  readonly queueDepth: number;
  readonly peakQueueDepth: number;
  readonly estimatedOutputBytesTotal: number;
  readonly lastCompletedArtifactId: string | undefined;
  readonly lastExportReceiptId: string | undefined;
  readonly lastDeliveryReceiptId: string | undefined;
  readonly lastFailure: string | undefined;
  readonly updatedAtNs: number;
}
export interface ReplayClipMediaOutputTelemetrySnapshot {
  readonly counters: SafeMetadata;
  readonly activeJobIds: readonly string[];
  readonly currentRequestIds: readonly string[];
  readonly lastEvent?: string;
  readonly healthSummary: string;
}
export interface ReplayClipMediaOutputEngineSnapshot {
  readonly version: string;
  readonly backends: readonly ReplayClipMediaOutputBackendSnapshot[];
  readonly renderProfiles: readonly ReplayRenderProfileSnapshot[];
  readonly exportProfiles: readonly ReplayExportProfileSnapshot[];
  readonly deliveryProfiles: readonly ReplayMediaDeliveryProfileSnapshot[];
  readonly destinationReferences: readonly ReplayDeliveryDestinationReferenceSnapshot[];
  readonly renderJobs: readonly ReplayRenderJobDefinitionSnapshot[];
  readonly exportJobs: readonly ReplayExportJobDefinitionSnapshot[];
  readonly deliveryJobs: readonly ReplayMediaDeliveryJobDefinitionSnapshot[];
  readonly renderPlans: readonly ReplayRenderPlanSnapshot[];
  readonly artifacts: readonly ReplayRenderedArtifactMetadataSnapshot[];
  readonly manifests: readonly ReplayMediaManifestSnapshot[];
  readonly exportPlans: readonly ReplayExportPlanSnapshot[];
  readonly exportReceipts: readonly ReplayExportReceiptSnapshot[];
  readonly deliveryPlans: readonly ReplayMediaDeliveryPlanSnapshot[];
  readonly deliveryReceipts: readonly ReplayMediaDeliveryReceiptSnapshot[];
  readonly progress: readonly ReplayMediaJobProgressSnapshot[];
  readonly leases: readonly ReplayMediaJobLeaseSnapshot[];
  readonly queue: ReplayMediaJobQueueSnapshot;
  readonly health: ReplayClipMediaOutputHealthSnapshot;
  readonly telemetry: ReplayClipMediaOutputTelemetrySnapshot;
}

export class ReplayClipMediaOutputError extends Error {
  constructor(
    readonly code: string,
    message = code,
  ) {
    super(message);
    this.name = code;
  }
}
const fail = (code: string, message?: string): never => {
  throw new ReplayClipMediaOutputError(code, message);
};
const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
        )
      : value,
  ) ?? 'null';
const checksum = (v: unknown): string => {
  let h = 2166136261;
  for (const ch of stable(v)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return `meta-${(h >>> 0).toString(16).padStart(8, '0')}`;
};
export function redactReplayMediaOutputIdentifier(raw: string): string {
  return `redacted:${checksum(raw).slice(5)}`;
}
const frozen = <T>(v: T): T => Object.freeze(v);
const assertPositive = (n: number, code: string): void => {
  if (!Number.isFinite(n) || n <= 0) fail(code);
};

export class SyntheticReplayClipMediaOutputBackend implements ReplayClipMediaOutputBackend {
  readonly descriptor = {
    backendId: 'synthetic-replay-media-output',
    displayName: 'Synthetic Replay Clip Media Output Backend',
    generation: 1,
  } as const;
  readonly capabilities: ReplayClipMediaOutputCapabilities = {
    supportedJobTypes: [
      'CLIP_RENDER',
      'HIGHLIGHT_RENDER',
      'PLAYLIST_RENDER',
      'EVENT_PACKAGE_RENDER',
      'PROGRAM_SUMMARY_RENDER',
      'SOCIAL_CLIP_RENDER_METADATA',
      'ARCHIVE_RENDER_METADATA',
      'PROXY_RENDER_METADATA',
      'THUMBNAIL_RENDER_METADATA',
      'AUDIO_ONLY_RENDER_METADATA',
      'CUSTOM_TYPED',
    ],
    supportedSourceAssemblyTypes: ['CLIP', 'HIGHLIGHT', 'PLAYLIST', 'EVENT_PACKAGE', 'CUSTOM'],
    supportedCodecs: [
      'H264',
      'H265_METADATA',
      'AV1_METADATA',
      'VP9_METADATA',
      'PRORES_METADATA',
      'DNX_METADATA',
      'RAW_METADATA',
      'NONE',
      'CUSTOM',
    ],
    supportedAudioCodecs: [
      'AAC',
      'PCM_METADATA',
      'OPUS_METADATA',
      'MP3_METADATA',
      'FLAC_METADATA',
      'NONE',
      'CUSTOM',
    ],
    supportedContainers: [
      'MP4',
      'MOV',
      'MPEG_TS',
      'MATROSKA',
      'WEBM',
      'HLS_PACKAGE_METADATA',
      'DASH_PACKAGE_METADATA',
      'AUDIO_ONLY_CONTAINER_METADATA',
      'IMAGE_SEQUENCE_METADATA',
      'CUSTOM',
    ],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '4:3', 'CUSTOM'],
    supportedOutputRoles: ['PROGRAM', 'SOCIAL', 'ARCHIVE', 'PROXY', 'THUMBNAIL', 'AUDIO', 'CUSTOM'],
    encoderDelegation: true,
    packagingDelegation: true,
    streamingHandoffMetadata: true,
    distributionHandoffMetadata: true,
    socialDeliveryHandoffMetadata: true,
    manifestGeneration: true,
    metadataChecksums: true,
    realRendering: false,
    realEncoding: false,
    realMuxing: false,
    realFileOutput: false,
    realUpload: false,
    realDelivery: false,
    realPlatformPublication: false,
    realThumbnailGeneration: false,
    realWaveformGeneration: false,
    deterministicBehavior: true,
    maximumConcurrentJobs: 16,
    maximumQueuedJobs: 10000,
    queueMemoryLimits: 8_000_000,
    safeMetadata: { synthetic: true },
  };
  initialize(): void {}
  validateRenderProfile(profile: ReplayRenderProfile): ReplayClipMediaOutputValidationReport {
    const errors: string[] = [];
    if (!this.capabilities.supportedCodecs.includes(profile.videoCodec))
      errors.push('ReplayMediaOutputCodecIncompatible');
    if (!this.capabilities.supportedAudioCodecs.includes(profile.audioCodec))
      errors.push('ReplayMediaOutputCodecIncompatible');
    if (!this.capabilities.supportedContainers.includes(profile.container))
      errors.push('ReplayMediaOutputContainerIncompatible');
    if (
      !Number.isFinite(profile.outputWidth) ||
      profile.outputWidth <= 0 ||
      !Number.isFinite(profile.outputHeight) ||
      profile.outputHeight <= 0
    )
      errors.push('ReplayRenderProfileInvalid:resolution');
    if (!Number.isFinite(profile.frameRate) || profile.frameRate <= 0)
      errors.push('ReplayRenderProfileInvalid:frameRate');
    if (!Number.isFinite(profile.sampleRate) || profile.sampleRate <= 0)
      errors.push('ReplayRenderProfileInvalid:sampleRate');
    return { valid: errors.length === 0, errors, warnings: [], checkedAtNs: profile.updatedAtNs };
  }
  createRenderPlan(input: {
    request: ReplayRenderRequest;
    job: ReplayRenderJobDefinition;
    profile: ReplayRenderProfile;
    assemblyPlan: ReplayClipAssemblyPlan;
    assemblyResult: ReplayClipAssemblyResult;
    nowNs: number;
  }): ReplayRenderPlan {
    const { request, job, profile, assemblyResult } = input;
    const duration =
      assemblyResult.orderedSegments.reduce((t, s) => t + Math.max(0, s.outFrame - s.inFrame), 0) /
      profile.frameRate;
    const estimatedBytes = Math.ceil(
      (duration * (Number.parseInt(profile.videoBitratePolicy, 10) || 1_000_000)) / 8,
    );
    const artifactId = checksum([
      'artifact',
      request.requestId,
      job.renderJobId,
      job.jobGeneration,
      profile.renderProfileId,
      profile.profileGeneration,
      assemblyResult.assemblyResultId,
    ]);
    const manifestId = checksum(['manifest', artifactId]);
    const artifact: ReplayRenderedArtifactMetadata = frozen({
      artifactId,
      artifactVersion: REPLAY_MEDIA_OUTPUT_VERSION,
      artifactGeneration: 1,
      renderJobId: job.renderJobId,
      renderJobGeneration: job.jobGeneration,
      sourceAssemblyId: assemblyResult.assemblyResultId,
      sourceAssemblyGeneration: assemblyResult.assemblyResultGeneration,
      artifactType: job.jobType.includes('THUMBNAIL')
        ? 'THUMBNAIL_METADATA'
        : job.jobType.includes('PROXY')
          ? 'PROXY_METADATA'
          : job.jobType.includes('AUDIO')
            ? 'AUDIO_CLIP_METADATA'
            : 'VIDEO_CLIP_METADATA',
      outputRole: job.outputArtifactRole,
      aspectRatioRole: profile.aspectRatioRole,
      width: profile.outputWidth,
      height: profile.outputHeight,
      frameRate: profile.frameRate,
      videoCodec: profile.videoCodec,
      audioCodec: profile.audioCodec,
      container: profile.container,
      sourceDuration: duration,
      effectiveDuration: duration,
      estimatedBytes,
      metadataChecksum: checksum({ job, profile, segments: assemblyResult.orderedSegments }),
      contentChecksumUnavailableMetadata: 'media-bytes-unavailable-synthetic-metadata-only',
      manifestReference: { id: manifestId, generation: 1 },
      filenameMetadata: sanitizeName(`${profile.displayName}-${artifactId}`, 96),
      revisionMetadata: `r${job.jobGeneration}`,
      metadataOnly: true,
      realMediaArtifact: false,
      available: true,
      safeMetadata: { backend: this.descriptor.backendId },
      createdAtNs: input.nowNs,
    });
    const manifest: ReplayMediaManifest = frozen({
      manifestId,
      manifestVersion: REPLAY_MEDIA_OUTPUT_VERSION,
      manifestGeneration: 1,
      artifactId,
      artifactGeneration: 1,
      sourceReferences: assemblyResult.orderedSegments.map((s) => ({
        id: s.sourceId,
        generation: s.sourceGeneration,
      })),
      sourceSegmentReferences: assemblyResult.orderedSegments.map((s) => ({
        id: s.segmentId,
        generation: s.generation,
      })),
      sourceRangeReferences: assemblyResult.orderedSegments.map(
        (s) => `${s.inFrame}-${s.outFrame}`,
      ),
      renderProfileReference: {
        id: profile.renderProfileId,
        generation: profile.profileGeneration,
      },
      outputSpecification: {
        width: profile.outputWidth,
        height: profile.outputHeight,
        frameRate: profile.frameRate,
        videoCodec: profile.videoCodec,
        audioCodec: profile.audioCodec,
        container: profile.container,
      },
      durationMetadata: `${duration}`,
      estimatedByteMetadata: `${estimatedBytes}`,
      transitionGraphicsAudioSummaries: [
        profile.transitionPolicy,
        profile.graphicsPolicy,
        profile.audioPolicy,
      ],
      variableSpeedSummaries: [profile.variableSpeedPolicy],
      lineageSummary: checksum([job.renderJobId, assemblyResult.assemblyResultId]),
      revisionSummary: `r${job.jobGeneration}`,
      metadataChecksum: checksum([artifactId, profile.renderProfileId]),
      contentChecksumUnavailable: true,
      metadataOnly: true,
      safeMetadata: { synthetic: true },
      createdAtNs: input.nowNs,
    });
    return frozen({
      planId: checksum(['render-plan', request.requestId]),
      requestId: request.requestId,
      renderJobId: job.renderJobId,
      renderJobGeneration: job.jobGeneration,
      sourceAssemblySummary: assemblyResult.assemblyResultId,
      orderedSegmentSummaries: assemblyResult.orderedSegments.map(
        (s) => `${s.segmentId}:${s.inFrame}-${s.outFrame}`,
      ),
      renderProfileSummary: `${profile.renderProfileId}@${profile.profileGeneration}`,
      outputVideoSpecification: {
        codec: profile.videoCodec,
        width: profile.outputWidth,
        height: profile.outputHeight,
        frameRate: profile.frameRate,
      },
      outputAudioSpecification: {
        codec: profile.audioCodec,
        sampleRate: profile.sampleRate,
        channelLayout: profile.channelLayout,
      },
      colorSpecification: {
        colorSpace: profile.colorSpaceMetadata,
        transfer: profile.transferFunctionMetadata,
        range: profile.colorRangeMetadata,
      },
      alphaSpecification: { alphaPolicy: profile.alphaPolicy },
      graphicsRequirements: profile.graphicsPolicy,
      transitionRequirements: profile.transitionPolicy,
      captionRequirements: profile.captionPolicy,
      variableSpeedRequirements: profile.variableSpeedPolicy,
      encoderDelegationPlan: {
        profileReference: profile.encoderProfileReference ?? null,
        execute: false,
      },
      packagingDelegationPlan: {
        profileReference: profile.packagingProfileReference ?? null,
        execute: false,
      },
      temporaryResourceEstimateMetadata: 'bounded-metadata-only',
      ownershipPlan: 'RENDER_PLAN_LEASED',
      progressStagePlan: [
        'VALIDATION',
        'PREPARATION',
        'RENDER_METADATA',
        'ENCODE_METADATA',
        'PACKAGE_METADATA',
        'FINALIZATION',
        'COMPLETE',
      ],
      outputArtifactPlan: artifact,
      metadataManifestPlan: manifest,
      operationOrder: RENDER_OPERATION_ORDER,
      deterministicScore: checksum([request, job.jobGeneration, profile.profileGeneration]),
      warnings: [],
      safeMetadata: { metadataOnly: true },
    });
  }
  createArtifactMetadata(plan: ReplayRenderPlan): ReplayRenderedArtifactMetadata {
    return plan.outputArtifactPlan;
  }
  validateExportProfile(profile: ReplayExportProfile): ReplayClipMediaOutputValidationReport {
    return {
      valid: profile.enabled && profile.outputNamingPolicy.maximumLength > 0,
      errors: profile.enabled ? [] : ['ReplayExportProfileInvalid'],
      warnings: [],
      checkedAtNs: profile.updatedAtNs,
    };
  }
  createExportPlan(input: {
    request: ReplayExportRequest;
    job: ReplayExportJobDefinition;
    profile: ReplayExportProfile;
    artifact: ReplayRenderedArtifactMetadata;
    destination: ReplayDeliveryDestinationReference;
  }): ReplayExportPlan {
    if (!input.destination.available) fail('ReplayMediaOutputDestinationUnavailable');
    const name = resolveOutputName(
      input.profile.outputNamingPolicy,
      input.artifact,
      input.job.revisionMetadata,
    );
    return frozen({
      planId: checksum(['export-plan', input.request.requestId]),
      requestId: input.request.requestId,
      exportJobId: input.job.exportJobId,
      exportJobGeneration: input.job.jobGeneration,
      artifactSummary: `${input.artifact.artifactId}@${input.artifact.artifactGeneration}`,
      exportProfileSummary: `${input.profile.exportProfileId}@${input.profile.profileGeneration}`,
      destinationReferenceSummary: input.destination.redactedIdentifier,
      outputNamingResult: name,
      revisionResult: input.job.revisionMetadata,
      overwriteDecision: input.profile.overwritePolicy,
      manifestAction: input.profile.manifestPolicy,
      sidecarAction: input.profile.metadataSidecarPolicy,
      retentionAction: input.profile.retentionPolicyMetadata,
      deliveryHandoffAction: input.profile.deliveryHandoffPolicy,
      ownershipAction: 'DOWNSTREAM_BORROWED',
      operationOrder: [
        'validate export job',
        'validate artifact metadata',
        'validate export profile',
        'validate destination reference',
        'resolve output name',
        'create synthetic export receipt',
      ],
      deterministicScore: checksum([input.request, input.job, name]),
      warnings: [],
      safeMetadata: { metadataOnly: true },
    });
  }
  createExportReceipt(input: {
    plan: ReplayExportPlan;
    job: ReplayExportJobDefinition;
    profile: ReplayExportProfile;
    artifact: ReplayRenderedArtifactMetadata;
    destination: ReplayDeliveryDestinationReference;
    nowNs: number;
  }): ReplayExportReceipt {
    return frozen({
      receiptId: checksum(['export-receipt', input.plan.planId]),
      receiptGeneration: 1,
      exportJobId: input.job.exportJobId,
      exportJobGeneration: input.job.jobGeneration,
      artifactId: input.artifact.artifactId,
      artifactGeneration: input.artifact.artifactGeneration,
      exportMode: input.profile.exportMode,
      destinationClass: input.destination.destinationClass,
      redactedDestinationReference: input.destination.redactedIdentifier,
      outputNameMetadata: input.plan.outputNamingResult,
      revision: input.plan.revisionResult,
      manifestReference: input.artifact.manifestReference,
      metadataChecksum: checksum([input.plan, input.destination.redactedIdentifier]),
      availableMetadata: true,
      metadataOnly: true,
      realFileOutput: false,
      realUpload: false,
      completedAtNs: input.nowNs,
      safeMetadata: { synthetic: true },
    });
  }
  validateDeliveryProfile(
    profile: ReplayMediaDeliveryProfile,
  ): ReplayClipMediaOutputValidationReport {
    return {
      valid: profile.enabled,
      errors: profile.enabled ? [] : ['ReplayDeliveryProfileInvalid'],
      warnings: [],
      checkedAtNs: profile.updatedAtNs,
    };
  }
  createDeliveryPlan(input: {
    request: ReplayMediaDeliveryRequest;
    job: ReplayMediaDeliveryJobDefinition;
    profile: ReplayMediaDeliveryProfile;
    receipt: ReplayExportReceipt;
    destination: ReplayDeliveryDestinationReference;
  }): ReplayMediaDeliveryPlan {
    if (!input.destination.available) fail('ReplayMediaOutputDestinationUnavailable');
    return frozen({
      planId: checksum(['delivery-plan', input.request.requestId]),
      requestId: input.request.requestId,
      deliveryJobId: input.job.deliveryJobId,
      deliveryJobGeneration: input.job.jobGeneration,
      exportReceiptSummary: `${input.receipt.receiptId}@${input.receipt.receiptGeneration}`,
      deliveryProfileSummary: `${input.profile.deliveryProfileId}@${input.profile.profileGeneration}`,
      destinationSummary: input.destination.redactedIdentifier,
      deliveryType: input.profile.deliveryType,
      streamingDelegationMetadata: {
        reference: input.profile.streamingProfileReference ?? null,
        execute: false,
      },
      distributionDelegationMetadata: {
        reference: input.profile.distributionProfileReference ?? null,
        execute: false,
      },
      socialCoordinationDelegationMetadata: {
        reference: input.profile.socialDestinationProfileReference ?? null,
        execute: false,
      },
      retryPlan: input.profile.retryPolicy,
      completionPolicy: input.profile.completionPolicy,
      ownershipPlan: 'DELIVERY_JOB_OWNED',
      operationOrder: [
        'validate delivery job',
        'validate export receipt',
        'validate delivery profile',
        'validate destination reference',
        'create synthetic delivery receipt',
      ],
      deterministicScore: checksum([input.request, input.job, input.profile]),
      warnings: [],
      safeMetadata: { metadataOnly: true },
    });
  }
  createDeliveryReceipt(input: {
    plan: ReplayMediaDeliveryPlan;
    job: ReplayMediaDeliveryJobDefinition;
    profile: ReplayMediaDeliveryProfile;
    receipt: ReplayExportReceipt;
    destination: ReplayDeliveryDestinationReference;
    nowNs: number;
  }): ReplayMediaDeliveryReceipt {
    return frozen({
      receiptId: checksum(['delivery-receipt', input.plan.planId]),
      receiptGeneration: 1,
      deliveryJobId: input.job.deliveryJobId,
      deliveryJobGeneration: input.job.jobGeneration,
      exportReceiptId: input.receipt.receiptId,
      exportReceiptGeneration: input.receipt.receiptGeneration,
      deliveryType: input.profile.deliveryType,
      destinationClass: input.destination.destinationClass,
      redactedDestinationReference: input.destination.redactedIdentifier,
      underlyingStreamingResultReferenceMetadata:
        input.profile.deliveryType === 'STREAMING_METADATA'
          ? 'streaming-handoff-metadata-only'
          : undefined,
      underlyingDistributionResultReferenceMetadata: 'distribution-handoff-metadata-only',
      underlyingSocialResultReferenceMetadata:
        input.profile.deliveryType === 'SOCIAL_PLATFORM_METADATA'
          ? 'social-handoff-metadata-only'
          : undefined,
      status: 'COMPLETE_METADATA',
      attemptCount: 1,
      metadataOnly: true,
      realDelivery: false,
      realUpload: false,
      realPlatformPublication: false,
      completedAtNs: input.nowNs,
      safeMetadata: { synthetic: true },
    });
  }
  updateProgress(progress: ReplayMediaJobProgressState): ReplayMediaJobProgressState {
    return frozen({ ...progress });
  }
  cancelJob(_jobId: string): void {}
  retryJob(_jobId: string): void {}
  reset(): void {}
  drain(): void {}
  reconfigure(): void {}
  shutdown(): void {}
}
export function createSyntheticReplayClipMediaOutputBackend(): SyntheticReplayClipMediaOutputBackend {
  return new SyntheticReplayClipMediaOutputBackend();
}
export const RENDER_OPERATION_ORDER = [
  'validate render job',
  'validate render profile',
  'validate source assembly',
  'validate retained source ranges',
  'validate segment order and generations',
  'validate variable-speed capabilities',
  'validate graphics, captions, transitions, and audio policies',
  'validate output format',
  'validate encoder compatibility',
  'validate packaging compatibility',
  'calculate output duration metadata',
  'calculate estimated output bytes',
  'resolve source ownership',
  'resolve encoder delegation',
  'resolve packaging delegation',
  'create output-artifact metadata',
  'create manifest metadata',
  'publish synthetic render result',
  'release owned resources',
] as const;
function sanitizeName(name: string, max: number): string {
  const clean = name
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  if (!clean) fail('ReplayMediaOutputNameInvalid');
  return clean.slice(0, Math.max(1, max));
}
export function resolveOutputName(
  policy: ReplayOutputNamingPolicy,
  artifact: ReplayRenderedArtifactMetadata,
  revision: string,
): string {
  let name = `${policy.prefixMetadata}-${artifact.outputRole}`;
  if (policy.includeAspectRatio) name += `-${artifact.aspectRatioRole}`;
  if (policy.includeCodec) name += `-${artifact.videoCodec}`;
  if (policy.includeRevision) name += `-${revision}`;
  name += `${policy.suffixMetadata}.${policy.containerExtensionMetadata}`;
  if (policy.collisionPolicy === 'APPEND_METADATA_HASH')
    name += `-${artifact.metadataChecksum.slice(-8)}`;
  if (policy.collisionPolicy === 'APPEND_SEQUENCE') name += '-0001';
  return sanitizeName(name, policy.maximumLength);
}

export class ReplayClipMediaOutputEngine {
  private backends = new Map<string, ReplayClipMediaOutputBackend>();
  private renderProfiles = new Map<string, ReplayRenderProfile>();
  private exportProfiles = new Map<string, ReplayExportProfile>();
  private deliveryProfiles = new Map<string, ReplayMediaDeliveryProfile>();
  private destinations = new Map<string, ReplayDeliveryDestinationReference>();
  private renderJobs = new Map<string, ReplayRenderJobDefinition>();
  private exportJobs = new Map<string, ReplayExportJobDefinition>();
  private deliveryJobs = new Map<string, ReplayMediaDeliveryJobDefinition>();
  private renderStates = new Map<string, ReplayRenderJobState>();
  private exportStates = new Map<string, ReplayExportJobState>();
  private deliveryStates = new Map<string, ReplayMediaDeliveryJobState>();
  private assemblies = new Map<
    string,
    { plan: ReplayClipAssemblyPlan; result: ReplayClipAssemblyResult }
  >();
  private renderRequests = new Map<string, ReplayRenderRequest>();
  private renderPlans = new Map<string, ReplayRenderPlan>();
  private renderResults = new Map<string, ReplayRenderResult>();
  private artifacts = new Map<string, ReplayRenderedArtifactMetadata>();
  private manifests = new Map<string, ReplayMediaManifest>();
  private exportRequests = new Map<string, ReplayExportRequest>();
  private exportPlans = new Map<string, ReplayExportPlan>();
  private exportResults = new Map<string, ReplayExportResult>();
  private exportReceipts = new Map<string, ReplayExportReceipt>();
  private deliveryRequests = new Map<string, ReplayMediaDeliveryRequest>();
  private deliveryPlans = new Map<string, ReplayMediaDeliveryPlan>();
  private deliveryResults = new Map<string, ReplayMediaDeliveryResult>();
  private deliveryReceipts = new Map<string, ReplayMediaDeliveryReceipt>();
  private progress = new Map<string, ReplayMediaJobProgressState>();
  private leases = new Map<string, ReplayMediaJobLease>();
  private shutdownState = false;
  private peakQueueDepth = 0;
  private duplicateRequestCount = 0;
  private duplicateJobCount = 0;
  private staleGenerationRejectionCount = 0;
  private unsupportedCodecCount = 0;
  private unsupportedContainerCount = 0;
  private deliveryUnavailableCount = 0;
  private lastFailure: string | undefined;
  registerBackend(backend: ReplayClipMediaOutputBackend): void {
    this.ensureOpen();
    if (this.backends.has(backend.descriptor.backendId))
      fail('DuplicateReplayClipMediaOutputBackend');
    backend.initialize();
    this.backends.set(backend.descriptor.backendId, backend);
  }
  unregisterBackend(id: string): void {
    this.backends.delete(id);
  }
  registerAssembly(plan: ReplayClipAssemblyPlan, result: ReplayClipAssemblyResult): void {
    if (plan.readiness !== 'READY_METADATA' || result.readiness !== 'READY_METADATA')
      fail('ReplayRenderJobInvalid', 'assembly not ready');
    this.assemblies.set(result.assemblyResultId, { plan, result });
  }
  registerRenderProfile(profile: ReplayRenderProfile): void {
    this.ensureOpen();
    if (this.renderProfiles.has(profile.renderProfileId)) fail('DuplicateReplayRenderProfile');
    const report = this.selectBackend(profile.backendPreference).validateRenderProfile(profile);
    if (!report.valid) {
      this.countProfileErrors(report);
      fail(report.errors[0] ?? 'ReplayRenderProfileInvalid');
    }
    this.renderProfiles.set(
      profile.renderProfileId,
      frozen({
        ...profile,
        jobTypes: frozen([...profile.jobTypes]),
        sourceAssemblyTypes: frozen([...profile.sourceAssemblyTypes]),
      }),
    );
  }
  updateRenderProfile(profile: ReplayRenderProfile, expectedGeneration: number): void {
    const cur =
      this.renderProfiles.get(profile.renderProfileId) ?? fail('ReplayRenderProfileNotFound');
    if (
      cur.profileGeneration !== expectedGeneration ||
      profile.profileGeneration <= expectedGeneration
    ) {
      this.staleGenerationRejectionCount++;
      fail('ReplayMediaOutputGenerationMismatch');
    }
    this.renderProfiles.set(
      profile.renderProfileId,
      frozen({
        ...profile,
        jobTypes: frozen([...profile.jobTypes]),
        sourceAssemblyTypes: frozen([...profile.sourceAssemblyTypes]),
      }),
    );
  }
  registerExportProfile(profile: ReplayExportProfile): void {
    if (this.exportProfiles.has(profile.exportProfileId)) fail('DuplicateReplayExportProfile');
    const r = this.selectBackend().validateExportProfile(profile);
    if (!r.valid) fail(r.errors[0] ?? 'ReplayExportProfileInvalid');
    this.exportProfiles.set(profile.exportProfileId, frozen(profile));
  }
  registerDeliveryProfile(profile: ReplayMediaDeliveryProfile): void {
    if (this.deliveryProfiles.has(profile.deliveryProfileId))
      fail('DuplicateReplayDeliveryProfile');
    const r = this.selectBackend().validateDeliveryProfile(profile);
    if (!r.valid) fail(r.errors[0] ?? 'ReplayDeliveryProfileInvalid');
    this.deliveryProfiles.set(profile.deliveryProfileId, frozen(profile));
  }
  registerDestinationReference(destination: ReplayDeliveryDestinationReference): void {
    if (this.destinations.has(destination.destinationRefId))
      fail('ReplayDeliveryDestinationReferenceInvalid');
    if (
      destination.redactedIdentifier.includes('/') ||
      destination.redactedIdentifier.includes('://')
    )
      fail('ReplayDeliveryDestinationReferenceInvalid');
    this.destinations.set(destination.destinationRefId, frozen(destination));
  }
  createRenderJob(job: ReplayRenderJobDefinition): void {
    if (this.renderJobs.has(job.renderJobId)) {
      this.duplicateJobCount++;
      fail('DuplicateReplayRenderJob');
    }
    const profile =
      this.renderProfiles.get(job.renderProfileId) ?? fail('ReplayRenderProfileNotFound');
    if (profile.profileGeneration !== job.renderProfileGeneration)
      fail('ReplayMediaOutputGenerationMismatch');
    const assembly =
      this.assemblies.get(job.sourceAssemblyResultId) ?? fail('ReplayRenderJobInvalid');
    if (assembly.result.readiness !== 'READY_METADATA') fail('ReplayRenderJobInvalid');
    this.renderJobs.set(
      job.renderJobId,
      frozen({ ...job, expectedSourceGenerations: frozen([...job.expectedSourceGenerations]) }),
    );
    this.renderStates.set(job.renderJobId, 'CREATED');
  }
  submitRender(
    request: ReplayRenderRequest,
    nowNs = request.requestedRuntimeFrame,
  ): ReplayRenderResult {
    this.ensureOpen();
    if (this.renderRequests.has(request.requestId) || this.renderResults.has(request.requestId)) {
      this.duplicateRequestCount++;
      fail('ReplayMediaOutputDuplicateRequest');
    }
    const job = this.renderJobs.get(request.renderJobId) ?? fail('ReplayRenderJobNotFound');
    if (job.jobGeneration !== request.expectedRenderJobGeneration) {
      this.staleGenerationRejectionCount++;
      fail('ReplayMediaOutputGenerationMismatch');
    }
    const profile =
      this.renderProfiles.get(job.renderProfileId) ?? fail('ReplayRenderProfileNotFound');
    if (profile.profileGeneration !== request.expectedRenderProfileGeneration) {
      this.staleGenerationRejectionCount++;
      fail('ReplayMediaOutputGenerationMismatch');
    }
    const assembly =
      this.assemblies.get(job.sourceAssemblyResultId) ?? fail('ReplayMediaOutputSourceMissing');
    if (
      assembly.plan.assemblyPlanGeneration !== request.expectedAssemblyPlanGeneration ||
      assembly.result.assemblyResultGeneration !== request.expectedAssemblyResultGeneration
    ) {
      this.staleGenerationRejectionCount++;
      fail('ReplayMediaOutputGenerationMismatch');
    }
    this.validateSegments(assembly.result.orderedSegments);
    const backend = this.selectBackend(profile.backendPreference);
    this.renderRequests.set(request.requestId, frozen({ ...request }));
    this.renderStates.set(job.renderJobId, 'RENDERING_METADATA');
    const plan = backend.createRenderPlan({
      request,
      job,
      profile,
      assemblyPlan: assembly.plan,
      assemblyResult: assembly.result,
      nowNs,
    });
    const artifact = backend.createArtifactMetadata(plan);
    this.renderPlans.set(plan.planId, plan);
    this.artifacts.set(artifact.artifactId, artifact);
    this.manifests.set(plan.metadataManifestPlan.manifestId, plan.metadataManifestPlan);
    const result: ReplayRenderResult = frozen({
      requestId: request.requestId,
      planId: plan.planId,
      status: 'COMPLETE_METADATA',
      runtimeFrame: request.requestedRuntimeFrame,
      renderJobId: job.renderJobId,
      renderJobGeneration: job.jobGeneration,
      artifactMetadata: artifact,
      encoderDelegationStatus: 'METADATA_ONLY_NOT_EXECUTED',
      packagingDelegationStatus: 'METADATA_ONLY_NOT_EXECUTED',
      progressSummary: 'COMPLETE_METADATA',
      metadataOnly: true,
      realRendering: false,
      realEncoding: false,
      realMuxing: false,
      realFileOutput: false,
      warnings: plan.warnings,
      completedAtNs: nowNs,
    });
    this.renderResults.set(request.requestId, result);
    this.renderStates.set(job.renderJobId, 'COMPLETE_METADATA');
    this.recordProgress('RENDER', job.renderJobId, job.jobGeneration, 'COMPLETE');
    return result;
  }
  createExportJob(job: ReplayExportJobDefinition): void {
    if (this.exportJobs.has(job.exportJobId)) {
      this.duplicateJobCount++;
      fail('DuplicateReplayExportJob');
    }
    if (!this.artifacts.has(job.renderArtifactId)) fail('ReplayExportJobInvalid');
    this.exportJobs.set(
      job.exportJobId,
      frozen({ ...job, sidecarRequirements: frozen([...job.sidecarRequirements]) }),
    );
    this.exportStates.set(job.exportJobId, 'CREATED');
  }
  submitExport(
    request: ReplayExportRequest,
    nowNs = request.requestedRuntimeFrame,
  ): ReplayExportResult {
    if (this.exportRequests.has(request.requestId) || this.exportResults.has(request.requestId)) {
      this.duplicateRequestCount++;
      fail('ReplayMediaOutputDuplicateRequest');
    }
    const job = this.exportJobs.get(request.exportJobId) ?? fail('ReplayExportJobNotFound');
    const artifact = this.artifacts.get(job.renderArtifactId) ?? fail('ReplayExportJobInvalid');
    const profile =
      this.exportProfiles.get(job.exportProfileId) ?? fail('ReplayExportProfileNotFound');
    const dest =
      this.destinations.get(job.destinationReferenceId) ??
      fail('ReplayMediaOutputDestinationUnavailable');
    if (
      job.jobGeneration !== request.expectedExportJobGeneration ||
      artifact.artifactGeneration !== request.expectedArtifactGeneration ||
      profile.profileGeneration !== request.expectedExportProfileGeneration ||
      dest.generation !== request.expectedDestinationReferenceGeneration
    ) {
      this.staleGenerationRejectionCount++;
      fail('ReplayMediaOutputGenerationMismatch');
    }
    const backend = this.selectBackend();
    this.exportRequests.set(request.requestId, request);
    const plan = backend.createExportPlan({ request, job, profile, artifact, destination: dest });
    const receipt = backend.createExportReceipt({
      plan,
      job,
      profile,
      artifact,
      destination: dest,
      nowNs,
    });
    this.exportPlans.set(plan.planId, plan);
    this.exportReceipts.set(receipt.receiptId, receipt);
    const result: ReplayExportResult = frozen({
      requestId: request.requestId,
      planId: plan.planId,
      status: 'COMPLETE_METADATA',
      runtimeFrame: request.requestedRuntimeFrame,
      exportJobId: job.exportJobId,
      exportJobGeneration: job.jobGeneration,
      artifactId: artifact.artifactId,
      artifactGeneration: artifact.artifactGeneration,
      receipt,
      metadataOnly: true,
      realFileOutput: false,
      realUpload: false,
      warnings: plan.warnings,
      completedAtNs: nowNs,
    });
    this.exportResults.set(request.requestId, result);
    this.exportStates.set(job.exportJobId, 'COMPLETE_METADATA');
    this.recordProgress('EXPORT', job.exportJobId, job.jobGeneration, 'COMPLETE');
    return result;
  }
  createDeliveryJob(job: ReplayMediaDeliveryJobDefinition): void {
    if (this.deliveryJobs.has(job.deliveryJobId)) {
      this.duplicateJobCount++;
      fail('DuplicateReplayDeliveryJob');
    }
    if (!this.exportReceipts.has(job.exportReceiptId)) fail('ReplayDeliveryJobInvalid');
    this.deliveryJobs.set(job.deliveryJobId, frozen(job));
    this.deliveryStates.set(job.deliveryJobId, 'CREATED');
  }
  submitDelivery(
    request: ReplayMediaDeliveryRequest,
    nowNs = request.requestedRuntimeFrame,
  ): ReplayMediaDeliveryResult {
    if (
      this.deliveryRequests.has(request.requestId) ||
      this.deliveryResults.has(request.requestId)
    ) {
      this.duplicateRequestCount++;
      fail('ReplayMediaOutputDuplicateRequest');
    }
    const job = this.deliveryJobs.get(request.deliveryJobId) ?? fail('ReplayDeliveryJobNotFound');
    const receipt =
      this.exportReceipts.get(job.exportReceiptId) ?? fail('ReplayDeliveryJobInvalid');
    const profile =
      this.deliveryProfiles.get(job.deliveryProfileId) ?? fail('ReplayDeliveryProfileNotFound');
    const dest =
      this.destinations.get(job.destinationReferenceId) ??
      fail('ReplayMediaOutputDestinationUnavailable');
    if (
      job.jobGeneration !== request.expectedDeliveryJobGeneration ||
      receipt.receiptGeneration !== request.expectedExportReceiptGeneration ||
      profile.profileGeneration !== request.expectedDeliveryProfileGeneration ||
      dest.generation !== request.expectedDestinationReferenceGeneration
    ) {
      this.staleGenerationRejectionCount++;
      fail('ReplayMediaOutputGenerationMismatch');
    }
    const backend = this.selectBackend();
    const plan = backend.createDeliveryPlan({ request, job, profile, receipt, destination: dest });
    const deliveryReceipt = backend.createDeliveryReceipt({
      plan,
      job,
      profile,
      receipt,
      destination: dest,
      nowNs,
    });
    this.deliveryRequests.set(request.requestId, request);
    this.deliveryPlans.set(plan.planId, plan);
    this.deliveryReceipts.set(deliveryReceipt.receiptId, deliveryReceipt);
    const result: ReplayMediaDeliveryResult = frozen({
      requestId: request.requestId,
      planId: plan.planId,
      status: 'COMPLETE_METADATA',
      runtimeFrame: request.requestedRuntimeFrame,
      deliveryJobId: job.deliveryJobId,
      deliveryJobGeneration: job.jobGeneration,
      deliveryReceipt,
      metadataOnly: true,
      realDelivery: false,
      realUpload: false,
      realPlatformPublication: false,
      warnings: plan.warnings,
      completedAtNs: nowNs,
    });
    this.deliveryResults.set(request.requestId, result);
    this.deliveryStates.set(job.deliveryJobId, 'COMPLETE_METADATA');
    this.recordProgress('DELIVERY', job.deliveryJobId, job.jobGeneration, 'COMPLETE');
    return result;
  }
  snapshot(updatedAtNs = 0): ReplayClipMediaOutputEngineSnapshot {
    const health = this.health(updatedAtNs);
    const queue = frozen({
      renderDepth: this.renderRequests.size,
      exportDepth: this.exportRequests.size,
      deliveryDepth: this.deliveryRequests.size,
      retryDepth: 0,
      cancellationDepth: 0,
      maximumDepth: this.selectBackendSafe()?.capabilities.maximumQueuedJobs ?? 0,
    });
    return frozen({
      version: REPLAY_MEDIA_OUTPUT_VERSION,
      backends: frozen(
        [...this.backends.values()]
          .sort((a, b) => a.descriptor.backendId.localeCompare(b.descriptor.backendId))
          .map((b) =>
            frozen({
              backendId: b.descriptor.backendId,
              generation: b.descriptor.generation,
              capabilities: b.capabilities,
            }),
          ),
      ),
      renderProfiles: this.sorted(this.renderProfiles, 'renderProfileId'),
      exportProfiles: this.sorted(this.exportProfiles, 'exportProfileId'),
      deliveryProfiles: this.sorted(this.deliveryProfiles, 'deliveryProfileId'),
      destinationReferences: this.sorted(this.destinations, 'destinationRefId'),
      renderJobs: this.sorted(this.renderJobs, 'renderJobId'),
      exportJobs: this.sorted(this.exportJobs, 'exportJobId'),
      deliveryJobs: this.sorted(this.deliveryJobs, 'deliveryJobId'),
      renderPlans: this.sorted(this.renderPlans, 'planId'),
      artifacts: this.sorted(this.artifacts, 'artifactId'),
      manifests: this.sorted(this.manifests, 'manifestId'),
      exportPlans: this.sorted(this.exportPlans, 'planId'),
      exportReceipts: this.sorted(this.exportReceipts, 'receiptId'),
      deliveryPlans: this.sorted(this.deliveryPlans, 'planId'),
      deliveryReceipts: this.sorted(this.deliveryReceipts, 'receiptId'),
      progress: this.sorted(this.progress, 'progressId'),
      leases: this.sorted(this.leases, 'leaseId'),
      queue,
      health,
      telemetry: frozen({
        counters: {
          duplicateRequestCount: this.duplicateRequestCount,
          duplicateJobCount: this.duplicateJobCount,
          staleGenerationRejectionCount: this.staleGenerationRejectionCount,
        },
        activeJobIds: [],
        currentRequestIds: frozen(
          [
            ...this.renderRequests.keys(),
            ...this.exportRequests.keys(),
            ...this.deliveryRequests.keys(),
          ].sort(),
        ),
        lastEvent: this.shutdownState
          ? 'ReplayClipMediaOutputEngineShutdown'
          : 'ReplayClipMediaOutputHealthChanged',
        healthSummary: health.healthState,
      }),
    });
  }
  health(updatedAtNs = 0): ReplayClipMediaOutputHealthSnapshot {
    const queueDepth =
      this.renderRequests.size + this.exportRequests.size + this.deliveryRequests.size;
    this.peakQueueDepth = Math.max(this.peakQueueDepth, queueDepth);
    return frozen({
      engineState: this.shutdownState ? 'SHUTDOWN' : 'READY',
      healthState: this.lastFailure ? 'DEGRADED' : 'HEALTHY',
      backendCount: this.backends.size,
      renderProfileCount: this.renderProfiles.size,
      exportProfileCount: this.exportProfiles.size,
      deliveryProfileCount: this.deliveryProfiles.size,
      destinationReferenceCount: this.destinations.size,
      renderJobCount: this.renderJobs.size,
      exportJobCount: this.exportJobs.size,
      deliveryJobCount: this.deliveryJobs.size,
      queuedJobCount: 0,
      activeJobCount: 0,
      completedMetadataJobCount:
        this.renderResults.size + this.exportResults.size + this.deliveryResults.size,
      degradedJobCount: 0,
      failedJobCount: 0,
      cancelledJobCount: 0,
      renderPlanCount: this.renderPlans.size,
      exportPlanCount: this.exportPlans.size,
      deliveryPlanCount: this.deliveryPlans.size,
      artifactMetadataCount: this.artifacts.size,
      manifestCount: this.manifests.size,
      exportReceiptCount: this.exportReceipts.size,
      deliveryReceiptCount: this.deliveryReceipts.size,
      duplicateRequestCount: this.duplicateRequestCount,
      duplicateJobCount: this.duplicateJobCount,
      staleGenerationRejectionCount: this.staleGenerationRejectionCount,
      unsupportedCodecCount: this.unsupportedCodecCount,
      unsupportedContainerCount: this.unsupportedContainerCount,
      missingSourceCount: 0,
      evictedRangeCount: 0,
      encoderIncompatibilityCount: 0,
      packagingIncompatibilityCount: 0,
      deliveryUnavailableCount: this.deliveryUnavailableCount,
      retryCount: 0,
      timeoutCount: 0,
      ownershipViolationCount: 0,
      activeLeaseCount: [...this.leases.values()].filter((l) => !l.released).length,
      queueDepth,
      peakQueueDepth: this.peakQueueDepth,
      estimatedOutputBytesTotal: [...this.artifacts.values()].reduce(
        (t, a) => t + a.estimatedBytes,
        0,
      ),
      lastCompletedArtifactId: [...this.artifacts.keys()].sort().at(-1),
      lastExportReceiptId: [...this.exportReceipts.keys()].sort().at(-1),
      lastDeliveryReceiptId: [...this.deliveryReceipts.keys()].sort().at(-1),
      lastFailure: this.lastFailure,
      updatedAtNs,
    });
  }
  assertInvariants(): void {
    for (const a of this.artifacts.values())
      if (!a.metadataOnly || a.realMediaArtifact) fail('ReplayMediaOutputInvariantViolation');
    for (const r of this.renderResults.values())
      if (r.realRendering || r.realEncoding || r.realMuxing || r.realFileOutput)
        fail('ReplayMediaOutputInvariantViolation');
    for (const r of this.exportResults.values())
      if (r.realFileOutput || r.realUpload) fail('ReplayMediaOutputInvariantViolation');
    for (const r of this.deliveryResults.values())
      if (r.realDelivery || r.realUpload || r.realPlatformPublication)
        fail('ReplayMediaOutputInvariantViolation');
  }
  shutdown(): void {
    this.shutdownState = true;
    this.renderRequests.clear();
    this.exportRequests.clear();
    this.deliveryRequests.clear();
    this.leases.clear();
    for (const b of this.backends.values()) b.shutdown();
  }
  private ensureOpen(): void {
    if (this.shutdownState) fail('ReplayMediaOutputShutdownError');
  }
  private selectBackend(preference?: string): ReplayClipMediaOutputBackend {
    const backend = preference
      ? this.backends.get(preference)
      : [...this.backends.values()].sort((a, b) =>
          a.descriptor.backendId.localeCompare(b.descriptor.backendId),
        )[0];
    return backend ?? fail('ReplayClipMediaOutputBackendNotFound');
  }
  private selectBackendSafe(): ReplayClipMediaOutputBackend | undefined {
    return [...this.backends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    )[0];
  }
  private sorted<T extends Record<K, string>, K extends keyof T>(
    map: Map<string, T>,
    key: K,
  ): readonly T[] {
    return frozen([...map.values()].sort((a, b) => a[key].localeCompare(b[key])));
  }
  private countProfileErrors(report: ReplayClipMediaOutputValidationReport): void {
    if (report.errors.some((e) => e.includes('Codec'))) this.unsupportedCodecCount++;
    if (report.errors.some((e) => e.includes('Container'))) this.unsupportedContainerCount++;
  }
  private validateSegments(segments: readonly ReplayClipSegment[]): void {
    for (const s of segments) {
      assertPositive(s.generation, 'ReplayMediaOutputGenerationMismatch');
      if (s.outFrame <= s.inFrame) fail('ReplayMediaOutputRangeEvicted');
    }
  }
  private recordProgress(
    jobClass: ReplayMediaJobClass,
    jobId: string,
    jobGeneration: number,
    stage: ReplayMediaJobProgressStage,
  ): void {
    this.progress.set(
      `${jobClass}:${jobId}`,
      frozen({
        progressId: `${jobClass}:${jobId}`,
        progressGeneration: 1,
        jobClass,
        jobId,
        jobGeneration,
        stage,
        completedOperationCount: 1,
        totalOperationCount: 1,
        estimatedProgressNumerator: 1,
        estimatedProgressDenominator: 1,
        completedSegmentCount: 0,
        warningCount: 0,
        retryCount: 0,
        state: stage,
        metadataOnly: true,
      }),
    );
  }
}
export function createReplayClipMediaOutputEngine(): ReplayClipMediaOutputEngine {
  const engine = new ReplayClipMediaOutputEngine();
  engine.registerBackend(createSyntheticReplayClipMediaOutputBackend());
  return engine;
}
export function assertReplayClipMediaOutputInvariants(engine: ReplayClipMediaOutputEngine): void {
  engine.assertInvariants();
}
export function createReplayClipMediaOutputSourceGraphSnapshot(
  engine: ReplayClipMediaOutputEngine,
): SafeMetadata {
  const s = engine.snapshot();
  return {
    renderJobs: s.renderJobs.map((j) => j.renderJobId),
    exportJobs: s.exportJobs.map((j) => j.exportJobId),
    deliveryJobs: s.deliveryJobs.map((j) => j.deliveryJobId),
    artifacts: s.artifacts.map((a) => ({
      artifactId: a.artifactId,
      codec: a.videoCodec,
      container: a.container,
      metadataOnly: a.metadataOnly,
      realMediaArtifact: a.realMediaArtifact,
    })),
    delivery: s.deliveryReceipts.map((r) => ({
      receiptId: r.receiptId,
      destination: r.redactedDestinationReference,
      realDelivery: r.realDelivery,
    })),
    health: s.health,
  };
}
export class ReplayClipMediaOutputProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'replay-clip-media-output-foundation',
    name: 'Replay Clip Rendering Export Delivery Metadata Foundation',
    version: REPLAY_MEDIA_OUTPUT_VERSION,
    order: REPLAY_MEDIA_OUTPUT_PROCESSOR_ORDER,
    phase: 'POST_TICK',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: ['replay-clip-assembly-foundation'],
    optionalCapabilities: ['replay-media-output-metadata'],
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
    metadata: { metadataOnly: true, noSecondClock: true },
  };
  private lastTick: bigint | undefined;
  constructor(private readonly engine: ReplayClipMediaOutputEngine) {}
  initialize() {
    return {
      status: 'READY' as const,
      state: this.engine.snapshot(),
      metadata: { metadataOnly: true },
    };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext): void {
    if (this.lastTick === tick.frameNumber) fail('REPLAY_MEDIA_OUTPUT_DUPLICATE_TICK');
    this.lastTick = tick.frameNumber;
    const snapshot = this.engine.snapshot(Number(tick.presentationTimeNs));
    context.outputs.publish(
      this.descriptor.id,
      REPLAY_MEDIA_OUTPUT_OUTPUT_KEYS.health,
      snapshot.health,
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      REPLAY_MEDIA_OUTPUT_OUTPUT_KEYS.telemetry,
      snapshot.telemetry,
      'BORROWED',
    );
  }
  shutdown() {
    this.engine.shutdown();
    return { status: 'STOPPED' as const, metadata: { metadataOnly: true } };
  }
}
export function createReplayClipMediaOutputProcessor(
  engine = createReplayClipMediaOutputEngine(),
): ReplayClipMediaOutputProcessor {
  return new ReplayClipMediaOutputProcessor(engine);
}
export function createReplayMediaOutputCommandHandlers(
  engine: ReplayClipMediaOutputEngine,
): Readonly<Partial<Record<ReplayMediaOutputCommandType, RuntimeCommandHandler>>> {
  const handle = (
    type: ReplayMediaOutputCommandType,
    handler: (payload: unknown) => unknown,
  ): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute(command: RuntimeCommand) {
      try {
        return { status: 'SUCCEEDED', value: handler(command.payload) };
      } catch (error) {
        return { status: 'FAILED', error: error instanceof Error ? error.message : String(error) };
      }
    },
  });
  return {
    REPLAY_MEDIA_OUTPUT_SHUTDOWN: handle('REPLAY_MEDIA_OUTPUT_SHUTDOWN', () => {
      engine.shutdown();
      return { ok: true };
    }),
    REPLAY_MEDIA_OUTPUT_VALIDATE: handle('REPLAY_MEDIA_OUTPUT_VALIDATE', () => {
      engine.assertInvariants();
      return engine.snapshot();
    }),
  };
}
