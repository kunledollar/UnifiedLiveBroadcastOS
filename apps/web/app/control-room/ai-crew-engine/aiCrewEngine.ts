/**
 * UBOS AI Crew Engine — Step 69
 *
 * The intelligence engine that observes all other UBOS engines and
 * produces real-time insights, risk flags, and action suggestions.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - AI Director (scene switching recommendations)
 *   - AI Graphics Operator (layer and template suggestions)
 *   - AI Replay Operator (highlight moment detection)
 *   - AI Audio Engineer (clipping/noise/gain recommendations)
 *   - AI Moderator (toxicity detection, sentiment analysis)
 *   - AI Automation Assistant (trigger suggestions)
 *   - AI Output Optimizer (latency/quality recommendations)
 */

export type InsightType =
  | 'scene'
  | 'graphics'
  | 'replay'
  | 'audio'
  | 'routing'
  | 'output'
  | 'moderation'
  | 'automation'
  | 'system';

export type InsightSeverity = 'info' | 'warning' | 'critical';

export type AiInsight = {
  id: number;
  type: InsightType;
  severity: InsightSeverity;
  message: string;
  timestamp: number;
  /** Optional suggested action label. */
  suggestion?: string;
};

type AnalysisInput<T> = T | null | undefined;

export class AiCrewEngine {
  private insights: AiInsight[] = [];
  private readonly MAX_INSIGHTS = 50;

  private push(
    type: InsightType,
    message: string,
    severity: InsightSeverity = 'info',
    suggestion?: string,
  ): void {
    const insight: AiInsight = {
      id: Date.now() + this.insights.length,
      type,
      severity,
      message,
      timestamp: Date.now(),
      ...(suggestion ? { suggestion } : {}),
    };
    this.insights.push(insight);
    // Keep only the most recent MAX_INSIGHTS entries
    if (this.insights.length > this.MAX_INSIGHTS) {
      this.insights = this.insights.slice(-this.MAX_INSIGHTS);
    }
  }

  // ── Analysis methods ──────────────────────────────────────────────────────

  analyzeScene(scene: AnalysisInput<{ name: string; layers?: unknown[] }>): void {
    if (!scene) {
      this.push('scene', 'No active scene — consider loading a scene', 'warning', 'Load a scene');
      return;
    }
    const layerCount = scene.layers?.length ?? 0;
    this.push(
      'scene',
      `Scene "${scene.name}" has ${layerCount} layer${layerCount !== 1 ? 's' : ''}`,
      layerCount === 0 ? 'warning' : 'info',
      layerCount === 0 ? 'Add layers to scene' : undefined,
    );
  }

  analyzeGraphics(frames: AnalysisInput<unknown[]>): void {
    const count = frames?.length ?? 0;
    this.push(
      'graphics',
      `${count} graphics frame${count !== 1 ? 's' : ''} in pipeline`,
      'info',
    );
  }

  analyzeReplay(clips: AnalysisInput<unknown[]>): void {
    const count = clips?.length ?? 0;
    this.push(
      'replay',
      `${count} replay clip${count !== 1 ? 's' : ''} available`,
      count > 5 ? 'warning' : 'info',
      count > 5 ? 'Review and clear old clips' : undefined,
    );
  }

  analyzeAudio(
    audioHealth: AnalysisInput<{ id?: string; peak?: number; rms?: number; health?: string }>,
  ): void {
    if (!audioHealth) {
      this.push('audio', 'No audio sources registered', 'warning');
      return;
    }
    const peak = audioHealth.peak ?? 0;
    this.push(
      'audio',
      `Audio peak: ${peak.toFixed(2)} — ${audioHealth.health ?? 'ok'}`,
      peak > 0.9 ? 'critical' : peak > 0.8 ? 'warning' : 'info',
      peak > 0.9 ? 'Reduce gain to prevent clipping' : undefined,
    );
  }

  analyzeRouting(routes: AnalysisInput<unknown[]>): void {
    const count = routes?.length ?? 0;
    this.push('routing', `${count} active route${count !== 1 ? 's' : ''}`, 'info');
  }

  analyzeOutput(
    outputHealth: AnalysisInput<{ droppedFrames?: number; latency?: number; healthy?: boolean }>,
  ): void {
    if (!outputHealth) return;
    const dropped = outputHealth.droppedFrames ?? 0;
    const latency  = outputHealth.latency ?? 0;
    this.push(
      'output',
      `Output latency: ${latency.toFixed(1)} ms — ${dropped} dropped frame${dropped !== 1 ? 's' : ''}`,
      dropped > 0 ? 'warning' : latency > 16 ? 'warning' : 'info',
      dropped > 0 ? 'Check output encoding settings' : undefined,
    );
  }

  analyzeModeration(queueLength: number): void {
    if (queueLength === 0) return;
    this.push(
      'moderation',
      `${queueLength} item${queueLength !== 1 ? 's' : ''} pending moderation review`,
      queueLength > 5 ? 'critical' : 'warning',
      'Review moderation queue',
    );
  }

  // ── Insight access ────────────────────────────────────────────────────────

  getInsights(): readonly AiInsight[] {
    return this.insights.slice(-20); // last 20 insights
  }

  getInsightsByType(type: InsightType): readonly AiInsight[] {
    return this.insights.filter((i) => i.type === type).slice(-10);
  }

  getCriticalInsights(): readonly AiInsight[] {
    return this.insights.filter((i) => i.severity === 'critical');
  }

  clearInsights(): void {
    this.insights = [];
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get insightCount(): number { return this.insights.length; }
  get hasCritical():  boolean { return this.insights.some((i) => i.severity === 'critical'); }
}
