# UBOS 2.0 Phase 2.4 Video Decode Pipeline

The video decode layer introduces a metadata-first decoder contract for compressed video files. It is intentionally separate from rendering: decoded payload ownership remains inside the media runtime and callers receive only serializable frame metadata.

## Supported containers

- MP4
- MOV
- MKV
- WebM

## Public contracts

- `VideoDecoder` defines lifecycle operations: `open`, `decodeNext`, `pause`, `resume`, `close`, `getSnapshot`, `getBuffer`, and `onStatus`.
- `VideoFrameMetadata` describes decoded frames with frame index, PTS, DTS, duration, resolution, pixel format, color space, MediaClock timing, scheduler timing, and metadata-only payload flags.
- `FrameBuffer` and `RingFrameBuffer` provide bounded buffering for decoded frame metadata.
- `VideoDecoderSnapshot` exposes serializable decoder state without process handles, FFmpeg internals, or frame payloads.

## FFmpeg backend

`FFmpegVideoDecoder` uses `ffprobe` frame metadata when real FFmpeg execution is enabled via both `UBOS_ENABLE_REAL_FFMPEG=true` and `NEXT_PUBLIC_UBOS_REAL_FFMPEG=true`. Otherwise it runs in deterministic dry-run mode for tests and development.

The backend remains hidden behind the `VideoDecoder` interface. UI code should consume `VideoFrameMetadata`, `VideoDecoderSnapshot`, and status events rather than FFmpeg commands or process details.

## Timing integration

Each decoded frame is attached to the shared `MediaClock` and `FrameScheduler`. The decoder records the clock frame id, scheduled presentation timestamp, and late-frame classification while preserving the original media PTS/DTS values.

## Demo

Build the package and print frame metadata:

```bash
pnpm media:decode-demo ./sample.mp4 5
```

For real probing, enable FFmpeg explicitly:

```bash
UBOS_ENABLE_REAL_FFMPEG=true NEXT_PUBLIC_UBOS_REAL_FFMPEG=true pnpm media:decode-demo ./sample.mp4 5
```
