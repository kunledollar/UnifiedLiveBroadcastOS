import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeCommandHandler,
  type TickProcessor,
} from './execution-engine.js';
import type {
  AudioVideoSyncOutputRole,
  RationalTimeBase,
} from './audio-video-sync-master-audio.js';

export const MEDIA_ENCODER_FOUNDATION_VERSION = '5.6.6';
export const MEDIA_ENCODER_FOUNDATION_PROCESSOR_ORDER = 900;

export const MEDIA_ENCODER_OUTPUT_KEYS = Object.freeze({
  videoEncoderConfigurations: 'media-encoder.video-configurations',
  audioEncoderConfigurations: 'media-encoder.audio-configurations',
  encoderProfiles: 'media-encoder.profiles',
  encoderSessionDefinitions: 'media-encoder.session-definitions',
  encoderSessionStates: 'media-encoder.session-states',
  encoderOutputBindings: 'media-encoder.output-bindings',
  videoInputSubmissions: 'media-encoder.video-input-submissions',
  audioInputSubmissions: 'media-encoder.audio-input-submissions',
  activeEncodeRequests: 'media-encoder.active-encode-requests',
  encodePlans: 'media-encoder.encode-plans',
  encodedVideoPackets: 'media-encoder.encoded-video-packets',
  encodedAudioPackets: 'media-encoder.encoded-audio-packets',
  codecConfigPackets: 'media-encoder.codec-config-packets',
  packetQueues: 'media-encoder.packet-queues',
  backpressureStates: 'media-encoder.backpressure-states',
  gopStates: 'media-encoder.gop-states',
  rateControlStates: 'media-encoder.rate-control-states',
  encodedAvCorrelation: 'media-encoder.encoded-av-correlation',
  drainStates: 'media-encoder.drain-states',
  flushStates: 'media-encoder.flush-states',
  activeConfigurationTransactions: 'media-encoder.active-configuration-transactions',
  encoderHealth: 'media-encoder.health',
  encoderTelemetry: 'media-encoder.telemetry',
  backendHealth: 'media-encoder.backend-health',
  failedRejectedResults: 'media-encoder.failed-rejected-results',
});

export const MEDIA_ENCODER_COMMAND_TYPES = [
  'ENCODER_REGISTER_VIDEO_BACKEND',
  'ENCODER_UNREGISTER_VIDEO_BACKEND',
  'ENCODER_REGISTER_AUDIO_BACKEND',
  'ENCODER_UNREGISTER_AUDIO_BACKEND',
  'ENCODER_REGISTER_VIDEO_CONFIG',
  'ENCODER_UPDATE_VIDEO_CONFIG',
  'ENCODER_UNREGISTER_VIDEO_CONFIG',
  'ENCODER_REGISTER_AUDIO_CONFIG',
  'ENCODER_UPDATE_AUDIO_CONFIG',
  'ENCODER_UNREGISTER_AUDIO_CONFIG',
  'ENCODER_CREATE_SESSION',
  'ENCODER_UPDATE_SESSION',
  'ENCODER_DESTROY_SESSION',
  'ENCODER_START_SESSION',
  'ENCODER_PAUSE_SESSION',
  'ENCODER_RESUME_SESSION',
  'ENCODER_STOP_SESSION',
  'ENCODER_RESET_SESSION',
  'ENCODER_SUBMIT_VIDEO_FRAME',
  'ENCODER_SUBMIT_AUDIO_BLOCK',
  'ENCODER_REQUEST_KEYFRAME',
  'ENCODER_DRAIN',
  'ENCODER_FLUSH',
  'ENCODER_RECONFIGURE',
  'ENCODER_BIND_OUTPUT_ROLE',
  'ENCODER_UNBIND_OUTPUT_ROLE',
  'ENCODER_SET_QUEUE_POLICY',
  'ENCODER_CLEAR_PLAN_CACHE',
  'ENCODER_VALIDATE',
  'ENCODER_SHUTDOWN',
] as const;
export type MediaEncoderCommandType = (typeof MEDIA_ENCODER_COMMAND_TYPES)[number];

export const MEDIA_ENCODER_EVENTS = [
  'MediaEncoderEngineCreated',
  'VideoEncoderBackendRegistered',
  'VideoEncoderBackendRemoved',
  'AudioEncoderBackendRegistered',
  'AudioEncoderBackendRemoved',
  'VideoEncoderConfigRegistered',
  'VideoEncoderConfigUpdated',
  'VideoEncoderConfigRemoved',
  'AudioEncoderConfigRegistered',
  'AudioEncoderConfigUpdated',
  'AudioEncoderConfigRemoved',
  'EncoderSessionCreated',
  'EncoderSessionInitialized',
  'EncoderSessionStarted',
  'EncoderSessionPaused',
  'EncoderSessionResumed',
  'EncoderSessionReconfiguring',
  'EncoderSessionDraining',
  'EncoderSessionFlushing',
  'EncoderSessionStopped',
  'EncoderSessionReset',
  'EncoderSessionFailed',
  'VideoFrameSubmitted',
  'AudioBlockSubmitted',
  'EncodeRequested',
  'EncodePlanned',
  'VideoPacketEncoded',
  'AudioPacketEncoded',
  'CodecConfigPacketEmitted',
  'KeyframeRequested',
  'KeyframeEncoded',
  'EncoderBackpressureChanged',
  'EncoderInputDropped',
  'EncoderPacketDropped',
  'EncoderDrainCompleted',
  'EncoderFlushCompleted',
  'EncodedAvCorrelationChanged',
  'MediaEncoderHealthChanged',
  'MediaEncoderEngineShutdown',
] as const;
export type MediaEncoderEventType = (typeof MEDIA_ENCODER_EVENTS)[number];

export const MEDIA_ENCODER_WATCHDOG_INCIDENTS = [
  'ENCODER_ENGINE_STALLED',
  'ENCODER_REQUEST_TIMEOUT',
  'ENCODER_DUPLICATE_REQUEST',
  'ENCODER_DUPLICATE_SUBMISSION',
  'ENCODER_SESSION_GENERATION_STALE',
  'ENCODER_CONFIG_GENERATION_STALE',
  'ENCODER_INPUT_GENERATION_STALE',
  'ENCODER_SYNC_GENERATION_STALE',
  'ENCODER_OUTPUT_ROLE_GENERATION_STALE',
  'ENCODER_TIMESTAMP_REGRESSION',
  'ENCODER_SAMPLE_POSITION_REGRESSION',
  'ENCODER_VIDEO_FORMAT_UNSUPPORTED',
  'ENCODER_AUDIO_FORMAT_UNSUPPORTED',
  'ENCODER_PROFILE_UNSUPPORTED',
  'ENCODER_LEVEL_UNSUPPORTED',
  'ENCODER_KEYFRAME_INTERVAL_INVALID',
  'ENCODER_GOP_STATE_INVALID',
  'ENCODER_QUEUE_PRESSURE',
  'ENCODER_INPUT_QUEUE_OVERFLOW',
  'ENCODER_PACKET_QUEUE_OVERFLOW',
  'ENCODER_BACKPRESSURE_CRITICAL',
  'ENCODER_CODEC_CONFIG_MISSING',
  'ENCODER_PACKET_SEQUENCE_INVALID',
  'ENCODER_PACKET_TIMESTAMP_INVALID',
  'ENCODER_PROGRAM_AV_CORRELATION_MISMATCH',
  'ENCODER_BACKEND_FAILED',
  'ENCODER_DEVICE_GENERATION_LOST',
  'ENCODER_ALLOCATION_FAILED',
  'ENCODER_OWNERSHIP_VIOLATION',
  'ENCODER_OUTPUT_REGISTRY_MISMATCH',
  'ENCODER_SOURCE_GRAPH_MISMATCH',
  'ENCODER_INVARIANT_FAILURE',
] as const;
export type MediaEncoderWatchdogIncident = (typeof MEDIA_ENCODER_WATCHDOG_INCIDENTS)[number];

export type MediaType = 'VIDEO' | 'AUDIO' | 'DATA_METADATA' | 'CUSTOM';
export type MediaEncoderOutputRole =
  | 'PROGRAM'
  | 'PREVIEW'
  | 'HORIZONTAL_PROGRAM'
  | 'VERTICAL_PROGRAM'
  | 'SQUARE_PROGRAM'
  | 'CLEAN_FEED'
  | 'AUXILIARY'
  | 'RECORD'
  | 'STREAM'
  | 'CUSTOM';
export type VideoEncoderCodec =
  | 'H264'
  | 'H265'
  | 'AV1'
  | 'VP9'
  | 'MPEG2_VIDEO'
  | 'PRORES_METADATA'
  | 'DNXHR_METADATA'
  | 'RAW_VIDEO_METADATA'
  | 'CUSTOM_TYPED';
export type AudioEncoderCodec =
  | 'AAC'
  | 'OPUS'
  | 'MP3_METADATA'
  | 'AC3_METADATA'
  | 'EAC3_METADATA'
  | 'FLAC_METADATA'
  | 'PCM_S16_METADATA'
  | 'PCM_S24_METADATA'
  | 'PCM_F32_METADATA'
  | 'CUSTOM_TYPED';
export type EncoderImplementationClass =
  'SYNTHETIC' | 'SOFTWARE' | 'HARDWARE' | 'HYBRID' | 'REMOTE_METADATA' | 'CUSTOM';
export type BitrateMode =
  'CBR' | 'VBR' | 'CONSTRAINED_VBR' | 'CONSTANT_QUALITY' | 'LOSSLESS_METADATA' | 'CUSTOM';
export type EncoderQualityTier =
  | 'ULTRA_LOW_LATENCY'
  | 'LOW_LATENCY'
  | 'BALANCED'
  | 'HIGH_QUALITY'
  | 'ARCHIVAL_METADATA'
  | 'CUSTOM';
export type VideoEncoderProfile =
  | 'BASELINE'
  | 'MAIN'
  | 'HIGH'
  | 'HIGH_10_METADATA'
  | 'HIGH_422_METADATA'
  | 'HIGH_444_METADATA'
  | 'MAIN_10'
  | 'MAIN_422_10_METADATA'
  | 'MAIN_444_METADATA'
  | 'HIGH_METADATA'
  | 'PROFESSIONAL_METADATA'
  | 'PROFILE_0'
  | 'PROFILE_1_METADATA'
  | 'PROFILE_2'
  | 'PROFILE_3_METADATA';
export type AudioEncoderProfile =
  'LC' | 'HE_METADATA' | 'LOW_DELAY' | 'MAIN_METADATA' | 'CUSTOM_METADATA';
export type MediaEncoderSessionState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'STARTING'
  | 'RUNNING'
  | 'RECONFIGURING'
  | 'DRAINING'
  | 'FLUSHING'
  | 'PAUSED'
  | 'STOPPING'
  | 'STOPPED'
  | 'RESETTING'
  | 'FAILED'
  | 'DESTROYED'
  | 'SHUTDOWN';
export type SessionStartupPolicy =
  | 'WAIT_FOR_SYNCHRONIZED_MEDIA'
  | 'WAIT_FOR_VIDEO_KEYFRAME'
  | 'START_WITH_AUDIO'
  | 'START_WITH_VIDEO'
  | 'START_WHEN_BOTH_READY'
  | 'START_DEGRADED'
  | 'CUSTOM';
export type FrameClassification = 'IDR' | 'I' | 'P' | 'B' | 'KEY' | 'INTRA' | 'INTER' | 'UNKNOWN';
export type KeyframeReason =
  | 'FIXED_INTERVAL'
  | 'SCENE_CHANGE_METADATA'
  | 'MANUAL'
  | 'OUTPUT_START'
  | 'DISCONTINUITY'
  | 'SEGMENT_BOUNDARY_METADATA'
  | 'RECOVERY'
  | 'CUSTOM';
export type PacketOwner =
  | 'ENCODER_OWNED'
  | 'PACKET_QUEUE_OWNED'
  | 'MUXER_FUTURE_OWNED'
  | 'RECORD_FUTURE_OWNED'
  | 'STREAM_FUTURE_OWNED'
  | 'BORROWED_READ_ONLY'
  | 'RELEASED';
export type InputOverflowPolicy =
  | 'DROP_OLDEST'
  | 'DROP_NEWEST'
  | 'REJECT_NEW'
  | 'DROP_NON_KEY_VIDEO'
  | 'PRESERVE_AUDIO'
  | 'PRESERVE_PROGRAM'
  | 'FAIL_SESSION'
  | 'CUSTOM';
export type PacketOverflowPolicy =
  | 'DROP_OLDEST_NON_KEY_VIDEO'
  | 'DROP_NEWEST'
  | 'REJECT_NEW'
  | 'PRESERVE_CODEC_CONFIG'
  | 'PRESERVE_AUDIO'
  | 'FAIL_SESSION'
  | 'CUSTOM';
export type BackpressureLevel = 'NONE' | 'SOFT' | 'HARD' | 'CRITICAL' | 'FAILED';
export type ReconfigurationPolicy =
  'APPLY_IN_PLACE' | 'APPLY_AT_KEYFRAME' | 'DRAIN_AND_RESTART' | 'REJECT_WHILE_RUNNING' | 'CUSTOM';
export type ExtradataGenerationPolicy =
  | 'ON_SESSION_START'
  | 'ON_CONFIGURATION_CHANGE'
  | 'ON_DISCONTINUITY'
  | 'BEFORE_EACH_KEYFRAME_METADATA'
  | 'ON_REQUEST'
  | 'CUSTOM';
export type EncoderErrorType =
  | 'MediaEncoderEngineNotReady'
  | 'VideoEncoderBackendNotFound'
  | 'AudioEncoderBackendNotFound'
  | 'DuplicateVideoEncoderBackend'
  | 'DuplicateAudioEncoderBackend'
  | 'VideoEncoderConfigurationNotFound'
  | 'DuplicateVideoEncoderConfiguration'
  | 'VideoEncoderConfigurationInvalid'
  | 'AudioEncoderConfigurationNotFound'
  | 'DuplicateAudioEncoderConfiguration'
  | 'AudioEncoderConfigurationInvalid'
  | 'EncoderConfigurationGenerationMismatch'
  | 'EncoderSessionNotFound'
  | 'DuplicateEncoderSession'
  | 'EncoderSessionInvalid'
  | 'EncoderSessionGenerationMismatch'
  | 'EncoderSessionStateInvalid'
  | 'EncoderOutputBindingInvalid'
  | 'EncoderInputInvalid'
  | 'EncoderDuplicateRequest'
  | 'EncoderDuplicateSubmission'
  | 'EncoderTimestampRegression'
  | 'EncoderSamplePositionRegression'
  | 'EncoderCodecUnsupported'
  | 'EncoderProfileUnsupported'
  | 'EncoderLevelUnsupported'
  | 'EncoderFormatUnsupported'
  | 'EncoderQueueFull'
  | 'EncoderBackpressureCritical'
  | 'EncoderKeyframeRequestInvalid'
  | 'EncoderGopStateInvalid'
  | 'EncoderCodecConfigMissing'
  | 'EncoderPacketInvalid'
  | 'EncoderPacketSequenceInvalid'
  | 'EncoderPacketTimestampInvalid'
  | 'EncoderBackendFailed'
  | 'EncoderAllocationFailed'
  | 'EncoderOwnershipViolation'
  | 'EncoderCancelled'
  | 'EncoderTimeout'
  | 'EncoderInvariantViolation'
  | 'MediaEncoderShutdownError';

