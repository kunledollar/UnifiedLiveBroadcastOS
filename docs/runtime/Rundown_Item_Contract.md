# Rundown Item Contract

Rundown items are deterministic, serializable metadata objects. They never contain runtime media handles, buffers, stream handles, GPU resources, FFmpeg handles, or live device objects.

## Supported item types

scene, camera, guest, media, browser, graphics, lower third, replay, audio cue, transition, recording start, recording stop, streaming start, streaming stop, macro, automation, break, countdown, hold, manual instruction, custom, unknown.

## Metadata fields

Each item supports: `itemId`, `rundownId`, `sessionId`, `title`, `description`, `itemType`, `order`, `durationEstimateMs`, `preRollDurationMs`, `postRollDurationMs`, `status`, `sourceReferences`, `sceneReference`, `graphicsReference`, `replayReference`, `audioReference`, `transitionMetadata`, `requiredDevices`, `requiredInputs`, `requiredOutputs`, `operatorNotes`, `approvalRequirements`, `executionMode`, `fallbackItemId`, `tags`, `createdAt`, `updatedAt`, `version`, and `metadata`.

## Execution modes

manual, operator-confirmed, timed, scheduled, triggered, automatic-safe, rehearsal-only.

Program-changing operations require authorized ProductionGraph commands. Automatic-safe mode does not bypass safety guards. Rehearsal-only mode must not affect live Program unless separately authorized.
