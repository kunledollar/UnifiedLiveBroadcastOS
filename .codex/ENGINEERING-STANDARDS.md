# UBOS Engineering Standards

Status: Authoritative Engineering Rules

---

## Core Principles

All UBOS implementations must:

- reuse existing architecture
- preserve deterministic behavior
- use immutable snapshots
- use generation-safe state transitions
- preserve authoritative FrameTick and timeline ownership
- avoid duplicate runtime loops
- avoid duplicate subsystem ownership
- keep registries, queues, caches, retries, leases, and histories bounded
- reject stale generations
- enforce exactly-once command and result behavior
- preserve Program state during failure
- maintain output-role isolation
- expose metadata-only observability
- sanitize errors and telemetry
- release all owned resources during shutdown

---

## Architecture Rules

Do not create:

- a second runtime
- a second scheduler
- a second media clock
- a second FrameTick source
- duplicate Program/Preview buses
- duplicate command engines
- duplicate graphics, audio, replay, recording, streaming, or automation engines
- direct subsystem mutation where typed command delegation exists

Every new component must document:

- architectural ownership
- upstream dependencies
- downstream consumers
- processor order
- generation model
- ownership model
- failure behavior
- shutdown behavior

---

## Determinism

Implementations must:

- produce identical canonical outputs for identical inputs
- avoid wall-clock authority for media execution
- use fake clocks in deterministic validation
- reject sequence and generation regressions
- avoid registration-order dependence
- avoid unbounded concurrency
- preserve stable ordering and tie-breaking

---

## State and Ownership

All mutable runtime state must be:

- generation-protected
- bounded
- lifecycle-controlled
- observable through immutable snapshots
- released exactly once

Prohibited:

- double release
- stale completion overwrite
- released-reference reuse
- output after cancellation, failure, completion, rollback, reset, or shutdown

---

## Public API

Requirements:

- explicit exports only
- no wildcard exports
- no duplicate symbols
- no mutable registries exported
- no queue internals exported
- no ownership mutation internals exported
- no credentials, paths, URLs, tokens, private identities, native handles, or raw media exposed

---

## Validation

Every phase must run the validation defined by its task specification.

Typical minimum validation:

- formatting for changed files
- `git diff --check`
- package lint
- package typecheck
- package build
- focused phase validation
- relevant regression validations
- package tests
- repository-level validation where practical

Never:

- weaken tests
- bypass validations
- claim a command passed when it did not execute successfully
- hide environmental failures

---

## Documentation

Every implementation phase must include:

- architecture documentation
- lifecycle description
- generation behavior
- ownership behavior
- commands
- events
- health
- telemetry
- watchdog
- Source Graph integration
- security and redaction
- known limitations
- validation results
- next-phase handoff

---

## Commit Rules

- one focused commit per phase
- no unrelated refactors
- no multiple phases in one commit
- workflow-state updates included with the phase
- completion report appended before commit
- release registry updated only for platform releases

---

## Release Rules

A platform release requires:

- all implementation phases complete
- certification PASS
- no unresolved blockers
- documentation complete
- changelog and release notes complete
- clean working tree
- explicit authorization before tag creation

Never move or replace a published tag.