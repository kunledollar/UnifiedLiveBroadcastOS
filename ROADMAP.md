# Roadmap

## v3.16 Readiness

UBOS v3.15 Phase 2 is ready to hand off to v3.16 from an engineering-cleanup perspective. The active Control Room layout path is `CommandCenterShell` backed by Workspace Manager, with legacy split-monitor layout helpers removed when proven unused.

### Completed in v3.15 Phase 2

- Legacy layout ambiguity reduced by deleting inactive legacy Program/Preview split deck code and the old zone resize handle.
- Workspace Manager ownership reaffirmed for dock sizing, panel visibility, presets, collapse state, responsive layout, and persistence.
- Responsive validation expanded across the requested desktop-to-compact width set.
- Production runtime/media pipeline internals remained untouched.

### Remaining technical debt for v3.16

- Continue incremental migration of reusable visual constants currently stored under `broadcast-command-center` into active command-center/design-token modules.
- Keep the older `workspace-canvas` code path under manual review unless a future migration proves it can be deleted safely.
- Consider adding browser-level visual regression coverage for the responsive width matrix when CI has a stable browser environment.
