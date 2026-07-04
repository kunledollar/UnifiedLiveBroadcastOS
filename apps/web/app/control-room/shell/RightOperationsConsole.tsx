'use client';

import type { ReactNode } from 'react';
import { BroadcastHeader, BroadcastPanel, cn } from '@ubos/ui';
import type { OperationsTabId } from './types';

const tabOrder: OperationsTabId[] = [
  'guests',
  'inspector',
  'routing',
  'outputs',
  'health',
  'preview',
  'logs',
  'ai',
];

const tabLabels: Record<OperationsTabId, string> = {
  guests: 'Guests',
  inspector: 'Inspector',
  routing: 'Routing',
  outputs: 'Outputs',
  health: 'Health',
  preview: 'Preview',
  logs: 'Logs',
  ai: 'AI',
};

export function RightOperationsConsole({
  tabs,
  activeTab,
  onTabChange,
  previewSlot,
  className,
}: {
  tabs: Array<{ id: OperationsTabId; content: ReactNode }>;
  activeTab: OperationsTabId;
  onTabChange: (id: OperationsTabId) => void;
  previewSlot?: ReactNode;
  className?: string;
}) {
  const sortedTabs = [...tabs].sort((a, b) => tabOrder.indexOf(a.id) - tabOrder.indexOf(b.id));
  const active = sortedTabs.find((tab) => tab.id === activeTab) ?? sortedTabs[0];

  return (
    <aside
      className={cn(
        'flex w-[var(--ubos-operations-width)] shrink-0 min-h-0 flex-col border-l border-ubos-border-subtle bg-ubos-graphite',
        className,
      )}
    >
      <BroadcastHeader title="Operations Console" className="shrink-0 px-ubos-3 pt-ubos-3" />

      <div
        className="grid shrink-0 grid-cols-2 gap-px border-b border-ubos-border-subtle px-ubos-2 pb-ubos-2"
        role="tablist"
        aria-label="Operations console sections"
      >
        {sortedTabs.map((tab) => {
          const selected = active?.id === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'rounded-ubos-sm px-ubos-2 py-ubos-2 text-left text-ubos-caption transition-colors duration-ubos-fast',
                selected
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
              )}
            >
              {tabLabels[tab.id]}
            </button>
          );
        })}
      </div>

      <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto p-ubos-2" role="tabpanel">
        {active?.content}
      </div>

      {previewSlot && activeTab !== 'preview' ? (
        <BroadcastPanel
          variant="inset"
          padding={false}
          className="mx-ubos-2 mb-ubos-2 mt-ubos-1 shrink-0 overflow-hidden border-ubos-preview-border shadow-ubos-preview-glow"
        >
          <div className="p-ubos-1">{previewSlot}</div>
        </BroadcastPanel>
      ) : null}
    </aside>
  );
}
