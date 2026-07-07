# UBOS 3.15D / 3.15E — Consolidated Engineering Task Plan

**Authority document:** `docs/reports/ubos-315-audit-verification.md`  
**Generated:** 2026-07-07  
**Scope:** All remaining work items L-1 through OV-3 converted to actionable engineering tasks with exact file paths, expected changes, acceptance criteria, risk levels, and PR classification.

---

## Section 1 — Acceptance of Audit

### 1.1 Acceptance statement

- The audit in `docs/reports/ubos-315-audit-verification.md` is accepted as **complete and authoritative** for structural and architectural findings.
- All DONE / PARTIAL / NOT DONE status assignments for Phases 3.15A, 3.15B, 3.15C, and 3.15D-3 are accepted without modification.
- The remaining work list (L-1 through OV-3) is accepted as the correct scope for completing 3.15D and scoping 3.15E.

### 1.2 Audit corrections (source-verified)

The following items in the original audit were marked as gaps but are **confirmed DONE** upon direct inspection of the code:

| Item | Original audit claim | Corrected status | Evidence |
|------|---------------------|-----------------|---------|
| D-1 | `rounded-ubos-*` not in Tailwind preset | **DONE** | `tailwind-preset.ts` lines 115–119 declare `borderRadius: { 'ubos-sm': ubosRadii.sm, 'ubos-md': ubosRadii.md, 'ubos-lg': ubosRadii.lg }` |
| D-2 | `ubos-scroll` definition unconfirmed | **DONE** | `packages/ui/design-system/theme/css-variables.css` lines 274–296 contain the full `.ubos-scroll` + webkit scrollbar ruleset |
| D-3 | `text-ubos-caption` unconfirmed | **DONE** | `tailwind-preset.ts` line 101: `'ubos-caption': [...ubosFontSize.caption]` in `fontSize` extension |
| OV-1 | `recordingLabel`, `streamingLabel`, `droppedLabel` not wired | **DONE** | `scene-workspace.tsx` lines 4761–4774 pass all three fields through `programOverlay` prop |
| OV-2 | `armedGraphicsCount`, `transitionLabel` not wired | **DONE** | `scene-workspace.tsx` lines 4776–4782 pass both fields through `previewOverlay` prop |

**Net effect of corrections:** The Design System category (D-1, D-2, D-3) is removed from the remaining work list entirely. OV-1 and OV-2 are removed; only OV-3 remains. The total remaining item count drops from 19 to **11 actionable tasks**.

### 1.3 Confirmed remaining items

After corrections, the following 11 tasks remain:

`L-1` `L-2` `W-1` `W-2` `W-3` `O-1` `O-2` `R-1` `R-2` `R-3` `LG-1` `LG-2` `LG-3` `LG-4` `OV-3`

> Note: LG-1 through LG-4 are four discrete deletion/cleanup steps counted as one category. Total unique engineering tasks: 15 (11 categories + 4 sub-tasks in LG).

---

## Section 2 — Consolidated Task List

---

### TASK L-1 — Implement drag-resize handles for dock zones

**Category:** Layout  
**Phase target:** 3.15D (completion)  
**Risk:** High  
**PR type:** Dedicated PR (isolated; browser + keyboard QA required)

#### Description

The workspace zone definitions in `zones.ts` mark `left-dock`, `right-dock`, and `bottom-workspace` as `resizable: true` with explicit `minSize` and `maxSize` bounds. No drag-resize UI component exists in `CommandCenterShell`. Users cannot currently resize dock widths or the bottom workspace height; sizes are fixed at preset defaults.

#### File paths

