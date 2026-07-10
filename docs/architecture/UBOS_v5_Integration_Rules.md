# UBOS v5 Integration Rules

UBOS Version 5 media-execution development may proceed only by integrating through the certified Version 4 platform contracts.

## Mandatory rules

1. Extend existing owners instead of replacing them.
2. Use ProductionGraph authorization for every production-changing command.
3. Use RuntimeController for lifecycle, dependency ordering, startup, shutdown, snapshots, and disposal.
4. Use RuntimeEventBus for cross-runtime metadata events.
5. Publish monitoring metadata for new media-execution states, health, alerts, and incidents.
6. Use ControlApiGateway for external control with schema validation, authorization, rate limiting, idempotency, audit, and safe errors.
7. Use ExtensionRegistry and Plugin SDK for extensions.
8. Keep UI independent of media execution; UI consumes metadata and never owns media processing.
9. Preserve metadata-only persistence boundaries; no raw frames, samples, encoded packets, runtime handles, credentials, process handles, or internal runtime objects may be persisted or serialized.
10. Add compatibility tests for every v5 extension path.
11. Preserve v4 API and SDK contracts unless a versioned replacement is introduced.

## Integration paths

| v5 concern | Required v4 integration point |
| --- | --- |
| Operator media command | Command Center Shell → ProductionGraph → RuntimeController → RuntimeEventBus → domain runtime → MonitoringRuntimeController → UI metadata. |
| External automation/control | ControlApiGateway → schema validation → authorization → rate limit → idempotency → ProductionGraph → runtime path → audit → monitoring → response. |
| Session/rundown automation | SessionRuntimeController → RundownRuntimeController → AutomationRuntimeController → ProductionGraph-authorized command → event history → monitoring. |
| Device-to-output health | DeviceManager → IngestRuntimeController → runtime path → OutputRuntimeController → MonitoringRuntimeController → alert/incident → UI/API metadata. |

## Required evidence for v5 pull requests

Each v5 PR must document ownership, authorization path, lifecycle path, event path, monitoring path, compatibility tests, security review, rollback plan, and any v4 contract impact.
