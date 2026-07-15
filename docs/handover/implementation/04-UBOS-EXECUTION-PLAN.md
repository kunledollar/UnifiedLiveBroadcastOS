````markdown
# UBOS Execution Plan

## Document Status

Document ID: 04  
Document Name: UBOS Execution Plan  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering  

---

# 1. Purpose

This document defines the mandatory implementation order for completing the Unified Broadcast Operating System.

It exists to prevent:

- uncontrolled feature expansion,
- duplicate engines,
- metadata-only development,
- unrelated UI changes,
- skipped dependencies,
- and premature claims of completion.

Every engineering team, contractor, Cursor agent, Codex agent, or future contributor must follow this sequence unless the authoritative product documents are updated first.

The goal is not to build more subsystems.

The goal is to make the existing platform work as a real product.

---

# 2. Primary Product Goal

The primary commercial objective of UBOS is:

```text
Authorized social and remote media inputs
→ one UBOS production
→ one authoritative Program output
→ simultaneous multi-destination distribution
→ unified audience chat
→ two-way replies and moderation
````

The first commercially meaningful version of UBOS must allow an operator to:

1. receive a real source;
2. place it in Preview;
3. take it to Program;
4. record the actual Program output;
5. stream the actual Program output;
6. distribute it to more than one destination;
7. receive audience chat from those destinations;
8. view the messages in one timeline;
9. reply to the correct originating platform;
10. continue operating when one destination or connector fails.

---

# 3. Execution Principles

The following principles apply to every milestone.

## 3.1 One Milestone at a Time

Only one active milestone may be implemented at a time.

The next milestone may begin only when the current milestone has:

* passed its acceptance test,
* produced real evidence,
* been documented,
* been committed,
* and been added to the product truth record.

---

## 3.2 Real Execution Before Expansion

The following do not count as completion:

* UI existence,
* TypeScript compilation,
* metadata changes,
* mocked output,
* synthetic lifecycle,
* generated test state,
* architecture documentation,
* internal status labels.

A milestone is complete only when an operator performs the action and the real external result is verified.

---

## 3.3 Preserve Existing Architecture

Engineering must reuse:

* the existing Control Room,
* existing command paths,
* existing state ownership,
* existing media-plane abstractions,
* existing runtime adapters,
* existing health and telemetry,
* existing governance and audit services.

Do not create parallel systems unless a documented architectural gap makes reuse impossible.

---

## 3.4 Preserve the UI

The approved Control Room layout must remain stable.

Only changes needed for:

* readiness,
* errors,
* progress,
* failure state,
* runtime results,
* and truthful control availability

are allowed without explicit approval.

---

# 4. Mandatory Milestone Sequence

---

# Milestone 1 — FFmpeg and FFprobe Discovery

## Objective

Ensure the Node.js runtime used by UBOS can reliably find and execute FFmpeg and FFprobe on Windows, macOS, and Linux.

## Required Work

* direct Node execution of `ffmpeg -version`;
* direct Node execution of `ffprobe -version`;
* configured absolute-path support;
* bundled-path support;
* system-PATH support;
* Windows `where.exe` path reporting;
* macOS/Linux executable path reporting;
* CRLF-safe version parsing;
* paths with spaces;
* meaningful failure states.

## Pass Criteria

* UBOS Node runtime reports FFmpeg as available;
* UBOS Node runtime reports FFprobe as available;
* real executable paths are shown;
* versions are parsed;
* `pnpm validate:v512-native-runtime` passes;
* a deterministic native test artifact can be created and verified.

## Prohibited Shortcut

Do not claim success because PowerShell can run FFmpeg. The UBOS runtime itself must run it.

---

# Milestone 2 — Native Recording from Actual Program Output

## Objective

Generate a real playable MP4 from the actual UBOS Program output through the existing Control Room.

## Required Execution Path

```text
Control Room
→ Program MediaStream
→ native recording command
→ server/native execution host
→ FFmpeg
→ H.264/AAC MP4
→ FFprobe validation
→ artifact returned to operator
```

## Required Work

* start native recording from the UI;
* capture actual Program video;
* capture actual Program audio where available;
* transfer media to the native host;
* start FFmpeg;
* show preparing and recording states;
* stop cleanly;
* finalize the artifact;
* validate with FFprobe;
* return file path, size, duration, and codecs;
* preserve browser recording fallback.

## Pass Criteria

* Start Native works;
* Stop Native works;
* MP4 exists;
* file size is nonzero;
* duration is nonzero;
* video codec is H.264;
* audio codec is AAC when Program audio exists;
* file plays;
* process exits cleanly;
* temporary resources are cleaned up.

## Stop Condition

Do not begin streaming work until this milestone passes.

---

# Milestone 3 — Graphics and Audio in Native Recording

## Objective

Prove that the native output matches the real Program experience.

## Required Work

* take a lower third or title;
* verify it appears in Program;
* record it;
* clear it;
* verify the change in the artifact;
* mute Program audio;
* verify recorded audio changes;
* change gain;
* verify recorded audio level changes;
* confirm Preview is not recorded instead of Program.

## Pass Criteria

* graphics are visibly present in the MP4;
* clearing graphics changes the MP4;
* mute affects the recording;
* gain affects the recording;
* Program and Preview remain isolated;
* audio and video remain synchronized.

---

# Milestone 4 — One Real Custom RTMP or RTMPS Destination

## Objective

Stream the actual UBOS Program output to one approved destination.

## Required Execution Path

```text
Program output
→ native execution host
→ FFmpeg
→ H.264/AAC
→ RTMP or RTMPS
→ remote ingest
→ remote playback or probe verification
```

## Required Work

* configure one destination;
* validate URL;
* use secret references;
* start the real encoder;
* expose connecting, live, reconnecting, failed, and stopped states;
* collect real bitrate;
* collect dropped-frame or transport diagnostics;
* support clean stop;
* verify remote receipt independently.

## Pass Criteria

* actual Program video reaches the destination;
* actual Program audio reaches the destination where available;
* scene changes appear remotely;
* graphics appear remotely;
* remote receipt is independently verified;
* secrets never appear in logs;
* stopping closes the process and destination cleanly.

## Stop Condition

Do not begin multi-destination output until this milestone passes.

---

# Milestone 5 — Two Simultaneous Destinations

## Objective

Send the same Program output to two independent destinations.

## Required Work

* create two destination sessions;
* maintain separate lifecycle states;
* maintain separate metrics;
* support stop-one;
* support stop-all;
* isolate failures;
* implement per-destination reconnect.

## Pass Criteria

* both destinations receive the stream;
* one destination may fail while the other continues;
* operator can stop one without stopping the other;
* status and errors remain destination-specific;
* secrets remain isolated;
* metrics are truthful.

---

# Milestone 6 — Unified Output Profiles

## Objective

Allow destinations to receive platform-appropriate output profiles.

## Required Work

* resolution profiles;
* aspect-ratio profiles;
* bitrate profiles;
* audio profiles;
* captions;
* safe-area rules;
* destination-specific graphics;
* horizontal and vertical Program variants.

## Pass Criteria

* one horizontal output is verified;
* one vertical output is verified;
* destination-specific overlays are visible;
* profile changes do not affect unrelated destinations;
* output health remains independent.

---

# Milestone 7 — First Real Chat Connector

## Objective

Connect one real platform chat into UBOS.

## Recommended Initial Target

Choose one platform based on:

* API availability,
* authentication feasibility,
* live-chat read support,
* reply support,
* moderation support,
* testability.

## Required Work

* authentication;
* channel or broadcast selection;
* live message ingestion;
* normalized message model;
* deduplication;
* reconnect;
* rate-limit handling;
* reply to originating platform;
* audit;
* connector health.

## Pass Criteria

* a real audience message enters UBOS;
* correct platform identity is shown;
* reply reaches the platform;
* duplicate messages are not displayed twice;
* connector reconnects;
* errors are visible.

---

# Milestone 8 — Second Real Chat Connector and Unified Timeline

## Objective

Combine real messages from two platforms into one operator timeline.

## Required Work

* add a second connector;
* normalize both message types;
* preserve platform identity;
* filter by destination;
* reply through the correct connector;
* maintain per-connector health;
* isolate failures.

## Pass Criteria

* messages from both platforms appear together;
* operator can filter by platform;
* replies return to the correct platform;
* one connector may fail without stopping the other;
* duplicate and ordering rules work.

---

# Milestone 9 — Unified Moderation

## Objective

Moderate audience activity from multiple platforms through one interface.

## Required Work

* common moderation queue;
* capability mapping by platform;
* hide/delete where allowed;
* mute/ban where allowed;
* spam detection;
* keyword rules;
* operator notes;
* audit trail;
* AI-assisted moderation with human approval.

## Pass Criteria

* supported actions work on each connected platform;
* unsupported actions are clearly marked;
* audit history is complete;
* one moderation rule can apply across connectors;
* no platform capability is falsely advertised.

---

# Milestone 10 — First Real Social or Remote Media Input

## Objective

Receive one authorized live media source from outside the local browser and normalize it into a UBOS Source.

## Recommended Initial Paths

Prefer an accessible and standards-based path:

* RTMP ingest;
* SRT ingest;
* WebRTC or WHIP contribution;
* browser guest;
* remote contribution agent.

A direct social-platform ingest may be added where APIs and permissions allow.

## Required Work

* authentication;
* source registration;
* media normalization;
* health;
* latency;
* reconnect;
* preview;
* Program use;
* recording;
* output.

## Pass Criteria

* real remote media appears in Preview;
* can be taken to Program;
* can be recorded;
* can be streamed;
* reconnect works;
* source health is truthful.

---

# Milestone 11 — Social Platform Output Connectors

## Objective

Move beyond generic RTMP where platform APIs support richer integration.

## Required Work

* platform authentication;
* broadcast creation;
* stream configuration;
* lifecycle synchronization;
* title and description management;
* ingest health;
* status and error mapping;
* connector-specific capability matrix.

## Pass Criteria

* at least one platform connector creates and starts a real broadcast;
* remote receipt is verified;
* title and metadata sync works;
* errors are mapped truthfully;
* generic RTMP fallback remains available.

---

# Milestone 12 — Cross-Share and Cross-Follow

## Objective

Add growth functions only after the core broadcast and chat loop works.

## Required Work

* platform-specific calls to action;
* cross-share workflows;
* cross-platform promotion;
* audience migration prompts;
* analytics;
* platform capability restrictions;
* consent and policy compliance.

## Pass Criteria

* real supported share action completes;
* follow prompts use supported platform mechanisms;
* unsupported actions are not simulated;
* engagement results are measurable.

---

# Milestone 13 — Runtime Hardening

## Objective

Make all verified workflows reliable enough for commercial use.

## Required Work

* long-running sessions;
* memory monitoring;
* CPU monitoring;
* process crash recovery;
* network interruption;
* destination reconnect;
* source reconnect;
* temporary-file cleanup;
* safe shutdown;
* restart recovery;
* degraded operation;
* watchdog incidents;
* load testing.

## Pass Criteria

* extended runs complete without unacceptable leaks;
* failures recover or degrade safely;
* one connector failure does not collapse the system;
* all native processes are cleaned up;
* health and alerts reflect reality.

---

# Milestone 14 — Automation, Rundown, Replay, and Cue Activation

## Objective

Connect advanced existing engines to real Program execution.

## Required Work

* rundown cues trigger actual scenes;
* graphics cues affect Program;
* replay appears in Program;
* hold/resume works;
* exact-once execution;
* operator override;
* recovery;
* audit.

## Pass Criteria

* automation controls real output;
* duplicate execution is prevented;
* operator remains authoritative;
* replay and cues are visible in recording and streaming;
* recovery restores valid state.

---

# 5. Milestone Governance

Every milestone must include:

* a written objective;
* implementation scope;
* acceptance test;
* validation commands;
* real evidence;
* known limitations;
* commit hash;
* final status.

Allowed final status values:

* PASS
* PARTIAL
* FAIL
* BLOCKED_BY_EXTERNAL_DEPENDENCY

A milestone may only be marked PASS when all mandatory acceptance criteria succeed.

---

# 6. Required Evidence

Every completed milestone report must include:

* files changed;
* commands run;
* runtime environment;
* logs;
* media artifact path where applicable;
* file size;
* duration;
* codecs;
* process exit code;
* remote destination evidence;
* screenshots or end-to-end results;
* remaining blockers;
* commit hash.

---

# 7. Forbidden Development Behavior

Engineering must not:

* skip milestones;
* add unrelated features;
* redesign the Control Room;
* create duplicate engines;
* create duplicate state owners;
* claim success from mocked tests;
* claim streaming success without remote receipt;
* claim recording success without a playable artifact;
* claim unified chat without real platform messages;
* expose unsupported controls;
* create release tags without authorization;
* automatically advance roadmap phases.

---

# 8. Immediate Active Milestone

At the time of this document version, the active milestone is:

# Milestone 1 — FFmpeg and FFprobe Discovery

The next milestone may begin only when:

```text
pnpm validate:v512-native-runtime
```

reports a successful runtime discovery result and the UBOS Node.js process can directly execute FFmpeg and FFprobe.

---

# 9. Summary

The UBOS Execution Plan is deliberately narrow and sequential.

The platform must first prove:

* native media execution,
* real recording,
* real streaming,
* multiple destinations,
* real chat,
* unified moderation,
* and remote media input.

Only after those foundations work should engineering expand into growth, AI, cloud scale, and advanced ecosystem capabilities.

The execution sequence protects UBOS from becoming a large collection of impressive but disconnected systems.

The measure of progress is simple:

> Does the operator complete a real workflow and verify the result?

````


