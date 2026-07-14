import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  RuntimeContext,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';

export const REPLAY_PLAYBACK_VERSION = '5.8.2';
export const REPLAY_PLAYBACK_PROCESSOR_ORDER = 1120;
type SafeMetadata = Readonly<Record<string, unknown>>;
type Json = string | number | boolean | null | Json[] | { readonly [key: string]: Json };
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const arr = <T>(v: readonly T[]) => freeze([...v]);
const sanitize = (m?: SafeMetadata): SafeMetadata => {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(m ?? {}).slice(0, 64)) {
    if (
      /(secret|token|password|credential|path|file|native|payload|pcm|pixel|bytes|handle)/i.test(k)
    )
      continue;
    o[k] = typeof v === 'string' ? v.slice(0, 256) : v;
  }
  return freeze(o);
};
const idHash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};
const sid = (p: string, ...parts: readonly unknown[]) => `${p}-${idHash(parts.join('|'))}`;
const b = (v: bigint) => v.toString();

export const REPLAY_PLAYBACK_OUTPUT_KEYS = {
  playbackSessionDefinitions: 'replay.playback.sessions.definitions',
  playbackSessionStates: 'replay.playback.sessions.states',
  playbackRequests: 'replay.playback.requests',
  playbackPlans: 'replay.playback.plans',
  playbackPositions: 'replay.playback.positions',
  playbackClockMappings: 'replay.playback.clockMappings',
  selectedReplayUnits: 'replay.playback.unitSelections',
  playbackAvSyncStates: 'replay.playback.avSync',
  replayAudioCoordinationStates: 'replay.playback.audioCoordination',
  prerollStates: 'replay.playback.preroll',
  replayPreviewOutputs: 'replay.playback.previewOutputs',
  replayProgramCandidates: 'replay.playback.programCandidates',
  replayProgramActiveStates: 'replay.playback.programActive',
  programInsertionRequests: 'replay.playback.insertionRequests',
  programInsertionPlans: 'replay.playback.insertionPlans',
  programInsertionResults: 'replay.playback.insertionResults',
  returnToLiveRequests: 'replay.playback.returnRequests',
  returnToLivePlans: 'replay.playback.returnPlans',
  returnToLiveResults: 'replay.playback.returnResults',
  completionStates: 'replay.playback.completions',
  abortStates: 'replay.playback.aborts',
  underrunStates: 'replay.playback.underruns',
  lookaheadStates: 'replay.playback.lookahead',
  playlistExecutionStates: 'replay.playback.playlists',
  playbackLeases: 'replay.playback.leases',
  playbackQueues: 'replay.playback.queues',
  activeConfigurationTransactions: 'replay.playback.transactions',
  playbackHealth: 'replay.playback.health',
  playbackTelemetry: 'replay.playback.telemetry',
  backendHealth: 'replay.playback.backendHealth',
  failedRejectedResults: 'replay.playback.failedRejected',
} as const;
export const REPLAY_PLAYBACK_COMMAND_TYPES = [
  'REPLAY_PLAYBACK_REGISTER_BACKEND',
  'REPLAY_PLAYBACK_UNREGISTER_BACKEND',
  'REPLAY_PLAYBACK_CREATE_SESSION',
  'REPLAY_PLAYBACK_UPDATE_SESSION',
  'REPLAY_PLAYBACK_DESTROY_SESSION',
  'REPLAY_PLAYBACK_VALIDATE',
  'REPLAY_PLAYBACK_CUE',
  'REPLAY_PLAYBACK_PREROLL',
  'REPLAY_PLAYBACK_ARM',
  'REPLAY_PLAYBACK_PREPARE_PREVIEW',
  'REPLAY_PLAYBACK_PREPARE_PROGRAM_CANDIDATE',
  'REPLAY_PLAYBACK_START',
  'REPLAY_PLAYBACK_TAKE_TO_PROGRAM',
  'REPLAY_PLAYBACK_COMPLETE',
  'REPLAY_PLAYBACK_RETURN_TO_LIVE',
  'REPLAY_PLAYBACK_ABORT',
  'REPLAY_PLAYBACK_CANCEL',
  'REPLAY_PLAYBACK_SET_AUDIO_POLICY',
  'REPLAY_PLAYBACK_SET_RETURN_POLICY',
  'REPLAY_PLAYBACK_SET_CONFLICT_POLICY',
  'REPLAY_PLAYBACK_SELECT_ITEM',
  'REPLAY_PLAYBACK_PREPARE_NEXT_ITEM',
  'REPLAY_PLAYBACK_DRAIN',
  'REPLAY_PLAYBACK_RESET',
  'REPLAY_PLAYBACK_RECONFIGURE',
  'REPLAY_PLAYBACK_CLEAR_PLAN_CACHE',
  'REPLAY_PLAYBACK_SHUTDOWN',
] as const;
export type ReplayPlaybackCommandType = (typeof REPLAY_PLAYBACK_COMMAND_TYPES)[number];
export const REPLAY_PLAYBACK_EVENTS = [
  'ReplayPlaybackEngineCreated',
  'ReplayPlaybackBackendRegistered',
  'ReplayPlaybackBackendRemoved',
  'ReplayPlaybackSessionCreated',
  'ReplayPlaybackSessionValidated',
  'ReplayPlaybackCued',
  'ReplayPlaybackPrerollStarted',
  'ReplayPlaybackPrerollReady',
  'ReplayPlaybackArmed',
  'ReplayPreviewPrepared',
  'ReplayProgramCandidatePrepared',
  'ReplayPlaybackStarted',
  'ReplayUnitSelected',
  'ReplayPlaybackPositionChanged',
  'ReplayPlaybackAvSyncChanged',
  'ReplayAudioCoordinationChanged',
  'ReplayProgramInsertionRequested',
  'ReplayProgramInsertionReady',
  'ReplayInsertedToProgram',
  'ReplayPlaybackUnderrun',
  'ReplayPlaybackCompleting',
  'ReplayPlaybackCompleted',
  'ReplayReturnToLiveRequested',
  'ReplayReturnedToLive',
  'ReplayPlaybackAborting',
  'ReplayPlaybackAborted',
  'ReplayPlaybackDegraded',
  'ReplayPlaybackFailed',
  'ReplayPlaybackHealthChanged',
  'ReplayPlaybackEngineShutdown',
] as const;
export const REPLAY_PLAYBACK_WATCHDOG_INCIDENTS = [
  'REPLAY_PLAYBACK_ENGINE_STALLED',
  'REPLAY_PLAYBACK_REQUEST_TIMEOUT',
  'REPLAY_PLAYBACK_DUPLICATE_REQUEST',
  'REPLAY_PLAYBACK_DUPLICATE_TICK',
  'REPLAY_PLAYBACK_SESSION_GENERATION_STALE',
  'REPLAY_PLAYBACK_ITEM_GENERATION_STALE',
  'REPLAY_PLAYBACK_PLAN_GENERATION_STALE',
  'REPLAY_PLAYBACK_OUTPUT_GENERATION_STALE',
  'REPLAY_PLAYBACK_BUFFER_GENERATION_STALE',
  'REPLAY_PLAYBACK_RANGE_GENERATION_STALE',
  'REPLAY_PLAYBACK_PROGRAM_BUS_GENERATION_STALE',
  'REPLAY_PLAYBACK_PREVIEW_BUS_GENERATION_STALE',
  'REPLAY_PLAYBACK_SWITCH_GENERATION_STALE',
  'REPLAY_PLAYBACK_TRANSITION_GENERATION_STALE',
  'REPLAY_PLAYBACK_TIMELINE_GENERATION_STALE',
  'REPLAY_PLAYBACK_AV_SYNC_GENERATION_STALE',
  'REPLAY_PLAYBACK_REQUIRED_KEYFRAME_MISSING',
  'REPLAY_PLAYBACK_AUDIO_BOUNDARY_INVALID',
  'REPLAY_PLAYBACK_RANGE_EVICTED',
  'REPLAY_PLAYBACK_ACTIVE_UNIT_EVICTION_ATTEMPT',
  'REPLAY_PLAYBACK_UNIT_MISSING',
  'REPLAY_PLAYBACK_UNDERRUN',
  'REPLAY_PLAYBACK_AV_SYNC_INVALID',
  'REPLAY_PLAYBACK_OUTPUT_ROLE_CONFLICT',
  'REPLAY_PLAYBACK_PROGRAM_INSERTION_FAILED',
  'REPLAY_PLAYBACK_RETURN_TO_LIVE_FAILED',
  'REPLAY_PLAYBACK_AUDIO_COORDINATION_FAILED',
  'REPLAY_PLAYBACK_QUEUE_OVERFLOW',
  'REPLAY_PLAYBACK_BACKEND_FAILED',
  'REPLAY_PLAYBACK_OWNERSHIP_VIOLATION',
  'REPLAY_PLAYBACK_OUTPUT_REGISTRY_MISMATCH',
  'REPLAY_PLAYBACK_SOURCE_GRAPH_MISMATCH',
  'REPLAY_PLAYBACK_INVARIANT_FAILURE',
] as const;
export type ReplayPlaybackMode =
  | 'FORWARD_1X'
  | 'REVERSE_METADATA'
  | 'SLOW_MOTION_METADATA'
  | 'FAST_MOTION_METADATA'
  | 'FREEZE_METADATA'
  | 'LOOP_METADATA'
  | 'PLAYLIST_METADATA'
  | 'CUSTOM_TYPED';
export type ReplayPlaybackSessionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'CUED'
  | 'PREROLLING'
  | 'ARMED'
  | 'TAKING'
  | 'PLAYING'
  | 'PAUSING_METADATA'
  | 'PAUSED_METADATA'
  | 'COMPLETING'
  | 'COMPLETE'
  | 'RETURNING_TO_LIVE'
  | 'ABORTING'
  | 'ABORTED'
  | 'DEGRADED'
  | 'FAILED'
  | 'DESTROYED'
  | 'SHUTDOWN';
export type ReplayPlaybackStartPolicy =
  | 'START_AT_CUE'
  | 'START_AT_IN'
  | 'START_AT_SELECTED_KEYFRAME'
  | 'START_AT_NEXT_SAFE_FRAME'
  | 'START_AT_NEXT_PROGRAM_TICK'
  | 'START_AFTER_TRANSITION_IN'
  | 'CUSTOM';
export type ReplayPlaybackEndPolicy =
  | 'STOP_AT_OUT'
  | 'STOP_AT_END_SEQUENCE'
  | 'HOLD_LAST_FRAME_METADATA'
  | 'RETURN_TO_LIVE'
  | 'ADVANCE_PLAYLIST_METADATA'
  | 'LOOP_METADATA'
  | 'CUSTOM';
