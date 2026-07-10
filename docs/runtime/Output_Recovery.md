# Output Recovery

Recovery is metadata-only. Strategies are restart, retry, fallback, manual, and backoff.

The runtime never changes Program routing automatically. Recovery emits `OutputRecovered` with `programRouteUnchanged: true` and increments restart/recovery counters.
