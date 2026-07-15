# UBOS Acceptance Tests

## Document Status

Document ID: 08  
Document Name: UBOS Acceptance Tests  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering  

---

# 1. Purpose

This document defines the mandatory acceptance tests for the Unified Broadcast Operating System.

Its purpose is to prevent features from being marked complete based only on:

- source code;
- compilation;
- unit tests;
- metadata changes;
- mocked services;
- synthetic lifecycle state;
- UI appearance;
- documentation;
- or internal validation.

A capability is accepted only when an operator can execute the workflow and verify the real result.

---

# 2. Acceptance Test Principles

Every acceptance test must:

1. use the actual UBOS runtime;
2. begin from the operator interface where applicable;
3. exercise the real command path;
4. reach the real execution backend;
5. verify the external result;
6. record evidence;
7. test cleanup and failure behavior;
8. report PASS, PARTIAL, FAIL, or BLOCKED_BY_EXTERNAL_DEPENDENCY.

A test may not be marked PASS when any mandatory step is skipped.

---

# 3. Approved Test Result Values

## PASS

All mandatory steps succeeded and real evidence exists.

## PARTIAL

Some real execution succeeded, but one or more mandatory criteria remain incomplete.

## FAIL

The implementation or workflow failed.

## BLOCKED_BY_EXTERNAL_DEPENDENCY

The repository implementation is ready, but testing cannot complete because of a specific external dependency.

Examples:

- no approved RTMP destination;
- unavailable platform API credentials;
- unavailable hardware;
- unsupported operating system dependency.

A vague blocker is not acceptable.

---

# 4. Required Evidence Format

Every test report must include:

- test name;
- date;
- operating system;
- branch;
- commit hash;
- runtime versions;
- commands executed;
- UI actions performed;
- logs;
- screenshots where useful;
- artifact path;
- file size;
- duration;
- codecs;
- process exit code;
- destination receipt evidence;
- connector health;
- cleanup result;
- final status;
- remaining blockers.

---

# 5. Environment Readiness Test

## Objective

Verify that the local UBOS environment is ready.

## Procedure

1. Open PowerShell.
2. Navigate to the repository.
3. Confirm Git status.
4. Confirm Node.js.
5. Confirm pnpm.
6. Confirm FFmpeg.
7. Confirm FFprobe.
8. Confirm required environment variables.
9. Confirm database and supporting services.
10. Start the web application.
11. Confirm the API responds.
12. Confirm the Control Room loads.

## Commands

