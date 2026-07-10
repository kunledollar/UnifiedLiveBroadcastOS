# Rundown State Machine

## Lifecycle diagram

```mermaid
stateDiagram-v2
  created --> loading
  created --> archived
  created --> disposed
  loading --> validated
  loading --> failed
  loading --> stopped
  validated --> ready
  validated --> failed
  ready --> running
  ready --> archived
  ready --> stopped
  running --> paused
  running --> completed
  running --> failed
  running --> stopped
  running --> recovering
  paused --> running
  paused --> stopped
  paused --> recovering
  recovering --> ready
  recovering --> running
  recovering --> failed
  recovering --> stopped
  completed --> archived
  completed --> disposed
  stopped --> loading
  stopped --> archived
  stopped --> disposed
  archived --> disposed
```

Illegal transitions are rejected by `RundownLifecycleManager`.

## Item state table

| State | Allowed next states |
|---|---|
| pending | validating, ready, cancelled |
| validating | ready, invalid |
| invalid | validating, cancelled |
| ready | cued, next, held, skipped, executing, cancelled |
| cued | next, ready, held, skipped, executing, cancelled |
| next | executing, cued, skipped, held, cancelled |
| executing | completed, failed, held, cancelled |
| completed | recovered |
| skipped | recovered |
| held | ready, cued, executing, skipped, cancelled |
| failed | recovered, cancelled |
| recovered | ready, completed |
| cancelled | none |
