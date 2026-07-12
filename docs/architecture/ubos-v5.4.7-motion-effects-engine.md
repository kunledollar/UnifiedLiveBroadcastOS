# UBOS v5.4.7 Motion Effects Engine

The Motion Effects Engine is a production-safe control and evaluation layer for deterministic keyframe animation. It evaluates metadata-only property values from the authoritative v5.1 `FrameTick`, then publishes immutable resolved-property snapshots for existing geometry, masking, blur/sharpen, color/LUT, AI background, image effects, layer compositor, and scene compositor stages. It does not allocate frames, own GPU resources, mutate downstream targets directly, create timers, implement transitions, or perform CUT/AUTO/TAKE.

```mermaid
flowchart TD
  A[FrameTick] --> B[MotionEffectsProcessor]
  B --> C[Validate timelines, targets, generations]
  C --> D[Build or reuse plan]
  D --> E[Evaluate tracks, easing, markers]
  E --> F[Resolve conflicts atomically]
  F --> G[Immutable resolved-property snapshot]
  G --> H[Existing downstream engines]
```

## Model

```mermaid
classDiagram
  MotionTimeline "1" --> "many" MotionTrack
  MotionTrack "1" --> "many" MotionKeyframe
  MotionTimeline "1" --> "many" MotionMarker
  MotionInstance --> MotionTimeline
  MotionEvaluationPlan --> MotionInstance
```

Timelines are immutable definitions with bounded tracks, keyframes, markers, versions, generations, playback mode, frame-rate basis, delay, priority, tags, and safe metadata. Tracks bind an explicit generated target to one approved property path from the typed vocabulary. Keyframes are sorted deterministically and contain immutable typed values, interpolation, easing, tangent/spring metadata, and hold flags.

## FrameTick authority

Timeline position is derived only from `FrameTick.frameNumber`, the instance start frame, seek/pause state, playback rate, direction, loop mode, and delay. Wall-clock APIs are not used for animation progression; diagnostic timestamps from ticks are copied only into result metadata.

## Processor ordering

```mermaid
sequenceDiagram
  participant R as Runtime TickProcessorFramework
  participant M as MotionEffectsProcessor
  participant O as ProcessorOutputRegistry
  participant D as Downstream Media Stages
  R->>M: processTick(FrameTick)
  M->>M: evaluate once per tick
  M->>O: publish resolved snapshot
  D->>O: consume current-frame properties
```

Motion should be registered before affected downstream stages. Downstream validation remains authoritative and consumes snapshots through typed contexts/output registry keys.

## Conflict resolution

```mermaid
flowchart LR
  A[Resolved candidates] --> B{same target/property?}
  B -->|no| C[Publish]
  B -->|yes| D[Policy: priority/latest/add/blend/min/max/reject]
  D --> E[Stable tie-break by instance and track ID]
  E --> C
```

Discrete properties use STEP/HOLD only and cannot be numerically blended. Conflicts record contributors and the effective winner.

## Retargeting and interruption

```mermaid
flowchart TD
  A[Command with expected generation] --> B{generation current?}
  B -->|no| C[Reject stale]
  B -->|yes| D[Commit new instance generation]
  D --> E[Old completion cannot overwrite]
```

Retarget, seek, pause, resume, cancel, stop, and destroy are explicit generation-changing operations. Queues and histories are bounded.

## Downstream consumption

```mermaid
flowchart TD
  S[Resolved properties] --> G[Geometry: position/scale/rotation/crop]
  S --> M[Masking: transform/opacity/feather]
  S --> B[Blur/Sharpen]
  S --> C[Color/LUT]
  S --> A[AI Background]
  S --> I[Image Effects]
  S --> L[Layer Compositor]
  S --> SC[Scene Compositor metadata]
```

## Lifecycle

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> PLAYING
  PLAYING --> PAUSED
  PAUSED --> PLAYING
  PLAYING --> SEEKING
  SEEKING --> PLAYING
  PLAYING --> COMPLETED
  PLAYING --> CANCELLED
  PLAYING --> STOPPED
  STOPPED --> DESTROYED
```

## Shutdown

```mermaid
sequenceDiagram
  participant C as Command
  participant E as Engine
  participant O as Output Registry
  C->>E: MOTION_SHUTDOWN
  E->>E: clear timelines, instances, plans, histories
  E->>O: no further motion output
```

## Production safety, validation, and limits

The engine enforces finite values, property-schema matching, deterministic ordering, duplicate tick rejection, no arbitrary property traversal, no executable expressions, bounded timelines/tracks/keyframes/instances/plans/history, metadata redaction boundaries, immutable JSON-safe snapshots, health, telemetry, watchdog incident names, and invariant reports. Long-run validation uses fake ticks and deterministic target snapshots; performance is assessed with operation counts rather than machine-specific timing thresholds.

## v5.4.8 and v5.5 boundaries

The v5.4.8 Picture-in-Picture Engine can consume motion snapshots for PIP enter/exit/position effects. Scene transition execution, preview/program transition behavior, CUT/AUTO/TAKE, and transition timing remain reserved for UBOS v5.5 Scene Engine transitions.
