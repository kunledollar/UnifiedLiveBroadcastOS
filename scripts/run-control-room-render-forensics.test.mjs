import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { ensureServerAvailable, isHelpRequested, parseArgs, reachable } from './run-control-room-render-forensics.mjs';

test('help flag is detected before server startup work', () => {
  const args = parseArgs(['--help']);
  assert.equal(isHelpRequested(args), true);
});

test('reachable uses HEAD before falling back to GET', async () => {
  const methods = [];
  const isReachable = await reachable('http://localhost:3000/control-room', async (_url, init) => {
    methods.push(init.method);
    return { ok: true };
  });

  assert.equal(isReachable, true);
  assert.deepEqual(methods, ['HEAD']);
});

test('reachable falls back to GET when HEAD fails', async () => {
  const methods = [];
  const isReachable = await reachable('http://localhost:3000/control-room', async (_url, init) => {
    methods.push(init.method);
    if (init.method === 'HEAD') throw new Error('HEAD unavailable');
    return { ok: true };
  });

  assert.equal(isReachable, true);
  assert.deepEqual(methods, ['HEAD', 'GET']);
});

test('existing reachable server skips automatic pnpm startup', async () => {
  let spawned = false;
  const server = await ensureServerAvailable('http://localhost:3000/control-room', {
    fetchImpl: async () => ({ ok: true }),
    spawnImpl: () => {
      spawned = true;
      throw new Error('should not spawn');
    },
  });

  assert.deepEqual(server, { started: false, alreadyRunning: true });
  assert.equal(spawned, false);
});

test('HTTP 200 response returns existing server result before spawn evaluation', async () => {
  const logs = [];
  const originalLog = console.log;
  console.log = (message) => logs.push(message);

  try {
    let spawnCalled = false;
    const server = await ensureServerAvailable('http://localhost:3000/control-room', {
      fetchImpl: async (url, init) => {
        assert.equal(url, 'http://localhost:3000/control-room');
        assert.equal(init.method, 'HEAD');
        return { ok: true, status: 200 };
      },
      spawnImpl: () => {
        spawnCalled = true;
        throw new Error('spawn must not be reached');
      },
      executable: new Proxy({}, {
        get() {
          throw new Error('spawn options must not be evaluated');
        },
      }),
    });

    assert.deepEqual(server, { started: false, alreadyRunning: true });
    assert.equal(spawnCalled, false);
    assert.deepEqual(logs, [
      'Checking existing server...',
      'HEAD returned 200',
      'Using existing server.',
      'Skipping startup.',
    ]);
  } finally {
    console.log = originalLog;
  }
});

test('Windows startup can use pnpm.cmd when spawning is required', async () => {
  const spawned = new EventEmitter();
  spawned.kill = () => {};
  let command;
  let callCount = 0;

  const server = await ensureServerAvailable('http://localhost:3000/control-room', {
    executable: 'pnpm.cmd',
    fetchImpl: async () => ({ ok: ++callCount > 2 }),
    spawnImpl: (cmd) => {
      command = cmd;
      return spawned;
    },
  });

  assert.equal(command, 'pnpm.cmd');
  assert.equal(server, spawned);
});

test('pnpm ENOENT is reported without crashing', async () => {
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (message) => warnings.push(message);

  try {
    const server = await ensureServerAvailable('http://localhost:3000/control-room', {
      fetchImpl: async () => ({ ok: false }),
      spawnImpl: () => {
        const error = new Error('missing pnpm');
        error.code = 'ENOENT';
        throw error;
      },
    });

    assert.equal(server, undefined);
    assert.deepEqual(warnings, ['Unable to launch pnpm automatically.\nUsing existing server if available.']);
  } finally {
    console.warn = originalWarn;
  }
});
