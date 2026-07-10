# Rundown Snapshots and Recovery

Snapshots are metadata-only and include rundown definition, version, current item, next item, completed/skipped/failed items, execution history, operator notes, and validation state.

Recovery restores orchestration state only and moves the rundown to `recovering`. It does not restore media buffers, stream handles, GPU resources, replay players, or Program state. Recovered content is never automatically placed on Program.

Malformed or stale snapshots are rejected when schema version, session ownership, rundown body, or version metadata is invalid.
