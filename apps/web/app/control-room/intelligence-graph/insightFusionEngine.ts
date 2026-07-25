/**
 * Insight Fusion Engine (IFE) — Step 87
 *
 * Merges inference insights, warnings, predictions, confidence scores, and
 * temporal patterns into a small set of unified operator-facing guidance.
 *
 * Transforms UBOS from "here are 20 separate signals" into
 * "here are the 3 things the operator needs to know right now."
 *
 * Phase 1:
 *   - signal clustering by domain
 *   - merge / conflict resolution
 *   - priority scoring + noise suppression
 *   - workspace / operator relevance
 *   - unified guidance generation
 */

import type { InferenceResult } from './uigInferenceEngine.js';
import type { Prediction } from './predictiveEngine.js';
import type { UBOSIntelligenceGraph } from './ubosIntelligenceGraph.js';

export type FusionSeverity = 'critical' | 'warning' | 'prediction' | 'info';

export type FusionCluster =
  | 'scene'
  | 'graphics'
  | 'audio'
  | 'routing'
  | 'output'
  | 'operator'
  | 'automation'
  | 'system';

export type FusionSignal = {
  id: string;
  nodeId: string | null;
  cluster: FusionCluster;
  severity: FusionSeverity;
  message: string;
  confidence: number;
  rule?: string;
  workspace?: string | null;
  relatedNodeIds: string[];
  timestamp: number;
  source: 'inference' | 'prediction';
};

export type FusedInsight = {
  id: string;
  cluster: FusionCluster;
  nodeId: string | null;
  severity: FusionSeverity;
  message: string;
  confidence: number;
  recommendedAction: string;
  sourceCount: number;
  relatedNodeIds: string[];
  workspace?: string | null;
  timestamp: number;
  /** Distinct source messages that were fused. */
  sources: string[];
};

const NOISE_THRESHOLD = 0.4;
const SEVERITY_ORDER: Record<FusionSeverity, number> = {
  critical: 3,
  warning: 2,
  prediction: 1,
  info: 0,
};

const CLUSTER_ACTIONS: Record<FusionCluster, Record<FusionSeverity, string>> = {
  scene: {
    critical: 'Restore missing sources before going to Program',
    warning: 'Verify scene sources and layers',
    prediction: 'Prepare for upcoming scene transition',
    info: 'Monitor active scene',
  },
  graphics: {
    critical: 'Resolve graphics layer conflict immediately',
    warning: 'Review overlapping graphics layers',
    prediction: 'Prepare graphics activation',
    info: 'Monitor graphics composer',
  },
  audio: {
    critical: 'Reduce gain or enable limiter now',
    warning: 'Check hot audio channels',
    prediction: 'Prepare for audio clipping risk',
    info: 'Monitor audio levels',
  },
  routing: {
    critical: 'Repair or failover broken route',
    warning: 'Inspect routing path health',
    prediction: 'Prepare routing failover',
    info: 'Monitor signal paths',
  },
  output: {
    critical: 'Reduce composition load / check encoder',
    warning: 'Inspect dropped frames and latency',
    prediction: 'Prepare for output degradation',
    info: 'Monitor program output health',
  },
  operator: {
    critical: 'Confirm operator focus workspace',
    warning: 'Align operator attention with active risks',
    prediction: 'Expect operator workspace switch',
    info: 'Monitor operator presence',
  },
  automation: {
    critical: 'Review automation before it fires',
    warning: 'Validate automation conditions',
    prediction: 'Prepare for automation trigger',
    info: 'Monitor automation graph',
  },
  system: {
    critical: 'Investigate system health immediately',
    warning: 'Check affected subsystem',
    prediction: 'Prepare for upcoming change',
    info: 'Monitor system state',
  },
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function uniqueMessages(messages: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const message of messages) {
    const key = message.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(message.trim());
  }
  return out;
}

export class InsightFusionEngine {
  private readonly graph: UBOSIntelligenceGraph;

  fusedInsights: FusedInsight[] = [];

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  fuse(
    insights: InferenceResult[] = this.graph.lastInsights,
    predictions: Prediction[] = this.graph.predictiveEngine.getPredictions() as Prediction[],
  ): FusedInsight[] {
    const signals = [
      ...insights.map((s) => this.fromInference(s)),
      ...predictions.map((p) => this.fromPrediction(p)),
    ];

    // Rule 6 — Suppress noise
    let filtered = signals.filter((s) => s.confidence >= NOISE_THRESHOLD);

    // Rule 5 — Workspace relevance boost / soft filter
    filtered = filtered.map((s) => this.applyWorkspaceRelevance(s));

    // Cluster by domain (Clusters 1–7)
    const byCluster = this.groupByCluster(filtered);

    const fused: FusedInsight[] = [];
    for (const [cluster, clusterSignals] of byCluster) {
      // Within cluster, also merge by primary node
      const byNode = this.groupByNode(clusterSignals);
      if (byNode.length === 0) {
        // No node ids — fuse whole cluster once
        fused.push(this.fuseGroup(clusterSignals, cluster));
        continue;
      }
      for (const group of byNode) {
        fused.push(this.fuseGroup(group, cluster));
      }
    }

    // Sort by severity + confidence (operator-facing top signals first)
    fused.sort((a, b) => this.rank(b) - this.rank(a));

    // Keep a focused set — "the 3–7 things the operator needs"
    this.fusedInsights = fused.slice(0, 7);
    return this.fusedInsights;
  }

