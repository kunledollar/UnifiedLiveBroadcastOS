/**
 * UBOS 3.15 Workspace Manager — foundation types.
 *
 * This module is a pure layout-orchestration layer. It describes WHERE panels
 * live (zones, presets, geometry) and never touches WHAT panels render.
 * Definitions here hold layout metadata only: no runtime media objects,
 * no DOM nodes, no sockets, no React elements.
 */

/** Logical docking regions of the Control Room shell. */
export type WorkspaceZoneId =
  | 'top-ribbon'
  | 'left-rail'
  | 'left-dock'
  | 'center-stage'
  | 'right-dock'
  | 'bottom-workspace'
  | 'floating'
  | 'external-monitor';

/** Broad behavioural category of a panel (affects chrome, not content). */
export type WorkspacePanelKind =
  | 'monitor'
  | 'dock'
  | 'tool'
  | 'inspector'
  | 'status'
  | 'workspace'
  | 'menu';

/**
 * Layout metadata for a registered panel.
 *
 * A panel definition is a serializable description of an existing UBOS
 * component. The component itself is never stored here — existing Control
 * Room components are wrapped (eventually inside DockablePanel wrappers),
 * never modified or referenced from this registry.
 */
export interface WorkspacePanelDefinition {
  id: string;
  title: string;
  kind: WorkspacePanelKind;
  defaultZone: WorkspaceZoneId;
  allowedZones: WorkspaceZoneId[];
  defaultVisible: boolean;
  defaultCollapsed: boolean;
  closable: boolean;
  collapsible: boolean;
  dockable: boolean;
  priority: number;
  minWidth: number;
  minHeight: number;
  preferredWidth?: number;
  preferredHeight?: number;
  icon?: string;
  description?: string;
}

/** Mutable layout state tracked per registered panel (metadata only). */
export interface WorkspacePanelState {
  panelId: string;
  zone: WorkspaceZoneId;
  visible: boolean;
  collapsed: boolean;
}

/** Physical placement class of a zone within the shell. */
export type WorkspaceZonePlacement =
  | 'top'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom'
  | 'floating'
  | 'external';

/** Static geometry rules for a zone (reference viewport 1920x1080). */
export interface WorkspaceZoneDefinition {
  id: WorkspaceZoneId;
  label: string;
  placement: WorkspaceZonePlacement;
  /** Default main-axis size in px (width for left/right, height for top/bottom). */
  defaultSize: number;
  minSize: number;
  maxSize?: number;
  collapsible: boolean;
  resizable: boolean;
  /** Size when collapsed (0 = fully hidden, >0 = tab bar remnant). */
  collapsedSize: number;
}

export type WorkspacePresetId =
  | 'director'
  | 'solo-streamer'
  | 'technical-director'
  | 'audio-engineer'
  | 'graphics-operator'
  | 'replay-operator'
  | 'streaming-operator'
  | 'monitor-wall'
  | 'compact';

/** Which center-stage monitor gets visual emphasis under a preset. */
export type WorkspaceCenterEmphasis = 'program' | 'preview' | 'balanced';

/** A named, declarative arrangement of panels and zones. */
export interface WorkspacePreset {
  id: WorkspacePresetId;
  name: string;
  description: string;
  /** Panel id of the bottom-workspace tab that starts active. */
  activeBottomTab: string;
  visiblePanels: string[];
  collapsedPanels: string[];
  hiddenPanels: string[];
  /** panelId -> zone the preset relocates the panel to. */
  zoneOverrides: Record<string, WorkspaceZoneId>;
  collapsedZones: WorkspaceZoneId[];
  centerEmphasis: WorkspaceCenterEmphasis;
}

/** Axis-aligned rectangle in viewport pixels. */
export interface WorkspaceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Computed geometry for one zone at a given viewport size. */
export interface WorkspaceZoneGeometry {
  zoneId: WorkspaceZoneId;
  rect: WorkspaceRect;
  collapsed: boolean;
  /** False for zones that occupy no screen space (floating/external placeholders). */
  visible: boolean;
}

/** Inputs to the pure layout calculation. */
export interface WorkspaceLayoutInput {
  viewportWidth: number;
  viewportHeight: number;
  preset: WorkspacePreset;
  /** Zones explicitly collapsed by the operator (merged with preset + responsive rules). */
  collapsedZones?: WorkspaceZoneId[];
}

/** Full layout metadata computed for a viewport + preset combination. */
export interface WorkspaceLayoutResult {
  viewportWidth: number;
  viewportHeight: number;
  presetId: WorkspacePresetId;
  zones: Record<WorkspaceZoneId, WorkspaceZoneGeometry>;
  /** True when viewport is narrower than 900px and monitors stack vertically. */
  monitorsStacked: boolean;
  centerEmphasis: WorkspaceCenterEmphasis;
  /** Reserved monitor areas inside center-stage. Docks may never cover these. */
  programRect: WorkspaceRect;
  previewRect: WorkspaceRect;
  /** Non-fatal adjustments made to honour geometry rules (e.g. forced dock collapse). */
  warnings: string[];
}

/** Persisted, serializable layout metadata. Never contains runtime objects. */
export interface WorkspaceLayoutSnapshot {
  version: 1;
  activePresetId: WorkspacePresetId;
  collapsedZones: WorkspaceZoneId[];
  panelStates: WorkspacePanelState[];
  savedAt: string;
}

/** A single problem found while validating workspace metadata. */
export interface WorkspaceValidationIssue {
  code: string;
  message: string;
  subject?: string;
}

export const WORKSPACE_ZONE_IDS: readonly WorkspaceZoneId[] = [
  'top-ribbon',
  'left-rail',
  'left-dock',
  'center-stage',
  'right-dock',
  'bottom-workspace',
  'floating',
  'external-monitor',
] as const;

export const WORKSPACE_PANEL_KINDS: readonly WorkspacePanelKind[] = [
  'monitor',
  'dock',
  'tool',
  'inspector',
  'status',
  'workspace',
  'menu',
] as const;

export const WORKSPACE_PRESET_IDS: readonly WorkspacePresetId[] = [
  'director',
  'solo-streamer',
  'technical-director',
  'audio-engineer',
  'graphics-operator',
  'replay-operator',
  'streaming-operator',
  'monitor-wall',
  'compact',
] as const;
