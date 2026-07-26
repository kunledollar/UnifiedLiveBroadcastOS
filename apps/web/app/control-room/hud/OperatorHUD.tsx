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
 *
 * Step 105 — HUD content is now routed through Workspace Intelligence
 * Engine 2.0's global intelligence result (`routeGlobalIntelligenceToHud`)
 * rather than the raw snapshot fields directly: Primary Insight reads
 * WIE 2.0's conflict-resolved predictions, and Timeline reads WIE 2.0's
 * studio-wide timeline (which also carries output-health-change entries).
 *
 * Step 106 — Studio Intelligence 1.0's cinematic studio-wide motion
 * (`snapshot.studioMotion`) is applied to the *outer* HUD container as a
 * `data-ubos-studio-motion` token list, distinct from each zone's own
 * WIE 1.0-panel-driven treatment (`hudZoneClassName`). A studio-critical
 * moment now makes the whole overlay shake/elevate, not just one zone.
 */
import { workspaceState } from '../workspace/workspaceState';
import { useUiIntelligence } from '../hooks/useUiIntelligence';
import { routeGlobalIntelligenceToHud } from './hudIntelligence';
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

  const intelligence = routeGlobalIntelligenceToHud(
    snapshot.globalIntelligence,
    snapshot.latestOperatorGuidance,
    snapshot.latestFusedInsights,
  );

  return (
    <div
      className="operator-hud"
      data-testid="operator-hud"
      data-ubos-studio-motion={snapshot.studioMotion.join(' ') || undefined}
      data-ubos-studio-severity={snapshot.studioSeverityBand}
    >
      <HUDWarnings intelligence={intelligence.warning} uiIntegration={uiIntegration} />
      <HUDPrimaryInsight intelligence={intelligence.primary} uiIntegration={uiIntegration} />
      <HUDGuidance intelligence={intelligence.guidance} uiIntegration={uiIntegration} />
      <HUDTimeline intelligence={intelligence.timeline} uiIntegration={uiIntegration} />
    </div>
  );
}
