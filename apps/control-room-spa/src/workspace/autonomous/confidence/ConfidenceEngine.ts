import type { EngineConfig, SignalMap } from '../types';

type ConfidenceConfig = EngineConfig & { minConfidence: number };

export class ConfidenceEngine {
  constructor(private readonly config: ConfidenceConfig) {}

  score(signals: SignalMap): number {
    // Weighted confidence fusion
    let totalWeight = 0;
    let weightedSum = 0;

    for (const key in signals) {
      const value = signals[key];
      const weight = this.config.weights?.[key] ?? 1;

      weightedSum += value * weight;
      totalWeight += weight;
    }

    const fused = totalWeight === 0 ? 0 : weightedSum / totalWeight;

    return Math.min(1, Math.max(0, fused));
  }

  decay(confidence: number, deltaTime: number): number {
    const decayRate = this.config.decayRate ?? 0.05;
    const decayed = confidence - decayRate * deltaTime;

    return Math.max(0, decayed);
  }

  meetsThreshold(confidence: number): boolean {
    return confidence >= this.config.minConfidence;
  }
}
