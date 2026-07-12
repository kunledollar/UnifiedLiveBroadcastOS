import {
  MOTION_BUILT_IN_PRESETS,
  createMotionDownstreamAdapters,
  createMotionEffectsEngine,
  createMotionInstance,
  createMotionPreset,
  createMotionTimeline,
  MotionEffectsProcessor,
  type MotionConflictPolicy,
  type MotionInterpolationMode,
  type MotionTarget,
} from './motion-effects-engine.js';
import type { FrameTick, ProcessorRuntimeContext } from './execution-engine.js';
const assert = (c: unknown, m: string) => {
  if (!c) throw new Error(m);
};
const tick = (n: number): FrameTick => ({
  frameNumber: BigInt(n),
  startedAtNs: BigInt(n),
  deadlineAtNs: BigInt(n),
  scheduledTimeNs: BigInt(n),
  actualTimeNs: BigInt(n),
  presentationTimeNs: BigInt(n * 33366667),
  frameDurationNs: 33366667n,
  driftNs: 0n,
  latenessNs: 0n,
  late: false,
  missedFrames: 0n,
  discontinuity: false,
});
const layer: MotionTarget = { type: 'LAYER', targetId: 'layer-a', generation: 1 };
const timeline = createMotionTimeline({
  timelineId: 'tl-a',
  displayName: 'Opacity',
  durationFrames: 10,
  markers: [{ markerId: 'm5', frameOffset: 5, name: 'middle', type: 'EVENT' }],
  tracks: [
    {
      trackId: 'tr-a',
      target: layer,
      propertyPath: 'opacity',
      valueType: 'NUMBER',
      keyframes: [
        { keyframeId: 'a', frameOffset: 0, value: 0, interpolation: 'LINEAR' },
        { keyframeId: 'b', frameOffset: 10, value: 1 },
      ],
      interpolationDefault: 'LINEAR',
      priority: 0,
      enabled: true,
    },
  ],
});
const engine = createMotionEffectsEngine();
engine.registerTimeline(timeline);
try {
  engine.registerTimeline(timeline);
  assert(false, 'duplicate rejected');
} catch {}
engine.registerPreset(createMotionPreset('FADE_IN', layer));
const inst = createMotionInstance({
  instanceId: 'i-a',
  timelineId: 'tl-a',
  timelineVersion: 1,
  timelineGeneration: 1,
  startRuntimeFrame: '0',
});
engine.createInstance(inst);
engine.play('i-a');
const r5 = engine.evaluate(tick(5));
assert(r5.resolvedProperties[0]?.value === 0.5, 'linear frame tick interpolation');
assert(r5.firedMarkers.length === 1, 'marker fires once');
try {
  engine.evaluate(tick(5));
  assert(false, 'duplicate tick rejected');
} catch {}
engine.pause('i-a');
assert(engine.health().pausedCount === 1, 'pause reflected');
engine.resume('i-a');
engine.seekFrame('i-a', 2);
const r6 = engine.evaluate(tick(6));
assert(Number(r6.resolvedProperties[0]?.value) >= 0, 'seek deterministic');
const proc = new MotionEffectsProcessor(engine);
const published: string[] = [];
proc.processTick(tick(7), {
  outputs: { publish: (_p: string, k: string) => published.push(k) },
} as unknown as ProcessorRuntimeContext);
assert(published.includes('motion.resolved.properties'), 'processor publishes snapshot');
for (const mode of [
  'STEP',
  'HOLD',
  'LINEAR',
  'SMOOTH',
  'CUBIC_BEZIER',
  'HERMITE',
  'CATMULL_ROM',
  'SPRING',
  'BOUNCE',
  'ELASTIC',
  'BACK',
] as MotionInterpolationMode[]) {
  const e = createMotionEffectsEngine();
  const tl = createMotionTimeline({
    timelineId: `tl-${mode}`,
    displayName: mode,
    durationFrames: 8,
    tracks: [
      {
        trackId: 't',
        target: layer,
        propertyPath: 'opacity',
        valueType: 'NUMBER',
        keyframes: [
          { keyframeId: 'a', frameOffset: 0, value: 0, interpolation: mode },
          { keyframeId: 'b', frameOffset: 8, value: 1 },
        ],
        interpolationDefault: mode,
        priority: 0,
        enabled: true,
      },
    ],
  });
  e.registerTimeline(tl);
  e.createInstance(
    createMotionInstance({
      instanceId: 'i',
      timelineId: tl.timelineId,
      timelineVersion: 1,
      timelineGeneration: 1,
    }),
  );
  e.play('i');
  const v = e.evaluate(tick(4)).resolvedProperties[0]?.value;
  assert(typeof v === 'number' && Number.isFinite(v), `${mode} finite`);
}
for (const policy of [
  'HIGHEST_PRIORITY',
  'LATEST_STARTED',
  'EARLIEST_STARTED',
  'REPLACE',
  'ADD',
  'MULTIPLY',
  'AVERAGE',
  'WEIGHTED_BLEND',
  'MIN',
  'MAX',
] as MotionConflictPolicy[]) {
  const e = createMotionEffectsEngine();
  const tracks = [1, 2].map((v) => ({
    trackId: `t${v}`,
    target: layer,
    propertyPath: 'opacity',
    valueType: 'NUMBER' as const,
    keyframes: [
      { keyframeId: 'a', frameOffset: 0, value: v },
      { keyframeId: 'b', frameOffset: 2, value: v },
    ],
    interpolationDefault: 'LINEAR' as const,
    conflictPolicy: policy,
    priority: v,
    enabled: true,
  }));
  const tl = createMotionTimeline({
    timelineId: `c-${policy}`,
    displayName: policy,
    durationFrames: 2,
    tracks,
  });
  e.registerTimeline(tl);
  e.createInstance(
    createMotionInstance({
      instanceId: 'i',
      timelineId: tl.timelineId,
      timelineVersion: 1,
      timelineGeneration: 1,
    }),
  );
  e.play('i');
  assert(e.evaluate(tick(1)).resolvedProperties.length === 1, `${policy} resolves atomically`);
}
const adapters = createMotionDownstreamAdapters();
const gtarget: MotionTarget = { type: 'GEOMETRY', targetId: 'g', generation: 2 };
const geometryAdapter = adapters.GEOMETRY!;
const applied = geometryAdapter.applyResolvedSnapshot(
  {
    runtimeFrameNumber: '9',
    generation: '9',
    resolvedProperties: [
      {
        target: gtarget,
        property: 'positionX',
        valueType: 'NUMBER',
        value: 12,
        sourceTimelineId: 'tl',
        sourceInstanceId: 'i',
        trackId: 'tr',
        runtimeFrame: '9',
        instanceGeneration: 1,
        priority: 0,
        blendWeight: 1,
        resolutionPolicy: 'HIGHEST_PRIORITY',
      },
    ],
  },
  gtarget,
);
assert(
  applied.properties.positionX === 12 && Object.isFrozen(applied),
  'geometry adapter atomic immutable application',
);
try {
  geometryAdapter.applyResolvedSnapshot(
    { runtimeFrameNumber: '10', generation: '9', resolvedProperties: [] },
    gtarget,
  );
  assert(false, 'stale snapshot rejected');
} catch {}
for (const kind of MOTION_BUILT_IN_PRESETS)
  assert(createMotionPreset(kind, layer).timeline.tracks.length > 0, `${kind} preset valid`);
