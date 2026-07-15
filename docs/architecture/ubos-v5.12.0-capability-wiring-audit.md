# UBOS v5.12.0 Capability Wiring Audit

This audit is the product-truth baseline for UBOS v5.12.0. It intentionally replaces a broad GA-readiness interpretation with a wiring-first milestone: every visible surface must be `LIVE`, `SIMULATED`, `UNAVAILABLE`, or `DEAD`.

## Classification rules

| State | Meaning | UI treatment |
| --- | --- | --- |
| `LIVE` | End-to-end command reaches a verified real execution backend, mutates authoritative state, exposes health/failure, and has validation evidence. | Enabled. |
| `SIMULATED` | End-to-end behavior uses deterministic browser/local/synthetic backend only. | Enabled only when labeled Demo/Simulation/Synthetic. |
| `UNAVAILABLE` | Architecture or UI exists, but execution is incomplete or unverified. | Disabled or rendered read-only with missing dependency. |
| `DEAD` | No valid route, command, owner, backend, or product purpose. | Removed from production navigation. |

## Route inventory

| Route | Workspace | Component | Current classification | Final classification | Corrective action | Validation evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Entry | `apps/web/app/page.tsx` | LIVE | LIVE | Keep navigation to production entry points. | Route file exists. |
| `/control-room` | Control Room | `apps/web/app/control-room/page.tsx` | SIMULATED | SIMULATED | Keep enabled with browser/local runtime truth labels. | Primary vertical workflow below. |
| `/guest` | Guest | `apps/web/app/guest/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep as separate operator surface until transport verification. | Route file exists; no verified guest media transport. |
| `/destinations` | Outputs | `apps/web/app/destinations/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep read-only/config focused; do not claim transmission. | Route file exists; no approved test destination verified. |
| `/developer` | Developer | `apps/web/app/developer/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep developer metadata surface. | Route file exists. |
| `/admin` | Admin | `apps/web/app/admin/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep admin metadata surface. | Route file exists. |
| `/external/program` | External monitor | `apps/web/app/external/program/page.tsx` | SIMULATED | SIMULATED | Label as app-state monitor, not SDI/NDI output. | Route file exists. |
| `/external/preview` | External monitor | `apps/web/app/external/preview/page.tsx` | SIMULATED | SIMULATED | Label as app-state monitor. | Route file exists. |
| `/external/multiview` | External monitor | `apps/web/app/external/multiview/page.tsx` | SIMULATED | SIMULATED | Label as app-state multiview. | Route file exists. |
| `/control-room/engine` | Runtime diagnostics | `apps/web/app/control-room/engine/page.tsx` | UNAVAILABLE | UNAVAILABLE | Continue showing unavailable runtime execution. | Route file exists and page text states no runtime connected. |
| `/control-room/render` | Render diagnostics | `apps/web/app/control-room/render/page.tsx` | UNAVAILABLE | UNAVAILABLE | Continue showing renderer unavailable. | Route file exists. |
| `/control-room/render-v2` | Render diagnostics | `apps/web/app/control-room/render-v2/page.tsx` | UNAVAILABLE | UNAVAILABLE | Continue showing renderer unavailable unless backend verified. | Route file exists. |
| `/control-room/media-runtime` | Media diagnostics | `apps/web/app/control-room/media-runtime/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep diagnostic-only runtime page. | Route file exists. |
| `/control-room/audio-runtime` | Audio diagnostics | `apps/web/app/control-room/audio-runtime/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep meter/DSP unavailable labels. | Route text states metering unavailable. |
| `/control-room/recording-runtime` | Recording diagnostics | `apps/web/app/control-room/recording-runtime/page.tsx` | SIMULATED | SIMULATED | Browser MediaRecorder only; do not mark broadcast recorder LIVE. | Existing smoke doc requires playable WebM manual verification. |
| `/control-room/webrtc-runtime` | WebRTC diagnostics | `apps/web/app/control-room/webrtc-runtime/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep transport unavailable. | Route file exists. |
| `/control-room/broadcast-io` | Broadcast I/O | `apps/web/app/control-room/broadcast-io/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep I/O unverified/metadata only. | Route file exists. |
| `/control-room/automation` | Automation | `apps/web/app/control-room/automation/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep execution unavailable. | Components state execution unavailable. |
| `/control-room/ai-director` | AI Director | `apps/web/app/control-room/ai-director/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep disabled/unavailable until model/backend verified. | Route file exists. |
| `/control-room/monitor-wall` | Monitor wall | `apps/web/app/control-room/monitor-wall/page.tsx` | SIMULATED | SIMULATED | Layout metadata only; no decoded wall output claim. | Route file exists. |
| `/control-room/analytics` | Analytics | `apps/web/app/control-room/analytics/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep as metadata analytics surface. | Route file exists. |
| `/control-room/security` | Security | `apps/web/app/control-room/security/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep policy/audit metadata only. | Route file exists. |
| `/control-room/cluster` | Cluster | `apps/web/app/control-room/cluster/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep cluster metadata only. | Route file exists. |
| `/control-room/plugins` | Plugins | `apps/web/app/control-room/plugins/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep plugin metadata only until runtime install verified. | Route file exists. |
| `/control-room/cloud` | Cloud | `apps/web/app/control-room/cloud/page.tsx` | UNAVAILABLE | UNAVAILABLE | Keep cloud metadata only. | Route file exists. |
| `/control-room/settings` | Menu target | none | DEAD | DEAD | Removed from active menu by disabling Preferences. | `scripts/validate-v512-capability-wiring.mjs`. |
| `/control-room/streaming-runtime` | Menu target | none | DEAD | DEAD | Removed from active menu by disabling Stream Settings. | `scripts/validate-v512-capability-wiring.mjs`. |
| `/control-room/compositor` | Menu target | none | DEAD | DEAD | Removed from active menu by disabling Compositor menu item. | `scripts/validate-v512-capability-wiring.mjs`. |

