# UBOS v5.7.8 — Production-Safe Social Platform Destination Coordination

## Purpose and architectural position

UBOS v5.7.8 adds a metadata-only Social Platform Destination Coordination layer after the v5.7 streaming, protocol, and multi-destination fan-out foundations. It coordinates platform capability definitions, redacted account/channel references, social destination profiles, event metadata, output mappings, readiness, compatibility, group aggregation, retry/reconnect intent, health, telemetry, watchdog incidents, Source Graph metadata, immutable snapshots, and deterministic validation.

The layer does **not** own media timing, encoding, muxing, fan-out, transport, OAuth, platform API calls, browser automation, event creation, stream-key retrieval, chat, analytics, followers, uploads, or social publishing.

```mermaid
flowchart TD
  A[Program / Clean Feed / AUX / Horizontal / Vertical / Square outputs] --> B[Streaming Output Foundation v5.7.1]
  B --> C[RTMP/SRT/WebRTC/NDI Protocol Foundations v5.7.3-v5.7.6]
  C --> D[Multi-Destination Distribution v5.7.2]
  D --> E[Social Platform Destination Coordination v5.7.8]
  E --> F[Capability validation]
  E --> G[Account/channel/event readiness]
  E --> H[Compatibility and aspect-ratio validation]
  E --> I[Group aggregate health]
  E --> J[Synthetic social-live result]
```

## Relationship to v5.7.1–v5.7.7

The coordinator reuses the existing `FrameTick`, `TickProcessor`, command-handler, processor output publication, streaming protocol enum, output-role enum, synthetic transport behavior, generation checks, bounded telemetry, watchdog naming, and Source Graph redaction patterns. Processor order is `1085`, after Streaming Output (`1050`), protocol foundations (`1060–1066`), and Multi-Destination Distribution (`1075`).

```mermaid
sequenceDiagram
  participant T as Authoritative FrameTick
  participant S as Streaming Output 1050
  participant P as Protocols 1060-1066
  participant D as Distribution 1075
  participant C as Social Coordinator 1085
  T->>S: processTick
  T->>P: processTick
  T->>D: processTick
  T->>C: processTick (no second loop)
  C-->>C: publish bounded snapshots
```

## Supported platform identifiers

The explicit platform set is `YOUTUBE_LIVE`, `FACEBOOK_LIVE`, `TWITCH`, `LINKEDIN_LIVE`, `TIKTOK_LIVE_METADATA`, `INSTAGRAM_LIVE_METADATA`, `X_LIVE_METADATA`, `KICK`, `GENERIC_SOCIAL`, and `CUSTOM_TYPED`. Metadata-only presets are marked for TikTok, Instagram, and X. Unsupported platforms are rejected; there is no hidden fallback.

## Capability definitions and presets

`SocialPlatformCapabilityDefinition` is immutable, versioned, generation-protected, bounded, and synthetic-only. Presets declare supported ingest protocols, codecs, containers, resolutions, aspect ratios, frame rates, audio formats, bitrate ranges, keyframe intervals, secure-transport requirements, metadata feature support, visibility support, and safe metadata flags (`realPlatformApi`, `realOAuth`, `realEventCreation`, `realStreamKeyRetrieval` are false).

```mermaid
flowchart LR
  P[Platform] --> C[Versioned capability preset]
  C --> Protocol[Protocol support]
  C --> Codec[H.264/AAC metadata]
  C --> Video[Resolution/aspect/frame-rate]
  C --> Audio[Sample-rate/channel-layout]
  C --> Safety[Synthetic-only flags]
```

## Account references, channel references, destination profiles, and live-event metadata

Account and channel references store redacted/hashing identifiers only and include generation, availability, classification, health, authorization/token reference metadata boundaries, and no credentials. Destination profiles bind platform/account/channel/output-role/aspect-ratio/preferred-protocol/source-generation references plus explicit codec, bitrate, resolution, audio, keyframe, secure-transport, visibility, metadata, event, readiness, retry, reconnect, failure, criticality, and enabled policies.

Live events store event type, sanitized content metadata, visibility, schedule metadata, thumbnail/cover references, stream/event/chat/engagement/analytics references, lifecycle/readiness policy, and safe metadata. They never claim API-created events and never contain stream keys, URLs, credentials, raw platform IDs, HTML, or binary thumbnails.

```mermaid
flowchart TD
  A[Redacted Account Reference] --> P[Social Destination Profile]
  C[Redacted Channel Reference] --> P
  E[Social Live Event Metadata] --> S[Social Session]
  P --> S
  M[Output Mapping] --> S
```

## Content metadata, visibility, thumbnails, and covers

`SocialLiveContentMetadata` bounds and sanitizes title, description, category, language, ordered tags, content rating, audience, branded-content, paid-promotion, synthetic disclosure, caption availability, and safe metadata. Thumbnail and cover references are opaque asset-generation/hash/dimension metadata only; no payload, path, URL, or upload behavior is present.

```mermaid
flowchart LR
  Raw[Operator metadata] --> Sanitize[Sanitize/bound/order]
  Sanitize --> Event[SocialLiveEventDefinition]
  Asset[Opaque thumbnail/cover reference] --> Event
```

