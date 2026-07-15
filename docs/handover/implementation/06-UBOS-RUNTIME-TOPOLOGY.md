```text
docs/handover/implementation/06-UBOS-RUNTIME-TOPOLOGY.md
```

---

````markdown
# UBOS Runtime Topology

## Document Status

Document ID: 06  
Document Name: UBOS Runtime Topology  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering

---

# 1. Purpose

This document defines how the Unified Broadcast Operating System executes at runtime.

It explains:

- every runtime process,
- every execution boundary,
- media flow,
- command flow,
- state ownership,
- process communication,
- native execution,
- browser execution,
- external platform interaction,
- and future deployment topology.

Unlike the architecture document, this document focuses entirely on runtime execution.

---

# 2. Runtime Philosophy

UBOS operates as one coordinated runtime.

Although many processes may exist, there must always be one authoritative execution path.

The operator should never need to know which process performs an operation.

Every action should appear to happen inside one operating system.

---

# 3. High-Level Runtime

```
                     Operator

                         │

                         ▼

                Control Room (React)

                         │

                         ▼

                  Command Dispatcher

                         │

            ┌────────────┼────────────┐

            ▼            ▼            ▼

      Production      Automation     Platform Services

            │            │            │

            └────────────┼────────────┘

                         ▼

                 Media Processing

                         ▼

                  Program Output

                         ▼

      ┌──────────────┬──────────────┐

      ▼                              ▼

 Recording                    Streaming Engine

      ▼                              ▼

 Recording Files         Multiple Destinations

                                     ▼

                              Audience Platforms

                                     ▼

                              Unified Chat Engine
```

---

# 4. Runtime Components

UBOS consists of the following runtime components.

## 4.1 Browser Runtime

Responsibilities:

- Control Room
- Preview
- Program monitor
- Browser capture
- Browser MediaRecorder
- UI state
- User interaction

Must never:

- encode RTMP
- spawn FFmpeg
- perform native rendering
- bypass the server runtime

---

## 4.2 Native Runtime

Responsibilities:

- FFmpeg
- FFprobe
- native recording
- encoding
- decoding
- streaming
- GPU acceleration
- compositor
- hardware interfaces

The browser communicates with this runtime through APIs.

---

## 4.3 API Runtime

Responsibilities:

- receive commands
- validate requests
- coordinate services
- expose runtime status
- authentication
- authorization
- orchestration

The API runtime is the bridge between the browser and native execution.

---

## 4.4 Media Runtime

Responsible for:

- Program frames
- Preview frames
- video processing
- audio processing
- synchronization
- buffering
- timing
- rendering

Everything leaving UBOS originates here.

---

## 4.5 Platform Services Runtime

Responsible for:

- monitoring
- telemetry
- health
- audit
- metrics
- logging
- security
- governance
- compliance

Platform services must never own media.

---

# 5. Runtime Ownership

Only one subsystem owns each responsibility.

| Responsibility | Runtime Owner |
|----------------|---------------|
| UI | Browser |
| Commands | Command Dispatcher |
| Production Graph | Production Engine |
| Program | Media Runtime |
| Recording | Native Runtime |
| Streaming | Native Runtime |
| Monitoring | Platform Services |
| Security | Platform Services |
| Audit | Platform Services |
| Unified Chat | Audience Runtime |
| Automation | Automation Runtime |

No duplicate ownership is permitted.

---

# 6. Command Flow

Every operator action follows the same lifecycle.

```
Operator

↓

UI Event

↓

Typed Command

↓

Command Dispatcher

↓

Validation

↓

Subsystem Handler

↓

Media Runtime

↓

Result Event

↓

UI Update

↓

Audit
```

The UI never changes runtime state directly.

---

# 7. Media Flow

Media follows one direction.

```
Input

↓

Normalize

↓

Source

↓

Scene

↓

Preview

↓

Program

↓

Graphics

↓

Audio Mix

↓

Encoder

↓

Recording

↓

Streaming

↓

Destinations
```

No subsystem may bypass Program.

Program is the single source of truth.

---

# 8. Recording Flow

