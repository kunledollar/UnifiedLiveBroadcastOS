# Recording Engine Foundation

Phase 8.0 adds a mock Recording Engine foundation to the Media Execution Plane. It defines recording plans, sessions, targets, segments, manifests, health, failures, execution results, and an in-memory `RecordingStore` without writing files, running FFmpeg, streaming RTMP/SRT, storing packets, or placing raw media in the Production Graph.

## Purpose

The Recording Engine turns graph state and media route plans into a replayable recording lifecycle. It answers: which broadcast session and graph revision is being recorded, which frame identity anchored the recording decision, which video and audio routes feed the recording output, which output target is selected, which mock segments were created, and what manifest would be emitted later by a real writer.

## Relation to the Output Engine

Recording is modeled as output work and is scheduled through output-scoped Media Execution intents such as `BUILD_RECORDING_PLAN`, `PREPARE_RECORDING`, `START_RECORDING_ENGINE`, `PAUSE_RECORDING_ENGINE`, `RESUME_RECORDING_ENGINE`, `STOP_RECORDING_ENGINE`, `FAIL_RECORDING_ENGINE`, and `VALIDATE_RECORDING_PLAN`. The mock adapter derives recording state from the existing route stores and output intent dispatch rather than bypassing the Media Execution Plane.

## Relation to the Timing Contract

Every `RecordingPlan` carries `frameId` and optional `frameTimestamp`. Segment metadata also carries frame identity. This keeps recording decisions aligned to the MediaClock/frame contract and prevents recording state from using an independent subsystem clock as its canonical identity.

## Relation to the Replay Contract

Recording state is metadata-only: IDs, timestamps, revisions, route IDs, output IDs, segment descriptors, manifest descriptors, warnings, health, and failure summaries. It does not contain `MediaStream`, raw frames, audio samples, DOM nodes, encoded packets, or writer handles, so replay validation can inspect recording state safely.

## Manifest Model

A `RecordingManifest` is created from a session and contains the plan ID, recording ID, broadcast session ID, graph revision, format, target placeholder, closed segment metadata, duration, status, and warnings. The manifest is a mock declaration of what would be written by a future file writer; no file is created.

## Segment Model

A `RecordingSegment` is compact metadata: id, index, status, start/end timestamps, frame identity, duration, byte length, and flags such as `mockSegment` and `noEncodedMedia`. Byte length remains zero in this phase because no encoded media exists.

## Failure Handling

`failRecording()` marks sessions failed and attaches a `RecordingFailure` with a shared `UBOSFailure` record classified as an output failure in the recording subsystem. Failures remain recoverable metadata for diagnostics and do not mutate Production Graph state.

## Backpressure Handling

`RecordingHealth` exposes `backpressure` as `nominal`, `constrained`, `paused`, or `unavailable`. In this phase it is derived from lifecycle state and warnings only. Future writer queues can map encoder/file pressure into the same health field without changing the plan or manifest contract.

## Future FFmpeg/File Writer Plan

A future phase can add a live adapter that consumes the same execution intents, opens a writer outside the Production Graph, writes encoded media to disk/cloud storage, updates segment sizes, and emits finalized manifests. That adapter must keep runtime handles and encoded packets outside graph/replay state and must continue to route through the Output Engine and Media Execution Plane.

## Known Limitations

- No FFmpeg process is spawned.
- No files are written.
- No RTMP/SRT streaming is implemented.
- Segment sizes are mock zero-byte values.
- Manifests are in-memory metadata only.
- Recording diagnostics are developer-facing and intentionally compact.