export interface SafeMetadata {
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface VideoEncoderConfiguration extends SafeMetadata {
  readonly encoderConfigId: string;
  readonly configVersion: string;
  readonly configGeneration: number;
  readonly codec: VideoEncoderCodec;
  readonly profile: VideoEncoderProfile;
  readonly level: string;
  readonly tier: EncoderQualityTier;
  readonly width: number;
  readonly height: number;
  readonly pixelFormat: string;
  readonly colorMetadata: Readonly<Record<string, unknown>>;
  readonly alphaMode: 'NONE' | 'STRAIGHT' | 'PREMULTIPLIED' | 'METADATA';
  readonly frameRate: RationalTimeBase;
  readonly codecTimeBase: RationalTimeBase;
  readonly bitrateMode: BitrateMode;
  readonly targetBitrate: number;
  readonly maximumBitrate: number;
  readonly minimumBitrate: number;
  readonly qualityValue: number;
  readonly gopSize: number;
  readonly minimumKeyframeInterval: number;
  readonly maximumKeyframeInterval: number;
  readonly bFrameCount: number;
  readonly referenceFrameCount: number;
  readonly sceneChangeDetectionPolicy: 'DISABLED' | 'METADATA_ONLY' | 'BACKEND_SUPPORTED';
  readonly forcedKeyframePolicy: KeyframeReason;
  readonly lowLatencyMode: boolean;
  readonly entropyModeMetadata: Readonly<Record<string, unknown>>;
  readonly rateControlBufferMetadata: Readonly<Record<string, unknown>>;
  readonly lookaheadMetadata: Readonly<Record<string, unknown>>;
  readonly latencyClass: EncoderQualityTier;
  readonly outputRole: MediaEncoderOutputRole;
  readonly backendPreference: EncoderImplementationClass;
  readonly extradataPolicy: ExtradataGenerationPolicy;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type VideoEncoderConfigurationSnapshot = VideoEncoderConfiguration;
export interface AudioEncoderConfiguration extends SafeMetadata {
  readonly encoderConfigId: string;
  readonly configVersion: string;
  readonly configGeneration: number;
  readonly codec: AudioEncoderCodec;
  readonly profile: AudioEncoderProfile;
  readonly sampleFormat: string;
  readonly sampleRate: number;
  readonly channelLayout: string;
  readonly channelCount: number;
  readonly bitrateMode: BitrateMode;
  readonly targetBitrate: number;
  readonly maximumBitrate: number;
  readonly frameSampleCount: number;
  readonly codecTimeBase: RationalTimeBase;
  readonly primingSamplesMetadata: number;
  readonly encoderDelayMetadata: number;
  readonly lowDelayMode: boolean;
  readonly outputRole: MediaEncoderOutputRole;
  readonly backendPreference: EncoderImplementationClass;
  readonly extradataPolicy: ExtradataGenerationPolicy;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type AudioEncoderConfigurationSnapshot = AudioEncoderConfiguration;
export interface QueuePolicy {
  readonly maxInputCount: number;
  readonly maxInputDuration: number;
  readonly maxInputBytes: number;
  readonly maxLatencyNs: number;
  readonly inputOverflowPolicy: InputOverflowPolicy;
  readonly maxPacketCount: number;
  readonly maxPacketDuration: number;
  readonly maxPacketBytes: number;
  readonly packetOverflowPolicy: PacketOverflowPolicy;
}
export interface MediaEncoderSessionDefinition extends SafeMetadata {
  readonly sessionId: string;
  readonly sessionVersion: string;
  readonly sessionGeneration: number;
  readonly mediaType: MediaType;
  readonly outputRole: MediaEncoderOutputRole;
  readonly sourceBusId: string;
  readonly videoConfigId?: string;
  readonly audioConfigId?: string;
  readonly synchronizationRequirement: 'REQUIRED' | 'OPTIONAL' | 'METADATA_ONLY';
  readonly startupPolicy: SessionStartupPolicy;
  readonly drainPolicy: 'EMIT_EOS' | 'NO_EOS' | 'CUSTOM';
  readonly flushPolicy: 'DISCARD' | 'PUBLISH_THEN_RESET' | 'CUSTOM';
  readonly reconfigurationPolicy: ReconfigurationPolicy;
  readonly discontinuityPolicy: 'RESET_GOP' | 'MARK_PACKETS' | 'FAIL_SESSION' | 'CUSTOM';
  readonly queuePolicy: QueuePolicy;
  readonly failurePolicy: 'FAIL_SESSION' | 'DROP_REQUEST' | 'DEGRADED_METADATA' | 'CUSTOM';
  readonly backendPreference: EncoderImplementationClass;
  readonly enabled: boolean;
  readonly criticality: 'PROGRAM_CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type MediaEncoderSessionDefinitionSnapshot = MediaEncoderSessionDefinition;
export interface MediaEncoderOutputBinding extends SafeMetadata {
  readonly bindingId: string;
  readonly bindingVersion: string;
  readonly bindingGeneration: number;
  readonly outputRole: MediaEncoderOutputRole;
  readonly videoSessionId: string;
  readonly audioSessionId: string;
  readonly synchronizedSourceRequirement: 'STRICT' | 'BOUNDED' | 'OPTIONAL' | 'ENCODER_ONLY';
  readonly profileGeneration: number;
  readonly criticality: 'PROGRAM_CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
  readonly enabled: boolean;
  readonly futureDestinationClassMetadata:
    'ENCODER_ONLY' | 'MUX_FUTURE' | 'RECORD_FUTURE' | 'STREAM_FUTURE' | 'CUSTOM_METADATA';
}
export type MediaEncoderOutputBindingSnapshot = MediaEncoderOutputBinding;
export interface VideoEncodeInputFrame extends SafeMetadata {
  readonly submissionId: string;
  readonly sessionId: string;
  readonly sessionGeneration: number;
  readonly frameId: string;
  readonly frameGeneration: number;
  readonly storageGeneration: number;
  readonly runtimeFrame: string;
  readonly frameNumber: number;
  readonly width: number;
  readonly height: number;
  readonly pixelFormat: string;
  readonly colorMetadata: Readonly<Record<string, unknown>>;
  readonly alphaMode: string;
  readonly frameTimestamp: number;
  readonly pts: number;
  readonly duration: number;
  readonly timeBase: RationalTimeBase;
  readonly discontinuityGeneration: number;
  readonly forceKeyframe: boolean;
  readonly frameOwnership: 'BORROWED_READ_ONLY' | 'ENCODER_REFERENCE' | 'RELEASED';
}
export type VideoEncodeInputFrameSnapshot = VideoEncodeInputFrame;
export interface AudioEncodeInputBlock extends SafeMetadata {
  readonly submissionId: string;
  readonly sessionId: string;
  readonly sessionGeneration: number;
  readonly blockId: string;
  readonly blockGeneration: number;
  readonly runtimeFrame: string;
  readonly blockSequence: number;
  readonly samplePosition: number;
  readonly sampleCount: number;
  readonly sampleRate: number;
  readonly sampleFormat: string;
  readonly channelLayout: string;
  readonly timestamp: number;
  readonly pts: number;
  readonly duration: number;
  readonly timeBase: RationalTimeBase;
  readonly discontinuityGeneration: number;
  readonly ownership: 'BORROWED_READ_ONLY' | 'ENCODER_REFERENCE' | 'RELEASED';
}
export type AudioEncodeInputBlockSnapshot = AudioEncodeInputBlock;
export interface MediaEncodeRequest extends SafeMetadata {
  readonly requestId: string;
  readonly mediaType: MediaType;
  readonly sessionId: string;
  readonly expectedSessionGeneration: number;
  readonly expectedConfigurationGenerations: readonly number[];
  readonly input: VideoEncodeInputFrame | AudioEncodeInputBlock;
  readonly expectedSynchronizationGeneration: number;
  readonly expectedOutputRoleGeneration: number;
  readonly expectedDeviceBackendGeneration: number;
  readonly requestedRuntimeFrame: string;
  readonly requestedPts: number;
  readonly deadlineNs: number;
  readonly cancellation?: { readonly cancelled?: boolean; readonly afterPlan?: boolean };
  readonly correlationId: string;
}
export type MediaEncodeRequestSnapshot = MediaEncodeRequest;
export interface MediaEncodePlan extends SafeMetadata {
  readonly planId: string;
  readonly requestId: string;
  readonly sessionId: string;
  readonly sessionGeneration: number;
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly mediaType: MediaType;
  readonly codec: string;
  readonly inputSummary: Readonly<Record<string, unknown>>;
  readonly outputRoleBinding: MediaEncoderOutputRole;
  readonly normalizedPts: number;
  readonly normalizedDts: number;
  readonly normalizedDuration: number;
  readonly frameClassification: FrameClassification;
  readonly keyframeDecision: readonly KeyframeReason[];
  readonly gopPosition: number;
  readonly rateControlSummary: Readonly<Record<string, unknown>>;
  readonly codecConfigurationSummary: Readonly<Record<string, unknown>>;
  readonly extradataGenerationRequirement: ExtradataGenerationPolicy;
  readonly discontinuityAction: string;
  readonly operationOrder: readonly string[];
  readonly temporaryByteEstimate: number;
  readonly outputByteEstimate: number;
  readonly deterministicScore: string;
  readonly warnings: readonly string[];
}
export type MediaEncodePlanSnapshot = MediaEncodePlan;
export interface VideoEncoderGopState extends SafeMetadata {
  readonly sessionId: string;
  readonly sessionGeneration: number;
  readonly gopGeneration: number;
  readonly currentGopIndex: number;
  readonly frameIndexInGop: number;
  readonly lastKeyframeFrameNumber: number;
  readonly lastKeyframePts: number;
  readonly nextForcedKeyframeFrame?: number;
  readonly pendingKeyframeReasons: readonly KeyframeReason[];
  readonly discontinuityGeneration: number;
}
export type VideoEncoderGopStateSnapshot = VideoEncoderGopState;
export interface EncodedMediaPacket extends SafeMetadata {
  readonly packetId: string;
  readonly packetGeneration: number;
  readonly sessionId: string;
  readonly sessionGeneration: number;
  readonly mediaType: MediaType;
  readonly codec: string;
  readonly streamIndexMetadata: number;
  readonly packetSequence: number;
  readonly pts: number;
  readonly dts: number;
  readonly duration: number;
  readonly timeBase: RationalTimeBase;
  readonly keyframe: boolean;
  readonly frameClassification: FrameClassification;
  readonly inputFrameBlockId: string;
  readonly inputGeneration: number;
  readonly discontinuityGeneration: number;
  readonly payloadReference: string;
  readonly payloadSizeBytes: number;
  readonly checksum: string;
  readonly signature: string;
  readonly codecConfigPacket: boolean;
  readonly codecConfigKind?: string;
  readonly endOfStream: boolean;
  readonly ownership: PacketOwner;
  readonly backendId: string;
}
export type EncodedMediaPacketSnapshot = EncodedMediaPacket;
export type CodecConfigurationPacketSnapshot = EncodedMediaPacket;
export interface EncodedPacketLease extends SafeMetadata {
  readonly leaseId: string;
  readonly packetId: string;
  readonly packetGeneration: number;
  readonly owner: PacketOwner;
  readonly acquiredSequence: number;
  readonly released: boolean;
  readonly releaseReason?: string;
}
export type EncodedPacketLeaseSnapshot = EncodedPacketLease;
export interface EncoderBackpressureSnapshot {
  readonly level: BackpressureLevel;
  readonly inputQueueDepth: number;
  readonly packetQueueDepth: number;
  readonly queueBytes: number;
  readonly estimatedLatencyNs: number;
  readonly blockedRequestCount: number;
  readonly droppedInputCount: number;
  readonly droppedPacketCount: number;
  readonly highWaterMark: number;
  readonly programPreservationPolicy: string;
}
export type BackpressureSnapshot = EncoderBackpressureSnapshot;
export interface EncodedAudioVideoCorrelationSnapshot extends SafeMetadata {
  readonly correlationId: string;
  readonly correlationGeneration: number;
  readonly outputRole: MediaEncoderOutputRole;
  readonly videoSessionId: string;
  readonly videoSessionGeneration: number;
  readonly audioSessionId: string;
  readonly audioSessionGeneration: number;
  readonly latestVideoPacketSequence?: number;
  readonly latestAudioPacketSequence?: number;
  readonly videoPts?: number;
  readonly audioPts?: number;
  readonly skew?: number;
  readonly discontinuityGeneration: number;
  readonly codecConfigReadiness: 'READY' | 'WAITING_VIDEO' | 'WAITING_AUDIO' | 'WAITING_BOTH';
  readonly synchronizationStatus: 'SYNCHRONIZED' | 'SKEWED' | 'WAITING' | 'FAILED';
  readonly futureMuxEligibility:
    'ELIGIBLE' | 'WAITING_CODEC_CONFIG' | 'WAITING_PACKETS' | 'ENCODER_ONLY' | 'FAILED';
  readonly health: 'healthy' | 'degraded' | 'failed';
}
export interface MediaEncoderConfigurationTransaction extends SafeMetadata {
  readonly transactionId: string;
  readonly transactionGeneration: number;
  readonly sessionId: string;
  readonly currentSessionGeneration: number;
  readonly currentConfigurationGenerations: readonly number[];
  readonly requestedConfigurationGenerations: readonly number[];
  readonly videoUpdates?: Partial<VideoEncoderConfiguration>;
  readonly audioUpdates?: Partial<AudioEncoderConfiguration>;
  readonly queueUpdates?: Partial<QueuePolicy>;
  readonly keyframePolicyUpdates?: readonly KeyframeReason[];
  readonly validationReport: Readonly<{
    valid: boolean;
    errors: readonly string[];
    warnings: readonly string[];
  }>;
  readonly reconfigurationPolicy: ReconfigurationPolicy;
  readonly scheduledRuntimeFrame?: string;
  readonly scheduledPts?: number;
  readonly state: 'CREATED' | 'COMMITTED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  readonly failureReason?: string;
  readonly createdAtNs: number;
  readonly committedAtNs?: number;
  readonly completedAtNs?: number;
}
export type MediaEncoderConfigurationTransactionSnapshot = MediaEncoderConfigurationTransaction;
export interface EncoderBackendDescriptor {
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly implementationClass: EncoderImplementationClass;
  readonly deterministic: boolean;
  readonly realVideoEncoding: boolean;
  readonly realAudioEncoding: boolean;
  readonly uploadsMedia: boolean;
}
export interface VideoEncoderBackendSnapshot {
  readonly descriptor: EncoderBackendDescriptor;
  readonly capabilities: Readonly<Record<string, unknown>>;
  readonly health: 'healthy' | 'degraded' | 'failed';
}
export interface AudioEncoderBackendSnapshot extends VideoEncoderBackendSnapshot {}
export interface SyntheticBackendFaults {
  readonly delayFrames?: number;
  readonly queuePressureAtDepth?: number;
  readonly failAllocationAtRequestModulo?: number;
  readonly timeoutAtRequestModulo?: number;
  readonly failBackendAtRequestModulo?: number;
  readonly deviceGenerationLossAtRequestModulo?: number;
}
export interface VideoEncoderBackend {
  readonly descriptor: EncoderBackendDescriptor;
  readonly capabilities: Readonly<Record<string, unknown>>;
  initializeSession(s: MediaEncoderSessionDefinition, c: VideoEncoderConfiguration): void;
  createPlan(
    r: MediaEncodeRequest,
    c: VideoEncoderConfiguration,
    g: VideoEncoderGopState,
  ): MediaEncodePlan;
  encode(p: MediaEncodePlan, r: MediaEncodeRequest): EncodedMediaPacket;
  createCodecConfigPacket(
    session: MediaEncoderSessionDefinition,
    config: VideoEncoderConfiguration,
    sequence: number,
  ): EncodedMediaPacket;
  requestKeyframe(sessionId: string, reason: KeyframeReason): void;
  drain(sessionId: string): EncodedMediaPacket[];
  flush(sessionId: string): void;
  reset(sessionId: string): void;
  reconfigure(sessionId: string, c: VideoEncoderConfiguration): void;
  shutdownSession(sessionId: string): void;
  shutdown(): void;
  snapshot(): VideoEncoderBackendSnapshot;
}
export interface AudioEncoderBackend {
  readonly descriptor: EncoderBackendDescriptor;
  readonly capabilities: Readonly<Record<string, unknown>>;
  initializeSession(s: MediaEncoderSessionDefinition, c: AudioEncoderConfiguration): void;
  createPlan(r: MediaEncodeRequest, c: AudioEncoderConfiguration): MediaEncodePlan;
  encode(p: MediaEncodePlan, r: MediaEncodeRequest): EncodedMediaPacket;
  createCodecConfigPacket(
    session: MediaEncoderSessionDefinition,
    config: AudioEncoderConfiguration,
    sequence: number,
  ): EncodedMediaPacket;
  drain(sessionId: string): EncodedMediaPacket[];
  flush(sessionId: string): void;
  reset(sessionId: string): void;
  reconfigure(sessionId: string, c: AudioEncoderConfiguration): void;
  shutdownSession(sessionId: string): void;
  shutdown(): void;
  snapshot(): AudioEncoderBackendSnapshot;
}
export interface MediaEncoderHealthSnapshot {
  readonly engineState: 'CREATED' | 'RUNNING' | 'SHUTDOWN';
  readonly healthState: 'healthy' | 'degraded' | 'failed' | 'shutdown';
  readonly videoBackendCount: number;
  readonly audioBackendCount: number;
  readonly activeVideoBackendIds: readonly string[];
  readonly activeAudioBackendIds: readonly string[];
  readonly registeredVideoConfigCount: number;
  readonly registeredAudioConfigCount: number;
  readonly registeredSessionCount: number;
  readonly activeSessionCount: number;
  readonly runningSessionCount: number;
  readonly drainingSessionCount: number;
  readonly failedSessionCount: number;
  readonly programVideoSessionId?: string;
  readonly programAudioSessionId?: string;
  readonly submittedVideoFrameCount: number;
  readonly submittedAudioBlockCount: number;
  readonly encodedVideoPacketCount: number;
  readonly encodedAudioPacketCount: number;
  readonly codecConfigPacketCount: number;
  readonly keyframeCount: number;
  readonly droppedVideoInputCount: number;
  readonly droppedAudioInputCount: number;
  readonly droppedPacketCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateSubmissionCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly timestampRegressionCount: number;
  readonly samplePositionRegressionCount: number;
  readonly queueFullCount: number;
  readonly backpressureState: BackpressureLevel;
  readonly backendFailureCount: number;
  readonly timeoutCount: number;
  readonly allocationFailureCount: number;
  readonly ownershipViolationCount: number;
  readonly activeInputQueueBytes: number;
  readonly activePacketQueueBytes: number;
  readonly peakQueueBytes: number;
  readonly temporaryBytes: number;
  readonly peakTemporaryBytes: number;
  readonly lastVideoPts?: number;
  readonly lastAudioPts?: number;
  readonly lastSuccessfulEncode?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: number;
}
export interface MediaEncoderTelemetrySnapshot {
  readonly backendRegistrations: number;
  readonly backendRemovals: number;
  readonly configRegistrations: number;
  readonly configUpdates: number;
  readonly configRemovals: number;
  readonly sessionCreates: number;
  readonly sessionStarts: number;
  readonly sessionPauses: number;
  readonly sessionResumes: number;
  readonly sessionStops: number;
  readonly sessionResets: number;
  readonly sessionFailures: number;
  readonly outputBindings: number;
  readonly outputUnbindings: number;
  readonly videoSubmissions: number;
  readonly audioSubmissions: number;
  readonly plansCreated: number;
  readonly planCacheHits: number;
  readonly planCacheMisses: number;
  readonly videoPacketsEncoded: number;
  readonly audioPacketsEncoded: number;
  readonly codecConfigPackets: number;
  readonly keyframeRequests: number;
  readonly keyframeCompletions: number;
  readonly frameClassifications: Readonly<Record<FrameClassification, number>>;
  readonly gopResets: number;
  readonly reconfigurations: number;
  readonly drains: number;
  readonly flushes: number;
  readonly inputDrops: number;
  readonly packetDrops: number;
  readonly queueHighWaterMarks: number;
  readonly backpressureTransitions: number;
  readonly duplicateRequests: number;
  readonly duplicateSubmissions: number;
  readonly staleGenerations: number;
  readonly timestampRegressions: number;
  readonly samplePositionRegressions: number;
  readonly unsupportedRejects: number;
  readonly backendFailures: number;
  readonly timeouts: number;
  readonly allocationFailures: number;
  readonly ownershipViolations: number;
  readonly estimatedInputBytes: number;
  readonly estimatedEncodedBytes: number;
  readonly estimatedCompressionRatioMetadata: number;
  readonly averagePacketSize: number;
  readonly maximumPacketSize: number;
  readonly averageQueueDepth: number;
  readonly maximumQueueDepth: number;
  readonly currentRequestIds: readonly string[];
  readonly activeSessionIds: readonly string[];
  readonly lastEncoderEvent?: MediaEncoderEventType;
  readonly healthSummary: string;
}
export interface MediaEncoderValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}
export interface MediaEncoderSessionStateSnapshot {
  readonly definition: MediaEncoderSessionDefinitionSnapshot;
  readonly state: MediaEncoderSessionState;
  readonly gopState: VideoEncoderGopStateSnapshot;
  readonly inputQueue: EncoderInputQueueSnapshot;
  readonly packetQueue: EncoderPacketQueueSnapshot;
  readonly backpressure: EncoderBackpressureSnapshot;
}
export interface EncoderInputQueueSnapshot {
  readonly sessionId: string;
  readonly depth: number;
  readonly highWater: number;
  readonly bounded: true;
}
export interface EncoderPacketQueueSnapshot {
  readonly sessionId: string;
  readonly depth: number;
  readonly bytes: number;
  readonly bounded: true;
}
export interface EncoderRateControlStateSnapshot {
  readonly sessionId: string;
  readonly targetBitrate: number;
  readonly estimatedPacketSize: number;
  readonly syntheticOnly: true;
}
export interface EncoderDrainSnapshot {
  readonly sessionId: string;
  readonly state: 'IDLE' | 'DRAINING' | 'COMPLETED';
  readonly generation: number;
}
export interface EncoderFlushSnapshot {
  readonly sessionId: string;
  readonly state: 'IDLE' | 'FLUSHING' | 'COMPLETED';
  readonly generation: number;
}
export interface MediaEncoderEngineSnapshot {
  readonly version: string;
  readonly videoConfigurations: readonly VideoEncoderConfigurationSnapshot[];
  readonly audioConfigurations: readonly AudioEncoderConfigurationSnapshot[];
  readonly sessions: readonly MediaEncoderSessionStateSnapshot[];
  readonly outputBindings: readonly MediaEncoderOutputBindingSnapshot[];
  readonly plans: readonly MediaEncodePlanSnapshot[];
  readonly packets: readonly EncodedMediaPacketSnapshot[];
  readonly correlations: readonly EncodedAudioVideoCorrelationSnapshot[];
  readonly videoBackends: readonly VideoEncoderBackendSnapshot[];
  readonly audioBackends: readonly AudioEncoderBackendSnapshot[];
  readonly health: MediaEncoderHealthSnapshot;
  readonly telemetry: MediaEncoderTelemetrySnapshot;
  readonly events: readonly MediaEncoderEventType[];
  readonly watchdogIncidents: readonly MediaEncoderWatchdogIncident[];
  readonly validation: MediaEncoderValidationReport;
}

const OPERATION_ORDER = [
  'validate session state',
  'validate input generation',
  'validate configuration',
  'validate synchronized timeline',
  'normalize timestamp',
  'validate monotonic PTS',
  'classify video frame or audio block',
  'decide keyframe/frame type',
  'resolve codec plan',
  'reserve output packet ownership',
  'invoke backend',
  'validate packet sequence/timestamps',
  'publish encoded packet',
  'update session/GOP state',
  'release temporary resources',
] as const;

const nowNs = () => Date.now() * 1_000_000;
const freeze = <T>(value: T): Readonly<T> => Object.freeze(value);
const json = (value: unknown) =>
  JSON.stringify(value, Object.keys(value as Record<string, unknown>).sort());
const validTimeBase = (timeBase: RationalTimeBase) =>
  timeBase.numerator > 0 &&
  timeBase.denominator > 0 &&
  Number.isFinite(timeBase.numerator) &&
  Number.isFinite(timeBase.denominator);
const fnv = (input: string) => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
};
const roleToAv = (role: MediaEncoderOutputRole): AudioVideoSyncOutputRole => {
  if (role === 'AUXILIARY') return 'AUX';
  if (role === 'HORIZONTAL_PROGRAM' || role === 'VERTICAL_PROGRAM' || role === 'SQUARE_PROGRAM')
    return 'PROGRAM';
  if (role === 'CUSTOM') return 'MONITOR';
  return role as AudioVideoSyncOutputRole;
};
const defaultQueuePolicy = (): QueuePolicy => ({
  maxInputCount: 8,
  maxInputDuration: 8,
  maxInputBytes: 64_000_000,
  maxLatencyNs: 500_000_000,
  inputOverflowPolicy: 'REJECT_NEW',
  maxPacketCount: 64,
  maxPacketDuration: 64,
  maxPacketBytes: 32_000_000,
  packetOverflowPolicy: 'REJECT_NEW',
});
const videoProfiles: Record<VideoEncoderCodec, readonly VideoEncoderProfile[]> = {
  H264: ['BASELINE', 'MAIN', 'HIGH', 'HIGH_10_METADATA', 'HIGH_422_METADATA', 'HIGH_444_METADATA'],
  H265: ['MAIN', 'MAIN_10', 'MAIN_422_10_METADATA', 'MAIN_444_METADATA'],
  AV1: ['MAIN', 'HIGH_METADATA', 'PROFESSIONAL_METADATA'],
  VP9: ['PROFILE_0', 'PROFILE_1_METADATA', 'PROFILE_2', 'PROFILE_3_METADATA'],
  MPEG2_VIDEO: ['MAIN'],
  PRORES_METADATA: ['MAIN'],
  DNXHR_METADATA: ['MAIN'],
  RAW_VIDEO_METADATA: ['MAIN'],
  CUSTOM_TYPED: ['MAIN'],
};
const codecConfigKind = (codec: string) => {
  if (codec === 'H264') return 'H264_SPS_PPS_METADATA';
  if (codec === 'H265') return 'H265_VPS_SPS_PPS_METADATA';
  if (codec === 'AV1') return 'AV1_SEQUENCE_HEADER_METADATA';
  if (codec === 'VP9') return 'VP9_CODEC_PRIVATE_METADATA';
  if (codec === 'AAC') return 'AAC_AUDIO_SPECIFIC_CONFIG_METADATA';
  if (codec === 'OPUS') return 'OPUS_HEAD_TAGS_METADATA';
  return 'CUSTOM_CODEC_INITIALIZATION_METADATA';
};

export class MediaEncoderFoundationError extends RuntimeEngineError {
  constructor(
    readonly code: EncoderErrorType | MediaEncoderWatchdogIncident | string,
    message = code,
    details: Record<string, unknown> = {},
  ) {
    super(code, message, { sanitized: true, ...details });
  }
}

export function createVideoEncoderConfiguration(
  input: Partial<VideoEncoderConfiguration> &
    Pick<
      VideoEncoderConfiguration,
      | 'encoderConfigId'
      | 'codec'
      | 'profile'
      | 'width'
      | 'height'
      | 'pixelFormat'
      | 'colorMetadata'
      | 'frameRate'
      | 'codecTimeBase'
      | 'outputRole'
    >,
): VideoEncoderConfiguration {
  const createdAtNs = input.createdAtNs ?? 1;
  const config: VideoEncoderConfiguration = {
    configVersion: MEDIA_ENCODER_FOUNDATION_VERSION,
    configGeneration: 1,
    level: '4.1',
    tier: 'BALANCED',
    alphaMode: 'NONE',
    bitrateMode: 'CBR',
    targetBitrate: 4_500_000,
    maximumBitrate: 6_000_000,
    minimumBitrate: 1_000_000,
    qualityValue: 0.7,
    gopSize: 60,
    minimumKeyframeInterval: 1,
    maximumKeyframeInterval: 120,
    bFrameCount: 0,
    referenceFrameCount: 1,
    sceneChangeDetectionPolicy: 'METADATA_ONLY',
    forcedKeyframePolicy: 'FIXED_INTERVAL',
    lowLatencyMode: true,
    entropyModeMetadata: { synthetic: true },
    rateControlBufferMetadata: { synthetic: true },
    lookaheadMetadata: { synthetic: true },
    latencyClass: 'LOW_LATENCY',
    backendPreference: 'SYNTHETIC',
    extradataPolicy: 'ON_SESSION_START',
    createdAtNs,
    updatedAtNs: input.updatedAtNs ?? createdAtNs,
    safeMetadata: {},
    ...input,
  };
  validateVideoEncoderConfiguration(config);
  return freeze(config) as VideoEncoderConfiguration;
}

export function createAudioEncoderConfiguration(
  input: Partial<AudioEncoderConfiguration> &
    Pick<
      AudioEncoderConfiguration,
      | 'encoderConfigId'
      | 'codec'
      | 'profile'
      | 'sampleFormat'
      | 'sampleRate'
      | 'channelLayout'
      | 'channelCount'
      | 'codecTimeBase'
      | 'outputRole'
    >,
): AudioEncoderConfiguration {
  const createdAtNs = input.createdAtNs ?? 1;
  const config: AudioEncoderConfiguration = {
    configVersion: MEDIA_ENCODER_FOUNDATION_VERSION,
    configGeneration: 1,
    bitrateMode: 'CBR',
    targetBitrate: 160_000,
    maximumBitrate: 192_000,
    frameSampleCount: 1024,
    primingSamplesMetadata: 0,
    encoderDelayMetadata: 0,
    lowDelayMode: true,
    backendPreference: 'SYNTHETIC',
    extradataPolicy: 'ON_SESSION_START',
    createdAtNs,
    updatedAtNs: input.updatedAtNs ?? createdAtNs,
    safeMetadata: {},
    ...input,
  };
  validateAudioEncoderConfiguration(config);
  return freeze(config) as AudioEncoderConfiguration;
}

export function validateVideoEncoderConfiguration(config: VideoEncoderConfiguration) {
  if (
    ![
      'H264',
      'H265',
      'AV1',
      'VP9',
      'MPEG2_VIDEO',
      'PRORES_METADATA',
      'DNXHR_METADATA',
      'RAW_VIDEO_METADATA',
      'CUSTOM_TYPED',
    ].includes(config.codec)
  )
    throw new MediaEncoderFoundationError('EncoderCodecUnsupported');
  if (!videoProfiles[config.codec]?.includes(config.profile))
    throw new MediaEncoderFoundationError('EncoderProfileUnsupported');
  if (!config.level || config.level === 'auto')
    throw new MediaEncoderFoundationError('EncoderLevelUnsupported');
  if (config.width <= 0 || config.height <= 0 || config.width > 16384 || config.height > 16384)
    throw new MediaEncoderFoundationError('VideoEncoderConfigurationInvalid');
  if (!validTimeBase(config.frameRate) || !validTimeBase(config.codecTimeBase))
    throw new MediaEncoderFoundationError('VideoEncoderConfigurationInvalid');
  if (!config.pixelFormat || config.pixelFormat === 'AUTO')
    throw new MediaEncoderFoundationError('EncoderFormatUnsupported');
  if (!config.colorMetadata || Object.keys(config.colorMetadata).length === 0)
    throw new MediaEncoderFoundationError('VideoEncoderConfigurationInvalid');
  if (!(
    config.minimumBitrate > 0 &&
    config.targetBitrate > 0 &&
    config.maximumBitrate >= config.targetBitrate &&
    config.targetBitrate >= config.minimumBitrate
  ))
    throw new MediaEncoderFoundationError('VideoEncoderConfigurationInvalid');
  if (
    config.gopSize <= 0 ||
    config.minimumKeyframeInterval < 0 ||
    config.maximumKeyframeInterval < config.minimumKeyframeInterval
  )
    throw new MediaEncoderFoundationError('EncoderKeyframeRequestInvalid');
  if (config.bFrameCount < 0 || config.referenceFrameCount <= 0)
    throw new MediaEncoderFoundationError('EncoderGopStateInvalid');
  if (config.backendPreference !== 'SYNTHETIC' && config.backendPreference !== 'CUSTOM')
    throw new MediaEncoderFoundationError('VideoEncoderBackendNotFound');
}

export function validateAudioEncoderConfiguration(config: AudioEncoderConfiguration) {
  if (
    ![
      'AAC',
      'OPUS',
      'MP3_METADATA',
      'AC3_METADATA',
      'EAC3_METADATA',
      'FLAC_METADATA',
      'PCM_S16_METADATA',
      'PCM_S24_METADATA',
      'PCM_F32_METADATA',
      'CUSTOM_TYPED',
    ].includes(config.codec)
  )
    throw new MediaEncoderFoundationError('EncoderCodecUnsupported');
  if (
    !['LC', 'HE_METADATA', 'LOW_DELAY', 'MAIN_METADATA', 'CUSTOM_METADATA'].includes(config.profile)
  )
    throw new MediaEncoderFoundationError('EncoderProfileUnsupported');
  if (![8_000, 16_000, 32_000, 44_100, 48_000, 96_000].includes(config.sampleRate))
    throw new MediaEncoderFoundationError('AudioEncoderConfigurationInvalid');
  const expected =
    config.channelLayout === 'MONO'
      ? 1
      : config.channelLayout === 'STEREO'
        ? 2
        : config.channelLayout === '5_1'
          ? 6
          : config.channelCount;
  if (config.channelCount !== expected || config.channelCount <= 0)
    throw new MediaEncoderFoundationError('AudioEncoderConfigurationInvalid');
  if (!config.sampleFormat || config.sampleFormat === 'AUTO')
    throw new MediaEncoderFoundationError('EncoderFormatUnsupported');
  if (!validTimeBase(config.codecTimeBase) || config.frameSampleCount <= 0)
    throw new MediaEncoderFoundationError('AudioEncoderConfigurationInvalid');
  if (!(config.targetBitrate > 0 && config.maximumBitrate >= config.targetBitrate))
    throw new MediaEncoderFoundationError('AudioEncoderConfigurationInvalid');
}

function makePacket(input: {
  plan: MediaEncodePlan;
  request: MediaEncodeRequest;
  inputId: string;
  inputGeneration: number;
  discontinuityGeneration: number;
  classification: FrameClassification;
  keyframe: boolean;
  sequence: number;
  codecConfigPacket?: boolean;
  codecConfigKind?: string;
  payloadSizeBytes?: number;
}): EncodedMediaPacket {
  const checksum = fnv(
    json([
      input.plan.planId,
      input.sequence,
      input.plan.normalizedPts,
      input.plan.normalizedDts,
      input.plan.outputByteEstimate,
      input.inputId,
      input.codecConfigKind ?? 'packet',
    ]),
  );
  return freeze({
    packetId: `packet:${input.plan.sessionId}:${input.sequence}:${checksum}`,
    packetGeneration: input.plan.sessionGeneration,
    sessionId: input.plan.sessionId,
    sessionGeneration: input.plan.sessionGeneration,
    mediaType: input.plan.mediaType,
    codec: input.plan.codec,
    streamIndexMetadata:
      input.plan.mediaType === 'VIDEO' ? 0 : input.plan.mediaType === 'AUDIO' ? 1 : 2,
    packetSequence: input.sequence,
    pts: input.plan.normalizedPts,
    dts: input.plan.normalizedDts,
    duration: input.plan.normalizedDuration,
    timeBase: (input.request.input as VideoEncodeInputFrame | AudioEncodeInputBlock).timeBase,
    keyframe: input.keyframe,
    frameClassification: input.classification,
    inputFrameBlockId: input.inputId,
    inputGeneration: input.inputGeneration,
    discontinuityGeneration: input.discontinuityGeneration,
    payloadReference: `synthetic-payload:${checksum}`,
    payloadSizeBytes: input.payloadSizeBytes ?? input.plan.outputByteEstimate,
    checksum,
    signature: `ubos-v5.6.6:${checksum}`,
    codecConfigPacket: input.codecConfigPacket ?? false,
    ...(input.codecConfigKind ? { codecConfigKind: input.codecConfigKind } : {}),
    endOfStream: false,
    ownership: 'ENCODER_OWNED',
    backendId: input.plan.backendId,
    safeMetadata: {},
  }) as EncodedMediaPacket;
}

export class SyntheticVideoEncoderBackend implements VideoEncoderBackend {
  readonly descriptor: EncoderBackendDescriptor;
  readonly capabilities: Readonly<Record<string, unknown>>;
  private healthState: 'healthy' | 'degraded' | 'failed' = 'healthy';

  constructor(readonly faults: SyntheticBackendFaults = {}) {
    this.descriptor = freeze({
      backendId: 'synthetic-video-encoder',
      backendGeneration: 1,
      implementationClass: 'SYNTHETIC',
      deterministic: true,
      realVideoEncoding: false,
      realAudioEncoding: false,
      uploadsMedia: false,
    }) as EncoderBackendDescriptor;
    this.capabilities = freeze({
      codecs: [
        'H264',
        'H265',
        'AV1',
        'VP9',
        'MPEG2_VIDEO',
        'PRORES_METADATA',
        'DNXHR_METADATA',
        'RAW_VIDEO_METADATA',
      ],
      profiles: videoProfiles,
      hardwareAcceleration: false,
      realVideoEncoding: false,
      deterministic: true,
      bFrames: true,
      codecConfigSupport: true,
      maximumSessions: 128,
    });
  }

  initializeSession(_session: MediaEncoderSessionDefinition, config: VideoEncoderConfiguration) {
    validateVideoEncoderConfiguration(config);
  }

  createPlan(
    request: MediaEncodeRequest,
    config: VideoEncoderConfiguration,
    gop: VideoEncoderGopState,
  ): MediaEncodePlan {
    const frame = request.input as VideoEncodeInputFrame;
    validateVideoInputAgainstConfiguration(frame, config);
    this.maybeFault(request.requestId);
    const sinceKey = frame.frameNumber - gop.lastKeyframeFrameNumber;
    const reasons = new Set<KeyframeReason>();
    if (gop.lastKeyframeFrameNumber < 0) reasons.add('OUTPUT_START');
    if (frame.forceKeyframe && sinceKey >= config.minimumKeyframeInterval) reasons.add('MANUAL');
    if (frame.discontinuityGeneration !== gop.discontinuityGeneration) reasons.add('DISCONTINUITY');
    if (sinceKey >= config.maximumKeyframeInterval) reasons.add('FIXED_INTERVAL');
    const keyframeDecision = [...reasons].sort();
    const keyframe = keyframeDecision.length > 0;
    const frameInGop = keyframe ? 0 : (gop.frameIndexInGop + 1) % Math.max(1, config.gopSize);
    const classification: FrameClassification = keyframe
      ? 'IDR'
      : config.bFrameCount > 0 && frameInGop % (config.bFrameCount + 1) !== 0
        ? 'B'
        : frameInGop === 0
          ? 'I'
          : 'P';
    const frameRate = config.frameRate.denominator / config.frameRate.numerator;
    const complexity =
      1 +
      (frame.frameNumber % 17) / 32 +
      (keyframe ? 0.65 : 0) +
      (classification === 'B' ? -0.2 : 0);
    const estimated = Math.max(
      64,
      Math.round((config.targetBitrate / Math.max(1, frameRate) / 8) * complexity),
    );
    const reorderDelay = classification === 'B' ? config.bFrameCount * frame.duration : 0;
    const dts = Math.max(0, frame.pts - reorderDelay);
    return freeze({
      planId: `plan:${request.sessionId}:${request.requestId}:${fnv(json([config.configGeneration, gop.gopGeneration, frame.frameId]))}`,
      requestId: request.requestId,
      sessionId: request.sessionId,
      sessionGeneration: request.expectedSessionGeneration,
      backendId: this.descriptor.backendId,
      backendGeneration: this.descriptor.backendGeneration,
      mediaType: 'VIDEO',
      codec: config.codec,
      inputSummary: {
        frameId: frame.frameId,
        frameNumber: frame.frameNumber,
        frameGeneration: frame.frameGeneration,
      },
      outputRoleBinding: config.outputRole,
      normalizedPts: frame.pts,
      normalizedDts: dts,
      normalizedDuration: frame.duration,
      frameClassification: classification,
      keyframeDecision,
      gopPosition: frameInGop,
      rateControlSummary: {
        syntheticOnly: true,
        targetBitrate: config.targetBitrate,
        maximumBitrate: config.maximumBitrate,
        minimumBitrate: config.minimumBitrate,
        qualityValue: config.qualityValue,
        estimatedPacketSize: estimated,
        bFrameReorderDelay: reorderDelay,
      },
      codecConfigurationSummary: {
        metadataOnly: true,
        configGeneration: config.configGeneration,
        kind: codecConfigKind(config.codec),
      },
      extradataGenerationRequirement: config.extradataPolicy,
      discontinuityAction:
        frame.discontinuityGeneration !== gop.discontinuityGeneration ? 'RESET_GOP' : 'NONE',
      operationOrder: OPERATION_ORDER,
      temporaryByteEstimate: estimated * 2,
      outputByteEstimate: estimated,
      deterministicScore: fnv(
        json([
          request.requestId,
          frame.frameId,
          frame.pts,
          config.configGeneration,
          gop.gopGeneration,
          classification,
        ]),
      ),
      warnings: [
        'Synthetic video packet metadata only; no native compression, pixel readback, or bitstream bytes',
      ],
      safeMetadata: {},
    }) as MediaEncodePlan;
  }

  encode(plan: MediaEncodePlan, request: MediaEncodeRequest) {
    const frame = request.input as VideoEncodeInputFrame;
    return makePacket({
      plan,
      request,
      inputId: frame.frameId,
      inputGeneration: frame.frameGeneration,
      discontinuityGeneration: frame.discontinuityGeneration,
      classification: plan.frameClassification,
      keyframe: plan.keyframeDecision.length > 0,
      sequence: -1,
    });
  }

  createCodecConfigPacket(
    session: MediaEncoderSessionDefinition,
    config: VideoEncoderConfiguration,
    sequence: number,
  ) {
    const request = codecConfigRequest(session, 'VIDEO');
    const plan = codecConfigPlan(
      session,
      this.descriptor,
      'VIDEO',
      config.codec,
      config.outputRole,
      sequence,
      codecConfigKind(config.codec),
    );
    return makePacket({
      plan,
      request,
      inputId: `codec-config:${config.encoderConfigId}`,
      inputGeneration: config.configGeneration,
      discontinuityGeneration: 0,
      classification: 'UNKNOWN',
      keyframe: false,
      sequence,
      codecConfigPacket: true,
      codecConfigKind: codecConfigKind(config.codec),
      payloadSizeBytes: 0,
    });
  }

  requestKeyframe() {}
  drain() {
    return [];
  }
  flush() {}
  reset() {
    this.healthState = 'healthy';
  }
  reconfigure(_sessionId: string, config: VideoEncoderConfiguration) {
    validateVideoEncoderConfiguration(config);
  }
  shutdownSession() {}
  shutdown() {
    this.healthState = 'healthy';
  }
  snapshot(): VideoEncoderBackendSnapshot {
    return freeze({
      descriptor: this.descriptor,
      capabilities: this.capabilities,
      health: this.healthState,
    }) as VideoEncoderBackendSnapshot;
  }

  private maybeFault(requestId: string) {
    const n = Number.parseInt(fnv(requestId).slice(0, 6), 16);
    if (
      this.faults.failAllocationAtRequestModulo &&
      n % this.faults.failAllocationAtRequestModulo === 0
    )
      throw new MediaEncoderFoundationError('EncoderAllocationFailed');
    if (this.faults.timeoutAtRequestModulo && n % this.faults.timeoutAtRequestModulo === 0)
      throw new MediaEncoderFoundationError('EncoderTimeout');
    if (
      this.faults.failBackendAtRequestModulo &&
      n % this.faults.failBackendAtRequestModulo === 0
    ) {
      this.healthState = 'failed';
      throw new MediaEncoderFoundationError('EncoderBackendFailed');
    }
    if (
      this.faults.deviceGenerationLossAtRequestModulo &&
      n % this.faults.deviceGenerationLossAtRequestModulo === 0
    )
      throw new MediaEncoderFoundationError('ENCODER_DEVICE_GENERATION_LOST');
  }
}

export class SyntheticAudioEncoderBackend implements AudioEncoderBackend {
  readonly descriptor: EncoderBackendDescriptor;
  readonly capabilities: Readonly<Record<string, unknown>>;
  private healthState: 'healthy' | 'degraded' | 'failed' = 'healthy';

  constructor(readonly faults: SyntheticBackendFaults = {}) {
    this.descriptor = freeze({
      backendId: 'synthetic-audio-encoder',
      backendGeneration: 1,
      implementationClass: 'SYNTHETIC',
      deterministic: true,
      realVideoEncoding: false,
      realAudioEncoding: false,
      uploadsMedia: false,
    }) as EncoderBackendDescriptor;
    this.capabilities = freeze({
      codecs: [
        'AAC',
        'OPUS',
        'MP3_METADATA',
        'AC3_METADATA',
        'EAC3_METADATA',
        'FLAC_METADATA',
        'PCM_S16_METADATA',
        'PCM_S24_METADATA',
        'PCM_F32_METADATA',
      ],
      realAudioEncoding: false,
      deterministic: true,
      codecConfigSupport: true,
      maximumSessions: 128,
    });
  }

  initializeSession(_session: MediaEncoderSessionDefinition, config: AudioEncoderConfiguration) {
    validateAudioEncoderConfiguration(config);
  }

  createPlan(request: MediaEncodeRequest, config: AudioEncoderConfiguration): MediaEncodePlan {
    const block = request.input as AudioEncodeInputBlock;
    validateAudioInputAgainstConfiguration(block, config);
    this.maybeFault(request.requestId);
    const durationSeconds = block.sampleCount / block.sampleRate;
    const estimated = Math.max(16, Math.round((config.targetBitrate * durationSeconds) / 8));
    return freeze({
      planId: `plan:${request.sessionId}:${request.requestId}:${fnv(json([config.configGeneration, block.blockId, block.samplePosition]))}`,
      requestId: request.requestId,
      sessionId: request.sessionId,
      sessionGeneration: request.expectedSessionGeneration,
      backendId: this.descriptor.backendId,
      backendGeneration: this.descriptor.backendGeneration,
      mediaType: 'AUDIO',
      codec: config.codec,
      inputSummary: {
        blockId: block.blockId,
        blockSequence: block.blockSequence,
        blockGeneration: block.blockGeneration,
      },
      outputRoleBinding: config.outputRole,
      normalizedPts: block.pts,
      normalizedDts: block.pts,
      normalizedDuration: block.duration,
      frameClassification: 'UNKNOWN',
      keyframeDecision: [],
      gopPosition: 0,
      rateControlSummary: {
        syntheticOnly: true,
        targetBitrate: config.targetBitrate,
        estimatedPacketSize: estimated,
        primingSamples: config.primingSamplesMetadata,
        delaySamples: config.encoderDelayMetadata,
        paddingSamplesMetadata: Math.max(0, config.frameSampleCount - block.sampleCount),
      },
      codecConfigurationSummary: {
        metadataOnly: true,
        configGeneration: config.configGeneration,
        kind: codecConfigKind(config.codec),
      },
      extradataGenerationRequirement: config.extradataPolicy,
      discontinuityAction: 'MARK_PACKETS',
      operationOrder: OPERATION_ORDER,
      temporaryByteEstimate: estimated * 2,
      outputByteEstimate: estimated,
      deterministicScore: fnv(
        json([request.requestId, block.blockId, block.pts, config.configGeneration]),
      ),
      warnings: [
        'Synthetic audio packet metadata only; no native compression or PCM payload exposure',
      ],
      safeMetadata: {},
    }) as MediaEncodePlan;
  }

  encode(plan: MediaEncodePlan, request: MediaEncodeRequest) {
    const block = request.input as AudioEncodeInputBlock;
    return makePacket({
      plan,
      request,
      inputId: block.blockId,
      inputGeneration: block.blockGeneration,
      discontinuityGeneration: block.discontinuityGeneration,
      classification: 'UNKNOWN',
      keyframe: false,
      sequence: -1,
    });
  }

  createCodecConfigPacket(
    session: MediaEncoderSessionDefinition,
    config: AudioEncoderConfiguration,
    sequence: number,
  ) {
    const request = codecConfigRequest(session, 'AUDIO');
    const plan = codecConfigPlan(
      session,
      this.descriptor,
      'AUDIO',
      config.codec,
      config.outputRole,
      sequence,
      codecConfigKind(config.codec),
    );
    return makePacket({
      plan,
      request,
      inputId: `codec-config:${config.encoderConfigId}`,
      inputGeneration: config.configGeneration,
      discontinuityGeneration: 0,
      classification: 'UNKNOWN',
      keyframe: false,
      sequence,
      codecConfigPacket: true,
      codecConfigKind: codecConfigKind(config.codec),
      payloadSizeBytes: 0,
    });
  }

  drain() {
    return [];
  }
  flush() {}
  reset() {
    this.healthState = 'healthy';
  }
  reconfigure(_sessionId: string, config: AudioEncoderConfiguration) {
    validateAudioEncoderConfiguration(config);
  }
  shutdownSession() {}
  shutdown() {
    this.healthState = 'healthy';
  }
  snapshot(): AudioEncoderBackendSnapshot {
    return freeze({
      descriptor: this.descriptor,
      capabilities: this.capabilities,
      health: this.healthState,
    }) as AudioEncoderBackendSnapshot;
  }

  private maybeFault(requestId: string) {
    const n = Number.parseInt(fnv(requestId).slice(0, 6), 16);
    if (
      this.faults.failAllocationAtRequestModulo &&
      n % this.faults.failAllocationAtRequestModulo === 0
    )
      throw new MediaEncoderFoundationError('EncoderAllocationFailed');
    if (this.faults.timeoutAtRequestModulo && n % this.faults.timeoutAtRequestModulo === 0)
      throw new MediaEncoderFoundationError('EncoderTimeout');
    if (
      this.faults.failBackendAtRequestModulo &&
      n % this.faults.failBackendAtRequestModulo === 0
    ) {
      this.healthState = 'failed';
      throw new MediaEncoderFoundationError('EncoderBackendFailed');
    }
  }
}

function validateVideoInputAgainstConfiguration(
  frame: VideoEncodeInputFrame,
  config: VideoEncoderConfiguration,
) {
  if (
    frame.width !== config.width ||
    frame.height !== config.height ||
    frame.pixelFormat !== config.pixelFormat ||
    frame.alphaMode !== config.alphaMode
  )
    throw new MediaEncoderFoundationError('EncoderFormatUnsupported');
  if (frame.frameGeneration <= 0 || frame.storageGeneration <= 0)
    throw new MediaEncoderFoundationError('ENCODER_INPUT_GENERATION_STALE');
  if (frame.frameOwnership === 'RELEASED')
    throw new MediaEncoderFoundationError('EncoderOwnershipViolation');
}
function validateAudioInputAgainstConfiguration(
  block: AudioEncodeInputBlock,
  config: AudioEncoderConfiguration,
) {
  if (
    block.sampleRate !== config.sampleRate ||
    block.sampleFormat !== config.sampleFormat ||
    block.channelLayout !== config.channelLayout
  )
    throw new MediaEncoderFoundationError('EncoderFormatUnsupported');
  if (block.blockGeneration <= 0)
    throw new MediaEncoderFoundationError('ENCODER_INPUT_GENERATION_STALE');
  if (block.ownership === 'RELEASED')
    throw new MediaEncoderFoundationError('EncoderOwnershipViolation');
}
function codecConfigRequest(
  session: MediaEncoderSessionDefinition,
  mediaType: MediaType,
): MediaEncodeRequest {
  const input = {
    submissionId: `codec-config:${session.sessionId}`,
    sessionId: session.sessionId,
    sessionGeneration: session.sessionGeneration,
    runtimeFrame: 'codec-config',
    pts: 0,
    duration: 0,
    timeBase: { numerator: 1, denominator: 1 },
    discontinuityGeneration: 0,
    safeMetadata: {},
  } as VideoEncodeInputFrame;
  return freeze({
    requestId: `request:codec-config:${session.sessionId}`,
    mediaType,
    sessionId: session.sessionId,
    expectedSessionGeneration: session.sessionGeneration,
    expectedConfigurationGenerations: [],
    input,
    expectedSynchronizationGeneration: 0,
    expectedOutputRoleGeneration: 0,
    expectedDeviceBackendGeneration: 1,
    requestedRuntimeFrame: 'codec-config',
    requestedPts: 0,
    deadlineNs: 0,
    correlationId: `codec-config:${session.sessionId}`,
    safeMetadata: {},
  }) as MediaEncodeRequest;
}
function codecConfigPlan(
  session: MediaEncoderSessionDefinition,
  backend: EncoderBackendDescriptor,
  mediaType: MediaType,
  codec: string,
  role: MediaEncoderOutputRole,
  sequence: number,
  kind: string,
): MediaEncodePlan {
  return freeze({
    planId: `plan:codec-config:${session.sessionId}:${sequence}`,
    requestId: `request:codec-config:${session.sessionId}`,
    sessionId: session.sessionId,
    sessionGeneration: session.sessionGeneration,
    backendId: backend.backendId,
    backendGeneration: backend.backendGeneration,
    mediaType,
    codec,
    inputSummary: { codecConfigKind: kind },
    outputRoleBinding: role,
    normalizedPts: 0,
    normalizedDts: 0,
    normalizedDuration: 0,
    frameClassification: 'UNKNOWN',
    keyframeDecision: [],
    gopPosition: 0,
    rateControlSummary: { syntheticOnly: true },
    codecConfigurationSummary: { metadataOnly: true, kind },
    extradataGenerationRequirement: 'ON_SESSION_START',
    discontinuityAction: 'NONE',
    operationOrder: OPERATION_ORDER,
    temporaryByteEstimate: 0,
    outputByteEstimate: 0,
    deterministicScore: fnv(`${session.sessionId}:${kind}:${sequence}`),
    warnings: ['Codec configuration metadata packet only; no codec private bytes are exposed'],
    safeMetadata: {},
  }) as MediaEncodePlan;
}

interface InternalSessionState {
  definition: MediaEncoderSessionDefinition;
  state: MediaEncoderSessionState;
  sequence: number;
  lastPts?: number;
  lastSamplePosition?: number;
  gop: VideoEncoderGopState;
  inputQueue: string[];
  packetQueue: EncodedMediaPacket[];
  leases: Map<string, EncodedPacketLease>;
  codecConfigEmitted: boolean;
  droppedInput: number;
  droppedPacket: number;
  blocked: number;
  highWater: number;
  drainGeneration: number;
  flushGeneration: number;
}

const blankFrameClassifications = (): Record<FrameClassification, number> => ({
  IDR: 0,
  I: 0,
  P: 0,
  B: 0,
  KEY: 0,
  INTRA: 0,
  INTER: 0,
  UNKNOWN: 0,
});

export class MediaEncoderFoundationEngine {
  private engineState: 'CREATED' | 'RUNNING' | 'SHUTDOWN' = 'CREATED';
  private videoBackends = new Map<string, VideoEncoderBackend>();
  private audioBackends = new Map<string, AudioEncoderBackend>();
  private videoConfigs = new Map<string, VideoEncoderConfiguration>();
  private audioConfigs = new Map<string, AudioEncoderConfiguration>();
  private sessions = new Map<string, InternalSessionState>();
  private bindings = new Map<string, MediaEncoderOutputBinding>();
  private requests = new Set<string>();
  private submissions = new Set<string>();
  private packetIds = new Set<string>();
  private planCache = new Map<string, MediaEncodePlan>();
  private plans: MediaEncodePlan[] = [];
  private events: MediaEncoderEventType[] = ['MediaEncoderEngineCreated'];
  private incidents: MediaEncoderWatchdogIncident[] = [];
  private correlations = new Map<MediaEncoderOutputRole, EncodedAudioVideoCorrelationSnapshot>();
  private telemetryState = {
    backendRegistrations: 0,
    backendRemovals: 0,
    configRegistrations: 0,
    configUpdates: 0,
    configRemovals: 0,
    sessionCreates: 0,
    sessionStarts: 0,
    sessionPauses: 0,
    sessionResumes: 0,
    sessionStops: 0,
    sessionResets: 0,
    sessionFailures: 0,
    outputBindings: 0,
    outputUnbindings: 0,
    videoSubmissions: 0,
    audioSubmissions: 0,
    plansCreated: 0,
    planCacheHits: 0,
    planCacheMisses: 0,
    videoPacketsEncoded: 0,
    audioPacketsEncoded: 0,
    codecConfigPackets: 0,
    keyframeRequests: 0,
    keyframeCompletions: 0,
    frameClassifications: blankFrameClassifications(),
    gopResets: 0,
    reconfigurations: 0,
    drains: 0,
    flushes: 0,
    inputDrops: 0,
    packetDrops: 0,
    queueHighWaterMarks: 0,
    backpressureTransitions: 0,
    duplicateRequests: 0,
    duplicateSubmissions: 0,
    staleGenerations: 0,
    timestampRegressions: 0,
    samplePositionRegressions: 0,
    unsupportedRejects: 0,
    backendFailures: 0,
    timeouts: 0,
    allocationFailures: 0,
    ownershipViolations: 0,
    estimatedInputBytes: 0,
    estimatedEncodedBytes: 0,
    maximumPacketSize: 0,
    queueDepthSamples: 0,
    queueDepthTotal: 0,
    maximumQueueDepth: 0,
    peakQueueBytes: 0,
    temporaryBytes: 0,
    peakTemporaryBytes: 0,
    lastVideoPts: undefined as number | undefined,
    lastAudioPts: undefined as number | undefined,
    lastSuccessfulEncode: undefined as string | undefined,
    lastFailure: undefined as string | undefined,
    lastEncoderEvent: 'MediaEncoderEngineCreated' as MediaEncoderEventType,
  };

  constructor() {
    this.registerVideoBackend(new SyntheticVideoEncoderBackend());
    this.registerAudioBackend(new SyntheticAudioEncoderBackend());
    this.engineState = 'RUNNING';
  }

  registerVideoBackend(backend: VideoEncoderBackend) {
    if (this.videoBackends.has(backend.descriptor.backendId))
      throw new MediaEncoderFoundationError('DuplicateVideoEncoderBackend');
    if (
      backend.descriptor.implementationClass === 'SYNTHETIC' &&
      backend.descriptor.realVideoEncoding
    )
      throw new MediaEncoderFoundationError('EncoderInvariantViolation');
    this.videoBackends.set(backend.descriptor.backendId, backend);
    this.telemetryState.backendRegistrations++;
    this.event('VideoEncoderBackendRegistered');
  }
  unregisterVideoBackend(backendId: string) {
    if (!this.videoBackends.delete(backendId))
      throw new MediaEncoderFoundationError('VideoEncoderBackendNotFound');
    this.telemetryState.backendRemovals++;
    this.event('VideoEncoderBackendRemoved');
  }
  registerAudioBackend(backend: AudioEncoderBackend) {
    if (this.audioBackends.has(backend.descriptor.backendId))
      throw new MediaEncoderFoundationError('DuplicateAudioEncoderBackend');
    if (
      backend.descriptor.implementationClass === 'SYNTHETIC' &&
      backend.descriptor.realAudioEncoding
    )
      throw new MediaEncoderFoundationError('EncoderInvariantViolation');
    this.audioBackends.set(backend.descriptor.backendId, backend);
    this.telemetryState.backendRegistrations++;
    this.event('AudioEncoderBackendRegistered');
  }
  unregisterAudioBackend(backendId: string) {
    if (!this.audioBackends.delete(backendId))
      throw new MediaEncoderFoundationError('AudioEncoderBackendNotFound');
    this.telemetryState.backendRemovals++;
    this.event('AudioEncoderBackendRemoved');
  }
  selectVideoBackend() {
    return [...this.videoBackends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    )[0];
  }
  selectAudioBackend() {
    return [...this.audioBackends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    )[0];
  }

  registerVideoConfiguration(config: VideoEncoderConfiguration) {
    validateVideoEncoderConfiguration(config);
    if (this.videoConfigs.has(config.encoderConfigId))
      throw new MediaEncoderFoundationError('DuplicateVideoEncoderConfiguration');
    this.videoConfigs.set(
      config.encoderConfigId,
      freeze({ ...config }) as VideoEncoderConfiguration,
    );
    this.telemetryState.configRegistrations++;
    this.event('VideoEncoderConfigRegistered');
    return config;
  }
  updateVideoConfiguration(config: VideoEncoderConfiguration, expectedGeneration: number) {
    const old = this.videoConfigs.get(config.encoderConfigId);
    if (!old) throw new MediaEncoderFoundationError('VideoEncoderConfigurationNotFound');
    if (
      old.configGeneration !== expectedGeneration ||
      config.configGeneration <= old.configGeneration
    )
      throw new MediaEncoderFoundationError('EncoderConfigurationGenerationMismatch');
    validateVideoEncoderConfiguration(config);
    this.videoConfigs.set(
      config.encoderConfigId,
      freeze({ ...config }) as VideoEncoderConfiguration,
    );
    this.planCache.clear();
    this.telemetryState.configUpdates++;
    this.event('VideoEncoderConfigUpdated');
  }
  unregisterVideoConfiguration(id: string) {
    if (!this.videoConfigs.delete(id))
      throw new MediaEncoderFoundationError('VideoEncoderConfigurationNotFound');
    this.telemetryState.configRemovals++;
    this.event('VideoEncoderConfigRemoved');
  }
  registerAudioConfiguration(config: AudioEncoderConfiguration) {
    validateAudioEncoderConfiguration(config);
    if (this.audioConfigs.has(config.encoderConfigId))
      throw new MediaEncoderFoundationError('DuplicateAudioEncoderConfiguration');
    this.audioConfigs.set(
      config.encoderConfigId,
      freeze({ ...config }) as AudioEncoderConfiguration,
    );
    this.telemetryState.configRegistrations++;
    this.event('AudioEncoderConfigRegistered');
    return config;
  }
  updateAudioConfiguration(config: AudioEncoderConfiguration, expectedGeneration: number) {
    const old = this.audioConfigs.get(config.encoderConfigId);
    if (!old) throw new MediaEncoderFoundationError('AudioEncoderConfigurationNotFound');
    if (
      old.configGeneration !== expectedGeneration ||
      config.configGeneration <= old.configGeneration
    )
      throw new MediaEncoderFoundationError('EncoderConfigurationGenerationMismatch');
    validateAudioEncoderConfiguration(config);
    this.audioConfigs.set(
      config.encoderConfigId,
      freeze({ ...config }) as AudioEncoderConfiguration,
    );
    this.planCache.clear();
    this.telemetryState.configUpdates++;
    this.event('AudioEncoderConfigUpdated');
  }
  unregisterAudioConfiguration(id: string) {
    if (!this.audioConfigs.delete(id))
      throw new MediaEncoderFoundationError('AudioEncoderConfigurationNotFound');
    this.telemetryState.configRemovals++;
    this.event('AudioEncoderConfigRemoved');
  }

  createSession(
    input: Partial<MediaEncoderSessionDefinition> &
      Pick<MediaEncoderSessionDefinition, 'sessionId' | 'mediaType' | 'outputRole' | 'sourceBusId'>,
  ) {
    if (this.sessions.has(input.sessionId))
      throw new MediaEncoderFoundationError('DuplicateEncoderSession');
    if (this.sessions.size >= 128) throw new MediaEncoderFoundationError('EncoderSessionInvalid');
    if (input.videoConfigId && !this.videoConfigs.has(input.videoConfigId))
      throw new MediaEncoderFoundationError('VideoEncoderConfigurationNotFound');
    if (input.audioConfigId && !this.audioConfigs.has(input.audioConfigId))
      throw new MediaEncoderFoundationError('AudioEncoderConfigurationNotFound');
    const createdAtNs = input.createdAtNs ?? 1;
    const definition: MediaEncoderSessionDefinition = freeze({
      sessionVersion: MEDIA_ENCODER_FOUNDATION_VERSION,
      sessionGeneration: 1,
      synchronizationRequirement: ['PROGRAM', 'RECORD', 'STREAM'].includes(input.outputRole)
        ? 'REQUIRED'
        : 'OPTIONAL',
      startupPolicy: 'WAIT_FOR_SYNCHRONIZED_MEDIA',
      drainPolicy: 'EMIT_EOS',
      flushPolicy: 'DISCARD',
      reconfigurationPolicy: 'REJECT_WHILE_RUNNING',
      discontinuityPolicy: 'RESET_GOP',
      queuePolicy: defaultQueuePolicy(),
      failurePolicy: 'FAIL_SESSION',
      backendPreference: 'SYNTHETIC',
      enabled: true,
      criticality: input.outputRole === 'PROGRAM' ? 'PROGRAM_CRITICAL' : 'IMPORTANT',
      createdAtNs,
      updatedAtNs: input.updatedAtNs ?? createdAtNs,
      safeMetadata: {},
      ...input,
    }) as MediaEncoderSessionDefinition;
    const state: InternalSessionState = {
      definition,
      state: 'CREATED',
      sequence: 0,
      gop: freeze({
        sessionId: definition.sessionId,
        sessionGeneration: definition.sessionGeneration,
        gopGeneration: 1,
        currentGopIndex: 0,
        frameIndexInGop: -1,
        lastKeyframeFrameNumber: -1,
        lastKeyframePts: -1,
        pendingKeyframeReasons: [],
        discontinuityGeneration: 0,
        safeMetadata: {},
      }) as VideoEncoderGopState,
      inputQueue: [],
      packetQueue: [],
      leases: new Map(),
      codecConfigEmitted: false,
      droppedInput: 0,
      droppedPacket: 0,
      blocked: 0,
      highWater: 0,
      drainGeneration: 0,
      flushGeneration: 0,
    };
    this.sessions.set(definition.sessionId, state);
    this.telemetryState.sessionCreates++;
    this.event('EncoderSessionCreated');
    return definition;
  }
  registerSession(input: Parameters<MediaEncoderFoundationEngine['createSession']>[0]) {
    return this.createSession(input);
  }
  startSession(sessionId: string, expectedGeneration?: number) {
    const session = this.session(sessionId);
    if (
      expectedGeneration !== undefined &&
      session.definition.sessionGeneration !== expectedGeneration
    )
      throw this.reject('ENCODER_SESSION_GENERATION_STALE', 'EncoderSessionGenerationMismatch');
    if (!['CREATED', 'READY', 'STOPPED', 'PAUSED'].includes(session.state))
      throw new MediaEncoderFoundationError('EncoderSessionStateInvalid');
    session.state = 'RUNNING';
    const backend =
      session.definition.mediaType === 'VIDEO'
        ? this.selectVideoBackend()
        : this.selectAudioBackend();
    if (!backend)
      throw new MediaEncoderFoundationError(
        session.definition.mediaType === 'VIDEO'
          ? 'VideoEncoderBackendNotFound'
          : 'AudioEncoderBackendNotFound',
      );
    this.emitCodecConfigIfNeeded(session);
    this.telemetryState.sessionStarts++;
    this.event('EncoderSessionStarted');
  }
  pauseSession(sessionId: string) {
    const session = this.session(sessionId);
    if (session.state !== 'RUNNING')
      throw new MediaEncoderFoundationError('EncoderSessionStateInvalid');
    session.state = 'PAUSED';
    this.telemetryState.sessionPauses++;
    this.event('EncoderSessionPaused');
  }
  resumeSession(sessionId: string) {
    const session = this.session(sessionId);
    if (session.state !== 'PAUSED')
      throw new MediaEncoderFoundationError('EncoderSessionStateInvalid');
    session.state = 'RUNNING';
    this.telemetryState.sessionResumes++;
    this.event('EncoderSessionResumed');
  }
  stopSession(sessionId: string) {
    const session = this.session(sessionId);
    session.state = 'STOPPED';
    this.telemetryState.sessionStops++;
    this.event('EncoderSessionStopped');
  }
  destroySession(sessionId: string) {
    const session = this.session(sessionId);
    session.packetQueue = [];
    session.inputQueue = [];
    session.state = 'DESTROYED';
  }
  resetSession(sessionId: string) {
    const session = this.session(sessionId);
    session.state = 'RESETTING';
    session.sequence = 0;
    delete session.lastPts;
    delete session.lastSamplePosition;
    session.inputQueue = [];
    session.packetQueue = [];
    session.codecConfigEmitted = false;
    session.gop = freeze({
      ...session.gop,
      gopGeneration: session.gop.gopGeneration + 1,
      frameIndexInGop: -1,
      lastKeyframeFrameNumber: -1,
      lastKeyframePts: -1,
      discontinuityGeneration: session.gop.discontinuityGeneration + 1,
    }) as VideoEncoderGopState;
    session.state = 'READY';
    this.planCache.clear();
    this.telemetryState.sessionResets++;
    this.telemetryState.gopResets++;
    this.event('EncoderSessionReset');
  }
  bindOutputRole(binding: MediaEncoderOutputBinding) {
    if (this.bindings.has(binding.bindingId))
      throw new MediaEncoderFoundationError('EncoderOutputBindingInvalid');
    if (this.bindings.size >= 64)
      throw new MediaEncoderFoundationError('EncoderOutputBindingInvalid');
    const video = this.session(binding.videoSessionId);
    const audio = this.session(binding.audioSessionId);
    if (
      video.definition.outputRole !== binding.outputRole ||
      audio.definition.outputRole !== binding.outputRole
    )
      throw new MediaEncoderFoundationError('EncoderOutputBindingInvalid');
    this.bindings.set(binding.bindingId, freeze({ ...binding }) as MediaEncoderOutputBinding);
    this.telemetryState.outputBindings++;
    this.event('EncodedAvCorrelationChanged');
    return binding;
  }
  unbindOutputRole(bindingId: string) {
    if (!this.bindings.delete(bindingId))
      throw new MediaEncoderFoundationError('EncoderOutputBindingInvalid');
    this.telemetryState.outputUnbindings++;
  }

  submitVideo(input: VideoEncodeInputFrame) {
    return this.encode(this.requestFromInput('VIDEO', input));
  }
  submitAudio(input: AudioEncodeInputBlock) {
    return this.encode(this.requestFromInput('AUDIO', input));
  }
  encode(request: MediaEncodeRequest) {
    if (this.engineState === 'SHUTDOWN')
      throw new MediaEncoderFoundationError('MediaEncoderShutdownError');
    if (request.cancellation?.cancelled) throw new MediaEncoderFoundationError('EncoderCancelled');
    const session = this.session(request.sessionId);
    if (session.state !== 'RUNNING')
      throw new MediaEncoderFoundationError('EncoderSessionStateInvalid');
    if (this.requests.has(request.requestId))
      throw this.reject('ENCODER_DUPLICATE_REQUEST', 'EncoderDuplicateRequest');
    this.requests.add(request.requestId);
    this.event('EncodeRequested');
    const submissionId = (request.input as VideoEncodeInputFrame | AudioEncodeInputBlock)
      .submissionId;
    if (this.submissions.has(submissionId))
      throw this.reject('ENCODER_DUPLICATE_SUBMISSION', 'EncoderDuplicateSubmission');
    if (request.expectedSessionGeneration !== session.definition.sessionGeneration)
      throw this.reject('ENCODER_SESSION_GENERATION_STALE', 'EncoderSessionGenerationMismatch');
    this.validateRequestGenerations(request, session);
    this.enqueueInput(session, submissionId);
    this.submissions.add(submissionId);
    const plan = this.createPlan(request, session);
    if (request.cancellation?.afterPlan) throw new MediaEncoderFoundationError('EncoderCancelled');
    const backend =
      request.mediaType === 'VIDEO' ? this.selectVideoBackend() : this.selectAudioBackend();
    if (!backend)
      throw new MediaEncoderFoundationError(
        request.mediaType === 'VIDEO'
          ? 'VideoEncoderBackendNotFound'
          : 'AudioEncoderBackendNotFound',
      );
    let packet = backend.encode(plan, request);
    packet = freeze({
      ...packet,
      packetSequence: session.sequence,
      ownership: 'PACKET_QUEUE_OWNED' as const,
    }) as EncodedMediaPacket;
    this.validatePacket(packet, session);
    this.enqueuePacket(session, packet);
    session.sequence++;
    session.inputQueue.shift();
    this.updatePostEncodeState(session, request, plan, packet);
    this.requests.delete(request.requestId);
    return { plan, packet };
  }

  requestKeyframe(sessionId: string, reason: KeyframeReason = 'MANUAL') {
    const session = this.session(sessionId);
    if (session.definition.mediaType !== 'VIDEO')
      throw new MediaEncoderFoundationError('EncoderKeyframeRequestInvalid');
    if (!session.gop.pendingKeyframeReasons.includes(reason)) {
      session.gop = freeze({
        ...session.gop,
        pendingKeyframeReasons: [...session.gop.pendingKeyframeReasons, reason].sort(),
      }) as VideoEncoderGopState;
      this.telemetryState.keyframeRequests++;
      this.event('KeyframeRequested');
    }
  }
  drainSession(sessionId: string) {
    const session = this.session(sessionId);
    session.state = 'DRAINING';
    session.drainGeneration++;
    const eos = this.eosPacket(session);
    if (!session.packetQueue.some((packet) => packet.endOfStream)) this.enqueuePacket(session, eos);
    session.state = 'STOPPED';
    this.telemetryState.drains++;
    this.event('EncoderDrainCompleted');
    return eos;
  }
  flushSession(sessionId: string) {
    const session = this.session(sessionId);
    session.state = 'FLUSHING';
    for (const packet of session.packetQueue)
      this.releasePacketInternal(session, packet.packetId, 'flush-discard');
    session.packetQueue = [];
    session.inputQueue = [];
    session.flushGeneration++;
    session.state = 'READY';
    this.telemetryState.flushes++;
    this.event('EncoderFlushCompleted');
  }
  reconfigureSession(transaction: MediaEncoderConfigurationTransaction) {
    const session = this.session(transaction.sessionId);
    if (session.definition.sessionGeneration !== transaction.currentSessionGeneration)
      throw new MediaEncoderFoundationError('EncoderConfigurationGenerationMismatch');
    if (!transaction.validationReport.valid)
      throw new MediaEncoderFoundationError('EncoderSessionInvalid');
    this.telemetryState.reconfigurations++;
    this.planCache.clear();
    this.event('EncoderSessionReconfiguring');
  }
  releasePacket(packetId: string, reason = 'released') {
    for (const session of this.sessions.values()) {
      if (session.packetQueue.some((packet) => packet.packetId === packetId))
        return this.releasePacketInternal(session, packetId, reason);
    }
    throw new MediaEncoderFoundationError('EncoderPacketInvalid');
  }
  assertInvariants(): MediaEncoderValidationReport {
    const errors: string[] = [];
    const packetIds = new Set<string>();
    for (const session of [...this.sessions.values()].sort((a, b) =>
      a.definition.sessionId.localeCompare(b.definition.sessionId),
    )) {
      if (session.inputQueue.length > session.definition.queuePolicy.maxInputCount)
        errors.push(`input queue overflow:${session.definition.sessionId}`);
      if (session.packetQueue.length > session.definition.queuePolicy.maxPacketCount)
        errors.push(`packet queue overflow:${session.definition.sessionId}`);
      let expected = session.packetQueue[0]?.packetSequence;
      for (const packet of session.packetQueue) {
        if (packetIds.has(packet.packetId)) errors.push(`duplicate packet:${packet.packetId}`);
        packetIds.add(packet.packetId);
        if (expected !== undefined && packet.packetSequence !== expected)
          errors.push(`packet sequence gap:${session.definition.sessionId}`);
        expected = packet.packetSequence + 1;
        if (packet.ownership === 'RELEASED')
          errors.push(`released packet active:${packet.packetId}`);
      }
    }
    if (this.engineState === 'SHUTDOWN') {
      for (const session of this.sessions.values()) {
        if (session.state !== 'SHUTDOWN')
          errors.push(`session not shutdown:${session.definition.sessionId}`);
        if (session.inputQueue.length || session.packetQueue.length)
          errors.push(`queue retained:${session.definition.sessionId}`);
      }
      if (this.requests.size) errors.push('active requests after shutdown');
      if (this.planCache.size) errors.push('plan cache retained after shutdown');
    }
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: [],
    }) as MediaEncoderValidationReport;
  }
  snapshot(): MediaEncoderEngineSnapshot {
    const packets = [...this.sessions.values()]
      .flatMap((session) => session.packetQueue)
      .sort((a, b) => a.packetId.localeCompare(b.packetId));
    return freeze({
      version: MEDIA_ENCODER_FOUNDATION_VERSION,
      videoConfigurations: [...this.videoConfigs.values()].sort((a, b) =>
        a.encoderConfigId.localeCompare(b.encoderConfigId),
      ),
      audioConfigurations: [...this.audioConfigs.values()].sort((a, b) =>
        a.encoderConfigId.localeCompare(b.encoderConfigId),
      ),
      sessions: [...this.sessions.values()]
        .sort((a, b) => a.definition.sessionId.localeCompare(b.definition.sessionId))
        .map((session) => this.sessionSnapshot(session)),
      outputBindings: [...this.bindings.values()].sort((a, b) =>
        a.bindingId.localeCompare(b.bindingId),
      ),
      plans: this.plans.slice(-128),
      packets,
      correlations: [...this.correlations.values()].sort((a, b) =>
        a.outputRole.localeCompare(b.outputRole),
      ),
      videoBackends: [...this.videoBackends.values()]
        .map((backend) => backend.snapshot())
        .sort((a, b) => a.descriptor.backendId.localeCompare(b.descriptor.backendId)),
      audioBackends: [...this.audioBackends.values()]
        .map((backend) => backend.snapshot())
        .sort((a, b) => a.descriptor.backendId.localeCompare(b.descriptor.backendId)),
      health: this.health(),
      telemetry: this.telemetry(),
      events: this.events.slice(-128),
      watchdogIncidents: this.incidents.slice(-128),
      validation: this.assertInvariants(),
    }) as MediaEncoderEngineSnapshot;
  }
  health(): MediaEncoderHealthSnapshot {
    const sessions = [...this.sessions.values()];
    const packetBytes = sessions.reduce(
      (sum, session) => sum + session.packetQueue.reduce((n, p) => n + p.payloadSizeBytes, 0),
      0,
    );
    const maxBackpressure =
      sessions
        .map((session) => this.backpressure(session.definition.sessionId).level)
        .sort(
          (a, b) =>
            ['NONE', 'SOFT', 'HARD', 'CRITICAL', 'FAILED'].indexOf(b) -
            ['NONE', 'SOFT', 'HARD', 'CRITICAL', 'FAILED'].indexOf(a),
        )[0] ?? 'NONE';
    return freeze({
      engineState: this.engineState,
      healthState:
        this.engineState === 'SHUTDOWN'
          ? 'shutdown'
          : sessions.some((s) => s.state === 'FAILED')
            ? 'failed'
            : maxBackpressure === 'CRITICAL'
              ? 'degraded'
              : 'healthy',
      videoBackendCount: this.videoBackends.size,
      audioBackendCount: this.audioBackends.size,
      activeVideoBackendIds: [...this.videoBackends.keys()].sort(),
      activeAudioBackendIds: [...this.audioBackends.keys()].sort(),
      registeredVideoConfigCount: this.videoConfigs.size,
      registeredAudioConfigCount: this.audioConfigs.size,
      registeredSessionCount: this.sessions.size,
      activeSessionCount: sessions.filter((s) => !['DESTROYED', 'SHUTDOWN'].includes(s.state))
        .length,
      runningSessionCount: sessions.filter((s) => s.state === 'RUNNING').length,
      drainingSessionCount: sessions.filter((s) => s.state === 'DRAINING').length,
      failedSessionCount: sessions.filter((s) => s.state === 'FAILED').length,
      ...(sessions.find(
        (s) => s.definition.outputRole === 'PROGRAM' && s.definition.mediaType === 'VIDEO',
      )
        ? {
            programVideoSessionId: sessions.find(
              (s) => s.definition.outputRole === 'PROGRAM' && s.definition.mediaType === 'VIDEO',
            )?.definition.sessionId,
          }
        : {}),
      ...(sessions.find(
        (s) => s.definition.outputRole === 'PROGRAM' && s.definition.mediaType === 'AUDIO',
      )
        ? {
            programAudioSessionId: sessions.find(
              (s) => s.definition.outputRole === 'PROGRAM' && s.definition.mediaType === 'AUDIO',
            )?.definition.sessionId,
          }
        : {}),
      submittedVideoFrameCount: this.telemetryState.videoSubmissions,
      submittedAudioBlockCount: this.telemetryState.audioSubmissions,
      encodedVideoPacketCount: this.telemetryState.videoPacketsEncoded,
      encodedAudioPacketCount: this.telemetryState.audioPacketsEncoded,
      codecConfigPacketCount: this.telemetryState.codecConfigPackets,
      keyframeCount: this.telemetryState.keyframeCompletions,
      droppedVideoInputCount: 0,
      droppedAudioInputCount: 0,
      droppedPacketCount: this.telemetryState.packetDrops,
      duplicateRequestCount: this.telemetryState.duplicateRequests,
      duplicateSubmissionCount: this.telemetryState.duplicateSubmissions,
      staleGenerationRejectionCount: this.telemetryState.staleGenerations,
      timestampRegressionCount: this.telemetryState.timestampRegressions,
      samplePositionRegressionCount: this.telemetryState.samplePositionRegressions,
      queueFullCount: this.telemetryState.packetDrops + this.telemetryState.inputDrops,
      backpressureState: maxBackpressure,
      backendFailureCount: this.telemetryState.backendFailures,
      timeoutCount: this.telemetryState.timeouts,
      allocationFailureCount: this.telemetryState.allocationFailures,
      ownershipViolationCount: this.telemetryState.ownershipViolations,
      activeInputQueueBytes: sessions.reduce(
        (sum, session) => sum + session.inputQueue.length * 128,
        0,
      ),
      activePacketQueueBytes: packetBytes,
      peakQueueBytes: this.telemetryState.peakQueueBytes,
      temporaryBytes: this.telemetryState.temporaryBytes,
      peakTemporaryBytes: this.telemetryState.peakTemporaryBytes,
      ...(this.telemetryState.lastVideoPts !== undefined
        ? { lastVideoPts: this.telemetryState.lastVideoPts }
        : {}),
      ...(this.telemetryState.lastAudioPts !== undefined
        ? { lastAudioPts: this.telemetryState.lastAudioPts }
        : {}),
      ...(this.telemetryState.lastSuccessfulEncode
        ? { lastSuccessfulEncode: this.telemetryState.lastSuccessfulEncode }
        : {}),
      ...(this.telemetryState.lastFailure ? { lastFailure: this.telemetryState.lastFailure } : {}),
      updatedAtNs: nowNs(),
    }) as MediaEncoderHealthSnapshot;
  }
  telemetry(): MediaEncoderTelemetrySnapshot {
    const encoded =
      this.telemetryState.videoPacketsEncoded + this.telemetryState.audioPacketsEncoded;
    const averagePacketSize = encoded
      ? Math.round(this.telemetryState.estimatedEncodedBytes / encoded)
      : 0;
    return freeze({
      ...this.telemetryState,
      estimatedCompressionRatioMetadata: this.telemetryState.estimatedInputBytes
        ? Number(
            (
              this.telemetryState.estimatedEncodedBytes / this.telemetryState.estimatedInputBytes
            ).toFixed(6),
          )
        : 0,
      averagePacketSize,
      averageQueueDepth: this.telemetryState.queueDepthSamples
        ? Number(
            (this.telemetryState.queueDepthTotal / this.telemetryState.queueDepthSamples).toFixed(
              2,
            ),
          )
        : 0,
      currentRequestIds: [...this.requests].sort(),
      activeSessionIds: [...this.sessions.values()]
        .filter((s) => s.state === 'RUNNING')
        .map((s) => s.definition.sessionId)
        .sort(),
      healthSummary: `${this.health().healthState}/${this.health().backpressureState}`,
    }) as MediaEncoderTelemetrySnapshot;
  }
  backpressure(sessionId: string): EncoderBackpressureSnapshot {
    const session = this.session(sessionId);
    const queueBytes = session.packetQueue.reduce(
      (sum, packet) => sum + packet.payloadSizeBytes,
      0,
    );
    const depth = session.inputQueue.length + session.packetQueue.length;
    const level: BackpressureLevel =
      session.state === 'FAILED'
        ? 'FAILED'
        : session.packetQueue.length >= session.definition.queuePolicy.maxPacketCount ||
            queueBytes >= session.definition.queuePolicy.maxPacketBytes
          ? 'CRITICAL'
          : session.packetQueue.length >=
              Math.floor(session.definition.queuePolicy.maxPacketCount * 0.75)
            ? 'HARD'
            : depth > 0
              ? 'SOFT'
              : 'NONE';
    return freeze({
      level,
      inputQueueDepth: session.inputQueue.length,
      packetQueueDepth: session.packetQueue.length,
      queueBytes,
      estimatedLatencyNs: depth * 1_000_000,
      blockedRequestCount: session.blocked,
      droppedInputCount: session.droppedInput,
      droppedPacketCount: session.droppedPacket,
      highWaterMark: session.highWater,
      programPreservationPolicy: session.definition.criticality,
    }) as EncoderBackpressureSnapshot;
  }
  shutdown() {
    for (const session of this.sessions.values()) {
      session.inputQueue = [];
      session.packetQueue = [];
      session.leases.clear();
      session.state = 'SHUTDOWN';
    }
    this.requests.clear();
    this.planCache.clear();
    for (const backend of this.videoBackends.values()) backend.shutdown();
    for (const backend of this.audioBackends.values()) backend.shutdown();
    this.engineState = 'SHUTDOWN';
    this.event('MediaEncoderEngineShutdown');
  }

