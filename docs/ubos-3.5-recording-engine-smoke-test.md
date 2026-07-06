# UBOS 3.5 Recording Engine Smoke Test

This smoke test validates browser-mode Program recording from the Control Room while preserving UBOS's metadata-first architecture. Recording state, timer, size estimate, file name, source type, timestamps, and history are stored as serializable UI metadata; runtime `MediaRecorder`, `MediaStream`, tracks, chunks, and object URLs remain in browser-only refs/state outside the production graph.

## Checklist

1. Open `/control-room` in a browser with `MediaRecorder` support.
2. Open the **Recording** operations tab and confirm the Program Recording panel shows `idle`.
3. Add/start a **Camera** source, take it to Program, click **Start Recording**, wait several seconds, then click **Stop Recording**.
4. Confirm state changes through `preparing`, `recording`, `stopping`, and `completed`; confirm the timer and file size estimate update.
5. Click **Download WebM** and confirm the downloaded WebM plays back with Program video and camera audio where the browser provided a mic track.
6. Add/start a **Screen** source with system/tab audio enabled where supported, take it to Program, and repeat the recording/download flow.
7. Add a **Media** video source that the browser can expose through video `captureStream()`, take it to Program, and repeat the recording/download flow.
8. Add a **Browser** source and take it to Program. If the page/iframe cannot expose a capturable video stream, confirm the Recording panel shows a friendly failure instead of a red console error; use screen capture as the supported fallback.
9. While recording, click **CUT**, **TAKE**, or **AUTO** and confirm the Control Room remains stable.
10. Stop the camera/screen/media source while recording and confirm recording stops cleanly and creates a history entry.
11. Attempt to click **Start Recording** while recording and confirm a second recording cannot start.
12. Confirm the history list includes filename, duration, started time, stopped time, source type, and file size.

## Expected limitations

Browser recording depends on browser capture APIs. Camera and screen sources record from their live `MediaStream` when tracks are available. Media elements may record when the browser supports `HTMLMediaElement.captureStream()`. Browser/iframe sources are subject to iframe, cross-origin, and browser capture restrictions; if unavailable, UBOS reports a clean failure and operators should record the source via screen capture.
