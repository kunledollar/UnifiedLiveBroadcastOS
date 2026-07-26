/**
 * Autonomous Confidence Engine (ACE) — Step 113.
 *
 * The mathematical backbone of Autonomous Studio Mode: computes how
 * *certain* UBOS is about any autonomous action — confidence scoring,
 * decay, fusion, thresholds, and the data behind confidence
 * visualization. Named `AutonomousConfidenceEngine` (not the spec
 * sample's bare `ConfidenceEngine`) to avoid any confusion with the
 * already-existing `ConfidenceScoringEngine` (CSE, Step 84) — see below.
 *
 * ── Not a duplicate of CSE (Step 84) ──────────────────────────────────
 * `confidenceScoringEngine.ts` already scores individual raw graph
 * events/nodes/edges from engine reliability, frequency, consistency,
 * recency, cross-engine agreement, workspace/operator relevance, and EMA
 * smoothing — the confidence *every* prediction/insight this codebase
 * already carries is CSE's own output. ACE operates one level higher:
 * given a set of *already-scored, named* signals for one candidate
 * autonomous action (its prediction confidence, the health of its
 * subsystem, the graph's own historical stability — CSE's
 * `stabilityScore()`, reused directly, not re-derived), ACE (a) fuses
 * them with a choice of strategy, (b) decays the fused result by how
 * stale the underlying prediction has become, and (c) checks the result
 * against one of four *named* thresholds Steps 107/111/112 never
 * distinguished (a single `minConfidence` serves all four purposes
 * today). Nothing here re-implements CSE's own per-event scoring.
 *
 * ── Same "Studio Automation 2.0" naming gap as Steps 109-112 ─────────
 * Built against Studio Automation 1.0 (Step 107/111/112).
 *
 * Kept dependency-free of React/`@ubos/ui`/`hud/`, matching every other
 * intelligence-graph engine.
 */

// ── Confidence fusion ────────────────────────────────────────────────────────

export type ConfidenceSignals = Record<string, number>;
export type ConfidenceWeights = Record<string, number>;

