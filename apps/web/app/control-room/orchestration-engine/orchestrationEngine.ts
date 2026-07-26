/**
 * UBOS Orchestration Engine — Step 70
 *
 * The global coordination engine that runs a tick loop and synchronizes
 * all UBOS engines in the correct dependency order:
 *
 *   1. Automation  (may mutate scene, routing, audio)
 *   2. Graphics    (derives from scene layers)
 *   3. Audio       (mixes active layers)
 *   4. Replay      (reads camera buffers)
 *   5. Routing     (resolves signal paths)
 *   6. Output      (composes final frame)
 *   7. AI Crew     (observes everything, produces insights)
 *
 * The tick loop runs at 100 ms intervals (10 Hz) — sufficient for
 * metadata synchronization without overloading the main thread.
 * Real media (video, audio DSP) runs on dedicated workers in later steps.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - priority-queue based scheduling
 *   - multi-threaded engine dispatch
 *   - GPU scheduling hooks
 *   - AI-driven orchestration optimization
 *   - event graph (instead of polling)
 */

import type { SceneGraphEngine } from '../scene-graph/sceneGraphEngine';
import type { ReplayEngine } from '../replay-engine/replayEngine';
import type { RoutingEngine } from '../routing-engine/routingEngine';
import type { AudioEngine } from '../audio-engine/audioEngine';
import type { AutomationEngine, AutomationContext } from '../automation-engine/automationEngine';
import type { OutputEngine } from '../output-engine/outputEngine';
import type { AiCrewEngine } from '../ai-crew-engine/aiCrewEngine';
import type { HealthEngine } from '../health-engine/healthEngine';
import type { PersistenceEngine } from '../persistence-engine/persistenceEngine';
import type { SecurityEngine } from '../security-engine/securityEngine';
import type { MultiUserEngine } from '../multi-user-engine/multiUserEngine';
import type { CloudEngine } from '../cloud-engine/cloudEngine';
import type { UBOSIntelligenceGraph, UigEvent } from '../intelligence-graph/ubosIntelligenceGraph';

export type OrchestrationEngines = {
  sceneGraph:       SceneGraphEngine;
  replayEngine:     ReplayEngine;
  routingEngine:    RoutingEngine;
  audioEngine:      AudioEngine;
  automationEngine: AutomationEngine;
  outputEngine:     OutputEngine;
  aiCrewEngine:     AiCrewEngine;
  healthEngine:        HealthEngine;
  persistenceEngine:   PersistenceEngine;
  securityEngine:      SecurityEngine;
  multiUserEngine:     MultiUserEngine;
  cloudEngine:         CloudEngine;
  intelligenceGraph:   UBOSIntelligenceGraph;
  /** Loose context passed to automation (the full workspaceState). */
  automationContext: AutomationContext;
};

export type OrchestrationStats = {
  tickCount: number;
  lastTickMs: number;
  avgTickDurationMs: number;
};

export class OrchestrationEngine {
  private engines:       OrchestrationEngines;
  private tickInterval:  ReturnType<typeof setInterval> | null = null;
  private tickCount      = 0;
  private totalDuration  = 0;
  private lastTickMs     = 0;
  readonly tickRateMs:   number;

