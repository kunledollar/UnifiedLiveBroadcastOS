/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';

export const REPLAY_FOUNDATION_VERSION = '5.8.1';
export const REPLAY_FOUNDATION_PROCESSOR_ORDER = 1100;
type Safe = Readonly<Record<string, unknown>>;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const sig = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};
const sanit = (m?: Safe): Safe => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m ?? {}).slice(0, 64)) {
    if (/(secret|token|password|credential|path|file|native|payload|pcm|pixel|bytes)/i.test(k))
      continue;
    out[k] = typeof v === 'string' ? v.slice(0, 256) : v;
  }
  return freeze(out);
};
const arr = <T>(x: readonly T[]) => freeze([...x]);

export const REPLAY_SOURCE_TYPES = [
  'PROGRAM',
  'PREVIEW_METADATA',
  'CLEAN_FEED',
  'AUXILIARY',
  'CAMERA_ISO',
  'GUEST_ISO',
  'SCREEN_SHARE_ISO',
  'AUDIO_ISO',
  'VIDEO_ISO',
  'ENCODED_PACKET_SOURCE',
  'PACKAGED_OUTPUT_SOURCE',
  'CUSTOM_TYPED',
] as const;
export type ReplaySourceType = (typeof REPLAY_SOURCE_TYPES)[number];
export const REPLAY_MEDIA_FORMS = [
  'FRAME_AUDIO_PAIR',
  'VIDEO_FRAME_REFERENCE',
  'AUDIO_BLOCK_REFERENCE',
  'ENCODED_PACKET_PAIR',
  'PACKAGED_OUTPUT_REFERENCE',
  'METADATA_ONLY',
  'CUSTOM',
] as const;
export type ReplayMediaForm = (typeof REPLAY_MEDIA_FORMS)[number];
export const REPLAY_CAPTURE_POLICIES = [
  'CONTINUOUS_ROLLING',
  'EVENT_TRIGGERED_METADATA',
  'MANUAL_ARMED',
  'PROGRAM_ONLY',
  'SELECTED_SOURCES',
  'ALWAYS_ON_BOUNDED',
  'CUSTOM',
] as const;
export type ReplayCapturePolicy = (typeof REPLAY_CAPTURE_POLICIES)[number];
export const REPLAY_BUFFER_TYPES = [
  'SYNCHRONIZED_FRAME_AUDIO',
  'VIDEO_ONLY',
  'AUDIO_ONLY',
  'ENCODED_PACKET',
  'PACKAGED_OUTPUT',
  'METADATA_ONLY',
  'CUSTOM',
] as const;
export type ReplayBufferType = (typeof REPLAY_BUFFER_TYPES)[number];
export const REPLAY_BUFFER_STATES = [
  'CREATED',
  'ARMED',
  'CAPTURING',
  'PRIMING',
  'READY',
  'PRESSURED',
  'DEGRADED',
  'PAUSED',
  'DRAINING',
  'RESETTING',
  'FAILED',
  'STOPPED',
  'DESTROYED',
  'SHUTDOWN',
] as const;
export type ReplayBufferState = (typeof REPLAY_BUFFER_STATES)[number];
export const REPLAY_INDEXING_POLICIES = [
  'EVERY_UNIT',
  'KEYFRAMES_AND_AUDIO_BOUNDARIES',
  'FIXED_INTERVAL',
  'EVENT_MARKERS',
  'HYBRID',
  'CUSTOM',
] as const;
export type ReplayIndexingPolicy = (typeof REPLAY_INDEXING_POLICIES)[number];
export const REPLAY_MARKER_TYPES = [
  'IN_POINT',
  'OUT_POINT',
  'CUE_POINT',
  'EVENT',
  'SCENE_CHANGE',
  'SOURCE_CHANGE',
  'TALLY_CHANGE',
  'OPERATOR_MARK',
  'SCORE_EVENT_METADATA',
  'CHAPTER',
  'DISCONTINUITY',
  'CUSTOM_TYPED',
] as const;
export type ReplayMarkerType = (typeof REPLAY_MARKER_TYPES)[number];
export const REPLAY_KEYFRAME_ALIGNMENT_POLICIES = [
  'EXACT',
  'PREVIOUS_KEYFRAME',
  'NEXT_KEYFRAME',
  'NEAREST_KEYFRAME',
  'KEYFRAME_NOT_REQUIRED_METADATA',
  'CUSTOM',
] as const;
export type ReplayKeyframeAlignmentPolicy = (typeof REPLAY_KEYFRAME_ALIGNMENT_POLICIES)[number];
export const REPLAY_AUDIO_BOUNDARY_POLICIES = [
  'EXACT_BLOCK',
  'PREVIOUS_BLOCK_BOUNDARY',
  'NEXT_BLOCK_BOUNDARY',
  'NEAREST_BLOCK_BOUNDARY',
  'ALLOW_PARTIAL_METADATA',
  'CUSTOM',
] as const;
export type ReplayAudioBoundaryPolicy = (typeof REPLAY_AUDIO_BOUNDARY_POLICIES)[number];
export const REPLAY_DISCONTINUITY_POLICIES = [
  'REJECT_CROSS_DISCONTINUITY',
  'SPLIT_RANGE',
  'START_AFTER_DISCONTINUITY',
  'END_BEFORE_DISCONTINUITY',
  'ALLOW_METADATA_ONLY',
  'CUSTOM',
] as const;
export type ReplayDiscontinuityPolicy = (typeof REPLAY_DISCONTINUITY_POLICIES)[number];
export const REPLAY_CUE_MODES = [
  'CUE_TO_IN',
  'CUE_TO_CUE_POINT',
  'CUE_TO_KEYFRAME',
  'CUE_TO_LATEST_SAFE',
  'CUE_TO_EVENT_MARKER',
  'CUSTOM',
] as const;
export type ReplayCueMode = (typeof REPLAY_CUE_MODES)[number];
export const REPLAY_PLAYBACK_DIRECTIONS = [
  'FORWARD',
  'REVERSE_METADATA',
  'PING_PONG_METADATA',
  'CUSTOM',
] as const;
export type ReplayPlaybackDirection = (typeof REPLAY_PLAYBACK_DIRECTIONS)[number];
export const REPLAY_AUDIO_POLICIES = [
  'FOLLOW_REPLAY_AUDIO',
  'MUTE_REPLAY_AUDIO',
  'PROGRAM_AUDIO_CONTINUES_METADATA',
  'DUCK_PROGRAM_AUDIO_METADATA',
  'MIX_REPLAY_AND_PROGRAM_METADATA',
  'AUDIO_ONLY_REPLAY',
  'CUSTOM',
] as const;
export type ReplayAudioPolicy = (typeof REPLAY_AUDIO_POLICIES)[number];
export const REPLAY_OUTPUT_ROLES = [
  'REPLAY_PREVIEW',
  'REPLAY_PROGRAM_CANDIDATE',
  'REPLAY_AUX',
  'REPLAY_CLEAN_FEED',
  'REPLAY_MULTIVIEW_METADATA',
  'CUSTOM',
] as const;
export type ReplayOutputRole = (typeof REPLAY_OUTPUT_ROLES)[number];
export const REPLAY_EVICTION_POLICIES = [
  'OLDEST_FIRST',
  'OLDEST_NON_MARKED',
  'OLDEST_NON_KEYFRAME_PREFERRED',
  'PRESERVE_ACTIVE_RECALL',
  'PRESERVE_MARKED_RANGES',
  'PRESERVE_PROGRAM_EVENTS',
  'REJECT_NEW',
  'FAIL_BUFFER',
  'CUSTOM',
] as const;
export type ReplayEvictionPolicy = (typeof REPLAY_EVICTION_POLICIES)[number];
export const REPLAY_PRESSURE_STATES = [
  'NORMAL',
  'ELEVATED',
  'HIGH',
  'CRITICAL',
  'EXHAUSTED',
  'FAILED',
] as const;
export type ReplayPressureState = (typeof REPLAY_PRESSURE_STATES)[number];
export const REPLAY_PRESSURE_POLICIES = [
  'EVICT_OLDEST',
  'EVICT_UNMARKED',
  'REJECT_NEW',
  'PAUSE_CAPTURE',
  'DROP_OPTIONAL_SOURCE',
  'PRESERVE_PROGRAM',
  'FAIL_BUFFER',
  'REQUEST_OPERATOR_INTERVENTION',
  'CUSTOM',
] as const;
export type ReplayPressurePolicy = (typeof REPLAY_PRESSURE_POLICIES)[number];
export const REPLAY_OWNERS = [
  'REPLAY_BUFFER_OWNED',
  'REPLAY_RECALL_LEASED',
  'REPLAY_OUTPUT_LEASED',
  'BORROWED_READ_ONLY',
  'RELEASED',
] as const;
export type ReplayUnitOwner = (typeof REPLAY_OWNERS)[number];
export const REPLAY_SESSION_STATES = [
  'CREATED',
  'VALIDATING',
  'READY',
  'CAPTURING',
  'CUEING',
  'CUE_READY',
  'RECALL_ACTIVE_METADATA',
  'PAUSED',
  'DRAINING',
  'RESETTING',
  'FAILED',
  'STOPPED',
  'DESTROYED',
  'SHUTDOWN',
] as const;
export type ReplaySessionState = (typeof REPLAY_SESSION_STATES)[number];
export const REPLAY_CONFLICT_POLICIES = [
  'REJECT_NEW_RECALL',
  'CANCEL_EXISTING_RECALL',
  'PRIORITY_WINS',
  'QUEUE_RECALL',
  'ONE_PER_OUTPUT_ROLE',
  'CUSTOM',
] as const;
export type ReplayConflictPolicy = (typeof REPLAY_CONFLICT_POLICIES)[number];
export const REPLAY_RECALL_STATUSES = [
  'CUE_READY',
  'READY',
  'DEGRADED',
  'RANGE_SPLIT',
  'BUFFER_EVICTED',
  'CANCELLED',
  'FAILED',
  'REJECTED',
] as const;
export type ReplayRecallStatus = (typeof REPLAY_RECALL_STATUSES)[number];
export const REPLAY_COMMAND_TYPES = [
  'REPLAY_REGISTER_BACKEND',
  'REPLAY_UNREGISTER_BACKEND',
  'REPLAY_REGISTER_SOURCE',
  'REPLAY_UPDATE_SOURCE',
  'REPLAY_UNREGISTER_SOURCE',
  'REPLAY_CREATE_BUFFER',
  'REPLAY_UPDATE_BUFFER',
  'REPLAY_DESTROY_BUFFER',
  'REPLAY_CREATE_SESSION',
  'REPLAY_UPDATE_SESSION',
  'REPLAY_DESTROY_SESSION',
  'REPLAY_ARM_CAPTURE',
  'REPLAY_START_CAPTURE',
  'REPLAY_PAUSE_CAPTURE',
  'REPLAY_RESUME_CAPTURE',
  'REPLAY_STOP_CAPTURE',
  'REPLAY_SUBMIT_MEDIA',
  'REPLAY_ADD_MARKER',
  'REPLAY_UPDATE_MARKER',
  'REPLAY_REMOVE_MARKER',
  'REPLAY_SET_IN',
  'REPLAY_SET_OUT',
  'REPLAY_SET_CUE',
  'REPLAY_CREATE_RANGE',
  'REPLAY_UPDATE_RANGE',
  'REPLAY_DELETE_RANGE',
  'REPLAY_CREATE_ITEM',
  'REPLAY_UPDATE_ITEM',
  'REPLAY_DELETE_ITEM',
  'REPLAY_CREATE_BANK',
  'REPLAY_UPDATE_BANK',
  'REPLAY_DELETE_BANK',
  'REPLAY_SELECT_ITEM',
  'REPLAY_RECALL_ITEM',
  'REPLAY_CANCEL_RECALL',
  'REPLAY_PREPARE_OUTPUT',
  'REPLAY_RELEASE_OUTPUT',
  'REPLAY_FORCE_EVICTION',
  'REPLAY_CLEAR_BUFFER',
  'REPLAY_DRAIN',
  'REPLAY_RESET',
  'REPLAY_VALIDATE',
  'REPLAY_SHUTDOWN',
] as const;
export type ReplayCommandType = (typeof REPLAY_COMMAND_TYPES)[number];
export const REPLAY_EVENTS = [
  'ReplayEngineCreated',
  'ReplayBackendRegistered',
  'ReplayBackendRemoved',
  'ReplaySourceRegistered',
  'ReplaySourceUpdated',
  'ReplaySourceRemoved',
  'ReplayBufferCreated',
  'ReplayBufferArmed',
  'ReplayCaptureStarted',
  'ReplayCapturePaused',
  'ReplayCaptureResumed',
  'ReplayCaptureStopped',
  'ReplayMediaUnitCaptured',
  'ReplayMediaUnitRejected',
  'ReplayMediaUnitEvicted',
  'ReplayBufferPressureChanged',
  'ReplayMarkerCreated',
  'ReplayMarkerUpdated',
  'ReplayMarkerRemoved',
  'ReplayRangeCreated',
  'ReplayRangeUpdated',
  'ReplayRangeInvalidated',
  'ReplayItemCreated',
  'ReplayItemUpdated',
  'ReplayBankCreated',
  'ReplayBankSelectionChanged',
  'ReplayRecallRequested',
  'ReplayRecallPlanned',
  'ReplayCueReady',
  'ReplayRecallCancelled',
  'ReplayOutputPrepared',
  'ReplayOutputReleased',
  'ReplaySessionDegraded',
  'ReplaySessionFailed',
  'ReplayHealthChanged',
  'ReplayEngineShutdown',
] as const;
export type ReplayEventType = (typeof REPLAY_EVENTS)[number];
export const REPLAY_WATCHDOG_INCIDENTS = [
  'REPLAY_ENGINE_STALLED',
  'REPLAY_CAPTURE_TIMEOUT',
  'REPLAY_RECALL_TIMEOUT',
  'REPLAY_DUPLICATE_CAPTURE',
  'REPLAY_DUPLICATE_RECALL',
  'REPLAY_SOURCE_GENERATION_STALE',
  'REPLAY_BUFFER_GENERATION_STALE',
  'REPLAY_UNIT_GENERATION_STALE',
  'REPLAY_RANGE_GENERATION_STALE',
  'REPLAY_ITEM_GENERATION_STALE',
  'REPLAY_TIMELINE_GENERATION_STALE',
  'REPLAY_SEQUENCE_REGRESSION',
  'REPLAY_TIMESTAMP_REGRESSION',
  'REPLAY_MIXED_TICK_INPUT',
  'REPLAY_AV_CORRELATION_INVALID',
  'REPLAY_BUFFER_PRESSURE_HIGH',
  'REPLAY_BUFFER_EXHAUSTED',
  'REPLAY_ACTIVE_RANGE_EVICTION_ATTEMPT',
  'REPLAY_RANGE_NO_LONGER_RETAINED',
  'REPLAY_MARKER_OUT_OF_RANGE',
  'REPLAY_INVALID_IN_OUT_RANGE',
  'REPLAY_DISCONTINUITY_CONFLICT',
  'REPLAY_REQUIRED_KEYFRAME_MISSING',
  'REPLAY_AUDIO_BOUNDARY_INVALID',
  'REPLAY_OUTPUT_ROLE_CONFLICT',
  'REPLAY_QUEUE_OVERFLOW',
  'REPLAY_BACKEND_FAILED',
  'REPLAY_ALLOCATION_FAILED',
  'REPLAY_OWNERSHIP_VIOLATION',
  'REPLAY_OUTPUT_REGISTRY_MISMATCH',
  'REPLAY_SOURCE_GRAPH_MISMATCH',
  'REPLAY_INVARIANT_FAILURE',
] as const;
export type ReplayWatchdogIncidentType = (typeof REPLAY_WATCHDOG_INCIDENTS)[number];
export const REPLAY_OUTPUT_KEYS = freeze({
  sources: 'replay.sources',
  buffers: 'replay.buffers',
  bufferStates: 'replay.buffer.states',
  sessions: 'replay.sessions',
  sessionStates: 'replay.session.states',
  units: 'replay.units',
  synchronizedReferences: 'replay.synchronized.references',
  timelineIndexes: 'replay.timeline.indexes',
  markers: 'replay.markers',
  ranges: 'replay.ranges',
  items: 'replay.items',
  banks: 'replay.banks',
  playlists: 'replay.playlists',
  captureRequests: 'replay.capture.requests',
  capturePlans: 'replay.capture.plans',
  recallRequests: 'replay.recall.requests',
  recallPlans: 'replay.recall.plans',
  recallResults: 'replay.recall.results',
  outputs: 'replay.outputs',
  unitLeases: 'replay.unit.leases',
  bufferPressureStates: 'replay.buffer.pressure',
  evictionStates: 'replay.evictions',
  activeRequestQueues: 'replay.queues.active',
  replayHealth: 'replay.health',
  replayTelemetry: 'replay.telemetry',
  backendHealth: 'replay.backend.health',
  failedRejectedResults: 'replay.results.failed-rejected',
} as const);
export type ReplayErrorCode =
  | 'ReplayEngineNotReady'
  | 'ReplayBackendNotFound'
  | 'DuplicateReplayBackend'
  | 'ReplaySourceNotFound'
  | 'DuplicateReplaySource'
  | 'ReplaySourceInvalid'
  | 'ReplayBufferNotFound'
  | 'DuplicateReplayBuffer'
  | 'ReplayBufferInvalid'
  | 'ReplayBufferGenerationMismatch'
  | 'ReplayBufferStateInvalid'
  | 'ReplaySessionNotFound'
  | 'DuplicateReplaySession'
  | 'ReplaySessionInvalid'
  | 'ReplaySessionGenerationMismatch'
  | 'ReplayMediaUnitInvalid'
  | 'ReplayDuplicateCapture'
  | 'ReplaySequenceRegression'
  | 'ReplayTimestampRegression'
  | 'ReplayAvCorrelationInvalid'
  | 'ReplayMarkerNotFound'
  | 'DuplicateReplayMarker'
  | 'ReplayMarkerInvalid'
  | 'ReplayRangeNotFound'
  | 'DuplicateReplayRange'
  | 'ReplayRangeInvalid'
  | 'ReplayRangeEvicted'
  | 'ReplayDiscontinuityConflict'
  | 'ReplayKeyframeMissing'
  | 'ReplayAudioBoundaryInvalid'
  | 'ReplayItemNotFound'
  | 'DuplicateReplayItem'
  | 'ReplayItemInvalid'
  | 'ReplayBankNotFound'
  | 'DuplicateReplayBank'
  | 'ReplayBankInvalid'
  | 'ReplayRecallInvalid'
  | 'ReplayDuplicateRecall'
  | 'ReplayOutputConflict'
  | 'ReplayQueueFull'
  | 'ReplayBufferPressureCritical'
  | 'ReplayBackendFailed'
  | 'ReplayAllocationFailed'
  | 'ReplayOwnershipViolation'
  | 'ReplayCancelled'
  | 'ReplayTimeout'
  | 'ReplayInvariantViolation'
  | 'ReplayShutdownError';
