# FFmpeg Runtime Adapter Foundation

Phase 8.4 introduces the first real media-processing backend boundary behind the UBOS Encoder Abstraction Layer. The FFmpeg adapter is intentionally limited to command planning, safe diagnostics, availability checks, dry-run lifecycle state, and future-safe process lifecycle seams.

## Purpose

The adapter translates an `EncoderPlan` into a redacted `FFmpegCommandPlan` without placing encoded packets, raw frames, audio samples, media streams, DOM objects, canvas references, or FFmpeg process handles in the Production Graph. It is a backend implementation detail for the media execution plane, not a new recording or streaming workflow.

## Relationship to the Encoder Abstraction Layer

The adapter lives under `packages/media-plane/src/encoder/ffmpeg/` and consumes the existing encoder contracts. Control code should continue to create and validate `EncoderPlan` objects through the encoder layer. FFmpeg-specific details stay inside the adapter boundary and are surfaced only as developer diagnostics such as availability, command preview, placeholder input/output kind, logs, health, and structured failures.

## Relationship to Recording and Streaming Engines

Recording and streaming engines continue to own product-level recording and destination state. Phase 8.4 does not implement production recording, RTMP publishing, SRT publishing, segment writing, or stream reconnection. Recording and streaming outputs are represented as placeholder FFmpeg output plans only.

## Runtime Modes

- `disabled`: no FFmpeg command plan or process is created.
- `dry_run`: a command plan and redacted command preview can be created; no process is spawned.
- `mock_live`: existing mock encoder behavior is used instead of FFmpeg.
- `live_ready`: FFmpeg preparation/start is allowed only when the adapter is explicitly enabled and future spawn wiring opts in.

The adapter is gated by `UBOS_ENABLE_FFMPEG_ADAPTER=true` or explicit construction options. `UBOS_FFMPEG_PATH` can point at the executable used for availability detection and future spawning.

## Dry-run Behavior

Dry-run mode is the default-safe behavior. It validates a placeholder command, builds an argument array, records a redacted preview, and returns lifecycle sessions without starting FFmpeg. Tests and development environments do not require FFmpeg to be installed.

## Process Lifecycle

The foundation defines lifecycle methods for validate, prepare, start, pause, resume, drain, stop, fail, and cleanup. Process spawning is deliberately not used by default. The adapter never executes shell command strings and reserves future live process wiring for explicit `live_ready` plus spawn opt-in. Cleanup records that no process handles are retained.

## Command Planning

`EncoderPlan` maps to `FFmpegCommandPlan` with safe placeholder support:

- test source input placeholder
- raw pipe input placeholder
- file output placeholder
- null output placeholder
- RTMP output placeholder as plan-only
- segment output placeholder as plan-only

Arguments are built as an array suitable for `spawn(path, args, { shell: false })` and are validated before use.

## Security and Argument Sanitization

The adapter rejects null bytes, newlines, shell metacharacters, and path traversal patterns in FFmpeg arguments. It never accepts arbitrary user-provided command lines, never invokes a shell string, and keeps stream keys out of logs and previews.

## Secret Redaction

Command previews and log events are redacted for URL credentials, query parameters such as keys/tokens/secrets/passwords, and `stream_key=`-style diagnostics before they are stored or returned.

## Failure Handling

FFmpeg runtime errors map to the existing encoder failure shape with retryability, timestamp, backend, code, and message. Missing binaries or unavailable runtimes report structured unavailability instead of crashing.

## Backpressure Handling

Backpressure remains metadata-only in this phase. The adapter does not buffer raw frames, encoded packets, samples, or process pipes in graph state. Future live integration must honor the existing backpressure policy before feeding FFmpeg stdin or output queues.

## Known Limitations

- No production recording is implemented.
- No production RTMP/SRT streaming is implemented.
- Segment output is command-plan-only.
- Pause, resume, and drain are placeholders.
- Live process spawning is intentionally gated and not used by default.
- Browser-only runtimes report unavailable for FFmpeg detection.

## Future Real Recording Plan

A future phase can connect recording engine intents to FFmpeg file/segment output through the encoder backend, with explicit filesystem policy, controlled output paths, lifecycle cleanup, and manifest generation.

## Future RTMP Streaming Plan

A future phase can connect streaming engine destination metadata to RTMP/SRT command plans, inject secrets only at the process boundary, and keep all diagnostics redacted.

## Future Segment Recording Plan

A future phase can promote segment placeholders to controlled segment muxing with bounded directories, retention rules, health reporting, and replay-safe metadata manifests.
