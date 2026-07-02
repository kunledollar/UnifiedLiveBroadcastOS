# UBOS Backpressure & Load Management v1

## Purpose

The UBOS Backpressure & Load Management model defines deterministic rules for queue growth, scheduling pressure, subsystem throttling, resource budgeting, load shedding, and graceful degradation. It is an architecture and enforcement contract only: it does not redesign the Control Room UI, and it does not introduce real streaming or recording.

## Design goals

- Keep command ordering and graph integrity deterministic under load.
- Prefer frame execution over diagnostics and background inspection.
- Bound all queues with explicit owners, producers, consumers, priorities, and overflow policies.
- Make overload visible through compact diagnostics without changing existing operator workflows.
- Allow future streaming, recording, and multiview subsystems to inherit budgets without changing the execution contract.

## Deterministic behavior

Backpressure decisions are pure functions of queue metrics, queue budgets, scheduler utilization, and subsystem priority. Unused per-frame execution budget does not roll forward unless a budget explicitly declares bounded rollover. Queue pressure is calculated from `depth / maxSize`, and scheduler pressure is the maximum of scheduler utilization pressure and all queue pressure levels.

## Queue model

| Queue               | Owner                        | Producer                        | Consumer                      | Ordering                    | Max size | Overflow behavior                                     | Priority   |
| ------------------- | ---------------------------- | ------------------------------- | ----------------------------- | --------------------------- | -------: | ----------------------------------------------------- | ---------- |
| `COMMAND_QUEUE`     | Authority/command dispatcher | Operators, automation           | Production graph reducer      | FIFO by command sequence    |      512 | `BLOCK`, then `FAIL_FAST` on contract violation       | `CRITICAL` |
| `EVENT_QUEUE`       | Event log                    | Graph reducer, execution plane  | Sync, persistence, inspectors | FIFO by event sequence      |     2048 | `BLOCK` for persistence, `DEFER` for mirrors          | `HIGH`     |
| `INTENT_QUEUE`      | Planner                      | Graph updates, operator actions | Planner executor              | FIFO by graph revision      |      512 | `MERGE` compatible intents                            | `HIGH`     |
| `FRAME_QUEUE`       | Timing clock                 | Planner                         | Frame executor                | Frame timestamp order       |      120 | `DROP_OLDEST` only for superseded non-identity frames | `CRITICAL` |
| `VIDEO_ROUTE_QUEUE` | Video router                 | Planner/executor                | Video route runtime           | FIFO within frame           |      256 | `COALESCE` by route id                                | `HIGH`     |
| `AUDIO_ROUTE_QUEUE` | Audio router                 | Planner/executor                | Audio route runtime           | FIFO within frame           |      256 | `COALESCE` by route id                                | `HIGH`     |
| `OUTPUT_QUEUE`      | Output subsystem             | Renderer/executor               | Output adapters               | Frame timestamp order       |      180 | `THROTTLE`, then `PAUSE_PRODUCER`                     | `HIGH`     |
| `RENDER_QUEUE`      | Renderer                     | Frame executor                  | Browser/mock renderer         | Frame timestamp order       |      180 | `DROP_OLDEST` preview work; never drop identity       | `NORMAL`   |
| `SYNC_QUEUE`        | Synchronization service      | Event log, collaboration        | Remote operators/clients      | FIFO by revision checkpoint |     1024 | `DEFER` and checkpoint `MERGE`                        | `HIGH`     |
| `DIAGNOSTIC_QUEUE`  | Observability                | All subsystems                  | Developer inspector/log sinks | Best-effort timestamp order |     4096 | `DROP_OLDEST`/`DROP_NEWEST`                           | `LOW`      |

## Queue priorities

Priorities are `CRITICAL`, `HIGH`, `NORMAL`, `LOW`, and `BACKGROUND`.

- Critical queues never starve.
- Background work may pause at `BUSY` or above.
- Diagnostics may drop when overloaded.
- Frame execution is always preferred over diagnostics.
- Command ordering, frame identity, and graph integrity are never downgraded.

## Overflow policies

- `BLOCK`: backpressure producer until capacity exists; used for command and integrity-preserving event paths.
- `DROP_NEWEST`: reject incoming low-value work when newer work is not useful.
- `DROP_OLDEST`: discard stale diagnostics or preview-only frames.
- `MERGE`: combine compatible intents or checkpoints into a deterministic superset.
- `COALESCE`: keep the latest operation for the same route or resource key.
- `DEFER`: move work to a later tick without reordering higher-priority work.
- `THROTTLE`: reduce producer rate while preserving ordering.
- `PAUSE_PRODUCER`: stop non-critical production until recovery.
- `FAIL_FAST`: reject invalid or unsafe work instead of creating nondeterminism.

