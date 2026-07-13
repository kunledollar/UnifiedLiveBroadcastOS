/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommand,
  RuntimeCommandHandler,
  TickProcessor,
} from './execution-engine.js';
import { SCENE_SWITCHING_OUTPUT_KEYS } from './scene-switching.js';
import { TRANSITION_OUTPUT_KEYS } from './transition-execution-engine.js';
import { AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS } from './audio-follow-video.js';

type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const SECRET =
  /token|secret|password|credential|cookie|url|endpoint|device|handle|native|pixel|pcm|lease|gpu|streamKey/i;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(structuredClone(v));
const safe = (v: unknown, d = 0): Json => {
  if (d > 4) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v as null | boolean;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => safe(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, x]) => [k, SECRET.test(k) ? '[REDACTED]' : safe(x, d + 1)]),
    );
  return String(v);
};
const ns = (tick?: FrameTick) => tick?.presentationTimeNs?.toString?.() ?? '0';
export const PROGRAM_PREVIEW_BUS_PROCESSOR_ORDER = freeze({
  sceneSwitching: 450,
  transitionExecution: 500,
  audioFollowVideo: 550,
  busOrchestration: 600,
  sceneCompositor: 700,
  outputPublication: 800,
});
export const BUS_CATEGORIES = [
  'PROGRAM_VIDEO',
  'PREVIEW_VIDEO',
  'PREVIOUS_PROGRAM_VIDEO',
  'PROGRAM_AUDIO',
  'PREVIEW_AUDIO',
  'HORIZONTAL_PROGRAM',
  'VERTICAL_PROGRAM',
  'SQUARE_PROGRAM',
  'CLEAN_FEED',
  'AUXILIARY',
  'MULTIVIEW',
  'CONFIDENCE_MONITOR',
  'RECORD_FEED',
  'STREAM_FEED',
  'CUSTOM',
] as const;
export type BroadcastBusRole = (typeof BUS_CATEGORIES)[number];
export const OUTPUT_ROLES = [
  'PROGRAM',
  'PREVIEW',
  'PREVIOUS_PROGRAM',
  'HORIZONTAL_PROGRAM',
  'VERTICAL_PROGRAM',
  'SQUARE_PROGRAM',
  'CLEAN_FEED',
  'AUXILIARY',
  'MULTIVIEW',
  'CONFIDENCE_MONITOR',
  'RECORD',
  'STREAM',
  'CUSTOM',
] as const;
export type OutputRole = (typeof OUTPUT_ROLES)[number];
export type OutputOrientation = 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE' | 'CUSTOM';
export type SceneSelectionPolicy =
  | 'FOLLOW_PROGRAM'
  | 'FOLLOW_PREVIEW'
  | 'FOLLOW_PREVIOUS_PROGRAM'
  | 'FIXED_SCENE'
  | 'FOLLOW_PROGRAM_WITH_VARIANT'
  | 'FOLLOW_PREVIEW_WITH_VARIANT'
  | 'FOLLOW_AUX_SELECTION'
  | 'CUSTOM';
export type AudioBindingPolicy =
  | 'FOLLOW_PROGRAM_AUDIO'
  | 'FOLLOW_PREVIEW_AUDIO'
  | 'FOLLOW_VIDEO_SCENE_AUDIO_MEMBERSHIP'
  | 'CLEAN_FEED_AUDIO'
  | 'FIXED_AUDIO_ROUTE'
  | 'NO_AUDIO'
  | 'CUSTOM';
export type OutputReadinessState =
  'UNKNOWN' | 'PREPARING' | 'READY' | 'DEGRADED' | 'FAILED' | 'DISABLED' | 'UNAVAILABLE';
export type PublicationTransactionState =
  | 'CREATED'
  | 'VALIDATING'
  | 'READY'
  | 'PREPARING'
  | 'COMMITTING'
  | 'COMMITTED'
  | 'PARTIAL'
  | 'COMPLETED'
  | 'CANCELLING'
  | 'CANCELLED'
  | 'ROLLING_BACK'
  | 'ROLLED_BACK'
  | 'FAILED';
export type PublicationAtomicityPolicy =
  | 'ATOMIC_PROGRAM_ONLY'
  | 'ATOMIC_PROGRAM_AND_AUDIO'
  | 'ATOMIC_PROGRAM_PREVIEW'
  | 'ATOMIC_ALL_CRITICAL_OUTPUTS'
  | 'BEST_EFFORT_OPTIONAL_OUTPUTS'
  | 'ALL_OR_NOTHING'
  | 'CUSTOM';
export type RolePublicationStatus =
  | 'PUBLISHED'
  | 'PASSED_THROUGH'
  | 'DEGRADED'
  | 'SKIPPED'
  | 'DROPPED'
  | 'CANCELLED'
  | 'FAILED'
  | 'REJECTED';
