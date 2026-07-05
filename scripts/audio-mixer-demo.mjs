import { createAudioMixerDemo } from '../packages/media-plane/dist/media-plane/src/index.js';

const demo = await createAudioMixerDemo();
console.log(JSON.stringify({ outputs: demo.outputs, snapshot: demo.snapshot }, null, 2));
