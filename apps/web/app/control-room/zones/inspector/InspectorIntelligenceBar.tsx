'use client';

/**
 * Inspector Intelligence Bar (Step 101) — the "Intelligence Bar" region of
 * Inspector 2.0: fused insights, operator guidance, and workspace
 * intelligence. Same data source as `TriadOperatorHud` (Step 100) —
 * `workspaceState.intelligenceGraph.getSnapshot()` — but shown as a short
 * list (fused insights + guidance) rather than a single top line, since
 * Inspector is the deep-inspection surface and can afford more density
 * than Triad's HUD strip.
 */
import { ubosTypographyClasses } from '@ubos/ui';
import { workspaceState } from '../../workspace/workspaceState';
import type { FusionSeverity } from '../../intelligence-graph/insightFusionEngine';
import type { GuidanceActionType } from '../../intelligence-graph/operatorGuidanceEngine';

const fusedDot: Record<FusionSeverity, string> = {
  critical: 'bg-ubos-error',
  warning: 'bg-ubos-warning',
  prediction: 'bg-ubos-selection',
  info: 'bg-ubos-fg-disabled',
};

const guidanceDot: Record<GuidanceActionType, string> = {
  'Critical Action': 'bg-ubos-program',
  'Warning Action': 'bg-ubos-warning',
  'Prepare Action': 'bg-ubos-selection',
  Monitor: 'bg-ubos-fg-disabled',
};

export function InspectorIntelligenceBar() {
  const graph = workspaceState.intelligenceGraph;
  const snapshot = graph.getSnapshot();
  const topGuidance = snapshot.latestOperatorGuidance[0] ?? null;
  const fused = snapshot.latestFusedInsights.slice(0, 2);

  return (
    <div className="inspector-intelligence-bar rounded-lg border border-ubos-border-subtle bg-ubos-graphite p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">Intelligence Bar</h4>

      {topGuidance ? (
        <div className="mb-2 flex items-start gap-2 rounded bg-ubos-midnight px-2 py-1.5">
          <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${guidanceDot[topGuidance.severity]}`} />
          <p className={`${ubosTypographyClasses.intelligence} text-ubos-fg-secondary`}>{topGuidance.message}</p>
        </div>
      ) : (
        <p className="mb-2 text-[10px] text-ubos-fg-muted">No active guidance</p>
      )}

      <div className="flex flex-col gap-1">
        {fused.map((insight) => (
          <div key={insight.id} className="flex items-start gap-2 rounded bg-ubos-midnight px-2 py-1">
            <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${fusedDot[insight.severity]}`} />
            <p className="truncate text-[10px] text-ubos-fg-muted" title={insight.message}>{insight.message}</p>
          </div>
        ))}
        {fused.length === 0 && (
          <p className="text-[10px] text-ubos-fg-muted">No fused insights yet</p>
        )}
      </div>
    </div>
  );
}
