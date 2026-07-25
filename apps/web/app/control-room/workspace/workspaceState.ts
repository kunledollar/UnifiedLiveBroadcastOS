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

export const workspaceState = {
  sceneGraph:     new SceneGraphEngine(),
  replayEngine:   new ReplayEngine(),
  routingEngine:  new RoutingEngine(),
  audioEngine:    new AudioEngine(),

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
};
