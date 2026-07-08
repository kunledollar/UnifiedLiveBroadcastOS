/**
 * UBOS 3.15B — Command Center pure layout logic.
 *
 * Bridges the shared Workspace Manager foundation (`@ubos/shared`
 * workspace-manager) to the existing Control Room identifiers (dock tabs,
 * operations tabs, nav items, source-dock tabs).
 *
 * Everything in this module is layout METADATA only: plain serializable
 * mappings between panel ids and existing UI surfaces. No runtime media
 * objects, no DOM nodes, no React elements, and no production state are
 * referenced here — existing Control Room panels are wrapped by the shell,
 * never modified.
 */
import type {
  WorkspacePanelDefinition,
  WorkspacePanelRegistry,
  WorkspacePreset,
  WorkspacePresetId,
  WorkspaceZoneId,
} from '@ubos/shared';
import { WORKSPACE_PANEL_IDS, WORKSPACE_ZONE_IDS } from '@ubos/shared';
import type { DockTabId, NavItemId, OperationsTabId, SourceDockTabId } from '../shell/types';
import type { OperationsDockSectionId } from '../operations/operations-dock-types';
import type { UbosWorkspaceModeId } from '../menu/ubos-menu-types';

const P = WORKSPACE_PANEL_IDS;

/** App-level panel ids registered on top of the shared foundation set. */
export const COMMAND_CENTER_EXTRA_PANEL_IDS = {
  guests: 'guests',
  alerts: 'alerts',
  mediaBrowser: 'media-browser',
} as const;

const X = COMMAND_CENTER_EXTRA_PANEL_IDS;

/**
 * Additional layout-metadata definitions for Control Room panels that exist
 * in the app but are not part of the shared foundation catalog. These are
 * plain descriptions only — the wrapped components stay untouched.
 */
export function createCommandCenterExtraPanelDefinitions(): WorkspacePanelDefinition[] {
  return [
    {
      id: X.guests,
      title: 'Guests',
      kind: 'dock',
      defaultZone: 'right-dock',
      allowedZones: ['right-dock', 'left-dock', 'bottom-workspace'],
      defaultVisible: true,
      defaultCollapsed: false,
      closable: true,
      collapsible: true,
      dockable: true,
      priority: 59,
      minWidth: 240,
      minHeight: 160,
      description: 'Guest management (wraps existing GuestsPanel)',
    },
    {
      id: X.alerts,
      title: 'Alerts',
      kind: 'status',
      defaultZone: 'right-dock',
      allowedZones: ['right-dock', 'bottom-workspace'],
      defaultVisible: true,
      defaultCollapsed: true,
      closable: true,
      collapsible: true,
      dockable: true,
      priority: 53,
      minWidth: 240,
      minHeight: 140,
      description: 'System health alerts (wraps existing HealthPanel)',
    },
    {
      id: X.mediaBrowser,
      title: 'Media',
      kind: 'dock',
      defaultZone: 'left-dock',
      allowedZones: ['left-dock', 'right-dock', 'bottom-workspace'],
      defaultVisible: true,
      defaultCollapsed: false,
      closable: true,
      collapsible: true,
      dockable: true,
      priority: 88,
      minWidth: 220,
      minHeight: 160,
      description: 'Media browser (wraps existing MediaBrowserPanel)',
    },
  ];
}

/** Map a registered panel id to the bottom-workspace tab that renders it. */
const PANEL_TO_BOTTOM_TAB: Record<string, DockTabId> = {
  [P.scenes]: 'layers',
  [P.sources]: 'layers',
  [P.audioMixer]: 'audio',
  [P.masterBus]: 'audio',
  [P.graphicsLibrary]: 'graphics',
  [P.replayTimeline]: 'replay',
  [P.clipLibrary]: 'replay',
  [P.routingMatrix]: 'routing',
  [P.broadcastIo]: 'routing',
  [P.pipelineInspector]: 'production-graph',
  [P.systemStatus]: 'system-status',
  [P.monitorWall]: 'system-status',
  [P.telemetry]: 'system-status',
  [P.chat]: 'logs',
};

/** Bottom tab -> panel id whose visibility gates the tab (null = always shown). */
const BOTTOM_TAB_TO_PANEL: Record<DockTabId, string | null> = {
  layers: null,
  audio: P.audioMixer,
  graphics: P.graphicsLibrary,
  replay: P.replayTimeline,
  routing: P.routingMatrix,
  'production-graph': P.pipelineInspector,
  logs: null,
  automation: null,
  'system-status': P.systemStatus,
  media: P.graphicsLibrary,
  collaboration: null,
};

export function bottomTabForPanel(panelId: string): DockTabId | null {
  return PANEL_TO_BOTTOM_TAB[panelId] ?? null;
}

export function panelGatingBottomTab(tab: DockTabId): string | null {
  return BOTTOM_TAB_TO_PANEL[tab] ?? null;
}

/** Resolve a preset's activeBottomTab (a panel id) to an existing dock tab. */
export function presetBottomTab(preset: WorkspacePreset): DockTabId {
  return bottomTabForPanel(preset.activeBottomTab) ?? 'layers';
}

