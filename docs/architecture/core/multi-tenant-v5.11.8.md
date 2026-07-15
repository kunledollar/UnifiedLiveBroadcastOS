# UBOS v5.11.8 Multi-Tenant Organizations and Service Management

## Architecture ownership

`packages/core/src/multi-tenant/` owns metadata-only organization hierarchy, tenant boundaries, workspaces, resource ownership, delegated administration, service catalog subscriptions, quotas, support access, migration records, federation, tenant audit views, tenant analytics views, health, and telemetry. It does not own media execution, credentials, billing collection, or raw customer content.

## Upstream and downstream dependencies

Upstream callers provide identity, organization, tenant, workspace, resource, policy, service, support, usage, and migration metadata. The package reuses the v5.11 observability `HealthStatus` and redaction helper. Downstream consumers use immutable snapshots, tenant-scoped audit and analytics projections, quota decisions, and authorization results.

## Generation, lifecycle, and ownership

Tenant state moves through provisioning, active, suspended, read-only, decommissioning, and deleted statuses. Every resource must be registered through `assignOwnership`, which verifies tenant and workspace existence and rejects organization mismatches. Organization hierarchy and business units are explicit metadata records. Shared infrastructure assignments require encrypted logical isolation when tenants share a cluster.

## Authorization, delegation, and federation

Every authorization request carries a resolved tenant context containing organization, tenant, optional workspace, identity, permissions, and evaluation time. Same-tenant access requires direct policy permission or active delegation. Cross-tenant access is denied by default and only succeeds with both an active federation relationship and matching delegated permission. Support access additionally requires an approved, active, bounded support session.

## Customer lifecycle and service management

Provisioning can create an organization, tenant, default workspace, customer record, quota, and tenant policy atomically in metadata. Service catalog items are provider-owned and subscriptions are tenant-specific. Offboarding revokes active support sessions and preserves audit history by default. Migration records require integrity hashes and preserve source and destination placement metadata.

## Telemetry, health, audit, and redaction

Telemetry reports organization, tenant, workspace, orphan ownership, active delegation, service subscription, support session, federation, and quota-warning counts. Health is warning when orphaned resources or quota warnings are present. Audit entries are metadata-only and tenant-scoped audit queries filter to the requested tenant. Usage billing metadata, service metadata, organization names, administrator IDs, support actors, and ownership creators are redacted where appropriate.

## Failure and shutdown behavior

The engine is synchronous and metadata-only. Invalid parent organizations, unknown tenants, unknown workspaces, unencrypted shared infrastructure, self-delegation, expired support access, missing migration integrity hashes, and cross-tenant access without federation/delegation fail closed. No native handles or background loops are created, so shutdown is a matter of dropping the engine and its bounded in-memory histories.

## Known limitations

Billing systems, identity providers, physical storage partitioning, customer content access, and real migration execution remain external integrations. This phase provides deterministic UBOS ownership, policy, authorization, lifecycle, and audit primitives for those integrations.
