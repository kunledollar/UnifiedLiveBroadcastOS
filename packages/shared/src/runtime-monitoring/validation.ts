import { MonitoringRuntime, createMetric } from './index.js';
function ok(v: unknown, m = 'expected truthy') {
  if (!v) throw new Error(m);
}
function eq(a: unknown, b: unknown) {
  if (a !== b) throw new Error(`Expected ${String(b)}, received ${String(a)}`);
}
const runtime = new MonitoringRuntime();
runtime.dispatch({
  id: 'bad-negative',
  type: 'recordMetric',
  metric: createMetric('CPU', -1, 'Production Engine'),
});
eq(runtime.metrics.length, 0);
runtime.dispatch({
  id: 'gpu-hot',
  type: 'recordMetric',
  metric: createMetric('GPU', 99, 'GPU', '%'),
});
eq(runtime.alerts.length, 1);
eq(runtime.notifications.length, 1);
eq(runtime.health().overall, 'critical');
runtime.dispatch({ id: 'gpu-recovering', type: 'recoverAlert', alertId: 'alert-gpu-overload' });
eq(runtime.alerts[0]?.status, 'recovering');
runtime.dispatch({
  id: 'gpu-ok',
  type: 'recordMetric',
  metric: createMetric('GPU', 50, 'GPU', '%'),
});
eq(runtime.alerts[0]?.status, 'resolved');
runtime.dispatch({
  id: 'latency',
  type: 'recordMetric',
  metric: createMetric('Latency', 300, 'Distribution', 'ms'),
});
runtime.dispatch({
  id: 'frames',
  type: 'recordMetric',
  metric: createMetric('Dropped Frames', 2, 'Rendering'),
});
ok(runtime.aggregateMetrics().GPU !== undefined);
ok(runtime.snapshot('test-snapshot').containsRuntimeHandles === false);
ok(JSON.parse(JSON.stringify(runtime.history.latest())).containsRuntimeHandles === false);
ok(runtime.dashboard().panels.includes('Metrics Explorer'));
ok(runtime.diagnostics().recommendations.length >= 1);
runtime.dispatch({
  id: 'unsafe',
  type: 'recordMetric',
  metric: createMetric('CPU', 1, 'Production Engine'),
  runtimeHandle: undefined,
} as never);
ok(runtime.metrics.every((m) => m.value >= 0));
ok(
  new Set(runtime.alerts.map((a) => a.id)).size === runtime.alerts.length,
  'duplicate alert IDs rejected',
);
console.log('Runtime monitoring validation passed');
