'use client';
import type { ProductionState } from '@ubos/shared';
export function SceneZone({ state }: { state: ProductionState }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#0a1628]">
      <div className="px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">Scene</div>
      <div className="flex-1 overflow-auto p-2 text-[11px] text-[#475569]">
        {state.programSceneId ? `Program: ${state.programSceneId}` : 'No scene active'}
      </div>
    </div>
  );
}
