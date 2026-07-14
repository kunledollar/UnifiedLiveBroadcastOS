# Release Notes

## v5.9.0 — Graphics, Branding, Captions, and Multi-Format Output Platform

Release date: 2026-07-14

UBOS v5.9.0 introduces the certified production-safe graphics platform, including deterministic graphics and text metadata, template and data binding, broadcast graphics, captions and accessibility graphics, graphics animation coordination, branding and safe-area coordination, and multi-format output-role publication for Program, Preview, Clean Feed, AUX, ISO, horizontal, vertical, and square outputs.

### Certification status

- PASS: v5.9.8 Graphics Platform Certification.
- PASS: deterministic long-run certification using 100,000 authoritative FrameTicks and 10,000-cycle cross-subsystem simulations.
- PASS: output-role isolation, required-role atomicity, security redaction, deterministic replay, zero-leak shutdown, and zero-corruption metadata checks.

### Major capabilities

- Graphics/text definitions, layers, layout metadata, text style metadata, and font-reference metadata.
- Graphics templates, template instances, deterministic data binding, and immutable binding snapshots.
- Lower thirds, titles, full-screen graphics, tickers, scorebugs, timers, clocks, status graphics, captions, subtitles, and accessibility graphics.
- Graphics animation cueing, visibility transitions, replacement coordination, Motion Effects delegation, and Scene Transition delegation.
- Branding definitions, logos, watermarks, sponsor branding, safe areas, exclusion zones, protected regions, placement metadata, precedence, inheritance, and Clean Feed policy.
- Multi-format variants and output-role coordination for Program, Preview, Clean Feed, AUX, ISO, horizontal, vertical, square, portrait, cinematic, custom, and multiview metadata.

### Safety guarantees

- One authoritative FrameTick and Master Presentation Timeline.
- No duplicate graphics runtime loop, caption timer, animation timer, branding timer, or multi-format loop.
- No direct Program mutation by graphics subsystems.
- Immutable snapshots, generation-safe updates, redacted metadata, bounded fallback selection, and required-role atomic publication.

### Known limitations

UBOS v5.9.0 is a production-safe orchestration, metadata, lifecycle, validation, and delegation platform. Native rendering, font rasterization, text shaping, image decoding, browser rendering, HTML/CSS/SVG execution, responsive reflow, GPU graphics processing, real graphics animation rendering, real caption/subtitle transport encoding, speech recognition, translation, remote data integrations, sports/election/social platform integrations, AI-generated graphics, direct output encoding, and UI redesign remain future work.

### Migration notes

No package-version migration is required. The repository preserves the existing `1.0.0-rc.1` package version convention and records the platform release identity through explicit media-plane graphics platform release constants and release documentation.

### Next platform milestone

UBOS v5.10.1 — Production-Safe Automation, Rundown, and Show-Control Foundation.

## UBOS v4.12.0 — Platform Architecture Baseline

- Added the UBOS v4.12 platform freeze, baseline manifest, release notes, and final certification report.
- Preserved the existing package versioning convention (`1.0.0-rc.1`) and documented the platform release identity as UBOS v4.12.0.
- Classified remaining repository and build limitations as operator-environment checks before final branch/tag creation.

## UBOS v3.15 Phase 2

This engineering completion pass focuses on cleanup and hardening only. It does not redesign the UI, add broadcast features, or alter runtime media pipelines.

### Highlights

- Removed inactive legacy layout files after source-reference verification.
- Preserved Command Center behavior while eliminating a type dependency on legacy monitor deck code.
- Strengthened responsive validation for the requested width matrix.
- Documented readiness for v3.16 and known technical debt.

### Operator Impact

No workflow or runtime media behavior changes are intended. Program remains the dominant monitor, Workspace Manager remains the sole active layout owner, and CommandCenterShell remains the active Control Room shell.
