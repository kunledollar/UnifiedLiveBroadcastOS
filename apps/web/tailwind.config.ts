import type { Config } from 'tailwindcss';
import ubosPreset from '../../packages/ui/design-system/theme/tailwind-preset';

export default {
  presets: [ubosPreset],
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/ui/design-system/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
