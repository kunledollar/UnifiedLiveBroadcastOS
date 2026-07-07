'use client';

/**
 * UBOS 3.15B — left dock.
 *
 * Wraps the EXISTING SourceDockPanel content node (scene browser, source
 * browser, media browser, graphics browser, guests, diagnostics) inside a
 * DockablePanel. All add-source / scene-selection / search flows live in the
 * wrapped component and are untouched — this dock only decides which tab is
 * visible based on Workspace Manager panel metadata.
 */
import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { SourceDockTabId } from '../shell/types';
import { sourceDockTabs, sourceDockTabLabel } from '../broadcast-command-center/command-rail-constants';
import { DockablePanel } from './DockablePanel';
import { panelGatingSourceTab } from './command-center-logic';

export function CommandCenterLeftDock({
  activeTab,
  onTabChange,
  isPanelVisible,
  onHidePanel,
  children,
  className,
}: {
  activeTab: SourceDockTabId;
  onTabChange: (tab: SourceDockTabId) => void;
  isPanelVisible: (panelId: string) => boolean;
  onHidePanel: (panelId: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const visibleTabs = sourceDockTabs.filter((tab) => {
    if (tab.id === activeTab) return true;
    const gatingPanel = panelGatingSourceTab(tab.id);
    return gatingPanel === null || isPanelVisible(gatingPanel);
  });

  const activePanelId = panelGatingSourceTab(activeTab);

  return (
    <DockablePanel
      title={sourceDockTabLabel(activeTab)}
      status={{ tone: 'neutral' }}
      collapsed={false}
      collapsible={false}
      closable={activePanelId !== null}
      {...(activePanelId !== null ? { onHide: () => onHidePanel(activePanelId) } : {})}
      className={cn('h-full', className)}
      bodyClassName="flex flex-col"
    >
      <div
        className="flex shrink-0 flex-wrap gap-0.5 border-b border-ubos-border-subtle px-1 py-1"
        role="tablist"
        aria-label="Source dock tabs"
      >
        {visibleTabs.map((tab) => {
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              title={tab.label}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'shrink-0 rounded-ubos-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors',
                selected
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
              )}
            >
              {tab.shortLabel}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </DockablePanel>
  );
}