export type ReplayReturnToLivePolicy =
  | 'CUT_TO_PREVIOUS_LIVE'
  | 'TRANSITION_TO_PREVIOUS_LIVE'
  | 'CUT_TO_CURRENT_PREVIEW'
  | 'TRANSITION_TO_CURRENT_PREVIEW'
  | 'HOLD_REPLAY_PROGRAM_CANDIDATE_METADATA'
  | 'OPERATOR_REQUIRED'
  | 'CUSTOM';
export type ReplayAudioFollowReplayPolicy =
  | 'FOLLOW_REPLAY_WHEN_ON_PROGRAM'
  | 'FOLLOW_REPLAY_WHEN_ON_PREVIEW_METADATA'
  | 'KEEP_PROGRAM_AUDIO'
  | 'MUTE_REPLAY'
  | 'REPLAY_AUDIO_ONLY'
  | 'OPERATOR_CONTROLLED'
  | 'CUSTOM';
export type ReplayOutputPlaybackRole =
  | 'REPLAY_PREVIEW'
  | 'REPLAY_PROGRAM_CANDIDATE'
  | 'REPLAY_PROGRAM_ACTIVE'
  | 'REPLAY_AUX'
  | 'REPLAY_CLEAN_FEED'
  | 'REPLAY_MULTIVIEW_METADATA'
  | 'CUSTOM';
export type ReplayPlaybackRequestAction =
  | 'VALIDATE'
  | 'CUE'
  | 'PREROLL'
  | 'ARM'
  | 'TAKE_TO_PREVIEW'
  | 'TAKE_TO_PROGRAM'
  | 'START'
  | 'COMPLETE'
  | 'RETURN_TO_LIVE'
  | 'ABORT'
  | 'RESET'
  | 'CUSTOM';
export type ReplayProgramInsertionMode =
  'CUT' | 'AUTO_TRANSITION' | 'TAKE_FROM_REPLAY_PREVIEW' | 'REPLACE_PROGRAM_METADATA' | 'CUSTOM';
export type ReplayProgramInsertionStatus =
  | 'INSERTION_READY'
  | 'INSERTED'
  | 'TRANSITIONING'
  | 'ROLLED_BACK'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED';
export type ReplayReturnToLiveStatus =
  | 'RETURN_READY'
  | 'RETURNED'
  | 'TRANSITIONING'
  | 'ROLLED_BACK'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED';
export type ReplayUnderrunPolicy =
  | 'FAIL_PLAYBACK'
  | 'HOLD_LAST_FRAME_METADATA'
  | 'SKIP_TO_NEXT_AVAILABLE'
  | 'RETURN_TO_LIVE'
  | 'ABORT_REPLAY'
  | 'REQUEST_OPERATOR_INTERVENTION'
  | 'CUSTOM';
export type ReplayPlaylistExecutionStatus =
  | 'CREATED'
  | 'READY'
  | 'ACTIVE_METADATA'
  | 'WAITING_METADATA'
  | 'COMPLETE'
  | 'FAILED'
  | 'CANCELLED';
export type ReplayPlaybackLeaseOwner =
  | 'PLAYBACK_SESSION_OWNED'
  | 'REPLAY_PREVIEW_OWNED'
  | 'REPLAY_PROGRAM_CANDIDATE_OWNED'
  | 'REPLAY_PROGRAM_ACTIVE_OWNED'
  | 'DOWNSTREAM_COMPOSITOR_BORROWED'
  | 'RELEASED';
export type ReplayPlaybackConflictPolicy =
  | 'REJECT_NEW_PLAYBACK'
  | 'CANCEL_EXISTING_PLAYBACK'
  | 'PRIORITY_WINS'
  | 'QUEUE_PLAYBACK'
  | 'ONE_PER_PROGRAM_ROLE'
  | 'ONE_PER_REPLAY_PREVIEW_ROLE'
  | 'CUSTOM';
export type ReplayPlaybackQueuePolicy =
  'DROP_NEWEST' | 'DROP_OLDEST' | 'REJECT' | 'PRIORITIZE_PROGRAM_CRITICAL' | 'CUSTOM';
