# Phase 5.5 Multi-Operator Control Room

Phase 5.5 exposes UBOS collaboration primitives as a professional, local-only multi-operator Control Room experience. It does not change media execution, routing, WebRTC, streaming, recording, backend APIs, or the Production Graph command/reducer model.

## Operator model

A collaboration operator represents a human role in the control room: Director, Producer, Technical Director, Audio Engineer, Graphics Operator, Guest Manager, Moderator, or Viewer. Operators include avatar initials, display name, role, presence, connection state, current activity, observed graph revision, authority scopes, active authority scope, lock count, shared selection, and workspace awareness.

## Presence model

Presence is in memory and transport agnostic. Supported UI states are `online`, `offline`, `idle`, `active`, `editing`, `reviewing`, `presenting`, and `disconnected`, with legacy `away` and `reconnecting` retained for compatibility. Presence tracks `joinedAt`, `lastSeenAt`, `currentWorkspace`, `selectedPanel`, `selectedScene`, `selectedGuest`, `selectedDestination`, and `activeAuthorityScope`.

## Shared selection state

Shared selection exposes operator intent only. It supports scene, guest, source, destination, overlay, lower third, and media asset selections. It never moves cameras, changes layouts, starts media, or mutates broadcast state unless a Production Graph command is dispatched through the existing command layer.

## Activity model

The activity feed is a projection of Production Graph commands, collaboration events, and authority events. It is intentionally not a separate canonical state store. Example activities include cuts, scene edits, audio changes, graphics publication, guest admission, recording changes, and destination changes.

## Workspace awareness

Workspace awareness is informational. Each operator can publish current view, program focus, workspace preset, and visible panels so teammates understand where work is happening. UBOS does not remotely control another operator's layout.

## Collaboration timeline

The timeline is a newest-first chronological diagnostic view over joins, disconnects, authority changes, lock acquisition/release/expiry, conflicts, accepted commands, rejected commands, and broadcast actions.

## Notification model

Notifications are lightweight projections of collaboration events and command/authority outcomes. They reuse existing event data for short messages such as program cuts, audio mutes, lower-third updates, guest admissions, authority transfers, lock expiry, and conflict resolution.

## Diagnostics

The Collaboration Inspector groups operational diagnostics into Presence, Authority, Locks, Revisions, Transport, Pending Commands, Sync, Latest Commands, Latest Events, Latest Conflicts, Recent Activity, and Connection State. Sections are collapsible to keep the broadcast UI compact.

## Relationship to the authority layer

Authority scopes, lock counts, lock ownership, conflicts, and command arbitration continue to come from the Phase 5.4 authority model. The Control Room only renders these decisions and does not introduce a second permission system.

## Relationship to the Production Graph

The Production Graph remains authoritative for production state. Collaboration presence, selection, activity, and workspace awareness are ephemeral in-memory control-plane signals around the graph. Broadcast-changing actions must still become commands accepted by graph reducers.

## Future server implementation

A server implementation can replace the local simulation with room-scoped WebSocket presence, durable command/event replay, heartbeat-derived connection state, persisted audit timelines, and reconnect recovery. The UI data shape is intentionally aligned with the existing collaboration/session/sync models so the backend can become the source of collaboration events without rewriting Control Room components.
