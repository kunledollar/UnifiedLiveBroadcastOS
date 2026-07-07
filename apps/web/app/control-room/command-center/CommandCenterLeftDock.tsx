'use client';

/**
 * UBOS 3.15C — left dock.
 *
 * Wraps the EXISTING SourceDockPanel content node (scene browser, source
 * browser, media browser, graphics browser, guests, diagnostics) inside a
 * DockablePanel. All add-source / scene-selection / search flows live in the
 * wrapped component and are untouched — this dock only decides which tab is
 * visible based on Workspace Manager panel metadata.
 *
 * 3.15C changes (polish only):
 * - Tab bar uses underline-indicator style instead of background fill
 * - Tab buttons have larger click targets and focus-visible rings
 * - ARIA role="tabpanel" applied to the content region
 * - Section label for the tab bar improved to "Sources"
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
      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-end gap-px border-b border-ubos-border-subtle bg-ubos-midnight/40 px-1.5 pt-1"
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
              aria-controls={`source-dock-panel-${tab.id}`}
              id={`source-dock-tab-${tab.id}`}
              title={tab.label}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative shrink-0 px-2 pb-1.5 pt-1',
                'text-[9px] font-bold uppercase tracking-[0.1em]',
                'transition-colors duration-[var(--ubos-duration-fast)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ubos-selection/60',
                selected
                  ? 'text-ubos-fg-primary'
                  : 'text-ubos-fg-muted hover:text-ubos-fg-secondary',
              )}
            >
              {tab.shortLabel}
              {/* Active underline indicator */}
              <span
                className={cn(
                  'absolute bottom-0 inset-x-1.5 h-0.5 rounded-full',
                  'transition-all duration-[var(--ubos-duration-normal)] ease-[var(--ubos-easing-out)]',
                  selected ? 'bg-ubos-selection opacity-100' : 'bg-transparent opacity-0',
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {/* ── Tab content ───────────────────────────────────────────── */}
      <div
        id={`source-dock-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`source-dock-tab-${activeTab}`}
        className="min-h-0 flex-1"
      >
        {children}
      </div>
    </DockablePanel>
  );
}
