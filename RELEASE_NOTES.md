# Release Notes

## UBOS v4.12.0 — Platform Architecture Baseline

- Added the UBOS v4.12 platform freeze, baseline manifest, release notes, and final certification report.
- Preserved the existing package versioning convention (`1.0.0-rc.1`) and documented the platform release identity as UBOS v4.12.0.
- Classified remaining repository and build limitations as operator-environment checks before final branch/tag creation.


## UBOS v3.15 Phase 2

This engineering completion pass focuses on cleanup and hardening only. It does not redesign the UI, add broadcast features, or alter runtime media pipelines.

### Highlights

- Removed inactive legacy layout files after source-reference verification.
- Preserved Command Center behavior while eliminating a type dependency on legacy monitor deck code.
- Strengthened responsive validation for the requested width matrix.
- Documented readiness for v3.16 and known technical debt.

### Operator Impact

No workflow or runtime media behavior changes are intended. Program remains the dominant monitor, Workspace Manager remains the sole active layout owner, and CommandCenterShell remains the active Control Room shell.
