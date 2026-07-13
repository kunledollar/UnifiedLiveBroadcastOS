import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeCommand,
  type RuntimeCommandHandler,
  type TickProcessor,
} from './execution-engine.js';

export const AUDIO_BUS_TYPES = [
  'PROGRAM_AUDIO',
  'PREVIEW_AUDIO',
  'AUX_AUDIO',
  'CLEAN_FEED_AUDIO',
  'MONITOR_AUDIO',
  'CUSTOM',
] as const;
export type AudioBusType = (typeof AUDIO_BUS_TYPES)[number];
export const AUDIO_FOLLOW_MODES = [
  'FOLLOW_PROGRAM_SCENE',
  'FOLLOW_SELECTED_SOURCE',
  'FOLLOW_PRIMARY_AUDIO_SOURCE',
  'FOLLOW_SCENE_DEFAULT',
  'MANUAL',
  'HOLD_CURRENT',
  'MUTE',
  'CUSTOM',
] as const;
export type AudioFollowMode = (typeof AUDIO_FOLLOW_MODES)[number];
export const AUDIO_ROLES = [
  'PRIMARY',
  'HOST_MIC',
  'GUEST_MIC',
  'DESKTOP_AUDIO',
  'BROWSER_AUDIO',
  'MEDIA_AUDIO',
  'MUSIC',
  'AMBIENCE',
  'REMOTE_GUEST',
  'TALKBACK',
  'CUSTOM',
] as const;
export type AudioRole = (typeof AUDIO_ROLES)[number];
export const AUDIO_SWITCH_MODES = [
  'CUT',
  'CROSSFADE',
  'FADE_OUT_IN',
  'FADE_TO_SILENCE',
  'HOLD_CURRENT',
  'CONTINUE_COMMON_SOURCES',
  'MUTE_THEN_SWITCH',
  'CUSTOM',
] as const;
export type AudioSwitchMode = (typeof AUDIO_SWITCH_MODES)[number];
export const AUDIO_EASINGS = [
  'LINEAR',
  'EASE_IN',
  'EASE_OUT',
  'EASE_IN_OUT',
  'SINE_IN',
  'SINE_OUT',
  'SINE_IN_OUT',
  'CUBIC_IN',
  'CUBIC_OUT',
  'CUBIC_IN_OUT',
] as const;
export type AudioEasing = (typeof AUDIO_EASINGS)[number];
export const AUDIO_COMMON_SOURCE_POLICIES = [
  'KEEP_CONTINUOUS',
  'RESTART',
  'FADE_OUT_IN',
  'REDUCE_TO_ONE_REFERENCE',
  'DUPLICATE_REFERENCE_REJECTED',
  'CUSTOM',
] as const;
export type AudioCommonSourcePolicy = (typeof AUDIO_COMMON_SOURCE_POLICIES)[number];
export const AUDIO_PERSISTENT_POLICIES = [
  'PERSIST_ACROSS_SCENES',
  'STOP_ON_SCENE_EXIT',
  'FOLLOW_TARGET_SCENE',
  'FADE_OUT_ON_EXIT',
  'KEEP_UNTIL_EXPLICIT_STOP',
  'CUSTOM',
] as const;
export type AudioPersistentPolicy = (typeof AUDIO_PERSISTENT_POLICIES)[number];
export const AUDIO_MISSING_SOURCE_POLICIES = [
  'FAIL_AUDIO_ROUTE',
  'MUTE_MISSING_SOURCE',
  'SKIP_OPTIONAL_SOURCE',
  'HOLD_CURRENT_PROGRAM_AUDIO',
  'USE_SCENE_FALLBACK_SOURCE',
  'USE_SILENCE_METADATA',
  'DEGRADE_AUDIO_ROUTE',
  'REQUEST_OPERATOR_INTERVENTION',
] as const;
export type AudioMissingSourcePolicy = (typeof AUDIO_MISSING_SOURCE_POLICIES)[number];
export const AUDIO_VIDEO_FAILURE_POLICIES = [
  'PRESERVE_PROGRAM_VIDEO_AND_AUDIO',
  'SWITCH_VIDEO_HOLD_AUDIO',
  'SWITCH_VIDEO_MUTE_AUDIO',
  'FAIL_ENTIRE_SWITCH',
  'ROLLBACK_VIDEO_AND_AUDIO',
  'DEGRADE_AND_NOTIFY',
  'CUSTOM',
] as const;
export type AudioVideoFailurePolicy = (typeof AUDIO_VIDEO_FAILURE_POLICIES)[number];
export const AUDIO_ROUTING_TRANSACTION_STATES = [
  'CREATED',
  'VALIDATING',
  'READY',
  'SCHEDULED',
  'RUNNING',
  'COMMITTING',
  'COMMITTED',
  'COMPLETED',
  'CANCELLING',
  'CANCELLED',
  'ROLLING_BACK',
  'ROLLED_BACK',
  'FAILED',
] as const;
export type AudioRoutingTransactionState = (typeof AUDIO_ROUTING_TRANSACTION_STATES)[number];
export const AUDIO_ROUTING_RESULT_STATUSES = [
  'COMPLETED',
  'RUNNING',
  'DEGRADED',
  'MUTED',
  'HELD',
  'CANCELLED',
  'ROLLED_BACK',
  'FAILED',
  'REJECTED',
] as const;
export type AudioRoutingResultStatus = (typeof AUDIO_ROUTING_RESULT_STATUSES)[number];
export const AUDIO_FOLLOW_COMMAND_TYPES = [
  'AUDIO_FOLLOW_SET_MODE',
  'AUDIO_FOLLOW_REGISTER_MEMBERSHIP',
  'AUDIO_FOLLOW_UPDATE_MEMBERSHIP',
  'AUDIO_FOLLOW_UNREGISTER_MEMBERSHIP',
  'AUDIO_FOLLOW_SET_PROGRAM_ROUTE',
  'AUDIO_FOLLOW_SET_PREVIEW_ROUTE',
  'AUDIO_FOLLOW_START',
  'AUDIO_FOLLOW_CUT',
  'AUDIO_FOLLOW_TAKE',
  'AUDIO_FOLLOW_AUTO',
  'AUDIO_FOLLOW_CANCEL',
  'AUDIO_FOLLOW_ROLLBACK',
  'AUDIO_FOLLOW_MUTE_PROGRAM',
  'AUDIO_FOLLOW_UNMUTE_PROGRAM',
  'AUDIO_FOLLOW_SET_PERSISTENT_SOURCE',
  'AUDIO_FOLLOW_CLEAR_PERSISTENT_SOURCE',
  'AUDIO_FOLLOW_SET_TRANSITION',
  'AUDIO_FOLLOW_SET_FAILURE_POLICY',
  'AUDIO_FOLLOW_VALIDATE',
  'AUDIO_FOLLOW_SHUTDOWN',
] as const;
export type AudioFollowCommandType = (typeof AUDIO_FOLLOW_COMMAND_TYPES)[number];
export const AUDIO_FOLLOW_EVENTS = [
  'AudioFollowEngineCreated',
  'SceneAudioMembershipRegistered',
  'SceneAudioMembershipUpdated',
  'SceneAudioMembershipRemoved',
  'ProgramAudioRoutePrepared',
  'ProgramAudioRouteCommitted',
  'PreviewAudioRouteChanged',
  'AudioRoutingRequested',
  'AudioRoutingValidated',
  'AudioRoutingRejected',
  'AudioRoutingScheduled',
  'AudioRoutingStarted',
  'AudioTransitionProgressed',
  'AudioSourcePersisted',
  'AudioSourceMuted',
  'AudioSourceMissing',
  'AudioRoutingCompleted',
  'AudioRoutingCancelled',
  'AudioRoutingRollbackStarted',
  'AudioRoutingRolledBack',
  'AudioRoutingFailed',
  'AudioVideoSyncChanged',
  'AudioFollowHealthChanged',
  'AudioFollowEngineShutdown',
] as const;
export const AUDIO_FOLLOW_WATCHDOG_INCIDENTS = [
  'AUDIO_FOLLOW_ENGINE_STALLED',
  'AUDIO_FOLLOW_TRANSACTION_TIMEOUT',
  'AUDIO_FOLLOW_DUPLICATE_REQUEST',
  'AUDIO_FOLLOW_DUPLICATE_COMMIT',
  'AUDIO_FOLLOW_DUPLICATE_TICK',
  'AUDIO_FOLLOW_ROUTE_GENERATION_STALE',
  'AUDIO_FOLLOW_SCENE_GENERATION_STALE',
  'AUDIO_FOLLOW_SOURCE_GENERATION_STALE',
  'AUDIO_FOLLOW_REQUIRED_SOURCE_MISSING',
  'AUDIO_FOLLOW_SOURCE_UNAVAILABLE',
  'AUDIO_FOLLOW_CONTRIBUTION_INVALID',
  'AUDIO_FOLLOW_AUDIO_VIDEO_SYNC_MISMATCH',
  'AUDIO_FOLLOW_PROGRAM_ROUTE_COMMIT_FAILED',
  'AUDIO_FOLLOW_ROLLBACK_FAILED',
  'AUDIO_FOLLOW_OUTPUT_REGISTRY_MISMATCH',
  'AUDIO_FOLLOW_PROGRAM_PREVIEW_LEAK',
  'AUDIO_FOLLOW_INVARIANT_FAILURE',
] as const;
export const AUDIO_FOLLOW_ERRORS = [
  'AudioFollowEngineNotReady',
  'SceneAudioMembershipNotFound',
  'DuplicateSceneAudioMembership',
  'SceneAudioMembershipInvalid',
  'AudioFollowSourceNotFound',
  'AudioFollowSourceUnavailable',
  'AudioFollowSourceGenerationMismatch',
  'AudioFollowRouteNotFound',
  'AudioFollowRouteGenerationMismatch',
  'AudioFollowTransactionNotFound',
  'AudioFollowDuplicateRequest',
  'AudioFollowTransactionConflict',
  'AudioFollowStateTransitionInvalid',
  'AudioFollowTransitionInvalid',
  'AudioFollowContributionInvalid',
  'AudioFollowProgramCommitFailed',
  'AudioFollowVideoSyncMismatch',
  'AudioFollowTimeout',
  'AudioFollowCancelled',
  'AudioFollowRollbackFailed',
  'AudioFollowInvariantViolation',
  'AudioFollowShutdownError',
] as const;
export const AUDIO_FOLLOW_OUTPUT_KEYS = Object.freeze({
  programRoute: 'audioFollow.programRoute',
  previewRoute: 'audioFollow.previewRoute',
  previousProgramRoute: 'audioFollow.previousProgramRoute',
  activeTransaction: 'audioFollow.activeTransaction',
  request: 'audioFollow.request',
  result: 'audioFollow.result',
  transitionContributions: 'audioFollow.transitionContributions',
  persistentSources: 'audioFollow.persistentSources',
  mutedSources: 'audioFollow.mutedSources',
  health: 'audioFollow.health',
  telemetry: 'audioFollow.telemetry',
  failedOrRejectedResults: 'audioFollow.failedOrRejectedResults',
});
export const AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS = Object.freeze({
  ...AUDIO_FOLLOW_OUTPUT_KEYS,
  programAudioRoute: AUDIO_FOLLOW_OUTPUT_KEYS.programRoute,
  previewAudioRoute: AUDIO_FOLLOW_OUTPUT_KEYS.previewRoute,
});

