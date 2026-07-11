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
  async rejects(fn: () => Promise<unknown>, pattern: RegExp) {
    try {
      await fn();
    } catch (e) {
      if (pattern.test(String((e as Error).message))) return;
      throw e;
    }
    throw new Error('expected rejection');
  },
};
declare const process: { exitCode?: number };
import { createSourceAcquisitionManager } from './source-acquisition.js';
import {
  DefaultCameraSource,
  SyntheticCameraBackend,
  SyntheticCameraProvider,
  createCameraVideoFormat,
  defaultCameraBufferConfiguration,
  negotiateCameraFormat,
  mapDeviceToCameraDescriptor,
  CameraFrameHandle,
  CAMERA_COMMAND_TYPES,
  CAMERA_WATCHDOG_INCIDENTS,
} from './camera-source.js';

let now = 0n;
const nowNs = () => (now += 1_000_000n);
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
const fmt = createCameraVideoFormat({
  id: 'f-720p30-rgba',
  width: 1280,
  height: 720,
  frameRate: { numerator: 30, denominator: 1 },
  pixelFormat: 'RGBA32',
});
const fmt2 = createCameraVideoFormat({
  id: 'f-1080p60-nv12',
  width: 1920,
  height: 1080,
  frameRate: { numerator: 60, denominator: 1 },
  pixelFormat: 'NV12',
});

