import type { WorkspacePanel, WorkspacePreset, WorkspacePresetId, WorkspaceZone, WorkspaceCanvasState } from './types';

function panel(
  id: string,
  panelType: WorkspacePanel['panelType'],
  zone: WorkspacePanel['zone'],
  title: string,
  order: number,
  flexWeight = 1,
  visible = true,
): WorkspacePanel {
  return {
    id,
    panelType,
    zone,
    title,
    collapsed: false,
    undocked: false,
    order,
    flexWeight,
    visible,
  };
}

function zone(
  id: WorkspaceZone['id'],
  label: string,
  panelIds: string[],
  flexWeight: number,
): WorkspaceZone {
  return { id, label, panelIds, flexWeight, collapsed: false };
}

const basePanels = {
  assetTree: panel('asset-tree', 'asset-tree', 'left', 'Assets & Sources', 0, 1),
  splitMonitor: panel('split-monitor', 'split-monitor', 'center', 'Program / Preview', 0, 3),
  switcher: panel('switcher', 'switcher', 'center', 'Switcher', 1, 0),
  streamPatch: panel('stream-patch', 'stream-patch', 'center', 'Stream Patch', 2, 1),
  audioMixer: panel('audio-mixer', 'audio-mixer', 'bottom', 'Audio Mixer', 0, 2),
  systemDiagnostics: panel('system-diagnostics', 'system-diagnostics', 'bottom', 'Diagnostics', 1, 1),
  bottomDeck: panel('bottom-deck', 'bottom-deck', 'bottom', 'Production Deck', 2, 2),
  operationsDock: panel('operations-dock', 'operations-dock', 'right', 'Operations', 0, 1),
};

function buildPreset(
  id: WorkspacePresetId,
  label: string,
  description: string,
  role: string,
  config: {
    zones: WorkspaceZone[];
    panels: WorkspacePanel[];
    defaultNavItem: WorkspacePreset['defaultNavItem'];
    defaultOperationsTab: WorkspacePreset['defaultOperationsTab'];
    defaultDockTab: WorkspacePreset['defaultDockTab'];
    programFlexWeight: number;
    previewFlexWeight: number;
  },
): WorkspacePreset {
  return { id, label, description, role, ...config };
}

/** Solo Streamer — program-first with compact controls. */
export const soloStreamerPreset = buildPreset(
  'solo-streamer',
  'Solo Streamer',
  'Single-operator streaming with program focus and minimal chrome',
  'streamer',
  {
    zones: [
      zone('left', 'Assets', ['asset-tree'], 220),
      zone('center', 'Monitors', ['split-monitor', 'switcher'], 1),
      zone('right', 'Operations', ['operations-dock'], 260),
      zone('bottom', 'Deck', ['audio-mixer', 'bottom-deck'], 148),
    ],
    panels: [
      basePanels.assetTree,
      basePanels.splitMonitor,
      basePanels.switcher,
      { ...basePanels.streamPatch, visible: false },
      basePanels.audioMixer,
      { ...basePanels.systemDiagnostics, visible: false },
      basePanels.bottomDeck,
      basePanels.operationsDock,
    ],
    defaultNavItem: 'scenes',
    defaultOperationsTab: 'streaming',
    defaultDockTab: 'audio',
    programFlexWeight: 72,
    previewFlexWeight: 28,
  },
);

/** Technical Director — dual monitors with routing matrix. */
export const technicalDirectorPreset = buildPreset(
  'technical-director',
  'Technical Director',
  'Program/preview priority with stream patch and diagnostics',
  'technical-director',
  {
    zones: [
      zone('left', 'Assets', ['asset-tree'], 240),
      zone('center', 'Monitors', ['split-monitor', 'switcher', 'stream-patch'], 1),
      zone('right', 'Operations', ['operations-dock'], 280),
      zone('bottom', 'Deck', ['audio-mixer', 'system-diagnostics', 'bottom-deck'], 140),
    ],
    panels: [
      basePanels.assetTree,
      basePanels.splitMonitor,
      basePanels.switcher,
      basePanels.streamPatch,
      basePanels.audioMixer,
      basePanels.systemDiagnostics,
      basePanels.bottomDeck,
      basePanels.operationsDock,
    ],
    defaultNavItem: 'scenes',
    defaultOperationsTab: 'routing',
    defaultDockTab: 'layers',
    programFlexWeight: 64,
    previewFlexWeight: 36,
  },
);

/** Audio Engineer — large mixer deck. */
export const audioEngineerPreset = buildPreset(
  'audio-engineer',
  'Audio Engineer',
  'Audio routing and metering focus',
  'audio-engineer',
  {
    zones: [
      zone('left', 'Sources', ['asset-tree'], 240),
      zone('center', 'Monitors', ['split-monitor', 'switcher'], 1),
      zone('right', 'Operations', ['operations-dock'], 280),
      zone('bottom', 'Audio', ['audio-mixer', 'stream-patch', 'bottom-deck'], 220),
    ],
    panels: [
      { ...basePanels.assetTree, title: 'Source Tree' },
      { ...basePanels.splitMonitor, flexWeight: 2 },
      basePanels.switcher,
      { ...basePanels.streamPatch, title: 'Audio Patch' },
      { ...basePanels.audioMixer, flexWeight: 3 },
      { ...basePanels.systemDiagnostics, visible: true },
      basePanels.bottomDeck,
      { ...basePanels.operationsDock, title: 'Routing Console' },
    ],
    defaultNavItem: 'sources',
    defaultOperationsTab: 'routing',
    defaultDockTab: 'audio',
    programFlexWeight: 45,
    previewFlexWeight: 25,
  },
);

