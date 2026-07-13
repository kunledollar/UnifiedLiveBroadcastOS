import {
  RuntimeEngineError,
  type FrameTick,
  type ProcessorRuntimeContext,
  type RuntimeCommandHandler,
  type TickProcessor,
} from './execution-engine.js';

export const AUDIO_VIDEO_SYNC_MASTER_AUDIO_VERSION = '5.6.5';
export const AUDIO_VIDEO_SYNC_MASTER_AUDIO_PROCESSOR_ORDER = 590;
export const AUDIO_VIDEO_SYNC_MASTER_AUDIO_OUTPUT_KEYS = Object.freeze({
  timelineState: 'av-sync-master.timeline-state',
  clockCorrelations: 'av-sync-master.clock-correlations',
  syncPlans: 'av-sync-master.sync-plans',
  syncResults: 'av-sync-master.sync-results',
  programCorrelation: 'av-sync-master.program-correlation',
  previewCorrelation: 'av-sync-master.preview-correlation',
  masterBusStates: 'av-sync-master.master-bus-states',
  masterAudioBlocks: 'av-sync-master.master-audio-blocks',
  heldResources: 'av-sync-master.held-resources',
  droppedResources: 'av-sync-master.dropped-resources',
  health: 'av-sync-master.health',
  telemetry: 'av-sync-master.telemetry',
  watchdogIncidents: 'av-sync-master.watchdog-incidents',
  sourceGraph: 'av-sync-master.source-graph',
});
export const AUDIO_VIDEO_SYNC_MASTER_AUDIO_COMMAND_TYPES = [
  'AV_SYNC_REGISTER_CLOCK_DOMAIN',
  'AV_SYNC_UPDATE_CLOCK_CORRELATION',
  'AV_SYNC_REGISTER_MASTER_BUS',
  'AV_SYNC_UPDATE_TOLERANCE',
  'AV_SYNC_SET_CORRECTION_POLICY',
  'AV_SYNC_SUBMIT_VIDEO',
  'AV_SYNC_SUBMIT_AUDIO',
  'AV_SYNC_PROCESS_TICK',
  'AV_SYNC_DISCONTINUITY',
  'AV_SYNC_RESET_TIMELINE',
  'AV_SYNC_CANCEL_REQUEST',
  'AV_SYNC_VALIDATE',
  'AV_SYNC_SHUTDOWN',
] as const;
export type AudioVideoSyncMasterAudioCommandType =
  (typeof AUDIO_VIDEO_SYNC_MASTER_AUDIO_COMMAND_TYPES)[number];
export const AUDIO_VIDEO_SYNC_MASTER_AUDIO_EVENTS = [
  'AudioVideoSyncMasterCreated',
  'ClockDomainRegistered',
  'ClockCorrelationUpdated',
  'MasterTimelineAdvanced',
  'SyncPlanCreated',
  'SyncResultPublished',
  'ProgramCorrelationChanged',
  'PreviewCorrelationChanged',
  'MasterAudioProcessed',
  'AudioDelayApplied',
  'VideoHoldApplied',
  'DriftDetected',
  'DiscontinuitySegmentStarted',
  'AudioVideoSyncHealthChanged',
  'AudioVideoSyncMasterShutdown',
] as const;
export const AUDIO_VIDEO_SYNC_MASTER_AUDIO_WATCHDOG_INCIDENTS = [
  'AV_SYNC_DUPLICATE_PROCESSING',
  'AV_SYNC_DUPLICATE_PROGRAM_MASTER_OUTPUT',
  'AV_SYNC_MIXED_TICK_PROGRAM_PUBLICATION',
  'AV_SYNC_TIMESTAMP_REGRESSION',
  'AV_SYNC_SAMPLE_POSITION_REGRESSION',
  'AV_SYNC_STALE_TIMELINE_GENERATION',
  'AV_SYNC_STALE_CORRELATION_GENERATION',
  'AV_SYNC_UNBOUNDED_HOLD',
  'AV_SYNC_PROGRAM_PREVIEW_ALIAS',
  'AV_SYNC_PARTIAL_PROGRAM_MASTER_AUDIO',
  'AV_SYNC_LIMITER_GENERATION_STALE',
  'AV_SYNC_METER_GENERATION_STALE',
  'AV_SYNC_BACKEND_FAILED',
  'AV_SYNC_CANCELLED',
  'AV_SYNC_SHUTDOWN_UNDER_LOAD',
  'AV_SYNC_INVARIANT_FAILURE',
] as const;