export class AudioFollowVideoError extends RuntimeEngineError {
  constructor(
    code: (typeof AUDIO_FOLLOW_ERRORS)[number],
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(code, message, sanitize(details) as Record<string, unknown>);
  }
}
export interface AudioFollowSourceReference {
  readonly sourceId: string;
  readonly streamId: string;
  readonly sourceGeneration: number;
  readonly streamGeneration: number;
  readonly category: string;
  readonly role: AudioRole;
  readonly availability: 'AVAILABLE' | 'UNAVAILABLE' | 'MISSING';
  readonly active: boolean;
  readonly muted: boolean;
  readonly persistent: boolean;
  readonly sampleRateHz?: number;
  readonly channels?: number;
  readonly clockDomain?: string;
  readonly health: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
  readonly lastBufferTimestampNs?: string;
  readonly safeMetadata: Record<string, unknown>;
}
export interface SceneAudioMembership {
  readonly sceneId: string;
  readonly sceneGeneration: number;
  readonly sceneInstanceId: string;
  readonly sceneInstanceGeneration: number;
  readonly sources: readonly AudioFollowSourceReference[];
  readonly defaultProgramAudioSourceIds: readonly string[];
  readonly optionalAudioSourceIds: readonly string[];
  readonly persistentAudioSourceIds: readonly string[];
  readonly mutedSourceIds: readonly string[];
  readonly soloSourceIds: readonly string[];
  readonly sourcePriorities: Readonly<Record<string, number>>;
  readonly roleMappings: Readonly<Record<string, AudioRole>>;
  readonly routingPolicy: {
    readonly followMode: AudioFollowMode;
    readonly missingSourcePolicy: AudioMissingSourcePolicy;
    readonly failurePolicy: AudioVideoFailurePolicy;
    readonly fallbackSourceId?: string;
  };
  readonly transitionPolicy: {
    readonly switchMode: AudioSwitchMode;
    readonly commonSourcePolicy: AudioCommonSourcePolicy;
    readonly persistentPolicy: AudioPersistentPolicy;
  };
  readonly safeMetadata: Record<string, unknown>;
}
export interface AudioTransitionDefinition {
  readonly audioTransitionId: string;
  readonly version: number;
  readonly generation: number;
  readonly mode: AudioSwitchMode;
  readonly durationFrames: number;
  readonly durationNs: string;
  readonly easing: AudioEasing;
  readonly sourceFadePolicy: string;
  readonly targetFadePolicy: string;
  readonly commonSourcePolicy: AudioCommonSourcePolicy;
  readonly persistentSourcePolicy: AudioPersistentPolicy;
  readonly mutePolicy: string;
  readonly silencePolicy: string;
  readonly perRoleOverrides: Readonly<Record<string, unknown>>;
  readonly safeMetadata: Record<string, unknown>;
}
export interface AudioTransitionContribution {
  readonly sourceId: string;
  readonly sourceSceneId: string;
  readonly targetSceneId: string;
  readonly role: AudioRole;
  readonly sourceContribution: number;
  readonly targetContribution: number;
  readonly effectiveContribution: number;
  readonly muted: boolean;
  readonly persistent: boolean;
  readonly commonSource: boolean;
  readonly runtimeFrame: string;
  readonly transitionProgress: number;
  readonly safeMetadata: Record<string, unknown>;
}
export interface ProgramAudioRoute {
  readonly routeId: string;
  readonly routeGeneration: number;
  readonly busId: 'PROGRAM_AUDIO';
  readonly programSceneId: string;
  readonly programSceneGeneration: number;
  readonly activeSources: readonly AudioFollowSourceReference[];
  readonly mutedSources: readonly AudioFollowSourceReference[];
  readonly persistentSources: readonly AudioFollowSourceReference[];
  readonly contributions: readonly AudioTransitionContribution[];
  readonly transitionState: string;
  readonly transitionId?: string;
  readonly runtimeFrame: string;
  readonly health: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'MUTED';
  readonly safeMetadata: Record<string, unknown>;
}
export interface PreviewAudioRoute extends Omit<ProgramAudioRoute, 'busId'> {
  readonly busId: 'PREVIEW_AUDIO';
  readonly previewSceneId: string;
  readonly previewSceneGeneration: number;
}
export interface AudioRoutingRequest {
  readonly requestId: string;
  readonly commandId?: string;
  readonly sceneSwitchTransactionId?: string;
  readonly transitionExecutionInstanceId?: string;
  readonly sourceProgramSceneId: string;
  readonly targetProgramSceneId: string;
  readonly sourceMembership: SceneAudioMembership;
  readonly targetMembership: SceneAudioMembership;
  readonly currentProgramAudioRoute: ProgramAudioRoute;
  readonly expectedProgramAudioRouteGeneration: number;
  readonly expectedSceneGenerations: Readonly<Record<string, number>>;
  readonly expectedSourceGenerations: Readonly<Record<string, number>>;
  readonly mode: AudioSwitchMode;
  readonly transitionDefinition?: AudioTransitionDefinition;
  readonly startFrame: string;
  readonly deadlineNs?: string;
  readonly cancellationId?: string;
  readonly failurePolicy: AudioVideoFailurePolicy;
  readonly correlationId?: string;
  readonly safeMetadata: Record<string, unknown>;
}
export interface AudioRoutingTransaction {
  readonly transactionId: string;
  readonly requestId: string;
  readonly transactionGeneration: number;
  readonly state: AudioRoutingTransactionState;
  readonly sourceRoute: ProgramAudioRoute;
  readonly targetRoute: ProgramAudioRoute;
  readonly sourceMembership: SceneAudioMembership;
  readonly targetMembership: SceneAudioMembership;
  readonly transitionDefinition?: AudioTransitionDefinition;
  readonly scheduledFrame: string;
  readonly currentProgress: number;
  readonly validationReport: AudioFollowVideoValidationReport;
  readonly commitSnapshot?: ProgramAudioRoute;
  readonly rollbackSnapshot?: ProgramAudioRoute;
  readonly failureReason?: string;
  readonly createdAtNs: string;
  readonly committedAtNs?: string;
  readonly completedAtNs?: string;
  readonly safeMetadata: Record<string, unknown>;
}
export interface AudioRoutingResult {
  readonly requestId: string;
  readonly transactionId: string;
  readonly status: AudioRoutingResultStatus;
  readonly mode: AudioSwitchMode;
  readonly sourceProgramSceneId: string;
  readonly targetProgramSceneId: string;
  readonly previousProgramAudioRoute: ProgramAudioRoute;
  readonly newProgramAudioRoute: ProgramAudioRoute;
  readonly programAudioRouteGeneration: number;
  readonly committedRuntimeFrame: string;
  readonly transitionProgress: number;
  readonly contributionSummaries: readonly AudioTransitionContribution[];
  readonly persistentSourceSummaries: readonly string[];
  readonly mutedSourceSummaries: readonly string[];
  readonly videoCommitFrame: string;
  readonly audioCommitFrame: string;
  readonly audioVideoSynchronized: boolean;
  readonly realAudioMixApplied: false;
  readonly rollbackApplied: boolean;
  readonly warnings: readonly string[];
  readonly durationNs: string;
  readonly completedAtNs: string;
}
export interface AudioFollowVideoValidationReport {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly checkedAtFrame?: string;
  readonly operationCounts: Readonly<Record<string, number>>;
}
export interface AudioFollowVideoHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly programAudioRouteId: string;
  readonly previewAudioRouteId: string;
  readonly programSceneId?: string;
  readonly previewSceneId?: string;
  readonly programRouteGeneration: number;
  readonly previewRouteGeneration: number;
  readonly activeTransactionCount: number;
  readonly completedRouteCount: number;
  readonly cutRouteCount: number;
  readonly animatedRouteCount: number;
  readonly mutedRouteCount: number;
  readonly heldRouteCount: number;
  readonly degradedRouteCount: number;
  readonly rejectedCount: number;
  readonly failedCount: number;
  readonly cancelledCount: number;
  readonly rollbackCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateTickCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly missingSourceCount: number;
  readonly unavailableSourceCount: number;
  readonly persistentSourceCount: number;
  readonly commonSourceCount: number;
  readonly audioVideoSyncMismatchCount: number;
  readonly lastSuccessfulRoute?: string;
  readonly lastFailure?: string;
  readonly updatedAtNs: string;
}
export interface AudioFollowVideoTelemetrySnapshot extends Record<string, unknown> {
  readonly routeCommits: number;
  readonly routingRequests: number;
  readonly duplicateTicks: number;
  readonly currentTransactionId?: string;
  readonly activeSourceIds: readonly string[];
  readonly healthSummary: string;
}
export interface AudioFollowVideoEngineSnapshot {
  readonly memberships: readonly SceneAudioMembership[];
  readonly programRoute: ProgramAudioRoute;
  readonly previewRoute: PreviewAudioRoute;
  readonly activeTransaction?: AudioRoutingTransaction;
  readonly lastResult?: AudioRoutingResult;
  readonly health: AudioFollowVideoHealthSnapshot;
  readonly telemetry: AudioFollowVideoTelemetrySnapshot;
}
export type SceneAudioMembershipSnapshot = SceneAudioMembership;
export type AudioFollowSourceSnapshot = AudioFollowSourceReference;
export type ProgramAudioRouteSnapshot = ProgramAudioRoute;
export type PreviewAudioRouteSnapshot = PreviewAudioRoute;
export type AudioTransitionDefinitionSnapshot = AudioTransitionDefinition;
export type AudioRoutingRequestSnapshot = AudioRoutingRequest;
export type AudioRoutingTransactionSnapshot = AudioRoutingTransaction;
export type AudioTransitionContributionSnapshot = AudioTransitionContribution;
export type AudioRoutingResultSnapshot = AudioRoutingResult;

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const freeze = <T>(v: T): Readonly<T> =>
  Object.freeze(
    Array.isArray(v)
      ? (v.map((x) => (typeof x === 'object' && x ? freeze(x) : x)) as T)
      : (Object.fromEntries(
          Object.entries(v as Record<string, unknown>).map(([k, x]) => [
            k,
            typeof x === 'object' && x ? freeze(x) : x,
          ]),
        ) as T),
  );
