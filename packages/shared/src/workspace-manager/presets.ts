/**
 * Workspace presets for the UBOS 3.15 Workspace Manager.
 *
 * A preset is a declarative arrangement of panels and zones for a specific
 * operator role. Presets contain layout metadata only and never change what
 * a panel renders.
 */
import { WORKSPACE_PANEL_IDS } from './panels.js';
import type { WorkspacePreset, WorkspacePresetId, WorkspaceValidationIssue } from './types.js';
import { WORKSPACE_PRESET_IDS, WORKSPACE_ZONE_IDS } from './types.js';

const P = WORKSPACE_PANEL_IDS;

/** Panels every preset keeps on screen: Program/Preview may never disappear. */
const MONITOR_PANELS = [P.programMonitor, P.previewMonitor];

/**
 * Layout fragments owned by the canonical WorkspaceDefinition catalog.
 * This is intentionally not exported as the legacy preset API; definitions
 * merge these bounded geometry fragments with the role contract and expose a
 * compatibility adapter from `definitions.ts`.
 */
export const workspaceDefinitionLayouts: Record<WorkspacePresetId, WorkspacePreset> = {
  director: {
    id: 'director',
    name: 'Director',
    description:
      'Program and Preview dominant with scenes, sources, inspector, and native recording at hand',
    activeBottomTab: P.scenes,
    visiblePanels: [...MONITOR_PANELS, P.scenes, P.sources, P.inspector, P.recording],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.pipelineInspector, P.broadcastIo],
    zoneOverrides: {},
    collapsedZones: [],
    centerEmphasis: 'balanced',
    // Director uses balanced dock geometry: standard 270px docks, 280px bottom workspace.
    zoneSizeDefaults: {
      'left-dock': 270,
      'right-dock': 270,
      'bottom-workspace': 280,
    },
  },
  'solo-streamer': {
    id: 'solo-streamer',
    name: 'Solo Streamer',
    description:
      'Program/Preview dominant with chat, recording, and streaming; routing and diagnostics hidden',
    activeBottomTab: P.sources,
    visiblePanels: [...MONITOR_PANELS, P.chat, P.recording, P.streaming, P.sources],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.broadcastIo, P.pipelineInspector, P.telemetry],
    zoneOverrides: { [P.sources]: 'bottom-workspace' },
    collapsedZones: ['left-dock'],
    centerEmphasis: 'program',
    // Solo Streamer: left dock collapsed; right dock slightly narrower to give more center space.
    zoneSizeDefaults: {
      'right-dock': 300,
      'bottom-workspace': 240,
    },
  },
  'technical-director': {
    id: 'technical-director',
    name: 'Technical Director',
    description:
      'Routing matrix, broadcast I/O, pipeline inspector, and telemetry front and center',
    activeBottomTab: P.routingMatrix,
    visiblePanels: [
      ...MONITOR_PANELS,
      P.routingMatrix,
      P.broadcastIo,
      P.pipelineInspector,
      P.telemetry,
    ],
    collapsedPanels: [],
    hiddenPanels: [P.chat],
    zoneOverrides: {},
    collapsedZones: [],
    centerEmphasis: 'balanced',
    // Technical Director: wider right dock for routing/telemetry panels.
    zoneSizeDefaults: {
      'left-dock': 270,
      'right-dock': 320,
      'bottom-workspace': 320,
    },
  },
  'audio-engineer': {
    id: 'audio-engineer',
    name: 'Audio Engineer',
    description: 'Audio mixer and master bus dominant; program small but visible',
    activeBottomTab: P.audioMixer,
    visiblePanels: [...MONITOR_PANELS, P.audioMixer, P.masterBus],
    collapsedPanels: [P.scenes, P.sources],
    hiddenPanels: [P.chat, P.graphicsLibrary],
    zoneOverrides: {},
    collapsedZones: ['left-dock'],
    centerEmphasis: 'program',
    // Audio Engineer: left dock collapsed; bottom workspace expanded for audio mixer + master bus.
    zoneSizeDefaults: {
      'right-dock': 300,
      'bottom-workspace': 360,
    },
  },
  'graphics-operator': {
    id: 'graphics-operator',
    name: 'Graphics Operator',
    description: 'Graphics library and inspector with Program/Preview visible',
    activeBottomTab: P.graphicsLibrary,
    visiblePanels: [...MONITOR_PANELS, P.graphicsLibrary, P.inspector],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.broadcastIo],
    zoneOverrides: {},
    collapsedZones: [],
    centerEmphasis: 'balanced',
    // Graphics Operator: left dock narrower (graphics library); right dock narrower; bottom workspace expanded.
    zoneSizeDefaults: {
      'left-dock': 240,
      'right-dock': 260,
      'bottom-workspace': 340,
    },
  },
  'replay-operator': {
    id: 'replay-operator',
    name: 'Replay Operator',
    description: 'Replay timeline and clip library with Program/Preview visible',
    activeBottomTab: P.replayTimeline,
    visiblePanels: [...MONITOR_PANELS, P.replayTimeline, P.clipLibrary],
    collapsedPanels: [],
    hiddenPanels: [P.chat, P.graphicsLibrary],
    zoneOverrides: {},
    collapsedZones: [],
    centerEmphasis: 'program',
    // Replay Operator: standard docks; bottom workspace tall for timeline.
    zoneSizeDefaults: {
      'left-dock': 270,
      'right-dock': 270,
      'bottom-workspace': 360,
    },
  },
  'streaming-operator': {
    id: 'streaming-operator',
    name: 'Streaming Operator',
    description: 'Streaming, outputs, and telemetry with system status workspace',
    activeBottomTab: P.systemStatus,
    visiblePanels: [...MONITOR_PANELS, P.streaming, P.outputs, P.telemetry, P.systemStatus],
    collapsedPanels: [],
    hiddenPanels: [P.chat, P.graphicsLibrary, P.replayTimeline],
    zoneOverrides: {},
    collapsedZones: ['left-dock'],
    centerEmphasis: 'program',
    // Streaming Operator: left dock collapsed; wider right dock for outputs and telemetry.
    zoneSizeDefaults: {
      'right-dock': 340,
      'bottom-workspace': 300,
    },
  },
  'monitor-wall': {
    id: 'monitor-wall',
    name: 'Monitor Wall',
    description: 'Monitor wall dominant with Program/Preview visible',
    activeBottomTab: P.monitorWall,
    visiblePanels: [...MONITOR_PANELS, P.monitorWall],
    collapsedPanels: [P.scenes, P.sources],
    hiddenPanels: [P.chat, P.inspector],
    zoneOverrides: { [P.monitorWall]: 'bottom-workspace' },
    collapsedZones: ['left-dock', 'right-dock'],
    centerEmphasis: 'balanced',
    // Monitor Wall: both docks collapsed; taller bottom workspace for the monitor grid.
    zoneSizeDefaults: {
      'bottom-workspace': 400,
    },
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'All docks collapsed; Program/Preview maximized',
    activeBottomTab: P.scenes,
    visiblePanels: [...MONITOR_PANELS],
    collapsedPanels: [],
    hiddenPanels: [],
    zoneOverrides: {},
    collapsedZones: ['left-dock', 'right-dock', 'bottom-workspace'],
    centerEmphasis: 'balanced',
    zoneSizeDefaults: {},
  },
  production: {
    id: 'production',
    name: 'Production',
    description: 'Build, switch, and orchestrate the live show with scenes, switcher, and outputs',
    activeBottomTab: P.scenes,
    visiblePanels: [...MONITOR_PANELS, P.scenes, P.sources, P.inspector, P.recording, P.streaming],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.pipelineInspector, P.broadcastIo],
    zoneOverrides: {},
    collapsedZones: [],
    centerEmphasis: 'balanced',
    zoneSizeDefaults: {
      'left-dock': 280,
      'right-dock': 280,
      'bottom-workspace': 300,
    },
  },
  'social-fabric': {
    id: 'social-fabric',
    name: 'Social Fabric',
    description: 'Engage, moderate, and amplify your community across all platforms',
    activeBottomTab: P.chat,
    visiblePanels: [...MONITOR_PANELS, P.chat, P.sources],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.broadcastIo, P.pipelineInspector, P.replayTimeline],
    zoneOverrides: {},
    collapsedZones: ['left-dock'],
    centerEmphasis: 'program',
    zoneSizeDefaults: {
      'right-dock': 320,
      'bottom-workspace': 260,
    },
  },
  'media-operator': {
    id: 'media-operator',
    name: 'Media',
    description: 'Ingest, organize, and manage all media assets with preview',
    activeBottomTab: P.sources,
    visiblePanels: [...MONITOR_PANELS, P.sources, P.inspector],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.broadcastIo, P.chat],
    zoneOverrides: {},
    collapsedZones: [],
    centerEmphasis: 'preview',
    zoneSizeDefaults: {
      'left-dock': 300,
      'right-dock': 280,
      'bottom-workspace': 300,
    },
  },
  'distribution-operator': {
    id: 'distribution-operator',
    name: 'Distribution',
    description: 'Distribute everywhere. Monitor every destination.',
    activeBottomTab: P.streaming,
    visiblePanels: [...MONITOR_PANELS, P.streaming, P.outputs, P.telemetry, P.systemStatus],
    collapsedPanels: [],
    hiddenPanels: [P.chat, P.graphicsLibrary, P.replayTimeline],
    zoneOverrides: {},
    collapsedZones: ['left-dock'],
    centerEmphasis: 'program',
    zoneSizeDefaults: {
      'right-dock': 340,
      'bottom-workspace': 320,
    },
  },
  'automation-operator': {
    id: 'automation-operator',
    name: 'Automation',
    description: 'Orchestrate, automate, and execute production workflows',
    activeBottomTab: P.scenes,
    visiblePanels: [...MONITOR_PANELS, P.scenes, P.sources, P.inspector],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.broadcastIo, P.chat],
    zoneOverrides: {},
    collapsedZones: [],
    centerEmphasis: 'program',
    zoneSizeDefaults: {
      'left-dock': 270,
      'right-dock': 300,
      'bottom-workspace': 320,
    },
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Measure performance, understand your audience, and optimize every broadcast',
    activeBottomTab: P.systemStatus,
    visiblePanels: [...MONITOR_PANELS, P.telemetry, P.systemStatus],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.broadcastIo, P.chat, P.replayTimeline],
    zoneOverrides: {},
    collapsedZones: ['left-dock'],
    centerEmphasis: 'program',
    zoneSizeDefaults: {
      'right-dock': 300,
      'bottom-workspace': 360,
    },
  },
  streamer: {
    id: 'streamer',
    name: 'Streamer',
    description: 'Focus, engage, and stream with an optimized solo creator layout',
    activeBottomTab: P.sources,
    visiblePanels: [...MONITOR_PANELS, P.chat, P.recording, P.streaming, P.sources],
    collapsedPanels: [],
    hiddenPanels: [P.routingMatrix, P.broadcastIo, P.pipelineInspector, P.telemetry],
    zoneOverrides: { [P.sources]: 'bottom-workspace' },
    collapsedZones: ['left-dock'],
    centerEmphasis: 'program',
    zoneSizeDefaults: {
      'right-dock': 300,
      'bottom-workspace': 240,
    },
  },
};

