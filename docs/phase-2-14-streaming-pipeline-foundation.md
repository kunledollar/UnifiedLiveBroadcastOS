# UBOS 2.0 Phase 2.14 – Streaming Pipeline Foundation

Phase 2.14 introduces a backend-independent streaming subsystem for publishing synchronized Program video and AudioMixer output to network destinations while keeping the production graph metadata-first.

## Scope

Implemented:

- `StreamingPipelineV2` abstraction via `createStreamingPipeline`.
- `StreamingSession` metadata model.
- Destination models for RTMP, RTMPS, and custom endpoint placeholders.
- Provider models for YouTube, Twitch, Facebook, LinkedIn, TikTok, and custom endpoints.
- Lifecycle states: `idle`, `preparing`, `connecting`, `streaming`, `reconnecting`, `stopped`, and `failed`.
- Runtime event emission for session creation, preparation, connection, streaming, frame publishing, reconnect, stop, and failure.
- Metadata tracking for bitrate, dropped frames, reconnect count, stream duration, latency estimate, video frame count, and audio sample count.
- Integration bindings for `ProgramOutput`, `AudioMixer`, `MediaClock`, and `FrameScheduler`.
- Demo streaming session helper.

Not implemented yet:

- Real RTMP/RTMPS transmission.
- SRT or RIST transports.
- Adaptive bitrate.
- Authentication flows.
- Multistreaming.

## Architecture

The Phase 2.14 foundation is metadata-only. A `StreamingSession` stores source identities, destination metadata, timing snapshots, and counters. It does not store runtime sockets, process handles, media payloads, encoded packets, stream keys, or authentication tokens.

The backend descriptor explicitly advertises its current mode as `metadata_only` and marks packet transmission as unsupported. This keeps the API stable for future FFmpeg or native transport backends without coupling callers to a particular implementation.

## Runtime lifecycle

1. Create a session with `createSession`.
2. Move through `prepare`, `connect`, and `start`.
3. Publish synchronized metadata with `publishProgramFrame` and `publishAudioFrame`.
4. Use `reconnect` to model reconnect attempts.
5. End with `stop`, or mark unrecoverable conditions with `fail`.

## Example

```ts
const pipeline = createStreamingPipeline({ id: 'streaming-pipeline:program' });
const session = pipeline.createSession({
  destination: {
    kind: 'rtmps',
    provider: 'youtube',
    label: 'YouTube primary',
    endpointUrl: 'rtmps://a.rtmps.youtube.com/live2/STREAM_KEY',
    streamKeyRef: 'secret://youtube/primary',
  },
  programOutput,
  audioMixer,
  mediaClock,
  frameScheduler,
  targetBitrateKbps: 6000,
  latencyEstimateMs: 1800,
});

pipeline.prepare(session.id);
pipeline.connect(session.id);
pipeline.start(session.id);
pipeline.publishProgramFrame(session.id, frameScheduler.createTick());
pipeline.publishAudioFrame(session.id, 960);
pipeline.stop(session.id);
```

The endpoint URL is sanitized, and stream keys are represented only by `streamKeyRef` metadata.
