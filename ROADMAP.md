# UBOS ROADMAP

## Unified Live Broadcast Operating System

Status: Authoritative Product and Platform Roadmap

---

# Purpose

This document defines what UBOS is building, the order of major platform milestones, and the expected outcome of each release family.

Use:

- `MASTER-PLAN.md` for how work is executed
- `ROADMAP.md` for what gets built and in what order
- `.codex/tasks/` for detailed implementation specifications
- `.codex/WORKFLOW-STATE.md` for current execution status
- `.codex/COMPLETION-REPORT.md` for completed work

---

# Product Vision

UBOS is a software-defined live broadcast operating system designed to unify:

- source acquisition
- media processing
- video effects
- audio production
- switching
- graphics
- replay
- recording
- streaming
- social distribution
- automation
- operator control
- native media execution
- deployment and product operations

The long-term goal is one deterministic, production-safe platform capable of operating a complete live production workflow from source input to final distribution.

---

# Current Platform Stage

UBOS is currently in the advanced platform foundation stage.

Completed or substantially implemented platform families include:

- media execution foundations
- source acquisition
- frame and media processing
- video effects
- live production control
- audio, encoding, packaging, and recording
- streaming and social distribution
- replay, highlights, and clip workflows
- graphics, captions, branding, and multi-format output

The current active milestone is:

## v5.9 — Graphics Platform

The next major milestone is:

## v5.10 — Automation, Rundown, and Show Control

---

# Platform Roadmap

## v5.1 — Execution and Runtime Foundation

Purpose:

Establish the deterministic execution model used by all later UBOS subsystems.

Primary capabilities:

- authoritative runtime execution
- FrameTick
- Master Presentation Timeline
- command execution
- processor framework
- output registry
- deterministic scheduling
- lifecycle and shutdown foundations

Outcome:

A stable runtime base for all future media-plane systems.

---

## v5.2 — Source Acquisition Platform

Purpose:

Create the production-safe source ingestion and source lifecycle foundation.

Primary capabilities:

- source definitions
- source registration
- source health
- source lifecycle
- input metadata
- source graph integration
- generation-safe source state

Outcome:

UBOS can model and control incoming production sources.

---

## v5.3 — Frame Memory and Media Processing Platform

Purpose:

Create the authoritative frame ownership, memory, and media-processing layer.

Primary capabilities:

- frame ownership
- frame leases
- frame memory
- media processing
- bounded buffers
- processor output publication
- generation-safe media state

Outcome:

UBOS can safely move and process frame-level media data.

---

## v5.4 — Video Effects Platform

Purpose:

Create the complete deterministic video-effects architecture.

Primary capabilities:

- keying
- masking
- blur and sharpen
- color effects and LUTs
- AI background metadata
- image effects
- motion effects
- picture-in-picture
- effect chains
- video-effects certification

Outcome:

UBOS has a certified production-safe video-effects platform.

Release:

- Tag: `v5.4.0`
- Title: UBOS v5.4 Video Effects Platform

---

## v5.5 — Live Production Control Platform

Purpose:

Coordinate scene switching, Program/Preview buses, transitions, tally, and live control.

Primary capabilities:

- scene switching
- transition coordination
- audio-follow-video
- Program/Preview orchestration
- output-role coordination
- live production control
- tally
- production control certification

Outcome:

UBOS can coordinate authoritative on-air production state.

Release:

- Tag: `v5.5.0`
- Title: UBOS v5.5 Live Production Control Platform

---

## v5.6 — Audio, Encoding, Packaging, and Recording Platform

Purpose:

Create the audio production and media-output foundation.

Primary capabilities:

- audio mixer
- channel strips
- audio routing
- EQ
- dynamics
- loudness
- metering
- monitoring
- A/V synchronization
- master audio bus
- encoding
- muxing
- packaging
- recording
- platform certification

Outcome:

UBOS can coordinate production audio and media-output workflows.

Release:

- Tag: `v5.6.0`
- Title: UBOS v5.6 Audio, Encoding, Packaging, and Recording Platform

---

## v5.7 — Streaming and Social Distribution Platform

Purpose:

Coordinate live distribution across broadcast and social destinations.

Primary capabilities:

- streaming output foundation
- RTMP and RTMPS
- SRT
- WebRTC
- NDI
- destination coordination
- social platform coordination
- social live distribution
- platform certification

Outcome:

UBOS can model and coordinate multi-destination live distribution.

Release:

- Tag: `v5.7.0`
- Title: UBOS v5.7 Streaming and Social Distribution Platform

---

## v5.8 — Replay, Highlight, and Clip Workflow Platform

Purpose:

Create the complete replay and post-event media workflow foundation.

Primary capabilities:

- replay capture
- media recall
- replay playback
- Program insertion
- slow-motion metadata
- variable-speed replay
- replay playlists
- highlights
- clips
- clip assembly
- render metadata
- export metadata
- delivery metadata
- workflow certification

Outcome:

UBOS can coordinate replay, highlight, and clip workflows end to end.

Release:

- Tag: `v5.8.0`
- Title: UBOS v5.8 Replay, Highlight, and Clip Workflow Platform

---

## v5.9 — Graphics Platform

Purpose:

Create the complete production-safe graphics, captions, branding, and multi-format output architecture.

Task sequence:

1. v5.9.1 — Graphics and Text Rendering Foundation
2. v5.9.2 — Template, Data Binding, and Dynamic Graphics Engine
3. v5.9.3 — Lower Thirds, Titles, Tickers, and Scorebug Foundation
4. v5.9.4 — Captions, Subtitles, and Accessibility Graphics
5. v5.9.5 — Graphics Animation, Cueing, and Transition Coordination
6. v5.9.6 — Branding, Logos, Watermarks, and Safe-Area Coordination
7. v5.9.7 — Multi-Format Graphics Variants and Output-Role Coordination
8. v5.9.8 — Graphics Platform Certification
9. v5.9.0 — Graphics Platform Release

