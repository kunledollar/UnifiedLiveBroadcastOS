# UBOS v5.15.3 — Persistent Production Surfaces

## Architecture

`ProductionRuntimeHost` is mounted by the permanent `/control-room` layout and is the exclusive UI owner of the Program and Preview DOM nodes, live/preview presentation state, and production clock. It does not create or own MediaStreams, switching, scene, recording, or streaming runtime objects.

`WorkspaceHost` renders only the active operational module. `WorkspaceDockManager` supplies its inspector and bottom workbench, persisting collapsed inspector metadata per workspace/operator browser profile. `WorkspaceRegistry` is the declarative plugin registry; routing and shell rendering resolve plugins by id rather than a workspace switch statement.

## Layout rules

Desktop Program and Preview are side-by-side for every operational workspace, with per-plugin weights applied without replacing either monitor node. The responsive breakpoint below 900px is the only point where the monitor host stacks. Monitor Wall remains a grid by design.

## Validation scope

The shell intentionally preserves React identity for monitors as pathname changes because the monitor host is a sibling of `WorkspaceHost` in the stable control-room layout. Browser checks should verify monitor element identity, workspace content replacement, dock/workbench updates, and absence of console errors.
