'use client';

import type { ReactNode } from 'react';
import { cn } from '@ubos/ui';
import { BroadcastPanelShell } from './BroadcastPanelShell';

export function FloatingProductionGraphPanel({
  children,
  revision,
  embedded = false,
  className,
  onClose,
}: {
  children?: ReactNode;
  revision?: number;
  embedded?: boolean;
  className?: string;
  onClose?: () => void;
}) {
  const content = children ?? (
    <div className="p-3 text-[11px] text-ubos-fg-muted">
      <p className="font-medium text-ubos-fg-secondary">Production Graph Inspector</p>
      <p className="mt-1">
        Graph revision {revision ?? 0}. Enable{' '}
        <code className="rounded bg-ubos-midnight px-1 py-0.5 font-mono text-[10px]">
          NEXT_PUBLIC_UBOS_GRAPH_INSPECTOR
        </code>{' '}
        for full graph tooling.
      </p>
    </div>
  );

  const shell = (
    <BroadcastPanelShell
      title="Production Graph"
      subtitle={revision !== undefined ? `Rev ${revision}` : 'Command pipeline'}
      accent="route"
      {...(className ? { className } : {})}
      headerActions={
        onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-1 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
            aria-label="Close production graph panel"
          >
            ✕
          </button>
        ) : null
      }
    >
      {content}
    </BroadcastPanelShell>
  );

  if (embedded) return shell;

  return (
    <div className="pointer-events-auto fixed bottom-24 left-1/2 z-40 w-96 -translate-x-1/2 shadow-2xl">
      {shell}
    </div>
  );
}
