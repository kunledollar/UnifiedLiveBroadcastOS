'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { OperationsTabId } from '../shell/types';
import {
  OPERATIONS_DOCK_SECTION_LABELS,
  OPERATIONS_DOCK_SECTION_ORDER,
  dockSectionToOperationsTab,
  operationsTabToDockSection,
  type OperationsDockSectionId,
} from '../operations/operations-dock-types';
import { cn } from '@ubos/ui';
import { BroadcastPanelShell } from './BroadcastPanelShell';
import { OperationsDockSection } from './OperationsDockSection';

export type OperationsDockSection = {
  id: OperationsDockSectionId;
  content: ReactNode;
  badge?: string;
  defaultCollapsed?: boolean;
};

const defaultCollapsedSections = new Set<OperationsDockSectionId>([
  'unified-chat',
  'outputs',
  'telemetry',
  'system-health',
]);

export function RightOperationsDock({
  sections,
  activeTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  className,
}: {
  sections: OperationsDockSection[];
  activeTab: OperationsTabId;
  onTabChange: (id: OperationsTabId) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}) {
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const orderedSections = OPERATIONS_DOCK_SECTION_ORDER.flatMap((id) => {
    const section = sectionMap.get(id);
    return section ? [section] : [];
  });

  const [expandedSections, setExpandedSections] = useState<Set<OperationsDockSectionId>>(() => {
    const initial = new Set<OperationsDockSectionId>();
    for (const section of orderedSections) {
      if (!section.defaultCollapsed && !defaultCollapsedSections.has(section.id)) {
        initial.add(section.id);
      }
    }
    if (initial.size === 0 && orderedSections[0]) {
      initial.add(orderedSections[0].id);
    }
    return initial;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const expandSection = useCallback((sectionId: OperationsDockSectionId) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      next.add(sectionId);
      return next;
    });
  }, []);

  const toggleSection = useCallback((sectionId: OperationsDockSectionId) => {
    setExpandedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
    onTabChange(dockSectionToOperationsTab(sectionId));
  }, [onTabChange]);

  useEffect(() => {
    const target = operationsTabToDockSection(activeTab);
    if (!target) return;
    expandSection(target);
    requestAnimationFrame(() => {
      scrollRef.current
        ?.querySelector(`#ops-section-${target}`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, [activeTab, expandSection]);

  if (collapsed) {
    return (
      <aside
        className={cn('flex h-full min-h-0 min-w-0 flex-col items-center py-2', className)}
        aria-label="Operations dock"
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex flex-col items-center gap-1 rounded px-1 py-2 text-[9px] font-bold uppercase tracking-wide text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary"
          aria-label="Expand operations dock"
        >
          <span className="text-sm" aria-hidden="true">
            ◧
          </span>
          <span className="[writing-mode:vertical-rl] rotate-180">Ops</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className={cn('flex min-h-0 min-w-0 flex-col', className)} aria-label="Operations dock">
      <BroadcastPanelShell
        title="Operations"
        subtitle="Live production monitoring"
        accent="neutral"
        className="min-h-0 flex-1"
        headerActions={
          onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded px-1 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
              aria-label="Collapse operations dock"
            >
              ▴
            </button>
          ) : null
        }
      >
        <div ref={scrollRef} className="ubos-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1.5">
          {orderedSections.map((section) => (
            <OperationsDockSection
              key={section.id}
              sectionId={section.id}
              title={OPERATIONS_DOCK_SECTION_LABELS[section.id]}
              {...(section.badge ? { badge: section.badge } : {})}
              collapsed={!expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            >
              {section.content}
            </OperationsDockSection>
          ))}
        </div>
      </BroadcastPanelShell>
    </aside>
  );
}
