import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommand,
  RuntimeCommandHandler,
  RuntimeContext,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';

export const REPLAY_VARIABLE_SPEED_VERSION = '5.8.3';
export const REPLAY_VARIABLE_SPEED_PROCESSOR_ORDER = 1130;
export const REPLAY_VARIABLE_SPEED_OUTPUT_KEYS = {
  playbackRates: 'replay.speed.playbackRates',
  speedProfiles: 'replay.speed.profiles',
  sourceMotionCapabilities: 'replay.speed.sourceCapabilities',
  slowMotionReadiness: 'replay.speed.readiness',
  variableSpeedRequests: 'replay.speed.requests',
  variableSpeedPlans: 'replay.speed.plans',
  variableSpeedResults: 'replay.speed.results',
  speedRamps: 'replay.speed.ramps',
  rateChangePoints: 'replay.speed.rateChangePoints',
  clockMappings: 'replay.speed.clockMappings',
  positions: 'replay.speed.positions',
  frameSelectionRequests: 'replay.speed.frameSelectionRequests',
  frameSelectionPlans: 'replay.speed.frameSelectionPlans',
  cadenceStates: 'replay.speed.cadenceStates',
  freezeStates: 'replay.speed.freezeStates',
  reverseStates: 'replay.speed.reverseStates',
  audioStates: 'replay.speed.audioStates',
  avSyncStates: 'replay.speed.avSyncStates',
  durationStates: 'replay.speed.durationStates',
  lookaheadPolicies: 'replay.speed.lookaheadPolicies',
  protectionStates: 'replay.speed.protectionStates',
  programEligibility: 'replay.speed.programEligibility',
  configurationTransactions: 'replay.speed.transactions',
  engineHealth: 'replay.speed.health',
  telemetry: 'replay.speed.telemetry',
  backendHealth: 'replay.speed.backendHealth',
  failedResults: 'replay.speed.failedResults',
} as const;
export const REPLAY_VARIABLE_SPEED_COMMAND_TYPES = [
  'REPLAY_SPEED_REGISTER_BACKEND',
  'REPLAY_SPEED_UNREGISTER_BACKEND',
  'REPLAY_SPEED_REGISTER_PROFILE',
  'REPLAY_SPEED_UPDATE_PROFILE',
  'REPLAY_SPEED_REMOVE_PROFILE',
  'REPLAY_SPEED_REGISTER_SOURCE_CAPABILITY',
  'REPLAY_SPEED_UPDATE_SOURCE_CAPABILITY',
  'REPLAY_SPEED_CREATE_RATE',
  'REPLAY_SPEED_SET_RATE',
  'REPLAY_SPEED_SET_DIRECTION',
  'REPLAY_SPEED_APPLY_PROFILE',
  'REPLAY_SPEED_CREATE_RAMP',
  'REPLAY_SPEED_START_RAMP',
  'REPLAY_SPEED_CANCEL_RAMP',
  'REPLAY_SPEED_FREEZE_METADATA',
  'REPLAY_SPEED_RESUME',
  'REPLAY_SPEED_RESET_TO_1X',
  'REPLAY_SPEED_SET_VIDEO_STRATEGY',
  'REPLAY_SPEED_SET_AUDIO_STRATEGY',
  'REPLAY_SPEED_SET_LOOKAHEAD_POLICY',
  'REPLAY_SPEED_EVALUATE_READINESS',
  'REPLAY_SPEED_EVALUATE_PROGRAM_ELIGIBILITY',
  'REPLAY_SPEED_DRAIN',
  'REPLAY_SPEED_RESET',
  'REPLAY_SPEED_RECONFIGURE',
  'REPLAY_SPEED_CLEAR_PLAN_CACHE',
  'REPLAY_SPEED_VALIDATE',
  'REPLAY_SPEED_SHUTDOWN',
] as const;
export type ReplayVariableSpeedCommandType = (typeof REPLAY_VARIABLE_SPEED_COMMAND_TYPES)[number];
export const REPLAY_VARIABLE_SPEED_EVENTS = [
  'ReplayVariableSpeedEngineCreated',
  'ReplayVariableSpeedBackendRegistered',
  'ReplayVariableSpeedBackendRemoved',
  'ReplaySpeedProfileRegistered',
  'ReplaySpeedProfileUpdated',
  'ReplaySourceMotionCapabilityRegistered',
  'ReplayVariableSpeedRequested',
  'ReplayVariableSpeedPlanned',
  'ReplayVariableSpeedAppliedMetadata',
  'ReplaySpeedRampCreated',
  'ReplaySpeedRampStarted',
  'ReplaySpeedRampCompleted',
  'ReplaySpeedRampCancelled',
  'ReplayPlaybackRateChanged',
  'ReplayPlaybackDirectionChangedMetadata',
  'ReplayFrameSelectionPlanned',
  'ReplayCadenceChanged',
  'ReplaySlowMotionReadinessChanged',
  'ReplayVariableSpeedAudioChanged',
  'ReplayVariableSpeedAvSyncChanged',
  'ReplayVariableSpeedProgramEligibilityChanged',
  'ReplayFreezeActivatedMetadata',
  'ReplayFreezeReleasedMetadata',
  'ReplayVariableSpeedDegraded',
  'ReplayVariableSpeedFailed',
  'ReplayVariableSpeedHealthChanged',
  'ReplayVariableSpeedEngineShutdown',
] as const;
export const REPLAY_VARIABLE_SPEED_WATCHDOG_INCIDENTS = [
  'REPLAY_SPEED_ENGINE_STALLED',
  'REPLAY_SPEED_REQUEST_TIMEOUT',
  'REPLAY_SPEED_DUPLICATE_REQUEST',
  'REPLAY_SPEED_DUPLICATE_TICK',
  'REPLAY_SPEED_SESSION_GENERATION_STALE',
  'REPLAY_SPEED_PROFILE_GENERATION_STALE',
  'REPLAY_SPEED_RAMP_GENERATION_STALE',
  'REPLAY_SPEED_POSITION_GENERATION_STALE',
  'REPLAY_SPEED_BUFFER_GENERATION_STALE',
  'REPLAY_SPEED_RANGE_GENERATION_STALE',
  'REPLAY_SPEED_TIMELINE_GENERATION_STALE',
  'REPLAY_SPEED_SOURCE_CAPABILITY_GENERATION_STALE',
  'REPLAY_SPEED_RATE_INVALID',
  'REPLAY_SPEED_DIRECTION_UNSUPPORTED',
  'REPLAY_SPEED_VIDEO_STRATEGY_UNSUPPORTED',
  'REPLAY_SPEED_AUDIO_STRATEGY_UNSUPPORTED',
  'REPLAY_SPEED_SOURCE_FRAME_DENSITY_INSUFFICIENT',
  'REPLAY_SPEED_KEYFRAME_COVERAGE_INSUFFICIENT',
  'REPLAY_SPEED_LOOKAHEAD_INSUFFICIENT',
  'REPLAY_SPEED_INTERPOLATION_REQUIRED',
  'REPLAY_SPEED_OPTICAL_FLOW_REQUIRED',
  'REPLAY_SPEED_AUDIO_TIME_STRETCH_REQUIRED',
  'REPLAY_SPEED_PITCH_PRESERVATION_REQUIRED',
  'REPLAY_SPEED_REVERSE_DECODE_REQUIRED',
  'REPLAY_SPEED_PROGRAM_OUTPUT_INELIGIBLE',
  'REPLAY_SPEED_ACTIVE_UNIT_EVICTION_ATTEMPT',
  'REPLAY_SPEED_BUFFER_PRESSURE_CRITICAL',
  'REPLAY_SPEED_QUEUE_OVERFLOW',
  'REPLAY_SPEED_BACKEND_FAILED',
  'REPLAY_SPEED_OWNERSHIP_VIOLATION',
  'REPLAY_SPEED_OUTPUT_REGISTRY_MISMATCH',
  'REPLAY_SPEED_SOURCE_GRAPH_MISMATCH',
  'REPLAY_SPEED_INVARIANT_FAILURE',
] as const;
export type ReplayPlaybackDirection =
  'FORWARD' | 'REVERSE_METADATA' | 'PING_PONG_METADATA' | 'CUSTOM';
export type ReplayPlaybackRateClass =
  | 'FREEZE_METADATA'
  | 'ULTRA_SLOW_METADATA'
  | 'SLOW_MOTION_METADATA'
  | 'NORMAL'
  | 'FAST_MOTION_METADATA'
  | 'ULTRA_FAST_METADATA'
  | 'CUSTOM';
export type ReplayVideoStrategy =
  | 'EXACT_SOURCE_FRAME'
  | 'NEAREST_FRAME'
  | 'PREVIOUS_FRAME'
  | 'NEXT_FRAME'
  | 'REPEAT_FRAME_METADATA'
  | 'DROP_FRAME_METADATA'
  | 'FRAME_BLEND_REQUIRED'
  | 'INTERPOLATION_REQUIRED'
  | 'OPTICAL_FLOW_REQUIRED'
  | 'HIGH_FRAME_RATE_NATIVE_METADATA'
  | 'CUSTOM';
export type ReplayAudioStrategy =
  | 'FOLLOW_AT_1X'
  | 'MUTE_AT_NONSTANDARD_RATE'
  | 'CONTINUE_PROGRAM_AUDIO_METADATA'
  | 'TIME_STRETCH_REQUIRED'
  | 'PITCH_PRESERVATION_REQUIRED'
  | 'RESAMPLE_REQUIRED'
  | 'REVERSE_AUDIO_REQUIRED'
  | 'AUDIO_ONLY_RATE_METADATA'
  | 'OPERATOR_CONTROLLED'
  | 'CUSTOM';
export type ReplayRateChangePolicy =
  | 'FIXED_FOR_SESSION'
  | 'CHANGE_AT_NEXT_TICK'
  | 'CHANGE_AT_NEXT_SOURCE_FRAME'
  | 'CHANGE_AT_NEXT_KEYFRAME'
  | 'CHANGE_AT_MARKER'
  | 'RAMP_OVER_TICKS'
  | 'RAMP_OVER_SOURCE_DURATION'
  | 'OPERATOR_REQUIRED'
  | 'CUSTOM';
export type ReplayRampInterpolationMode =
  | 'STEP'
  | 'LINEAR_RATIONAL'
  | 'EASE_IN_METADATA'
  | 'EASE_OUT_METADATA'
  | 'EASE_IN_OUT_METADATA'
  | 'CUSTOM';
export type ReplaySpeedRampState =
  'CREATED' | 'VALIDATED' | 'SCHEDULED' | 'ACTIVE_METADATA' | 'COMPLETE' | 'CANCELLED' | 'FAILED';
export type ReplayCadenceType =
  | 'ONE_TO_ONE'
  | 'FRAME_REPEAT_METADATA'
  | 'FRAME_DROP_METADATA'
  | 'MIXED_REPEAT_DROP_METADATA'
  | 'INTERPOLATION_REQUIRED'
  | 'HFR_NATIVE_METADATA'
  | 'CUSTOM';
export type ReplayVariableSpeedResultStatus =
  | 'VALIDATED'
  | 'SCHEDULED'
  | 'APPLIED_METADATA'
  | 'RAMP_ACTIVE_METADATA'
  | 'RAMP_COMPLETE'
  | 'RESET_TO_1X'
  | 'DEGRADED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED';
export type JsonSafe =
  string | number | boolean | null | readonly JsonSafe[] | { readonly [k: string]: JsonSafe };
