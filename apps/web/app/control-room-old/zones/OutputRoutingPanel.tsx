'use client';

/**
 * Output Routing & Destination Panel (Step 102) — the "Routing &
 * Destination Panel" region of Program Output 2.0: routing paths,
 * destination health, and active output count. A compact summary — the
 * full path-by-path toggle/remove control surface stays owned by
 * `RoutingZone` (mounted separately in the Distribution workspace); this
 * reuses the exact same `workspaceState.routingEngine` data, not a second
 * routing engine or a duplicate control surface.
 */
import { workspaceState } from '../workspace/workspaceState';

const SIGNAL_DOT: Record<string, string> = {
  video: 'bg-ubos-selection',
  audio: 'bg-ubos-success',
  graphics: 'bg-ubos-graphics',
  replay: 'bg-ubos-replay',
  data: 'bg-ubos-fg-disabled',
};

export function OutputRoutingPanel({ activeOutputCount }: { activeOutputCount: number }) {
  const routes = workspaceState.routingEngine.getActiveRoutes();
  const bySignal = new Map<string, number>();
  for (const route of routes) {
    const key = route.signalType ?? 'data';
    bySignal.set(key, (bySignal.get(key) ?? 0) + 1);
  }

  return (
    <div className="output-routing-panel space-y-1.5 text-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-ubos-fg-muted">Active routes</span>
        <span className="text-ubos-fg-secondary">
          {workspaceState.routingEngine.activeRouteCount}/{workspaceState.routingEngine.routeCount}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-ubos-fg-muted">Destinations</span>
        <span className="text-ubos-program-text">{activeOutputCount} active</span>
      </div>
      {bySignal.size > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {[...bySignal.entries()].map(([signalType, count]) => (
            <span key={signalType} className="flex items-center gap-1 rounded bg-ubos-midnight px-1.5 py-0.5">
              <span className={`h-1.5 w-1.5 rounded-full ${SIGNAL_DOT[signalType] ?? SIGNAL_DOT.data}`} />
              <span className="text-[9px] uppercase text-ubos-fg-muted">{signalType} · {count}</span>
            </span>
          ))}
        </div>
      )}
      {routes.length === 0 && (
        <p className="text-ubos-fg-muted">No active routes</p>
      )}
    </div>
  );
}
