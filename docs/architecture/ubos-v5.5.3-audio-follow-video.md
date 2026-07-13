# UBOS v5.5.3 — Audio-Follow-Video and Transition Audio Foundation

## Purpose and architectural position

UBOS v5.5.3 connects authoritative scene switching and transition execution to metadata-only Program audio routing. The subsystem resolves scene audio memberships, builds deterministic Program/Preview route snapshots, publishes transition contribution metadata, and preserves future mixer handoff metadata without claiming PCM mixing, gain-ramp DSP, encoding, recording, streaming, or native device capture.

It sits after v5.5.1 Scene Switching and v5.5.2 Transition Execution and before scene compositing/output publication:

```mermaid
flowchart TD
  A[Scene switch request] --> B[Scene Switching Controller]
  B --> C[Transition Execution Engine]
  C --> D[Audio-Follow-Video Controller]
  D --> E[Resolve source and target memberships]
  E --> F[Build deterministic route plan]
  F --> G[Commit Program audio at FrameTick]
  G --> H[Publish Program audio state]
  H --> I[Future Audio Mixer / Encoder]
```

## Relationship to v5.5.1 and v5.5.2

Scene Switching remains video-bus authority. Transition Execution remains transition-progress authority. Audio-Follow-Video consumes committed/scheduled scene and transition metadata and owns only audio route state, contribution metadata, health, telemetry, watchdog classification, and source graph metadata.

## Audio bus model and follow modes

The public API defines `PROGRAM_AUDIO`, `PREVIEW_AUDIO`, `AUX_AUDIO`, `CLEAN_FEED_AUDIO`, `MONITOR_AUDIO`, and `CUSTOM`. v5.5.3 treats Program audio as authoritative and Preview as isolated metadata. Follow modes are explicit: `FOLLOW_PROGRAM_SCENE`, `FOLLOW_SELECTED_SOURCE`, `FOLLOW_PRIMARY_AUDIO_SOURCE`, `FOLLOW_SCENE_DEFAULT`, `MANUAL`, `HOLD_CURRENT`, `MUTE`, and `CUSTOM`.

```mermaid
flowchart LR
  P[Preview route changes] -. distinct generation .-> PR[PREVIEW_AUDIO]
  G[Committed transaction] --> PA[PROGRAM_AUDIO]
  PR -. no mutable alias .- PA
```

## Scene audio membership and source references

A scene membership is immutable, JSON-safe, and contains scene generations, source references, default/optional/persistent/muted/solo source IDs, source priorities, role mappings, routing policy, transition policy, and sanitized metadata. Source references expose IDs, generations, role, availability, activity, mute/persistence flags, sample-rate/channel/clock metadata, health, and last-buffer timestamp metadata only. They never expose PCM buffers, native handles, credentials, private paths, device endpoints, or mutable leases.

## Program route, switch modes, and transition definitions

Program routes are immutable transaction outputs with route ID/generation, Program scene ID/generation, active/muted/persistent references, contribution metadata, transition state, transition ID, runtime frame, health, and safe metadata. Switch modes include `CUT`, `CROSSFADE`, `FADE_OUT_IN`, `FADE_TO_SILENCE`, `HOLD_CURRENT`, `CONTINUE_COMMON_SOURCES`, `MUTE_THEN_SWITCH`, and `CUSTOM`. Crossfade/fade modes are metadata-only until a validated mixer backend exists; `realAudioMixApplied` is therefore false.

```mermaid
sequenceDiagram
  participant V as Video Commit Frame
  participant A as Audio Follow Controller
  participant R as Program Route
  V->>A: CUT commit FrameTick
  A->>A: validate generations and memberships
  A->>A: resolve persistent/common sources
  A->>R: atomic route commit exactly once
  A-->>V: synchronized audioCommitFrame
```

Transition definitions are immutable registrations with ID, version, generation, mode, bounded positive duration, easing, source/target fade policy, common-source policy, persistent-source policy, mute/silence policy, per-role overrides, and safe metadata. Registration does not execute routing.

```mermaid
flowchart TD
  T[FrameTick] --> P[Transition progress]
  P --> E[Deterministic easing]
  E --> C[Contribution metadata]
  C --> S[Source contribution]
  C --> U[Target contribution]
  U --> F[Final target route commit]
```

## Common and persistent source policies

Common-source policy is explicit and defaults to preventing duplicate source gain stacking. Persistent policy is explicit and bounded, supporting host microphones and music beds persisting across scene changes while guest/browser/media sources may follow target scene or stop on exit.

```mermaid
flowchart TD
  A[Source scene sources] --> C{Common source?}
  B[Target scene sources] --> C
  C -->|KEEP_CONTINUOUS| K[One continuous contribution]
  C -->|RESTART/FADE_OUT_IN| M[Mode-specific metadata]
  B --> P{Persistent?}
  P -->|explicit| R[Retained in route snapshot]
  P -->|not explicit| X[No hidden retention]
```

