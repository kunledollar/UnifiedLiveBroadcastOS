'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps { rect: Rect; state: ProductionState; }

export function DockZoneContainer({ rect, state: _ }: ZoneProps) {
  return (
    <div
      data-zone="dock"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="flex flex-col border-r border-[#1e2530] bg-[#080c12]"
    >
      <p className="px-3 pt-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Dock</p>
    </div>
  );
}
