# UBOS v4.11 Known Issues and Risks

| Issue ID | Subsystem | Severity | Evidence | User impact | Security impact | Required fix | Blocks v5? |
|---|---|---|---|---|---|---|---|
| V411-WARN-001 | RuntimeEventBus | Minor | Core `RuntimeEventBus` stores replay events in an array without a visible max. | Long sessions could accumulate metadata events in memory. | Low; metadata-only, not a handle leak. | Add/verify bounded retention policy before high-scale soak. | No, if accepted for v5 planning. |
| V411-WARN-002 | Control API transports/client sessions | Minor | Gateway/session models validated, but no destructive transport fuzzing or full stale-session integration suite was run. | Edge clients may need additional transport hardening tests. | Medium if transport adapters diverge from gateway semantics. | Add targeted transport integration/fuzz tests. | No, if accepted; yes before exposing hostile networks. |
| V411-WARN-003 | Build environment | Environmental | `pnpm build` failed downloading crates.io config because DNS for `index.crates.io` could not resolve. | Desktop binary build not proven in this container. | None identified. | Re-run in environment with crates.io DNS/cache access. | No for architecture; yes for desktop release packaging. |
| V411-WARN-004 | UI diagnostics routes | Minor | Multiple `/control-room/*` pages exist for runtime diagnostics. | Operator navigation complexity if treated as shells. | Low. | Keep Command Center as only full shell; document diagnostics as panels/routes. | No. |

## Release recommendation

🟡 UBOS VERSION 4 CERTIFIED WITH MINOR ISSUES

Version 5.0 readiness: Ready after accepting the named non-blocking warnings and rerunning desktop build in a network-capable or cached Cargo environment.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
