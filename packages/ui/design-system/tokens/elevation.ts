/**
 * UBOS Design System (UBDS) — Elevation Tokens (Step 91)
 *
 * Panel elevation model. Depth over decoration: shadows, gradients, and
 * borders exist to communicate hierarchy, never for ornamentation alone.
 *
 * Level 0 — background        (the app surface itself, nothing floats)
 * Level 1 — standard panel    (default resting panel)
 * Level 2 — active panel      (panel with focus or an in-progress operation)
 * Level 3 — highlighted panel (operator-selected / emphasized panel)
 * Level 4 — critical panel    (failure, blocking alert, or on-air panel)
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
  /** Optional top-light gradient reinforcing the raised feel. */
  gradient?: string;
}

export const ubosElevation: Record<UbosElevationLevel, UbosElevationToken> = {
  0: {
    background: ubosColors.background.carbon,
    shadow: ubosShadows.none,
    border: 'transparent',
  },
  1: {
    background: ubosColors.background.graphite,
    shadow: ubosShadows.panel,
    border: ubosColors.border.subtle,
  },
  2: {
    background: ubosColors.background.slate,
    shadow: ubosShadows.raised,
    border: ubosColors.border.default,
    gradient: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0) 40%)',
  },
  3: {
    background: ubosColors.background.midnight,
    shadow: `${ubosShadows.raised}, ${ubosShadows.selectionGlow}`,
    border: ubosColors.selection.border,
    gradient: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%)',
  },
  4: {
    background: ubosColors.background.midnight,
    shadow: `${ubosShadows.raised}, 0 0 0 1px ${ubosColors.error.border}, 0 0 20px ${ubosColors.error.muted}`,
    border: ubosColors.error.border,
    gradient: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0) 45%)',
  },
};

/** Tailwind class shortcuts — background + shadow + border for each level. */
export const ubosElevationClasses: Record<UbosElevationLevel, string> = {
  0: 'bg-ubos-carbon shadow-none border-transparent',
  1: 'bg-ubos-graphite shadow-ubos-elevation-1 border-ubos-border-subtle',
  2: 'bg-ubos-slate shadow-ubos-elevation-2 border-ubos-border',
  3: 'bg-ubos-midnight shadow-ubos-elevation-3 border-ubos-selection-border',
  4: 'bg-ubos-midnight shadow-ubos-elevation-4 border-ubos-error-border',
};

export const ubosElevationLevels: readonly UbosElevationLevel[] = [0, 1, 2, 3, 4] as const;
