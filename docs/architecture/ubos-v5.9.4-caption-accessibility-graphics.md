# UBOS v5.9.4 — Caption, Subtitle, and Accessibility Graphics Foundation

UBOS v5.9.4 adds the production-safe caption and accessibility graphics coordination layer. The implementation is metadata-only: it models caption tracks, subtitle tracks, caption regions, timed cues, speaker labels, non-speech descriptions, accessibility overlays, output-role publication, health, telemetry, watchdog incidents, and Source Graph metadata without rendering text or encoding captions.

## Scope

The `CaptionAccessibilityEngine` owns immutable caption tracks, caption cues, accessibility graphic metadata, lifecycle transitions, reading-speed evaluation, overflow-risk metadata, safe-area region metadata, output-role summaries, and deterministic snapshots.

The subsystem explicitly does not perform speech recognition, translation, font rendering, browser rendering, SVG/HTML/CSS execution, subtitle serialization, CEA/IMSC/WebVTT transport encoding, or GPU work.

## Processor Integration

`CaptionAccessibilityProcessor` runs once per authoritative `FrameTick` after the graphics, template, and broadcast graphics processors. It publishes the `caption-accessibility-graphics` output key into the existing processor output registry and uses the existing tick processor contract; it does not create a second media clock, timer loop, compositor, renderer, or scheduler.

## Production Safety

The engine enforces generation-protected updates, duplicate track/cue rejection, deterministic cue expiration from the Master Presentation Timeline tick, metadata redaction for unsafe claims or credentials, immutable snapshots, and health degradation when watchdog incidents occur.

## Output Roles

Caption metadata is isolated by Program, Preview, Clean Feed, AUX, ISO, Horizontal, Vertical, and Square roles. Source Graph publications list only cue, track, language, and output-role metadata.
