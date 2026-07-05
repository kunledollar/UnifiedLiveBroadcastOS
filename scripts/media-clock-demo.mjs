#!/usr/bin/env node
import { createClock, FrameScheduler } from '../packages/media-plane/dist/media-plane/src/index.js';

const arg = (name, fallback) => {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : fallback;
};
const fps = Number(arg('fps', '30'));
const frames = Number(arg('frames', '5'));
let now = 1_000;
const clock = createClock({ frameRate: fps, now: () => now });
const scheduler = new FrameScheduler(clock);
clock.start();
console.log(`UBOS media clock demo: ${fps} fps, ${frames} frames`);
for (let i = 0; i < frames; i += 1) {
  now = 1_000 + i * (1000 / fps);
  const tick = scheduler.createTick(now);
  console.log(JSON.stringify({ frame: tick.frameId, pts: tick.presentationTimestamp, media: tick.mediaTimestamp, classification: tick.diagnostics.classification }));
}
