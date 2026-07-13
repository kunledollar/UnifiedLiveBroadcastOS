# UBOS v5.6.8 — Production-Safe Recording Engine

## Purpose and architectural position

UBOS v5.6.8 adds the authoritative recording-session foundation after the v5.6.7 muxing/media packaging layer. It consumes packaged media metadata, validates recording profiles/sessions/destinations/generations/ownership, and produces deterministic synthetic recording artifacts. It does **not** write real files, open OS handles, upload to cloud/network targets, invoke FFmpeg/libav/native recorders, or claim real persistence.

```mermaid
flowchart TD
  A[Synchronized A/V] --> B[Media Encoder Foundation]
  B --> C[Muxing and Media Packaging v5.6.7]
  C --> D[Finalized PackagedMediaOutput metadata]
  D --> E[Recording Engine v5.6.8]
  E --> F[Profiles + sessions + destinations]
  E --> G[Parts + rollover + split]
  E --> H[Manifest + index + sidecars]
  E --> I[Synthetic artifacts]
  I --> J[Future storage/archive/replay]
```

## Relationship to v5.6.7

The engine treats packaged output PTS, package-session generation, package-output generation, and timeline generation as authoritative. It adds no media clock, no FrameTick source, no encoder, no muxer, and no scheduler.

## Recording types, profiles, and destinations

Supported recording types are Program, Preview metadata, Clean Feed, AUX, ISO video, ISO audio, ISO A/V, Multitrack, Proxy metadata, Archive foundation, and Custom typed. Each immutable profile declares output role, package profile reference, expected container metadata format, source package sessions, destination, filename policy, rollover policy, split policy, sidecar policy, recovery policy, storage policy, queue policy, finalization policy, retention metadata, failure policy, backend preference, and criticality.

Destinations are explicit. Only `SYNTHETIC_MEMORY_REFERENCE` is executable in this phase; local/removable/network/cloud/archive/custom destinations remain redacted metadata only. Storage classes include Temporary, Standard, High Performance, Removable, Network, Cloud, Archive, Synthetic, and Custom.

## Session definitions and lifecycle

Sessions bind a profile generation to a destination generation and remain immutable after registration. Active lifecycle states are explicit and terminal states reject package input.

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> READY: validate
  READY --> RECORDING: start
  RECORDING --> PAUSED: pause
  PAUSED --> RECORDING: resume
  RECORDING --> ROLLING_OVER: rollover
  ROLLING_OVER --> RECORDING: next part
  RECORDING --> DRAINING: drain
  DRAINING --> FINALIZING
  RECORDING --> FINALIZING: stop/finalize
  FINALIZING --> FINALIZED
  RECORDING --> ABORTING: abort
  ABORTING --> ABORTED
  RECORDING --> RECOVERING: recover
  RECOVERING --> RECOVERED
  RECOVERED --> READY
  FINALIZED --> SHUTDOWN
  ABORTED --> SHUTDOWN
```

## Policies

Start, pause/resume, stop, rollover, split, filename, collision, storage, quota, recovery, and queue policies are explicit. Program defaults wait for package readiness, initialization package, video keyframe metadata, and all critical tracks. Pause occurs at package boundaries. Stop is bounded through drain/finalize or abort policy.

## Source bindings and recording paths

Source bindings are explicit and generation validated. Program, Preview, Clean Feed, AUX, ISO, and Multitrack sessions have independent parts/manifests/artifacts and no writable artifact aliasing.

```mermaid
flowchart LR
  P[Program package session] --> PR[Program recording session]
  PV[Preview metadata session] --> PM[Preview recording metadata]
  CF[Clean Feed package session] --> CR[Clean Feed recording]
  AUX[AUX package sessions] --> AR[AUX recordings]
  ISO[ISO audio/video package sessions] --> IR[ISO recordings]
  PR --> A1[Program synthetic artifact]
  PM --> A2[Preview metadata artifact]
  CR --> A3[Clean Feed artifact]
  AR --> A4[AUX artifact]
  IR --> A5[ISO artifact]
