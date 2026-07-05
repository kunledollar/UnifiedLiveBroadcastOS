'use client';

import type { ReactNode } from 'react';
import { BroadcastPanel, cn, ubosTypographyClasses } from '@ubos/ui';
import type { OperationsTabId } from './types';

const tabOrder: OperationsTabId[] = [
  'guests',
  'team',
  'automation',
  'devices',
  'engine',
  'compositor',
  'runtime',
  'recording',
  'security',
  'cluster',
  'plugins',
  'cloud',
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
  team: 'Team',
  automation: 'Automation',
  devices: 'Devices',
  engine: 'Engine',
  compositor: 'Compositor',
  runtime: 'Runtime',
  recording: 'Recording',
  security: 'Security',
  cluster: 'Cluster',
  plugins: 'Plugins',
  cloud: 'Cloud',
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
        'flex w-[var(--ubos-operations-width)] shrink-0 min-h-0 flex-col overflow-hidden border-l border-ubos-border-subtle bg-ubos-graphite',
        className,
      )}
    >
      <header className="shrink-0 border-b border-ubos-border-subtle px-ubos-3 py-ubos-2">
        <h2 className={cn(ubosTypographyClasses.section, 'text-ubos-fg-primary')}>
          Operations Console
        </h2>
      </header>

      <nav
        className="grid shrink-0 grid-cols-4 gap-1 border-b border-ubos-border-subtle p-ubos-2"
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
              title={tabLabels[tab.id]}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'rounded-ubos-sm px-1 py-1.5 text-center transition-colors duration-ubos-fast',
                ubosTypographyClasses.metadata,
                'font-medium ubos-truncate',
                selected
                  ? 'bg-ubos-selection-muted text-ubos-selection-text'
                  : 'text-ubos-fg-muted hover:bg-ubos-midnight hover:text-ubos-fg-secondary',
              )}
            >
              {tabLabels[tab.id]}
            </button>
          );
        })}
      </nav>

      <BroadcastPanel
        variant="inset"
        padding={false}
        className="min-h-0 min-w-0 flex-1 border-0 shadow-none"
      >
        <div
          className="ubos-scroll h-full overflow-y-auto overflow-x-hidden p-ubos-2"
          role="tabpanel"
        >
          {active?.content}
        </div>
      </BroadcastPanel>

      {previewSlot && activeTab !== 'preview' ? (
        <div className="mx-ubos-2 mb-ubos-2 mt-ubos-1 h-36 shrink-0 overflow-hidden rounded-ubos-sm border border-ubos-border-subtle">
          {previewSlot}
        </div>
      ) : null}
    </aside>
  );
}
