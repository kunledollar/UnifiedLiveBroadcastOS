# UBOS v5.2 Source Acquisition Certification

## Architecture overview

UBOS v5.2 source acquisition is centered on one deterministic `DefaultSourceAcquisitionManager` and one `SourceAcquisitionProcessor`. Source providers discover descriptors, create media sources, and hand all source categories to the same manager for lifecycle control, acquisition, timestamp normalization, telemetry aggregation, and immutable snapshot generation.

The v5.2 certification covers the implemented source acquisition foundation, device discovery mapping, source graph synchronization, camera, file, screen capture, browser, audio-device, desktop-audio, and network-style source categories. The certification deliberately does not add v5.3 functionality.

## Subsystem responsibilities

- **Source providers** discover source descriptors and create source instances.
- **Source acquisition manager** owns registration, deterministic ordering, lifecycle transitions, format negotiation, source lookup, per-source health, bounded buffering, telemetry, and shutdown.
- **Source acquisition processor** is the only runtime processor that publishes acquired source outputs into the execution engine.
- **Source graph manager** mirrors source descriptors, source instances, streams, propagation edges, and immutable graph snapshots.
- **Runtime execution engine** invokes source acquisition through the shared tick-processor contract.

## Supported source categories

Certified categories:

- Cameras and capture-like video sources.
- File and media-file sources.
- Screen and window capture sources.
- Browser render sources.
- Audio devices including microphones.
- Desktop audio sources.
- Network sources modeled as NDI, SRT, RTMP, WebRTC, remote guest, or custom network descriptors.
- Synthetic/test descriptors used for deterministic validation.

## Lifecycle model

Every registered source follows the same deterministic lifecycle:

`REGISTERED → INITIALIZING → READY → CONNECTING → CONNECTED → ACTIVATING → ACTIVE → DEACTIVATING → CONNECTED → DISCONNECTING → DISCONNECTED → STOPPING → STOPPED → REMOVED`

The manager rejects invalid transitions and removes active or connected sources by deactivating and disconnecting them before shutdown. Once the manager reaches `STOPPED`, discovery, registration, and acquisition are rejected so a source cannot resurrect after shutdown.

## Timestamp model

All source samples carry both source timestamps and normalized timestamps. The shared deterministic timestamp normalizer tracks epochs, regressions, discontinuities, sequence gaps, offsets, and reset counts. Certification verifies consistent source and normalized timestamps across video frames and audio buffers in the mixed-source simulation.

## Ownership model

The common sample envelopes use immutable payload references instead of raw runtime handles. Certified ownership semantics are consistent across:

- video frames;
- audio buffers;
- network packets and decoded samples through network source boundaries;
- browser frames;
- screen frames;
- file decoded samples.

Payload references declare release ownership (`CONSUMER`, `SOURCE`, or `RUNTIME`) and snapshots avoid embedding backend handles.

## Queue model

Bounded queue semantics are shared by source acquisition and validated in specialized source suites:

- bounded capacities for video, audio, and metadata buffers;
- deterministic overflow policies such as drop-oldest or drop-newest;
- underflow accounting;
- duplicate publication prevention at processor tick boundaries;
- stale generation and late frame rejection in concrete source implementations;
- immutable queue snapshots.

## Source graph

The source graph synchronizes immutable source acquisition snapshots into descriptor, instance, stream, and propagation nodes. Graph lookup remains map-backed O(1), and graph validation checks dangling edges, duplicate logical streams, and propagation consistency.

## Runtime integration

All source categories enter the runtime through `SourceAcquisitionProcessor`, which publishes video frames, audio buffers, metadata samples, health, and statistics using the execution engine output bus. The processor rejects duplicate execution for the same frame tick by returning `SKIPPED` after an already-executed tick.

## Telemetry

Telemetry aggregation is bounded and includes registered, connected, active, degraded, unavailable, failed, reconnecting source counts; received and dropped sample counts; buffer overflow and underflow counts; timestamp discontinuities and regressions; reconnect counts; bounded acquisition timing history; active source identifiers; and source health summaries.

## Watchdog

Source watchdog incidents are standardized for stalls, unavailability, timestamp instability, buffer pressure, reconnect exhaustion, processor failure, and invariant failure. Concrete camera, file, screen, browser, and network source validation suites exercise source-specific watchdog behavior.

## Validation results

Certification validation executed a deterministic mixed-source run with multiple cameras, files, browser sources, screen captures, microphones, desktop audio, and network sources for 100,000 runtime ticks. The run verified deterministic publication order, stable identities, graph consistency, watchdog/invariant correctness, bounded queues, bounded telemetry, no duplicate publication, no stale publication, no ownership double-release indicators, no graph divergence, no resource resurrection after shutdown, and clean shutdown.

Measured complexity classes remain:

- source lookup: O(1);
- graph lookup: O(1);
- queue operations: O(1);
- publication: O(n);
- snapshot generation: O(n);
- watchdog/invariant evaluation: O(n);
- mixed-source runtime tick: O(n).

The certification suite reports relative deterministic measurements only and intentionally avoids machine-specific thresholds.

## Limitations

- Validation uses deterministic synthetic backends for the final mixed-source certification to avoid depending on host cameras, displays, browsers, microphones, network streams, or FFmpeg availability.
- Source payload references are metadata-only handles in certification mode; no raw production media payload is decoded or rendered by the certification suite.
- Performance measurements are complexity confirmations, not hardware benchmarks.

## Certification decision

UBOS v5.2 Source Acquisition is certified for the implemented source acquisition architecture and deterministic runtime integration.

Recommended release tag: `v5.2.0`.
