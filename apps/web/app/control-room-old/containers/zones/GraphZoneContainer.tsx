'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps { rect: Rect; state: ProductionState; }

export function GraphZoneContainer({ rect, state: _ }: ZoneProps) {
  return (
    <div
      data-zone="graph"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="flex flex-col overflow-hidden rounded-lg border border-[#1e2530] bg-[#080c12] p-3"
    >
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Graph Zone</p>
      <div className="flex flex-1 items-center justify-center text-[11px] text-[#334155]">
        Production graph visualization
      </div>
    </div>
  );
}
