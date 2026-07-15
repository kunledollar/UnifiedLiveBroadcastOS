# UBOS v5.11.0 Platform Ecosystem Architecture

## Ownership

The platform ecosystem registry is owned by `@ubos/core` and publishes metadata-only snapshots for documentation, training, simulation, certification, partner, and example-program artifacts. It does not own the media runtime, scheduler, FrameTick source, command engine, or production buses.

## Reused Architecture

The design follows the existing v5.11 core pattern: bounded metadata registries, deterministic snapshots, explicit exports, package-level validation scripts, and no production-control side effects.

## Lifecycle and Generation Behavior

Artifacts are registered with an explicit platform version and immutable publication state. A version mismatch is rejected before insertion. Published snapshots are stable-sorted by identifier for deterministic output.

## Simulation Safety

Simulation labs must declare an isolation mode and `syntheticDataOnly`. Registration rejects labs that do not satisfy those invariants so training environments cannot control live infrastructure.

## Commands and Events

This phase introduces no runtime commands and no live events. Downstream portals, academies, and partner workflows consume immutable metadata snapshots.

## Health, Telemetry, Watchdog, and Source Graph

The registry exposes validation checks as metadata-only health evidence. It does not emit credentials, URLs, file paths, raw media, native handles, Source Graph mutations, or watchdog authority.

## Security and Redaction

Snapshots contain only public ecosystem metadata. Certification and partner approval systems are modeled as auditable artifact definitions; candidate identities, exam answers, tenant credentials, and partner secrets are intentionally out of scope.

## Validation

`pnpm --filter @ubos/core validate:v5.11.0` builds the package and validates ecosystem coverage, lab isolation, certification renewal requirements, partner prerequisites, and documented security invariants.

## Known Limitations and Handoff

This phase establishes the production-safe metadata foundation for the v5.11 ecosystem platform. Future work may attach portals, search indexes, API explorers, classroom content, proctoring integrations, and hardware test harnesses to these metadata contracts.
