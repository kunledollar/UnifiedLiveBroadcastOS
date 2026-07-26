/**
 * UBOS Design System v1.0 — Typography Tokens
 *
 * Professional, readable hierarchy. Uppercase reserved for:
 * LIVE, REC, PROGRAM, PREVIEW
 */

export const ubosFontFamily = {
  sans: [
    'Inter',
    'ui-sans-serif',
    'system-ui',
    '-apple-system',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ],
  mono: [
    'JetBrains Mono',
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
} as const;

export const ubosFontSize = {
  display: ['1.375rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
  section: ['0.8125rem', { lineHeight: '1.35', letterSpacing: '0.01em', fontWeight: '600' }],
  panel: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.005em', fontWeight: '500' }],
  body: ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
  caption: ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
  metadata: ['0.625rem', { lineHeight: '1.35', letterSpacing: '0.04em', fontWeight: '500' }],
  mono: ['0.6875rem', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '400' }],
} as const;

/** Tailwind class maps for typography roles */
export const ubosTypographyClasses = {
  display: 'text-[1.375rem] font-semibold leading-tight tracking-tight text-ubos-fg-primary',
  section: 'text-[0.8125rem] font-semibold leading-snug text-ubos-fg-primary',
  panel: 'text-xs font-medium leading-snug text-ubos-fg-secondary',
  body: 'text-[0.8125rem] font-normal leading-normal text-ubos-fg-primary',
  caption: 'text-[0.6875rem] font-medium leading-snug text-ubos-fg-secondary',
  metadata: 'text-[0.625rem] font-medium leading-tight tracking-wide text-ubos-fg-muted',
  mono: 'font-mono text-[0.6875rem] leading-snug text-ubos-fg-secondary',
  /** Reserved uppercase labels — use only for LIVE, REC, PROGRAM, PREVIEW */
  broadcastLabel:
    'text-[0.625rem] font-bold uppercase tracking-[0.12em] text-ubos-fg-secondary',
  /**
   * UBDS canonical hierarchy (Step 91) — Title, Section Label, Body,
   * Micro-text. These are named aliases layered on the existing roles above
   * so consumers can migrate incrementally without breaking call sites.
   */
  /** Title — uppercase, medium weight. Panel/workspace-level headings. */
  title: 'text-[1rem] font-medium uppercase tracking-[0.04em] leading-tight text-ubos-fg-primary',
  /** Section Label — uppercase, small caps. Groups related controls. */
  sectionLabel:
    'text-[0.6875rem] font-semibold uppercase tracking-[0.08em] leading-snug text-ubos-fg-secondary',
  /** Micro-text — for indicators, timestamps, and inline telemetry. Minimal
   * weight distinguishes it from body/section text at a glance. */
  microText: 'text-[0.625rem] font-light leading-tight text-ubos-fg-muted',
  /**
   * HUD Text (Step 93) — operator HUD overlays rendered on top of live
   * video, where content behind the text is unpredictable. Bold weight and
   * a subtle drop shadow keep it legible on both bright and dark footage.
   * Deliberately has no baked-in color so callers compose it with the
   * relevant semantic color class (color-semantic aware, e.g.
   * `text-ubos-program-text` for a live tally).
   */
  hud: 'text-[0.8125rem] font-bold uppercase tracking-[0.08em] leading-tight [text-shadow:0_0_4px_rgba(0,0,0,0.6)]',
  /**
   * Intelligence Text (Step 93) — fused insights, operator guidance, and
   * predictive hints. Medium weight, slightly smaller than body. Combine
   * with a UIIL signal class (see ui-intelligence.css) for the
   * warning-is-bold / prediction-is-italic treatments described in the
   * Step 93 spec, rather than baking a single fixed style here.
   */
  intelligence: 'text-[0.8125rem] font-medium leading-normal text-ubos-fg-secondary',
} as const;

export type UbosTypographyRole = keyof typeof ubosTypographyClasses;

/**
 * UBDS canonical typography hierarchy (Step 93) — Title, Section Label,
 * Body, Micro-text, HUD Text, Intelligence Text.
 */
export type UbdsTypographyRole =
  | 'title'
  | 'sectionLabel'
  | 'body'
  | 'microText'
  | 'hud'
  | 'intelligence';
export const ubdsTypographyRoles: readonly UbdsTypographyRole[] = [
  'title',
  'sectionLabel',
  'body',
  'microText',
  'hud',
  'intelligence',
] as const;
