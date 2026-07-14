# UBOS v5.9.3 Broadcast Graphics Foundation

UBOS v5.9.3 adds a production-safe, metadata-only broadcast graphics package layer for lower thirds, titles, scorebugs, tickers, timers, status graphics, and information panels. The layer consumes template/data-binding metadata and publishes immutable package snapshots for compositor-facing systems without performing rasterization, browser rendering, SVG/CSS/Canvas rendering, image decoding, external API access, or live data fetching.

## Execution Model

```text
Graphics Template
        ↓
Template Binding
        ↓
Broadcast Graphics Package
        ↓
Lifecycle Validation
        ↓
Output Role Variant
        ↓
Graphics Metadata
        ↓
Layer Compositor
        ↓
Scene Compositor
        ↓
Program / Preview / AUX / Clean Feed
```

`BroadcastGraphicsProcessor` is ordered after the graphics foundation and template processors. It publishes `broadcast-graphics-foundation` snapshots containing active, prepared, visible, queued, timer, scorebug, ticker, lower-third, title, status, role-summary, health, telemetry, watchdog, and source graph metadata.

## Supported Package Families

- Lower thirds: single-line, multi-line, guest, host, reporter, location, topic, breaking, and sponsor metadata.
- Titles: opening, closing, segment, program, full-screen, and credits metadata.
- Scorebugs: teams, logo references, scores, periods, clocks, possession, fouls, timeouts, cards, and statistics metadata.
- Tickers: static, directional scrolling metadata, multi-row, headlines, financial, sports, election, weather, and social categories.
- Timers: count-up, count-down, match clock, stopwatch, wall clock, segment timer, and commercial timer metadata.
- Status graphics: LIVE, RECORDING, BREAKING NEWS, EXCLUSIVE, REPLAY, DELAYED, FILE VIDEO, and ARCHIVE metadata.

## Safety Invariants

- Snapshots are deeply frozen and deterministic.
- Generations must monotonically advance for updates and lifecycle changes.
- Output roles and aspect variants are isolated per package definition.
- Watchdog incidents detect duplicate IDs, stale generations, missing templates, timer regression, invalid score updates, and invariant failures.
- Metadata sanitization removes unsafe rendering, credential, native, payload, URL/path, script, and GPU-oriented keys.
- The implementation remains metadata-only and sets `realRendering: false` on publications and snapshots.

## Validation

`packages/media-plane/src/broadcast-graphics-foundation.validation.ts` covers lower-third, title, scorebug, timer, ticker, status graphic, binding, duplicate, generation, role-isolation, health, telemetry, watchdog, source graph, immutability, deterministic replay, long-run, leak, and shutdown scenarios.
