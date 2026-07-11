const assert = {
  equal(a: unknown, b: unknown, m = 'assert equal') {
    if (a !== b) throw new Error(`${m}: ${String(a)} !== ${String(b)}`);
  },
  deepEqual(a: unknown, b: unknown, m = 'assert deepEqual') {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m);
  },
  ok(v: unknown, m = 'assert ok') {
    if (!v) throw new Error(m);
  },
  throws(fn: () => unknown, pattern: RegExp) {
    try {
      fn();
    } catch (e) {
      if (pattern.test(String((e as Error).message)) || pattern.test(String((e as Error).name)))
        return;
      throw e;
    }
    throw new Error('expected throw');
  },
  async rejects(fn: () => Promise<unknown>, pattern: RegExp) {
    try {
      await fn();
    } catch (e) {
      if (pattern.test(String((e as Error).message)) || pattern.test(String((e as Error).name)))
        return;
      throw e;
    }
    throw new Error('expected rejection');
  },
};
declare const process: { exitCode?: number };
import {
  createSourceAcquisitionManager,
  SyntheticSourceProvider,
  SyntheticMediaSource,
  negotiateSourceFormat,
  createSourceVideoFormat,
  createSourceAudioFormat,
  DeterministicSourceTimestampNormalizer,
  SourceBoundedBuffer,
  SourceAcquisitionProcessor,
  SOURCE_OUTPUT_KEYS,
} from './source-acquisition.js';
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
  const manager = createSourceAcquisitionManager(nowNs, {
    maximumVideoFrames: 2,
    maximumAudioBuffers: 2,
    maximumMetadataSamples: 2,
    highWaterMark: 2,
    lowWaterMark: 0,
    overflowPolicy: 'DROP_OLDEST',
    underflowPolicy: 'RETURN_EMPTY',
  });
  const provider = new SyntheticSourceProvider([
    { id: 'v', mediaKinds: ['VIDEO'] },
    { id: 'a', mediaKinds: ['AUDIO'] },
    { id: 'av', mediaKinds: ['AUDIO_VIDEO'] },
    { id: 'dup-a', mediaKinds: ['AUDIO'], displayName: 'dup' },
  ]);
  manager.registerProvider(provider);
  assert.throws(() => manager.registerProvider(provider), /DuplicateSourceProvider/);
  const discovered = await manager.discover({ mediaKinds: ['VIDEO'] });
  assert.equal(
    discovered.descriptors.some((d) => d.id === 'v'),
    true,
  );
  assert.equal(
    discovered.descriptors.every(
      (d) => d.mediaKinds.includes('VIDEO') || d.mediaKinds.includes('AUDIO_VIDEO'),
    ),
    true,
  );
  const all = await manager.discover();
  assert.deepEqual(
    all.descriptors.map((d) => d.id),
    [...all.descriptors.map((d) => d.id)].sort(),
  );
  const source = await provider.createSource(all.descriptors.find((d) => d.id === 'av')!);
  manager.registerSource(source);
  assert.throws(() => manager.registerSource(source), /DuplicateSource/);
  assert.throws(
    () => Object.assign(manager.getSource('av')!.descriptor, { displayName: 'mutate' }),
    /read only|Cannot assign/,
  );
  await manager.initialize('av');
  await assert.rejects(() => manager.activate('av'), /InvalidSourceLifecycleTransition/);
  await manager.connect('av');
  await manager.activate('av');
  const fmt = await manager.negotiateFormat('av', {
    mediaKind: 'VIDEO',
    preferredPixelFormat: 'RGBA',
  });
  assert.equal(fmt.ok, true);
  const batch = await manager.acquireForTick(tick(1n));
  assert.equal(batch.videoFrames.length, 1);
  assert.equal(batch.audioBuffers.length, 1);
  await manager.deactivate('av');
  await manager.disconnect('av');
  await manager.removeSource('av');
  assert.equal(manager.getSnapshot().sourceCount, 0);
  await manager.shutdown();
  await manager.shutdown();

  const formats = [
    createSourceVideoFormat({ id: 'b', width: 1280, height: 720 }),
    createSourceVideoFormat({ id: 'a', width: 1920, height: 1080 }),
    createSourceVideoFormat({ id: 'c', width: 1920, height: 1080 }),
  ];
  const n1 = negotiateSourceFormat(formats, {
    mediaKind: 'VIDEO',
    requiredConstraints: { width: 1920 },
  }).selectedFormat?.id;
  const n2 = negotiateSourceFormat([...formats].reverse(), {
    mediaKind: 'VIDEO',
    requiredConstraints: { width: 1920 },
  }).selectedFormat?.id;
  assert.equal(n1, n2);
  assert.equal(
    negotiateSourceFormat(formats, { mediaKind: 'VIDEO', requiredConstraints: { width: 999 } }).ok,
    false,
  );
  assert.equal(
    negotiateSourceFormat([createSourceAudioFormat({ id: 'audio' })], {
      mediaKind: 'AUDIO',
      preferredSampleRate: 48000,
    }).ok,
    true,
  );

  const norm = new DeterministicSourceTimestampNormalizer();
  assert.equal(
    norm.normalize(
      { sourceId: 's', clockDomain: 'DEVICE_HARDWARE', timestampNs: 100n, sequenceNumber: 1n },
      tick(1n),
    ).normalizedTimestampNs,
    tick(1n).scheduledTimeNs,
  );
  assert.equal(
    norm.normalize(
      { sourceId: 's', clockDomain: 'DEVICE_HARDWARE', timestampNs: 90n, sequenceNumber: 2n },
      tick(2n),
    ).movedBackward,
    true,
  );
  assert.equal(
    norm.normalize(
      { sourceId: 's', clockDomain: 'DEVICE_HARDWARE', timestampNs: 200n, sequenceNumber: 4n },
      tick(3n),
    ).sequenceGap,
    true,
  );
  norm.reset('RECONNECT');
  assert.equal(norm.getSnapshot().resetCount, 1);

  const b = new SourceBoundedBuffer({
    maximumVideoFrames: 1,
    maximumAudioBuffers: 1,
    maximumMetadataSamples: 1,
    highWaterMark: 1,
    lowWaterMark: 0,
    overflowPolicy: 'DROP_NEWEST',
    underflowPolicy: 'RETURN_EMPTY',
  });
  const s = new SyntheticMediaSource({ id: 'pull-v', mediaKinds: ['VIDEO'] });
  await s.initialize();
  await s.connect();
  await s.activate();
  b.enqueue(await s.pull!({ frameNumber: 1n, scheduledTimeNs: 1n }));
  b.enqueue(await s.pull!({ frameNumber: 2n, scheduledTimeNs: 2n }));
  assert.equal(b.counts().video, 1);
  assert.equal(b.counts().overflows, 1);
  b.drain();
  b.drain();
  assert.equal(b.counts().underflows, 1);

  const long = createSourceAcquisitionManager(nowNs);
  const p2 = new SyntheticSourceProvider([
    { id: 'long-v', mediaKinds: ['VIDEO'], dropEvery: 997, discontinuityEvery: 991 },
    { id: 'long-a', mediaKinds: ['AUDIO'] },
    { id: 'long-av', mediaKinds: ['AUDIO_VIDEO'] },
  ]);
  long.registerProvider(p2);
  for (const d of (await long.discover()).descriptors) {
    const src = await p2.createSource(d);
    long.registerSource(src);
    await long.initialize(d.id);
    await long.connect(d.id);
    await long.activate(d.id);
  }
  for (let i = 0n; i < 100_000n; i++) await long.acquireForTick(tick(i));
  long.assertInvariants();
  assert.equal(long.getSnapshot().telemetry.totalVideoFramesReceived > 10_000, true);
  assert.equal(long.getSnapshot().telemetry.totalAudioBuffersReceived > 10_000, true);
  const outputs = new Map<string, unknown>();
  const processor = new SourceAcquisitionProcessor(long);
  const ctx = {
    outputs: {
      publish: (_p: string, k: string, v: unknown) => outputs.set(k, v),
      read: () => undefined,
      readDependencyOutput: () => undefined,
      clearTick: () => outputs.clear(),
      entryCount: () => outputs.size,
    },
  };
  assert.equal(
    (await processor.processTick(tick(100_001n), ctx as unknown as ProcessorRuntimeContext)).status,
    'SUCCEEDED',
  );
  assert.ok(outputs.has(SOURCE_OUTPUT_KEYS.videoFrames));
  assert.equal(
    (await processor.processTick(tick(100_001n), ctx as unknown as ProcessorRuntimeContext)).status,
    'SKIPPED',
  );
  await long.shutdown();
  assert.equal(long.getSnapshot().sourceCount, 0);
  console.log('source-acquisition validation passed');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
