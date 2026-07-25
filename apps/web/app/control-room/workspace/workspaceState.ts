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
import { MultiUserEngine } from '../multi-user-engine/multiUserEngine';
import { SecurityEngine } from '../security-engine/securityEngine';
import { NetworkEngine } from '../network-engine/networkEngine';
import { CloudEngine } from '../cloud-engine/cloudEngine';
import { VirtualizationEngine } from '../virtualization-engine/virtualizationEngine';
import { ContainerEngine } from '../container-engine/containerEngine';
import { FederationEngine } from '../federation-engine/federationEngine';
import { UBOSIntelligenceGraph, type UigEvent } from '../intelligence-graph/ubosIntelligenceGraph';

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
  multiUserEngine:      new MultiUserEngine(),
  securityEngine:       new SecurityEngine(),
  networkEngine:        new NetworkEngine(),
  cloudEngine:             new CloudEngine(),
  virtualizationEngine:    new VirtualizationEngine(),
  containerEngine:         new ContainerEngine(),
  federationEngine:        new FederationEngine(),
  intelligenceGraph:       new UBOSIntelligenceGraph(),

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

  // ── Multi-User Engine ─────────────────────────────────────────────────────

  addOperator(user: Parameters<typeof this.multiUserEngine.addUser>[0]) {
    return this.multiUserEngine.addUser(user);
  },

  removeOperator(id: string): void {
    this.multiUserEngine.removeUser(id);
  },

  switchOperatorWorkspace(id: string, workspace: string): void {
    this.multiUserEngine.setWorkspace(id, workspace);
  },

  // ── Network Engine ─────────────────────────────────────────────────────────

  connectNetwork(url: string): void {
    this.networkEngine.connect(url);

    // When remote state arrives, merge into local engines
    this.networkEngine.onStateUpdate = (remoteState) => {
      if (remoteState.scenes) {
        this.sceneGraph.setScenes(remoteState.scenes as Parameters<typeof this.sceneGraph.setScenes>[0]);
      }
      if (remoteState.audio) {
        this.audioEngine.setLayers(remoteState.audio as Parameters<typeof this.audioEngine.setLayers>[0]);
      }
    };
  },

  broadcastState(): void {
    this.networkEngine.sendState({
      scenes:  [...this.sceneGraph.getScenes()],
      routing: [...this.routingEngine.getRoutes()],
      audio:   [...this.audioEngine.layers],
      users:   [...this.multiUserEngine.getUsers()],
    });
  },

  disconnectNetwork(): void {
    this.networkEngine.disconnect();
  },

  // ── Cloud Engine ──────────────────────────────────────────────────────────

  uploadToCloud(): void {
    this.cloudEngine.upload('scenes',     [...this.sceneGraph.getScenes()]);
    this.cloudEngine.upload('routing',    [...this.routingEngine.getRoutes()]);
    this.cloudEngine.upload('audio',      [...this.audioEngine.layers]);
    this.cloudEngine.upload('replay',     [...this.replayEngine.getClips()]);
    this.cloudEngine.upload('ai',         [...this.aiCrewEngine.getInsights()]);
    this.cloudEngine.upload('health',     this.healthEngine.getMetrics());
    this.cloudEngine.upload('users',      [...this.multiUserEngine.getUsers()]);
  },

  // ── Virtualization Engine ──────────────────────────────────────────────────

  createVirtualWorkspace(name: string) {
    const template = {
      scenes:    [...this.sceneGraph.getScenes()],
      routing:   [...this.routingEngine.getRoutes()],
      audio:     [...this.audioEngine.layers],
      replay:    [...this.replayEngine.getClips()],
      ai:        [...this.aiCrewEngine.getInsights()],
      health:    this.healthEngine.getMetrics(),
    };
    const env = this.virtualizationEngine.createEnvironment(name, template);
    // Sync to cloud
    this.cloudEngine.upload('virtual_envs', this.virtualizationEngine.listEnvironments());
    return env;
  },

  // ── Container Engine ───────────────────────────────────────────────────────

  createContainer(name: string) {
    const engines = {
      scenes:  [...this.sceneGraph.getScenes()],
      routing: [...this.routingEngine.getRoutes()],
      audio:   [...this.audioEngine.layers],
      replay:  [...this.replayEngine.getClips()],
      health:  this.healthEngine.getMetrics(),
    };
    const container = this.containerEngine.createContainer(name, engines);
    this.cloudEngine.upload('containers', this.containerEngine.listContainers());
    return container;
  },

  stopContainer(id: number): void {
    this.containerEngine.stopContainer(id);
  },

  deleteContainer(id: number): void {
    this.containerEngine.deleteContainer(id);
    this.cloudEngine.upload('containers', this.containerEngine.listContainers());
  },

  // ── Federation Engine ──────────────────────────────────────────────────────

  registerCluster(cluster: Parameters<typeof this.federationEngine.registerCluster>[0]) {
    const c = this.federationEngine.registerCluster(cluster);
    this.cloudEngine.upload('federation', {
      clusters: this.federationEngine.getClusters(),
      links:    this.federationEngine.getLinks(),
    });
    return c;
  },

  linkClusters(from: string | number, to: string | number, latencyMs?: number) {
    return this.federationEngine.linkClusters(from, to, latencyMs);
  },

  deleteVirtualWorkspace(id: number): void {
    this.virtualizationEngine.deleteEnvironment(id);
    this.cloudEngine.upload('virtual_envs', this.virtualizationEngine.listEnvironments());
  },

  downloadFromCloud(): void {
    const scenes = this.cloudEngine.download('scenes');
    if (scenes) this.sceneGraph.setScenes(scenes as Parameters<typeof this.sceneGraph.setScenes>[0]);
    const audio = this.cloudEngine.download('audio');
    if (audio) this.audioEngine.setLayers(audio as Parameters<typeof this.audioEngine.setLayers>[0]);
  },

  /** Check whether the operator with the given id can perform the action. */
  authorize(userId: string, permission: import('../security-engine/securityEngine').Permission | string): boolean {
    const user = this.multiUserEngine.getUsers().find((u) => u.id === userId);
    if (!user) return false;
    return this.securityEngine.authorize({ name: user.name, role: user.role }, permission);
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
      securityEngine:    this.securityEngine,
      multiUserEngine:   this.multiUserEngine,
      cloudEngine:       this.cloudEngine,
      intelligenceGraph: this.intelligenceGraph,
      automationContext: this as unknown as import('../automation-engine/automationEngine').AutomationContext,
    });
    this.orchestrationEngine.start();
  },

  // ── Intelligence Graph (UIG) ───────────────────────────────────────────────

  /** Push a raw engine signal into the live knowledge graph. */
  ingestIntelligence(event: UigEvent) {
    return this.intelligenceGraph.ingest(event);
  },

  /**
   * Snapshot all active engines into UIG nodes/edges and run inference.
   * Called from the orchestration tick and Intelligence Graph zone.
   */
  refreshIntelligenceGraph(): void {
    const scene = this.sceneGraph.getCurrentScene();
    const routes = this.routingEngine.getActiveRoutes();
    const clips = this.replayEngine.getClips();
    const audioHealth = this.audioEngine.monitor();
    const outputHealth = this.outputEngine.health();
    const health = this.healthEngine.getHealth();
    const triggers = this.automationEngine.getTriggers();
    const graphicsLayers = (scene?.layers ?? []).filter((l) => l.type === 'graphics');
    const operator = this.multiUserEngine.getUsers()[0];

    // UENL context — workspace/operator lineage for every normalized event
    this.intelligenceGraph.setContext({
      workspace: null,
      operator: operator?.name ?? null,
      system: 'ubos-control-room',
    });

    const dropped = outputHealth.droppedFrames ?? 0;
    const events: UigEvent[] = [
      {
        id: 'scene:current',
        type: !scene ? 'scene.missing_source' : 'scene.active',
        source: 'scene-graph',
        payload: {
          name: scene?.name ?? null,
          missing: !scene,
          program: true,
          layerIds: (scene?.layers ?? []).map((l) => l.id),
        },
      },
      {
        id: 'output:program',
        type: dropped > 0 ? 'output.frame_drop' : 'output.health_update',
        source: 'output-engine',
        payload: {
          droppedFrames: dropped,
          latency: outputHealth.latency ?? 0,
        },
      },
      ...graphicsLayers.map((layer): UigEvent => ({
        id: `graphics:${layer.id}`,
        type: 'graphics.active',
        source: 'scene-graph',
        payload: {
          name: layer.name ?? layer.id,
          sceneId: scene?.id,
          visible: true,
        },
      })),
      ...audioHealth.slice(0, 8).map((ch): UigEvent => ({
        id: `audio:${ch.id}`,
        type: 'audio.level',
        source: 'audio-engine',
        payload: {
          peak: ch.peak,
          rms: ch.rms,
          health: ch.health,
        },
      })),
      ...[...clips].slice(-6).map((clip): UigEvent => ({
        id: `replay:${clip.id}`,
        type: 'replay.clip_created',
        source: 'replay-engine',
        payload: {
          cameraId: clip.cameraId,
          start: clip.start,
          end: clip.end,
        },
      })),
      ...[...routes].slice(0, 12).map((route): UigEvent => ({
        id: `routing:${route.id}`,
        type: route.active === false ? 'routing.destination_error' : 'routing.path_change',
        source: 'routing-engine',
        payload: {
          source: route.source,
          destination: route.destination,
          active: route.active,
          broken: route.active === false,
        },
      })),
      ...triggers.slice(0, 8).map((trigger): UigEvent => ({
        id: `automation:${trigger.id}`,
        type: 'automation.trigger_fired',
        source: 'automation-engine',
        payload: {
          name: trigger.name,
          enabled: trigger.enabled,
          runCount: trigger.runCount,
        },
      })),
      ...Object.entries(health).map(([subsystem, status]): UigEvent => ({
        id: `health:${subsystem}`,
        type:
          status === 'ok' ? 'system.healthy' :
          status === 'unknown' ? 'system.unknown' :
          'system.degraded',
        source: 'health-engine',
        payload: { subsystem, status },
      })),
      ...this.aiCrewEngine.getInsights().slice(-5).map((insight): UigEvent => ({
        id: `ai:${insight.id}`,
        type: 'ai.insight',
        source: 'ai-crew',
        payload: {
          message: insight.message,
          severity: insight.severity,
          insight_type: insight.type,
          suggestion: insight.suggestion,
        },
        confidence: insight.severity === 'critical' ? 0.95 : insight.severity === 'warning' ? 0.8 : 0.7,
      })),
    ];

    this.intelligenceGraph.ingestBatch(events);
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
