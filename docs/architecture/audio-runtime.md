# Phase 9.5 Professional Audio Mixing Runtime

The Audio Runtime is a supervised execution-plane service for live audio. It preserves the Production Graph as metadata only: graph state stores channel IDs, bus IDs, routing metadata, effect settings, replay records, and diagnostics, while browser objects such as `AudioContext`, `AudioNode`, `MediaStream`, `MediaStreamTrack`, buffers, handles, and PCM samples are runtime-owned and never serialized.

## Architecture

`AudioRuntime` owns the supervised lifecycle and exposes `AudioMixer`, `AudioMonitor`, `AudioStatisticsRuntime`, `AudioHealthRuntime`, `AudioRecovery`, and `AudioValidator`. `AudioMixer` creates immutable `AudioSession` snapshots containing metadata-only buses, channels, routes, effects, meters, mix-minus targets, and replay events.

Feature flags `UBOS_ENABLE_REAL_AUDIO=true` or `NEXT_PUBLIC_UBOS_REAL_AUDIO=true` enable real runtime mode. Without those flags, sessions remain in mock mode so existing test and development flows continue to run without browser audio objects.

## Bus model

The default professional bus set is:

- Master Bus
- Program Bus
- Preview Bus
- Monitor Bus
- Guest Bus
- Operator Bus
- Aux Bus
- Recording Bus
- Streaming Bus

Buses are metadata records with gain, delay, protection status, effects, meters, and route IDs. Program, master, and monitor buses are protected from unsafe loops.

## Mixer

Channel strips support mute, solo, gain, balance, trim, pan, delay, phase, and invert metadata. Supported effects are noise gate, compressor, limiter, EQ, high pass, low pass, delay, expander, and ducker. Runtime implementations may map these metadata records to Web Audio nodes, but those nodes stay inside the runtime and do not enter graph or replay state.

## Mix-minus

`MixMinusManager` creates host, guest, operator, and remote contributor return feeds. Its automatic routing excludes the target source from its own return bus, enforcing no-echo behavior while keeping routing metadata deterministic and replayable.

## Synchronization

Audio sessions store per-source and bus delay metadata for video sync, delay alignment, frame synchronization, and clock integration. The runtime applies those values against the shared timing model while replay stores only delay changes and target IDs.

## Replay

Replay records include gain changes, mute and solo changes, bus routing, delay changes, and effect metadata. Replay records explicitly mark `containsRuntimeHandles: false`; browser audio objects, samples, buffers, streams, tracks, and handles are never replayed.

## Supervisor

`AudioRuntime` registers an `audio-runtime` subsystem with the Runtime Supervisor. The supervisor owns mixer lifecycle, buses, channels, effects, recovery, health, and diagnostics status in the same failure model used by WebRTC, Recording, Streaming, Browser Renderer, and other media-plane runtimes.

## Failure model

`AudioRecovery` maps runtime errors to UBOS failure records with `runtimeSupervised: true` and `graphMutationAllowed: false`. Recoverable audio failures degrade the runtime without mutating the Production Graph.

## Backpressure

`AudioStatisticsRuntime` tracks channel count, route count, queued effect changes, processing load, diagnostics throttling, and prioritized buses. Program and master buses are prioritized; diagnostics are throttled and effect changes can be queued when processing load rises.

## Security

`AudioValidator` validates route endpoints, rejects circular routes, rejects invalid gain ranges, and protects monitor/program/master buses from invalid loops. This prevents malformed control-room actions from creating unsafe audio feedback paths.
