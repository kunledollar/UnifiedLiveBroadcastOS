
# UBOS Capability Matrix

## Document Status

Document ID: 10  
Document Name: UBOS Capability Matrix  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering

---

# 1. Purpose

This document is the authoritative inventory of every customer-facing capability in the Unified Broadcast Operating System (UBOS).

Unlike the subsystem matrix, which documents internal architecture, this document answers one question:

> **What can an operator actually do with UBOS today?**

Every capability listed here must have an objectively verifiable implementation status.

No capability may be marketed or demonstrated beyond its actual execution status.

---

# 2. Capability Status Definitions

Every capability must be assigned one of the following states.

| Status | Meaning |
|---------|---------|
| LIVE_BROWSER | Executes successfully inside the browser and produces a real result. |
| LIVE_NATIVE | Executes successfully through the native runtime and produces a real external result. |
| PARTIALLY_WIRED | Some execution path exists but the workflow is incomplete. |
| FOUNDATION_IMPLEMENTED | Architecture exists but end-to-end execution is incomplete. |
| SIMULATED | UI or backend simulates execution. |
| METADATA_ONLY | Stores configuration only. |
| UNAVAILABLE | Not usable. |
| PLANNED | Future roadmap item. |
| DEAD | Removed from the product. |

---

# 3. Production Capabilities

| Capability | Status | Evidence Required Before LIVE |
|------------|--------|-------------------------------|
| Add Source | LIVE_BROWSER | Real media appears |
| Remove Source | LIVE_BROWSER | Source removed and resources released |
| Preview Source | LIVE_BROWSER | Preview displays source |
| Program Take | LIVE_BROWSER | Program changes |
| CUT | LIVE_BROWSER | Immediate Program switch |
| AUTO | PARTIALLY_WIRED | Native transition verification |
| Scene Switching | LIVE_BROWSER | Visible Program change |
| Scene Creation | PARTIALLY_WIRED | Persistent scenes |
| Scene Editing | PARTIALLY_WIRED | Live scene modification |
| Scene Duplication | FOUNDATION_IMPLEMENTED | Verified workflow |
| Multi-view | FOUNDATION_IMPLEMENTED | Real synchronized previews |

---

# 4. Recording Capabilities

| Capability | Status | Evidence Required |
|------------|--------|------------------|
| Browser Recording | LIVE_BROWSER | Playable WebM |
| Native Recording | PARTIALLY_WIRED | Playable FFmpeg MP4 |
| Recording History | PARTIALLY_WIRED | Persistent library |
| Recording Download | LIVE_BROWSER | Download artifact |
| Recording Verification | PARTIALLY_WIRED | FFprobe verification |
| Recording Metadata | FOUNDATION_IMPLEMENTED | Linked artifact |

---

# 5. Streaming Capabilities

| Capability | Status | Evidence Required |
|------------|--------|------------------|
| Configure RTMP | METADATA_ONLY | Runtime integration |
| Configure RTMPS | METADATA_ONLY | Runtime integration |
| Start Streaming | UNAVAILABLE | Remote receipt |
| Stop Streaming | UNAVAILABLE | Clean shutdown |
| Streaming Metrics | SIMULATED | Real encoder metrics |
| Dropped Frames | SIMULATED | Encoder statistics |
| Reconnect | FOUNDATION_IMPLEMENTED | Real reconnect |
| Destination Health | PARTIALLY_WIRED | Runtime verification |

---

# 6. Multi-Destination Broadcasting

| Capability | Status |
|------------|--------|
| One Destination | PARTIALLY_WIRED |
| Two Destinations | METADATA_ONLY |
| Independent Stop | METADATA_ONLY |
| Independent Restart | METADATA_ONLY |
| Independent Metrics | FOUNDATION_IMPLEMENTED |
| Failure Isolation | FOUNDATION_IMPLEMENTED |

---

# 7. Graphics

| Capability | Status |
|------------|--------|
| Lower Third | FOUNDATION_IMPLEMENTED |
| Title | FOUNDATION_IMPLEMENTED |
| Logo | FOUNDATION_IMPLEMENTED |
| Overlay | FOUNDATION_IMPLEMENTED |
| Ticker | FOUNDATION_IMPLEMENTED |
| Graphics in Browser Recording | PARTIALLY_WIRED |
| Graphics in Native Recording | UNAVAILABLE |
| Graphics in Stream | UNAVAILABLE |

