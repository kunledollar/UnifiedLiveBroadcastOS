export class AutonomousCoordinator {
  constructor(deps) {
    this.deps = deps;
  }

  update(context) {
    const {
      decisionEngine,
      actions,
      fallback,
      recovery,
      logger,
      timeline
    } = this.deps;

    const decision = decisionEngine.decide(context);

    switch (decision) {
      case "ACT":
        actions.execute(context.action);
        logger.log("execute", context.action);
        timeline.add("execute", context.action);
        break;

      case "PREDICT":
        logger.log("predict", context.action);
        timeline.add("predict", context.action);
        break;

      case "PAUSE":
        logger.log("pause", context.action);
        timeline.add("pause", context.action);
        break;

      case "FALLBACK":
        fallback.trigger();
        recovery.recover(context.systemState);
        logger.log("fallback", context.action);
        timeline.add("fallback", context.action);
        break;

      case "REQUEST_APPROVAL":
        logger.log("approval_requested", context.action);
        timeline.add("approval_requested", context.action);
        break;
    }
  }
}
