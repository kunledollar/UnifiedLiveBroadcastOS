# UBOS Cursor Rules

## Document Status

Document ID: 09  
Document Name: UBOS Cursor Rules  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering  

---

# 1. Purpose

This document defines the mandatory operating rules for Cursor when working on the Unified Broadcast Operating System.

Cursor must treat these rules as project-level engineering instructions.

The purpose is to prevent:

- broad uncontrolled edits;
- duplicate architecture;
- accidental UI redesign;
- metadata-only implementations;
- unsupported completion claims;
- skipped milestones;
- and unrelated repository changes.

Cursor must optimize for one objective:

> Make UBOS work as a real end-to-end live social broadcasting product.

---

# 2. Required Documents

Before making any implementation change, Cursor must read:

1. `MASTER-PLAN.md`
2. `ROADMAP.md`
3. `.codex/ENGINEERING-STANDARDS.md`
4. `.codex/WORKFLOW-STATE.md`
5. `docs/handover/implementation/01-UBOS-OVERVIEW.md`
6. `docs/handover/implementation/02-UBOS-ARCHITECTURE.md`
7. `docs/handover/implementation/03-UBOS-PRODUCT-TRUTH-AND-EXECUTION-CONTRACT.md`
8. `docs/handover/implementation/04-UBOS-EXECUTION-PLAN.md`
9. `docs/handover/implementation/05-UBOS-SUBSYSTEM-MATRIX.md`
10. `docs/handover/implementation/06-UBOS-RUNTIME-TOPOLOGY.md`
11. `docs/handover/implementation/07-UBOS-UI-BASELINE.md`
12. `docs/handover/implementation/08-UBOS-ACCEPTANCE-TESTS.md`

Cursor must not begin implementation before understanding the active milestone and current product truth.

---

# 3. Primary Product Objective

The highest product priority is:

```text
Authorized social and remote media input
→ UBOS production
→ authoritative Program output
→ simultaneous multi-destination output
→ unified audience chat
→ two-way replies and moderation
````

All implementation decisions should strengthen this execution loop.

Cursor must not prioritize unrelated systems while this loop remains incomplete.

---

# 4. Current Mandatory Execution Order

Cursor must work in this order:

1. FFmpeg and FFprobe discovery.
2. Native recording from actual Program output.
3. Graphics and audio in native recording.
4. One real Custom RTMP or RTMPS destination.
5. Two simultaneous destinations.
6. Destination-specific output profiles.
7. First real chat connector.
8. Second real chat connector and unified timeline.
9. Unified moderation.
10. First real social or remote media input.
11. Platform-specific output connectors.
12. Cross-share and cross-follow.
13. Runtime hardening.
14. Automation, rundown, replay, and cue activation.

Cursor must not skip ahead.

---

# 5. One Milestone at a Time

Cursor must execute only one active milestone per task.

A milestone is complete only when:

* the acceptance test passes;
* real external evidence exists;
* the product truth document is updated;
* the subsystem matrix is updated;
* one focused commit is created;
* and the final report is produced.

Cursor must stop after completing the active milestone.

It must not automatically continue to the next milestone.

---

# 6. Product Truth Rules

Cursor must use only these capability classifications:

* `LIVE_BROWSER`
* `LIVE_NATIVE`
* `PARTIALLY_WIRED`
* `SIMULATED`
* `METADATA_ONLY`
* `UNAVAILABLE`
* `DEAD`
* `FOUNDATION_IMPLEMENTED`

Cursor must never describe a capability as live because:

* code exists;
* TypeScript compiles;
* a unit test passes;
* metadata changes;
* a UI control exists;
* a status label changes;
* a mock backend responds;
* a synthetic test pattern works;
* documentation exists.

A capability is live only when a real operator workflow produces a verifiable result.

---

# 7. Real Execution Requirements

## Recording

Cursor must not claim native recording works unless:

* Start Native is initiated from the Control Room;
* actual Program media reaches the native runtime;
* FFmpeg creates a real artifact;
* FFprobe verifies the artifact;
* duration is nonzero;
* file size is nonzero;
* video codec is H.264;
* audio codec is AAC where audio exists;
* the file plays;
* cleanup succeeds.

## Streaming

Cursor must not claim streaming works unless:

* actual Program video reaches the encoder;
* actual Program audio reaches the encoder where available;
* the real destination receives the stream;
* remote receipt is independently verified;
* scene changes are visible remotely;
* graphics are visible remotely;
* secrets remain redacted;
* stop and cleanup work.

## Unified Chat

Cursor must not claim unified chat works unless:

* real messages arrive from at least two platforms;
* both appear in one timeline;
* platform identity is preserved;
* replies return through the correct connector;
* one connector can fail without stopping the other.

---

# 8. Architecture Rules

Cursor must:

* reuse existing subsystems;
* preserve subsystem ownership;
* follow the documented runtime topology;
* use existing command paths;
* use existing state ownership;
* use existing media-plane abstractions;
* use existing health and telemetry systems;
* use existing audit and governance services;
* prefer adapters over core modification.

Cursor must not:

* create a second command bus;
* create a second Production Graph;
* create a second recording engine;
* create a second streaming engine;
* create a second state owner;
* create duplicate panels for the same capability;
* bypass the API or runtime boundary;
* allow the browser to spawn FFmpeg directly;
* allow platform services to own media;
* allow UI components to modify runtime state directly.

---

# 9. UI Protection Rules

Cursor must preserve the approved Control Room baseline.

Protected regions include:

* Program monitor;
* Preview monitor;
* source area;
* scene area;
* transition controls;
* graphics controls;
* audio controls;
* recording controls;
* streaming controls;
* runtime status;
* operator navigation.

Allowed UI changes:

* dynamic readiness;
* pending state;
* progress;
* exact errors;
* blocked reasons;
* real metrics;
* runtime results;
* artifact details;
* simulation labels;
* accessibility fixes;
* wiring existing controls;
* removing dead controls.

Prohibited UI changes:

* broad redesign;
* moving Program or Preview;
* replacing the main grid;
* renaming established production concepts;
* adding duplicate panels;
* adding placeholder routes;
* adding decorative dashboards;
* hiding functional controls;
* changing unrelated styles;
* exposing unsupported features.

---

# 10. Scope Control Rules

Cursor must make the smallest coherent change necessary to complete the active milestone.

Before editing, Cursor must identify:

* exact root cause;
* affected files;
* existing abstractions;
* expected execution path;
* acceptance criteria.

Cursor must not modify unrelated files.

If a broad change appears necessary, Cursor must first explain why the existing architecture cannot support the milestone.

---

# 11. Repository Safety Rules

Before making changes, Cursor must:

1. run `git status`;
2. inspect the current branch;
3. inspect recent commits;
4. identify uncommitted work;
5. avoid overwriting unrelated local changes;
6. avoid rewriting history unless explicitly authorized.

Cursor must not:

* force push;
* delete branches;
* reset hard;
* remove untracked user files;
* change release tags;
* create release tags;
* automatically advance roadmap phases.

---

# 12. Validation Rules

Cursor must run focused validation for the active milestone.

It must also run relevant regression validation.

Typical validation includes:

```text
git diff --check
lint
typecheck
build
focused tests
runtime tests
acceptance tests
```

Compilation alone is never sufficient.

Cursor must run the real operator acceptance test where the environment permits.

---

# 13. External Dependency Rules

When a milestone depends on an external service, Cursor must report the exact dependency.

Acceptable examples:

* approved RTMP endpoint missing;
* stream key unavailable;
* platform API application not approved;
* OAuth client unavailable;
* required hardware unavailable;
* platform rate limit reached.

Unacceptable examples:

* environment issue;
* setup incomplete;
* external blocker;
* cannot test.

Cursor must distinguish between:

* repository implementation failure;
* local environment failure;
* external service dependency;
* platform policy restriction.

---

# 14. Secrets and Security Rules

Cursor must never expose:

* stream keys;
* OAuth tokens;
* API secrets;
* passwords;
* signing keys;
* refresh tokens;
* private credentials.

Secrets must not appear in:

* logs;
* telemetry;
* screenshots;
* test fixtures;
* history;
* audit payloads;
* Git commits;
* error messages.

Use secret references and secure runtime resolution.

---

# 15. Failure Handling Rules

Cursor must ensure that failures:

* are detected;
* are classified;
* are visible to the operator;
* do not silently succeed;
* do not falsely show healthy state;
* do not collapse unrelated destinations or connectors;
* clean up processes and temporary files;
* provide a safe next action.

One destination failure must not stop others.

One connector failure must not stop others.

One source failure must not crash the Control Room.

---

# 16. Reporting Rules

Every completed task must report:

1. milestone;
2. root cause;
3. files changed;
4. architecture reused;
5. commands run;
6. tests run;
7. real execution evidence;
8. artifact path;
9. file size;
10. duration;
11. codecs;
12. remote receipt evidence where applicable;
13. cleanup result;
14. remaining blockers;
15. commit hash;
16. final status.

Allowed final statuses:

* PASS
* PARTIAL
* FAIL
* BLOCKED_BY_EXTERNAL_DEPENDENCY

---

# 17. Commit Rules

Cursor must create one focused commit per completed milestone or coherent fix.

Commit messages should be clear and scoped.

Examples:

```text
fix(native-runtime): correct Windows FFmpeg discovery
feat(recording): activate native Program recording
feat(streaming): add verified Custom RTMP output
feat(chat): add YouTube live chat connector
```

Cursor must not combine unrelated work into one commit.

---

# 18. Documentation Update Rules

When implementation changes product reality, Cursor must update:

* `03-UBOS-PRODUCT-TRUTH-AND-EXECUTION-CONTRACT.md`;
* `04-UBOS-EXECUTION-PLAN.md`;
* `05-UBOS-SUBSYSTEM-MATRIX.md`;
* `08-UBOS-ACCEPTANCE-TESTS.md` where needed.

A subsystem may not be promoted without evidence.

---

# 19. Forbidden Development Patterns

Cursor must not:

* build speculative engines;
* add metadata-only substitutes;
* create fake success states;
* use test patterns as proof of Program output;
* add unsupported social platform claims;
* add placeholder integrations;
* claim production readiness from mocks;
* weaken validation to obtain PASS;
* disable failing tests without justification;
* remove browser fallback before native parity;
* redesign the product during runtime wiring;
* continue after the active milestone is complete.

---

# 20. Required Working Method

For each task, Cursor must follow this sequence:

```text
Read authoritative documents
→ inspect repository state
→ reproduce the current issue
→ trace the full execution path
→ identify the exact root cause
→ implement the smallest coherent fix
→ run focused validation
→ run acceptance test
→ verify external result
→ update authoritative documents
→ create one commit
→ report evidence
→ stop
```

---

# 21. Standard Cursor Task Prompt

Use this template when assigning work:

```text
Read the authoritative UBOS handover documents first.

Work only on:

[MILESTONE NAME]

Do not work on later milestones.

Do not redesign the Control Room.

Do not create new engines unless an existing subsystem cannot support the task.

Required result:

[REAL OBSERVABLE RESULT]

Acceptance test:

[EXACT TEST]

Report:

- root cause
- files changed
- commands run
- real evidence
- blockers
- commit hash
- PASS, PARTIAL, FAIL, or BLOCKED_BY_EXTERNAL_DEPENDENCY

Stop after this milestone.
```

---

# 22. Immediate Active Rule

At the time of this document version, Cursor must prioritize:

1. FFmpeg and FFprobe discovery;
2. native Program recording;
3. graphics and audio inside native output;
4. one real RTMP or RTMPS destination;
5. two simultaneous destinations;
6. two-platform unified chat.

Cursor must not prioritize cross-share, cross-follow, AI production, cloud clustering, or new marketplace work before these capabilities are verified.

---

# 23. Summary

Cursor is not authorized to invent the direction of UBOS.

It is authorized to implement the documented direction.

The standard is simple:

> One real workflow, verified end to end, before the next workflow begins.

The primary measure of success is not how much code Cursor writes.

It is whether UBOS performs the real operator action and produces the real external result.





