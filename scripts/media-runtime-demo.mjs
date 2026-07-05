#!/usr/bin/env node
import { spawn } from 'node:child_process';

const run = process.argv.includes('--run');
const positional = process.argv.slice(2).filter((arg) => arg !== '--run');
const input = positional[0] ?? 'sample.mp4';
const output = positional[1] ?? 'ubos-demo-recording.mp4';
const realEnabled = process.env.UBOS_ENABLE_REAL_FFMPEG === 'true' && process.env.NEXT_PUBLIC_UBOS_REAL_FFMPEG === 'true';
const ffmpeg = process.env.UBOS_FFMPEG_PATH ?? 'ffmpeg';
const args = input === 'testsrc'
  ? ['-y', '-f', 'lavfi', '-i', 'testsrc2=size=128x72:rate=15', '-t', '2', '-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', '+faststart', output]
  : ['-y', '-i', input, '-map', '0:v?', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-movflags', '+faststart', output];

console.log(['ffmpeg', ...args].join(' '));
if (!run || !realEnabled) {
  console.log('Dry run only. To execute: UBOS_ENABLE_REAL_FFMPEG=true NEXT_PUBLIC_UBOS_REAL_FFMPEG=true pnpm media:demo --run testsrc ./ubos-demo-recording.mp4');
  process.exit(0);
}

const child = spawn(ffmpeg, args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
child.stdout.on('data', (chunk) => process.stdout.write(chunk));
child.stderr.on('data', (chunk) => process.stderr.write(chunk));
child.on('error', (error) => {
  console.error(`FFmpeg demo failed to start: ${error.message}`);
  process.exitCode = 1;
});
child.on('close', (code, signal) => {
  if (code === 0) console.log(`FFmpeg demo wrote ${output}`);
  else {
    console.error(`FFmpeg demo exited with code ${String(code)} signal ${String(signal)}`);
    process.exitCode = code ?? 1;
  }
});
