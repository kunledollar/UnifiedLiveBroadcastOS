/**
 * UBOS Design System (UBDS) — Elevation Tokens (Step 91, refined Step 94)
 *
 * Panel elevation model — the visual hierarchy engine of UBDS. Elevation
 * communicates importance: higher elevation = higher priority. Depth over
 * decoration: shadows, gradients, and borders exist to communicate
 * hierarchy, never for ornamentation alone.
 *
 * Level 0 — Background Layer   (workspace shell, neutral / non-interactive
 *                                zones; nothing floats)
 * Level 1 — Standard Panel     (normal panels, inactive sections,
 *                                non-priority UI)
 * Level 2 — Active Panel       (selected panel, operator focus, active
 *                                workspace)
 * Level 3 — Highlighted Panel  (intelligence-highlighted zones, predicted
 *                                transitions, predicted activations)
 * Level 4 — Critical Panel     (warnings, degraded output, routing
 *                                failures, audio clipping, live program
 *                                danger)
 */
import { ubosColors } from './colors.js';
import { ubosShadows } from './shadows.js';

export type UbosElevationLevel = 0 | 1 | 2 | 3 | 4;

export interface UbosElevationToken {
  /** Background surface for this level. */
  background: string;
  /** Box-shadow stack (layering + optional glow). */
  shadow: string;
  /** Border color for this level. */
  border: string;
  /** Border width in pixels — only Level 4 uses a thick (2px) border. */
  borderWidth: 1 | 2;
  /** Gradient reinforcing depth. Flat (undefined) at Level 0/1. */
  gradient?: string;
}

export const ubosElevation: Record<UbosElevationLevel, UbosElevationToken> = {
  0: {
    background: ubosColors.background.carbon,
    shadow: ubosShadows.none,
    border: 'transparent',
    borderWidth: 1,
  },
  1: {
    background: ubosColors.background.graphite,
    shadow: ubosShadows.soft,
    border: ubosColors.border.subtle,
    borderWidth: 1,
    // Level 1 is flat — no gradient.
  },
  2: {
    background: ubosColors.background.slate,
    shadow: ubosShadows.medium,
    border: ubosColors.border.default,
    borderWidth: 1,
    // Subtle top-light gradient.
    gradient: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0) 40%)',
  },
  3: {
    background: ubosColors.background.midnight,
    shadow: `${ubosShadows.strong}, ${ubosShadows.selectionGlow}`,
    border: ubosColors.selection.border,
    borderWidth: 1,
    // Directional gradient — light source implied from above.
    gradient: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0) 45%)',
  },
  4: {
    background: ubosColors.background.carbon,
    shadow: `${ubosShadows.hard}, 0 0 0 1px ${ubosColors.error.border}, 0 0 20px ${ubosColors.error.muted}`,
    border: ubosColors.error.border,
    borderWidth: 2,
    // High-contrast gradient — bright top, near-black bottom.
    gradient: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(0,0,0,0.4) 100%)',
  },
};

/** Tailwind class shortcuts — background + shadow + border (color + width) for each level. */
export const ubosElevationClasses: Record<UbosElevationLevel, string> = {
  0: 'bg-ubos-carbon shadow-none border border-transparent',
  1: 'bg-ubos-graphite shadow-ubos-elevation-1 border border-ubos-border-subtle',
  2: 'bg-ubos-slate shadow-ubos-elevation-2 border border-ubos-border',
  3: 'bg-ubos-midnight shadow-ubos-elevation-3 border border-ubos-selection-border',
  4: 'bg-ubos-carbon shadow-ubos-elevation-4 border-2 border-ubos-error-border',
};

export const ubosElevationLevels: readonly UbosElevationLevel[] = [0, 1, 2, 3, 4] as const;

/**
 * Elevation + Intelligence Integration (Step 94) — how UI Intelligence
 * Integration Layer signals (Step 90) map onto elevation levels. Applied in
 * ui-intelligence.css alongside the Step 92 color and Step 93 typography
 * treatments for the same signal classes.
 */
export type UbosIntelligenceElevationAction =
  | 'highlight'
  | 'warn'
  | 'pulse'
  | 'prepare'
  | 'dim'
  | 'suppress'
  | 'elevate';

export const ubosIntelligenceElevationMap: Record<UbosIntelligenceElevationAction, UbosElevationLevel> = {
  highlight: 3,
  warn: 4,
  pulse: 3,
  prepare: 2,
  dim: 1,
  suppress: 0,
  elevate: 3,
};
