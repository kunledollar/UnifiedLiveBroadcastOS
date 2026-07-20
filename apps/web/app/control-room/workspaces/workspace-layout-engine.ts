export type WorkspacePanelId = 'program' | 'preview' | 'scenes' | 'routing' | 'mixer' | 'graphics' | 'replay' | 'streaming' | 'chat' | 'multiview';

/** A serializable, display-aware layout contract for docked, floating, and remote workspaces. */
export interface WorkspacePanel { id: WorkspacePanelId; priority: number; minimumSize: number; preferredSize: number; maximumSize: number; collapsible: boolean; floating: boolean; display: 1 | 2 | 3; }
export type LayoutDisposition = 'docked' | 'pop-out' | 'fullscreen';
export interface WorkspaceLayout { panels: readonly WorkspacePanel[]; disposition: LayoutDisposition; }
const video=(id:'program'|'preview',priority:number,preferredSize:number):WorkspacePanel=>({id,priority,minimumSize:id==='program'?800:500,preferredSize,maximumSize:id==='program'?70:50,collapsible:false,floating:true,display:1});
const tool=(id:Exclude<WorkspacePanelId,'program'|'preview'>,priority:number,preferredSize:number,display:1|2|3=1):WorkspacePanel=>({id,priority,minimumSize:240,preferredSize,maximumSize:45,collapsible:true,floating:true,display});
const layouts:Record<string,WorkspaceLayout>={
 compact:{disposition:'docked',panels:[video('program',10,60),video('preview',8,40),tool('scenes',3,10)]}, director:{disposition:'docked',panels:[video('program',10,50),video('preview',8,40),tool('scenes',6,10),tool('routing',3,20,2)]},
 'technical-director':{disposition:'docked',panels:[video('program',10,45),video('preview',8,35),tool('routing',9,20),tool('multiview',7,30,2)]}, 'audio-engineer':{disposition:'docked',panels:[video('program',10,30),video('preview',8,25),tool('mixer',9,45),tool('routing',6,20,3)]},
 'graphics-operator':{disposition:'docked',panels:[video('program',10,35),video('preview',8,30),tool('graphics',9,35)]}, 'replay-operator':{disposition:'docked',panels:[video('program',10,35),video('preview',8,25),tool('replay',9,40)]},
 'streaming-operator':{disposition:'docked',panels:[video('program',10,35),video('preview',8,25),tool('streaming',9,40)]}, 'solo-streamer':{disposition:'docked',panels:[video('program',10,55),video('preview',8,30),tool('chat',9,35)]},
 'monitor-wall':{disposition:'docked',panels:[video('program',10,25),video('preview',8,25),tool('multiview',10,50)]}, scenes:{disposition:'docked',panels:[video('program',10,45),video('preview',8,55),tool('scenes',9,40)]},
 sources:{disposition:'docked',panels:[video('program',10,55),video('preview',8,45),tool('routing',7,30)]}, 'social-fabric':{disposition:'docked',panels:[video('program',10,60),video('preview',8,40),tool('chat',8,35)]},
};
export function getWorkspaceLayout(id:string):WorkspaceLayout{return layouts[id]??layouts.director!;}
export function orderedPanels(id:string,display:1|2|3=1){return getWorkspaceLayout(id).panels.filter(panel=>panel.display===display).slice().sort((a,b)=>b.priority-a.priority);}
