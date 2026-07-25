'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

const SIGNAL_COLORS: Record<string, string> = {
  video:    'bg-blue-500/20 text-blue-400',
  audio:    'bg-emerald-500/20 text-emerald-400',
  graphics: 'bg-[#7c6af7]/20 text-[#7c6af7]',
  replay:   'bg-amber-500/20 text-amber-400',
  data:     'bg-[#1e2530] text-[#475569]',
};

export function RoutingZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);
  const routes = workspaceState.routingEngine.getRoutes();

  const handleRemove = (id: number) => {
    workspaceState.removeRoute(id);
    forceRender((n) => n + 1);
  };

  const handleToggle = (id: number) => {
    workspaceState.routingEngine.toggleRoute(id);
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Routing Map
        </h4>
        <span className="text-[9px] text-[#334155]">
          {workspaceState.routingEngine.activeRouteCount}/{routes.length} active
        </span>
      </div>

      {routes.length === 0 ? (
        <p className="text-[10px] text-[#334155]">No routes defined</p>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`flex items-center gap-2 rounded border px-2 py-1.5 transition-colors ${
                route.active
                  ? 'border-[#1e3a5f] bg-[#0d1117]'
                  : 'border-[#1e2530] bg-[#080c12] opacity-50'
              }`}
            >
              <span className="flex-1 truncate text-[10px] text-[#94a3b8]">
                {route.source}
              </span>
              <span className="shrink-0 text-[#334155]">→</span>
              <span className="flex-1 truncate text-[10px] text-[#94a3b8]">
                {route.destination}
              </span>
              {route.signalType && (
                <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase ${SIGNAL_COLORS[route.signalType] ?? SIGNAL_COLORS.data}`}>
                  {route.signalType}
                </span>
              )}
              <button
                type="button"
                onClick={() => handleToggle(route.id)}
                className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold transition-colors ${
                  route.active
                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-[#1e2530] text-[#334155] hover:bg-[#1e3a5f]'
                }`}
              >
                {route.active ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(route.id)}
                className="shrink-0 rounded px-1.5 py-0.5 text-[8px] text-red-400/60 hover:bg-red-500/10 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
