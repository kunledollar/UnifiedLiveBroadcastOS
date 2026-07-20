import type { ComponentType, ReactNode } from 'react';

export type WorkspaceDockLayout = {
  leftDock: boolean;
  rightDock: boolean;
  bottomWorkbench: boolean;
  inspectorWidth: number;
};

export interface WorkspacePlugin {
  id: string;
  title: string;
  icon: string;
  description: string;
  route: string;
  defaultLayout: WorkspaceDockLayout;
  component: ComponentType<{ children?: ReactNode }>;
  inspector: ComponentType;
  workbench: ComponentType;
  permissions: readonly string[];
  shortcuts: readonly string[];
}

const Empty = ({ children }: { children?: ReactNode }) => <>{children}</>;
const Panel = ({ title, detail }: { title: string; detail: string }) => (
  <section className="ubos-plugin-panel"><h2>{title}</h2><p>{detail}</p></section>
);
const Inspector = ({ title }: { title: string }) => () => <Panel title="Inspector" detail={`${title} selection, health, and metadata.`} />;
const Workbench = ({ title }: { title: string }) => () => <Panel title="Workbench" detail={title} />;

const definitions = [
  ['director', 'Director', '◆', 'Rundown · Producer Notes · Cue Stack · Countdown · AI Suggestions', 'Timeline · Logs · Notes'],
  ['solo-streamer', 'Solo Streamer', '●', 'Guided live controls and audience readiness.', 'Chat · Alerts · Notes'],
  ['technical-director', 'Technical Director', '⇄', 'Routing · signals · engineering readiness.', 'Routing · Logs · Metrics'],
  ['audio-engineer', 'Audio Engineer', '♫', 'Mixer · Meters · Routing · FX · Monitor Bus', 'Meters · Routing · Effects'],
  ['graphics-operator', 'Graphics Operator', '✦', 'Graphics Queue · Templates · Ticker · Animation', 'Templates · Animations'],
  ['replay-operator', 'Replay Operator', '↶', 'Timeline · Highlights · Clip Queue', 'Markers · Timeline · Highlights'],
  ['streaming-operator', 'Streaming Operator', '⇧', 'Destination health · stream profiles · network.', 'Outputs · Network · Logs'],
  ['monitor-wall', 'Monitor Wall', '▦', 'Production confidence and destination monitoring.', 'Alerts · Metrics · Logs'],
  ['compact', 'Compact', '▣', 'Essential production decisions in a compact workspace.', 'Cues · Notes'],
  ['scenes', 'Scenes', '▤', 'Scene preparation and readiness.', 'Scenes · Events · Health'],
  ['sources', 'Sources', '◫', 'Collections · Source Library · Inspector · Health', 'Events · Discovery · Health'],
  ['social-fabric', 'Social Fabric', '☍', 'Unified Chat · Moderation · Analytics · Cross Follow', 'Moderation · CRM · Notifications'],
  ['guests', 'Guests', '◌', 'Guest readiness and communications.', 'Guest notes · Chat'],
  ['automation', 'Automation', '⌁', 'Cues, macros, and show automation.', 'Queue · Automation · Logs'],
  ['scheduler', 'Scheduler', '◷', 'Schedules and upcoming productions.', 'Calendar · Notes'],
  ['ai-producer', 'AI Producer', '✧', 'Production recommendations and risk review.', 'Suggestions · Alerts'],
  ['emergency-control', 'Emergency Control', '!', 'Protected emergency production controls.', 'Incident log · Alerts'],
] as const;

export const workspaceRegistry: readonly WorkspacePlugin[] = Object.freeze(definitions.map(([id, title, icon, description, workbench]) => ({
  id, title, icon, description, route: `/control-room/${id}`,
  defaultLayout: { leftDock: true, rightDock: true, bottomWorkbench: true, inspectorWidth: 288 },
  component: Empty, inspector: Inspector({ title }), workbench: Workbench({ title: workbench }),
  permissions: ['production:read'], shortcuts: ['Ctrl+K'],
})));

export const workspacePluginById = Object.freeze(Object.fromEntries(workspaceRegistry.map((plugin) => [plugin.id, plugin])) as Record<string, WorkspacePlugin>);
export const getWorkspacePlugin = (id: string): WorkspacePlugin => workspacePluginById[id] ?? workspacePluginById.director!;
