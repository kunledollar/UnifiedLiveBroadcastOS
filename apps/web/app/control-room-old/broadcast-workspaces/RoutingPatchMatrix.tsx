'use client';

import { cn } from '@ubos/ui';
import type { RoutingMatrixEdge } from '../workspace-canvas/types';

export function RoutingPatchMatrix({
  edges,
  className,
}: {
  edges: RoutingMatrixEdge[];
  className?: string;
}) {
  const sources = Array.from(
    new Map(edges.map((edge) => [edge.sourceId, edge.sourceLabel])).entries(),
  ).map(([id, label]) => ({ id, label }));

  const destinations = Array.from(
    new Map(edges.map((edge) => [edge.destinationId, edge.destinationLabel])).entries(),
  ).map(([id, label]) => ({ id, label }));

  const edgeKey = (sourceId: string, destinationId: string) =>
    edges.find((edge) => edge.sourceId === sourceId && edge.destinationId === destinationId);

  if (!edges.length) {
    return (
      <p className={cn('px-2 py-3 text-[11px] text-ubos-fg-muted', className)}>
        No active routing edges. Routes appear here when media routes are configured.
      </p>
    );
  }

  return (
    <div className={cn('min-h-0 overflow-auto p-2', className)}>
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-[#04070e] px-2 py-1 text-left font-bold uppercase tracking-wide text-ubos-fg-muted">
                Source
              </th>
              {destinations.map((destination) => (
                <th
                  key={destination.id}
                  className="px-2 py-1 text-center font-bold uppercase tracking-wide text-ubos-fg-muted"
                  title={destination.label}
                >
                  <span className="block max-w-[4.5rem] truncate">{destination.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-t border-white/6">
                <th
                  className="sticky left-0 z-10 bg-[#04070e] px-2 py-1 text-left font-semibold text-ubos-fg-secondary"
                  title={source.label}
                >
                  <span className="block max-w-[8rem] truncate">{source.label}</span>
                </th>
                {destinations.map((destination) => {
                  const edge = edgeKey(source.id, destination.id);
                  const patched = Boolean(edge?.active);
                  return (
                    <td key={destination.id} className="px-1 py-1 text-center">
                      <div
                        className={cn(
                          'mx-auto flex h-7 w-7 items-center justify-center rounded border font-mono text-[9px] font-bold uppercase',
                          patched
                            ? 'border-indigo-400/50 bg-indigo-500/25 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.25)]'
                            : 'border-white/8 bg-ubos-midnight text-ubos-fg-muted',
                        )}
                        title={
                          edge
                            ? `${source.label} → ${destination.label}${edge.gain !== undefined ? ` · ${edge.gain} dB` : ''}`
                            : `${source.label} → ${destination.label} (unpatched)`
                        }
                        aria-label={
                          edge
                            ? `${source.label} to ${destination.label}, ${patched ? 'live' : 'idle'}`
                            : `${source.label} to ${destination.label}, unpatched`
                        }
                      >
                        {patched ? '●' : '·'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[9px] uppercase tracking-wide text-ubos-fg-muted">
        {edges.filter((edge) => edge.active).length} of {edges.length} patches live
      </p>
    </div>
  );
}