/** Right-dock operations section -> registered panel id. */
export const RIGHT_DOCK_SECTION_PANELS: Record<OperationsDockSectionId, string> = {
  'unified-chat': P.chat,
  guests: X.guests,
  inspector: P.inspector,
  recording: P.recording,
  streaming: P.streaming,
  outputs: P.outputs,
  telemetry: P.telemetry,
  'system-health': X.alerts,
};

export function panelForRightDockSection(sectionId: OperationsDockSectionId): string {
  return RIGHT_DOCK_SECTION_PANELS[sectionId];
}

/** Operations tab -> registered right-dock panel (subset that maps cleanly). */
const OPERATIONS_TAB_TO_PANEL: Partial<Record<OperationsTabId, string>> = {
  logs: P.chat,
  guests: X.guests,
  inspector: P.inspector,
  recording: P.recording,
  streaming: P.streaming,
  outputs: P.outputs,
  monitoring: P.telemetry,
  health: X.alerts,
};

export function panelForOperationsTab(tab: OperationsTabId): string | null {
  return OPERATIONS_TAB_TO_PANEL[tab] ?? null;
}

/** Registered right-dock panel -> operations tab used for focus/scroll. */
const PANEL_TO_OPERATIONS_TAB: Record<string, OperationsTabId> = {
  [P.chat]: 'logs',
  [X.guests]: 'guests',
  [P.inspector]: 'inspector',
  [P.recording]: 'recording',
  [P.streaming]: 'streaming',
  [P.outputs]: 'outputs',
  [P.telemetry]: 'monitoring',
  [X.alerts]: 'health',
};

export function operationsTabForPanel(panelId: string): OperationsTabId | null {
  return PANEL_TO_OPERATIONS_TAB[panelId] ?? null;
}

/** Left source-dock tab -> panel id whose visibility gates the tab. */
const SOURCE_TAB_TO_PANEL: Record<SourceDockTabId, string | null> = {
  scenes: P.scenes,
  sources: P.sources,
  media: X.mediaBrowser,
  graphics: P.graphicsLibrary,
  guests: null,
  diagnostics: null,
};

export function panelGatingSourceTab(tab: SourceDockTabId): string | null {
  return SOURCE_TAB_TO_PANEL[tab] ?? null;
}

/**
 * Map a shared workspace preset to the closest legacy workspace mode so the
 * existing professional-workspace profile hooks keep firing (they adjust
 * production-adjacent view state that already exists — nothing new is
 * created).
 */
export function workspaceModeForPreset(presetId: WorkspacePresetId): UbosWorkspaceModeId {
  switch (presetId) {
    case 'audio-engineer':
      return 'audio';
    case 'graphics-operator':
      return 'graphics';
    case 'replay-operator':
      return 'replay';
    case 'solo-streamer':
    case 'streaming-operator':
      return 'streaming';
    case 'monitor-wall':
      return 'monitor-wall';
    case 'compact':
      return 'compact';
    case 'director':
    case 'technical-director':
    default:
      return 'director';
  }
}

/** Operations tab a preset should focus, when one clearly applies. */
export function presetOperationsTab(presetId: WorkspacePresetId): OperationsTabId | null {
  switch (presetId) {
    case 'monitor-wall':
      return 'monitoring';
    case 'streaming-operator':
      return 'streaming';
    default:
      return null;
  }
}

/** Left command rail item — pure metadata describing an existing action. */
export type CommandCenterRailItem = {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  nav?: NavItemId;
  bottomTab?: DockTabId;
  sourceTab?: SourceDockTabId;
  preset?: WorkspacePresetId;
  /** True when the item represents the Control Room page itself. */
  isHome?: boolean;
};

export const commandCenterRailItems: CommandCenterRailItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: '◉', nav: 'dashboard' },
  { id: 'control-room', label: 'Control Room', shortLabel: 'Ctrl', icon: '▣', isHome: true },
  {
    id: 'production-graph',
    label: 'Production Graph',
    shortLabel: 'Graph',
    icon: '⬡',
    nav: 'production-graph',
    bottomTab: 'production-graph',
  },
  { id: 'scenes', label: 'Scenes', shortLabel: 'Scn', icon: '▦', nav: 'scenes', sourceTab: 'scenes' },
  { id: 'sources', label: 'Sources', shortLabel: 'Src', icon: '◫', nav: 'sources', sourceTab: 'sources' },
  { id: 'broadcast-io', label: 'Broadcast I/O', shortLabel: 'I/O', icon: '⇄', bottomTab: 'routing' },
  {
    id: 'graphics',
    label: 'Graphics',
    shortLabel: 'Gfx',
    icon: '◈',
    nav: 'graphics',
    bottomTab: 'graphics',
    sourceTab: 'graphics',
  },
  { id: 'replay', label: 'Replay', shortLabel: 'Rpl', icon: '↺', nav: 'replay', bottomTab: 'replay' },
  { id: 'automation', label: 'Automation', shortLabel: 'Auto', icon: '⚡', bottomTab: 'automation' },
  { id: 'monitor-wall', label: 'Monitor Wall', shortLabel: 'Wall', icon: '▤', preset: 'monitor-wall' },
  { id: 'settings', label: 'Settings', shortLabel: 'Set', icon: '⚙', nav: 'settings' },
];

