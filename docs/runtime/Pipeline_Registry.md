# Pipeline Registry

`PipelineRegistry` is the authoritative ingest registry. Every ingest source must register a pipeline before lifecycle, health, metrics, recovery, or ProductionGraph metadata is emitted.

## Registration Fields

- `pipelineId`
- `sourceId`
- `deviceId`
- `sourceType`
- `runtimeAdapter`
- `mediaAdapter`
- `productionGraphNodeId`
- `healthProvider`
- `selectedFormat`
- `priority`

The registry rejects duplicate `pipelineId` values and duplicate source-to-graph registrations.
