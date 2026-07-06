'use client';

import type { ReactNode } from 'react';
import type { DockTabId } from '../shell/types';
import { cn } from '@ubos/ui';
import { broadcastWorkspaceTabs, workspaceTabLabel } from '../broadcast-workspaces';

const TAB_BAR_HEIGHT_PX = 32;

export function bottomWorkspaceTabBarHeightPx() {
  return TAB_BAR_HEIGHT_PX;
}

export function BottomWorkspaceDock({
  activeTab,
  onTabChange,
  children,
  collapsed,
  onToggleCollapse,
  className,
}: {
  activeTab: DockTabId;
  onTabChange: (id: DockTabId) => void;
  children: ReactNode;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}) {
  const activeLabel = workspaceTabLabel(activeTab);
  const contentExpanded = !collapsed;

  const handleTabClick = (tabId: DockTabId) => {
    if (tabId === activeTab && contentExpanded && onToggleCollapse) {
      onToggleCollapse();
      return;
    }
    if (tabId !== activeTab) {
      onTabChange(tabId);
      if (collapsed && onToggleCollapse) onToggleCollapse();
    }
  };

  return (
    <section
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded border border-white/6 bg-[#04070e]',
        className,
      )}
      aria-label="Broadcast workspace dock"
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-white/6 px-1 py-0.5">
        <span className="hidden shrink-0 px-1 text-[9px] font-bold uppercase tracking-[0.14em] text-ubos-fg-muted sm:inline">
          Workspaces
        </span>
        <nav
          className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto"
          role="tablist"
          aria-label="Production workspace modules"
        >
          {broadcastWorkspaceTabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`workspace-panel-${tab.id}`}
                id={`workspace-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                  selected
                    ? contentExpanded
                      ? 'bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/30'
                      : 'bg-indigo-500/15 text-indigo-300'
                    : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
                )}
                title={tab.label}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel ?? tab.label}</span>
              </button>
            );
          })}
        </nav>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
            aria-label={contentExpanded ? 'Collapse active workspace' : 'Expand active workspace'}
            aria-expanded={contentExpanded}
          >
            {contentExpanded ? '▴' : '▾'}
          </button>
        ) : null}
      </div>

      {contentExpanded ? (
        <div
          id={`workspace-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`workspace-tab-${activeTab}`}
          className="ubos-scroll min-h-0 flex-1 overflow-y-auto"
        >
          <div className="border-b border-white/4 px-2 py-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-indigo-300/80">
              {activeLabel}
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  );
}
