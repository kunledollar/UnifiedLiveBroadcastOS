'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
    <div className="space-y-2">
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
      <RenderCauseRanking />
    </div>
  );
}

type Cause = { source: string; sourceType: string; calls: number; identityOnly: number; semantic: number; componentsInvalidated: string[]; callsPerSecond: number };

/** This panel is inert unless the runner enabled diagnostics before hydration. */
function RenderCauseRanking() {
  const [causes, setCauses] = useState<Cause[]>([]);
  useEffect(() => {
    const refresh = () => {
      const diagnostics = window.__UBOS_CONTROL_ROOM_DIAGNOSTICS__ ?? window.__UBOS_RENDER_FORENSICS__;
      if (!diagnostics?.enabled) return;
      const sources = [
        ['stateUpdateSources', 'state'], ['subscriptionSources', 'subscription'], ['rafSources', 'requestAnimationFrame'],
      ] as const;
      const elapsed = Math.max(1, performance.now() / 1000);
      setCauses(sources.flatMap(([key, sourceType]) => Object.entries(diagnostics[key] ?? {}).map(([source, item]) => ({ source, sourceType, calls: item.calls, identityOnly: item.identityOnly, semantic: item.semantic, componentsInvalidated: item.componentsInvalidated, callsPerSecond: item.calls / elapsed }))).sort((a, b) => b.callsPerSecond - a.callsPerSecond).slice(0, 8));
    };
    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!causes.length) return null;
  return <section aria-label="Render Cause Ranking" className="overflow-x-auto border-t border-white/10 pt-1">
    <p className="text-[9px] font-bold uppercase tracking-wider text-ubos-fg-muted">Render Cause Ranking</p>
    <table className="w-full text-left text-[8px]"><thead><tr><th>Source</th><th>Type</th><th>Calls</th><th>Calls/sec</th><th>Components invalidated</th><th>Identity-only</th><th>Semantic</th><th>Likely severity</th></tr></thead><tbody>{causes.map((cause) => <tr key={`${cause.sourceType}:${cause.source}`}><td className="max-w-24 truncate">{cause.source}</td><td>{cause.sourceType}</td><td>{cause.calls}</td><td>{cause.callsPerSecond.toFixed(1)}</td><td>{cause.componentsInvalidated.join(', ') || 'unknown'}</td><td>{cause.identityOnly}</td><td>{cause.semantic}</td><td>{cause.callsPerSecond > 30 ? 'high' : cause.callsPerSecond > 1 ? 'medium' : 'low'}</td></tr>)}</tbody></table>
  </section>;
}
