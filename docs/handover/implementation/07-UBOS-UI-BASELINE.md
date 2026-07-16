
```

This file protects the approved Control Room from accidental redesign while Cursor, Codex, or another engineering team completes the runtime wiring.

Paste this into the file:

````markdown
# UBOS UI Baseline

## Document Status

Document ID: 07  
Document Name: UBOS UI Baseline  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering  

---

# 1. Purpose

This document defines the approved user-interface baseline for the Unified Broadcast Operating System.

Its purpose is to prevent accidental redesign, layout drift, duplicate controls, misleading interfaces, and unrelated visual changes while engineers complete runtime integration.

The Control Room is the primary operator workspace.

Future development must improve behavior without destabilizing the approved operator layout.

---

# 2. UI Principle

The UBOS interface must always reflect operational truth.

A control may be:

- enabled and functional;
- enabled and pending;
- disabled with an exact reason;
- hidden because the capability is unavailable;
- removed because it is dead.

No visible enabled control may silently do nothing.

No status indicator may imply real media execution when only metadata or simulation exists.

---

# 3. Approved Primary Workspace

The approved Control Room contains these major regions:

1. Program monitor.
2. Preview monitor.
3. Source area.
4. Scene area.
5. Transition controls.
6. Graphics controls.
7. Audio controls.
8. Recording controls.
9. Streaming and output controls.
10. Runtime and system status.
11. Operator navigation.
12. Production command area.

These regions form the core operator workflow and must remain recognizable across future versions.

---

# 4. Protected Control Room Regions

## 4.1 Program Monitor

Purpose:

Display the authoritative output currently intended for recording and distribution.

The Program monitor must:

- remain visually prominent;
- clearly identify itself as Program;
- display the current active scene or source;
- show truthful live, simulated, stale, disconnected, or unavailable state;
- never display Preview state as Program;
- expose tally and output status where supported.

Protected behavior:

- Do not move Program into a secondary or hidden panel.
- Do not reduce it to an insignificant size.
- Do not rename it without explicit approval.
- Do not show synthetic output without a visible label.

---

## 4.2 Preview Monitor

Purpose:

Display the next scene, source, or composition before it is taken to Program.

The Preview monitor must:

- remain separate from Program;
- clearly identify itself as Preview;
- support source and scene preparation;
- show transition readiness;
- remain isolated from active recording and streaming until taken.

Protected behavior:

- Do not merge Preview and Program into one ambiguous monitor.
- Do not allow Preview state to appear as live output.
- Do not remove operator confirmation before Program changes unless automation explicitly owns the action.

---

## 4.3 Source Area

Purpose:

Allow operators to discover, add, inspect, preview, and manage available production inputs.

Expected source categories include:

- camera;
- microphone;
- screen;
- browser;
- file;
- image;
- remote guest;
- RTMP;
- RTMPS;
- SRT;
- WebRTC;
- NDI;
- social or remote contribution connectors.

The Source area must:

- show source identity;
- show source type;
- show health;
- show connection state;
- distinguish real, simulated, offline, and unavailable sources;
- provide a clear path to Preview or scene placement.

Protected behavior:

- Do not hide sources behind unrelated dashboards.
- Do not present unsupported source types as available.
- Do not create duplicate source panels.

---

## 4.4 Scene Area

Purpose:

Allow operators to select and manage production compositions.

The Scene area must:

- display available scenes;
- show active Program scene;
- show active Preview scene;
- support selection;
- support creation where implemented;
- show unavailable or invalid scenes truthfully.

Protected behavior:

- Do not remove clear Program and Preview scene indicators.
- Do not move scene switching into a separate unrelated workspace without approval.
- Do not allow scene controls to silently modify Program.

---

## 4.5 Transition Controls

Purpose:

Control how Preview becomes Program.

Expected controls include:

- CUT;
- AUTO;
- transition type;
- transition duration;
- transition progress;
- transition status.

The transition area should remain visually located between or near Program and Preview when practical.

Protected behavior:

- CUT and AUTO must remain easy to reach.
- Do not duplicate transition controls in several panels.
- Do not enable unsupported transitions.
- Do not display successful transition state unless Program actually changes.

---

## 4.6 Graphics Controls

Purpose:

Prepare, take, and clear titles, lower thirds, overlays, tickers, polls, logos, and other visual elements.

The graphics area must:

- distinguish prepared, Preview, and Program graphics;
- support take and clear;
- show rendering backend classification;
- expose errors;
- avoid implying final-output rendering unless verified.

Protected behavior:

- Do not remove existing graphics workflow.
- Do not create duplicate graphics engines in the UI.
- Do not claim a graphic is on-air if only metadata changed.

---

## 4.7 Audio Controls

Purpose:

Control Program audio.

Expected controls include:

- source selection;
- routing;
- mute;
- gain;
- meter;
- Program mix;
- monitor state.

The audio area must:

- distinguish real and synthetic meters;
- show disconnected devices;
- show whether gain and mute affect actual audio;
- expose degraded or unavailable state.

Protected behavior:

- Do not show synthetic meters as real.
- Do not enable gain or mute controls unless they affect authoritative audio.
- Do not hide critical audio failure.

---

## 4.8 Recording Controls

Purpose:

Start and stop browser or native recording and expose the resulting artifact.

The recording area must:

- distinguish browser recording from native recording;
- show readiness;
- show exact blockers;
- show preparing, recording, stopping, finalizing, verified, and failed states;
- show artifact path or access action;
- show duration, size, codecs, and verification result where available.

Protected behavior:

- Do not claim recording success without a playable artifact.
- Do not hide browser fallback.
- Do not enable native recording when prerequisites are not satisfied.

---

## 4.9 Streaming and Output Controls

Purpose:

Configure and manage live destinations.

The output area must:

- show each destination separately;
- show platform or transport type;
- show URL or destination identity without exposing secrets;
- show readiness;
- show connecting, live, reconnecting, degraded, failed, and stopped states;
- show real bitrate and dropped-frame metrics where available;
- support stop-one and stop-all when multi-output exists.

Protected behavior:

- Do not show generic `streaming` state without real transport.
- Do not expose stream keys.
- Do not allow one failed destination to hide the status of others.
- Do not permanently hard-disable controls when dynamic readiness can be evaluated.
- Do not enable controls before the runtime is ready.

---

## 4.10 Runtime and System Status

Purpose:

Show whether the execution environment is ready.

Expected status includes:

- browser runtime;
- API runtime;
- native runtime;
- FFmpeg;
- FFprobe;
- Program media;
- audio;
- recording path;
- output adapters;
- connector health.

The UI must show exact unavailable reasons.

Examples:

```text
FFmpeg not detected by server runtime.
Program media is not available.
RTMP destination is invalid.
Secret reference is missing.
Audio input is disconnected.
````

