# Audio Engine (Mixer & DSP Foundation)

Phase 2.9 adds a backend-independent audio engine for UBOS 2.0. The engine is intentionally implemented as a runtime abstraction and does not depend on a browser, FFmpeg process, OS audio API, VST host, AI model, echo canceller, or noise suppression stack.

## Mixer abstraction

`AudioMixer` owns channel registration, bus registration, routing, lifecycle state, MediaClock synchronization, runtime status events, and loudness events. `createAudioMixer` returns a deterministic in-memory mixer suitable for tests, demos, and future native/web/FFmpeg adapters.

Snapshots are serializable and explicitly declare `containsRuntimeHandles: false` and `containsMediaPayloads: false` so UI and orchestration layers can inspect state without owning sample payloads.

## Channels and controls

Each `AudioMixerChannel` is backed by an `AudioBuffer<AudioMixerInputFrame>` and includes per-channel controls:

- `gain`
- `mute`
- `solo`
- `pan`

The mixer supports multiple input channels. Solo has global precedence: if any channel is soloed, non-solo channels are excluded from the rendered bus mix.

## Output buses and routing

`AudioMixerBus` models an output destination such as program, monitor, recording, or mix-minus. `AudioMixerRoute` connects an input channel to an output bus with route gain and an enabled flag. A source can route to multiple buses, and a bus can receive many channels.

## DSP processor interfaces

Phase 2.9 defines processor contracts for:

- compressor
- limiter
- equalizer
- high-pass filter
- low-pass filter

The compressor and limiter include deterministic sample-domain foundations. EQ, high-pass, and low-pass processors expose stable interfaces as bypass processors for now, reserving coefficient-based filtering for a later backend implementation.

## Loudness monitoring

Every bus render produces a `LoudnessReading` with:

- peak
- RMS
- LUFS estimate
- clipping detection
- sample count

The mixer emits `levels_updated` events after each render so runtime observers can update meters without coupling to audio backend internals.

## Media runtime integration

The mixer consumes `AudioBuffer` instances from the audio decode foundation and aligns rendered output frames to `MediaClock` / `FrameScheduler` frame identity. Mixed output frames are metadata-only and include timing, bus identity, loudness, and payload exclusion flags.

## Demo

Run the synthetic-source mixer demo with:

```bash
pnpm media:mixer-demo
```

The demo creates two tone sources, routes them to a program bus, applies compressor and limiter processors, renders one buffer, and prints serializable mixer state and output metadata.

## Exclusions

Phase 2.9 deliberately does not include VST plugins, noise suppression, echo cancellation, or AI audio processing.
