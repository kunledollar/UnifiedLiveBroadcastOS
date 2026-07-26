/**
 * UBOS Design System (UBDS) — Motion Tokens
 *
 * Micro interactions only. No excessive animation.
 *
 * ── UBDS Motion System (Step 91, completed Step 96) ──────────────────────
 * Motion communicates state changes, never decoration:
 *   pulse   — predicted activation / recording tally
 *   glow    — active selection / focus / intelligence highlights
 *   slide   — transitions between states
 *   fade    — dimming / de-emphasis / suppression
 *   shake   — warnings requiring immediate attention
 *   elevate — a panel rising into an active/critical/emphasized state
 */

export const ubosDuration = {
  instant: '75ms',
  fast: '120ms',
  normal: '180ms',
  slow: '280ms',
} as const;

export const ubosEasing = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** Elastic overshoot — pulses only. Mirrors --ubos-easing-spring. */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const ubosTransition = {
  hover: `color ${ubosDuration.fast} ${ubosEasing.default}, background-color ${ubosDuration.fast} ${ubosEasing.default}, border-color ${ubosDuration.fast} ${ubosEasing.default}, opacity ${ubosDuration.fast} ${ubosEasing.default}`,
  selection: `box-shadow ${ubosDuration.normal} ${ubosEasing.default}, border-color ${ubosDuration.normal} ${ubosEasing.default}`,
  fade: `opacity ${ubosDuration.normal} ${ubosEasing.out}`,
  slide: `transform ${ubosDuration.normal} ${ubosEasing.out}, opacity ${ubosDuration.normal} ${ubosEasing.out}`,
  glow: `box-shadow ${ubosDuration.slow} ${ubosEasing.inOut}`,
} as const;

/** Keyframe animation names registered in CSS */
export const ubosAnimations = {
  broadcastScan: 'ubos-broadcast-scan 4s ease-in-out infinite',
  tallyPulse: 'ubos-tally-pulse 1.5s ease-in-out infinite',
  recordingPulse: 'ubos-recording-pulse 1.2s ease-in-out infinite',
  fadeIn: 'ubos-fade-in 180ms ease-out forwards',
  slideUp: 'ubos-slide-up 180ms ease-out forwards',
  shake: 'ubos-shake 400ms ease-in-out',
  /** A panel rising into an active/critical/emphasized elevation state. */
  elevate: 'ubos-elevate 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
} as const;

export type UbosMotionPrimitive = 'pulse' | 'glow' | 'slide' | 'fade' | 'shake' | 'elevate';

/** The six UBDS motion primitives, mapped to their canonical animation/transition token. */
export const ubosMotionSystem: Record<UbosMotionPrimitive, string> = {
  pulse: ubosAnimations.tallyPulse,
  glow: ubosTransition.glow,
  slide: ubosTransition.slide,
  fade: ubosTransition.fade,
  shake: ubosAnimations.shake,
  elevate: ubosAnimations.elevate,
};

/**
 * UBDS Motion Timing Curves (Step 96) — cinematic curves, not web-app
 * defaults. Named by the state they serve rather than by shape, since the
 * same shape (e.g. ease-out) means something different for a highlight
 * than it would generically.
 */
export const ubosMotionCurves = {
  /** Fast-in / slow-out — highlights snap to attention, then settle. */
  highlight: ubosEasing.out,
  /** Slow-in / fast-out — warnings build urgency, then resolve sharply. */
  warning: ubosEasing.in,
  /** Linear — fades/de-emphasis should feel mechanical, not eased. */
  fade: 'linear',
  /** Elastic overshoot — pulses only. */
  pulse: ubosEasing.spring,
  /** Ease-in — workspace transitions accelerate into the new state. */
  workspaceTransition: ubosEasing.in,
} as const;

export type UbosMotionCurve = keyof typeof ubosMotionCurves;
export type UbosDurationToken = keyof typeof ubosDuration;
export type UbosAnimationToken = keyof typeof ubosAnimations;

/**
 * Motion + Intelligence Integration (Step 96) — how UI Intelligence
 * Integration Layer signals (Step 90) map onto motion primitives. Applied
 * in ui-intelligence.css alongside the Step 92 color, Step 93 typography,
 * Step 94 elevation, and Step 95 gradient treatments for the same signal
 * classes. Mirrors `UbosIntelligenceElevationAction` from elevation.ts.
 */
export const ubosIntelligenceMotionMap: Record<
  'highlight' | 'warn' | 'pulse' | 'prepare' | 'dim' | 'suppress' | 'elevate',
  readonly UbosMotionPrimitive[]
> = {
  highlight: ['glow', 'elevate'],
  warn: ['shake'],
  pulse: ['pulse'],
  prepare: ['glow'],
  dim: ['fade'],
  suppress: ['fade'],
  elevate: ['elevate'],
};