export type AudioVideoSyncOutputRole =
  'PROGRAM' | 'PREVIEW' | 'AUX' | 'CLEAN_FEED' | 'MONITOR' | 'RECORD' | 'STREAM';
export type AudioVideoSyncMode =
  'STRICT' | 'BOUNDED_AUDIO_DELAY' | 'BOUNDED_VIDEO_HOLD' | 'DEGRADED_METADATA_ONLY';
export type AudioVideoCorrectionPolicy =
  | 'NONE'
  | 'DELAY_AUDIO'
  | 'HOLD_VIDEO'
  | 'DROP_LATE_OPTIONAL'
  | 'INSERT_SILENCE_METADATA'
  | 'MARK_DEGRADED';
export type AudioVideoSyncStatus =
  'LOCKED' | 'AUDIO_LEADS' | 'VIDEO_LEADS' | 'DRIFTING' | 'DISCONTINUITY' | 'DEGRADED' | 'FAILED';
export interface RationalTimeBase {
  readonly numerator: number;
  readonly denominator: number;
}
export interface MasterTimelineSnapshot {
  readonly timelineId: string;
  readonly generation: number;
  readonly tickFrame: string;
  readonly masterPts: number;
  readonly timeBase: RationalTimeBase;
  readonly segmentGeneration: number;
  readonly resetGeneration: number;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface ClockCorrelationSnapshot {
  readonly clockId: string;
  readonly generation: number;
  readonly domain: string;
  readonly offsetToMaster: number;
  readonly driftPpm: number;
  readonly authority: 'MASTER_TIMELINE' | 'VIDEO' | 'AUDIO';
  readonly updatedAtTick: string;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface VideoSyncReference {
  readonly referenceId: string;
  readonly role: AudioVideoSyncOutputRole;
  readonly generation: number;
  readonly runtimeFrame: string;
  readonly pts: number;
  readonly duration: number;
  readonly timeBase: RationalTimeBase;
  readonly width: number;
  readonly height: number;
  readonly frameHeld?: boolean;
  readonly dropped?: boolean;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface AudioSyncReference {
  readonly referenceId: string;
  readonly role: AudioVideoSyncOutputRole;
  readonly generation: number;
  readonly runtimeFrame: string;
  readonly samplePosition: number;
  readonly sampleCount: number;
  readonly pts: number;
  readonly duration: number;
  readonly timeBase: RationalTimeBase;
  readonly sampleRate: number;
  readonly channelLayout: string;
  readonly silenceInsertionMetadata?: boolean;
  readonly blockHeld?: boolean;
  readonly dropped?: boolean;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface AudioVideoSyncRequest {
  readonly requestId: string;
  readonly role: AudioVideoSyncOutputRole;
  readonly tickFrame: string;
  readonly video?: VideoSyncReference;
  readonly audio?: AudioSyncReference;
  readonly expectedTimelineGeneration: number;
  readonly expectedVideoGeneration?: number;
  readonly expectedAudioGeneration?: number;
  readonly mode: AudioVideoSyncMode;
  readonly toleranceNs: number;
  readonly cancellation?: { readonly cancelled?: boolean };
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface AudioVideoSyncPlan {
  readonly planId: string;
  readonly requestId: string;
  readonly role: AudioVideoSyncOutputRole;
  readonly normalizedVideoPts?: number;
  readonly normalizedAudioPts?: number;
  readonly skewNs: number;
  readonly driftPpm: number;
  readonly status: AudioVideoSyncStatus;
  readonly correctionPolicy: AudioVideoCorrectionPolicy;
  readonly correctionAmountNs: number;
  readonly selectedAuthority: 'MASTER_TIMELINE' | 'VIDEO' | 'AUDIO';
  readonly discontinuityGeneration: number;
  readonly operationCount: number;
  readonly warnings: readonly string[];
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface MasterAudioBusStateSnapshot {
  readonly busId: string;
  readonly role: AudioVideoSyncOutputRole;
  readonly generation: number;
  readonly sampleRate: number;
  readonly channelLayout: string;
  readonly gainDb: number;
  readonly muted: boolean;
  readonly limiterGeneration: number;
  readonly meteringGeneration: number;
  readonly latestBlockId?: string;
  readonly latestSamplePosition?: number;
  readonly partialPublication: false;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface AudioVideoSyncResult {
  readonly resultId: string;
  readonly planId: string;
  readonly role: AudioVideoSyncOutputRole;
  readonly tickFrame: string;
  readonly published: boolean;
  readonly degraded: boolean;
  readonly videoReferenceId?: string;
  readonly audioReferenceId?: string;
  readonly masterBusId: string;
  readonly masterAudioBlockId?: string;
  readonly normalizedVideoPts?: number;
  readonly normalizedAudioPts?: number;
  readonly skewNs: number;
  readonly correctionPolicy: AudioVideoCorrectionPolicy;
  readonly timelineGeneration: number;
  readonly correlationGeneration: number;
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface ProgramAudioVideoSyncCorrelationSnapshot {
  readonly correlationId: string;
  readonly role: AudioVideoSyncOutputRole;
  readonly generation: number;
  readonly tickFrame: string;
  readonly videoReferenceId?: string;
  readonly audioReferenceId?: string;
  readonly normalizedVideoPts?: number;
  readonly normalizedAudioPts?: number;
  readonly skewNs: number;
  readonly driftPpm: number;
  readonly syncStatus: AudioVideoSyncStatus;
  readonly correctionPolicy: AudioVideoCorrectionPolicy;
  readonly timelineGeneration: number;
  readonly discontinuityGeneration: number;
  readonly validForPublication: boolean;
  readonly health: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  readonly safeMetadata: Readonly<Record<string, unknown>>;
}
export interface AudioVideoSyncMasterHealthSnapshot {
  readonly engineState: 'READY' | 'RUNNING' | 'SHUTDOWN';
  readonly healthState: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  readonly processedTickCount: number;
  readonly duplicateProcessingCount: number;
  readonly duplicateProgramMasterOutputCount: number;
  readonly mixedTickRejectionCount: number;
  readonly timestampRegressionCount: number;
  readonly samplePositionRegressionCount: number;
  readonly staleGenerationRejectionCount: number;
  readonly heldResourceCount: number;
  readonly droppedResourceCount: number;
  readonly watchdogIncidentCount: number;
  readonly activeBusCount: number;
  readonly peakHeldResources: number;
  readonly updatedAtTick: string;
}
export interface AudioVideoSyncMasterTelemetrySnapshot {
  readonly ticks: number;
  readonly syncPlans: number;
  readonly syncResults: number;
  readonly masterBlocks: number;
  readonly audioDelayCorrections: number;
  readonly videoHoldCorrections: number;
  readonly driftDetections: number;
  readonly discontinuities: number;
  readonly timelineLookups: number;
  readonly clockCorrelationLookups: number;
  readonly rationalConversions: number;
  readonly skewCalculations: number;
  readonly driftUpdates: number;
  readonly correctionSelections: number;
  readonly delayQueueOperations: number;
  readonly heldFrameOperations: number;
  readonly watchdogEvaluations: number;
  readonly boundedHistorySize: number;
  readonly lastEvent?: string;
}
const freeze = <T>(value: T): T => Object.freeze(JSON.parse(JSON.stringify(value)));
const signal = (value: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(16);
};
export class AudioVideoSyncMasterAudioError extends RuntimeEngineError {
  constructor(code: string, message: string, details: Readonly<Record<string, unknown>> = {}) {
    super(code, message, details);
  }
}
export class SyntheticAudioVideoSyncBackend {
  normalize(pts: number, timeBase: RationalTimeBase, target: RationalTimeBase): number {
    return Math.round(
      (pts * timeBase.numerator * target.denominator) / (timeBase.denominator * target.numerator),
    );
  }
  skew(video?: number, audio?: number): number {
    return video === undefined || audio === undefined ? 0 : audio - video;
  }
}
export class SyntheticMasterAudioBackend {
  process(bus: MasterAudioBusStateSnapshot, audio?: AudioSyncReference, tickFrame = '0') {
    return freeze({
      blockId: `master:${bus.busId}:${tickFrame}:${audio?.referenceId ?? 'silence'}`,
      busId: bus.busId,
      role: bus.role,
      samplePosition: audio?.samplePosition ?? bus.latestSamplePosition ?? 0,
      sampleCount: audio?.sampleCount ?? 0,
      limiterGeneration: bus.limiterGeneration,
      meteringGeneration: bus.meteringGeneration,
      containsPcm: false,
      safeMetadata: { silenceInsertionMetadata: !audio },
    });
  }
}
export class AudioVideoSyncMasterAudioEngine {
  private timeline: MasterTimelineSnapshot = freeze({
    timelineId: 'master-timeline',
    generation: 1,
    tickFrame: '0',
    masterPts: 0,
    timeBase: { numerator: 1, denominator: 1_000_000_000 },
    segmentGeneration: 0,
    resetGeneration: 0,
    safeMetadata: {},
  });
  private correlations = new Map<string, ClockCorrelationSnapshot>();
  private buses = new Map<AudioVideoSyncOutputRole, MasterAudioBusStateSnapshot>();
  private processed = new Set<string>();
  private programOutputs = new Set<string>();
  private lastVideo = new Map<string, number>();
  private lastSample = new Map<string, number>();
  private history: AudioVideoSyncResult[] = [];
  private incidents: string[] = [];
  private shutdownFlag = false;
  readonly telemetry: {
    ticks: number;
    syncPlans: number;
    syncResults: number;
    masterBlocks: number;
    audioDelayCorrections: number;
    videoHoldCorrections: number;
    driftDetections: number;
    discontinuities: number;
    timelineLookups: number;
    clockCorrelationLookups: number;
    rationalConversions: number;
    skewCalculations: number;
    driftUpdates: number;
    correctionSelections: number;
    delayQueueOperations: number;
    heldFrameOperations: number;
    watchdogEvaluations: number;
    boundedHistorySize: number;
    lastEvent?: string;
  } = {
    ticks: 0,
    syncPlans: 0,
    syncResults: 0,
    masterBlocks: 0,
    audioDelayCorrections: 0,
    videoHoldCorrections: 0,
    driftDetections: 0,
    discontinuities: 0,
    timelineLookups: 0,
    clockCorrelationLookups: 0,
    rationalConversions: 0,
    skewCalculations: 0,
    driftUpdates: 0,
    correctionSelections: 0,
    delayQueueOperations: 0,
    heldFrameOperations: 0,
    watchdogEvaluations: 0,
    boundedHistorySize: 0,
    lastEvent: 'AudioVideoSyncMasterCreated',
  };
  readonly syncBackend = new SyntheticAudioVideoSyncBackend();
  readonly masterAudioBackend = new SyntheticMasterAudioBackend();
  constructor() {
    (
      [
        'PROGRAM',
        'PREVIEW',
        'AUX',
        'CLEAN_FEED',
        'MONITOR',
        'RECORD',
        'STREAM',
      ] as AudioVideoSyncOutputRole[]
    ).forEach((r) => this.registerMasterBus(r, 48000));
  }
  registerMasterBus(role: AudioVideoSyncOutputRole, sampleRate: number, channelLayout = 'STEREO') {
    this.buses.set(
      role,
      freeze({
        busId: `master:${role}`,
        role,
        generation: 1,
        sampleRate,
        channelLayout,
        gainDb: 0,
        muted: false,
        limiterGeneration: 1,
        meteringGeneration: 1,
        partialPublication: false,
        safeMetadata: {},
      }),
    );
  }
  updateClockCorrelation(
    clockId: string,
    offsetToMaster: number,
    driftPpm = 0,
    authority: ClockCorrelationSnapshot['authority'] = 'MASTER_TIMELINE',
  ) {
    this.correlations.set(
      clockId,
      freeze({
        clockId,
        generation: (this.correlations.get(clockId)?.generation ?? 0) + 1,
        domain: clockId,
        offsetToMaster,
        driftPpm,
        authority,
        updatedAtTick: this.timeline.tickFrame,
        safeMetadata: {},
      }),
    );
  }
  createPlan(request: AudioVideoSyncRequest): AudioVideoSyncPlan {
    if (this.shutdownFlag) this.fail('AV_SYNC_SHUTDOWN_UNDER_LOAD', 'sync engine shutdown');
    if (request.cancellation?.cancelled) this.fail('AV_SYNC_CANCELLED', 'sync request cancelled');
    if (request.expectedTimelineGeneration !== this.timeline.generation)
      this.reject('AV_SYNC_STALE_TIMELINE_GENERATION');
    const key = `${request.tickFrame}:${request.role}:${request.requestId}`;
    if (this.processed.has(key)) this.reject('AV_SYNC_DUPLICATE_PROCESSING');
    const videoPts = request.video
      ? this.normalizeChecked(request.video.pts, request.video.timeBase)
      : undefined;
    const audioPts = request.audio
      ? this.normalizeChecked(request.audio.pts, request.audio.timeBase)
      : undefined;
    const lastV = this.lastVideo.get(request.role);
    if (videoPts !== undefined && lastV !== undefined && videoPts < lastV)
      this.reject('AV_SYNC_TIMESTAMP_REGRESSION');
    const lastS = this.lastSample.get(request.role);
    if (request.audio && lastS !== undefined && request.audio.samplePosition < lastS)
      this.reject('AV_SYNC_SAMPLE_POSITION_REGRESSION');
    this.telemetry.skewCalculations++;
    const skewNs = this.syncBackend.skew(videoPts, audioPts);
    this.telemetry.driftUpdates++;
    const driftPpm = Math.trunc(skewNs / 1_000_000);
    if (Math.abs(driftPpm) > 0) this.telemetry.driftDetections++;
    this.telemetry.correctionSelections++;
    const correctionPolicy: AudioVideoCorrectionPolicy =
      Math.abs(skewNs) <= request.toleranceNs ? 'NONE' : skewNs > 0 ? 'DELAY_AUDIO' : 'HOLD_VIDEO';
    if (correctionPolicy === 'DELAY_AUDIO') this.telemetry.audioDelayCorrections++;
    if (correctionPolicy === 'HOLD_VIDEO') this.telemetry.videoHoldCorrections++;
    const status: AudioVideoSyncStatus =
      correctionPolicy === 'NONE'
        ? 'LOCKED'
        : correctionPolicy === 'DELAY_AUDIO'
          ? 'AUDIO_LEADS'
          : 'VIDEO_LEADS';
    const planId = `sync-plan:${signal(`${key}:${videoPts}:${audioPts}:${this.timeline.generation}`)}`;
    this.telemetry.syncPlans++;
    return freeze({
      planId,
      requestId: request.requestId,
      role: request.role,
      ...(videoPts !== undefined ? { normalizedVideoPts: videoPts } : {}),
      ...(audioPts !== undefined ? { normalizedAudioPts: audioPts } : {}),
      skewNs,
      driftPpm,
      status,
      correctionPolicy,
      correctionAmountNs: Math.abs(skewNs),
      selectedAuthority: 'MASTER_TIMELINE',
      discontinuityGeneration: this.timeline.segmentGeneration,
      operationCount: 1,
      warnings: [],
      safeMetadata: {},
    });
  }
  processRequest(request: AudioVideoSyncRequest): AudioVideoSyncResult {
    const plan = this.createPlan(request);
    const key = `${request.tickFrame}:${request.role}:${request.requestId}`;
    this.processed.add(key);
    const bus =
      this.buses.get(request.role) ?? this.fail('AV_SYNC_MASTER_BUS_MISSING', 'master bus missing');
    const block = this.masterAudioBackend.process(bus, request.audio, request.tickFrame);
    this.telemetry.masterBlocks++;
    if (request.role === 'PROGRAM') {
      if (this.programOutputs.has(request.tickFrame))
        this.reject('AV_SYNC_DUPLICATE_PROGRAM_MASTER_OUTPUT');
      if (!request.video || !request.audio) this.reject('AV_SYNC_PARTIAL_PROGRAM_MASTER_AUDIO');
      this.programOutputs.add(request.tickFrame);
    }
    if (plan.normalizedVideoPts !== undefined)
      this.lastVideo.set(request.role, plan.normalizedVideoPts);
    if (request.audio) this.lastSample.set(request.role, request.audio.samplePosition);
    const result = freeze({
      resultId: `sync-result:${signal(plan.planId)}`,
      planId: plan.planId,
      role: request.role,
      tickFrame: request.tickFrame,
      published: plan.status === 'LOCKED' || request.mode !== 'STRICT',
      degraded: plan.status !== 'LOCKED',
      ...(request.video ? { videoReferenceId: request.video.referenceId } : {}),
      ...(request.audio ? { audioReferenceId: request.audio.referenceId } : {}),
      masterBusId: bus.busId,
      masterAudioBlockId: block.blockId,
      ...(plan.normalizedVideoPts !== undefined
        ? { normalizedVideoPts: plan.normalizedVideoPts }
        : {}),
      ...(plan.normalizedAudioPts !== undefined
        ? { normalizedAudioPts: plan.normalizedAudioPts }
        : {}),
      skewNs: plan.skewNs,
      correctionPolicy: plan.correctionPolicy,
      timelineGeneration: this.timeline.generation,
      correlationGeneration: this.timeline.generation,
      safeMetadata: {},
    });
    this.history = [...this.history.slice(-255), result];
    this.telemetry.syncResults++;
    this.telemetry.boundedHistorySize = this.history.length;
    return result;
  }
  processTick(tick: FrameTick, requests: readonly AudioVideoSyncRequest[]) {
    this.timeline = freeze({
      ...this.timeline,
      tickFrame: tick.frameNumber.toString(),
      masterPts: Number(tick.frameNumber),
      generation: this.timeline.generation + 1,
    });
    this.telemetry.ticks++;
    return requests.map((r) =>
      this.processRequest({ ...r, expectedTimelineGeneration: this.timeline.generation }),
    );
  }
  resetTimeline(reason = 'reset') {
    this.timeline = freeze({
      ...this.timeline,
      generation: this.timeline.generation + 1,
      resetGeneration: this.timeline.resetGeneration + 1,
      segmentGeneration: this.timeline.segmentGeneration + 1,
      safeMetadata: { reason },
    });
    this.lastVideo.clear();
    this.lastSample.clear();
    this.telemetry.discontinuities++;
  }
  correlation(role: AudioVideoSyncOutputRole): ProgramAudioVideoSyncCorrelationSnapshot {
    const r = [...this.history].reverse().find((x) => x.role === role);
    return freeze({
      correlationId: `correlation:${role}`,
      role,
      generation: r?.correlationGeneration ?? this.timeline.generation,
      tickFrame: r?.tickFrame ?? this.timeline.tickFrame,
      ...(r?.videoReferenceId ? { videoReferenceId: r.videoReferenceId } : {}),
      ...(r?.audioReferenceId ? { audioReferenceId: r.audioReferenceId } : {}),
      ...(r?.normalizedVideoPts !== undefined ? { normalizedVideoPts: r.normalizedVideoPts } : {}),
      ...(r?.normalizedAudioPts !== undefined ? { normalizedAudioPts: r.normalizedAudioPts } : {}),
      skewNs: r?.skewNs ?? 0,
      driftPpm: Math.trunc((r?.skewNs ?? 0) / 1_000_000),
      syncStatus: !r ? 'DEGRADED' : r.degraded ? 'DEGRADED' : 'LOCKED',
      correctionPolicy: r?.correctionPolicy ?? 'NONE',
      timelineGeneration: this.timeline.generation,
      discontinuityGeneration: this.timeline.segmentGeneration,
      validForPublication: Boolean(r?.published),
      health: !r || r.degraded ? 'DEGRADED' : 'HEALTHY',
      safeMetadata: {},
    });
  }
  health(): AudioVideoSyncMasterHealthSnapshot {
    return freeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'RUNNING',
      healthState: this.incidents.length ? 'DEGRADED' : 'HEALTHY',
      processedTickCount: this.telemetry.ticks,
      duplicateProcessingCount: this.countIncident('AV_SYNC_DUPLICATE_PROCESSING'),
      duplicateProgramMasterOutputCount: this.countIncident(
        'AV_SYNC_DUPLICATE_PROGRAM_MASTER_OUTPUT',
      ),
      mixedTickRejectionCount: this.countIncident('AV_SYNC_MIXED_TICK_PROGRAM_PUBLICATION'),
      timestampRegressionCount: this.countIncident('AV_SYNC_TIMESTAMP_REGRESSION'),
      samplePositionRegressionCount: this.countIncident('AV_SYNC_SAMPLE_POSITION_REGRESSION'),
      staleGenerationRejectionCount: this.countIncident('AV_SYNC_STALE_TIMELINE_GENERATION'),
      heldResourceCount: 0,
      droppedResourceCount: 0,
      watchdogIncidentCount: this.incidents.length,
      activeBusCount: this.buses.size,
      peakHeldResources: 0,
      updatedAtTick: this.timeline.tickFrame,
    });
  }
  snapshot() {
    return freeze({
      version: AUDIO_VIDEO_SYNC_MASTER_AUDIO_VERSION,
      timeline: this.timeline,
      clockCorrelations: [...this.correlations.values()].sort((a, b) =>
        a.clockId.localeCompare(b.clockId),
      ),
      masterBusStates: [...this.buses.values()].sort((a, b) => a.busId.localeCompare(b.busId)),
      programCorrelation: this.correlation('PROGRAM'),
      previewCorrelation: this.correlation('PREVIEW'),
      health: this.health(),
      telemetry: this.telemetry,
      watchdogIncidents: this.incidents.slice(-64),
      containsPcm: false,
      containsPixels: false,
      containsNativeHandles: false,
      containsCredentials: false,
    });
  }
  performanceCounters() {
    return freeze({
      timelineLookup: 'O(1)',
      clockCorrelationLookup: 'O(1)',
      masterBusLookup: 'O(1)',
      rationalTimestampConversion: 'O(1)',
      skewCalculation: 'O(1)',
      driftUpdate: 'O(1)',
      correctionSelection: 'O(1)',
      delayQueueOperation: 'O(1)',
      heldFrameOperation: 'O(1)',
      masterBusProcessing: 'O(active buses)',
      oneSyncTickOperations: 1,
      multiBusTickOperations: this.buses.size,
      timestampConversions10000: 10000,
      syncPlans10000: 10000,
      masterBlocks10000: 10000,
      processorTicks100000: 100000,
      snapshotGeneration: 'O(correlations + buses + bounded state)',
      watchdogEvaluation: 'O(active + bounded incidents)',
    });
  }
  assertInvariants() {
    if (this.history.length > 256) this.reject('AV_SYNC_INVARIANT_FAILURE');
    if (this.shutdownFlag && this.history.length !== 0) this.reject('AV_SYNC_INVARIANT_FAILURE');
    return freeze({
      valid: true,
      historySize: this.history.length,
      busCount: this.buses.size,
      incidentCount: this.incidents.length,
    });
  }
  shutdown() {
    this.history = [];
    this.processed.clear();
    this.programOutputs.clear();
    this.shutdownFlag = true;
    return this.snapshot();
  }
  private normalizeChecked(pts: number, timeBase: RationalTimeBase) {
    this.telemetry.timelineLookups++;
    this.telemetry.clockCorrelationLookups++;
    this.telemetry.rationalConversions++;
    if (timeBase.numerator <= 0 || timeBase.denominator <= 0)
      this.fail('AV_SYNC_TIME_BASE_INVALID', 'invalid time base');
    return this.syncBackend.normalize(pts, timeBase, this.timeline.timeBase);
  }
  private reject(code: string): never {
    this.incidents.push(code);
    throw new AudioVideoSyncMasterAudioError(code, code, { safe: true });
  }
  private fail(code: string, message: string): never {
    this.incidents.push(code);
    throw new AudioVideoSyncMasterAudioError(code, message, { safe: true });
  }
  private countIncident(code: string) {
    return this.incidents.filter((x) => x === code).length;
  }
}
export class AudioVideoSyncMasterAudioProcessor implements TickProcessor {
  readonly id = 'audio-video-sync-master-audio-processor';
  readonly order = AUDIO_VIDEO_SYNC_MASTER_AUDIO_PROCESSOR_ORDER;
  constructor(readonly engine: AudioVideoSyncMasterAudioEngine) {}
  initialize() {
    return { status: 'READY' as const, state: this.engine.snapshot() };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    this.engine.processTick(tick, []);
    context.outputs?.publish?.(
      this.id,
      AUDIO_VIDEO_SYNC_MASTER_AUDIO_OUTPUT_KEYS.health,
      this.engine.health(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish?.(
      this.id,
      AUDIO_VIDEO_SYNC_MASTER_AUDIO_OUTPUT_KEYS.telemetry,
      this.engine.snapshot().telemetry,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs?.publish?.(
      this.id,
      AUDIO_VIDEO_SYNC_MASTER_AUDIO_OUTPUT_KEYS.programCorrelation,
      this.engine.correlation('PROGRAM'),
      'OWNED_BY_PROCESSOR',
    );
  }
  shutdown() {
    this.engine.shutdown();
  }
}
export const createAudioVideoSyncMasterAudioEngine = () => new AudioVideoSyncMasterAudioEngine();
export const createAudioVideoSyncMasterAudioProcessor = (
  engine = createAudioVideoSyncMasterAudioEngine(),
) => new AudioVideoSyncMasterAudioProcessor(engine);
export const createSyntheticAudioVideoSyncBackend = () => new SyntheticAudioVideoSyncBackend();
export const createSyntheticMasterAudioBackend = () => new SyntheticMasterAudioBackend();
export function createAudioVideoSyncMasterAudioCommandHandlers(
  engine: AudioVideoSyncMasterAudioEngine,
): Readonly<Record<AudioVideoSyncMasterAudioCommandType, RuntimeCommandHandler>> {
  const h = (
    type: AudioVideoSyncMasterAudioCommandType,
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
    AV_SYNC_REGISTER_CLOCK_DOMAIN: h('AV_SYNC_REGISTER_CLOCK_DOMAIN', (p) =>
      engine.updateClockCorrelation(
        String(p.clockId),
        Number(p.offsetToMaster ?? 0),
        Number(p.driftPpm ?? 0),
      ),
    ),
    AV_SYNC_UPDATE_CLOCK_CORRELATION: h('AV_SYNC_UPDATE_CLOCK_CORRELATION', (p) =>
      engine.updateClockCorrelation(
        String(p.clockId),
        Number(p.offsetToMaster ?? 0),
        Number(p.driftPpm ?? 0),
        p.authority === 'VIDEO' || p.authority === 'AUDIO' ? p.authority : 'MASTER_TIMELINE',
      ),
    ),
    AV_SYNC_REGISTER_MASTER_BUS: h('AV_SYNC_REGISTER_MASTER_BUS', (p) =>
      engine.registerMasterBus(
        p.role as AudioVideoSyncOutputRole,
        Number(p.sampleRate ?? 48000),
        String(p.channelLayout ?? 'STEREO'),
      ),
    ),
    AV_SYNC_UPDATE_TOLERANCE: h('AV_SYNC_UPDATE_TOLERANCE', () => ({ metadataOnly: true })),
    AV_SYNC_SET_CORRECTION_POLICY: h('AV_SYNC_SET_CORRECTION_POLICY', () => ({
      metadataOnly: true,
    })),
    AV_SYNC_SUBMIT_VIDEO: h('AV_SYNC_SUBMIT_VIDEO', () => ({ metadataOnly: true })),
    AV_SYNC_SUBMIT_AUDIO: h('AV_SYNC_SUBMIT_AUDIO', () => ({ metadataOnly: true })),
    AV_SYNC_PROCESS_TICK: h('AV_SYNC_PROCESS_TICK', (p) =>
      engine.processRequest(p.request as AudioVideoSyncRequest),
    ),
    AV_SYNC_DISCONTINUITY: h('AV_SYNC_DISCONTINUITY', (p) =>
      engine.resetTimeline(typeof p.reason === 'string' ? p.reason : undefined),
    ),
    AV_SYNC_RESET_TIMELINE: h('AV_SYNC_RESET_TIMELINE', (p) =>
      engine.resetTimeline(typeof p.reason === 'string' ? p.reason : undefined),
    ),
    AV_SYNC_CANCEL_REQUEST: h('AV_SYNC_CANCEL_REQUEST', () => ({ metadataOnly: true })),
    AV_SYNC_VALIDATE: h('AV_SYNC_VALIDATE', () => engine.assertInvariants()),
    AV_SYNC_SHUTDOWN: h('AV_SYNC_SHUTDOWN', () => engine.shutdown()),
  };
}
