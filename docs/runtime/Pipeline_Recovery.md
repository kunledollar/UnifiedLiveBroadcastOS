# Pipeline Recovery

Recovery is metadata-only and never changes Program automatically.

Strategies:

- `restart`: immediate metadata restart.
- `reinitialize`: short reinitialization delay.
- `fallback`: fallback metadata delay.
- `manual`: operator intervention; no automatic retry delay.
- `backoff`: exponential backoff capped at 30 seconds.

Recovery increments recovery metrics and publishes `PipelineRecovered` with the calculated delay.
