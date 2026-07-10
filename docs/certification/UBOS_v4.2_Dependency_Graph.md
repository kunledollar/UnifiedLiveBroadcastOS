# UBOS v4.2 Dependency Graph Verification

## Runtime lifecycle graph

```text
RuntimeController
  ├─ RuntimeEventBus
  ├─ RuntimeScheduler
  ├─ production-lifecycle
  ├─ DeviceManager
  ├─ SessionManager
  ├─ scene-lifecycle
  ├─ switching-lifecycle
  ├─ recording-lifecycle
  ├─ streaming-lifecycle
  └─ HealthManager
```

## Startup order

The certified RuntimeController order is:

1. Controller validates its own transition.
2. RuntimeScheduler queues the lifecycle command.
3. Controller publishes `runtime.controller.<command>.scheduled`.
4. Controller calls the lifecycle command on each registered subsystem in registry order.
5. RuntimeScheduler drains the queue.
6. Controller publishes `runtime.controller.<command>.completed`.
7. Controller snapshot reports subsystem states and event count.

## Shutdown order

Shutdown uses the same controller-owned fan-out path for `stop` and `dispose`:

1. Controller validates transition from running/paused/initialized/failed states as appropriate.
2. Scheduler queues the command.
3. EventBus publishes scheduled event.
4. Registered subsystems receive the command.
5. Scheduler drains.
6. EventBus publishes completed event.

## Registration graph

| Registration concern | Verification | Status |
| --- | --- | --- |
| Default subsystems | Production, device, session, scene, switching, recording, streaming, health, and scheduler are registered by the controller constructor. | PASS |
| Adapter extensibility | `register(subsystem)` supports explicit runtime adapters for production graph, audio, graphics, replay, recording, streaming, and automation by domain/id contract. | PASS |
| Duplicate registrations | Controller rejects duplicate subsystem IDs. | PASS |
| Orphan subsystems | Required default lifecycle subsystems are present in controller snapshots. | PASS |
| Cycles | Runtime subsystems receive bus references; no certified subsystem-to-subsystem lifecycle ownership cycle was found. | PASS |
| Invalid ownership | Controller snapshots are metadata-only and sanitize runtime handles. | PASS |

## Dependency findings

- UI depends on shared graph contracts and media-plane adapter APIs for display/integration, but Workspace Manager remains the only layout owner.
- ProductionGraph depends on metadata contracts, not media handles.
- RuntimeController depends on runtime subsystem interfaces and the EventBus, not UI or media execution handles.
- Media-plane modules implement execution boundaries and expose metadata/health summaries upward.