const long = createMotionEffectsEngine({
  maxTimelines: 20000,
  maxTracks: 256,
  maxKeyframes: 4096,
  maxInstances: 20000,
  maxPlans: 20000,
  history: 128,
});
long.registerTimeline(
  createMotionTimeline({
    timelineId: 'long',
    displayName: 'long',
    durationFrames: 97,
    playbackMode: 'LOOP',
    markers: [
      { markerId: 'mk', frameOffset: 3, name: 'mk', type: 'EVENT', firePolicy: 'EACH_LOOP' },
    ],
    tracks: [
      {
        trackId: 'x',
        target: layer,
        propertyPath: 'layerOpacity',
        valueType: 'NUMBER',
        keyframes: [
          { keyframeId: 'a', frameOffset: 0, value: 0, interpolation: 'SMOOTH' },
          { keyframeId: 'b', frameOffset: 96, value: 1 },
        ],
        interpolationDefault: 'SMOOTH',
        conflictPolicy: 'WEIGHTED_BLEND',
        priority: 0,
        enabled: true,
      },
    ],
  }),
);
for (let i = 0; i < 8; i++) {
  long.createInstance(
    createMotionInstance({
      instanceId: `li-${i}`,
      timelineId: 'long',
      timelineVersion: 1,
      timelineGeneration: 1,
      startRuntimeFrame: String(i % 7),
      playbackRate: (i % 3) + 1,
      blendWeight: 1 + (i % 5),
    }),
  );
  long.play(`li-${i}`);
}
for (let f = 0; f < 100000; f++) {
  if (f % 1000 === 0) {
    const id = `li-${f % 8}`;
    long.pause(id);
    long.resume(id);
    long.seekFrame(id, f % 97);
  }
  const r = long.evaluate(tick(f));
  assert(r.resolvedProperties.length <= 1, 'atomic conflict snapshot');
  assert(
    r.resolvedProperties.every((p) => p.runtimeFrame === String(f)),
    'no stale property outputs',
  );
}
assert(long.health().duplicateTickCount === 0, 'no duplicate tick evaluations in long run');
assert(long.assertInvariants().valid, 'long-run invariants valid');
long.shutdownEngine();
assert(long.snapshot().health.activeInstanceCount === 0, 'shutdown cleanup');
assert(engine.assertInvariants().valid, 'invariants valid');
engine.shutdownEngine();
assert(engine.snapshot().health.engineState === 'SHUTDOWN', 'shutdown clean');
console.log('UBOS v5.4.7 motion effects hardening and 100000-tick certification PASS');
