# UBOS v4.2 Ownership Matrix

## Certified ownership chain

```text
Operator
  ↓
Workspace Manager / Command Center Shell
  ↓
ProductionGraph
  ↓
RuntimeController
  ↓
RuntimeEventBus
  ↓
Media Plane
```

## Ownership matrix

| Responsibility | Certified owner | Evidence | Non-owners / prohibited bypasses | Status |
| --- | --- | --- | --- | --- |
| Layout geometry, zones, preset metadata | Workspace Manager | Shared workspace manager modules define panels, zones, presets, layout calculation, persistence, and validation. | ProductionGraph, runtime, and media-plane do not own layout. | PASS |
| Active control-room shell composition | Command Center Shell | `/control-room` active path renders `ControlRoomShell`, which composes the certified shell surfaces. | Legacy shell containers must not become alternate active render paths. | PASS |
| Program/Preview monitor placement | Workspace Manager + Command Center Shell | Workspace Manager geometry explicitly protects Program/Preview from dock overlap and controls responsive stacking. | Docks, panels, and media engines do not resize Program/Preview independently. | PASS |
| Switching commands | ProductionGraph | `TAKE_PREVIEW`, `CUT_TO_PROGRAM`, and `AUTO_TRANSITION` are graph commands and graph-adapter mutation plans. | Runtime/media-plane do not mutate production state directly. | PASS |
| Transitions | ProductionGraph metadata + media-plane rendering | Graph owns transition type/duration metadata; media-plane owns transition rendering/execution primitives. | UI does not own transition truth; runtime lifecycle does not render transitions. | PASS |
| Routing metadata | ProductionGraph / production graph adapters | Graph routing commands and route plans are metadata-level. | Runtime snapshots do not store media streams or handles. | PASS |
| Runtime lifecycle | RuntimeController | Controller owns lifecycle state, revision, scheduler, event bus, managers, subsystem registry, and lifecycle fan-out. | Individual subsystems do not own global startup/shutdown. | PASS |
| Runtime events | RuntimeEventBus | Event bus assigns monotonically increasing sequences and stores replayable events. | Subsystems do not directly call one another as the certified coordination path. | PASS |
| Health lifecycle | HealthManager + subsystem summaries | Runtime core includes HealthManager; UI/system panels consume graph/runtime/media summaries. | Media engines do not own global runtime health. | PASS |
| Browser/camera/screen/media sources | Media Plane and browser adapters | Media capture/runtime modules and web media hooks own capture/execution paths. | ProductionGraph stores metadata only; RuntimeController does not capture media. | PASS |
| FFmpeg, GPU, compositor, recording, streaming execution | Media Plane | Media-plane package contains FFmpeg, GPU, compositor, recording, streaming, audio, browser-renderer, and output runtime modules. | Workspace Manager and ProductionGraph do not execute media work. | PASS |
| Audio, graphics, replay, guests, automation subsystems | Independent production subsystems | Dedicated runtime/shared modules and UI workspaces exist around graph metadata. | ProductionGraph is canonical state owner but not a replacement for subsystem internals. | PASS |

## Conflict audit

- **No duplicate global layout owner found** in the certified active shell path.
- **No duplicate global production owner found**; graph command reducers/adapters remain the canonical mutation surface.
- **No duplicate global lifecycle owner found**; runtime lifecycle fan-out is centralized by RuntimeController.
- **No media-processing ownership in RuntimeController snapshots**; runtime core explicitly sanitizes metadata and reports `containsRuntimeHandles: false`.
- **No cyclic dependency identified** in the certified ownership chain. Media-plane modules can be imported by the web shell for adapter status and browser smoke operation, but this is not a reverse ownership edge into Workspace Manager or ProductionGraph.
