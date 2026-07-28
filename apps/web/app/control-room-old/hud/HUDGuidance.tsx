'use client';

/**
 * HUD Guidance Zone (Step 104) — top-right. Actionable steps, severity-aware
 * instructions, and workspace-specific guidance from the Operator Guidance
 * Engine (Step 88), shaped by `selectGuidanceActions` (`hudIntelligence.ts`).
 * Same severity → color mapping `TriadOperatorHud` (Step 100) already
 * established for `GuidanceActionType`.
 */
import { ubosTypographyClasses, ubosElevationClasses } from '@ubos/ui';
import type { GuidanceAction, GuidanceActionType } from '../intelligence-graph/operatorGuidanceEngine';
import { hudZoneClassName, hudZoneCollapsed, type HudIntelligenceSource } from './hudIntelligence';

const severityDot: Record<GuidanceActionType, string> = {
  'Critical Action': 'bg-ubos-program',
  'Warning Action': 'bg-ubos-warning',
  'Prepare Action': 'bg-ubos-selection',
  Monitor: 'bg-ubos-fg-disabled',
};

export function HUDGuidance({
  intelligence,
  uiIntegration,
}: {
  intelligence: readonly GuidanceAction[];
  uiIntegration: HudIntelligenceSource;
}) {
  if (hudZoneCollapsed('guidance', uiIntegration)) return null;

  const zoneClass = hudZoneClassName('guidance', uiIntegration);

  return (
    <div
      className={`hud-zone hud-zone-guidance ${ubosElevationClasses[3]} ${zoneClass}`}
      data-testid="hud-guidance"
    >
      <div className="hud-zone-header">
        <h4 className={ubosTypographyClasses.hud}>Guidance</h4>
        {intelligence[0] && (
          <span className={ubosTypographyClasses.microText}>{intelligence[0].role}</span>
        )}
      </div>
      {intelligence.length === 0 ? (
        <p className={`${ubosTypographyClasses.microText} mt-1.5`}>No active guidance</p>
      ) : (
        <ul className="hud-zone-list">
          {intelligence.map((action) => (
            <li key={action.id} className="hud-zone-item">
              <span className={`hud-zone-dot ${severityDot[action.severity]}`} />
              <span className={ubosTypographyClasses.intelligence} title={action.message}>
                {action.message}
              </span>
              <span className={`shrink-0 ${ubosTypographyClasses.microText}`}>
                {(action.confidence * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
