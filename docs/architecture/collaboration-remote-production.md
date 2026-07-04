# Collaboration & Remote Production

Phase 11 introduces a **metadata-first** collaboration and remote production foundation for UBOS. This layer prepares professional multi-operator broadcast team workflows without injecting runtime handles into the Production Graph.

## Purpose

UBOS collaboration should feel like a live control room team stack (TV roles, newsroom producer workflow, remote production gallery, Figma-style presence) while remaining:

- Role-aware and workspace-mapped
- Honest when transport, chat, or persistence is unavailable
- Safe for future permission enforcement and intercom/IFB integration
- Metadata-only in the presentation layer

## Role Model

`ProfessionalOperatorRole` defines broadcast team roles:

| Role | Preferred workspace |
|------|---------------------|
| `director` | Director |
| `producer` | Producer |
| `technical_director` | Remote Production |
| `audio_engineer` | Audio Engineer |
| `graphics_operator` | Graphics Operator |
| `replay_operator` | Replay |
| `guest_manager` | Producer (guest panels) |
| `moderator` | Producer (chat panels) |
| `observer` | Remote Production (read-only) |

Mappings live in `packages/shared/src/collaboration-remote/role-mapping.ts`. Permissions are displayed in the UI matrix but **not enforced** in Phase 11.

## Operator Presence Model

`OperatorPresence` tracks:

- Name, role, connection status (`connected` · `idle` · `disconnected` · `reconnecting`)
- Active workspace and current panel
- Metadata-only selected object reference
- Lock count and explicit permission scopes

**Honest states:** No operators connected, Presence unavailable, Collaboration disabled.

Demo simulation operators appear only when `NEXT_PUBLIC_UBOS_DEMO_MODE=true` or `NEXT_PUBLIC_UBOS_SHOW_MOCK_OPERATORS=true`. Otherwise only the local operator metadata is shown.

## Production Lock Model

`ProductionLock` surfaces existing authority lock metadata from `InMemoryAuthorityStore` / `CollaborationLock`:

- Owner, target, lock type, age, expiry
- Conflict status when authority conflicts exist

Phase 11 does **not** implement new lock acquisition behavior — it displays metadata from existing authority simulation.

## Producer Notes Model

`ProducerNote` stores metadata-only notes attached to scenes, sources, guests, graphics, media, or outputs:

- Status: `open` · `resolved` · `pinned`
- Author and timestamp
- Sanitized text (no unsafe HTML)

Notes are held in UI reducer state only. **Persistence required** for saved notes across sessions.

## Guest Manager Workflow

`GuestManagerWorkflow` groups guests by status (invited, waiting, connected, disconnected) and exposes assign/preview/mute/remove actions via existing handler callbacks. Device readiness shows **unavailable** when telemetry is not present. WebRTC internals are not modified.

## Moderator Workflow

`ModeratorWorkflow` displays platform messages when chat metadata exists. Shows honest states: Chat not connected, No messages, Moderator tools unavailable. No live chat integrations in Phase 11.

## Remote Production Readiness

`RemoteProductionState` aggregates:

```typescript
{
  operators: OperatorPresence[];
  locks: ProductionLock[];
  notes: ProducerNote[];
  events: CollaborationEventRecord[];
  collaborationEnabled: boolean;
  containsRuntimeHandles: false;
}
```

`RemoteProductionPanel` reports connected operators, guests, locks, routing, output health, production status, and recovery status.

## Program / Preview Integration

`CollaborationMetadataOverlay` shows subtle top-of-monitor indicators when metadata exists:

- Current director
- Active lock count
- Open note count
- Preview changed-by label

Labels include *Collaboration metadata · Transport unavailable*.

## Validation Rules

Implemented in `packages/shared/src/collaboration-remote/validation.ts`:

- Reject runtime handle keys in metadata
- Unique operator IDs
- Metadata-only lock targets
- Sanitized producer note text
- Valid roles and explicit permissions

## Runtime Limitations (Phase 11)

- No WebSocket/WebRTC collaboration transport
- No live chat, talkback, IFB, or intercom
- No permission enforcement beyond display
- No note persistence
- No Production Graph reducer changes
- Command intents logged via `createCollaborationCommandIntent()` stubs only

## Future Integrations

- Wire collaboration command stubs to realtime sync transport
- Persist `RemoteProductionState` to workspace/session storage
- Enforce `OperatorPermissions` against Production Graph commands
- Intercom / IFB metadata channels
- Live operator cursor and selection sync (metadata references only)

## UI Surfaces

| Surface | Components |
|---------|------------|
| Remote Production workspace | `CollaborationWorkspace` |
| Operations Team tab | `TeamPanel` |
| Bottom dock Team tab | `TeamPanel` |
| Monitors | `CollaborationMetadataOverlay` |

## File Layout

```
packages/shared/src/collaboration-remote/   # types, validation, role mapping
apps/web/app/control-room/collaboration/    # UI components and reducer
docs/architecture/collaboration-remote-production.md
```
