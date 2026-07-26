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
 *
 * Step 107 — Studio Automation 1.0's would-execute / superseded decisions
 * (`snapshot.studioAutomation`) are merged into the Timeline zone as
 * Step 104's existing `'automation'` entries (no new zone, no new kind —
 * see `toHudTimelineEntries` in `studioAutomation.ts`). Decisions merely
 * blocked by a routine gate are diagnostic detail, not HUD content.
 */
import { workspaceState } from '../workspace/workspaceState';
import { useUiIntelligence } from '../hooks/useUiIntelligence';
import { routeGlobalIntelligenceToHud } from './hudIntelligence';
import { toHudTimelineEntries } from '../intelligence-graph/studioAutomation';
import { HUDPrimaryInsight } from './HUDPrimaryInsight';
import { HUDGuidance } from './HUDGuidance';
import { HUDWarnings } from './HUDWarnings';
import { HUDTimeline } from './HUDTimeline';
import './operator-hud.css';

const HUD_TIMELINE_LIMIT = 8;

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
    { timeline: HUD_TIMELINE_LIMIT * 2 }, // leave room before merging automation, then re-trim below
  );

  const automationTimelineEntries = toHudTimelineEntries(snapshot.studioAutomation.decisions);
  const mergedTimeline = [...intelligence.timeline, ...automationTimelineEntries]
    .sort((a, b) => b.timestamp - a.timestamp || b.confidence - a.confidence)
    .slice(0, HUD_TIMELINE_LIMIT);

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
      <HUDTimeline intelligence={mergedTimeline} uiIntegration={uiIntegration} />
    </div>
  );
}
