# High Availability Runtime

Phase 9.8 adds a metadata-only high availability layer for the UBOS media plane. The runtime supervises production runtimes, records health and heartbeat replay events, plans automatic recovery, and coordinates failover without serializing runtime handles.

## Cluster architecture

A cluster is composed of primary, secondary, backup, and standby nodes. Standby nodes can be hot, warm, or cold. Nodes expose only serializable metadata: role, state, leader state, priority, heartbeat timestamps, active session ids, and subsystem health metadata. Runtime handles such as FFmpeg processes, WebRTC peer connections, GPU devices, sockets, DOM nodes, streams, and audio nodes are rejected from cluster metadata.

## Leader election

Leader election chooses the highest-priority healthy node and marks it as the single leader. Validation rejects invalid clusters, missing leaders, and multiple simultaneous leaders. During primary failure, the failover manager marks the failed node unavailable, selects an eligible standby, promotes it, and applies election state to preserve a single leader.

## Recovery

Recovery is expressed as a `RecoveryManifest` containing ordered metadata steps. Supported actions include subsystem restart, encoder restart, FFmpeg restart, recording restart, streaming restart, renderer restart, WebRTC restart, audio restart, node restart, cluster restart, standby promotion, pipeline migration, session migration, recovery confirmation, and health stabilization. Restart and retry policies define limits, retry windows, cooldowns, backoff, priority recovery, recovery ordering, and dependency recovery.

## Failover

Automatic failover covers primary failure, leader election, standby promotion, pipeline migration, session migration, recovery confirmation, and health stabilization. Failover events are recorded for replay and surfaced on the Control Room dashboard alongside standby status and subsystem health.

## Replay

Replay stores health snapshots, heartbeat history, failover events, recovery events, and cluster events. Every replayable object includes `containsRuntimeHandles: false`; manifests and snapshots are safe to serialize with the production graph because they contain metadata only.

## Security

The runtime prevents handle leakage using metadata sanitization and validation. Unsafe restart plans, circular recovery dependencies, invalid failover requests, invalid clusters, and multiple leaders are rejected before execution. Feature flags gate runtime availability: `UBOS_ENABLE_HIGH_AVAILABILITY` and `NEXT_PUBLIC_UBOS_HIGH_AVAILABILITY` must both be `true`.

## Validation coverage

Validation covers lifecycle, leader election, recovery planning, failover, replay metadata safety, security rejection paths, and feature flags.
