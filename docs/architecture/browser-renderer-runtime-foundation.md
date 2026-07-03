# Phase 8.8 Browser Renderer Runtime Foundation

## Purpose

The Browser Renderer Runtime Foundation defines a safe metadata-first runtime boundary for browser-based Program, Preview, Multiview, Vertical Output, overlays, browser sources, graphics, HTML composition, confidence, operator, and guest preview rendering. It adds planning, session, surface, layer, pass, health, diagnostics, manifest, failure, and execution-result models without replacing the existing compositor or redesigning the Control Room UI.

## Relationship to Composition Engine

The browser renderer consumes render plans derived from the existing Composition Engine and Scene Composition. It does not become the canonical compositor and does not mutate composition state. Existing renderer behavior remains unchanged when the feature flags are disabled.

## Relationship to Layout Engine

Layout output is copied into serializable layer and surface metadata. CSS application is a runtime-only helper that operates on provided DOM elements and returns status metadata; CSS objects and DOM handles never enter plans, sessions, replay records, or the Production Graph.

## Relationship to Production Graph

The Production Graph stores metadata only: target names, layer descriptors, layout metadata, frame identity, graph revision, execution batch id, and replay-safe render events. Browser runtime objects are never stored in graph state.

## Runtime-only Object Rules

The following are runtime-only and forbidden in graph or replay state: DOM elements, HTML elements, Canvas contexts, browser nodes, ImageBitmap objects, CSS objects, OffscreenCanvas, MediaStream, and browser handles. Runtime helpers create, attach, detach, request frames, apply CSS, and clean up these objects outside the graph boundary.

## Layer Model

Supported layer metadata includes Background, Video, Overlay, Lower Third, Ticker, Browser Source, Guest, Graphics, Logo, Safe Area, Diagnostics, and Future Layers. Layers carry ids, surface ids, z-index, visibility, opacity, serializable layout metadata, optional source references, and opaque serializable metadata.

## Surface Model

Supported surfaces include Program, Preview, Vertical, Fullscreen, Confidence Monitor, Multiview, Operator Preview, Guest Preview, and Future Browser Source. Surfaces describe dimensions, device pixel ratio, target, attachment status, runtime state, graph revision, and metadata.

## Frame Lifecycle

A render plan is created for a MediaClock-derived frame id, graph revision, and execution batch id. Sessions prepare surfaces and layers, render passes list the involved surfaces and layers, and execution results report success, warnings, errors, and diagnostics. The runtime never creates an independent clock.

## Failure Handling

Surface unavailable, DOM unavailable, render timeout, browser hidden, render exception, layout failure, and resource unavailable are mapped into the UBOS Failure Model as renderer failures with recoverability metadata and graph-mutation prevention markers.

## Backpressure

Diagnostics expose render latency, missed frames, queued updates, render backlog, slow layout, and degraded rendering. Degraded modes include reducing preview updates, pausing diagnostics, and reducing confidence refresh.

## Replay Behavior

Replay stores render plans, layer metadata, layout metadata, frame identity, and render events. Replay never stores DOM and never recreates browser handles; it can execute metadata/mock behavior for deterministic validation.

## Timing Integration

All browser renderer plans and passes reference MediaClock-derived FrameId, GraphRevision, and ExecutionBatchId. The runtime follows the existing Timing Contract and does not introduce an independent browser clock.

## Future GPU Renderer

The foundation exposes capability flags while explicitly reporting GPU support as unavailable for this phase. Future GPU work can consume the same metadata plans without graph changes.

## Future WebGL Renderer

WebGL is reserved for a future runtime backend. This phase does not introduce WebGL rendering or WebGL handles into state.

## Future Canvas Renderer

Canvas rendering is reserved for future work at this layer. This phase does not add Canvas or OffscreenCanvas objects to graph, replay, or plan state.