/** Graphics Operator — graphics deck emphasis. */
export const graphicsOperatorPreset = buildPreset(
  'graphics-operator',
  'Graphics Operator',
  'Layer stack and graphics preview controls',
  'graphics-operator',
  {
    zones: [
      zone('left', 'Assets', ['asset-tree'], 260),
      zone('center', 'Monitors', ['split-monitor', 'switcher'], 1),
      zone('right', 'Operations', ['operations-dock'], 280),
      zone('bottom', 'Graphics', ['bottom-deck', 'audio-mixer'], 200),
    ],
    panels: [
      basePanels.assetTree,
      basePanels.splitMonitor,
      basePanels.switcher,
      { ...basePanels.streamPatch, visible: false },
      { ...basePanels.audioMixer, flexWeight: 1 },
      { ...basePanels.systemDiagnostics, visible: false },
      { ...basePanels.bottomDeck, title: 'Graphics Deck' },
      basePanels.operationsDock,
    ],
    defaultNavItem: 'graphics',
    defaultOperationsTab: 'compositor',
    defaultDockTab: 'graphics',
    programFlexWeight: 66,
    previewFlexWeight: 34,
  },
);

/** Replay Operator — replay deck emphasis. */
export const replayOperatorPreset = buildPreset(
  'replay-operator',
  'Replay Operator',
  'Clip browser and replay controls',
  'replay-operator',
  {
    zones: [
      zone('left', 'Clips', ['asset-tree'], 280),
      zone('center', 'Monitors', ['split-monitor', 'switcher'], 1),
      zone('right', 'Operations', ['operations-dock'], 280),
      zone('bottom', 'Replay', ['bottom-deck', 'system-diagnostics'], 200),
    ],
    panels: [
      { ...basePanels.assetTree, title: 'Clip Browser' },
      { ...basePanels.splitMonitor, flexWeight: 3 },
      basePanels.switcher,
      { ...basePanels.streamPatch, visible: false },
      { ...basePanels.audioMixer, visible: false },
      basePanels.systemDiagnostics,
      { ...basePanels.bottomDeck, title: 'Replay Deck' },
      basePanels.operationsDock,
    ],
    defaultNavItem: 'replay',
    defaultOperationsTab: 'preview',
    defaultDockTab: 'replay',
    programFlexWeight: 68,
    previewFlexWeight: 32,
  },
);

/** Producer — balanced dashboard layout. */
export const producerPreset = buildPreset(
  'producer',
  'Producer',
  'Guests, automation, and production overview',
  'producer',
  {
    zones: [
      zone('left', 'Assets', ['asset-tree'], 260),
      zone('center', 'Monitors', ['split-monitor', 'switcher', 'stream-patch'], 1),
      zone('right', 'Operations', ['operations-dock'], 300),
      zone('bottom', 'Production', ['bottom-deck', 'audio-mixer', 'system-diagnostics'], 180),
    ],
    panels: [
      basePanels.assetTree,
      basePanels.splitMonitor,
      basePanels.switcher,
      { ...basePanels.streamPatch, flexWeight: 1 },
      basePanels.audioMixer,
      basePanels.systemDiagnostics,
      { ...basePanels.bottomDeck, title: 'Production Deck' },
      basePanels.operationsDock,
    ],
    defaultNavItem: 'scenes',
    defaultOperationsTab: 'automation',
    defaultDockTab: 'automation',
    programFlexWeight: 62,
    previewFlexWeight: 38,
  },
);

export const workspaceCanvasPresets: Record<WorkspacePresetId, WorkspacePreset> = {
  'solo-streamer': soloStreamerPreset,
  'technical-director': technicalDirectorPreset,
  'audio-engineer': audioEngineerPreset,
  'graphics-operator': graphicsOperatorPreset,
  'replay-operator': replayOperatorPreset,
  producer: producerPreset,
};

export const workspacePresetList = Object.values(workspaceCanvasPresets);

export function getWorkspacePreset(id: WorkspacePresetId): WorkspacePreset {
  return workspaceCanvasPresets[id];
}

export function createCanvasStateFromPreset(preset: WorkspacePreset): WorkspaceCanvasState {
  const panels = Object.fromEntries(preset.panels.map((p) => [p.id, { ...p }])) as WorkspaceCanvasState['panels'];
  const zones = Object.fromEntries(preset.zones.map((z) => [z.id, { ...z }])) as WorkspaceCanvasState['zones'];
  return {
    presetId: preset.id,
    panels,
    zones,
    undockedPanelIds: [],
    activeNavItem: preset.defaultNavItem,
    activeOperationsTab: preset.defaultOperationsTab,
    activeDockTab: preset.defaultDockTab,
  };
}
