/**
 * UBOS Design System v1.0 — Border Radius Tokens
 *
 * Consistent, small, professional. No random rounded cards.
 */

export const ubosRadii = {
  none: '0',
  sm: '0.25rem', // 4px — buttons, badges, inputs
  md: '0.375rem', // 6px — panels, cards
  lg: '0.5rem', // 8px — monitors, large containers
  full: '9999px', // pills, status dots
} as const;

export type UbosRadiusToken = keyof typeof ubosRadii;

/** Tailwind class shortcuts */
export const ubosRadiusClasses = {
  sm: 'rounded-ubos-sm',
  md: 'rounded-ubos-md',
  lg: 'rounded-ubos-lg',
  full: 'rounded-full',
} as const;
