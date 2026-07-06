# UBOS 3.14 Unified Production Pipeline Smoke Test

UBOS 3.14 introduces a metadata-first Unified Production Pipeline that projects Camera, Screen, Media, Browser, Guest, Graphics, Replay, Audio Mixer, Recording, Streaming, Broadcast I/O, Automation, and Monitor Wall state from one shared `ProductionGraph`.

## Preconditions

- Install dependencies with `pnpm install`.
- Start the control room with `pnpm ubos:browser`.
- Open `/control-room`.

## Smoke-test checklist

1. Open the right Operations console and select **Inspector**.
2. Confirm **Unified Production Pipeline** is visible.
3. Confirm the panel shows:
   - graph revision
   - active inputs and outputs
   - audio routes and video routes
   - overlays
   - replay routes
   - recording route
   - streaming route
   - Broadcast I/O routes
   - Monitor Wall route
   - automation event count
   - health summary
4. Confirm Camera, Screen, Media, Browser, and Graphics sources from the scene workspace are represented as graph sources or overlays.
5. Confirm the seeded Program route, Preview route, Replay Buffer route, Recording route, Primary Stream route, SDI Program Out route, and Monitor Wall route are listed.
6. Confirm **Pipeline Warnings** uses friendly operator language if a route is missing, a source is disabled while routed, streaming lacks a destination, or recording lacks Program.
7. Confirm **Runtime handles** reads `Metadata only`; runtime-only objects such as `MediaStream`, `MediaRecorder`, `AudioContext`, WebRTC peer connections, sockets, DOM nodes, and iframe refs must not be stored in graph metadata.
8. Confirm **Pipeline Event History** includes graph initialization and the seeded automation readiness event.

## Validation commands

Run these before release:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Expected result

The Pipeline Inspector presents one coherent production state. Existing scene switching, graphics, replay, recording, streaming, Broadcast I/O, guests, automation, and monitor wall surfaces continue to operate while sharing the same `ProductionGraph`-derived pipeline model.
