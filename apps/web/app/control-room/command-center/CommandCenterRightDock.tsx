'use client';

/**
 * UBOS 3.15D-2 — right dock.
 *
 * Wraps the EXISTING operations sections (inspector, guests, recording,
 * streaming, outputs, alerts, telemetry, chat) in DockablePanel chrome.
 * Guest, recording, streaming, and inspector behaviors live entirely in the
 * wrapped components. Visibility and collapse are Workspace Manager panel
 * metadata; content stays mounted while collapsed so panel state persists.
 *
 * One Owner Rule (3.15C): this dock is the PRIMARY home for:
 *   Recording, Streaming, Guests, Broadcast I/O, Inspector
 * Secondary surfaces must not render these panels again — they call
 * CommandCenterShell.handleActivateOperationsPanel(panelId) instead.
 *
 * 3.15D-2 readability fixes:
 * - Aside uses min-w-0 + overflow-hidden to prevent horizontal overflow
 * - Each section wrapper uses min-w-0 so DockablePanel never bleeds out
 * - DockablePanel bodyClassName caps height per section and adds scroll
 * - Panel content overflow clipped at the zone boundary
 * - Labels remain readable (no horizontal overflow of the dock zone)
 * - Action buttons remain visible (shrink-0 in DockablePanel header)
 */
import { useEffect, useRef } from 'react';
import { cn } from '@ubos/ui';
import type { OperationsTabId } from '../shell/types';
import type { OperationsDockSection } from '../broadcast-command-center/RightOperationsDock';
import {
  OPERATIONS_DOCK_SECTION_LABELS,
  OPERATIONS_DOCK_SECTION_ORDER,
  operationsTabToDockSection,
} from '../operations/operations-dock-types';
import { DockablePanel, type DockablePanelStatus } from './DockablePanel';
import { panelForRightDockSection } from './command-center-logic';

function statusForBadge(badge: string | undefined): DockablePanelStatus {
  if (!badge) return { tone: 'neutral' };
  if (badge === 'REC' || badge === 'LIVE') return { tone: 'live', label: badge };
  if (badge === '●') return { tone: 'ready' };
  return { tone: 'neutral', label: badge };
}

export function CommandCenterRightDock({
  sections,
  activeOperationsTab,
  isPanelVisible,
  isPanelCollapsed,
  getPanelTitle,
  onToggleCollapsed,
  onHidePanel,
  className,
}: {
  sections: OperationsDockSection[];
  activeOperationsTab: OperationsTabId;
  isPanelVisible: (panelId: string) => boolean;
  isPanelCollapsed: (panelId: string) => boolean;
  getPanelTitle?: ((panelId: string) => string | undefined) | undefined;
  onToggleCollapsed: (panelId: string) => void;
  onHidePanel: (panelId: string) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const orderedSections = OPERATIONS_DOCK_SECTION_ORDER.flatMap((id) => {
    const section = sectionMap.get(id);
    return section ? [section] : [];
  });

  const visibleSectionCount = orderedSections.filter(
    (section) => isPanelVisible(panelForRightDockSection(section.id)),
  ).length;

  useEffect(() => {
    const target = operationsTabToDockSection(activeOperationsTab);
    if (!target) return;
    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector(`#command-center-ops-${target}`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, [activeOperationsTab]);

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 min-w-0 flex-col overflow-hidden',
        className,
      )}
      aria-label="Operations dock"
    >
      <div
        ref={scrollRef}
        className="ubos-scroll flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden p-1.5"
      >
        {visibleSectionCount === 0 ? (
          // Empty-dock hint — One Owner Rule: tells operator where to find panels.
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
            <span className="text-lg text-ubos-fg-muted/40" aria-hidden="true">
              ◨
            </span>
            <p className="text-[10px] leading-relaxed text-ubos-fg-muted">
              No operations panels are visible.
              <br />
              Use{' '}
              <span className="font-bold text-ubos-fg-secondary">
                Docks menu → Panels
              </span>{' '}
              to show them.
            </p>
          </div>
        ) : null}

        {orderedSections.map((section) => {
          const panelId = panelForRightDockSection(section.id);
          if (!isPanelVisible(panelId)) return null;
          return (
            <div
              key={section.id}
              id={`command-center-ops-${section.id}`}
              className="min-w-0 shrink-0 animate-[ubos-panel-appear_180ms_var(--ubos-easing-out)_forwards]"
            >
              <DockablePanel
                title={getPanelTitle?.(panelId) ?? OPERATIONS_DOCK_SECTION_LABELS[section.id]}
                status={statusForBadge(section.badge)}
                collapsed={isPanelCollapsed(panelId)}
                collapsible
                closable
                onToggleCollapse={() => onToggleCollapsed(panelId)}
                onHide={() => onHidePanel(panelId)}
                bodyClassName="max-h-[22rem] overflow-x-hidden"
              >
                {section.content}
              </DockablePanel>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
