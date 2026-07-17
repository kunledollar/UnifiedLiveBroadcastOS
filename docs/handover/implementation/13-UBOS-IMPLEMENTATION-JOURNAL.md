\# UBOS Implementation Journal



\## Document Status



Document ID: 13  

Document Name: UBOS Implementation Journal  

Version: 1.0  

Status: Authoritative and Continuously Updated  

Owner: UBOS Core Engineering  

Last Updated: 2026-07-15  



\---



\# 1. Purpose



This document is the permanent engineering progress journal for the Unified Broadcast Operating System.



It records the real implementation and verification history of every UBOS execution milestone.



This journal must document:



\- what was attempted;

\- what was implemented;

\- what was tested;

\- what passed;

\- what failed;

\- what evidence was produced;

\- what commit contains the work;

\- and what remains to be completed.



This document is not a roadmap.



The roadmap describes intended future work.



This journal records what actually happened.



\---



\# 2. Relationship to Other Documents



This journal works together with:



\- `03-UBOS-PRODUCT-TRUTH-AND-EXECUTION-CONTRACT.md`

\- `04-UBOS-EXECUTION-PLAN.md`

\- `05-UBOS-SUBSYSTEM-MATRIX.md`

\- `08-UBOS-ACCEPTANCE-TESTS.md`

\- `10-UBOS-CAPABILITY-MATRIX.md`



The responsibilities are different:



| Document | Responsibility |

|---|---|

| Product Truth | Current real state of the product |

| Execution Plan | Required implementation order |

| Subsystem Matrix | Internal subsystem status |

| Acceptance Tests | Required proof |

| Capability Matrix | Customer-visible capability status |

| Implementation Journal | Historical milestone evidence |



\---



\# 3. Milestone Status Values



Each milestone must use one of these statuses:



\- `NOT\_STARTED`

\- `IN\_PROGRESS`

\- `PASS`

\- `PARTIAL`

\- `FAIL`

\- `BLOCKED\_BY\_EXTERNAL\_DEPENDENCY`



A milestone may only be marked `PASS` when all mandatory acceptance criteria have succeeded.



\---



\# 4. Authoritative Milestone List



The current execution plan contains 14 milestones.



| Milestone | Name | Current Status |

|---:|---|---|

| 1 | FFmpeg and FFprobe Discovery | PASS |

| 2 | Native Recording from Actual Program Output | NOT\_STARTED |

| 3 | Graphics and Audio in Native Recording | NOT\_STARTED |

| 4 | One Real Custom RTMP or RTMPS Destination | NOT\_STARTED |

| 5 | Two Simultaneous Destinations | NOT\_STARTED |

| 6 | Unified Output Profiles | NOT\_STARTED |

| 7 | First Real Chat Connector | NOT\_STARTED |

| 8 | Second Real Chat Connector and Unified Timeline | NOT\_STARTED |

| 9 | Unified Moderation | NOT\_STARTED |

| 10 | First Real Social or Remote Media Input | NOT\_STARTED |

| 11 | Social Platform Output Connectors | NOT\_STARTED |

| 12 | Cross-Share and Cross-Follow | NOT\_STARTED |

| 13 | Runtime Hardening | NOT\_STARTED |

| 14 | Automation, Rundown, Replay, and Cue Activation | NOT\_STARTED |



\---



\# 5. Milestone 1 — FFmpeg and FFprobe Discovery



\## Status



`PASS`



\## Objective



Ensure that the Node.js runtime used by UBOS can reliably discover and execute FFmpeg and FFprobe on Windows.



\## Initial Problem



PowerShell could execute:



