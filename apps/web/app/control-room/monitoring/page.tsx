import { createMetric, createMonitoringRuntime } from '@ubos/shared';
import { BroadcastPanel, StatusBadge } from '@ubos/ui';

const runtime = createMonitoringRuntime();
for (const metric of [
  createMetric('CPU', 36, 'Production Engine', '%'),
  createMetric('GPU', 72, 'GPU', '%'),
  createMetric('Frame Rate', 60, 'Rendering', 'fps'),
  createMetric('Latency', 94, 'Distribution', 'ms'),
  createMetric('Command Queue', 3, 'Execution Engine'),
])
  runtime.dispatch({ id: metric.id, type: 'recordMetric', metric });
const dashboard = runtime.dashboard();
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <BroadcastPanel>
      <h2 className="mb-2 font-semibold">{title}</h2>
      <div className="space-y-1 text-sm text-ubos-fg-muted">{children}</div>
    </BroadcastPanel>
  );
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className="text-ubos-fg-primary">{value}</span>
    </div>
  );
}
export default function MonitoringPage() {
  return (
    <main className="space-y-ubos-3 p-ubos-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Monitoring Runtime</h1>
          <p className="text-sm text-ubos-fg-muted">
            Metadata-only health, telemetry, diagnostics, alerts, logs and operator notifications.
          </p>
        </div>
        <StatusBadge variant="success">Deterministic</StatusBadge>
      </div>
      <div className="grid gap-ubos-3 lg:grid-cols-3">
        {dashboard.panels.map((panel) => (
          <Panel key={panel} title={panel}>
            <Row label="Health" value={dashboard.status.status} />
            <Row label="Metrics" value={dashboard.snapshot.metrics.length} />
            <Row label="Alerts" value={dashboard.snapshot.statistics.activeAlertCount} />
          </Panel>
        ))}
      </div>
    </main>
  );
}
