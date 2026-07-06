# UBOS 3.1 Client-Ready Media Smoke Test

UBOS 3.1 adds a minimal real browser media path while preserving the metadata-first production graph and scene/source model.

## What works in the browser

- Add a **Camera** source from the Control Room **Sources** panel.
- UBOS requests browser camera and microphone access with `navigator.mediaDevices.getUserMedia`.
- The selected preview scene displays the live camera stream in **Preview**.
- Press **Take**, **Cut**, or **Auto** to move the preview scene to **Program**; when the program scene contains the camera source, Program displays the same live camera stream.
- The **Smoke** right-side panel shows microphone level from the captured audio track.
- The **Smoke** panel can start/stop a browser `MediaRecorder` session and download a recorded `.webm` file when supported by the browser.

## Smoke-test checklist

Open `/control-room`, select the **Sources** tab, add a **Camera** source, allow camera/microphone permissions, then open the right-side **Smoke** tab.

Checklist statuses:

1. Camera active
2. Microphone active
3. Preview visible
4. Program visible
5. Audio meter moving
6. Recording works
7. No console errors

## Streaming note

RTMP streaming remains unavailable in the browser-only smoke test. UBOS labels RTMP/streaming as not configured until a real streaming backend or output service is connected.

## Architecture note

The browser media stream is intentionally a runtime handle held in the client component. Scene and source records remain metadata-first: camera sources are still represented as UBOS scene-source metadata, while the actual `MediaStream` stays local to the browser runtime.

## UBOS 3.2 Screen Capture workflow

UBOS 3.2 adds production-grade browser display capture to the same client-ready runtime path used by camera sources while keeping the Production Graph metadata-only.

1. Open `/control-room`, select the **Sources** tab, and click **+ Screen**.
2. The browser permission picker should appear. Choose **Entire Screen**, **Window**, or **Browser Tab**. Chrome, Edge, and Firefox expose these choices through their native `navigator.mediaDevices.getDisplayMedia()` dialog.
3. Allow tab/browser audio when the picker offers it. UBOS stores only source metadata in scene state; the live `MediaStream` remains in local runtime state.
4. The selected display appears in **Preview** with a **SCREEN LIVE** badge.
5. Press **CUT**, **TAKE**, or **AUTO**. Program displays the same display-capture stream when the preview scene is promoted.
6. If display audio is available, the Smoke audio meter should move.
7. Stop sharing from the browser sharing indicator. UBOS detects ended display tracks, removes the runtime stream handle, and changes the source to **Offline**.
8. Delete the screen source. UBOS stops all tracks for that source so no display-capture `MediaStream` leaks.

Updated checklist additions:

8. **+ Screen** opens the display-capture permission dialog.
9. Entire Screen, Window, and Browser Tab selections preview correctly.
10. Program receives the screen source after CUT, TAKE, and AUTO.
11. Screen/tab audio meters when the browser provides an audio track.
12. Stopping sharing changes the source to Offline.
13. Deleting the source stops capture tracks and leaves no console errors.
