'use client';
import type { ProductionState } from '@ubos/shared';
export function TriadZone({ state: _ }: { state: ProductionState }) {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-1 overflow-hidden rounded-lg">
      <div className="flex items-center justify-center rounded border border-red-500/40 bg-[#0a1628] text-[11px] font-bold uppercase tracking-widest text-red-300">PROGRAM</div>
      <div className="flex items-center justify-center rounded border border-emerald-500/40 bg-[#0a1628] text-[11px] font-bold uppercase tracking-widest text-emerald-300">PREVIEW</div>
    </div>
  );
}
