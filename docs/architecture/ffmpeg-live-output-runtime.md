# FFmpeg Live Output Runtime Foundation

Phase 8.6 adds a feature-flagged FFmpeg live output runtime for RTMP, RTMPS, SRT, and null validation output. The runtime is metadata-first: it plans, validates, redacts, manifests, and tracks lifecycle state without storing raw frames, encoded packets, process handles, stream keys, MediaStreams, DOM nodes, or canvas references in the Production Graph.

## Relationships

- **Streaming Engine:** existing streaming plans remain the control contract. The FFmpeg runtime consumes `StreamingPlan` metadata and does not bypass the Streaming Engine lifecycle.
- **Output Engine:** output route identity remains represented by broadcast output, video route, and audio route plan ids already carried by `StreamingPlan`.
- **Encoder Layer:** live publishing uses an `EncoderPlan`/`EncoderProfile` and maps profile metadata to FFmpeg command planning instead of creating a parallel encoder abstraction.
- **FFmpeg Adapter:** command construction reuses safe FFmpeg adapter helpers for argument-array sanitization, availability checks, and redacted log events. Shell command strings are never accepted.

## Supported Protocols

Prioritized protocols are `rtmp`, `rtmps`, `srt`, and `null`. `whip`, `hls`, and `dash` are placeholders that map to safe null output for this foundation.

## RTMP/RTMPS Plan

RTMP and RTMPS destinations map to FFmpeg `flv` output. Destination URLs are sanitized before diagnostics; path stream-key portions are replaced with `[REDACTED]`.

## SRT Plan

SRT destinations map to MPEG-TS output. Query parameters such as `passphrase`, `token`, `secret`, `key`, and `password` are redacted before logs, previews, manifests, or diagnostics.

## Dry-Run Mode and Feature Flags

Default behavior is safe. Real publishing requires explicit enablement:

- `UBOS_ENABLE_REAL_STREAMING=true`
- `UBOS_ENABLE_RTMP_OUTPUT=true`
- `UBOS_ENABLE_SRT_OUTPUT=true`
- `UBOS_STREAM_DRY_RUN=false`
- `UBOS_FFMPEG_PATH=ffmpeg`

If disabled or dry-run is active, lifecycle calls update metadata but do not spawn FFmpeg or perform network publishing.

## Secret Redaction and URL Safety

The runtime rejects shell metacharacters, newlines, NUL bytes, and traversal-like URL inputs. Diagnostics and manifests only include sanitized URLs and redacted command previews.

## Lifecycle

The runtime exposes prepare, connect, start, pause, resume, stop, reconnect, fail, and cleanup helpers. Start does not spawn unless the runtime is live-ready, enabled, non-dry-run, and explicitly spawn-enabled. Process state is tracked as metadata only.

## Reconnect Model

Reconnect is metadata-level for this phase: attempts, maximum attempts, delay, last reconnect time, and reconnect state are recorded. Complex network strategy is deferred.

## Manifest Model

The manifest captures sanitized destination metadata, graph/frame ids, dry-run status, and redacted command preview. It explicitly declares that it contains no media payloads, encoded packets, stream keys, or process handles.

## Failure, Backpressure, and Replay

FFmpeg/network errors are mapped into destination, auth, transport, reconnect-exhausted, or unknown failures. Backpressure remains metadata-only through health warnings and placeholder pressure fields. Replay reuses manifests and audit metadata only; live processes are never replayed.

## Limitations and Future Work

This foundation uses placeholder inputs: test source, synthetic black video, synthetic sine audio, raw pipe placeholder, encoded pipeline placeholder, and future browser program output placeholder. Future phases can add platform connectors, credential vault references, real program output capture, and production-grade reconnect strategy without changing the metadata safety contract.
