# UBOS 2.0 Phase 2.7 — Live Video Source Capture

Phase 2.7 introduces live cameras as first-class media runtime sources while preserving backend independence and keeping platform-specific APIs out of the UI.

## Runtime model

The `VideoCaptureSource` interface owns capture lifecycle, device selection, frame metadata generation, status events, and render integration. Its lifecycle states are:

- `idle`
- `opening`
- `capturing`
- `paused`
- `stopped`
- `failed`

Captured frames are metadata-only `CapturedVideoFrame` records. They carry MediaClock frame identity, scheduler timing, resolution, frame rate duration, pixel format, and a `payloadRef` placeholder instead of raw media bytes.

## Device discovery and capabilities

`VideoCaptureBackend.discoverDevices()` returns platform-neutral `VideoCaptureDevice` records for:

- USB webcams
- Integrated cameras
- Virtual cameras

Each device exposes `CameraCapability` entries with resolution, frame rate, and pixel format. The first backend is `FFmpegDeviceCaptureBackend`, which models FFmpeg/device-API discovery without exposing DirectShow, AVFoundation, or V4L2 details to the UI.

## Render path

`createVideoCaptureSource()` integrates captured camera frames with:

1. `MediaClock` for deterministic frame timestamps.
2. `FrameScheduler` for frame tick metadata.
3. `SceneCompositor` by adding the selected camera as a video render layer.
4. GPU/renderer foundation by creating a metadata-only texture reference for the latest captured frame.

## Demo

```bash
pnpm media:capture-demo -- --frames=3
```

The demo discovers a camera, selects it, starts capture, captures three frames, composites them, and submits metadata to the renderer/GPU path.

## Current constraints

- No PTZ control.
- No NDI.
- No browser sources.
- No audio capture.
- No platform-specific capture API leaks into UI-facing models.