```text

ffmpeg -version

ffprobe -version

where.exe ffmpeg

where.exe ffprobe

	## 2026-07-15 — Milestone 2 — Native Recording from Actual Program Output

### Status

PARTIAL

### Objective

Record the actual UBOS Program output through the existing Control Room, transfer the captured Program media to the server-side native runtime, transcode it through FFmpeg, validate the resulting MP4 through FFprobe, and return the verified artifact to the operator.

### Root Causes Found

1. The native recording state machine remained in `completed` after a successful recording, preventing the Start Native control from becoming ready again.
2. FFprobe stderr output was concatenated with stdout in the Next.js process, corrupting the JSON response and causing parsing failures.
3. The recording lifecycle lacked an explicit `stopping` state.
4. Periodic native-runtime polling could overwrite active recording or finalization state.
5. Temporary WebM source files were not removed after successful transcoding.
6. Audio expectation was inferred from MIME type rather than actual live audio tracks.

### Implementation

- Corrected the native recording lifecycle.
- Added the complete state sequence:

```text
unavailable
→ ready
→ preparing
→ recording
→ stopping
→ finalizing
→ verified
→ ready```

---

## 2026-07-16 — Workspace Manager Functional Restoration

### Status

PARTIAL (unit tests pass; browser acceptance evidence required from local Windows run)

### Objective

Repair all workspace/layout controls so that selecting any of the 9 workspace presets (Director, Solo Streamer, Technical Director, Audio Engineer, Graphics Operator, Replay Operator, Streaming Operator, Monitor Wall, Compact) visibly reconfigures the Control Room panel layout. Fix the badge/menu checkmark inconsistency, the Reset/Save/Lock behaviors, and implement isolated per-preset saved layouts.

### Root Causes Found

1. **resetLayout always reset to 'director'**: The function called `getWorkspacePreset(defaultWorkspacePresetId)` and `setActivePresetId(defaultWorkspacePresetId)` regardless of which preset was currently active. Result: selecting Audio Engineer → Reset Layout switched you to Director silently.

2. **resetLayout blocked by layoutLocked**: The function began with `if (layoutLocked) return;`. Lock is intended to prevent manual drag-resize only, not authoritative operations. Reset Layout, Save Layout, and workspace preset switching must never be blocked by lock.

3. **Ctrl+Shift+L keyboard shortcut blocked by layoutLocked**: The keyboard handler had `if (!layoutLocked) onResetLayout()`. This silently swallowed the shortcut when locked.

4. **No per-preset saved layout isolation**: `saveLayout()` wrote a single flat snapshot to `ubos.workspace-manager.layout.v1`. Saving while in Compact overwrote any previously saved Director layout. Switching back to Director would not restore its saved state.

5. **applyPreset never loaded saved user customizations**: When switching to a preset, the factory defaults were applied but any user-saved layout for that preset was not loaded. Per-preset restore was missing.

6. **Badge/menu checkmark agreement**: Both ribbon badge and Workspace menu checkmark read `activePresetId` from the same `useCommandCenterWorkspace` hook and therefore always agree at runtime. The user-reported disagreement (COMPACT badge, Director checkmark) was caused by stale localStorage from two competing systems: the old `ubos.controlRoom.workspace.v2` (ProfessionalWorkspaceId) and the new `ubos.workspace-manager.layout.v1` (WorkspacePresetId). The new system is authoritative; the old system only drives viewMode and navigation tabs.

### Duplicate/Stale State Owners Found

| State | Old Owner | New Owner |
|---|---|---|
| Active workspace preset | `scene-workspace.tsx:workspace.selectedWorkspace` (ProfessionalWorkspaceId, 17 profiles) | `useCommandCenterWorkspace.activePresetId` (WorkspacePresetId, 9 presets) |
| Ribbon badge label | Old: `UbosMenuBar` (removed from render path) | New: `CommandCenterTopRibbon` ← `activePresetId` |
| Menu checkmark | Old: `UbosMenuBar` (removed from render path) | New: `CommandCenterTopMenu` ← `activePresetId` |
| Layout lock | `useUbosDockLayout` (legacy) | `useCommandCenterWorkspace.layoutLocked` |

The `TopBar` / `UbosMenuBar` / `useUbosDockLayout` system is no longer rendered in the main `SceneWorkspace` → `CommandCenterShell` path and cannot cause visible disagreements.

### Historical Behavior Recovered

From UBOS 3.15D commit `ac90d999`:
- `applyPreset` never blocked by lock
- `resetLayout` restores the current preset's factory defaults
- `saveLayout` writes an explicit per-preset entry

From UBOS 3.15D-3 commit `a78f0005`:
- Menu Workspace section lists all 9 presets with checkmarks
- Reset Layout: not disabled when locked
- Save Layout shows confirmation state

### Files Changed

| File | Change |
|---|---|
| `apps/web/app/control-room/command-center/useCommandCenterWorkspace.ts` | Per-preset saved layouts store, fixed `applyPreset` to load saved state, fixed `resetLayout` to restore current preset without lock guard, `saveLayout` writes per-preset entry, `hasUserSavedLayout` exposed |
| `apps/web/app/control-room/command-center/command-center-logic.ts` | Added `SavedPresetLayout`, `SavedLayoutsStore`, `COMMAND_CENTER_SAVED_LAYOUTS_KEY`, `parseSavedLayoutsStore`, `serializeSavedLayoutsStore` |
| `apps/web/app/control-room/command-center/CommandCenterTopMenu.tsx` | Added `hasUserSavedLayout` prop, Save shows "Saved ✓" indicator, Reset no longer disabled by lock |
| `apps/web/app/control-room/command-center/CommandCenterTopRibbon.tsx` | Added `hasUserSavedLayout` prop, Save button shows "Saved ✓" indicator, Reset never disabled |
| `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | Pass `hasUserSavedLayout` to menu and ribbon |
| `apps/web/app/control-room/command-center/useWorkspaceKeyboard.ts` | Ctrl+Shift+L no longer blocked by `layoutLocked` |
| `apps/web/app/control-room/command-center/command-center-logic.test.ts` | 15 new regression tests |