| File | Role |
|------|------|
| `apps/web/app/control-room/command-center/DockResizeHandle.tsx` | **New file** — drag handle component |
| `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | Wire handles between zone dividers |
| `apps/web/app/control-room/command-center/useCommandCenterWorkspace.ts` | Add `setZoneSize(zoneId, px)` action |
| `packages/shared/src/workspace-manager/zones.ts` | Reference only (`minSize`, `maxSize`) |

#### Expected code changes

**`DockResizeHandle.tsx` (new file):**

```typescript
// New component — drag handle for a single dock boundary.
// Props: axis ('x' | 'y'), min, max, currentSize, onResize(px: number)
// Uses pointer capture (setPointerCapture) for reliable cross-element drag.
// Renders a thin 4px strip (w-1 / h-1) with a centered grip indicator.
// Keyboard: Arrow keys adjust by 4px steps; Shift+Arrow by 20px steps.
// ARIA: role="separator" aria-orientation aria-valuenow aria-valuemin aria-valuemax
// On pointerdown: captures pointer, records startX/Y and startSize.
// On pointermove: delta = current - start; clamps to [min, max]; calls onResize.
// On pointerup: releases capture; calls onResize with final clamped value.
```

**`useCommandCenterWorkspace.ts`:**
- Add `zoneSizes: Record<CommandCenterZoneToggleId, number>` state initialized from preset defaults.
- Expose `setZoneSize(zoneId: CommandCenterZoneToggleId, px: number): void` in the returned workspace object.
- The setter clamps via `clampZoneSize(zoneId, px)` imported from `@ubos/shared`.
- `zoneSizes` feeds into the size calculation in `CommandCenterShell` (replaces the hardcoded `leftDockWidth`, `rightDockWidth`, `bottomHeight` derivations at lines 384–395).

**`CommandCenterShell.tsx`:**
- Import `DockResizeHandle` from `./DockResizeHandle`.
- Replace the static `style={{ width: leftDockWidth }}` (line 516) with `setZoneSize`-driven state.
- Insert `<DockResizeHandle axis="x" ... onResize={(px) => setZoneSize('left-dock', px)} />` between the left dock div and the center stage div (between lines 527 and 529).
- Insert `<DockResizeHandle axis="x" ... onResize={(px) => setZoneSize('right-dock', px)} />` between the center stage div and the right dock div (between lines 542 and 544).
- Insert `<DockResizeHandle axis="y" ... onResize={(px) => setZoneSize('bottom-workspace', px)} />` above the `CommandCenterBottomWorkspace` div (around line 568).
- Guard: do not render resize handles when `layoutLocked === true`.

#### Acceptance criteria

- [ ] Left dock can be dragged to any width in `[300, 440]`px; dragging beyond bounds stops at the limit.
- [ ] Right dock can be dragged to any width in `[280, 460]`px.
- [ ] Bottom workspace can be dragged to any height in `[180, 420]`px.
- [ ] Handles are not rendered when `layoutLocked` is true.
- [ ] Keyboard resize works: focus handle, press Arrow to adjust by 4px, Shift+Arrow by 20px.
- [ ] `aria-valuenow` updates on every resize step.
- [ ] Pointer capture is released on `pointerup` and `pointercancel`.
- [ ] No layout jank: center stage receives freed space immediately; monitors never overlap docks.
- [ ] ResizeObserver in `useCommandCenterWorkspace` continues to track the true container size.

#### Dependencies

None (L-1 is the root dependency for L-2 and R-3).

---

### TASK L-2 — Persist user-dragged dock sizes across sessions

**Category:** Layout  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch (can follow L-1 in the same PR or as an immediate follow-on commit)

#### Description

Custom dock sizes set via drag (L-1) are lost on page reload. `CommandCenterPrefs` (version 1) does not include zone sizes. The `createLayoutSnapshot` / `parseLayoutSnapshot` pipeline in `persistence.ts` also does not capture sizes (it captures only panel states and collapsed zones). Zone sizes must be added to whichever persistence path is chosen.

#### File paths

| File | Role |
|------|------|
| `apps/web/app/control-room/command-center/command-center-logic.ts` | Extend `CommandCenterPrefs` type + serialize/parse |
| `apps/web/app/control-room/command-center/useCommandCenterWorkspace.ts` | Read/write `zoneSizes` in hydration and persist effects |

#### Expected code changes

**`command-center-logic.ts`:**

- Bump `CommandCenterPrefs` from `version: 1` to `version: 2` at line 347:

```typescript
// Before (line 347):
export type CommandCenterPrefs = {
  version: 1;
  activeBottomTab: DockTabId;
  expandedZones: WorkspaceZoneId[];
  layoutLocked: boolean;
  safeAreasVisible: boolean;
};

