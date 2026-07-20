export const workspaceIds = ['director','solo-streamer','technical-director','audio-engineer','graphics-operator','replay-operator','streaming-operator','monitor-wall','compact','scenes','sources','social-fabric'] as const;
export type WorkspaceId = typeof workspaceIds[number];
export interface WorkspaceMonitorGeometry { workspaceId: WorkspaceId; mode:'program-dominant'|'preview-dominant'|'balanced'|'confidence'|'multiview'; orientation:'vertical-stack'|'horizontal-split'|'grid'; programWeight:number; previewWeight:number; centerStageWeight:number; leftDockWeight:number; rightDockWeight:number; bottomDockWeight:number; programAspectRatio:'16 / 9'; previewAspectRatio:'16 / 9'; minProgramWidth:number; minPreviewWidth:number; responsivePriority:'protect-program'|'protect-preview'|'protect-both'|'protect-multiview'; }
type WorkspaceDefinition = { id:WorkspaceId; name:string; icon:string; mission:string; geometry:WorkspaceMonitorGeometry };
const geometry=(workspaceId:WorkspaceId, mode:WorkspaceMonitorGeometry['mode'], orientation:WorkspaceMonitorGeometry['orientation'], programWeight:number, previewWeight:number, responsivePriority:WorkspaceMonitorGeometry['responsivePriority'], centerStageWeight=56):WorkspaceMonitorGeometry=>({workspaceId,mode,orientation,programWeight,previewWeight,centerStageWeight,leftDockWeight:22,rightDockWeight:22,bottomDockWeight:22,programAspectRatio:'16 / 9',previewAspectRatio:'16 / 9',minProgramWidth:280,minPreviewWidth:240,responsivePriority});
export const workspaceCatalog:readonly WorkspaceDefinition[] = [
 ['director','Director','◆','Call the show with rundown and next-action support',geometry('director','program-dominant','vertical-stack',60,40,'protect-program')],
 ['solo-streamer','Solo Streamer','●','Keep the live confidence surface foremost',geometry('solo-streamer','program-dominant','vertical-stack',70,30,'protect-program',68)],
 ['technical-director','Technical Director','⇄','Operate equal program and preview confidence',geometry('technical-director','balanced','horizontal-split',50,50,'protect-both')],
 ['audio-engineer','Audio Engineer','♫','Mix program audio with confidence monitors',geometry('audio-engineer','confidence','horizontal-split',55,45,'protect-program',38)],
 ['graphics-operator','Graphics Operator','✦','Prepare graphics against the next scene',geometry('graphics-operator','preview-dominant','vertical-stack',40,60,'protect-preview')],
 ['replay-operator','Replay Operator','↶','Prepare replay clips and timeline',geometry('replay-operator','preview-dominant','horizontal-split',35,65,'protect-preview')],
 ['streaming-operator','Streaming Operator','⇧','Protect program and destination health',geometry('streaming-operator','program-dominant','vertical-stack',65,35,'protect-program')],
 ['monitor-wall','Monitor Wall','▦','Observe program, preview, and destinations',geometry('monitor-wall','multiview','grid',50,50,'protect-multiview',72)],
 ['compact','Compact','▣','Operate both monitors in minimum space',geometry('compact','balanced','horizontal-split',50,50,'protect-both',72)],
 ['scenes','Scenes','▤','Prepare the next scene before taking it live',geometry('scenes','preview-dominant','vertical-stack',45,55,'protect-preview')],
 ['sources','Sources','◫','Inspect authoritative production inputs',geometry('sources','confidence','horizontal-split',55,45,'protect-program',34)],
 ['social-fabric','Social Fabric','☍','Operate audience and platform health',geometry('social-fabric','confidence','horizontal-split',60,40,'protect-program',34)],
].map(([id,name,icon,mission,geometry])=>({id:id as WorkspaceId,name:name as string,icon:icon as string,mission:mission as string,geometry:geometry as WorkspaceMonitorGeometry}));
export const workspaceById = Object.fromEntries(workspaceCatalog.map(item=>[item.id,item])) as Record<WorkspaceId,WorkspaceDefinition>;
export const isWorkspaceId=(value:string):value is WorkspaceId => workspaceIds.includes(value as WorkspaceId);
