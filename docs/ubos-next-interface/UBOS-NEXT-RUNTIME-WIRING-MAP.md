# UBOS Next Runtime Wiring Map

| UI element | Metadata ID | Current | Future owner | Command | Safety | Loading / error |
|---|---|---|---|---|---|---|
| Director transition deck | `transition.take` | unwired | Production Graph | `transition.take` | live-impacting | armed / rejected |
| Audio channel strip | `audio.mute` | unwired | Audio service | `audio.mute` | live-impacting | applying / unavailable |
| Graphics queue | `graphics.take` | unwired | Graphics service | `graphics.take` | live-impacting | rendering / template invalid |
| Replay transport | `replay.take` | unwired | Replay service | `replay.take` | live-impacting | cued / source unavailable |
| Destination matrix | `distribution.reconnect` | unwired | Distribution service | reconnect | live-impacting | reconnecting / connection failed |
| Cross Follow | `cross-follow.prompt` | unwired | Social Fabric | prompt campaign | live-impacting | publishing / unavailable |

Permissions are declared in metadata but are not evaluated in this milestone.