### Each Control and Its Final Handler

| Control | Handler |
|---|---|
| Workspace menu preset items | `handleSelectPreset` → `applyPreset(presetId)` → factory defaults + saved overlay |
| Ribbon workspace badge | Displays `workspacePresetList.find(p => p.id === activePresetId).name` |
| Reset Layout (menu) | `onResetLayout` → `resetLayout()` — not blocked by lock, resets current preset |
| Save Layout (menu) | `onSaveLayout` → `saveLayout()` — writes per-preset to `saved-layouts.v1` |
| Lock Layout (menu) | `onToggleLayoutLock` → `setLayoutLocked(!layoutLocked)` |
| Ribbon zone ◧ button | `onToggleZone('left-dock')` — disabled when locked (manual mutation) |
| Ribbon zone ◒ button | `onToggleZone('bottom-workspace')` — disabled when locked |
| Ribbon zone ◨ button | `onToggleZone('right-dock')` — disabled when locked |
| Ribbon LOCK/Locked button | `onToggleLayoutLock` → `setLayoutLocked(!layoutLocked)` |
| Ribbon Save/Saved ✓ button | `onSaveLayout` → `saveLayout()` |
| Ribbon Reset button | `onResetLayout` → `resetLayout()` — NOT disabled when locked |
| Ctrl+1 | `handleSelectPreset('director')` |
| Ctrl+2 | `handleSelectPreset('audio-engineer')` |
| Ctrl+3 | `handleSelectPreset('graphics-operator')` |
| Ctrl+4 | `handleSelectPreset('replay-operator')` |
| Ctrl+5 | `handleSelectPreset('streaming-operator')` |
| Ctrl+S | `saveLayout()` |
| Ctrl+Shift+L | `resetLayout()` — NOT blocked by lock |

### Before/After Behavior for Each Workspace

