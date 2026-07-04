# Broadcast Distribution & Output Routing

Phase 14 introduces a **metadata-first** broadcast distribution and output routing foundation for UBOS. This layer prepares professional multi-platform publishing, stream profiles, routing matrices, and output health monitoring without storing secrets or runtime handles in the Production Graph.

## Purpose

UBOS distribution should support newsroom and live production output workflows (YouTube, Facebook, TikTok, Twitch, custom RTMP/SRT, recording, clean feed, confidence output) while remaining:

- Metadata-only in this phase
- Honest when streaming runtime, encoder, or telemetry is unavailable
- Safe for future real publishing integration
- Redacted for all sensitive configuration

## Destination Model

`BroadcastDestination` describes a configured output:

| Field | Description |
|-------|-------------|
| `platform` | YouTube, Facebook, Twitch, TikTok, Instagram, LinkedIn, Kick, X, custom RTMP, SRT, RIST, NDI, local recording, cloud archive, clean feed, aux, confidence |
| `status` | disconnected, connected, ready, unavailable, error, disabled |
| `outputFormat` | horizontal_16_9, vertical_9_16, square_1_1, clean, aux, confidence |
| `streamProfileId` | Reference to `StreamProfile` |
| `routeId` | Optional assigned route |
| `redactedConfig` | Endpoint/auth configured flags and redacted endpoint only |
| `health` | Output health status metadata |

**Honest states:** No destinations configured, Streaming runtime unavailable, Destination disconnected, Stream key not configured, Output route missing.

## Stream Profile Model

`StreamProfile` stores encoder and transport metadata:

- `protocol`: rtmp, rtmps, srt, rist, ndi, hls, recording
- `resolution`, `fps`, `bitrateKbps`, `keyframeInterval`
- `encoder`, `audioBitrateKbps`
- `status`: draft, ready, unavailable, disabled

No encoder handles or process references are stored.

## Output Route Model

`OutputRoute` maps a source view to a destination:

| Source view | Typical use |
|-------------|-------------|
| `program` | Main horizontal program feed |
| `vertical` | TikTok / Instagram vertical |
| `horizontal` | Dedicated horizontal bus |
| `clean` | Recording / aux |
| `aux` | Secondary output |
| `confidence` | Guest / multiview confidence |
| `multiview` | Gallery output |

Route status: unassigned, assigned, ready, warning, error. Warnings include output format mismatch and missing route metadata.

## Output Health Model

`OutputHealth` surfaces safe telemetry metadata when available:

- `bitrateKbps`, `latencyMs`, `droppedFrames`, `reconnectCount`
- `lastError`, `status`

When telemetry is unavailable the UI shows: Health telemetry unavailable, Stream not active, Destination disconnected.

## Distribution Manifest

```typescript
{
  destinations: BroadcastDestination[];
  streamProfiles: StreamProfile[];
  outputRoutes: OutputRoute[];
  containsRuntimeHandles: false;
  containsSecrets: false;
}
```

Created via `createDistributionManifest()` with validation applied.

## Security & Redaction Rules

Absolutely **not** stored or displayed:

- Stream keys
- OAuth tokens
- Passwords
- Signed URLs
- Private destination secrets

`RedactedDestinationConfig` only exposes:

- `streamKeyConfigured: boolean`
- `endpointConfigured: boolean`
- `authConfigured: boolean`
- `redactedEndpoint?: string` (e.g. `rtmps://***.live.example.com/app`)

Validation rejects secret patterns in URLs and metadata keys matching stream, token, password, encoder, ffmpeg, etc.

## Vertical / Horizontal / Platform Mapping

| Platform | Typical format |
|----------|----------------|
| YouTube, Facebook, Twitch, LinkedIn | horizontal_16_9 |
| TikTok | vertical_9_16 |
| Instagram | vertical_9_16 or square_1_1 |
| Custom RTMP / SRT | profile-dependent |
| Local recording / cloud archive | clean |
| Confidence output | confidence |

`PlatformPreviewPanel` uses existing monitor frame aspect ratios (16:9, 9:16, 1:1) with metadata-only preview labels.

## Control Room UI

Distribution workspace lives under `apps/web/app/control-room/distribution/`:

| Component | Role |
|-----------|------|
| `DistributionWorkspace` | Full operator workstation |
| `DestinationManager` / `DestinationRow` | Destination list |
| `StreamProfilePanel` | Stream profile metadata |
| `OutputRoutingMatrix` | Source × destination routing grid |
| `OutputHealthPanel` | Per-destination health metadata |
| `PlatformPreviewPanel` | Platform format previews |
| `RecordingDestinationsPanel` | Local/cloud/archive metadata |
| `DistributionInspector` | Selected destination detail |
| `DistributionPanel` | Compact panel for operations Outputs tab |

## Integration Points

- **Workspace profile:** `distribution-operator` with `distribution-focus` layout
- **Operations console:** Outputs tab via `DistributionPanel`
- **Status bar:** Output health summary badge

Phase 14 does **not** modify Production Graph guarantees, streaming runtime internals, encoder runtime, WebRTC, or recording runtime.

## Runtime Limitations (Phase 14)

- No real platform publishing or OAuth
- No stream key entry or storage
- No live bitrate/latency telemetry unless future runtime provides it
- No backend API or database schema changes
- Enable/disable and route assignment update UI reducer metadata only

## Future Real Streaming Integration

Planned follow-on work:

1. Wire destinations to existing streaming runtime adapters with redacted credential vault
2. Connect output health to live encoder and CDN telemetry
3. Persist destination and profile libraries
4. Integrate routing matrix with production graph destination nodes
5. Add automation cue targets for output destinations
6. Platform-specific auth flows with secure secret storage outside the graph

Until streaming infrastructure is connected, all distribution UI surfaces honest metadata-only states.
