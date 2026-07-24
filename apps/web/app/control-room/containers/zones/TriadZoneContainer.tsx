'use client';
import type { Rect, ProductionState } from '@ubos/shared';

interface ZoneProps { rect: Rect; state: ProductionState; }

export function TriadZoneContainer({ rect, state: _ }: ZoneProps) {
  return (
    <div
      data-zone="triad"
      style={{ position: 'absolute', left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      className="grid grid-cols-3 gap-2 overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#0a1628] p-2"
    >
      {['Program', 'Preview', 'Confidence'].map((label) => (
        <div key={label} className="flex flex-col items-center justify-center rounded border border-[#1e3a5f] bg-black text-[10px] font-bold uppercase tracking-widest text-[#475569]">
          {label}
        </div>
      ))}
    </div>
  );
}
