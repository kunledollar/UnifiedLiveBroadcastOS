import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RuntimeManager,
  aggregateRuntimeHealth,
  checkDatabaseHealth,
  type RuntimeServiceHealth,
} from './runtime-health';

const healthy = (): RuntimeServiceHealth => ({
  id: 'database',
  displayName: 'PostgreSQL / Prisma',
  category: 'persistence',
  required: true,
  status: 'healthy',
  message: 'ok',
  lastCheckedAt: new Date().toISOString(),
});

test('aggregates required and optional service states truthfully', () => {
  assert.equal(aggregateRuntimeHealth([healthy()]), 'ready');
  assert.equal(
    aggregateRuntimeHealth([{ ...healthy(), required: false, status: 'unavailable' }]),
    'degraded',
  );
  assert.equal(aggregateRuntimeHealth([{ ...healthy(), status: 'unavailable' }]), 'blocked');
});

test('normalizes Prisma initialization and connection failures without leaking details', async () => {
  const result = await checkDatabaseHealth(async () => {
    const error = new Error('postgresql://user:password@host/db');
    error.name = 'PrismaClientInitializationError';
    throw error;
  });
  assert.equal(result.status, 'unavailable');
  assert.equal(result.message, 'UBOS cannot access saved broadcast sessions.');
  assert.doesNotMatch(result.technicalDetail ?? '', /password|postgresql:\/\//i);
});

test('returns unavailable on a strict timeout', async () => {
  const result = await checkDatabaseHealth(() => new Promise(() => {}), 5);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.technicalDetail, 'The database check timed out.');
});

test('retry recovers after a database failure', async () => {
  let available = false;
  const manager = new RuntimeManager(async () =>
    available ? healthy() : { ...healthy(), status: 'unavailable', message: 'offline' },
  );
  assert.equal((await manager.check()).status, 'blocked');
  available = true;
  assert.equal((await manager.retry()).status, 'ready');
});
