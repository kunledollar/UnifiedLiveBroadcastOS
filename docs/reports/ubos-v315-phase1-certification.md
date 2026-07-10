# UBOS v3.15 Phase 1 Final Certification Audit

**Date:** 2026-07-10  
**Audited commit:** `63dba14` (`Implement UBOS 3.15 phase 1 stabilization`)  
**Objective:** Determine whether the UBOS v3.15 Phase 1 stabilization PR is safe to merge.  
**Decision:** 🟢 **CERTIFIED FOR MERGE**

---

## 1. Executive Summary

The Phase 1 stabilization PR is safe to merge.

Certification findings:

- The active Control Room render path remains `page.tsx → ControlRoomShell → SceneWorkspace → CommandCenterShell`.
- No alternate active shell, legacy workspace shell, or legacy grid owner renders on `/control-room`.
- Workspace Manager remains the sole active layout owner for dock dimensions, panel visibility, zone assignments, presets, collapse state, responsive geometry, and persisted custom zone sizes.
- Drag resize is implemented only in the active command-center path and delegates all changes to `setZoneSize()`.
- Program and Preview remain owned by Center Stage, are never registered as closable/collapsible panels, and are not duplicated in active dock zones.
- ProductionGraph internals and runtime media systems were not modified by the Phase 1 implementation.
- Required validation commands passed.
- The only warning observed is a pre-existing Next.js ESLint plugin configuration warning during `next build`; it does not fail the build and is unrelated to this PR.

**Final decision:** 🟢 **CERTIFIED FOR MERGE**

---

## 2. Active Render Path

### Verified active render path

```text
apps/web/app/control-room/page.tsx
  └─ <ControlRoomShell />
      └─ <SceneWorkspace />
          └─ <CommandCenterShell />
              ├─ CommandCenterLeftRail
              ├─ CommandCenterLeftDock
              ├─ DockResizeHandle (left)
              ├─ CommandCenterStage
              ├─ DockResizeHandle (right)
              ├─ CommandCenterRightDock
              ├─ DockResizeHandle (bottom)
              └─ CommandCenterBottomWorkspace
```

### Evidence

- `page.tsx` imports and renders `ControlRoomShell` only for the `/control-room` page.
- `ControlRoomShell` imports and renders `SceneWorkspace` inside the full-screen workstation shell.
- `SceneWorkspace` renders `CommandCenterShell` as the active orchestration shell.
- `CommandCenterShell` imports active command-center components and the active-path `DockResizeHandle` from `./DockResizeHandle`.

### Alternate shell verification

| Candidate | Active on `/control-room`? | Result |
|---|---:|---|
| `BroadcastCommandCenterLayout` | No | File absent from source tree; only historical docs mention it. |
| `FloatingProductionGraphPanel` | No | File absent from source tree; only historical docs mention it. |
| `WorkspaceCanvas` legacy grid | No | File remains for legacy/non-active references but is not in the `page → shell → scene → CommandCenterShell` render path. |
| `WorkspaceLayout` / `MonitorGrid` workspace presets | No | Exported for non-active workspace modules; not the active `/control-room` owner. |
| `CenterProgramPreviewDeck` legacy split monitor deck | No active CommandCenter owner | File remains referenced by type/legacy paths; active Command Center uses `CommandCenterStage`. |

**Conclusion:** The active render path is singular and correct. No duplicate active layout owner renders for `/control-room`.

---

## 3. Workspace Manager Ownership Verification

### Ownership table

| Layout concern | Owner | Verification | Status |
|---|---|---|---|
| Left dock width | Workspace Manager geometry + `setZoneSize()` | Active shell reads `leftDockGeometry.rect.width`; handle calls `setZoneSize('left-dock', ...)`. | PASS |
| Right dock width | Workspace Manager geometry + `setZoneSize()` | Active shell reads `rightDockGeometry.rect.width`; handle calls `setZoneSize('right-dock', ...)`. | PASS |
| Bottom workspace height | Workspace Manager geometry + `setZoneSize()` | Active shell reads `bottomGeometry.rect.height`; handle calls `setZoneSize('bottom-workspace', ...)`. | PASS |
| Panel visibility | `WorkspacePanelRegistry` through `useCommandCenterWorkspace()` | Visibility toggles and activation use registry state. | PASS |
| Zone assignment | `WorkspacePanelRegistry` | `movePanelToZone()` delegates to registry and expands destination zones. | PASS |
| Workspace presets | Shared Workspace Manager preset catalog | Preset application uses `getWorkspacePreset()` + `applyPresetToRegistry()`. | PASS |
| Collapse state | Workspace Manager layout metadata | `collapsedZoneOverrides` + responsive collapse feed `calculateWorkspaceLayout()`. | PASS |
| Responsive layout | `calculateWorkspaceLayout()` + shell stacking policy | Docks collapse through shared breakpoints; shell stacks when center width is below 900px. | PASS |
| Persisted custom sizes | `CommandCenterPrefs.version = 2` | `zoneSizes` is serialized metadata, parsed, clamped, and supplied as `zoneSizeOverrides`. | PASS |

