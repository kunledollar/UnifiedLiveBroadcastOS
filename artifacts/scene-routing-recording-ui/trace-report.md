# Control Room Scene Routing and Native Recording UI Trace

Status: PARTIAL — code and regression tests pass locally, but this container has no Chromium/Edge executable for the required screenshot evidence.

## Root causes

1. Scene routing: the regression signature is stale fallback media. Scene labels were driven by current Program/Preview state, while live media could fall back to the first active stream instead of the selected scene's resolved source stream. The repaired path resolves Program and Preview independently from each scene's visible source IDs and returns `null` rather than borrowing Scene A media when the selected scene has no live stream.
2. Native Recording UI: `RecordingRuntimePanel` and right-dock/menu registry entries existed, but the default Director production workspace did not expose the recording panel. Operators starting in the default Control Room could miss Native Recording even though Solo Streamer and Broadcast menu paths existed.

## Ownership trace

Scene selection -> `stageScene(sceneId)` dispatches `SET_PREVIEW_SCENE` and persists `productionState.previewSceneId`.
Preview identity -> `productionState.previewSceneId` and `graph.preview.sceneId`.
Program identity -> `switchProgram()` dispatches CUT/AUTO/TAKE to `graph.program.sceneId` and persists `productionState.programSceneId`.
Scene sources -> `programScene.sources` and `previewScene.sources` sorted by scene selection.
Source registry -> `liveSourceStreams[source.id]` maps source IDs to retained MediaStreams.
Visibility/z-order -> `getFirstVisibleLiveVideoSource()` requires visible, unlocked camera/screen/media source; Program/Preview compositor overlays continue to use scene-specific graphics/media composition.
Renderer -> `LiveMediaMonitor` assigns the current role's resolved stream to its own video element and clears it on cleanup.
Recording route -> `createProgramRecordingStream()` captures `[data-ubos-program-monitor] video` first, then falls back only to the currently resolved Program stream.

## Runtime evidence schema

The Control Room embeds `#ubos-scene-routing-evidence` JSON with Program scene ID, Preview scene ID, Program resolved source IDs, Preview resolved source IDs, stream IDs, shared-stream flag, and panel visibility state.

## Browser screenshots

Not captured in this container: no Chromium/Edge executable was available. Required filenames were intentionally not faked.
