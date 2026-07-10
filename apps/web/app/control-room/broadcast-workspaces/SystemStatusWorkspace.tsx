'use client';

import { useMemo } from 'react';
import { selectHealthSummary, type ProductionGraph } from '@ubos/shared';
import { cn } from '@ubos/ui';
import type { DiagnosticMetric } from '../workspace-canvas/SystemDiagnosticsPanel';

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

function metricStatusFromHealth(
  status?: 'good' | 'warning' | 'critical',
): NonNullable<DiagnosticMetric['status']> {
  if (status === 'good') return 'good';
  if (status === 'warning') return 'warning';
  if (status === 'critical') return 'critical';
  return 'neutral';
}

export function buildSystemStatusMetrics(input: {
  fps: string;
  cpu: string;
  dropped: string;
  upload: string;
  recordingState: string;
  streamingLifecycle: string;
  activeRouteCount: number;
  graph: ProductionGraph;
  pipelineHealth?: string;
}): DiagnosticMetric[] {
  const health = selectHealthSummary(input.graph);
  const graphMetrics = health.metrics;

  const ram =
    graphMetrics.ram?.value ??
    graphMetrics.memory?.value ??
    graphMetrics.mem?.value ??
    'unavailable';

  const network =
    graphMetrics.network?.value ??
    graphMetrics.bandwidth?.value ??
    input.upload;

  return [
    { label: 'CPU', value: String(input.cpu), status: 'neutral' },
    { label: 'RAM', value: String(ram), status: metricStatusFromHealth(graphMetrics.ram?.status ?? graphMetrics.memory?.status) },
    { label: 'Network', value: String(network), status: 'neutral' },
    { label: 'FPS', value: String(input.fps), status: 'neutral' },
    { label: 'Dropped Frames', value: String(input.dropped), status: 'neutral' },
    {
      label: 'Recording',
      value: input.recordingState,
      status: input.recordingState === 'recording' ? 'warning' : 'neutral',
    },
    {
      label: 'Streaming',
      value: input.streamingLifecycle,
      status: input.streamingLifecycle === 'streaming' ? 'good' : 'neutral',
    },
    {
      label: 'Pipeline',
      value: input.pipelineHealth ?? health.status,
      status: metricStatusFromHealth(health.status),
    },
    {
      label: 'Graph Rev',
      value: String(input.graph.metadata.revision),
      status: 'good',
    },
    {
      label: 'Routes',
      value: `${input.activeRouteCount} active`,
      status: input.activeRouteCount > 0 ? 'good' : 'neutral',
    },
  ];
}

export function SystemStatusWorkspace({
  metrics,
  className,
}: {
  metrics: DiagnosticMetric[];
  className?: string;
}) {
  const grouped = useMemo(() => {
    const primary = metrics.slice(0, 6);
    const secondary = metrics.slice(6);
    return { primary, secondary };
  }, [metrics]);

  return (
    <div className={cn('p-2', className)}>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
        {grouped.primary.map((metric) => (
          <div
            key={metric.label}
            className="rounded-ubos-sm border border-white/6 bg-[#070b12] p-2"
          >
            <p className="text-[9px] uppercase tracking-[0.12em] text-ubos-fg-muted">
              {metric.label}
            </p>
            <p className={cn('truncate font-mono text-[11px] font-bold', statusColor(metric.status))}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
      {grouped.secondary.length ? (
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {grouped.secondary.map((metric) => (
            <div
              key={metric.label}
              className="rounded-ubos-sm border border-white/6 bg-ubos-midnight/80 px-2 py-1.5"
            >
              <p className="text-[9px] uppercase text-ubos-fg-muted">{metric.label}</p>
              <p className={cn('truncate font-mono text-[10px] font-bold', statusColor(metric.status))}>
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
