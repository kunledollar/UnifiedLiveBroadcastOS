'use client';

/**
 * HUD Timeline (Step 104) — bottom-center. The intelligence timeline:
 * predicted events, operator actions, and automation triggers merged
 * chronologically by `selectTimelineEntries` (`hudIntelligence.ts`).
 * Rendered as a horizontally scrolling strip (broadcast rundown style)
 * rather than a vertical list, since a timeline reads left-to-right.
 */
import { ubosTypographyClasses, ubosElevationClasses } from '@ubos/ui';
import type { HudTimelineEntry, HudTimelineEntryKind, HudIntelligenceSource } from './hudIntelligence';
import { hudZoneClassName, hudZoneCollapsed } from './hudIntelligence';

const kindDot: Record<HudTimelineEntryKind, string> = {
  prediction: 'bg-ubos-selection',
  guidance: 'bg-ubos-program',
  insight: 'bg-ubos-warning',
  automation: 'bg-ubos-automation',
};

const kindLabel: Record<HudTimelineEntryKind, string> = {
  prediction: 'Predicted',
  guidance: 'Guidance',
  insight: 'Insight',
  automation: 'Automation',
};

export function HUDTimeline({
  intelligence,
  uiIntegration,
}: {
  intelligence: readonly HudTimelineEntry[];
  uiIntegration: HudIntelligenceSource;
}) {
  if (hudZoneCollapsed('timeline', uiIntegration)) return null;

  const zoneClass = hudZoneClassName('timeline', uiIntegration);

  return (
    <div
      className={`hud-zone hud-zone-timeline ${ubosElevationClasses[3]} ${zoneClass}`}
      data-testid="hud-timeline"
    >
      <div className="hud-zone-header">
        <h4 className={ubosTypographyClasses.hud}>Intelligence Timeline</h4>
      </div>
      {intelligence.length === 0 ? (
        <p className={`${ubosTypographyClasses.microText} mt-1.5`}>No timeline activity yet</p>
      ) : (
        <ol className="hud-zone-timeline-list">
          {intelligence.map((entry) => (
            <li key={entry.id} className="hud-zone-timeline-item">
              <span className={`hud-zone-dot ${kindDot[entry.kind]}`} />
              <span className={`shrink-0 ${ubosTypographyClasses.microText} uppercase`}>
                {kindLabel[entry.kind]}
              </span>
              <span
                className={`truncate ${ubosTypographyClasses.intelligence}`}
                title={entry.message}
              >
                {entry.message}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
