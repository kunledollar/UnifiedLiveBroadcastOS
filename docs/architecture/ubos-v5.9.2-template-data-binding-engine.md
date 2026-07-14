# UBOS v5.9.2 Template, Data Binding, and Dynamic Graphics Engine

UBOS v5.9.2 adds a metadata-only dynamic graphics layer above the v5.9.1 graphics foundation. It models graphics templates, template instances, typed fields, deterministic bindings, immutable data snapshots, output-role publications, health, telemetry, watchdog incidents, and Source Graph publication without rendering HTML, CSS, SVG, Canvas, GPU resources, fonts, images, remote data, databases, or native handles.

The `GraphicsTemplateEngine` owns template registration, generation-safe instance creation, deterministic variable resolution, missing-field tracking, and immutable publication snapshots. Template values are resolved from explicit instance values first, then field defaults. Required fields without values are reported as missing variables and recorded in health metadata rather than triggering external data fetches.

The `GraphicsTemplateProcessor` integrates with the TickProcessor framework after the graphics foundation processor. Each tick evaluates known instances, publishes a borrowed `graphics-template-engine` snapshot when an output registry is available, and preserves the metadata-only contract for downstream Layer Compositor, Scene Compositor, Program, Preview, Clean Feed, AUX, and later output-role coordination work.

## Production-safety invariants

- Templates and publications are immutable snapshots.
- Template updates must advance generation numbers.
- Bindings must reference declared fields and existing graphics elements.
- Output roles are isolated by instance metadata.
- Secret-like, renderer-like, native, HTTP, SQL, payload, and GPU metadata keys are redacted.
- Data snapshots declare `realDataFetch: false`.
- Publications declare `realRendering: false`.

## Validation

`pnpm --filter @ubos/media-plane validate:v5.9.2` verifies template immutability, stale generation rejection, binding validation, missing variable detection, deterministic defaults, output-role isolation, processor readiness, Source Graph metadata, and a 100,000-tick stability pass.
