# Control Room Scene Routing and Native Recording UI Trace

Status: PARTIAL_BROWSER_BLOCKED — code paths were repaired and regression tests pass, but this container still cannot execute Chromium/Edge. Required screenshots are not faked.

## Runtime root cause update

The previous code-only repair removed the unrelated global fallback, but it still did not guarantee three genuinely distinct live media sources in the local demo/runtime path. The default demo scenes included empty scenes or permission-gated camera/screen sources, so scene identity could change while there was no selected-scene-owned live stream to render. The repair now adds browser-generated canvas test-pattern streams for the three demo scenes and updates the media resolver to choose the selected scene's first active visible video source instead of stopping on an inactive permission-gated source.

## Native Recording visibility root cause

`RecordingRuntimePanel` and registry/menu paths existed, but the default Director production workspace did not include the recording panel in `visiblePanels`. The Director preset now exposes Recording without developer tools, and Solo Streamer remains a recording workspace.

## Scene → Source → Renderer ownership trace

Scene selection -> `stageScene(sceneId)` dispatches `SET_PREVIEW_SCENE` and persists `productionState.previewSceneId`.
Preview identity -> `productionState.previewSceneId` and `graph.preview.sceneId`.
Program identity -> `switchProgram()` dispatches CUT/AUTO/TAKE to `graph.program.sceneId` and persists `productionState.programSceneId`.
Scene source collection -> `programScene.sources` / `previewScene.sources`.
Source visibility and z-order -> `getVisibleLiveVideoSources()` filters visible unlocked camera/screen/media sources and sorts by z-index/order.
Media resolver -> `resolveSceneLiveMedia()` prefers the selected scene's first active live source stream; if none is active, it returns the scene-owned source with `stream: null` instead of borrowing another scene.
Generated demo media -> `createGeneratedTestPatternStream()` creates distinct red/green/blue A/B/C canvas MediaStreams for demo scenes and stores them in `liveSourceStreams[source.id]`.
LiveMediaMonitor props -> Program and Preview receive independent `stream`, `sourceId`, `sourceType`, `role`, and keyed video elements.
HTMLVideoElement binding -> `LiveMediaMonitor` assigns the current role's stream to `video.srcObject` and clears it during cleanup.
Recording route -> `createProgramRecordingStream()` captures `[data-ubos-program-monitor] video` first and falls back only to the currently resolved Program stream.

## Browser evidence blocker

Attempted to install/use a browser in this environment:

- `apt-get update && apt-get install -y chromium ffmpeg` failed with repository/proxy 403 responses.
- `pnpm exec playwright --version || npx playwright --version` failed because Playwright is not installed and registry access returned 403.
- Filesystem search found no existing Chromium/Chrome/Edge executable.

Therefore the required PNG screenshots remain pending for a host that actually has Chromium/Edge. No binary screenshots were fabricated.
