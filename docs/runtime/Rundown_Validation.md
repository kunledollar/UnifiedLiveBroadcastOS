# Rundown Validation

Before readiness, validation checks scene, source, device, input, output, graphics asset, replay clip, transition metadata, durations, active session ownership, dependencies, and production-state eligibility. Errors are explicit and never silently repaired.

The validator accepts metadata fixtures for session, graph, devices, inputs, outputs, graphics assets, and replay clips. Missing dependencies emit stable codes such as `SCENE_MISSING`, `SOURCE_MISSING`, `DEVICE_MISSING`, `INPUT_MISSING`, `OUTPUT_MISSING`, `GRAPHICS_MISSING`, `REPLAY_MISSING`, `TRANSITION_INVALID`, and `INVALID_DURATION`.
