# UBOS 3.6 Streaming Engine Smoke Test

This smoke test validates the Control Room Streaming panel while preserving UBOS's metadata-first architecture. Destination settings and streaming history are serializable metadata; runtime transports, FFmpeg processes, stream sockets, and native handles remain outside the production graph.

## Checklist

1. Open `/control-room` and select the right-side **Streaming** tab.
2. Choose a platform preset: YouTube, Twitch, Facebook, LinkedIn, or Custom RTMP.
3. Enter an RTMP/RTMPS server URL, stream key, resolution, bitrate, and audio bitrate.
4. Confirm the stream key input is masked and only a masked key preview appears.
5. Leave the RTMP URL blank and click **Start Streaming**; a friendly missing URL error should appear.
6. Enter an invalid URL and click **Start Streaming**; a friendly RTMP/RTMPS validation error should appear.
7. Enter a valid URL but leave stream key blank; a friendly missing key error should appear.
8. Enter a valid RTMP/RTMPS URL and stream key, then click **Start Streaming**. The lifecycle should move through `preparing`, `connecting`, and `streaming`.
9. Confirm the timer, bitrate estimate, and dropped-frame estimate update while streaming.
10. Confirm the browser limitation banner clearly says real RTMP transport requires backend/native FFmpeg support.
11. Click **Stop Streaming** and confirm a metadata history entry records platform, started time, stopped time, duration, final state, and failure reason if any.
12. Re-check Camera, Screen, Media, Browser, and Recording workflows from the previous smoke tests.

## Programmatic checks

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```
