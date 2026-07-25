/**
 * Temporal Pattern Engine (TPE) — Step 85
 *
 * Analyzes how UIG node signals evolve over time:
 *   - sliding-window history
 *   - trend / spike / drop / cycle / anomaly detection
 *   - exponential temporal smoothing
 *   - temporal confidence adjustment
 *
 * Transforms UBOS from "what is happening now" into
 * "how things are changing."
 */

import type { UBOSIntelligenceGraph, UigNode } from './ubosIntelligenceGraph.js';

export type TemporalTrend = 'rising' | 'falling' | 'stable' | 'volatile';

export type TemporalSample = {
  timestamp: number;
  attributes: Record<string, unknown>;
  confidence: number;
  /** Primary semantic metric when available (peak, dropped frames, etc.). */
  metric?: number;
};

export type TemporalAnalysis = {
  trend: TemporalTrend;
  anomaly: boolean;
  cycle: boolean;
  spike: boolean;
  drop: boolean;
  smoothedConfidence: number;
  /** Velocity of the confidence series (last − previous). */
  velocity: number;
};

const WINDOW_SIZE = 10;
const SMOOTH_ALPHA = 0.3;
const TREND_DELTA = 0.2;
const VOLATILITY_SPAN = 0.3;
const SPIKE_DELTA = 0.3;
const DROP_DELTA = 0.3;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Prefer domain metrics when present; otherwise undefined (confidence used). */
export function extractPrimaryMetric(attributes: Record<string, unknown>): number | undefined {
  const keys = [
    'peak',
    'rms',
    'droppedframes',
    'dropped_frames',
    'latency',
    'runcount',
    'run_count',
  ];
  for (const key of keys) {
    const value = attributes[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function seriesValues(history: TemporalSample[]): number[] {
  // Prefer metric series when the majority of samples have metrics
  const withMetric = history.filter((h) => typeof h.metric === 'number');
  if (withMetric.length >= Math.ceil(history.length / 2)) {
    return withMetric.map((h) => h.metric as number);
  }
  return history.map((h) => h.confidence);
}

function relativeOrAbsoluteDelta(last: number, prev: number): number {
  // Confidence-like 0–1 domain → absolute delta; larger metrics → relative
  if (Math.abs(prev) <= 1.5 && Math.abs(last) <= 1.5) {
    return last - prev;
  }
  const base = Math.max(Math.abs(prev), 1e-6);
  return (last - prev) / base;
}

export class TemporalPatternEngine {
  private readonly graph: UBOSIntelligenceGraph;
  private readonly smoothedById = new Map<string, number>();

  constructor(graph: UBOSIntelligenceGraph) {
    this.graph = graph;
  }

  /**
   * Append a history sample and compute temporal flags.
   * Preserves prior history when the same node id is re-ingested.
   */
  update(node: UigNode): UigNode {
    const existing = this.graph.nodes.get(node.id);
    const history: TemporalSample[] = [...(existing?.history ?? node.history ?? [])];

    const metric = extractPrimaryMetric(node.attributes);
    const sample: TemporalSample = {
      timestamp: node.timestamp || Date.now(),
      attributes: { ...node.attributes },
      confidence: node.confidence,
      ...(metric !== undefined ? { metric } : {}),
    };
    history.push(sample);
    while (history.length > WINDOW_SIZE) history.shift();

    const analysis = this.analyze(history, node.id, node.confidence);

    // Temporal confidence adjustment: blend live CSE score with smoothed history
    const adjustedConfidence = clamp01(0.65 * node.confidence + 0.35 * analysis.smoothedConfidence);

    return {
      ...node,
      history,
      trend: analysis.trend,
      anomaly: analysis.anomaly,
      cycle: analysis.cycle,
      spike: analysis.spike,
      drop: analysis.drop,
      smoothedConfidence: analysis.smoothedConfidence,
      velocity: analysis.velocity,
      confidence: adjustedConfidence,
      attributes: {
        ...node.attributes,
        tpe_trend: analysis.trend,
        tpe_spike: analysis.spike,
        tpe_drop: analysis.drop,
        tpe_anomaly: analysis.anomaly,
        tpe_cycle: analysis.cycle,
        tpe_smoothed: analysis.smoothedConfidence,
        tpe_velocity: analysis.velocity,
      },
    };
  }

  analyze(history: TemporalSample[], nodeId?: string, currentConfidence?: number): TemporalAnalysis {
    const confidenceSeries = history.map((h) => h.confidence);
    const lastConfidence =
      currentConfidence ??
      confidenceSeries[confidenceSeries.length - 1] ??
      0.5;

    const smoothedConfidence = this.smooth(
      nodeId ?? '__anonymous__',
      lastConfidence,
    );

    const prev =
      confidenceSeries.length >= 2
        ? confidenceSeries[confidenceSeries.length - 2] ?? lastConfidence
        : lastConfidence;

    return {
      trend: this.detectTrend(history),
      spike: this.detectSpike(history),
      drop: this.detectDrop(history),
      anomaly: this.detectAnomaly(history),
      cycle: this.detectCycle(history),
      smoothedConfidence,
      velocity: lastConfidence - prev,
    };
  }

  detectTrend(history: TemporalSample[]): TemporalTrend {
    if (history.length < 3) return 'stable';

    const values = seriesValues(history);
    if (values.length < 3) return 'stable';

    const first = values[0] ?? 0;
    const last = values[values.length - 1] ?? 0;
    const diff = last - first;
    // Normalize large-metric diffs to relative for trend thresholds
    const normDiff =
      Math.abs(first) > 1.5 || Math.abs(last) > 1.5
        ? diff / Math.max(Math.abs(first), 1e-6)
        : diff;

    if (normDiff > TREND_DELTA) return 'rising';
    if (normDiff < -TREND_DELTA) return 'falling';

    const span = Math.max(...values) - Math.min(...values);
    const normSpan =
      Math.max(...values.map(Math.abs), 1e-6) > 1.5
        ? span / Math.max(...values.map(Math.abs), 1e-6)
        : span;
    if (normSpan > VOLATILITY_SPAN) return 'volatile';

    return 'stable';
  }

  detectSpike(history: TemporalSample[]): boolean {
    if (history.length < 2) return false;
    const values = seriesValues(history);
    if (values.length < 2) return false;
    const last = values[values.length - 1] ?? 0;
    const prev = values[values.length - 2] ?? 0;
    return relativeOrAbsoluteDelta(last, prev) > SPIKE_DELTA;
  }

  detectDrop(history: TemporalSample[]): boolean {
    if (history.length < 2) return false;
    const values = seriesValues(history);
    if (values.length < 2) return false;
    const last = values[values.length - 1] ?? 0;
    const prev = values[values.length - 2] ?? 0;
    return relativeOrAbsoluteDelta(prev, last) > DROP_DELTA;
  }

  detectAnomaly(history: TemporalSample[]): boolean {
    const values = seriesValues(history);
    if (values.length < 3) return false;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    if (std < 1e-9) return false;

    const last = values[values.length - 1] ?? avg;
    return Math.abs(last - avg) > 2 * std;
  }

  detectCycle(history: TemporalSample[]): boolean {
    if (history.length < 6) return false;
    const values = seriesValues(history);
    if (values.length < 6) return false;

    // Quantize to reduce float noise for pattern matching
    const q = values.map((v) => v.toFixed(2));
    const pattern = q.slice(0, 3).join(',');
    const recent = q.slice(3, 6).join(',');
    return pattern === recent;
  }

  /** Exponential smoothing: smoothed = α * current + (1 - α) * previous */
  smooth(id: string, current: number, alpha = SMOOTH_ALPHA): number {
    const prev = this.smoothedById.get(id);
    if (prev === undefined) {
      const seed = clamp01(current);
      this.smoothedById.set(id, seed);
      return seed;
    }
    const smoothed = clamp01(alpha * current + (1 - alpha) * prev);
    this.smoothedById.set(id, smoothed);
    return smoothed;
  }

  /** Summary counts for UI / snapshot. */
  getSummary(): {
    rising: number;
    falling: number;
    volatile: number;
    spikes: number;
    drops: number;
    anomalies: number;
    cycles: number;
  } {
    const summary = {
      rising: 0,
      falling: 0,
      volatile: 0,
      spikes: 0,
      drops: 0,
      anomalies: 0,
      cycles: 0,
    };
    for (const node of this.graph.nodes.values()) {
      if (node.trend === 'rising') summary.rising += 1;
      if (node.trend === 'falling') summary.falling += 1;
      if (node.trend === 'volatile') summary.volatile += 1;
      if (node.spike) summary.spikes += 1;
      if (node.drop) summary.drops += 1;
      if (node.anomaly) summary.anomalies += 1;
      if (node.cycle) summary.cycles += 1;
    }
    return summary;
  }

  reset(): void {
    this.smoothedById.clear();
  }
}