export type ConfidenceFusionStrategy = 'weightedAverage' | 'max' | 'min' | 'harmonicMean' | 'safetyAware';

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function weightedAverage(signals: ConfidenceSignals, weights: ConfidenceWeights): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const key of Object.keys(signals)) {
    const value = signals[key]!;
    const weight = weights[key] ?? 1;
    weightedSum += value * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

function maxSignal(signals: ConfidenceSignals): number {
  const values = Object.values(signals);
  return values.length > 0 ? Math.max(...values) : 0;
}

function minSignal(signals: ConfidenceSignals): number {
  const values = Object.values(signals);
  return values.length > 0 ? Math.min(...values) : 0;
}

function harmonicMean(signals: ConfidenceSignals): number {
  const values = Object.values(signals).filter((v) => v > 0);
  if (values.length === 0) return 0;
  const reciprocalSum = values.reduce((sum, v) => sum + 1 / v, 0);
  return values.length / reciprocalSum;
}

/**
 * "Safety-aware" fusion — the weighted average, discounted by the
 * weakest signal present: a chain-is-as-strong-as-its-weakest-link
 * adjustment. Appropriate specifically for autonomy gating, where one
 * badly-informed signal (e.g. real output instability) should not be
 * hidden behind several confident, unrelated ones (e.g. a very
 * confident prediction). This is ACE's own addition beyond the Step 113
 * spec's plain weighted-average `score()` — exposed as one of five named
 * strategies via `fuse()`, not the only option.
 */
function safetyAwareFuse(signals: ConfidenceSignals, weights: ConfidenceWeights): number {
  const average = weightedAverage(signals, weights);
  const weakest = minSignal(signals);
  return average * (0.5 + 0.5 * weakest);
}

// ── Confidence thresholds ───────────────────────────────────────────────────

/**
 * The four named thresholds from the spec — distinguishing what Steps
 * 107/111/112 conflate into a single `AutonomySafetySettings.minConfidence`.
 * Default values are this agent's own considered design (the spec names
 * the four purposes without giving numbers):
 *   - `toAct` (0.85) — matches Step 107's own original default exactly,
 *     the highest bar: autonomously *executing* something.
 *   - `toRecover` (0.7) — a deliberately lower bar than `toAct`: recovery
 *     actions (failover, backup destination) are time-critical, and
 *     `defaultActionRules()` (Step 112) already exempts them from the
 *     "requires stable output" rule for the same reason.
 *   - `toOverride` (0.6) — a decision surfaced to the operator as an
 *     override prompt (Step 110) needs to be reasonably grounded, but a
 *     human reviews it, so the bar is lower than acting alone.
 *   - `toPredict` (0.5) — the lowest bar: merely *showing* a prediction
 *     to the operator (Primary Insight, Step 104) is the lowest-stakes
 *     use of a confidence number.
 */
export type ConfidenceThresholdName = 'toAct' | 'toPredict' | 'toOverride' | 'toRecover';
export type ConfidenceThresholds = Record<ConfidenceThresholdName, number>;

export function defaultConfidenceThresholds(): ConfidenceThresholds {
  return { toAct: 0.85, toPredict: 0.5, toOverride: 0.6, toRecover: 0.7 };
}

/**
 * Signal weights for the fusion strategies above. `prediction` carries
 * double weight — it is the one signal every candidate action always
 * has; `systemHealth`/`historicalStability` are corroborating context
 * that should shift, not dominate, the fused result.
 */
export function defaultConfidenceWeights(): ConfidenceWeights {
  return { prediction: 2, systemHealth: 1, historicalStability: 1 };
}

/**
 * Confidence lost per second of elapsed time (Step 113's `decay()`).
 * 0.01/s means a comfortably-passing 0.85 confidence takes ~85 seconds
 * to decay to zero, and loses only ~0.01 within a single ~1-second
 * automation tick — long enough that a genuinely fresh prediction is
 * never meaningfully penalized on the tick it was made, but a decision
 * left un-acted-on for tens of seconds (the studio state has almost
 * certainly moved on) is discounted well before it can still fire on
 * information that stale.
 */
export const DEFAULT_DECAY_RATE_PER_SECOND = 0.01;

export type AutonomousConfidenceEngineConfig = {
  weights: ConfidenceWeights;
  /** Confidence lost per second of elapsed time. */
  decayRate: number;
  thresholds: ConfidenceThresholds;
};

export function defaultAutonomousConfidenceEngineConfig(): AutonomousConfidenceEngineConfig {
  return {
    weights: defaultConfidenceWeights(),
    decayRate: DEFAULT_DECAY_RATE_PER_SECOND,
    thresholds: defaultConfidenceThresholds(),
  };
}

// ── The engine ───────────────────────────────────────────────────────────────

/**
 * ACE — matches the Step 113 spec's `ConfidenceEngine` class shape
 * (`constructor(config)`, `score(signals)`, `decay(confidence,
 * deltaTime)`, `meetsThreshold(confidence)`) exactly, generalized with
 * `fuse()` (five strategies, not just weighted average) and named
 * thresholds (four purposes, not just one) — `score()`/`meetsThreshold()`
 * without a strategy/threshold name reproduce the spec sample's exact
 * single-strategy, single-threshold behavior for a caller that does not
 * need the generalization.
 */
export class AutonomousConfidenceEngine {
  private config: AutonomousConfidenceEngineConfig;

  constructor(config: AutonomousConfidenceEngineConfig = defaultAutonomousConfidenceEngineConfig()) {
    this.config = config;
  }

  /** The spec's own `score(signals)` — weighted-average fusion, clamped to [0, 1]. */
  score(signals: ConfidenceSignals): number {
    return clamp01(weightedAverage(signals, this.config.weights));
  }

  /** The generalized form of `score()` — same weighted-average default, plus four alternative strategies. */
  fuse(signals: ConfidenceSignals, strategy: ConfidenceFusionStrategy = 'weightedAverage'): number {
    if (Object.keys(signals).length === 0) return 0;
    switch (strategy) {
      case 'weightedAverage':
        return clamp01(weightedAverage(signals, this.config.weights));
      case 'max':
        return clamp01(maxSignal(signals));
      case 'min':
        return clamp01(minSignal(signals));
      case 'harmonicMean':
        return clamp01(harmonicMean(signals));
      case 'safetyAware':
        return clamp01(safetyAwareFuse(signals, this.config.weights));
    }
  }

  /** The spec's own `decay(confidence, deltaTime)` — `deltaTime` in seconds. */
  decay(confidence: number, deltaTimeSeconds: number): number {
    const decayed = confidence - this.config.decayRate * Math.max(0, deltaTimeSeconds);
    return clamp01(decayed);
  }

  /**
   * The spec's own `meetsThreshold(confidence)`, generalized with a named
   * threshold (defaulting to `toAct`, the spec sample's one and only
   * `minConfidence`).
   */
  meetsThreshold(confidence: number, thresholdName: ConfidenceThresholdName = 'toAct'): boolean {
    return confidence >= this.config.thresholds[thresholdName];
  }

  setWeights(partial: ConfidenceWeights): void {
    this.config.weights = { ...this.config.weights, ...partial };
  }

  setThresholds(partial: Partial<ConfidenceThresholds>): void {
    this.config.thresholds = { ...this.config.thresholds, ...partial };
  }

  setDecayRate(ratePerSecond: number): void {
    this.config.decayRate = ratePerSecond;
  }

  getConfig(): AutonomousConfidenceEngineConfig {
    return this.config;
  }

  reset(): void {
    this.config = defaultAutonomousConfidenceEngineConfig();
  }
}
