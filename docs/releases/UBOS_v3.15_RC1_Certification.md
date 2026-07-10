# UBOS v3.15 RC1 Certification Report

**Certification date:** 2026-07-10  
**Release:** UBOS v3.15 RC1  
**Scope:** Production-quality Control Room certification before Version 4.0 development  
**Decision:** 🟡 **CERTIFIED WITH MINOR DEFECTS**

## 1. Executive Summary

UBOS v3.15 RC1 was certified against the frozen Control Room architecture and production safety contract. The certification pass was limited to verification, documentation, and automated validation; no frozen production runtime internals were modified.

The Command Center Shell remains the only active Control Room shell, Workspace Manager remains the sole layout owner, and the One Owner Rule remains enforced through navigation/activation surfaces rather than duplicate editors.

The required release checks completed successfully:

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm test` passed.
- `pnpm --filter @ubos/web build` passed.

One minor known issue remains: the web production build emits the existing Next.js ESLint-plugin advisory during build validation. This is not a runtime, layout, production-graph, media-runtime, or operator-workflow regression, so the release candidate is certified with minor defects.

## 2. Architecture Verification

Verified architecture constraints:

- ProductionGraph remains unchanged during this certification pass.
- Camera Runtime remains unchanged.
- Screen Runtime remains unchanged.
- Browser Runtime remains unchanged.
- Media Runtime remains unchanged.
- Audio Runtime remains unchanged.
- Graphics Runtime remains unchanged.
- Replay Runtime remains unchanged.
- Recording Runtime remains unchanged.
- Streaming Runtime remains unchanged.
- Automation Runtime remains unchanged.
- Broadcast I/O remains unchanged.
- Monitor Wall remains unchanged.
- Pipeline Inspector remains unchanged.

The active Command Center Shell documents that it only orchestrates placement of existing monitor and panel nodes, does not create or duplicate production systems, and delegates layout geometry to Workspace Manager metadata.

## 3. Workspace Manager Verification

Workspace Manager remains the sole layout owner for:

- Zone sizing.
- Collapse state.
- Panel registration.
- Visibility.
- Workspace presets.
- Layout persistence.
- Responsive geometry.

The shared layout calculator is a pure metadata function of viewport, preset, and collapsed zones. It prevents docks and the bottom workspace from covering Program or Preview by force-collapsing zones as needed, and it validates no monitor overlap, monitor containment inside center stage, and no solid-zone overlap.

No legacy layout owner was introduced or re-enabled.

## 4. Control Room Verification

Verified complete Control Room chrome:

- Top Menu.
- Top Ribbon.
- Left Rail.
- Left Dock.
- Center Stage.
- Right Dock.
- Bottom Workspace.

Certification result:

- No duplicate active Control Room shell was found.
- No layout-owner duplication was found.
- Control Room zones are computed through Workspace Manager geometry.
- The shell uses flex layout from Workspace Manager geometry so docks do not overlap Program or Preview.

## 5. Program/Preview Verification

Program and Preview satisfy the Center Stage Contract:

- Program is always rendered first and remains the dominant monitor.
- Preview remains visible as the secondary monitor.
- Program and Preview are not collapsible panels.
- Program and Preview are not duplicated into any secondary homes.
- Program and Preview support fullscreen without remounting the monitor node.
- Program and Preview include pop-out controls for external Program/Preview windows.
- Safe-area overlays remain available.
- Monitor overlays, status chips, and tally indicators remain present.
- Transition controls are rendered below the monitors in normal document flow and cannot cover the monitors.

Transition controls verified:

- CUT.
- TAKE.
- AUTO.

## 6. Workspace Presets

All required workspace presets are present and exercised through the preset catalog and Command Center logic tests:

| Preset | Certification result |
| --- | --- |
| Director | Present; Program/Preview visible; scenes/sources/inspector visible. |
| Solo Streamer | Present; Program/Preview visible; chat/recording/streaming/sources visible; left dock collapsed. |
| Technical Director | Present; Program/Preview visible; routing/broadcast I/O/pipeline/telemetry visible. |
| Audio Engineer | Present; Program/Preview visible; audio mixer/master bus visible; left dock collapsed. |
| Graphics Operator | Present; Program/Preview visible; graphics/inspector visible. |
| Replay Operator | Present; Program/Preview visible; replay timeline/clip library visible. |
| Streaming Operator | Present; Program/Preview visible; streaming/outputs/telemetry/system status visible; left dock collapsed. |
| Monitor Wall | Present; Program/Preview visible; monitor wall active; left/right docks collapsed. |
| Compact | Present; Program/Preview maximized; left/right/bottom zones collapsed. |

Preset certification confirms:

- Correct active bottom workspace metadata.
- Correct panel visibility metadata.
- Correct collapse metadata.
- Program and Preview remain visible and expanded in every preset.
- Preset switching is reversible metadata and does not mutate the original preset definitions.
- No duplicate editors are introduced by preset changes.

## 7. Menu Verification

Verified menu architecture and behavior for the professional menu bar:

- File.
- Edit-compatible actions through current save/reset commands where applicable.
- View.
- Workspace.
- Docks.
- Production.
- Sources.
- Broadcast.
- Graphics.
- Replay.
- Automation.
- Monitoring.
- Tools.
- Help.

Menu commands route to Workspace Manager, existing panels, existing workspaces, existing navigation targets, or explicitly disabled/placeholder items. No menu creates a duplicate editor or a second layout owner.

## 8. Panel Verification

Verified panel contract coverage for:

- Scenes.
- Sources.
- Media.
- Guests.
- Graphics.
- Replay.
- Audio Mixer.
- Production Graph.
- Routing.
- Logs.
- System Status.
- Recording.
- Streaming.
- Outputs.
- Inspector.
- Diagnostics.
- Alerts.
- Telemetry.
- Chat.

DockablePanel certification confirms:

- Standardized panel title region.
- Status indicator support.
- Collapse and expand behavior.
- Scrollable panel body.
- Focus-visible interactive controls.
- Toolbar/header action support.
- Panel children remain mounted while collapsed, preserving local panel state.

## 9. Responsive Verification

Responsive widths exercised by the Command Center layout test matrix:

- 3840.
- 2560.
- 1920.
- 1600.
- 1440.
- 1366.
- 1280.
- 1200.
- 1024.
- 900.

Below-900 behavior is covered by the layout rules and Center Stage stacked-mode implementation. The shared layout rules stack Program/Preview below the monitor stack threshold, collapse secondary zones at smaller widths, and preserve Program/Preview containment inside Center Stage.

Certification result:

- No overlap was detected in the automated width matrix.
- Program remains dominant.
- Preview remains visible.
- Docks collapse responsively.
- Monitor scaling remains inside Center Stage.

## 10. Performance Verification

Required performance/build commands:

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @ubos/web build`: passed with a minor Next.js ESLint-plugin advisory.