```powershell
cd C:\Project\UnifiedLiveBroadcastOS

git status
node --version
pnpm --version
ffmpeg -version
ffprobe -version
where.exe ffmpeg
where.exe ffprobe
````

## Pass Criteria

* repository opens;
* Node.js works;
* pnpm works;
* FFmpeg works;
* FFprobe works;
* web runtime starts;
* API runtime starts;
* Control Room loads without fatal error.

---

# 6. FFmpeg and FFprobe Discovery Test

## Objective

Verify that the UBOS Node.js runtime can discover and execute FFmpeg and FFprobe.

## Procedure

1. Run the focused validation.
2. Confirm Node executes `ffmpeg -version`.
3. Confirm Node executes `ffprobe -version`.
4. Confirm executable paths are reported.
5. Confirm versions are parsed.
6. Confirm Windows paths containing spaces work.
7. Confirm missing-executable behavior is safe.

## Command

```powershell
pnpm validate:v512-native-runtime
```

## Pass Criteria

* FFmpeg state is AVAILABLE;
* FFprobe state is AVAILABLE;
* executable paths are non-null;
* versions are reported;
* no false MISSING state;
* test artifact is generated where included;
* process exits cleanly.

---

# 7. Browser Source Test

## Objective

Verify that a real browser source can enter UBOS.

## Procedure

1. Open the Control Room.
2. Add a camera, screen, or test video source.
3. Grant browser permissions.
4. Confirm motion appears.
5. Confirm source health.
6. Confirm source can be selected.
7. Confirm source can be removed.
8. Reconnect the source.

## Pass Criteria

* real media is visible;
* health reflects reality;
* source can enter Preview;
* disconnect is detected;
* reconnect works;
* source removal releases resources.

---

# 8. Preview Test

## Objective

Verify that Preview displays the selected source or scene without affecting Program.

## Procedure

1. Load Source A into Program.
2. Load Source B into Preview.
3. Confirm Program still shows Source A.
4. Confirm Preview shows Source B.
5. Change Preview selection.
6. Confirm Program remains unchanged.

## Pass Criteria

* Preview is independent;
* Program does not change until TAKE, CUT, or AUTO;
* Preview state is clearly identified;
* no stale or mismatched source appears.

---

# 9. CUT Switching Test

## Objective

Verify immediate Preview-to-Program switching.

## Procedure

1. Place Source A in Program.
2. Place Source B in Preview.
3. Click CUT.
4. Observe Program.
5. Observe Preview.
6. Record the operation.
7. Confirm the recorded output changes.

## Pass Criteria

* Program changes immediately;
* Preview updates correctly;
* tally is correct;
* command result is visible;
* native or browser recording reflects the switch;
* no duplicate command execution occurs.

---

# 10. AUTO Transition Test

## Objective

Verify timed Preview-to-Program transitions.

## Procedure

1. Place Source A in Program.
2. Place Source B in Preview.
3. Select a supported transition.
4. Set a duration.
5. Click AUTO.
6. Observe transition progress.
7. Record the output.
8. Confirm the transition appears in the artifact.

## Pass Criteria

* transition begins once;
* progress is visible;
* Program ends on Source B;
* duration is within tolerance;
* artifact contains the transition;
* cancellation and failure states are safe.

---

# 11. Browser Recording Test

## Objective

Verify browser-local Program recording.

## Procedure

1. Add a real source.
2. Take it to Program.
3. Start browser recording.
4. Record for at least ten seconds.
5. Switch scenes.
6. Stop recording.
7. Save or download the WebM artifact.
8. Open and play it.

## Pass Criteria

* artifact exists;
* size is greater than zero;
* duration is greater than zero;
* video plays;
* scene change appears;
* object URLs and tracks are cleaned up;
* duplicate start is rejected.

---

# 12. Native Recording Test

## Objective

Verify a real MP4 from the actual UBOS Program output.

## Procedure

1. Start UBOS locally.
2. Confirm FFmpeg and FFprobe readiness.
3. Add a real camera, screen, or playable source.
4. Load it into Preview.
5. Take it to Program.
6. Confirm Program audio where available.
7. Click Start Native.
8. Record for at least ten seconds.
9. Switch scenes.
10. Add a graphic.
11. Clear the graphic.
12. Click Stop Native.
13. Wait for finalization.
14. Retrieve the artifact path.
15. Run FFprobe.
16. Open and play the MP4.

## FFprobe Command

```powershell
ffprobe -v error `
  -show_entries format=duration,size `
  -show_entries stream=codec_type,codec_name `
  -of json `
  "PATH_TO_ARTIFACT.mp4"
