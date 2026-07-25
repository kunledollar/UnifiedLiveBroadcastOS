'use client';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../workspace/workspaceState';
// OutputZone uses workspaceState for routing path display

export function OutputZone({ state }: { state: ProductionState }) {
  // Prefer outputs from current scene via SceneGraphEngine
  const engineScene = workspaceState.sceneGraph.getCurrentScene();
  const sceneOutputs = engineScene
    ? workspaceState.sceneGraph.evaluateScene(engineScene.id)?.outputs ?? []
    : [];

  // Fall back to mock data when no scene is loaded
  const destinations = sceneOutputs.length > 0
    ? sceneOutputs
    : (state.activeOutputCount > 0
        ? [
            { id: 'yt', name: 'YouTube Live',  destination: 'rtmp://yt',     status: 'live'    as const },
            { id: 'fb', name: 'Facebook Live', destination: 'rtmp://fb',     status: 'live'    as const },
            { id: 'tw', name: 'Twitch',        destination: 'rtmp://tw',     status: 'ready'   as const },
          ].slice(0, state.activeOutputCount)
        : []);

  return (
    <div className="output-zone flex h-full w-full flex-col overflow-hidden border-l border-[#1e2530] bg-[#080c12]">
      <header className="border-b border-[#1e2530] px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Output</h3>
      </header>

      <section className="flex-1 overflow-y-auto p-2">
        <p className="mb-2 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Destinations</p>
        {destinations.length > 0
          ? destinations.map((dest) => {
              const isLive = dest.status === 'live';
              return (
                <div key={dest.id} className="mb-1 flex items-center gap-2 rounded bg-[#0d1117] px-2 py-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="flex-1 truncate text-[10px] text-[#475569]">{dest.name}</span>
                  {/* Show routing destinations if any */}
              {(() => {
                const routedTo = workspaceState.routingEngine.getDestinationsForSource(dest.id);
                return routedTo.length > 0
                  ? <span className="max-w-[80px] truncate text-[9px] text-[#7c6af7]">→ {routedTo[0]}</span>
                  : <span className="max-w-[80px] truncate text-[9px] text-[#334155]">{'destination' in dest ? (dest as { destination: string }).destination : ''}</span>;
              })()}
                  <span className={`text-[9px] ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {dest.status ?? 'ready'}
                  </span>
                </div>
              );
            })
          : <p className="text-[10px] text-[#334155]">No active destinations</p>
        }
      </section>

      <footer className="border-t border-[#1e2530] px-3 py-1.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Output Health</p>
        <p className="text-[10px] text-emerald-400">{destinations.length} active · 0 dropped frames</p>
      </footer>
    </div>
  );
}