export const PROGRAM_PREVIEW_BUS_OUTPUT_KEYS = freeze({
  programState: 'bus.program.state',
  previewState: 'bus.preview.state',
  previousProgramState: 'bus.previous-program.state',
  audioVideoCorrelation: 'bus.program.audio-video-correlation',
  activePublicationTransaction: 'bus.publication.active-transaction',
  publicationRequest: 'bus.publication.request',
  rolePublicationPlans: 'bus.publication.role-plans',
  rolePublicationResults: 'bus.publication.role-results',
  programOutput: 'bus.output.program',
  previewOutput: 'bus.output.preview',
  horizontalProgramOutput: 'bus.output.horizontal-program',
  verticalProgramOutput: 'bus.output.vertical-program',
  squareProgramOutput: 'bus.output.square-program',
  cleanFeedOutput: 'bus.output.clean-feed',
  auxiliaryOutputs: 'bus.output.auxiliary',
  multiviewState: 'bus.multiview.state',
  confidenceMonitorState: 'bus.confidence-monitor.state',
  recordRoleMetadata: 'bus.record.metadata',
  streamRoleMetadata: 'bus.stream.metadata',
  failedDegradedResults: 'bus.publication.failed-degraded',
  health: 'bus.health',
  telemetry: 'bus.telemetry',
  readiness: 'bus.readiness',
  activeRoleSummaries: 'bus.roles.active',
});
export const PROGRAM_PREVIEW_BUS_COMMAND_TYPES = [
  'BUS_REGISTER',
  'BUS_UNREGISTER',
  'BUS_UPDATE',
  'BUS_ENABLE',
  'BUS_DISABLE',
  'BUS_BIND_OUTPUT_ROLE',
  'BUS_UNBIND_OUTPUT_ROLE',
  'BUS_SET_OUTPUT_PROFILE',
  'BUS_SET_SCENE_POLICY',
  'BUS_SET_AUDIO_POLICY',
  'BUS_SET_PUBLICATION_POLICY',
  'BUS_SET_FAILURE_POLICY',
  'BUS_SET_ATOMICITY_POLICY',
  'BUS_REGISTER_AUX',
  'BUS_UNREGISTER_AUX',
  'BUS_SET_AUX_SCENE',
  'BUS_SET_AUX_AUDIO',
  'BUS_REGISTER_CLEAN_FEED',
  'BUS_SET_CLEAN_FEED_EXCLUSIONS',
  'BUS_REGISTER_MULTIVIEW',
  'BUS_UPDATE_MULTIVIEW',
  'BUS_REGISTER_CONFIDENCE_MONITOR',
  'BUS_SET_ROLE_PRIORITY',
  'BUS_PUBLISH',
  'BUS_CANCEL_PUBLICATION',
  'BUS_CLEAR_PLAN_CACHE',
  'BUS_VALIDATE',
  'BUS_SHUTDOWN',
] as const;
export const PROGRAM_PREVIEW_BUS_EVENTS = [
  'BusOrchestratorCreated',
  'BroadcastBusRegistered',
  'BroadcastBusUpdated',
  'BroadcastBusUnregistered',
  'BroadcastBusEnabled',
  'BroadcastBusDisabled',
  'OutputRoleBound',
  'OutputRoleUnbound',
  'OutputProfileChanged',
  'AuxOutputRegistered',
  'AuxOutputRemoved',
  'CleanFeedConfigured',
  'MultiviewConfigured',
  'ConfidenceMonitorConfigured',
  'PublicationRequested',
  'PublicationValidated',
  'PublicationRejected',
  'PublicationStarted',
  'ProgramPublished',
  'PreviewPublished',
  'OptionalRolePublished',
  'RolePublicationSkipped',
  'RolePublicationDropped',
  'RolePublicationFailed',
  'MixedTickDetected',
  'AudioVideoCorrelationChanged',
  'PublicationCompleted',
  'PublicationPartial',
  'PublicationCancelled',
  'PublicationFailed',
  'ProgramPreserved',
  'OutputReadinessChanged',
  'BusHealthChanged',
  'BusOrchestratorShutdown',
] as const;
export const PROGRAM_PREVIEW_BUS_WATCHDOG_INCIDENTS = [
  'BUS_ORCHESTRATOR_STALLED',
  'BUS_PUBLICATION_TIMEOUT',
  'BUS_DUPLICATE_REQUEST',
  'BUS_DUPLICATE_TICK',
  'BUS_DUPLICATE_ROLE_PUBLICATION',
  'BUS_PROGRAM_GENERATION_STALE',
  'BUS_PREVIEW_GENERATION_STALE',
  'BUS_AUDIO_GENERATION_STALE',
  'BUS_TRANSITION_GENERATION_STALE',
  'BUS_MIXED_TICK_INPUT',
  'BUS_PROGRAM_NOT_READY',
  'BUS_PREVIEW_NOT_READY',
  'BUS_OUTPUT_ROLE_COLLISION',
  'BUS_OUTPUT_PROFILE_MISMATCH',
  'BUS_WRITABLE_OUTPUT_ALIAS',
  'BUS_PROGRAM_AUDIO_VIDEO_MISMATCH',
  'BUS_SCENE_COMPOSITOR_FAILED',
  'BUS_OPTIONAL_OUTPUT_FAILED',
  'BUS_PROGRAM_PUBLICATION_FAILED',
  'BUS_PARTIAL_PROGRAM_PUBLICATION',
  'BUS_HELD_OUTPUT_PRESSURE',
  'BUS_TEMP_MEMORY_PRESSURE',
  'BUS_OUTPUT_REGISTRY_MISMATCH',
  'BUS_SOURCE_GRAPH_MISMATCH',
  'BUS_INVARIANT_FAILURE',
] as const;
export const PROGRAM_PREVIEW_BUS_ERRORS = [
  'BusOrchestratorNotReady',
  'BroadcastBusNotFound',
  'DuplicateBroadcastBus',
  'BroadcastBusInvalid',
  'BroadcastBusCriticalRemovalRejected',
  'OutputRoleNotFound',
  'DuplicateOutputRoleBinding',
  'OutputRoleBindingInvalid',
  'OutputProfileNotFound',
  'OutputProfileMismatch',
  'OutputPublicationNotFound',
  'OutputPublicationDuplicateRequest',
  'OutputPublicationConflict',
  'OutputPublicationGenerationMismatch',
  'OutputPublicationMixedTick',
  'OutputPublicationProgramNotReady',
  'OutputPublicationRoleNotReady',
  'OutputPublicationCompositorFailed',
  'OutputPublicationAudioVideoMismatch',
  'OutputPublicationWritableAlias',
  'OutputPublicationCancelled',
  'OutputPublicationTimeout',
  'OutputPublicationFailed',
  'OutputPublicationInvariantViolation',
  'BusOrchestratorShutdownError',
] as const;
export class ProgramPreviewBusError extends Error {
  constructor(
    readonly code: (typeof PROGRAM_PREVIEW_BUS_ERRORS)[number],
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = code;
  }
}
export interface OutputProfileCoordinationSnapshot {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly profileGeneration: number;
  readonly width: number;
  readonly height: number;
  readonly frameRate: Readonly<{ numerator: number; denominator: number }>;
  readonly pixelFormat: string;
  readonly colorMetadata: Readonly<Record<string, Json>>;
  readonly alphaMode: string;
  readonly audioFormatMetadata: Readonly<Record<string, Json>>;
  readonly aspectRatio: string;
  readonly safeArea: Readonly<Record<string, Json>>;
  readonly orientation: OutputOrientation;
  readonly memoryDomain: string;
  readonly latencyClass: string;
  readonly qualityTier: string;
  readonly routingEligibility: boolean;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface BroadcastBusDefinitionSnapshot {
  readonly busId: string;
  readonly busVersion: string;
  readonly busGeneration: number;
  readonly role: BroadcastBusRole;
  readonly displayName: string;
  readonly outputProfile: OutputProfileCoordinationSnapshot;
  readonly videoEnabled: boolean;
  readonly audioEnabled: boolean;
  readonly sceneBindingPolicy: SceneSelectionPolicy;
  readonly audioBindingPolicy: AudioBindingPolicy;
  readonly publicationPolicy: string;
  readonly readinessPolicy: string;
  readonly failurePolicy: string;
  readonly retentionPolicy: string;
  readonly priority: number;
  readonly criticality: 'CRITICAL' | 'OPTIONAL';
  readonly routingEligibility: boolean;
  readonly enabled: boolean;
  readonly safeMetadata: Readonly<Record<string, Json>>;
  readonly createdAtNs: string;
  readonly updatedAtNs: string;
}
export interface OutputRoleBindingSnapshot {
  readonly bindingId: string;
  readonly outputRole: OutputRole;
  readonly roleInstanceId: string;
  readonly busId: string;
  readonly sceneSelectionPolicy: SceneSelectionPolicy;
  readonly sceneReferenceOverride?: Readonly<Record<string, Json>>;
  readonly audioRoutePolicy: AudioBindingPolicy;
  readonly outputProfile: OutputProfileCoordinationSnapshot;
  readonly cleanFeedExclusionPolicy: readonly string[];
  readonly priority: number;
  readonly required: boolean;
  readonly enabled: boolean;
  readonly generation: number;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface BroadcastBusStateSnapshot {
  readonly busId: string;
  readonly busVersion: string;
  readonly busGeneration: number;
  readonly role: BroadcastBusRole;
  readonly runtimeFrameNumber: string;
  readonly sceneReference: Readonly<Record<string, Json>> | null;
  readonly sceneGeneration: number;
  readonly videoFrameSummary: Readonly<Record<string, Json>>;
  readonly audioRouteSummary: Readonly<Record<string, Json>>;
  readonly transitionSummary: Readonly<Record<string, Json>>;
  readonly outputProfile: OutputProfileCoordinationSnapshot;
  readonly readiness: OutputReadinessState;
  readonly health: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  readonly publicationState: string;
  readonly lastPublicationId: string;
  readonly lastSuccessfulRuntimeFrame: string;
  readonly degradedReasons: readonly string[];
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type AuxOutputSnapshot = Readonly<{
  auxId: string;
  index: number;
  binding: OutputRoleBindingSnapshot;
  enabled: boolean;
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type CleanFeedSnapshot = Readonly<{
  cleanFeedId: string;
  exclusions: readonly string[];
  state: OutputReadinessState;
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type MultiviewSnapshot = Readonly<{
  multiviewId: string;
  tiles: readonly Readonly<Record<string, Json>>[];
  state: OutputReadinessState;
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type ConfidenceMonitorSnapshot = Readonly<{
  monitorId: string;
  content: readonly Readonly<Record<string, Json>>[];
  state: OutputReadinessState;
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export interface OutputRolePublicationPlanSnapshot {
  readonly planId: string;
  readonly publicationId: string;
  readonly runtimeFrameNumber: string;
  readonly role: OutputRole;
  readonly roleInstanceId: string;
  readonly busId: string;
  readonly sceneReference: Readonly<Record<string, Json>> | null;
  readonly audioRouteReference: Readonly<Record<string, Json>>;
  readonly outputProfile: OutputProfileCoordinationSnapshot;
  readonly transitionParticipation: string;
  readonly cleanFeedExclusions: readonly string[];
  readonly expectedGenerations: Readonly<Record<string, number>>;
  readonly requiresNewWritableOutput: boolean;
  readonly passThroughEligible: boolean;
  readonly estimatedOutputBytes: number;
  readonly estimatedTemporaryBytes: number;
  readonly operationEstimate: number;
  readonly priority: number;
  readonly criticality: 'CRITICAL' | 'OPTIONAL';
  readonly deterministicScore: string;
  readonly warnings: readonly string[];
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface OutputRolePublicationResultSnapshot {
  readonly role: OutputRole;
  readonly roleInstanceId: string;
  readonly busId: string;
  readonly status: RolePublicationStatus;
  readonly runtimeFrameNumber: string;
  readonly outputProfile: OutputProfileCoordinationSnapshot;
  readonly sceneId: string;
  readonly sceneGeneration: number;
  readonly audioRouteId: string;
  readonly audioRouteGeneration: number;
  readonly transitionState: string;
  readonly outputReferenceSummary: Readonly<Record<string, Json>>;
  readonly passThrough: boolean;
  readonly published: boolean;
  readonly degraded: boolean;
  readonly warnings: readonly string[];
  readonly failureReason?: string;
  readonly outputBytes: number;
  readonly temporaryBytes: number;
  readonly completedAtNs: string;
}
export interface OutputPublicationRequestSnapshot {
  readonly requestId: string;
  readonly runtimeFrameNumber: string;
  readonly frameTick: Readonly<Record<string, string>>;
  readonly expectedSwitchingGeneration: number;
  readonly expectedTransitionGeneration: number;
  readonly expectedProgramVideoGeneration: number;
  readonly expectedPreviewVideoGeneration: number;
  readonly expectedProgramAudioGeneration: number;
  readonly expectedPreviewAudioGeneration: number;
  readonly outputRoleBindings: readonly string[];
  readonly outputProfileGenerations: Readonly<Record<string, number>>;
  readonly configurationGeneration: number;
  readonly deadlineNs: string;
  readonly correlationId: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export interface OutputPublicationTransactionSnapshot {
  readonly publicationId: string;
  readonly transactionGeneration: number;
  readonly runtimeFrameNumber: string;
  readonly sourceSwitchingSnapshot: Readonly<Record<string, Json>>;
  readonly transitionSnapshot: Readonly<Record<string, Json>>;
  readonly audioFollowSnapshot: Readonly<Record<string, Json>>;
  readonly requestedOutputRoles: readonly string[];
  readonly rolePlans: readonly OutputRolePublicationPlanSnapshot[];
  readonly rolePublicationResults: readonly OutputRolePublicationResultSnapshot[];
  readonly atomicityPolicy: readonly PublicationAtomicityPolicy[];
  readonly failurePolicy: string;
  readonly state: PublicationTransactionState;
  readonly warnings: readonly string[];
  readonly failureReason?: string;
  readonly createdAtNs: string;
  readonly committedAtNs: string;
  readonly completedAtNs: string;
  readonly safeMetadata: Readonly<Record<string, Json>>;
}
export type OutputReadinessSnapshot = Readonly<{
  runtimeFrameNumber: string;
  roleStates: Readonly<Record<string, OutputReadinessState>>;
  generation: number;
}>;
export type ProgramAudioVideoCorrelationSnapshot = Readonly<{
  runtimeFrameNumber: string;
  programVideoGeneration: number;
  programAudioGeneration: number;
  transitionGeneration: number;
  matched: boolean;
  degraded: boolean;
  reason?: string;
}>;
export interface ProgramPreviewBusHealthSnapshot {
  readonly engineState: string;
  readonly healthState: string;
  readonly registeredBusCount: number;
  readonly enabledBusCount: number;
  readonly activeOutputRoleCount: number;
  readonly programBusId: string;
  readonly previewBusId: string;
  readonly programSceneId: string;
  readonly previewSceneId: string;
  readonly programVideoGeneration: number;
  readonly previewVideoGeneration: number;
  readonly programAudioGeneration: number;
  readonly previewAudioGeneration: number;
  readonly switchGeneration: number;
  readonly transitionGeneration: number;
  readonly publicationGeneration: number;
  readonly activePublicationCount: number;
  readonly completedPublicationCount: number;
  readonly partialPublicationCount: number;
  readonly cancelledPublicationCount: number;
  readonly failedPublicationCount: number;
  readonly rejectedPublicationCount: number;
  readonly programPublicationCount: number;
  readonly previewPublicationCount: number;
  readonly cleanFeedPublicationCount: number;
  readonly auxPublicationCount: number;
  readonly horizontalPublicationCount: number;
  readonly verticalPublicationCount: number;
  readonly squarePublicationCount: number;
  readonly multiviewPublicationCount: number;
  readonly duplicateRequestCount: number;
  readonly duplicateTickCount: number;
  readonly duplicateRolePublicationCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly mixedTickRejectionCount: number;
  readonly programPreservationCount: number;
  readonly outputProfileMismatchCount: number;
  readonly compositorFailureCount: number;
  readonly audioVideoMismatchCount: number;
  readonly outputRoleCollisionCount: number;
  readonly heldOutputCount: number;
  readonly heldOutputBytes: number;
  readonly temporaryBytes: number;
  readonly peakTemporaryBytes: number;
  readonly lastSuccessfulProgramPublication: string;
  readonly lastFailure: string;
  readonly updatedAtNs: string;
}
export type ProgramPreviewBusTelemetrySnapshot = Readonly<Record<string, Json>>;
export type ProgramPreviewBusEngineSnapshot = Readonly<{
  configurationGeneration: number;
  buses: readonly BroadcastBusDefinitionSnapshot[];
  bindings: readonly OutputRoleBindingSnapshot[];
  program: BroadcastBusStateSnapshot;
  preview: BroadcastBusStateSnapshot;
  lastTransaction: OutputPublicationTransactionSnapshot | null;
  health: ProgramPreviewBusHealthSnapshot;
  telemetry: ProgramPreviewBusTelemetrySnapshot;
  watchdogIncidents: readonly string[];
}>;
export type ProgramPreviewBusValidationReport = Readonly<{
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
  checkedAtNs: string;
}>;
const defaultProfile = (
  id: string,
  w = 1920,
  h = 1080,
  orientation: OutputOrientation = 'LANDSCAPE',
): OutputProfileCoordinationSnapshot =>
  freeze({
    profileId: id,
    profileVersion: '1',
    profileGeneration: 1,
    width: w,
    height: h,
    frameRate: { numerator: 30000, denominator: 1001 },
    pixelFormat: 'RGBA8',
    colorMetadata: { space: 'BT709' },
    alphaMode: 'PREMULTIPLIED',
    audioFormatMetadata: { kind: 'metadata-only' },
    aspectRatio: `${w}:${h}`,
    safeArea: {},
    orientation,
    memoryDomain: 'FRAME_MEMORY',
    latencyClass: 'LIVE',
    qualityTier: 'PRODUCTION',
    routingEligibility: true,
    safeMetadata: {},
  });
const busDef = (
  busId: string,
  role: BroadcastBusRole,
  displayName: string,
  priority: number,
  criticality: 'CRITICAL' | 'OPTIONAL',
  profile = defaultProfile('default'),
): BroadcastBusDefinitionSnapshot =>
  freeze({
    busId,
    busVersion: '1',
    busGeneration: 1,
    role,
    displayName,
    outputProfile: profile,
    videoEnabled: role.includes('VIDEO') || role.includes('PROGRAM') || role === 'CLEAN_FEED',
    audioEnabled: role.includes('AUDIO'),
    sceneBindingPolicy: role.includes('PREVIEW') ? 'FOLLOW_PREVIEW' : 'FOLLOW_PROGRAM',
    audioBindingPolicy: role.includes('PREVIEW') ? 'FOLLOW_PREVIEW_AUDIO' : 'FOLLOW_PROGRAM_AUDIO',
    publicationPolicy: 'FRAME_TICK',
    readinessPolicy: 'REJECT_STALE',
    failurePolicy: 'PRESERVE_LAST_PROGRAM',
    retentionPolicy: 'BOUNDED_LAST_COMPLETE',
    priority,
    criticality,
    routingEligibility: true,
    enabled: true,
    safeMetadata: {},
    createdAtNs: '0',
    updatedAtNs: '0',
  });
export class ProgramPreviewBusOrchestrator {
  private buses = new Map<string, BroadcastBusDefinitionSnapshot>();
  private bindings = new Map<string, OutputRoleBindingSnapshot>();
  private seenTicks = new Set<string>();
  private generation = 0;
  private publicationGeneration = 0;
  private shutdownFlag = false;
  private program!: BroadcastBusStateSnapshot;
  private preview!: BroadcastBusStateSnapshot;
  private lastTx: OutputPublicationTransactionSnapshot | null = null;
  private incidents: string[] = [];
  private counters: Record<string, number> = {
    completed: 0,
    partial: 0,
    cancelled: 0,
    failed: 0,
    rejected: 0,
    program: 0,
    preview: 0,
    clean: 0,
    aux: 0,
    horizontal: 0,
    vertical: 0,
    square: 0,
    multiview: 0,
    duplicateRequest: 0,
    duplicateTick: 0,
    duplicateRole: 0,
    stale: 0,
    mixed: 0,
    preserve: 0,
    profileMismatch: 0,
    compositorFailure: 0,
    avMismatch: 0,
    roleCollision: 0,
    held: 0,
    temp: 0,
    peakTemp: 0,
  };
  constructor() {
    const p = busDef('bus.program.video', 'PROGRAM_VIDEO', 'Program Video', 1, 'CRITICAL');
    const pr = busDef('bus.preview.video', 'PREVIEW_VIDEO', 'Preview Video', 4, 'OPTIONAL');
    this.buses.set(p.busId, p);
    this.buses.set(pr.busId, pr);
    this.bindOutputRole({ outputRole: 'PROGRAM', busId: p.busId, required: true, priority: 1 });
    this.bindOutputRole({ outputRole: 'PREVIEW', busId: pr.busId, required: false, priority: 4 });
    this.program = this.emptyState(p);
    this.preview = this.emptyState(pr);
  }
  registerBus(
    input: Partial<BroadcastBusDefinitionSnapshot> & {
      busId: string;
      role: BroadcastBusRole;
      displayName?: string;
    },
  ) {
    this.ensure();
    if (this.buses.has(input.busId))
      throw new ProgramPreviewBusError('DuplicateBroadcastBus', 'duplicate bus');
    if (this.buses.size >= 64) throw new ProgramPreviewBusError('BroadcastBusInvalid', 'bus limit');
    const b = freeze({
      ...busDef(
        input.busId,
        input.role,
        input.displayName ?? input.busId,
        input.priority ?? 50,
        input.criticality ?? 'OPTIONAL',
        input.outputProfile ?? defaultProfile(`${input.busId}.profile`),
      ),
      ...input,
      busGeneration: 1,
      safeMetadata: safe(input.safeMetadata ?? {}) as Record<string, Json>,
    });
    this.buses.set(b.busId, b);
    this.generation++;
    return b;
  }
  updateBus(
    busId: string,
    expectedGeneration: number,
    patch: Partial<BroadcastBusDefinitionSnapshot>,
  ) {
    this.ensure();
    const b = this.buses.get(busId);
    if (!b) throw new ProgramPreviewBusError('BroadcastBusNotFound', 'bus not found');
    if (b.busGeneration !== expectedGeneration)
      throw new ProgramPreviewBusError(
        'OutputPublicationGenerationMismatch',
        'stale bus generation',
      );
    const n = freeze({
      ...b,
      ...patch,
      busGeneration: b.busGeneration + 1,
      updatedAtNs: String(Number(b.updatedAtNs) + 1),
      safeMetadata: safe(patch.safeMetadata ?? b.safeMetadata) as Record<string, Json>,
    });
    this.buses.set(busId, n);
    this.generation++;
    return n;
  }
  unregisterBus(busId: string) {
    this.ensure();
    const b = this.buses.get(busId);
    if (!b) throw new ProgramPreviewBusError('BroadcastBusNotFound', 'bus not found');
    if (b.criticality === 'CRITICAL' && b.enabled)
      throw new ProgramPreviewBusError(
        'BroadcastBusCriticalRemovalRejected',
        'critical active bus cannot be removed',
      );
    this.buses.delete(busId);
    this.generation++;
    return true;
  }
  bindOutputRole(input: {
    outputRole: OutputRole;
    busId: string;
    roleInstanceId?: string;
    required?: boolean;
    priority?: number;
    audioRoutePolicy?: AudioBindingPolicy;
    sceneSelectionPolicy?: SceneSelectionPolicy;
    profile?: OutputProfileCoordinationSnapshot;
    cleanFeedExclusionPolicy?: readonly string[];
  }) {
    this.ensure(false);
    const bus = this.buses.get(input.busId);
    if (!bus) throw new ProgramPreviewBusError('BroadcastBusNotFound', 'bus not found');
    const instance = input.roleInstanceId ?? input.outputRole;
    const key = `${input.outputRole}:${instance}`;
    if (this.bindings.has(key))
      throw new ProgramPreviewBusError('DuplicateOutputRoleBinding', 'duplicate role binding');
    if (this.bindings.size >= 64)
      throw new ProgramPreviewBusError('OutputRoleBindingInvalid', 'binding limit');
    const binding = freeze({
      bindingId: `binding.${key}`,
      outputRole: input.outputRole,
      roleInstanceId: instance,
      busId: input.busId,
      sceneSelectionPolicy: input.sceneSelectionPolicy ?? bus.sceneBindingPolicy,
      audioRoutePolicy: input.audioRoutePolicy ?? bus.audioBindingPolicy,
      outputProfile: input.profile ?? bus.outputProfile,
      cleanFeedExclusionPolicy: Object.freeze([...(input.cleanFeedExclusionPolicy ?? [])]),
      priority: input.priority ?? bus.priority,
      required: input.required ?? false,
      enabled: true,
      generation: 1,
      safeMetadata: {},
    });
    this.bindings.set(key, binding);
    this.generation++;
    return binding;
  }
  processFrameTick(
    tick: FrameTick,
    upstream: {
      program?: any;
      preview?: any;
      transition?: any;
      programAudio?: any;
      previewAudio?: any;
    },
  ) {
    this.ensure();
    const frame = tick.frameNumber.toString();
    if (this.seenTicks.has(frame)) {
      this.counters.duplicateTick++;
      this.incidents.push('BUS_DUPLICATE_TICK');
      throw new ProgramPreviewBusError('OutputPublicationDuplicateRequest', 'duplicate tick');
    }
    this.seenTicks.add(frame);
    if (this.seenTicks.size > 1024) this.seenTicks.delete([...this.seenTicks][0]!);
    const mismatch = [
      upstream.program,
      upstream.preview,
      upstream.transition,
      upstream.programAudio,
      upstream.previewAudio,
    ]
      .filter(Boolean)
      .some((s: any) => String(s.runtimeFrameNumber ?? s.currentRuntimeFrame ?? frame) !== frame);
    if (mismatch) {
      this.counters.mixed++;
      this.incidents.push('BUS_MIXED_TICK_INPUT');
      throw new ProgramPreviewBusError('OutputPublicationMixedTick', 'mixed tick input');
    }
    const publicationId = `publication.${frame}`;
    this.publicationGeneration++;
    const plans = this.buildPlans(publicationId, frame, upstream);
    const results = plans.map((p) => this.publishPlan(p, tick, upstream));
    if (new Set(results.map((r) => r.roleInstanceId)).size !== results.length) {
      this.counters.duplicateRole++;
      throw new ProgramPreviewBusError(
        'OutputPublicationInvariantViolation',
        'duplicate role publication',
      );
    }
    const programResult = results.find((r) => r.role === 'PROGRAM');
    if (!programResult?.published)
      throw new ProgramPreviewBusError('OutputPublicationProgramNotReady', 'program not published');
    this.program = this.stateFrom(
      this.buses.get('bus.program.video')!,
      frame,
      publicationId,
      upstream.program,
      upstream.programAudio,
      upstream.transition,
    );
    this.preview = this.stateFrom(
      this.buses.get('bus.preview.video')!,
      frame,
      publicationId,
      upstream.preview,
      upstream.previewAudio,
      upstream.transition,
    );
    const tx: OutputPublicationTransactionSnapshot = freeze({
      publicationId,
      transactionGeneration: this.publicationGeneration,
      runtimeFrameNumber: frame,
      sourceSwitchingSnapshot: safe({
        program: upstream.program,
        preview: upstream.preview,
      }) as Record<string, Json>,
      transitionSnapshot: safe(upstream.transition ?? {}) as Record<string, Json>,
      audioFollowSnapshot: safe({
        program: upstream.programAudio,
        preview: upstream.previewAudio,
      }) as Record<string, Json>,
      requestedOutputRoles: plans.map((p) => p.roleInstanceId),
      rolePlans: plans,
      rolePublicationResults: results,
      atomicityPolicy: ['ATOMIC_PROGRAM_AND_AUDIO', 'BEST_EFFORT_OPTIONAL_OUTPUTS'],
      failurePolicy: 'PRESERVE_LAST_PROGRAM',
      state: results.some((r) => r.status === 'FAILED') ? 'PARTIAL' : 'COMPLETED',
      warnings: [],
      createdAtNs: ns(tick),
      committedAtNs: ns(tick),
      completedAtNs: ns(tick),
      safeMetadata: {},
    });
    this.lastTx = tx;
    this.counters.completed++;
    this.counters.program++;
    if (results.some((r) => r.role === 'PREVIEW' && r.published)) this.counters.preview++;
    return tx;
  }
  private buildPlans(publicationId: string, frame: string, upstream: any) {
    return [...this.bindings.values()]
      .filter((b) => b.enabled)
      .sort((a, b) => a.priority - b.priority || a.roleInstanceId.localeCompare(b.roleInstanceId))
      .map((b, i) => {
        const bus = this.buses.get(b.busId)!;
        return freeze({
          planId: `plan.${publicationId}.${String(i).padStart(3, '0')}.${b.roleInstanceId}`,
          publicationId,
          runtimeFrameNumber: frame,
          role: b.outputRole,
          roleInstanceId: b.roleInstanceId,
          busId: b.busId,
          sceneReference: safe(
            b.sceneSelectionPolicy.includes('PREVIEW')
              ? upstream.preview?.scene
              : upstream.program?.scene,
          ) as Record<string, Json>,
          audioRouteReference: safe(
            b.audioRoutePolicy.includes('PREVIEW') ? upstream.previewAudio : upstream.programAudio,
          ) as Record<string, Json>,
          outputProfile: b.outputProfile,
          transitionParticipation:
            b.outputRole === 'PREVIEW' ? 'EXCLUDED' : 'FOLLOW_PROGRAM_TRANSITION',
          cleanFeedExclusions: b.cleanFeedExclusionPolicy,
          expectedGenerations: {
            bus: bus.busGeneration,
            binding: b.generation,
            profile: b.outputProfile.profileGeneration,
          },
          requiresNewWritableOutput: ![
            'RECORD',
            'STREAM',
            'MULTIVIEW',
            'CONFIDENCE_MONITOR',
          ].includes(b.outputRole),
          passThroughEligible: b.outputRole === 'PROGRAM' && !upstream.transition,
          estimatedOutputBytes: b.outputProfile.width * b.outputProfile.height * 4,
          estimatedTemporaryBytes: 0,
          operationEstimate: 1,
          priority: b.priority,
          criticality: b.required ? 'CRITICAL' : 'OPTIONAL',
          deterministicScore: `${String(b.priority).padStart(4, '0')}:${b.roleInstanceId}`,
          warnings: [],
          safeMetadata: {},
        });
      });
  }
  private publishPlan(
    p: OutputRolePublicationPlanSnapshot,
    tick: FrameTick,
    upstream: any,
  ): OutputRolePublicationResultSnapshot {
    const audio: any = p.audioRouteReference;
    const scene: any = p.sceneReference;
    const status: RolePublicationStatus = p.passThroughEligible ? 'PASSED_THROUGH' : 'PUBLISHED';
    return freeze({
      role: p.role,
      roleInstanceId: p.roleInstanceId,
      busId: p.busId,
      status,
      runtimeFrameNumber: p.runtimeFrameNumber,
      outputProfile: p.outputProfile,
      sceneId: String(scene?.sceneId ?? p.roleInstanceId),
      sceneGeneration: Number(scene?.sceneGeneration ?? 1),
      audioRouteId: String(audio?.routeId ?? `${p.roleInstanceId}.silence`),
      audioRouteGeneration: Number(audio?.routeGeneration ?? 1),
      transitionState: String((upstream.transition as any)?.state ?? 'NONE'),
      outputReferenceSummary: {
        outputId: `output.${p.runtimeFrameNumber}.${p.roleInstanceId}`,
        storageIdentity: p.requiresNewWritableOutput
          ? `writable.${p.runtimeFrameNumber}.${p.roleInstanceId}`
          : 'metadata-only',
      },
      passThrough: p.passThroughEligible,
      published: true,
      degraded: false,
      warnings: [],
      outputBytes: p.estimatedOutputBytes,
      temporaryBytes: p.estimatedTemporaryBytes,
      completedAtNs: ns(tick),
    });
  }
  private stateFrom(
    bus: BroadcastBusDefinitionSnapshot,
    frame: string,
    publicationId: string,
    scene: any,
    audio: any,
    transition: any,
  ): BroadcastBusStateSnapshot {
    return freeze({
      busId: bus.busId,
      busVersion: bus.busVersion,
      busGeneration: bus.busGeneration,
      role: bus.role,
      runtimeFrameNumber: frame,
      sceneReference: safe(scene ?? {}) as Record<string, Json>,
      sceneGeneration: Number(scene?.sceneGeneration ?? 1),
      videoFrameSummary: { runtimeFrameNumber: frame },
      audioRouteSummary: safe(audio ?? {}) as Record<string, Json>,
      transitionSummary: safe(transition ?? {}) as Record<string, Json>,
      outputProfile: bus.outputProfile,
      readiness: 'READY',
      health: 'HEALTHY',
      publicationState: 'PUBLISHED',
      lastPublicationId: publicationId,
      lastSuccessfulRuntimeFrame: frame,
      degradedReasons: [],
      safeMetadata: {},
    });
  }
  private emptyState(bus: BroadcastBusDefinitionSnapshot) {
    return this.stateFrom(bus, '0', 'none', null, null, null);
  }
  getSnapshot(): ProgramPreviewBusEngineSnapshot {
    return freeze({
      configurationGeneration: this.generation,
      buses: [...this.buses.values()].sort((a, b) => a.busId.localeCompare(b.busId)),
      bindings: [...this.bindings.values()].sort((a, b) => a.bindingId.localeCompare(b.bindingId)),
      program: this.program,
      preview: this.preview,
      lastTransaction: this.lastTx,
      health: this.health(),
      telemetry: this.telemetry(),
      watchdogIncidents: this.incidents.slice(-64),
    });
  }
  health(): ProgramPreviewBusHealthSnapshot {
    return freeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'RUNNING',
      healthState: this.counters.mixed ? 'DEGRADED' : 'HEALTHY',
      registeredBusCount: this.buses.size,
      enabledBusCount: [...this.buses.values()].filter((b) => b.enabled).length,
      activeOutputRoleCount: this.bindings.size,
      programBusId: 'bus.program.video',
      previewBusId: 'bus.preview.video',
      programSceneId: String((this.program.sceneReference as any)?.sceneId ?? ''),
      previewSceneId: String((this.preview.sceneReference as any)?.sceneId ?? ''),
      programVideoGeneration: this.program.busGeneration,
      previewVideoGeneration: this.preview.busGeneration,
      programAudioGeneration: Number((this.program.audioRouteSummary as any)?.routeGeneration ?? 0),
      previewAudioGeneration: Number((this.preview.audioRouteSummary as any)?.routeGeneration ?? 0),
      switchGeneration: Number((this.program.sceneReference as any)?.switchGeneration ?? 0),
      transitionGeneration: Number((this.program.transitionSummary as any)?.generation ?? 0),
      publicationGeneration: this.publicationGeneration,
      activePublicationCount: 0,
      completedPublicationCount: this.counters.completed,
      partialPublicationCount: this.counters.partial,
      cancelledPublicationCount: this.counters.cancelled,
      failedPublicationCount: this.counters.failed,
      rejectedPublicationCount: this.counters.rejected,
      programPublicationCount: this.counters.program,
      previewPublicationCount: this.counters.preview,
      cleanFeedPublicationCount: this.counters.clean,
      auxPublicationCount: this.counters.aux,
      horizontalPublicationCount: this.counters.horizontal,
      verticalPublicationCount: this.counters.vertical,
      squarePublicationCount: this.counters.square,
      multiviewPublicationCount: this.counters.multiview,
      duplicateRequestCount: this.counters.duplicateRequest,
      duplicateTickCount: this.counters.duplicateTick,
      duplicateRolePublicationCount: this.counters.duplicateRole,
      staleGenerationRejectionCount: this.counters.stale,
      mixedTickRejectionCount: this.counters.mixed,
      programPreservationCount: this.counters.preserve,
      outputProfileMismatchCount: this.counters.profileMismatch,
      compositorFailureCount: this.counters.compositorFailure,
      audioVideoMismatchCount: this.counters.avMismatch,
      outputRoleCollisionCount: this.counters.roleCollision,
      heldOutputCount: this.counters.held,
      heldOutputBytes: 0,
      temporaryBytes: this.counters.temp,
      peakTemporaryBytes: this.counters.peakTemp,
      lastSuccessfulProgramPublication: this.program.lastPublicationId,
      lastFailure: this.incidents.at(-1) ?? '',
      updatedAtNs: '0',
    });
  }
  telemetry(): ProgramPreviewBusTelemetrySnapshot {
    return freeze({
      ...this.counters,
      currentPublicationId: this.lastTx?.publicationId ?? '',
      activeRoleIds: [...this.bindings.keys()].sort(),
      lastBusEvent: this.shutdownFlag ? 'BusOrchestratorShutdown' : 'PublicationCompleted',
      healthSummary: this.counters.mixed ? 'DEGRADED' : 'HEALTHY',
    });
  }
  validate(): ProgramPreviewBusValidationReport {
    const errors: string[] = [];
    try {
      this.assertInvariants();
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
    return freeze({ valid: errors.length === 0, errors, warnings: [], checkedAtNs: '0' });
  }
  assertInvariants() {
    if (!this.buses.has('bus.program.video') || !this.buses.has('bus.preview.video'))
      throw new ProgramPreviewBusError(
        'OutputPublicationInvariantViolation',
        'missing default buses',
      );
    if (this.program.busId === this.preview.busId)
      throw new ProgramPreviewBusError(
        'OutputPublicationInvariantViolation',
        'program preview alias',
      );
    if (this.lastTx) {
      const ids = this.lastTx.rolePublicationResults.map((r) => r.roleInstanceId);
      if (new Set(ids).size !== ids.length)
        throw new ProgramPreviewBusError(
          'OutputPublicationInvariantViolation',
          'duplicate role results',
        );
      if (
        this.lastTx.rolePublicationResults.filter((r) => r.role === 'PROGRAM' && r.published)
          .length !== 1
      )
        throw new ProgramPreviewBusError(
          'OutputPublicationInvariantViolation',
          'program not exactly once',
        );
    }
    return true;
  }
  shutdown() {
    this.bindings.clear();
    this.lastTx = null;
    this.shutdownFlag = true;
    this.incidents.push('BusOrchestratorShutdown');
  }
  private ensure(throwOnShutdown = true) {
    if (this.shutdownFlag && throwOnShutdown)
      throw new ProgramPreviewBusError('BusOrchestratorShutdownError', 'bus orchestrator shutdown');
  }
}
export const createProgramPreviewBusOrchestrator = () => new ProgramPreviewBusOrchestrator();
export class ProgramPreviewBusOrchestrationProcessor implements TickProcessor {
  readonly id = 'program-preview-bus-orchestration-processor';
  readonly order = PROGRAM_PREVIEW_BUS_PROCESSOR_ORDER.busOrchestration;
  constructor(readonly orchestrator: ProgramPreviewBusOrchestrator) {}
  initialize() {}
  shutdown() {
    this.orchestrator.shutdown();
    return { status: 'STOPPED' as const };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const program = context.outputs.readDependencyOutput<any>(
      'scene-switching-processor',
      SCENE_SWITCHING_OUTPUT_KEYS.programBusSnapshot,
    );
    const preview = context.outputs.readDependencyOutput<any>(
      'scene-switching-processor',
      SCENE_SWITCHING_OUTPUT_KEYS.previewBusSnapshot,
    );
    const transition = context.outputs.readDependencyOutput<any>(
      'transition-execution-processor',
      TRANSITION_OUTPUT_KEYS.activeInstance,
    );
    const programAudio = context.outputs.readDependencyOutput<any>(
      'audio-follow-video-processor',
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.programAudioRoute,
    );
    const previewAudio = context.outputs.readDependencyOutput<any>(
      'audio-follow-video-processor',
      AUDIO_FOLLOW_VIDEO_OUTPUT_KEYS.previewAudioRoute,
    );
    const tx = this.orchestrator.processFrameTick(tick, {
      program,
      preview,
      transition,
      programAudio,
      previewAudio,
    });
    context.outputs.publish(
      this.id,
      PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.activePublicationTransaction,
      tx,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.programState,
      this.orchestrator.getSnapshot().program,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.previewState,
      this.orchestrator.getSnapshot().preview,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.rolePublicationPlans,
      tx.rolePlans,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.rolePublicationResults,
      tx.rolePublicationResults,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.health,
      this.orchestrator.health(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.telemetry,
      this.orchestrator.telemetry(),
      'OWNED_BY_PROCESSOR',
    );
    return { status: 'SUCCEEDED' as const, value: tx };
  }
}
export function createProgramPreviewBusCommandHandlers(
  orchestrator: ProgramPreviewBusOrchestrator,
): Readonly<Record<string, RuntimeCommandHandler>> {
  const h = (type: string, fn: (p: any) => unknown): RuntimeCommandHandler => ({
    commandType: type,
    idempotent: true,
    execute: async (c: RuntimeCommand) => ({ status: 'SUCCEEDED', value: fn(c.payload) }) as any,
  });
  return {
    BUS_REGISTER: h('BUS_REGISTER', (p) => orchestrator.registerBus(p)),
    BUS_UNREGISTER: h('BUS_UNREGISTER', (p) => orchestrator.unregisterBus(p.busId)),
    BUS_UPDATE: h('BUS_UPDATE', (p) =>
      orchestrator.updateBus(p.busId, p.expectedGeneration, p.patch),
    ),
    BUS_BIND_OUTPUT_ROLE: h('BUS_BIND_OUTPUT_ROLE', (p) => orchestrator.bindOutputRole(p)),
    BUS_VALIDATE: h('BUS_VALIDATE', () => orchestrator.validate()),
    BUS_SHUTDOWN: h('BUS_SHUTDOWN', () => orchestrator.shutdown()),
  };
}
