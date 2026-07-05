import type { SceneCompositor } from './compositor/index.js';
import type { PreviewOutput, ProgramOutput, OutputRuntimeState } from './output-pipeline.js';
import { createClock, type BroadcastClockState, type MediaClock } from './sync/clock.js';

export type ProductionSwitchAction = 'cut' | 'auto' | 'take';
export type ProductionSwitchEventType = 'preview_changed' | 'take' | 'cut' | 'auto' | 'program_changed';
export type TransitionKind = 'cut' | 'auto' | 'dissolve' | 'wipe' | 'stinger' | 'dve';
export type TransitionScheduleState = 'idle' | 'scheduled' | 'completed' | 'cancelled';

export interface TransitionMetadata {
  readonly id: string;
  readonly kind: TransitionKind;
  readonly durationMs: number;
  readonly scheduledFrameId: number;
  readonly scheduledPresentationMs: number;
  readonly fromProgramSceneId: string;
  readonly toProgramSceneId: string;
  readonly previewSceneId: string;
  readonly status: TransitionScheduleState;
  readonly metadata: Record<string, unknown>;
  readonly containsRuntimeHandles: false;
  readonly containsMediaPayloads: false;
}

export interface SwitchHistoryEntry {
  readonly id: string;
  readonly action: ProductionSwitchAction;
  readonly timestamp: string;
  readonly frameId: number;
  readonly fromProgramSceneId: string;
  readonly toProgramSceneId: string;
  readonly previewSceneId: string;
  readonly transition: TransitionMetadata;
  readonly metadata: Record<string, unknown>;
}

export interface ProductionSwitchRuntimeEvent {
  readonly id: string;
  readonly type: ProductionSwitchEventType;
  readonly timestamp: string;
  readonly frameId: number;
  readonly previewSceneId: string;
  readonly programSceneId: string;
  readonly transition?: TransitionMetadata;
  readonly metadata: Record<string, unknown>;
}

export interface ProductionSwitcherSnapshot {
  readonly id: string;
  readonly previewSceneId: string;
  readonly programSceneId: string;
  readonly activeTransition?: TransitionMetadata;
  readonly transitionDurationMs: number;
  readonly history: readonly SwitchHistoryEntry[];
  readonly events: readonly ProductionSwitchRuntimeEvent[];
  readonly clock: BroadcastClockState;
  readonly compositorIds: { readonly preview?: string | undefined; readonly program?: string | undefined };
  readonly outputIds: { readonly preview?: string | undefined; readonly program?: string | undefined };
  readonly outputStates: { readonly preview?: OutputRuntimeState | undefined; readonly program?: OutputRuntimeState | undefined };
  readonly metadata: Record<string, unknown>;
  readonly containsRuntimeHandles: false;
  readonly containsMediaPayloads: false;
}

export interface ProductionSwitcher {
  readonly id: string;
  setPreviewScene(sceneId: string, metadata?: Record<string, unknown>): ProductionSwitcherSnapshot;
  cut(metadata?: Record<string, unknown>): ProductionSwitcherSnapshot;
  take(metadata?: Record<string, unknown>): ProductionSwitcherSnapshot;
  auto(input?: { readonly durationMs?: number; readonly metadata?: Record<string, unknown> }): ProductionSwitcherSnapshot;
  scheduleTransition(input: { readonly kind: TransitionKind; readonly durationMs?: number; readonly metadata?: Record<string, unknown> }): TransitionMetadata;
  completeScheduledTransition(metadata?: Record<string, unknown>): ProductionSwitcherSnapshot;
  getSnapshot(): ProductionSwitcherSnapshot;
  getHistory(): readonly SwitchHistoryEntry[];
  getRuntimeEvents(): readonly ProductionSwitchRuntimeEvent[];
  onRuntimeEvent(callback: (event: ProductionSwitchRuntimeEvent) => void): () => void;
}

const now = () => new Date().toISOString();
const idFor = (prefix: string) => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const supportedVisualPlaceholder = (kind: TransitionKind) => ['dissolve', 'wipe', 'stinger', 'dve'].includes(kind);

export function createTransitionMetadata(input: {
  kind: TransitionKind;
  durationMs?: number;
  mediaClock: MediaClock;
  fromProgramSceneId: string;
  toProgramSceneId: string;
  previewSceneId: string;
  status?: TransitionScheduleState;
  metadata?: Record<string, unknown>;
}): TransitionMetadata {
  const durationMs = Math.max(0, Math.round(input.durationMs ?? (input.kind === 'cut' ? 0 : 1000)));
  const currentFrame = input.mediaClock.getCurrentFrame();
  return Object.freeze({
    id: idFor(`transition:${input.kind}`),
    kind: input.kind,
    durationMs,
    scheduledFrameId: currentFrame,
    scheduledPresentationMs: input.mediaClock.getFrameTimestamp(currentFrame),
    fromProgramSceneId: input.fromProgramSceneId,
    toProgramSceneId: input.toProgramSceneId,
    previewSceneId: input.previewSceneId,
    status: input.status ?? 'scheduled',
    metadata: clone({ ...(input.metadata ?? {}), visualRenderingImplemented: !supportedVisualPlaceholder(input.kind), backendIndependent: true }),
    containsRuntimeHandles: false,
    containsMediaPayloads: false,
  });
}

