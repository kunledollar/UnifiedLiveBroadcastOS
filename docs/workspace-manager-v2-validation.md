# Workspace Manager v2 validation

The shared validation suite checks that all nine workspace contracts are present, immutable built-ins, have role/status definitions, compatibility presets derive from the catalog, custom registry data parses safely, normalized dirty-state transitions are deterministic, and status resolution never fabricates values. Existing validation also verifies preset panel references, Program/Preview invariants, responsive geometry, and layout persistence behavior.

Manual smoke checklist:

1. Select every workspace from the operational header and confirm the active role and factory layout change together.
2. Save a changed layout, switch away and back, then Reset; verify only layout metadata changes.
3. Lock the layout and verify dock controls and resizers are disabled while scene switching and keyboard shortcuts still work.
4. Use Duplicate and Manage; verify a custom draft appears without mutating a built-in definition.
5. Check compact and narrow viewports for visible Program/Preview and no dock overlap.
