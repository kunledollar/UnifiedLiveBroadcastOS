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
  await manager.shutdown();
  console.log('camera-source validation passed');
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
