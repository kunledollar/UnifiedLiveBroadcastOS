# Phase 4 Professional Broadcast Studio — v0.4.0 Alpha Prep

UBOS v0.4.0 Alpha marks the Phase 4 Control Room checkpoint: **Professional Broadcast Studio**. This checkpoint is focused on release hardening after Broadcast UX Polish, not on new production features.

## Phase 4 Summary

Phase 4 turns `/control-room` into an operator-first broadcast workspace with:

- Program and Preview monitoring for the active broadcast scene stack.
- Production switcher controls for TAKE, CUT, AUTO/FADE, transition type, and duration.
- View modes for Dual View, Program Focus, Vertical Focus, Compact View, and Multiview.
- Workspace controls for panel visibility, collapsed panels, region sizing, presets, local save/restore, and reset.
- Sidecar operational panels for guest management, audio mixing, broadcast health, chat, and outputs.
- Multiview dashboard rendering for program, preview, source tiles, audio summary, and stream health.

## Control Room Operator Guide

### Load the Control Room

Open `/control-room` from the web app. The default workspace loads with Scenes, Sources, Program/Preview, Production Dock, and the right-side operator panels visible when available.

### Scene Selection and Program Flow

1. Select a scene in the Scenes panel to place it on Preview.
2. Confirm the Preview monitor shows the intended scene.
3. Move Preview to Program using one of the switcher actions:
   - **TAKE** uses the currently selected transition type.
   - **CUT** immediately places Preview on Program with zero duration.
   - **AUTO** performs the fade-style automatic transition.
4. Use Previous and Next to step Preview through the scene list without changing Program.

### Transitions

- Change **Transition** in the Production Switcher before TAKE/AUTO.
- Change **Duration** with the preset selector or custom millisecond input.
- CUT always uses a zero-duration transition.
- AUTO currently maps to the supported fade transition path.

### View Modes

Use the View selector in the center toolbar:

- **Dual View**: Program and Preview with a production-oriented split.
- **Program Focus**: larger Program monitor with smaller Preview.
- **Vertical Focus**: layout tuned for vertical content checks.
- **Compact View**: reduced monitor footprint for laptop operation.
- **Multiview**: dashboard with Program, Preview, routed source tiles, audio summary, and health summary.
- **Quad View**: visible as a planned disabled option and should not be treated as active release functionality.

### Workspace Panels and Regions

Use **Panel Visibility** to cycle each panel through:

1. Expanded
2. Collapsed
3. Hidden

Use the range controls to resize:

- Left sidebar width
- Center workspace minimum width
- Production dock height
- Right sidebar width

Use the **Workspace** menu to:

- Apply a preset.
- Save the current local workspace.
- Restore the last local workspace.
- Reset to the factory default workspace.

## Keyboard Shortcut Reference

| Shortcut | Behavior                                                   |
| -------- | ---------------------------------------------------------- |
| Space    | TAKE with the currently selected transition type           |
| C        | CUT Preview to Program                                     |
| A        | AUTO using the fade transition path                        |
| F        | FADE Preview to Program                                    |
| 1–9      | Stage the matching scene number on Preview                 |
| M        | Mute the selected route when a selected route is available |

Shortcut handling intentionally ignores input fields, textareas, selects, and content-editable controls so operators can type safely in forms.

## Workspace and Preset Behavior Notes

Workspace state is stored in browser `localStorage` only. No backend persistence is included for this alpha checkpoint.

Persisted workspace state includes:

- Selected preset
- Current view mode
- Panel expanded/collapsed/hidden state
- Left, center, right, and dock sizing values

The Control Room also keeps a legacy view-mode storage key for compatibility. When a saved workspace is present, the workspace value takes precedence; otherwise, the legacy view-mode value can seed the initial view.

If stored workspace JSON is malformed or missing fields, the Control Room falls back to normalized defaults and removes invalid stored workspace data.

## Release Checklist

- [x] Lint passed with `pnpm lint`.
- [x] Typecheck passed with `pnpm typecheck`.
- [x] Build passed with `pnpm build`.
- [x] Control Room smoke tested for load, view mode switching, scene staging, and switcher controls.
- [x] Workspace persistence tested for panel visibility, collapsed panels, sizes, selected preset, save, restore, and reset.
- [x] Multiview render path tested through the Control Room Multiview view mode.
- [x] Guest Manager, Audio Mixer, and Health Center render paths verified during Control Room review.

## Known Limitations

- Workspace persistence is browser-local and does not roam between devices or users.
- AUTO currently uses the supported fade transition path.
- Quad View remains a disabled planned option.
- Route muting by keyboard requires a selected route to be available in UI state.
- The smoke test is an alpha readiness workflow check, not a full automated end-to-end browser test suite.
