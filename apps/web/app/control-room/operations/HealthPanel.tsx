'use client';

import { ConsoleSection, InspectorRow, StatusBadge } from '@ubos/ui';
import type { StreamHealthMetric } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';

function metricVariant(status: StreamHealthMetric['status']) {
  switch (status) {
    case 'good':
      return 'success' as const;
    case 'warning':
      return 'warning' as const;
    case 'critical':
      return 'error' as const;
    default:
      return 'neutral' as const;
  }
}

export function HealthPanel({
  streamMetrics = [],
  runtimeStatus,
  recoveryStatus,
  commandCount,
  eventCount,
  activeLocks,
  conflicts,
  warnings = [],
  unavailableSubsystems = [],
}: {
  streamMetrics?: StreamHealthMetric[];
  runtimeStatus: string;
  recoveryStatus: string;
  commandCount: number;
  eventCount: number;
  activeLocks: number;
  conflicts: number;
  warnings?: string[];
  unavailableSubsystems?: string[];
}) {
  return (
    <OperationsPanel title="Health">
      <ConsoleSection title="Production Runtime">
        <InspectorRow
          label="Runtime"
          value={<StatusBadge variant="neutral">{runtimeStatus}</StatusBadge>}
        />
        <InspectorRow
          label="Recovery"
          value={<StatusBadge variant="neutral">{recoveryStatus}</StatusBadge>}
        />
        <InspectorRow label="Commands" value={String(commandCount)} />
        <InspectorRow label="Events" value={String(eventCount)} />
        <InspectorRow
          label="Active locks"
          value={
            activeLocks ? (
              <StatusBadge variant="warning">{activeLocks}</StatusBadge>
            ) : (
              <StatusBadge variant="success">0</StatusBadge>
            )
          }
        />
        <InspectorRow
          label="Conflicts"
          value={
            conflicts ? (
              <StatusBadge variant="warning">{conflicts}</StatusBadge>
            ) : (
              <StatusBadge variant="success">0</StatusBadge>
            )
          }
        />
        <InspectorRow
          label="Warnings"
          value={
            warnings.length ? (
              <StatusBadge variant="warning">{warnings.length}</StatusBadge>
            ) : (
              <StatusBadge variant="success">None</StatusBadge>
            )
          }
        />
      </ConsoleSection>

      {unavailableSubsystems.length ? (
        <ConsoleSection title="Unavailable Subsystems">
          <div className="flex flex-wrap gap-1">
            {unavailableSubsystems.map((item) => (
              <StatusBadge key={item} variant="offline">
                {item}
              </StatusBadge>
            ))}
          </div>
        </ConsoleSection>
      ) : null}

      <ConsoleSection title="Stream Metrics">
        {streamMetrics.length ? (
          streamMetrics.map((metric) => (
            <InspectorRow
              key={metric.id}
              label={metric.label}
              value={
                <StatusBadge variant={metricVariant(metric.status)}>{metric.value}</StatusBadge>
              }
            />
          ))
        ) : (
          <p className="text-ubos-caption text-ubos-fg-muted">No runtime metrics available.</p>
        )}
      </ConsoleSection>
    </OperationsPanel>
  );
}
