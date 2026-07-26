/**
 * UBOS Design System (UBDS) — Workspace Intelligence Themes (Step 103)
 *
 * Dynamic visual modes that change a workspace's color accents, depth,
 * motion, and density all at once — the "cohesive broadcast experience"
 * layer sitting on top of the individual systems built in Steps 91-99.
 *
 * This file deliberately does not redefine accents/density: each theme's
 * `accents`/`density` are read directly from the matching
 * `ubosWorkspaceTemplates` entry (Step 99) rather than a second, parallel
 * copy that could silently drift out of sync — a theme is what a
 * workspace *feels like*, not a different set of facts about it. Only
 * `motion` and `depth` are genuinely new per-theme decisions.
 *
 * Not every workspace template gets its own theme: `technicalDirector`
 * shares Director's clarity/timing character, and `compact` is a density
 * mode more than a distinct visual identity (Solo Streamer already folds
 * compact density into its own theme) — six canonical themes, matching
 * the Step 103 spec exactly.
 */
import { ubosWorkspaceTemplates, type UbosWorkspaceAccent } from './workspaces.js';
import type { UbosDensityMode } from './spacing.js';
import type { UbosMotionPrimitive } from './motion.js';
import type { UbosElevationLevel } from './elevation.js';

export type UbosThemeName = 'director' | 'graphics' | 'audio' | 'replay' | 'streaming' | 'solo';

export const ubosThemeNames: readonly UbosThemeName[] = [
  'director',
  'graphics',
  'audio',
  'replay',
  'streaming',
  'solo',
];

export interface UbosTheme {
  accents: readonly UbosWorkspaceAccent[];
  density: UbosDensityMode;
  /** Which of the six canonical motion primitives this theme emphasizes. */
  motion: UbosMotionPrimitive;
  /**
   * Depth strength, expressed as an elevation level (Step 94) rather than
   * a fourth parallel "strong/medium/light" scale — Level 3 uses
   * `ubosShadows.strong`, Level 2 uses `ubosShadows.medium`, Level 1 uses
   * `ubosShadows.soft`, so "depth: strong/medium/light" from the brief
   * maps onto tokens that already exist.
   */
  depth: Extract<UbosElevationLevel, 1 | 2 | 3>;
}

export const ubosThemes: Record<UbosThemeName, UbosTheme> = {
  // Predictive transition glow — Director's own characteristic text.
  director: {
    accents: ubosWorkspaceTemplates.director.accents,
    density: ubosWorkspaceTemplates.director.density,
    motion: 'glow',
    depth: 3,
  },
  // Pulse animations for predicted graphics activations.
  graphics: {
    accents: ubosWorkspaceTemplates.graphics.accents,
    density: ubosWorkspaceTemplates.graphics.density,
    motion: 'pulse',
    depth: 2,
  },
  // Predictive peak pulses (clipping detection).
  audio: {
    accents: ubosWorkspaceTemplates.audio.accents,
    density: ubosWorkspaceTemplates.audio.density,
    motion: 'pulse',
    depth: 2,
  },
  // Predictive clip pulses.
  replay: {
    accents: ubosWorkspaceTemplates.replay.accents,
    density: ubosWorkspaceTemplates.replay.density,
    motion: 'pulse',
    depth: 2,
  },
  // Predictive frame-drop pulses; strong depth — output health is critical.
  streaming: {
    accents: ubosWorkspaceTemplates.streaming.accents,
    density: ubosWorkspaceTemplates.streaming.density,
    motion: 'pulse',
    depth: 3,
  },
  // Reduced motion, minimal footprint — fade is UBDS's de-emphasis primitive.
  solo: {
    accents: ubosWorkspaceTemplates.solo.accents,
    density: ubosWorkspaceTemplates.solo.density,
    motion: 'fade',
    depth: 1,
  },
};

/**
 * Intelligence-Driven Theme Switching (Step 103) — how UI Intelligence
 * Integration Layer signals (Step 90) modulate an active theme. These are
 * *modifiers* applied to whichever theme is active, not a replacement
 * theme — e.g. `warn` doesn't need a second "critical" copy of all six
 * themes; it means "this theme, but escalated to the existing Level 4 /
 * Critical Gradient treatment" (Step 94/95), which already exists.
 */
export type UbosThemeIntelligenceAction =
  | 'increaseAccentIntensity'
  | 'switchToCriticalVariant'
  | 'enablePredictiveMotion'
  | 'enableGradientShift'
  | 'reduceAccentIntensity'
  | 'collapseOverlays'
  | 'increaseDepthAndSpacing';

export const ubosIntelligenceThemeMap: Record<
  'highlight' | 'warn' | 'pulse' | 'prepare' | 'dim' | 'suppress' | 'elevate',
  UbosThemeIntelligenceAction
> = {
  highlight: 'increaseAccentIntensity',
  warn: 'switchToCriticalVariant',
  pulse: 'enablePredictiveMotion',
  prepare: 'enableGradientShift',
  dim: 'reduceAccentIntensity',
  suppress: 'collapseOverlays',
  elevate: 'increaseDepthAndSpacing',
};
