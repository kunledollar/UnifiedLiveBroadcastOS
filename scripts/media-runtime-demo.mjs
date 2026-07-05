#!/usr/bin/env node
const input = process.argv[2] ?? 'sample.mp4';
const output = process.argv[3] ?? 'ubos-demo-recording.mp4';
const args = ['-y', '-i', input, '-map', '0:v?', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-movflags', '+faststart', output];
console.log(['ffmpeg', ...args].join(' '));
console.log('Set UBOS_ENABLE_REAL_FFMPEG=true NEXT_PUBLIC_UBOS_REAL_FFMPEG=true when running through the runtime adapter.');
