'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { DestinationType } from '../../distribution-engine/distributionEngine';

const typeColor: Record<DestinationType, string> = {
  rtmp:   'bg-red-500/20 text-red-400',
  srt:    'bg-blue-500/20 text-blue-400',
  webrtc: 'bg-emerald-500/20 text-emerald-400',
  file:   'bg-[#1e2530] text-[#475569]',
  cloud:  'bg-[#7c6af7]/20 text-[#7c6af7]',
  ndi:    'bg-amber-500/20 text-amber-400',
};

export function DistributionZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);
  const engine      = workspaceState.distributionEngine;
  const destinations = engine.getDestinations();
  const lastResults  = engine.getLastResults();

  const handleDistribute = () => {
    workspaceState.distributeOutput();
    forceRender((n) => n + 1);
  };

  const handleToggle = (id: string) => {
    engine.toggleDestination(id);
    forceRender((n) => n + 1);
  };

  const handleRemove = (id: string) => {
    engine.removeDestination(id);
    forceRender((n) => n + 1);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          Distribution
        </h4>
        <span className="text-[9px] text-[#334155]">
          {engine.activeDestinationCount}/{engine.destinationCount} active · {engine.totalFramesSent} frames
        </span>
      </div>

      {/* Send button */}
      <button
        type="button"
        onClick={handleDistribute}
        className="mb-3 w-full rounded bg-red-500/15 py-2 text-[9px] font-bold uppercase tracking-wide text-red-400 hover:bg-red-500/25"
      >
        ▶ Send Program Output
      </button>

      {/* Destinations */}
      <div className="mb-3 flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {destinations.length === 0 ? (
          <p className="text-[10px] text-[#334155]">No destinations registered</p>
        ) : (
          destinations.map((dest) => {
            const result = lastResults.find((r) => r.id === dest.id);
            return (
              <div
                key={dest.id}
                className={`flex items-center gap-2 rounded border px-2 py-1.5 ${
                  dest.active ? 'border-[#1e3a5f] bg-[#0d1117]' : 'border-[#1e2530] bg-[#080c12] opacity-50'
                }`}
              >
                <span className={`shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase ${typeColor[dest.type]}`}>
                  {dest.type}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-medium text-[#94a3b8]">{dest.name}</p>
                  <p className="truncate text-[8px] text-[#334155]">{dest.endpoint}</p>
                </div>
                {result && (
                  <span className={`shrink-0 text-[9px] font-bold ${result.status === 'sent' ? 'text-emerald-400' : result.status === 'skipped' ? 'text-[#334155]' : 'text-red-400'}`}>
                    {result.status}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleToggle(dest.id)}
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${dest.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#1e2530] text-[#334155]'}`}
                >
                  {dest.active ? 'On' : 'Off'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(dest.id)}
                  className="shrink-0 text-[8px] text-red-400/50 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