## Primary vertical workflow status

| Step | UI control | Command / handler | Runtime owner / backend | State source | Persistence | Final classification | Validation evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Open production | `/control-room` load | page/server actions load state | Next.js app + DB-backed scene actions where configured | Production/scene state | Database plus local UI state | SIMULATED | Route exists; no native broadcast backend required. |
| Add verified test source | Source browser add source | `createSource` / browser capture handlers | Browser MediaDevices or deterministic metadata source | Scene source state | Source metadata persists; MediaStream does not | SIMULATED | Browser APIs are real local capture but not certified broadcast ingest. |
| Create scene | Scene browser action | `createScene` | Scene action persistence | Scene table/state | Database | SIMULATED | Scene metadata persists. |
| Place source in scene | Source add/update | `createSource` / `updateSourceSettings` | Scene action persistence | Scene source state | Database | SIMULATED | Source metadata persists. |
| Load scene to Preview | Scene selection | graph-backed preview selection | Production graph reducer | Program/Preview scene ids | Server-side production switching state | SIMULATED | Existing Program/Preview workflow documentation. |
| Take Preview to Program | TAKE/CUT/AUTO | `TAKE_PREVIEW`, `CUT_TO_PROGRAM`, `AUTO_TRANSITION` | Production graph reducer | Program/Preview scene ids | Server-side production switching state | SIMULATED | Existing Program/Preview workflow documentation. |
| Apply title/graphic | Graphics dock | local graphics state handlers | Browser/UI metadata renderer | Graphics metadata | Runtime/UI metadata | SIMULATED | Must not claim renderer output. |
| Start recording | Recording operations panel | browser recording handler | Browser `MediaRecorder` when available | Recording state/history | Browser runtime plus metadata history | SIMULATED | Existing smoke doc requires playable WebM verification. |
| Observe health | Monitor overlays / runtime panels | state selectors | Browser/local telemetry and unavailable markers | Health metadata | Runtime-only | SIMULATED | Unknown/stale displayed as unavailable, not healthy. |
| Stop safely | Recording stop | browser recording stop handler | Browser `MediaRecorder` | Recording finalization state | Browser blob/history | SIMULATED | Existing smoke doc requires clean stop and no duplicate start. |
| Verify artifact | Download WebM | browser object URL | Browser blob | Recording history/blob | Browser runtime only | SIMULATED | Manual playable-file validation required for PASS; not proven by TS. |

