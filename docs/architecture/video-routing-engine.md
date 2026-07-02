# Video Routing Engine Foundation

Phase 6.4 introduces a renderer-neutral video routing layer for UBOS. The routing engine describes where composed scene video should flow without owning browser `MediaStream` objects, encoders, transports, GPU surfaces, OBS, FFmpeg, RTMP, SRT, or NDI integrations.

## Purpose

The Video Routing Engine turns Production Graph state and Scene Compositor outputs into a deterministic `VideoRoutePlan`. A route plan is a declarative map from a composition to one or more logical destinations such as Program, Preview, Vertical, Multiview, Recording, Stream, Monitor, Confidence, or External outputs.

## Relationship to the Production Graph

The Production Graph remains the source of truth for broadcast state: current program scene, preview scene, destinations, recording status, scenes, and revision metadata. Routing reads this graph and records the graph revision on every route, but it does not mutate the graph and does not store runtime media handles inside it.

## Relationship to the Scene Compositor

The Scene Compositor produces renderer-neutral `SceneComposition` objects. The routing planner consumes those composition descriptions and points route sources at composition ids and scene ids. The route layer does not render pixels and does not decide layout; it only assigns already-planned compositions to output targets.

## Route Model

A `VideoRoute` contains stable routing metadata:

- `id`
- `sourceCompositionId`
- `sourceSceneId`
- `target`
- `targetId`
- `status`
- `enabled`
- `priority`
- `createdAt`
- `updatedAt`
- `graphRevision`
- `metadata`

Supported statuses are `idle`, `planned`, `active`, `disabled`, `failed`, and `unavailable`. Supported targets are `program`, `preview`, `vertical`, `multiview`, `recording`, `stream`, `monitor`, `confidence`, and `external`.

## Route Planner

`createVideoRoutePlan(graph, compositions, options)` is a pure deterministic planner. It inspects the current program scene, preview scene, recording state, enabled destinations, and available scene compositions, then emits route entries for program, preview, vertical, multiview, recording placeholders, stream placeholders, and optional confidence monitoring.

The planner intentionally performs no media execution and no encoding. Missing inputs are reported as warnings so the developer inspector can surface the issue without crashing the app.

## Fan-out Routing

Fan-out is represented by multiple routes sharing the same `sourceCompositionId`. For example, the same Program composition can be routed to Program, Recording, Stream, and Confidence Monitor destinations. `createVideoRouteGraph(plan)` groups routes by composition id to make fan-out diagnostics easy to inspect.

## Validation

Validation helpers detect missing compositions, missing scenes, duplicate route targets, disabled routes, unsupported targets, invalid priorities, and missing output destinations. Warnings are non-fatal. Errors mark validation results invalid but still keep the diagnostic payload structured for developer tooling.

## Lifecycle

Lifecycle helpers only update route state and metadata:

- `activateRoute()` marks a route active.
- `deactivateRoute()` returns a route to idle.
- `failRoute()` marks a route failed and may attach an error.
- `markRouteUnavailable()` marks a route unavailable and may attach a reason.

These helpers do not start encoders, subscribe to streams, or allocate rendering resources.

## Execution Integration

The Media Execution Plane now recognizes routing intents, including building route plans and routing program, preview, multiview, recording, and stream video. The mock execution adapter handles these intents by creating and validating route plans, storing the latest route graph in memory, and returning structured warnings/errors. This preserves the existing dry-run and mock-live architecture.

## Future Encoder and Transport Integration

Future phases can bind routes to concrete adapters. A stream route may later select RTMP or SRT, a monitor route may later bind to NDI or WebRTC preview surfaces, and a recording route may later bind to FFmpeg or platform-native encoders. Those integrations should consume the route graph rather than bypassing the Production Graph or Scene Compositor.

## Known Limitations

- No frames are processed.
- No encoder, muxer, or network transport is implemented.
- Routing is in-memory and developer-facing only.
- Route ids are derived from target and composition identity for deterministic planning.
- Vertical, recording, streaming, confidence, monitor, and external routing remain architectural placeholders until future adapter phases.
