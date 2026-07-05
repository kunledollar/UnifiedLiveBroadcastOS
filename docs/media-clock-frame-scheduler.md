# UBOS 2.0 Phase 2.3 — Media Clock & Frame Scheduler

The media clock and frame scheduler provide the deterministic timing engine for future render, record, stream, audio, and video alignment work. The implementation is metadata-first and independent of FFmpeg internals.

## Supported frame rates

`SUPPORTED_FRAME_RATES` includes: 23.976, 24, 25, 29.97, 30, 50, 59.94, and 60 fps.

## MediaClock

`createClock({ frameRate, now })` creates a deterministic `MediaClock` with lifecycle methods:

- `start()` / `startClock()`
- `pause()` / `pauseClock()`
- `resume()` / `resumeClock()`
- `stop()` / `stopClock()`
- `reset()` / `resetClock()`

Clock state is serializable and includes elapsed time, presentation timestamp, media timestamp, current frame number, frame interval, drift, and status. Runtime handles and media payloads are intentionally excluded.

## FrameScheduler

`FrameScheduler` consumes a `MediaClock` and emits `FrameTickEvent` metadata. It does not render or decode frames. Each tick includes frame identity, PTS, media timestamp, expected next frame time, jitter estimate, and diagnostics.

Diagnostics classify timing as:

- `on_time`
- `late`
- `dropped`
- `duplicated`

The scheduler emits sync-bus events for frame ticks, late frames, dropped frames, duplicated frames, and drift detection.

## Synchronization interfaces

Phase 2.3 introduces metadata-only `SyncReference` and `SynchronizationTarget` interfaces for future audio/video alignment. These interfaces let audio, video, output, and external references share timestamps without introducing subsystem-owned clocks.

## Demo

Run a dry metadata-only tick progression demo:

```bash
pnpm media:clock-demo -- --fps 29.97 --frames 5
```
