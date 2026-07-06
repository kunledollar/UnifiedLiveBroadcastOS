import type { DockTabId } from '../shell/types';

export type BroadcastWorkspaceTab = {
  id: DockTabId;
  label: string;
  shortLabel?: string;
};

/** Modular bottom broadcast workspace tabs — only the active tab expands content. */
export const broadcastWorkspaceTabs: BroadcastWorkspaceTab[] = [
  { id: 'layers', label: 'Scenes', shortLabel: 'Scn' },
  { id: 'audio', label: 'Audio Mixer', shortLabel: 'Aud' },
  { id: 'graphics', label: 'Graphics', shortLabel: 'Gfx' },
  { id: 'replay', label: 'Replay', shortLabel: 'Rpl' },
  { id: 'automation', label: 'Automation', shortLabel: 'Auto' },
  { id: 'routing', label: 'Routing', shortLabel: 'Rte' },
  { id: 'production-graph', label: 'Production Graph', shortLabel: 'Graph' },
  { id: 'logs', label: 'Logs', shortLabel: 'Log' },
  { id: 'system-status', label: 'System Status', shortLabel: 'Sys' },
];

export const broadcastWorkspaceTabIds = new Set<DockTabId>(
  broadcastWorkspaceTabs.map((tab) => tab.id),
);

/** Map legacy dock tabs to the modular workspace set. */
export function normalizeDockTabId(tab: DockTabId): DockTabId {
  if (broadcastWorkspaceTabIds.has(tab)) return tab;
  if (tab === 'media') return 'graphics';
  if (tab === 'collaboration') return 'automation';
  return 'audio';
}

export function workspaceTabLabel(tab: DockTabId): string {
  return broadcastWorkspaceTabs.find((entry) => entry.id === tab)?.label ?? 'Workspace';
}
