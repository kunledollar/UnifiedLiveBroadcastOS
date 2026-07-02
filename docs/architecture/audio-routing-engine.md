# Audio Routing Engine Foundation

Phase 6.5 adds a renderer-neutral Audio Routing Engine to the Media Execution Plane. It models how graph-referenced audio sources flow into program, stream, recording, monitor, headphone, guest-return, IFB, aux, isolated-recording, and external targets without creating Web Audio nodes, FFmpeg filter graphs, device routes, samples, tracks, or `MediaStream` objects.

## Relationship to the Production Graph

The Production Graph remains the canonical state for audio channel IDs, source IDs, guest IDs, mute state, and gain values. Audio routing reads those IDs and emits a derived `AudioRoutePlan`. Persistent graph state stores references only; real audio samples, browser tracks, and streams are intentionally excluded.

## Relationship to the Audio Mixer UI

The existing Audio Mixer UI continues to own operator-facing mixing controls. Phase 6.5 does not change mixer behavior. The route planner preserves channel mute and gain values as declarative route fields so future execution adapters can consume them consistently.

## Route Model

An `AudioRoute` contains source identity, source type, target, target id, bus id, enabled/muted/solo flags, gain, pan, monitor enablement, mix-minus flag, priority, lifecycle status, timestamps, graph revision, and metadata. Supported source types include host mic, guest mic, system audio, media audio, browser audio, music bed, screen audio, remote audio, and placeholder. Supported route targets include program mix, stream mix, recording mix, monitor mix, headphone mix, guest return, IFB, aux, isolated recording, and external.

## Bus and Mix Model

`AudioBus` describes logical buses for program, stream, recording, monitor, headphone, guest return, IFB, and aux. Each bus has a label, enabled/muted state, master gain, limiter placeholder, meter placeholder, route IDs, and metadata. `AudioMix`, `AudioSend`, `AudioReturn`, and `AudioMonitor` provide future adapter-facing views over buses and routes. No DSP is performed.

## Planner

`createAudioRoutePlan(graph, options)` deterministically inspects Production Graph audio channels, guest sources, standalone audio-capable sources, recording state, destinations, and optional planner flags. It generates default program routes, stream routes, recording placeholders, monitor/headphone placeholders, and guest return routes. Route IDs are stable, and warnings are returned instead of thrown.

## Mix-Minus

Guest returns use mix-minus modeling. `createMixMinusForGuest()` creates an `AudioReturn` that excludes the guest's own source IDs. `getSourcesExcludedFromReturn()` lists excluded source IDs, and `validateMixMinusRoute()` warns when a route would feed a guest source back into that guest's return.

## Validation and Lifecycle

Validation helpers detect missing sources, missing buses, invalid gain/pan, duplicate routes, muted sources routed to active buses, feedback risk, missing guest returns, and unsupported targets. Lifecycle helpers only update route state: activate, deactivate, mute, unmute, solo, unsolo, fail, and unavailable.

## Media Execution Integration

The Media Execution Plane recognizes audio routing intents such as `BUILD_AUDIO_ROUTE_PLAN`, `UPDATE_AUDIO_ROUTE`, `ACTIVATE_AUDIO_ROUTE`, `DEACTIVATE_AUDIO_ROUTE`, `MUTE_AUDIO_ROUTE`, `UNMUTE_AUDIO_ROUTE`, `SET_AUDIO_ROUTE_GAIN`, and mix builders for program, stream, recording, monitor, and guest returns. The mock adapter builds and validates route plans, stores them in `AudioRouteStore`, and returns structured warnings/errors.

## Inspector

The developer Media Execution Inspector includes a compact Audio Routing section with bus counts, active routes, muted routes, soloed routes, guest returns, mix-minus status, warnings, and latest audio route revision. It is intentionally developer-facing and does not clutter the main Control Room.

## Future Integration

Future Web Audio support can translate route plans into browser node graphs. Future FFmpeg support can translate route plans into filter graphs for recording and streaming. Future output adapters can map the same declarative routes to RTMP/SRT/NDI, Dante/AES67, guest IFB, isolated recording, or monitoring devices without changing Production Graph state.

## Known Limitations

- No real audio processing or metering is implemented.
- Limiter and meter state are placeholders.
- Recording, streaming, IFB, aux, isolated-recording, and external outputs are declarative only.
- Route plans are in memory and derived from current graph state.
- Mix-minus validation is conservative and warning-only.
