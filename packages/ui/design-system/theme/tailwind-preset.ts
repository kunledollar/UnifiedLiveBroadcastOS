import type { Config } from 'tailwindcss';
import { ubosColors } from '../tokens/colors.js';
import { ubosFontFamily, ubosFontSize } from '../tokens/typography.js';
import { ubosSpacing } from '../tokens/spacing.js';
import { ubosRadii } from '../tokens/radii.js';
import { ubosShadows } from '../tokens/shadows.js';
import { ubosDuration, ubosEasing } from '../tokens/motion.js';

/**
 * UBOS Design System v1.0 — Tailwind Preset
 *
 * Import in apps/web/tailwind.config.ts:
 *   import ubosPreset from '../../packages/ui/design-system/theme/tailwind-preset';
 *   export default { presets: [ubosPreset], ... }
 */
const ubosPreset = {
  theme: {
    extend: {
      colors: {
        ubos: {
          carbon: ubosColors.background.carbon,
          graphite: ubosColors.background.graphite,
          slate: ubosColors.background.slate,
          midnight: ubosColors.background.midnight,
          fg: {
            primary: 'var(--ubos-fg-primary)',
            secondary: 'var(--ubos-fg-secondary)',
            muted: 'var(--ubos-fg-muted)',
            disabled: 'var(--ubos-fg-disabled)',
          },
          border: {
            subtle: 'var(--ubos-border-subtle)',
            DEFAULT: 'var(--ubos-border-default)',
            strong: 'var(--ubos-border-strong)',
            focus: 'var(--ubos-border-focus)',
          },
          program: {
            DEFAULT: 'var(--ubos-program)',
            muted: 'var(--ubos-program-muted)',
            border: 'var(--ubos-program-border)',
            text: 'var(--ubos-program-text)',
          },
          preview: {
            DEFAULT: 'var(--ubos-preview)',
            muted: 'var(--ubos-preview-muted)',
            border: 'var(--ubos-preview-border)',
            text: 'var(--ubos-preview-text)',
          },
          selection: {
            DEFAULT: 'var(--ubos-selection)',
            muted: 'var(--ubos-selection-muted)',
            border: 'var(--ubos-selection-border)',
            text: 'var(--ubos-selection-text)',
          },
          warning: {
            DEFAULT: 'var(--ubos-warning)',
            muted: 'var(--ubos-warning-muted)',
            border: 'var(--ubos-warning-border)',
            text: 'var(--ubos-warning-text)',
          },
          recording: {
            DEFAULT: 'var(--ubos-recording)',
            muted: 'var(--ubos-recording-muted)',
            border: 'var(--ubos-recording-border)',
            text: 'var(--ubos-recording-text)',
          },
          offline: {
            DEFAULT: 'var(--ubos-offline)',
            muted: 'var(--ubos-offline-muted)',
            border: 'var(--ubos-offline-border)',
            text: 'var(--ubos-offline-text)',
          },
          success: {
            DEFAULT: 'var(--ubos-success)',
            muted: 'var(--ubos-success-muted)',
            border: 'var(--ubos-success-border)',
            text: 'var(--ubos-success-text)',
          },
          error: {
            DEFAULT: 'var(--ubos-error)',
            muted: 'var(--ubos-error-muted)',
            border: 'var(--ubos-error-border)',
            text: 'var(--ubos-error-text)',
          },
          accent: {
            DEFAULT: 'var(--ubos-accent)',
            hover: 'var(--ubos-accent-hover)',
            muted: 'var(--ubos-accent-muted)',
          },
        },
      },
      fontFamily: {
        sans: [...ubosFontFamily.sans],
        mono: [...ubosFontFamily.mono],
      },
      fontSize: {
        'ubos-display': [...ubosFontSize.display],
        'ubos-section': [...ubosFontSize.section],
        'ubos-panel': [...ubosFontSize.panel],
        'ubos-body': [...ubosFontSize.body],
        'ubos-caption': [...ubosFontSize.caption],
        'ubos-metadata': [...ubosFontSize.metadata],
        'ubos-mono': [...ubosFontSize.mono],
      },
      spacing: {
        'ubos-1': ubosSpacing[1],
        'ubos-2': ubosSpacing[2],
        'ubos-3': ubosSpacing[3],
        'ubos-4': ubosSpacing[4],
        'ubos-6': ubosSpacing[6],
        'ubos-8': ubosSpacing[8],
        'ubos-12': ubosSpacing[12],
        'ubos-16': ubosSpacing[16],
      },
      borderRadius: {
        'ubos-sm': ubosRadii.sm,
        'ubos-md': ubosRadii.md,
        'ubos-lg': ubosRadii.lg,
      },
      boxShadow: {
        'ubos-inset': ubosShadows.inset,
        'ubos-panel': ubosShadows.panel,
        'ubos-raised': ubosShadows.raised,
        'ubos-monitor': ubosShadows.monitor,
        'ubos-program-glow': ubosShadows.programGlow,
        'ubos-preview-glow': ubosShadows.previewGlow,
        'ubos-selection-glow': ubosShadows.selectionGlow,
      },
      transitionDuration: {
        'ubos-instant': ubosDuration.instant,
        'ubos-fast': ubosDuration.fast,
        'ubos-normal': ubosDuration.normal,
        'ubos-slow': ubosDuration.slow,
      },
      transitionTimingFunction: {
        'ubos-default': ubosEasing.default,
        'ubos-in': ubosEasing.in,
        'ubos-out': ubosEasing.out,
        'ubos-in-out': ubosEasing.inOut,
      },
      animation: {
        'ubos-broadcast-scan': 'ubos-broadcast-scan 4s ease-in-out infinite',
        'ubos-tally-pulse': 'ubos-tally-pulse 1.5s ease-in-out infinite',
        'ubos-recording-pulse': 'ubos-recording-pulse 1.2s ease-in-out infinite',
        'ubos-fade-in': 'ubos-fade-in 180ms ease-out forwards',
        'ubos-slide-up': 'ubos-slide-up 180ms ease-out forwards',
        // UBOS 3.15C additions
        'ubos-panel-appear': 'ubos-panel-appear 180ms cubic-bezier(0,0,0.2,1) forwards',
        'ubos-status-pulse': 'ubos-status-pulse 1.5s ease-in-out infinite',
        'ubos-chip-pop': 'ubos-chip-pop 220ms cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
      keyframes: {
        'ubos-broadcast-scan': {
          '0%, 100%': {
            backgroundPosition: '0 0, 0 0, 0 0, 0 0',
            opacity: '0.92',
          },
          '50%': {
            backgroundPosition: '10px 0, 0 10px, 0 0, 0 0',
            opacity: '1',
          },
        },
        'ubos-tally-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'ubos-recording-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 var(--ubos-recording-pulse)' },
          '50%': { boxShadow: '0 0 0 4px transparent' },
        },
        'ubos-fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'ubos-slide-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        // UBOS 3.15C
        'ubos-panel-appear': {
          from: { opacity: '0', transform: 'translateY(2px) scale(0.995)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'ubos-status-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'ubos-chip-pop': {
          '0%': { transform: 'scale(0.88)', opacity: '0' },
          '60%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
} satisfies Partial<Config>;

export default ubosPreset;
