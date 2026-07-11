const assert = (value: unknown, message = 'assertion failed'): asserts value => {
  if (!value) throw new Error(message);
};
assert.equal = (actual: unknown, expected: unknown) => {
  if (actual !== expected)
    throw new Error(`assert equal failed: ${String(actual)} !== ${String(expected)}`);
};
assert.throws = (fn: () => unknown, pattern: RegExp) => {
  try {
    fn();
  } catch (e) {
    if (pattern.test(e instanceof Error ? e.message : String(e))) return;
    throw e;
  }
  throw new Error('expected throw');
};
import { DefaultSourceAcquisitionManager } from './source-acquisition.js';
import {
  DefaultFileMediaSource,
  SyntheticFileBackend,
  SyntheticFileSourceProvider,
  createFileSourceDescriptor,
  evaluateFileWatchdog,
  normalizeFileLocation,
  type FileBackendContext,
  type FileBackendOpenRequest,
  type FileBackendReadRequest,
  type FileSampleBatch,
} from './file-source.js';
import type { FrameTick } from './execution-engine.js';

const nowNs = (() => {
  let n = 0n;
  return () => (n += 33_333_333n);
})();
const tick = (i: number): FrameTick => ({
  frameNumber: BigInt(i),
  startedAtNs: nowNs(),
  deadlineAtNs: nowNs(),
  scheduledTimeNs: nowNs(),
  actualTimeNs: nowNs(),
  presentationTimeNs: nowNs(),
  frameDurationNs: 33_333_333n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});

const loc = normalizeFileLocation('synthetic:av-demo');
const provider = new SyntheticFileSourceProvider();
provider.registerAsset({ assetId: 'av-demo', kind: 'AUDIO_VIDEO', durationNs: 300_000_000n });
assert.throws(() => provider.registerAsset({ assetId: 'av-demo', kind: 'VIDEO' }), /Duplicate/);
assert.throws(() => normalizeFileLocation('../secret.mov'), /outside/);
assert.throws(() => normalizeFileLocation('https://example.invalid/a.mov'), /unsupported/);
assert.equal(loc.redactedReference.includes('/Users/'), false);
const probe = await provider.probe({ location: loc }, { nowNs });
assert.equal(probe.ok, true);
assert.equal(probe.streams.length, 2);
const desc = createFileSourceDescriptor(provider.descriptor.id, loc, probe, 'AV Demo');
assert(Object.isFrozen(desc));
assert.equal(
  desc.identity.assetId,
  createFileSourceDescriptor(provider.descriptor.id, loc, probe).identity.assetId,
);
const source = await provider.createFileSource(desc, { nowNs });
assert.throws(() => source.selectStreams({ videoStreamIds: ['missing'] }), /not found/i);
await source.initialize({ nowNs });
assert.equal(source.getFileSnapshot().playbackState, 'READY');
assert.equal(source.getFileSnapshot().health.connected, false);
assert.equal((await source.open({}, { nowNs })).ok, true);
assert.equal(source.getFileSnapshot().playbackState, 'READY');
assert.equal((await source.play({ nowNs })).ok, true);
await source.activate({ nowNs });
const b1 = await source.pull?.({ frameNumber: 1n, scheduledTimeNs: nowNs() }, { nowNs });
assert(b1 && b1.videoFrames.length <= 1);
assert.equal((await source.pause({ nowNs })).ok, true);
const paused = await source.pull?.({ frameNumber: 2n, scheduledTimeNs: nowNs() }, { nowNs });
assert.equal(paused?.videoFrames.length, 0);
const seek = await source.seek(
  { mode: 'ABSOLUTE', positionNs: 100_000_000n, alignment: 'EXACT' },
  { nowNs },
);
assert.equal(seek.ok, true);
assert.equal(seek.seekGeneration, 1);
assert.equal(
  (
    await source.seek(
      { mode: 'FROM_END', positionNs: 1_000_000_000n, alignment: 'EXACT' },
      { nowNs },
    )
  ).ok,
  false,
);
assert.equal(source.setPlaybackRate(2).ok, false);
assert.equal(source.setLoop({ enabled: true, startNs: 0n, endNs: 200_000_000n }).ok, true);
assert.equal((await source.play({ nowNs })).ok, true);
for (let i = 0; i < 12; i++)
  await source.pull?.({ frameNumber: BigInt(i + 3), scheduledTimeNs: nowNs() }, { nowNs });
source.assertInvariants();
assert.equal(evaluateFileWatchdog(source.getFileSnapshot()).includes('FILE_QUEUE_OVERFLOW'), false);
assert.equal((await source.stopPlayback({ nowNs })).ok, true);
assert.equal((await source.close({ nowNs })).ok, true);
const afterClose = await source.pull?.({ frameNumber: 99n, scheduledTimeNs: nowNs() }, { nowNs });
assert.equal(afterClose?.videoFrames.length, 0);

