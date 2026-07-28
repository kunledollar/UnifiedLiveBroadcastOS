import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';
import type { OutputViewMode } from '../workspace/monitor-state';
import type { LayoutFocusMode, ProfessionalWorkspaceId, SafeAreaToggles } from './workspace-types';

/**
 * Persistence architecture for saved workspaces.
 * Serialization is prepared; full persistence is not implemented in Phase 8.
 */
export const WORKSPACE_PERSISTENCE_VERSION = 1 as const;

export type WorkspacePersistenceSnapshot = {
  version: typeof WORKSPACE_PERSISTENCE_VERSION;
  selectedWorkspace: ProfessionalWorkspaceId;
  panelVisibility: Record<string, boolean>;
  panelSizes: {
    left: number;
    center: number;
    right: number;
    dock: number;
    operations: number;
  };
  activeTabs: {
    nav: NavItemId;
    operations: OperationsTabId;
    dock: DockTabId;
  };
  viewMode: OutputViewMode;
  splitRatio: number;
  safeAreaToggles: SafeAreaToggles;
  compactChrome: boolean;
  layoutFocus: LayoutFocusMode;
  updatedAt: string;
};

export function createWorkspacePersistenceSnapshot(
  input: Omit<WorkspacePersistenceSnapshot, 'version' | 'updatedAt'>,
): WorkspacePersistenceSnapshot {
  return {
    version: WORKSPACE_PERSISTENCE_VERSION,
    ...input,
    updatedAt: new Date().toISOString(),
  };
}

export function isWorkspacePersistenceSnapshot(
  value: unknown,
): value is WorkspacePersistenceSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as WorkspacePersistenceSnapshot;
  return snapshot.version === WORKSPACE_PERSISTENCE_VERSION && Boolean(snapshot.selectedWorkspace);
}
