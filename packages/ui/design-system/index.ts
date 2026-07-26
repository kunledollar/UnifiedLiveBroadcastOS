/**
 * UBOS Design System (UBDS)
 *
 * Professional broadcast operating system UI foundation.
 * Import primitives and tokens from this barrel for all Control Room UI.
 *
 * Step 91 established UBDS as the formal visual operating system: broadcast
 * color language (program/preview/selection/automation/graphics/replay/
 * warning), typography hierarchy, panel elevation (levels 0-4), the motion
 * system (pulse/glow/slide/fade/shake), and spacing rhythm. Step 92 applied
 * the color language to the Triad, Inspector, Program Output, Graphics,
 * Audio, Routing, Replay, Workspace Shell, and Operator HUD surfaces. Step
 * 93 completed the typography hierarchy (Title, Section Label, Body,
 * Micro-text, HUD Text, Intelligence Text) and wired intelligence-signal
 * text treatments into the UI Intelligence Integration Layer. Step 94
 * refined the elevation model (soft/medium/strong/hard shadows, per-level
 * gradients, a thick Level 4 border) and wired intelligence-signal
 * elevation treatments into the same layer. Step 95 formalized the three
 * canonical gradient shapes (Linear Depth, Radial Highlight, Critical) and
 * assigned one to each elevation level, giving highlighted/predicted
 * panels a radial bloom and critical panels a red-tinted wash instead of a
 * generic linear gradient. Application of UBDS to Triad 2.0, Inspector
 * 2.0, and Program Output 2.0 happens in later steps — this package only
 * defines the foundation.
 */

export * from './tokens/index.js';
export * from './theme/index.js';
export * from './primitives/index.js';
export { cn } from './utils/cn.js';

/** Design system version identifier */
export const UBOS_DESIGN_SYSTEM_VERSION = '5.16.3' as const;

/** UBDS foundation milestone identifier — most recent foundation step. */
export const UBDS_FOUNDATION_STEP = 95 as const;
