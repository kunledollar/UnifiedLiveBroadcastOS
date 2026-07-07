/**
 * Zone geometry rules for the UBOS 3.15 Workspace Manager.
 *
 * Sizes are defined against the 1920x1080 reference viewport. All values are
 * static layout metadata; actual per-viewport geometry is computed by the
 * pure helpers in `layout.ts`.
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
    defaultSize: 260,
    minSize: 220,
    maxSize: 360,
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
    defaultSize: 320,
    minSize: 260,
    maxSize: 420,
    collapsible: true,
    resizable: true,
    collapsedSize: 0,
  },
  'bottom-workspace': {
    id: 'bottom-workspace',
    label: 'Bottom Workspace',
    placement: 'bottom',
    defaultSize: 260,
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