```

## Package input, requests, and plans

`RecordingPackageInput` contains IDs, generations, output role, container format, package type, segment/fragment/init IDs, PTS, duration, discontinuity generation, finalization flag, ownership, estimated bytes, checksum, timeline generation, and safe metadata only. `RecordingWriteRequest` adds expected session/profile/destination/package/timeline generations, frame, deadline, cancellation reference, and correlation ID. `RecordingWritePlan` deterministically resolves part, filename metadata, collision action, synthetic reservation action, rollover/split decisions, manifest/index action, sidecar action, recovery action, and ownership transfer order.

## Recording parts and ownership

```mermaid
flowchart TD
  A[Package submitted] --> B[Validate generations]
  B --> C[Reserve synthetic capacity]
  C --> D[Consume package exactly once]
  D --> E[Update active recording part]
  E --> F{Rollover or split?}
  F -->|No| G[Update manifest/index]
  F -->|Yes| H[Finalize current part]
  H --> I[Create deterministic next part]
  G --> J[Release package ownership]
  I --> J
```

```mermaid
flowchart LR
  P[PackagedMediaOutput lease] -->|borrow/transfer explicit| R[Recorder]
  R -->|synthetic artifact lease| A[Artifact registry metadata]
  A -->|exact-once release| X[Released]
  R -->|failure| F[Release package reference]
```

Parts track sequence, synthetic filename reference, container format, runtime frames, PTS, duration, package/segment/fragment/init counts, estimated/reserved bytes, discontinuity generation, finalization, recoverability, and checksum. Part sequences are monotonic per session.

## Rollover and split recording

```mermaid
flowchart TD
  A[Evaluate rollover policy] --> B{Threshold met?}
  B -->|No| C[Keep current part]
  B -->|Yes| D[Finalize current valid part]
  D --> E[Update manifest/index]
  E --> F[Create next deterministic part]
  F --> G[Continue package order]
```

```mermaid
flowchart TD
  A[Evaluate split policy] --> B{Marker/source/scene/discontinuity?}
  B -->|No| C[No split]
  B -->|Yes| D[Record split metadata]
  D --> E[Preserve package ownership]
  E --> F[Bound split history]
```

## Storage reservations, pressure, quotas, queues, and backpressure

The synthetic backend models reservations only against destination metadata. It never polls OS storage. Pressure states are deterministic from registered capacity metadata. Queue snapshots are bounded by count/bytes; overflow is observable through telemetry/watchdog.

```mermaid
flowchart LR
  A[Package estimated bytes] --> B[Synthetic reservation]
  B --> C[Consumed reservation metadata]
  C --> D[Pressure evaluation]
  D --> E{Normal/Elevated/High/Critical/Exhausted}
  E --> F[Watchdog + policy]
```

```mermaid
flowchart TD
  A[Input queue] --> B[Plan processor]
  B --> C[Artifact queue]
  A --> D[Backpressure state]
  C --> D
  D -->|SOFT/HARD/CRITICAL| E[Telemetry + watchdog]
```

## Manifests, indexes, and sidecars

Manifests are immutable snapshots with deterministic part order, counts, byte estimates, rollovers, splits, recovery state, finalization state, and checksums. Indexes track timeline entries, part/segment boundaries, discontinuities, and bounded metadata markers. Sidecars are metadata-only for JSON summaries, chapters, markers, scene/source changes, tally/loudness/health summaries, checksums, and custom typed metadata.

```mermaid
flowchart LR
  A[Part update] --> B[Manifest generation +1]
  A --> C[Index generation +1]
  B --> D[Checksum manifest]
  C --> E[Timeline boundaries]
  D --> F[Source Graph metadata]
  E --> F
```

## Pause, resume, drain, finalization, abort, and recovery

```mermaid
flowchart TD
  A[RECORDING] --> B[Pause command]
  B --> C[Safe package boundary]
  C --> D{Pause policy}
  D --> E[Close current part]
  D --> F[Keep metadata open]
  E --> G[PAUSED]
  F --> G
  G --> H[Resume]
  H --> I{Resume current?}
  I -->|Yes| A
  I -->|No| J[Deterministic new part]
  J --> A
```

```mermaid
flowchart TD
  A[Stop/finalize] --> B[Stop accepting packages]
  B --> C[Drain bounded queues]
  C --> D[Finalize current part metadata]
  D --> E[Finalize manifest/index]
  E --> F[Create synthetic artifact]
  F --> G[Release ownership]
  G --> H[FINALIZED]
