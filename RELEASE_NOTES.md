# Release Notes

## UBOS v3.15 Phase 2

This engineering completion pass focuses on cleanup and hardening only. It does not redesign the UI, add broadcast features, or alter runtime media pipelines.

### Highlights

- Removed inactive legacy layout files after source-reference verification.
- Preserved Command Center behavior while eliminating a type dependency on legacy monitor deck code.
- Strengthened responsive validation for the requested width matrix.
- Documented readiness for v3.16 and known technical debt.

### Operator Impact

No workflow or runtime media behavior changes are intended. Program remains the dominant monitor, Workspace Manager remains the sole active layout owner, and CommandCenterShell remains the active Control Room shell.
