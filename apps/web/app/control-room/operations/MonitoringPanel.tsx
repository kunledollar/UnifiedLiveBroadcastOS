import { createMetric, createMonitoringRuntime } from '@ubos/shared';
import { BroadcastPanel, StatusBadge } from '@ubos/ui';

const runtime = createMonitoringRuntime();
runtime.dispatch({
  id: 'demo-cpu',
  type: 'recordMetric',
  metric: createMetric('CPU', 42, 'Production Engine', '%'),
});
runtime.dispatch({
  id: 'demo-gpu',
  type: 'recordMetric',
  metric: createMetric('GPU', 67, 'GPU', '%'),
});
runtime.dispatch({
  id: 'demo-latency',
  type: 'recordMetric',
  metric: createMetric('Latency', 88, 'Distribution', 'ms'),
});
const dashboard = runtime.dashboard();

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-ubos-fg-muted">{label}</span>
      <span className="text-ubos-fg-primary">{value}</span>
    </div>
  );
}

export function MonitoringPanel() {
  const activeAlerts = dashboard.snapshot.alerts.filter((alert) => alert.status !== 'resolved');
  return (
    <div className="space-y-ubos-2">
      <BroadcastPanel>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Overall Health</h3>
          <StatusBadge variant={dashboard.status.status === 'healthy' ? 'success' : 'warning'}>
            {dashboard.status.status}
          </StatusBadge>
        </div>
        <Row label="Subsystems" value={dashboard.snapshot.statistics.subsystemCount} />
        <Row
          label="Live Metrics"
          value={`${dashboard.snapshot.statistics.metricCount} metadata samples`}
        />
        <Row label="Notifications" value={dashboard.snapshot.statistics.notificationCount} />
      </BroadcastPanel>
      <BroadcastPanel>
        <h3 className="mb-2 font-semibold">Subsystem Grid</h3>
        <div className="grid grid-cols-2 gap-1 text-xs text-ubos-fg-muted">
          {Object.entries(dashboard.status.subsystemStatuses)
            .slice(0, 12)
            .map(([name, status]) => (
              <span key={name}>
                {name}: {status}
              </span>
            ))}
        </div>
      </BroadcastPanel>
      <BroadcastPanel>
        <h3 className="mb-2 font-semibold">Performance Charts</h3>
        {Object.entries(runtime.aggregateMetrics()).map(([name, value]) => (
          <Row key={name} label={name} value={value.toFixed(1)} />
        ))}
      </BroadcastPanel>
      <BroadcastPanel>
        <h3 className="mb-2 font-semibold">Recent Alerts & Warnings</h3>
        {activeAlerts.length ? (
          activeAlerts.map((alert) => (
            <Row key={alert.id} label={alert.category} value={alert.severity} />
          ))
        ) : (
          <p className="text-sm text-ubos-fg-muted">No active alerts.</p>
        )}
      </BroadcastPanel>
    </div>
  );
}
