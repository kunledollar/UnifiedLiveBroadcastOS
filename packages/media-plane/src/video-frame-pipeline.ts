import type { FrameTick, ProcessorRuntimeContext, TickProcessor } from './execution-engine.js';
import { RuntimeEngineError, type ProcessorTickResult } from './execution-engine.js';
import { SOURCE_OUTPUT_KEYS, type VideoFrameEnvelope } from './source-acquisition.js';

export type VideoPipelineLifecycleState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'RUNNING'
  | 'PAUSING'
  | 'PAUSED'
  | 'RECONFIGURING'
  | 'DEGRADED'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED';
export type VideoPipelineHealthState =
  'UNKNOWN' | 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'FAILED' | 'PAUSED' | 'STOPPED';
export type VideoPipelineStageKind =
  | 'INPUT_VALIDATION'
  | 'FRAME_IMPORT'
  | 'FORMAT_INSPECTION'
  | 'PASS_THROUGH'
  | 'SCALE_PLACEHOLDER'
  | 'COLOR_CONVERSION_PLACEHOLDER'
  | 'COLOR_CONVERSION'
  | 'COLOR_CORRECTION_PLACEHOLDER'
  | 'GEOMETRY_PLACEHOLDER'
  | 'LAYER_COMPOSITOR_PLACEHOLDER'
  | 'SCENE_COMPOSITOR_PLACEHOLDER'
  | 'OUTPUT_VALIDATION'
  | 'CUSTOM';
export type VideoPipelineStagePhase =
  | 'VALIDATE_INPUT'
  | 'IMPORT_FRAME'
  | 'INSPECT_FORMAT'
  | 'PRE_PROCESS'
  | 'TRANSFORM'
  | 'POST_PROCESS'
  | 'VALIDATE_OUTPUT'
  | 'PUBLISH_OUTPUT';
export type VideoPipelineStageCriticality = 'CRITICAL' | 'IMPORTANT' | 'OPTIONAL';
export type VideoPipelineStageExecutionStatus =
  'COMPLETED' | 'PASSED_THROUGH' | 'SKIPPED' | 'FAILED' | 'TIMED_OUT' | 'CANCELLED';
export type VideoFrameProcessStatus =
  'COMPLETED' | 'PASSED_THROUGH' | 'DROPPED' | 'CANCELLED' | 'FAILED' | 'DEGRADED' | 'REJECTED';
export type VideoPipelineDropReason =
  | 'DROP_LATE_INPUT'
  | 'DROP_ON_BUDGET_EXHAUSTION'
  | 'DROP_ON_REQUIRED_STAGE_FAILURE'
  | 'DROP_ON_MEMORY_PRESSURE'
  | 'DROP_ON_GPU_LOSS'
  | 'DROP_DUPLICATE_INPUT'
  | 'DROP_STALE_GENERATION'
  | 'NEVER_DROP_CRITICAL_FRAME';
export type VideoPipelineCancellationState =
  | 'NOT_CANCELLED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED_BEFORE_START'
  | 'CANCELLED_DURING_STAGE'
  | 'CANCELLED_AFTER_STAGE'
  | 'COMPLETED_BEFORE_CANCELLATION';
export type VideoPipelineFailurePolicy =
  | 'FAIL_PIPELINE'
  | 'FAIL_FRAME'
  | 'DROP_FRAME'
  | 'SKIP_OPTIONAL_STAGE'
  | 'PASS_THROUGH_ON_OPTIONAL_FAILURE'
  | 'DEGRADE_PIPELINE'
  | 'REQUEST_RETRY'
  | 'REQUEST_OPERATOR_INTERVENTION';
export type VideoPipelineOrderingPolicy =
  | 'STRICT_RUNTIME_FRAME_ORDER'
  | 'PER_SOURCE_FRAME_ORDER'
  | 'ALLOW_INDEPENDENT_SOURCES'
  | 'SINGLE_IN_FLIGHT';
export type VideoFrameState = 'READY' | 'LEASED' | 'PINNED' | 'LOST' | 'RELEASED' | 'FAILED';
export type VideoPipelineFlushReason = 'RECONFIGURE' | 'CANCEL' | 'SHUTDOWN' | 'OPERATOR';
export type VideoPipelineMemoryDomain = 'OPAQUE' | 'CPU' | 'GPU' | 'DMA' | 'HARDWARE';

type JsonSafe =
  string | number | boolean | null | readonly JsonSafe[] | { readonly [key: string]: JsonSafe };
const phaseOrder: Record<VideoPipelineStagePhase, number> = {
  VALIDATE_INPUT: 0,
  IMPORT_FRAME: 1,
  INSPECT_FORMAT: 2,
  PRE_PROCESS: 3,
  TRANSFORM: 4,
  POST_PROCESS: 5,
  VALIDATE_OUTPUT: 6,
  PUBLISH_OUTPUT: 7,
};
const redactKey = /token|secret|password|credential|cookie|url|path|handle|pointer|native|device/i;
const safe = (v: unknown, depth = 0): JsonSafe => {
  if (depth > 4) return '[Truncated]';
  if (v == null || typeof v === 'boolean' || typeof v === 'number') return v as JsonSafe;
  if (typeof v === 'string') return v.length > 512 ? `${v.slice(0, 512)}…` : v;
  if (typeof v === 'bigint') return v.toString();
  if (Array.isArray(v)) return v.slice(0, 32).map((x) => safe(x, depth + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .slice(0, 64)
        .map(([k, val]) => [k, redactKey.test(k) ? '[REDACTED]' : safe(val, depth + 1)]),
    );
  return String(v);
};
export const deepFreezeVideoPipeline = <T>(value: T): Readonly<T> => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as Record<string, unknown>)) deepFreezeVideoPipeline(v);
  }
  return value as Readonly<T>;
};
const cloneFreeze = <T>(value: T): Readonly<T> => deepFreezeVideoPipeline(structuredClone(value));
const nsString = (n: bigint) => n.toString();

export class VideoPipelineError extends RuntimeEngineError {}
const vpe = (code: string, message: string, details: Record<string, unknown> = {}) =>
  new VideoPipelineError(code, message, details);
export class DuplicateVideoPipelineStage extends VideoPipelineError {
  constructor(id: string) {
    super('DuplicateVideoPipelineStage', `Duplicate video pipeline stage ${id}`, { id });
  }
}
export class VideoPipelineStageNotFound extends VideoPipelineError {
  constructor(id: string) {
    super('VideoPipelineStageNotFound', `Video pipeline stage ${id} was not found`, { id });
  }
}
export class VideoPipelineNotRunning extends VideoPipelineError {
  constructor(state: string) {
    super('VideoPipelineNotRunning', `Video pipeline is not running from ${state}`, { state });
  }
}
export class VideoPipelineDuplicateFrameRequest extends VideoPipelineError {
  constructor(id: string) {
    super('VideoPipelineDuplicateFrameRequest', `Duplicate video frame request ${id}`, { id });
  }
}
export class VideoPipelineInvariantViolation extends VideoPipelineError {
  constructor(message: string) {
    super('VideoPipelineInvariantViolation', message);
  }
}

