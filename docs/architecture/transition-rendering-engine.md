# Transition Rendering Engine (UBOS 2.0 Phase 2.12)

Phase 2.12 adds a backend-independent `TransitionRenderer` that renders metadata-only visual transitions between current Program and incoming Preview scenes. The renderer composes source frames through `SceneCompositor`, produces a transition frame description, optionally submits a metadata `GpuFrame` to the GPU runtime, and emits lifecycle events that can be replayed without media payloads or runtime handles.

## Abstractions

- `TransitionRenderer` owns transition execution, event emission, compositor coordination, and optional GPU submission.
- `TransitionEffect` is a small interface with `kind` and `render(context)` so effects remain renderer-backend independent.
- `TransitionTimeline` samples `MediaClock` frame identity and presentation timestamps to calculate deterministic progress.

## Supported Effects

- `cut`: immediate replacement with the Preview frame.
- `dissolve`: cross-fades Program layers out while Preview layers fade in.
- `fade`: fades through black at the midpoint.
- `dip_to_black`: dips to generated black between Program and Preview frames.

Wipes, stingers, DVE, macros, and animated overlays are intentionally excluded from this phase.

## Runtime Events

Every transition event is metadata-first and includes transition id, effect kind, frame id, progress, source Program scene id, destination Preview scene id, and serializable metadata:

- `transition_started`
- `transition_progress`
- `transition_completed`

## Demo

`createTransitionRendererDemo()` creates Program and Preview compositors, starts a dissolve from Program to Preview, renders one metadata-only transition frame, then completes the transition.
