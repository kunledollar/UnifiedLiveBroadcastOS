'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps { rect: Rect; state: ProductionState; }

export function InspectorZoneContainer({ rect, state: _ }: ZoneProps) {
  return (
    <div
      data-zone="inspector"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="flex flex-col overflow-hidden border-l border-[#1e2530] bg-[#080c12] p-3"
    >
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Inspector</p>
      <p className="text-[11px] text-[#475569]">Select a source, scene, or pipeline item to inspect.</p>
    </div>
  );
}
