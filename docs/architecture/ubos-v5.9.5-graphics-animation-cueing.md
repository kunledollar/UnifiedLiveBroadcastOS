# UBOS v5.9.5 — Graphics Animation, Cueing, and Transition Coordination

UBOS v5.9.5 adds a deterministic metadata-only coordination layer for graphics animation, cue stacks, and transition timing. It models animation definitions, cue readiness, cue-stack advancement, transition coordination, output-role publication, health, telemetry, watchdog incidents, and Source Graph exposure without rendering frames, running GPU work, storing native handles, decoding assets, or executing CSS/SVG/Canvas animation.

## Runtime ownership

`GraphicsAnimationCueingEngine` owns graphics animation metadata after graphics packages, templates, and captions have already been defined. The engine stores immutable animation snapshots and enforces generation checks for updates, cueing, starts, completion, cancellation, and clear operations.

`GraphicsAnimationCueingProcessor` runs in the graphics phase after the caption, broadcast graphics, template, and graphics foundation processors. It publishes borrowed immutable snapshots for downstream orchestration while preserving metadata-only behavior.

## Supported metadata

- Animation kinds: fade, slide, wipe, scale, stinger, ticker roll, scorebug update, caption reveal, and custom metadata.
- Lifecycle states: created, cued, ready, running, held, completed, cancelled, and cleared.
- Cue stacks: ordered cue identifiers, current index, armed state, and output role.
- Transition coordination: from/to target identifiers, animation identifiers, output role, and coordination state.
- Output roles: Program, Preview, Clean Feed, AUX, ISO, horizontal, vertical, and square variants.

## Safety boundaries

The implementation rejects duplicate animation identifiers, duplicate cue stacks, stale generations, invalid timing, invalid lifecycle starts, and missing targets. Safe metadata filtering removes secret-bearing, credential-bearing, URL/path, payload, native, GPU, raster, canvas, shader, HTML, CSS, SVG, JavaScript, and SQL-like keys before publication.

The runtime explicitly reports `metadataOnly: true` and `realRendering: false`; it does not render, animate pixels, allocate GPU resources, decode media, evaluate style/script content, or coordinate live devices.

## Validation

`pnpm --filter @ubos/media-plane validate:v5.9.5` verifies animation creation, safe metadata filtering, lifecycle changes, cue-stack advancement, transition coordination, stale generation rejection, invalid lifecycle rejection, immutable snapshots, Source Graph determinism, processor readiness, and a 100,000-tick stability pass.
