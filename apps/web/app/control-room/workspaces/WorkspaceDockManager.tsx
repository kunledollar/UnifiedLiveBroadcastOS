'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { getWorkspacePlugin } from './WorkspaceRegistry';

const key = (workspaceId: string) => `ubos.workspace-dock.v5.15.3.${workspaceId}`;
export function WorkspaceDockManager({ workspaceId, children }: { workspaceId: string; children: ReactNode }) {
  const plugin = getWorkspacePlugin(workspaceId); const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem(key(workspaceId)) === 'collapsed'); }, [workspaceId]);
  const toggle = () => { const next = !collapsed; setCollapsed(next); localStorage.setItem(key(workspaceId), next ? 'collapsed' : 'open'); };
  const Inspector = plugin.inspector; const Workbench = plugin.workbench;
  return <><aside className={`ubos-workspace-inspector ${collapsed ? 'is-collapsed' : ''}`} aria-label="Workspace inspector"><button type="button" onClick={toggle}>{collapsed ? 'Show inspector' : 'Hide inspector'}</button>{!collapsed && <Inspector />}</aside>{children}<footer className="ubos-bottom-workbench" data-workbench={plugin.id}><Workbench /></footer></>;
}
