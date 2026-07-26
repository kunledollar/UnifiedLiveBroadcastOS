export class DecisionEngine {
  constructor(config) {
    this.config = config;
  }

  decide(context) {
    const levelConfig = this.config.levels[context.autonomyLevel];

    // 1. Permissions check
    if (!context.permissions.allowed) {
      return "REQUEST_APPROVAL";
    }

    // 2. System health check
    if (context.system.outputHealth === "critical") {
      return "FALLBACK";
    }

    // 3. Severity check
    if (context.severity > levelConfig.maxSeverity) {
      return "PAUSE";
    }

    // 4. Confidence check
    if (context.confidence < levelConfig.minConfidence) {
      return "PREDICT";
    }

    // 5. All good → act
    return "ACT";
  }
}
