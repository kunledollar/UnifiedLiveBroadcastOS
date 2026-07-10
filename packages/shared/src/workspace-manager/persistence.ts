/**
 * Layout metadata persistence for the UBOS 3.15 Workspace Manager.
 *
 * Snapshots are plain JSON documents describing panel placement and zone
 * collapse state. They contain layout metadata only — no runtime media
 * objects — and are storage-agnostic: the shell layer decides where the
 * serialized string lives (localStorage, profile store, file, ...).
 */
import type { WorkspacePanelRegistry } from './registry.js';
import type {
  WorkspaceLayoutSnapshot,
  WorkspacePresetId,
  WorkspaceZoneId,
} from './types.js';
import { WORKSPACE_PRESET_IDS, WORKSPACE_ZONE_IDS } from './types.js';

export const WORKSPACE_LAYOUT_SNAPSHOT_VERSION = 1 as const;

/** Suggested storage key for shells that persist snapshots in web storage. */
export const WORKSPACE_LAYOUT_STORAGE_KEY = 'ubos.workspace-manager.layout.v1';

const zoneIdSet = new Set<string>(WORKSPACE_ZONE_IDS);
const presetIdSet = new Set<string>(WORKSPACE_PRESET_IDS);

/** Capture the current layout metadata of a registry as a snapshot. */
export function createLayoutSnapshot(
  registry: WorkspacePanelRegistry,
  activePresetId: WorkspacePresetId,
  collapsedZones: readonly WorkspaceZoneId[] = [],
  savedAt: string = new Date().toISOString(),
): WorkspaceLayoutSnapshot {
  return {
    version: WORKSPACE_LAYOUT_SNAPSHOT_VERSION,
    activePresetId,
    collapsedZones: [...new Set(collapsedZones)],
    panelStates: registry.getPanelStates(),
    savedAt,
  };
}

export function serializeLayoutSnapshot(snapshot: WorkspaceLayoutSnapshot): string {
  return JSON.stringify(snapshot);
}

/**
 * Parse and sanitize a serialized snapshot. Returns null for anything that
 * is not a valid version-1 snapshot; unknown zones and malformed panel
 * entries are dropped rather than failing the whole restore.
 */
export function parseLayoutSnapshot(serialized: string): WorkspaceLayoutSnapshot | null {
  let raw: unknown;
  try {
    raw = JSON.parse(serialized);
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const candidate = raw as Record<string, unknown>;
  if (candidate.version !== WORKSPACE_LAYOUT_SNAPSHOT_VERSION) return null;
  if (typeof candidate.activePresetId !== 'string' || !presetIdSet.has(candidate.activePresetId)) return null;
  if (!Array.isArray(candidate.collapsedZones) || !Array.isArray(candidate.panelStates)) return null;

  const collapsedZones = candidate.collapsedZones.filter(
    (zone): zone is WorkspaceZoneId => typeof zone === 'string' && zoneIdSet.has(zone),
  );
  const panelStates = candidate.panelStates.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const state = entry as Record<string, unknown>;
    if (typeof state.panelId !== 'string' || state.panelId.length === 0) return [];
    if (typeof state.zone !== 'string' || !zoneIdSet.has(state.zone)) return [];
    return [
      {
        panelId: state.panelId,
        zone: state.zone as WorkspaceZoneId,
        visible: state.visible === true,
        collapsed: state.collapsed === true,
      },
    ];
  });

  return {
    version: WORKSPACE_LAYOUT_SNAPSHOT_VERSION,
    activePresetId: candidate.activePresetId as WorkspacePresetId,
    collapsedZones: [...new Set(collapsedZones)],
    panelStates,
    savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date(0).toISOString(),
  };
}

/**
 * Apply a snapshot's panel states back onto a registry. Panels missing from
 * the registry are skipped; panel rules (closable/collapsible/allowedZones)
 * always win over persisted state.
 */
export function applyLayoutSnapshot(registry: WorkspacePanelRegistry, snapshot: WorkspaceLayoutSnapshot): void {
  registry.restorePanelStates(snapshot.panelStates);
}
