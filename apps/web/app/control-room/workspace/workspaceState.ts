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
import { OrchestrationEngine } from '../orchestration-engine/orchestrationEngine';
import { HealthEngine } from '../health-engine/healthEngine';
import { PersistenceEngine } from '../persistence-engine/persistenceEngine';
import { DistributionEngine } from '../distribution-engine/distributionEngine';

export const workspaceState = {
  sceneGraph:     new SceneGraphEngine(),
  replayEngine:   new ReplayEngine(),
  routingEngine:  new RoutingEngine(),
  audioEngine:       new AudioEngine(),
  automationEngine:  new AutomationEngine(),
  outputEngine:      new OutputEngine(),
  aiCrewEngine:         new AiCrewEngine(),
  orchestrationEngine:  null as OrchestrationEngine | null,
  healthEngine:         new HealthEngine(),
  persistenceEngine:    new PersistenceEngine(),
  distributionEngine:   new DistributionEngine(),

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

  // ── Persistence Engine ────────────────────────────────────────────────────

  /** Snapshot all engine states into the persistence store. */
  saveState(): void {
    const p = this.persistenceEngine;
    p.save('scenes',     this.sceneGraph.getScenes());
    p.save('routing',    this.routingEngine.getRoutes());
    p.save('audio',      this.audioEngine.layers);
    p.save('replay',     this.replayEngine.getClips());
    p.save('ai',         this.aiCrewEngine.getInsights());
    p.save('health',     this.healthEngine.getMetrics());
    p.save('automation', this.automationEngine.getTriggers().map((t) => ({
      id:   t.id,
      name: t.name,
      enabled:  t.enabled,
      runCount: t.runCount,
    })));
    this.persistenceEngine.snapshot('manual-save');
    this.aiCrewEngine['push' in this.aiCrewEngine
      ? 'push' as never
      : 'analyzeScene' as never];
    // Notify AI Crew that state was saved
    this.aiCrewEngine.analyzeScene({ name: 'State saved', layers: [] });
  },

  /** Restore engine states from the persistence store. */
  loadState(): void {
    const p = this.persistenceEngine;
    if (p.has('scenes')) {
      this.sceneGraph.setScenes((p.load('scenes') as Parameters<typeof this.sceneGraph.setScenes>[0]) ?? []);
    }
    if (p.has('routing')) {
      // Routes are read-only via getRoutes(); re-add them
      const saved = p.load('routing') as Array<{ source: string; destination: string }> ?? [];
      saved.forEach((r) => {
        if (!this.routingEngine.hasRoute(r.source, r.destination)) {
          this.routingEngine.addRoute(r.source, r.destination);
        }
      });
    }
    if (p.has('audio')) {
      this.audioEngine.setLayers((p.load('audio') as Parameters<typeof this.audioEngine.setLayers>[0]) ?? []);
    }
  },

  // ── Distribution Engine ───────────────────────────────────────────────────

  registerDestination(dest: Parameters<typeof this.distributionEngine.registerDestination>[0]) {
    return this.distributionEngine.registerDestination(dest);
  },

  distributeOutput() {
    const frame = this.outputEngine.composeFrame();
    const results = this.distributionEngine.distribute(frame);
    // Notify AI Crew of distribution activity
    if (results.some((r) => r.status === 'sent')) {
      this.aiCrewEngine.analyzeRouting([...this.routingEngine.getActiveRoutes()]);
    }
    return results;
  },

  // ── Orchestration Engine ───────────────────────────────────────────────────

  /**
   * Create and start the global tick loop.
   * Safe to call multiple times — won't double-start.
   */
  initializeOrchestration(): void {
    if (this.orchestrationEngine?.isRunning) return;
    this.orchestrationEngine = new OrchestrationEngine({
      sceneGraph:       this.sceneGraph,
      replayEngine:     this.replayEngine,
      routingEngine:    this.routingEngine,
      audioEngine:      this.audioEngine,
      automationEngine: this.automationEngine,
      outputEngine:     this.outputEngine,
      aiCrewEngine:     this.aiCrewEngine,
      healthEngine:      this.healthEngine,
      persistenceEngine: this.persistenceEngine,
      automationContext: this as unknown as import('../automation-engine/automationEngine').AutomationContext,
    });
    this.orchestrationEngine.start();
  },

  stopOrchestration(): void {
    this.orchestrationEngine?.stop();
  },

  // ── Health Engine ──────────────────────────────────────────────────────────

  updateHealth(): void {
    const outputHealth = this.outputEngine.health();
    const audioHealth  = this.audioEngine.monitor()[0];
    const routes       = this.routingEngine.getRoutes();
    const clips        = this.replayEngine.getClips();
    const scene        = this.sceneGraph.getCurrentScene();

    this.healthEngine.updateMetric('output', {
      warning: (outputHealth.droppedFrames ?? 0) > 1,
      error:   (outputHealth.latency ?? 0) > 30,
      value:   `${(outputHealth.latency ?? 0).toFixed(1)} ms · ${outputHealth.droppedFrames ?? 0} dropped`,
    });

    this.healthEngine.updateMetric('audio', {
      warning: (audioHealth?.peak ?? 0) > 0.8,
      error:   (audioHealth?.peak ?? 0) > 0.95,
      value:   audioHealth ? `peak ${audioHealth.peak.toFixed(2)}` : 'no sources',
    });

    this.healthEngine.updateMetric('routing', {
      warning: routes.length === 0,
      error:   false,
      value:   `${routes.length} route${routes.length !== 1 ? 's' : ''}`,
    });

    this.healthEngine.updateMetric('replay', {
      warning: clips.length > 10,
      error:   false,
      value:   `${clips.length} clip${clips.length !== 1 ? 's' : ''}`,
    });

    this.healthEngine.updateMetric('graphics', {
      warning: !scene,
      error:   false,
      value:   scene ? `${(scene.layers?.filter((l) => l.type === 'graphics').length ?? 0)} graphics layers` : 'no scene',
    });

    this.healthEngine.updateMetric('scene', {
      warning: !scene,
      error:   false,
      value:   scene ? scene.name : 'none',
    });

    this.healthEngine.updateMetric('automation', {
      warning: this.automationEngine.getTriggers().length === 0,
      error:   false,
      value:   `${this.automationEngine.enabledTriggerCount} active triggers`,
    });

    this.healthEngine.updateMetric('ai', {
      warning: this.aiCrewEngine.insightCount === 0,
      error:   false,
      value:   `${this.aiCrewEngine.insightCount} insights`,
    });
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
