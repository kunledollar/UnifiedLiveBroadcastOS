# UBOS v4.12 Platform Baseline

## 1. Executive Summary

UBOS v4.12.0 freezes Version 4 as the Platform Architecture Baseline before Version 5 media-execution work. No product capability, UI redesign, runtime subsystem, transport, or media pipeline behavior was added for this release gate.

Final decision: **🟡 UBOS v4.12 CERTIFIED WITH MINOR ISSUES**. Version 5 readiness: **READY FOR VERSION 5 AFTER NAMED FIXES**.

Named fixes before unrestricted v5 work: restore/confirm the canonical `main`/`origin/main` repository linkage in the operator environment and run `pnpm build` where `index.crates.io` is resolvable.

## 2. Version 4 capabilities

| Version | Capability | Status |
| --- | --- | --- |
| v4.1 | Broadcast Runtime Core | Present and validated. |
| v4.2 | Runtime Integration Layer | Present and documented. |
| v4.3 | Device & Hardware Integration | Present and documented. |
| v4.4 | Media Pipeline & Ingest Runtime | Present and documented. |
| v4.5 | Broadcast Output & Distribution Runtime | Present and documented. |
| v4.6 | Broadcast Session & Show Runtime | Present and documented. |
| v4.7 | Rundown & Show Control Runtime | Present and documented. |
| v4.8 | Production Automation & Trigger Runtime | Present and documented. |
| v4.9 | Monitoring, Telemetry & Alert Runtime | Present and documented. |
| v4.10 | Control API, Extension Registry & Plugin SDK | Present and documented. |
| v4.11 | Architecture, Security & Integration Certification | Present and authoritative. |

## 3. Certified architecture

The certified ownership model remains: Workspace Manager owns layout; Command Center Shell owns the active Control Room shell; ProductionGraph owns production metadata and authorized commands; RuntimeController owns lifecycle; RuntimeEventBus owns cross-runtime metadata propagation; domain runtime controllers own their subsystems; ControlApiGateway owns external governed control; ExtensionRegistry owns extensions; Media Plane owns media processing.

## 4. Runtime subsystems

Frozen runtime subsystems are Broadcast Runtime Core, Runtime Integration Layer, Device Runtime, Ingest Runtime, Output Runtime, Session Runtime, Rundown Runtime, Automation Runtime, Monitoring Runtime, Control API, Extension Registry, Plugin SDK, and Media Plane adapters for recording, streaming, replay, graphics, audio, FFmpeg, and GPU composition.

## 5. Control API

The Control API remains default-deny, schema-validated, authorized, rate-limited, idempotent, audited, bounded-subscription, safe-error, and ProductionGraph-authorized.

## 6. Plugin SDK

Plugin integration remains manifest-driven, namespace-scoped, lifecycle-governed, sandboxed, and metadata-only. Plugins must not access internal runtime objects, raw media handles, filesystem, arbitrary network, process spawning, raw environment, or secrets.

## 7. Monitoring

Monitoring owns telemetry aggregation, alert evaluation, incident records, diagnostic snapshots, health history, and metadata exposure to UI/API consumers.

## 8. Security model

Security checks reconfirm default-deny API behavior, capability checks, audit logging, bounded subscriptions, safe errors, plugin manifest validation, namespace isolation, sandbox boundaries, no direct Program mutation, no direct media access, and metadata-only persistence.

## 9. Validation results

- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: PASS.
- `pnpm --filter @ubos/shared test`: PASS.
- `pnpm --filter @ubos/media-plane test`: PASS.
- `pnpm --filter @ubos/web build`: PASS with Next.js ESLint-plugin warning.
- `pnpm build`: FAIL in desktop Cargo build because `index.crates.io` could not be resolved; classified environmental for this run.

## 10. Known issues

| ID | Classification | Subsystem | Issue | Release blocking |
| --- | --- | --- | --- | --- |
| V4.12-ENV-001 | Environmental | Desktop build | Cargo could not resolve `index.crates.io` while fetching `serde`. | No, provided operator reruns with network/DNS. |
| V4.12-REPO-001 | High / environment-specific | Repository sync | This container has no configured remote and no local `main`; active branch is `work`. | Blocks final operator tag until canonical repository environment is confirmed. |
| V4.12-WARN-001 | Low | Web build lint config | Next.js build warns the Next.js ESLint plugin is not detected. | No. |
| V4.11-WARN-001 | Accepted limitation | Runtime Core | v4.11 noted core RuntimeEventBus replay bound visibility as a warning. | No, accepted for v4 baseline unless future evidence proves unbounded critical history. |
| V4.11-ENV-001 | Environmental | Hardware/media integrations | Physical hardware, live capture, and live destination credential destructive tests were not run in container. | No. |

## 11. Accepted limitations

Container validation cannot prove live hardware devices, live destination credentials, actual crates.io access during desktop build, or GitHub closed-PR branch state without a configured remote. These are operator-environment checks, not product behavior changes.

## 12. Environmental build limitation

Exact failure excerpt: Cargo failed to download `https://index.crates.io/config.json` with `[6] Could not resolve hostname (Could not resolve host: index.crates.io)` while resolving `serde` for `ubos-desktop`.

Local verification command for a networked environment:

```bash
git checkout main
git pull --ff-only origin main
pnpm install
pnpm build
```

## 13. Upgrade notes

No runtime behavior changes or package-version changes are introduced by v4.12 documentation freeze. Operators should consume this baseline as a certification/documentation release.

## 14. Compatibility notes

Version 4 API and SDK contracts are frozen. Version 5 must preserve v4 contracts unless introducing versioned replacements with compatibility tests.

## 15. Version 5 readiness

Version 5 is ready after named repository and desktop-network verification fixes. v5 work must follow `docs/architecture/UBOS_v5_Integration_Rules.md`.

## 16. Rollback guidance

Use the approved v4.12 tag once created. If rollback is needed after later v5 work, check out tag `v4.12.0` or an operator-created rollback tag such as `rollback/v4.12.0-pre-v5`.
