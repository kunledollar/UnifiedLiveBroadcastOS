'use client';

/**
 * Output Intelligence Timeline (Step 102) — the "Output Intelligence
 * Timeline" region of Program Output 2.0: fused insights, predicted
 * transitions/activations/degradation, and operator guidance. Same data
 * source as `TriadOperatorHud` (Step 100) and `InspectorIntelligenceBar`
 * (Step 101) — `workspaceState.intelligenceGraph.getSnapshot()` — filtered
 * toward the output/routing/scene clusters this zone actually surfaces,
 * falling back to the overall top guidance/insight when nothing in those
 * clusters is currently active (an empty output-specific bar would hide
 * a real Critical Action just because it happened to originate elsewhere).
 */
import { ubosTypographyClasses } from '@ubos/ui';
import { workspaceState } from '../workspace/workspaceState';
import type { FusionCluster, FusedInsight } from '../intelligence-graph/insightFusionEngine';
import type { GuidanceAction, GuidanceActionType } from '../intelligence-graph/operatorGuidanceEngine';

const RELEVANT_CLUSTERS: readonly FusionCluster[] = ['output', 'routing', 'scene'];

const guidanceDot: Record<GuidanceActionType, string> = {
  'Critical Action': 'bg-ubos-program',
  'Warning Action': 'bg-ubos-warning',
  'Prepare Action': 'bg-ubos-selection',
  Monitor: 'bg-ubos-fg-disabled',
};

function pickRelevantGuidance(actions: readonly GuidanceAction[]): GuidanceAction | null {
  return actions.find((action) => RELEVANT_CLUSTERS.includes(action.cluster)) ?? actions[0] ?? null;
}

function pickRelevantInsights(insights: readonly FusedInsight[]): FusedInsight[] {
  const relevant = insights.filter((insight) => RELEVANT_CLUSTERS.includes(insight.cluster));
  return (relevant.length > 0 ? relevant : insights).slice(0, 2);
}

export function OutputIntelligenceTimeline() {
  const graph = workspaceState.intelligenceGraph;
  const snapshot = graph.getSnapshot();
  const guidance = pickRelevantGuidance(snapshot.latestOperatorGuidance);
  const insights = pickRelevantInsights(snapshot.latestFusedInsights);
  const predictions = snapshot.latestPredictions.filter((p) =>
    ['scene_transition', 'graphics_activation', 'output_degradation'].includes(p.category),
  ).slice(0, 2);

  return (
    <div className="output-intelligence-timeline">
      {guidance ? (
        <div className="mb-1.5 flex items-start gap-2 rounded bg-ubos-midnight px-2 py-1.5">
          <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${guidanceDot[guidance.severity]}`} />
          <p className={`${ubosTypographyClasses.intelligence} text-ubos-fg-secondary`}>{guidance.message}</p>
        </div>
      ) : (
        <p className="mb-1.5 text-[10px] text-ubos-fg-muted">No active guidance</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {predictions.map((prediction) => (
          <span
            key={prediction.id}
            className="rounded bg-ubos-selection-muted px-1.5 py-0.5 text-[9px] text-ubos-selection-text"
            title={prediction.message}
          >
            {prediction.category.replace(/_/g, ' ')} · {(prediction.confidence * 100).toFixed(0)}%
          </span>
        ))}
        {insights.map((insight) => (
          <span
            key={insight.id}
            className="truncate rounded bg-ubos-midnight px-1.5 py-0.5 text-[9px] text-ubos-fg-muted"
            title={insight.message}
          >
            {insight.message}
          </span>
        ))}
      </div>
    </div>
  );
}
