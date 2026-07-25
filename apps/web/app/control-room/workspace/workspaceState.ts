/**
 * UBOS Workspace State — Step 62
 *
 * Singleton that holds the live Scene Graph Engine instance.
 * Zone components import this directly to access scene graph data
 * without having to thread the engine through props.
 *
 * workspaceManager feeds scene data here via setScenes/setCurrentScene
 * whenever the production state changes.
 */
import {
  SceneGraphEngine,
  type Scene,
} from '../scene-graph/sceneGraphEngine';
import { ReplayEngine, type ReplayFrame } from '../replay-engine/replayEngine';
import { RoutingEngine, type RouteSignalType } from '../routing-engine/routingEngine';
import { AudioEngine, type AudioSource, type AudioLayer } from '../audio-engine/audioEngine';
import { AutomationEngine, type TriggerRegistration, type AutomationContext } from '../automation-engine/automationEngine';
import { OutputEngine } from '../output-engine/outputEngine';
import { AiCrewEngine } from '../ai-crew-engine/aiCrewEngine';

export const workspaceState = {
  sceneGraph:     new SceneGraphEngine(),
  replayEngine:   new ReplayEngine(),
  routingEngine:  new RoutingEngine(),
  audioEngine:       new AudioEngine(),
  automationEngine:  new AutomationEngine(),
  outputEngine:      new OutputEngine(),
  aiCrewEngine:      new AiCrewEngine(),

  // ── Scene Graph ────────────────────────────────────────────────────────────

  /** Called by WorkspaceManager when scenes are updated. */
  setScenes(scenes: Scene[]): void {
    this.sceneGraph.setScenes(scenes);
  },

  /** Called by WorkspaceManager when the active program scene changes. */
  setCurrentScene(id: string | null): void {
    this.sceneGraph.setCurrentScene(id);
  },

  /** Called by WorkspaceManager when the preview scene changes. */
  setPreviewScene(id: string | null): void {
    this.sceneGraph.setPreviewScene(id);
  },

  // ── Replay Engine ──────────────────────────────────────────────────────────

  addReplayFrame(cameraId: string, frame: ReplayFrame): void {
    this.replayEngine.addFrame(cameraId, frame);
  },

  addReplayMarker(cameraId: string, time: number, label?: string) {
    return this.replayEngine.addMarker(cameraId, time, label);
  },

  createReplayClip(cameraId: string, start: number, end: number) {
    return this.replayEngine.createClip(cameraId, start, end);
  },

  // ── Routing Engine ─────────────────────────────────────────────────────────

  addRoute(source: string, destination: string, signalType?: RouteSignalType) {
    return this.routingEngine.addRoute(source, destination, signalType);
  },

  removeRoute(id: number): void {
    this.routingEngine.removeRoute(id);
  },

  // ── Audio Engine ───────────────────────────────────────────────────────────

  registerAudioSource(id: string, source: AudioSource): void {
    this.audioEngine.registerSource(id, source);
  },

  setAudioLayers(layers: AudioLayer[]): void {
    this.audioEngine.setLayers(layers);
  },

  // ── Automation Engine ──────────────────────────────────────────────────────

  registerAutomationTrigger(registration: TriggerRegistration) {
    return this.automationEngine.registerTrigger(registration);
  },

  // ── AI Crew Engine ─────────────────────────────────────────────────────────

  /**
   * Run a full AI Crew analysis pass over all active engines.
   * Produces insights that surface in AiInspector + AI zones.
   */
  updateAiCrew(): void {
    const scene        = this.sceneGraph.getCurrentScene();
    const clips        = this.replayEngine.getClips();
    const audioHealth  = this.audioEngine.monitor();
    const routes       = this.routingEngine.getActiveRoutes();
    const outputHealth = this.outputEngine.health();
    const modQueue     = (this as unknown as { moderationQueue?: unknown[] }).moderationQueue;

    this.aiCrewEngine.analyzeScene(scene);
    this.aiCrewEngine.analyzeGraphics(scene?.layers?.filter((l) => l.type === 'graphics') ?? []);
    this.aiCrewEngine.analyzeReplay([...clips]);
    this.aiCrewEngine.analyzeAudio(audioHealth[0] ?? null);
    this.aiCrewEngine.analyzeRouting([...routes]);
    this.aiCrewEngine.analyzeOutput(outputHealth);
    if (modQueue && modQueue.length > 0) {
      this.aiCrewEngine.analyzeModeration(modQueue.length);
    }
  },

  /** Evaluate all automation triggers against the current workspace context. */
  evaluateAutomation(): void {
    this.automationEngine.evaluate(this as unknown as AutomationContext);
  },

  // ── Output Engine ──────────────────────────────────────────────────────────

  /**
   * Compose a new program output frame by pulling the current state from
   * all engines and pushing it into the Output Engine.
   */
  updateOutput(): void {
    const scene = this.sceneGraph.getCurrentScene();

    // Video sources from current scene
    const videoSources: Record<string, import('../output-engine/outputEngine').VideoSource> = {};
    if (scene) {
      videoSources[scene.id] = { id: scene.id, name: scene.name, type: 'scene' };
    }

    // Graphics frames from active scene layers (graphics type)
    const graphicsFrames = (scene?.layers ?? [])
      .filter((l) => l.type === 'graphics')
      .map((l) => ({ id: l.id, type: l.type, name: l.name ?? l.id, visible: true }));

    // Audio mix from Audio Engine
    const audioMix = this.audioEngine.mix();

    this.outputEngine.setVideoSources(videoSources);
    this.outputEngine.setGraphicsFrames(graphicsFrames);
    this.outputEngine.setAudioMix(audioMix);
  },
};
