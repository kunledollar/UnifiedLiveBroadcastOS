'use client';

import { createMonitoringManifest, MonitoringRuntime } from '@ubos/shared';
import { OperationsPanel } from './OperationsChrome';

const runtime = new MonitoringRuntime();
runtime.registerSignal({ id: 'runtime-health', label: 'Runtime Health', kind: 'metric', status: 'healthy', value: 'nominal' });
runtime.registerSignal({ id: 'telemetry-ingest', label: 'Telemetry Ingest', kind: 'log', status: 'unknown', value: 'metadata only' });
const manifest = createMonitoringManifest(runtime.session);
const health = runtime.health();

export function MonitoringPanel() {
  return (
    <OperationsPanel title="Monitoring">
      <div className="space-y-ubos-2 text-ubos-fg-secondary">
        <div className="rounded-ubos-sm border border-ubos-border-subtle bg-ubos-midnight p-ubos-2">
          <div className="text-xs uppercase tracking-ubos-wide text-ubos-fg-muted">Status</div>
          <div className="text-sm font-semibold text-ubos-fg-primary">{health.status}</div>
          <div className="text-xs text-ubos-fg-muted">
            {health.signalCount} signals · {health.activeAlerts} active alerts
          </div>
        </div>
        <div className="grid gap-ubos-1">
          {manifest.session.signals.map((signal) => (
            <div key={signal.id} className="rounded-ubos-sm border border-ubos-border-subtle p-ubos-2">
              <div className="flex items-center justify-between gap-ubos-2">
                <span className="text-sm text-ubos-fg-primary">{signal.label}</span>
                <span className="text-xs uppercase text-ubos-fg-muted">{signal.status}</span>
              </div>
              <div className="text-xs text-ubos-fg-muted">{signal.value}</div>
            </div>
          ))}
        </div>
      </div>
    </OperationsPanel>
  );
}
