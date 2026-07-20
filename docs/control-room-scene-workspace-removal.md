# Control Room scene-workspace removal

## Dependency map

`ControlRoomShell` was the sole production render entry point for
`apps/web/app/control-room/scene-workspace.tsx`. The workspace then owned the
entire command-center shell, production switching state, optimistic scene
copies, local-media `MediaStream` maps, browser video attachment, recording and
streaming state, media composition/runtime engines, workspace layout modes, and
operations panels.

Its effect and callback paths included localStorage workspace persistence,
interval clocks and recording timers, media-track lifecycle handlers, generated
source restoration, local-media IndexedDB persistence, audio analysis, native
runtime polling, and production graph/session synchronization. It also mounted
monitor renderer/compositor paths and workspace layout logic. This put DOM,
media runtime, and graph synchronization under one frequently updating React
owner.

## Root cause

The scene workspace combined render-critical Program/Preview monitors with
high-churn workspace persistence, capture lifecycle, timer, and runtime mirror
state. Updates unrelated to scene identity could rerender the same owner that
attached media and composed monitors. The removal prevents that ownership
coupling rather than attempting another feedback-loop fix.

## Replacement

`SceneControlAdapter` owns only a serializable snapshot: scenes, Program and
Preview IDs, and source summaries. It dispatches the existing
`updateProductionState` server command for preview staging and Program takes.
It has no effects, DOM measurement, resize observation, workspace persistence,
MediaStream state, or media attachment callback. `ScenePanel` uses scene-ID
keys and displays stable Program/Preview cards.

## Deleted/bypassed code

* Deleted `apps/web/app/control-room/scene-workspace.tsx`.
* Replaced the `ControlRoomShell` import and render path with
  `scene-control/SceneControlAdapter`.
* Replaced legacy static workspace assertions with adapter-boundary assertions.

MediaStream ownership remains outside this adapter: scene records contain only
source IDs and serializable settings, while media-capable runtime routes resolve
those IDs in their authoritative registry.

## Browser validation status

Browser validation remains blocked in this execution environment: no Chromium,
Chrome, or Firefox executable is installed, and the attempted Playwright
installation was rejected by the package registry policy (HTTP 403). No browser
stability claim, screenshot, console inspection, or 60-second idle observation
is made from this environment. The required manual validation is still to idle
the Control Room for 60 seconds, repeatedly stage/take scenes, add a local
media source, and record console plus Program/Preview mount counters.