### Hardcoded / legacy geometry audit

| Finding | File | Severity | Certification classification |
|---|---|---|---|
| Active shell applies `style={{ width: leftDockWidth }}` / `rightDockWidth` / `height: bottomHeight` | `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | None | Acceptable: these values are derived from Workspace Manager geometry, not independent hardcoded sizing. |
| `DEFAULT_VIEWPORT = { width: 1920, height: 1080 }` | `apps/web/app/control-room/command-center/useCommandCenterWorkspace.ts` | None | Safe hydration fallback until ResizeObserver reports real container size. |
| Legacy `WorkspaceCanvas` has `leftWidth`, `rightWidth`, `bottomHeight`, `gridTemplateColumns`, `gridTemplateRows` | `apps/web/app/control-room/workspace-canvas/WorkspaceCanvas.tsx` | Low / pre-existing inactive path | Not active on `/control-room`; retained legacy canvas should remain manual-review only. |
| Legacy `SplitMonitorBay` and `CenterProgramPreviewDeck` have monitor split grid/flex sizing | `apps/web/app/control-room/workspace-canvas/SplitMonitorBay.tsx`, `apps/web/app/control-room/broadcast-command-center/CenterProgramPreviewDeck.tsx` | Low / pre-existing inactive or legacy component path | Not active Command Center layout ownership. |
| CSS grid classes inside editors/panels | multiple feature components | None | Internal editor layout, not workspace geometry ownership. |

**Conclusion:** No active hardcoded dock geometry or duplicate active layout owner remains. Workspace Manager is the sole active layout owner.

---

## 4. One Owner Rule Audit

| Feature | Owner | Duplicate? | Status |
|---|---|---:|---|
| Scenes | Left dock source tab / registered `scenes` panel | No full editor duplicate found in active shell | PASS |
| Sources | Left dock source tab / registered `sources` panel | No full editor duplicate found in active shell | PASS |
| Media | Left dock media tab / `media-browser` extra panel | No full editor duplicate found in active shell | PASS |
| Graphics | Left dock graphics tab + bottom graphics workspace home | No duplicate full editor in active command surfaces; shortcuts/status chips acceptable | PASS |
| Replay | Bottom workspace `replay` tab | No active duplicate full editor found | PASS |
| Automation | Bottom workspace `automation` tab / external route is standalone route, not active shell duplicate | No duplicate inside active shell | PASS |
| Production Graph | Bottom workspace `production-graph` tab | No floating production graph active; deleted/absent legacy floater | PASS |
| Logs | Bottom workspace `logs` / right dock chat/log operations section | No duplicate full editor; status/log surfaces are constrained panels | PASS |
| System Status | Bottom workspace `system-status` | No duplicate full editor in active shell | PASS |
| Recording | Right dock operations panel | No duplicate full editor in active shell | PASS |
| Streaming | Right dock operations panel | No duplicate full editor in active shell | PASS |
| Guests | Right dock operations panel / source tab has no gated duplicate panel | No duplicate full editor in active shell | PASS |
| Outputs | Right dock operations panel | No duplicate full editor in active shell | PASS |
| Inspector | Right dock operations panel | No duplicate full editor in active shell | PASS |
| Diagnostics | Source diagnostics tab / diagnostic summaries | No duplicate full editor in active shell | PASS |
| Broadcast I/O | Bottom workspace `routing` tab | External `/control-room/broadcast-io` route exists as a canonical route, not an inline duplicate in active shell | PASS |

**Conclusion:** One Owner Rule is enforced in the active Command Center. Shortcuts, status chips, telemetry overlays, and status summaries do not constitute duplicate full editors.

---

## 5. Drag Resize Verification

### Left Dock

| Requirement | Result |
|---|---|
| Pointer resize | PASS — active `DockResizeHandle` uses Pointer Events and pointer capture. |
| Keyboard resize | PASS — ArrowLeft/ArrowRight adjust size; Shift uses larger increments. |
| Respects min/max | PASS — `setZoneSize()` clamps through `clampZoneSize()`. |
| Updates Workspace Manager | PASS — handle delegates to `setZoneSize('left-dock', nextSize)`. |
| No overlap | PASS — `calculateWorkspaceLayout()` validates no zone/monitor overlap; active render keeps center as flex remainder. |

### Right Dock

| Requirement | Result |
|---|---|
| Pointer resize | PASS |
| Keyboard resize | PASS |
| Respects min/max | PASS |
| Updates Workspace Manager | PASS |
| No overlap | PASS |

### Bottom Workspace

| Requirement | Result |
|---|---|
| Pointer resize | PASS |
| Keyboard resize | PASS — ArrowUp/ArrowDown adjust height; Shift uses larger increments. |
| Respects min/max | PASS |
| Updates Workspace Manager | PASS |
| No overlap / no hidden transition controls | PASS — bottom workspace remains normal-flow below Center Stage; transition controls remain inside `CommandCenterStage` above bottom workspace. |

### Program / Preview behavior

- Program and Preview expand into space released by dock collapse/resize because Center Stage is flex-owned and receives remaining width/height.
- No resize handle overlays the monitors; handles are separate flex children between zones.
- Transition controls remain below monitor bay in normal flow, not absolutely overlaid.

**Conclusion:** Drag resize passes certification.

---

## 6. Persistence Verification

| Scenario | Verification | Status |
|---|---|---|
| Resize dock → refresh browser → layout restored | `zoneSizes` persists in CommandCenterPrefs v2 and is rehydrated into `zoneSizeOverrides`. | PASS |
| Reset Layout → defaults restored | `resetLayout()` removes stored prefs/snapshot and clears `zoneSizes`. | PASS |
| Old v1 preferences migrate | Parser accepts version 1 and returns version 2 defaults plus valid fields. | PASS |
| Malformed preferences fail safely | Invalid JSON returns `null`; unknown versions reject; malformed fields fall back to defaults. | PASS |
| Invalid zone sizes clamp/ignore | Known resizable zones clamp to Workspace Manager min/max; unknown and non-resizable zones are ignored. | PASS |
| Runtime handles persisted? | No — only serializable metadata fields are persisted. | PASS |

**Conclusion:** Persistence is safe and backward compatible.

---

## 7. Responsive Verification

Source-level responsive geometry was validated with `calculateWorkspaceLayout()` plus `validateLayoutResult()` across the requested widths. A shell-specific stacking check was also applied (`layout.monitorsStacked || center-stage width < 900`).

| Width | Effective geometry result | Certification |
|---:|---|---|
| 3840 | Left/right/bottom visible; center 3228×1824; no overlap issues. | PASS |
| 2560 | Left/right/bottom visible; center 1948×1104; no overlap issues. | PASS |
| 1920 | Left/right/bottom visible; center 1308×744; no overlap issues. | PASS |
| 1600 | Left/right/bottom visible; center 988×564; no overlap issues. | PASS |
| 1440 | Right dock force-collapses to preserve center width; no overlap issues. | PASS |
| 1366 | Right dock collapsed; left dock compact; no overlap issues. | PASS |
| 1280 | Right dock collapsed; left dock compact; no overlap issues. | PASS |
| 1200 | Right dock collapsed; left dock compact; center remains visible; no overlap issues. | PASS |
| 1024 | Left/right collapsed; bottom visible; center remains visible; shell does not need stacking because center width is 952px. | PASS |
| 900 | Left/right collapsed; bottom force-collapsed; shell stacks because center width is 828px; no overlap issues. | PASS |
| Below 900 | Left/right collapsed; bottom force-collapsed; stacked monitor mode active; no overlap issues. | PASS |

**Responsive conclusion:** Program and Preview remain rendered; no dock overlap was detected. Center Stage remains dominant because docks auto-collapse and bottom workspace force-collapses when height is constrained.

---

## 8. Program Safety Verification

| Requirement | Verification | Status |
|---|---|---|
| Program remains largest/dominant | `CommandCenterStage.programShare()` gives Program a dominant share for all emphasis modes. | PASS |
| Program unobstructed | Monitor bay and switcher use normal flow; overlays are pointer-events safe and internal to monitor cell. | PASS |
| Program 16:9 where possible | Monitor cells preserve min 800×450 and runtime renderer remains unchanged. | PASS |
| Program never collapsible | Program is not a Workspace Manager panel and is not in collapsible dock zones. | PASS |
| Program never duplicated | Active shell receives one `programMonitor` node and renders it once in `CommandCenterStage`. | PASS |
| Preview always visible | Active shell receives one `previewMonitor` node and renders it once in `CommandCenterStage`. | PASS |
| Preview never duplicated | No second active preview editor/render owner found in Command Center. | PASS |
| Transition controls never hidden | `switcherContent` is rendered below monitors in normal flow inside Center Stage. | PASS |

**Conclusion:** Program/Preview safety is certified.

---

## 9. Keyboard Verification

| Shortcut | Behavior | Browser conflict status | Certification |
|---|---|---|---|
| Ctrl+K / Cmd+K | Opens Command Palette | Prevented default; editable guard applies for Ctrl/Cmd shortcuts. | PASS |
| Ctrl+S / Cmd+S | Calls `onSaveLayout()` | Prevents browser Save Page when not focused in editable input. | PASS |
| F1 | CUT | Prevents browser help behavior and fires even in editable fields by operator policy. | PASS |
| F2 | TAKE | Prevents default and fires existing callback. | PASS |
| F3 | AUTO | Prevents default and fires existing callback. | PASS |
| Esc | Closes overlays/fullscreen | Does not conflict with browser-critical shortcuts. | PASS |
| Ctrl+1–5 / Cmd+1–5 | Workspace switching | Prevents browser tab switching only in Command Center context and ignores editable fields. | PASS |
| Ctrl+Shift+L | Reset Layout | Prevented default; blocked when layout is locked. | PASS |

**Conclusion:** Keyboard certification passes.

---

## 10. Build Results

| Command | Result | Issue classification |
|---|---|---|
| `pnpm lint` | PASS | None |
| `pnpm typecheck` | PASS | None |
| `pnpm test` | PASS | None |
| `pnpm --filter @ubos/web build` | PASS | One warning: Next.js ESLint plugin was not detected. Classified **PRE-EXISTING**, non-blocking, unrelated to this PR. |

Additional audit commands:

| Command | Result |
|---|---|
| `rg -n "BroadcastCommandCenterLayout|FloatingProductionGraphPanel|broadcast-command-center/DockResizeHandle|WorkspaceSelector" apps packages --glob '!**/*.md' --glob '!**/dist/**' -S` | PASS — no source references. |
| `rg -n "import\(|lazy\(|React\.lazy|dynamic\(" ...` targeted legacy dynamic/lazy scan | PASS — no deleted artifact dynamic/lazy imports. |
| `rg -n "BroadcastCommandCenterLayout|FloatingProductionGraphPanel|DockResizeHandle|WorkspaceSelector" apps packages --glob '*.{test,spec,stories,story}.{ts,tsx,js,jsx}' -S` | PASS — no test/story references. |
| Responsive geometry script over requested widths | PASS — zero layout validation issues at all audited widths. |

---

## 11. Regression Results

The certification audit treated runtime systems as protected. No protected runtime implementation files were modified by this certification pass. The prior implementation changed only layout orchestration/prefs/reporting plus overlay label wiring in `scene-workspace.tsx`.

| Area | Verification | Status |
|---|---|---|
| Camera | Runtime media validation passed; no camera runtime code changed. | PASS |
| Screen | Runtime media validation passed; no screen-capture runtime code changed. | PASS |
| Media | Runtime media validation passed; no media runtime code changed. | PASS |
| Browser | Web build passed; no browser source runtime code changed. | PASS |
| CUT | Existing `switchProgram('cut')` callback remains wired to shell. | PASS |
| TAKE | Existing `switchProgram(productionState.transitionType)` callback remains wired to shell. | PASS |
| AUTO | Existing `switchProgram('fade')` callback remains wired to shell. | PASS |
| Graphics | No graphics runtime code changed; active owners are unchanged. | PASS |
| Replay | Shared replay validation passed; no replay runtime code changed. | PASS |
| Audio Mixer | Runtime audio validation passed; no audio mixer runtime code changed. | PASS |
| Recording | Runtime recording validation passed; no recording runtime code changed. | PASS |
| Streaming | Runtime switching/media validations passed; no streaming runtime code changed. | PASS |
| Workspace Presets | Workspace Manager validation passed; active shell still uses preset APIs. | PASS |
| Command Palette | Build/typecheck passed; no duplicate editor behavior introduced. | PASS |
| Dock Collapse | Shared responsive/collapse geometry validation passed; shell uses Workspace Manager collapse state. | PASS |
| Monitor Overlay | Build/typecheck passed; latency label wiring is metadata-only. | PASS |
| Pipeline Inspector | No pipeline inspector runtime code changed; bottom tab ownership retained. | PASS |
| Broadcast I/O | Broadcast I/O validation passed; route/build succeeded. | PASS |
| Production Graph | Production graph validation passed; ProductionGraph internals unchanged. | PASS |

**Conclusion:** No regression was introduced by the Phase 1 stabilization PR.

---

## 12. Legacy Cleanup Verification

### Deleted safely

| Artifact | Verification | Status |
|---|---|---|
| `apps/web/app/control-room/broadcast-command-center/DockResizeHandle.tsx` | No source imports, no lazy/dynamic imports, no tests/stories, no runtime references. Active replacement is `command-center/DockResizeHandle.tsx`. | SAFE |
| `apps/web/app/control-room/workspaces/WorkspaceSelector.tsx` | No source imports after stale barrel export removal; docs mention only historical Phase 8 behavior. | SAFE |
| `BroadcastCommandCenterLayout.tsx` | Already absent; no active source references. | SAFE |
| `FloatingProductionGraphPanel.tsx` | Already absent; no active source references. | SAFE |

### Retained intentionally

| Artifact | Reason | Status |
|---|---|---|
| `apps/web/app/control-room/broadcast-command-center/ZoneResizeHandle.tsx` | Still imported by `CenterProgramPreviewDeck.tsx`; not reused by active dock resize implementation. | RETAIN |
| `apps/web/app/control-room/workspace-canvas/*` | Legacy/non-active workspace-canvas components are still referenced by other modules/types. | RETAIN |
| `apps/web/app/control-room/workspaces/*` | Workspace-center modules remain exported for non-active workspace surfaces. | RETAIN |

### Needs manual review

| Artifact | Reason | Severity |
|---|---|---|
| `workspace-canvas/WorkspaceCanvas.tsx` legacy geometry | Contains legacy grid sizing but is not the active `/control-room` render owner. | Low / pre-existing |
| `broadcast-command-center/CenterProgramPreviewDeck.tsx` legacy monitor split | Contains legacy monitor split logic; not active Command Center owner. | Low / pre-existing |

---

## 13. Remaining Known Issues

| Issue | Classification | Blocking? |
|---|---|---:|
| Next.js build warning: ESLint plugin not detected | PRE-EXISTING environment/config warning | No |
| Legacy `workspace-canvas` geometry remains in inactive path | PRE-EXISTING retained code | No |
| Legacy `ZoneResizeHandle` remains due `CenterProgramPreviewDeck` import | PRE-EXISTING retained code | No |
| Browser/manual QA not executed in a live browser in this certification pass | Process limitation; source/build/runtime validations passed | No |
| Panel undocking, floating windows, external monitor expansion, arbitrary move-panel UI | Explicitly deferred beyond Phase 1 | No |

No blocking issues were found.

---

## 14. Risk Assessment

| Risk | Level | Mitigation |
|---|---|---|
| Runtime media regression | Low | Runtime media/audio/recording validations passed; runtime files untouched. |
| ProductionGraph regression | Low | Production graph validation passed; ProductionGraph internals untouched. |
| Layout overlap after resize | Low | All resize changes route through Workspace Manager clamp/layout; validation reports zero overlap issues across audited widths. |
| Preference corruption | Low | Parser rejects malformed input, migrates v1, clamps known resizable zones, ignores unknown/non-resizable zones. |
| Keyboard conflict | Low | Browser-critical Ctrl shortcuts are guarded; F1/F2/F3 intentionally override default for operator transitions. |
| Legacy ambiguity | Low | Deleted artifacts verified unused; retained legacy components documented as inactive/manual-review. |

---

## 15. Merge Recommendation

🟢 **CERTIFIED FOR MERGE**

Certification statements:

- Workspace Manager is the sole layout owner.
- One Owner Rule is enforced.
- No critical regressions were introduced.
- ProductionGraph remains unchanged.
- Runtime media systems remain unchanged.
- UBOS v3.15 Phase 1 is certified complete.