## Social-session lifecycle and readiness

Sessions are immutable after registration and move through explicit states from `CREATED` to readiness, preparation, activation, pause/resume/stop, retry/reconnect, failure, destroy, and shutdown. `ACTIVE` requires underlying stream readiness and overall readiness. Failed or destroyed sessions cannot silently resume.

```mermaid
stateDiagram-v2
  [*] --> CREATED
  CREATED --> VALIDATING
  VALIDATING --> WAITING_FOR_ACCOUNT
  VALIDATING --> WAITING_FOR_CHANNEL
  VALIDATING --> WAITING_FOR_EVENT
  VALIDATING --> WAITING_FOR_STREAM
  WAITING_FOR_STREAM --> READY
  READY --> PREPARING
  PREPARING --> PREPARED
  PREPARED --> ACTIVATING
  ACTIVATING --> ACTIVE
  ACTIVE --> PAUSING
  PAUSING --> PAUSED
  PAUSED --> ACTIVE
  ACTIVE --> STOPPING
  STOPPING --> STOPPED
  ACTIVE --> DEGRADED
  DEGRADED --> RETRY_WAIT
  RETRY_WAIT --> RECONNECTING
  RECONNECTING --> READY
  READY --> FAILED
  STOPPED --> DESTROYED
  DESTROYED --> SHUTDOWN
```

Readiness derives account, channel, event, stream, protocol, codec, audio, bitrate, resolution, frame-rate, keyframe, aspect-ratio, secure-transport, metadata, and destination readiness from explicit policy.

```mermaid
flowchart TD
  A[Account ready?] --> R[Overall readiness]
  B[Channel ready?] --> R
  C[Event ready?] --> R
  D[Stream ready?] --> R
  E[Compatibility ready?] --> R
  F[Mapping enabled?] --> R
  R -->|all true| Ready[READY]
  R -->|blocking reasons| Waiting[WAITING/DEGRADED]
```

## Compatibility request/result and aspect-ratio output mapping

Compatibility validates stale generations, protocol, codecs, container metadata, resolution, aspect ratio, frame rate, bitrates, audio format, keyframe interval, secure transport, and low-latency metadata. Results are deterministic and never imply hidden transcoding, resizing, frame-rate conversion, sample-rate conversion, or bitrate adjustment.

```mermaid
flowchart TD
  Req[Compatibility request] --> Gen[Generation checks]
  Gen --> Proto[Protocol]
  Proto --> Codec[Video/audio codec]
  Codec --> Video[Resolution/frame-rate/aspect]
  Video --> Audio[Audio bitrate/sample/channel]
  Audio --> Keyframe[Keyframe/security]
  Keyframe --> Result[Compatible / warning / degraded / incompatible / rejected]
```

Aspect-ratio roles are explicit and source outputs must already exist.

```mermaid
flowchart LR
  Program[PROGRAM] --> H[HORIZONTAL_16_9]
  Vertical[VERTICAL_PROGRAM] --> V[VERTICAL_9_16]
  Square[SQUARE_PROGRAM] --> Q[SQUARE_1_1]
  Clean[CLEAN_FEED] --> CH[Explicit mapping]
  Aux[AUXILIARY] --> AH[Explicit mapping]
```

## Cross-platform live groups and policies

Groups define deterministic ordered sessions, required/optional subsets, activation/completion/failure policies, quorum policy, synchronization policy, and enabled state. Required sessions must be a subset of group sessions and quorum must be achievable.

```mermaid
flowchart TD
  Sessions[Ordered social sessions] --> Required[Required subset]
  Sessions --> Optional[Optional subset]
  Required --> Quorum[Quorum evaluation]
  Optional --> Quorum
  Quorum --> Active[ACTIVE]
  Quorum --> Partial[PARTIAL]
  Quorum --> Degraded[DEGRADED]
  Quorum --> Failed[FAILED]
```

## Coordination requests, plans, and results

Requests carry expected generations and actions (`VALIDATE`, `PREPARE`, `ACTIVATE`, `PAUSE`, `RESUME`, `STOP`, `RETRY`, `RECONNECT`, `REFRESH_READINESS`, `CUSTOM`). Plans deterministically validate session/profile/event/account/channel, mapping, capabilities, underlying summaries, compatibility, readiness, lifecycle action, retry/reconnect intent, group impact, publication, health, and telemetry. Results are synthetic and never claim real platform activation.

## Retry/reconnect coordination and failure isolation

Retry and reconnect produce typed metadata intent for existing streaming/protocol systems and do not create a transport retry engine. Platform failures are independent; optional failures degrade groups without corrupting active platforms, while required failures follow explicit policy.

```mermaid
flowchart TD
  Failure[Platform failure] --> Required{Required?}
  Required -->|yes| Policy[Required failure policy]
  Required -->|no| Isolate[Isolate optional platform]
  Isolate --> Preserve[Preserve other active platforms]
  Policy --> Group[Re-evaluate group quorum]
```

```mermaid
sequenceDiagram
  participant C as Social Coordinator
  participant S as Streaming Commands
  C->>C: Evaluate bounded retry/reconnect policy
  C-->>S: Typed retry/reconnect metadata intent
  Note over C,S: No independent transport retry loop
```

