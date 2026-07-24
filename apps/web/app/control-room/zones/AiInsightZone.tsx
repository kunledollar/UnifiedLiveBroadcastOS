'use client';
import type { ProductionState } from '@ubos/shared';
export function AiInsightZone({ state }: { state: ProductionState }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#7c6af7]/30 bg-[#7c6af7]/5 p-3 shadow-lg shadow-[#7c6af7]/10">
      <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#7c6af7]/70">AI Insight</p>
      {state.aiAlertLevel === 'high' && (
        <p className="text-[10px] font-semibold text-amber-400">⚠ High alert — review AI recommendations</p>
      )}
      {state.aiAlertLevel !== 'high' && (
        <p className="text-[11px] text-[#475569]">AI Crew active — monitoring production</p>
      )}
    </div>
  );
}
