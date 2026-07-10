'use client';

import type { ReactNode } from 'react';
import type { DockTabId } from '../shell/types';
import { cn } from '@ubos/ui';
import { broadcastWorkspaceTabs, workspaceTabLabel } from '../broadcast-workspaces';
import { broadcastDock, broadcastSurfaces } from './broadcast-theme';

const TAB_BAR_HEIGHT_PX = 36;

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
        'flex min-h-0 flex-col overflow-hidden rounded-ubos-md border',
        broadcastSurfaces.dock,
        className,
      )}
      aria-label="Broadcast workspace dock"
    >
      <div
        className={cn(
          'flex shrink-0 items-center gap-1.5 border-b px-1.5 py-1',
          broadcastDock.tabBar,
        )}
      >
        <span className="hidden shrink-0 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ubos-fg-muted sm:inline">
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
                  'shrink-0 rounded-ubos-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                  selected
                    ? contentExpanded
                      ? broadcastDock.tabActive
                      : 'bg-ubos-selection-muted/70 text-ubos-selection-text'
                    : broadcastDock.tabInactive,
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
            className={broadcastDock.collapseButton}
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
          <div className="border-b border-ubos-border-subtle px-2.5 py-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ubos-fg-muted">
              {activeLabel}
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  );
}
