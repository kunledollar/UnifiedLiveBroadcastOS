'use client';

import type { ReactNode } from 'react';
import type { DockTabId } from '../shell/types';
import { DockablePanel } from './DockablePanel';

const dockTabLabels: Record<DockTabId, string> = {
  audio: 'Audio',
  layers: 'Layers',
  graphics: 'Graphics',
  media: 'Media',
  replay: 'Replay',
  collaboration: 'Team',
  automation: 'ROS',
  logs: 'Inspector',
};

const dockTabs: DockTabId[] = [
  'audio',
  'layers',
  'graphics',
  'media',
  'replay',
  'collaboration',
  'automation',
  'logs',
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
  return (
    <DockablePanel
      title={title}
      subtitle={dockTabLabels[activeTab]}
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
                {dockTabLabels[tab]}
              </button>
            );
          })}
        </nav>
        <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </DockablePanel>
  );
}