```

## Pass Criteria

* Start Native succeeds;
* Stop Native succeeds;
* MP4 exists;
* size is greater than zero;
* duration is greater than zero;
* H.264 video exists;
* AAC audio exists when audio was present;
* scene changes appear;
* graphics appear and clear;
* artifact plays;
* FFmpeg exits cleanly;
* temporary resources are cleaned up.

---

# 13. Graphics Test

## Objective

Verify graphics affect the authoritative Program output.

## Procedure

1. Select or create a lower third.
2. Prepare it.
3. Take it to Program.
4. Confirm it appears in Program.
5. Record or stream the output.
6. Clear the graphic.
7. Confirm removal.
8. Verify both states in the artifact or remote output.

## Pass Criteria

* graphic appears;
* text and data are correct;
* clear removes it;
* Program and Preview behavior is correct;
* native artifact or remote output contains the change;
* metadata-only state is not accepted.

---

# 14. Audio Routing Test

## Objective

Verify a real audio source reaches Program.

## Procedure

1. Connect a microphone or media source with audio.
2. Route it to Program.
3. Confirm meter activity.
4. Record the output.
5. Play the artifact.
6. Confirm audio exists.

## Pass Criteria

* meter reflects real samples;
* Program audio is audible;
* recorded or streamed audio exists;
* disconnected source is detected;
* routing state matches output.

---

# 15. Audio Mute Test

## Objective

Verify mute affects actual Program audio.

## Procedure

1. Start with audible Program audio.
2. Begin recording.
3. Mute the source.
4. Wait several seconds.
5. Unmute.
6. Stop recording.
7. Play the artifact.

## Pass Criteria

* audio is audible before mute;
* audio is silent during mute;
* audio returns after unmute;
* UI state matches the actual result.

---

# 16. Audio Gain Test

## Objective

Verify gain affects actual audio level.

## Procedure

1. Begin recording a stable audio source.
2. Record at normal gain.
3. reduce gain;
4. increase gain;
5. stop recording;
6. inspect or measure the waveform.

## Pass Criteria

* recorded level changes in the expected direction;
* no excessive clipping is introduced;
* UI gain matches the real output;
* synthetic UI-only change is rejected.

---

# 17. Single RTMP or RTMPS Output Test

## Objective

Verify the actual UBOS Program reaches one remote destination.

## Procedure

1. Configure an approved RTMP or RTMPS endpoint.
2. Store the stream key through a secret reference.
3. Confirm runtime readiness.
4. Click Start Streaming.
5. Confirm connecting state.
6. Confirm live state.
7. Independently observe remote receipt.
8. Switch scenes.
9. Take a graphic.
10. Confirm remote changes.
11. Confirm Program audio remotely.
12. Click Stop Streaming.
13. Confirm process and connection close.

## Pass Criteria

* actual Program video is received;
* Program audio is received where expected;
* scene switch appears remotely;
* graphic appears remotely;
* secret is not exposed;
* real bitrate or process metrics are shown;
* clean stop succeeds;
* remote receipt is independently verified.

A successful FFmpeg process alone is not sufficient.

---

# 18. Multi-Destination Output Test

## Objective

Verify two simultaneous independent destinations.

## Procedure

1. Configure Destination A.
2. Configure Destination B.
3. Start both.
4. Confirm both receive Program.
5. Stop Destination A.
6. Confirm Destination B continues.
7. Restart Destination A.
8. Interrupt one destination.
9. Confirm failure isolation.
10. Stop all.

## Pass Criteria

* both destinations receive real media;
* state is independent;
* errors are destination-specific;
* stop-one works;
* stop-all works;
* one failure does not stop the other;
* reconnect is independent;
* metrics remain truthful.

---

# 19. Destination Profile Test

## Objective

Verify platform-specific output variants.

## Procedure

1. Configure one horizontal destination.
2. Configure one vertical destination.
3. Start both.
4. Confirm aspect ratios.
5. Apply destination-specific graphics.
6. Verify both outputs.

## Pass Criteria

* horizontal output is correct;
* vertical output is correct;
* graphics differ where configured;
* one profile change does not affect the other;
* outputs remain synchronized.

---

# 20. First Chat Connector Test

## Objective

Verify one real platform chat connector.

## Procedure

1. Authenticate a supported platform.
2. Select a live broadcast or channel.
3. Send a real audience message.
4. Confirm it appears in UBOS.
5. Confirm platform identity.
6. Reply from UBOS.
7. Confirm the reply appears on the platform.
8. Disconnect the connector.
9. Reconnect.
10. Send another message.

## Pass Criteria

* real inbound message appears;
* no duplicate appears;
* author and platform are correct;
* outbound reply reaches the platform;
* reconnect works;
* rate limits and failures are visible.

---

# 21. Unified Chat Test

## Objective

Verify real chat from two destinations appears in one timeline.

## Procedure

1. Connect Platform A.
2. Connect Platform B.
3. Send a message from each platform.
4. Confirm both appear together.
5. Filter by platform.
6. Reply to Platform A.
7. Reply to Platform B.
8. Disconnect one connector.
9. Confirm the other continues.

## Pass Criteria

* both messages appear;
* platform identity is preserved;
* filtering works;
* replies route correctly;
* connector failure is isolated;
* ordering and deduplication work.

---

# 22. Unified Moderation Test

## Objective

Verify moderation through supported platform capabilities.

## Procedure

1. Send a test message.
2. Flag it.
3. Apply a supported moderation action.
4. Confirm the action on the platform.
5. Attempt an unsupported action.
6. Confirm UBOS blocks or explains it.
7. Inspect audit history.

## Pass Criteria

* supported action succeeds;
* unsupported action is not faked;
* audit record exists;
* connector health remains stable;
* platform-specific capability limits are visible.

---

# 23. Remote Media Input Test

## Objective

Verify a remote contribution source becomes a real UBOS Source.

## Procedure

1. Start an RTMP, SRT, WebRTC, WHIP, or guest contribution.
2. Authenticate or authorize it.
3. Confirm source registration.
4. Confirm Preview.
5. Take it to Program.
6. Record it.
7. Stream it.
8. Disconnect and reconnect.

## Pass Criteria

* real remote media appears;
* latency and health are visible;
* Preview works;
* Program works;
* recording contains it;
* remote output contains it;
* reconnect succeeds.

---

# 24. Automation Test

## Objective

Verify automation affects real Program output.

## Procedure

1. Load a rundown.
2. Prepare a cue.
3. Execute the cue.
4. Confirm scene change.
5. Confirm graphic action.
6. Hold execution.
7. Resume execution.
8. Verify recording or streaming evidence.

## Pass Criteria

* automation uses real commands;
* exact-once execution;
* operator override works;
* hold and resume work;
* visible output changes;
* audit history is complete.

---

# 25. Replay Test

## Objective

Verify replay enters real Program output.

## Procedure

1. Capture a replay segment.
2. Load it into Preview.
3. Take it to Program.
4. Record or stream it.
5. Return to live Program.

## Pass Criteria

* replay is real media;
* replay appears in Program;
* output contains replay;
* audio is synchronized;
* return to live is clean;
* no metadata-only replay is accepted.

---

# 26. Persistence Test

## Objective

Verify important state survives restart where designed.

## Procedure

1. Configure scenes, sources, outputs, and settings.
2. Refresh the page.
3. Restart the web app.
4. Restart the database.
5. Reopen UBOS.
6. Inspect restored state.

## Pass Criteria

* persisted configuration returns;
* runtime-only state is not falsely restored;
* secrets remain protected;
* stale live state is not shown as active;
* migrations succeed.

---

# 27. Failure Recovery Test

## Objective

Verify UBOS degrades and recovers safely.

## Scenarios

* camera disconnect;
* microphone disconnect;
* FFmpeg crash;
* API disconnect;
* destination failure;
* chat connector failure;
* database restart;
* network interruption;
* invalid output path;
* disk full;
* permission denial.

## Pass Criteria

* failures are detected;
* operator receives exact reason;
* unaffected systems continue;
* retry or recovery works where designed;
* cleanup succeeds;
* no false healthy state appears.

---

# 28. Long-Running Test

## Objective

Verify stability during extended operation.

## Procedure

1. Start Program.
2. Start recording.
3. Start two destinations.
4. Connect chat.
5. Run for the defined test duration.
6. switch scenes periodically;
7. take and clear graphics;
8. monitor CPU, memory, disk, network, and process count;
9. stop safely.

## Pass Criteria

* no unacceptable memory growth;
* no leaked FFmpeg processes;
* no growing queues without bounds;
* stable A/V synchronization;
* destination reconnect remains functional;
* final artifacts are valid;
* shutdown is clean.

---

# 29. Security and Secret Redaction Test

## Objective

Verify credentials are never exposed.

## Procedure

1. Configure a destination secret.
2. Trigger success and failure paths.
3. Inspect:

   * UI;
   * logs;
   * errors;
   * telemetry;
   * history;
   * audit;
   * API responses.
4. Verify stored references.

## Pass Criteria

* no plaintext secret appears;
* masking is correct;
* logs are redacted;
* unauthorized users cannot retrieve secrets;
* secret references resolve only in the execution host.

---

# 30. UI Truthfulness Test

## Objective

Verify visible controls match real capability.

## Procedure

Inspect every visible:

* button;
* menu item;
* route;
* status;
* metric;
* form;
* panel.

## Pass Criteria

* enabled controls work;
* unavailable controls are disabled or hidden;
* blocked reasons are specific;
* routes exist;
* simulation is labeled;
* metadata-only state is labeled;
* no fake health, bitrate, or dropped frames;
* no dead controls remain enabled.

---

# 31. Release Acceptance Gate

UBOS may not be declared commercially ready until the following tests pass:

* environment readiness;
* FFmpeg discovery;
* native recording;
* graphics in native output;
* audio in native output;
* one real destination;
* two simultaneous destinations;
* first chat connector;
* unified chat across two connectors;
* moderation;
* remote media input;
* persistence;
* recovery;
* long-running stability;
* security and secret redaction;
* UI truthfulness.

Any incomplete mandatory test blocks General Availability.

---

# 32. Test Report Template

```markdown
## Test Report

Test:
Date:
Branch:
Commit:
Operator:
Operating System:
Runtime Versions:

### Commands

### UI Steps

### Evidence

### Artifacts

Artifact Path:
File Size:
Duration:
Video Codec:
Audio Codec:

### Remote Evidence

### Cleanup Result

### Blockers

### Final Status

PASS | PARTIAL | FAIL | BLOCKED_BY_EXTERNAL_DEPENDENCY
```

---

# 33. Summary

The UBOS acceptance standard is based on real operator outcomes.

A capability is not complete because its code exists.

It is complete when:

* the operator activates it;
* the runtime executes it;
* the external result exists;
* the result is verified;
* failures are handled;
* and resources are cleaned up.

The governing rule is:

> No evidence, no acceptance.

````




