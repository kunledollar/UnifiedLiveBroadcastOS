# UBOS v4.7 Rundown & Show Control Runtime

## 1. Executive Summary
Implemented a deterministic, metadata-only Rundown Runtime for show-control orchestration inside UBOS production sessions.

## 2. Architecture
Added RundownRuntimeController and supporting registry, lifecycle, item, execution, validation, cue, snapshot, recovery, health, metrics, and event adapter components.

## 3. Files Added
- packages/media-plane/src/rundown-runtime.ts
- docs/runtime/Rundown_Runtime_Architecture.md
- docs/runtime/Rundown_State_Machine.md
- docs/runtime/Rundown_Item_Contract.md
- docs/runtime/Rundown_Validation.md
- docs/runtime/Rundown_Execution.md
- docs/runtime/Rundown_Snapshots_and_Recovery.md
- docs/runtime/Rundown_Event_Flow.md
- docs/runtime/Rundown_Audit_History.md

## 4. Files Modified
- packages/media-plane/src/index.ts
- packages/media-plane/src/media-plane.validation.ts

## 5. Rundown Lifecycle
States are created, loading, validated, ready, running, paused, recovering, completed, stopped, archived, failed, disposed; illegal transitions are rejected.

## 6. Item Types
All requested item metadata types are supported, including custom and unknown.

## 7. Item State Machine
Item transitions are deterministic and reject illegal movement, including mutation/reorder protections for executing items.

## 8. Validation
Validation returns explicit errors for missing scenes, sources, devices, inputs, outputs, graphics, replay clips, transition metadata, duration, and inactive sessions.

## 9. Session Integration
Each rundown has a sessionId and snapshot metadata appropriate for session snapshots.

## 10. ProductionGraph Integration
`attachRundownMetadataToGraph` maps active rundown state to graph metadata without changing ownership or storing media handles.

## 11. RuntimeEventBus Integration
Rundown events are published with metadata-only payloads and repeated publication protection.

## 12. Health and Metrics
Health reports invalid, blocked, failed, missing dependency, current item, recovery, and failure metadata. Metrics report item counts and available orchestration counters without fabricating durations.

## 13. Snapshots and Recovery
Snapshots are metadata-only. Recovery rejects stale snapshots and never restores buffers or Program output.

## 14. Audit History
Audit entries include ids, timestamps, actor, command, result, state changes, errors, and correlation IDs.

## 15. Test Results
Validation coverage added to media-plane validation for registration, duplicates, ordering, states, validation success/failure, cue/skip/hold/jump, history, duplicate take prevention, events, graph mapping, health, metrics, snapshots, stale recovery rejection, disposal, and no-media-handle safety.

## 16. Build Results
See final implementation response for command results.

## 17. Known Limitations
Durational metrics are reported as unavailable when no measured execution timings exist.

## 18. Deferred UI Work
No rundown UI, teleprompter, timeline redesign, scheduling UI, or collaborative editing was implemented.

## 19. Risk Assessment
Low integration risk: changes are isolated to metadata runtime and adapter surfaces.

## 20. Recommendation
Proceed to integration testing with real session metadata while retaining existing ProductionGraph authorization boundaries.
