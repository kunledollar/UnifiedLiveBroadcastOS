/** Operational Workspace contracts for the UBOS Live Experience OS. */
import { workspaceDefinitionLayouts } from './presets.js';
import type { WorkspaceDefinition, WorkspacePreset, WorkspacePresetId } from './types.js';

type Contract = Omit<
  WorkspaceDefinition,
  keyof typeof workspaceDefinitionLayouts.director | 'builtIn'
>;

const contracts: Record<WorkspacePresetId, Contract> = {
  director: {
    role: 'Production Director',
    responsibilities: ['Own program narrative', 'Approve next scene', 'Coordinate guests'],
    operationalPriorities: ['Program confidence', 'Preview readiness', 'Production warnings'],
    defaultPanels: ['program-monitor', 'preview-monitor', 'scenes', 'sources', 'inspector'],
    commands: ['take', 'auto', 'cut', 'cue-next'],
    permissions: ['switch-program', 'manage-scenes', 'view-guests'],
    responsiveRules: ['Preserve Program and Preview', 'Collapse secondary docks before monitors'],
    persistenceRules: ['Persist layout metadata only', 'Never persist runtime production state'],
    acceptanceRules: ['Program and Preview visible', 'Scene workflow reachable'],
    statusIndicators: [
      'Program',
      'Preview',
      'Next scene',
      'Guest readiness',
      'Output health',
      'Production warnings',
    ],
  },
  'technical-director': {
    role: 'Technical Director',
    responsibilities: ['Protect signal routing', 'Observe graph health', 'Resolve runtime faults'],
    operationalPriorities: ['Routing health', 'Signal integrity', 'Graph synchronization'],
    defaultPanels: ['routing-matrix', 'broadcast-io', 'pipeline-inspector', 'telemetry'],
    commands: ['route-signal', 'inspect-graph', 'acknowledge-warning'],
    permissions: ['manage-routing', 'view-pipeline', 'manage-outputs'],
    responsiveRules: ['Prioritize routing controls', 'Keep diagnostics accessible'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Routing tab active', 'Program and Preview visible'],
    statusIndicators: [
      'Routing health',
      'Runtime status',
      'Graph synchronization',
      'Signal integrity',
    ],
  },
  'audio-engineer': {
    role: 'Audio Engineer',
    responsibilities: ['Mix program audio', 'Protect buses', 'Monitor talent'],
    operationalPriorities: ['Clipping', 'Muted channels', 'Bus health'],
    defaultPanels: ['audio-mixer', 'master-bus'],
    commands: ['mute-channel', 'solo-channel', 'adjust-bus'],
    permissions: ['manage-audio'],
    responsiveRules: ['Give mixer vertical space', 'Keep confidence monitors visible'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Audio mixer active', 'No audio runtime persisted'],
    statusIndicators: ['Clipping', 'Muted channels', 'Bus health', 'Monitor state'],
  },
  'graphics-operator': {
    role: 'Graphics Operator',
    responsibilities: ['Cue graphics', 'Verify assets', 'Protect overlays'],
    operationalPriorities: ['Queued graphics', 'Missing assets', 'Overlay status'],
    defaultPanels: ['graphics-library', 'inspector'],
    commands: ['cue-graphic', 'take-graphic', 'inspect-asset'],
    permissions: ['manage-graphics'],
    responsiveRules: ['Keep graphics library reachable'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Graphics library active'],
    statusIndicators: ['Queued graphics', 'Missing assets', 'Overlay status'],
  },
  'replay-operator': {
    role: 'Replay Operator',
    responsibilities: ['Mark replay moments', 'Build clips', 'Protect storage'],
    operationalPriorities: ['Replay buffer', 'Marked clips', 'Storage'],
    defaultPanels: ['replay-timeline', 'clip-library'],
    commands: ['mark-clip', 'cue-replay', 'play-replay'],
    permissions: ['manage-replay'],
    responsiveRules: ['Prioritize timeline height'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Replay timeline active'],
    statusIndicators: ['Replay buffer', 'Marked clips', 'Storage'],
  },
  'streaming-operator': {
    role: 'Streaming Operator',
    responsibilities: ['Maintain destinations', 'Protect delivery', 'Respond to auth failures'],
    operationalPriorities: ['Connected destinations', 'Dropped frames', 'Authentication'],
    defaultPanels: ['streaming', 'outputs', 'telemetry', 'system-status'],
    commands: ['start-output', 'stop-output', 'reconnect-destination'],
    permissions: ['manage-outputs', 'view-telemetry'],
    responsiveRules: ['Prioritize output health'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Output controls reachable'],
    statusIndicators: ['Connected destinations', 'Dropped frames', 'Authentication', 'Bitrate'],
  },
  'solo-streamer': {
    role: 'Solo Streamer',
    responsibilities: ['Run an independent live show', 'Engage chat', 'Monitor delivery'],
    operationalPriorities: ['Live status', 'Unified chat', 'Guests'],
    defaultPanels: ['program-monitor', 'preview-monitor', 'chat', 'recording', 'streaming'],
    commands: ['take', 'toggle-recording', 'open-chat'],
    permissions: ['switch-program', 'manage-outputs', 'manage-chat'],
    responsiveRules: ['Favor Program', 'Collapse source dock first'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Program dominant', 'Chat reachable'],
    statusIndicators: ['Live status', 'Unified chat', 'Guests', 'Output state'],
  },
  'monitor-wall': {
    role: 'Confidence Monitor Operator',
    responsibilities: [
      'Observe production confidence',
      'Detect source failures',
      'Escalate incidents',
    ],
    operationalPriorities: ['Production health', 'Outputs', 'Source confidence'],
    defaultPanels: ['monitor-wall', 'program-monitor', 'preview-monitor'],
    commands: ['focus-monitor', 'acknowledge-warning'],
    permissions: ['view-monitoring'],
    responsiveRules: ['Collapse side docks', 'Prioritize monitor wall'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Monitor wall active'],
    statusIndicators: ['Production health', 'Recording', 'Outputs', 'Source confidence'],
  },
  compact: {
    role: 'Compact Production Operator',
    responsibilities: ['Maintain a minimal production view'],
    operationalPriorities: ['Program confidence', 'Critical warnings'],
    defaultPanels: ['program-monitor', 'preview-monitor'],
    commands: ['take', 'cut'],
    permissions: ['switch-program'],
    responsiveRules: ['Collapse all nonessential docks'],
    persistenceRules: ['Persist layout metadata only'],
    acceptanceRules: ['Minimal summary visible'],
    statusIndicators: ['Production summary'],
  },
};

export const workspaceDefinitions: Record<WorkspacePresetId, WorkspaceDefinition> =
  Object.fromEntries(
    Object.entries(workspaceDefinitionLayouts).map(([id, preset]) => [
      id,
      { ...preset, ...contracts[id as WorkspacePresetId], builtIn: true },
    ]),
  ) as Record<WorkspacePresetId, WorkspaceDefinition>;

export const workspaceDefinitionList = Object.values(workspaceDefinitions);
export const getWorkspaceDefinition = (id: WorkspacePresetId) => workspaceDefinitions[id];

/** Legacy layout API. Consumers receive a projection of the canonical catalog. */
export const workspacePresets: Record<WorkspacePresetId, WorkspacePreset> = Object.fromEntries(
  Object.entries(workspaceDefinitions).map(([id, definition]) => [
    id,
    {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      activeBottomTab: definition.activeBottomTab,
      visiblePanels: [...definition.visiblePanels],
      collapsedPanels: [...definition.collapsedPanels],
      hiddenPanels: [...definition.hiddenPanels],
      zoneOverrides: { ...definition.zoneOverrides },
      collapsedZones: [...definition.collapsedZones],
      centerEmphasis: definition.centerEmphasis,
      zoneSizeDefaults: definition.zoneSizeDefaults
        ? { ...definition.zoneSizeDefaults }
        : undefined,
    },
  ]),
) as Record<WorkspacePresetId, WorkspacePreset>;

export const workspacePresetList: readonly WorkspacePreset[] = Object.values(workspacePresets);
export const defaultWorkspacePresetId: WorkspacePresetId = 'director';
export const getWorkspacePreset = (id: WorkspacePresetId): WorkspacePreset => workspacePresets[id];
