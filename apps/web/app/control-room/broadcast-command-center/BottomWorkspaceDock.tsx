'use client';

import type { ReactNode } from 'react';
import type { DockTabId } from '../shell/types';
import { cn } from '@ubos/ui';
import { BroadcastPanelShell } from './BroadcastPanelShell';

const workspaceTabs: Array<{ id: DockTabId; label: string }> = [
  { id: 'layers', label: 'Scenes' },
  { id: 'audio', label: 'Audio Mixer' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'media', label: 'Media' },
  { id: 'replay', label: 'Replay' },
  { id: 'collaboration', label: 'Team' },
  { id: 'automation', label: 'Automation' },
  { id: 'logs', label: 'Inspector' },
];

export function BottomWorkspaceDock({
  activeTab,
  onTabChange,
  children,
  className,
}: {
  activeTab: DockTabId;
  onTabChange: (id: DockTabId) => void;
  children: ReactNode;
  className?: string;
}) {
  const activeLabel = workspaceTabs.find((tab) => tab.id === activeTab)?.label ?? 'Workspace';

  return (
    <BroadcastPanelShell
      title="Production Workspaces"
      subtitle={activeLabel}
      accent="route"
      className={cn('min-h-0', className)}
    >
      <nav
        className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-white/6 px-2 py-1"
        role="tablist"
        aria-label="Production workspace modules"
      >
        {workspaceTabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                selected
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
    </BroadcastPanelShell>
  );
}
