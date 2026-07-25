/**
 * Predictive Engine (PE) — Step 86 Phase 1
 *
 * Future-thinking layer of UBOS. Forecasts failures, transitions, activations,
 * degradations, operator actions, and automation triggers using:
 *   - temporal trend extrapolation (TPE)
 *   - confidence-weighted scoring (CSE)
 *   - pattern-based rules
 *   - cross-engine prediction fusion
 *
 * Transforms UBOS from reactive understanding into proactive anticipation.
 */

import type { InferenceResult } from './uigInferenceEngine.js';
import type { UBOSIntelligenceGraph, UigNode } from './ubosIntelligenceGraph.js';

export type PredictionCategory =
  | 'scene_transition'
  | 'graphics_activation'
  | 'audio_clipping'
  | 'routing_failure'
  | 'output_degradation'
  | 'operator_action'
  | 'automation_trigger';

export type Prediction = {
  id: string;
  category: PredictionCategory;
  message: string;
  nodeId: string;
  confidence: number;
  relatedNodeIds: string[];
  timestamp: number;
  rule: string;
  factors: {
    temporalTrendWeight: number;
    engineConfidence: number;
    crossEngineAgreement: number;
    operatorRelevance: number;
    workspaceRelevance: number;
    base: number;
  };
};

const DIRECTOR_WORKSPACES = new Set([
  'director',
  'production',
  'production-director',
]);

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function eventFamily(node: UigNode): string {
  const t = (node.eventType ?? node.type).toLowerCase();
  const dot = t.indexOf('.');
  if (dot > 0) return t.slice(0, dot);
  return t.replace(/node$/i, '');
}

function metricRising(node: UigNode): boolean {
  const history = node.history ?? [];
  if (history.length < 2) return node.trend === 'rising';
  const withMetric = history.filter((h) => typeof h.metric === 'number');
  if (withMetric.length >= 2) {
    const first = withMetric[0]?.metric ?? 0;
    const last = withMetric[withMetric.length - 1]?.metric ?? 0;
    return last - first > 0.05 || (first > 0 && (last - first) / first > 0.15);
  }
  return node.trend === 'rising';
}

function metricFalling(node: UigNode): boolean {
  const history = node.history ?? [];
  if (history.length < 2) return node.trend === 'falling';
  const conf = history.map((h) => h.confidence);
  if (conf.length >= 2) {
    const first = conf[0] ?? 0;
    const last = conf[conf.length - 1] ?? 0;
    return first - last > 0.08 || node.trend === 'falling' || node.drop === true;
  }
  return node.trend === 'falling' || node.drop === true;
}

export class PredictiveEngine {
  private readonly graph: UBOSIntelligenceGraph;
  private generation = 0;

  /** Operator workspace visit counts for behavior prediction. */
  private readonly workspaceHits = new Map<string, number>();

  lastPredictions: Prediction[] = [];

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  /** Run Phase 1 forecasts across the live graph. */
  run(): Prediction[] {
    this.generation += 1;
    const now = Date.now();
    const predictions: Prediction[] = [];

    this.recordOperatorActivity();

    for (const node of this.graph.nodes.values()) {
      predictions.push(...this.predict(node, now));
    }

    predictions.push(...this.predictOperatorActions(now));
    predictions.push(...this.fuseCrossEngine(predictions, now));

    // Deduplicate by category+node, keep highest confidence
    const byKey = new Map<string, Prediction>();
    for (const prediction of predictions) {
      const key = `${prediction.category}:${prediction.nodeId}`;
      const existing = byKey.get(key);
      if (!existing || prediction.confidence > existing.confidence) {
        byKey.set(key, prediction);
      }
    }

    this.lastPredictions = [...byKey.values()].sort(
      (a, b) => b.confidence - a.confidence,
    );
    return this.lastPredictions;
  }