// After:
export type CommandCenterPrefs = {
  version: 2;
  activeBottomTab: DockTabId;
  expandedZones: WorkspaceZoneId[];
  layoutLocked: boolean;
  safeAreasVisible: boolean;
  zoneSizes: Partial<Record<CommandCenterZoneToggleId, number>>;
};
```

- Update `COMMAND_CENTER_PREFS_STORAGE_KEY` to `'ubos.command-center.prefs.v2'` (line 355) so version-1 data is silently abandoned rather than parsed against a wrong shape.
- Update `createDefaultCommandCenterPrefs()` to include `zoneSizes: {}`.
- Update `parseCommandCenterPrefs()` to validate the `zoneSizes` object: accept only keys in `['left-dock', 'right-dock', 'bottom-workspace']` with numeric values; drop invalid entries.

**`useCommandCenterWorkspace.ts`:**

- In the hydration `useEffect` (line 158–182): after reading prefs, call `setZoneSize` for each key in `prefs.zoneSizes`.
- In the `persist` callback (line 184–213): include `zoneSizes` as a mapping of `zoneSizes` state.

#### Acceptance criteria

- [ ] Setting dock sizes via drag, navigating away, and returning restores the same sizes.
- [ ] Invalid stored sizes (e.g., out-of-bounds) are silently clamped to `[minSize, maxSize]` on restore.
- [ ] Version-1 prefs in localStorage are silently discarded (no console errors or exceptions).
- [ ] If `localStorage` is unavailable, dragged sizes work in-memory for the session duration.

#### Dependencies

- L-1 must be merged first (introduces `setZoneSize` action and `zoneSizes` state).

---

### TASK W-1 — Register Ctrl+S as a Save Layout keyboard shortcut

**Category:** Workspace Manager Wiring  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch

#### Description

`CommandCenterTopMenu.tsx` line 299 displays `shortcut: 'Ctrl+S'` next to "Save Layout" in the File menu. The shortcut is a display hint only — `useWorkspaceKeyboard.ts` has no handler for `Ctrl+S`. Operators who press Ctrl+S trigger the browser's native Save Page dialog instead of saving the workspace layout.

#### File paths

| File | Lines affected |
|------|---------------|
| `apps/web/app/control-room/command-center/useWorkspaceKeyboard.ts` | Lines 26–32 (options type), 51–101 (handler body) |

#### Expected code changes

**`useWorkspaceKeyboard.ts`:**

- Add `onSaveLayout: () => void` to `WorkspaceKeyboardOptions` (line 26–32):

```typescript
type WorkspaceKeyboardOptions = {
  layoutLocked: boolean;
  onSelectPreset: (presetId: WorkspacePresetId) => void;
  onResetLayout: () => void;
  onOpenCommandPalette: () => void;
  onCloseOverlays: () => void;
  onSaveLayout: () => void;  // ← add
};
```

- Add handler after the Ctrl+K block (around line 79):

```typescript
// Ctrl+S — Save Layout
if (mod && !shiftKey && !altKey && key === 's') {
  event.preventDefault();
  onSaveLayout();
  return;
}
```

**`CommandCenterShell.tsx`:**

- Pass `onSaveLayout={saveLayout}` to `useWorkspaceKeyboard` call at line 409–415.

#### Acceptance criteria

- [ ] Pressing Ctrl+S (or Cmd+S on macOS) while focused anywhere in the Command Center calls `saveLayout()`.
- [ ] Pressing Ctrl+S while an `<input>`, `<textarea>`, or `contenteditable` element is focused does **not** intercept (editable-element guard at line 72 already covers this case for Ctrl+… shortcuts with alphanumeric keys — verify `isEditableTarget` covers 's').
- [ ] Browser native Save Page dialog does **not** appear.
- [ ] `layoutLocked` does **not** suppress Ctrl+S (saving is always allowed regardless of lock state — consistent with the ribbon "Save" button which is not guarded by lock).

#### Dependencies

None.

---

### TASK W-2 — Expose "Move panel to zone" UI

**Category:** Workspace Manager Wiring  
**Phase target:** 3.15E (deferred)  
**Risk:** Medium  
**PR type:** Dedicated PR

#### Description

`WorkspacePanelRegistry.movePanelToZone()` exists in the shared API but no UI surface exposes it. Operators cannot currently reassign panels (e.g., moving the Audio Mixer from the bottom workspace to the left dock) without switching presets.

#### File paths

| File | Role |
|------|------|
| `apps/web/app/control-room/command-center/DockablePanel.tsx` | Add "Move to…" popover to header actions |
| `apps/web/app/control-room/command-center/useCommandCenterWorkspace.ts` | Expose `movePanelToZone(panelId, zoneId)` |
| `packages/shared/src/workspace-manager/registry.ts` | `movePanelToZone` already exists — reference only |

#### Expected code changes

- `useCommandCenterWorkspace.ts`: Add `movePanelToZone(panelId: string, zoneId: CommandCenterZoneToggleId): void` that calls `registry.movePanelToZone(panelId, zoneId)` then calls `bump()`. Guard: no-op when `layoutLocked`.
- `DockablePanel.tsx`: When `movable` prop is true, render a "⇄ Move to…" button in `headerActions` that opens an inline popover listing the other two zones. Selecting a zone calls the parent-provided `onMoveTo(zoneId)` callback.
- Shell wires `onMoveTo` to `movePanelToZone` for applicable panels.

#### Acceptance criteria

- [ ] A panel can be moved from left dock → right dock → bottom workspace and back.
- [ ] Moving a panel to a zone that is currently collapsed auto-expands that zone.
- [ ] The "Move to…" UI does not appear when `layoutLocked` is true.
- [ ] Monitor panels (`program-monitor`, `preview-monitor`) do not have a "Move to…" button (non-closable panels are always in `center-stage`).
- [ ] Registry validation (`allowedZones`) rejects moves to zones not in the panel's `allowedZones` list.

#### Dependencies

None (independent of L-1/L-2, but best done after L-1 so zone sizes are user-adjustable at time of move).

---

### TASK W-3 — Align left-dock activation through `activatePanel()`

**Category:** Workspace Manager Wiring  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch

#### Description

`handleActivateSourceTab` in `CommandCenterShell.tsx` (lines 265–273) directly calls `setPanelVisible(gatingPanel, true)` then `toggleZone('left-dock')`. It does **not** route through `activatePanel()`. This means:

1. A collapsed-but-visible panel in the left dock is not automatically un-collapsed when navigated to.
2. The returned `operationsTab` and `bottomTab` from `activatePanel()` are not used, so the tab state may not sync if a panel has cross-zone registrations.

The right-dock path (lines 291–313) correctly uses `activatePanel()`.

#### File paths

| File | Lines |
|------|-------|
| `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | Lines 265–273 (`handleActivateSourceTab`) |

#### Expected code changes

Replace the body of `handleActivateSourceTab` (lines 265–273):

```typescript
// Before:
const handleActivateSourceTab = useCallback(
  (tab: SourceDockTabId) => {
    const gatingPanel = panelGatingSourceTab(tab);
    if (gatingPanel) setPanelVisible(gatingPanel, true);
    if (leftCollapsed) toggleZone('left-dock');
    onSourceDockTabChange(tab);
  },
  [setPanelVisible, leftCollapsed, toggleZone, onSourceDockTabChange],
);

// After:
const handleActivateSourceTab = useCallback(
  (tab: SourceDockTabId) => {
    const gatingPanel = panelGatingSourceTab(tab);
    if (gatingPanel) {
      // One Owner Rule: route through activatePanel so it un-collapses
      // the panel and expands the zone, matching the right-dock path.
      activatePanel(gatingPanel);
    } else if (leftCollapsed) {
      toggleZone('left-dock');
    }
    onSourceDockTabChange(tab);
  },
  [activatePanel, leftCollapsed, toggleZone, onSourceDockTabChange],
);
```