export function createProductionSwitcher(input: {
  id?: string;
  previewSceneId: string;
  programSceneId: string;
  previewCompositor?: SceneCompositor;
  programCompositor?: SceneCompositor;
  previewOutput?: PreviewOutput;
  programOutput?: ProgramOutput;
  mediaClock?: MediaClock;
  transitionDurationMs?: number;
  metadata?: Record<string, unknown>;
}): ProductionSwitcher {
  const id = input.id ?? 'production-switcher:default';
  const clock = input.mediaClock ?? createClock({ frameRate: 30 });
  let previewSceneId = input.previewSceneId;
  let programSceneId = input.programSceneId;
  let transitionDurationMs = Math.max(0, Math.round(input.transitionDurationMs ?? 1000));
  let activeTransition: TransitionMetadata | undefined;
  let history: SwitchHistoryEntry[] = [];
  let events: ProductionSwitchRuntimeEvent[] = [];
  const listeners = new Set<(event: ProductionSwitchRuntimeEvent) => void>();
  const emit = (type: ProductionSwitchEventType, metadata: Record<string, unknown> = {}, transition?: TransitionMetadata) => {
    const event = Object.freeze({ id: idFor(type), type, timestamp: now(), frameId: clock.getCurrentFrame(), previewSceneId, programSceneId, ...(transition ? { transition } : {}), metadata: clone(metadata) });
    events = [event, ...events].slice(0, 300);
    listeners.forEach((cb) => cb(event));
    return event;
  };
  const snapshot = (): ProductionSwitcherSnapshot => Object.freeze({
    id,
    previewSceneId,
    programSceneId,
    ...(activeTransition ? { activeTransition } : {}),
    transitionDurationMs,
    history: Object.freeze([...history]),
    events: Object.freeze([...events]),
    clock: clock.getState(),
    compositorIds: Object.freeze({ preview: input.previewCompositor?.id, program: input.programCompositor?.id }),
    outputIds: Object.freeze({ preview: input.previewOutput?.id, program: input.programOutput?.id }),
    outputStates: Object.freeze({ preview: input.previewOutput?.getRuntimeState(), program: input.programOutput?.getRuntimeState() }),
    metadata: clone({ ...(input.metadata ?? {}), backendIndependent: true }),
    containsRuntimeHandles: false,
    containsMediaPayloads: false,
  });
  const promote = (action: ProductionSwitchAction, transition: TransitionMetadata, metadata: Record<string, unknown>) => {
    const fromProgramSceneId = programSceneId;
    programSceneId = previewSceneId;
    activeTransition = Object.freeze({ ...transition, status: 'completed' });
    history = [Object.freeze({ id: idFor(`history:${action}`), action, timestamp: now(), frameId: clock.getCurrentFrame(), fromProgramSceneId, toProgramSceneId: programSceneId, previewSceneId, transition: activeTransition, metadata: clone(metadata) }), ...history].slice(0, 200);
    emit(action, metadata, activeTransition);
    emit('program_changed', { ...metadata, fromProgramSceneId, toProgramSceneId: programSceneId }, activeTransition);
    activeTransition = undefined;
    return snapshot();
  };
  const api: ProductionSwitcher = {
    id,
    setPreviewScene(sceneId, metadata = {}) { previewSceneId = sceneId; emit('preview_changed', metadata); return snapshot(); },
    cut(metadata = {}) { const t = createTransitionMetadata({ kind: 'cut', durationMs: 0, mediaClock: clock, fromProgramSceneId: programSceneId, toProgramSceneId: previewSceneId, previewSceneId, status: 'completed', metadata }); return promote('cut', t, metadata); },
    take(metadata = {}) { const t = createTransitionMetadata({ kind: 'cut', durationMs: 0, mediaClock: clock, fromProgramSceneId: programSceneId, toProgramSceneId: previewSceneId, previewSceneId, status: 'completed', metadata: { ...metadata, takeUsesCutSemantics: true } }); emit('take', metadata, t); return promote('take', t, metadata); },
    auto(inputAuto = {}) { const t = api.scheduleTransition({ kind: 'auto', durationMs: inputAuto.durationMs ?? transitionDurationMs, ...(inputAuto.metadata ? { metadata: inputAuto.metadata } : {}) }); emit('auto', inputAuto.metadata ?? {}, t); return api.completeScheduledTransition(inputAuto.metadata); },
    scheduleTransition(schedule) { transitionDurationMs = Math.max(0, Math.round(schedule.durationMs ?? transitionDurationMs)); activeTransition = createTransitionMetadata({ kind: schedule.kind, durationMs: transitionDurationMs, mediaClock: clock, fromProgramSceneId: programSceneId, toProgramSceneId: previewSceneId, previewSceneId, ...(schedule.metadata ? { metadata: schedule.metadata } : {}) }); return activeTransition; },
    completeScheduledTransition(metadata = {}) { if (!activeTransition) throw new Error('No scheduled transition to complete'); return promote(activeTransition.kind === 'auto' ? 'auto' : 'take', activeTransition, metadata); },
    getSnapshot: snapshot,
    getHistory: () => Object.freeze([...history]),
    getRuntimeEvents: () => Object.freeze([...events]),
    onRuntimeEvent(callback) { listeners.add(callback); return () => listeners.delete(callback); },
  };
  return api;
}

export async function createProductionSwitcherDemo() {
  const switcher = createProductionSwitcher({ id: 'production-switcher:demo', previewSceneId: 'scene:guest', programSceneId: 'scene:host', transitionDurationMs: 750, metadata: { demo: true } });
  const before = switcher.getSnapshot();
  const after = switcher.take({ operatorId: 'demo-director' });
  return { description: 'ProductionSwitcher promotes Preview to Program with deterministic metadata-only take/cut/auto events.', before, after };
}