  predict(node: UigNode, now = Date.now()): Prediction[] {
    const predictions: Prediction[] = [];
    const eventType = node.eventType ?? '';
    const family = eventFamily(node);
    const context = this.graph.normalizer.getContext();
    const workspace = (node.workspace ?? context.workspace ?? '').toLowerCase();

    // 1. Scene Transition Prediction
    if (node.type === 'SceneNode' || family === 'scene') {
      const inDirector = !workspace || DIRECTOR_WORKSPACES.has(workspace);
      const rising = node.trend === 'rising';
      const changing = this.sceneChangeVelocity() >= 2;
      if (rising || (inDirector && changing)) {
        predictions.push(
          this.buildPrediction(node, {
            category: 'scene_transition',
            message: 'Scene transition likely',
            base: 0.85,
            rule: 'predict.scene_transition',
            now,
            relatedNodeIds: [node.id],
          }),
        );
      }
    }

    // 2. Graphics Activation Prediction
    if (node.type === 'GraphicsNode' || family === 'graphics') {
      if (node.trend === 'rising' || this.isGraphicsReferenced(node)) {
        predictions.push(
          this.buildPrediction(node, {
            category: 'graphics_activation',
            message: 'Graphics activation likely',
            base: 0.8,
            rule: 'predict.graphics_activation',
            now,
            relatedNodeIds: [node.id, 'scene:current'],
          }),
        );
      }
    }

    // 3. Audio Clipping Prediction
    if (node.type === 'AudioNode' || family === 'audio') {
      const peak = typeof node.attributes.peak === 'number' ? node.attributes.peak : 0;
      if (node.trend === 'rising' || metricRising(node) || peak > 0.9) {
        predictions.push(
          this.buildPrediction(node, {
            category: 'audio_clipping',
            message: 'Audio clipping likely',
            base: 0.9,
            rule: 'predict.audio_clipping',
            now,
            relatedNodeIds: [node.id],
          }),
        );
      }
    }

    // 4. Routing Failure Prediction
    if (node.type === 'RoutingNode' || family === 'routing') {
      if (
        node.trend === 'falling' ||
        metricFalling(node) ||
        node.attributes.broken === true ||
        eventType === 'routing.destination_error'
      ) {
        predictions.push(
          this.buildPrediction(node, {
            category: 'routing_failure',
            message: 'Routing failure likely',
            base: 0.88,
            rule: 'predict.routing_failure',
            now,
            relatedNodeIds: [node.id],
          }),
        );
      }
    }

    // 5. Output Degradation Prediction
    if (node.type === 'OutputNode' || family === 'output') {
      const dropped =
        typeof node.attributes.droppedframes === 'number'
          ? node.attributes.droppedframes
          : typeof node.attributes.dropped_frames === 'number'
            ? node.attributes.dropped_frames
            : 0;
      if (node.trend === 'rising' || metricRising(node) || dropped > 1) {
        predictions.push(
          this.buildPrediction(node, {
            category: 'output_degradation',
            message: 'Output degradation likely',
            base: 0.87,
            rule: 'predict.output_degradation',
            now,
            relatedNodeIds: [node.id],
          }),
        );
      }
    }

    // 7. Automation Trigger Prediction
    if (node.type === 'AutomationNode' || family === 'automation') {
      const enabled = node.attributes.enabled !== false;
      const runCount =
        typeof node.attributes.runcount === 'number'
          ? node.attributes.runcount
          : typeof node.attributes.run_count === 'number'
            ? node.attributes.run_count
            : 0;
      if (enabled && (node.trend === 'rising' || runCount > 0 || metricRising(node))) {
        predictions.push(
          this.buildPrediction(node, {
            category: 'automation_trigger',
            message: 'Automation trigger likely',
            base: 0.8,
            rule: 'predict.automation_trigger',
            now,
            relatedNodeIds: [node.id],
          }),
        );
      }
    }

    return predictions;
  }

