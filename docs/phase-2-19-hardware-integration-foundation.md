# UBOS 2.0 Phase 2.19 – Hardware Integration Foundation

Phase 2.19 introduces a backend-independent hardware integration subsystem for professional broadcast devices and control surfaces. The foundation models devices, vendors, capabilities, lifecycle, health, heartbeat, runtime events, and UBOS runtime bindings without opening USB/HID devices, loading vendor SDKs, or implementing vendor protocols.

## Scope

The subsystem supports these categories:

- Production switchers
- PTZ cameras
- Capture devices
- Audio interfaces
- Control surfaces

It models these vendors as normalized metadata identifiers:

- Blackmagic ATEM
- Ross
- Vizrt
- Sony
- Panasonic
- PTZOptics
- BirdDog
- Stream Deck
- X-Keys

## Runtime Model

- `HardwareManager` owns adapter registration, discovery, connection lifecycle, heartbeat tracking, failures, command planning events, snapshots, and runtime bindings.
- `HardwareDevice` stores vendor, category, model, firmware version, capabilities, connection status, health, heartbeat, metadata, and explicit `containsDeviceHandles: false` markers.
- `HardwareAdapter` is an interface for future backends. The included `MetadataHardwareAdapter` is intentionally metadata-only.
- `DeviceCapabilities` describes inputs, outputs, tally, PTZ, audio metering, macro, button, encoder, capture, and protocol support without tying UBOS to a hardware SDK.

## Lifecycle

Devices move through these states:

1. `discovered`
2. `connecting`
3. `connected`
4. `disconnected`
5. `failed`

Each transition emits a hardware runtime event and updates the device's connection and health metadata.

## Runtime Bindings

The hardware subsystem can record backend-independent identities for:

- `ProductionSwitcher`
- `SceneCompositor`
- Remote production manager metadata
- Transport manager metadata
- `StreamingPipeline`
- `RecordingPipeline`

Bindings are represented as snapshot metadata only. Hardware control commands are planned as events and do not execute real device I/O.

## Demo Workflow

`createHardwareIntegrationDemo()` demonstrates a metadata-only workflow:

1. Create a `HardwareManager`.
2. Register a `MetadataHardwareAdapter`.
3. Discover demo hardware devices.
4. Connect a Blackmagic ATEM device model.
5. Record a heartbeat.
6. Plan a backend-independent command.
7. Disconnect the device.

## Explicit Non-Goals

- No real USB or HID access.
- No vendor SDK integration.
- No PTZ movement/control implementation.
- No ATEM protocol implementation.
- No firmware update workflow.