## Control inventory summary

| Surface | Controls audited | LIVE | SIMULATED | UNAVAILABLE | DEAD removed/disabled | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Routes/navigation | 29 | 1 | 5 | 20 | 3 | Three dead hrefs were disabled in production menus. |
| Control Room primary controls | 18 | 0 | 14 | 4 | 0 | CUT/TAKE/AUTO and browser recording are simulated/local until native execution is verified. |
| Graphics controls | 7 | 0 | 4 | 3 | 0 | Metadata-only rendering must remain labeled. |
| Audio controls | 6 | 0 | 0 | 6 | 0 | Metering/DSP unavailable unless real audio backend connected. |
| Recording/output controls | 10 | 0 | 3 | 7 | 0 | Recording is browser-local; streaming/network outputs unverified. |

## Release decision

**FAIL for GA/RC certification.** UBOS v5.12.0 may proceed only as a wiring and truth-foundation milestone. A full PASS requires a truthful complete vertical operator workflow with verified media artifact or approved transmission evidence. Current verified product truth is: browser/local production workflow is `SIMULATED`, many diagnostics are `UNAVAILABLE`, and dead menu routes have been disabled.

## Step 2 UI-to-runtime wiring result

Step 2 does **not** advance the workflow to v5.12.1 and does **not** certify v5.12.0 as complete. It verifies the enabled Control Room vertical path as a browser/local simulated production workflow with database-backed scene/switching metadata, disables unbacked output transmission, and records remaining blockers.

### Every audited route

The Step 1 route inventory remains authoritative for production navigation. Step 2 rechecked the 29 route entries above and the three missing menu targets (`/control-room/settings`, `/control-room/streaming-runtime`, `/control-room/compositor`) remain hidden/disabled rather than linked.

### Step 2 control wiring matrix

