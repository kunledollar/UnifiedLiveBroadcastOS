# UBOS Version 4.1 — Broadcast Runtime Core

The Broadcast Runtime Core turns UBOS into a centralized, deterministic broadcast operating system while leaving the UI architecture frozen. Workspace Manager, Command Center Shell, One Owner Rule, ProductionGraph, and existing runtime systems remain outside this core and are not redesigned.

## Ownership

`RuntimeController` owns production lifecycle orchestration and coordinates lifecycle commands across managers. The default runtime includes explicit lifecycle state machines for production, device, session, scene, switching, recording, streaming, health, and scheduling.

## Communication Contract

Subsystems do not call each other directly. Every lifecycle transition is published through `RuntimeEventBus`, which provides an ordered, replayable event log with monotonically increasing sequence numbers.

## Required Lifecycle API

Every runtime subsystem implements:

- `initialize()`
- `start()`
- `pause()`
- `resume()`
- `stop()`
- `dispose()`

## Deterministic State Machines

Each subsystem uses the same explicit transition table:

| Command | Allowed From | Target |
| --- | --- | --- |
| initialize | uninitialized, stopped, disposed, failed | initialized |
| start | initialized, stopped, paused | running |
| pause | running | paused |
| resume | paused | running |
| stop | running, paused, initialized, failed | stopped |
| dispose | initialized, stopped, failed, uninitialized | disposed |

Invalid transitions throw synchronously so lifecycle errors cannot be hidden by UI state.

## Managers

- `SessionManager` owns broadcast session lifecycle metadata.
- `DeviceManager` owns device lifecycle metadata.
- `HealthManager` owns runtime health lifecycle metadata.
- `RuntimeScheduler` serializes controller commands and records deterministic scheduling depth.

## UI Independence

The core exports metadata-only snapshots with `containsRuntimeHandles: false`. It does not import UI components, mutate layouts, or directly access ProductionGraph internals.