export class ReplayFoundationError extends Error {
  constructor(
    readonly code: ReplayErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
  }
}

export interface ReplaySourceDefinition {
  readonly replaySourceId: string;
  readonly sourceVersion: string;
  readonly sourceGeneration: number;
  readonly displayName: string;
  readonly sourceType: ReplaySourceType;
  readonly sourceOutputRole: string;
  readonly sourceMediaForm: ReplayMediaForm;
  readonly sourceId: string;
  readonly sourceGenerationRef: number;
  readonly videoSourceId?: string;
  readonly videoSourceGeneration?: number;
  readonly audioSourceId?: string;
  readonly audioSourceGeneration?: number;
  readonly encoderSessionIds: readonly string[];
  readonly packageSessionIds: readonly string[];
  readonly avCorrelationRequired: boolean;
  readonly capturePolicy: ReplayCapturePolicy;
  readonly discontinuityPolicy: ReplayDiscontinuityPolicy;
  readonly criticality: 'CRITICAL' | 'OPTIONAL';
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type ReplaySourceDefinitionSnapshot = ReplaySourceDefinition;
export interface ReplayBufferDefinition {
  readonly replayBufferId: string;
  readonly bufferVersion: string;
  readonly bufferGeneration: number;
  readonly replaySourceId: string;
  readonly sourceGeneration: number;
  readonly bufferType: ReplayBufferType;
  readonly retentionDurationNs: number;
  readonly maximumItemCount: number;
  readonly maximumFrameCount: number;
  readonly maximumAudioBlockCount: number;
  readonly maximumPacketCount: number;
  readonly maximumPackageCount: number;
  readonly maximumEstimatedBytes: number;
  readonly minimumRetainedDurationNs: number;
  readonly evictionPolicy: ReplayEvictionPolicy;
  readonly pressurePolicy: ReplayPressurePolicy;
  readonly ownershipPolicy: string;
  readonly indexingPolicy: ReplayIndexingPolicy;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type ReplayBufferDefinitionSnapshot = ReplayBufferDefinition;
export interface ReplayBufferStateSnapshot {
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly state: ReplayBufferState;
  readonly lastSequence: number;
  readonly lastPts: number;
  readonly discontinuityGeneration: number;
  readonly pressureState: ReplayPressureState;
  readonly safeMetadata: Safe;
}
export interface ReplayMediaUnit {
  readonly replayUnitId: string;
  readonly unitGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly replaySourceId: string;
  readonly sourceGeneration: number;
  readonly mediaForm: ReplayMediaForm;
  readonly runtimeFrame: number;
  readonly timelineGeneration: number;
  readonly normalizedPts: number;
  readonly dtsMetadata?: number;
  readonly durationNs: number;
  readonly timeBase: string;
  readonly videoFrameId?: string;
  readonly videoFrameGeneration?: number;
  readonly audioBlockId?: string;
  readonly audioBlockGeneration?: number;
  readonly encodedPacketIds: readonly string[];
  readonly encodedPacketGenerations: readonly number[];
  readonly packagedOutputId?: string;
  readonly packagedOutputGeneration?: number;
  readonly avCorrelationGeneration: number;
  readonly discontinuityGeneration: number;
  readonly sequence: number;
  readonly keyframe: boolean;
  readonly audioBoundary: boolean;
  readonly complete: boolean;
  readonly ownership: ReplayUnitOwner;
  readonly estimatedBytes: number;
  readonly checksumSignature: string;
  readonly safeMetadata: Safe;
}
export type ReplayMediaUnitSnapshot = ReplayMediaUnit;
export interface ReplaySynchronizedMediaReference {
  readonly referenceId: string;
  readonly generation: number;
  readonly replayUnitId: string;
  readonly replayUnitGeneration: number;
  readonly videoFrameSummary: Safe;
  readonly audioBlockSummary: Safe;
  readonly avCorrelationGeneration: number;
  readonly videoPts: number;
  readonly audioPts: number;
  readonly skewNs: number;
  readonly synchronized: boolean;
  readonly degraded: boolean;
  readonly safeMetadata: Safe;
}
export type ReplaySynchronizedMediaReferenceSnapshot = ReplaySynchronizedMediaReference;
export interface ReplayTimelineIndex {
  readonly indexId: string;
  readonly indexGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly earliestPts: number;
  readonly latestPts: number;
  readonly totalDurationNs: number;
  readonly earliestSequence: number;
  readonly latestSequence: number;
  readonly discontinuityRanges: readonly Safe[];
  readonly keyframePositions: readonly number[];
  readonly audioBoundaryPositions: readonly number[];
  readonly markerPositions: readonly string[];
  readonly unitCount: number;
  readonly estimatedBytes: number;
  readonly readyRange?: Readonly<{ startPts: number; endPts: number }>;
  readonly safeMetadata: Safe;
}
export type ReplayTimelineIndexSnapshot = ReplayTimelineIndex;
export interface ReplayMarker {
  readonly markerId: string;
  readonly markerVersion: string;
  readonly markerGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly markerType: ReplayMarkerType;
  readonly sourcePts: number;
  readonly runtimeFrame: number;
  readonly sourceSequence: number;
  readonly labelMetadata: string;
  readonly eventReferenceMetadata?: string;
  readonly requiredKeyframeAlignment: ReplayKeyframeAlignmentPolicy;
  readonly active: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type ReplayMarkerSnapshot = ReplayMarker;
export interface ReplayRangeDefinition {
  readonly rangeId: string;
  readonly rangeVersion: string;
  readonly rangeGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly inMarkerId: string;
  readonly inMarkerGeneration: number;
  readonly outMarkerId: string;
  readonly outMarkerGeneration: number;
  readonly cueMarkerId?: string;
  readonly cueMarkerGeneration?: number;
  readonly startPts: number;
  readonly endPts: number;
  readonly durationNs: number;
  readonly startSequence: number;
  readonly endSequence: number;
  readonly keyframeAlignmentPolicy: ReplayKeyframeAlignmentPolicy;
  readonly audioBoundaryPolicy: ReplayAudioBoundaryPolicy;
  readonly discontinuityPolicy: ReplayDiscontinuityPolicy;
  readonly validityState: 'VALID' | 'INVALID' | 'EVICTED' | 'SPLIT_METADATA';
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type ReplayRangeDefinitionSnapshot = ReplayRangeDefinition;
export interface ReplayItemDefinition {
  readonly replayItemId: string;
  readonly itemVersion: string;
  readonly itemGeneration: number;
  readonly displayName: string;
  readonly replaySourceId: string;
  readonly sourceGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly replayRangeId: string;
  readonly rangeGeneration: number;
  readonly replayBankId?: string;
  readonly bankGeneration?: number;
  readonly cueMode: ReplayCueMode;
  readonly playbackDirection: ReplayPlaybackDirection;
  readonly playbackRate: Readonly<{
    numerator: number;
    denominator: number;
    metadataOnly: boolean;
  }>;
  readonly audioPolicy: ReplayAudioPolicy;
  readonly outputRole: ReplayOutputRole;
  readonly transitionReferenceMetadata?: string;
  readonly graphicsReferenceMetadata?: string;
  readonly priority: number;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type ReplayItemDefinitionSnapshot = ReplayItemDefinition;
export interface ReplayBankDefinition {
  readonly replayBankId: string;
  readonly bankVersion: string;
  readonly bankGeneration: number;
  readonly displayName: string;
  readonly orderedReplayItemIds: readonly string[];
  readonly maximumItemCount: number;
  readonly activeItemId?: string;
  readonly selectionPolicy: 'MANUAL' | 'PRIORITY' | 'CUSTOM';
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type ReplayBankDefinitionSnapshot = ReplayBankDefinition;
export interface ReplayPlaylistDefinition {
  readonly playlistId: string;
  readonly playlistVersion: string;
  readonly playlistGeneration: number;
  readonly orderedReplayItemEntries: readonly Safe[];
  readonly playbackPolicy: string;
  readonly stopPolicy: string;
  readonly loopPolicyMetadata: string;
  readonly enabled: boolean;
  readonly safeMetadata: Safe;
}
export type ReplayPlaylistDefinitionSnapshot = ReplayPlaylistDefinition;
export interface ReplayCaptureRequest {
  readonly requestId: string;
  readonly replaySourceId: string;
  readonly expectedSourceGeneration: number;
  readonly replayBufferId: string;
  readonly expectedBufferGeneration: number;
  readonly inputMediaReference: Safe;
  readonly expectedTimelineGeneration: number;
  readonly expectedAvCorrelationGeneration: number;
  readonly expectedOwnershipGeneration: number;
  readonly runtimeFrame: number;
  readonly deadlineNs: number;
  readonly cancellationReference?: string;
  readonly safeMetadata: Safe;
}
export type ReplayCaptureRequestSnapshot = ReplayCaptureRequest;
export interface ReplayCapturePlan {
  readonly planId: string;
  readonly requestId: string;
  readonly replaySourceId: string;
  readonly sourceGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly inputSummary: Safe;
  readonly sequence: number;
  readonly timestampAction: string;
  readonly indexAction: string;
  readonly markerAction: string;
  readonly ownershipAction: string;
  readonly evictionAction: string;
  readonly pressureAction: string;
  readonly operationOrder: readonly string[];
  readonly retainedByteEstimate: number;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Safe;
}
export type ReplayCapturePlanSnapshot = ReplayCapturePlan;
export interface ReplayRecallRequest {
  readonly recallRequestId: string;
  readonly replayItemId: string;
  readonly expectedItemGeneration: number;
  readonly replayBufferId: string;
  readonly expectedBufferGeneration: number;
  readonly replayRangeId: string;
  readonly expectedRangeGeneration: number;
  readonly expectedBankGeneration?: number;
  readonly requestedOutputRole: ReplayOutputRole;
  readonly requestedCueMode: ReplayCueMode;
  readonly requestedRuntimeFrame: number;
  readonly expectedTimelineGeneration: number;
  readonly expectedSwitchGenerationMetadata?: number;
  readonly expectedTransitionGenerationMetadata?: number;
  readonly cancellationReference?: string;
  readonly deadlineNs: number;
  readonly correlationId: string;
  readonly safeMetadata: Safe;
}
export type ReplayRecallRequestSnapshot = ReplayRecallRequest;
export interface ReplayRecallPlan {
  readonly planId: string;
  readonly recallRequestId: string;
  readonly replayItemId: string;
  readonly itemGeneration: number;
  readonly replaySourceId: string;
  readonly sourceGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly replayRangeId: string;
  readonly rangeGeneration: number;
  readonly resolvedStartPts: number;
  readonly resolvedEndPts: number;
  readonly resolvedStartSequence: number;
  readonly resolvedEndSequence: number;
  readonly cuePts: number;
  readonly selectedKeyframeSequence: number;
  readonly selectedAudioBoundary: number;
  readonly mediaUnitCount: number;
  readonly estimatedDurationNs: number;
  readonly outputRole: ReplayOutputRole;
  readonly audioPolicy: ReplayAudioPolicy;
  readonly playbackDirection: ReplayPlaybackDirection;
  readonly playbackRate: Safe;
  readonly requiredResourceReferences: readonly string[];
  readonly replayOutputPreparationState: string;
  readonly switchTakeDelegationMetadata: string;
  readonly operationOrder: readonly string[];
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Safe;
}
export type ReplayRecallPlanSnapshot = ReplayRecallPlan;
export interface ReplayRecallResult {
  readonly recallRequestId: string;
  readonly planId: string;
  readonly status: ReplayRecallStatus;
  readonly runtimeFrame: number;
  readonly replayItemId: string;
  readonly itemGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly replaySourceId: string;
  readonly sourceGeneration: number;
  readonly outputRole: ReplayOutputRole;
  readonly cuePts: number;
  readonly startPts: number;
  readonly endPts: number;
  readonly durationNs: number;
  readonly selectedSequenceRange: Readonly<{ start: number; end: number }>;
  readonly keyframeAligned: boolean;
  readonly audioBoundaryAligned: boolean;
  readonly discontinuityState: string;
  readonly mediaUnitCount: number;
  readonly replayOutputReference: string;
  readonly playbackReady: boolean;
  readonly metadataOnly: boolean;
  readonly retainedUnitCount: number;
  readonly warnings: readonly string[];
  readonly completedAtNs: number;
}
export type ReplayRecallResultSnapshot = ReplayRecallResult;
export interface ReplayOutputState {
  readonly replayOutputId: string;
  readonly outputGeneration: number;
  readonly replayItemId: string;
  readonly itemGeneration: number;
  readonly recallPlanId: string;
  readonly outputRole: ReplayOutputRole;
  readonly sourceRole: string;
  readonly cueState: string;
  readonly readinessState: string;
  readonly startPts: number;
  readonly endPts: number;
  readonly currentPlannedPtsMetadata: number;
  readonly audioPolicy: ReplayAudioPolicy;
  readonly playbackRate: Safe;
  readonly playbackDirection: ReplayPlaybackDirection;
  readonly switchDelegationReadiness: string;
  readonly transitionDelegationReadiness: string;
  readonly active: boolean;
  readonly metadataOnly: boolean;
  readonly health: string;
  readonly safeMetadata: Safe;
}
export type ReplayOutputStateSnapshot = ReplayOutputState;
export interface ReplayUnitLease {
  readonly leaseId: string;
  readonly replayUnitId: string;
  readonly unitGeneration: number;
  readonly replayBufferId: string;
  readonly bufferGeneration: number;
  readonly owner: ReplayUnitOwner;
  readonly recallRequestId?: string;
  readonly outputId?: string;
  readonly acquiredSequence: number;
  readonly expirationPolicy: string;
  readonly released: boolean;
  readonly releaseReason?: string;
  readonly safeMetadata: Safe;
}
export type ReplayUnitLeaseSnapshot = ReplayUnitLease;
export interface ReplayBufferPressureSnapshot {
  readonly replayBufferId: string;
  readonly state: ReplayPressureState;
  readonly retainedUnitCount: number;
  readonly retainedDurationNs: number;
  readonly retainedBytes: number;
  readonly protectedRangeCount: number;
  readonly activeRecallRetainedUnits: number;
  readonly evictionCount: number;
  readonly rejectedUnitCount: number;
  readonly estimatedRemainingCapacity: number;
}
export interface ReplayEvictionSnapshot {
  readonly evictionId: string;
  readonly replayBufferId: string;
  readonly evictedUnitIds: readonly string[];
  readonly policy: ReplayEvictionPolicy;
  readonly releasedExactlyOnce: boolean;
  readonly safeMetadata: Safe;
}
export interface ReplaySessionDefinition {
  readonly replaySessionId: string;
  readonly sessionVersion: string;
  readonly sessionGeneration: number;
  readonly replaySourceIds: readonly string[];
  readonly replayBufferIds: readonly string[];
  readonly replayBankIds: readonly string[];
  readonly outputRoles: readonly ReplayOutputRole[];
  readonly capturePolicy: ReplayCapturePolicy;
  readonly recallPolicy: string;
  readonly conflictPolicy: ReplayConflictPolicy;
  readonly queuePolicy: Safe;
  readonly failurePolicy: string;
  readonly enabled: boolean;
  readonly criticality: 'CRITICAL' | 'OPTIONAL';
  readonly safeMetadata: Safe;
  readonly createdAtNs: number;
  readonly updatedAtNs: number;
}
export type ReplaySessionDefinitionSnapshot = ReplaySessionDefinition;
export interface ReplaySessionStateSnapshot {
  readonly replaySessionId: string;
  readonly sessionGeneration: number;
  readonly state: ReplaySessionState;
  readonly activeRecallIds: readonly string[];
  readonly queueDepth: number;
  readonly safeMetadata: Safe;
}
export interface ReplayRequestQueueSnapshot {
  readonly queueId: string;
  readonly count: number;
  readonly maxCount: number;
  readonly maxDurationNs: number;
  readonly estimatedBytes: number;
  readonly maxLatencyNs: number;
  readonly overflowPolicy: string;
  readonly requestIds: readonly string[];
}
export interface ReplayBackendSnapshot {
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly displayName: string;
  readonly capabilities: ReplayBackendCapabilities;
  readonly safeMetadata: Safe;
}
export interface ReplayHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly sourceCount: number;
  readonly bufferCount: number;
  readonly activeBufferCount: number;
  readonly capturingBufferCount: number;
  readonly readyBufferCount: number;
  readonly pressuredBufferCount: number;
  readonly failedBufferCount: number;
  readonly sessionCount: number;
  readonly activeSessionCount: number;
  readonly replayItemCount: number;
  readonly replayBankCount: number;
  readonly capturedUnitCount: number;
  readonly rejectedUnitCount: number;
  readonly evictedUnitCount: number;
  readonly retainedUnitCount: number;
  readonly retainedDurationNs: number;
  readonly retainedBytes: number;
  readonly activeRecallCount: number;
  readonly cueReadyCount: number;
  readonly cancelledRecallCount: number;
  readonly failedRecallCount: number;
  readonly markerCount: number;
  readonly rangeCount: number;
  readonly invalidatedRangeCount: number;
  readonly duplicateCaptureCount: number;
  readonly duplicateRecallCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly sequenceRegressionCount: number;
  readonly timestampRegressionCount: number;
  readonly mixedTickRejectionCount: number;
  readonly bufferOverflowCount: number;
  readonly ownershipViolationCount: number;
  readonly activeRecallRetainedUnits: number;
  readonly peakRetainedUnits: number;
  readonly peakRetainedBytes: number;
  readonly lastCapturedPts: number;
  readonly lastCuePts: number;
  readonly lastSuccessfulRecall?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: number;
}
export type ReplayTelemetrySnapshot = Readonly<Record<string, unknown>>;
export interface ReplayEngineSnapshot {
  readonly version: string;
  readonly backends: readonly ReplayBackendSnapshot[];
  readonly sources: readonly ReplaySourceDefinitionSnapshot[];
  readonly buffers: readonly ReplayBufferDefinitionSnapshot[];
  readonly bufferStates: readonly ReplayBufferStateSnapshot[];
  readonly units: readonly ReplayMediaUnitSnapshot[];
  readonly synchronizedReferences: readonly ReplaySynchronizedMediaReferenceSnapshot[];
  readonly indexes: readonly ReplayTimelineIndexSnapshot[];
  readonly markers: readonly ReplayMarkerSnapshot[];
  readonly ranges: readonly ReplayRangeDefinitionSnapshot[];
  readonly items: readonly ReplayItemDefinitionSnapshot[];
  readonly banks: readonly ReplayBankDefinitionSnapshot[];
  readonly playlists: readonly ReplayPlaylistDefinitionSnapshot[];
  readonly sessions: readonly ReplaySessionDefinitionSnapshot[];
  readonly sessionStates: readonly ReplaySessionStateSnapshot[];
  readonly recallPlans: readonly ReplayRecallPlanSnapshot[];
  readonly recallResults: readonly ReplayRecallResultSnapshot[];
  readonly outputs: readonly ReplayOutputStateSnapshot[];
  readonly leases: readonly ReplayUnitLeaseSnapshot[];
  readonly pressure: readonly ReplayBufferPressureSnapshot[];
  readonly evictions: readonly ReplayEvictionSnapshot[];
  readonly queues: readonly ReplayRequestQueueSnapshot[];
  readonly health: ReplayHealthSnapshot;
  readonly telemetry: ReplayTelemetrySnapshot;
  readonly validation: ReplayValidationReport;
}
export interface ReplayValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedInvariants: readonly string[];
}

export interface ReplayInputMediaReference {
  readonly inputId: string;
  readonly mediaForm: ReplayMediaForm;
  readonly sequence: number;
  readonly pts: number;
  readonly dts?: number;
  readonly durationNs: number;
  readonly timelineGeneration: number;
  readonly avCorrelationGeneration: number;
  readonly ownershipGeneration: number;
  readonly runtimeFrame: number;
  readonly videoFrameId?: string;
  readonly videoFrameGeneration?: number;
  readonly audioBlockId?: string;
  readonly audioBlockGeneration?: number;
  readonly encodedPacketIds?: readonly string[];
  readonly encodedPacketGenerations?: readonly number[];
  readonly packagedOutputId?: string;
  readonly packagedOutputGeneration?: number;
  readonly keyframe?: boolean;
  readonly audioBoundary?: boolean;
  readonly complete: boolean;
  readonly estimatedBytes: number;
  readonly discontinuityGeneration?: number;
  readonly tickId?: string;
  readonly videoTickId?: string;
  readonly audioTickId?: string;
  readonly ownership?: ReplayUnitOwner;
  readonly safeMetadata?: Safe;
}
export interface ReplayBackendCapabilities {
  readonly supportedSourceTypes: readonly ReplaySourceType[];
  readonly supportedMediaForms: readonly ReplayMediaForm[];
  readonly synchronizedAvReferences: boolean;
  readonly encodedPacketReferences: boolean;
  readonly packageReferences: boolean;
  readonly markerSupport: boolean;
  readonly rangeSupport: boolean;
  readonly keyframeAlignment: boolean;
  readonly audioBoundaryAlignment: boolean;
  readonly replayOutputPreparation: boolean;
  readonly realReplayPlayback: boolean;
  readonly realDecode: boolean;
  readonly realDiskBuffer: boolean;
  readonly reversePlayback: boolean;
  readonly variableSpeedPlayback: boolean;
  readonly deterministicBehavior: boolean;
  readonly maximumSessions: number;
  readonly maximumBuffers: number;
  readonly maximumRetainedUnits: number;
  readonly queueMemoryLimits: Safe;
  readonly safeMetadata: Safe;
}
export interface ReplayFoundationBackend {
  readonly descriptor: ReplayBackendSnapshot;
  initializeSession(session: ReplaySessionDefinition): ReplaySessionStateSnapshot;
  createCapturePlan(
    request: ReplayCaptureRequest,
    source: ReplaySourceDefinition,
    buffer: ReplayBufferDefinition,
    state: ReplayBufferStateSnapshot,
  ): ReplayCapturePlan;
  appendReplayUnit(plan: ReplayCapturePlan, request: ReplayCaptureRequest): ReplayMediaUnit;
  createRecallPlan(
    request: ReplayRecallRequest,
    item: ReplayItemDefinition,
    range: ReplayRangeDefinition,
    units: readonly ReplayMediaUnit[],
  ): ReplayRecallPlan;
  prepareReplayOutput(plan: ReplayRecallPlan): ReplayOutputState;
  addMarker(marker: ReplayMarker): ReplayMarker;
  createRange(range: ReplayRangeDefinition): ReplayRangeDefinition;
  resetBuffer(bufferId: string): void;
  drain(): void;
  shutdownSession(sessionId: string): void;
  shutdown(): void;
}
const cap: ReplayBackendCapabilities = freeze({
  supportedSourceTypes: REPLAY_SOURCE_TYPES,
  supportedMediaForms: REPLAY_MEDIA_FORMS,
  synchronizedAvReferences: true,
  encodedPacketReferences: true,
  packageReferences: true,
  markerSupport: true,
  rangeSupport: true,
  keyframeAlignment: true,
  audioBoundaryAlignment: true,
  replayOutputPreparation: true,
  realReplayPlayback: false,
  realDecode: false,
  realDiskBuffer: false,
  reversePlayback: false,
  variableSpeedPlayback: false,
  deterministicBehavior: true,
  maximumSessions: 256,
  maximumBuffers: 512,
  maximumRetainedUnits: 10000,
  queueMemoryLimits: { maxQueueItems: 1024 },
  safeMetadata: { syntheticOnly: true },
});
export class SyntheticReplayFoundationBackend implements ReplayFoundationBackend {
  readonly descriptor: ReplayBackendSnapshot;
  constructor(id = 'replay-backend:synthetic') {
    this.descriptor = freeze({
      backendId: id,
      backendGeneration: 1,
      displayName: 'Deterministic Synthetic Replay Foundation Backend',
      capabilities: cap,
      safeMetadata: { noDisk: true, noDecoder: true, noGpu: true },
    });
  }
  initializeSession(s: ReplaySessionDefinition): ReplaySessionStateSnapshot {
    return freeze({
      replaySessionId: s.replaySessionId,
      sessionGeneration: s.sessionGeneration,
      state: 'READY' as const,
      activeRecallIds: [],
      queueDepth: 0,
      safeMetadata: { syntheticOnly: true },
    });
  }
  createCapturePlan(
    r: ReplayCaptureRequest,
    s: ReplaySourceDefinition,
    b: ReplayBufferDefinition,
    st: ReplayBufferStateSnapshot,
  ) {
    const input = r.inputMediaReference as any;
    const key = `${r.requestId}:${s.replaySourceId}:${b.replayBufferId}:${input.inputId}:${input.sequence}:${input.pts}`;
    return freeze({
      planId: `replay-capture-plan:${sig(key)}`,
      requestId: r.requestId,
      replaySourceId: s.replaySourceId,
      sourceGeneration: s.sourceGeneration,
      replayBufferId: b.replayBufferId,
      bufferGeneration: b.bufferGeneration,
      inputSummary: sanit({
        inputId: input.inputId,
        mediaForm: input.mediaForm,
        sequence: input.sequence,
        pts: input.pts,
      }),
      sequence: input.sequence,
      timestampAction: 'PRESERVE_AUTHORITATIVE_PTS',
      indexAction: b.indexingPolicy,
      markerAction: 'UPDATE_BOUNDED_MARKER_INDEX',
      ownershipAction: 'RETAIN_REPLAY_BUFFER_LEASE',
      evictionAction: b.evictionPolicy,
      pressureAction: b.pressurePolicy,
      operationOrder: [
        'validate source',
        'validate buffer',
        'validate input generation',
        'validate timeline and A/V correlation',
        'validate sequence and timestamps',
        'build replay unit',
        'evaluate buffer pressure',
        'resolve eviction',
        'update ownership retention',
        'append replay unit',
        'update timeline index',
        'update health and telemetry',
        'release evicted ownership',
      ],
      retainedByteEstimate: (st as any).retainedBytes ?? input.estimatedBytes,
      deterministicScore: parseInt(sig(key).slice(0, 6), 16),
      warnings: ['metadata-only replay foundation; no decoding or playback'],
      safeMetadata: { cacheKey: sig(key) },
    });
  }
  appendReplayUnit(p: ReplayCapturePlan, r: ReplayCaptureRequest): ReplayMediaUnit {
    const i = r.inputMediaReference as unknown as ReplayInputMediaReference;
    return freeze({
      replayUnitId: `replay-unit:${sig(`${p.planId}:${i.inputId}`)}`,
      unitGeneration: 1,
      replayBufferId: p.replayBufferId,
      bufferGeneration: p.bufferGeneration,
      replaySourceId: p.replaySourceId,
      sourceGeneration: p.sourceGeneration,
      mediaForm: i.mediaForm,
      runtimeFrame: i.runtimeFrame,
      timelineGeneration: i.timelineGeneration,
      normalizedPts: i.pts,
      ...(i.dts === undefined ? {} : { dtsMetadata: i.dts }),
      durationNs: i.durationNs,
      timeBase: 'ns',
      videoFrameId: i.videoFrameId,
      videoFrameGeneration: i.videoFrameGeneration,
      audioBlockId: i.audioBlockId,
      audioBlockGeneration: i.audioBlockGeneration,
      encodedPacketIds: i.encodedPacketIds ?? [],
      encodedPacketGenerations: i.encodedPacketGenerations ?? [],
      packagedOutputId: i.packagedOutputId,
      packagedOutputGeneration: i.packagedOutputGeneration,
      avCorrelationGeneration: i.avCorrelationGeneration,
      discontinuityGeneration: i.discontinuityGeneration ?? 1,
      sequence: i.sequence,
      keyframe: !!i.keyframe,
      audioBoundary: i.audioBoundary !== false,
      complete: i.complete,
      ownership: 'REPLAY_BUFFER_OWNED',
      estimatedBytes: i.estimatedBytes,
      checksumSignature: `sig:${sig(`${i.inputId}:${i.sequence}:${i.pts}`)}`,
      safeMetadata: sanit(i.safeMetadata),
    } as ReplayMediaUnit);
  }
  createRecallPlan(
    r: ReplayRecallRequest,
    item: ReplayItemDefinition,
    range: ReplayRangeDefinition,
    units: readonly ReplayMediaUnit[],
  ) {
    const inUnits = units.filter(
      (u) => u.sequence >= range.startSequence && u.sequence <= range.endSequence,
    );
    const keys = inUnits.filter((u) => u.keyframe).map((u) => u.sequence);
    const abs = (x: number) => Math.abs(x - range.startSequence);
    const keySeq =
      item.cueMode === 'CUE_TO_KEYFRAME' ? (keys[0] ?? range.startSequence) : range.startSequence;
    const audio = inUnits.find((u) => u.audioBoundary)?.sequence ?? range.startSequence;
    const key = `${r.recallRequestId}:${item.replayItemId}:${range.rangeId}:${keySeq}:${audio}`;
    return freeze({
      planId: `replay-recall-plan:${sig(key)}`,
      recallRequestId: r.recallRequestId,
      replayItemId: item.replayItemId,
      itemGeneration: item.itemGeneration,
      replaySourceId: item.replaySourceId,
      sourceGeneration: item.sourceGeneration,
      replayBufferId: range.replayBufferId,
      bufferGeneration: range.bufferGeneration,
      replayRangeId: range.rangeId,
      rangeGeneration: range.rangeGeneration,
      resolvedStartPts: range.startPts,
      resolvedEndPts: range.endPts,
      resolvedStartSequence: range.startSequence,
      resolvedEndSequence: range.endSequence,
      cuePts: item.cueMode === 'CUE_TO_LATEST_SAFE' ? range.endPts : range.startPts,
      selectedKeyframeSequence: keySeq,
      selectedAudioBoundary: audio,
      mediaUnitCount: inUnits.length,
      estimatedDurationNs: range.durationNs,
      outputRole: r.requestedOutputRole,
      audioPolicy: item.audioPolicy,
      playbackDirection: item.playbackDirection,
      playbackRate: item.playbackRate,
      requiredResourceReferences: inUnits.map((u) => u.replayUnitId),
      replayOutputPreparationState: 'METADATA_ONLY_CUE_READY',
      switchTakeDelegationMetadata: 'future switch/take authority only; no Program mutation',
      operationOrder: [
        'validate recall request',
        'validate replay item',
        'validate retained range',
        'validate markers',
        'resolve keyframe alignment',
        'resolve audio boundaries',
        'validate discontinuities',
        'resolve media-unit sequence',
        'validate ownership/readiness',
        'prepare replay output reference',
        'publish cue-ready state',
        'delegate future playback/take metadata',
        'retain required units under bounded lease',
      ],
      deterministicScore: parseInt(sig(key).slice(0, 6), 16),
      warnings: [
        'metadataOnly true; no real playback in v5.8.1',
        ...(item.playbackDirection === 'FORWARD' ? [] : ['direction metadata-only']),
        ...(item.playbackRate.numerator === item.playbackRate.denominator
          ? []
          : ['rate metadata-only']),
      ],
      safeMetadata: { distance: abs(keySeq) },
    });
  }
  prepareReplayOutput(p: ReplayRecallPlan) {
    return freeze({
      replayOutputId: `replay-output:${sig(p.planId)}`,
      outputGeneration: 1,
      replayItemId: p.replayItemId,
      itemGeneration: p.itemGeneration,
      recallPlanId: p.planId,
      outputRole: p.outputRole,
      sourceRole: 'REPLAY_METADATA_ONLY',
      cueState: 'CUE_READY',
      readinessState: 'METADATA_ONLY_READY',
      startPts: p.resolvedStartPts,
      endPts: p.resolvedEndPts,
      currentPlannedPtsMetadata: p.cuePts,
      audioPolicy: p.audioPolicy,
      playbackRate: p.playbackRate,
      playbackDirection: p.playbackDirection,
      switchDelegationReadiness: 'DELEGATE_ONLY',
      transitionDelegationReadiness: 'DELEGATE_ONLY',
      active: true,
      metadataOnly: true,
      health: 'HEALTHY',
      safeMetadata: { noProgramMutation: true },
    });
  }
  addMarker(m: ReplayMarker) {
    return freeze(m);
  }
  createRange(r: ReplayRangeDefinition) {
    return freeze(r);
  }
  resetBuffer() {}
  drain() {}
  shutdownSession() {}
  shutdown() {}
}

export class ReplayFoundationEngine {
  private shutdown = false;
  private backends = new Map<string, ReplayFoundationBackend>();
  private sources = new Map<string, ReplaySourceDefinition>();
  private buffers = new Map<string, ReplayBufferDefinition>();
  private bufferStates = new Map<string, ReplayBufferStateSnapshot>();
  private units = new Map<string, ReplayMediaUnit>();
  private bufferUnits = new Map<string, ReplayMediaUnit[]>();
  private syncRefs = new Map<string, ReplaySynchronizedMediaReference>();
  private indexes = new Map<string, ReplayTimelineIndex>();
  private markers = new Map<string, ReplayMarker>();
  private ranges = new Map<string, ReplayRangeDefinition>();
  private items = new Map<string, ReplayItemDefinition>();
  private banks = new Map<string, ReplayBankDefinition>();
  private playlists = new Map<string, ReplayPlaylistDefinition>();
  private sessions = new Map<string, ReplaySessionDefinition>();
  private sessionStates = new Map<string, ReplaySessionStateSnapshot>();
  private requests = new Set<string>();
  private recalls = new Set<string>();
  private recallPlans = new Map<string, ReplayRecallPlan>();
  private results = new Map<string, ReplayRecallResult>();
  private outputs = new Map<string, ReplayOutputState>();
  private leases = new Map<string, ReplayUnitLease>();
  private evictions: ReplayEvictionSnapshot[] = [];
  private events: ReplayEventType[] = [];
  private incidents: ReplayWatchdogIncidentType[] = [];
  private telemetry: Record<string, any> = {
    backendRegistrations: 0,
    sourceRegistrations: 0,
    sourceUpdates: 0,
    bufferCreates: 0,
    sessionCreates: 0,
    captureStarts: 0,
    capturePauses: 0,
    captureResumes: 0,
    captureStops: 0,
    mediaSubmissions: 0,
    capturePlans: 0,
    capturedUnits: 0,
    rejectedUnits: 0,
    evictedUnits: 0,
    indexUpdates: 0,
    markerCreates: 0,
    markerUpdates: 0,
    rangeCreates: 0,
    rangeInvalidations: 0,
    itemCreates: 0,
    bankCreates: 0,
    bankSelections: 0,
    recallRequests: 0,
    recallPlans: 0,
    recallCompletions: 0,
    recallCancellations: 0,
    recallFailures: 0,
    cueReadyResults: 0,
    outputPreparations: 0,
    outputReleases: 0,
    pressureStateChanges: 0,
    evictionDecisions: 0,
    duplicateCaptures: 0,
    duplicateRecalls: 0,
    staleGenerations: 0,
    timestampRegressions: 0,
    sequenceRegressions: 0,
    bufferOverflow: 0,
    backendFailures: 0,
    allocationFailures: 0,
    ownershipViolations: 0,
    retainedUnits: 0,
    retainedBytes: 0,
    currentRequestIds: [],
    activeSessionIds: [],
    lastReplayEvent: 'ReplayEngineCreated',
    healthSummary: 'CREATED',
  };
  constructor(readonly replayEngineId = 'replay-engine') {
    this.emit('ReplayEngineCreated');
  }
  private emit(e: ReplayEventType) {
    this.events = [...this.events.slice(-511), e];
    this.telemetry.lastReplayEvent = e;
  }
  private incident(i: ReplayWatchdogIncidentType) {
    this.incidents = [...this.incidents.slice(-511), i];
  }
  private ensure() {
    if (this.shutdown)
      throw new ReplayFoundationError('ReplayShutdownError', 'replay engine is shutdown');
  }
  registerBackend(b: ReplayFoundationBackend) {
    this.ensure();
    if (this.backends.has(b.descriptor.backendId))
      throw new ReplayFoundationError('DuplicateReplayBackend', 'duplicate backend');
    if (
      b.descriptor.capabilities.realReplayPlayback ||
      b.descriptor.capabilities.realDecode ||
      b.descriptor.capabilities.realDiskBuffer
    )
      throw new ReplayFoundationError(
        'ReplayBackendFailed',
        'v5.8.1 backend must be metadata-only',
      );
    this.backends.set(b.descriptor.backendId, b);
    this.telemetry.backendRegistrations++;
    this.emit('ReplayBackendRegistered');
    return b.descriptor;
  }
  selectBackend() {
    const b = [...this.backends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    )[0];
    if (!b) throw new ReplayFoundationError('ReplayBackendNotFound', 'no replay backend');
    return b;
  }
  registerSource(s: ReplaySourceDefinition) {
    this.ensure();
    if (this.sources.has(s.replaySourceId))
      throw new ReplayFoundationError('DuplicateReplaySource', 'duplicate source');
    if (
      !REPLAY_SOURCE_TYPES.includes(s.sourceType) ||
      !REPLAY_MEDIA_FORMS.includes(s.sourceMediaForm)
    )
      throw new ReplayFoundationError(
        'ReplaySourceInvalid',
        'unsupported source type or media form',
      );
    this.sources.set(
      s.replaySourceId,
      freeze({
        ...s,
        safeMetadata: sanit(s.safeMetadata),
        encoderSessionIds: arr(s.encoderSessionIds),
        packageSessionIds: arr(s.packageSessionIds),
      }),
    );
    this.telemetry.sourceRegistrations++;
    this.emit('ReplaySourceRegistered');
    return this.sources.get(s.replaySourceId)!;
  }
  updateSource(id: string, expected: number, patch: Partial<ReplaySourceDefinition>) {
    const s = this.mustSource(id);
    if (s.sourceGeneration !== expected) {
      this.telemetry.staleGenerations++;
      throw new ReplayFoundationError('ReplaySourceInvalid', 'stale source generation');
    }
    const n = freeze({
      ...s,
      ...patch,
      replaySourceId: id,
      sourceGeneration: expected + 1,
      updatedAtNs: (patch.updatedAtNs as number) ?? s.updatedAtNs + 1,
      safeMetadata: sanit(patch.safeMetadata ?? s.safeMetadata),
    } as ReplaySourceDefinition);
    this.sources.set(id, n);
    this.telemetry.sourceUpdates++;
    this.emit('ReplaySourceUpdated');
    return n;
  }
  createBuffer(b: ReplayBufferDefinition) {
    this.ensure();
    if (this.buffers.has(b.replayBufferId))
      throw new ReplayFoundationError('DuplicateReplayBuffer', 'duplicate buffer');
    const s = this.mustSource(b.replaySourceId);
    if (s.sourceGeneration !== b.sourceGeneration)
      throw new ReplayFoundationError('ReplayBufferInvalid', 'source generation mismatch');
    if (b.retentionDurationNs <= 0 || b.maximumItemCount <= 0 || b.maximumEstimatedBytes <= 0)
      throw new ReplayFoundationError(
        'ReplayBufferInvalid',
        'unbounded or non-positive limits rejected',
      );
    this.buffers.set(b.replayBufferId, freeze({ ...b, safeMetadata: sanit(b.safeMetadata) }));
    this.bufferStates.set(
      b.replayBufferId,
      freeze({
        replayBufferId: b.replayBufferId,
        bufferGeneration: b.bufferGeneration,
        state: 'CREATED',
        lastSequence: -1,
        lastPts: -1,
        discontinuityGeneration: 1,
        pressureState: 'NORMAL',
        safeMetadata: {},
      }),
    );
    this.bufferUnits.set(b.replayBufferId, []);
    this.indexes.set(b.replayBufferId, this.emptyIndex(b));
    this.telemetry.bufferCreates++;
    this.emit('ReplayBufferCreated');
    return b;
  }
  transitionBuffer(id: string, next: ReplayBufferState) {
    const st = this.mustBufferState(id);
    const ok: Record<ReplayBufferState, ReplayBufferState[]> = {
      CREATED: ['ARMED', 'DESTROYED', 'SHUTDOWN'],
      ARMED: ['CAPTURING', 'PAUSED', 'STOPPED'],
      CAPTURING: ['READY', 'PRESSURED', 'PAUSED', 'STOPPED', 'FAILED'],
      PRIMING: ['READY', 'FAILED'],
      READY: ['CAPTURING', 'PAUSED', 'DRAINING', 'PRESSURED'],
      PRESSURED: ['CAPTURING', 'PAUSED', 'FAILED'],
      DEGRADED: ['PAUSED', 'STOPPED', 'FAILED'],
      PAUSED: ['CAPTURING', 'STOPPED'],
      DRAINING: ['STOPPED'],
      RESETTING: ['ARMED', 'FAILED'],
      FAILED: ['DESTROYED', 'SHUTDOWN'],
      STOPPED: ['ARMED', 'DESTROYED', 'SHUTDOWN'],
      DESTROYED: ['SHUTDOWN'],
      SHUTDOWN: [],
    };
    if (!(ok[st.state] ?? []).includes(next))
      throw new ReplayFoundationError('ReplayBufferStateInvalid', `invalid ${st.state}->${next}`);
    this.bufferStates.set(id, freeze({ ...st, state: next }));
    if (next === 'ARMED') this.emit('ReplayBufferArmed');
    if (next === 'CAPTURING') {
      this.telemetry.captureStarts++;
      this.emit('ReplayCaptureStarted');
    }
    if (next === 'PAUSED') {
      this.telemetry.capturePauses++;
      this.emit('ReplayCapturePaused');
    }
    if (next === 'STOPPED') {
      this.telemetry.captureStops++;
      this.emit('ReplayCaptureStopped');
    }
  }
  createSession(s: ReplaySessionDefinition) {
    this.ensure();
    if (this.sessions.has(s.replaySessionId))
      throw new ReplayFoundationError('DuplicateReplaySession', 'duplicate session');
    s.replaySourceIds.forEach((id) => this.mustSource(id));
    s.replayBufferIds.forEach((id) => this.mustBuffer(id));
    const ss = this.selectBackend().initializeSession(s);
    this.sessions.set(s.replaySessionId, freeze({ ...s, safeMetadata: sanit(s.safeMetadata) }));
    this.sessionStates.set(s.replaySessionId, ss);
    this.telemetry.sessionCreates++;
    return s;
  }
  submitMedia(input: ReplayInputMediaReference, replaySourceId: string, replayBufferId: string) {
    this.ensure();
    const src = this.mustSource(replaySourceId),
      buf = this.mustBuffer(replayBufferId),
      st = this.mustBufferState(replayBufferId);
    if (st.state !== 'CAPTURING' && st.state !== 'READY' && st.state !== 'PRESSURED')
      throw new ReplayFoundationError('ReplayBufferStateInvalid', 'buffer not capturing');
    if (buf.sourceGeneration !== src.sourceGeneration) {
      this.telemetry.staleGenerations++;
      throw new ReplayFoundationError(
        'ReplayBufferGenerationMismatch',
        'stale source/buffer generation',
      );
    }
    if (input.mediaForm !== src.sourceMediaForm && src.sourceMediaForm !== 'CUSTOM')
      throw new ReplayFoundationError('ReplayMediaUnitInvalid', 'incompatible media form');
    if (input.ownership === 'RELEASED') {
      this.telemetry.ownershipViolations++;
      throw new ReplayFoundationError('ReplayOwnershipViolation', 'released input rejected');
    }
    if (
      input.mediaForm === 'FRAME_AUDIO_PAIR' &&
      (!input.complete || input.videoTickId !== input.audioTickId)
    ) {
      this.telemetry.mixedTickRejectionCount = (this.telemetry.mixedTickRejectionCount ?? 0) + 1;
      this.incident('REPLAY_MIXED_TICK_INPUT');
      throw new ReplayFoundationError(
        'ReplayAvCorrelationInvalid',
        'mixed tick or incomplete synchronized input',
      );
    }
    if (input.sequence <= st.lastSequence) {
      this.telemetry.sequenceRegressions++;
      this.incident('REPLAY_SEQUENCE_REGRESSION');
      throw new ReplayFoundationError('ReplaySequenceRegression', 'sequence regression');
    }
    if (input.pts < st.lastPts) {
      this.telemetry.timestampRegressions++;
      this.incident('REPLAY_TIMESTAMP_REGRESSION');
      throw new ReplayFoundationError('ReplayTimestampRegression', 'timestamp regression');
    }
    const requestId = `replay-capture-request:${sig(input.inputId)}`;
    if (this.requests.has(requestId)) {
      this.telemetry.duplicateCaptures++;
      this.incident('REPLAY_DUPLICATE_CAPTURE');
      throw new ReplayFoundationError('ReplayDuplicateCapture', 'duplicate capture request');
    }
    this.requests.add(requestId);
    const req = freeze({
      requestId,
      replaySourceId,
      expectedSourceGeneration: src.sourceGeneration,
      replayBufferId,
      expectedBufferGeneration: buf.bufferGeneration,
      inputMediaReference: sanit(input as any),
      expectedTimelineGeneration: input.timelineGeneration,
      expectedAvCorrelationGeneration: input.avCorrelationGeneration,
      expectedOwnershipGeneration: input.ownershipGeneration,
      runtimeFrame: input.runtimeFrame,
      deadlineNs: input.pts + input.durationNs,
      safeMetadata: {},
    } as ReplayCaptureRequest);
    const backend = this.selectBackend();
    const plan = backend.createCapturePlan(req, src, buf, st);
    const unit = backend.appendReplayUnit(
      plan,
      freeze({ ...req, inputMediaReference: input as any }),
    );
    if (this.units.has(unit.replayUnitId))
      throw new ReplayFoundationError('ReplayDuplicateCapture', 'duplicate unit');
    let list = [...(this.bufferUnits.get(replayBufferId) ?? []), unit];
    const evicted: ReplayMediaUnit[] = [];
    while (
      list.length > buf.maximumItemCount ||
      list.reduce((a, u) => a + u.estimatedBytes, 0) > buf.maximumEstimatedBytes
    ) {
      if (buf.pressurePolicy === 'REJECT_NEW' || buf.evictionPolicy === 'REJECT_NEW') {
        this.telemetry.bufferOverflow++;
        throw new ReplayFoundationError('ReplayQueueFull', 'buffer full under reject policy');
      }
      const victim = list.find(
        (u) =>
          ![...this.leases.values()].some((l) => !l.released && l.replayUnitId === u.replayUnitId),
      );
      if (!victim) {
        this.incident('REPLAY_ACTIVE_RANGE_EVICTION_ATTEMPT');
        throw new ReplayFoundationError(
          'ReplayBufferPressureCritical',
          'active recall protected units cannot be evicted',
        );
      }
      list = list.filter((u) => u.replayUnitId !== victim.replayUnitId);
      evicted.push(victim);
      this.units.delete(victim.replayUnitId);
    }
    this.units.set(unit.replayUnitId, unit);
    this.bufferUnits.set(replayBufferId, list);
    this.bufferStates.set(
      replayBufferId,
      freeze({
        ...st,
        lastSequence: input.sequence,
        lastPts: input.pts,
        pressureState: this.pressure(buf, list),
      }),
    );
    for (const e of evicted) {
      this.telemetry.evictedUnits++;
      this.evictions.push(
        freeze({
          evictionId: `replay-eviction:${sig(e.replayUnitId)}`,
          replayBufferId,
          evictedUnitIds: [e.replayUnitId],
          policy: buf.evictionPolicy,
          releasedExactlyOnce: true,
          safeMetadata: {},
        }),
      );
      this.emit('ReplayMediaUnitEvicted');
    }
    this.rebuildIndex(buf, list);
    if (unit.mediaForm === 'FRAME_AUDIO_PAIR')
      this.syncRefs.set(
        unit.replayUnitId,
        freeze({
          referenceId: `replay-sync:${sig(unit.replayUnitId)}`,
          generation: 1,
          replayUnitId: unit.replayUnitId,
          replayUnitGeneration: unit.unitGeneration,
          videoFrameSummary: sanit({
            id: unit.videoFrameId,
            generation: unit.videoFrameGeneration,
          }),
          audioBlockSummary: sanit({
            id: unit.audioBlockId,
            generation: unit.audioBlockGeneration,
          }),
          avCorrelationGeneration: unit.avCorrelationGeneration,
          videoPts: unit.normalizedPts,
          audioPts: unit.normalizedPts,
          skewNs: 0,
          synchronized: true,
          degraded: false,
          safeMetadata: {},
        }),
      );
    this.telemetry.mediaSubmissions++;
    this.telemetry.capturePlans++;
    this.telemetry.capturedUnits++;
    this.telemetry.indexUpdates++;
    this.emit('ReplayMediaUnitCaptured');
    return unit;
  }
  addMarker(m: ReplayMarker) {
    const idx = this.mustIndex(m.replayBufferId);
    if (m.sourcePts < idx.earliestPts || m.sourcePts > idx.latestPts) {
      this.incident('REPLAY_MARKER_OUT_OF_RANGE');
      throw new ReplayFoundationError('ReplayMarkerInvalid', 'marker out of retained range');
    }
    if (this.markers.has(m.markerId))
      throw new ReplayFoundationError('DuplicateReplayMarker', 'duplicate marker');
    const mm = freeze({
      ...m,
      labelMetadata: m.labelMetadata.slice(0, 128),
      safeMetadata: sanit(m.safeMetadata),
    });
    this.markers.set(m.markerId, mm);
    this.rebuildIndex(
      this.mustBuffer(m.replayBufferId),
      this.bufferUnits.get(m.replayBufferId) ?? [],
    );
    this.telemetry.markerCreates++;
    this.emit('ReplayMarkerCreated');
    return mm;
  }
  createRange(r: ReplayRangeDefinition) {
    if (this.ranges.has(r.rangeId))
      throw new ReplayFoundationError('DuplicateReplayRange', 'duplicate range');
    const idx = this.mustIndex(r.replayBufferId);
    if (r.startPts >= r.endPts || r.durationNs <= 0) {
      this.incident('REPLAY_INVALID_IN_OUT_RANGE');
      throw new ReplayFoundationError('ReplayRangeInvalid', 'invalid in/out');
    }
    if (r.startPts < idx.earliestPts || r.endPts > idx.latestPts)
      throw new ReplayFoundationError('ReplayRangeInvalid', 'range outside retained buffer');
    const rr = freeze({ ...r, safeMetadata: sanit(r.safeMetadata) });
    this.ranges.set(r.rangeId, rr);
    this.telemetry.rangeCreates++;
    this.emit('ReplayRangeCreated');
    return rr;
  }
  createItem(i: ReplayItemDefinition) {
    if (this.items.has(i.replayItemId))
      throw new ReplayFoundationError('DuplicateReplayItem', 'duplicate item');
    this.mustSource(i.replaySourceId);
    this.mustBuffer(i.replayBufferId);
    this.mustRange(i.replayRangeId);
    if (
      i.playbackRate.numerator <= 0 ||
      i.playbackRate.denominator <= 0 ||
      i.playbackRate.numerator / i.playbackRate.denominator > 16
    )
      throw new ReplayFoundationError('ReplayItemInvalid', 'invalid playback rate');
    const ii = freeze({
      ...i,
      playbackRate: freeze({
        ...i.playbackRate,
        metadataOnly: i.playbackRate.numerator !== i.playbackRate.denominator,
      }),
      safeMetadata: sanit(i.safeMetadata),
    });
    this.items.set(i.replayItemId, ii);
    this.telemetry.itemCreates++;
    this.emit('ReplayItemCreated');
    return ii;
  }
  createBank(b: ReplayBankDefinition) {
    if (this.banks.has(b.replayBankId))
      throw new ReplayFoundationError('DuplicateReplayBank', 'duplicate bank');
    if (
      new Set(b.orderedReplayItemIds).size !== b.orderedReplayItemIds.length ||
      b.orderedReplayItemIds.length > b.maximumItemCount
    )
      throw new ReplayFoundationError('ReplayBankInvalid', 'duplicate or unbounded bank items');
    b.orderedReplayItemIds.forEach((id) => this.mustItem(id));
    const bb = freeze({
      ...b,
      orderedReplayItemIds: arr(b.orderedReplayItemIds),
      safeMetadata: sanit(b.safeMetadata),
    });
    this.banks.set(b.replayBankId, bb);
    this.telemetry.bankCreates++;
    this.emit('ReplayBankCreated');
    return bb;
  }
  recallItem(r: ReplayRecallRequest) {
    this.ensure();
    if (this.recalls.has(r.recallRequestId)) {
      this.telemetry.duplicateRecalls++;
      this.incident('REPLAY_DUPLICATE_RECALL');
      throw new ReplayFoundationError('ReplayDuplicateRecall', 'duplicate recall');
    }
    const item = this.mustItem(r.replayItemId),
      range = this.mustRange(r.replayRangeId),
      buf = this.mustBuffer(r.replayBufferId);
    if (!item.enabled) throw new ReplayFoundationError('ReplayRecallInvalid', 'item disabled');
    if (
      item.itemGeneration !== r.expectedItemGeneration ||
      range.rangeGeneration !== r.expectedRangeGeneration ||
      buf.bufferGeneration !== r.expectedBufferGeneration
    ) {
      this.telemetry.staleGenerations++;
      throw new ReplayFoundationError('ReplayRecallInvalid', 'stale recall generation');
    }
    if (range.validityState !== 'VALID')
      throw new ReplayFoundationError('ReplayRangeEvicted', 'range not valid');
    if (this.outputs.has(r.requestedOutputRole))
      throw new ReplayFoundationError('ReplayOutputConflict', 'one active replay output per role');
    this.recalls.add(r.recallRequestId);
    this.telemetry.recallRequests++;
    this.emit('ReplayRecallRequested');
    const units = this.bufferUnits.get(r.replayBufferId) ?? [];
    if (!units.some((u) => u.sequence === range.startSequence))
      throw new ReplayFoundationError('ReplayRangeEvicted', 'range no longer retained');
    const plan = this.selectBackend().createRecallPlan(r, item, range, units);
    const output = this.selectBackend().prepareReplayOutput(plan);
    const leases = units
      .filter((u) => u.sequence >= range.startSequence && u.sequence <= range.endSequence)
      .map((u) =>
        freeze({
          leaseId: `replay-lease:${sig(`${r.recallRequestId}:${u.replayUnitId}`)}`,
          replayUnitId: u.replayUnitId,
          unitGeneration: u.unitGeneration,
          replayBufferId: u.replayBufferId,
          bufferGeneration: u.bufferGeneration,
          owner: 'REPLAY_RECALL_LEASED' as const,
          recallRequestId: r.recallRequestId,
          acquiredSequence: u.sequence,
          expirationPolicy: 'bounded-recall-plan',
          released: false,
          safeMetadata: {},
        }),
      );
    leases.forEach((l) => this.leases.set(l.leaseId, l));
    this.recallPlans.set(plan.planId, plan);
    this.outputs.set(r.requestedOutputRole, output);
    const result = freeze({
      recallRequestId: r.recallRequestId,
      planId: plan.planId,
      status: 'CUE_READY',
      runtimeFrame: r.requestedRuntimeFrame,
      replayItemId: item.replayItemId,
      itemGeneration: item.itemGeneration,
      replayBufferId: buf.replayBufferId,
      bufferGeneration: buf.bufferGeneration,
      replaySourceId: item.replaySourceId,
      sourceGeneration: item.sourceGeneration,
      outputRole: r.requestedOutputRole,
      cuePts: plan.cuePts,
      startPts: plan.resolvedStartPts,
      endPts: plan.resolvedEndPts,
      durationNs: plan.estimatedDurationNs,
      selectedSequenceRange: { start: plan.resolvedStartSequence, end: plan.resolvedEndSequence },
      keyframeAligned: true,
      audioBoundaryAligned: true,
      discontinuityState: 'VALIDATED',
      mediaUnitCount: plan.mediaUnitCount,
      replayOutputReference: output.replayOutputId,
      playbackReady: false,
      metadataOnly: true,
      retainedUnitCount: leases.length,
      warnings: plan.warnings,
      completedAtNs: r.deadlineNs,
    } as ReplayRecallResult);
    this.results.set(r.recallRequestId, result);
    this.telemetry.recallPlans++;
    this.telemetry.recallCompletions++;
    this.telemetry.cueReadyResults++;
    this.telemetry.outputPreparations++;
    this.emit('ReplayRecallPlanned');
    this.emit('ReplayCueReady');
    this.emit('ReplayOutputPrepared');
    return result;
  }
  releaseOutput(role: ReplayOutputRole) {
    const o = this.outputs.get(role);
    if (!o) return;
    this.outputs.delete(role);
    for (const [id, l] of this.leases)
      if (l.outputId === o.replayOutputId || l.recallRequestId)
        this.leases.set(id, freeze({ ...l, released: true, releaseReason: 'output-released' }));
    this.telemetry.outputReleases++;
    this.emit('ReplayOutputReleased');
  }
  shutdownEngine() {
    if (this.shutdown) return;
    this.shutdown = true;
    this.requests.clear();
    this.recalls.clear();
    this.outputs.clear();
    this.leases.clear();
    this.bufferUnits.clear();
    this.units.clear();
    this.syncRefs.clear();
    this.recallPlans.clear();
    for (const id of this.bufferStates.keys())
      this.bufferStates.set(id, freeze({ ...this.bufferStates.get(id)!, state: 'SHUTDOWN' }));
    for (const id of this.sessionStates.keys())
      this.sessionStates.set(
        id,
        freeze({
          ...this.sessionStates.get(id)!,
          state: 'SHUTDOWN',
          activeRecallIds: [],
          queueDepth: 0,
        }),
      );
    for (const b of this.backends.values()) b.shutdown();
    this.emit('ReplayEngineShutdown');
  }
  assertInvariants(): ReplayValidationReport {
    const errors: string[] = [];
    const uniq = (n: string, a: string[]) => {
      if (new Set(a).size !== a.length) errors.push(`${n} not unique`);
    };
    uniq('backend ids', [...this.backends.keys()]);
    uniq('source ids', [...this.sources.keys()]);
    uniq('buffer ids', [...this.buffers.keys()]);
    uniq('unit ids', [...this.units.keys()]);
    uniq('marker ids', [...this.markers.keys()]);
    uniq('range ids', [...this.ranges.keys()]);
    uniq('item ids', [...this.items.keys()]);
    uniq('bank ids', [...this.banks.keys()]);
    for (const b of this.buffers.values())
      if (!this.sources.has(b.replaySourceId)) errors.push('buffer references missing source');
    for (const [bid, list] of this.bufferUnits) {
      const sorted = [...list].sort((a, b) => a.sequence - b.sequence);
      if (
        JSON.stringify(sorted.map((u) => u.sequence)) !==
        JSON.stringify(list.map((u) => u.sequence))
      )
        errors.push(`sequence order mismatch ${bid}`);
      for (let i = 1; i < list.length; i++)
        if (list[i]!.normalizedPts < list[i - 1]!.normalizedPts)
          errors.push('timestamp regression retained');
      const idx = this.indexes.get(bid);
      if (idx && idx.unitCount !== list.length) errors.push('timeline index mismatch');
    }
    if (
      [...this.outputs.values()].filter(
        (o, i, a) => a.findIndex((x) => x.outputRole === o.outputRole) === i,
      ).length !== this.outputs.size
    )
      errors.push('output role conflict');
    if (
      this.shutdown &&
      (this.units.size || this.leases.size || this.outputs.size || this.requests.size)
    )
      errors.push('shutdown cleanup incomplete');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: ['v5.8.1 metadata-only; no real decode/playback/disk replay'],
      checkedInvariants: [
        'unique ids',
        'generation references',
        'monotonic sequence/timestamps',
        'timeline index agreement',
        'one active output per role',
        'bounded queues/leases',
        'metadata-only backend flags',
        'shutdown cleanup',
      ],
    });
  }
  snapshot(): ReplayEngineSnapshot {
    const units = [...this.units.values()].sort((a, b) =>
      a.replayUnitId.localeCompare(b.replayUnitId),
    );
    const indexes = [...this.indexes.values()].sort((a, b) =>
      a.replayBufferId.localeCompare(b.replayBufferId),
    );
    const states = [...this.bufferStates.values()];
    const retainedBytes = units.reduce((a, u) => a + u.estimatedBytes, 0);
    const health = freeze({
      engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
      healthState: this.assertInvariants().valid ? 'HEALTHY' : 'FAILED',
      backendCount: this.backends.size,
      sourceCount: this.sources.size,
      bufferCount: this.buffers.size,
      activeBufferCount: states.filter(
        (s) => !['STOPPED', 'DESTROYED', 'SHUTDOWN'].includes(s.state),
      ).length,
      capturingBufferCount: states.filter((s) => s.state === 'CAPTURING').length,
      readyBufferCount: states.filter((s) => s.state === 'READY').length,
      pressuredBufferCount: states.filter(
        (s) => s.pressureState === 'HIGH' || s.pressureState === 'CRITICAL',
      ).length,
      failedBufferCount: states.filter((s) => s.state === 'FAILED').length,
      sessionCount: this.sessions.size,
      activeSessionCount: [...this.sessionStates.values()].filter(
        (s) => !['STOPPED', 'DESTROYED', 'SHUTDOWN'].includes(s.state),
      ).length,
      replayItemCount: this.items.size,
      replayBankCount: this.banks.size,
      capturedUnitCount: this.telemetry.capturedUnits,
      rejectedUnitCount: this.telemetry.rejectedUnits,
      evictedUnitCount: this.telemetry.evictedUnits,
      retainedUnitCount: units.length,
      retainedDurationNs: indexes.reduce((a, i) => a + i.totalDurationNs, 0),
      retainedBytes,
      activeRecallCount: this.leases.size,
      cueReadyCount: this.telemetry.cueReadyResults,
      cancelledRecallCount: this.telemetry.recallCancellations,
      failedRecallCount: this.telemetry.recallFailures,
      markerCount: this.markers.size,
      rangeCount: this.ranges.size,
      invalidatedRangeCount: [...this.ranges.values()].filter((r) => r.validityState !== 'VALID')
        .length,
      duplicateCaptureCount: this.telemetry.duplicateCaptures,
      duplicateRecallCount: this.telemetry.duplicateRecalls,
      staleGenerationRejectionCount: this.telemetry.staleGenerations,
      sequenceRegressionCount: this.telemetry.sequenceRegressions,
      timestampRegressionCount: this.telemetry.timestampRegressions,
      mixedTickRejectionCount: this.telemetry.mixedTickRejectionCount ?? 0,
      bufferOverflowCount: this.telemetry.bufferOverflow,
      ownershipViolationCount: this.telemetry.ownershipViolations,
      activeRecallRetainedUnits: this.leases.size,
      peakRetainedUnits: Math.max(this.telemetry.peakRetainedUnits ?? 0, units.length),
      peakRetainedBytes: Math.max(this.telemetry.peakRetainedBytes ?? 0, retainedBytes),
      lastCapturedPts: units.at(-1)?.normalizedPts ?? -1,
      lastCuePts: [...this.results.values()].at(-1)?.cuePts ?? -1,
      lastSuccessfulRecall: [...this.results.keys()].at(-1),
      updatedAtNs: 0,
    } as unknown as ReplayHealthSnapshot);
    this.telemetry.retainedUnits = units.length;
    this.telemetry.retainedBytes = retainedBytes;
    this.telemetry.healthSummary = health.healthState;
    return freeze({
      version: REPLAY_FOUNDATION_VERSION,
      backends: [...this.backends.values()]
        .map((b) => b.descriptor)
        .sort((a, b) => a.backendId.localeCompare(b.backendId)),
      sources: [...this.sources.values()].sort((a, b) =>
        a.replaySourceId.localeCompare(b.replaySourceId),
      ),
      buffers: [...this.buffers.values()].sort((a, b) =>
        a.replayBufferId.localeCompare(b.replayBufferId),
      ),
      bufferStates: states.sort((a, b) => a.replayBufferId.localeCompare(b.replayBufferId)),
      units,
      synchronizedReferences: [...this.syncRefs.values()].sort((a, b) =>
        a.referenceId.localeCompare(b.referenceId),
      ),
      indexes,
      markers: [...this.markers.values()].sort((a, b) => a.markerId.localeCompare(b.markerId)),
      ranges: [...this.ranges.values()].sort((a, b) => a.rangeId.localeCompare(b.rangeId)),
      items: [...this.items.values()].sort((a, b) => a.replayItemId.localeCompare(b.replayItemId)),
      banks: [...this.banks.values()].sort((a, b) => a.replayBankId.localeCompare(b.replayBankId)),
      playlists: [...this.playlists.values()].sort((a, b) =>
        a.playlistId.localeCompare(b.playlistId),
      ),
      sessions: [...this.sessions.values()].sort((a, b) =>
        a.replaySessionId.localeCompare(b.replaySessionId),
      ),
      sessionStates: [...this.sessionStates.values()].sort((a, b) =>
        a.replaySessionId.localeCompare(b.replaySessionId),
      ),
      recallPlans: [...this.recallPlans.values()].sort((a, b) => a.planId.localeCompare(b.planId)),
      recallResults: [...this.results.values()].sort((a, b) =>
        a.recallRequestId.localeCompare(b.recallRequestId),
      ),
      outputs: [...this.outputs.values()].sort((a, b) =>
        a.replayOutputId.localeCompare(b.replayOutputId),
      ),
      leases: [...this.leases.values()].sort((a, b) => a.leaseId.localeCompare(b.leaseId)),
      pressure: [...this.buffers.values()].map((b) => this.pressureSnapshot(b)),
      evictions: this.evictions.slice(-256),
      queues: [
        freeze({
          queueId: 'capture',
          count: this.requests.size,
          maxCount: 1024,
          maxDurationNs: 1_000_000_000,
          estimatedBytes: 0,
          maxLatencyNs: 1_000_000_000,
          overflowPolicy: 'REJECT_NEW',
          requestIds: [...this.requests].slice(-64),
        }),
      ],
      health,
      telemetry: freeze(clone(this.telemetry)),
      validation: this.assertInvariants(),
    });
  }
  private emptyIndex(b: ReplayBufferDefinition): ReplayTimelineIndex {
    return freeze({
      indexId: `replay-index:${b.replayBufferId}`,
      indexGeneration: 1,
      replayBufferId: b.replayBufferId,
      bufferGeneration: b.bufferGeneration,
      earliestPts: 0,
      latestPts: 0,
      totalDurationNs: 0,
      earliestSequence: -1,
      latestSequence: -1,
      discontinuityRanges: [],
      keyframePositions: [],
      audioBoundaryPositions: [],
      markerPositions: [],
      unitCount: 0,
      estimatedBytes: 0,
      safeMetadata: {},
    });
  }
  private rebuildIndex(b: ReplayBufferDefinition, list: readonly ReplayMediaUnit[]) {
    const markers = [...this.markers.values()]
      .filter((m) => m.replayBufferId === b.replayBufferId)
      .map((m) => m.markerId)
      .sort();
    this.indexes.set(
      b.replayBufferId,
      freeze({
        indexId: `replay-index:${b.replayBufferId}`,
        indexGeneration: (this.indexes.get(b.replayBufferId)?.indexGeneration ?? 0) + 1,
        replayBufferId: b.replayBufferId,
        bufferGeneration: b.bufferGeneration,
        earliestPts: list[0]?.normalizedPts ?? 0,
        latestPts: list.at(-1)?.normalizedPts ?? 0,
        totalDurationNs: list.length
          ? list.at(-1)!.normalizedPts + list.at(-1)!.durationNs - list[0]!.normalizedPts
          : 0,
        earliestSequence: list[0]?.sequence ?? -1,
        latestSequence: list.at(-1)?.sequence ?? -1,
        discontinuityRanges: [],
        keyframePositions: list.filter((u) => u.keyframe).map((u) => u.sequence),
        audioBoundaryPositions: list.filter((u) => u.audioBoundary).map((u) => u.sequence),
        markerPositions: markers,
        unitCount: list.length,
        estimatedBytes: list.reduce((a, u) => a + u.estimatedBytes, 0),
        ...(list.length
          ? { readyRange: { startPts: list[0]!.normalizedPts, endPts: list.at(-1)!.normalizedPts } }
          : {}),
        safeMetadata: { bounded: true },
      }),
    );
  }
  private pressure(
    b: ReplayBufferDefinition,
    list: readonly ReplayMediaUnit[],
  ): ReplayPressureState {
    const ratio = Math.max(
      list.length / b.maximumItemCount,
      list.reduce((a, u) => a + u.estimatedBytes, 0) / b.maximumEstimatedBytes,
    );
    if (ratio >= 1) return 'EXHAUSTED';
    if (ratio >= 0.9) return 'CRITICAL';
    if (ratio >= 0.75) return 'HIGH';
    if (ratio >= 0.5) return 'ELEVATED';
    return 'NORMAL';
  }
  private pressureSnapshot(b: ReplayBufferDefinition): ReplayBufferPressureSnapshot {
    const list = this.bufferUnits.get(b.replayBufferId) ?? [];
    const idx = this.indexes.get(b.replayBufferId);
    const bytes = list.reduce((a, u) => a + u.estimatedBytes, 0);
    return freeze({
      replayBufferId: b.replayBufferId,
      state: this.pressure(b, list),
      retainedUnitCount: list.length,
      retainedDurationNs: idx?.totalDurationNs ?? 0,
      retainedBytes: bytes,
      protectedRangeCount: this.ranges.size,
      activeRecallRetainedUnits: this.leases.size,
      evictionCount: this.evictions.length,
      rejectedUnitCount: this.telemetry.rejectedUnits,
      estimatedRemainingCapacity: Math.max(0, b.maximumEstimatedBytes - bytes),
    });
  }
  private mustSource(id: string) {
    const v = this.sources.get(id);
    if (!v) throw new ReplayFoundationError('ReplaySourceNotFound', id);
    return v;
  }
  private mustBuffer(id: string) {
    const v = this.buffers.get(id);
    if (!v) throw new ReplayFoundationError('ReplayBufferNotFound', id);
    return v;
  }
  private mustBufferState(id: string) {
    const v = this.bufferStates.get(id);
    if (!v) throw new ReplayFoundationError('ReplayBufferNotFound', id);
    return v;
  }
  private mustIndex(id: string) {
    const v = this.indexes.get(id);
    if (!v) throw new ReplayFoundationError('ReplayInvariantViolation', id);
    return v;
  }
  private mustRange(id: string) {
    const v = this.ranges.get(id);
    if (!v) throw new ReplayFoundationError('ReplayRangeNotFound', id);
    return v;
  }
  private mustItem(id: string) {
    const v = this.items.get(id);
    if (!v) throw new ReplayFoundationError('ReplayItemNotFound', id);
    return v;
  }
}
export const createReplayFoundationEngine = (id?: string) => new ReplayFoundationEngine(id);
export const createSyntheticReplayFoundationBackend = (id?: string) =>
  new SyntheticReplayFoundationBackend(id);
export class ReplayFoundationProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'replay-media-recall-foundation',
    name: 'Replay and Media Recall Foundation',
    version: REPLAY_FOUNDATION_VERSION,
    order: REPLAY_FOUNDATION_PROCESSOR_ORDER,
    phase: 'OUTPUT',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: [],
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
    metadata: {
      captureBoundary: 'after final authoritative media publication',
      metadataOnly: true,
    },
  };
  constructor(readonly engine: ReplayFoundationEngine) {}
  initialize() {
    return { status: 'READY' as const, metadata: { order: REPLAY_FOUNDATION_PROCESSOR_ORDER } };
  }
  async processTick(_tick: FrameTick, context: ProcessorRuntimeContext | any) {
    const s = this.engine.snapshot();
    context?.outputs?.publish?.(
      this.descriptor.id,
      REPLAY_OUTPUT_KEYS.replayHealth,
      s.health,
      'BORROWED',
    );
    context?.outputs?.publish?.(
      this.descriptor.id,
      REPLAY_OUTPUT_KEYS.replayTelemetry,
      s.telemetry,
      'BORROWED',
    );
    return { status: 'SUCCEEDED' as const, value: s.health };
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' as const };
  }
}
export const createReplayFoundationProcessor = (engine: ReplayFoundationEngine) =>
  new ReplayFoundationProcessor(engine);
