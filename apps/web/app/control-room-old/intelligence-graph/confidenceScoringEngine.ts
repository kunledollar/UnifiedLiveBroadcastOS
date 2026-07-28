/**
 * Confidence Scoring Engine (CSE) — Step 84
 *
 * Assigns, adjusts, and propagates confidence across UIG events, nodes,
 * edges, insights, warnings, and predictions.
 *
 * Phase 1 formula:
 *   confidence =
 *     engineWeight
 *     * frequencyWeight
 *     * consistencyWeight
 *     * recencyWeight
 *     * crossEngineWeight
 *     * workspaceWeight
 *     * operatorWeight
 *     * priorWeight          (UENL / emitter prior)
 *
 * Also provides:
 *   - temporal smoothing (EMA per event id)
 *   - edge confidence weighting
 *   - insight confidence refinement
 *   - noise filtering
 *   - workspace / graph stability scoring
 */

import type {
  CanonicalUigEvent,
} from './uigEventNormalizer.js';
import type { InferenceResult } from './uigInferenceEngine.js';
import type {
  UBOSIntelligenceGraph,
  UigEdge,
  UigNode,
} from './ubosIntelligenceGraph.js';

export type ConfidenceBreakdown = {
  engineWeight: number;
  frequencyWeight: number;
  consistencyWeight: number;
  recencyWeight: number;
  crossEngineWeight: number;
  workspaceWeight: number;
  operatorWeight: number;
  priorWeight: number;
  raw: number;
  smoothed: number;
};

export type ScoreableEvent = {
  id?: string;
  type: string;
  source: string;
  workspace?: string | null | undefined;
  operator?: string | null | undefined;
  timestamp?: number;
  confidence?: number;
  /** Node category when scoring from a graph node. */
  nodeType?: string;
};

const NOISE_THRESHOLD = 0.35;
const EMA_ALPHA = 0.6;

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function sourceFamily(source: string): string {
  const s = source.toLowerCase();
  if (s.includes('scene')) return 'scene';
  if (s.includes('graphics')) return 'graphics';
  if (s.includes('audio')) return 'audio';
  if (s.includes('replay')) return 'replay';
  if (s.includes('routing')) return 'routing';
  if (s.includes('output')) return 'output';
  if (s.includes('automation')) return 'automation';
  if (s.includes('ai') || s.includes('crew')) return 'ai';
  if (s.includes('health')) return 'health';
  if (s.includes('multi-user') || s.includes('operator')) return 'operator';
  if (s.includes('federation') || s.includes('cloud') || s.includes('network')) return 'system';
  return 'unknown';
}

function eventFamily(type: string): string {
  const t = type.toLowerCase();
  const dot = t.indexOf('.');
  if (dot > 0) return t.slice(0, dot);
  if (t.endsWith('node')) return t.replace(/node$/i, '');
  return t;
}

export class ConfidenceScoringEngine {
  private readonly graph: UBOSIntelligenceGraph;

  /** Cumulative sightings per canonical/event type. */
  private readonly typeCounts = new Map<string, number>();
  /** Recent timestamps per type for consistency/stability. */
  private readonly typeTimestamps = new Map<string, number[]>();
  /** EMA state per event id. */
  private readonly smoothedById = new Map<string, number>();
  /** Last full breakdown for debugging / UI. */
  lastBreakdown: ConfidenceBreakdown | null = null;

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  score(event: ScoreableEvent): number {
    const breakdown = this.scoreDetailed(event);
    this.lastBreakdown = breakdown;
    return breakdown.smoothed;
  }