## Chat, engagement, and analytics reference foundations

Chat, engagement, and analytics references are metadata-only eligibility descriptors. They do not ingest messages, send chat, moderate, collect analytics, represent current counts, synchronize followers, or access platform APIs.

```mermaid
flowchart LR
  Event[Social event/session] --> Chat[Chat reference metadata]
  Event --> Engage[Engagement reference metadata]
  Event --> Analytics[Analytics reference metadata]
  Chat --> NoApi[No API / no payload / no credentials]
  Engage --> NoApi
  Analytics --> NoApi
```

## Health, telemetry, watchdog, Source Graph, and security

Health snapshots count backends, capabilities, accounts, channels, profiles, events, sessions, groups, compatibility/readiness checks, activations, retry/reconnect coordination, duplicate/stale rejections, unavailable references, incompatibilities, and platform failures. Telemetry is bounded and contains no unbounded event history. Watchdog incidents cover stale generations, unsupported platforms, unavailable account/channel/event/stream, compatibility failures, quorum impossible, platform failures, mapping conflicts, metadata invalid, retry/reconnect failure, backend failure, registry/source-graph mismatch, redaction failure, and invariant failure.

Source Graph output is redacted metadata only: platform IDs, social session IDs, output/aspect roles, redacted account/channel references, safe event IDs, states, compatibility, underlying summaries, group quorum state, reference availability, real-platform flags, health, and readiness.

## Drain, reset, configuration transactions, and shutdown

Drain stops new activation requests, releases queued request state, and transitions sessions to stopped. Reset clears readiness, compatibility, activation, retry/reconnect, group aggregate, and plan cache while monotonically advancing session generation. Configuration transactions are modeled as atomic metadata boundaries. Shutdown is idempotent and clears active requests/plans while placing sessions in `SHUTDOWN`.

```mermaid
flowchart TD
  Create[Transaction created] --> Validate[Validate expected generations]
  Validate --> Commit[Commit exactly once]
  Validate --> Cancel[Cancel before commit = no change]
  Commit --> Complete[Completed]
  Validate --> Fail[Failure preserves prior configuration]
```

```mermaid
sequenceDiagram
  participant O as Operator
  participant C as Coordinator
  O->>C: SOCIAL_SHUTDOWN
  C->>C: Stop new requests
  C->>C: Clear request/plan caches
  C->>C: Mark sessions SHUTDOWN
  C->>C: Shutdown synthetic backends
  C-->>O: Idempotent stopped snapshot
```

## Backend abstraction and synthetic backend

The `SocialPlatformCoordinationBackend` contract supports initialization, compatibility, readiness, planning, lifecycle actions, retry/reconnect coordination, group aggregation, reset, reconfiguration, session shutdown, and backend shutdown. The deterministic synthetic backend reports `realPlatformApi`, `realOAuth`, `realEventCreation`, and `realStreamKeyRetrieval` as false and performs no HTTP, OAuth, browser automation, credential storage, or platform calls.

## Output registry, commands, events, public exports, and invariants

Typed output keys cover capabilities, references, profiles, events, sessions, states, readiness, compatibility, mappings, groups, requests, plans, results, health, telemetry, backend health, transactions, and failed/rejected results. Commands and events are exported explicitly through the media-plane package. `assertInvariants()` verifies uniqueness, references, quorum, readiness/activation semantics, one request/result behavior, platform isolation, redaction, synthetic-only flags, and shutdown cleanup.

## Production-safety guarantees

No second media clock, no social timing loop, no hidden fallback, no hidden conversion, no incompatible activation, no partial group mislabeled active, no required platform omission, no optional failure corruption, no state overwrite, no unbounded registries/cache/history, no infinite retry, no output after terminal states, no direct transport mutation, no credentials/raw IDs/URLs/secrets in observability, and no false OAuth/API/event/stream-key/chat/analytics/follower claim.

## Long-run validation, determinism replay, and performance

Validation uses fake FrameTicks, deterministic presets, redacted references, synthetic backend, deterministic streaming/distribution/protocol summaries, and no real-time sleeping. Replay compares canonical snapshots. Expected complexity is O(1) for registry lookups, compatibility, readiness, and planning plus bounded summaries; O(sessions log sessions) for group ordering; O(sessions) for quorum; O(active sessions + groups) for processor orchestration; O(platforms + profiles + sessions + bounded state) for snapshots; and O(active + bounded incidents) for watchdog evaluation.

```mermaid
flowchart TD
  A[Failure or shutdown] --> B[Reject new output]
  B --> C[Clear invalid plan cache]
  C --> D[Mark session/group degraded or stopped]
  D --> E[Preserve active unaffected platforms]
  E --> F[Publish sanitized health/watchdog]
```

## Limitations and v5.7.9 handoff

This phase is production-safe coordination only. It does not certify real social-live distribution, OAuth, platform event creation, stream-key retrieval, chat, analytics, monetization, thumbnails, or social graph behavior. The next task is **UBOS v5.7.9 — Production-Safe Social Live Distribution Certification**.
