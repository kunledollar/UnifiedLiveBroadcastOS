'use client';

import { useState } from 'react';
import type { ProductionState } from '@ubos/shared';
import { workspaceState } from '../../workspace/workspaceState';
import type { HealthSubsystem, HealthStatus } from '../../health-engine/healthEngine';

const statusColor: Record<HealthStatus, string> = {
  ok:      'text-emerald-400',
  warning: 'text-amber-400',
  error:   'text-red-400',
  unknown: 'text-[#334155]',
};

const statusDot: Record<HealthStatus, string> = {
  ok:      'bg-emerald-400',
  warning: 'bg-amber-400 animate-pulse',
  error:   'bg-red-500 animate-pulse',
  unknown: 'bg-[#334155]',
};

const SUBSYSTEMS: HealthSubsystem[] = [
  'scene', 'graphics', 'replay', 'routing',
  'audio', 'automation', 'output', 'ai',
];

export function HealthZone({ state: _ }: { state: ProductionState }) {
  const [, forceRender] = useState(0);

  const handleRefresh = () => {
    workspaceState.updateHealth();
    forceRender((n) => n + 1);
  };

  // Update health on every render
  workspaceState.updateHealth();
  const health  = workspaceState.healthEngine.getHealth();
  const metrics = workspaceState.healthEngine.getMetrics();
  const summary = workspaceState.healthEngine.getSummary();
  const worst   = workspaceState.healthEngine.worstStatus;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080c12] p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[9px] font-black uppercase tracking-[0.18em] text-[#334155]">
          System Health
        </h4>
        <div className="flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
            worst === 'error'   ? 'bg-red-500/20 text-red-400' :
            worst === 'warning' ? 'bg-amber-500/20 text-amber-400' :
            'bg-emerald-500/15 text-emerald-400'
          }`}>
            {worst === 'unknown' ? 'Initializing' : worst.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Summary row */}
      <div className="mb-3 flex gap-3 text-[9px]">
        <span className="text-emerald-400">{summary.ok} ok</span>
        {summary.warning > 0 && <span className="text-amber-400">{summary.warning} warn</span>}
        {summary.error   > 0 && <span className="text-red-400">{summary.error} err</span>}
        {summary.unknown > 0 && <span className="text-[#334155]">{summary.unknown} init</span>}
      </div>

      {/* Subsystem list */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
        {SUBSYSTEMS.map((key) => {
          const status = health[key];
          const metric = metrics[key];
          return (
            <div key={key} className="flex items-center gap-2 rounded border border-[#1e2530] bg-[#0d1117] px-2 py-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[status]}`} />
              <span className="w-20 shrink-0 text-[10px] font-medium text-[#94a3b8] capitalize">{key}</span>
              <span className={`flex-1 truncate text-[9px] ${statusColor[status]}`}>
                {status === 'unknown' ? 'Initializing…' : status}
              </span>
              {metric?.value !== undefined && (
                <span className="max-w-[120px] truncate text-[9px] text-[#334155]">{String(metric.value)}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Orchestration stats */}
      {workspaceState.orchestrationEngine && (
        <div className="mt-2 border-t border-[#1e2530] pt-2 text-[8px] text-[#334155]">
          {(() => {
            const stats = workspaceState.orchestrationEngine!.getStats();
            return (
              <div className="flex justify-between">
                <span>Ticks: {stats.tickCount}</span>
                <span>Last: {stats.lastTickMs.toFixed(1)} ms</span>
                <span>Avg: {stats.avgTickDurationMs.toFixed(1)} ms</span>
              </div>
            );
          })()}
        </div>
      )}

      <button
        type="button"
        onClick={handleRefresh}
        className="mt-2 w-full rounded bg-[#0a1628] py-1 text-[8px] text-[#334155] hover:bg-[#1e2530] hover:text-[#475569]"
      >
        ↻ Refresh health
      </button>
    </div>
  );
}
