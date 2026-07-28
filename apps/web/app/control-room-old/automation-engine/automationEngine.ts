/**
 * UBOS Automation Engine — Step 67
 *
 * The orchestration engine that controls all other UBOS engines.
 * Evaluates triggers against the current workspace state and fires
 * actions when conditions are met.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - multi-condition triggers (AND/OR/NOT)
 *   - time-based scheduled triggers
 *   - event-bus driven triggers
 *   - AI-driven trigger suggestions
 *   - automation macros + sequences
 *   - automation timeline + runbook
 *   - automation graph visualization
 */

// AutomationContext is the workspace state object that triggers
// receive — typed loosely to avoid circular imports.
export type AutomationContext = Record<string, unknown>;

export type AutomationTrigger = {
  id: number;
  name: string;
  enabled: boolean;
  runCount: number;
  lastRun?: number;
  /** Returns true when the trigger should fire. */
  condition: (ctx: AutomationContext) => boolean;
  /** Side-effect executed when condition is true. */
  action: (ctx: AutomationContext) => void;
};

export type TriggerRegistration = Omit<AutomationTrigger, 'id' | 'enabled' | 'runCount'>;

export class AutomationEngine {
  private triggers: AutomationTrigger[] = [];

  // ── Trigger management ────────────────────────────────────────────────────

  registerTrigger(registration: TriggerRegistration): AutomationTrigger {
    const trigger: AutomationTrigger = {
      ...registration,
      id: Date.now() + this.triggers.length,
      enabled: true,
      runCount: 0,
    };
    this.triggers.push(trigger);
    return trigger;
  }

  removeTrigger(id: number): void {
    this.triggers = this.triggers.filter((t) => t.id !== id);
  }

  enableTrigger(id: number): void {
    const t = this.triggers.find((t) => t.id === id);
    if (t) t.enabled = true;
  }

  disableTrigger(id: number): void {
    const t = this.triggers.find((t) => t.id === id);
    if (t) t.enabled = false;
  }

  toggleTrigger(id: number): void {
    const t = this.triggers.find((t) => t.id === id);
    if (t) t.enabled = !t.enabled;
  }

  getTriggers(): readonly AutomationTrigger[] {
    return this.triggers;
  }

  getEnabledTriggers(): readonly AutomationTrigger[] {
    return this.triggers.filter((t) => t.enabled);
  }

  // ── Evaluation ────────────────────────────────────────────────────────────

  /**
   * Evaluate all enabled triggers against the current workspace state.
   * Triggers whose condition returns true have their action executed.
   * Safe — errors in individual triggers are caught and logged.
   */
  evaluate(ctx: AutomationContext): void {
    for (const trigger of this.triggers) {
      if (!trigger.enabled) continue;
      try {
        if (trigger.condition(ctx)) {
          trigger.action(ctx);
          trigger.runCount++;
          trigger.lastRun = Date.now();
        }
      } catch (err) {
        console.warn(`[AutomationEngine] trigger "${trigger.name}" threw:`, err);
      }
    }
  }

  // ── Accessors ─────────────────────────────────────────────────────────────

  get triggerCount():        number { return this.triggers.length; }
  get enabledTriggerCount(): number { return this.triggers.filter((t) => t.enabled).length; }
  get totalRunCount():       number { return this.triggers.reduce((sum, t) => sum + t.runCount, 0); }
}
