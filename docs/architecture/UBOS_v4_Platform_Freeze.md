# UBOS v4 Platform Freeze

Release identity: **UBOS v4.12.0 — Platform Architecture Baseline**. The repository still uses coordinated package version `1.0.0-rc.1`; package versions are not changed because no existing package policy maps platform certification numbers to npm package versions.

## Frozen ownership contracts

| Area | Frozen owner | Contract |
| --- | --- | --- |
| UI ownership | Workspace Manager and Command Center Shell | Workspace Manager owns layout; Command Center Shell owns the active Control Room shell; Program and Preview monitors render metadata/status only. |
| ProductionGraph | ProductionGraph | Owns production metadata, revision checks, and authorized production commands. Production changes must not bypass graph authority. |
| Runtime lifecycle | RuntimeController | Owns subsystem registration, dependency ordering, startup, shutdown, snapshots, and disposal. |
| Event bus | RuntimeEventBus | Owns cross-runtime metadata event publication and propagation. Payloads remain metadata-only and correlation-aware. |
| Device | DeviceManager | Owns device registration, state transitions, health, and hardware metadata. |
| Ingest | IngestRuntimeController | Owns ingest pipeline registration, lifecycle, recovery, and graph metadata adapters. |
| Output | OutputRuntimeController | Owns output registration, routing metadata, state, metrics, and recovery. |
| Session | SessionRuntimeController | Owns broadcast session lifecycle, snapshots, recovery, and session metadata. |
| Rundown | RundownRuntimeController | Owns rundown state, items, cue/current/next behavior, validation, snapshots, and audit history. |
| Automation | AutomationRuntimeController | Owns automation triggers, scheduling, authorization handoff, execution history, and recovery. |
| Monitoring | MonitoringRuntimeController | Owns telemetry aggregation, alert rules, incidents, snapshots, and observability metadata. |
| Control API | ControlApiGateway | Owns schema validation, default-deny authorization, rate limits, idempotency, audit, bounded subscriptions, and governed external control. |
| Plugin SDK | ExtensionRegistry and Plugin SDK | Own extension registration, manifest validation, namespace isolation, lifecycle, sandbox boundaries, and metadata-only APIs. |
| Media Plane | Media Plane | Owns media execution planning and adapters for recording, streaming, replay, graphics, audio, FFmpeg, and GPU composition. |
| Metadata boundaries | ProductionGraph, RuntimeEventBus, SDK/API adapters | Persistent and cross-boundary state must not serialize raw media handles, frame/audio payloads, secrets, process handles, or internal runtime objects. |
| Security boundaries | Control API and Plugin SDK | Default deny, capability checks, bounded subscriptions, safe errors, audit logging, and sandbox restrictions are mandatory. |

## Version 5 extension rules summary

Version 5 must extend the existing owners instead of replacing them, use ProductionGraph authorization for production changes, use RuntimeController for lifecycle, use RuntimeEventBus for cross-runtime metadata events, expose monitoring metadata, use Control API for external control, use Plugin SDK for extensions, preserve UI/media-plane independence, keep metadata-only persistence, add compatibility tests, and preserve v4 API/SDK contracts unless versioned.

## Change-control rule

Any Version 5 change that alters a frozen Version 4 contract must include:

1. an architecture decision record;
2. a migration plan;
3. a compatibility-impact assessment;
4. a security review;
5. a regression plan; and
6. explicit approval before merge.