  private createPlan(request: MediaEncodeRequest, session: InternalSessionState) {
    const cacheKey = json([
      request.requestId,
      request.expectedSessionGeneration,
      request.expectedConfigurationGenerations,
      request.expectedSynchronizationGeneration,
      request.expectedOutputRoleGeneration,
      request.expectedDeviceBackendGeneration,
      (request.input as VideoEncodeInputFrame | AudioEncodeInputBlock).submissionId,
    ]);
    const cached = this.planCache.get(cacheKey);
    if (cached) {
      this.telemetryState.planCacheHits++;
      return cached;
    }
    this.telemetryState.planCacheMisses++;
    let plan: MediaEncodePlan;
    if (request.mediaType === 'VIDEO') {
      const config = this.videoConfig(session.definition.videoConfigId);
      plan = this.selectVideoBackend()!.createPlan(request, config, session.gop);
    } else if (request.mediaType === 'AUDIO') {
      const config = this.audioConfig(session.definition.audioConfigId);
      plan = this.selectAudioBackend()!.createPlan(request, config);
    } else {
      throw new MediaEncoderFoundationError('EncoderCodecUnsupported');
    }
    this.planCache.set(cacheKey, plan);
    if (this.planCache.size > 256)
      this.planCache.delete(this.planCache.keys().next().value as string);
    this.plans.push(plan);
    if (this.plans.length > 256) this.plans.shift();
    this.telemetryState.plansCreated++;
    this.event('EncodePlanned');
    return plan;
  }
  private updatePostEncodeState(
    session: InternalSessionState,
    request: MediaEncodeRequest,
    plan: MediaEncodePlan,
    packet: EncodedMediaPacket,
  ) {
    this.packetIds.add(packet.packetId);
    this.telemetryState.estimatedEncodedBytes += packet.payloadSizeBytes;
    this.telemetryState.maximumPacketSize = Math.max(
      this.telemetryState.maximumPacketSize,
      packet.payloadSizeBytes,
    );
    this.telemetryState.temporaryBytes = 0;
    this.telemetryState.peakTemporaryBytes = Math.max(
      this.telemetryState.peakTemporaryBytes,
      plan.temporaryByteEstimate,
    );
    this.telemetryState.frameClassifications[packet.frameClassification]++;
    if (request.mediaType === 'VIDEO') {
      const frame = request.input as VideoEncodeInputFrame;
      this.telemetryState.videoPacketsEncoded++;
      this.telemetryState.lastVideoPts = packet.pts;
      if (packet.keyframe) {
        this.telemetryState.keyframeCompletions++;
        this.event('KeyframeEncoded');
      }
      const key = packet.keyframe;
      session.gop = freeze({
        ...session.gop,
        currentGopIndex: key ? session.gop.currentGopIndex + 1 : session.gop.currentGopIndex,
        frameIndexInGop: key ? 0 : plan.gopPosition,
        lastKeyframeFrameNumber: key ? frame.frameNumber : session.gop.lastKeyframeFrameNumber,
        lastKeyframePts: key ? frame.pts : session.gop.lastKeyframePts,
        pendingKeyframeReasons: [],
        discontinuityGeneration: frame.discontinuityGeneration,
      }) as VideoEncoderGopState;
      this.event('VideoPacketEncoded');
    } else {
      this.telemetryState.audioPacketsEncoded++;
      this.telemetryState.lastAudioPts = packet.pts;
      this.event('AudioPacketEncoded');
    }
    this.telemetryState.lastSuccessfulEncode = packet.packetId;
    this.updateCorrelation(session.definition.outputRole);
  }
  private emitCodecConfigIfNeeded(session: InternalSessionState) {
    if (session.codecConfigEmitted) return;
    if (session.definition.mediaType === 'VIDEO') {
      const config = this.videoConfig(session.definition.videoConfigId);
      const packet = this.selectVideoBackend()!.createCodecConfigPacket(
        session.definition,
        config,
        session.sequence++,
      );
      this.enqueuePacket(
        session,
        freeze({ ...packet, ownership: 'PACKET_QUEUE_OWNED' as const }) as EncodedMediaPacket,
      );
    } else if (session.definition.mediaType === 'AUDIO') {
      const config = this.audioConfig(session.definition.audioConfigId);
      const packet = this.selectAudioBackend()!.createCodecConfigPacket(
        session.definition,
        config,
        session.sequence++,
      );
      this.enqueuePacket(
        session,
        freeze({ ...packet, ownership: 'PACKET_QUEUE_OWNED' as const }) as EncodedMediaPacket,
      );
    }
    session.codecConfigEmitted = true;
    this.telemetryState.codecConfigPackets++;
    this.event('CodecConfigPacketEmitted');
  }
  private enqueueInput(session: InternalSessionState, submissionId: string) {
    if (session.inputQueue.length >= session.definition.queuePolicy.maxInputCount) {
      session.blocked++;
      this.telemetryState.inputDrops++;
      this.incident('ENCODER_INPUT_QUEUE_OVERFLOW');
      if (session.definition.queuePolicy.inputOverflowPolicy === 'FAIL_SESSION')
        session.state = 'FAILED';
      throw new MediaEncoderFoundationError('EncoderQueueFull');
    }
    session.inputQueue.push(submissionId);
    session.highWater = Math.max(
      session.highWater,
      session.inputQueue.length + session.packetQueue.length,
    );
    this.telemetryState.maximumQueueDepth = Math.max(
      this.telemetryState.maximumQueueDepth,
      session.highWater,
    );
    this.telemetryState.queueDepthSamples++;
    this.telemetryState.queueDepthTotal += session.inputQueue.length + session.packetQueue.length;
  }
  private enqueuePacket(session: InternalSessionState, packet: EncodedMediaPacket) {
    if (session.packetQueue.length >= session.definition.queuePolicy.maxPacketCount) {
      session.droppedPacket++;
      this.telemetryState.packetDrops++;
      this.incident('ENCODER_PACKET_QUEUE_OVERFLOW');
      throw new MediaEncoderFoundationError('EncoderQueueFull');
    }
    if (this.packetIds.has(packet.packetId))
      throw new MediaEncoderFoundationError('EncoderDuplicateSubmission');
    session.packetQueue.push(packet);
    this.packetIds.add(packet.packetId);
    session.highWater = Math.max(
      session.highWater,
      session.inputQueue.length + session.packetQueue.length,
    );
    const bytes = session.packetQueue.reduce((sum, p) => sum + p.payloadSizeBytes, 0);
    this.telemetryState.peakQueueBytes = Math.max(this.telemetryState.peakQueueBytes, bytes);
    const bp = this.backpressure(session.definition.sessionId).level;
    if (bp === 'CRITICAL') this.incident('ENCODER_BACKPRESSURE_CRITICAL');
  }
  private validateRequestGenerations(request: MediaEncodeRequest, session: InternalSessionState) {
    const input = request.input as VideoEncodeInputFrame | AudioEncodeInputBlock;
    if (input.sessionGeneration !== session.definition.sessionGeneration)
      throw this.reject('ENCODER_SESSION_GENERATION_STALE', 'EncoderSessionGenerationMismatch');
    const configGeneration =
      request.mediaType === 'VIDEO'
        ? this.videoConfig(session.definition.videoConfigId).configGeneration
        : this.audioConfig(session.definition.audioConfigId).configGeneration;
    if (
      request.expectedConfigurationGenerations.length &&
      !request.expectedConfigurationGenerations.includes(configGeneration)
    )
      throw this.reject(
        'ENCODER_CONFIG_GENERATION_STALE',
        'EncoderConfigurationGenerationMismatch',
      );
    if (request.expectedSynchronizationGeneration !== input.discontinuityGeneration)
      throw this.reject('ENCODER_SYNC_GENERATION_STALE', 'EncoderConfigurationGenerationMismatch');
    if (request.expectedDeviceBackendGeneration !== 1)
      throw this.reject('ENCODER_DEVICE_GENERATION_LOST', 'EncoderBackendFailed');
    if (session.lastPts !== undefined && input.pts < session.lastPts)
      throw this.reject('ENCODER_TIMESTAMP_REGRESSION', 'EncoderTimestampRegression');
    if (request.mediaType === 'AUDIO') {
      const block = input as AudioEncodeInputBlock;
      if (
        session.lastSamplePosition !== undefined &&
        block.samplePosition < session.lastSamplePosition
      )
        throw this.reject('ENCODER_SAMPLE_POSITION_REGRESSION', 'EncoderSamplePositionRegression');
      session.lastSamplePosition = block.samplePosition;
    }
    session.lastPts = input.pts;
  }
  private validatePacket(packet: EncodedMediaPacket, session: InternalSessionState) {
    if (packet.packetSequence !== session.sequence)
      throw new MediaEncoderFoundationError('EncoderPacketSequenceInvalid');
    if (packet.pts < 0 || packet.dts < 0 || packet.duration < 0)
      throw new MediaEncoderFoundationError('EncoderPacketTimestampInvalid');
  }
  private releasePacketInternal(session: InternalSessionState, packetId: string, reason: string) {
    const existing = session.leases.get(packetId);
    if (existing?.released)
      throw this.reject('ENCODER_OWNERSHIP_VIOLATION', 'EncoderOwnershipViolation');
    const packet = session.packetQueue.find((p) => p.packetId === packetId);
    if (!packet) throw new MediaEncoderFoundationError('EncoderPacketInvalid');
    const lease = freeze({
      leaseId: `lease:${packetId}:${session.leases.size}`,
      packetId,
      packetGeneration: packet.packetGeneration,
      owner: 'RELEASED',
      acquiredSequence: session.leases.size,
      released: true,
      releaseReason: reason,
      safeMetadata: {},
    }) as EncodedPacketLease;
    session.leases.set(packetId, lease);
    session.packetQueue = session.packetQueue.filter((p) => p.packetId !== packetId);
    return lease;
  }
  private updateCorrelation(role: MediaEncoderOutputRole) {
    const binding = [...this.bindings.values()].find((b) => b.outputRole === role && b.enabled);
    if (!binding) return;
    const video = this.session(binding.videoSessionId);
    const audio = this.session(binding.audioSessionId);
    const videoPacket = [...video.packetQueue]
      .reverse()
      .find((p) => p.mediaType === 'VIDEO' && !p.codecConfigPacket);
    const audioPacket = [...audio.packetQueue]
      .reverse()
      .find((p) => p.mediaType === 'AUDIO' && !p.codecConfigPacket);
    const readiness =
      video.codecConfigEmitted && audio.codecConfigEmitted
        ? 'READY'
        : !video.codecConfigEmitted && !audio.codecConfigEmitted
          ? 'WAITING_BOTH'
          : !video.codecConfigEmitted
            ? 'WAITING_VIDEO'
            : 'WAITING_AUDIO';
    const skew = videoPacket && audioPacket ? videoPacket.pts - audioPacket.pts : undefined;
    const correlation = freeze({
      correlationId: `encoded-av:${role}`,
      correlationGeneration: (this.correlations.get(role)?.correlationGeneration ?? 0) + 1,
      outputRole: role,
      videoSessionId: video.definition.sessionId,
      videoSessionGeneration: video.definition.sessionGeneration,
      audioSessionId: audio.definition.sessionId,
      audioSessionGeneration: audio.definition.sessionGeneration,
      ...(videoPacket
        ? { latestVideoPacketSequence: videoPacket.packetSequence, videoPts: videoPacket.pts }
        : {}),
      ...(audioPacket
        ? { latestAudioPacketSequence: audioPacket.packetSequence, audioPts: audioPacket.pts }
        : {}),
      ...(skew !== undefined ? { skew } : {}),
      discontinuityGeneration: Math.max(
        video.gop.discontinuityGeneration,
        audio.gop.discontinuityGeneration,
      ),
      codecConfigReadiness: readiness,
      synchronizationStatus:
        videoPacket && audioPacket
          ? Math.abs(skew ?? 0) <= Math.max(videoPacket.duration, audioPacket.duration)
            ? 'SYNCHRONIZED'
            : 'SKEWED'
          : 'WAITING',
      futureMuxEligibility:
        readiness === 'READY' && videoPacket && audioPacket
          ? 'ELIGIBLE'
          : readiness === 'READY'
            ? 'WAITING_PACKETS'
            : 'WAITING_CODEC_CONFIG',
      health: video.state === 'FAILED' || audio.state === 'FAILED' ? 'failed' : 'healthy',
      safeMetadata: {},
    }) as EncodedAudioVideoCorrelationSnapshot;
    this.correlations.set(role, correlation);
    this.event('EncodedAvCorrelationChanged');
  }
  private eosPacket(session: InternalSessionState): EncodedMediaPacket {
    return freeze({
      packetId: `packet:${session.definition.sessionId}:eos:${session.sequence}`,
      packetGeneration: session.definition.sessionGeneration,
      sessionId: session.definition.sessionId,
      sessionGeneration: session.definition.sessionGeneration,
      mediaType: session.definition.mediaType,
      codec: 'EOS_METADATA',
      streamIndexMetadata: 99,
      packetSequence: session.sequence++,
      pts: session.lastPts ?? 0,
      dts: session.lastPts ?? 0,
      duration: 0,
      timeBase: { numerator: 1, denominator: 1 },
      keyframe: false,
      frameClassification: 'UNKNOWN',
      inputFrameBlockId: 'eos',
      inputGeneration: session.definition.sessionGeneration,
      discontinuityGeneration: session.gop.discontinuityGeneration,
      payloadReference: 'synthetic-eos',
      payloadSizeBytes: 0,
      checksum: fnv(session.definition.sessionId),
      signature: `ubos-v5.6.6:${fnv(session.definition.sessionId)}`,
      codecConfigPacket: false,
      endOfStream: true,
      ownership: 'PACKET_QUEUE_OWNED',
      backendId: 'synthetic-drain',
      safeMetadata: {},
    }) as EncodedMediaPacket;
  }
  private requestFromInput(
    mediaType: MediaType,
    input: VideoEncodeInputFrame | AudioEncodeInputBlock,
  ): MediaEncodeRequest {
    return freeze({
      requestId: `request:${input.submissionId}`,
      mediaType,
      sessionId: input.sessionId,
      expectedSessionGeneration: input.sessionGeneration,
      expectedConfigurationGenerations: [],
      input,
      expectedSynchronizationGeneration: input.discontinuityGeneration,
      expectedOutputRoleGeneration: 1,
      expectedDeviceBackendGeneration: 1,
      requestedRuntimeFrame: input.runtimeFrame,
      requestedPts: input.pts,
      deadlineNs: 0,
      correlationId: `correlation:${input.sessionId}:${input.pts}`,
      safeMetadata: input.safeMetadata,
    }) as MediaEncodeRequest;
  }
  private sessionSnapshot(session: InternalSessionState): MediaEncoderSessionStateSnapshot {
    return freeze({
      definition: session.definition,
      state: session.state,
      gopState: session.gop,
      inputQueue: {
        sessionId: session.definition.sessionId,
        depth: session.inputQueue.length,
        highWater: session.highWater,
        bounded: true,
      },
      packetQueue: {
        sessionId: session.definition.sessionId,
        depth: session.packetQueue.length,
        bytes: session.packetQueue.reduce((sum, packet) => sum + packet.payloadSizeBytes, 0),
        bounded: true,
      },
      backpressure: this.backpressure(session.definition.sessionId),
    }) as MediaEncoderSessionStateSnapshot;
  }
  private videoConfig(id?: string) {
    const config = id ? this.videoConfigs.get(id) : undefined;
    if (!config) throw new MediaEncoderFoundationError('VideoEncoderConfigurationNotFound');
    return config;
  }
  private audioConfig(id?: string) {
    const config = id ? this.audioConfigs.get(id) : undefined;
    if (!config) throw new MediaEncoderFoundationError('AudioEncoderConfigurationNotFound');
    return config;
  }
  private session(id: string) {
    const session = this.sessions.get(id);
    if (!session) throw new MediaEncoderFoundationError('EncoderSessionNotFound');
    return session;
  }
  private reject(incident: MediaEncoderWatchdogIncident, error: EncoderErrorType): never {
    if (incident === 'ENCODER_DUPLICATE_REQUEST') this.telemetryState.duplicateRequests++;
    if (incident === 'ENCODER_DUPLICATE_SUBMISSION') this.telemetryState.duplicateSubmissions++;
    if (incident.includes('GENERATION_STALE')) this.telemetryState.staleGenerations++;
    if (incident === 'ENCODER_TIMESTAMP_REGRESSION') this.telemetryState.timestampRegressions++;
    if (incident === 'ENCODER_SAMPLE_POSITION_REGRESSION')
      this.telemetryState.samplePositionRegressions++;
    if (incident === 'ENCODER_OWNERSHIP_VIOLATION') this.telemetryState.ownershipViolations++;
    this.incident(incident);
    this.telemetryState.lastFailure = error;
    throw new MediaEncoderFoundationError(error);
  }
  private incident(incident: MediaEncoderWatchdogIncident) {
    this.incidents.push(incident);
    if (this.incidents.length > 256) this.incidents.shift();
  }
  private event(event: MediaEncoderEventType) {
    this.events.push(event);
    if (this.events.length > 256) this.events.shift();
    this.telemetryState.lastEncoderEvent = event;
  }
}