async function main() {
  assert.ok(CAMERA_COMMAND_TYPES.includes('CAMERA_OPEN'));
  assert.ok(CAMERA_WATCHDOG_INCIDENTS.includes('CAMERA_QUEUE_OVERFLOW'));
  const provider = new SyntheticCameraProvider(
    [
      {
        sourceId: 'camera:test',
        streamId: 'camera:test:video:0',
        supportedFormats: [fmt2, fmt],
        defaultFormat: fmt,
      },
    ],
    fmt,
  );
  const devices = await provider.listCameraDevices({ nowNs });
  assert.equal(devices.length, 1);
  assert.throws(
    () => Object.assign(devices[0]!, { displayName: 'mutate' }),
    /read only|Cannot assign/,
  );
  const discovered = await provider.discover({}, { nowNs });
  assert.equal(discovered.descriptors[0]!.id, 'camera:test');
  const source = await provider.createCameraSource(devices[0]!, { nowNs });
  assert.equal(source.getCameraSnapshot().lifecycleState, 'REGISTERED');
  const deniedProvider = new SyntheticCameraProvider(
    [
      {
        sourceId: 'camera:denied',
        permissionState: 'DENIED',
        defaultFormat: fmt,
        supportedFormats: [fmt],
      },
    ],
    fmt,
  );
  const denied = await deniedProvider.createCameraSource(
    (await deniedProvider.listCameraDevices({ nowNs }))[0]!,
    { nowNs },
  );
  await assert.rejects(() => denied.open({}, { nowNs }), /permission denied/i);
  const negotiation = negotiateCameraFormat([fmt, fmt2], {
    preferredResolution: { width: 1920, height: 1080 },
    preferredPixelFormats: ['NV12'],
  });
  assert.equal(negotiation.ok, true);
  assert.equal(negotiation.selectedFormat!.id, fmt2.id);
  const rejected = negotiateCameraFormat([fmt], { exactResolution: { width: 1, height: 1 } });
  assert.equal(rejected.ok, false);
  assert.equal(rejected.rejectedFormats.length, 1);
  const h = new CameraFrameHandle('h');
  h.release();
  assert.throws(() => h.release(), /ownership|released twice/i);

  const backend = new SyntheticCameraBackend({
    format: fmt,
    corruptedEvery: 7,
    timestampRegressionEvery: 11,
    discontinuityEvery: 13,
  });
  const camera = new DefaultCameraSource(devices[0]!, backend, {
    ...defaultCameraBufferConfiguration,
    maximumFrames: 2,
    highWaterMark: 2,
    maximumFrameAgeNs: 500_000_000n,
  });
  await camera.open({ format: fmt }, { nowNs });
  await camera.startCapture({ nowNs });
  for (let i = 0; i < 10; i++) backend.emitFrame(nowNs());
  const snap = camera.getCameraSnapshot();
  assert.ok(snap.queue.depth <= 2);
  assert.ok(snap.queue.droppedOldest > 0);
  let batch = await camera.pull(
    { frameNumber: 1n, scheduledTimeNs: 1_000_000_000n },
    { nowNs, frameTick: tick(30n) },
  );
  assert.ok(batch.videoFrames.length <= 1);
  await camera.stopCapture({ nowNs });
  backend.emitLateFrame(nowNs());
  batch = await camera.pull(
    { frameNumber: 2n, scheduledTimeNs: 2_000_000_000n },
    { nowNs, frameTick: tick(60n) },
  );
  assert.equal(batch.videoFrames.length, 0);
  await camera.close({ nowNs });
  camera.assertInvariants();

  const manager = createSourceAcquisitionManager(nowNs, {
    maximumVideoFrames: 4,
    maximumAudioBuffers: 0,
    maximumMetadataSamples: 0,
    highWaterMark: 2,
    lowWaterMark: 0,
    overflowPolicy: 'DROP_OLDEST',
    underflowPolicy: 'RETURN_EMPTY',
  });
  manager.registerProvider(provider);
  manager.registerSource(source);
  await manager.initialize('camera:test');
  await manager.connect('camera:test');
  await manager.activate('camera:test');
  assert.equal(provider.getBackendHealth().open, true);
  await manager.acquireForTick(tick(1n));
  assert.equal(manager.getSnapshot().invariantStatus, 'OK');
  const mapped = mapDeviceToCameraDescriptor(
    {
      id: 'dev1',
      providerId: 'p',
      type: 'VIDEO_INPUT',
      displayName: 'USB Cam',
      transport: 'USB',
      capabilities: { video: true },
      permissionState: 'GRANTED',
      hotPluggable: true,
      metadata: { serialNumber: 'secret' },
    } as never,
    [fmt],
    'p',
  );
  assert.ok(mapped);
  assert.equal(JSON.stringify(mapped).includes('secret'), false);
  for (let i = 0; i < 10_000; i++) backend.emitFrame(nowNs());
  camera.assertInvariants();


  // Production-safety regression audit: discarded frames must release their backend handle exactly once.
  for (const policy of ['DROP_OLDEST', 'DROP_NEWEST', 'KEEP_LATEST_VIDEO'] as const) {
    const auditBackend = new SyntheticCameraBackend({ format: fmt, backendId: `audit:${policy}` });
    const auditCamera = new DefaultCameraSource(devices[0]!, auditBackend, {
      ...defaultCameraBufferConfiguration,
      maximumFrames: 1,
      highWaterMark: 1,
      overflowPolicy: policy,
      maximumFrameAgeNs: 1_000_000_000n,
    });
    await auditCamera.open({ format: fmt }, { nowNs });
    await auditCamera.startCapture({ nowNs });
    auditBackend.emitFrame(nowNs());
    auditBackend.emitFrame(nowNs());
    await auditCamera.stopCapture({ nowNs });
    assert.equal(auditBackend.releasedHandleCount, auditBackend.emittedFrameCount, `${policy} releases discarded handles`);
    assert.equal(auditBackend.hasActiveCallback, false, `${policy} clears callback on stop`);
    auditCamera.assertInvariants();
  }

  const staleBackend = new SyntheticCameraBackend({ format: fmt, backendId: 'audit:stale' });
  const staleCamera = new DefaultCameraSource(devices[0]!, staleBackend, {
    ...defaultCameraBufferConfiguration,
    maximumFrames: 4,
    maximumFrameAgeNs: 1n,
  });
  await staleCamera.open({ format: fmt }, { nowNs });
  await staleCamera.startCapture({ nowNs });
  staleBackend.emitFrame(nowNs());
  await staleCamera.pull({ frameNumber: 3n, scheduledTimeNs: 3_000_000_000n }, { nowNs, frameTick: tick(90n) });
  assert.equal(staleBackend.releasedHandleCount, staleBackend.emittedFrameCount, 'stale removal releases handles');
  await staleCamera.close({ nowNs });
  assert.equal(staleBackend.getHealth().open, false, 'close leaves no open backend');
  assert.equal(staleBackend.hasActiveCallback, false, 'close leaves no active callback');
  staleCamera.assertInvariants();

  const lateBackend = new SyntheticCameraBackend({ format: fmt, backendId: 'audit:late' });
  const lateCamera = new DefaultCameraSource(devices[0]!, lateBackend, defaultCameraBufferConfiguration);
  await lateCamera.open({ format: fmt }, { nowNs });
  await lateCamera.startCapture({ nowNs });
  lateBackend.emitFrame(nowNs());
  await lateCamera.stopCapture({ nowNs });
  lateBackend.emitFrame(nowNs());
  assert.equal(lateCamera.getCameraSnapshot().queue.depth, 0, 'late callback after stop cannot enqueue');
  assert.equal(lateBackend.hasActiveCallback, false, 'late callback stop clears backend callback');

  const failureBackend = new SyntheticCameraBackend({ format: fmt, backendId: 'audit:failure' });
  const failureCamera = new DefaultCameraSource(devices[0]!, failureBackend, defaultCameraBufferConfiguration);
  await failureCamera.open({ format: fmt }, { nowNs });
  await failureCamera.startCapture({ nowNs });
  failureBackend.emitFrame(nowNs());
  await failureCamera.shutdown({ nowNs });
  assert.equal(failureBackend.getHealth().open, false, 'shutdown leaves no open backend');
  assert.equal(failureBackend.hasActiveCallback, false, 'shutdown leaves no callback');
  assert.equal(failureCamera.getCameraSnapshot().queue.depth, 0, 'shutdown leaves no queued frame');
  assert.equal(failureBackend.releasedHandleCount, failureBackend.emittedFrameCount, 'shutdown releases retained handles');
  failureCamera.assertInvariants();

  const tickBackend = new SyntheticCameraBackend({ format: fmt, backendId: 'audit:tick' });
  const tickCamera = new DefaultCameraSource(devices[0]!, tickBackend, {
    ...defaultCameraBufferConfiguration,
    maximumFrames: 8,
  });
  await tickCamera.open({ format: fmt }, { nowNs });
  await tickCamera.startCapture({ nowNs });
  tickBackend.emitFrame(nowNs());
  tickBackend.emitFrame(nowNs());
  const once = await tickCamera.pull({ frameNumber: 4n, scheduledTimeNs: 4_000_000_000n }, { nowNs, frameTick: tick(120n) });
  assert.ok(once.videoFrames.length <= 1, 'at most one frame per camera per tick');
  const twice = await tickCamera.pull({ frameNumber: 4n, scheduledTimeNs: 4_000_000_000n }, { nowNs, frameTick: tick(120n) });
  assert.equal(twice.videoFrames.some((f) => once.videoFrames.some((g) => g.sequenceNumber === f.sequenceNumber)), false, 'same frame not published twice for same tick');
  await tickCamera.shutdown({ nowNs });

  const stressBackends = [0, 1, 2].map((i) => new SyntheticCameraBackend({ format: fmt, backendId: `audit:stress:${i}` }));
  const stressCameras = stressBackends.map((b) => new DefaultCameraSource(devices[0]!, b, {
    ...defaultCameraBufferConfiguration,
    maximumFrames: 3,
    overflowPolicy: 'KEEP_LATEST_VIDEO',
  }));
  for (const c of stressCameras) {
    await c.open({ format: fmt }, { nowNs });
    await c.startCapture({ nowNs });
  }
  for (let i = 0; i < 100_000; i++) {
    for (const b of stressBackends) b.emitFrame(nowNs());
    for (const c of stressCameras) await c.pull({ frameNumber: BigInt(i + 10), scheduledTimeNs: BigInt(i + 10) * 33_333_333n }, { nowNs, frameTick: tick(BigInt(i + 10)) });
  }
  for (let i = 0; i < stressCameras.length; i++) {
    await stressCameras[i]!.shutdown({ nowNs });
    assert.equal(stressBackends[i]!.releasedHandleCount, stressBackends[i]!.emittedFrameCount, '100k synthetic ticks retain zero handles');
    stressCameras[i]!.assertInvariants();
  }

  await manager.shutdown();
  console.log('camera-source validation passed');
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
