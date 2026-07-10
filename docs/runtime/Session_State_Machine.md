# UBOS v4.6 Session State Machine

Supported states are `Created`, `Loading`, `Ready`, `Running`, `Paused`, `Recovering`, `Stopping`, `Stopped`, `Archived`, and `Disposed`.

Legal transitions:

- `Created` → `Loading`, `Ready`, `Archived`, `Disposed`
- `Loading` → `Ready`, `Stopped`, `Disposed`
- `Ready` → `Running`, `Archived`, `Disposed`
- `Running` → `Paused`, `Recovering`, `Stopping`
- `Paused` → `Running`, `Recovering`, `Stopping`
- `Recovering` → `Ready`, `Running`, `Stopped`
- `Stopping` → `Stopped`
- `Stopped` → `Loading`, `Archived`, `Disposed`
- `Archived` → `Disposed`
- `Disposed` has no outbound transitions

Illegal transitions throw synchronously before metadata is mutated.
