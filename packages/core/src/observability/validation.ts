import {
  AlertEngine,
  AlertSeverity,
  AlertState,
  HealthRegistry,
  HealthStatus,
  LogLevel,
  LogWriter,
  MetricRegistry,
  MetricStore,
  MetricType,
  TraceCollector,
  TraceSpanStatus,
  aggregate,
  detectAnomaly,
  diagnose,
  evaluateCapacity,
  evaluateSLO,
  redact,
} from './index.js';

function assertEqual(actual: unknown, expected: unknown): void { if (actual !== expected) throw new Error(`expected ${String(expected)} but received ${String(actual)}`); }
function assertOk(value: unknown): void { if (!value) throw new Error('expected truthy value'); }
function assertDeepEqual(actual: unknown, expected: unknown): void { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`); }
function assertThrows(fn: () => void): void { let threw = false; try { fn(); } catch { threw = true; } if (!threw) throw new Error('expected function to throw'); }

const registry = new MetricRegistry();
registry.register({
  definition: {
    name: 'ubos.video.frames_dropped_total',
    description: 'Dropped Program frames',
    type: MetricType.Counter,
    unit: 'frames',
    labels: ['production_id', 'service', 'severity'],
    retentionClass: 'critical',
  },
  ownerService: 'video',
  enabled: true,
  collectionMode: 'event-derived',
});
assertEqual(registry.list().length, 1);
assertThrows(() => registry.register({ definition: { name: 'bad', description: 'bad', type: MetricType.Gauge, unit: 'x', labels: ['guest_name'], retentionClass: 'raw' }, ownerService: 'bad', enabled: true }));

const store = new MetricStore(5);
for (let i = 0; i < 10; i += 1) {
  store.record({ metricName: 'ubos.video.frames_dropped_total', timestamp: i, value: i, labels: { production_id: 'p1', service: 'video', severity: 'warning' } });
}
assertEqual(store.query({ metricName: 'ubos.video.frames_dropped_total' }).length, 5);
const aggregated = aggregate('ubos.video.frames_dropped_total', store.query({ metricName: 'ubos.video.frames_dropped_total' }));
assertEqual(aggregated.count, 5);
assertEqual(aggregated.maximum, 9);
assertEqual(aggregated.p99, 8);

const health = new HealthRegistry();
health.update({ componentId: 'program.video', status: HealthStatus.Healthy, score: 100, reasons: [], updatedAt: 1, confidence: 1 });
health.update({ componentId: 'program.audio', status: HealthStatus.Healthy, score: 1, reasons: [{ code: 'audio.silent', message: 'Program audio silent', severity: 'critical', firstObservedAt: 1, lastObservedAt: 2 }], updatedAt: 2, confidence: 1 });
const production = health.rollup('production', ['program.video', 'program.audio'], 3);
assertEqual(production.status, HealthStatus.Critical);
assertEqual(health.get('missing.component').status, HealthStatus.Unknown);

const logs = new LogWriter();
logs.write({ id: 'log1', timestamp: 1, level: LogLevel.Error, service: 'streaming', message: 'connection failed', traceId: 'trace1', attributes: { streamKey: 'super-secret' } });
assertDeepEqual(logs.query({ service: 'streaming' })[0]?.attributes, { streamKey: '[REDACTED]' });
const redacted = redact({ bearerToken: 'abc' }) as Record<string, unknown>;
assertEqual(redacted.bearerToken, '[REDACTED]');

const traces = new TraceCollector();
const span = traces.startSpan({ traceId: 'trace1', name: 'operator-command', service: 'control', startedAt: 10, attributes: { password: 'nope' } });
traces.endSpan(span.spanId, TraceSpanStatus.Success, 20);
assertEqual(traces.get('trace1')[0]?.status, TraceSpanStatus.Success);
assertEqual(traces.get('trace1')[0]?.attributes.password, '[REDACTED]');

const alerts = new AlertEngine();
alerts.registerRule({ id: 'dropped-frames', name: 'Dropped frames high', expression: { metricName: 'ubos.video.frames_dropped_total', operator: '>', threshold: 7, labelMatchers: { production_id: 'p1' } }, severity: AlertSeverity.Critical, evaluationWindowMs: 10, requiredDurationMs: 1, enabled: true });
assertEqual(alerts.evaluate(9, store)[0]?.state, AlertState.Pending);
assertEqual(alerts.evaluate(11, store)[0]?.state, AlertState.Firing);
alerts.acknowledge('alert:dropped-frames', 'operator-1', 'operator acknowledged');
assertEqual(alerts.evaluate(12, store)[0]?.state, AlertState.Firing);

const anomaly = detectAnomaly('ubos.video.frames_dropped_total', store.query({ metricName: 'ubos.video.frames_dropped_total' }), 100, 13);
assertEqual(anomaly.mode, 'observe');
assertOk(anomaly.anomalyScore > 0);
const slo = evaluateSLO({ id: 'command-success', name: 'Command success', indicator: 'ubos.command.success_rate', target: 99.95, comparison: '>=', windowMs: 60_000 }, { ...aggregated, average: 99 });
assertEqual(slo.violated, true);
assertEqual(evaluateCapacity({ resourceId: 'gpu', used: 91, available: 9, reserved: 0, utilizationPercent: 91, warningThreshold: 80, criticalThreshold: 90 }), AlertSeverity.Critical);
const diag = diagnose('program', [production], alerts.evaluate(12, store), 100);
assertEqual(diag.status, 'failed');

console.log('UBOS v5.11.1 observability validation passed');
