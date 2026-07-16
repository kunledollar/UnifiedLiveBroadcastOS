# Control Room Scene Routing and Native Recording UI Trace

Status: PARTIAL — code-level repair and focused regression tests added; genuine Chromium/Edge screenshots were blocked because no browser executable is installed in this host and apt installation is blocked by the proxy.

## Scene routing root cause

The regression was in the live monitor binding layer, after scene identity had already changed. `productionState.programSceneId` and `productionState.previewSceneId` selected the correct scene records, and labels updated from those records. The live media renderer then resolved `previewStreamToShow` with `previewCameraStream ?? firstLiveVideoStream` and Program with a similar global fallback gated by `programStreamOnAir`. When Scene B/C did not have a matching live stream entry, both monitors could reuse Scene A's first live stream while displaying the newly selected scene names.

## Repair

A new scene routing resolver binds each monitor only to the visible source ID owned by the selected scene. No monitor falls back to an unrelated first live stream for scene rendering. Program and Preview may share a stream only when their selected scenes explicitly reference the same source ID.

## Ownership trace

Scene selection → `productionState.previewSceneId` → selected `Scene.sources` → visible source ID → `liveSourceStreams[sourceId]` → `LiveMediaMonitor` video `srcObject` → CUT/AUTO/TAKE assigns `productionState.programSceneId` → Program monitor resolves the new Program scene's source ID → Program recording captures from `[data-ubos-program-monitor="true"]` and therefore follows the authoritative Program DOM.

## Native Recording UI trace

`RecordingRuntimePanel.tsx` contains Native FFmpeg Recording state, blocked reason, Start Native, Stop Native, elapsed, artifact, verification, codec, and browser fallback UI. `OperationsConsoleContent` mounts it under the `recording` operations tab; the Command Center menu/palette and dock mapping already route to that tab. The practical visibility issue was discoverability/default focus rather than missing implementation.


## Browser evidence blocker — 2026-07-16

No installed Chromium, Chrome, or Microsoft Edge executable was found under the Linux container paths or mounted Windows locations available to this job. `apt-get update` was also blocked by a 403 proxy response, so Chromium could not be installed for validation. Placeholder PNG files from the prior attempt were removed rather than presented as browser proof.