  groupByCluster(signals: FusionSignal[]): Map<FusionCluster, FusionSignal[]> {
    const map = new Map<FusionCluster, FusionSignal[]>();
    for (const signal of signals) {
      const list = map.get(signal.cluster) ?? [];
      list.push(signal);
      map.set(signal.cluster, list);
    }
    return map;
  }

  groupByNode(signals: FusionSignal[]): FusionSignal[][] {
    const map = new Map<string, FusionSignal[]>();
    for (const signal of signals) {
      const key = signal.nodeId ?? `__cluster__`;
      const list = map.get(key) ?? [];
      list.push(signal);
      map.set(key, list);
    }
    return [...map.values()];
  }

  fuseGroup(group: FusionSignal[], cluster: FusionCluster): FusedInsight {
    if (group.length === 0) {
      return {
        id: `fused-empty-${cluster}`,
        cluster,
        nodeId: null,
        severity: 'info',
        message: 'No signals',
        confidence: 0,
        recommendedAction: 'Monitor',
        sourceCount: 0,
        relatedNodeIds: [],
        timestamp: Date.now(),
        sources: [],
      };
    }

    // Rule 3 — Resolve conflicts: highest severity, then confidence
    const best = group.reduce((a, b) => {
      const sev = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
      if (sev !== 0) return sev > 0 ? b : a;
      return b.confidence >= a.confidence ? b : a;
    });

    // Rule 2 — If prediction confidence beats warning/info in same group, prediction can dominate message focus
    const strongestPrediction = group
      .filter((s) => s.severity === 'prediction')
      .sort((a, b) => b.confidence - a.confidence)[0];
    const primary =
      strongestPrediction &&
      strongestPrediction.confidence > best.confidence &&
      SEVERITY_ORDER[best.severity] <= SEVERITY_ORDER.warning
        ? strongestPrediction
        : best;

    // Rule 1 — Merge similar insights (unique messages)
    const sources = uniqueMessages(group.map((g) => g.message));
    // Prefer primary message first, then supporting context (max 3 parts)
    const ordered = uniqueMessages([
      primary.message,
      ...sources.filter((m) => m !== primary.message),
    ]).slice(0, 3);

    const related = new Set<string>();
    for (const signal of group) {
      if (signal.nodeId) related.add(signal.nodeId);
      for (const id of signal.relatedNodeIds) related.add(id);
    }

    const confidence = clamp01(Math.max(...group.map((g) => g.confidence)));
    const severity = this.resolveSeverity(group, primary);

    return {
      id: `fused-${cluster}-${primary.nodeId ?? 'cluster'}-${primary.timestamp}`,
      cluster,
      nodeId: primary.nodeId,
      severity,
      message: ordered.join(' · '),
      confidence,
      recommendedAction: this.recommend(severity, cluster, primary),
      sourceCount: group.length,
      relatedNodeIds: [...related],
      workspace: primary.workspace ?? this.graph.normalizer.getContext().workspace ?? null,
      timestamp: Math.max(...group.map((g) => g.timestamp)),
      sources: ordered,
    };
  }

  recommend(
    severity: FusionSeverity,
    cluster: FusionCluster,
    signal: FusionSignal,
  ): string {
    const byMessage = this.recommendFromMessage(signal.message);
    if (byMessage) return byMessage;
    return CLUSTER_ACTIONS[cluster][severity] ?? 'Monitor';
  }

  rank(signal: Pick<FusedInsight, 'severity' | 'confidence' | 'workspace'>): number {
    const contextWs = this.graph.normalizer.getContext().workspace;
    const workspaceBoost =
      signal.workspace && contextWs && signal.workspace === contextWs ? 1.15 : 1;
    return SEVERITY_ORDER[signal.severity] * signal.confidence * workspaceBoost;
  }

  getFusedInsights(): readonly FusedInsight[] {
    return this.fusedInsights;
  }

  /** Top N operator-facing fused insights. */
  getTopInsights(limit = 3): readonly FusedInsight[] {
    return this.fusedInsights.slice(0, limit);
  }

  reset(): void {
    this.fusedInsights = [];
  }

  // ── Mapping ───────────────────────────────────────────────────────────────

  fromInference(result: InferenceResult): FusionSignal {
    return {
      id: result.id,
      nodeId: result.nodeId ?? result.relatedNodeIds[0] ?? null,
      cluster: this.clusterFor(result.nodeId, result.rule, result.message),
      severity: this.severityFromInference(result),
      message: result.message,
      confidence: result.confidence,
      rule: result.rule,
      relatedNodeIds: result.relatedNodeIds,
      timestamp: result.timestamp,
      source: 'inference',
      ...(result.workspace !== undefined ? { workspace: result.workspace } : {}),
    };
  }

