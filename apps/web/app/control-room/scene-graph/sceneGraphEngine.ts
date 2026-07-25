/**
 * UBOS Scene Graph Engine — Step 62
 *
 * The Scene Graph Engine is the core production brain of UBOS.
 * It manages scenes, layers, outputs, automation triggers, and
 * provides the scene evaluation graph that all other engines
 * (graphics, replay, automation, AI Crew) consume.
 *
 * This is a minimal implementation. Later steps expand it into:
 *   - dependency graph traversal
 *   - layer evaluation pipeline
 *   - routing graph
 *   - automation graph
 *   - AI graph analysis
 *   - output delivery graph
 */

export type SceneLayer = {
  id: string;
  type: 'video' | 'image' | 'text' | 'graphics' | 'automation';
  name: string;
  src?: string;
  text?: string;
  visible?: boolean;
};

export type SceneAutomationTrigger = {
  id: string;
  name: string;
  action: string;
  condition?: string;
};

export type SceneOutput = {
  id: string;
  name: string;
  destination: string;
  status?: 'live' | 'ready' | 'offline';
};

export type SceneTimelineItem = {
  id: string;
  time: string;
  label: string;
};

export type Scene = {
  id: string;
  name: string;
  layers?: SceneLayer[];
  outputs?: SceneOutput[];
  timeline?: SceneTimelineItem[];
  automation?: SceneAutomationTrigger[];
};

export type EvaluatedScene = {
  id: string;
  name: string;
  layers: SceneLayer[];
  outputs: SceneOutput[];
  timeline: SceneTimelineItem[];
  automation: SceneAutomationTrigger[];
};

export class SceneGraphEngine {
  private scenes: Scene[] = [];
  private currentSceneId: string | null = null;
  private previewSceneId: string | null = null;

  constructor(initialScenes: Scene[] = []) {
    this.scenes = initialScenes;
  }

  // ── Scene management ───────────────────────────────────────────────────────

  setScenes(scenes: Scene[]): void {
    this.scenes = scenes;
  }

  addScene(scene: Scene): void {
    const existing = this.scenes.findIndex((s) => s.id === scene.id);
    if (existing >= 0) {
      this.scenes[existing] = scene;
    } else {
      this.scenes.push(scene);
    }
  }

  getScenes(): readonly Scene[] {
    return this.scenes;
  }

  // ── Active scene routing ──────────────────────────────────────────────────

  setCurrentScene(id: string | null): void {
    this.currentSceneId = id;
  }

  setPreviewScene(id: string | null): void {
    this.previewSceneId = id;
  }

  getCurrentScene(): Scene | null {
    if (!this.currentSceneId) return null;
    return this.scenes.find((s) => s.id === this.currentSceneId) ?? null;
  }

  getPreviewScene(): Scene | null {
    if (!this.previewSceneId) return null;
    return this.scenes.find((s) => s.id === this.previewSceneId) ?? null;
  }

  // ── Layer access ──────────────────────────────────────────────────────────

  getLayers(sceneId: string): SceneLayer[] {
    const scene = this.scenes.find((s) => s.id === sceneId);
    return scene?.layers ?? [];
  }

  // ── Scene evaluation ──────────────────────────────────────────────────────

  /**
   * Evaluate a scene for delivery: resolve all layers, outputs,
   * timeline events, and automation triggers.
   * Returns null if the scene does not exist.
   */
  evaluateScene(sceneId: string): EvaluatedScene | null {
    const scene = this.scenes.find((s) => s.id === sceneId);
    if (!scene) return null;

    return {
      id:         scene.id,
      name:       scene.name,
      layers:     scene.layers      ?? [],
      outputs:    scene.outputs     ?? [],
      timeline:   scene.timeline    ?? [],
      automation: scene.automation  ?? [],
    };
  }

  /** Evaluate all scenes and return the full graph snapshot. */
  evaluateGraph(): EvaluatedScene[] {
    return this.scenes.map((s) => this.evaluateScene(s.id)!);
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get sceneCount(): number { return this.scenes.length; }
  get currentId():  string | null { return this.currentSceneId; }
  get previewId():  string | null { return this.previewSceneId; }
}
