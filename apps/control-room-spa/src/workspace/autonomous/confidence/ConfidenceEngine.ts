export class ConfidenceEngine {
  constructor(config) {
    this.config = config;
  }

  score(signals) {
    // Weighted confidence fusion
    let totalWeight = 0;
    let weightedSum = 0;

    for (const key in signals) {
      const value = signals[key];
      const weight = this.config.weights[key] ?? 1;

      weightedSum += value * weight;
      totalWeight += weight;
    }

    const fused = weightedSum / totalWeight;

    return Math.min(1, Math.max(0, fused));
  }

  decay(confidence, deltaTime) {
    const decayRate = this.config.decayRate ?? 0.05;
    const decayed = confidence - decayRate * deltaTime;

    return Math.max(0, decayed);
  }

  meetsThreshold(confidence) {
    return confidence >= this.config.minConfidence;
  }
}
