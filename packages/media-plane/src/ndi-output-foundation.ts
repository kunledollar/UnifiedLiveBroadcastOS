/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommandHandler,
  TickProcessor,
  TickProcessorDescriptor,
} from './execution-engine.js';

export const NDI_OUTPUT_VERSION = '5.7.6';
export const NDI_OUTPUT_PROCESSOR_ORDER = 1066;
export const NDI_COMMANDS = [
  'NDI_REGISTER_PROFILE',
  'NDI_REGISTER_DESTINATION',
  'NDI_CREATE_SESSION',
  'NDI_ADVERTISE',
  'NDI_SUBMIT_FRAME',
  'NDI_UPDATE_TALLY',
  'NDI_UPDATE_PTZ',
  'NDI_VALIDATE',
  'NDI_SHUTDOWN',
] as const;
export type NdiCommandName = (typeof NDI_COMMANDS)[number];
export const NDI_OUTPUT_KEYS = Object.freeze({
  profiles: 'ndi.profiles',
  sessions: 'ndi.sessions',
  advertisements: 'ndi.advertisements',
  frames: 'ndi.frames',
  metadata: 'ndi.metadata',
  tally: 'ndi.tally',
  ptz: 'ndi.ptz',
  health: 'ndi.health',
  telemetry: 'ndi.telemetry',
  results: 'ndi.results',
});
export const NDI_WATCHDOG_INCIDENTS = [
  'NDI_DISCOVERY_METADATA_FAILURE',
  'NDI_RECEIVER_INCOMPATIBLE',
  'NDI_FRAME_SEQUENCE_ERROR',
  'NDI_TIMESTAMP_REGRESSION',
  'NDI_METADATA_QUEUE_OVERFLOW',
  'NDI_OWNERSHIP_VIOLATION',
  'NDI_INVARIANT_FAILURE',
] as const;
type Safe = Readonly<Record<string, unknown>>;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const assertSafe = (m: Safe = {}) => {
  const j = JSON.stringify(m);
  if (
    /(ndi:\/\/|password|token|secret|passphrase|payload|bytes|bonjour|mdns|host|address)/i.test(j)
  )
    throw new NdiOutputError('NdiUnsafeMetadata', 'unsafe NDI metadata rejected');
  return freeze(clone(m));
};
export class NdiOutputError extends Error {
  constructor(
    readonly code: string,
    msg: string,
  ) {
    super(`${code}: ${msg}`);
  }
}
export type NdiOutputRole =
  | 'PROGRAM'
  | 'PREVIEW_METADATA'
  | 'CLEAN_FEED'
  | 'AUX'
  | 'HORIZONTAL_PROGRAM'
  | 'VERTICAL_PROGRAM'
  | 'SQUARE_PROGRAM';
