# Production Scenes — Phase 1

## Hierarchy and density
The Control Room keeps the stable Program/Preview monitor and switcher boundary intact. The new Production Scenes panel is a metadata-only blueprint catalog: state rail and sequence establish scan order, while standard cards expose composition, readiness, destinations, capabilities, timing, and the next operator action. Compact density preserves state, identity, critical readiness, and next action; selection opens the inspector for the expanded blueprint.

## State model
The catalog is deterministic, readonly, and serializable. It contains explicit program, preview, ready, standby, warning, error, disabled, and scheduled examples. Program red and Preview green are reserved operational signals. Warning and output failures remain visible both on cards and inside validation.

## Safety separation
The panel is deliberately not connected to scene switching, program ownership, source selection, or output execution. Its only interactive state is local presentation state (selection, filters, query, and density). No media elements, streams, runtime registries, timers, DOM measurement, or production graph commands are introduced. Clicking a card only selects its metadata and opens the read-only inspector.
