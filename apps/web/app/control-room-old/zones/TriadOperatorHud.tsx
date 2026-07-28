'use client';

/**
 * Triad Operator HUD (Step 100) — the top layer of Triad 2.0.
 *
 * A compact strip surfacing the single highest-priority operator guidance
 * action (Step 88's `OperatorGuidanceEngine`, already ranked/sorted —
 * `latestOperatorGuidance[0]` is the top action) directly above the
 * Scene/Preview/Program lanes, so "do this now" guidance never requires a
 * trip to the Intelligence Graph zone to see. Reuses the same
 * `workspaceState.intelligenceGraph` singleton and `UigSnapshot` shape the
 * Intelligence Graph zone already renders from — no new data plumbing.
 */
import { ubosTypographyClasses, ubosElevationClasses } from '@ubos/ui';
import { workspaceState } from '../workspace/workspaceState';
import type { GuidanceActionType } from '../intelligence-graph/operatorGuidanceEngine';

// Severity → UBDS semantic hue, matching the same mapping ui-intelligence.css
// uses for WIE actions: Critical Action reads as Program Red (irreversible,
// the most severe tier), Warning Action as Warning Yellow, Prepare Action as
// Active Blue (a standing prediction, not yet confirmed), Monitor as neutral.
const severityDot: Record<GuidanceActionType, string> = {
  'Critical Action': 'bg-ubos-program',
  'Warning Action':  'bg-ubos-warning',
  'Prepare Action':  'bg-ubos-selection',
  Monitor:           'bg-ubos-fg-disabled',
};

const severityText: Record<GuidanceActionType, string> = {
  'Critical Action': 'text-ubos-program-text',
  'Warning Action':  'text-ubos-warning-text',
  'Prepare Action':  'text-ubos-selection-text',
  Monitor:           'text-ubos-fg-secondary',
};

export function TriadOperatorHud() {
  const graph = workspaceState.intelligenceGraph;
  const snapshot = graph.getSnapshot();
  const top = snapshot.latestOperatorGuidance[0] ?? null;

  return (
    <div
      className={`triad-operator-hud flex min-h-[1.75rem] items-center gap-2 px-3 py-1 ${ubosElevationClasses[2]}`}
      data-testid="triad-operator-hud"
    >
      <span className={ubosTypographyClasses.title}>TRIAD</span>
      {snapshot.guidanceRole && (
        <span className={ubosTypographyClasses.microText}>{snapshot.guidanceRole}</span>
      )}
      <div className="ml-auto flex min-w-0 items-center gap-2">
        {top ? (
          <>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[top.severity]}`} />
            <span
              className={`truncate ${ubosTypographyClasses.intelligence} ${severityText[top.severity]}`}
              title={top.message}
            >
              {top.message}
            </span>
            <span className="shrink-0 text-[0.5625rem] uppercase tracking-wide text-ubos-fg-disabled">
              {(top.confidence * 100).toFixed(0)}%
            </span>
          </>
        ) : (
          <span className={`${ubosTypographyClasses.microText} text-ubos-fg-disabled`}>No active guidance</span>
        )}
      </div>
    </div>
  );
}