export function isWorkspacePresetId(value: string): value is WorkspacePresetId {
  return (WORKSPACE_PRESET_IDS as readonly string[]).includes(value);
}

const zoneIdSet = new Set<string>(WORKSPACE_ZONE_IDS);

/**
 * Validate a preset's internal consistency: no panel may appear in more than
 * one of visible/collapsed/hidden, all zones must exist, monitors may never
 * be hidden, and every collapsed zone must actually be collapsible.
 */
export function validateWorkspacePreset(preset: WorkspacePreset): WorkspaceValidationIssue[] {
  const issues: WorkspaceValidationIssue[] = [];
  const issue = (code: string, message: string) =>
    issues.push({ code, message, subject: preset.id });

  if (!isWorkspacePresetId(preset.id))
    issue('PRESET_ID_INVALID', `Unknown preset id: ${preset.id}`);
  if (!preset.name.trim()) issue('PRESET_NAME_REQUIRED', 'Preset name is required');
  if (!preset.activeBottomTab.trim())
    issue('PRESET_BOTTOM_TAB_REQUIRED', 'activeBottomTab is required');

  const seen = new Map<string, string>();
  const checkList = (list: string[], label: string) => {
    for (const panelId of list) {
      const previous = seen.get(panelId);
      if (previous && previous !== label) {
        issue(
          'PRESET_PANEL_STATE_CONFLICT',
          `Panel "${panelId}" appears in both ${previous} and ${label}`,
        );
      }
      seen.set(panelId, label);
    }
  };
  checkList(preset.visiblePanels, 'visiblePanels');
  checkList(preset.collapsedPanels, 'collapsedPanels');
  checkList(preset.hiddenPanels, 'hiddenPanels');

  for (const monitor of MONITOR_PANELS) {
    if (preset.hiddenPanels.includes(monitor)) {
      issue('PRESET_MONITOR_HIDDEN', `Preset may not hide monitor panel "${monitor}"`);
    }
    if (!preset.visiblePanels.includes(monitor)) {
      issue('PRESET_MONITOR_NOT_VISIBLE', `Preset must keep monitor panel "${monitor}" visible`);
    }
  }

  for (const [panelId, zoneId] of Object.entries(preset.zoneOverrides)) {
    if (!zoneIdSet.has(zoneId))
      issue(
        'PRESET_OVERRIDE_ZONE_INVALID',
        `Panel "${panelId}" overrides to unknown zone "${String(zoneId)}"`,
      );
  }

  for (const zoneId of preset.collapsedZones) {
    if (!zoneIdSet.has(zoneId)) {
      issue('PRESET_COLLAPSED_ZONE_INVALID', `Unknown collapsed zone "${String(zoneId)}"`);
    } else if (zoneId === 'center-stage' || zoneId === 'top-ribbon' || zoneId === 'left-rail') {
      issue('PRESET_ZONE_NOT_COLLAPSIBLE', `Zone "${zoneId}" may never be collapsed`);
    }
  }

  if (preset.zoneSizeDefaults !== undefined) {
    for (const [zoneId, size] of Object.entries(preset.zoneSizeDefaults)) {
      if (!zoneIdSet.has(zoneId)) {
        issue(
          'PRESET_ZONE_SIZE_DEFAULT_UNKNOWN_ZONE',
          `zoneSizeDefaults references unknown zone "${zoneId}"`,
        );
      }
      if (typeof size !== 'number' || !Number.isFinite(size) || size < 0) {
        issue(
          'PRESET_ZONE_SIZE_DEFAULT_INVALID',
          `zoneSizeDefaults["${zoneId}"] must be a non-negative finite number`,
        );
      }
    }
  }

  if (!['program', 'preview', 'balanced'].includes(preset.centerEmphasis)) {
    issue('PRESET_EMPHASIS_INVALID', `Unknown centerEmphasis: ${String(preset.centerEmphasis)}`);
  }
  return issues;
}

/** Validate the whole built-in preset catalog. */
export function validateWorkspacePresetCatalog(
  presets: Record<string, WorkspacePreset> = workspaceDefinitionLayouts,
): WorkspaceValidationIssue[] {
  const issues: WorkspaceValidationIssue[] = [];
  for (const requiredId of WORKSPACE_PRESET_IDS) {
    if (!(requiredId in presets)) {
      issues.push({
        code: 'PRESET_MISSING',
        message: `Missing preset "${requiredId}"`,
        subject: requiredId,
      });
    }
  }
  for (const [key, preset] of Object.entries(presets)) {
    if (key !== preset.id) {
      issues.push({
        code: 'PRESET_KEY_MISMATCH',
        message: `Catalog key "${key}" does not match preset id "${preset.id}"`,
        subject: key,
      });
    }
    issues.push(...validateWorkspacePreset(preset));
  }
  return issues;
}

export { MONITOR_PANELS as WORKSPACE_MONITOR_PANEL_IDS };
