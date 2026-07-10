# UBOS v5.1.2 Master Frame Clock

UBOS v5.1.2 extends the v5.1.1 media-plane execution engine with an authoritative, metadata-only master frame clock. The clock is the single owner of runtime frame numbering for scheduling, command draining, tick processors, runtime telemetry, and future media pipelines.

## Rational rate model

Frame rates are represented as `{ numerator, denominator }` rational values, including 24000/1001, 24/1, 25/1, 30000/1001, 30/1, 50/1, 60000/1001, and 60/1. Floating point is display-only; helpers expose labels such as `23.976`, `29.97`, and `59.94`.

## Frame convention and epoch

The first emitted runtime frame is **frame 1 after one complete frame interval**. Frame 0 is the epoch anchor. This preserves target-frame scheduling semantics where commands scheduled for frame 1 run on the first produced clock tick.

Absolute deadlines are derived from the epoch with rational bigint arithmetic:

```text
deadline(frame) = epochNs + floor(frame × 1,000,000,000 × denominator / numerator)
```

The implementation never repeatedly adds a rounded frame duration, so long-duration 29.97 fps and 59.94 fps calculations do not accumulate per-frame rounding drift.

## Execution flow

```mermaid
flowchart LR
  TimeSource[MonotonicTimeSource] --> Clock[MasterFrameClock]
  Wait[FrameWaitStrategy] --> Clock
  Clock --> Tick[FrameTick]
  Tick --> Runtime[RuntimeExecutionEngine]
  Runtime --> Scheduler[DeterministicCommandScheduler]
  Runtime --> Processors[TickProcessorRegistry]
  Runtime --> Telemetry[RuntimeTelemetryCollector]
  Runtime --> Events[RuntimeEventPublisher]
```

## Normal and late timing

```mermaid
sequenceDiagram
  participant C as MasterFrameClock
  participant R as RuntimeExecutionEngine
  participant S as Scheduler
  C->>R: FrameTick(frameNumber, scheduledTimeNs, actualTimeNs)
  R->>S: getDueCommands(frameNumber)
  R->>R: execute handlers and processors in deterministic order
```

```mermaid
flowchart LR
  Wake[Late wakeup] --> Calc[Calculate current timeline frame]
  Calc --> Emit[Emit one authoritative tick]
  Emit --> Missed[Report missedFrames]
  Emit --> Due[Drain commands targetFrame <= current frame]
```

## Drift, lateness, missed frames, and discontinuities

`driftNs` is `actualTimeNs - scheduledTimeNs`. `latenessNs` is the positive portion of that drift. A frame is late when lateness exceeds the configured tolerance. Missed frames count frame boundaries skipped since the prior emitted tick; UBOS emits one tick for the current logical frame and does not replay every missed frame automatically. Commands whose target frame is missed become due on the next emitted frame and execute once.

Discontinuities are marked for pause/resume/reset and severe delays. A monotonic time source moving backward is rejected with a typed error rather than producing negative intervals.

## Pause, resume, stop, and reset

```mermaid
sequenceDiagram
  participant R as Runtime
  participant C as Clock
  R->>C: pause()
  Note over C: frame advancement freezes
  R->>C: resume()
  Note over C: epoch is offset so paused wall time is excluded
  C-->>R: first resumed tick has discontinuity=true
```

`stop()` cancels pending waits. `reset()` returns the clock to the created state and is rejected while actively running.

## Waiting strategy and Node.js limitations

The public clock depends on `FrameWaitStrategy`, not `setTimeout`. Production uses a simple asynchronous timer strategy backed by a monotonic high-resolution time source. Tests use fake time and immediate waiting, so no deterministic validation depends on real sleeping. Node.js timer wakeups are not hard real-time; future phases can host the same contract in a worker, native process, Rust/C++ timing service, shared synchronization service, external genlock bridge, or audio-clock synchronizer.
