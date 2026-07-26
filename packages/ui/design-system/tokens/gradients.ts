/**
 * UBOS Design System (UBDS) — Gradient System (Step 95)
 *
 * Depth is UBDS's visual physics: how panels sit in space, rise above
 * others, or recede into the background. Gradients provide the directional
 * lighting that makes that depth readable — always subtle and cinematic,
 * never neon or glossy (UBDS principle: depth must be subtle).
 *
 * "Depth" in the Step 95 spec is the same hierarchy `ubosElevation` (Step
 * 91/94) already models — the same five levels, the same intelligence
 * mapping. Step 95 does not introduce a second, parallel depth scale; it
 * formalizes the gradient *shape* each elevation level uses, since a
 * flat/linear/radial/critical gradient communicates a different kind of
 * depth even at the same shadow strength.
 *
 * Three canonical gradient types:
 *   linear          — Linear Depth Gradient. Top-down directional lighting
 *                      for elevation, active panels, and workspace shells
 *                      (Elevation Level 2).
 *   radialHighlight — Radial Highlight Gradient. A highlight blooming from
 *                      above, for intelligence highlights and predicted
 *                      transitions (Elevation Level 3).
 *   critical        — Critical Gradient. A dark-to-critical-red wash for
 *                      warnings, degraded output, and routing failures
 *                      (Elevation Level 4). Uses the shared `error`/critical
 *                      tone (see colors.ts), not Program Red — a warning is
 *                      not the same meaning as a live program tally.
 */
import { ubosColors } from './colors.js';

export type UbosGradientType = 'flat' | 'linear' | 'radialHighlight' | 'critical';

export const ubosGradients: Record<Exclude<UbosGradientType, 'flat'>, string> = {
  linear: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0) 40%)',
  radialHighlight: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.09), rgba(255,255,255,0) 60%)',
  critical: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, ${ubosColors.error.muted} 100%)`,
};

/** Which gradient shape each elevation level uses (Level 0/1 are flat). */
export const ubosElevationGradientType: Record<0 | 1 | 2 | 3 | 4, UbosGradientType> = {
  0: 'flat',
  1: 'flat',
  2: 'linear',
  3: 'radialHighlight',
  4: 'critical',
};
