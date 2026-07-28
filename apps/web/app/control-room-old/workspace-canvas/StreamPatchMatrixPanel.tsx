'use client';

import type { RoutingMatrixEdge } from './types';
import { DockablePanel } from './DockablePanel';

export function StreamPatchMatrixPanel({
  edges,
  collapsed,
  undocked,
  onToggleCollapse,
  onToggleUndock,
  onToggleEdge,
}: {
  edges: RoutingMatrixEdge[];
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
  onToggleEdge?: (edgeId: string) => void;
}) {
  return (
    <DockablePanel
      title="Stream Patch Matrix"
      subtitle="Active routes highlighted"
      accent="route"
      collapsed={collapsed}
      undocked={undocked ?? false}
      onToggleCollapse={onToggleCollapse}
      onToggleUndock={onToggleUndock}
      compactHeader
    >
      <div className="overflow-x-auto p-2">
        <table className="w-full min-w-[20rem] border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/8 text-left text-slate-500">
              <th className="px-2 py-1 font-medium">Source</th>
              <th className="px-2 py-1 font-medium">Destination</th>
              <th className="px-2 py-1 font-medium">Gain</th>
              <th className="px-2 py-1 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {edges.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-3 text-center text-slate-500">
                  No routes configured
                </td>
              </tr>
            ) : (
              edges.map((edge) => (
                <tr
                  key={edge.id}
                  className={`border-b border-white/4 transition-colors ${
                    edge.active ? 'bg-indigo-500/10' : 'hover:bg-white/3'
                  }`}
                >
                  <td className="px-2 py-1.5 font-mono text-slate-300">{edge.sourceLabel}</td>
                  <td className="px-2 py-1.5 font-mono text-slate-300">{edge.destinationLabel}</td>
                  <td className="px-2 py-1.5 font-mono text-slate-400">
                    {edge.gain !== undefined ? `${edge.gain} dB` : '—'}
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleEdge?.(edge.id)}
                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        edge.active
                          ? 'bg-indigo-500/25 text-indigo-300 ring-1 ring-indigo-500/50'
                          : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {edge.active ? 'Active' : 'Idle'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DockablePanel>
  );
}
