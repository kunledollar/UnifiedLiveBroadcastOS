'use client';

import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { InsightType } from '../../ai-crew-engine/aiCrewEngine';

const typeColor: Record<InsightType, string> = {
  scene:      'bg-blue-500/20 text-blue-400',
  graphics:   'bg-[#7c6af7]/20 text-[#7c6af7]',
  replay:     'bg-amber-500/20 text-amber-400',
  audio:      'bg-emerald-500/20 text-emerald-400',
  routing:    'bg-cyan-500/20 text-cyan-400',
  output:     'bg-orange-500/20 text-orange-400',
  moderation: 'bg-red-500/20 text-red-400',
  automation: 'bg-fuchsia-500/20 text-fuchsia-400',
  system:     'bg-[#1e2530] text-[#475569]',
};

const severityDot: Record<string, string> = {
  info:     'bg-[#334155]',
  warning:  'bg-amber-400',
  critical: 'bg-red-500 animate-pulse',
};

export function AiInspector({ state }: { state: ProductionState }) {
  // Run a full AI analysis pass
  workspaceState.updateAiCrew();
  const insights = workspaceState.aiCrewEngine.getInsights();
  const level    = state.aiAlertLevel ?? 'normal';

  return (
    <div className="ai-inspector rounded-lg border border-[#7c6af7]/30 bg-[#0d1117] p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#7c6af7]/70">AI Crew Insights</h4>
        <div className="flex items-center gap-2">
          {workspaceState.aiCrewEngine.hasCritical && (
            <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-red-400">
              Critical
            </span>
          )}
          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
            level === 'high'   ? 'bg-amber-500/20 text-amber-400' :
            level === 'idle'   ? 'bg-[#1e2530] text-[#334155]'   :
            'bg-emerald-500/10 text-emerald-400'
          }`}>
            {level}
          </span>
        </div>
      </div>

      {insights.length === 0 ? (
        <p className="text-[10px] text-[#334155]">No insights yet — AI Crew is observing</p>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {[...insights].reverse().map((insight) => (
            <div key={insight.id} className="flex items-start gap-2 rounded bg-[#0a1628] px-2 py-1.5">
              <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[insight.severity]}`} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className={`rounded px-1 py-0.5 text-[8px] font-bold uppercase ${typeColor[insight.type]}`}>
                    {insight.type}
                  </span>
                </div>
                <p className="text-[10px] text-[#94a3b8]">{insight.message}</p>
                {insight.suggestion && (
                  <p className="mt-0.5 text-[9px] text-[#7c6af7]/70">→ {insight.suggestion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
