/**
 * Versioned custom workspace registry. This module is deliberately browser
 * agnostic: callers provide storage, while the registry only accepts plain
 * layout metadata and never receives production runtime objects.
 */
import type {
  WorkspaceLayoutSnapshot,
  WorkspacePanelState,
  WorkspacePresetId,
  WorkspaceZoneId,
} from './types.js';
import { WORKSPACE_PRESET_IDS, WORKSPACE_ZONE_IDS } from './types.js';

export const CUSTOM_WORKSPACE_REGISTRY_VERSION = 1 as const;
export const CUSTOM_WORKSPACE_STORAGE_KEY = 'ubos.workspace-manager.custom-workspaces.v1';

export type WorkspacePresentation = {
  panelStates: WorkspacePanelState[];
  collapsedZones: WorkspaceZoneId[];
  zoneSizes: Partial<Record<WorkspaceZoneId, number>>;
  activeBottomTab: string;
};

export type CustomWorkspace = {
  id: string;
  kind: 'custom';
  name: string;
  sourceWorkspaceId: WorkspacePresetId | string;
  createdAt: string;
  updatedAt: string;
  version: 1;
  presentation: WorkspacePresentation;
};

export type CustomWorkspaceRegistry = { version: 1; workspaces: Record<string, CustomWorkspace> };

const zones = new Set<string>(WORKSPACE_ZONE_IDS);
const builtIns = new Set<string>(WORKSPACE_PRESET_IDS);
const validPresentation = (value: unknown): value is WorkspacePresentation => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    Array.isArray(item.panelStates) &&
    Array.isArray(item.collapsedZones) &&
    typeof item.activeBottomTab === 'string' &&
    item.activeBottomTab.length > 0 &&
    !!item.zoneSizes &&
    typeof item.zoneSizes === 'object'
  );
};

export const createEmptyCustomWorkspaceRegistry = (): CustomWorkspaceRegistry => ({
  version: 1,
  workspaces: {},
});

export function parseCustomWorkspaceRegistry(serialized: string): CustomWorkspaceRegistry | null {
  try {
    const raw: unknown = JSON.parse(serialized);
    if (!raw || typeof raw !== 'object') return null;
    const candidate = raw as Record<string, unknown>;
    if (
      candidate.version !== CUSTOM_WORKSPACE_REGISTRY_VERSION ||
      !candidate.workspaces ||
      typeof candidate.workspaces !== 'object'
    )
      return null;
    const workspaces: Record<string, CustomWorkspace> = {};
    for (const [id, rawWorkspace] of Object.entries(
      candidate.workspaces as Record<string, unknown>,
    )) {
      if (!rawWorkspace || typeof rawWorkspace !== 'object' || !id.startsWith('custom:')) continue;
      const workspace = rawWorkspace as Record<string, unknown>;
      if (
        workspace.id !== id ||
        workspace.kind !== 'custom' ||
        typeof workspace.name !== 'string' ||
        !workspace.name.trim() ||
        typeof workspace.sourceWorkspaceId !== 'string' ||
        typeof workspace.createdAt !== 'string' ||
        typeof workspace.updatedAt !== 'string' ||
        workspace.version !== 1 ||
        !validPresentation(workspace.presentation)
      )
        continue;
      const presentation = workspace.presentation;
      const panelStates = presentation.panelStates.flatMap((state): WorkspacePanelState[] => {
        if (!state || typeof state !== 'object') return [];
        const value = state as unknown as Record<string, unknown>;
        if (
          typeof value.panelId !== 'string' ||
          typeof value.zone !== 'string' ||
          !zones.has(value.zone)
        )
          return [];
        return [
          {
            panelId: value.panelId,
            zone: value.zone as WorkspaceZoneId,
            visible: value.visible === true,
            collapsed: value.collapsed === true,
          },
        ];
      });
      const collapsedZones = presentation.collapsedZones.filter(
        (zone): zone is WorkspaceZoneId => typeof zone === 'string' && zones.has(zone),
      );
      const zoneSizes = Object.fromEntries(
        Object.entries(presentation.zoneSizes).filter(
          ([zone, size]) =>
            zones.has(zone) && typeof size === 'number' && Number.isFinite(size) && size >= 0,
        ),
      ) as Partial<Record<WorkspaceZoneId, number>>;
      workspaces[id] = {
        id,
        kind: 'custom',
        name: workspace.name.trim(),
        sourceWorkspaceId: workspace.sourceWorkspaceId,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        version: 1,
        presentation: {
          panelStates,
          collapsedZones: [...new Set(collapsedZones)],
          zoneSizes,
          activeBottomTab: presentation.activeBottomTab,
        },
      };
    }
    return { version: 1, workspaces };
  } catch {
    return null;
  }
}

