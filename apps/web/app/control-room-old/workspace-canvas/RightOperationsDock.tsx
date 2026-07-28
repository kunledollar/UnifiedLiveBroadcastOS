'use client';

import type { ReactNode } from 'react';
import type { OperationsTabId } from '../shell/types';
import { DockablePanel } from './DockablePanel';

const tabLabels: Partial<Record<OperationsTabId, string>> = {
  guests: 'Guests',
  team: 'Team',
  automation: 'Automation',
  devices: 'Devices',
  engine: 'Engine',
  compositor: 'Compositor',
  runtime: 'Runtime',
  recording: 'Recording',
  streaming: 'Streaming',
  security: 'Security',
  monitoring: 'Monitor Wall',
  cluster: 'Cluster',
  plugins: 'Plugins',
  cloud: 'Cloud',
  analytics: 'Analytics',
  'enterprise-admin': 'Admin',
  inspector: 'Inspector',
  routing: 'Broadcast I/O',
  outputs: 'Outputs',
  health: 'Health',
  preview: 'Preview',
  logs: 'Logs',
  'ai-director': 'AI Director',
  ai: 'AI',
};

export function RightOperationsDock({
  tabs,
  activeTab,
  onTabChange,
  collapsed,
  undocked,
  onToggleCollapse,
  onToggleUndock,
  previewSlot,
}: {
  tabs: Array<{ id: OperationsTabId; content: ReactNode }>;
  activeTab: OperationsTabId;
  onTabChange: (id: OperationsTabId) => void;
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
  previewSlot?: ReactNode;
}) {
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <DockablePanel
      title="Operations"
      subtitle={tabLabels[activeTab] ?? activeTab}
      collapsed={collapsed}
      undocked={undocked ?? false}
      onToggleCollapse={onToggleCollapse}
      onToggleUndock={onToggleUndock}
      className="h-full"
      compactHeader
    >
      <nav
        className="grid shrink-0 grid-cols-4 gap-0.5 border-b border-white/6 p-1.5"
        role="tablist"
        aria-label="Operations sections"
      >
        {tabs.map((tab) => {
          const selected = active?.id === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              title={tabLabels[tab.id] ?? tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`rounded px-1 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                selected
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              {(tabLabels[tab.id] ?? tab.id).slice(0, 8)}
            </button>
          );
        })}
      </nav>
      <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto p-2" role="tabpanel">
        {active?.content}
      </div>
      {previewSlot && activeTab !== 'preview' ? (
        <div className="mx-2 mb-2 h-28 shrink-0 overflow-hidden rounded border border-white/8">
          {previewSlot}
        </div>
      ) : null}
    </DockablePanel>
  );
}