```
Program

↓

Media Stream

↓

Native Runtime

↓

FFmpeg

↓

MP4

↓

FFprobe

↓

Artifact

↓

Operator
```

Completion requires:

- playable file
- verified codecs
- verified duration
- clean shutdown

---

# 9. Streaming Flow

```
Program

↓

Encoder

↓

RTMP/SRT/WebRTC

↓

Destination

↓

Receipt Verification

↓

Operator
```

Streaming is not complete until receipt is verified.

---

# 10. Unified Chat Flow

```
Platform Connectors

↓

Message Ingestion

↓

Normalization

↓

Unified Timeline

↓

Moderation

↓

Operator

↓

Reply Router

↓

Origin Platform
```

Every reply returns through the originating connector.

---

# 11. Social Media Runtime

Future runtime responsibilities include:

Inputs

- TikTok Live
- YouTube Live
- Facebook Live
- Twitch
- LinkedIn Live
- Instagram Live
- X Live
- Browser Guests
- RTMP
- SRT
- WebRTC

Outputs

- YouTube
- Facebook
- Twitch
- LinkedIn
- TikTok
- Instagram
- X
- RTMP
- RTMPS
- SRT
- WebRTC

Audience

- unified chat
- moderation
- analytics
- cross-share
- cross-follow

---

# 12. Failure Isolation

Every runtime must fail independently.

Examples:

If one RTMP destination disconnects:

Remaining destinations continue.

If one chat connector fails:

Remaining connectors continue.

If browser recording fails:

Native recording continues.

If one graphics overlay crashes:

Program continues.

---

# 13. Health Model

Every runtime reports:

- Healthy
- Starting
- Busy
- Degraded
- Failed
- Recovering
- Offline

Health must reflect reality.

---

# 14. Deployment Models

UBOS supports multiple deployments.

Desktop

```
Browser

↓

Node

↓

FFmpeg

↓

Outputs
```

Enterprise

```
Browser

↓

API Cluster

↓

Media Cluster

↓

Streaming Cluster

↓

Destinations
```

Cloud

```
Browser

↓

Gateway

↓

Workers

↓

Media Plane

↓

Destinations
```

The runtime model remains the same.

Only deployment changes.

---

# 15. Runtime Boundaries

Browser may:

✓ Display media

✓ Capture browser media

✓ Issue commands

✓ Display state

Browser may NOT:

✗ Encode RTMP

✗ Run FFmpeg

✗ Perform GPU compositing

✗ Own Program

Native Runtime may:

✓ Encode

✓ Record

✓ Stream

✓ Compose

✓ Decode

Platform Services may:

✓ Observe

✓ Audit

✓ Alert

✓ Govern

Platform Services may NOT:

✗ Modify media directly

---

# 16. Runtime Lifecycle

A complete broadcast follows this lifecycle:

```
Initialize

↓

Connect Sources

↓

Preview

↓

Program

↓

Graphics

↓

Recording

↓

Streaming

↓

Audience

↓

Monitoring

↓

Stop

↓

Cleanup

↓

Archive
```

Every broadcast should follow this lifecycle.

---

# 17. Current Runtime Status

Browser Runtime

Status:

PARTIALLY OPERATIONAL

Native Runtime

Status:

PARTIALLY WIRED

Streaming Runtime

Status:

NOT YET CERTIFIED

Recording Runtime

Status:

PARTIALLY CERTIFIED

Unified Chat Runtime

Status:

NOT IMPLEMENTED

Social Runtime

Status:

PLANNED

---

# 18. Immediate Runtime Priorities

1. Complete native runtime discovery.
2. Certify native recording.
3. Certify graphics in recording.
4. Certify audio in recording.
5. Certify one RTMP destination.
6. Certify two simultaneous destinations.
7. Implement first real chat connector.
8. Implement second chat connector.
9. Build unified chat.
10. Add first real social input.

---

# 19. Summary

UBOS runtime is designed around one principle:

One authoritative Program.

Every runtime component exists to create, transport, record, distribute, observe, or enhance that Program.

No runtime should bypass the Production Graph or create competing execution paths.

The runtime topology defined in this document is the permanent execution model for the Unified Broadcast Operating System.