  constructor(engines: OrchestrationEngines, tickRateMs = 100) {
    this.engines    = engines;
    this.tickRateMs = tickRateMs;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  start(): void {
    if (this.tickInterval !== null) return; // already running
    this.tickInterval = setInterval(() => this.tick(), this.tickRateMs);
  }

  stop(): void {
    if (this.tickInterval !== null) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  get isRunning(): boolean { return this.tickInterval !== null; }

  // ── Tick ──────────────────────────────────────────────────────────────────

  tick(): void {
    const start = performance.now();

    const {
      sceneGraph,
      replayEngine,
      routingEngine,
      audioEngine,
      automationEngine,
      outputEngine,
      aiCrewEngine,
      automationContext,
    } = this.engines;

    try {
      // 1. Automation first — may change scene, routing, audio
      automationEngine.evaluate(automationContext);

      // 2. Audio mix
      const audioMix = audioEngine.mix();

      // 3. Replay clip + marker snapshot
      const clips = replayEngine.getClips();

      // 4. Routing snapshot
      const routes = routingEngine.getActiveRoutes();

      // 5. Scene snapshot
      const scene = sceneGraph.getCurrentScene();

      // 6. Output composition
      const videoSources: Record<string, { id: string; name?: string; type?: string }> = {};
      if (scene) videoSources[scene.id] = { id: scene.id, name: scene.name, type: 'scene' };

      const graphicsFrames = (scene?.layers ?? [])
        .filter((l) => l.type === 'graphics')
        .map((l) => ({ id: l.id, type: l.type, name: l.name ?? l.id, visible: true }));

      outputEngine.setVideoSources(videoSources);
      outputEngine.setGraphicsFrames(graphicsFrames);
      outputEngine.setAudioMix(audioMix);

      // 7. AI Crew observes all engines
      const audioHealth = audioEngine.monitor();
      const outputHealth = outputEngine.health();

      aiCrewEngine.analyzeScene(scene);
      aiCrewEngine.analyzeGraphics(graphicsFrames);
      aiCrewEngine.analyzeReplay([...clips]);
      aiCrewEngine.analyzeAudio(audioHealth[0] ?? null);
      aiCrewEngine.analyzeRouting([...routes]);
      aiCrewEngine.analyzeOutput(outputHealth);

      // 8. Health update — continuous safety monitoring
      const { healthEngine } = this.engines;
      healthEngine.updateMetric('output',     { warning: (outputHealth.droppedFrames ?? 0) > 1, error: (outputHealth.latency ?? 0) > 30 });
      healthEngine.updateMetric('audio',      { warning: (audioHealth[0]?.peak ?? 0) > 0.8, error: (audioHealth[0]?.peak ?? 0) > 0.95 });
      healthEngine.updateMetric('routing',    { warning: routes.length === 0, error: false });
      healthEngine.updateMetric('replay',     { warning: clips.length > 10, error: false });
      healthEngine.updateMetric('scene',      { warning: !scene, error: false });
      healthEngine.updateMetric('automation', { warning: false, error: false });
      healthEngine.updateMetric('ai',         { warning: aiCrewEngine.insightCount === 0, error: false });
      healthEngine.updateMetric('graphics',   { warning: graphicsFrames.length === 0, error: false });

      // 9. Autosave health metrics to persistence store
      this.engines.persistenceEngine.save('health', healthEngine.getMetrics());

      // 10. Security — heartbeat check for all active operators
      for (const user of this.engines.multiUserEngine.getUsers()) {
        this.engines.securityEngine.authorize({ name: user.name, role: user.role }, 'heartbeat');
      }

      // 11. Cloud sync — every 10 ticks (approx 1 Hz) to limit serialization cost
      if (this.tickCount % 10 === 0) {
        this.engines.cloudEngine.syncAll({
          scenes:  [...sceneGraph.getScenes()],
          routing: [...routes],
          audio:   [...audioMix],
          health:  healthEngine.getMetrics(),
        });
      }

      // 12. Intelligence Graph — ingest engine signals into the live knowledge model
      const graphicsLayerIds = graphicsFrames.map((f) => f.id);
      const uigEvents: UigEvent[] = [
        {
          id: 'scene:current',
          type: 'SceneNode',
          source: 'scene-graph',
          payload: {
            name: scene?.name ?? null,
            missing: !scene,
            program: true,
            layerIds: graphicsLayerIds,
          },
        },
        {
          id: 'output:program',
          type: 'OutputNode',
          source: 'output-engine',
          payload: {
            droppedFrames: outputHealth.droppedFrames ?? 0,
            latency: outputHealth.latency ?? 0,
          },
        },
        ...graphicsFrames.map((frame): UigEvent => ({
          id: `graphics:${frame.id}`,
          type: 'GraphicsNode',
          source: 'scene-graph',
          payload: { name: frame.name, sceneId: scene?.id, visible: frame.visible },
        })),
        ...(audioHealth[0]
          ? [{
              id: 'audio:mix',
              type: 'AudioNode' as const,
              source: 'audio-engine',
              payload: { peak: audioHealth[0].peak, rms: audioHealth[0].rms, health: audioHealth[0].health },
            }]
          : []),
        ...[...clips].slice(-4).map((clip): UigEvent => ({
          id: `replay:${clip.id}`,
          type: 'ReplayNode',
          source: 'replay-engine',
          payload: { cameraId: clip.cameraId, start: clip.start, end: clip.end },
        })),
        ...[...routes].slice(0, 8).map((route): UigEvent => ({
          id: `routing:${route.id}`,
          type: 'RoutingNode',
          source: 'routing-engine',
          payload: {
            source: route.source,
            destination: route.destination,
            active: route.active,
            broken: route.active === false,
          },
        })),
        ...Object.entries(healthEngine.getHealth()).map(([subsystem, status]): UigEvent => ({
          id: `health:${subsystem}`,
          type: 'HealthNode',
          source: 'health-engine',
          payload: { subsystem, status },
        })),
      ];
      this.engines.intelligenceGraph.ingestBatch(uigEvents);

    } catch (err) {
      console.warn('[OrchestrationEngine] tick error:', err);
    }

    const duration = performance.now() - start;
    this.tickCount++;
    this.totalDuration += duration;
    this.lastTickMs = duration;
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats(): OrchestrationStats {
    return {
      tickCount:          this.tickCount,
      lastTickMs:         this.lastTickMs,
      avgTickDurationMs:  this.tickCount > 0 ? this.totalDuration / this.tickCount : 0,
    };
  }
}