| Control | UI component | Handler | Typed command | Transport | Processor | Engine/backend | Authoritative state | Persistence | Before | Corrective action | After | Validation evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Source selection | `SourceDockPanel` / `SourceBrowser` | `onSelectSource` / `handleSelectSource` | `SELECT_SOURCE_UI` | React local state | `SceneWorkspace` selection state | Browser UI inspector | `selectedSourceId` | None | SIMULATED | Kept enabled as inspector focus only. | SIMULATED | Source selection changes the inspector; no media execution claim. |
| Source add/place | `SourceDockPanel` source add | `onSourceAdd` | `addSource(FormData)` | Next server action plus optional browser capture | `scene-actions.addSource` | Prisma scene-source metadata; browser `MediaDevices` for local capture | Optimistic source list and DB reload | `SceneSource` table | SIMULATED | Documented as metadata plus browser-local capture, not certified ingest. | SIMULATED | Handler creates an optimistic source, may request camera/screen/mic, then calls `addSource`. |
| Scene selection | `SceneBrowser` row | `onSceneSwitch` / `stageScene` | `PREVIEW_SCENE` + `PreviewCommand` | Local graph dispatcher, `ProductionRuntime`, Next server action | `SceneSelectionController`, `updateProductionState` | Production graph/runtime metadata and Prisma | `productionState.previewSceneId` | `BroadcastSession.productionConfig` | SIMULATED | Kept enabled with typed command and persisted preview assignment. | SIMULATED | Preview monitor and state update after command. |
| Scene create | Scene add control | `onSceneAdd` | `addScene(FormData)` | Next server action | `scene-actions.addScene` | Prisma scene metadata | Optimistic scene list and DB reload | `Scene` table | SIMULATED | Kept enabled. | SIMULATED | Form data submitted to server action. |
| Preview assignment | Scene browser / preview bus | `stageScene` | `PreviewCommand(sceneId)` | `ProductionRuntime.dispatch` + Next server action | `ProductionRuntime`, `updateProductionState` | Runtime switching metadata and DB config | `previewSceneId` | `BroadcastSession.productionConfig` | SIMULATED | Kept enabled with pending/confirmed UI via `useTransition` and preview monitor. | SIMULATED | `stageScene` dispatches command and persists preview. |
| Program take | `TAKE` | `switchProgram(productionState.transitionType)` | `CUT_TO_PROGRAM` or `AUTO_TRANSITION` | `ProductionRuntime`, graph dispatcher, Next server action | `TransitionController` | Production graph/runtime metadata and DB config | `programSceneId`, feedback, history | `BroadcastSession.productionConfig` | SIMULATED | Kept enabled as simulated/local switching. | SIMULATED | Program monitor, history, and feedback update. |
| CUT | `CUT` | `switchProgram('cut')` | `CutCommand` + `CUT_TO_PROGRAM` | `ProductionRuntime` + graph dispatcher | `TransitionController` | Production graph/runtime metadata and DB config | `programSceneId`, `lastTransitionLabel` | `BroadcastSession.productionConfig` | SIMULATED | Kept enabled. | SIMULATED | Displays `Cut Complete`. |
| AUTO | `AUTO` | `switchProgram('fade')` | `AutoCommand` + `AUTO_TRANSITION` | `ProductionRuntime` + graph dispatcher | `TransitionController` | Production graph/runtime metadata and DB config | `programSceneId`, `transitionActive` | `BroadcastSession.productionConfig` | SIMULATED | Kept enabled. | SIMULATED | Displays transition active/complete states. |
| Transition selection | `TransitionSelector` | `onTransitionChange` | `SET_TRANSITION` | Graph dispatcher + Next server action | Production graph dispatcher / `updateProductionState` | Graph metadata and DB config | `transitionType` | `BroadcastSession.productionConfig` | SIMULATED | Kept enabled. | SIMULATED | Selector value is normalized and persisted. |
| Transition duration | `TransitionDurationControl` | `onDurationChange` | `SET_TRANSITION_DURATION` | Graph dispatcher + Next server action | `normalizeTransitionDuration`, `updateProductionState` | Graph metadata and DB config | `transitionDuration` | `BroadcastSession.productionConfig` | SIMULATED | Kept enabled. | SIMULATED | Duration is normalized and persisted. |
| Graphics prepare | `GraphicsPreviewControls` | `dispatchGraphics({ type: 'SEND_TO_PREVIEW' })` | `GRAPHICS_SEND_TO_PREVIEW` | React reducer | `graphicsCompositionReducer` | Browser metadata overlay renderer | `previewLayerIds` | None | SIMULATED | Kept with metadata/simulation labels. | SIMULATED | Preview overlay IDs change. |
| Graphics take | `GraphicsPreviewControls` | `dispatchGraphics({ type: 'TAKE_TO_PROGRAM' })` | `GRAPHICS_TAKE_TO_PROGRAM` | React reducer | `graphicsCompositionReducer` | Browser metadata overlay renderer | `programLayerIds` | None | SIMULATED | Kept with metadata/simulation labels. | SIMULATED | Program overlay IDs change. |
| Graphics clear | `GraphicsPreviewControls` | `CLEAR_PREVIEW` / `CLEAR_PROGRAM` dispatch | `GRAPHICS_CLEAR_*` | React reducer | `graphicsCompositionReducer` | Browser metadata overlay renderer | Preview/program layer IDs | None | SIMULATED | Kept with metadata/simulation labels. | SIMULATED | Overlay IDs are removed. |
| Recording start | `RecordingRuntimePanel` | `startSmokeRecording` | `BROWSER_MEDIARECORDER_START` | Browser `MediaRecorder` | `createProgramRecordingStream` / `startSmokeRecording` | Browser canvas/capture stream to WebM blob | `browserRecordingPanelState` | Browser memory/object URL only | SIMULATED | Labeled browser-local; no broadcast recorder claim. | SIMULATED | Displays preparing, recording, failed, and metadata-only states. |
| Recording stop | `RecordingRuntimePanel` | `stopSmokeRecording` | `BROWSER_MEDIARECORDER_STOP` | Browser `MediaRecorder` | `MediaRecorder.onstop` | Browser blob finalization | Completed history/download URL | Browser memory/object URL only | SIMULATED | Labeled browser-local. | SIMULATED | Completed state and Download WebM link. |
| Output start | `StreamingRuntimePanel` | Disabled | None | None | None | Missing FFmpeg/native/browser streaming adapter | Blocked reason text | Metadata inputs only | SIMULATED | Disabled to avoid fake success behavior. | UNAVAILABLE | Start button disabled with exact missing dependency. |
| Output stop | `StreamingRuntimePanel` | Disabled | None | None | None | Missing active real output session | Blocked reason text | Metadata inputs only | SIMULATED | Disabled to avoid fake stop behavior. | UNAVAILABLE | Stop button disabled with exact missing dependency. |
| Audio mute | `SourceBrowser` mute / `M` shortcut | `onSourceToggleMute` / `setRouteMuted` | `SOURCE_MUTE_METADATA` / `ROUTE_SET_MUTED` | React state or Next server action | Source settings update / media-route action | Metadata route state only; no DSP | Source/route muted metadata | Route metadata only | UNAVAILABLE | Not called real audio DSP. | UNAVAILABLE | No connected mixer/runtime owner for audio processing. |
| Audio gain | `ProfessionalAudioMixer` compact | Read-only/no verified gain handler | None | None | None | Missing audio mixer runtime | Metadata display | None | UNAVAILABLE | Remains disabled/read-only. | UNAVAILABLE | No gain backend connected. |
| Navigation | Menus/rails | Next `Link` or disabled menu metadata | `NAVIGATE_ROUTE` | Next router | App Router | Existing route page | URL and rendered page | None | DEAD for 3 missing targets | Missing settings/streaming/compositor hrefs hidden/disabled. | SIMULATED for valid routes; DEAD hidden for missing routes | Validator rejects enabled missing hrefs. |
| Keyboard shortcuts | Window `keydown` listener | `useEffect` handler | `PreviewCommand`, `CutCommand`, `AutoCommand`, `ROUTE_SET_MUTED` | DOM keyboard to same handlers | `stageScene`, `switchProgram`, `setRouteMuted` | Same graph/runtime metadata | Preview/program/mute metadata | DB config/route metadata | SIMULATED | Kept enabled. | SIMULATED | Space, 1-9, C, A/F, and M map to wired handlers. |

