# Phase 9.7 Hardware Acceleration & Encoder Optimization Runtime

The Hardware Runtime adds production-grade hardware encoder management while preserving the UBOS metadata-only Production Graph contract. It models NVENC, Quick Sync, VideoToolbox, VAAPI, AMF, CUDA, OpenCL, Vulkan, Metal, DirectX, WebGPU, and software fallback as serializable metadata. Runtime GPU objects, encoder contexts, device handles, driver handles, textures, command queues, and process objects are never written to graph state, manifests, diagnostics, or replay events.

## Architecture

`HardwareRuntime` coordinates `DeviceManager`, `EncoderManager`, `DeviceScheduler`, `HardwareResourcePool`, `HardwareValidator`, `HardwareRecovery`, statistics, health, diagnostics, and a runtime supervisor registration. The runtime reuses GPU Runtime metadata, Encoder Runtime plans, Broadcast Orchestrator lifecycle semantics, failure records, backpressure budgets, and replay-safe event streams.

## Device lifecycle

1. Feature flags are read from `UBOS_ENABLE_HARDWARE_RUNTIME` and `NEXT_PUBLIC_UBOS_HARDWARE_RUNTIME`.
2. `DeviceManager.detect()` produces metadata devices. If flags are disabled, only the software encoder fallback is exposed.
3. Capabilities describe codecs, resolution, FPS, bitrate, memory, temperature, driver version, encoder count, and supported APIs.
4. Reservations are tracked in `HardwareResourcePool` as metadata-only budget records.
5. Diagnostics summarize utilization, memory, temperature, latency, dropped frames, health, and warnings.

## Scheduling

`DeviceScheduler` filters devices by availability, codec support, capability validity, encoder capacity, memory budget, bitrate, FPS, and priority. `EncoderManager` maps device APIs to encoder runtime backends such as `nvenc`, `quicksync`, `videotoolbox`, `amf`, `vaapi`, or `software`. If no safe hardware device is available, the runtime emits a replay-safe software fallback event.

## Capabilities

Capability snapshots are deterministic metadata and include supported APIs, codecs, max resolution, FPS limits, bitrate limits, memory limits, driver version, and encoder count. They are suitable for Control Room dashboards and deterministic replay, but they are not native device handles.

## Recovery

Hardware failures are converted into UBOS failure records and recovery plans. Driver failures plan driver restart, encoder failures plan encoder restart, retryable device failures plan retry, and unrecoverable failures fall back to software encoding without mutating the Production Graph.

## Replay

Replay stores hardware events, capability snapshots, scheduling decisions, reservations, recovery plans, diagnostics snapshots, and fallback decisions. Each replay event explicitly reports `containsRuntimeHandles: false`.

## Security

The validator rejects unknown devices, invalid capabilities, unsafe reservations, over-allocation, driver/API mismatches, and serialized runtime-handle markers such as native GPU objects or `runtimeOnly` placeholders. Hardware metadata must remain separate from the Production Graph.

## Control Room

The Control Room exposes a hardware dashboard when `NEXT_PUBLIC_UBOS_HARDWARE_RUNTIME=true`, including GPU count, encoder list, temperature, utilization, health, and a capability viewer. Disabled environments continue to show software fallback metadata.
