# UBOS v5.4.3 Blur and Sharpen Engine

UBOS v5.4.3 adds a production-safe, backend-neutral spatial filtering stage after keying and masking and before geometry, layer compositing, and scene compositing. The engine owns filtering requests, deterministic plans, synthetic execution, output metadata, cache entries, telemetry, watchdog identifiers, and invariants. It does not own mask generation, keying, placement, blending, composition, GPU allocation internals, audio, recording, streaming, replay, or UI.

## Architecture and Pipeline Order

The supported order is color conversion, color correction, keying, masking, blur/sharpen, geometry, layer compositor, and scene compositor. `BlurSharpenPipelineStage` declares itself as `BLUR_SHARPEN`, phase `TRANSFORM`, after `MASKING`, before `GEOMETRY` and `LAYER_COMPOSITOR`, pass-through capable, timestamp preserving, and source-identity preserving.

## Effect Modes

The parameter model names Gaussian blur, box blur, directional blur, motion blur, radial blur, zoom blur, background blur, masked blur, sharpen, unsharp mask, edge enhance, high-pass sharpen, bypass, and custom. The synthetic backend provides deterministic simulation for Gaussian, box, directional, background, masked, sharpen, unsharp mask, edge enhance, and pass-through. Motion, radial, zoom, high-pass, and custom are supported as metadata-boundary plans and explicitly warn that no real pixel processing is claimed.

## Parameters and Validation

`BlurSharpenParameters` is immutable at engine boundaries and includes enablement, mode, radius, sigma, strength, threshold, angle, horizontal/vertical radii, iteration count, sample count, quality, edge mode, alpha policy, mask reference, mask generation, inversion, blend amount, output mode, diagnostics, and sanitized metadata. Validation rejects NaN and infinity, rejects unbounded radius/sigma/strength/blend/sample/iteration values by default, normalizes finite angles observably, requires mask references for mask-aware modes, rejects stale mask generations, and rejects unsupported alpha or edge policies.

Parameter policies are `REJECT_OUT_OF_RANGE`, `CLAMP_TO_SUPPORTED_RANGE`, `WARN_AND_CLAMP`, and `BACKEND_DEFAULT`. The default is rejection. Any clamp or downgrade appears in warnings.

## Edge and Alpha Handling

Edge modes are transparent, clamp, mirror, repeat, opaque black, and backend default. Alpha policies are preserve, filter alpha, RGB only, premultiplied safe, unpremultiply/filter/repremultiply, reject alpha, and backend default. Plans return effective alpha and edge policy metadata. The synthetic backend does not mutate pixels or alpha and marks itself as synthetic-only.

## Mask Integration

The engine reuses v5.4.2 mask outputs by reference. A mask reference carries mask ID, source/stream relationship, generation, optional frame/storage identity, feathered status, opacity, and sanitized metadata. The engine validates stale mask generations and reports mask usage in Source Graph metadata without exposing pixels, frame handles, GPU objects, native handles, or mutable leases.

## Planning and Determinism

`BlurSharpenPlan` records input format, color metadata, alpha mode, mode, effective parameters, operation order, selected backend, pass-through eligibility, pixel processing requirements, output allocation requirements, temporary-surface requirements, mask requirement, pass count, sample estimates, temporary/output bytes, operation count, output format, output alpha mode, deterministic score, warnings, and safe metadata.

Backend selection sorts by deterministic score, pass count, temporary memory, and stable backend ID, so backend registration order does not affect selection. Plan IDs are derived from stable canonical JSON and exclude request ID to keep equal requests deterministic.

## Pass-Through

Pass-through is valid for disabled effects, `BYPASS`, zero-radius/zero-strength neutral effects, zero blend where applicable, no mask effect, and no output alpha change request. Pass-through preserves frame identity, storage identity, lease identity, timestamps, source identity, and reports `PASSED_THROUGH` without allocation.

## Backend Abstraction

`BlurSharpenBackend` exposes descriptor, capabilities, plan creation, execution, and shutdown. Backend types include GPU compute, GPU fragment, CPU SIMD, CPU reference, platform native, and synthetic. This implementation registers only `SyntheticBlurSharpenBackend`; it simulates plans, operation signatures, checksums, cancellation, timeout, GPU loss, allocation failure, stale completion boundaries, and exact temporary-release behavior without allocating large pixel buffers.

## Frame Memory and GPU Integration

Actual filtering allocates distinct output frames through `FrameMemoryManager` using `PROCESSING_OUTPUT`; temporary surfaces use `TEMPORARY` and `TICK_TRANSIENT`. Failures, cancellation, timeout, and GPU loss release output and temporary leases and never publish output. The implementation does not directly allocate GPU resources, access native GPU APIs, or mutate Frame Memory reference counts.

## Layer Compositor Boundary

Layer Compositor remains responsible for blending. Blur/sharpen exposes only filtered frame reference metadata, filter mode, effective radius/strength, mask summary, alpha policy, filter generation, and pass-through state.

## Plan Cache

The bounded cache key includes input format, color metadata, alpha mode, effective parameters, mask generation, quality tier, backend preference, device generation, and pipeline configuration generation. Backend unregister/register clears cache. Cache bounds are enforced by invariant checks.

## Cancellation, Failure, and Cleanup

Duplicate request IDs are rejected. Cancellation before planning or after backend execution returns `CANCELLED` and publishes no output. Timeout, GPU loss, allocation failure, stale generation, and backend failure return failed results and release owned leases.

## Telemetry, Watchdog, and Source Graph

Telemetry includes backend count, cache size, active requests, completed effects, pass-through, failures, cancellations, rejections, timeouts, mask failures, allocation failures, GPU loss, stale generation, temporary bytes, peak temporary bytes, blur/sharpen mode counts, multi-pass counts, fallback counts, plan/execution durations, current request IDs, last event, and health summary. Watchdog incident constants include stalls, backend failures, timeouts, invalid parameters, unsupported modes, invalid masks, temporary memory pressure, GPU resource loss, allocation failure, stale generation, cache invalidity, graph mismatch, and invariant failure.

## Security and Observability

Metadata is sanitized to avoid raw pixels, native handles, GPU handles, paths, URLs, credentials, and mutable leases. Synthetic execution never claims real pixel processing.

## Invariants and Validation

`assertInvariants()` verifies bounded cache behavior and shutdown cleanup. Validation covers lifecycle, duplicate backends, deterministic plans, cache behavior, pass-through, blur/sharpen modes, parameter bounds, edge modes, alpha policies, stale masks, output allocation, identity preservation, cancellation, timeout, GPU loss boundaries, pipeline integration, command handlers, Source Graph metadata, telemetry, snapshots, long-run planning, long-run synthetic operations, and shutdown idempotency.

## Performance and Limitations

The synthetic backend estimates samples and bytes and avoids large pixel buffers. It is suitable for deterministic certification, not real filtering. Native GPU/CPU implementations can be added behind the backend abstraction after approval. v5.4.4 should integrate color effects and LUT planning after this stage boundary remains stable.
