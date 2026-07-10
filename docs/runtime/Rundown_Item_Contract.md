# Rundown Item Contract

Items are deterministic, serializable metadata. Supported types: scene, camera, guest, media, browser, graphics, lower third, replay, audio cue, transition, recording start, recording stop, streaming start, streaming stop, macro, automation, break, countdown, hold, manual instruction, custom, unknown.

Required and optional fields include itemId, rundownId, sessionId, title, description, itemType, order, duration estimates, pre-roll/post-roll durations, status, source/scene/graphics/replay/audio references, transition metadata, required devices/inputs/outputs, notes, approvals, execution mode, fallback item, tags, timestamps, and version.

Runtime media handles, buffers, and stream references are forbidden.

```json
{
  "itemId": "item-open",
  "rundownId": "rd-1",
  "sessionId": "session-1",
  "title": "Open",
  "itemType": "scene",
  "order": 1,
  "status": "ready",
  "sceneReference": "scene-open",
  "executionMode": "operator-confirmed",
  "containsMediaHandles": false
}
```
