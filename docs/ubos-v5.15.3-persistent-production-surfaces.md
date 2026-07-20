# UBOS v5.15.3 — Persistent Production Surfaces

## Architecture

`WorkspaceShell` is the permanently mounted control-room shell. It owns a single `ProductionRuntimeHost`, which owns the Program and Preview monitor React nodes, live/recording/stream status presentation, and production clock. Workspace navigation changes the active `WorkspaceHost` only; it never mounts monitors from a workspace component. This preserves monitor DOM and React identity during client-side workspace navigation and intentionally does not alter MediaStream, switching, scene, recording, or streaming runtime ownership.

`WorkspaceRegistry` is declarative. Each entry fulfils `WorkspacePlugin`: identity, route, layout metadata, center component, inspector, workbench, permissions, and shortcuts. New operational workspaces are registered rather than added to routing switch statements.

`WorkspaceDockManager` supplies center, right inspector, and bottom workbench dock regions. It reserves left docking for the shell navigation and defines the architecture for future floating panels without implementing windows. Metadata-only layout preferences (inspector collapsed state, inspector width, bottom height, selected tab, and monitor weights) persist per operator/workspace in local storage.

## Responsive behavior

At desktop widths Program and Preview are always side-by-side and receive workspace-specific proportional weights. At 900px and below the monitor host may stack them, providing the only vertical-monitor breakpoint. The active workspace dock changes its inspector from a right dock to a row beneath center content at that same breakpoint.

## Validation boundaries

This milestone is UI-shell architecture only. It uses no MediaStream attachment, runtime dispatch, or output ownership APIs. Browser validation should verify client-side navigation between Director, Audio, Graphics, Replay, Streaming, Sources, Scenes, Social Fabric, Monitor Wall, and Compact while the two monitor elements retain their DOM identity.