const sanitize = (v: unknown): unknown => {
  const c = clone(v);
  const scrub = (x: unknown): unknown => {
    if (Array.isArray(x)) return x.slice(0, 64).map(scrub);
    if (x && typeof x === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(x as Record<string, unknown>).slice(0, 64)) {
        if (/secret|token|password|handle|buffer|pcm|path|url|endpoint|credential|device/i.test(k))
          out[k] = '[redacted]';
        else out[k] = scrub(val);
      }
      return out;
    }
    return x;
  };
  return scrub(c);
};
const finite01 = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1;
const sortedSources = (s: readonly AudioFollowSourceReference[]) =>
  [...s].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
export const createAudioFollowSourceReference = (
  i: Omit<AudioFollowSourceReference, 'safeMetadata'> & { safeMetadata?: Record<string, unknown> },
): AudioFollowSourceReference =>
  freeze({
    ...i,
    safeMetadata: sanitize(i.safeMetadata ?? {}) as Record<string, unknown>,
  }) as AudioFollowSourceReference;
export const createSceneAudioMembership = (
  i: Omit<SceneAudioMembership, 'safeMetadata'> & { safeMetadata?: Record<string, unknown> },
): SceneAudioMembership => {
  const ids = new Set<string>();
  for (const s of i.sources) {
    if (ids.has(s.sourceId))
      throw new AudioFollowVideoError(
        'SceneAudioMembershipInvalid',
        `duplicate source ${s.sourceId}`,
      );
    ids.add(s.sourceId);
  }
  return freeze({
    ...i,
    sources: sortedSources(i.sources),
    defaultProgramAudioSourceIds: [...i.defaultProgramAudioSourceIds].sort(),
    optionalAudioSourceIds: [...i.optionalAudioSourceIds].sort(),
    persistentAudioSourceIds: [...i.persistentAudioSourceIds].sort(),
    mutedSourceIds: [...i.mutedSourceIds].sort(),
    soloSourceIds: [...i.soloSourceIds].sort(),
    safeMetadata: sanitize(i.safeMetadata ?? {}) as Record<string, unknown>,
  }) as SceneAudioMembership;
};
export const createAudioTransitionDefinition = (
  i: Omit<AudioTransitionDefinition, 'safeMetadata'> & { safeMetadata?: Record<string, unknown> },
): AudioTransitionDefinition => {
  if (i.durationFrames <= 0 || i.durationFrames > 1_000_000)
    throw new AudioFollowVideoError(
      'AudioFollowTransitionInvalid',
      'durationFrames must be positive and bounded',
    );
  return freeze({
    ...i,
    safeMetadata: sanitize(i.safeMetadata ?? {}) as Record<string, unknown>,
  }) as AudioTransitionDefinition;
};
const ease = (p: number, e: AudioEasing) => {
  const x = Math.min(1, Math.max(0, p));
  switch (e) {
    case 'EASE_IN':
      return x * x;
    case 'EASE_OUT':
      return 1 - (1 - x) * (1 - x);
    case 'EASE_IN_OUT':
      return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
    case 'SINE_IN':
      return 1 - Math.cos((x * Math.PI) / 2);
    case 'SINE_OUT':
      return Math.sin((x * Math.PI) / 2);
    case 'SINE_IN_OUT':
      return -(Math.cos(Math.PI * x) - 1) / 2;
    case 'CUBIC_IN':
      return x * x * x;
    case 'CUBIC_OUT':
      return 1 - (1 - x) ** 3;
    case 'CUBIC_IN_OUT':
      return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
    default:
      return x;
  }
};

