# UBOS v5.7.6 — Production-Safe NDI Output Foundation

UBOS v5.7.6 adds a deterministic, metadata-only NDI output foundation behind the Streaming Output Foundation. It models NDI sender profiles, sender sessions, discovery state, advertisements, receiver compatibility, video/audio stream metadata, metadata channels, tally, PTZ, clock synchronization, frame timing, bandwidth, health, telemetry, watchdog incidents, and synthetic transmission results. It does **not** implement the NewTek/NDI SDK, NDI Advanced SDK, native DLL loading, dynamic libraries, multicast, UDP/TCP sockets, mDNS, Bonjour, DNS-SD, NIC enumeration, GPU DMA, DirectX, CUDA, NVENC, RTP/RTCP, FFmpeg, GStreamer, browser APIs, SRT, RTMP, WebRTC, or actual NDI packets.

## Public Contract

The implementation exposes immutable contracts for `NdiOutputProfile`, `NdiDestination`, `NdiSenderSession`, `NdiDiscoveryState`, `NdiAdvertisement`, `NdiReceiverCompatibility`, `NdiVideoMetadata`, `NdiAudioMetadata`, `NdiMetadataChannel`, `NdiClockState`, `NdiFrameTiming`, `NdiBandwidthState`, `NdiTallyState`, `NdiPtzState`, `NdiSendRequest`, `NdiSendPlan`, and `NdiTransmissionResult`.

Supported output modes are Program, Preview, Clean Feed, AUX, Horizontal, Vertical, Square, Multiview, and Custom. Supported sender types are Video, Audio, Audio/Video, Metadata, PTZ, Tally, and Custom. Supported bandwidth profiles are Highest, High, Medium, Low, Lowest, Audio Only, Metadata Only, and Custom. Discovery modes are Automatic Metadata, Manual Metadata, Static Registration, Hidden, and Custom; hidden is represented only as metadata and does not create hidden discovery behavior.

## 1. Encoded Frame → NDI Flow

```mermaid
flowchart LR
  A[Encoded frame metadata] --> B[Streaming Output Foundation]
  B --> C[NDI Output Foundation]
  C --> D[Validate session/profile/destination generations]
  D --> E[Update frame timing and clock metadata]
  E --> F[Create synthetic NDI send plan]
  F --> G[Publish metadata-only transmission result]
```

## 2. Sender Lifecycle

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> VALIDATING
  VALIDATING --> REGISTERED
  REGISTERED --> DISCOVERABLE
  DISCOVERABLE --> READY
  READY --> STREAMING
  STREAMING --> DEGRADED
  DEGRADED --> RECONNECTING
  RECONNECTING --> STREAMING
  STREAMING --> STOPPED
  STOPPED --> SHUTDOWN
  VALIDATING --> FAILED
  DEGRADED --> FAILED
  FAILED --> SHUTDOWN
```

## 3. Discovery Lifecycle

```mermaid
flowchart TD
  A[Profile stream naming] --> B[Discovery state]
  B --> C{Discovery mode}
  C -->|Automatic metadata| D[Visible metadata advertisement]
  C -->|Manual metadata| E[Operator-controlled advertisement]
  C -->|Static registration| F[Static registry metadata]
  C -->|Hidden| G[Hidden metadata flag only]
  D --> H[Update generation]
  E --> H
  F --> H
  G --> H
```

## 4. Advertisement Flow

```mermaid
sequenceDiagram
  participant Command
  participant Engine as NdiOutputEngine
  participant Registry as Output Registry
  Command->>Engine: NDI_UPDATE_DISCOVERY
  Engine->>Engine: validate generation and visibility metadata
  Engine->>Engine: increment advertisement generation
  Engine->>Registry: publish advertisements snapshot
```

## 5. Metadata Channel

```mermaid
flowchart LR
  A[XML summary] --> D[NdiMetadataChannel]
  B[JSON summary] --> D
  C[Custom metadata summary] --> D
  D --> E[Bounded counters]
  E --> F[Redacted registry snapshot]
```

## 6. Tally Flow

```mermaid
flowchart TD
  A[NDI_UPDATE_TALLY] --> B{State}
  B -->|Preview| C[preview=true program=false]
  B -->|Program| D[preview=false program=true]
  B -->|Offline| E[offline metadata]
  B -->|Unknown| F[unknown metadata]
  C --> G[Tally generation]
  D --> G
  E --> G
  F --> G
