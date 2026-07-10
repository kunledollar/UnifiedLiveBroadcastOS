# UBOS v4.11 API and SDK Compatibility Matrix

| Surface | Version evidence | Result | Notes |
|---|---|---|---|
| Control API | `CONTROL_API_VERSION = 4.10.0`, `METADATA_VERSION = 4.10` | PASS | Version negotiation rejects unsupported versions. |
| Plugin SDK | SDK docs and plugin manifest versions | PASS | Manifest/API/configuration/lifecycle docs explicit. |
| Extension Registry | Plugin SDK registry | PASS | Duplicate IDs and namespace collisions rejected. |
| ProductionGraph | Shared package exports and validation | PASS | Revision/command contracts stable. |
| Runtime contracts | Runtime docs and shared/media-plane exports | PASS WITH WARNING | Broad exports exist; no accidental internal export causing a verified defect found. |
| Example plugin | `examples/plugins/lower-third-demo/ubos.plugin.json` | PASS | Metadata-only example. |
| Package imports | Typecheck/build | PASS | No circular package import failure observed. |
| App-layer dependency hidden in SDK | Static search | PASS | SDK does not import app-layer routes/components. |

## Deprecated contracts

No new deprecated contract was introduced by this certification. Existing v4 docs remain the source of compatibility notes for Version 5 planning.

## Evidence Reviewed

- Runtime core and integration: `packages/media-plane/src/broadcast-runtime-core.ts`.
- Production authority: `packages/shared/src/production-graph.ts`, `packages/shared/src/authority.ts`, `packages/shared/src/production-graph.validation.ts`.
- Control API: `packages/shared/src/control-api/index.ts`, `packages/shared/src/control-api/validation.ts`, `docs/api/*`.
- Plugin SDK and extension registry: `packages/shared/src/plugin-sdk/index.ts`, `packages/shared/src/plugin-sdk/validation.ts`, `docs/sdk/*`, `examples/plugins/lower-third-demo/ubos.plugin.json`.
- Domain runtimes: `packages/shared/src/*runtime*/`, `packages/media-plane/src/*runtime*`, and `docs/runtime/*`.
- UI freeze checks: `apps/web/app/control-room/*`, `packages/shared/src/workspace-manager/*`.
- Targeted searches captured raw-handle, direct-mutation, lifecycle, plugin-safety, boundedness, duplicate-owner, and shell-path evidence.