export class AudioFollowVideoController {
  private memberships = new Map<string, SceneAudioMembership>();
  private requests = new Set<string>();
  private transaction: AudioRoutingTransaction | undefined;
  private completed: AudioRoutingTransaction[] = [];
  private lastTick?: string;
  private seq = 1;
  private shutdown = false;
  private result?: AudioRoutingResult;
  private transitionDefs = new Map<string, AudioTransitionDefinition>();
  private events: string[] = [];
  private counters = {
    completedRouteCount: 0,
    cutRouteCount: 0,
    animatedRouteCount: 0,
    mutedRouteCount: 0,
    heldRouteCount: 0,
    degradedRouteCount: 0,
    rejectedCount: 0,
    failedCount: 0,
    cancelledCount: 0,
    rollbackCount: 0,
    duplicateRequestCount: 0,
    duplicateTickCount: 0,
    staleGenerationRejectionCount: 0,
    missingSourceCount: 0,
    unavailableSourceCount: 0,
    commonSourceCount: 0,
    routeCommits: 0,
    routingRequests: 0,
    membershipRegistrations: 0,
    membershipUpdates: 0,
    membershipRemovals: 0,
    previewRouteChanges: 0,
  };
  private programRoute: ProgramAudioRoute;
  private previewRoute: PreviewAudioRoute;
  private mode: AudioFollowMode = 'FOLLOW_PROGRAM_SCENE';
  constructor(programSceneId = 'program', previewSceneId = 'preview') {
    this.programRoute = this.emptyRoute(programSceneId, 1, 0n);
    this.previewRoute = {
      ...this.emptyRoute(previewSceneId, 1, 0n),
      busId: 'PREVIEW_AUDIO',
      previewSceneId,
      previewSceneGeneration: 1,
    };
    this.events.push('AudioFollowEngineCreated');
  }
  private emptyRoute(sceneId: string, gen: number, frame: bigint): ProgramAudioRoute {
    return freeze({
      routeId: `route-${this.seq++}`,
      routeGeneration: this.seq,
      busId: 'PROGRAM_AUDIO',
      programSceneId: sceneId,
      programSceneGeneration: gen,
      activeSources: [],
      mutedSources: [],
      persistentSources: [],
      contributions: [],
      transitionState: 'IDLE',
      runtimeFrame: String(frame),
      health: 'HEALTHY',
      safeMetadata: {},
    }) as ProgramAudioRoute;
  }
  registerMembership(m: SceneAudioMembership) {
    if (this.shutdown)
      throw new AudioFollowVideoError('AudioFollowShutdownError', 'engine shutdown');
    if (this.memberships.has(m.sceneId))
      throw new AudioFollowVideoError(
        'DuplicateSceneAudioMembership',
        `membership ${m.sceneId} exists`,
      );
    this.memberships.set(m.sceneId, m);
    this.counters.membershipRegistrations++;
    this.events.push('SceneAudioMembershipRegistered');
  }
  updateMembership(m: SceneAudioMembership, expectedGeneration: number) {
    const old = this.memberships.get(m.sceneId);
    if (!old) throw new AudioFollowVideoError('SceneAudioMembershipNotFound', m.sceneId);
    if (old.sceneGeneration !== expectedGeneration) {
      this.counters.staleGenerationRejectionCount++;
      throw new AudioFollowVideoError('SceneAudioMembershipInvalid', 'stale membership generation');
    }
    this.memberships.set(m.sceneId, m);
    this.counters.membershipUpdates++;
    this.events.push('SceneAudioMembershipUpdated');
  }
  unregisterMembership(sceneId: string) {
    if (!this.memberships.delete(sceneId))
      throw new AudioFollowVideoError('SceneAudioMembershipNotFound', sceneId);
    this.counters.membershipRemovals++;
    this.events.push('SceneAudioMembershipRemoved');
  }
  setMode(mode: AudioFollowMode) {
    if (!AUDIO_FOLLOW_MODES.includes(mode))
      throw new AudioFollowVideoError('AudioFollowTransitionInvalid', 'unsupported follow mode');
    this.mode = mode;
  }
  registerTransitionDefinition(d: AudioTransitionDefinition) {
    if (this.transitionDefs.has(d.audioTransitionId))
      throw new AudioFollowVideoError(
        'AudioFollowTransitionInvalid',
        'duplicate transition definition',
      );
    this.transitionDefs.set(d.audioTransitionId, d);
  }
  setPreviewRoute(sceneId: string, frame: bigint = 0n) {
    const m = this.memberships.get(sceneId);
    if (!m) throw new AudioFollowVideoError('SceneAudioMembershipNotFound', sceneId);
    const r = this.buildRoute(
      m,
      this.previewRoute.routeGeneration + 1,
      frame,
      'IDLE',
    ) as ProgramAudioRoute;
    this.previewRoute = freeze({
      ...r,
      busId: 'PREVIEW_AUDIO',
      previewSceneId: m.sceneId,
      previewSceneGeneration: m.sceneGeneration,
    }) as PreviewAudioRoute;
    this.counters.previewRouteChanges++;
    this.events.push('PreviewAudioRouteChanged');
  }
  startRouting(i: {
    requestId: string;
    sourceSceneId?: string;
    targetSceneId: string;
    mode: AudioSwitchMode;
    frame: bigint;
    videoCommitFrame?: bigint;
    transitionDefinitionId?: string;
    failurePolicy?: AudioVideoFailurePolicy;
  }) {
    if (this.shutdown)
      throw new AudioFollowVideoError('AudioFollowShutdownError', 'engine shutdown');
    if (this.requests.has(i.requestId)) {
      this.counters.duplicateRequestCount++;
      throw new AudioFollowVideoError('AudioFollowDuplicateRequest', i.requestId);
    }
    if (
      this.transaction &&
      !['COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK'].includes(this.transaction.state)
    )
      throw new AudioFollowVideoError(
        'AudioFollowTransactionConflict',
        'active transaction exists',
      );
    const src = this.memberships.get(i.sourceSceneId ?? this.programRoute.programSceneId);
    const tgt = this.memberships.get(i.targetSceneId);
    if (!src || !tgt)
      throw new AudioFollowVideoError(
        'SceneAudioMembershipNotFound',
        'source or target membership missing',
      );
    const maybeDef = i.transitionDefinitionId
      ? this.transitionDefs.get(i.transitionDefinitionId)
      : createAudioTransitionDefinition({
          audioTransitionId: `${i.mode.toLowerCase()}-default`,
          version: 1,
          generation: 1,
          mode: i.mode,
          durationFrames: ['CUT', 'HOLD_CURRENT', 'MUTE_THEN_SWITCH'].includes(i.mode) ? 1 : 30,
          durationNs: '1000000000',
          easing: 'LINEAR',
          sourceFadePolicy: 'METADATA_ONLY',
          targetFadePolicy: 'METADATA_ONLY',
          commonSourcePolicy: tgt.transitionPolicy.commonSourcePolicy,
          persistentSourcePolicy: tgt.transitionPolicy.persistentPolicy,
          mutePolicy: 'METADATA_ONLY',
          silencePolicy: 'METADATA_ONLY',
          perRoleOverrides: {},
        });
    if (!maybeDef)
      throw new AudioFollowVideoError(
        'AudioFollowTransitionInvalid',
        'missing transition definition',
      );
    const def = maybeDef;
    const validation = this.validateMembership(tgt);
    if (!validation.valid) {
      this.counters.rejectedCount++;
      throw new AudioFollowVideoError('SceneAudioMembershipInvalid', validation.errors.join(','));
    }
    const target = this.buildRoute(
      tgt,
      this.programRoute.routeGeneration + 1,
      i.frame,
      'PREPARED',
      def.audioTransitionId,
      src,
    );
    const req: AudioRoutingRequest = freeze({
      requestId: i.requestId,
      sourceProgramSceneId: src.sceneId,
      targetProgramSceneId: tgt.sceneId,
      sourceMembership: src,
      targetMembership: tgt,
      currentProgramAudioRoute: this.programRoute,
      expectedProgramAudioRouteGeneration: this.programRoute.routeGeneration,
      expectedSceneGenerations: {
        [src.sceneId]: src.sceneGeneration,
        [tgt.sceneId]: tgt.sceneGeneration,
      },
      expectedSourceGenerations: Object.fromEntries(
        tgt.sources.map((s) => [s.sourceId, s.sourceGeneration]),
      ),
      mode: i.mode,
      transitionDefinition: def,
      startFrame: String(i.frame),
      failurePolicy: i.failurePolicy ?? 'DEGRADE_AND_NOTIFY',
      safeMetadata: { videoCommitFrame: String(i.videoCommitFrame ?? i.frame) },
    }) as AudioRoutingRequest;
    this.requests.add(i.requestId);
    this.counters.routingRequests++;
    this.events.push(
      'AudioRoutingRequested',
      'AudioRoutingValidated',
      'ProgramAudioRoutePrepared',
      'AudioRoutingScheduled',
    );
    this.transaction = freeze({
      transactionId: `audio-tx-${this.seq++}`,
      requestId: i.requestId,
      transactionGeneration: 1,
      state: 'SCHEDULED',
      sourceRoute: this.programRoute,
      targetRoute: target,
      sourceMembership: src,
      targetMembership: tgt,
      transitionDefinition: def,
      scheduledFrame: String(i.videoCommitFrame ?? i.frame),
      currentProgress: 0,
      validationReport: validation,
      rollbackSnapshot: this.programRoute,
      createdAtNs: String(i.frame * 1000n),
      safeMetadata: {},
    }) as AudioRoutingTransaction;
    return req;
  }
  processFrameTick(tick: FrameTick): AudioRoutingResult | undefined {
    const frame = String(tick.frameNumber);
    if (this.lastTick === frame) {
      this.counters.duplicateTickCount++;
      this.events.push('AudioFollowHealthChanged');
      return undefined;
    }
    this.lastTick = frame;
    const tx = this.transaction;
    if (!tx || ['COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK'].includes(tx.state))
      return undefined;
    const def = tx.transitionDefinition;
    if (!def)
      throw new AudioFollowVideoError(
        'AudioFollowTransitionInvalid',
        'transaction missing transition definition',
      );
    const start = BigInt(tx.scheduledFrame);
    const elapsed = Number(tick.frameNumber - start);
    const raw = ['CUT', 'HOLD_CURRENT', 'MUTE_THEN_SWITCH'].includes(def.mode)
      ? 1
      : Math.min(1, Math.max(0, elapsed / Math.max(1, def.durationFrames - 1)));
    const progress = ease(raw, def.easing);
    const contributions = this.computeContributions(tx, progress, tick.frameNumber);
    this.events.push('AudioRoutingStarted', 'AudioTransitionProgressed');
    const complete = ['CUT', 'HOLD_CURRENT', 'MUTE_THEN_SWITCH'].includes(def.mode)
      ? tick.frameNumber >= start
      : progress >= 1;
    this.transaction = freeze({
      ...tx,
      state: complete ? 'COMMITTING' : 'RUNNING',
      currentProgress: progress,
      targetRoute: { ...tx.targetRoute, contributions },
    }) as AudioRoutingTransaction;
    if (!complete) return undefined;
    return this.commit(tick, contributions);
  }
  private commit(tick: FrameTick, contributions: readonly AudioTransitionContribution[]) {
    const tx = this.transaction!;
    if (tx.commitSnapshot)
      throw new AudioFollowVideoError('AudioFollowProgramCommitFailed', 'duplicate commit');
    const videoCommitFrame = String(
      (tx.sourceMembership.safeMetadata.videoCommitFrame as string | undefined) ??
        tx.scheduledFrame,
    );
    const newRoute = freeze({
      ...tx.targetRoute,
      routeGeneration: this.programRoute.routeGeneration + 1,
      runtimeFrame: String(tick.frameNumber),
      transitionState: 'COMMITTED',
      contributions,
    }) as ProgramAudioRoute;
    const prev = this.programRoute;
    this.programRoute = newRoute;
    this.counters.routeCommits++;
    this.counters.completedRouteCount++;
    if (tx.transitionDefinition?.mode === 'CUT') this.counters.cutRouteCount++;
    else this.counters.animatedRouteCount++;
    const sync =
      videoCommitFrame === String(tick.frameNumber) || tx.transitionDefinition?.mode !== 'CUT';
    if (!sync) this.counters.degradedRouteCount++;
    const res: AudioRoutingResult = freeze({
      requestId: tx.requestId,
      transactionId: tx.transactionId,
      status: sync ? 'COMPLETED' : 'DEGRADED',
      mode: tx.transitionDefinition!.mode,
      sourceProgramSceneId: tx.sourceMembership.sceneId,
      targetProgramSceneId: tx.targetMembership.sceneId,
      previousProgramAudioRoute: prev,
      newProgramAudioRoute: newRoute,
      programAudioRouteGeneration: newRoute.routeGeneration,
      committedRuntimeFrame: String(tick.frameNumber),
      transitionProgress: 1,
      contributionSummaries: contributions,
      persistentSourceSummaries: newRoute.persistentSources.map((s) => s.sourceId),
      mutedSourceSummaries: newRoute.mutedSources.map((s) => s.sourceId),
      videoCommitFrame,
      audioCommitFrame: String(tick.frameNumber),
      audioVideoSynchronized: sync,
      realAudioMixApplied: false,
      rollbackApplied: false,
      warnings: sync ? [] : ['audio/video commit frame mismatch'],
      durationNs: String(tick.actualTimeNs - BigInt(tx.createdAtNs)),
      completedAtNs: String(tick.actualTimeNs),
    }) as AudioRoutingResult;
    this.result = res;
    this.transaction = freeze({
      ...tx,
      state: 'COMPLETED',
      currentProgress: 1,
      commitSnapshot: newRoute,
      completedAtNs: String(tick.actualTimeNs),
      committedAtNs: String(tick.actualTimeNs),
    }) as AudioRoutingTransaction;
    this.completed.push(this.transaction);
    if (this.completed.length > 64) this.completed.shift();
    this.events.push('ProgramAudioRouteCommitted', 'AudioRoutingCompleted');
    return res;
  }
  private validateMembership(m: SceneAudioMembership): AudioFollowVideoValidationReport {
    const errors: string[] = [];
    const ids = new Set(m.sources.map((s) => s.sourceId));
    for (const id of m.defaultProgramAudioSourceIds) {
      if (!ids.has(id)) {
        this.counters.missingSourceCount++;
        if (m.routingPolicy.missingSourcePolicy === 'FAIL_AUDIO_ROUTE')
          errors.push(`missing required source ${id}`);
      }
    }
    for (const s of m.sources) {
      if (s.availability !== 'AVAILABLE' && !m.optionalAudioSourceIds.includes(s.sourceId)) {
        this.counters.unavailableSourceCount++;
        if (m.routingPolicy.missingSourcePolicy === 'FAIL_AUDIO_ROUTE')
          errors.push(`unavailable source ${s.sourceId}`);
      }
    }
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: [],
      operationCounts: { sourceLookup: m.sources.length, membershipLookup: 1 },
    }) as AudioFollowVideoValidationReport;
  }
  private buildRoute(
    m: SceneAudioMembership,
    gen: number,
    frame: bigint,
    state: string,
    transitionId?: string,
    source?: SceneAudioMembership,
  ): ProgramAudioRoute {
    const selected = this.mode === 'MUTE' ? [] : this.selectSources(m);
    const persistent = m.sources.filter(
      (s) => m.persistentAudioSourceIds.includes(s.sourceId) || s.persistent,
    );
    const common = source
      ? selected.filter((s) => source.sources.some((x) => x.sourceId === s.sourceId))
      : [];
    this.counters.commonSourceCount += common.length;
    const muted = m.sources.filter((s) => m.mutedSourceIds.includes(s.sourceId) || s.muted);
    return freeze({
      routeId: `route-${this.seq++}`,
      routeGeneration: gen,
      busId: 'PROGRAM_AUDIO',
      programSceneId: m.sceneId,
      programSceneGeneration: m.sceneGeneration,
      activeSources: selected,
      mutedSources: muted,
      persistentSources: persistent,
      contributions: selected.map((s) =>
        this.contribution(
          s,
          m.sceneId,
          m.sceneId,
          1,
          frame,
          persistent.some((p) => p.sourceId === s.sourceId),
          common.some((c) => c.sourceId === s.sourceId),
        ),
      ),
      transitionState: state,
      transitionId,
      runtimeFrame: String(frame),
      health: this.mode === 'MUTE' ? 'MUTED' : 'HEALTHY',
      safeMetadata: { realAudioMixApplied: false },
    }) as ProgramAudioRoute;
  }
  private selectSources(m: SceneAudioMembership) {
    if (this.mode === 'HOLD_CURRENT') return this.programRoute.activeSources;
    const ids =
      this.mode === 'FOLLOW_PRIMARY_AUDIO_SOURCE'
        ? m.defaultProgramAudioSourceIds.slice(0, 1)
        : m.defaultProgramAudioSourceIds.length
          ? m.defaultProgramAudioSourceIds
          : m.sources.map((s) => s.sourceId);
    return sortedSources(
      m.sources.filter(
        (s) =>
          ids.includes(s.sourceId) &&
          !m.mutedSourceIds.includes(s.sourceId) &&
          s.availability === 'AVAILABLE',
      ),
    );
  }
  private contribution(
    s: AudioFollowSourceReference,
    sourceSceneId: string,
    targetSceneId: string,
    v: number,
    frame: bigint,
    persistent = false,
    common = false,
  ): AudioTransitionContribution {
    if (!finite01(v))
      throw new AudioFollowVideoError(
        'AudioFollowContributionInvalid',
        'contribution out of range',
      );
    return freeze({
      sourceId: s.sourceId,
      sourceSceneId,
      targetSceneId,
      role: s.role,
      sourceContribution: v,
      targetContribution: v,
      effectiveContribution: v,
      muted: s.muted,
      persistent,
      commonSource: common,
      runtimeFrame: String(frame),
      transitionProgress: v,
      safeMetadata: {},
    }) as AudioTransitionContribution;
  }
  private computeContributions(tx: AudioRoutingTransaction, progress: number, frame: bigint) {
    const out = new Map<string, AudioTransitionContribution>();
    const sourceWeight =
      tx.transitionDefinition?.mode === 'FADE_TO_SILENCE'
        ? 1 - progress
        : tx.transitionDefinition?.mode === 'FADE_OUT_IN' && progress < 0.5
          ? 1 - progress * 2
          : 1 - progress;
    const targetWeight =
      tx.transitionDefinition?.mode === 'FADE_TO_SILENCE'
        ? 0
        : tx.transitionDefinition?.mode === 'FADE_OUT_IN' && progress < 0.5
          ? 0
          : tx.transitionDefinition?.mode === 'FADE_OUT_IN'
            ? (progress - 0.5) * 2
            : progress;
    for (const s of tx.sourceRoute.activeSources)
      out.set(
        s.sourceId,
        this.contribution(
          s,
          tx.sourceMembership.sceneId,
          tx.targetMembership.sceneId,
          sourceWeight,
          frame,
          tx.sourceRoute.persistentSources.some((p) => p.sourceId === s.sourceId),
          tx.targetRoute.activeSources.some((t) => t.sourceId === s.sourceId),
        ),
      );
    for (const s of tx.targetRoute.activeSources) {
      const old = out.get(s.sourceId);
      const common = !!old;
      const val =
        common && tx.transitionDefinition?.commonSourcePolicy === 'KEEP_CONTINUOUS'
          ? 1
          : targetWeight;
      out.set(
        s.sourceId,
        this.contribution(
          s,
          tx.sourceMembership.sceneId,
          tx.targetMembership.sceneId,
          val,
          frame,
          tx.targetRoute.persistentSources.some((p) => p.sourceId === s.sourceId),
          common,
        ),
      );
    }
    return [...out.values()].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
  }
  cancel() {
    if (this.transaction && !['COMPLETED', 'FAILED'].includes(this.transaction.state)) {
      this.transaction = freeze({
        ...this.transaction,
        state: 'CANCELLED',
        completedAtNs: this.transaction.createdAtNs,
      }) as AudioRoutingTransaction;
      this.counters.cancelledCount++;
      this.events.push('AudioRoutingCancelled');
    }
  }
  rollback() {
    if (!this.transaction?.rollbackSnapshot)
      throw new AudioFollowVideoError('AudioFollowRollbackFailed', 'no rollback snapshot');
    this.programRoute = this.transaction.rollbackSnapshot;
    this.transaction = freeze({
      ...this.transaction,
      state: 'ROLLED_BACK',
    }) as AudioRoutingTransaction;
    this.counters.rollbackCount++;
    this.events.push('AudioRoutingRollbackStarted', 'AudioRoutingRolledBack');
  }
  shutdownEngine() {
    this.transaction = undefined;
    this.shutdown = true;
    this.events.push('AudioFollowEngineShutdown');
  }
  assertInvariants() {
    if ((this.programRoute.busId as string) === (this.previewRoute.busId as string))
      throw new AudioFollowVideoError(
        'AudioFollowInvariantViolation',
        'program and preview bus alias',
      );
    if (this.programRoute === (this.previewRoute as unknown))
      throw new AudioFollowVideoError('AudioFollowInvariantViolation', 'route object alias');
    const ids = new Set<string>();
    for (const m of this.memberships.values()) {
      if (ids.has(m.sceneId))
        throw new AudioFollowVideoError('AudioFollowInvariantViolation', 'duplicate membership');
      ids.add(m.sceneId);
    }
    const contribIds = new Set<string>();
    for (const c of this.programRoute.contributions) {
      if (!finite01(c.effectiveContribution))
        throw new AudioFollowVideoError('AudioFollowInvariantViolation', 'invalid contribution');
      if (contribIds.has(c.sourceId))
        throw new AudioFollowVideoError('AudioFollowInvariantViolation', 'duplicate contribution');
      contribIds.add(c.sourceId);
    }
    return freeze({
      valid: true,
      errors: [],
      warnings: [],
      operationCounts: {
        memberships: this.memberships.size,
        activeTransactions: this.transaction ? 1 : 0,
      },
    }) as AudioFollowVideoValidationReport;
  }
  getSnapshot(): AudioFollowVideoEngineSnapshot {
    const health = this.getHealthSnapshot();
    return freeze({
      memberships: [...this.memberships.values()].sort((a, b) =>
        a.sceneId.localeCompare(b.sceneId),
      ),
      programRoute: this.programRoute,
      previewRoute: this.previewRoute,
      activeTransaction: this.transaction,
      lastResult: this.result,
      health,
      telemetry: this.getTelemetrySnapshot(),
    }) as AudioFollowVideoEngineSnapshot;
  }
  getHealthSnapshot(): AudioFollowVideoHealthSnapshot {
    return freeze({
      engineState: this.shutdown ? 'SHUTDOWN' : 'RUNNING',
      healthState: this.counters.failedCount
        ? 'FAILED'
        : this.counters.degradedRouteCount
          ? 'DEGRADED'
          : 'HEALTHY',
      programAudioRouteId: this.programRoute.routeId,
      previewAudioRouteId: this.previewRoute.routeId,
      programSceneId: this.programRoute.programSceneId,
      previewSceneId: this.previewRoute.previewSceneId,
      programRouteGeneration: this.programRoute.routeGeneration,
      previewRouteGeneration: this.previewRoute.routeGeneration,
      activeTransactionCount:
        this.transaction &&
        !['COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK'].includes(this.transaction.state)
          ? 1
          : 0,
      completedRouteCount: this.counters.completedRouteCount,
      cutRouteCount: this.counters.cutRouteCount,
      animatedRouteCount: this.counters.animatedRouteCount,
      mutedRouteCount: this.counters.mutedRouteCount,
      heldRouteCount: this.counters.heldRouteCount,
      degradedRouteCount: this.counters.degradedRouteCount,
      rejectedCount: this.counters.rejectedCount,
      failedCount: this.counters.failedCount,
      cancelledCount: this.counters.cancelledCount,
      rollbackCount: this.counters.rollbackCount,
      duplicateRequestCount: this.counters.duplicateRequestCount,
      duplicateTickCount: this.counters.duplicateTickCount,
      staleGenerationRejectionCount: this.counters.staleGenerationRejectionCount,
      missingSourceCount: this.counters.missingSourceCount,
      unavailableSourceCount: this.counters.unavailableSourceCount,
      persistentSourceCount: this.programRoute.persistentSources.length,
      commonSourceCount: this.counters.commonSourceCount,
      audioVideoSyncMismatchCount: this.counters.degradedRouteCount,
      lastSuccessfulRoute: this.result?.newProgramAudioRoute.routeId,
      updatedAtNs: String(this.lastTick ? BigInt(this.lastTick) * 1000n : 0n),
    }) as AudioFollowVideoHealthSnapshot;
  }
  getTelemetrySnapshot(): AudioFollowVideoTelemetrySnapshot {
    return freeze({
      routeCommits: this.counters.routeCommits,
      routingRequests: this.counters.routingRequests,
      duplicateTicks: this.counters.duplicateTickCount,
      currentTransactionId: this.transaction?.transactionId,
      activeSourceIds: this.programRoute.activeSources.map((s) => s.sourceId),
      healthSummary: this.counters.failedCount ? 'FAILED' : 'OK',
      membershipRegistrations: this.counters.membershipRegistrations,
      membershipUpdates: this.counters.membershipUpdates,
      membershipRemovals: this.counters.membershipRemovals,
      previewRouteChanges: this.counters.previewRouteChanges,
      lastAudioFollowEvent: this.events.at(-1),
    }) as AudioFollowVideoTelemetrySnapshot;
  }
  createSourceGraphMetadata() {
    return freeze({
      programAudioRouteId: this.programRoute.routeId,
      previewAudioRouteId: this.previewRoute.routeId,
      activeSourceIds: this.programRoute.activeSources.map((s) => s.sourceId),
      mutedSourceIds: this.programRoute.mutedSources.map((s) => s.sourceId),
      persistentSourceIds: this.programRoute.persistentSources.map((s) => s.sourceId),
      sourceRoles: Object.fromEntries(
        this.programRoute.activeSources.map((s) => [s.sourceId, s.role]),
      ),
      routeGenerations: {
        program: this.programRoute.routeGeneration,
        preview: this.previewRoute.routeGeneration,
      },
      audioFollowMode: this.mode,
      activeTransactionId: this.transaction?.transactionId,
      transitionMode: this.transaction?.transitionDefinition?.mode,
      transitionProgress: this.transaction?.currentProgress ?? 0,
      audioVideoSyncState: this.result?.audioVideoSynchronized ?? true,
      health: this.getHealthSnapshot().healthState,
      routingEligibility: !this.shutdown,
    });
  }
}
export const createAudioFollowVideoController = (
  programSceneId?: string,
  previewSceneId?: string,
) => new AudioFollowVideoController(programSceneId, previewSceneId);
export class AudioFollowVideoProcessor implements TickProcessor<
  AudioFollowVideoEngineSnapshot,
  AudioRoutingResult | undefined