  scoreDetailed(event: ScoreableEvent): ConfidenceBreakdown {
    const type = event.type;
    const timestamp = event.timestamp ?? Date.now();

    this.recordSighting(type, timestamp);

    const engineWeight = this.engineReliability(event.source);
    const frequencyWeight = this.frequency(type);
    const consistencyWeight = this.consistency(type);
    const recencyWeight = this.recency(timestamp);
    const crossEngineWeight = this.crossEngineAgreement(event);
    const workspaceWeight = this.workspaceRelevance(event.workspace);
    const operatorWeight = this.operatorRelevance(event.operator);
    const priorWeight =
      typeof event.confidence === 'number'
        ? clamp(0.5 + 0.5 * event.confidence)
        : 1;

    // Geometric mean of Phase 1 weights — preserves ranking of the product
    // formula while avoiding near-zero collapse from many mid-range factors.
    const factors = [
      engineWeight,
      frequencyWeight,
      consistencyWeight,
      recencyWeight,
      crossEngineWeight,
      workspaceWeight,
      operatorWeight,
      priorWeight,
    ];
    const logSum = factors.reduce((sum, f) => sum + Math.log(Math.max(f, 1e-6)), 0);
    const raw = clamp(Math.exp(logSum / factors.length));

    const smoothed = event.id
      ? this.smooth(event.id, raw)
      : raw;

    return {
      engineWeight,
      frequencyWeight,
      consistencyWeight,
      recencyWeight,
      crossEngineWeight,
      workspaceWeight,
      operatorWeight,
      priorWeight,
      raw,
      smoothed,
    };
  }

  /** Re-score a canonical event in place and return it. */
  applyToEvent(event: CanonicalUigEvent): CanonicalUigEvent {
    const confidence = this.score({
      id: event.id,
      type: event.type,
      source: event.source,
      workspace: event.workspace,
      operator: event.operator,
      timestamp: event.timestamp,
      confidence: event.confidence,
    });
    return { ...event, confidence };
  }

  /**
   * Propagate CSE confidence onto a node (and stash breakdown attrs).
   * Pass `precomputed` when the event was already scored to avoid double frequency counting.
   */
  applyToNode(node: UigNode, precomputed?: number): UigNode {
    const confidence =
      typeof precomputed === 'number'
        ? clamp(precomputed)
        : this.score({
            id: node.id,
            type: node.eventType ?? node.type,
            source: node.source ?? String(node.attributes.engine_source ?? 'unknown'),
            workspace: node.workspace,
            operator: node.operator,
            timestamp: node.timestamp,
            confidence: node.confidence,
            nodeType: node.type,
          });
    return {
      ...node,
      confidence,
      attributes: {
        ...node.attributes,
        cse_confidence: confidence,
      },
    };
  }

  /** Edge weight × endpoint confidence geometric mean. */
  scoreEdge(edge: UigEdge, from?: UigNode, to?: UigNode): number {
    const fromC = from?.confidence ?? 0.7;
    const toC = to?.confidence ?? 0.7;
    const structural = clamp(edge.weight);
    return clamp(Math.sqrt(fromC * toC) * (0.5 + 0.5 * structural));
  }

  applyToEdge(edge: UigEdge): UigEdge {
    const from = this.graph.nodes.get(edge.from);
    const to = this.graph.nodes.get(edge.to);
    const confidence = this.scoreEdge(edge, from, to);
    return {
      ...edge,
      weight: confidence,
      confidence,
    };
  }

  /** Refine inference result confidence with CSE context + noise gate. */
  refineInsight(result: InferenceResult): InferenceResult | null {
    const node = result.nodeId ? this.graph.nodes.get(result.nodeId) : undefined;
    const nodeConfidence = node?.confidence ?? 0.7;
    const stability = this.stabilityScore();
    const kindBoost =
      result.kind === 'warning' || result.kind === 'guidance' ? 1.05 :
      result.kind === 'prediction' ? 0.95 :
      1;
    // Temporal Pattern Engine boosts (Step 85)
    const temporalBoost =
      node?.anomaly || node?.spike ? 1.08 :
      node?.drop ? 1.05 :
      node?.trend === 'volatile' ? 0.95 :
      node?.trend === 'stable' ? 1.02 :
      1;

    const refined = clamp(
      result.confidence *
        (0.55 + 0.45 * nodeConfidence) *
        (0.7 + 0.3 * stability) *
        kindBoost *
        temporalBoost,
    );

    // Drop only weak predictions that were already low-confidence before refine
    if (
      result.kind === 'prediction' &&
      this.isNoise(refined) &&
      result.confidence < 0.55
    ) {
      return null;
    }

    return { ...result, confidence: refined };
  }

