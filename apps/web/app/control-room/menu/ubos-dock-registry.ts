import type { UbosDockPanelDefinition, UbosDockPanelId } from './ubos-menu-types';

export const UBOS_DOCK_PANEL_LIST: UbosDockPanelDefinition[] = [
  { id: 'scenes', label: 'Scenes', zone: 'left', navItem: 'scenes' },
  { id: 'sources', label: 'Sources', zone: 'left', navItem: 'sources' },
  { id: 'audio-mixer', label: 'Audio Mixer', zone: 'bottom', dockTab: 'audio' },
  { id: 'audio-channels', label: 'Audio Channels', zone: 'right', operationsTab: 'routing' },
  { id: 'scene-transitions', label: 'Scene Transitions', zone: 'center' },
  { id: 'replay', label: 'Replay', zone: 'bottom', dockTab: 'replay', navItem: 'replay' },
  { id: 'media', label: 'Media', zone: 'bottom', dockTab: 'media', navItem: 'media' },
  { id: 'graphics', label: 'Graphics', zone: 'bottom', dockTab: 'graphics', navItem: 'graphics' },
  { id: 'guests', label: 'Guests', zone: 'right', operationsTab: 'guests' },
  { id: 'inspector', label: 'Inspector', zone: 'right', operationsTab: 'inspector' },
  { id: 'pipeline-inspector', label: 'Pipeline Inspector', zone: 'floating' },
  { id: 'broadcast-io', label: 'Broadcast I/O', zone: 'right', operationsTab: 'routing' },
  { id: 'streaming', label: 'Streaming', zone: 'right', operationsTab: 'streaming' },
  { id: 'recording', label: 'Recording', zone: 'right', operationsTab: 'recording' },
  { id: 'automation', label: 'Automation', zone: 'bottom', dockTab: 'automation' },
  { id: 'monitor-wall', label: 'Monitor Wall', zone: 'right', operationsTab: 'monitoring' },
  { id: 'timeline', label: 'Timeline', zone: 'bottom', dockTab: 'layers' },
  { id: 'logs', label: 'Logs', zone: 'bottom', dockTab: 'logs', operationsTab: 'logs' },
];

export const ubosDockPanelRegistry: Record<UbosDockPanelId, UbosDockPanelDefinition> =
  Object.fromEntries(UBOS_DOCK_PANEL_LIST.map((panel) => [panel.id, panel])) as Record<
    UbosDockPanelId,
    UbosDockPanelDefinition
  >;

const ZONE_PANELS: Record<string, UbosDockPanelId[]> = {
  left: ['scenes', 'sources'],
  right: [
    'audio-channels',
    'guests',
    'inspector',
    'broadcast-io',
    'streaming',
    'recording',
    'monitor-wall',
  ],
  bottom: [
    'audio-mixer',
    'replay',
    'media',
    'graphics',
    'automation',
    'timeline',
    'logs',
  ],
  center: ['scene-transitions'],
  floating: ['pipeline-inspector'],
};

export function isZoneVisible(
  zone: keyof typeof ZONE_PANELS,
  dockPanels: Record<UbosDockPanelId, { visible: boolean }>,
): boolean {
  return ZONE_PANELS[zone]?.some((id) => dockPanels[id]?.visible) ?? false;
}

export function getDefaultVisiblePanelForZone(
  zone: keyof typeof ZONE_PANELS,
  dockPanels: Record<UbosDockPanelId, { visible: boolean }>,
): UbosDockPanelId | null {
  const panels = ZONE_PANELS[zone] ?? [];
  return panels.find((id) => dockPanels[id]?.visible) ?? null;
}
