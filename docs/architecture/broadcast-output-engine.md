# Broadcast Output Engine Foundation

Phase 6.6 introduces a renderer-neutral and transport-neutral Broadcast Output Engine for UBOS. It models how routed program, preview, vertical, recording, stream, monitor, archive, replay, virtual camera, and external outputs should be prepared for future delivery without encoding, streaming, recording, or calling platform APIs.

## Purpose

The engine turns Production Graph state plus Video Routing and Audio Routing plans into a deterministic `BroadcastOutputPlan`. The plan describes logical destinations, pairings, formats, transports, lifecycle state, warnings, and fan-out relationships.

## Relationship to the Production Graph

The Production Graph remains the source of truth for broadcast state, enabled destinations, recording state, graph revision, and metadata. The output engine only reads this state and never stores media frames, audio samples, encoded packets, secrets, or transport sessions in the graph.

## Relationship to Video and Audio Routing

The output planner consumes `VideoRoutePlan` and `AudioRoutePlan` to pair destination targets with logical AV routes. Missing routes become warnings rather than crashes so the control room remains stable while adapters are incomplete.

## Output Plan Model

`BroadcastOutputPlan` contains logical `BroadcastOutput` groups, `BroadcastOutputDestination` entries, a `BroadcastOutputGraph`, warnings, revision metadata, and deterministic IDs. It can represent one Program AV feed fanning out to many logical destinations.

## Destination Model

Destinations include id, label, type, target, enabled flag, lifecycle status, optional video/audio route IDs, format, placeholder transport, priority, timestamps, graph revision, and metadata. Placeholder destination types include RTMP, SRT, NDI, WebRTC, WHOP, WHEP, recording, virtual camera, monitor, local preview, and platform.

## Format Model

Formats are codec/container placeholders only. Defaults include 1920x1080 60fps horizontal, 1080x1920 60fps vertical, 1280x720 30fps fallback, and audio-only placeholder definitions.

## Lifecycle Model

Lifecycle helpers update logical state only: idle, planned, ready, starting, active, degraded, stopping, stopped, failed, unavailable, and disabled. No helper opens sockets, writes files, invokes FFmpeg, or touches media samples.

## Fan-out Model

Program output can feed multiple logical destinations, for example YouTube RTMP placeholder, Facebook RTMP placeholder, local recording placeholder, confidence monitor placeholder, and archive placeholder. This is modeled in `BroadcastOutputGraph.fanOut`.

## Validation

Validation detects missing video/audio routes, enabled destinations without placeholder transport config, unsupported output types, invalid formats, mismatched orientation, duplicate destinations, disabled outputs, missing stream-key placeholders, and recording outputs without path placeholders. Warnings are developer diagnostics and do not crash the application.

## Future Integration

Future phases can add recording, RTMP, SRT, NDI, WebRTC, virtual camera, and platform adapters behind the existing plan model. Those adapters should consume output intents and plans rather than bypassing the Production Graph or storing real media in graph state.

## Known Limitations

This phase intentionally does not encode media, stream to platforms, record files, invoke FFmpeg, expose real credentials, or redesign the Control Room UI. The inspector is developer-facing and compact.
