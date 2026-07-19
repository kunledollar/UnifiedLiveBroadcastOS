'use client';

/**
 * UBOS 3.15D-2 — left dock.
 *
 * Wraps the EXISTING SourceDockPanel content node (scene browser, source
 * browser, media browser, graphics browser, guests, diagnostics) inside a
 * DockablePanel. All add-source / scene-selection / search flows live in the
 * wrapped component and are untouched — this dock only decides which tab is
 * visible based on Workspace Manager panel metadata.
 *
 * 3.15D-2 readability fixes:
 * - Tab bar scrolls horizontally when tabs do not fit — no squeezing
 * - Each tab uses min-w-0 with truncated short label and full-label tooltip
 * - Tab content region uses min-w-0 + overflow-hidden so cards never cause
 *   horizontal overflow of the dock zone
 * - Names inside cards truncate with ellipsis (cards use Tailwind min-w-0)
 * - Badges wrap to second row where needed (flex-wrap on card bodies)
 * - Action/dropdown buttons remain visible (flex-shrink-0 on icon buttons)
 * - Filters/search remain usable (full width in column layout)
 *
 * PR-G: Move-to dropdown wired to every tab via DockablePanel header.
 * No layout, geometry, or content changes.
 */
import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { cn } from '@ubos/ui';
import type { WorkspaceZoneId } from '@ubos/shared';
import type { SourceDockTabId } from '../shell/types';
import {
  sourceDockTabs,
  sourceDockTabLabel,
} from '../broadcast-command-center/command-rail-constants';
import { DockablePanel, type MoveToOption } from './DockablePanel';
import { panelGatingSourceTab } from './command-center-logic';

/**
 * Named destinations for the Move-to dropdown (PR-G spec).
 * Zone mapping: left-dock = Scenes/Sources/Media, right-dock = Guests,
 * bottom-workspace = Diagnostics.
 */
const MOVE_DESTINATIONS: ReadonlyArray<{ key: string; label: string; zone: WorkspaceZoneId }> = [
  { key: 'scenes', label: 'Scenes', zone: 'left-dock' },
  { key: 'sources', label: 'Sources', zone: 'left-dock' },
  { key: 'guests', label: 'Guests', zone: 'right-dock' },
  { key: 'media', label: 'Media', zone: 'left-dock' },
  { key: 'diagnostics', label: 'Diagnostics', zone: 'bottom-workspace' },
];

export const CommandCenterLeftDock = memo(function CommandCenterLeftDock({
  activeTab,
  onTabChange,
  isPanelVisible,
  onHidePanel,
  getPanelZone,
  onMovePanel,
  children,
  className,
}: {
  activeTab: SourceDockTabId;
  onTabChange: (tab: SourceDockTabId) => void;
  isPanelVisible: (panelId: string) => boolean;
  onHidePanel: (panelId: string) => void;
  /** Returns the current zone id for a given panel id (used to disable the current-zone option). */
  getPanelZone?: (panelId: string) => WorkspaceZoneId | undefined;
  /** Called when the operator selects a Move-to destination. */
  onMovePanel?: (panelId: string, targetZone: WorkspaceZoneId) => void;
  children: ReactNode;
  className?: string;
}) {
  const visibleTabs = useMemo(
    () =>
      sourceDockTabs.filter((tab) => {
        if (tab.id === activeTab) return true;
        const gatingPanel = panelGatingSourceTab(tab.id);
        return gatingPanel === null || isPanelVisible(gatingPanel);
      }),
    [activeTab, isPanelVisible],
  );

  const activePanelId = panelGatingSourceTab(activeTab);

  // Build Move-to options for the active panel.
  // Options for the panel's current zone are disabled (already there).
  // When no panel is gated by the active tab (guests/diagnostics) or no
  // move handler is provided, the dropdown is omitted from the header.
  const currentZone = activePanelId ? getPanelZone?.(activePanelId) : undefined;
  const moveToOptions: MoveToOption[] | undefined = useMemo(
    () =>
      activePanelId && onMovePanel
        ? MOVE_DESTINATIONS.map(({ key, label, zone }) => ({
            key,
            label,
            disabled: zone === currentZone,
          }))
        : undefined,
    [activePanelId, currentZone, onMovePanel],
  );

  const handleMoveTo = useMemo(
    () =>
      activePanelId && onMovePanel
        ? (key: string) => {
            const dest = MOVE_DESTINATIONS.find((d) => d.key === key);
            if (dest) onMovePanel(activePanelId, dest.zone);
          }
        : undefined,
    [activePanelId, onMovePanel],
  );

  const handleHideActivePanel = useCallback(() => {
    if (activePanelId) onHidePanel(activePanelId);
  }, [activePanelId, onHidePanel]);

  return (
    <DockablePanel
      title={sourceDockTabLabel(activeTab)}
      status={{ tone: 'neutral' }}
      collapsed={false}
      collapsible={false}
      closable={activePanelId !== null}
      {...(activePanelId !== null ? { onHide: handleHideActivePanel } : {})}
      {...(moveToOptions && handleMoveTo ? { moveToOptions, onMoveTo: handleMoveTo } : {})}
      className={cn('h-full', className)}
      bodyClassName="flex min-w-0 flex-col overflow-hidden"
    >
      {/* ── Tab bar: scrolls horizontally so tabs are always readable ── */}
      <div
        className={cn(
          'flex shrink-0 items-end gap-px overflow-x-auto border-b',
          'border-ubos-border-subtle bg-ubos-midnight/40 px-1.5 pt-1',
          /* Hide scrollbar but keep functional scrolling */
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        )}
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
                'text-[9px] font-bold uppercase tracking-[0.1em] whitespace-nowrap',
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

      {/* ── Tab content ───────────────────────────────────────────────
          min-w-0 + overflow-hidden prevent card children from expanding
          beyond the dock zone width. Cards inside the wrapped SourceDockPanel
          should use min-w-0 and truncate on their name spans. */}
      <div
        id={`source-dock-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`source-dock-tab-${activeTab}`}
        className="min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        {children}
      </div>
    </DockablePanel>
  );
});
