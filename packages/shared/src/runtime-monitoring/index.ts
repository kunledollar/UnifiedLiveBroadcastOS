export type HealthStatus =
  'healthy' | 'warning' | 'critical' | 'offline' | 'recovering' | 'unknown';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertCategory =
  | 'Warning'
  | 'Critical'
  | 'Offline'
  | 'Recovering'
  | 'High Latency'
  | 'Packet Loss'
  | 'Frame Drop'
  | 'GPU Overload'
  | 'Memory Pressure'
  | 'Storage Full'
  | 'Disconnected Device'
  | 'Recording Failure'
  | 'Streaming Failure'
  | 'Guest Offline'
  | 'Automation Failure'
  | 'Plugin Failure'
  | 'Security Event';
export type MonitoringSubsystem =
  | 'Production Engine'
  | 'Execution Engine'
  | 'Switcher'
  | 'Graphics'
  | 'GPU'
  | 'Rendering'
  | 'Media'
  | 'Audio'
  | 'Recording'
  | 'Automation'
  | 'AI Assistant'
  | 'Distribution'
  | 'Security'
  | 'Devices'
  | 'Guests'
  | 'Replay'
  | 'Outputs'
  | 'Database'
  | 'Workspace'
  | 'Plugins';
export type MonitoringMetricName =
  | 'CPU'
  | 'GPU'
  | 'RAM'
  | 'VRAM'
  | 'Frame Rate'
  | 'Dropped Frames'
  | 'Latency'
  | 'Switch Latency'
  | 'Audio Delay'
  | 'Video Delay'
  | 'Network'
  | 'Storage'
  | 'Recording Speed'
  | 'Encoder Queue'
  | 'Decoder Queue'
  | 'Render Queue'
  | 'Media Cache'
  | 'Frame Cache'
  | 'Command Queue'
  | 'Worker Queue'
  | 'Temperature'
  | 'Bandwidth'
  | 'Packet Loss'
  | 'Buffer Utilization'
  | 'Disk Usage'
  | 'Session Count'
  | 'Operator Count';
export interface PerformanceMetric {
  id: string;
  name: MonitoringMetricName;
  value: number;
  unit: string;
  subsystem: MonitoringSubsystem;
  timestamp: string;
  metadata: Record<string, unknown>;
}
export interface PerformanceCounter {
  id: string;
  name: string;
  count: number;
  subsystem: MonitoringSubsystem;
  timestamp: string;
}
export interface MonitoringThreshold {
  metric: MonitoringMetricName;
  warning?: number;
  critical?: number;
  recovery?: number;
  direction: 'above' | 'below';
}
export interface AlertRule {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  subsystem: MonitoringSubsystem;
  threshold: MonitoringThreshold;
  enabled: boolean;
  message: string;
}
export interface MonitoringRule extends AlertRule {}
export interface MonitoringAlert {
  id: string;
  ruleId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  subsystem: MonitoringSubsystem;
  message: string;
  status: 'active' | 'recovering' | 'resolved';
  openedAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  metric?: PerformanceMetric;
}
export interface HealthIndicator {
  id: string;
  subsystem: MonitoringSubsystem;
  status: HealthStatus;
  label: string;
  detail: string;
  updatedAt: string;
}
export interface HealthCheck {
  id: string;
  subsystem: MonitoringSubsystem;
  status: HealthStatus;
  indicators: HealthIndicator[];
  updatedAt: string;
}
export interface MonitoringHealth {
  overall: HealthStatus;
  checks: HealthCheck[];
  updatedAt: string;
}
export interface MonitoringMetrics {
  samples: PerformanceMetric[];
  counters: PerformanceCounter[];
  aggregated: Record<string, number>;
}
export interface MonitoringEvent {
  id: string;
  type: string;
  subsystem: MonitoringSubsystem;
  timestamp: string;
  payload: Record<string, unknown>;
}
export interface MonitoringLog {
  id: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  subsystem: MonitoringSubsystem;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}