Protected behavior:

* Do not use vague labels such as `Not Ready` when a specific cause is known.
* Do not display healthy state from stale data.
* Do not hide degraded dependencies.

---

## 4.11 Navigation

The primary navigation must lead only to valid operator-relevant routes.

Every visible navigation item must:

* resolve to an existing route;
* load without error;
* have a real product purpose;
* expose truthful state;
* be enabled only when usable.

Unavailable routes should be hidden or disabled with a reason.

Dead routes should be removed.

Protected behavior:

* Do not add speculative menu items.
* Do not create placeholder pages for unimplemented systems.
* Do not expose routes that lead nowhere.
* Do not rename established navigation terminology without approval.

---

# 5. Approved Operator Workflow

The UI must support this sequence without forcing the operator to navigate through unrelated areas:

```text
Select or add source
→ assign source to scene
→ load scene into Preview
→ take Preview to Program
→ add or clear graphics
→ control Program audio
→ start or stop recording
→ configure and start outputs
→ monitor destinations
→ view unified chat
→ stop safely
```

The interface should optimize for this workflow.

Any UI change that makes this sequence harder requires explicit review.

---

# 6. Capability State Presentation

Every visible feature must identify its real status.

Approved presentation states:

* LIVE_BROWSER;
* LIVE_NATIVE;
* SIMULATED;
* METADATA_ONLY;
* PARTIALLY_WIRED;
* UNAVAILABLE;
* DEAD;
* STALE;
* UNKNOWN.

Recommended user-facing labels may be simplified, but the underlying classification must remain accurate.

Examples:

| Internal Status | Suggested UI Label |
| --------------- | ------------------ |
| LIVE_BROWSER    | Browser Live       |
| LIVE_NATIVE     | Native Live        |
| SIMULATED       | Simulation         |
| METADATA_ONLY   | Configuration Only |
| PARTIALLY_WIRED | Limited            |
| UNAVAILABLE     | Unavailable        |
| STALE           | Status Stale       |
| UNKNOWN         | Unknown            |

---

# 7. Allowed UI Changes

The following changes are allowed when required by implementation:

