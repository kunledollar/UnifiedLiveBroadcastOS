import {
  createMotionEffectsEngine,
  createMotionInstance,
  createMotionTimeline,
  createMotionPreset,
  MotionEffectsProcessor,
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
const target: MotionTarget = { type: 'LAYER', targetId: 'layer-a', generation: 1 };
const timeline = createMotionTimeline({
  timelineId: 'tl-a',
  displayName: 'Opacity',
  durationFrames: 10,
  tracks: [
    {
      trackId: 'tr-a',
      target,
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
engine.registerPreset(createMotionPreset('FADE_IN', target));
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
assert(engine.assertInvariants().valid, 'invariants valid');
const proc = new MotionEffectsProcessor(engine);
const published: string[] = [];
proc.processTick(tick(7), {
  outputs: { publish: (_p: string, k: string) => published.push(k) },
} as unknown as ProcessorRuntimeContext);
assert(published.includes('motion.resolved.properties'), 'processor publishes snapshot');
engine.shutdownEngine();
assert(engine.snapshot().health.engineState === 'SHUTDOWN', 'shutdown clean');
console.log('UBOS v5.4.7 motion effects validation passed');
