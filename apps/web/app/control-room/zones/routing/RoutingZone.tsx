'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';

// UBDS color semantics (Step 92): signal-type badges map to the broadcast
// hue that owns that meaning; types without a dedicated hue (video, data)
// use the non-hue semantic tokens (selection/offline) rather than
// borrowing a hue that already carries a different meaning.
const SIGNAL_COLORS: Record<string, string> = {
  video:    'bg-ubos-selection-muted text-ubos-selection-text',
  audio:    'bg-ubos-success-muted text-ubos-success-text',
  graphics: 'bg-ubos-graphics-muted text-ubos-graphics-text',
  replay:   'bg-ubos-replay-muted text-ubos-replay-text',
  data:     'bg-ubos-carbon text-ubos-fg-muted',
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
    <div className="flex h-full w-full flex-col overflow-hidden bg-ubos-carbon p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-ubos-fg-muted">
          Routing Map
        </h4>
        <span className="text-[9px] text-ubos-fg-muted">
          {workspaceState.routingEngine.activeRouteCount}/{routes.length} active
        </span>
      </div>

      {routes.length === 0 ? (
        <p className="text-[10px] text-ubos-fg-muted">No routes defined</p>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {routes.map((route) => (
            <div
              key={route.id}
              className={`flex items-center gap-2 rounded border px-2 py-1.5 transition-colors ${
                route.active
                  ? 'border-ubos-border bg-ubos-graphite'
                  : 'border-ubos-border-subtle bg-ubos-carbon opacity-50'
              }`}
            >
              <span className="flex-1 truncate text-[10px] text-ubos-fg-secondary">
                {route.source}
              </span>
              <span className="shrink-0 text-ubos-fg-muted">→</span>
              <span className="flex-1 truncate text-[10px] text-ubos-fg-secondary">
                {route.destination}
              </span>
              {route.signalType && (
                <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase ${SIGNAL_COLORS[route.signalType] ?? SIGNAL_COLORS.data}`}>
                  {route.signalType}
                </span>
              )}
              {/* Program Red = live routing: an active route is carrying a live signal. */}
              <button
                type="button"
                onClick={() => handleToggle(route.id)}
                className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold transition-colors ${
                  route.active
                    ? 'bg-ubos-program-muted text-ubos-program-text hover:bg-ubos-program/25'
                    : 'bg-ubos-midnight text-ubos-fg-muted hover:bg-ubos-slate'
                }`}
              >
                {route.active ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(route.id)}
                className="shrink-0 rounded px-1.5 py-0.5 text-[8px] text-ubos-error-text/60 hover:bg-ubos-error-muted hover:text-ubos-error-text"
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
