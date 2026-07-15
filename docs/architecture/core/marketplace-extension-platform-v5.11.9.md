# UBOS v5.11.9 Marketplace, Extension Framework, SDK, Plugin Ecosystem, and Developer Platform

## Architecture reviewed

The implementation reuses the existing `@ubos/core` operational architecture established by observability, governance, security operations, and multi-tenant operations. The marketplace and extension framework is modeled as a metadata-only control-plane engine, not as a second runtime or media execution path.

## Ownership and dependencies

- **Owner:** `MarketplaceExtensionPlatform` in `packages/core/src/marketplace`.
- **Upstream dependencies:** observability health/status and redaction; multi-tenant `TenantContext` for tenant-scoped installation authorization.
- **Downstream consumers:** developer portal, marketplace catalog, plugin host/runtime, governance approval workflows, security operations, tenant administration, billing and analytics adapters.

## Generation, isolation, and lifecycle

Extension manifests use explicit semantic versions and immutable snapshots. Installation creates tenant-scoped service identities, scoped granted capabilities, redacted configuration, sandbox limits, health state, and lifecycle state. Plugin crashes degrade or suspend only the extension installation and never mutate UBOS production Program state.

## Security and governance behavior

The engine rejects missing signatures, unknown signing keys, invalid integrity hashes, unsupported UBOS compatibility, unsafe native plugin risk declarations, low-risk declarations for high-risk capabilities, plain-text secret configuration, uncertified listings, missing entitlements, and cross-tenant command requests. Publisher revocation suspends affected installations and revokes identities.

## Observability

Snapshots expose immutable developers, manifests, submissions, certifications, listings, installations, licenses, usage, advisories, audit records, telemetry counters, and health summaries. Customer-sensitive license entitlements and configuration values are redacted before publication.

## Validation

The focused validation covers developer registration, signing keys, manifest validation, high-risk capability review, submission, certification, listing publication, entitlement-gated installation, secret rejection, capability grant filtering, command authorization, tenant-boundary denial, crash-loop suspension, usage metering, advisories, safe uninstall blocking, publisher revocation, redaction, telemetry, and health.

## Known limitations

This phase implements the authoritative metadata and governance control-plane foundation. It does not execute third-party code, process payments, perform real cryptographic signature verification, or run sandboxed plugin processes. Those integrations must bind to this engine rather than bypass it.
