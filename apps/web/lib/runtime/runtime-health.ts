import { prisma } from '@ubos/db';

export type RuntimeServiceStatus =
  'unknown' | 'checking' | 'healthy' | 'degraded' | 'unavailable' | 'disabled';
export type RuntimeAggregateStatus = 'ready' | 'degraded' | 'blocked';

export type RuntimeServiceHealth = {
  id: 'database';
  displayName: string;
  category: 'persistence';
  required: boolean;
  status: RuntimeServiceStatus;
  message: string;
  technicalDetail?: string;
  lastCheckedAt: string;
  latencyMs?: number;
  recoveryAction?: string;
};

export type RuntimeHealth = {
  status: RuntimeAggregateStatus;
  checkedAt: string;
  services: RuntimeServiceHealth[];
};

const DATABASE_TIMEOUT_MS = 2_500;
const CACHE_MS = 1_000;

function safeDatabaseDetail(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error ? String(error.code) : undefined;
  if (code) return `Database connection failed (${code}).`;
  if (
    error instanceof Error &&
    /initialization|connect|timeout|database|postgres/i.test(error.message)
  ) {
    return 'Database connection could not be established.';
  }
  return 'Database check failed.';
}

function log(event: string, fields: Record<string, unknown> = {}) {
  // Deliberately only log fixed, sanitized fields; never serialize errors or env.
  console.info(JSON.stringify({ event, component: 'runtime-health', ...fields }));
}

export function aggregateRuntimeHealth(services: RuntimeServiceHealth[]): RuntimeAggregateStatus {
  if (services.some((service) => service.required && service.status === 'unavailable'))
    return 'blocked';
  if (
    services.some(
      (service) =>
        service.status === 'degraded' || (!service.required && service.status === 'unavailable'),
    )
  )
    return 'degraded';
  return 'ready';
}

export async function checkDatabaseHealth(
  query: () => Promise<unknown> = async () => {
    try {
      return await prisma.$queryRawUnsafe('SELECT 1');
    } catch {
      // Do not let a Prisma error object cross the runtime-manager boundary.
      throw new Error('Database connection unavailable.');
    }
  },
  timeoutMs = DATABASE_TIMEOUT_MS,
): Promise<RuntimeServiceHealth> {
  const startedAt = Date.now();
  log('service_check_started', { service: 'database' });
  try {
    // Convert the driver rejection before it enters Next's request instrumentation.
    // This keeps Prisma's connection text out of the RSC payload as well as the UI.
    const safeQuery = query().catch(() => {
      throw new Error('Database connection unavailable.');
    });
    await Promise.race([
      safeQuery,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Runtime health check timed out.')), timeoutMs),
      ),
    ]);
    const result: RuntimeServiceHealth = {
      id: 'database',
      displayName: 'PostgreSQL / Prisma',
      category: 'persistence',
      required: true,
      status: 'healthy',
      message: 'Saved broadcast sessions are available.',
      lastCheckedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
    };
    log('service_check_passed', { service: 'database', latencyMs: result.latencyMs });
    return result;
  } catch (error) {
    const timedOut = error instanceof Error && error.message === 'Runtime health check timed out.';
    const result: RuntimeServiceHealth = {
      id: 'database',
      displayName: 'PostgreSQL / Prisma',
      category: 'persistence',
      required: true,
      status: 'unavailable',
      message: 'UBOS cannot access saved broadcast sessions.',
      technicalDetail: timedOut ? 'The database check timed out.' : safeDatabaseDetail(error),
      lastCheckedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      recoveryAction: 'Start PostgreSQL, verify DATABASE_URL, then retry.',
    };
    log('service_check_failed', {
      service: 'database',
      reason: timedOut ? 'timeout' : 'connection',
    });
    return result;
  }
}

export class RuntimeManager {
  private cached?: RuntimeHealth;
  private inFlight: Promise<RuntimeHealth> | undefined;

  constructor(
    private readonly databaseCheck: () => Promise<RuntimeServiceHealth> = () =>
      checkDatabaseHealth(),
  ) {}

  async check(options: { force?: boolean } = {}): Promise<RuntimeHealth> {
    if (!options.force && this.cached && Date.now() - Date.parse(this.cached.checkedAt) < CACHE_MS)
      return this.cached;
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.databaseCheck()
      .then((database) => {
        const health = {
          status: aggregateRuntimeHealth([database]),
          checkedAt: new Date().toISOString(),
          services: [database],
        };
        if (health.status === 'blocked') log('runtime_blocked_startup', { services: ['database'] });
        if (health.status === 'degraded') log('runtime_entered_degraded_mode');
        this.cached = health;
        return health;
      })
      .finally(() => {
        this.inFlight = undefined;
      });
    return this.inFlight;
  }

  async retry() {
    log('runtime_retry_requested');
    return this.check({ force: true });
  }
}

const globalRuntime = globalThis as typeof globalThis & { ubosRuntimeManager?: RuntimeManager };
export const runtimeManager = globalRuntime.ubosRuntimeManager ?? new RuntimeManager();
if (process.env.NODE_ENV !== 'production') globalRuntime.ubosRuntimeManager = runtimeManager;
