Create one master instruction file in the same folder:

```text
C:\Project\v5.9.0\MASTER-PLAN.md
```

Paste this into it:

```markdown
# UBOS v5.9 Sequential Execution Master Plan

## Objective

Execute the UBOS v5.9 task files in strict sequence, one at a time, from v5.9.1 through v5.9.8, then prepare v5.9.0 release only after certification passes.

The task files are located in:

C:\Project\v5.9.0

Expected files:

- UBOS v5.9.1.md
- UBOS v5.9.2.md
- UBOS v5.9.3.md
- UBOS v5.9.4.md
- UBOS v5.9.5.md
- UBOS v5.9.6.md
- UBOS v5.9.7.md
- UBOS v5.9.8.md
- UBOS v5.9.0.md

## Authoritative Execution Order

1. UBOS v5.9.1
2. UBOS v5.9.2
3. UBOS v5.9.3
4. UBOS v5.9.4
5. UBOS v5.9.5
6. UBOS v5.9.6
7. UBOS v5.9.7
8. UBOS v5.9.8
9. UBOS v5.9.0 release preparation

Do not change this order.

## Repository

The target repository is:

C:\Project\UnifiedLiveBroadcastOS

All implementation work must be performed inside that repository.

The task specification files must not be copied into source folders unless needed for documentation.

## Core Execution Rules

1. Read only one task specification at a time.
2. Do not begin the next task until the current task:
   - is fully implemented
   - passes required validation
   - has no unresolved release blocker
   - has a completion report
   - has a dedicated commit
3. Do not combine multiple v5.9 phases into one commit.
4. Do not skip a phase because a later file exists.
5. Do not assume a phase is complete from filenames, roadmap text, prior chat, branch names, closed pull requests, or commit messages.
6. The current repository contents are authoritative.
7. A closed but unmerged pull request does not count as completed.
8. Never weaken, delete, bypass, or mock away earlier validations.
9. Never claim a command passed unless it completed successfully.
10. Do not create a release tag before v5.9.8 passes.
11. Do not implement v5.10 functionality.
12. Do not push directly to main unless the user explicitly authorizes it.
13. Do not merge a pull request automatically.
14. Do not move or replace an existing published tag.
15. Stop when a release blocker cannot be safely resolved.

## Preflight

Before executing any task:

1. Change directory to:

   C:\Project\UnifiedLiveBroadcastOS

2. Run:

   git status
   git branch --show-current
   git fetch origin --prune --tags
   git log --oneline --decorate -10

3. Confirm:
   - the working tree is clean
   - the active branch is appropriate
   - the repository is synchronized with its intended base
   - there are no unresolved conflicts
   - required prior phases are present

4. Inspect:
   - packages/media-plane/src
   - packages/media-plane/src/index.ts
   - packages/media-plane/package.json
   - docs/architecture
   - relevant validation files
   - relevant processor registration
   - relevant command and output-registry definitions

5. Reconcile task status against actual repository state.

## State File

Create and maintain:

C:\Project\v5.9.0\WORKFLOW-STATE.md

Use this structure:

# UBOS v5.9 Workflow State

| Step | Version | Status | Branch | Commit | Validation | Notes |
|---:|---|---|---|---|---|---|
| 1 | v5.9.1 | NOT_STARTED | — | — | — | — |
| 2 | v5.9.2 | BLOCKED | — | — | — | Depends on v5.9.1 |
| 3 | v5.9.3 | BLOCKED | — | — | — | Depends on v5.9.2 |
| 4 | v5.9.4 | BLOCKED | — | — | — | Depends on v5.9.3 |
| 5 | v5.9.5 | BLOCKED | — | — | — | Depends on v5.9.4 |
| 6 | v5.9.6 | BLOCKED | — | — | — | Depends on v5.9.5 |
| 7 | v5.9.7 | BLOCKED | — | — | — | Depends on v5.9.6 |
| 8 | v5.9.8 | BLOCKED | — | — | — | Depends on v5.9.1-v5.9.7 |
| 9 | v5.9.0 | BLOCKED | — | — | — | Requires v5.9.8 PASS |

Allowed status values:

- NOT_STARTED
- READY
- IN_PROGRESS
- BLOCKED
- IMPLEMENTED
- VALIDATED
- CERTIFIED
- RELEASE_READY
- FAILED

Update the state file after every phase.

## Completion Report File

Create and append to:

C:\Project\v5.9.0\COMPLETION-REPORT.md

For every phase include:

- version
- task title
- date
- branch
- starting commit
- ending commit
- files created
- files modified
- architecture reviewed
- abstractions reused
- blockers found
- fixes applied
- exact validation commands
- exact validation results
- environmental failures
- remaining limitations
- final PASS or FAIL
- next eligible task

Do not overwrite earlier reports.

## Phase Loading Rules

For each phase:

1. Read this MASTER-PLAN.md.
2. Read WORKFLOW-STATE.md.
3. Determine the earliest incomplete phase.
4. Load only the corresponding task file.
5. Verify all prerequisites.
6. Mark the task IN_PROGRESS.
7. Implement the phase.
8. Run focused validation.
9. Run required regression validation.
10. Fix all release blockers.
11. Review git diff.
12. Update WORKFLOW-STATE.md.
13. Append COMPLETION-REPORT.md.
14. Commit the phase.
15. Stop or continue according to execution mode.

## Task File Mapping

### Phase 1

Version:

v5.9.1

Specification:

C:\Project\v5.9.0\UBOS v5.9.1.md

Prerequisites:

- certified v5.8 platform present
- repository builds sufficiently for media-plane work

Required final status:

VALIDATED

Recommended commit:

Implement UBOS v5.9.1 graphics and text foundation

### Phase 2

Version:

v5.9.2

Specification:

C:\Project\v5.9.0\UBOS v5.9.2.md

Prerequisites:

- v5.9.1 VALIDATED
- implementation present on current branch

Required final status:

VALIDATED

Recommended commit:

Implement UBOS v5.9.2 template and data binding engine

### Phase 3

Version:

v5.9.3

Specification:

C:\Project\v5.9.0\UBOS v5.9.3.md

Prerequisites:

- v5.9.1 VALIDATED
- v5.9.2 VALIDATED

Required final status:

VALIDATED

Recommended commit:

Implement UBOS v5.9.3 broadcast graphics foundation

### Phase 4

Version:

v5.9.4

Specification:

C:\Project\v5.9.0\UBOS v5.9.4.md

Prerequisites:

- v5.9.1 through v5.9.3 VALIDATED

Required final status:

VALIDATED

Recommended commit:

Implement UBOS v5.9.4 captions and accessibility graphics

### Phase 5

Version:

v5.9.5

Specification:

C:\Project\v5.9.0\UBOS v5.9.5.md

Prerequisites:

- v5.9.1 through v5.9.4 VALIDATED

Required final status:

VALIDATED

Recommended commit:

Implement UBOS v5.9.5 graphics animation coordination

### Phase 6

Version:

v5.9.6

Specification:

C:\Project\v5.9.0\UBOS v5.9.6.md

Prerequisites:

- v5.9.1 through v5.9.5 VALIDATED

Required final status:

VALIDATED

Recommended commit:

Implement UBOS v5.9.6 branding and safe area coordination

### Phase 7

Version:

v5.9.7

Specification:

C:\Project\v5.9.0\UBOS v5.9.7.md

Prerequisites:

- v5.9.1 through v5.9.6 VALIDATED

Required final status:

VALIDATED

Recommended commit:

Implement UBOS v5.9.7 multi format graphics coordination

### Phase 8

Version:

v5.9.8

Specification:

C:\Project\v5.9.0\UBOS v5.9.8.md

Prerequisites:

- v5.9.1 through v5.9.7 present
- all prior phases VALIDATED
- all validation files present
- all architecture documents present
- package test wiring complete

Required final status:

CERTIFIED

Recommended commit:

Certify UBOS v5.9 graphics platform

Certification must fail if any prerequisite phase is missing.

### Phase 9

Version:

v5.9.0

Specification:

C:\Project\v5.9.0\UBOS v5.9.0.md

Prerequisites:

- v5.9.8 final result PASS
- v5.9.8 declares release readiness
- no unresolved blocker
- all required validations green
- main synchronized
- tag v5.9.0 absent locally and remotely

Required final status:

RELEASE_READY

Recommended commit:

Prepare UBOS v5.9.0 graphics platform release

Do not create the tag unless the user explicitly authorizes tag creation.

## Per-Phase Git Procedure

Before each phase:

1. Confirm clean tree:

   git status --short

2. Fetch:

   git fetch origin --prune --tags

3. Record base commit:

   git rev-parse HEAD

4. Create or use a dedicated branch.

Recommended branch pattern:

   codex/ubos-v5.9.1-graphics-foundation
   codex/ubos-v5.9.2-template-binding
   codex/ubos-v5.9.3-broadcast-graphics
   codex/ubos-v5.9.4-captions-accessibility
   codex/ubos-v5.9.5-graphics-animation
   codex/ubos-v5.9.6-branding-safe-area
   codex/ubos-v5.9.7-multi-format-graphics
   codex/ubos-v5.9.8-graphics-certification
   codex/ubos-v5.9.0-release

5. Do not start from an outdated feature branch.

After implementation:

1. Run:

   git diff --check
   git status
   git diff --stat

2. Review every changed file.

3. Run validations.

4. Commit only after validation.

5. Record the commit hash in WORKFLOW-STATE.md.

6. Do not begin the next task on an unmerged branch unless explicitly using one continuous sequential branch.

## Execution Modes

### Recommended Mode: One Phase Per Run

Execute one phase, commit it, stop, report, review, merge, synchronize main, then start the next phase.

This is the safest mode.

### Continuous Sequential Mode

Continue automatically only when:

- the current phase passed
- the current phase was committed
- the next phase prerequisites are present on the same branch
- no manual review or merge is required
- no release blocker exists

In continuous mode, still create one separate commit per phase.

Do not squash phases together.

## Validation Baseline

For every implementation phase, run where supported:

- formatting for changed files
- git diff --check
- pnpm --filter @ubos/media-plane lint
- pnpm --filter @ubos/media-plane typecheck
- pnpm --filter @ubos/media-plane build
- focused validation for the current phase
- pnpm --filter @ubos/media-plane test
- relevant previous certifications
- pnpm lint
- pnpm typecheck
- pnpm test where available
- pnpm build where practical

For v5.9.8 also run all v5.9 focused validations and prior platform certifications required by its task file.

For v5.9.0 run the full release validation specified in its task file.

Do not substitute a partial validation for a required command.

## Environmental Failures

Report separately:

- Cargo network failures
- crates.io DNS failures
- desktop native build failures
- browser dependency failures
- GPU dependency failures
- external network failures
- unavailable optional native tools

An environmental failure must not be mislabeled as a code success.

Media-plane validation can pass while a repository-wide environmental build fails, but this distinction must be explicit.

## Release Blocker Rules

Stop and mark BLOCKED or FAILED when any of the following occurs:

- prerequisite phase absent
- implementation file absent
- validation file absent
- architecture document absent
- package test wiring absent
- unresolved merge conflict
- duplicate public exports
- wildcard exports where prohibited
- processor-order collision
- stale generation acceptance
- duplicate publication
- output-role alias
- false real-rendering capability
- unbounded state
- ownership leak
- security or redaction failure
- focused validation failure
- media-plane test failure
- certification failure
- release tag already exists at a different commit
- documentation materially disagrees with implementation

Do not continue to later phases while a blocker remains.

## Recovery Rules

If a prior task has a closed but unmerged pull request:

1. Verify whether its implementation exists on the current branch.
2. Search local and remote Git history.
3. Recover the PR branch where possible.
4. Otherwise reimplement that exact phase.
5. Validate and commit it.
6. Do not skip to the next phase.

Do not mark a phase complete because a task markdown file exists.

## Public API Rules

For every phase:

- inspect packages/media-plane/src/index.ts
- use explicit exports
- no wildcard exports
- no duplicate identifiers
- no internal mutable registries exported
- no queue internals exported
- no ownership-mutation internals exported
- no native renderer or browser internals exported
- no credential-bearing types exported

## Completion Gate

A phase is complete only when all are true:

- implementation exists
- validation exists
- documentation exists
- package test wiring exists
- public exports are correct
- focused validation passes
- required regression validation passes
- no blocker remains
- state file updated
- completion report appended
- dedicated commit created

## Final v5.9 Gate

v5.9 is release-ready only when:

- v5.9.1 VALIDATED
- v5.9.2 VALIDATED
- v5.9.3 VALIDATED
- v5.9.4 VALIDATED
- v5.9.5 VALIDATED
- v5.9.6 VALIDATED
- v5.9.7 VALIDATED
- v5.9.8 CERTIFIED with PASS
- no unresolved blocker
- v5.9.0 release preparation completed
- full release validation passed
- release commit created
- tag creation separately authorized

## Final Report

At the end of the sequence report:

- repository branch
- starting commit
- final commit
- phases already present
- phases implemented
- phases validated
- phases certified
- phases blocked
- commits created
- files created
- files modified
- exact successful validations
- environmental failures
- remaining limitations
- v5.9.8 PASS or FAIL
- v5.9 release readiness
- whether v5.9.0 release preparation completed
- whether tag creation is authorized
- recommended next task:
  UBOS v5.10.1 — Production-Safe Automation, Rundown, and Show-Control Foundation
```