### Vertical workflow verification

| Workflow step | Result | Evidence |
| --- | --- | --- |
| Create/open production | SIMULATED | `/control-room` opens demo broadcast state from server actions and demo persistence diagnostics. |
| Select or add source | SIMULATED | Source selection is local inspector state; add source persists metadata and may start browser-local capture. |
| Create/select scene | SIMULATED | Scene creation persists metadata; scene selection dispatches preview command and persists `previewSceneId`. |
| Place source in scene | SIMULATED | `addSource` stores a `SceneSource` row scoped to the scene. |
| Send scene to Preview | SIMULATED | `stageScene` dispatches `PreviewCommand` and `PREVIEW_SCENE`, then persists production config. |
| Take Preview to Program | SIMULATED | TAKE/CUT/AUTO dispatch runtime and graph commands, update monitor state, and persist `programSceneId`. |
| Prepare and take a title | SIMULATED | Graphics reducer sends layer to preview/program as metadata overlay state. |
| Clear the title | SIMULATED | Graphics reducer clears preview/program overlay IDs. |
| Attempt recording | SIMULATED | Browser `MediaRecorder` can create a local WebM when supported; unsupported browsers show failed/blocked state. |
| Attempt controlled output | UNAVAILABLE | Output start/stop controls are disabled because no FFmpeg/native/browser streaming transport adapter is connected. |
| Stop safely | SIMULATED/UNAVAILABLE | Browser recording stop finalizes blob; output stop is disabled unless a real output session exists. |
| Verify final state/artifact | BLOCKED FOR LIVE | Browser recording artifact can be downloaded manually; real recording/streaming artifact is not certified. |