## FrameTick authority, requests, transactions, and results

FrameTick is the only audio transition clock. There is no setInterval, Date.now progression, independent scheduler, or secondary runtime loop. Requests contain expected scene/source/route generations, memberships, current route, mode, transition reference, start tick, deadline metadata, cancellation metadata, failure policy, correlation ID, and safe metadata. Transactions move through explicit states and commit or rollback exactly once. Results include previous/new routes, generation, commit frames, synchronization state, contribution summaries, persistent/muted summaries, warnings, duration, and completion time.

```mermaid
flowchart LR
  FT[Authoritative FrameTick] --> TX[Audio routing transaction]
  TX -->|CUT at scheduled frame| C[Commit target route]
  TX -->|AUTO/TAKE each frame| M[Publish metadata]
  M -->|completion| C
```

## Missing-source and audio/video failure coordination

Missing required sources are observable and follow explicit policy: fail route, mute missing source, skip optional source, hold current audio, use explicit fallback, use silence metadata, degrade, or request operator intervention. Audio/video failure coordination is explicit: preserve both, switch video while holding/muting audio, fail entire switch, rollback both, degrade and notify, or custom.

```mermaid
flowchart TD
  F[Audio validation failure] --> P{Failure policy}
  P --> H[Hold current Program audio]
  P --> M[Mute Program audio]
  P --> R[Rollback audio/video]
  P --> D[Degrade and notify]
  D --> O[Observable result and watchdog incident]
```

## Integration points

`AudioFollowVideoProcessor` implements the v5.1 `TickProcessor` contract and is ordered after scene switching and transition execution and before compositor/output publication. It publishes Program route, Preview route, active transaction, result, health, telemetry, and contribution snapshots to the existing `ProcessorOutputRegistry`. Commands are exposed as v5.1 command handlers with exactly-once/idempotent metadata and generation-aware payload expectations.

## Commands, output registry, events, health, telemetry, and watchdog

The API exports typed command constants for mode changes, membership registration/update/removal, Program/Preview route metadata, CUT/TAKE/AUTO, cancel/rollback, mute/unmute, persistent sources, transition/failure policy, validation, and shutdown. Output keys are distinct for Program/Preview routes and failed/rejected results. Events are bounded and typed. Health and telemetry counters are bounded and include route counts, duplicate requests/ticks, stale generations, missing/unavailable sources, persistent/common counts, synchronization mismatches, active source IDs, current transaction ID, and last event. Watchdog incident constants classify stalls, timeouts, duplicate requests/commits/ticks, stale generations, missing/unavailable sources, invalid contributions, sync mismatches, commit/rollback failures, output mismatch, Program/Preview leakage, and invariant failures.

## Source Graph metadata and security

Source Graph integration exposes metadata only: Program/Preview route IDs, active/muted/persistent source IDs, roles, route generations, follow mode, active transaction ID, transition mode/progress, sync state, health, and routing eligibility. Sanitization redacts device paths, endpoint names, native handles, browser URLs, network endpoints, credentials, private metadata, and operator identifiers. Snapshots are deeply immutable, bounded, deterministic, JSON-safe, and free of PCM/sample content.

## Production-safety invariants

The implementation asserts unique IDs/generations, valid active references, Program/Preview isolation, one route commit per transaction, duplicate tick idempotence, finite bounded contributions, no duplicate common-source contribution, exact final target route metadata, explicit degraded sync mismatch, no Program route change after cancellation/failure, valid rollback, state/telemetry agreement, bounded retained state, and clean shutdown.

```mermaid
sequenceDiagram
  participant C as Command Handler
  participant A as Audio Controller
  participant P as Processor
  participant O as Output Registry
  C->>A: AUDIO_FOLLOW_SHUTDOWN
  A->>A: clear active transaction
  P->>A: shutdown()
  A->>O: no further active route transaction
  A-->>C: idempotent shutdown state
```

## Long-run validation and performance

Validation uses fake FrameTicks, deterministic memberships, synthetic source references, fake transition progress, monotonic diagnostic timestamps, and bounded registries. It exercises 100,000 processor ticks with no real-time sleeping. Expected complexity is O(1) for membership/source/route lookup, O(s log s) or bounded O(s) for common/persistent resolution, O(s) contribution evaluation and route commit, O(memberships + bounded state) snapshot generation, and O(active + bounded incidents) watchdog evaluation.

```mermaid
flowchart TD
  A[100000 fake FrameTicks] --> B[Deterministic route snapshots]
  B --> C[Invariant checks]
  C --> D[Bounded health/telemetry]
  D --> E[Clean shutdown]
```

## Limitations and v5.5.4 handoff

This release is a metadata-routing foundation. It does not implement real PCM mixing, gain ramps, EQ, compression, limiting, loudness normalization, ducking, audio effects, recording, streaming, replay, native audio backends, or audio encoding. v5.5.4 should build Program/Preview Bus Orchestration and Output Role Coordination on top of these stable route, contribution, and synchronization contracts.
