'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { SourceDockTabId } from '../shell/types';
import { sourceDockTabs } from './command-rail-constants';
import { BroadcastPanelShell } from './BroadcastPanelShell';

export function SourceDiagnosticDock({
  activeTab,
  onTabChange,
  children,
  collapsed,
  onToggleCollapse,
  className,
}: {
  activeTab: SourceDockTabId;
  onTabChange: (tab: SourceDockTabId) => void;
  children: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}) {
  const activeLabel = sourceDockTabs.find((tab) => tab.id === activeTab)?.label ?? 'Sources';

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      <BroadcastPanelShell
        title="Source Dock"
        subtitle={activeLabel}
        accent="neutral"
        className="min-h-0 flex-1"
        headerActions={
          onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded px-1 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
              aria-label={collapsed ? 'Expand source dock' : 'Collapse source dock'}
            >
              {collapsed ? '▾' : '▴'}
            </button>
          ) : null
        }
      >
        <nav
          className="flex shrink-0 flex-wrap gap-0.5 border-b border-white/6 bg-[#060a12]/80 p-1"
          aria-label="Source dock tabs"
          role="tablist"
        >
          {sourceDockTabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                title={tab.label}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-ubos-sm px-0.5 py-1 text-[8px] font-bold uppercase tracking-wide transition-colors',
                  active
                    ? 'bg-ubos-selection-muted text-ubos-selection-text'
                    : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
                )}
              >
                <span className="text-xs leading-none" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="ubos-truncate max-w-full">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
        {!collapsed ? <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto p-1.5">{children}</div> : null}
      </BroadcastPanelShell>
    </div>
  );
}
