export class SeverityEngine {
  constructor(config) {
    this.config = config;
  }

  score(signals) {
    // Severity fusion using max + weighted average
    let maxSeverity = 0;
    let weightedSum = 0;
    let totalWeight = 0;

    for (const key in signals) {
      const value = signals[key];
      const weight = this.config.weights[key] ?? 1;

      maxSeverity = Math.max(maxSeverity, value);
      weightedSum += value * weight;
      totalWeight += weight;
    }

    const weightedSeverity = weightedSum / totalWeight;

    // Safety-aware fusion: take the higher of the two
    const fused = Math.max(maxSeverity, weightedSeverity);

    return Math.min(1, Math.max(0, fused));
  }

  decay(severity, deltaTime) {
    const decayRate = this.config.decayRate ?? 0.05;
    const decayed = severity - decayRate * deltaTime;

    return Math.max(0, decayed);
  }

  exceedsThreshold(severity) {
    return severity > this.config.maxSeverity;
  }
}
