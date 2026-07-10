# UBOS v4.10 Control API, Extension Registry & Plugin SDK

## 1. Executive Summary
Implemented the governed external control and extension layer with transport-neutral Control API primitives, capability authorization, rate limiting, idempotency, audit logging, extension registry, plugin lifecycle, sandbox boundaries, SDK helpers, transport adapter boundaries, and a metadata-only example plugin.

## 2. Architecture
`ControlApiGateway` is the sole external-control entry point and delegates production-changing commands to ProductionGraph authorization while preserving runtime ownership boundaries.

## 3. Files Added
- `packages/shared/src/control-api/index.ts`
- `packages/shared/src/control-api/validation.ts`
- `packages/shared/src/control-api/system-status-metadata-plugin.ts`
- `docs/api/*`
- `docs/sdk/*`

## 4. Files Modified
- `packages/shared/src/index.ts`
- `packages/shared/package.json`

## 5. Control API
Transport-neutral command/query/event/session/schema/error managers were added.

## 6. Command Registry
Authoritative typed command registry rejects duplicates and enforces plugin namespaces.

## 7. Query Registry
Authoritative query registry supports metadata-only pagination limits.

## 8. Event Subscriptions
Filtered, authorized subscriptions support history, acknowledgements, heartbeat, expiry, metrics, and loop prevention.

## 9. Authorization
Default-deny capability grants support revocation, target/session/domain scope, expiry, and suspension metadata.

## 10. Rate Limiting
Deterministic burst/sustained decisions include retry/cooldown metadata and emergency exception policy.

## 11. Idempotency
Idempotency records track actor, target, command type, result, timestamps, expiry, and correlation ID.

## 12. Audit Logging
Bounded immutable metadata records cover commands, queries, subscriptions, authorization, schema failures, and lifecycle events.

## 13. Extension Registry
The v4.10 registry is authoritative for manifest metadata and lifecycle state.

## 14. Manifest Validation
Versioned manifests validate IDs, capabilities, dependencies, and sandbox mode boundaries.

## 15. Plugin Lifecycle
Deterministic lifecycle transitions reject illegal transitions.

## 16. Sandbox Boundaries
Only metadata-only and trusted in-process modes are concrete; unsafe handles and raw runtime objects remain unavailable.

## 17. SDK Surface
Safe helper APIs expose registration, events, health, telemetry, configuration, audit context, capabilities, schema validation, version negotiation, and error mapping.

## 18. Transport Adapters
In-process adapter is implemented; HTTP, WebSocket, local IPC, and gRPC are placeholders.

## 19. Client Sessions
Metadata-only sessions track client identity metadata, transport, capabilities, subscriptions, counters, and status.

## 20. Error Model
Stable typed errors avoid stack trace leakage.

## 21. Versioning
Explicit version negotiation rejects incompatible versions.

## 22. Monitoring Integration
Plugin health metadata is reported through `ExtensionHealthManager` for Monitoring Runtime consumption.

## 23. ProductionGraph Integration
Summary metadata maps active clients, plugin counts, subscriptions, health, and last audit event without storing audit history in ProductionGraph.

## 24. Example Plugin
`SystemStatusMetadataPlugin` registers one metadata query, publishes health and telemetry metadata, and avoids media, Program mutation, UI injection, filesystem, network, and processes.

## 25. Test Results
Validation covers command registration, duplicates, schema validation, query pagination, subscription filtering/authorization, grants/revocation, rate limits, idempotency, stale revisions, audits, manifest validation, duplicate plugins, dependencies/cycles, lifecycle transitions, configuration, namespaces, sandbox safety, health, event propagation, recursion prevention, transports, sessions, errors, versioning, summary mapping, and disposal.

## 26. Build Results
See final assistant response for exact commands and observed results.

## 27. Known Limitations
Remote network transports and advanced sandboxes are boundaries only.

## 28. Security Risks
Future trusted in-process plugins require review because they share the host process even though SDK objects are metadata-only.

## 29. Deferred Work
Marketplace, downloads, OAuth/SSO, WASM, worker/native isolation, production remote transports, AI-agent plugins, and arbitrary UI are deferred.

## 30. Recommendation
Proceed with security review before enabling non-metadata-only plugins or remote transports in production.
