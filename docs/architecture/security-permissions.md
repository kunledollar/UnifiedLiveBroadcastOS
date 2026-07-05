# UBOS Security and Broadcast Permissions

Phase 26 introduces a metadata-first security foundation for UBOS. It models roles, permissions, action policies, approval metadata, audit events, and deterministic policy evaluation without adding login providers, OAuth, password handling, secrets, tokens, billing, encryption, or disruptive runtime enforcement.

## Role model

Broadcast roles are fixed in `packages/shared/src/security/`: owner, admin, director, producer, technical director, audio engineer, graphics operator, replay operator, guest manager, moderator, observer, guest, and API client. Roles are validated before use so UI and future runtimes can reject unknown role strings.

## Permission model

Permissions are explicit production capabilities such as `production.switch`, `audio.control`, `recording.control`, `streaming.control`, `guest.invite`, `automation.execute`, `ai.approve`, and `audit.read`. A role maps to a deterministic permission set. Observers are read-oriented, guests have no operator controls, and specialized operators receive narrow permissions.

## Policy evaluation

`PolicyEvaluator` resolves an action against the current `SecurityContext`. It checks that the action exists, that the operator has the required permission, and that special safety rules are respected. Dangerous production actions require explicit permissions. Streaming and recording actions require elevated control permissions. Automation actions use the same permission path as operator actions.

## Approval workflow

Destructive or AI-originated actions return decisions that require approval metadata. The approval metadata records action, approver, and timestamp. This phase only models the workflow and surfaces pending approvals; it does not block existing runtime commands unless a safe read-only integration point already exists.

## Audit trail

Audit events are immutable metadata snapshots containing id, timestamp, actor id, actor role, action, decision, and serializable metadata. `AuditRecorder` appends frozen event copies and returns a new audit trail object so event history remains append-only.

## AI and automation safety rules

AI cannot execute actions directly. AI recommendations must flow through approval-capable policies. Automation must respect the same permission policies as humans and must not bypass permission checks.

## Future auth provider integration

Future phases can attach real user sessions to `UserIdentity` and `OperatorIdentity` without changing the permission vocabulary. Login providers should populate identity metadata and role assignments, then pass those into `SecurityContext`.

## Future enterprise SSO integration

Enterprise SSO can map SAML/OIDC groups to UBOS broadcast roles. That integration should remain outside this package and should not introduce secrets or tokens into shared metadata. The shared package should continue to expose deterministic validation and policy evaluation primitives.
