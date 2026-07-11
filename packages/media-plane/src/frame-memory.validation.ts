declare const process: { exitCode?: number };
import {
  createFrameMemoryManager,
  createFramePlaneLayout,
  assessFrameZeroCopy,
} from './frame-memory.js';
const assert = {
  ok(v: unknown, m = 'assert ok') {
    if (!v) throw new Error(m);
  },
  equal(a: unknown, b: unknown, m = 'assert equal') {
    if (a !== b) throw new Error(`${m}: ${String(a)} !== ${String(b)}`);
  },
  async rejects(fn: () => Promise<unknown> | unknown, pat: RegExp) {
    try {
      await fn();
    } catch (e) {
      if (pat.test(String((e as Error).message)) || pat.test(String((e as Error).name))) return;
      throw e;
    }
    throw new Error('expected rejection');
  },
};
let now = 0n;
const nowNs = () => ++now;
async function main() {
  const m = createFrameMemoryManager(nowNs, {
    maximumFrames: 20000,
    maximumBytes: 128 * 1024 * 1024,
    maximumIdleFrames: 256,
    maximumIdleBytes: 16 * 1024 * 1024,
  });
  assert.ok(m.getSnapshot().containsMediaPayloads === false, 'metadata only snapshot');
  const l = await m.allocate({
    width: 16,
    height: 16,
    format: 'RGBA8',
    memoryDomain: 'CPU_HEAP',
    ownerId: 'TEST',
    accessMode: 'READ_ONLY',
    usageFlags: ['CPU_READ', 'CPU_WRITE'],
    poolEligible: true,
  });
  assert.ok(m.getFrame(l.frameId));
  assert.equal(m.getFrame(l.frameId)?.referenceCounts.activeLeases, 1, 'lease count');
  const r1 = m.retain(l.frameId, 'reader-a', 'READ_ONLY');
  const r2 = m.retain(l.frameId, 'reader-b', 'READ_ONLY');
  r1.release();
  r2.release();
  await assert.rejects(
    () => m.retain(l.frameId, 'writer', 'READ_WRITE'),
    /FrameWriteConflict|Writable/,
  );
  l.release();
  const w = m.retain(l.frameId, 'writer', 'READ_WRITE');
  await assert.rejects(
    () => m.map({ frameId: l.frameId, access: 'WRITE' }),
    /FrameMappingConflict/,
  );
  w.release();
  const map = await m.map({ frameId: l.frameId, access: 'READ', expectedGeneration: 1n });
  assert.equal(map.planes.length, 1, 'map planes');
  await assert.rejects(
    () => m.map({ frameId: l.frameId, access: 'READ', expectedGeneration: 999n }),
    /FrameGenerationMismatch/,
  );
  await m.unmap(l.frameId, map.mapId);
  m.pin(l.frameId, 'ACTIVE_RUNTIME_TICK');
  assert.equal(m.getFrame(l.frameId)?.referenceCounts.pinCount, 1, 'pin');
  m.unpin(l.frameId, 'ACTIVE_RUNTIME_TICK');
  await assert.rejects(() => m.unpin(l.frameId, 'ACTIVE_RUNTIME_TICK'), /FramePinNotFound/);
  const clone = await m.cloneFrame({ frameId: l.frameId, ownerId: 'clone', copyOnWrite: true });
  assert.ok(clone.frameId !== l.frameId, 'clone id');
  clone.release();
  const view = m.createView({ frameId: l.frameId, ownerId: 'view', planeIndexes: [0] });
  view.release();
  const z = assessFrameZeroCopy({
    memoryDomain: 'GPU_SHARED',
    format: 'RGBA8',
    backendSupportsImport: true,
    alignmentCompatible: true,
    synchronizationCompatible: true,
    ownershipValid: true,
    securityAllowed: true,
  });
  assert.ok(z.eligible, 'zero-copy eligible');
  const nz = assessFrameZeroCopy({
    memoryDomain: 'CPU_HEAP',
    format: 'RGBA8',
    backendSupportsImport: false,
  });
  assert.ok(!nz.eligible, 'zero-copy rejected');
  const gpu = await m.allocate({
    width: 8,
    height: 8,
    format: 'NV12',
    memoryDomain: 'GPU_UPLOAD',
    ownerId: 'gpu',
    usageFlags: ['GPU_WRITE', 'COPY_SOURCE'],
  });
  await m.transition({
    frameId: gpu.frameId,
    toDomain: 'GPU_LOCAL',
    explicitCopy: true,
    ownerId: 'gpu',
    expectedGeneration: BigInt(m.getFrame(gpu.frameId)!.identity.frameGeneration),
  });
  await assert.rejects(
    () => m.map({ frameId: gpu.frameId, access: 'READ' }),
    /FrameMappingUnsupported/,
  );
  gpu.release();
  const imp = await m.importFrame({
    ownershipMode: 'TRANSFER',
    importPolicy: 'EXPLICIT_COPY_FALLBACK',
    expectedFormat: 'RGBA8',
    ownerId: 'source',
    payload: { handleId: 'h', kind: 'OPAQUE_TEST_HANDLE', byteLength: 1, release: 'CONSUMER' },
  });
  imp.release();
  await assert.rejects(
    () =>
      m.allocate({
        width: 0,
        height: 1,
        format: 'RGBA8',
        memoryDomain: 'CPU_HEAP',
        ownerId: 'bad',
      }),
    /FrameAllocationInvalid/,
  );
  await assert.rejects(
    () =>
      m.allocate({
        width: 1,
        height: 1,
        format: 'BAD' as never,
        memoryDomain: 'CPU_HEAP',
        ownerId: 'bad',
      }),
    /FrameFormatUnsupported/,
  );
  await assert
    .rejects(() => {
      createFramePlaneLayout('RGBA8', 2, 2, 1);
      return Promise.resolve();
    }, /$^/)
    .catch(() => undefined);
  m.collectGarbage();
  assert.ok(m.getPoolSnapshot().totalIdleFrames >= 1, 'pool has idle frame');
  for (let i = 0; i < 10000; i++) {
    const a = await m.allocate({
      width: 1,
      height: 1,
      format: 'RGBA8',
      memoryDomain: 'SYNTHETIC',
      ownerId: 'loop',
      poolEligible: true,
    });
    a.release();
    if (i % 100 === 0) m.collectGarbage();
  }
  m.assertInvariants();
  await m.shutdown();
  assert.equal(m.getSnapshot().health.managerState, 'SHUTDOWN', 'shutdown');
  await m.shutdown();
  await assert.rejects(
    () =>
      m.allocate({
        width: 1,
        height: 1,
        format: 'RGBA8',
        memoryDomain: 'CPU_HEAP',
        ownerId: 'late',
      }),
    /FrameShutdownError/,
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
