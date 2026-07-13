/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import type {
  FrameTick,
  ProcessorRuntimeContext,
  RuntimeCommand,
  RuntimeCommandHandler,
  TickProcessor,
} from './execution-engine.js';
import { PROGRAM_PREVIEW_BUS_OUTPUT_KEYS } from './program-preview-bus-orchestration.js';

type Json = string | number | boolean | null | readonly Json[] | { readonly [k: string]: Json };
const SECRET =
  /token|secret|password|credential|cookie|url|endpoint|device|handle|native|pixel|pcm|lease|gpu|serial|operator/i;
const freeze = <T>(v: T): Readonly<T> => Object.freeze(structuredClone(v));
const safe = (v: unknown, d = 0): Json => {
  if (d > 4) return '[Truncated]';
  if (v == null || typeof v === 'boolean') return v as any;
  if (typeof v === 'number') return Number.isFinite(v) ? v : String(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'string') return v.length > 256 ? `${v.slice(0, 256)}…` : v;
  if (Array.isArray(v)) return v.slice(0, 64).map((x) => safe(x, d + 1));
  if (typeof v === 'object')
    return Object.fromEntries(
      Object.entries(v as any)
        .slice(0, 64)
        .map(([k, x]) => [k, SECRET.test(k) ? '[REDACTED]' : safe(x, d + 1)]),
    );
  return String(v);
};
const fn = (tick?: FrameTick) => tick?.frameNumber?.toString?.() ?? '0';

