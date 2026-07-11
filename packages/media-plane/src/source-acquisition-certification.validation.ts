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
      if (pattern.test(String((e as Error).message))) return;
      throw e;
    }
    throw new Error('expected throw');
  },
};
declare const process: { exitCode?: number };
import {
  createSourceAcquisitionManager,
  SyntheticSourceProvider,
  SourceAcquisitionProcessor,
  SOURCE_OUTPUT_KEYS,
} from './source-acquisition.js';
import { createSourceGraphManager, sourceGraphIds } from './source-graph.js';
import type { ProcessorRuntimeContext } from './execution-engine.js';

const tick = (n: bigint) => ({
  frameNumber: n,
  startedAtNs: n * 33_333_333n,
  deadlineAtNs: n * 33_333_333n,
  scheduledTimeNs: n * 33_333_333n,
  actualTimeNs: n * 33_333_333n,
  presentationTimeNs: n * 33_333_333n,
  frameDurationNs: 33_333_333n,
  late: false,
  driftNs: 0n,
  latenessNs: 0n,
  missedFrames: 0n,
  discontinuity: false,
});
let now = 0n;
const nowNs = () => (now += 1_000_000n);

async function main() {
  const configs = [
    { id: 'camera-a', mediaKinds: ['VIDEO'] as const, sourceType: 'CAMERA' as const },
    { id: 'camera-b', mediaKinds: ['VIDEO'] as const, sourceType: 'CAMERA' as const },
    { id: 'file-a', mediaKinds: ['AUDIO_VIDEO'] as const, sourceType: 'FILE' as const },
    { id: 'file-b', mediaKinds: ['AUDIO_VIDEO'] as const, sourceType: 'FILE' as const },
    { id: 'browser-a', mediaKinds: ['VIDEO'] as const, sourceType: 'BROWSER' as const },
    { id: 'browser-b', mediaKinds: ['VIDEO'] as const, sourceType: 'BROWSER' as const },
    { id: 'screen-a', mediaKinds: ['VIDEO'] as const, sourceType: 'SCREEN' as const },
    { id: 'screen-b', mediaKinds: ['VIDEO'] as const, sourceType: 'SCREEN' as const },
    { id: 'mic-a', mediaKinds: ['AUDIO'] as const, sourceType: 'AUDIO_DEVICE' as const },
    { id: 'mic-b', mediaKinds: ['AUDIO'] as const, sourceType: 'AUDIO_DEVICE' as const },
    { id: 'desktop-audio', mediaKinds: ['AUDIO'] as const, sourceType: 'DESKTOP_AUDIO' as const },
    { id: 'network-ndi', mediaKinds: ['AUDIO_VIDEO'] as const, sourceType: 'NDI' as const },
    { id: 'network-srt', mediaKinds: ['AUDIO_VIDEO'] as const, sourceType: 'SRT' as const },
  ];
  const manager = createSourceAcquisitionManager(nowNs, {
    maximumVideoFrames: 4,
    maximumAudioBuffers: 4,
    maximumMetadataSamples: 4,
    highWaterMark: 4,
    lowWaterMark: 1,
    overflowPolicy: 'DROP_OLDEST',
    underflowPolicy: 'RETURN_EMPTY',
  });
  const provider = new SyntheticSourceProvider(configs, 'certification-source-provider');
  manager.registerProvider(provider);
  for (const d of (await manager.discover()).descriptors) {
    const src = await provider.createSource(d);
    manager.registerSource(src);
    await manager.initialize(d.id);
    await manager.connect(d.id);
    await manager.activate(d.id);
  }
  const expectedOrder = manager.getSnapshot().orderedSourceIds.join('|');
  const seen = new Set<string>();
  let video = 0,
    audio = 0;
  for (let i = 0n; i < 100_000n; i++) {
    const batch = await manager.acquireForTick(tick(i));
    assert.equal(
      manager.getSnapshot().orderedSourceIds.join('|'),
      expectedOrder,
      'stable ordering',
    );
    for (const f of batch.videoFrames) {
      const key = `v:${f.sourceId}:${f.sequenceNumber}`;
      assert.equal(seen.has(key), false, 'duplicate video publication');
      seen.add(key);
      assert.equal(f.normalizedTimestampNs, f.sourceTimestampNs, 'video timestamp normalized');
      video++;
    }
    for (const a of batch.audioBuffers) {
      const key = `a:${a.sourceId}:${a.sequenceNumber}`;
      assert.equal(seen.has(key), false, 'duplicate audio publication');
      seen.add(key);
      assert.equal(a.normalizedTimestampNs, a.sourceTimestampNs, 'audio timestamp normalized');
      audio++;
    }
  }
  manager.assertInvariants();
  const snapshot = manager.getSnapshot();
  assert.equal(snapshot.sourceCount, configs.length, 'registered source count');
  assert.equal(snapshot.totalBufferedSamples <= configs.length * 8, true, 'bounded queues');
  assert.equal(snapshot.telemetry.totalVideoFramesReceived, video, 'video telemetry aggregation');
  assert.equal(snapshot.telemetry.totalAudioBuffersReceived, audio, 'audio telemetry aggregation');
  assert.equal(
    snapshot.telemetry.activeSourceIds.join('|'),
    expectedOrder,
    'active source deterministic order',
  );

  const graph = createSourceGraphManager(nowNs);
  const sync = graph.syncFromSourceSnapshot(snapshot);
  assert.equal(sync.ok, true, 'graph sync');
  const graphReport = graph.validate();
  assert.equal(graphReport.valid, true, 'graph validation');
  for (const id of snapshot.orderedSourceIds) {
    assert.ok(graph.getNode(sourceGraphIds.descriptor(id)), `descriptor node ${id}`);
    assert.ok(graph.getNode(sourceGraphIds.instance(id)), `instance node ${id}`);
  }

  const metrics = new Map<string, bigint>();
  const measure = async (name: string, fn: () => void | Promise<void>, iterations = 1000) => {
    const start = nowNs();
    for (let i = 0; i < iterations; i++) await fn();
    metrics.set(name, (nowNs() - start) / BigInt(iterations));
  };
  await measure('source lookup O(1)', () => {
    manager.getSource('camera-a');
  });
  await measure('graph lookup O(1)', () => {
    graph.getNode(sourceGraphIds.instance('camera-a'));
  });
  await measure(
    'snapshot O(n)',
    () => {
      manager.getSnapshot();
    },
    100,
  );
  await measure(
    'watchdog O(n)',
    () => {
      manager.assertInvariants();
    },
    100,
  );
  await measure(
    'mixed-source runtime tick O(n)',
    async () => {
      await manager.acquireForTick(tick(100_001n));
    },
    10,
  );

  const publishes = new Set<string>();
  const processor = new SourceAcquisitionProcessor(manager);
  const ctx = {
    outputs: {
      publish: (p: string, k: string) => {
        const key = `${p}:${k}`;
        assert.equal(publishes.has(key), false, 'duplicate processor output');
        publishes.add(key);
      },
      read: () => undefined,
      readDependencyOutput: () => undefined,
      clearTick: () => publishes.clear(),
      entryCount: () => publishes.size,
    },
  };
  assert.equal(
    (await processor.processTick(tick(200_000n), ctx as unknown as ProcessorRuntimeContext)).status,
    'SUCCEEDED',
  );
  assert.ok(publishes.has(`source-acquisition-processor:${SOURCE_OUTPUT_KEYS.videoFrames}`));
  assert.equal(
    (await processor.processTick(tick(200_000n), ctx as unknown as ProcessorRuntimeContext)).status,
    'SKIPPED',
  );

  await manager.shutdown();
  assert.equal(manager.getSnapshot().managerState, 'STOPPED');
  const resurrect = await provider.createSource(
    (await provider.discover({}, { nowNs })).descriptors[0]!,
  );
  assert.throws(() => manager.registerSource(resurrect), /stopped/i);
  console.log(
    `source-acquisition-certification validation passed: ${JSON.stringify(Object.fromEntries([...metrics].map(([k, v]) => [k, v.toString()])))}`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
