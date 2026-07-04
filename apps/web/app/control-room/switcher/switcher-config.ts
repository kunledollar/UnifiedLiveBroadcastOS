import type { TransitionType } from '@ubos/shared';

export type SupportedTransitionOption = {
  value: TransitionType;
  label: string;
  description: string;
};

/** Transitions supported by the current production engine */
export const supportedTransitions: SupportedTransitionOption[] = [
  { value: 'cut', label: 'CUT', description: 'Instant cut' },
  { value: 'fade', label: 'FADE', description: 'Crossfade / mix' },
  { value: 'dip', label: 'DIP', description: 'Dip to black' },
  { value: 'wipe', label: 'WIPE', description: 'Directional wipe' },
];

export const durationPresetsMs = [250, 500, 1000, 1500, 2000, 5000] as const;

export function formatDurationLabel(ms: number) {
  return (ms / 1000).toFixed(2);
}

export function transitionDisplayLabel(type: TransitionType) {
  return supportedTransitions.find((item) => item.value === type)?.label ?? type.toUpperCase();
}

export const switcherShortcuts = [
  { key: 'Space', label: 'Take' },
  { key: 'C', label: 'Cut' },
  { key: 'A', label: 'Auto' },
  { key: 'F', label: 'Fade' },
] as const;
