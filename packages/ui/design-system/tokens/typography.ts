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
} as const;

export type UbosTypographyRole = keyof typeof ubosTypographyClasses;