export class MediaEncoderFoundationProcessor implements TickProcessor {
  readonly id = 'media-encoder-foundation-processor';
  readonly order = MEDIA_ENCODER_FOUNDATION_PROCESSOR_ORDER;
  private processedTicks = new Set<string>();

  constructor(readonly engine = new MediaEncoderFoundationEngine()) {}

  initialize() {
    return { status: 'READY' as const, state: this.engine.snapshot() };
  }

  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const tickId = String(tick.frameNumber);
    if (this.processedTicks.has(tickId)) return;
    this.processedTicks.add(tickId);
    if (this.processedTicks.size > 1024)
      this.processedTicks.delete(this.processedTicks.keys().next().value as string);
    const snapshot = this.engine.snapshot();
    context.outputs?.publish?.(
      this.id,
      MEDIA_ENCODER_OUTPUT_KEYS.encodedVideoPackets,
      snapshot.packets.filter((packet) => packet.mediaType === 'VIDEO'),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish?.(
      this.id,
      MEDIA_ENCODER_OUTPUT_KEYS.encodedAudioPackets,
      snapshot.packets.filter((packet) => packet.mediaType === 'AUDIO'),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish?.(
      this.id,
      MEDIA_ENCODER_OUTPUT_KEYS.codecConfigPackets,
      snapshot.packets.filter((packet) => packet.codecConfigPacket),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish?.(
      this.id,
      MEDIA_ENCODER_OUTPUT_KEYS.encodedAvCorrelation,
      snapshot.correlations,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish?.(
      this.id,
      MEDIA_ENCODER_OUTPUT_KEYS.encoderHealth,
      snapshot.health,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish?.(
      this.id,
      MEDIA_ENCODER_OUTPUT_KEYS.encoderTelemetry,
      snapshot.telemetry,
      'OWNED_BY_PROCESSOR',
    );
  }

  shutdown() {
    this.engine.shutdown();
  }
}

export const createMediaEncoderFoundationEngine = () => new MediaEncoderFoundationEngine();
export const createMediaEncoderFoundationProcessor = (
  engine = createMediaEncoderFoundationEngine(),
) => new MediaEncoderFoundationProcessor(engine);
export const createSyntheticVideoEncoderBackend = (faults: SyntheticBackendFaults = {}) =>
  new SyntheticVideoEncoderBackend(faults);
export const createSyntheticAudioEncoderBackend = (faults: SyntheticBackendFaults = {}) =>
  new SyntheticAudioEncoderBackend(faults);

export function createMediaEncoderCommandHandlers(
  engine: MediaEncoderFoundationEngine,
): Readonly<Record<MediaEncoderCommandType, RuntimeCommandHandler>> {
  const h = (
    type: MediaEncoderCommandType,
    fn: (payload: Record<string, unknown>) => unknown,
  ): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute(command) {
      const payload =
        command.payload && typeof command.payload === 'object'
          ? (command.payload as Record<string, unknown>)
          : {};
      return { status: 'SUCCEEDED', value: fn(payload) };
    },
  });
  return {
    ENCODER_REGISTER_VIDEO_BACKEND: h('ENCODER_REGISTER_VIDEO_BACKEND', () =>
      engine.registerVideoBackend(new SyntheticVideoEncoderBackend()),
    ),
    ENCODER_UNREGISTER_VIDEO_BACKEND: h('ENCODER_UNREGISTER_VIDEO_BACKEND', (p) =>
      engine.unregisterVideoBackend(String(p.backendId)),
    ),
    ENCODER_REGISTER_AUDIO_BACKEND: h('ENCODER_REGISTER_AUDIO_BACKEND', () =>
      engine.registerAudioBackend(new SyntheticAudioEncoderBackend()),
    ),
    ENCODER_UNREGISTER_AUDIO_BACKEND: h('ENCODER_UNREGISTER_AUDIO_BACKEND', (p) =>
      engine.unregisterAudioBackend(String(p.backendId)),
    ),
    ENCODER_REGISTER_VIDEO_CONFIG: h('ENCODER_REGISTER_VIDEO_CONFIG', (p) =>
      engine.registerVideoConfiguration(p as unknown as VideoEncoderConfiguration),
    ),
    ENCODER_UPDATE_VIDEO_CONFIG: h('ENCODER_UPDATE_VIDEO_CONFIG', (p) =>
      engine.updateVideoConfiguration(
        p.config as VideoEncoderConfiguration,
        Number(p.expectedGeneration),
      ),
    ),
    ENCODER_UNREGISTER_VIDEO_CONFIG: h('ENCODER_UNREGISTER_VIDEO_CONFIG', (p) =>
      engine.unregisterVideoConfiguration(String(p.encoderConfigId)),
    ),
    ENCODER_REGISTER_AUDIO_CONFIG: h('ENCODER_REGISTER_AUDIO_CONFIG', (p) =>
      engine.registerAudioConfiguration(p as unknown as AudioEncoderConfiguration),
    ),
    ENCODER_UPDATE_AUDIO_CONFIG: h('ENCODER_UPDATE_AUDIO_CONFIG', (p) =>
      engine.updateAudioConfiguration(
        p.config as AudioEncoderConfiguration,
        Number(p.expectedGeneration),
      ),
    ),
    ENCODER_UNREGISTER_AUDIO_CONFIG: h('ENCODER_UNREGISTER_AUDIO_CONFIG', (p) =>
      engine.unregisterAudioConfiguration(String(p.encoderConfigId)),
    ),
    ENCODER_CREATE_SESSION: h('ENCODER_CREATE_SESSION', (p) =>
      engine.createSession(p as Parameters<MediaEncoderFoundationEngine['createSession']>[0]),
    ),
    ENCODER_UPDATE_SESSION: h('ENCODER_UPDATE_SESSION', () => {
      throw new MediaEncoderFoundationError('EncoderSessionInvalid');
    }),
    ENCODER_DESTROY_SESSION: h('ENCODER_DESTROY_SESSION', (p) =>
      engine.destroySession(String(p.sessionId)),
    ),
    ENCODER_START_SESSION: h('ENCODER_START_SESSION', (p) =>
      engine.startSession(
        String(p.sessionId),
        p.expectedGeneration === undefined ? undefined : Number(p.expectedGeneration),
      ),
    ),
    ENCODER_PAUSE_SESSION: h('ENCODER_PAUSE_SESSION', (p) =>
      engine.pauseSession(String(p.sessionId)),
    ),
    ENCODER_RESUME_SESSION: h('ENCODER_RESUME_SESSION', (p) =>
      engine.resumeSession(String(p.sessionId)),
    ),
    ENCODER_STOP_SESSION: h('ENCODER_STOP_SESSION', (p) => engine.stopSession(String(p.sessionId))),
    ENCODER_RESET_SESSION: h('ENCODER_RESET_SESSION', (p) =>
      engine.resetSession(String(p.sessionId)),
    ),
    ENCODER_SUBMIT_VIDEO_FRAME: h('ENCODER_SUBMIT_VIDEO_FRAME', (p) =>
      engine.submitVideo(p as unknown as VideoEncodeInputFrame),
    ),
    ENCODER_SUBMIT_AUDIO_BLOCK: h('ENCODER_SUBMIT_AUDIO_BLOCK', (p) =>
      engine.submitAudio(p as unknown as AudioEncodeInputBlock),
    ),
    ENCODER_REQUEST_KEYFRAME: h('ENCODER_REQUEST_KEYFRAME', (p) =>
      engine.requestKeyframe(
        String(p.sessionId),
        (p.reason as KeyframeReason | undefined) ?? 'MANUAL',
      ),
    ),
    ENCODER_DRAIN: h('ENCODER_DRAIN', (p) => engine.drainSession(String(p.sessionId))),
    ENCODER_FLUSH: h('ENCODER_FLUSH', (p) => engine.flushSession(String(p.sessionId))),
    ENCODER_RECONFIGURE: h('ENCODER_RECONFIGURE', (p) =>
      engine.reconfigureSession(p as unknown as MediaEncoderConfigurationTransaction),
    ),
    ENCODER_BIND_OUTPUT_ROLE: h('ENCODER_BIND_OUTPUT_ROLE', (p) =>
      engine.bindOutputRole(p as unknown as MediaEncoderOutputBinding),
    ),
    ENCODER_UNBIND_OUTPUT_ROLE: h('ENCODER_UNBIND_OUTPUT_ROLE', (p) =>
      engine.unbindOutputRole(String(p.bindingId)),
    ),
    ENCODER_SET_QUEUE_POLICY: h('ENCODER_SET_QUEUE_POLICY', () => {
      throw new MediaEncoderFoundationError('EncoderSessionInvalid');
    }),
    ENCODER_CLEAR_PLAN_CACHE: h('ENCODER_CLEAR_PLAN_CACHE', () => engine.assertInvariants()),
    ENCODER_VALIDATE: h('ENCODER_VALIDATE', () => engine.snapshot()),
    ENCODER_SHUTDOWN: h('ENCODER_SHUTDOWN', () => engine.shutdown()),
  };
}
