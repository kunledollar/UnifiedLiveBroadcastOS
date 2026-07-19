# Workspace Manager v2 corrective plan

## Product direction

UBOS workspaces are operational environments rather than saved panel layouts. The system begins with the operator role, derives responsibilities and information priorities, then exposes tools and panels. Layout is the final responsive expression of that contract.

## Current architecture and corrective migration

The original v2 catalog was layered on top of `workspacePresets`, leaving the
legacy preset map as the primary configuration. The corrective work reverses
that dependency: built-in definitions are canonical, and `workspacePresets`
is a compatibility adapter for the existing layout engine. A versioned custom
registry stores only serializable presentation snapshots, never production
runtime state.

## Delivery slices

1. Make the nine built-in definitions canonical and derive the compatibility preset adapter.
2. Add a versioned custom workspace registry, safe parser, normalized layout comparison, and status resolver.
3. Continue using the existing panel registry and geometry engine rather than adding a second dock system.
4. Make the workspace ribbon expose real Factory/Saved/Unsaved state, role status, and custom workspace lifecycle actions.
5. Validate contracts, custom persistence, dirty transitions, responsive geometry, and runtime isolation.

## Safety boundary

Only serializable layout metadata is saved. Program, Preview, scene state, media, audio, guest, output, and production-graph runtime state remain owned by their existing runtimes.
