'use client';

import { workspaceProfiles } from './workspace-presets';
import type { ProfessionalWorkspaceId } from './workspace-types';
import type { DockTabId, NavItemId, OperationsTabId } from '../shell/types';
import { normalizeDockTabId } from '../broadcast-workspaces';
import type { OutputViewMode } from '../workspace/monitor-state';

export type WorkspaceSelectionResult = {
  selectedWorkspace: ProfessionalWorkspaceId;
  viewMode: OutputViewMode;
  activeNav: NavItemId;
  activeOperationsTab: OperationsTabId;
  activeBottomDock: DockTabId;
};

export function applyWorkspaceProfile(id: ProfessionalWorkspaceId): WorkspaceSelectionResult {
  const profile = workspaceProfiles[id];
  return {
    selectedWorkspace: profile.id,
    viewMode: profile.defaultViewMode,
    activeNav: profile.defaultNavItem,
    activeOperationsTab: profile.defaultOperationsTab,
    activeBottomDock: normalizeDockTabId(profile.defaultDockTab),
  };
}

export function WorkspaceManager({
  selected,
  onSelect,
}: {
  selected: ProfessionalWorkspaceId;
  onSelect: (result: WorkspaceSelectionResult) => void;
}) {
  return null;
}

export function createWorkspaceSelectionHandler(
  onSelect: (result: WorkspaceSelectionResult) => void,
) {
  return (id: ProfessionalWorkspaceId) => {
    onSelect(applyWorkspaceProfile(id));
  };
}
