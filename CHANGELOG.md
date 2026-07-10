# Changelog

## UBOS v4.12.0 — Platform Architecture Baseline

- Added the UBOS v4.12 platform freeze, baseline manifest, release notes, and final certification report.
- Preserved the existing package versioning convention (`1.0.0-rc.1`) and documented the platform release identity as UBOS v4.12.0.
- Classified remaining repository and build limitations as operator-environment checks before final branch/tag creation.


## UBOS v3.15 Phase 2 — Engineering Completion and Legacy Cleanup

- Completed legacy layout cleanup by removing the inactive split Program/Preview deck and its legacy zone resize helper after verifying no active imports, lazy imports, dynamic imports, runtime references, or tests depend on them.
- Moved the shared monitor status type into the active Command Center module so active shell and host code no longer depend on legacy layout files for type-only metadata.
- Kept `CommandCenterShell` as the active Control Room shell and Workspace Manager as the only owner for panel visibility, dock sizing, presets, collapse state, responsive geometry, and persisted layout metadata.
- Extended Command Center layout validation coverage to the Phase 2 responsive width set: 3840, 2560, 1920, 1600, 1440, 1366, 1280, 1200, 1024, and 900.
- Updated Phase 2 completion reporting for removed files, verification results, and remaining technical debt.
