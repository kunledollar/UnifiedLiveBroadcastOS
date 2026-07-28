'use client';

import type { RoutingMatrixEdge } from '../workspace-canvas/types';
import { cn } from '@ubos/ui';
import { BroadcastPanelShell } from './BroadcastPanelShell';

export function FloatingRoutingMatrixPanel({
  edges,
  embedded = false,
  className,
  onClose,
}: {
  edges: RoutingMatrixEdge[];
  embedded?: boolean;
  className?: string;
  onClose?: () => void;
}) {
  const content = (
    <div className="p-2">
      {edges.length === 0 ? (
        <p className="text-[11px] text-ubos-fg-muted">No active routing edges.</p>
      ) : (
        <ul className="grid gap-1">
          {edges.map((edge) => (
            <li
              key={edge.id}
              className={cn(
                'flex items-center justify-between rounded-ubos-sm border px-2 py-1 text-[10px]',
                edge.active
                  ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'
                  : 'border-white/6 bg-ubos-midnight text-ubos-fg-muted',
              )}
            >
              <span className="ubos-truncate">
                {edge.sourceLabel} → {edge.destinationLabel}
              </span>
              <span className="font-mono">{edge.active ? 'LIVE' : 'IDLE'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const shell = (
    <BroadcastPanelShell
      title="Routing Matrix"
      subtitle={`${edges.filter((e) => e.active).length} active routes`}
      accent="route"
      {...(className ? { className } : {})}
      headerActions={
        onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-1 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
            aria-label="Close routing matrix panel"
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
    <div className="pointer-events-auto fixed bottom-24 left-[18rem] z-40 w-80 shadow-2xl">{shell}</div>
  );
}
