/**
 * UBOS Design System (UBDS) — Spacing Tokens (Step 91, completed Step 97)
 *
 * 4px base grid. All layout should align to this scale. Spacing is UBOS's
 * breathing room: how dense the UI feels, how fast operators can scan it,
 * and how intelligence signals stand out without cluttering the frame.
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

/**
 * UBDS Spacing Scale (Step 91, sixth level added Step 97) — named aliases
 * for the 4px rhythm grid. Use these names when documenting or reasoning
 * about rhythm; the numeric `ubosSpacing` scale remains the source of truth
 * for values.
 */
export const ubosRhythm = {
  micro: ubosSpacing[1], // 4px  — micro-text, indicators
  small: ubosSpacing[2], // 8px  — labels, metadata
  medium: ubosSpacing[3], // 12px — standard padding
  large: ubosSpacing[4], // 16px — panel padding
  xlarge: ubosSpacing[6], // 24px — workspace spacing
  xxlarge: ubosSpacing[8], // 32px — director mode spacing
} as const;

export type UbosRhythmToken = keyof typeof ubosRhythm;

/**
 * UBDS Padding Hierarchy (Step 97) — padding communicates importance:
 * more important panels get more breathing room. Distinct from the raw
 * spacing scale above (which sizes gaps/margins) — this is specifically
 * about a panel's *own* inset from its border to its content.
 */
export const ubosPadding = {
  /** Tight — metadata, micro-text, indicators. */
  tight: ubosRhythm.small, // 8px
  /** Standard — normal panels, inspector sections. */
  standard: ubosRhythm.medium, // 12px
  /** Spacious — active panels, highlighted panels. */
  spacious: ubosRhythm.large, // 16px
  /** Cinematic — director workspace, program output, replay workspace. */
  cinematic: ubosRhythm.xlarge, // 24px
} as const;

export type UbosPaddingLevel = keyof typeof ubosPadding;

/**
 * UBDS Density Modes (Step 97) — the same spacing scale, scaled for the
 * operator's context. Multipliers apply to any spacing value via
 * `ubosScaleSpacing` below, rather than requiring a second parallel scale
 * per mode.
 */
export const ubosDensity = {
  /** Compact — solo streamers, laptop setups, small monitors. */
  compact: 0.75,
  /** Standard — most operators, standard control rooms. */
  standard: 1,
  /** Director — large monitors, multi-monitor setups, high-clarity workflows. */
  director: 1.2,
} as const;

export type UbosDensityMode = keyof typeof ubosDensity;

/**
 * Scale a rem-based spacing value by a density multiplier, returning a rem
 * string. Rounds to 3 decimal places to avoid float noise in generated CSS.
 */
export function ubosScaleSpacing(remValue: string, density: UbosDensityMode): string {
  const multiplier = ubosDensity[density];
  const match = /^(-?[\d.]+)rem$/.exec(remValue);
  if (!match) return remValue;
  const scaled = Math.round(parseFloat(match[1]!) * multiplier * 1000) / 1000;
  return `${scaled}rem`;
}

/**
 * Spacing + Intelligence Integration (Step 97) — how UI Intelligence
 * Integration Layer signals (Step 90) map onto padding. Applied in
 * ui-intelligence.css alongside the Step 92-96 color/text/elevation/
 * gradient/motion treatments for the same signal classes. `pulse` has no
 * single static value — it animates a slight expansion instead (see
 * ui-intelligence.css), matching motion primitive "pulse" (Step 96)
 * rather than a fixed tier.
 */
export const ubosIntelligenceSpacingMap = {
  highlight: ubosPadding.spacious, // 16px
  warn: ubosPadding.cinematic, // 24px
  prepare: ubosRhythm.medium, // 12px
  dim: ubosRhythm.small, // 8px
  suppress: ubosRhythm.micro, // 4px
  elevate: ubosRhythm.large, // 16px
} as const;

export type UbosIntelligenceSpacingAction = keyof typeof ubosIntelligenceSpacingMap;

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
