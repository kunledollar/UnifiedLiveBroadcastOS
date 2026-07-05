# UBOS Runtime Switching Architecture

Phase 20 introduces the first internal production switching runtime. The runtime is deterministic and mutates only UBOS production state; streaming, recording, WebRTC, FFmpeg, GPU rendering, browser capture, encoding, media playback, replay playback, hardware protocols, and device control remain out of scope and are represented as unavailable, inactive, or not connected.

## Execution lifecycle

Operator input flows through the same lifecycle for CUT, AUTO, TAKE, preview selection, program selection, transition changes, undo, and redo:

1. Operator presses a control-room button.
2. UI creates a runtime command.
3. The dispatcher validates duplicate, lock, queue, and active-transition conflicts.
4. The command enters the runtime queue.
5. The runtime lock is acquired.
6. The executor performs a graph/state mutation.
7. A snapshot is captured.
8. History, undo, redo, metrics, and health are updated.
9. The UI receives the new runtime state.

## Command dispatcher and queue

`RuntimeDispatcher` sends command objects into `RuntimeSession.dispatch()`. `RuntimeQueue` preserves FIFO ordering and exposes queue snapshots so the UI can display pending work. The dispatcher rejects unsafe conflicts, including parallel transitions, locked execution, duplicate CUT, duplicate AUTO, and queue conflicts.

## Runtime state

`RuntimeState` tracks current program, current preview, current transition, transition active, transition progress, transition duration, last command, current scene, current composition, execution queue, timestamp, and status. CUT immediately places preview on program. AUTO performs the same deterministic state mutation while recording AUTO transition metadata and duration. FADE, DISSOLVE, WIPE, SLIDE, PUSH, ZOOM, and STINGER are metadata/placeholder transition handlers until a future rendering engine phase.

## History, undo, and redo

`RuntimeHistory` stores snapshots plus undo and redo stacks. Runtime snapshots capture program, preview, layer visibility, selected scene, composition, timestamp, operator, and command. Undo restores the previous snapshot and places the current snapshot on the redo stack. Redo restores the next snapshot and re-enters it into undo history.

## Recovery

`RuntimeRecoveryManager` exposes `RestoreLastSnapshot()`, `Rollback()`, and `SafeRestart()`. Restore returns the latest captured runtime snapshot. Rollback delegates to undo. Safe restart restores the latest snapshot if available, otherwise keeps the current state.

## Runtime health and metrics

`RuntimeMetricsStore` tracks runtime alive, queue size, commands executed, dropped commands, average execute time, and last runtime error. `RuntimeSession.health()` combines metrics with current status, transition-active state, and lock state for dashboards and operations-console runtime tabs.

## Future transition engine

The runtime currently models transition metadata and execution flow only. CUT and AUTO are the only commands that perform production mutations. Future phases can attach GPU/compositor transition implementations behind the existing placeholder handlers without changing command semantics.