export interface OperatorNotification {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  alertId?: string;
  createdAt: string;
  acknowledged: boolean;
}
export interface DiagnosticReport {
  id: string;
  createdAt: string;
  health: MonitoringHealth;
  alerts: MonitoringAlert[];
  logs: MonitoringLog[];
  recommendations: string[];
  containsRuntimeHandles: false;
}
export interface TelemetrySnapshot {
  id: string;
  timestamp: string;
  metrics: PerformanceMetric[];
  counters: PerformanceCounter[];
  health: MonitoringHealth;
  alerts: MonitoringAlert[];
}
export interface TelemetryStream {
  id: string;
  snapshots: TelemetrySnapshot[];
  metadataOnly: true;
}
export interface RuntimeStatistics {
  metricCount: number;
  alertCount: number;
  activeAlertCount: number;
  subsystemCount: number;
  notificationCount: number;
  queueDepth: number;
}
export interface SystemStatus {
  status: HealthStatus;
  subsystemStatuses: Record<string, HealthStatus>;
  activeAlerts: number;
  warnings: number;
  critical: number;
}
export interface MonitoringDashboard {
  id: string;
  title: string;
  panels: string[];
  status: SystemStatus;
  snapshot: MonitoringSnapshot;
}
export interface MonitoringSnapshot extends TelemetrySnapshot {
  statistics: RuntimeStatistics;
  system: SystemStatus;
  containsRuntimeHandles: false;
}
export interface MonitoringSession {
  id: string;
  operator: string;
  startedAt: string;
  metadata: Record<string, unknown>;
  containsRuntimeHandles: false;
}
export interface MonitoringCommand {
  id: string;
  type:
    'recordMetric' | 'recordCounter' | 'healthCheck' | 'log' | 'event' | 'recoverAlert' | 'notify';
  timestamp?: string;
  metric?: PerformanceMetric;
  counter?: PerformanceCounter;
  health?: HealthCheck;
  log?: MonitoringLog;
  event?: MonitoringEvent;
  alertId?: string;
  notification?: OperatorNotification;
  runtimeHandle?: never;
  socket?: never;
  performance?: never;
}
const subsystems: MonitoringSubsystem[] = [
  'Production Engine',
  'Execution Engine',
  'Switcher',
  'Graphics',
  'GPU',
  'Rendering',
  'Media',
  'Audio',
  'Recording',
  'Automation',
  'AI Assistant',
  'Distribution',
  'Security',
  'Devices',
  'Guests',
  'Replay',
  'Outputs',
  'Database',
  'Workspace',
  'Plugins',
];
const stamp = (n: number) => `2026-07-05T00:00:${String(n % 60).padStart(2, '0')}.000Z`;
const unsafeKeys = ['runtimeHandle', 'socket', 'performance', 'nativeHandle', 'timer', 'interval'];
const rank: Record<HealthStatus, number> = {
  healthy: 0,
  unknown: 1,
  recovering: 2,
  warning: 3,
  critical: 4,
  offline: 5,
};
export class MonitoringQueue {
  private items: MonitoringCommand[] = [];
  enqueue(c: MonitoringCommand) {
    this.items.push(c);
  }
  dequeue() {
    return this.items.shift();
  }
  get depth() {
    return this.items.length;
  }
  snapshot() {
    return [...this.items];
  }
}
export class MonitoringHistory {
  snapshots: MonitoringSnapshot[] = [];
  push(s: MonitoringSnapshot) {
    this.snapshots.push(s);
    return s;
  }
  latest() {
    return this.snapshots.at(-1) ?? null;
  }
}
export class MonitoringDispatcher {
  constructor(private queue: MonitoringQueue) {}
  dispatch(command: MonitoringCommand) {
    this.queue.enqueue(command);
  }
}
export class MonitoringExecutor {
  constructor(private runtime: MonitoringRuntime) {}
  execute(command: MonitoringCommand) {
    this.runtime.apply(command);
  }
}
export class MonitoringRuntime {
  readonly queue = new MonitoringQueue();
  readonly history = new MonitoringHistory();
  readonly dispatcher = new MonitoringDispatcher(this.queue);
  readonly executor = new MonitoringExecutor(this);
  session: MonitoringSession;
  metrics: PerformanceMetric[] = [];
  counters: PerformanceCounter[] = [];
  healthChecks: HealthCheck[] = [];
  alerts: MonitoringAlert[] = [];
  events: MonitoringEvent[] = [];
  logs: MonitoringLog[] = [];
  notifications: OperatorNotification[] = [];
  rules: AlertRule[];
  private seq = 0;
  constructor(
    rules: AlertRule[] = createDefaultMonitoringRules(),
    session: Partial<MonitoringSession> = {},
  ) {
    this.rules = rules;
    this.session = {
      id: session.id ?? 'monitoring-session',
      operator: session.operator ?? 'system',
      startedAt: session.startedAt ?? stamp(0),
      metadata: session.metadata ?? {},
      containsRuntimeHandles: false,
    };
    for (const subsystem of subsystems)
      this.healthChecks.push(this.createHealthCheck(subsystem, 'healthy', 'Nominal'));
  }
  nextId(prefix: string) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }
  now() {
    this.seq += 1;
    return stamp(this.seq);
  }
  dispatch(command: MonitoringCommand) {
    this.dispatcher.dispatch(command);
    this.drain();
  }
  drain() {
    let c = this.queue.dequeue();
    while (c) {
      this.executor.execute(c);
      c = this.queue.dequeue();
    }
  }
  apply(command: MonitoringCommand) {
    if (!this.validateCommand(command)) return;
    if (command.metric) this.recordMetric(command.metric);
    if (command.counter && command.counter.count >= 0) this.counters.push(command.counter);
    if (command.health) this.upsertHealth(command.health);
    if (command.log) this.logs.push(command.log);
    if (command.event) this.events.push(command.event);
    if (command.alertId) this.recoverAlert(command.alertId);
    if (command.notification) this.notifications.push(command.notification);
  }
  validateCommand(command: MonitoringCommand) {
    return !unsafeKeys.some((key) => key in (command as unknown as Record<string, unknown>));
  }
  validateMetric(metric: PerformanceMetric) {
    return (
      Number.isFinite(metric.value) &&
      metric.value >= 0 &&
      !unsafeKeys.some((key) => key in metric.metadata)
    );
  }
  recordMetric(metric: PerformanceMetric) {
    if (!this.validateMetric(metric)) return;
    this.metrics.push(metric);
    this.evaluateRules(metric);
  }
  createHealthCheck(
    subsystem: MonitoringSubsystem,
    status: HealthStatus,
    detail: string,
  ): HealthCheck {
    const updatedAt = this.now();
    return {
      id: `health-${subsystem}`,
      subsystem,
      status,
      updatedAt,
      indicators: [
        { id: `indicator-${subsystem}`, subsystem, status, label: subsystem, detail, updatedAt },
      ],
    };
  }
  upsertHealth(check: HealthCheck) {
    const i = this.healthChecks.findIndex((h) => h.id === check.id);
    if (i >= 0) this.healthChecks[i] = check;
    else this.healthChecks.push(check);
  }
  evaluateRules(metric: PerformanceMetric) {
    for (const rule of this.rules.filter(
      (r) => r.enabled && r.subsystem === metric.subsystem && r.threshold.metric === metric.name,
    )) {
      const limit = rule.threshold.critical ?? rule.threshold.warning;
      const triggered =
        limit !== undefined &&
        (rule.threshold.direction === 'above' ? metric.value >= limit : metric.value <= limit);
      const recovery =
        rule.threshold.recovery !== undefined &&
        (rule.threshold.direction === 'above'
          ? metric.value <= rule.threshold.recovery
          : metric.value >= rule.threshold.recovery);
      const existing = this.alerts.find((a) => a.ruleId === rule.id && a.status !== 'resolved');
      if (triggered && !existing) this.openAlert(rule, metric);
      else if (recovery && existing) this.resolveAlert(existing.id);
    }
  }
  openAlert(rule: AlertRule, metric: PerformanceMetric) {
    const id = `alert-${rule.id}`;
    if (this.alerts.some((a) => a.id === id && a.status !== 'resolved')) return;
    const now = this.now();
    const alert: MonitoringAlert = {
      id,
      ruleId: rule.id,
      category: rule.category,
      severity: rule.severity,
      subsystem: rule.subsystem,
      message: rule.message,
      status: 'active',
      openedAt: now,
      updatedAt: now,
      resolvedAt: null,
      metric,
    };
    this.alerts.push(alert);
    this.notifications.push({
      id: this.nextId('notification'),
      severity: rule.severity,
      title: rule.category,
      message: rule.message,
      alertId: id,
      createdAt: now,
      acknowledged: false,
    });
    this.upsertHealth(
      this.createHealthCheck(
        rule.subsystem,
        rule.severity === 'critical' ? 'critical' : 'warning',
        rule.message,
      ),
    );
  }
  recoverAlert(id: string) {
    const a = this.alerts.find((x) => x.id === id);
    if (a && a.status === 'active') {
      a.status = 'recovering';
      a.updatedAt = this.now();
      this.upsertHealth(this.createHealthCheck(a.subsystem, 'recovering', 'Recovery in progress'));
    }
  }
  resolveAlert(id: string) {
    const a = this.alerts.find((x) => x.id === id);
    if (a) {
      a.status = 'resolved';
      a.resolvedAt = this.now();
      a.updatedAt = a.resolvedAt;
      this.upsertHealth(this.createHealthCheck(a.subsystem, 'healthy', 'Recovered'));
    }
  }
  aggregateMetrics() {
    const out: Record<string, number> = {};
    const count: Record<string, number> = {};
    for (const m of this.metrics) {
      out[m.name] = (out[m.name] ?? 0) + m.value;
      count[m.name] = (count[m.name] ?? 0) + 1;
    }
    for (const key of Object.keys(out)) out[key] = (out[key] ?? 0) / (count[key] ?? 1);
    return out;
  }
  health(): MonitoringHealth {
    const overall = this.healthChecks.reduce<HealthStatus>(
      (s, h) => (rank[h.status] > rank[s] ? h.status : s),
      'healthy',
    );
    return { overall, checks: [...this.healthChecks], updatedAt: this.now() };
  }
  systemStatus(): SystemStatus {
    const subsystemStatuses = Object.fromEntries(
      this.healthChecks.map((h) => [h.subsystem, h.status]),
    );
    const active = this.alerts.filter((a) => a.status !== 'resolved');
    return {
      status: this.health().overall,
      subsystemStatuses,
      activeAlerts: active.length,
      warnings: active.filter((a) => a.severity === 'warning').length,
      critical: active.filter((a) => a.severity === 'critical').length,
    };
  }
  statistics(): RuntimeStatistics {
    return {
      metricCount: this.metrics.length,
      alertCount: this.alerts.length,
      activeAlertCount: this.alerts.filter((a) => a.status !== 'resolved').length,
      subsystemCount: this.healthChecks.length,
      notificationCount: this.notifications.length,
      queueDepth: this.queue.depth,
    };
  }
  snapshot(id = this.nextId('snapshot')): MonitoringSnapshot {
    const s: MonitoringSnapshot = {
      id,
      timestamp: this.now(),
      metrics: [...this.metrics],
      counters: [...this.counters],
      health: this.health(),
      alerts: [...this.alerts],
      statistics: this.statistics(),
      system: this.systemStatus(),
      containsRuntimeHandles: false,
    };
    return this.history.push(s);
  }
  diagnostics(): DiagnosticReport {
    return {
      id: this.nextId('diagnostic'),
      createdAt: this.now(),
      health: this.health(),
      alerts: [...this.alerts],
      logs: [...this.logs],
      recommendations: this.alerts
        .filter((a) => a.status !== 'resolved')
        .map((a) => `Investigate ${a.subsystem}: ${a.message}`),
      containsRuntimeHandles: false,
    };
  }
  dashboard(): MonitoringDashboard {
    return {
      id: 'monitoring-dashboard',
      title: 'UBOS Monitoring',
      panels: [
        'System Dashboard',
        'Performance Dashboard',
        'Telemetry Dashboard',
        'Alerts Panel',
        'Diagnostics Panel',
        'Health Inspector',
        'Log Viewer',
        'Metrics Explorer',
        'Subsystem Status',
        'Performance Timeline',
        'Operator Notifications',
      ],
      status: this.systemStatus(),
      snapshot: this.snapshot('dashboard-snapshot'),
    };
  }
}
export function createMetric(
  name: MonitoringMetricName,
  value: number,
  subsystem: MonitoringSubsystem,
  unit = 'count',
): PerformanceMetric {
  return {
    id: `metric-${subsystem}-${name}`.replaceAll(' ', '-'),
    name,
    value,
    unit,
    subsystem,
    timestamp: stamp(1),
    metadata: {},
  };
}
export function createDefaultMonitoringRules(): AlertRule[] {
  return [
    {
      id: 'gpu-overload',
      category: 'GPU Overload',
      severity: 'critical',
      subsystem: 'GPU',
      threshold: { metric: 'GPU', critical: 95, recovery: 75, direction: 'above' },
      enabled: true,
      message: 'GPU utilization exceeded safe threshold',
    },
    {
      id: 'high-latency',
      category: 'High Latency',
      severity: 'warning',
      subsystem: 'Distribution',
      threshold: { metric: 'Latency', warning: 250, recovery: 120, direction: 'above' },
      enabled: true,
      message: 'Distribution latency is elevated',
    },
    {
      id: 'packet-loss',
      category: 'Packet Loss',
      severity: 'warning',
      subsystem: 'Distribution',
      threshold: { metric: 'Packet Loss', warning: 2, recovery: 0.5, direction: 'above' },
      enabled: true,
      message: 'Packet loss detected',
    },
    {
      id: 'frame-drop',
      category: 'Frame Drop',
      severity: 'warning',
      subsystem: 'Rendering',
      threshold: { metric: 'Dropped Frames', warning: 1, recovery: 0, direction: 'above' },
      enabled: true,
      message: 'Rendering is dropping frames',
    },
    {
      id: 'storage-full',
      category: 'Storage Full',
      severity: 'critical',
      subsystem: 'Recording',
      threshold: { metric: 'Disk Usage', critical: 95, recovery: 80, direction: 'above' },
      enabled: true,
      message: 'Recording storage is almost full',
    },
  ];
}
export function createMonitoringRuntime() {
  return new MonitoringRuntime();
}