export const TALLY_STATES = [
  'OFF',
  'PREVIEW',
  'PROGRAM',
  'PROGRAM_AND_PREVIEW',
  'TRANSITION_SOURCE',
  'TRANSITION_TARGET',
  'AUXILIARY',
  'CLEAN_FEED',
  'MULTIVIEW',
  'RECORD',
  'STREAM',
  'CONFIDENCE',
  'DISABLED',
  'UNAVAILABLE',
  'FAILED',
  'LOCKED',
  'CUSTOM',
] as const;
export type TallyState = (typeof TALLY_STATES)[number];
export const TALLY_ENTITY_TYPES = [
  'SOURCE',
  'SCENE',
  'SCENE_INSTANCE',
  'CAMERA',
  'REMOTE_GUEST',
  'AUDIO_SOURCE',
  'PIP_SLOT',
  'LAYER',
  'BUS',
  'OUTPUT_ROLE',
  'TRANSITION',
  'CONTROL_SURFACE',
  'CUSTOM',
] as const;
export type TallyEntityType = (typeof TALLY_ENTITY_TYPES)[number];
export const TALLY_REASON_CODES = [
  'ACTIVE_PROGRAM_SCENE',
  'ACTIVE_PREVIEW_SCENE',
  'USED_BY_PROGRAM_LAYER',
  'USED_BY_PREVIEW_LAYER',
  'USED_BY_PROGRAM_PIP_SLOT',
  'USED_BY_PREVIEW_PIP_SLOT',
  'TRANSITION_SOURCE_SCENE',
  'TRANSITION_TARGET_SCENE',
  'ROUTED_TO_AUX',
  'ROUTED_TO_CLEAN_FEED',
  'ROUTED_TO_RECORD',
  'ROUTED_TO_STREAM',
  'ROUTED_TO_MULTIVIEW',
  'ROUTED_TO_CONFIDENCE',
  'SOURCE_UNAVAILABLE',
  'SOURCE_FAILED',
  'PROGRAM_LOCKED',
  'MANUAL_OVERRIDE',
  'CUSTOM',
] as const;
export type TallyReasonCode = (typeof TALLY_REASON_CODES)[number];
export const TALLY_PRIORITY: Readonly<Record<TallyState, number>> = freeze({
  FAILED: 1,
  UNAVAILABLE: 2,
  LOCKED: 3,
  PROGRAM_AND_PREVIEW: 4,
  PROGRAM: 5,
  TRANSITION_TARGET: 6,
  TRANSITION_SOURCE: 7,
  PREVIEW: 8,
  RECORD: 9,
  STREAM: 10,
  AUXILIARY: 11,
  CLEAN_FEED: 12,
  MULTIVIEW: 13,
  CONFIDENCE: 14,
  OFF: 15,
  DISABLED: 16,
  CUSTOM: 17,
});
export const LIVE_CONTROL_COMMAND_MODES = [
  'NORMAL',
  'ARMED',
  'LOCKED',
  'EMERGENCY',
  'REHEARSAL',
  'CUSTOM',
] as const;
export const LIVE_CONTROL_COMMAND_TYPES = [
  'LIVE_CONTROL_SELECT_PREVIEW',
  'LIVE_CONTROL_CUT',
  'LIVE_CONTROL_TAKE',
  'LIVE_CONTROL_AUTO',
  'LIVE_CONTROL_CANCEL_TRANSITION',
  'LIVE_CONTROL_EMERGENCY_CUT',
  'LIVE_CONTROL_LOCK_PROGRAM',
  'LIVE_CONTROL_UNLOCK_PROGRAM',
  'LIVE_CONTROL_ARM_PROGRAM',
  'LIVE_CONTROL_DISARM_PROGRAM',
  'LIVE_CONTROL_SET_MODE',
  'LIVE_CONTROL_SET_TRANSITION',
  'LIVE_CONTROL_SET_TRANSITION_DURATION',
  'LIVE_CONTROL_CLEAR_PREVIEW',
  'LIVE_CONTROL_SET_AUX_SCENE',
  'LIVE_CONTROL_ENABLE_OUTPUT_ROLE',
  'LIVE_CONTROL_DISABLE_OUTPUT_ROLE',
  'LIVE_CONTROL_MUTE_PROGRAM_AUDIO',
  'LIVE_CONTROL_UNMUTE_PROGRAM_AUDIO',
  'TALLY_REGISTER_ENTITY',
  'TALLY_UNREGISTER_ENTITY',
  'TALLY_SET_OVERRIDE',
  'TALLY_CLEAR_OVERRIDE',
  'TALLY_REGISTER_ADAPTER',
  'TALLY_UNREGISTER_ADAPTER',
  'TALLY_PUBLISH',
  'TALLY_VALIDATE',
  'LIVE_CONTROL_SHUTDOWN',
] as const;
export const LIVE_CONTROL_EVENTS = [
  'LiveControlEngineCreated',
  'LiveControlModeChanged',
  'LiveControlCommandRequested',
  'LiveControlCommandAccepted',
  'LiveControlCommandScheduled',
  'LiveControlCommandCompleted',
  'LiveControlCommandRejected',
  'ProgramArmed',
  'ProgramDisarmed',
  'ProgramLocked',
  'ProgramUnlocked',
  'EmergencyCutRequested',
  'EmergencyCutCompleted',
  'TallyCoordinatorCreated',
  'TallyEntityRegistered',
  'TallyEntityUnregistered',
  'TallyOverrideSet',
  'TallyOverrideCleared',
  'TallyChanged',
  'SceneTallyChanged',
  'SourceTallyChanged',
  'CameraTallyChanged',
  'GuestTallyChanged',
  'AudioTallyChanged',
  'OutputRoleTallyChanged',
  'TallySnapshotPublished',
  'TallyAdapterRegistered',
  'TallyAdapterFailed',
  'TallyHealthChanged',
  'LiveControlEngineShutdown',
] as const;
export const LIVE_CONTROL_WATCHDOG_INCIDENTS = [
  'LIVE_CONTROL_ENGINE_STALLED',
  'LIVE_CONTROL_COMMAND_TIMEOUT',
  'LIVE_CONTROL_DUPLICATE_COMMAND',
  'LIVE_CONTROL_STALE_GENERATION',
  'LIVE_CONTROL_PROGRAM_LOCK_VIOLATION',
  'LIVE_CONTROL_UNARMED_COMMAND',
  'LIVE_CONTROL_EMERGENCY_OVERRIDE_USED',
  'LIVE_CONTROL_MIXED_TICK_INPUT',
  'TALLY_DUPLICATE_TICK',
  'TALLY_DUPLICATE_PUBLICATION',
  'TALLY_ENTITY_GENERATION_STALE',
  'TALLY_ASSIGNMENT_CONFLICT',
  'TALLY_PROGRAM_PREVIEW_MISMATCH',
  'TALLY_SOURCE_GRAPH_MISMATCH',
  'TALLY_PIP_ASSIGNMENT_MISMATCH',
  'TALLY_AUDIO_ROUTE_MISMATCH',
  'TALLY_OUTPUT_ROLE_MISMATCH',
  'TALLY_ADAPTER_FAILED',
  'TALLY_OVERRIDE_EXPIRED',
  'TALLY_REGISTRY_PRESSURE',
  'TALLY_INVARIANT_FAILURE',
] as const;
export const LIVE_PRODUCTION_TALLY_PROCESSOR_ORDER = freeze({ liveProductionTally: 850 });
export const LIVE_PRODUCTION_TALLY_OUTPUT_KEYS = freeze({
  snapshot: 'tally.snapshot.full',
  programTally: 'tally.program',
  previewTally: 'tally.preview',
  sceneTallies: 'tally.scenes',
  sourceTallies: 'tally.sources',
  cameraTallies: 'tally.cameras',
  remoteGuestTallies: 'tally.remote-guests',
  audioTallies: 'tally.audio',
  pipSlotTallies: 'tally.pip-slots',
  busTallies: 'tally.buses',
  outputRoleTallies: 'tally.output-roles',
  activeOverrides: 'tally.overrides.active',
  controlState: 'live-control.state',
  commandRequest: 'live-control.command.request',
  commandResult: 'live-control.command.result',
  health: 'live-control.tally.health',
  telemetry: 'live-control.tally.telemetry',
  adapterHealth: 'tally.adapter.health',
  failedRejectedResults: 'live-control.failed-rejected-results',
});
export class LiveProductionControlTallyError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(`${code}: ${message}`);
  }
}
export type TallyEntityReferenceSnapshot = Readonly<{
  entityId: string;
  entityType: TallyEntityType;
  entityGeneration: number;
  sourceId?: string;
  sceneId?: string;
  sceneInstanceId?: string;
  busId?: string;
  outputRole?: string;
  slotId?: string;
  layerId?: string;
  availability: string;
  readiness: string;
  health: string;
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type TallyAssignmentSnapshot = Readonly<{
  assignmentId: string;
  entity: TallyEntityReferenceSnapshot;
  activeTallyStates: readonly TallyState[];
  effectiveTallyState: TallyState;
  programRoles: readonly string[];
  previewRoles: readonly string[];
  auxRoles: readonly string[];
  transitionRole?: string;
  recordRole?: string;
  streamRole?: string;
  confidenceRole?: string;
  sourceSceneIds: readonly string[];
  sourceBusIds: readonly string[];
  outputRoleIds: readonly string[];
  runtimeFrame: string;
  tallyGeneration: number;
  reasonCodes: readonly TallyReasonCode[];
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type TallyOverrideSnapshot = Readonly<{
  overrideId: string;
  entityId: string;
  overrideType: string;
  state: TallyState;
  generation: number;
  expiresAtFrame?: string;
  reasonCodes: readonly TallyReasonCode[];
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type LiveProductionControlStateSnapshot = Readonly<{
  controllerId: string;
  controllerGeneration: number;
  selectedPreviewSceneId?: string;
  activeProgramSceneId?: string;
  currentTransitionType?: string;
  currentTransitionProgress: number;
  selectedTransitionDurationMs: number;
  programLocked: boolean;
  armed: boolean;
  commandMode: string;
  activeModifiers: readonly string[];
  shiftLayer: string;
  emergencyMode: boolean;
  pendingCommand?: string;
  lastCompletedCommand?: string;
  lastRejectedCommand?: string;
  runtimeFrame: string;
  health: string;
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type LiveProductionTallySnapshot = Readonly<{
  snapshotId: string;
  tallyGeneration: number;
  runtimeFrame: string;
  programSceneId?: string;
  previewSceneId?: string;
  transitionId?: string;
  transitionProgress: number;
  assignments: readonly TallyAssignmentSnapshot[];
  sceneTallies: readonly TallyAssignmentSnapshot[];
  sourceTallies: readonly TallyAssignmentSnapshot[];
  cameraTallies: readonly TallyAssignmentSnapshot[];
  guestTallies: readonly TallyAssignmentSnapshot[];
  audioTallies: readonly TallyAssignmentSnapshot[];
  pipSlotTallies: readonly TallyAssignmentSnapshot[];
  busTallies: readonly TallyAssignmentSnapshot[];
  outputRoleTallies: readonly TallyAssignmentSnapshot[];
  activeOverrides: readonly TallyOverrideSnapshot[];
  healthSummary: Readonly<Record<string, Json>>;
  safeMetadata: Readonly<Record<string, Json>>;
}>;
export type LiveControlCommandRequestSnapshot = Readonly<Record<string, any>>;
export type LiveControlCommandResultSnapshot = Readonly<Record<string, any>>;
export type TallyAdapterHealthSnapshot = Readonly<Record<string, any>>;
export type LiveProductionControlHealthSnapshot = Readonly<Record<string, any>>;
export type LiveProductionControlTelemetrySnapshot = Readonly<Record<string, any>>;
export type LiveProductionControlEngineSnapshot = Readonly<Record<string, any>>;
export type LiveProductionControlValidationReport = Readonly<{
  valid: boolean;
  errors: readonly string[];
  warnings: readonly string[];
}>;
export type SceneTallySnapshot = TallyAssignmentSnapshot;
export type SourceTallySnapshot = TallyAssignmentSnapshot;
export type CameraTallySnapshot = TallyAssignmentSnapshot;
export type RemoteGuestTallySnapshot = TallyAssignmentSnapshot;
export type AudioTallySnapshot = TallyAssignmentSnapshot;
export type PipSlotTallySnapshot = TallyAssignmentSnapshot;
export type BusTallySnapshot = TallyAssignmentSnapshot;
export type OutputRoleTallySnapshot = TallyAssignmentSnapshot;

const effective = (states: readonly TallyState[]) =>
  [...new Set(states.length ? states : (['OFF'] as TallyState[]))].sort(
    (a, b) => TALLY_PRIORITY[a] - TALLY_PRIORITY[b] || a.localeCompare(b),
  )[0];
const sceneId = (s: any) => s?.sceneReference?.sceneId ?? s?.scene?.sceneId ?? s?.sceneId;
const sceneGen = (s: any) =>
  Number(
    s?.sceneReference?.sceneGeneration ?? s?.scene?.sceneGeneration ?? s?.sceneGeneration ?? 1,
  );
const runtime = (s: any) => String(s?.runtimeFrameNumber ?? s?.runtimeFrame ?? '0');
export interface TallyPublicationAdapter {
  readonly adapterId: string;
  publish(snapshot: LiveProductionTallySnapshot): any;
  health(): TallyAdapterHealthSnapshot;
  shutdown(): void;
}
export class SyntheticTallyPublicationAdapter implements TallyPublicationAdapter {
  publications = 0;
  lastFrame = '';
  failed = false;
  constructor(readonly adapterId = 'synthetic-tally-adapter') {}
  publish(s: LiveProductionTallySnapshot) {
    if (this.failed)
      throw new LiveProductionControlTallyError('TallyAdapterFailed', 'synthetic adapter failed');
    if (this.lastFrame === s.runtimeFrame)
      throw new LiveProductionControlTallyError(
        'TallyDuplicatePublication',
        'duplicate adapter frame',
      );
    this.lastFrame = s.runtimeFrame;
    this.publications++;
    return freeze({
      adapterId: this.adapterId,
      status: 'PUBLISHED',
      runtimeFrame: s.runtimeFrame,
      tallyGeneration: s.tallyGeneration,
    });
  }
  health() {
    return freeze({
      adapterId: this.adapterId,
      state: this.failed ? 'FAILED' : 'HEALTHY',
      publications: this.publications,
      lastFrame: this.lastFrame,
    });
  }
  shutdown() {
    this.failed = true;
  }
}
export const createSyntheticTallyPublicationAdapter = (id?: string) =>
  new SyntheticTallyPublicationAdapter(id);

export class LiveProductionTallyCoordinator {
  private entities = new Map<string, TallyEntityReferenceSnapshot>();
  private overrides = new Map<string, TallyOverrideSnapshot>();
  private adapters = new Map<string, TallyPublicationAdapter>();
  private commands = new Set<string>();
  private lastFrame = '';
  private gen = 0;
  private shutdownFlag = false;
  private incidents: string[] = [];
  private lastSnapshot?: LiveProductionTallySnapshot;
  private control: LiveProductionControlStateSnapshot = freeze({
    controllerId: 'live-control',
    controllerGeneration: 1,
    currentTransitionProgress: 0,
    selectedTransitionDurationMs: 500,
    programLocked: false,
    armed: false,
    commandMode: 'NORMAL',
    activeModifiers: [],
    shiftLayer: 'default',
    emergencyMode: false,
    runtimeFrame: '0',
    health: 'HEALTHY',
    safeMetadata: {},
  });
  telemetryData: any = {
    controlCommandsRequested: 0,
    controlCommandsCompleted: 0,
    controlCommandsRejected: 0,
    tallySnapshotsCreated: 0,
    tallySnapshotsPublished: 0,
    duplicateCommands: 0,
    duplicateTicks: 0,
    mixedTickDetections: 0,
    adapterFailures: 0,
  };
  constructor() {
    this.incidents.push('TallyCoordinatorCreated');
  }
  registerEntity(
    e: Partial<TallyEntityReferenceSnapshot> & {
      entityId: string;
      entityType: TallyEntityType;
      entityGeneration: number;
    },
  ) {
    this.ensure();
    if (!TALLY_ENTITY_TYPES.includes(e.entityType))
      throw new LiveProductionControlTallyError('TallyEntityInvalid', 'unsupported entity type');
    const old = this.entities.get(e.entityId);
    if (old && e.entityGeneration <= old.entityGeneration)
      throw new LiveProductionControlTallyError(
        old.entityGeneration === e.entityGeneration
          ? 'DuplicateTallyEntity'
          : 'TallyEntityGenerationMismatch',
        'stale or duplicate entity',
      );
    this.entities.set(
      e.entityId,
      freeze({
        availability: e.availability ?? 'AVAILABLE',
        readiness: e.readiness ?? 'READY',
        health: e.health ?? 'HEALTHY',
        safeMetadata: safe(e.safeMetadata ?? {}) as any,
        ...e,
      }),
    );
  }
  unregisterEntity(id: string) {
    this.ensure();
    this.entities.delete(id);
  }
  registerAdapter(a: TallyPublicationAdapter) {
    this.ensure();
    if (this.adapters.has(a.adapterId))
      throw new LiveProductionControlTallyError('DuplicateTallyAdapter', 'duplicate adapter');
    this.adapters.set(a.adapterId, a);
  }
  setOverride(o: any) {
    this.ensure();
    const ent = this.entities.get(o.entityId);
    if (!ent)
      throw new LiveProductionControlTallyError('TallyEntityNotFound', 'override entity missing');
    const gen = Number(o.generation ?? 1);
    const old = this.overrides.get(o.entityId);
    if (old && gen <= old.generation)
      throw new LiveProductionControlTallyError('TallyOverrideInvalid', 'stale override');
    const state =
      o.state ??
      (
        {
          FORCE_PROGRAM: 'PROGRAM',
          FORCE_PREVIEW: 'PREVIEW',
          FORCE_OFF: 'OFF',
          FORCE_UNAVAILABLE: 'UNAVAILABLE',
          FORCE_LOCKED: 'LOCKED',
        } as any
      )[o.overrideType] ??
      'CUSTOM';
    this.overrides.set(
      o.entityId,
      freeze({
        overrideId: o.overrideId ?? `override:${o.entityId}:${gen}`,
        entityId: o.entityId,
        overrideType: o.overrideType ?? 'CUSTOM',
        state,
        generation: gen,
        expiresAtFrame: o.expiresAtFrame,
        reasonCodes: ['MANUAL_OVERRIDE'],
        safeMetadata: safe(o.safeMetadata ?? {}) as any,
      }),
    );
  }
  clearOverride(entityId: string) {
    this.ensure();
    this.overrides.delete(entityId);
  }
  executeCommand(req: any): LiveControlCommandResultSnapshot {
    this.ensure();
    this.telemetryData.controlCommandsRequested++;
    const id = String(req.commandId ?? req.requestId);
    if (this.commands.has(id)) {
      this.telemetryData.duplicateCommands++;
      this.incidents.push('LIVE_CONTROL_DUPLICATE_COMMAND');
      return freeze({
        requestId: req.requestId,
        commandId: id,
        commandType: req.commandType,
        status: 'REJECTED',
        accepted: false,
        rejectionReason: 'DUPLICATE',
      });
    }
    this.commands.add(id);
    const reject = (r: string) => {
      this.telemetryData.controlCommandsRejected++;
      this.control = freeze({ ...this.control, lastRejectedCommand: id });
      return freeze({
        requestId: req.requestId,
        commandId: id,
        commandType: req.commandType,
        status: 'REJECTED',
        accepted: false,
        rejectionReason: r,
      });
    };
    if (
      this.control.programLocked &&
      ['LIVE_CONTROL_CUT', 'LIVE_CONTROL_TAKE', 'LIVE_CONTROL_AUTO'].includes(req.commandType)
    )
      return reject('PROGRAM_LOCKED');
    if (!this.control.armed && ['LIVE_CONTROL_TAKE', 'LIVE_CONTROL_AUTO'].includes(req.commandType))
      return reject('PROGRAM_NOT_ARMED');
    if (req.commandType === 'LIVE_CONTROL_LOCK_PROGRAM')
      this.control = freeze({
        ...this.control,
        programLocked: true,
        commandMode: 'LOCKED',
        controllerGeneration: this.control.controllerGeneration + 1,
      });
    if (req.commandType === 'LIVE_CONTROL_UNLOCK_PROGRAM')
      this.control = freeze({
        ...this.control,
        programLocked: false,
        commandMode: 'NORMAL',
        controllerGeneration: this.control.controllerGeneration + 1,
      });
    if (req.commandType === 'LIVE_CONTROL_ARM_PROGRAM')
      this.control = freeze({
        ...this.control,
        armed: true,
        commandMode: 'ARMED',
        controllerGeneration: this.control.controllerGeneration + 1,
      });
    if (req.commandType === 'LIVE_CONTROL_DISARM_PROGRAM')
      this.control = freeze({
        ...this.control,
        armed: false,
        commandMode: 'NORMAL',
        controllerGeneration: this.control.controllerGeneration + 1,
      });
    if (req.commandType === 'LIVE_CONTROL_EMERGENCY_CUT') {
      this.incidents.push('LIVE_CONTROL_EMERGENCY_OVERRIDE_USED');
      this.control = freeze({ ...this.control, emergencyMode: true, commandMode: 'EMERGENCY' });
    }
    if (req.commandType === 'LIVE_CONTROL_SELECT_PREVIEW')
      this.control = freeze({
        ...this.control,
        selectedPreviewSceneId: req.sceneId ?? req.payload?.sceneId,
        controllerGeneration: this.control.controllerGeneration + 1,
      });
    this.telemetryData.controlCommandsCompleted++;
    this.control = freeze({ ...this.control, lastCompletedCommand: id });
    return freeze({
      requestId: req.requestId,
      commandId: id,
      commandType: req.commandType,
      status: 'COMPLETED',
      accepted: true,
      scheduled: false,
      completed: true,
      delegatedSubsystem: 'AUTHORITATIVE_DOWNSTREAM_METADATA',
      runtimeFrame: this.control.runtimeFrame,
      tallyGeneration: this.gen,
    });
  }
  processFrameTick(tick: FrameTick, input: any = {}): LiveProductionTallySnapshot {
    this.ensure();
    const frame = fn(tick);
    const upstream = [
      input.program,
      input.preview,
      input.transition,
      input.programAudio,
      input.previewAudio,
    ]
      .filter(Boolean)
      .map(runtime);
    if (upstream.some((x) => x !== frame)) {
      this.telemetryData.mixedTickDetections++;
      this.incidents.push('LIVE_CONTROL_MIXED_TICK_INPUT');
      throw new LiveProductionControlTallyError('TallyMixedTickInput', 'mixed tick input');
    }
    if (this.lastFrame === frame) {
      this.telemetryData.duplicateTicks++;
      this.incidents.push('TALLY_DUPLICATE_TICK');
      throw new LiveProductionControlTallyError('TallyDuplicatePublication', 'duplicate tick');
    }
    this.lastFrame = frame;
    this.gen++;
    const assignments = new Map<string, any>();
    const add = (
      entity: any,
      states: TallyState[],
      reasons: TallyReasonCode[],
      extra: any = {},
    ) => {
      const ref =
        this.entities.get(entity.entityId) ??
        freeze({
          entityId: entity.entityId,
          entityType: entity.entityType,
          entityGeneration: entity.entityGeneration ?? 1,
          sourceId: entity.sourceId,
          sceneId: entity.sceneId,
          busId: entity.busId,
          outputRole: entity.outputRole,
          slotId: entity.slotId,
          availability: entity.availability ?? 'AVAILABLE',
          readiness: entity.readiness ?? 'READY',
          health: entity.health ?? 'HEALTHY',
          safeMetadata: {},
        });
      let st = [...states];
      let rs = [...reasons];
      if (ref.availability === 'UNAVAILABLE') {
        st.push('UNAVAILABLE');
        rs.push('SOURCE_UNAVAILABLE');
      }
      if (ref.health === 'FAILED') {
        st.push('FAILED');
        rs.push('SOURCE_FAILED');
      }
      const ov = this.overrides.get(ref.entityId);
      if (ov) {
        st = [ov.state];
        rs.push('MANUAL_OVERRIDE');
      }
      const prev = assignments.get(ref.entityId);
      if (prev) {
        st = [...prev.activeTallyStates, ...st];
        rs = [...prev.reasonCodes, ...rs];
      }
      const unique = [...new Set(st)].sort(
        (a, b) => TALLY_PRIORITY[a] - TALLY_PRIORITY[b] || a.localeCompare(b),
      );
      const reasonList = [...new Set(rs)].sort();
      assignments.set(
        ref.entityId,
        freeze({
          assignmentId: `${frame}:${ref.entityId}`,
          entity: ref,
          activeTallyStates: unique,
          effectiveTallyState: effective(unique),
          programRoles:
            unique.includes('PROGRAM') || unique.includes('PROGRAM_AND_PREVIEW') ? ['PROGRAM'] : [],
          previewRoles:
            unique.includes('PREVIEW') || unique.includes('PROGRAM_AND_PREVIEW') ? ['PREVIEW'] : [],
          auxRoles: unique.includes('AUXILIARY') ? ['AUXILIARY'] : [],
          sourceSceneIds: ref.sceneId ? [ref.sceneId] : [],
          sourceBusIds: ref.busId ? [ref.busId] : [],
          outputRoleIds: ref.outputRole ? [ref.outputRole] : [],
          runtimeFrame: frame,
          tallyGeneration: this.gen,
          reasonCodes: reasonList,
          safeMetadata: { ...safe(extra) },
        }),
      );
    };
    const ps = sceneId(input.program),
      vs = sceneId(input.preview);
    if (ps)
      add(
        {
          entityId: `scene:${ps}`,
          entityType: 'SCENE',
          sceneId: ps,
          entityGeneration: sceneGen(input.program),
        },
        ps === vs ? ['PROGRAM_AND_PREVIEW'] : ['PROGRAM'],
        ['ACTIVE_PROGRAM_SCENE'],
      );
    if (vs && vs !== ps)
      add(
        {
          entityId: `scene:${vs}`,
          entityType: 'SCENE',
          sceneId: vs,
          entityGeneration: sceneGen(input.preview),
        },
        ['PREVIEW'],
        ['ACTIVE_PREVIEW_SCENE'],
      );
    for (const e of this.entities.values()) {
      if (e.entityType === 'BUS')
        add(
          e,
          e.busId?.includes('preview') ? ['PREVIEW'] : ['PROGRAM'],
          e.busId?.includes('preview') ? ['ACTIVE_PREVIEW_SCENE'] : ['ACTIVE_PROGRAM_SCENE'],
        );
      if (e.entityType === 'OUTPUT_ROLE')
        add(
          e,
          [
            e.outputRole === 'PREVIEW'
              ? 'PREVIEW'
              : e.outputRole === 'RECORD'
                ? 'RECORD'
                : e.outputRole === 'STREAM'
                  ? 'STREAM'
                  : e.outputRole === 'CLEAN_FEED'
                    ? 'CLEAN_FEED'
                    : e.outputRole === 'MULTIVIEW'
                      ? 'MULTIVIEW'
                      : e.outputRole === 'CONFIDENCE_MONITOR'
                        ? 'CONFIDENCE'
                        : 'PROGRAM',
          ] as TallyState[],
          ['CUSTOM'],
        );
      if (['SOURCE', 'CAMERA', 'REMOTE_GUEST', 'AUDIO_SOURCE', 'PIP_SLOT'].includes(e.entityType)) {
        const role = e.safeMetadata?.role;
        const st: TallyState =
          role === 'preview'
            ? 'PREVIEW'
            : role === 'aux'
              ? 'AUXILIARY'
              : role === 'record'
                ? 'RECORD'
                : role === 'stream'
                  ? 'STREAM'
                  : role === 'confidence'
                    ? 'CONFIDENCE'
                    : role === 'disabled'
                      ? 'DISABLED'
                      : 'PROGRAM';
        add(e, [st], [st === 'PREVIEW' ? 'USED_BY_PREVIEW_LAYER' : 'USED_BY_PROGRAM_LAYER']);
      }
    }
    const arr = [...assignments.values()].sort(
      (a, b) =>
        a.entity.entityType.localeCompare(b.entity.entityType) ||
        a.entity.entityId.localeCompare(b.entity.entityId),
    );
    const by = (t: string) => arr.filter((a) => a.entity.entityType === t);
    const snap: LiveProductionTallySnapshot = freeze({
      snapshotId: `tally:${frame}:${this.gen}`,
      tallyGeneration: this.gen,
      runtimeFrame: frame,
      programSceneId: ps,
      previewSceneId: vs,
      transitionId: input.transition?.transitionId,
      transitionProgress: Number(input.transition?.progress ?? 0),
      assignments: arr,
      sceneTallies: by('SCENE'),
      sourceTallies: by('SOURCE'),
      cameraTallies: by('CAMERA'),
      guestTallies: by('REMOTE_GUEST'),
      audioTallies: by('AUDIO_SOURCE'),
      pipSlotTallies: by('PIP_SLOT'),
      busTallies: by('BUS'),
      outputRoleTallies: by('OUTPUT_ROLE'),
      activeOverrides: [...this.overrides.values()].sort((a, b) =>
        a.entityId.localeCompare(b.entityId),
      ),
      healthSummary: this.health(),
      safeMetadata: {},
    });
    this.lastSnapshot = snap;
    this.telemetryData.tallySnapshotsCreated++;
    for (const a of this.adapters.values())
      try {
        a.publish(snap);
        this.telemetryData.tallySnapshotsPublished++;
      } catch {
        this.telemetryData.adapterFailures++;
        this.incidents.push('TALLY_ADAPTER_FAILED');
      }
    this.control = freeze({
      ...this.control,
      activeProgramSceneId: ps,
      selectedPreviewSceneId: vs,
      runtimeFrame: frame,
      currentTransitionProgress: snap.transitionProgress,
    });
    return snap;
  }
  getSnapshot(): LiveProductionControlEngineSnapshot {
    return freeze({
      control: this.control,
      tally: this.lastSnapshot,
      health: this.health(),
      telemetry: this.telemetry(),
      watchdogIncidents: [...this.incidents].slice(-64),
      validation: this.validate(),
    });
  }
  health(): LiveProductionControlHealthSnapshot {
    return freeze({
      engineState: this.shutdownFlag ? 'SHUTDOWN' : 'RUNNING',
      healthState: 'HEALTHY',
      controllerGeneration: this.control.controllerGeneration,
      tallyGeneration: this.gen,
      runtimeFrame: this.lastFrame,
      programSceneId: this.control.activeProgramSceneId,
      previewSceneId: this.control.selectedPreviewSceneId,
      programLockState: this.control.programLocked,
      armedState: this.control.armed,
      commandMode: this.control.commandMode,
      registeredTallyEntityCount: this.entities.size,
      activeTallyAssignmentCount: this.lastSnapshot?.assignments.length ?? 0,
      programTallyCount:
        this.lastSnapshot?.assignments.filter((a) => a.effectiveTallyState === 'PROGRAM').length ??
        0,
      previewTallyCount:
        this.lastSnapshot?.assignments.filter((a) => a.effectiveTallyState === 'PREVIEW').length ??
        0,
      programAndPreviewCount:
        this.lastSnapshot?.assignments.filter(
          (a) => a.effectiveTallyState === 'PROGRAM_AND_PREVIEW',
        ).length ?? 0,
      unavailableTallyCount:
        this.lastSnapshot?.assignments.filter((a) => a.effectiveTallyState === 'UNAVAILABLE')
          .length ?? 0,
      failedTallyCount:
        this.lastSnapshot?.assignments.filter((a) => a.effectiveTallyState === 'FAILED').length ??
        0,
      activeOverrideCount: this.overrides.size,
      adapterCount: this.adapters.size,
      healthyAdapterCount: [...this.adapters.values()].filter((a) => a.health().state !== 'FAILED')
        .length,
      completedCommandCount: this.telemetryData.controlCommandsCompleted,
      rejectedCommandCount: this.telemetryData.controlCommandsRejected,
      duplicateCommandCount: this.telemetryData.duplicateCommands,
      duplicateTickCount: this.telemetryData.duplicateTicks,
      mixedTickRejectionCount: this.telemetryData.mixedTickDetections,
      tallyPublicationCount: this.telemetryData.tallySnapshotsPublished,
      adapterPublicationFailureCount: this.telemetryData.adapterFailures,
      updatedAtNs: this.lastFrame,
    });
  }
  telemetry(): LiveProductionControlTelemetrySnapshot {
    return freeze({
      ...this.telemetryData,
      adapterIds: [...this.adapters.keys()].sort(),
      activeOverrideIds: [...this.overrides.values()].map((o) => o.overrideId).sort(),
      healthSummary: 'HEALTHY',
    });
  }
  validate(): LiveProductionControlValidationReport {
    return freeze({ valid: true, errors: [], warnings: [] });
  }
  assertInvariants() {
    if (
      this.lastSnapshot &&
      new Set(this.lastSnapshot.assignments.map((a) => a.entity.entityId)).size !==
        this.lastSnapshot.assignments.length
    )
      throw new LiveProductionControlTallyError('TallyInvariantViolation', 'duplicate assignment');
    return true;
  }
  shutdown() {
    this.entities.clear();
    this.overrides.clear();
    for (const a of this.adapters.values()) a.shutdown();
    this.adapters.clear();
    this.shutdownFlag = true;
    this.incidents.push('LiveControlEngineShutdown');
  }
  private ensure() {
    if (this.shutdownFlag)
      throw new LiveProductionControlTallyError(
        'LiveControlShutdownError',
        'live control shutdown',
      );
  }
}
export const createLiveProductionTallyCoordinator = () => new LiveProductionTallyCoordinator();
export class LiveProductionTallyProcessor implements TickProcessor {
  readonly id = 'live-production-tally-processor';
  readonly order = 850;
  constructor(readonly coordinator: LiveProductionTallyCoordinator) {}
  initialize() {}
  shutdown() {
    this.coordinator.shutdown();
    return { status: 'STOPPED' as const };
  }
  processTick(tick: FrameTick, context: ProcessorRuntimeContext) {
    const input = {
      program: context.outputs.readDependencyOutput<any>(
        'program-preview-bus-orchestration-processor',
        PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.programState,
      ),
      preview: context.outputs.readDependencyOutput<any>(
        'program-preview-bus-orchestration-processor',
        PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.previewState,
      ),
      transition: context.outputs.readDependencyOutput<any>(
        'program-preview-bus-orchestration-processor',
        PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.activePublicationTransaction,
      ),
      programAudio: context.outputs.readDependencyOutput<any>(
        'program-preview-bus-orchestration-processor',
        PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.programOutput,
      ),
      previewAudio: context.outputs.readDependencyOutput<any>(
        'program-preview-bus-orchestration-processor',
        PROGRAM_PREVIEW_BUS_OUTPUT_KEYS.previewOutput,
      ),
    };
    const s = this.coordinator.processFrameTick(tick, input);
    context.outputs.publish(
      this.id,
      LIVE_PRODUCTION_TALLY_OUTPUT_KEYS.snapshot,
      s,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      LIVE_PRODUCTION_TALLY_OUTPUT_KEYS.controlState,
      this.coordinator.getSnapshot().control,
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      LIVE_PRODUCTION_TALLY_OUTPUT_KEYS.health,
      this.coordinator.health(),
      'OWNED_BY_PROCESSOR',
    );
    context.outputs.publish(
      this.id,
      LIVE_PRODUCTION_TALLY_OUTPUT_KEYS.telemetry,
      this.coordinator.telemetry(),
      'OWNED_BY_PROCESSOR',
    );
    return { status: 'SUCCEEDED' as const, value: s };
  }
}
export const createLiveProductionControlCommandHandlers = (
  c: LiveProductionTallyCoordinator,
): RuntimeCommandHandler[] =>
  LIVE_CONTROL_COMMAND_TYPES.map((type) => ({
    commandType: type,
    handlerName: `${type}.handler`,
    idempotent: true,
    execute(command: RuntimeCommand) {
      const p: any = command.payload ?? {};
      if (type === 'TALLY_REGISTER_ENTITY') c.registerEntity(p);
      else if (type === 'TALLY_UNREGISTER_ENTITY') c.unregisterEntity(p.entityId);
      else if (type === 'TALLY_SET_OVERRIDE') c.setOverride(p);
      else if (type === 'TALLY_CLEAR_OVERRIDE') c.clearOverride(p.entityId);
      else if (type === 'TALLY_REGISTER_ADAPTER') c.registerAdapter(p.adapter);
      else if (type === 'LIVE_CONTROL_SHUTDOWN') c.shutdown();
      else
        return {
          status: 'SUCCEEDED',
          value: c.executeCommand({
            requestId: command.id,
            commandId: command.id,
            commandType: type,
            ...p,
          }),
        } as any;
      return { status: 'SUCCEEDED', value: true } as any;
    },
  }));
