'use client';

/**
 * Autonomous Override Prompts (Step 110, component #4).
 *
 * Surfaces decisions Studio Automation 1.0 blocked from auto-executing
 * (Step 107) that are additionally high-severity, low-confidence, part
 * of a multi-workspace conflict, or an output-degradation risk — the
 * spec's own four override-prompt categories — so the operator can make
 * the call automation would not make on its own.
 */
import { ubosTypographyClasses } from '@ubos/ui';
import type { OverridePrompt, OverridePromptReason } from './autonomousSafetyUX';
import { riskVisualization } from './autonomousSafetyUX';

const REASON_LABEL: Record<OverridePromptReason, string> = {
  highSeverity: 'High severity',
  lowConfidence: 'Low confidence',
  multiWorkspaceConflict: 'Multi-workspace conflict',
  outputDegradationRisk: 'Output degradation risk',
};

export function AutonomousOverridePrompt({ prompts }: { prompts: readonly OverridePrompt[] }) {
  if (prompts.length === 0) return null;

  return (
    <div className="autonomous-override-prompt" data-testid="autonomous-override-prompt">
      <h4 className={ubosTypographyClasses.hud}>Operator Review Needed</h4>
      <ul className="hud-zone-list">
        {prompts.map((prompt) => {
          const risk = riskVisualization(prompt.severityScore, prompt.confidence);
          return (
            <li
              key={prompt.id}
              className="hud-zone-item"
              style={{ opacity: risk.confidenceOpacity }}
              data-ubos-severity-band={risk.severityBand}
            >
              <span className="hud-zone-dot bg-ubos-warning" />
              <span className={ubosTypographyClasses.intelligence} title={prompt.message}>
                {prompt.action}
              </span>
              <span className={`shrink-0 ${ubosTypographyClasses.microText}`}>
                {prompt.reasons.map((reason) => REASON_LABEL[reason]).join(', ')}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
