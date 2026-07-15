# UBOS v5.11.0 Developer Experience, Documentation Platform, Simulation Labs, Certification Academy, and Partner Program

## Architecture ownership

`packages/core/src/platform-ecosystem/` owns the metadata-only platform ecosystem registry for versioned documentation, API explorer endpoints, tutorials, simulation labs, learning paths, certification tracks, certification attempts, partner program entries, hardware certifications, example projects, audit history, health, and telemetry.

## Production safety

The registry never executes live media workloads, real device control, billing, identity-provider operations, or external learning systems. Published simulation labs must use synthetic-only isolation, examples require security notes, API explorer responses are simulated and redacted, documentation content is redacted before storage, and snapshots are deterministic immutable clones.

## Validation

Focused validation is wired as `pnpm --filter @ubos/core validate:v5.11.0` and covers versioned docs, safe API explorer endpoints, tutorial publication, synthetic-only lab enforcement, learning paths, certification tracks and attempts, partner registration, hardware certification, example projects, lab authorization denial, telemetry, redaction, package exports, and test aggregation.

## Release boundary

This phase closes the v5.11 platform as a production-safe metadata-plane ecosystem release. Tag creation and publication remain explicit maintainer actions.