* dynamic readiness;
* exact error messages;
* pending state;
* progress indicators;
* runtime health;
* artifact details;
* destination status;
* connector status;
* simulation labels;
* disabled reasons;
* safe confirmation dialogs;
* accessibility improvements;
* responsive fixes;
* wiring existing controls;
* removing dead controls.

---

# 8. Changes Requiring Explicit Approval

The following require approval before implementation:

* moving Program or Preview;
* changing the primary Control Room grid;
* replacing existing navigation;
* renaming major production concepts;
* moving CUT or AUTO away from the switching area;
* removing source or scene panels;
* creating a new primary operator workspace;
* replacing the design system;
* changing the overall visual hierarchy;
* major responsive redesign;
* introducing a completely new menu structure.

---

# 9. Prohibited UI Changes

Engineering agents must not:

* redesign the Control Room while fixing runtime issues;
* add decorative dashboards unrelated to the current milestone;
* add duplicate recording or streaming panels;
* add placeholder pages;
* enable controls without a working execution path;
* hide failures;
* display fake health;
* show fake bitrate;
* show fake dropped frames;
* present simulation as production;
* expose secrets;
* remove browser fallback before native parity exists;
* modify unrelated styles during backend work.

---

# 10. UI Regression Protection

The repository should maintain structural or screenshot regression checks for:

* Program monitor;
* Preview monitor;
* source area;
* scene area;
* transition controls;
* graphics area;
* audio area;
* recording area;
* streaming area;
* navigation;
* runtime status.

The regression test should fail when a protected region is removed, renamed, or structurally displaced without an approved baseline update.

---

# 11. Screenshot Baseline Procedure

Approved screenshots should eventually be stored under:

```text
docs/handover/ui-baseline/
```

Recommended views:

* desktop 1920×1080;
* desktop 1440×900;
* laptop 1366×768;
* tablet landscape where supported;
* Control Room idle;
* Control Room with source selected;
* Preview active;
* Program active;
* recording active;
* streaming active;
* degraded runtime;
* unified chat active.

Each screenshot should include:

* date;
* commit hash;
* viewport;
* purpose;
* approval status.

---

# 12. UI Change Review Checklist

Before merging a UI change, confirm:

* Does the existing operator workflow remain intact?
* Does Program remain authoritative?
* Is Preview clearly separate?
* Are CUT and AUTO easy to reach?
* Are controls truthfully enabled or disabled?
* Are errors specific?
* Are secrets protected?
* Are simulation and metadata-only states labeled?
* Are dead routes removed?
* Are active routes valid?
* Did the change affect unrelated layout?
* Did regression tests pass?

---

# 13. Current Baseline Status

At the time of this document version:

* the Control Room is considered the approved operator workspace;
* Program and Preview must remain prominent;
* source and scene workflows must remain available;
* transition controls must remain central;
* browser recording fallback must remain visible;
* native recording and streaming controls may be dynamically enabled only when real prerequisites are satisfied;
* unsupported routes must remain hidden or disabled;
* broad redesign is prohibited during runtime wiring.
* the Workspace Manager (`useCommandCenterWorkspace`) is the single authoritative owner of preset selection, zone geometry, panel visibility, save/reset/lock state, ribbon badge, and menu checkmarks;
* all 9 presets (Director, Solo Streamer, Technical Director, Audio Engineer, Graphics Operator, Replay Operator, Streaming Operator, Monitor Wall, Compact) must produce visibly distinct layouts on selection;
* Reset Layout restores factory defaults for the CURRENT preset only; it does not switch to Director and is not blocked by Lock;
* Save Layout writes an isolated per-preset record; saving one preset must not overwrite another;
* Lock prevents manual drag-resize only; it must not block preset switching, Save, or Reset;
* each preset declares `zoneSizeDefaults` which the layout engine applies as lower-priority defaults (operator drag-resize always wins; responsive compact-width safety rule at 1200–1439px always wins);
* Program and Preview monitors use flex sizing with modest minimums (320px/240px) so emphasis (`balanced`, `program`, `preview`) produces visible proportional differences at all supported desktop viewports;
* at a 1536×960 viewport, presets must show materially distinct zone geometry — not only different labels or active tabs.

---

# 14. Summary

The UBOS interface is not an experimental design surface.

It is the operator cockpit for a professional live-production platform.

Future engineers should improve truth, reliability, accessibility, and runtime integration without destabilizing the established workflow.

The guiding rule is:

> Wire the product before redesigning the product.

````

After saving:



