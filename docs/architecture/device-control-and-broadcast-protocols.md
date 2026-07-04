# Device Control & Broadcast Protocols

Phase 15 introduces a **metadata-first** architecture for discovering, managing, routing, monitoring, and controlling professional broadcast equipment. UBOS begins evolving from a software production suite into the foundation of a hardware-integrated Broadcast Operating System — without real hardware communication in this phase.

## Purpose

Device control should support professional equipment workflows (cameras, PTZ, audio consoles, video routers, NDI, SDI, HyperDeck, tally, GPIO, lighting, switchers) while remaining:

- Metadata-only — no runtime sockets, drivers, or SDK integrations
- Honest when hardware, telemetry, or plugins are unavailable
- Safe for future protocol and plugin execution integration
- Free of credentials, API keys, and runtime handles

## Broadcast Device Model

`BroadcastDevice` describes discovered or configured equipment:

| Field | Description |
|-------|-------------|
| `name`, `manufacturer`, `model` | Identity metadata |
| `category` | cameras, capture_cards, audio, ptz, recording, etc. |
| `deviceType` | camera, ptz_camera, switcher, hyperdeck, gpio, etc. |
| `protocol` | NDI, ATEM, VISCA over IP, RossTalk, OSC, etc. |
| `ipAddress`, `port` | Network metadata only (no credentials) |
| `status` | disconnected, discovering, connected, ready, unavailable, error, disabled |
| `health` | unknown, healthy, degraded, warning, critical, unavailable |
| `capabilities` | PTZ, record, stream, routing, tally, etc. |
| `firmware`, `lastSeen`, `notes` | Metadata only |

**Honest states:** No device detected, Not configured, Unavailable, Metadata only.

## Protocol Definition Model

`ProtocolDefinition` stores protocol metadata without communication:

Supported protocol types (metadata only): NDI, SDI, SRT, RTMP, RTSP, HTTP, REST, WebSocket, OSC, MIDI, GPIO, RS232, RS422, VISCA, VISCA over IP, ONVIF, ATEM, HyperDeck, RossTalk, MOS, NMOS, SNMP, TCP, UDP, Custom Plugin.

Each definition includes version, transport, authentication state (`none` | `configured` | `unavailable`), capabilities, and supported command names as metadata strings.

## Device Capability Model

`DeviceCapability` flags what a device could support:

- PTZ, record, stream, preview, replay, graphics, routing, audio, tally, intercom, lighting, macros, camera_shading

Capabilities are display metadata only — not enforced or executed.

## Routing Endpoint Model

`RoutingEndpoint` represents router inputs and outputs:

- `direction`: input | output
- `sourceId`, `destinationId`, `assignedRouteId`
- `status`: unassigned, assigned, ready, warning, unavailable

The routing matrix shows metadata assignments only. No real video routing occurs in Phase 15.

## Device Health Model

`DeviceHealth` (embedded in device metadata and health panel):

- Connection state, temperature metadata, firmware metadata
- Warnings, errors, diagnostics arrays (sanitized text)

When unavailable: Health telemetry unavailable, No live telemetry.

## Plugin System

`DevicePluginDefinition` lists future integrations:

Blackmagic, Ross, Vizrt, Sony, Canon, Panasonic, NewTek, BirdDog, Magewell, AJA, EVS, OBS, vMix, Wirecast, TriCaster, HyperDeck, Future Plugin.

Status: available, unavailable, coming_soon, disabled. No SDKs are loaded.

## Device Manifest

```typescript
{
  devices: BroadcastDevice[];
  protocols: ProtocolDefinition[];
  routingEndpoints: RoutingEndpoint[];
  plugins: DevicePluginDefinition[];
  containsRuntimeHandles: false;
}
```

## Validation Rules

Implemented in `packages/shared/src/broadcast-devices/validation.ts`:

- Reject runtime handle keys (socket, serial, driver, sdk, gpio, midi, etc.)
- Reject credentials in URLs and metadata (password, api_key, token patterns)
- Unique device and routing endpoint IDs
- Sanitized text (no unsafe HTML)
- Valid port range 0–65535
- `containsRuntimeHandles` must be false

## Control Room UI

Device workspace lives under `apps/web/app/control-room/devices/`:

| Component | Role |
|-----------|------|
| `DeviceManagerWorkspace` | Full operator workstation |
| `DeviceManager` / `DeviceBrowser` | Categorized equipment browser |
| `ProtocolPanel` | Protocol definition manager |
| `RoutingMatrix` | Source × destination routing grid |
| `DeviceInspector` | Selected device detail |
| `ConnectionPanel` | Network/connection metadata |
| `DeviceHealthPanel` | Health and diagnostics metadata |
| `PluginBrowser` | Future integration plugins |
| `DevicePanel` | Compact operations console panel |

## Integration Points

- **Workspace profile:** `device-operator` with `devices-focus` layout
- **Operations console:** Devices tab
- **Status bar:** Device health summary badge
- **Left navigation:** Devices nav item

Phase 15 does **not** modify Production Graph, switcher, streaming, graphics, media, replay, automation, WebRTC, or encoder runtimes.

## Runtime Limitations (Phase 15)

- No hardware discovery transport
- No PTZ, tally, GPIO, or shading control
- No NDI/SDI/serial/socket communication
- No plugin SDK loading
- No credential storage
- Enable/disable and route assignment update UI reducer metadata only

## Future Hardware Integration

Planned follow-on work:

1. Protocol adapters for ATEM, VISCA, RossTalk, NDI, NMOS
2. Secure credential vault outside Production Graph
3. Live device discovery and health telemetry
4. Plugin SDK sandbox with runtime isolation
5. Wire routing matrix to video router subsystems
6. Integrate with automation cue targets for device macros

Until hardware infrastructure is connected, all device UI surfaces honest metadata-only states.
