# Production Graph Execution Engine Foundation (Phase 17)

Phase 17 connects the metadata-first Production Engine foundation to the existing Production Graph through a deterministic, replayable execution contract. It does **not** perform real media execution: no camera streams, WebRTC runtime changes, GPU compositor, encoder, streaming runtime, device communication, or distributed locking is introduced.

## Execution request lifecycle

1. A `ProductionExecutionRequest` wraps a production command with operator, source, timestamp, dry-run flag, and metadata.
2. The command dispatcher rejects unsupported commands and unsafe runtime payloads before graph mutation.
3. The graph adapter creates a `GraphMutationPlan` that describes metadata-only mutations, dependencies, locks, validation, target revision, and reversibility.
4. The dependency resolver checks metadata references such as scenes, output destinations, and automation cues.
5. The lock resolver checks existing `ResourceLock` metadata and blocks locked targets.
6. Dry runs return the plan without graph changes, events, snapshots, or applied transactions.
7. Applied commands mutate the graph through deterministic metadata code, record events, append transaction metadata, and create a snapshot.

## Command dispatcher

The dispatcher supports the Phase 17 metadata-compatible commands: preview/program switching, source add/update/remove, graphics metadata staging/take/layer changes, media asset/stage/take metadata, output routing metadata, and automation cue arm/mark metadata. Unsupported commands return a structured rejection.

## Graph adapter and mutation plans

The graph adapter translates safe commands into `GraphMutationPlan` records. Each `GraphMutation` is marked `metadataOnly: true` and captures target type, target id, before/after metadata, and mutation type. The adapter rejects runtime handles, browser objects, DOM nodes, sockets, secrets, stream keys, device handles, and functions by validating payload and metadata keys.

## Event recording

Accepted commands emit descriptive ProductionEvents only. For example, setting preview emits `PREVIEW_SCENE_CHANGED`, then transaction and snapshot events. Taking preview emits program-scene and preview-taken metadata events. These are not fake runtime or media events.

## Transactions

Transactions are append-only metadata records with command id, operator id, subsystem, timestamp, status, graph revision before/after, reversibility, warnings, and errors. Phase 17 includes an in-memory transaction log only.

## Snapshots

Snapshots capture program scene, preview scene, sources, graphics metadata, media metadata, output routes, automation state, collaboration state, distribution state, device state, revision, creation time, and `containsRuntimeHandles: false`.

## Replay reconstruction

The replay reconstructor accepts an initial snapshot, event list, and transaction list. It reconstructs metadata revision state, returns known events, warns for unsupported events, and never invokes runtime behavior.

## Lock and dependency resolution

Resource locks are metadata checks only. Locked resources return a blocked result with owner, target, and reason. Dependency checks reject missing scenes, destinations, and automation cue references before mutation.

## Dry-run mode

Dry runs validate commands, create mutation plans, and report warnings/errors without graph changes or applied transactions. This is intended for automation and AI assistant previews.

## Safety guarantees

Phase 17 guarantees metadata-only execution contracts, deterministic graph revision changes, structured results, replay-friendly events, snapshots without runtime handles, and honest rejection of unsafe or unsupported runtime payloads.

## Future runtime integration

Future phases may bind applied metadata events to media runtimes. That integration must remain downstream of this safety layer and must not weaken deterministic validation, lock/dependency checks, or replay contracts.
