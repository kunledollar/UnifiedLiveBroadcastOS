import {
  FrameScheduler,
  createAudioMixer,
  createClock,
  createDemoRecordingSession,
  createProgramOutput,
  createSceneCompositor,
} from '../packages/media-plane/dist/media-plane/src/index.js';

const clock = createClock({ frameRate: 30 });
const scheduler = new FrameScheduler(clock);
const compositor = createSceneCompositor({ id: 'compositor:recording-demo', sceneId: 'scene:program', mediaClock: clock });
const mixer = createAudioMixer({ id: 'mixer:recording-demo', mediaClock: clock });
mixer.addBus({ id: 'bus:program', label: 'Program master', channels: 2, sampleRate: 48000 });
const programOutput = createProgramOutput({ id: 'output:program:recording-demo', sceneId: 'scene:program', compositor, audioMixer: mixer, audioBusId: 'bus:program', mediaClock: clock });
programOutput.initialize();

const demo = await createDemoRecordingSession({ programOutput, audioMixer: mixer, mediaClock: clock, frameScheduler: scheduler });
console.log(JSON.stringify({ session: demo.session, eventTypes: demo.events.map((event) => event.type) }, null, 2));