/**
 * Reset every registered panel to its definition defaults, then overlay a
 * preset's declarative visible/collapsed/hidden/zone-override lists.
 *
 * Only layout metadata changes — panel rules (closable/collapsible/
 * allowedZones) are enforced by the registry itself, so monitors can never
 * be hidden and non-collapsible panels can never collapse.
 */
export function applyPresetToRegistry(registry: WorkspacePanelRegistry, preset: WorkspacePreset): void {
  const visible = new Set(preset.visiblePanels);
  const collapsed = new Set(preset.collapsedPanels);
  const hidden = new Set(preset.hiddenPanels);

  const states = registry.getAllPanels().map((definition) => {
    const zoneOverride = preset.zoneOverrides[definition.id];
    const zone: WorkspaceZoneId =
      zoneOverride && definition.allowedZones.includes(zoneOverride)
        ? zoneOverride
        : definition.defaultZone;
    const isVisible = visible.has(definition.id)
      ? true
      : hidden.has(definition.id)
        ? false
        : collapsed.has(definition.id)
          ? true
          : definition.defaultVisible;
    const isCollapsed = collapsed.has(definition.id)
      ? true
      : visible.has(definition.id)
        ? false
        : definition.defaultCollapsed;
    return {
      panelId: definition.id,
      zone,
      visible: isVisible,
      collapsed: isCollapsed,
    };
  });

  registry.restorePanelStates(states);
}

/**
 * Build the effective preset used for geometry: operator "expand" overrides
 * remove zones from the preset's collapse list, while operator "collapse"
 * overrides are passed separately to the layout engine. Responsive collapse
 * rules always still apply inside `calculateWorkspaceLayout`.
 */
export function effectivePresetForLayout(
  preset: WorkspacePreset,
  expandedZones: readonly WorkspaceZoneId[],
): WorkspacePreset {
  if (expandedZones.length === 0) return preset;
  const expanded = new Set(expandedZones);
  return {
    ...preset,
    collapsedZones: preset.collapsedZones.filter((zone) => !expanded.has(zone)),
  };
}

/** Shell-level user preferences persisted beside the layout snapshot. */
export type CommandCenterPrefs = {
  version: 2;
  activeBottomTab: DockTabId;
  expandedZones: WorkspaceZoneId[];
  layoutLocked: boolean;
  safeAreasVisible: boolean;
  /** User-chosen dock sizes in pixels, keyed by zone id. */
  zoneSizes: Record<string, number>;
};

export const COMMAND_CENTER_PREFS_STORAGE_KEY = 'ubos.command-center.prefs.v1';

export function createDefaultCommandCenterPrefs(): CommandCenterPrefs {
  return {
    version: 2,
    activeBottomTab: 'layers',
    expandedZones: [],
    layoutLocked: false,
    safeAreasVisible: false,
    zoneSizes: {},
  };
}

const zoneIdSet = new Set<string>(WORKSPACE_ZONE_IDS);

const DOCK_TAB_IDS: readonly DockTabId[] = [
  'audio',
  'layers',
  'graphics',
  'replay',
  'automation',
  'routing',
  'production-graph',
  'logs',
  'system-status',
  'media',
  'collaboration',
];

const dockTabIdSet = new Set<string>(DOCK_TAB_IDS);

export function serializeCommandCenterPrefs(prefs: CommandCenterPrefs): string {
  return JSON.stringify(prefs);
}

/** Parse persisted prefs; anything malformed falls back to safe defaults. */
export function parseCommandCenterPrefs(serialized: string): CommandCenterPrefs | null {
  let raw: unknown;
  try {
    raw = JSON.parse(serialized);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as Record<string, unknown>;
  // Accept both version 1 (legacy) and version 2 (current). Unknown versions rejected.
  if (candidate.version !== 1 && candidate.version !== 2) return null;
  const defaults = createDefaultCommandCenterPrefs();
  return {
    version: 2,
    activeBottomTab:
      typeof candidate.activeBottomTab === 'string' && dockTabIdSet.has(candidate.activeBottomTab)
        ? (candidate.activeBottomTab as DockTabId)
        : defaults.activeBottomTab,
    expandedZones: Array.isArray(candidate.expandedZones)
      ? candidate.expandedZones.filter(
          (zone): zone is WorkspaceZoneId => typeof zone === 'string' && zoneIdSet.has(zone),
        )
      : defaults.expandedZones,
    layoutLocked: candidate.layoutLocked === true,
    safeAreasVisible: candidate.safeAreasVisible === true,
    zoneSizes: parseZoneSizes(candidate.zoneSizes),
  };
}

/**
 * Validate and sanitize a raw `zoneSizes` value from stored prefs.
 * Only numeric values for known resizable zone ids are retained.
 */
function parseZoneSizes(raw: unknown): Record<string, number> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (zoneIdSet.has(key) && typeof value === 'number' && isFinite(value) && value > 0) {
      result[key] = value;
    }
  }
  return result;
}
