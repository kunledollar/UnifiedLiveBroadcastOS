'use client';

/**
 * UBOS 3.15B — right dock.
 *
 * Wraps the EXISTING operations sections (inspector, guests, recording,
 * streaming, outputs, alerts, telemetry, chat) in DockablePanel chrome.
 * Guest, recording, streaming, and inspector behaviors live entirely in the
 * wrapped components. Visibility and collapse are Workspace Manager panel
 * metadata; content stays mounted while collapsed so panel state persists.
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
      className={cn('flex h-full min-h-0 min-w-0 flex-col', className)}
      aria-label="Operations dock"
    >
      <div
        ref={scrollRef}
        className="ubos-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1"
      >
        {orderedSections.map((section) => {
          const panelId = panelForRightDockSection(section.id);
          if (!isPanelVisible(panelId)) return null;
          return (
            <div key={section.id} id={`command-center-ops-${section.id}`} className="shrink-0">
              <DockablePanel
                title={getPanelTitle?.(panelId) ?? OPERATIONS_DOCK_SECTION_LABELS[section.id]}
                status={statusForBadge(section.badge)}
                collapsed={isPanelCollapsed(panelId)}
                collapsible
                closable
                onToggleCollapse={() => onToggleCollapsed(panelId)}
                onHide={() => onHidePanel(panelId)}
                bodyClassName="max-h-[24rem]"
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
