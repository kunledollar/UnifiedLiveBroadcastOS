/**
 * UBOS Design System (UBDS)
 *
 * Professional broadcast operating system UI foundation.
 * Import primitives and tokens from this barrel for all Control Room UI.
 *
 * Step 91 established UBDS as the formal visual operating system: broadcast
 * color language (program/preview/selection/automation/graphics/replay/
 * warning), typography hierarchy, panel elevation (levels 0-4), the motion
 * system (pulse/glow/slide/fade/shake), and spacing rhythm. Application of
 * UBDS to Triad 2.0, Inspector 2.0, Program Output 2.0, and the Operator HUD
 * happens in later steps — this package only defines the foundation.
 */

export * from './tokens/index.js';
export * from './theme/index.js';
export * from './primitives/index.js';
export { cn } from './utils/cn.js';

/** Design system version identifier */
export const UBOS_DESIGN_SYSTEM_VERSION = '5.16.0' as const;

/** UBDS foundation milestone identifier (Step 91). */
export const UBDS_FOUNDATION_STEP = 91 as const;
