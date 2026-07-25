'use client';

import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { InsightType } from '../../ai-crew-engine/aiCrewEngine';

// UBDS color semantics (Step 92): insight categories map to the broadcast
// hue that owns that meaning — scene selection (Active Blue), graphics
// (Graphics Cyan), replay (Replay Orange), automation (Automation Purple),
// and Program Output (Program Red). Categories with no dedicated broadcast
// hue (audio, routing, moderation, system) use the existing non-hue
// semantic tokens (success/offline/error) rather than borrowing a hue that
// already carries a different meaning.
const typeColor: Record<InsightType, string> = {
  scene:      'bg-ubos-selection-muted text-ubos-selection-text',
  graphics:   'bg-ubos-graphics-muted text-ubos-graphics-text',
  replay:     'bg-ubos-replay-muted text-ubos-replay-text',
  audio:      'bg-ubos-success-muted text-ubos-success-text',
  routing:    'bg-ubos-offline-muted text-ubos-offline-text',
  output:     'bg-ubos-program-muted text-ubos-program-text',
  moderation: 'bg-ubos-error-muted text-ubos-error-text',
  automation: 'bg-ubos-automation-muted text-ubos-automation-text',
  system:     'bg-ubos-carbon text-ubos-fg-muted',
};

// Warning Yellow = predicted risk; critical escalates to the error/critical
// tone with the pulse motion primitive (continuous urgency, same as LIVE/REC).
const severityDot: Record<string, string> = {
  info:     'bg-ubos-fg-muted',
  warning:  'bg-ubos-warning',
  critical: 'bg-ubos-error animate-ubos-tally-pulse',
};

export function AiInspector({ state }: { state: ProductionState }) {
  // Run a full AI analysis pass
  workspaceState.updateAiCrew();
  const insights = workspaceState.aiCrewEngine.getInsights();
  const level    = state.aiAlertLevel ?? 'normal';

  return (
    <div className="ai-inspector rounded-lg border border-ubos-automation-border/50 bg-ubos-graphite p-3">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-ubos-automation-text/80">AI Crew Insights</h4>
        <div className="flex items-center gap-2">
          {workspaceState.aiCrewEngine.hasCritical && (
            <span className="rounded bg-ubos-error-muted px-1.5 py-0.5 text-[8px] font-bold uppercase text-ubos-error-text">
              Critical
            </span>
          )}
          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
            level === 'high'   ? 'bg-ubos-warning-muted text-ubos-warning-text' :
            level === 'idle'   ? 'bg-ubos-carbon text-ubos-fg-muted'   :
            'bg-ubos-preview-muted text-ubos-preview-text'
          }`}>
            {level}
          </span>
        </div>
      </div>

      {insights.length === 0 ? (
        <p className="text-[10px] text-ubos-fg-muted">No insights yet — AI Crew is observing</p>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {[...insights].reverse().map((insight) => (
            <div key={insight.id} className="flex items-start gap-2 rounded bg-ubos-midnight px-2 py-1.5">
              <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[insight.severity]}`} />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span className={`rounded px-1 py-0.5 text-[8px] font-bold uppercase ${typeColor[insight.type]}`}>
                    {insight.type}
                  </span>
                </div>
                <p className="text-[10px] text-ubos-fg-secondary">{insight.message}</p>
                {insight.suggestion && (
                  <p className="mt-0.5 text-[9px] text-ubos-automation-text/80">→ {insight.suggestion}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
