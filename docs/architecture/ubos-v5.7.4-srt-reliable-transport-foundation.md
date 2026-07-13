# UBOS v5.7.4 — Production-Safe SRT Reliable Transport Foundation

UBOS v5.7.4 adds a deterministic, metadata-only SRT reliable transport foundation behind the Streaming Output Foundation. It models caller, listener, and rendezvous sessions, handshake metadata, stream ID/passphrase references, packet sequencing, ACK/NAK state, retransmission planning, latency windows, congestion windows, keepalives, recovery, drain, flush, reset, shutdown, health, telemetry, and output-registry publication without opening sockets or invoking SRT libraries.

## Production-Safety Contract

The implementation is explicitly synthetic. It creates no UDP sockets, no TCP/TLS/QUIC/HTTP transport, no DNS, no NAT or firewall traversal, no libsrt integration, no AES execution, no key exchange, no packet serialization, no payload-byte storage, no FFmpeg or GStreamer process, no scheduler, no runtime loop, and no media clock. Passphrases, stream IDs, endpoints, and other credentials are represented only as opaque redacted references.

## Encoded Packet → SRT Flow

```mermaid
flowchart TD
  A[Encoded Packet Metadata] --> B[SrtPacketEnvelope]
  B --> C[Validate generation and ownership]
  C --> D[Update sequence state]
  D --> E[Create SrtSendRequest]
  E --> F[Create SrtSendPlan]
  F --> G[Synthetic SrtTransmissionResult]
  G --> H[Output Registry]
```

## SRT Session Lifecycle

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> VALIDATING
  VALIDATING --> CONNECTING
  CONNECTING --> HANDSHAKING
  HANDSHAKING --> CONNECTED
  CONNECTED --> STREAMING
  STREAMING --> DEGRADED
  DEGRADED --> RECONNECTING
  RECONNECTING --> RECOVERING
  RECOVERING --> CONNECTING
  STREAMING --> DRAINING
  DRAINING --> STOPPED
  STREAMING --> FAILED
  STOPPED --> SHUTDOWN
  FAILED --> SHUTDOWN
```

## Handshake

```mermaid
sequenceDiagram
  participant Cmd as SRT_CONNECT
  participant E as SrtOutputEngine
  participant H as SrtHandshakeState
  participant C as Connection State
  Cmd->>E: connect(sessionId)
  E->>H: VALIDATING metadata
  E->>H: INDUCTION/CONCLUSION planned
  E->>H: CONNECTED_METADATA
  E->>C: CONNECTED
```

## ACK/NAK Flow

```mermaid
flowchart LR
  P[Packet sequence] --> A[SrtAckState]
  P --> N[SrtNakState]
  N --> R[SrtRetransmissionState]
  A --> T[Telemetry ACK counters]
  R --> T
```

## Retransmission Queue

```mermaid
flowchart TD
  NAK[SRT_NAK missing sequences] --> Q[Bounded retransmission queue]
  Q --> Eval[SRT_RETRANSMIT evaluation]
  Eval --> Plan[planned retransmissions]
  Plan --> Clear[clear metadata queue]
```

## Latency Window

```mermaid
flowchart LR
  TS[Destination timestamp] --> Min[Min timestamp = ts - latency]
  TS --> Max[Max timestamp = ts + latency]
  Min --> W[SrtLatencyWindow]
  Max --> W
  W --> Registry[Output Registry]
```

## Congestion Window

```mermaid
flowchart TD
  Q[Packet queue depth] --> C{Depth vs window}
  C -->|low| Clear[CLEAR]
  C -->|medium| Watch[WATCH]
  C -->|high| Congested[CONGESTED]
  C -->|critical| Critical[CRITICAL incident]
```

## Packet Sequence

```mermaid
sequenceDiagram
  participant P as Packet
  participant S as SrtPacketSequenceState
  P->>S: packetSequence n
  alt n <= lastSequence
    S-->>P: SRT_PACKET_SEQUENCE_ERROR
  else n > lastSequence
    S-->>P: accept metadata and advance lastSequence
  end
```

## Processor Order

```mermaid
flowchart TD
  Enc[Media Encoder 900] --> Mux[Muxing/Packaging 950]
  Mux --> Rec[Recording 1000]
  Rec --> Stream[Streaming Output 1050]
  Stream --> Rtmp[RTMP/RTMPS 1060]
  Rtmp --> Srt[SRT Reliable Transport 1065]
  Srt --> Fanout[Multi-Destination Distribution]
```

## Failure Recovery

```mermaid
flowchart LR
  Stall[Stall or degraded metadata] --> Reconnect[SRT_RECONNECT]
  Reconnect --> Recover[RECOVERING]
  Recover --> Handshake[Handshake metadata]
  Handshake --> Streaming[STREAMING]
```

## Shutdown

```mermaid
flowchart TD
  Cmd[SRT_SHUTDOWN] --> Stop[mark sessions SHUTDOWN]
  Stop --> ClearPackets[clear packet queues]
  ClearPackets --> ClearRetrans[clear retransmission state]
  ClearRetrans --> ClearPlans[clear requests and plans]
  ClearPlans --> Health[activeSessions = 0]
```

## Multi-Destination SRT Routing

```mermaid
flowchart TD
  Program[Program output] --> S1[SRT caller session]
  Clean[Clean feed] --> S2[SRT listener session]
  Aux[AUX output] --> S3[SRT rendezvous session]
  Vertical[Vertical output] --> S4[SRT custom session]
  S1 --> Registry[Output Registry]
  S2 --> Registry
  S3 --> Registry
  S4 --> Registry
```

## Public Model Surface

The public model surface includes `SrtOutputProfile`, `SrtDestination`, `SrtSession`, `SrtConnectionState`, `SrtHandshakeState`, `SrtEncryptionState`, `SrtPacketEnvelope`, `SrtPacketSequenceState`, `SrtAckState`, `SrtNakState`, `SrtRetransmissionState`, `SrtLatencyWindow`, `SrtCongestionState`, `SrtStatistics`, `SrtSendRequest`, `SrtSendPlan`, and `SrtTransmissionResult`.

## Commands and Observability

The command surface includes `SRT_REGISTER_PROFILE`, `SRT_REGISTER_DESTINATION`, `SRT_CREATE_SESSION`, `SRT_CONNECT`, `SRT_START`, `SRT_STOP`, `SRT_SUBMIT_PACKET`, `SRT_ACK`, `SRT_NAK`, `SRT_RETRANSMIT`, `SRT_RECONNECT`, `SRT_RESET`, `SRT_FLUSH`, `SRT_DRAIN`, `SRT_VALIDATE`, and `SRT_SHUTDOWN`. Health and telemetry track sessions, handshakes, reconnects, retransmissions, drops, ACKs, NAKs, latency windows, congestion events, queue depth, packet loss, duplicates, stale generations, ownership, and failures.