export interface VideoPipelineWarning {
  readonly code: string;
  readonly message: string;
  readonly metadata?: Readonly<Record<string, JsonSafe>>;
}
export interface VideoPipelineStageDescriptor {
  readonly stageId: string;
  readonly stageKind: VideoPipelineStageKind;
  readonly displayName: string;
  readonly version: string;
  readonly phase: VideoPipelineStagePhase;
  readonly order: number;
  readonly dependencies: readonly string[];
  readonly optionalDependencies?: readonly string[];
  readonly requiredInputMediaKinds: readonly 'VIDEO'[];
  readonly supportedInputFormats: readonly string[];
  readonly supportedOutputFormats: readonly string[];
  readonly inputMemoryDomains: readonly VideoPipelineMemoryDomain[];
  readonly outputMemoryDomains: readonly VideoPipelineMemoryDomain[];
  readonly canPassThrough: boolean;
  readonly requiresGpu: boolean;
  readonly mutatesPixels: boolean;
  readonly producesNewFrame: boolean;
  readonly preservesTimestamp: boolean;
  readonly preservesSourceIdentity: boolean;
  readonly criticality: VideoPipelineStageCriticality;
  readonly enabled: boolean;
  readonly optional: boolean;
  readonly timeoutNs: bigint;
  readonly budgetNs: bigint;
  readonly maximumInFlight: number;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface VideoPipelineOutputProfile {
  readonly profileId: string;
  readonly expectedMediaKind: 'VIDEO';
  readonly expectedWidth: number;
  readonly expectedHeight: number;
  readonly expectedFormat: string;
  readonly expectedColorMetadata?: Readonly<Record<string, JsonSafe>>;
  readonly expectedMemoryDomain: VideoPipelineMemoryDomain;
  readonly requiresGpu: boolean;
  readonly allowPassThrough: boolean;
  readonly allowFormatMismatch: boolean;
  readonly maximumLatencyNs: bigint;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface VideoFramePipelineConfiguration {
  readonly configurationId: string;
  readonly generation: bigint;
  readonly enabledStageIds: readonly string[];
  readonly stageOverrides: Readonly<
    Record<
      string,
      Partial<Pick<VideoPipelineStageDescriptor, 'enabled' | 'timeoutNs' | 'budgetNs'>>
    >
  >;
  readonly outputProfile: Readonly<VideoPipelineOutputProfile>;
  readonly frameDeadlinePolicy: 'DROP_LATE' | 'ALLOW_LATE';
  readonly stageTimeoutPolicy: 'FAIL_STAGE' | 'SKIP_OPTIONAL';
  readonly failurePolicy: VideoPipelineFailurePolicy;
  readonly dropPolicy: readonly VideoPipelineDropReason[];
  readonly overloadPolicy: 'DROP' | 'DEGRADE' | 'REJECT';
  readonly temporaryMemoryBudgetBytes: number;
  readonly maximumConcurrentFrames: number;
  readonly maximumConcurrentPerSource: number;
  readonly maximumConcurrentPerStage: number;
  readonly orderingPolicy: VideoPipelineOrderingPolicy;
  readonly historyCapacity: number;
  readonly diagnosticsMode: boolean;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface VideoPipelineFrameReference {
  readonly frameId: string;
  readonly storageId: string;
  readonly frameGeneration: bigint;
  readonly storageGeneration: bigint;
  readonly leaseId: string;
  readonly ownerId: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly sequenceNumber: bigint;
  readonly runtimeFrameNumber: bigint;
  readonly format: Readonly<Record<string, JsonSafe>>;
  readonly memoryDomain: VideoPipelineMemoryDomain;
  readonly state: VideoFrameState;
  readonly sourceTimestampNs: bigint;
  readonly normalizedTimestampNs: bigint;
  readonly discontinuity: boolean;
  readonly gpuResource?: Readonly<Record<string, JsonSafe>>;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface VideoFrameProcessRequest {
  readonly requestId: string;
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrameId: string;
  readonly inputLeaseId: string;
  readonly inputFrame?: Readonly<VideoPipelineFrameReference>;
  readonly expectedFrameGeneration: bigint;
  readonly expectedStorageGeneration: bigint;
  readonly runtimeFrameNumber: bigint;
  readonly frameTick: Readonly<FrameTick>;
  readonly targetOutputProfileId: string;
  readonly pipelineConfigurationGeneration: bigint;
  readonly deadlineNs: bigint;
  readonly cancellationSignal?: AbortSignal | undefined;
  readonly correlationId?: string;
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface VideoFrameProcessContext {
  readonly requestId: string;
  readonly runtimeFrameNumber: bigint;
  readonly frameTick: Readonly<FrameTick>;
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrameIdentity: string;
  readonly inputDescriptor: Readonly<Record<string, JsonSafe>>;
  readonly inputLeaseSnapshot: Readonly<Record<string, JsonSafe>>;
  readonly pipelineGeneration: bigint;
  readonly configurationGeneration: bigint;
  readonly stageExecutionOrder: readonly string[];
  readonly deadlineNs: bigint;
  readonly startedAtNs: bigint;
  readonly elapsedBudgetNs: bigint;
  readonly remainingBudgetNs: bigint;
  readonly cancellationState: VideoPipelineCancellationState;
  readonly discontinuity: boolean;
  readonly processingFlags: readonly string[];
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface VideoPipelineStageInput {
  readonly inputFrame: Readonly<VideoPipelineFrameReference>;
  readonly priorStageOutputs: ReadonlyMap<string, Readonly<VideoPipelineStageOutput>>;
  readonly frameContext: Readonly<VideoFrameProcessContext>;
}
export interface VideoPipelineStageOutput {
  readonly stageId: string;
  readonly status: VideoPipelineStageExecutionStatus;
  readonly inputFrameId: string;
  readonly outputFrameId: string;
  readonly outputLeaseId: string;
  readonly outputGeneration: bigint;
  readonly passThrough: boolean;
  readonly producedNewFrame: boolean;
  readonly timestampPreserved: boolean;
  readonly sourceIdentityPreserved: boolean;
  readonly durationNs: bigint;
  readonly warnings: readonly VideoPipelineWarning[];
  readonly metadata: Readonly<Record<string, JsonSafe>>;
}
export interface VideoPipelineStageResult {
  readonly status: VideoPipelineStageExecutionStatus;
  readonly output: Readonly<VideoPipelineStageOutput>;
}
export interface VideoPipelineStageInitializationContext {
  readonly pipelineGeneration: bigint;
  readonly configuration: Readonly<VideoFramePipelineConfiguration>;
  readonly nowNs: () => bigint;
}
export interface VideoPipelineStageRuntimeContext extends VideoPipelineStageInitializationContext {
  readonly requestId: string;
  readonly stageId: string;
  readonly stageExecutionState: Readonly<Record<string, VideoPipelineStageExecutionStatus>>;
  readonly cancellationSignal?: AbortSignal | undefined;
  readonly allocateTemporaryFrame: (bytes: number) => string;
  readonly releaseTemporaryFrame: (id: string) => void;
}
export interface VideoPipelineStageShutdownContext {
  readonly pipelineGeneration: bigint;
  readonly reason: VideoPipelineFlushReason;
  readonly nowNs: () => bigint;
}
export type VideoPipelineStageInitializationResult = {
  readonly status: 'READY' | 'DEGRADED';
  readonly warnings?: readonly VideoPipelineWarning[];
};
export type VideoPipelineStageReconfigurationRequest = {
  readonly generation: bigint;
  readonly descriptorOverride?: Partial<VideoPipelineStageDescriptor>;
};
export type VideoPipelineStageReconfigurationResult = {
  readonly status: 'RECONFIGURED' | 'UNCHANGED' | 'FAILED';
  readonly warnings?: readonly VideoPipelineWarning[];
};
export interface VideoFramePipelineStage {
  readonly descriptor: Readonly<VideoPipelineStageDescriptor>;
  initialize(
    context: VideoPipelineStageInitializationContext,
  ): Promise<VideoPipelineStageInitializationResult> | VideoPipelineStageInitializationResult;
  process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageResult> | VideoPipelineStageResult;
  reconfigure?(
    request: VideoPipelineStageReconfigurationRequest,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<VideoPipelineStageReconfigurationResult> | VideoPipelineStageReconfigurationResult;
  flush?(
    reason: VideoPipelineFlushReason,
    context: VideoPipelineStageRuntimeContext,
  ): Promise<void> | void;
  shutdown(context: VideoPipelineStageShutdownContext): Promise<void> | void;
}
export interface VideoFrameProcessResult {
  readonly requestId: string;
  readonly pipelineGeneration: bigint;
  readonly configurationGeneration: bigint;
  readonly runtimeFrameNumber: bigint;
  readonly sourceId: string;
  readonly streamId: string;
  readonly inputFrameId: string;
  readonly outputFrame?: Readonly<VideoPipelineFrameReference>;
  readonly status: VideoFrameProcessStatus;
  readonly dropReason?: VideoPipelineDropReason;
  readonly cancellationState: VideoPipelineCancellationState;
  readonly stageResults: readonly Readonly<VideoPipelineStageOutput>[];
  readonly warnings: readonly VideoPipelineWarning[];
  readonly totalDurationNs: bigint;
  readonly budgetResult: Readonly<Record<string, JsonSafe>>;
  readonly ownershipTransfer: Readonly<Record<string, JsonSafe>>;
  readonly telemetryDelta: Readonly<Record<string, JsonSafe>>;
  readonly completedAtNs: bigint;
}
export interface VideoFramePipelineTelemetrySnapshot {
  readonly totalFrameRequests: number;
  readonly totalFramesAccepted: number;
  readonly totalFramesCompleted: number;
  readonly totalFramesPassedThrough: number;
  readonly totalFramesDropped: number;
  readonly totalFramesCancelled: number;
  readonly totalFramesFailed: number;
  readonly totalDuplicateRequests: number;
  readonly totalStaleGenerationRejects: number;
  readonly totalStageExecutions: number;
  readonly totalStageSkips: number;
  readonly totalStageFailures: number;
  readonly totalStageTimeouts: number;
  readonly totalPipelineOverruns: number;
  readonly totalTemporaryFrameAllocations: number;
  readonly peakTemporaryFrames: number;
  readonly peakTemporaryBytes: number;
  readonly totalInputValidationFailures: number;
  readonly totalOutputValidationFailures: number;
  readonly totalGpuLostDrops: number;
  readonly totalMemoryPressureDrops: number;
  readonly averagePipelineDurationNs: string;
  readonly maximumPipelineDurationNs: string;
  readonly averageStageDurationNs: string;
  readonly maximumStageDurationNs: string;
  readonly currentInFlightRequestIds: readonly string[];
  readonly lastPipelineEvent?: string;
  readonly healthSummary: VideoPipelineHealthState;
}
export interface VideoFramePipelineHealthSnapshot {
  readonly pipelineLifecycleState: VideoPipelineLifecycleState;
  readonly healthState: VideoPipelineHealthState;
  readonly configurationGeneration: string;
  readonly stageCount: number;
  readonly enabledStageCount: number;
  readonly failedStageCount: number;
  readonly activeFrameCount: number;
  readonly queuedFrameCount: number;
  readonly completedFrameCount: number;
  readonly droppedFrameCount: number;
  readonly cancelledFrameCount: number;
  readonly failedFrameCount: number;
  readonly duplicateRequestCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly inputValidationFailureCount: number;
  readonly outputValidationFailureCount: number;
  readonly budgetOverrunCount: number;
  readonly stageTimeoutCount: number;
  readonly temporaryFrameCount: number;
  readonly temporaryFrameBytes: number;
  readonly lostGpuFrameCount: number;
  readonly leaseCleanupFailureCount: number;
  readonly lastProcessedRuntimeFrame?: string;
  readonly lastSuccessfulFrame?: string;
  readonly lastFailure?: Readonly<Record<string, JsonSafe>>;
  readonly updatedAtNs: string;
}
export interface VideoPipelineStageSnapshot {
  readonly descriptor: Readonly<
    Omit<VideoPipelineStageDescriptor, 'timeoutNs' | 'budgetNs'> & {
      timeoutNs: string;
      budgetNs: string;
    }
  >;
  readonly initialized: boolean;
  readonly failed: boolean;
  readonly executionCount: number;
  readonly failureCount: number;
  readonly lastDurationNs: string;
}
export interface VideoFramePipelineSnapshot {
  readonly lifecycleState: VideoPipelineLifecycleState;
  readonly pipelineGeneration: string;
  readonly configuration: Readonly<VideoFramePipelineConfigurationSnapshot>;
  readonly stages: readonly Readonly<VideoPipelineStageSnapshot>[];
  readonly health: Readonly<VideoFramePipelineHealthSnapshot>;
  readonly telemetry: Readonly<VideoFramePipelineTelemetrySnapshot>;
}
export type VideoFramePipelineConfigurationSnapshot = Omit<
  VideoFramePipelineConfiguration,
  'generation' | 'outputProfile'
> & {
  readonly generation: string;
  readonly outputProfile: Omit<VideoPipelineOutputProfile, 'maximumLatencyNs'> & {
    readonly maximumLatencyNs: string;
  };
};
export interface VideoFramePipelineValidationReport {
  readonly ok: boolean;
  readonly errors: readonly VideoPipelineWarning[];
  readonly orderedStageIds: readonly string[];
}
export type VideoPipelineInitializationContext = {
  readonly configuration?: Partial<VideoFramePipelineConfiguration>;
  readonly nowNs?: () => bigint;
};
export type VideoPipelineInitializationResult = {
  readonly status: 'READY' | 'FAILED';
  readonly generation: bigint;
  readonly validation: VideoFramePipelineValidationReport;
};
export type VideoPipelineRuntimeContext = { readonly nowNs: () => bigint };
export type VideoPipelineReconfigurationRequest = {
  readonly expectedGeneration: bigint;
  readonly configuration: Partial<VideoFramePipelineConfiguration>;
};
export type VideoPipelineReconfigurationResult = {
  readonly status: 'RECONFIGURED';
  readonly generation: bigint;
  readonly configurationGeneration: bigint;
};

export const VIDEO_PIPELINE_OUTPUT_KEYS = Object.freeze({
  importedSourceVideoFrames: 'videoPipeline.importedSourceVideoFrames',
  frameRequests: 'videoPipeline.frameRequests',
  results: 'videoPipeline.results',
  processedFrameReferences: 'videoPipeline.processedFrameReferences',
  droppedFrameResults: 'videoPipeline.droppedFrameResults',
  health: 'videoPipeline.health',
  telemetry: 'videoPipeline.telemetry',
});
export const VIDEO_PIPELINE_COMMAND_TYPES = Object.freeze([
  'VIDEO_PIPELINE_INITIALIZE',
  'VIDEO_PIPELINE_START',
  'VIDEO_PIPELINE_PAUSE',
  'VIDEO_PIPELINE_RESUME',
  'VIDEO_PIPELINE_STOP',
  'VIDEO_PIPELINE_REGISTER_STAGE',
  'VIDEO_PIPELINE_UNREGISTER_STAGE',
  'VIDEO_PIPELINE_ENABLE_STAGE',
  'VIDEO_PIPELINE_DISABLE_STAGE',
  'VIDEO_PIPELINE_RECONFIGURE',
  'VIDEO_PIPELINE_PROCESS_FRAME',
  'VIDEO_PIPELINE_CANCEL_FRAME',
  'VIDEO_PIPELINE_FLUSH',
  'VIDEO_PIPELINE_VALIDATE',
  'VIDEO_PIPELINE_SET_OUTPUT_PROFILE',
  'VIDEO_PIPELINE_SET_BUDGET',
] as const);
export const VIDEO_PIPELINE_WATCHDOG_INCIDENTS = Object.freeze([
  'VIDEO_PIPELINE_STALLED',
  'VIDEO_PIPELINE_STAGE_FAILED',
  'VIDEO_PIPELINE_STAGE_TIMEOUT',
  'VIDEO_PIPELINE_BUDGET_EXCEEDED',
  'VIDEO_PIPELINE_DUPLICATE_FRAME',
  'VIDEO_PIPELINE_STALE_GENERATION',
  'VIDEO_PIPELINE_INPUT_INVALID',
  'VIDEO_PIPELINE_OUTPUT_INVALID',
  'VIDEO_PIPELINE_FRAME_LEAK',
  'VIDEO_PIPELINE_TEMP_MEMORY_PRESSURE',
  'VIDEO_PIPELINE_GPU_RESOURCE_LOST',
  'VIDEO_PIPELINE_CONFIGURATION_INVALID',
  'VIDEO_PIPELINE_GRAPH_MISMATCH',
  'VIDEO_PIPELINE_INVARIANT_FAILURE',
] as const);

export const defaultVideoPipelineOutputProfile = (): VideoPipelineOutputProfile =>
  deepFreezeVideoPipeline({
    profileId: 'default-video-pass-through',
    expectedMediaKind: 'VIDEO',
    expectedWidth: 1920,
    expectedHeight: 1080,
    expectedFormat: 'RGBA8',
    expectedMemoryDomain: 'CPU',
    requiresGpu: false,
    allowPassThrough: true,
    allowFormatMismatch: true,
    maximumLatencyNs: 33_000_000n,
    metadata: {},
  }) as VideoPipelineOutputProfile;
export const defaultVideoFramePipelineConfiguration = (): VideoFramePipelineConfiguration =>
  deepFreezeVideoPipeline({
    configurationId: 'default-video-pipeline',
    generation: 1n,
    enabledStageIds: ['input-validation', 'format-inspection', 'pass-through', 'output-validation'],
    stageOverrides: {},
    outputProfile: defaultVideoPipelineOutputProfile(),
    frameDeadlinePolicy: 'ALLOW_LATE',
    stageTimeoutPolicy: 'FAIL_STAGE',
    failurePolicy: 'FAIL_FRAME',
    dropPolicy: ['DROP_DUPLICATE_INPUT', 'DROP_STALE_GENERATION', 'DROP_ON_REQUIRED_STAGE_FAILURE'],
    overloadPolicy: 'DROP',
    temporaryMemoryBudgetBytes: 16 * 1024 * 1024,
    maximumConcurrentFrames: 1,
    maximumConcurrentPerSource: 1,
    maximumConcurrentPerStage: 1,
    orderingPolicy: 'SINGLE_IN_FLIGHT',
    historyCapacity: 256,
    diagnosticsMode: false,
    metadata: {},
  }) as VideoFramePipelineConfiguration;
const snapConfig = (
  c: VideoFramePipelineConfiguration,
): VideoFramePipelineConfigurationSnapshot => ({
  ...c,
  generation: nsString(c.generation),
  outputProfile: {
    ...c.outputProfile,
    maximumLatencyNs: nsString(c.outputProfile.maximumLatencyNs),
  },
});
const descriptor = (
  stageId: string,
  stageKind: VideoPipelineStageKind,
  phase: VideoPipelineStagePhase,
  order: number,
  extra: Partial<VideoPipelineStageDescriptor> = {},
): VideoPipelineStageDescriptor =>
  deepFreezeVideoPipeline({
    stageId,
    stageKind,
    displayName: stageId,
    version: '5.3.3',
    phase,
    order,
    dependencies: [],
    optionalDependencies: [],
    requiredInputMediaKinds: ['VIDEO'],
    supportedInputFormats: ['*'],
    supportedOutputFormats: ['*'],
    inputMemoryDomains: ['OPAQUE', 'CPU', 'GPU', 'DMA', 'HARDWARE'],
    outputMemoryDomains: ['OPAQUE', 'CPU', 'GPU', 'DMA', 'HARDWARE'],
    canPassThrough: true,
    requiresGpu: false,
    mutatesPixels: false,
    producesNewFrame: false,
    preservesTimestamp: true,
    preservesSourceIdentity: true,
    criticality: 'CRITICAL',
    enabled: true,
    optional: false,
    timeoutNs: 1_000_000n,
    budgetNs: 1_000_000n,
    maximumInFlight: 1,
    ...extra,
    metadata: safe(extra.metadata ?? {}) as Record<string, JsonSafe>,
  }) as VideoPipelineStageDescriptor;

class BasicStage implements VideoFramePipelineStage {
  constructor(
    readonly descriptor: VideoPipelineStageDescriptor,
    private readonly fn?: (
      i: VideoPipelineStageInput,
      c: VideoPipelineStageRuntimeContext,
    ) => VideoPipelineStageResult,
  ) {}
  initialize(): VideoPipelineStageInitializationResult {
    return { status: 'READY' as const };
  }
  process(
    input: VideoPipelineStageInput,
    context: VideoPipelineStageRuntimeContext,
  ): VideoPipelineStageResult {
    if (this.fn) return this.fn(input, context);
    const f = input.inputFrame;
    return {
      status: 'PASSED_THROUGH' as const,
      output: deepFreezeVideoPipeline({
        stageId: this.descriptor.stageId,
        status: 'PASSED_THROUGH',
        inputFrameId: f.frameId,
        outputFrameId: f.frameId,
        outputLeaseId: f.leaseId,
        outputGeneration: f.frameGeneration,
        passThrough: true,
        producedNewFrame: false,
        timestampPreserved: true,
        sourceIdentityPreserved: true,
        durationNs: 0n,
        warnings: [],
        metadata: {},
      }) as VideoPipelineStageOutput,
    };
  }
  shutdown() {}
}
export class SyntheticInputValidationStage extends BasicStage {
  constructor(id = 'input-validation') {
    super(descriptor(id, 'INPUT_VALIDATION', 'VALIDATE_INPUT', 0), (i) => {
      const f = i.inputFrame;
      if (!f.frameId || !f.leaseId || ['LOST', 'RELEASED', 'FAILED'].includes(f.state))
        throw vpe('VideoPipelineInputInvalid', 'Input frame is not eligible', {
          frameId: f.frameId,
          state: f.state,
        });
      return new BasicStage(this.descriptor).process(i, {} as VideoPipelineStageRuntimeContext);
    });
  }
}
export class SyntheticFormatInspectionStage extends BasicStage {
  constructor(id = 'format-inspection') {
    super(
      descriptor(id, 'FORMAT_INSPECTION', 'INSPECT_FORMAT', 0, {
        dependencies: ['input-validation'],
      }),
      (i) => {
        const f = i.inputFrame;
        const p = i.frameContext.inputDescriptor;
        return {
          status: 'COMPLETED',
          output: deepFreezeVideoPipeline({
            stageId: id,
            status: 'COMPLETED',
            inputFrameId: f.frameId,
            outputFrameId: f.frameId,
            outputLeaseId: f.leaseId,
            outputGeneration: f.frameGeneration,
            passThrough: true,
            producedNewFrame: false,
            timestampPreserved: true,
            sourceIdentityPreserved: true,
            durationNs: 0n,
            warnings: [],
            metadata: {
              inputFormat: f.format,
              memoryDomain: f.memoryDomain,
              scalingRequired: p['width'] !== undefined && p['width'] !== safe(1920),
              colorConversionRequired: false,
              colorCorrectionOptional: true,
              geometryRequired: false,
            } as Record<string, JsonSafe>,
          }) as VideoPipelineStageOutput,
        };
      },
    );
  }
}
export class SyntheticPassThroughStage extends BasicStage {
  constructor(id = 'pass-through') {
    super(
      descriptor(id, 'PASS_THROUGH', 'PRE_PROCESS', 0, { dependencies: ['format-inspection'] }),
    );
  }
}
export class SyntheticOutputValidationStage extends BasicStage {
  constructor(id = 'output-validation') {
    super(
      descriptor(id, 'OUTPUT_VALIDATION', 'VALIDATE_OUTPUT', 0, { dependencies: ['pass-through'] }),
    );
  }
}
export class SyntheticOptionalDelayStage extends BasicStage {
  constructor(id = 'optional-delay', durationNs = 0n) {
    super(
      descriptor(id, 'CUSTOM', 'POST_PROCESS', 0, { optional: true, criticality: 'OPTIONAL' }),
      (i) => {
        const r = new BasicStage(this.descriptor).process(
          i,
          {} as VideoPipelineStageRuntimeContext,
        ) as VideoPipelineStageResult;
        return { ...r, output: { ...r.output, durationNs } };
      },
    );
  }
}
export class SyntheticFailingStage extends BasicStage {
  constructor(id = 'failing-stage', optional = false) {
    super(
      descriptor(id, 'CUSTOM', 'POST_PROCESS', 0, {
        optional,
        criticality: optional ? 'OPTIONAL' : 'CRITICAL',
      }),
      () => {
        throw vpe('VideoPipelineStageExecutionFailed', 'Synthetic stage failure');
      },
    );
  }
}
export class SyntheticTemporaryFrameStage extends BasicStage {
  constructor(id = 'temporary-frame-stage', bytes = 1024) {
    super(
      descriptor(id, 'CUSTOM', 'POST_PROCESS', 0, { optional: true, criticality: 'OPTIONAL' }),
      (i, c) => {
        const tmp = c.allocateTemporaryFrame(bytes);
        c.releaseTemporaryFrame(tmp);
        return new BasicStage(this.descriptor).process(i, c);
      },
    );
  }
}
export class SyntheticCancellationStage extends BasicStage {
  constructor(id = 'cancellation-stage') {
    super(descriptor(id, 'CUSTOM', 'POST_PROCESS', 0), (i, c) => {
      if (c.cancellationSignal?.aborted)
        throw vpe('VideoPipelineOperationCancelled', 'Synthetic cancellation requested');
      return new BasicStage(this.descriptor).process(i, c);
    });
  }
}
export const createDefaultVideoPipelineStages = (): readonly VideoFramePipelineStage[] => [
  new SyntheticInputValidationStage(),
  new SyntheticFormatInspectionStage(),
  new SyntheticPassThroughStage(),
  new SyntheticOutputValidationStage(),
];

interface StageEntry {
  stage: VideoFramePipelineStage;
  initialized: boolean;
  failed: boolean;
  executionCount: number;
  failureCount: number;
  lastDurationNs: bigint;
}
export class DefaultVideoFramePipeline {
  private stages = new Map<string, StageEntry>();
  private lifecycle: VideoPipelineLifecycleState = 'CREATED';
  private generation = 1n;
  private config = defaultVideoFramePipelineConfiguration();
  private processedRequests = new Set<string>();
  private processedFrameTicks = new Set<string>();
  private active = new Set<string>();
  private temp = new Map<string, number>();
  private stageOrder: string[] = [];
  private now = () => BigInt(Date.now()) * 1_000_000n;
  private completed = 0;
  private dropped = 0;
  private cancelled = 0;
  private failed = 0;
  private totalDuration = 0n;
  private maxDuration = 0n;
  private stageDuration = 0n;
  private maxStageDuration = 0n;
  private telemetry = {
    totalFrameRequests: 0,
    totalFramesAccepted: 0,
    totalFramesCompleted: 0,
    totalFramesPassedThrough: 0,
    totalFramesDropped: 0,
    totalFramesCancelled: 0,
    totalFramesFailed: 0,
    totalDuplicateRequests: 0,
    totalStaleGenerationRejects: 0,
    totalStageExecutions: 0,
    totalStageSkips: 0,
    totalStageFailures: 0,
    totalStageTimeouts: 0,
    totalPipelineOverruns: 0,
    totalTemporaryFrameAllocations: 0,
    peakTemporaryFrames: 0,
    peakTemporaryBytes: 0,
    totalInputValidationFailures: 0,
    totalOutputValidationFailures: 0,
    totalGpuLostDrops: 0,
    totalMemoryPressureDrops: 0,
    lastPipelineEvent: 'VideoPipelineCreated',
  };
  constructor(stages: readonly VideoFramePipelineStage[] = createDefaultVideoPipelineStages()) {
    stages.forEach((s) => this.registerStage(s));
  }
  registerStage(stage: VideoFramePipelineStage) {
    const d = stage.descriptor;
    if (this.stages.has(d.stageId)) throw new DuplicateVideoPipelineStage(d.stageId);
    this.stages.set(d.stageId, {
      stage,
      initialized: false,
      failed: false,
      executionCount: 0,
      failureCount: 0,
      lastDurationNs: 0n,
    });
    this.recomputeOrder();
  }
  async unregisterStage(stageId: string) {
    const e = this.stages.get(stageId);
    if (!e) throw new VideoPipelineStageNotFound(stageId);
    await e.stage.shutdown({
      pipelineGeneration: this.generation,
      reason: 'OPERATOR',
      nowNs: this.now,
    });
    this.stages.delete(stageId);
    this.recomputeOrder();
  }
  async initialize(context: VideoPipelineInitializationContext = {}) {
    if (this.lifecycle !== 'CREATED')
      throw vpe('VideoPipelineAlreadyInitialized', 'Video pipeline already initialized', {
        state: this.lifecycle,
      });
    this.lifecycle = 'INITIALIZING';
    this.now = context.nowNs ?? this.now;
    this.config = deepFreezeVideoPipeline({
      ...this.config,
      ...context.configuration,
      generation: context.configuration?.generation ?? this.config.generation,
    }) as VideoFramePipelineConfiguration;
    const validation = this.validate();
    if (!validation.ok) {
      this.lifecycle = 'FAILED';
      return { status: 'FAILED' as const, generation: this.generation, validation };
    }
    for (const e of this.stages.values()) {
      await e.stage.initialize({
        pipelineGeneration: this.generation,
        configuration: this.config,
        nowNs: this.now,
      });
      e.initialized = true;
    }
    this.lifecycle = 'READY';
    this.telemetry.lastPipelineEvent = 'VideoPipelineReady';
    return { status: 'READY' as const, generation: this.generation, validation };
  }
  start() {
    if (this.lifecycle === 'RUNNING')
      throw vpe('VideoPipelineAlreadyRunning', 'Video pipeline already running');
    if (!['READY', 'PAUSED', 'DEGRADED'].includes(this.lifecycle))
      throw vpe('VideoPipelineNotInitialized', 'Video pipeline is not ready', {
        state: this.lifecycle,
      });
    this.lifecycle = 'RUNNING';
    this.telemetry.lastPipelineEvent = 'VideoPipelineStarted';
  }
  pause() {
    if (this.lifecycle === 'RUNNING') {
      this.lifecycle = 'PAUSED';
      this.telemetry.lastPipelineEvent = 'VideoPipelinePaused';
    }
  }
  resume() {
    if (this.lifecycle === 'PAUSED') this.start();
  }
  async stop() {
    if (this.lifecycle === 'STOPPED') return;
    this.lifecycle = 'STOPPING';
    this.active.clear();
    this.lifecycle = 'STOPPED';
    this.telemetry.lastPipelineEvent = 'VideoPipelineStopped';
  }
  async shutdown() {
    await this.stop();
    for (const e of this.stages.values())
      await e.stage.shutdown({
        pipelineGeneration: this.generation,
        reason: 'SHUTDOWN',
        nowNs: this.now,
      });
    this.temp.clear();
  }
  async reconfigure(request: VideoPipelineReconfigurationRequest) {
    if (request.expectedGeneration !== this.generation)
      throw vpe('VideoPipelineGenerationMismatch', 'Pipeline generation mismatch');
    const next = deepFreezeVideoPipeline({
      ...this.config,
      ...request.configuration,
      generation: request.configuration.generation ?? this.config.generation + 1n,
    }) as VideoFramePipelineConfiguration;
    const old = this.config;
    this.config = next;
    const r = this.validate();
    if (!r.ok) {
      this.config = old;
      throw vpe('VideoPipelineConfigurationInvalid', 'Configuration validation failed', {
        errors: r.errors,
      });
    }
    this.generation++;
    this.recomputeOrder();
    return {
      status: 'RECONFIGURED' as const,
      generation: this.generation,
      configurationGeneration: this.config.generation,
    };
  }
  private recomputeOrder() {
    const enabled = [...this.stages.values()].filter(
      (e) =>
        e.stage.descriptor.enabled &&
        this.config.enabledStageIds.includes(e.stage.descriptor.stageId),
    );
    const ids = new Set(enabled.map((e) => e.stage.descriptor.stageId));
    for (const e of enabled)
      for (const dep of e.stage.descriptor.dependencies)
        if (!ids.has(dep))
          throw vpe(
            'VideoPipelineStageDependencyMissing',
            `Stage ${e.stage.descriptor.stageId} has missing dependency ${dep}`,
          );
    const indeg = new Map<string, number>(),
      out = new Map<string, string[]>();
    enabled.forEach((e) => {
      indeg.set(e.stage.descriptor.stageId, 0);
      out.set(e.stage.descriptor.stageId, []);
    });
    enabled.forEach((e) =>
      e.stage.descriptor.dependencies.forEach((d) => {
        out.get(d)!.push(e.stage.descriptor.stageId);
        indeg.set(e.stage.descriptor.stageId, (indeg.get(e.stage.descriptor.stageId) ?? 0) + 1);
      }),
    );
    const cmp = (a: string, b: string) => {
      const da = this.stages.get(a)!.stage.descriptor,
        db = this.stages.get(b)!.stage.descriptor;
      return (
        phaseOrder[da.phase] - phaseOrder[db.phase] || da.order - db.order || a.localeCompare(b)
      );
    };
    const q = [...indeg]
        .filter(([, n]) => n === 0)
        .map(([id]) => id)
        .sort(cmp),
      res: string[] = [];
    while (q.length) {
      const id = q.shift()!;
      res.push(id);
      for (const n of (out.get(id) ?? []).sort(cmp)) {
        indeg.set(n, indeg.get(n)! - 1);
        if (indeg.get(n) === 0) q.push(n);
        q.sort(cmp);
      }
    }
    if (res.length !== enabled.length)
      throw vpe(
        'VideoPipelineStageCycleDetected',
        'Video pipeline stage dependency cycle detected',
      );
    this.stageOrder = res;
  }
  validate(): VideoFramePipelineValidationReport {
    const errors: VideoPipelineWarning[] = [];
    try {
      for (const [id, e] of this.stages) {
        const d = e.stage.descriptor;
        if (id !== d.stageId)
          errors.push({ code: 'STAGE_ID_MISMATCH', message: `Stage key mismatch ${id}` });
        if (d.dependencies.includes(d.stageId))
          errors.push({ code: 'SELF_DEPENDENCY', message: `Stage ${id} depends on itself` });
        if (d.mutatesPixels)
          errors.push({ code: 'MUTATES_PIXELS', message: `Stage ${id} mutates pixels` });
      }
      this.recomputeOrder();
    } catch (err) {
      errors.push({
        code: err instanceof RuntimeEngineError ? err.code : 'VALIDATION_ERROR',
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return deepFreezeVideoPipeline({
      ok: errors.length === 0,
      errors,
      orderedStageIds: this.stageOrder,
    }) as VideoFramePipelineValidationReport;
  }
  assertInvariants() {
    const r = this.validate();
    if (!r.ok) throw new VideoPipelineInvariantViolation(r.errors.map((e) => e.message).join('; '));
    if (this.active.size > this.config.maximumConcurrentFrames)
      throw new VideoPipelineInvariantViolation('active request concurrency exceeded');
    if (this.temp.size) throw new VideoPipelineInvariantViolation('temporary frame leak detected');
  }
  getStage(stageId: string) {
    const e = this.stages.get(stageId);
    return e ? this.stageSnapshot(e) : undefined;
  }
  listStages() {
    return this.stageOrder.map((id) => this.stageSnapshot(this.stages.get(id)!));
  }
  private stageSnapshot(e: StageEntry): VideoPipelineStageSnapshot {
    const { timeoutNs, budgetNs, ...rest } = e.stage.descriptor;
    return deepFreezeVideoPipeline({
      descriptor: { ...rest, timeoutNs: nsString(timeoutNs), budgetNs: nsString(budgetNs) },
      initialized: e.initialized,
      failed: e.failed,
      executionCount: e.executionCount,
      failureCount: e.failureCount,
      lastDurationNs: nsString(e.lastDurationNs),
    }) as VideoPipelineStageSnapshot;
  }
  getTelemetry() {
    const avg = this.completed + this.failed + this.dropped + this.cancelled;
    return deepFreezeVideoPipeline({
      ...this.telemetry,
      averagePipelineDurationNs: nsString(avg ? this.totalDuration / BigInt(avg) : 0n),
      maximumPipelineDurationNs: nsString(this.maxDuration),
      averageStageDurationNs: nsString(
        this.telemetry.totalStageExecutions
          ? this.stageDuration / BigInt(this.telemetry.totalStageExecutions)
          : 0n,
      ),
      maximumStageDurationNs: nsString(this.maxStageDuration),
      currentInFlightRequestIds: [...this.active].sort(),
      healthSummary: this.healthState(),
    }) as VideoFramePipelineTelemetrySnapshot;
  }
  private healthState(): VideoPipelineHealthState {
    if (this.lifecycle === 'FAILED') return 'FAILED';
    if (this.lifecycle === 'STOPPED') return 'STOPPED';
    if (this.lifecycle === 'PAUSED') return 'PAUSED';
    if (this.failed) return 'DEGRADED';
    return this.lifecycle === 'RUNNING' || this.lifecycle === 'READY' ? 'HEALTHY' : 'UNKNOWN';
  }
  getHealth() {
    return deepFreezeVideoPipeline({
      pipelineLifecycleState: this.lifecycle,
      healthState: this.healthState(),
      configurationGeneration: nsString(this.config.generation),
      stageCount: this.stages.size,
      enabledStageCount: this.stageOrder.length,
      failedStageCount: [...this.stages.values()].filter((e) => e.failed).length,
      activeFrameCount: this.active.size,
      queuedFrameCount: 0,
      completedFrameCount: this.completed,
      droppedFrameCount: this.dropped,
      cancelledFrameCount: this.cancelled,
      failedFrameCount: this.failed,
      duplicateRequestCount: this.telemetry.totalDuplicateRequests,
      staleGenerationRejectionCount: this.telemetry.totalStaleGenerationRejects,
      inputValidationFailureCount: this.telemetry.totalInputValidationFailures,
      outputValidationFailureCount: this.telemetry.totalOutputValidationFailures,
      budgetOverrunCount: this.telemetry.totalPipelineOverruns,
      stageTimeoutCount: this.telemetry.totalStageTimeouts,
      temporaryFrameCount: this.temp.size,
      temporaryFrameBytes: [...this.temp.values()].reduce((a, b) => a + b, 0),
      lostGpuFrameCount: this.telemetry.totalGpuLostDrops,
      leaseCleanupFailureCount: 0,
      lastProcessedRuntimeFrame: undefined,
      lastSuccessfulFrame: undefined,
      lastFailure: undefined,
      updatedAtNs: nsString(this.now()),
    }) as unknown as VideoFramePipelineHealthSnapshot;
  }
  getSnapshot() {
    return deepFreezeVideoPipeline({
      lifecycleState: this.lifecycle,
      pipelineGeneration: nsString(this.generation),
      configuration: snapConfig(this.config),
      stages: this.listStages(),
      health: this.getHealth(),
      telemetry: this.getTelemetry(),
    }) as VideoFramePipelineSnapshot;
  }
  async processFrame(
    request: VideoFrameProcessRequest,
    context: VideoPipelineRuntimeContext = { nowNs: this.now },
  ) {
    this.telemetry.totalFrameRequests++;
    if (this.lifecycle !== 'RUNNING') return this.reject(request, 'VideoPipelineNotRunning');
    if (this.processedRequests.has(request.requestId)) {
      this.telemetry.totalDuplicateRequests++;
      return this.drop(request, 'DROP_DUPLICATE_INPUT', context.nowNs());
    }
    const ft = `${request.sourceId}:${request.streamId}:${request.inputFrameId}:${request.runtimeFrameNumber}`;
    if (this.processedFrameTicks.has(ft)) {
      this.telemetry.totalDuplicateRequests++;
      return this.drop(request, 'DROP_DUPLICATE_INPUT', context.nowNs());
    }
    if (request.pipelineConfigurationGeneration !== this.config.generation) {
      this.telemetry.totalStaleGenerationRejects++;
      return this.drop(request, 'DROP_STALE_GENERATION', context.nowNs());
    }
    const frame = request.inputFrame;
    if (
      !frame ||
      frame.frameGeneration !== request.expectedFrameGeneration ||
      frame.storageGeneration !== request.expectedStorageGeneration
    ) {
      this.telemetry.totalStaleGenerationRejects++;
      return this.drop(request, 'DROP_STALE_GENERATION', context.nowNs());
    }
    if (['LOST', 'RELEASED', 'FAILED'].includes(frame.state)) {
      if (frame.state === 'LOST') this.telemetry.totalGpuLostDrops++;
      return this.drop(
        request,
        frame.state === 'LOST' ? 'DROP_ON_GPU_LOSS' : 'DROP_ON_REQUIRED_STAGE_FAILURE',
        context.nowNs(),
      );
    }
    if (request.cancellationSignal?.aborted)
      return this.cancel(request, 'CANCELLED_BEFORE_START', context.nowNs(), []);
    this.processedRequests.add(request.requestId);
    this.processedFrameTicks.add(ft);
    this.active.add(request.requestId);
    this.telemetry.totalFramesAccepted++;
    const start = context.nowNs();
    const prior = new Map<string, Readonly<VideoPipelineStageOutput>>();
    const executed: VideoPipelineStageOutput[] = [];
    let status: VideoFrameProcessStatus = 'COMPLETED';
    try {
      const fc = deepFreezeVideoPipeline({
        requestId: request.requestId,
        runtimeFrameNumber: request.runtimeFrameNumber,
        frameTick: request.frameTick,
        sourceId: request.sourceId,
        streamId: request.streamId,
        inputFrameIdentity: frame.frameId,
        inputDescriptor: frame.format,
        inputLeaseSnapshot: { leaseId: frame.leaseId, state: frame.state },
        pipelineGeneration: this.generation,
        configurationGeneration: this.config.generation,
        stageExecutionOrder: this.stageOrder,
        deadlineNs: request.deadlineNs,
        startedAtNs: start,
        elapsedBudgetNs: 0n,
        remainingBudgetNs: request.deadlineNs > start ? request.deadlineNs - start : 0n,
        cancellationState: 'NOT_CANCELLED' as const,
        discontinuity: frame.discontinuity,
        processingFlags: [],
        metadata: safe(request.metadata) as Record<string, JsonSafe>,
      }) as VideoFrameProcessContext;
      for (const id of this.stageOrder) {
        if (request.cancellationSignal?.aborted)
          return this.cancel(request, 'CANCELLED_DURING_STAGE', context.nowNs(), executed);
        const e = this.stages.get(id)!;
        const ss = context.nowNs();
        const out = await e.stage.process(
          { inputFrame: frame, priorStageOutputs: prior, frameContext: fc },
          {
            pipelineGeneration: this.generation,
            configuration: this.config,
            nowNs: context.nowNs,
            requestId: request.requestId,
            stageId: id,
            stageExecutionState: Object.fromEntries([...prior].map(([k, v]) => [k, v.status])),
            cancellationSignal: request.cancellationSignal,
            allocateTemporaryFrame: (bytes) => this.allocTmp(request.requestId, id, bytes),
            releaseTemporaryFrame: (tmp) => this.releaseTmp(tmp),
          },
        );
        const dur = context.nowNs() - ss + out.output.durationNs;
        const stageOut = deepFreezeVideoPipeline({
          ...out.output,
          durationNs: dur,
        }) as VideoPipelineStageOutput;
        e.executionCount++;
        e.lastDurationNs = dur;
        this.telemetry.totalStageExecutions++;
        this.stageDuration += dur;
        if (dur > this.maxStageDuration) this.maxStageDuration = dur;
        prior.set(id, stageOut);
        executed.push(stageOut);
        if (stageOut.status === 'PASSED_THROUGH') status = 'PASSED_THROUGH';
        if (dur > e.stage.descriptor.timeoutNs) {
          this.telemetry.totalStageTimeouts++;
          throw vpe('VideoPipelineStageTimeout', `Stage ${id} exceeded timeout`, { stageId: id });
        }
      }
      const completedAt = context.nowNs();
      const total = completedAt - start;
      if (total > this.config.outputProfile.maximumLatencyNs)
        this.telemetry.totalPipelineOverruns++;
      this.completed++;
      if (status === 'PASSED_THROUGH') this.telemetry.totalFramesPassedThrough++;
      else this.telemetry.totalFramesCompleted++;
      this.totalDuration += total;
      if (total > this.maxDuration) this.maxDuration = total;
      const result = deepFreezeVideoPipeline({
        requestId: request.requestId,
        pipelineGeneration: this.generation,
        configurationGeneration: this.config.generation,
        runtimeFrameNumber: request.runtimeFrameNumber,
        sourceId: request.sourceId,
        streamId: request.streamId,
        inputFrameId: request.inputFrameId,
        outputFrame: frame,
        status,
        cancellationState: 'COMPLETED_BEFORE_CANCELLATION',
        stageResults: executed,
        warnings: [],
        totalDurationNs: total,
        budgetResult: {
          deadlineNs: nsString(request.deadlineNs),
          overrunNs: nsString(
            completedAt > request.deadlineNs ? completedAt - request.deadlineNs : 0n,
          ),
        },
        ownershipTransfer: {
          inputLeaseId: request.inputLeaseId,
          outputLeaseId: frame.leaseId,
          transferredTo: 'VIDEO_PIPELINE_OUTPUT',
        },
        telemetryDelta: { stageExecutions: executed.length },
        completedAtNs: completedAt,
      }) as VideoFrameProcessResult;
      this.releaseRequestTemps(request.requestId);
      return result;
    } catch (err) {
      this.failed++;
      this.telemetry.totalFramesFailed++;
      this.releaseRequestTemps(request.requestId);
      const completedAt = context.nowNs();
      return deepFreezeVideoPipeline({
        requestId: request.requestId,
        pipelineGeneration: this.generation,
        configurationGeneration: this.config.generation,
        runtimeFrameNumber: request.runtimeFrameNumber,
        sourceId: request.sourceId,
        streamId: request.streamId,
        inputFrameId: request.inputFrameId,
        status: 'FAILED',
        cancellationState: 'NOT_CANCELLED',
        stageResults: executed,
        warnings: [
          {
            code:
              err instanceof RuntimeEngineError ? err.code : 'VideoPipelineStageExecutionFailed',
            message: err instanceof Error ? err.message : String(err),
          },
        ],
        totalDurationNs: completedAt - start,
        budgetResult: {},
        ownershipTransfer: { releasedIntermediate: true },
        telemetryDelta: {},
        completedAtNs: completedAt,
      }) as VideoFrameProcessResult;
    } finally {
      this.active.delete(request.requestId);
    }
  }
  private reject(r: VideoFrameProcessRequest, code: string) {
    this.failed++;
    return deepFreezeVideoPipeline({
      requestId: r.requestId,
      pipelineGeneration: this.generation,
      configurationGeneration: this.config.generation,
      runtimeFrameNumber: r.runtimeFrameNumber,
      sourceId: r.sourceId,
      streamId: r.streamId,
      inputFrameId: r.inputFrameId,
      status: 'REJECTED',
      cancellationState: 'NOT_CANCELLED',
      stageResults: [],
      warnings: [{ code, message: code }],
      totalDurationNs: 0n,
      budgetResult: {},
      ownershipTransfer: {},
      telemetryDelta: {},
      completedAtNs: this.now(),
    }) as VideoFrameProcessResult;
  }
  private drop(r: VideoFrameProcessRequest, reason: VideoPipelineDropReason, now: bigint) {
    this.dropped++;
    this.telemetry.totalFramesDropped++;
    return deepFreezeVideoPipeline({
      requestId: r.requestId,
      pipelineGeneration: this.generation,
      configurationGeneration: this.config.generation,
      runtimeFrameNumber: r.runtimeFrameNumber,
      sourceId: r.sourceId,
      streamId: r.streamId,
      inputFrameId: r.inputFrameId,
      status: 'DROPPED',
      dropReason: reason,
      cancellationState: 'NOT_CANCELLED',
      stageResults: [],
      warnings: [],
      totalDurationNs: 0n,
      budgetResult: {},
      ownershipTransfer: { inputLeaseId: r.inputLeaseId, released: true },
      telemetryDelta: { dropReason: reason },
      completedAtNs: now,
    }) as VideoFrameProcessResult;
  }
  private cancel(
    r: VideoFrameProcessRequest,
    state: VideoPipelineCancellationState,
    now: bigint,
    executed: VideoPipelineStageOutput[],
  ) {
    this.cancelled++;
    this.telemetry.totalFramesCancelled++;
    this.releaseRequestTemps(r.requestId);
    return deepFreezeVideoPipeline({
      requestId: r.requestId,
      pipelineGeneration: this.generation,
      configurationGeneration: this.config.generation,
      runtimeFrameNumber: r.runtimeFrameNumber,
      sourceId: r.sourceId,
      streamId: r.streamId,
      inputFrameId: r.inputFrameId,
      status: 'CANCELLED',
      cancellationState: state,
      stageResults: executed,
      warnings: [],
      totalDurationNs: 0n,
      budgetResult: {},
      ownershipTransfer: { releasedIntermediate: true },
      telemetryDelta: {},
      completedAtNs: now,
    }) as VideoFrameProcessResult;
  }
  private allocTmp(requestId: string, stageId: string, bytes: number) {
    const current = [...this.temp.values()].reduce((a, b) => a + b, 0);
    if (current + bytes > this.config.temporaryMemoryBudgetBytes) {
      this.telemetry.totalMemoryPressureDrops++;
      throw vpe('VideoPipelineMemoryPressure', 'Temporary frame memory budget exceeded');
    }
    const id = `tmp:${requestId}:${stageId}:${this.temp.size + 1}`;
    this.temp.set(id, bytes);
    this.telemetry.totalTemporaryFrameAllocations++;
    this.telemetry.peakTemporaryFrames = Math.max(
      this.telemetry.peakTemporaryFrames,
      this.temp.size,
    );
    this.telemetry.peakTemporaryBytes = Math.max(
      this.telemetry.peakTemporaryBytes,
      current + bytes,
    );
    return id;
  }
  private releaseTmp(id: string) {
    this.temp.delete(id);
  }
  private releaseRequestTemps(requestId: string) {
    for (const id of [...this.temp.keys()])
      if (id.startsWith(`tmp:${requestId}:`)) this.temp.delete(id);
  }
}
export const createVideoFramePipeline = (stages?: readonly VideoFramePipelineStage[]) =>
  new DefaultVideoFramePipeline(stages);
export const videoPipelineFrameReferenceFromSourceEnvelope = (
  frame: VideoFrameEnvelope,
  runtimeFrameNumber: bigint,
  leaseId = `lease:${frame.sourceId}:${frame.streamId}:${frame.sequenceNumber}`,
): VideoPipelineFrameReference =>
  deepFreezeVideoPipeline({
    frameId: `frame:${frame.sourceId}:${frame.streamId}:${frame.sequenceNumber}`,
    storageId: `storage:${frame.sourceId}:${frame.streamId}:${frame.sequenceNumber}`,
    frameGeneration: 1n,
    storageGeneration: 1n,
    leaseId,
    ownerId: 'source-acquisition',
    sourceId: frame.sourceId,
    streamId: frame.streamId,
    sequenceNumber: frame.sequenceNumber,
    runtimeFrameNumber,
    format: safe(frame.format) as Record<string, JsonSafe>,
    memoryDomain: frame.memoryDomain,
    state: frame.corrupted ? 'FAILED' : 'READY',
    sourceTimestampNs: frame.sourceTimestampNs,
    normalizedTimestampNs: frame.normalizedTimestampNs,
    discontinuity: frame.discontinuity,
    metadata: safe(frame.metadata) as Record<string, JsonSafe>,
  }) as VideoPipelineFrameReference;
export class VideoFramePipelineProcessor implements TickProcessor {
  readonly descriptor = {
    id: 'video-frame-pipeline-processor',
    name: 'Video Frame Pipeline Processor',
    version: '5.3.3',
    order: 200,
    phase: 'VIDEO' as const,
    workloadClass: 'REALTIME' as const,
    enabledByDefault: true,
    dependencies: ['source-acquisition-processor'],
    optionalCapabilities: ['video-frame-pipeline'],
    estimatedBudgetNs: 1_000_000n,
    maximumBudgetNs: 10_000_000n,
    timeoutNs: 10_000_000n,
    maySkipUnderLoad: false,
    failurePolicy: 'DEGRADE_RUNTIME' as const,
    criticality: 'MEDIA_CRITICAL' as const,
    supportsHotDisable: true,
    supportsHotEnable: true,
    supportsHotReplacement: false,
    statePersistencePolicy: 'RETAIN_UNTIL_SHUTDOWN' as const,
    metadata: { ubos: '5.3.3' },
  };
  private lastFrame?: bigint;
  constructor(private readonly pipeline: DefaultVideoFramePipeline) {}
  async initialize() {
    if (this.pipeline.getSnapshot().lifecycleState === 'CREATED') await this.pipeline.initialize();
    if (this.pipeline.getSnapshot().lifecycleState !== 'RUNNING') this.pipeline.start();
    return { status: 'READY' as const };
  }
  async processTick(
    tick: FrameTick,
    context: ProcessorRuntimeContext,
  ): Promise<ProcessorTickResult> {
    if (this.lastFrame === tick.frameNumber)
      return { status: 'SKIPPED', reason: 'already-executed-for-tick' };
    this.lastFrame = tick.frameNumber;
    const frames =
      context.outputs.readDependencyOutput<readonly VideoFrameEnvelope[]>(
        'source-acquisition-processor',
        SOURCE_OUTPUT_KEYS.videoFrames,
      ) ?? [];
    const results: VideoFrameProcessResult[] = [];
    const processed: VideoPipelineFrameReference[] = [];
    const dropped: VideoFrameProcessResult[] = [];
    for (const f of frames) {
      if (f.format.kind !== 'VIDEO') continue;
      const ref = videoPipelineFrameReferenceFromSourceEnvelope(f, tick.frameNumber);
      const req: VideoFrameProcessRequest = {
        requestId: `vfp:${f.sourceId}:${f.streamId}:${f.sequenceNumber}:${tick.frameNumber}`,
        sourceId: f.sourceId,
        streamId: f.streamId,
        inputFrameId: ref.frameId,
        inputLeaseId: ref.leaseId,
        inputFrame: ref,
        expectedFrameGeneration: ref.frameGeneration,
        expectedStorageGeneration: ref.storageGeneration,
        runtimeFrameNumber: tick.frameNumber,
        frameTick: tick,
        targetOutputProfileId: 'default-video-pass-through',
        pipelineConfigurationGeneration: BigInt(
          this.pipeline.getSnapshot().configuration.generation,
        ),
        deadlineNs: tick.deadlineAtNs,
        cancellationSignal: context.cancellationSignal,
        metadata: {},
      };
      const r = await this.pipeline.processFrame(req, {
        nowNs: () => BigInt(context.monotonicTimeNs),
      });
      results.push(r);
      if (r.outputFrame) processed.push(r.outputFrame);
      if (r.status === 'DROPPED') dropped.push(r);
    }
    context.outputs.publish(
      this.descriptor.id,
      VIDEO_PIPELINE_OUTPUT_KEYS.importedSourceVideoFrames,
      frames,
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      VIDEO_PIPELINE_OUTPUT_KEYS.results,
      results,
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      VIDEO_PIPELINE_OUTPUT_KEYS.processedFrameReferences,
      processed,
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      VIDEO_PIPELINE_OUTPUT_KEYS.droppedFrameResults,
      dropped,
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      VIDEO_PIPELINE_OUTPUT_KEYS.health,
      this.pipeline.getHealth(),
      'BORROWED',
    );
    context.outputs.publish(
      this.descriptor.id,
      VIDEO_PIPELINE_OUTPUT_KEYS.telemetry,
      this.pipeline.getTelemetry(),
      'BORROWED',
    );
    return {
      status: 'SUCCEEDED',
      metadata: { processed: processed.length, dropped: dropped.length },
    };
  }
  async shutdown() {
    await this.pipeline.shutdown();
    return { status: 'STOPPED' as const };
  }
}
export const createVideoFramePipelineProcessor = (pipeline = createVideoFramePipeline()) =>
  new VideoFramePipelineProcessor(pipeline);
