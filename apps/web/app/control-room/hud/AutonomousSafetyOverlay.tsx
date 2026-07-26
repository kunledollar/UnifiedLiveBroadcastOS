'use client';

/**
 * Autonomous Safety Overlay + Stabilization Indicators (Step 110,
 * components #1 and #5).
 *
 * A subtle cinematic overlay that appears behind the HUD zones whenever
 * autonomy is active — deep black vignette, soft blue glow, communicating
 * "autonomy is active, the system is monitoring safety, the operator can
 * override" — plus the four named stabilizer chips (routing/audio/output/
 * graphics), glowing blue while stabilizing, pulsing yellow while
 * recovering, pulsing red while critical, per Studio Intelligence 1.0's
 * real per-dimension health (Step 106).
 *
 * Renders nothing while autonomy is disabled (the safe default).
 */
import { ubosColors, ubosTypographyClasses } from '@ubos/ui';
import type { AutonomousSafetyUXResult, StabilizerGlow } from './autonomousSafetyUX';

const STABILIZER_GLOW_COLOR: Record<StabilizerGlow, string> = {
  stabilizing: ubosColors.selection.DEFAULT,
  recovering: ubosColors.warning.DEFAULT,
  critical: ubosColors.error.DEFAULT,
  none: 'transparent',
};

const STABILIZER_ANIMATION: Record<StabilizerGlow, string | undefined> = {
  stabilizing: undefined,
  recovering: 'ubos-auto-pulse 1.2s ease-in-out infinite',
  critical: 'ubos-shake 400ms ease-in-out infinite',
  none: undefined,
};

export function AutonomousSafetyOverlay({ safety }: { safety: AutonomousSafetyUXResult }) {
  if (!safety.overlay.active) return null;

  return (
    <div
      className="autonomous-safety-overlay"
      data-testid="autonomous-safety-overlay"
      data-ubos-vignette={safety.overlay.vignetteIntensity}
    >
      <div className="autonomous-stabilizer-row" data-testid="autonomous-stabilizer-row">
        {safety.stabilizers.map((indicator) => (
          <span
            key={indicator.dimension}
            className="autonomous-stabilizer-chip"
            style={{
              boxShadow: `0 0 10px ${STABILIZER_GLOW_COLOR[indicator.glow]}`,
              animation: STABILIZER_ANIMATION[indicator.glow],
            }}
            data-ubos-stabilizer-glow={indicator.glow}
            title={`${indicator.dimension}: ${indicator.glow}`}
          >
            <span className={ubosTypographyClasses.microText}>{indicator.dimension}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
