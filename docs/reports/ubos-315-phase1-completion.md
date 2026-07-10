# UBOS v3.15 Phase 1 — Audit Task Completion and Stabilization

**Date:** 2026-07-10  
**Scope source of truth:** `docs/reports/ubos-315-audit-verification.md`  
**Phase:** Audit Task Completion and Stabilization before UBOS v4.0

## 1. Tasks completed

- Completed low-risk keyboard consistency patches for Ctrl+S and F1/F2/F3.
- Kept `CommandCenterShell` as the active `/control-room` shell and left ProductionGraph/runtime media systems untouched.
- Aligned left-dock source-tab activation through `activatePanel()` where a Workspace Manager panel gates the tab.
- Wired monitor latency labels for Program and Preview overlays from existing output telemetry metadata.
- Documented the sub-900px `forceBottomCollapsed` operator-override policy inline without changing the freeze behavior.
- Added active-path dock resize support for left dock width, right dock width, and bottom workspace height.
- Extended command-center preferences to version 2 with persisted, validated `zoneSizes`.
- Confirmed design-system utility usage (`rounded-ubos-sm`, `rounded-ubos-md`, `rounded-ubos-lg`, `ubos-scroll`, `text-ubos-caption`) exists in active Command Center/UI code and did not redesign UI tokens.

## 2. Files changed

- `apps/web/app/control-room/command-center/DockResizeHandle.tsx` — new active Command Center resize handle using pointer capture and keyboard resizing.
- `apps/web/app/control-room/command-center/CommandCenterShell.tsx` — imports the active-path resize handle and renders handles around left/right/bottom zones; retains the documented small-viewport bottom-collapse policy.
- `apps/web/app/control-room/command-center/useCommandCenterWorkspace.ts` — exposes and persists Workspace Manager `setZoneSize()` metadata, resets custom sizes with layout reset, and uses size overrides for layout calculation.
- `apps/web/app/control-room/command-center/command-center-logic.ts` — migrates prefs to version 2 and validates/clamps persisted zone sizes.
- `apps/web/app/control-room/command-center/command-center-logic.test.ts` — covers prefs v2 serialization and v1 migration/clamping.
- `apps/web/app/control-room/command-center/useWorkspaceKeyboard.ts` — already contained the required Ctrl+S and F1/F2/F3 bindings; verified as active and wired from the shell.
- `apps/web/app/control-room/scene-workspace.tsx` — adds latency labels to both Program and Preview overlay props using existing telemetry metadata.
- `apps/web/app/control-room/workspaces/index.ts` — removes stale `WorkspaceSelector` barrel export.

## 3. Legacy files removed

- Removed `apps/web/app/control-room/broadcast-command-center/DockResizeHandle.tsx`; it was a non-active wrapper over the legacy resize handle and conflicted with the audit requirement to create the active-path resize component under `command-center/`.
- Removed `apps/web/app/control-room/workspaces/WorkspaceSelector.tsx`; no app/package imports remained, and the barrel export was stale.

## 4. Legacy files retained and why

- `apps/web/app/control-room/broadcast-command-center/ZoneResizeHandle.tsx` is retained for manual review because `CenterProgramPreviewDeck.tsx` still imports it for legacy Program/Preview split resizing. It was not reused by the new active dock resize implementation.
- `workspace-canvas` files are retained because current Control Room and broadcast workspace files still import their types/components.
- `BroadcastCommandCenterLayout.tsx` and `FloatingProductionGraphPanel.tsx` were already absent from the source tree during this phase; no direct, dynamic, lazy, test, story, or active `/control-room` render-path references were found outside historical docs.

## 5. Keyboard patches

- Ctrl+S is registered in `useWorkspaceKeyboard()` and calls `onSaveLayout()` while preventing browser Save Page.
- Ctrl/Cmd shortcuts are ignored when an editable element has focus.
- F1/F2/F3 are registered as CUT/TAKE/AUTO, prevent default browser/help behavior, and are wired through `CommandCenterShell` to existing switcher callbacks.

## 6. Workspace Manager patches

- Left-dock tab activation uses `activatePanel()` when a source tab has a gating Workspace Manager panel.
- `setZoneSize(zoneId, size)` remains the canonical API for custom dock dimensions and delegates clamping to Workspace Manager zone rules.
- Reset layout clears custom zone sizes and restores preset defaults.

## 7. Responsive patches

- The sub-900px `forceBottomCollapsed` policy is documented inline as an intentional operator-override disablement to protect Center Stage vertical space.
- Existing layout calculation continues to force-collapse the bottom workspace when viewport height cannot preserve a usable monitor row.
- No UI redesign or panel relocation was introduced.

## 8. Drag-resize implementation

- New active-path `DockResizeHandle` supports Pointer Events with pointer capture.
- Left dock, right dock, and bottom workspace resize immediately through `setZoneSize()`.
- Sizes are clamped by Workspace Manager zone min/max metadata.
- Handles are disabled while layout lock is active.
- Keyboard accessibility is supported with arrow keys and Shift+arrow larger increments.
- The component stores only transient pointer coordinates and no media/runtime handles.

## 9. Preference migration

- `CommandCenterPrefs` is now version 2.
- Version 1 preferences are accepted and migrated to version 2 defaults.
- `zoneSizes` is persisted as serializable layout metadata only.
- Malformed data is ignored; known zone values are clamped before use.

## 10. Test/build results

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test` — passed.
- `pnpm --filter @ubos/web build` — passed; `/control-room` compiled successfully.
- Additional targeted check: `pnpm exec tsc --noEmit --pretty false -p apps/web/tsconfig.json` — passed.

## 11. Remaining deferred items

- Panel undocking/floating windows remain deferred.
- External monitor support remains deferred.
- Arbitrary move-panel UI remains deferred; existing menu/Workspace Manager move metadata was not expanded.
- Legacy `ZoneResizeHandle.tsx` remains for manual review because it still has a non-active-path consumer.
- Manual browser verification of CUT/TAKE/AUTO, dock persistence after refresh, absence of React warnings, and console state should be repeated in a full QA browser pass.

## 12. Recommendation

**Ready for Phase 2**, pending normal manual QA verification in a browser/device matrix. The source-level audit items for Phase 1 are complete, validation commands pass, and production runtime/media internals were not modified.
