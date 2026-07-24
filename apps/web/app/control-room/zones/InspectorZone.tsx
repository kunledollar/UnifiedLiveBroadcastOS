'use client';
import type { ProductionState } from '@ubos/shared';
export function InspectorZone({ state: _ }: { state: ProductionState }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-l border-[#1e2530] bg-[#080c12] p-3">
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Inspector</p>
      <p className="text-[11px] text-[#475569]">Select a zone item to inspect.</p>
    </div>
  );
}
