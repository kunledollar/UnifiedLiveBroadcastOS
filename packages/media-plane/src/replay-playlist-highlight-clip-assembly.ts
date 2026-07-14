import type {
  FrameTick,
  ProcessorRuntimeContext,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';

export const REPLAY_CLIP_ASSEMBLY_VERSION = '5.8.4';
export const REPLAY_CLIP_ASSEMBLY_PROCESSOR_ORDER = 1140;
export const REPLAY_CLIP_ASSEMBLY_OUTPUT_KEYS = {
  clips: 'replay.clipAssembly.clips',
  highlights: 'replay.clipAssembly.highlights',
  playlists: 'replay.clipAssembly.playlists',
  assemblyPlans: 'replay.clipAssembly.plans',
  assemblyResults: 'replay.clipAssembly.results',
  health: 'replay.clipAssembly.health',
} as const;
export const REPLAY_CLIP_ASSEMBLY_COMMAND_TYPES = [
  'REPLAY_CLIP_ASSEMBLY_REGISTER_CLIP',
  'REPLAY_CLIP_ASSEMBLY_CREATE_PLAN',
  'REPLAY_CLIP_ASSEMBLY_VALIDATE',
  'REPLAY_CLIP_ASSEMBLY_SHUTDOWN',
] as const;
export type ReplayClipAssemblyCommandType = (typeof REPLAY_CLIP_ASSEMBLY_COMMAND_TYPES)[number];
export const REPLAY_CLIP_ASSEMBLY_EVENTS = [
  'ReplayClipAssemblyEngineCreated',
  'ReplayClipAssemblyPlanCreated',
  'ReplayClipAssemblyMetadataCompleted',
  'ReplayClipAssemblyEngineShutdown',
] as const;
export const REPLAY_CLIP_ASSEMBLY_WATCHDOG_INCIDENTS = [
  'REPLAY_CLIP_ASSEMBLY_INVARIANT_FAILURE',
  'REPLAY_CLIP_ASSEMBLY_DUPLICATE_TICK',
] as const;

export type ReplayAssemblyReadinessState = 'NOT_READY' | 'READY_METADATA' | 'DEGRADED' | 'FAILED';
export type ReplayAssemblyProtectionState =
  'UNPROTECTED' | 'SOURCE_PROTECTED' | 'LEASED' | 'RELEASED';
export type ReplayClipTransitionPolicy = 'CUT_ONLY' | 'METADATA_TRANSITION_REFERENCES' | 'CUSTOM';
export type ReplayClipGraphicsPolicy = 'NONE' | 'REFERENCE_METADATA_ONLY' | 'CUSTOM';
export type ReplayClipAudioPolicy = 'SOURCE_AUDIO_METADATA' | 'MUTE_METADATA' | 'CUSTOM';
export type ReplayAssemblySourceType =
  'CLIP' | 'HIGHLIGHT' | 'PLAYLIST' | 'EVENT_PACKAGE' | 'CUSTOM';
export interface ReplayClipSegment {
  readonly segmentId: string;
  readonly generation: number;
  readonly sourceId: string;
  readonly sourceGeneration: number;
  readonly inFrame: number;
  readonly outFrame: number;
  readonly speedProfileId?: string;
  readonly speedProfileGeneration?: number;
  readonly transitionPolicy?: ReplayClipTransitionPolicy;
  readonly graphicsPolicy?: ReplayClipGraphicsPolicy;
  readonly audioPolicy?: ReplayClipAudioPolicy;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}
export interface ReplayClipDefinition {
  readonly clipId: string;
  readonly clipGeneration: number;
  readonly displayName: string;
  readonly segments: readonly ReplayClipSegment[];
  readonly readiness: ReplayAssemblyReadinessState;
  readonly protection: ReplayAssemblyProtectionState;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}
export interface ReplayHighlightPackage {
  readonly highlightId: string;
  readonly highlightGeneration: number;
  readonly displayName: string;
  readonly clipIds: readonly string[];
  readonly readiness: ReplayAssemblyReadinessState;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}
export interface ReplayPlaylistAssembly {
  readonly playlistId: string;
  readonly playlistGeneration: number;
  readonly displayName: string;
  readonly clipIds: readonly string[];
  readonly readiness: ReplayAssemblyReadinessState;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}
export interface ReplayClipAssemblyPlan {
  readonly assemblyPlanId: string;
  readonly assemblyPlanGeneration: number;
  readonly sourceType: ReplayAssemblySourceType;
  readonly sourceId: string;
  readonly sourceGeneration: number;
  readonly segmentIds: readonly string[];
  readonly readiness: ReplayAssemblyReadinessState;
  readonly transitionPolicy: ReplayClipTransitionPolicy;
  readonly graphicsPolicy: ReplayClipGraphicsPolicy;
  readonly audioPolicy: ReplayClipAudioPolicy;
  readonly deterministicScore: string;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}
export interface ReplayClipAssemblyResult {
  readonly assemblyResultId: string;
  readonly assemblyResultGeneration: number;
  readonly assemblyPlanId: string;
  readonly assemblyPlanGeneration: number;
  readonly sourceType: ReplayAssemblySourceType;
  readonly sourceId: string;
  readonly sourceGeneration: number;
  readonly orderedSegments: readonly ReplayClipSegment[];
  readonly readiness: ReplayAssemblyReadinessState;
  readonly metadataOnly: true;
  readonly realMediaArtifact: false;
  readonly safeMetadata?: Readonly<Record<string, unknown>>;
}
export type ReplayClipAssemblySnapshot = Readonly<{
  clips: readonly ReplayClipDefinition[];
  highlights: readonly ReplayHighlightPackage[];
  playlists: readonly ReplayPlaylistAssembly[];
  plans: readonly ReplayClipAssemblyPlan[];
  results: readonly ReplayClipAssemblyResult[];
  health: { readonly state: 'READY' | 'SHUTDOWN'; readonly updatedAtNs: number };
}>;

export class ReplayClipAssemblyEngine {
  private clips = new Map<string, ReplayClipDefinition>();
  private highlights = new Map<string, ReplayHighlightPackage>();
  private playlists = new Map<string, ReplayPlaylistAssembly>();
  private plans = new Map<string, ReplayClipAssemblyPlan>();
  private results = new Map<string, ReplayClipAssemblyResult>();
  private shutdownState = false;
  registerClip(clip: ReplayClipDefinition): void {
    if (this.clips.has(clip.clipId)) throw new Error('DuplicateReplayClipDefinition');
    this.clips.set(
      clip.clipId,
      Object.freeze({ ...clip, segments: Object.freeze([...clip.segments]) }),
    );
  }
  registerHighlight(highlight: ReplayHighlightPackage): void {
    if (this.highlights.has(highlight.highlightId))
      throw new Error('DuplicateReplayHighlightPackage');
    this.highlights.set(
      highlight.highlightId,
      Object.freeze({ ...highlight, clipIds: Object.freeze([...highlight.clipIds]) }),
    );
  }
  registerPlaylist(playlist: ReplayPlaylistAssembly): void {
    if (this.playlists.has(playlist.playlistId)) throw new Error('DuplicateReplayPlaylistAssembly');
    this.playlists.set(
      playlist.playlistId,
      Object.freeze({ ...playlist, clipIds: Object.freeze([...playlist.clipIds]) }),
    );
  }
  createPlan(plan: ReplayClipAssemblyPlan, result: ReplayClipAssemblyResult): void {
    if (this.plans.has(plan.assemblyPlanId) || this.results.has(result.assemblyResultId))
      throw new Error('DuplicateReplayClipAssemblyPlan');
    this.plans.set(
      plan.assemblyPlanId,
      Object.freeze({ ...plan, segmentIds: Object.freeze([...plan.segmentIds]) }),
    );
    this.results.set(
      result.assemblyResultId,
      Object.freeze({ ...result, orderedSegments: Object.freeze([...result.orderedSegments]) }),
    );
  }
  getPlan(id: string): ReplayClipAssemblyPlan | undefined {
    return this.plans.get(id);
  }
  getResult(id: string): ReplayClipAssemblyResult | undefined {
    return this.results.get(id);
  }
  snapshot(updatedAtNs = 0): ReplayClipAssemblySnapshot {
    return Object.freeze({
      clips: Object.freeze(
        [...this.clips.values()].sort((a, b) => a.clipId.localeCompare(b.clipId)),
      ),
      highlights: Object.freeze(
        [...this.highlights.values()].sort((a, b) => a.highlightId.localeCompare(b.highlightId)),
      ),
      playlists: Object.freeze(
        [...this.playlists.values()].sort((a, b) => a.playlistId.localeCompare(b.playlistId)),
      ),
      plans: Object.freeze(
        [...this.plans.values()].sort((a, b) => a.assemblyPlanId.localeCompare(b.assemblyPlanId)),
      ),
      results: Object.freeze(
        [...this.results.values()].sort((a, b) =>
          a.assemblyResultId.localeCompare(b.assemblyResultId),
        ),
      ),
      health: Object.freeze({
        state: this.shutdownState ? ('SHUTDOWN' as const) : ('READY' as const),
        updatedAtNs,
      }),
    });
  }
  assertInvariants(): void {
    for (const r of this.results.values())
      if (r.metadataOnly !== true || r.realMediaArtifact !== false)
        throw new Error('ReplayClipAssemblyInvariantViolation');
  }
  shutdown(): void {
    this.shutdownState = true;
  }
}
export function createReplayClipAssemblyEngine(): ReplayClipAssemblyEngine {
  return new ReplayClipAssemblyEngine();
}
export function assertReplayClipAssemblyInvariants(engine: ReplayClipAssemblyEngine): void {
  engine.assertInvariants();
}
export function createReplayClipAssemblySourceGraphSnapshot(
  engine: ReplayClipAssemblyEngine,
): ReplayClipAssemblySnapshot {
  return engine.snapshot();
}
export class ReplayClipAssemblyProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'replay-clip-assembly-foundation',
    name: 'Replay Clip Assembly Metadata Foundation',
    version: REPLAY_CLIP_ASSEMBLY_VERSION,
    order: REPLAY_CLIP_ASSEMBLY_PROCESSOR_ORDER,
    phase: 'POST_TICK',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: ['replay-variable-speed-foundation'],
    optionalCapabilities: ['replay-clip-assembly-metadata'],
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
    metadata: { metadataOnly: true },
  };
  private lastTick: bigint | undefined;
  constructor(private readonly engine: ReplayClipAssemblyEngine) {}
  initialize() {
    return {
      status: 'READY' as const,
      state: this.engine.snapshot(),
      metadata: { metadataOnly: true },
    };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext): void {
    if (this.lastTick === tick.frameNumber) throw new Error('REPLAY_CLIP_ASSEMBLY_DUPLICATE_TICK');
    this.lastTick = tick.frameNumber;
    context.outputs.publish(
      this.descriptor.id,
      REPLAY_CLIP_ASSEMBLY_OUTPUT_KEYS.health,
      this.engine.snapshot(Number(tick.presentationTimeNs)).health,
      'BORROWED',
    );
  }
  shutdown() {
    this.engine.shutdown();
    return { status: 'STOPPED' as const, metadata: { metadataOnly: true } };
  }
}
export function createReplayClipAssemblyProcessor(
  engine = createReplayClipAssemblyEngine(),
): ReplayClipAssemblyProcessor {
  return new ReplayClipAssemblyProcessor(engine);
}