Remove `setPanelVisible` from the dependency array; add `activatePanel`.

#### Acceptance criteria

- [ ] Navigating to a source tab whose gating panel is collapsed (e.g., Scenes panel collapsed) auto-expands the panel without a separate user click.
- [ ] The left dock auto-expands if collapsed when a source tab is activated.
- [ ] Tabs with no gating panel (`null`) still expand a collapsed left dock.
- [ ] `handleHideSourcePanel` (lines 275–288) is unaffected (it calls `togglePanelVisibility` directly, which is correct).

#### Dependencies

None.

---

### TASK O-1 — External surface One Owner Rule audit

**Category:** One Owner Rule  
**Phase target:** 3.15D (completion)  
**Risk:** Low (audit-only; no structural changes expected)  
**PR type:** Patch (documentation update only if findings are minor; dedicated PR if remediations needed)

#### Description

Three external route links in `CommandCenterTopMenu.tsx` navigate to full pages rather than calling `activatePanel()` or `activateWorkspace()`:

| Menu | Label | href | Line |
|------|-------|------|------|
| Automation | "Automation Console" | `/control-room/automation` | 425 |
| Automation | "AI Director" | `/control-room/ai-director` | 426 |
| Monitoring | "Analytics" | `/control-room/analytics` | 443 |

These are **page-level navigations** (full route changes), not inline panel duplications. Navigating to a route is an acceptable One Owner Rule pattern — each route is itself the single primary home of its capability. However, each target page must be verified:

- It must not render a duplicate inline editor for a capability that already has a primary home in the Command Center panels.
- If it does, the duplicate must be replaced with a read-only summary + "Open in Command Center" link.

#### File paths to audit (read-only)

| File | What to check |
|------|--------------|
| `apps/web/app/control-room/automation/` | Does it render an inline scene/source editor? |
| `apps/web/app/control-room/` (ai-director route) | Does it render inline streaming controls? |
| `apps/web/app/control-room/` (analytics route) | Does it render inline production state editors? |

#### Acceptance criteria

- [ ] Each target page contains read-only views or dedicated capability surfaces with no duplication of Command Center panel editors.
- [ ] If a violation is found, a remediation task is created (separate PR) replacing the duplicate with a `broadcastQuickAction` navigation button.
- [ ] Findings are recorded as a brief inline comment in `CommandCenterTopMenu.tsx` above each `href` item, confirming the link was audited.

#### Dependencies

None.

---

### TASK O-2 — Resolve F1/F2/F3 keyboard shortcut labels in Production menu

**Category:** One Owner Rule  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch

#### Description

`CommandCenterTopMenu.tsx` lines 328–330 display:

```typescript
{ label: 'Cut',  shortcut: 'F1', ... }
{ label: 'Take', shortcut: 'F2', ... }
{ label: 'Auto', shortcut: 'F3', ... }
```

`useWorkspaceKeyboard.ts` does not register F1, F2, or F3. Displaying shortcut hints that do not work is a UX defect. The resolution is one of two options:

- **Option A (register):** Add F1/F2/F3 handlers to `useWorkspaceKeyboard.ts`. F-keys are not guarded by `isEditableTarget` (per the existing comment on line 20). This is safe and low-risk.
- **Option B (remove labels):** Remove the `shortcut` fields from the three Production menu items.

**Recommendation: Option A.** F1/F2/F3 are standard broadcast switcher shortcuts that operators expect globally.

#### File paths

| File | Lines |
|------|-------|
| `apps/web/app/control-room/command-center/useWorkspaceKeyboard.ts` | Lines 26–32 (type), 57–101 (handler) |
| `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | Props passed to `useWorkspaceKeyboard` |

#### Expected code changes (Option A)

**`useWorkspaceKeyboard.ts`:**

- Add `onCut`, `onTake`, `onAuto` to `WorkspaceKeyboardOptions` (optional/undefined so the hook remains usable outside the shell):

```typescript
type WorkspaceKeyboardOptions = {
  // ... existing ...
  onCut?: (() => void) | undefined;
  onTake?: (() => void) | undefined;
  onAuto?: (() => void) | undefined;
};
```

- Add handler block after the Esc block:

```typescript
// F1/F2/F3 — Cut / Take / Auto (always fires, no modifier required)
if (!mod && !shiftKey && !altKey) {
  if (key === 'F1') { event.preventDefault(); onCut?.(); return; }
  if (key === 'F2') { event.preventDefault(); onTake?.(); return; }
  if (key === 'F3') { event.preventDefault(); onAuto?.(); return; }
}
```

**`CommandCenterShell.tsx`:** Pass `onCut`, `onTake`, `onAuto` props (already received at lines 172–176) into `useWorkspaceKeyboard`.

#### Acceptance criteria

- [ ] Pressing F1, F2, or F3 globally invokes Cut, Take, or Auto respectively, identical to clicking the switcher buttons.
- [ ] F1/F2/F3 fire even when `layoutLocked` is true (layout lock should not block production transitions).
- [ ] F1/F2/F3 fire even when an `<input>` or `<textarea>` is focused (per existing behavior for Esc).
- [ ] The Production menu shortcut labels continue to display and match the registered behavior.

#### Dependencies

None.

---

### TASK R-1 — Document / enforce `forceBottomCollapsed` UX policy at `<900px`

**Category:** Responsive Behavior  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch (code comment + minor guard if override path is added)

#### Description

`CommandCenterShell.tsx` line 377 forces `forceBottomCollapsed = viewportWidth < 900`. At line 576–578, `onToggleCollapse` is set to `undefined` when `forceBottomCollapsed` is true, preventing the operator from manually expanding the bottom workspace on small screens. This is correct for preventing Program/Preview coverage but should be documented and tested as an intentional UX decision.

#### File paths

| File | Lines |
|------|-------|
| `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | Lines 370–378 (`forceBottomCollapsed`), 568–584 (bottom workspace render) |