### Automated validation added

`pnpm validate:v512-wiring` now checks the wiring manifest, required Control Room handlers/commands, disabled unbacked output controls, missing-route hiding, recording state labels, simulation labels, and prevents `LIVE` claims without runtime evidence.

### Final Step 2 counts

| Metric | Count |
| --- | ---: |
| Routes audited | 29 |
| Controls audited | 21 |
| LIVE | 0 |
| SIMULATED | 17 |
| UNAVAILABLE | 4 |
| DEAD | 0 enabled controls; 3 hidden routes |
| Controls wired | 17 |
| Controls disabled | 3 |
| Controls removed | 0 |
| Routes hidden | 3 |
| Real media operations verified | 1 browser-local `MediaRecorder` path, 0 certified broadcast media operations |
| Remaining blockers | 4 control blockers: output start, output stop, audio mute DSP, audio gain DSP; plus no certified live renderer/recorder/streamer artifact |

## Step 2 release decision

**Blocked for real runtime certification.** The Control Room vertical workflow is demonstrably wired as a truthful browser/local simulation with database-backed metadata for scenes and switching. It is not v5.12.0 complete for LIVE broadcast runtime because output transmission, real audio DSP/gain, certified renderer output, and certified recording/streaming artifacts remain unavailable.

## Step 3 Real Engine Activation and Adapter Integration

Step 3 keeps the workflow on **UBOS v5.12.0** and does not create a release tag. The approved Control Room UI baseline is the merged Step 1/initial Step 2 layout at commit `244c7d8`; Step 3 protects Program, Preview, source grid, scene grid, transitions, audio, graphics, recording, and outputs structural anchors and only preserves visual changes needed for truthful capability labels and runtime wiring.

### Step 3 real browser Program/Preview path

The existing Control Room browser media path is now treated as a real browser execution path when a camera/screen source or capturable media element exists. `stageScene` assigns Preview through typed production commands; `switchProgram` takes Preview to Program and turns the browser media stream on-air, making the visible Program output follow the selected Preview stream. This is classified as `LIVE_BROWSER`, not native broadcast output.

### Step 3 browser recording verification

The browser-local `MediaRecorder` workflow is upgraded from smoke metadata to artifact verification. Recording finalization now verifies non-empty bytes, video MIME type, measurable duration, and playback eligibility before exposing a local WebM object URL. Failures leave the operator in a failed state with an explicit reason. This supports `LIVE_BROWSER` for browser recording start/stop only when the browser can provide a capturable Program stream.

### Step 3 native adapter contract

A native adapter boundary now exists in `@ubos/media-plane` with initialize, start, stop, health, metrics, diagnostics/stderr, cancellation, shutdown, and artifact/transport result surfaces. The first concrete implementation is an FFmpeg recording adapter with executable discovery, safe argument construction, `shell: false` process spawning, bounded/redacted stderr capture, timeout, cancellation, clean shutdown, exit-code mapping, health, telemetry, and artifact-path reporting.

### Step 3 RTMP adapter status

