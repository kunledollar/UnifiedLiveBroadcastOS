/**
 * UBOS Design System v1.0 — Color Tokens
 *
 * Professional broadcast palette. Avoid rainbow accents.
 * Semantic colors map to production states, not decorative use.
 */

export const ubosColors = {
  background: {
    carbon: '#0a0c10',
    graphite: '#111318',
    slate: '#181b22',
    midnight: '#1e222b',
  },

  foreground: {
    primary: '#e8eaed',
    secondary: '#9aa0ab',
    muted: '#6b7280',
    disabled: '#4b5563',
  },

  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.10)',
    strong: 'rgba(255, 255, 255, 0.16)',
    focus: 'rgba(59, 130, 246, 0.55)',
  },

  program: {
    DEFAULT: '#dc2626',
    muted: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(248, 113, 113, 0.55)',
    text: '#fecaca',
    glow: 'rgba(220, 38, 38, 0.22)',
  },

  preview: {
    DEFAULT: '#22c55e',
    muted: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(74, 222, 128, 0.50)',
    text: '#bbf7d0',
    glow: 'rgba(34, 197, 94, 0.18)',
  },

  selection: {
    DEFAULT: '#3b82f6',
    muted: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(96, 165, 250, 0.55)',
    text: '#bfdbfe',
    glow: 'rgba(59, 130, 246, 0.20)',
  },

  warning: {
    DEFAULT: '#f59e0b',
    muted: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(251, 191, 36, 0.45)',
    text: '#fde68a',
  },

  recording: {
    DEFAULT: '#ef4444',
    muted: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(248, 113, 113, 0.60)',
    text: '#fecaca',
    pulse: 'rgba(239, 68, 68, 0.35)',
  },

  offline: {
    DEFAULT: '#6b7280',
    muted: 'rgba(107, 114, 128, 0.10)',
    border: 'rgba(107, 114, 128, 0.35)',
    text: '#9ca3af',
  },

  success: {
    DEFAULT: '#10b981',
    muted: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(52, 211, 153, 0.45)',
    text: '#a7f3d0',
  },

  error: {
    DEFAULT: '#be123c',
    muted: 'rgba(190, 18, 60, 0.12)',
    border: 'rgba(244, 63, 94, 0.50)',
    text: '#fda4af',
  },

  accent: {
    DEFAULT: '#3b82f6',
    hover: '#60a5fa',
    muted: 'rgba(59, 130, 246, 0.10)',
  },
} as const;

export type UbosBackgroundToken = keyof typeof ubosColors.background;
export type UbosSemanticToken =
  | 'program'
  | 'preview'
  | 'selection'
  | 'warning'
  | 'recording'
  | 'offline'
  | 'success'
  | 'error';

/** CSS custom property names for runtime theming */
export const ubosColorVars = {
  '--ubos-bg-carbon': ubosColors.background.carbon,
  '--ubos-bg-graphite': ubosColors.background.graphite,
  '--ubos-bg-slate': ubosColors.background.slate,
  '--ubos-bg-midnight': ubosColors.background.midnight,

  '--ubos-fg-primary': ubosColors.foreground.primary,
  '--ubos-fg-secondary': ubosColors.foreground.secondary,
  '--ubos-fg-muted': ubosColors.foreground.muted,

  '--ubos-border-subtle': ubosColors.border.subtle,
  '--ubos-border-default': ubosColors.border.default,
  '--ubos-border-strong': ubosColors.border.strong,

  '--ubos-program': ubosColors.program.DEFAULT,
  '--ubos-program-muted': ubosColors.program.muted,
  '--ubos-program-border': ubosColors.program.border,
  '--ubos-program-text': ubosColors.program.text,
  '--ubos-program-glow': ubosColors.program.glow,

  '--ubos-preview': ubosColors.preview.DEFAULT,
  '--ubos-preview-muted': ubosColors.preview.muted,
  '--ubos-preview-border': ubosColors.preview.border,
  '--ubos-preview-text': ubosColors.preview.text,
  '--ubos-preview-glow': ubosColors.preview.glow,

  '--ubos-selection': ubosColors.selection.DEFAULT,
  '--ubos-selection-muted': ubosColors.selection.muted,
  '--ubos-selection-border': ubosColors.selection.border,

  '--ubos-warning': ubosColors.warning.DEFAULT,
  '--ubos-warning-muted': ubosColors.warning.muted,

  '--ubos-recording': ubosColors.recording.DEFAULT,
  '--ubos-recording-muted': ubosColors.recording.muted,

  '--ubos-offline': ubosColors.offline.DEFAULT,
  '--ubos-offline-muted': ubosColors.offline.muted,

  '--ubos-success': ubosColors.success.DEFAULT,
  '--ubos-success-muted': ubosColors.success.muted,

  '--ubos-error': ubosColors.error.DEFAULT,
  '--ubos-error-muted': ubosColors.error.muted,

  '--ubos-accent': ubosColors.accent.DEFAULT,
  '--ubos-accent-hover': ubosColors.accent.hover,
} as const;
