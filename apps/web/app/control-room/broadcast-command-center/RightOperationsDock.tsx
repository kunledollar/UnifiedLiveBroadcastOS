'use client';

import type { ReactNode } from 'react';
import type { OperationsTabId } from '../shell/types';
import { cn } from '@ubos/ui';
import { BroadcastPanelShell } from './BroadcastPanelShell';

const tabLabels: Partial<Record<OperationsTabId, string>> = {
  guests: 'Guests',
  team: 'Team',
  automation: 'Automation',
  devices: 'Devices',
  engine: 'Engine',
  compositor: 'Compositor',
  runtime: 'Runtime',
  recording: 'Recording',
  streaming: 'Streaming',
  security: 'Security',
  monitoring: 'Monitor Wall',
  cluster: 'Cluster',
  plugins: 'Plugins',
  cloud: 'Cloud',
  analytics: 'Analytics',
  'enterprise-admin': 'Admin',
  inspector: 'Inspector',
  routing: 'Routing',
  outputs: 'Outputs',
  health: 'Telemetry',
  preview: 'Preview',
  logs: 'Chat & Logs',
  'ai-director': 'AI Director',
  ai: 'AI',
};

const primaryTabs: OperationsTabId[] = [
  'guests',
  'team',
  'logs',
  'health',
  'streaming',
  'recording',
  'routing',
  'automation',
  'inspector',
  'preview',
];

export function RightOperationsDock({
  tabs,
  activeTab,
  onTabChange,
  previewSlot,
  telemetrySlot,
  className,
}: {
  tabs: Array<{ id: OperationsTabId; content: ReactNode }>;
  activeTab: OperationsTabId;
  onTabChange: (id: OperationsTabId) => void;
  previewSlot?: ReactNode;
  telemetrySlot?: ReactNode;
  className?: string;
}) {
  const visibleTabs = tabs.filter((tab) => primaryTabs.includes(tab.id));
  const resolvedTabs = visibleTabs.length > 0 ? visibleTabs : tabs;
  const active = resolvedTabs.find((tab) => tab.id === activeTab) ?? resolvedTabs[0];

  return (
    <aside className={cn('flex min-h-0 min-w-0 flex-col gap-1', className)} aria-label="Operations dock">
      {telemetrySlot ? (
        <BroadcastPanelShell
          title="Telemetry"
          subtitle="Live session metrics"
          accent="telemetry"
          className="max-h-28 shrink-0"
        >
          <div className="p-1.5">{telemetrySlot}</div>
        </BroadcastPanelShell>
      ) : null}

      <BroadcastPanelShell
        title="Operations"
        subtitle={tabLabels[activeTab] ?? activeTab}
        accent="neutral"
        className="min-h-0 flex-1"
      >
        <nav
          className="grid shrink-0 grid-cols-3 gap-0.5 border-b border-white/6 p-1"
          role="tablist"
          aria-label="Operations sections"
        >
          {resolvedTabs.map((tab) => {
            const selected = active?.id === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                title={tabLabels[tab.id] ?? tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'rounded px-1 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                  selected
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'text-ubos-fg-muted hover:bg-ubos-graphite hover:text-ubos-fg-secondary',
                )}
              >
                {(tabLabels[tab.id] ?? tab.id).slice(0, 10)}
              </button>
            );
          })}
        </nav>
        <div className="ubos-scroll min-h-0 flex-1 overflow-y-auto p-2" role="tabpanel">
          {active?.content}
        </div>
        {previewSlot && activeTab !== 'preview' ? (
          <div className="mx-2 mb-2 h-24 shrink-0 overflow-hidden rounded border border-ubos-border-subtle">
            {previewSlot}
          </div>
        ) : null}
      </BroadcastPanelShell>
    </aside>
  );
}
