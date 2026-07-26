'use client';

/**
 * HUD Warning Zone (Step 104) — top-left. Critical warnings, routing
 * failures, audio clipping, and output health issues — realized (not
 * predicted) Insight Fusion Engine (Step 87) output at `critical`/`warning`
 * severity, shaped by `selectWarnings` (`hudIntelligence.ts`). Always
 * rendered at UBDS Elevation Level 4 (Critical Panel) per the Step 104
 * spec ("warnings: Level 4"), distinct from the rest of the HUD's base
 * Level 3.
 */
import { ubosTypographyClasses, ubosElevationClasses } from '@ubos/ui';
import type { FusedInsight, FusionSeverity } from '../intelligence-graph/insightFusionEngine';
import { hudZoneClassName, hudZoneCollapsed, type HudIntelligenceSource } from './hudIntelligence';

const severityDot: Record<FusionSeverity, string> = {
  critical: 'bg-ubos-error',
  warning: 'bg-ubos-warning',
  prediction: 'bg-ubos-selection',
  info: 'bg-ubos-fg-disabled',
};

export function HUDWarnings({
  intelligence,
  uiIntegration,
}: {
  intelligence: readonly FusedInsight[];
  uiIntegration: HudIntelligenceSource;
}) {
  if (hudZoneCollapsed('warning', uiIntegration)) return null;

  const zoneClass = hudZoneClassName('warning', uiIntegration);

  return (
    <div
      className={`hud-zone hud-zone-warning ${ubosElevationClasses[4]} ${zoneClass}`}
      data-testid="hud-warnings"
    >
      <div className="hud-zone-header">
        <h4 className={ubosTypographyClasses.hud}>Warnings</h4>
      </div>
      {intelligence.length === 0 ? (
        <p className={`${ubosTypographyClasses.microText} mt-1.5`}>No active warnings</p>
      ) : (
        <ul className="hud-zone-list">
          {intelligence.map((insight) => (
            <li key={insight.id} className="hud-zone-item">
              <span className={`hud-zone-dot ${severityDot[insight.severity]}`} />
              <span className={ubosTypographyClasses.intelligence} title={insight.message}>
                {insight.message}
              </span>
              <span className={`shrink-0 ${ubosTypographyClasses.microText}`}>
                {(insight.confidence * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