  computeConfidence(
    node: UigNode,
    base: number,
    crossEngineAgreement = 0.6,
  ): { confidence: number; factors: Prediction['factors'] } {
    const temporalTrendWeight =
      node.trend === 'rising' || node.trend === 'falling' ? 1.0 :
      node.trend === 'volatile' ? 0.85 :
      node.spike || node.drop || node.anomaly ? 0.95 :
      0.7;

    const engineConfidence = clamp01(node.confidence || 0.5);
    const context = this.graph.normalizer.getContext();
    const workspace = node.workspace ?? context.workspace;
    const operator = node.operator ?? context.operator;

    const workspaceRelevance = workspace
      ? workspace === context.workspace ? 1.0 : 0.9
      : 0.7;
    const operatorRelevance = operator ? 1.0 : 0.8;

    const factors = {
      temporalTrendWeight,
      engineConfidence,
      crossEngineAgreement: clamp01(crossEngineAgreement),
      operatorRelevance,
      workspaceRelevance,
      base,
    };

    // Geometric mean of weights × base (stable, ranking-preserving)
    const weights = [
      temporalTrendWeight,
      engineConfidence,
      factors.crossEngineAgreement,
      operatorRelevance,
      workspaceRelevance,
    ];
    const geo = Math.exp(
      weights.reduce((s, w) => s + Math.log(Math.max(w, 1e-6)), 0) / weights.length,
    );
    const confidence = clamp01(base * geo);

    return { confidence, factors };
  }

  /** Convert PE forecasts into UIE-compatible inference results. */
  toInferenceResults(predictions: Prediction[] = this.lastPredictions): InferenceResult[] {
    return predictions.map((prediction) => ({
      id: prediction.id,
      rule: prediction.rule,
      kind: 'prediction' as const,
      message: prediction.message,
      confidence: prediction.confidence,
      nodeId: prediction.nodeId,
      relatedNodeIds: prediction.relatedNodeIds,
      emphasis: 'info' as const,
      timestamp: prediction.timestamp,
    }));
  }

  getPredictions(): readonly Prediction[] {
    return this.lastPredictions;
  }

  getPredictionsByCategory(category: PredictionCategory): readonly Prediction[] {
    return this.lastPredictions.filter((p) => p.category === category);
  }

