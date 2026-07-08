/**
 * Zone geometry rules for the UBOS 3.15 Workspace Manager.
 *
 * Sizes are defined against the 1920x1080 reference viewport. All values are
 * static layout metadata; actual per-viewport geometry is computed by the
 * pure helpers in `layout.ts`.
 *
 * PR-F responsive dock geometry contract:
 *   Left Dock:         min 200 / preferred 270 / max 440
 *   Right Dock:        min 260 / preferred 270 / max 460
 *   Bottom Workspace:  min 180 / preferred 280 / max 420
 *
 * Responsive dock width rules (PR-F):
 *   ≥ 1440px viewport → full dock width  (DOCK_FULL_WIDTH = 270px)
 *   1200–1439px       → compact width    (DOCK_COMPACT_WIDTH = 200px, left only)
 *   < 1200px          → auto-collapse    (handled by LEFT_DOCK_AUTO_COLLAPSE_WIDTH)
 */
import type { WorkspaceZoneDefinition, WorkspaceZoneId } from './types.js';

export const TOP_RIBBON_HEIGHT = 56;
export const LEFT_RAIL_WIDTH = 72;
export const CENTER_STAGE_MIN_WIDTH = 900;
export const BOTTOM_WORKSPACE_TAB_BAR_HEIGHT = 42;

/** Below this viewport width the right dock starts collapsed. */
export const RIGHT_DOCK_AUTO_COLLAPSE_WIDTH = 1440;
/** Below this viewport width the left dock starts collapsed. */
export const LEFT_DOCK_AUTO_COLLAPSE_WIDTH = 1200;
/** Below this viewport width Program and Preview stack vertically. */
export const MONITOR_STACK_WIDTH = 900;

/**
 * PR-F: Responsive dock width constants.
 * Full width (≥ 1440px) — sits in the 260–280px range specified for PR-F.
 * Compact width (1200–1439px) — applied to the left dock when the right dock
 * is already auto-collapsed, keeping the center stage unclipped.
 */
export const DOCK_FULL_WIDTH = 270;
export const DOCK_COMPACT_WIDTH = 200;

export const workspaceZoneDefinitions: Record<WorkspaceZoneId, WorkspaceZoneDefinition> = {
  'top-ribbon': {
    id: 'top-ribbon',
    label: 'Top Ribbon',
    placement: 'top',
    defaultSize: TOP_RIBBON_HEIGHT,
    minSize: TOP_RIBBON_HEIGHT,
    maxSize: TOP_RIBBON_HEIGHT,
    collapsible: false,
    resizable: false,
    collapsedSize: TOP_RIBBON_HEIGHT,
  },
  'left-rail': {
    id: 'left-rail',
    label: 'Left Rail',
    placement: 'left',
    defaultSize: LEFT_RAIL_WIDTH,
    minSize: LEFT_RAIL_WIDTH,
    maxSize: LEFT_RAIL_WIDTH,
    collapsible: false,
    resizable: false,
    collapsedSize: LEFT_RAIL_WIDTH,
  },
  'left-dock': {
    id: 'left-dock',
    label: 'Left Dock',
    placement: 'left',
    defaultSize: DOCK_FULL_WIDTH,
    minSize: DOCK_COMPACT_WIDTH,
    maxSize: 440,
    collapsible: true,
    resizable: true,
    collapsedSize: 0,
  },
  'center-stage': {
    id: 'center-stage',
    label: 'Center Stage',
    placement: 'center',
    // Center stage is flexible: it absorbs all space freed by collapsing
    // docks. defaultSize is only its floor; it may never shrink below it.
    defaultSize: CENTER_STAGE_MIN_WIDTH,
    minSize: CENTER_STAGE_MIN_WIDTH,
    collapsible: false,
    resizable: false,
    collapsedSize: CENTER_STAGE_MIN_WIDTH,
  },
  'right-dock': {
    id: 'right-dock',
    label: 'Right Dock',
    placement: 'right',
    defaultSize: DOCK_FULL_WIDTH,
    minSize: 260,
    maxSize: 460,
    collapsible: true,
    resizable: true,
    collapsedSize: 0,
  },
  'bottom-workspace': {
    id: 'bottom-workspace',
    label: 'Bottom Workspace',
    placement: 'bottom',
    defaultSize: 280,
    minSize: 180,
    maxSize: 420,
    collapsible: true,
    resizable: true,
    collapsedSize: BOTTOM_WORKSPACE_TAB_BAR_HEIGHT,
  },
  // Placeholder: real floating windows are out of scope for the foundation.
  floating: {
    id: 'floating',
    label: 'Floating',
    placement: 'floating',
    defaultSize: 0,
    minSize: 0,
    collapsible: false,
    resizable: false,
    collapsedSize: 0,
  },
  // Placeholder: multi-monitor support is out of scope for the foundation.
  'external-monitor': {
    id: 'external-monitor',
    label: 'External Monitor',
    placement: 'external',
    defaultSize: 0,
    minSize: 0,
    collapsible: false,
    resizable: false,
    collapsedSize: 0,
  },
};

export const workspaceZoneList: readonly WorkspaceZoneDefinition[] =
  Object.values(workspaceZoneDefinitions);

export function getZoneDefinition(zoneId: WorkspaceZoneId): WorkspaceZoneDefinition {
  return workspaceZoneDefinitions[zoneId];
}

export function isWorkspaceZoneId(value: string): value is WorkspaceZoneId {
  return value in workspaceZoneDefinitions;
}

/** Clamp a requested zone size to the zone's min/max geometry rules. */
export function clampZoneSize(zoneId: WorkspaceZoneId, requestedSize: number): number {
  const zone = workspaceZoneDefinitions[zoneId];
  const upper = zone.maxSize ?? Number.POSITIVE_INFINITY;
  return Math.min(Math.max(requestedSize, zone.minSize), upper);
}

/**
 * Zones that should start collapsed for a given viewport width, per the
 * responsive geometry rules. Merged (never replaced) with preset and
 * operator collapse choices.
 */
export function getResponsiveCollapsedZones(viewportWidth: number): WorkspaceZoneId[] {
  const collapsed: WorkspaceZoneId[] = [];
  if (viewportWidth < RIGHT_DOCK_AUTO_COLLAPSE_WIDTH) collapsed.push('right-dock');
  if (viewportWidth < LEFT_DOCK_AUTO_COLLAPSE_WIDTH) collapsed.push('left-dock');
  return collapsed;
}

/**
 * PR-F: Returns the viewport-responsive default width for a dock zone when
 * no user-dragged override is present.
 *
 * Breakpoint table:
 *   ≥ 1440px  → DOCK_FULL_WIDTH (270px) for both left and right dock
 *   1200–1439px → DOCK_COMPACT_WIDTH (200px) for the left dock only
 *               (right dock is already auto-collapsed in this range)
 *   < 1200px  → docks are auto-collapsed; this function is not reached
 *
 * Non-dock zones fall through to their zone definition's defaultSize.
 */
export function getResponsiveDockWidth(
  zoneId: WorkspaceZoneId,
  viewportWidth: number,
): number {
  if (zoneId === 'left-dock') {
    if (
      viewportWidth >= LEFT_DOCK_AUTO_COLLAPSE_WIDTH &&
      viewportWidth < RIGHT_DOCK_AUTO_COLLAPSE_WIDTH
    ) {
      return DOCK_COMPACT_WIDTH;
    }
    return workspaceZoneDefinitions['left-dock'].defaultSize;
  }
  return workspaceZoneDefinitions[zoneId]?.defaultSize ?? 0;
}
