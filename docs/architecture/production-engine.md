# UBOS Production Engine Foundation

Phase 16 introduces the Production Engine as metadata-first architecture. It does not execute commands, dispatch events, schedule work, persist snapshots, open sockets, or change reducers/backend behavior.

## Architecture

The shared package `packages/shared/src/production-engine/` defines versioned, serializable, sanitized metadata for engine state, manifests, queues, locks, snapshots, history, timelines, dependency graphs, commands, events, subscriptions, actions, and transactions. Safe defaults intentionally report `Unavailable`, `No runtime connected`, `Metadata only`, `Not executing`, and `No Production Graph integration`.

## Command Bus

`ProductionCommand` describes definitions such as `CUT`, `AUTO`, `TAKE`, `LOAD_SCENE`, `SHOW_GRAPHIC`, `HIDE_GRAPHIC`, `PLAY_MEDIA`, `STOP_MEDIA`, `START_RECORDING`, `STOP_RECORDING`, `ROUTE_OUTPUT`, `CHANGE_LAYOUT`, `EXECUTE_MACRO`, `ENABLE_OUTPUT`, and `DISABLE_OUTPUT`. These are schemas and defaults only.

## Event Bus

`ProductionEvent` describes descriptive events such as `SceneLoaded`, `GraphicShown`, `MediaStarted`, `GuestJoined`, `OutputEnabled`, `AutomationStarted`, `RecordingStarted`, `TransitionFinished`, `ReplayLoaded`, `DeviceConnected`, and `TimelineAdvanced`. No runtime dispatch is connected.

## Dependency Graph

`DependencyGraph` and `DependencyNode` model relationships like Scene → Graphics → Media → Replay → Outputs with dependencies, priority, execution order, locked state, and validation status. Scheduling is explicitly disabled.

## Transactions

`EngineTransaction` captures transaction ID, timestamp, operator, subsystem, action, dependencies, rollback availability, status, and notes. This is an audit contract only.

## Timeline

`EngineTimeline` stores current time, current/upcoming/completed segments, cue markers, transition markers, and breakpoints. Playback is explicitly disabled.

## Snapshots

`EngineSnapshot` stores current scene, graphics, media, replay, outputs, audio, automation, timeline, guests, and devices metadata. Persistence is explicitly disabled.

## Resource Locks

`ResourceLock` models Program Output, Preview Output, Audio Bus, Graphic Layer, Replay Channel, Recording Encoder, Media Player, and Camera Input ownership with Available, Locked, Busy, Reserved, and Offline states. No locks are acquired.

## Future Runtime Integration

Future phases can bind runtime executors, dispatchers, schedulers, persistence, and Production Graph integration behind these contracts. Phase 16 deliberately keeps all runtime flags false so future behavior can be introduced without changing the metadata shape.