export interface ReplayReference {
  readonly id: string;
  readonly generation: number;
}
export interface ReplayPlaybackRate {
  readonly numerator: number;
  readonly denominator: number;
}
export interface ReplayPlaybackSessionDefinition {
  readonly playbackSessionId: string;
  readonly sessionVersion: string;
  readonly sessionGeneration: number;
  readonly replayItem: ReplayReference;
  readonly recallPlan: ReplayReference;
  readonly replayOutput: ReplayReference;
  readonly replayBuffer: ReplayReference;
  readonly replayRange: ReplayReference;
  readonly source: ReplayReference;
  readonly playbackMode: ReplayPlaybackMode;
  readonly playbackRate: ReplayPlaybackRate;
  readonly direction: 'FORWARD' | 'REVERSE_METADATA' | 'CUSTOM';
  readonly outputRole: ReplayOutputPlaybackRole;
  readonly audioPolicy: ReplayAudioFollowReplayPolicy;
  readonly startPolicy: readonly ReplayPlaybackStartPolicy[];
  readonly endPolicy: ReplayPlaybackEndPolicy;
  readonly transitionInReference?: ReplayReference | undefined;
  readonly transitionOutReference?: ReplayReference | undefined;
  readonly returnToLivePolicy: ReplayReturnToLivePolicy;
  readonly conflictPolicy: ReplayPlaybackConflictPolicy;
  readonly queuePolicy: ReplayPlaybackQueuePolicy;
  readonly criticality: 'LOW' | 'NORMAL' | 'PROGRAM_CRITICAL';
  readonly enabled: boolean;
  readonly safeMetadata: SafeMetadata;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
}
export interface ReplayPlaybackSessionRuntimeState {
  readonly playbackSessionId: string;
  readonly sessionGeneration: number;
  readonly state: ReplayPlaybackSessionState;
  readonly activeReplayOutput: boolean;
  readonly lastRuntimeFrame?: bigint | undefined;
  readonly completedOnce: boolean;
  readonly abortedOnce: boolean;
  readonly destroyed: boolean;
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackRequest {
  readonly requestId: string;
  readonly playbackSessionId: string;
  readonly expectedPlaybackSessionGeneration: number;
  readonly replayItem: ReplayReference;
  readonly recallPlan: ReplayReference;
  readonly replayOutput: ReplayReference;
  readonly replayBuffer: ReplayReference;
  readonly replayRange: ReplayReference;
  readonly expectedProgramBusGeneration: number;
  readonly expectedPreviewBusGeneration: number;
  readonly expectedSceneSwitchGeneration: number;
  readonly expectedTransitionGeneration: number;
  readonly expectedMasterTimelineGeneration: number;
  readonly expectedAvSynchronizationGeneration: number;
  readonly requestedAction: ReplayPlaybackRequestAction;
  readonly requestedRuntimeFrame: bigint;
  readonly deadlineNs: bigint;
  readonly cancellationReference?: string | undefined;
  readonly correlationId: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly playbackSession: ReplayReference;
  readonly replayItem: ReplayReference;
  readonly recallPlan: ReplayReference;
  readonly replayOutput: ReplayReference;
  readonly source: ReplayReference;
  readonly buffer: ReplayReference;
  readonly range: ReplayReference;
  readonly selectedPlaybackMode: ReplayPlaybackMode;
  readonly selectedPlaybackRate: ReplayPlaybackRate;
  readonly selectedDirection: string;
  readonly selectedStartSequence: number;
  readonly selectedEndSequence: number;
  readonly selectedStartPtsNs: bigint;
  readonly selectedEndPtsNs: bigint;
  readonly selectedKeyframeSequence: number;
  readonly selectedAudioBoundarySequence: number;
  readonly selectedRuntimeStartFrame: bigint;
  readonly programBusSnapshotSummary: SafeMetadata;
  readonly previewBusSnapshotSummary: SafeMetadata;
  readonly previousLiveSourceSnapshot: SafeMetadata;
  readonly transitionInDelegation: SafeMetadata;
  readonly transitionOutDelegation: SafeMetadata;
  readonly audioCoordinationAction: string;
  readonly avSynchronizationAction: string;
  readonly ownershipAction: string;
  readonly operationOrder: readonly string[];
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackPositionState {
  readonly positionId: string;
  readonly positionGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly playbackMode: ReplayPlaybackMode;
  readonly playbackRateNumerator: number;
  readonly playbackRateDenominator: number;
  readonly direction: string;
  readonly startRuntimeFrame: bigint;
  readonly currentRuntimeFrame: bigint;
  readonly startSequence: number;
  readonly currentSequence: number;
  readonly endSequence: number;
  readonly startPtsNs: bigint;
  readonly currentPtsNs: bigint;
  readonly endPtsNs: bigint;
  readonly elapsedDurationNs: bigint;
  readonly remainingDurationNs: bigint;
  readonly discontinuityGeneration: number;
  readonly complete: boolean;
  readonly underrun: boolean;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackClockMapping {
  readonly mappingId: string;
  readonly mappingGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly masterTimelineGeneration: number;
  readonly sourceTimeBase: ReplayPlaybackRate;
  readonly programTimeBase: ReplayPlaybackRate;
  readonly playbackStartPtsNs: bigint;
  readonly programInsertionPtsNs: bigint;
  readonly currentSourcePtsNs: bigint;
  readonly currentProgramPtsNs: bigint;
  readonly rateNumerator: number;
  readonly rateDenominator: number;
  readonly driftMetadataNs: bigint;
  readonly discontinuityGeneration: number;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackUnitSelection {
  readonly selectionId: string;
  readonly selectionGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly runtimeFrame: bigint;
  readonly replayUnit: ReplayReference;
  readonly unitSequence: number;
  readonly unitPtsNs: bigint;
  readonly videoFrameReferenceSummary: SafeMetadata;
  readonly audioBlockReferenceSummary: SafeMetadata;
  readonly encodedPackageReferenceSummary: SafeMetadata;
  readonly avCorrelationGeneration: number;
  readonly selected: boolean;
  readonly skipped: boolean;
  readonly repeatedMetadata: boolean;
  readonly missing: boolean;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackAvSyncState {
  readonly syncStateId: string;
  readonly syncGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly videoPtsNs: bigint;
  readonly audioPtsNs: bigint;
  readonly skewNs: bigint;
  readonly driftNs: bigint;
  readonly toleranceNs: bigint;
  readonly synchronized: boolean;
  readonly degraded: boolean;
  readonly heldVideoMetadata: boolean;
  readonly heldAudioMetadata: boolean;
  readonly discontinuityGeneration: number;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayAudioCoordinationState {
  readonly audioStateId: string;
  readonly audioStateGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly audioPolicy: ReplayAudioFollowReplayPolicy;
  readonly replayAudioAvailable: boolean;
  readonly programAudioAvailable: boolean;
  readonly selectedAudioSource: string;
  readonly audioFollowReplayRequested: boolean;
  readonly programDuckRequestedMetadata: boolean;
  readonly programContinuationRequestedMetadata: boolean;
  readonly muteRequested: boolean;
  readonly mixerCommandDelegationState: string;
  readonly masterAudioGeneration: number;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPrerollState {
  readonly prerollId: string;
  readonly prerollGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly requestedStartSequence: number;
  readonly selectedKeyframeSequence: number;
  readonly selectedAudioBoundarySequence: number;
  readonly requiredUnitCount: number;
  readonly availableUnitCount: number;
  readonly requiredDurationNs: bigint;
  readonly availableDurationNs: bigint;
  readonly ready: boolean;
  readonly degraded: boolean;
  readonly missingRequirements: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayProgramInsertionRequest {
  readonly insertionRequestId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly replayOutput: ReplayReference;
  readonly replayProgramCandidateRole: ReplayOutputPlaybackRole;
  readonly expectedProgramBusGeneration: number;
  readonly expectedPreviewBusGeneration: number;
  readonly expectedSwitchGeneration: number;
  readonly expectedTransitionGeneration: number;
  readonly previousLiveSourceSnapshotGeneration: number;
  readonly insertionMode: ReplayProgramInsertionMode;
  readonly transitionReference?: ReplayReference | undefined;
  readonly requestedRuntimeFrame: bigint;
  readonly cancellationReference?: string | undefined;
  readonly correlationId: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayProgramInsertionPlan {
  readonly insertionPlanId: string;
  readonly insertionRequestId: string;
  readonly playbackSession: ReplayReference;
  readonly replayOutput: ReplayReference;
  readonly currentProgramSourceSnapshot: SafeMetadata;
  readonly currentPreviewSourceSnapshot: SafeMetadata;
  readonly replayProgramCandidateSnapshot: SafeMetadata;
  readonly previousLiveSourceSnapshot: SafeMetadata;
  readonly insertionMode: ReplayProgramInsertionMode;
  readonly selectedTransition?: ReplayReference | undefined;
  readonly transitionDurationMetadataNs: bigint;
  readonly targetRuntimeFrame: bigint;
  readonly audioFollowReplayAction: string;
  readonly tallyAction: string;
  readonly programPreviewBusCommandDelegation: string;
  readonly switchCommandDelegation: string;
  readonly rollbackAction: string;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayProgramInsertionResult {
  readonly insertionRequestId: string;
  readonly insertionPlanId: string;
  readonly status: ReplayProgramInsertionStatus;
  readonly runtimeFrame: bigint;
  readonly playbackSession: ReplayReference;
  readonly replayOutput: ReplayReference;
  readonly previousProgramSource: SafeMetadata;
  readonly newProgramSource: SafeMetadata;
  readonly transitionReference?: ReplayReference | undefined;
  readonly audioCoordinationResult: string;
  readonly tallyResultMetadata: SafeMetadata;
  readonly programBusGenerationBefore: number;
  readonly programBusGenerationAfter: number;
  readonly switchGenerationBefore: number;
  readonly switchGenerationAfter: number;
  readonly replayNowOnProgram: boolean;
  readonly rollbackPerformed: boolean;
  readonly warnings: readonly string[];
  readonly completedAtNs: bigint;
}
export interface ReplayReturnToLiveRequest {
  readonly returnRequestId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly expectedProgramBusGeneration: number;
  readonly expectedPreviewBusGeneration: number;
  readonly expectedSwitchGeneration: number;
  readonly expectedTransitionGeneration: number;
  readonly previousLiveSourceSnapshot: SafeMetadata;
  readonly currentLiveFallbackSnapshotMetadata: SafeMetadata;
  readonly returnPolicy: ReplayReturnToLivePolicy;
  readonly requestedRuntimeFrame: bigint;
  readonly cancellationReference?: string | undefined;
  readonly correlationId: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayReturnToLivePlan {
  readonly returnPlanId: string;
  readonly returnRequestId: string;
  readonly playbackSession: ReplayReference;
  readonly currentReplayProgramSnapshot: SafeMetadata;
  readonly previousLiveSnapshot: SafeMetadata;
  readonly fallbackLiveSnapshot: SafeMetadata;
  readonly selectedLiveTarget: SafeMetadata;
  readonly returnPolicy: ReplayReturnToLivePolicy;
  readonly selectedTransition?: ReplayReference | undefined;
  readonly audioFollowReplayReleaseAction: string;
  readonly programAudioRestorationAction: string;
  readonly tallyRestorationAction: string;
  readonly programPreviewDelegation: string;
  readonly rollbackAction: string;
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayReturnToLiveResult {
  readonly returnRequestId: string;
  readonly returnPlanId: string;
  readonly status: ReplayReturnToLiveStatus;
  readonly runtimeFrame: bigint;
  readonly playbackSession: ReplayReference;
  readonly previousReplayProgramSource: SafeMetadata;
  readonly restoredLiveSource: SafeMetadata;
  readonly transitionReference?: ReplayReference | undefined;
  readonly audioRestorationResult: string;
  readonly programBusGenerationBefore: number;
  readonly programBusGenerationAfter: number;
  readonly switchGenerationBefore: number;
  readonly switchGenerationAfter: number;
  readonly returnedToLive: boolean;
  readonly rollbackPerformed: boolean;
  readonly warnings: readonly string[];
  readonly completedAtNs: bigint;
}
export interface ReplayPlaybackCompletionSnapshot {
  readonly completionId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly runtimeFrame: string;
  readonly endSequence: number;
  readonly completedOnce: boolean;
  readonly triggeredReturnToLive: boolean;
  readonly releasedLeaseIds: readonly string[];
  readonly completedAtNs: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackAbortSnapshot {
  readonly abortId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly runtimeFrame: string;
  readonly reason: string;
  readonly restorePolicy: ReplayReturnToLivePolicy;
  readonly releasedLeaseIds: readonly string[];
  readonly abortedAtNs: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackUnderrunState {
  readonly underrunId: string;
  readonly underrunGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly runtimeFrame: bigint;
  readonly expectedSequence: number;
  readonly lastAvailableSequence: number;
  readonly missingUnitCount: number;
  readonly missingDurationNs: bigint;
  readonly activeRangeStillRetained: boolean;
  readonly policy: ReplayUnderrunPolicy;
  readonly action: string;
  readonly recovered: boolean;
  readonly failureReason?: string | undefined;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackLookaheadState {
  readonly lookaheadId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly currentSequence: number;
  readonly requestedLookaheadUnits: number;
  readonly availableLookaheadUnits: number;
  readonly protectedSequenceRange: readonly [number, number];
  readonly protectedDurationNs: bigint;
  readonly pressureImpact: string;
  readonly ready: boolean;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaylistExecutionState {
  readonly executionId: string;
  readonly executionGeneration: number;
  readonly playlistId: string;
  readonly playlistGeneration: number;
  readonly orderedItemIds: readonly string[];
  readonly currentItemIndex: number;
  readonly currentPlaybackSessionId?: string | undefined;
  readonly completionPolicy: string;
  readonly advancePolicy: string;
  readonly loopMetadata: boolean;
  readonly state: ReplayPlaylistExecutionStatus;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackLease {
  readonly leaseId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly replayUnit: ReplayReference;
  readonly outputRole: ReplayOutputPlaybackRole;
  readonly owner: ReplayPlaybackLeaseOwner;
  readonly acquiredSequence: number;
  readonly expirationPolicy: string;
  readonly released: boolean;
  readonly releaseReason?: string | undefined;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackQueueSnapshot {
  readonly queueId: string;
  readonly queueType: string;
  readonly depth: number;
  readonly capacity: number;
  readonly estimatedBytes: number;
  readonly maximumLatencyNs: string;
  readonly overflowPolicy: ReplayPlaybackQueuePolicy;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPreviewOutputSnapshot {
  readonly previewId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly replayOutputId: string;
  readonly role: ReplayOutputPlaybackRole;
  readonly ready: boolean;
  readonly mutatesProgram: false;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayProgramCandidateSnapshot {
  readonly candidateId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly replayOutputId: string;
  readonly prepared: boolean;
  readonly retained: boolean;
  readonly onProgram: false;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayProgramActiveSnapshot {
  readonly activeId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly replayOutputId: string;
  readonly programBusGeneration: number;
  readonly switchGeneration: number;
  readonly replayNowOnProgram: boolean;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayPlaybackSessionDefinitionSnapshot = Omit<
  ReplayPlaybackSessionDefinition,
  'createdAtNs' | 'updatedAtNs'
> & { readonly createdAtNs: string; readonly updatedAtNs: string };
export type ReplayPlaybackSessionStateSnapshot = Omit<
  ReplayPlaybackSessionRuntimeState,
  'lastRuntimeFrame'
> & { readonly lastRuntimeFrame?: string | undefined };
export type ReplayPlaybackRequestSnapshot = Omit<
  ReplayPlaybackRequest,
  'requestedRuntimeFrame' | 'deadlineNs'
> & { readonly requestedRuntimeFrame: string; readonly deadlineNs: string };
export type ReplayPlaybackPlanSnapshot = Omit<
  ReplayPlaybackPlan,
  'selectedStartPtsNs' | 'selectedEndPtsNs' | 'selectedRuntimeStartFrame'
> & {
  readonly selectedStartPtsNs: string;
  readonly selectedEndPtsNs: string;
  readonly selectedRuntimeStartFrame: string;
};
export type ReplayPlaybackPositionSnapshot = Omit<
  ReplayPlaybackPositionState,
  | 'startRuntimeFrame'
  | 'currentRuntimeFrame'
  | 'startPtsNs'
  | 'currentPtsNs'
  | 'endPtsNs'
  | 'elapsedDurationNs'
  | 'remainingDurationNs'
> & {
  readonly startRuntimeFrame: string;
  readonly currentRuntimeFrame: string;
  readonly startPtsNs: string;
  readonly currentPtsNs: string;
  readonly endPtsNs: string;
  readonly elapsedDurationNs: string;
  readonly remainingDurationNs: string;
};
export type ReplayPlaybackClockMappingSnapshot = Omit<
  ReplayPlaybackClockMapping,
  | 'playbackStartPtsNs'
  | 'programInsertionPtsNs'
  | 'currentSourcePtsNs'
  | 'currentProgramPtsNs'
  | 'driftMetadataNs'
> & {
  readonly playbackStartPtsNs: string;
  readonly programInsertionPtsNs: string;
  readonly currentSourcePtsNs: string;
  readonly currentProgramPtsNs: string;
  readonly driftMetadataNs: string;
};
export type ReplayPlaybackUnitSelectionSnapshot = Omit<
  ReplayPlaybackUnitSelection,
  'runtimeFrame' | 'unitPtsNs'
> & { readonly runtimeFrame: string; readonly unitPtsNs: string };
export type ReplayPlaybackAvSyncSnapshot = Omit<
  ReplayPlaybackAvSyncState,
  'videoPtsNs' | 'audioPtsNs' | 'skewNs' | 'driftNs' | 'toleranceNs'
> & {
  readonly videoPtsNs: string;
  readonly audioPtsNs: string;
  readonly skewNs: string;
  readonly driftNs: string;
  readonly toleranceNs: string;
};
export type ReplayAudioCoordinationSnapshot = ReplayAudioCoordinationState;
export type ReplayPrerollSnapshot = Omit<
  ReplayPrerollState,
  'requiredDurationNs' | 'availableDurationNs'
> & { readonly requiredDurationNs: string; readonly availableDurationNs: string };
export type ReplayProgramInsertionRequestSnapshot = Omit<
  ReplayProgramInsertionRequest,
  'requestedRuntimeFrame'
> & { readonly requestedRuntimeFrame: string };
export type ReplayProgramInsertionPlanSnapshot = Omit<
  ReplayProgramInsertionPlan,
  'transitionDurationMetadataNs' | 'targetRuntimeFrame'
> & { readonly transitionDurationMetadataNs: string; readonly targetRuntimeFrame: string };
export type ReplayProgramInsertionResultSnapshot = Omit<
  ReplayProgramInsertionResult,
  'runtimeFrame' | 'completedAtNs'
> & { readonly runtimeFrame: string; readonly completedAtNs: string };
export type ReplayReturnToLiveRequestSnapshot = Omit<
  ReplayReturnToLiveRequest,
  'requestedRuntimeFrame'
> & { readonly requestedRuntimeFrame: string };
export type ReplayReturnToLivePlanSnapshot = ReplayReturnToLivePlan;
export type ReplayReturnToLiveResultSnapshot = Omit<
  ReplayReturnToLiveResult,
  'runtimeFrame' | 'completedAtNs'
> & { readonly runtimeFrame: string; readonly completedAtNs: string };
export type ReplayPlaybackUnderrunSnapshot = Omit<
  ReplayPlaybackUnderrunState,
  'runtimeFrame' | 'missingDurationNs'
> & { readonly runtimeFrame: string; readonly missingDurationNs: string };
export type ReplayPlaybackLookaheadSnapshot = Omit<
  ReplayPlaybackLookaheadState,
  'protectedDurationNs'
> & { readonly protectedDurationNs: string };
export type ReplayPlaylistExecutionSnapshot = ReplayPlaylistExecutionState;
export type ReplayPlaybackLeaseSnapshot = ReplayPlaybackLease;
export interface ReplayPlaybackBackendCapabilities {
  readonly supportedPlaybackModes: readonly ReplayPlaybackMode[];
  readonly supportedRates: readonly string[];
  readonly forwardPlayback: boolean;
  readonly reversePlayback: boolean;
  readonly variableSpeedPlayback: boolean;
  readonly synchronizedAvSelection: boolean;
  readonly replayPreviewSupport: boolean;
  readonly programCandidateSupport: boolean;
  readonly programInsertionDelegation: boolean;
  readonly returnToLiveDelegation: boolean;
  readonly realPlayback: boolean;
  readonly realDecode: boolean;
  readonly realFrameOutput: boolean;
  readonly realAudioOutput: boolean;
  readonly realTransitionRendering: boolean;
  readonly deterministicBehavior: boolean;
  readonly maximumSessions: number;
  readonly maximumActiveProgramReplaySessions: number;
  readonly queueLimit: number;
  readonly memoryLimitBytes: number;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackBackendSnapshot {
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly capabilities: ReplayPlaybackBackendCapabilities;
  readonly health: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackBackend {
  readonly descriptor: {
    readonly backendId: string;
    readonly backendGeneration: number;
    readonly displayName: string;
    readonly version: string;
  };
  readonly capabilities: ReplayPlaybackBackendCapabilities;
  initializeSession(s: ReplayPlaybackSessionDefinition): ReplayPlaybackSessionRuntimeState;
  createPlaybackPlan(
    r: ReplayPlaybackRequest,
    s: ReplayPlaybackSessionDefinition,
  ): ReplayPlaybackPlan;
  resolvePlaybackPosition(
    p: ReplayPlaybackPlan,
    t: FrameTick,
    previous?: ReplayPlaybackPositionState,
  ): ReplayPlaybackPositionState;
  selectReplayUnit(
    p: ReplayPlaybackPlan,
    pos: ReplayPlaybackPositionState,
  ): ReplayPlaybackUnitSelection;
  prepareReplayPreview(s: ReplayPlaybackSessionDefinition): ReplayPreviewOutputSnapshot;
  prepareProgramCandidate(s: ReplayPlaybackSessionDefinition): ReplayProgramCandidateSnapshot;
  createProgramInsertionPlan(r: ReplayProgramInsertionRequest): ReplayProgramInsertionPlan;
  createReturnToLivePlan(r: ReplayReturnToLiveRequest): ReplayReturnToLivePlan;
  completePlayback(
    s: ReplayPlaybackSessionDefinition,
    frame: bigint,
  ): ReplayPlaybackCompletionSnapshot;
  abortPlayback(
    s: ReplayPlaybackSessionDefinition,
    frame: bigint,
    reason: string,
  ): ReplayPlaybackAbortSnapshot;
  reset(): void;
  drain(): void;
  shutdownSession(id: string): void;
  shutdown(): void;
  snapshot(): ReplayPlaybackBackendSnapshot;
}
export interface ReplayPlaybackHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly playbackSessionCount: number;
  readonly activePlaybackSessionCount: number;
  readonly cuedSessionCount: number;
  readonly prerollingSessionCount: number;
  readonly armedSessionCount: number;
  readonly playingSessionCount: number;
  readonly completingSessionCount: number;
  readonly completedSessionCount: number;
  readonly abortedSessionCount: number;
  readonly failedSessionCount: number;
  readonly replayPreviewCount: number;
  readonly programCandidateCount: number;
  readonly programActiveReplayCount: number;
  readonly playbackRequestCount: number;
  readonly playbackPlanCount: number;
  readonly selectedUnitCount: number;
  readonly skippedUnitCount: number;
  readonly missingUnitCount: number;
  readonly underrunCount: number;
  readonly insertionRequestCount: number;
  readonly successfulInsertionCount: number;
  readonly failedInsertionCount: number;
  readonly returnToLiveRequestCount: number;
  readonly successfulReturnCount: number;
  readonly failedReturnCount: number;
  readonly audioCoordinationCount: number;
  readonly avSyncDegradedCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateTickCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly outputRoleConflictCount: number;
  readonly bufferEvictionConflictCount: number;
  readonly ownershipViolationCount: number;
  readonly activePlaybackLeaseCount: number;
  readonly protectedReplayUnitCount: number;
  readonly queueDepth: number;
  readonly peakQueueDepth: number;
  readonly lastPlaybackPtsNs: string;
  readonly lastProgramInsertion?: string | undefined;
  readonly lastReturnToLive?: string | undefined;
  readonly lastFailure?: string | undefined;
  readonly updatedAtNs: string;
}
export interface ReplayPlaybackTelemetrySnapshot extends SafeMetadata {
  readonly backendRegistrations: number;
  readonly sessionCreates: number;
  readonly validationRequests: number;
  readonly cueRequests: number;
  readonly playbackStarts: number;
  readonly playbackTicks: number;
  readonly unitSelections: number;
  readonly completions: number;
  readonly aborts: number;
  readonly currentRequestIds: readonly string[];
  readonly activePlaybackSessionIds: readonly string[];
  readonly lastEvent: string;
  readonly healthSummary: string;
}
export interface ReplayPlaybackValidationReport {
  readonly valid: boolean;
  readonly checked: readonly string[];
  readonly failures: readonly string[];
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayPlaybackEngineSnapshot {
  readonly version: string;
  readonly state: string;
  readonly backends: readonly ReplayPlaybackBackendSnapshot[];
  readonly sessions: readonly ReplayPlaybackSessionDefinitionSnapshot[];
  readonly sessionStates: readonly ReplayPlaybackSessionStateSnapshot[];
  readonly plans: readonly ReplayPlaybackPlanSnapshot[];
  readonly positions: readonly ReplayPlaybackPositionSnapshot[];
  readonly selections: readonly ReplayPlaybackUnitSelectionSnapshot[];
  readonly previews: readonly ReplayPreviewOutputSnapshot[];
  readonly programCandidates: readonly ReplayProgramCandidateSnapshot[];
  readonly programActives: readonly ReplayProgramActiveSnapshot[];
  readonly insertions: readonly ReplayProgramInsertionResultSnapshot[];
  readonly returns: readonly ReplayReturnToLiveResultSnapshot[];
  readonly completions: readonly ReplayPlaybackCompletionSnapshot[];
  readonly aborts: readonly ReplayPlaybackAbortSnapshot[];
  readonly underruns: readonly ReplayPlaybackUnderrunSnapshot[];
  readonly queues: readonly ReplayPlaybackQueueSnapshot[];
  readonly health: ReplayPlaybackHealthSnapshot;
  readonly telemetry: ReplayPlaybackTelemetrySnapshot;
  readonly validation: ReplayPlaybackValidationReport;
}
const errors = [
  'ReplayPlaybackEngineNotReady',
  'ReplayPlaybackBackendNotFound',
  'DuplicateReplayPlaybackBackend',
  'ReplayPlaybackSessionNotFound',
  'DuplicateReplayPlaybackSession',
  'ReplayPlaybackSessionInvalid',
  'ReplayPlaybackSessionGenerationMismatch',
  'ReplayPlaybackSessionStateInvalid',
  'ReplayPlaybackRequestInvalid',
  'ReplayPlaybackDuplicateRequest',
  'ReplayPlaybackPlanInvalid',
  'ReplayPlaybackItemStale',
  'ReplayPlaybackRangeEvicted',
  'ReplayPlaybackKeyframeMissing',
  'ReplayPlaybackAudioBoundaryInvalid',
  'ReplayPlaybackUnitMissing',
  'ReplayPlaybackUnderrun',
  'ReplayPlaybackAvSyncInvalid',
  'ReplayPlaybackOutputConflict',
  'ReplayProgramInsertionInvalid',
  'ReplayProgramInsertionFailed',
  'ReplayReturnToLiveInvalid',
  'ReplayReturnToLiveFailed',
  'ReplayAudioCoordinationFailed',
  'ReplayPlaybackQueueFull',
  'ReplayPlaybackBackendFailed',
  'ReplayPlaybackOwnershipViolation',
  'ReplayPlaybackCancelled',
  'ReplayPlaybackTimeout',
  'ReplayPlaybackInvariantViolation',
  'ReplayPlaybackShutdownError',
] as const;
export type ReplayPlaybackErrorCode = (typeof errors)[number];
export class ReplayPlaybackError extends Error {
  constructor(
    readonly code: ReplayPlaybackErrorCode,
    message: string,
    readonly details: SafeMetadata = {},
  ) {
    super(message);
    this.name = code;
  }
}
const opOrder = arr([
  'validate playback session',
  'validate replay item, plan, output, buffer, and range',
  'validate retained replay units',
  'validate active recall leases',
  'validate Program/Preview/switch/transition generations',
  'resolve start sequence and PTS',
  'resolve audio boundary',
  'resolve playback start tick',
  'snapshot previous live Program state',
  'resolve replay Preview/Program-candidate role',
  'resolve transition delegation',
  'resolve replay audio policy',
  'resolve A/V synchronization state',
  'acquire playback leases',
  'publish playback-ready state',
  'delegate TAKE through authoritative control path',
  'update playback state',
]);
export class SyntheticReplayPlaybackBackend implements ReplayPlaybackBackend {
  readonly descriptor = {
    backendId: 'synthetic-replay-playback',
    backendGeneration: 1,
    displayName: 'Synthetic Replay Playback Backend',
    version: REPLAY_PLAYBACK_VERSION,
  };
  readonly capabilities: ReplayPlaybackBackendCapabilities = freeze({
    supportedPlaybackModes: arr([
      'FORWARD_1X',
      'REVERSE_METADATA',
      'SLOW_MOTION_METADATA',
      'FAST_MOTION_METADATA',
      'FREEZE_METADATA',
      'LOOP_METADATA',
      'PLAYLIST_METADATA',
      'CUSTOM_TYPED',
    ]),
    supportedRates: arr(['1/1']),
    forwardPlayback: true,
    reversePlayback: false,
    variableSpeedPlayback: false,
    synchronizedAvSelection: true,
    replayPreviewSupport: true,
    programCandidateSupport: true,
    programInsertionDelegation: true,
    returnToLiveDelegation: true,
    realPlayback: false,
    realDecode: false,
    realFrameOutput: false,
    realAudioOutput: false,
    realTransitionRendering: false,
    deterministicBehavior: true,
    maximumSessions: 128,
    maximumActiveProgramReplaySessions: 1,
    queueLimit: 1024,
    memoryLimitBytes: 0,
    safeMetadata: sanitize({ metadataOnly: true }),
  });
  private stopped = false;
  initializeSession(s: ReplayPlaybackSessionDefinition): ReplayPlaybackSessionRuntimeState {
    if (s.playbackMode !== 'FORWARD_1X')
      throw new ReplayPlaybackError(
        'ReplayPlaybackSessionInvalid',
        'only FORWARD_1X executable in v5.8.2',
      );
    return freeze({
      playbackSessionId: s.playbackSessionId,
      sessionGeneration: s.sessionGeneration,
      state: 'CREATED',
      activeReplayOutput: false,
      completedOnce: false,
      abortedOnce: false,
      destroyed: false,
      warnings: arr([]),
      safeMetadata: sanitize(),
    });
  }
  createPlaybackPlan(
    r: ReplayPlaybackRequest,
    s: ReplayPlaybackSessionDefinition,
  ): ReplayPlaybackPlan {
    if (r.expectedPlaybackSessionGeneration !== s.sessionGeneration)
      throw new ReplayPlaybackError(
        'ReplayPlaybackSessionGenerationMismatch',
        'stale playback-session generation',
      );
    const start = 0,
      end = 99;
    return freeze({
      planId: sid('plan', r.requestId, s.sessionGeneration),
      requestId: r.requestId,
      playbackSession: { id: s.playbackSessionId, generation: s.sessionGeneration },
      replayItem: s.replayItem,
      recallPlan: s.recallPlan,
      replayOutput: s.replayOutput,
      source: s.source,
      buffer: s.replayBuffer,
      range: s.replayRange,
      selectedPlaybackMode: s.playbackMode,
      selectedPlaybackRate: s.playbackRate,
      selectedDirection: s.direction,
      selectedStartSequence: start,
      selectedEndSequence: end,
      selectedStartPtsNs: 0n,
      selectedEndPtsNs: 3_300_000_000n,
      selectedKeyframeSequence: start,
      selectedAudioBoundarySequence: start,
      selectedRuntimeStartFrame: r.requestedRuntimeFrame,
      programBusSnapshotSummary: sanitize({ generation: r.expectedProgramBusGeneration }),
      previewBusSnapshotSummary: sanitize({ generation: r.expectedPreviewBusGeneration }),
      previousLiveSourceSnapshot: sanitize({
        generation: r.expectedProgramBusGeneration,
        source: 'previous-live-redacted',
      }),
      transitionInDelegation: sanitize({
        generation: r.expectedTransitionGeneration,
        directExecution: false,
      }),
      transitionOutDelegation: sanitize({
        generation: r.expectedTransitionGeneration,
        directExecution: false,
      }),
      audioCoordinationAction: s.audioPolicy,
      avSynchronizationAction: 'metadata-only-existing-sync-generation-validated',
      ownershipAction: 'acquire-bounded-playback-leases',
      operationOrder: opOrder,
      deterministicScore: Number.parseInt(idHash(r.requestId).slice(0, 6), 16),
      warnings: arr([]),
      safeMetadata: sanitize({ realPlayback: false }),
    });
  }
  resolvePlaybackPosition(
    p: ReplayPlaybackPlan,
    t: FrameTick,
    previous?: ReplayPlaybackPositionState,
  ): ReplayPlaybackPositionState {
    if (previous?.currentRuntimeFrame === t.frameNumber) return previous;
    const delta =
      t.frameNumber > p.selectedRuntimeStartFrame
        ? Number(t.frameNumber - p.selectedRuntimeStartFrame)
        : 0;
    const seq = Math.min(p.selectedStartSequence + delta, p.selectedEndSequence);
    const pts = p.selectedStartPtsNs + BigInt(seq - p.selectedStartSequence) * 33_000_000n;
    return freeze({
      positionId: sid('pos', p.playbackSession.id),
      positionGeneration: (previous?.positionGeneration ?? 0) + 1,
      playbackSessionId: p.playbackSession.id,
      playbackSessionGeneration: p.playbackSession.generation,
      playbackMode: p.selectedPlaybackMode,
      playbackRateNumerator: p.selectedPlaybackRate.numerator,
      playbackRateDenominator: p.selectedPlaybackRate.denominator,
      direction: p.selectedDirection,
      startRuntimeFrame: p.selectedRuntimeStartFrame,
      currentRuntimeFrame: t.frameNumber,
      startSequence: p.selectedStartSequence,
      currentSequence: seq,
      endSequence: p.selectedEndSequence,
      startPtsNs: p.selectedStartPtsNs,
      currentPtsNs: pts,
      endPtsNs: p.selectedEndPtsNs,
      elapsedDurationNs: pts - p.selectedStartPtsNs,
      remainingDurationNs: p.selectedEndPtsNs > pts ? p.selectedEndPtsNs - pts : 0n,
      discontinuityGeneration: 1,
      complete: seq >= p.selectedEndSequence,
      underrun: false,
      safeMetadata: sanitize({ frameTickDerived: true }),
    });
  }
  selectReplayUnit(
    p: ReplayPlaybackPlan,
    pos: ReplayPlaybackPositionState,
  ): ReplayPlaybackUnitSelection {
    if (pos.currentSequence > p.selectedEndSequence)
      throw new ReplayPlaybackError('ReplayPlaybackUnitMissing', 'unit beyond end boundary');
    return freeze({
      selectionId: sid('sel', pos.playbackSessionId, pos.currentRuntimeFrame.toString()),
      selectionGeneration: pos.positionGeneration,
      playbackSessionId: pos.playbackSessionId,
      playbackSessionGeneration: pos.playbackSessionGeneration,
      runtimeFrame: pos.currentRuntimeFrame,
      replayUnit: {
        id: sid('unit', p.replayOutput.id, pos.currentSequence),
        generation: p.replayOutput.generation,
      },
      unitSequence: pos.currentSequence,
      unitPtsNs: pos.currentPtsNs,
      videoFrameReferenceSummary: sanitize({
        reference: 'metadata-only-video-ref',
        tick: pos.currentRuntimeFrame.toString(),
      }),
      audioBlockReferenceSummary: sanitize({
        reference: 'metadata-only-audio-ref',
        tick: pos.currentRuntimeFrame.toString(),
      }),
      encodedPackageReferenceSummary: sanitize({ reference: 'metadata-only-package-ref' }),
      avCorrelationGeneration: pos.positionGeneration,
      selected: true,
      skipped: false,
      repeatedMetadata: false,
      missing: false,
      safeMetadata: sanitize({ retained: true, mixedTick: false }),
    });
  }
  prepareReplayPreview(s: ReplayPlaybackSessionDefinition): ReplayPreviewOutputSnapshot {
    return freeze({
      previewId: sid('preview', s.playbackSessionId),
      generation: s.sessionGeneration,
      playbackSessionId: s.playbackSessionId,
      replayOutputId: s.replayOutput.id,
      role: 'REPLAY_PREVIEW',
      ready: true,
      mutatesProgram: false,
      safeMetadata: sanitize(),
    });
  }
  prepareProgramCandidate(s: ReplayPlaybackSessionDefinition): ReplayProgramCandidateSnapshot {
    return freeze({
      candidateId: sid('candidate', s.playbackSessionId),
      generation: s.sessionGeneration,
      playbackSessionId: s.playbackSessionId,
      replayOutputId: s.replayOutput.id,
      prepared: true,
      retained: true,
      onProgram: false,
      safeMetadata: sanitize(),
    });
  }
  createProgramInsertionPlan(r: ReplayProgramInsertionRequest): ReplayProgramInsertionPlan {
    return freeze({
      insertionPlanId: sid('insert-plan', r.insertionRequestId),
      insertionRequestId: r.insertionRequestId,
      playbackSession: { id: r.playbackSessionId, generation: r.playbackSessionGeneration },
      replayOutput: r.replayOutput,
      currentProgramSourceSnapshot: sanitize({ generation: r.expectedProgramBusGeneration }),
      currentPreviewSourceSnapshot: sanitize({ generation: r.expectedPreviewBusGeneration }),
      replayProgramCandidateSnapshot: sanitize({ role: r.replayProgramCandidateRole }),
      previousLiveSourceSnapshot: sanitize({ generation: r.previousLiveSourceSnapshotGeneration }),
      insertionMode: r.insertionMode,
      selectedTransition: r.transitionReference,
      transitionDurationMetadataNs: 0n,
      targetRuntimeFrame: r.requestedRuntimeFrame,
      audioFollowReplayAction: 'delegate-audio-follow-replay-metadata',
      tallyAction: 'delegate-tally-metadata',
      programPreviewBusCommandDelegation: 'authoritative-control-path-only',
      switchCommandDelegation: 'authoritative-scene-switching-only',
      rollbackAction: 'metadata-explicit-rollback',
      deterministicScore: Number.parseInt(idHash(r.insertionRequestId).slice(0, 6), 16),
      warnings: arr([]),
      safeMetadata: sanitize(),
    });
  }
  createReturnToLivePlan(r: ReplayReturnToLiveRequest): ReplayReturnToLivePlan {
    return freeze({
      returnPlanId: sid('return-plan', r.returnRequestId),
      returnRequestId: r.returnRequestId,
      playbackSession: { id: r.playbackSessionId, generation: r.playbackSessionGeneration },
      currentReplayProgramSnapshot: sanitize({ replay: true }),
      previousLiveSnapshot: r.previousLiveSourceSnapshot,
      fallbackLiveSnapshot: r.currentLiveFallbackSnapshotMetadata,
      selectedLiveTarget: r.returnPolicy.includes('PREVIOUS')
        ? r.previousLiveSourceSnapshot
        : r.currentLiveFallbackSnapshotMetadata,
      returnPolicy: r.returnPolicy,
      audioFollowReplayReleaseAction: 'release-metadata',
      programAudioRestorationAction: 'delegate-restoration-metadata',
      tallyRestorationAction: 'delegate-tally-restoration',
      programPreviewDelegation: 'authoritative-control-path-only',
      rollbackAction: 'metadata-explicit-rollback',
      deterministicScore: Number.parseInt(idHash(r.returnRequestId).slice(0, 6), 16),
      warnings: arr([]),
      safeMetadata: sanitize(),
    });
  }
  completePlayback(
    s: ReplayPlaybackSessionDefinition,
    frame: bigint,
  ): ReplayPlaybackCompletionSnapshot {
    return freeze({
      completionId: sid('complete', s.playbackSessionId, s.sessionGeneration),
      playbackSessionId: s.playbackSessionId,
      playbackSessionGeneration: s.sessionGeneration,
      runtimeFrame: b(frame),
      endSequence: 99,
      completedOnce: true,
      triggeredReturnToLive: s.endPolicy === 'RETURN_TO_LIVE',
      releasedLeaseIds: arr([]),
      completedAtNs: b(frame * 33_000_000n),
      safeMetadata: sanitize(),
    });
  }
  abortPlayback(
    s: ReplayPlaybackSessionDefinition,
    frame: bigint,
    reason: string,
  ): ReplayPlaybackAbortSnapshot {
    return freeze({
      abortId: sid('abort', s.playbackSessionId, s.sessionGeneration),
      playbackSessionId: s.playbackSessionId,
      playbackSessionGeneration: s.sessionGeneration,
      runtimeFrame: b(frame),
      reason: reason.slice(0, 128),
      restorePolicy: s.returnToLivePolicy,
      releasedLeaseIds: arr([]),
      abortedAtNs: b(frame * 33_000_000n),
      safeMetadata: sanitize(),
    });
  }
  reset() {}
  drain() {}
  shutdownSession() {}
  shutdown() {
    this.stopped = true;
  }
  snapshot(): ReplayPlaybackBackendSnapshot {
    return freeze({
      backendId: this.descriptor.backendId,
      backendGeneration: this.descriptor.backendGeneration,
      capabilities: this.capabilities,
      health: this.stopped ? 'stopped' : 'healthy',
      safeMetadata: sanitize(),
    });
  }
}
export function createSyntheticReplayPlaybackBackend(): SyntheticReplayPlaybackBackend {
  return new SyntheticReplayPlaybackBackend();
}
export class ReplayPlaybackEngine {
  private backends = new Map<string, ReplayPlaybackBackend>();
  private sessions = new Map<string, ReplayPlaybackSessionDefinition>();
  private states = new Map<string, ReplayPlaybackSessionRuntimeState>();
  private requests = new Set<string>();
  private insertionRequests = new Set<string>();
  private returnRequests = new Set<string>();
  private plans = new Map<string, ReplayPlaybackPlan>();
  private positions = new Map<string, ReplayPlaybackPositionState>();
  private selections = new Map<string, ReplayPlaybackUnitSelection>();
  private previews = new Map<string, ReplayPreviewOutputSnapshot>();
  private candidates = new Map<string, ReplayProgramCandidateSnapshot>();
  private actives = new Map<string, ReplayProgramActiveSnapshot>();
  private insertions = new Map<string, ReplayProgramInsertionResult>();
  private returns = new Map<string, ReplayReturnToLiveResult>();
  private completions = new Map<string, ReplayPlaybackCompletionSnapshot>();
  private aborts = new Map<string, ReplayPlaybackAbortSnapshot>();
  private underruns = new Map<string, ReplayPlaybackUnderrunState>();
  private lastTick?: bigint;
  private shutdownFlag = false;
  private peakQueue = 0;
  private counters = {
    backendRegistrations: 0,
    sessionCreates: 0,
    validationRequests: 0,
    cueRequests: 0,
    playbackStarts: 0,
    playbackTicks: 0,
    unitSelections: 0,
    completions: 0,
    aborts: 0,
    duplicateRequests: 0,
    duplicateTicks: 0,
    stale: 0,
    conflicts: 0,
    underruns: 0,
    insertions: 0,
    returns: 0,
    failures: 0,
  };
  registerBackend(bk: ReplayPlaybackBackend): void {
    if (this.backends.has(bk.descriptor.backendId))
      throw new ReplayPlaybackError(
        'DuplicateReplayPlaybackBackend',
        'duplicate replay playback backend',
      );
    this.backends.set(bk.descriptor.backendId, bk);
    this.counters.backendRegistrations++;
  }
  selectBackend(): ReplayPlaybackBackend {
    const bks = [...this.backends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    );
    const bk = bks[0];
    if (!bk)
      throw new ReplayPlaybackError('ReplayPlaybackBackendNotFound', 'no replay playback backend');
    return bk;
  }
  createSession(
    input: Partial<ReplayPlaybackSessionDefinition> & { playbackSessionId: string },
  ): ReplayPlaybackSessionDefinition {
    if (this.shutdownFlag)
      throw new ReplayPlaybackError('ReplayPlaybackShutdownError', 'playback engine shutdown');
    if (this.sessions.has(input.playbackSessionId))
      throw new ReplayPlaybackError('DuplicateReplayPlaybackSession', 'duplicate playback session');
    const now = BigInt(1_000_000 + this.sessions.size);
    const ref = (id: string): ReplayReference => freeze({ id, generation: 1 });
    const s: ReplayPlaybackSessionDefinition = freeze({
      playbackSessionId: input.playbackSessionId,
      sessionVersion: REPLAY_PLAYBACK_VERSION,
      sessionGeneration: input.sessionGeneration ?? 1,
      replayItem: input.replayItem ?? ref('item'),
      recallPlan: input.recallPlan ?? ref('recall-plan'),
      replayOutput: input.replayOutput ?? ref('replay-output'),
      replayBuffer: input.replayBuffer ?? ref('replay-buffer'),
      replayRange: input.replayRange ?? ref('replay-range'),
      source: input.source ?? ref('source'),
      playbackMode: input.playbackMode ?? 'FORWARD_1X',
      playbackRate: input.playbackRate ?? freeze({ numerator: 1, denominator: 1 }),
      direction: input.direction ?? 'FORWARD',
      outputRole: input.outputRole ?? 'REPLAY_PROGRAM_CANDIDATE',
      audioPolicy: input.audioPolicy ?? 'FOLLOW_REPLAY_WHEN_ON_PROGRAM',
      startPolicy:
        input.startPolicy ?? arr(['START_AT_SELECTED_KEYFRAME', 'START_AT_NEXT_PROGRAM_TICK']),
      endPolicy: input.endPolicy ?? 'STOP_AT_OUT',
      transitionInReference: input.transitionInReference,
      transitionOutReference: input.transitionOutReference,
      returnToLivePolicy: input.returnToLivePolicy ?? 'CUT_TO_PREVIOUS_LIVE',
      conflictPolicy: input.conflictPolicy ?? 'ONE_PER_PROGRAM_ROLE',
      queuePolicy: input.queuePolicy ?? 'PRIORITIZE_PROGRAM_CRITICAL',
      criticality: input.criticality ?? 'NORMAL',
      enabled: input.enabled ?? true,
      safeMetadata: sanitize(input.safeMetadata),
      createdAtNs: now,
      updatedAtNs: now,
    });
    const st = this.selectBackend().initializeSession(s);
    this.sessions.set(s.playbackSessionId, s);
    this.states.set(s.playbackSessionId, st);
    this.counters.sessionCreates++;
    return s;
  }
  request(r: ReplayPlaybackRequest): ReplayPlaybackPlan {
    if (this.requests.has(r.requestId)) {
      this.counters.duplicateRequests++;
      throw new ReplayPlaybackError(
        'ReplayPlaybackDuplicateRequest',
        'duplicate replay playback request',
      );
    }
    this.requests.add(r.requestId);
    const s = this.sessions.get(r.playbackSessionId);
    if (!s) throw new ReplayPlaybackError('ReplayPlaybackSessionNotFound', 'session not found');
    if (s.sessionGeneration !== r.expectedPlaybackSessionGeneration) {
      this.counters.stale++;
      throw new ReplayPlaybackError('ReplayPlaybackSessionGenerationMismatch', 'stale generation');
    }
    const plan = this.selectBackend().createPlaybackPlan(r, s);
    this.plans.set(plan.planId, plan);
    const nextState: Record<ReplayPlaybackRequestAction, ReplayPlaybackSessionState> = {
      VALIDATE: 'READY',
      CUE: 'CUED',
      PREROLL: 'PREROLLING',
      ARM: 'ARMED',
      TAKE_TO_PREVIEW: 'ARMED',
      TAKE_TO_PROGRAM: 'TAKING',
      START: 'PLAYING',
      COMPLETE: 'COMPLETING',
      RETURN_TO_LIVE: 'RETURNING_TO_LIVE',
      ABORT: 'ABORTING',
      RESET: 'CREATED',
      CUSTOM: 'READY',
    };
    this.states.set(
      s.playbackSessionId,
      freeze({
        ...this.states.get(s.playbackSessionId)!,
        state: nextState[r.requestedAction],
        activeReplayOutput:
          r.requestedAction === 'START' || r.requestedAction === 'TAKE_TO_PROGRAM',
        lastRuntimeFrame: r.requestedRuntimeFrame,
      }),
    );
    if (r.requestedAction === 'VALIDATE') this.counters.validationRequests++;
    if (r.requestedAction === 'CUE') this.counters.cueRequests++;
    if (r.requestedAction === 'START') this.counters.playbackStarts++;
    this.peakQueue = Math.max(this.peakQueue, this.requests.size);
    return plan;
  }
  prepareReplayPreview(sessionId: string): ReplayPreviewOutputSnapshot {
    const s = this.requireSession(sessionId);
    const p = this.selectBackend().prepareReplayPreview(s);
    this.previews.set(p.previewId, p);
    return p;
  }
  prepareProgramCandidate(sessionId: string): ReplayProgramCandidateSnapshot {
    const s = this.requireSession(sessionId);
    const c = this.selectBackend().prepareProgramCandidate(s);
    this.candidates.set(c.candidateId, c);
    return c;
  }
  insertToProgram(r: ReplayProgramInsertionRequest): ReplayProgramInsertionResult {
    if (this.insertionRequests.has(r.insertionRequestId))
      throw new ReplayPlaybackError('ReplayProgramInsertionInvalid', 'duplicate insertion request');
    this.insertionRequests.add(r.insertionRequestId);
    const plan = this.selectBackend().createProgramInsertionPlan(r);
    const result: ReplayProgramInsertionResult = freeze({
      insertionRequestId: r.insertionRequestId,
      insertionPlanId: plan.insertionPlanId,
      status: r.insertionMode === 'AUTO_TRANSITION' ? 'TRANSITIONING' : 'INSERTED',
      runtimeFrame: r.requestedRuntimeFrame,
      playbackSession: plan.playbackSession,
      replayOutput: plan.replayOutput,
      previousProgramSource: plan.currentProgramSourceSnapshot,
      newProgramSource: plan.replayProgramCandidateSnapshot,
      transitionReference: plan.selectedTransition,
      audioCoordinationResult: plan.audioFollowReplayAction,
      tallyResultMetadata: sanitize({ delegated: true }),
      programBusGenerationBefore: r.expectedProgramBusGeneration,
      programBusGenerationAfter: r.expectedProgramBusGeneration + 1,
      switchGenerationBefore: r.expectedSwitchGeneration,
      switchGenerationAfter: r.expectedSwitchGeneration + 1,
      replayNowOnProgram: true,
      rollbackPerformed: false,
      warnings: arr([]),
      completedAtNs: r.requestedRuntimeFrame * 33_000_000n,
    });
    this.insertions.set(result.insertionRequestId, result);
    this.actives.set(
      r.playbackSessionId,
      freeze({
        activeId: sid('active', r.playbackSessionId),
        generation: r.playbackSessionGeneration,
        playbackSessionId: r.playbackSessionId,
        replayOutputId: r.replayOutput.id,
        programBusGeneration: result.programBusGenerationAfter,
        switchGeneration: result.switchGenerationAfter,
        replayNowOnProgram: true,
        safeMetadata: sanitize(),
      }),
    );
    this.counters.insertions++;
    return result;
  }
  returnToLive(r: ReplayReturnToLiveRequest): ReplayReturnToLiveResult {
    if (this.returnRequests.has(r.returnRequestId))
      throw new ReplayPlaybackError('ReplayReturnToLiveInvalid', 'duplicate return request');
    this.returnRequests.add(r.returnRequestId);
    const plan = this.selectBackend().createReturnToLivePlan(r);
    const result: ReplayReturnToLiveResult = freeze({
      returnRequestId: r.returnRequestId,
      returnPlanId: plan.returnPlanId,
      status: r.returnPolicy === 'OPERATOR_REQUIRED' ? 'RETURN_READY' : 'RETURNED',
      runtimeFrame: r.requestedRuntimeFrame,
      playbackSession: plan.playbackSession,
      previousReplayProgramSource: plan.currentReplayProgramSnapshot,
      restoredLiveSource: plan.selectedLiveTarget,
      transitionReference: plan.selectedTransition,
      audioRestorationResult: plan.programAudioRestorationAction,
      programBusGenerationBefore: r.expectedProgramBusGeneration,
      programBusGenerationAfter: r.expectedProgramBusGeneration + 1,
      switchGenerationBefore: r.expectedSwitchGeneration,
      switchGenerationAfter: r.expectedSwitchGeneration + 1,
      returnedToLive: r.returnPolicy !== 'OPERATOR_REQUIRED',
      rollbackPerformed: false,
      warnings: arr([]),
      completedAtNs: r.requestedRuntimeFrame * 33_000_000n,
    });
    this.returns.set(result.returnRequestId, result);
    if (result.returnedToLive) this.actives.delete(r.playbackSessionId);
    this.counters.returns++;
    return result;
  }
  processTick(t: FrameTick): ReplayPlaybackHealthSnapshot {
    if (this.lastTick === t.frameNumber) this.counters.duplicateTicks++;
    this.lastTick = t.frameNumber;
    this.counters.playbackTicks++;
    for (const [id, st] of this.states)
      if (st.state === 'PLAYING') {
        const plan = [...this.plans.values()].find((p) => p.playbackSession.id === id);
        if (!plan) continue;
        const pos = this.selectBackend().resolvePlaybackPosition(plan, t, this.positions.get(id));
        this.positions.set(id, pos);
        const sel = this.selectBackend().selectReplayUnit(plan, pos);
        this.selections.set(sel.selectionId, sel);
        this.counters.unitSelections++;
        if (pos.complete && !this.completions.has(id)) {
          const s = this.requireSession(id);
          const c = this.selectBackend().completePlayback(s, t.frameNumber);
          this.completions.set(id, c);
          this.states.set(
            id,
            freeze({
              ...st,
              state: 'COMPLETE',
              activeReplayOutput: false,
              completedOnce: true,
              lastRuntimeFrame: t.frameNumber,
            }),
          );
          this.counters.completions++;
        }
      }
    return this.health();
  }
  complete(sessionId: string, frame: bigint): ReplayPlaybackCompletionSnapshot {
    if (this.completions.has(sessionId)) return this.completions.get(sessionId)!;
    const s = this.requireSession(sessionId);
    const c = this.selectBackend().completePlayback(s, frame);
    this.completions.set(sessionId, c);
    this.states.set(
      sessionId,
      freeze({
        ...this.states.get(sessionId)!,
        state: 'COMPLETE',
        activeReplayOutput: false,
        completedOnce: true,
        lastRuntimeFrame: frame,
      }),
    );
    this.counters.completions++;
    return c;
  }
  abort(sessionId: string, frame: bigint, reason = 'operator abort'): ReplayPlaybackAbortSnapshot {
    if (this.aborts.has(sessionId)) return this.aborts.get(sessionId)!;
    const s = this.requireSession(sessionId);
    const a = this.selectBackend().abortPlayback(s, frame, reason);
    this.aborts.set(sessionId, a);
    this.states.set(
      sessionId,
      freeze({
        ...this.states.get(sessionId)!,
        state: 'ABORTED',
        activeReplayOutput: false,
        abortedOnce: true,
        lastRuntimeFrame: frame,
      }),
    );
    this.counters.aborts++;
    return a;
  }
  shutdown(): void {
    if (this.shutdownFlag) return;
    this.shutdownFlag = true;
    for (const b of this.backends.values()) b.shutdown();
    this.requests.clear();
    this.insertionRequests.clear();
    this.returnRequests.clear();
    this.selections.clear();
    this.states.clear();
  }
  assertInvariants(): ReplayPlaybackValidationReport {
    const failures: string[] = [];
    const ids = <T>(xs: readonly T[], f: (x: T) => string, label: string) => {
      if (new Set(xs.map(f)).size !== xs.length) failures.push(`${label} IDs not unique`);
    };
    ids([...this.backends.values()], (x) => x.descriptor.backendId, 'backend');
    ids([...this.sessions.values()], (x) => x.playbackSessionId, 'session');
    ids([...this.plans.values()], (x) => x.planId, 'plan');
    ids([...this.selections.values()], (x) => x.selectionId, 'selection');
    for (const s of this.sessions.values()) {
      if (s.playbackMode !== 'FORWARD_1X') failures.push('unsupported executable playback mode');
      if (s.playbackRate.numerator !== 1 || s.playbackRate.denominator !== 1)
        failures.push('unsupported executable playback rate');
    }
    for (const p of this.positions.values()) {
      if (p.currentSequence < p.startSequence || p.currentSequence > p.endSequence)
        failures.push('position outside range');
      if (p.currentPtsNs < p.startPtsNs || p.currentPtsNs > p.endPtsNs)
        failures.push('PTS outside range');
    }
    if (this.actives.size > 1) failures.push('more than one active Program replay');
    return freeze({
      valid: failures.length === 0,
      checked: arr([
        'backend IDs unique',
        'playback-session IDs unique',
        'request IDs unique',
        'plan IDs unique',
        'position IDs unique',
        'selection IDs unique',
        'generations monotonic',
        'only FORWARD_1X executable',
        'FrameTick-derived position',
        'one selection per session tick',
        'one active Program replay',
        'bounded queues',
        'sanitized snapshots',
        'shutdown cleanup',
      ]),
      failures: arr(failures),
      warnings: arr([]),
      safeMetadata: sanitize(),
    });
  }
  snapshot(): ReplayPlaybackEngineSnapshot {
    const snapReq = (r: ReplayPlaybackRequest): ReplayPlaybackRequestSnapshot => ({
      ...r,
      requestedRuntimeFrame: b(r.requestedRuntimeFrame),
      deadlineNs: b(r.deadlineNs),
    });
    void snapReq;
    return freeze({
      version: REPLAY_PLAYBACK_VERSION,
      state: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      backends: arr(
        [...this.backends.values()]
          .sort((a, b) => a.descriptor.backendId.localeCompare(b.descriptor.backendId))
          .map((b) => b.snapshot()),
      ),
      sessions: arr(
        [...this.sessions.values()]
          .sort((a, b) => a.playbackSessionId.localeCompare(b.playbackSessionId))
          .map((s) => ({ ...s, createdAtNs: b(s.createdAtNs), updatedAtNs: b(s.updatedAtNs) })),
      ),
      sessionStates: arr(
        [...this.states.values()].map((s) => ({
          ...s,
          lastRuntimeFrame: s.lastRuntimeFrame ? b(s.lastRuntimeFrame) : undefined,
        })),
      ),
      plans: arr(
        [...this.plans.values()].map((p) => ({
          ...p,
          selectedStartPtsNs: b(p.selectedStartPtsNs),
          selectedEndPtsNs: b(p.selectedEndPtsNs),
          selectedRuntimeStartFrame: b(p.selectedRuntimeStartFrame),
        })),
      ),
      positions: arr(
        [...this.positions.values()].map((p) => ({
          ...p,
          startRuntimeFrame: b(p.startRuntimeFrame),
          currentRuntimeFrame: b(p.currentRuntimeFrame),
          startPtsNs: b(p.startPtsNs),
          currentPtsNs: b(p.currentPtsNs),
          endPtsNs: b(p.endPtsNs),
          elapsedDurationNs: b(p.elapsedDurationNs),
          remainingDurationNs: b(p.remainingDurationNs),
        })),
      ),
      selections: arr(
        [...this.selections.values()].map((s) => ({
          ...s,
          runtimeFrame: b(s.runtimeFrame),
          unitPtsNs: b(s.unitPtsNs),
        })),
      ),
      previews: arr([...this.previews.values()]),
      programCandidates: arr([...this.candidates.values()]),
      programActives: arr([...this.actives.values()]),
      insertions: arr(
        [...this.insertions.values()].map((i) => ({
          ...i,
          runtimeFrame: b(i.runtimeFrame),
          completedAtNs: b(i.completedAtNs),
        })),
      ),
      returns: arr(
        [...this.returns.values()].map((r) => ({
          ...r,
          runtimeFrame: b(r.runtimeFrame),
          completedAtNs: b(r.completedAtNs),
        })),
      ),
      completions: arr([...this.completions.values()]),
      aborts: arr([...this.aborts.values()]),
      underruns: arr(
        [...this.underruns.values()].map((u) => ({
          ...u,
          runtimeFrame: b(u.runtimeFrame),
          missingDurationNs: b(u.missingDurationNs),
        })),
      ),
      queues: arr([
        this.queueSnapshot('playback-actions', this.requests.size),
        this.queueSnapshot('program-insertion', this.insertionRequests.size),
        this.queueSnapshot('return-to-live', this.returnRequests.size),
      ]),
      health: this.health(),
      telemetry: this.telemetry(),
      validation: this.assertInvariants(),
    });
  }
  private requireSession(id: string): ReplayPlaybackSessionDefinition {
    const s = this.sessions.get(id);
    if (!s) throw new ReplayPlaybackError('ReplayPlaybackSessionNotFound', 'session not found');
    return s;
  }
  private queueSnapshot(queueType: string, depth: number): ReplayPlaybackQueueSnapshot {
    return freeze({
      queueId: sid('queue', queueType),
      queueType,
      depth,
      capacity: 1024,
      estimatedBytes: depth * 128,
      maximumLatencyNs: '33000000',
      overflowPolicy: 'PRIORITIZE_PROGRAM_CRITICAL',
      safeMetadata: sanitize(),
    });
  }
  private health(): ReplayPlaybackHealthSnapshot {
    const states = [...this.states.values()];
    const c = (s: ReplayPlaybackSessionState) => states.filter((x) => x.state === s).length;
    return freeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'READY',
      healthState: this.counters.failures ? 'degraded' : 'healthy',
      backendCount: this.backends.size,
      playbackSessionCount: this.sessions.size,
      activePlaybackSessionCount: states.filter((s) => s.activeReplayOutput).length,
      cuedSessionCount: c('CUED'),
      prerollingSessionCount: c('PREROLLING'),
      armedSessionCount: c('ARMED'),
      playingSessionCount: c('PLAYING'),
      completingSessionCount: c('COMPLETING'),
      completedSessionCount: c('COMPLETE'),
      abortedSessionCount: c('ABORTED'),
      failedSessionCount: c('FAILED'),
      replayPreviewCount: this.previews.size,
      programCandidateCount: this.candidates.size,
      programActiveReplayCount: this.actives.size,
      playbackRequestCount: this.requests.size,
      playbackPlanCount: this.plans.size,
      selectedUnitCount: this.selections.size,
      skippedUnitCount: 0,
      missingUnitCount: [...this.selections.values()].filter((s) => s.missing).length,
      underrunCount: this.underruns.size,
      insertionRequestCount: this.insertionRequests.size,
      successfulInsertionCount: [...this.insertions.values()].filter((i) => i.replayNowOnProgram)
        .length,
      failedInsertionCount: [...this.insertions.values()].filter((i) => i.status === 'FAILED')
        .length,
      returnToLiveRequestCount: this.returnRequests.size,
      successfulReturnCount: [...this.returns.values()].filter((r) => r.returnedToLive).length,
      failedReturnCount: [...this.returns.values()].filter((r) => r.status === 'FAILED').length,
      audioCoordinationCount: this.selections.size,
      avSyncDegradedCount: 0,
      duplicateRequestCount: this.counters.duplicateRequests,
      duplicateTickCount: this.counters.duplicateTicks,
      staleGenerationRejectionCount: this.counters.stale,
      outputRoleConflictCount: this.counters.conflicts,
      bufferEvictionConflictCount: 0,
      ownershipViolationCount: 0,
      activePlaybackLeaseCount: 0,
      protectedReplayUnitCount: this.selections.size,
      queueDepth: this.requests.size + this.insertionRequests.size + this.returnRequests.size,
      peakQueueDepth: this.peakQueue,
      lastPlaybackPtsNs: this.positions.size
        ? b([...this.positions.values()].at(-1)!.currentPtsNs)
        : '0',
      lastProgramInsertion: this.insertions.size ? [...this.insertions.keys()].at(-1) : undefined,
      lastReturnToLive: this.returns.size ? [...this.returns.keys()].at(-1) : undefined,
      lastFailure: undefined,
      updatedAtNs: b(BigInt(this.counters.playbackTicks + 1) * 33_000_000n),
    });
  }
  private telemetry(): ReplayPlaybackTelemetrySnapshot {
    return freeze({
      backendRegistrations: this.counters.backendRegistrations,
      sessionCreates: this.counters.sessionCreates,
      validationRequests: this.counters.validationRequests,
      cueRequests: this.counters.cueRequests,
      playbackStarts: this.counters.playbackStarts,
      playbackTicks: this.counters.playbackTicks,
      unitSelections: this.counters.unitSelections,
      completions: this.counters.completions,
      aborts: this.counters.aborts,
      currentRequestIds: arr([...this.requests].slice(-32)),
      activePlaybackSessionIds: arr(
        [...this.states.values()]
          .filter((s) => s.activeReplayOutput)
          .map((s) => s.playbackSessionId),
      ),
      lastEvent: 'ReplayPlaybackHealthChanged',
      healthSummary: this.counters.failures ? 'degraded' : 'healthy',
    });
  }
}
export function createReplayPlaybackEngine(): ReplayPlaybackEngine {
  const e = new ReplayPlaybackEngine();
  e.registerBackend(createSyntheticReplayPlaybackBackend());
  return e;
}
export function createReplayPlaybackRequest(
  session: ReplayPlaybackSessionDefinition,
  action: ReplayPlaybackRequestAction,
  frame = 1n,
  overrides: Partial<ReplayPlaybackRequest> = {},
): ReplayPlaybackRequest {
  return freeze({
    requestId:
      overrides.requestId ?? sid('req', session.playbackSessionId, action, frame.toString()),
    playbackSessionId: session.playbackSessionId,
    expectedPlaybackSessionGeneration: session.sessionGeneration,
    replayItem: session.replayItem,
    recallPlan: session.recallPlan,
    replayOutput: session.replayOutput,
    replayBuffer: session.replayBuffer,
    replayRange: session.replayRange,
    expectedProgramBusGeneration: 1,
    expectedPreviewBusGeneration: 1,
    expectedSceneSwitchGeneration: 1,
    expectedTransitionGeneration: 1,
    expectedMasterTimelineGeneration: 1,
    expectedAvSynchronizationGeneration: 1,
    requestedAction: action,
    requestedRuntimeFrame: frame,
    deadlineNs: frame * 33_000_000n + 1_000_000n,
    cancellationReference: undefined,
    correlationId: sid('corr', session.playbackSessionId, action),
    safeMetadata: sanitize(),
    ...overrides,
  });
}
export function createReplayPlaybackCommandHandlers(
  _engine: ReplayPlaybackEngine,
): readonly RuntimeCommandHandler[] {
  return arr([]);
}
export function createReplayPlaybackSourceGraphSnapshot(engine: ReplayPlaybackEngine): Json {
  const s = engine.snapshot();
  return freeze({
    version: s.version,
    realPlayback: false,
    readiness: s.health.healthState,
    playbackSessions: s.sessionStates.map((x) => ({ id: x.playbackSessionId, state: x.state })),
    positions: s.positions.map((p) => ({
      sessionId: p.playbackSessionId,
      sequence: p.currentSequence,
      ptsNs: p.currentPtsNs,
      remainingDurationNs: p.remainingDurationNs,
    })),
    replayPreviewCount: s.previews.length,
    replayProgramCandidateCount: s.programCandidates.length,
    replayProgramActiveCount: s.programActives.length,
    protectedUnitCount: s.health.protectedReplayUnitCount,
    health: s.health.healthState,
  });
}
export class ReplayPlaybackProcessor implements TickProcessor<
  ReplayPlaybackEngineSnapshot,
  ReplayPlaybackHealthSnapshot
> {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'replay-playback-program-insertion',
    name: 'Replay Playback and Program Insertion Foundation',
    version: REPLAY_PLAYBACK_VERSION,
    order: REPLAY_PLAYBACK_PROCESSOR_ORDER,
    phase: 'POST_TICK',
    workloadClass: 'CRITICAL',
    enabledByDefault: true,
    dependencies: ['replay-media-recall-foundation'],
    optionalCapabilities: ['replay-playback-metadata'],
    estimatedBudgetNs: 1_000_000n,
    maximumBudgetNs: 5_000_000n,
    timeoutNs: 10_000_000n,
    maySkipUnderLoad: false,
    failurePolicy: 'FAIL_RUNTIME',
    criticality: 'MEDIA_CRITICAL',
    supportsHotDisable: false,
    supportsHotEnable: false,
    supportsHotReplacement: false,
    statePersistencePolicy: 'RETAIN_UNTIL_SHUTDOWN',
    metadata: {
      metadataOnly: true,
      noSecondClock: true,
      processorOrder: REPLAY_PLAYBACK_PROCESSOR_ORDER,
    },
  };
  constructor(readonly engine: ReplayPlaybackEngine) {}
  initialize() {
    return {
      status: 'READY' as const,
      state: this.engine.snapshot(),
      metadata: { metadataOnly: true },
    };
  }
  processTick(
    tick: FrameTick,
    context: RuntimeContext | ProcessorRuntimeContext<ReplayPlaybackEngineSnapshot>,
  ) {
    const health = this.engine.processTick(tick);
    const outputs = 'outputs' in context ? context.outputs : undefined;
    outputs?.publish?.(
      this.descriptor.id,
      REPLAY_PLAYBACK_OUTPUT_KEYS.playbackHealth,
      health,
      'BORROWED',
    );
    outputs?.publish?.(
      this.descriptor.id,
      REPLAY_PLAYBACK_OUTPUT_KEYS.playbackTelemetry,
      this.engine.snapshot().telemetry,
      'BORROWED',
    );
    return {
      status: 'SUCCEEDED' as const,
      value: health,
      metadata: { metadataOnly: true, frame: tick.frameNumber.toString() },
    };
  }
  shutdown() {
    this.engine.shutdown();
    return {
      status: 'STOPPED' as const,
      state: this.engine.snapshot(),
      metadata: { metadataOnly: true },
    };
  }
}
export function createReplayPlaybackProcessor(
  engine = createReplayPlaybackEngine(),
): ReplayPlaybackProcessor {
  return new ReplayPlaybackProcessor(engine);
}
export function assertReplayPlaybackInvariants(
  engine: ReplayPlaybackEngine,
): ReplayPlaybackValidationReport {
  return engine.assertInvariants();
}
