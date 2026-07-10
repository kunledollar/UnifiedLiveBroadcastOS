# Pipeline Metrics

The ingest runtime collects metadata metrics only:

- startup time
- shutdown time
- latency
- buffer depth
- uptime
- restarts
- failures
- recoveries

No UI is introduced in v4.4. Metrics are available through `getPipelineMetrics` and pipeline snapshots.