  fromPrediction(prediction: Prediction): FusionSignal {
    return {
      id: prediction.id,
      nodeId: prediction.nodeId,
      cluster: this.clusterFromPredictionCategory(prediction.category),
      severity: 'prediction',
      message: prediction.message,
      confidence: prediction.confidence,
      rule: prediction.rule,
      relatedNodeIds: prediction.relatedNodeIds,
      timestamp: prediction.timestamp,
      source: 'prediction',
    };
  }

  clusterFor(
    nodeId: string | undefined,
    rule?: string,
    message?: string,
  ): FusionCluster {
    const blob = `${nodeId ?? ''} ${rule ?? ''} ${message ?? ''}`.toLowerCase();
    if (blob.includes('scene')) return 'scene';
    if (blob.includes('graphics') || blob.includes('graphic')) return 'graphics';
    if (blob.includes('audio') || blob.includes('clip')) return 'audio';
    if (blob.includes('routing') || blob.includes('route')) return 'routing';
    if (blob.includes('output') || blob.includes('frame')) return 'output';
    if (blob.includes('operator') || blob.includes('workspace')) return 'operator';
    if (blob.includes('automation') || blob.includes('trigger')) return 'automation';
    if (nodeId?.startsWith('scene:')) return 'scene';
    if (nodeId?.startsWith('graphics:')) return 'graphics';
    if (nodeId?.startsWith('audio:')) return 'audio';
    if (nodeId?.startsWith('routing:')) return 'routing';
    if (nodeId?.startsWith('output:')) return 'output';
    if (nodeId?.startsWith('operator:')) return 'operator';
    if (nodeId?.startsWith('automation:')) return 'automation';
    return 'system';
  }

  clusterFromPredictionCategory(category: Prediction['category']): FusionCluster {
    switch (category) {
      case 'scene_transition':
        return 'scene';
      case 'graphics_activation':
        return 'graphics';
      case 'audio_clipping':
        return 'audio';
      case 'routing_failure':
        return 'routing';
      case 'output_degradation':
        return 'output';
      case 'operator_action':
        return 'operator';
      case 'automation_trigger':
        return 'automation';
      default:
        return 'system';
    }
  }

  severityFromInference(result: InferenceResult): FusionSeverity {
    if (result.emphasis === 'critical') return 'critical';
    if (result.kind === 'warning') {
      return result.emphasis === 'warning' ? 'warning' : 'warning';
    }
    if (result.kind === 'prediction') return 'prediction';
    if (result.kind === 'automation_trigger') return 'prediction';
    if (
      result.message.toLowerCase().includes('missing source') ||
      result.message.toLowerCase().includes('clipping') ||
      result.message.toLowerCase().includes('path failure')
    ) {
      return result.confidence >= 0.9 ? 'critical' : 'warning';
    }
    if (result.kind === 'guidance' || result.kind === 'recommendation' || result.kind === 'insight') {
      return 'info';
    }
    return 'info';
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private applyWorkspaceRelevance(signal: FusionSignal): FusionSignal {
    const contextWs = this.graph.normalizer.getContext().workspace;
    if (!contextWs) return signal;

    const node = signal.nodeId ? this.graph.nodes.get(signal.nodeId) : undefined;
    const signalWs = signal.workspace ?? node?.workspace ?? null;
    if (signalWs && signalWs === contextWs) {
      return { ...signal, confidence: clamp01(signal.confidence * 1.08) };
    }

    // Soft demote unrelated workspace noise (still keep if strong)
    if (signalWs && signalWs !== contextWs && signal.confidence < 0.7) {
      return { ...signal, confidence: clamp01(signal.confidence * 0.9) };
    }
    return signal;
  }

  private resolveSeverity(
    group: FusionSignal[],
    primary: FusionSignal,
  ): FusionSeverity {
    // Keep critical/warning if present even when prediction message is featured
    const hasCritical = group.some((g) => g.severity === 'critical');
    if (hasCritical) return 'critical';
    const hasWarning = group.some((g) => g.severity === 'warning');
    if (hasWarning && primary.severity === 'prediction') {
      // Prediction dominates message (Rule 2) but severity stays warning if present
      return primary.confidence > Math.max(...group.filter((g) => g.severity === 'warning').map((g) => g.confidence))
        ? 'prediction'
        : 'warning';
    }
    return primary.severity;
  }

  private recommendFromMessage(message: string): string | null {
    const m = message.toLowerCase();
    if (m.includes('missing source')) return 'Restore or rematch the missing source';
    if (m.includes('clipping')) return 'Reduce gain or enable limiter';
    if (m.includes('routing') && m.includes('fail')) return 'Failover route or disable broken destination';
    if (m.includes('output') && m.includes('degrad')) return 'Inspect encoder load and composition complexity';
    if (m.includes('graphics') && m.includes('conflict')) return 'Resolve conflicting graphics layers';
    if (m.includes('scene transition')) return 'Prepare triad / scene switcher';
    if (m.includes('graphics activation')) return 'Arm graphics for take';
    if (m.includes('automation trigger')) return 'Review automation conditions before fire';
    if (m.includes('operator will activate')) return 'Preload target workspace tools';
    return null;
  }
}
