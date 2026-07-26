'use client';

/**
 * Autonomous Conflict Warning Layer (Step 110, component #2).
 *
 * A yellow warning bar for every conflict Studio Automation 1.0's own
 * conflict resolution (Step 107) produced this tick — conflict type,
 * severity score, confidence score, and the recommended (winning)
 * action, each styled by Autonomous Risk Visualization (component #6).
 */
import { ubosTypographyClasses } from '@ubos/ui';
import type { ConflictWarning, ConflictWarningType } from './autonomousSafetyUX';
import { riskVisualization } from './autonomousSafetyUX';

const CONFLICT_TYPE_LABEL: Record<ConflictWarningType, string> = {
  'scene-vs-graphics': 'Scene vs Graphics',
  'graphics-vs-audio': 'Graphics vs Audio',
  'routing-vs-output': 'Routing vs Output',
  'replay-vs-program': 'Replay vs Program',
  'streaming-vs-routing': 'Streaming vs Routing',
  other: 'Automation Conflict',
};

export function AutonomousConflictWarning({ conflicts }: { conflicts: readonly ConflictWarning[] }) {
  if (conflicts.length === 0) return null;

  return (
    <div className="autonomous-conflict-warning" data-testid="autonomous-conflict-warning">
      {conflicts.map((warning) => {
        const risk = riskVisualization(warning.severityScore, warning.confidence);
        return (
          <div
            key={warning.id}
            className="autonomous-conflict-warning-item"
            style={{ opacity: risk.confidenceOpacity }}
            data-ubos-severity-band={risk.severityBand}
          >
            <span className={ubosTypographyClasses.hud}>{CONFLICT_TYPE_LABEL[warning.type]}</span>
            <span className={ubosTypographyClasses.microText}>
              Severity {(warning.severityScore * 100).toFixed(0)}% · Confidence {(warning.confidence * 100).toFixed(0)}%
            </span>
            <span className={ubosTypographyClasses.intelligence}>Recommended: {warning.recommendedAction}</span>
          </div>
        );
      })}
    </div>
  );
}
