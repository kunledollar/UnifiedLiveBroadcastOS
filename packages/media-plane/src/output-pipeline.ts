import type { RenderFrame, SceneCompositor } from './compositor/index.js';
import { createGpuRuntime, createGpuSurface, type GpuRuntime, type GpuSurface } from './gpu-runtime/index.js';
import type { AudioMixer, AudioMixerOutputFrame } from './media-runtime/audio-mixer.js';
import { createClock, type MediaClock } from './sync/clock.js';

export type OutputKind = 'preview' | 'program';
export type OutputLifecycleState = 'initializing' | 'ready' | 'rendering' | 'paused' | 'stopped' | 'failed';
export type OutputStatusEventType = 'output_created' | 'output_ready' | 'output_rendering' | 'output_paused' | 'output_stopped' | 'output_failed' | 'frame_presented';

export interface OutputVideoSurface { readonly id: string; readonly target: OutputKind; readonly width: number; readonly height: number; readonly format: string; readonly graphRevision: number; readonly metadata: Record<string, unknown>; readonly containsRuntimeHandles: false; }
export interface OutputAudioBus { readonly id: string; readonly target: OutputKind; readonly mixerBusId: string; readonly channels: number; readonly sampleRate: number; readonly metadata: Record<string, unknown>; readonly containsRuntimeHandles: false; }
export interface OutputRenderState { readonly rendererBackend: string; readonly sceneId: string; readonly compositionId?: string; readonly graphRevision: number; readonly frameId: number; readonly videoFrame?: RenderFrame; readonly audioFrames: readonly AudioMixerOutputFrame[]; readonly synchronizedPresentationMs: number; readonly driftMs: number; readonly metadata: Record<string, unknown>; readonly containsRuntimeHandles: false; readonly containsMediaPayloads: false; }
export interface OutputStatusEvent { readonly id: string; readonly type: OutputStatusEventType; readonly timestamp: string; readonly outputId: string; readonly target: OutputKind; readonly state: OutputLifecycleState; readonly message: string; readonly frameId?: number; readonly metadata: Record<string, unknown>; }
export interface OutputRuntimeState { readonly id: string; readonly target: OutputKind; readonly state: OutputLifecycleState; readonly videoSurface: OutputVideoSurface; readonly audioBus: OutputAudioBus; readonly renderState: OutputRenderState; readonly events: readonly OutputStatusEvent[]; readonly clock: ReturnType<MediaClock['getState']>; readonly containsRuntimeHandles: false; readonly containsMediaPayloads: false; }

export interface BaseOutput { readonly id: string; readonly target: OutputKind; initialize(): OutputRuntimeState; start(): OutputRuntimeState; renderFrame(): OutputRuntimeState; pause(): OutputRuntimeState; resume(): OutputRuntimeState; stop(): OutputRuntimeState; fail(message: string): OutputRuntimeState; getRuntimeState(): OutputRuntimeState; getStatusEvents(): readonly OutputStatusEvent[]; onStatus(callback: (event: OutputStatusEvent) => void): () => void; }
export interface PreviewOutput extends BaseOutput { readonly target: 'preview'; }
export interface ProgramOutput extends BaseOutput { readonly target: 'program'; }

