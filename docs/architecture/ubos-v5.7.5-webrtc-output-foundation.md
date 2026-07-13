# UBOS v5.7.5 — Production-Safe WebRTC Output Foundation

UBOS v5.7.5 adds a deterministic, metadata-only WebRTC output foundation behind the Streaming Output Foundation. It models peer sessions, ICE/SDP/DTLS/SRTP/RTP/RTCP/congestion/jitter/bandwidth/retransmission state and synthetic transmission results. It does not implement browser APIs, Chromium, libwebrtc, sockets, networking, STUN/TURN networking, NAT traversal, DTLS, SRTP, RTP/RTCP serialization, FFmpeg, GStreamer, HTTP, WebSocket, QUIC, or WebTransport.

## Encoded Packet → WebRTC Flow
```mermaid
flowchart TD
  A[Encoded Packet Metadata] --> B[Streaming Output Foundation]
  B --> C[WebRTC Output Foundation]
  C --> D[RTP Packet Plan Metadata]
  D --> E[Synthetic Transmission Result]
```

## Peer Lifecycle
```mermaid
stateDiagram-v2
  [*] --> NEW
  NEW --> CONNECTING
  CONNECTING --> NEGOTIATING
  NEGOTIATING --> CONNECTED
  CONNECTED --> STARTED
  STARTED --> STOPPED
  STARTED --> FAILED
  STOPPED --> CLOSED
```

## ICE Lifecycle
```mermaid
stateDiagram-v2
  [*] --> NEW
  NEW --> GATHERING
  GATHERING --> CHECKING
  CHECKING --> CONNECTED
  CONNECTED --> COMPLETED
  CHECKING --> FAILED
  CONNECTED --> DISCONNECTED
  DISCONNECTED --> CHECKING
  COMPLETED --> CLOSED
```

## SDP Negotiation
```mermaid
sequenceDiagram
  participant Cmd as WEBRTC_NEGOTIATE
  participant Eng as WebRtcOutputEngine
  participant SDP as Immutable WebRtcSessionDescription
  Cmd->>Eng: session id + generation
  Eng->>SDP: codecs, payload types, RTP mappings, directions, extensions
  SDP-->>Eng: redacted fingerprint and ICE credential metadata only
```

## DTLS Metadata
```mermaid
flowchart LR
  A[Fingerprint Metadata] --> B[Certificate Metadata Redacted]
  B --> C[Cipher Metadata]
  C --> D[DTLS State Metadata]
```

## SRTP Metadata
```mermaid
flowchart LR
  A[Crypto Profile] --> B[Key Lifetime Metadata]
  B --> C[Encryption Enabled Flag]
  C --> D[Authentication Metadata]
```

## RTP Packet Planning
```mermaid
flowchart TD
  A[WebRtcRtpPacket Metadata] --> B{Generation and Ownership Valid?}
  B -- no --> R[Reject]
  B -- yes --> C{Duplicate or Sequence Regression?}
  C -- yes --> R
  C -- no --> D[Packet Pacing Plan]
  D --> E[Synthetic Result]
```

## RTCP Flow
```mermaid
flowchart TD
  SR[Sender Report] --> State[WebRtcRtcpState]
  RR[Receiver Report] --> State
  NACK[NACK] --> State
  PLI[PLI/FIR] --> State
  REMB[REMB/TWCC] --> State
  BYE[BYE/APP] --> State
```

## Congestion Control
```mermaid
flowchart LR
  A[Estimated Bitrate] --> D[Congestion State]
  B[Packet Loss] --> D
  C[RTT and Queue Delay] --> D
  D --> E[Health and Telemetry]
```

## Jitter Buffer
```mermaid
flowchart LR
  A[Estimated Jitter] --> B[Buffer Delay]
  B --> C[Packet Reorder]
  C --> D[Drift Metadata]
```

## Retransmission Planning
```mermaid
flowchart TD
  A[Missing/Unmarked Packet Metadata] --> B[RTX Metadata]
  A --> C[NACK Metadata]
  A --> D[FEC Metadata]
  B --> E[Packet Recovery Metadata]
  C --> E
  D --> E
```

## Processor Order
```mermaid
flowchart LR
  A[Encoder 900] --> B[Muxing 950]
  B --> C[Recording 1000]
  C --> D[Streaming Output 1050]
  D --> E[RTMP 1060]
  E --> F[WebRTC 1062]
  F --> G[Distribution]
```

## Failure Recovery
```mermaid
flowchart TD
  A[Watchdog Incident] --> B{Explicit Command?}
  B -- Restart ICE --> C[WEBRTC_RESTART_ICE]
  B -- Renegotiate --> D[WEBRTC_RENEGOTIATE]
  B -- Reset --> E[WEBRTC_RESET]
  B -- Stop --> F[WEBRTC_STOP]
```

## Shutdown
```mermaid
flowchart TD
  A[WEBRTC_SHUTDOWN] --> B[Clear Sessions]
  B --> C[Clear Peers]
  C --> D[Clear ICE/DTLS/SRTP]
  D --> E[Clear RTP/RTCP/Plans]
  E --> F[No Active Queues or Backend State]
```

## Public Contract

The foundation exposes immutable models for `WebRtcOutputProfile`, `WebRtcDestination`, `WebRtcPeer`, `WebRtcSession`, `WebRtcIceState`, `WebRtcDtlsState`, `WebRtcSrtpState`, `WebRtcSessionDescription`, `WebRtcRtpPacket`, `WebRtcRtcpState`, `WebRtcCongestionState`, `WebRtcJitterState`, `WebRtcBandwidthState`, `WebRtcRetransmissionState`, `WebRtcSendRequest`, `WebRtcSendPlan`, and `WebRtcTransmissionResult`.

Commands include profile/destination/session registration, connect, negotiate, start, stop, packet submission, ICE restart, renegotiation, reset, drain, flush, validation, and shutdown. The processor uses the existing `TickProcessor` contract and creates no runtime loop.

## Production Safety Guarantees

Snapshots and Source Graph summaries are redacted and JSON-safe. Results explicitly report no real WebRTC transport, no real networking, no real DTLS, and no real SRTP. Shutdown clears active sessions, peers, ICE/DTLS/SRTP state, RTP/RTCP state, packet plans, retransmission state, queues, and backend-like metadata.
