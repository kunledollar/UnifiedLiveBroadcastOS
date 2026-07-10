# Rundown Snapshots and Recovery

Snapshots contain the rundown definition, current and next item IDs, completed/skipped/failed IDs, execution history, operator notes, validation state, and rundown version. They explicitly contain no media handles.

Recovery restores orchestration state only, moves the rundown to recovering, marks media restoration as false, and rejects stale or malformed snapshots. It does not recreate media buffers and does not place recovered content on Program.
