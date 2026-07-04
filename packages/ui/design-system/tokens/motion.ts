/**
 * UBOS Design System v1.0 — Motion Tokens
 *
 * Micro interactions only. No excessive animation.
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
} as const;

export type UbosDurationToken = keyof typeof ubosDuration;
export type UbosAnimationToken = keyof typeof ubosAnimations;
