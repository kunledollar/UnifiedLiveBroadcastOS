# Device Registry

`DeviceRegistry` stores deterministic, serializable `DeviceMetadata` records. It suppresses duplicates using persistent id when present, otherwise a deterministic connection/type/id/display-name identity.

Required metadata includes device id, display name, device type, connection type, capabilities, supported/selected formats, sample rates, channel counts, frame rates, resolutions, color formats, transport, latency estimate, health, connection state, last-seen timestamps, firmware metadata when available, runtime adapter id, and optional ProductionGraph node id.

Unknown browser/native fields are represented as `unknown`, `unavailable`, omitted optional fields, or empty arrays. Runtime handles are rejected by metadata safety validation.
