# UBOS v4.11 Control API Security Audit

| Control | Result | Evidence |
|---|---|---|
| Default-deny authorization | PASS | Missing grants/capabilities reject by default. |
| Capability checks/scopes/revocation | PASS | Grant, scope match, expiry, suspended, and revoke paths present. |
| Stale session rejection/client lifecycle | PASS WITH WARNING | Session manager models active/suspended/revoked/closed/disposed; transport-level exhaustive tests are not present. |
| Schema validation | PASS | Gateway validates registered input schemas before execution. |
| Query bounds | PASS | Query definitions include `maximumResultSize`, pagination, and gateway limits. |
| Event subscription filtering/redaction | PASS | Subscription filters by type/domain/source/session/correlation/severity; plugin core namespace impersonation rejected. |
| Rate limiting/burst/retry-after | PASS | RateLimitManager returns remaining/retry metadata. |
| Idempotency | PASS | Duplicate idempotency keys return recorded result. |
| Audit logging | PASS | Bounded audit manager records accepted/rejected/executed events. |
| Error sanitization | PASS WITH WARNING | Errors are mapped to structured values; full stack-trace leakage was not observed but transport serializers were not destructively tested. |
| Version negotiation | PASS | Unsupported versions throw incompatible-version errors. |
| Stale revision handling | PASS | ProductionGraph revision mismatch returns stale revision error before execution. |

## Bypass review

No verified bypass was found for direct registry access, direct RuntimeEventBus publication from plugins, direct ProductionGraph mutation through Control API, missing core capability checks, unbounded query/replay paths, duplicate command amplification, or stack trace leakage. Remaining warning is limited to lack of destructive transport security testing.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