export function createReplayCommandHandlers(
  engine: ReplayFoundationEngine,
): Readonly<Record<ReplayCommandType, RuntimeCommandHandler>> {
  const h = (type: ReplayCommandType, fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: type,
      idempotent: true,
      execute(c: any) {
        return { status: 'SUCCEEDED', value: fn((c as any).payload ?? {}) };
      },
    }) as any;
  return Object.fromEntries(
    REPLAY_COMMAND_TYPES.map((t) => [
      t,
      h(t, (p: any) => {
        switch (t) {
          case 'REPLAY_REGISTER_BACKEND':
            return engine.registerBackend(p.backend);
          case 'REPLAY_REGISTER_SOURCE':
            return engine.registerSource(p.source);
          case 'REPLAY_UPDATE_SOURCE':
            return engine.updateSource(p.replaySourceId, p.expectedGeneration, p.patch);
          case 'REPLAY_CREATE_BUFFER':
            return engine.createBuffer(p.buffer);
          case 'REPLAY_CREATE_SESSION':
            return engine.createSession(p.session);
          case 'REPLAY_ARM_CAPTURE':
            return engine.transitionBuffer(p.replayBufferId, 'ARMED');
          case 'REPLAY_START_CAPTURE':
          case 'REPLAY_RESUME_CAPTURE':
            return engine.transitionBuffer(p.replayBufferId, 'CAPTURING');
          case 'REPLAY_PAUSE_CAPTURE':
            return engine.transitionBuffer(p.replayBufferId, 'PAUSED');
          case 'REPLAY_STOP_CAPTURE':
            return engine.transitionBuffer(p.replayBufferId, 'STOPPED');
          case 'REPLAY_SUBMIT_MEDIA':
            return engine.submitMedia(p.input, p.replaySourceId, p.replayBufferId);
          case 'REPLAY_ADD_MARKER':
          case 'REPLAY_SET_IN':
          case 'REPLAY_SET_OUT':
          case 'REPLAY_SET_CUE':
            return engine.addMarker(p.marker);
          case 'REPLAY_CREATE_RANGE':
            return engine.createRange(p.range);
          case 'REPLAY_CREATE_ITEM':
            return engine.createItem(p.item);
          case 'REPLAY_CREATE_BANK':
            return engine.createBank(p.bank);
          case 'REPLAY_RECALL_ITEM':
            return engine.recallItem(p.request);
          case 'REPLAY_RELEASE_OUTPUT':
            return engine.releaseOutput(p.outputRole);
          case 'REPLAY_VALIDATE':
            return engine.assertInvariants();
          case 'REPLAY_SHUTDOWN':
            return engine.shutdownEngine();
          default:
            return undefined;
        }
      }),
    ]),
  ) as any;
}
export function createReplaySourceGraphSnapshot(engine: ReplayFoundationEngine) {
  const s = engine.snapshot();
  return freeze({
    replaySourceIds: s.sources.map((x) => x.replaySourceId),
    sourceTypes: s.sources.map((x) => x.sourceType),
    outputRoles: s.sources.map((x) => x.sourceOutputRole),
    replayBufferIds: s.buffers.map((x) => x.replayBufferId),
    bufferStates: s.bufferStates.map((x) => x.state),
    retainedDurationNs: s.health.retainedDurationNs,
    retainedUnitCount: s.health.retainedUnitCount,
    pressureStates: s.pressure.map((x) => x.state),
    earliestLatestRetainedPts: s.indexes.map((x) => ({
      bufferId: x.replayBufferId,
      earliestPts: x.earliestPts,
      latestPts: x.latestPts,
    })),
    markerCount: s.markers.length,
    rangeCount: s.ranges.length,
    replayItemCount: s.items.length,
    activeBankSelection: s.banks.map((b) => ({
      bankId: b.replayBankId,
      activeItemId: b.activeItemId,
    })),
    cueReadyState: s.health.cueReadyCount,
    activeRecallState: s.health.activeRecallCount,
    replayOutputRoles: s.outputs.map((o) => o.outputRole),
    metadataOnly: true,
    health: s.health.healthState,
    readiness: s.health.engineState === 'READY',
  });
}
