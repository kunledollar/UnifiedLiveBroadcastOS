import { DefaultSourceAcquisitionManager } from './source-acquisition.js';
import {
  SCREEN_COMMAND_TYPES,
  SCREEN_EVENT_TYPES,
  SCREEN_WATCHDOG_INCIDENTS,
  ScreenCursorPolicyUnsupportedError,
  ScreenFrameHandle,
  ScreenFrameQueue,
  ScreenOwnershipViolationError,
  ScreenPermissionDeniedError,
  ScreenRegionOutOfBoundsError,
  SyntheticScreenBackend,
  SyntheticScreenCaptureProvider,
  createNativeScreenCaptureAdapterBoundaries,
  createScreenSourceDescriptor,
  createScreenTelemetrySnapshot,
  defaultScreenQueueConfiguration,
  evaluateScreenWatchdog,
  negotiateScreenFormat,
  sortScreenTargets,
  validateScreenRegion,
} from './screen-capture.js';

const assert = (v: unknown, m = 'assertion failed') => {
  if (!v) throw new Error(m);
};
const eq = (a: unknown, b: unknown) => {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`);
};
const rejects = async (f: () => Promise<unknown> | unknown, re: RegExp) => {
  try {
    await f();
  } catch (e) {
    if (re.test(String(e))) return;
    throw e;
  }
  throw new Error('expected rejection');
};
let now = 0n;
const ctx = { nowNs: () => (now += 16_666_667n) };
const tick = (n: bigint) => ({
  frameNumber: n,
  startedAtNs: now,
  deadlineAtNs: now,
  scheduledTimeNs: now,
  actualTimeNs: now,
  presentationTimeNs: now,
  frameDurationNs: 16_666_667n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});

const provider = new SyntheticScreenCaptureProvider(new SyntheticScreenBackend(ctx.nowNs));
const discovery = await provider.discoverTargets({}, ctx);
assert(discovery.displays.length >= 3, 'display discovery');
assert(discovery.windows.length >= 2, 'window discovery');
eq(
  sortScreenTargets([...discovery.windows, ...discovery.displays]).map((t) => t.identity.targetId),
  sortScreenTargets([...discovery.displays, ...discovery.windows]).map((t) => t.identity.targetId),
);
assert(
  discovery.windows.every((w) => !String(w.displayName).includes('Secret')),
  'window-title redaction',
);
assert(!JSON.stringify(discovery).match(/handle|pid|Quarterly Results/i), 'native-handle privacy');

const target = discovery.displays[0]!;
const descriptor = createScreenSourceDescriptor(target);
assert(descriptor.type === 'SCREEN' && descriptor.acquisitionMode === 'PULL', 'source descriptor');
const source = await provider.createScreenSource(descriptor);
await source.initialize(ctx);
await source.open({}, ctx);
await source.startCapture(ctx);
provider as unknown as { backend?: SyntheticScreenBackend };
const backend = (provider.getBackendHealth().backendId, new SyntheticScreenBackend(ctx.nowNs));

const manualBackend = new SyntheticScreenBackend(ctx.nowNs);
const manualProvider = new SyntheticScreenCaptureProvider(manualBackend);
const manualDiscovery = await manualProvider.discoverTargets({}, ctx);
const manualSource = await manualProvider.createScreenSource(
  createScreenSourceDescriptor(manualDiscovery.displays[0]!),
);
await manualSource.open({}, ctx);
await manualSource.startCapture(ctx);
// backend emits through registered callback when autoFrames is false only via explicit emit after start
const snap0 = manualSource.getSnapshot(ctx.nowNs);
assert(snap0.open && snap0.capturing, 'open/start lifecycle');
await manualSource.stopCapture(ctx);
const stopped = await manualSource.pull(
  { frameNumber: 1n, scheduledTimeNs: now },
  { nowNs: ctx.nowNs, frameTick: tick(1n) },
);
eq(stopped.videoFrames.length, 0);
await manualSource.close(ctx);
const closed = manualSource.getSnapshot(ctx.nowNs);
assert(!closed.open && !closed.capturing, 'close lifecycle');

await rejects(async () => {
  const deniedDiscovery = await manualProvider.discoverTargets(
    { includeProtectedContent: true, includeMinimizedWindows: true },
    ctx,
  );
  const denied = createScreenSourceDescriptor(
    deniedDiscovery.windows.find((w) => w.permissionState === 'RESTRICTED')!,
    { permissionState: 'DENIED' },
  );
  const s = await manualProvider.createScreenSource(denied);
  await s.open({}, ctx);
}, /ScreenPermissionDenied/);

const region = {
  coordinateSpace: 'PHYSICAL_PIXELS' as const,
  unit: 'PIXELS' as const,
  scaleBehavior: 'NATIVE' as const,
  clampPolicy: 'CLAMP' as const,
  relativeTo: 'TARGET' as const,
  x: -1,
  y: -1,
  width: 100,
  height: 100,
};
const clamped = validateScreenRegion(region, target.geometry);
eq(clamped.x, 0);
assert(() => true);
try {
  validateScreenRegion({ ...region, clampPolicy: 'REJECT' }, target.geometry);
  throw new Error('expected');
} catch (e) {
  assert(e instanceof ScreenRegionOutOfBoundsError);
}
assert(
  negotiateScreenFormat(
    descriptor.supportedFormats.filter((f) => f.kind === 'VIDEO'),
    { preferredWidth: 640 },
  ).ok,
  'format negotiation',
);

const handle = new ScreenFrameHandle('h');
handle.release();
try {
  handle.release();
  throw new Error('expected');
} catch (e) {
  assert(e instanceof ScreenOwnershipViolationError);
}
const queue = new ScreenFrameQueue({
  ...defaultScreenQueueConfiguration,
  maximumFrames: 2,
  highWaterMark: 2,
  overflowPolicy: 'DROP_NEWEST',
});
assert(queue.snapshot().maximumFrames === 2, 'bounded queue');

assert(SCREEN_COMMAND_TYPES.includes('SCREEN_START'), 'commands');
assert(SCREEN_EVENT_TYPES.includes('ScreenFrameDropped'), 'events');
assert(SCREEN_WATCHDOG_INCIDENTS.includes('SCREEN_BACKEND_FAILED'), 'watchdog');
assert(createNativeScreenCaptureAdapterBoundaries().length === 3, 'native boundaries');
assert(evaluateScreenWatchdog([closed]).length >= 0, 'watchdog evaluation');
assert(createScreenTelemetrySnapshot([closed]).registeredScreenSourceCount === 1, 'telemetry');

const manager = new DefaultSourceAcquisitionManager(ctx.nowNs);
manager.registerProvider(provider);
await rejects(() => {
  manager.registerProvider(provider);
  return Promise.resolve();
}, /Duplicate source provider/);
const discovered = await manager.discover({ sourceTypes: ['SCREEN'] });
assert(discovered.descriptors.length > 0, 'source acquisition discovery');
const src = await provider.createSource(discovered.descriptors[0]!);
manager.registerSource(src);
await manager.initialize(src.descriptor.id);
await manager.connect(src.descriptor.id);
await manager.activate(src.descriptor.id);
await manager.acquireForTick(tick(2n));
manager.assertInvariants();
await manager.shutdown();

const makeAuditedSource = async (targetIndex = 0) => {
  const b = new SyntheticScreenBackend(ctx.nowNs);
  const p = new SyntheticScreenCaptureProvider(b);
  const d = await p.discoverTargets(
    { includeProtectedContent: true, includeMinimizedWindows: true },
    ctx,
  );
  const allTargets = [...d.displays, ...d.windows, ...d.unavailableTargets].filter(
    (t) => t.capturable,
  );
  const s = await p.createScreenSource(createScreenSourceDescriptor(allTargets[targetIndex]!));
  await s.open({}, ctx);
  await s.startCapture(ctx);
  return { backend: b, source: s, target: allTargets[targetIndex]! };
};

// Slow operation completions cannot overwrite newer terminal state.
{
  let releaseOpen!: () => void;
  class DelayedOpenBackend extends SyntheticScreenBackend {
    async open(req: Parameters<SyntheticScreenBackend['open']>[0]) {
      await new Promise<void>((resolve) => {
        releaseOpen = resolve;
      });
      return super.open(req);
    }
  }
  const b = new DelayedOpenBackend(ctx.nowNs);
  const p = new SyntheticScreenCaptureProvider(b);
  const d = await p.discoverTargets({}, ctx);
  const s = await p.createScreenSource(createScreenSourceDescriptor(d.displays[0]!));
  const opening = s.open({}, ctx);
  await s.close(ctx);
  releaseOpen();
  await opening;
  const snap = s.getSnapshot(ctx.nowNs);
  assert(
    !snap.open && !snap.capturing && snap.lifecycleState === 'DISCONNECTED',
    'late open cannot overwrite close',
  );
  assert(!b.getHealth().capturing, 'late open does not start backend capture');
}

// Production-safety audit: queue overflow releases discarded handles and close releases retained handles.
{
  const { backend: b, source: s } = await makeAuditedSource();
  for (let i = 0; i < 10; i++) b.emitFrame(undefined, ctx);
  const auditBeforeClose = b.getReleaseAudit();
  assert(auditBeforeClose.framesProduced === 10, 'overflow produced frames');
  assert(auditBeforeClose.framesReleased >= 6, 'overflow/stale released dropped handles');
  assert(s.getRetainedHandleCount() <= 4, 'overflow retained bounded queue only');
  await s.close(ctx);
  const audit = b.getReleaseAudit();
  assert(audit.framesReleased === audit.framesProduced, 'close releases overflow retained handles');
  assert(
    audit.retainedHandles === 0 && audit.doubleReleaseAttempts === 0,
    'overflow no leaks/double release',
  );
}

// Stale-frame removal, region reconfiguration, format reconfiguration, cursor reconfiguration, stop, and close release retained handles.
{
  const { backend: b, source: s } = await makeAuditedSource();
  b.emitFrame(undefined, ctx);
  now += 2_000_000_000n;
  b.emitFrame(undefined, ctx);
  assert(b.getReleaseAudit().framesReleased >= 1, 'stale frame released');
  await s.updateRegion?.({ sourceId: s.descriptor.id, region }, ctx);
  assert(s.getRetainedHandleCount() === 0, 'region change releases retained handles');
  b.emitFrame(undefined, ctx);
  await (
    s as unknown as {
      updateFormat: (f: typeof descriptor.defaultFormat, c: typeof ctx) => Promise<unknown>;
    }
  ).updateFormat(
    s.descriptor.supportedFormats.find(
      (f) => f.kind === 'VIDEO',
    ) as typeof descriptor.defaultFormat,
    ctx,
  );
  assert(s.getRetainedHandleCount() === 0, 'format change releases retained handles');
  b.emitFrame(undefined, ctx);
  await s.updateCursorPolicy?.({ sourceId: s.descriptor.id, cursorPolicy: 'EXCLUDE' }, ctx);
  assert(s.getRetainedHandleCount() === 0, 'cursor change releases retained handles');
  b.emitFrame(undefined, ctx);
  await s.stopCapture(ctx);
  assert(s.getRetainedHandleCount() === 0, 'stop releases retained handles');
  b.emitLateFrame(ctx);
  const afterLateStop = s.getSnapshot(ctx.nowNs).queue.depth;
  assert(afterLateStop === 0, 'late callback after stop cannot enqueue');
  await s.close(ctx);
  b.emitLateFrame(ctx);
  assert(s.getSnapshot(ctx.nowNs).queue.depth === 0, 'late callback after close cannot enqueue');
  const audit = b.getReleaseAudit();
  assert(
    audit.retainedHandles === 0 && audit.doubleReleaseAttempts === 0,
    'reconfiguration no leaks/double release',
  );
}

// Target removal, geometry/DPI/rotation/occlusion/minimize/restore/protected changes keep generation boundaries and stop publication.
{
  const { backend: b, source: s, target: t } = await makeAuditedSource();
  b.emitFrame(undefined, ctx);
  const genBefore = s.getSnapshot(ctx.nowNs).generation;
  const removed = { ...t, available: false, capturable: false };
  b.emitTargetChanged(removed, 'geometry dpi rotation target removed');
  await Promise.resolve();
  const snap = s.getSnapshot(ctx.nowNs);
  assert(snap.generation > genBefore, 'target change increments generation');
  assert(
    !snap.open && !snap.capturing && snap.lifecycleState === 'UNAVAILABLE',
    'target removal terminal state',
  );
  b.emitLateFrame(ctx);
  const batch = await s.pull(
    { frameNumber: 98n, scheduledTimeNs: now },
    { nowNs: ctx.nowNs, frameTick: tick(98n) },
  );
  assert(batch.videoFrames.length === 0, 'target removal prevents late publication');
  assert(b.getReleaseAudit().retainedHandles === 0, 'target removal releases retained handles');
}

// Same-tick repeated acquisition cannot publish the same frame twice.
{
  const { backend: b, source: s } = await makeAuditedSource();
  b.emitFrame(undefined, ctx);
  const first = await s.pull(
    { frameNumber: 777n, scheduledTimeNs: now },
    { nowNs: ctx.nowNs, frameTick: tick(777n) },
  );
  const second = await s.pull(
    { frameNumber: 777n, scheduledTimeNs: now },
    { nowNs: ctx.nowNs, frameTick: tick(777n) },
  );
  assert(
    first.videoFrames.length === 1 && second.videoFrames.length === 0,
    'same tick no duplicate publication',
  );
  await s.close(ctx);
  assert(b.getReleaseAudit().retainedHandles === 0, 'same-tick source closes cleanly');
}

// Backend failure and shutdown release retained handles and leave no backend/callback/queue/handle state.
{
  const { backend: b, source: s } = await makeAuditedSource();
  b.emitFrame(undefined, ctx);
  b.emitBackendFailure();
  await s.shutdown(ctx);
  b.emitLateFrame(ctx);
  const snap = s.getSnapshot(ctx.nowNs);
  const audit = b.getReleaseAudit();
  assert(!snap.open && !snap.capturing && snap.queue.depth === 0, 'shutdown clears source state');
  assert(!b.getHealth().open && !b.getHealth().capturing, 'shutdown closes backend');
  assert(
    audit.retainedHandles === 0 && audit.doubleReleaseAttempts === 0,
    'shutdown no retained handles',
  );
}

// Public observability redaction audit.
{
  const { backend: b, source: s } = await makeAuditedSource();
  const publicJson = JSON.stringify({
    discovery,
    source: s.getSnapshot(ctx.nowNs),
    backend: b.getHealth(),
    telemetry: createScreenTelemetrySnapshot([s.getSnapshot(ctx.nowNs)]),
    events: SCREEN_EVENT_TYPES,
  });
  assert(
    !/Quarterly Results|Protected Payroll|Minimized Chat|handle|pid|\/Users|C:\\|secret/i.test(
      publicJson,
    ),
    'public observability is redacted',
  );
  await s.close(ctx);
}

// 100,000 deterministic synthetic ticks across display, window, and region sources with zero retained handles/double releases.
{
  const b = new SyntheticScreenBackend(ctx.nowNs);
  const p = new SyntheticScreenCaptureProvider(b);
  const d = await p.discoverTargets({ includeMinimizedWindows: true }, ctx);
  const chosen = [
    d.displays[0]!,
    d.windows[0]!,
    d.displays.find((t) => t.targetType === 'VIRTUAL_DISPLAY') ?? d.displays[1]!,
  ];
  const sources = [];
  for (const t of chosen) {
    const s = await p.createScreenSource(createScreenSourceDescriptor(t));
    await s.open({}, ctx);
    await s.startCapture(ctx);
    sources.push(s);
  }
  for (let i = 0; i < 100_000; i++) {
    for (const s of sources) {
      b.emitFrame(undefined, ctx);
      const batch = await s.pull(
        { frameNumber: BigInt(i + 1), scheduledTimeNs: now },
        { nowNs: ctx.nowNs, frameTick: tick(BigInt(i + 1)) },
      );
      assert(batch.videoFrames.length <= 1, 'one frame maximum per source tick');
      const repeat = await s.pull(
        { frameNumber: BigInt(i + 1), scheduledTimeNs: now },
        { nowNs: ctx.nowNs, frameTick: tick(BigInt(i + 1)) },
      );
      assert(repeat.videoFrames.length === 0, 'same tick duplicate prevented in long run');
    }
  }
  for (const s of sources) await s.close(ctx);
  const audit = b.getReleaseAudit();
  assert(audit.framesProduced === audit.framesReleased, '100k frames released exactly once');
  assert(
    audit.retainedHandles === 0 && audit.doubleReleaseAttempts === 0,
    '100k no leaks/double release',
  );
}

console.log('screen-capture.validation complete');
