/**
 * UBOS Design System (UBDS) — Workspace Templates (Step 99)
 *
 * The assembly step: eight canonical workspace templates that combine
 * color semantics (Step 92), typography (Step 93), elevation (Step 94),
 * depth/gradients (Step 95), motion (Step 96), spacing (Step 97), and the
 * broadcast rhythm grid (Step 98) into named, presentation-level recipes
 * — panel arrangement (as named layout regions, the same vocabulary as
 * `ubosWorkspaceGridTemplates`), density mode, and accent hues.
 *
 * This is intentionally a *design-token* layer, not a new runtime
 * workspace registry. The live Control Room already has several
 * overlapping runtime identifiers for "which workspace is active"
 * (`UbosWorkspaceModeId` in the dock, `WorkspacePresetId` in
 * `@ubos/shared`, `ProfessionalWorkspaceId`, the route catalog's
 * `WorkspaceId`, and `WorkspaceShellRegistry` geometry shells) — this
 * file does not add a ninth. It defines what each named workspace
 * *should look like*; wiring an existing runtime workspace to the
 * matching template here (so it actually renders with this
 * layout/density/accent) is application work for a later step, same as
 * Step 92 was the color application step for Step 91's foundation.
 *
 * Elevation, motion, spacing, and grid rules are NOT re-specified per
 * workspace: per UBDS principle 6 ("consistency across all workspaces"),
 * every workspace uses the exact same elevation/motion/spacing/grid
 * systems (Steps 94-98) — what varies here is only layout, density, and
 * accent emphasis.
 */
import type { UbosBroadcastHue } from './colors.js';
import type { UbosDensityMode } from './spacing.js';

/** Accent hues a workspace emphasizes. `neutral` covers workspaces (like Compact) that lean on gray structure rather than a broadcast hue. */
export type UbosWorkspaceAccent = UbosBroadcastHue | 'neutral';

/** Named layout regions — the same region vocabulary as `ubosWorkspaceGridTemplates` (Step 98). */
export type UbosWorkspaceRegion = 'top' | 'left' | 'center' | 'right' | 'bottom';

export interface UbosWorkspaceTemplate {
  /** Operator-facing display name. */
  label: string;
  /** One-line statement of what the workspace is for. */
  purpose: string;
  /**
   * Named content per layout region. A value that matches a key in
   * `ubosWorkspaceGridTemplates` (`triad` | `inspector` | `programOutput`)
   * means that region hosts that canonical panel template, not a
   * standalone one-off panel.
   */
  layout: Partial<Record<UbosWorkspaceRegion, string>>;
  density: UbosDensityMode;
  accents: readonly UbosWorkspaceAccent[];
  /** Compact-only: panels collapse to reclaim space on small screens. */
  collapsiblePanels?: boolean;
  /** Compact-only: the intelligence HUD floats over content instead of docking to a region. */
  floatingHud?: boolean;
  /**
   * Documentation-only cross-reference to the closest existing runtime
   * `WorkspacePresetId` (`@ubos/shared`) — not a functional coupling, and
   * not every template has a 1:1 preset today (e.g. `technicalDirector`
   * and `audio` both currently collapse into the `director` dock mode).
   */
  presetRef: string;
}

export type UbosWorkspaceTemplateName =
  | 'director'
  | 'technicalDirector'
  | 'graphics'
  | 'audio'
  | 'replay'
  | 'streaming'
  | 'solo'
  | 'compact';

export const ubosWorkspaceTemplates: Record<UbosWorkspaceTemplateName, UbosWorkspaceTemplate> = {
  director: {
    label: 'Director',
    purpose: 'Scene control, show flow, transitions, timing.',
    layout: { top: 'operatorHud', left: 'sceneStack', center: 'triad', right: 'programOutput', bottom: 'intelligenceTimeline' },
    density: 'director',
    accents: ['program', 'preview', 'selection'],
    presetRef: 'director',
  },
  technicalDirector: {
    label: 'Technical Director',
    purpose: 'Routing, switching, multi-camera control.',
    layout: { left: 'cameraGrid', center: 'routingMatrix', right: 'programOutput', bottom: 'intelligenceWarnings' },
    density: 'standard',
    // "Routing Blue" in the brief — UBDS has no separate routing hue, this
    // is Active Blue (`selection`), the same operator-focus hue used
    // everywhere else for "currently active/selected".
    accents: ['selection', 'warning'],
    presetRef: 'technical-director',
  },
  graphics: {
    label: 'Graphics',
    purpose: 'Graphics layers, templates, activation, timing.',
    layout: { left: 'graphicsLibrary', center: 'graphicsLayerStack', right: 'scenePreview', bottom: 'activationTimeline' },
    density: 'standard',
    accents: ['graphics', 'automation'],
    presetRef: 'graphics-operator',
  },
  audio: {
    label: 'Audio',
    purpose: 'Mixing, levels, routing, clipping detection.',
    layout: { left: 'channelList', center: 'faderGrid', right: 'audioBusRouting', bottom: 'clippingMonitor' },
    density: 'standard',
    // "Audio Blue" in the brief — same reasoning as technicalDirector above.
    accents: ['selection', 'warning'],
    presetRef: 'audio-engineer',
  },
  replay: {
    label: 'Replay',
    purpose: 'Clips, angles, slow-motion, playback control.',
    layout: { left: 'clipBin', center: 'angleSelector', right: 'programOutput', bottom: 'replayTimeline' },
    density: 'standard',
    accents: ['replay'],
    presetRef: 'replay-operator',
  },
  streaming: {
    label: 'Streaming',
    purpose: 'Output health, bitrate, destinations, warnings.',
    layout: { left: 'destinationList', center: 'outputHealthPanel', right: 'programOutput', bottom: 'warningTimeline' },
    density: 'standard',
    accents: ['warning', 'program'],
    presetRef: 'streaming-operator',
  },
  solo: {
    label: 'Solo Streamer',
    purpose: 'One-person operation, simplified UI.',
    layout: { left: 'sceneStack', center: 'programOutput', right: 'audioGraphicsMiniPanels', bottom: 'intelligenceBar' },
    density: 'compact',
    accents: ['selection', 'graphics'],
    presetRef: 'solo-streamer',
  },
  compact: {
    label: 'Compact',
    purpose: 'Small screens, laptops, tablets.',
    layout: { center: 'adaptiveStack' },
    density: 'compact',
    accents: ['neutral', 'selection'],
    collapsiblePanels: true,
    floatingHud: true,
    presetRef: 'compact',
  },
};

export const ubosWorkspaceTemplateNames = Object.keys(
  ubosWorkspaceTemplates,
) as UbosWorkspaceTemplateName[];
