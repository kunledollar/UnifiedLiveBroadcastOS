# UBOS Next Old UI Deprecation

The active control-room layout now renders the UBOS Next presentation shell instead of the former `WorkspaceShell`, `ProductionRuntimeHost`, and dock presentation path. Those components are retained untouched because they own or coordinate existing runtime surfaces. Runtime and media components are not deleted and must remain until a dedicated boundary/wiring review confirms safe retirement.

## Current status

No operational control-room UI has been deprecated by this milestone. UBOS Next is available only under `/control-room-next` as an isolated presentation lab; the original `/control-room` shell remains the active runtime-backed experience.
