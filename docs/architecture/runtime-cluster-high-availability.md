# Runtime Cluster and High Availability Foundation

Phase 28 introduces a metadata-first cluster runtime for UBOS distributed broadcast operations.

## Scope

The runtime models cloud control rooms, remote render nodes, backup nodes, redundant production engines, failover workflows, distributed operators, and multi-site production without introducing real networking.

## Safety Contract

The cluster package is deterministic metadata only:

- No sockets or IP connection attempts.
- No Kubernetes, cloud APIs, peer transport, or node discovery.
- No distributed databases or media replication.
- No credentials or runtime handles in node manifests or queued commands.

## Models

The shared package defines cluster nodes, sessions, topologies, health reports, events, snapshots, history, failover plans and policies, redundancy groups, node assignments, capabilities, and manifests.

## Validation Rules

- Node IDs must be unique.
- Node roles must be one of the supported cluster roles.
- Failover activation requires a standby node.
- Redundancy groups require at least two nodes.
- Unsafe runtime fields such as `runtimeHandle`, `socket`, `ipAddress`, `credentials`, `connection`, and `url` are rejected.

## UI

The control room cluster workspace includes panels for dashboard, node browsing, topology, redundancy, failover plans, node inspection, health, history, and runtime queue. The operations console includes a Cluster tab with node counts, active controller, standby/degraded status, failover status, and cluster health.
