# UBOS v4.11 Plugin SDK Security Audit

## Threat model summary

Plugins are treated as untrusted metadata extensions. They may register namespaced commands, queries, events, configuration, health, and manifest metadata. They must not receive DOM/React objects, raw media handles, sockets, process/filesystem/native/GPU/encoder/database handles, secrets, or unrestricted environment variables. Production-changing plugin commands must go through ControlApiGateway and ProductionGraph authorization.

| Control | Result | Evidence |
|---|---|---|
| Manifest validation | PASS | Plugin validation tests passed. |
| Unique plugin IDs | PASS | Registry rejects duplicates. |
| Namespace enforcement | PASS | Plugin commands/queries must be plugin-ID namespaced. |
| Dependency resolution/cycle rejection | PASS | Plugin validation passed cycle checks. |
| Incompatible versions rejected | PASS | Version fields explicit and validation present. |
| Invalid capabilities rejected | PASS | Capability enums validated. |
| Legal lifecycle transitions | PASS | Plugin lifecycle validation passed. |
| Plugin events registered | PASS | Event definitions are part of metadata manifest. |
| Core command override prevention | PASS | Core namespace impersonation is rejected. |
| Metadata-only queries | PASS | SDK docs and validation forbid raw handles. |
| Example plugin safety | PASS | Example lower-third manifest is metadata-only. |
| Sandbox honesty | PASS WITH WARNING | Sandbox modes are represented in docs/contracts; runtime OS-level sandboxing is not claimed. |

## Unsafe object access

Targeted searches found forbidden names only in deny lists, docs, validators, or safe runtime implementations, not as Plugin SDK capabilities.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
