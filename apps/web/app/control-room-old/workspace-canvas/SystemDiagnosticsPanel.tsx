'use client';

import { DockablePanel } from './DockablePanel';

export type DiagnosticMetric = {
  label: string;
  value: string;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
};

export function SystemDiagnosticsPanel({
  metrics,
  collapsed,
  undocked,
  onToggleCollapse,
  onToggleUndock,
}: {
  metrics: DiagnosticMetric[];
  collapsed: boolean;
  undocked?: boolean;
  onToggleCollapse: () => void;
  onToggleUndock: () => void;
}) {
  const statusColor = (status?: DiagnosticMetric['status']) => {
    switch (status) {
      case 'good':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <DockablePanel
      title="System Diagnostics"
      subtitle="Runtime health"
      collapsed={collapsed}
      undocked={undocked ?? false}
      onToggleCollapse={onToggleCollapse}
      onToggleUndock={onToggleUndock}
      compactHeader
    >
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-white/6 bg-[#070b12] p-2"
          >
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
            <p className={`truncate font-mono text-xs font-bold ${statusColor(metric.status)}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </DockablePanel>
  );
}
