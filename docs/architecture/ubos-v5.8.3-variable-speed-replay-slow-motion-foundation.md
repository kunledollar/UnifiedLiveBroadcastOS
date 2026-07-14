# UBOS v5.8.3 — Production-Safe Variable-Speed Replay and Slow-Motion Metadata Foundation

## Purpose and architectural position

UBOS v5.8.3 adds a synthetic, metadata-only variable-speed replay planning layer between the replay playback session and the Program candidate path. It reuses the v5.1 `FrameTick` execution model and processor registry, the replay recall/playback boundaries, and existing audio/program orchestration contracts. It does **not** decode media, synthesize frames, stretch audio, mutate Program/Preview, create a second clock, or create another replay loop.

## Relationship to v5.8.1 and v5.8.2

v5.8.1 owns retained replay ranges and media recall metadata. v5.8.2 owns playback session and Program insertion contracts. v5.8.3 consumes those immutable states and publishes speed-aware plans, positions, selections, cadence, audio/A/V metadata, readiness, health, telemetry, and Program-eligibility metadata.

## Models

- **Playback-rate model:** rational numerator/denominator is authoritative; normalized fractions are deterministic; zero is freeze metadata only; negative numerators are rejected so reverse remains explicit.
- **Rational timing:** source/output mappings use integer and rational remainders; no floating-point accumulation is authoritative.
- **Rate classes:** freeze, ultra-slow metadata, slow-motion metadata, normal, fast-motion metadata, ultra-fast metadata, and custom.
- **Directions:** forward, reverse metadata, ping-pong metadata, and custom. Reverse is never inferred from a negative rate.
- **Video strategies:** exact, nearest, previous, next, repeat metadata, drop metadata, blend required, interpolation required, optical-flow required, HFR-native metadata, and custom.
- **Audio strategies:** follow at 1x, mute nonstandard rates, continue Program audio metadata, time-stretch required, pitch-preservation required, resample required, reverse-audio required, audio-only metadata, operator-controlled, and custom.
- **Speed profiles and built-ins:** normal 1x, half, quarter, three-quarter, double, four-times, freeze, reverse 1x, reverse half, ping-pong, HFR half, HFR quarter, and custom are immutable profiles.
- **Source motion capabilities:** source frame rate, time base, HFR metadata, motion-vector availability metadata, optical-flow eligibility metadata, reverse-decode eligibility metadata, and real-capability flags are recorded without exposing payloads.
- **Slow-motion readiness:** readiness combines requested rate/direction, HFR metadata, retained density, keyframe/lookahead sufficiency, interpolation/optical-flow requirements, audio requirements, and Program policy.
- **Requests/plans/results:** variable-speed requests are generation-checked and deduplicated; plans resolve explicit policies; results mark real processing flags false for the synthetic backend.
- **Clock mapping and position:** mappings are FrameTick-derived, output PTS monotonic, source position bounded, forward source movement nondecreasing, and reverse metadata movement explicit.
- **Frame selection and cadence:** exactly one selection/cadence plan is created per session/tick boundary; repeat, drop, interpolation, optical-flow, and HFR requirements are observable metadata.
- **Speed ramps and rate-change points:** ramps are bounded, deterministic, generation-protected, and metadata-only; no zero crossing or direction reversal is implicit.
- **Freeze and reverse foundations:** freeze holds immutable source references as metadata; reverse decrements source sequence metadata while output PTS remains monotonic.
- **Audio/A/V sync:** audio policy is explicit; unsupported altered-speed replay audio is muted or metadata-only; A/V sync reuses existing conventions and marks degraded states.
- **Duration/lookahead/protection:** duration is rational; lookahead is bounded and direction-aware; protection is bounded and releases exactly once.
- **Program eligibility:** normal forward 1x can be Program-ready; metadata-only altered-speed, reverse, interpolation, optical-flow, and altered audio are Preview metadata only unless a real backend exists.
- **Configuration transactions:** updates are atomic, generation-checked, and cannot mutate the active tick.
- **Backend abstraction:** the synthetic backend validates and plans deterministic metadata while reporting no real variable-speed, interpolation, optical-flow, reverse decode, audio stretch, pitch preservation, or reverse audio support.
- **Processor order:** `ReplayVariableSpeedProcessor` runs at order 1130 after replay playback and before Program eligibility finalization.
- **Output registry, commands, events, health, telemetry, watchdog:** v5.8.3 publishes typed keys, typed command handlers, typed event names, bounded health/telemetry counters, and watchdog incident names.
- **Source Graph and security:** snapshots are bounded, immutable, JSON-safe, redacted, and free of pixels, PCM, payload bytes, paths, credentials, motion-vector payloads, mutable leases, and native handles.
- **Production safety:** no second clock, loop, scheduler, decoder, GPU, audio processor, file access, Program mutation, hidden policy, output after failure/shutdown, ownership leak, or false real-processing claim.
- **Invariants:** `assertInvariants()` verifies unique IDs, rational validity, generation discipline, bounded queues, source range, output monotonicity, Program eligibility, snapshot consistency, and clean shutdown.
- **Long-run validation/determinism/performance:** validation uses fake ticks, 10,000 requests, 100,000 processor ticks, repeated canonical snapshots, deterministic operation counts, and expected O(1)/bounded complexity.
- **Limitations and v5.8.4 handoff:** real media generation, playlist playback, highlight assembly, clip assembly, graphics, and controller integration are deferred to later phases; the next recommended phase is UBOS v5.8.4 Production-Safe Replay Playlist, Highlight, and Clip Assembly Foundation.

