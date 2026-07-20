/**
 * UBOS Design System v1.0
 *
 * Professional broadcast operating system UI foundation.
 * Import primitives and tokens from this barrel for all Control Room UI.
 */

export * from './tokens/index.js';
export * from './theme/index.js';
export * from './primitives/index.js';
export { cn } from './utils/cn.js';

/** Design system version identifier */
export const UBOS_DESIGN_SYSTEM_VERSION = '5.15.1' as const;