  reset(): void {
    this.workspaceHits.clear();
    this.lastPredictions = [];
    this.generation = 0;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private buildPrediction(
    node: UigNode,
    opts: {
      category: PredictionCategory;
      message: string;
      base: number;
      rule: string;
      now: number;
      relatedNodeIds: string[];
      crossEngineAgreement?: number;
    },
  ): Prediction {
    const agreement =
      opts.crossEngineAgreement ?? this.estimateCrossEngineAgreement(opts.category);
    const { confidence, factors } = this.computeConfidence(
      node,
      opts.base,
      agreement,
    );
    return {
      id: `${opts.rule}-${node.id}-${this.generation}`,
      category: opts.category,
      message: opts.message,
      nodeId: node.id,
      confidence,
      relatedNodeIds: opts.relatedNodeIds,
      timestamp: opts.now,
      rule: opts.rule,
      factors,
    };
  }

  private estimateCrossEngineAgreement(category: PredictionCategory): number {
    const nodes = [...this.graph.nodes.values()];
    switch (category) {
      case 'scene_transition': {
        const graphicsRising = nodes.some(
          (n) => n.type === 'GraphicsNode' && (n.trend === 'rising' || this.isGraphicsReferenced(n)),
        );
        return graphicsRising ? 0.9 : 0.6;
      }
      case 'audio_clipping': {
        const outputRising = nodes.some(
          (n) => n.type === 'OutputNode' && (n.trend === 'rising' || metricRising(n)),
        );
        return outputRising ? 0.9 : 0.65;
      }
      case 'output_degradation': {
        const routingFalling = nodes.some(
          (n) => n.type === 'RoutingNode' && metricFalling(n),
        );
        const audioHot = nodes.some(
          (n) => n.type === 'AudioNode' && (metricRising(n) || Number(n.attributes.peak ?? 0) > 0.85),
        );
        return routingFalling || audioHot ? 0.92 : 0.65;
      }
      case 'routing_failure': {
        const outputIssue = nodes.some(
          (n) => n.type === 'OutputNode' && (metricRising(n) || Number(n.attributes.droppedframes ?? 0) > 0),
        );
        return outputIssue ? 0.9 : 0.6;
      }
      case 'graphics_activation': {
        const sceneActive = nodes.some(
          (n) => n.type === 'SceneNode' && n.attributes.program === true,
        );
        return sceneActive ? 0.9 : 0.65;
      }
      case 'automation_trigger': {
        const sceneOrRoute = nodes.some(
          (n) =>
            (n.type === 'SceneNode' && n.trend === 'rising') ||
            (n.type === 'RoutingNode' && metricFalling(n)),
        );
        return sceneOrRoute ? 0.88 : 0.6;
      }
      case 'operator_action':
        return 0.75;
      default:
        return 0.6;
    }
  }

  private recordOperatorActivity(): void {
    for (const node of this.graph.nodes.values()) {
      if (node.type !== 'OperatorNode') continue;
      const ws =
        (typeof node.workspace === 'string' && node.workspace) ||
        (typeof node.attributes.workspace === 'string'
          ? node.attributes.workspace
          : null) ||
        this.graph.normalizer.getContext().workspace;
      if (!ws) continue;
      this.workspaceHits.set(ws, (this.workspaceHits.get(ws) ?? 0) + 1);
    }
  }

  private predictOperatorActions(now: number): Prediction[] {
    const predictions: Prediction[] = [];
    let topWorkspace: string | null = null;
    let topHits = 0;
    for (const [ws, hits] of this.workspaceHits) {
      if (hits > topHits) {
        topHits = hits;
        topWorkspace = ws;
      }
    }
    if (!topWorkspace || topHits < 2) return predictions;

    const operator = [...this.graph.nodes.values()].find((n) => n.type === 'OperatorNode');
    const anchor: UigNode = operator ?? {
      id: `workspace:${topWorkspace}`,
      type: 'OperatorNode',
      attributes: { workspace: topWorkspace },
      confidence: 0.8,
      timestamp: now,
      workspace: topWorkspace,
      trend: 'rising',
    };

    predictions.push(
      this.buildPrediction(anchor, {
        category: 'operator_action',
        message: `Operator will activate workspace ${topWorkspace}`,
        base: Math.min(0.9, 0.65 + topHits * 0.05),
        rule: 'predict.operator_action',
        now,
        relatedNodeIds: [anchor.id],
        crossEngineAgreement: 0.75,
      }),
    );
    return predictions;
  }

  private fuseCrossEngine(predictions: Prediction[], now: number): Prediction[] {
    const fused: Prediction[] = [];
    const cats = new Set(predictions.map((p) => p.category));

    // Scene + graphics agreement → boost scene transition already handled via agreement;
    // emit fused system prediction when audio + output both forecast degradation path
    if (cats.has('audio_clipping') && cats.has('output_degradation')) {
      const audio = predictions.find((p) => p.category === 'audio_clipping');
      const output = predictions.find((p) => p.category === 'output_degradation');
      if (audio && output) {
        fused.push({
          id: `predict.fusion-audio-output-${this.generation}`,
          category: 'output_degradation',
          message: 'Output degradation likely',
          nodeId: output.nodeId,
          confidence: clamp01(Math.max(audio.confidence, output.confidence) * 1.05),
          relatedNodeIds: [audio.nodeId, output.nodeId],
          timestamp: now,
          rule: 'predict.fusion_audio_output',
          factors: {
            ...output.factors,
            crossEngineAgreement: 0.95,
            base: 0.9,
          },
        });
      }
    }

    return fused;
  }

  private isGraphicsReferenced(node: UigNode): boolean {
    const scene = this.graph.nodes.get('scene:current');
    if (!scene) return false;
    const layerIds = Array.isArray(scene.attributes.layerids)
      ? (scene.attributes.layerids as string[])
      : Array.isArray(scene.attributes.layerIds)
        ? (scene.attributes.layerIds as string[])
        : [];
    const graphicsId = node.id.replace(/^graphics:/, '');
    return layerIds.includes(graphicsId) || layerIds.includes(node.id);
  }

  private sceneChangeVelocity(): number {
    const scene = this.graph.nodes.get('scene:current');
    const history = scene?.history ?? [];
    if (history.length < 2) return 0;
    const names = history.map((h) => String(h.attributes.name ?? ''));
    let changes = 0;
    for (let i = 1; i < names.length; i++) {
      if (names[i] !== names[i - 1]) changes += 1;
    }
    return changes;
  }
}