export interface NdiOutputProfile {
  readonly profileId: string;
  readonly generation: number;
  readonly outputRole: NdiOutputRole;
  readonly senderType: 'PROGRAM' | 'PREVIEW' | 'AUX' | 'CLEAN' | 'CUSTOM';
  readonly discoveryMode: 'MANUAL_REFERENCE' | 'STATIC_METADATA' | 'DISABLED';
  readonly bandwidthProfile: 'LOW' | 'MEDIUM' | 'HIGH' | 'METADATA_ONLY';
  readonly videoMetadata: Safe;
  readonly audioMetadata: Safe;
  readonly safeMetadata: Safe;
}
export interface NdiDestination {
  readonly destinationId: string;
  readonly generation: number;
  readonly enabled: boolean;
  readonly receiverCompatibility: 'COMPATIBLE' | 'INCOMPATIBLE' | 'UNKNOWN';
  readonly streamReference: string;
  readonly deviceReference: string;
  readonly groupReference?: string;
  readonly friendlyNameSummary: string;
  readonly safeMetadata: Safe;
}
export interface NdiSession {
  readonly sessionId: string;
  readonly generation: number;
  readonly profileId: string;
  readonly profileGeneration: number;
  readonly destinationId: string;
  readonly destinationGeneration: number;
  readonly streamingSessionId: string;
  readonly outputRole: NdiOutputRole;
  readonly safeMetadata: Safe;
}
export interface NdiFrame {
  readonly frameId: string;
  readonly sessionId: string;
  readonly generation: number;
  readonly frameSequence: number;
  readonly timestamp: number;
  readonly videoReference: string;
  readonly audioReference?: string;
  readonly ownership: 'BORROWED_READ_ONLY' | 'NDI_METADATA_OWNED' | 'RELEASED';
  readonly safeMetadata: Safe;
}
export interface NdiResult {
  readonly resultId: string;
  readonly sessionId: string;
  readonly frameId: string;
  readonly frameSequence: number;
  readonly status: 'PLANNED' | 'DROPPED' | 'REJECTED';
  readonly realNdiTransmission: false;
  readonly realDiscovery: false;
  readonly completedAtNs: number;
  readonly warnings: readonly string[];
}
export class NdiOutputEngine {
  profiles = new Map<string, NdiOutputProfile>();
  destinations = new Map<string, NdiDestination>();
  sessions = new Map<string, NdiSession>();
  advertisements = new Map<string, Safe>();
  frames = new Map<string, NdiFrame>();
  metadataQueue = new Map<string, Safe[]>();
  tally = new Map<string, Safe>();
  ptz = new Map<string, Safe>();
  results = new Map<string, NdiResult>();
  incidents: string[] = [];
  telemetry: any = {
    sessions: 0,
    frames: 0,
    metadataUpdates: 0,
    tallyUpdates: 0,
    ptzUpdates: 0,
    duplicateFrames: 0,
    staleGenerations: 0,
    receiverFailures: 0,
  };
  shutdown = false;
  tickCount = 0;
  constructor(readonly engineId = 'ndi-output-engine') {}
  registerProfile(p: NdiOutputProfile) {
    if (this.profiles.has(p.profileId))
      throw new NdiOutputError('DuplicateNdiProfile', p.profileId);
    this.profiles.set(
      p.profileId,
      freeze({
        ...p,
        safeMetadata: assertSafe(p.safeMetadata),
        videoMetadata: assertSafe(p.videoMetadata),
        audioMetadata: assertSafe(p.audioMetadata),
      }),
    );
  }
  registerDestination(d: NdiDestination) {
    if (this.destinations.has(d.destinationId))
      throw new NdiOutputError('DuplicateNdiDestination', d.destinationId);
    if (d.receiverCompatibility === 'INCOMPATIBLE') {
      this.telemetry.receiverFailures++;
      this.incidents.push('NDI_RECEIVER_INCOMPATIBLE');
    }
    this.destinations.set(
      d.destinationId,
      freeze({
        ...d,
        safeMetadata: assertSafe(d.safeMetadata),
        friendlyNameSummary: d.friendlyNameSummary.replace(/[^a-z0-9:_-]/gi, '_'),
      }),
    );
  }
  createSession(s: NdiSession) {
    const p = this.profiles.get(s.profileId),
      d = this.destinations.get(s.destinationId);
    if (!p || !d) throw new NdiOutputError('NdiSessionInvalid', 'missing refs');
    if (p.generation !== s.profileGeneration || d.generation !== s.destinationGeneration) {
      this.telemetry.staleGenerations++;
      throw new NdiOutputError('NdiStaleGeneration', 'stale generation');
    }
    this.sessions.set(s.sessionId, freeze({ ...s, safeMetadata: assertSafe(s.safeMetadata) }));
    this.metadataQueue.set(s.sessionId, []);
    this.telemetry.sessions = this.sessions.size;
  }
  advertise(id: string) {
    this.mustSession(id);
    const a = freeze({
      sessionId: id,
      advertisementState: 'ADVERTISED_METADATA',
      realDiscovery: false,
      realAdvertisement: false,
    });
    this.advertisements.set(id, a);
    return a;
  }
  submitFrame(f: NdiFrame) {
    const s = this.mustSession(f.sessionId);
    if (f.generation !== s.generation) {
      this.telemetry.staleGenerations++;
      throw new NdiOutputError('NdiStaleGeneration', 'stale frame');
    }
    if (f.ownership === 'RELEASED')
      throw new NdiOutputError('NdiOwnershipViolation', 'released frame');
    if (this.frames.has(f.frameId)) {
      this.telemetry.duplicateFrames++;
      throw new NdiOutputError('NdiDuplicateFrame', f.frameId);
    }
    const prev = [...this.frames.values()].filter((x) => x.sessionId === f.sessionId).at(-1);
    if (prev && f.frameSequence <= prev.frameSequence) {
      this.incidents.push('NDI_FRAME_SEQUENCE_ERROR');
      throw new NdiOutputError('NdiSequenceRegression', 'sequence regression');
    }
    if (prev && f.timestamp <= prev.timestamp) {
      this.incidents.push('NDI_TIMESTAMP_REGRESSION');
      throw new NdiOutputError('NdiTimestampRegression', 'timestamp regression');
    }
    this.frames.set(f.frameId, freeze({ ...f, safeMetadata: assertSafe(f.safeMetadata) }));
    const r = freeze({
      resultId: `ndi-result-${f.frameId}`,
      sessionId: f.sessionId,
      frameId: f.frameId,
      frameSequence: f.frameSequence,
      status: 'PLANNED' as const,
      realNdiTransmission: false as const,
      realDiscovery: false as const,
      completedAtNs: f.timestamp,
      warnings: [
        'metadata-only NDI foundation; no NDI SDK, GPU, mDNS, Bonjour, discovery, or transmission',
      ],
    });
    this.results.set(r.resultId, r);
    this.telemetry.frames++;
    return r;
  }
  updateMetadata(id: string, m: Safe) {
    const q = this.metadataQueue.get(id) ?? [];
    if (q.length >= 64) {
      this.incidents.push('NDI_METADATA_QUEUE_OVERFLOW');
      throw new NdiOutputError('NdiMetadataQueueFull', 'bounded metadata queue overflow');
    }
    q.push(assertSafe(m));
    this.metadataQueue.set(id, q);
    this.telemetry.metadataUpdates++;
  }
  updateTally(id: string, m: Safe) {
    this.mustSession(id);
    this.tally.set(id, assertSafe(m));
    this.telemetry.tallyUpdates++;
  }
  updatePtz(id: string, m: Safe) {
    this.mustSession(id);
    this.ptz.set(id, assertSafe(m));
    this.telemetry.ptzUpdates++;
  }
  processTick(_tick?: FrameTick) {
    this.tickCount++;
  }
  shutdownEngine() {
    this.shutdown = true;
    this.sessions.clear();
    this.advertisements.clear();
    this.frames.clear();
    this.metadataQueue.clear();
    this.tally.clear();
    this.ptz.clear();
    this.results.clear();
  }
  assertInvariants() {
    const errors: string[] = [];
    if ([...this.results.values()].some((r) => r.realNdiTransmission || r.realDiscovery))
      errors.push('false real NDI claim');
    if (/ndi:\/\/|secret|payload|BEGIN CERTIFICATE/i.test(JSON.stringify(this.snapshotCore())))
      errors.push('unsafe metadata leaked');
    return freeze({
      valid: errors.length === 0,
      errors,
      warnings: ['synthetic metadata-only NDI foundation'],
      checkedInvariants: [
        'no NDI SDK',
        'no discovery',
        'no network',
        'bounded metadata',
        'monotonic frames',
        'shutdown cleanup',
      ],
    });
  }
  snapshotCore() {
    return {
      profiles: [...this.profiles.values()],
      destinations: [...this.destinations.values()],
      sessions: [...this.sessions.values()],
      advertisements: [...this.advertisements.values()],
      frames: [...this.frames.values()],
      metadataQueueDepth: [...this.metadataQueue.entries()].map(([sessionId, q]) => ({
        sessionId,
        depth: q.length,
      })),
      tally: [...this.tally.values()],
      ptz: [...this.ptz.values()],
      results: [...this.results.values()],
    };
  }
  snapshot() {
    const core = this.snapshotCore();
    return freeze({
      version: NDI_OUTPUT_VERSION,
      ...core,
      health: freeze({
        engineState: this.shutdown ? 'SHUTDOWN' : 'READY',
        healthState: this.assertInvariants().valid ? 'HEALTHY' : 'FAILED',
        activeSessions: this.sessions.size,
        frameCount: this.frames.size,
        metadataQueueDepth: core.metadataQueueDepth.reduce((a, x) => a + x.depth, 0),
        realNdiTransmission: false,
        realDiscovery: false,
      }),
      telemetry: freeze(clone(this.telemetry)),
      incidents: freeze([...this.incidents]),
      validation: this.assertInvariants(),
    });
  }
  private mustSession(id: string) {
    const s = this.sessions.get(id);
    if (!s) throw new NdiOutputError('NdiSessionNotFound', id);
    return s;
  }
}
export const createNdiOutputEngine = (id?: string) => new NdiOutputEngine(id);
export class NdiOutputProcessor implements TickProcessor {
  readonly descriptor: TickProcessorDescriptor = {
    id: 'ndi-output-foundation',
    name: 'NDI Output Foundation',
    version: NDI_OUTPUT_VERSION,
    order: NDI_OUTPUT_PROCESSOR_ORDER,
    phase: 'OUTPUT',
    workloadClass: 'BEST_EFFORT',
    enabledByDefault: true,
    dependencies: ['streaming-output-foundation'],
    optionalCapabilities: ['multi-destination-distribution'],
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
    metadata: { syntheticOnly: true, noNdiSdk: true, noDiscovery: true, noNetwork: true },
  };
  constructor(readonly engine: NdiOutputEngine) {}
  initialize() {
    return { status: 'READY' as const, metadata: { syntheticOnly: true } };
  }
  async processTick(tick: FrameTick, context: ProcessorRuntimeContext | any) {
    this.engine.processTick(tick);
    const s = this.engine.snapshot();
    context?.outputs?.publish?.(this.descriptor.id, NDI_OUTPUT_KEYS.health, s.health, 'BORROWED');
    return { status: 'SUCCEEDED' as const, value: s.health };
  }
  shutdown() {
    this.engine.shutdownEngine();
    return { status: 'STOPPED' as const };
  }
}
export const createNdiOutputProcessor = (engine: NdiOutputEngine) => new NdiOutputProcessor(engine);
export function createNdiCommandHandlers(
  engine: NdiOutputEngine,
): Readonly<Record<NdiCommandName, RuntimeCommandHandler>> {
  const h = (type: NdiCommandName, fn: (p: any) => unknown): RuntimeCommandHandler =>
    ({
      commandType: type,
      idempotent: true,
      execute(c: any) {
        return { status: 'SUCCEEDED', value: fn((c as any).payload ?? {}) };
      },
    }) as any;
  return Object.fromEntries(
    NDI_COMMANDS.map((type) => [
      type,
      h(type, (p) => {
        switch (type) {
          case 'NDI_REGISTER_PROFILE':
            return engine.registerProfile(p.profile);
          case 'NDI_REGISTER_DESTINATION':
            return engine.registerDestination(p.destination);
          case 'NDI_CREATE_SESSION':
            return engine.createSession(p.session);
          case 'NDI_ADVERTISE':
            return engine.advertise(p.sessionId);
          case 'NDI_SUBMIT_FRAME':
            return engine.submitFrame(p.frame);
          case 'NDI_UPDATE_TALLY':
            return engine.updateTally(p.sessionId, p.tally);
          case 'NDI_UPDATE_PTZ':
            return engine.updatePtz(p.sessionId, p.ptz);
          case 'NDI_VALIDATE':
            return engine.assertInvariants();
          case 'NDI_SHUTDOWN':
            return engine.shutdownEngine();
        }
      }),
    ]),
  ) as any;
}
export function createNdiSourceGraphSnapshot(engine: NdiOutputEngine) {
  const s = engine.snapshot();
  return freeze({
    sessionIds: s.sessions.map((x) => x.sessionId),
    outputRoles: s.sessions.map((x) => x.outputRole),
    destinationStates: s.destinations.map((x) => x.receiverCompatibility),
    advertised: s.advertisements.length,
    frameCount: s.frames.length,
    metadataQueueDepth: s.health.metadataQueueDepth,
    realNdiTransmission: false,
    realDiscovery: false,
    health: s.health.healthState,
    routingEligibility: s.health.healthState === 'HEALTHY',
  });
}
