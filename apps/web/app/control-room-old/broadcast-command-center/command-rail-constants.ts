import type { NavItemId, SourceDockTabId } from '../shell/types';

export type CommandRailItem = {
  id: NavItemId;
  label: string;
  icon: string;
  shortLabel: string;
};

export type SourceDockTab = {
  id: SourceDockTabId;
  label: string;
  icon: string;
  shortLabel: string;
};

/** Left command rail — high-level production navigation. */
export const commandRailItems: CommandRailItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉', shortLabel: 'Dash' },
  { id: 'production-graph', label: 'Production Graph', icon: '⬡', shortLabel: 'Graph' },
  { id: 'nodes', label: 'Nodes', icon: '◎', shortLabel: 'Nodes' },
  { id: 'inputs', label: 'Inputs', icon: '◫', shortLabel: 'In' },
  { id: 'outputs', label: 'Outputs', icon: '⇪', shortLabel: 'Out' },
  { id: 'scenes', label: 'Scenes', icon: '▦', shortLabel: 'Scn' },
  { id: 'settings', label: 'Settings', icon: '⚙', shortLabel: 'Set' },
];

/** Adjacent source / diagnostic dock tabs. */
export const sourceDockTabs: SourceDockTab[] = [
  { id: 'scenes', label: 'Scenes', icon: '▦', shortLabel: 'Scn' },
  { id: 'sources', label: 'Sources', icon: '◫', shortLabel: 'Src' },
  { id: 'media', label: 'Media', icon: '▣', shortLabel: 'Med' },
  { id: 'graphics', label: 'Graphics', icon: '◈', shortLabel: 'Gfx' },
  { id: 'guests', label: 'Guests', icon: '◉', shortLabel: 'Gst' },
  { id: 'diagnostics', label: 'Diagnostics', icon: '⎈', shortLabel: 'Diag' },
];

/** Map command-rail selection to a preferred source-dock tab. */
export function preferredSourceDockTab(nav: NavItemId): SourceDockTabId | null {
  switch (nav) {
    case 'scenes':
      return 'scenes';
    case 'inputs':
    case 'sources':
      return 'sources';
    case 'media':
      return 'media';
    case 'graphics':
      return 'graphics';
    default:
      return null;
  }
}

export function sourceDockTabLabel(tab: SourceDockTabId): string {
  return sourceDockTabs.find((entry) => entry.id === tab)?.label ?? 'Dock';
}