Then give Codex this controller prompt:

```text
Execute the UBOS v5.9 sequential workflow.

Read:

C:\Project\v5.9.0\MASTER-PLAN.md

Then read or create:

C:\Project\v5.9.0\WORKFLOW-STATE.md
C:\Project\v5.9.0\COMPLETION-REPORT.md

Target repository:

C:\Project\UnifiedLiveBroadcastOS

Inspect the repository and reconcile the workflow state against actual code,
Git history, validation files, architecture documents, package test wiring,
processor registration, and public exports.

Execute the task files in this exact order:

1. C:\Project\v5.9.0\UBOS v5.9.1.md
2. C:\Project\v5.9.0\UBOS v5.9.2.md
3. C:\Project\v5.9.0\UBOS v5.9.3.md
4. C:\Project\v5.9.0\UBOS v5.9.4.md
5. C:\Project\v5.9.0\UBOS v5.9.5.md
6. C:\Project\v5.9.0\UBOS v5.9.6.md
7. C:\Project\v5.9.0\UBOS v5.9.7.md
8. C:\Project\v5.9.0\UBOS v5.9.8.md
9. C:\Project\v5.9.0\UBOS v5.9.0.md

Rules:

- Load only one task file at a time.
- Complete, validate, report, and commit each phase before loading the next.
- Create one focused commit per phase.
- Never skip a prerequisite.
- Never infer completion from the existence of a markdown file.
- Never weaken or bypass previous validations.
- Never claim a validation passed unless it completed successfully.
- Stop immediately on an unresolved release blocker.
- Do not implement v5.10.
- Do not merge pull requests automatically.
- Do not push directly to main unless explicitly authorized.
- Do not create the v5.9.0 tag unless explicitly authorized after release
  preparation and verification.

Use one continuous sequential branch only if all phases are to be implemented in
a single run. Even then, keep one independent commit per phase.

At the end of each phase:

1. update WORKFLOW-STATE.md
2. append COMPLETION-REPORT.md
3. create the phase commit
4. state the next eligible phase

At the end of the complete sequence, report:

- phases inspected
- phases already present
- phases implemented
- phases validated
- certification result
- release-readiness result
- commits created
- exact validation results
- environmental failures
- remaining limitations
- whether v5.9.0 is ready to be tagged manually

Do not create the tag.
```

I recommend running Codex **one phase per task**, not all nine unattended. That makes a failed v5.9.4, for example, unable to contaminate v5.9.5 through v5.9.8.
