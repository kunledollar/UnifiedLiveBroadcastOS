'use client';
import type { ProductionState } from '@ubos/shared';
export function AiCrewOverlay({ state }: { state: ProductionState }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#7c6af7]/50 bg-[#080c12]/90 p-3 shadow-2xl shadow-[#7c6af7]/20 backdrop-blur-sm">
      <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#7c6af7]">AI Crew</p>
      <p className="text-[10px] text-[#94a3b8]">
        {state.aiAlertLevel === 'high' ? 'Risk detected — operator action required' :
         state.aiAlertLevel === 'idle' ? 'AI monitoring passively' :
         'AI Crew assisting production'}
      </p>
    </div>
  );
}
