/**
 * UBOS Design System v1.0 — Spacing Tokens
 *
 * 8px base grid. All layout should align to this scale.
 */

export const ubosSpacing = {
  0: '0',
  0.5: '0.125rem', // 2px — micro adjustments only
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  12: '3rem', // 48px
  16: '4rem', // 64px
} as const;

export type UbosSpacingToken = keyof typeof ubosSpacing;

/** Common layout gaps used across Control Room panels */
export const ubosLayoutSpacing = {
  panelPadding: ubosSpacing[3],
  panelGap: ubosSpacing[2],
  sectionGap: ubosSpacing[4],
  dockHeight: '2.75rem',
  statusBarHeight: '2rem',
  navWidth: '13.5rem',
  operationsWidth: '18rem',
  switcherHeight: '4.5rem',
} as const;
