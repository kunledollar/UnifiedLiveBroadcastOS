'use client';

import type { ProductionState } from '@ubos/shared';

export function AiInspector({ state }: { state: ProductionState }) {
  const { aiInsights, aiAlertLevel } = state;
  const level = aiAlertLevel ?? 'normal';

  return (
    <div className="ai-inspector rounded-lg border border-[#7c6af7]/30 bg-[#0d1117] p-3">
      <h4 className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#7c6af7]/70]">AI Insights</h4>

      <div className="ai-alert mb-3 flex items-center gap-2 text-[10px]">
        <span className="text-[#334155]">Alert Level</span>
        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
          level === 'high'   ? 'bg-amber-500/20 text-amber-400' :
          level === 'idle'   ? 'bg-[#1e2530] text-[#334155]'   :
          'bg-emerald-500/10 text-emerald-400'
        }`}>
          {level}
        </span>
      </div>

      <div className="ai-insight-list space-y-1">
        {aiInsights && aiInsights.length > 0 ? (
          aiInsights.map((insight) => (
            <div key={insight.id} className="ai-insight-item rounded bg-[#0a1628] px-2.5 py-2">
              <span className="mr-2 text-[8px] font-bold uppercase text-[#7c6af7]">{insight.type}</span>
              <span className="text-[10px] text-[#94a3b8]">{insight.message}</span>
            </div>
          ))
        ) : (
          <div className="text-[10px] text-[#334155]">No AI insights available</div>
        )}
      </div>
    </div>
  );
}
