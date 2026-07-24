'use client';
import type { ProductionState } from '@ubos/shared';

const MOCK_DESTINATIONS = [
  { id: 'yt', label: 'YouTube Live', health: 'healthy' },
  { id: 'fb', label: 'Facebook Live', health: 'healthy' },
  { id: 'tw', label: 'Twitch', health: 'degraded' },
] as const;

export function OutputZone({ state }: { state: ProductionState }) {
  return (
    <div className="output-zone flex h-full w-full flex-col overflow-hidden border-l border-[#1e2530] bg-[#080c12]">
      <header className="border-b border-[#1e2530] px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Output</h3>
      </header>

      {/* Multi-destination previews */}
      <section className="flex-1 overflow-y-auto p-2">
        <p className="mb-2 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Destinations</p>
        {state.activeOutputCount > 0
          ? MOCK_DESTINATIONS.slice(0, state.activeOutputCount).map((dest) => (
              <div key={dest.id} className="mb-1 flex items-center gap-2 rounded bg-[#0d1117] px-2 py-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${dest.health === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="flex-1 truncate text-[10px] text-[#475569]">{dest.label}</span>
                <span className={`text-[9px] ${dest.health === 'healthy' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {dest.health === 'healthy' ? 'Live' : 'Degraded'}
                </span>
              </div>
            ))
          : <p className="text-[10px] text-[#334155]">No active destinations</p>
        }
      </section>

      {/* Output health */}
      <footer className="border-t border-[#1e2530] px-3 py-1.5">
        <p className="text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Output Health</p>
        <p className="text-[10px] text-emerald-400">{state.activeOutputCount} active · 0 dropped frames</p>
      </footer>
    </div>
  );
}