## Pressure levels

| Level        | Queue utilization | Scheduler behavior                                  | Operator visibility          | Recovery expectation              |
| ------------ | ----------------- | --------------------------------------------------- | ---------------------------- | --------------------------------- |
| `NORMAL`     | < 50%             | Run all eligible work                               | Hidden or green diagnostics  | No recovery needed                |
| `BUSY`       | 50-74%            | Prefer high/critical queues                         | Compact busy indicator       | Recovers as rates normalize       |
| `HEAVY`      | 75-89%            | Throttle normal/low work                            | Developer inspector warning  | Shed background work              |
| `OVERLOADED` | 90-99%            | Defer or drop low-value work                        | Visible degraded diagnostics | Enter deterministic degraded mode |
| `CRITICAL`   | >= 100%           | Protect planner, execution, graph, command ordering | Critical inspector alert     | Pause producers or fail fast      |

Queue health summarizes these levels as `healthy`, `busy`, `stressed`, `critical`, or `recovering`.

## Scheduler and subsystem budgets

Budgets are represented by `ExecutionBudget`, `SubsystemBudget`, and `ResourceBudget`. Default architecture budgets are per frame and do not roll forward unless noted.

| Subsystem        | Priority     |     Budget | Rollover             |
| ---------------- | ------------ | ---------: | -------------------- |
| Planner          | `CRITICAL`   | 2 ms/frame | none                 |
| Renderer         | `NORMAL`     | 8 ms/frame | bounded preview-only |
| Video routing    | `HIGH`       | 2 ms/frame | none                 |
| Audio routing    | `HIGH`       | 1 ms/frame | none                 |
| Outputs          | `HIGH`       | 3 ms/frame | none                 |
| Diagnostics      | `LOW`        | 1 ms/frame | none                 |
| Future recording | `LOW`        | 2 ms/frame | bounded              |
| Future streaming | `LOW`        | 2 ms/frame | bounded              |
| Future multiview | `BACKGROUND` | 4 ms/frame | none                 |

Unused planner, execution, identity, routing, and output budget does not roll forward. Bounded rollover may be used only for optional preview, recording, or streaming buffers and must never delay critical work.

## Resource budget helpers

Shared helpers are lightweight and side-effect free:

- `createQueueBudget()` creates canonical queue limits and thresholds.
- `calculateQueuePressure()` maps queue metrics to pressure level.
- `calculateSchedulerPressure()` combines utilization and queue pressure.
- `shouldThrottleSubsystem()` decides deterministic subsystem throttling.
- `shouldDropWork()` decides low-priority drop eligibility.
- `shouldPauseProducer()` decides producer pause conditions.
- `summarizeQueueHealth()` returns health, utilization, and actions.
- `summarizeSystemLoad()` returns system pressure, degraded modes, and shed work.

## Load shedding

Load shedding always proceeds lowest value first:

1. diagnostics
2. metrics
3. background inspection
4. preview rendering
5. multiview
6. confidence monitoring
7. future recording
8. future streaming

Never shed graph integrity, planner work, execution work, frame identity, or command ordering.

## Degraded operation

Allowed deterministic degraded modes are:

- reduced diagnostics
- reduced preview FPS
- pause multiview
- pause confidence monitor
- disable background inspection
- disable expensive profiling
- mock-only rendering

Allowed transitions are `NORMAL -> BUSY -> HEAVY -> OVERLOADED -> CRITICAL` and reverse recovery through `recovering` summaries. A subsystem may enter a more degraded mode only when pressure stays at or above the required level for the current deterministic evaluation window. Recovery must restore critical ordering first, then high-priority routing/output work, then normal rendering, then diagnostics/background work.

## Observability

Required metrics are queue depth, oldest item age, enqueue rate, dequeue rate, scheduler utilization, frame latency, planner latency, renderer latency, routing latency, pressure level, and active degraded modes. Existing developer inspector surfaces may show compact summaries; no operator workflow change is required.

## Interaction with other contracts

- **Execution Contract:** backpressure cannot introduce runtime media into graph or planner outputs, cannot reorder command execution, and cannot drop execution identity.
- **Timing Contract:** frame queues are ordered by deterministic frame timestamps; stale preview work may be dropped, but frame identity and timing metadata remain intact.
- **Failure Model:** overload can create degraded recoverable failures, subsystem isolation, or fail-fast rejection when integrity would otherwise be compromised.