export type SafeMetadata = Readonly<Record<string, JsonSafe>>;
export interface ReplayPlaybackRate {
  readonly rateId: string;
  readonly rateVersion: string;
  readonly rateGeneration: number;
  readonly numerator: number;
  readonly denominator: number;
  readonly normalizedNumerator: number;
  readonly normalizedDenominator: number;
  readonly decimalSummaryMetadata: string;
  readonly direction: ReplayPlaybackDirection;
  readonly rateClass: ReplayPlaybackRateClass;
  readonly executableCapability: boolean;
  readonly videoStrategy: ReplayVideoStrategy;
  readonly audioStrategy: ReplayAudioStrategy;
  readonly safeMetadata: SafeMetadata;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
}
export type ReplayPlaybackRateSnapshot = Omit<ReplayPlaybackRate, 'createdAtNs' | 'updatedAtNs'> & {
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
};
export interface ReplaySpeedProfile {
  readonly speedProfileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly displayName: string;
  readonly defaultRate: ReplayPlaybackRate;
  readonly allowedRates: readonly ReplayPlaybackRate[];
  readonly allowedDirections: readonly ReplayPlaybackDirection[];
  readonly defaultVideoStrategy: ReplayVideoStrategy;
  readonly defaultAudioStrategy: ReplayAudioStrategy;
  readonly rampPolicy: ReplayRateChangePolicy;
  readonly rateChangePolicy: ReplayRateChangePolicy;
  readonly boundaryPolicy: string;
  readonly discontinuityPolicy: string;
  readonly cadencePolicy: ReplayCadenceType;
  readonly interpolationPolicy: string;
  readonly lookaheadPolicy: ReplayVariableSpeedLookaheadPolicy;
  readonly programInsertionPolicy: string;
  readonly backendPreference?: string;
  readonly enabled: boolean;
  readonly safeMetadata: SafeMetadata;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
}
export type ReplaySpeedProfileSnapshot = Omit<
  ReplaySpeedProfile,
  'createdAtNs' | 'updatedAtNs' | 'defaultRate' | 'allowedRates'
