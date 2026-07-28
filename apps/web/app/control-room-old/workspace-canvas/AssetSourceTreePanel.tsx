'use client';

import type { ReactNode } from 'react';
import { DockablePanel } from './DockablePanel';

export function AssetSourceTreePanel({
  children,
  collapsed,
  undocked = false,
  onToggleCollapse,
  onToggleUndock,
  title = 'Assets & Sources',
}: {
  children: ReactNode;
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
  title?: string;
}) {
  return (
    <DockablePanel
      title={title}
      collapsed={collapsed}
      undocked={undocked ?? false}
      onToggleCollapse={onToggleCollapse}
      onToggleUndock={onToggleUndock}
      className="h-full"
      compactHeader
    >
      <div className="p-2">{children}</div>
    </DockablePanel>
  );
}