#### Expected code changes

- Add an inline comment at line 377 explaining the intent:

```typescript
// Intentional: below 900px viewport width the bottom workspace is
// permanently collapsed to its tab-bar-only height so Program and
// Preview are never covered on compact displays. The operator can
// still navigate tabs but cannot expand the panel content area.
const forceBottomCollapsed = viewportWidth < 900;
```

- If the product decision is to allow an override swipe/button: add an `allowBottomExpandOverride` state (default false), a small "expand" button in the tab bar header of `CommandCenterBottomWorkspace`, and set `forceBottomCollapsed` only when `!allowBottomExpandOverride && viewportWidth < 900`.

#### Acceptance criteria

- [ ] Below 900px, the bottom workspace tab bar is always visible (height = `BOTTOM_WORKSPACE_TAB_BAR_HEIGHT` = 42px) and the content area is always hidden.
- [ ] The "Collapse/Expand" toggle in the bottom workspace is absent (or inert) below 900px.
- [ ] If an override button is added: tapping it toggles `allowBottomExpandOverride` and temporarily expands the bottom workspace until the viewport is resized above 900px or the page reloads.
- [ ] A JSDoc or inline comment at `forceBottomCollapsed` documents the decision.

#### Dependencies

None.

---

### TASK R-2 — Cap stacked monitor min-heights at small viewports

**Category:** Responsive Behavior  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch

#### Description

`CommandCenterStage.tsx` lines 216–221 set `minHeight: 450` for Program and `minHeight: 270` for Preview in stacked mode. At very small screen heights (< 720px), these combined 720px can overflow the viewport height, hiding Preview below the fold. When overflow occurs the stage switches to `overflow-y-auto` (line 247), which produces a scroll bar — this is acceptable but the minimum values should respect the available height.

#### File paths

| File | Lines |
|------|-------|
| `apps/web/app/control-room/command-center/CommandCenterStage.tsx` | Lines 216–221 (min style objects) |
| `apps/web/app/control-room/command-center/useCommandCenterWorkspace.ts` | Lines 135–152 (ResizeObserver provides `viewport.height`) |

#### Expected code changes

Pass `viewportHeight` (already available in the hook as `viewport.height`, returned in `layout`) into `CommandCenterStage`:

- `CommandCenterStage` receives a `viewportHeight?: number` prop.
- Compute adaptive minimums:

```typescript
const availableHeight = viewportHeight ?? 1080;
const programMin = Math.min(450, Math.round(availableHeight * 0.55));
const previewMin = Math.min(270, Math.round(availableHeight * 0.33));

const programMinStyle: CSSProperties = stacked
  ? { flex: `${share} 1 0%`, minHeight: programMin }
  : { flex: `${share} 1 0%`, minWidth: 800 };
const previewMinStyle: CSSProperties = stacked
  ? { flex: `${1 - share} 1 0%`, minHeight: previewMin }
  : { flex: `${1 - share} 1 0%`, minWidth: 480 };
```

**`CommandCenterShell.tsx`:** Pass `viewportHeight={layout.zones['center-stage'].rect.height || DEFAULT_VIEWPORT.height}` to `CommandCenterStage`.

#### Acceptance criteria

- [ ] At viewport height ≥ 720px, Program min-height is 450 and Preview min-height is 270 (unchanged).
- [ ] At viewport height 600px, Program min-height is ≤ 330 and Preview min-height is ≤ 198, preventing overflow.
- [ ] Both monitors remain visible without scrolling at any viewport height ≥ 400px.
- [ ] In side-by-side (non-stacked) mode, `minWidth` values are unchanged.

#### Dependencies

None (independent of L-1).

---

### TASK R-3 — Implement compact left-dock width at 1200–1439px

**Category:** Responsive Behavior  
**Phase target:** 3.15E (defer)  
**Risk:** Medium  
**PR type:** Dedicated PR

#### Description

The 3.15D shell comment (line 33) documents: "1200–1439px: right dock collapsed by default, left dock compact, bottom tabbed." Currently, "compact" is not implemented — the left dock at 1200–1439px is either at full preset width (340px) or fully collapsed. A compact width (≈ 220px) would improve the usable center-stage area at laptop viewports.

