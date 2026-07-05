# Runtime Audio DSP & Mixing Runtime

Phase 22 introduces a deterministic, metadata-only audio runtime foundation for UBOS. The runtime manages executable session state for channels, buses, master controls, monitor selection, command queueing, snapshots, history, health, and metrics.

The package lives at `packages/shared/src/runtime-audio/` and intentionally does **not** perform DSP, decoding, Web Audio graph construction, FFmpeg work, WebRTC transport, recording, streaming, or hardware mixer integration.

## Adapter boundary

`AudioDSPAdapter` is the only boundary for future DSP engines. `NullAudioDSPAdapter` is the default and reports:

- Audio runtime unavailable
- No DSP engine connected
- Metering unavailable
- Metadata only

`WebAudioDSPAdapter` is a placeholder class only. It is not wired to real audio nodes.

## Deterministic state

Commands mutate plain serializable metadata for:

- audio channels
- buses and master bus
- mute and solo state
- gain metadata
- peak metadata as `null`
- meter unavailable flags
- monitor source
- queue, history, snapshots, health, and metrics

No fake meters, simulated signal levels, runtime handles, DOM nodes, audio nodes, streams, or adapter instances are stored in runtime state.

## Production graph safety

The runtime command schema rejects `runtimeHandle` and unsafe metadata values. Production Graph integrations should consume snapshots or metadata overlays only, never adapter objects or runtime handles.
