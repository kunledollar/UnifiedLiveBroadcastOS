# UBOS v5.1.3 Deterministic Scheduler

The deterministic scheduler is the sole owner of queued runtime commands before execution. It orders due work by target frame, priority, sequence, and command ID; tracks waiting, ready, completed, failed, cancelled, and expired terminal states; and exposes immutable snapshots for telemetry and watchdog observation.

The scheduler does not resolve handlers or execute side effects. Successful dependency satisfaction requires the command executor to report a successful terminal execution back to the scheduler. Failed, cancelled, timed-out, and expired commands are terminal for scheduler eligibility and cannot become executable later.

Histories and queues are bounded by runtime configuration. Due collection is deterministic for the same frame-clock input and command set.
