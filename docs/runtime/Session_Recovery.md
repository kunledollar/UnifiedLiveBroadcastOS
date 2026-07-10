# UBOS v4.6 Session Recovery

Session recovery restores metadata ownership boundaries only. `SessionRecoveryManager` validates snapshot ownership, restores workspace preset metadata, registered device IDs, registered input IDs, and registered output IDs, then places the session in `Recovering`.

Recovery does not rebuild media pipelines, recover media buffers, alter Program/Preview, switch scenes, start encoders, restart capture devices, or mutate protected media systems. Runtime integration remains event-bus based through `SessionRecovered` and `SnapshotRestored` events.
