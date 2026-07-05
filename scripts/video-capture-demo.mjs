import { createVideoCaptureDemo } from '../packages/media-plane/dist/media-plane/src/index.js';

const deviceId = process.argv.find((arg) => arg.startsWith('--device='))?.split('=')[1];
const frames = Number(process.argv.find((arg) => arg.startsWith('--frames='))?.split('=')[1] ?? 3);
const demo = await createVideoCaptureDemo({ deviceId, frames });
console.log(JSON.stringify({
  source: demo.source,
  renderedFrames: demo.rendered.map((item) => ({
    capturedFrame: item.frame.id,
    renderFrame: item.renderFrame.id,
    layers: item.renderFrame.layers.length,
    gpuState: item.gpu?.state,
  })),
  events: demo.events.map((event) => ({ type: event.type, state: event.state, frameId: event.frameId })),
}, null, 2));
