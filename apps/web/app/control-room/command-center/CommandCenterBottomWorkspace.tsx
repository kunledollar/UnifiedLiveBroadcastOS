'use client';

/**
 * UBOS 3.15B — tabbed bottom workspace.
 *
 * Hosts the EXISTING bottom workspace content node (audio mixer, replay,
 * graphics, routing matrix, automation, logs, production graph, system
 * status). Only one tab expands at a time; the tab set is gated by
 * Workspace Manager panel visibility and the active tab follows the active
 * workspace preset. Changing tabs is pure layout — production state is
 * never touched. Collapsing reduces the workspace to its tab bar.
 */
import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { DockTabId } from '../shell/types';
import { broadcastWorkspaceTabs, workspaceTabLabel } from '../broadcast-workspaces';
import { broadcastDock, broadcastSurfaces } from '../broadcast-command-center/broadcast-theme';
import { panelGatingBottomTab } from './command-center-logic';

export function CommandCenterBottomWorkspace({
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  isPanelVisible,
  children,
  className,
}: {
  activeTab: DockTabId;
  onTabChange: (tab: DockTabId) => void;
  collapsed: boolean;
  onToggleCollapse?: (() => void) | undefined;
  isPanelVisible: (panelId: string) => boolean;
  children: ReactNode;
  className?: string;
}) {
  const visibleTabs = broadcastWorkspaceTabs.filter((tab) => {
    if (tab.id === activeTab) return true;
    const gatingPanel = panelGatingBottomTab(tab.id);
    return gatingPanel === null || isPanelVisible(gatingPanel);
  });

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
      aria-label="Bottom workspace"
    >
      <div
        className={cn('flex shrink-0 items-center gap-1.5 border-b px-1.5 py-1', broadcastDock.tabBar)}
      >
        <span className="hidden shrink-0 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ubos-fg-muted sm:inline">
          Workspaces
        </span>
        <nav
          className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto"
          role="tablist"
          aria-label="Bottom workspace tabs"
        >
          {visibleTabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`command-center-workspace-${tab.id}`}
                id={`command-center-workspace-tab-${tab.id}`}
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
            aria-label={contentExpanded ? 'Collapse bottom workspace' : 'Expand bottom workspace'}
            aria-expanded={contentExpanded}
          >
            {contentExpanded ? '▾' : '▴'}
          </button>
        ) : null}
      </div>

      {contentExpanded ? (
        <div
          id={`command-center-workspace-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`command-center-workspace-tab-${activeTab}`}
          className="ubos-scroll min-h-0 flex-1 overflow-y-auto"
        >
          <div className="border-b border-ubos-border-subtle px-2.5 py-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-ubos-fg-muted">
              {workspaceTabLabel(activeTab)}
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  );
}