class DeferredReadBackend extends SyntheticFileBackend {
  resolvers: Array<(batch: FileSampleBatch) => void> = [];
  activeReads = 0;
  maxActiveReads = 0;
  async read(
    request: FileBackendReadRequest,
    context: FileBackendContext,
  ): Promise<FileSampleBatch> {
    this.activeReads++;
    this.maxActiveReads = Math.max(this.maxActiveReads, this.activeReads);
    const batchPromise = super.read(request, context);
    return new Promise((resolve) => {
      this.resolvers.push((batch) => {
        this.activeReads--;
        resolve(batch);
      });
      void batchPromise.then(
        (batch) =>
          (this.resolvers[this.resolvers.length - 1] = () => {
            this.activeReads--;
            resolve(batch);
          }),
      );
    });
  }
}

const lateBackend = new DeferredReadBackend({
  assetId: 'late',
  kind: 'VIDEO',
  durationNs: 500_000_000n,
});
const lateLoc = normalizeFileLocation('synthetic:late');
const lateDesc = createFileSourceDescriptor(
  'synthetic-file-provider',
  lateLoc,
  await lateBackend.probe({ location: lateLoc }, { nowNs }),
  'Late',
);
const lateSource = new DefaultFileMediaSource(lateDesc, lateBackend, nowNs);
await lateSource.initialize({ nowNs });
await lateSource.open({}, { nowNs });
await lateSource.activate({ nowNs });
await lateSource.play({ nowNs });
const pending = lateSource.pull({ frameNumber: 1n, scheduledTimeNs: nowNs() }, { nowNs });
assert.equal(lateBackend.maxActiveReads, 1);
assert.equal((await lateSource.seek({ mode: 'TO_START', alignment: 'EXACT' }, { nowNs })).ok, true);
lateBackend.resolvers
  .splice(0)
  .forEach((r) => r({ videoFrames: [], audioBuffers: [], metadataSamples: [] }));
const lateBatch = await pending;
assert.equal(lateBatch.videoFrames.length, 0);
await lateSource.close({ nowNs });
assert.equal(lateBackend.health(nowNs).retainedHandles, 0);
assert.equal(lateBackend.health(nowNs).failures, 0);

const manager = new DefaultSourceAcquisitionManager(nowNs);
const longProvider = new SyntheticFileSourceProvider();
longProvider.registerAsset({ assetId: 'video-100k', kind: 'VIDEO', durationNs: 10_000_000_000n });
longProvider.registerAsset({ assetId: 'audio-100k', kind: 'AUDIO', durationNs: 10_000_000_000n });
longProvider.registerAsset({
  assetId: 'av-100k',
  kind: 'AUDIO_VIDEO',
  durationNs: 10_000_000_000n,
});
manager.registerProvider(longProvider);
const longSources = [];
for (const assetId of ['video-100k', 'audio-100k', 'av-100k']) {
  const location = normalizeFileLocation(`synthetic:${assetId}`);
  const result = await longProvider.probe({ location }, { nowNs });
  const fd = createFileSourceDescriptor(longProvider.descriptor.id, location, result, assetId);
  const s = await longProvider.createFileSource(fd, { nowNs });
  s.setLoop({ enabled: true, startNs: 0n, endNs: 500_000_000n, infinite: true });
  manager.registerSource(s);
  await manager.initialize(s.descriptor.id);
  await manager.connect(s.descriptor.id);
  await manager.activate(s.descriptor.id);
  await s.play({ nowNs });
  longSources.push(s);
}
const published = new Set<string>();
for (let i = 0; i < 100_000; i++) {
  const batch = await manager.acquireForTick(tick(i));
  for (const v of batch.videoFrames) {
    const key = `${i}:${v.sourceId}:${v.streamId}:${v.sequenceNumber.toString()}`;
    assert(!published.has(key), 'duplicate same-tick video publication');
    published.add(key);
  }
  for (const s of longSources) {
    const snap = s.getFileSnapshot();
    assert(snap.queues.videoDepth <= snap.queues.maximumVideoFrames, 'video queue bounded');
    assert(snap.queues.audioDepth <= snap.queues.maximumAudioBuffers, 'audio queue bounded');
    assert(snap.health.sourceHealth !== 'FAILED', 'EOF must not fail source');
  }
}
for (const s of longSources) {
  assert.equal((await s.stopPlayback({ nowNs })).ok, true);
  assert.equal((await s.close({ nowNs })).ok, true);
}
await manager.shutdown();
const health = longProvider.getBackendHealth();
assert.equal(health.retainedHandles, 0);
assert.equal(health.failures, 0);
console.log('file-source validation passed');
