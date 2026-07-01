# Persistent Broadcast Sessions Foundation

Phase 5.6 introduces a database-ready persistence architecture for collaborative broadcast sessions while preserving the existing local and in-memory Control Room behavior.

## Persistence model

The shared persistence layer defines immutable, database-friendly records for broadcast sessions, production graph snapshots, production commands, production events, collaboration events, operator sessions, authority decisions, collaboration locks, command conflicts, and sync checkpoints. Records use stable string IDs, ISO timestamps, graph IDs, graph revision references, and JSON metadata payloads so they can move to Postgres/Prisma without coupling runtime media execution to storage.

## What is persisted

UBOS persists operational state only:

- Session metadata such as status, owner, active operators, current graph ID, and current graph revision.
- Versioned Production Graph snapshots.
- Append-only accepted and rejected command records.
- Append-only production event records.
- Collaboration presence, activity, connection state, observed revision, and collaboration events.
- Authority locks, authority decisions, command conflicts, and conflict resolution metadata.
- Sync checkpoints for reconnect and catch-up flows.

## What is not persisted

This phase intentionally does not persist media bytes, video frames, audio samples, WebRTC packets, compositor output, recordings, destination credentials, or enterprise authentication state.

## Snapshot strategy

Snapshots are explicit records containing the full Production Graph payload, schema version, graph ID, graph revision, timestamp, and metadata. Helpers support manual snapshot creation, latest snapshot lookup, snapshot restore, and a simple `every N revisions` policy predicate. No background snapshot worker is introduced in this phase.

## Command and event logs

Commands and events are append-only records. Command records capture expected revision, resulting revision, actor information, command type, payload, acceptance state, rejection reason, correlation ID, and metadata. Event records capture command linkage, previous and next revisions, event type, actor, payload, and metadata.

## Recovery strategy

Recovery is modeled as:

```text
latest snapshot at revision N
+ events/commands after revision N
= current graph state
```

The first implementation provides helpers to recover from the latest snapshot, replay command metadata from a revision, replay event metadata from a revision, rebuild a graph from snapshot plus events, and generate a recovery plan.

## Collaboration persistence

Operator session records preserve mock/local operator identity, role, presence, current activity, observed graph revision, join/leave/last-seen timestamps, and connection state. Collaboration events include joins, leaves, presence updates, activity updates, command broadcast, revision-behind, reconnecting, and reconnected events.

## Authority and conflict persistence

Authority repositories persist active and expired locks, authority decisions, command conflicts, and conflict resolution data. Records include scope, owning operator, role, acquisition and expiration timestamps, resolution timestamps, conflict type, resolution, and metadata for auditability.

## Future Postgres/Prisma plan

The current interfaces map directly to database tables with JSON columns for graph, payload, and metadata fields. A future Prisma phase can add tables matching these records, create indexes on `broadcastSessionId`, `graphId`, `graphRevision`, and `timestamp`, and preserve append-only semantics with database constraints.

## Future cloud persistence plan

Cloud persistence can attach these repositories to managed Postgres, object storage for large graph exports if needed, and queue-backed snapshot scheduling. Realtime sync can use sync checkpoints for reconnect catch-up and session recovery without changing WebRTC or media execution.

## Known limitations

- In-memory repositories are process-local and reset on restart.
- Snapshot scheduling is manual/helper-only.
- Event replay currently advances revision metadata and is intended as a recovery foundation, not a complete event-sourced graph reducer.
- Authentication remains mock/local by design.
- No cloud deployment or migration is required in this phase.
