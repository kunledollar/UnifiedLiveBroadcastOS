'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../workspace/workspaceState';

function HealthRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-[#334155]">{label}</span>
      <span className={warn ? 'text-amber-400' : 'text-emerald-400'}>{value}</span>
    </div>
  );
}

export function OutputZone({ state }: { state: ProductionState }) {
  const [, forceRender] = useState(0);

  // Compose a fresh output frame on render
  workspaceState.updateOutput();
  const frame  = workspaceState.outputEngine.composeFrame();
  const health = workspaceState.outputEngine.health();

  const videoKeys    = Object.keys(frame.video);
  const graphicCount = frame.graphics.length;
  const audioCount   = frame.audio.length;

  return (
    <div className="output-zone flex h-full w-full flex-col overflow-hidden border-l border-[#1e2530] bg-[#080c12]">
      <header className="flex items-center justify-between border-b border-[#1e2530] px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Program Output
        </h3>
        <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${health.healthy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
          {health.healthy ? 'Healthy' : 'Degraded'}
        </span>
      </header>

      {/* Composition status */}
      <section className="border-b border-[#1e2530] p-3">
        <p className="mb-2 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Frame Composition</p>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-[#334155]">Video sources</span>
            <span className="text-[#94a3b8]">{videoKeys.length > 0 ? videoKeys.join(', ') : 'none'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#334155]">Graphics layers</span>
            <span className="text-[#94a3b8]">{graphicCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#334155]">Audio channels</span>
            <span className="text-[#94a3b8]">{audioCount}</span>
          </div>
        </div>
      </section>

      {/* Output health */}
      <section className="flex-1 p-3">
        <p className="mb-2 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Output Health</p>
        <div className="space-y-1.5">
          <HealthRow label="Dropped frames" value={String(health.droppedFrames)} warn={health.droppedFrames > 0} />
          <HealthRow label="Latency" value={`${health.latency.toFixed(1)} ms`} warn={health.latency > 16} />
          <HealthRow label="Audio peak" value={health.audioPeak.toFixed(2)} warn={health.audioPeak > 0.9} />
          <HealthRow label="Audio RMS"  value={health.audioRms.toFixed(2)} />
        </div>

        {/* Routing context — destinations routed to program */}
        {(() => {
          const routed = workspaceState.routingEngine.getSourcesForDestination('program');
          return routed.length > 0 ? (
            <div className="mt-3">
              <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Routed Sources</p>
              {routed.map((src) => (
                <div key={src} className="flex items-center gap-2 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7c6af7]" />
                  <span className="text-[#94a3b8]">{src} → program</span>
                </div>
              ))}
            </div>
          ) : null;
        })()}
      </section>

      {/* Destinations */}
      <footer className="border-t border-[#1e2530] px-3 py-2">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#1e2530]">Destinations</p>
        {state.activeOutputCount > 0 ? (
          <p className="text-[10px] text-emerald-400">{state.activeOutputCount} active · {health.droppedFrames} dropped</p>
        ) : (
          <p className="text-[10px] text-[#334155]">No active destinations</p>
        )}
        <button
          type="button"
          onClick={() => { workspaceState.updateOutput(); forceRender((n) => n + 1); }}
          className="mt-1.5 w-full rounded bg-[#0a1628] py-1 text-[8px] text-[#334155] hover:bg-[#1e2530] hover:text-[#475569]"
        >
          ↻ Refresh output
        </button>
      </footer>
    </div>
  );
}