#### File paths

| File | Lines |
|------|-------|
| `packages/shared/src/workspace-manager/zones.ts` | Zone definition for `left-dock` (lines 50–60) |
| `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | `leftDockWidth` derivation (lines 384–387) |
| `apps/web/app/control-room/command-center/CommandCenterLeftDock.tsx` | May need `compact` prop |

#### Expected code changes

- Add `compactSize?: number` to `WorkspaceZoneDefinition` type in `packages/shared/src/workspace-manager/types.ts`; set `compactSize: 220` on the `left-dock` definition in `zones.ts`.
- In `CommandCenterShell.tsx`, compute `isCompactViewport = viewportWidth >= 1200 && viewportWidth < 1440`.
- When `isCompactViewport` and the left dock is not user-expanded: use `compactSize` (220) instead of `defaultSize` (340) for `leftDockWidth`.
- `CommandCenterLeftDock` receives a `compact` boolean; in compact mode it may hide tab labels, show only icons, or truncate panel headers.

#### Acceptance criteria

- [ ] At 1200–1439px viewport width, the left dock renders at ≤ 220px wide without collapsing.
- [ ] At ≥ 1440px, the left dock renders at its preset default width.
- [ ] At < 1200px, the left dock auto-collapses (existing behavior unchanged).
- [ ] User drag-resize (L-1) overrides the compact width; dragging above 220px exits compact mode.

#### Dependencies

- Best done after L-1 (drag-resize) so that compact-to-full drag is testable.

---

### TASK LG-1 — Delete `BroadcastCommandCenterLayout.tsx` and remove from barrel

**Category:** Legacy Removal  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch (can batch with LG-2 and LG-3)

#### Description

`BroadcastCommandCenterLayout.tsx` (397 lines) is the pre-3.15D layout orchestrator. `scene-workspace.tsx` no longer imports it (confirmed: `grep -n "BroadcastCommandCenterLayout" scene-workspace.tsx` returns empty). It remains in the codebase and is exported from the barrel, creating false ambiguity about which layout is active.

#### File paths

| File | Action |
|------|--------|
| `apps/web/app/control-room/broadcast-command-center/BroadcastCommandCenterLayout.tsx` | **Delete** |
| `apps/web/app/control-room/broadcast-command-center/index.ts` | Remove lines 1–2 (export + type export) |

#### Expected changes

Delete `BroadcastCommandCenterLayout.tsx` entirely.

In `broadcast-command-center/index.ts`, remove:
```typescript
export { BroadcastCommandCenterLayout } from './BroadcastCommandCenterLayout';
export type { BroadcastCommandCenterLayoutProps } from './BroadcastCommandCenterLayout';
```

#### Acceptance criteria

- [ ] `BroadcastCommandCenterLayout.tsx` no longer exists in the repository.
- [ ] TypeScript compilation succeeds with no missing-module errors.
- [ ] `grep -rn "BroadcastCommandCenterLayout"` across the whole repo returns zero results.

#### Dependencies

None. Can be batched with LG-2 and LG-3 in one commit.

---

### TASK LG-2 — Delete `FloatingProductionGraphPanel.tsx` and remove from barrel

**Category:** Legacy Removal  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch (batch with LG-1 and LG-3)

#### Description

`FloatingProductionGraphPanel.tsx` (63 lines) is exported from `broadcast-command-center/index.ts` line 15. `scene-workspace.tsx` does not import it (confirmed: `grep -n "FloatingProductionGraphPanel" scene-workspace.tsx` returns empty). The Production Graph is now reached via the bottom workspace tab (`'production-graph'`).

#### File paths

| File | Action |
|------|--------|
| `apps/web/app/control-room/broadcast-command-center/FloatingProductionGraphPanel.tsx` | **Delete** |
| `apps/web/app/control-room/broadcast-command-center/index.ts` | Remove line 15 |

#### Acceptance criteria

- [ ] File deleted; barrel line removed.
- [ ] TypeScript compilation succeeds.
- [ ] `grep -rn "FloatingProductionGraphPanel"` returns zero results.

#### Dependencies

None. Can batch with LG-1 and LG-3.

---

### TASK LG-3 — Delete `ZoneResizeHandle.tsx` and remove from barrel

**Category:** Legacy Removal  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch (batch with LG-1 and LG-2; do before L-1 to avoid confusion)

#### Description

`ZoneResizeHandle.tsx` (78 lines) in `broadcast-command-center/` is the legacy dock resize handle used by `BroadcastCommandCenterLayout`. It is not exported from the barrel, but it remains as a confusing precedent when L-1 introduces a new `DockResizeHandle` in `command-center/`. Delete it before L-1 is written to avoid copy-paste of an outdated implementation.

#### File paths

| File | Action |
|------|--------|
| `apps/web/app/control-room/broadcast-command-center/ZoneResizeHandle.tsx` | **Delete** |

#### Acceptance criteria

- [ ] File deleted.
- [ ] TypeScript compilation succeeds.
- [ ] `grep -rn "ZoneResizeHandle"` returns zero results outside `broadcast-command-center/` (the file itself is gone; no other consumers existed).

#### Dependencies

Should be done **before** L-1 (to avoid confusion with the new `DockResizeHandle`).

---

### TASK LG-4 — Audit and trim `broadcast-command-center/index.ts` barrel

**Category:** Legacy Removal  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch (follow LG-1/2/3)

#### Description

After LG-1, LG-2, and LG-3, the barrel at `broadcast-command-center/index.ts` still exports items. Confirm each remaining export is actively consumed by `CommandCenterShell` or its sub-components, and remove dead exports.

Current confirmed active consumers in `scene-workspace.tsx` (lines 125–132):
- `MonitorStatusInfo` (type) ← from `CenterProgramPreviewDeck`
- `SourceDockPanel` ← from `SourceDockPanel`
- `preferredSourceDockTab` ← from `command-rail-constants`
- `DiagnosticsSummary` ← imported directly from `FloatingDiagnosticsPanel`, not barrel
- `OperationsDockSection` (type) ← from `RightOperationsDock`

`CommandCenterShell.tsx` additionally imports:
- `type MonitorStatusInfo` (line 43)
- `type OperationsDockSection` (line 44)
- `broadcastSurfaces` (line 44)

#### File paths

| File | Action |
|------|--------|
| `apps/web/app/control-room/broadcast-command-center/index.ts` | Remove unused exports after LG-1/2/3 |

#### Acceptance criteria

- [ ] Every export remaining in the barrel is imported somewhere in the active codebase.
- [ ] `FloatingRoutingMatrixPanel` is audited: if not consumed by any active file, remove its export and delete the file.
- [ ] TypeScript compilation succeeds.

#### Dependencies

LG-1, LG-2, LG-3 must be done first.

---

### TASK OV-3 — Wire `latencyLabel` into monitor overlays

**Category:** Overlay Wiring  
**Phase target:** 3.15D (completion)  
**Risk:** Low  
**PR type:** Patch

#### Description

`MonitorOverlay.tsx` declares `latencyLabel?: string` on `MonitorOverlayData` (line 56). The overlay component renders it as a secondary (hover-reveal) chip for both Program and Preview monitors (lines 212–215). However, `scene-workspace.tsx` does not pass `latencyLabel` to either `programOverlay` or `previewOverlay` props.

The data source is available: `primaryStreamTarget?.transport.latencyMs` is already derived at line 709 and referenced at line 1085. A label string can be constructed as `` `${primaryStreamTarget.transport.latencyMs}ms` `` conditionally.

**Note:** OV-1 (`recordingLabel`, `streamingLabel`, `droppedLabel`) and OV-2 (`armedGraphicsCount`, `transitionLabel`) are already wired at lines 4761–4782 — the audit report incorrectly listed these as gaps.

#### File paths

| File | Lines |
|------|-------|
| `apps/web/app/control-room/scene-workspace.tsx` | Lines 4761–4782 (`programOverlay` and `previewOverlay` props) |

#### Expected code changes

In the `<CommandCenterShell>` call at line 4696, extend the `programOverlay` prop:

```typescript
programOverlay={{
  sceneName: programScene.name,
  recordingLabel: ...,   // already present
  streamingLabel: ...,   // already present
  droppedLabel: ...,     // already present
  latencyLabel:          // ADD THIS
    primaryStreamTarget?.transport.latencyMs != null
      ? `${primaryStreamTarget.transport.latencyMs}ms`
      : undefined,
}}
```

Optionally add the same `latencyLabel` to `previewOverlay` if the runtime exposes a preview-path latency value; if not, leave it `undefined` (the component handles `undefined` gracefully by not rendering the chip).

#### Acceptance criteria

- [ ] When a stream target is active with a known `latencyMs`, the Program monitor overlay shows a secondary "LAT XXXms" chip on hover.
- [ ] When `latencyMs` is `null` or `undefined`, no latency chip appears (no empty chip rendered).
- [ ] The chip is `pointer-events-none` and does not intercept any monitor interaction.
- [ ] No new data fetching or runtime coupling is introduced — only the already-derived `primaryStreamTarget` variable is used.

#### Dependencies

None.

---

## Section 3 — Execution Order: Dependency Graph, PR Sequence, Batch Safety

### 3.1 Dependency graph

```
LG-3 (ZoneResizeHandle delete)
  └── L-1 (DockResizeHandle implement)
        └── L-2 (persist dock sizes)
              └── R-3 (compact left dock — best post-L-1)