> & {
  readonly defaultRate: ReplayPlaybackRateSnapshot;
  readonly allowedRates: readonly ReplayPlaybackRateSnapshot[];
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
};
export interface ReplaySourceMotionCapability {
  readonly capabilityId: string;
  readonly capabilityGeneration: number;
  readonly replaySourceId: string;
  readonly replaySourceGeneration: number;
  readonly sourceFrameRate: readonly [number, number];
  readonly sourceTimeBase: readonly [number, number];
  readonly progressiveMetadata: boolean;
  readonly interlacedMetadata: boolean;
  readonly highFrameRate: boolean;
  readonly maximumNativeSlowMotionFactor: ReplayPlaybackRate;
  readonly motionVectorMetadataAvailability: boolean;
  readonly opticalFlowEligibilityMetadata: boolean;
  readonly reverseDecodeEligibilityMetadata: boolean;
  readonly frameAccurateSeekingMetadata: boolean;
  readonly audioRateCapabilityMetadata: boolean;
  readonly realHighFrameRateProcessing: boolean;
  readonly realMotionInterpolation: boolean;
  readonly realReverseDecode: boolean;
  readonly safeMetadata: SafeMetadata;
}
export type ReplaySourceMotionCapabilitySnapshot = ReplaySourceMotionCapability;
export interface ReplayVariableSpeedLookaheadPolicy {
  readonly minimumSourceUnits: number;
  readonly maximumSourceUnits: number;
  readonly minimumSourceDurationNs: bigint;
  readonly interpolationWindowMetadata: number;
  readonly opticalFlowWindowMetadata: number;
  readonly reverseReadWindowMetadata: number;
  readonly pressureBehavior: string;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedLookaheadPolicySnapshot = Omit<
  ReplayVariableSpeedLookaheadPolicy,
  'minimumSourceDurationNs'
> & { readonly minimumSourceDurationNs: string };
export interface ReplayVariableSpeedRequest {
  readonly requestId: string;
  readonly action: ReplayVariableSpeedAction;
  readonly playbackSessionId: string;
  readonly expectedPlaybackSessionGeneration: number;
  readonly speedProfileId: string;
  readonly expectedSpeedProfileGeneration: number;
  readonly requestedRate: ReplayPlaybackRate;
  readonly requestedDirection: ReplayPlaybackDirection;
  readonly requestedVideoStrategy: ReplayVideoStrategy;
  readonly requestedAudioStrategy: ReplayAudioStrategy;
  readonly rampId?: string;
  readonly expectedRampGeneration?: number;
  readonly expectedReplayRangeGeneration: number;
  readonly expectedReplayBufferGeneration: number;
  readonly expectedTimelineGeneration: number;
  readonly expectedPlaybackPositionGeneration: number;
  readonly expectedSourceCapabilityGeneration: number;
  readonly requestedRuntimeFrame: bigint;
  readonly deadlineNs: bigint;
  readonly cancellationReference?: string;
  readonly correlationId: string;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedAction =
  | 'VALIDATE'
  | 'SET_RATE'
  | 'SET_DIRECTION'
  | 'APPLY_PROFILE'
  | 'START_RAMP'
  | 'CANCEL_RAMP'
  | 'FREEZE_METADATA'
  | 'RESUME_RATE'
  | 'RESET_TO_1X'
  | 'CUSTOM';
export type ReplayVariableSpeedRequestSnapshot = Omit<
  ReplayVariableSpeedRequest,
  'requestedRuntimeFrame' | 'deadlineNs' | 'requestedRate'
> & {
  readonly requestedRuntimeFrame: string;
  readonly deadlineNs: string;
  readonly requestedRate: ReplayPlaybackRateSnapshot;
};
export interface ReplayVariableSpeedPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly speedProfileId: string;
  readonly speedProfileGeneration: number;
  readonly sourceCapabilitySummary: SafeMetadata;
  readonly previousRate: ReplayPlaybackRate;
  readonly resolvedRate: ReplayPlaybackRate;
  readonly previousDirection: ReplayPlaybackDirection;
  readonly resolvedDirection: ReplayPlaybackDirection;
  readonly resolvedVideoStrategy: ReplayVideoStrategy;
  readonly resolvedAudioStrategy: ReplayAudioStrategy;
  readonly rampSummary: SafeMetadata;
  readonly sourceTimeMappingPolicy: string;
  readonly outputTimeMappingPolicy: string;
  readonly cadencePolicy: ReplayCadenceType;
  readonly frameSelectionPolicy: ReplayVideoStrategy;
  readonly interpolationRequirement: boolean;
  readonly opticalFlowRequirement: boolean;
  readonly audioProcessingRequirement: boolean;
  readonly lookaheadRequirement: number;
  readonly programInsertionEligibility: boolean;
  readonly metadataOnly: boolean;
  readonly operationOrder: readonly string[];
  readonly deterministicScore: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedPlanSnapshot = Omit<
  ReplayVariableSpeedPlan,
  'previousRate' | 'resolvedRate'
> & {
  readonly previousRate: ReplayPlaybackRateSnapshot;
  readonly resolvedRate: ReplayPlaybackRateSnapshot;
};
export interface ReplayVariableSpeedClockMapping {
  readonly mappingId: string;
  readonly mappingGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly speedProfileId: string;
  readonly speedProfileGeneration: number;
  readonly direction: ReplayPlaybackDirection;
  readonly rateNumerator: number;
  readonly rateDenominator: number;
  readonly sourceStartPtsNs: bigint;
  readonly sourceEndPtsNs: bigint;
  readonly outputStartPtsNs: bigint;
  readonly outputEndPtsNs: bigint;
  readonly currentSourcePtsNs: bigint;
  readonly currentOutputPtsNs: bigint;
  readonly sourceSequence: number;
  readonly outputTick: bigint;
  readonly accumulatedRationalRemainder: number;
  readonly discontinuityGeneration: number;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedClockMappingSnapshot =
  StringBigints<ReplayVariableSpeedClockMapping>;
export interface ReplayVariableSpeedPositionState {
  readonly positionId: string;
  readonly positionGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly runtimeFrame: bigint;
  readonly direction: ReplayPlaybackDirection;
  readonly effectiveRate: ReplayPlaybackRate;
  readonly activeRampId?: string;
  readonly activeRampGeneration?: number;
  readonly sourceSequencePosition: number;
  readonly sourcePtsNs: bigint;
  readonly outputPtsNs: bigint;
  readonly fractionalSourcePositionMetadata: number;
  readonly previousSelectedSequence: number;
  readonly nextCandidateSequence: number;
  readonly endBoundary: string;
  readonly complete: boolean;
  readonly freezeActiveMetadata: boolean;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedPositionSnapshot = Omit<
  StringBigints<ReplayVariableSpeedPositionState>,
  'effectiveRate'
> & { readonly effectiveRate: ReplayPlaybackRateSnapshot };
export interface ReplayFrameSelectionRequest {
  readonly selectionRequestId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly variableSpeedPositionGeneration: number;
  readonly replayBufferId: string;
  readonly replayBufferGeneration: number;
  readonly replayRangeId: string;
  readonly replayRangeGeneration: number;
  readonly requestedRuntimeFrame: bigint;
  readonly requestedSourcePosition: number;
  readonly rate: ReplayPlaybackRate;
  readonly direction: ReplayPlaybackDirection;
  readonly videoStrategy: ReplayVideoStrategy;
  readonly sourceCapabilityGeneration: number;
  readonly lookaheadGeneration: number;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayFrameSelectionRequestSnapshot = Omit<
  StringBigints<ReplayFrameSelectionRequest>,
  'rate'
> & { readonly rate: ReplayPlaybackRateSnapshot };
export interface ReplayFrameSelectionPlan {
  readonly selectionPlanId: string;
  readonly requestId: string;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly runtimeFrame: bigint;
  readonly sourcePosition: number;
  readonly previousSourceSequence: number;
  readonly nextSourceSequence: number;
  readonly selectedSourceSequence: number;
  readonly secondarySourceSequenceMetadata?: number;
  readonly strategy: ReplayVideoStrategy;
  readonly repeatRequired: boolean;
  readonly dropCount: number;
  readonly interpolationRequired: boolean;
  readonly opticalFlowRequired: boolean;
  readonly blendWeightMetadata: string;
  readonly sourceUnitsRetained: boolean;
  readonly outputFrameAvailable: boolean;
  readonly metadataOnly: boolean;
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export type ReplayFrameSelectionPlanSnapshot = StringBigints<ReplayFrameSelectionPlan>;
export interface ReplayCadenceState {
  readonly cadenceId: string;
  readonly cadenceGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly sourceFrameRate: readonly [number, number];
  readonly outputFrameRate: readonly [number, number];
  readonly playbackRate: ReplayPlaybackRate;
  readonly cadenceType: ReplayCadenceType;
  readonly cadencePeriod: number;
  readonly sourceFramesConsumed: number;
  readonly outputFramesPlanned: number;
  readonly repeatedFrameCountMetadata: number;
  readonly droppedFrameCountMetadata: number;
  readonly interpolatedFrameCountRequiredMetadata: number;
  readonly currentCadenceIndex: number;
  readonly deterministicPatternSignature: string;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayCadenceSnapshot = Omit<ReplayCadenceState, 'playbackRate'> & {
  readonly playbackRate: ReplayPlaybackRateSnapshot;
};
export interface ReplaySpeedRampDefinition {
  readonly rampId: string;
  readonly rampVersion: string;
  readonly rampGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly startRate: ReplayPlaybackRate;
  readonly endRate: ReplayPlaybackRate;
  readonly startRuntimeFrame: bigint;
  readonly durationTicks: number;
  readonly sourceDurationMetadataNs: bigint;
  readonly interpolationMode: ReplayRampInterpolationMode;
  readonly easingFunction: string;
  readonly direction: ReplayPlaybackDirection;
  readonly boundaryBehavior: string;
  readonly state: ReplaySpeedRampState;
  readonly safeMetadata: SafeMetadata;
  readonly createdAtNs: bigint;
  readonly updatedAtNs: bigint;
}
export type ReplaySpeedRampSnapshot = Omit<
  StringBigints<ReplaySpeedRampDefinition>,
  'startRate' | 'endRate'
> & {
  readonly startRate: ReplayPlaybackRateSnapshot;
  readonly endRate: ReplayPlaybackRateSnapshot;
};
export interface ReplayRateChangePoint {
  readonly changePointId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly sourcePtsNs: bigint;
  readonly sourceSequence: number;
  readonly runtimeFrame: bigint;
  readonly previousRate: ReplayPlaybackRate;
  readonly nextRate: ReplayPlaybackRate;
  readonly changePolicy: ReplayRateChangePolicy;
  readonly markerReference?: string;
  readonly applied: boolean;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayRateChangePointSnapshot = Omit<
  StringBigints<ReplayRateChangePoint>,
  'previousRate' | 'nextRate'
> & {
  readonly previousRate: ReplayPlaybackRateSnapshot;
  readonly nextRate: ReplayPlaybackRateSnapshot;
};
export interface ReplaySlowMotionReadinessState {
  readonly readinessId: string;
  readonly readinessGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly sourceCapabilityGeneration: number;
  readonly requestedRate: ReplayPlaybackRate;
  readonly requestedDirection: ReplayPlaybackDirection;
  readonly sourceFrameRateSufficientMetadata: boolean;
  readonly retainedFrameDensitySufficient: boolean;
  readonly keyframeCoverageSufficient: boolean;
  readonly lookaheadSufficient: boolean;
  readonly interpolationRequired: boolean;
  readonly opticalFlowRequired: boolean;
  readonly audioProcessingRequired: boolean;
  readonly programInsertionEligible: boolean;
  readonly metadataOnly: boolean;
  readonly ready: boolean;
  readonly degraded: boolean;
  readonly blockingReasons: readonly string[];
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export type ReplaySlowMotionReadinessSnapshot = Omit<
  ReplaySlowMotionReadinessState,
  'requestedRate'
> & { readonly requestedRate: ReplayPlaybackRateSnapshot };
export interface ReplayFreezeState {
  readonly freezeId: string;
  readonly freezeGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly sourceReplayUnitId: string;
  readonly sourceReplayUnitGeneration: number;
  readonly sourceSequence: number;
  readonly sourcePtsNs: bigint;
  readonly freezeStartRuntimeFrame: bigint;
  readonly freezeDurationTicksMetadata: number;
  readonly resumeRate: ReplayPlaybackRate;
  readonly programInsertionEligibility: boolean;
  readonly activeMetadata: boolean;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayFreezeSnapshot = Omit<StringBigints<ReplayFreezeState>, 'resumeRate'> & {
  readonly resumeRate: ReplayPlaybackRateSnapshot;
};
export interface ReplayReversePlaybackState {
  readonly reverseStateId: string;
  readonly reverseGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly startSequence: number;
  readonly currentSequence: number;
  readonly endSequence: number;
  readonly requestedRate: ReplayPlaybackRate;
  readonly keyframeCoverageMetadata: boolean;
  readonly reverseDecodeRequired: boolean;
  readonly audioReverseRequired: boolean;
  readonly sourceCapabilityCompatible: boolean;
  readonly metadataOnly: boolean;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayReversePlaybackSnapshot = Omit<ReplayReversePlaybackState, 'requestedRate'> & {
  readonly requestedRate: ReplayPlaybackRateSnapshot;
};
export interface ReplayVariableSpeedAudioState {
  readonly audioStateId: string;
  readonly audioStateGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly effectiveRate: ReplayPlaybackRate;
  readonly direction: ReplayPlaybackDirection;
  readonly audioStrategy: ReplayAudioStrategy;
  readonly replayAudioAvailable: boolean;
  readonly selectedAudioBehavior: string;
  readonly muteRequested: boolean;
  readonly programAudioContinuationRequested: boolean;
  readonly timeStretchRequired: boolean;
  readonly pitchPreservationRequired: boolean;
  readonly reverseAudioRequired: boolean;
  readonly resampleRequired: boolean;
  readonly mixerCommandDelegationMetadata: boolean;
  readonly metadataOnly: boolean;
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedAudioSnapshot = Omit<
  ReplayVariableSpeedAudioState,
  'effectiveRate'
> & { readonly effectiveRate: ReplayPlaybackRateSnapshot };
export interface ReplayVariableSpeedAvSyncState {
  readonly syncStateId: string;
  readonly syncGeneration: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly effectiveRate: ReplayPlaybackRate;
  readonly direction: ReplayPlaybackDirection;
  readonly selectedVideoSourcePtsNs: bigint;
  readonly selectedAudioSourcePtsMetadataNs: bigint;
  readonly outputVideoPtsNs: bigint;
  readonly outputAudioPtsMetadataNs: bigint;
  readonly skewNs: bigint;
  readonly driftMetadataNs: bigint;
  readonly synchronized: boolean;
  readonly degraded: boolean;
  readonly audioProcessingRequired: boolean;
  readonly videoInterpolationRequired: boolean;
  readonly metadataOnly: boolean;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedAvSyncSnapshot = Omit<
  StringBigints<ReplayVariableSpeedAvSyncState>,
  'effectiveRate'
> & { readonly effectiveRate: ReplayPlaybackRateSnapshot };
export interface ReplayVariableSpeedDurationState {
  readonly durationStateId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly sourceDurationNs: bigint;
  readonly effectiveOutputDurationNs: bigint;
  readonly currentRemainingSourceDurationNs: bigint;
  readonly currentRemainingOutputDurationNs: bigint;
  readonly activeRate: ReplayPlaybackRate;
  readonly activeRampId?: string;
  readonly direction: ReplayPlaybackDirection;
  readonly completionBoundary: string;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedDurationSnapshot = Omit<
  StringBigints<ReplayVariableSpeedDurationState>,
  'activeRate'
> & { readonly activeRate: ReplayPlaybackRateSnapshot };
export interface ReplayVariableSpeedProtectionState {
  readonly protectionId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly currentSourceSequence: number;
  readonly protectedPreviousSequence: number;
  readonly protectedNextSequence: number;
  readonly protectedRange: readonly [number, number];
  readonly direction: ReplayPlaybackDirection;
  readonly effectiveRate: ReplayPlaybackRate;
  readonly lookaheadUnitCount: number;
  readonly retainedLeaseIds: readonly string[];
  readonly pressureImpact: string;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedProtectionSnapshot = Omit<
  ReplayVariableSpeedProtectionState,
  'effectiveRate'
> & { readonly effectiveRate: ReplayPlaybackRateSnapshot };
export interface ReplayVariableSpeedProgramEligibility {
  readonly eligibilityId: string;
  readonly generation: number;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly requestedRate: ReplayPlaybackRate;
  readonly direction: ReplayPlaybackDirection;
  readonly videoStrategy: ReplayVideoStrategy;
  readonly audioStrategy: ReplayAudioStrategy;
  readonly realFrameOutputAvailable: boolean;
  readonly realAudioOutputAvailable: boolean;
  readonly metadataOnly: boolean;
  readonly replayPreviewEligible: boolean;
  readonly programCandidateEligible: boolean;
  readonly programInsertionEligible: boolean;
  readonly blockingReasons: readonly string[];
  readonly warnings: readonly string[];
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedProgramEligibilitySnapshot = Omit<
  ReplayVariableSpeedProgramEligibility,
  'requestedRate'
> & { readonly requestedRate: ReplayPlaybackRateSnapshot };
export interface ReplayVariableSpeedResult {
  readonly requestId: string;
  readonly planId: string;
  readonly status: ReplayVariableSpeedResultStatus;
  readonly runtimeFrame: bigint;
  readonly playbackSessionId: string;
  readonly playbackSessionGeneration: number;
  readonly speedProfileId: string;
  readonly speedProfileGeneration: number;
  readonly previousRate: ReplayPlaybackRate;
  readonly effectiveRate: ReplayPlaybackRate;
  readonly previousDirection: ReplayPlaybackDirection;
  readonly effectiveDirection: ReplayPlaybackDirection;
  readonly videoStrategy: ReplayVideoStrategy;
  readonly audioStrategy: ReplayAudioStrategy;
  readonly rampId?: string;
  readonly rampGeneration?: number;
  readonly positionGeneration: number;
  readonly clockMappingGeneration: number;
  readonly cadenceGeneration: number;
  readonly programEligibility: ReplayVariableSpeedProgramEligibility;
  readonly metadataOnly: boolean;
  readonly realVariableSpeedProcessing: boolean;
  readonly realFrameInterpolation: boolean;
  readonly realOpticalFlow: boolean;
  readonly realAudioTimeStretch: boolean;
  readonly realPitchPreservation: boolean;
  readonly warnings: readonly string[];
  readonly completedAtNs: bigint;
}
export type ReplayVariableSpeedResultSnapshot = Omit<
  StringBigints<ReplayVariableSpeedResult>,
  'previousRate' | 'effectiveRate' | 'programEligibility'
> & {
  readonly previousRate: ReplayPlaybackRateSnapshot;
  readonly effectiveRate: ReplayPlaybackRateSnapshot;
  readonly programEligibility: ReplayVariableSpeedProgramEligibilitySnapshot;
};
export interface ReplayVariableSpeedConfigurationTransaction {
  readonly transactionId: string;
  readonly transactionGeneration: number;
  readonly playbackSessionId: string;
  readonly currentSpeedProfileGeneration: number;
  readonly requestedSpeedProfileGeneration: number;
  readonly rateUpdates: readonly ReplayPlaybackRate[];
  readonly directionUpdates: readonly ReplayPlaybackDirection[];
  readonly videoStrategyUpdates: readonly ReplayVideoStrategy[];
  readonly audioStrategyUpdates: readonly ReplayAudioStrategy[];
  readonly rampUpdates: readonly string[];
  readonly cadenceUpdates: readonly ReplayCadenceType[];
  readonly lookaheadUpdates: readonly ReplayVariableSpeedLookaheadPolicy[];
  readonly programEligibilityPolicyUpdates: readonly string[];
  readonly validationReport: ReplayVariableSpeedValidationReport;
  readonly applicationBoundary: string;
  readonly state: 'CREATED' | 'VALIDATED' | 'COMMITTED' | 'CANCELLED' | 'FAILED';
  readonly failureReason?: string;
  readonly createdAtNs: bigint;
  readonly committedAtNs?: bigint;
  readonly completedAtNs?: bigint;
  readonly safeMetadata: SafeMetadata;
}
export type ReplayVariableSpeedConfigurationTransactionSnapshot = Omit<
  StringBigints<ReplayVariableSpeedConfigurationTransaction>,
  'rateUpdates'
> & { readonly rateUpdates: readonly ReplayPlaybackRateSnapshot[] };
export interface ReplayVariableSpeedBackendCapabilities {
  readonly supportedRates: readonly string[];
  readonly supportedDirections: readonly ReplayPlaybackDirection[];
  readonly supportedVideoStrategies: readonly ReplayVideoStrategy[];
  readonly supportedAudioStrategies: readonly ReplayAudioStrategy[];
  readonly speedRamps: boolean;
  readonly freeze: boolean;
  readonly reverse: boolean;
  readonly highFrameRateNativeSlowMotion: boolean;
  readonly frameRepetition: boolean;
  readonly frameDropping: boolean;
  readonly frameBlending: boolean;
  readonly frameInterpolation: boolean;
  readonly opticalFlow: boolean;
  readonly audioTimeStretching: boolean;
  readonly pitchPreservation: boolean;
  readonly reverseAudio: boolean;
  readonly programOutput: boolean;
  readonly replayPreviewMetadata: boolean;
  readonly realVariableSpeedProcessing: boolean;
  readonly deterministicBehavior: boolean;
  readonly maximumSessions: number;
  readonly maximumRampPoints: number;
  readonly queueLimit: number;
  readonly memoryLimitBytes: number;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayVariableSpeedBackendSnapshot {
  readonly backendId: string;
  readonly backendGeneration: number;
  readonly capabilities: ReplayVariableSpeedBackendCapabilities;
  readonly health: 'healthy' | 'degraded' | 'failed' | 'stopped';
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayVariableSpeedBackend {
  readonly descriptor: {
    readonly backendId: string;
    readonly backendGeneration: number;
    readonly displayName: string;
    readonly version: string;
  };
  readonly capabilities: ReplayVariableSpeedBackendCapabilities;
  initializeSession(sessionId: string): void;
  validateRate(rate: ReplayPlaybackRate): ReplayVariableSpeedValidationReport;
  evaluateSourceCapability(
    capability: ReplaySourceMotionCapability,
  ): ReplaySlowMotionReadinessState;
  createVariableSpeedPlan(
    request: ReplayVariableSpeedRequest,
    profile: ReplaySpeedProfile,
    capability: ReplaySourceMotionCapability,
    previousRate: ReplayPlaybackRate,
  ): ReplayVariableSpeedPlan;
  createClockMapping(plan: ReplayVariableSpeedPlan, frame: bigint): ReplayVariableSpeedClockMapping;
  resolvePosition(
    mapping: ReplayVariableSpeedClockMapping,
    range: readonly [number, number],
  ): ReplayVariableSpeedPositionState;
  createFrameSelectionPlan(request: ReplayFrameSelectionRequest): ReplayFrameSelectionPlan;
  createCadencePlan(plan: ReplayVariableSpeedPlan): ReplayCadenceState;
  evaluateAudioStrategy(plan: ReplayVariableSpeedPlan): ReplayVariableSpeedAudioState;
  evaluateAvSync(
    position: ReplayVariableSpeedPositionState,
    audio: ReplayVariableSpeedAudioState,
  ): ReplayVariableSpeedAvSyncState;
  evaluateProgramEligibility(plan: ReplayVariableSpeedPlan): ReplayVariableSpeedProgramEligibility;
  createRampPlan(ramp: ReplaySpeedRampDefinition): ReplaySpeedRampDefinition;
  resetToNormalSpeed(sessionId: string): ReplayPlaybackRate;
  reset(): void;
  drain(): void;
  reconfigure(metadata: SafeMetadata): void;
  shutdownSession(sessionId: string): void;
  shutdown(): void;
  snapshot(): ReplayVariableSpeedBackendSnapshot;
}
export interface ReplayVariableSpeedHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly backendCount: number;
  readonly profileCount: number;
  readonly sourceCapabilityCount: number;
  readonly activeSessionCount: number;
  readonly normalSpeedSessionCount: number;
  readonly slowMotionMetadataSessionCount: number;
  readonly fastMotionMetadataSessionCount: number;
  readonly reverseMetadataSessionCount: number;
  readonly freezeMetadataSessionCount: number;
  readonly activeRampCount: number;
  readonly rateChangeRequestCount: number;
  readonly appliedRateChangeCount: number;
  readonly rejectedRateChangeCount: number;
  readonly frameSelectionPlanCount: number;
  readonly repeatFrameRequiredCount: number;
  readonly droppedFrameRequiredCount: number;
  readonly interpolationRequiredCount: number;
  readonly opticalFlowRequiredCount: number;
  readonly audioTimeStretchRequiredCount: number;
  readonly pitchPreservationRequiredCount: number;
  readonly programEligibleCount: number;
  readonly programIneligibleCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateTickCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly invalidRateCount: number;
  readonly insufficientSourceCapabilityCount: number;
  readonly bufferPressureConflictCount: number;
  readonly backendFailureCount: number;
  readonly ownershipViolationCount: number;
  readonly protectedUnitCount: number;
  readonly queueDepth: number;
  readonly peakQueueDepth: number;
  readonly lastEffectiveRate: string;
  readonly lastActiveRampId?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface ReplayVariableSpeedTelemetrySnapshot {
  readonly counters: Readonly<Record<string, number>>;
  readonly activeSessionIds: readonly string[];
  readonly currentRequestIds: readonly string[];
  readonly lastEvent?: string;
  readonly healthSummary: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayVariableSpeedValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedAtNs: string;
  readonly safeMetadata: SafeMetadata;
}
export interface ReplayVariableSpeedEngineSnapshot {
  readonly rates: readonly ReplayPlaybackRateSnapshot[];
  readonly profiles: readonly ReplaySpeedProfileSnapshot[];
  readonly capabilities: readonly ReplaySourceMotionCapabilitySnapshot[];
  readonly requests: readonly ReplayVariableSpeedRequestSnapshot[];
  readonly plans: readonly ReplayVariableSpeedPlanSnapshot[];
  readonly results: readonly ReplayVariableSpeedResultSnapshot[];
  readonly mappings: readonly ReplayVariableSpeedClockMappingSnapshot[];
  readonly positions: readonly ReplayVariableSpeedPositionSnapshot[];
  readonly selections: readonly ReplayFrameSelectionPlanSnapshot[];
  readonly cadences: readonly ReplayCadenceSnapshot[];
  readonly health: ReplayVariableSpeedHealthSnapshot;
  readonly telemetry: ReplayVariableSpeedTelemetrySnapshot;
  readonly backends: readonly ReplayVariableSpeedBackendSnapshot[];
  readonly shutdown: boolean;
}
type StringBigints<T> = { readonly [K in keyof T]: T[K] extends bigint ? string : T[K] };
export class ReplayVariableSpeedError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = code;
  }
}
export const replayVariableSpeedErrorTypes = [
  'ReplayVariableSpeedEngineNotReady',
  'ReplayVariableSpeedBackendNotFound',
  'DuplicateReplayVariableSpeedBackend',
  'ReplaySpeedProfileNotFound',
  'DuplicateReplaySpeedProfile',
  'ReplaySpeedProfileInvalid',
  'ReplaySourceMotionCapabilityNotFound',
  'ReplaySourceMotionCapabilityInvalid',
  'ReplayPlaybackRateInvalid',
  'ReplayPlaybackDirectionUnsupported',
  'ReplayVideoStrategyUnsupported',
  'ReplayAudioStrategyUnsupported',
  'ReplaySpeedRampNotFound',
  'DuplicateReplaySpeedRamp',
  'ReplaySpeedRampInvalid',
  'ReplayVariableSpeedRequestInvalid',
  'ReplayVariableSpeedDuplicateRequest',
  'ReplayVariableSpeedGenerationMismatch',
  'ReplaySourceFrameDensityInsufficient',
  'ReplayKeyframeCoverageInsufficient',
  'ReplayVariableSpeedLookaheadInsufficient',
  'ReplayFrameInterpolationRequired',
  'ReplayOpticalFlowRequired',
  'ReplayAudioTimeStretchRequired',
  'ReplayPitchPreservationRequired',
  'ReplayReverseDecodeRequired',
  'ReplayVariableSpeedProgramIneligible',
  'ReplayVariableSpeedQueueFull',
  'ReplayVariableSpeedBackendFailed',
  'ReplayVariableSpeedOwnershipViolation',
  'ReplayVariableSpeedCancelled',
  'ReplayVariableSpeedTimeout',
  'ReplayVariableSpeedInvariantViolation',
  'ReplayVariableSpeedShutdownError',
] as const;
const gcd = (a: number, b: number): number => {
  let x = Math.abs(a),
    y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
};
const now = (n = 1n) => n;
export function normalizeReplayPlaybackRate(
  numerator: number,
  denominator: number,
  direction: ReplayPlaybackDirection = 'FORWARD',
) {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator === 0)
    throw new ReplayVariableSpeedError('ReplayPlaybackRateInvalid', 'invalid rational rate');
  if (numerator < 0)
    throw new ReplayVariableSpeedError(
      'ReplayPlaybackRateInvalid',
      'negative numerator cannot imply reverse',
    );
  const sign = denominator < 0 ? -1 : 1;
  const n = numerator * sign,
    d = denominator * sign;
  if (n < 0)
    throw new ReplayVariableSpeedError(
      'ReplayPlaybackRateInvalid',
      'negative normalized numerator cannot imply reverse',
    );
  if (d <= 0)
    throw new ReplayVariableSpeedError('ReplayPlaybackRateInvalid', 'denominator must be positive');
  const g = gcd(n, d);
  const nn = n / g,
    dd = d / g;
  if (nn > 16 * dd)
    throw new ReplayVariableSpeedError('ReplayPlaybackRateInvalid', 'rate exceeds bounded maximum');
  return {
    normalizedNumerator: nn,
    normalizedDenominator: dd,
    rateClass: classifyReplayPlaybackRate(nn, dd),
    direction,
  };
}
export function classifyReplayPlaybackRate(n: number, d: number): ReplayPlaybackRateClass {
  return n === 0
    ? 'FREEZE_METADATA'
    : n * 2 < d
      ? 'ULTRA_SLOW_METADATA'
      : n < d
        ? 'SLOW_MOTION_METADATA'
        : n === d
          ? 'NORMAL'
          : n <= 4 * d
            ? 'FAST_MOTION_METADATA'
            : 'ULTRA_FAST_METADATA';
}
export function createReplayPlaybackRate(
  rateId: string,
  numerator: number,
  denominator: number,
  direction: ReplayPlaybackDirection = 'FORWARD',
  videoStrategy: ReplayVideoStrategy = 'EXACT_SOURCE_FRAME',
  audioStrategy: ReplayAudioStrategy = 'FOLLOW_AT_1X',
  generation = 1,
): ReplayPlaybackRate {
  const r = normalizeReplayPlaybackRate(numerator, denominator, direction);
  if (r.normalizedNumerator === 0 && direction !== 'FORWARD')
    throw new ReplayVariableSpeedError(
      'ReplayPlaybackRateInvalid',
      'freeze rate requires explicit freeze metadata',
    );
  const executable =
    r.rateClass === 'NORMAL' &&
    direction === 'FORWARD' &&
    videoStrategy === 'EXACT_SOURCE_FRAME' &&
    audioStrategy === 'FOLLOW_AT_1X';
  return Object.freeze({
    rateId,
    rateVersion: REPLAY_VARIABLE_SPEED_VERSION,
    rateGeneration: generation,
    numerator,
    denominator,
    normalizedNumerator: r.normalizedNumerator,
    normalizedDenominator: r.normalizedDenominator,
    decimalSummaryMetadata: `${r.normalizedNumerator}/${r.normalizedDenominator}x`,
    direction,
    rateClass: r.rateClass,
    executableCapability: executable,
    videoStrategy,
    audioStrategy,
    safeMetadata: Object.freeze({ metadataOnly: !executable }),
    createdAtNs: now(),
    updatedAtNs: now(),
  });
}
const snapRate = (r: ReplayPlaybackRate): ReplayPlaybackRateSnapshot => ({
  ...r,
  createdAtNs: String(r.createdAtNs),
  updatedAtNs: String(r.updatedAtNs),
});
const defaultLookahead = (): ReplayVariableSpeedLookaheadPolicy =>
  Object.freeze({
    minimumSourceUnits: 1,
    maximumSourceUnits: 8,
    minimumSourceDurationNs: 0n,
    interpolationWindowMetadata: 2,
    opticalFlowWindowMetadata: 4,
    reverseReadWindowMetadata: 4,
    pressureBehavior: 'REJECT_OPTIONAL_ALTERED_SPEED',
    safeMetadata: Object.freeze({ bounded: true }),
  });
export function createReplaySpeedProfile(id: string, rate: ReplayPlaybackRate): ReplaySpeedProfile {
  return Object.freeze({
    speedProfileId: id,
    profileVersion: REPLAY_VARIABLE_SPEED_VERSION,
    profileGeneration: 1,
    displayName: id.replaceAll('_', ' '),
    defaultRate: rate,
    allowedRates: Object.freeze([rate]),
    allowedDirections: Object.freeze([rate.direction]),
    defaultVideoStrategy: rate.videoStrategy,
    defaultAudioStrategy: rate.audioStrategy,
    rampPolicy: 'FIXED_FOR_SESSION',
    rateChangePolicy: 'CHANGE_AT_NEXT_TICK',
    boundaryPolicy: 'EXPLICIT',
    discontinuityPolicy: 'PRESERVE_METADATA',
    cadencePolicy:
      rate.rateClass === 'NORMAL'
        ? 'ONE_TO_ONE'
        : rate.normalizedNumerator < rate.normalizedDenominator
          ? 'FRAME_REPEAT_METADATA'
          : 'FRAME_DROP_METADATA',
    interpolationPolicy: 'REQUIRE_EXPLICIT_METADATA',
    lookaheadPolicy: defaultLookahead(),
    programInsertionPolicy: rate.executableCapability
      ? 'ALLOW_REAL_1X_ONLY'
      : 'PREVIEW_METADATA_ONLY',
    enabled: true,
    safeMetadata: Object.freeze({ metadataOnly: !rate.executableCapability }),
    createdAtNs: now(),
    updatedAtNs: now(),
  });
}
export function createBuiltInReplaySpeedProfiles() {
  const mk = (
    id: string,
    n: number,
    d: number,
    dir: ReplayPlaybackDirection = 'FORWARD',
    v: ReplayVideoStrategy = 'EXACT_SOURCE_FRAME',
    a: ReplayAudioStrategy = 'MUTE_AT_NONSTANDARD_RATE',
  ) =>
    createReplaySpeedProfile(
      id,
      createReplayPlaybackRate(id, n, d, dir, v, n === d && dir === 'FORWARD' ? 'FOLLOW_AT_1X' : a),
    );
  return [
    mk('NORMAL_1X', 1, 1),
    mk('HALF_SPEED_METADATA', 1, 2),
    mk('QUARTER_SPEED_METADATA', 1, 4),
    mk('THREE_QUARTER_SPEED_METADATA', 3, 4),
    mk('DOUBLE_SPEED_METADATA', 2, 1, 'FORWARD', 'DROP_FRAME_METADATA'),
    mk('FOUR_TIMES_SPEED_METADATA', 4, 1, 'FORWARD', 'DROP_FRAME_METADATA'),
    mk('FREEZE_METADATA', 0, 1, 'FORWARD', 'REPEAT_FRAME_METADATA'),
    mk('REVERSE_1X_METADATA', 1, 1, 'REVERSE_METADATA'),
    mk('REVERSE_HALF_SPEED_METADATA', 1, 2, 'REVERSE_METADATA'),
    mk('PING_PONG_METADATA', 1, 1, 'PING_PONG_METADATA'),
    mk('HFR_HALF_SPEED_METADATA', 1, 2, 'FORWARD', 'HIGH_FRAME_RATE_NATIVE_METADATA'),
    mk('HFR_QUARTER_SPEED_METADATA', 1, 4, 'FORWARD', 'HIGH_FRAME_RATE_NATIVE_METADATA'),
    mk('CUSTOM', 1, 1),
  ];
}
const planOrder = [
  'validate playback session',
  'validate speed profile',
  'validate requested rational rate',
  'validate direction',
  'validate source capabilities',
  'validate retained range density',
  'validate keyframe and lookahead coverage',
  'resolve video strategy',
  'resolve audio strategy',
  'resolve cadence',
  'resolve source/output time mapping',
  'resolve interpolation and optical-flow requirements',
  'resolve Program-insertion eligibility',
  'schedule rate change or ramp',
  'publish immutable plan',
  'update health and telemetry',
] as const;
export class SyntheticReplayVariableSpeedBackend implements ReplayVariableSpeedBackend {
  readonly descriptor = {
    backendId: 'synthetic-replay-variable-speed',
    backendGeneration: 1,
    displayName: 'Synthetic Replay Variable Speed Backend',
    version: REPLAY_VARIABLE_SPEED_VERSION,
  };
  readonly capabilities: ReplayVariableSpeedBackendCapabilities = {
    supportedRates: ['0/1', '1/4', '1/2', '3/4', '1/1', '2/1', '4/1'],
    supportedDirections: ['FORWARD', 'REVERSE_METADATA', 'PING_PONG_METADATA', 'CUSTOM'],
    supportedVideoStrategies: [
      'EXACT_SOURCE_FRAME',
      'NEAREST_FRAME',
      'PREVIOUS_FRAME',
      'NEXT_FRAME',
      'REPEAT_FRAME_METADATA',
      'DROP_FRAME_METADATA',
      'FRAME_BLEND_REQUIRED',
      'INTERPOLATION_REQUIRED',
      'OPTICAL_FLOW_REQUIRED',
      'HIGH_FRAME_RATE_NATIVE_METADATA',
      'CUSTOM',
    ],
    supportedAudioStrategies: [
      'FOLLOW_AT_1X',
      'MUTE_AT_NONSTANDARD_RATE',
      'CONTINUE_PROGRAM_AUDIO_METADATA',
      'TIME_STRETCH_REQUIRED',
      'PITCH_PRESERVATION_REQUIRED',
      'RESAMPLE_REQUIRED',
      'REVERSE_AUDIO_REQUIRED',
      'AUDIO_ONLY_RATE_METADATA',
      'OPERATOR_CONTROLLED',
      'CUSTOM',
    ],
    speedRamps: true,
    freeze: true,
    reverse: true,
    highFrameRateNativeSlowMotion: false,
    frameRepetition: true,
    frameDropping: true,
    frameBlending: false,
    frameInterpolation: false,
    opticalFlow: false,
    audioTimeStretching: false,
    pitchPreservation: false,
    reverseAudio: false,
    programOutput: false,
    replayPreviewMetadata: true,
    realVariableSpeedProcessing: false,
    deterministicBehavior: true,
    maximumSessions: 64,
    maximumRampPoints: 128,
    queueLimit: 1024,
    memoryLimitBytes: 1024 * 1024,
    safeMetadata: { syntheticOnly: true, noDecoder: true, noGpu: true, noAudioProcessing: true },
  };
  private stopped = false;
  initializeSession(_s: string) {}
  validateRate(rate: ReplayPlaybackRate) {
    const ok = rate.normalizedDenominator > 0 && rate.numerator >= 0;
    return {
      valid: ok,
      errors: ok ? [] : ['invalid rational rate'],
      warnings: rate.executableCapability ? [] : ['metadata-only altered-speed'],
      checkedAtNs: '1',
      safeMetadata: { sanitized: true },
    };
  }
  evaluateSourceCapability(c: ReplaySourceMotionCapability): ReplaySlowMotionReadinessState {
    const rate = createReplayPlaybackRate('readiness-rate', 1, 2);
    return {
      readinessId: `readiness-${c.capabilityId}`,
      readinessGeneration: c.capabilityGeneration,
      playbackSessionId: 'session',
      playbackSessionGeneration: 1,
      sourceCapabilityGeneration: c.capabilityGeneration,
      requestedRate: rate,
      requestedDirection: 'FORWARD' as const,
      sourceFrameRateSufficientMetadata: c.highFrameRate,
      retainedFrameDensitySufficient: c.highFrameRate,
      keyframeCoverageSufficient: true,
      lookaheadSufficient: true,
      interpolationRequired: !c.highFrameRate,
      opticalFlowRequired: false,
      audioProcessingRequired: true,
      programInsertionEligible: false,
      metadataOnly: true,
      ready: c.highFrameRate,
      degraded: !c.highFrameRate,
      blockingReasons: c.highFrameRate ? [] : ['INSUFFICIENT_SOURCE_FRAME_DENSITY'],
      warnings: ['synthetic metadata only'],
      safeMetadata: { sanitized: true },
    };
  }
  createVariableSpeedPlan(
    req: ReplayVariableSpeedRequest,
    p: ReplaySpeedProfile,
    c: ReplaySourceMotionCapability,
    prev: ReplayPlaybackRate,
  ) {
    const r = req.requestedRate;
    const interpolation =
      req.requestedVideoStrategy === 'INTERPOLATION_REQUIRED' ||
      (r.normalizedNumerator < r.normalizedDenominator &&
        !c.highFrameRate &&
        req.requestedVideoStrategy === 'HIGH_FRAME_RATE_NATIVE_METADATA');
    const optical = req.requestedVideoStrategy === 'OPTICAL_FLOW_REQUIRED';
    const audio =
      req.requestedAudioStrategy !== 'FOLLOW_AT_1X' ||
      r.rateClass !== 'NORMAL' ||
      req.requestedDirection !== 'FORWARD';
    const program =
      r.executableCapability &&
      req.requestedDirection === 'FORWARD' &&
      req.requestedVideoStrategy === 'EXACT_SOURCE_FRAME' &&
      req.requestedAudioStrategy === 'FOLLOW_AT_1X';
    return Object.freeze({
      planId: `plan-${req.requestId}`,
      requestId: req.requestId,
      playbackSessionId: req.playbackSessionId,
      playbackSessionGeneration: req.expectedPlaybackSessionGeneration,
      speedProfileId: p.speedProfileId,
      speedProfileGeneration: p.profileGeneration,
      sourceCapabilitySummary: {
        capabilityGeneration: c.capabilityGeneration,
        hfr: c.highFrameRate,
      },
      previousRate: prev,
      resolvedRate: r,
      previousDirection: prev.direction,
      resolvedDirection: req.requestedDirection,
      resolvedVideoStrategy: req.requestedVideoStrategy,
      resolvedAudioStrategy: req.requestedAudioStrategy,
      rampSummary: { rampId: req.rampId ?? 'none' },
      sourceTimeMappingPolicy: 'RATIONAL_INTEGER_METADATA',
      outputTimeMappingPolicy: 'MONOTONIC_OUTPUT_PTS',
      cadencePolicy:
        r.normalizedNumerator === r.normalizedDenominator
          ? 'ONE_TO_ONE'
          : r.normalizedNumerator < r.normalizedDenominator
            ? 'FRAME_REPEAT_METADATA'
            : 'FRAME_DROP_METADATA',
      frameSelectionPolicy: req.requestedVideoStrategy,
      interpolationRequirement: interpolation,
      opticalFlowRequirement: optical,
      audioProcessingRequirement: audio,
      lookaheadRequirement: Math.min(
        8,
        Math.max(1, Math.ceil(r.normalizedDenominator / Math.max(1, r.normalizedNumerator || 1))),
      ),
      programInsertionEligibility: program,
      metadataOnly: !program,
      operationOrder: planOrder,
      deterministicScore: [req.requestId, p.speedProfileId, c.capabilityGeneration].join('|')
        .length,
      warnings: program ? [] : ['metadata-only altered-speed output is not Program-ready'],
      safeMetadata: { sanitized: true, metadataOnly: !program },
    });
  }
  createClockMapping(plan: ReplayVariableSpeedPlan, frame: bigint) {
    const r = plan.resolvedRate;
    const out = frame * 33333333n;
    const delta = (BigInt(frame) * BigInt(r.normalizedNumerator)) / BigInt(r.normalizedDenominator);
    const rem = Number(
      (BigInt(frame) * BigInt(r.normalizedNumerator)) % BigInt(r.normalizedDenominator),
    );
    const seq =
      plan.resolvedDirection === 'REVERSE_METADATA' ? 1000 - Number(delta) : Number(delta);
    const src = BigInt(Math.max(0, seq)) * 33333333n;
    return {
      mappingId: `mapping-${plan.planId}-${frame}`,
      mappingGeneration: Number(frame) + 1,
      playbackSessionId: plan.playbackSessionId,
      playbackSessionGeneration: plan.playbackSessionGeneration,
      speedProfileId: plan.speedProfileId,
      speedProfileGeneration: plan.speedProfileGeneration,
      direction: plan.resolvedDirection,
      rateNumerator: r.normalizedNumerator,
      rateDenominator: r.normalizedDenominator,
      sourceStartPtsNs: 0n,
      sourceEndPtsNs: 33333333000n,
      outputStartPtsNs: 0n,
      outputEndPtsNs: 33333333000n,
      currentSourcePtsNs: src,
      currentOutputPtsNs: out,
      sourceSequence: seq,
      outputTick: frame,
      accumulatedRationalRemainder: rem,
      discontinuityGeneration: 0,
      safeMetadata: { integerRational: true },
    };
  }
  resolvePosition(m: ReplayVariableSpeedClockMapping, range: readonly [number, number]) {
    const seq = Math.min(range[1] ?? m.sourceSequence, Math.max(range[0] ?? 0, m.sourceSequence));
    return {
      positionId: `pos-${m.mappingId}`,
      positionGeneration: m.mappingGeneration,
      playbackSessionId: m.playbackSessionId,
      playbackSessionGeneration: m.playbackSessionGeneration,
      runtimeFrame: m.outputTick,
      direction: m.direction,
      effectiveRate: createReplayPlaybackRate(
        `effective-${m.rateNumerator}-${m.rateDenominator}`,
        m.rateNumerator,
        m.rateDenominator,
        m.direction,
      ),
      sourceSequencePosition: seq,
      sourcePtsNs: BigInt(seq) * 33333333n,
      outputPtsNs: m.currentOutputPtsNs,
      fractionalSourcePositionMetadata: m.accumulatedRationalRemainder,
      previousSelectedSequence: Math.max(range[0] ?? 0, seq - 1),
      nextCandidateSequence: Math.min(range[1] ?? seq, seq + 1),
      endBoundary: seq >= (range[1] ?? seq) ? 'END' : 'NONE',
      complete: seq >= (range[1] ?? seq),
      freezeActiveMetadata: m.rateNumerator === 0,
      safeMetadata: { frameTickDerived: true },
    };
  }
  createFrameSelectionPlan(req: ReplayFrameSelectionRequest): ReplayFrameSelectionPlan {
    const s = req.requestedSourcePosition;
    const repeat =
      req.videoStrategy === 'REPEAT_FRAME_METADATA' ||
      req.rate.normalizedNumerator < req.rate.normalizedDenominator;
    const drop =
      req.videoStrategy === 'DROP_FRAME_METADATA' ||
      req.rate.normalizedNumerator > req.rate.normalizedDenominator
        ? Math.max(0, req.rate.normalizedNumerator - req.rate.normalizedDenominator)
        : 0;
    return {
      selectionPlanId: `selection-${req.playbackSessionId}-${req.requestedRuntimeFrame}`,
      requestId: req.selectionRequestId,
      playbackSessionId: req.playbackSessionId,
      playbackSessionGeneration: req.playbackSessionGeneration,
      runtimeFrame: req.requestedRuntimeFrame,
      sourcePosition: s,
      previousSourceSequence: Math.max(0, s - 1),
      nextSourceSequence: s + 1,
      selectedSourceSequence: s,
      ...(req.videoStrategy === 'NEAREST_FRAME' ? { secondarySourceSequenceMetadata: s + 1 } : {}),
      strategy: req.videoStrategy,
      repeatRequired: repeat,
      dropCount: drop,
      interpolationRequired: req.videoStrategy === 'INTERPOLATION_REQUIRED',
      opticalFlowRequired: req.videoStrategy === 'OPTICAL_FLOW_REQUIRED',
      blendWeightMetadata: req.videoStrategy === 'FRAME_BLEND_REQUIRED' ? '1/2' : '0/1',
      sourceUnitsRetained: true,
      outputFrameAvailable:
        req.videoStrategy !== 'INTERPOLATION_REQUIRED' &&
        req.videoStrategy !== 'OPTICAL_FLOW_REQUIRED',
      metadataOnly: true,
      warnings:
        req.videoStrategy === 'EXACT_SOURCE_FRAME'
          ? []
          : ['metadata-only frame-selection requirement'],
      safeMetadata: { noGeneratedFrame: true },
    };
  }
  createCadencePlan(plan: ReplayVariableSpeedPlan): ReplayCadenceState {
    const r = plan.resolvedRate;
    const type: ReplayCadenceType =
      plan.resolvedVideoStrategy === 'INTERPOLATION_REQUIRED'
        ? 'INTERPOLATION_REQUIRED'
        : plan.resolvedVideoStrategy === 'HIGH_FRAME_RATE_NATIVE_METADATA'
          ? 'HFR_NATIVE_METADATA'
          : r.normalizedNumerator === r.normalizedDenominator
            ? 'ONE_TO_ONE'
            : r.normalizedNumerator < r.normalizedDenominator
              ? 'FRAME_REPEAT_METADATA'
              : 'FRAME_DROP_METADATA';
    return {
      cadenceId: `cadence-${plan.planId}`,
      cadenceGeneration: plan.playbackSessionGeneration + 1,
      playbackSessionId: plan.playbackSessionId,
      playbackSessionGeneration: plan.playbackSessionGeneration,
      sourceFrameRate: [30000, 1001] as const,
      outputFrameRate: [30000, 1001] as const,
      playbackRate: r,
      cadenceType: type,
      cadencePeriod: Math.min(120, r.normalizedDenominator + r.normalizedNumerator),
      sourceFramesConsumed: r.normalizedNumerator,
      outputFramesPlanned: r.normalizedDenominator,
      repeatedFrameCountMetadata:
        type === 'FRAME_REPEAT_METADATA' ? r.normalizedDenominator - r.normalizedNumerator : 0,
      droppedFrameCountMetadata:
        type === 'FRAME_DROP_METADATA' ? r.normalizedNumerator - r.normalizedDenominator : 0,
      interpolatedFrameCountRequiredMetadata: type === 'INTERPOLATION_REQUIRED' ? 1 : 0,
      currentCadenceIndex: 0,
      deterministicPatternSignature: `${type}:${r.normalizedNumerator}/${r.normalizedDenominator}`,
      safeMetadata: { bounded: true, noGeneratedFrame: true },
    };
  }
  evaluateAudioStrategy(plan: ReplayVariableSpeedPlan) {
    const r = plan.resolvedRate;
    const non = r.rateClass !== 'NORMAL' || plan.resolvedDirection !== 'FORWARD';
    const a = plan.resolvedAudioStrategy;
    return {
      audioStateId: `audio-${plan.planId}`,
      audioStateGeneration: plan.playbackSessionGeneration + 1,
      playbackSessionId: plan.playbackSessionId,
      playbackSessionGeneration: plan.playbackSessionGeneration,
      effectiveRate: r,
      direction: plan.resolvedDirection,
      audioStrategy: a,
      replayAudioAvailable: !non,
      selectedAudioBehavior: non ? 'MUTE_OR_PROGRAM_AUDIO_METADATA' : 'FOLLOW_AT_1X',
      muteRequested: a === 'MUTE_AT_NONSTANDARD_RATE' || non,
      programAudioContinuationRequested: a === 'CONTINUE_PROGRAM_AUDIO_METADATA',
      timeStretchRequired: a === 'TIME_STRETCH_REQUIRED',
      pitchPreservationRequired: a === 'PITCH_PRESERVATION_REQUIRED',
      reverseAudioRequired:
        a === 'REVERSE_AUDIO_REQUIRED' || plan.resolvedDirection === 'REVERSE_METADATA',
      resampleRequired: a === 'RESAMPLE_REQUIRED',
      mixerCommandDelegationMetadata: false,
      metadataOnly: true,
      warnings: non ? ['unsupported altered-speed audio marked metadata-only'] : [],
      safeMetadata: { noPcm: true, noMixerMutation: true },
    };
  }
  evaluateAvSync(pos: ReplayVariableSpeedPositionState, audio: ReplayVariableSpeedAudioState) {
    const degraded =
      audio.metadataOnly &&
      (audio.muteRequested || audio.timeStretchRequired || audio.reverseAudioRequired);
    return {
      syncStateId: `sync-${pos.positionId}`,
      syncGeneration: pos.positionGeneration,
      playbackSessionId: pos.playbackSessionId,
      playbackSessionGeneration: pos.playbackSessionGeneration,
      effectiveRate: pos.effectiveRate,
      direction: pos.direction,
      selectedVideoSourcePtsNs: pos.sourcePtsNs,
      selectedAudioSourcePtsMetadataNs: pos.sourcePtsNs,
      outputVideoPtsNs: pos.outputPtsNs,
      outputAudioPtsMetadataNs: pos.outputPtsNs,
      skewNs: 0n,
      driftMetadataNs: 0n,
      synchronized: !degraded,
      degraded,
      audioProcessingRequired:
        audio.timeStretchRequired || audio.pitchPreservationRequired || audio.resampleRequired,
      videoInterpolationRequired: false,
      metadataOnly: degraded,
      safeMetadata: { noSecondSyncEngine: true },
    };
  }
  evaluateProgramEligibility(plan: ReplayVariableSpeedPlan) {
    const eligible = plan.programInsertionEligibility;
    return {
      eligibilityId: `elig-${plan.planId}`,
      generation: plan.playbackSessionGeneration + 1,
      playbackSessionId: plan.playbackSessionId,
      playbackSessionGeneration: plan.playbackSessionGeneration,
      requestedRate: plan.resolvedRate,
      direction: plan.resolvedDirection,
      videoStrategy: plan.resolvedVideoStrategy,
      audioStrategy: plan.resolvedAudioStrategy,
      realFrameOutputAvailable: eligible,
      realAudioOutputAvailable: eligible,
      metadataOnly: !eligible,
      replayPreviewEligible: true,
      programCandidateEligible: eligible,
      programInsertionEligible: eligible,
      blockingReasons: eligible ? [] : ['METADATA_ONLY_ALTERED_SPEED_NOT_PROGRAM_READY'],
      warnings: eligible ? [] : ['Replay Preview metadata only'],
      safeMetadata: { requiresRealBackendForProgram: !eligible },
    };
  }
  createRampPlan(r: ReplaySpeedRampDefinition): ReplaySpeedRampDefinition {
    if (r.durationTicks < 1 || r.durationTicks > 10000)
      throw new ReplayVariableSpeedError('ReplaySpeedRampInvalid', 'bounded duration violated');
    return {
      ...r,
      state: 'VALIDATED' as const,
      safeMetadata: { ...r.safeMetadata, noRealInterpolation: true },
    };
  }
  resetToNormalSpeed(s: string) {
    return createReplayPlaybackRate(`reset-${s}`, 1, 1);
  }
  reset() {}
  drain() {}
  reconfigure(_m: SafeMetadata) {}
  shutdownSession(_s: string) {}
  shutdown() {
    this.stopped = true;
  }
  snapshot(): ReplayVariableSpeedBackendSnapshot {
    return {
      backendId: this.descriptor.backendId,
      backendGeneration: this.descriptor.backendGeneration,
      capabilities: this.capabilities,
      health: this.stopped ? ('stopped' as const) : ('healthy' as const),
      safeMetadata: { syntheticOnly: true },
    };
  }
}
export function createSyntheticReplayVariableSpeedBackend() {
  return new SyntheticReplayVariableSpeedBackend();
}
export class ReplayVariableSpeedEngine {
  private backends = new Map<string, ReplayVariableSpeedBackend>();
  private profiles = new Map<string, ReplaySpeedProfile>();
  private capabilities = new Map<string, ReplaySourceMotionCapability>();
  private requests = new Map<string, ReplayVariableSpeedRequest>();
  private plans = new Map<string, ReplayVariableSpeedPlan>();
  private results = new Map<string, ReplayVariableSpeedResult>();
  private mappings = new Map<string, ReplayVariableSpeedClockMapping>();
  private positions = new Map<string, ReplayVariableSpeedPositionState>();
  private selections = new Map<string, ReplayFrameSelectionPlan>();
  private cadences = new Map<string, ReplayCadenceState>();
  private ticks = new Set<string>();
  private counters: Record<string, number> = {};
  private stopped = false;
  constructor() {
    for (const p of createBuiltInReplaySpeedProfiles()) this.profiles.set(p.speedProfileId, p);
    this.registerBackend(createSyntheticReplayVariableSpeedBackend());
  }
  private inc(k: string) {
    this.counters[k] = (this.counters[k] ?? 0) + 1;
  }
  registerBackend(b: ReplayVariableSpeedBackend) {
    if (this.stopped)
      throw new ReplayVariableSpeedError('ReplayVariableSpeedShutdownError', 'shutdown');
    if (this.backends.has(b.descriptor.backendId))
      throw new ReplayVariableSpeedError(
        'DuplicateReplayVariableSpeedBackend',
        'duplicate backend',
      );
    this.backends.set(b.descriptor.backendId, b);
    this.inc('backendRegistrations');
    return b.snapshot();
  }
  unregisterBackend(id: string) {
    const ok = this.backends.delete(id);
    this.inc('backendRemovals');
    return ok;
  }
  selectBackend() {
    const b = [...this.backends.values()].sort((a, b) =>
      a.descriptor.backendId.localeCompare(b.descriptor.backendId),
    )[0];
    if (!b)
      throw new ReplayVariableSpeedError('ReplayVariableSpeedBackendNotFound', 'backend not found');
    return b;
  }
  registerProfile(p: ReplaySpeedProfile) {
    if (this.profiles.has(p.speedProfileId))
      throw new ReplayVariableSpeedError('DuplicateReplaySpeedProfile', 'duplicate profile');
    this.profiles.set(p.speedProfileId, p);
    this.inc('profileRegistrations');
    return p;
  }
  updateProfile(id: string, expected: number, patch: Partial<ReplaySpeedProfile>) {
    const p = this.profiles.get(id);
    if (!p) throw new ReplayVariableSpeedError('ReplaySpeedProfileNotFound', 'profile not found');
    if (p.profileGeneration !== expected)
      throw new ReplayVariableSpeedError(
        'ReplayVariableSpeedGenerationMismatch',
        'stale profile generation',
      );
    const n = {
      ...p,
      ...patch,
      profileGeneration: p.profileGeneration + 1,
      updatedAtNs: now(),
    } as ReplaySpeedProfile;
    this.profiles.set(id, Object.freeze(n));
    this.inc('profileUpdates');
    return n;
  }
  registerSourceCapability(c: ReplaySourceMotionCapability) {
    if (
      c.highFrameRate &&
      !c.realHighFrameRateProcessing &&
      c.maximumNativeSlowMotionFactor.normalizedNumerator === 0
    )
      throw new ReplayVariableSpeedError(
        'ReplaySourceMotionCapabilityInvalid',
        'false HFR claim rejected',
      );
    this.capabilities.set(c.capabilityId, c);
    this.inc('capabilityRegistrations');
    return c;
  }
  submitRequest(req: ReplayVariableSpeedRequest) {
    if (this.stopped)
      throw new ReplayVariableSpeedError('ReplayVariableSpeedShutdownError', 'shutdown');
    if (this.requests.has(req.requestId)) {
      this.inc('duplicateRequests');
      throw new ReplayVariableSpeedError(
        'ReplayVariableSpeedDuplicateRequest',
        'duplicate request',
      );
    }
    const p = this.profiles.get(req.speedProfileId);
    if (!p) throw new ReplayVariableSpeedError('ReplaySpeedProfileNotFound', 'profile not found');
    if (p.profileGeneration !== req.expectedSpeedProfileGeneration)
      throw new ReplayVariableSpeedError(
        'ReplayVariableSpeedGenerationMismatch',
        'stale profile generation',
      );
    const cap =
      [...this.capabilities.values()].find(
        (c) => c.capabilityGeneration === req.expectedSourceCapabilityGeneration,
      ) ?? defaultCapability(req.expectedSourceCapabilityGeneration);
    const b = this.selectBackend();
    const prev = createReplayPlaybackRate('previous-1x', 1, 1);
    const plan = b.createVariableSpeedPlan(req, p, cap, prev);
    const mapping = b.createClockMapping(plan, req.requestedRuntimeFrame);
    const position = b.resolvePosition(mapping, [0, 1000]);
    const fsReq: ReplayFrameSelectionRequest = {
      selectionRequestId: `fs-${req.requestId}`,
      playbackSessionId: req.playbackSessionId,
      playbackSessionGeneration: req.expectedPlaybackSessionGeneration,
      variableSpeedPositionGeneration: position.positionGeneration,
      replayBufferId: 'redacted-buffer',
      replayBufferGeneration: req.expectedReplayBufferGeneration,
      replayRangeId: 'redacted-range',
      replayRangeGeneration: req.expectedReplayRangeGeneration,
      requestedRuntimeFrame: req.requestedRuntimeFrame,
      requestedSourcePosition: position.sourceSequencePosition,
      rate: req.requestedRate,
      direction: req.requestedDirection,
      videoStrategy: req.requestedVideoStrategy,
      sourceCapabilityGeneration: req.expectedSourceCapabilityGeneration,
      lookaheadGeneration: 1,
      safeMetadata: { redacted: true },
    };
    const sel = b.createFrameSelectionPlan(fsReq);
    const cadence = b.createCadencePlan(plan);
    const elig = b.evaluateProgramEligibility(plan);
    const result: ReplayVariableSpeedResult = {
      requestId: req.requestId,
      planId: plan.planId,
      status: plan.metadataOnly ? 'APPLIED_METADATA' : 'VALIDATED',
      runtimeFrame: req.requestedRuntimeFrame,
      playbackSessionId: req.playbackSessionId,
      playbackSessionGeneration: req.expectedPlaybackSessionGeneration,
      speedProfileId: p.speedProfileId,
      speedProfileGeneration: p.profileGeneration,
      previousRate: prev,
      effectiveRate: req.requestedRate,
      previousDirection: prev.direction,
      effectiveDirection: req.requestedDirection,
      videoStrategy: req.requestedVideoStrategy,
      audioStrategy: req.requestedAudioStrategy,
      positionGeneration: position.positionGeneration,
      clockMappingGeneration: mapping.mappingGeneration,
      cadenceGeneration: cadence.cadenceGeneration,
      programEligibility: elig,
      metadataOnly: plan.metadataOnly,
      realVariableSpeedProcessing: false,
      realFrameInterpolation: false,
      realOpticalFlow: false,
      realAudioTimeStretch: false,
      realPitchPreservation: false,
      warnings: plan.warnings,
      completedAtNs: now(),
    };
    this.requests.set(req.requestId, req);
    this.plans.set(plan.planId, plan);
    this.mappings.set(mapping.mappingId, mapping);
    this.positions.set(`${req.playbackSessionId}:${req.requestedRuntimeFrame}`, position);
    this.selections.set(sel.selectionPlanId, sel);
    this.cadences.set(cadence.cadenceId, cadence);
    this.results.set(req.requestId, result);
    [
      'variableSpeedRequests',
      'variableSpeedPlans',
      'variableSpeedResults',
      'clockMappingUpdates',
      'positionUpdates',
      'frameSelectionPlans',
      'cadenceChanges',
      'programEligibilityEvaluations',
    ].forEach((k) => this.inc(k));
    return result;
  }
  processTick(tick: FrameTick) {
    const k = String(tick.frameNumber);
    if (this.ticks.has(k)) {
      this.inc('duplicateTicks');
      throw new ReplayVariableSpeedError('ReplayVariableSpeedDuplicateRequest', 'duplicate tick');
    }
    this.ticks.add(k);
    this.inc('processorTicks');
    return this.snapshot().health;
  }
  assertInvariants() {
    const errs: string[] = [];
    const uniq = <T>(xs: T[]) => new Set(xs).size === xs.length;
    if (!uniq([...this.backends.keys()])) errs.push('backend IDs unique');
    for (const r of this.snapshot().rates) {
      if (r.normalizedDenominator <= 0) errs.push('denominator positive');
      if (r.numerator < 0) errs.push('negative numerator');
    }
    if (this.stopped && (this.requests.size || this.plans.size))
      errs.push('shutdown leaves active state');
    if (errs.length)
      throw new ReplayVariableSpeedError('ReplayVariableSpeedInvariantViolation', errs.join('; '));
    return {
      valid: true,
      errors: [],
      warnings: [],
      checkedAtNs: '1',
      safeMetadata: { invariants: true },
    };
  }
  shutdown() {
    for (const b of this.backends.values()) b.shutdown();
    this.requests.clear();
    this.plans.clear();
    this.mappings.clear();
    this.positions.clear();
    this.selections.clear();
    this.cadences.clear();
    this.stopped = true;
    this.inc('shutdowns');
  }
  snapshot(): ReplayVariableSpeedEngineSnapshot {
    const rates = [...this.profiles.values()]
      .map((p) => p.defaultRate)
      .sort((a, b) => a.rateId.localeCompare(b.rateId));
    const profiles = [...this.profiles.values()]
      .sort((a, b) => a.speedProfileId.localeCompare(b.speedProfileId))
      .map((p) => ({
        ...p,
        defaultRate: snapRate(p.defaultRate),
        allowedRates: p.allowedRates.map(snapRate),
        createdAtNs: String(p.createdAtNs),
        updatedAtNs: String(p.updatedAtNs),
      }));
    const results = [...this.results.values()].map(resultSnap);
    return Object.freeze({
      rates: rates.map(snapRate),
      profiles,
      capabilities: [...this.capabilities.values()].sort((a, b) =>
        a.capabilityId.localeCompare(b.capabilityId),
      ),
      requests: [...this.requests.values()].map(reqSnap),
      plans: [...this.plans.values()].map(planSnap),
      results,
      mappings: [...this.mappings.values()].map((m) =>
        bigSnap<ReplayVariableSpeedClockMapping, ReplayVariableSpeedClockMappingSnapshot>(m),
      ),
      positions: [...this.positions.values()].map(posSnap),
      selections: [...this.selections.values()].map((s) =>
        bigSnap<ReplayFrameSelectionPlan, ReplayFrameSelectionPlanSnapshot>(s),
      ),
      cadences: [...this.cadences.values()].map(cadenceSnap),
      health: this.health(),
      telemetry: {
        counters: { ...this.counters },
        activeSessionIds: [
          ...new Set([...this.positions.values()].map((p) => p.playbackSessionId)),
        ].sort(),
        currentRequestIds: [...this.requests.keys()].sort(),
        lastEvent: this.stopped
          ? 'ReplayVariableSpeedEngineShutdown'
          : 'ReplayVariableSpeedHealthChanged',
        healthSummary: this.stopped ? 'stopped' : 'healthy',
        safeMetadata: { bounded: true },
      },
      backends: [...this.backends.values()]
        .sort((a, b) => a.descriptor.backendId.localeCompare(b.descriptor.backendId))
        .map((b) => b.snapshot()),
      shutdown: this.stopped,
    });
  }
  private health(): ReplayVariableSpeedHealthSnapshot {
    return {
      engineState: this.stopped ? 'SHUTDOWN' : 'READY',
      healthState: this.stopped ? 'stopped' : 'healthy',
      backendCount: this.backends.size,
      profileCount: this.profiles.size,
      sourceCapabilityCount: this.capabilities.size,
      activeSessionCount: new Set([...this.positions.values()].map((p) => p.playbackSessionId))
        .size,
      normalSpeedSessionCount: [...this.results.values()].filter(
        (r) => r.effectiveRate.rateClass === 'NORMAL',
      ).length,
      slowMotionMetadataSessionCount: [...this.results.values()].filter((r) =>
        r.effectiveRate.rateClass.includes('SLOW'),
      ).length,
      fastMotionMetadataSessionCount: [...this.results.values()].filter((r) =>
        r.effectiveRate.rateClass.includes('FAST'),
      ).length,
      reverseMetadataSessionCount: [...this.results.values()].filter(
        (r) => r.effectiveDirection === 'REVERSE_METADATA',
      ).length,
      freezeMetadataSessionCount: [...this.results.values()].filter(
        (r) => r.effectiveRate.rateClass === 'FREEZE_METADATA',
      ).length,
      activeRampCount: 0,
      rateChangeRequestCount: this.requests.size,
      appliedRateChangeCount: this.results.size,
      rejectedRateChangeCount: this.counters.duplicateRequests ?? 0,
      frameSelectionPlanCount: this.selections.size,
      repeatFrameRequiredCount: [...this.selections.values()].filter((s) => s.repeatRequired)
        .length,
      droppedFrameRequiredCount: [...this.selections.values()].reduce((a, s) => a + s.dropCount, 0),
      interpolationRequiredCount: [...this.selections.values()].filter(
        (s) => s.interpolationRequired,
      ).length,
      opticalFlowRequiredCount: [...this.selections.values()].filter((s) => s.opticalFlowRequired)
        .length,
      audioTimeStretchRequiredCount: 0,
      pitchPreservationRequiredCount: 0,
      programEligibleCount: [...this.results.values()].filter(
        (r) => r.programEligibility.programInsertionEligible,
      ).length,
      programIneligibleCount: [...this.results.values()].filter(
        (r) => !r.programEligibility.programInsertionEligible,
      ).length,
      duplicateRequestCount: this.counters.duplicateRequests ?? 0,
      duplicateTickCount: this.counters.duplicateTicks ?? 0,
      staleGenerationRejectionCount: this.counters.staleGenerations ?? 0,
      invalidRateCount: this.counters.invalidRates ?? 0,
      insufficientSourceCapabilityCount: 0,
      bufferPressureConflictCount: 0,
      backendFailureCount: 0,
      ownershipViolationCount: 0,
      protectedUnitCount: 0,
      queueDepth: this.requests.size,
      peakQueueDepth: this.requests.size,
      lastEffectiveRate: resultsLast(this.results)?.effectiveRate.decimalSummaryMetadata ?? '1/1x',
      updatedAtNs: '1',
    };
  }
}
function resultsLast(m: Map<string, ReplayVariableSpeedResult>) {
  return [...m.values()].at(-1);
}
function defaultCapability(g = 1): ReplaySourceMotionCapability {
  return {
    capabilityId: `cap-${g}`,
    capabilityGeneration: g,
    replaySourceId: 'redacted-source',
    replaySourceGeneration: 1,
    sourceFrameRate: [30000, 1001],
    sourceTimeBase: [1, 1000000000],
    progressiveMetadata: true,
    interlacedMetadata: false,
    highFrameRate: false,
    maximumNativeSlowMotionFactor: createReplayPlaybackRate('native-1x', 1, 1),
    motionVectorMetadataAvailability: false,
    opticalFlowEligibilityMetadata: false,
    reverseDecodeEligibilityMetadata: false,
    frameAccurateSeekingMetadata: true,
    audioRateCapabilityMetadata: false,
    realHighFrameRateProcessing: false,
    realMotionInterpolation: false,
    realReverseDecode: false,
    safeMetadata: { redacted: true },
  };
}
const bigSnap = <T extends object, R>(o: T): R =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [k, typeof v === 'bigint' ? String(v) : v]),
  ) as unknown as R;
const reqSnap = (r: ReplayVariableSpeedRequest): ReplayVariableSpeedRequestSnapshot => ({
  ...r,
  requestedRate: snapRate(r.requestedRate),
  requestedRuntimeFrame: String(r.requestedRuntimeFrame),
  deadlineNs: String(r.deadlineNs),
});
const planSnap = (p: ReplayVariableSpeedPlan): ReplayVariableSpeedPlanSnapshot => ({
  ...p,
  previousRate: snapRate(p.previousRate),
  resolvedRate: snapRate(p.resolvedRate),
});
const posSnap = (p: ReplayVariableSpeedPositionState): ReplayVariableSpeedPositionSnapshot => ({
  ...bigSnap<
    ReplayVariableSpeedPositionState,
    Omit<ReplayVariableSpeedPositionSnapshot, 'effectiveRate'>
  >(p),
  effectiveRate: snapRate(p.effectiveRate),
});
const cadenceSnap = (c: ReplayCadenceState): ReplayCadenceSnapshot => ({
  ...c,
  playbackRate: snapRate(c.playbackRate),
});
const eligSnap = (
  e: ReplayVariableSpeedProgramEligibility,
): ReplayVariableSpeedProgramEligibilitySnapshot => ({
  ...e,
  requestedRate: snapRate(e.requestedRate),
});
const resultSnap = (r: ReplayVariableSpeedResult): ReplayVariableSpeedResultSnapshot => ({
  ...bigSnap<
    ReplayVariableSpeedResult,
    Omit<ReplayVariableSpeedResultSnapshot, 'previousRate' | 'effectiveRate' | 'programEligibility'>
  >(r),
  previousRate: snapRate(r.previousRate),
  effectiveRate: snapRate(r.effectiveRate),
  programEligibility: eligSnap(r.programEligibility),
});
export function createReplayVariableSpeedEngine() {
  return new ReplayVariableSpeedEngine();
}
export class ReplayVariableSpeedProcessor implements TickProcessor<
  ReplayVariableSpeedEngineSnapshot,
  ReplayVariableSpeedHealthSnapshot
> {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'replay-variable-speed-foundation',
    name: 'Replay Variable Speed Foundation',
    version: REPLAY_VARIABLE_SPEED_VERSION,
    order: REPLAY_VARIABLE_SPEED_PROCESSOR_ORDER,
    phase: 'POST_TICK',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: ['replay-playback-program-insertion'],
    optionalCapabilities: ['replay-variable-speed-metadata'],
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
  constructor(readonly engine: ReplayVariableSpeedEngine) {}
  initialize() {
    return {
      status: 'READY' as const,
      state: this.engine.snapshot(),
      metadata: { metadataOnly: true },
    };
  }
  processTick(
    tick: FrameTick,
    context: RuntimeContext | ProcessorRuntimeContext<ReplayVariableSpeedEngineSnapshot>,
  ) {
    const health = this.engine.processTick(tick);
    ('outputs' in context ? context.outputs : undefined)?.publish?.(
      this.descriptor.id,
      REPLAY_VARIABLE_SPEED_OUTPUT_KEYS.engineHealth,
      health,
      'BORROWED',
    );
    ('outputs' in context ? context.outputs : undefined)?.publish?.(
      this.descriptor.id,
      REPLAY_VARIABLE_SPEED_OUTPUT_KEYS.telemetry,
      this.engine.snapshot().telemetry,
      'BORROWED',
    );
    return { status: 'SUCCEEDED' as const, value: health };
  }
  shutdown() {
    this.engine.shutdown();
    return { status: 'STOPPED' as const, metadata: { metadataOnly: true } };
  }
}
export function createReplayVariableSpeedProcessor(engine = createReplayVariableSpeedEngine()) {
  return new ReplayVariableSpeedProcessor(engine);
}
export function createReplayVariableSpeedCommandHandlers(
  engine: ReplayVariableSpeedEngine,
): Readonly<Record<ReplayVariableSpeedCommandType, RuntimeCommandHandler>> {
  const h = (
    type: ReplayVariableSpeedCommandType,
    fn: (p: Record<string, unknown>) => unknown,
  ): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute(c: RuntimeCommand) {
      try {
        return {
          status: 'SUCCEEDED',
          value: fn(
            (c as RuntimeCommand & { readonly payload?: Record<string, unknown> }).payload ?? {},
          ),
        };
      } catch (e) {
        return { status: 'FAILED', error: e instanceof Error ? e.message : String(e) };
      }
    },
  });
  return Object.fromEntries(
    REPLAY_VARIABLE_SPEED_COMMAND_TYPES.map((t) => [
      t,
      h(t, (p) => {
        switch (t) {
          case 'REPLAY_SPEED_REGISTER_BACKEND':
            return engine.registerBackend(p.backend as ReplayVariableSpeedBackend);
          case 'REPLAY_SPEED_UNREGISTER_BACKEND':
            return engine.unregisterBackend(String(p.backendId));
          case 'REPLAY_SPEED_REGISTER_PROFILE':
            return engine.registerProfile(p.profile as ReplaySpeedProfile);
          case 'REPLAY_SPEED_UPDATE_PROFILE':
            return engine.updateProfile(
              String(p.profileId),
              Number(p.expectedGeneration),
              (p.patch as Partial<ReplaySpeedProfile>) ?? {},
            );
          case 'REPLAY_SPEED_REGISTER_SOURCE_CAPABILITY':
            return engine.registerSourceCapability(p.capability as ReplaySourceMotionCapability);
          case 'REPLAY_SPEED_CREATE_RATE':
            return createReplayPlaybackRate(
              String(p.rateId),
              Number(p.numerator),
              Number(p.denominator),
              p.direction as ReplayPlaybackDirection,
              p.videoStrategy as ReplayVideoStrategy,
              p.audioStrategy as ReplayAudioStrategy,
            );
          case 'REPLAY_SPEED_SET_RATE':
          case 'REPLAY_SPEED_SET_DIRECTION':
          case 'REPLAY_SPEED_APPLY_PROFILE':
          case 'REPLAY_SPEED_FREEZE_METADATA':
          case 'REPLAY_SPEED_RESET_TO_1X':
            return engine.submitRequest(p.request as ReplayVariableSpeedRequest);
          case 'REPLAY_SPEED_VALIDATE':
            return engine.assertInvariants();
          case 'REPLAY_SPEED_SHUTDOWN':
            return engine.shutdown();
          default:
            return engine.snapshot();
        }
      }),
    ]),
  ) as Readonly<Record<ReplayVariableSpeedCommandType, RuntimeCommandHandler>>;
}
export function createReplayVariableSpeedSourceGraphSnapshot(engine: ReplayVariableSpeedEngine) {
  const s = engine.snapshot();
  return {
    playbackSessions: s.positions.map((p) => ({
      playbackSessionId: p.playbackSessionId,
      effectiveRationalRate: p.effectiveRate.decimalSummaryMetadata,
      direction: p.direction,
      rateClass: p.effectiveRate.rateClass,
      frameSelectionSummary: s.selections.at(-1)?.strategy ?? 'NONE',
      cadenceSummary: s.cadences.at(-1)?.deterministicPatternSignature ?? 'NONE',
      programEligibility: s.results.at(-1)?.programEligibility.programInsertionEligible ?? false,
      metadataOnly: true,
      realVariableSpeedProcessing: false,
    })),
    health: s.health,
    readiness: s.capabilities.map((c) => ({
      capabilityGeneration: c.capabilityGeneration,
      highFrameRate: c.highFrameRate,
      metadataOnly: true,
    })),
    safeMetadata: { redacted: true, noPayloads: true },
  };
}
