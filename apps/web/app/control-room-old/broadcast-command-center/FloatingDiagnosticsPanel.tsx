'use client';

import type { ReactNode } from 'react';
import type { DiagnosticMetric } from '../workspace-canvas/SystemDiagnosticsPanel';
import { cn } from '@ubos/ui';
import { BroadcastPanelShell } from './BroadcastPanelShell';

function statusColor(status?: DiagnosticMetric['status']) {
  switch (status) {
    case 'good':
      return 'text-emerald-400';
    case 'warning':
      return 'text-amber-400';
    case 'critical':
      return 'text-red-400';
    default:
      return 'text-ubos-fg-secondary';
  }
}

export function FloatingDiagnosticsPanel({
  metrics,
  embedded = false,
  className,
  onClose,
}: {
  metrics: DiagnosticMetric[];
  embedded?: boolean;
  className?: string;
  onClose?: () => void;
}) {
  const content = (
    <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-ubos-sm border border-white/6 bg-[#070b12] p-1.5"
        >
          <p className="text-[9px] uppercase tracking-[0.12em] text-ubos-fg-muted">{metric.label}</p>
          <p className={cn('truncate font-mono text-[11px] font-bold', statusColor(metric.status))}>
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );

  if (embedded) {
    return (
      <BroadcastPanelShell
        title="System Status"
        subtitle="Runtime diagnostics"
        accent="telemetry"
        {...(className ? { className } : {})}
        headerActions={
          onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded px-1 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
              aria-label="Close diagnostics panel"
            >
              ✕
            </button>
          ) : null
        }
      >
        {content}
      </BroadcastPanelShell>
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-auto fixed bottom-24 right-4 z-40 w-72 shadow-2xl',
        className,
      )}
    >
      <BroadcastPanelShell
        title="System Status"
        subtitle="Floating diagnostics"
        accent="telemetry"
        headerActions={
          onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded px-1 text-[10px] text-ubos-fg-muted hover:bg-ubos-graphite"
              aria-label="Close diagnostics panel"
            >
              ✕
            </button>
          ) : null
        }
      >
        {content}
      </BroadcastPanelShell>
    </div>
  );
}

export function DiagnosticsSummary({ metrics }: { metrics: DiagnosticMetric[] }) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {metrics.slice(0, 4).map((metric) => (
        <div key={metric.label} className="rounded bg-ubos-midnight px-1.5 py-1">
          <p className="text-[9px] uppercase text-ubos-fg-muted">{metric.label}</p>
          <p className={cn('font-mono text-[10px] font-bold', statusColor(metric.status))}>
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}