LG-1 (BroadcastCommandCenterLayout delete)
  └── LG-2 (FloatingProductionGraphPanel delete)
        └── LG-4 (barrel trim)

W-1 (Ctrl+S shortcut)          [independent]
W-3 (left-dock activatePanel)  [independent]
O-2 (F1/F2/F3 shortcuts)       [independent]
OV-3 (latencyLabel wiring)     [independent]
R-1 (forceBottomCollapsed doc)  [independent]
R-2 (stacked min-height cap)   [independent]
O-1 (external surface audit)   [independent — audit only]
W-2 (move-panel UI)            [independent — 3.15E scope]
```

### 3.2 PR sequence

| PR # | Tasks | Type | Notes |
|------|-------|------|-------|
| **PR-A** | LG-1, LG-2, LG-3, LG-4 | Patch batch | All deletions + barrel trim; safe to merge first; unblocks L-1 |
| **PR-B** | W-1, O-2, W-3, OV-3 | Patch batch | Four independent one-file changes; low risk; no UI changes |
| **PR-C** | R-1, R-2, O-1 | Patch batch | Responsive doc + stacked-height cap + audit annotation; low risk |
| **PR-D** | L-1, L-2 | Dedicated PR | Drag-resize implementation; requires browser + keyboard QA; must not batch with other changes |
| **PR-E** | R-3, W-2 | Dedicated PR | 3.15E scope; compact dock + move-panel UI |

### 3.3 Safe-to-batch vs. must-isolate

**Safe to batch (same commit or same PR):**
- LG-1 + LG-2 + LG-3 + LG-4 (all deletions; no logic changes)
- W-1 + O-2 (both touch `useWorkspaceKeyboard.ts`; clean sequential edits)
- W-3 + OV-3 (different files; no interaction)
- R-1 + R-2 + O-1 (all low-risk; different files)

**Must isolate (own PR):**
- **L-1** — New component; new hook actions; modifies shell layout flow; needs focused review and browser QA
- **L-2** — Storage version bump; depends on L-1 state; must not precede L-1
- **R-3** — Requires new type field in shared package; cross-package change; scope risk
- **W-2** — New UI surface (popover) in `DockablePanel`; cross-component; requires UX review

---

## Section 4 — 3.15 Completion Status Summary

### 4.1 Completion percentage per phase

| Phase | Scope | Completion | Remaining |
|-------|-------|-----------|-----------|
| 3.15A — Workspace Manager Foundation | types, zones, panels, registry, presets, layout, persistence, tests | **100%** | None |
| 3.15B — Command Center Bridge Logic | mappings, hook, prefs, rail items, tests | **100%** | None |
| 3.15C — Visual Polish + One Owner Rule | DockablePanel, theme, tokens, OOR enforcement | **95%** | Panel undock (deferred; not a 3.15 blocker) |
| 3.15D-2 — Zone Geometry / Docks / Stage | geometry, stage, overlay, docks, responsive | **82%** | L-1, L-2, R-2, R-3 |
| 3.15D-3 — Menu / Palette / Keyboard | 13 menus, palette, shortcuts, ribbon | **97%** | W-1, O-2 |
| Legacy Removal | BroadcastCommandCenterLayout, legacy floaters | **40%** | LG-1, LG-2, LG-3, LG-4 |
| Overlay Runtime Wiring | programOverlay / previewOverlay data | **90%** | OV-3 (latencyLabel only) |
| Workspace Manager Wiring | activatePanel alignment, keyboard shortcuts | **75%** | W-1, W-3 (W-2 deferred) |
| Responsive Behavior | stacking, collapse, compact dock | **70%** | R-1, R-2, R-3 |
| One Owner Rule | OOR enforcement, external surface compliance | **85%** | O-1, O-2 |

### 4.2 Overall 3.15 completion

**Weighted overall: ~88%**

Completed items: 37 of 42 discrete deliverables (including corrections that upgraded OV-1, OV-2, D-1, D-2, D-3 from PARTIAL to DONE).

### 4.3 Remaining blockers

**For a "3.15D complete" release tag:**

| Blocker | Task | Effort estimate |
|---------|------|----------------|
| Drag-resize handles absent (user-visible gap) | L-1 + L-2 | High complexity; 1–2 sprint tasks |
| Legacy files in tree (ambiguity risk) | LG-1–4 | Very low; deletions only |
| Ctrl+S shortcut not functional | W-1 | Trivial; ~10 lines |
| F1/F2/F3 labels displayed but not registered | O-2 | Low; ~15 lines |
| `latencyLabel` not wired | OV-3 | Trivial; 3 lines |
| Left-dock not using `activatePanel()` | W-3 | Low; ~5 lines |
| Stacked min-height overflow risk | R-2 | Low; ~10 lines |

**Non-blockers (can ship without these):**
- O-1 (external surface audit — no user-visible defect)
- R-1 (documentation only)
- R-3 (3.15E scope; compact dock is an enhancement)
- W-2 (3.15E scope; move-panel UI)

### 4.4 Readiness for 3.15E

3.15E is ready to scope **after** PR-A and PR-B are merged. At that point:

- The legacy surface is clean (LG-1–4 done).
- All one-file patch items are merged (W-1, O-2, W-3, OV-3).
- The only active 3.15D work remaining is L-1/L-2 (drag-resize).

**3.15E recommended scope:**
- R-3 (compact left dock at 1200–1439px)
- W-2 (move-panel-to-zone UI)
- Panel undock / floating windows (3.15C deferred item)
- Multi-monitor / external monitor zone implementation (3.15A placeholder)

### 4.5 Recommended version tag

| Tag | Condition |
|-----|-----------|
| `3.15d-4` | After PR-A (LG-1–4) + PR-B (W-1, O-2, W-3, OV-3) + PR-C (R-1, R-2, O-1) are merged but before L-1 |
| `3.15d-5` | After PR-D (L-1, L-2 drag-resize) is merged — **true 3.15D complete** |
| `3.15e-1` | First 3.15E increment (R-3 + W-2) |
| `3.15e-2` | Panel undocking / floating windows |

---

*Task plan produced from static source analysis of commit `HEAD`. Line numbers reference the state at time of audit. All code changes are described and planned; no files were modified by this document.*
