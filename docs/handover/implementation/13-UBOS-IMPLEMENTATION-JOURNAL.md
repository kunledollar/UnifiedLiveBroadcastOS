\# UBOS Implementation Journal



\## Document Status



Document ID: 13  

Document Name: UBOS Implementation Journal  

Version: 1.0  

Status: Authoritative and Continuously Updated  

Owner: UBOS Core Engineering  

Last Updated: 2026-07-15  



\---



\# 1. Purpose



This document is the permanent engineering progress journal for the Unified Broadcast Operating System.



It records the real implementation and verification history of every UBOS execution milestone.



This journal must document:



\- what was attempted;

\- what was implemented;

\- what was tested;

\- what passed;

\- what failed;

\- what evidence was produced;

\- what commit contains the work;

\- and what remains to be completed.



This document is not a roadmap.



The roadmap describes intended future work.



This journal records what actually happened.



\---



\# 2. Relationship to Other Documents



This journal works together with:



\- `03-UBOS-PRODUCT-TRUTH-AND-EXECUTION-CONTRACT.md`

\- `04-UBOS-EXECUTION-PLAN.md`

\- `05-UBOS-SUBSYSTEM-MATRIX.md`

\- `08-UBOS-ACCEPTANCE-TESTS.md`

\- `10-UBOS-CAPABILITY-MATRIX.md`



The responsibilities are different:



| Document | Responsibility |

|---|---|

| Product Truth | Current real state of the product |

| Execution Plan | Required implementation order |

| Subsystem Matrix | Internal subsystem status |

| Acceptance Tests | Required proof |

| Capability Matrix | Customer-visible capability status |

| Implementation Journal | Historical milestone evidence |



\---



\# 3. Milestone Status Values



Each milestone must use one of these statuses:



\- `NOT\_STARTED`

\- `IN\_PROGRESS`

\- `PASS`

\- `PARTIAL`

\- `FAIL`

\- `BLOCKED\_BY\_EXTERNAL\_DEPENDENCY`



A milestone may only be marked `PASS` when all mandatory acceptance criteria have succeeded.



\---



\# 4. Authoritative Milestone List



The current execution plan contains 14 milestones.



| Milestone | Name | Current Status |

|---:|---|---|

| 1 | FFmpeg and FFprobe Discovery | PASS |

| 2 | Native Recording from Actual Program Output | NOT\_STARTED |

| 3 | Graphics and Audio in Native Recording | NOT\_STARTED |

| 4 | One Real Custom RTMP or RTMPS Destination | NOT\_STARTED |

| 5 | Two Simultaneous Destinations | NOT\_STARTED |

| 6 | Unified Output Profiles | NOT\_STARTED |

| 7 | First Real Chat Connector | NOT\_STARTED |

| 8 | Second Real Chat Connector and Unified Timeline | NOT\_STARTED |

| 9 | Unified Moderation | NOT\_STARTED |

| 10 | First Real Social or Remote Media Input | NOT\_STARTED |

| 11 | Social Platform Output Connectors | NOT\_STARTED |

| 12 | Cross-Share and Cross-Follow | NOT\_STARTED |

| 13 | Runtime Hardening | NOT\_STARTED |

| 14 | Automation, Rundown, Replay, and Cue Activation | NOT\_STARTED |



\---



\# 5. Milestone 1 — FFmpeg and FFprobe Discovery



\## Status



`PASS`



\## Objective



Ensure that the Node.js runtime used by UBOS can reliably discover and execute FFmpeg and FFprobe on Windows.



\## Initial Problem



PowerShell could execute:



```text

ffmpeg -version

ffprobe -version

where.exe ffmpeg

where.exe ffprobe

	## 2026-07-15 — Milestone 2 — Native Recording from Actual Program Output

### Status

PARTIAL

### Objective

Record the actual UBOS Program output through the existing Control Room, transfer the captured Program media to the server-side native runtime, transcode it through FFmpeg, validate the resulting MP4 through FFprobe, and return the verified artifact to the operator.

### Root Causes Found

1. The native recording state machine remained in `completed` after a successful recording, preventing the Start Native control from becoming ready again.
2. FFprobe stderr output was concatenated with stdout in the Next.js process, corrupting the JSON response and causing parsing failures.
3. The recording lifecycle lacked an explicit `stopping` state.
4. Periodic native-runtime polling could overwrite active recording or finalization state.
5. Temporary WebM source files were not removed after successful transcoding.
6. Audio expectation was inferred from MIME type rather than actual live audio tracks.

### Implementation

- Corrected the native recording lifecycle.
- Added the complete state sequence:

```text
unavailable
→ ready
→ preparing
→ recording
→ stopping
→ finalizing
→ verified
→ ready