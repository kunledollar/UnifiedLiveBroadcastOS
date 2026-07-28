'use client';
import type { ReactNode } from 'react';
import { getWorkspacePlugin } from './WorkspaceRegistry';

/** Replaces only the operational module; ProductionRuntimeHost remains its sibling. */
export function WorkspaceHost({ workspaceId, children }: { workspaceId: string; children: ReactNode }) {
  const plugin = getWorkspacePlugin(workspaceId); const Component = plugin.component;
  return <main className="ubos-workspace-content" data-workspace-host={plugin.id}><Component>{children}</Component></main>;
}