## Diagrams

### 1. Replay Playback to Variable-Speed planning flow

```mermaid
flowchart TD
  A[Retained replay range] --> B[Replay recall plan]
  B --> C[Replay playback session]
  C --> D[Variable-speed validation]
  D --> E[Clock mapping]
  E --> F[Position, frame selection, cadence]
  F --> G[Audio and A/V metadata]
  G --> H[Preview metadata / Program eligibility]
```

### 2. Rational source/output clock mapping

```mermaid
flowchart LR
  T[FrameTick] --> R[Rational rate n/d]
  R --> S[Source delta integer + remainder]
  S --> O[Monotonic output PTS]
```

### 3. Speed-profile resolution

```mermaid
flowchart TD
  P[Profile ID + generation] --> V[Validate profile]
  V --> R[Resolve rate]
  V --> D[Resolve direction]
  V --> A[Resolve audio/video strategies]
```

### 4. Frame-selection planning

```mermaid
flowchart TD
  P[Speed-aware position] --> S[Strategy]
  S --> E[Exact/nearest/previous/next]
  S --> M[Repeat/drop/interpolation/optical-flow metadata]
  M --> N[No generated frame claim]
```

### 5. Cadence generation

```mermaid
flowchart LR
  R[Rate] --> C[Cadence type]
  C --> P[Bounded pattern signature]
  P --> O[Observable repeat/drop counts]
```

### 6. Slow-motion readiness

```mermaid
flowchart TD
  Q[Requested rate] --> H[HFR and density checks]
  H --> K[Keyframe/lookahead checks]
  K --> I[Interpolation/optical-flow requirements]
  I --> Ready[Ready/degraded/blocking reasons]
```

### 7. HFR source evaluation

```mermaid
flowchart LR
  S[Source capability] --> H{HFR flag}
  H -->|true| N[Native metadata possible]
  H -->|false| I[Interpolation/drop/repeat requirements]
```

### 8. Speed-ramp lifecycle

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> VALIDATED
  VALIDATED --> SCHEDULED
  SCHEDULED --> ACTIVE_METADATA
  ACTIVE_METADATA --> COMPLETE
  ACTIVE_METADATA --> CANCELLED
  VALIDATED --> FAILED
```

### 9. Freeze metadata lifecycle

```mermaid
stateDiagram-v2
  [*] --> FreezeRequested
  FreezeRequested --> SourceReferenceProtected
  SourceReferenceProtected --> ActiveMetadata
  ActiveMetadata --> ResumeRate
  ResumeRate --> [*]
```

### 10. Reverse metadata lifecycle

```mermaid
flowchart TD
  A[Reverse request] --> B[Explicit direction]
  B --> C[Boundary validation]
  C --> D[Decrement source sequence metadata]
  D --> E[Output PTS monotonic]
```

### 11. Altered-speed audio coordination

```mermaid
flowchart TD
  R[Effective rate/direction] --> A[Audio strategy]
  A --> M[Mute replay audio]
  A --> P[Continue Program audio metadata]
  A --> X[Required processing metadata]
```

### 12. Speed-aware A/V sync

```mermaid
flowchart LR
  V[Selected video PTS] --> S[Sync summary]
  A[Audio PTS metadata] --> S
  S --> D[Degraded metadata if unsupported]
```

### 13. Lookahead and buffer protection

```mermaid
flowchart TD
  R[Rate + direction] --> L[Bounded lookahead]
  L --> P[Protect previous/current/next]
  P --> Pressure[Reject optional altered-speed under pressure]
```

### 14. Program-eligibility decision

```mermaid
flowchart TD
  R[Real frame/audio available?] --> E{Normal 1x forward?}
  E -->|yes| Program[Program eligible]
  E -->|no| Preview[Replay Preview metadata only]
```

### 15. Processor order

```mermaid
flowchart LR
  C[Replay Capture 1100] --> P[Replay Playback 1120]
  P --> V[Variable-Speed 1130]
  V --> G[Program path delegated]
```

### 16. Failure cleanup

```mermaid
flowchart TD
  F[Failure/cancel/timeout] --> R[Reject or reset to 1x]
  R --> M[Mark metadata-only/ineligible]
  M --> C[Clear queues/cache/protection]
```

### 17. Shutdown sequence

```mermaid
sequenceDiagram
  participant Engine
  participant Backend
  Engine->>Backend: drain/shutdown sessions
  Engine->>Engine: clear requests, plans, mappings, selections
  Engine->>Engine: clear protection and transactions
  Engine-->>Engine: stopped snapshot
```
