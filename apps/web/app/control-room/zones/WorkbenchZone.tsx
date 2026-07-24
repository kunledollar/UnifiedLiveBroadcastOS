'use client';
import type { ProductionState } from '@ubos/shared';
export function WorkbenchZone({ state: _ }: { state: ProductionState }) {
  return (
    <div className="flex h-full w-full items-center gap-4 border-t border-[#1e2530] bg-[#080c12] px-4">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Workbench</p>
    </div>
  );
}