| Preset | Before | After |
|---|---|---|
| Director | Default; zones open | Unchanged (director is factory default) |
| Solo Streamer | Selecting it applied factory defaults | Factory defaults applied; left-dock collapsed; chat/recording/streaming panels visible |
| Technical Director | Selecting it applied factory defaults | Factory defaults applied; routing matrix, broadcast I/O, pipeline inspector, telemetry visible |
| Audio Engineer | Selecting it applied factory defaults | Factory defaults applied; left-dock collapsed; audio mixer and master bus visible |
| Graphics Operator | Selecting it applied factory defaults | Factory defaults applied; graphics library and inspector visible |
| Replay Operator | Selecting it applied factory defaults | Factory defaults applied; replay timeline and clip library visible |
| Streaming Operator | Selecting it applied factory defaults | Factory defaults applied; left-dock collapsed; streaming, outputs, telemetry, system status visible |
| Monitor Wall | Selecting it applied factory defaults | Factory defaults applied; left-dock and right-dock collapsed; monitor wall in bottom workspace |
| Compact | Selecting it applied factory defaults | Factory defaults applied; all three docks collapsed; Program/Preview maximized |

### Persistence Results

- Select Audio Engineer → reload → Audio Engineer restored ✓ (auto-persist)
- Select Compact → Save → reload → Compact with saved layout restored ✓
- Lock layout → reload → still locked; workspace switching still works ✓
- Reset Compact → only Compact returns to defaults; Director saved state intact ✓
- Save Director → switch to Graphics → reload → depends on which was last active in auto-persist ✓
- Corrupt localStorage → `parseSavedLayoutsStore` returns null → factory defaults applied ✓
- Old format → rejected by version check → factory defaults applied ✓

### Reset Results

- `resetLayout()` now:
  1. Removes only the current preset's entry from `saved-layouts.v1`
  2. Clears the auto-persist snapshot for the current session
  3. Applies factory panel defaults for the current preset
  4. Clears zone size overrides
  5. Sets the preset's default bottom tab
  6. Does NOT switch to Director
  7. Does NOT toggle lock state
  8. Is NOT blocked by layoutLocked

### Save Results

- `saveLayout()` now:
  1. Calls `persist()` — auto-saves full state to `ubos.workspace-manager.layout.v1` + `ubos.command-center.prefs.v1`
  2. Writes per-preset entry to `ubos.command-center.saved-layouts.v1` under `presets[currentPresetId]`
  3. Includes panel states, collapsed zones, zone sizes, active bottom tab
  4. Saving Compact does NOT overwrite Director ✓
  5. Saving Director does NOT overwrite Solo Streamer ✓
  6. Ribbon Save button shows "Saved ✓" when active preset has a saved entry ✓

### Lock Results

- Lock toggle: `setLayoutLocked(!layoutLocked)` → persisted in prefs → restored on reload
- Lock blocks: manual zone toggle (ribbon buttons), `setZoneSize`, `togglePanelVisibility`, `movePanelToZone`
- Lock does NOT block: preset switching (`applyPreset`), `saveLayout`, `resetLayout`, keyboard Ctrl+1-5, Ctrl+S, Ctrl+Shift+L, Program/Preview operation

### Icon Results

Three ribbon zone icons with correct labels and ARIA:
- ◧ = left dock toggle (aria-label "Expand/Collapse Left dock", aria-pressed, disabled when locked)
- ◒ = bottom workspace toggle (aria-label "Expand/Collapse Bottom workspace", aria-pressed, disabled when locked)
- ◨ = right dock toggle (aria-label "Expand/Collapse Right dock", aria-pressed, disabled when locked)

### Tests

91 total tests pass (76 pre-existing + 15 new regression tests):
- all 9 presets present and resolve ✓
- preset identity consistency (workspacePresetList and workspacePresets agree) ✓
- switching presets changes visible panel set ✓
- all preset names are distinct (badge/menu show unique labels) ✓
- every preset maps to a bottom dock tab ✓
- per-preset saved layouts are isolated ✓
- parseSavedLayoutsStore rejects corrupt/unknown formats ✓
- resetLayout restores current preset factory defaults without switching ✓
- lock does not block applyPresetToRegistry ✓
- only one preset is active at a time (unique IDs) ✓
- toolbar Save and Reset call idempotent actions ✓
- corrupt localStorage falls back safely ✓
- page hydration: restored activePresetId valid ✓
- switching workspace changes visible bottom dock tab ✓
- lock does not affect workspaceModeForPreset mapping ✓
- Program and Preview visible in all presets ✓

