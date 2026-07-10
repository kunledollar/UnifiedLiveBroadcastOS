# Architecture

## Control Room Layout Ownership

The active Control Room render path remains `page.tsx → ControlRoomShell → SceneWorkspace → CommandCenterShell`. `CommandCenterShell` delegates layout decisions to the Workspace Manager foundation and only renders existing panel/monitor nodes into Workspace Manager zones.

Workspace Manager owns:

- panel visibility and primary panel homes;
- dock and bottom workspace sizing;
- workspace presets;
- zone collapse and expansion state;
- responsive geometry;
- persisted serializable layout metadata.

ProductionGraph, Program/Preview monitor rendering, camera/screen/browser/media/audio/graphics/replay/recording/streaming/automation runtimes, Broadcast I/O, monitor wall, and pipeline inspector remain production-frozen runtime systems and are not layout owners.

## v3.15 Phase 2 Cleanup

The legacy `CenterProgramPreviewDeck` and `ZoneResizeHandle` files were removed because the active Command Center stage and active dock resize handle own those responsibilities. A shared `MonitorStatusInfo` type now lives in the active command-center module so host/shell code no longer imports type metadata from a legacy layout component.
