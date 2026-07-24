'use client';
import type { ProductionState } from '@ubos/shared';

export function AiInsightZone({ state }: { state: ProductionState }) {
  const level = state.aiAlertLevel ?? 'normal';
  return (
    <div className="ai-insight-zone flex h-full w-full flex-col overflow-hidden rounded-lg border border-[#7c6af7]/30 bg-[#080c12] shadow-lg shadow-[#7c6af7]/10">
      <header className="border-b border-[#7c6af7]/20 px-3 py-2">
        <h3 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7c6af7]/70">AI Insights</h3>
      </header>

      {/* AI scene analysis */}
      <section className="border-b border-[#7c6af7]/10 p-3">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#7c6af7]/40]">Scene Analysis</p>
        <p className="text-[10px] text-[#475569]">
          {state.programSceneId ? `Analysing: ${state.programSceneId}` : 'No active scene'}
        </p>
      </section>

      {/* AI automation suggestions */}
      <section className="flex-1 border-b border-[#7c6af7]/10 p-3">
        <p className="mb-2 text-[8px] font-bold uppercase tracking-widest text-[#7c6af7]/40]">Automation Suggestions</p>
        <div className="space-y-1 text-[10px] text-[#334155]">
          <p>• Auto-transition ready</p>
          <p>• Graphics cue available</p>
        </div>
      </section>

      {/* AI risk detection */}
      <section className="p-3">
        <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#7c6af7]/40]">Risk Detection</p>
        <p className={`text-[10px] ${level === 'high' ? 'text-amber-400' : level === 'idle' ? 'text-[#334155]' : 'text-emerald-400'}`}>
          {level === 'high' ? '⚠ High risk — review required' :
           level === 'idle' ? 'Monitoring passively' :
           '✓ No risks detected'}
        </p>
      </section>
    </div>
  );
}