```

```mermaid
flowchart TD
  A[Abort] --> B[Stop ingestion]
  B --> C[Mark incomplete artifact]
  C --> D[Release package ownership]
  D --> E[Emit recovery metadata]
  E --> F[ABORTED]
```

```mermaid
flowchart TD
  A[Incomplete/interrupted metadata] --> B[Recovery required]
  B --> C[Preserve finalized parts]
  C --> D[Rebuild manifest/index metadata]
  D --> E[Start deterministic new part or mark incomplete]
  E --> F[RECOVERED]
```

## Backend abstraction and synthetic backend

The backend contract provides descriptors, capabilities, planning, part creation/finalization, pause/resume, rollover, drain, finalize, abort, recover, reset, reconfigure, and shutdown. The synthetic backend is deterministic, non-persistent, non-file-output, metadata-only, and safe for replay.

## Command integration, processor order, and output registry

Commands are typed runtime-command handlers and do not mutate macros directly. The processor uses TickProcessorFramework at order `1000`, after encoder `900` and packaging `950` conventions.

```mermaid
sequenceDiagram
  participant C as RuntimeCommandEngine
  participant R as RecordingCommandHandlers
  participant E as RecordingEngine
  C->>R: RECORDING_START/STOP/PAUSE/RESUME
  R->>E: generation-checked action
  E-->>R: immutable metadata snapshot
  R-->>C: auditable result
```

```mermaid
flowchart LR
  A[Encoder 900] --> B[Mux/Packaging 950]
  B --> C[Recording Engine 1000]
  C --> D[ProcessorOutputRegistry]
```

## Health, telemetry, watchdog, and Source Graph

Health summarizes state counts, package/part/artifact counts, failures, pressure, queue bytes, retained bytes, and last artifact/PTS. Telemetry includes bounded counters for registrations, lifecycle operations, plans/cache, parts, rollovers, splits, manifests/indexes, markers, artifacts, reservations, pressure, quota, drains, finalizations, aborts, recoveries, queues, backpressure, duplicate/stale/incompatible rejects, backend/timeouts/allocation/ownership failures, byte estimates, averages/maxima, current request IDs, active sessions, last event, and health summary. Watchdog incidents are bounded and include safe recovery steps. Source Graph exposes only redacted bounded metadata.

```mermaid
flowchart TD
  A[Engine state] --> B[Health]
  A --> C[Telemetry]
  A --> D[Watchdog]
  A --> E[Source Graph metadata]
  B --> F[Output registry]
  C --> F
  D --> F
  E --> F
```

## Security, redaction, and production safety

Snapshots are JSON-safe, immutable, deterministic, bounded, and redacted. Observability excludes package bytes, file bytes, raw paths, URLs, cloud bucket names, credentials, source secrets, browser URLs, endpoints, native handles, mutable leases, and private operator/source metadata.

```mermaid
flowchart LR
  A[Failure or invalid package] --> B[Reject invalid metadata]
  B --> C[Preserve finalized parts]
  C --> D[Release ownership]
  D --> E[Recovery metadata]
  E --> F[Degraded recorder]
```

```mermaid
flowchart TD
  A[Shutdown] --> B[Stop accepting commands/packages]
  B --> C[Release leases]
  C --> D[Release reservations]
  D --> E[Clear requests/plans/queues]
  E --> F[Backend shutdown]
  F --> G[No active session/open part/queue/cache]
```

## Invariants, validation, determinism, and performance

`assertInvariants()` verifies unique IDs, valid references, one active writable part per session, monotonic sequences, non-negative reservations, bounded histories, and clean shutdown conditions. Validation uses fake FrameTicks, deterministic package metadata, synthetic destinations/backend, bounded queues, explicit ownership, determinism replay, long-run package/tick simulation, and operation-count complexity assertions. Expected complexity is O(1) for lookups/queue/package/storage/rollover/split operations, O(active sessions) for processor orchestration, and O(registry + bounded state) for snapshots/watchdog.

## Limitations and v5.6.9 handoff

v5.6.8 remains a foundation: no real MP4/TS/MKV writing, no disk persistence, no cloud/network delivery, no replay, no encryption/DRM, no editing, no proxy/thumbnail/transcription. v5.6.9 should certify the integrated audio, encoding, packaging, and recording chain end-to-end.
