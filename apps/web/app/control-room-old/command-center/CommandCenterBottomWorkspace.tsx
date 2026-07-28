'use client';

/**
 * UBOS 3.15D-2 — tabbed bottom workspace.
 *
 * Hosts the EXISTING bottom workspace content node (audio mixer, replay,
 * graphics, routing matrix, automation, logs, production graph, system
 * status). Only one tab's full editor is mounted at a time — inactive
 * workspaces are represented by their tab button only. This prevents
 * duplicate editor instances (One Owner Rule) and keeps the bottom zone
 * from growing larger than its height budget.
 *
 * One Owner Rule (3.15C/D): this zone is the PRIMARY home for:
 *   Audio Mixer, Graphics, Replay, Automation, Routing Matrix,
 *   Production Graph, Logs, System Status
 * Secondary surfaces must not render these as full editors — they call
 * CommandCenterShell.handleActivateBottomTab(tabId) instead.
 *
 * 3.15D-2 refinements:
 * - Tabs scroll horizontally when the zone is narrow
 * - Only the active workspace renders its full editor; others are tabs only
 * - Content scrolls internally (overflow-y-auto on the tabpanel)
 * - Bottom workspace never covers Program/Preview (rendered below stage in
 *   the normal document flow with a capped height from Workspace Manager)
 * - No duplicate editors: children (the active editor node) renders once
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
      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex shrink-0 items-end gap-1.5 border-b px-2 pt-1',
          broadcastDock.tabBar,
        )}
        role="tablist"
        aria-label="Bottom workspace tabs"
        aria-orientation="horizontal"
      >
        {/* Zone label */}
        <span
          className="hidden shrink-0 pb-1.5 pr-1 text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted/70 sm:inline"
          aria-hidden="true"
        >
          Workspaces
        </span>

        {/* Separator */}
        <span
          className="hidden h-3 self-center border-r border-ubos-border-subtle sm:inline"
          aria-hidden="true"
        />

        {/* Tabs — scroll horizontally when zone is narrow */}
        <nav
          className={cn(
            'flex min-w-0 flex-1 gap-px overflow-x-auto',
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
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
                title={tab.label}
                className={cn(
                  'relative shrink-0 whitespace-nowrap px-2.5 pb-1.5 pt-1',
                  'text-[10px] font-bold uppercase tracking-wide',
                  'transition-colors duration-[var(--ubos-duration-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
                  selected
                    ? contentExpanded
                      ? 'text-ubos-fg-primary'
                      : 'text-ubos-selection-text'
                    : 'text-ubos-fg-muted hover:text-ubos-fg-secondary',
                )}
              >
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel ?? tab.label}</span>

                {/* Active underline indicator */}
                <span
                  className={cn(
                    'absolute bottom-0 inset-x-2 h-0.5 rounded-full',
                    'transition-all duration-[var(--ubos-duration-normal)] ease-[var(--ubos-easing-out)]',
                    selected && contentExpanded
                      ? 'bg-ubos-selection opacity-100'
                      : 'bg-transparent opacity-0',
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'mb-1.5 shrink-0 rounded-ubos-sm px-1.5 py-0.5',
              'text-[10px] text-ubos-fg-muted',
              'transition-colors duration-[var(--ubos-duration-fast)]',
              'hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
            )}
            aria-label={contentExpanded ? 'Collapse bottom workspace' : 'Expand bottom workspace'}
            aria-expanded={contentExpanded}
          >
            <span
              className={cn(
                'inline-block transition-transform duration-[var(--ubos-duration-normal)] ease-[var(--ubos-easing-out)]',
                contentExpanded ? 'rotate-0' : 'rotate-180',
              )}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
        ) : null}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      {/* Only the active workspace renders its full editor (One Owner Rule).
          Inactive workspaces are tab buttons only — no duplicate editors. */}
      {contentExpanded ? (
        <div
          id={`command-center-workspace-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`command-center-workspace-tab-${activeTab}`}
          className={cn(
            'ubos-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden',
            'animate-[ubos-fade-in_120ms_var(--ubos-easing-out)_forwards]',
          )}
        >
          {/* Content section header */}
          <div className="border-b border-ubos-border-subtle bg-ubos-midnight/30 px-3 py-1.5">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ubos-fg-muted">
              {workspaceTabLabel(activeTab)}
            </p>
          </div>
          {children}
        </div>
      ) : null}
    </section>
  );
}
