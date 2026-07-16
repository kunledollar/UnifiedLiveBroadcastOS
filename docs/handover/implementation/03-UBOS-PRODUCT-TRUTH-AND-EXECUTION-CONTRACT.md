
# UBOS Product Truth and Execution Contract

## Document Status

Document ID: 03  
Document Name: UBOS Product Truth and Execution Contract  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering  

---

# 1. Purpose

This document defines the current operational truth of the Unified Broadcast Operating System.

It must be read before any engineer, contractor, Cursor agent, Codex agent, or third-party development team changes the platform.

Its purpose is to distinguish between:

- real working execution,
- browser-only execution,
- partial integration,
- simulation,
- metadata-only implementation,
- unavailable capability,
- and future plans.

No capability may be described as complete merely because:

- code exists,
- a UI exists,
- a command exists,
- a model exists,
- validation passes,
- metadata changes,
- or documentation has been written.

A capability is complete only when an operator can execute it and verify the real external result.

---

# 2. Primary Product Objective

The primary objective of UBOS is to deliver one unified social broadcasting workflow:

```text
Authorized social and remote media input
→ UBOS production
→ authoritative Program output
→ simultaneous multi-destination distribution
→ unified audience chat
→ two-way reply and moderation
````

The current priority is not to add more engines.

The priority is to make the existing platform work end to end.

---

# 3. Approved Capability Classifications

Every capability must use one of the following classifications.

## LIVE_BROWSER

The capability performs real execution inside the browser and produces a verifiable result.

Example:

* Browser MediaRecorder creates a playable WebM artifact.

## LIVE_NATIVE

The capability reaches a real native or server-side runtime and produces a verifiable result.

Example:

* FFmpeg creates a playable MP4 from the actual UBOS Program output.

## SIMULATED

The capability operates through a synthetic, mocked, deterministic, or demonstration backend.

Simulation must always be clearly labeled.

## METADATA_ONLY

The capability stores state or configuration but does not perform the real operation.

Example:

* Streaming status changes to `streaming`, but no network media is transmitted.

## PARTIALLY_WIRED

Some elements of the execution path exist, but the complete workflow is not yet operational.

## UNAVAILABLE

The capability has no complete execution path and must remain disabled.

## DEAD

The capability has no valid route, owner, backend, or product purpose and should be removed.

No alternative classification may be introduced without updating this document.

---

# 4. Confirmed Working Capabilities

## 4.0 Workspace Manager (Control Room Layout)

The following workspace management capabilities are confirmed working in-browser:

* 9 workspace presets: Director, Solo Streamer, Technical Director, Audio Engineer, Graphics Operator, Replay Operator, Streaming Operator, Monitor Wall, Compact
* zone collapse/expand (left dock, right dock, bottom workspace)
* per-preset saved layouts (isolated per preset; Save does not overwrite other presets)
* Reset Layout (restores current preset factory defaults; not blocked by lock)
* Lock Layout (prevents manual drag-resize; does not block preset switching, Save, or Reset)
* ribbon badge and menu checkmarks always reflect the same authoritative `activePresetId`
* preset switching persists across page reload
* keyboard shortcuts: Ctrl+1-5 (preset), Ctrl+S (save), Ctrl+Shift+L (reset)
* per-preset zone size defaults (`zoneSizeDefaults`) applied at full-width viewports:
  - Audio Engineer: bottom workspace 360px (expanded for audio mixer)
  - Streaming Operator: right dock 340px, bottom workspace 300px
  - Monitor Wall: bottom workspace 400px (expanded for monitor grid)
  - Technical Director: right dock 320px, bottom workspace 320px
  - Graphics Operator: left dock 240px, bottom workspace 340px
  - Replay Operator: bottom workspace 360px (expanded for timeline)
* Program/Preview flex sizing restored: min-widths reduced to 320/240px so emphasis changes produce visible ratios at typical desktop viewports
* Responsive compact-width safety rule (PR-F, 1200–1439px) preserved; `zoneSizeDefaults` do not override the compact-width safety constraint

Classification:

**LIVE_BROWSER** (logic verified; browser visual evidence pending)

Updated: 2026-07-16

---

## 4.1 Repository and Platform Foundation

The following are implemented:

* pnpm monorepo structure,
* modular applications and packages,
* shared TypeScript configuration,
* package-level validation,
* Git-based release workflow,
* engineering standards,
* Codex workflow files,
* documentation structure,
* shared UI package,
* core platform package,
* media-plane package.

Classification:

**Implemented platform foundation**

---

## 4.2 Browser Production

Confirmed browser capabilities include:

* browser media acquisition,
* Program monitor,
* Preview monitor,
* source placement,
* scene selection,
* Preview assignment,
* Program take,
* browser CUT behavior,
* browser AUTO behavior,
* browser-local Program capture,
* browser MediaRecorder recording,
* WebM artifact creation,
* basic browser playback eligibility checks.

Classification:

**LIVE_BROWSER**, where actual browser media is present.

---

## 4.3 FFmpeg Host Installation

On the maintainer’s Windows development machine:

* FFmpeg 8.1.2 is installed,
* FFprobe 8.1.2 is installed,
* `ffmpeg -version` succeeds,
* `ffprobe -version` succeeds,
* `where.exe ffmpeg` resolves the executable,
* `where.exe ffprobe` resolves the executable.

Classification:

**Host dependency available**

This does not by itself prove UBOS native recording or streaming.

---

## 4.4 Graphics Platform

Implemented components include:

* graphics definitions,
* graphics elements,
* layers,
* instances,
* lifecycle models,
* commands,
* events,
* health,
* telemetry,
* validation,
* graphics platform certification.

Classification:

**Architecture and orchestration implemented**

Real final-output rendering must still be verified against the native Program path.

---

## 4.5 Automation Platform

Implemented components include:

* automation foundations,
* rundowns,
* cue stacks,
* macros,
* trigger scheduling,
* show control,
* operator override,
* recovery,
* replay coordination,
* audit coordination,
* validation and certification.

Classification:

**Architecture and orchestration implemented**

Automation must still be proven against real native media output.

---

## 4.6 Enterprise Platform

Implemented areas include:

* observability,
* telemetry,
* metrics,
* incident response,
* capacity planning,
* operational analytics,
* release governance,
* security operations,
* compliance,
* risk management,
* multi-tenancy,
* delegated administration,
* marketplace,
* extension framework,
* developer ecosystem,
* documentation and certification foundations.

Classification:

**Enterprise foundations implemented**

These services do not prove real broadcast execution.

---

# 5. Partially Working Capabilities

## 5.1 Native Runtime Discovery

Implemented:

* FFmpeg discovery logic,
* FFprobe discovery logic,
* version parsing,
* runtime health representation,
* native-runtime status API,
* native-runtime validation script.

Known issue:

The Node.js validation path has reported FFmpeg as missing even when PowerShell can execute it.

Required resolution:

* verify direct Node execution,
* remove Windows lookup assumptions,
* support explicit executable paths,
* verify PATH inheritance in the real UBOS runtime.

Classification:

**PARTIALLY_WIRED**

---

## 5.2 Native Recording

Implemented:

* Control Room native recording controls,
* browser Program MediaStream capture,
* MediaRecorder chunk collection,
* API upload route,
* server-side FFmpeg bridge,
* MP4 transcoding logic,
* FFprobe artifact validation,
* artifact result fields,
* browser recording fallback.

Not yet proven:

* Start Native works from the actual Control Room,
* real Program media reaches the server,
* FFmpeg starts from the production runtime,
* Stop Native finalizes the artifact,
* H.264 is verified,
* AAC is verified where audio exists,
* the MP4 plays correctly,
* scene and graphics changes appear in the MP4.

Classification:

**PARTIALLY_WIRED**

---

## 5.3 Streaming

Implemented:

* destination configuration,
* Custom RTMP and RTMPS validation,
* secret-reference concept,
* lifecycle states,
* runtime adapter contracts,
* dynamic readiness concepts,
* FFmpeg streaming primitives,
* streaming UI.

Not yet proven:

* real Program media reaches FFmpeg,
* H.264/AAC stream is produced,
* RTMP or RTMPS connection succeeds,
* remote receipt is verified,
* reconnection works,
* stop behavior works,
* bitrate reflects a real encoder,
* dropped frames reflect real transport behavior.

Classification:

**UNAVAILABLE until verified**

---

## 5.4 Multi-Destination Output

Implemented:

* architectural models,
* destination objects,
* output concepts.

Not yet proven:

* simultaneous delivery to two or more destinations,
* independent output lifecycle,
* failure isolation,
* per-destination reconnect,
* stop-one and stop-all behavior.

Classification:

**METADATA_ONLY or PARTIALLY_WIRED**

---

## 5.5 Audio

Implemented:

* audio controls,
* state models,
* routing concepts,
* mute and gain metadata.

Not yet proven:

* real PCM processing,
* real gain adjustment,
* real mute,
* real Program mix,
* A/V synchronization,
* audio in native recording,
* audio in remote stream.

Classification:

**PARTIALLY_WIRED**

---

## 5.6 Native Compositor

Implemented:

* Program and Preview state,
* scene models,
* browser-visible switching,
* compositor-related architecture.

Not yet proven:

* GPU or native compositor,
* frame-accurate rendering,
* graphics and source layering in native output,
* native Program frame generation.

Classification:

**PARTIALLY_WIRED**

---

# 6. Simulated or Metadata-Only Capabilities

The following must not be presented as real execution unless separately verified:

* synthetic streaming lifecycle,
* synthetic bitrate values,
* synthetic dropped-frame values,
* mock transport success,
* destination records without remote receipt,
* recording records without media files,
* generated health state without real backend checks,
* test patterns that bypass the actual Program output,
* social platform entries without real platform APIs,
* unified chat models without real messages,
* audio meters generated without real audio samples,
* plugin records without executable plugin runtime,
* analytics without authoritative runtime events.

---

# 7. Capabilities Not Yet Working

The following remain incomplete:

* certified native recording,
* certified RTMP or RTMPS output,
* multi-destination streaming,
* destination-specific rendering,
* native audio DSP,
* native GPU compositor,
* SRT certification,
* WebRTC certification,
* NDI certification,
* social media as a live input,
* social media output connectors beyond generic RTMP,
* unified chat,
* two-way social replies,
* unified moderation,
* cross-share,
* cross-follow,
* audience identity,
* live social analytics,
* social-to-guest escalation,
* AI producer,
* AI switching,
* cloud rendering,
* distributed production clusters.

These capabilities must remain clearly marked as future, unavailable, or partial.

---

# 8. Core Definition of a Working UBOS Product

The minimum commercially meaningful UBOS product must allow an operator to complete the following workflow:

```text
Open UBOS
→ add a real camera, screen, file, or remote source
→ load the source into Preview
→ take Preview to Program
→ confirm Program visibly changes
→ confirm Program audio exists
→ add a title or graphic
→ confirm the graphic appears in Program
→ start recording
→ stop recording
→ receive a playable verified file
→ configure two destinations
→ start both outputs
→ verify both destinations receive the stream
→ receive chat from both destinations
→ view chat in one timeline
→ reply to each originating platform
→ continue operating if one destination fails
→ stop safely
```

Until this workflow succeeds, UBOS is not considered operationally complete.

---

# 9. Immediate Engineering Priorities

The mandatory order is:

1. Fix FFmpeg and FFprobe discovery in the Node.js runtime.
2. Certify native recording from the actual UBOS Program output.
3. Verify graphics and audio inside native recording.
4. Certify one Custom RTMP or RTMPS destination.
5. Certify two simultaneous destinations.
6. Add one real chat connector.
7. Add a second real chat connector.
8. Build one unified chat timeline.
9. Add replies to the originating platform.
10. Add moderation.
11. Add one approved social or remote media input.
12. Add destination-specific output profiles.
13. Harden reconnect, recovery, cleanup, and long-running reliability.
14. Only then expand into cross-share, cross-follow, AI, and cloud scale.

No phase should be skipped.

---

# 10. Engineering Prohibitions

Until core execution works, engineering must not prioritize:

* new speculative engines,
* new decorative dashboards,
* placeholder pages,
* broad UI redesign,
* marketplace expansion,
* certification frameworks unrelated to current execution,
* unsupported social-platform claims,
* additional metadata-only services,
* automatic roadmap advancement,
* release tags.

---

# 11. Evidence Required for Completion

A feature may be reclassified only when evidence exists.

## Native Recording Evidence

Required:

* real Control Room start,
* real Control Room stop,
* artifact path,
* nonzero file size,
* nonzero duration,
* H.264 video,
* AAC audio where applicable,
* FFprobe output,
* playable result,
* clean process exit.

## Streaming Evidence

Required:

* real destination,
* real encoder process,
* real network connection,
* remote receipt,
* visible scene change remotely,
* audible Program audio remotely,
* graphic visibility remotely,
* clean stop,
* secret redaction,
* reconnect or failure evidence.

## Unified Chat Evidence

Required:

* real message from platform A,
* real message from platform B,
* both displayed in one timeline,
* correct platform identity,
* reply reaches correct platform,
* connector failure isolation,
* deduplication,
* moderation capability mapping.

---

# 12. Change Control

This document must be updated whenever a capability changes classification.

Examples:

* `PARTIALLY_WIRED` to `LIVE_NATIVE`,
* `UNAVAILABLE` to `PARTIALLY_WIRED`,
* `SIMULATED` to `LIVE_BROWSER`,
* `DEAD` removed.

Every status update must reference:

* validation command,
* acceptance test,
* artifact or remote evidence,
* commit hash,
* date.

No undocumented status promotion is allowed.

---

# 13. Current Handover Decision

UBOS has strong architecture, broad subsystem coverage, and substantial enterprise foundations.

The principal remaining problem is integration.

The next team must not measure progress by how many new files or engines are added.

Progress must be measured by real operator outcomes:

* media enters,
* media is switched,
* media is recorded,
* media is distributed,
* audiences respond,
* conversations are unified,
* failures recover safely.

That is the execution standard for UBOS.





## 2026-07-16 Regression Contract Clarification

Program and Preview labels are not sufficient evidence of scene switching. The selected scene must resolve to its own source collection and renderer binding. Recording must capture the authoritative Program monitor after CUT/AUTO/TAKE, not a stale or Preview stream.
