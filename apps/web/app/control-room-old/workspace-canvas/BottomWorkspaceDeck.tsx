'use client';

import type { ReactNode } from 'react';
import type { DockTabId } from '../shell/types';
import { broadcastWorkspaceTabs, workspaceTabLabel } from '../broadcast-workspaces';
import { DockablePanel } from './DockablePanel';

const legacyDockTabLabels: Partial<Record<DockTabId, string>> = {
  media: 'Media',
  collaboration: 'Team',
};

const dockTabs: DockTabId[] = [
  ...broadcastWorkspaceTabs.map((tab) => tab.id),
  'media',
  'collaboration',
];

export function BottomWorkspaceDeck({
  activeTab,
  onTabChange,
  children,
  collapsed,
  undocked,
  onToggleCollapse,
  onToggleUndock,
  title = 'Production Deck',
}: {
  activeTab: DockTabId;
  onTabChange: (id: DockTabId) => void;
  children: ReactNode;
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
  title?: string;
}) {
  const activeLabel = legacyDockTabLabels[activeTab] ?? workspaceTabLabel(activeTab);

  return (
    <DockablePanel
      title={title}
      subtitle={activeLabel}
      collapsed={collapsed}
      undocked={undocked ?? false}
      onToggleCollapse={onToggleCollapse}
      onToggleUndock={onToggleUndock}
      compactHeader
    >
      <div className="flex min-h-0 flex-col">
        <nav
          className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-white/6 px-2 py-1"
          role="tablist"
          aria-label="Production deck tabs"
        >
          {dockTabs.map((tab) => {
            const selected = activeTab === tab;
            const label = legacyDockTabLabels[tab] ?? workspaceTabLabel(tab);
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(tab)}
                className={`shrink-0 rounded px-2 py-1 text-xs font-bold uppercase tracking-wide transition-colors ${
                  selected
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
        {!collapsed ? (
          <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
        ) : null}
      </div>
    </DockablePanel>
  );
}