const now = () => new Date().toISOString();
const eid = (type: string) => `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const toSurface = (surface: GpuSurface, target: OutputKind): OutputVideoSurface => Object.freeze({ id: surface.id, target, width: surface.width, height: surface.height, format: surface.format, graphRevision: surface.graphRevision, metadata: clone(surface.metadata), containsRuntimeHandles: false });

export function createOutput(input: { id?: string; target: OutputKind; sceneId: string; compositor: SceneCompositor; audioMixer: AudioMixer; audioBusId?: string; mediaClock?: MediaClock; renderer?: GpuRuntime; videoSurface?: Partial<OutputVideoSurface>; audioBus?: Partial<OutputAudioBus>; metadata?: Record<string, unknown>; }): PreviewOutput | ProgramOutput {
  const target = input.target;
  const id = input.id ?? `${target}-output:${input.sceneId}`;
  const clock = input.mediaClock ?? createClock({ frameRate: 30 });
  const renderer = input.renderer ?? createGpuRuntime();
  let lifecycle: OutputLifecycleState = 'initializing';
  let frameId = 0;
  let events: OutputStatusEvent[] = [];
  let latestVideoFrame: RenderFrame | undefined;
  let latestAudioFrames: readonly AudioMixerOutputFrame[] = [];
  const baseGpuSurface = createGpuSurface({ id: input.videoSurface?.id ?? `surface:${target}`, target, width: input.videoSurface?.width ?? 1920, height: input.videoSurface?.height ?? 1080, format: input.videoSurface?.format ?? 'rgba8unorm-metadata', graphRevision: input.videoSurface?.graphRevision ?? 0, metadata: input.videoSurface?.metadata ?? {} });
  const videoSurface = toSurface(baseGpuSurface, target);
  const audioBus: OutputAudioBus = Object.freeze({ id: input.audioBus?.id ?? `output-audio-bus:${target}`, target, mixerBusId: input.audioBusId ?? input.audioBus?.mixerBusId ?? `bus:${target}`, channels: input.audioBus?.channels ?? 2, sampleRate: input.audioBus?.sampleRate ?? 48000, metadata: clone(input.audioBus?.metadata ?? {}), containsRuntimeHandles: false });
  const listeners = new Set<(event: OutputStatusEvent) => void>();
  const emit = (type: OutputStatusEventType, message: string, metadata: Record<string, unknown> = {}) => { const e = Object.freeze({ id: eid(type), type, timestamp: now(), outputId: id, target, state: lifecycle, message, ...(latestVideoFrame ? { frameId: latestVideoFrame.frameId } : {}), metadata: clone(metadata) }); events = [e, ...events].slice(0, 200); listeners.forEach((cb) => cb(e)); return e; };
  const renderState = (): OutputRenderState => { const pts = latestVideoFrame?.frameTimestamp ?? clock.getPresentationTimestamp(); const audioPts = latestAudioFrames[0]?.timestamp ?? pts; return Object.freeze({ rendererBackend: renderer.manifest.diagnostics.backend, sceneId: input.sceneId, ...(latestVideoFrame ? { compositionId: latestVideoFrame.compositionId } : {}), graphRevision: latestVideoFrame?.graphRevision ?? videoSurface.graphRevision, frameId, ...(latestVideoFrame ? { videoFrame: latestVideoFrame } : {}), audioFrames: Object.freeze([...latestAudioFrames]), synchronizedPresentationMs: pts, driftMs: Math.round((audioPts - pts) * 1000) / 1000, metadata: clone(input.metadata ?? {}), containsRuntimeHandles: false, containsMediaPayloads: false }); };
  const snapshot = (): OutputRuntimeState => Object.freeze({ id, target, state: lifecycle, videoSurface, audioBus, renderState: renderState(), events: Object.freeze([...events]), clock: clock.getState(), containsRuntimeHandles: false, containsMediaPayloads: false });
  const api: BaseOutput = { id, target, initialize() { lifecycle = 'ready'; emit('output_ready', `${target} output ready`); return snapshot(); }, start() { if (clock.getState().status === 'stopped') clock.startClock(); input.audioMixer.start(); lifecycle = 'rendering'; emit('output_rendering', `${target} output rendering`); return snapshot(); }, renderFrame() { if (lifecycle !== 'rendering') throw new Error(`${target} output must be rendering before presenting frames`); frameId += 1; latestVideoFrame = input.compositor.composeFrame({ frameId, rendererBackend: renderer.manifest.diagnostics.backend, metadata: { outputTarget: target } }); latestAudioFrames = input.audioMixer.mix().filter((f) => f.busId === audioBus.mixerBusId); renderer.execute({ id: `render:${id}:${frameId}`, type: 'START_GPU_RUNTIME', timestamp: now(), graphRevision: latestVideoFrame.graphRevision, payload: { outputId: id, target, frameId } }); emit('frame_presented', `${target} output presented synchronized frame`, { videoFrameId: latestVideoFrame.frameId, audioBusId: audioBus.mixerBusId, synchronizedPresentationMs: latestVideoFrame.frameTimestamp }); return snapshot(); }, pause() { lifecycle = 'paused'; input.audioMixer.pause(); clock.pauseClock(); emit('output_paused', `${target} output paused`); return snapshot(); }, resume() { lifecycle = 'rendering'; input.audioMixer.resume(); clock.resumeClock(); emit('output_rendering', `${target} output resumed`); return snapshot(); }, stop() { lifecycle = 'stopped'; input.audioMixer.stop(); clock.stopClock(); emit('output_stopped', `${target} output stopped`); return snapshot(); }, fail(message) { lifecycle = 'failed'; emit('output_failed', message); return snapshot(); }, getRuntimeState: snapshot, getStatusEvents: () => Object.freeze([...events]), onStatus(callback) { listeners.add(callback); return () => listeners.delete(callback); } };
  emit('output_created', `${target} output created`, { sceneId: input.sceneId });
  return api as PreviewOutput | ProgramOutput;
}

export const createPreviewOutput = (input: Omit<Parameters<typeof createOutput>[0], 'target'>): PreviewOutput => createOutput({ ...input, target: 'preview' }) as PreviewOutput;
export const createProgramOutput = (input: Omit<Parameters<typeof createOutput>[0], 'target'>): ProgramOutput => createOutput({ ...input, target: 'program' }) as ProgramOutput;

export class OutputPipelineManager {
  private outputs = new Map<OutputKind, PreviewOutput | ProgramOutput>();
  constructor(outputs: { preview: PreviewOutput; program: ProgramOutput }) { this.outputs.set('preview', outputs.preview); this.outputs.set('program', outputs.program); }
  initializeAll() { return this.map((o) => o.initialize()); }
  startAll() { return this.map((o) => o.start()); }
  renderAll() { return this.map((o) => o.renderFrame()); }
  pauseAll() { return this.map((o) => o.pause()); }
  stopAll() { return this.map((o) => o.stop()); }
  getOutput(target: OutputKind) { return this.outputs.get(target); }
  getSnapshot() { return Object.freeze({ preview: this.outputs.get('preview')?.getRuntimeState(), program: this.outputs.get('program')?.getRuntimeState(), containsRuntimeHandles: false, containsMediaPayloads: false }); }
  getStatusEvents() { return [...this.outputs.values()].flatMap((output) => output.getStatusEvents()).sort((a,b)=>b.timestamp.localeCompare(a.timestamp)); }
  private map(fn: (output: PreviewOutput | ProgramOutput) => OutputRuntimeState) { return Object.freeze({ preview: fn(this.outputs.get('preview')!), program: fn(this.outputs.get('program')!) }); }
}

export async function createPreviewProgramOutputDemo() {
  return { description: 'Preview and Program outputs render simultaneously through independent SceneCompositor instances, shared renderer contract, AudioMixer buses, and MediaClock-derived presentation timestamps.' };
}
