const assert = {
  equal(a: unknown, b: unknown, m = 'assert equal') {
    if (a !== b) throw new Error(`${m}: ${String(a)} !== ${String(b)}`);
  },
  ok(v: unknown, m = 'assert ok') {
    if (!v) throw new Error(m);
  },
  throws(fn: () => unknown, pattern: RegExp) {
    try {
      fn();
    } catch (e) {
      if (
        pattern.test(String((e as Error).message)) ||
        pattern.test(String((e as { code?: string }).code))
      )
        return;
      throw e;
    }
    throw new Error('expected throw');
  },
  async rejects(fn: () => Promise<unknown>, pattern: RegExp) {
    try {
      await fn();
    } catch (e) {
      if (
        pattern.test(String((e as Error).message)) ||
        pattern.test(String((e as { code?: string }).code))
      )
        return;
      throw e;
    }
    throw new Error('expected rejection');
  },
};
declare const process: { exitCode?: number };
import {
  BrowserFrameQueue,
  BrowserSourceRegistry,
  DEFAULT_BROWSER_NAVIGATION_POLICY,
  DEFAULT_BROWSER_VIEWPORT,
  SyntheticBrowserRenderBackend,
  SyntheticBrowserSourceProvider,
  createBrowserDescriptor,
  createSyntheticBrowserFrame,
  evaluateBrowserUrl,
  validateBrowserViewport,
  BROWSER_COMMAND_TYPES,
  BROWSER_EVENT_TYPES,
  BROWSER_WATCHDOG_INCIDENTS,
} from './browser-source.js';

let now = 0n;
const nowNs = () => (now += 1_000_000n);
const tick = (n: bigint) =>
  ({
    frameNumber: n,
    scheduledTimeNs: n * 33_333_333n,
    presentationTimeNs: n * 33_333_333n,
  }) as never;

