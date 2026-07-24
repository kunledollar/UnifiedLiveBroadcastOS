'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps { rect: Rect; state: ProductionState; }

export function WorkbenchZoneContainer({ rect, state: _ }: ZoneProps) {
  return (
    <div
      data-zone="workbench"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="flex items-center gap-4 border-t border-[#1e2530] bg-[#080c12] px-4"
    >
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Workbench</p>
    </div>
  );
}
