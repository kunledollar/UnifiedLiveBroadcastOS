import type { EngineConfig, SignalMap } from '../types';

type SeverityConfig = EngineConfig & { maxSeverity: number };

export class SeverityEngine {
  constructor(private readonly config: SeverityConfig) {}

  score(signals: SignalMap): number {
    // Severity fusion using max + weighted average
    let maxSeverity = 0;
    let weightedSum = 0;
    let totalWeight = 0;

    for (const key in signals) {
      const value = signals[key];
      const weight = this.config.weights?.[key] ?? 1;

      maxSeverity = Math.max(maxSeverity, value);
      weightedSum += value * weight;
      totalWeight += weight;
    }

    const weightedSeverity = totalWeight === 0 ? 0 : weightedSum / totalWeight;

    // Safety-aware fusion: take the higher of the two
    const fused = Math.max(maxSeverity, weightedSeverity);

    return Math.min(1, Math.max(0, fused));
  }

  decay(severity: number, deltaTime: number): number {
    const decayRate = this.config.decayRate ?? 0.05;
    const decayed = severity - decayRate * deltaTime;

    return Math.max(0, decayed);
  }

  exceedsThreshold(severity: number): boolean {
    return severity > this.config.maxSeverity;
  }
}