A first Custom RTMP/RTMPS adapter contract exists with destination configuration, secret references, connection lifecycle (`connecting`, `live`, `reconnecting`, `degraded`, `failed`, `stopped`), bitrate/dropped-frame metrics, explicit stop, redacted destination reporting, and remote receipt verification hook. It remains **PARTIAL / UNAVAILABLE for production** until an approved test destination is configured and receipt verification succeeds.

### Step 3 classification update

| Control | Step 2 classification | Step 3 classification | Evidence |
| --- | --- | --- | --- |
| Source add/place | SIMULATED | LIVE_BROWSER | Browser `MediaDevices` source acquisition is used when permission is granted; deterministic validation protects the browser-local path. |
| Preview assignment | SIMULATED | LIVE_BROWSER | Preview assignment reaches typed command/runtime state and can attach an actual browser stream/media element. |
| Program take | SIMULATED | LIVE_BROWSER | Taking Preview to Program turns the browser stream on-air and changes visible Program output. |
| CUT | SIMULATED | LIVE_BROWSER | CUT dispatches typed command and updates browser Program output. |
| AUTO | SIMULATED | LIVE_BROWSER | AUTO dispatches typed command and updates Program after browser transition timing. |
| Recording start | SIMULATED | LIVE_BROWSER | `MediaRecorder` starts only when a capturable Program stream exists and displays pending/active state. |
| Recording stop | SIMULATED | LIVE_BROWSER | Stop finalizes a verified non-empty playable WebM artifact before exposing download. |
| Output start | UNAVAILABLE | UNAVAILABLE | FFmpeg/RTMP contracts exist, but no approved native executable plus remote receipt destination is certified in this environment. |
| Output stop | UNAVAILABLE | UNAVAILABLE | Stop is available at adapter-contract level but not exposed as LIVE without a real active transport session. |
| Audio mute/gain | UNAVAILABLE | UNAVAILABLE | No real audio DSP/gain backend connected. |

### Final Step 3 counts

| Metric | Count |
| --- | ---: |
| Routes audited | 29 |
| Controls audited | 21 |
| LIVE_BROWSER | 7 |
| LIVE_NATIVE | 0 |
| SIMULATED | 10 |
| UNAVAILABLE | 4 |
| DEAD | 0 enabled controls; 3 hidden routes |
| Controls wired | 17 |
| Controls disabled | 3 |
| Controls removed | 0 |
| Routes hidden | 3 |
| Real media operations verified | Browser Program/Preview media switching path and browser `MediaRecorder` artifact verification path |
| Remaining blockers | Native FFmpeg executable availability, approved RTMP/RTMPS test destination receipt, certified live renderer output, audio DSP/gain backend |

## Step 3 release decision

**PARTIAL.** Browser-local Program/Preview switching and browser recording can be classified `LIVE_BROWSER` with validation evidence. `LIVE_NATIVE` remains 0 because FFmpeg and RTMP are implemented as adapter boundaries/contracts but are not certified against an available executable and approved remote test destination in this environment. v5.12.0 is not advanced to v5.12.1.

## Step 4 Native Runtime Bring-Up and First Real RTMP Broadcast

Step 4 remains within **UBOS v5.12.0**. The selected authoritative native execution host is the **API/server-side Node.js process host**: browser UI may request runtime work but must not spawn FFmpeg directly. Ownership is assigned as follows:

| Area | Owner |
| --- | --- |
| Process lifecycle | API/server native media host |
| Program media ingress | Server/native media handoff; Step 4 validation uses deterministic `lavfi` video/audio bytes |
| Secrets | Secret references only; no plaintext stream keys in logs, telemetry, errors, or history |
| Encoder | FFmpeg process launched with argv array and `shell: false` |
| Transport | FFmpeg Custom RTMP/RTMPS FLV muxer when approved destination is configured |
| Health/telemetry | Native runtime validation publishes executable path, versions, artifact result, duration, codecs, bitrate-capable transport state |
| Cancellation/shutdown | Host sends process signals, captures bounded stderr, and validates clean exit/timeout behavior |

### Step 4 FFmpeg / FFprobe discovery

