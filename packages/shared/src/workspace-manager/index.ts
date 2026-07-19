/**
 * UBOS 3.15 Workspace Manager foundation.
 *
 * A pure, non-intrusive layout orchestration layer for the Control Room:
 * panel registration, zone geometry, workspace presets, layout calculation,
 * and layout-metadata persistence. It wraps existing Control Room components
 * (never modifies them) and stores layout metadata only — no runtime media,
 * camera, audio, graphics, replay, or streaming objects. See README.md in
 * this directory for the full contract.
 */
export * from './types.js';
export * from './zones.js';
export * from './panels.js';
export * from './registry.js';
export * from './presets.js';
export * from './definitions.js';
export * from './layout.js';
export * from './persistence.js';
export * from './custom-workspaces.js';
export * from './status.js';
