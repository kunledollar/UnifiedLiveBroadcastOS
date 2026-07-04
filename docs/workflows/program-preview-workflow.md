# Program / Preview Workflow

Phase 10.0.1 connects the Control Room Program and Preview monitors to the existing Production Graph and Production Engine path.

## Architecture

- The Production Graph is the source of truth for `program.sceneId`, `preview.sceneId`, transition type, transition duration, graph revision, and event history.
- The Control Room builds the local graph from persisted scenes and restored production switching state on page load.
- The `LocalProductionCommandDispatcher` applies commands with `applyProductionCommand`, increments graph revisions, records events, and forwards accepted transitions to the Production Engine / media execution layer.
- Program and Preview monitors receive the scenes selected by graph-backed Program/Preview state; no runtime handles are stored in graph state.

## Workflow

1. Selecting a scene dispatches `SET_PREVIEW_SCENE`.
2. The graph validates the scene id, updates `preview.sceneId`, increments revision, and emits `PREVIEW_SCENE_CHANGED`.
3. The Preview monitor updates immediately while Program remains unchanged.
4. TAKE dispatches `TAKE_PREVIEW` and promotes Preview to Program.
5. CUT dispatches `CUT_TO_PROGRAM`, uses zero duration, and immediately updates Program.
6. AUTO dispatches `AUTO_TRANSITION`, uses the configured duration, and performs a timed fade indicator in the Control Room.

## Graph Interaction

The graph reducer rejects unknown scenes, missing program targets, invalid transition types, revision mismatches, and unauthorized commands. Accepted Program/Preview commands mutate only graph state and metadata, never runtime objects or browser media handles.

## Replay

Scene selection, preview changes, program changes, transitions, timeline events, command sequence, and graph revisions are recorded through the existing command and event logs. Replaying commands reconstructs the Program/Preview scene ids and transition metadata from graph state.

## Persistence

The server-side production state persists Program scene, Preview scene, transition type, and transition duration. On refresh, the Control Room restores that state and seeds the graph with the restored scene ids so the monitors resume accurately.

## Diagnostics

The Production Graph Inspector shows current Program scene, current Preview scene, graph revision, timeline entries, and transition metadata. The Media Execution Inspector reflects the Production Engine state after accepted graph transitions.

## Known Limitations

- AUTO currently exposes a simple timed fade indicator; it does not yet render blended frame pixels between Program and Preview.
- Browser renderer output is still metadata-first unless the renderer runtime is enabled in the environment.
- Empty scenes render the honest state `No sources assigned to this scene.` rather than pretending a source is pending.
