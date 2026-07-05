#!/usr/bin/env node
import { createFFmpegVideoDecoder, createVideoDecodeSource } from '../packages/media-plane/dist/media-plane/src/index.js';

const input = process.argv[2] ?? 'sample.mp4';
const maxFrames = Number(process.argv[3] ?? '5');
const decoder = createFFmpegVideoDecoder({ maxFrames, env: process.env });
const source = createVideoDecodeSource({ id: `demo:${input}`, uri: input });
console.log(`UBOS video decode demo: ${source.uri} (${source.container})`);
const opened = await decoder.open(source);
console.log(JSON.stringify({ state: opened.state, source: opened.source, backend: opened.backend }));
while (true) {
  const frame = await decoder.decodeNext();
  if (!frame) break;
  console.log(JSON.stringify(frame));
}
console.log(JSON.stringify({ state: decoder.getSnapshot().state, framesDecoded: decoder.getSnapshot().framesDecoded, eos: decoder.getSnapshot().endOfStream }));
