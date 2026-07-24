'use client';
import type { ProductionState } from '@ubos/shared';

export function AiCrewOverlay({ state }: { state: ProductionState }) {
  const level = state.aiAlertLevel ?? 'normal';
  return (
    <div className="ai-crew-overlay flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#7c6af7]/50 bg-[#080c12]/90 shadow-2xl shadow-[#7c6af7]/20 backdrop-blur-sm">
      <header className="border-b border-[#7c6af7]/30 px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7c6af7]">AI Crew</h3>
      </header>

      {/* AI overlay annotations */}
      <section className="border-b border-[#7c6af7]/20 p-3">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#7c6af7]/50]">Annotations</p>
        <p className="text-[10px] text-[#94a3b8]">Scene overlays active</p>
      </section>

      {/* AI timeline predictions */}
      <section className="flex-1 border-b border-[#7c6af7]/20 p-3">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#7c6af7]/50]">Timeline Predictions</p>
        <div className="space-y-1 text-[10px] text-[#475569]">
          <p>• Next cue in ~00:45</p>
          <p>• Segment end in ~03:20</p>
        </div>
      </section>

      {/* AI operator guidance */}
      <section className="p-3">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#7c6af7]/50]">Operator Guidance</p>
        <p className={`text-[10px] ${level === 'high' ? 'font-semibold text-amber-400' : 'text-[#94a3b8]'}`}>
          {level === 'high' ? '⚠ Action required — review risk queue' :
           level === 'idle' ? 'AI crew standing by' :
           'AI crew assisting production'}
        </p>
      </section>
    </div>
  );
}
