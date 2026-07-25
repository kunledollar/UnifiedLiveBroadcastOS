/**
 * UBOS Design System v1.0 — Shadow Tokens
 *
 * Subtle layering. Panels feel stacked, never floating.
 */

export const ubosShadows = {
  none: 'none',
  /** Recessed panel — sits below surface */
  inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.04), inset 0 -1px 0 rgba(0, 0, 0, 0.25)',
  /** Standard panel elevation */
  panel: '0 1px 2px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.04)',
  /** Raised toolbar or dock */
  raised: '0 2px 8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  /** Monitor frame — deep inset for video surfaces */
  monitor: 'inset 0 0 0 1px rgba(0, 0, 0, 0.6), inset 0 2px 12px rgba(0, 0, 0, 0.5)',
  /** Semantic glow — program tally */
  programGlow: '0 0 20px var(--ubos-program-glow)',
  /** Semantic glow — preview tally */
  previewGlow: '0 0 16px var(--ubos-preview-glow)',
  /** Selection focus ring shadow */
  selectionGlow: '0 0 0 2px var(--ubos-selection-border), 0 0 12px var(--ubos-selection-muted)',
  /**
   * UBDS elevation shadow progression (Step 94) — soft/medium/strong/hard,
   * used by `ubosElevation` levels 1-4 respectively.
   */
  soft: '0 1px 2px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.04)',
  medium: '0 2px 4px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  strong: '0 4px 8px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  hard: '0 6px 12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
} as const;

export type UbosShadowToken = keyof typeof ubosShadows;