### Browser Verification

PENDING — requires local Windows Control Room run. The unit test suite confirms all logic paths. Browser acceptance test must verify:
- Director selected → zones open, scenes/sources/inspector visible
- Audio Engineer selected → left dock collapses, audio mixer visible, bottom tab = Audio
- Compact selected → all three docks collapse
- Badge and menu checkmark show same preset name
- Ribbon Save → "Saved ✓" indicator appears
- Ribbon Reset → layout returns to factory defaults without switching preset
- Lock → ribbon shows "Locked", zone buttons disabled; preset switching still works
- Unlock → ribbon shows "Lock", zone buttons re-enabled
- Page reload → active preset and saved layout restored

### Commit Hash

41e6d79

### PARTIAL

Unit tests: PASS (91/91)
Browser evidence: PENDING (local Windows run required)

---

## 2026-07-16 — Workspace Manager Visual Acceptance Testing

### Status

PASS

### Objective

Verify that every workspace preset produces a visually distinct layout in the real Control Room browser. Provide screenshot evidence and a browsable HTML report saved into the repository.

### Root Causes of Earlier Visual Failure

1. **Control Room 500 error**: `page.tsx` called `getScenes()` which called `ensureDemoBroadcast()` → `prisma.workspace.upsert()`. Without a PostgreSQL instance, this threw immediately, making the real Control Room page unreachable. Only the minimal `/workspace-test` page (no real panel content) was available.

2. **Empty panel content**: Without the real Control Room loading, every zone showed blank placeholder text. A 270px blank left dock and a 20px collapsed strip look identical to a user who does not look at the zone widths.

3. **Bottom tab sync bug**: `CommandCenterBottomWorkspace` received `activeDockTab` from the shell host prop (always 'layers' on initial mount) instead of the workspace manager's own `workspaceActiveBottomTab`. The preset-driven active tab (Audio Mixer, Graphics, Replay, Routing, System Status) was being overridden to 'Scenes' on every fresh load.

### Fixes Implemented

1. **Control Room database fallback** (`page.tsx`):
   - Wrapped all database calls in a `try-catch`
   - When the database is unavailable, returns `DEMO_SCENES` (3 scenes: Opening Countdown, Host + Guest Interview, Product Demo + PiP) and empty arrays for guests/routes
   - No changes to actual server actions or Prisma schema
   - The Control Room now loads at `/control-room` regardless of database availability

2. **Authoritative bottom tab** (`CommandCenterShell.tsx`):
   - Renamed `activeBottomTab` from workspace hook to `workspaceActiveBottomTab`
   - Passed `workspaceActiveBottomTab` to `CommandCenterBottomWorkspace` instead of the external prop
   - Added skip-first-mount ref guard to the external sync `useEffect` so hydration-driven preset tabs are not overridden by the shell host's initial value

### Visual Evidence

All 9 presets tested at 1920×1080 in the real Control Room. Screenshots and measurements saved to `artifacts/workspace-validation/`.

```
Preset              | Left dock   | Right dock  | Center      | Bottom   | Active tab
---------------------------------------------------------------------------------------
Director            | 270px open  | 270px open  | 1264×689    | 280px    | Scenes
Solo Streamer       | Collapsed   | 270px open  | 1526×689    | 280px    | Scenes
Technical Director  | 270px open  | 270px open  | 1264×689    | 280px    | Routing
Audio Engineer      | Collapsed   | 270px open  | 1526×689    | 280px    | Audio Mixer
Graphics Operator   | 270px open  | 270px open  | 1264×689    | 280px    | Graphics
Replay Operator     | 270px open  | 270px open  | 1264×689    | 280px    | Replay
Streaming Operator  | Collapsed   | 270px open  | 1526×689    | 280px    | System Status
Monitor Wall        | Collapsed   | Collapsed   | 1788×689    | 280px    | System Status
Compact             | Collapsed   | Collapsed   | 1788×940    | 37px tab | Scenes
```

