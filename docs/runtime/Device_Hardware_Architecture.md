# UBOS v4.3 Device & Hardware Architecture

```mermaid
graph TD
  RuntimeController --> DeviceManager
  DeviceManager --> DeviceRegistry
  DeviceManager --> DeviceDiscoveryManager
  DeviceManager --> DeviceConnectionManager
  DeviceManager --> DeviceProfileManager
  DeviceManager --> DeviceCapabilityResolver
  DeviceManager --> DeviceHealthMonitor
  DeviceManager --> DeviceEventAdapter
  DeviceManager --> DeviceRuntimeAdapter
  DeviceEventAdapter --> RuntimeEventBus
  DeviceHealthMonitor --> HealthManager
  DeviceRuntimeAdapter --> ProductionGraphMetadata[ProductionGraph metadata only]
  MediaPlane[Media Plane] -. consumes selected format metadata .-> DeviceRuntimeAdapter
```

UBOS v4.3 adds a metadata-only hardware abstraction layer. DeviceManager remains the sole lifecycle coordinator; the Media Plane owns processing; ProductionGraph receives serializable device metadata only.

No runtime handles may be persisted or serialized: MediaStream, MediaStreamTrack, USBDevice, HIDDevice, SerialPort, RTCPeerConnection, AudioContext, native handles, FFmpeg process handles, sockets, or DOM nodes.