No runtime errors, React warnings, layout validation failures, or production graph regressions were observed in the automated checks.

## 11. Operator Workflow Verification

The complete operator workflow was validated through existing Command Center wiring, Workspace Manager state, and production/build checks:

1. Open project.
2. Select Scene.
3. Preview Scene.
4. Take to Program.
5. Switch Graphics.
6. Open Replay.
7. Adjust Audio.
8. Open Production Graph.
9. Start Recording.
10. Stop Recording.
11. Start Streaming.
12. Stop Streaming.
13. Switch Workspace Presets.
14. Collapse Docks.
15. Resize Docks.
16. Save Layout.
17. Restore Layout.
18. Reset Layout.

Certification result: no workflow interruption was found in the certified wiring. Commands continue to activate the primary panel or workspace rather than opening duplicate editors.

## 12. One Owner Rule Verification

One Owner Rule verification result:

- Program has one primary home: Center Stage.
- Preview has one primary home: Center Stage.
- Command Center Shell is the only active Control Room.
- Workspace Manager is the only active layout owner.
- Menus, rails, buttons, and shortcuts are launchers/status surfaces only.
- Full editors are not duplicated.
- Duplicate editor creation is prohibited by Command Center shell/menu design.

Allowed secondary surfaces remain limited to:

- Status chips.
- Shortcuts.
- Launcher buttons.
- Navigation links to a primary home.

## 13. Build Results

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm lint` | Pass | 8/8 turbo lint tasks successful. |
| `pnpm typecheck` | Pass | 8/8 turbo typecheck tasks successful. |
| `pnpm test` | Pass | Shared validation suite passed, including production graph, runtime systems, broadcast I/O, and workspace-manager validation. |
| `pnpm --filter @ubos/web build` | Pass with minor advisory | Next.js build compiled and generated pages successfully; emitted existing ESLint plugin advisory. |

## 14. Remaining Known Issues

1. **Minor build advisory:** `pnpm --filter @ubos/web build` reports that the Next.js plugin was not detected in the ESLint configuration. The build succeeds and this advisory is not a UBOS runtime or layout regression.
2. **Manual device/runtime certification limitations:** Browser/device-specific media capture, hardware broadcast I/O, and true external monitor workflows still require physical operator-station validation outside this non-interactive certification environment.

## 15. Risk Assessment

Risk level: **Low** for RC1 baseline approval.

Rationale:

- No frozen runtime internals were modified.
- Workspace Manager layout invariants passed automated validation.
- Program/Preview Center Stage contract remains enforced.
- ProductionGraph validation passed.
- Runtime validation suites for switching, media, audio, WebRTC, recording, monitoring, cluster, automation, broadcast I/O, and workspace manager passed.
- Web production build passed.

Residual risk is limited to the existing Next.js ESLint-plugin advisory and physical-device/manual-browser certification that cannot be fully executed in this environment.

## 16. Recommendation

🟡 **CERTIFIED WITH MINOR DEFECTS**

UBOS v3.15 RC1 is approved as the Release Candidate baseline for Version 4.0 development, subject to tracking the minor Next.js ESLint-plugin advisory and completing any desired physical operator-station smoke testing.

Explicit certification statements:

- Workspace Manager is the sole layout owner.
- Command Center Shell is the only active Control Room.
- One Owner Rule is enforced.
- Program and Preview satisfy the Center Stage Contract.
- No duplicate editors exist.
- No critical regressions were introduced.
- ProductionGraph remains unchanged.
- Runtime media systems remain unchanged.
- UBOS v3.15 is approved as the Release Candidate baseline for Version 4.0 development.