export const serializeCustomWorkspaceRegistry = (registry: CustomWorkspaceRegistry) =>
  JSON.stringify(registry);

export function createCustomWorkspace(
  sourceWorkspaceId: WorkspacePresetId | string,
  name: string,
  presentation: WorkspacePresentation,
  id = `custom:${cryptoSafeId()}`,
  now = new Date().toISOString(),
): CustomWorkspace {
  return {
    id,
    kind: 'custom',
    name: name.trim() || 'Untitled workspace',
    sourceWorkspaceId,
    createdAt: now,
    updatedAt: now,
    version: 1,
    presentation: normalizePresentation(presentation),
  };
}

export function duplicateCustomWorkspace(
  workspace: CustomWorkspace,
  name = `${workspace.name} copy`,
  id = `custom:${cryptoSafeId()}`,
  now = new Date().toISOString(),
): CustomWorkspace {
  return createCustomWorkspace(workspace.id, name, workspace.presentation, id, now);
}

export function renameCustomWorkspace(
  registry: CustomWorkspaceRegistry,
  id: string,
  name: string,
  now = new Date().toISOString(),
): CustomWorkspaceRegistry {
  const current = registry.workspaces[id];
  if (!current || !name.trim()) return registry;
  return {
    ...registry,
    workspaces: { ...registry.workspaces, [id]: { ...current, name: name.trim(), updatedAt: now } },
  };
}

export function deleteCustomWorkspace(
  registry: CustomWorkspaceRegistry,
  id: string,
): CustomWorkspaceRegistry {
  if (!registry.workspaces[id]) return registry;
  const { [id]: _removed, ...workspaces } = registry.workspaces;
  return { ...registry, workspaces };
}

/** Reset a custom workspace to the captured presentation of its source. */
export function resetCustomWorkspace(
  registry: CustomWorkspaceRegistry,
  id: string,
  source: WorkspacePresentation,
  now = new Date().toISOString(),
): CustomWorkspaceRegistry {
  const current = registry.workspaces[id];
  if (!current) return registry;
  return {
    ...registry,
    workspaces: {
      ...registry.workspaces,
      [id]: { ...current, presentation: normalizePresentation(source), updatedAt: now },
    },
  };
}

export function saveCustomWorkspace(
  registry: CustomWorkspaceRegistry,
  id: string,
  presentation: WorkspacePresentation,
  now = new Date().toISOString(),
): CustomWorkspaceRegistry {
  const current = registry.workspaces[id];
  if (!current) return registry;
  return {
    ...registry,
    workspaces: {
      ...registry.workspaces,
      [id]: { ...current, presentation: normalizePresentation(presentation), updatedAt: now },
    },
  };
}

function cryptoSafeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizePresentation(value: WorkspacePresentation): WorkspacePresentation {
  return {
    panelStates: [...value.panelStates]
      .map((state) => ({ ...state }))
      .sort((a, b) => a.panelId.localeCompare(b.panelId)),
    collapsedZones: [...new Set(value.collapsedZones)].sort(),
    zoneSizes: Object.fromEntries(
      Object.entries(value.zoneSizes).sort(([a], [b]) => a.localeCompare(b)),
    ),
    activeBottomTab: value.activeBottomTab,
  };
}
export const presentationsEqual = (left: WorkspacePresentation, right: WorkspacePresentation) =>
  JSON.stringify(normalizePresentation(left)) === JSON.stringify(normalizePresentation(right));
export const workspaceState = (
  current: WorkspacePresentation,
  baseline: WorkspacePresentation,
  saved: boolean,
): 'factory' | 'saved' | 'unsaved' =>
  presentationsEqual(current, baseline) ? (saved ? 'saved' : 'factory') : 'unsaved';
export function snapshotPresentation(
  snapshot: WorkspaceLayoutSnapshot,
  zoneSizes: Partial<Record<WorkspaceZoneId, number>>,
  activeBottomTab: string,
): WorkspacePresentation {
  return {
    panelStates: snapshot.panelStates,
    collapsedZones: snapshot.collapsedZones,
    zoneSizes,
    activeBottomTab,
  };
}
export const isBuiltInWorkspaceId = (id: string) => builtIns.has(id);
