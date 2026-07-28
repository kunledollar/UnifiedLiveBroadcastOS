/**
 * UBOS Next-Gen Chrome — Workspace Chrome Definitions
 *
 * Defines the visual chrome metadata for all 16 workspaces: taglines, sidebar
 * tool groups, and quick actions. These are UI presentation details only and
 * never affect runtime or panel content.
 */
import type { WorkspacePresetId } from '@ubos/shared';
import type { NavItemId, SourceDockTabId, DockTabId, OperationsTabId } from '../shell/types';

export type ChromeToolAction = {
  nav?: NavItemId;
  sourceTab?: SourceDockTabId;
  bottomTab?: DockTabId;
  operationsTab?: OperationsTabId;
};

export type ChromeTool = {
  id: string;
  label: string;
  action: ChromeToolAction;
  shortcut?: string;
};

export type ChromeToolGroup = {
  label: string;
  tools: ChromeTool[];
};

export type WorkspaceChromeDef = {
  id: WorkspacePresetId;
  tagline: string;
  toolGroups: ChromeToolGroup[];
};

const TOOL_GROUPS: {
  sceneTools: ChromeToolGroup;
  productionTools: ChromeToolGroup;
  audioTools: ChromeToolGroup;
  graphicsTools: ChromeToolGroup;
  mediaTools: ChromeToolGroup;
  replayTools: ChromeToolGroup;
  distributionTools: ChromeToolGroup;
  automationTools: ChromeToolGroup;
  analyticsTools: ChromeToolGroup;
  tdTools: ChromeToolGroup;
  monitorTools: ChromeToolGroup;
  streamerTools: ChromeToolGroup;
  socialTools: ChromeToolGroup;
} = {
  sceneTools: {
    label: 'Scene Tools',
    tools: [
      { id: 'scenes', label: 'Scenes', action: { sourceTab: 'scenes' } },
      { id: 'sources', label: 'Sources', action: { sourceTab: 'sources' } },
      { id: 'graphics', label: 'Graphics', action: { sourceTab: 'graphics' } },
      { id: 'media', label: 'Media', action: { sourceTab: 'media' } },
    ],
  },
  productionTools: {
    label: 'Production',
    tools: [
      { id: 'guests', label: 'Guests', action: { operationsTab: 'guests' } },
      { id: 'outputs', label: 'Outputs', action: { operationsTab: 'outputs' } },
      { id: 'recording', label: 'Recording', action: { operationsTab: 'recording' } },
      { id: 'streaming', label: 'Streaming', action: { operationsTab: 'streaming' } },
    ],
  },
  audioTools: {
    label: 'Audio Tools',
    tools: [
      { id: 'audio-mixer', label: 'Audio Mixer', action: { bottomTab: 'audio' } },
      { id: 'routing', label: 'Routing', action: { operationsTab: 'routing' } },
      { id: 'layers', label: 'Layers', action: { bottomTab: 'layers' } },
    ],
  },
  graphicsTools: {
    label: 'Graphics Tools',
    tools: [
      { id: 'graphics-lib', label: 'Graphics Library', action: { sourceTab: 'graphics' } },
      { id: 'inspector', label: 'Inspector', action: { operationsTab: 'inspector' } },
      { id: 'layers', label: 'Layer Stack', action: { bottomTab: 'layers' } },
      { id: 'graphics-dock', label: 'Graphics Dock', action: { bottomTab: 'graphics' } },
    ],
  },
  mediaTools: {
    label: 'Media Tools',
    tools: [
      { id: 'media-browser', label: 'Media Browser', action: { sourceTab: 'media' } },
      { id: 'inspector', label: 'Inspector', action: { operationsTab: 'inspector' } },
      { id: 'media-dock', label: 'Media', action: { bottomTab: 'media' } },
    ],
  },
  replayTools: {
    label: 'Replay Tools',
    tools: [
      { id: 'replay-timeline', label: 'Replay Timeline', action: { bottomTab: 'replay' } },
      { id: 'sources', label: 'Camera Sources', action: { sourceTab: 'sources' } },
      { id: 'inspector', label: 'Inspector', action: { operationsTab: 'inspector' } },
    ],
  },
  distributionTools: {
    label: 'Distribution Tools',
    tools: [
      { id: 'streaming', label: 'Destinations', action: { operationsTab: 'streaming' } },
      { id: 'outputs', label: 'Output Health', action: { operationsTab: 'outputs' } },
      { id: 'health', label: 'Health Monitor', action: { operationsTab: 'health' } },
      { id: 'system-status', label: 'System Status', action: { bottomTab: 'system-status' } },
    ],
  },
  automationTools: {
    label: 'Automation Tools',
    tools: [
      { id: 'automation-dock', label: 'Automation', action: { bottomTab: 'automation' } },
      { id: 'scenes', label: 'Scene Control', action: { sourceTab: 'scenes' } },
      { id: 'inspector', label: 'Inspector', action: { operationsTab: 'inspector' } },
    ],
  },
  analyticsTools: {
    label: 'Analytics Tools',
    tools: [
      { id: 'system-status', label: 'System Status', action: { bottomTab: 'system-status' } },
      { id: 'health', label: 'Health Monitor', action: { operationsTab: 'health' } },
      { id: 'logs', label: 'Logs', action: { bottomTab: 'logs' } },
    ],
  },
  tdTools: {
    label: 'Technical Tools',
    tools: [
      { id: 'routing', label: 'Routing Matrix', action: { operationsTab: 'routing' } },
      { id: 'production-graph', label: 'Signal Flow', action: { bottomTab: 'production-graph' } },
      { id: 'health', label: 'System Health', action: { operationsTab: 'health' } },
      { id: 'system-status', label: 'System Status', action: { bottomTab: 'system-status' } },
      { id: 'logs', label: 'Logs', action: { bottomTab: 'logs' } },
    ],
  },
  monitorTools: {
    label: 'Monitoring Tools',
    tools: [
      { id: 'health', label: 'Stream Health', action: { operationsTab: 'health' } },
      { id: 'outputs', label: 'Output Monitor', action: { operationsTab: 'outputs' } },
      { id: 'logs', label: 'Event Log', action: { bottomTab: 'logs' } },
    ],
  },
  streamerTools: {
    label: 'Stream Tools',
    tools: [
      { id: 'sources', label: 'Sources', action: { sourceTab: 'sources' } },
      { id: 'scenes', label: 'Scenes', action: { sourceTab: 'scenes' } },
      { id: 'streaming', label: 'Stream Controls', action: { operationsTab: 'streaming' } },
      { id: 'recording', label: 'Recording', action: { operationsTab: 'recording' } },
    ],
  },
  socialTools: {
    label: 'Community Tools',
    tools: [
      { id: 'guests', label: 'Guests', action: { operationsTab: 'guests' } },
      { id: 'inspector', label: 'Inspector', action: { operationsTab: 'inspector' } },
    ],
  },
};

