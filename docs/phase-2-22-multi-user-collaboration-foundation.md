# Phase 2.22 — Multi-User Collaboration Foundation

UBOS now includes a backend-independent collaboration foundation for deterministic multi-operator production workflows. The subsystem is metadata-first: it models users, roles, locks, operations, conflicts, audit records, shared state snapshots, and live collaboration events without networking, authentication-provider integration, media payload sharing, or persistence requirements.

## Scope

- **CollaborationManager:** `CollaborationManager` coordinates user sessions, operator presence, lock ownership, operation application, conflict metadata, audit history, and live event emission.
- **User sessions:** `CollaborationUserSession` records the session id, user id, display name, role, workspace, team, join/last-seen timestamps, optional expiry, and arbitrary metadata.
- **Presence:** `OperatorPresence` tracks online, idle, editing, away, and disconnected operators with focused resource and cursor metadata.
- **Roles and permissions:** Built-in roles are Admin, Producer, Director, Graphics, Audio, Camera, and Viewer. `ROLE_PERMISSIONS` and `hasCollaborationPermission` provide deterministic permission checks.
- **Resource locking:** `ResourceLock` supports exclusive and shared locks over Scenes, Sources, Graphics, Outputs, and Settings. Locks carry owner, version, timestamp, optional expiry, and metadata.
- **Conflict metadata:** `ConflictMetadata` captures version mismatches, lock conflicts, permission denials, stale sessions, and resolution strategy metadata.
- **Audit and history:** Every manager action emits an `AuditLogEntry`; accepted operations are retained in operation history for deterministic replay by host applications.
- **Workspace and team abstractions:** `CollaborationWorkspace` and `CollaborationTeam` provide backend-neutral grouping metadata.
- **Shared state synchronization:** `SharedStateSnapshot` stores resource metadata by resource key and monotonically increases revisions when accepted operations apply.
- **Live events:** `LiveCollaborationEvent` provides transport-agnostic events that callers can forward over any realtime backend later.
- **Lifecycle:** `startSession`, `endSession`, `updatePresence`, `syncState`, and lock release flows model session lifecycle without persistence assumptions.

## Architecture

The manager intentionally owns only metadata and control-plane state. It never sends network messages, authenticates users, persists records, or shares media payloads. Applications can wrap the emitted `LiveCollaborationEvent` list with WebSocket, WebRTC data channel, database, or message bus infrastructure in later phases.

Shared state is optimistic and deterministic:

1. The caller starts a user session with a declared role.
2. The caller optionally acquires a resource lock.
3. The caller submits a metadata operation with a base resource version.
4. The manager validates role permissions, lock ownership, and base version.
5. Accepted operations increment the resource version and global shared-state revision.
6. Rejected operations create conflict metadata and audit entries.
7. Conflicts can be resolved with reject, accept-latest, override, or merge-metadata metadata.

## Demo

Run the demo after building the shared package:

```bash
pnpm collaboration:demo
```

The demo starts an Admin and Director in a demo workspace, acquires a Scene lock, applies a Scene activation operation, submits a stale operation to generate conflict metadata, and prints presence, lock, conflict, audit, and event summaries.

## Validation

The validation test covers:

- Role permission checks.
- Session and presence tracking.
- Exclusive lock acquisition and denial.
- Accepted shared-state operation application.
- Stale operation conflict detection.
- Conflict resolution audit metadata.
- Viewer read-only behavior.
- Demo conflict generation.

Run validation with:

```bash
pnpm --filter @ubos/shared test
```

## Constraints

- Backend-independent.
- Metadata-first.
- No networking implementation.
- No authentication provider integration.
- No media payload sharing.
- No persistence requirement.