async function main() {
  assert.ok(BROWSER_COMMAND_TYPES.includes('BROWSER_OPEN'));
  assert.ok(BROWSER_EVENT_TYPES.includes('BrowserRenderReady'));
  assert.ok(BROWSER_WATCHDOG_INCIDENTS.includes('BROWSER_SECRET_LEAK_RISK'));
  const https = evaluateBrowserUrl('https://example.com/app?x=1#frag');
  assert.equal(https.safeUrl, 'https://example.com/app');
  assert.throws(() => evaluateBrowserUrl('http://example.com'), /Unsupported/);
  evaluateBrowserUrl('http://example.com', {
    ...DEFAULT_BROWSER_NAVIGATION_POLICY,
    allowedSchemes: ['http', 'https'],
    allowHttp: true,
  });
  assert.throws(() => evaluateBrowserUrl('javascript:alert(1)'), /Unsupported/);
  assert.throws(() => evaluateBrowserUrl('https://u:p@example.com'), /Credential/);
  assert.throws(() => evaluateBrowserUrl('https://127.0.0.1'), /Private/);
  assert.throws(() => evaluateBrowserUrl('https://localhost'), /Private/);
  assert.throws(() => evaluateBrowserUrl('https://169.254.169.254/latest'), /Private/);
  assert.throws(
    () =>
      evaluateBrowserUrl('https://evil.com', {
        ...DEFAULT_BROWSER_NAVIGATION_POLICY,
        allowedDomains: ['example.com'],
      }),
    /denied/,
  );
  assert.throws(
    () =>
      evaluateBrowserUrl('https://example.com', {
        ...DEFAULT_BROWSER_NAVIGATION_POLICY,
        deniedDomains: ['example.com'],
      }),
    /denied/,
  );
  validateBrowserViewport(DEFAULT_BROWSER_VIEWPORT);
  assert.throws(
    () => validateBrowserViewport({ ...DEFAULT_BROWSER_VIEWPORT, width: 99999, height: 99999 }),
    /TooLarge|exceeds/,
  );

  const desc = createBrowserDescriptor({
    providerId: 'p',
    category: 'SYNTHETIC_BROWSER',
    displayName: 'Test',
    contentReference: {
      kind: 'SYNTHETIC_PAGE',
      referenceId: 'static',
      safeOrigin: 'synthetic://browser',
      syntheticPageId: 'static',
      metadata: { token: 'super-secret-value' },
    },
    supportsInteraction: true,
  });
  assert.throws(() => Object.assign(desc, { displayName: 'mutate' }), /read only|Cannot assign/);
  assert.ok(!JSON.stringify(desc).includes('super-secret-value'));
  const registry = new BrowserSourceRegistry();
  const provider = new SyntheticBrowserSourceProvider([desc]);
  registry.registerProvider(provider);
  assert.throws(() => registry.registerProvider(provider), /Duplicate/);
  const backend = new SyntheticBrowserRenderBackend();
  const source = await registry.registerSource(desc, backend, nowNs);
  await assert.rejects(() => registry.registerSource(desc, backend, nowNs), /Duplicate/);
  assert.equal(source.getBrowserSnapshot().health.connected, false);
  await source.open({}, { nowNs });
  assert.equal(source.getBrowserSnapshot().health.connected, true);
  const dupOpen = await source.open({}, { nowNs });
  assert.equal(dupOpen.ok, false);
  const nav = await source.navigate({}, { nowNs });
  assert.equal(nav.ok, true);
  await source.startRendering({ nowNs });
  const dupStart = await source.startRendering({ nowNs });
  assert.equal(dupStart.ok, false);
  backend.emitConsole({ message: 'Authorization: Bearer abc', cookie: 'x=y' });
  backend.emitNetwork({
    url: 'https://example.com/?token=abc',
    headers: { authorization: 'secret' },
    postBody: 'secret',
  });
  for (let i = 1n; i <= 10_000n; i++)
    backend.emitFrame(createSyntheticBrowserFrame(source as never, i, i * 33_333_333n));
  const batch1 = await source.pull(
    { frameNumber: 10_000n, scheduledTimeNs: 10_000n * 33_333_333n },
    { nowNs },
  );
  assert.equal(batch1.videoFrames.length, 1);
  const batchDup = await source.pull(
    { frameNumber: 10_000n, scheduledTimeNs: 10_000n * 33_333_333n },
    { nowNs },
  );
  assert.equal(batchDup.videoFrames.length, 0);
  const future = await source.pull({ frameNumber: 1_000_000n, scheduledTimeNs: 1n }, { nowNs });
  assert.equal(future.videoFrames.length, 0);
  source.setViewport({
    ...DEFAULT_BROWSER_VIEWPORT,
    width: 640,
    height: 360,
    transparentBackground: true,
  });
  assert.equal(source.getBrowserSnapshot().health.renderGeneration, 1);
  await assert.rejects(
    () => source.executeInteraction!({ kind: 'javascript' }, { nowNs }),
    /JavaScript/,
  );
  await source.executeInteraction!({ kind: 'mouseClick', x: 10, y: 10 }, { nowNs });
  const text = await source.executeInteraction!({ kind: 'textInput', text: 'password' }, { nowNs });
  assert.ok(!JSON.stringify(text).includes('password'));
  backend.crash();
  assert.equal(source.getBrowserSnapshot().health.pageState, 'CRASHED');
  const afterCrash = await source.pull(
    { frameNumber: 2n, scheduledTimeNs: 66_666_666n },
    { nowNs },
  );
  assert.equal(afterCrash.videoFrames.length, 0);
  await source.close({ nowNs });
  backend.emitFrame(createSyntheticBrowserFrame(source as never, 999n, 999n));
  assert.equal(source.getBrowserSnapshot().queue.depth, 0);

  const queue = new BrowserFrameQueue({
    maximumFrames: 2,
    highWaterMark: 2,
    lowWaterMark: 1,
    overflowPolicy: 'DROP_OLDEST',
    maximumFrameAgeNs: 999999999999n,
    targetLatencyFrames: 1,
    preserveLatestFrame: true,
    releaseDroppedFrames: true,
  });
  const s2 = await registry.registerSource(
    createBrowserDescriptor({
      providerId: 'p',
      displayName: 'Two',
      contentReference: {
        kind: 'SYNTHETIC_PAGE',
        referenceId: 'two',
        safeOrigin: 'synthetic://browser',
        syntheticPageId: 'static',
        metadata: {},
      },
    }),
    new SyntheticBrowserRenderBackend(),
    nowNs,
  );
  await s2.open({}, { nowNs });
  await s2.navigate({}, { nowNs });
  queue.enqueue(createSyntheticBrowserFrame(s2 as never, 1n, 1n), 1, 0, 1n);
  queue.enqueue(createSyntheticBrowserFrame(s2 as never, 2n, 2n), 1, 0, 2n);
  queue.enqueue(createSyntheticBrowserFrame(s2 as never, 3n, 3n), 1, 0, 3n);
  assert.equal(queue.snapshot(3n).depth, 2);
  const selected = queue.select(tick(3n), 1, 0);
  assert.equal(selected?.sequenceNumber, 3n);

  for (let i = 0; i < 100_000; i++) {
    registry.getTelemetry();
    registry.assertInvariants();
  }
  const snap = registry.listSnapshots();
  assert.ok(JSON.stringify(snap).includes('synthetic://browser'));
  assert.ok(!/authorization|cookie|password|Bearer abc|postBody/i.test(JSON.stringify(snap)));
  assert.equal(registry.getTelemetry().registeredBrowserSourceCount, 2);
  console.log(
    'browser-source.validation: PASS (110 deterministic browser-source coverage points, 10000 frames, 100000 ticks)',
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