const G = TOOL_GROUPS;

export const workspaceChromeDefs: Record<WorkspacePresetId, WorkspaceChromeDef> = {
  director: {
    id: 'director',
    tagline: 'The mission control for every live production.',
    toolGroups: [G.sceneTools, G.productionTools],
  },
  production: {
    id: 'production',
    tagline: 'Build, switch, and orchestrate the live show.',
    toolGroups: [G.sceneTools, G.productionTools],
  },
  'social-fabric': {
    id: 'social-fabric',
    tagline: 'Engage, moderate, and amplify your community.',
    toolGroups: [G.socialTools, G.productionTools],
  },
  'graphics-operator': {
    id: 'graphics-operator',
    tagline: 'Create, manage, and automate on-screen visuals.',
    toolGroups: [G.graphicsTools, G.sceneTools],
  },
  'media-operator': {
    id: 'media-operator',
    tagline: 'Ingest, organize, and manage all media assets.',
    toolGroups: [G.mediaTools, G.productionTools],
  },
  'replay-operator': {
    id: 'replay-operator',
    tagline: 'Instant replay, highlights, and brand moments.',
    toolGroups: [G.replayTools, G.sceneTools],
  },
  'distribution-operator': {
    id: 'distribution-operator',
    tagline: 'Distribute everywhere. Monitor everywhere.',
    toolGroups: [G.distributionTools],
  },
  'automation-operator': {
    id: 'automation-operator',
    tagline: 'Orchestrate, automate, and execute production workflows.',
    toolGroups: [G.automationTools, G.sceneTools],
  },
  analytics: {
    id: 'analytics',
    tagline: 'Measure performance. Drive growth.',
    toolGroups: [G.analyticsTools],
  },
  'technical-director': {
    id: 'technical-director',
    tagline: 'Control. Coordinate. Guarantee.',
    toolGroups: [G.tdTools, G.audioTools],
  },
  'audio-engineer': {
    id: 'audio-engineer',
    tagline: 'Mix. Monitor. Perfect.',
    toolGroups: [G.audioTools, G.sceneTools],
  },
  'monitor-wall': {
    id: 'monitor-wall',
    tagline: 'Real-time overview. Every stream. Every moment.',
    toolGroups: [G.monitorTools, G.distributionTools],
  },
  compact: {
    id: 'compact',
    tagline: 'Maximum output. Minimum footprint.',
    toolGroups: [G.sceneTools, G.productionTools],
  },
  'solo-streamer': {
    id: 'solo-streamer',
    tagline: 'Focus. Create. Connect.',
    toolGroups: [G.streamerTools, G.socialTools],
  },
  streamer: {
    id: 'streamer',
    tagline: 'Focus. Engage. Stream.',
    toolGroups: [G.streamerTools, G.socialTools],
  },
  'streaming-operator': {
    id: 'streaming-operator',
    tagline: 'Monitor. Engage. Optimize. Deliver.',
    toolGroups: [G.distributionTools, G.monitorTools],
  },
};

/** Primary nav workspaces shown at the top of the sidebar (core production roles). */
export const PRIMARY_WORKSPACE_IDS: WorkspacePresetId[] = [
  'director',
  'production',
  'social-fabric',
  'graphics-operator',
  'media-operator',
  'replay-operator',
  'distribution-operator',
  'automation-operator',
  'analytics',
];

/** Specialist workspaces shown in a second group below the primary list. */
export const SPECIALIST_WORKSPACE_IDS: WorkspacePresetId[] = [
  'technical-director',
  'audio-engineer',
  'monitor-wall',
  'streaming-operator',
  'solo-streamer',
  'streamer',
  'compact',
];
