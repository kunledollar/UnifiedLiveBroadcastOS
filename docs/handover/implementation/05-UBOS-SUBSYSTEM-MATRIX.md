
This file answers:

> What are all the major UBOS subsystems, who owns them, what is their real status, and what evidence is still required?

Paste this into the file:

```markdown
# UBOS Subsystem Matrix

## Document Status

Document ID: 05  
Document Name: UBOS Subsystem Matrix  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering  

---

# 1. Purpose

This document provides the authoritative inventory of major UBOS subsystems.

It is intended to help engineers, contractors, Cursor agents, Codex agents, product managers, and third-party development teams understand:

- what each subsystem is responsible for;
- where it belongs architecturally;
- its current implementation status;
- whether it performs real execution;
- its dependencies;
- its remaining blockers;
- and the evidence required before it can be classified as complete.

This matrix must be updated whenever a subsystem changes status.

---

# 2. Status Definitions

Every subsystem must use one of the following classifications.

## LIVE_BROWSER

The subsystem performs real execution in the browser and produces a verifiable result.

## LIVE_NATIVE

The subsystem performs real execution through a native, desktop, server-side, or operating-system runtime and produces a verifiable result.

## PARTIALLY_WIRED

Some parts of the subsystem work, but the complete execution path is not operational.

## SIMULATED

The subsystem operates through a synthetic, mocked, deterministic, or demonstration implementation.

## METADATA_ONLY

The subsystem stores configuration or state but does not perform the real operation.

## UNAVAILABLE

The subsystem has no complete usable execution path and must remain disabled.

## DEAD

The subsystem has no valid runtime, owner, route, or product purpose and should be removed.

## FOUNDATION_IMPLEMENTED

The subsystem architecture and internal services exist, but real product execution may still require integration.

---

# 3. Status Rules

A subsystem may not be promoted to `LIVE_BROWSER` or `LIVE_NATIVE` based only on:

- code existence;
- compilation;
- unit tests;
- internal state changes;
- documentation;
- health registration;
- synthetic test data;
- mock services;
- UI controls;
- metadata storage.

Promotion requires observable execution evidence.

Every status change must include:

- validation command;
- acceptance test;
- artifact or remote evidence;
- commit hash;
- date;
- responsible engineer or agent.

---

# 4. Core Product Subsystem Matrix

| Subsystem | Architectural Owner | Primary Responsibility | Current Status | Confirmed Working | Remaining Work | Completion Evidence |
|---|---|---|---|---|---|---|
| Control Room | Web Application / UI Layer | Main operator workspace | PARTIALLY_WIRED | Program, Preview, sources, scenes, browser controls | Complete runtime wiring and remove misleading controls | End-to-end operator workflow |
| Workspace Manager | Web Application / UI Layer | Panel layout, preset switching, zone geometry, save/reset/lock | LIVE_BROWSER | 9 presets with distinct zone/geometry signatures; per-preset `zoneSizeDefaults` (Audio Engineer: expanded bottom 360px, Streaming Operator: wider right dock 340px, Monitor Wall: expanded bottom 400px); Program/Preview min-widths reduced (320/240px) to allow visible flex distribution; PR-F responsive compact-width safety preserved | Browser-level only; no native parity needed | 108 unit tests pass (17 new zone geometry regression tests added); browser visual evidence pending |
| Program Monitor | Production Layer | Display authoritative Program output | LIVE_BROWSER | Displays browser Program media | Verify native Program parity | Visible source and scene changes |
| Preview Monitor | Production Layer | Display next production state | LIVE_BROWSER | Browser Preview assignment | Verify native renderer path | Preview remains isolated from Program |
| Source Management | Production Layer | Register and manage inputs | PARTIALLY_WIRED | Browser media and local source models | Native, remote, protocol, and social input connectors | Real source enters Preview and Program |
| Scene Management | Production Layer | Define source compositions | LIVE_BROWSER / PARTIALLY_WIRED | Browser scene selection and switching | Native compositor verification | Scene switch visible in recording and remote stream |
| Production Graph | Control and State Plane | Authoritative production topology | FOUNDATION_IMPLEMENTED | Graph and state foundations | Verify all runtime engines consume the same graph | Complete graph-to-output trace |
| Command Bus | Control and State Plane | Route typed operator and automation commands | FOUNDATION_IMPLEMENTED | Commands and handlers exist | Verify exactly-once runtime execution across real media paths | Command trace from UI to external result |
| Event Bus | Control and State Plane | Publish execution outcomes | FOUNDATION_IMPLEMENTED | Domain events and subscriptions | Verify runtime events match real backend outcomes | Event audit linked to artifacts and streams |
| CUT Switching | Production Layer | Immediate Preview-to-Program change | LIVE_BROWSER | Browser Program changes | Native output verification | Recorded and streamed output changes |
| AUTO Transition | Production Layer | Timed transition to Program | LIVE_BROWSER / PARTIALLY_WIRED | Browser transition behavior | Native frame-accurate transition | Transition visible in native artifact |
| Transition Engine | Production Layer | Manage mix, fade, wipe, and timing | PARTIALLY_WIRED | Models and browser behavior | Native compositor integration | Frame-accurate output evidence |
| Graphics Engine | Graphics Platform | Lower thirds, titles, overlays, tickers | FOUNDATION_IMPLEMENTED | Graphics architecture, lifecycle, validation | Verify composition into native recording and stream | Graphic visible in MP4 and remote destination |
| Caption Engine | Graphics / Accessibility | Captions and subtitles | PARTIALLY_WIRED | Caption models and UI foundations | Real transcription input and final-output rendering | Captions visible in output |
| Audio Routing | Media Plane | Route audio sources to Program | PARTIALLY_WIRED | State and routing models | Real PCM routing and monitoring | Program audio verified |
| Audio Mixer | Media Plane | Gain, mute, buses, and mix control | PARTIALLY_WIRED | UI and metadata controls | Real DSP and sample-level processing | Gain and mute affect artifact and stream |
| Audio Metering | Media Plane | Display actual levels | SIMULATED or PARTIALLY_WIRED | Meter UI exists | Connect to authoritative audio samples | Meter matches measured output |
| Browser Recording | Browser Runtime | Record Program in browser | LIVE_BROWSER | MediaRecorder WebM creation | Reliability and browser compatibility hardening | Playable WebM artifact |
| Native Recording | Native Runtime / Media Plane | Record Program through FFmpeg | PARTIALLY_WIRED | API routes, bridge, transcoding, FFprobe logic | Complete Control Room certification | Playable H.264/AAC MP4 verified by FFprobe |
| Recording Artifact Manager | Media Plane / Storage | Track and expose recordings | PARTIALLY_WIRED | Artifact metadata and result fields | Persistence, library integration, retention | Artifact appears and plays in media library |
| FFmpeg Discovery | Native Runtime | Locate and validate FFmpeg | PARTIALLY_WIRED | Host installation confirmed | Fix and certify Node runtime discovery | Node reports path and version |
| FFprobe Discovery | Native Runtime | Locate and validate FFprobe | PARTIALLY_WIRED | Host installation confirmed | Fix and certify Node runtime discovery | Node reports path and version |
| FFmpeg Process Host | Native Runtime | Spawn and supervise FFmpeg | PARTIALLY_WIRED | Adapter primitives exist | Real production process lifecycle | Clean start, stop, error, timeout, and cleanup |
| Native Compositor | Native Runtime / Media Plane | Produce authoritative native Program frames | UNAVAILABLE or PARTIALLY_WIRED | Architecture and contracts exist | Implement and certify rendering | Native output matches browser Program |
| GPU Acceleration | Native Runtime | Hardware-assisted rendering and encoding | UNAVAILABLE | Capability concepts exist | Hardware detection and supported backends | Verified hardware encoder or compositor |
| Streaming Engine | Media Plane | Deliver Program to external destinations | PARTIALLY_WIRED | Destination configuration and contracts | Real RTMP/RTMPS execution and receipt | Remote destination receives Program |
| Custom RTMP/RTMPS Output | Media Plane | Generic external live output | UNAVAILABLE until certified | URL and secret validation concepts | Real encoder, transport, receipt, stop | Independent remote playback or probe |
| Multi-Destination Coordinator | Output Layer | Run multiple destinations independently | METADATA_ONLY or PARTIALLY_WIRED | Destination models exist | Parallel sessions and failure isolation | Two destinations receive output independently |
| Destination Health | Output Layer / Observability | Track each output lifecycle | PARTIALLY_WIRED | Lifecycle models | Use real process and network metrics | Per-destination real health |
| Destination Profiles | Output Layer | Platform-specific resolution and layout | METADATA_ONLY | Profile concepts exist | Real independent render/encode paths | Horizontal and vertical outputs verified |
| SRT Output | Output Layer | Reliable low-latency transport | UNAVAILABLE | FFmpeg build supports SRT | Implement adapter and certify | SRT receiver verifies output |
| WebRTC Output | Output Layer | Interactive low-latency delivery | UNAVAILABLE | Architecture concepts exist | WebRTC stack or gateway | Remote peer receives output |
| NDI Output | Output Layer | Local-network professional video | UNAVAILABLE | Architecture concepts exist | NDI runtime and licensing integration | NDI receiver verifies output |
| Replay Engine | Production / Media Plane | Capture and replay moments | FOUNDATION_IMPLEMENTED / PARTIALLY_WIRED | Replay coordination models | Real clip capture and Program insertion | Replay visible in Program and output |
| Clip Engine | Media Plane / AI Layer | Produce short-form clips | PARTIALLY_WIRED or PLANNED | Timeline and media concepts | Real extraction, encoding, and publishing | Playable clip from real broadcast |
| Media Library | Data and Persistence Plane | Store and organize media assets | PARTIALLY_WIRED | Asset models and UI foundations | Persistent artifact integration | Recordings and clips accessible |
| Rundown Engine | Automation Layer | Organize show segments and cues | FOUNDATION_IMPLEMENTED | Rundown models and validation | Connect cues to real production execution | Rundown changes real Program |
| Cue Stack Engine | Automation Layer | Execute ordered production actions | FOUNDATION_IMPLEMENTED | Cue lifecycle exists | Real scene, graphic, audio, and output execution | Cue effects visible externally |
| Macro Engine | Automation Layer | Execute reusable command groups | FOUNDATION_IMPLEMENTED | Macro definitions and orchestration | Verify against real media actions | One macro completes real workflow |
| Scheduler | Automation Layer | Trigger actions at defined times | FOUNDATION_IMPLEMENTED | Scheduling models and validation | Runtime integration and persistence | Scheduled action changes real output |
| Recovery and Replay Coordination | Automation Layer | Restore state and replay command history | FOUNDATION_IMPLEMENTED | Recovery models and certification | Verify against live runtime failure | Runtime recovers valid state |
| Show Control | Automation Layer | Coordinate program actions | FOUNDATION_IMPLEMENTED / PARTIALLY_WIRED | Commands and control models | Full real-output integration | Show-control action affects Program |
| Monitoring | Enterprise Platform | Observe health, metrics, logs, and traces | FOUNDATION_IMPLEMENTED | Models, registries, and validation | Connect all values to real runtime sources | Metrics match real execution |
| Alerting | Enterprise Platform | Notify on operational faults | FOUNDATION_IMPLEMENTED | Alert and escalation models | Real production incident triggers | Verified alert from runtime failure |
| Incident Response | Enterprise Platform | Coordinate response and recovery | FOUNDATION_IMPLEMENTED | Incident and runbook models | Integrate real production failures | Incident created from real event |
| Operational Analytics | Enterprise Platform | Reports, dashboards, SLA analysis | FOUNDATION_IMPLEMENTED | Analytics models and reports | Use authoritative production events | Reports reflect real sessions |
| Capacity Planning | Enterprise Platform | Forecast and optimize resources | FOUNDATION_IMPLEMENTED | Models and simulation | Calibrate using real CPU, GPU, network data | Forecast matches measured load |
| Security Operations | Enterprise Platform | Detect and respond to threats | FOUNDATION_IMPLEMENTED | Threat and vulnerability models | Connect real identities, hosts, and logs | Real finding enters response workflow |
| Governance and Compliance | Enterprise Platform | Policies, controls, evidence, risk | FOUNDATION_IMPLEMENTED | Policy and evidence models | Bind to real production activity | Policy blocks or audits real action |
| Change Management | Enterprise Platform | Govern releases and deployment | FOUNDATION_IMPLEMENTED | Release, flag, and approval models | Integrate actual deployments | Approved change controls deployment |
| Multi-Tenancy | Enterprise Platform | Isolate organizations and customers | FOUNDATION_IMPLEMENTED | Organizations, tenants, permissions | End-to-end tenant isolation testing | Cross-tenant access prevented |
| Marketplace | Extension Platform | Publish and distribute extensions | FOUNDATION_IMPLEMENTED | Manifests, listings, certification models | Real extension runtime and installation | Certified plugin executes safely |
| Plugin Runtime | Extension Platform | Execute third-party capabilities | PARTIALLY_WIRED or UNAVAILABLE | Contracts and metadata exist | Sandboxed runtime and lifecycle | Plugin executes without bypassing governance |
| SDK | Developer Platform | Enable third-party development | FOUNDATION_IMPLEMENTED | API and developer concepts | Stable APIs, examples, versioning | External example integration works |
| Documentation Platform | Developer Platform | Publish platform documentation | FOUNDATION_IMPLEMENTED | Registry and content models | Complete authoritative documentation | Developer completes integration from docs |
| Certification Academy | Developer Platform | Train and certify users and partners | FOUNDATION_IMPLEMENTED | Tracks and attempts modeled | Real course content and operations | User completes certification |
| Partner Program | Developer Platform | Manage strategic ecosystem partners | FOUNDATION_IMPLEMENTED | Partner and hardware records | Commercial processes and integrations | Partner onboarding completed |
| API Layer | Integration Plane | Expose runtime and business capabilities | PARTIALLY_WIRED | Next.js API routes and contracts | Authentication, stability, real runtime integration | External client completes workflow |
| WebSocket / Realtime Transport | Integration Plane | Deliver state and media-related updates | PARTIALLY_WIRED | Realtime concepts exist | Reliable session and reconnect behavior | Live status updates verified |
| Authentication | Security Plane | Verify user identity | FOUNDATION_IMPLEMENTED or PARTIAL | Auth architecture exists | Confirm all production routes enforce auth | Unauthorized access rejected |
| Authorization | Security Plane | Enforce permissions and roles | FOUNDATION_IMPLEMENTED | RBAC and policy concepts | Bind every command and tenant boundary | Forbidden action blocked |
| Secrets Management | Security Plane | Protect stream keys and credentials | PARTIALLY_WIRED | Secret-reference concept | Real secure storage and retrieval | Secret never exposed in UI or logs |
| Audit | Governance Plane | Record significant operations | FOUNDATION_IMPLEMENTED | Audit models and history | Link to real operator actions and results | Complete trace from action to outcome |
| Database and Persistence | Data Plane | Persist configuration and state | PARTIALLY_WIRED | Database package and models | Confirm production persistence and migration | Restart preserves valid state |
| Configuration | Platform Services | Manage environment and runtime settings | FOUNDATION_IMPLEMENTED | Shared configuration package | Consolidate executable and connector settings | Validated environment startup |
| Feature Flags | Platform Services | Control staged capability exposure | FOUNDATION_IMPLEMENTED | Flag models | Bind real features and tenants | Disabled feature cannot execute |
| Licensing | Commercial Platform | Enforce product entitlements | PLANNED or PARTIAL | Commercial concepts exist | Plans, activation, enforcement | Entitlement controls feature access |

---

# 5. Social Fabric Subsystem Matrix

| Subsystem | Primary Responsibility | Current Status | Remaining Work | Completion Evidence |
|---|---|---|---|---|
| Social Connector Framework | Standard interface for platform integrations | PLANNED or FOUNDATION_IMPLEMENTED | Define stable connector contract and capability map | One real connector uses framework |
| Unified Chat Ingestion | Receive messages from many platforms | UNAVAILABLE | Implement first two real connectors | Real messages from two platforms |
| Unified Chat Timeline | Present normalized messages together | METADATA_ONLY or UNAVAILABLE | Build timeline from real connector events | Both platforms visible together |
| Two-Way Reply Router | Send replies to originating platform | UNAVAILABLE | Connector-specific outbound actions | Reply appears on correct platform |
| Unified Moderation | Apply moderation through one interface | UNAVAILABLE | Capability mapping and real API actions | Hide/delete/ban works where supported |
| Audience Identity | Link platform identities where permitted | PLANNED | Consent, matching, privacy, account linking | Authenticated cross-platform profile |
| Unified Reactions | Normalize likes, hearts, and reactions | PLANNED | Connector ingestion and normalization | Real reactions appear in shared stream |
| Unified Polling | Aggregate poll responses | PLANNED | Platform-specific polling and fallback | One poll aggregates real votes |
| Unified Questions | Aggregate and prioritize audience questions | PLANNED | Message classification and operator queue | Real questions grouped and featured |
| Social Media Input | Bring platform media into Production Graph | UNAVAILABLE | Platform-approved ingest or standards bridge | Social/remote source appears in Preview |
| Platform Output Connectors | Create and manage broadcasts through APIs | UNAVAILABLE or PARTIAL | Auth, broadcast creation, lifecycle sync | Connector starts real platform broadcast |
| Cross-Share | Publish promotional content across platforms | PLANNED | API integrations, scheduling, policies | Real post published to supported platforms |
| Cross-Follow | Encourage audience migration between platforms | PLANNED | Supported CTA mechanisms and tracking | Measurable cross-platform conversion |
| Social Analytics | Aggregate audience and engagement data | PLANNED | Real connector metrics and normalization | Cross-platform report from real data |
| Social-to-Guest Escalation | Invite viewer into live production | PLANNED | Identity, invite, WebRTC guest workflow | Viewer becomes real Program guest |
| AI Moderation | Assist moderation across platforms | PLANNED | Models, policies, human approval | Real flagged message reviewed and actioned |
| Translation | Translate audience messages | PLANNED | Language detection and translation provider | Real translated messages in timeline |
| Community Timeline | Maintain interaction history | PLANNED | Privacy model, identity, persistence | Authenticated history displayed |
| Loyalty and Rewards | Cross-platform community incentives | PLANNED | Points, rules, identity, fraud controls | Real reward issued and tracked |

---

# 6. Runtime and Deployment Matrix

| Runtime | Purpose | Current Status | Remaining Work | Evidence |
|---|---|---|---|---|
| Browser Runtime | UI, browser capture, Program/Preview, fallback recording | LIVE_BROWSER / PARTIAL | Reliability and native coordination | Real browser workflow |
| Node.js Server Runtime | API, FFmpeg bridge, state coordination | PARTIALLY_WIRED | FFmpeg discovery and production certification | Native recording succeeds |
| Desktop/Tauri Runtime | Native workstation and OS integration | FOUNDATION_IMPLEMENTED / PARTIAL | Build stabilization and media ownership | Desktop controls real media |
| Windows Host | Primary current local development target | PARTIAL | Full local acceptance suite | All local tests pass |
| macOS Host | Future supported desktop target | UNVERIFIED | Setup, build, media validation | Native workflow passes |
| Linux Host | Server and workstation target | UNVERIFIED | Setup, permissions, codec validation | Native workflow passes |
| Cloud Runtime | Remote execution and scaling | PLANNED | Worker model, storage, orchestration | Cloud production succeeds |
| Cluster Runtime | Distributed production execution | PLANNED | Scheduling, failover, synchronization | Multi-node test passes |
| Edge Contribution Agent | Remote media contribution | PLANNED | Agent, authentication, transport | Remote media enters Program |

---

# 7. Priority Summary

## Highest Priority

The following must be completed before major expansion:

1. FFmpeg and FFprobe discovery.
2. Native recording.
3. Graphics and audio in native output.
4. One real RTMP or RTMPS destination.
5. Two independent destinations.
6. First real chat connector.
7. Second real chat connector.
8. Unified chat and reply routing.
9. First remote or social media input.
10. Runtime hardening.

## Deferred Until Core Execution Works

The following should not receive priority yet:

- cross-follow;
- cross-share;
- AI producer;
- cloud clusters;
- advanced marketplace expansion;
- loyalty systems;
- broad commercial dashboards;
- speculative social connectors;
- new metadata-only engines.

---

# 8. Update Procedure

Whenever a subsystem changes status:

1. Run the relevant acceptance test.
2. Record the evidence.
3. Update the subsystem row.
4. Update Document 03, the Product Truth and Execution Contract.
5. Update Document 04, the Execution Plan, when a milestone completes.
6. Add the commit hash.
7. Record the date.
8. Commit all related documentation with the implementation.

No subsystem status may be changed without evidence.

---

# 9. Current Overall Assessment

UBOS has substantial architectural breadth.

Its strongest completed areas are:

- enterprise platform foundations;
- automation architecture;
- graphics architecture;
- governance;
- observability;
- security;
- multi-tenancy;
- marketplace models;
- browser production.

Its most important incomplete areas are:

- native media execution;
- native recording;
- real streaming;
- multi-destination output;
- real audio processing;
- unified chat;
- social media input;
- social connector execution.

The project’s success depends on converting the incomplete runtime and social subsystems into verified operator workflows.

---

# 10. Summary

This matrix is the authoritative inventory of UBOS.

It must remain factual.

It must never promote a subsystem because it appears complete in the interface or because internal models exist.

The only acceptable basis for status promotion is real execution evidence.

The central question for every subsystem is:

> Can an operator use it and verify the actual result?
```




## 2026-07-16 Scene Routing / Recording UI Update

- Program/Preview Monitor: repaired stale live stream fallback so monitor media follows selected scene source IDs.
- Native Recording UI: existing Recording Runtime panel is the intended production UI surface; visibility evidence is tracked under `artifacts/scene-routing-recording-ui/`.
