# Multiview & Confidence Monitoring Foundation

Phase 8.2 adds a metadata-only Professional Multiview and Confidence Monitoring foundation. It gives operators and developers a deterministic view of program, preview, stream, recording, audio, network, renderer, output, and guest confidence without introducing a new renderer, transport, encoder, FFmpeg path, or raw media storage.

## Purpose

The multiview model describes tiles, layouts, health, frame identity, graph revision, warnings, and integration identifiers. It is an execution-plane diagnostic model, not a media payload container.

## Relationship to Scene Compositor

Multiview plans reference scene/composition identity and use the existing composition architecture as their source of truth. Future visual multiview rendering should consume `SceneComposition` metadata and render through the established browser renderer/compositor path.

## Relationship to Browser Renderer

The foundation does not create a separate rendering engine. Browser Renderer diagnostics can feed confidence status, while multiview state stores only IDs, labels, bounds, health, fps/latency/frame-age placeholders, warnings, and metadata.

## Relationship to Recording and Streaming Engines

Recording and Streaming are represented by tile metadata and confidence signals. Stream plans, recording IDs, statuses, and warnings can be summarized, but encoded packets, files, sockets, RTMP/SRT transports, and FFmpeg state are not stored.

## Confidence Monitoring Model

`ConfidenceMonitor` tracks program, preview, stream, recording, guest, audio, network, renderer, and output signals. Status values are `healthy`, `warning`, `degraded`, `critical`, `unavailable`, and `unknown`; summaries report the worst status and signal counts.

## Tile Model and Layout Presets

`MultiviewTile` contains metadata only: identifiers, type, label, optional source/scene/route/output/recording/stream IDs, bounds, status, health, simulated fps/latency/frame age, warnings, and metadata. Supported presets are `two_view`, `quad`, `six_way`, `eight_way`, `nine_way`, `sixteen_way`, `broadcast_truck`, and `dynamic`.

## Failure, Backpressure, and Replay

Failures and recovery states appear as warnings and health changes. Backpressure is modeled as degraded tile or signal status, never by storing media buffers. `MultiviewSnapshot` has `containsMediaPayloads: false`, includes frame ID and graph revision, and is replay-safe.

## Future Real Multiview Renderer Plan

A future renderer can consume `MultiviewPlan` and existing browser composition outputs to draw a professional multiview. It must remain behind the Media Execution Plane and must not write raw frames, DOM nodes, canvas refs, MediaStreams, audio samples, or encoded packets into the Production Graph or multiview store.

## Known Limitations

Current behavior is mock-only: health, confidence, fps, latency, and frame age are simulated. No real FFmpeg, RTMP, SRT, encoding, packet transport, media recording, or separate rendering engine is implemented.
