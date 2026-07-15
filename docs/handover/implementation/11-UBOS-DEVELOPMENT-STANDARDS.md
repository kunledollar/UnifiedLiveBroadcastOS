# UBOS Development Standards

## Document Status

Document ID: 11  
Document Name: UBOS Development Standards  
Version: 1.0  
Status: Authoritative  
Owner: UBOS Core Engineering

---

# 1. Purpose

This document defines the mandatory engineering standards for the Unified Broadcast Operating System (UBOS).

It exists to ensure that every engineer, contractor, Cursor agent, Codex agent, or future contributor produces code that is:

- consistent;
- maintainable;
- production-safe;
- testable;
- scalable;
- and aligned with the long-term architecture.

These standards apply to every repository, package, service, runtime, API, connector, and user interface in UBOS.

---

# 2. Engineering Principles

Every implementation must satisfy the following principles:

- Correctness before convenience.
- Real execution before simulation.
- Reuse before replacement.
- Simplicity before complexity.
- Composition before duplication.
- Explicit behavior before implicit behavior.
- Small focused changes before broad refactoring.
- Production safety before feature expansion.

The objective is to build a reliable broadcast operating system, not simply to increase the amount of code.

---

# 3. Architecture First

Before writing new code, engineers must determine:

- whether the required subsystem already exists;
- whether an existing interface can be extended;
- whether an existing service owns the responsibility;
- whether an existing command or event already performs part of the workflow.

New engines must not be created when an existing subsystem can be extended safely.

---

# 4. Single Responsibility

Every class, service, module, package, and runtime should have one clearly defined responsibility.

Examples:

- Recording service records.
- Streaming service streams.
- Graphics engine renders graphics.
- Chat connector ingests chat.
- Command dispatcher routes commands.

No component should own unrelated responsibilities.

---

# 5. Command and Event Pattern

All operator actions should follow the same execution model:

```text
Operator

↓

UI Event

↓

Typed Command

↓

Validation

↓

Command Handler

↓

Runtime Service

↓

Domain Event

↓

UI Update

↓

Audit
```

The UI must never bypass the command layer to mutate authoritative runtime state.

---

# 6. State Ownership

Each piece of state must have one owner.

Examples:

| State | Owner |
|--------|-------|
| Program | Production Engine |
| Preview | Production Engine |
| Recording | Native Runtime |
| Streaming | Streaming Runtime |
| Chat | Chat Engine |
| Metrics | Monitoring |
| Audit | Audit Service |
| Tenants | Multi-Tenant Engine |

Duplicated ownership is prohibited.

---

# 7. Package Design

Every package must have a clearly defined purpose.

Typical packages include:

- core
- media-plane
- automation
- graphics
- streaming
- chat
- ui
- config
- shared
- database

Packages should communicate through stable interfaces rather than direct implementation dependencies.

---

# 8. API Design

Every API must:

- validate input;
- validate authorization;
- return structured responses;
- use consistent error handling;
- avoid exposing internal implementation details;
- avoid exposing secrets.

Endpoints should represent business capabilities rather than internal classes.

---

# 9. UI Standards

The UI must:

- reflect actual runtime state;
- display exact errors;
- avoid ambiguous wording;
- remain responsive;
- support keyboard navigation where appropriate;
- preserve the approved Control Room layout.

UI changes must not alter unrelated workflows.

---

# 10. Code Style

Code should be:

- readable;
- modular;
- strongly typed;
- self-documenting where practical;
- consistently formatted.

Avoid:

- deeply nested logic;
- duplicated code;
- magic numbers;
- unexplained constants;
- excessive comments that restate the code.

Prefer descriptive names over abbreviations.

---

# 11. Error Handling

Errors must:

- be explicit;
- include actionable information;
- avoid exposing secrets;
- distinguish between user, runtime, network, and dependency failures.

Never swallow exceptions silently.

---

# 12. Logging

Logs should include:

- timestamp;
- subsystem;
- severity;
- operation;
- correlation identifier where applicable;
- sanitized context.

Logs must never include:

- stream keys;
- passwords;
- OAuth tokens;
- secret references;
- personally sensitive data unless explicitly required and protected.

---

# 13. Testing Standards

Every feature should include:

- unit tests where appropriate;
- integration tests where appropriate;
- runtime validation;
- acceptance testing for user-facing workflows.

Compilation alone is not considered testing.

---

# 14. Validation

Before merging work, engineers should run:

```text
typecheck
lint
build
focused validation
acceptance tests
git diff --check
```

Features affecting media should include real runtime validation whenever the environment supports it.

---

# 15. Git Standards

Each commit should:

- have one clear purpose;
- use descriptive commit messages;
- avoid combining unrelated changes.

Examples:

```text
fix(recording): correct FFmpeg discovery
feat(streaming): implement RTMP adapter
docs(handover): update subsystem matrix
```

---

# 16. Documentation

Implementation changes must update the relevant documentation.

At minimum:

- Product Truth
- Execution Plan
- Subsystem Matrix
- Capability Matrix
- Acceptance Tests

Documentation is part of the deliverable.

---

# 17. Security

Security is mandatory.

Engineers must:

- validate all external input;
- protect secrets;
- use least privilege;
- sanitize logs;
- protect tenant isolation;
- validate permissions before execution.

Security reviews should accompany sensitive runtime changes.

---

# 18. Performance

Optimize only after correctness.

Performance improvements should be measurable and supported by profiling or observed bottlenecks.

Premature optimization is discouraged.

---

# 19. Review Checklist

Before submitting work, confirm:

- Does it solve the intended problem?
- Does it reuse existing architecture?
- Is the code understandable?
- Are tests included?
- Is documentation updated?
- Does the UI remain truthful?
- Are secrets protected?
- Does the acceptance test pass?

---

# 20. Summary

UBOS is a long-lived platform.

Every contribution should leave the system:

- more reliable;
- easier to understand;
- easier to test;
- and closer to a fully operational broadcast operating system.

The guiding rule is:

> Every line of code should make UBOS more trustworthy, not merely larger.