Primary capabilities:

- graphics and text definitions
- templates
- data binding
- lower thirds
- titles
- tickers
- scorebugs
- captions
- subtitles
- accessibility graphics
- graphics cueing
- animation coordination
- branding
- logos
- watermarks
- safe areas
- exclusion zones
- multi-format graphics
- Program, Preview, Clean Feed, AUX, ISO, horizontal, vertical, and square variants
- platform certification

Outcome:

UBOS has a certified deterministic graphics platform supporting all major broadcast graphics workflows.

Planned release:

- Tag: `v5.9.0`
- Title: UBOS v5.9 Graphics, Branding, Captions, and Multi-Format Output Platform

---

## v5.10 — Automation, Rundown, and Show-Control Platform

Purpose:

Connect all UBOS subsystems into one coordinated show execution workflow.

Recommended task sequence:

1. v5.10.1 — Automation, Rundown, and Show-Control Foundation
2. v5.10.2 — Rundown Item, Segment, and Cue-Stack Engine
3. v5.10.3 — Timed Events, Triggers, and Production Scheduling
4. v5.10.4 — Cross-System Production Macro and Action Orchestration
5. v5.10.5 — Operator Approval, Exception, and Recovery Coordination
6. v5.10.6 — Multi-Output Show Automation and Role Coordination
7. v5.10.7 — Automation and Show-Control Certification
8. v5.10.0 — Automation and Show-Control Platform Release

Primary capabilities:

- show rundowns
- segments
- cue stacks
- timed events
- production triggers
- cross-system actions
- scene actions
- graphics actions
- replay actions
- audio actions
- recording actions
- streaming actions
- operator approvals
- recovery and rollback
- multi-output automation

Outcome:

UBOS becomes architecturally end to end as one coordinated live-production operating system.

---

## v5.11 — Native Runtime and Real Media Execution

Purpose:

Connect the orchestration architecture to real media backends and devices.

Primary capabilities:

- real camera and capture-device input
- real audio input and output
- native decoders
- native encoders
- FFmpeg or GStreamer integration
- GPU compositing
- real text and graphics rasterization
- real image decoding
- actual file recording
- actual network streaming
- real transport protocols
- native replay execution
- hardware-control integration

Outcome:

UBOS transitions from a production-safe orchestration platform to a real media-execution system.

---

## v5.12 — Operator Experience, Deployment, and Product Hardening

Purpose:

Prepare UBOS for professional deployment and daily operational use.

Primary capabilities:

- operator UI completion
- control-room workflows
- workspace layouts
- monitoring
- alerting
- authentication
- authorization
- configuration management
- installer and upgrades
- deployment automation
- backup and recovery
- diagnostics
- support tooling
- licensing
- onboarding
- product telemetry
- reliability hardening

Outcome:

UBOS becomes a deployable commercial product.

---

## v6.0 — Public Production Release

Purpose:

Release UBOS as a complete commercial live-production operating system.

Expected requirements:

- architecture complete
- real media execution complete
- operator UI complete
- deployment complete
- security review complete
- performance validation complete
- long-run stability complete
- product documentation complete
- onboarding complete
- support process complete
- production certification complete

Outcome:

UBOS reaches full public production readiness.

---

# Product Maturity Stages

## Stage 1 — Foundation

Includes:

- v5.1
- v5.2
- v5.3

Result:

Deterministic execution, source, and media-processing foundations.

## Stage 2 — Production Engines

Includes:

- v5.4
- v5.5
- v5.6

Result:

Effects, live control, audio, recording, and output foundations.

## Stage 3 — Distribution and Content Workflows

Includes:

- v5.7
- v5.8
- v5.9

Result:

Streaming, replay, graphics, captions, branding, and multi-format workflows.

## Stage 4 — End-to-End Show Operation

Includes:

- v5.10

Result:

One automated and operator-controlled show workflow.

## Stage 5 — Real Media Product

Includes:

- v5.11
- v5.12

Result:

Real media execution, devices, UI, deployment, and product hardening.

## Stage 6 — Commercial Release

Includes:

- v6.0

Result:

Public production release.

---

# Current Position

At the completion of v5.9:

- UBOS is an advanced integrated broadcast-platform architecture
- major broadcast subsystems are defined and certified
- graphics and multi-format output are complete at the orchestration layer
- the platform is not yet fully end to end operational

At the completion of v5.10:

- UBOS becomes architecturally end to end
- show control coordinates the entire live-production workflow

At the completion of v5.11:

- UBOS gains real media and device execution

At the completion of v5.12:

- UBOS becomes deployable and product-ready

At v6.0:

- UBOS becomes ready for public production release

---

# Roadmap Governance

This roadmap is authoritative for milestone order.

Changes to the roadmap must:

- preserve architectural ownership
- avoid duplicate systems
- preserve completed release boundaries
- include a clear reason
- update task specifications
- update workflow state where applicable
- avoid silently renumbering completed phases

Detailed task execution remains governed by `MASTER-PLAN.md`.

---

# Immediate Next Milestones

Current:

- Complete v5.9 task sequence
- Certify v5.9
- Prepare v5.9.0 release

Next:

- Begin v5.10.1
- Build Automation, Rundown, and Show-Control Foundation

Future:

- v5.11 Native Runtime and Real Media Execution
- v5.12 Operator Experience and Product Hardening
- v6.0 Public Production Release