---

# 8. Audio

| Capability | Status |
|------------|--------|
| Audio Routing | PARTIALLY_WIRED |
| Audio Mixer | PARTIALLY_WIRED |
| Gain | SIMULATED |
| Mute | SIMULATED |
| Audio Meter | SIMULATED |
| Audio DSP | FOUNDATION_IMPLEMENTED |
| Native Audio | UNAVAILABLE |

---

# 9. Social Media Input

This is the primary differentiator of UBOS.

| Capability | Status |
|------------|--------|
| YouTube Live Input | PLANNED |
| Facebook Live Input | PLANNED |
| Twitch Input | PLANNED |
| LinkedIn Live Input | PLANNED |
| TikTok Live Input | PLANNED |
| Instagram Live Input | PLANNED |
| X Live Input | PLANNED |
| Browser Guest | PLANNED |
| RTMP Input | PLANNED |
| SRT Input | PLANNED |
| WebRTC Input | PLANNED |

---

# 10. Social Media Output

| Capability | Status |
|------------|--------|
| YouTube Output | PARTIALLY_WIRED |
| Facebook Output | PARTIALLY_WIRED |
| Twitch Output | PARTIALLY_WIRED |
| LinkedIn Output | PARTIALLY_WIRED |
| TikTok Output | PLANNED |
| Instagram Output | PLANNED |
| X Output | PLANNED |
| Custom RTMP | PARTIALLY_WIRED |
| Custom RTMPS | PARTIALLY_WIRED |
| SRT Output | PLANNED |
| WebRTC Output | PLANNED |

---

# 11. Unified Chat

This is one of UBOS's flagship capabilities.

| Capability | Status |
|------------|--------|
| Chat Connector Framework | FOUNDATION_IMPLEMENTED |
| Unified Timeline | PLANNED |
| Two-way Reply | PLANNED |
| Cross-platform Moderation | PLANNED |
| Unified Reactions | PLANNED |
| Unified Polls | PLANNED |
| Unified Questions | PLANNED |
| Chat Search | PLANNED |
| AI Moderation | PLANNED |
| Translation | PLANNED |

---

# 12. Cross-Platform Audience Features

| Capability | Status |
|------------|--------|
| Cross Share | PLANNED |
| Cross Follow | PLANNED |
| Audience Identity | PLANNED |
| Community Timeline | PLANNED |
| Loyalty | PLANNED |
| Viewer Invitations | PLANNED |

---

# 13. Enterprise Platform

The following foundations already exist.

- Observability
- Monitoring
- Telemetry
- Capacity Planning
- Incident Management
- Security Operations
- Governance
- Compliance
- Marketplace
- Plugin Platform
- SDK
- Multi-tenancy
- Partner Program
- Documentation Platform

Status:

**FOUNDATION_IMPLEMENTED**

These become fully LIVE only after their workflows interact with the real runtime.

---

# 14. Current Commercial Readiness

Current strengths:

- Professional Control Room
- Modern architecture
- Browser production workflow
- Enterprise governance foundation
- Marketplace architecture
- Multi-tenancy
- Plugin architecture

Current blockers:

- Native media execution
- Native recording certification
- Real streaming
- Multi-destination broadcasting
- Unified chat
- Social media input
- Social platform output connectors

---

# 15. Product North Star

UBOS is considered commercially complete when an operator can:

1. Connect one or more real social or remote media inputs.
2. Produce a live broadcast.
3. Switch scenes.
4. Add graphics.
5. Mix audio.
6. Record the Program.
7. Stream simultaneously to multiple destinations.
8. Receive unified audience chat.
9. Reply to viewers from one interface.
10. Moderate every connected platform.
11. Continue broadcasting when one destination fails.

---

# 16. Summary

This capability matrix represents the customer-visible truth of UBOS.

Every status change must be backed by:

- successful acceptance testing,
- real runtime evidence,
- updated documentation,
- and commit history.

No capability may be promoted without objective proof.

The guiding principle is:

> **A capability exists only when an operator can use it successfully.**