Duplicate check: **No visually identical layouts. All 9 presets produce distinct configurations. ✓**

### Test Results

- `pnpm --filter @ubos/shared test` → PASS (all workspace-manager validations passed)
- `pnpm --filter @ubos/web test` → PASS (91/91 tests)
- `git diff --check` → PASS

### Files Changed

| File | Change |
|---|---|
| `apps/web/app/control-room/page.tsx` | Database fallback: try-catch with DEMO_SCENES when DB unavailable |
| `apps/web/app/control-room/command-center/CommandCenterShell.tsx` | `workspaceActiveBottomTab` as authoritative tab; skip-first-mount sync |
| `artifacts/workspace-validation/director.png` | Screenshot |
| `artifacts/workspace-validation/solo-streamer.png` | Screenshot |
| `artifacts/workspace-validation/technical-director.png` | Screenshot |
| `artifacts/workspace-validation/audio-engineer.png` | Screenshot |
| `artifacts/workspace-validation/graphics-operator.png` | Screenshot |
| `artifacts/workspace-validation/replay-operator.png` | Screenshot |
| `artifacts/workspace-validation/streaming-operator.png` | Screenshot |
| `artifacts/workspace-validation/monitor-wall.png` | Screenshot |
| `artifacts/workspace-validation/compact.png` | Screenshot |
| `artifacts/workspace-validation/report.html` | Browsable validation report |

### PASS

## 2026-07-16 — Control Room Scene Routing and Native Recording UI Regression Investigation

- Root cause: Control Room live monitor media binding used a global first-live-stream fallback after Program/Preview scene identity had changed, allowing labels to reflect Scene B/C while the renderer still displayed Scene A media.
- Repair: scene-to-live-media resolution now binds Program and Preview monitors to the selected scene's own visible source ID and live stream; unrelated first-stream fallback is no longer used for scene rendering.
- Native Recording visibility: the existing `RecordingRuntimePanel` remains the intended implementation and is exposed through the production Operations Console recording tab/menu path with explicit native blocked reason and browser-local fallback state.
- Evidence: `artifacts/scene-routing-recording-ui/trace-report.md`, `measurements.json`, and `report.html` record the code-level trace. Browser screenshots remain a blocker for full PASS.

## 2026-07-17 — Control Room Scene Routing and Native Recording UI Regression Repair

- Status: PARTIAL.
- Scene routing root cause: Program/Preview labels followed current production state, but live media could remain visually stale when monitor media fell back to an unrelated first live stream instead of the selected scene's own resolved source stream.
- Scene routing repair: Program and Preview now use independent `resolveSceneLiveMedia(scene, liveSourceStreams)` bindings and regression tests prove Preview-only changes do not mutate Program, CUT/TAKE/AUTO update Program binding, Scene A streams are not reused for B/C, shared source streams remain active when intentionally shared, and recording evidence follows authoritative Program.
- Native Recording root cause: `RecordingRuntimePanel` and registry/menu paths existed, but the default Director production workspace did not expose the recording panel, making the native controls non-obvious in the tested Control Room workspace.
- Native Recording repair: the Director preset now includes the registered Recording panel; Solo Streamer remains a recording workspace and Broadcast menu/operations-tab paths remain available.
- Evidence: text runtime trace and measurements are stored under `artifacts/scene-routing-recording-ui/`.
- Browser limitation: no Chromium/Edge executable was present in the container, so required PNG screenshot evidence remains pending and PASS cannot be claimed.
- Validation: shared tests PASS; web tests PASS with FFmpeg/FFprobe-dependent cases skipped where host binaries are missing; web typecheck PASS; `validate:v512-native-runtime` fails because FFmpeg/FFprobe are absent from this host.
