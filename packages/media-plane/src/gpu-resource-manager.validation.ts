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
  GpuResourceManager,
  MockGpuBackend,
  type TextureDescriptor,
} from './gpu-resource-manager.js';

const texture: TextureDescriptor = Object.freeze({
  width: 1920,
  height: 1080,
  format: 'RGBA8',
  usage: ['VIDEO', 'SAMPLED'] as const,
  mipLevels: 1,
  sampleCount: 1,
  colorSpace: 'REC709',
  memory: 'GPU',
});

function main() {
  const backend = new MockGpuBackend();
  const manager = new GpuResourceManager(backend, {
    videoTextures: 3,
    intermediateTextures: 2,
    framebuffers: 1,
    depthBuffers: 1,
    uploadBuffers: 2,
    readbackBuffers: 1,
    commandAllocators: 2,
    descriptorHeaps: 1,
  });
  assert.equal(manager.enumerateAdapters()[0]?.api, 'Mock');
  manager.initialize();
  const a = manager.allocateTexture(texture, 'videoTextures', 1);
  assert.equal(a.state, 'IN_USE');
  assert.equal(a.refCount, 1);
  assert.throws(() => manager.release('missing'), /GpuDoubleRelease/);
  manager.release(a.id);
  assert.throws(() => manager.release(a.id), /GpuDoubleRelease/);
  const b = manager.allocateTexture(texture, 'videoTextures', 2);
  assert.equal(b.id, a.id, 'texture reused');
  assert.ok(b.generation > a.generation, 'generation increments on reuse');
  const c = manager.allocateTexture({ ...texture, width: 1280 }, 'videoTextures', 2);
  const d = manager.allocateTexture({ ...texture, width: 640 }, 'videoTextures', 2);
  assert.throws(
    () => manager.allocateTexture({ ...texture, width: 320 }, 'videoTextures', 2),
    /GpuPoolExhausted/,
  );
  const ctx = manager.createFrameContext(7);
  manager.submitFrame(ctx);
  manager.signalFence(ctx.fenceValue);
  assert.equal(manager.snapshotDevice().queue.fence.completedValue, ctx.fenceValue);
  manager.release(ctx.commandList.id);
  manager.release(ctx.uploadSpace.id);
  manager.release(b.id);
  manager.release(c.id);
  manager.release(d.id);
  assert.ok(manager.validateInvariants().valid);

  const importManager = new GpuResourceManager(new MockGpuBackend(), {
    videoTextures: 1,
    intermediateTextures: 1,
    framebuffers: 1,
    depthBuffers: 1,
    uploadBuffers: 1,
    readbackBuffers: 1,
    commandAllocators: 1,
    descriptorHeaps: 1,
  });
  importManager.initialize();
  const imported = importManager.importVideoFrame(
    { mode: 'SYNTHETIC', width: 320, height: 180, format: 'BGRA8', timestampNs: 10n },
    9,
  );
  importManager.release(imported.id);
  assert.equal(importManager.getTelemetry().frameUploads, 1);
  backend.loseDevice();
  manager.reset();
  assert.equal(manager.snapshotDevice().lost, false);
  assert.equal(manager.getTelemetry().recoveryEvents, 1);

  const longRun = new GpuResourceManager(new MockGpuBackend(), {
    videoTextures: 2,
    intermediateTextures: 2,
    framebuffers: 1,
    depthBuffers: 1,
    uploadBuffers: 2,
    readbackBuffers: 1,
    commandAllocators: 2,
    descriptorHeaps: 1,
  });
  longRun.initialize();
  for (let i = 0; i < 100_000; i++) {
    const h = longRun.importVideoFrame(
      { mode: 'SYNTHETIC', width: 320, height: 180, format: 'BGRA8', timestampNs: BigInt(i) },
      i,
    );
    longRun.release(h.id);
  }
  const telemetry = longRun.getTelemetry();
  assert.equal(telemetry.frameUploads, 100_000);
  assert.ok(telemetry.textureReuse > 99_000, 'long run should reuse textures');
  assert.ok(longRun.validateInvariants().valid, 'long run invariants');
  longRun.shutdown();
  importManager.shutdown();
  manager.shutdown();
  assert.equal(manager.validateInvariants().valid, true);
  console.log(
    'GPU resource manager validation passed',
    JSON.stringify({
      frameUploads: telemetry.frameUploads,
      textureReuse: telemetry.textureReuse,
      peakTextures: telemetry.peakTextures,
    }),
  );
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
