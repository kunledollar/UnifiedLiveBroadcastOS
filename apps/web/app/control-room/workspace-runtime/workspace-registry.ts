import { createWorkspaceInspector, createWorkspacePanel, createWorkspaceWorkbench } from './generic-workspace-views.js';
import type { WorkspacePlugin } from './workspace-plugin.js';

type WorkspaceDefinition = readonly [
  id: string,
  title: string,
  icon: string,
  description: string,
  panelLabel: string,
  inspectorLabel: string,
  tabs: readonly string[],
  weights?: readonly [programWeight: number, previewWeight: number],
];

const define = ([id, title, icon, description, panelLabel, inspectorLabel, tabs, weights = [55, 45]]: WorkspaceDefinition): WorkspacePlugin => ({
  id,
  title,
  icon,
  description,
  route: `/control-room/${id}`,
  defaultLayout: { programWeight: weights[0], previewWeight: weights[1], inspectorWidth: 288, bottomHeight: 120 },
  component: createWorkspacePanel(panelLabel),
  inspector: createWorkspaceInspector(inspectorLabel),
  workbench: createWorkspaceWorkbench(tabs),
  permissions: ['production:read'],
  shortcuts: ['Ctrl+K'],
});

const workspaceDefinitions: readonly WorkspaceDefinition[] = [
  ['director', 'Director', '◆', 'Rundown, producer notes, cue stack, countdown, and AI suggestions', 'Rundown & Cue Stack', 'Show inspector', ['Timeline', 'Logs', 'Notes', 'AI'], [65, 35]],
  ['solo-streamer', 'Solo Streamer', '●', 'Focused controls for a single operator', 'Live control', 'Stream inspector', ['Chat', 'Notes', 'Alerts']],
  ['technical-director', 'Technical Director', '⇄', 'Signal-flow and production readiness tools', 'Routing & readiness', 'Signal inspector', ['Timeline', 'Logs', 'Metrics'], [50, 50]],
  ['audio-engineer', 'Audio Engineer', '♫', 'Mixer, meters, routing, FX, and monitor bus tools', 'Mixer & Meters', 'Monitor bus', ['Meters', 'Routing', 'Effects'], [50, 50]],
  ['graphics-operator', 'Graphics Operator', '✦', 'Graphics queue, templates, ticker, and animation tools', 'Graphics Queue', 'Graphic inspector', ['Templates', 'Animations', 'Ticker'], [45, 55]],
  ['replay-operator', 'Replay Operator', '↶', 'Replay timeline, highlights, and clip queue tools', 'Replay Timeline', 'Clip inspector', ['Markers', 'Timeline', 'Highlights'], [35, 65]],
  ['streaming-operator', 'Streaming Operator', '⇧', 'Destination health and stream operations', 'Output Health', 'Destination inspector', ['Outputs', 'Logs', 'Metrics'], [65, 35]],
  ['monitor-wall', 'Monitor Wall', '▦', 'Multiview monitoring and alerts', 'Monitor Grid', 'Signal inspector', ['Alerts', 'Metrics', 'Logs'], [50, 50]],
  ['compact', 'Compact', '▣', 'Essential production controls in a compact workspace', 'Compact controls', 'Selection inspector', ['Notes', 'Alerts'], [50, 50]],
  ['scenes', 'Scenes', '▤', 'Scene preparation and inspection', 'Scene Library', 'Scene inspector', ['Timeline', 'Events', 'Health'], [45, 55]],
  ['sources', 'Sources', '◫', 'Collections, source library, inspection, and health', 'Source Library', 'Source inspector', ['Events', 'Discovery', 'Health']],
  ['social-fabric', 'Social Fabric', '☍', 'Unified chat, moderation, analytics, and cross-platform activity', 'Unified Chat', 'Audience inspector', ['Moderation', 'CRM', 'Notifications']],
  ['guests', 'Guests', '☻', 'Guest coordination and confidence tools', 'Guest Management', 'Guest inspector', ['Roster', 'Chat', 'Notes']],
  ['automation', 'Automation', '⚙', 'Automation review and execution tools', 'Automation', 'Automation inspector', ['Runs', 'Logs', 'Queue']],
  ['scheduler', 'Scheduler', '◷', 'Schedule and upcoming production tools', 'Scheduler', 'Event inspector', ['Calendar', 'Notes', 'Alerts']],
  ['ai-producer', 'AI Producer', '✧', 'AI production guidance and review tools', 'AI Suggestions', 'Suggestion inspector', ['Suggestions', 'History', 'Notes']],
  ['emergency-control', 'Emergency Control', '!', 'Emergency response controls and alert review', 'Emergency Control', 'Incident inspector', ['Alerts', 'Runbook', 'Logs']],
];

export const workspaceRegistry: readonly WorkspacePlugin[] = Object.freeze(workspaceDefinitions.map(define));
export const workspacePluginById = Object.freeze(Object.fromEntries(workspaceRegistry.map((plugin) => [plugin.id, plugin])) as Record<string, WorkspacePlugin>);
export const getWorkspacePlugin = (id: string): WorkspacePlugin => workspacePluginById[id] ?? workspacePluginById.director!;
