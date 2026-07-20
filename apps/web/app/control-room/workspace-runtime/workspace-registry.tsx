import type { WorkspacePlugin, WorkspacePluginViewProps } from './workspace-plugin';

const panel = (label:string) => function WorkspacePanel({plugin,children}:WorkspacePluginViewProps) { return <section className="ubos-plugin-panel"><p>ACTIVE WORKSPACE · {plugin.title.toUpperCase()}</p><h1>{label}</h1>{children ?? <p>{plugin.description}. This operational surface is isolated from Program and Preview ownership.</p>}</section>; };
const inspector = (label:string) => function WorkspaceInspector({plugin}:WorkspacePluginViewProps) { return <section><p className="ubos-dock-eyebrow">INSPECTOR</p><b>{label}</b><p>{plugin.permissions.join(' · ')}</p></section>; };
const workbench = (tabs:readonly string[]) => function WorkspaceWorkbench({plugin}:WorkspacePluginViewProps) { return <section><p className="ubos-dock-eyebrow">{plugin.title.toUpperCase()} WORKBENCH</p><div className="ubos-workbench-tabs">{tabs.map(tab=><button key={tab} type="button">{tab}</button>)}</div></section>; };
const define = (id:string,title:string,icon:string,description:string,center:string,inspect:string,tabs:readonly string[],weights:[number,number]=[55,45]):WorkspacePlugin => ({id,title,icon,description,route:`/control-room/${id}`,defaultLayout:{programWeight:weights[0],previewWeight:weights[1],inspectorWidth:288,bottomHeight:120},component:panel(center),inspector:inspector(inspect),workbench:workbench(tabs),permissions:['production:read'],shortcuts:['Ctrl+K']});

export const workspaceRegistry: readonly WorkspacePlugin[] = Object.freeze([
 define('director','Director','◆','Rundown, producer notes, cue stack, countdown, and AI suggestions','Rundown & Cue Stack','Show inspector',['Timeline','Logs','Notes','AI'],[65,35]),
 define('solo-streamer','Solo Streamer','●','Focused controls for a single operator','Live control','Stream inspector',['Chat','Notes','Alerts']),
 define('technical-director','Technical Director','⇄','Signal-flow and production readiness tools','Routing & readiness','Signal inspector',['Timeline','Logs','Metrics'],[50,50]),
 define('audio-engineer','Audio Engineer','♫','Mixer, meters, routing, FX, and monitor bus tools','Mixer & Meters','Monitor bus',['Meters','Routing','Effects'],[50,50]),
 define('graphics-operator','Graphics Operator','✦','Graphics queue, templates, ticker, and animation tools','Graphics Queue','Graphic inspector',['Templates','Animations','Ticker'],[45,55]),
 define('replay-operator','Replay Operator','↶','Replay timeline, highlights, and clip queue tools','Replay Timeline','Clip inspector',['Markers','Timeline','Highlights'],[35,65]),
 define('streaming-operator','Streaming Operator','⇧','Destination health and stream operations','Output Health','Destination inspector',['Outputs','Logs','Metrics'],[65,35]),
 define('monitor-wall','Monitor Wall','▦','Multiview monitoring and alerts','Monitor Grid','Signal inspector',['Alerts','Metrics','Logs'],[50,50]),
 define('compact','Compact','▣','Essential production controls in a compact workspace','Compact controls','Selection inspector',['Notes','Alerts'],[50,50]),
 define('scenes','Scenes','▤','Scene preparation and inspection','Scene Library','Scene inspector',['Timeline','Events','Health'],[45,55]),
 define('sources','Sources','◫','Collections, source library, inspection, and health','Source Library','Source inspector',['Events','Discovery','Health']),
 define('social-fabric','Social Fabric','☍','Unified chat, moderation, analytics, and cross-platform activity','Unified Chat','Audience inspector',['Moderation','CRM','Notifications']),
 define('guests','Guests','☻','Guest coordination and confidence tools','Guest Management','Guest inspector',['Roster','Chat','Notes']),
 define('automation','Automation','⚙','Automation review and execution tools','Automation','Automation inspector',['Runs','Logs','Queue']),
 define('scheduler','Scheduler','◷','Schedule and upcoming production tools','Scheduler','Event inspector',['Calendar','Notes','Alerts']),
 define('ai-producer','AI Producer','✧','AI production guidance and review tools','AI Suggestions','Suggestion inspector',['Suggestions','History','Notes']),
 define('emergency-control','Emergency Control','!','Emergency response controls and alert review','Emergency Control','Incident inspector',['Alerts','Runbook','Logs']),
]);
export const workspacePluginById = Object.freeze(Object.fromEntries(workspaceRegistry.map(plugin=>[plugin.id,plugin])) as Record<string,WorkspacePlugin>);
export const getWorkspacePlugin = (id:string):WorkspacePlugin => workspacePluginById[id] ?? workspacePluginById.director!;
