import type { WorkspaceLayout } from './workspace-plugin';
const prefix='ubos.v5.15.3.workspace-layout';
export type WorkspaceLayoutMetadata = WorkspaceLayout & { inspectorCollapsed:boolean; selectedTab:string };
export const defaultLayoutMetadata=(layout:WorkspaceLayout):WorkspaceLayoutMetadata=>({...layout,inspectorCollapsed:false,selectedTab:'overview'});
export const loadWorkspaceLayout=(operatorId:string,workspaceId:string,layout:WorkspaceLayout):WorkspaceLayoutMetadata=>{if(typeof window==='undefined')return defaultLayoutMetadata(layout);try{const value=window.localStorage.getItem(`${prefix}.${operatorId}.${workspaceId}`);return value?{...defaultLayoutMetadata(layout),...JSON.parse(value)}:defaultLayoutMetadata(layout)}catch{return defaultLayoutMetadata(layout)}};
export const saveWorkspaceLayout=(operatorId:string,workspaceId:string,metadata:WorkspaceLayoutMetadata)=>{if(typeof window!=='undefined')window.localStorage.setItem(`${prefix}.${operatorId}.${workspaceId}`,JSON.stringify(metadata));};
