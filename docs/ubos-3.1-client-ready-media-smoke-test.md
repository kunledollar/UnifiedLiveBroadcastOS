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
