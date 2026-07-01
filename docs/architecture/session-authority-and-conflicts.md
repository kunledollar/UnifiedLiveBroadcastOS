# Session Authority and Conflict Resolution

Phase 5.4 adds an in-memory collaboration control plane for deciding who may mutate production state before commands reach the Production Graph dispatcher.

## Authority model

`SessionAuthority` tracks one `AuthorityNode` per `AuthorityScope`. Scopes are: broadcast, program, preview, scenes, scene, sources, guests, audio, graphics, outputs, recording, workspace, health, automation, and ai.

Each node can be unowned, owned, locked, or expired. Owners are operator identities plus the existing `OperatorRole`. This intentionally composes with Production Graph permission helpers instead of creating a second unrelated command permission system.

## Role-to-authority mapping

Owners and admins may override all operational scopes. Directors own broadcast flow, program, preview, scene switching, outputs, recording, and automation. Technical directors own switching, preview/program, scenes, sources, outputs, and health. Producers own scenes, guests, workspace, graphics, sources, and automation. Audio engineers own audio. Graphics operators own graphics, sources, and workspace. Guest managers own guests. Moderators have limited guests/workspace authority. Viewers have no mutation authority. AI agents are suggestion-only through the ai scope.

## Arbitration flow

`arbitrateProductionCommand()` and `evaluateCommandAuthority()` perform deterministic checks in this order:

1. Validate command shape.
2. Validate existing Production Graph role permission.
3. Validate expected graph revision.
4. Validate authority scope and owner.
5. Validate lock/lease state.
6. Return an accepted or rejected `AuthorityDecision`.

Rejected arbitration returns a structured `CommandConflict`; it does not throw.

## Lock and lease model

`CollaborationLock` is an in-memory lease over an authority scope. Locks include acquired, heartbeat, and expiry timestamps. Helpers acquire, renew, release, expire, and inspect locks. There are no long-running timers; callers run `expireLocks()` or store queries during diagnostics/validation. Owners and admins can override locks; other roles cannot.

## Conflict model

`CommandConflict` is append-only until `resolveConflict()` marks it resolved with a `ConflictResolution`. Conflict types cover revision mismatches, permission denial, authority denial, locked scopes, stale operators, duplicate commands, invalid commands, ended sessions, and unknown failures.

## Sync event relationship

Authority events are represented as collaboration events and as sync message types: authority granted/revoked, lock acquired/released/expired/renewed, command conflict created/resolved, command arbitrated, and authority decision created. Phase 5.4 stores them locally; later phases can envelope and broadcast the same payloads.

## Relationship to Production Graph permissions

Authority arbitration calls `canExecuteProductionCommand()` before scope ownership and locks. Production Graph remains the source of truth for command semantics, reducers, events, and revisions. Authority only gates whether a command should proceed.

## Future server authority plan

A server authority service should become the canonical lock/owner arbiter, using the same decision/conflict payloads over the existing sync transport. Clients should treat local authority as advisory once a server is present.

## Future persistence plan

Conflicts and decisions can later be persisted as an audit log. Locks should generally remain leases with expiry, while authority assignments may be stored per broadcast session or workspace template.

## Known limitations

- Store is in-memory only.
- Mock scenario is diagnostics-only.
- Current integration is a low-risk wrapper around the local collaboration command bus.
- There is no full multi-user editing UX yet.
- No database persistence or server-side arbitration is implemented.