`pnpm validate:v512-native-runtime` performs real host discovery in this order: configured executable path support in adapter APIs, bundled-path extension point, and system `PATH` through `command -v`. It executes `ffmpeg -version` and `ffprobe -version`, parses versions, and supports `AVAILABLE`, `MISSING`, `UNSUPPORTED_VERSION`, `PROBE_MISSING`, and `STARTUP_FAILED` result states.

### Step 4 local native recording certification

Before RTMP certification, Step 4 validates a deterministic native recording path:

Program media bytes → API/server native process host → FFmpeg → H.264 video + AAC audio → MP4 artifact → FFprobe validation.

The validation uses actual FFmpeg inputs (`testsrc2` video and `sine` audio), encodes H.264/AAC into MP4, stops cleanly, checks file size, then uses FFprobe JSON to verify nonzero duration, video stream presence, H.264 codec, audio stream presence, and AAC codec. Native recording is not exposed as a Control Room `LIVE_NATIVE` control until the runtime host is connected to actual Program media and UI commands.

### Step 4 Program media handoff contract

The handoff contract is actual media bytes, not metadata:

| Field | Step 4 value |
| --- | --- |
| Video transport | Native process stdin/file/device/pipe extension point; validation uses FFmpeg `lavfi` bytes |
| Audio transport | Native process stdin/file/device/pipe extension point; validation uses FFmpeg `lavfi` sine bytes |
| Pixel format | `yuv420p` for H.264 compatibility |
| Sample format | AAC encoder at 48 kHz |
| Resolution | 1280x720 validation profile |
| Frame rate | 30 fps validation profile |
| Timestamps | FFmpeg generated timestamps from deterministic sources |
| A/V sync | FFmpeg muxing validated by FFprobe duration/stream checks |
| Backpressure | Native process stderr bounded; process timeout and termination paths validated |
| Reconnect | RTMP adapter state supports reconnecting/degraded; receipt certification requires approved destination |
| Shutdown | Explicit SIGINT/SIGTERM and timeout paths validated by native adapter tests |

### Step 4 Custom RTMP/RTMPS status

Only Custom RTMP/RTMPS is in scope. Destination validation accepts `rtmp://` and `rtmps://`; stream keys must be represented by secret references. FFmpeg RTMP transmission and independent receipt verification remain `BLOCKED_BY_TEST_DESTINATION` unless `UBOS_V512_RTMP_URL` and `UBOS_V512_RTMP_SECRET_REF` are provided for an approved local RTMP server or approved test destination.

A successful FFmpeg process alone is not sufficient for PASS; the release remains PARTIAL without independent remote receipt evidence.

### Step 4 Control Room output gating

Start Streaming remains disabled unless all runtime predicates are true: native host connected, FFmpeg available, FFprobe available, Program media present, destination valid, credentials available by secret reference, and adapter healthy. Stop Streaming is enabled only for connecting/live/reconnecting/degraded states. The Control Room layout is unchanged; only the blocked reason is updated.

### Final Step 4 counts

| Metric | Count |
| --- | ---: |
| LIVE_NATIVE controls | 0 |
| LIVE_BROWSER controls | 7 |
| Remaining SIMULATED controls | 10 |
| Remaining UNAVAILABLE controls | 4 |
| Native recording certification | Implemented by `pnpm validate:v512-native-runtime`; PASS only when host FFmpeg/FFprobe are present |
| RTMP certification | `BLOCKED_BY_TEST_DESTINATION` unless approved destination and secret reference are supplied |

## Step 4 release decision

**PARTIAL pending host validation.** The code now contains the native runtime discovery and deterministic FFmpeg recording validation needed to certify native recording on a host with FFmpeg/FFprobe. In this execution container, real discovery commands must be treated as authoritative for availability. Custom RTMP/RTMPS remains blocked until an approved receipt-verifiable destination is provided. v5.12.0 is not advanced to v5.12.1.