```

## 7. PTZ Flow

```mermaid
flowchart LR
  A[PTZ metadata command] --> B[Validate finite pan/tilt/zoom/focus]
  B --> C[Optional preset recall/save metadata]
  C --> D[Increment PTZ generation]
  D --> E[Publish PTZ snapshot]
```

## 8. Frame Timing

```mermaid
flowchart TD
  A[NDI_SUBMIT_FRAME] --> B[Reject duplicate frame IDs]
  B --> C[Reject sequence regression]
  C --> D[Update last frame sequence]
  D --> E[Track dropped-frame gap metadata]
  E --> F[Publish frame timing]
```

## 9. Clock Synchronization

```mermaid
flowchart LR
  A[Frame timestamp] --> B[Sender clock]
  A --> C[Frame clock]
  B --> D[Timestamp mapping]
  C --> D
  D --> E[Synchronization generation]
```

## 10. Processor Order

```mermaid
flowchart TD
  A[Encoder / muxer / recording] --> B[Streaming Output Foundation order 1050]
  B --> C[RTMP/RTMPS Foundation]
  B --> D[SRT Foundation]
  B --> E[WebRTC Foundation]
  B --> F[NDI Output Processor order 1064]
  F --> G[Multi-destination distribution]
```

## 11. Failure Recovery

```mermaid
stateDiagram-v2
  STREAMING --> DEGRADED: validation warning
  DEGRADED --> RECONNECTING: explicit metadata reconnect plan
  RECONNECTING --> STREAMING: operator or command recovery
  STREAMING --> FAILED: invariant failure
  FAILED --> SHUTDOWN: shutdown command
```

There is no hidden reconnect loop. Reconnects are telemetry and lifecycle metadata only.

## 12. Shutdown

```mermaid
flowchart TD
  A[NDI_SHUTDOWN] --> B[Clear sessions]
  B --> C[Clear discovery and advertisements]
  C --> D[Clear metadata, tally, PTZ, timing, clocks, bandwidth]
  D --> E[Clear requests and plans]
  E --> F[Leave profiles/destinations as immutable registration metadata]
  F --> G[Validate no active sessions, queues, timers, backend state, or advertisements]
```

## Commands and Registry Publications

Commands include `NDI_REGISTER_PROFILE`, `NDI_REGISTER_DESTINATION`, `NDI_CREATE_SESSION`, `NDI_START`, `NDI_STOP`, `NDI_SUBMIT_FRAME`, `NDI_UPDATE_DISCOVERY`, `NDI_UPDATE_TALLY`, `NDI_UPDATE_PTZ`, `NDI_RESET`, `NDI_DRAIN`, `NDI_FLUSH`, `NDI_VALIDATE`, and `NDI_SHUTDOWN`.

The output registry publishes profiles, sessions, discovery state, advertisements, tally, PTZ, metadata channels, frame timing, bandwidth, health, telemetry, and transmission results.

## Health, Telemetry, and Watchdog

Health tracks sender count, session count, advertisements, active streams, tally updates, PTZ updates, metadata messages, bandwidth profile, frame timing, and failures. Telemetry maintains bounded counters for sessions, advertisements, metadata updates, tally updates, PTZ updates, stream publications, reconnects, duplicate submissions, stale generations, and dropped frames.

Watchdog incident names include `NDI_ENGINE_STALLED`, `NDI_DISCOVERY_FAILED`, `NDI_DUPLICATE_SESSION`, `NDI_DUPLICATE_FRAME`, `NDI_FRAME_SEQUENCE_ERROR`, `NDI_DISCOVERY_STATE_INVALID`, `NDI_RECEIVER_INCOMPATIBLE`, `NDI_TALLY_STATE_INVALID`, `NDI_PTZ_STATE_INVALID`, `NDI_BANDWIDTH_INVALID`, `NDI_BACKEND_FAILED`, `NDI_OWNERSHIP_VIOLATION`, and `NDI_INVARIANT_FAILURE`.

## Production Safety Guarantees

The foundation guarantees no NDI SDK, no network discovery, no sockets, no multicast, no mDNS, no Bonjour, no GPU access, no packet serialization, no duplicate frames, no stale generations, no ownership leaks, no hidden discovery, no hidden reconnect, no false claim of real NDI transport, no raw metadata payloads in observability, and shutdown cleanup for active sessions, advertisements, queues, timers, and backend state.

After v5.7.6, UBOS has deterministic metadata foundations for RTMP/RTMPS, SRT, WebRTC, and NDI. The next recommended milestone is **UBOS v5.7.7 — Production-Safe Streaming Platform Certification**.
