# Rundown Execution

## Command flow

1. Load rundown.
2. Validate rundown.
3. Start rundown.
4. Cue or jump to an item.
5. Take next to mark a ready/cued/next item as executing.
6. Complete, skip, hold, resume, fail, or retry items.
7. Stop, archive, reset, or snapshot as needed.

## TAKE authorization boundary

`takeNext` changes rundown item orchestration state only. It does not place content on Program and does not invoke CUT, TAKE, AUTO, camera switching, graphics insertion, replay playback, or media pipeline operations. Program-changing work remains behind existing authorized ProductionGraph production commands.

## Determinism and idempotency

Command ids and correlation ids prevent duplicate execution, double TAKE requests, repeated event publication, command loops, and recursive trigger storms.
