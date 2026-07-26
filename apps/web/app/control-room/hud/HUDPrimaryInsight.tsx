'use client';

/**
 * HUD Primary Insight Zone (Step 104) — top-center. Fused insights,
 * predicted transitions, predicted graphics activation, predicted audio
 * peaks, and output degradation predictions — the Predictive Engine's
 * (Step 86) forward-looking output, shaped by `selectPrimaryInsights`
 * (`hudIntelligence.ts`).
 */
import { ubosTypographyClasses, ubosElevationClasses } from '@ubos/ui';
import type { Prediction, PredictionCategory } from '../intelligence-graph/predictiveEngine';
import { hudZoneClassName, hudZoneCollapsed, type HudIntelligenceSource } from './hudIntelligence';

const categoryDot: Record<PredictionCategory, string> = {
  scene_transition: 'bg-ubos-selection',
  graphics_activation: 'bg-ubos-graphics',
  audio_clipping: 'bg-ubos-selection',
  routing_failure: 'bg-ubos-warning',
  output_degradation: 'bg-ubos-program',
  operator_action: 'bg-ubos-fg-disabled',
  automation_trigger: 'bg-ubos-automation',
};

export function HUDPrimaryInsight({
  intelligence,
  uiIntegration,
}: {
  intelligence: readonly Prediction[];
  uiIntegration: HudIntelligenceSource;
}) {
  if (hudZoneCollapsed('primaryInsight', uiIntegration)) return null;

  const zoneClass = hudZoneClassName('primaryInsight', uiIntegration);

  return (
    <div
      className={`hud-zone hud-zone-primary-insight ${ubosElevationClasses[3]} ${zoneClass}`}
      data-testid="hud-primary-insight"
    >
      <div className="hud-zone-header">
        <h4 className={ubosTypographyClasses.hud}>Primary Insight</h4>
      </div>
      {intelligence.length === 0 ? (
        <p className={`${ubosTypographyClasses.microText} mt-1.5`}>No active predictions</p>
      ) : (
        <ul className="hud-zone-list">
          {intelligence.map((prediction) => (
            <li key={prediction.id} className="hud-zone-item">
              <span className={`hud-zone-dot ${categoryDot[prediction.category]}`} />
              <span className={ubosTypographyClasses.intelligence} title={prediction.message}>
                {prediction.message}
              </span>
              <span className={`shrink-0 ${ubosTypographyClasses.microText}`}>
                {(prediction.confidence * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