> {
  readonly id = 'audio-follow-video';
  readonly order = 550;
  constructor(private readonly controller: AudioFollowVideoController) {}
  initialize() {
    return { status: 'READY' as const, state: this.controller.getSnapshot() };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext<AudioFollowVideoEngineSnapshot>) {
    const result = this.controller.processFrameTick(tick);
    const snap = this.controller.getSnapshot();
    context.outputs?.publish(
      this.id,
      AUDIO_FOLLOW_OUTPUT_KEYS.programRoute,
      snap.programRoute,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish(
      this.id,
      AUDIO_FOLLOW_OUTPUT_KEYS.previewRoute,
      snap.previewRoute,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish(
      this.id,
      AUDIO_FOLLOW_OUTPUT_KEYS.health,
      snap.health,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish(
      this.id,
      AUDIO_FOLLOW_OUTPUT_KEYS.telemetry,
      snap.telemetry,
      'OWNED_BY_PROCESSOR',
    );
    if (snap.activeTransaction)
      context.outputs?.publish(
        this.id,
        AUDIO_FOLLOW_OUTPUT_KEYS.activeTransaction,
        snap.activeTransaction,
        'OWNED_BY_PROCESSOR',
      );
    if (result)
      context.outputs?.publish(
        this.id,
        AUDIO_FOLLOW_OUTPUT_KEYS.result,
        result,
        'OWNED_BY_PROCESSOR',
      );
    return { status: 'SUCCEEDED' as const, value: result, metadata: { state: snap } };
  }
  shutdown() {
    this.controller.shutdownEngine();
    return { status: 'STOPPED' as const, metadata: { audioFollow: true } };
  }
}
export const createAudioFollowCommandHandlers = (
  controller: AudioFollowVideoController,
): RuntimeCommandHandler[] =>
  AUDIO_FOLLOW_COMMAND_TYPES.map((type) => ({
    commandType: type,
    handlerName: `${type}.handler`,
    idempotent: true,
    execute(command: RuntimeCommand) {
      const p = (command.payload ?? {}) as Record<string, unknown>;
      switch (type) {
        case 'AUDIO_FOLLOW_SET_MODE':
          controller.setMode(p.mode as AudioFollowMode);
          break;
        case 'AUDIO_FOLLOW_REGISTER_MEMBERSHIP':
          controller.registerMembership(p.membership as SceneAudioMembership);
          break;
        case 'AUDIO_FOLLOW_UPDATE_MEMBERSHIP':
          controller.updateMembership(
            p.membership as SceneAudioMembership,
            Number(p.expectedGeneration),
          );
          break;
        case 'AUDIO_FOLLOW_SET_PREVIEW_ROUTE':
          controller.setPreviewRoute(String(p.sceneId));
          break;
        case 'AUDIO_FOLLOW_CUT':
        case 'AUDIO_FOLLOW_TAKE':
        case 'AUDIO_FOLLOW_AUTO':
          controller.startRouting({
            requestId: command.id,
            targetSceneId: String(p.targetSceneId),
            mode:
              type === 'AUDIO_FOLLOW_CUT'
                ? 'CUT'
                : type === 'AUDIO_FOLLOW_TAKE'
                  ? 'CROSSFADE'
                  : 'CROSSFADE',
            frame: BigInt(String(p.frameNumber ?? 0)),
          });
          break;
        case 'AUDIO_FOLLOW_CANCEL':
          controller.cancel();
          break;
        case 'AUDIO_FOLLOW_ROLLBACK':
          controller.rollback();
          break;
        case 'AUDIO_FOLLOW_VALIDATE':
          controller.assertInvariants();
          break;
        case 'AUDIO_FOLLOW_SHUTDOWN':
          controller.shutdownEngine();
          break;
        default:
          break;
      }
      return { status: 'SUCCEEDED', value: { accepted: true }, metadata: { audioFollow: true } };
    },
  }));
