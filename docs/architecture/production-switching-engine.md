# Production Switching Engine (UBOS 2.0 Phase 2.11)

Phase 2.11 introduces a backend-independent `ProductionSwitcher` for deterministic Preview/Program production control. The switcher owns metadata-only scene assignment state, promotes Preview to Program through Cut, Take, and Auto commands, and records replayable diagnostics without storing media payloads or runtime handles.

## Responsibilities

- Maintain independent `previewSceneId` and `programSceneId` assignments.
- Promote Preview to Program with deterministic Cut, Take, and Auto semantics.
- Expose transition scheduling interfaces and transition duration metadata before visual transition rendering exists.
- Integrate by metadata reference with `SceneCompositor`, `PreviewOutput`, `ProgramOutput`, and `MediaClock`.
- Emit runtime events: `preview_changed`, `take`, `cut`, `auto`, and `program_changed`.
- Preserve switch history for diagnostics and future replay tooling.

## Transition Model

`TransitionMetadata` describes the requested transition kind, duration, scheduled frame identity, scheduled presentation timestamp, source Program scene, destination Program scene, Preview scene, status, and metadata flags. Visual transitions are intentionally placeholders in this phase: dissolve, wipe, stinger, and DVE rendering are not implemented.

## Runtime Events

Every runtime event includes the current MediaClock frame, Preview scene id, Program scene id, optional transition metadata, and sanitized metadata. Events are retained in memory for diagnostics and are safe to serialize.

## Demo

`createProductionSwitcherDemo()` creates a switcher with `scene:host` on Program and `scene:guest` on Preview, then performs a Take. The resulting Program scene becomes `scene:guest`, demonstrating Preview promotion without invoking any rendering-specific backend.

## Constraints

- No dissolve rendering.
- No wipe rendering.
- No stinger support.
- No DVE effects.
- No macro automation.
- No runtime handles, media frames, GPU textures, DOM nodes, or encoded payloads in switcher state.
