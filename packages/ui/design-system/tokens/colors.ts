/**
 * UBOS Design System (UBDS) — Color Tokens
 *
 * Professional broadcast palette. Avoid rainbow accents.
 * Semantic colors map to production states, not decorative use.
 *
 * ── UBDS Broadcast Color Language (Step 91) ─────────────────────────────
 * Program Red      → live/on-air output
 * Preview Green    → staged/ready output
 * Active Blue      → operator selection / focus
 * Automation Purple→ automation engine / macros / scheduled actions
 * Graphics Cyan    → graphics composer / overlays / lower-thirds
 * Replay Orange    → replay engine / instant replay / clip review
 * Warning Yellow   → attention required, non-blocking
 *
 * Every broadcast hue exposes a state ramp — base, hover, active, elevated,
 * dimmed — so any panel, chip, or control tinted with that hue can express
 * interaction and depth without inventing new colors. `warning` and
 * `critical` are NOT per-hue states: they are universal override tones
 * (Warning Yellow and a critical crimson distinct from Program Red) that any
 * panel — regardless of its base hue — can escalate into, e.g. an Automation
 * panel reporting a failed macro still uses the shared `critical` tone
 * rather than a purple/red blend.
 */

export const ubosColors = {
  background: {
    /** Depth Blacks — the darkest layer, page/app background. */
    carbon: '#0a0c10',
    /** Neutral Gray Layers — standard panel surface. */
    graphite: '#111318',
    /** Neutral Gray Layers — raised/hovered surface. */
    slate: '#181b22',
    /** Neutral Gray Layers — highest neutral surface (headers, popovers). */
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

  /** Program Red — live/on-air output. */
  program: {
    DEFAULT: '#dc2626',
    base: '#dc2626',
    hover: '#ef4444',
    active: '#b91c1c',
    elevated: 'rgba(220, 38, 38, 0.22)',
    dimmed: 'rgba(220, 38, 38, 0.08)',
    muted: 'rgba(220, 38, 38, 0.12)',
    border: 'rgba(248, 113, 113, 0.55)',
    text: '#fecaca',
    glow: 'rgba(220, 38, 38, 0.22)',
  },

  /** Preview Green — staged/ready output. */
  preview: {
    DEFAULT: '#22c55e',
    base: '#22c55e',
    hover: '#4ade80',
    active: '#16a34a',
    elevated: 'rgba(34, 197, 94, 0.20)',
    dimmed: 'rgba(34, 197, 94, 0.08)',
    muted: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(74, 222, 128, 0.50)',
    text: '#bbf7d0',
    glow: 'rgba(34, 197, 94, 0.18)',
  },

  /** Active Blue — operator selection / focus. */
  selection: {
    DEFAULT: '#3b82f6',
    base: '#3b82f6',
    hover: '#60a5fa',
    active: '#2563eb',
    elevated: 'rgba(59, 130, 246, 0.22)',
    dimmed: 'rgba(59, 130, 246, 0.08)',
    muted: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(96, 165, 250, 0.55)',
    text: '#bfdbfe',
    glow: 'rgba(59, 130, 246, 0.20)',
  },

  /** Automation Purple — automation engine / macros / scheduled actions. */
  automation: {
    DEFAULT: '#a855f7',
    base: '#a855f7',
    hover: '#c084fc',
    active: '#9333ea',
    elevated: 'rgba(168, 85, 247, 0.22)',
    dimmed: 'rgba(168, 85, 247, 0.08)',
    muted: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(192, 132, 252, 0.50)',
    text: '#e9d5ff',
    glow: 'rgba(168, 85, 247, 0.20)',
  },

  /** Graphics Cyan — graphics composer / overlays / lower-thirds. */
  graphics: {
    DEFAULT: '#06b6d4',
    base: '#06b6d4',
    hover: '#22d3ee',
    active: '#0891b2',
    elevated: 'rgba(6, 182, 212, 0.22)',
    dimmed: 'rgba(6, 182, 212, 0.08)',
    muted: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(34, 211, 238, 0.50)',
    text: '#a5f3fc',
    glow: 'rgba(6, 182, 212, 0.20)',
  },

  /** Replay Orange — replay engine / instant replay / clip review. */
  replay: {
    DEFAULT: '#f97316',
    base: '#f97316',
    hover: '#fb923c',
    active: '#ea580c',
    elevated: 'rgba(249, 115, 22, 0.22)',
    dimmed: 'rgba(249, 115, 22, 0.08)',
    muted: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(251, 146, 60, 0.50)',
    text: '#fed7aa',
    glow: 'rgba(249, 115, 22, 0.20)',
  },

  /** Warning Yellow — universal override tone, not a per-hue state. */
  warning: {
    DEFAULT: '#f59e0b',
    base: '#f59e0b',
    hover: '#fbbf24',
    active: '#d97706',
    elevated: 'rgba(245, 158, 11, 0.22)',
    dimmed: 'rgba(245, 158, 11, 0.08)',
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

  /** Critical — universal override tone, distinct from Program Red. */
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
  | 'automation'
  | 'graphics'
  | 'replay'
  | 'warning'
  | 'recording'
  | 'offline'
  | 'success'
  | 'error';

/** The seven broadcast hues that expose a full base/hover/active/elevated/dimmed ramp. */
export type UbosBroadcastHue =
  | 'program'
  | 'preview'
  | 'selection'
  | 'automation'
  | 'graphics'
  | 'replay'
  | 'warning';

export const ubosBroadcastHues: readonly UbosBroadcastHue[] = [
  'program',
  'preview',
  'selection',
  'automation',
  'graphics',
  'replay',
  'warning',
] as const;

/** State ramp shared by every broadcast hue. */
export type UbosColorRampState = 'base' | 'hover' | 'active' | 'elevated' | 'dimmed';
export const ubosColorRampStates: readonly UbosColorRampState[] = [
  'base',
  'hover',
  'active',
  'elevated',
  'dimmed',
] as const;

/**
 * Operational names are deliberately separate from pigment names.  These are
 * the only status values application surfaces should need to know about.
 */
export type UbosStatus =
  | 'live'
  | 'program'
  | 'preview'
  | 'ready'
  | 'warning'
  | 'critical'
  | 'recording'
  | 'streaming'
  | 'automation'
  | 'graphics'
  | 'replay'
  | 'offline'
  | 'idle'
  | 'disabled'
  | 'selected'
  | 'hover'
  | 'focus'
  | 'error'
  | 'information'
  | 'success'
  | 'armed'
  | 'blocked';

export const ubosStatusToken: Record<UbosStatus, UbosSemanticToken | 'neutral'> = {
  live: 'program', program: 'program', preview: 'preview', ready: 'success',
  warning: 'warning', critical: 'error', recording: 'recording', streaming: 'selection',
  automation: 'automation', graphics: 'graphics', replay: 'replay',
  offline: 'offline', idle: 'neutral', disabled: 'offline', selected: 'selection',
  hover: 'selection', focus: 'selection', error: 'error', information: 'selection',
  success: 'success', armed: 'preview', blocked: 'error',
};

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
  '--ubos-program-hover': ubosColors.program.hover,
  '--ubos-program-active': ubosColors.program.active,
  '--ubos-program-elevated': ubosColors.program.elevated,
  '--ubos-program-dimmed': ubosColors.program.dimmed,
  '--ubos-program-muted': ubosColors.program.muted,
  '--ubos-program-border': ubosColors.program.border,
  '--ubos-program-text': ubosColors.program.text,
  '--ubos-program-glow': ubosColors.program.glow,

  '--ubos-preview': ubosColors.preview.DEFAULT,
  '--ubos-preview-hover': ubosColors.preview.hover,
  '--ubos-preview-active': ubosColors.preview.active,
  '--ubos-preview-elevated': ubosColors.preview.elevated,
  '--ubos-preview-dimmed': ubosColors.preview.dimmed,
  '--ubos-preview-muted': ubosColors.preview.muted,
  '--ubos-preview-border': ubosColors.preview.border,
  '--ubos-preview-text': ubosColors.preview.text,
  '--ubos-preview-glow': ubosColors.preview.glow,

  '--ubos-selection': ubosColors.selection.DEFAULT,
  '--ubos-selection-hover': ubosColors.selection.hover,
  '--ubos-selection-active': ubosColors.selection.active,
  '--ubos-selection-elevated': ubosColors.selection.elevated,
  '--ubos-selection-dimmed': ubosColors.selection.dimmed,
  '--ubos-selection-muted': ubosColors.selection.muted,
  '--ubos-selection-border': ubosColors.selection.border,

  '--ubos-automation': ubosColors.automation.DEFAULT,
  '--ubos-automation-hover': ubosColors.automation.hover,
  '--ubos-automation-active': ubosColors.automation.active,
  '--ubos-automation-elevated': ubosColors.automation.elevated,
  '--ubos-automation-dimmed': ubosColors.automation.dimmed,
  '--ubos-automation-muted': ubosColors.automation.muted,
  '--ubos-automation-border': ubosColors.automation.border,
  '--ubos-automation-text': ubosColors.automation.text,
  '--ubos-automation-glow': ubosColors.automation.glow,

  '--ubos-graphics': ubosColors.graphics.DEFAULT,
  '--ubos-graphics-hover': ubosColors.graphics.hover,
  '--ubos-graphics-active': ubosColors.graphics.active,
  '--ubos-graphics-elevated': ubosColors.graphics.elevated,
  '--ubos-graphics-dimmed': ubosColors.graphics.dimmed,
  '--ubos-graphics-muted': ubosColors.graphics.muted,
  '--ubos-graphics-border': ubosColors.graphics.border,
  '--ubos-graphics-text': ubosColors.graphics.text,
  '--ubos-graphics-glow': ubosColors.graphics.glow,

  '--ubos-replay': ubosColors.replay.DEFAULT,
  '--ubos-replay-hover': ubosColors.replay.hover,
  '--ubos-replay-active': ubosColors.replay.active,
  '--ubos-replay-elevated': ubosColors.replay.elevated,
  '--ubos-replay-dimmed': ubosColors.replay.dimmed,
  '--ubos-replay-muted': ubosColors.replay.muted,
  '--ubos-replay-border': ubosColors.replay.border,
  '--ubos-replay-text': ubosColors.replay.text,
  '--ubos-replay-glow': ubosColors.replay.glow,

  '--ubos-warning': ubosColors.warning.DEFAULT,
  '--ubos-warning-hover': ubosColors.warning.hover,
  '--ubos-warning-active': ubosColors.warning.active,
  '--ubos-warning-elevated': ubosColors.warning.elevated,
  '--ubos-warning-dimmed': ubosColors.warning.dimmed,
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
