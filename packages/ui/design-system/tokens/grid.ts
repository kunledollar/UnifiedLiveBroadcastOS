/**
 * UBOS Design System (UBDS) — Broadcast Rhythm Grid (Step 98)
 *
 * The layout engine of UBOS: panel alignment, workspace structure, and the
 * geometry behind Triad 2.0, Inspector 2.0, and Program Output 2.0. A
 * 12-column adaptive grid built entirely from tokens already established
 * in Step 91/97 (rhythm, gutter, margin, density) — this file does not
 * introduce a second parallel spacing or density scale, it names how the
 * existing scale composes into a grid.
 */
import { ubosRhythm, ubosScaleSpacing, type UbosDensityMode } from './spacing.js';

export const ubosGrid = {
  /** 12-column adaptive grid — broadcast UI uses proportional geometry, not a rigid web grid. */
  columns: 12,
  /** Base rhythm unit — same value as `ubosRhythm.micro`. */
  rhythm: ubosRhythm.micro, // 4px
  /** Gutter between columns/panels — same value as `ubosRhythm.xlarge`. */
  gutter: ubosRhythm.xlarge, // 24px
  /** Outer margin around a workspace — same value as `ubosRhythm.xxlarge`. */
  margin: ubosRhythm.xxlarge, // 32px
} as const;

/**
 * Scale a grid constant (gutter/margin) by a density mode. Thin wrapper
 * around `ubosScaleSpacing` (Step 97) so the grid doesn't duplicate density
 * logic — Director Mode is ×1.2, Compact Mode is ×0.75, same multipliers
 * used for padding.
 */
export function ubosApplyGridDensity(remValue: string, mode: UbosDensityMode): string {
  return ubosScaleSpacing(remValue, mode);
}

/**
 * UBDS Workspace Grid Templates (Step 98) — the three canonical region
 * layouts named regions map to, not literal CSS Grid areas (the live
 * geometry engine positions zones with computed pixel rects, not a
 * declarative CSS grid) — these are the structural vocabulary Triad 2.0,
 * Inspector 2.0, and Program Output 2.0 apply to when they're built.
 */
export const ubosWorkspaceGridTemplates = {
  triad: {
    left: 'scene',
    center: 'graphics',
    right: 'audio',
    bottom: 'programOutput',
    overlay: 'intelligence',
  },
  inspector: {
    left: 'navigation',
    center: 'inspectorBody',
    right: 'metadata',
    bottom: 'intelligenceBar',
  },
  programOutput: {
    left: 'preview',
    center: 'program',
    right: 'routing',
    bottom: 'intelligenceTimeline',
  },
} as const;

export type UbosWorkspaceGridTemplateName = keyof typeof ubosWorkspaceGridTemplates;

/**
 * Grid + Intelligence Integration (Step 98) — how UI Intelligence
 * Integration Layer signals (Step 90) map onto grid behavior. Applied in
 * ui-intelligence.css alongside the Step 92-97 color/text/elevation/
 * gradient/motion/spacing treatments for the same signal classes.
 */
export type UbosGridAction =
  | 'expandColumn'
  | 'increaseGutter'
  | 'rhythmicShift'
  | 'alignmentNudge'
  | 'reduceColumn'
  | 'collapseRegion'
  | 'increaseMargin';

export const ubosIntelligenceGridMap: Record<
  'highlight' | 'warn' | 'pulse' | 'prepare' | 'dim' | 'suppress' | 'elevate',
  UbosGridAction
> = {
  highlight: 'expandColumn',
  warn: 'increaseGutter',
  pulse: 'rhythmicShift',
  prepare: 'alignmentNudge',
  dim: 'reduceColumn',
  suppress: 'collapseRegion',
  elevate: 'increaseMargin',
};
