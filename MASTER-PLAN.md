# UBOS MASTER PLAN

## Unified Live Broadcast Operating System

Version: Evergreen
Status: Authoritative Engineering Execution Guide

---

# Purpose

This document is the single authoritative execution contract for all Codex development performed on the Unified Live Broadcast Operating System (UBOS).

Every implementation, refactor, certification, validation, and release must follow this document.

Individual feature specifications are stored separately under:

.codex/tasks/

This document never changes for individual phases.

---

# Repository

Repository Root

.

Codex Workspace

/workspace/UnifiedLiveBroadcastOS

All commands execute from the repository root.

Never assume external folders.

---

# Task Specifications

All implementation specifications live inside:

.codex/tasks/

Organized by platform version:

.codex/tasks/
    v5.9/
    v5.10/
    v5.11/
    v5.12/
    ...

Each version directory contains its own ordered task files.

Example:

.codex/tasks/v5.9/

    v5.9.1.md

    v5.9.2.md

    ...

    v5.9.8.md

    v5.9.0.md

---

# Workflow State

Maintain:

.codex/WORKFLOW-STATE.md

Track:

• current phase

• branch

• commit

• validation status

• certification

• blockers

Update after every completed phase.

---

# Completion Report

Maintain:

.codex/COMPLETION-REPORT.md

Append after every phase.

Never overwrite previous reports.

---

# Execution Workflow

Before beginning any work:

1. Read this MASTER-PLAN.md.

2. Read WORKFLOW-STATE.md.

3. Inspect the repository.

4. Reconcile the repository against Git history.

5. Determine the earliest incomplete task.

6. Load only that task specification.

7. Verify prerequisites.

8. Execute the task.

9. Validate.

10. Commit.

11. Update workflow files.

12. Continue only when the current task passes.

---

# Phase Execution Rules

Exactly one task specification may be active.

Never load multiple task files simultaneously.

Never skip prerequisites.

Never reorder phases.

Never infer completion from filenames or pull requests.

Repository contents are authoritative.

---

# Repository Inspection

Before each phase inspect:

git status

git branch --show-current

git fetch origin --prune --tags

git log --oneline --decorate -10

Inspect:

packages/

apps/

docs/

architecture

public exports

validation files

processor registration

package wiring

---

# Branching

Use dedicated feature branches.

Naming:

codex/<task-name>

Examples:

codex/ubos-v5.9.1

codex/ubos-v5.9.2

codex/ubos-v5.10.1

Never work from outdated branches.

---

# Commit Policy

Exactly one focused commit per task.

Do not combine multiple phases.

Do not squash unrelated work.

Commit only after validation passes.

---

# Validation

Every task must execute all required validation defined in its specification.

Typical validation includes:

git diff --check

lint

typecheck

build

tests

focused certification

regression validation

Never bypass validation.

Never weaken tests.

Never claim success without execution.

---

# Definition of Done

A task is complete only when:

✓ implementation exists

✓ validation passes

✓ documentation updated

✓ public exports correct

✓ architecture preserved

✓ workflow updated

✓ completion report appended

✓ commit created

Otherwise the task is incomplete.

---

# Blockers

Stop immediately if:

missing prerequisite

failed validation

failed build

failed certification

merge conflict

architecture regression

ownership leak

generation failure

processor ambiguity

duplicate publication

security regression

documentation mismatch

Do not continue until resolved.

---

# Recovery

If a task appears completed only through:

closed pull request

branch

roadmap

markdown

conversation

Re-inspect the repository.

If absent:

Reimplement the task.

---

# Public API Rules

No wildcard exports.

No duplicate exports.

No mutable internals.

No queue internals.

No ownership mutation.

No hidden runtime state.

---

# Release Rules

Platform releases (x.y.0):

Require all implementation phases complete.

Require certification PASS.

Require release validation.

Require release notes.

Require changelog.

Require release commit.

Never tag before certification.

Never move an existing release tag.

---

# Codex Operating Rules

Codex shall:

Read only one task file.

Implement exactly one task.

Validate.

Commit.

Update workflow.

Load the next task.

Repeat.

---

# Execution Order

Execution order is defined by the version folder.

Example:

.codex/tasks/v5.9/

v5.9.1

↓

v5.9.2

↓

v5.9.3

↓

...

↓

v5.9.8

↓

v5.9.0 Release

The same rule applies to every future version.

---

# Current Platform

The active version is determined by the user request.

Examples:

Implement v5.9

Implement v5.10

Implement v6.0

Codex shall execute only the requested version.

---

# Engineering Principles

Reuse existing architecture.

Prefer deterministic systems.

Maintain immutable snapshots.

Preserve processor ordering.

Avoid duplicated ownership.

Protect production safety.

Preserve backward compatibility.

Never introduce hidden state.

Never duplicate runtime loops.

Never bypass safety checks.

---

# Final Report

At the completion of every task report:

Phase

Branch

Commit

Files created

Files modified

Validation results

Blockers

Fixes

Remaining limitations

Next eligible task

PASS or FAIL

---

This MASTER-PLAN.md is the single authoritative engineering guide for all future UBOS development.