  isNoise(confidence: number): boolean {
    return confidence < NOISE_THRESHOLD;
  }

  /** 0–1 stability of recent event confidence / consistency. */
  stabilityScore(): number {
    const nodes = [...this.graph.nodes.values()];
    if (nodes.length === 0) return 0.5;

    const avg =
      nodes.reduce((sum, n) => sum + n.confidence, 0) / nodes.length;

    let consistentTypes = 0;
    let typed = 0;
    const seen = new Set<string>();
    for (const node of nodes) {
      const key = node.eventType ?? node.type;
      if (seen.has(key)) continue;
      seen.add(key);
      typed += 1;
      if (this.consistency(key) >= 0.75) consistentTypes += 1;
    }

    const consistencyRatio = typed > 0 ? consistentTypes / typed : 0.5;
    return clamp(0.5 * avg + 0.5 * consistencyRatio);
  }

  engineReliability(source: string): number {
    const weights: Record<string, number> = {
      scene: 0.95,
      graphics: 0.75,
      audio: 0.9,
      replay: 0.7,
      routing: 0.8,
      output: 0.9,
      automation: 0.75,
      ai: 0.6,
      health: 0.95,
      operator: 0.85,
      system: 0.7,
      unknown: 0.5,
    };
    return weights[sourceFamily(source)] ?? 0.5;
  }

  frequency(type: string): number {
    const count = this.typeCounts.get(type) ?? 0;
    // Floor at 0.5 so first sightings are usable; saturates by ~10 repeats
    return Math.min(1.0, 0.5 + count / 20);
  }

  consistency(type: string): number {
    const stamps = this.typeTimestamps.get(type) ?? [];
    if (stamps.length < 2) return 0.5;

    // Regular cadence → higher consistency; erratic gaps → lower
    const gaps: number[] = [];
    for (let i = 1; i < stamps.length; i++) {
      gaps.push((stamps[i] ?? 0) - (stamps[i - 1] ?? 0));
    }
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (mean <= 0) return 0.5;
    const variance =
      gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length;
    const cv = Math.sqrt(variance) / mean;
    if (cv < 0.5) return 0.9;
    if (cv < 1.5) return 0.8;
    return 0.6;
  }

  recency(timestamp: number): number {
    const age = Date.now() - timestamp;
    if (age < 1000) return 1.0;
    if (age < 5000) return 0.8;
    if (age < 15_000) return 0.65;
    return 0.5;
  }

  crossEngineAgreement(event: ScoreableEvent): number {
    const family = eventFamily(event.type);
    const source = sourceFamily(event.source);
    const related = [...this.graph.nodes.values()].filter((n) => {
      const nFamily = eventFamily(n.eventType ?? n.type);
      const nSource = sourceFamily(String(n.source ?? n.attributes.engine_source ?? ''));
      return nFamily === family && nSource !== source;
    });
    if (related.length >= 2) return 0.95;
    if (related.length > 0) return 0.9;
    return 0.6;
  }

  workspaceRelevance(workspace: string | null | undefined): number {
    if (!workspace) return 0.7;
    const active = this.graph.normalizer.getContext().workspace;
    if (active && workspace === active) return 1.0;
    return 0.9;
  }

  operatorRelevance(operator: string | null | undefined): number {
    return operator ? 1.0 : 0.8;
  }

  reset(): void {
    this.typeCounts.clear();
    this.typeTimestamps.clear();
    this.smoothedById.clear();
    this.lastBreakdown = null;
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private recordSighting(type: string, timestamp: number): void {
    this.typeCounts.set(type, (this.typeCounts.get(type) ?? 0) + 1);
    const stamps = this.typeTimestamps.get(type) ?? [];
    stamps.push(timestamp);
    // Keep last 20 timestamps per type
    this.typeTimestamps.set(type, stamps.slice(-20));
  }

  private smooth(id: string, next: number): number {
    const prev = this.smoothedById.get(id);
    if (prev === undefined) {
      this.smoothedById.set(id, next);
      return next;
    }
    const smoothed = clamp(prev * (1 - EMA_ALPHA) + next * EMA_ALPHA);
    this.smoothedById.set(id, smoothed);
    return smoothed;
  }
}
