# Device Discovery

```mermaid
sequenceDiagram
  participant RC as RuntimeController
  participant DM as DeviceManager
  participant DDM as DeviceDiscoveryManager
  participant P as DiscoveryProvider
  participant B as RuntimeEventBus
  RC->>DM: initialize
  DM->>DDM: initialize providers
  RC->>DM: start
  DM->>DDM: scan/refresh
  DDM->>P: scan metadata
  P-->>DDM: DeviceMetadata[]
  DDM-->>DM: added/updated devices
  DM->>B: DeviceDiscovered metadata event
```

Providers are pluggable: browser media devices, screen capture, network sources, native desktop placeholder, capture-card placeholder, and PTZ placeholder. Browser discovery may use `mediaDevices.enumerateDevices()` in host integrations, but must not request camera or microphone access merely to populate the registry.

Provider unavailable states are explicit and do not claim native support.
