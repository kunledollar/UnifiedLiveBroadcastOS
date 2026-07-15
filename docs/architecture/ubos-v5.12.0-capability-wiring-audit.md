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
