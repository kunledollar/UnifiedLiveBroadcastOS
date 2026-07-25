/**
 * UBOS Health Engine — Step 71
 *
 * Monitors every UBOS subsystem, aggregates health metrics, detects
 * anomalies, and provides global safety diagnostics.
 *
 * This is a minimal engine. Later steps expand it into:
 *   - predictive failure detection
 *   - AI-driven health scoring
 *   - orchestration-driven recovery
 *   - subsystem restart logic
 *   - anomaly detection with ML
 *   - multi-destination health graphs
 */

export type HealthStatus = 'ok' | 'warning' | 'error' | 'unknown';

export type HealthSubsystem =
  | 'scene'
  | 'graphics'
  | 'replay'
  | 'routing'
  | 'audio'
  | 'automation'
  | 'output'
  | 'ai';

export type HealthMetric = {
  warning: boolean;
  error: boolean;
  value?: number | string;
  message?: string;
  updatedAt?: number;
};

export type SystemHealth = Record<HealthSubsystem, HealthStatus>;

export class HealthEngine {
  private health: SystemHealth = {
    scene:      'unknown',
    graphics:   'unknown',
    replay:     'unknown',
    routing:    'unknown',
    audio:      'unknown',
    automation: 'unknown',
    output:     'unknown',
    ai:         'unknown',
  };

  private metrics: Partial<Record<HealthSubsystem, HealthMetric>> = {};

  // ── Metric updates ────────────────────────────────────────────────────────

  updateMetric(key: HealthSubsystem, metric: Omit<HealthMetric, 'updatedAt'>): void {
    const enriched: HealthMetric = { ...metric, updatedAt: Date.now() };
    this.metrics[key] = enriched;

    if (metric.error)   { this.health[key] = 'error';   return; }
    if (metric.warning) { this.health[key] = 'warning';  return; }
    this.health[key] = 'ok';
  }

  // ── Query ─────────────────────────────────────────────────────────────────

  getHealth(): Readonly<SystemHealth> {
    return this.health;
  }

  getMetrics(): Readonly<Partial<Record<HealthSubsystem, HealthMetric>>> {
    return this.metrics;
  }

  getSubsystemHealth(key: HealthSubsystem): HealthStatus {
    return this.health[key];
  }

  // ── Aggregates ────────────────────────────────────────────────────────────

  get isHealthy(): boolean {
    return Object.values(this.health).every((s) => s === 'ok' || s === 'unknown');
  }

  get hasError(): boolean {
    return Object.values(this.health).some((s) => s === 'error');
  }

  get hasWarning(): boolean {
    return Object.values(this.health).some((s) => s === 'warning');
  }

  get worstStatus(): HealthStatus {
    if (this.hasError)   return 'error';
    if (this.hasWarning) return 'warning';
    if (this.isHealthy)  return 'ok';
    return 'unknown';
  }

  /** Count subsystems at each status level. */
  getSummary(): Record<HealthStatus, number> {
    const counts: Record<HealthStatus, number> = { ok: 0, warning: 0, error: 0, unknown: 0 };
    for (const status of Object.values(this.health)) {
      counts[status]++;
    }
    return counts;
  }
}
