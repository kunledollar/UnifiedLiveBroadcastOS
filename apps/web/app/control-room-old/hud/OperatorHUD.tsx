'use client';

/**
 * Operator HUD 2.0 (Step 104) — the global intelligence overlay.
 *
 * Sits above Triad 2.0, Inspector 2.0, Program Output 2.0, and every
 * workspace (Director, Graphics, Audio, Replay, Streaming) — mounted once
 * in `WorkspaceShell`, not scoped to a single geometry zone the way
 * `TriadOperatorHud` (Step 100) is. Four intelligence zones:
 *
 *   - Primary Insight (top-center) — fused insights, predicted transitions,
 *     predicted graphics activation, predicted audio peaks, output
 *     degradation predictions.
 *   - Guidance (top-right) — actionable steps, severity-aware instructions,
 *     workspace-specific guidance.
 *   - Warning (top-left) — critical warnings, routing failures, audio
 *     clipping, output health issues.
 *   - Timeline (bottom-center) — intelligence timeline, predicted events,
 *     operator actions, automation triggers.
 *
 * Same data source every other Step 100-103 intelligence surface reads —
 * `workspaceState.intelligenceGraph.getSnapshot()` plus
 * `graph.uiIntegration` for the highlight/warn/pulse/prepare/dim/suppress/
 * elevate treatment (`hudIntelligence.ts`) — no new data plumbing.
 */
import { workspaceState } from '../workspace/workspaceState';
import { useUiIntelligence } from '../hooks/useUiIntelligence';
import {
  selectPrimaryInsights,
  selectGuidanceActions,
  selectWarnings,
  selectTimelineEntries,
} from './hudIntelligence';
import { HUDPrimaryInsight } from './HUDPrimaryInsight';
import { HUDGuidance } from './HUDGuidance';
import { HUDWarnings } from './HUDWarnings';
import { HUDTimeline } from './HUDTimeline';
import './operator-hud.css';

export function OperatorHUD() {
  // Re-render when UIIL panel state changes (orchestration feeds WIE/UIIL).
  useUiIntelligence();

  const graph = workspaceState.intelligenceGraph;
  const snapshot = graph.getSnapshot();
  const uiIntegration = graph.uiIntegration;

  const intelligence = {
    primary: selectPrimaryInsights(snapshot.latestPredictions),
    guidance: selectGuidanceActions(snapshot.latestOperatorGuidance),
    warnings: selectWarnings(snapshot.latestFusedInsights),
    timeline: selectTimelineEntries(
      snapshot.latestPredictions,
      snapshot.latestOperatorGuidance,
      snapshot.latestFusedInsights,
      graph.getAutomationTriggers(),
    ),
  };

  return (
    <div className="operator-hud" data-testid="operator-hud">
      <HUDWarnings intelligence={intelligence.warnings} uiIntegration={uiIntegration} />
      <HUDPrimaryInsight intelligence={intelligence.primary} uiIntegration={uiIntegration} />
      <HUDGuidance intelligence={intelligence.guidance} uiIntegration={uiIntegration} />
      <HUDTimeline intelligence={intelligence.timeline} uiIntegration={uiIntegration} />
    </div>
  );
}
