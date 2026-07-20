import type { ComponentType, ReactNode } from 'react';

export type WorkspaceDock = 'left' | 'right' | 'bottom' | 'center';
export type WorkspaceLayout = Readonly<{ programWeight:number; previewWeight:number; inspectorWidth:number; bottomHeight:number }>;
export interface WorkspacePlugin {
  id: string;
  title: string;
  icon: string;
  description: string;
  route: string;
  defaultLayout: WorkspaceLayout;
  component: ComponentType<WorkspacePluginViewProps>;
  inspector: ComponentType<WorkspacePluginViewProps>;
  workbench: ComponentType<WorkspacePluginViewProps>;
  permissions: readonly string[];
  shortcuts: readonly string[];
}
export type WorkspacePluginViewProps = Readonly<{ plugin: WorkspacePlugin; children?: ReactNode }>;
